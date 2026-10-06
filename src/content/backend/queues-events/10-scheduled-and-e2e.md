@part X | Scheduled work and the order end to end | We handle work triggered by the clock rather than by a request, then follow order 124's events through every consumer. A job that runs on twenty instances runs twenty times unless someone decides otherwise. We will cover duplicate cron runs and the ways to run a job once, missed runs and catch-up, the order's journey after the commit, and three failure evenings. | where:10

## 30. Running a scheduled job once

Every night at 2 a.m. Wren sends each restaurant a sales report. The first version put a line in the application's crontab, `0 2 * * * send_daily_report`. **Cron**, the Unix scheduler that dates from Version 7 Unix in 1979, runs a command at the times its five fields describe, minute, hour, day of month, month and day of week. It worked perfectly on the one server Wren had. Then Wren scaled to 20 instances, all built from the same image, all with the same crontab, and every restaurant received 20 reports at 2 a.m.

@fig be_cron_duplicates | Twenty identical instances, twenty identical schedules, twenty reports per restaurant.

This is the classic interview question, and there are three good answers. The first is a **single scheduler**. Run scheduled jobs in exactly one place, a Kubernetes CronJob, a cloud scheduler such as EventBridge Scheduler, or a dedicated scheduler service, which enqueues a job message that ordinary workers process. The fleet of API instances runs no schedules at all. This is the simplest and most common fix, and Kubernetes CronJobs, Unit XV, offer `concurrencyPolicy: Forbid` to stop a run starting while the last is still going.

The second is **leader election**. All instances run the scheduler code, but only the one holding a lease acts. The lease is a row or key with an expiry, held in PostgreSQL, etcd, ZooKeeper, Consul or a Kubernetes Lease object, and the holder renews it every 10 s for a lease of 30 s. If the leader dies, the lease expires and another instance takes over. Unit IX discusses why leases need fencing tokens to be safe when a paused leader wakes up.

@fig be_cron_solutions | A single scheduler, a lease that decides who runs, or a unique row that only one instance can insert.

The third is to **claim each run**. Every instance attempts the job, but first inserts a row into `job_runs` with a unique constraint on the job name and run date, `INSERT ... ON CONFLICT DO NOTHING`. Exactly one insert succeeds, and only that instance runs the job. This uses the database as the arbiter, the same unique-constraint idea as Unit VI's idempotency keys, and also leaves a record of every run with its status.

Whichever mechanism decides who runs, the job itself should be idempotent. Schedulers deliver at-least-once like any other system. A CronJob can start twice during a node failure, a lease can be held by two instances for a moment during a long pause, and an operator can rerun a job by hand. A sales report job that checks "already sent for restaurant 9 for 2026-10-06" before sending makes all of those harmless.

## 31. Missed runs, catch-up and time zones

Schedulers miss runs. The scheduler was down for a deploy, the cluster was being upgraded, or the leader died and the new one took a minute to take over. Wren's scheduler was down from 01:00 to 05:30 one night, and four hourly runs, at 02:00, 03:00, 04:00 and 05:00, never happened. What should happen when it comes back depends on the job, and the decision must be made per job in advance.

@fig be_cron_catchup | Four missed hourly runs. Some jobs must run all four, some only once, and some not at all.

Some jobs must **catch up every run**. An hourly settlement with a payment provider that covers one hour's transactions each time must run for every missed hour, in order. Some should **run once** for the latest period. A daily report only needs to run once with the latest data. Some should **skip**. A reminder to restaurants to open at 06:00 that is now an hour late is pointless. Kubernetes CronJobs expose part of this with `startingDeadlineSeconds`, beyond which a missed run is skipped, and workflow engines such as Temporal and Airflow have explicit catch-up and backfill settings.

Designing jobs around a **time window** rather than "now" makes catch-up easy. The settlement job takes a start and end time as parameters, rather than computing "the last hour" from the clock when it runs. A missed run is then simply the same job with an older window, and a backfill is a loop over windows.

Time zones and daylight saving cause the rest of the trouble. A job scheduled at 02:30 local time in a region with daylight saving does not run on the night the clocks jump from 02:00 to 03:00, and runs twice on the night they fall back. India has no daylight saving, but Wren's restaurants in London do. Wren schedules every job in UTC and converts to local time inside the job when a report needs local days, so the scheduler's clock never jumps. Kubernetes CronJobs accept a `timeZone` field since version 1.27, which helps when local scheduling is truly needed.

Long-running jobs need protection from overlapping themselves. If the hourly job sometimes takes 70 minutes, the next run starts while the last is still going. The scheduler should forbid concurrency, or the job should take a lock for its duration, and its monitoring should alert when a run takes longer than its interval.

## 32. Order 124 after the commit

Back to the order, with every piece of the unit in place. `POST /orders` for user 42 inserts order 124 and an outbox row for `OrderPlaced`, with event id `evt-9f3`, key `order-124` and version 1, in one transaction, and returns 201 in about 25 ms. The customer's part is over.

Within milliseconds, Debezium reads the insert from the WAL and publishes the event to `order-events`. The key hashes to partition 11, so every later event for order 124 lands there too, in order. The producer uses `acks=all`, and with `min.insync.replicas` 2 the record is on two brokers before the relay counts it as published.

@fig be_ev_e2e | One event, four consumer groups, each failing, retrying and scaling independently.

Four consumer groups read it. The **kitchen** group upserts the ticket on restaurant 9's board, keyed by order id, so a redelivery overwrites rather than duplicates, and the board shows the order about 120 ms after the commit. The **receipt** group inserts `evt-9f3` into its inbox and enqueues an SQS job to render the PDF and send the email, passing the event id to the email provider as an idempotency key. The **analytics** group appends the event to the warehouse in batches. The **search** group updates restaurant 9's order count, used for ranking.

Meanwhile the order saga orchestrator, triggered by the same event, sends a capture command to the payment service. Its reply produces `PaymentCaptured` on the same partition, which the kitchen consumes to move the ticket from "awaiting payment" to "cook". If the kitchen consumer is redeployed in the middle, a cooperative rebalance moves its partitions without stopping the other consumers, and it resumes from its last committed offset, reprocessing a few records harmlessly.

None of these consumers knows about the others. The order service knows none of them. Each has its own retries, dead-letter destination, lag alert and scaling, and each can be replayed from Kafka's 7 days of history if it gets something wrong.

## 33. Three bad evenings, and the unit on one page

On the first evening, the analytics consumer falls 6 hours behind because of a slow warehouse, as Part VII traced. Nothing customer-facing breaks, because analytics is its own consumer group. The time-lag alert fires after an hour. The team fixes the warehouse, scales the group to 12 consumers, one per partition, and it catches up in about 83 minutes, well inside the 7-day retention.

On the second evening, a kitchen API slowdown means kitchen jobs arrive at 50 per second and complete at 40. Queue age crosses 30 s and the autoscaler adds workers, but the kitchen API is the bottleneck, so more workers would only make it worse. The team caps concurrency at the API's limit, the ticket queue stays bounded by sending new-order tickets ahead of status updates, and one malformed ticket from a buggy restaurant integration lands in the dead-letter queue after 5 attempts instead of blocking everything.

@fig be_ev_failures | Each failure is contained by a mechanism from the unit, and none of them reached the order request.

On the third evening, a Kafka broker's disk fails. The partitions it led elect new leaders from their ISRs within seconds. Producers with `acks=all` see a few retries and no errors. Consumers reconnect to the new leaders. Nothing is lost, because every acknowledged record was on at least two brokers.

@fig be_ev_components | Queues for jobs, Kafka for facts, outbox and inbox for reliability, events and sagas for design.

The unit's ideas fit together around one assumption. Every message may arrive late, twice, or out of order, and every consumer must be correct anyway. Queues move work out of the request and retry it. Delivery is at-least-once, and idempotency makes it effectively once. Kafka keeps an ordered, replicated, replayable log. The outbox and inbox make database changes and messages agree. Sagas and compensations stretch a business process across services, and schedulers decide who runs the nightly job. Unit IX turns from messages between processes to concurrency inside them.

:::story Picture this
A restaurant's ticket system on a busy night. Orders are written once and clipped to the rail, and the grill, the fryer and the dessert station each take what they need at their own speed. A ticket written in smudged ink goes to the manager's tray instead of being re-read by every cook all night. When the grill cook goes on break, the tickets wait for the next cook, and when a cook reads a ticket twice, they check the order number against the tray before cooking it again.
:::

:::warn Watch out
Scheduled jobs that run inside API instances compete with user traffic for CPU, memory and database connections, and their timing correlates across the fleet. Move them to a dedicated scheduler and worker pool with their own connection budget from Unit VI.
:::

:::interview Interview lens
**"You have 20 backend instances. How do you ensure a daily job executes only once?"** Take scheduling out of the instances. Use a single scheduler such as a Kubernetes CronJob with concurrency forbidden, or a cloud scheduler, that enqueues one job for the workers. If the instances must schedule, either elect a leader with a renewable lease or have each instance try to insert a unique row for the job and date, and only the one that succeeds runs it. Make the job itself idempotent and window-based, decide how missed runs catch up, schedule in UTC, and alert on runs that fail or overlap.
:::

:::key In one breath
Cron on 20 identical instances runs every job 20 times, and the fixes are a single scheduler such as a CronJob, a leader holding a renewable lease, or a unique run row only one instance can insert, with the job itself idempotent. Missed runs need a per-job catch-up rule, all, once or skip, jobs should take explicit time windows, and schedules belong in UTC. Order 124's commit sends one outbox event through Debezium to partition 11, where kitchen, receipt, analytics and search groups each process it idempotently and fail independently, and the unit's mechanisms contain lag, slow downstreams and broker failures without touching the order request.
:::

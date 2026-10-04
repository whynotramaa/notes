@part VII | Transactional outbox and complete flow | The last gap is at the very start, where a service must both save its own state and publish a message. Two separate writes can disagree after a crash, and no amount of consumer care repairs a message that was never sent. We will close that gap with the transactional outbox, then trace one clip job through every component and crash window built in this unit. | where:7

## 29. The dual-write problem

The upload API must do two things: insert job 812 into the database and publish a transcode message. Write the row then publish, and a crash between them leaves a job stuck in `queued` with no message to start it. Publish then write the row, and a crash between them sends a message for a job that does not exist, or the database transaction rolls back after the message is already out. Either order is wrong some of the time.

This is the **dual-write problem**: updating two independent systems without a transaction spanning both. It is not solved by retries, because a crashed process has no memory of what it was doing. It is not solved by publishing inside the open database transaction either, since the publish can succeed and the commit can still fail, and a slow broker now holds a database transaction open.

The tempting fix is a distributed transaction such as two-phase commit across the database and the broker. Most brokers do not support it, it couples their availability, and it adds a coordinator that can block both. The practical answer is to reduce two writes to one.

@fig sd_q_dual_write | Both orders of the two writes have a crash window. A job without a message stalls; a message without a committed job points at nothing.

The same problem appears everywhere a service changes state and announces it: order placed and `OrderPlaced` event, balance updated and notification sent, user created and welcome email queued. Recognize it in an interview by the word "and" between a database write and a publish.

:::warn Watch out
A `try/catch` around the publish that rolls back the database on failure does not fix dual writes. A publish that times out may have succeeded, and a process that crashes runs no catch block at all. Only a single atomic write removes the window.
:::

## 30. The transactional outbox

Put the message in the database. A **transactional outbox** is a table in the service's own database where the service inserts outgoing messages in the same transaction as its state change. Either both the job row and the outbox row commit, or neither does. A separate **relay** process reads committed outbox rows and publishes them to the broker, then marks them sent.

The relay is at-least-once by construction. It publishes, waits for the publisher confirm, then marks the row. A crash after the confirm and before the mark publishes the row again on restart. That is acceptable because consumers are idempotent (Section 19) and the outbox row carries a stable message id that they deduplicate on.

There are two ways to run the relay. A polling relay queries `SELECT ... FROM outbox WHERE sent_at IS NULL ORDER BY id LIMIT 100` every 500 milliseconds. At most 100 rows per poll and 2 polls per second, it publishes up to 200 messages per second, adds up to half a second of latency, and needs `FOR UPDATE SKIP LOCKED` if several relays run. A log-tailing relay uses change data capture: it reads the database's write-ahead log, as Debezium does for Postgres and MySQL, and publishes each committed outbox insert with no polling queries and lower latency, at the cost of running CDC infrastructure.

@fig sd_q_outbox | The outbox. The business row and the message row share one commit; the relay publishes afterwards and can publish twice after a lost confirmation. Retained rows are eventually published if the relay keeps retrying and the broker recovers.

Outbox rows must be cleaned up, either deleted after publishing or partitioned by day and dropped. Ordering is preserved per aggregate only if relay workers coordinate publication order for that aggregate and use its id as the partition key. Selecting rows in id order alone does not prevent concurrent workers from publishing them out of order. The **inbox** pattern is the mirror image on the consumer side: store received message ids in the consumer's database with the effect, which is the deduplication table from Section 19 under another name.

:::interview Interview lens
**"How do you reliably publish an event when you update the database?"** I avoid the dual write by inserting the event into an outbox table in the same transaction as the state change. A relay, either polling with SKIP LOCKED or tailing the WAL with something like Debezium, publishes committed outbox rows and marks them sent. The relay can publish duplicates after a crash, so every event has a stable id and consumers deduplicate. The result is that an event exists if and only if the state change committed.
:::

## 31. Complete clip-processing flow

Here is job 812 end to end, with each component built in this unit and the crash window at each step.

The phone uploads with idempotency key `k-77`. The API stores the object, then in one transaction inserts upload metadata, job 812 with status `queued`, and outbox message `m-812` with type `TranscodeClip`, and returns `202 Accepted` with `/jobs/812`. If the API crashes before commit, nothing exists and the phone retries with `k-77`. If it crashes after commit but before replying, the retry finds `k-77` and returns job 812 again.

The relay reads `m-812`, publishes it to the transcode queue, gets a confirm, and marks it sent. A crash before marking means `m-812` is published twice. A worker receives it with a 120-second visibility timeout and a heartbeat every 30 seconds, sets job 812 to `running`, transcodes for 30 seconds, and writes three renditions to deterministic keys. Then, in one transaction, it inserts `m-812` into its processed table and sets the job to `succeeded`. Finally it acks. A crash before that transaction means redelivery and a full repeat that overwrites identical files. A crash after it means redelivery, a unique-key hit, and an immediate ack.

The job's completion is itself an event, `ClipTranscoded`, written to the worker's outbox in the same transaction and published to the score stream's sibling topic, where the notification service and the gateway pick it up. The phone, polling or pushed, sees `succeeded` with rendition links.

@fig sd_q_full_trace | Job 812 across the API, outbox, relay, queue, worker and job table. Orange marks the effect and identity committed together; retries bridge uncertain delivery boundaries.

Count the messages at Heron's peak of 6 uploads per second: 6 outbox rows, 6 transcode deliveries plus about 0.006 duplicates from a 1-in-1,000 ack loss, 6 completion events, and $6\times3=18$ completion deliveries if three subscriptions read them. The worker pool runs at 90% utilization and the backlog alert fires at an oldest-message age of 3 minutes.

:::story Picture this
A restaurant ticket rail. The waiter writes the order on a ticket and clips it to the rail in one motion, so an order cannot exist without its ticket. The cook takes tickets in turn and marks the dish done on the same ticket. If a ticket is cooked twice because it fell and was re-clipped, the expediter sees table 12 already served and throws the duplicate away.
:::

## 32. Responsibilities of each component

A design is easier to defend when every box has one job and one recovery story. The table lists them for Heron's asynchronous path.

| Component | Its one job | What fails without it | Recovery story |
|---|---|---|---|
| Job row | durable truth about progress | clients cannot learn outcomes | forward-only status |
| Idempotency key on submit | one job per user intent | lost reply creates a second job | return existing job |
| Outbox and relay | publish iff state committed | stuck jobs or ghost messages | relay republishes |
| Work queue | hold commands for competing workers | API waits 30 seconds per upload | redelivery after lease |
| Visibility timeout and heartbeat | reclaim work from dead workers | jobs lost or duplicated in flight | lease expiry |
| Deduplication record | make redelivery harmless | double effects from duplicates | unique key skip |
| Retry tiers and DLQ | contain failing messages | poison blocks or silent drops | redrive after fix |
| Lag alert and backpressure | bound waiting | unbounded delay under overload | scale or reject early |

@fig sd_q_components | Every box with its one job. Orange marks the worker and inbox that absorb duplicates created by uncertain sends and acknowledgements.

Two components are often missing in real designs. The idempotency key on submission, because teams think about duplicates only on the consumer side. And the DLQ owner, because a dead-letter queue is created on day one and first read months later. If an interviewer asks what you would check first in an inherited system, these are good answers.

:::note Where this goes next
Kafka, the next unit, implements several of these components inside the broker: idempotent producers, transactions over offsets and output, retention-based replay and compaction. The contracts in this unit still apply; Kafka moves some of them across the boundary.
:::

## 33. Message queue design in interviews

Interviewers raise queues in three ways. They ask a design question where a slow step appears, such as video processing, notifications or report generation. They ask a follow-up on reliability: "what if the worker crashes?". Or they ask directly about semantics: "is this exactly-once?". A strong answer has the same skeleton each time.

First, justify the queue with numbers: the slow step's duration, the arrival rate and the in-flight count it would create inside requests, here 180 open requests reduced to 0.9. Second, name the topology from the message kind: a work queue for commands, a stream for events with several readers or a need for replay. Third, state the delivery semantics and the idempotence mechanism: at-least-once, a stable message id, and a deduplication record committed with the effect. Fourth, close the producer gap with an outbox. Fifth, handle failure: bounded retries with backoff, a DLQ with an owner. Sixth, size it: service rate, utilization, drain time after a burst, lag alert in time and backpressure at the edge.

Avoid three common weak answers. "Kafka guarantees exactly-once" without naming the boundary. "We retry until it works" without classifying failures or bounding attempts. And "the queue absorbs the load" without noticing that sustained overload grows the queue forever.

@fig sd_q_interview | The six-step answer skeleton, from justification to sizing, with the number each step should produce.

A good closing line ties the design back to the user: the client receives a fast, honest `202`, can always find its job, sees each clip transcoded once in effect, and is told to wait or retry rather than silently left waiting when the system is overloaded.

:::key In one breath
Writing a database row and publishing a message are two writes that crash windows can split, so the transactional outbox commits the message with the state and a relay publishes it at least once. Followed end to end, one job crosses an idempotent submit, an outbox, a relay, a leased queue delivery, an idempotent effect and an ack, and every crash between commits is repaired by retry plus deduplication. Defend each box with its one job, and answer async interview questions with justification, topology, semantics, outbox, failure handling and sizing.
:::

@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Why queues

**Q1. Why move work out of the request path?**

To keep latency to what the response needs and to stop the request's success depending on slow or flaky chores. Inline chores add their latencies and multiply availabilities, three 99.9% dependencies giving 99.7%.

**Q2. What do producer, broker, consumer and acknowledgement mean?**

The producer creates messages, the broker stores and hands them out, the consumer processes them, and the acknowledgement tells the broker a message is done so it can stop redelivering it.

**Q3. How do RabbitMQ, SQS and Kafka differ in shape?**

RabbitMQ routes through exchanges and pushes to consumers, deleting on ack. SQS is a managed queue where consumers poll and messages hide during a visibility timeout. Kafka is a partitioned log that keeps records for a retention period and lets each consumer group track its own offset.

### Consuming safely

**Q4. What is a visibility timeout and what goes wrong if it is too short?**

The time a received message stays hidden from other consumers. If a job takes longer, the message reappears and another worker processes it too, duplicating the effect. Set it above the longest job, extend it with heartbeats, and make jobs idempotent.

**Q5. What does prefetch control?**

How many unacknowledged messages a consumer may hold. High prefetch improves throughput for uniform fast jobs but lets slow workers hoard work and lose more on crashes. Low prefetch spreads variable work fairly.

**Q6. What is backpressure?**

A slower component pushing back on a faster one so it slows down rather than overwhelming it, through bounded queues, prefetch limits, blocking publishes or rejections. Unbounded buffers are the opposite and end in out-of-memory crashes.

**Q7. How do you size a worker pool?**

Little's law, arrival rate times job duration gives concurrent jobs, then add headroom and respect downstream limits. 50 jobs per second at 0.3 s each needs at least 15.

**Q8. Which metric best shows a queue is in trouble?**

The age of the oldest message, because it measures lateness directly. Depth alone depends on throughput, and CPU says nothing about I/O-bound workers.

### Delivery semantics

**Q9. Explain at-most-once and at-least-once.**

Acknowledging before processing means a crash loses the message, at most once. Acknowledging after means a crash causes redelivery, at least once. Most systems choose at-least-once.

**Q10. Why is exactly-once delivery hard?**

Processing changes something outside the broker, and the effect and the acknowledgement cannot commit together. A crash between them forces a choice between losing and repeating. It is a version of the two generals problem.

**Q11. Where does Kafka's exactly-once apply?**

To read-process-write cycles entirely within Kafka, using idempotent producers and transactions that commit outputs and input offsets together, read by read_committed consumers. Writes to databases, APIs or email are outside it.

**Q12. How do you make a consumer idempotent?**

Use absolute or conditional updates where possible, and an inbox table where the message id is inserted with a unique constraint in the same transaction as the effect. Pass the message id as an idempotency key to external systems.

**Q13. Who should assign message ids?**

The producer, from the business event, so that producer retries carry the same id and consumers can deduplicate them.

### Retries and dead letters

**Q14. Why exponential backoff with jitter?**

Backoff gives a struggling dependency time to recover, and jitter stops many clients that failed together from retrying in synchronized waves. Full jitter picks a random wait up to the growing cap.

**Q15. Which errors should not be retried?**

Permanent ones, such as 4xx other than 429, validation and parse errors, and missing entities. They fail the same way every time and belong in a dead-letter queue.

**Q16. What is a poison message and a dead-letter queue?**

A message that fails every time it is processed. A DLQ receives messages after a maximum number of attempts, so they stop consuming capacity and blocking ordered queues, and a human can inspect and redrive them.

**Q17. How do retries break ordering, and how do you cope?**

A failed message retried later can be applied after newer messages, such as paid after cancelled. Block per key, attach per-entity versions and ignore older ones, or enforce state machine transitions.

### Kafka fundamentals

**Q18. Why is Kafka not just another queue?**

It is a durable, replicated log. Reading does not delete records, any number of consumer groups read independently at their own offsets, and consumers can replay history within retention. A queue hands each task to one worker and forgets it.

**Q19. What decides a record's partition?**

The key's murmur2 hash modulo the partition count, or a sticky spread when there is no key. Records with the same key go to the same partition and stay ordered.

**Q20. What does a consumer group do?**

Divides a topic's partitions among its members, one consumer per partition, so its parallelism is capped by the partition count. Different groups read the same data independently.

**Q21. When should a consumer commit offsets?**

After processing, for at-least-once delivery, with idempotent processing. Auto-commit can commit offsets for records not yet processed, risking loss on a crash.

**Q22. What do batch.size and linger.ms do?**

They let the producer gather records per partition into batches, sent when the batch fills or the linger time passes, improving throughput and compression at a small latency cost.

### Kafka reliability

**Q23. What is the ISR?**

The in-sync replica set, the leader and followers that are caught up. Only ISR members can become leader, so committed records survive leader changes.

**Q24. What do acks=all and min.insync.replicas=2 give you?**

A write succeeds only once at least two replicas have it, so it survives one broker loss, and writes are rejected rather than accepted with one copy when the ISR shrinks.

**Q25. What does the idempotent producer prevent?**

Duplicates and reordering from producer retries within a session, using a producer id and per-partition sequence numbers that the broker checks.

**Q26. What triggers a rebalance and how do you reduce its impact?**

Consumers joining, leaving, crashing or exceeding max.poll.interval.ms. Use the cooperative or new broker-driven protocol, static membership, and batches that finish well within the poll interval.

**Q27. What is log compaction?**

Keeping only the latest record per key instead of deleting by age, with tombstones to delete keys, so a topic acts like a replayable table of current state.

### Running Kafka

**Q28. How do you handle consumer lag?**

Check whether the consumer is stuck or slow and whether lag is skewed, fix the cause, compute catch-up time from the surplus rate, scale up to the partition count or batch more, and watch the oldest record against retention.

**Q29. What happens when you add partitions to a keyed topic?**

The hash modulo changes, so many keys move to new partitions and their old and new records are split, breaking per-key order for a while. Choose generous counts early or migrate to a new topic.

**Q30. What is a hot partition and how do you fix it?**

A partition receiving far more traffic because one key dominates. Key by a finer entity, or salt the hot key across several partitions and accept ordering per sub-key.

**Q31. When would you choose SQS, RabbitMQ or Kafka?**

SQS for managed background jobs with simple routing, RabbitMQ for complex routing and per-message control, Kafka for high-volume event streams, multiple consumers, replay and change data capture.

### Event-driven design

**Q32. Event or command?**

A command asks one service to act and may be refused. An event states a past fact with no addressee, so the producer does not depend on its consumers.

**Q33. Thin events or fat events?**

Thin events say something changed and make consumers call back, coupling them to the producer's API and adding load. Fat events carry the needed state so consumers are independent, at the cost of larger events and schema care.

**Q34. How do you evolve event schemas safely?**

Use a schema registry with a compatibility rule, add optional fields with defaults, never rename or retype fields in place, and use expand and contract or a new event type for breaking changes. Upgrade consumers first under backward compatibility.

**Q35. What is eventual consistency in an event-driven system?**

Each service's view updates when it processes an event, so views disagree for a window and converge if changes stop. The UI and business rules must tolerate that window.

**Q36. What are event sourcing and CQRS?**

Event sourcing stores the events as the source of truth and folds them into state. CQRS separates the write model from read models built as projections of events. They are often combined and suit audited domains.

### Outbox and sagas

**Q37. What is the dual-write problem?**

Writing to two systems, such as a database and a broker, without a shared commit, so a crash between the writes leaves them inconsistent forever.

**Q38. How does the transactional outbox work?**

The event is inserted into an outbox table in the same transaction as the state change, and a relay publishes outbox rows to the broker, by polling or by CDC from the WAL, marking them done after confirmation. Delivery is at-least-once.

**Q39. Polling relay or CDC relay?**

Polling is simple and portable but adds query load and latency and can publish slightly out of commit order. CDC reads the WAL in commit order with low latency, at the cost of running a connector and managing replication slots.

**Q40. What is a saga?**

A business process split into local transactions in several services, linked by events or commands, with compensating transactions to semantically undo completed steps when a later step fails.

**Q41. Choreography or orchestration?**

Choreography has each service react to events, which is decoupled but hard to follow as flows grow. Orchestration has a coordinator send commands and track state, which is explicit and testable but central.

**Q42. What is a compensating transaction and what is the pivot?**

A new transaction that undoes a step's business effect, such as a refund for a capture. The pivot is the step after which the saga always completes, so hard-to-undo steps belong after it.

### Scheduled work

**Q43. Twenty instances, one daily job. How does it run once?**

Use a single scheduler that enqueues the job, or leader election with a renewable lease, or a unique run row that only one instance can insert. Make the job idempotent regardless.

**Q44. How should missed runs be handled?**

Decide per job whether to run every missed window, run once for the latest, or skip, and write jobs to take explicit time windows so catch-up is a parameter.

**Q45. Why schedule in UTC?**

Local schedules skip or repeat runs at daylight saving changes. Scheduling in UTC keeps the clock monotonic, and jobs convert to local time internally when needed.

### Primary sources

[Kreps, Narkhede and Rao, Kafka: a Distributed Messaging System for Log Processing, 2011](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/Kafka.pdf). The original Kafka paper.

[Apache Kafka documentation](https://kafka.apache.org/documentation/). Replication, producers, consumers, transactions and compaction.

[Garcia-Molina and Salem, Sagas, 1987](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf). Long-lived transactions and compensation.

[Brooker, Exponential Backoff and Jitter, AWS Architecture Blog, 2015](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/). Why full jitter.

[Debezium documentation, Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html). Log-based outbox relays.

[Amazon SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html). Visibility timeouts, FIFO queues and dead-letter queues.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Queues and workers

**E1** ● An endpoint saves for 30 ms, then sends an email for 250 ms, renders a PDF for 600 ms and sends an SMS for 150 ms. How long does the user wait inline, and with a queue that costs 5 ms to enqueue?

**E2** ● Four dependencies are each available 99.95% of the time. What is the availability of a request that needs all four inline?

**E3** ● Jobs arrive at 80 per second and take 0.5 s each. What is the minimum number of concurrent workers?

**E4** ● For 45 minutes jobs arrive at 120 per second and complete at 100. How large is the backlog, and how long does it take to drain once capacity reaches 150 per second?

**E5** ● With 54,000 jobs queued and 100 completed per second, how long does a newly arrived job wait?

**E6** ● Backoff starts at 2 s and doubles for 6 retries. What is the largest total wait with full jitter, and the smallest?

**E7** ● A dependency fails 15% of calls and each failure is retried up to 3 times. By how much does call volume grow if retries fail at the same rate? What if the dependency is completely down?

### Kafka

**E8** ● 400 events per second of 2 KB, replication factor 3, 14 days of retention. How much storage at most, before compression?

**E9** ● A consumer group is 4 hours behind a topic producing 300 records per second, and processes 350 per second with 4 consumers. How long until it catches up? How long with 16 consumers at the same per-consumer rate, if the topic has 16 partitions?

**E10** ● A group of 20 consumers reads a 12-partition topic. How many consumers are idle?

**E11** ● With replication factor 3 and min.insync.replicas 2, how many broker failures can a partition survive while still accepting writes? With replication factor 5 and min.insync.replicas 3?

**E12** ● A consumer fetches 500 records per poll and spends 0.8 s on each. What happens with max.poll.interval.ms at 300,000, and what max.poll.records keeps it safe?

**E13** ● An inbox table keeps message ids for 7 days at 250 messages per second and 60 bytes per row. How many rows and how much space?

**E14** ● 30 instances each run an hourly cron job for one week without coordination. How many runs happen instead of the intended number?

**E15** ●● A topic grows from 12 to 16 partitions. For a uniformly distributed hash, what fraction of keys keep their partition?

### Traces and explanations

**E16** ●● A refund job with a 30 s visibility timeout sometimes takes 45 s. Trace the duplicate refund and give three fixes.

**E17** ●● Trace a receipt worker that crashes after sending the email, once with ack-before-work and once with ack-after-work.

**E18** ●● Design an idempotent consumer for PaymentCaptured that adds loyalty points to a balance.

**E19** ●● Events for order 124 with versions 1 placed, 2 paid and 3 cancelled arrive in the order 1, 3, 2. Show what a version-checking consumer stores.

**E20** ●● Choose partition keys for chat messages, a payment ledger and a website clickstream, and justify each.

**E21** ●● Show the two crash cases of a naive dual write and how the outbox removes both.

**E22** ●● Under BACKWARD compatibility with Avro, classify: add an optional field with a default; remove a field that had a default; rename a field; change int to long; add an enum symbol.

**E23** ●● In a saga of payment, kitchen and courier, the kitchen rejects the order because the restaurant just closed. Trace the compensations.

**E24** ●● Choose RabbitMQ, SQS or Kafka for password reset emails, a 200,000 per second clickstream, CDC into a search index, and image resize jobs.

### Code and design

**E25** ●●● Design a polling outbox relay: table schema, claim query, ordering, multiple relay instances, failure handling and cleanup.

**E26** ●●● Design the order fulfilment saga as an orchestrated state machine with timeouts and compensations.

**E27** ●●● Prove that with at-least-once delivery, unique message ids and an inbox insert that commits with the effect, each message's effect is applied exactly once.

**E28** ●●● Design a delayed job system that can run "remind restaurant 9 in 10 minutes" reliably at 1,000 scheduled jobs per second.

**E29** ●●● Design daily settlement with a payment provider across 20 instances, including missed runs, idempotency and alerting.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** Inline, 30 + 250 + 600 + 150 = 1,030 ms. With a queue, 30 + 5 = 35 ms.

**E2.** 0.9995⁴ ≈ 0.9980, so about 99.80%.

**E3.** 80 × 0.5 = 40 concurrent workers at least, plus headroom.

**E4.** The backlog grows at 20 per second for 2,700 s, giving 54,000 jobs. At 150 per second the surplus is 30, so draining takes 54,000 ÷ 30 = 1,800 s, 30 minutes.

**E5.** 54,000 ÷ 100 = 540 s, 9 minutes.

**E6.** The caps are 2, 4, 8, 16, 32 and 64 s, so the largest total is 126 s and the smallest is 0, since full jitter can pick zero each time.

**E7.** Each call's expected attempts are 1 + 0.15 + 0.15² + 0.15³ ≈ 1.176, about 17.6% more traffic. If the dependency is fully down, every call makes 4 attempts, four times the traffic, which is why retry budgets and circuit breakers exist.

**E8.** 400 × 2,000 × 86,400 = 69.12 GB per day, × 3 replicas × 14 days ≈ 2,903 GB, about 2.9 TB.

**E9.** The backlog is 300 × 14,400 = 4,320,000 records. With a surplus of 50 per second, catching up takes 86,400 s, 24 hours. With 16 consumers at 87.5 each, capacity is 1,400 per second and the surplus 1,100, so 4,320,000 ÷ 1,100 ≈ 3,927 s, about 65 minutes.

**E10.** 20 − 12 = 8 consumers are idle.

**E11.** With RF 3 and min ISR 2, writes continue with one broker down and stop with two. With RF 5 and min ISR 3, writes continue with two down and stop with three.

**E12.** A poll's batch takes 500 × 0.8 = 400 s, beyond the 300 s limit, so the consumer is removed from the group, its partitions rebalance, and it rejoins, repeatedly. max.poll.records must be below 300 ÷ 0.8 = 375. Choose about 300 for headroom.

**E13.** 250 × 604,800 = 151,200,000 rows, about 151,200,000 × 60 = 9.07 GB, before index overhead.

**E14.** 30 × 168 = 5,040 runs instead of 168.

**E15.** Whether a key keeps its partition depends on its hash modulo 48, the least common multiple. Of the 48 residues, only 0 to 11 give the same value modulo 12 and modulo 16, so 12 ÷ 48 = 25% of keys stay and 75% move.

**E16.** Worker A receives the message and calls the provider. At 30 s the message becomes visible and worker B receives it and also calls the provider. Both refunds succeed at about 45 s and 75 s. Fixes are to set the visibility timeout well above the slowest job, such as 5 minutes, to extend it with ChangeMessageVisibility heartbeats while the call is in progress, and to pass the refund's id as an idempotency key to the provider so the second call returns the first result.

**E17.** Ack-before-work: the worker acks, sends the email, and crashes. The email went out and the message is gone, which happens to be fine. But a crash before the send loses the email entirely. Ack-after-work: the worker sends the email and crashes before acking, so the message is redelivered and a second worker sends it again. Ack-after-work with an idempotency key at the email provider sends exactly one email.

**E18.** In one transaction, insert the event id into the consumer's inbox with a unique constraint, then run `UPDATE loyalty SET points = points + :n WHERE user_id = :u`. If the insert raises a unique violation, the event was already applied, so roll back, acknowledge and continue. The increment is not naturally idempotent, so the inbox is what makes it safe, and it must be in the same database as the balance.

**E19.** The consumer stores the last applied version per order. Event 1 arrives, stored version 0, so it applies placed and stores 1. Event 3 arrives, 3 > 1, so it applies cancelled and stores 3. Event 2 arrives, 2 < 3, so it is ignored. The final state is cancelled, which is correct.

**E20.** Chat messages: key by conversation id, so messages in a conversation stay ordered, with good spread across many conversations. Payment ledger: key by account id, since per-account order matters for balances, and accept that very busy accounts may need salting. Clickstream: key by session or user id if per-session order matters to analytics, otherwise no key for even spread.

**E21.** Commit then publish: a crash after commit loses the event, so the order exists and nobody hears. Publish then commit: a failed commit leaves an event for an order that does not exist. The outbox inserts the event row in the same transaction, so the order and the event row commit or vanish together, and the relay keeps retrying the publish until the broker confirms, which can only cause duplicates, handled by consumers.

**E22.** Adding an optional field with a default is backward compatible. Removing a field that had a default is backward compatible, since new readers do not need it. Renaming a field is not, unless the new schema declares the old name as an alias. Changing int to long is backward compatible in Avro, since the reader can promote int to long. Adding an enum symbol is backward compatible, since old data only uses symbols the new reader knows, but it breaks forward compatibility, because old readers fail on the new symbol unless their enum declares a default.

**E23.** Payment captured, then the kitchen replies "rejected: closed". The orchestrator enters the compensation path. Nothing is needed for the kitchen, since it rejected. It sends a refund command to payments, waits for RefundCompleted, marks the order cancelled with reason RESTAURANT_CLOSED, and notifies the customer. If the refund command fails, it retries with backoff until it succeeds, since compensations must complete.

**E24.** Password reset emails: SQS or RabbitMQ, a simple task queue with retries and a DLQ. Clickstream at 200,000 per second: Kafka, for throughput, batching and many downstream consumers. CDC into search: Kafka, typically via Debezium, keyed by primary key, possibly compacted, for ordering and replay. Image resize jobs: SQS or RabbitMQ, tasks done once with visibility timeouts sized for the largest images.

**E25.** Table `outbox(id bigserial primary key, event_id uuid unique, topic text, key text, payload jsonb, created_at timestamptz, published_at timestamptz null)` with a partial index on id where published_at is null. Each relay instance loops: begin, `SELECT * FROM outbox WHERE published_at IS NULL ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED`, publish each row to its topic with its key using an idempotent producer with acks=all, wait for all acknowledgements, `UPDATE outbox SET published_at = now() WHERE id = ANY(...)`, commit. If publishing fails, roll back so the rows are retried. Per-key order holds as long as one instance handles a key's rows in id order, which SKIP LOCKED does not guarantee across instances, so either run one active relay per shard of keys, or rely on consumers' version checks. A cleanup job deletes published rows older than 7 days in batches. Alert on the age of the oldest unpublished row.

**E26.** States: CREATED, PAYING, PAID, SENT_TO_KITCHEN, COOKING, ASSIGNING, DISPATCHED, DELIVERED, and on failure COMPENSATING and CANCELLED. On OrderPlaced the orchestrator sends CapturePayment and moves to PAYING with a 30 s timer. PaymentCaptured moves to PAID, then AssignCourier with a 10-minute timer, moving to ASSIGNING, placed before cooking so the pivot comes later. CourierAssigned leads to SendToKitchen, then COOKING, the pivot after which the order is never cancelled. Failures before the pivot run compensations in reverse, ReleaseCourier and RefundPayment, then CANCELLED. Failures after it, such as a courier who cancels, retry forward by reassigning. All commands carry the saga id and step as idempotency keys, state and timers are persisted per order, and a workflow engine such as Temporal can provide the durability.

**E27.** Let message m have id u. Every delivery of m runs the consumer's transaction T, which inserts u into the inbox and applies the effect, then the consumer acknowledges. Because the insert and the effect are in one transaction, after any delivery either both are committed or neither is. Suppose the effect were applied twice. Then two transactions both committed, each including an insert of u, contradicting the unique constraint, which allows at most one committed row with u. So the effect applies at most once. At-least-once delivery means m is delivered until some delivery is acknowledged, and a delivery is acknowledged only after T committed, or after T failed with a unique violation, which means an earlier T committed. So some T commits, and the effect applies at least once. Together, exactly once, given that ids are unique per logical message and the inbox entry is never removed while redelivery is possible.

**E28.** Store due jobs in a durable table or a Redis sorted set scored by due time. A Kafka-only design uses delay topics, such as `delay-1m` and `delay-10m`, where a consumer reads each record, waits until its due time, and republishes it to the target topic, but per-message delays of arbitrary length are awkward. A database design inserts `scheduled_jobs(id, due_at, payload, status)` with an index on due_at, and pollers claim due rows with `WHERE due_at <= now() AND status = 'ready' ORDER BY due_at LIMIT 500 FOR UPDATE SKIP LOCKED`, enqueue or execute them, and mark them done. At 1,000 jobs per second, several pollers each claiming batches every 100 ms handle the rate, and partitioning the table by due date keeps it small. Execution is at-least-once, so jobs carry ids for idempotency, and pollers alert when the oldest due job is more than a few seconds late.

**E29.** A single scheduler, a Kubernetes CronJob with concurrency forbidden and a UTC schedule, enqueues one settlement job per day with an explicit window, the previous UTC day. The worker first inserts a row into `settlement_runs(date)` with a unique constraint, so a duplicate trigger does nothing. It downloads the provider's report for that window, matches it against Wren's payments, records discrepancies, and marks the run complete. If the scheduler missed days, a catch-up check at each run finds dates without a completed row and runs them in order, since every day must be settled. Alerts fire when a day has no completed row by 06:00 UTC, when a run takes longer than an hour, or when discrepancies exceed a threshold.

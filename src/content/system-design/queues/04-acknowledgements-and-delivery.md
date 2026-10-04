@part IV | Acknowledgements and delivery semantics | An acknowledgement is the consumer telling the broker that a message's work is safe, and its timing decides whether a crash loses work or repeats it. No ordering of effect and acknowledgement avoids both outcomes on its own. We will follow acknowledgements, leases and redelivery, then define at-most-once, at-least-once and exactly-once, and build the idempotent consumer that makes at-least-once the industry default. | where:4

## 16. Ack, nack and the visibility timeout

A worker takes transcode job 812 and the broker must decide when it may forget the message. Forget too early and a crash loses the job; never forget and it is processed forever. An **acknowledgement**, or ack, is the consumer's signal that the message's work is complete and the broker may delete it. A **negative acknowledgement**, or nack, says the attempt failed and the message should be redelivered or routed elsewhere.

The broker also needs to handle the consumer that says nothing because it crashed. Queues give each delivery a lease. Amazon SQS calls it the **visibility timeout**: once a message is received, it is invisible to other consumers for that long. If the consumer acks in time, the message is deleted. If the timeout passes first, the message becomes visible again and another worker receives it. RabbitMQ instead tracks the consumer's connection and requeues unacked messages when the connection closes, with a separate delivery acknowledgement timeout as a backstop.

The timeout must exceed the real processing time. Heron's transcodes take 30 seconds typically but 75 seconds at the 99th percentile. With a 60-second visibility timeout, jobs exceeding 60 seconds become visible while the first worker is still running, and a second worker starts the same transcode. Both may write renditions unless publication recognizes the same job identity. The stated percentile does not determine how many jobs exceed 60 seconds.

@fig sd_q_visibility | A 60-second lease against a 75-second job. The message reappears at 60 seconds and a second worker starts a duplicate transcode.

Two fixes are standard. Set the timeout comfortably above the tail, for example 120 seconds. Better, extend the lease while working: the worker calls `ChangeMessageVisibility` every 30 seconds as a heartbeat, so a live worker keeps its lease within the queue's maximum permitted visibility duration and a dead one loses it when its last renewed visibility timeout expires. Long timeouts without heartbeats slow recovery: a crashed worker's job waits the whole timeout before anyone retries it.

:::story Picture this
A library lends a reference book for two hours. If you need longer, you go to the desk and renew it. If you vanish, after two hours the book goes back on the shelf for the next reader. Renewing while you read is the heartbeat; a loan period shorter than your reading time means someone else gets a copy while you are still on chapter three.
:::

## 17. At-most-once delivery

The gateway receives "match 7 is in its 88th minute" updates every few seconds. Losing one is harmless, because another arrives shortly. Processing one twice is also harmless here, but the gateway cares more about latency than completeness. For messages like this, **at-most-once** delivery is acceptable: each message is processed zero or one times, never twice.

The mechanism is to acknowledge or commit before doing the work. The consumer receives the message, commits the offset or acks it, then processes it. If it crashes after the commit and before the effect, the message is gone. Fire-and-forget producers that do not wait for a publisher confirm are at-most-once on the producing side for the same reason.

Count the loss. A consumer with a prefetch of 10 that acks on receipt holds up to 10 acknowledged-but-unprocessed messages. A crash loses all 10. For Heron's clock ticks, that is ten skipped ticks out of a stream that sends a new one every few seconds, and the next tick corrects the screen. For transcode jobs, it would be ten clips that never get renditions, with job rows stuck in `queued` forever and no message left to retry them.

@fig sd_q_at_most_once | Commit before effect. A crash between the two loses the message, and nothing in the system will ever retry it.

At-most-once is the right choice for telemetry samples, cursor positions, typing indicators and periodic state broadcasts where the next message supersedes the last. It is wrong for anything that changes money, inventory or user-visible history, because the loss is silent: no error, no retry, no dead-letter entry.

:::note UDP-style thinking
At-most-once matches the way real-time protocols treat stale data. A video call drops a late frame rather than retransmit it, because a frame from 300 milliseconds ago is useless. Ask whether a message is still worth anything after a delay; if not, at-most-once is not a compromise but the correct semantics.
:::

## 18. At-least-once delivery

A transcode job must not be lost. The worker therefore transcodes first and acknowledges after the renditions are written and the job row is updated. That is **at-least-once** delivery: every message is processed one or more times. Loss is prevented by retrying anything not acknowledged, and the price is that some messages are processed more than once.

Duplicates come from every gap between the effect and the acknowledgement. The worker writes the renditions, then crashes before acking: redelivery. The ack is sent but the network drops it: redelivery after the visibility timeout. The lease expires during a slow job: a second concurrent worker. A rebalance moves a partition while the old owner is paused: overlap. A producer times out waiting for a confirm and resends: a duplicate message, not just a duplicate delivery.

The rate is small but never zero. Suppose 1 in 1,000 acknowledgements is lost to crashes, timeouts and rebalances. At Heron's peak of 6 jobs per second, an hour brings $6\times3{,}600=21{,}600$ jobs and about 21.6 duplicate deliveries. Over a day at that rate, more than 500. A design that is correct only when duplicates do not happen is incorrect several hundred times a day.

@fig sd_q_at_least_once | Effect before acknowledgement. A crash after the effect commits causes redelivery, so the effect must recognize the job it has already done.

At-least-once is the default in SQS, RabbitMQ with manual acks, Google Pub/Sub, and Kafka consumers that commit after processing. It is the right base for almost every business message, because losing work is usually worse than doing it twice, and doing it twice can be made harmless. The next section shows how.

:::warn Watch out
"We rarely see duplicates in testing" is not evidence. Duplicates cluster around deploys, rebalances, broker failovers and slow dependencies, which tests seldom reproduce. Inject them: deliver every message twice in a test environment and check that state is unchanged.
:::

## 19. At-least-once plus an idempotent consumer

The duplicate transcode of job 812 wastes 30 seconds of compute but writes the same renditions to the same keys, so the user sees nothing wrong. A duplicate "charge card for ticket 55" would charge twice. The difference is whether the effect is **idempotent**: applying it twice leaves the same state as applying it once. The common industry pattern is at-least-once delivery combined with an **idempotent consumer**, a consumer that makes its effect idempotent even when the raw operation is not.

There are three standard techniques. First, make the operation naturally idempotent: "set score of match 7 to 2-0 at version 41" is idempotent, "add one goal" is not. Write absolute values with versions instead of increments. Second, use deterministic outputs: renditions go to `clips/812/720p.mp4`, so a repeat overwrites identical bytes rather than creating a second file. Third, keep a **deduplication record**: a table of processed message ids, written in the same database transaction as the effect.

The third technique is the general one. The consumer begins a transaction, inserts the message id into `processed_messages` with a unique constraint, applies the effect, and commits. A duplicate fails the unique insert, so the consumer skips the effect and simply acks. Because the id and the effect commit together, there is no window where one exists without the other.

```sql
BEGIN;
INSERT INTO processed_messages(id) VALUES ('job-812-attempt');  -- fails if seen
UPDATE jobs SET status = 'succeeded' WHERE id = 812 AND status <> 'succeeded';
COMMIT;
```

@fig sd_q_idempotent | The deduplication record and the effect commit together. A redelivered message hits the unique key and is acknowledged without repeating the effect.

The table has a size. Keeping ids for 7 days at Heron's peak of 518,400 jobs per day is 3,628,800 rows; at 64 bytes per id that is 232,243,200 bytes, about 232 MB, before index overhead. The retention must exceed the longest window in which a duplicate can arrive, including a replay from a stream's retention. If the effect lives in an external system, such as a payment provider, pass the message id as the provider's idempotency key so the provider deduplicates for you.

:::interview Interview lens
**"Why is at-least-once with idempotent consumers so common?"** Because it is the cheapest combination that neither loses nor double-applies work. At-most-once loses messages silently, and true exactly-once needs a transaction spanning the broker and the effect, which most effects cannot join. At-least-once only requires retrying unacknowledged messages, and idempotence turns the resulting duplicates into no-ops, usually with a unique message id stored in the same transaction as the effect. The practical result is effectively-once outcomes with ordinary infrastructure.
:::

:::key In one breath
An ack lets the broker forget a message, and a lease or visibility timeout returns unacked messages after a crash, so the timeout must exceed real processing time or be extended by heartbeats. Acking before the effect gives at-most-once and silent loss; acking after gives at-least-once and inevitable duplicates. Duplicates are a daily event at any real volume, so consumers make effects idempotent with absolute writes, deterministic outputs, or a deduplication id committed with the effect.
:::

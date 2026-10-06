@part IV | Retries, poison messages and DLQs | We decide what a consumer does when processing fails. Some failures pass if you wait, some never will, and telling them apart decides whether retries help or hurt. We will cover backoff with jitter, poison messages and dead-letter queues, and the reordering that retries cause. | where:4

## 10. Retries, backoff and jitter

Most job failures are temporary. The email provider returns 503 for a minute, the kitchen API times out during a deploy, the database fails over. Retrying later usually succeeds. Retrying immediately usually fails again, and if every worker retries immediately, the struggling service receives a burst of retries exactly when it is least able to handle them.

**Exponential backoff** waits longer after each failure. Wren's workers wait 1 s before the second attempt, 2 s before the third, then 4, 8, 16, 32, 64 and 128 s, eight retries spanning up to 255 s, a little over four minutes. Waits usually also have a cap, such as 5 minutes, so a job that fails twenty times does not wait hours between attempts.

**Jitter** randomizes each wait. Without it, a thousand jobs that failed at the same moment, because the provider blipped, all retry at exactly 1 s, then 3 s, then 7 s, arriving in synchronized waves. AWS's architecture blog compared strategies in 2015 and recommended **full jitter**, where each wait is a random value between zero and the current cap. The retries smear into a falling trickle that a recovering service can absorb.

@fig be_q_backoff | Each wait is random below a doubling cap. In the worst case the waits add to 255 s.

@fig be_q_retry_storm | Illustrative. Fixed schedules make retry waves. Jitter makes a trickle.

Not every failure deserves a retry. A 400 Bad Request, a 404 for a deleted restaurant, a JSON parse error, or a validation failure will fail the same way every time. Retrying them wastes capacity and delays the dead-letter queue that would bring them to a human's attention. Wren's workers classify errors, the same way Unit V classified API errors. Network errors, timeouts, 429 and 5xx responses are retried. 4xx responses other than 429 and any deserialization or validation error go straight to the dead-letter queue.

Retries have a budget at the system level too. If 10% of requests to a service fail and every caller retries three times, the service receives up to 1.3 times its normal traffic when it is already in trouble. Unit X covers retry budgets and circuit breakers, which stop retries entirely when a dependency is clearly down. In job systems the queue itself absorbs much of this, since a failed job simply waits, but the same logic applies to how fast workers come back.

Brokers implement delayed retries differently. SQS uses the visibility timeout, since a message that is not deleted reappears after it, and `ChangeMessageVisibility` sets the delay per message. RabbitMQ uses a delayed-message exchange or a chain of retry queues with message TTLs that dead-letter back into the main queue. Kafka has no per-message delay, so teams use separate retry topics, such as `order-events-retry-1m` and `order-events-retry-10m`, each consumed with a delay.

## 11. Poison messages and dead-letter queues

A **poison message** is one that fails every time it is processed. It might be malformed JSON from a buggy producer, an event for a restaurant that was deleted, a payload that triggers a bug in the consumer, or a message larger than the consumer can handle. Retrying it forever has two costs. It wastes worker time on every attempt, and in brokers that deliver in order, it blocks everything behind it, the classic head-of-line blocking.

A **dead-letter queue**, DLQ, is where messages go after too many failures. In SQS, a redrive policy sends a message to the DLQ once its receive count passes `maxReceiveCount`, 5 for Wren's kitchen jobs. RabbitMQ dead-letters a message when it is rejected without requeue, expires, or exceeds a delivery limit. Kafka has no built-in DLQ, so consumers publish failed records to a dead-letter topic themselves and commit the offset to move on.

@fig be_q_dlq | Message m-91 fails five times and moves to the dead-letter queue, where a human can look at it.

A DLQ is not a bin. Every message in it represents work that did not happen, a customer who did not get a receipt, a kitchen that never saw an order. Wren alerts when any message lands in a DLQ, records the error and stack trace with the message, and gives the on-call engineer a tool to inspect messages and **redrive** them, sending them back to the main queue after the cause is fixed. SQS has a built-in redrive. For Kafka, a small replay tool reads the dead-letter topic and republishes.

Redrive is safe only if consumers are idempotent, since some messages in the DLQ may have partially succeeded before failing. It also needs care with ordering and staleness. A "courier is 5 minutes away" notification redriven an hour later is worse than none, so some messages are better discarded with a log entry.

Consumers also need a guard against the poison that crashes the whole process, such as a payload that triggers an out-of-memory error. The process dies before it can count the failure, the message is redelivered, and it kills the next worker too. Receive counts kept by the broker, as SQS and RabbitMQ quorum queues do, catch this, while counters kept in the worker's memory do not.

## 12. Ordering under retries

Retries break ordering, and the break is easy to miss. Order 124 produces three events in sequence, placed, paid and cancelled, the last because the customer changed their mind. The consumer handles "placed". "Paid" fails because the database blipped and goes to a retry delay. "Cancelled" succeeds. Then "paid" is retried and succeeds. The consumer's final state for order 124 is "paid", after the order was cancelled.

@fig be_q_reorder | "Paid" failed once and was retried after "cancelled" succeeded, so the stale state won.

Three approaches handle this, and they trade throughput for strictness. The first is **strict per-key ordering**. Process each key's messages one at a time, and when one fails, block the rest of that key's messages until it succeeds or is dead-lettered. Kafka gives this per partition, and SQS FIFO per message group. The cost is that a stuck message blocks its key, and with Kafka, blocks every key in the partition unless the consumer tracks keys itself.

The second is to make consumers **order-tolerant**. Each event carries a version or sequence number per entity, here 1 for placed, 2 for paid, 3 for cancelled. The consumer stores the last version it applied and ignores anything older. When "paid", version 2, arrives after "cancelled", version 3, it is discarded. This is the same conditional-update idea from Part III, and it lets retries and parallelism happen freely. It works when each event carries enough state that skipping an older one loses nothing.

The third is to model the domain as a **state machine** whose transitions refuse impossible moves. A cancelled order cannot become paid, so the consumer rejects the transition and logs it. This is less general than versions and often closer to the business rules, and it catches bugs in producers as well as reordering.

Wren uses versions for its read models, such as the kitchen board and the order history, and state machine checks in the order service itself. It avoids strict blocking except where the business demands it, such as ledger entries, where Kafka's per-partition order and a single consumer per partition are worth the throughput cost.

:::story Picture this
A pharmacy that phones patients when prescriptions are ready. When the line is busy, a sensible assistant waits a little longer before each redial, and not at exactly the same moment as every other assistant in the building. A number that is disconnected goes on a list for the manager instead of being redialled all day. And if a patient's doctor cancelled the prescription in the meantime, the assistant checks the latest note before calling about the old one.
:::

:::note Retry inside or outside the worker
A worker can retry a failing call a couple of times in-process, with short waits of tens of milliseconds, before giving up on the message. That handles brief blips cheaply. Longer waits belong to the broker, through visibility timeouts or retry topics, so the worker is not tied up sleeping and a restart does not lose the retry.
:::

:::warn Watch out
A retry loop without a limit turns a poison message into a permanent drain on capacity and, in ordered brokers, a permanent block. Every retry policy needs a maximum number of attempts, a classification of non-retryable errors, and a dead-letter destination that pages a human.
:::

:::interview Interview lens
**"How would you design retries for a background job system?"** Classify failures, retrying only timeouts, network errors, 429 and 5xx. Use exponential backoff with full jitter and a cap, here eight retries from 1 s doubling to 128 s. After the limit, or immediately for permanent errors, send the message to a dead-letter queue with its error, alert on it, and provide a redrive tool. Make consumers idempotent so redelivery and redrive are safe, and handle reordering with per-entity versions or state machine checks.
:::

:::key In one breath
Retry temporary failures with exponential backoff and full jitter, 1 s doubling to 128 s for at most 255 s of waiting, and send permanent failures such as 4xx and parse errors straight to a dead-letter queue. Poison messages fail every time and block ordered queues, so receive counts move them to a DLQ after a limit, 5 for Wren's kitchen jobs, where they trigger alerts and wait for redrive once fixed. Retries reorder messages, so a stale "paid" can follow "cancelled", and per-key blocking, per-entity versions or state machine checks keep the final state right.
:::

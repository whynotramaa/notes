@part V | Retries and dead-letter queues | Some failed messages succeed on the next try and some will fail forever, and treating the two the same either drops recoverable work or jams the queue. A message that crashes its consumer every time can stall an entire partition. We will classify failures, retry with backoff without blocking healthy messages, contain poison messages and run a dead-letter queue that someone actually drains. | where:5

## 20. Classifying failures before retrying

Job 812's worker gets an error. Retrying is the right response if the object store returned a 503 during a brief overload. It is the wrong response if the uploaded file is not a video at all, because the hundredth attempt will fail exactly like the first and each attempt costs 30 seconds of compute.

Split failures into three classes. A **transient failure** is caused by a temporary condition outside the message: a timeout, a 503, a lock conflict, a dependency restart. Retrying later usually works. A **permanent failure** is caused by the message itself: invalid format, a reference to a deleted clip, a schema the consumer cannot parse, a business rule that rejects it. Retrying never helps. The third class is the bug: the consumer has a defect, such as a null pointer on a field that is legitimately empty. Retrying does not help until someone deploys a fix, after which retrying everything is exactly right.

Classify by error type, not by guess. HTTP 408, 429, 500, 502, 503 and 504, connection resets and deadlock errors are transient. HTTP 400, 404, 409 on a business conflict, 422 and validation errors are permanent. Unknown exceptions are treated as transient for a small number of attempts and then quarantined, which handles bugs without retrying them forever.

@fig sd_q_classify | A failure classifier. Transient errors go to delayed retry, permanent ones go straight to quarantine, and unknown ones get a few attempts first.

Volumes matter for the retry budget. If 2% of Heron's 21,600 peak-hour jobs hit a transient failure, that is 432 retries an hour, a 2% increase in load. If a dependency outage makes every job fail transiently, retries multiply load just as the system is weakest, which is why the next section bounds them.

:::warn Watch out
Do not retry a permanent failure "just in case". A malformed message retried with no limit consumes a worker forever, and with a prefetch it blocks other messages too. Every retry path needs a maximum attempt count and a destination for messages that exhaust it.
:::

## 21. Retrying with backoff without blocking the queue

The object store is overloaded for 20 seconds. If every failed job retries immediately, the store receives the same load again, plus the retries, and stays overloaded. **Exponential backoff** spaces attempts by a growing delay. With a base of 1 second and a factor of 2 over 5 scheduled delay intervals, the delays are 1, 2, 4, 8 and 16 seconds, 31 seconds in total, enough to ride out the 20-second overload.

All workers that failed together would retry together on the same schedule, so a **jitter** term randomizes each delay. With full jitter, each delay is drawn uniformly between 0 and the exponential value, so the expected total is half, 15.5 seconds, and the retries spread out instead of arriving in synchronized waves. The reliability unit covers backoff and jitter in general; here the question is *where* the waiting happens.

Waiting inside the consumer is the simple choice and the wrong one for most queues. A worker that sleeps 16 seconds holds its message, its prefetch slot and, in a stream, its whole partition. Instead, put the message back with a delay. SQS can set a per-message delay or change visibility to the backoff duration. RabbitMQ uses a delayed-message exchange or per-queue TTLs that dead-letter into the main queue. Kafka has no per-message delay, so designs use **retry topics**: a failed message is written to `scores.retry.1m`, whose consumer waits until the message is a minute old before reprocessing, then to `scores.retry.10m`, and finally to a dead-letter topic.

@fig sd_q_retry_topics | Retry topics for a stream. The main partition keeps moving while failed messages wait in separate delay tiers.

Retry topics have one consequence that teams discover late: they break per-key order. If "1-0" for match 7 goes to the retry topic and "2-0" succeeds on the main topic, the gateway applies "2-0" first and then "1-0" a minute later. A consumer that needs order must either block the key (stop processing later messages for match 7 until the earlier one succeeds) or apply events with version checks so a late older event is ignored.

:::story Picture this
A post office sorter finds a parcel with a smudged address. Holding it at the belt stops every parcel behind it. Instead she drops it in a tray marked "try again in an hour" and keeps the belt moving. Parcels that fail the hourly tray three times go to the dead-letter office.
:::

## 22. Poison messages

A score event arrives with a minute field of `"90+3"` instead of an integer. The consumer's parser throws. The message is redelivered and the parser throws again. A **poison message** is one that fails every time it is processed, usually because of its content or a bug the content triggers. In a queue it wastes worker time. In an ordered stream it does much worse.

In a partition, the consumer cannot move past a message it has not finished without giving up order. If it retries the poison message in place, the partition stops. Count it for Heron: In this illustrative policy, 5 processing attempts of 30 seconds each are followed by delays of 1, 2, 4, 8 and 16 seconds, including the final delay before quarantine. Processing takes 150 seconds and the 31 seconds of scheduled waiting bring the blocked interval to 181 seconds. A policy that quarantines immediately after the fifth failure would omit the final wait. At an exact expected rate of $20/12$ events per second per partition, 301.666667 expected events pile up behind one bad message. Without an attempt limit, the partition stops forever and lag grows without bound while every other partition looks healthy.

Some poison messages crash the process rather than throwing, for example by running out of memory decoding a huge payload. The consumer restarts, reads the same message from the committed offset, and crashes again, in a loop that never reaches the code that would count attempts. Guard against that by recording the attempt before processing, for example in an attempts table keyed by message id or in the message's delivery-count attribute (SQS `ApproximateReceiveCount`, RabbitMQ quorum queues' `x-delivery-count`).

@fig sd_q_poison | One poison message holds a partition for 181 seconds while 301.666667 expected events wait behind it.

The containment rule is the same in every system: count attempts durably, and after the limit move the message out of the main path to a place where it cannot block anything. Then alert, because each poison message is either bad data from a producer or a bug in a consumer, and both need a person.

:::note Validate at the producer
The cheapest poison message is the one never published. Producer-side schema validation can reject an invalid field before publication. A registry supplies schema and compatibility rules, but does not itself validate every value sent through every producer path. Contract tests between producer and consumer catch the `"90+3"` case before deploy.
:::

## 23. Dead-letter queues and redrive

A **dead-letter queue**, or DLQ, holds messages that exhausted their retries or failed permanently. It turns a blocking failure into a stored, inspectable item. SQS attaches a DLQ through a redrive policy with `maxReceiveCount`; RabbitMQ uses a dead-letter exchange; Kafka designs write to a dead-letter topic from the consumer.

A useful dead-letter entry carries the original message unchanged, plus metadata: the source queue or topic, partition and offset, the error class and message, the stack trace or error code, the attempt count, the first and last failure times, and the consumer version that failed. Without the original bytes, a fix cannot be replayed. Without the error and version, nobody can tell whether a deploy already fixed it.

The DLQ is not a bin. It needs an owner, an alert on its depth and on its oldest message's age, and a **redrive** procedure that moves messages back into the main path after a fix. Redrive should reuse the original message id, so idempotent consumers deduplicate anything that partially succeeded, and should be rate-limited, so 10,000 replayed messages do not arrive as a second outage. SQS provides a built-in redrive to source; other systems need a small tool.

@fig sd_q_dlq | The dead-letter lifecycle. A message enters with its error context, waits for a fix, and is redriven with its original id at a bounded rate.

Ordered streams need one more decision. If a message for match 7 goes to the DLQ, should later messages for match 7 continue? For independent facts, yes. For a ledger, no: applying entry 43 after skipping entry 42 corrupts the balance, so the consumer must park the whole key until 42 is resolved. Write that choice down per topic, because the default in most libraries is to continue.

:::interview Interview lens
**"How do you handle a message that keeps failing?"** I bound attempts and record them durably so a crash loop still counts. Transient errors get delayed retries with exponential backoff and jitter outside the main path, so healthy messages keep flowing. After the limit, or immediately for a permanent error, the message goes to a dead-letter queue with its original bytes and error context. The DLQ has an owner and a depth alert, and after a fix we redrive at a bounded rate with the original ids so idempotent consumers absorb any partial work.
:::

:::key In one breath
Classify failures as transient, permanent or bug before retrying, and give every path an attempt limit. Retry transient failures with exponential backoff and jitter outside the main path, through message delays or retry topics, remembering that delayed retries break per-key order. A poison message blocks an ordered partition until it is counted out, so record attempts before processing. Dead-letter queues keep the original message and error context, need an owner and an alert, and are drained by a rate-limited redrive that reuses message ids.
:::

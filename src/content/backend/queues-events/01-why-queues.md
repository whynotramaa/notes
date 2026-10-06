@part I | Why work leaves the request | We take slow and fragile chores out of the request path and hand them to a queue. The user waits only for what they need, and the chores retry on their own schedule when something fails. We will cover the cost of doing everything inline, the roles of producer, broker and consumer, and the three common shapes of broker. | where:1

## 1. The slow synchronous path

Wren's first version of `POST /orders` did everything before replying. It saved the order, sent a confirmation email through the email provider, rendered a receipt PDF, and called the restaurant's kitchen system. Saving took 20 ms. The email took 300 ms, the PDF 800 ms and the kitchen call 200 ms. The customer stared at a spinner for 1,320 ms, and almost all of that time was spent on work they were not waiting for. They wanted to know the order was placed. The receipt could have arrived a minute later.

@fig be_q_sync_path | Inline, the user waits 1,320 ms for chores. With a queue, they wait 25 ms for the order and a ticket on the rail.

Latency is the smaller problem. The bigger one is coupling. Each of those three dependencies is available 99.9% of the time. In series, the request succeeds only when all three do, 0.999 × 0.999 × 0.999 = 0.997, so about 0.3% of orders fail, three times the failure rate of any single dependency. Worse, a slow email provider makes order placement slow, and an outage at the PDF service stops orders entirely. A food order failing because a receipt could not be rendered is exactly the wrong priority.

@fig be_q_availability | Three 99.9% dependencies in a row give 99.7%. Behind a queue they stop affecting the request.

The fix is a **background job**. The request saves the order and records a description of each chore, "send receipt for order 124", in a **queue**, then replies. Separate **worker** processes take jobs from the queue and do them. If the email provider is down, the job waits and retries, and the customer's order was placed long ago. Wren's order request now takes 25 ms, and its success depends on the database and the queue alone.

Moving work out of the request changes what "done" means. When the API returns 201, the order exists but the receipt may not have been sent yet. That is usually fine, and it must be designed for. The app shows "receipt on its way", the support team can see job status, and Part III makes sure the receipt is sent even if a worker crashes. The rule of thumb is to do in the request only what the response depends on, and to queue everything else, especially anything slow, anything that calls a third party, and anything that can be retried.

## 2. Producers, brokers, consumers and acknowledgements

A queueing system has a small vocabulary that every broker shares. A **producer** creates messages, here the order API. A **message** is a small record, usually JSON or a binary format, that describes something to do or something that happened. When it describes work, people often call it a **job**. A **broker** stores messages and hands them out, RabbitMQ, Amazon SQS, Kafka or Redis in Wren's world. A **consumer** reads messages and acts on them. In job systems the consumer is usually called a worker.

@fig be_q_roles | The producer drops a letter in the box. A worker collects it later and signs for it.

The key idea is that producer and consumer never talk directly. The producer needs the broker to be up, not the worker. The worker can be down for an hour, deploying, or overloaded, and messages wait. Ten workers can share the load, and adding an eleventh needs no change to the producer. This **decoupling** in time, in availability and in scale is why queues are everywhere in backends.

The broker needs to know when a message has been handled, so it can forget it, or redeliver it if the consumer dies. The consumer tells it with an **acknowledgement**, an ack. In RabbitMQ the consumer sends `basic.ack` with the delivery tag. In SQS it calls `DeleteMessage`. In Kafka it commits an offset, Part V. A message that has been delivered but not acknowledged is **in flight**, and every broker has a rule for what happens if the ack never comes. That rule, and the moment the consumer chooses to ack, decide whether messages can be lost or duplicated, the subject of Part III.

Some brokers also support a **negative acknowledgement**, a nack, where the consumer says "I could not handle this", and the broker requeues the message or routes it to a dead-letter queue. Workers should nack, or let the visibility timeout expire, rather than silently drop a message they failed to process.

## 3. Three shapes of broker

Brokers differ in who decides where a message goes, who moves it, and what happens to it after it is read.

**RabbitMQ**, first released in 2007 and built on the AMQP protocol, is a smart broker. Producers publish to an **exchange**, which routes each message to one or more queues according to bindings and routing keys. A direct exchange routes by exact key, a topic exchange by patterns such as `order.*.paid`, and a fanout exchange copies to every bound queue. The broker pushes messages to connected consumers, up to a prefetch limit, and deletes each message when it is acknowledged. It is strong at flexible routing and per-message acknowledgement.

@fig be_q_designs | An exchange that routes, a queue that hides messages while they are being worked on, and a log that consumers bookmark.

**Amazon SQS**, launched in 2004 and one of AWS's first services, is a fully managed queue. Consumers poll with `ReceiveMessage`, and a received message becomes invisible to others for a visibility timeout. If the consumer deletes it in time, it is gone. If not, it reappears and another consumer gets it. Standard queues offer nearly unlimited throughput, at-least-once delivery and only best-effort ordering. FIFO queues guarantee order within a message group and deduplicate within a 5-minute window, at lower throughput. Its strength is zero operations, since there is nothing to run.

**Kafka**, created at LinkedIn and open-sourced in 2011, is a **log**, not a queue. Messages, called records, are appended to partitions and kept for a retention period, days or forever, whether or not anyone has read them. Consumers do not remove records. They keep a position, an offset, and any number of independent consumer groups can read the same records at their own pace, or rewind and read them again. Parts V to VII cover it in depth. Redis Streams, from Unit VII, follow the same log design on a smaller scale.

The practical choice usually follows the job. Background tasks that need routing and retries suit RabbitMQ or SQS. Event streams that many services consume, that need replay, or that run at hundreds of thousands of messages per second suit Kafka. Wren runs SQS for jobs such as receipts and Kafka for order events.

:::story Picture this
A restaurant kitchen's ticket rail. The waiter clips an order ticket to the rail and goes back to the customer. Cooks take tickets as they free up, and a cook who drops a ticket leaves it on the counter for someone else. The waiter never waits for the cook, and the cook never waits for the waiter. The rail is the broker.
:::

:::note Little's law for workers
Workers are sized the same way as connection pools in Unit VI. Receipts arrive at 50 per second at peak and each email takes 0.3 s, so 50 × 0.3 = 15 emails are in progress on average, and 15 workers are the minimum. PDFs at 0.8 s need 50 × 0.8 = 40. Add headroom for bursts and retries.
:::

:::warn Watch out
Moving a chore to a queue moves its failures out of sight. A request that failed showed an error. A job that fails is silent unless someone measures queue depth, job failure rates and dead letters. Every queue needs those three on a dashboard before it carries real work.
:::

:::interview Interview lens
**"Why would you put a queue between the API and the email service?"** To keep the request fast and its availability independent of slow or flaky dependencies. Inline, the user waits for every chore and the request fails if any dependency fails, three 99.9% services in series giving 99.7%. With a queue, the API saves the order, enqueues jobs and replies in milliseconds, workers process jobs at their own pace, failures retry without affecting users, and workers scale independently. The cost is eventual completion, which needs monitoring and idempotent workers.
:::

:::key In one breath
Doing every chore inside the request makes users wait 1,320 ms instead of 25 ms and multiplies availabilities to 99.7%, so slow, third-party and retryable work moves to background jobs. Producers put messages into a broker, consumers or workers take them and acknowledge them, and the two never talk directly, which decouples them in time, availability and scale. RabbitMQ routes through exchanges and pushes, SQS hides messages for a visibility timeout while consumers poll, and Kafka keeps a replayable log that consumers bookmark.
:::

@part II | Queues, pub/sub and event streams | Three topologies hide behind the word "queue", and they answer different questions about who receives a message and when it disappears. Picking the wrong one either duplicates work or silently starves a reader. We will compare competing consumers, fan-out subscriptions and retained logs, then look at the producer and consumer ends that every topology shares. | where:2

## 5. Message queues and competing consumers

Heron has 200 transcoding workers and one stream of transcode commands. Each command should be done once, by whichever worker is free. That is the classic **point-to-point queue**: many workers read from one queue, and each message goes to exactly one of them at a time. The workers are called **competing consumers** because they compete for the next message.

The broker keeps a set of ready messages. When a worker asks for work, the broker hands it the oldest ready message and marks it in flight for that worker. When the worker acknowledges success, the broker deletes the message. If the worker dies or its lease expires first, the message returns to the ready set and another worker gets it. Nothing in this flow requires the producer to know how many workers exist.

Competing consumers scale nearly linearly while the work is independent. With 200 workers at 30 seconds a job, Heron completes $200/30\approx6.67$ jobs per second; doubling to 400 workers doubles that, as long as the database and object store keep up. The price is ordering. Messages 1, 2 and 3 can go to three different workers and finish in the order 2, 3, 1. A plain queue promises that each message is delivered, not that effects happen in submission order.

@fig sd_q_competing | One queue, three workers. Each message has one current owner; finish order depends on job length, not arrival order.

Amazon SQS standard queues, RabbitMQ classic queues and Redis lists with a blocking pop all implement this shape with different durability and ordering details. SQS FIFO queues and RabbitMQ single-active-consumer modes add ordering by restricting parallelism, which Part III explains in terms of partitions.

:::story Picture this
A deli counter with a ticket dispenser and five servers. Each ticket is called once, by whichever server is free. Three customers who took tickets 41, 42 and 43 can leave in any order, because a sandwich order and a whole party platter take different times.
:::

## 6. Publish/subscribe: every subscriber gets a copy

When a goal is scored, three independent parts of Heron care: the live gateway pushes it to viewers, the search indexer updates the match page, and analytics counts it. Sending the event to a work queue would give it to only one of them. **Publish/subscribe**, or pub/sub, routes each published message to every subscription. The publisher writes to a **topic**, a named channel, and each subscriber receives its own copy.

The important unit is the subscription, not the subscriber process. A subscription has its own backlog and its own progress. If the analytics subscription is slow, its backlog grows while the live gateway's stays empty. Within a subscription you can still have competing consumers: the search subscription might have four indexer processes sharing its copy of the stream.

The arithmetic is multiplication. Heron's 20 score events per second with 3 subscriptions produce $20\times3=60$ deliveries per second. Add a fourth subscriber and the broker's delivery work rises by a third without the publisher changing a line. That independence is the main design benefit: a new reader subscribes without a deploy of the scorer.

@fig sd_q_fanout | One topic, three subscriptions. Each subscription has its own backlog; inside the search subscription, two workers compete.

Pub/sub has a sharp edge around timing. In a non-durable system such as Redis Pub/Sub, a message published while a subscriber is disconnected is simply gone for that subscriber. Google Cloud Pub/Sub, SNS fanning out to SQS queues, and RabbitMQ fanout exchanges bound to durable queues all keep a per-subscription backlog instead. A subscription created after the publish still receives nothing older than its creation unless the system retains history, which is where streams come in.

:::warn Watch out
"We use pub/sub" does not say whether a disconnected subscriber loses messages. Ask whether each subscription is durable, how long its backlog is kept, and what happens to a subscription created after the event. Redis Pub/Sub and a durable subscription answer those three questions in opposite ways.
:::

## 7. Event streams: a retained, replayable log

Analytics finds a bug in its goal counter from last Tuesday. A queue deleted those messages after acknowledgement, and the pub/sub backlog is gone too. To recompute, analytics needs the events themselves, in order, again. An **event stream** keeps messages in an append-only **log** for a retention period, and readers track their own position in it rather than deleting what they read.

Reading a stream is like reading a file with a bookmark. Each message has a sequential position, and each reader stores the position it has processed. Two readers at different positions do not interfere. To reprocess, a reader moves its bookmark back. Deleting happens by retention policy, for example "keep 7 days", not by consumption.

Retention costs disk. Heron's 20 events per second, kept for 7 days, is $20\times86{,}400\times7=12{,}096{,}000$ events. At 200 bytes each that is 2,419,200,000 bytes, about 2.4 GB of payload before replication and indexes. That is cheap for score events and expensive for video frames, which is why streams carry references to large objects rather than the bytes themselves.

@fig sd_q_log | A retained log with two readers at different positions. Reading moves a bookmark; it does not delete the record.

Apache Kafka, Amazon Kinesis, Redis Streams, Apache Pulsar and NATS JetStream implement this model. Streams make replay, auditing and new projections easy, and they keep strict order within a partition. They also push more responsibility onto readers: a reader must store its position durably, and a reader that falls behind longer than retention loses data it never processed.

:::note Queues that look like logs
The boundary between these products keeps moving. RabbitMQ added streams in version 3.9, Kafka 4.0 introduced share groups as an early-access feature for queue-style consumption, and SQS can emulate fan-out through SNS. Classify a design by its contract, who receives each message and when it is deleted, rather than by the product's name.
:::

## 8. Choosing between queue, pub/sub and stream

The three topologies differ on four questions. Who receives a message: one worker, every subscription, or every reader that asks. When is it deleted: on acknowledgement, on acknowledgement per subscription, or on retention expiry. Can a reader go back in time. And what order do readers see.

| Property | Work queue | Pub/sub | Event stream |
|---|---|---|---|
| Receivers per message | one worker | one per subscription | any reader, any time |
| Deleted when | worker acknowledges | each subscription acknowledges | retention expires |
| Replay of old messages | no | no | yes, within retention |
| Order | weak once parallel | per subscription, often weak | strict per partition |
| Typical use | commands, jobs | notifications, fan-out | event history, projections |
| Heron example | transcode clip | score to three services | score history for analytics |

Heron uses two of them. Transcode commands go to a work queue, because each clip should be transcoded once and order does not matter. Score events go to a stream, because three services read them independently, the gateway needs per-match order, and analytics wants replay. A pub/sub service without retention would be enough for the gateway alone, but the stream serves all three.

@fig sd_q_choose | Reader contracts compared. Orange marks retained replay for Heron's score events; clip commands use competing consumption.

The decision usually follows the message kind from Section 3. Commands have one owner, so they go to a queue. Events have many readers, so they go to pub/sub or a stream, and the stream wins when anyone needs replay or a new reader must catch up on history. A command that must be processed in order per key, such as "apply ledger entry", pushes you toward a partitioned stream or a FIFO queue with a group key.

:::interview Interview lens
**"Would you use Kafka or SQS here?"** I answer with the contract first. If each message is a job done once and order does not matter, a work queue like SQS is simpler: per-message acknowledgement, built-in redelivery, no offsets to manage. If several services read the same events, need per-key order, or need replay, I want a retained log like Kafka. Then I name the cost I accept, for example offset management and partition planning for Kafka, or no replay for SQS.
:::

## 9. Producers and consumers in practice

So far a producer "sends" and a consumer "receives". Both ends have real mechanics that decide latency, throughput and correctness. A **producer** is any process that publishes messages. A **consumer** is any process that reads them. The broker sits between them and owns durability.

A careful producer waits for a **publisher confirm**, the broker's acknowledgement that it has stored the message durably. Without it, a broker crash right after the send loses the message while the producer believes it succeeded. Waiting for each confirm one at a time is slow, so producers batch: collect messages for a few milliseconds, send them together, and receive one confirm for the batch. A producer that times out waiting for a confirm does not know whether the message was stored, and a retry can create a duplicate. That is the first of many places where duplicates enter a message system.

Consumers come in two styles. In a **push** model the broker sends messages to the consumer as they arrive, as RabbitMQ does with a subscription. In a **pull** model the consumer asks for messages, as SQS and Kafka do. Push gives lower latency when idle; pull lets the consumer control its own rate. Both need a limit on unacknowledged messages held by one consumer, called **prefetch**. With a prefetch of 10, the broker sends at most 10 messages before receiving acknowledgements.

@fig sd_q_prefetch | Prefetch bounds how much work a consumer holds. A crash with 10 prefetched messages returns all 10 for redelivery; a prefetch of 1000 would make one slow worker hoard work.

Prefetch is a fairness and recovery setting. Too small, and the worker idles waiting for the next message after every acknowledgement. Too large, and one slow worker sits on hundreds of messages while others are idle, and a crash puts all of them back in flight only after a timeout. For 30-second transcodes, a prefetch of 1 or 2 is sensible. For 5-millisecond score updates, a prefetch in the hundreds keeps the pipe full.

:::key In one breath
A work queue gives each message to one of many competing consumers and deletes it on acknowledgement. Pub/sub gives every subscription its own copy and backlog, so deliveries multiply by subscriptions. An event stream retains an ordered log and lets each reader keep a bookmark, which enables replay at the cost of retention and position management. Producers need publisher confirms and batching, consumers need a bounded prefetch, and a timed-out confirm is already a possible duplicate.
:::

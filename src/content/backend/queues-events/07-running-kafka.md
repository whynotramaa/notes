@part VII | Running Kafka | We deal with the problems that show up once Kafka carries real traffic. Lag, ordering and partition choices cause most of the incidents application teams see. We will cover measuring and recovering from consumer lag, ordering and partition keys including hot partitions, and how Kafka compares with the other brokers. | where:7

## 20. Consumer lag

Consumer lag is the distance between the newest record in a partition and the group's committed position, summed across partitions. A healthy group's lag hovers near zero, rising briefly during bursts and deploys. A group whose lag climbs steadily is processing slower than records arrive, and it will not recover by itself.

Lag in records is easy to measure and hard to interpret. A lag of 3,000 means seconds at Wren's peak and minutes at 4 a.m. Lag in time, the age of the oldest unprocessed record, is what matters to the business. Tools such as Burrow, Kafka's own consumer group command and most managed services report both, and Wren alerts on time.

Take the syllabus scenario. Wren's analytics loader writes events to the data warehouse. A schema change in the warehouse makes its inserts slow, and it falls 6 hours behind before anyone notices. Events arrive at an average of 150 per second, so the backlog is 150 × 21,600 = 3,240,000 records. The loader runs 3 consumers that together manage 200 records per second once the warehouse is fixed. The surplus is 200 − 150 = 50 per second, so catching up takes 3,240,000 ÷ 50 = 64,800 s, 18 hours, during which the dashboards are stale.

@fig be_kafka_lag | Six hours behind. Three consumers take 18 hours to catch up. Twelve take 83 minutes.

Scaling helps up to the partition count. With 12 consumers, one per partition, each still at about 67 records per second, the group handles about 800 per second, a surplus of 650, and catches up in 3,240,000 ÷ 650 ≈ 4,985 s, about 83 minutes. Beyond 12 consumers nothing improves without more partitions. Other levers are larger batches into the warehouse, which often matter more than consumer count, and parallel processing within each consumer while keeping per-key order.

Three checks belong in every lag incident. Is the consumer stuck rather than slow, for example retrying one poison record forever? Check whether its offsets move at all. Is the lag uneven across partitions? One hot partition behind and eleven at zero means a key problem, not a capacity problem. And how close is the oldest unprocessed record to the retention limit? If the loader had fallen 7 days behind, its oldest records would be deleted, and the warehouse would have a permanent gap to backfill from another source.

## 21. Ordering and partition keys

Kafka guarantees order within a partition, so the key decides which records are ordered relative to each other. Choosing it is a design decision with consequences for correctness, parallelism and balance.

Key by the entity whose events must stay in order. Wren keys `order-events` by order id, so each order's placed, paid, accepted and delivered events stay in sequence, and with tens of thousands of active orders, records spread evenly over 12 partitions. Keying by user id would also keep each order's events in order, since an order belongs to one user, and would additionally order a user's orders relative to each other, at the cost of coarser distribution. Keying by nothing would spread load perfectly and lose all ordering.

Changing the partition count breaks the key mapping. The partitioner computes hash modulo partition count, so going from 12 to 16 partitions moves most keys. `order-123` stays in partition 1, but `order-124` moves from 11 to 3, and `order-125` from 3 to 7. Events for order 124 produced before the change sit in partition 11, and events produced after it go to partition 3, which a different consumer may read sooner. For a short window, per-key order is broken.

@fig be_kafka_ordering | From 12 to 16 partitions, order-124 moves from partition 11 to 3, and its old and new events are split.

Teams handle this by choosing a generous partition count up front, adding partitions rarely and in quiet periods, or creating a new topic with more partitions and migrating consumers over. Order-tolerant consumers, using per-entity versions as in Part IV, make the window harmless.

A **hot partition** is one partition receiving far more traffic than the others, usually because one key is far more active. If Wren keyed restaurant events by restaurant id, restaurant 9's Friday promotion would push thousands of events into one partition, and the consumer assigned to it would fall behind while the other eleven sat idle.

@fig be_kafka_hot_partition | Keyed by restaurant, one promotion floods one partition.

The fixes trade ordering scope for spread. Key by a finer entity, order rather than restaurant, if per-restaurant ordering is not truly needed. Or **salt** the hot key, appending a small suffix such as `restaurant-9#3` chosen per order, so the restaurant's events spread over several partitions and stay ordered within each suffix. Consumers that need the restaurant's full picture then merge streams.

## 22. Choosing between brokers

Brokers are not interchangeable, and the useful comparison asks a few concrete questions. What happens to a message after it is read? How is ordering defined? Can consumers replay? What is the unit of scaling? Who runs it?

RabbitMQ deletes messages on acknowledgement, orders per queue, cannot replay, and scales by queues and consumers. Its strength is routing, with exchanges, bindings, priorities and per-message acks. RabbitMQ 3.9 added streams, a log-like queue type, which narrows the gap. It suits task queues with complex routing and moderate volume.

SQS deletes on `DeleteMessage`, offers best-effort ordering in standard queues and strict ordering per message group in FIFO queues, cannot replay, and scales automatically. Its strength is that there is nothing to operate. It suits background jobs on AWS where routing is simple.

@fig be_q_compare | Four systems compared on what happens after a read, ordering, replay and scaling.

Kafka keeps records for a retention period, orders per partition, replays from any offset, and scales by partitions. Its strengths are throughput, durable history, many independent consumers and an ecosystem of connectors, stream processing and schema tools. It suits event streams, change data capture, log aggregation and pipelines. It is a poor fit for per-message delays, per-message routing and priority, and it needs real operational care, or a managed service.

Redis Streams keep entries until trimmed, order per stream, replay by id, and scale by streams and Redis Cluster. They suit modest event volumes in a system that already runs Redis, with the durability caveats of Unit VII.

Kafka is not "another queue", and this is the answer the syllabus asks for. A queue is a buffer between a producer and its workers. Messages are tasks, each handled once, and then gone. A log is a shared, ordered, durable history. Records are facts, read by any number of consumers, any number of times. Wren uses SQS for jobs that someone must do once, such as sending a receipt, and Kafka for facts that many services care about, such as an order being placed. The receipt job may well be triggered by a Kafka event, consumed by a small service that enqueues the SQS job.

:::story Picture this
A hospital uses two kinds of paper. Task slips, "take blood from bed 12", go into a tray, a nurse takes one, does it and throws it away. The patient's chart is different. Every observation is added in order, nothing is removed, and doctors, nurses and pharmacists each read it at their own pace, sometimes going back days. A queue is the tray. Kafka is the chart.
:::

:::note Measuring lag correctly
Lag reported in records summed across partitions hides skew, so look at per-partition lag too. And lag measured from committed offsets overstates it for consumers that commit infrequently. Wren's dashboard shows per-partition lag, time lag of the oldest unprocessed record, and the consumer's processing rate side by side.
:::

:::warn Watch out
Choosing a partition count by today's traffic and growing it later breaks per-key ordering during the change. Pick a count with room for years of growth, such as 12 or 24 for a moderate topic, since partitions are cheap until there are many thousands in a cluster.
:::

:::interview Interview lens
**"A Kafka consumer is six hours behind. What do you do?"** First find out whether it is stuck or slow, by checking whether committed offsets move and whether lag is even across partitions. Fix the cause, such as a slow downstream or a poison record. Then compute catch-up time from the surplus rate, backlog divided by processing rate minus arrival rate, and scale consumers up to the partition count, increase batch sizes, or parallelize within consumers. Watch the oldest unprocessed record against retention, and if data will be lost, plan a backfill.
:::

:::key In one breath
Consumer lag is the gap between the newest record and the committed position, and lag in time matters more than in records. A loader 6 hours behind at 150 events per second holds 3,240,000 records, takes 18 hours to catch up with a surplus of 50 per second and 83 minutes with 12 consumers, and must never fall past retention. Keys define order, adding partitions moves keys such as `order-124` from 11 to 3, and hot keys make hot partitions, fixed by finer keys or salting. Queues hold tasks done once and deleted, Kafka holds a durable log of facts read by many consumers, which is why Wren uses SQS for jobs and Kafka for events.
:::

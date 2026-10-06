@part V | Kafka fundamentals | We open Kafka and find a distributed, replicated log rather than a queue. Its design choices, partitions, offsets and retention, explain both its throughput and the rules that application code must follow. We will cover topics, partitions and offsets, how producers choose partitions and batch records, and how consumer groups divide the work and track their place. | where:5

## 13. The log: topics, partitions and offsets

Kafka stores records in **topics**, named streams such as `order-events`. A topic is split into **partitions**, and each partition is an ordered, append-only log stored on disk. Wren's `order-events` has 12 partitions. A record appended to a partition gets the next **offset**, a sequence number unique within that partition, starting at 0. Partitions are spread across **brokers**, the Kafka servers, so different partitions are read and written on different machines in parallel.

@fig be_kafka_log | Three partitions, each its own log. The kitchen group and the analytics group read at their own positions.

Reading does not remove anything. A consumer reads from an offset forward, and the records stay until the **retention** period expires, 7 days for Wren, or forever on compacted topics, Part VI. That single decision separates Kafka from a queue. Two different services, the kitchen and analytics, can each read every record at their own pace. A new service added next month can start from the oldest retained record and catch up on a week of history. A consumer with a bug can be fixed and **replayed** from an earlier offset to reprocess what it got wrong.

@fig be_kafka_not_queue | A queue deletes on acknowledgement. A log keeps records for days and lets every reader keep its own place.

The design is also why Kafka is fast. Appending to the end of a file and reading it sequentially are the operations disks and operating systems handle best. Kafka leans on the page cache instead of its own cache, batches everything, and sends data from the file to the network socket with `sendfile`, a zero-copy system call. A modest cluster handles hundreds of thousands of records per second, and Wren's 250 events per second at peak barely registers.

Ordering is guaranteed within a partition and nowhere else. Records in partition 1 are read in the order they were written. Records in partition 1 and partition 4 have no defined order relative to each other. That is the price of parallelism, and choosing which records share a partition, through the key, is the most important design decision a Kafka user makes.

Kafka originally used ZooKeeper to store cluster metadata and elect a controller. **KRaft**, Kafka's own Raft-based metadata quorum, replaced ZooKeeper, and Kafka 4.0 in 2025 removed ZooKeeper support entirely. For application developers the change is invisible, and for operators it means one system to run instead of two.

## 14. Producers, keys and batching

A producer sends each record to a topic with an optional **key** and a value. The key decides the partition. Kafka's default partitioner hashes the key's bytes with murmur2, takes the result as a positive number, and computes it modulo the partition count. For Wren's 12 partitions, `order-123` lands in partition 1, `order-124` in partition 11 and `order-125` in partition 3. Every event with key `order-123`, placed, paid, accepted, delivered, lands in partition 1, so a consumer sees them in the order they were produced.

@fig be_kafka_partitioner | The same key always lands in the same partition, which is what keeps one order's events in order.

Records without a key are spread across partitions. Since Kafka 2.4, the default sticky partitioner fills a batch for one partition before moving to the next, which gives larger batches than strict round robin. Use no key only when order between records does not matter at all.

The producer does not send each record alone. It collects records into a **batch** per partition in memory and sends a batch when it reaches `batch.size`, 16 KB by default, or when `linger.ms` has passed since the first record arrived. Since Kafka 4.0 the default `linger.ms` is 5 ms, earlier versions defaulted to 0. Waiting a few milliseconds lets more records join, and compression, with `compression.type` set to lz4 or zstd, works on whole batches, so larger batches compress better. A Wren event of 1 KB of JSON compresses to a few hundred bytes in a batch of similar events.

@fig be_kafka_batching | Records gather per partition until the batch fills or 5 ms pass, then go together.

Batching is a throughput and latency trade. More linger gives fewer, larger requests, less CPU and better compression at the cost of a few milliseconds per record. For Wren's order events, 5 ms is invisible. For a chat system, a team might lower it.

The producer's `send` call is asynchronous. It returns at once with a future, and the callback fires when the broker acknowledges or the send fails after retries. Code that ignores the callback, or a process that exits without calling `flush()`, silently loses the records still in the buffer. Wren's outbox relay, Part IX, waits for every acknowledgement before marking outbox rows as sent.

## 15. Consumer groups and offsets

A **consumer group** is a set of consumers sharing one job, identified by a `group.id`. Kafka assigns each partition of a topic to exactly one consumer in the group, so the group divides the partitions among its members. Wren's kitchen service runs three consumers in the group `kitchen`, and each owns 4 of the 12 partitions. Within a partition, one consumer reads records in order. Across partitions, three consumers work in parallel.

@fig be_kafka_groups | Twelve partitions across three kitchen consumers, four each. A thirteenth consumer would sit idle. The analytics group reads everything separately.

The partition count therefore caps a group's parallelism. A thirteenth consumer in a 12-partition topic gets nothing to do. If the kitchen needs more throughput than 12 consumers can give, the options are faster consumers, more partitions, which has costs covered in Part VII, or processing records in parallel inside each consumer while preserving per-key order. Different groups are entirely independent. The analytics group reads all 12 partitions with one consumer, at its own pace, and its position has no effect on the kitchen.

Each group records its progress by **committing offsets**, storing for each partition the offset of the next record it will read. The commits live in an internal Kafka topic, `__consumer_offsets`. When a consumer restarts, or its partitions move to another consumer, reading resumes from the last committed offset.

@fig be_kafka_offsets | Committed at 405, crashed while processing 409. Records 405 to 408 are read again.

When the commit happens decides the delivery guarantee, exactly as with acks in Part III. Committing after processing gives at-least-once, so a crash replays records processed since the last commit. Committing before processing gives at-most-once. The default, `enable.auto.commit=true`, commits periodically in the background, every 5 s, which can commit offsets for records the application has fetched but not finished, risking loss on a crash. Wren turns auto-commit off and commits explicitly after each batch is processed, with idempotent processing making the replays harmless.

A group's position compared with the end of each partition is its **consumer lag**, the number of records produced but not yet processed. Lag is the single most important Kafka metric for an application team, and Part VII is about what to do when it grows.

:::story Picture this
A ship's logbook that is never torn up. Every event is written on the next line with a line number. The navigator, the cook and the purser each keep their own bookmark and read at their own speed. A new officer who joins mid-voyage can start reading from any page still in the book. Tearing out pages after a week is retention.
:::

:::note Why keys usually beat explicit partitions
A producer can name a partition directly, but that hard-codes the partition count into the application. Keys let the partitioner do the work, keep related records together, and leave the topic's layout to configuration. Custom partitioners exist for special cases, such as spreading one hot key, Part VII.
:::

:::warn Watch out
Forgetting to call `flush()` or `close()` on a producer before a process exits loses whatever is still batched in memory, which with linger and batching can be thousands of records. Shut producers down cleanly on SIGTERM, and treat a failed send callback as an error that must be handled, not logged and ignored.
:::

:::interview Interview lens
**"Explain Kafka partitions and consumer groups."** A topic is split into partitions, each an append-only log with its own offsets, spread across brokers for parallelism. The record key's hash picks the partition, so records with the same key stay ordered. A consumer group divides partitions among its members, one consumer per partition, so parallelism is capped by the partition count, while separate groups read the same data independently. Groups commit offsets, and committing after processing gives at-least-once delivery.
:::

:::key In one breath
Kafka stores topics as partitioned, append-only logs on disk, records get per-partition offsets, and reading removes nothing, so many groups read at their own pace and can replay within the 7-day retention. Order holds only within a partition, and the key's murmur2 hash modulo 12 puts all of `order-123`'s events in partition 1. Producers batch per partition until 16 KB or 5 ms of linger and compress batches, and send asynchronously, so callbacks and flushes matter. Consumer groups give each partition to one member, capping parallelism at the partition count, and committing offsets after processing gives at-least-once delivery.
:::

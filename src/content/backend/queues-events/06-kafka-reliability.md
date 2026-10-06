@part VI | Kafka reliability | We make Kafka keep records through broker failures and producer retries. Replication, acknowledgement settings and idempotent producers decide what a "successful" send really means. We will cover replicas and the in-sync set, idempotent producers and transactions, consumer rebalancing, and retention with compaction. | where:6

## 16. Replicas, the ISR and acks

Each partition is stored on several brokers. One is the **leader**, which handles all writes and, by default, reads. The others are **followers**, which fetch the leader's new records and append them to their own copies. The number of copies is the **replication factor**, 3 for `order-events`, so each partition lives on three brokers and survives the loss of two in the best case.

Followers that are caught up with the leader form the **in-sync replica set**, the ISR. A follower that falls behind by more than `replica.lag.time.max.ms`, 30 s by default, because it is slow, paused or cut off, drops out of the ISR and rejoins when it catches up. If the leader fails, the controller elects a new leader from the ISR, so the new leader has every record that was committed.

@fig be_kafka_isr | The leader and broker 2 form the ISR. Broker 3 fell behind and dropped out until it catches up.

The producer chooses how much replication to wait for with **acks**. With `acks=0` it does not wait at all, fastest and able to lose records silently. With `acks=1` it waits for the leader to write the record, and a leader that fails before followers copy it loses it. With `acks=all`, the default since Kafka 3.0, it waits until every replica in the ISR has the record.

@fig be_kafka_acks | The more replicas must confirm, the more failures a record survives.

`acks=all` alone has a gap. If the ISR has shrunk to just the leader, "every in-sync replica" means one broker, and losing it loses the record. The topic setting **`min.insync.replicas`** closes the gap. With it set to 2, a write with `acks=all` succeeds only if at least two replicas, the leader and one follower, have it. If the ISR shrinks below 2, the leader rejects writes with `NotEnoughReplicas`, and producers retry. Wren prefers a brief write outage to a silent loss.

Replication factor 3 with `min.insync.replicas` 2 is the standard choice. It tolerates one broker down with writes still flowing, and a second failure stops writes rather than losing data. The last setting is `unclean.leader.election.enable`, false by default. If every ISR member dies, an out-of-sync replica could be made leader to restore availability, at the cost of losing the records it never received. Leaving it off chooses durability.

Like PostgreSQL in Unit VI, Kafka acknowledges a write once it is in memory on the required replicas, not necessarily on disk, and relies on replication rather than `fsync` for durability. A simultaneous power loss on all replicas could lose recent records. Spreading replicas across availability zones, with rack awareness, makes that far less likely.

## 17. Idempotent producers and transactions

Producer retries create duplicates. The producer sends a batch, the leader writes it, and the acknowledgement is lost on the way back. The producer, seeing a timeout, sends the batch again, and the partition now holds it twice. Retries can also reorder. If batch 1 fails and is retried after batch 2 succeeded, batch 2's records come first.

The **idempotent producer**, enabled by default since Kafka 3.0, fixes both. Each producer gets a producer id from the broker, and each batch carries a sequence number per partition. The leader remembers the last sequence numbers it accepted from each producer. A batch with a sequence number it has already seen is acknowledged and discarded. A batch that skips ahead is rejected, which preserves order. Producer retries become invisible.

@fig be_kafka_idempotent | The retried batch carries sequence 41 again, so the leader drops the duplicate.

That covers one producer's retries within one session. It does not help when the application itself publishes twice, such as an outbox relay that crashes after publishing and before marking the row sent, which is why consumers still need the inbox from Part III.

**Kafka transactions**, added in Kafka 0.11 in 2017, go further for a specific shape of work, read from one topic, process, and write to another. The processor uses a `transactional.id`, begins a transaction, produces its output records, adds the input offsets it consumed to the same transaction, and commits. Either the outputs and the offset commit both become visible, or neither does. If the processor crashes mid-transaction, the transaction is aborted, and the restarted processor resumes from the old offsets with no partial output.

@fig be_kafka_txn | Output record 24 and input offset 75 commit as one unit.

Consumers that read the output must set `isolation.level=read_committed` to skip records from aborted transactions. Kafka Streams and Flink use this machinery to offer exactly-once processing, with the boundary noted in Part III. It covers Kafka-to-Kafka work only. A processor that also writes to PostgreSQL or calls an API is outside the transaction, and those effects need their own idempotency.

The `transactional.id` also fences zombies. If a processor is presumed dead and a replacement starts with the same id, the broker bumps an epoch and rejects writes from the old instance, so a paused process that wakes up cannot commit stale work.

## 18. Rebalancing

A consumer group's partition assignment changes whenever a member joins, leaves, crashes, or is considered dead. Redistributing partitions is a **rebalance**. Every deploy causes several, as old consumers stop and new ones start, and autoscaling causes more.

In the original **eager** protocol, a rebalance stops the world. Every consumer gives up all its partitions, the group agrees a new assignment, and every consumer starts again. During that pause, seconds or more for a large group, nobody processes anything, and lag grows. A rolling deploy of ten consumers can cause ten pauses in a row.

@fig be_kafka_rebalance | The eager protocol stops every consumer. The cooperative protocol moves only the partitions that must move.

The **cooperative** protocol, available since Kafka 2.4 through the `CooperativeStickyAssignor`, moves only the partitions that need to move, and consumers keep processing the rest. Kafka 4.0 made a newer, broker-driven consumer group protocol generally available, designed in KIP-848, which reconciles assignments incrementally on the broker and removes most of the stop-the-world behaviour.

Two settings decide when a consumer is considered dead. `session.timeout.ms` covers liveness. If the broker receives no heartbeat, sent from a background thread, within it, 45 s by default, the consumer is removed. `max.poll.interval.ms`, 5 minutes by default, covers progress. If the application does not call `poll()` again within it, perhaps because processing one batch is taking too long, the consumer leaves the group even though its heartbeat thread is alive. A consumer that processes 500 records per poll at 1 s each needs 500 s and will be kicked out at 300 s, then rejoin, then be kicked out again, a **rebalance storm**. Smaller batches, with `max.poll.records`, or faster processing fix it.

**Static membership**, with a `group.instance.id` per consumer, lets a consumer that restarts within the session timeout reclaim its partitions without triggering a rebalance at all, which smooths rolling deploys.

When a partition moves, the consumer losing it should commit its offsets in the revocation callback, and the consumer gaining it starts from the last committed offset. Records processed but not committed are processed again, the at-least-once replay that idempotent consumers absorb.

## 19. Retention and compaction

Kafka keeps records until a retention rule removes them, and there are two kinds. **Delete retention**, the default, removes whole log segments, files of about 1 GB by default, once they are older than `retention.ms` or once the partition exceeds `retention.bytes`. Wren keeps `order-events` for 7 days, which defines how far back any consumer can replay.

Storage follows from the rates. At peak, 250 events per second of 1 KB each is 250 × 1,000 × 86,400 = 21.6 GB per day if the peak lasted all day, which gives an upper bound. With replication factor 3 and 7 days of retention, the cluster needs at most 21.6 × 3 × 7 = 453.6 GB for this topic, before compression, which usually cuts JSON several times over.

@fig be_kafka_retention | Delete retention drops whole days. Compaction keeps only the newest value for each key.

**Log compaction** keeps the latest record for each key and removes older ones, regardless of age. A compacted topic `restaurant-status`, keyed by restaurant id, eventually holds one record per restaurant, its current status. A new consumer reading from the beginning gets the current state of every restaurant without replaying years of changes. To delete a key, a producer writes a **tombstone**, a record with that key and a null value, and compaction removes the key entirely after `delete.retention.ms`, one day by default, which gives consumers time to see the deletion.

Compaction turns Kafka into a durable, replayable table. Kafka itself stores consumer offsets in a compacted topic. Change data capture topics, Part IX, are often compacted, keyed by primary key, so they act as a replica of a database table. Kafka Streams uses compacted changelog topics to restore its local state after a crash.

Retention is also a safety margin. If a consumer falls more than 7 days behind, the records it needs are deleted, and it either skips them or, depending on `auto.offset.reset`, jumps to the earliest or latest available offset. Wren alerts when any group's lag in time exceeds one day, so there are six days to fix a stuck consumer before data is lost. **Tiered storage**, generally available since Kafka 3.9, moves older segments to object storage, making long retention cheap.

:::story Picture this
Three clerks each keep a copy of a ledger. The head clerk writes each entry first and the others copy it, and an entry counts as recorded only when at least two of them have it. A clerk who falls behind is not trusted to take over until they catch up. Every week the oldest pages go into storage, except in the address book, where only each person's latest address is kept.
:::

:::note Partitions, replicas and brokers
A cluster's capacity is shaped by partition replicas per broker. Wren's 12 partitions with replication factor 3 means 36 replicas, 12 per broker on a three-broker cluster, with each broker leading about 4 partitions. Spreading leaders evenly, which Kafka does automatically, keeps load balanced.
:::

:::warn Watch out
`acks=all` with `min.insync.replicas=1`, the broker default, gives much weaker durability than it sounds, because the ISR can shrink to the leader alone without anyone noticing. Set `min.insync.replicas=2` on topics that matter, and alert on under-replicated partitions.
:::

:::interview Interview lens
**"How does Kafka avoid losing data when a broker dies?"** Each partition is replicated, typically three times, with one leader and followers. Followers that are caught up form the ISR, and only an ISR member can become leader. Producers use `acks=all` with `min.insync.replicas=2`, so a write succeeds only once at least two replicas have it, and writes stop rather than proceed with a single copy. Unclean leader election is off. Idempotent producers prevent duplicates from retries, and transactions make read-process-write cycles atomic within Kafka.
:::

:::key In one breath
Each partition has a leader and followers, the caught-up ones form the ISR, and only ISR members can become leader. `acks=all` with `min.insync.replicas=2` and replication factor 3 means a written record survives one broker loss, and writes stop rather than risk loss when the ISR shrinks. Idempotent producers deduplicate retries with producer ids and sequence numbers, and transactions commit output records and input offsets together for read_committed consumers. Rebalances should be cooperative, with static membership and batches that finish within `max.poll.interval.ms`, and retention deletes old segments while compaction keeps the latest value per key, with tombstones for deletes.
:::

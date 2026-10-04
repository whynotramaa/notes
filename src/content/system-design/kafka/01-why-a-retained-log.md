@part I | Topics, partitions and records | We start with two readers of the same score history. A queue that removes handled work cannot supply independent replay by itself. We will define records, topics, partitions, and the workload. | where:1

## 1. One event, independent readers

The score projector and notification service need the same update, but the projector restarts while notifications continue. A **retained log** stores an ordered history that readers can revisit independently. The source remains until retention policy removes it, rather than disappearing after one reader handles it.

Give each application its own progress and let it replay from that position after a crash. One slow application does not make another rewind, but its lag can exceed retention and then it needs another recovery source. Kafka’s public design is documented in the [Kafka 4.1 design chapter](https://kafka.apache.org/41/design/design/). This unit labels that version deliberately; it does not assert it is the newest release. The examples concern ordinary consumer groups, while share-group and newer protocol options have different ownership mechanics.

Stop the projector while notifications continue. Its committed group position remains behind, but notification progress can advance through the same retained source without deleting it. When the projector returns, it fetches from its own saved boundary and applies its protected effect rule. A notification checkpoint cannot repair the projector because those applications have different state and completion conditions. If the projector's required position has expired, restart needs a compatible snapshot or another reconstruction source. Independent reading therefore needs both separate progress and a retention-backed recovery contract.

@fig sd_kafka_01 | The rows show one retained score event feeding independent projector and notification histories; orange marks the notification reader's separate progress.

A broker alone does not establish that the producer’s authoritative database change and publication are atomic. That gap belongs to the source flow.

:::story Picture this
A museum keeps the same exhibit in its archive while a guide for school groups, a researcher, and a restorer each consults a copy of the catalogue at their own pace. A guide marking a page as read does not remove it for the researcher, and either reader can reopen an earlier page while the archive still keeps it. The archive eventually discards old catalogues under a retention rule, so a reader that waits too long needs another copy or a rebuild plan.
:::

## 2. Records, keys, and topics

A scorer produces a value describing a match change. A **record** is the key, value, timestamp, and optional headers carried as one logical log item. A **topic** names a set of partition logs with shared configuration and use.

The match identity can be the key so related events follow one partitioning rule. The payload holds the source version and domain meaning; diagnostic headers carry trace and causation context. Choose schema evolution deliberately because replay may read old values with new code. Topic-level retention and permissions should match the applications using that history. A record is not a transaction by default, and a topic is not one globally ordered sequence. The producer’s serialized bytes determine actual payload size.


For a score correction, keep the match key and the event identity separate. The key places related events together; the identity lets a projector recognize a repeated delivery. Two different corrections for the same match share a key but must not share the same event id. Conversely, a retried publication retains its event id even if the network attempt is new. The topic names a retained history for this event family, not one subscriber or one machine. Mixing those identities can either split related work across partitions or suppress a valid second change as a duplicate.

@fig sd_kafka_02 | The rows separate a record's key and value from its topic policy and consumer interpretation; orange marks schema-aware reading at the consumer.

Changing serialization without compatible readers can poison replay even while the broker correctly stores every byte.

:::note Schema and topic boundaries
Define key, value, schema, headers, and topic policy. Key choice can preserve aggregate locality, but topic identity does not create global order. Keep domain version and diagnostic context distinct.
:::

## 3. Partitions and ordering scope

Two matches update at the same time. A **partition** is one ordered log within a topic. Kafka assigns an offset within it, not one common position across the entire topic.

Under the illustrative four partitions and 20 events per second, balanced mean input is five events per second per partition. A match-key partitioning rule keeps a match’s events together only while that rule and partition mapping preserve the intended locality. Adding partitions can change hash-to-partition mapping for future records; old records remain where written. Consumers that merge several partitions need their own domain ordering rule. A hot match can dominate one partition even when the average looks balanced.

Follow a match whose future records change partition after a partition-count increase. Its old history remains on the previous log, while new records can arrive on the new log before the old consumer finishes. Partition-local ordering alone cannot order that combined history. Carry a domain version and use an explicit migration or draining boundary when the match requires sequential effects. Adding ordinary group members without adding partitions cannot create another owner for the same partition. A hot match remains a domain-locality problem even when other partitions have little work.

@fig sd_kafka_03 | Illustrative partition arithmetic spreads 20 events per second across four logs; orange marks ordering within one partition, not across the topic.

Equal offsets in different partitions identify different positions. Store topic, partition, and offset together when using source position as an effect identity.

:::warn Watch out
Partitioning provides parallel logs and partition-local order. Choose the key from the ordering requirement, consider skew, and plan partition-count changes. A merged topic reader must not invent a global sequence from unrelated offsets.
:::

## 4. The retained workload

Heron creates an assumed 20 events per second with 200 payload bytes each. Daily event count is 20 times 86,400, or 1,728,000, and daily payload is 345,600,000 bytes. Seven days with three copies gives 7,257,600,000 payload bytes before representation overhead.

A **retention horizon** is the period or size policy that bounds accessible history. Size disks for batch encoding, indexes, segment overhead, replication, and operational headroom as well as payload. Kafka can retain by time, size, or use compaction under topic policy. The recovery question is how much lag a consumer can tolerate before its required source position is no longer present. Traffic bursts and skew can make a size-based policy shorten the time horizon.

A slow reader's committed offset does not reserve its source segments forever. Compare the earliest retained position with its needed restart position before claiming replay is available. A time policy and a size policy can produce different effective history under a burst, and full payload copies do not include segment or index costs. The illustrated seven-day calculation counts retained event payload under its declared assumptions. Recovery still needs a usable initial projection state and compatible interpretation of that history. Disk capacity and reader recoverability are related requirements, rather than interchangeable totals.

@fig sd_kafka_04 | Illustrative retention arithmetic counts 1,728,000 daily events, 345,600,000 bytes per day, and three copies for seven days; orange marks replicated storage before overhead.

The simple byte calculation is not a benchmark or full disk budget. Compression, segment layout, indexes, and recovery headroom remain separate measured costs.

:::interview Interview lens
**"How would you size and protect a retained log for independent readers?"** I would compute event count, payload, retention, and copies separately. Retention bounds replay independently of consumer success. A size limit can change the effective time window when traffic grows. I would therefore pair the policy with the observed log start and a recovery plan.
:::

:::key In one breath
Kafka stores retained partition logs for independent readers. Order is partition-local, and consumer progress does not delete the source. Choose a log when replay and several independently paced readers justify its operations.
:::

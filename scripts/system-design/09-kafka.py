from author import publish
raw=r'''
@part A log, not a disappearing job | We keep events after one reader processes them. Retained history lets another reader rebuild independently. We will define topics, partitions, and brokers.

## Topics and partitions

A search index needs yesterday's score history even though live delivery already sent it. A **topic** names a family of records; a Kafka **partition** stores one ordered log within that topic. Consumers advance positions without deleting the records for everyone else. A key commonly determines partition placement under the producer's chosen partitioner.

## Brokers and storage

A **broker** serves partition leaders or replicas and stores log data. It batches records into segments, using append-oriented storage and operating-system page caching. A broker is not one topic or one partition. Capacity depends on bytes, partitions, clients, replication, and disk/network limits, not topic count alone.

@draw log | rows | READ PROGRESS DOES NOT DELETE THE SHARED HISTORY | [["log","offset 0","offset 1","offset 2"],["reader A","passed","passed","next"],["reader B","next","later","later"]] | Illustrative retained partition and independent reader positions. | each reader owns its progress

:::key In one breath
A topic contains independently ordered partitions. Brokers store and serve their leaders and replicas. Consumer progress does not determine global record deletion. Retention makes replay a storage obligation.
:::

@part Ordering and parallelism | We decide which records must stay together. More partitions improve some parallel work while splitting order. We will trace key placement and consumer ownership.

## Keyed ordering

Heron sends one match's events with a stable match key so they enter the same partition under a stable placement policy. Order is the partition's append order, not automatically business event time. Multiple producers can race; include an authoritative sequence if the consumer must detect gaps or stale events.

## Consumer groups

A consumer group assigns partition ownership to cooperating consumers. In the standard ordered group model, one member processes a partition at a time. Independent live and search groups each read the same topic at their own positions. Rebalance changes ownership, so unfinished work needs safe recovery and revocation handling.

@draw groups | fan | INDEPENDENT ROLES NEED DIFFERENT GROUPS | {"source":"score topic","targets":["live group","search group","analytics group"]} | Illustrative independent consumer groups. | one group shares work; groups duplicate roles

@draw parallel | rows | ONE KEY'S ORDER LIMITS ITS PARALLELISM | [["partition A","match m7","match m7"],["partition B","match m8","match m9"]] | Illustrative stable key placement. | one hot match remains one ordered path

:::key In one breath
Keys choose a useful ordering scope. Partition append order differs from event-time order. Groups share ownership and independent groups keep separate progress. Rebalance requires duplicate-safe handling of unfinished work.
:::

@part Offsets and recovery | We choose the position from which a crashed consumer resumes. A stored offset is a claim about completed work. We will inspect checkpoints and lag.

## Committed offsets

Kafka group progress conventionally stores the next offset to consume. If record 7's required effect is finished, storing 8 says recovery can start there. Committing before the effect risks loss; committing after it risks replay. A unique event identifier or partition-offset identity can deduplicate the effect within a local transaction.

## Consumer lag

**Consumer lag** compares produced or available log progress with a consumer's position under a stated definition. Offset distance counts records, not elapsed time, and record sizes can vary. Oldest-unprocessed age is closer to a freshness objective. Track both, plus throughput and failed processing.

@draw commit | rows | THE CHECKPOINT NAMES THE NEXT RECORD | [["offset","7","8","9"],["effect","finished","unfinished","later"],["commit","next = 8","not 9","not 10"]] | Illustrative Kafka offset convention. | progress must not skip unfinished required work

:::warn Watch out
A consumer that fetches records quickly but processes them slowly can report misleading progress if metrics use the fetched position. Define whether lag refers to fetch, process, or committed recovery position.
:::

:::key In one breath
An offset is local to a partition. Committed progress identifies the recovery boundary. Lag needs a named position and does not directly measure time. Duplicate-safe effects permit checkpoints after completion.
:::

@part Replication and acknowledgement | We decide which copies must accept a write. A replication factor alone does not define acknowledged-history survival. We will inspect leaders, in-sync replicas, and producer acknowledgement.

## Leaders, followers, and ISR

Each partition has a leader serving its normal append path and followers replicating it. The **in-sync replica set**, or **ISR**, tracks replicas satisfying the system's synchronization criteria. It can shrink during failure. Electing an out-of-date replica under an unsafe recovery choice can lose previously acknowledged history.

## acks and minimum replicas

A producer's `acks` setting controls the acknowledgement requested. `acks=all` waits according to the current ISR contract; `min.insync.replicas` can reject writes when too few suitable copies remain. With an illustrative replication factor of three and a minimum of two, a shrunken ISR of one cannot accept writes under that policy. That is an availability choice protecting the stated durability boundary.

@draw isr | matrix | COPY COUNT AND ACK POLICY WORK TOGETHER | {"rows":["leader","follower B","follower C"],"cols":["stored","in sync"],"values":[["yes","yes"],["yes","yes"],["yes","no"]]} | Illustrative ISR, not a measured cluster state. | three configured copies can mean fewer suitable copies

@draw ack | split | THE POLICY CAN REJECT DURING FAILURE | [["ISR has two","minimum two\nwrite can proceed"],["ISR has one","minimum two\nwrite rejected"]] | Illustrative policy with replication factor three. | survival promises consume availability

:::key In one breath
Partition leaders append and followers replicate. ISR is a suitable-copy set that can change. Acknowledgement and minimum-replica settings jointly define acceptance. State the leader-election and failure assumptions behind survival claims.
:::

@part Retention and rebuilding | We keep enough history for a reader to recover. Retention expiry can make a correct checkpoint unusable. We will count storage and distinguish deletion from compaction.

## Retention

Heron's illustrative 20 events per second at 200 bytes create 345,600,000 payload bytes per day. Seven days with three copies give 7,257,600,000 payload bytes before indexes, batches, segment slack, and protocol overhead. Configure time and size policies using physical traffic, then monitor readers that approach the retained boundary.

## Log compaction

**Log compaction** retains suitable latest records per key over time rather than preserving every historical update forever. Tombstones express deletion under configured cleanup rules. Compaction is asynchronous and does not promise exactly one visible record per key at every moment. A compacted state topic is a different recovery source from a complete audit event history.

@draw retention | bars | ILLUSTRATIVE RETAINED PAYLOAD | [["one day",0.3456,"GB"],["seven days, three copies",7.2576,"GB"]] | Decimal GB, computed from the fixed event workload. | replicas multiply physical storage

@draw compact | rows | COMPACTION CHANGES THE HISTORY CONTRACT | [["before","K=v1","K=v2","K=v3"],["event history","keep v1","keep v2","keep v3"],["state rebuild","older may go","older may go","retain latest"]] | Conceptual compaction outcome; cleanup is asynchronous. | current state and audit history are different needs

:::key In one breath
Retention bounds replay availability and physical storage. Consumers must recover before required history disappears. Compaction supports keyed state reconstruction under cleanup rules. It does not replace an immutable event audit.
:::

@part Idempotence and transactions | We scope the guarantee around duplicate producer attempts. Broker transactions cannot silently include unrelated effects. We will distinguish producer idempotence from application idempotency.

## Idempotent producers

An **idempotent producer** uses broker-recognized identity and sequence rules to avoid certain duplicate appends caused by producer retries within its supported contract. This does not deduplicate two separate business commands merely because their payloads look alike. Keep Heron's command identity and authoritative event sequence as application fields.

## Transactions and exactly-once processing

Kafka transactions can group output records and input offsets, letting consumers with the appropriate isolation avoid uncommitted transactional output. A crash then resolves inside that supported log transaction domain. Writing a remote database or sending a push notification remains another commit boundary. Use idempotent receivers, an outbox, or a compatible sink protocol and reconciliation.

@draw boundary | split | EXACTLY ONCE MUST NAME ITS EFFECT DOMAIN | [["Kafka transaction","output records\ninput offsets"],["external system","separate transaction\nidentity and recovery"]] | Conceptual processing scope. | a remote side effect is still remote

:::interview Interview lens
**"Why use Kafka instead of a normal work queue?"** I need retained ordered partitions and independent replaying readers. If I only need competing workers for disposable jobs, a simpler queue may fit. I would defend retention, key order, consumer progress, and failure behavior before naming Kafka.
:::

:::key In one breath
Producer idempotence protects supported append retries. Business identity remains an application contract. Transactions can atomically cover Kafka records and progress. External effects need their own recovery boundary.
:::

@part A score event from append to rebuild | We assemble producer, replicas, readers, and retention. Every component should have a measurable job. We will trace a live consumer crash and a later search rebuild.

## Complete event flow

The outbox publishes a keyed, versioned score event. The partition leader appends under the chosen acknowledgement policy and suitable followers replicate. Live and search groups each process their own positions. A live consumer that crashes after publishing may repeat a notification, so viewers or gateways use event identity and sequence to reject duplicate or old state.

## Rebuild and the next bottleneck

A new search group replays retained history into a new index, catches up, verifies progress, and switches reads at a controlled boundary. If the history expired, use a compatible snapshot plus later log positions. One hot partition, slow sink, or replication link can become the bottleneck. This chapter teaches log mechanics; operating and tuning a real cluster requires measured workloads and version-specific configuration.

@draw full | flow | A LOG CONNECTS INDEPENDENT RECOVERABLE VIEWS | ["outbox producer","replicated partition","independent groups","versioned views"] | Illustrative Heron event architecture. | replay needs both retained data and progress

:::key In one breath
Kafka retains partitioned records for independently progressing readers. Append acknowledgement, replica suitability, processing progress, and external effects are separate boundaries. Rebuild needs retained history or a compatible snapshot. Defend the log by its replay and ordering jobs, not its name.
:::
'''
qa=[('Topic or partition?','A topic names a record family; a partition holds one ordered log. Global topic order is not automatic.'),('Why key by match?','A stable placement keeps one match\'s events in one ordered partition. A hot match still limits that path.'),('What does a committed offset mean?','It names the next recovery position under Kafka\'s convention. Required earlier effects must be safe.'),('What does ISR change?','It tracks suitable synchronized replicas. Configured replica count can exceed the currently suitable set.'),('Why combine acks and minimum replicas?','Acknowledgement and acceptance policy jointly specify when a write can succeed. A minimum protects the desired copy threshold during failure.'),('Retention or compaction?','Retention bounds stored history by policy. Compaction removes superseded keyed state over time and has different audit semantics.'),('What does producer idempotence omit?','Independent duplicate business commands and unrelated external effects. They still need application identity.'),('When is Kafka justified?','Retained partition order and independent replay are needed. A simple competing-worker job can use a simpler queue.')]
ex=[('●','Compute daily event payload.','20 times 200 times 86,400 gives 345,600,000 bytes.'),('●','Compute seven-day three-copy payload.','345,600,000 times 7 times 3 gives 7,257,600,000 bytes.'),('●●','Record the checkpoint after effect for offset 7.','Commit next offset 8 after the required effect is safe. A crash before commit can redeliver 7.'),('●●','Explain why a minimum ISR of two rejects an ISR of one.','Only one suitable copy remains, below the acceptance policy. Rejecting preserves the intended survival contract instead of claiming three configured replicas suffice.'),('●●','Recover a consumer whose needed offset expired.','Use a compatible snapshot with a recorded log boundary and replay later records, or rebuild from another authoritative source. An expired offset cannot recover erased history.'),('●●●','Design a database sink.','Commit a unique event identity and the database effect locally together. Only then advance recovery progress; retry after uncertainty and reject stale versions.')]
publish(9,'kafka','Inside the retained log',['Inside the','Retained Log'],'Kafka brokers, topics, partitions, groups, offsets, replication, retention, compaction, idempotent producers, and transaction scope.','Explain why a retained log belongs in the design and recover each reader after a crash.',raw,qa,ex,[('Kafka introduction','https://kafka.apache.org/41/getting-started/introduction/','Topics, partitions, and readers.'),('Kafka design','https://kafka.apache.org/41/design/design/','Replication, delivery semantics, and transactions.'),('Producer configuration','https://kafka.apache.org/41/configuration/producer-configs/','Acknowledgement and idempotence settings.'),('Topic configuration','https://kafka.apache.org/41/configuration/topic-configs/','Retention, compaction, and minimum ISR.')])

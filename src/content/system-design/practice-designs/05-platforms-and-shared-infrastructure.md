@part V | Metrics, scheduler, Kafka, cache | We inspect systems that other services depend on. Their resource and failure contracts become every caller’s constraints. We will build telemetry ingestion, a scheduler, an event log, and a distributed cache. | where:5

## 17. Metrics and logging platform: bounded ingestion

Many services export telemetry at once. A **telemetry ingestion platform** accepts evidence, validates its schema, stores it under a retention policy, and makes it queryable. Acknowledged ingestion and query visibility are distinct states.

Partition the workload by a bounded tenant or series rule, batch writes, and bound queue bytes and age. Reject or throttle a noisy tenant before it exhausts everyone’s budget. At 1,000 metric series sampled every 15 seconds, one day produces 5,760,000 samples. At 1,000 500-byte logs per second, daily payload is 43,200,000,000 bytes. Metrics need cardinality limits; logs need redaction and index budgets. Monitor ingestion drops and freshness through a path that can expose failure of the platform itself.

Accepting a batch into a collector queue does not make its records durable or searchable. Declare which boundary the ingestion acknowledgement crosses, then track export, stored data, and index freshness independently. If the backend stops accepting work, bound the queue and decide whether ordinary diagnostic records can be dropped while required audit records use stronger handling. Retried batches preserve record identity where duplicate ingestion affects the query. The illustrated sample count cannot be converted to metric bytes without an encoding assumption. Likewise, log payload bytes exclude index and replication work, which belong to a separate storage budget.

@fig sd_practice_designs_17 | Illustrative metrics and logging platform: bounded ingestion. Ingestion counts samples and bytes separately, while queryability follows indexing. Orange marks searchable fresh evidence after the ingestion boundary.

If every exporter retries without admission limits, the platform’s recovery can create another synchronized overload burst.

:::story Picture this
A post office has a measured number of sorting slots and a tray with a fixed capacity. When the tray fills, it rejects or drops mail according to a written rule instead of letting every sender pile parcels on the floor. The sorter reports both accepted mail and discarded mail so the manager can see the loss.
:::

## 18. Distributed job scheduler: claim and fencing

A scheduler assigns a task, and its worker pauses. A **job lease** is temporary ownership of a task attempt. It lets a replacement begin after expiry but cannot stop the first worker from resuming.

Persist task identity, schedule, state, attempt identity, lease generation, and progress. Claim with an atomic transition, renew under the same owner, and complete only if that ownership is still valid. Use fencing or idempotent effects at the task’s actual resource. A cron schedule also needs timezone, missed-run, and overlap policy; a repeated schedule tick must not create duplicate logical jobs. Distinguish successful task effects from merely successful worker execution, and expose poison jobs and retry limits.

The scheduler records task identity and claim generation before a worker begins. The worker can pause long enough for its lease to expire, letting a replacement proceed while the original remains alive. At completion, the protected target rejects an obsolete generation or applies the task under a durable duplicate-safe rule. Checking the lease only before execution leaves a pause window before the effect. Release also compares ownership so delayed cleanup cannot delete the replacement's claim. Task scheduling, claim exclusivity, and external effect completion are different boundaries, and each needs a named restart state.

@fig sd_practice_designs_18 | Illustrative distributed job scheduler: claim and fencing. An expired task claim still needs effect fencing or duplicate protection. Orange marks effect protection against obsolete or repeated task execution.

A worker reporting complete after its lease expired must not overwrite the replacement’s progress or repeat an irreversible effect.

:::note Claim ownership and fencing
Persist the logical job and each ownership attempt. Atomic claims and lease checks coordinate workers; fencing or repeatable effects protect the actual task outcome. Scheduling needs missed-run and overlap semantics.
:::

## 19. Kafka-style event log: append and replay

Two independent consumers need the same score history. A **partitioned event log** stores ordered records within each partition and lets consumers track their own positions. Reading a record does not delete it.

A producer routes a match key to a partition leader. The leader appends, replicates under the chosen acknowledgement contract, and returns the assigned offset. A consumer processes offsets and commits its next restart position only after its effect is safely represented. Retention governs how long replay remains possible, independently of a consumer’s success. With 20 200-byte events per second, daily payload is 345,600,000 bytes; seven days with three copies is 7,257,600,000 before indexes and overhead. [Kafka 4.1’s design documentation](https://kafka.apache.org/41/design/design/) describes these public mechanisms.

A log partition gives the chosen key an ordered append scope and the leader assigns positions within it. The acknowledgement specifies how replication protects accepted records; a local append alone cannot answer the named failure guarantee. A consumer applies its effect before advancing durable progress or commits them together where supported. Losing the acknowledgement can repeat delivery, which the effect rule must tolerate. Independent readers keep independent positions, and retention can remove history regardless of whether one slow reader finished. An expired checkpoint therefore needs a reset or rebuild policy rather than pretending the missing tail is still available.

@fig sd_practice_designs_19 | Illustrative kafka-style event log: append and replay. Consumer progress follows the protected effect and depends on retained history. Orange marks effect completion followed by durable consumer progress.

A committed consumer offset does not prove an external database effect committed unless the design coordinates or deduplicates those boundaries.

:::warn Watch out
Explain partition-local order, leader append, replication acknowledgement, independent progress, and retention. A log serves replaying independent readers; it is not simply a queue that deletes each handled message. External effects still need repeatable processing.
:::

## 20. Distributed cache: placement and source protection

A cache node disappears and all its keys miss. A **distributed cache** places fast copies across nodes under a key ownership rule. The source remains the authority unless the system explicitly chooses a different durability contract.

At 100,000 items of 2,000 payload bytes plus 100 assumed overhead bytes, logical cache memory is 210,000,000 bytes. Three full copies require 630,000,000 under that simple model. Actual allocator and object overhead need measurement. Version entries, choose expiry and eviction, handle hot keys, and define node membership transitions. Replicas can improve read availability but introduce freshness and failover states. On failure, bound fallback and coalesce misses so the source survives the surge.

The illustrated item budget accounts for payload and assumed per-item overhead, then full copies multiply that amount. Real client buffers, allocator behavior, and persistence work are separate implementation costs. Placement decides which cache owner receives a key, but a hot key can overload that owner even when item counts balance. Node loss can make previously reusable entries cold, increasing source reads. Bound fallback and warming work within the source's capacity, and coalesce equivalent misses where safe. Losing a cache entry changes the read path; it must not change the authoritative existence or permission of the underlying record.

@fig sd_practice_designs_20 | Illustrative distributed cache: placement and source protection. Cache copies spend memory and node loss transfers demand to the source. Orange marks source protection when node loss creates a miss surge.

A key hashing algorithm chooses placement but does not transfer data, enforce freshness, or make a node’s acknowledgement durable.

:::interview Interview lens
**"How do you keep a cache failure from overloading the source?"** A cache needs placement, version, expiry, eviction, hot-key handling, and source-failure protection. Compute memory from the stored representation and copies. A cache outage must not turn every waiting caller into unrestricted source load.
:::

:::key In one breath
Bound ingestion, retain progress, and enforce task ownership. A log enables replay with partition-local order. A cache needs placement, expiry, eviction, and a designed failure path at its source.
:::

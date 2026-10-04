@part VIII | Sharding and consistent hashing | We divide ownership only after understanding a working database. More machines add routing and migration decisions alongside their capacity. We will trace partition placement, a safe ownership change, and the complete score command with a reconciled storage budget. | where:8

## 31. Partitioning and sharding solve different placement problems

Heron's old event history makes maintenance cumbersome even when recent requests are small. **Partitioning** divides one logical data set into subsets under a rule, such as match or time. **Sharding** assigns subsets to separate database owners, commonly on separate machines. A partition can remain local; dividing a table does not by itself distribute its writes.

Time partitions can make retention efficient: remove an expired subset instead of deleting individual old rows. They can also let a planner avoid irrelevant subsets. That **partition pruning** requires predicates and metadata that identify the relevant partition; an unbounded query can still touch them all.

A sharded match lookup needs routing from match identity to owner. A transaction confined to one owner can retain a local boundary. A cross-owner operation needs another protocol, an explicit weaker invariant, or a redesigned boundary. The network work is part of the design rather than an implementation detail to hide.

@fig sd_databases_partition_shard | Illustrative local time partitions compared with separate match owners. Maintenance boundaries and machine ownership are different choices.

Start with the measured resource ceiling: storage, write CPU, lock contention, or another bottleneck. Read replicas may help a read bottleneck without adding independent ownership. Sharding can divide suitable writes but brings routing, backups, cross-shard queries, and ownership transitions that the single database did not need.

:::story Picture this
A library sorts books into shelves within one room, then eventually assigns different collections to different branches. Shelves make organization easier. Branches add capacity but force a reader to know which branch owns a book and how a transfer becomes official.
:::

## 32. Partition keys determine the request's working set

A viewer supplies a match identifier, so routing all of that match's events to one owner keeps its recent-history query local. A **partition key** is the value used to select the data subset or owner. Its job is to make important operations bounded while spreading enough independent demand.

Hashing match identities can distribute matches that have unrelated identifier patterns. A **range partition** groups ordered intervals instead, making corresponding range scans local. Hashing improves spread under suitable inputs; ranges preserve useful locality but can concentrate newly growing keys. Neither changes the popularity of one particular match.

Suppose the illustrative shard request rates are 100, 100, and 800 per second. They total 1,000, but the mean of 333.3333, rounded to four decimals, hides the owner receiving 800. Equal record counts do not imply equal demand. Measure placement by bytes, requests, write contention, and the largest indivisible item.

@fig sd_databases_partition_key | Illustrative uneven request rates. The hottest owner decides whether this placement survives the peak.

A key should also fit constraint scope. A uniqueness rule within a match can be enforced locally when all its events share an owner. A global user-name uniqueness rule cannot be inferred from independent per-shard constraints. Route it through a suitable authority or choose a protocol that explicitly enforces it.

## 33. Resharding is a transfer of authority

A shard grows too large and a new owner is ready. **Resharding** moves data or changes partition ownership. Copying bytes is only the first task: writes arriving during the copy must reach the destination, and the cutover must establish which owner may accept the next write.

An illustrative snapshot contains 1,000,000 records and copies at 10,000 records per second, taking 100 s if that rate stays constant. A change stream carries writes after the snapshot boundary. If arrivals are 20 changes per second but catch-up applies only 15 for 60 s, backlog grows by $(20-15)\times60=300$ changes.

When catch-up can apply 40 per second while arrivals remain 20, spare rate is 20 and those 300 changes drain in 15 s. Catch-up must be faster than the continuing change rate to close the gap. An owner that copies successfully but never catches up is not ready to serve current truth.

@fig sd_databases_reshard | Illustrative snapshot, catch-up, and fenced cutover. Routing changes follow the authority decision rather than creating it.

At cutover, coordinate a named history boundary, prevent old ownership from accepting conflicting writes, and publish routing. A **fencing epoch** is an increasing ownership value checked at the write resource. Install the new epoch atomically at the protected resource before relying on it to reject the old owner's requests. Issuing an epoch elsewhere does not update storage by itself.

Keep old data until verified recovery and cleanup conditions hold. Retried commands carry their original identity across the migration. A route cache can be stale, so the old endpoint must reject or redirect safely instead of quietly continuing independent ownership.

:::warn Watch out
Two writable owners are not a harmless migration overlap. A client can retry the same command against both while routing changes. Define the authority boundary and command-record transfer before treating a copied destination as ready.
:::

## 34. Hot partitions preserve their heat after hashing

A final attracts most viewers to one match. A **hot partition** is a data subset whose demand overwhelms its owner. Hashing its identifier produces another owner label, not more independent capacity for that one ordered stream. Adding idle owners elsewhere does not split the hot request's contract.

Read copies and caches can spread permitted reads when freshness requirements allow them. Batching can reduce repeated per-event overhead. If an illustrative transaction groups 10 ordered events, it can share fixed transaction costs, but it also delays acknowledgement and keeps the group within its chosen atomic boundary.

Splitting one match across buckets changes the read path. Recent events may come from one bucket, while a history scan merges several. Splitting concurrent writes can also change sequence ownership and invariants. First identify whether the pressure is replaceable reads, append work, one contested row, or ordered authority.

@fig sd_databases_hot_partition | Illustrative one-match concentration. Read fan-out and authoritative ordered writes require different remedies.

A **scatter-gather query** sends work to several owners and combines results. Its latency and availability now depend on the required replies, and its global ordering may need merging. A small final page can hide a large candidate scan. Bound per-owner work and state what an unavailable shard means to the completeness of the result.

:::interview Interview lens
**"We added shards, but the popular match is still slow. Why?"** The indivisible hot key stayed on one owner. I separate hot reads from ordered writes and inspect the resource that actually saturates. I add read copies, batching, or a deliberate new partition boundary only after explaining the freshness and ordering changes.
:::

## 35. Consistent hashing changes a bounded part of ownership

A simple hash modulo the number of machines can remap many keys when that machine count changes. **Consistent hashing** puts owners and keys on an ordered ring and maps a key to a nearby owner under a stated rule. Adding an owner takes a neighboring interval rather than redefining every modulo result.

Use an illustrative ring numbered from 0 through 99, choosing the first owner clockwise at or after each key position. Owners A, B, C, and D sit at 0, 25, 50, and 75. Sample keys `[10,30,55,58,70,90]` map to `[B,C,D,D,D,A]`, wrapping 90 to A.

Insert E at 60. Keys 55 and 58 now map to E; the others retain their owners. Exactly two of these six sample keys move, a sample fraction of one third. The interval length and this deliberately chosen sample do not represent an equal-share production ring.

@fig sd_databases_shard | Illustrative owner positions before and after E arrives. The highlighted interval contains exactly the two moved sample keys.

Under an ideal uniform model with five equal owners, the new owner receives an expected one fifth of keys. That is an expectation, not the measured fraction for every ring or finite sample. **Virtual nodes** place several tokens for each physical owner to improve distribution and support weighted capacity, but do not eliminate workload skew or migration work.

## 36. The complete command and its storage budget

The scorer submits command `k7` with a payload fingerprint. Route it to the current match owner, verify the ownership epoch at the protected write boundary, validate permission, and begin a transaction. Atomically claim the command identity, update the score and sequence, store the event and result, and record publication intent.

An **outbox** is a database record of an external action to perform after the local transaction commits. Its publisher can retry without needing a cross-service atomic commit. The receiver still needs a stable event identity and duplicate handling. The outbox closes the crash gap between committing truth and remembering to publish, not the possibility of repeated delivery.

@fig sd_databases_complete | Illustrative complete local commit followed by replication and outbox delivery. The external receiver has its own duplicate-safe boundary.

| Step | Owned state | Failure response |
|---|---|---|
| Route and fence | Current match authority | Reject or redirect stale owner |
| Claim command | Unique key and fingerprint | Return saved result or reject mismatch |
| Change and commit | Score, event, result, intent | Roll back group or reconcile lost reply |
| Replica application | Comparable committed position | Wait or route a fenced read |
| Publish outbox | Stable event identifier | Retry and deduplicate delivery |

For the separate illustrative storage workload, every daily API request creates a 500-byte record. Daily payload is $8,640,000\times500=4,320,000,000$ bytes. Retaining it for 30 days gives 129,600,000,000 logical bytes, and three copies give 388,800,000,000 bytes. Reads do not secretly create rows; this is the specified write-sizing scenario.

Indexes, retained versions, WAL, outbox retention, backups, and free space are extra. Count them separately rather than claiming the logical total is a disk requirement. The next unit compares alternative data models; it does not remove the need to name identity, visibility, durability, and ownership for every stored fact.

:::note What this chapter leaves outside the boundary
We have described mechanisms, not implemented a storage engine or proved a consensus protocol. Cross-shard transactions, database-owner election, and broker delivery need their own contracts. Use the distributed-systems and async units to extend those boundaries without changing the meaning of an acknowledged local commit.
:::

:::key In one breath
Partitions organize subsets, while shards assign separate ownership. Keys must spread actual demand and preserve the important local operation. Resharding needs snapshot copying, faster catch-up, installed fencing, and safe routing; consistent hashing limits an ownership interval rather than cooling a hot key. A complete command connects atomic local truth to explicitly recovered replica reads and external delivery.
:::

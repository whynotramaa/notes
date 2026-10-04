@part III | Write-through and write-behind | We decide what a successful write acknowledges. Updating two services introduces intermediate states. We will compare write-through, write-behind, durable buffering, and ordered copy updates. | where:3

## 9. Write-through names its acknowledgement point

The scorer saves a correction and expects the score to survive an application restart. A cache can participate in that path, but a fast cache acknowledgement cannot stand in for the authoritative storage promise. **Write-through** includes writing to the backing store as part of the write operation before returning under the chosen contract.

The implementation can order source and cache steps differently, so describe the order used. Heron commits authoritative score state first, then updates or invalidates the copy. If the cache update fails, the score is still committed. The API can return committed success while marking the copy unusable or relying on a defined invalidation and recovery mechanism.

In the illustrative sequence, command `c9` commits score 11, version 8, and its result in the database. A cache update from version 7 to 8 follows. If the application loses the cache reply, retrying `c9` retrieves the recorded authoritative result. It does not run the score increment again simply because copy maintenance had an uncertain outcome.

The cache and database are separate failure boundaries unless an actual transaction protocol unites them. Writing the cache first and failing the source can expose an uncommitted value. Writing the source first and failing cache maintenance can leave an older copy. Both orders need a declared response and read-eligibility rule. The pattern name supplies none of that atomicity by itself.

Heron's cache write carries the source version so delayed older updates cannot overwrite newer data under its copy protocol. Permission and official-score authority stay at the source boundary. This design often makes copy failure survivable, but immediate freshness may require a more restrictive read path until coherence recovers. Choose the user guarantee before deciding whether the cache step delays acknowledgement.

@fig sd_cache_trace_9 | The write-through trace places acknowledgement after the source commit; orange marks the read rule that handles an independently stale cache copy.

:::story Picture this
A clerk can stamp a receipt after writing the permanent ledger, or after putting a note in an outgoing tray. The second receipt is only as durable as the tray until the ledger is updated.
:::

## 10. Write-behind moves unsent work into the promise

A counter update returns as soon as Heron places it in an in-memory buffer. The source database receives it later. This is faster for the caller, but a process crash before draining the buffer can erase an acknowledged update. **Write-behind** postpones backing-store work after an earlier acknowledgement, so the buffer's survival becomes part of the data contract.

This can combine repeated replacements or aggregate suitable counter changes. It does not make every operation safely coalescible. Replacing a display snapshot with a later snapshot can be acceptable. Dropping an earlier payment command because a later one exists can erase a distinct business effect. The operation's meaning determines whether combining is legal.

Assume an illustrative 20 updates per second and a drain pause of 5 seconds. The buffer accumulates 20 times 5, or 100 updates. At 200 payload bytes per update, that is 20,000 bytes before metadata. If the buffer is only memory and the process crashes, that whole acknowledged set can disappear under this model.

Heron can use such a loss-tolerant path for explicitly replaceable derived statistics. It does not use it by default for official score corrections. If survival is required, a durable replicated or logged buffer must acknowledge at its own defined durability boundary and replay with stable identities. That becomes a durable pipeline, with the cache only one possible projection.

Count both buffer capacity and drain capacity. If arrivals continue faster than draining, even durable storage grows without bound until some limit fails. Acknowledgement needs an admission policy before that limit. The choice is therefore more than synchronous versus asynchronous latency: it includes durable backlog, order, replay, coalescing semantics, and the result promised after a restart.

@fig sd_cache_trace_10 | Illustrative write-behind arithmetic turns 20 updates per second and a 5 second pause into 100 unsent updates; orange marks the crash where acknowledged work can disappear.

:::note Coalescing depends on operation meaning
Replacing a derived snapshot can discard older replacements, while independent payments or increments require another rule. Do not combine commands merely because they share a key.
:::

## 11. A durable buffer needs replay and order

Heron adds a durable log to its write-behind path and calls the problem solved. The bytes now survive a crash, but replay can still repeat effects or reorder a replacement behind a newer value. Durability stores work. A correct recovery protocol explains how that work turns into source state after interrupted processing.

A **replayable buffer** records a recoverable sequence of accepted operations and their stable identities. Its acknowledgement means the chosen log durability condition has completed, not necessarily that the backing database has applied the operation. The caller must understand this visibility difference. A subsequent authoritative database read may still show the older score.

Let the buffer contain updates u7 and u8 in that order for one match. The worker applies u7, crashes before recording progress, and replays u7 after restart. The source uses a unique u7 identity or a version-precondition rule to avoid a second effect. It then applies u8 and advances progress only after the required effect is safe.

For replacement snapshots, compare source versions so a delayed u7 cannot replace an already applied u8. For increments, rejecting an old snapshot does not reconstruct missing additions; stable command identity and ordered processing may be needed. Different operation types need different replay rules, even when they share one queue or cache service.

Heron's official correction path therefore keeps a direct authoritative commit, while its derived write-behind pipeline has a distinct eventual-visibility contract. Monitoring exposes durable queue depth, oldest unsent age, retries, and source application position. A durable queue with a permanently failing worker can retain every byte and still fail its intended liveness promise. Recovery includes draining, not just keeping files.

@fig sd_cache_trace_11 | The durable-buffer trace replays an update after its progress reply is lost; orange marks the ordered continuation at u8 after u7 is applied idempotently.

:::warn A pattern name is not atomicity
Cache and source updates can fail independently. State which commit is authoritative and how reads behave when copy maintenance fails afterward.
:::

## 12. Delayed copy updates need version ordering

Two scorer corrections commit in order, but their cache updates arrive in the opposite order. The copy can move backward even though the database is correct. The source commit order and the network arrival order are different. A safe cache write must carry information that lets the receiver compare the update with the value it already holds.

A **versioned cache entry** stores source version along with value and expiry. A compare-and-set or other atomic conditional update can reject a smaller version when the cache retains a comparable newer one. Reading the entry, comparing in the application, and sending an unconditional set is insufficient because another update can occur between those operations.

Heron's source commits version 8, score 11, followed by version 9, score 12. The version-9 cache update arrives first and installs [9,12]. A delayed version-8 update then compares 8 against 9 and is rejected, so the cache stays [9,12]. The same versions must refer to one ordered score history for that comparison to mean anything.

Eviction complicates this rule. If the cache evicts version 9 and forgets the version floor, an old fill arriving at an empty key can still install version 8. A tombstone, retained generation, or authoritative validation at the fill boundary can preserve knowledge across deletion. A simple 'set only if newer than present' rule protects only while the newer comparison state remains.

Heron documents which form it uses and how that metadata survives expiry or failover. A timestamp from a different machine cannot replace a comparable source version without a defined ordering convention. This section protects update order. It does not yet solve every invalidation race, which is why we now trace a reader holding an old value across a writer's cache deletion.

@fig sd_cache_trace_12 | The version-order trace rejects a late v8 after v9 is installed; orange marks the eviction case where a version floor must survive the copy.

@fig sd_caching_behind | The split compares acknowledgement after the source write with acknowledgement after a buffer accepts the update; orange marks the faster write-behind path and its durability obligation.

:::interview Interview lens
**"Would you use write-behind for the official score?"** Only with an explicit acknowledgement, survival, replay, and visibility contract. A memory buffer alone can lose accepted corrections, so direct authoritative commit is the simpler default here.
:::

:::key In one breath
Write-through includes authoritative source work in the write contract. Write-behind acknowledges earlier and needs accepted loss or a durable replayable buffer. Cache updates do not form an atomic transaction with the source by naming a pattern. Version order and command identity remain separate requirements.
:::

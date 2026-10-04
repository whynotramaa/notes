@part II | Sharding and consistent hashing | We decide which node owns a record. A balanced average can hide one overloaded match. We will follow partition keys, hash placement, hot keys, and migration. | where:2

## 5. Partition keys and locality

A match read needs the score, its version, and the latest event. Storing these under unrelated partition keys turns a local operation into several requests. A **partition key** selects the ownership group for related records.

Keep the match authority and event order together if their update must be atomic. Secondary access paths, such as all matches followed by a user, can be separately derived indexes. The trade is explicit: the primary owner enforces the match rule, while an index supports a read pattern and can lag. Do not silently call a derived membership view authoritative for permission checks. A request with no partition key may require a scatter query across all owners, whose slowest response determines the join.

Walk a user's followed-match page through a match-keyed source. The user index can locate match identities, but fetching current cards still routes each identity to its owner unless another representation serves that query. Group those fetches by owner and bound their parallelism, result size, and deadline. A missing owner creates a partial-page decision rather than a license to invent current state. If the page becomes the dominant read, a user-shaped projection may be justified. That projection needs its own update and rebuild rules because the index's existence does not transfer match authority to the user's shard.

@fig sd_scaling_patterns_05 | Illustrative partition keys and locality. Match locality simplifies writes while queries without the key gather multiple owners. Orange marks the scatter and merge needed when a query lacks the ownership key.

A user-facing query pattern can change after schema design. Track which operations fan out as the access patterns evolve.

:::story Picture this
A library assigns books to shelves by a rule chosen for the questions librarians answer most often. A shelf number that keeps one author's related volumes together makes that author's lookup local, but a shelf that balances total books may scatter the author's collection. The label is useful only when it matches the work that needs to stay together.
:::

## 6. Consistent hashing and movement

A cache gains a node. Modulo placement changes from key modulo four to key modulo five, so many existing keys acquire a different owner. **Consistent hashing** places keys and owners in a shared hash space and changes ownership only for affected intervals.

For the illustrative keys zero through 99, the computed modulo comparison moves 80 keys. In an ideal equally weighted five-owner consistent-hash arrangement, a newly added owner receives one fifth of the space, or 0.2. That ideal fraction is not an exact statement about arbitrary virtual-node placement. The routing table must carry a membership version, and clients need a transition policy while nodes disagree. A placement algorithm answers where a key belongs; it does not make the key's state appear there automatically.

Consistent hashing answers which owner should hold a key after membership changes. It does not send the key's bytes there or stop an old router from writing to the former owner. During handoff, copy a source snapshot, retain intervening changes, and bring the destination to the chosen switch boundary. Change the routing epoch only with the ownership rule that prevents competing commits. The ideal ring share in the figure describes a placement assumption, while the modulo trace counts actual keys in its specified sample. Neither number establishes migration duration, which also depends on bytes, write rate, and available transfer capacity.

@fig sd_scaling_patterns_06 | Illustrative consistent hashing and movement. Lower placement movement still requires copying data and switching routing safely. Orange marks the copy and routing handoff still required after placement changes.

Moving a cache key can be a miss; moving authoritative database state needs a safe transfer protocol. The same hash function does not supply the same recovery contract.

:::note Hash movement and ownership
Consistent hashing limits ownership movement when membership changes. Distinguish ideal balance from actual key distribution, and distinguish placement from data transfer and consistency. A membership epoch keeps routing decisions interpretable.
:::

## 7. Hot keys and skew

Most matches are quiet, but a final receives 60 percent of all reads. Across the illustrative four shards, its owner receives 600 reads per second while the other 400 reads spread across the remaining owners. The average of 250 therefore hides the overloaded owner.

A **hot key** is a key whose traffic dominates its owner. Replicate safe reads, cache immutable versions, or split a reducible operation such as a view counter into buckets. A single authoritative score update cannot be split freely without changing its ordering rule. Use request coalescing so simultaneous cache misses share one fetch, and protect the source from a cache outage. Adding many cold-key owners does not change demand on the hot key.

The illustrated hot match sends 600 reads per second to its owner while other demand totals 400. Adding owners can redistribute independent matches, yet it leaves those 600 requests attached to the same authority if the key remains the match. A cache or eligible read copy can distribute reusable responses, with a separate fallback limit when copies are cold. Scorer writes still require the original version rule. Splitting a single match's authoritative state requires a domain decomposition and a rule for operations crossing that decomposition. Treat that as a new correctness problem rather than an automatic consequence of a better hash.

@fig sd_scaling_patterns_07 | Illustrative hot keys and skew. One popular match can overload its owner despite balanced key placement. Orange marks safe read-copy or cache mitigation that preserves the write invariant.

Salting a key without a query plan moves the problem to reads, which now need to gather and reconcile the salted pieces.

:::warn Watch out
Hash balance spreads many keys, not the requests for one key. Mitigate hot reads with bounded replication or caching, and split writes only when their invariant permits a merge rule.
:::

## 8. Resharding without two owners

Copying a shard takes time while clients still write it. If the new node starts accepting writes before the old node stops, their histories diverge. **Resharding** changes the ownership boundaries of existing state.

Copy a snapshot, capture changes after that snapshot, and bring the destination up to the source boundary. Then switch a versioned ownership record and stop or redirect writes at the old owner. Requests carrying an obsolete epoch should be rejected or routed under a documented compatibility rule. A brief controlled write pause is often easier to reason about than uncontrolled dual ownership. If dual writes are necessary, specify conflict resolution and which acknowledgement makes the write durable during the transition.

An old router can send a write to the source after the destination becomes current. The source must reject or forward according to the committed ownership epoch; checking a router's cached map is insufficient. Track changes made after the snapshot until the switch boundary, then verify the destination includes them before serving authoritative operations. A transfer failure before the switch leaves the source responsible. A failure after the switch uses the destination's recovery rule. Naming that boundary makes retries interpretable and prevents a repair worker from accidentally restoring independent authority to the obsolete source.

@fig sd_scaling_patterns_08 | Illustrative resharding without two owners. Resharding catches up before the new epoch fences the former owner. Orange marks the epoch switch that rejects the former owner's writes.

A router cache can preserve old ownership after the switch. The old owner must enforce the epoch rather than trusting every client to refresh immediately.

:::interview Interview lens
**"How do you move a shard without split ownership?"** Separate copy, catch-up, and ownership switch. The switch needs a version or fence that prevents both owners from committing independently. Verify records changed during copying, not only static snapshot counts.
:::

:::key In one breath
Choose ownership from access patterns. Hashing spreads keys but cannot split one hot key. Migration needs an ownership epoch and a bounded handoff, not only copying bytes.
:::

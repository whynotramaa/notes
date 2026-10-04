@part III | Leader, multi-leader, leaderless | We decide which copies may accept changes. Copies alone do not define ownership or conflict resolution. We will compare ordered leader histories with multiple writers and fixed-set quorums. | where:3

## 9. One leader gives writes an ordering point

Two scorers send corrections at nearly the same time. Heron routes both to one leader, which assigns log positions before followers copy the commands. The arrival order may differ from the users' wall-clock intuition, but the accepted order is explicit. Followers do not independently invent another official score history.

**Leader/follower replication** gives one participant authority to order writes and sends that history to other copies. The leader can serialize conflicting changes and enforce their preconditions. A command saying 'replace version 7' can succeed once; another such command sees version 8 and fails rather than silently erasing the accepted correction.

In the illustrative trace, leader A appends `c9` at position 8 and `c10` at 9. B receives both, while C receives only 8 so far. A and B show score 12 after applying both increments; C shows 11 after applying the first. That difference is replica application lag, not a second valid order of commands.

**Replication lag** is a follower's delay behind a specified leader progress boundary. Receiving bytes, persisting them, and applying them are separate boundaries, so label the lag you measure. C's applied position trails by one entry in this trace. A time-lag measurement also needs the corresponding source timing; an entry gap alone does not establish how many seconds behind C is.

The acknowledgement policy determines the failure exposure. Replying after only A persists a record differs from waiting for a protocol-defined set of durable copies. Waiting for follower receipt differs from waiting for follower disk persistence or application. State the exact event, because 'synchronous' without that event leaves the survival claim ambiguous.

The cost is an authority path and a failure recovery protocol. A healthy read replica can still be unsuitable for a fresh read, and a reachable old leader can be unsuitable for a new write. Load balancing must respect both facts. We will later use Raft to explain one way a leader can change without replacing a committed history.

@fig sd_ds_trace_9 | The leader trace orders c9 and c10 at positions 8 and 9 while C stops at 8; orange marks the freshness check that excludes C when current state is required.

:::story Picture this
One clerk writes the official ledger and assistants copy its pages. An assistant with page 8 can serve some visitors, but it cannot answer a question requiring the later page 9 just because its desk is open.
:::

## 10. Failover can expose unreplicated history

A acknowledges a correction and disappears before C receives it. Promoting C restores a writable endpoint, but the newly visible history may omit something the user was told succeeded. **Failover** changes the process serving an authoritative role. Whether it preserves acknowledged data depends on the original acknowledgement and promotion rules.

Assume a separate asynchronous event-copy example with a constant 20 events per second and 200 payload bytes per event. If the candidate copy lags by 5 seconds, it lacks 20 times 5, or 100 events. Those events occupy 100 times 200, or 20,000 payload bytes. The exposure is precisely about that candidate copy.

$$E=\lambda\Delta,\qquad B=E b$$

Read this as exposed event count E equals event rate lambda times lag duration delta, and exposed payload bytes B equals event count times bytes per event b. It assumes the stated constant rate and equal payload size. Protocol headers, indexes, and additional copies are not included in this payload calculation.

Exposure is not proven loss. Another durable copy may contain the missing events, or A may recover with intact storage. Conversely, promoting a lagging copy and accepting incompatible changes can make reconciliation harder. The recovery policy must specify which history wins and when the service may resume writes, rather than treating a health check as a data-safety decision.

For Heron's authoritative scorer path, we will use a commitment protocol instead of this asynchronous promotion rule. The separate arithmetic remains useful for derived event feeds or caches with accepted loss windows. Compare same-unit quantities in a chart; a 5-second bar beside a 20,000-byte bar has no common scale and teaches the wrong comparison.

@fig sd_ds_trace_10 | Illustrative lag arithmetic turns 20 events per second and 5 seconds into 100 exposed events, or 20,000 bytes; orange marks payload exposure, not proven data loss.

:::note Exposure differs from loss
The missing payload on a candidate replica may still exist on another durable copy. The promotion and recovery rules determine whether that history is recoverable.
:::

## 11. Multiple leaders need a meaningful merge

Two regions accept a correction while disconnected. Region A changes score 10 to 11; region B changes it to 12. When they reconnect, both updates are locally valid. Choosing the largest timestamp may produce one answer, but it does not explain whether either correction was a replacement, an increment, or an official override.

**Multi-leader replication** permits several ordering points to accept writes and exchange them afterward. It can keep local writes available during a disconnection when the application's semantics allow it. The price is an explicit rule for concurrent histories. A total ordering chosen after the fact cannot retroactively prevent an external effect both regions already performed.

For Heron, adding independent commentary messages can use distinct IDs and preserve both messages. Replacing the same official score may instead require a conflict record and human review. An additive per-writer counter can sum components when its updates and merge form a suitable design. Deleting or correcting an increment needs another defined operation, not an unexplained subtraction.

A **conflict** is a set of changes that cannot be resolved by the existing dependency or domain rules alone. Last-write-wins chooses one winner according to an ordering convention, often a timestamp and tie-breaker. It discards the other value. Clock skew can choose a different winner from real-time order, and convergence still does not prove that the business rule survived.

[The Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) illustrates application-assisted reconciliation of versions rather than pretending all values have a universal merge. In an interview, name a specific safe operation and a specific unsafe one. For Heron, independently identified messages and single-owner official corrections need different write policies despite living in the same product.

@fig sd_ds_trace_11 | The multi-leader trace creates concurrent corrections 11 and 12; orange marks reconnect, where the domain must define a merge.

:::warn Do not graph different units on one axis
Seconds, event counts, and bytes need calculation steps or separate axes. Comparing their bar lengths implies a common scale that does not exist.
:::

## 12. Quorum overlap is only the start

A client writes to A and B, then reads from B and C. At least B participates in both sets. This is the simple arithmetic behind a fixed-set quorum. It tells us where information could be found. It does not yet tell us which response the client selects or whether that information is safely retained.

A **leaderless** design contacts several owners and reconciles their responses without one permanent writer. A **quorum** is a required participating set or count within a protocol. With fixed N=3, write participation W=2, and read participation R=2, the minimum overlap is 2+2-3=1. Fixed membership is an assumption in that statement.

$$|Q_r\cap Q_w|\ge R+W-N$$

Read this as the size of the read/write intersection is at least read count plus write count minus the number of fixed owners. The union fits within N owners. If a system substitutes unrelated temporary owners, the sets no longer live in that same universe, and this proof cannot simply be copied onto the new configuration.

Suppose A and B retain v8, while C returns v7 first. A client that uses C's first response can still serve stale data despite contacting a quorum eventually. A correct protocol must collect its required replies and select versions under a defined rule. Concurrent writes can yield incomparable versions; an interrupted write can leave partial state that future operations must interpret.

Read repair and anti-entropy handle remaining differences, with costs proportional to compared state and transferred changes. Intersection alone also says nothing about durable acknowledgements or linearizable ordering. When presenting Heron's design, include version selection, incomplete-write handling, and membership assumptions alongside R and W. That turns a memorized inequality into an actual mechanism.

@fig sd_ds_trace_12 | The quorum matrix shows write set A,B and read set B,C intersecting at B; orange marks the client rule still needed to select the newer version.

@fig sd_distributed_systems_overlap | The matrix highlights the shared quorum member between a two-node write and a two-node read; orange marks the proof's fixed membership assumption.

:::interview Interview lens
**"Does a quorum make every read current?"** No. Intersection identifies a possible informed participant. I would check reply collection, version selection, durable acknowledgements, interrupted writes, and owner membership before claiming the read guarantee.
:::

:::key In one breath
A leader orders writes but replication timing controls follower visibility and recovery exposure. Multiple writers require domain-specific conflict handling. Fixed-set read and write overlap is a set fact with protocol assumptions. Repair and version selection are part of the design.
:::

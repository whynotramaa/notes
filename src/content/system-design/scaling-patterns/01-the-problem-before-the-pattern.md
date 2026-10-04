@part I | Replication vs partitioning | We name the limit before choosing a pattern. Extra machinery creates new failure states as well as new capacity. We will distinguish resource limits, invariants, replication, and partitioning. | where:1

## 1. Bottleneck identification

The Heron read route becomes slower as a match grows popular. Saying use CQRS does not identify whether the limit is query work, disk, connections, or network delivery. A **bottleneck** is a resource or dependency that limits useful completion. Measure the demand on it before introducing a pattern.

Start with the current request flow and sustainable capacity. If reads repeatedly join the same records, a precomputed view may reduce work. If one writer owns all matches, sharding may distribute independent writes. If one match itself is hot, ordinary key hashing cannot divide that match. Every proposed change must state the waiting it removes and the new cost it creates. A cache adds freshness and miss behavior; a projection adds update work and lag; another replica adds replication traffic and failover rules.

Follow the Heron read through acquisition, query, and delivery before assigning a pattern. If the database executes promptly once a slot is available, adding a read index may leave the actual acquisition queue untouched. If repeated joins dominate execution, precomputation can remove that work while creating a projection-maintenance path. Compare the same request population before and after the change, including misses and recovery. A normal-path speedup can increase admitted demand on a slower downstream step. State the resource whose work decreases and the resource whose work increases, then inspect both under the failure workload.

@fig sd_scaling_patterns_01 | Illustrative bottleneck identification. Measured query work and pool wait determine which change can remove read delay. Orange marks the choice that must reduce the measured work.

A design can move the bottleneck downstream. Verify the new dependency and failure workload, not only the faster normal request.

:::story Picture this
A bridge manager first measures whether the jam is at the entrance, on the span, or at the exit. Adding a second bridge helps only if traffic can use it and the real jam is on the span being duplicated. The chosen construction must remove a measured obstruction and must not simply move the queue to another gate.
:::

## 2. Invariants before distribution

Two scorers update the same match and both believe their version won. An **invariant** is a rule that must remain true across every allowed state transition. For Heron, a command that expects version seven may create version eight only if seven is still current.

Put that rule at the authority that commits the update, not in an API process that merely read an earlier value. A conditional update checks the expected version and changes state atomically. If another command has already committed version eight, the stale command must fail or be reconciled using a domain rule. Replicas, caches, and projections can show the result later, but none should grant permission to violate the write invariant because its view is behind.

Trace the illustrated competing commands from their shared observation of version seven. The first authority check succeeds and commits eight. The later check sees eight while expecting seven, so it must leave the state unchanged. Retrying that distinct command with the new version is a domain decision because the original intended correction may no longer be valid. A retry of the first committed command instead uses its stored result identity. Keeping these cases separate prevents a duplicate request from looking like a concurrent conflict and prevents a conflict handler from blindly applying a stale change.

@fig sd_scaling_patterns_02 | Illustrative invariants before distribution. A stale expected version loses after another writer commits. Orange marks rejection of the writer whose expected version is obsolete.

An application check followed by an unconditional write can lose an intervening update. Expected-version enforcement belongs in the same atomic operation as the state change.

:::note Invariant before distribution
Write the rule in terms of allowed transitions, then identify the commit boundary that enforces it atomically. A read check outside that boundary leaves a race. Distribution must preserve or explicitly weaken the invariant.
:::

## 3. Replication and read eligibility

Heron stores another copy of a score. **Replication** copies logical state to another node. It can support recovery or more reads, but it does not automatically divide the write authority for that score.

A leader commits a version and sends it to followers. An asynchronous follower can return the previous version until it receives and applies the update. Synchronous acknowledgement changes the commit wait and failure availability. A promoted follower must be sufficiently current for the promised recovery rule, and the old leader must stop accepting authoritative writes. Extra copies therefore add a data movement path, visibility states, and an ownership transition. Draw those states separately from the request route.

A copied log entry and an applied score are different follower states. The leader can acknowledge the durability required by the write while the follower still exposes version seven. A reader requiring eight cannot use that follower merely because the process is healthy or its log has received the entry. It waits for application, changes route, or receives the declared pending result. On promotion, check the recovery promise against the follower's surviving committed history and reject old-owner effects. More copies improve options only when their write acknowledgements, read eligibility, and takeover rules satisfy the intended operation.

@fig sd_scaling_patterns_03 | Illustrative replication and read eligibility. The follower becomes eligible for a current read only after applying the committed version. Orange marks the follower becoming eligible after applying the committed version.

Acknowledgement semantics determine loss risk. A replica that exists but has not received the latest acknowledged write does not meet a zero-loss failover promise.

:::warn Watch out
Replication adds copies and can add read capacity or recovery options. Name which copies acknowledge a write, which serve reads, and how failover chooses a sufficiently current owner. It does not automatically multiply write capacity.
:::

## 4. Partitioning and ownership

The service cannot fit every match on one database node. **Sharding** assigns different subsets of records to different owners. A request must find its owner before it can read or change authoritative state.

At the illustrative 1,000 reads per second across four perfectly balanced shards, average demand is 250 per shard. That is arithmetic under a balance assumption, not a measured guarantee. A partition key based on match keeps one match local, which simplifies its version invariant but concentrates its popularity. A key based on user can spread viewers while making match-wide updates reach several owners. Decide which operation must remain local, then accept the cost paid by operations that cross the chosen boundary.

The illustrated 250 reads per shard is a mean under equal distribution, not a routing rule. A match-keyed owner keeps its score and version check together while all readers of that match converge on it. A user-keyed representation spreads viewer reads but creates maintenance work whenever a score changes for many users. Those are different state models, so the choice cannot be made by dividing the fleet total alone. Draw the authoritative update separately from any user-keyed projection. This preserves local write correctness while exposing the distribution and lag costs of the alternative read shape.

@fig sd_scaling_patterns_04 | Illustrative partitioning and ownership. Shard demand depends on balance and on the operation kept local by the key. Orange marks the key choice that trades match locality against viewer distribution.

A cross-shard transaction is a new coordination problem. Adding shards without changing the ownership rule can spread storage while leaving the hottest request on one node.

:::interview Interview lens
**"How does partitioning change state ownership?"** Partitioning distributes subsets of state. Choose a key from the operations and invariants that need locality, then calculate skew and cross-shard work. The balanced average is only a starting assumption.
:::

:::key In one breath
A pattern answers a named problem. State its invariant and the simplest adequate alternative. Replication copies state; partitioning distributes ownership.
:::

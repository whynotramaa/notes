@part X | Distributed databases | A second machine can preserve a copy of the data while introducing disagreement about its age and owner. Splitting data also moves some transactions across independent failure boundaries. We will follow replication, partitioning, two-phase commit and consistency through the same seat inventory. | where:10

## 49. Replication, lag and promotion

Ada receives a successful seat reservation, then reloads through a replica that still shows the seat as free. The primary's commit and the replica's visible state are different events. Adding a copy did not automatically preserve the user's read-after-write expectation.

**Leader-follower replication** gives one leader responsibility for ordering writes and followers responsibility for applying that history. A follower can receive, persist and apply the history at different moments. **Replication lag** measures the distance between named positions or events, so always say whether the measurement concerns received bytes, durable records or visible changes.

In Heron's illustrative trace, the primary makes a change visible at 100 milliseconds and the replica applies it at 120. Visible lag is $120-100=20$ milliseconds. A read between those moments can return the old seat state even though the write succeeded. Read the subtraction as follower application time minus primary visibility time for this specific operation, not a fleet-wide constant.

@fig dbms_replicas | The primary orders reservation writes while followers apply its history. Orange marks the write owner; a follower's visible version can lag that owner's commit.

### Synchronous and asynchronous acknowledgement

**Synchronous replication** delays acknowledgement until the configured replica condition is met. That condition may mean receipt, durable flush or replay; those are distinct promises. **Asynchronous replication** can acknowledge before the follower reaches the required point, reducing waiting while leaving a possible loss boundary under primary failure.

In the declared timing model, local persistence takes 5 milliseconds and two required follower acknowledgements arrive at 8 and 12. Waiting for all three persistence events takes $\max(5,8,12)=12$ milliseconds; local-only acknowledgement takes 5. The difference is $12-5=7$ milliseconds. These inputs model independently measured completion times from one origin, not serial delays to add.

@fig dbms_replica_ack | Illustrative persistence times. Orange marks the synchronous wait for the last required acknowledgement at 12 milliseconds; the local-only boundary is 5.

### Read replicas and failover

For read-your-writes, Ada can read the leader, carry a committed position and wait for a follower to reach it, or receive a stated temporary failure. Blindly round-robin reading across copies supplies no such guarantee. Promotion also needs a follower whose history meets the durability promise and a way to exclude the old writer. A network partition does not prove the old process stopped.

PostgreSQL 18's [standby documentation](https://www.postgresql.org/docs/18/warm-standby.html) describes streaming replication and its acknowledgement choices. Keep that concrete engine contract separate from the toy timing arithmetic. A replica is also not a backup against every failure; an unwanted deletion can propagate faithfully to all copies.

:::story Picture this
A booking clerk writes a reservation in the master ledger and sends a copy to another desk. A customer who immediately asks the second desk may hear the old answer. Waiting for the second desk's receipt changes when the clerk may say the copy arrived, but the receipt must specify whether the copy was merely received, filed or already available to read.
:::

## 50. Partitioning, sharding and resharding

Heron's busiest show dominates one machine while other shows are quiet. More replicas can serve some reads, but every write still reaches the same owner. Splitting independent data can distribute that write work.

**Vertical partitioning** splits columns or related tables, often separating frequently read seat state from larger descriptive fields. **Horizontal partitioning** splits rows by a rule. **Sharding** places such subsets under separately managed storage owners. A table partition inside one database and a shard on another machine can use similar row rules while having different transaction boundaries.

### Range, hash and directory-based sharding

A **range shard** owns a key interval, making ordered scans local when the query follows that interval. A **hash shard** owns keys selected by a hash mapping, trading ordered locality for spread under the hash model. **Directory-based sharding** keeps an explicit key-to-owner lookup, allowing controlled placement at the cost of maintaining that directory. **Consistent hashing** limits which hash ranges change owner when membership changes; it does not perform the data transfer by itself.

Heron's 800 inventory rows distributed by the declared four-way modulo fixture give 200 rows per shard. In the alternative skew fixture, counts are 650, 50, 50 and 50. The hot shard holds $650/800=0.8125$, or 81.25 percent, and $650/200=3.25$ times the equal-share row count. Read those ratios as a counted share and a comparison with the fixture's mean. Request skew may be worse even with equal row counts.

@fig dbms_shards | Illustrative equal and skewed distributions of the same 800 rows. Orange marks the first shard, whose 650-row skew differs from the 200-row equal share.

### Hot shards, cross-shard queries and joins

Choose a key from the operations that must stay together. A show-based key keeps one show's seat reservation local but concentrates a popular show. A country key may concentrate most users in one country. A query across shows needs fan-out and result merging, while a cross-shard join may transfer rows or maintain another read model. Neither cost appears in a single-shard index lookup.

**Resharding** transfers data while requests continue under a defined ownership version. Copy a snapshot, catch up intervening changes, establish the handoff boundary and route new operations to the new owner. Fence stale writers and retain a recovery path until the handoff is durable. Updating the route before catching up can expose missing rows; copying without capturing new writes can lose changes.

@fig dbms_reshard | A snapshot copy is followed by change catch-up and a fenced ownership handoff. Orange marks the fencing step that excludes the old writer before the new owner accepts writes.

:::warn Watch out
Changing `hash(key) % N` changes many assignments. A routing change alone neither copies existing rows nor prevents an old owner from writing. Treat migration, catch-up and authority transfer as required parts of resharding.
:::

## 51. Distributed transactions and two-phase commit

A booking now changes inventory on one shard and a credit record on another. Committing the first and crashing before the second leaves only half the intended operation. A local transaction cannot atomically decide the unrelated shard's outcome.

**Two-phase commit**, or 2PC, coordinates one commit decision across participants. During prepare, each participant makes its promised ability to commit durable and votes. A YES vote means it cannot independently discard the prepared operation just because the coordinator becomes unreachable. The coordinator durably records a commit only after the required YES votes, or records an abort when the protocol permits it, then distributes that decision.

@fig dbms_two_phase_commit | Prepare establishes durable participant promises before the coordinator records COMMIT. Orange marks protocol actions; a participant with a YES vote must recover the authoritative decision rather than guess.

### Coordinator failure and blocking

Suppose both participants vote YES and the coordinator disappears before either learns the outcome. The coordinator may have logged COMMIT and sent it to only one participant. A participant that guesses ABORT could disagree with that committed outcome. Prepared state can therefore remain blocked, retaining locks and resources until the decision is recovered through the protocol.

This is why 2PC and two-phase locking are different. The first coordinates atomic commit among participants; the second controls concurrent access. A system can use both, and the retained locks make a blocked distributed commit operationally expensive. Neither name means that a network partition has stopped every old writer.

### Sagas, transactional outbox and eventual consistency

A **saga** divides a business workflow into locally committed steps with specified compensating actions when later steps fail. A compensation is a new business operation, not a time machine that erases every externally observed action. Refunding a payment does not make its original notification disappear.

A **transactional outbox** writes publication intent in the same local commit as the booking. A relay later sends the event and may repeat it after a lost acknowledgement. The consumer needs stable identity and duplicate-safe effects. This closes the local database-to-message gap while downstream completion may remain eventual.

@fig dbms_outbox | Reservation state and publication intent share one commit. Orange marks that local boundary; later delivery can repeat and requires consumer deduplication.

For Heron, keep the seat claim and booking record in one transaction when they share a database. Introduce distributed commit only when atomicity truly spans separate participants. An external payment API may instead require a durable pending state, a stable payment operation identity and reconciliation. Naming the desired business outcome comes before choosing a commit protocol.

:::note Compensation has business meaning
A released seat can be offered again, while a refund has fees, delays or notifications under its product policy. A saga must define those outcomes. Calling every failed step reversible hides the work required after earlier effects became visible.
:::

## 52. Consistency models and quorums

Ada reads the seat from replica A and sees it held, then reads B and sees it free. The individual responses may each be allowed by eventual replication, yet the user sees time move backwards. A consistency contract must describe observations across operations, not only the number of copies.

**Linearizability** makes each operation appear to take effect at one point between its call and return, respecting real-time order. This is the strong single-operation meaning used here. **Eventual consistency** requires replicas to converge under the stated assumptions once new changes stop. **Causal consistency** preserves the order of causally dependent operations. **Read-your-writes** prevents a session from missing its own acknowledged changes, while **monotonic reads** prevent that session from returning to an older observed state.

### Quorum intersection

A **quorum** is a required set of replica responses for an operation. Heron's example uses N=3 replicas, W=2 write acknowledgements and R=2 read replies. Writing to A and B and reading B and C guarantees at least B in common.

$$
|\text{read set}\cap\text{write set}|\ge R+W-N=2+2-3=1.
$$

Read this as the minimum overlap between a read set of size R and a write set of size W inside the same N-member replica set. If $R+W>N$, disjoint sets would require more distinct members than exist. The inequality is a counting fact; it does not specify how a reader resolves versions or how concurrent writes are ordered.

@fig dbms_quorum | Illustrative write set A,B and read set B,C intersect at B. Orange marks the shared replica; version and protocol rules are still required to select the right value.

Sloppy replacement sets, changing membership or responses that omit the durable version can break the assumed intersection. Even fixed intersecting sets need a correct ordering and read protocol to claim linearizability. A quorum reader that picks the first response can ignore the newer value from the shared replica. Multi-operation serializability is another guarantee and cannot be obtained by quoting this inequality.

For Ada, carry the observed reservation version when selecting a replica and define whether to wait, route elsewhere or fail when it is unavailable. The contract names which observation is permitted. Replica count then supports that contract through a concrete protocol rather than supplying a universal consistency adjective.

:::interview Interview lens
**"Why does R plus W greater than N not prove linearizability?"** It proves overlap only when both sets belong to the same replica membership. The protocol still needs to preserve and select the correct version and handle concurrent writes and failed operations. A shared replica alone does not define an operation's real-time ordering or an atomic transaction across keys.
:::

:::key In one breath
Replication adds copies with explicit persistence, visibility and promotion boundaries. Partitioning distributes subsets while resharding needs catch-up and fenced ownership transfer. Two-phase commit makes one durable decision across prepared participants and can block when that decision is unavailable. Consistency names permitted observations, while quorum intersection supplies only one part of the protocol needed to enforce them.
:::

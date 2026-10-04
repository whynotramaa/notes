@part VII | Replication and replication lag | We make another database copy useful without overstating what it has seen. A replica's acknowledgement, persisted history, and readable state are distinct boundaries. We will follow leader writes, compare acknowledgement policies, and protect a reader from lag. | where:7

## 28. Leaders order writes and followers copy history

A scorer updates the authoritative match while viewers ask different machines for its value. **Leader/follower replication** gives a leader responsibility for ordering accepted writes and sends its history to followers. A **read replica** serves permitted reads from that copied state. The role does not itself promise the latest committed value.

Imagine leader progress at illustrative log position 8 while a follower has applied only position 7. The leader can return the new score while that follower still returns the old one. Replication transmits the history, but receiving, persisting, and applying an entry are separate steps. A readable copy must satisfy the chosen visibility condition.

@fig sd_databases_replica_positions | Illustrative progress boundaries. Received position, durable position, and applied position can differ on one follower.

Copies can distribute permitted reads and provide recovery material. They do not automatically multiply the leader's independent write capacity, because ordering and replication still consume shared resources. Reads sent to followers may also compete with log application and maintenance on those machines.

**Failover** promotes or selects another owner after the current one becomes unsuitable. The new owner needs an appropriate history and a way to prevent an old owner from continuing conflicting writes. An asynchronous copy can miss recently acknowledged entries. The distributed-systems unit explains ownership and consensus; this part focuses on the database-visible contract.

:::note A replica is not the same as a backup
A follower can faithfully copy an accidental deletion. A backup preserves recovery material according to a separate retention policy. Copying current state and retaining an earlier recoverable state solve different failures.
:::

## 29. Synchronous and asynchronous acknowledgements

Heron's leader has prepared a change, but the follower is across a slow link. **Synchronous replication** waits for the configured replica condition before acknowledging the write. **Asynchronous replication** does not wait for that replica condition in the client's commit path. The choice trades waiting against an explicitly defined failure exposure.

For an illustrative timing trace, the local log is durable at 4 ms, a chosen follower's durable copy is ready at 7 ms, and that follower applies the entry at 12 ms. A contract requiring local and that follower's durable storage cannot acknowledge before $\max(4,7)=7$ ms. Requiring application on that follower instead gives at least 12 ms in this trace.

| Boundary | Illustrative time | What it establishes |
|---|---:|---|
| Local flush | 4 ms | Local required log survives |
| Chosen follower flush | 7 ms | Remote required log survives |
| Follower application | 12 ms | That follower can expose the change |

@fig sd_databases_acknowledgement | Illustrative absolute completion times. Acknowledgement at durable receipt does not imply immediate readable application.

A product's synchronous mode can wait for receipt, flush, application, or a selected number of replicas. Spell out the actual setting. If the required replica is unavailable, the system may block or reject writes rather than silently preserving the old guarantee. Some configurations deliberately change the policy, which changes the promise too.

Latency and survival claims need a failure domain. A local copy and a remote copy on the same failing storage system are not independent protection. [PostgreSQL's standby documentation](https://www.postgresql.org/docs/18/warm-standby.html) describes its different replication and synchronous acknowledgement choices.

:::interview Interview lens
**"Does synchronous replication guarantee fresh reads?"** Only if the read source satisfies the required application position or another suitable visibility rule. A durable receipt can precede application. I specify which replicas acknowledge and which replica serves the read instead of assuming those sets are identical.
:::

## 30. Replication lag becomes a read contract

The scorer sees a successful save, refreshes, and receives an old score from a follower. **Replication lag** is the delay or history-position gap between relevant leader progress and follower progress. Measuring time since the last contact is not always the same as measuring unapplied writes.

For an illustrative constant 20 events per second and a 5 s gap, 100 events are missing from that copy. At 200 bytes per event, the payload gap is 20,000 bytes. Those bytes describe exposure on that copy, not automatic permanent loss: a surviving leader or another current replica can still contain them.

@fig sd_databases_lag | Illustrative read before follower application. The response is stale even though the leader already acknowledged its write.

To enforce **read-your-writes**, a session can carry the returned commit position. Read from a source that has applied at least that position, wait within the remaining deadline, or route elsewhere. Position 8 cannot be satisfied by applied position 7. A suitable applied position 9 can satisfy it when those positions refer to the same comparable history.

Sticky routing helps only if the chosen endpoint remains suitable. After failover, an arbitrary timestamp or a position from an unrelated branch is not a freshness proof. Some read classes can permit older state explicitly; others require authoritative visibility. Give each class an honest contract and a timeout behavior.

:::warn Watch out
A recent monitoring heartbeat does not prove zero replication lag. A replica can communicate normally while falling behind on application. Inspect the progress boundary your read guarantee actually depends on.
:::

:::key In one breath
Replicas copy an ordered history and can serve reads under declared visibility rules. Synchronous acknowledgements wait for a configured boundary; asynchronous copies can expose stale state or miss acknowledged history at failover. Durable receipt and applied visibility differ. A read fence uses a comparable committed position and a suitable source, rather than merely a nearby machine.
:::

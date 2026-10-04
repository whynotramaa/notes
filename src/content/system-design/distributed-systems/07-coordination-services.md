@part VII | ZooKeeper, etcd and split brain | We keep shared metadata small and its authority explicit. Discovering a new owner does not revoke every old request. We will inspect coordination APIs, watch recovery, split brain, and membership changes. | where:7

## 25. ZooKeeper and etcd hold control decisions

Heron needs to know which worker owns a publishing role and which configuration version applies. It does not need every viewer payload to pass through the ownership store. A small control record changes less often than the data it governs, and that difference lets us spend coordination effort where the shared decision requires it.

A **coordination service** stores small shared decisions with defined ordering, version, session, and recovery semantics. ZooKeeper and etcd have different APIs and read contracts. [ZooKeeper's overview](https://zookeeper.apache.org/doc/current/zookeeperOver.html) describes its coordination model; [etcd's API guarantees](https://etcd.io/docs/v3.6/learning/api_guarantees/) describe linearizable and serializable operation options and watch boundaries.

Heron might keep an ownership record with role `publisher`, owner B, and epoch 8, plus a configuration revision. A compare-and-change operation can require the expected prior version, so competing claimants cannot both replace the same record without discovering a conflict. A lease or session can indicate that the claimant should still be considered active.

The payload path remains separate. Heron's illustrative live workload is 20 events per second for 50,000 viewers, which produces 20 times 50,000, or 1,000,000 deliveries per second. That fan-out need not become 1,000,000 coordination writes. A control decision can govern many data operations, while the data resource still enforces current authority at its mutation boundary.

A service name is not a contract. Read mode, durable acknowledgement, session expiry, reconnect, and transaction limits all matter. Choose a documented operation, not a vague claim that the product is strongly consistent. Heron reads suitable authority metadata and carries its epoch to the protected resource; the next section explains how clients learn that metadata changed.

@fig sd_ds_trace_25 | Illustrative coordination arithmetic keeps one small epoch record beside 20 deliveries per second of 50,000 bytes; orange marks the checked write boundary between control and payload.

:::story Picture this
A noticeboard tells workers which supervisor is current. Some workers miss the notice and carry old instructions. The receiving desk still checks the supervisor generation before accepting their work.
:::

## 26. A watch needs a restart position and reread

A worker receives a notification that its ownership record changed, then its watch connection breaks. While disconnected, another change occurs. Reconnecting and assuming it saw every transition can leave its local routing or role state old. Notifications are useful, but a client needs a recovery protocol tied to the API it actually uses.

A **watch** informs a client of changes to selected state. Some interfaces expose an event stream with revisions; others expose a trigger that must be reinstalled and followed by a reread. Do not transfer guarantees between APIs. Even an ordered event stream can require resynchronization when the client's needed history has been compacted or otherwise discarded.

In Heron's illustrative revisioned stream, the client processes revision 8 and remembers it. It disconnects while revisions 9 and 10 occur. If replay is available, it resumes from the correct next position and processes both. If that interval is unavailable, it reads a current snapshot and establishes a watch from a compatible revision to avoid another gap.

The local application of notifications also needs care. Parallel handlers must not apply revision 10 and then overwrite it with delayed revision 9. Persist or retain suitable progress when the downstream effect requires it. A reconnected client should treat its prior ownership belief as suspect until it verifies current state, especially before sending a protected write.

A watch is not the resource's authority check. A paused client can miss a notification and later send an old request. Storage still compares the carried epoch or validates current authority atomically. This division gives each mechanism one job: watches help discover state changes; protected writes enforce whether a caller may produce a new effect.

@fig sd_ds_trace_26 | The watch trace resumes from revision 8 after a disconnect that may hide revisions 9 and 10; orange marks the resource-side epoch check that protects an old belief.

:::note Watches have API-specific recovery
A revisioned stream and a one-shot notification have different restart rules. Reread and resubscribe according to the selected service contract.
:::

## 27. Split brain is competing ownership

A's local status page says 'leader', and B's page says 'leader' too. That observation is worrying, but the safety question is whether both can produce accepted effects. Old processes often keep old role names during isolation. A correct protocol can tolerate that belief while rejecting their attempts to extend authoritative history or mutate a fenced resource.

**Split brain** means competing actors believe they own one role. Unfenced takeover can turn that belief into incompatible accepted writes. A single advertised endpoint does not necessarily prevent it: cached routing and delayed requests can reach the old owner. Conversely, two processes claiming leadership need not violate safety if only one has usable authority at the effect boundary.

Heron's ownership store assigns B epoch 8 after A's epoch 7 becomes obsolete. B installs epoch 8 at storage and receives acknowledgement. A then resumes and sends an epoch-7 correction. Storage rejects it. Both processes may still display their local beliefs, but the accepted score mutation has one enforced ownership generation.

If the protected action is sending an external email, storing an epoch in an unrelated database is insufficient unless the mail boundary also validates it or duplicate-safe intent controls the action. Fencing must reach the resource whose effect matters. Some resources do not support this check, requiring a different design or a weaker stated guarantee.

After reconnection, A rereads metadata, steps down, and discards or reconciles unaccepted work under the command protocol. Accepted history is not rewritten merely to make the dashboards match. In an interview, name the competing beliefs, then draw the acceptance boundary. The diagram should show which request is rejected and the exact persisted authority that makes rejection possible.

@fig sd_ds_trace_27 | The split-brain trace grants epoch 8, persists it at storage, and rejects A's epoch 7 request; orange marks the active takeover protection.

:::warn Address replacement is not membership agreement
Old and new address lists can each form a majority without overlap. Use the protocol supported transition with suitable catch-up and recovery.
:::

## 28. Membership updates change the quorum proof

An operator replaces all three voter addresses to move Heron's cluster. If the old group can still communicate internally and the new group starts independently, each group can form its own majority. The arithmetic 'a majority is two' remains true within each group, but the groups share no member. The previous intersection argument no longer applies.

A **membership configuration** defines the participants and voting rule for a protocol. Changing it is itself a coordinated history change. One safe family of transitions uses **joint consensus**, requiring suitable majorities of both old and new configurations during the transition. Implementations may use other supported methods with their own constraints; follow the implementation's specified procedure.

Take old configuration [A,B,C] and new configuration [C,D,E]. Old majority [A,B] and new majority [D,E] are disjoint even though the configurations share C. Merely sharing one listed node is insufficient. During the joint phase, an accepted decision needs an old majority and a new majority, preventing independent decisions under either single rule.

New voters need the required state before depending on their participation. Snapshot installation, log catch-up, and durable configuration handling all belong in the transition. Removing a live old replica from routing does not remove its persisted voting configuration. A client address list and the protocol's accepted membership are different pieces of state.

For Heron, perform only the consensus implementation's supported membership operation, one whose crash recovery is defined. Observe catch-up and commitment rather than editing hosts independently. Configuration caches may remain old after the decision, so resources and protocol messages must still reject obsolete authority. This combines the set proof from Section 12 with the enforcement boundary from Section 15.

@fig sd_ds_trace_28 | The membership trace changes voters from A,B,C to C,D,E; orange marks the joint phase that requires both old and new majorities.

@fig sd_distributed_systems_coord | The fan sends ownership epochs, configuration versions, and membership through one coordination store; orange marks the boundary that keeps payload work elsewhere.

:::interview Interview lens
**"Is the watch the authority check?"** No. It helps clients discover state changes. A delayed client can still act on old information, so the resource or protocol must reject obsolete authority at the effect boundary.
:::

:::key In one breath
Coordination stores support small shared decisions under their documented contracts. Watch consumers need reread and recovery behavior. Resource enforcement prevents old beliefs from becoming old-owner effects. Membership transitions must preserve the consensus protocol rather than swap address lists independently.
:::

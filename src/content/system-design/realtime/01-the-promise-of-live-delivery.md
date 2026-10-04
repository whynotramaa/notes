@part I | Real-time requirements, ordering | We begin with a score changing while a viewer watches. A fresh database does not make the viewer's screen fresh by itself. We will separate authoritative events, delivery latency, ordering, and recovery before choosing a transport. | where:1

## 1. The score exists before the screen knows

The scorer records a boundary and Heron's score changes. The database now contains the new score, but a viewer's already open page still displays the old one. The missing action is delivery. **Real-time delivery** is the bounded-time transfer of changes to interested clients while they are connected. The useful requirement names an allowed delay and what happens during a disconnection.

The word *real-time* has a stricter meaning in some control systems, where missing a deadline can make a result invalid. A sports page usually needs timely updates rather than a hard physical deadline. State which contract the system promises instead of treating a persistent socket as proof of timeliness.

@fig sd_realtime_promise | Illustrative score path. Every stage can contribute delay or fail separately.

Heron's baseline is 20 events per second and 50,000 viewers. Those are different quantities. The upstream service processes twenty input changes, while complete broadcast delivery requires 1,000,000 recipient deliveries per second. Counting only the producer's event rate makes the final stage disappear from the capacity estimate.

:::story Picture this
A stadium official updates the scorebook. A public-address system tells the stands, and each listener interprets the announcement. The scorebook can be correct while a speaker is broken or a listener misses a sentence. The delivery system needs a way to recover the current score after that missed announcement.
:::

## 2. Define the event's identity and order

A viewer receives `score=120` and later `score=121`. If the network repeats the first message after the second, applying values blindly takes the screen backward. An **event ID** identifies one change, while a **sequence number** identifies a position in a declared ordered stream. They answer identity and order respectively.

For one match, the service can assign increasing versions inside the authoritative score transaction. The payload contains match ID, version, event ID, and either a new score or a delta. A repeated event ID can be ignored. A version lower than the applied version can be rejected for state replacement. A missing version means the client needs replay or a fresh snapshot.

@fig sd_realtime_versions | Illustrative match-local version trace. Event identity is separate from its position.

When a viewer opens another match, it must not compare that match version against the old match counter. The ordering scope is part of the state key. Likewise, a new stream incarnation after an intentional reset needs a distinct epoch or another documented identity rule. A bare integer is insufficient when its scope and lifecycle are omitted.

A global order across all matches is often unnecessary and expensive. Match-local order preserves the relationship that viewers need without forcing unrelated matches through one serial writer. If a correction modifies historical scoring, the new current-state version still advances. Wall-clock timestamps alone cannot reliably decide update precedence across independent machines.

## 3. State replacement and deltas recover differently

A message saying `current_score=121` can replace the local value if its version is newer. A message saying `add=1` changes local state and requires every relevant delta exactly once in the correct interpretation. **Snapshot state** communicates a complete current representation. A **delta** communicates a change relative to a prior state.

Snapshots cost more bytes but make recovery simpler. Deltas reduce ordinary payload size but increase dependence on missing-message detection and replay. The design can send deltas during a connected session and fetch a snapshot after a gap. The snapshot must carry the version it represents so the client can decide which later deltas to apply.

@fig sd_realtime_state_delta | Illustrative payload alternatives. A delta names its required predecessor; a replacement supplies the state directly.

Do not say that duplicate suppression produces exactly-once delivery. It can produce an idempotent local effect under the stored-ID or version policy. The network can still repeat bytes, and a client that loses its suppression state needs a defined reset path. State the effect boundary and recovery behavior precisely.

:::note Current state can be more useful than every event
A spectator may need the latest score rather than every intermediate display state. A scorer audit log needs every accepted scoring action. These requirements imply different coalescing and replay rules even when they originate from the same stream.
:::

## 4. Latency is a path, not a socket property

The illustrative update path spends 5 milliseconds validating, 10 committing, 5 publishing, 15 dispatching, and 5 applying at the client. The sum is 40 milliseconds under those assumptions. A persistent connection removes repeated setup work, but it does not remove database, queue, scheduling, or rendering delay.

**End-to-end latency** measures the interval between a named source event and a named visible outcome. Define whether the start is the scorer's click, durable commit, or event publication. Define whether the end is gateway write, client receipt, or screen update. Metrics using different boundaries cannot be compared as if they measured the same experience.

@fig sd_realtime_latency | Computed illustrative stage budget. These are chosen durations, not measurements or a production guarantee.

Queue age, reconnect time, and tail latency can dominate the average even when the normal path is short. Instrument source versions and timestamps with clock limitations in mind. For reliable cross-machine durations, trace local intervals and use synchronized clocks with stated uncertainty. Do not subtract arbitrary unsynchronized wall clocks and call the result network latency.

:::warn Watch out
A gateway acknowledging that it wrote bytes into a socket buffer does not prove the viewer saw them. The client can disconnect immediately afterward. If the product needs stronger delivery evidence, add an application acknowledgement with a stated meaning and retention policy.
:::

:::interview Interview lens
**"What does real-time mean in your design?"** I would name the source and visible outcome and give a latency requirement for a healthy connected client. Then I would state the disconnection and replay behavior separately. Match-local versions supply order, and event IDs supply duplicate identity. A transport choice alone does not establish timeliness or durable delivery.
:::

:::key In one breath
A committed score and a displayed score are different states. Real-time delivery needs a latency boundary, event identity, ordering scope, and gap recovery. Snapshots and deltas have different skipping and replay costs. Count every stage through client application rather than assuming a socket makes the result timely.
:::

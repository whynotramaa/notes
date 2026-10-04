@part VII | Reconnect and replay | We treat disconnection as an ordinary state transition. Retrying a socket cannot recover an unknown gap by itself. We will build cursors, bounded history, snapshot catch-up, and reconnect admission with duplicate-safe application. | where:7

## 25. A reconnect carries progress

The viewer last applied version 101 and reconnects after five seconds. The service should not merely send whatever happens next. A **resume cursor** identifies the last accepted position or state version under a stream's declared ordering. The client sends it while opening or subscribing so the service can supply later history.

At twenty events per second, a five-second illustrative gap contains one hundred events. Their payload totals 20,000 bytes at 200 each. Replay is a different workload from current live delivery, so reserve capacity for it. A widespread outage can make many clients request the same history at once.

@fig sd_realtime_replay | Computed illustrative replay volume for one viewer. Event rate is assumed constant during the gap.

The cursor should represent applied progress if application effects matter. A cursor advanced when bytes arrive but before the reducer succeeds can skip an unapplied event after a crash. If the client cannot persist progress, a new session may start from a snapshot. Define cursor authenticity, scope, expiration, and permissions; do not let a forged cursor access arbitrary retained streams.

:::story Picture this
You stop listening to a numbered radio commentary at sentence 101. On returning, you ask for sentence 102 onward. If the station no longer has those recordings, it gives the current scorebook instead. Reopening the radio without saying where you stopped cannot tell the station what you missed.
:::

## 26. Retention determines the recovery horizon

Heron's event log stores twenty 200-byte events each second. One hour contains 14,400,000 payload bytes, and one day contains 345,600,000. **Retention** is the policy deciding how long or how much history remains available. Its recovery purpose is to bound which cursors can be replayed.

A client whose position precedes retained history cannot receive a complete delta replay. Return an explicit cursor-too-old outcome and fetch a current versioned snapshot. Do not silently begin from the earliest retained event because the client may apply that tail to an incompatible older state. Completeness is part of cursor validity.

@fig sd_realtime_retention | Illustrative logical retention positions, not a duration promise. The old cursor precedes the available replay range.

A reconnect service should check the cursor against the earliest retained position before promising a replay. If retention advances during the transfer, the chosen read must hold a compatible history boundary or detect the loss. Otherwise it can start a replay that silently becomes incomplete. Cursor validation and the actual replay view need a coherent relationship.

Retention cost also includes replicas, storage format, and cleanup. If event deletion is required for privacy, a durable replay log needs its own data-retention controls. A day of payload is not a complete disk budget. State the difference between logical history, physical copies, and backup retention.

## 27. Snapshot plus tail needs a consistent version

A late viewer can fetch a 2,000-byte current score snapshot instead of replaying a long history. The snapshot carries version $v$. The client then applies only events after $v$, buffering or rejecting earlier ones. The snapshot and event versions must refer to the same authoritative update sequence.

For the illustrative five-second gap, a snapshot plus one hundred event payloads totals 22,000 bytes. This is not always cheaper than replaying the gap alone; its value is a known starting state and repair of a lost or expired base. A new viewer might need only the snapshot and events occurring during its fetch rather than the entire missed interval.

@fig sd_realtime_snapshot_tail | Illustrative snapshot-tail protocol. Shared source versions close the gap between state and history.

Corrections and snapshots need clear reducer semantics. A delta must not be applied twice because it appeared in both the snapshot and the replayed tail. Compare its version against the snapshot boundary. If the source cannot provide a compatible position, use a capture protocol that establishes one rather than guessing from clock time.

:::note Replay and live delivery can overlap
A client catching up may receive live events while history is still arriving. Merge them by identity and order, or hold live delivery behind a bounded replay boundary. Applying arrival order without a version rule can duplicate or reorder state changes.
:::

## 28. Reconnect with jitter and admission limits

A gateway outage closes fifty thousand connections. If they all reconnect immediately, handshake CPU, authentication, registry writes, and snapshot reads can fail together. **Reconnect backoff** delays repeated connection attempts after failure. **Jitter** spreads those delays so clients do not retry on the same clock edge.

Spreading fifty thousand first attempts uniformly across an illustrative ten-second window gives an expected five thousand attempts per second, not a strict per-second bound. Random variation still creates bursts. A server admission limit and a queue or retry response provide the enforceable capacity boundary.

@fig sd_realtime_reconnect | Computed expected reconnect rate under a stated uniform-spreading assumption. Jitter alone is not a hard rate limiter.

Reset backoff only after a sufficiently stable connection under a declared rule. Otherwise a flapping link can repeatedly regain an aggressive initial retry rate. Bound replay per client and globally so recovery does not starve healthy live delivery. After an outage, track lag and admission success, not only the number of established sockets.

:::warn Watch out
A retry cursor must not advance just because a gateway enqueued the next event. The gateway can crash before transmission and the client can crash before applying it. Store progress at the effect boundary the product requires.
:::

:::interview Interview lens
**"What happens after a viewer reconnects?"** The viewer supplies its last applied match position. The service authorizes that stream and replays retained events after the cursor. If history is unavailable, it supplies a versioned snapshot and compatible tail. Jitter and server admission limits keep a shared outage from becoming an unbounded reconnect and replay burst.
:::

:::key In one breath
Reconnect needs applied progress, retained history, and a cursor-validity rule. An expired cursor requires a new snapshot base rather than an arbitrary retained tail. Snapshot versions and stream positions must share a state sequence. Backoff spreads retries, admission controls bound them, and recovery capacity is counted beside live traffic.
:::

@part II | Consistency models | We describe what different readers may observe. Similar-sounding consistency names permit different histories. We will follow completed writes, causal dependencies, and session receipts. | where:2

## 5. Place operations on a legal timeline

Two viewers refresh while a scorer changes 10 to 11. One read finishes before the write begins, and another starts after it finishes. The first may return 10 and the second must return 11 under Heron's linearizable score-register contract. The interesting case is a read that overlaps the write; it may return either value.

Each operation has an invocation and a response. A **linearization point** is an instant between those boundaries at which the operation appears to take effect in the single logical order. It is a reasoning device, not necessarily a physical timestamp stored in the row. Different implementations make that instant correspond to different protocol events.

In our illustrative history, the write runs from time 2 to time 5. Read X runs from time 1 to time 3 and can be placed before the write. Read Y runs from time 6 to time 7 and must come after it. The resulting legal values are X=10 and Y=11, assuming no intervening write changes the score.

A follower serving its local value 10 to Y violates this contract even if it catches up immediately afterward. Eventual repair cannot make that completed response disappear. A leader also needs proof that it remains authoritative when serving a linearizable read; reading its local memory is insufficient after a partition or leadership change.

When testing a system, record invocation, result, and response boundaries rather than comparing wall-clock timestamps from different machines without error bounds. A history checker asks whether any legal ordering exists. The point is the externally observed property. 'All replicas usually match' describes a tendency and cannot replace that property.

@fig sd_ds_trace_5 | The timeline allows overlapping read X to see 10 or 11 but requires later read Y to see the completed write; orange marks the illegal stale result.

:::story Picture this
A clerk gives you a receipt naming ledger page 8. Another clerk can serve your next request only after its view includes that page. Being at the same desk yesterday does not establish today ledger progress.
:::

## 6. Eventual convergence needs a repair mechanism

A follower shows 10 while its leader shows 11. This disagreement alone does not tell us whether the system is broken. It may be an allowed intermediate state. The next question is what forces the follower to learn the change and what happens if an update message never arrives on its first attempt.

**Eventual consistency** permits temporary divergence but requires convergence under the system's stated conditions, usually when updates stop and communication and repair continue. The phrase contains no universal deadline. A promised maximum lag is a separate quantitative contract. Without a repair path, a dropped update can leave a replica old forever, so asynchronous delivery alone is insufficient.

Start A, B, and C at version 7. A accepts version 8; B receives it; C misses the transfer. A later comparison discovers that C ends at 7 and sends the missing entry. C applies 8, and all reachable replicas now share the same version. The intermediate version vector is [8,8,7], followed by [8,8,8].

**Anti-entropy** compares replica state in the background and repairs differences. **Read repair** uses a read to discover and sometimes fix a disagreement. Both need version ordering or conflict metadata, a source of repair data, and a policy for deletion. Copying whichever response arrived first can propagate an older state instead of repairing it.

Heron's public score displays can tolerate brief divergence, but the official correction history remains ordered separately. Measure both lag and failed repairs. A backlog that grows continually never reaches the assumed quiescent repair condition. A deleted record also needs a retained deletion marker or another rule, or a returning old replica can restore it.

@fig sd_ds_trace_6 | The convergence trace shows C missing v8 and requesting it after communication returns; orange marks the repaired [8,8,8] state.

:::note History positions need one meaning
An index from one independent shard is not automatically comparable with an index from another. Carry the dependencies appropriate to the view.
:::

## 7. Causal order follows dependencies

A viewer posts 'that score was wrong' and a scorer replies 'fixed'. Showing the reply before the complaint makes the conversation hard to understand. Showing a scoreboard correction before the event it explains can be worse. The dependency between those actions matters even when unrelated conversations need no common global order.

**Causal consistency** requires readers to observe a change only after the changes it depends on. If an event happens before another in one process, or a message carries the first event's information into the second, the relation extends through those steps. Events with neither dependency are **concurrent**, meaning their relative order is not determined by causality.

Let complaint P have dependency position A:7. A reply Q carries that dependency plus its own position B:4. A replica that has B:4 but only A:6 must hold Q until it obtains A:7. It can display another independent message from C without waiting for a single universal order across all messages.

A **logical clock** advances according to events and messages instead of reading physical time. [Leslie Lamport's original paper](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/) explains why message order matters. A scalar logical clock respects causal order, but a larger scalar alone does not prove a causal relation. Dependency vectors can represent a stronger comparison at greater metadata cost.

For Heron, carrying a needed source position with a derived update gives a direct enforcement rule. Delay visibility until that prerequisite is available. The cost is metadata and possible waiting, not just storage bytes. A clock timestamp taken on an unsynchronized machine cannot substitute for the dependency, because a later-looking timestamp can belong to an unrelated or earlier event.

@fig sd_ds_trace_7 | The causal trace holds reply Q while replica B lacks complaint P at A:7; orange marks release after the dependency arrives.

:::warn A later clock is not a later cause
Physical clocks can disagree, and unrelated events can have ordered timestamps. Preserve dependencies when the contract is causal.
:::

## 8. A session receipt carries a minimum position

The scorer saves a correction, then refreshes onto a follower. The follower still shows the previous score. Many users call this a failed save even when the authoritative write succeeded. The promise we need here belongs to the user's session; we do not necessarily need every viewer's read to obey the same global rule.

**Read-your-writes** means a session's later reads include its completed writes. **Monotonic reads** means successive reads in that session do not move backward in the relevant history. They differ: a user who never writes can still observe a backward read. Both require versions or positions that are comparable under the storage protocol.

Heron's correction returns required position 8. A follower applied through 7 cannot serve the fenced read yet. A follower applied through 9 can serve it, assuming the view includes the needed history. If the user subsequently reads position 12, the session raises its minimum to 12. Its next read must not return a state from position 9.

The session can carry the maximum required position, and the server can wait for a suitable replica or route elsewhere. Sticky routing avoids some lagging followers but offers no proof after failover. Nor does a position from one independent shard automatically compare with a position on another. A multi-shard view needs the corresponding set of dependencies.

This is a useful whiteboard distinction. A receipt says what the reader must have seen, while a routing rule says where a request goes. Combine them when necessary, but do not confuse them. If the required position cannot be reached within the deadline, return an explicit failure or a permitted degraded result rather than breaking the session guarantee silently.

@fig sd_ds_trace_8 | The session receipt carries minimum position 8, routes away from replica A at 7, and accepts B at 9; orange marks the next receipt that raises the minimum to 12.

@fig sd_distributed_systems_history | The sequence places a later reader after a completed write; orange marks the returned version that must be v or newer.

:::interview Interview lens
**"Can session guarantees replace linearizability?"** They can satisfy some user needs at lower coordination cost, but they do not impose one global real-time order. I would state the required session and cross-user observation promises separately.
:::

:::key In one breath
Linearizability respects completed operations in real time. Eventual consistency needs both a convergence mechanism and stated conditions. Causal consistency preserves dependencies without ordering unrelated writes. Session positions prevent a reader from moving behind its required history.
:::

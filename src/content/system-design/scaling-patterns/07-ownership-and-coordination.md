@part VII | Leader election, distributed locks | We decide who may act for a shared task. A paused process can resume after its lease expires. We will compare leader election, leases, fencing, and lock scope. | where:7

## 25. Leader election and authority

Several schedulers want to issue the same periodic job. **Leader election** selects one current owner through an agreement mechanism. Merely declaring one process leader in its own memory does not establish authority for the others.

A coordination service commits a leader record or lease through its consensus rules. Workers watch that record and attach its ownership generation to protected work. During a partition, an old process can remain alive even though it cannot renew its authority. The new owner must not accept that survival as permission for the old owner to continue. Separate agreement on ownership from enforcement at the resource being changed. A leader can coordinate work while the job effects still need idempotency.

Imagine the old scheduler losing communication with the coordinator while retaining communication with the job target. The coordinator can select a replacement, yet the old process still has the physical ability to send instructions. A target accepting both would invalidate the election's intended effect exclusivity. Carry the committed generation to the target and enforce it at the mutation boundary, or use a target-side state transition with equivalent protection. Keep job identity as well, because even the current owner can retry after a lost reply. Ownership order prevents stale actors; repeatable effect identity prevents duplicates from valid actors.

@fig sd_scaling_patterns_25 | Illustrative leader election and authority. Election establishes ownership while the resource enforces the chosen generation. Orange marks current ownership enforced by the protected resource.

A heartbeat timeout suspects failure; it cannot distinguish a dead process from a partitioned or paused one.

:::story Picture this
A theatre has one stage manager's clipboard authorizing scene changes. When that manager leaves, the replacement receives a numbered baton, and the old manager's late instructions are rejected at the stage door. The baton matters at the resource that applies the instruction, not only in a separate office that claims a new manager exists.
:::

## 26. Leases and pause expiry

A renewal response can itself be lost. The worker must use the lease protocol’s defined authority and stop relying on uncertain renewal before issuing an effect that cannot be rejected later. A local timer cannot create a new lease.

A worker holds a ten-second ownership lease and pauses while its task runs for 15 seconds. A **lease** is authority that expires unless renewed. Its expiry lets another worker proceed, but it cannot stop the paused worker from later resuming.

The illustrative overlap risk is five seconds, computed as the 15-second work duration minus the ten-second lease duration. Renewals reduce ordinary expiry but do not eliminate a pause longer than the renewal window. Treat the lease as coordination state and require effect enforcement elsewhere. Use the coordination service’s authority and documented timing assumptions, rather than comparing unsynchronized local clocks as though they created a global ordering.

Place the pause after the worker's last successful authority check. The illustrated lease can expire during the 15-second task even though the worker's local code has not executed another check. A replacement then acquires authority before the old process resumes. Rechecking the lease in the worker helps ordinary cases but leaves another possible pause between that check and the effect. Enforce the current generation at the target instead. A longer lease delays replacement after real failure and does not prove exclusion under an unbounded pause. The five-second excess in the figure describes this particular scenario, not a universal overlap bound.

@fig sd_scaling_patterns_26 | Illustrative leases and pause expiry. A lease expires while a paused worker can later resume. Orange marks resumed work beyond the expired lease, which the target must reject.

Making the lease much longer increases failover delay and still cannot cover an arbitrarily long pause.

:::note Lease expiry and stale owners
Lease expiry releases coordination authority, not the old process’s ability to execute instructions. A delayed worker can overlap its replacement. Protect effects with fencing or duplicate-safe state transitions.
:::

## 27. Fencing tokens at the resource

The old worker resumes with an expired lease and writes a file. The new worker has already written a newer result. A **fencing token** is an increasing ownership generation that the protected resource checks before accepting work.

The coordinator assigns a newer generation to the new owner. The storage service remembers the highest accepted generation and rejects a request with an older one. Checking only inside the worker is insufficient because that worker can pause after its check. The check must guard the actual effect. Fencing works only when the resource can enforce the token with the write, or when another authoritative state transition supplies the equivalent protection.

The resource must record the newer generation before treating takeover as protected against delayed older work. Otherwise a late old request can still be the first request the resource sees after coordinator election. Couple installation or comparison of the generation with the protected state transition. Repeated requests from the current generation can still need a business deduplication rule, because a fence orders owners rather than individual intentions. If the target is an external provider that cannot interpret a generation, do not claim a coordinator token alone protects its effects. Use the provider's supported identity contract or an explicit reconciliation workflow.

@fig sd_scaling_patterns_27 | Illustrative fencing tokens at the resource. The protected write rejects the obsolete ownership generation. Orange marks the target rejecting the obsolete generation.

A random lock value proves who should release a lock, but randomness does not establish a newer ownership generation.

:::warn Watch out
A fencing token lets the resource reject obsolete owners. Compare and persist it atomically with the protected effect. A lease alone coordinates contenders but does not enforce exclusion after pauses.
:::

## 28. Distributed locks and the smallest scope

A service adds a distributed lock before updating a row that already supports a conditional atomic update. The lock adds acquisition, lease expiry, and ownership failure without strengthening the row rule. A **distributed lock** coordinates access among processes through shared state.

Use a database transaction or conditional update when it directly enforces the invariant. Use a lock when the protected operation truly requires shared coordination, then name its scope, timeout, release identity, renewal rule, and effect enforcement. Release only a lock held by the releasing owner; a delayed release must not delete a successor’s lock. Redis discusses ownership values and expiry in its [distributed lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/). These mechanisms still need the failure assumptions of the protected operation.

A worker pauses, its lock expires, and another worker acquires the same key with a different owner value. The first worker resumes its cleanup and must compare the stored value before deleting. A plain delete would remove the replacement's protection even though the releasing worker no longer owns the key. Perform comparison and deletion atomically so ownership cannot change between them. This solves safe release but does not automatically fence writes already in flight toward another resource. For a database row invariant, an atomic conditional update avoids both this lock lifecycle and the separate protected-effect problem.

@fig sd_scaling_patterns_28 | Illustrative distributed locks and the smallest scope. A delayed release checks ownership before deleting the successor's lock. Orange marks ownership-checked release that cannot delete a successor's lock.

Treating a cache-based lock as a guarantee for an irreversible external effect can exceed its actual failure contract.

:::interview Interview lens
**"Why must fencing reach the resource that applies the write?"** Choose the smallest authority that enforces the rule. A distributed lock needs safe ownership, expiry, and release, and may need fencing at the effect. Prefer an atomic resource operation when it already solves the race.
:::

:::key In one breath
Election establishes an owner through an agreement mechanism. Leases expire, but expiry cannot stop a paused old process. A protected resource must reject obsolete fencing tokens or otherwise enforce the invariant.
:::

@part VII | Distributed limiting with Redis | We make many gateways share one admission decision. Atomic arithmetic prevents local races, but failover and partitions still affect the recovered allowance. We will trace double spending, write a bounded script, partition policy keys, and plan limiter outages. | where:7

## 25. The read-check-write race
The shared count is 99 under a 100-request policy. Gateway A reads 99, then gateway B reads 99. Both conclude that the final slot is free. If both increment after their separate decisions, the count becomes 101 and both may already have admitted work.

An **atomic operation** is observed as one indivisible state transition for the relevant concurrent callers. The whole read-check-update must be atomic, not just its final increment. [Redis scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/) serializes a script against other commands on that server, allowing one caller to see the state left by the other.

@fig sd_rate_limiting_race | Illustrative race. Atomic INCR after separate checks cannot undo already-issued allow decisions.

With accepted-only fixed-window accounting, A's atomic operation sees 99 and stores 100. B's then sees 100 and rejects without mutation. In a token bucket, the same order refills and spends a final token once. Local locking inside one gateway does not serialize another gateway's calls.

:::story Picture this
Two clerks both see the last ticket on a shared list and promise it before either crosses it out. A single clerk who checks and marks the ticket in one turn prevents the double promise. A separate pen for each clerk does not help.
:::
## 26. The atomic procedure and its limits
A bounded token-bucket script reads balance and last time, derives nonnegative elapsed time, refills under the cap, checks validated cost, and stores the resulting state and cleanup. It returns allow or deny with the remaining balance and advisory wait. No network call or unbounded scan belongs inside that procedure.

@fig sd_rate_limiting_script | Local atomic procedure. Validate input and predictable error conditions before any mutation.

Atomic execution blocks competing commands while it runs, so long scripts can harm unrelated keys on the same server. Validate positive refill, capacity, cost, and time units. Redis script atomicity does not generally mean earlier writes are rolled back if a later command fails; preflight the bounded operation so the mutation sequence has no expected partial-error path.

@fig sd_rate_limiting_atomiclimits | Separate guarantees. A local atomic script does not make asynchronous replication lossless.

Here is the bounded decision in pseudocode. The state load and store occur inside the same Redis script; `clock()` denotes the chosen authoritative time source, not an untrusted request timestamp. Validate all policy inputs and the expected stored types before the first mutation. The returned delay is advisory, while the update is one serialized decision.

```python
validate_positive(capacity, refill_rate, request_cost)
balance, previous = load_checked_state(key, capacity)
now = max(previous, clock())
refilled = min(capacity, balance + (now - previous) * refill_rate)
allowed = refilled >= request_cost
remaining = refilled - request_cost if allowed else refilled
wait = 0 if allowed else (request_cost - refilled) / refill_rate
store_state(key, remaining, now)
expire_after(key, capacity / refill_rate)
return allowed, remaining, wait
```

With capacity 100 and refill 100 divided by 60, a completely empty bucket refills in 60 seconds. Expiring no earlier than that full horizon after the latest retained decision conservatively ensures that recreating a full bucket does not invent allowance. A balance of 15 would actually reach full after 51 seconds, but using the full horizon avoids a balance-dependent expiration rule. Round the stored lifetime upward to the API's supported unit and keep state mutation and expiration together.

The script's state should expire only after forgotten allowance is safe to recreate. A full idle token bucket can be recreated after its refill horizon, while a recent partially spent one cannot be discarded immediately without granting extra credit.

:::warn Watch out
A successful Lua return is not proof that every replica contains the debit. If Redis failover recovers stale state, previously spent tokens may reappear. Exact hard quotas may need a stronger durable authority than a best-effort cache-backed limiter.
:::
## 27. Shards and multiple dimensions
At 1,000 admitted-policy checks per second, checking user, tenant, and endpoint rules separately can produce 3,000 limiter operations per second before retries. Combining related decisions can reduce round trips, but all required keys need a compatible atomic ownership boundary.

Redis Cluster maps keys to slots. Multi-key atomic operations require suitable key placement; hash tags can deliberately colocate related keys. [The cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) explains the slot and replication model. A global tenant key can become a hot key even while user keys distribute well.

@fig sd_rate_limiting_dimensionshared | Multiple dimensions. Decide whether admission requires all budgets and how their debit is coordinated.

@fig sd_rate_limiting_hotkey | Hot-key dependency. Distributing users does not remove their shared aggregate limit.

If budgets live on different shards, an atomic all-or-nothing debit is no longer supplied by a single local script. Choose deliberate partial charging, a reservation protocol, conservative allocation, or another authority. Do not pretend that compensating a failed second debit cannot itself race or fail.

:::note Token leases
A central authority can allocate bounded chunks to gateways, letting them admit locally until a chunk is spent. This trades per-request round trips for stranded allowance and recovery accounting. Each chunk needs ownership and expiration rules that prevent a restarted gateway from spending the same allocation twice.
:::
## 28. Unavailable limiter and partition choices
The Redis call times out. **Fail open** admits despite inability to verify the normal rule. **Fail closed** rejects because the normal decision is unavailable. Neither is universally correct: public read availability, abuse exposure, hard quota integrity, and protected resource capacity lead to different choices.

A bounded local fallback is an explicit third policy. Four gateways each using an independent 100-request allowance can admit 400 in aggregate, so it cannot preserve the original shared 100 limit. Dividing the allowance into 25 each bounds aggregate admission under the stated fixed membership, but uneven demand can strand unused allowance.

@fig sd_rate_limiting_fallback | Illustrative fixed membership. Dynamic membership and recovered allocations require an additional ownership protocol.

If each gateway holds 20 unused leased tokens when it disappears, four lost allocations can strand 80 tokens. Returning them safely requires knowing they cannot still be spent. This is the same ownership problem as recovering work under leases, now applied to admission credit.

:::interview Interview lens
**"What happens when Redis goes down?"** The service follows a declared fail-open, fail-closed, or bounded-fallback policy for each operation class. Independent local full budgets would multiply the global allowance. I protect the downstream capacity and state which exactness is relaxed rather than assuming fallback preserves the shared rule.
:::
:::key In one breath
Distributed enforcement needs one atomic decision boundary for each shared budget. Redis scripting prevents same-server interleaving, but replication, failover, and cross-shard budgets add separate guarantees. Hot aggregate keys may remain serialized even when user keys shard. Limiter outage behavior must name its admitted bound, resource protection, and possible loss of exactness.
:::

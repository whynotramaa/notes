@part VIII | Case study: one incident | We now follow one fault across admission, state, traffic, and restoration. Every recovery mechanism must preserve the same operation contract rather than creating a new failure elsewhere. We will reconcile the capacity, timing, and data guarantees and identify what each component contributes. | where:8

## 29. Before the incident
Heron's illustrative application variant has four replicas with a combined assumed capacity of 1,400 requests per second. Its peak is 1,000, leaving 400 of normal headroom. Required score reads have a deadline, optional recommendations have a separate bounded pool, and commands retain their identities with their committed effects.

The database has safe write ownership and recoverable history. Cache reads use the declared freshness rule. Health probes distinguish inability to accept new work from a process needing restart. These mechanisms must already be active; installing them while an incident is underway changes the system during diagnosis.

@fig sd_reliability_normal | Assumed reliability variant of Heron. Capacity figures require workload-specific tests.

Use a failure matrix to say which incident is covered by which mechanism. Losing a worker needs routing and survivor capacity. Losing a writer needs recovery and fencing. Losing a region needs its own service and recovery plan. A bad global credential rollout can defeat several of these paths together.

:::story Picture this
A fire drill assigns jobs before smoke appears. The alarm detects, the door controls the route, and the assembly list checks who arrived. Giving every person the same vague instruction to be careful does not replace those separate jobs.
:::
## 30. During the incident
One replica disappears. The healthy fleet has 1,050 requests per second of assumed capacity, only 50 above original peak demand. If 5% of requests launch an additional speculative attempt, total demand becomes 1,050. **Hedging** sends an extra eligible attempt before the original finishes to reduce a long-tail wait.

That arithmetic shows why hedging belongs inside a capacity budget. It can help a read waiting on an unusually slow independent path, but it can worsen a fleet-wide slowdown. It also needs cancellation and safe semantics. Do not hedge a non-idempotent write merely because its reply is late.

@fig sd_reliability_hedge | Illustrative admission arithmetic. Correlated slowness can make speculative attempts unhelpful.

If usable capacity falls further, admit less work and serve only permitted degraded responses. Keep state-changing commands protected by the same identity and authority checks. Observe original demand separately from attempts; otherwise a retry surge looks like new user interest and can mislead routing or scaling decisions.

:::warn Watch out
Extra attempts are workload, even when called failover, retries, or hedges. Count them in the same resource model. A post-failure capacity plan that counts only original requests is incomplete.
:::
## 31. Returning safely
The dependency answers a probe, but its cache is cold and its database pool is rebuilding. Open traffic gradually. An illustrative canary receives 5% of 1,000 peak requests per second, or 50, while the established path carries 950. Compare correctness, latency, and resource saturation before increasing the share.

A **canary** is a limited exposure used to observe a changed or recovered path before wider rollout. It does not prove the full workload fits, especially for hot keys, connection limits, or traffic that only appears at a larger share. Its job is to reduce exposure while collecting relevant evidence.

@fig sd_reliability_canary | Illustrative canary split. Full-capacity testing remains separate from this limited exposure.

Do not clear a backlog by flooding the recovering database. Recovered queues use net spare capacity, and retries keep their budgets. Reconcile any uncertain command before declaring it failed or repeating it with a new identity. The incident ends when the chosen user operation meets its contract, not when every dashboard turns green independently.

:::note Recovery observability
Record the admission state, breaker state, original request rate, retry rate, queue age, authority token, and replay position. These connect the causal chain. A single aggregate error rate cannot explain whether recovery is waiting on routing, capacity, or state.
:::
## 32. What each mechanism contributes
At the whiteboard, explain a score correction during a worker loss. Admission keeps the request inside capacity, the deadline bounds waiting, the database commits the command and identity together, and the retry owner recovers the result. Health checks move new work; fencing prevents an obsolete writer from changing authoritative state.

For a regional disaster, the recovery copy and retained log supply recoverable state. Verification establishes application invariants, and routing makes the restored capability reachable. In the illustrative drill the serial stages total 360 seconds against a 600-second objective; the data gap must be measured independently against the RPO.

@fig sd_reliability_jobs | Mechanism summary. These jobs fit together but are not interchangeable.

@fig sd_reliability_budgetcard | Independent dimensions of the illustrative plan. A better result on one dimension does not establish the others.

This chapter has not supplied a consensus implementation or a product-specific backup policy. Those are boundaries to verify in the chosen system. The next unit turns admission from a general reliability rule into explicit per-user rate algorithms, including the races and failure modes of shared enforcement.

:::interview Interview lens
**"Walk me through your design when a required dependency fails."** I identify the affected operation, stop wasting its deadline and resource budget, and preserve safe outcomes for uncertain writes. I route only to state and capacity that can meet the contract, fence obsolete owners, and use permitted degradation where possible. If ordinary replicas are defeated, I restore independently recoverable state and verify the service against separate RTO and RPO objectives.
:::
:::key In one breath
The same operation contract must survive normal execution, fault detection, failover, and recovery. Spare capacity is consumed by retries, hedges, and backlogs as well as original traffic. Reopen a recovered path gradually while preserving command identity and write authority. Reconcile capacity, downtime, and recoverable data separately, because none of them proves the others.
:::

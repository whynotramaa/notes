@part VI | Health checks and failover | We turn observations into routing and ownership changes without mistaking suspicion for proof. A reachable process may be unable to serve useful requests. We will distinguish readiness from liveness, trace failover delay, fence old writers, and reopen traffic safely. | where:6

## 21. Health checks measure a chosen capability
Heron's application answers a process ping but has no usable database connections. A **health check** is a probe of a specified capability. Its result is evidence about that capability at that moment, not a complete certificate that all user requests will succeed.

A **liveness** check asks whether restarting a process may help it make progress. A **readiness** check asks whether it should receive new work now. A startup check can give initialization time before either policy applies. An expensive readiness probe that exercises every dependency on every interval can itself increase overload.

@fig sd_reliability_checks | Probe purposes. A process ping alone cannot establish end-to-end success.

Include representative user-path measurements separately. If an optional recommendations service fails, readiness should not necessarily remove a score-serving replica. Conversely, an application unable to perform required writes must not advertise write readiness. Match the probe and route to the operation.

:::story Picture this
A shop has lights on, unlocked doors, and a cashier with a working payment terminal. Those are different checks. A light being on does not mean a sale can complete, and a broken card terminal need not prevent cash sales if the shop permits them.
:::
## 22. Detection thresholds and draining
One missed probe can be a scheduling pause rather than a dead host. Several consecutive failures reduce sensitivity to a transient blip, at the cost of slower removal. An illustrative policy probes every 5 seconds and requires 3 failures. From the first relevant probe position, the modeled detection interval is 15 seconds.

Real detection depends on phase, probe timeout, and scheduling. State those assumptions rather than claiming an exact universal bound. After removing a replica from new routing, allow admitted work to finish within its deadlines. This **draining** phase differs from immediately terminating the process.

@fig sd_reliability_detection | Illustrative interval model. Probe phase and timeout can change real detection timing.

Load-induced failed probes can remove useful capacity and start a cascade. Keep probes cheap enough to run under stress, but measure actual operation success elsewhere. Use recovery thresholds and gradual reintroduction to avoid route flapping. The failure test should include partial slowness, not just a process that stops instantly.

:::warn Watch out
Restarting every replica because a shared database is unavailable can erase caches and make recovery harder. A dependency outage is not automatically a liveness failure in each caller.
:::
## 23. Failover is a multi-stage operation
The active score writer disappears. **Failover** transfers serving or write ownership to another usable instance. Detection is only its first stage. The candidate may need to recover state, prove ownership, and receive traffic before users can complete new operations.

An illustrative trace assigns 15 seconds to detection, 10 to safe promotion, and 5 to routing. Its total is 30 seconds. A promise shorter than this needs a different mechanism, smaller measured stage costs, or a useful degraded mode during the transition.

@fig sd_reliability_failover | Illustrative stages, not product timings. Parallel stages require a different critical-path calculation.

@fig sd_reliability_failovertrace | Ownership trace. Being selected does not itself make the candidate a safe writer.

A replica can answer reads before it is eligible for writes, if the read contract permits its state. Describe these stages explicitly in a design. That often gives a more useful recovery plan than forcing the whole service to wait for the slowest capability.

:::note DNS is not immediate routing
A DNS update does not erase previously cached answers or existing connections. If it is part of failover, cached-name lifetime and connection rotation belong in the recovery analysis.
:::
## 24. Fencing prevents two surviving writers
The old writer is unreachable from the controller but still reachable from some clients. Promoting another writer without revoking the old one's authority can create **split brain**, meaning incompatible owners act as if each has sole authority. A failure detector only suspects a peer; it cannot prove the peer stopped.

A **fencing token** is an increasing authority value that the protected resource checks with each operation. The new owner receives a newer token. The resource rejects writes carrying an older token even if an old process later resumes. The rejection must happen where the effect is committed.

@fig sd_reliability_fence | Fencing concept. Token ordering must come from the ownership protocol and the protected resource must enforce it.

A lease without resource-side enforcement can leave a paused process acting on expired beliefs. A distributed lock that every caller merely promises to respect has the same risk. The coordination unit supplies the algorithm; this unit insists that failover test include a delayed old writer returning after promotion.

:::interview Interview lens
**"Why is leader promotion not enough?"** The old leader may still run in another network partition. The storage boundary must reject obsolete authority, and the new leader must have an acceptable committed state. A health-check failure alone establishes neither condition.
:::
:::key In one breath
A health check reports a specific capability, and readiness differs from liveness. Removal, draining, state recovery, promotion, and routing all contribute to failover. Failure suspicion cannot prove the old writer stopped. Fence obsolete owners where effects commit, and reintroduce recovered capacity gradually.
:::

@part V | Health checks and failover | A destination can be present in a directory and still be unable to serve. Removing it protects new requests but cannot undo a write already attempted there. We will build health evidence, measure detection time, and route around failures within a survivor capacity budget. | where:5

## 18. Active and passive health checks

Heron can connect to an application whose request handlers are stuck waiting for a database. A successful TCP handshake proves transport reachability, not useful application service. A **health check** tests a stated ability, and the route uses its result as evidence rather than certainty.

An **active check** sends a probe independently of user traffic. A **passive check** observes actual request outcomes such as connection failure, timeout or selected error responses. Active checks can detect a quiet endpoint before a user reaches it. Passive checks exercise real work, but a cold endpoint may supply no observations and a user-specific error may not indicate machine failure.

Heron's illustrative active policy probes every 5 seconds and removes an endpoint after 3 consecutive failures. With a 1-second timeout and starts on a fixed 5-second schedule, detection takes between 11 and 16 seconds after failure, depending on where failure falls relative to a probe. The next section derives those bounds. A single "15-second detection" label would conceal probe duration and phase.

@fig sd_tr_health | Active probes and real request failures feed an eligibility decision. Orange marks removal after the stated failure threshold, rather than after one arbitrary error.

The probe should test the contract needed for routing without becoming an expensive workload itself. If every instance deeply probes a shared database, a database slowdown can remove the entire fleet. A cheap readiness check may report whether local request handling and required dependency access permit useful service, while deeper diagnostics remain outside routing.

A passive policy must classify errors. A permission denial for one viewer is not evidence that the endpoint is unavailable. A connection failure may warrant removal, but its scope can be local to one router or network path. [Envoy's health-checking documentation](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/health_checking) distinguishes active checking from observations of real request failures.

:::story Picture this
A restaurant host checks whether a table is ready before seating guests. Seeing the dining room's front door open is not enough; the table may still need clearing. A guest reporting the wrong meal also does not prove the table is unusable. The host needs evidence about the specific decision, whether another party can be seated there now.
:::

## 19. Failure thresholds and detection time

An endpoint fails immediately after a successful probe. The router will keep choosing it until enough later failures establish removal. A **failure threshold** trades faster removal against reacting to transient probe failures.

Under Heron's fixed schedule, let I be the 5-second interval, k the 3 failed probes required and P the 1-second timeout. If the failure occurs just before a probe begins, failed probes start near times 0, 5 and 10, with removal at time 11. If it occurs just after the previous successful probe, the next starts near time 5, followed by 10 and 15, with removal at time 16.

$$
T_{\mathrm{detect}}\in[(k-1)I+P,\ kI+P].
$$

Read this as the failed-probe span plus probe duration, with up to one extra interval before the first failed probe begins. It assumes fixed start times, probes that time out after P and no additional state-propagation delay. Fast explicit connection failures or a scheduler that waits after each completed probe change the calculation.

@fig sd_tr_detection | Illustrative worst-phase probe starts at 5, 10 and 15 seconds; the final timeout ends at 16. Orange marks the eligibility change.

**Hysteresis** uses different evidence for removing and restoring an endpoint to reduce repeated flipping. A recovering server may need several successful probes and slow start before a full share returns. Simply alternating between healthy and unhealthy on every response can churn routes and repeatedly warm or abandon pools.

The threshold must connect to the user deadline. Heron's 250-millisecond request deadline is much shorter than its failure detection interval. During that interval, affected requests need bounded failure or a safe retry; the active checker cannot rescue every individual request in time. Route-level recovery and request-level timeout handling therefore serve different clocks.

:::note The probe clock is a model input
Probe interval may mean start-to-start timing or a wait after completion. The bounds here use start-to-start timing and a full timeout on each failed probe. Check a product's scheduling semantics before importing the numbers into a production promise.
:::

## 20. Liveness, readiness and draining

Heron restarts an application because its database query timed out. The replacement then encounters the same shared database failure. Repeated restarts add cold-start work without repairing the dependency.

**Liveness** asks whether the process can make progress or should restart. **Readiness** asks whether it should receive new traffic now. A server may be alive but temporarily unready during warmup or draining. A failed shared dependency can prevent useful work without making a process restart the right response.

In Heron's illustrative 20-second slow-start ramp, the endpoint reaches a quarter of final weight after 5 seconds. That assignment schedule begins only after readiness accepts the service contract. A socket that starts listening at process launch is not evidence that the application has loaded its configuration, opened required pools or completed a necessary recovery step.

@fig sd_tr_readiness | Lifecycle states separate process survival from route eligibility. Orange marks ready-to-draining, which removes new assignment while existing work finishes.

For shutdown, the endpoint first stops claiming readiness. Routers observe the change through their membership and health mechanisms. The process then waits for in-flight requests or instructs persistent clients to reconnect before its final deadline. A server that exits before route removal propagates creates a period where routers repeatedly select a dead endpoint.

Draining must bound resource lifetime. A stalled upload or permanently idle socket cannot prevent shutdown forever. Once the grace period expires, terminate remaining work under the documented retry and resume contracts. Writes still need a durable identity because a response lost during drain may follow a committed effect.

The deeper lesson is that health is not one Boolean with one universal consequence. Restarting, selecting, accepting new work and retaining old work are different actions. Each should use evidence tied to its own failure cost. An application can continue running to expose diagnostics while being excluded from new traffic.

:::warn Watch out
Do not restart every instance because one shared dependency is slow. A restart can discard warm state and amplify demand. Separate liveness from readiness and coordinate draining with routing propagation.
:::

## 21. Failover and survivor capacity

One of Heron's five application servers fails at peak. Removing it from the route distributes the same 1,000 requests per second over four survivors. That successful routing change is useful only if those survivors can do the work.

**Failover** directs work to surviving resources after a failure. At the illustrative 300-per-second per-server limit, normal capacity is $5\times300=1500$. One loss leaves $4\times300=1200$, a margin of $1200-1000=200$ per second. Equal assignment then gives $1000/4=250$ per survivor, below its 300 limit. Read margin as surviving capacity minus offered demand under the same workload assumptions.

@fig sd_tr_capacity | Illustrative application capacity under zero, one and two endpoint losses. Orange marks the two-loss case, whose 900-per-second capacity cannot serve the 1,000-per-second peak.

Two losses leave $3\times300=900$ requests per second of capacity. Equal routing demands $1000/3=333.333333$ per survivor after rounding. No balancing algorithm closes that gap. Admission must reduce offered work, optional features may be shed within their product contract, or additional capacity must become available.

A failed request may also have reached the old application before removal. For a read, a bounded retry can be safe if freshness and deadline permit it. For a score update, a timeout leaves the commit outcome uncertain. Retry with the same operation identity and let the state owner resolve it; routing to another healthy application must not create a second score change.

The balancer itself needs redundancy too. Two proxies behind one failed network path still share a failure domain. State used for transport affinity and public-address reachability must have a recovery design appropriate to the implementation. The complete trace measures traffic and authority separately so failover cannot be mistaken for transaction recovery.

:::interview Interview lens
**"What happens when a backend fails at peak?"** I remove it from eligibility, bound requests still targeting it and check the remaining workload against survivor capacity. Heron's four survivors can serve the stated peak, while three cannot. I retry uncertain writes only with stable identity and the original deadline because rerouting does not prove the first attempt failed.
:::

:::key In one breath
Health checks supply evidence about a named service ability, with active and passive observations covering different gaps. Probe phase, threshold and duration determine detection time. Liveness, readiness and draining support different lifecycle actions. Failover restores useful service only when survivors have capacity and uncertain effects have a recovery contract.
:::

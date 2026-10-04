@part V | Timeouts, circuit breakers, bulkheads | We prevent a failed dependency from consuming every resource in its callers. A bounded wait and a bounded amount of waiting solve different problems. We will trace deadlines, open a breaker, recover through probes, and isolate resource pools. | where:5

## 17. Timeouts and end-to-end deadlines
A viewer's request has an illustrative total budget of 500 milliseconds. Heron reserves 40 for network transit and 60 for assembling and returning the reply, leaving 400 for application work. After 120 has been spent, a new downstream call has only 280 useful milliseconds.

A **timeout** bounds a particular wait. A **deadline** bounds the completion time of the whole operation. Pool acquisition, connection setup, and response reading can each have timeouts, but those waits still sit inside the same outer deadline.

@fig sd_reliability_deadline | Illustrative serial budget. A downstream request inherits the remaining time rather than restarting the clock.

Propagate a remaining duration or a carefully interpreted deadline across each boundary. Check it again when a queued request begins execution. A request that already expired should not start expensive optional work. Picking values requires latency measurements and false-timeout analysis, rather than copying an arbitrary timer from another service.

:::story Picture this
A train connection leaves at a fixed time. Each taxi driver cannot give you a fresh travel allowance after picking you up. The useful budget is the time still left before the same train departure.
:::
## 18. A timeout does not roll back an effect
The application abandons a database wait, but the database continues executing. It may commit just after the timeout. The caller has stopped observing; that is not the same as the callee undoing work.

Propagate cancellation where supported, release caller resources, and record an uncertain outcome where necessary. Cancellation can itself race with completion. For a write, recover through the original command identity and authoritative state. For a read, a later attempt can be simpler, but it still consumes capacity and may see a newer version.

@fig sd_reliability_timeoutcommit | An uncertain-outcome trace. A timeout stops waiting; it does not prove rollback.

The cost of this design is retained outcome evidence and a recovery API or idempotency contract. If a downstream service lacks such a contract, the upstream cannot invent certainty. It must expose uncertainty or reconcile before issuing another effect. That limitation belongs in the interview answer and in the user-facing status.

:::warn Watch out
A socket closing, a canceled task, and a rolled-back transaction are different events. Treating them as equivalent is a common source of duplicate writes and misleading failure reports.
:::
## 19. Circuit breaker states and recovery probes
A recommendations dependency repeatedly times out. Even bounded waits occupy slots for calls that are unlikely to help. A **circuit breaker** stops selected calls temporarily after evidence of failure. Its purpose is to protect resources and permit recovery, not to establish that the peer is certainly dead.

In the closed state, calls flow and the breaker collects outcomes. When its configured failure rule triggers, the open state rejects or uses a permitted fallback without calling the peer. After a cooldown, the half-open state admits a small controlled probe set. Successful probes can close it; renewed failure reopens it.

@fig sd_reliability_breaker | Breaker states. Failure thresholds and probe capacity are explicit policy choices.

@fig sd_reliability_probes | Recovery states. A working probe does not establish full recovered capacity.

For a concrete illustrative policy, keep the last 20 eligible dependency outcomes and open when at least 10 failed. A completed window with 12 failures has failure fraction 12 divided by 20, or 0.6, so it opens. If that observation occurs at time 5 seconds, a 30-second cooldown permits recovery probes at time 35. The half-open state admits at most 2 probes; other ordinary calls still use the rejected or fallback path.

The state transition matters. Closed state collects the window, open state clears ordinary downstream admission, and half-open reserves the probe slots atomically so a burst of callers cannot all become probes. Under this example both successful probes close the breaker and reset its rolling history; any failed probe reopens it and starts another cooldown. This is a declared teaching policy, not a universal library default. A production rule needs measurements for its window, threshold, and recovery ramp.

@fig sd_reliability_breaker_numeric | Illustrative breaker policy and state times. All counts and times are policy assumptions checked by the chapter ledger.

Failures caused by invalid client requests should not poison a dependency breaker. Nor should a breaker make permission checks optional. Local breakers at different callers may disagree because they see different routes and histories. This is acceptable if their role is local resource protection rather than global leadership.

:::note Breaker limits
A breaker adds state and recovery behavior. A simple concurrency limit with clear deadlines may be sufficient for some dependencies. Add the breaker when failed calls are consuming enough resources that temporarily skipping them changes the outcome.
:::
## 20. Bulkheads and concurrency isolation
A slow clip service occupies every shared application worker. Score reads now fail even though the score database is healthy. A **bulkhead** gives a dependency or workload its own bounded resource allocation so its failure cannot consume everything available to unrelated work.

For an illustrative worker budget of 100 slots, allow at most 20 clip-service calls in flight. If all clip calls stall, 80 slots remain available for other work. Separate connection pools can provide a similar boundary. The exact division must reflect measured costs, priorities, and the behavior under overload.

@fig sd_reliability_bulkhead | Illustrative slots. Isolation preserves capacity only if other shared resources are also bounded.

A shared database, CPU, memory allocator, or logging path can still defeat this partition. Trace all constrained resources, not just thread count. Bulkheads may waste idle reserved capacity, while shared pools use resources more flexibly. A bounded borrowing policy can trade utilization for isolation, but it needs an explicit failure test.

:::interview Interview lens
**"How are a timeout, breaker, and bulkhead different?"** A timeout bounds a wait, a breaker temporarily suppresses calls based on failure evidence, and a bulkhead limits how many resources one workload can consume. They solve related but different problems. Their policies must fit the same deadline, fallback, and capacity contract.
:::
:::key In one breath
Timeouts bound individual waits, while the deadline belongs to the complete operation. Stopping a wait does not establish whether a write committed. A breaker suppresses likely useless calls and reopens through controlled probes. A bulkhead preserves resources for other work when one workload stalls.
:::

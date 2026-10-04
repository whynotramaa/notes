@part VI | Leaky bucket | We make output smoother instead of merely deciding whether arrivals fit a saved allowance. Waiting can absorb a burst, but it also consumes resources and user time. We will separate policing from shaping, calculate drain time, bound a queue, and compare all five algorithms. | where:6

## 21. Leaky-bucket shaping
A downstream media service wants evenly paced jobs even when uploads arrive in a burst. A **leaky bucket** models work leaving at a controlled rate. In a queue-based shaping construction, arrivals join a bounded queue and the scheduler releases them at that rate.

A **shaper** delays work to change its departure timing. A **policer** admits or rejects work against a rule without promising queued departure. Both names sometimes appear beside leaky-bucket descriptions, so state whether your design really retains waiting requests or merely checks a virtual schedule.

@fig sd_rate_limiting_shape | Queue-based shaping. A rejected arrival never enters the queue; a retained one consumes waiting resources.

At Heron's illustrative rate of 100 requests per 60 seconds, draining a queue of 100 with no new arrivals takes 60 seconds in the continuous-rate model. That delay would be unacceptable for a 500-millisecond interactive score request. The same algorithm can be useful for background work with a different deadline contract.

:::story Picture this
A gate lets a line of people through at a steady pace. The line can absorb arrivals, but it needs space and people must be willing to wait. A gate that turns people away is applying a different policy from a gate that keeps them queued.
:::
## 22. Queue state and waiting time
The shaping queue contains 20 equal-cost jobs ahead of a new request. At a modeled release rate of 100 divided by 60 jobs per second, waiting for those jobs to leave takes 20 divided by that rate, or 12 seconds. This is the queue delay before the new job's own processing.

$$W_{\text{queue}}=q/r.$$
Read this as the deterministic modeled waiting time equals queued cost $q$ ahead of the request divided by release rate $r$. Unequal jobs use queued cost in consistent units rather than raw job count. Worker execution and scheduling overhead can add further delay.

@fig sd_rate_limiting_leaktrace | Continuous-rate queue model. Discrete releases and execution time change exact completion timing.

If the expected departure is later than the request deadline, reject before retaining it. Otherwise a shaper can become a warehouse of expired work. Cancellation must remove or mark queued work without accidentally refunding another request or double releasing the same item.

:::warn Watch out
A smoothing queue cannot promise quick responses just because arrivals are within a long-term rate. The waiting-time budget may reject a burst that the token bucket would admit immediately.
:::
## 23. Virtual schedules and bounded debt
Instead of a physical queue, a limiter can keep a virtual next-available time. An arrival reserves a slice of future rate, then receives a delay or rejection according to the policy. This can implement a leaky-bucket-like meter without storing every waiting payload.

An illustrative debt of 30 cost units at a refill or service rate of 100 divided by 60 corresponds to 18 seconds of future service. If the maximum permitted delay is shorter, reject that reservation. The service must decide who actually schedules the deferred effect; merely returning a delay does not ensure the client follows it.

@fig sd_rate_limiting_virtual | Virtual accounting exercise. It does not retain a payload or promise client compliance.

Distributed scheduler ownership is a separate problem. Two workers that interpret the same reserved time can execute a job twice unless queue or command identity controls execution. Rate accounting must not be mistaken for an exactly-once effect guarantee.

:::note The term covers variants
Textbooks and libraries use leaky bucket for several related meters and shapers. Describe state, transition, admitted bound, and waiting behavior. Those properties are more precise than the name alone.
:::
## 24. Comparing the five choices
Heron's exact user rule favors the sliding log if its recent-history cost fits the workload. A burst-capable public read policy can favor a token bucket. A background dispatch path can favor a bounded shaper. Fixed windows and sliding counters are inexpensive when their boundary or approximation semantics are acceptable.

| Property | Fixed window | Sliding log | Sliding counter | Token bucket | Leaky shaping |
|---|---|---|---|---|---|
| Stored history | bucket count | recent events | recent buckets | balance and time | queue or virtual time |
| Moving-window exactness | no | yes, with atomic rule | approximation | different contract | different contract |
| Burst behavior | boundary burst | interval bound | estimate-dependent | saved allowance | delayed output |
| Main cost | low state | per-event state | approximation error | clock and atomic debit | waiting and scheduling |
| Rejection basis | bucket full | recent log full | estimated count | insufficient tokens | queue or delay bound |

@fig sd_rate_limiting_compare | Policy comparison. These are mechanisms rather than benchmark rankings.

Do not choose by memorized slogans such as token buckets are always best. State which behavior the consumer needs and which failure it must tolerate. The next part examines the shared atomic state on which every distributed implementation depends.

:::interview Interview lens
**"When would you choose leaky bucket over token bucket?"** I would choose shaping when the downstream needs paced departures and the workload can tolerate bounded waiting. A token bucket admits saved bursts immediately. For an interactive API I would usually reject rather than queue beyond the response deadline.
:::
:::key In one breath
Leaky-bucket shaping paces departures and therefore needs bounded waiting or virtual scheduling state. Queue delay follows queued cost divided by release rate under the stated model. Policing and shaping have different user outcomes. Compare exactness, burst allowance, state cost, and waiting behavior across all five algorithms rather than treating their names as interchangeable.
:::

@part VII | SLIs, SLOs, SLAs, error budgets | We turn a vague reliability goal into a test. Percentages mean little without a population and a window. We will define indicators, objectives, agreements, and error budgets. | where:7

## 25. Service-level indicators

A team promises fast playback but measures API availability. The API can succeed while the first video segment never arrives. A **service-level indicator**, or SLI, is a measurement of the outcome the service promises.

For a score read, define eligibility, the freshness rule, and the allowed response delay. A good-event SLI is good eligible events divided by all eligible events over a stated window. A valid user rejection may be excluded if the contract says so; a dependency failure cannot be excluded merely because the API did not cause it. Place the measurement near the user boundary when possible and compare server-side and client-side views. Missing client data needs an explicit treatment because failed users may be least able to send telemetry.

Start the measurement where an eligible user can actually encounter failure. If the API records only requests that reach its handler, a broken edge route can disappear from its denominator entirely. Compare external probes or client evidence with handler observations and make that blind spot explicit. For freshness, decide how a required version is established and what happens when its authority cannot be read. Unknown evidence should not silently pass the good-event test. Review eligibility and outcome changes together because removing a failure class from measurement changes the promise being assessed, even when the resulting dashboard percentage improves.

@fig sd_observability_25 | Illustrative service-level indicators. The indicator classifies eligible requests against the promised user outcome. Orange marks the window ratio after each eligible request has been classified.

Changing eligibility to remove failures makes the target easier without making the service better. Review denominator changes as contract changes.

:::story Picture this
A train timetable promises that a train arrives before a stated time for a stated share of trips. The operator counts late journeys, total journeys, and trips for which the clock failed. A good promise names the journey and the measurement rule, not merely that the railway is running.
:::

## 26. Objectives and the error budget

Heron sets an illustrative objective that 99.9 percent of eligible reads are good during a 30-day window. A **service-level objective**, or SLO, is a target for an SLI. Its **error budget** is the permitted bad share of the eligible workload.

At an assumed steady 1,000 eligible requests per second, 30 days contain 2,592,000,000 requests. The permitted fraction is one minus 0.999, or 0.001; multiplying gives 2,592,000 allowed bad requests. Read the formula aloud: eligible requests in the window times the permitted bad fraction. This request budget is not the same as allowed outage seconds unless traffic is constant and every outage request is bad. A rolling window also changes which past errors remain in the budget.

The illustrated budget assumes eligible traffic remains at the stated rate throughout the window. In operation, compute the eligible total from actual observations before applying the permitted fraction. An outage during a busy match then spends more request budget than the same elapsed outage during quiet hours. Keep duration-based availability as a separate indicator if the team also promises time availability. For a rolling window, an old incident leaving the window can replenish the available budget without any current improvement. Display the window definition beside remaining budget so that movement cannot be mistaken for a successful repair.

@fig sd_observability_26 | Illustrative objectives and the error budget. The permitted bad fraction converts the window population into an error budget. Orange marks the allowed bad-event count under the stated population and window.

Budget forecasts need the future traffic pattern. A peak outage can spend more request budget than a longer quiet-period outage.

:::note Budget consumption and action
State the SLO window and use the same eligible population as the indicator. Compute budget as total eligible events times one minus the objective. Explain any conversion to downtime as a separate assumption.
:::

## 27. Agreements and multiple objectives

A customer contract promises a credit when availability misses a threshold, while the operations team uses a tighter internal target. A **service-level agreement**, or SLA, is an agreement that describes commitments and consequences. It is not simply another name for an SLO.

Keep the contractual measurement definition, exclusions, reporting window, and remedy separate from the engineering target. A service can need availability, latency, freshness, and durability objectives because success on one does not imply success on another. A score reader might get a quick but old answer; an uploader might receive acceptance before the object is recoverably stored. Write a separate good-event rule for each promise, then identify which user flow satisfies all the required rules.

Trace the distinct failures in the matrix. A cache can return promptly while holding an old score, which meets a speed condition but fails the required version. An upload endpoint can reply promptly before bytes reach the promised storage boundary, which leaves recoverability unproved. Conversely, a durable score commit can meet its survival condition while downstream delivery remains slow. Define the good-event rule for each property before combining them into a user-flow view. Keep the separate indicators visible when the combined result fails, because the repair for late delivery differs from the repair for lost acknowledged data.

@fig sd_observability_27 | Illustrative agreements and multiple objectives. A quick response does not establish freshness or a recoverable accepted write. Orange fills the cells that satisfy each separate outcome, rather than treating speed as proof of every promise.

Do not invent contractual exclusions in an engineering dashboard. Use the actual agreement for reporting and keep the internal objective explicitly separate.

:::warn Watch out
An SLA describes an agreement and consequences; an SLO guides engineering. Define several indicators when the user’s task depends on several independent properties.
:::

## 28. Low traffic, windows, and missing data

A quiet route handles one request and it fails. Its measured error fraction is complete, but treating it like a heavily used route can create noisy pages. **Measurement uncertainty** concerns what sparse or missing evidence lets us infer about the service.

Use the exact observed ratio, and also show the event count and window. Longer windows can accumulate enough evidence for a stable view, while external probes check routes that have too little traffic. A rate expression with no denominator needs a documented no-traffic result rather than silently declaring perfection. Missing telemetry is another state again. For latency, a percentile from a tiny sample describes that sample; it does not justify confidence about the unseen workload.

Suppose the route receives no eligible requests while scrape health remains current. Its ratio has no denominator, but the collector can still demonstrate that it is functioning. Now disconnect the collector while requests continue; the same empty chart represents missing evidence, not absence of demand. Show the last valid sample time and a synthetic-route observation beside the sparse workload count. Extending the window can improve the amount of observed evidence without proving what happened during a collection gap. A traffic gate on a ratio alert should leave an independent route for detecting that gap or an unavailable quiet service.

@fig sd_observability_28 | Illustrative low traffic, windows, and missing data. No traffic and missing evidence require separate dashboard states. Orange marks missing evidence as uncertainty that needs a freshness warning.

A quiet-route burn alert can oscillate with individual failures. Minimum traffic gates reduce noise but must not suppress an external availability check.

:::interview Interview lens
**"How should an alert treat low traffic and missing data?"** Pair ratios with counts and freshness. Use windows and probes appropriate to the route, and keep unknown data distinct from no traffic or observed success.
:::

:::key In one breath
An SLI measures a specified eligible population. An SLO is its target over a window. An SLA is an agreement, and an error budget is the permitted bad fraction rather than a promise of perfect service.
:::

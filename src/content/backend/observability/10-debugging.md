@part X | Production debugging | We practise finding the cause of a production problem from the telemetry the earlier parts built. Debugging under pressure goes well when it follows a method and badly when it follows hunches. We will cover a rising p99, a CPU stuck at 100%, memory that keeps growing, and errors after a deploy, ending with one evening's incident from alert to fix. | where:10

## 34. Latency increased

The alert says the latency burn rate on the order journey is above 14.4. The p99 of `POST /orders` has gone from 250 ms to 900 ms in ten minutes. The first job is to narrow the problem before forming any theory, and the order of questions is always the same.

**Scope.** Is it every endpoint or one, every instance or one, every region or one, every customer or a tenant? Wren's RED dashboard, broken down by route and instance, answers in a minute. Here only `POST /orders` is slow, on all four instances. That rules out one bad node and a network problem in one zone, and points at something this endpoint does. **Timing.** When exactly did it start, and what changed then? The deploy markers on the chart show nothing in the last hour, but the dependency panel shows the payments service's p99 rising at the same minute.

**Trace.** Wren opens exemplar traces from the slow histogram buckets, Part IV. They all look alike. The order service's own spans are normal, the database spans are normal, and the call to payments takes 700 ms, of which 680 ms is payments' call to the card provider. **Dependency.** The payments service's client-side metrics for the provider show p99 at 650 ms against a normal 180 ms, and the provider's status page reports degraded performance in one region.

@fig be_obs_debug_latency | p99, then the endpoint, then a trace, then the slow span, then that dependency's own metrics.

The path generalises to a sequence Wren's runbook writes out: p99 by endpoint, then a trace from the slow bucket, then the slowest span, then whichever of the service's own code, its database queries, its cache, its dependencies, or resource saturation that span points to. Each step uses the cheapest signal that narrows the search. Starting from logs, or from a hunch about the database, wastes the first twenty minutes.

Finding the cause is not the same as fixing the symptom. The provider is outside Wren's control, so mitigation comes first. The payments service's timeout for the provider is lowered from 2 s to 800 ms so slow calls fail over to the secondary provider sooner, and the circuit breaker, Unit X, starts routing to it. p99 falls back to 300 ms within minutes. The root cause belongs to the provider, and Wren's follow-up is about Wren, such as whether the failover should have triggered automatically on latency rather than only on errors.

## 35. CPU at 100% and memory that keeps growing

**CPU at 100%.** One instance's CPU is pinned and its latency is high. The first question is whether more work arrived or the same work got more expensive. Compare request rate with CPU per request. If traffic doubled, it is a capacity problem and scaling out is the fix. If traffic is flat and CPU per request rose, something in the code path became expensive. The usual suspects are a known list: an infinite or very long loop, serialisation of an unexpectedly large response, compression of large bodies, garbage collection under memory pressure, a regular expression with catastrophic backtracking, Unit IV, password hashing or encryption on a hot path, and one hot endpoint or hot key doing much more work than the rest.

A CPU profile from that instance, section 27, ends the guessing. Wren's continuous profiler shows the flame graph for the minute CPU went to 100%, and 70% of samples sit in a regular expression validating a delivery address. A customer pasted a 4,000-character address with a pattern of repeated spaces that makes that regex backtrack exponentially. The fix is a linear-time regex engine, such as RE2, or a length limit before matching. When GC is the answer instead, the GC metrics show it directly, with GC CPU share above 30% and heap near its limit, which points the investigation at memory.

@fig be_obs_memory | A leak grows across restarts in a sawtooth. Normal use rises and plateaus after GC.

**Memory keeps growing.** Each instance's memory climbs steadily for days and drops only when a pod is restarted, often by the out-of-memory killer, which Kubernetes reports as `OOMKilled`, Unit XV. Not every rise is a leak. A heap that grows after startup and then plateaus is a cache warming. A leak keeps growing with traffic and never levels off.

The tool is a **heap dump** or heap profile, taken twice, an hour apart, and compared. The objects whose count grew are the leak. In garbage-collected languages, leaks are references kept by mistake, and the usual places are an in-process cache with no size limit or expiry, a map keyed by request or user id that is never cleaned, listeners or callbacks registered per request and never removed, unbounded in-memory queues, and closures capturing large objects. Wren's last leak was a per-tenant metrics map that added a label set per tenant per day. Resource leaks behave the same way with other counters, open file descriptors rising toward the limit, connections never returned to the pool, goroutines or threads that block forever. Those counts belong on dashboards precisely because a slow climb is easy to spot weeks before it causes an outage.

## 36. Errors after a deploy

At 20:03, payments v812 rolls out. At 20:05 the error rate on the order journey jumps from 0.05% to 4%. The rule for this case is short. **When errors start right after a change, undo the change first and investigate second**. A rollback to v811 takes three minutes and is almost always safe. Investigating while users fail spends the error budget on curiosity. Wren's deploy system makes rollback one command, and the on-call engineer runs it at 20:07. Errors return to normal by 20:10.

Some changes cannot be rolled back simply, and the investigation must plan for them. A **database migration** that dropped or renamed a column breaks the old version as well as the new one, which is why Wren uses expand-and-contract migrations, Unit VI, where old and new code both work against the schema at every step. A **feature flag** is faster than a rollback, since turning off the new code path takes seconds with no deploy, Unit XV. A **config change** deployed separately from code needs its own history and rollback.

@fig be_obs_deploy_errors | Errors begin at the deploy marker. Roll back first, then use the deploy diff, error logs and traces to find why.

The investigation starts after the rollback, with evidence collected during the bad minutes. The error logs from v812 group into one event, `payment_failed` with `reason=decode_error`, all from the provider client. A trace with that error shows the provider responded normally with 200, and the payments service failed to parse the body. The deploy diff for v812 includes an upgraded HTTP client library. The new version returns response bodies compressed when the provider sends `Content-Encoding: gzip`, where the old one decompressed them automatically. Payments only failed for the 4% of calls routed to the one provider region that compresses responses, which is why tests passed.

## 37. One evening's incident, from alert to review

The evening ends with a review, and Wren's incident document follows a fixed shape that fits on one page, written **blameless**, which means it asks how the system allowed the mistake rather than who made it, since people who fear blame hide the details that prevent the next incident.

The **timeline** comes from telemetry, not memory. 20:03 v812 deployed by the pipeline after passing CI and a 5% canary that ran for ten minutes. 20:05 errors rise to 4%. 20:06 the burn-rate alert pages, its one-hour burn rate above 14.4. 20:07 the on-call engineer sees the deploy marker on the error chart and rolls back. 20:10 errors are normal. The incident lasted about 5 minutes and failed about 4% of 5 minutes of order requests.

@fig be_obs_incident | Detect, mitigate, diagnose, fix and prevent, with the telemetry used at each step.

The **impact** in error-budget terms makes the cost concrete. Order requests at that hour ran at 300 a second, so 5 minutes is 90,000 requests, and 4% of them is 3,600 failed requests, about 0.28% of the month's 1,296,000-request budget. The **root cause** and **contributing factors** come next: the library change, tests that did not cover compressed provider responses, and a canary whose error threshold was set on total errors rather than on errors for each dependency, so 4% of calls to one provider region moved the canary's overall rate too little to stop it.

The **action items** each have an owner and a date, and they target detection and blast radius as much as the bug. Add a contract test with a compressed provider response. Make the canary compare per-dependency error rates against the baseline. Pin and review HTTP client upgrades separately from feature changes. Add the decode error as its own metric so it is visible without logs.

Taken together, this unit's tools carried the incident. The SLO's burn-rate alert detected it within a minute of the errors. The deploy marker and RED dashboard pointed to the change. Rollback contained it. Logs grouped by event name, a trace with its error span, and the deploy diff found the cause. The review turned it into changes that make the next one smaller. Unit XV covers the deployment machinery underneath, canaries, rollbacks and feature flags, and follows a request through the complete system.

:::story Picture this
A doctor in an emergency department. The first job is to stabilise the patient, stop the bleeding, before anyone asks how the accident happened. Diagnosis follows a routine, vital signs, then the obvious injury, then tests that narrow the cause. The case review afterwards asks what in the system let the problem happen and get worse, not which nurse was on duty.
:::

:::note Write down what you tried
During an incident, Wren keeps a running log in the incident channel, each check and its result with a timestamp. It prevents two people trying the same thing, lets someone joining late catch up in a minute, and becomes the timeline for the review.
:::

:::warn Watch out
Debugging a bad deploy while it keeps failing users is the most common way to turn a five-minute incident into an hour-long one. If the problem started with a change, roll it back or turn off its flag first, and investigate with the evidence collected during the bad minutes.
:::

:::interview Interview lens
**"Error rate jumped after a deploy. What do you do?"** Confirm the timing against the deploy marker, then mitigate first, roll back or turn off the feature flag, unless a migration makes rollback unsafe, in which case the expand-and-contract design should have made it safe. Then investigate with the error logs grouped by event, traces of failed requests, and the deploy diff, including dependency upgrades and config. Write a blameless review with a telemetry timeline, error-budget impact, root cause, contributing factors and action items that improve detection and canaries as well as fixing the bug.
:::

:::key In one breath
A latency rise is narrowed by scope and timing, then an exemplar trace, then the slow span, then that dependency's metrics, and mitigated before the root cause is fixed. CPU at 100% is either more work or costlier work, and a CPU profile names the function, such as a backtracking regex. Memory that grows without plateau is a leak, found by comparing heap dumps an hour apart. Errors after a deploy mean roll back first, investigate second. Here 4% of 90,000 requests failed in 5 minutes, 3,600 requests or about 0.28% of the month's budget, and a blameless review turned the cause into tests, better canaries and new metrics.
:::

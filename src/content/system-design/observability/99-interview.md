@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How would you explain a healthy process and an unhappy viewer in a production design?**

Begin with the promise to the viewer. Measure response correctness and delay at the boundary where that promise is experienced; use process health to help explain a failed promise. A cached old value can survive while the database and API are healthy. Compare the returned version with the contract, rather than treating an HTTP success as proof of correct data.

**Q2. How would you explain black-box and white-box evidence in a production design?**

An external probe measures the visible result; internal telemetry narrows the explanation. Keep a controlled test record, protect the probe credentials, and avoid replacing ordinary traffic with a privileged shortcut. A probe from one region can miss another region. Group its results by test location and operation without putting its unique request ID into a metric label.

**Q3. How would you explain symptoms, causes, and hypotheses in a production design?**

Separate what users experienced from what you think caused it. State a prediction, inspect evidence across boundaries, and make one interpretable change when the situation permits. Charts that rise together establish correlation. Missing telemetry, clock skew, and changes to measurement definitions can produce the same picture without the proposed failure.

**Q4. How would you explain the telemetry contract in a production design?**

Define the event, unit, population, and outcome of every measurement. Keep attempts, logical commands, and side effects separate so a retry cannot look like extra successful business work. Instrumentation before completion misses late failures. Instrumentation in a finally block still needs the actual outcome, because completion of the handler does not imply success of the operation.

**Q5. How would you explain structured logging in a production design?**

Use stable event names and separately typed fields. Log the transition needed for diagnosis, rather than every instruction. Count bytes and retention because a small record multiplied by traffic becomes a storage workload. Free text can remain useful for a message, but depending on its exact wording for alerts makes editorial changes operational changes. Avoid logging full response bodies when a version and outcome answer the question.

**Q6. How would you explain request ids and correlation in a production design?**

Carry a validated correlation ID across synchronous calls and log an attempt ID for retries. Keep it separate from an idempotency key and from the authorization decision. An untrusted caller can forge a correlation ID. Restrict length and characters, never let it inject log syntax, and do not grant access based on it.

**Q7. How would you explain logging asynchronous work in a production design?**

Put correlation and causation into the durable envelope, then create fresh processing spans and attempt records at the worker. A queued message can outlive the request that created it. A log line saying sent is ambiguous unless it names the boundary crossed. Stored locally, accepted by the broker, and applied by a receiver are different states.

**Q8. How would you explain redaction, access, and retention in a production design?**

Keep secrets out of telemetry at the source, restrict access, and choose retention per purpose. Sampling is a cost policy, not a privacy policy; a sampled secret is still a secret. Redaction after export leaves the raw copy in collectors and buffers. Debug logging must use the same field rules as normal logging.

**Q9. How would you explain counters and rates in a production design?**

A counter measures accumulated events. Convert its change to a rate using elapsed time and explicit reset handling, then aggregate compatible instances. Divide failures by attempts from the same eligible population. A missing scrape is not a zero counter. Query behavior must distinguish gaps, resets, and genuinely no traffic.

**Q10. How would you explain gauges and state in a production design?**

Use a gauge for current occupancy, queue length, or memory. Pair it with rates and wait durations, and update it through every exit path. The meaning of a high value depends on what resource it describes. Summing memory gauges across machines measures total allocation, while averaging them measures a different quantity. Specify the question before choosing the aggregation.

**Q11. How would you explain histograms and latency in a production design?**

Use distributions for latency, and choose bucket boundaries near the user promise. Merge compatible bucket counts across instances before deriving a fleet percentile. Never average instance percentiles to obtain a fleet percentile. Averages and percentile summaries generally cannot reconstruct the original distribution. Prometheus explains histogram and summary aggregation in its [histogram guidance](https://prometheus.io/docs/practices/histograms/).

**Q12. How would you explain cardinality and label budgets in a production design?**

Metric labels create series, not merely annotations. Multiply their possible values and include histogram expansion before approving a label. Keep individual identities in record-oriented evidence. A label that currently has few values can grow without bound if its source is free text, URLs with identifiers, or exception messages. Normalize routes and outcomes.

**Q13. How would you explain spans and the trace tree in a production design?**

A span measures an operation, and the trace records relationships among operations. Parent duration includes child waiting. Inspect gaps and concurrency before assigning the residual duration to application work. Instrumentation that closes the server span before a streaming response finishes measures handler setup rather than full delivery. State which boundary the span represents.

**Q14. How would you explain context propagation in a production design?**

Extract, attach, and inject context at transport boundaries. Preserve it across task switches and record broken propagation explicitly. A valid trace header is evidence metadata, not an authorization credential. Blindly reflecting untrusted context can cause misleading associations or excessive baggage. Bound values and respect the instrumented library’s context rules.

**Q15. How would you explain parallel work and the critical path in a production design?**

Identify dependencies and overlapping intervals. Improve the longest dependent path, because making an already faster parallel child faster may not reduce the response time at all. Clock skew between machines can create impossible-looking relationships. Use local span durations and propagation relationships carefully; do not infer exact cross-host ordering from wall clocks alone.

**Q16. How would you explain async links, retries, and span status in a production design?**

Use links when work has several causes or outlives its caller. Keep delivery attempt, client observation, and durable effect separate; span status should follow the contract of the operation it measures. An unrecorded retry hides amplification and can make one request look like one dependency call. Trace attempts while retaining their logical relation.

**Q17. How would you explain head sampling in a production design?**

Head sampling makes a decision before the outcome. It bounds retained trace volume cheaply, but rare errors can disappear. Keep complete aggregate outcome counts and label the trace selection policy. Sampling independently at every service fragments traces. Use a coordinated parent decision or a documented strategy that preserves relationships.

**Q18. How would you explain tail sampling in a production design?**

Tail sampling buys outcome-aware retention with buffering and routing work. Bound memory, document the wait window, and measure incomplete or late traces. Keep aggregate metrics independent of this biased selection. Tail sampling cannot recover spans discarded at the source. The [OpenTelemetry sampling guide](https://opentelemetry.io/docs/concepts/sampling/) describes the head and tail distinction.

**Q19. How would you explain collector queues and exporter failure in a production design?**

Decouple telemetry transport with bounded queues, batching, and backoff. Expose export failures and drops through a path that does not depend only on the failed exporter. Prefer losing optional diagnostics to blocking all user requests. Audit requirements can need durable acknowledgement and a different failure policy. Do not silently apply an optional-debug loss policy to required security records.

**Q20. How would you explain measuring the observers in a production design?**

Track whether evidence is complete and current, not only what values it reports. Test ingest-to-query visibility and provide an independent route for a monitoring-stack failure. A backend can acknowledge ingestion while indexing is delayed. Query freshness and ingestion success answer different questions.

**Q21. How would you explain traffic and useful completion in a production design?**

Measure arrival, admission, and useful completion separately. Group by operation and bounded outcome so a healthy high-volume read route cannot hide broken writes. A service that sheds work can keep latency low for admitted requests while rejecting most users. Put admission loss beside latency.

**Q22. How would you explain error rates and weighted aggregation in a production design?**

Aggregate numerator and denominator before dividing. Retain bounded regional and operation views to detect concentrated failures, and use the same eligibility definition everywhere. A fleet target can pass while one tenant’s entire workload fails. Choose whether the promise concerns requests, users, regions, or another population.

**Q23. How would you explain cpu, memory, and saturation in a production design?**

Use resource measurements to explain a symptom. For CPU inspect runnable work and throttling; for memory inspect growth and pauses; for pools inspect acquisition waits. A high percentage is not an incident by itself. Increasing a connection pool can move waiting into the database and make it slower. Size the dependency’s sustainable concurrency rather than treating every queue as a reason to add callers.

**Q24. How would you explain queue age, depth, connections, and cache hits in a production design?**

Combine queue depth with age and completion rates, pools with acquisition waits, and hit ratio with dependency load and freshness. Each pairing connects an internal quantity to the effect it can explain. A retry queue can look busy while useful progress is zero. Count successful effects separately from processing attempts.

**Q25. How would you explain service-level indicators in a production design?**

An SLI needs a population, a good-event definition, a measurement boundary, and a window. Align it with the user’s task and name missing-data behavior. Changing eligibility to remove failures makes the target easier without making the service better. Review denominator changes as contract changes.

**Q26. How would you explain objectives and the error budget in a production design?**

State the SLO window and use the same eligible population as the indicator. Compute budget as total eligible events times one minus the objective. Explain any conversion to downtime as a separate assumption. Budget forecasts need the future traffic pattern. A peak outage can spend more request budget than a longer quiet-period outage.

**Q27. How would you explain agreements and multiple objectives in a production design?**

An SLA describes an agreement and consequences; an SLO guides engineering. Define several indicators when the user’s task depends on several independent properties. Do not invent contractual exclusions in an engineering dashboard. Use the actual agreement for reporting and keep the internal objective explicitly separate.

**Q28. How would you explain low traffic, windows, and missing data in a production design?**

Pair ratios with counts and freshness. Use windows and probes appropriate to the route, and keep unknown data distinct from no traffic or observed success. A quiet-route burn alert can oscillate with individual failures. Minimum traffic gates reduce noise but must not suppress an external availability check.

**Q29. How would you explain burn rate arithmetic in a production design?**

Burn measures the rate of budget spending relative to the allowance. Report its time window and traffic assumptions. Use it to choose urgency, while measuring actual bad events for the budget history. A burn forecast becomes wrong when traffic changes. Recompute from the current eligible population rather than treating the forecast as an observed outage duration.

**Q30. How would you explain multiwindow alerts in a production design?**

Combine a sustained-impact window with a recent-activity window. Pick page and ticket policies according to intervention time, and test recovery and no-data behavior. Using the same long window for both checks can leave a resolved incident paging. The recovery policy belongs to the alert design too.

**Q31. How would you explain actionable alerts and runbooks in a production design?**

An alert should tell an owner what is harmed, what evidence to inspect, which action may help, and how to verify recovery. Internal thresholds support diagnosis unless they predict a specific actionable failure. Silencing an alert is not repairing the service. Record the reason and duration of suppression, and preserve the user-level check.

**Q32. How would you explain incident hypotheses and timeline in a production design?**

Maintain a timeline of evidence and actions. State what a mitigation should change, then check the user’s outcome and the predicted internal signal. Treat clock-based order as uncertain when clocks differ. Simultaneous mitigations can be necessary during damage, but then causal confidence is lower. Record that limit instead of writing an unsupported definitive cause.

**Q33. How would you explain the complete score-read trace in a production design?**

Connect aggregate outcomes, timed dependencies, and discrete state changes. Each evidence type answers a different question, and stable identity lets the investigation move between them. A server trace cannot prove the viewer received the body. Keep client-side outcome evidence or a public probe for the final delivery boundary.

**Q34. How would you explain the complete ingest-to-query path in a production design?**

Distinguish local acceptance, collector acceptance, durable storage, and query visibility. Bound each queue and observe its age and drops. Test the full path with a known event. If all loss counters use the same broken export route, the outage hides its own evidence. Provide an independent health observation.

**Q35. How would you explain designing the observability failure test in a production design?**

Test telemetry transport failure without allowing unbounded memory or blocked requests. Check drops, recovery, and timestamps, and use separate policies for optional diagnostics and required audit records. A load test that keeps the monitoring backend healthy does not exercise this failure. Include telemetry outages in reliability testing.

**Q36. How would you explain from incident review to a changed mechanism in a production design?**

A review produces testable changes to code, limits, measurements, or procedures. Verify the change against the failure trace and keep uncertainty explicit where evidence was absent. Adding a graph without an owner or diagnostic use can increase noise. Explain which decision the new evidence enables.

**Q37. Why are logs, metrics, and traces complementary?**

Logs preserve discrete event facts, metrics summarize bounded populations, and traces connect timed operations. A metric locates broad harm; a trace follows one execution; logs explain its state decisions. Their usefulness depends on shared definitions and identity, not on sending every field to every system.

**Q38. Can a successful health check prove durability?**

No. The check can prove only the path and result it exercises. A durability claim requires a write acknowledgement tied to recoverable storage and a recovery test that survives the promised failure. A process can answer a health route while writes remain only in memory.

**Q39. Why is a trace duration not CPU time?**

It includes elapsed waiting, network delay, pool acquisition, scheduling, and child work. Use CPU profiling or appropriate resource evidence to attribute computation. A trace shows where an operation waited in its instrumented boundaries, not necessarily why the processor was idle.

**Q40. Should cache misses count as errors?**

A miss is normally a valid cache decision. Count a request as bad only when it violates the user contract, and count dependency failures separately. A miss can explain extra load without being a failed read; a stale cache hit can be a bad result even without an exception.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute daily uncompressed logs at the assumed peak and seven-day retention.

**E2** •• Compute the fleet error fraction for the two illustrative regions and explain the wrong mean.

**E3** •• Compute the critical path for parallel calls and final assembly.

**E4** •• Compute tail-buffer payload and explain the omitted costs.

**E5** •• Compute budget and burn for the stated objective.

**E6** •• Draw the state before and after the failure in Section 1. Name the observation that distinguishes this failure from a healthy but slow operation.

**E7** •• Draw the state before and after the failure in Section 2. Name the observation that distinguishes this failure from a healthy but slow operation.

**E8** •• Draw the state before and after the failure in Section 3. Name the observation that distinguishes this failure from a healthy but slow operation.

**E9** •• Draw the state before and after the failure in Section 4. Name the observation that distinguishes this failure from a healthy but slow operation.

**E10** •• Draw the state before and after the failure in Section 5. Name the observation that distinguishes this failure from a healthy but slow operation.

**E11** •• Draw the state before and after the failure in Section 6. Name the observation that distinguishes this failure from a healthy but slow operation.

**E12** •• Draw the state before and after the failure in Section 7. Name the observation that distinguishes this failure from a healthy but slow operation.

**E13** •• Draw the state before and after the failure in Section 8. Name the observation that distinguishes this failure from a healthy but slow operation.

**E14** •• Draw the state before and after the failure in Section 9. Name the observation that distinguishes this failure from a healthy but slow operation.

**E15** •• Draw the state before and after the failure in Section 10. Name the observation that distinguishes this failure from a healthy but slow operation.

**E16** •• Draw the state before and after the failure in Section 11. Name the observation that distinguishes this failure from a healthy but slow operation.

**E17** •• Draw the state before and after the failure in Section 12. Name the observation that distinguishes this failure from a healthy but slow operation.

**E18** •• Draw the state before and after the failure in Section 13. Name the observation that distinguishes this failure from a healthy but slow operation.

**E19** •• Draw the state before and after the failure in Section 14. Name the observation that distinguishes this failure from a healthy but slow operation.

**E20** •• Draw the state before and after the failure in Section 15. Name the observation that distinguishes this failure from a healthy but slow operation.

**E21** •• Draw the state before and after the failure in Section 16. Name the observation that distinguishes this failure from a healthy but slow operation.

**E22** •• Draw the state before and after the failure in Section 17. Name the observation that distinguishes this failure from a healthy but slow operation.

**E23** •• Draw the state before and after the failure in Section 18. Name the observation that distinguishes this failure from a healthy but slow operation.

**E24** •• Draw the state before and after the failure in Section 19. Name the observation that distinguishes this failure from a healthy but slow operation.

**E25** •• Draw the state before and after the failure in Section 20. Name the observation that distinguishes this failure from a healthy but slow operation.

**E26** •• Draw the state before and after the failure in Section 21. Name the observation that distinguishes this failure from a healthy but slow operation.

**E27** •• Draw the state before and after the failure in Section 22. Name the observation that distinguishes this failure from a healthy but slow operation.

**E28** •• Draw the state before and after the failure in Section 23. Name the observation that distinguishes this failure from a healthy but slow operation.

**E29** •• Draw the state before and after the failure in Section 24. Name the observation that distinguishes this failure from a healthy but slow operation.

**E30** •• Draw the state before and after the failure in Section 25. Name the observation that distinguishes this failure from a healthy but slow operation.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Multiply 1,000 requests per second by 500 bytes to obtain 500,000 bytes per second. Multiply by 86,400 seconds to obtain 43,200,000,000 bytes per day. Multiply by seven to obtain 302,400,000,000 bytes. Indexes, compression, replicas, and gaps are separate assumptions.

**E2.** Region A fails nine of 900 and region B ten of 100. Add failures to obtain 19 and requests to obtain 1,000, then divide for 0.019. Averaging 0.01 and 0.1 instead gives 0.055 and gives the smaller region too much weight.

**E3.** The parallel children take 120 and 80 milliseconds. Their join waits for the maximum, 120. Add 20 milliseconds of assembly for 140. Adding every child gives 220 and double-counts concurrent time.

**E4.** At 1,000 traces per second for ten seconds, retain 10,000 candidates. Eight spans per trace at 300 bytes yield 24,000,000 bytes. Index structures, object allocation, late spans, replication, and transport are omitted and need measurement.

**E5.** A 30-day window at 1,000 requests per second contains 2,592,000,000 eligible requests. The permitted bad fraction is 0.001, so the budget is 2,592,000. The observed error fraction is 600 divided by 60,000, or 0.01. Divide by 0.001 to obtain burn ten. A request budget cannot be called downtime without assumptions about traffic.

**E6.** Begin with the promise to the viewer. Measure response correctness and delay at the boundary where that promise is experienced; use process health to help explain a failed promise. A cached old value can survive while the database and API are healthy. Compare the returned version with the contract, rather than treating an HTTP success as proof of correct data.

**E7.** An external probe measures the visible result; internal telemetry narrows the explanation. Keep a controlled test record, protect the probe credentials, and avoid replacing ordinary traffic with a privileged shortcut. A probe from one region can miss another region. Group its results by test location and operation without putting its unique request ID into a metric label.

**E8.** Separate what users experienced from what you think caused it. State a prediction, inspect evidence across boundaries, and make one interpretable change when the situation permits. Charts that rise together establish correlation. Missing telemetry, clock skew, and changes to measurement definitions can produce the same picture without the proposed failure.

**E9.** Define the event, unit, population, and outcome of every measurement. Keep attempts, logical commands, and side effects separate so a retry cannot look like extra successful business work. Instrumentation before completion misses late failures. Instrumentation in a finally block still needs the actual outcome, because completion of the handler does not imply success of the operation.

**E10.** Use stable event names and separately typed fields. Log the transition needed for diagnosis, rather than every instruction. Count bytes and retention because a small record multiplied by traffic becomes a storage workload. Free text can remain useful for a message, but depending on its exact wording for alerts makes editorial changes operational changes. Avoid logging full response bodies when a version and outcome answer the question.

**E11.** Carry a validated correlation ID across synchronous calls and log an attempt ID for retries. Keep it separate from an idempotency key and from the authorization decision. An untrusted caller can forge a correlation ID. Restrict length and characters, never let it inject log syntax, and do not grant access based on it.

**E12.** Put correlation and causation into the durable envelope, then create fresh processing spans and attempt records at the worker. A queued message can outlive the request that created it. A log line saying sent is ambiguous unless it names the boundary crossed. Stored locally, accepted by the broker, and applied by a receiver are different states.

**E13.** Keep secrets out of telemetry at the source, restrict access, and choose retention per purpose. Sampling is a cost policy, not a privacy policy; a sampled secret is still a secret. Redaction after export leaves the raw copy in collectors and buffers. Debug logging must use the same field rules as normal logging.

**E14.** A counter measures accumulated events. Convert its change to a rate using elapsed time and explicit reset handling, then aggregate compatible instances. Divide failures by attempts from the same eligible population. A missing scrape is not a zero counter. Query behavior must distinguish gaps, resets, and genuinely no traffic.

**E15.** Use a gauge for current occupancy, queue length, or memory. Pair it with rates and wait durations, and update it through every exit path. The meaning of a high value depends on what resource it describes. Summing memory gauges across machines measures total allocation, while averaging them measures a different quantity. Specify the question before choosing the aggregation.

**E16.** Use distributions for latency, and choose bucket boundaries near the user promise. Merge compatible bucket counts across instances before deriving a fleet percentile. Never average instance percentiles to obtain a fleet percentile. Averages and percentile summaries generally cannot reconstruct the original distribution. Prometheus explains histogram and summary aggregation in its [histogram guidance](https://prometheus.io/docs/practices/histograms/).

**E17.** Metric labels create series, not merely annotations. Multiply their possible values and include histogram expansion before approving a label. Keep individual identities in record-oriented evidence. A label that currently has few values can grow without bound if its source is free text, URLs with identifiers, or exception messages. Normalize routes and outcomes.

**E18.** A span measures an operation, and the trace records relationships among operations. Parent duration includes child waiting. Inspect gaps and concurrency before assigning the residual duration to application work. Instrumentation that closes the server span before a streaming response finishes measures handler setup rather than full delivery. State which boundary the span represents.

**E19.** Extract, attach, and inject context at transport boundaries. Preserve it across task switches and record broken propagation explicitly. A valid trace header is evidence metadata, not an authorization credential. Blindly reflecting untrusted context can cause misleading associations or excessive baggage. Bound values and respect the instrumented library’s context rules.

**E20.** Identify dependencies and overlapping intervals. Improve the longest dependent path, because making an already faster parallel child faster may not reduce the response time at all. Clock skew between machines can create impossible-looking relationships. Use local span durations and propagation relationships carefully; do not infer exact cross-host ordering from wall clocks alone.

**E21.** Use links when work has several causes or outlives its caller. Keep delivery attempt, client observation, and durable effect separate; span status should follow the contract of the operation it measures. An unrecorded retry hides amplification and can make one request look like one dependency call. Trace attempts while retaining their logical relation.

**E22.** Head sampling makes a decision before the outcome. It bounds retained trace volume cheaply, but rare errors can disappear. Keep complete aggregate outcome counts and label the trace selection policy. Sampling independently at every service fragments traces. Use a coordinated parent decision or a documented strategy that preserves relationships.

**E23.** Tail sampling buys outcome-aware retention with buffering and routing work. Bound memory, document the wait window, and measure incomplete or late traces. Keep aggregate metrics independent of this biased selection. Tail sampling cannot recover spans discarded at the source. The [OpenTelemetry sampling guide](https://opentelemetry.io/docs/concepts/sampling/) describes the head and tail distinction.

**E24.** Decouple telemetry transport with bounded queues, batching, and backoff. Expose export failures and drops through a path that does not depend only on the failed exporter. Prefer losing optional diagnostics to blocking all user requests. Audit requirements can need durable acknowledgement and a different failure policy. Do not silently apply an optional-debug loss policy to required security records.

**E25.** Track whether evidence is complete and current, not only what values it reports. Test ingest-to-query visibility and provide an independent route for a monitoring-stack failure. A backend can acknowledge ingestion while indexing is delayed. Query freshness and ingestion success answer different questions.

**E26.** Measure arrival, admission, and useful completion separately. Group by operation and bounded outcome so a healthy high-volume read route cannot hide broken writes. A service that sheds work can keep latency low for admitted requests while rejecting most users. Put admission loss beside latency.

**E27.** Aggregate numerator and denominator before dividing. Retain bounded regional and operation views to detect concentrated failures, and use the same eligibility definition everywhere. A fleet target can pass while one tenant’s entire workload fails. Choose whether the promise concerns requests, users, regions, or another population.

**E28.** Use resource measurements to explain a symptom. For CPU inspect runnable work and throttling; for memory inspect growth and pauses; for pools inspect acquisition waits. A high percentage is not an incident by itself. Increasing a connection pool can move waiting into the database and make it slower. Size the dependency’s sustainable concurrency rather than treating every queue as a reason to add callers.

**E29.** Combine queue depth with age and completion rates, pools with acquisition waits, and hit ratio with dependency load and freshness. Each pairing connects an internal quantity to the effect it can explain. A retry queue can look busy while useful progress is zero. Count successful effects separately from processing attempts.

**E30.** An SLI needs a population, a good-event definition, a measurement boundary, and a window. Align it with the user’s task and name missing-data behavior. Changing eligibility to remove failures makes the target easier without making the service better. Review denominator changes as contract changes.

These exercises describe illustrative designs, not the private architectures of the named products. Continue by defending the same flows under a changed workload, while keeping each safety rule explicit.

### Primary sources

[Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/). Symptom-based monitoring and the golden signals.

[OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/). Definitions of logs, metrics, and traces.

[Prometheus histograms](https://prometheus.io/docs/practices/histograms/). Aggregation and distribution limitations.

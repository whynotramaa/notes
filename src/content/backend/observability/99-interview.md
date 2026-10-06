@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Logging

**Q1. What is a structured log and why use one?**

A log line with named fields, usually one JSON object per line, with a stable event name and variable parts in fields. It can be filtered, counted and joined by machines, which free text cannot at fleet scale.

**Q2. How should log levels be used?**

DEBUG for development detail, INFO for normal significant events, WARN for handled surprises, ERROR for requests that failed because of us, FATAL for process-ending failures. Client mistakes such as 4xx are INFO with the status in a field, so ERROR stays meaningful.

**Q3. What is a request id and how does it flow?**

An id generated at the edge, or accepted from a trusted upstream, sent on every downstream call in a header, returned to the client, and written into every log line. It joins all the lines for one action across services.

**Q4. How do correlation ids work across queues?**

The producer puts the id in the message headers and the consumer binds it into its logging context, so asynchronous work links back to the request that caused it.

**Q5. What is contextual logging?**

Binding request fields such as request id, user id and tenant once into context that the logging library reads automatically, using contextvars, AsyncLocalStorage, Go's context or Java's MDC, so developers do not pass them by hand.

**Q6. How do you control log cost?**

Write only significant events with chosen fields, sample routine INFO lines from successful fast requests by hashing the request id, keep all warnings, errors and slow requests, and set retention by purpose with hot and archive tiers.

**Q7. How do you keep secrets and personal data out of logs?**

Log chosen fields rather than whole objects, redact known sensitive keys in the logging library, scan the pipeline for secret-shaped strings, restrict log access, and rotate any secret that leaks rather than just deleting the lines.

### Metrics

**Q8. How do logs, metrics and traces differ?**

Logs record individual events at a cost that grows with traffic. Metrics are aggregates whose cost depends on the number of series. Traces record one request's path and timing across services and are sampled.

**Q9. Describe the four Prometheus metric types.**

A counter only rises and is read as a rate. A gauge reports a current value that moves both ways. A histogram counts observations into buckets plus a count and sum. A summary computes quantiles in each process.

**Q10. Why prefer histograms to summaries for latency?**

Histogram buckets are counters that can be summed across instances and time before estimating a percentile. Summary quantiles cannot be combined, so the fleet p99 cannot be computed from them.

**Q11. What is cardinality and why does it matter?**

The number of distinct label combinations, each a separate time series. It multiplies across labels, and an unbounded label such as user id or full URL can create millions of series, overwhelming the metric store and the bill.

**Q12. What should a backend service measure?**

RED for every endpoint, the same for every dependency from the client side, saturation of CPU, memory, GC, event loop, pools and queues, the cache hit ratio, consumer lag, and a few business counters.

**Q13. What is an exemplar?**

A trace id attached to a histogram bucket observation, so a chart's slow bucket links directly to an example trace.

### Percentiles

**Q14. Why can average latency hide a disaster?**

Latency is skewed and often bimodal, so the mean lands between real values. 985 requests at 30 ms and 15 at 3 s average 74.55 ms while p99 is 3 s.

**Q15. How are percentiles estimated from histograms?**

Find the bucket containing the target rank in the cumulative counts and interpolate linearly within it. Accuracy depends on bucket width, so put boundaries at the thresholds you care about.

**Q16. Can you average p99s across instances?**

No. Sum the bucket counts across instances first, then estimate the percentile.

**Q17. Why does tail latency matter more with fan-out?**

A request waiting on n calls is slow if any is slow, with probability 1 − 0.99ⁿ for p99 tails, 9.6% for ten calls and 63.4% for a hundred.

**Q18. What is coordinated omission?**

A load tool that waits for each response before sending the next stops sending during stalls, recording one slow request instead of the many real users would have queued, so it understates tail latency. Fixed-rate tools avoid it.

### Tracing

**Q19. What are a trace and a span?**

A trace is one request's journey, made of spans. A span is a timed operation with a trace id, its own span id, a parent span id, attributes, events and a status.

**Q20. How is trace context propagated?**

Services extract the W3C traceparent header on incoming requests and inject it into outgoing requests and message headers. It carries the version, 16-byte trace id, 8-byte parent span id and a sampled flag.

**Q21. Compare head and tail sampling.**

Head sampling decides at the start and is cheap and consistent but keeps errors only at the base rate. Tail sampling decides after the trace completes and keeps errors and slow traces, at the cost of buffering every span and routing by trace id.

**Q22. What is baggage, and what should never go in it?**

Key-value context propagated to every downstream service in the baggage header. Never secrets or personal data, since it travels everywhere the request goes.

**Q23. What does OpenTelemetry provide?**

A vendor-neutral API, SDK, instrumentation libraries, the OTLP protocol, semantic conventions and a collector that receives, processes, samples, redacts and exports telemetry to any backend.

**Q24. Where does trace propagation commonly break?**

Thread pools and in-process queues that do not copy context, message consumers, proxies that strip headers, and calls to third parties.

### Signals, dashboards and alerts

**Q25. What are the four golden signals?**

Latency, traffic, errors and saturation.

**Q26. Compare RED and USE.**

RED, rate, errors and duration, applies to request-driven services and shows where a problem is. USE, utilisation, saturation and errors, applies to resources and shows why.

**Q27. What is the difference between monitoring and observability?**

Monitoring answers known questions with dashboards and alerts. Observability is the ability to answer new questions from rich, high-cardinality telemetry, moving between metrics, traces and logs.

**Q28. Why page on symptoms rather than causes?**

Symptoms such as errors and latency are what users feel and catch every cause. Causes such as high CPU often need no action and create alert fatigue.

**Q29. What makes an alert good?**

It is actionable, linked to a runbook, persists for a window before firing, and pages only for user-facing symptoms or certain precursors. Alerts that fire without needing action are fixed or removed.

### SLIs, SLOs and SLAs

**Q30. Define SLI, SLO and SLA.**

The SLI is a measurement, good events over valid events. The SLO is an internal target for it over a window. The SLA is a looser contractual promise with penalties.

**Q31. What is an error budget?**

The allowed failure, one minus the SLO. At 99.9% over 30 days of 43.2 million requests a day it is 1,296,000 requests, or 43.2 minutes of total outage.

**Q32. What is burn rate?**

The rate of budget consumption relative to the rate that would spend it exactly over the window. A burn rate of 14.4 for one hour spends 2% of a 30-day budget.

**Q33. Why use multiple windows in burn-rate alerts?**

The long window ensures enough budget was spent to matter, and the short window makes the alert resolve quickly once the problem stops.

**Q34. Why should the SLA be looser than the SLO?**

So the team is alerted and acting long before it owes credits.

### Health checks

**Q35. Liveness versus readiness versus startup?**

Liveness asks whether to restart a stuck process. Readiness asks whether the instance should receive traffic. Startup gives slow boots a separate budget before the other two begin.

**Q36. Why must liveness not check the database?**

Restarting cannot fix a database, and a shared dependency failure would restart every instance at once, turning a short failover into a long outage with a cold herd.

**Q37. Should readiness check dependencies?**

Only the instance's own state. A shared dependency outage would make every instance unready and fail requests that did not need that dependency.

### Performance

**Q38. State Little's law and use it.**

In-flight equals arrival rate times time in the system. 2,000 requests a second at 50 ms means 100 in flight.

**Q39. Why plan for well under 100% utilisation?**

Queueing delay rises steeply as utilisation approaches 100%, 4 ms at 50% and 40 ms at 95% for 2 ms of work in the simplest model.

**Q40. How do you read a flame graph?**

Width is share of samples, stacks grow upward, x-order is alphabetical, not time. Look for wide plateaus at the top.

**Q41. What is CPU throttling in containers?**

A CPU limit grants a quota per 100 ms period. A multi-threaded burst can spend it early and be stopped for the rest of the period, adding latency while average CPU looks low.

**Q42. Compare load, stress, spike and soak tests.**

Load tests check behaviour at expected peak plus margin, stress tests find the breaking point, spike tests check sudden jumps, and soak tests run for hours to find leaks.

### Failures and debugging

**Q43. Redis goes down. What happens?**

With short timeouts and a breaker, misses fall through to the database at about ten times the normal query load. With long timeouts, requests pile up waiting on Redis and the service exhausts its workers first.

**Q44. A Kafka consumer is six hours behind. What do you do?**

Determine whether it is stopped or slow, fix the cause such as a poison message, scale up to the partition count, compute the drain time from consume minus produce rates, and confirm retention exceeds the lag.

**Q45. p99 latency doubled. How do you investigate?**

Scope by endpoint, instance and region, align with changes, open an exemplar trace, find the slow span, then examine that dependency or profile the service's own code.

**Q46. Memory keeps growing. How do you investigate?**

Check whether it plateaus. If not, take two heap dumps or profiles apart in time and compare which objects grew, looking at unbounded caches, maps, listeners and queues.

**Q47. Errors rose after a deploy. What first?**

Roll back or turn off the feature flag, then investigate with error logs, traces and the deploy diff.

**Q48. What makes an incident review blameless and useful?**

It asks how the system allowed the failure, builds the timeline from telemetry, measures impact in error budget, and sets owned action items that improve detection and limit blast radius.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Arithmetic

**E1** ● A service handles 60,000,000 requests a day and writes 6 lines of 300 bytes per request. How much log data is that a day, and over 14 days of hot retention?

**E2** ● 1% of log lines are warnings or errors and are always kept. The rest are sampled at 10%. What fraction of lines is kept?

**E3** ● A counter has 3 methods, 50 routes, 8 status codes and 6 instances. How many series in the worst case, and for a histogram with 10 buckets?

**E4** ● 980 requests take 20 ms and 20 take 2,000 ms. Compute the mean and p99.

**E5** ● 80% of requests hit a cache at 4 ms and 20% miss at 50 ms. What is the mean?

**E6** ● Cumulative counts are 8,000 under 50 ms, 9,400 under 100 ms, 9,900 under 250 ms and 10,000 in total. Estimate p95.

**E7** ● A page waits on 30 parallel calls, each with a 1% chance of exceeding its p99. How often is at least one slow?

**E8** ● Repeat E7 for 50 calls.

**E9** ● 1,000 requests a second are head-sampled at 5%, with 30 spans of 400 bytes each. What is the span data rate, and the volume per day?

**E10** ● Tail sampling buffers every span for 20 s at 1,000 requests a second with 30 spans of 400 bytes. How much memory does the buffer need?

**E11** ● A service handles 10,000,000 requests a day with a 99.95% SLO over 30 days. Compute the error budget in requests and in minutes of full outage.

**E12** ● The SLO is 99.9% and the error rate is 2%. What is the burn rate, how long until the 30-day budget is gone, and what share does one hour spend?

**E13** ● A journey depends in series on four components at 99.9% each. What is the best possible availability?

**E14** ● 800 requests a second take 120 ms. How many are in flight, and how many if latency rises to 600 ms?

**E15** ● Each request needs 5 ms of a single server. Using W = S ÷ (1 − ρ), compute time in system at 75% and 90% utilisation.

**E16** ● A consumer is 4 hours behind a topic producing 80 events a second. How many events are waiting, and how long does catch-up take at 200 a second?

**E17** ● A container has a CPU limit of 1.5 cores and a 100 ms period. Six threads become busy at once. When is the quota spent, and how long are they stopped?

**E18** ● A service handles 800 requests a second, each allocating 150 KB. What allocation rate must the garbage collector handle?

### Traces and explanations

**E19** ●● Choose a metric type for requests served, requests currently in flight, request latency, and bytes sent.

**E20** ●● A developer labels the request counter with the full URL path. Explain what happens and fix it.

**E21** ●● Assign log levels to: a 404 for an unknown order, a retry that succeeded, a payment provider timeout that failed the request, a process unable to bind its port, and an SQL statement while debugging.

**E22** ●● A request passes gateway → orders → payments. Show the traceparent each service receives and what each records as its parent.

**E23** ●● A liveness probe pings PostgreSQL with period 10 s and threshold 3. Trace a 35-second failover across 4 instances.

**E24** ●● Choose SLIs for browsing menus, placing orders, live order tracking over SSE, and the search indexing pipeline.

**E25** ●● Design burn-rate alerts for a 99.5% SLO over 30 days and state what share of budget each threshold spends.

**E26** ●● p99 doubled on one of four instances only. List what you check and in what order.

**E27** ●● Two heap profiles an hour apart show a map from tenant id to label set growing by 2,000 entries an hour. Explain and fix.

### Designs and proofs

**E28** ●●● Design the observability for Wren's realtime service from Unit XII: logs, metrics, traces, SLOs and alerts.

**E29** ●●● Write the outline of a blameless review for a 12-minute Redis outage that caused a database overload.

**E30** ●●● Show by counterexample that the mean of per-instance p99s is not the fleet p99, and prove that the fraction of requests under a threshold does aggregate exactly.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 60,000,000 × 6 × 300 = 108,000,000,000 bytes, 108 GB a day. Over 14 days, 1.512 TB.

**E2.** 0.01 + 0.99 × 0.1 = 0.109, so 10.9% of lines are kept, an 89.1% reduction.

**E3.** 3 × 50 × 8 × 6 = 7,200 series. The histogram has 10 buckets plus count and sum, 12 series per combination, 86,400.

**E4.** Mean = (980 × 20 + 20 × 2,000) ÷ 1,000 = (19,600 + 40,000) ÷ 1,000 = 59.6 ms. The 990th request is one of the slow ones, so p99 = 2,000 ms.

**E5.** 0.8 × 4 + 0.2 × 50 = 3.2 + 10 = 13.2 ms, a value no request takes.

**E6.** Rank 9,500 lies between 9,400 and 9,900, in the 100 to 250 ms bucket holding 500 requests. p95 ≈ 100 + (100 ÷ 500) × 150 = 130 ms.

**E7.** 1 − 0.99³⁰ ≈ 26.0%.

**E8.** 1 − 0.99⁵⁰ ≈ 39.5%.

**E9.** 1,000 × 0.05 × 30 × 400 = 600,000 bytes a second, 0.6 MB/s. Per day, 600,000 × 86,400 = 51.84 GB.

**E10.** 1,000 × 30 × 400 × 20 = 240,000,000 bytes, 240 MB.

**E11.** 30 days is 300,000,000 requests. 0.05% of that is 150,000 requests. In time, 0.0005 × 43,200 minutes = 21.6 minutes.

**E12.** Burn rate = 0.02 ÷ 0.001 = 20. The budget lasts 30 ÷ 20 = 1.5 days. One hour spends 20 ÷ 720 ≈ 2.78%.

**E13.** 0.999⁴ ≈ 0.99600, about 99.60%.

**E14.** 800 × 0.12 = 96 in flight. At 600 ms, 800 × 0.6 = 480.

**E15.** At 75%, 5 ÷ 0.25 = 20 ms. At 90%, 5 ÷ 0.1 = 50 ms.

**E16.** 4 × 3,600 × 80 = 1,152,000 events. Net drain is 200 − 80 = 120 a second, so 1,152,000 ÷ 120 = 9,600 s, about 2.67 hours.

**E17.** The quota is 150 ms of CPU per 100 ms period. Six threads use 6 ms of CPU per millisecond, so the quota is spent after 25 ms, and the threads are stopped for the remaining 75 ms.

**E18.** 800 × 150 KB = 120,000 KB a second, 120 MB/s.

**E19.** Requests served, a counter read as a rate. In flight, a gauge. Latency, a histogram. Bytes sent, a counter, or a histogram of response sizes if the distribution matters.

**E20.** Paths with ids such as `/orders/123` create a series per id, so cardinality grows with the number of orders, exhausting the metric store and the bill. Label with the route template `/orders/:id`, which the router knows, and send per-order detail to logs and traces.

**E21.** 404 for an unknown order, INFO with the status in a field. Retry that succeeded, WARN, or INFO with a retry count field. Provider timeout that failed the request, ERROR. Unable to bind the port, FATAL. SQL while debugging, DEBUG, never on in production by default.

**E22.** The gateway receives no traceparent, creates trace id T and span G, and sends `00-T-G-01`. Orders records span O with parent G and sends `00-T-O-01` to payments. Payments records span P with parent O. All three share T, and the backend rebuilds the tree G → O → P.

**E23.** The probe fails at about 10 s, 20 s and 30 s into the failover, by which point all four instances have failed three checks and the platform restarts them all near the same moment. They return a few seconds later, after the database is back but with empty caches and pools, open 40 connections together, and send ten times the usual query load. A 35-second failover becomes a multi-minute outage. Liveness should check only the process.

**E24.** Menus: availability, non-5xx over valid requests, and latency, the fraction under 300 ms. Orders: availability and latency for `POST /orders`, with payment failures caused by Wren counted as bad. Tracking: the fraction of status updates delivered to connected clients within 5 s of commit, plus connection success rate. Search indexing: freshness, the fraction of time the newest indexed change is under 60 s old.

**E25.** The budget is 0.5%. Page at 14.4× over 1 hour with a 5-minute short window, an error rate above 7.2%, spending 2%. Page at 6× over 6 hours with a 30-minute short window, above 3%, spending 5%. Ticket at 1× over 3 days with a 6-hour short window, above 0.5%, spending 10%.

**E26.** Confirm it is one instance on the RED dashboard by instance. Check what is different about it: its node, its version, whether a deploy is partly rolled out, CPU throttling, GC pauses, memory, noisy neighbours on the node, and its connection pool. Compare an exemplar trace from it with one from a healthy instance. If nothing explains it, take a CPU profile there. Meanwhile remove it from rotation, which is safe because three instances can carry the load.

**E27.** Each tenant gains a new entry each hour, so the map grows by 2,000 entries an hour without bound, 48,000 a day, a leak. The fix is a bounded structure with expiry, or no per-tenant map at all if it feeds metrics labels, since per-tenant series belong in logs or a bounded label set.

**E28.** Logs: structured events for connect, authenticate, subscribe and disconnect with close codes, carrying the connection id, user id and request id from the ticket. Metrics: open connections per server, connects and disconnects per second by code, send buffer sizes and dropped or coalesced messages, broker publish-to-delivery latency histogram, replay size on resume, event-loop lag, memory per connection. Traces: from the order service's commit through the outbox, Kafka, publisher and broker to the write on the socket, with context in message headers. SLOs: 99.9% of status updates delivered within 5 s, and 99.9% connection success. Alerts: burn rate on both, reconnect rate above normal, and broker lag.

**E29.** Summary and impact in requests failed and budget spent. Timeline from telemetry: Redis primary lost, cache errors, hit ratio to zero, database CPU at 100%, burn-rate page, failover of Redis, cache refill, recovery. Root cause of the Redis failure. Contributing factors: no request coalescing, a 2-second Redis timeout that held workers, no rate limit on expensive endpoints, a replica not configured for automatic failover. Action items with owners: 50 ms timeouts and a breaker, coalescing, local stale cache, automatic failover, a game day that disables Redis in staging.

**E30.** Counterexample: instance A serves 100 requests with p99 of 10 ms, and instance B serves 10,000 with p99 of 500 ms. The mean of p99s is 255 ms, but the fleet's slowest 1% is about 101 requests, nearly all from B at around 500 ms, so the fleet p99 is close to 500 ms. Proof for fractions: let instance i serve nᵢ requests, gᵢ of them under the threshold. The fleet fraction is Σgᵢ ÷ Σnᵢ. Because gᵢ and nᵢ are counts, they add exactly across instances and time windows, so computing the fraction from summed counts gives the exact fleet value, while the mean of per-instance fractions differs whenever the nᵢ differ.

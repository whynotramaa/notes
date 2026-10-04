@part V | Sampling and collection | We decide which evidence survives. Instrumentation can itself become a source of lost work. We will compare sampling, buffers, exporter failure, and trustworthy collection. | where:5

## 17. Head sampling

Recording every trace creates more data than the team can retain. **Head sampling** decides near the beginning whether a trace will be recorded. It is cheap because the decision can propagate before most work happens.

At the illustrative rate of 1,000 requests per second and a probability of 0.01, expected retained traffic is ten traces per second. With eight 300-byte spans per trace, the expected span payload is 24,000 bytes per second. These are expectations, not a guarantee that each second contains exactly ten traces. Random sampling can miss a rare failure. Preserve unsampled aggregate counters for reliability calculations; a sampled trace set is useful for investigation but can be biased by its retention policy.

The sampling decision happens before the cache lookup and database wait, so it cannot know which request will become the incident's useful trace. Propagate that decision through required child operations to avoid collecting disconnected fragments under ordinary parent-based sampling. Keep full-population failure counters alongside the selected traces. If retained traces look healthy while those counters worsen, investigate whether the selection missed the affected population rather than concluding the counters are wrong. The expected ten traces per second in the illustration is a sampling expectation. It supplies a budget calculation, not a promise that every operation or second has representative evidence.

@fig sd_observability_17 | Illustrative head sampling. The head decision lowers export volume but cannot retain an outcome that it discarded. Orange marks the expected export payload after the head decision.

Sampling independently at every service fragments traces. Use a coordinated parent decision or a documented strategy that preserves relationships.

:::story Picture this
A guard at the gate lets one visitor in every ten and decides before seeing what happens inside. The sample is cheap to collect, but an unusual visitor can leave no record at all. The gate's rule is simple, while the missing cases are the cost of deciding early.
:::

## 18. Tail sampling

A request becomes slow only after it starts. **Tail sampling** waits for later evidence before deciding whether to keep the trace. That permits a policy that retains failed or slow traces, but the collector must hold evidence while deciding.

At 1,000 traces per second with a ten-second decision window, the collector may hold 10,000 trace candidates. With eight spans of 300 bytes each, the illustrative payload buffer is 24,000,000 bytes before indexes, object overhead, or replication. Route spans from the same trace to a decision point so the policy can see its outcome. Late spans can arrive after the decision, and an incomplete trace can look fast if its slowest child has not arrived. Define the wait, size limits, and what happens to incomplete traces.

Follow a slow child that arrives after the collector's decision window. The collector may have seen the completed parent but not the detailed child evidence, or may have received neither completion signal yet. Its late-span policy must state whether the later evidence joins a retained trace, creates partial evidence, or is discarded. Route trace fragments consistently so different collectors do not make contradictory decisions from incomplete fragments. The illustrated 24,000,000 payload bytes cover candidates while waiting; indexes, metadata, and retries consume additional memory. Choosing to export fewer final traces does not remove the need to receive the candidate evidence first.

@fig sd_observability_18 | Illustrative tail sampling. Tail sampling buffers candidate traces until outcome-aware retention can run. Orange marks the retention decision that must handle incomplete or late evidence.

Tail sampling cannot recover spans discarded at the source. The [OpenTelemetry sampling guide](https://opentelemetry.io/docs/concepts/sampling/) describes the head and tail distinction.

:::note Sampling after the outcome
Tail sampling buys outcome-aware retention with buffering and routing work. Bound memory, document the wait window, and measure incomplete or late traces. Keep aggregate metrics independent of this biased selection.
:::

## 19. Collector queues and exporter failure

The telemetry backend stops accepting records. If the application blocks every request until export succeeds, an observability outage becomes an application outage. A **collector** receives, processes, batches, and exports telemetry independently of business request handling.

Use a bounded queue between the request path and export. Retrying export consumes queue space and time; once the queue fills, choose a documented loss policy and count dropped records. An illustrative stream arriving at 1,200 records per second while export drains 1,000 builds a backlog of 12,000 in 60 seconds. If arrivals later fall to 600, spare drain capacity is 400 per second and recovery takes 30 seconds. The queue delays loss; it does not create infinite capacity.

A restored backend is insufficient if the exporter can only match current arrivals. In the illustration, lowering input to 600 while export remains at 1,000 gives 400 records per second for retained work. Use that spare rate for the 12,000 queued records to obtain the stated 30-second drain. Track oldest queued age as well as count, because a retrying record can remain old while newer records flow. Set memory and retry limits before disconnection occurs, and expose any discarded records through an independent observation. Recovery should demonstrate both renewed export and the fate of evidence retained during the interruption.

@fig sd_observability_19 | Illustrative collector queues and exporter failure. Excess arrival rate builds a backlog that drains only with spare export capacity. Orange marks the spare export capacity and resulting backlog drain.

Audit requirements can need durable acknowledgement and a different failure policy. Do not silently apply an optional-debug loss policy to required security records.

:::warn Watch out
Decouple telemetry transport with bounded queues, batching, and backoff. Expose export failures and drops through a path that does not depend only on the failed exporter. Prefer losing optional diagnostics to blocking all user requests.
:::

## 20. Telemetry pipeline health

A perfect error chart stays flat because its collector is down. **Telemetry freshness** is the age of the latest valid evidence. Without freshness, the absence of errors can mean either health or a broken measurement path.

Observe scrape success, last sample time, collector queue use, exporter errors, and dropped records. Run an end-to-end synthetic event through the collection pipeline and verify it can be queried. The check should distinguish transport acceptance from searchable storage. A secondary heartbeat or external monitor can report that the primary monitoring stack is absent. Separate no traffic from no samples, and show gaps explicitly. A monitoring system shares infrastructure failure modes with the application unless we deliberately inspect those dependencies.

Give the synthetic record a recognizable identity and its source event time. Query it through the same backend path that responders use, then compare visibility with that source time. A successful collector receipt with an absent query result points toward export, storage, or indexing rather than an application instrumentation failure. An absent receipt suggests an earlier boundary. Keep the test capable of reporting through another route when the main backend is unavailable. A flat error chart becomes trustworthy only when its measurement path is current and the event population is understood; a missing synthetic result makes that trust explicit uncertainty.

@fig sd_observability_20 | Illustrative telemetry pipeline health. A known test event must become searchable before the observer claims pipeline health. Orange marks confirmation that the synthetic event is visible and current in a query.

A backend can acknowledge ingestion while indexing is delayed. Query freshness and ingestion success answer different questions.

:::interview Interview lens
**"What happens when the telemetry pipeline is unhealthy?"** Track whether evidence is complete and current, not only what values it reports. Test ingest-to-query visibility and provide an independent route for a monitoring-stack failure.
:::

:::key In one breath
Head decisions are cheap but cannot see the eventual outcome. Tail decisions need buffered traces. Telemetry queues need limits, loss counters, and a policy that preserves the application.
:::

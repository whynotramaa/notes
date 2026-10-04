@part IX | Case study: observing one request | We close the loop from viewer to investigation. A pipeline that silently drops evidence creates false confidence. We will walk the request, telemetry transport, incident timeline, and review. | where:9

## 33. The complete score-read trace

The viewer sends a read through the edge to the API. The API creates a server span, obtains a cached version, discovers it is too old, and reads the durable score. The response carries the new version and the client records whether it was fresh and timely.

Logs record the cache decision and final outcome with one correlation relation. Metrics count the attempt, dependency work, and the eligible good or bad result without retaining the request ID as a label. Child spans explain where the request waited. These are three views of one operation, not three competing products. Use the aggregate signal to locate the affected population, a trace to follow its waiting, and event records to inspect the state transition. [OpenTelemetry’s signal overview](https://opentelemetry.io/docs/concepts/signals/) describes the roles of these evidence types.

The trace needs the returned version at both the API and client boundaries. If the API reads a current database value but the client receives an older response, inspect intermediary reuse or overlapping client requests. If both receive the same old version, follow the cache decision and any fallback rule. A stale cache miss path can remain slow while correctly returning durable state, so record freshness and time independently. Keep request correlation through the fallback to associate the dependency evidence. This walkthrough locates the failed promise without assuming that the last visibly slow component initiated the problem.

@fig sd_observability_33 | Illustrative the complete score-read trace. The score-read trace ends at the client's version check after a stale cache decision. Orange marks the client's freshness check at the end of the read.

A server trace cannot prove the viewer received the body. Keep client-side outcome evidence or a public probe for the final delivery boundary.

:::story Picture this
A parcel moves from a customer's order desk to a stockroom, a packing bench, and a delivery van. Each handoff writes the same parcel number on its own work slip, so a late delivery can be traced to the station that held it. The slips describe one journey without pretending every station did the same work.
:::

## 34. The complete ingest-to-query path

An SDK accepts a span, but the engineer cannot find it. Acceptance at the SDK is only the first transition. Batching, transport, collection, export, indexing, and query each introduce another boundary where evidence can be delayed or lost.

Draw the record’s state after every acknowledgement. The application might have handed it to a local queue; the collector might have accepted it into memory; the backend might have stored it but not yet indexed it. Put loss and freshness measurements at those boundaries. Batch size and export interval affect delay even when no component fails. A useful end-to-end test produces a known event and waits for the query layer to return it, while the application remains independent of that waiting.

Stop export after the SDK accepts a record. The application may release the request while that record is still only in a local buffer, so request success proves nothing about later diagnostic survival. A collector receipt advances another boundary, but storage and indexing can still fail or lag. Record acknowledgement semantics and queue limits at each handoff, including whether restart retains buffered records. Query by source event time when reconstructing the incident so delayed indexing does not alter the execution order. An end-to-end ingest check measures the full route while component measurements identify the stalled handoff.

@fig sd_observability_34 | Illustrative the complete ingest-to-query path. Queryable evidence follows buffering, collection, durable storage, and indexing. Orange marks the searchable record beyond the earlier buffering and storage boundaries.

If all loss counters use the same broken export route, the outage hides its own evidence. Provide an independent health observation.

:::note Ingest visibility and query freshness
Distinguish local acceptance, collector acceptance, durable storage, and query visibility. Bound each queue and observe its age and drops. Test the full path with a known event.
:::

## 35. Designing the observability failure test

Disconnect the telemetry backend during a peak score-read workload. The expected application behavior is continued service with bounded diagnostic loss, unless a separately documented audit requirement changes the contract. The expected monitoring behavior is a clear telemetry-freshness or export-failure signal.

The test inspects request latency, memory growth, collector queue capacity, export retries, and recorded drops. After restoring the backend, inspect drain time and whether old records become queryable with their original event times. If delayed records are treated as current events, a healed exporter can create a false live incident. Use both event time and arrival time to interpret that backlog. Compare the test result with the calculated queue growth, while recognizing that real record overhead needs measurement.

Specify what must survive and what may be dropped before interrupting export. During disconnection, business requests continue under their ordinary latency contract while telemetry queue occupancy grows only within its bound. Once that bound is reached, observe the chosen loss policy and its counter through an independent path. After restoration, check original event times, duplicate handling, and whether old evidence becomes queryable. Fresh export alone is insufficient because it can conceal loss of the buffered incident records. Required audit evidence may need a different durable route whose acceptance and recovery are stronger than optional diagnostic telemetry.

@fig sd_observability_35 | Illustrative designing the observability failure test. Disconnection exercises bounded buffering, documented loss, and backlog recovery. Orange marks recovery that drains retained evidence while preserving event times.

A load test that keeps the monitoring backend healthy does not exercise this failure. Include telemetry outages in reliability testing.

:::warn Watch out
Test telemetry transport failure without allowing unbounded memory or blocked requests. Check drops, recovery, and timestamps, and use separate policies for optional diagnostics and required audit records.
:::

## 36. Incident review and failure prevention

The cache-key incident is over, and the write-up recommends being more careful. That sentence cannot be tested. A **post-incident review** should identify the observed failure chain and changes that interrupt it or reveal it earlier.

For Heron, a cache-key compatibility check can test the new and old reader paths. A canary can compare hit ratio and dependency request rate for equivalent traffic. A bounded fallback can protect the database while the cache is absent. A user-level freshness check can detect a successful but old response. Each action names a mechanism, an owner, and evidence that the action works. Re-run the incident trace after the change and show which transition is prevented, contained, or observed sooner.

A statement to add monitoring leaves the repair unspecified. For the cache-key incident, choose the evidence that would reveal a miss surge and the control that limits the resulting source demand. Repeat the same class of boundary failure after the change and compare offered load, source waiting, and user-visible freshness. Keep the original chain in the review so the new observation has a reason to exist. Removing redundant alerts can also be a valid outcome if they never changed response decisions. The review should leave a mechanism or measurement definition that changes how the next incident is detected or contained.

@fig sd_observability_36 | Illustrative incident review and failure prevention. The incident review repeats the failure scenario to assess the changed mechanism. Orange marks the repeated failure check that measures the revised mechanism.

Adding a graph without an owner or diagnostic use can increase noise. Explain which decision the new evidence enables.

:::interview Interview lens
**"How does an incident review produce a concrete engineering change?"** A review produces testable changes to code, limits, measurements, or procedures. Verify the change against the failure trace and keep uncertainty explicit where evidence was absent.
:::

:::key In one breath
Instrument the promise, carry context, preserve bounded evidence, and observe the observers. Recovery needs a user-level check. A useful review changes a mechanism, a threshold, or a procedure that can be tested.
:::

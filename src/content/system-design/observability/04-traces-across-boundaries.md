@part IV | Distributed tracing | We follow one operation through dependent services. Summing every duration misreads parallel work. We will carry context, draw spans, preserve asynchronous links, and find the critical path. | where:4

## 13. Spans and the trace tree

A request lasts 200 milliseconds, and a database operation inside it lasts 120. A **span** is a timed operation with identity, attributes, and relationships to other operations. A **trace** gathers related spans to describe an execution. **Distributed tracing** follows that execution across service and machine boundaries by carrying shared trace context and recording related spans.

Create the server span at admission and close it after the response outcome is known. Create a child span for the database call, including connection acquisition if that belongs to the measured operation. The parent duration includes its child’s time, so adding 200 and 120 double-counts elapsed time. In this simple nested trace the parent has 80 milliseconds outside the database span, computed as 200 minus 120. That residual can include other work and waiting; it is not automatically CPU time.

Inspect what the database span includes before attributing its 120 milliseconds. If it begins before connection acquisition, it can contain pool waiting and query execution; if it begins after acquisition, that waiting remains in the parent's residual. In either case the illustrated parent ends after 200 milliseconds, not after the sum of parent and child. Name missing intervals as uninstrumented elapsed time until further evidence identifies them. A CPU profiler can answer a different question about executing instructions. This prevents a responder from optimizing application computation solely because the trace lacks spans around a network or queue wait.

@fig sd_observability_13 | Illustrative spans and the trace tree. The child duration lies inside the parent; the residual is unclassified elapsed time. Orange marks the elapsed time outside the database span without attributing it to CPU.

Instrumentation that closes the server span before a streaming response finishes measures handler setup rather than full delivery. State which boundary the span represents.

:::story Picture this
A courier carries one job sheet through the loading desk, sorting room, and delivery van. Each station writes its own start and finish beside the same delivery number, and a parallel packing task gets its own attached sheet. The completed bundle shows both the parent route and the time spent at each station.
:::

## 14. Context propagation

The API starts a downstream call without passing trace context. Both services create valid spans, but they appear as unrelated traces. **Context propagation** carries the identifiers and flags needed to connect a downstream operation to its caller.

Extract context from the inbound transport, make it active during the handler, and inject it into the outbound transport. The downstream server extracts it and creates the related span. Asynchronous callbacks need explicit context preservation because execution can move to another task. Treat incoming context as untrusted diagnostic data: it cannot grant permission or decide which tenant owns an operation. The [W3C Trace Context specification](https://www.w3.org/TR/trace-context/) defines interoperable trace headers; it does not replace application authentication.

A context can exist in the incoming headers and still disappear during a task handoff. The server extracts it, schedules a callback, and that callback starts without the active parent; the outbound client then creates an unrelated root. Capture and attach the context with the task under the instrumentation library's lifecycle rules, then restore the prior context when the task finishes. Otherwise concurrent requests can acquire each other's parent by accident. Diagnose a broken connection by inspecting both handoff boundaries rather than assuming missing spans mean the dependency did no work. Authorization still comes from the ordinary credential and resource checks.

@fig sd_observability_14 | Illustrative context propagation. Transport extraction and injection connect the dependency span to its caller. Orange marks the connected child span produced by propagated context.

Blindly reflecting untrusted context can cause misleading associations or excessive baggage. Bound values and respect the instrumented library’s context rules.

:::note Trace context at handoffs
Extract, attach, and inject context at transport boundaries. Preserve it across task switches and record broken propagation explicitly. A valid trace header is evidence metadata, not an authorization credential.
:::

## 15. Parallel work and the critical path

The API asks for a score and a profile at the same time. The calls take 120 and 80 milliseconds, and response assembly takes another 20. The **critical path** is the dependent sequence whose completion controls the whole operation.

Both child calls begin together, so the request waits for the slower child. The computed elapsed time is the maximum of 120 and 80, plus 20, or 140 milliseconds. Summing them would report 220 and invent waiting that did not occur. If assembly needs the score first and only then can request the profile, the dependency structure changes and the sum becomes appropriate. Draw start and finish positions, not only a tree of service names. A trace tree describes parentage; timed spans reveal overlap.

Imagine improving only the profile call while leaving the score call unchanged. In the illustrated trace, the profile already finishes before the 120-millisecond score result, so faster profile work leaves the join time unchanged. Reducing score time can help until another required child becomes the controlling wait. Check that both calls actually start together; connection acquisition or application scheduling can delay one start and change the overlap. Also check whether assembly can begin incrementally or requires both complete results. The critical path follows dependencies and start times, so a list of service durations alone cannot prove the expected response improvement.

@fig sd_observability_15 | Illustrative parallel work and the critical path. Parallel children contribute their slower duration before response assembly extends the path. Orange marks response assembly after both required children complete.

Clock skew between machines can create impossible-looking relationships. Use local span durations and propagation relationships carefully; do not infer exact cross-host ordering from wall clocks alone.

:::warn Watch out
Identify dependencies and overlapping intervals. Improve the longest dependent path, because making an already faster parallel child faster may not reduce the response time at all.
:::

## 16. Async links, retries, and span status

A worker processes events from several requests in one batch. Making the whole batch a child of one request incorrectly suggests that request caused every item. A **span link** records a relation without forcing a parent-child tree that does not match the work.

Create a processing span for the batch and link the contributing contexts. Within it, record each attempt’s result and the durable event identity. A timeout on the client span can coexist with a committed server operation, so the trace must describe observations at both ends rather than declaring a single global outcome. Record an error when the measured operation fails its defined contract; an expected cache miss is normally a read-path decision, not necessarily a request failure. [OpenTelemetry’s trace concepts](https://opentelemetry.io/docs/concepts/signals/traces/) distinguish spans, context, events, and links.

A batch worker may receive events from unrelated score requests after those requests have ended. Record a batch processing span and link each retained originating context without inventing a parent that owns the entire batch. Inside the batch, a provider call can time out after the provider accepted its effect. The attempt span records the timeout; a later reconciliation span can record the confirmed effect under the same business identity. Preserve both observations rather than rewriting the first span as successful. Their relation explains why retry was attempted and why the recovery mechanism must avoid creating a second external action.

@fig sd_observability_16 | Illustrative async links, retries, and span status. Batch links preserve several causes, while a timeout leaves the effect uncertain. Orange marks the timed-out attempt whose external effect may still exist.

An unrecorded retry hides amplification and can make one request look like one dependency call. Trace attempts while retaining their logical relation.

:::interview Interview lens
**"How do you trace asynchronous work and retries?"** Use links when work has several causes or outlives its caller. Keep delivery attempt, client observation, and durable effect separate; span status should follow the contract of the operation it measures.
:::

:::key In one breath
A trace connects timed operations through causal relationships. Parent duration includes waiting for children. Parallel children contribute their maximum overlapping duration to elapsed time, not their sum.
:::

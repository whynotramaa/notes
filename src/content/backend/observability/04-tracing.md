@part IV | Distributed tracing | We follow one request through every service it touches and record where its time went. Once a request crosses three services, a queue and two databases, no single service's logs can explain why it was slow. We will cover traces and spans, context propagation with the W3C headers, head and tail sampling with baggage, and OpenTelemetry. | where:4

## 12. Traces, spans and the call tree

User 42's `POST /orders` took 1.4 seconds. The gateway's metrics say so. The order service's own metrics say its median is fine. Which part of the 1.4 seconds belongs to the order service, the payments service, the provider, the database or the network between them? Logs with a shared request id show which services were involved, but not how their time nested or overlapped. **Distributed tracing** records exactly that.

A **trace** is the record of one request's journey. It is made of **spans**, each a timed operation with a name, a start time, a duration, a status and attributes. The gateway's handling of the request is one span. Inside it, the order service's handler is a child span. Inside that, a database query, a Redis lookup and the call to the payments service are each a span, and the payments service's own handler and its call to the provider are spans beneath that. Every span records its **trace id**, shared by the whole trace, its own **span id**, and its **parent span id**, which together let a backend reassemble the tree.

@fig be_obs_trace | One trace as a waterfall. Each bar is a span, nested under its parent, and the long bar inside payments is the provider call.

Drawn as a waterfall, the trace answers the question at a glance. Of 1,400 ms, the gateway spent 4 ms, the order service's own code 30 ms, two database queries 8 ms, and the payments span 1,340 ms, of which 1,310 ms was the provider's HTTPS call. Spans also show what happened in parallel and in sequence. Two queries that could run concurrently but appear one after another, or forty sequential 2 ms queries that reveal an N+1 pattern, Unit VI, are obvious in a waterfall and invisible in a latency histogram.

Spans carry attributes that make them searchable, such as the HTTP route and status, the database statement with values removed, the cache key's prefix, the user's tenant and the deployed version. They can carry **span events**, timestamped notes within a span such as "retry 1 after 200 ms", and a status of error with the exception recorded. A trace backend such as Jaeger, Grafana Tempo, Zipkin or a hosted service stores them and lets an engineer find, for example, all traces from the last hour where `payments.charge` took over a second.

Tracing descends from Google's Dapper, described in a 2010 paper, which showed that low-overhead, always-on tracing across thousands of services was practical. Twitter's Zipkin, open-sourced in 2012, and Uber's Jaeger, in 2017, brought it to everyone else.

## 13. Context propagation

A trace only forms if every service knows which trace it is part of. When the order service calls the payments service, it must send the trace id and its own span id, so that the payments service's span is recorded with the right trace and parent. Passing this information across process boundaries is **context propagation**.

For HTTP, the standard is the **W3C Trace Context** recommendation, which defines a `traceparent` header. Its value has four fields separated by dashes, for example `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`. The first is the version, `00`. The second is the 16-byte trace id as 32 hex characters. The third is the 8-byte id of the calling span as 16 hex characters, which becomes the parent of the receiver's span. The last is flags, where `01` means the trace is sampled. A companion `tracestate` header carries vendor-specific data. Before the standard, every vendor had its own headers, such as Zipkin's `X-B3-TraceId`, and traces broke wherever two systems met.

@fig be_obs_propagation | The caller injects traceparent, the callee extracts it, and its new span names the caller's span as parent.

Each service does two things. On the way in, its middleware **extracts** the context from incoming headers, starts a span as a child of it, and stores it as the current context for the request, the same mechanism as contextual logging in section 2. On the way out, its HTTP client, gRPC client or Kafka producer **injects** the current context into outgoing headers or message metadata. Instrumentation libraries do both automatically for common frameworks and clients, so most services get correct propagation without writing code.

The breaks happen in the places automation does not reach. A thread pool or worker queue inside the process that does not copy the context loses the parent, and the work appears as a separate trace. Asynchronous messaging needs the context in message headers, and a consumer that processes a batch must decide whether each message continues its producer's trace or links to it. OpenTelemetry supports **span links** for that, letting one span reference others without being their child. A proxy or gateway that strips unknown headers breaks every trace through it, and a third-party API simply ends the trace at its boundary.

Logs join the trace by including the trace id and span id as fields, which logging integrations add automatically from the current context. From a slow span, an engineer can jump to exactly the log lines that span wrote, and from an error log line to its trace. That link is what makes the three kinds of telemetry work as one system.

## 14. Sampling and baggage

Tracing every request is expensive. If Wren traced all 2,000 requests a second at peak, with about 20 spans each at roughly 500 bytes, it would produce 20 MB of span data per second. So traces are **sampled**, and the question is how to choose which ones to keep.

**Head sampling** decides at the start of the request, at the gateway, and records the decision in the `traceparent` flags so every downstream service follows it. Wren samples 10%, so at peak 200 traces a second, 2 MB/s, and over a day at the 500 per second average, 50 traces a second producing 43.2 GB. Head sampling is cheap and consistent, since every span of a sampled trace is kept and no span of an unsampled one is. Its weakness is that the decision is made before anyone knows whether the request will be interesting. A rare error or a 3-second outlier is sampled at the same 10% as everything else, so 90% of the interesting traces are thrown away.

@fig be_obs_sampling | Head sampling decides at the gateway and keeps a random 10%. Tail sampling waits for the whole trace and keeps the errors and slow ones.

**Tail sampling** decides after the trace is complete. Every service sends all spans to a collector tier that buffers them by trace id until the trace finishes, then applies rules: keep every trace with an error, keep every trace slower than 1 second, keep 5% of the rest. It keeps exactly the traces people investigate. The cost is the buffer. Holding all spans for a 30-second decision window at 2,000 requests a second means 2,000 × 20 × 500 bytes × 30 s = 600 MB in memory, and all spans of one trace must reach the same collector instance, which needs routing by trace id. Many teams combine the two, with a generous head sample feeding a tail sampler, and always keep traces explicitly marked for debugging.

**Baggage** is the other thing that propagates. The W3C `baggage` header carries key-value pairs set by one service and readable by every service downstream, such as `tenant_id=17` or `experiment=checkout_v2`, so a deep service can label its spans or metrics with them without receiving them as arguments. Baggage is sent on every request, so it should stay small. It also travels to any service the request reaches, including third parties if the client is not configured to stop it, so it must never hold secrets or personal data.

## 15. OpenTelemetry

For years every observability vendor had its own agents, libraries and formats, so switching vendors meant re-instrumenting every service. **OpenTelemetry**, OTel, formed in 2019 by merging the OpenTracing and OpenCensus projects under the Cloud Native Computing Foundation, is now the standard way to produce traces, metrics and logs regardless of where they are sent.

It has four layers. The **API** is what application code calls to create spans and record metrics, and it does nothing on its own, so libraries can depend on it safely. The **SDK** implements the API, with sampling, batching and exporting. **Instrumentation libraries** add spans and metrics automatically to common frameworks and clients, HTTP servers, gRPC, database drivers, Redis and Kafka clients, so a service gets most of its telemetry by installing packages. Some languages, such as Java and Python, offer **auto-instrumentation** agents that do this without code changes. The fourth is the wire format, **OTLP**, the OpenTelemetry Protocol over gRPC or HTTP.

@fig be_obs_otel | Services emit OTLP to a collector, which samples, enriches and redacts, then exports to any backend.

Between services and backends sits the **OpenTelemetry Collector**, a separate process run as an agent on each node, a central tier, or both. It receives telemetry in OTLP and other formats, processes it in a pipeline, and exports it to one or more backends. Processing steps include batching, adding resource attributes such as the Kubernetes pod and node, tail sampling from section 14, filtering noisy spans such as health checks, and redacting attributes that should not leave the cluster, the same rules as section 4. Because the collector is the only component that knows about vendors, Wren can send traces to Tempo and metrics to Prometheus today and switch either tomorrow by changing collector configuration.

OpenTelemetry also standardises names through **semantic conventions**, so an HTTP span always has `http.request.method`, `http.route` and `http.response.status_code`, and a database span has `db.system` and `db.operation.name`. Dashboards and queries built on these names work across every service and language. Wren's services set a few resource attributes at startup, `service.name`, `service.version` and `deployment.environment`, which are what let a trace say which build of which service was slow.

:::story Picture this
A parcel with a tracking number. Each depot scans it in and out, writing the time and the depot's name against the same number. Nobody at any depot sees the whole journey, but the tracking page assembles the scans into a timeline that shows the parcel spent two days in one warehouse. Propagation is the label on the parcel. Without it, each depot's scans are just a list of unknown boxes.
:::

:::note Profiles as a fourth signal
Continuous profiling, Part VIII, samples stack traces from running services all the time at low overhead. OpenTelemetry has added profiles as a signal, and some tools link a slow span to the CPU profile captured during it, which goes one level below the span to the function that burned the time.
:::

:::warn Watch out
Span attributes and baggage leave the process and may reach a vendor. Do not record full SQL with values, request bodies, tokens or personal data in spans, and configure clients not to send baggage to third parties. Redact in the collector as a safety net.
:::

:::interview Interview lens
**"How does distributed tracing work?"** Each request gets a trace id at the edge. Each operation records a span with its own id, its parent's id, timing and attributes. Services extract the W3C traceparent header on the way in and inject it on the way out, including into message headers, so the backend can rebuild the tree as a waterfall. Sampling controls cost, head sampling at the edge is cheap and consistent, tail sampling in a collector keeps errors and slow traces. OpenTelemetry provides the API, SDK, auto-instrumentation and OTLP, and its collector routes to any backend.
:::

:::key In one breath
A trace is a tree of spans sharing a trace id, each with a span id, a parent id, timing and attributes, drawn as a waterfall that shows where 1,340 of 1,400 ms went. Context propagates in the W3C `traceparent` header, version, 16-byte trace id, 8-byte parent span id and sampled flag, injected by clients and extracted by servers, and in message headers for queues. Head sampling at 10% keeps 200 traces a second at peak, while tail sampling keeps errors and slow traces at the cost of buffering, 600 MB for 30 s here. OpenTelemetry standardises the API, SDK, instrumentation, OTLP and the collector that samples, redacts and exports.
:::

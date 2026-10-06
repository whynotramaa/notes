@part II | Metrics | We measure the service in aggregate, with numbers that stay cheap whatever the traffic. Logs describe individual events, and counting them at query time is slow and expensive. We will cover how logs, metrics and traces divide the work, the four metric types, labels and cardinality, and what a backend should measure. | where:2

## 5. Logs, metrics and traces

Wren's on-call engineer wants to know how many requests failed in the last five minutes. With only logs, the answer comes from scanning every line in those five minutes, 600,000 requests at peak, and counting the errors. That works for an investigation and fails for a dashboard refreshed every ten seconds by twenty people. Observability uses three kinds of telemetry because each answers a different question at a different cost.

**Logs** are individual events with full detail, such as "request req_7Hq2 failed with card_declined". They answer "what exactly happened to this one?" and their cost grows with traffic. **Metrics** are numbers aggregated over time, such as "1,204 requests to POST /orders in the last ten seconds, 3 of them 5xx". They answer "how much, how often, how fast?" and their cost depends on how many distinct series exist, not on traffic. A counter that is incremented a million times a second costs the same to store as one incremented once. **Traces** record the path of one request through many services, with the time spent in each, and answer "where did the time go for this request?". They cost about as much as logs and are usually sampled.

@fig be_obs_three | Logs, metrics and traces answer different questions at different costs, and an investigation moves between them.

An investigation uses all three in turn. A metric shows that p99 latency on `POST /orders` rose at 20:04. A trace from that minute shows the time is spent in the payments service's call to the provider. Logs for that trace's id show the provider returning slowly with a particular error code. Good tooling makes these jumps one click. A metric chart links to example traces, called **exemplars**, from the slow buckets, and a trace links to the logs that share its trace id.

The rule that follows is to use each for its job. Do not count with logs, because it is slow and sampled logs give wrong counts. Do not store per-request detail in metrics, because each distinct value becomes a new series, as section 7 shows. Do not use traces for alerting on totals. Some teams add a fourth kind, **events**, wide structured records of one unit of work with dozens of fields, such as Honeycomb's model, which can answer new questions without new metrics. They work like rich logs designed for querying, and the trade-offs are the same.

## 6. Counters, gauges, histograms and summaries

Metric systems such as Prometheus, the most common open-source one, offer four types, and choosing the right one decides what questions the metric can answer.

A **counter** only goes up, apart from resetting to zero when a process restarts. `http_requests_total` counts requests. Nobody looks at its raw value, which is just a large number. The useful view is its **rate**, the increase per second over a window, which Prometheus computes with `rate(http_requests_total[5m])` and which handles restarts by noticing the drop. Counters suit anything that happens: requests, errors, bytes sent, cache hits and misses, jobs processed. The error rate is one counter's rate divided by another's.

A **gauge** goes up and down and reports a current value, such as memory in use, connections open, queue depth or pool connections busy. Its raw value is meaningful. A common mistake is to use a gauge for something that should be a counter, such as "requests in the last minute" computed in the application, which breaks when two scrapes land in one minute or a process restarts.

@fig be_obs_types | A counter climbs and is read as a rate, a gauge moves both ways, a histogram counts observations into buckets.

A **histogram** records the distribution of observations, usually durations or sizes. It has a set of buckets with upper bounds, such as 10, 25, 50, 100, 250, 500 and 1,000 milliseconds and infinity, and each observation increments the count of every bucket whose bound it is under. Prometheus histograms are cumulative, so the 100 ms bucket counts everything up to 100 ms. The histogram also keeps a total count and a sum of all observations, which give the mean. Percentiles are estimated from the buckets at query time, section 10, and because buckets are counters they can be added across instances, so a fleet-wide p99 is possible.

A **summary** computes percentiles inside each process, using a streaming algorithm, and reports them directly, such as "p99 over the last 10 minutes is 241 ms". That is precise for one process but cannot be combined. The p99 of four instances is not the average of their four p99s, and no arithmetic on summaries produces the fleet's p99. That is why most teams now prefer histograms for latency. Newer formats, Prometheus native histograms and OpenTelemetry exponential histograms, choose bucket boundaries automatically at fixed relative precision, which removes the need to guess bounds in advance.

## 7. Labels and cardinality

A metric becomes useful when it can be broken down. `http_requests_total` alone says how busy Wren is. With **labels**, key-value pairs attached to each measurement, such as `method="POST"`, `route="/orders"`, `status="201"` and `instance="api-3"`, it says which endpoint is busy, which is failing and on which machine. Each unique combination of label values is a separate **time series**, stored and queried on its own.

The number of series is the metric's **cardinality**, and it multiplies. Wren uses 4 methods, 120 routes, about 10 status codes and 4 instances. The worst case is 4 × 120 × 10 × 4 = 19,200 series for one counter. In practice most combinations never occur, since a route usually has one or two methods, so the real number is much smaller. A latency histogram multiplies further, one series per bucket plus the count and sum. With 12 buckets that is 14 series per combination, or up to 268,800 for the histogram. Metric databases hold millions of series comfortably, so this is fine.

@fig be_obs_cardinality | Each label multiplies the series. A user id label turns thousands of series into millions.

Now a developer adds `user_id` as a label to see per-user latency. With 1,000,000 accounts, every existing series can split a million ways. Even if only active users appear, the metric database must create and index a new series for each, memory use climbs, queries slow down, and hosted vendors bill per series. This is a **cardinality explosion**, and it is one of the most common ways to take down a monitoring system or receive a surprising invoice. The same happens with request ids, order ids, full URLs that include ids such as `/orders/123` instead of the route template `/orders/:id`, error messages that include variable data, and timestamps.

The rule is that labels hold values from small, bounded sets. Route templates, methods, status codes, service names, regions and instance names qualify. Ids and free text do not. Per-user and per-request questions belong in logs and traces, which are designed for high-cardinality data. Wren's metrics library normalises routes to their templates automatically, caps the number of distinct values per label, and its CI checks new metrics for unbounded labels. Status codes are often grouped as `2xx`, `4xx` and `5xx` for alerting, keeping the exact code for drill-down.

## 8. What a backend should measure

With the types and labels understood, what should Wren actually measure? Every service exports the same core set, so that any engineer can read any dashboard.

For requests it serves, a service measures **rate**, requests per second by route and status, **errors**, the share of requests that fail, and **duration**, a latency histogram by route. These three are the RED method, Part V. For each dependency it calls, the database, Redis, Kafka and third-party APIs, it measures the same three from the client side, because a slow dependency shows first in the caller's view. That is how the payments service can show, before anyone opens a trace, that its p99 is high because the provider's p99 is high.

@fig be_obs_backend_metrics | The core set on one service: what it serves, what it calls, what it holds and what it waits for.

For resources, a service measures CPU use against its limit, memory use against its limit, garbage collection pauses, open file descriptors and threads or event-loop lag, the delay between when a callback should run and when it does, which in Node.js shows a blocked loop directly, Unit IX. For the pools and queues inside it, it measures the **database pool** in use, idle and waiting, plus how long requests waited for a connection, the **cache hit ratio** from hit and miss counters, Unit VII, **queue depth** and **consumer lag**, Unit VIII, and the number of in-flight requests.

Wren's numbers tell what normal looks like. At peak, 2,000 requests a second with 90% cache hits give 200 misses a second, each with 2 queries, so 400 queries a second at 4 ms each. By Little's law, Part VIII, that keeps 400 × 0.004 = 1.6 connections busy on average across 40, a pool utilisation of 4%. If that metric reaches 100% with requests waiting, the pool, not the database, has become the bottleneck, which is the incident Unit VI walked through.

Business metrics belong here too. Orders created per minute, payments succeeded and failed by reason, and sign-ups are counters like any other. They often catch problems that technical metrics miss. A bug that returns 200 with an empty cart has a perfect error rate and a falling order rate.

:::story Picture this
A car's dashboard and its trip recorder. The dashboard shows a few numbers that summarise everything right now, speed, fuel, temperature, and you glance at them constantly. The recorder logs every detail of every second and you only read it after something has gone wrong. Nobody would put the recorder's full output on the dashboard, or try to work out the car's speed by reading the recorder.
:::

:::note Pull and push
Prometheus pulls, scraping each instance's `/metrics` endpoint every 15 or 30 seconds, which makes a missing instance obvious. StatsD and OpenTelemetry's OTLP push, which suits short-lived jobs that may finish before a scrape. Many fleets use both, with a push gateway or collector for batch jobs.
:::

:::warn Watch out
Never put ids, emails, URLs with ids, or error messages in metric labels. Each distinct value is a new series, and a million users make a million series. Use route templates and small enumerations in labels, and send per-request detail to logs and traces.
:::

:::interview Interview lens
**"What metrics would you put on a new service?"** RED for every endpoint, request rate, error rate and a latency histogram labelled by route template and status class. The same three for every dependency from the client side. Saturation for resources, CPU, memory, GC pauses, event-loop lag, pool in use and waiting, queue depth and consumer lag. Cache hit ratio and a few business counters such as orders per minute. Histograms rather than summaries so percentiles can be aggregated, and labels only from small bounded sets.
:::

:::key In one breath
Logs record single events, metrics aggregate at a cost that depends on series rather than traffic, and traces follow one request, so count with metrics, investigate with traces and logs, and link them with exemplars and trace ids. Counters only rise and are read as rates, gauges report current values, histograms count observations into buckets that can be summed across instances, and summaries cannot be combined. Each label combination is a series, so 4 methods × 120 routes × 10 statuses × 4 instances allows 19,200, and a user id label would explode it. Measure RED for what a service serves and calls, saturation for what it holds, and a few business counters.
:::

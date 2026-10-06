@part V | Golden signals, dashboards and alerts | We turn telemetry into something an on-call engineer can act on at three in the morning. Having data is not observability; being able to answer a new question from it quickly is. We will cover the golden signals with the RED and USE methods, dashboards that support investigation, and alerts that fire on symptoms users feel. | where:5

## 16. Golden signals, RED and USE

A service can export hundreds of metrics. An engineer paged at night needs a short list that says, within a minute, whether users are hurting and roughly where. Three well-known lists provide it, and they fit together.

Google's Site Reliability Engineering book names four **golden signals** for any user-facing system. **Latency** is how long requests take, with successful and failed requests measured separately, since a fast error can make latency look better while users suffer. **Traffic** is how much demand there is, requests per second for Wren's API. **Errors** is the rate of failed requests, including requests that return 200 with wrong content if those can be detected. **Saturation** is how full the service is, the resource closest to its limit, such as CPU, memory, the connection pool or a queue.

@fig be_obs_signals | Golden signals for the whole service, RED for each request-driven component, USE for each resource.

Tom Wilkie's **RED method** is a version for request-driven services: **rate**, **errors** and **duration**. It is the golden signals minus saturation, applied to every service and every endpoint, and its value is consistency. If every one of Wren's services has the same three panels at the top of its dashboard, an engineer who has never seen the payments service can read it in seconds.

Brendan Gregg's **USE method** is for resources rather than services. For every resource, it checks **utilisation**, the fraction of time it was busy, **saturation**, the extra work queued because it was busy, and **errors**. Resources include CPUs, memory, disks, network interfaces, and also software resources such as thread pools, connection pools, file descriptors and locks. The distinction between utilisation and saturation matters. A CPU at 70% utilisation with a run queue of zero is fine. A database pool with 10 of 10 connections in use and 40 requests waiting is saturated, and the waiting, not the busyness, is what makes requests slow.

The methods combine naturally. RED on a service says *that* something is wrong and *where* in the request path, such as `POST /orders` p99 rising and errors at 2%. USE on the resources underneath says *why*, such as the order service's pool saturated with requests waiting 800 ms for a connection. Wren's dashboards follow that order, RED at the top, dependencies' RED next, USE for resources below.

## 17. Dashboards and correlation

A dashboard is a set of charts that answers a known question quickly. Wren keeps a few kinds. A **service overview** per service has RED for its endpoints, RED for each dependency, and USE for its resources, with the same layout everywhere. A **fleet overview** shows every service's RED in a grid, so a red square points to where to look. **Business dashboards** show orders per minute, payment success rate and active couriers. Every chart marks deployments, feature flag changes and config changes as vertical lines, because "what changed?" is the first question in most incidents, Part X.

Dashboards fail when they grow without design. A wall of eighty charts that someone built during an incident three years ago hides the five that matter. Wren's rule is that every chart must answer a question an on-call engineer actually asks, and charts no one has looked at in three months are deleted.

@fig be_obs_dashboard | A service overview, RED at the top, dependencies next, resources below, with the deploy marked on every chart.

Dashboards only answer questions someone anticipated. **Observability**, in the sense Charity Majors and others popularised, is the ability to answer questions nobody anticipated, such as "are slow checkouts concentrated on Android users of app version 4.12 in one region with a particular card issuer?". No dashboard has that chart. Answering it needs telemetry with many fields per request, high-cardinality data like app version, user id and region, and tools that can group and filter by any field on the fly. That is the argument for wide structured events and for traces with rich attributes rather than only pre-aggregated metrics.

**Correlation** is the other half. An investigation moves from a metric spike to the traces in that minute, from a slow trace to its logs, and from a log line to the deploy that introduced the code. Each jump should be one click, which needs consistent names across signals: the same `service.name`, the same route templates, trace ids in logs, and exemplars on metrics. Wren also correlates in time, overlaying deploys, scaling events and dependency incidents on charts, so that "errors started at 20:04 and the 20:03 deploy of payments v812 is the only change" is visible without searching. Without correlation, three good telemetry systems produce three separate investigations.

## 18. Alerting on symptoms

An alert wakes a person, so it must be worth waking for. Wren follows a rule from Google's SRE practice, to **page on symptoms, not causes**. A symptom is something users experience, such as errors above the normal rate or latency above the target. A cause is something that might lead to a symptom, such as CPU at 90%, one instance down, or a disk at 80%. Causes produce many alerts that need no action. A CPU at 90% while every request is fast and successful is a capacity planning note, not an emergency. Symptoms catch every cause, including ones nobody thought to alert on, because whatever breaks, it shows up as users seeing errors or slowness.

So Wren's paging alerts are few. They cover the SLO burn rate for availability and latency on each user-facing service, Part VI, the order rate falling far below its normal value for the time of day, and a handful of conditions that will certainly become user-facing soon and cannot wait, such as a certificate expiring in under seven days, Unit I, or consumer lag on `order-events` growing for 15 minutes, Unit VIII. Everything else becomes a **ticket**, a non-urgent alert reviewed during working hours.

@fig be_obs_alerting | Symptoms page a human. Causes become tickets or dashboard context. Each page links to its runbook.

Every alert must be actionable and have a **runbook**, a short document linked from the alert that says what the alert means, what to check first, and what the usual fixes are. An alert with no possible action should be deleted. Alerts also need hysteresis so they do not flap. A condition must hold for several minutes before firing, using Prometheus's `for: 5m` clause, and must clear for a while before resolving.

**Alert fatigue** is the failure that undoes all this. When engineers are paged several times a night for things that turn out fine, they start ignoring pages, and the real one is missed. Wren tracks pages per on-call shift and treats any alert that fired without needing action as a bug to fix, by raising its threshold, making it a ticket or deleting it. The aim is a small number of pages, each of which matters. Alerting also needs a watchdog. Wren's alerting system sends a "dead man's switch" alert that always fires, and an external service pages if it stops arriving, since a broken monitoring stack otherwise looks exactly like a quiet night.

:::story Picture this
A smoke alarm and a building engineer's checklist. The alarm sounds only when there is smoke, whatever started it, and everyone acts. The checklist notes that a wire is warm or a filter is dusty, and someone fixes those in the morning. A building where every warm wire set off the fire alarm would soon have people ignoring the fire alarm.
:::

:::note The four signals in one query
For a Prometheus-instrumented service, traffic is `sum(rate(http_requests_total[5m]))`, errors is the same with `status=~"5.."` divided by traffic, latency is `histogram_quantile` over the duration buckets, and saturation is whichever resource is fullest, often pool waiters or CPU throttling. Four queries make the top row of every service dashboard.
:::

:::warn Watch out
Alerting on every cause, CPU, memory, a single failed instance, produces pages that need no action and trains people to ignore pages. Page on user-facing symptoms and a few certain precursors, send the rest to tickets, and attach a runbook to every alert.
:::

:::interview Interview lens
**"What would you alert on for a web service?"** Page on symptoms users feel, error rate and latency against the SLO using burn-rate alerts, plus a few certain precursors such as certificate expiry and growing queue lag. Send causes like high CPU or a lost instance to tickets and dashboards. Make every alert actionable with a runbook, require conditions to persist before firing, and track pages per shift to remove noisy ones. Build dashboards with RED for services and USE for resources, with deploys marked on every chart.
:::

:::key In one breath
The golden signals are latency, traffic, errors and saturation, RED applies rate, errors and duration to every service, and USE applies utilisation, saturation and errors to every resource, so RED says where and USE says why. Dashboards answer known questions with a consistent layout and deploys marked, while observability means answering new questions from high-cardinality data and moving between metrics, traces and logs in one click. Page on symptoms, not causes, with runbooks, persistence windows and a watchdog, and treat every page that needed no action as a bug.
:::

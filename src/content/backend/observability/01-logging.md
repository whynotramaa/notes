@part I | Logging | We make Wren's logs into records a machine can search, so that a support ticket quoting a request id leads straight to what happened. A log line that only a human can read stops being useful at the first thousand requests a second. We will cover structured logs and levels, request and correlation ids, centralized logging with sampling and retention, and keeping personal data and secrets out of logs. | where:1

## 1. Structured logs and log levels

A support agent forwards a complaint. User 42 says their order failed at about ten past eight last night. The first version of Wren's payments service logged lines like `ERROR payment failed for user 42: card declined`. Searching for that across four instances means a text search through millions of lines, guessing which wording each developer used, and hoping the user id was included. Free text was written for a person reading one terminal. It does not scale to a fleet.

A **structured log** is a record with named fields, usually one JSON object per line. The same event becomes `{"ts":"2026-10-05T20:10:42.118Z","level":"error","service":"payments","request_id":"req_7Hq2","user_id":42,"order_id":124,"event":"payment_failed","reason":"card_declined","provider_status":402,"duration_ms":311}`. Now a query such as `service=payments AND event=payment_failed AND user_id=42` finds it in milliseconds, a dashboard can count failures by `reason`, and an alert can fire when `provider_status=500` passes a threshold. The rule is to log events with stable names and put the variable parts in fields, never inside the message text.

@fig be_obs_structured | The same failure as free text and as fields. Only the second can be filtered, counted and joined.

**Log levels** say how much attention a line deserves. The usual scale is `DEBUG` for detail only useful while developing, `INFO` for normal significant events such as "order created", `WARN` for something unexpected that the service handled, such as a retry that succeeded, `ERROR` for a failed operation that someone may need to look at, and `FATAL` for a failure that stops the process. Production runs at `INFO`, and the level can be raised for one service or one request at runtime when debugging, without a deploy.

Levels go wrong in two predictable ways. If every handled 404 is logged as `ERROR`, the error count becomes noise and nobody reads it. If a real failure is logged at `INFO`, nothing alerts. Wren's convention is that `ERROR` means "this request failed because of us", so a 4xx from a client mistake is `INFO` with the status in a field, and a 5xx is `ERROR` with the exception and stack trace attached as fields. Each log line also carries the service, version, instance and environment, added automatically by the logging library, so a line can always be traced to the exact build that wrote it. Libraries such as `structlog` in Python, `zap` and `slog` in Go, and `pino` in Node.js write JSON by default and make it cheap.

## 2. Request ids, correlation and context

A single click by user 42 produces log lines in the gateway, the order service, the payments service, a Kafka consumer and an email worker. Each line is structured, but without a shared key they are five unrelated records. A **request id** is that key. Wren's gateway generates one for every incoming request, `req_7Hq2`, unless a trusted upstream already set one, puts it in an `X-Request-Id` header on every call it makes, returns it to the client in the response, and writes it into every log line. Unit V showed it in error bodies, so a customer can quote it to support.

@fig be_obs_request_id | One id generated at the edge appears in every service's logs, and in the response the user sees.

A **correlation id** is the same idea stretched across asynchronous work. When the order service publishes `order-created`, the event carries the request id in its headers, Unit VIII, and the consumer logs it, so the email sent two seconds later still connects to the click that caused it. When a batch job processes many orders, each item gets its own id with a field pointing back to the job. The names vary between teams. What matters is that any line can be joined to its cause. Part IV replaces the hand-rolled request id with a **trace id** from distributed tracing, which carries the same information plus the shape of the call tree, and most teams log both.

Passing ids by hand through every function call does not survive a large codebase. **Contextual logging** stores the request's fields once, at the start of the request, in context that the logging library reads automatically. In Python that is a `contextvars` variable, in Node.js `AsyncLocalStorage`, in Go a `context.Context` passed down the call chain, and in Java the MDC, the mapped diagnostic context. The middleware that authenticates the request binds `request_id`, `user_id`, `tenant_id` and the route, and every later log call includes them without the developer writing them. A background worker binds the job id and the correlation id from the message in the same way.

The payoff shows in the support ticket. The agent pastes `req_7Hq2` into the log search and gets eleven lines from four services in time order, ending with the payment provider's 402 and the reason `card_declined`. That took one query, and no one had to guess which instance handled the request or what words the developer had chosen.

## 3. Centralized logging, sampling and retention

Logs written to a file on an instance disappear when the instance is replaced, and Kubernetes replaces pods all the time, Unit XV. So production logs are shipped off the machine. The twelve-factor convention is for the application to write to standard output and let the platform collect it. A collector such as Fluent Bit, Vector or the OpenTelemetry Collector runs on each node, reads every container's output, adds metadata such as the pod and node names, and sends batches to a central store, **centralized logging**. The store is often Elasticsearch or OpenSearch, Grafana Loki, or a hosted service such as Datadog or CloudWatch Logs.

Volume decides cost. Wren handles 43,200,000 requests a day, and each request writes about 5 lines of 400 bytes, 2,000 bytes per request. That is 86.4 GB of logs a day, and 2.592 TB over a 30-day retention period, before indexing overhead, which can double it in full-text stores. Hosted logging is usually priced per gigabyte ingested, so every line has a price.

@fig be_obs_log_pipeline | Containers write to stdout, a node agent ships, a central store indexes. 86.4 GB a day at 2,000 bytes per request.

**Sampling** reduces volume where detail is repetitive. Wren keeps every `WARN` and `ERROR`, every line from requests slower than 1 second, and every line for requests marked as debug, but keeps only 10% of `INFO` lines from successful fast requests, chosen by hashing the request id so that all lines of a sampled request are kept together. That cuts volume by roughly 80% without losing the requests anyone investigates. Counting should never depend on sampled logs, which is the job of metrics, Part II.

**Retention** is a policy, not a default. Hot, searchable storage is expensive, so Wren keeps 14 days hot for debugging, moves logs to cheap object storage for a year for audits, and keeps security audit events, logins, permission changes and admin actions, for longer in a separate append-only store that application credentials cannot delete. Legal requirements cut the other way. Personal data in logs is subject to privacy law, such as the GDPR in Europe, so logs must not keep it longer than needed, which the next section addresses.

## 4. Redaction, personal data and secrets

Logs are copied more widely than any database. They go to a vendor, to engineers' laptops during an incident, into tickets and chat. That makes them one of the most common places for secrets and personal data to leak. In 2018, both Twitter and GitHub disclosed that bugs had written some users' plaintext passwords to internal logs, and both asked users to change their passwords. Neither system was breached from outside. The passwords had simply been logged.

Wren classifies what may appear in logs. Identifiers, such as user id 42 and order id 124, are fine and necessary. **Personal data**, information about an identifiable person such as names, emails, phone numbers, addresses and IP addresses, is kept out or reduced, for example logging only the email's domain or a hash. **Secrets**, passwords, tokens, API keys, session cookies, card numbers and authorization headers, never appear at all. Card numbers are a compliance matter as well, since the PCI DSS standard forbids storing full card numbers outside tightly controlled systems, and a log file counts as storage.

@fig be_obs_redaction | The redaction filter replaces secret fields and masks personal data before a line leaves the process.

Prevention works at several layers. The first is not logging whole objects. Code that logs `request.headers` or `user` will one day log an `Authorization` header or a new `password_reset_token` field someone adds next year. Wren logs chosen fields only. The second is a **redaction** filter in the logging library that replaces values of known sensitive keys, `password`, `token`, `authorization`, `cookie`, `secret`, `card_number`, with `[REDACTED]` before the line is written, as a safety net. The third is pattern scanning in the pipeline that detects things shaped like secrets, such as Wren's API keys, which start with a recognisable `wren_live_` prefix, card numbers that pass the Luhn checksum, and JWTs, which start with `eyJ`, and masks them and raises an alert, because a match means a code path is leaking.

Access controls finish the job. Log access is granted by role, production logs are not copied to laptops, and searches are themselves logged. When a secret does appear in logs, the response is to rotate the secret, not to delete the lines, because the lines may already have been copied to places nobody can reach.

:::story Picture this
A hospital's visitor book. A useful one has columns, time in, time out, ward and badge number, so the security desk can answer "who was on ward 6 between eight and nine" in a minute. A useless one is a page of handwritten notes. A dangerous one asks visitors to write their door code next to their name, so anyone who reads the book can open every door.
:::

:::note Audit logs are different
Application logs help engineers debug and can be sampled and expired. Audit logs record who did what to which data, for security and compliance, and must be complete, tamper-resistant and kept for a defined period. Wren writes audit events to a separate store with its own retention and never samples them.
:::

:::warn Watch out
Logging inside a hot loop, or logging a large payload on every request, can make logging the main cost of a service and slow it down, since writing and serializing JSON takes CPU. Log one line per significant event with chosen fields, and put measurements in metrics.
:::

:::interview Interview lens
**"How would you design logging for a backend service?"** Structured JSON to standard output, one line per significant event with a stable event name and fields, consistent levels where ERROR means our failure. A request id generated at the edge and carried through every service and message, bound once into logging context. A node agent ships logs to a central store, with sampling of routine success lines and full retention of errors, hot storage for two weeks and archive beyond. Never log secrets, minimise personal data, redact known keys and scan for secret patterns.
:::

:::key In one breath
Structured logs are JSON records with stable event names and fields, so they can be searched, counted and alerted on, with levels where ERROR means a request failed because of us. A request id from the edge, carried through headers and Kafka events and bound into logging context, joins every line of one action across services. At 2,000 bytes per request, 43.2 million requests make 86.4 GB a day, so sample routine INFO lines, keep errors, and set retention by purpose. Keep secrets out entirely and personal data to a minimum, with redaction and pattern scanning as safety nets.
:::

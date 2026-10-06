@part VIII | Error handling | We design an error model that tells clients exactly what went wrong and whether to retry, without revealing internals. Most production debugging starts from an error message, and most information leaks start from one too. We will cover error categories, structured error responses, propagation with global middleware, and the line between internal and external errors. | where:8

## 28. Error categories

When Wren fails a request, the failure belongs to one of a handful of categories, and each category deserves different treatment. **Validation errors** mean the client sent bad input, so the response is 422 with a list of fields. **Authentication and authorization errors** are 401 and 403. **Conflict errors** mean the request clashes with current state, 409, and the client should re-read and decide. **Dependency failures** mean something Wren relies on, the database, Redis or the payment provider, is down or misbehaving, 502 or 503, often retryable. **Timeouts** are 504, retryable only if the operation is idempotent.

These are all **operational errors**, expected failures that a correct program will meet in normal life and must handle. **Programmer errors** are different. A null dereference, a type error, a failed assertion or a missing column are bugs in Wren's code. The right response to a programmer error is not to handle it gracefully in place. It is to fail the request with 500, alert someone, and fix the code. Node.js documentation popularised the distinction, and it applies everywhere. Code that catches every exception and returns a polite 400 hides bugs for months.

@fig be_err_categories | Seven categories. The last one is a bug and must page someone, not be politely handled.

Classifying errors correctly matters downstream. Retry logic in clients and gateways reads the category to decide whether to retry. Dashboards that separate 4xx from 5xx tell you whether clients or the server are at fault. An SLO from Unit XIV usually counts 5xx as failures and 4xx as successes, so a validation error mislabelled as 500 burns error budget, and a crash mislabelled as 400 hides a real outage.

## 29. Structured error responses and error codes

A client receiving an error needs four things. It needs a status code for generic handling. It needs a stable, machine-readable **error code**, such as `ORDER_ALREADY_PAID`, that its code can branch on, since English messages change and get translated. It needs a human-readable message it can show or log. And it needs a **request id** to quote to support. Wren's error body follows **Problem Details** (RFC 9457, 2023, replacing RFC 7807), served as `application/problem+json`, with `type` (a URL naming the problem), `title`, `status` and `detail`, extended with `code`, `request_id`, `retryable` and, for validation, an `errors` array listing each field and what was wrong with it.

@fig be_err_problem | A structured error. The code is for programs, the title for people, the request id for support.

Error codes are part of the contract from Part VI. Once a client writes `if err.code == "COUPON_EXPIRED"`, renaming the code is a breaking change. Keep a catalogue of codes in the API documentation, use one format for every endpoint, and avoid codes that leak internals, such as `POSTGRES_UNIQUE_VIOLATION_ORDERS_PKEY`. The request id ties everything together. It is generated at the edge, returned in an `X-Request-Id` header and in the body, and written in every log line for that request, so a support ticket quoting `req_7Hq2` leads straight to the logs in Unit XIV.

## 30. Global error middleware, propagation, wrapping and causes

An error usually starts deep in the stack and must travel up to the HTTP layer. Suppose the database connection resets while the repository loads order 123 during a payment. The driver raises `ConnectionResetError`. The repository catches it only to add context and re-raises `OrderLoadError("load order 123")` with the original as its **cause**. The service adds its own context, `PaymentFailed("pay order 123")`, again keeping the cause. Each layer says what it was trying to do in its own terms, and nobody loses the original error. Python's `raise ... from e`, Java's exception causes and Go's `fmt.Errorf("...: %w", err)` all support this chain.

@fig be_err_propagation | Each layer wraps the error with its own context and keeps the cause.

At the top, one **global error handler** in the middleware turns exceptions into responses. A `ValidationError` becomes 422 with field details. `NotFound` becomes 404, `Conflict` becomes 409, `DependencyDown` becomes 503 with Retry-After, and anything unrecognised becomes 500 with a generic body, an alert and the full chain logged. Having one place for this mapping means handlers simply raise domain errors and never build error responses by hand, every endpoint returns errors in the same format, and an unexpected exception can never escape as an HTML stack trace.

@fig be_err_middleware | One handler maps error types to responses. Unknown errors become a generic 500 and an alert.

Two rules keep the chain useful. First, catch errors only where you can do something about them, retry, fall back, add context or translate. A `try` block that catches everything and logs "error" destroys the chain. Second, log an error once, at the boundary where it is handled, with the request id and full cause chain. Logging it at every layer on the way up produces five copies of every failure and makes incidents harder to read.

## 31. Internal versus external errors, information leakage and retryability

The response a client sees is not the same as the information an engineer needs. An unhandled exception in a careless framework returns a stack trace naming files, line numbers, library versions, table and column names, sometimes the SQL query, and sometimes internal host addresses. Each detail helps an attacker: library versions point to known vulnerabilities, column names help craft SQL injection, and hosts map the network. Some frameworks show full debug pages with environment variables, including secrets, when a debug flag is left on in production.

@fig be_err_leak | The stack trace goes to the logs under the request id. The client gets a code and the id.

The rule is that external errors carry only what the client can act on: the status, a stable code, a safe message and the request id. Internal errors carry everything, in logs and traces, linked by the request id. Messages from lower layers must not be passed through to clients verbatim, because a database error message can contain data from other rows. Error responses also leak through differences, as Unit IV noted, such as "wrong password" versus "no such user", or a 403 versus a 404.

Finally, tell clients whether retrying can help. Rate limits with Retry-After, 503 overload and connection resets are worth retrying with backoff. Retrying a 502 or 504 is safe only for idempotent operations. Validation errors, permission errors, not-found and conflicts will fail the same way again until something changes. Wren includes a `retryable` boolean in every error body, so client libraries do not have to guess from status codes.

@fig be_err_retryable | Retryable and permanent failures, split. A boolean in the body saves every client from guessing.

:::story Picture this
A hospital that tells a patient's family "the operation was delayed, your reference is 7H-Q2, the surgeon will call you" and keeps the full clinical notes in the patient's file. It would never hand the family the raw notes, the staff rota and the drug cabinet code. The reference number lets the right staff find everything quickly.
:::

:::warn Watch out
Debug modes left on in production are a common source of leaks, as with Django's `DEBUG = True` or Laravel's `APP_DEBUG=true`, which render full stack traces and settings to anyone who triggers an error. Make the production configuration fail to start if debug mode is enabled.
:::

:::interview Interview lens
**"How would you design error handling for a REST API?"** Classify errors into validation, authentication, authorization, not found, conflict, dependency failure, timeout and programmer errors, each with a fixed status code. Return a structured Problem Details body with a stable error code, a safe message, a request id and a retryable flag, the same on every endpoint. Raise domain errors in services, wrap them with context while keeping causes, and map them to responses in one global handler that turns anything unknown into a generic 500 and an alert. Log the full chain once with the request id, and never send stack traces or internal messages to clients.
:::

:::key In one breath
Operational errors such as validation failures, permission denials, conflicts, dependency failures and timeouts are expected and get specific status codes, while programmer errors are bugs that get a 500 and an alert. Error bodies follow Problem Details with a stable code, a safe message, a request id and a retryable flag, and codes are part of the contract. Errors are wrapped with context and causes as they travel up, and one global handler maps them to responses, logging the chain once. Clients see only what they can act on, and everything else stays in logs under the request id.
:::

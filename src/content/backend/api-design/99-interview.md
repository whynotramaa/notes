@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### REST resources

**Q1. What makes an API RESTful in practice?**

Resources named by URLs, HTTP methods as the verbs, standard status codes, stateless requests and representations chosen by content negotiation. Fielding's full definition also requires hypermedia links, which most APIs skip. The practical goal is predictability.

**Q2. How do you model an action like "cancel order" in REST?**

As a sub-resource, such as POST /orders/123/cancellation, or as a state change with PATCH on a status field. The sub-resource can carry a reason and its own id. Avoid verbs in paths like /cancelOrder.

**Q3. How deep should resources be nested?**

Usually one level, for ownership, such as /users/42/orders. Deeper nesting couples URLs to the data model. Give items with their own identity top-level URLs.

**Q4. What does statelessness mean for a REST API?**

Each request carries all the information needed to process it, and the server keeps no per-client session state in its own memory between requests. State lives in shared stores. Any instance can then serve any request.

**Q5. How do you design filtering and sorting?**

Query parameters on the collection, such as ?status=paid&sort=-created_at, with field names on an allowlist matched to available indexes. Unknown fields return 422. Lists are always paginated with a default and maximum size.

### Pagination

**Q6. Why does OFFSET pagination get slow?**

The database must read and discard every skipped row, so page n costs work proportional to n. LIMIT 20 OFFSET 100000 reads 100,020 rows to return 20. Counting totals has the same cost.

**Q7. What goes wrong with offset pagination when data changes?**

Inserting a row before the current position shifts the list, so the next page repeats a row. Deleting one causes a skip. Sync jobs then miss or duplicate records.

**Q8. What is cursor pagination?**

The server returns an opaque cursor encoding where the page ended, and the client passes it back for the next page. It gives stable, efficient paging. It cannot jump to arbitrary pages or give cheap totals.

**Q9. How does keyset pagination work?**

It filters on the last row's sort key, such as WHERE (created_at, id) < (?, ?), ordered by the same columns, with an index on both. Each page is an index seek of constant cost. Inserts do not shift positions.

**Q10. Why does keyset pagination need a tiebreaker?**

Without a unique column in the sort, several rows can share the same key, and the page boundary becomes ambiguous, causing skips or repeats. Adding the id makes every position unique. The cursor and index must include it.

### Bulk, partial updates and versioning

**Q11. How should a bulk endpoint report failures?**

Either run all-or-nothing in one transaction and fail with the offending item named, or process items independently and return a result per item. Document which. Limit the batch size.

**Q12. Explain JSON Merge Patch semantics.**

Present fields are replaced, fields set to null are deleted, and absent fields are unchanged. It cannot set a field to a literal null or append to arrays. JSON Patch handles those with explicit operations.

**Q13. URL versioning or header versioning?**

URL versions are visible, cacheable and easy to route, which is why they are common. Header or dated versions, as Stripe uses, keep URLs stable and allow many small versions with server-side translation. Either works if applied consistently.

**Q14. Which changes are backward compatible?**

Adding endpoints, optional request fields and response fields, assuming clients ignore unknown fields. Adding enum values only if clients tolerate unknown values. Removing, renaming, retyping, requiring or tightening are breaking.

**Q15. How do you deprecate an API version?**

Ship the replacement, announce a timeline, send Deprecation and Sunset headers, measure remaining traffic per client, contact heavy users, optionally run brownouts, and only then shut it off. Expect long tails from mobile apps.

### Idempotency keys

**Q16. How does the server implement idempotency keys?**

Store (user, key, request fingerprint, status, response) under a unique constraint, inserted as running before the work. Commit the response with the business effect in one transaction. Return the stored response for repeats.

**Q17. Why store a request fingerprint?**

To detect the same key reused with a different request, which is a client bug. Returning the old response would be wrong. Return 422 instead.

**Q18. How do you handle two concurrent requests with the same key?**

Let the unique insert decide. One wins and proceeds, and the other gets a constraint violation and returns 409 or waits. A lease time lets a crashed attempt be taken over.

**Q19. How long should keys live?**

Longer than any client's retry window, often 24 hours. At 50 per second that is 4,320,000 rows a day. Expire them cheaply, for example by dropping daily partitions.

### RPC, GraphQL and gRPC

**Q20. Compare RPC and REST.**

RPC exposes named operations, which suits verb-like actions and internal calls. REST exposes resources with standard methods, which suits caching, generic tooling and public APIs. Most APIs mix both.

**Q21. What is GraphQL and why would you use it?**

A query language and runtime where clients request exactly the fields they need from a typed schema through one endpoint. It suits apps with many screens needing different data shapes. It reduces round trips and over-fetching.

**Q22. What is the N+1 problem in GraphQL?**

Resolvers for child fields run once per parent, so a list of N items issues N extra queries per relation. 20 orders with restaurants and items can become 121 queries. DataLoader batches them into a few.

**Q23. How does DataLoader work?**

Resolvers request keys from a loader, which collects all keys asked for in one event-loop tick, deduplicates them, issues one batched query and distributes results. It also caches per request. Loaders must be per request.

**Q24. How do you protect a GraphQL API from expensive queries?**

Compute query cost from list sizes and nesting before execution, reject over budget, limit depth, rate-limit by cost, and for first-party clients use persisted queries so only known queries run.

**Q25. Why is caching harder in GraphQL?**

Queries go to one URL, usually by POST, so HTTP caches and CDNs cannot key on them. Persisted queries over GET restore some caching. Clients cache normalised objects instead.

**Q26. Where does authorization go in GraphQL?**

In resolvers or the shared data-loading layer, per object, because the same object can be reached through many query paths. A check on only one path leaks through the others.

**Q27. What is gRPC?**

An RPC framework from Google using Protocol Buffers for schemas and binary encoding, running over HTTP/2. It generates typed clients and servers, supports four streaming modes, and carries deadlines and metadata. It is common between services.

**Q28. Why are Protocol Buffers compact?**

Fields are identified by small numbers rather than names, and integers use varints of 7 bits per byte. id = 123 takes 2 bytes against 10 in JSON. The schema is needed to decode.

**Q29. What is deadline propagation?**

Each call carries the absolute time by which the original caller needs an answer, and each hop passes on what remains. A service with too little time left refuses immediately. It stops wasted work after the user has given up.

**Q30. How do you evolve a protobuf schema safely?**

Add fields with new numbers, never reuse or retype numbers, and reserve removed ones. Old readers skip unknown fields and new readers get defaults. Check with a breaking-change tool in CI.

**Q31. When would you pick REST, GraphQL or gRPC?**

REST for public APIs and cache-friendly resources, GraphQL for aggregating varied data for product clients, gRPC for internal high-throughput, strongly typed service calls with streaming. Many companies use all three in different layers.

### API contracts

**Q32. What is OpenAPI?**

A machine-readable description of an HTTP API, its paths, parameters, bodies, responses and auth, using JSON Schema for data shapes. It generates documentation, clients, validators and mocks. Swagger was its original name.

**Q33. Schema-first or code-first?**

Schema-first makes API changes reviewable as contract diffs and generates code from them. Code-first is faster to start but documents whatever the code does. Schema-first scales better for shared APIs.

**Q34. What is consumer-driven contract testing?**

Consumers publish the interactions they rely on, and the provider's CI verifies each one against the real service. It catches breaking changes that matter before deployment. Pact is the common tool.

### Application architecture

**Q35. What does each layer do: router, middleware, controller, service, repository?**

The router maps requests to handlers, middleware handles cross-cutting concerns, the controller translates HTTP to DTOs and responses, the service holds business rules, and the repository encapsulates data access. Each changes for one reason.

**Q36. Why separate DTOs from domain models?**

So the public API and the internal model can change independently, and internal fields never leak into responses. Incoming DTOs also block mass assignment. The mapping code is the price.

**Q37. What is dependency injection and why use it?**

Components receive their collaborators instead of constructing them. Production and tests can wire different implementations without changing the component. It makes dependencies explicit.

**Q38. What is a modular monolith?**

One deployable application divided into modules with enforced boundaries, each owning its data and exposing a small public interface. It keeps deployment simple while preparing for later extraction. Tools can fail builds on boundary violations.

**Q39. Explain hexagonal architecture.**

The domain core defines ports, interfaces for what it needs and offers, and adapters implement them for HTTP, databases and external services. Dependencies point inward. The core can be tested without infrastructure.

**Q40. When is clean architecture overkill?**

For thin CRUD services where layers and mappers add code without protecting anything that changes independently. Add boundaries where a second implementation, a test fake or a fast-changing rule justifies them.

### Error handling

**Q41. What is the difference between operational errors and programmer errors?**

Operational errors are expected failures such as bad input, missing permissions, conflicts and dependency outages, which code must handle. Programmer errors are bugs, which should fail fast with a 500 and an alert. Mixing them hides bugs.

**Q42. What should an error response contain?**

A status code, a stable machine-readable error code, a safe human message, a request id and whether retrying can help, with field errors for validation. Problem Details (RFC 9457) is the standard format.

**Q43. How should errors propagate through layers?**

Each layer catches only what it can handle or enrich, wraps errors with context while keeping the cause, and re-raises. One global handler maps errors to responses and logs the chain once.

**Q44. How do error messages leak information?**

Stack traces, SQL, library versions, internal hosts and database error text help attackers, and different messages for similar cases reveal which accounts or objects exist. Clients get codes and request ids, logs get the detail.

### Testing

**Q45. Explain the test pyramid.**

Many fast unit tests, fewer integration and API tests, and a handful of end-to-end tests. Each level catches bugs the others miss, and the shape keeps the suite fast. For data-heavy services, integration tests carry more weight.

**Q46. Mock, stub or fake?**

A stub returns canned answers, a mock also asserts how it was called, and a fake is a working lightweight implementation. Prefer fakes for third parties and real databases for your own SQL. Heavy mocking couples tests to implementation.

**Q47. How do you isolate database tests?**

Run a real database in a container, create only the data each test needs, and wrap each test in a rolled-back transaction or truncate tables. Rollback fails for code that commits itself or uses multiple connections.

**Q48. Why do flaky tests matter so much?**

Failures compound: 300 tests at 1% flakiness pass together only 4.9% of the time. Engineers stop trusting red builds and real failures slip through. Common causes are time, randomness, shared state, sleeps and networks.

**Q49. What are load and chaos tests for?**

Load tests check latency and errors at target traffic and beyond, and soak tests find slow leaks. Chaos tests inject real failures such as node or dependency loss to verify designed degradation.

### Code quality and the full request

**Q50. What is dependency inversion?**

High-level policy owns the interfaces it needs, and low-level details implement them. The order service depends on a PaymentGateway interface, not on Stripe. Swapping providers changes one adapter.

**Q51. Why keep business logic in pure functions?**

Pure functions depend only on inputs, so they are trivial to test and reason about. Effects such as database writes and emails happen at the edges. This is the functional core, imperative shell pattern.

**Q52. When does an abstraction pay for itself?**

When it has more than one real implementation, is faked in tests, or protects a part that changes for different reasons. Otherwise it is cost. Extract on the second use rather than the first.

**Q53. Walk me through POST /orders in a well-structured service.**

Middleware assigns an id, enforces limits, authenticates and resolves the tenant. The controller validates the DTO and checks the idempotency key. The service checks rules, prices with a pure function and in one transaction inserts the order, the idempotency record and an outbox event. Errors map to codes, and success returns 201 with Location.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### REST and pagination

**E1** ● With 5,000,000 orders and pages of 20, how many rows does offset pagination read for page 5,001 and for the last page?

**E2** ● At an illustrative 1 µs per row read, how long does each of those pages take?

**E3** ● A crawler reads all 250,000 pages with offset pagination. How many rows does the database read in total, compared with keyset pagination?

**E4** ●● Design the URLs and methods for listing a user's orders, cancelling an order, refunding part of an order and downloading a receipt PDF.

**E5** ●● Trace a duplicate row appearing with offset pagination when one order is inserted between page 1 and page 2, with a page size of 3.

**E6** ●● Write the keyset query for the next page of orders sorted oldest first by created_at with an id tiebreaker, and say which index it needs.

**E7** ●● Classify each as compatible or breaking: adding `eta_minutes` to responses; renaming `total` to `total_paise`; adding a required `currency` request field; adding enum value `refunded_partially`; changing `id` from integer to string.

### Idempotency, GraphQL and gRPC

**E8** ● How many idempotency rows and bytes does Wren hold with 72-hour retention at 50 payments per second and 300 bytes per row?

**E9** ● A GraphQL query lists 50 orders and, per order, loads its restaurant and its items with one query each. How many queries run with naive resolvers, and with DataLoader?

**E10** ● What is the cost of `orders(first: 100) { items(first: 10) { options(first: 5) } }` if each node costs 1?

**E11** ● Give the protobuf varint bytes for 150, 1 and 16,384.

**E12** ● A gateway has a 400 ms deadline and spends 30 ms. Orders spends 120 ms, then calls payments, which needs at least 300 ms. What happens?

**E13** ●● Two copies of the same POST with one idempotency key arrive 5 ms apart. Trace both through Wren's design.

**E14** ●● Explain to a product manager, without jargon, why the GraphQL home screen made 121 database queries and how batching fixes it.

**E15** ●● Choose REST, GraphQL or gRPC for: a partner order-import API; the orders-to-payments call at 800 per second; the mobile home screen. Justify each.

### Architecture, errors and tests

**E16** ●● Map each to status, error code and retryable flag: item out of stock; database connection refused; null pointer in pricing; expired token; coupon belongs to another user; payment provider timeout.

**E17** ●● Explain without jargon why returning a stack trace to the client is dangerous.

**E18** ●● A controller computes discounts and builds SQL strings, and a service imports the request object. Name each violation and where the code should move.

**E19** ● With 500 tests each flaking 0.2% of the time, what fraction of runs pass?

**E20** ● A suite has 2,000 unit tests at 3 ms, 300 integration tests at 150 ms and 30 end-to-end tests at 12 s. How long does it take serially?

**E21** ●● Name the likely cause of each flaky test and the fix: fails only around midnight; fails when run after another test; fails on busy CI machines; fails one day in a hundred with no pattern.

### Proofs, code and design

**E22** ●●● Prove that keyset pagination over a strict total order never repeats or skips a row that exists throughout the paging, even if other rows are inserted or deleted.

**E23** ●●● Derive the total rows read when walking all $N$ pages of size $s$ with offset pagination, and show it grows quadratically.

**E24** ●●● Write Python functions to encode and decode a signed keyset cursor and build the next-page SQL.

**E25** ●●● Write a global error handler for a Python web app that maps domain exceptions to Problem Details responses and logs unknown errors once with the request id.

**E26** ●●● Design Wren's public order API end to end: resources, pagination, idempotency, versioning, error format, contract and the code layers behind it.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** Page 5,001 has offset (5,001 − 1) × 20 = 100,000, so it reads 100,000 + 20 = 100,020 rows. The last page, 250,000, has offset 4,999,980 and reads 5,000,000 rows.

**E2.** 100,020 µs ≈ 0.1 s for page 5,001, and 5,000,000 µs = 5 s for the last page.

**E3.** Page k (counting from 0) reads 20k + 20 rows. Summing for k = 0 to 249,999 gives 20 × (250,000 × 250,001 / 2) = 625,002,500,000 rows. Keyset reads each row once, 5,000,000 rows, about 125,000 times less.

**E4.** `GET /users/42/orders?cursor=...` or `GET /orders?user=me` lists orders. `POST /orders/{id}/cancellation` cancels, returning 201 with the cancellation or 409 if too late. `POST /orders/{id}/refunds` with `{"amount_paise": ...}` and an Idempotency-Key creates a partial refund. `GET /orders/{id}/receipt` with `Accept: application/pdf` returns the PDF.

**E5.** Page 1 at offset 0 returns o50, o49, o48. Order o51 is inserted at the top. Page 2 at offset 3 now starts at the fourth row, which is o48, so it returns o48, o47, o46, and o48 appears twice.

**E6.** `SELECT * FROM orders WHERE (created_at, id) > (%s, %s) ORDER BY created_at ASC, id ASC LIMIT 20`, using the last row's values, with an index on `(created_at, id)`.

**E7.** Adding `eta_minutes` is compatible. Renaming `total` is breaking. A new required request field is breaking. A new enum value is compatible only if clients were required to tolerate unknown values, otherwise breaking. Changing the id type is breaking.

**E8.** 50 × 86,400 × 3 = 12,960,000 rows, and 12,960,000 × 300 = 3,888,000,000 bytes, about 3.9 GB.

**E9.** Naive: 1 + 50 + 50 = 101 queries. With DataLoader: 1 for orders, 1 batched for restaurants, 1 batched for items, 3 in total.

**E10.** 100 orders + 100 × 10 = 1,000 items + 1,000 × 5 = 5,000 options, 6,100 in total.

**E11.** 150 is `96 01`, 1 is `01`, and 16,384 is `80 80 01`.

**E12.** The gateway passes 370 ms to orders. Orders spends 120 ms, leaving 250 ms. Payments needs 300 ms, so it refuses immediately with DEADLINE_EXCEEDED instead of starting work that cannot finish in time, and the error propagates up as a 504.

**E13.** Copy A inserts (user 42, key, fingerprint, running, lease 60 s) and succeeds. Copy B, 5 ms later, tries the same insert and hits the unique constraint. It reads the row, sees status running with a matching fingerprint, and returns 409 "in progress". A completes the payment and stores 201 and the body in the same transaction. When the client retries B a moment later, it receives the stored 201.

**E14.** The home screen asked for 20 orders, and for each order the app server went back to the database separately to fetch the restaurant and then again for the items, like a shop assistant walking to the stockroom once per item on your list. That is 1 + 20 + 100 trips. Batching collects every request from that moment and makes one trip for all the restaurants and one for all the items, three trips in total.

**E15.** The partner import API should be REST, since partners need simple HTTP, documentation, curl-friendly debugging and stable versions. The orders-to-payments call should be gRPC, internal, high-volume, typed, with deadlines. The mobile home screen fits GraphQL, or a dedicated REST aggregation endpoint, since it needs several related objects in one round trip.

**E16.** Out of stock is 409 `ITEM_UNAVAILABLE`, not retryable. Database connection refused is 503 `SERVICE_UNAVAILABLE`, retryable with Retry-After. The null pointer is 500 `INTERNAL`, not retryable, with an alert. The expired token is 401 `TOKEN_EXPIRED`, retryable after refresh. Another user's coupon is 422 `COUPON_INVALID` or 403, not retryable. The provider timeout is 504 `PAYMENT_TIMEOUT`, retryable only with the same idempotency key.

**E17.** A stack trace is a map of the inside of the system: which files, which libraries and versions, which database tables and columns, sometimes which servers. Each detail tells an attacker where to look for known weaknesses. The user cannot do anything with it anyway. A short code and a reference number help the user and support, while the map stays in the logs.

**E18.** Discount computation in the controller is business logic in the HTTP layer, so it moves to the service, ideally into a pure pricing function. SQL in the controller is data access outside the repository, so it moves to a repository method with parameterized queries. The service importing the request object couples business logic to HTTP, so the controller should pass a DTO or plain values instead.

**E19.** 0.998^500 ≈ 0.3675, so about 36.8% of runs pass.

**E20.** 2,000 × 0.003 = 6 s, 300 × 0.15 = 45 s and 30 × 12 = 360 s, 411 s in total, almost 7 minutes, dominated by end-to-end tests.

**E21.** Failing around midnight points to real time or date boundaries, so inject a fixed clock. Failing after another test points to shared state, so give each test its own data and roll back. Failing on busy machines points to fixed sleeps or tight timeouts, so wait for conditions. Failing at random points to unseeded randomness or a real race, so seed it or fix the race.

**E22.** Let the rows be ordered by a strict total order on (created_at, id). Page i returns the first s rows greater than the cursor $c_i$, and $c_{i+1}$ is the largest key on page i. Take a row r present throughout. Since the order is total, r's key is greater than exactly one range: there is a unique page i with $c_i < r \le c_{i+1}$ if r is returned, and keys returned on page i are all greater than $c_i$, so a row is returned on at most one page because the cursors strictly increase. For skipping: if $c_i < r$ and r was not among the first s rows above $c_i$, then s other rows lie between, so $c_{i+1} < r$, and r is considered again on the next page. Inserts and deletes of other rows do not change r's key or the cursors' meaning, so r is eventually returned exactly once.

**E23.** Page k, from 0, reads $s(k + 1)$ rows. The total over $N$ pages is

$$\sum_{k=0}^{N-1} s(k+1) = s\frac{N(N+1)}{2}.$$

Read it as the page size times the triangular number of pages, which grows with $N^2$. For s = 20 and N = 250,000 it gives 625,002,500,000, against $sN$ = 5,000,000 for keyset.

**E24.** Using HMAC to detect tampering:

```python
import base64, hashlib, hmac, json

def encode_cursor(created_at, oid, key):
    raw = json.dumps({"c": created_at, "i": oid}, separators=(",", ":")).encode()
    sig = hmac.new(key, raw, hashlib.sha256).digest()[:16]
    return base64.urlsafe_b64encode(raw + sig).rstrip(b"=").decode()

def decode_cursor(token, key):
    data = base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))
    raw, sig = data[:-16], data[-16:]
    if not hmac.compare_digest(sig, hmac.new(key, raw, hashlib.sha256).digest()[:16]):
        raise ValueError("bad cursor")
    d = json.loads(raw)
    return d["c"], d["i"]

def next_page_sql(cursor, key, limit=20):
    if cursor is None:
        return "SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT %s", [limit]
    c, i = decode_cursor(cursor, key)
    return ("SELECT * FROM orders WHERE (created_at, id) < (%s, %s) "
            "ORDER BY created_at DESC, id DESC LIMIT %s", [c, i, limit])
```

A tampered cursor fails the signature and should return 400.

**E25.** A framework-neutral handler:

```python
import logging
log = logging.getLogger("errors")

class DomainError(Exception):
    status, code, retryable = 400, "BAD_REQUEST", False

class Conflict(DomainError):
    status, code = 409, "CONFLICT"

class DependencyDown(DomainError):
    status, code, retryable = 503, "SERVICE_UNAVAILABLE", True

def problem(status, code, title, request_id, retryable):
    return status, {"type": f"https://api.wren.example/errors/{code.lower()}", "title": title,
                    "status": status, "code": code, "request_id": request_id, "retryable": retryable}

def handle(exc, request_id):
    if isinstance(exc, DomainError):
        return problem(exc.status, exc.code, str(exc), request_id, exc.retryable)
    log.exception("unhandled error", extra={"request_id": request_id})
    return problem(500, "INTERNAL", "Something went wrong", request_id, False)
```

The response is sent with `Content-Type: application/problem+json`. Only unknown errors are logged with a stack trace here, once, and their message never reaches the client.

**E26.** Resources: `/restaurants`, `/restaurants/{id}/menu`, `/orders`, `/orders/{id}`, `/orders/{id}/cancellation`, `/orders/{id}/refunds`, `/payments`. Lists use keyset pagination with signed opaque cursors, default 20 and maximum 100, allowlisted filters and sorts backed by indexes. Every POST that creates money movement or an order requires Idempotency-Key, stored per user with fingerprints for 24 hours. Versioning is in the URL, `/v2`, with additive changes inside a version and Deprecation and Sunset headers for retirement. Errors use Problem Details with stable codes, request ids and a retryable flag. An OpenAPI 3.1 document, reviewed schema-first with a breaking-change check in CI, generates docs, partner SDKs and request validation. Behind it, controllers handle HTTP and DTOs, services own the rules with injected repositories and a payment gateway port, and a global error handler maps domain errors. Tests include unit tests for pricing, API tests against a containerised PostgreSQL, consumer contracts from the mobile app, and a load test at 2,000 requests per second.

### Primary sources

[Fielding, Architectural Styles and the Design of Network-based Software Architectures, 2000](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm). The original definition of REST.

[RFC 9457, Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457). The standard error body.

[GraphQL specification](https://spec.graphql.org/) and [DataLoader](https://github.com/graphql/dataloader). Schema, execution and batching.

[gRPC documentation](https://grpc.io/docs/) and [Protocol Buffers encoding](https://protobuf.dev/programming-guides/encoding/). Call types, deadlines and varints.

[OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0). The HTTP API contract format.

[Cockburn, Hexagonal Architecture, 2005](https://alistair.cockburn.us/hexagonal-architecture/). Ports and adapters.

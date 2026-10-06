@part X | The full request | We follow `GET /orders/123` from user 42's phone to the database and back, through every layer this series has covered. This is the question that closes most backend interviews, and answering it well means knowing what each hop does and what happens when it fails. We will cover the journey to the edge, through the balancers into the pod, inside the service and back, the side channels and the interruptions, and the whole series on one page. | where:10

## 27. From the phone to the edge

User 42 taps on order 123 in the Wren app. The app builds `GET https://api.wren.example/orders/123` with an `Authorization: Bearer` header holding a 15-minute access token, Unit III, and an `Accept: application/json` header, Unit I. Before a byte can be sent, the phone needs an address. It asks its stub resolver, which asks the configured recursive resolver, which, if its cache has expired, walks from the root to `.example` to Wren's authoritative servers and gets back a CNAME to the CDN and the CDN's anycast address, with a TTL of 300 seconds, Unit I. On a cold start that lookup costs about 25 ms. Usually the phone's own cache answers in microseconds.

With an address, the phone needs a connection. On a cold start, TCP takes one round trip and TLS 1.3 another, with the server's certificate checked against the chain, the SAN, the expiry and the phone's trust store, Unit I. QUIC folds both into one round trip, and a reused HTTP/2 or HTTP/3 connection skips them entirely. Wren's app keeps its connection warm, so this request goes out at once on an existing connection to the nearest CDN edge, which anycast routing chose by network distance.

@fig be_dep_journey_edge | DNS, connection and TLS on a cold start; a warm connection to the nearest edge skips nearly all of it.

The edge is the first of Wren's own layers, run by the CDN. It terminates TLS, checks its web application firewall rules and per-client rate limits, Unit X, and looks at the cache, Unit VII. Order details are private, `Cache-Control: private, no-store`, so the edge does not cache them, and forwards the request to Wren's origin over a long-lived, pre-warmed connection, adding `X-Forwarded-For` with user 42's address and a request id, Unit XI.

Put numbers on the warm path. The edge is 10 ms of round trip from the phone, and the origin is 30 ms of round trip from the edge. The request takes 5 ms to reach the edge and 15 ms more to reach the origin. Wren's servers take 30 ms, section 29. The response retraces the path in 15 + 5 = 20 ms. The total is 5 + 15 + 30 + 15 + 5 = 70 ms, matching Unit I's reused-connection figure. Forty of those milliseconds are distance, which only the edge, caching and connection reuse can reduce.

Three interruptions an interviewer likes here. What if DNS fails? Cached answers last up to the 300-second TTL, then new lookups fail, so resolvers should serve stale answers, Unit XIV. What if the certificate expired? Every client refuses to connect at that second, which is why renewal at day 60 of 90 and expiry alerts exist. What if the edge is down in one city? Anycast withdraws that location's route, and traffic flows to the next nearest edge.

## 28. Through the balancers into the pod

The edge's connection lands on Wren's cloud network load balancer, a layer 4 device that spreads TCP connections across the Nginx ingress pods, passing the original address through the PROXY protocol, Unit XI. Nginx terminates TLS again, trusts the forwarded headers only from the CDN's ranges, recovers 198.51.100.7 as the client address, matches `api.wren.example/orders/*` to the `orders` Service, Part II, and picks one of the ready orders pods from its EndpointSlice using power of two choices over its keep-alive upstream connections. Only pods passing readiness are in that list, Unit XIV, and pods that are draining after `SIGTERM` have already been removed, Part IV.

The orders pod is one of 4 replicas spread over two zones, scheduled onto a node with room for its 500m request, Part III, and started from an image that CI built, scanned and signed, Part I. Its service mesh sidecar receives the connection, checks the caller's mTLS identity against the mesh's authorization policy, and passes the request to the application on `localhost`. Each of these proxies adds well under a millisecond.

@fig be_dep_journey_cluster | The L4 balancer, the ingress, the Service, the sidecar and the application's socket. Each hop terminates, decides and forwards.

Inside the application, the request arrives in the kernel's accept queue for the listening socket, Unit XI, is accepted by the runtime's event loop or a worker thread, Unit IX, and its bytes are parsed by the HTTP server into a method, path, headers and body, with limits on header size and body size enforced before any application code runs, Unit IV. If this pod's concurrency limit is reached, it sheds the request with a 503 and `Retry-After` rather than queueing it behind work it cannot finish in time, Unit X.

Interruptions here. What if a pod crashes mid-request? The connection resets, Nginx retries idempotent GETs on another pod, Unit I, and the Deployment replaces the pod, Part II. What if a deploy is running? Two versions serve at once, both compatible with the same schema, Part VI, and a canary compares their error rates, Part V. What if the client is slow to read the response? Nginx buffers it, so the application's worker is freed, Unit XI.

## 29. Inside the service, and back

Now Wren's own code runs, in the order Unit V laid out. **Middleware** binds the request id and trace context into logging, Unit XIV, and starts a span. **Authentication** verifies the JWT's signature with a cached public key from the JWKS, checks `exp`, `iss` and `aud`, and extracts user 42, in about 0.1 ms, Unit III. **Validation** checks that `123` is a well-formed order id, Unit IV. The **controller** calls the order **service**, which reads through the **cache**: a Redis `GET order:v3:123`, cache-aside, Unit VII. This time it misses, so the service takes a connection from the pool, waits for none since only 1.6 of 40 connections are busy at peak, Unit XIV, and runs two parameterized queries of about 4 ms each, Unit VI, then writes the result to Redis with a TTL.

**Authorization** checks that order 123 belongs to user 42, or that the caller is staff with access to that restaurant's tenant, Unit IV, and returns 404, not 403, if not, so ids cannot be probed. The order needs its payment status, so the service calls `payments` through its sidecar with a 200 ms timeout, a retry budget and a circuit breaker, Unit X, carrying the trace context, and gets an answer in 12 ms. If the order had been placed just now, its `order-created` event would already be on its way through the outbox to Kafka, Unit VIII, feeding emails, search and realtime tracking, Unit XII, but this read writes nothing.

@fig be_dep_journey_service | Middleware, authentication, validation, cache, pool and queries, authorization, a call to payments, serialisation. About 30 ms on a cache miss.

The service builds a response DTO with only the fields the client is allowed to see, Unit V, the **serialiser** turns it into about 2,000 bytes of JSON with an `ETag`, Unit I, and the response goes back through the sidecar, Nginx, the balancer and the edge, compressed on the way, to the phone. The app renders the order.

Adding up the miss path on the server side: about 2 ms in proxies and sidecars, 1 ms for middleware and authentication, 1 ms for the Redis miss, 8 ms for two queries, 12 ms for payments, 2 ms for serialisation and logging, and about 4 ms of scheduling and queueing, about 30 ms in all. With a cache hit, which happens 90% of the time, the queries disappear and the payment status comes from the cached entry, and the server side takes a few milliseconds.

## 30. Side channels and interruptions

While the request travels, it leaves a trail on three side channels, Unit XIV. **Logs**: each service writes a structured line with `req_7Hq2`, the trace id, user 42, the route template, status 200 and duration, with secrets redacted. **Metrics**: each hop increments its request counter and observes its latency histogram, by route template and status class, never by user id, and the pool, cache and dependency metrics move. **Traces**: the gateway started a trace, each hop added a span with `traceparent` propagation, and the 10% head sample or the tail sampler decides whether it is kept. Together they let an engineer answer "why was user 42's request slow at 20:10?" in minutes.

Interviewers interrupt anywhere, and the answers come from the earlier units. **What if Redis is down?** Short timeouts and a breaker send reads to the database at ten times the load; coalescing and a local stale cache protect it, Unit XIV. **What if the JWT has expired?** The API returns 401 with `WWW-Authenticate`, and the app uses its refresh token, rotated on use, to get a new access token and retries once, Unit III. **What if the database primary fails?** Reads continue from replicas, writes fail fast with a retryable error for 10 to 30 seconds while a replica is promoted, and idempotency keys make client retries safe, Unit VI. **What if payments is slow?** The 200 ms timeout and breaker cut it off, and the order is shown with "payment status unavailable" rather than failing, Unit X.

@fig be_dep_interruptions | Every hop has a failure an interviewer can ask about, and an answer from an earlier unit.

**What if the user is not the owner?** 404, logged as an authorization denial, Unit IV. **What if traffic is 100 times normal?** The edge absorbs what it can cache, rate limits and load shedding protect the rest, and the HPA adds pods within a minute while the cluster autoscaler adds nodes, Part III. **What if a deploy broke it?** The canary aborts automatically or on-call rolls back, Part V. **What if the pod is being shut down?** It finishes this request within its drain deadline after leaving the endpoints, Part IV. **What if the Kafka consumer behind order events falls behind?** This read is unaffected, but emails and search lag, and the time-based lag alert fires, Unit VIII. The skill being tested is not memorising each answer, but knowing that every hop has a timeout, a failure mode, a containment and a signal.

## 31. The series on one page

The whole series fits on one picture of one request. **Getting there**: HTTP's methods, status codes and caching headers, TLS and certificates, and DNS, Unit I, with the browser's origin rules, CORS, cookies and CSRF where a browser is involved, Unit II. **Proving who and what**: sessions, passwords, JWTs and OAuth, Unit III, then authorization, validation and tenancy, Unit IV. **Shaping the API**: resources, pagination, versioning, idempotency, errors and the layers of the application, Unit V.

**Storing and moving data**: pools, transactions, locks and migrations, Unit VI, caches and Redis, Unit VII, queues, Kafka and the outbox, Unit VIII, concurrency and runtimes, Unit IX. **Surviving the world**: rate limits, timeouts, retries, circuit breakers and third-party integrations, Unit X, proxies, balancers, discovery and the network underneath, Unit XI, realtime connections, uploads and search, Unit XII.

@fig be_dep_series | One request with each unit's place on it, and the side channels that watch it.

**Seeing it**: logs, metrics, traces, SLOs, health checks and debugging, Unit XIV. **Running it**: containers, Kubernetes, graceful shutdown, deployment strategies, compatibility, flags, architecture and cost, this unit.

The habits that run through all of them are few. Treat every input as hostile and every boundary as a place to check. Put a timeout on everything you do not control, and make retries safe with idempotency. Keep state out of the processes you replace, and make every change compatible with the version beside it. Measure what users feel, alert on that, and keep enough telemetry to explain it. And for every component, know what happens when it is slow, when it fails, and when it comes back. A backend engineer who can walk `GET /orders/123` from the phone to the database and back, and answer "what if this breaks?" at every hop, has learned what this series set out to teach.

:::story Picture this
A letter's journey through a postal system. It is addressed, collected, sorted at a local office, flown to a hub, sorted again, carried to a district, and delivered by a postman who checks the name on the door. At every stage someone keeps a record, every stage has a rule for what happens if the van breaks down, and a good postmaster can tell you, for any stage, what goes wrong there and how the system copes.
:::

:::note How to answer the master question
Interviewers rarely want every hop in full. Give the whole journey in a minute at a high level, DNS, connection and TLS, edge, balancers, ingress, the pod, middleware, auth, cache, database, response, and the side channels. Then go deep where they interrupt, using the same structure each time: what this hop does, its timeout, how it fails, how that is contained, and which signal shows it.
:::

:::warn Watch out
A capstone answer that lists components without saying what each decides, what it costs in time and how it fails sounds memorised. Attach a number and a failure to each hop, 25 ms for a cold DNS lookup, 1.6 busy connections of 40, 200 ms to payments, and the answer becomes evidence of understanding.
:::

:::interview Interview lens
**"What happens when a client calls https://api.example.com/orders/123?"** DNS resolves the name, cached or through a recursive resolver, to an anycast edge. TCP and TLS 1.3, or QUIC, set up an encrypted connection, usually reused. The edge terminates TLS, applies WAF and rate limits, and forwards uncacheable requests to the origin's L4 balancer, then an L7 ingress that picks a ready pod. A sidecar checks mTLS, the server parses the request, middleware binds the request id and trace, authentication verifies the JWT, validation and authorization check the id and ownership, the service reads through Redis to the database via a pool, calls dependencies with timeouts, and serialises a response that retraces the path. Logs, metrics and traces record every hop.
:::

:::key In one breath
`GET /orders/123` resolves through DNS to an anycast edge, rides a warm TLS connection, passes the edge's WAF and cache, an L4 balancer, an Nginx ingress choosing a ready pod, and an mTLS sidecar. Inside, middleware binds ids, the JWT is verified, the id validated, Redis missed, two pooled queries run in 8 ms, ownership checked, payments called within 200 ms, and 2,000 bytes serialised, about 30 ms on the server and 70 ms end to end. Logs, metrics and traces watch every hop, and every hop has an answer to "what if it fails?" from one of the units in this series.
:::

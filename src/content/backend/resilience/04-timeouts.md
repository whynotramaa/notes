@part IV | Timeouts | We put a time limit on every call to something we do not control, and we make the limits agree across a chain of services. A missing timeout turns a slow dependency into a stuck service, and a stuck service into a stuck system. We will cover the kinds of timeout and their dangerous defaults, choosing values and propagating deadlines, and the cascading failure that timeouts prevent. | where:4

## 10. Connect, read, write and overall timeouts

An outgoing HTTP call waits in several places, and each one can wait forever. Resolving the host name can stall on a slow DNS resolver. Opening the TCP connection can hang if packets are being dropped, and the TLS handshake adds more round trips. Writing the request can block if the server stops reading. Waiting for the first byte of the response is where a slow server shows up. And reading the body can drag on if the server sends slowly.

Each wait has its own timeout. A **connect timeout** limits establishing the connection, including TLS in most clients, and should be short, because a healthy server in the same region accepts a connection in milliseconds. Wren uses 200 ms. A **read timeout**, sometimes called a socket timeout, limits how long the client waits for the next bytes, and it resets every time data arrives. A **write timeout** limits sending. An **overall deadline** limits the entire call from start to finish, 2 s for Wren's calls to the payment provider.

@fig be_to_kinds | Five waits in one call, each with its own limit, all inside one overall deadline.

The read timeout's reset is a trap. A server that sends one byte every 900 ms never trips a 1 s read timeout, and a 1 MB response could take nine days. Slow-drip responses happen with overloaded servers, misbehaving proxies, and attackers, the server-side version of which is the Slowloris attack. Only an overall deadline bounds the whole call, and every outgoing call should have one.

The second trap is that defaults are often infinite. Python's `requests` library waits forever unless `timeout=` is passed. Java's `HttpURLConnection` defaults to 0, meaning infinite. Go's `http.Client{}` has no timeout unless one is set. Node's `fetch` has no overall deadline unless an `AbortSignal` is given. Database drivers, Redis clients and gRPC stubs each have their own defaults, some infinite. Wren's rule is that every client is created through a shared factory that sets connect, read and overall timeouts, and a lint rule rejects clients built any other way.

@fig be_to_defaults | Four popular clients that wait forever unless told otherwise.

Inbound timeouts matter as much. Wren's servers limit how long a client may take to send its request headers and body, so slow clients cannot hold connections open indefinitely, and limit how long a handler may run before the server gives up and returns 503.

## 11. Choosing values and propagating deadlines

A timeout that is too long protects nothing. A timeout that is too short fails requests that would have succeeded. The usual starting point is the dependency's latency distribution. Set the timeout a little above its p99.9 under normal load, so that only genuinely broken calls are cut off. Wren's payment provider has a p99 of 400 ms and a p99.9 of about 1.2 s, so 2 s cuts off almost nothing healthy. Its Redis p99.9 is 5 ms, so 20 ms is generous.

Timeouts must also fit inside the caller's own deadline. Wren's gateway gives a menu request 300 ms. If the menu service then calls the pricing service with its own fresh 300 ms timeout, and pricing calls the database with another, the chain can take far longer than the gateway is willing to wait. The gateway gives up at 300 ms and returns an error, while downstream services keep working for a response nobody will read.

**Deadline propagation** fixes this. The request carries its deadline, as an absolute time or remaining budget, and each service subtracts the time it has used before calling the next. gRPC does it natively. A client sets a deadline, the `grpc-timeout` header carries the remaining time, and every server and client in the chain sees it. Go's `context.WithDeadline` and Java's `Context` do the same inside a process, and HTTP services pass a header such as `X-Request-Deadline`.

@fig be_to_deadline | A 300 ms fuse lit at the gateway. Each hop gets what is left, not a fresh 300 ms.

With propagation, a service that receives a request with 40 ms left and knows its database call takes 50 ms can fail immediately, instead of starting work it cannot finish. When the gateway's deadline passes, cancellation propagates downstream, and every service stops its work and frees its resources, the context cancellation from Unit IX. The system spends no effort on dead requests, which is exactly what matters during overload.

Budgets also guide design. If the gateway allows 300 ms and the chain is gateway, orders, pricing and database, each hop's typical latency and timeout must add up within it. When they do not, the design needs fewer sequential hops, parallel calls instead of serial ones, or caching, rather than ever longer timeouts.

## 12. Cascading failures

The syllabus asks what happens in a chain A → B → C → database when C takes 30 s instead of 30 ms. The answer is that the slowness spreads upstream, and the timeouts decide how far.

Say B handles 200 requests per second from A and each calls C. Normally each call takes 30 ms, so by Little's law B has 200 × 0.03 = 6 calls in flight. Now C takes 30 s. B needs 200 × 30 = 6,000 calls in flight to keep up, but its thread pool or connection pool to C has 200 slots. They fill in about one second. From then on, every request B receives waits for a slot, including requests that do not need C at all, if they share the pool or the threads. B's latency rises to many seconds, and B effectively stops.

@fig be_to_cascade | C slows down, B's threads all wait on C, and then A's threads all wait on B.

A is next. Its calls to B now take as long as B's queue, and A's own pools fill the same way. Within a few seconds of C slowing down, A, B and C are all unresponsive, although only C has a problem. Users see the whole product fail. This is a **cascading failure**, and it is how most large outages unfold, a local problem propagating through waiting.

The defences are the subjects of this part and the next two. With a 100 ms timeout on B's calls to C, B holds at most 200 × 0.1 = 20 calls in flight, well within its pool, and fails those calls quickly instead of stalling. A circuit breaker on B's calls to C, Part VI, stops calling C entirely after enough failures, so B's failure on that path takes microseconds. A bulkhead gives C's calls their own small pool, so they cannot consume the threads that serve B's other work. A fallback lets B answer without C where possible. And **load shedding** at A and B, Unit IX, refuses work early when queues grow.

Retries can make cascades worse. If A retries its failed calls to B three times and B retries its calls to C three times, the extra load lands on C exactly when it is struggling, Part V's amplification. The design goal is that a slow dependency produces fast, contained failures in its callers, never slow, spreading ones.

:::story Picture this
A motorway where one lane is closed for roadworks far ahead. Cars slow, then stop, and the queue grows backwards past junctions that have nothing to do with the roadworks, until drivers who only wanted the next exit are stuck too. A good traffic system closes the slip road onto the jammed stretch early and sends drivers elsewhere, so the jam stays where the problem is.
:::

:::note Timeouts on retries
When a call is retried, the overall deadline should cover all attempts together, not each one. Three attempts with a 2 s timeout each can take 6 s plus backoff. Wren's payment client gives the whole operation the request's remaining budget and gives each attempt a share of it, stopping early when too little is left for another try.
:::

:::warn Watch out
A timeout that fires does not mean the remote operation did not happen. The provider may have charged the card and the response was slow. Treat a timeout on a non-idempotent call as "unknown", and resolve it with an idempotency key on retry or a status query, never by assuming failure.
:::

:::interview Interview lens
**"In A → B → C → database, C starts taking 30 seconds instead of 30 ms. What happens?"** B's calls to C hold threads and connections thousands of times longer, B needs 6,000 concurrent calls at 200 requests per second and has perhaps 200, so its pools fill within a second and all of B's requests stall, then A's pools fill waiting on B. The whole chain fails though only C is slow. Prevent it with timeouts set from C's normal latency, deadline propagation, circuit breakers that fail fast, bulkheads that give C its own pool, fallbacks, and retry limits so the load on C does not multiply.
:::

:::key In one breath
Every outgoing call needs a connect timeout, a read timeout and above all an overall deadline, because read timeouts reset with each byte and many clients default to waiting forever. Timeouts start a little above the dependency's p99.9, such as 2 s for a provider with a 1.2 s p99.9, and must fit the caller's deadline, which is propagated so each hop gets what is left and cancels when it runs out. When C slows from 30 ms to 30 s, B needs 6,000 concurrent calls instead of 6, its pools fill in a second, and the failure cascades to A unless timeouts, breakers, bulkheads and fallbacks contain it.
:::

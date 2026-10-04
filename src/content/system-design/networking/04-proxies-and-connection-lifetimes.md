@part IV | Proxies, L4/L7 and connection pools | We put a deliberate entry point in front of the service. That entry point can route traffic, but it also adds queues and limits. We will distinguish proxy layers and count reusable connections. | where:4

## 17. A reverse proxy represents the backend

The public name should remain stable when Heron adds or replaces application processes. A **reverse proxy** accepts a client's request on behalf of backend servers, forwards it to a selected backend, and returns the response. It is a server to the viewer and a client to the application. Those two exchanges can have different connections, encryption, timeouts, and error outcomes.

The proxy can terminate TLS, route paths, apply size limits, and reuse backend connections. Each of those jobs needs a configured rule. If it buffers the request or response, it also consumes memory and can change streaming latency. The client reaching the proxy does not prove that the proxy successfully reached the application.

@fig sd_networking_proxy_connections | A reverse proxy has two connection boundaries. The viewer and backend do not necessarily share one transport connection.

### What a proxy failure means

Suppose the proxy forwards a score command and times out waiting for a response. The backend may never have received it, may still be executing it, or may have committed and lost the reply. Returning a timeout to the client does not undo a database commit. A retry therefore needs the same command identity through the proxy and application.

A **load balancer** chooses among destinations to distribute suitable traffic. The reverse-proxy role and load-balancing role often coexist, but one explains who represents the backend while the other explains how a destination is selected. An extra layer needs a concrete routing, security, or operational reason.

:::story Picture this
A restaurant receptionist accepts your reservation and phones one of several branches. You spoke to the receptionist, but the branch still has to record the booking. If the phone disconnects, the receptionist cannot infer whether the branch wrote it down.
:::

## 18. L4 and L7 see different information

A routing device receives an encrypted connection addressed to Heron. **Layer 4**, or **L4**, routing uses transport information such as source and destination addresses and ports. It can distribute connections without understanding the HTTP resource. A long-lived connection normally keeps its selected route while it continues.

**Layer 7**, or **L7**, routing understands application information such as an HTTP host, path, or header. Heron can route `/matches` to score readers and `/clips` to media metadata handlers. To inspect fields protected by TLS, the route decision must occur where the application plaintext is available. A transport-level device cannot select by a hidden path merely because its configuration uses the word 'smart.'

@fig sd_proxy_layers | The available information limits the routing decision. Encrypted application fields require an appropriate inspection boundary.

### Count the unit that is assigned

One TCP connection can carry many sequential HTTP requests, and HTTP/2 can carry multiple concurrent streams. Balancing connection counts is therefore different from balancing request work. A server with fewer sockets can still have more busy streams than a server with many idle sockets.

L7 routing can pool backend connections independently of viewer connections. The proxy may distribute requests rather than bind every viewer request to one application. Actual behavior depends on protocol and implementation, so inspect the deployment rather than assuming one front connection equals one back connection.

The later routing unit compares round robin, weights, least connections, health checks, and discovery. Here the goal is narrower: name the information and assignment unit at the boundary, then count its connections and waits correctly.

## 19. Keep-alive reuses a connection, not a result

A viewer refreshes the score repeatedly. **Keep-alive** allows an established connection to carry later exchanges rather than paying new connection setup each time. The server still validates the request and executes or reuses its application result according to the resource contract. Reusing a socket is not the same as reusing a cached response.

There are several lifetimes to distinguish. An idle connection timeout closes a connection that has no suitable activity for a period. A maximum connection lifetime rotates old connections even if they remain useful. TCP keepalive probes are transport-level checks for an idle peer; application heartbeat messages can verify a higher-level conversation. These mechanisms answer different questions.

@fig sd_networking_connection_lifetimes | Different timers control reuse, idle detection, and ownership refresh. No fixed duration is recommended by this conceptual figure.

### Why indefinitely reusable connections can still hurt

A client can keep an old endpoint alive during deployment by reusing its connection. A backend can have a limited number of connection slots, so idle clients can occupy resources needed by new work. Reuse needs bounds on idle time, lifetime, and simultaneous connections, plus a graceful drain policy.

Heron can finish in-progress reads while directing new admissions elsewhere. For live feeds, it can ask clients to reconnect with jitter and restore their subscription boundary. Do not force every connection to restart at the same instant; that turns a deployment into a handshake and replay surge.

:::note Reuse and multiplexing are separate
A persistent HTTP/1.1 connection can reuse setup for sequential exchanges. HTTP/2 can also multiplex exchanges. Both reuse a connection, but their concurrent request behavior differs.
:::

## 20. A connection pool is a bounded lending system

Opening a fresh database connection for every score read wastes setup and can overload the database's connection machinery. A **connection pool** owns a bounded collection of reusable connections and lends an available one to a caller. The caller acquires, uses, and releases it. If none is suitable, the caller waits within a budget or is rejected.

Use a tiny illustrative pool with two slots and three arriving operations. A borrows slot X and B borrows slot Y; C waits. When A finishes and releases X, C can use X. Creating an extra connection behind the pool's back defeats the bound. Forgetting to release a loan leaves a slot occupied even after the useful work ended.

@fig sd_networking_pool_trace | Illustrative two-slot pool. The third borrower waits until a slot returns; this is separate from Heron's assumed 20-slot sizing example.

### Count occupancy, not connection-creation speed

For Heron's illustrative pool of 20 slots, each occupied for 0.01 s, the ideal capacity is $20/0.01=2,000$ operations per second. At a 1,000-operation arrival rate with the same assumptions, average useful occupancy is half that ideal capacity. This upper-bound arithmetic omits locks, uneven durations, serialization, and query overlap effects.

$$\lambda_{\max}=\frac{c}{s}$$

Read this as: an ideal pool's maximum completion rate $\lambda_{\max}$ equals slot count $c$ divided by mean occupied time $s$, assuming continuously useful independent work and no extra bottleneck. The time unit in $s$ determines the rate unit. A query that holds a connection while waiting on a remote API increases occupancy without producing database work.

Increasing the pool can lower acquisition wait until the database reaches useful concurrency. Beyond that, more queries compete for CPU, locks, I/O, and memory. Five application instances with a pool each also create five sets of loans; a per-process limit is not the fleet's database concurrency limit. Record both.

@fig sd_connection_pool | A pool bounds access to a shared dependency; the dependency still has its own capacity.

:::warn Watch out
A connection can carry transaction state, session settings, or an unfinished result. Return it only after cleanup makes it safe for the next borrower. A leaked or contaminated loan is a correctness problem as well as a capacity problem.
:::

:::interview Interview lens
**"We added application instances and database latency increased. Why?"** Each instance can bring another pool and more concurrent queries. The shared database may now spend more time on contention instead of useful completions. I would inspect total active connections, acquisition wait, lock and I/O waits, then bound fleet-wide useful concurrency rather than enlarging every pool.
:::

:::key In one breath
A reverse proxy represents backends and can create separate connection boundaries. L4 and L7 route using different information and assignment units. Keep-alive reuses transport setup, while pools bound reusable dependency connections. Measure occupied time and total fleet concurrency before treating more slots as more capacity.
:::

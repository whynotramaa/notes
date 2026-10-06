@part II | Nginx internals | We open Nginx and see how a handful of processes serve tens of thousands of connections. The design is Unit IX's event loop, built carefully and tuned for one job. We will cover the master and worker processes, the request path with buffering and upstream keep-alive, and sendfile, zero-copy and TLS. | where:2

## 4. Master, workers and event loops

Nginx runs as one **master process** and several **worker processes**. The master reads the configuration, opens the listening sockets on ports 80 and 443, and starts the workers. It does no request handling. When the configuration is reloaded with `nginx -s reload`, the master starts new workers with the new configuration and tells the old ones to stop accepting connections and exit when their current requests finish, which is how Nginx changes configuration without dropping a single connection.

Each worker is a single-threaded event loop, exactly Unit IX's design, and the usual setting is one worker per CPU core, `worker_processes auto`. A worker puts all its sockets in non-blocking mode and registers them with `epoll` on Linux or `kqueue` on BSD and macOS. Its loop waits for events, ready sockets, timers firing, and for each event runs a small piece of state machine code, read some bytes, parse what has arrived, write some bytes, then returns to waiting. A connection that is idle between keep-alive requests costs a few kilobytes of state and no CPU at all.

@fig be_ngx_workers | One master, one worker per core, each an event loop holding thousands of connections.

That is why Nginx needs no thread per connection. A thread spends most of its life blocked waiting for slow clients and slow upstreams, paying for a stack and scheduling the whole time. A worker never blocks, so it can hold tens of thousands of connections and switch between them in nanoseconds of user-space work, without asking the kernel's scheduler.

Capacity follows from a few settings. `worker_connections` caps the sockets one worker may hold, both client and upstream, and Wren sets 10,000. With 8 workers, Nginx can hold 8 × 10,000 = 80,000 sockets. A proxied request uses two, one to the client and one to the upstream, so about 40,000 concurrent client connections. Each socket is a file descriptor, so `worker_rlimit_nofile` and the system limits from Unit IX must allow at least that many per worker.

Connections are spread across workers either by the workers taking turns to accept from a shared listening socket, or, with the `reuseport` option, by giving each worker its own listening socket with `SO_REUSEPORT` and letting the kernel distribute new connections. The second avoids contention and spreads load more evenly on busy servers. The `accept_mutex`, which made workers take turns, has been off by default since Nginx 1.11.3.

Anything that blocks a worker blocks every connection on it, the same lesson as Node.js. Nginx avoids blocking itself, and uses a small thread pool, `aio threads`, for the few operations, such as some disk reads, that the operating system cannot do asynchronously.

## 5. The request path, buffering and upstream keep-alive

A request's path through a worker is a sequence of non-blocking steps. The worker accepts the connection, completes the TLS handshake if needed, reads and parses the request line and headers, chooses a location block by host and path, and if the location proxies, picks an upstream server, Part III, and sends the request. It then relays the response back to the client.

**Proxy buffering** shapes the last part. With `proxy_buffering on`, the default, Nginx reads the upstream's response as fast as the upstream sends it, into memory buffers and, if those fill, a temporary file, and then feeds the client at the client's own pace. Wren's order history endpoint returns 2 MB to a phone on a weak connection that takes 8 s to receive it. The application sends the 2 MB in a few milliseconds and is free for its next request, while Nginx spends 8 s dripping data to the phone, which costs Nginx a few kilobytes of state and the buffer.

@fig be_ngx_buffering | The app hands over the response in milliseconds. Nginx spends eight seconds feeding the phone.

Without buffering, the application would be tied to the slow client for the whole 8 s, holding a thread or a connection slot, and a few hundred slow phones could exhaust its capacity. Request buffering, `proxy_request_buffering`, does the same for uploads, reading the whole body before contacting the upstream. Buffering is turned off deliberately only for streaming, such as server-sent events and long-polling, Unit XII, where data must flow as soon as it is produced.

**Upstream keep-alive** is the other critical setting, and it is off unless configured. By default Nginx opens a new connection to the upstream for every request and closes it afterwards. At 2,000 requests per second, that is 2,000 new TCP connections per second to the application, each with a handshake, and each closed connection waits in TIME_WAIT for 60 s, Part VIII, so about 120,000 sockets sit in TIME_WAIT at any moment. Since connections to one upstream address all share the same destination, they draw on one pool of ephemeral ports and can exhaust it.

@fig be_ngx_keepalive | One new connection per request piles up TIME_WAIT sockets. A small keep-alive pool carries everything.

The fix is a `keepalive 32` line in the upstream block, with `proxy_http_version 1.1` and an empty `Connection` header, which keeps up to 32 idle connections per worker to each upstream and reuses them. The upstream must allow keep-alive too, with an idle timeout longer than Nginx's, or the upstream closes connections that Nginx is about to reuse, producing occasional 502 errors that are notoriously hard to diagnose.

## 6. sendfile, zero-copy and TLS

Serving a static file the naive way costs more than it should. The process calls `read()`, and the kernel copies data from the page cache into the process's buffer. The process calls `write()` on the socket, and the kernel copies it back into the socket's buffer. Two system calls and two copies of every byte, through memory the process never needed to look at.

**sendfile** asks the kernel to move data from a file descriptor to a socket directly. One system call, and the data goes from the page cache to the socket without passing through user space, often with the network card reading it straight from memory by DMA. This is the core of **zero-copy** I/O. Nginx enables it with `sendfile on`, along with `tcp_nopush`, which fills packets fully before sending. Kafka uses the same call to serve log segments to consumers, Unit VIII, which is part of why it is fast.

@fig be_ngx_sendfile | Two copies through user space, or one call that moves bytes from the page cache to the socket.

sendfile has limits. It cannot be used when the data must be transformed on the way out, such as gzip compression of an uncompressed file, which is why serving precompressed `.gz` or `.br` files with `gzip_static` keeps zero-copy working. And with TLS, the data must be encrypted, which classically requires it in user space. Linux's **kernel TLS**, kTLS, lets the kernel do the symmetric encryption after the handshake, so sendfile works over HTTPS too, and Nginx supports it with `ssl_conf_command Options KTLS`.

TLS termination itself is the most CPU-intensive thing Nginx does. A full handshake costs an asymmetric key operation, while resumed sessions, Unit I, skip most of it. Nginx's `ssl_session_cache` and session tickets let returning clients resume, and TLS 1.3 needs fewer round trips. With modern CPUs' AES instructions, bulk encryption is cheap, so handshake rate rather than throughput is what to watch. A burst of new connections after a deploy or a client reconnect storm shows up as a handshake spike.

Keep-alive matters on the client side too. `keepalive_timeout 65` and `keepalive_requests 1000` let browsers and apps reuse connections for many requests, saving handshakes, while freeing idle connections eventually. HTTP/2, with many requests multiplexed on one connection, does even more of that work, Unit I.

:::story Picture this
A busy café with one barista per counter who never stands still. They take an order, start the machine, take the next order while it runs, hand over a finished drink, and come back. Customers who dawdle over their order do not stop the barista serving others. A café that hired one barista per customer and had each stand beside their customer until they left would need a thousand baristas on a busy morning.
:::

:::note Reload versus restart
A reload starts new workers and lets old ones finish, so in-flight requests complete. A restart kills everything. Connections held for a long time, WebSockets and long downloads, keep old workers alive after a reload, sometimes for hours, so `worker_shutdown_timeout` caps how long they may linger.
:::

:::warn Watch out
Leaving upstream keep-alive off is one of the most common causes of mysterious connection errors under load. The application sees thousands of new connections a second, sockets pile up in TIME_WAIT, and new connections fail with "cannot assign requested address" while CPU and memory look healthy.
:::

:::interview Interview lens
**"Why can Nginx handle many connections without a thread per connection?"** Each worker is a single-threaded event loop over non-blocking sockets registered with epoll, so it never waits on any one connection. An idle connection costs a few kilobytes of state and no CPU, and a worker switches between ready connections in user space. One worker per core uses all cores without contention. Proxy buffering decouples slow clients from fast upstreams, upstream keep-alive reuses backend connections, and sendfile moves file bytes to sockets without user-space copies.
:::

:::key In one breath
Nginx runs a master that manages configuration and sockets, and one single-threaded event-loop worker per core, so 8 workers with `worker_connections` 10,000 hold 80,000 sockets, about 40,000 proxied clients. Proxy buffering lets the app hand off a 2 MB response in milliseconds while Nginx feeds a slow phone for 8 s, and upstream keep-alive avoids 2,000 new connections a second and 120,000 sockets in TIME_WAIT. sendfile moves file data from the page cache to the socket in one call without user-space copies, kTLS keeps that working over HTTPS, and handshakes are the main TLS cost.
:::

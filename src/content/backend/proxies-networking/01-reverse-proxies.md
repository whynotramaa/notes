@part I | Reverse proxies | We put a server in front of Wren's servers that speaks to the internet on their behalf. Nearly every production backend has one, and its headers decide what the application believes about every client. We will cover forward and reverse proxies, the jobs a reverse proxy takes over, and forwarded headers with the trust rules that keep them honest. | where:1

## 1. Forward and reverse proxies

A **proxy** is a server that receives a request and makes another request on the requester's behalf. The direction it faces decides its name. A **forward proxy** acts for clients. An office routes its employees' web traffic through one, so the outside world sees the proxy's address rather than each laptop's, and the office can filter, log and cache. Clients know about it and are configured to use it.

A **reverse proxy** acts for servers. Wren's users connect to `api.wren.example`, which resolves to a proxy. The proxy accepts the connection, reads the request, and forwards it to one of Wren's application instances on a private network. Clients usually have no idea it exists. They see one stable name and address, while behind it instances come and go, move between machines and run different versions.

@fig be_px_fwd_rev | The same idea facing two ways. A forward proxy hides its clients, a reverse proxy hides its servers.

Reverse proxies became standard because they separate two very different jobs. Talking to the internet means handling thousands of slow, unreliable, sometimes hostile connections, with TLS, timeouts and odd clients. Running business logic means parsing a request, querying a database and producing JSON. Doing both in one process makes each worse. A reverse proxy built for the first job, such as Nginx, released by Igor Sysoev in 2004, HAProxy, released by Willy Tarreau in 2001, Envoy, open-sourced by Lyft in 2016, or Caddy and Traefik, lets the application do only the second.

Wren has several layers of reverse proxy. The CDN from Unit VII is a reverse proxy at the edge. The cloud load balancer is another. Nginx running as the Kubernetes ingress controller is a third, and the sidecars of Part VI are a fourth. Each one terminates the connection from the layer before, applies its rules, and opens or reuses a connection to the layer after. That layering is why a single request in Part X crosses half a dozen machines, and why the headers they pass along matter so much.

The proxy also becomes a natural place for policy. Routes, limits, authentication checks and logging are configured once at the proxy rather than in every service. The danger, as Part VI discusses for gateways, is letting it accumulate business logic it should not have.

## 2. What a reverse proxy does on the way through

Wren's Nginx ingress does a long list of jobs for each request before the application sees it, and each one is something the application no longer has to do.

It **terminates TLS**. The proxy holds the certificate, performs the handshake and decrypts the request, Unit I, so application instances speak plain HTTP on the private network or, with a mesh, mutual TLS between sidecars. Certificates are managed in one place, and expensive handshakes happen on machines sized for them. It **routes** by host and path, sending `/orders/*` to the orders service and `/menus/*` to the menu service. It **load-balances** across each service's instances, Part III, and **health-checks** them so dead instances get no traffic.

@fig be_px_jobs | Ten jobs a reverse proxy takes over before a request reaches the application.

It **compresses** responses with gzip or Brotli, often shrinking JSON by 70% or more, and serves **static files** directly from disk without touching the application. It can **cache** responses, the same rules as Unit VII's CDN closer to the origin. It **buffers** requests and responses, Part II, so slow clients do not tie up application workers. It enforces **limits**, maximum body size, request rate per client, header size, and timeouts for slow clients. And it **rewrites headers**, adding `X-Forwarded-For` and `X-Request-Id`, removing internal headers from responses, and setting security headers such as `Strict-Transport-Security`.

It also manages connections in both directions. Thousands of client connections, many idle with keep-alive, map onto a small pool of long-lived connections to each application instance. That reuse saves a TCP and possibly a TLS handshake for every request, and Part VIII shows it is also what prevents port exhaustion.

None of these jobs is free. Every hop adds a little latency, typically well under a millisecond inside a data centre, and every proxy is a component that can be misconfigured. A missing body size limit, a timeout shorter than the slowest endpoint, or a route that sends traffic to the wrong service are common incidents. Wren keeps proxy configuration in version control, reviews it like code and tests it in staging.

## 3. Forwarded headers and trusted proxies

Once a proxy sits in front of the application, the application's view of the connection is wrong. The TCP connection it sees comes from the proxy at 10.0.2.5, not from user 42's phone at 198.51.100.7. The request arrived over plain HTTP from the proxy, though the user used HTTPS. Rate limiting by IP, logging, fraud detection and redirects built from the request's scheme all break unless the proxy passes the original details along.

Proxies use headers for this. **X-Forwarded-For** lists client and proxy addresses, each proxy appending the address it received the connection from. **X-Forwarded-Proto** gives the original scheme, `https`, and **X-Forwarded-Host** the original host. **X-Real-IP**, an Nginx convention, carries a single client address. The standard **Forwarded** header, RFC 7239 from 2014, combines them, `Forwarded: for=198.51.100.7;proto=https;host=api.wren.example`, though the `X-` forms remain far more common.

@fig be_px_xff | The header gains an entry at each hop. The first entry may be forged by the client.

The danger is that headers are just text, and clients can send them too. A client that sends `X-Forwarded-For: 1.2.3.4` arrives at the CDN, which appends the real address, so the application receives `1.2.3.4, 198.51.100.7, 203.0.113.50, 10.0.1.20`. An application that takes the first entry believes the client is 1.2.3.4, and an attacker can rotate that value to evade rate limits or forge audit logs, the warning from Unit X.

The rule is to trust only entries added by your own proxies. Read the list from the right. Skip each address that belongs to a proxy you control, here the LB's 10.0.1.20 and the CDN's 203.0.113.50, which come from known ranges. The first address that is not one of yours is the client, 198.51.100.7. Everything to its left was supplied by the client and is untrustworthy. Frameworks implement this as a **trusted proxies** setting, such as Nginx's `set_real_ip_from` with `real_ip_recursive on`, Express's `trust proxy`, and Rails' `trusted_proxies`, and getting that list right is a security configuration, not a convenience.

The same applies to the other headers. The edge proxy should overwrite `X-Forwarded-Proto` and `X-Forwarded-Host` rather than append to whatever the client sent, and internal services should accept them only from the proxy's network. Where a layer 4 balancer sits in front, the PROXY protocol of Part IV carries the client address without any HTTP header at all.

:::story Picture this
A hotel reception desk. Guests never knock on the kitchen or the laundry. They talk to reception, which passes requests along and writes the guest's room number on each slip. If a guest scribbles a different room number on their own note before handing it over, a careful receptionist ignores it and writes the room they can see the guest came from.
:::

:::note The request id
Wren's edge proxy generates an `X-Request-Id` for every request that lacks one from a trusted source, and every later hop logs it and passes it on. It is the cheapest form of tracing, Unit XIV, and the first thing support asks for when a customer reports a problem.
:::

:::warn Watch out
Configuring "trust all proxies" because the client IP looked wrong makes every client's forged `X-Forwarded-For` trusted. List exactly the address ranges of your own proxies, CDN and load balancers, and nothing else.
:::

:::interview Interview lens
**"What is a reverse proxy, and how does the application learn the client's real IP address behind it?"** A reverse proxy accepts client connections on behalf of servers and forwards requests to them, handling TLS termination, routing, load balancing, compression, buffering, caching, limits and header rewriting. The application sees the proxy's address, so the proxy appends the client's address to X-Forwarded-For and sets X-Forwarded-Proto. The application reads X-Forwarded-For from the right, skipping its own trusted proxies' addresses, and takes the first untrusted one, ignoring anything to its left because clients can forge it.
:::

:::key In one breath
A forward proxy acts for clients and a reverse proxy acts for servers, giving clients one stable address while instances change behind it, and Wren stacks several, the CDN, the cloud load balancer, Nginx and sidecars. A reverse proxy terminates TLS, routes, load-balances, health-checks, compresses, serves static files, caches, buffers, enforces limits and rewrites headers. It passes client details in X-Forwarded-For, X-Forwarded-Proto or Forwarded, and the application must read X-Forwarded-For from the right, skipping its own proxies, because the leftmost entries can be forged.
:::

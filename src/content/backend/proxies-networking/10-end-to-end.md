@part X | A request across the network | We follow `GET /orders/123` from user 42's phone through every network hop, then replay three incidents that each started in one of this unit's parts. Seeing the hops in order shows how many places hold a connection, a timeout and a header. We will cover the request's path, the incidents, and the unit on one page. | where:10

## 31. GET /orders/123, hop by hop

User 42 opens order 123 in the app at 198.51.100.7. The phone resolves `api.wren.example`, Unit I, and gets an address belonging to the CDN, which is anycast, so the packets reach the nearest edge. The phone already has an HTTP/2 connection open from a few seconds ago, so there is no handshake. The edge checks its WAF rules and its cache, Unit VII, finds that order details are private and uncacheable, and forwards the request over its own pooled connection to Wren's origin, adding `X-Forwarded-For: 198.51.100.7` and its own request id.

The origin address belongs to the cloud's load balancer in Wren's public subnets. Wren uses a layer 4 network balancer here, which spreads TCP connections from the CDN across the Nginx ingress pods, with the PROXY protocol carrying the CDN's address. Nginx, the ingress controller, reads the PROXY header, trusts it from the balancer's range, applies `set_real_ip_from` for the CDN's ranges to recover 198.51.100.7 as the client, terminates TLS, matches the host and path, and picks an orders pod using power of two choices over its keep-alive pool of upstream connections. It forwards the request with `X-Forwarded-For`, `X-Forwarded-Proto: https` and `X-Request-Id`.

@fig be_net_e2e | Eight hops for one read. Each one terminates, decides and forwards.

The orders pod's sidecar receives the connection, verifies the ingress's mTLS identity against the mesh policy, and passes the request to the orders application on localhost. The application authenticates the bearer token, checks that user 42 owns order 123, Unit IV, and needs the payment status, so it calls `payments` by name. Its sidecar resolves the payments Service through the mesh's discovery, picks a payments pod in the same zone, opens or reuses an mTLS connection, and applies the 200 ms timeout and retry policy configured for that route. The payments service answers, and the response retraces the path, through the sidecars, Nginx's buffer, the balancer and the CDN, to the phone.

Every hop has its own timeouts, which must nest, Unit X, its own keep-alive settings, which must be longer on the server side than the client side to avoid races, its own health checks, and its own view of the client, carried by headers it must trust only from the hop before. The whole journey takes perhaps 40 ms, most of it in the application and its calls, with each proxy adding well under a millisecond.

## 32. Three incidents, and the unit on one page

The first incident happened during a promotion. Traffic doubled, and within minutes the orders service began returning 502 errors through Nginx, with CPU at 20% everywhere. `ss -s` on the Nginx pods showed over 100,000 sockets in TIME_WAIT, and Nginx's error log said "cannot assign requested address". A configuration change months earlier had dropped the `keepalive` line from the orders upstream block, so every request opened a new connection, and at about 2,000 per second to a small set of pod addresses, ephemeral ports ran out, Part VIII. Restoring upstream keep-alive fixed it in one reload, and an alert on TIME_WAIT counts and Nginx's upstream connection rate now guards it.

@fig be_net_failures | Three incidents, each traced to a part of this unit.

The second followed a scale-out of the payments service from 3 pods to 6. Payments latency barely moved, and the new pods showed almost no traffic, while the old ones stayed hot. Internal callers used gRPC over long-lived connections through a ClusterIP, a layer 4 translation, so existing connections stayed pinned to the old pods, Part IV. The fix was to route those calls through the mesh's sidecars, which balance per request, and to set `MAX_CONNECTION_AGE` on the payments servers to 5 minutes so any remaining direct clients reconnect and rebalance.

The third appeared every morning. The first few requests after the overnight lull took 15 s and then failed, after which everything was fine. The database connection pool kept idle connections through the night, and the NAT gateway between the application subnets and an external database provider dropped them after 350 s of silence, Part VIII. The pool handed out a dead connection, the query waited for a timeout, and the pool only then discarded it. TCP keepalives every 60 s and a pool idle limit of 300 s ended the morning failures.

@fig be_net_components | Proxies, balancers, discovery and private networks, built on sockets and cloud networks.

Put together, the unit is one long chain of components that each terminate a connection, make a decision and open or reuse another. Reverse proxies and gateways handle the edge, with headers that must be trusted only from known hops. Load balancers spread connections or requests, and the difference decides what happens with long-lived protocols. Discovery maps names to changing instances, meshes put a programmable proxy beside every service, and private networks connect machines across NATs with WireGuard. Underneath, sockets, ports, queues and translation tables are finite, and they run out before CPU does. Unit XII rides on top of this network with realtime connections, file uploads and search.

:::story Picture this
A parcel's trip from a sender to a flat in a large building. The local post office, a regional sorting centre, a delivery van, the building's front desk and finally the porter on the right floor, each one reading the label, deciding the next step and handing it on. Most days nobody notices the chain. On the day the sorting centre runs out of trolleys, every parcel in the city stops, though every lorry still has fuel.
:::

:::warn Watch out
Each hop's idle timeout must be shorter on the client side than on the server side, so that the client closes an idle connection before the server does. If the server side closes first, a client can send a request on a connection the server has just closed, and the request fails with a 502 or a reset. Nginx's upstream keepalive timeout should be shorter than the application's, and the application's shorter than anything behind it.
:::

:::interview Interview lens
**"Walk me through the network path of an API request in a cloud deployment."** DNS resolves the API name to an anycast CDN edge, which terminates TLS, applies WAF rules and forwards uncacheable requests over pooled connections, adding X-Forwarded-For. A cloud L4 balancer in public subnets spreads connections across ingress proxies, passing the client address with the PROXY protocol, and the ingress terminates TLS, routes by host and path and balances per request over keep-alive connections to pods in private subnets. A sidecar handles mTLS, discovery, timeouts and retries for calls between services by name. Each hop has nested timeouts, keep-alives and health checks, and finite sockets, ports and conntrack entries.
:::

:::key In one breath
`GET /orders/123` passes DNS, an anycast CDN edge, an L4 cloud balancer with the PROXY protocol, Nginx resolving the real client and balancing per request over keep-alive connections, the orders sidecar with mTLS, and a by-name call to payments through the mesh, in about 40 ms. The three incidents were ephemeral port exhaustion from a missing upstream `keepalive`, idle new pods behind L4-pinned gRPC connections, and pooled connections dropped by a NAT after 350 s. Every hop terminates, decides and forwards, with nested timeouts and keep-alives, trusted headers, and finite sockets, ports and tables.
:::

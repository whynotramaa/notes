@part IV | TCP load balancers | We look at what layer 4 balancers do to packets and why that matters to the application. The data path decides whether the backend sees the client's address and whether responses pass through the balancer at all. We will cover full proxies, NAT and direct server return, preserving the source IP with the PROXY protocol, and long-lived connections. | where:4

## 11. Full proxies, NAT and direct server return

A layer 4 balancer can carry a connection in three ways, and each has different costs.

A **full proxy**, or TCP proxy, terminates the client's connection and opens a separate connection to the backend. It relays bytes between the two. HAProxy in TCP mode, Envoy's TCP proxy and many cloud network balancers work this way. The two connections have their own handshakes, windows and buffers, so the proxy can absorb slow clients, apply timeouts and limit connections. The backend sees the proxy's address as the source, which is the problem the next section solves.

@fig be_tcp_full_proxy | Two connections, relayed by the proxy. The server sees the proxy's address.

**NAT mode** does not terminate anything. The balancer rewrites each packet's destination address from the virtual IP to the chosen backend's address and forwards it, keeping a **connection tracking** entry so later packets of the same connection go to the same backend. The backend's replies must come back through the balancer, which rewrites the source address back to the virtual IP. The client's address can be preserved, but every byte of every response passes through the balancer, which becomes the bandwidth bottleneck.

**Direct server return**, DSR, removes that bottleneck. The balancer forwards incoming packets to a backend, typically by rewriting only the destination MAC address on the same network or by encapsulating them in a tunnel. The backend has the virtual IP configured on a loopback interface, so it accepts the packets and replies directly to the client from the virtual IP, bypassing the balancer. Web responses are often ten or more times larger than requests, so DSR lets a modest balancer front an enormous amount of outgoing traffic. Linux IPVS supports DSR, and large layer 4 systems such as Maglev and Facebook's Katran use encapsulation variants of it.

@fig be_tcp_nat_dsr | In NAT mode replies return through the balancer. In DSR they go straight to the client.

DSR's costs are complexity and blindness. Backends need special network configuration, the balancer never sees responses so it cannot measure latency or detect failures from them, and it can only do layer 4 work. It is a tool for the very edge of very large systems. Most applications sit behind a full proxy or a cloud balancer and never configure DSR, but it explains why some balancers handle terabits while others struggle with a fraction of that.

## 12. Source IP preservation and connection tracking

Behind a full proxy, the backend sees connections from the proxy. For HTTP, Part I's `X-Forwarded-For` carries the client address. For other protocols, or for HTTPS passed through without termination, there is no HTTP header to add, because the proxy cannot or does not read inside the stream.

The **PROXY protocol**, designed by Willy Tarreau for HAProxy in 2010, solves this. The proxy sends one short header at the very start of the backend connection, before any application data. Version 1 is a single line of text, `PROXY TCP4 198.51.100.7 203.0.113.10 51234 443\r\n`, giving the protocol family, source and destination addresses and ports. Version 2 is a compact binary form that can also carry extra fields, such as TLS details or a cloud provider's connection metadata. The backend, Nginx with `listen 443 proxy_protocol` for example, reads the header first, records the real client address, and then processes the rest of the stream as normal.

@fig be_tcp_proxy_protocol | One line before the TLS handshake tells the backend who the client was.

Both sides must agree. A backend that expects the PROXY header rejects connections without one, and a backend that does not expect it reads "PROXY TCP4..." as the start of a malformed request. The header must also only be accepted from trusted proxies, or clients could forge it, the same rule as for `X-Forwarded-For`. AWS Network Load Balancers, HAProxy, Nginx, Envoy and most ingress controllers support it.

NAT-mode balancers and Linux machines doing NAT, including Kubernetes nodes running kube-proxy in iptables mode, keep a **connection tracking table**, conntrack, with one entry per connection they are translating. The table has a maximum size, `nf_conntrack_max`, often a few hundred thousand entries depending on memory. Entries persist for a timeout after the connection ends, two minutes in TIME_WAIT by default. A node handling 2,000 new short connections per second holds about 2,000 × 120 = 240,000 entries just for recently closed ones. When the table fills, the kernel drops new connections and logs `nf_conntrack: table full, dropping packet`, an outage invisible to CPU and memory graphs, Part VIII.

## 13. Long-lived connections

Layer 4 balancing makes one decision per connection. That works well for short connections. It works badly when connections live a long time, which modern protocols encourage.

Wren's mobile apps keep an HTTP/2 connection open for minutes, sending many requests over it. Its internal services call each other with gRPC, also over HTTP/2, and gRPC clients keep connections for hours. WebSocket connections, Unit XII, last as long as the app is open. Behind a layer 4 balancer, each of these connections is pinned to the backend it first chose, and every request on it goes there.

Now Wren scales the orders service from 3 pods to 6 during the evening rush. The 3 new pods are healthy and registered, and they receive almost nothing. Existing clients keep their connections to the old pods, which stay at full load, and only connections opened after the scale-out reach the new ones. Load evens out only as old connections close, which for gRPC can take hours. The autoscaler sees average utilization fall and may even scale back down.

@fig be_tcp_long_lived | Six pods, three doing all the work. Connection balancing cannot see the requests inside.

This is the precise sense in which layer 4 and layer 7 balancing solve different problems. Layer 4 balances **connections**, which is right when connections are short or each carries similar work. Layer 7 balances **requests**, which is right when a few long connections carry most of the traffic. The fixes for long-lived connections are all ways of getting request-level balancing or forcing connections to move. Put a layer 7 proxy, such as Envoy, Linkerd or a gRPC-aware ingress, in the path, which balances each request across backends. Use client-side load balancing, where gRPC clients resolve all backend addresses, Part V, and spread requests across connections to each. Or set a maximum connection age on servers, gRPC's `MAX_CONNECTION_AGE`, so clients reconnect every few minutes and rebalance gradually.

WebSockets are the hard case, since each connection is a session that cannot be split. For them, balancing at connection time with least connections, accepting some imbalance, and draining connections slowly during deploys, Unit XII, is the practical approach.

:::story Picture this
A telephone exchange that assigns each caller an operator when they ring. For quick calls it works perfectly. Then a few customers start leaving the line open all day, chatting on and off, and when the exchange hires extra operators for the evening rush, the new operators sit idle while the old ones juggle every open line. Assigning per call is fine until calls stop ending.
:::

:::note Idle timeouts in the path
Every balancer has an idle timeout, after which it silently drops a connection with no traffic. AWS Application Load Balancers default to 60 s and Network Load Balancers to 350 s. Long-lived connections need application or TCP keepalives more frequent than the shortest idle timeout on the path, Part VIII.
:::

:::warn Watch out
Enabling the PROXY protocol on one side only breaks every connection, often during a change made at the balancer alone. Change both sides together, test with a single backend first, and restrict the PROXY header to trusted source addresses.
:::

:::interview Interview lens
**"After scaling out a gRPC service, the new instances get almost no traffic. Why?"** gRPC multiplexes requests over long-lived HTTP/2 connections, and a layer 4 balancer makes its choice once per connection, so existing clients stay pinned to the old instances and only new connections reach the new ones. Fix it with request-level balancing, an L7 proxy such as Envoy, or client-side balancing across all endpoints, or by setting a maximum connection age so clients reconnect and rebalance. More generally, L4 balances connections and L7 balances requests.
:::

:::key In one breath
A full proxy terminates and re-originates connections, NAT mode rewrites addresses and sends replies back through the balancer, and direct server return lets backends reply straight to clients so a modest balancer fronts huge outbound traffic. The PROXY protocol prepends one line, `PROXY TCP4 198.51.100.7 203.0.113.10 51234 443`, so backends learn the client address without HTTP headers, and NAT keeps a conntrack table that can fill at 240,000 entries. Layer 4 balances connections and layer 7 balances requests, so long-lived HTTP/2 and gRPC connections leave new pods idle unless something balances per request or connections are aged out.
:::

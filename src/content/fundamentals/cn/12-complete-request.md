@part XII | The complete browser request | A typed URL combines naming, local forwarding, Internet routing, secure transport and application behavior in one observable exchange. Without reconciling their state, an explanation can jump from a hostname to a response while missing the return path. We will follow Finch's cold request, count the byte budgets, and diagnose failures by the last boundary that succeeded. | where:12

## 53. URL parsing, cache lookup and destination selection

Finch types `https://example.com` into a browser with no usable connection to the service. A **URL** names a scheme and authority plus optional path and other resource components. The scheme selects HTTPS semantics, the authority identifies the requested host, and the absent explicit port uses the HTTPS convention `443`. A fragment belongs to browser resource interpretation and is not part of the HTTP target sent to the server.

The browser may satisfy the request from a permitted representation cache. Otherwise it needs a destination address, using a valid name cache or its resolver. In our illustrative fresh DNS lookup the authoritative A result is `203.0.113.20`. The browser may consider several addresses, including IPv6 answers, but the fixed running trace chooses this IPv4 destination. A certificate will later authenticate `example.com`, not simply that IP literal.

@fig cn_url_cache | A usable local representation can finish the request before transport begins. A miss proceeds to the network and origin; freshness and policy decide whether local reuse is allowed.

The DNS record's `300` second illustrative TTL has `180` seconds remaining after `120` seconds. That result means the address can still be reused under the teaching assumption. It says nothing about whether the HTTP body is fresh or the server is healthy. DNS cache, HTTP cache and connection pool are separate stores with separate validity checks.

The kernel matches `203.0.113.20` against Finch's route table. It lies outside `192.168.10.64/26`, so the route chooses gateway `192.168.10.65`. ARP resolves that local gateway's MAC if the neighbour cache lacks it. Finch does not broadcast ARP for the remote server across the Internet. A switch forwards the resulting frame according to the gateway MAC, while the carried IP destination remains the server.

Before drawing another arrow, identify the chosen destination address, interface, next hop and cache state. A correct answer can then describe how a cached DNS result, cached representation or existing connection removes specific work. Saying the browser always performs every lookup and handshake would misdescribe ordinary reuse.

:::story Picture this
A traveler first checks whether the requested document is already on the desk. If it is not, an address book supplies the remote office, and a local transit map supplies the next station. The document cache, address book and transit map answer different questions even when one trip consults all of them.
:::

## 54. Ethernet, NAT and the routed return path

Finch sends a frame to the gateway MAC with source IP `192.168.10.70` and destination IP `203.0.113.20`. The gateway removes the link wrapper, evaluates the IP route and forwarding policy, decrements TTL and prepares the next link's frame. The old source and destination MACs do not travel unchanged across every routed hop.

The illustrative NAT rule translates source `192.168.10.70:51000` into `198.51.100.7:40001`. The server destination remains `203.0.113.20:443`. The gateway records enough mapping and protocol state to restore a matching return flow. Relevant checksums must match the changed headers. IP routing beyond the gateway follows the server destination, while each router creates link addressing for its own next hop.

@fig cn_tuple_trace | The IP destination survives the outbound NAT, while the private source becomes a public tuple. Orange marks the gateway mapping used to restore Finch's return destination. | narrow

The server's reply has source `203.0.113.20:443` and destination `198.51.100.7:40001`. Routers follow the public destination toward the gateway, which finds its mapping and restores `192.168.10.70:51000`. The gateway then needs Finch's local link address and an allowed return policy. A route to the remote service alone cannot establish that full path.

Finch's assumed `1,500` byte IP packet becomes a `1,518` byte Ethernet frame excluding physical preamble and inter-frame timing. A VLAN tag changes this frame-format count to `1,522`. Routing replaces the frame, while an overlay or tunnel adds a further budget. Do not subtract Ethernet overhead from the IP MTU twice.

Path asymmetry is permitted by IP. The reply need not use the exact reverse router sequence, but it must reach the NAT state responsible for the private endpoint. A failover gateway lacking that state can interrupt established flows. This is why gateway redundancy, route redundancy and state replication are related but separate design tasks.

:::warn Watch out
Keep MAC destination, IP destination and translated source separate. ARP chooses a local link destination, routing chooses a next hop for the IP destination, and NAT changes the tuple according to boundary state. None is a substitute for the other two.
:::

## 55. TCP, TLS, HTTP and reconciled costs

Finch establishes the TCP stream, authenticates `example.com` with TLS, then sends the HTTP request. Its TCP SYN uses sequence `1000`, so a first `1,460` byte data range starts at `1001` and ends immediately before acknowledgement `2461`. The bytes counted by TCP include whatever encrypted TLS record bytes it transports; a `1,460` byte TCP payload is not automatically `1,460` application-body bytes.

The simplified cold timing model assigns one `40` ms RTT to TCP establishment, one to a fresh TLS exchange and one to the HTTP request and first response. The sum is `120` ms. It excludes DNS, application computation, serialization and any additional response data. We cannot add the separately illustrative `5.67` ms one-link delay to every RTT without knowing what path that RTT already includes.

$$
t_{\text{cold}}=t_{\text{TCP}}+t_{\text{TLS}}+t_{\text{HTTP}}=40+40+40=120\ \text{ms}.
$$

Read this as cold first-response time equals the sequential transport, authentication and request-response delays under the stated assumptions. Reused connections remove setup dependencies. QUIC integrates transport and cryptographic establishment, changing this sequence rather than performing the identical TCP calculation on UDP.

@fig cn_budget | The illustrative cold trace counts each sequential RTT once. Orange marks the setup work that a valid reused connection can avoid. | narrow

| Boundary | Count or state | Contribution |
|---|---|---|
| Ethernet | `1,518` frame bytes | One local link wrapper |
| IPv4 | `1,500` packet bytes | Routed endpoint addressing |
| TCP | `1,460` payload bytes | Ordered transport byte budget |
| NAT | Private to public tuple | Restorable return destination |
| TLS | Verified host and keys | Authenticated encrypted exchange |
| HTTP | Method, headers and body | Resource operation and result |
| Window | `64,000` bytes | `12.8` Mb/s RTT-bound ceiling |
| Full-path BDP | `500,000` bytes | Data occupying a `40` ms path |

TLS records and HTTP headers consume some TCP payload, so this table does not claim an exact encrypted body size. It reconciles layers by naming each boundary's unit. Application service time and receiver reading can add independent bottlenecks even when the transport path meets its calculated rate.

:::note Transport bytes and body bytes
Count an application body only after specifying its HTTP framing, headers and TLS record overhead. A link-rate number, an IP MTU and a TCP payload budget are different measurements and cannot be substituted for one another.
:::

## 56. Layered diagnosis and the complete interview trace

Finch receives a `504` from a proxy. DNS, some route, transport establishment and enough TLS and HTTP parsing have already succeeded to produce that response. The remaining question is the proxy's upstream deadline. Treating every timeout as DNS failure discards the evidence already present in the response.

Work outward from a named observation. No usable interface suggests local configuration. A valid address without a route suggests route selection. An unresolved gateway neighbour suggests local link or ARP trouble. SYN retransmissions suggest a transport path, listener or policy problem. A TLS hostname failure suggests identity. A parsed HTTP error suggests an application-aware component. These are diagnostic categories, not mutually exclusive guarantees.

@fig cn_diagnosis | Each observed success narrows the next question. Orange marks the first failing boundary rather than blaming every layer at once. | narrow

At the whiteboard, follow the exact packet. The browser selects `203.0.113.20`, the route table sends the off-subnet destination to `192.168.10.65`, ARP supplies the gateway MAC, the switch forwards that frame, and NAT exposes `198.51.100.7`. Routes move the packet toward the server, TCP tracks bytes, TLS verifies the hostname, HTTP requests the resource, and the reverse tuple restores the response to Finch. A proxy, cache or cloud boundary can add another explicitly named exchange.

@fig cn_complete | The complete URL trace keeps one client, gateway, public translation and server in view. Orange marks the initial client work that selects the path before a response can exist. | narrow

Do not memorize the diagram as one mandatory packet schedule. Cached answers skip DNS work, cache hits can skip network delivery, reused connections skip establishment, and HTTP/3 replaces TCP with QUIC. The invariant is that every performed step has an owner, an input, a state transition and a failure condition.

This chapter leaves detailed routing policy engineering, radio design, cryptographic proofs and production packet-capture interpretation for deeper guides. It gives the foundation needed to ask those questions precisely. A strong interview answer names the branch assumptions first, then carries the same endpoints and byte units through every layer without unexplained jumps.

:::interview Interview lens
**"What happens when I type an HTTPS URL?"** I state whether representation caches, DNS answers and connections are reusable. For a cold IPv4 path I resolve the name, choose a route, resolve the gateway's MAC, and send frames carrying the server-destined IP packet through NAT and routers. TCP establishes byte state, TLS authenticates the hostname, and HTTP names the resource. The reply follows the public tuple back to NAT, which restores the private destination and delivers it through the local link.
:::

:::key In one breath
A URL trace starts by distinguishing reusable representations, names and connections. Local ARP reaches the gateway, IP routes the remote destination, and NAT remembers how to restore the reply. TCP, TLS and HTTP add ordered bytes, authenticated protection and resource meaning with separate costs. Diagnose the first failing boundary using observed successes, and change the trace explicitly when caches, proxies or QUIC change its assumptions.
:::

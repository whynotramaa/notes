@part IX | Proxies, tunnels and firewalls | Public requests commonly cross a policy boundary before they reach an application. Without a clear account of that boundary, logs can confuse the client, the proxy and the server, and a permitted port can look like permission for everything. We will route through proxies, select backends, wrap packets in tunnels, and identify the state targeted by common attacks. | where:9

## 42. Reverse proxies and TLS termination

Finch connects to a public service endpoint that forwards the request to a private backend. A **reverse proxy** accepts requests on behalf of servers and makes upstream requests or forwards traffic toward them. A forward proxy acts on behalf of clients instead. The distinction concerns whose access it mediates, not which direction an arrow happens to point.

An HTTP reverse proxy can inspect Host, path and headers, select an upstream, cache an eligible representation, compress a response and enforce a rate limit. If it terminates TLS, Finch authenticates the proxy's public certificate and the proxy can read HTTP plaintext. The backend connection then has its own encryption and authentication policy. End-to-end confidentiality stops at the termination point unless the application adds a further protection layer.

@fig cn_proxy | A reverse proxy accepts Finch's public request before creating an upstream exchange. Orange marks the server-facing intermediary that can route, cache and terminate TLS. | narrow

The backend's network peer is now the proxy, not necessarily `198.51.100.7`. Forwarded client metadata needs a trusted chain of intermediaries; accepting arbitrary client-supplied forwarding headers permits spoofed audit records or policy decisions. Timeouts also need ownership. A proxy can return `504` when its upstream deadline expires even if the backend eventually commits the operation.

Connection pooling lets a proxy reuse backend streams, but a pool can serialize or queue work at its own limit. Retries across that boundary must respect method semantics and request identifiers. A proxy retrying an uncertain state-changing operation can duplicate effects despite reliable individual TCP connections.

Nginx documents [HTTP proxying](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) through an upstream directive and related response behavior. The architectural question is where TCP and TLS end and where another exchange begins. Draw those terminations explicitly in an interview; saying the proxy merely passes the original connection through would misdescribe HTTP termination.

:::story Picture this
A hotel receptionist accepts a guest's request, calls the kitchen, and returns the result. The guest speaks to the receptionist while the kitchen speaks to the receptionist separately. If the receptionist records the guest's name, the kitchen must trust that record rather than assume its telephone caller is the original guest.
:::

## 43. Load balancing, health checks and sticky sessions

Finch's service has several backends, so the proxy must choose who receives the next request. **Load balancing** distributes work across targets according to an algorithm and a view of target health. It does not make independent copies of application state consistent.

### L4 and L7

An L4 balancer selects using transport and network information, commonly choosing a target for a connection. An L7 balancer understands application messages and can route by HTTP host, path or other request properties. TLS termination is often necessary for an intermediary to inspect encrypted HTTP, which adds certificate and plaintext responsibilities.

Round robin rotates through targets; weighted round robin changes their allocation shares. In the illustrative equal-weight sequence, `9` requests over `3` targets give `3` requests each. Least connections chooses the target with fewer active connections, which can misrepresent load if one connection carries much more work. Hashing a key keeps related work together; consistent hashing limits remapping when membership changes.

@fig cn_lb | L4 chooses using a connection tuple while L7 can choose using HTTP fields. Orange marks the request-aware layer that can route Finch's path to a specific service. | narrow

A health check samples a target through a probe. It can detect a dead listener yet miss a failing dependency unless its probe tests that dependency deliberately. Failover removes or avoids a target after the configured evidence, but existing connections and requests still need recovery. A timeout is evidence of a missed deadline, not proof a target never executed the request.

**Sticky sessions** keep related clients on the same backend. They can reduce state transfer but create uneven load and complicate target failure. If login state exists only on that machine, moving Finch elsewhere may lose its session. Choose whether the application uses a shared store, replicated state or acceptable session loss before promising failover. A load balancer distributes capacity; it does not erase the state ownership question.

:::warn Watch out
A healthy TCP port does not prove an application can serve a complete request. Align the health check with the failure you want to detect, while avoiding a probe that overloads a dependency or removes every target during a transient shared failure.
:::

## 44. Forward proxies, VPNs and tunnels

Finch can send an ordinary packet inside another packet to cross a network with a different addressing policy. A **tunnel** encapsulates traffic under an outer carrier and removes that wrapper at another endpoint. A **VPN**, or virtual private network, combines a logical private path with authentication, encryption or other policy appropriate to its design.

A forward HTTP proxy handles a client's web requests; an HTTPS CONNECT tunnel can carry encrypted bytes without inspecting their HTTP content. A SOCKS proxy relays application connections under its own negotiation. An SSH tunnel forwards selected ports over an authenticated SSH connection. A VPN instead commonly installs a virtual interface and routes selected network traffic through it, potentially covering several applications.

@fig cn_tunnel | The inner packet retains its endpoint meaning while an outer header identifies tunnel endpoints. Orange marks the protected carrier crossing the untrusted segment. | narrow

WireGuard and IPsec are different protocol families for protecting network traffic. WireGuard associates cryptographic peers with allowed addresses, while IPsec policies and security associations define protected packet handling. Naming a VPN product does not specify which routes are installed, where DNS goes or what happens if the tunnel drops. A split route sends selected destinations through the tunnel; a default route can direct most traffic there.

Encapsulation spends a byte budget. Finch's unwrapped `1,500` byte packet cannot fit unchanged inside another `1,500` byte path allowance after an outer header is added. The sender needs a smaller inner MTU, supported fragmentation or packet-too-big feedback. Otherwise large transfers may stall while small probes succeed.

A tunnel moves the trust boundary rather than abolishing it. Its exit can observe unprotected application traffic, and the peer still needs authorization to reach destinations inside the private network. [WireGuard's protocol description](https://www.wireguard.com/protocol/) distinguishes cryptographic transport from ordinary packet routing. An interview answer should name the inner endpoints, outer endpoints, route selection and payload budget.

:::note Tunnel MTU
An encapsulated packet needs room for both headers. If only small packets work through a tunnel, inspect its effective inner MTU and the return path for packet-too-big feedback before blaming application parsing.
:::

## 45. Stateless and stateful firewalls

Finch's server permits inbound TCP `443`, but it should not expose every listener on the machine. A **firewall** evaluates traffic against rules that name addresses, protocol, direction, ports and sometimes connection state. **Ingress** means traffic entering the relevant boundary and **egress** means traffic leaving it. Always name the boundary; one packet can be egress from a container and ingress to a bridge.

A stateless filter evaluates each packet independently. A stateful firewall uses **connection tracking** to associate packets with an observed exchange. It can permit replies to admitted flows without allowing every unsolicited packet on a client's temporary port. Tracking state is a resource with memory and expiry costs, especially for UDP mappings without transport establishment.

@fig cn_firewall | A new inbound HTTPS flow passes an explicit rule, while return traffic follows admitted connection state. Orange marks permission for the named service, rather than general host access. | narrow

Finch's outbound tuple changes from `192.168.10.70:51000` to `198.51.100.7:40001`. NAT state restores the return destination, while firewall state decides whether the packet may cross. These can share implementation machinery without becoming the same policy. An address translation is not proof that every allowed application request is authorized.

Rule ordering and default policy matter. An earlier broad allow can make a later narrow deny ineffective. Blocking ICMP indiscriminately can also obstruct useful path-MTU feedback. A drop gives the sender no immediate rejection, whereas a reject may return a protocol-appropriate indication. Both choices affect diagnosis and should express the intended exposure.

A firewall seeing only encrypted TCP bytes cannot enforce an HTTP path policy without another inspection boundary. Conversely, an application authorization check cannot protect a kernel service exposed through an unrelated port. Explain defenses by the state each can observe and the decision each makes. That is more useful than treating a firewall as a general guarantee against malicious content.

## 46. Sniffing, spoofing, floods and replay attacks

Finch's gateway receives an unsolicited ARP update claiming the attacker's interface owns the gateway address. The attack targets local next-hop identity before any HTTP request exists. **Spoofing** means presenting a false source or identity; **packet sniffing** observes available traffic; a **man-in-the-middle attack** positions an intermediary between intended peers to observe or alter an exchange.

ARP spoofing poisons a local mapping, while DNS poisoning supplies a false name answer. IP spoofing forges a source address but does not ordinarily give the attacker the return route needed for a normal TCP handshake. TLS hostname verification can detect an impostor service even if lower-layer redirection succeeds, although compromised keys or trust anchors change that conclusion.

@fig cn_attacks | Attacks target distinct mappings and state tables. Orange marks ARP's local address binding; the matching defense must address that binding or authenticate above it. | narrow

A SYN flood consumes pending connection resources. SYN cookies can defer some server allocation by encoding state into the server's sequence response, with capability tradeoffs. A distributed denial-of-service attack can exhaust bandwidth before packets reach the server firewall, requiring filtering or absorption upstream. Application rate limits help when the service can still admit and classify requests; they cannot recover an already saturated access link.

A **replay attack** reuses previously valid traffic or credentials. TLS record protection rejects ordinary record replay within its established context, but permitted early data and application retries need their own replay policy. Session hijacking uses a stolen bearer credential; Secure and HttpOnly reduce particular theft paths without making an injected script harmless.

Finch's CRC remainder `001` detects selected accidental bit errors and offers no peer authentication. An attacker can recompute a CRC after modifying plaintext. Pair each defense with its threat model, such as encrypted authenticated transport for intercepted content, anti-spoofing policy for forged sources, secure resolver practices for name answers, and bounded admission for state exhaustion. There is no single layer that addresses them all.

:::interview Interview lens
**"Does HTTPS protect against every network attack?"** It authenticates the intended server and protects the established application's exchanged bytes. It cannot prevent a link from being saturated, repair a wrong local route, or stop an authorized application from processing harmful input. DNS and ARP attacks can still redirect or deny traffic even when certificate checking blocks impersonation. I choose defenses according to the resource or identity being attacked.
:::

:::key In one breath
Reverse proxies create a server-facing boundary that can terminate TLS and make a separate upstream exchange. Load balancers distribute work but require health and session-state policies. Tunnels add a carrier and an MTU cost, while firewalls decide which flows may cross a named boundary. Security defenses must match the mapping, identity or resource an attack targets.
:::

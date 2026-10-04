@part II | L4 and L7 load balancing | A balancer can only choose from the information it can inspect. Connection routing cannot distribute requests hidden inside an established encrypted connection. We will compare transport and application decisions, follow multiplexed traffic, and design draining for long-lived sockets. | where:2

## 5. L4 load balancers

A viewer opens an encrypted connection to Heron. Before inspecting any HTTP path, infrastructure can choose a destination from transport information. An **L4 load balancer** routes at the transport layer, usually using addresses, ports and connection state rather than application request contents.

The usual TCP decision occurs when a connection is established. The balancer sends its packets to the selected backend while preserving the connection's transport contract through forwarding, translation or proxying. These implementations have different source-address and state requirements. State used to recognize the flow must survive long enough to keep later packets on the correct path.

For Heron's 50,000 persistent viewers and an illustrative limit of 10,000 connections per gateway, the nominal minimum is $\lceil50000/10000\rceil=5$ gateways. Read this as rounding connection demand divided by per-gateway capacity upward. This is not failure capacity. Losing one of five leaves four, which would each need $50000/4=12{,}500$ connections, above the declared limit.

@fig sd_tr_l4 | Transport routing fixes a connection's backend. Orange marks the chosen flow; later HTTP requests inside it keep that transport destination.

L4 routing suits protocols the balancer should forward without understanding their application messages. Encrypted HTTP path routing is unavailable when the balancer does not terminate or parse the relevant application protocol. TLS handshake metadata may support some routing, but that still does not reveal a later encrypted URL path.

The failure case is assuming connection count represents request cost. A connection carrying a busy multiplexed API client can require much more application work than an idle viewer socket. L4 balancing distributes its chosen unit, and an application or later proxy may still need request-level control. The design must name both units when they differ.

:::story Picture this
A railway junction sends a whole train onto one track. It can see where the train came from and where the track leads, but it does not sort individual parcels hidden inside the carriages. A sorting depot later opens the parcels and routes each by its address. The junction and the depot distribute different units of work.
:::

## 6. L7 load balancers

One client sends both score reads and uploads through a shared connection. Sending that entire connection to one application pool is too coarse. An **L7 load balancer** interprets an application protocol so it can choose destinations for requests using hostnames, paths, methods or other allowed metadata.

For HTTPS request routing, the component must obtain the HTTP messages, commonly by terminating TLS. It can select a service from `/scores` or `/clips` and then select an endpoint within that service. It may reuse different upstream connections even while the client uses one persistent connection. The client-side and upstream-side protocols need not be identical.

Heron's candidate deployment receives an expected 50 requests per second when its request routing weight is 5 percent of the 1,000-per-second peak. A transport policy assigning 5 percent of connections does not promise the same request fraction if clients send unequal work. That difference is the reason to state whether the policy samples connections, users or requests before quoting a percentage.

@fig sd_tr_l7 | One client connection carries requests that reach different upstream pools. Orange marks request-level routing after the protocol becomes visible.

Application parsing adds CPU, memory and configuration work. The proxy needs limits on body size, headers and active streams, and it must handle streaming responses without retaining unlimited buffers. A route matching the wrong prefix can send a valid request to an unintended service. Configuration review and explicit route precedence therefore matter as much as the algorithm choosing a server.

L7 visibility is useful for logs and per-route policy, but a logging feature must not record private bodies by default. The design pays for inspection to make particular decisions. If the only decision is which healthy endpoint receives an opaque connection, the extra application parser may not be necessary.

:::note Termination and pass-through
TLS pass-through preserves the encrypted application conversation toward its endpoint. TLS termination lets the proxy inspect the application message and establishes a new security boundary. Neither choice alone determines whether the internal hop is encrypted or whether the application trusts the caller.
:::

## 7. HTTP/2 multiplexing and balancing units

Server A has 100 connections but only 5 active requests. Server B has 10 connections carrying 200 active HTTP requests. A least-connections policy sends the next connection to B even though B is doing more request work.

**Multiplexing** allows independent request streams to share a connection. Connection count then becomes a poor estimate of application load. A request-aware proxy can track unfinished requests per backend and use that signal, while an opaque transport balancer cannot infer it from the encrypted packet count alone.

The illustrative ratios are $5/100=0.05$ active requests per connection on A and $200/10=20$ on B. Read them as request activity divided by transport connections at the sampled instant. The values describe this constructed snapshot, not a fixed relationship for HTTP/2. An active-request count still ignores differences between a small score read and an expensive search query.

@fig sd_tr_multiplex | Illustrative connection and request counts disagree. Orange marks server B's active request load, which its smaller socket count conceals.

To select a signal, identify the scarce resource. For a gateway retaining viewer sockets, connection count can track memory and file descriptors. For a request-processing API, outstanding requests or measured service load may be more useful. For a transcoder, queued worker-seconds may matter more than either. A generic policy name does not resolve those workload differences.

The edge case is a proxy that balances requests but pins all streams for one authority to a single upstream connection. Its endpoint selection and connection-pool behavior can still concentrate traffic. Inspect how the implementation chooses a host for a new stream, and distinguish fairness at assignment from fairness of completed work. Part III measures that second difference with round robin.

:::warn Watch out
A connection is not always one active request. HTTP multiplexing and idle keep-alive sockets make the counts diverge. State the routing unit and load signal before claiming that a policy sends work to the least busy server.
:::

## 8. WebSocket affinity and connection draining

A Heron viewer has a WebSocket connected to gateway A when a deploy starts. A new routing weight cannot relocate that established socket to gateway B. The connection belongs to A until it closes or fails.

**Connection draining** stops assigning new work while letting existing work finish under a deadline. For ordinary requests, the proxy can wait for their responses. For long-lived sockets, waiting indefinitely would prevent the deploy from finishing. The application needs a reconnect protocol with a retained cursor or last-seen sequence so the replacement gateway can resume delivery.

Suppose A owns 10,000 connections and reconnects are spread across 20 seconds. The average reconnect rate is $10000/20=500$ per second. If each viewer missed 5 seconds of a 20-event-per-second stream, each needs $5\times20=100$ replayed events. The reconnecting cohort therefore needs $10000\times100=1{,}000{,}000$ replay deliveries, or 200,000,000 payload bytes at 200 bytes each.

@fig sd_tr_drain | Illustrative drain and reconnect sequence. Orange marks resuming from the viewer's cursor; changing routing weights affects new connections.

These are separate loads. Spreading reconnects limits handshakes, while bounded replay protects event storage and gateway output. If the cursor predates retention, the client needs a fresh snapshot followed by a consistent live position. Reconnect cannot promise recovery of data no longer retained.

The gateway must also remove a draining endpoint from new assignment before terminating it. Otherwise clients reconnect to the same server and close again. A shutdown sequence coordinates readiness, routing propagation and a grace period rather than treating process exit as the only event. Part V builds the timing of endpoint removal.

:::interview Interview lens
**"Can a load balancer move an existing WebSocket to another server?"** It cannot transfer the application's live socket and state merely by changing a route. I stop new assignments, close or drain existing sockets, and let clients reconnect with a resume cursor. I size handshakes and replay separately so a deploy does not overload the survivors.
:::

:::key In one breath
L4 balancing usually selects a transport connection's endpoint, while L7 balancing can select individual application requests. Multiplexing makes connection count and active work diverge. A live WebSocket remains owned by its gateway until reconnect. Draining therefore needs endpoint removal, a deadline and a cursor-based recovery contract rather than only a new weight.
:::

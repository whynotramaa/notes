# Initial expansion snapshot. Canonical markdown includes later editorial fixes; do not rerun blindly.
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
folder=root/'src/content/system-design/networking'

def replace_part(prefix, text):
    path=next(folder.glob(prefix+'-*.md'))
    opener=path.read_text().split('\n',1)[0]
    path.write_text(opener+'\n\n'+text.strip()+'\n')

replace_part('01',r'''
## 1. The first request starts before HTTP

You enter `scores.heron.test/matches/m7` in a browser. The browser cannot send that string directly to an arbitrary machine. It first needs an address, a port, a transport connection, and a way to verify that the endpoint represents the requested name. The page's visible loading time includes that preparation as well as the eventual score read.

The URL separates these decisions. The scheme says which application exchange to use, the host names the service, and the path identifies a resource at that service. **DNS**, the Domain Name System, resolves names into typed records. An address record gives a destination address; it does not contain the score, choose the database query, or establish a connection.

A **client** initiates an exchange, and a **server** accepts it at a defined endpoint. Those are roles, not permanent machine identities. Heron's application is a server to the browser and a client to its database. Keeping the roles local to each exchange helps explain which side owns a timeout, sends an acknowledgement, or holds a waiting connection.

@fig sd_networking_url_decisions | Illustrative URL decomposition. Name lookup, connection setup, and resource lookup are different work.

### The first useful distinction

A browser may already have an address cached or a suitable live connection. In that case it can skip some preparation. If the cache is empty and no connection exists, the cold request pays more work. That is why two users can read the same score from the same application code and observe different latency.

A successful name lookup proves only that the resolver returned records. The chosen address may be unreachable, point to an old deployment, or accept a connection that later fails verification. We will follow each boundary separately rather than calling the entire preparation step 'the network.'

:::note The namespace is illustrative
The `.test` name is a teaching name. None of the addresses or timing values in this chapter describe a live Heron deployment. Literal identifiers such as `m7` name example records, not measured counts.
:::

## 2. A DNS lookup, message by message

Suppose the browser has no cached answer. A **stub resolver** is the small resolver on the client that asks a configured **recursive resolver** to find an answer. A recursive resolver performs the lookup work on the client's behalf. The recursive resolver may already have a suitable cached record and answer immediately.

If it has no relevant cache, the recursive resolver asks a root server where to find the requested top-level domain's authority. It then asks a top-level-domain server where the named zone's authority lives, and finally asks an **authoritative server**, which serves that zone's records. These intermediate answers are referrals. They point toward the answer rather than supplying the application response.

For an illustrative fresh lookup, count one client-to-recursive request, then three recursive-to-authority request/response exchanges: root, top-level domain, and zone authority. That is four logical request/response exchanges. This simplified count omits address lookups for name servers, aliases, retries, DNSSEC work, and transport setup. It explains the dependency order rather than promising an exact packet count.

@fig sd_networking_dns_sequence | Illustrative uncached lookup with four logical request/response exchanges. Referrals are followed by the recursive resolver.

@fig sd_dns_path | A cached record can end the walk before all authority levels are contacted.

### Aliases and record types

An `A` record maps a name to an IPv4 address, while `AAAA` maps it to IPv6. A `CNAME` gives an alias to another name, which may require another resolution step. The browser and network can choose among returned addresses using their own connection policy. One name therefore need not identify one permanent machine.

The record's owner and type matter. A cache can hold the name-server referral even when it has no final address. On the next lookup, the resolver can start closer to the zone authority. The root is not contacted for every page view; it is contacted when the lookup needs information not already available from a suitable cache.

:::story Picture this
A receptionist can give you the department's room number or tell you which building's receptionist maintains that directory. The second answer is a referral. Following referrals finds the room, but nobody in that chain delivers the document you came to collect.
:::

## 3. TTL, expiry, and deployment changes

Heron moves the score service to another address. The authoritative DNS record changes, but a viewer's recursive resolver still has the old record. A **TTL**, or time to live, limits how long that cached record can be reused under the resolver's caching rules. It is not a broadcast that erases all caches when the authority changes.

Use an illustrative timeline. The resolver caches the old address at time 0 with a 60 s TTL. The authority changes the address at time 20. A lookup at time 30 can still use the old address because only 30 s of its cached lifetime have elapsed. A lookup at time 61 needs a refreshed answer under this simplified expiry policy. The computed remaining cache lifetime at the authority change is 40 s.

@fig sd_networking_dns_expiry | Illustrative seconds from initial caching. The address can stay cached after the authority changes it.

Lowering the TTL immediately before the change does not shorten a previously cached record's original lifetime. To influence caches before a scheduled migration, publish the shorter lifetime early enough for earlier answers to expire. Keep the old endpoint serving during the overlap. A rollback also has a cache propagation window.

### Connections have their own lifetime

Even a refreshed resolver cannot move a connection that is already established. A WebSocket can continue exchanging data with the old gateway while new connections use the new address. DNS expiry and connection draining are separate mechanisms. Heron needs a plan for both if the old process must disappear.

Long cache lifetimes reduce lookup work and can help during an authority outage. Short lifetimes permit quicker endpoint changes but increase refresh traffic and dependency on the resolver path. Choose the lifetime using the deployment and failure contract, not a blanket rule that smaller is always better.

:::warn Watch out
Do not shut down the old endpoint merely because the authoritative record now names the new one. Cached answers and existing connections can still reach the old endpoint. Observe and drain those paths before removal.
:::

## 4. A timeout does not identify the failed component

The browser receives no answer and eventually reports a loading failure. That observation could mean a resolver timeout, an unreachable address, a refused connection, failed certificate verification, or an application that accepted the request and never replied. The user sees one symptom, but the corrective action differs at each boundary.

A **round-trip time**, or **RTT**, is the elapsed time for a message to travel to a peer and for a response to return. RTT differs from application execution time. A distant server can answer a trivial query slowly because of transit; a nearby server can answer slowly because it waited on a lock. Measure those costs separately before proposing a larger machine.

For the simplified lookup above, four serial exchanges at an assumed 10 ms RTT each contribute 40 ms. That computation deliberately treats each exchange's RTT as the same illustrative value and omits processing and setup. It shows why a cold dependency chain adds delays even when each participant does little local work.

@fig sd_networking_lookup_budget | Illustrative serial lookup budget: four assumed 10 ms exchanges sum to 40 ms.

:::interview Interview lens
**"A DNS migration completed but some clients still reach the old server. Why?"** Some resolvers can still reuse an earlier answer until its lifetime expires, and established connections do not consult DNS again for every message. I would keep the old endpoint available, inspect cached-answer age, and drain connections under a separate policy. Changing the record is one step in the migration, not evidence that every path has moved.
:::

## 5. TCP delivers bytes, not application messages

The browser now has a suitable address and opens a connection. **TCP** presents a reliable, ordered byte stream while the connection operates. A stream means the receiver sees bytes in sequence, without preserved boundaries matching each sender write. Sending `hello` in one write does not promise one corresponding receiver read.

TCP assigns sequence positions to bytes and uses acknowledgements to learn what the receiver has accepted. Missing data can be retransmitted; duplicate data does not become a second piece of the delivered stream. The receiver may buffer later bytes while waiting for a gap. Flow control limits what the receiver can accept, while congestion control adjusts sending to the network path's conditions.

Use a tiny illustrative message stream. The application encodes `A`, `B`, and `C` as three sequential units. The unit carrying `B` is lost, while `A` and `C` arrive. TCP can deliver `A`, but it must not deliver `C` ahead of the missing bytes if the application expects ordered stream delivery. After retransmitted `B` arrives, delivery can continue with `B` and `C`.

@fig sd_transport_order | Illustrative loss of the middle unit. TCP buffers later bytes behind the missing sequence range.

### Framing belongs above the byte stream

Heron must know where one request or event ends. HTTP framing, a length prefix, or a defined delimiter can provide that boundary. A parser must handle a header split across reads, several messages arriving in one read, and a peer ending the stream mid-message. Treating each read as one message is a common implementation error.

A completed transport send still does not prove that the application committed the score. The receiving process can accept bytes, parse them, begin a transaction, and crash before commit. Or it can commit and lose the reply. Durable operation identity will later let us resolve that uncertainty.

## 6. UDP and application-owned recovery

A live video decoder may prefer a newer frame to a late fragment of an old one. **UDP** sends separate datagrams without a delivery or ordering guarantee from the transport. Each received datagram preserves its own boundary, but a datagram can be missing, duplicated, or reordered. The application must decide which of those events matter.

Suppose Heron sends illustrative updates with sequence labels A, B, and C. If B disappears and C arrives, a datagram application can choose to display C as the latest replaceable snapshot. That choice is valid only if the update is a self-contained snapshot. If C means 'add another point,' skipping B can create an incorrect score.

@fig sd_networking_datagram_effect | A missing snapshot can be replaced by a newer snapshot; a missing delta needs recovery. Labels are illustrative events.

UDP does not mean 'there can be no reliability.' QUIC builds secure connections, ordered streams, loss recovery, and congestion control over UDP. The transport substrate and the application's exposed guarantee are separate questions. Choosing UDP is useful only with a clear plan for the behavior the application needs.

:::key In one breath
DNS turns a name into records through cached answers and referrals. TTL bounds cached reuse, while established connections follow their own lifetime. TCP provides ordered bytes and requires application framing; UDP provides datagrams and leaves recovery semantics above it. Neither transport proves that a remote business operation committed.
:::
''')

replace_part('02',r'''
## 7. What an HTTP exchange actually contains

The browser asks Heron for a score and the server sends a representation. **HTTP**, the Hypertext Transfer Protocol, defines the meaning of that exchange. A request has a method, a target, fields, and sometimes content. A response has a status and fields plus content when its semantics allow it. A method's defined behavior matters because clients and intermediaries make decisions from it.

A **representation** is data describing a resource at some point, such as a JSON score document. The resource is the concept identified by the URI; the representation is the bytes used to describe it. Heron can return JSON for an application and HTML for a human without treating them as unrelated matches.

In the illustrative read, `GET /matches/m7` asks for the current match representation. A successful response can include a validator that lets a later request ask whether its cached representation is still suitable. Authentication, resource permission, freshness, and error policy remain application decisions. HTTP gives the exchange a vocabulary; it does not know which scorer owns a match.

@fig sd_networking_http_message | Illustrative request and response fields. The payload is a representation of the match.

### Methods and side effects

A **safe method** is intended to retrieve information without requesting a state change. **Idempotent method semantics** mean repeating the intended operation has the same intended effect. A GET can still cause incidental server work such as logging; that does not make the client request a new score. A method label is useful only when the application honors its semantics.

If Heron puts a score-changing action behind an ordinary GET link, a crawler, prefetcher, or retrying intermediary can invoke it as though it were a read. Use an appropriate command contract and explicit permission checks. We will later add operation identity to handle uncertain command retries.

## 8. HTTP/1.1 and ordered responses

The score and thumbnail are independent, but they share a connection. HTTP/1.1 sends messages over a byte stream and supports persistent connections. A connection can carry later requests after earlier exchanges instead of repeatedly opening a new transport. That saves setup work and lets congestion behavior continue across requests.

HTTP/1.1 also defines request pipelining, but responses to pipelined requests must appear in request order. Suppose the score request is first and waits on a database lock, while the later thumbnail is ready. The thumbnail response cannot simply appear before the score response on that pipelined connection. The application's ordered response contract creates waiting between otherwise independent work.

@fig sd_networking_http1_wait | Illustrative HTTP/1.1 pipelined requests. Response order follows request order.

Browsers and clients have often used several connections instead of relying on pipelining. Separate connections can avoid that particular ordered-response wait, but each connection has its own setup, congestion state, and resource cost. More connections are a workaround with costs, not evidence that the operations became one atomic application request.

:::story Picture this
A service counter promises to hand out receipts in ticket order. A simple request behind a slow request waits even if its clerk already finished. Opening another counter can help, but it adds another line and another clerk.
:::

## 9. HTTP/2 frames and streams

HTTP/2 lets the score and thumbnail make independent progress over one connection. A **frame** is a protocol unit carrying a piece of control information, fields, or data. A **stream** is one logical exchange identified within that connection. Frames from different streams can interleave, so one response need not finish before another response starts.

Use an illustrative 2,000-byte response split into 500-byte data pieces. The split produces four data pieces, because $2,000/500=4$. This is a teaching choice, not the protocol's frame-size limit or a claim about one actual implementation. A thumbnail frame can appear between two score frames, and the client associates each piece with its stream rather than interpreting arrival order as response ownership.

@fig sd_networking_http2_frames | Illustrative interleaving. Stream labels identify exchanges, while data pieces remain associated with their own stream.

### The transport still has an ordered stream

HTTP/2 runs over TCP. If a TCP segment is missing, TCP cannot deliver later bytes past the gap even when those later bytes contain a complete frame for another HTTP stream. This is **head-of-line blocking**, where an earlier missing or unfinished item delays later useful work behind it. HTTP/2 removes HTTP/1.1's response-order constraint but does not remove TCP's ordered-byte constraint.

Flow control also matters. A receiver can limit stream and connection data so a fast sender does not create unlimited buffered bytes. A stalled stream and a saturated connection are different problems. Inspect which flow-control boundary is exhausted before attributing every pause to packet loss.

@fig sd_http_streams | Multiplexed application exchanges can still share transport waiting and congestion limits.

:::warn Watch out
'Multiple streams' does not mean 'unlimited concurrent work.' Stream limits, connection flow control, application queues, and shared backend capacity can still make requests wait.
:::

## 10. HTTP/3 and independent stream delivery

Imagine the lost bytes belong to the score stream while the thumbnail's data has arrived. HTTP/3 maps HTTP exchanges onto **QUIC**, a secure transport that uses UDP and implements its own connection and stream behavior. QUIC streams have independent ordered delivery, so missing bytes in the score stream need not prevent delivering complete bytes of the thumbnail stream.

The improvement has a precise boundary. Data inside the score stream still waits for its missing part. Congestion control and the connection's resources still couple the streams' total sending capacity. A server waiting on the same database lock can still block both application responses even when the transport could deliver them independently.

@fig sd_networking_quic_gap | Illustrative loss in one stream. Independent delivery does not remove shared congestion or application limits.

QUIC also supports connection identity that can survive some changes to network addressing under its protocol rules. A viewer switching networks may avoid some reconnection work when the endpoints and policy support it. That is not a promise that a connection can move to any new application process with no state transfer.

| Question | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Application framing | Messages | Binary frames | HTTP frames over QUIC |
| Concurrent exchanges | Often separate connections | Multiplexed streams | Multiplexed streams |
| Main transport | TCP | TCP | QUIC over UDP |
| Missing transport data | Delays later connection bytes | Delays later connection bytes | Delivery gap is stream-local |
| Application bottleneck removed? | No | No | No |

:::note Protocol history
The [HTTP/2 specification](https://www.rfc-editor.org/rfc/rfc9113) explains its TCP mapping and multiplexing. The [HTTP/3 specification](https://www.rfc-editor.org/rfc/rfc9114) explains the QUIC mapping. Compare mechanisms rather than treating the version number as a universal latency ranking.
:::

## 11. TLS authentication and record protection

A network observer should not read the scorer's session cookie or alter a score response. **TLS**, Transport Layer Security, establishes a protected channel and authenticates the endpoint under a configured trust model. For a normal browser connection, the server proves possession of a key tied to a certificate acceptable for the requested hostname.

The client checks the certificate chain against trusted issuers and verifies the requested identity, then the handshake establishes traffic secrets. Protected records provide confidentiality and integrity for subsequent bytes. A packet capture can still reveal information such as endpoints, timing, and sizes; encrypted content is not a promise that every metadata fact disappears.

@fig sd_networking_tls_checks | Conceptual TLS checks before treating the peer as the requested service. Exact handshake details depend on the protocol and mode.

### Where protection ends

**HTTPS** is HTTP carried over TLS. If the public proxy terminates TLS, it sees plaintext HTTP and becomes part of the trusted processing path. A separate protected connection to the backend can protect the next network hop, but the proxy still has access to the data between them. Encryption in transit does not mean an intermediary doing decryption cannot read it.

TLS verifies the service endpoint, not the scorer's right to change match `m7`. Heron still checks session identity, match assignment, and command validity. An authenticated service can have an authorization bug, and an encrypted attacker request can still exploit it. Name each guarantee at the boundary that enforces it.

## 12. Cold requests, warm requests, and reused protection

A fresh connection can spend more time preparing than reading a tiny score. Assume illustrative costs of 40 ms each for DNS, TCP setup, TLS setup, and the HTTP exchange. Their sum is $40+40+40+40=160$ ms. Under the stated warm-connection scenario, a suitable cached name and established connection leave the 40 ms exchange.

@fig sd_tls_sequence | Illustrative serial preparation budget, not a universal packet or handshake count.

Real traces differ. A resolver cache can remove lookup work, TLS resumption can change setup, QUIC combines transport and security differently, and application execution adds its own delays. Overlapping or parallel work must not be added as though it were serial. Measure the critical path the user actually waits for.

### Resumption still needs replay rules

Some secure connection modes permit early application data during resumption. Early data can have replay limitations: an attacker may cause the server to observe an early operation more than once. Heron must not casually accept a non-idempotent score mutation in a mode whose replay contract does not protect it. Transport optimization must fit application effect semantics.

:::interview Interview lens
**"Why can a warm request be faster even when the server code did not change?"** It can reuse a resolved endpoint and an established protected connection, removing setup from the critical path. I would inspect DNS, connect, handshake, and server time separately. The illustrative 160 ms to 40 ms change comes from stated assumptions, not a universal promise of connection reuse.
:::

:::key In one breath
HTTP defines message meaning, while protocol versions change framing and sharing. HTTP/2 multiplexes streams over TCP; HTTP/3 uses independently delivered QUIC streams. TLS authenticates and protects a connection at named termination boundaries. Count cold and warm critical paths separately, and keep application authorization and replay safety explicit.
:::
''')

replace_part('03',r'''
## 13. REST begins with resources and a uniform interface

A viewer wants the match, not knowledge of which database function Heron calls. **REST**, representational state transfer, is an architectural style that organizes interactions around resources and a uniform interface. A URI identifies the match, a representation describes it, and standardized method semantics express what the client requests. JSON is one possible representation format; using it does not by itself make an API REST.

The resource model matters when the implementation changes. `/matches/m7` can remain the same identifier while Heron moves state between database owners or changes the query plan. A client that calls `/runStoredProcedureUpdateMatch` instead exposes an implementation action as its public model. Sometimes a command-oriented interface is appropriate, but call the contract what it is.

REST's constraints include a separation between client and server, stateless requests, cacheability rules, a uniform interface, and a layered system. **Stateless** means a request carries the information needed to understand that interaction rather than relying on hidden conversational state at a selected server. It does not mean the application has no database, authentication state, or persistent resources.

@fig sd_networking_rest_boundary | Illustrative resource contract. The public identifier survives a change in internal storage.

### A read and a command

A viewer reads `GET /matches/m7` and receives a score representation. A scorer submits a command through a contract that checks identity, permission, a stable command key, and possibly an expected version. A request can be stateless in the architectural sense while the command still reads authoritative state and records a durable result.

Do not choose methods by how short their names are. Clients use safe and idempotent semantics to decide which requests they can prefetch, cache, or retry. A correct resource contract states validation and conflict behavior as clearly as the happy-path representation. The API unit will develop pagination, versioning, and concurrency preconditions in more detail.

## 14. gRPC follows a typed method contract

A transcoding worker asks an internal service to create a specific output job. **gRPC** describes remote methods through a service definition and commonly uses Protocol Buffers for messages. Generated clients and servers agree on method names, field identities, message types, and service behavior. The wire encoding is compact, but the main teaching point is the explicit contract.

A **unary RPC**, or remote procedure call, sends one request and receives one response. Server streaming sends a sequence of responses for one request; client streaming accepts a sequence of requests; bidirectional streaming allows both sides to send sequences. The application must still define which messages acknowledge work, whether ordering is sufficient, and how to recover a broken conversation.

@fig sd_networking_grpc_modes | The four gRPC conversation forms. Message direction differs from the durability of an effect.

### A tiny contract example

Heron's internal `GetMatch` method can accept a match identifier and a required version position. Its response contains a score and the observed position. The schema supplies named fields; the service supplies the guarantee that it waits, redirects, or rejects when it cannot satisfy the position. Generated code cannot derive that promise from the types alone.

A deadline travels with the call rather than restarting at each service. A client that gives an internal operation the original full budget after spending most of it upstream can exceed the user deadline. gRPC provides deadline and status mechanisms, but the handlers must honor cancellation and make effect recovery explicit.

For public browser clients, proxy and browser protocol support can shape the deployment, including a gateway or gRPC-Web adaptation. A typed internal API is useful only when deployment, debugging, and schema evolution fit the teams using it. Compare those operational needs with a resource-oriented HTTP interface rather than declaring one universally better.

:::note Contract evolution
Adding a field is not the same as changing an existing field's meaning. Readers can remain wire-compatible while silently disagreeing about units or semantics. Preserve field identity and document semantic changes as part of the service contract.
:::

## 15. WebSocket gives a persistent two-way message channel

A chat participant must send messages while also receiving them. **WebSocket** establishes a persistent bidirectional channel with protocol-defined message framing. After its opening handshake, either peer can send a message without starting a new HTTP request for that message. This helps conversations with frequent two-way traffic.

The server stores a live connection and its subscription or room state. When Heron receives a score update, the gateway can send the new version to subscribed viewers. The application defines payload type, event identifier, ordering rules, error messages, and whether it sends acknowledgements. A WebSocket message reaching the peer does not mean the peer displayed it or durably recorded it.

@fig sd_networking_websocket_lifecycle | Illustrative connection lifetime. Subscription state belongs to an owner and must be recoverable after reconnect.

### Why connection management becomes part of the application

A silent connection may be idle, disconnected, or attached to a paused process. Heartbeats help detect loss of recent contact; they do not prove that a missing peer has stopped permanently. A reconnect needs authentication, subscription restoration, and a policy for events missed during the gap.

The gateway also needs a **send buffer**, memory containing bytes waiting for a peer to receive them. If one viewer reads slowly, that buffer can grow. Bound it and decide whether to coalesce self-contained score snapshots, disconnect the slow viewer, or provide a replay route. Delta events that must all be applied cannot be discarded as though they were replaceable snapshots.

A connection is one live delivery path, not the authoritative event history. Heron keeps the history elsewhere so a gateway restart does not erase score events. The real-time unit will count gateway memory, heartbeats, fan-out, and recovery traffic.

## 16. SSE gives the server a one-way event stream

A score viewer mostly needs updates from Heron rather than a two-way message conversation. **Server-sent events**, or **SSE**, send text events over an HTTP response stream. A browser's EventSource interface can parse event records and reconnect. Normal HTTP requests can still carry client commands separately.

An SSE event can contain data, an event type, and an identifier. If the connection breaks, the browser can supply its last received event identifier when reconnecting. The identifier is useful only when the server knows how to interpret it and has retained enough suitable history. It is not a browser-created backup of every missed event.

Use illustrative event identifiers 7, 8, and 9. The viewer receives 7 and disconnects before 8. On reconnection it reports 7; Heron can replay 8 and 9 if they remain available and correspond to the subscription. If 8 has expired, the server sends a suitable current snapshot and a new continuation boundary instead of pretending that no gap occurred.

@fig sd_networking_sse_replay | Illustrative SSE recovery. The server must retain or reconstruct the history named by the last event identifier.

### Buffering and deployment

A proxy that buffers the whole response can turn a live stream into a delayed batch. Long-lived response paths need suitable flushing, idle timeouts, and capacity policy through every intermediary. SSE's HTTP form does not exempt it from connection limits or resource use.

| Decision | WebSocket | SSE |
|---|---|---|
| Main message direction | Both ways | Server to client |
| Browser interface | WebSocket | EventSource |
| Payload form | Text or binary messages | Text event fields |
| Automatic browser reconnect | Application policy | EventSource behavior |
| Durable replay supplied? | No | No |
| Suitable simple role | Two-way conversation | One-way update feed |

:::warn Watch out
A last event identifier is a request for recovery, not proof that recovery is possible. Verify retention and subscription meaning. A server must declare when it falls back to a snapshot rather than silently skipping a gap.
:::

:::interview Interview lens
**"Would you use WebSocket or SSE for live scores?"** For a primarily one-way browser score feed I would first consider SSE, with a retained event or snapshot recovery contract. Frequent two-way messages can justify WebSocket. In both cases I would define bounded buffers, heartbeats or idle detection, authentication, and reconnection before calling the delivery design complete.
:::

:::story Picture this
A live radio feed can tell you what happened now, but it cannot replay yesterday unless someone recorded the broadcast. The connection is the feed; the retained log is the recording. Reconnecting restores the feed, while replay needs the recording too.
:::

:::key In one breath
REST exposes resources through a uniform interface and gRPC exposes typed remote methods. WebSocket gives a persistent two-way message channel; SSE gives a server-to-client HTTP event stream. Neither live transport supplies durable replay by itself. A conversation needs a bounded buffer, an identity contract, and a recovery boundary.
:::
''')

replace_part('04',r'''
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
''')

replace_part('05',r'''
## 21. A timeout bounds a particular wait

A score read stalls while acquiring a database connection. A caller needs to stop waiting after the result is no longer useful. A **timeout** gives a bound to a named wait, such as connecting, acquiring a pool slot, writing bytes, or reading a response. The name of the wait is part of the meaning; a socket read timeout does not necessarily bound the whole operation.

Consider a client that receives a tiny response fragment before each read timeout expires. Each read can remain within its limit while the complete response takes far too long. Likewise, a call can spend separate full timeout budgets connecting, acquiring, executing, and retrying. A set of individually bounded waits can still exceed the user-visible budget.

@fig sd_networking_timeout_scopes | Different timeout scopes protect different waits. A total operation boundary must cover the complete path.

### Cancellation is another message

When a caller stops waiting, it can ask downstream work to cancel. The downstream process might observe that request before executing, during a cancellable operation, after committing, or never. A timeout is an observation made by the caller, not a distributed rollback.

Heron must return a useful uncertainty contract for a command whose outcome is unknown. The client can retrieve status or retry using the same operation key. Treating timeout as guaranteed failure can repeat an effect that already committed. Treating it as success can hide an effect that never began.

## 22. A deadline bounds the whole operation

A viewer has an overall 500 ms illustrative budget. A **deadline** names the latest time by which the complete operation should finish. Each downstream call receives the remaining useful budget, accounting for time already spent and time reserved to return a response. The deadline prevents every nested call from restarting the original clock.

Assume 40 ms for network transit and 60 ms reserved for returning the final result. The application starts with $500-40-60=400$ ms of useful work budget. If admission and authentication consume 120 ms, the remaining useful budget is 280 ms. The database call should not receive a fresh 400 ms just because it starts later.

@fig sd_networking_deadline_trace | Illustrative useful-budget propagation. Consumed time subtracts from the same original budget.

$$B_{\text{child}}=\max\left(0,B_{\text{parent}}-t_{\text{spent}}-t_{\text{reserve}}\right)$$

Read this as: child budget $B_{\text{child}}$ is the nonnegative parent budget after elapsed work $t_{\text{spent}}$ and reserved completion time $t_{\text{reserve}}$ are subtracted. All terms use the same time unit. Reserve time once at the appropriate boundary; repeatedly subtracting the same reservation at every hop can unnecessarily exhaust the request.

Use monotonic elapsed-time measurement within a process, rather than trusting a wall clock that can jump. Cross-process deadline propagation also needs a contract for clock uncertainty or remaining duration. The protocol or framework can help carry it, but the service must still respect it when scheduling work.

:::story Picture this
You have a train to catch. Every errand receives the time left before departure, not the time you had when you left home. An errand that starts late does not earn a new train departure time.
:::

## 23. Retrying begins with a failure classification

A database node becomes temporarily unreachable. A repeat attempt against a suitable available owner may succeed. But an invalid match identifier or a forbidden scorer does not become valid after waiting. A **retry** repeats an attempt after a failure or uncertain result; the policy must distinguish transient failure, permanent rejection, and unknown completion.

Retrying a read can still create harmful load. Retrying a write also creates correctness risk unless its intended effect is safe to repeat. Heron checks operation identity before applying a repeated command. The retry preserves that key and the intended payload, instead of generating a fresh command each time the connection fails.

@fig sd_networking_retry_classes | The next action depends on the failure class. Uncertain completion requires operation identity, not a new command.

### Limits belong in the policy

Choose a maximum attempt count, a total time budget, and a budget for additional load. A **retry budget** limits repeated work so failure cannot consume all capacity needed for first attempts. A service near overload may need fewer retries, not more, because another attempt has a low chance of completing and a high chance of extending the queue.

Some responses give an explicit retry delay or indicate a transient overload contract. Respect that advice within the client's deadline. Do not retry every status or exception by default. Explain which failure could have changed between attempts and how that change makes another attempt useful.

:::warn Watch out
A retry that creates a new idempotency key is a new business operation. It does not recover the uncertain original operation. Preserve the original identity across transport and process retries.
:::

## 24. Exponential backoff slows repeated demand

A dependency takes time to recover. Immediate retries consume its remaining capacity before it can catch up. **Exponential backoff** increases the delay after successive failed attempts, usually to a cap. The idea is to give the dependency more recovery time without choosing one large fixed delay for every brief failure.

Use an illustrative base of 100 ms and cap of 800 ms. Attempt indices 0, 1, 2, 3, and 4 produce delay ceilings of 100, 200, 400, 800, and 800 ms. The cap stops the ceiling growing, but it does not cap the total operation duration. A separate attempt limit and deadline still determine when the caller stops.

@fig sd_networking_backoff_steps | Illustrative base and capped ceilings in milliseconds. These are calculated examples, not recommended production settings.

### Jitter separates synchronized callers

**Jitter** randomizes delay so callers that fail together do not all retry together. Full jitter samples between zero and the current capped ceiling. With the example ceilings, expected delays are 50, 100, 200, 400, and 400 ms under a uniform distribution. An individual attempt can wait less or more than that mean.

$$d_k\sim U\left(0,\min(c,b2^k)\right)$$

Read this as: attempt index $k$ waits a random duration $d_k$ uniformly between zero and the smaller of cap $c$ and base $b$ doubled $k$ times. The distribution describes the sampling rule, not a deterministic delay. A large fleet spreads attempts across the interval rather than producing one spike at its right edge.

Jitter does not make the duplicated work disappear. Some attempts can occur soon after a failure, so source admission still matters. Backoff is a timing tool within a bounded policy, not a replacement for capacity control or safe effects.

## 25. Nested retries multiply leaf attempts

The client, gateway, service, and database driver can each believe it owns recovery. A driver failure then causes its caller to repeat a whole operation that includes more driver retries. Attempt counts multiply because each retry at one level can create a fresh set of attempts below it.

Use an illustrative three layers with at most three attempts at each. One original request can create three gateway attempts, nine service attempts, and twenty-seven database attempts. At Heron's 1,000 original requests per second, the theoretical leaf-attempt rate is 27,000 per second if all paths exhaust their budgets. The original useful workload was still only 1,000 requests per second.

@fig sd_retry_amplification | Illustrative worst-case nested attempt counts. Actual work also depends on deadlines and early successes.

### Put recovery at an informed boundary

Choose one layer that knows the operation's identity, failure classes, remaining budget, and suitable target. Other layers can provide transport behavior within that policy instead of independently restarting the business action. A low-level retransmission of missing transport bytes is different from retrying an entire score command.

During a recovering dependency outage, limit new work as well as retries. Otherwise a retry budget can be bounded while fresh arrivals still overwhelm the service. Observe useful completions, duplicate attempts, queue age, and deadline expiry together.

:::interview Interview lens
**"Why did retries turn a small outage into a larger one?"** Repeated work raised demand while the dependency's capacity was already reduced. Nested attempt limits can multiply, and synchronized timing can create bursts. I would establish one informed retry owner, bound added load, propagate deadlines, and add jitter for suitable transient retries.
:::

:::key In one breath
Timeouts bound particular waits and deadlines bound complete operations. Cancellation does not prove that a remote effect stopped. Retry only a failure that may usefully change, while preserving operation identity and bounding additional work. Backoff and jitter spread attempts, but nested retries can still multiply the dependency load.
:::
''')

replace_part('06',r'''
## 26. A lost reply creates uncertainty about the effect

The scorer submits a correction. Heron commits it, then the connection closes before the scorer receives the reply. The scorer knows the operation did not finish visibly, but it does not know whether the effect happened. A second request can be necessary for recovery while also risking a second effect.

**Idempotency** means repeating the same intended operation produces the same intended effect as applying it once. It does not require every response byte to match, nor does it mean the operation ran no code on later attempts. A repeated request can validate, look up a recorded result, and return that result without applying the score correction again.

Consider two payload meanings. 'Set the total to 10' can have an idempotent effect if all relevant preconditions and concurrent-write rules are defined. 'Add 10' normally changes the total again each time it is applied. Neither phrase alone solves a lost reply under concurrent updates; an operation identity and version contract make the intended command explicit.

@fig sd_networking_set_add | Illustrative repeated effects on a starting total of zero. Command identity can make a non-idempotent arithmetic action safe to retry as one operation.

### Intended effects and incidental work

A retried request can create another log entry or increase a retry metric while its business effect remains one score correction. Specify what the guarantee covers. If the command charges a payment provider or sends an email, those effects need their own duplicate handling rather than being dismissed as incidental logging.

A timeout can occur before acceptance, while the effect is in progress, or after commit. The client should use the same command key to recover from every uncertain attempt. A freshly generated key tells Heron that this is a different operation.

## 27. Record identity and outcome in one commit

Heron accepts a **command key**, a stable identifier for one intended operation. It records that key, a payload fingerprint, the authorized scope, and the result. The **payload fingerprint** is a representation that lets the service detect whether another request with that key describes the same command. Its design must avoid treating differently meaningful requests as equivalent.

The score change and command result must share an atomic commit boundary. If the service commits the score first and the key later, a crash between them leaves an applied effect with no deduplication evidence. If it records success first and the effect later, a crash can leave a recorded success for a change that never occurred. Separate commits create opposite incorrect histories.

@fig sd_networking_commit_gap | Either order of separate commits has a crash gap. The key and protected effect belong in one transaction.

A unique constraint on the scoped command key lets the database arbitrate concurrent duplicates. A preliminary 'key not found' read is insufficient: two requests can both observe absence. The second insertion must conflict with or wait for the first transaction, then recover its committed outcome or retry after its rollback.

@fig sd_idempotency_state | The uniqueness check, protected state change, and stored result share the same commit boundary.

### A concrete recovery trace

Request A claims key K and starts the correction. Request B arrives with K while A is not finished. B must not independently apply the effect. Under the chosen database protocol it waits, observes a pending operation, or retries after a conflict. When A commits, B verifies the fingerprint and returns the stored result. If A rolls back, a later attempt can legitimately acquire K and apply the command.

The service returns a conflict when K is reused with a different command meaning. Silently returning the earlier result hides a client error. A key should also be scoped appropriately so one user's operation cannot retrieve another user's private result merely by guessing the identifier.

## 28. Retention and external effects limit the guarantee

A deduplication record consumes storage and cannot be removed without changing the retry contract. If Heron forgets K and a delayed retry arrives, that retry can look new. Choose a supported retry window and retain enough evidence through it. Expiring a response payload may be acceptable while keeping a compact identity tombstone, depending on the product contract.

For an illustrative exercise, Heron supports retries for 24 hours and stores identity evidence for 48 hours. A retry at hour 12 can recover the recorded operation; one at hour 36 is outside the declared client retry window even though evidence may still be present. The extra retained interval is an assumed policy margin, not a proof against arbitrary delayed requests.

@fig sd_networking_key_retention | Illustrative retry and retention windows. The supported client window must fit within the evidence policy.

### A local key cannot atomically wrap every remote action

Suppose a notification worker sends an email, then crashes before recording success in Heron's database. Repeating the worker may send another email. A local transaction cannot include the provider's unrelated commit just because the application opened it first. The provider needs an idempotency contract, or Heron must accept duplicates and reconcile using a suitable delivery model.

For a recoverable score event, Heron can commit an outbox record with the score change and publish it later. Publication may repeat; consumers still identify events and avoid repeated business effects. Idempotency belongs at every uncertain effect boundary, not merely at the first public HTTP endpoint.

:::warn Watch out
Do not call a key table 'exactly once' without naming the protected effect, retention window, and atomic transaction. A remote provider and an expired identity record can both leave an unprotected boundary.
:::

## 29. Polling, long polling, and push spend different resources

A viewer wants to know when the score changed. **Polling** asks repeatedly at a chosen interval. It is simple to recover because each request can fetch a current snapshot, but empty checks consume request capacity. Under Heron's illustrative 50,000 viewers and 5 s interval, polling creates $50,000/5=10,000$ requests per second even before counting ordinary API demand.

If event arrival is uniformly distributed relative to that polling phase, the wait to the next poll is uniform from zero to 5 s. Its mean is $5/2=2.5$ s. That calculation depends on the arrival-phase assumption; synchronized events, correlated polls, and failed requests change the observed delay.

@fig sd_poll_cost | Illustrative repeated-check rate. The live audience produces more polling demand than Heron's ordinary API peak.

**Long polling** holds one request until a suitable event or timeout, then the client opens another. It removes many empty short requests but holds request or connection state while waiting. With one outstanding wait per viewer, the illustrative audience can have 50,000 held requests. Timeout and reconnect bursts still generate traffic.

**Push** sends updates over an established channel such as SSE or WebSocket. It avoids asking repeatedly whether anything changed, but it requires connection ownership, bounded buffers, subscriptions, and recovery. Polling can recover with a fresh snapshot; push must also explain a missed interval. Neither choice eliminates the events' delivery bytes.

@fig sd_networking_delivery_resources | Polling spends repeated requests; held and persistent paths spend waiting state. The figures show different units rather than comparing them as bar lengths.

### Choose using the useful update contract

A feed of replaceable current snapshots can coalesce intermediate versions for a slow viewer. A transaction ledger cannot discard events the same way. Decide whether the client needs every change, the latest state, or a bounded-delay notification before choosing a transport.

:::story Picture this
You can repeatedly phone a shop to ask whether an order is ready, stay on hold until it is ready, or ask the shop to call you. The methods spend repeated calls, waiting lines, or callback records. None changes how much work the shop needs to finish the order.
:::

:::interview Interview lens
**"Can I safely retry a POST after a timeout?"** Only when the application's effect is duplicate-safe under the declared retry contract. I would preserve the original operation key, record its effect and result atomically, reject payload mismatches, and check retention. A method label cannot resolve whether a remote effect already committed.
:::

:::key In one breath
A lost response leaves an uncertain effect. Stable identity plus an atomic effect-and-result record makes a supported retry recoverable. Retention and remote actions define the limits of that guarantee. Polling, long polling, and push shift resource costs while preserving the need for an update and recovery contract.
:::
''')

replace_part('07',r'''
## 30. Trace one score read through every boundary

A viewer asks for match `m7` and Heron chooses an uncached authoritative read. The client resolves the name, selects an address, establishes a suitable protected connection, and sends the resource request. The proxy admits it, chooses a ready application, and forwards the request. The application checks the viewer's permission, acquires a bounded database connection, and reads a version suitable for the contract.

The response returns through a representation encoder, proxy, protected connection, and client parser. A useful trace records the same request identity across the hops and distinguishes time spent executing from time spent waiting. A server span that lasts a long time may contain a pool wait or lock wait rather than continuous CPU work.

@fig sd_network_end_to_end | Illustrative uncached score read. The connection and application hops have separate timeout and recovery boundaries.

### A worked critical-path budget

Use an illustrative warm read with 40 ms for the network exchange, 20 ms for proxy and admission, 30 ms for authentication and permission work, 10 ms for pool acquisition, 60 ms for query execution and its waits, and 40 ms for encoding and response handling. Assuming those costs are serial, their sum is 200 ms.

| Serial stage | Assumed duration | Computed cumulative time |
|---|---|---|
| Network exchange | 40 ms | 40 ms |
| Proxy and admission | 20 ms | 60 ms |
| Identity and permission | 30 ms | 90 ms |
| Pool acquisition | 10 ms | 100 ms |
| Query and waits | 60 ms | 160 ms |
| Encode and return | 40 ms | 200 ms |

These values explain one example, not a measurement of Heron or a recommended split. If stages overlap, sum the critical path instead of every duration. If one query takes longer, record its actual distribution rather than preserving the example total by silently shrinking another stage.

@fig sd_networking_read_time | Illustrative cumulative serial durations. Every duration and cumulative sum is reproduced in the networking computation script.

### What a failed trace tells us

A resolver error prevents the address choice. A connect failure means no suitable transport was established. A TLS failure means the protected endpoint contract was not established. An application rejection can be a valid permission decision. A lost response after a command requires operation recovery because the effect may already be committed.

Name the boundary before recommending a retry. If authentication failed, another database replica is irrelevant. If the database pool wait exhausted the deadline, opening more viewer sockets does not create database capacity. The complete path shows both which component owns the problem and which caller can reduce demand.

## 31. Count work without mixing units

Heron's daily API count of 8,640,000 divided by 86,400 seconds gives 100 requests per second on average. The illustrative peak multiplier of 10 gives 1,000 requests per second. With 2,000-byte responses, the peak API payload rate is 2,000,000 bytes per second, or 16,000,000 bits per second. Headers, encryption overhead, retransmission, ingress, and connection setup are additional traffic.

Using the illustrative mean duration of 0.2 s at that peak, mean in-flight requests are $1,000\times0.2=200$ in a stable observation window. This is a count of work in progress, not a count of sockets. Idle keep-alive sockets have no active request, while a multiplexed socket can carry several requests at once.

@fig sd_network_budget | Computed API payload calculation shown as rows. Bytes, request rate, and byte rate have different units and should not share quantitative bar lengths.

### Live delivery is another workload

The live service emits 20 events per second to 50,000 viewers. That produces 1,000,000 recipient deliveries per second. At an assumed 200 bytes per delivery, it carries 200,000,000 payload bytes per second. The viewer-side fan-out is much larger than one copy of the incoming event stream, so sizing the gateway from producer event rate alone misses its main work.

| Workload | Multiplication | Computed payload rate |
|---|---|---|
| API responses | 1,000 responses/s times 2,000 B | 2,000,000 B/s |
| Event input | 20 events/s times 200 B | 4,000 B/s |
| Viewer delivery | 20 times 50,000 times 200 B | 200,000,000 B/s |

@fig sd_networking_live_counts | The producer stream and viewer fan-out count different network paths. All sizes and rates are illustrative inputs or computed totals.

A five-gateway nominal split at the assumed 10,000 connections each fits 50,000 viewers. It leaves no connection headroom if one gateway disappears. The performance and real-time units turn that observation into a failure-capacity and reconnect calculation. Never confuse a nominal division with a tested production recommendation.

## 32. Give every component one job and one recovery story

A whiteboard diagram is complete only when each box changes a useful decision or owns a required state. DNS locates candidate endpoints. TCP or QUIC implements the chosen transport behavior. TLS authenticates and protects a connection. The proxy admits and routes requests. The application enforces resource semantics and permission. The database supplies a defined read or committed effect.

A live gateway adds connection and subscription ownership, while the retained event source adds replay. A command-key record adds recovery after uncertain completion. These are distinct jobs. Putting them inside one deployment does not make their failure boundaries disappear; splitting them into services does not automatically improve them.

@fig sd_networking_component_jobs | A reference card for the complete request. The recovery job is as important as the happy-path job.

### The interview version of the trace

Start with what the user is allowed to do and what a response means. Draw the request's path, then name the state and deadline at each boundary. Follow a lost response, a stale address, a busy pool, and a resumed old connection through the same diagram. Only after that choose a balancing policy, cache, or extra replica that solves a demonstrated problem.

This chapter follows messages and bounded waits. It does not teach packet-level TCP implementation, complete cryptographic proofs, database consensus internals, or measured production tuning. Those boundaries deserve their own material. The next unit counts throughput, percentile latency, queue growth, and failure headroom for the path we can now draw.

:::interview Interview lens
**"Walk me through a score read, including what can go wrong."** The client resolves a suitable endpoint, establishes a protected connection, and sends a resource request through admission and routing. The application checks permission and reads suitable state with bounded pool and execution waits. I distinguish setup, execution, and queueing in the trace, and I recover uncertain commands using their original identity rather than treating a timeout as proof of rollback.
:::

:::key In one breath
A complete request crosses naming, transport, protection, routing, permission, and state boundaries. Trace the critical path and assign each wait a deadline and owner. Keep request counts, connection counts, producer bytes, and viewer-delivery bytes in their own units. A strong design explains recovery using the same state and identities as the happy path.
:::
''')

# Keep native section numbers continuous across the complete revised unit.
number=0
for path in sorted(folder.glob('[0-9][0-9]-*.md')):
    if path.name.startswith('99-'): continue
    def renumber(m):
        global number
        number+=1
        return '## '+str(number)+'. '+m[1]
    path.write_text(re.sub(r'^## \d+\. (.*)$',renumber,path.read_text(),flags=re.M))
print('Networking revision:',number,'continuous sections')

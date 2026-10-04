@part III | REST, gRPC, WebSockets and SSE | We choose how the application expresses work. The wrong conversation creates needless waiting or a confusing contract. We will compare REST, gRPC, and the transports used for live updates. | where:3

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

@part III | SSE and WebSockets | We choose what the established channel can carry. Direction, framing, and reconnect behavior differ even when both look like push. We will trace SSE records, the WebSocket opening, frames, and authenticated subscriptions. | where:3

## 9. SSE is an HTTP event stream

The viewer opens a response with the event-stream media type. The server sends text records separated by blank lines. **Server-sent events**, or SSE, is a server-to-client event stream carried over HTTP and commonly consumed by a browser's EventSource interface.

An illustrative record contains `id: 102`, `event: score`, and `data: {"score":121}` followed by a blank line. The blank line completes dispatch of the event. Multiline data fields are assembled according to the format, so arbitrary JSON bytes must be framed correctly rather than written as if every newline meant a new event.

@fig sd_realtime_sse | Illustrative SSE record components. Actual data encoding must follow the event-stream text format.

[The HTML event-stream specification](https://html.spec.whatwg.org/multipage/server-sent-events.html) defines event fields and the Last-Event-ID reconnect behavior. A reconnect cursor does not create server replay storage. Heron must retain events or supply a snapshot when the cursor is too old. SSE's directionality suits a spectator receiving scores while ordinary HTTP handles commands.

:::story Picture this
A radio announcer speaks to listeners over a continuing broadcast. Listeners send questions through another route. A two-way walkie-talkie provides a different conversation shape. SSE and WebSockets likewise differ in application directionality, though both still need identity and missed-message recovery.
:::

## 10. WebSockets open a different conversation

A scorer and server need to exchange live messages in both directions. **WebSocket** is a protocol for bidirectional framed messages after an opening handshake. In the traditional HTTP opening, the client requests an upgrade and the server confirms it before the connection switches to WebSocket framing.

The application then exchanges text or binary messages without a fresh HTTP request per message. That saves repeated request framing and permits asynchronous messages in either direction. It does not make the connection durable across process failure, nor does it guarantee application ordering beyond the connection's transport behavior.

@fig sd_realtime_websocket | Illustrative traditional opening and application message trace. The acknowledgement is an application design choice.

The gateway should not register product subscriptions before completing the opening and authentication boundary. A failed upgrade remains an HTTP error under the chosen path, not an established socket. After opening, parse and validate every application message independently. The connection being valid does not make a malformed or unauthorized command valid.

[RFC 6455](https://www.rfc-editor.org/rfc/rfc6455) specifies the opening and framing rules. Intermediary support and newer HTTP mappings are deployment details to verify. A load balancer that supports ordinary short HTTP responses may still need explicit upgrade, idle-timeout, and drain configuration for a long-lived channel.

## 11. Frames and messages have separate boundaries

A large application message can be split across several transport frames. A **frame** is one protocol unit with header fields and a payload. A **message** is the application-visible text or binary unit, potentially assembled from multiple frames. Control frames such as Ping, Pong, and Close have their own protocol rules.

For an illustrative unfragmented 200-byte WebSocket payload, the length needs an extended length field. The server frame header is four bytes under the specified framing layout. A client frame also includes a four-byte masking key, giving 204 server bytes or 208 client bytes before transport and encryption overhead. These are protocol-format calculations, not complete network packet sizes.

@fig sd_realtime_frames | Computed illustrative frame sizes for unfragmented 200-byte payloads under RFC 6455. Lower-layer overhead is excluded.

Masking is not encryption. Its purpose is separate from confidentiality, so use TLS for protected transport. Bound complete message size as well as frame size; otherwise many small fragments can accumulate an unbounded application message. Validate message type and content before routing a command into authoritative state.

:::note SSE needs intermediary configuration too
Response buffering can delay a correctly emitted event until a proxy collects more bytes. Compression and buffering settings, idle timeouts, and connection reuse affect observed behavior. Test through the actual edge and proxy chain rather than only against a local server.
:::

## 12. Authenticate the channel and each action

A connection proves only that a peer reached the gateway. The service must establish an authenticated identity and authorize subscriptions or commands. A **subscription** binds a connection to a declared topic or resource. A viewer permitted to read one match must not obtain another private match by changing a topic string.

The opening can use a secure session or another reviewed credential flow. Browser APIs differ in which headers they let the application set, so do not invent a universal bearer-header mechanism for every SSE or WebSocket client. Query-string credentials can enter logs and URLs, which makes their use and lifetime a deliberate security decision.

@fig sd_realtime_subscription | Illustrative channel setup. Resource authorization occurs before membership in the delivery set.

A long-lived connection outlives some credentials and permissions. Revalidate at a stated boundary, react to revocation, and authorize every command independently of subscription state. Do not keep a revoked private channel open indefinitely because its handshake succeeded yesterday. The system's security chapter develops this boundary in greater detail.

:::warn Watch out
Do not expose a broker's internal wildcard subscription syntax directly to clients. The gateway should map a validated product resource to an allowed internal topic. Otherwise a user-controlled subscription can widen scope far beyond the authorization check.
:::

:::interview Interview lens
**"SSE or WebSockets for live scores?"** SSE fits server-to-viewer updates while commands remain ordinary HTTP. WebSockets fit sustained bidirectional messages or binary payloads. Both need permission checks, intermediary timeout testing, event identity, and replay or snapshot recovery. The transport does not supply a durable history automatically.
:::

:::key In one breath
SSE frames server events as an HTTP text stream with declared reconnect behavior. WebSockets establish bidirectional framed messages with separate control and data rules. Payload bytes exclude protocol and lower-layer overhead. Authenticate the peer, authorize every resource and command, and test the real intermediary path.
:::

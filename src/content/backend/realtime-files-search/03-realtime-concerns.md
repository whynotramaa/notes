@part III | Realtime application concerns | We handle the problems that appear once a connection carries real users' data. A long-lived socket outlives the token that opened it, crosses origins in surprising ways, and can fill the server's memory if the client stops reading. We will cover authentication and origin checks, authorization and ordering, and backpressure for slow consumers. | where:3

## 8. Authenticating a WebSocket

Ordinary API requests carry a bearer token in the `Authorization` header, Unit III. A browser's `WebSocket` API cannot set custom headers on the handshake, so that path is closed for web clients. Three options remain, and each has a catch.

**Cookies** are sent automatically on the handshake to the same site, so a session cookie authenticates the socket with no extra work. The catch is cross-site WebSocket hijacking, below. **A token in the query string**, `wss://rt.wren.example/ws?token=eyJ...`, works everywhere, but URLs are written to proxy and server access logs, browser history and analytics, so a long-lived access token in a URL is a credential leaked to every log reader. **A token in the first message**, sent after the connection opens, avoids logs, but the server must hold an unauthenticated connection until it arrives and close connections that do not authenticate within a few seconds.

Wren uses a fourth pattern that combines their strengths, a **ticket**. The app, already authenticated to the API, calls `POST /ws-ticket` with its bearer token. The API returns a random, single-use ticket, `t_9fk2`, stored in Redis with user 42's id and a 30 s expiry. The app opens `wss://rt.wren.example/ws?ticket=t_9fk2`. The WebSocket server redeems the ticket, deleting it so it cannot be reused, binds user 42 to the connection, and proceeds. A ticket in a log is worthless seconds later.

@fig be_ws_auth | Trade a bearer token for a 30-second single-use ticket, then open the socket with the ticket.

Browsers do not apply CORS to WebSockets. Any page on any site can open a WebSocket to `rt.wren.example`, and if the socket authenticates by cookie, the browser attaches the victim's Wren cookies. A malicious page can then read the victim's realtime data and send messages as them, an attack called **cross-site WebSocket hijacking**, the WebSocket cousin of CSRF from Unit II. The defence is to check the `Origin` header on the handshake against an allowlist, `https://app.wren.example` and the mobile apps' configured origins, and reject anything else with 403. Ticket and token schemes are not vulnerable in the same way, since an attacker's page cannot obtain the victim's ticket, and Wren checks the origin anyway.

@fig be_ws_cswsh | A page on another site opens a socket and the browser sends the victim's cookies. The Origin check refuses it.

Connections can last hours, longer than the access token that authorized them, which lasts 15 minutes. Wren's server records the token's expiry with the connection, asks the client to send a fresh token over the socket before it expires, and closes connections with code 1008 if it does not arrive. Logging out or revoking a session publishes an event that closes that user's open sockets everywhere.

## 9. Authorization, ordering and delivery

Authentication says who is on the connection. **Authorization** must still be checked for everything they do on it, exactly as for HTTP requests, Unit IV. When user 42 subscribes to `order:124`, the server checks that order 124 belongs to user 42 before sending any updates, the same ownership check that prevents IDOR on the REST endpoint. When a restaurant dashboard subscribes to `restaurant:9`, the server checks that the connection's user belongs to restaurant 9's tenant. And every message a client sends, such as a courier's location update or a chat message, is validated and authorized like an API request.

Authorization must be rechecked when it can change. If a support agent loses access to restaurant 9 while their dashboard is open, their subscription must end, which means the server re-evaluates subscriptions on permission-change events, or periodically, rather than trusting a decision made hours earlier.

**Ordering** within one connection is simple. TCP delivers bytes in order, so messages sent on one socket arrive in the order they were sent. Ordering across sources is not. If the kitchen's "cooking" event and the courier service's "picked up" event travel through different paths to the WebSocket server, they can arrive in either order. Wren includes a version number for each entity in its messages, `order 124, version 7`, and the client ignores any update older than the version it has, the same technique as Unit VIII's event consumers.

**Delivery** guarantees depend on the design. A plain WebSocket gives at-most-once, since messages sent while a client was disconnected are lost. Part II's sequence numbers and replay buffer give at-least-once for recent messages. For anything that must not be lost, such as a chat message, the sender keeps it until the server acknowledges, the server stores it durably before acknowledging, and receivers fetch missed messages from storage on reconnect rather than relying on the socket. The socket is a fast notification channel, and durable state lives in the database.

## 10. Backpressure and slow consumers

The server writes messages to a connection's socket, and the kernel sends them as fast as the client's network and TCP window allow, Unit IX. If the client is slower than the stream of messages, because a courier's phone is on a weak signal or a dashboard's browser tab is in the background, the kernel's send buffer fills, and further writes queue in the server's own memory for that connection.

Without a limit, that queue grows for as long as the client is slow. A server pushing restaurant 9's busy dashboard updates at 20 per second to a tab that receives 2 per second accumulates 18 messages per second, and across thousands of slow clients, memory grows until the server is killed. A single slow consumer can also delay messages to fast ones if the server's writing logic is not careful, for example by processing connections in sequence.

@fig be_ws_backpressure | Two clients drain their buffers quickly. One in a tunnel fills its buffer to the limit.

Every WebSocket server needs a per-connection send limit and a policy for reaching it, Unit IX's backpressure applied to sockets. Wren's limit is 1 MB per connection, measured by the server library's buffered byte count, which browsers expose to clients as `bufferedAmount`. When it is reached, the server applies a policy that depends on the channel. **Coalescing** keeps only the latest message per entity, so a dashboard that missed ten updates to order 124's status receives only the newest, which is all it needs. **Dropping** discards low-priority messages, such as typing indicators. **Disconnecting** closes the connection with code 1013, try again later, so the client reconnects and resumes from its sequence number, which is cheaper than buffering indefinitely.

Backpressure also runs the other way. A client that floods the server with messages, buggy or malicious, gets a per-connection rate limit, Unit X, and a maximum message size, with violations closing the connection with code 1008 or 1009. And the server's own inbound processing must be bounded, so a burst of courier location updates queues briefly and sheds old positions rather than piling up.

:::story Picture this
A newsagent delivering papers to subscribers by bicycle. Most houses take the paper from the letterbox at once. One house is away on holiday, and the papers pile up on the step. A sensible newsagent does not keep stacking papers until the step collapses. They leave only today's paper, or stop delivering and leave a note saying "call us when you are back, and we will bring the issues you missed".
:::

:::note Separate realtime servers
Wren runs WebSocket and SSE endpoints on a separate fleet, `rt.wren.example`, rather than on the API servers. Long-lived connections have different scaling, memory and deploy needs from short requests, and isolating them means a reconnect storm cannot exhaust the API's capacity, the bulkhead idea from Unit X.
:::

:::warn Watch out
Putting long-lived access tokens in WebSocket URLs writes them to every access log on the path. Use short single-use tickets, or send the token in the first message, and make sure query strings on realtime endpoints are redacted in logs.
:::

:::interview Interview lens
**"How do you secure a WebSocket endpoint?"** Use wss only. Authenticate the handshake with a short-lived single-use ticket obtained through the authenticated API, or a cookie plus a strict Origin check against an allowlist to prevent cross-site hijacking, and never log long-lived tokens in URLs. Bind the user to the connection, re-verify before the access token expires and close on revocation. Authorize every subscription and every incoming message like an API request, limit message size and rate per connection, and bound each connection's send buffer, coalescing, dropping or disconnecting slow consumers.
:::

:::key In one breath
Browsers cannot set headers on WebSocket handshakes, so cookies, query tokens and first-message tokens each have a catch, and Wren trades its bearer token for a single-use ticket valid for 30 s, while checking Origin against cross-site hijacking, since CORS does not apply. Every subscription and incoming message is authorized like an API call and rechecked when permissions change, ordering across sources uses per-entity versions, and anything that must not be lost lives in storage with acknowledgements. Each connection's send buffer is capped at 1 MB, with coalescing, dropping or disconnecting when slow clients fall behind.
:::

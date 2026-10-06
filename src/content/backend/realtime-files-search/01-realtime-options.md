@part I | Realtime options | We compare the five ways a server can get news to a client as it happens. They differ in direction, in what they cost per waiting client, and in how well they pass through proxies and survive bad networks. We will cover polling, long polling, server-sent events, and WebSockets with WebTransport, ending with how to choose. | where:1

## 1. Polling

User 42 is waiting for order 124. The app wants to show "accepted", "cooking", "picked up" and "arriving" as soon as each happens. The simplest way is **polling**. Every 5 s, the app asks `GET /orders/124/status`, and the server answers with the current status, or `304 Not Modified` if it carries an ETag that still matches, Unit I.

Polling is easy to build, cache, debug and scale, because every poll is an ordinary stateless request. It works through every proxy and firewall. Its cost is waste and delay. With 50,000 orders being tracked at peak and one poll every 5 s each, Wren receives 50,000 ÷ 5 = 10,000 requests per second purely to answer "has anything changed?" An order lasts about 40 minutes, 2,400 s, so each one is polled 480 times, and its status changes about 5 times. About 1% of polls carry news. The other 99% each cost a request through the CDN, the gateway, authentication and a cache lookup, Units VII and X.

@fig be_rt_polling | Twelve polls, one with news. At 10,000 requests a second, that is a lot of "no".

The delay is the other half. An update that happens just after a poll waits up to the full interval, 5 s, before the user sees it, 2.5 s on average. Shortening the interval to 1 s cuts the delay and multiplies the waste by five, to 50,000 requests per second. Lengthening it to 30 s saves load and makes the app feel stale.

Polling is still the right answer in more cases than people expect. If updates are rare and a delay of tens of seconds is fine, such as checking for a new app version or refreshing a daily summary, polling is simpler than anything else. If clients are few, the waste does not matter. And it is the universal fallback when everything fancier is blocked by a network. Adaptive polling helps, polling quickly when changes are likely, such as when the food is about to leave the kitchen, and slowly when they are not. For order tracking at Wren's scale, though, the waste and delay justify something better.

## 2. Long polling

**Long polling** keeps the request-response model and removes most of the waste. The app sends `GET /orders/124/status?after=v3`, and instead of answering immediately, the server holds the request open until the status changes past version 3, or until a timeout, typically 20 to 30 s, passes. When the kitchen accepts the order, the server answers at once with the new status, and the app immediately sends the next long poll. If the timeout passes with no change, the server answers with "nothing new" and the app asks again.

@fig be_rt_longpoll | One request held until the timeout, then another answered the moment the status changed.

Delivery is almost instant, since the server answers the moment it has news, and wasted requests drop from one every 5 s to one every 30 s at most. It still uses plain HTTP, so it passes proxies, works with existing authentication and needs no special client library. Comet techniques in the late 2000s, before WebSockets, used long polling to build chat and live feeds, and Facebook's early chat ran on it.

The costs moved rather than vanished. Every waiting client now holds an open request on the server, so 50,000 tracked orders mean 50,000 held connections. That is fine for event-loop servers, Unit IX, and fatal for a thread-per-request server with 200 threads. Every proxy on the path must allow requests that last 30 s, so its timeouts must be longer than the long-poll timeout. And there is a gap after each response, between the server answering and the client's next request arriving, during which an update must be held for the client or it is lost. Using a version or event id in each request, as `after=v3` does, lets the server return everything since that version, closing the gap.

Long polling survives today mainly as a fallback. Libraries such as Socket.IO start with it and upgrade to WebSockets when the network allows, and some networks with aggressive proxies never allow anything else.

## 3. Server-sent events

**Server-sent events**, SSE, give the server a standard way to keep one HTTP response open and write events into it as they happen. The browser's `EventSource` API, specified in the HTML standard, opens the stream, `GET /orders/124/events`, and the server responds with `Content-Type: text/event-stream` and never closes the body. Each event is a few lines of text, `id: 42`, `event: status`, `data: {"order":124,"status":"cooking"}`, followed by a blank line.

@fig be_rt_sse | One long response. Each event carries an id, so a reconnecting client can resume.

The protocol's best feature is built-in resumption. When the connection drops, `EventSource` reconnects automatically after a delay the server can set with `retry:`, and sends a `Last-Event-ID: 42` header. The server replays everything after event 42 and carries on. The client code does nothing to make that happen.

SSE runs over ordinary HTTP, so it works with existing authentication, cookies and proxies, provided proxies do not buffer the response, the Nginx `proxy_buffering off` setting from Unit XI or the `X-Accel-Buffering: no` header. It is text only, so binary data must be encoded. It is one-directional, server to client, which is exactly what order tracking, notifications, live scores, dashboards and streaming text from a language model need. When the client must send something, it uses ordinary HTTP requests alongside the stream.

One historical limit matters. Over HTTP/1.1, browsers allow only about 6 connections per origin, and each SSE stream holds one, so a user with several tabs open can exhaust them. Over HTTP/2 and HTTP/3, streams are multiplexed on one connection and the limit effectively disappears. Wren serves its SSE endpoints over HTTP/2.

## 4. WebSockets, WebTransport and choosing

A **WebSocket**, standardized in RFC 6455 in 2011, starts as an HTTP request that asks to upgrade the connection, and after the server agrees, the same TCP connection carries messages in both directions at any time, Part II. Either side can send whenever it likes, with a couple of bytes of framing per message. That **full duplex** channel suits chat, collaborative editing, multiplayer games, live location from a courier's phone, and any feature where the client sends frequent small messages too.

@fig be_rt_ws | One connection, messages flowing both ways independently.

WebSockets cost more to run than SSE. They need their own server support, proxies that understand the upgrade, a protocol for messages on top, since the WebSocket standard defines only frames, and application code for reconnection, resumption and heartbeats, Part II. They also bypass the HTTP machinery that SSE gets for free, such as standard caching, compression per response and HTTP/2 multiplexing.

**WebTransport**, built on HTTP/3 and QUIC, is the newest option. It offers several independent streams and unreliable datagrams over one connection, so one lost packet does not stall every stream, the head-of-line blocking of TCP that Unit I described. It suits low-latency media, games and anything that prefers fresh data to complete data. Browser support exists in Chromium and Firefox and is still arriving elsewhere, and server and proxy support is young, so it is a choice for specialised cases today.

@fig be_rt_compare | Direction, transport, reconnection, proxy friendliness and typical uses.

Wren's choices follow the needs. Order tracking uses SSE, since updates flow one way, resumption is built in and it runs over the existing HTTP stack. The courier app uses a WebSocket, because couriers send location every few seconds and receive assignments, both directions, all the time. Restaurant dashboards use SSE. Rarely changing data, such as menu updates, is polled every few minutes. And everything falls back to long polling or polling on networks that block the better options.

:::story Picture this
Waiting for a table at a busy restaurant. Polling is walking to the host every five minutes to ask. Long polling is standing at the host's desk until a table frees up. Server-sent events are a buzzer that vibrates whenever there is news. A WebSocket is a two-way radio, so you can also say "make that a table for five".
:::

:::note Mobile push
When the app is closed or in the background, none of these connections stay open, because mobile operating systems suspend apps to save battery. Wren uses Apple Push Notification service and Firebase Cloud Messaging for "your food is arriving", and realtime connections only while the app is in the foreground.
:::

:::warn Watch out
Proxies, load balancers and corporate firewalls with short idle timeouts silently cut SSE streams, long polls and WebSockets. Send a heartbeat comment or ping more often than the shortest idle timeout on the path, such as every 20 to 30 s, and make sure every hop allows long-lived responses, Unit XI.
:::

:::interview Interview lens
**"How would you show live order status in a mobile app?"** Polling is simplest but wasteful, 50,000 tracked orders at 5 s intervals is 10,000 requests per second with about 1% carrying news, and adds up to 5 s of delay. For one-way updates I would use server-sent events over HTTP/2, with event ids so clients resume after drops, heartbeats under the proxies' idle timeouts, and buffering disabled. WebSockets fit when the client also sends frequently, like a courier's location. I would keep long polling as a fallback and use mobile push when the app is in the background.
:::

:::key In one breath
Polling every 5 s for 50,000 orders costs 10,000 requests per second with about 1% carrying news and up to 5 s of delay, and suits rare updates and fallbacks. Long polling holds each request until news or a 30 s timeout, removing waste at the cost of one held connection per client and a gap after each reply. Server-sent events stream one-way events over HTTP with ids and automatic resumption, ideal for tracking and feeds, while WebSockets give full duplex messaging for chat and location, and WebTransport adds multiple streams and datagrams over HTTP/3.
:::

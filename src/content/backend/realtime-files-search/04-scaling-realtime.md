@part IV | Scaling realtime | We grow a realtime service from one server to many, and towards a million connections. The difficulty is that every open connection is state on one particular machine, and a message for a user must find that machine. We will cover connection state and stickiness, fan-out with rooms, presence, and millions of connections with reconnect storms. | where:4

## 11. Connection state lives on one server

An HTTP API server is stateless between requests, so any instance can serve any request, Unit V. A WebSocket server is not. User 42's connection is a TCP socket held by one process on one machine, ws-2, along with what that connection has subscribed to, its authenticated identity, its send buffer and its sequence counter. If a message for user 42 arrives at ws-1, ws-1 cannot deliver it.

That state has a cost per connection. A rough budget of 20 KB per connection, covering kernel socket buffers, the server's per-connection objects and some application state, is illustrative and varies widely with buffer sizes and compression. At that budget, 1,000,000 connections need about 20 GB of memory across the fleet, plus a file descriptor each, Unit IX. Wren's peak of 200,000 connections needs about 4 GB, spread over a handful of servers.

@fig be_ws_state | Each server holds its own connections and their state.

The load balancer in front must keep each connection on its server for its whole life, which every balancer does naturally for a single TCP connection. **Sticky sessions**, Unit XI, are needed only for transports that use several requests, such as long polling or Socket.IO's polling fallback, where each request must reach the server holding the session. For WebSockets and SSE, the connection itself is the stickiness.

Because servers hold state, they cannot be treated like stateless API servers during deploys and scaling. Removing a server disconnects all its clients, who reconnect elsewhere, Part II. Adding a server does not move existing connections to it, the long-lived connection problem from Unit XI, so new servers fill slowly as clients reconnect over time. Wren's autoscaler for the realtime fleet works on connection count per server rather than CPU, and drains servers gradually when scaling down.

## 12. Fan-out across servers and rooms

When order 124's status changes, the order service must get a message to whichever WebSocket server holds user 42's connection. It does not know which one, and should not. A **broker** in the middle solves this with publish and subscribe, Units VII and VIII. Each WebSocket server subscribes to the channels its connected clients care about. The order service publishes `order:124` once. The broker delivers it to every server subscribed to that channel, here only ws-2, which writes it to user 42's socket.

@fig be_ws_fanout | The order service publishes once. Only the server holding user 42 is subscribed, so only it forwards the message.

Redis pub/sub is a common broker for this, with the fire-and-forget caveat of Unit VII, so messages missed during a server restart are recovered through Part II's resumption from durable state. Kafka, NATS and managed services such as AWS's API Gateway WebSocket APIs or Ably play the same role. The channel scheme is the design decision. Wren's channels are **rooms** named for the entity they concern, `order:124` for one customer's order, `restaurant:9` for a restaurant's kitchen board, `zone:7:couriers` for the dispatch view of one delivery zone, and `promo:friday` for a broadcast to everyone using the app during a campaign.

@fig be_ws_rooms | Each room maps to the servers holding its members. A broadcast reaches every server once.

Fan-out costs differ enormously by room. An order room has one or two subscribers. A restaurant room has a few screens. The Friday promotion room has 200,000. Publishing to it costs one message per WebSocket server from the broker, then 200,000 socket writes spread across the servers, each server writing to its own share. That shape, one message to each server and local fan-out from there, keeps the broker's work proportional to servers rather than to users. For very large broadcasts, servers batch writes and spread them over a second or two so the burst does not stall other traffic.

The alternative, routing each message to exactly one server through a lookup table of user to server, saves broker traffic but needs that table kept accurate as users connect, disconnect and move, which is harder than it sounds. Most systems choose channel subscriptions and accept that a server may receive a few messages for rooms where its clients have just left.

## 13. Presence

**Presence** answers "who is online right now?", which couriers are available in zone 7, which restaurant staff have the dashboard open, whether a chat partner is active. It sounds like a simple consequence of having connections, and it is harder, because connections drop silently, users have several devices, and the answer must be shared across servers.

Wren's courier presence uses heartbeats into a Redis sorted set per zone, Unit VII. Every courier app sends a heartbeat every 10 s over its WebSocket, and the server holding the connection runs `ZADD online:zone7 <now> courier:31`. A courier is online if their last heartbeat is within 30 s, three missed heartbeats, so `ZRANGEBYSCORE online:zone7 (now − 30000) +inf` lists everyone online, and a periodic `ZREMRANGEBYSCORE` trims the rest. With 5,000 couriers online, that is 5,000 ÷ 10 = 500 heartbeat writes per second, trivial for Redis.

@fig be_ws_presence | Dots that keep heartbeating stay lit. A courier silent for 30 s fades from the map.

The timeout is a trade-off between flicker and staleness. A short timeout marks couriers offline as soon as their phone drops a few packets, and a long one leaves vanished couriers on the map, where the dispatcher might assign them orders. Using heartbeats rather than connection events means presence survives a server crash correctly, since a crashed server stops heartbeating its couriers and they time out, while relying on disconnect events would leave them online forever.

Changes in presence are themselves events, published to rooms such as `zone:7:couriers`, so the dispatch dashboard updates live. For large audiences, presence is often approximate or aggregated, "12 couriers online in zone 7", because broadcasting every individual join and leave to everyone grows with the square of the room size.

## 14. Millions of connections and reconnect storms

A single well-tuned server can hold hundreds of thousands to over a million idle WebSocket connections, the C10M of Unit IX's C10k. The limits are memory per connection, file descriptors, kernel buffer sizes, ephemeral ports and conntrack entries on load balancers, Unit XI, and above all the CPU cost of whatever the connections actually do. Idle connections are cheap. Ten thousand messages per second across them is real work.

The most dangerous moment is not peak load but a reconnect. When a realtime server holding 50,000 connections restarts, all 50,000 clients notice within seconds and reconnect. If they all retry immediately, the fleet receives 50,000 TLS handshakes, ticket redemptions and subscription setups in about one second, on top of normal load. Ticket redemption hits Redis, subscription setup hits the broker, and if reconnecting clients also refetch full state from the API, the API takes 50,000 requests at once. A healthy system can fall over from its own clients coming back.

@fig be_ws_storm | Every client back in one second, or spread across thirty seconds by random delay.

The defences come from earlier units. Clients add random jitter to reconnects, so spreading them over 30 s turns 50,000 per second into about 1,667 per second. Servers drain gradually during deploys, closing connections in batches with code 1001 over a few minutes. Resumption replays recent messages from a buffer rather than forcing a full state reload. Authentication on reconnect checks a cached session rather than hitting the database for each client. Admission control on the realtime fleet refuses connections beyond what each server can take, with Retry-After, Unit X. And the realtime fleet is a bulkhead, separate from the API, so its storms cannot exhaust the API's capacity.

Big realtime systems also layer their fleets. Slack described in 2023 a gateway tier that holds client connections at the edge and a set of channel servers behind it that hold subscription state, so client connections and channel routing scale independently. Wren's scale needs one tier, but the principle of separating connection holding from message routing is the one that scales to millions.

:::story Picture this
A telephone switchboard for a large hotel. Each operator holds a few hundred lines. A message for room 412 is announced on the internal intercom, and only the operator holding room 412's line passes it on. When one operator's board fails and every guest on it picks up the phone again at the same moment, the remaining operators drown. Guests who wait a random minute before redialling get through calmly.
:::

:::note Managed realtime services
AWS API Gateway WebSockets, Azure Web PubSub, Ably, Pusher and Cloudflare Durable Objects hold connections for you and expose publish APIs, which removes connection holding, scaling and deploys from your fleet. The trade-offs are cost per connection-minute and message, vendor-specific protocols and less control over latency and backpressure.
:::

:::warn Watch out
Restarting all realtime servers at once, during a cluster upgrade or a careless rollout, reconnects every client simultaneously. Roll realtime servers one at a time, with a pause between them long enough for reconnects to settle.
:::

:::interview Interview lens
**"Design a realtime notification system for a million connected users."** A fleet of WebSocket or SSE servers behind an L4 or L7 balancer, each holding tens to hundreds of thousands of connections, budgeted by memory and descriptors. Clients authenticate with short tickets and subscribe to rooms such as `user:42`. Servers subscribe to those channels in a broker such as Redis pub/sub, NATS or Kafka, so publishers send once and each server fans out locally. Messages carry sequence numbers with a short replay buffer for resumption, durable state stays in the database, presence uses heartbeats with timeouts, and reconnects use jittered backoff with gradual drains to avoid storms.
:::

:::key In one breath
Every WebSocket connection is state on one server, about 20 GB for a million connections at an illustrative 20 KB each, so deploys and scaling move clients by reconnection and autoscaling follows connection counts. A broker fans messages out by room, `order:124` reaching only the server holding user 42 and `promo:friday` costing one message per server plus 200,000 local writes. Presence uses heartbeats into a sorted set, 500 writes per second for 5,000 couriers with a 30 s timeout, and reconnect storms of 50,000 handshakes a second are tamed to about 1,667 a second with 30 s of jitter, gradual drains, resumption and a separate realtime fleet.
:::

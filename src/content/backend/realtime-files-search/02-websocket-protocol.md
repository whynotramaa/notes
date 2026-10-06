@part II | The WebSocket protocol | We open the WebSocket protocol, from the HTTP request that starts it to the frames that carry messages and the codes that end it. Knowing the wire format explains its proxy requirements, its masking rule and why applications must build their own heartbeats and resumption. We will cover the upgrade handshake, frames and opcodes, and the connection lifecycle with reconnection. | where:2

## 5. The upgrade handshake

A WebSocket begins life as an HTTP/1.1 request. The courier app opens `wss://rt.wren.example/ws`, and the client sends a `GET` with a few special headers. `Connection: Upgrade` and `Upgrade: websocket` ask to switch protocols. `Sec-WebSocket-Version: 13` names the protocol version. `Sec-WebSocket-Key` carries a random 16-byte value, base64-encoded, such as `dGhlIHNhbXBsZSBub25jZQ==`, the example from RFC 6455 itself. Browsers also send an `Origin` header naming the page that opened the socket, which matters in Part III.

The server agrees with `101 Switching Protocols`, `Upgrade: websocket`, `Connection: Upgrade` and `Sec-WebSocket-Accept`. The accept value is computed by appending the fixed string `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` to the client's key, hashing with SHA-1 and base64-encoding the result. For the example key, that gives `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`. After the 101 response, HTTP is over. The same TCP connection now carries WebSocket frames in both directions until one side closes it.

@fig be_ws_handshake | An HTTP request asks to upgrade, and the 101 response proves the server speaks WebSocket.

The key and accept exchange is not security. It only proves that the server really understood a WebSocket request, rather than an HTTP server or a cache replaying something by accident. Authentication and authorization are separate, Part III. The handshake can also negotiate **subprotocols**, with `Sec-WebSocket-Protocol`, naming the message format the application will use, such as `wren.v1` or the GraphQL subscription protocol, and **extensions**, such as `permessage-deflate` for compression.

Because the handshake is HTTP, every proxy on the path must understand it. Nginx needs explicit configuration to pass the `Upgrade` and `Connection` headers through, `proxy_set_header Upgrade $http_upgrade` and `proxy_set_header Connection "upgrade"`, and a read timeout long enough for idle sockets, Unit XI. Cloud application load balancers support WebSockets natively. Over HTTP/2, RFC 8441 defines an extended CONNECT method that runs WebSockets as one stream of a multiplexed connection, and RFC 9220 does the same for HTTP/3, though HTTP/1.1 upgrades remain the most common path.

`wss://` is WebSocket over TLS, just as `https://` is HTTP over TLS. Plain `ws://` is blocked by browsers on secure pages and is often mangled by proxies that inspect unencrypted traffic, so production WebSockets always use `wss://`.

## 6. Frames, opcodes and masking

After the handshake, data travels in **frames**. Each frame starts with a small header. The first byte holds the **FIN** bit, set on the last frame of a message, three reserved bits used by extensions, and a 4-bit **opcode**. The second byte holds the **MASK** bit and a 7-bit payload length. Lengths up to 125 fit there. A value of 126 means the next 2 bytes hold the length, and 127 means the next 8 bytes do. If MASK is set, a 4-byte masking key follows. Then comes the payload.

@fig be_ws_frame | FIN, opcode, mask bit and length, then an optional mask key and the payload.

Opcodes say what a frame carries. `0x1` is a text frame, which must be valid UTF-8, and `0x2` is binary. `0x0` is a continuation frame, used when a large message is split, or fragmented, across several frames. The control opcodes are `0x8` close, `0x9` ping and `0xA` pong. Control frames may arrive between the fragments of a data message, so a ping is answered promptly even during a large transfer, and they carry at most 125 bytes.

Clients must mask every frame they send, XORing the payload with the random 4-byte key in the header, and servers must reject unmasked client frames. Masking is not encryption, since the key travels in the frame. It exists to stop a specific attack. Without it, a malicious page could make the browser send bytes that a broken intermediary proxy would misread as an HTTP request and cache, poisoning the cache for other users. Random masking makes the client's bytes unpredictable to the page that chose them. Servers do not mask.

The overhead is small. A 100-byte message from the server costs 2 bytes of header, and from the client 6 bytes, 2 plus the 4-byte mask key. Compared with an HTTP request, which carries hundreds of bytes of headers, that is why WebSockets suit many small messages, such as a courier's location every 5 s. With `permessage-deflate`, repetitive JSON messages shrink further, at a memory cost per connection for the compression context, which matters at a million connections.

The WebSocket standard ends at frames and messages. What a message means, how replies match requests, and which messages acknowledge which, is up to the application. Wren's protocol sends JSON envelopes with a type, a sequence number and a payload, `{"t":"loc","seq":912,"d":{...}}`, and the next section relies on that sequence number.

## 7. Lifecycle, heartbeats and reconnection

A WebSocket connection moves through four states, connecting, open, closing and closed. Closing is a handshake of its own. One side sends a close frame with a **status code** and an optional reason, the other replies with a close frame, and the TCP connection is closed. Common codes are **1000** for a normal close, **1001** for going away, as when a server shuts down for a deploy or a browser tab closes, **1008** for a policy violation, **1011** for an unexpected server error, and **1006**, which is never sent on the wire and means the connection dropped without a close frame at all.

Code 1006 is the common case on mobile networks. A courier rides into a tunnel, a phone switches from Wi-Fi to cellular, a NAT forgets the connection after an idle period, Unit XI, and nobody sends a close frame. TCP itself may not notice for a long time. **Heartbeats** detect it. The server sends a ping every 30 s and expects a pong, closing the connection if none arrives within, say, 10 s. Clients often send their own application-level pings, since browsers do not expose WebSocket ping frames to JavaScript. Heartbeats also keep NATs and load balancers from treating the connection as idle.

@fig be_ws_lifecycle | Open, ping, drop, reconnect with jittered backoff, and resume from the last sequence number.

**Reconnection** is entirely the client's job, unlike SSE. When a connection drops, the courier app reconnects with exponential backoff and jitter, 1 s, 2 s, 4 s up to 30 s, each multiplied by a random factor, Unit X, so a server restart does not produce a synchronized stampede, Part IV. It refreshes its authentication ticket if needed, Part III, and reconnects to any server, since the load balancer may send it elsewhere.

Reconnection loses whatever was sent while the client was away, unless the protocol supports **resumption**. Wren's server tags every outgoing message for a client with an increasing sequence number and keeps recent messages per client in Redis for a few minutes. On reconnect, the app says "my last seq was 912", and the server replays everything after it, or, if too much was missed, tells the app to reload the full state. That gives at-least-once delivery over an unreliable connection, so messages are idempotent or deduplicated by sequence number, Unit VIII.

Deploys use the same path deliberately. A WebSocket server being replaced sends 1001 to its clients in batches over a minute or two, rather than all at once, and the clients reconnect to other servers and resume.

:::story Picture this
A phone call between a dispatcher and a courier. It starts with "can you hear me on this line?" and "yes, line's good", which is the handshake. Every so often one says "still there?", which is the ping. When the courier drives under a bridge and the line goes dead, nobody says goodbye. The courier redials, says "the last instruction I heard was number 912", and the dispatcher repeats everything after it.
:::

:::note Ping frames and browsers
Browsers answer server pings automatically but give JavaScript no way to send pings or see pongs. Clients that need to detect a dead connection on their side send small application messages, such as `{"t":"ping"}`, and treat a missing reply within a few seconds as a broken connection, reconnecting rather than waiting for TCP to notice.
:::

:::warn Watch out
Treating a successful `send()` as delivery is a common mistake. `send()` only puts bytes into a local buffer. If the connection drops a moment later, the message may never arrive. Anything that must arrive needs an acknowledgement or a sequence number that the other side confirms, plus replay on reconnect.
:::

:::interview Interview lens
**"Walk me through how a WebSocket connection is established and kept healthy."** The client sends an HTTP GET with Upgrade: websocket, Connection: Upgrade and a random Sec-WebSocket-Key, and the server replies 101 with Sec-WebSocket-Accept, the base64 SHA-1 of the key plus a fixed GUID. After that the TCP connection carries frames with a FIN bit, an opcode for text, binary, close, ping or pong, a length and, from clients, a mask. Health comes from pings every 30 s with pong timeouts. Clients reconnect with jittered exponential backoff and resume using sequence numbers, and servers close with 1001 during deploys.
:::

:::key In one breath
A WebSocket starts as an HTTP GET with Upgrade, Connection and a random Sec-WebSocket-Key, and the 101 reply's Sec-WebSocket-Accept is base64(SHA-1(key + a fixed GUID)), `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=` for the RFC's example, proving understanding rather than identity. Frames carry FIN, an opcode for text, binary, close, ping or pong, a length and, from clients, a mask against proxy cache poisoning, costing 2 to 6 bytes for small messages. Close codes 1000, 1001, 1011 and the unsent 1006 mark endings, pings every 30 s detect silent drops, and clients reconnect with jittered backoff and resume from a sequence number.
:::

@part V | HTTP/1.1, HTTP/2 and HTTP/3 | We follow how the same request travels in each HTTP version and why each version was needed. The semantics never changed, but the cost of carrying them did, and that cost decides latency and connection counts in production. We will go from short-lived HTTP/1.0 connections through keep-alive and head-of-line blocking to HTTP/2 multiplexing and HTTP/3 on QUIC. | where:5

## 16. HTTP/1.0 and HTTP/1.1 keep-alive

In **HTTP/1.0** (1996) each request got its own TCP connection, and the server closed it after the response. Opening a connection costs time. TCP needs one round trip for its handshake, and TLS needs at least one more. At Wren's 40 ms round-trip time, a phone paid 80 ms of handshakes before each 30 ms request. Three requests in a row cost three times that overhead.

**HTTP/1.1** (1997) made connections **persistent** by default. After a response the connection stays open for the next request, which is called **keep-alive**. Three requests now share one handshake, and each skipped TCP plus TLS 1.3 setup saves 80 ms. A sequence of three requests drops from 450 ms to 290 ms. Clients keep a pool of open connections per host and reuse them. Servers close idle ones after a timeout. Nginx waits 75 seconds by default.

@fig be_http_keepalive | Keep-alive spreads one handshake over many requests. Each request after the first starts immediately.

Keep-alive has a cost on the server side. Each open connection holds a socket and a file descriptor even when idle, plus some memory for buffers. A server with 50,000 idle keep-alive connections needs a file descriptor limit well above that, and Unit XI shows what happens when it runs out. The idle timeout is a trade-off. Too short, and clients pay new handshakes. Too long, and the server holds sockets for clients that left. Behind a load balancer there is one more rule. The backend's idle timeout must be longer than the balancer's, otherwise the backend may close a connection at the exact moment the balancer sends a request on it, and the user sees a 502.

## 17. Pipelining and head-of-line blocking

Keep-alive still allows one outstanding request per connection. The client sends a request, waits for the whole response, and only then sends the next. HTTP/1.1 defined **pipelining** to remove the wait. The client sends several requests back to back, and the server answers them in the same order. If the first response is a slow report taking 900 ms, the three quick responses queued behind it also wait 900 ms, even though the server finished them long ago. That is **head-of-line blocking**, where one slow item at the front of a queue delays everything behind it.

@fig be_http_hol | Six connections, one response at a time each. The slow request on connection 1 holds up the line behind it.

Pipelining was also buggy in many proxies, so browsers never turned it on by default. Their workaround was to open about six parallel connections per host. A page with 30 resources then needs ⌈30 / 6⌉ = 5 rounds instead of 30, and at 40 ms per round that is 200 ms instead of 1,200 ms. But six connections cost six handshakes, and each has its own TCP congestion window that starts small and grows independently. Sites invented tricks to get more parallelism. They spread assets across several host names, a trick called domain sharding, and glued many small images into one large one called a sprite. HTTP/2 made those tricks unnecessary, and in some cases harmful.

:::story Picture this
A single-lane bridge with a strict rule that cars leave in the order they entered. One slow tractor at the front, and every car behind it crawls. Building six bridges helps, but each bridge costs money, and the tractor still ruins one of them.
:::

## 18. HTTP/2: framing, streams, multiplexing and HPACK

**HTTP/2** (2015, grown out of Google's SPDY) kept the methods, headers and status codes and replaced the wire format. Messages are cut into binary **frames**. Each frame carries a **stream** id, and a stream is one request and its response. Frames from many streams interleave on a single connection, and the receiver reassembles each stream from its own frames. A slow response on stream 1 no longer blocks stream 3. This is **multiplexing**. One connection can carry a hundred concurrent requests, so a browser needs one connection per origin instead of six. Client-started streams use odd numbers, 1, 3, 5, and the server limits how many may be open at once with a setting that defaults to around 100 in most servers.

@fig be_http2_frames | Many streams, one connection. The receiver sorts frames back into streams by id.

Headers get their own compression, called **HPACK**. API requests repeat the same headers constantly. An `authorization` header might be 600 bytes, and it goes on every call. HPACK keeps a table of header fields on both sides. A static table of 61 common entries, such as `:method: GET`, is built in. New fields are added to a dynamic table as they are sent. The next request can then send a one-byte index instead of the full 600-byte header. Across 100 requests on one connection, that header costs 600 + 99 = 699 bytes instead of 60,000. HPACK avoids general-purpose compression on purpose. In 2012 the CRIME attack showed that compressing secrets alongside attacker-chosen text leaks those secrets through the compressed size.

@fig be_http2_hpack | After the first request, repeated headers shrink to indexes into a shared table.

HTTP/2 also let clients assign stream priorities, so a browser could say the stylesheet matters more than an image. The original tree-based scheme was so complex that most servers ignored it. RFC 9218 replaced it with a simple urgency header that works for HTTP/2 and HTTP/3 alike.

:::warn Watch out
HTTP/2 moves head-of-line blocking down a layer instead of removing it. All streams share one TCP connection, and TCP delivers bytes in strict order. If one packet is lost, every stream waits for its retransmission, even streams whose data already arrived. On a lossy mobile network, HTTP/2 can be slower than six HTTP/1.1 connections.
:::

@fig be_http2_tcp_hol | TCP's single ordered byte stream makes one lost packet everyone's problem.

## 19. HTTP/3 and QUIC

**HTTP/3** (RFC 9114, 2022) runs on **QUIC**, a transport built on UDP. QUIC handles reliability, congestion control and streams itself, and it orders bytes per stream instead of per connection. A lost packet carrying stream 5's data delays only stream 5. Streams 1 and 3 keep delivering. That removes the transport-level head-of-line blocking that HTTP/2 could not escape. QUIC needed its own header compression too, QPACK, because HPACK assumed in-order delivery.

@fig be_http3_quic | Loss stays inside the stream it hit. That is the main reason HTTP/3 exists.

QUIC builds TLS 1.3 into its own handshake, so transport setup and encryption setup happen in the same round trip. A fresh HTTPS connection over TCP spends one round trip on TCP and one on TLS 1.3. QUIC spends one in total, which saves 40 ms at Wren's round-trip time. With a previous session, QUIC can carry the request in its very first packet, called 0-RTT. Part VI explains the replay risk that comes with it.

QUIC also names each connection with a **connection ID** instead of the pair of IP addresses and ports. When a phone moves from Wi-Fi to cellular, its IP address changes, and a TCP connection dies, so the app needs new handshakes and loses any in-flight requests. A QUIC connection survives the move, because the server recognises the connection ID arriving from the new address. This is **connection migration**.

@fig be_http3_migration | The connection ID outlives the network change. TCP would need a full new handshake.

Deployment has some rough edges. Servers advertise HTTP/3 with an `Alt-Svc` response header or a DNS HTTPS record, so the first visit usually happens over HTTP/2. QUIC encrypts almost all of its transport headers, so corporate firewalls and load balancers that inspect TCP cannot see into it, and some networks block UDP port 443. Clients race the two and fall back to TCP when QUIC fails.

:::interview Interview lens
**"Why does HTTP/3 use UDP?"** Not because UDP is faster. The goal was a new transport with per-stream ordering, built-in TLS and connection migration. Deploying a new kernel-level protocol across every router and firewall on the internet was impractical, while UDP already passes through them. So QUIC runs in user space on top of UDP. Some networks still block UDP 443, which is why clients fall back to HTTP/2 over TCP and servers advertise HTTP/3 with Alt-Svc.
:::

:::key In one breath
HTTP/1.0 paid a handshake per request, and HTTP/1.1 keep-alive reuses one connection but serves one response at a time, so slow responses cause head-of-line blocking and browsers open six connections. HTTP/2 multiplexes binary frames from many streams on one connection and compresses headers with HPACK, but a lost TCP packet still stalls every stream. HTTP/3 runs on QUIC over UDP, which orders bytes per stream, folds TLS 1.3 into a one round-trip handshake and keeps connections alive across IP changes with connection IDs.
:::

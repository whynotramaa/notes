@part IX | The HTTPS request end to end | We assemble everything into one complete answer to the classic question of what happens after you type a URL. Interviewers use this question to see whether you can hold the whole path in your head and zoom into any step on demand. We will trace Wren's request through every layer, count its latency to the millisecond, and name what each layer contributes. | where:9

## 33. Walking through https://api.wren.example/orders/123

User 42 taps their order in the Wren app. The app builds `GET https://api.wren.example/orders/123` and first checks its connection pool for an open HTTP/2 connection to that host. On a cold start there is none, so it needs an address. The operating system's DNS cache misses, so the stub resolver asks the configured recursive resolver. That resolver has the `.example` delegation cached but not Wren's record, so it asks Wren's authoritative server and gets back `203.0.113.10` with a TTL of 300 seconds.

The app opens TCP to port 443 with SYN, SYN-ACK and ACK, which costs one round trip. It then sends ClientHello with SNI `api.wren.example`, ALPN `h2` and an X25519 key share. The load balancer replies with ServerHello and its key share, then, encrypted, its certificate chain, CertificateVerify and Finished. The app validates the chain up to a trusted root, checks that the SAN covers `api.wren.example` and that the certificate has not expired, checks the stapled OCSP response, and verifies the handshake signature. It sends Finished, and in the same flight an HTTP/2 HEADERS frame on stream 1 carrying `:method GET`, `:path /orders/123`, `:authority api.wren.example` and `authorization: Bearer ...`.

The load balancer terminates TLS and forwards the request over plain HTTP to one of four app instances, choosing the one with the fewest open requests. The app parses the request and runs its middleware. It authenticates the token, checks that order 123 belongs to user 42, queries PostgreSQL, serialises 2,000 bytes of JSON and returns `200` with `Content-Type: application/json` and `Cache-Control: private, max-age=0`. The response flows back through the load balancer, which encrypts it with the session keys, and reaches the phone. The connection stays open, so the next tap skips everything before the HEADERS frame.

@fig be_e2e_request | The whole path. Every box is a part of this unit, except the app internals that later units open up.

:::story Picture this
Sending a registered letter to a company you have never dealt with. You look up its address in a directory (DNS) and drive there (TCP). At reception you check the company registration certificate on the wall and agree on a private code with the clerk (TLS and certificates). Then you hand over a form with a standard layout (HTTP). The clerk passes it to a back office (the app) that checks your membership card before fetching your file.
:::

## 34. Counting the latency

Put numbers on each step. With an illustrative 25 ms DNS lookup and a 40 ms round trip, TCP costs 40 ms and TLS 1.3 another 40 ms. The request then takes half a round trip to arrive, 20 ms. The server works for 30 ms, and the response takes 20 ms to return. The total is 25 + 40 + 40 + 20 + 30 + 20 = 175 ms. Wren's own code accounts for 30 ms of that, about 17%. The other 145 ms is distance and setup.

@fig be_e2e_waterfall | The cold-start waterfall. Most of the time goes to round trips, not to Wren's code.

This changes where optimisation pays. Shaving 10 ms off the handler saves 10 ms. Reusing the connection saves 105 ms, the DNS lookup plus the TCP and TLS round trips, which is why clients pool connections and servers set generous keep-alive timeouts. Moving to QUIC saves 40 ms on a cold start. Terminating TLS at a CDN edge 10 ms from the user shrinks the handshake round trips from 40 ms to 10 ms each, even though the app still runs in one region. The edge then keeps warm, long-lived connections to the origin, so that leg pays no handshakes at all. Most real speed-ups for global users come from these moves, not from faster code.

| Path | Round trips before the request | Time to first response |
|---|---|---|
| TCP + TLS 1.2 | 3 | 215 ms |
| TCP + TLS 1.3 | 2 | 175 ms |
| QUIC | 1 | 135 ms |
| QUIC 0-RTT | 0 | 95 ms |
| Reused connection | 0, and no DNS | 70 ms |

Bandwidth barely appears here. A 2,000-byte response fits in two TCP segments, so for small API responses the round trips dominate. Bandwidth starts to matter for large bodies, where TCP's slow start ramps the sending rate up over several round trips.

:::warn Watch out
Do not answer the "type a URL" question by listing layers in a monotone. Interviewers interrupt to ask what happens if the certificate has expired, if DNS returns a stale IP, or if the load balancer returns 504. Structure the answer so each step names its failure mode, and you can follow any interruption.
:::

## 35. What each layer contributes

Each layer earns its place by solving one problem the others cannot. DNS turns a stable name into an address that can change. TCP or QUIC turns lossy, reordered packets into a reliable ordered stream. TLS turns that stream into a private, tamper-evident channel, and certificates tie the channel to the right owner. HTTP gives the bytes meaning, with a method, a target, headers and a status. Caching headers let any layer skip the whole trip when the answer is already known.

@fig be_e2e_layers | One job per layer. The orange one is the job most often skipped by mistake, checking who is at the other end.

Each layer also fails in its own way, and knowing the pattern speeds up debugging. DNS fails slowly, through stale caches that keep sending a fraction of users to the wrong place for minutes. TCP fails through timeouts and resets, which surface as connection errors before any HTTP status exists. TLS fails abruptly and completely, through an expired certificate, a missing intermediate or a name mismatch, and every client breaks at once. HTTP fails visibly, through status codes that range from a precise 412 to an opaque 502. If users report "it hangs", think TCP or a slow backend. If they report a certificate warning, think TLS. If only some users see the old site, think DNS.

This unit stopped at the edge of the app box. Inside it, requests are authenticated, authorised, validated and turned into queries, and the next units open that box one layer at a time. Unit II starts with the browser rules that decide which requests can reach it at all.

:::interview Interview lens
**"Walk me through exactly what happens after entering https://example.com."** The browser checks HSTS and upgrades to HTTPS, then checks its connection pool. It resolves the name through its cache, the OS and a recursive resolver, which may walk the root, TLD and authoritative servers. It opens TCP or QUIC, runs a TLS 1.3 handshake with SNI and ALPN, validates the certificate chain, SAN and expiry, and agrees ECDHE keys. It sends an HTTP/2 or HTTP/3 request with Host, cookies and Accept headers. A CDN or load balancer terminates TLS and routes it to an app that authenticates, queries and responds, and the browser parses the HTML and fetches sub-resources, mostly over the same connection.
:::

:::key In one breath
A cold HTTPS request resolves DNS, opens TCP, runs a TLS 1.3 handshake with certificate validation, then sends the HTTP request, and at a 40 ms round trip that costs 175 ms, of which only 30 ms is server work. Reusing connections removes 105 ms, QUIC removes a round trip, and 0-RTT another. DNS names, transport delivers, TLS protects, certificates identify, HTTP gives meaning and caching skips work. Each layer has its own failure pattern, and a strong answer names them in order.
:::

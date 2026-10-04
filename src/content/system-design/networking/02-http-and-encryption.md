@part II | HTTP versions and TLS | We carry an application request across the connection. Protocol versions change how requests share it. We will compare HTTP versions and then establish what HTTPS protects. | where:2

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

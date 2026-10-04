@part VIII | QUIC, TLS and web sessions | A reachable endpoint still needs to prove its identity and keep browser state within defined boundaries. Without authentication and browser policy, reliable bytes can deliver a request to an impostor or expose another user's session. We will inspect QUIC, TLS, cookies, cross-origin access, and persistent web messaging. | where:8

## 37. QUIC streams, migration and establishment

Finch's HTTP/3 request uses UDP, yet it still needs missing response bytes recovered. **QUIC** implements encrypted reliable streams and congestion control above UDP. UDP supplies datagrams; QUIC packet numbers and stream offsets supply the recovery and delivery state. Thus carrier choice and application reliability are separate questions.

A QUIC packet can contain frames from several streams. Packet acknowledgements identify received packets, while stream offsets identify which bytes belong where. If a packet is lost, the sender can send needed stream data in a newly numbered packet. An independent stream can deliver complete bytes even while another stream waits for a gap. Delivery within the affected stream remains ordered.

@fig cn_quic | A UDP datagram carries QUIC frames, and each stream tracks its own byte order. Orange marks the complete bytes of stream B progressing while stream A waits for a gap. | narrow

QUIC integrates TLS establishment, avoiding a separate TCP handshake before beginning the cryptographic exchange. A fresh connection still needs authenticated setup, and resumed early data has replay constraints. A **connection identifier** can let a connection survive a change of network tuple, such as a laptop moving between interfaces. The peer validates the new path rather than treating any packet carrying an identifier as trusted migration.

Finch's gateway previously stored a tuple translation involving public port `40001`. A path change can create a different NAT mapping even when the logical QUIC connection continues. TCP ordinarily binds its connection to its address and port pairings; QUIC adds a connection identity above the tuple. Migration is therefore protocol state, not a promise that every network permits it.

A firewall blocking UDP can prevent a QUIC path while allowing traditional HTTPS over TCP. Independent streams also share a congestion controller and connection-level flow allowance, so one flow cannot invent new link capacity. [QUIC's transport specification](https://datatracker.ietf.org/doc/html/rfc9000) defines these boundaries. In an interview, say what moves above UDP before listing lower handshake cost as a possible consequence.

:::story Picture this
A train station gives each passenger a booking identifier that survives a change of platform. Carriage seats still have their own ordering rules. The identifier is the QUIC connection, the platform is its current network path, and independently filled carriages are streams; changing platforms still requires the station to validate the move.
:::

## 38. HTTPS, TLS and certificate verification

Finch reaches `203.0.113.20`, but a route to that address does not prove the peer owns `example.com`. **TLS**, Transport Layer Security, authenticates the intended identity and protects exchanged data with encryption and integrity checks. HTTPS means HTTP carried through that protected exchange, traditionally TLS over TCP and, for HTTP/3, TLS integrated into QUIC.

A certificate binds a public key to names and other identity information under an issuer's signature. A **certificate authority** issues such signed statements. The browser checks the requested hostname, validity conditions and a chain to a configured trust anchor. Possession of an arbitrary certificate is insufficient. The peer must also demonstrate control of the corresponding private key during the handshake.

@fig cn_tls | Finch verifies the hostname and certificate chain before treating the peer as `example.com`. Orange marks the initial negotiation that establishes authenticated session keys. | narrow

TLS uses asymmetric cryptographic operations for authentication and key agreement, then symmetric authenticated encryption for bulk data. A public key may be shared; the corresponding private key must remain secret. A digital signature proves control of a signing key and detects modifications. A cryptographic hash produces a compact digest, but a bare hash without authentication does not prove who sent it.

The TLS 1.3 exchange uses ephemeral key agreement rather than the old explanation that every client simply encrypts a session key with the certificate's RSA key. The server's certificate and handshake signature authenticate the exchange, while the negotiated secrets generate traffic keys. [The TLS specification](https://www.rfc-editor.org/rfc/rfc8446) documents this division.

In the illustrative `40` ms RTT model, one TCP RTT, one TLS RTT and one HTTP request-response RTT sum to `120` ms. The model excludes DNS, application processing and connection reuse; resumption changes dependencies and early data adds replay risk. Encryption also leaves some metadata visible, including endpoints and traffic timing. A trusted proxy terminating TLS becomes part of the plaintext trust boundary.

:::warn Watch out
Never bypass hostname verification to repair a certificate error. A reachable IP and a valid chain for a different hostname do not authenticate the requested service. Repair the identity or trust configuration that caused the failure.
:::

## 39. Cookies, sessions, authentication and authorization

Finch logs in, then opens another HTTP request. HTTP does not remember that identity merely because the new bytes arrive after the old ones. A **cookie** is browser-held state that the browser returns according to domain, path, expiration and policy. Set-Cookie stores it; Cookie returns it. A **session** associates later requests with application state through an identifier or validated token.

### Server-side session

The browser holds an opaque identifier and the server uses it to look up session state. Deleting the server record can revoke subsequent use. Every participating backend must access the intended store or route consistently, so sticky sessions can hide an otherwise missing shared-state design.

### JWT-style token

A signed token carries claims and a signature the server verifies. Encoding the claims does not encrypt them. The verifier must validate the expected algorithm, issuer, audience and expiration. Removing a login record does not automatically revoke a still-valid token; short validity periods, revocation state or other explicit policy may be needed.

@fig cn_sessions | A server-side session follows an opaque identifier to stored state, while a signed token carries claims. Orange marks the lookup model used by Finch's illustrative login. | narrow

**Authentication** establishes who a request acts for; **authorization** checks whether that identity may perform the requested action. Secure cookies restrict transmission to secure contexts, HttpOnly prevents ordinary script access, and SameSite controls some cross-site sending. Domain and path determine attachment scope, not a trustworthy application permission boundary.

Cross-site request forgery, or CSRF, exploits credentials the browser automatically attaches to a request initiated from another site. Script injection, or XSS, executes attacker-controlled code in the application's context and can act with the user's rights even if HttpOnly prevents reading the cookie. Session rotation after privilege changes and origin-aware defenses address different attack steps. `443` names Finch's transport service, while none of these permissions come from that port number. A correct answer must identify where identity state lives and how it can expire or be revoked.

:::note Cookie scope and origin scope
Cookies use their own domain, path and site rules. An origin instead includes scheme, host and port. Do not assume two pages that receive the same cookie necessarily have the same browser read permissions.
:::

## 40. CORS and the same-origin policy

A page loaded from Finch's website tries to read a response from another API origin. The API may answer the network request while the browser refuses to expose its response to script. The **same-origin policy** limits cross-origin browser access. An **origin** consists of scheme, host and port, and **CORS**, Cross-Origin Resource Sharing, supplies response metadata that allows selected cross-origin reads.

For a request requiring preflight, the browser sends OPTIONS with the intended method and relevant headers. The server answers with allowed origins, methods and headers, after which the browser decides whether to send the actual request. Some requests need no preflight, but exposing their responses still depends on appropriate permission. Credentials require additional agreement; a wildcard origin does not mean arbitrary credentialed browser reads are allowed.

@fig cn_cors | The browser sends OPTIONS before the actual preflighted request. Orange marks the permission inquiry; the server still authenticates and authorizes the eventual operation. | narrow

Access-Control-Allow-Origin names the permitted requesting origin. Allow-Methods and Allow-Headers describe permitted preflighted request properties, while the credential setting governs credentialed exposure. If a server varies its answer by Origin, cache behavior must preserve that distinction. An indiscriminately reflected origin can expose data that the server meant to keep private.

Finch's API may listen on `443` and remain callable by a command-line client even when browser script cannot read it. `curl` does not implement the browser's same-origin policy. CORS therefore cannot replace authentication, authorization, CSRF defenses or a firewall. Blocking a read is also different from preventing every request from being sent.

[The Fetch standard](https://fetch.spec.whatwg.org/#http-cors-protocol) defines the browser protocol. The useful diagnostic sequence is to identify the requesting origin, inspect preflight if present, inspect permission headers, then inspect application credentials. Changing server permissions without understanding the caller's origin can conceal the error while broadening access.

## 41. WebSockets, SSE and polling

Finch wants incoming status changes without repeatedly starting a new ordinary request. A **WebSocket** connection exchanges framed messages in both directions after an opening handshake. The familiar HTTP/1.1 exchange uses Upgrade and a `101 Switching Protocols` response, after which WebSocket frames replace ordinary HTTP request-response bodies on that connection.

Frames distinguish data and control messages, and ping/pong helps test liveness. A large message may span frames, so a frame is not necessarily a complete application message. Reconnect creates a new connection; the application needs sequence identifiers or a resynchronization request if it must recover updates sent while disconnected.

@fig cn_websocket | The HTTP upgrade opens a persistent framed exchange. Orange marks the opening upgrade request that negotiates the later bidirectional frame exchange. | narrow

Ordinary polling repeatedly asks for the latest state. Long polling lets the server hold a request until an update or deadline, then the client issues another. **Server-Sent Events**, or SSE, streams text events from server to browser through a long-lived HTTP response. WebSockets support messages in both directions, while SSE's application direction is server to client and ordinary requests can carry client actions.

| Property | Polling | SSE | WebSocket |
|---|---|---|---|
| Server push | Next request | Event stream | Message stream |
| Client messages | New requests | Separate requests | Same connection |
| Reconnect state | Query current value | Event identifier policy | Application protocol |
| Intermediary needs | Ordinary HTTP | Streaming HTTP | Upgrade or supported mapping |

Finch's `40` ms RTT remains a lower path cost for an interactive round trip; keeping a connection open avoids repeated establishment but cannot erase propagation. A slow consumer can accumulate outgoing messages until memory grows without bound, so choose a buffer limit and resynchronization policy. Proxies and load balancers also need suitable idle timeouts and support for the chosen transport. [The WebSocket specification](https://www.rfc-editor.org/rfc/rfc6455) supplies framing; application delivery guarantees still require application state.

:::interview Interview lens
**"When would you choose SSE instead of WebSockets?"** SSE fits a browser that mainly receives server events through HTTP. It provides an event stream while client commands can remain ordinary requests. WebSockets fit a persistent bidirectional message protocol. In either case I define reconnect recovery and a bounded slow-consumer buffer.
:::

:::key In one breath
QUIC builds reliable encrypted streams above UDP and can identify a connection across path changes. TLS authenticates the requested server name and derives keys; a reachable address does not replace that proof. Cookies and sessions carry identity between requests, while CORS controls browser response exposure. Persistent transports reduce repeated setup but still need application recovery after disconnects.
:::

@part VII | DNS and HTTP | A browser needs both a destination address and a language for asking that destination for a resource. Without name resolution and explicit message semantics, reachable packets still cannot produce a useful web response. We will trace DNS caching, read HTTP methods and statuses, and compare the transports used by successive HTTP versions. | where:7

## 33. DNS hierarchy, records and caching

Finch knows `example.com` before it knows `203.0.113.20`. **DNS**, the Domain Name System, maps names to typed records through a distributed hierarchy. The browser may reuse a cached answer; otherwise its host's stub resolver asks a recursive resolver to obtain one. The recursive resolver may already have a valid cached result too.

On a cold lookup, the resolver asks a root server where the relevant top-level domain is served, then asks a TLD server where the domain's authoritative servers are, then asks an authoritative server for the desired record. These are iterative referrals inside the resolver's work. A recursive request instead asks another server to obtain the final answer on the caller's behalf. Root servers do not contain every site's final address.

@fig cn_dns | A cold recursive lookup follows iterative referrals to the authoritative answer. Orange marks the server that supplies the requested record, rather than the root. | narrow

An A record carries an IPv4 address and AAAA an IPv6 address. CNAME aliases a name, MX identifies mail exchanges, NS delegates authority, TXT carries text, PTR provides reverse naming, and SOA describes a zone's administrative and refresh information. A name can have several address records, and its mail destination need not match its web destination. An authoritative negative answer can also be cached under defined rules.

The **time to live**, or TTL, bounds cache reuse. In the illustrative DNS example, a `300` second TTL cached `120` seconds ago has `180` seconds remaining. That TTL concerns a cached record, unlike the hop-limiting IP TTL. Shortening the authoritative value does not retroactively shorten copies already cached elsewhere.

DNS commonly uses UDP for queries but supports TCP when required, including responses that cannot fit the negotiated datagram conditions. Encrypted transports add another path to the resolver rather than changing what A means. [The DNS architecture](https://datatracker.ietf.org/doc/html/rfc1034) separates authority, recursion and caching. A useful incident report identifies the queried name, record type, resolver and observed remaining lifetime.

:::story Picture this
A library desk directs you to a floor index, which directs you to the shelf catalog that owns a book's location. The desk can remember a recent answer until its dated slip expires. The root is the floor index, not a catalog containing every book on every shelf.
:::

## 34. HTTP methods and status codes

Finch sends `GET /users/123` to an identified host. Reaching the TCP listener does not explain what to retrieve or how to describe failure. **HTTP**, the Hypertext Transfer Protocol, exchanges requests and responses with explicit methods, target resources, headers and optional bodies. Its meaning stays separate from the framing used by a particular HTTP version.

### Methods

GET retrieves a representation and HEAD requests equivalent response metadata without the response body. OPTIONS asks about communication options. These methods are safe because their defined purpose does not request a state change, although logging can still occur. PUT replaces the target representation, DELETE requests its removal, POST asks the resource to process supplied content, and PATCH applies a described modification. **Idempotence** means repeating the intended request has the same intended effect as performing it once; response codes need not be identical.

@fig cn_http | The method names the requested operation and the status reports its result. Orange marks Finch's GET request, whose semantics differ from a state-changing POST. | narrow

### Status codes

`200`, `201` and `204` mean success with a normal response, created resource or no content respectively. `301` and `302` redirect, while `307` and `308` explicitly preserve the method on redirect. `400` reports a malformed request, `401` requires authentication, `403` refuses permission, `404` lacks a resource, `409` conflicts with state, and `429` rejects excess demand. `500` is an internal server error, `502` an invalid upstream response, `503` unavailability and `504` an upstream timeout.

A timeout after POST leaves an uncertain effect. The server may have processed it and lost the reply. Idempotent semantics or an application idempotency key lets a retry avoid creating another purchase. PUT's replacement intent differs from PATCH's modification instructions; a PATCH that increments a counter is not inherently idempotent. [HTTP semantics](https://datatracker.ietf.org/doc/html/rfc9110) defines these contracts independently of TCP reliability. An interview answer should describe the operation and replay risk, then choose the method.

:::warn Watch out
A `401` and a `403` do not diagnose the same problem, and a `504` does not prove the upstream application did nothing. Interpret a response at the component that generated it before deciding whether a retry is safe.
:::

## 35. HTTP headers, validators and caching

Finch already has yesterday's representation but needs to know whether it remains current. A **cache validator** names a representation or its modification time so a client can ask whether its cached copy still matches. ETag supplies an opaque representation tag. If-None-Match carries that tag back, and a matching conditional GET can receive `304 Not Modified` without downloading the representation body again.

@fig cn_cache_headers | The browser returns its ETag in If-None-Match. Orange marks the conditional request carrying the stored validator; an allowed `304` response lets the browser reuse its stored bytes. | narrow

Host identifies the intended virtual host in HTTP/1.1. Content-Type describes the body format, Content-Length describes its length where that framing applies, and Accept describes acceptable response types. Authorization carries authentication information, Cookie returns browser-held cookie values, and Set-Cookie asks the browser to store them. Location identifies a redirect or another relevant resource. User-Agent identifies the client software's chosen product description; it is not a trustworthy authentication statement.

Cache-Control controls storage and freshness. `no-cache` requires validation before reuse rather than forbidding storage; `no-store` directs caches not to store the exchange. `private` limits shared caching, and public cacheability needs care when responses vary by authorization or cookie. Last-Modified can support time-based validation, while Vary identifies request headers that distinguish representations. A cache key omitting a meaningful variant can return someone else's content.

For an illustrative `300` second freshness budget with `120` seconds of age and no other age contributions, `180` seconds remain. HTTP's actual age calculation includes response timing and Age metadata, so the simplified subtraction is a teaching case. A DNS TTL with the same values expires a name answer; it does not expire a web representation.

[The HTTP caching specification](https://www.rfc-editor.org/rfc/rfc9111) describes shared and private caches. The interviewer usually wants the difference between freshness, which permits reuse without asking, and validation, which contacts the server to check a stored copy. That distinction also explains why invalidation is harder across independently cached copies.

:::note Validators and write conditions
A validator can also protect a write from overwriting a representation that changed since the client read it. Conditional writes and cache revalidation use related metadata but solve different application problems.
:::

## 36. HTTP versions and head-of-line blocking

Finch's page asks for several resources. Opening a fresh transport connection for each spends setup time repeatedly, while forcing every response into one ordered conversation can make unrelated work wait. HTTP versions change connection use and framing while keeping resource semantics recognizable.

### HTTP/1.0 and HTTP/1.1

HTTP/1.0 commonly closed a connection after an exchange, although extensions could support persistence. HTTP/1.1 made persistent connections the ordinary model and supports chunked transfer framing. Pipelining sends requests before earlier responses finish, but their responses must remain in the relevant order. A slow response can therefore delay later responses on that connection.

### HTTP/2

HTTP/2 uses binary frames, distinct streams and header compression. Several requests can make progress within one TCP connection without requiring HTTP/1.1 response ordering. Yet TCP still delivers one ordered byte stream. A missing TCP segment delays every HTTP/2 stream whose later bytes sit behind that gap.

### HTTP/3

HTTP/3 carries HTTP over QUIC. Distinct QUIC streams have distinct delivery order, so loss affecting one stream need not hold the already received bytes of another. Shared congestion limits and connection-level resources still couple their capacity. Saying HTTP/3 removes every kind of waiting would be wrong.

@fig cn_versions | HTTP/2 separates application streams inside TCP, while HTTP/3 separates transport delivery with QUIC. Orange marks the transport change that alters loss-induced waiting between streams. | narrow

In Finch's simplified cold TCP and TLS trace, setup and the first response consume `120` ms at `40` ms per sequential RTT. Reusing a connection can avoid the setup portions; multiplexing does not remove geographic propagation. A warm cache can avoid the request entirely. State the cache and connection assumptions before comparing protocols by a latency number.

The [HTTP/2 specification](https://www.rfc-editor.org/rfc/rfc9113) and [HTTP/3 specification](https://www.rfc-editor.org/rfc/rfc9114) define their framing separately. The useful historical change is repeated connection setup becoming persistence, then stream multiplexing, then independent transport streams. The next part examines the QUIC and TLS mechanisms that make the final change possible.

:::interview Interview lens
**"Why can HTTP/2 still have head-of-line blocking?"** HTTP/2 separates requests into application streams, but TCP still delivers one contiguous byte sequence. Loss creates a gap before bytes belonging to several streams can reach HTTP. QUIC orders bytes separately per stream, so another stream can progress when its own bytes are complete. Congestion control still shares path capacity across the connection.
:::

:::key In one breath
DNS resolves names through authority and caches typed answers for bounded lifetimes. HTTP defines resource operations and response meanings independently of its transport. Fresh caches avoid requests, while validators allow stored representations to be checked without retransmitting their bodies. HTTP/2 multiplexes application streams over TCP and HTTP/3 uses QUIC to separate their transport delivery.
:::

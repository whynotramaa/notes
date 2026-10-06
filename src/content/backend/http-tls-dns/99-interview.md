@chapter faq | Interview question bank | Questions in the order the unit teaches them. Answer each aloud before reading the model answer.

### HTTP messages

**Q1. What is HTTP, in one sentence?**

A stateless request/response protocol in which a client sends a method, a target and headers, and the server returns exactly one status, headers and an optional body. The server never speaks first. State across requests travels in cookies or tokens.

**Q2. What are the parts of an HTTP/1.1 request?**

A request line with method, target and version, then header lines, then an empty line, then an optional body. The response has the same shape with a status line instead. HTTP/2 and HTTP/3 carry the same fields in binary frames.

**Q3. How does a server know where a request body ends?**

Either Content-Length gives the exact byte count, or Transfer-Encoding: chunked sends size-prefixed chunks ending with a zero-size chunk. Without one of these, a persistent connection cannot separate one message from the next. A message with both is ambiguous and should be rejected.

**Q4. What is the difference between Content-Type and Content-Encoding?**

Content-Type says what the bytes represent, such as JSON. Content-Encoding says how they were transformed for transport, such as gzip. A gzipped JSON body has Content-Type application/json and Content-Encoding gzip.

**Q5. Why is the Host header mandatory in HTTP/1.1?**

One IP address usually serves many domains. The server uses Host to choose which site or application handles the request. Building absolute URLs from an unvalidated Host enables host header injection.

**Q6. Which request headers can a client forge?**

All of them. User-Agent, Referer, Origin and even Host are just bytes the client chose. Browsers restrict some headers for scripts, but any non-browser client can send anything.

### HTTP methods and idempotency

**Q7. What is the difference between PUT and PATCH?**

PUT replaces the whole resource with the representation sent, so omitted fields disappear. PATCH applies a partial change described by a patch format such as JSON Merge Patch. PUT is idempotent by definition, while PATCH is only idempotent if the patch sets values rather than appending.

**Q8. Why should GET never change state?**

Browsers, crawlers, link previewers and proxies assume GET is safe, so they prefetch, retry and cache it freely. A state-changing GET will eventually run without the user meaning it to. Use POST or DELETE for changes.

**Q9. What does "safe" mean for an HTTP method?**

The client does not request any change to server state. GET, HEAD and OPTIONS are safe. Server-side side effects such as logging do not break safety, because the client did not ask for them.

**Q10. What does "idempotent" mean?**

Sending the same request once or many times leaves the server in the same final state. Safe methods, PUT and DELETE are idempotent. The responses may differ, as when a second DELETE returns 404.

**Q11. Why is a timed-out POST dangerous to retry?**

The timeout tells the client nothing about whether the server acted. If only the response was lost, a retry repeats the effect, such as charging a card twice. The client needs an operation identity the server can recognise.

**Q12. How does an idempotency key work?**

The client generates a unique key per logical operation and sends it with every attempt. The server stores the key and the outcome atomically with the effect, and replays the stored outcome for repeats. It also stores a request fingerprint to reject the same key with a different body.

**Q13. What are HEAD, OPTIONS and CONNECT for?**

HEAD returns GET's headers without the body, useful for size and freshness checks. OPTIONS reports allowed methods and serves as the CORS preflight. CONNECT asks a proxy to open a raw tunnel, used for HTTPS through forward proxies.

### HTTP status codes

**Q14. When do you return 201 versus 200?**

201 when the request created a resource, with a Location header pointing to it. 200 for general success with a body. Returning 200 after a create hides the new resource's address from the client.

**Q15. When is 202 the right answer?**

When the server accepted the work but will finish it later, such as a long report. It should return a job URL the client can poll. Returning 200 would falsely claim the work is done.

**Q16. Why is authentication failure 401 while authorization failure is usually 403?**

401 means the server does not know who you are, so the client should authenticate and retry, and it must send WWW-Authenticate. 403 means the server knows who you are and refuses, so re-authenticating with the same identity will not help. Some APIs return 404 instead of 403 to hide that a resource exists.

**Q17. Why might an API return 409 instead of 400?**

400 means the request is malformed in itself. 409 means it is valid but conflicts with current state, such as a duplicate email or paying an already-paid order. The client reacts differently, fixing code after a 400 and re-reading state after a 409.

**Q18. What is the difference between 400 and 422?**

400 means the server could not parse or understand the request, such as invalid JSON. 422 means it parsed but the content fails validation, such as a negative quantity. Many APIs use 400 for both, which is acceptable if the error body explains.

**Q19. What is the difference between 502 and 504?**

Both come from a proxy. 502 means the backend returned something invalid or reset the connection. 504 means the backend did not answer before the proxy's timeout. Neither tells you whether the backend completed the work.

**Q20. When should a server return 503?**

When it is deliberately refusing work for now, during overload or maintenance. It should include Retry-After. Load balancers often treat 503 as a signal to try another backend.

**Q21. What is the difference between 301, 302, 307 and 308?**

301 and 308 are permanent, 302 and 307 temporary. 307 and 308 forbid changing the method, so a redirected POST stays a POST with its body. 301 and 302 historically turned POST into GET, so APIs should use 307 or 308.

**Q22. What does 304 mean?**

The client's cached copy is still current, answered to a conditional GET with If-None-Match or If-Modified-Since. It has no body. It saves bandwidth, not a round trip.

### HTTP caching headers

**Q23. What is the difference between no-cache and no-store?**

no-cache allows storage but requires revalidation before every use. no-store forbids storing the response anywhere. Sensitive data needs no-store.

**Q24. How does ETag-based revalidation work?**

The server tags each response with a version, the client sends it back in If-None-Match, and the server returns 304 with no body if it still matches. Otherwise it returns 200 with the new body and tag. Strong ETags are byte-exact, while weak ones mean semantically equivalent.

**Q25. How do you prevent lost updates over HTTP?**

Use ETags as versions and require If-Match on writes. The server compares the tag with the current version atomically and returns 412 if it changed. The client re-reads and merges.

**Q26. What does Vary do?**

It lists request headers that become part of a shared cache's key. Vary: Accept-Encoding stores one copy per encoding. Varying on high-cardinality headers such as User-Agent effectively disables caching.

### HTTP versions

**Q27. What did HTTP/1.1 keep-alive fix?**

It let one TCP connection carry many requests, saving a TCP and TLS handshake per request. At 40 ms round trip that is 80 ms per request with TLS 1.3. Idle connections still cost file descriptors on the server.

**Q28. What is head-of-line blocking in HTTP/1.1?**

A connection returns responses in order, one at a time, so one slow response delays all requests queued behind it. Pipelining did not fix this and was rarely enabled. Browsers opened about six connections per host instead.

**Q29. What does HTTP/2 change?**

It replaces text with binary frames tagged by stream id and interleaves many streams on one connection. It compresses headers with HPACK. The methods, headers and status codes stay the same.

**Q30. Why can HTTP/2 be slow on lossy networks?**

All streams share one TCP byte stream, which must be delivered in order. One lost packet stalls every stream until it is retransmitted. Several HTTP/1.1 connections spread that risk.

**Q31. Why does HTTP/3 reduce head-of-line blocking?**

QUIC orders data per stream rather than per connection. A lost packet delays only the streams whose data it carried. It also merges transport and TLS setup into one round trip.

**Q32. What is QUIC connection migration?**

QUIC names connections by a connection ID instead of the IP and port pair. When a phone changes networks, the server recognises the ID from the new address and the connection continues. A TCP connection would break.

### TLS and the handshake

**Q33. What does TLS guarantee?**

Confidentiality, integrity and server authentication, plus client authentication when mutual TLS is used. It does not hide the server IP, the packet sizes or, without ECH, the SNI host name.

**Q34. Why does TLS use both asymmetric and symmetric cryptography?**

Asymmetric cryptography can agree on keys and prove identity between strangers, but it is slow. Symmetric ciphers such as AES-GCM are fast but need a shared key. The handshake uses the first to set up the second.

**Q35. What is forward secrecy?**

Past sessions stay secret even if the server's long-term private key is stolen later. Ephemeral Diffie-Hellman keys provide it because session keys are never derivable from the certificate key. TLS 1.3 requires it.

**Q36. Walk through a TLS 1.3 handshake.**

ClientHello sends versions, cipher suites, a key share, SNI and ALPN. ServerHello picks a suite and sends its key share, after which everything is encrypted. The server sends its certificate, a signature over the transcript and Finished, and the client verifies and sends Finished with its first request.

**Q37. What is 0-RTT and what is its risk?**

A resuming client sends application data in its first flight using a pre-shared key from a ticket. That data can be replayed by an attacker. Servers accept it only for safe, idempotent requests or reject it with 425.

**Q38. What are SNI and ALPN?**

SNI carries the requested host name in ClientHello so the server can choose the matching certificate. ALPN carries the list of application protocols so the server can choose HTTP/2 or HTTP/1.1. Both avoid extra round trips.

### Certificates and trust

**Q39. How does a client validate a certificate?**

It builds a chain from the leaf through intermediates to a trusted root, verifies each signature, checks validity dates, matches the host name against the SAN, checks revocation, and verifies the server's proof of the private key. Any failure aborts the handshake.

**Q40. What is OCSP stapling?**

The server periodically fetches a signed revocation status from the CA and includes it in the handshake. Clients verify it without contacting the CA. It removes a round trip and a privacy leak.

**Q41. What does HSTS protect against?**

Downgrade to plain HTTP by an attacker who intercepts the first insecure request. After one HTTPS response with the header, the browser uses HTTPS for the domain for max-age seconds. The preload list protects even the first visit.

**Q42. What is the risk of certificate pinning?**

If the pinned key must change unexpectedly, every client with the old pin fails until it updates. Mobile apps can be stranded for weeks. Pin an intermediate or CA key, keep a backup pin, and keep a remote way to disable pinning.

**Q43. Where should TLS terminate?**

Usually at the load balancer or edge, which centralises certificates and allows HTTP routing. Traffic behind it is then plain unless re-encrypted. Use mTLS between services when the internal network is not trusted.

### DNS for backend engineers

**Q44. What is the difference between a recursive resolver and an authoritative server?**

A recursive resolver answers clients by querying the hierarchy and caching results. An authoritative server holds the zone data and gives definitive answers. Your application talks only to a recursive resolver.

**Q45. Why can't a CNAME sit at the zone apex?**

A CNAME must be the only record at its name, but the apex must also hold SOA and NS records. Providers offer ALIAS or ANAME records that resolve the target server-side and return A records. Wren's `www` can be a CNAME, but `wren.example` cannot.

**Q46. What is DNS propagation, really?**

Cached copies of the old answer expiring at their own pace across resolvers, operating systems and applications. Nothing is pushed. Lowering the TTL in advance shortens it.

**Q47. What happens when you change an IP but clients still have the old record cached?**

They keep connecting to the old IP until their caches expire, and longer for clients that ignore TTLs or hold long-lived connections. Keep the old server serving until its traffic stops. Lower the TTL before the change, not at the same time.

**Q48. Why is DNS failover slower than load balancer failover?**

DNS changes wait for TTL expiry in caches you do not control, so they take minutes. A load balancer health-checks backends and stops routing to a failed one within seconds. Put a stable load balancer address behind the name.

### End to end

**Q49. How long does a cold HTTPS request to Wren take, and where does the time go?**

About 175 ms at a 40 ms round trip: 25 ms of DNS, 40 ms of TCP, 40 ms of TLS 1.3, and 70 ms for the request and response including 30 ms of server work. Only 30 ms is application code. Connection reuse cuts it to 70 ms.

**Q50. Walk me through exactly what happens after entering https://example.com.**

HSTS check, connection pool check, DNS resolution through caches and the resolver hierarchy, TCP or QUIC setup, a TLS 1.3 handshake with SNI, ALPN and certificate validation, then an HTTP/2 or HTTP/3 request. An edge or load balancer terminates TLS and routes to an app that authenticates, authorises, queries and responds. The browser renders and fetches sub-resources over the same connection. Each step has a failure mode worth naming.

**Q51. What changed between HTTP/1.0 and HTTP/3?**

HTTP/1.0 opened a connection per request. HTTP/1.1 kept connections alive, HTTP/2 multiplexed binary streams on one TCP connection, and HTTP/3 moved to QUIC to remove transport head-of-line blocking and merge the TLS handshake. The methods, status codes and headers barely changed.

@chapter exercises | Exercises | One dot is arithmetic on Wren's numbers, two dots need a trace or an explanation, three dots need a derivation, code or a design.

### HTTP messages and methods

**E1** ● Wren serves 43,200,000 requests a day with 2,000-byte responses. How many response bytes is that per day, and per day after an average 4:1 compression?

**E2** ● A client requests `Range: bytes=2000000-2999999` of a 10,000,000-byte file. How many bytes come back, with which status and which Content-Range header?

**E3** ● A chunked body arrives as chunks of size `7d0` and `400` (hex) followed by `0`. How many body bytes is that?

**E4** ● Wren's upload limit is 1 MiB. Is a 1,048,577-byte body accepted, and if not, which status code is returned?

**E5** ●● For each case, name the method and explain whether a blind retry is safe: reading the menu, replacing an address, adding one item to a basket, cancelling order 123, and creating an order.

**E6** ●● Explain to a product manager, without HTTP jargon, why a payment retry charged a customer twice and how idempotency keys prevent it.

### Status codes and caching

**E7** ●● Choose the status code for each Wren case: malformed JSON, quantity of minus 5, ordering from a closed restaurant, an expired token, user 42 reading user 43's order, `DELETE /menu`, a 20 MB image upload, and a crashed database driver.

**E8** ● 1,000 menu revalidations per second each return 304 instead of a 2,000-byte body. How many body bytes per second are saved?

**E9** ●● A response carries `Cache-Control: max-age=60, stale-while-revalidate=30` and was fetched at t = 0. What does a cache do for requests at t = 30, t = 70 and t = 95?

**E10** ● One URL is served with 3 possible encodings and 500 distinct User-Agent strings. How many cache entries does it need under `Vary: Accept-Encoding`, and under `Vary: Accept-Encoding, User-Agent`?

**E11** ●● Two editors read the menu at ETag "v7". Trace the requests and responses when A saves, then B saves, with If-Match in use. What version is final and what does B see?

### HTTP versions

**E12** ● A page needs 30 resources, each taking one 40 ms round trip. How long with 1 HTTP/1.1 connection, with 6, and with HTTP/2 multiplexing, ignoring bandwidth?

**E13** ● Three sequential requests each need 70 ms of request round trip plus server time. How long do they take if each opens a new TCP plus TLS 1.3 connection (80 ms), versus one kept-alive connection?

**E14** ● An `authorization` header of 600 bytes is sent on 100 requests over HTTP/2. If HPACK sends it literally once and as a 1-byte index after that, how many bytes are sent for it in total, compared with 100 literal copies?

**E15** ●● Explain, without equations, why HTTP/2 can lose to HTTP/1.1 on a lossy mobile link, and why HTTP/3 does not have that problem.

### TLS and certificates

**E16** ● Run Diffie-Hellman with $p = 23$, $g = 5$, client secret 4 and server secret 3. What are the public values and the shared key?

**E17** ● With a 60 ms round trip, 25 ms of DNS and 30 ms of server time, compute time to first response for TCP plus TLS 1.2, TCP plus TLS 1.3, QUIC, and a reused connection.

**E18** ● Renewing at two thirds of the lifetime, on which day do you renew a 90-day certificate, and a 47-day one?

**E19** ●● Explain forward secrecy without equations, using a stolen server key and a recording of last year's traffic.

**E20** ●● A Go service calls a partner over HTTPS and a developer set `InsecureSkipVerify: true` to fix a test failure. Describe the attack this enables and the correct fix.

### DNS and the full request

**E21** ● Wren lowers its TTL from 300 s to 60 s at t = 0. What is the earliest safe time to change the A record, and by when have all TTL-respecting caches picked up the new address?

**E22** ●● List the record types Wren needs for: the API address on IPv4 and IPv6, `www` served by a CDN, mail delivery, a domain ownership check, and a gRPC service on port 8443.

### Derivations, code and design

**E23** ●●● Prove from the definitions that every safe method is idempotent, and show with an example that the converse is false.

**E24** ●●● Derive a formula for cold-start time to first response with DNS time $T_d$, round-trip time $R$, $k$ handshake round trips before the request and server time $S$. Check it against Wren's 175 ms.

**E25** ●●● Write a Python request handler for `POST /payments` that uses an idempotency key with a database unique constraint, handles a repeat with the same body, a repeat with a different body, and a concurrent repeat.

**E26** ●●● Design a zero-downtime move of `api.wren.example` to a new load balancer in a new region, covering the certificate, DNS, HSTS, connection draining and how you know the old address is unused.

**E27** ●●● Count Wren's daily TLS work. Each connection carries 20 requests on average and a full TLS 1.3 handshake costs 1 ms of CPU. How many handshakes per day and per peak second, how many CPU seconds per day, and how many cores at peak?

@chapter solutions | Worked solutions | Every number below was computed from the stated inputs.

**E1.** Bytes per day are 43,200,000 × 2,000 = 86,400,000,000 bytes, which is 86.4 GB. At 4:1 compression the body bytes fall to 86,400,000,000 / 4 = 21,600,000,000 bytes, or 21.6 GB. Headers and TLS overhead are not counted.

**E2.** The range 2,000,000 to 2,999,999 is inclusive, so it holds 2,999,999 − 2,000,000 + 1 = 1,000,000 bytes. The status is 206 Partial Content and the header is `Content-Range: bytes 2000000-2999999/10000000`.

**E3.** `7d0` hex is 7 × 256 + 13 × 16 + 0 = 2,000 bytes, and `400` hex is 4 × 256 = 1,024 bytes. The zero chunk ends the body, so the total is 3,024 bytes.

**E4.** 1 MiB is 1,048,576 bytes, and 1,048,577 is one byte over. The server rejects it with 413 Content Too Large, ideally before reading the whole body, based on Content-Length.

**E5.** Reading the menu is GET, safe and idempotent, so retry freely. Replacing an address is PUT, idempotent, so retry. Adding one item is POST or an appending PATCH, not idempotent, so a retry can add the item twice unless it carries an idempotency key. Cancelling order 123 is DELETE or a POST to a cancel action, and DELETE is idempotent. Creating an order is POST, not idempotent, and needs a key.

**E6.** The app asked the bank to charge the card, the bank did, but the confirmation got lost on the way back because the phone lost signal. The app could not tell "never arrived" from "arrived but the reply was lost", so it asked again and the bank charged again. An idempotency key is a reference number the app writes on the request before sending it. The bank keeps a list of reference numbers it has already processed, and when the same number arrives again it replies "already done" with the original receipt instead of charging.

**E7.** Malformed JSON is 400. Quantity minus 5 is 422, or 400 if the API uses one validation code. A closed restaurant is 409, since the request is valid but conflicts with current state. An expired token is 401 with WWW-Authenticate. User 42 reading user 43's order is 403, or 404 to avoid revealing that order 43 exists. `DELETE /menu` is 405 with an Allow header. A 20 MB upload over the limit is 413. A crashed database driver inside Wren's code is 500.

**E8.** Each 304 omits a 2,000-byte body, so 1,000 × 2,000 = 2,000,000 body bytes per second are saved. The headers are still sent in both directions.

**E9.** At t = 30 the response is fresh (30 < 60), so the cache serves it directly. At t = 70 it is stale but within the 30-second window (60 < 70 ≤ 90), so the cache serves the stale copy and revalidates in the background. At t = 95 it is past 90, so the cache must revalidate before serving.

**E10.** Varying on encoding alone needs 3 entries. Adding User-Agent multiplies by 500 for 3 × 500 = 1,500 entries, most of which will be requested rarely, so the hit ratio collapses.

**E11.** A sends `PUT /menu` with `If-Match: "v7"`. The current version is v7, so the write succeeds, the version becomes v8, and A gets 200 with `ETag: "v8"`. B sends `PUT /menu` with `If-Match: "v7"`. The current version is v8, so the server returns 412 Precondition Failed and writes nothing. The final version is v8 with A's change, and B must GET v8, merge and retry with `If-Match: "v8"`.

**E12.** One connection serves 30 requests in sequence, 30 × 40 = 1,200 ms. Six connections need ⌈30 / 6⌉ = 5 rounds, 5 × 40 = 200 ms. HTTP/2 sends all 30 at once on one connection, so one round of 40 ms, ignoring bandwidth and server time.

**E13.** New connections cost 3 × (80 + 70) = 450 ms. One kept-alive connection costs 80 + 3 × 70 = 290 ms. Keep-alive saves 160 ms, two handshakes of 80 ms.

**E14.** With HPACK, 600 + 99 × 1 = 699 bytes. Literal copies would be 100 × 600 = 60,000 bytes. The saving is 59,301 bytes. Real HPACK also applies Huffman coding to the literal, so the first copy is a little smaller.

**E15.** HTTP/2 puts every request on one connection, and that connection delivers bytes strictly in order. When one packet goes missing, everything after it waits, even data for unrelated requests that already arrived. Six HTTP/1.1 connections are six separate queues, so one loss stalls only one of them. HTTP/3 keeps separate ordering for each request inside one connection, so a loss only stalls the request whose data was lost.

**E16.** The client sends $5^4 \bmod 23 = 625 \bmod 23 = 4$. The server sends $5^3 \bmod 23 = 125 \bmod 23 = 10$. The client computes $10^4 \bmod 23 = 10{,}000 \bmod 23 = 18$, and the server computes $4^3 \bmod 23 = 64 \bmod 23 = 18$. The shared key is 18.

**E17.** TLS 1.2 needs DNS, TCP, two TLS round trips and the request: 25 + 60 + 120 + 60 + 30 = 295 ms. TLS 1.3 needs one TLS round trip: 25 + 60 + 60 + 60 + 30 = 235 ms. QUIC merges transport and TLS: 25 + 60 + 60 + 30 = 175 ms. A reused connection needs only the request: 60 + 30 = 90 ms.

**E18.** For 90 days, 2/3 × 90 = day 60. For 47 days, 2/3 × 47 = 31.33, so renew on day 31.

**E19.** Suppose someone records all your encrypted traffic for a year, and then steals the server's key. With the old design, that key was used to wrap each conversation's secret, so the thief can unwrap every recording. With forward secrecy, each conversation invented a fresh throwaway secret, used the server key only to sign "it really is me", and then deleted the throwaway. The stolen key can impersonate the server from now on, but it cannot unlock anything recorded before.

**E20.** The client now accepts any certificate, including one an attacker generated. An attacker who can intercept traffic, through a compromised router, a malicious Wi-Fi network or DNS spoofing, can terminate TLS with their own certificate, read the API keys and data, and forward everything to the real partner unnoticed. The fix is to remove the flag and, for the test environment, add the test CA to the client's trust pool (`RootCAs` in Go's `tls.Config`) or use a properly issued certificate.

**E21.** Caches that fetched just before t = 0 hold the old record with up to 300 seconds left, so wait until t = 300 before changing the address. Changing it at t = 300, every TTL-respecting cache has the new address by t = 300 + 60 = 360 seconds.

**E22.** An A record and an AAAA record for `api`. A CNAME for `www` pointing at the CDN host name. MX records for the apex pointing at the mail servers. A TXT record at the apex for the ownership token. An SRV record `_grpc._tcp.orders` with priority, weight, port 8443 and target host.

**E23.** A safe method requests no change to server state. Let $s$ be any state. One safe request leaves the state $s$, and so does each further request, by the same argument applied to each in turn, so $n$ requests leave $s$ for every $n \ge 1$. That is the definition of idempotent, since one request and $n$ requests reach the same state. The converse fails. DELETE /orders/123 changes state, so it is not safe, yet one or ten calls all leave order 123 deleted, so it is idempotent.

**E24.** The client spends $T_d$ on DNS, then $k$ round trips of setup, then one round trip to carry the request and response, plus $S$ on the server.

$$T = T_d + (k + 1)R + S$$

Read it as DNS time plus one round trip per handshake step and one for the exchange itself, plus server time. TCP plus TLS 1.3 has $k = 2$. With $T_d = 25$, $R = 40$ and $S = 30$, $T = 25 + 3 \times 40 + 30 = 175$ ms, matching Section 34. For TLS 1.2, $k = 3$ gives 215 ms, and a reused connection has $T_d = 0$ and $k = 0$ for 70 ms.

**E25.** The key row is inserted in the same transaction as the charge record, and the unique constraint arbitrates concurrent repeats.

```python
import hashlib, json

def create_payment(db, key, body):
    fp = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    with db.transaction():
        row = db.fetchone("SELECT fingerprint, status, response FROM idem_keys WHERE key = %s FOR UPDATE", [key])
        if row:
            if row.fingerprint != fp:
                return 422, {"error": "key reused with a different body"}
            if row.status == "running":
                return 409, {"error": "request in progress"}
            return 200, json.loads(row.response)
        db.execute("INSERT INTO idem_keys (key, fingerprint, status) VALUES (%s, %s, 'running')", [key, fp])
    result = charge_card(body["amount"], idempotency_key=key)
    with db.transaction():
        db.execute("UPDATE idem_keys SET status = 'done', response = %s WHERE key = %s", [json.dumps(result), key])
    return 201, result
```

The first `INSERT` is protected by a primary key on `key`, so two concurrent first arrivals cannot both insert; the loser gets a unique violation and should return 409. The payment provider call also receives the key, so a crash between charging and recording cannot double charge on retry.

**E26.** Issue a certificate for `api.wren.example` on the new load balancer first and verify the chain and SAN from outside. Bring up the new region behind it and send it shadow or test traffic. Lower the DNS TTL from 300 to 60 seconds and wait at least 300 seconds. Change the A and AAAA records, using weighted routing to send 10% first if the provider supports it, then 100%. HSTS needs no change because the scheme and host name stay the same. Keep the old load balancer serving, with connection draining so in-flight requests finish, and watch its request rate and the client versions still hitting it. Decommission only after its traffic has been near zero for a few days, then raise the TTL again.

**E27.** Handshakes per day are 43,200,000 / 20 = 2,160,000. At 1 ms each, that is 2,160 CPU seconds per day. At peak, 2,000 requests per second need 2,000 / 20 = 100 handshakes per second, which is 100 ms of CPU per second, or 0.1 of one core. Handshake cost is small for Wren, but it grows fast if connection reuse breaks, since at one request per connection the peak cost is 2 full cores.

### Primary sources

[RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110). Methods, status codes, conditional requests and content negotiation.

[RFC 9111, HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111). Freshness, validation and Vary.

[RFC 9113, HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) and [RFC 9114, HTTP/3](https://www.rfc-editor.org/rfc/rfc9114). Framing, streams and the QUIC mapping.

[RFC 8446, TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446). The handshake, key schedule and 0-RTT.

[RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) and [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308). DNS concepts and negative caching.

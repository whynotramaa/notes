@chapter faq | Interview question bank | Explain the message path before naming products.

### Naming and transport

**Q1. What does DNS resolve?**

A name becomes records such as an address. The resolver may answer from cache; it does not fetch the application resource.

**Q2. Does a DNS TTL end a connection?**

No. It limits cached record lifetime, while an established connection can continue using the old address.

**Q3. What does TCP guarantee?**

It delivers an ordered byte stream while the connection operates. It does not guarantee an application commit or preserve message boundaries.

**Q4. Why would you choose UDP?**

Datagrams give the application control over loss and timing. The application must add any ordering, recovery, or congestion behavior it needs.

**Q5. Why is a successful send ambiguous?**

Transport acceptance and application durability are different boundaries. The receiver may fail before committing the operation.

### Protocols and security

**Q6. What changes in HTTP/2?**

Frames multiplex concurrent streams on one TCP connection. TCP loss can still delay bytes for every stream.

**Q7. What changes in HTTP/3?**

HTTP uses QUIC streams. Loss recovery within one stream does not impose TCP's connection-wide ordered byte delivery.

**Q8. Does HTTP/3 remove all blocking?**

No. Streams still have ordering and share congestion constraints, and the application can have its own queues.

**Q9. What does TLS authenticate?**

A verified certificate and hostname authenticate the server endpoint. User identity and resource permission remain application checks.

**Q10. What is the illustrative cold request cost?**

The assumed DNS, TCP, TLS, and exchange costs sum to 160 ms. Connection reuse leaves the assumed 40 ms exchange.

### Application contracts

**Q11. Is any JSON API REST?**

No. REST describes architectural constraints and resource interactions, not an encoding format.

**Q12. Why use gRPC internally?**

A shared schema gives typed method contracts and streaming calls. Teams must still manage schema compatibility and proxy support.

**Q13. What does SSE provide?**

It streams server-to-client text events over HTTP. Retained history and correct replay remain the server's job.

**Q14. What does WebSocket provide?**

It provides bidirectional messages over a persistent connection. It does not supply application acknowledgements or durable replay.

**Q15. Which fits a one-way score feed?**

SSE is a reasonable starting point. Choose WebSocket when the client also needs frequent messages or a different message contract.

### Routing and pools

**Q16. What is a reverse proxy?**

It accepts traffic on behalf of backend servers. It can also route requests and terminate TLS.

**Q17. How do L4 and L7 differ?**

L4 routes from transport information. L7 understands application information such as an HTTP path.

**Q18. Can an L4 balancer route by encrypted path?**

No. It cannot inspect a path hidden inside TLS without an appropriate decryption boundary.

**Q19. What is keep-alive?**

It reuses an existing connection. TCP keepalive probes are a separate mechanism for detecting an idle failed peer.

**Q20. Why bound a connection pool?**

It bounds concurrent database work. Unlimited connections move overload into the database.

**Q21. What is the ideal example pool capacity?**

Twenty connections occupied for 0.01 s each give 2,000 operations per second. Contention can lower actual capacity.

### Time and duplicates

**Q22. Timeout or deadline?**

A timeout bounds one wait; a deadline bounds the whole operation. Propagate remaining time to downstream work.

**Q23. Which failures should be retried?**

Suitable transient failures within a bounded budget. Deterministic validation errors need a corrected request.

**Q24. Why exponential backoff?**

Repeated attempts become less frequent. A cap and total retry budget keep delays and work bounded.

**Q25. Why jitter?**

Random timing prevents synchronized retry bursts. It spreads load while a dependency recovers.

**Q26. What is retry amplification?**

Attempt counts multiply across independently retrying layers. Three attempts at three layers can reach 27 database attempts.

**Q27. What does idempotent mean?**

Repeating the same operation has the same intended effect. Responses may still differ in incidental details.

**Q28. Can POST be retried safely?**

An application can make its effect duplicate-safe using a stable key. The method name alone does not supply that guarantee.

**Q29. Where must the key be recorded?**

In the same atomic commit as the effect it protects. Otherwise a crash can separate the effect from its deduplication record.

**Q30. What if a key is reused with another body?**

Reject the mismatch. Returning the first result silently would hide a client error.

### Delivery and the full path

**Q31. How much does polling cost here?**

The audience divided by the poll interval gives 10,000 requests per second. Most may report no change.

**Q32. What is long polling?**

The server holds a request until an event or timeout. The client then opens another request.

**Q33. What state does push require?**

Connections, subscriptions, and bounded send buffers. Recovery also requires a snapshot or retained events.

**Q34. What happens to a slow viewer?**

Its send buffer fills. Disconnect, coalesce suitable updates, or use a bounded replay path instead of blocking all viewers.

**Q35. Do sockets equal in-flight requests?**

No. Idle persistent sockets may have no request in progress, and multiplexed connections can carry several requests.

**Q36. What is Heron's API payload bandwidth?**

Peak responses times response bytes gives 2,000,000 bytes per second. Protocol overhead is extra.

**Q37. Where can a read wait?**

Naming, setup, proxy admission, application queues, connection acquisition, locks, disk, and client receive buffers. Trace those waits separately.

**Q38. Does cancellation always stop a write?**

No. The remote server may already have committed it, or may not receive cancellation. Reconcile the outcome using operation identity.

**Q39. Walk through the whole score read.**

Resolve the endpoint, establish TLS, route the request, check permission, acquire a connection, read state, and return the representation. Give each wait a bounded budget.

**Q40. What changed between sequential and multiplexed HTTP?**

Independent application streams can share one connection. Transport ordering and application bottlenecks still determine what can wait.

### Framing, deadlines, and recovery details

**Q41. Why is a socket read not one message?**

A byte stream can split one sender write across reads or combine several writes into one read. The application parser needs framing and must retain incomplete bytes between reads.

**Q42. Does stateless REST mean no persistent data?**

No. It means a request carries the information needed to interpret the interaction instead of depending on hidden conversational state at a chosen server. Persistent resources and authentication data can still exist.

**Q43. Why does a downstream deadline shrink?**

Upstream work already consumed part of the same user budget. Pass remaining useful time and preserve enough time to return a result instead of restarting the clock.

**Q44. Can cancellation undo a completed command?**

No. The remote system may already have committed or may never observe cancellation. Recover the outcome using the original operation identity.

**Q45. Why does deduplication need a unique constraint?**

Concurrent requests can both read that a key is absent. A shared atomic uniqueness rule arbitrates the claim and prevents both applying an unprotected effect.

**Q46. What is the limit of a local idempotency record?**

It protects the effect sharing its commit boundary within the retained identity contract. A remote provider's separate action and a retry after evidence expiry require additional handling.

@chapter exercises | Exercises | Arithmetic uses the illustrative assumptions; dots mark difficulty.

**E1** ● Compute average request rate.

**E2** ● Compute peak request rate.

**E3** ● Compute API payload bytes per second.

**E4** ● Convert that payload rate to bits per second.

**E5** ● Sum the illustrative cold request delays.

**E6** ● Compute the warm exchange cost under the stated assumptions.

**E7** ● Compute the pool's ideal operations per second.

**E8** ● Compute polling requests per second.

**E9** ● Compute the mean wait for the next poll under uniform arrival phase.

**E10** ● Compute the remaining application deadline.

**E11** ●● Explain why a DNS change may not move a viewer immediately.

**E12** ●● Explain a TCP delivery guarantee without equations.

**E13** ●● Compare SSE and WebSocket for a score feed and a chat.

**E14** ●● Trace a committed command whose reply disappears.

**E15** ●● Explain why a pool cannot manufacture database capacity.

**E16** ●● Name the waits a total deadline must cover.

**E17** ●● Compute nested amplification for three attempts at three layers.

**E18** ●● Design the response to reuse of a command key with a different body.

**E19** ●● Explain why HTTP/2 still waits behind a lost TCP segment.

**E20** ●● Name the extra costs absent from the payload bandwidth calculation.

**E21** ●●● Derive full-jitter delay and specify its units and bounds.

**E22** ●●● Show a crash sequence that breaks separately committed deduplication.

**E23** ●●● Write pseudocode for atomically committing a command and its result.

**E24** ●●● Count API concurrency and live fan-out deliveries separately.

**E25** ●●● Draw the request path and assign a failure and a recovery action to every hop.

**E26** ● Compute the remaining DNS cache lifetime when the authority changes at second 20 under a 60 s cached TTL.

**E27** ● Compute the expected full-jitter delays for ceilings of 100, 200, 400, and 800 ms.

**E28** ●● Trace two pool slots serving three arriving operations without creating an extra connection.

**E29** ●● Explain a stream delivering two five-byte messages through reads of 2, 3, 1, and 4 bytes.

**E30** ●●● Trace concurrent duplicate commands through a unique-key transaction when the first transaction commits and when it rolls back.

@chapter solutions | Worked solutions | Each numerical answer is reproduced in the computation script.

**E1.** $8,640,000/86,400=100$ requests per second.

**E2.** $100\times10=1,000$ requests per second.

**E3.** $1,000\times2,000=2,000,000$ bytes per second.

**E4.** $2,000,000\times8=16,000,000$ bits per second.

**E5.** $40+40+40+40=160$ ms.

**E6.** The assumed reused connection leaves the 40 ms exchange. This conclusion depends on omitting fresh lookup and setup work.

**E7.** $20/0.01=2,000$ operations per second before waits and contention.

**E8.** $50,000/5=10,000$ requests per second.

**E9.** Uniform phase gives $5/2=2.5$ s mean wait.

**E10.** $500-40-60=400$ ms for application work.

**E11.** Cached records can point to the old endpoint, and existing connections have their own lifetimes. Keep the old endpoint serving while those paths drain.

**E12.** TCP delivers a stream in byte order. It cannot tell the sender that a remote database committed a command.

**E13.** SSE fits server-to-viewer scores. Bidirectional WebSocket messages can fit chat; both require reconnection and replay design.

**E14.** The server records the key, effect, and result, then loses the reply. A retry with the same key retrieves that result rather than applying the effect again.

**E15.** The database has finite execution resources. A pool reuses connections and bounds concurrency; adding slots beyond useful concurrency adds contention.

**E16.** Include connect, pool acquisition, request write, remote execution, response read, and any retry delay. Reserve time to return a useful final response.

**E17.** $3\times3\times3=27$ leaf attempts per original request. At 1,000 originals per second, that is 27,000 leaf attempts per second.

**E18.** Compare a payload fingerprint under the key's uniqueness constraint. Reject a different fingerprint and return the stored result for the same fingerprint.

**E19.** HTTP frames ride inside TCP's ordered stream. A missing segment can prevent delivery of later bytes containing frames for otherwise independent streams.

**E20.** Add headers, encryption records, ingress, connection setup, and retransmitted traffic. Include packetization and peak distribution when sizing interfaces.

**E21.** After attempt index $k$, compute $a_k=\min(c,b2^k)$ in time units, then sample $d_k$ uniformly in $[0,a_k]$. The expected delay is $a_k/2$; an attempt cap and parent deadline still bound total work.

**E22.** Commit the score, crash before recording the key, and receive the retry. The missing key causes another effect. Reverse the order and a crash can instead record success without applying the effect.

**E23.** The uniqueness check and score change belong to one transaction. Concurrent duplicate insertion must either wait for that commit or observe the recorded outcome.

```python
with transaction() as tx:
    saved = tx.find_command_for_update(command_id)
    if saved:
        require(saved.fingerprint == fingerprint)
        return saved.result
    result = tx.apply_score_change(command)
    tx.insert_command(command_id, fingerprint, result)
return result
```

The pseudocode assumes a unique key on `command_id` and conflict retry handling around the transaction. A read of a missing row alone does not lock out another insertion.

**E24.** Mean API concurrency is $1,000\times0.2=200$. Live fan-out is $20\times50,000=1,000,000$ deliveries per second. These measure different work.

**E25.** DNS needs refreshed records and endpoint overlap; TLS needs valid verification; the proxy needs health-aware routing and admission; the service needs validation and duplicate handling; the database needs bounded waits and recovery. A retry returns through the same operation identity.

**E26.** The remaining lifetime is 60-20=40 s. A record returned earlier can still be reused under its original lifetime after the authority changes.

**E27.** Uniform full jitter has mean equal to half its ceiling. The computed expected delays are 50, 100, 200, and 400 ms; individual samples can differ.

**E28.** A takes X and B takes Y, leaving C waiting. When A releases X, C takes it. Two occupied slots plus one waiting caller do not create three database connections.

**E29.** The first two reads total 2+3=5 bytes and complete the first message. The next read leaves one byte of the second message; the final four complete it. The total is 2+3+1+4=10 bytes, matching 5+5. Framing determines those boundaries, not read count.

**E30.** Both requests may observe absence, but the shared unique-key claim permits only one committed owner. If A commits, B observes its fingerprint and stored result. If A rolls back, a later transaction can claim the key and apply the effect. The conflict path must retry the transaction or wait according to the database contract, rather than independently repeating the business change.

### Primary sources

[HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110). Method and message semantics.

[HTTP/2](https://www.rfc-editor.org/rfc/rfc9113). Frames and multiplexing over TCP.

[HTTP/3](https://www.rfc-editor.org/rfc/rfc9114). HTTP mapping onto QUIC.

[TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446). Authentication and record protection.

[WebSockets](https://www.rfc-editor.org/rfc/rfc6455). Opening handshake and message framing.

[Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html). EventSource parsing and reconnection.

[TCP specification](https://www.rfc-editor.org/rfc/rfc9293). Ordered byte-stream behavior and transport mechanisms.

[DNS concepts](https://www.rfc-editor.org/rfc/rfc1034). Authority, resolver referrals, and caching.

[gRPC core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/). Method forms, call lifecycle, and deadlines.

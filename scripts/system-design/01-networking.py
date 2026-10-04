from author import write_unit
parts=[
('Names and addresses','We follow a score request to the server that owns it. A name alone cannot deliver a packet. We will separate DNS lookup, transport, and the application contract.',r'''
## A name is not a machine

You open `scores.heron.test` and see nothing until a server answers. **DNS** maps a name to records, including addresses; it does not fetch the score. A stub resolver asks a recursive resolver, which follows cached answers or asks the root, top-level-domain, and authoritative servers. A **TTL**, or time to live, bounds how long a DNS answer may be cached.

A cached address saves lookup work but can outlive a deployment change. Heron therefore keeps old endpoints serving during a transition and gives clients bounded connection lifetimes. A low TTL helps refresh compliant caches; it cannot move existing connections. The map shows which actor knows the answer and which actor merely knows whom to ask.

@fig sd_dns_path | Illustrative lookup path. A cached answer can stop the walk early.

:::story Picture this
A receptionist has a directory, but some entries only name another receptionist. Following those referrals finds the department. The directory does not carry the package you wanted to deliver.
:::

## TCP versus UDP

A score update arrives as packets that can disappear, duplicate, or arrive out of order. **TCP** presents an ordered byte stream, with sequence numbers, acknowledgements, retransmission, flow control, and congestion control. It does not preserve application message boundaries. The receiver must frame the bytes into messages itself.

**UDP** carries individual datagrams without a transport guarantee of delivery or ordering. Applications can add those guarantees, as QUIC does. For a live video packet, a late retransmission may be less useful than moving on; for a payment command, losing the message requires explicit recovery. Choose the needed behavior first, then the protocol.

@fig sd_transport_order | Illustrative packet loss. TCP withholds later bytes until the gap is repaired; a UDP application decides what to do.

:::warn Watch out
A successful TCP write means bytes entered a transport path. It does not prove that the remote application committed a database change.
:::

:::key In one breath
DNS locates an endpoint and caches a time-bounded answer. TCP gives an ordered byte stream; UDP gives datagrams. Neither makes an application operation durable. Keep names, connections, and committed actions separate.
:::
'''),
('HTTP and encryption','We carry an application request across the connection. Protocol versions change how requests share it. We will compare HTTP versions and then establish what HTTPS protects.',r'''
## HTTP versions and head-of-line blocking

Heron's page fetches a score and a clip thumbnail together. **HTTP** describes requests and responses, including methods, fields, status codes, and content. HTTP/1.1 supports persistent connections, but pipelined responses must appear in request order. Applications often use multiple connections to avoid waiting behind a slow response.

**HTTP/2** splits exchanges into frames and multiplexes streams over TCP. A lost TCP segment can still delay every stream using that connection. **HTTP/3** maps HTTP onto QUIC, whose streams have independent ordered delivery. A loss affecting one stream need not block another stream's delivered bytes, though shared congestion control still limits the connection.

@fig sd_http_versions | The protocol layers differ. HTTP/3 still has ordering inside each stream.

@fig sd_http_streams | Illustrative response sharing. Multiplexing removes application response ordering as a connection-wide constraint.

:::note Specifications, not speed rankings
The [HTTP/2 specification](https://www.rfc-editor.org/rfc/rfc9113) and [HTTP/3 specification](https://www.rfc-editor.org/rfc/rfc9114) define framing and transport mapping. A newer version does not guarantee a faster response on every network.
:::

## TLS and HTTPS

An attacker on the network should not read the scorer's session cookie or replace a score. **TLS** authenticates the server using a certificate chain and hostname verification, negotiates shared secrets, and protects subsequent records against inspection and modification. **HTTPS** is HTTP carried over that protected connection. Encrypting traffic does not authorize the scorer to edit every match.

For an illustrative cold request, assume separate 40 ms costs for DNS, TCP setup, TLS setup, and the HTTP exchange. Their sum is 160 ms; reusing the established connection leaves the assumed 40 ms exchange. This is a teaching budget, not a universal handshake count: resumption, QUIC, caches, and protocol options change the trace.

@fig sd_tls_sequence | Illustrative connection setup. Durations are assumed, not a benchmark.

:::interview Interview lens
**"Does HTTPS make an API secure?"** It protects the connection and authenticates the server when verification succeeds. The application still needs identity checks, resource authorization, input validation, and safe secret handling. A legitimate encrypted request can still ask for an unauthorized action.
:::

:::key In one breath
HTTP defines the application exchange. HTTP/2 multiplexes framed streams over TCP, while HTTP/3 uses QUIC streams. TLS protects traffic and authenticates an endpoint. Connection reuse can remove setup work, but application authorization remains a separate job.
:::
'''),
('Application conversations','We choose how the application expresses work. The wrong conversation creates needless waiting or a confusing contract. We will compare REST, gRPC, and the transports used for live updates.',r'''
## REST and gRPC

A viewer wants a match; a worker wants to call a typed scoring operation. **REST** is an architectural style that models resources and uses a uniform interface, with stateless requests and cache constraints. An HTTP JSON API is not automatically REST. Resource identifiers, method semantics, and representations matter more than the spelling of an endpoint.

**gRPC** exposes methods described by a service schema, commonly using Protocol Buffers and HTTP/2. It supports unary and streaming calls, deadlines, and status reporting. This helps internal teams share typed contracts; it also requires compatible generated code, proxy support, and a deliberate schema evolution policy. Browser clients may need a compatible gateway or gRPC-Web path.

@fig sd_api_contracts | Two application contracts. Both still require timeouts and authorization.

## WebSockets and SSE

The viewer should receive a score without repeatedly asking whether it changed. **WebSocket** establishes a persistent, bidirectional message channel after an opening handshake. Both ends can send messages; the application must define their format, identity, replay, and reconnection rules.

**Server-sent events**, or **SSE**, stream text events from server to client over HTTP. Browser EventSource reconnects and can send a last event identifier, but the server must retain enough history to replay. Heron's one-way score feed fits SSE; a chat with frequent client messages may fit WebSocket. Neither protocol creates an event history by itself.

@fig sd_live_protocols | The direction of useful messages decides the conversation, not a protocol popularity ranking.

:::warn Watch out
A long-lived connection needs a bounded send buffer. A slow viewer must not make every scorer wait or fill gateway memory without limit.
:::

:::key In one breath
REST describes a resource-oriented uniform interface. gRPC describes typed remote methods and streaming calls. WebSocket supports bidirectional messages; SSE supports server-to-client events over HTTP. Every contract still needs deadlines, permissions, and a recovery story.
:::
'''),
('Proxies and connection lifetimes','We put a deliberate entry point in front of the service. That entry point can route traffic, but it also adds queues and limits. We will distinguish proxy layers and count reusable connections.',r'''
## Reverse proxies, L4, and L7

The public address should not expose every application process. A **reverse proxy** accepts traffic for servers behind it, forwards requests, and may terminate TLS. A **load balancer** distributes traffic across destinations. These jobs can coexist in one product, but they are different responsibilities.

A **layer 4**, or **L4**, balancer routes using transport information such as addresses and ports. A **layer 7**, or **L7**, balancer understands application fields such as HTTP paths and headers. L7 can send `/clips` and `/scores` to different backends; that requires parsing the request and, for encrypted HTTP, a place that can see the plaintext.

@fig sd_proxy_layers | A transport route selects a connection destination; an application route can inspect a resource path.

## Keep-alive and connection pools

A process that opens a new connection for every query spends capacity on repeated setup. **Keep-alive** reuses an established connection; a **connection pool** holds a bounded set of reusable connections and lends them to callers. An HTTP keep-alive lifetime is different from a TCP keepalive probe used to detect an idle dead peer.

Assume Heron has 20 database connections and each is occupied for 0.01 s per operation. The ideal upper bound is $20/0.01=2,000$ operations per second, before contention and queueing. A large pool can overload the database instead of helping. Bound acquisition wait, idle lifetime, and total work admitted across all application processes.

@fig sd_connection_pool | Illustrative pool. A waiting caller does not create a new database slot.

:::interview Interview lens
**"Why did adding application servers make the database slower?"** Each server brought another pool and more concurrent queries. The database's CPU, locks, or disk became the shared bottleneck. I would bound the total database concurrency, inspect waits, and shed excess work instead of increasing every pool.
:::

:::key In one breath
A reverse proxy represents backends to clients. L4 routing uses transport information and L7 routing uses application information. Keep-alive saves setup work, while pools bound reusable connections. A connection limit is also a concurrency limit, and waiting needs its own deadline.
:::
'''),
('Waiting and trying again','We stop a failed call from consuming unlimited time. Retrying without a budget can magnify the original failure. We will build deadlines, backoff, and duplicate-safe operations.',r'''
## Timeouts, deadlines, and retry budgets

A score query waits on a database connection that never becomes available. A **timeout** bounds a particular wait; a **deadline** bounds when the whole operation must finish. Connect, pool acquisition, write, read, and total request waits are separate. Propagate the remaining deadline so a downstream call cannot restart the clock.

Heron's illustrative end-to-end budget is 500 ms. Reserving 40 ms for the network and 60 ms for the final response leaves 400 ms for application work. A retry must fit inside that remaining budget. Retry transient failures selectively; invalid credentials, malformed requests, and deterministic conflicts do not become correct through repetition.

@fig sd_deadline_budget | Illustrative budget in milliseconds. Each child consumes the remaining parent budget.

## Exponential backoff and jitter

A recovering service receives a fresh burst if every caller retries at the same instant. **Exponential backoff** increases the retry delay after each failure. **Jitter** randomizes that delay to spread attempts across time. Full jitter samples uniformly between zero and the capped exponential delay.

$$d_k \sim U\left(0,\min(c,b\,2^k)\right)$$

Read this as: attempt $k$ waits a random duration $d_k$ between zero and the smaller of cap $c$ and base delay $b$ doubled $k$ times. Also cap attempts and total elapsed time. Backoff alone does not remove work: three attempts at each of three nested layers can create 27 database attempts for one original call.

@fig sd_retry_amplification | Illustrative nested retries. Attempt limits multiply across layers.

:::warn Watch out
Choose one layer to own retries for a given operation. Independent retries in clients, gateways, services, and drivers can multiply load just when the dependency has the least capacity.
:::

:::key In one breath
A timeout bounds one wait and a deadline bounds the whole operation. Retry only suitable failures within the remaining budget. Exponential backoff slows repeated attempts and jitter separates callers. A retry policy also needs a limit on duplicated work.
:::
'''),
('Duplicates and update delivery','We give repeated messages a predictable meaning. A disconnected client cannot tell whether a command committed. We will separate idempotent effects from polling and push delivery.',r'''
## Idempotency is a property of the effect

A scorer submits an update, the server commits it, and the response disappears. A retry can create a duplicate unless the operation has a stable identity. **Idempotency** means repeating the same operation has the same intended effect as applying it once. It does not mean every response byte must be identical.

Heron accepts a command identifier and stores its payload fingerprint and result with the score change in one transaction. A repeated identifier with the same payload returns the recorded result; the same identifier with a different payload is rejected. Deduplication expiry must cover the supported retry window. A server crash between an external effect and its local record still needs a separate reconciliation mechanism.

@fig sd_idempotency_trace | The lost response creates uncertainty, not evidence that the write failed.

@fig sd_idempotency_state | A unique command key prevents a second committed effect within the recorded retention window.

## Polling, long polling, and push

A viewer who polls every 5 s creates $50,000/5=10,000$ requests per second for Heron's live audience. With events uniformly distributed relative to that schedule, the mean wait to the next poll is $5/2=2.5$ s. These assumptions describe the example, not all event arrival patterns.

**Long polling** leaves a request open until an event or timeout, then the client opens another request. **Push** sends updates on an established channel. Long polling trades idle requests for held connections; push trades repeated requests for persistent connection state. All need reconnect behavior and protection against a thundering herd after an outage.

@fig sd_poll_cost | Illustrative request rates. Persistent delivery removes repeated empty polls, not connection management.

:::interview Interview lens
**"Can the client safely retry a POST?"** Only if the application's effect is duplicate-safe under the retry contract. A stored idempotency key can provide that property even though POST itself does not promise it. I would check atomic recording, payload mismatch behavior, and key retention.
:::

:::key In one breath
Idempotency controls repeated effects, including after a lost response. Durable deduplication must share the operation's commit boundary. Polling spends request capacity checking for change; long polling and push keep state while waiting. Reconnection still needs replay or a fresh snapshot.
:::
'''),
('The complete request','We assemble the path and explain every boundary. A diagram is useful only if it predicts waiting and failure. We will trace a read, count its costs, and name the next question.',r'''
## A score read from address to result

A viewer resolves Heron's name, establishes a protected connection, and sends a resource request. The L7 proxy chooses a healthy application instance. That instance validates the viewer, acquires a bounded database connection, reads the score, and returns a representation. The response travels back through the proxy over the existing transport.

The request can wait at the resolver, handshake, proxy admission queue, application queue, pool, lock, disk, and client receive buffer. A timeout at one boundary can leave work running at another unless cancellation propagates. Track the same request identifier across hops, and record which wait consumed the deadline.

@fig sd_network_end_to_end | An illustrative uncached read. A later cache unit adds a shorter branch without changing what a committed score means.

## What every component contributes

At Heron's peak of 1,000 requests per second, 2,000-byte responses produce 2,000,000 payload bytes per second, or 16,000,000 payload bits per second. Headers, encryption records, retransmissions, and ingress are extra. The 200 in-flight requests follow from the assumed mean response time, not from a count of sockets.

| Component | One job | Failure to explain |
|---|---|---|
| DNS | Locate an endpoint | Cached old address |
| TLS | Protect and authenticate the connection | Verification or handshake failure |
| Proxy | Admit and route traffic | Queue or unhealthy target |
| Application | Enforce the resource contract | Invalid or duplicate command |
| Database | Read or commit durable state | Wait, conflict, or unavailable leader |

@fig sd_network_budget | Heron's illustrative API payload rate. Live fan-out is a separate calculation.

:::note The next boundary
This unit follows messages but does not predict how queues grow as utilization rises. The performance unit counts capacity, concurrency, percentiles, and the bottleneck that limits the whole path.
:::

:::key In one breath
A request crosses naming, transport, encryption, routing, and application boundaries before reaching durable state. Each boundary can wait or fail independently. Count payload bandwidth separately from connections and live deliveries. A strong design assigns one job and a bounded wait to every component.
:::
''')]
figures=[
('sd_dns_path','A NAME BECOMES A CACHED ANSWER','flow',['stub','recursive','authority','address'],'the directory is not the request'),
('sd_transport_order','PACKET LOSS CHANGES DELIVERY','rows',[['sent','A','B','C'],['arrived','A','gap','C'],['TCP visible','A','wait','wait']],'ordering has a waiting cost'),
('sd_http_versions','HTTP SEMANTICS, DIFFERENT TRANSPORTS','rows',[['HTTP/1.1','messages','TCP'],['HTTP/2','frames','TCP'],['HTTP/3','frames','QUIC']],'same resource, different connection mechanics'),
('sd_http_streams','RESPONSES CAN SHARE A CONNECTION','split',[['ordered responses','slow response A\nthen response B'],['multiplexed frames','A frame, B frame\nindependent HTTP streams']],'TCP can still hold the bytes behind a gap'),
('sd_tls_sequence','ILLUSTRATIVE COLD REQUEST','sequence',{'actors':['viewer','resolver','server'],'steps':[[0,1,'DNS answer: 40 ms'],[0,2,'TCP setup: 40 ms'],[0,2,'TLS setup: 40 ms'],[0,2,'HTTP exchange: 40 ms']]},'160 ms with the stated assumptions'),
('sd_api_contracts','RESOURCE VERSUS REMOTE METHOD','split',[['REST-style resource','GET /matches/m7\nrepresentation of a match'],['gRPC method','ScoreService.GetMatch\ntyped request and result']],'the contract comes before the encoding'),
('sd_live_protocols','WHO NEEDS TO SEND MESSAGES?','split',[['SSE','server -> viewer\nHTTP event stream'],['WebSocket','viewer <-> server\nmessage channel']],'replay is an application responsibility'),
('sd_proxy_layers','THE INFORMATION AVAILABLE TO ROUTING','rows',[['L4','address','port'],['L7','HTTP path','header'],['route','/scores','score service']],'seeing HTTP requires a plaintext boundary'),
('sd_connection_pool','BOUND REUSABLE DATABASE CONNECTIONS','fan',{'source':'callers\nbounded wait','targets':['connection available','connection in use','pool full: wait or reject']},'more callers do not create more capacity'),
('sd_deadline_budget','ILLUSTRATIVE 500 MS REQUEST BUDGET','bars',[['network',40,'ms'],['response reserve',60,'ms'],['application',400,'ms']],'downstream calls inherit the remaining time'),
('sd_retry_amplification','RETRY COUNTS MULTIPLY ACROSS LAYERS','flow',['1 original','3 gateway','9 service','27 database'],'one owner for retries'),
('sd_idempotency_trace','COMMITTED DOES NOT MEAN THE REPLY ARRIVED','sequence',{'actors':['scorer','service','database'],'steps':[[0,1,'command key K'],[1,2,'commit score + key'],[1,0,'reply lost'],[0,1,'retry key K'],[1,0,'return stored result']]},'the retry needs the same identity'),
('sd_idempotency_state','DEDUPLICATION SHARES THE COMMIT BOUNDARY','flow',['key + hash','unique check','score + result','one commit'],'separate commits leave a crash gap'),
('sd_poll_cost','ILLUSTRATIVE EMPTY CHECKING COST','bars',[['API peak',1000,'req/s'],['5 s polling',10000,'req/s']],'50,000 viewers divided by 5 seconds'),
('sd_network_end_to_end','ONE SCORE READ','flow',['viewer','TLS proxy','application','database'],'label the waits as well as the arrows'),
('sd_network_budget','ILLUSTRATIVE API PAYLOAD BANDWIDTH','bars',[['response bytes',2000,'B'],['peak responses',1000,'/s'],['payload',2000000,'B/s']],'units must reconcile before sizing a link')]
back=r'''
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
'''
write_unit(1,'networking','A request across the network',['Across the','Network'],'DNS, transports, HTTP, encryption, proxies, connection reuse, deadlines, retries, and live delivery, explained through one score request.','Draw the complete request path and explain what each boundary guarantees.',parts,figures,back,[('HTTP semantics','https://www.rfc-editor.org/rfc/rfc9110','Method and message semantics.'),('HTTP/2','https://www.rfc-editor.org/rfc/rfc9113','Frames and multiplexing over TCP.'),('HTTP/3','https://www.rfc-editor.org/rfc/rfc9114','HTTP mapping onto QUIC.'),('TLS 1.3','https://www.rfc-editor.org/rfc/rfc8446','Authentication and record protection.'),('WebSockets','https://www.rfc-editor.org/rfc/rfc6455','Opening handshake and message framing.'),('Server-sent events','https://html.spec.whatwg.org/multipage/server-sent-events.html','EventSource parsing and reconnection.')])

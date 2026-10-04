@chapter faq | Interview question bank | Answer by naming the owner, state and failure of a mechanism before listing its acronyms. These questions follow the parts and use Finch whenever a packet trace makes the answer precise.

### I. Network models and physical signals

**Q1. What distinguishes bandwidth, throughput and latency?**

Bandwidth is a link's bit-rate allowance, throughput is the useful rate actually delivered, and latency is elapsed time. Finch's `100` Mb/s link does not remove its `40` ms round trip. A small window can limit delivered throughput even when the link has unused capacity.

**Q2. Why separate networking into layers?**

Each layer owns a contract so a change in one mechanism need not change every application. Ethernet can deliver an IP packet across one link while TCP supplies end-to-end byte ordering. Layering also tells us which observation is evidence of which success.

**Q3. What changes at a router during encapsulation?**

The router receives and removes the old link wrapper, forwards the IP packet and creates a new link wrapper. The remote IP destination ordinarily remains unchanged while next-hop MAC addresses change. A NAT rule is a further explicit modification rather than ordinary link encapsulation.

**Q4. Why are baud and bit rate different?**

Baud counts symbols per second and bit rate counts represented bits per second. A symbol alphabet with several distinguishable states can encode several bits per symbol. Noise and distortion limit how reliably the receiver distinguishes those states.

### II. Data link and Ethernet switching

**Q5. What does a MAC address identify?**

It identifies an interface in a link-layer context. A switch uses destination MAC information for local forwarding, while a router uses IP information for routed delivery. Finch's frame to a remote service therefore names the gateway's MAC, not the remote server's MAC.

**Q6. Does a CRC make a frame secure?**

No, it detects selected accidental corruption patterns. An attacker who changes plaintext can recompute its noncryptographic check. Authentication requires a keyed or signed mechanism under a defined trust model.

**Q7. How does a switch learn its table?**

It associates an arriving frame's source MAC with the ingress port. A known destination selects a relevant output, while an unknown unicast destination causes flooding within the permitted broadcast domain. Learning the source and looking up the destination are separate steps.

**Q8. How do a hub, switch and router differ?**

A hub repeats signals, a switch forwards link frames by MAC, and a router forwards IP packets by routes. A switch can separate contention across ports while VLANs determine broadcast membership. A router ends ordinary local broadcast propagation between its routed interfaces.

### III. VLANs and IP addressing

**Q9. What does a VLAN change?**

It changes logical link-layer membership and broadcast scope. Access ports normally present untagged edge traffic, while a trunk carries tagged traffic for configured VLANs. Communication between VLANs requires a routing or equivalent explicit boundary.

**Q10. Why does Finch ARP for its gateway?**

The server is outside Finch's `/26` subnet, so Finch's route selects the gateway as the local next hop. ARP discovers that next hop's link address. Routers, not an Internet-wide ARP broadcast, handle the remaining path.

**Q11. How many ordinary hosts fit in Finch's subnet?**

A `/26` leaves `6` host bits, giving `64` addresses. Removing the ordinary network and broadcast reservations leaves `62` hosts. The special `/31` point-to-point and `/32` host-route conventions require separate reasoning.

**Q12. Does a private address imply a secure host?**

No, it describes address scope rather than permissions or trust. Private hosts can still exchange harmful traffic locally and can send through translated public paths. Firewall and application policy must state what is permitted.

### IV. IP forwarding and routing

**Q13. What does DHCP configure besides an address?**

A lease can also supply the subnet mask, default gateway and resolver options. DORA selects an offer and acknowledges its lease. A configured address alone does not prove that the supplied gateway or DNS server is usable.

**Q14. How does NAT deliver the response to Finch?**

The gateway stores the translation from the private tuple to a public tuple. A matching reply to `198.51.100.7:40001` becomes traffic to `192.168.10.70:51000`. The route and firewall must also allow that restored flow.

**Q15. Why does longest-prefix matching beat the smallest metric?**

Specificity first determines which destination network applies. Among relevant equally specific routes, the implementation uses its preference and tie-breaking rules. A default route does not defeat a more specific matching route merely because its numeric metric looks attractive.

**Q16. Why is BGP not a geographic shortest-path protocol?**

BGP exchanges reachability and path information between autonomous systems under administrative policy. A network can prefer a customer or avoid a provider for reasons unrelated to distance. AS_PATH helps describe route provenance and reject loops, while policy controls preference.

### V. Transport and TCP

**Q17. How can one listening port accept many TCP connections?**

Established connections differ by their remote and local endpoint tuple. The listener admits them and returns separate connected socket objects. Port `443` alone does not identify one global connection.

**Q18. Why are there three handshake messages?**

Each side supplies its initial sequence and confirms the other's. The final client acknowledgement proves the server's sequence reached the client. Two messages would leave that server-side confirmation absent.

**Q19. Why does TIME_WAIT exist?**

It lets the final acknowledger respond when a final FIN is retransmitted and protects against delayed duplicates from an old connection incarnation. It is retained protocol state, not necessarily an application leak. CLOSE_WAIT points to a different stage where the local application still needs to finish closing.

**Q20. Does TCP guarantee one application operation executes once?**

It delivers ordered bytes within a connection; it does not decide database effects across reconnects. A response can disappear after the operation commits. Request identifiers and effect deduplication solve that application uncertainty.

### VI. Flow and congestion control

**Q21. What is the bandwidth-delay product for Finch?**

`100,000,000` bits/s multiplied by `0.04` s gives `4,000,000` bits, or `500,000` bytes. That is the illustrative amount needed in flight to occupy the path. Payload overhead and control behavior affect achieved application throughput.

**Q22. What distinguishes rwnd from cwnd?**

rwnd reports receiver capacity, while cwnd reflects the sender's network allowance. The sender respects both. A server that stops reading and a router that drops packets therefore create different feedback.

**Q23. Why does slow start grow quickly?**

Successful acknowledgements create more sending permission, so the simplified round-based model doubles its allowance. The supplied trace grows from `1,460` to `11,680` bytes across its listed states. This is a teaching assumption, not a universal initial-window default.

**Q24. How do token and leaky buckets differ?**

A token bucket saves permission for a bounded burst while constraining sustained admission. A leaky bucket drains queued work at a configured output rate. Both still need explicit behavior when capacity or permission runs out.

### VII. DNS and HTTP

**Q25. Does a root nameserver resolve every website's final IP address?**

It normally supplies referrals toward the relevant delegated namespace. A recursive resolver follows those referrals until an authoritative server supplies the requested record. Cached results can omit some or all of that work.

**Q26. What is the difference between a safe and an idempotent method?**

A safe method does not request a state change as its defined purpose. An idempotent method has the same intended effect when repeated, even if it changes state. GET is safe, whereas a replacement PUT is idempotent without being safe.

**Q27. How do freshness and validation differ?**

Freshness permits a cache to reuse a representation without another request under its policy. Validation asks whether a stored representation still matches, using an ETag or modification time. A `304` allows reuse after that check without retransmitting the unchanged body.

**Q28. What do 502, 503 and 504 tell you?**

They report an invalid upstream response, service unavailability and an upstream timeout respectively. Their meaning depends on the component generating them. An upstream timeout does not establish whether an operation had a durable effect.

### VIII. QUIC, TLS and web sessions

**Q29. Why does HTTP/3 use QUIC above UDP?**

QUIC implements encrypted reliable streams and congestion control while using UDP as its datagram carrier. Separate stream ordering avoids TCP's connection-wide ordered-delivery stall after a gap. Shared congestion and flow resources still limit the connection.

**Q30. What does certificate verification establish?**

The browser checks the requested name and a valid chain under its configured trust anchors, while the handshake proves control of the relevant key. A reachable IP or a certificate for another hostname is insufficient. The exchange then derives protected traffic keys.

**Q31. Why might curl work when browser JavaScript cannot read a response?**

The browser enforces same-origin policy and the CORS permission protocol. curl is not a browser and does not apply that read restriction. Server authentication and authorization still apply to both clients.

**Q32. What state survives a WebSocket reconnect?**

Only the state the application intentionally retains and restores. The transport handshake creates a new exchange; missed updates do not replay automatically. Sequence identifiers, snapshots or replay cursors can provide application continuity.

### IX. Proxies, tunnels and firewalls

**Q33. What changes when a reverse proxy terminates TLS?**

It becomes the authenticated plaintext boundary for the public connection and creates a separate backend exchange. Its backend peer identity and encryption policy are explicit design decisions. The server must trust forwarded client metadata only through a known intermediary chain.

**Q34. What can sticky sessions conceal?**

They can conceal login or application state stored only on one backend. Requests appear correct while routing remains stable but fail when that backend disappears. Shared state or a clear recovery policy is needed before promising transparent failover.

**Q35. Why do tunnels cause small-packet success but large-transfer failure?**

Outer headers reduce the available inner packet budget. Large packets can exceed the path allowance, and blocked packet-too-big feedback can prevent adjustment. The result can look like an application stall although the real problem is encapsulated MTU.

**Q36. How does a stateful firewall admit replies without opening every temporary port?**

It associates reply packets with previously admitted flow state. A new unsolicited packet does not have that association and follows the new-flow rules. Tracking state itself has finite memory and lifetime.

### X. Socket programming and I/O

**Q37. Why can recv return fewer bytes than the sender wrote?**

TCP gives a stream, and the available contiguous prefix need not match the sender's write boundaries. The application must keep reading under its framing rule. EOF before the complete required message is a distinct failure from temporary lack of readiness.

**Q38. What does accept return?**

It returns a connected socket distinct from the listener. The listener remains available for more admissions. The application must own and eventually close each accepted descriptor.

**Q39. Is readiness the same as asynchronous completion?**

Readiness says an operation may progress; the application still performs it and handles its result. Completion reports the result of an operation already submitted. Neither contract creates complete application-message boundaries by itself.

**Q40. What work should not block an event loop?**

Long computation, blocking database calls and unbounded callbacks can delay every connection sharing that loop. Idle sockets are inexpensive in waiting-thread terms, but ready CPU work still consumes execution time. Offload it or use a compatible asynchronous operation.

### XI. CDN, P2P and cloud networking

**Q41. Does anycast guarantee the physically nearest edge?**

No, routing and policy choose a reachable advertised instance. That can differ from geographic proximity. A cache hit or miss is a later application decision at the selected edge.

**Q42. Why is STUN insufficient to guarantee a peer path?**

It reports the mapping visible to a particular server exchange. Another destination may receive a different mapping or encounter filtering. ICE tests actual candidate pairs and can select TURN relaying when direct paths fail.

**Q43. How do SDN and NFV differ?**

SDN concerns programmable forwarding control and its relationship to the data plane. NFV concerns implementing network functions in software on computing infrastructure. A software firewall can be NFV without proving any particular controller architecture.

**Q44. Why can a container listener be unreachable from outside?**

The listener may bind only loopback, belong to another namespace or lack the intended host mapping. Host and cloud route or firewall policy can also block its path. Local listening and end-to-end reachability are different observations.

### XII. The complete browser request

**Q45. What may a warm request skip?**

A valid representation cache can skip network delivery, a DNS cache can skip name lookup, and a reusable connection can skip transport and cryptographic establishment. These are independent caches or state stores. State which are warm before counting round trips.

**Q46. What byte budgets must reconcile?**

The illustrative IPv4 packet is `1,500` bytes, the TCP payload is `1,460`, and the Ethernet frame is `1,518`. A VLAN tag makes it `1,522` frame bytes. TLS and HTTP consume some TCP payload, so that payload is not the complete application body size.

**Q47. Walk through the whole Finch request and response.**

The browser selects the server through cached or fresh naming, then the route chooses the gateway and ARP supplies its MAC. NAT maps the private tuple to a public one, routers carry the destination packet, and TCP or QUIC plus TLS establish the intended protected exchange. HTTP names the resource. The response reaches the public mapping and the gateway restores Finch's private endpoint.

**Q48. What changed between older web transport and the modern stream model?**

HTTP moved from frequent connection setup to persistence, then to multiplexed application streams. QUIC added separate stream delivery and integrated encrypted establishment above UDP. IP routing and local link delivery still perform their jobs underneath. The modern model changes state ownership and waiting behavior rather than discarding the lower layers.

@chapter exercises | Exercises | The examples are illustrative unless a protocol field or convention is named. Work the arithmetic by hand and then explain which assumption would change the answer.

### Quick arithmetic

**E1** ● Convert Finch's `1,500` byte packet into bits and calculate transmission time at `100,000,000` bits/s.

**E2** ● Calculate propagation delay for `1,000,000` metres at `200,000,000` metres/s.

**E3** ● Add `0.12` ms transmission, `5` ms propagation, `0.05` ms processing and `0.5` ms queueing. Then remove queueing.

**E4** ● Compute all addresses and ordinary usable hosts in Finch's `/26`.

**E5** ● Find Finch's and the gateway's last-octet offsets from subnet start `64`. State whether both are usable hosts.

**E6** ● Subtract `20` bytes each for IPv4 and TCP from the packet. Compare UDP with its `8` byte header.

**E7** ● Compute the acknowledgement after a SYN at `1000` and one contiguous `1,460` byte payload. What follows a FIN sent immediately after that data?

**E8** ● Calculate the byte BDP for `100` Mb/s and `40` ms RTT.

**E9** ● Calculate the remaining DNS TTL after `120` seconds of a `300` second lifetime.

**E10** ● Calculate the fill time of an empty `50` packet token bucket refilling at `25` packets/s.

### Multi-step mechanisms

**E11** ●● Calculate the throughput ceiling of a `64,000` byte window at `40` ms RTT and its fraction of the `100` Mb/s link rate.

**E12** ●● List the four supplied slow-start windows and calculate the growth factor between first and last.

**E13** ●● Explain without equations why Finch sends its remote packet to the gateway's MAC instead of the server's MAC.

**E14** ●● Explain without equations why zero rwnd differs from congestion loss even though either can slow sending.

**E15** ●● Explain without equations why a browser can reject a cross-origin read that curl performs successfully.

**E16** ●● Trace the outgoing and returning NAT tuples for client port `51000`, public port `40001` and server port `443`.

**E17** ●● Identify the generated status for an invalid upstream response, unavailable service and upstream timeout. Which proves the upstream made no durable change?

**E18** ●● Count the sequential RTTs and time for the stated cold TCP, TLS and HTTP trace. Compare a valid reused connection needing only the request-response RTT.

**E19** ●● Describe a WebSocket reconnect policy that avoids silently skipping updates and that bounds slow-consumer memory.

**E20** ●● Divide the corrected CRC codeword `1101001` by generator `1011` using XOR long division. Explain what a zero remainder establishes and what it does not.

### Proof, code and full counting

**E21** ●●● Derive the window-limited throughput bound by counting how many bytes can be acknowledged per RTT. Then compute the minimum whole `1,460` byte segments needed to cover Finch's `500,000` byte BDP.

**E22** ●●● Prove that Selective Repeat needs a window no larger than half its finite sequence space when old and new windows may coexist. Give a counterexample argument for a larger window, then evaluate a `3` bit sequence field.

**E23** ●●● Write a blocking framed receiver that reads exactly a caller-specified length, rejects a length above a caller-specified maximum, and fails on early EOF. Do not assume one recv completes the message.

**E24** ●●● Count the TCP segments, IP bytes, ordinary Ethernet frame bytes and tagged Ethernet frame bytes for `146,000` TCP payload bytes carried in full `1,460` byte payloads. Exclude ACKs, TLS and HTTP overhead, preambles and inter-frame timing. Explain how those omissions limit the result.

**E25** ●●● Design the complete cold Finch request with a reverse proxy and a private backend. Identify the public NAT mapping, both TLS trust decisions, listener and accepted sockets, cache boundaries, return route and retry policy after an uncertain POST.

@chapter solutions | Worked solutions | Values come from the shared fundamentals computation and the durable CN calculation files. The solutions keep byte units, protocol state and application effects distinct.

**E1.** `1,500 × 8 = 12,000` bits. Dividing by `100,000,000` bits/s gives `0.00012` seconds, which is `0.12` ms. This is serialization time for the stated packet byte count, not a complete Ethernet wire-time accounting.

**E2.** `1,000,000 / 200,000,000 = 0.005` seconds, or `5` ms. Increasing bit rate does not change this propagation calculation. Distance and propagation speed are independent illustrative inputs.

**E3.** `0.12 + 5 + 0.05 + 0.5 = 5.67` ms. Removing only queueing gives `5.67 - 0.5 = 5.17` ms. The same calculation does not establish the full path RTT, whose supplied illustrative value is `40` ms.

**E4.** `32 - 26 = 6` host bits and `2^6 = 64` addresses. Removing network and broadcast gives `64 - 2 = 62` ordinary hosts. The block runs from `192.168.10.64` through `192.168.10.127`, with usable endpoints `192.168.10.65` and `192.168.10.126`.

**E5.** Finch's offset is `70 - 64 = 6`; the gateway's is `65 - 64 = 1`. Both offsets lie between the first and last ordinary host offsets, so both are usable in this illustrative subnet. Their membership does not prove either device responds.

**E6.** TCP payload is `1,500 - 20 - 20 = 1,460` bytes. UDP payload is `1,500 - 20 - 8 = 1,472` bytes. The comparison assumes no IPv4 or TCP options and the same IP packet allowance. A smaller header does not imply equivalent application guarantees.

**E7.** SYN consumes a sequence position, so first data starts at `1000 + 1 = 1001`. The contiguous payload leads to `1001 + 1460 = 2461`. A FIN at that next position consumes another position, so its acknowledgement is `2461 + 1 = 2462`.

**E8.** `40` ms is `0.04` seconds. `100,000,000 × 0.04 = 4,000,000` bits, and `4,000,000 / 8 = 500,000` bytes. This describes the amount in flight at the stated path rate and RTT.

**E9.** `300 - 120 = 180` seconds remain. DNS caching can reuse the record under the stated TTL conditions; HTTP content and connection reuse need their own validity decisions.

**E10.** `50 / 25 = 2` seconds. After idle refill, up to `50` packet admissions can spend the saved permission, while sustained admission remains limited by refill. A byte-based limiter would need packet sizes too.

**E11.** `64,000 / 0.04 = 1,600,000` bytes/s, then `1,600,000 × 8 = 12,800,000` bits/s, or `12.8` Mb/s. Dividing by `100` Mb/s gives `0.128`, equivalent to `12.8%`. The window lacks `500,000 - 64,000 = 436,000` bytes relative to the supplied BDP.

**E12.** The trace is `1,460`, `2,920`, `5,840`, `11,680` bytes. Each transition doubles, and `11,680 / 1,460 = 8` is the first-to-last factor. The values describe the chapter's simplified slow-start assumption.

**E13.** Finch's subnet comparison chooses a route through its gateway because the server is remote. Ethernet addresses an immediate neighbour, so Finch needs the gateway's local interface identity. The IP destination still names the server. The gateway replaces the frame before the next link carries the packet onward.

**E14.** Zero rwnd means the receiver has no advertised capacity for new bytes, often because its application has stopped consuming them. Congestion loss means some path resource could not deliver admitted traffic, and the sender adjusts its network estimate. The sender respects both limits, but the constrained resources and feedback differ.

**E15.** Browser script runs under same-origin read policy. The browser exposes another origin's response only when the relevant CORS permission checks succeed. curl does not implement that browser restriction. Neither observation proves the API's credentials or authorization rules are unnecessary.

**E16.** The client sends `192.168.10.70:51000` to `203.0.113.20:443`. NAT exposes `198.51.100.7:40001` as the source, retaining the server destination. The reply goes from `203.0.113.20:443` to `198.51.100.7:40001`, then the gateway restores destination `192.168.10.70:51000`. Routing and policy must permit that restored flow.

**E17.** The corresponding statuses are `502`, `503` and `504`. None universally proves that no durable effect occurred. The component generating the error and the application's operation semantics determine what a retry may safely do.

**E18.** The stated cold dependencies use `3` sequential RTTs, so `3 × 40 = 120` ms. The reused connection model needs `1 × 40 = 40` ms for the request-response exchange and saves `120 - 40 = 80` ms. DNS and application computation are outside both stated counts, and a body transfer can add further time.

**E19.** Give each application update an ordered identifier and retain a bounded replay history or a current snapshot. A reconnect sends its last applied identifier, and the server either replays the available suffix or requires a fresh snapshot when that suffix has expired. Bound the outgoing queue and disconnect or resynchronize a slow consumer when it exceeds policy. The new WebSocket connection alone cannot restore missed application state.

**E20.** Starting with `1101001`, align `1011` at the leading bit and XOR `1011000` to obtain `0110001`. Ignoring the leading zero, XOR `101100` against `110001` to obtain `011101`. Align again and XOR `10110` against `11101` to obtain `01011`; the remaining `1011` XOR `1011` gives zero. The codeword has no error detectable by this generator. It does not authenticate its sender, and selected corruptions can still yield zero.

**E21.** If only W unacknowledged bytes may exist, sustained progress over a round-trip duration cannot acknowledge more than W newly supplied bytes per such interval in the steady ideal model. Therefore the rate is bounded by W divided by RTT in bytes/s, or eight W divided by RTT in bits/s, and physical link capacity supplies another upper bound. The required segment count is the ceiling of `500,000 / 1,460`, giving `343`. `343 × 1,460 = 500,780` bytes cover the path BDP, while `342 × 1,460 = 499,320` do not. This is a lower allowance for the ideal pipeline, not a throughput guarantee under loss.

**E22.** Let the sequence space contain M labels. A receiver accepting W new labels must distinguish them from the W labels of a previous window whose delayed duplicates may still arrive. If the windows overlap in label space, an old packet at an overlapping label is observationally indistinguishable from a new packet unless the protocol adds another discriminator or tighter lifetime assumptions. Avoiding that overlap requires `2W <= M`. With `3` sequence bits, `M = 2^3 = 8`, hence `W <= 4`. This is the finite-label classroom Selective Repeat argument; TCP adds its own byte-space and packet-lifetime rules.

**E23.** Validate the requested length before reading and keep the incomplete prefix until the exact length is present. The caller must still arrange deadlines and close ownership. The maximum is an input from protocol policy rather than an invented constant.

```python
def read_exact(sock, count, maximum):
    if count < 0 or count > maximum:
        raise ValueError("invalid message length")
    data = bytearray()
    while len(data) < count:
        chunk = sock.recv(count - len(data))
        if not chunk:
            raise EOFError("incomplete message")
        data.extend(chunk)
    return bytes(data)
```

**E24.** `146,000 / 1,460 = 100` full data segments. Adding `20 + 20 = 40` IPv4 and TCP header bytes per segment gives `100 × 1,500 = 150,000` IP bytes. Ethernet adds `18` frame-format bytes per packet, yielding `100 × 1,518 = 151,800` frame bytes. Tags add `4` more bytes per frame, yielding `100 × 1,522 = 152,200` tagged bytes. ACKs, setup, retransmissions and physical framing consume additional wire capacity, and TLS plus HTTP consume part of the payload if the desired quantity is application body size. The result is therefore the stated simplified transport-payload accounting.

**E25.** Finch resolves the public proxy name and routes the chosen server address through its local gateway. ARP supplies the gateway MAC, and NAT maps private `192.168.10.70:51000` to public `198.51.100.7:40001`. Finch authenticates the public hostname through TLS at the proxy. The proxy's accepted stream and its reused or newly connected backend stream are separate sockets; the backend exchange needs an explicitly authenticated TLS policy if that link is to remain protected. Browser and proxy caches obey separate keys and freshness rules. The public reply returns through the stored NAT mapping, while the private backend uses its own return route to the proxy. An uncertain POST retries with an application identifier whose durable effect is deduplicated; TCP delivery and proxy health alone cannot establish whether the first operation committed.

@part V | Transport and TCP | Transport protocols deliver bytes to processes rather than merely to machines. Without endpoint state, a received packet cannot identify its application or recover missing data. We will compare datagrams and streams, establish and close a connection, and reconstruct a lost TCP segment. | where:5

## 23. Ports, sockets and transport demultiplexing

Finch opens a browser connection while another application on the same host exchanges unrelated traffic. Both packets have source address `192.168.10.70`. An IP address therefore cannot identify the intended process by itself. A **port** is a transport-layer number used to distinguish endpoints on a host, and a **socket** is the operating-system object through which a program exchanges network data.

A TCP connection uses the local and remote addresses and ports together. Including the protocol gives the **five-tuple**, which distinguishes TCP from UDP even when their address and port numbers happen to match. Finch sends from illustrative port `51000` to the server's HTTPS port `443`. Its gateway translates the source to `198.51.100.7:40001`; the server replies to that translated tuple. Port numbers have `16` bits, giving `65,536` bit patterns. A service port identifies a convention, not proof of what software actually listens there.

@fig cn_transport | Many processes share one IP address. Orange marks the port used to deliver a received transport unit to the correct endpoint. | narrow

The kernel first interprets the IP protocol field, then looks up the relevant transport endpoint. A listening TCP socket and an accepted TCP socket are different objects. The listener can accept many connections sharing the same local port because each remote tuple distinguishes its established stream. UDP can instead receive datagrams from several senders through one socket, depending on its binding and connection settings.

A failed `connect` does not mean the whole host disappeared. A missing listener can produce a refusal, a firewall can silently drop the SYN, and an exhausted connection queue can delay admission. The diagnostic question is which tuple, protocol and state failed. [TCP's specification](https://www.rfc-editor.org/rfc/rfc9293) defines ports and connection identification separately from application semantics.

:::story Picture this
An office building has one street address and several numbered desks. The IP address gets a parcel to the building, while the port gets it to a desk. An accepted connection is a named conversation at that desk, so the same receptionist can keep separate conversations with many visitors.
:::

## 24. TCP versus UDP

A live position update can become useless while the sender waits for an older missing update. A bank statement, in contrast, cannot tolerate a missing byte. **UDP**, the User Datagram Protocol, sends individual messages without implementing retransmission or ordered delivery. **TCP**, the Transmission Control Protocol, gives applications a reliable, ordered byte stream and manages both receiver capacity and network demand.

### UDP datagrams

A UDP receive operation preserves a datagram boundary. The sender supplies a destination, ports and payload, and the receiver either gets that datagram or does not. The protocol has no connection establishment handshake and no automatic retransmission. Applications that need either must add them. QUIC later demonstrates why a UDP carrier does not imply an unreliable application protocol.

### TCP streams

TCP gives bytes sequence positions, acknowledges progress, buffers some out-of-order arrivals, and retransmits missing data. An application write does not become a permanent message boundary. One write can require several reads; several writes can arrive in one read. An application therefore needs framing even when TCP already supplies ordering.

@fig cn_tcp_udp | TCP exposes a contiguous ordered byte stream and waits at a gap. UDP delivers individual datagrams; the application supplies any ordering and recovery it needs.

For the illustrative `1,500` byte IP packet with a `20` byte IPv4 header, an `8` byte UDP header leaves `1,472` bytes. A `20` byte TCP header leaves `1,460` bytes. Options and lower path limits change these budgets. Smaller headers do not by themselves establish lower application latency; recovery policy and connection reuse also matter.

Choose the contract before comparing overhead. TCP suits a file whose complete ordered contents matter. UDP suits an application that can replace stale updates, but it still needs congestion control when it sends sustained traffic. A checksum detects accidental corruption; neither protocol authenticates the peer. Encryption and authentication belong to a further protocol such as TLS or QUIC.

:::warn Watch out
A successful TCP send reports local acceptance of bytes. It does not prove the remote application committed an order. A reconnect after a lost response needs an application request identifier or another method of preventing duplicate effects.
:::

## 25. TCP three-way handshake

Finch chooses initial sequence `1000` and sends a SYN. The server must learn that starting point and tell Finch its own. The **three-way handshake** exchanges initial sequence state and confirms that each side can receive the other's messages. A SYN consumes a sequence position, so Finch's first data byte uses `1001`.

The server's SYN+ACK acknowledges `1001` and advertises a server initial sequence. Finch's final ACK acknowledges the position after the server SYN. Only then does the server have evidence that Finch received its initial sequence. The final ACK can share a segment with application data. The number of logical messages describes the state exchange, not an obligation to waste a separate packet for every action.

$$
\operatorname{next}=\operatorname{ISN}+1=1000+1=1001.
$$

Read this as the next sequence position equals the initial sequence number plus the position consumed by SYN. ISN means initial sequence number. The value here is illustrative; choosing predictable production initial sequences would weaken protection against forged traffic.

@fig cn_handshake | SYN introduces Finch's initial sequence and SYN+ACK confirms it. The final acknowledgement confirms the server's sequence, so both directions have agreed state. | narrow

A two-message exchange would leave the server uncertain whether the client received its SYN+ACK. Lost messages require retransmission, and delayed duplicate SYNs must not create valid application exchanges without fresh confirmation. Options can negotiate maximum segment size and other capabilities during establishment. The server also pays for pending connection state before completion, which explains why SYN floods attack admission rather than an HTTP handler.

At the illustrative `40` ms RTT, the client receives the SYN+ACK after one RTT under the simplified path model. That is not the entire HTTPS request latency. TLS authentication and the request-response exchange add their own dependencies. Connection reuse avoids repeating establishment for every resource.

:::interview Interview lens
**"Why does TCP need three handshake messages?"** Each endpoint introduces its initial sequence and confirms the other's. The client's final acknowledgement tells the server that its initial sequence actually arrived. This protects connection state from an incomplete or stale exchange. It does not authenticate the server's application identity.
:::

## 26. TCP termination, half-close and TIME_WAIT

Finch has finished sending a request, but the server may still have response bytes to transmit. Ending the whole connection immediately would discard useful work. A **half-close** ends sending in one direction while the other direction remains open. FIN marks the end of one sender's sequence and, like SYN, consumes a sequence position.

The peer acknowledges FIN and can continue sending until its own application closes. Its eventual FIN receives another acknowledgement. These actions may combine in fewer packets than the familiar FIN, ACK, FIN, ACK drawing. An RST instead aborts the connection and is not an orderly promise that all application data arrived.

@fig cn_close | Each FIN closes one sending direction. Orange marks the first half-close; the reverse direction can still deliver the response before its own FIN. | narrow

**TIME_WAIT** retains connection state at the endpoint that sends the final acknowledgement in the usual active-close path. It lets that endpoint acknowledge a retransmitted final FIN and prevents delayed packets from an old incarnation from confusing a new connection using the same tuple. Its duration depends on the TCP lifetime model and implementation, so this chapter does not invent a universal timeout.

**CLOSE_WAIT** means the peer closed its sending direction but the local application has not finished closing its own socket. A growing population of these sockets often suggests an application that forgets to close accepted connections. TIME_WAIT alone can be normal under short-lived traffic; deleting it blindly does not repair the workload.

Count ownership before tuning. In Finch's trace, closing after one small request makes connection setup and teardown recur; a persistent HTTP connection can reuse transport and cryptographic state. A process crash or unplugged cable may not send FIN at all. An application needing bounded failure detection must use deadlines, heartbeats or appropriate keepalive policy, because an established socket is not proof that its peer remains responsive.

:::note Graceful shutdown
A server can stop accepting new work before it finishes existing responses. Closing the listener does not automatically close every accepted socket. Shutdown policy must account for active requests and application deadlines separately.
:::

## 27. TCP reliability, acknowledgements and RTT estimation

The segment beginning at `1001` contains `1,460` bytes. If all those bytes arrive contiguously, the receiver acknowledges `2461`, the next byte it expects. A **cumulative acknowledgement** confirms the contiguous prefix of a stream, not merely the latest packet received. If a later segment arrives across a gap, the acknowledgement can remain unchanged while the receiver buffers the later bytes.

$$
\operatorname{ACK}=1001+1460=2461.
$$

Read this as the acknowledgement equals the first sequence position plus the number of consecutive received bytes. Retransmitting the same byte positions does not create duplicate application bytes. TCP uses sequence comparisons to recognize overlap, place out-of-order data and wait for missing ranges before ordered delivery.

@fig cn_reliable | Sequence positions count bytes. Orange marks `2461`, the next expected byte after Finch's first data segment. | narrow

### RTT estimation

A **retransmission timeout**, or RTO, triggers recovery when progress fails to arrive soon enough. A fixed timeout would retransmit needlessly on a distant path and recover slowly on a short one. TCP therefore estimates a smoothed RTT and its variation, then includes both in its timeout. Retransmitted data creates ambiguous timing samples because an ACK may acknowledge the original or the replacement. [The timer specification](https://www.rfc-editor.org/rfc/rfc6298) explains how the estimator handles that ambiguity.

Repeated duplicate acknowledgements can reveal a missing segment before the timer expires. Selective acknowledgements can describe additional received ranges, helping the sender retransmit the actual gaps. Checksums detect some corruption, but an adversary can forge a noncryptographic checksum. Reliability also stops at stream delivery; it cannot make the application execute exactly once after an uncertain reconnect.

Finch's `40` ms RTT is a model input, not a promise for every sample. Queueing changes samples, and a timeout should include measured variation. When an interviewer asks how TCP makes unreliable IP reliable, describe sequence positions, acknowledgements, buffering, checksums and timers as cooperating mechanisms.

:::key In one breath
Ports deliver transport data to endpoints, and the five-tuple distinguishes connections sharing one service port. UDP preserves datagrams while TCP exposes an ordered byte stream. SYN establishes sequence state, FIN ends a direction, and TIME_WAIT handles delayed duplicates and final acknowledgement loss. TCP recovers missing byte ranges with acknowledgements and adaptive timers, while applications remain responsible for framing and durable effects.
:::

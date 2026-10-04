@part I | Network models and physical signals | A network carries application bytes through devices that make different decisions. Confusing those decisions makes a broken cable, a full queue and a failed service look like the same fault. We will define the packet path, compare layer models, wrap the request in headers and compute the cost of its physical transmission. | where:1

## 1. Networking foundations and packet switching

Finch's browser asks a remote server for a page. The browser owns the request's meaning, but switches and routers must carry its bytes without understanding that page. A **computer network** connects endpoints and forwarding devices through shared communication rules. A protocol states the messages and actions that let independently built devices cooperate.

### LAN, MAN, WAN, Internet and intranet

A **LAN** connects a local site, a **MAN** spans a metropolitan area, and a **WAN** connects more distant sites. Distance alone does not determine the forwarding protocol. An intranet serves an administrative community, while the Internet interconnects independently administered networks. Finch reaches its gateway locally before crossing the wider routed path.

@fig cn_network | Local and wide-area paths differ from administrative scope. Orange marks the LAN, where Finch reaches its first forwarding neighbour.

### Topology, client-server and peer-to-peer

A **topology** records available connections. A star shares a central switch, a bus shares a medium, a ring connects neighbouring stations, and a mesh offers several paths. Losing the star's central switch disconnects clients even if the remote service is healthy. Physical redundancy helps only when forwarding can use the surviving path.

@fig cn_topology | The central device in the orange star is a shared failure point. Ring and mesh connections provide other physical paths under suitable forwarding rules.

Client-server assigns a service provider and requester; peer-to-peer lets participants serve as well as request. Those roles do not determine the transport. Circuit switching reserves capacity before transmission, while packet switching shares links among bursts. Datagram forwarding chooses a next hop independently for each packet; a virtual circuit retains a logical path established beforehand.

### Store-and-forward, delay and delivered rate

A store-and-forward device receives the bounded packet before sending it onward. Each hop can add processing, queueing, serialization and propagation delay. For the illustrative link,

$$D=0.05+0.5+0.12+5=5.67\text{ ms}.$$

Read D as total one-link delay in milliseconds, with each term naming a separate elapsed cost. **Bandwidth** is the link's configured bit rate; **throughput** is the delivered rate. **RTT** measures a round trip, **jitter** measures delay variation, and **packet loss** records missing delivery. The declared 40-millisecond RTT belongs to the wider path and is not twice this one-link fixture.

@fig cn_metrics | Illustrative one-link delay has four contributions. Orange marks processing; queueing can vary with demand, and propagation depends on distance.

:::story Picture this
A postal depot receives complete envelopes, sorts them and waits for a vehicle before sending them onward. Sorting is processing, the waiting pile is queueing, loading takes serialization time and travel takes propagation time. A faster loading belt does not shorten the road. The recipient owns the letter's meaning even though several depots move it.
:::

## 2. OSI and TCP/IP models

The browser reports a failed request, but that failure could occur before any HTTP reaches the server. A disconnected radio, an absent route and an invalid certificate require different evidence. A **layer model** assigns kinds of work to boundaries so we can inspect the right state instead of treating every failure as an application error.

### The OSI layers

The **OSI model** names application, presentation, session, transport, network, data link and physical layers. Application describes service messages. Presentation concerns representation and transformations, while session concerns the organization of an exchange. Transport connects communicating application endpoints, network forwards addressed packets, data link carries frames between neighbours, and physical transmits signals. These categories are a reasoning tool, not a requirement that every implementation have a separate process for each category.

### The practical Internet stack

The **TCP/IP model** groups application work above transport, Internet and link functions. Teaching diagrams often separate physical signalling from link framing. HTTP and DNS sit in the application group, TCP and UDP supply transport, IP supplies Internet addressing, and Ethernet supplies local framing. QUIC implements transport functions over UDP rather than making UDP itself an ordered stream.

@fig cn_layers | Each practical layer answers a different question. Orange marks application meaning, which lower-layer delivery alone cannot validate.

For Finch, HTTP names the resource, TCP connects ports, IP names the remote host, and Ethernet addresses the gateway interface. ARP helps connect the IP next-hop decision to a local link address and does not fit neatly into a strict single-layer label. A router can contain transport or application features while still performing IP forwarding. Classify the action under discussion rather than the product box.

The cost of layering is extra headers, state and work at boundaries. Its benefit is replacing one part without rewriting every other part. The same HTTP handler can run over different local media; a functioning Ethernet link still does not prove the server accepted the request. In an interview, start with the failure observation, identify the boundary it tests, and explain which boundaries remain untested.

:::note A model is not a deployment diagram
A layer need not be a separate machine, process or library. One gateway can switch Ethernet, route IP, translate addresses and enforce application policy. Name the table, message or state used by the specific action.
:::

## 3. Encapsulation and decapsulation

Finch's HTTP request begins as application bytes, but the network interface needs a bounded frame with local addresses. **Encapsulation** adds the control information required by a lower layer around the upper layer's bytes. **Decapsulation** removes and interprets that information on receipt. A payload is whatever the current layer carries, so the same TCP header is control information to TCP and payload to IP.

The application passes bytes to TCP. TCP supplies ports, sequence information and its checksum; IP supplies addresses and forwarding fields; Ethernet supplies local MAC addresses and a frame check. Signals carry the resulting bits. At the server, processing climbs those boundaries in reverse, checking each layer before delivering the permitted bytes upward.

@fig cn_encapsulation | HTTP bytes become a TCP segment, an IP packet and a local frame. Orange marks the Ethernet wrapper replaced at each routed hop.

With the declared no-option headers, the IP packet budget is 1,500 bytes. Subtracting 20 IP-header bytes and 20 TCP-header bytes gives

$$P=1500-20-20=1460\text{ bytes}.$$

Read P as the TCP payload capacity of this particular packet layout. TCP can split one application write across several segments or combine several writes; this capacity is not an HTTP message boundary. Options, encryption and other wrappers change the available application space.

@fig cn_headers | A header names the current layer's work while its payload contains the next layer's bytes. Orange marks IP, whose payload includes the TCP header and application data.

At the gateway, the incoming Ethernet wrapper ends. The router examines the IP destination and builds a different outgoing frame for its next neighbour. Ordinarily the end-to-end IP addresses remain, while TTL changes; Finch's NAT gateway also rewrites the source address and port under its translation rule. Link addresses therefore answer a different question from host addresses and transport ports.

The edge case is a path whose next link cannot carry the packet. A switch does not automatically invent smaller Ethernet frames that preserve every higher-layer boundary. Packet sizing and path MTU discovery need the relevant IP and transport rules, which return in Part IV. Confusing frame size with IP payload capacity hides both the overhead and the failure boundary.

:::interview Interview lens
**"Which addresses change when this request crosses a router?"** The incoming link frame ends and the outgoing frame uses the next link's interface addresses. The IP destination still names the server, while forwarding updates fields such as TTL. At Finch's NAT gateway, a separate translation rule also changes the source IP and port and records how to restore the reply.
:::

## 4. Physical signals, media and duplex

Finch's interface has a frame ready, but a cable carries changing electrical or optical signals rather than software objects. The **physical layer** defines symbols, timing and the channel assumptions needed to recover bits. An analog signal varies continuously; digital transmission chooses distinguishable symbols represented through that physical signal.

### Bit rate, baud rate and channel limits

Bit rate counts bits per second, while baud rate counts symbols per second. A symbol alphabet can represent several bits in one symbol, but the receiver must still distinguish the states despite attenuation, distortion and noise. Attenuation reduces strength, distortion changes shape, and noise adds unwanted variation. A carrier can remain detectable while its error rate prevents useful communication.

@fig cn_signals | Symbol count and bit count are different quantities. Orange marks bit rate; the symbol alphabet determines how much information each symbol can represent.

The illustrative channel has bandwidth B of 1,000,000 hertz and linear signal-to-noise ratio S of 15. Shannon's ideal bound gives

$$C=B\log_2(1+S)=1000000\log_2(16)=4000000\text{ bits/s}.$$

Read C as ideal channel capacity, not an Ethernet performance measurement. Nyquist's noiseless model with four distinguishable levels M gives $2B\log_2(M)=4000000$ bits per second under those different assumptions. Neither formula replaces measured error behaviour or a protocol's framing costs.

### Twisted pair, coaxial cable, fibre and wireless

Twisted pair and coaxial cable carry electrical signals with different interference and installation properties. Fibre carries light and changes the distance and equipment trade-off. Wireless shares radio spectrum and must contend with interference and competing stations. The media choice changes a physical cost without changing what the HTTP method means.

@fig cn_media | Media expose different distance and failure costs. Orange marks copper's electrical path; duplex describes direction sharing across a link.

Simplex sends in one direction, half duplex takes turns, and full duplex permits simultaneous directions. Modern switched Ethernet commonly uses full duplex, so its host link does not follow the older shared-medium collision procedure. For Finch's declared packet, serialization is $1500\times8/100000000=0.00012$ seconds, while propagation is $1000000/200000000=0.005$ seconds. Packet length changes the first cost; distance changes the second.

:::warn Watch out
Signal bandwidth in hertz, link bit rate and application throughput are different measurements. State the units and model before applying a formula. More distinguishable symbols do not provide free capacity on a noisy channel.
:::

:::key In one breath
Topology supplies paths, while endpoint roles and switching rules determine how those paths serve traffic. Layer models assign separate jobs to application, transport, Internet, link and physical work. Encapsulation adds headers whose scope determines where they are interpreted or replaced. Serialization depends on packet size and bit rate, while propagation depends on distance and signal speed.
:::

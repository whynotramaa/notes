For **Computer Networks**, I'd use the same standard as DBMS: not just placement definitions, but enough depth to follow a packet from your browser to a server and explain what happens at each layer, including failures, performance, and modern web/backend networking.

The complete syllabus I'd use is below.

# 1. Networking foundations

Start with the basic mental model.

- What is a computer network?
- LAN / MAN / WAN
- Internet vs intranet
- Network topology
  - star
  - bus
  - ring
  - mesh
- Client-server vs P2P
- Circuit switching vs packet switching
- Datagram vs virtual-circuit networks
- Store-and-forward
- Packet / frame / segment
- Bandwidth
- Throughput
- Latency
- RTT
- Jitter
- Packet loss

Understand total delay:

\[
D = D_{processing}+D_{queueing}+D_{transmission}+D_{propagation}
\]

and:

\[
D_{transmission} = \frac{L}{R}
\]

\[
D_{propagation} = \frac{distance}{propagation\ speed}
\]

Very common conceptual distinction:

> Transmission delay depends on packet size and link rate. Propagation delay depends on distance.

---

# 2. OSI and TCP/IP models

Know the OSI layers:

```text
7  Application
6  Presentation
5  Session
4  Transport
3  Network
2  Data Link
1  Physical
```

But don't just memorize them.

Know what belongs where:

| Layer | Examples |
|---|---|
| Application | HTTP, DNS, SMTP |
| Transport | TCP, UDP, QUIC |
| Network | IP, ICMP |
| Data Link | Ethernet, Wi-Fi, ARP* |
| Physical | electrical/radio/fiber |

ARP sits awkwardly between L2/L3 in practical descriptions, so don't obsess over forcing every protocol perfectly into OSI.

Then learn the practical Internet stack:

```text
Application
Transport
Internet
Link
Physical
```

---

# 3. Encapsulation

You should understand this extremely well.

Suppose:

```text
HTTP data
   ↓
TCP segment
   ↓
IP packet
   ↓
Ethernet frame
   ↓
bits
```

At the receiver:

```text
bits
 ↓
frame
 ↓
packet
 ↓
segment
 ↓
HTTP data
```

Understand:

- headers
- payload
- encapsulation
- decapsulation

And which addresses change across hops.

This is a fantastic interview question.

---

# 4. Physical layer fundamentals

You don't need electrical-engineering depth, but know:

- analog vs digital signals
- bit rate vs baud rate
- bandwidth
- attenuation
- distortion
- noise
- SNR
- transmission media
  - twisted pair
  - coax
  - fiber
  - wireless

Conceptually understand:

- simplex
- half duplex
- full duplex

You can keep Shannon/Nyquist at academic/interview level unless your curriculum requires numericals.

---

# 5. Data Link Layer

Now networking becomes practical.

Understand:

- framing
- MAC addresses
- error detection
- flow control
- medium access control

### MAC address

48-bit address, typically represented:

```text
AA:BB:CC:DD:EE:FF
```

Know:

- unicast
- multicast
- broadcast

And especially:

> MAC address vs IP address.

---

# 6. Error detection

Study:

- parity
- checksum
- CRC

Understand CRC conceptually and be able to solve basic CRC numericals if needed.

Know why error **detection** is different from error **correction**.

---

# 7. Ethernet

Very important.

Understand Ethernet frame structure conceptually:

```text
Destination MAC
Source MAC
EtherType
Payload
FCS
```

Then:

- Ethernet
- IEEE 802.3
- broadcast domain
- collision domain
- CSMA/CD
- full-duplex Ethernet

CSMA/CD is mostly historical on modern switched full-duplex Ethernet, but it's still a common academic/interview topic.

---

# 8. Hub vs switch vs router

Know this cold.

### Hub

Essentially repeats incoming signals.

### Switch

Operates mainly at Layer 2 and forwards using MAC addresses.

### Router

Operates at Layer 3 and forwards using IP routing.

Understand:

```text
Hub
Switch
Bridge
Router
Gateway
Repeater
```

Especially:

> Switch vs router.

---

# 9. Switching

How does a switch know where a device is?

Study:

- MAC/CAM table
- MAC learning
- forwarding
- flooding
- filtering
- MAC aging

Suppose:

```text
A → Switch → B
```

If the switch doesn't know B's MAC location, it floods the frame.

This should feel intuitive.

---

# 10. VLANs

Understand:

- VLAN
- broadcast domain
- access port
- trunk port
- IEEE 802.1Q tagging
- inter-VLAN routing

Conceptually:

```text
One physical switch

VLAN 10 → Engineering
VLAN 20 → Finance
```

behaves like separated Layer-2 networks.

---

# 11. ARP

**Very frequently asked.**

Question:

> I know `192.168.1.20`. How do I actually send an Ethernet frame to it?

ARP maps:

\[
IPv4\ address \rightarrow MAC\ address
\]

Understand:

- ARP request
- broadcast
- ARP reply
- ARP cache

Important nuance:

If the destination is outside your subnet, you don't ARP for the remote server.

You ARP for the **default gateway**.

This distinction matters a lot.

Also know ARP spoofing conceptually.

---

# 12. IP addressing

Now Layer 3.

Study IPv4 thoroughly.

IPv4:

\[
32\ bits
\]

Example:

```text
192.168.1.10
```

Understand:

- network portion
- host portion
- subnet mask
- CIDR

Example:

```text
192.168.1.0/24
```

You should be able to calculate:

- network address
- broadcast address
- usable host range
- number of addresses

For `/n`:

\[
2^{32-n}
\]

total addresses.

---

# 13. Subnetting

This needs actual practice.

Be comfortable with:

```text
/8
/16
/24
/25
/26
/27
/28
/30
/32
```

Given:

```text
192.168.10.64/26
```

you should derive:

- network address
- broadcast
- usable range
- host count

Then learn:

- VLSM
- subnetting
- supernetting / route aggregation

---

# 14. Public vs private IP

Know private IPv4 ranges:

```text
10.0.0.0/8

172.16.0.0/12

192.168.0.0/16
```

Also:

- loopback
- `127.0.0.1`
- link-local addresses
- `0.0.0.0`
- broadcast address

Understand what `0.0.0.0` means in different contexts, especially:

```text
server.listen("0.0.0.0")
```

versus routing/default-address usage.

---

# 15. DHCP

When your laptop joins Wi-Fi, how does it get networking configuration?

Classic DHCP flow:

```text
Discover
   ↓
Offer
   ↓
Request
   ↓
Acknowledge
```

**DORA**

Understand what DHCP typically provides:

- IP address
- subnet mask
- default gateway
- DNS server
- lease time

This directly connects to the hotspot/network work you've done.

---

# 16. NAT

Very important.

Your home might look like:

```text
Laptop ── 192.168.1.5
Phone  ── 192.168.1.6
             ↓
           Router
             ↓
        Public IP
```

Study:

- NAT
- SNAT
- DNAT
- PAT/NAPT
- port forwarding

Understand how many private devices can share one public IPv4 address using ports.

Also understand why NAT complicates inbound connections and P2P networking.

---

# 17. IPv4 packet

Know the important header fields:

- version
- header length
- total length
- TTL
- protocol
- source IP
- destination IP
- fragmentation-related fields
- checksum

Especially understand **TTL**.

Every router decrements TTL.

When it reaches zero, the packet is discarded, normally producing ICMP Time Exceeded.

This leads directly to traceroute.

---

# 18. IPv6

Know why IPv6 exists.

IPv6 addresses are:

\[
128\ bits
\]

Understand:

- IPv6 notation
- address shortening
- unicast
- multicast
- link-local
- global unicast
- loopback `::1`

Also:

- no broadcast in IPv6
- simplified base header
- Neighbor Discovery
- SLAAC

You don't need IPv6 expert-level knowledge, but don't skip it.

---

# 19. Routing

A router receives a packet.

How does it decide where to send it?

Study:

- routing table
- destination network
- next hop
- interface
- metric

Most important:

### Longest prefix matching

Given routes:

```text
10.0.0.0/8
10.1.0.0/16
10.1.2.0/24
```

packet for:

```text
10.1.2.50
```

matches `/24`.

Understand:

- static routing
- dynamic routing
- default route

---

# 20. Routing protocols

You don't need CCNA depth, but understand the ideas.

### Distance-vector

Example:

- RIP

Understand Bellman-Ford intuition and count-to-infinity.

### Link-state

Example:

- OSPF

Understand:

- network topology knowledge
- Dijkstra
- shortest path

### BGP

Extremely important conceptually for understanding the Internet.

Understand:

- autonomous systems
- AS numbers
- inter-domain routing
- path-vector routing
- AS_PATH
- routing policies
- peering/transit concept

BGP is not simply “shortest geographical path.”

---

# 21. ICMP

Study:

- ICMP
- Echo Request
- Echo Reply
- Destination Unreachable
- Time Exceeded

Then understand:

```bash
ping
```

and:

```bash
traceroute
```

### Why traceroute works

Send packets with increasing TTL:

```text
TTL 1
TTL 2
TTL 3
...
```

Each expired packet reveals another router through ICMP.

Very good interview topic.

---

# 22. Transport layer

Now we reach one of the **highest-priority CN sections**.

Understand:

- process-to-process communication
- ports
- sockets
- multiplexing
- demultiplexing

Socket connection commonly identified by:

```text
source IP
source port
destination IP
destination port
protocol
```

Often called the connection's 5-tuple.

---

# 23. TCP vs UDP

Know this beyond the usual table.

### UDP

- connectionless
- no built-in reliability
- no built-in ordering
- no retransmission
- low protocol overhead
- datagram-oriented

Used where the application can tolerate or handle loss/ordering itself, or where low latency/simple messaging matters.

### TCP

- connection-oriented
- reliable byte stream
- ordered delivery
- retransmissions
- flow control
- congestion control

Be able to reason about why applications choose one or the other.

---

# 24. TCP connection establishment

**Know this cold.**

Three-way handshake:

```text
Client                     Server

SYN ---------------------->

     <---------------- SYN + ACK

ACK ---------------------->

       ESTABLISHED
```

Understand:

- sequence numbers
- SYN
- ACK

And especially:

> Why three messages rather than two?

Think about confirming bidirectional communication and synchronizing initial sequence state.

---

# 25. TCP connection termination

Study:

```text
FIN
ACK
FIN
ACK
```

Understand:

- half-close
- FIN
- ACK
- `TIME_WAIT`
- `CLOSE_WAIT`

Important interview question:

> Why does TIME_WAIT exist?

Know the role of delayed duplicate segments and ensuring the final ACK can be retransmitted.

---

# 26. TCP reliability

How does TCP become reliable over unreliable IP?

Study:

- sequence numbers
- ACKs
- retransmission
- checksums
- timers
- duplicate ACKs
- out-of-order segments

Understand retransmission timeout conceptually.

Then:

### RTT estimation

Understand why TCP cannot simply use a fixed retransmission timeout everywhere.

---

# 27. Sliding window

Very important.

Without pipelining:

```text
send
wait
ACK
send
wait
ACK
```

terrible utilization over high-latency links.

Sliding window allows:

```text
1 2 3 4 5 ──────>

        <──── ACKs
```

Study:

- sender window
- receiver window
- sequence space
- cumulative ACKs

Connect this to:

- Stop-and-Wait
- Go-Back-N
- Selective Repeat

These protocols are particularly important for academic interviews/exams.

---

# 28. TCP flow control

Flow control protects the **receiver**.

Suppose:

```text
Sender: 10 Gbps capable
Receiver: buffer nearly full
```

TCP uses the advertised receive window:

\[
rwnd
\]

Understand:

- receiver buffer
- advertised window
- zero window

Don't confuse this with congestion control.

---

# 29. TCP congestion control

**Very important.**

Congestion control protects the **network**.

Study:

- congestion window `cwnd`
- slow start
- congestion avoidance
- congestion detection
- fast retransmit
- fast recovery

Understand roughly:

```text
cwnd grows quickly
     ↓
threshold
     ↓
growth becomes slower
```

Also understand modern algorithms conceptually:

- Reno
- CUBIC
- BBR

You don't need their full math for ordinary SWE interviews.

Most important distinction:

> Flow control protects the receiver. Congestion control protects the network.

---

# 30. Network congestion concepts

Since you've studied these before, keep them explicitly in the syllabus.

Study:

- congestion
- congestion collapse
- open-loop vs closed-loop control
- backpressure
- choke packets
- implicit congestion signaling
- explicit congestion signaling
- ECN
- traffic shaping

Traffic shaping:

### Leaky bucket

Smooth output rate.

### Token bucket

Allows controlled bursts.

These also connect to API rate limiting in system design.

---

# 31. DNS

**One of the most important interview topics.**

User types:

```text
google.com
```

How do we find the IP?

Understand hierarchy:

```text
.
↓
.com
↓
google.com
```

Components:

- stub resolver
- recursive resolver
- root nameserver
- TLD nameserver
- authoritative nameserver

Records:

- A
- AAAA
- CNAME
- MX
- NS
- TXT
- PTR
- SOA conceptually

Understand:

- recursive query
- iterative query
- DNS caching
- TTL
- negative caching

And why DNS commonly uses UDP but can use TCP.

---

# 32. HTTP

For backend interviews, **go deep here**.

Understand HTTP request:

```http
GET /users/123 HTTP/1.1
Host: example.com
Authorization: ...
Accept: application/json
```

and response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: ...
```

Study:

### Methods

- GET
- POST
- PUT
- PATCH
- DELETE
- HEAD
- OPTIONS

Understand:

- safe methods
- idempotent methods

### Status codes

Know common ones:

```text
200 201 204
301 302 307 308
400 401 403 404 409 429
500 502 503 504
```

Especially:

> 401 vs 403  
> 502 vs 503 vs 504  
> PUT vs PATCH  
> POST vs PUT

---

# 33. HTTP headers and caching

Know important headers:

- Host
- Content-Type
- Content-Length
- Accept
- Authorization
- Cookie
- Set-Cookie
- Cache-Control
- ETag
- If-None-Match
- Last-Modified
- Location
- User-Agent

Understand browser/proxy caching.

Example:

```text
ETag: "abc123"
```

then:

```text
If-None-Match: "abc123"
```

Server can return:

```text
304 Not Modified
```

---

# 34. HTTP/1.0 vs 1.1 vs 2 vs 3

Important modern interview topic.

### HTTP/1.0

Typically new TCP connections frequently.

### HTTP/1.1

- persistent connections
- pipelining concept
- chunked transfer

### HTTP/2

- binary framing
- streams
- multiplexing
- header compression
- one TCP connection commonly carrying many requests

But TCP-level head-of-line blocking remains.

### HTTP/3

Runs over **QUIC** rather than TCP.

Understand why this changes head-of-line behavior between independent streams.

---

# 35. QUIC

Worth learning now.

QUIC runs over UDP but implements functionality such as:

- reliable streams
- congestion control
- encryption integration
- connection establishment
- stream multiplexing

Understand:

```text
HTTP/1.1 → TCP
HTTP/2   → TCP
HTTP/3   → QUIC → UDP
```

Also:

- independent streams
- connection migration
- reduced handshake overhead

---

# 36. HTTPS, TLS and certificates

**High priority.**

Understand what HTTPS actually means:

```text
HTTP
 ↓
TLS
 ↓
TCP
```

(for traditional HTTP/1.1 and HTTP/2).

Study:

- symmetric encryption
- asymmetric encryption
- public/private keys
- digital signatures
- hashing
- certificates
- Certificate Authorities
- certificate chain
- hostname verification

You don't need cryptography-proof depth.

But you should understand TLS handshake conceptually:

```text
ClientHello
       ↓
ServerHello + certificate
       ↓
certificate verification
       ↓
key agreement
       ↓
shared session keys
       ↓
encrypted application traffic
```

Modern TLS typically uses ephemeral Diffie-Hellman-style key exchange rather than “encrypt the symmetric key directly with RSA.”

---

# 37. Cookies and sessions

Very relevant to web/backend.

Study:

- cookies
- `Set-Cookie`
- `HttpOnly`
- `Secure`
- `SameSite`
- expiration
- domain
- path

Then:

### Server-side session

```text
cookie → session ID → server/session store
```

versus:

### JWT-style token

```text
token → claims + signature
```

Understand:

- authentication vs authorization
- stateful vs stateless auth
- revocation
- CSRF
- XSS implications

---

# 38. CORS

Frequently misunderstood.

CORS is primarily a **browser security mechanism**, not server authentication.

Study:

- same-origin policy
- origin
- `Access-Control-Allow-Origin`
- preflight
- OPTIONS request
- allowed methods
- allowed headers
- credentials

Understand why:

```bash
curl
```

can call something that a browser JavaScript application may be blocked from calling.

---

# 39. WebSockets

Relevant to your real-time projects.

Handshake begins over HTTP, then upgrades:

```text
HTTP
 ↓
Upgrade: websocket
 ↓
persistent bidirectional connection
```

Understand:

- persistent connections
- bidirectional messaging
- frames
- ping/pong
- connection lifecycle
- reconnect handling

Compare:

- polling
- long polling
- SSE
- WebSockets

---

# 40. Reverse proxies

Understand architecture:

```text
Internet
   ↓
Nginx / proxy
   ↓
Backend
```

A reverse proxy can handle:

- routing
- TLS termination
- load balancing
- compression
- caching
- rate limiting

Know:

> Forward proxy vs reverse proxy.

---

# 41. Load balancing

Study:

### L4

Routes using transport/network information.

### L7

Can route based on HTTP-level information.

Algorithms:

- round robin
- weighted round robin
- least connections
- hashing
- consistent hashing

Then:

- health checks
- sticky sessions
- failover

This overlaps with system design intentionally.

---

# 42. Proxies, VPNs and tunnels

Understand differences between:

- forward proxy
- reverse proxy
- VPN
- SSH tunnel
- SOCKS proxy

A VPN typically creates an encrypted tunnel and routes selected network traffic through it.

Study conceptually:

- tunneling
- encapsulation
- WireGuard
- IPsec

No need for protocol implementation depth.

---

# 43. Firewalls

Study:

- packet filtering
- stateful firewall
- stateless firewall
- ingress
- egress
- firewall rules
- ports
- connection tracking

Understand why:

```text
allow TCP 443
```

means something different from simply allowing all traffic to a machine.

---

# 44. Network security attacks

Interview-level knowledge:

- packet sniffing
- IP spoofing
- ARP spoofing
- DNS poisoning
- MITM
- SYN flood
- DDoS
- replay attacks
- session hijacking

Then understand the defenses conceptually:

- TLS
- authentication
- rate limiting
- firewalls
- secure DNS mechanisms
- SYN cookies
- anti-DDoS infrastructure

---

# 45. Socket programming

Since you're targeting backend engineering, don't skip this.

Understand:

Server:

```text
socket()
bind()
listen()
accept()
recv()
send()
close()
```

Client:

```text
socket()
connect()
send()
recv()
close()
```

Know:

- blocking sockets
- non-blocking sockets
- connection backlog
- file descriptors
- socket buffers

This will connect beautifully with OS later.

---

# 46. I/O models for network servers

This sits between CN and OS.

Understand progression:

```text
one connection
     ↓
thread per connection
     ↓
thread pool
     ↓
non-blocking I/O
     ↓
event loop
```

Know conceptually:

- `select`
- `poll`
- `epoll`
- `kqueue`
- async I/O

Why can Node.js handle many network connections with relatively few threads?

This question requires both networking and OS knowledge.

---

# 47. CDN and edge networking

Understand:

```text
User
 ↓
Nearest edge
 ↓ cache miss
Origin
```

Study:

- edge servers
- PoPs
- caching
- origin
- cache hit/miss
- TTL
- invalidation
- Anycast conceptually

Connect DNS/routing/CDN together.

---

# 48. P2P and NAT traversal

This is particularly useful given your P2P project ideas.

Understand:

- peer-to-peer architecture
- NAT problem
- public/private endpoints
- hole punching
- STUN
- TURN
- ICE

Conceptually:

```text
STUN
→ What's my public endpoint?

Hole punching
→ Can peers connect directly?

TURN
→ If not, relay traffic.
```

Very relevant to WebRTC.

---

# 49. Network virtualization

Keep this conceptual.

Study:

- virtual NIC
- bridge
- virtual network
- VLAN
- VXLAN
- overlay network
- SDN
- NFV

Since you've already encountered NFV:

### SDN

Separate/control networking through programmable control-plane mechanisms.

### NFV

Run network functions such as firewalls/load balancers as software rather than dedicated appliances.

This becomes useful when learning cloud networking.

---

# 50. Docker/cloud networking basics

For practical backend understanding:

Know:

```text
container
 ↓
virtual interface
 ↓
bridge
 ↓
host interface
 ↓
network
```

Understand:

- container network namespaces
- bridge networking
- port mapping
- service-to-service networking

Then basic cloud concepts:

- VPC
- subnet
- route table
- internet gateway
- NAT gateway
- security groups

You don't need AWS certification depth.

---

# The most important exercise: “What happens when I type a URL?”

This should eventually combine almost the entire syllabus.

Suppose you type:

```text
https://example.com
```

You should eventually be able to explain something like:

```text
Browser
  │
  ├─ Check caches
  │
  ├─ DNS resolution
  │
  └─ Obtain destination IP
       │
       ▼
Determine route
       │
       ├─ Is destination local?
       │
       └─ Otherwise use default gateway
                  │
                 ARP
                  │
                  ▼
             Ethernet frame
                  │
                  ▼
                Router
                  │
                 NAT
                  │
                  ▼
              Internet
                  │
               Routing
                  │
                  ▼
            Destination
                  │
              TCP / QUIC
                  │
                 TLS
                  │
                 HTTP
                  │
                  ▼
               Server
```

Then the interviewer can attack any point:

> What if DNS is cached?

> Why ARP for the router rather than example.com?

> What does the switch do?

> What does NAT change?

> How does the router select the next hop?

> Why does TTL change?

> How does TCP establish the connection?

> How does TLS authenticate the server?

> Where does HTTP begin?

> What if it's HTTP/3?

> What does the reverse proxy do?

> How does the response find your laptop again?

If you can follow that chain without memorized jumps, **your CN fundamentals are strong.**

## Priority for interviews

**Tier A — know cold:** OSI/TCP-IP, encapsulation, MAC vs IP, Ethernet/switching, ARP, IPv4/CIDR/subnetting, NAT, DHCP, routing, TCP/UDP, handshake/termination, TCP reliability, flow vs congestion control, DNS, HTTP, HTTPS/TLS, sockets.

**Tier B — strong understanding:** sliding windows, routing algorithms, ICMP, HTTP/2 + HTTP/3, QUIC, cookies/sessions, CORS, WebSockets/SSE, reverse proxies, load balancing, firewalls, CDN, IPv6.

**Tier C — understand conceptually:** BGP internals beyond basics, VPN/tunneling, P2P/NAT traversal, SDN/NFV, VXLAN, cloud/container networking, advanced congestion algorithms.

One thing I **would not add** is dozens of obscure legacy protocols. These 50 areas cover the university CN foundation, backend/SWE interviews, modern web networking, distributed-system prerequisites, and enough practical Linux/cloud networking to reason through real failures.

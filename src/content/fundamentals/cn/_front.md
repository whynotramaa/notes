<section class="front">

<div class="part-kicker">Fundamentals · Computer Networks</div>

# How to read this chapter

<p class="lede">A browser request starts as a name, becomes bytes, crosses several administrative boundaries, and returns as an HTTP response. This guide names each boundary, shows its wire-level work, and keeps one small request in view from the first cache check to the final socket read.</p>

The syllabus supplies the order. We begin with networks and layers, put bits into frames, move those frames through switches and routers, then add transport, web protocols, security, servers, and cloud networking. Each section opens with a concrete failure or packet, explains the mechanism, works a number from the supplied data, and names the case that breaks the simple story.

The orange map marks the current part. Read the prose before the figure, then redraw the figure with the labels hidden. A story box gives a physical analogy, a note records a useful variant, a warning catches an interview mistake, and an interview lens gives a spoken answer rather than a glossary sentence.

The last part is a single URL trace. It uses the same private client, gateway, public NAT address, and server in every layer. By the end you should be able to draw the packet, explain why the client ARPs for the gateway, show what NAT changes, and say where TCP, TLS, and HTTP begin.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch

**Finch** is a small office network making an HTTPS request to a server. The private LAN uses a private address range; the public-side examples use reserved documentation ranges. These are teaching values, not a claim about a production deployment. They stay fixed so a routing decision can be checked at every layer.

| Setting | Symbol or value | What it controls |
|---|---|---|
| Client address | `192.168.10.70` | The browser host on the private LAN |
| LAN gateway | `192.168.10.65` | The next hop outside the local subnet |
| Public NAT address | `198.51.100.7` | The source address visible beyond the gateway |
| Server address | `203.0.113.20` | The destination of the request |
| LAN subnet | `192.168.10.64/26` | The local broadcast and host boundary |
| Link rate | `100,000,000` bits/s | Transmission time for a frame |
| Packet size | `1,500` bytes | One illustrative IP packet |
| Path distance | `1,000,000` metres | Propagation delay input |
| Propagation speed | `200,000,000` metres/s | Signal travel rate |
| Round-trip time | `40` ms | Window and handshake arithmetic |
| TCP initial sequence | `1,000` | Sequence trace starting point |

The subnet has network address `192.168.10.64`, broadcast `192.168.10.127`, usable range `192.168.10.65` through `192.168.10.126`, and `62` ordinary hosts. The client and gateway are therefore local, while the server is not. When Finch asks for `https://example.com`, the chapter follows the name lookup, route choice, ARP cache, Ethernet frame, NAT mapping, transport handshake, TLS session, HTTP request, and response. Part XII reconciles the `1,500` byte IP packet, `1,460` byte TCP payload and `1,518` byte Ethernet frame, then counts the simplified cold exchange as `120` ms under its stated round-trip assumptions.

</section>

@part VII | Private networks and Tailscale | We connect machines that sit behind different firewalls and NATs with encrypted, direct links. The syllabus's central question is how two machines behind separate NATs can open a direct encrypted connection, and the answer combines a lean tunnel protocol with clever use of UDP. We will cover WireGuard, NAT traversal with STUN and hole punching, and how Tailscale assembles them into a private network. | where:7

## 21. WireGuard

Wren's engineers need to reach internal machines, a database bastion, staging services, admin dashboards, from laptops at home and on the road. The traditional answer is a VPN, a virtual private network that creates an encrypted tunnel into the company network. Older VPN protocols such as IPsec and OpenVPN are large, configurable in many ways, and correspondingly easy to misconfigure.

**WireGuard**, designed by Jason Donenfeld and merged into the Linux kernel in version 5.6 in 2020, takes the opposite approach. Its implementation is around 4,000 lines of code, small enough to audit, and it makes almost no choices configurable. It uses a fixed, modern set of primitives, Curve25519 for key exchange, ChaCha20-Poly1305 for encryption, BLAKE2s for hashing, and a handshake based on the Noise protocol framework that completes in one round trip.

Each WireGuard **peer** has a key pair. Configuration is a list of peers, each identified by its public key, with the IP addresses it may use inside the tunnel and, optionally, an endpoint, the public address and port where it can be reached. WireGuard calls this **cryptokey routing**. A packet for a tunnel address is encrypted with the matching peer's key and sent to that peer's endpoint. A packet that arrives is accepted only if it decrypts with a known peer's key and comes from an address that peer is allowed to use.

@fig be_wg_tunnel | Two peers that know each other's public keys, exchanging encrypted UDP packets.

WireGuard runs over UDP, by default on port 51820, and is silent to anyone without a valid key. It does not respond to unauthenticated packets at all, so a port scan sees nothing. It handles roaming naturally, since if a peer's packets start arriving from a new address, for example a laptop moving from home Wi-Fi to a phone hotspot, WireGuard updates the endpoint and carries on.

What WireGuard deliberately does not do is everything around the tunnel. It does not distribute keys, it does not discover where peers are, it does not traverse NATs on its own, and it has no notion of users or access policy. Every peer needs every other peer's public key and reachable endpoint configured in advance. For two servers with fixed public addresses, that is fine. For a hundred laptops behind home routers, it is the hard problem.

## 22. NAT traversal: STUN and hole punching

Most devices do not have public IP addresses. A laptop at home has 192.168.1.20, and the home router translates it to the router's public address, 198.51.100.7, using **network address translation**, NAT. When the laptop sends a packet out, the router creates a mapping, remembering that replies arriving at its public port 41641 should go to the laptop's port 51820, and forwards replies accordingly. A packet that arrives at the router without a matching mapping is dropped, because the router has no idea which device it is for.

Wren's database bastion in the cloud sits behind its own NAT gateway, with a private address 10.0.3.9 and a public address 203.0.113.80. Neither device has an address the other can dial. A packet from the laptop to the bastion's public address is dropped by the bastion's NAT, and the reverse is dropped by the laptop's router.

@fig be_nat_problem | Each side's NAT drops unsolicited packets, so neither can reach the other.

**UDP hole punching** gets around this by having both sides send first. Step one is for each device to learn its own public address and port as the outside world sees it. It asks a **STUN** server, Session Traversal Utilities for NAT, RFC 8489, "what address did my packet come from?", and learns that its NAT mapped it to 198.51.100.7:41641. The bastion learns 203.0.113.80:52010 the same way. Step two is for both to share those endpoints through a coordination server they can both reach. Step three is for both to send UDP packets to each other's public endpoint at about the same time.

@fig be_nat_punch | Learn your public endpoint, exchange it, then both send, so each NAT has a mapping for the other's packets.

When the laptop sends to 203.0.113.80:52010, its own router creates a mapping that will accept replies from that address. The first packet may be dropped at the bastion's NAT, which has no mapping yet. But the bastion is sending to 198.51.100.7:41641 at the same time, which creates the bastion NAT's mapping for the laptop, and that packet arrives at the laptop's router, which now has a mapping for it. Within a round trip or two, both NATs have mappings, and packets flow directly in both directions. The "hole" is the pair of mappings each side punched in its own NAT.

It does not always work. **Endpoint-independent** NATs, which use the same public port for a device whatever the destination, are easy. **Symmetric** NATs, which pick a different public port for each destination, make the STUN-learned port useless for any other peer, and some corporate firewalls block outbound UDP entirely. For those cases a relay is needed, which brings us to Tailscale.

## 23. Tailscale: control plane, data plane and relays

**Tailscale**, founded in 2019, builds a private network, a **tailnet**, on top of WireGuard by solving the parts WireGuard leaves out. Its design separates a control plane from a data plane, the same split as the service mesh.

The control plane is Tailscale's **coordination server**. Each device runs the Tailscale client, which generates a WireGuard key pair locally, the private key never leaves the device, and logs in through the organisation's identity provider, such as Google or Okta. The coordination server records the device's public key, its user and tags, and the endpoints it has discovered via STUN, and distributes to every device the public keys and endpoints of the peers it is allowed to reach. It is a key and address directory with an access policy, and it never carries traffic.

The data plane is WireGuard between devices. Using the keys and endpoints from the coordination server, each pair of devices attempts direct connections through hole punching, trying several candidate addresses, local network addresses, STUN-discovered public ones and others, and keeps whichever path works best. Two laptops in the same office connect over the local network. A laptop and a cloud bastion usually connect directly through both NATs.

@fig be_ts_planes | Keys and endpoints come from the coordination server. Traffic goes direct, or through a DERP relay when it must.

When no direct path can be made, symmetric NATs, blocked UDP, strict firewalls, traffic goes through **DERP** relays, Designated Encrypted Relay for Packets, Tailscale's servers spread around the world. DERP speaks HTTPS, which almost every network allows, and relays WireGuard packets without being able to read them, since encryption is end to end between the devices. Connections start on DERP immediately and upgrade to a direct path when hole punching succeeds, so users never wait for traversal to finish.

On top sit the features that make a tailnet practical. Every device gets a stable address in the 100.64.0.0/10 range and a name through **MagicDNS**, so `db-bastion` resolves anywhere on the tailnet. **ACLs**, and their newer form, **grants**, written centrally, say which users and tagged devices may reach which others on which ports, such as "the oncall group may reach machines tagged db on port 5432". A **subnet router** advertises a whole private network, such as a cloud VPC's 10.0.0.0/16, so devices can reach machines that do not run Tailscale. An **exit node** routes all of a device's internet traffic through a chosen machine, for example on untrusted Wi-Fi. Device keys expire and must be re-authenticated, so a lost laptop's access ends on schedule even if nobody revokes it.

@fig be_ts_features | Names, policies, routes into existing networks and exit nodes, on top of the WireGuard mesh.

The design is an example of **zero-trust networking**, Unit XIII. Access depends on the identity of the user and device and on central policy, not on being inside a network perimeter. Headscale is an open-source implementation of the coordination server, and similar ideas appear in products such as Cloudflare's WARP and ZeroTier.

:::story Picture this
Two neighbours in houses with high fences and locked gates, each gate only opening for someone the owner has already called. A mutual friend tells each of them the other's address, and at an agreed moment both open their gates and call out at once. Each gate now remembers the other, and they can talk directly. If one of them lives in a gated estate that admits nobody, the friend carries sealed letters between them instead.
:::

:::note Why UDP
Hole punching is far more reliable with UDP than with TCP, because UDP has no handshake and NATs create mappings for any outgoing datagram, while simultaneous TCP opens are handled inconsistently by NATs and operating systems. That is one reason WireGuard, QUIC, WebRTC and most peer-to-peer protocols run over UDP.
:::

:::warn Watch out
A subnet router or exit node is a powerful machine on two networks at once. Restrict which users may use it through ACLs, keep its own access tight, and monitor it, since compromising it reaches everything behind it.
:::

:::interview Interview lens
**"How can two machines behind separate NATs establish a direct encrypted connection?"** Each learns its public address and port by asking a STUN server, and they exchange these endpoints through a coordination server both can reach. Then both send UDP packets to each other's public endpoint at about the same time, so each NAT creates a mapping that admits the other's packets, which is UDP hole punching. WireGuard then runs over that path with keys distributed by the coordination server. If either NAT is symmetric or UDP is blocked, traffic falls back to a relay such as Tailscale's DERP, still end-to-end encrypted.
:::

:::key In one breath
WireGuard is a small, fixed-cipher VPN in the Linux kernel since 5.6, where peers are identified by public keys and cryptokey routing accepts packets only from known keys over UDP 51820. NATs drop unsolicited packets, so devices learn their public endpoints from STUN, exchange them through a coordination server and send to each other at once, punching holes in both NATs, which fails on symmetric NATs or blocked UDP. Tailscale's coordination server distributes keys, endpoints and policy, WireGuard carries traffic directly or through DERP relays over HTTPS, and MagicDNS, ACLs and grants, subnet routers and exit nodes complete a zero-trust network.
:::

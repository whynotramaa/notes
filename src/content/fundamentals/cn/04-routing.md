@part IV | IP forwarding and routing | A valid local frame is only the first stage of a remote request. Configuration, translation and route selection must agree on both the outgoing and return paths. We will obtain Finch's configuration, follow its NAT mapping, inspect IP headers and use routing and control messages to explain forwarding failures. | where:4

## 16. DHCP, DORA and address leases

Finch joins the LAN without its final address, mask or gateway. Sending ordinary traffic immediately would require guessing the very configuration needed to deliver it. **DHCP** supplies address configuration and options under a time-bounded lease. The familiar initial exchange is Discover, Offer, Request and Acknowledge, called DORA.

The client sends Discover to find a server. A server offers an address and configuration, and the client requests the selected offer. The server acknowledges the lease. This exchange resolves selection as well as delivery; hearing an offer is not permission to treat every offered address as permanently owned.

@fig cn_dhcp | DORA separates finding a server, receiving an offer, choosing it and receiving a lease. Orange marks Discover, which begins without a configured server destination.

### Options, renewal and relays

The resulting configuration includes the client's address and subnet mask, the default gateway, DNS information and the lease terms. For the running fixture, the selected address is `192.168.10.70/26` and the gateway is `192.168.10.65`. The client can derive the `.64` network and `.127` broadcast from those values rather than asking the server for a separate route to every Internet destination.

Renewal extends the lease under its protocol, while failure to retain a valid lease eventually changes what the client may use. A DHCP relay lets configuration messages reach a server beyond the local broadcast boundary. [The DHCP specification](https://www.rfc-editor.org/rfc/rfc2131.html) distinguishes initial selection from later renewal and rebinding.

The failure trace begins with a host that has a plausible address but the wrong gateway. Local neighbours may work while remote requests fail. A wrong DNS option can break names while direct address connections still work. Competing misconfigured servers can produce intermittent differences between otherwise identical clients. Inspect the actual lease, local routes and name configuration before assuming the web service is unavailable.

:::story Picture this
A shared workshop loans each visitor a numbered locker key with a return deadline and directions to the exit desk. Offering a key is different from recording that a visitor accepted it. Renewing the loan extends that visitor's permission to use the locker. The locker number is the address, the directions are configuration options and the loan record is the lease.
:::

## 17. NAT, SNAT, DNAT and PAT

Finch sends a TCP packet whose private source is `192.168.10.70:51000`. The modeled server cannot use that private tuple as an ordinary Internet return destination. **NAT** translates addresses at a boundary. **SNAT** changes a source address, **DNAT** changes a destination address, and **PAT** also distinguishes flows through translated transport ports.

The gateway maps Finch's source to `198.51.100.7:40001` for destination `203.0.113.20:443`. It records the transport protocol and tuples required to recognize the return flow. The server replies to the external tuple; the gateway looks up the mapping and restores destination `192.168.10.70:51000`. These ports are declared illustrative identifiers, not inferred production values.

@fig cn_nat | The outgoing source and incoming destination cross the same translation boundary. Orange marks the returning external tuple that must match retained mapping state.

### Translation state and checksums

The translation changes fields covered by integrity checks, so the gateway must maintain the relevant checksum rules as well as addresses. Mapping selection must avoid ambiguity between simultaneously active flows. A public source address alone cannot tell the gateway which private socket should receive the reply; its stored protocol and port evidence complete that decision.

A gateway crash can lose mappings while endpoints still believe their transport connections exist. Rerouting through another gateway with no corresponding state does not automatically restore them. Expired mappings can similarly break an idle connection that the application expected to reuse. Recovery may require new transport setup and application-level resumption.

### Port forwarding and NAT traversal

An unsolicited incoming flow usually has no existing translation row. Static port forwarding supplies a configured destination translation, with firewall policy evaluated separately. Peer-to-peer applications may need discovery, direct-path negotiation or a relay, covered in Part XI. NAT changes reachability and state, but it is not by definition an authentication or firewall guarantee. [Traditional NAT's specification](https://www.rfc-editor.org/rfc/rfc3022.html) describes the address and transport translation distinction used here.

:::warn Watch out
Changing the route after a gateway failure does not recreate its translation table. A connection needs a valid return mapping as well as an outgoing path. NAT and firewall rules are separate decisions even when one appliance performs both.
:::

## 18. IPv4 packet fields, TTL and MTU

The gateway removes Finch's incoming frame, but it still needs an IP packet carrying the destination. An **IPv4 header** contains version, header length, total length, addressing, protocol selection, hop budget, fragmentation information and a header checksum. Each field serves a forwarding or receiving decision rather than duplicating Ethernet's local addresses.

TTL is a hop budget that prevents an IP loop from circulating a packet indefinitely. With the declared initial value 64, the gateway's ordinary forwarding decrement leaves $64-1=63$. When forwarding would exhaust the permitted budget, the router discards the packet and may report Time Exceeded under ICMP rules. The example is a chosen packet field, not a claimed operating-system default.

@fig cn_ipv4_header | IP carries host addresses and forwarding information beyond the local frame. Orange marks TTL, whose decrement bounds ordinary forwarding loops.

### Header integrity and fragmentation

The IPv4 header checksum covers that header rather than the entire TCP payload. Changing TTL requires maintaining the checksum; TCP separately checks its segment and relevant pseudo-header fields. A valid IPv4 header therefore does not prove that the application bytes arrived unchanged or that the sender was authorized.

The next link's MTU can be smaller than the arriving IP packet. IPv4 fragmentation, where permitted, uses identification, offset and flags so the destination can reassemble pieces. A packet marked not to fragment instead needs a suitable failure response when it cannot fit. Losing a fragment can prevent reassembly of the whole original packet, so fragmentation changes both state and loss consequences.

### Path MTU discovery

A sender can use path MTU feedback to choose a packet size that fits the route. Filtering the needed control messages can cause a black hole where small exchanges work but larger transfers stall. That symptom differs from a complete loss of routing. Inspect the IP packet size and fragmentation policy before concluding that a healthy handshake proves the data path can carry every later write.

:::note Hop budget and application deadline
TTL bounds forwarding hops, while an application deadline bounds elapsed request time. A packet can have hops left after the request already timed out, or exhaust its hops quickly in a loop. Neither counter supplies the other's guarantee.
:::

## 19. IPv6 addresses, headers and discovery

Finch's IPv4 path uses address translation, but a different deployment may provide end-to-end IPv6 addressing. **IPv6** uses 128-bit addresses compared with IPv4's 32 bits. More address positions change allocation possibilities; they do not remove route selection, congestion or application permission checks.

### Address notation and scope

An IPv6 address uses hexadecimal groups. Leading zeroes can be omitted, and one consecutive run of zero groups can be compressed using `::`. The loopback example `::1` names this host. Global unicast, link-local and multicast have distinct scopes. IPv6 has no broadcast address, so protocols use appropriately scoped multicast instead of copying IPv4's broadcast rule.

@fig cn_ipv6 | IPv6 changes address size and local control mechanisms. Orange marks the larger address field; multicast and link-local scope still need explicit delivery rules.

### Neighbor Discovery and SLAAC

Neighbor Discovery uses ICMPv6 messages to resolve neighbours, discover routers and maintain local reachability information. Router advertisements can also support stateless address autoconfiguration, or SLAAC. The host forms an address under the advertised configuration rather than assuming that knowing a larger address solves every network setup step.

### Base header and extension headers

IPv6's base header uses a hop limit in place of IPv4's TTL and moves some optional processing into extension headers. It does not include IPv4's header checksum, and routers do not perform IPv4-style fragmentation of an oversized transit packet. The sender must handle appropriate packet sizing and feedback. [The IPv6 specification](https://www.rfc-editor.org/rfc/rfc8200.html) defines these concrete changes.

A dual-stack client can reach a service over one family while failing over the other because DNS answers, routes, firewalls and listeners differ. A successful IPv4 probe is not evidence of an operational IPv6 path. In an interview, follow the chosen family through local discovery and routing, then identify the common transport and application jobs that remain above it.

## 20. Routing tables and longest-prefix matching

Finch's gateway receives the remote destination and must choose an outgoing interface. **Routing** selects reachability information, while forwarding applies that information to a particular packet. A route entry names a destination prefix and enough next-hop or interface information to continue delivery. The packet does not normally contain a complete physical itinerary.

### Longest-prefix matching

A teaching destination `10.1.2.50` matches `10.0.0.0/8`, `10.1.0.0/16` and `10.1.2.0/24`. **Longest-prefix matching** selects the most specific matching prefix, so `/24` wins before preferences among equally specific eligible routes are considered. The default route applies when no more-specific entry supplies the decision.

@fig cn_routing | Several entries match the teaching address. Orange marks `/24`, selected because it retains the most destination-prefix bits.

The specificity lengths satisfy $24>16>8$. Read the comparison as matched address information, not geographic distance, link speed or transport-port priority. A route with a lower configured metric under a shorter prefix does not normally override a valid more-specific route merely because its numeric metric is attractive.

### Next hops, interfaces and static routes

After selecting the route, the gateway resolves any required local neighbour and builds the outgoing frame. An on-link route and a next-hop route have different neighbour requirements. A static route supplies administrative configuration, while dynamic routing can update reachability after topology changes. Neither avoids a missing local neighbour or a failed physical egress link.

If the selected next hop disappears, retaining the old entry can produce a black hole. If several devices route toward one another without valid progress, a loop consumes the packet's hop budget. [IPv4 router requirements](https://www.rfc-editor.org/rfc/rfc1812.html) separate route selection, forwarding and control responses. The interview trace should likewise identify the selected prefix, next hop, neighbour resolution and outgoing interface before discussing the application retry.

## 21. Distance-vector, link-state and BGP routing

A link fails beyond Finch's gateway, and the gateway needs new reachability evidence. Repeatedly trying the old next hop does not repair the route. A **routing protocol** exchanges information used to build forwarding state, with an explicit model for what information each participant knows and how it reacts to changes.

### Distance-vector routing and RIP

A distance-vector participant learns destinations and costs from neighbours. It combines its local link cost with a neighbour's advertised distance to propose a route. If neighbours mistakenly infer reachability from one another after a failure, costs can increase while a loop persists, the count-to-infinity problem. Restrictions such as split horizon address parts of that failure without turning the protocol into a complete topology database.

The Bellman-Ford intuition is to compare each neighbour's advertised distance plus the cost of reaching that neighbour. The smallest permitted sum becomes the candidate distance. A stale advertisement can make a neighbour appear to offer progress that actually returns toward the same failed destination. The calculation therefore needs update and loop-handling rules as well as arithmetic.

### Link-state routing and OSPF

A link-state participant distributes information about its links, builds a view of the relevant topology and calculates paths from that graph. OSPF uses this family of reasoning, including scoped organization of its information. Dijkstra's shortest-path calculation operates on the declared graph costs, not on every Internet provider's business policy.

@fig cn_protocols | Protocol families exchange different evidence. Orange marks BGP's path and policy model, which cannot be reduced to the same shortest-path objective.

### Path-vector routing and BGP

BGP connects autonomous systems. Its AS path helps expose advertised administrative paths and detect certain loops, while route selection follows policy and other attributes. A provider route, peer route and customer route can have different preferences even when one path appears physically shorter. Geography alone therefore cannot predict Internet forwarding.

An autonomous system number identifies an administrative routing participant. Peering commonly exchanges agreed reachability between networks, while transit provides broader reachability under a provider relationship. These relationships inform which routes may be advertised or preferred. An AS path records administrative traversal rather than counting every physical router.

Convergence takes communication and processing, and participants can temporarily use inconsistent information during change. A route advertisement is also an assertion that needs operational validation; a leaked or mistaken advertisement can redirect traffic without a cable failing. The data path can break while protocol sessions remain alive. In an interview, explain what state the protocol exchanges, how an invalid old route is replaced and what the forwarding plane may do before convergence finishes.

## 22. ICMP, ping and traceroute

The browser receives no response, but that observation does not reveal whether a router, firewall or application caused the failure. **ICMP** carries network control information associated with IP delivery. Echo, destination-unreachable and time-exceeded messages expose particular observations without becoming a universal network health proof.

### Echo request and ping

Ping sends Echo Request and measures returned Echo Reply evidence. It tests the chosen destination's response to that probe under the path's filtering and rate limits. A returned echo does not prove a TCP listener, valid TLS certificate or permitted HTTP resource. An absent echo can also result from policy rather than an absent destination.

@fig cn_icmp | Echo and Time Exceeded report different conditions. Orange marks the first echo probe; its result tests one control-message exchange rather than the whole web request.

### Why traceroute works

Traceroute varies the probe's hop budget. A probe beginning with TTL 1 expires at the first forwarding router; the next begins with TTL 2 and can expose the next router. A responding router returns Time Exceeded, and the measurement records elapsed time and responder information. The destination's terminal response depends on the probe protocol and policy.

The displayed hops need not describe every later application packet. Different flows can select different paths, replies can take another route, and routers may rate-limit or suppress control responses. A silent intermediate hop followed by a responding later hop demonstrates that silence did not necessarily mean forwarding stopped there.

### Unreachable messages and packet-size feedback

Control messages can report a missing route, a rejected destination or an oversized packet under the relevant protocol. They may include enough original-packet information for the sender to associate the failure with its traffic. Filtering them indiscriminately can remove evidence needed for path MTU handling. The interview answer should state the probe's exact promise, compare it with the failing application operation and choose the next measurement that tests the remaining boundary.

:::interview Interview lens
**"Ping works but HTTPS fails. What does that tell you?"** The host returned the chosen echo probe under the measured path and policy. I still need to inspect TCP connection setup, TLS authentication and the HTTP operation. I also check whether packet sizing or family-specific routing makes the application's path differ from the probe.
:::

:::key In one breath
DHCP supplies configuration, while NAT maintains a separate tuple-translation boundary. IPv4 and IPv6 carry addressed packets with forwarding limits and distinct sizing rules. Longest-prefix matching selects a forwarding entry, and routing protocols supply changing reachability evidence. ICMP exposes particular network observations without proving transport or application success.
:::

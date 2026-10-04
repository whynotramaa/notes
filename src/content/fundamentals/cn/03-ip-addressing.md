@part III | VLANs and IP addressing | Local delivery needs a clear broadcast boundary and a way to decide whether a destination is local. A plausible address is not enough when the mask, VLAN and gateway disagree. We will divide local broadcasts, resolve the next-hop interface and compute the prefixes that define Finch's address scope. | where:3

## 11. VLANs, access ports and trunks

Engineering and finance share a physical switch, but a finance broadcast should not appear on engineering hosts. A **VLAN** assigns frames to a logical local forwarding domain. The switch considers VLAN membership as well as MAC identity when learning and forwarding, so a shared chassis can contain separate broadcast domains.

An access port associates ordinary endpoint frames with its configured VLAN. A trunk carries several VLANs between devices and identifies them using the configured tagging rules. In the illustrative setup, VLAN 10 contains engineering and VLAN 20 contains finance. A broadcast received from engineering is forwarded only through eligible engineering ports and trunks, rather than every physical connector.

@fig cn_vlan | Access ports attach hosts to a domain, while a tagged trunk carries domains between devices. Orange marks VLAN 10, whose broadcasts must stay within its membership.

The 802.1Q tag adds the declared four bytes to the example frame:

$$F_{tagged}=1518+4=1522\text{ bytes}.$$

Read the tagged count as the existing untagged frame plus its VLAN field. It does not allocate another IP payload allowance. The endpoints on access ports need not see the same tagged representation used between switches, because the forwarding device can add or remove the tag at that boundary.

### Inter-VLAN routing and native VLANs

Communication between the domains requires routing, often through a router interface or a switch with routing functions. That boundary can apply policy between the address spaces. A trunk's untagged or native-VLAN convention must agree at both ends; a mismatch can place traffic in an unintended domain or make replies disappear.

A VLAN supplies traffic separation under the switching configuration, not encryption or proof that a host is trusted. Incorrect membership, an exposed trunk or permissive inter-VLAN policy can undo the intended separation. The interview answer should trace the ingress classification, allowed egress ports and routing boundary, then state where policy and authentication are applied. The VLAN number alone does not provide that complete argument.

:::story Picture this
Two departments use the same parcel-sorting room but have separate marked trays. A parcel arriving at an ordinary desk enters that department's tray, while a cart between rooms carries labels for several trays. Moving a parcel to another department requires the transfer desk. The trays are VLANs, the labelled cart is a trunk and the transfer desk is the routing boundary.
:::

## 12. ARP and next-hop resolution

Finch knows the server address `203.0.113.20`, but the first Ethernet destination must be the gateway interface. The local route says that the server is outside `192.168.10.64/26`. **ARP** resolves an IPv4 next-hop address to a link address inside the local broadcast domain. It does not discover the remote server's MAC across Internet routers.

Finch first consults its neighbour cache. With no usable entry, it broadcasts a request asking who owns `192.168.10.65` on this local domain. The gateway replies with its interface address, and Finch records that evidence. It then sends a unicast frame addressed to the gateway MAC while the carried IP packet still names the remote server.

@fig cn_arp | Finch asks for its gateway because the server is outside the local prefix. Orange marks the request sent on the LAN; the reply supplies the next-hop MAC for the cache.

### Cache lifetime and stale neighbours

Caching avoids another broadcast for each packet, but the mapping can become stale after an interface replacement or address move. The host must refresh or invalidate it under its neighbour policy. If the old MAC remains cached, packets can leave through the correct route yet reach the wrong local interface. A route-table inspection alone will miss that failure.

ARP also lacks an authentication guarantee for these assertions. A malicious host can claim a mapping and redirect traffic under a susceptible local configuration. That is a local delivery attack, not evidence that the DNS answer or server certificate changed. Network controls and end-to-end authentication protect different boundaries.

The worked address comparison returns to Section 13's mask. Finch and `.65` share the `.64/26` network; the server does not. A local destination would require that destination's MAC, while a remote destination requires the selected gateway's MAC. IPv6 uses Neighbor Discovery rather than ARP, but it still needs to connect a next-hop decision with a neighbouring interface. That separation is the reusable mechanism, even when the discovery messages change.

:::warn Watch out
ARP asks about the selected IPv4 next hop on the local link. Broadcasting for a remote server's interface does not make a router relay that request across the Internet. Choose the route first, then resolve the neighbour required by that route.
:::

## 13. IPv4 addresses, masks and CIDR

Finch has `192.168.10.70`, but that address alone does not identify which neighbours are local. **CIDR** attaches a prefix length to an address block. A prefix length counts network bits, while the remaining bits select positions inside the block. The corresponding mask has set network bits and clear host bits.

For the declared `/26`, the mask is `255.255.255.192`. The last client octet is `01000110` in binary, and the mask's last octet is `11000000`. Their bitwise AND is `01000000`, or decimal 64, giving network `192.168.10.64`. This operation finds the block; it does not query another machine.

@fig cn_ipv4 | Applying the `/26` prefix places Finch inside the `.64` block. Orange marks the client's address between the network and broadcast boundaries.

The address count follows directly from the remaining bits:

$$A=2^{32-26}=64,\qquad H=64-2=62.$$

Read A as total addresses and H as ordinary assignable hosts under this IPv4 subnet convention. The block ends at `192.168.10.127`; ordinary hosts run from `.65` through `.126`. Finch at `.70` and its gateway at `.65` are therefore inside the same prefix. The server address lies outside it and uses a gateway route.

### Network, host and broadcast addresses

The network address identifies the block, and the all-host-bits-set address is its directed broadcast under this model. A `/32` names one address rather than applying the ordinary subtract-two rule. Point-to-point `/31` operation also has a special convention, which the next section distinguishes from the general table.

A wrong prefix can make Finch ARP for a destination that actually requires a router, or send a truly local destination through the gateway. Either error changes the first delivery decision before transport begins. [The CIDR specification](https://www.rfc-editor.org/rfc/rfc4632.html) describes explicit prefix lengths that replaced class-based assumptions. The operational lesson is to inspect address, prefix and route together rather than infer a mask from the address's first octet.

:::note Prefix length is part of the address plan
The same host-looking address under different masks can produce different local-delivery decisions. A DNS response supplies an address, but the client's interface configuration and routes determine whether that destination is local. Never infer a remote host's subnet from its address text alone.
:::

## 14. Subnetting, VLSM and aggregation

An office needs the declared 62 ordinary host positions. Assigning the whole `/24` would give it 254 ordinary positions under the same convention, while `/26` supplies exactly 62. **Subnetting** divides a prefix into smaller aligned blocks. **VLSM**, or variable-length subnet masking, permits different block sizes for groups with different requirements.

The supplied address counts are powers of two. `/25` has 128 total addresses, `/26` has 64, `/27` has 32 and `/28` has 16. Under the ordinary network-and-broadcast convention, those give 126, 62, 30 and 14 hosts. Each added prefix bit halves the block, but the two excluded boundary addresses make host counts decrease differently from a simple halving.

@fig cn_subnet | Increasing prefix length reduces the address block. Orange marks the `/26` row with 64 addresses and 62 ordinary hosts; special point-to-point conventions require separate treatment.

### Allocation alignment and special prefixes

The block `192.168.10.64/26` begins at the required 64-address boundary. Starting the same prefix at `.70` does not create another aligned block with `.70` as its network. Assigning this `/26` consumes 64 of the `/24`'s 256 addresses, leaving $256-64=192$ outside it. Those remaining addresses are not automatically one aligned replacement prefix.

A `/30` supplies four addresses and two ordinary hosts in the table's model. A point-to-point `/31` can use both positions under its dedicated rule; ordinary subtraction would give zero, while the figure shows its special point-to-point capacity. A `/32` is a host route. [The point-to-point rule](https://www.rfc-editor.org/rfc/rfc3021.html) names that exception explicitly.

### Supernetting and route aggregation

Aggregation combines aligned adjacent prefixes into a shorter advertisement. The blocks `.0/26` and `.64/26` combine into `192.168.10.0/25`. Merely advertising a wider prefix also claims addresses in that wider block, so the advertising network must have appropriate reachability or disposal policy for them. Aggregation reduces routing detail at the cost of hiding distinctions. In an interview, show the aligned binary boundary and explain what happens to an address inside the aggregate but outside an actually reachable child prefix.

## 15. Public, private and special address scope

Finch's private address cannot serve as an ordinary global route back from the remote server. Private ranges reserve addresses for administrative networks, allowing independent organizations to reuse them. **Address scope** states where an address is meaningful; it does not establish the host's identity or trustworthiness.

The private IPv4 blocks are `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`. A gateway can translate Finch's outgoing source into an address usable on its external path. In this chapter, `198.51.100.7` plays that external role and `203.0.113.20` plays the server role. Both come from documentation ranges, so the example does not claim they are reachable production Internet endpoints.

@fig cn_public_private | Address scopes serve different purposes. Orange marks private addressing, whose reuse needs an explicit boundary before the modeled external path.

### Loopback, link-local, unspecified and broadcast

Loopback reaches the same host's protocol stack rather than another machine. IPv4 `127.0.0.1` is the familiar example. Link-local configuration supports communication on one local link and is not a substitute for an Internet route. The unspecified address `0.0.0.0` has context-dependent uses, including an unconfigured source or a wildcard local bind. A broadcast address targets the relevant local IPv4 domain under its forwarding policy.

A server bound to `0.0.0.0` can accept traffic addressed to its local interfaces, subject to firewall and other policy. It does not own every possible destination address. A browser trying that value as a remote URL has not supplied a useful global server identity.

The security mistake is treating private addressing as authorization. An attacker or compromised service inside the private network can still reach permitted internal paths. Conversely, a public address does not imply every port is open. The address plan, route table, translation state, firewall and application permission each make a separate decision. Trace them separately when a packet reaches the gateway but the request still fails.

:::interview Interview lens
**"Does a private IP address make a service secure?"** It limits ordinary address reachability under the network's routing arrangement. It does not authenticate a caller or define what an internal host may do. I still need routing and firewall policy, then application authentication and authorization for the operation.
:::

:::key In one breath
VLAN membership bounds local broadcasts, while ARP resolves the neighbour chosen by an IPv4 route. CIDR combines an address with a prefix so Finch can distinguish local and remote destinations. Subnetting divides aligned blocks and aggregation advertises them under a wider valid prefix. Private and special addresses have defined scopes, which do not replace security or application identity.
:::

@part II | Data link and Ethernet switching | A link must deliver a bounded frame before a router can inspect its packet. Missing boundaries, damaged bits and mistaken interface identities can each break delivery before the application participates. We will construct a frame, distinguish local addresses, compute an error check and follow Ethernet forwarding through a switch. | where:2

## 5. Data link framing and medium access

Finch's receiver observes a stream of symbols and needs to know which bytes belong to the next packet. The **data link layer** supplies a bounded transfer unit between neighbouring interfaces. Its frame carries local delivery information and error-detection information around the network packet. Different links choose different ways to establish the frame boundary and share the medium.

### Framing, headers and payload

An Ethernet frame names destination and source interfaces, identifies the carried protocol and ends with a frame check sequence. The preamble helps receivers synchronize before the frame itself. Length fields, delimiter patterns or fixed formats let other link protocols find boundaries. If a delimiter can appear inside data, the format needs an escaping or coding rule so payload bytes cannot masquerade as a boundary.

@fig cn_frame | A local frame surrounds its packet with synchronization, addressing and checking information. Orange marks the packet payload, which the next router extracts before building another frame.

The declared untagged Ethernet layout uses 14 header bytes, a 1,500-byte IP packet and four frame-check bytes:

$$F=14+1500+4=1518\text{ bytes}.$$

Read F as the frame count under this convention, excluding preamble and the gap between transmissions. The 1,500-byte IP allowance is the link MTU, not the entire frame count. [The Ethernet IP encapsulation specification](https://www.rfc-editor.org/rfc/inline-errata/rfc894.html) defines that distinction with its published errata.

### Flow control and medium access control

Link flow control can stop a neighbour from overwhelming its receiver. Medium access control decides who may transmit when several stations share a channel. Neither function is the same as TCP's end-to-end control. Ethernet pause signalling, where configured, can spread waiting to unrelated traffic sharing the paused link; a successful local pause does not prove an application made progress.

The failure case is a receiver that accepts the frame boundary but rejects its check. It discards the damaged frame rather than supplying partial payload to IP. Higher layers may recover the lost data, but a link cannot assume that every carried protocol has a retransmission mechanism. Specify which layer repairs loss when explaining the complete request.

:::story Picture this
A depot puts a parcel inside a local envelope marked for the next depot. That depot removes the envelope, checks its seal and places the parcel inside a new envelope for the next journey. The parcel is the IP packet, the envelope is the frame and the seal check detects damage on that journey. The envelope's destination does not identify the parcel's final recipient.
:::

## 6. MAC addresses, unicast and broadcast

Finch knows the remote server's IP, but its Ethernet frame needs the local gateway's interface identity. A **MAC address** is the link identifier carried by this frame. Ethernet's address field has 48 bits, or $48/8=6$ octets. Its scope is local forwarding; it is not a global route to the web server or a trustworthy user identity.

Unicast names one interface. Multicast names a selected group under the link's delivery rules. Broadcast addresses all eligible interfaces in the broadcast domain. A router normally ends that local broadcast reach, while switches extend it within the selected VLAN. A switch receiving an unknown unicast can also flood it, but that forwarding action does not change the frame's destination into a broadcast address.

@fig cn_mac | Delivery can name one interface, a group or every local listener. Orange marks broadcast, whose reach stays inside the local broadcast domain.

For the running request, source MAC belongs to Finch and destination MAC belongs to the gateway. The IP destination still names `203.0.113.20`. At the next routed link, the gateway supplies different local MAC fields. This is why a captured frame can name a nearby interface while carrying a packet destined for a distant machine.

A virtual interface can acquire a new address when recreated, and an administrative configuration can override an address. Duplicate addresses on the same learning domain make the switch's location change between ports. A MAC therefore does not prove the owner's identity, durability or permission. Authorization belongs to a higher-layer contract.

The interview distinction is between a MAC table, a route table and an application session. The MAC table finds a local forwarding port; the route table finds a next hop for an IP prefix; the session supplies the caller's application state. Changing one does not necessarily invalidate the others, though their operational state must agree well enough for the request to reach its destination.

## 7. Error detection, checksum and CRC

Noise flips bits in Finch's frame without necessarily changing its length. **Error detection** adds redundant information that lets the receiver reject specified patterns of alteration. **Error correction** supplies enough redundancy and a decoding rule to reconstruct some damaged messages. Detecting that a frame is wrong is a weaker job than recovering its original payload.

Parity makes the number of set bits even or odd; it detects an odd number of flips but can miss an even number. A checksum combines words under its declared arithmetic. A **CRC**, or cyclic redundancy check, divides a binary polynomial by a chosen generator using XOR instead of ordinary subtraction. The receiver repeats the check under the same generator.

@fig cn_errors | Parity, checksum and CRC retain different check information. Orange marks polynomial division; none of these public checks supplies sender authentication.

### Worked polynomial division

The declared data is `1101`, the generator is `1011`, and the generator's degree requires three appended zeroes. Divide `1101000` using XOR. The successive working strings are `0110000`, `0011100`, `0001010` and `0000001`. The last three positions give remainder `001`, so the transmitted codeword is `1101001`.

@fig cn_crc | Illustrative data `1101` uses generator `1011` and remainder `001`. Orange marks the receiver's zero remainder after dividing the transmitted codeword `1101001`.

Read polynomial remainder as the part left after cancelling every permitted leading generator term. Dividing the transmitted codeword produces `000`, which is the expected remainder for this teaching code. These steps are asserted in `scripts/fundamentals/cn-early-numbers.py`; swapping the data and generator changes the problem.

A valid remainder is not proof that the frame is the intended message. Some altered patterns share the check, and an attacker can recompute a public CRC after changing data. A link check protects an accidental-corruption boundary, while TLS authentication protects a different adversarial boundary. The actual Ethernet check uses its standardized generator rather than this small teaching polynomial.

:::interview Interview lens
**"Why does a valid CRC not authenticate the sender?"** The receiver checks a public relation between the data and its remainder. An attacker who changes the data can compute another valid remainder. A secret-key authentication code or a signature makes a different promise because the attacker cannot produce the required evidence without the protected key.
:::

## 8. Ethernet, CSMA/CD and duplex

Finch can transmit and receive on its switched host link at the same time. A description that says every Ethernet sender waits for collisions would give the wrong mechanism for this connection. **Ethernet** names a family of link technologies standardized through IEEE 802.3, including frame and interface rules across different media and speeds.

### Ethernet frame structure

Destination MAC, source MAC, EtherType, payload and frame check sequence give the receiver local delivery and integrity information. The declared 1,518-byte count includes the frame check but excludes synchronization and idle-gap costs. Adding the declared VLAN tag makes $1518+4=1522$ bytes. Real frame budgets must also consider configured encapsulation and link capability.

### Broadcast and collision domains

A broadcast domain describes which interfaces receive a local broadcast. A collision domain describes stations sharing a medium on which simultaneous transmissions interfere. Those sets need not match. Separate full-duplex switch ports can belong to the same VLAN broadcast domain without competing for one shared host-to-switch wire.

@fig cn_ethernet | Broadcast reach and collision behaviour are separate boundaries. Orange marks full duplex, which supports simultaneous directions on the switched host link.

### CSMA/CD and full-duplex Ethernet

Historical shared Ethernet used carrier-sense multiple access with collision detection, or CSMA/CD. A sender listened, transmitted on an apparently idle medium, detected a collision and retried after randomized backoff. Detecting a collision required a shared-medium timing model. A full-duplex point-to-point link does not run that collision procedure.

The remaining failure modes include damaged frames, exhausted buffers and incorrect link configuration. Full duplex removes shared-medium collisions, not every source of loss or waiting. The switch may receive traffic faster than an egress link can drain it even when every cable is healthy. In an interview, distinguish the medium's access rule from the switch's queueing and the higher layer's recovery rule before claiming that Ethernet cannot lose packets.

:::note Frame length and IP MTU
The declared 1,500-byte MTU concerns the IP packet carried inside the frame. Its Ethernet wrapper makes the untagged frame 1,518 bytes under the chapter's counting convention. Preamble, inter-frame gap and additional wrappers belong to separate wire-cost accounting.
:::

## 9. Hubs, bridges, switches and routers

An unknown destination arrives at a device in Finch's office. What happens depends on which information the device interprets. A hub repeats received signals across its other ports. A bridge joins link segments while learning interface locations. A **switch** performs local frame forwarding, while a **router** selects an IP next hop and creates an appropriate outgoing link wrapper.

The distinction is easiest to see in the running request. Finch's switch sees the gateway MAC and chooses its port. The gateway removes the Ethernet frame, sees remote IP `203.0.113.20`, selects a route and forwards through another interface. It does not forward globally by that remote server's MAC, because the server is outside the local link.

@fig cn_devices | The devices interpret different evidence. Orange marks the router's IP decision, which connects Finch's local link to the remote path.

A gateway is a boundary role rather than one universal device type. The same appliance can include an Ethernet switch, IP router, address translator, firewall, DHCP service and radio access point. A product advertised as a switch can also route. Asking which feature is active avoids arguing about the label on the chassis.

Repeating a signal can expose traffic and extend shared-medium contention. Learning a MAC location narrows known-unicast delivery but requires changing local state. Routing introduces prefix selection, hop limits and a new broadcast boundary. None of those operations establishes that the destination application authorized Finch or produced a correct response.

The failure trace follows the interpreted table. If the switch has the wrong port, inspect MAC learning and VLAN membership. If the router lacks a route, inspect the destination prefix and next hop. If forwarding succeeds but the server refuses the request, continue upward to transport and application evidence. This division connects the layer model from Part I to actual devices instead of treating layers as a memorized list.

## 10. Switching, learning and flooding

Finch sends a frame with source MAC A through switch port 1. The switch learns `A → 1` from the source before deciding where to send the destination. A **MAC table**, often implemented through content-addressable memory, maps an interface address and VLAN to its learned local port. Learning from the destination would record a location the frame never demonstrated.

If destination B is known on port 2, the switch forwards through that eligible port. If B is unknown, the switch floods through eligible ports in the same VLAN, excluding port 1 where the frame arrived. When B replies, its source supplies the missing location. Subsequent known-unicast frames can then take the narrower path.

@fig cn_switch | Source learning updates local state before destination lookup. Orange marks the lookup that chooses known-unicast forwarding or eligible-port flooding.

### Filtering, forwarding and ageing

Filtering prevents a frame from leaving through a port that should not carry it. Forwarding chooses a known destination path. Flooding distributes an unknown destination within its permitted domain. Entries age out because silent interfaces can move or disappear; observing another source frame refreshes the evidence.

When Finch moves from port 1 to port 3, the next source frame updates its location. Before that update, a cached entry can direct traffic to the old port. Duplicate source addresses can repeatedly replace one another, producing intermittent failures that resemble packet loss elsewhere. Look for the changing local mapping before changing the server.

Learning alone also cannot make an arbitrary looped topology safe. A broadcast can circulate through redundant links without reaching an IP router that would decrement TTL, because switches are forwarding frames inside one link domain. Loop prevention or a deliberately controlled fabric supplies that missing rule. A switch table reduces routine fan-out, but it does not prove a safe physical topology or a correct remote route.

:::warn Watch out
A switch learns the source's arrival port, then looks up the destination. Unknown-unicast flooding stays within eligible ports of the relevant VLAN and excludes the ingress port. It does not mean broadcast delivery across the Internet.
:::

:::key In one breath
Frames delimit a local transfer and separate their wrapper from the carried IP packet. MAC fields identify local interfaces, while checks detect corruption under a declared code. Full-duplex Ethernet differs from historical shared-medium collision handling. Switches learn source locations and forward or flood within the permitted local domain; routers make the next IP decision.
:::

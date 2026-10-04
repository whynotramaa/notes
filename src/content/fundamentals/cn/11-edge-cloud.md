@part XI | CDN, P2P and cloud networking | A packet path can be shortened by a nearby cache, complicated by a peer's NAT, or hidden inside a virtual network. Without distinguishing logical endpoints from physical forwarding, a cloud diagram can conceal the same link and routing constraints we already calculated. We will place cached objects at the edge, attempt direct peer paths, and follow virtual interfaces into cloud route tables. | where:11

## 49. CDN, edge caches and anycast

Finch asks for a static object already copied near its region. Sending every request to the origin would repeat long-distance traffic and make the origin handle every response. A **content delivery network**, or CDN, operates edge servers that can deliver eligible content closer to users. A **point of presence**, or PoP, is a site containing service infrastructure; the origin is the authoritative application or content source behind those caches.

On a cache hit, the edge returns a stored representation under its freshness policy. On a miss, it fetches from the origin, returns the result and may store a copy. A cache key can include host, path, query and selected variant headers. Omitting a meaningful variant risks incorrect or private content reaching another user. An edge cache is therefore an application correctness boundary as well as a capacity tool.

@fig cn_cdn | The hit path stops at the edge, while the miss path continues to the origin. Orange marks the stored object that removes origin traffic for an eligible request. | narrow

DNS-based steering can choose a service address for a user, while **anycast** advertises the same service address from several locations and lets routing choose a reachable instance. The selected instance is determined by routing and policy, not guaranteed geographic proximity. Changes in routing may change the serving location, so long-lived stateful connections need suitable deployment design.

Using the illustrative freshness example, a `300` second object lifetime with `120` seconds elapsed leaves `180` seconds of simple reuse allowance. Explicit invalidation attempts to remove copies earlier, but independently held caches do not all update instantaneously by definition. Versioned object names let a new representation have a distinct cache key instead.

[HTTP's caching rules](https://www.rfc-editor.org/rfc/rfc9111) govern reuse, while CDN routing is a further deployment policy. An interviewer should hear which bytes are cacheable, who owns their key and lifetime, and what a miss costs. A CDN can absorb public object traffic; it does not automatically cache personalized mutations safely.

:::story Picture this
A bakery distributes sealed loaves to neighborhood stalls. A stall hands over a fresh loaf without calling the bakery, while an empty stall orders another delivery. The sell-by label is freshness, the batch label is a versioned key, and a recall is invalidation; a recall announcement does not prove every customer discarded an older loaf.
:::

## 50. P2P, NAT traversal, STUN, TURN and ICE

Finch can start an outbound connection, but another private peer cannot simply address a new inbound packet to `192.168.10.70`. The private address has local scope and the gateway needs suitable translation state. **NAT traversal** discovers or creates a usable path between endpoints despite translation and filtering at those boundaries.

A **STUN** exchange lets a peer observe the public address and port visible to a server. It discovers a mapping, not a permanent globally reachable endpoint. That mapping can depend on destination and expire. **Hole punching** asks both peers to send toward discovered endpoints so their gateways may create compatible outbound state.

@fig cn_p2p | STUN reveals an observed mapping, direct checks test it, and TURN supplies a relay when the direct path fails. Orange marks the attempted peer path rather than assuming discovery proves reachability. | narrow

**TURN** supplies a relay endpoint when direct traffic cannot pass. **ICE** gathers candidate addresses, tests candidate pairs and selects a working path. It can consider local, discovered and relayed candidates rather than assuming one technique succeeds everywhere. Relaying spends service bandwidth and introduces another failure boundary, but it can provide connectivity under restrictive network policy.

Finch's illustrative public mapping is `198.51.100.7:40001`, restoring to `192.168.10.70:51000` for the original flow. A STUN server might observe a different mapping from another destination. That is why a discovered public tuple cannot be treated as a promise that any peer can contact it. Keep the discovery observation and the actual peer-connectivity test distinct.

[ICE's specification](https://www.rfc-editor.org/rfc/rfc8445) describes connectivity checks. Encryption and peer authentication remain necessary after a path succeeds; STUN does not authenticate the other application's identity. An interview answer should move through discovery, candidate tests, direct exchange if possible and relay fallback if needed. Peer-to-peer is a placement of application roles, not an exemption from firewalls or congestion control.

:::warn Watch out
A public endpoint learned from one exchange may not work for another peer. Test candidate paths and keep a relay fallback when the application requires connectivity across restrictive networks. A failed direct path is not proof the peers themselves are offline.
:::

## 51. Virtual NICs, bridges, VXLAN, SDN and NFV

Finch's server can appear attached to a logical network even when its next packet crosses several physical devices. A **virtual network interface** exposes a software endpoint with interface semantics. A bridge forwards link-layer traffic between attached interfaces. An **overlay network** places a logical packet path above another network, the **underlay**, by encapsulating its traffic.

A VLAN partitions broadcast membership within link infrastructure. VXLAN carries a logical Ethernet frame inside an outer packet so a virtual link can span an IP underlay. The outer route reaches a tunnel endpoint; the inner addresses identify the logical endpoints. A packet capture at one layer can therefore show different addresses from a capture at another without either being wrong.

@fig cn_virtual | The overlay retains inner tenant addressing while the underlay forwards an outer packet between tunnel endpoints. Orange marks the outer IP route through the underlay, separate from the logical tenant link. | narrow

### SDN

**Software-defined networking**, or SDN, makes forwarding control programmable through a separation between control decisions and packet handling. A controller or control system programs forwarding behavior; the data plane applies it. Removing a controller need not stop every packet immediately if forwarding state already exists, but new decisions and convergence can fail according to the deployment.

### NFV

**Network function virtualization**, or NFV, implements functions such as firewalls or load balancers in software on computing infrastructure instead of requiring a dedicated appliance for each function. It describes where the function runs. SDN describes how forwarding is controlled, so the terms are related but not interchangeable.

Finch's original `1,500` byte packet requires additional outer bytes in an overlay. [VXLAN's specification](https://www.rfc-editor.org/rfc/rfc7348) defines that wrapping; effective MTU planning must account for it. Virtual isolation also needs an enforced membership and policy boundary, not merely different interface names. The useful diagram shows inner endpoints, tunnel endpoints and the underlay route separately, then identifies which table or control system chooses each.

:::note Overlay diagnosis
Inspect the host namespace, virtual interface, bridge and tunnel endpoints separately. A valid inner route cannot repair an unreachable outer endpoint, while a healthy underlay cannot prove that tenant policy allows the inner frame.
:::

## 52. Docker namespaces, port mapping and cloud routes

A process inside a container can bind a port without making that port reachable from Finch's browser. A **network namespace** gives a process group its own interfaces, routes and related network state. A container bridge setup commonly connects a namespace interface to a host bridge through a virtual interface pair, then uses host routing and any configured translation to reach external networks.

A published port creates a configured path from a host address and port to a container endpoint. It is distinct from merely declaring what port the application expects. Binding only to the container's loopback interface can prevent traffic arriving through its other interface from reaching that listener. Names, routes, firewall rules and actual binding must agree.

@fig cn_cloud | A container's virtual interface reaches host forwarding before cloud routing and policy apply. Orange marks the VPC boundary, whose routes and security policy must allow the flow. | narrow

Service-to-service traffic uses the intended network membership and service discovery rather than assuming a host-published port is always necessary. [Docker's networking documentation](https://docs.docker.com/engine/network/) describes its drivers and network behavior; exact defaults depend on the chosen driver and installation, so this trace states its bridge assumption.

A **virtual private cloud**, or VPC, defines an administratively isolated logical network. Subnets define address segments, route tables choose next hops, an internet gateway provides an Internet-routing boundary, and a NAT gateway commonly supplies outbound translation for private endpoints. A **security group** expresses resource-associated traffic rules under the cloud provider's semantics. A subnet's label alone does not prove it is publicly reachable.

Finch already belongs to `192.168.10.64/26`, with `62` ordinary host addresses. Moving that addressing pattern into a cloud diagram does not change longest-prefix matching or the need for a return path. Some cloud platforms reserve additional addresses, so the ordinary IPv4 count is not their allocatable-host count. Diagnose a cloud flow through namespace binding, local bridge, host policy, subnet route, gateway and return policy in order.

:::interview Interview lens
**"Why is a container port unreachable even though the process is listening?"** I identify its namespace and the address it bound, then inspect the path from the caller to that namespace. A host mapping, route or firewall rule may be absent, or the listener may be on loopback only. In cloud deployments the subnet and resource policy add further boundaries. Listening is local state, while reachability requires the complete forward and return path.
:::

:::key In one breath
A CDN returns eligible bytes near users and needs explicit cache keys and lifetimes. NAT traversal tests candidate peer paths and falls back to relays when direct delivery fails. Virtual interfaces and overlays retain the same forwarding obligations while adding control and encapsulation boundaries. Containers and cloud routes require explicit namespace, binding, translation and policy decisions before a public request can reach a listener.
:::

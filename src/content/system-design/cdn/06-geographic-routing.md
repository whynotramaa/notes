@part VI | Geographic routing | We select a serving site through network and service policy rather than assuming the closest dot on a map always wins. Routing and cache placement affect each other during normal traffic and failures. We will compare DNS selection and anycast, trace redirects, and keep regional origin ownership explicit. | where:6

## 21. DNS-based site selection
A viewer asks for Heron's delivery hostname. The provider can answer DNS according to policy informed by network, geography, health, and capacity. **Geographic routing** chooses a serving destination using location-related information together with the actual policy constraints.

The resolver's location may differ from the viewer's, and answers can be cached. A changed DNS answer does not move an established connection immediately. The selected site may be near in a map but slower through the actual network, so latency and reachability evidence should influence design rather than geographic distance alone.

@fig sd_cdn_dnsgeo | DNS-based destination selection. Resolver vantage, answer lifetime, and existing connections affect observed routing.

A service can also redirect at HTTP after more information becomes available, at the cost of another exchange and an updated URL or host. These mechanisms are product-dependent and can coexist. Explain which decision selects the edge, which selects origin, and when each can change.

:::story Picture this
A travel office chooses a station using the address it knows, while the road network decides the route to that station. The nearest station on a map may not have the shortest usable journey. An old ticket can also keep someone traveling toward a station after policy changes.
:::
## 22. Anycast follows routing decisions
With **anycast**, the same service address can be announced from multiple network locations and routing directs traffic toward one reachable announcement. Network path policy influences the chosen site. It does not guarantee the smallest geographic distance or fastest application response.

[RFC 4786](https://www.rfc-editor.org/rfc/rfc4786) discusses operational anycast behavior and stateful-service considerations. A route change can affect where later packets go, so connection and service designs must handle their actual continuity model. A CDN's transport termination and routing controls need product-specific verification.

@fig sd_cdn_anycast | Anycast concept. Network policy selects a route; the drawing does not imply nearest-geographic or lowest-latency selection.

Do not confuse anycast destination selection with the application load balancer behind the selected site. The edge may still distribute connections among local servers and fetch from a separate regional origin. Those are additional decisions using different available information and failure boundaries.

:::warn Watch out
Saying anycast always sends a viewer to the geographically nearest site is too strong. Route policy, reachability, and provider control can choose a different site. Measure the actual path and service outcome.
:::
## 23. Route health and cold failover
A delivery site fails, so new viewers are sent elsewhere. The replacement site's cache may be cold for that audience's keys. Geographic failover therefore changes origin demand and first-read latency even when the replacement has enough edge bandwidth.

The illustrative equal-size model with 95% hits sent 50 requests per second to origin. If all 1,000 viewer requests miss after a cold transition, original source demand becomes 1,000, a factor of 20 of the warm miss rate. Request collapsing, shielding, and bounded stale service may reduce it under their declared rules.

@fig sd_cdn_coldroute | Illustrative cold-route stress case. It excludes reuse acquired during the transition and extra retries.

Health information can be stale or incomplete. Test partial failure, high latency, unreachable origins, and capacity saturation rather than only a fully dead site. The reliability unit's warning about removing capacity applies here too: an over-sensitive health rule can shift load into another overloaded region.

:::note Origin choice is separate
The selected edge can fetch from a fixed origin or a product-supported regional origin policy. That choice must respect data residency, object availability, and write ownership. A local edge does not imply the source state is local or independently writable.
:::
## 24. Residency, latency, and state ownership
Heron may allow global playback of published immutable clips while score writes remain under one authoritative region or per-match owner. Edge delivery reduces some retrieval distance without moving write authority. Cached score reads need the declared freshness rule because a nearby answer can still be old.

Under an illustrative latency mixture, 90% hits at 20 milliseconds and 10% misses at 200 produce a weighted mean of 38 milliseconds. Multiply 0.9 by 20 to get 18 and 0.1 by 200 to get 20, then add. This mean does not establish a tail percentile or the worst viewer's experience.

@fig sd_cdn_latency | Illustrative two-class latency model. Geography, setup, and origin queues can change both classes.

Compare geographic coverage, connection setup, delivery bandwidth, origin capacity, and consistency policy separately. The fastest nearby edge cannot serve absent or unauthorized content. A convincing interview design tells the reader which layer handles each of those constraints.

:::interview Interview lens
**"How does geographic routing improve this service?"** It selects a usable serving site based on the provider's network and service policy. DNS caching and anycast route behavior affect when selection changes, while cold replacement caches affect origin load. I keep immutable delivery, data residency, and authoritative writes as separate decisions.
:::
:::key In one breath
Geographic delivery combines network routing with service policy and cached state. DNS selection can reflect resolver vantage and persist through cached answers, while anycast follows network route choices. A routing failover can create a cold-cache origin surge. Nearby delivery does not relocate write authority or establish a tail-latency or freshness guarantee.
:::

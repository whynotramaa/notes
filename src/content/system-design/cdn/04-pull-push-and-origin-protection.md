@part IV | Pull vs push CDN and shielding | We decide how content reaches a cache and how many simultaneous misses the source can absorb. Fetching on demand avoids unused copies, while prepositioning can prepare hot content at a cost. We will compare pull and push, collapse requests, add shielding, and survive a cold-cache event. | where:4

## 13. Pull CDN fetches on demand
A **pull CDN** obtains content from origin when a requested reusable identity is not available on its serving path. Content selection follows real demand, so an object that nobody requests at a site need not be transferred there. The first reader pays the miss path and may wait for origin.

In an illustrative example, a 5,000,000-byte object is requested at two of four candidate edge sites. One fetch at each requested site transfers 10,000,000 origin bytes before shielding or eviction. A scheme that sends it to all four sites transfers 20,000,000 bytes even if two never serve it.

@fig sd_cdn_pull | Illustrative placement only. Product hierarchies, eviction, and request collapsing can change actual origin transfer.

Pull is not a guarantee that the origin sees only one fetch per key forever. Multiple sites, variants, expired entries, evictions, retries, and partial-content behavior can create further source work. Count those causes when designing origin capacity rather than multiplying only unique published objects.

:::story Picture this
A bookstore orders a title when a customer asks for it, instead of receiving every title automatically. It avoids unused stock, but the first customer may wait. Several bookstores can still each place their own first order.
:::
## 14. Push placement and prewarming
A **push CDN** or explicit prepositioning workflow moves selected content into delivery storage before viewer demand. Specific products use different publishing and distribution interfaces, so describe the actual operation rather than treating push as one universal API.

Prewarming a pull path requests selected identities before the event. It can reduce early misses, but it consumes transfer and may not populate every intended site because routing decides where the warmup goes. Content may also be evicted before the real audience arrives. Verify placement and readiness through the product's supported controls.

@fig sd_cdn_push | Push or prewarming concept. Selection and observed placement matter more than assuming all sites are warm.

For Heron, hot manifests, common thumbnails, and popular renditions can be candidates after their identities are final. Warming content before verification risks distributing the wrong bytes. Warming private content does not grant access; signed or other edge checks still apply on each viewer request.

:::warn Watch out
A warmup request routed to one edge is not proof that another audience's edge has the object. Inspect actual distribution behavior and avoid claiming global warmth from one successful test.
:::
## 15. Request collapsing handles concurrent misses
Many viewers reach an empty edge for the same immutable segment. Without coordination, every request can independently fetch origin. **Request collapsing** lets concurrent equivalent requests share one in-flight fetch under the cache's supported rules.

Use an illustrative audience of 50,000 viewers spread evenly across 100 edges. There are 500 viewers per edge. If all request the same cold segment together, the naive model sends 50,000 origin fetches. Perfect per-edge collapsing sends 100, a factor of 500 fewer for this one equivalent-key burst.

@fig sd_cdn_collapse | Ideal equivalent-key collapse model. Different ranges, variants, policies, or product behavior can prevent sharing.

@fig sd_cdn_inflight | In-flight state concept. Waiter count, buffering, cancellation, and origin deadline still need bounds.

Collapsed waiters can still hold memory and sockets. If the origin fails, a single fetch failure can affect many viewers at once. Bound the shared fetch, give waiters deadlines, and use a permitted stale representation when policy allows. The mechanism reduces duplicate source work, not every failure consequence.

:::note Equivalence is mandatory
Only requests eligible for the same representation and access handling can share the result. Do not collapse personalized or incompatible range responses merely because their paths match.
:::
## 16. Shielding and cold-cache failover
An **origin shield** is an additional cache or aggregation layer between many delivery sites and origin. It can share retained responses and in-flight fetches across edge sites. Its own availability, placement, latency, and key rules become part of the path.

Under the same ideal single-rendition example, 100 edges fetching one new segment every 6 seconds create 100 divided by 6, or 16.666666 recurring requests per second toward the next layer. A perfect shared shield needing one fetch per segment sends 1 divided by 6, or 0.166666 recurring requests per second to origin. These are deliberately idealized counts, not product performance guarantees.

@fig sd_cdn_shield | Shield concept. The shield adds a required serving dependency unless an explicitly bounded bypass exists.

@fig sd_cdn_shieldcount | Ideal one-rendition synchronized segment model. Protocol, variants, retries, and retention are excluded.

A CDN or shield outage can redirect cold traffic to another path. That fallback must fit origin capacity or a controlled degraded mode. Unconditionally bypassing all caches may overwhelm origin just when the control path is already failing.

:::interview Interview lens
**"What protects origin during a popular launch?"** Verified immutable identities, deliberate placement, equivalent-request collapsing, and a shared shield can reduce duplicate fetches. I still bound waiters and origin admission and size the cold fallback. Warm-cache hit ratios alone do not establish launch or failover capacity.
:::
:::key In one breath
Pull fetches useful content on demand, while push or prewarming pays earlier transfer for selected placement. Concurrent equivalent misses can share one in-flight fetch. A shield can reuse across edges but adds another failure and capacity boundary. Test cold launches and cache bypass because warm-cache averages can hide overwhelming origin demand.
:::

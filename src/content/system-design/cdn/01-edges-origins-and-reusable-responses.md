@part I | Edges, origins, hits and misses | We move reusable content closer to readers while keeping its authoritative source explicit. A nearer copy helps only when it is the right representation and the reader may use it. We will follow the first request, distinguish hits from misses, and build the identity of a cached response. | where:1

## 1. Edge locations and the origin
A viewer far from Heron's storage region opens the same clip as many other viewers. Sending every byte from that region repeats the long path and concentrates outgoing traffic there. A **content delivery network**, or **CDN**, uses distributed serving locations to deliver content, often by retaining reusable responses near readers.

An **edge location** is a serving site in that network. The **origin** is the configured source from which the CDN obtains authoritative content when its serving path needs it. Heron's immutable clip origin can be object storage, while a score representation's origin may be an application endpoint. Their permission and freshness rules differ.

@fig sd_cdn_roles | Illustrative serving-site atlas. The origin owns the source; edges can retain and serve permitted copies. A hit ends at the selected edge and a miss fetches from the origin. Site placement is illustrative, not a measured routing deployment.

A CDN can also proxy uncached requests, terminate connections, apply access policy, or protect an origin. Do not assume every request becomes cacheable merely because it passes through the CDN. State which representations may be reused, for how long, and under what identity and authorization checks.

:::story Picture this
A publisher sends copies to regional bookstores so readers do not each visit the central warehouse. The bookstore still needs the correct edition, enough stock, and a rule about who may take a copy. Distance reduction does not settle those other questions.
:::
## 2. The first miss and the later hit
An edge has never seen clip source `c7-v1`. A **cache miss** means its lookup cannot supply a usable stored response for this request. It forwards the necessary request toward origin, receives the response, and stores it only if the policy permits reuse. A later **cache hit** means a usable stored representation satisfies the request.

Follow the intermediate state. Before the first request, the key has no entry. While the origin request is pending, a fetch may be in flight without usable bytes yet. After a valid response is retained, the entry has bytes, metadata, a validator where applicable, and age information. A future hit must still check representation identity, freshness, and any required access rule.

@fig sd_cdn_misshit | Cache population trace. Retaining a response is conditional on its policy and representation identity.

A miss can also mean expired state, a different variant, an intentionally uncached request, or an entry that was evicted. Keep these reasons visible because they imply different remedies. Enlarging a cache does not solve a representation key that is wrong or a policy that forbids reuse.

:::note Miss categories
Distinguish absent, expired, bypassed, variant-mismatched, and error paths in telemetry. A single aggregate miss count cannot explain whether the origin load comes from cold content, short freshness, or accidental fragmentation.
:::
## 3. Count origin work and delivery work separately
At Heron's illustrative API peak of 1,000 requests per second, a 95% request hit fraction gives 950 edge hits and 50 origin misses. The miss path reduces original origin requests by a factor of 20 under this model. It does not eliminate the 1,000 responses delivered to viewers.

For equal 2,000-byte responses, viewer payload is 2,000,000 bytes per second. Miss payload from origin is 50 times 2,000, or 100,000 bytes per second, before revalidation, warming, retries, and overhead. The bytes now leave many edges rather than one origin, but the users still receive them.

$$Q_o=Q(1-h).$$
Read this as origin request rate $Q_o$ equals viewer request rate $Q$ multiplied by one minus request hit fraction $h$, under the stated single-fetch-per-miss simplification. Additional cache layers and request collapsing can change the origin relationship.

@fig sd_cdn_load | Illustrative equal response sizes. Viewer egress remains even when origin traffic falls.

:::warn Watch out
Do not size all CDN egress using origin misses. The edge still sends every delivered response. Request hit ratio and byte hit ratio can also differ when object sizes vary.
:::
## 4. Cache keys define equivalent requests
Two viewers request the same path but need different languages. If the cache uses only path identity while origin changes content by language, one viewer can receive the other representation. A **cache key** is the request information used to select a reusable response.

Include the dimensions that actually change representation, such as relevant path, selected query fields, normalized encoding, or language. Exclude irrelevant tracking fields when the policy permits it, because a unique query value on every request makes every lookup distinct. Under an illustrative two-encoding, three-language representation rule, a source can have 6 variants before any other dimension.

@fig sd_cdn_key | Illustrative negotiated variants. Only dimensions that change the representation should fragment its reusable identity.

[CloudFront cache-key policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html) is a concrete configuration model. Cache keys and forwarded origin request fields need compatible rules: forwarding a representation-changing field without keying or controlled normalization can mix responses. Authorization is handled separately in the signed-content part.

:::interview Interview lens
**"What does a CDN contribute to this design?"** It delivers permitted reusable representations from distributed sites, reducing some origin work and long-path transfers. I identify origin, cache key, freshness, and access rules rather than drawing one unexplained box. I count viewer egress separately from origin misses.
:::
:::key In one breath
The origin owns the configured source while edges supply usable cached or forwarded responses. A hit requires the right representation and policy, not merely stored bytes. Origin misses and viewer delivery are different workloads. Cache keys must preserve every relevant representation dimension without unnecessary fragmentation.
:::

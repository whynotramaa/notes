@part VII | Video and image delivery | We apply the cache mechanisms to images, segments, and score-related traffic without mixing their units. A highly reusable media segment behaves differently from a personalized live conversation. We will compute fan-out bandwidth, distinguish request and byte hits, handle ranges, and protect transformations. | where:7

## 25. Video segments and total viewer bandwidth
Heron adds an explicitly illustrative video rendition at 4,000,000 bits per second for each of 50,000 viewers. Dividing by 8 gives 500,000 payload bytes per second per viewer. Multiplying by viewers gives 25,000,000,000 bytes per second, or 200,000,000,000 bits per second, before protocol overhead.

At an illustrative segment duration of 6 seconds, a segment carries 3,000,000 bytes. Each viewer requests one such segment per interval in this idealized single-rendition model, so the total segment request rate is 50,000 divided by 6, or 8,333.333 recurring per second. Rendition switching, manifests, retries, and audio can add work.

@fig sd_cdn_video | Illustrative bitrate and segment duration, not the shared live-event workload or a measured codec output.

The CDN can reuse a segment across viewers and sites, greatly reducing repeated origin reads in a suitable workload. Its edge network still sends each viewer their payload. Plan egress and geographic capacity independently from the source's unique-segment production rate.

:::story Picture this
A broadcaster copies one recording to local stations, but every viewer still needs their own delivery path from a station. Reusing the source reduces central duplication. It does not eliminate the audience's total received bytes.
:::
## 26. Request hit ratio and byte hit ratio
A dashboard shows 90% request hits and the team expects 90% origin bandwidth reduction. Use an illustrative batch of 100 requests: 90 small 2,000-byte responses all hit, while 10 large 1,000,000-byte objects all miss. Hit payload is 180,000 bytes and total payload is 10,180,000.

The byte hit fraction is 180,000 divided by 10,180,000, or about 0.01768172888, which is a rounded computed value of about 1.768172888%. Origin still supplies 10,000,000 of the payload bytes. The request statistic is correct but answers a different question.

$$h_b=\frac{\text{bytes served from reusable cache}}{\text{total delivered bytes}}.$$
Read this as byte hit fraction $h_b$ equals cached delivered bytes divided by all delivered bytes under the chosen accounting definition. Use the same byte scope in numerator and denominator, and account for ranges or compression consistently.

@fig sd_cdn_bytehit | Computed unequal-size example. Rounded displayed fractions come from the retained numeric ledger.

:::warn Watch out
A request-hit dashboard can look healthy while large media misses saturate origin egress. Track bytes, miss reasons, object sizes, and regional skew alongside the request count.
:::
## 27. Range requests and stable bytes
A viewer seeks within a large clip and requests a byte range rather than the full object. A **range request** asks for selected portions under HTTP's supported representation rules. CDN handling of partial responses, stored ranges, and origin fetch size is product-dependent.

For an illustrative 1,000,000-byte range from a 5,000,000,000-byte immutable source, the fraction is 0.0002, or 0.02%. Do not assume origin transfers only that range unless the chosen product documents it. It may fetch different chunks or complete objects according to cache and origin behavior.

@fig sd_cdn_ranges | Range sizing exercise. It describes requested bytes rather than a vendor's guaranteed origin transfer.

Immutable identity prevents different range reads from accidentally combining different versions. Validators and conditional range handling must remain compatible. If a mutable object changes, a client or cache needs the protocol's correct response rather than quietly assembling old and new ranges into one corrupt file.

:::note Compression and ranges
Byte ranges apply to a selected representation. Content encoding and transformation can change byte offsets. Keep range semantics consistent with the actual bytes and validators served, and verify the delivery product's behavior.
:::
## 28. Images, transformations, and score conversations
An image path allows arbitrary width and format query values. If every request creates a new transformation and key, an attacker can bypass reuse and exhaust origin processing. Validate and normalize a bounded set of supported sizes and formats, then include every true representation choice in the cache key.

An illustrative 1,000 requests per second with unique fragmented keys can create 1,000 original misses per second even though their underlying source is the same. Coalescing only identical keys cannot rescue that design. A controlled transformation catalog improves reuse and bounds expensive work without mixing distinct image bytes.

@fig sd_cdn_transform | Transformation path. Restricting choices protects processing and avoids accidental unlimited key creation.

Heron's shared live-score event path is different. Twenty events per second delivered to 50,000 viewers create 1,000,000 deliveries and 200,000,000 payload bytes per second at 200 bytes each. A persistent personalized connection is not simply an immutable CDN segment, although infrastructure at the edge can still proxy or terminate it under different semantics.

@fig sd_cdn_livecomparison | Two explicitly separate delivery models. Do not size one with the other's payload or request rate.

### Static assets, photos and video at real services

The same three cache shapes cover most public examples. **Static assets** such as JavaScript bundles, stylesheets and fonts are the easiest case: the build puts a content hash in the file name, the response carries a long `max-age` with `immutable`, and a new release publishes new names instead of purging old ones. An HTML page that references those names stays short-lived, so a deploy changes one small document rather than every cached script.

A photo service such as Instagram stores each upload once and serves a small fixed set of renditions, for example a thumbnail, a feed size and a full size. That is the bounded transformation catalog above. Each rendition is immutable under its own URL, so a popular photo is fetched from origin roughly once per edge or shield and then served as hits, while a private account adds the per-request permission check from Part V.

Video platforms push the idea furthest because bytes, not requests, dominate. Netflix publishes its [Open Connect](https://openconnect.netflix.com/) program, which places Netflix-operated cache appliances inside or next to internet service provider networks and fills them with the catalogue during quiet hours, a push model from Section 14. YouTube serves from Google's edge network and its ISP-hosted [Google Global Cache](https://support.google.com/interconnect/answer/9058809) nodes, which fill on demand closer to the pull model. Both split a title into renditions and short segments, so the arithmetic of Section 25 applies per segment rather than per film.

:::interview Interview lens
**"What CDN calculations matter for a video service?"** I count viewer bitrate and segment request rate separately from unique origin fetches. I distinguish byte hits from request hits, account for rendition and range behavior, and protect transformation key cardinality. Live conversations and immutable media reuse keep different delivery contracts.
:::
:::key In one breath
Media reuse can reduce origin fetches while every viewer still receives payload. Request and byte hit ratios measure different work when object sizes vary. Range caching needs stable representation identity and verified product behavior. Bound transformation variants and keep live-score fan-out separate from video bitrate and segment calculations.
:::

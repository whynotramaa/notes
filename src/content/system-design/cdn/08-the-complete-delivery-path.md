@part VIII | Case study: private video delivery | We combine verified storage, access, routing, freshness, and source protection into one request. Each cache decision must preserve the representation and permission contract. We will trace playback, recover origin failure, reconcile all rates, and explain the role of every component. | where:8

## 29. Publish before issuing delivery access
Heron's storage workflow finishes verification and processing under immutable source and rendition identities. The database then publishes a pointer to the allowed rendition and manifest. Only after that state transition does the app issue viewer access appropriate to the delivery path.

The viewer resolves the delivery hostname and reaches the selected edge. The edge applies required access validation, derives the normalized content key, and checks usable retained state. On a miss it uses the configured shield and restricted origin path, preserving representation policy and validators. A hit returns the same permitted bytes without moving write authority to the edge.

@fig sd_cdn_playback | Full playback path. Metadata publication, capability validation, and content reuse have separate owners.

@fig sd_cdn_playbacktrace | Private delivery trace. The repeated access check remains necessary even when the content lookup can hit.

The cached manifest can point to many objects, so its freshness and signed policy scope matter. Test the whole reference chain rather than fetching a standalone public image and claiming the private video path is verified.

:::story Picture this
A ticketed theater announces the finished show, checks each visitor's ticket, and reuses the same projected recording for many visitors. The recording's availability and each visitor's permission remain distinct. A ready projector does not admit someone without a ticket.
:::
## 30. Origin failure and bounded stale service
Origin stops responding while edges retain representations. Immutable content with valid access may continue serving according to its retained-state policy. Mutable score or manifest state needs its explicit freshness and stale allowance. An origin error is not permission to ignore expired access or expose a private cached response.

Under the illustrative age policy, a response at age 320 has 20 seconds of staleness and fits a 30-second stale-if-error window beyond lifetime 300. At age 340 it exceeds that window. The fallback should stop or obtain another permitted source, rather than silently extending its own limit until recovery.

@fig sd_cdn_failure | Failure decision. Origin reachability, permission, and representation age are independent conditions.

When a shield or CDN path fails, direct origin fallback can overload the very source it was meant to protect. Apply bounded admission and protect expensive dynamic generation. A recovery plan should include warm state, cold state, and the visibility of stale-mode activation to operators and users where it affects decisions.

:::warn Watch out
Testing only a warmed cache with origin disabled proves neither cold-start capacity nor new publication behavior. Run a cold-key test and a new-version test during the simulated failure.
:::
## 31. Reconcile rates through each layer
The illustrative API path produces 1,000 viewer requests per second, 950 edge hits, and 50 original misses at 95% hits. Equal response payload gives 2,000,000 viewer bytes per second and 100,000 original miss bytes per second. Cache layers can change the final origin count, but they cannot erase viewer egress.

The separate illustrative video path creates 8,333.333 recurring segment requests per second. With 100 edges and ideal equivalent-key collapse, edge-to-next-layer segment fetches are 16.666666 recurring per second. One shared ideal shield sends 0.166666 recurring fetches per second, while viewers still receive 25,000,000,000 payload bytes per second.

@fig sd_cdn_reconcile | Ideal single-rendition model. Different variants, errors, retries, and range rules change reuse.

A constant hot identity revalidated independently at 100 edges every 300 seconds would create a simplified 100/300, or 0.333333 recurring refresh requests per second. Synchronized expiration can concentrate those requests into a burst. Average arithmetic should be paired with an explicit temporal trace and request-collapsing policy.

:::note Count control traffic too
Authorization, manifests, invalidation, probes, revalidation, and warmup are work as well. Keep their sizes and rates separate where unknown, then measure them. Inventing one overhead percentage would hide the mechanisms that can dominate a small response path.
:::
## 32. What each component contributes
The database publishes exact immutable references and visibility state. The application verifies permission and signs the intended access policy. DNS or network routing selects a serving path. The edge validates access and chooses a usable representation; the shield can aggregate source fetches, and restricted origin provides verified bytes.

Each box has a different failure question. A valid signature cannot repair a missing object. A fresh entry cannot authorize its viewer. A nearby edge cannot make stale score state current. A correct immutable object cannot update a cached manifest without the manifest's own policy.

@fig sd_cdn_jobs | Complete architecture summary. The mechanisms cooperate without substituting for one another's guarantees.

@fig sd_cdn_boundaries | Independent design checks. A pass on one row does not imply a pass on another.

This chapter has not promised a particular CDN's prices, global footprint, or origin throughput. Those are choices to verify with current documentation and workload tests. The next unit studies search, where queryable content uses indexes and ranking rather than simply reusing the same immutable response.

:::interview Interview lens
**"Walk me through private video delivery and its failure modes."** I start with a verified published immutable version, authorize the viewer, and route to an edge that validates access before reuse. Cache identity, age, validators, shield behavior, and restricted origin preserve the content contract. I count viewer bytes separately from source fetches and test expired links, cold failover, origin outage, invalidation, and manifest updates.
:::
:::key In one breath
The delivery path begins with verified publication and ends with permitted bytes for the viewer. Access identity, content identity, freshness, routing, and capacity remain independent checks. Edges and shields reduce repeated source work while viewer egress persists. Test both warm and cold states, and keep every fallback within its declared access and freshness rules.
:::

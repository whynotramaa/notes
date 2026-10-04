@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. What is an edge location?**

It is a serving site in the delivery network. It can hold reusable responses and terminate viewer requests. Its presence does not move application write authority or make every response cacheable.

**Q2. What is the origin?**

It is the configured authoritative content source for the delivery path. It can be object storage or an application endpoint. Each origin representation needs its own access and freshness rules.

**Q3. What makes a cache hit usable?**

The entry must match the representation and satisfy the applicable reuse and access rules. Stored bytes alone are insufficient. Expired, unauthorized, or variant-mismatched state cannot become a normal hit.

**Q4. Why separate origin and viewer bandwidth?**

Every viewer still receives bytes even when origin fetches are reused. The edge moves delivery work closer to users. Origin misses size a different link and workload.

**Q5. What belongs in a cache key?**

The dimensions that select the actual representation. Path, selected query fields, and normalized negotiation values may matter. Irrelevant identity or tracking dimensions can unnecessarily fragment reuse.

**Q6. Why align forwarded fields and cache identity?**

An origin may vary content based on a field that the edge forwards. If that variation is absent from identity or controlled normalization, the edge can mix representations. Forwarding everything can also destroy reuse.

**Q7. Does TTL guarantee residency?**

No. Eviction can remove fresh bytes early. A retained expired entry can still support conditional validation or an allowed stale mode.

**Q8. Why preserve response age?**

A response can already have spent part of its freshness lifetime upstream. Restarting its age at each cache extends exposure beyond the source policy. Current age includes corrected initial age and local residence.

**Q9. Compute the illustrative age after 240 seconds of residence.**

Initial corrected age is 120 seconds. Adding 240 gives 360. Against freshness lifetime 300, it is 60 seconds stale.

**Q10. What is the difference between no-cache and no-store?**

No-cache requires validation before permitted reuse under its rule. No-store forbids retaining under its scope. They do not name the same behavior.

**Q11. Why use s-maxage separately from max-age?**

Shared and private caches may have different freshness needs. The illustrative policy uses 300 seconds shared and 60 private. Other directives and CDN configuration still affect reuse.

**Q12. How does conditional validation save bytes?**

The cache sends a validator for the exact retained representation. An unchanged response can refresh relevant metadata without retransmitting the body. The retained body must still exist and match the validator.

**Q13. What does stale-if-error permit?**

A bounded stale response during specified errors when the policy allows it. It does not extend permission or allow unlimited old state. Compare the amount of staleness with the declared allowance.

**Q14. Why is invalidation not instantaneous deletion?**

It applies a control change across distributed retained state under the product's scope. Acceptance and complete propagation differ. Browser or downloaded copies can remain outside that scope.

**Q15. Why prefer versioned content identities for updates?**

They keep old and new bytes distinct while an application pointer changes after verification. Readers remain attached to one version. New misses and retained old bytes are explicit costs.

**Q16. What can stay stale despite versioned media?**

A cached page or manifest can keep pointing at the old version. That reference has its own freshness and invalidation policy. Updating the object alone does not update every reference.

**Q17. How does deletion differ from revocation?**

Deletion and purge remove service-held content state. Revocation stops permission to retrieve it. Previously issued capabilities, alternate origin paths, and downloaded copies need separate boundaries.

**Q18. What is negative caching?**

It retains a permitted failure or absence response. It can reduce repeated absent-key work but delay visibility after publication. Status, key, and access policy must prevent inappropriate shared errors.

**Q19. What is pull delivery?**

Content is fetched when a serving path needs it. It avoids placing every object at every site but makes first requests use a miss path. Variants and eviction can cause repeated fetches.

**Q20. What is push or prepositioning?**

Selected content is moved into delivery storage before viewer demand through the product's workflow. It pays earlier transfer and needs placement evidence. Prewarming a pull path does not prove every intended site is warm.

**Q21. What is request collapsing?**

Concurrent equivalent misses share one in-flight fetch. It reduces duplicate source work but still holds waiters and couples their outcome. Equivalence, deadlines, buffering, and failures need bounded rules.

**Q22. What is an origin shield?**

A shared intermediate cache or aggregation layer across edges. It can reduce repeated origin fetches. Its own latency, capacity, keys, and failure behavior become part of the architecture.

**Q23. Why test cold-cache failover?**

A replacement path can have low reuse even when the normal path has high hits. Origin work can surge while routing is already changing. Warm hit ratios do not establish cold capacity.

**Q24. Is a storage presigned URL the same as a CDN signature?**

No. They authorize different services, resources, and operations. Playback needs the chosen viewer-to-CDN policy while upload needs the storage write capability.

**Q25. Should a private cache hit validate access?**

Yes, under the chosen private delivery mechanism. Reused bytes do not make the viewer authorized. The access check must remain effective even when origin is not contacted.

**Q26. Can signatures be excluded from content identity?**

Only if a supported independent access boundary still validates them and the bytes are equivalent. This can preserve reuse across authorized viewers. Ignoring authorization entirely would expose private content.

**Q27. Why restrict origin?**

A public direct path can bypass CDN access control. Private bytes need policy at every retrieval route. Edge signatures alone do not protect an open origin URL.

**Q28. What does capability expiration guarantee?**

It bounds usable access under the signed policy and validation semantics. It does not automatically erase cached bytes or revoke a previously issued capability before expiry. Freshness remains separate.

**Q29. How do signed cookies change media access?**

A supported cookie policy can authorize a related set of asset requests without distinct URL signatures. Its path scope and browser handling need constraints. Broad prefixes can unintentionally authorize more content.

**Q30. How does DNS geographic routing choose a site?**

The provider uses location-related, health, capacity, and network policy information. Resolver vantage and cached answers can affect the result. Existing connections do not move merely because DNS changes.

**Q31. What does anycast mean?**

Multiple sites advertise the same service address and network routing selects a reachable route. It does not promise geographically nearest or lowest application latency. Stateful connection behavior needs verification.

**Q32. Does edge delivery move write ownership?**

No. It can deliver published or freshness-permitted state nearer to viewers. Authoritative writes still follow their coordination and region policy. A nearby old response remains old.

**Q33. Why is a mean latency not a tail percentile?**

A weighted mixture mean accounts for average contribution. It cannot establish the distribution's p99 or worst viewer without further data. The illustrative hit/miss mean is 38 milliseconds.

**Q34. How much payload does the illustrative video audience receive?**

At four million bits per second each, fifty thousand viewers receive two hundred billion bits per second. Dividing by eight gives twenty-five billion payload bytes per second. This is separate from live-score event payload.

**Q35. Why can request hits hide low byte hits?**

Small cached responses can dominate count while large misses dominate bytes. The illustrative batch has ninety percent request hits but about 1.768172888 percent byte hits. Use the byte statistic for payload bandwidth.

**Q36. How do ranges affect caching?**

They request partial bytes of the selected representation. CDN origin fetch and partial-cache behavior is product-dependent. Immutable identity and compatible validators prevent mixed-version assembly.

**Q37. Why bound image variants?**

Arbitrary transformation dimensions can create unique keys and expensive processing on every request. Validate a supported normalized set. Include every actual representation difference without granting unlimited key cardinality.

**Q38. Can a CDN cache a live conversation like an immutable segment?**

Usually the delivery contract is different: a persistent personalized channel has connection, replay, and fan-out state. Edge infrastructure may still proxy it. Do not substitute segment reuse assumptions for live-event guarantees.

**Q39. Walk me through the full private media path.**

Publish a verified immutable version, authorize the viewer, route to an edge, validate its access, and select usable retained content. On a miss use the bounded shield and restricted origin path. Preserve freshness and version identity while counting edge egress separately from source work.

**Q40. What changes from serving every request at origin?**

Reusable copies and distributed routing move much delivery work to edges. The design gains cache identity, freshness, invalidation, private-hit authorization, and cold-failure responsibilities. Those mechanisms explain both the benefit and its limits.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** ● Compute edge hits and origin misses at the stated API peak.

**E2** ● Compute equal-size viewer and origin miss payload.

**E3** ● Compute fresh time remaining after corrected age 120.

**E4** ● Compute current age and staleness after 240 resident seconds.

**E5** ● Compute representation variants for the illustrative negotiation.

**E6** ● Compute the pull-versus-all-site placement bytes.

**E7** ● Compute viewers per edge in the cold-segment example.

**E8** ● Compute the collapse reduction in that one burst.

**E9** ● Compute a 6-second segment payload at the stated bitrate.

**E10** ● Compute total illustrative video payload per second.

**E11** ●● Compute viewer, edge, and ideal shield segment rates.

**E12** ●● Compute request and byte hits for the unequal-size batch.

**E13** ●● Compute the illustrative mean latency.

**E14** ●● Check the stale-if-error ages.

**E15** ●● Compute the warm-to-cold origin amplification.

**E16** ●● Explain private shared caching without equations.

**E17** ●● Explain invalidation and versioning without equations.

**E18** ●● Explain geographic routing without equations.

**E19** ●● Compute range fraction and version retention.

**E20** ●● Compute independent hot-key refresh rate across edges.

**E21** ●●● Derive the original origin-miss relationship and its limits.

**E22** ●●● Prove why request hit ratio does not determine byte hit ratio.

**E23** ●●● Write a private delivery decision in pseudocode.

**E24** ●●● Design an old-link deletion test.

**E25** ●●● Count the complete video delivery design.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Multiply 1,000 by 0.95 to obtain 950 hits. The remaining 0.05 times 1,000 gives 50 original misses. Additional layers or retries can change final source work.

**E2.** Viewer delivery is 1,000 times 2,000 = 2,000,000 bytes per second. Original miss payload is 50 times 2,000 = 100,000. The edge still carries viewer delivery.

**E3.** Subtract age 120 from lifetime 300. The result is 180 fresh seconds, assuming the other reuse conditions permit it.

**E4.** Add corrected initial age 120 to residence 240 to get 360. Subtract lifetime 300 to get 60 seconds stale. Do not reset age at the receiving cache.

**E5.** Two encodings times three languages gives six variants. Any additional true representation dimension can multiply that population.

**E6.** The illustrative object is 5,000,000 bytes. Pulling once at two requested sites transfers 10,000,000. Placing it at four transfers 20,000,000 before any hierarchy or eviction effects.

**E7.** Divide 50,000 viewers evenly across 100 edges. Each has 500 viewers in this illustrative model; real geographic demand can be skewed.

**E8.** Without collapse there are 50,000 modeled source fetches. One fetch at each of 100 edges gives 100. Dividing 50,000 by 100 gives a factor of 500.

**E9.** Convert 4,000,000 bits per second to 500,000 bytes per second. Multiply by 6 seconds to obtain 3,000,000 payload bytes. Other streams and overhead are excluded.

**E10.** Multiply 500,000 bytes per viewer per second by 50,000 viewers. The result is 25,000,000,000 bytes per second, equivalent to 200,000,000,000 bits per second.

**E11.** Viewer rate is 50,000 divided by 6 = 8,333.333 recurring requests per second. Ideal per-edge collapse gives 100/6 = 16.666666 recurring. One shared ideal source fetch per segment gives 1/6 = 0.166666 recurring.

**E12.** Ninety of one hundred requests hit, giving 90%. Their bytes total 90 times 2,000 = 180,000. Ten large misses total 10,000,000, so all bytes are 10,180,000. Byte fraction is 180,000/10,180,000 = 0.01768172888015717, or about 1.768172888%.

**E13.** Hit contribution is 0.9 times 20 = 18 milliseconds. Miss contribution is 0.1 times 200 = 20. Add to obtain 38 milliseconds. No tail percentile follows from that mean alone.

**E14.** Age 320 minus lifetime 300 gives 20 seconds stale, within allowance 30. Age 340 minus 300 gives 40, exceeding it. Other directives and access checks can still forbid the first reuse.

**E15.** Warm original misses are 50 per second. The all-miss cold model sends 1,000. Dividing gives a factor of 20, before collapsing or shielding recovers reuse.

**E16.** Store equivalent content bytes under a reusable identity, but validate each viewer's required access policy before returning them. Keep origin restricted. Reuse of the content does not remove authorization.

**E17.** Invalidation asks distributed caches to stop using an existing identity under its propagation rules. Versioning publishes verified new bytes under a different identity and changes the reference. The reference itself still needs an update policy.

**E18.** The provider selects a serving site using network, health, capacity, and location-related policy. DNS answers can be cached, while anycast uses network route selection. The chosen site is not necessarily the closest geographic dot or fastest origin path.

**E19.** A 1,000,000-byte range divided by 5,000,000,000 gives 0.0002, or 0.02%. Two full versions of the object total 10,000,000,000 logical bytes. Actual origin range fetch and physical redundancy are separate quantities.

**E20.** One simplified refresh per 300 seconds at each of 100 edges gives 100/300 = 0.333333 recurring refresh requests per second. Synchronized expiry can burst rather than arrive smoothly, so temporal testing remains necessary.

**E21.** Partition viewer requests into reusable hits and original misses. Under one original fetch per miss, miss fraction is one minus hit fraction, so origin rate is total rate times that fraction. Collapsing, shields, validation, warming, retries, bypass, and eviction can change actual origin work, so the formula is a stated simplification.

**E22.** Request ratio weights every request equally, while byte ratio weights each by delivered size. If cached requests are small and misses are large, equal request counts produce unequal byte contributions. The 90-small-hit/10-large-miss example gives 90% request hits but only about 1.768172888% byte hits, demonstrating the missing size information.

**E23.** Keep permission and content reuse as separate required checks.

```python
def deliver(request):
    policy = validate_supported_signature(request)
    if not policy.permits(request.resource, current_time()):
        return deny()
    key = normalized_representation_key(request)
    entry = cache.lookup(key)
    if entry and reusable_for_request(entry, request):
        return serve(entry)
    return bounded_authorized_origin_fetch(key, request, policy)
```

The real signature validation and HTTP reuse rules must come from the supported product and protocol. Cache-hit reuse must never skip policy validation.

**E24.** Warm a private object with a valid capability, mark its application metadata deleted, and stop new signing. Try the old link, a direct origin request, and a new unsigned edge request. Verify each against the stated expiry or revocation promise, then check invalidation propagation separately. A warmed hit must not invent permission.

**E25.** The illustrative audience receives 25,000,000,000 payload bytes per second and makes 8,333.333 recurring segment requests. Ideal edge collapse sends 16.666666 recurring fetches onward, and the ideal shield sends 0.166666 recurring to source. Add manifests, access validation, rendition variants, revalidation, retries, and control traffic as separate measured workloads; do not erase viewer egress because source reuse is high.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[RFC 9111: HTTP caching](https://www.rfc-editor.org/rfc/rfc9111). Cache identity, age, freshness, directives, and conditional reuse.

[RFC 5861: stale cache extensions](https://www.rfc-editor.org/rfc/rfc5861). Bounded stale-while-revalidate and stale-if-error behavior.

[RFC 4786: anycast operation](https://www.rfc-editor.org/rfc/rfc4786). Routing selection and stateful-service considerations.

[CloudFront cache-key policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html). Concrete configurable representation identity.

[CloudFront private content](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html). Signed URLs, signed cookies, and origin access restrictions.

[CloudFront invalidation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html). Removing cached identities and comparing versioned names.

[RFC 9110: HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110). Range and validator semantics at the representation boundary.

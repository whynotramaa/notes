@part II | TTL and Cache-Control | We decide when a retained response may be reused without contacting its source. Stored bytes do not become fresh again merely because another cache received them. We will compute age, distinguish shared and private policies, revalidate conditionally, and bound stale service. | where:2

## 5. TTL is a freshness rule, not guaranteed retention
A clip response is stored, then removed early because the edge needs space. A score response is still stored but too old to use without validation. **Time to live**, or **TTL**, commonly describes a freshness interval in this context; it does not guarantee that the cache will retain an entry for that whole period.

HTTP caches compare a response's current age against its allowed freshness lifetime using protocol rules and policy. A fresh entry can be reused without ordinary origin validation, subject to other request conditions. An expired retained entry can still help through conditional validation or a permitted stale mode; absent bytes cannot.

@fig sd_cdn_ttl | Freshness versus storage residency. A chosen lifetime is not a residency guarantee.

Check the CDN's minimum and maximum configured TTL as well as origin directives. Configuration can constrain what the edge does. Heron should use a deliberate immutable-media policy and a separate score freshness policy because score updates and immutable video bytes change differently.

:::story Picture this
A newspaper remains on a shelf after its date passes. It still exists, but it may no longer answer a question about today's result. A shop can also discard a current paper early when the shelf is full. Age and possession are separate facts.
:::
## 6. Compute current age across cache layers
An edge receives a response whose corrected initial age is an illustrative 120 seconds. The allowed freshness lifetime is 300 seconds. Only 180 fresh seconds remain; assigning a new 300-second lifetime from local receipt would forget the age already spent upstream.

In this simplified trace, residence adds directly to corrected initial age. After 240 seconds at the edge, current age is 360 and the response is 60 seconds past its 300-second lifetime. Real HTTP corrected age includes the protocol's response-delay and clock rules, so use the standard or implementation rather than only wall-clock subtraction.

$$a_{\text{current}}=a_{\text{initial}}+t_{\text{resident}}.$$
Read this as current age equals corrected initial age plus time resident in this cache. Here $a_{\text{initial}}$ is already corrected for upstream and response timing; $t_{\text{resident}}$ is elapsed local residence. [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) defines the complete freshness and age calculation.

@fig sd_cdn_age | Simplified age trace after corrected initial age is known. Full HTTP age calculation includes response timing rules.

:::warn Watch out
Setting a fresh full TTL at every cache layer can extend stale exposure beyond the origin policy. Preserve age and the selected representation's validators through the layered path.
:::
## 7. Cache-Control, private caches, and shared caches
Heron wants a public asset to stay fresh in a browser for an illustrative 60 seconds but in a shared CDN for 300. `max-age` and `s-maxage` can express distinct HTTP freshness rules for those scopes, subject to the other directives and actual cache configuration.

A **private cache** is dedicated to one user, while a **shared cache** can reuse responses across users. `private` prevents ordinary shared storage of a response under its rules. `no-store` forbids storing under the directive's scope. `no-cache` means reuse requires successful validation; it does not simply mean never retain bytes.

@fig sd_cdn_directives | HTTP directive meanings. Actual request and response directives and CDN policy must be evaluated together.

Personalized responses need careful scope. A public score representation may be reusable across authorized viewers, while a personal account page must not become a shared public response. Some authenticated responses can be cached under explicit permitted rules, but a design should justify that choice rather than treating credentials as irrelevant.

:::note Vary and normalization
HTTP's `Vary` identifies representation selection by request fields. CDN policy may normalize or select fields differently. Ensure the origin's representation rule and edge's cache identity remain compatible; forwarding every header can destroy reuse without improving correctness.
:::
## 8. Conditional validation and stale windows
An expired entry has an ETag for its exact representation. The edge sends a conditional request such as `If-None-Match`. If the origin reports that representation unchanged, a `304` response permits the cache to update the relevant metadata and reuse retained content under the protocol rules, avoiding retransmission of the full body.

**Stale-while-revalidate** permits a bounded stale reuse while refresh happens, and **stale-if-error** permits selected stale reuse during specified failures when allowed. [RFC 5861](https://www.rfc-editor.org/rfc/rfc5861) defines these extensions. They are explicit policy, not permission to serve arbitrarily old or unauthorized content.

@fig sd_cdn_revalidate | Conditional validation path. The validator refers to the selected representation, not every response at the same path.

With lifetime 300 seconds and a 30-second stale-if-error allowance, illustrative age 320 is 20 seconds stale and fits. Age 340 is 40 seconds stale and exceeds that allowance. Permission, deletion, and directives that require validation can impose tighter conditions; stale service cannot weaken them.

@fig sd_cdn_stale | Illustrative age comparison. Reuse must also satisfy the chosen response and access policy.

:::interview Interview lens
**"How do TTL and revalidation work together?"** Freshness controls reuse without contacting origin, while a retained expired response can validate its exact representation conditionally. Age carries across cache layers. Explicit stale windows can preserve limited service during refresh or failure, but their bounds and access rules remain mandatory.
:::
:::key In one breath
Freshness lifetime differs from retention, and current age includes time already spent upstream. Shared and private caches can have different directives. Conditional validation reuses the exact retained body only after the origin's permitted unchanged response. Bounded stale modes are declared degradation rules, not unlimited extensions of freshness or permission.
:::

@part III | Invalidation and versioned URLs | We change what readers receive without assuming every edge updates at one instant. Purging a distributed cached identity and publishing a new identity solve different problems. We will trace invalidation, use immutable versions, separate deletion from authorization, and handle cached errors. | where:3

## 9. Invalidation reaches distributed state
A faulty image is published under a mutable key and cached at many edges. **Invalidation** requests that cached state for selected identities be removed or refreshed. It is a control operation over distributed caches, so request acceptance and complete propagation are different events.

Suppose an illustrative identity exists at 64 edges. The system needs the invalidation applied wherever the old response can still be reused, and also needs to consider intermediate caches and browsers. A completion status from one control API must be interpreted according to that product's scope rather than assumed to clear every copy on the internet.

@fig sd_cdn_invalidate | Distributed invalidation concept. The illustrative 64-edge count belongs to the ledger, not a measured product deployment.

[CloudFront invalidation guidance](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html) presents invalidation and versioned names as alternatives for content updates. Verify path matching, variant handling, and completion semantics. An invalidated key can be refetched immediately, so updating origin to the correct content and protecting cold-load demand are part of the operation.

:::story Picture this
A publisher asks every bookstore to remove an incorrect edition. Sending the notice is earlier than every shelf being checked, and it does not recall copies already taken home. Publishing a corrected edition under a new identity answers a different problem.
:::
## 10. Versioned names avoid mutable identity races
Heron publishes `clip-c7-v2` as a new immutable object and changes the database pointer from `clip-c7-v1`. Readers already using v1 keep consistent bytes; new readers receive v2. The CDN can retain both under separate keys without guessing whether a mutable object changed halfway through a download.

Two full illustrative versions of a 5,000,000,000-byte clip retain 10,000,000,000 logical bytes. That is the storage cost of the simple example before replicas and renditions. It also costs misses for the new identity, so the publication plan may prewarm selected hot paths when measured demand justifies it.

@fig sd_cdn_version | Immutable versioned publication. Old object and access lifetimes are separate cleanup policies.

The small manifest or metadata pointer can itself be cached. Give it a freshness and invalidation rule that matches update requirements. Otherwise correct immutable content exists but viewers keep receiving the old pointer. The source object and the pointer are two distinct cache identities.

:::warn Watch out
Versioned filenames do not automatically refresh a cached page or manifest that still points at the old version. Identify the complete reference chain and its update policy.
:::
## 11. Deletion, revocation, and stale content
A user deletes a private clip. Removing the origin object does not automatically remove all cached bytes or immediately revoke previously issued access. Deletion state should stop new authorization, and the design must state how existing capabilities and edge copies become unusable.

A signed capability expires according to its rule. An invalidation can remove cached bytes according to its propagation scope, but it is not an authorization mechanism by itself. If a client bypasses the CDN and origin remains public, removing edge state does not protect the clip. Keep origin restricted to the intended delivery path.

@fig sd_cdn_revoke | Separate deletion responsibilities. A cached private byte sequence still requires access enforcement.

Some product requirements accept a bounded existing-access lifetime, while others require an additional revocation check. A per-request revocation lookup can reintroduce a dependency and cost at the edge. Choose the promise honestly, then test it with an old valid link and a warmed cache after the application marks the clip deleted.

:::note Already downloaded content
A service can stop future authorized retrieval; it cannot assume it can erase a copy the recipient already downloaded. State deletion behavior at the service boundary rather than promising control over unrelated client storage.
:::
## 12. Negative caching and failed publication
A viewer requests a newly announced clip before its object or metadata is ready, and the CDN retains the origin's not-found response under an allowed negative-cache rule. A **negative cache** stores a failure or absence response for reuse. It can protect origin from repeated absent-key requests but delay visibility after the object becomes available.

Publish verified media before announcing the reference. Choose error-cache rules deliberately and distinguish absence from permission errors and transient origin failures. An unauthorized response must not become a reusable answer for every other caller merely because the path matches.

@fig sd_cdn_negative | Negative-cache visibility problem. Status-specific caching and publication order determine the delay.

Error responses may also include user-specific details or retry information. Their key and cache policy need the same representation and security discipline as successful content. The right fix for a publication race is not simply to disable all caching; it is to order state and choose explicit error semantics.

:::interview Interview lens
**"How do you update or remove CDN content?"** For updates I prefer immutable new identities and change their verified reference, with a policy for cached manifests. For urgent removal I use documented invalidation plus access revocation and restricted origin. I distinguish propagation, existing capabilities, and already downloaded copies rather than promising an instantaneous global erase.
:::
:::key In one breath
Invalidation changes distributed retained state and has a propagation boundary. Immutable versioned publication creates a new identity and changes the reference after verification. Deletion and access revocation remain separate, with old links and bypass paths included in the promise. Negative caching makes publication order and status-specific policy visible.
:::

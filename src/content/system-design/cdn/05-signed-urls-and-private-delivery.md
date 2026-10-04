@part V | Signed URLs and private delivery | We keep reusable private bytes behind a per-request permission boundary. Shared storage of a representation need not make that representation public. We will sign the delivery capability, validate it before a cache hit, restrict origin, and bound revocation exposure. | where:5

## 17. Origin upload signatures and CDN delivery signatures
Heron used a presigned object request to permit upload. Playback through a CDN needs permission at the viewer-to-CDN boundary. A **signed CDN URL** carries a delivery policy authenticated by a trusted signer, allowing the edge to validate permitted retrieval according to the product's mechanism.

An origin-storage upload signature does not automatically authorize a different CDN hostname, method, or path. Conversely, a CDN playback signature should not grant upload or general object-store access. Keep each capability's signer, resource, method or action, and usable time explicit.

@fig sd_cdn_capabilities | Distinct authorization boundaries. One signed request cannot be assumed valid for another service's request format.

[CloudFront private-content documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html) describes signed URLs and signed cookies with restricted origin. The product's actual policy fields and validation timing need verification. Heron issues playback access only after its metadata says the user may view the published version.

:::story Picture this
A warehouse delivery permit lets a truck leave a package at a bay. A museum admission ticket lets a visitor see the displayed item. Both are signed permissions, but using one at the other's door does not authorize the other operation.
:::
## 18. Validate permission even on a cache hit
The edge already holds a private clip's bytes. A second viewer requests the same key without valid access. A cache hit must not bypass the chosen private-delivery check. The edge validates its supported signed policy before returning bytes, regardless of whether it contacts origin.

The same authorized representation can be reused across permitted viewers when access is enforced outside its content identity. If the signature or user identifier is unnecessarily part of the cache key, every viewer may create a distinct entry and lose reuse. Excluding those fields is safe only when the access boundary still checks them and the bytes truly are equivalent.

@fig sd_cdn_privatehit | Private cache-hit path. Cache-key normalization must not remove the separate authorization check.

@fig sd_cdn_twoidentities | Identity separation. Personalized representation bytes require additional content-key dimensions.

Test a warmed private object with missing, expired, malformed, and altered signatures. Test a different object path with a valid signature for the original path. The security guarantee must hold before the cache lookup can return content, not only on misses.

:::warn Watch out
Removing a signature from the cache key is a reuse optimization only if a supported independent access check still evaluates it. Ignoring it entirely turns private cached content into public content.
:::
## 19. Restrict the origin and protect signing authority
A viewer discovers the origin hostname and downloads the private object directly. The CDN signature was irrelevant because another public path existed. Restrict origin so only the intended delivery mechanism or narrowly authorized administrative path can retrieve private bytes under its actual policy.

Protect the signer and rotate keys through the supported trust configuration. A leaked signer can create apparently valid capabilities until its authority is removed and validation paths honor that change. Short expiration limits some exposure but does not replace signer revocation and controlled key distribution.

@fig sd_cdn_bypass | Origin-access boundary. The object store and application must enforce the intended private serving path.

Do not place complete signed URLs in logs or third-party analytics. They carry delegated authority. Keep a redacted content identity, policy identifier, decision, and request correlation value for diagnosis. Access logs should explain why a request was denied without reproducing a reusable secret.

:::note Signed cookies and related objects
A media page may need many segment or asset requests. A supported signed-cookie policy can avoid a separate URL signature for each identity, but its path scope and browser handling need deliberate constraints. Broad prefixes can grant more content than the page intended.
:::
## 20. Expiration and revocation are stated promises
Heron gives an illustrative playback capability a 300-second lifetime. If the user loses permission after it is issued, the service may stop issuing new capabilities immediately while the existing one remains usable according to its signed policy. Whether additional revocation is required is a product and security decision.

Cache freshness can exceed or be shorter than capability life because they govern different things. Fresh retained bytes do not extend an expired viewer capability. Conversely, valid access does not make stale mutable content fresh. The request must satisfy both independent rules.

@fig sd_cdn_expirypermission | Separate policy checks. Existing transfer and reconnect expiration behavior is product-specific.

An urgent revocation requirement may need a short capability, an online deny rule, or product-supported revocation. That introduces latency, availability, and control-plane dependencies to evaluate. Avoid a claim of immediate revocation when the design only stops new signing.

:::interview Interview lens
**"Can private video still have a good CDN hit ratio?"** Yes, if identical bytes use a reusable content key while the edge validates access independently on every required request. I restrict origin to prevent bypass and bound capability lifetime. Personalized bytes and urgent revocation can add key dimensions or validation dependencies, which I state explicitly.
:::
:::key In one breath
CDN playback and storage upload use different delegated operations. A private cache hit still needs valid viewer permission, while reusable content identity can remain separate from access identity. Restrict origin and protect signing authority so alternate paths cannot bypass the edge. Expiration, revocation, freshness, and ongoing-transfer behavior are separate promises.
:::

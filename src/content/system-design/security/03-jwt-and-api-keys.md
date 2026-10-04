@part III | JWT and API keys | We examine credentials that carry claims or identify a caller. Readable data and a valid signature can still represent the wrong issuer or audience. We will trace JWT validation, lifetime and revocation, API key scope, and signing-key rotation. | where:3

## 9. A JWT carries claims, not automatic truth

A service receives a token whose payload says `role=admin`. Anyone can encode that text, so decoding it proves nothing. A **JSON Web Token**, or JWT, is a token format carrying claims, often protected by a signature or message authentication code. The receiver must verify its protection and semantic rules before trusting any claim.

A **claim** is a stated value about identity, context, or validity. The header selects a protection representation, the payload carries claims, and the final encoded component carries the protection result for common signed JWTs. Base64url encoding is readable encoding, not encryption. A bearer JWT can expose its claims to anyone who obtains it.

@fig sd_security_jwt | Illustrative signed-JWT validation responsibilities. Some token forms use different structures, so this diagram names the common signed form.

Use a maintained token library and an explicit algorithm allowlist. [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html) discusses algorithm verification and other JWT validation rules. Do not use the token's untrusted header as authority to choose any algorithm or fetch arbitrary verification material. The expected issuer and token purpose determine trusted key discovery.

:::story Picture this
A printed pass can state *administrator*, but a receiver needs to recognize the issuing authority, check the seal, check its destination and date, then decide what the pass permits. Reading the word administrator is only reading a claim. It is not the whole verification process.
:::

## 10. Validate issuer, audience, and purpose

A valid token issued for one service arrives at another. Its signature may be genuine, yet accepting it can give access the issuer never intended. **Issuer** identifies the authority that created the token. **Audience** identifies the intended recipient or recipients. **Subject** identifies the principal within the issuer's defined context.

The receiver validates protection using trusted issuer keys, then checks expected issuer, intended audience, expiry, not-before constraints where used, and the token's application purpose. Token types with different meanings need mutually exclusive validation rules. An identity token for a client is not automatically an API access token.

@fig sd_security_token_checks | Illustrative semantic validation order. Resource permissions remain another decision after token acceptance.

A receiver should distinguish a malformed token from a correctly protected token that is invalid for this purpose without leaking useful credential details. Reject unexpected claim shapes before using them in queries or policy. A subject value is meaningful only in its issuer context, so joining users by an unqualified subject alone can merge identities from unrelated authorities.

Clock tolerance must be bounded and documented. Unlimited expiry grace is effectively unlimited token life. Reject malformed claims and unexpected types rather than coercing them casually. A token's role claim can also outlive a changed permission, so authorization may require current policy or a short validity window.

## 11. Self-contained tokens have a revocation tradeoff

A service verifies a short-lived JWT locally without a session lookup. That removes one online dependency, but a removed permission or stolen token can remain accepted until expiry unless the receiver consults current state or another revocation mechanism. **Access token lifetime** is the interval during which the token may authorize its declared use.

Under an illustrative five-minute lifetime, a token revoked just after issuance can have up to 300 seconds of residual acceptance if the only check is expiry. This is a worst-case exposure under the stated design, not a recommended lifetime. Shorter life reduces that window but increases renewal work and does not prevent use before revocation is observed.

@fig sd_security_lifetime | Illustrative five-minute token lifetime. No online revocation check means permission removal can lag token acceptance.

A denylist, token introspection, policy-version check, or current-resource check can change the boundary by adding state. A **refresh token** supports obtaining new access tokens under a longer-lived controlled credential flow. Protect and rotate it according to the authorization-server policy. It should not be accepted directly as an ordinary API credential.

:::note Token size is another request cost
The illustrative encoded components of 48, 240, and 43 characters plus two separators produce a 333-character signed token. This is a format arithmetic exercise with assumed component sizes. A real JWT varies with claims and protection, and large credentials add bytes to every carrying request.
:::

## 12. API keys and signing keys have different jobs

A backend integration uses an **API key**, a credential identifying an application or account under a service's policy. Scope it to needed actions and resources, record its owner and rotation state, and avoid putting it in URLs or ordinary logs. Store a verification representation appropriate to the key scheme so a database leak need not reveal usable raw keys.

A **signing key** protects issued tokens or signed requests. Its secrecy or integrity requirements depend on whether the algorithm is symmetric or asymmetric. With asymmetric signatures, receivers can verify with a public key without receiving the private signing capability. Sharing a symmetric verification secret also shares the ability to create valid protection under that secret.

@fig sd_security_keys | Illustrative key responsibilities. Asymmetric public verification material differs from a symmetric secret.

Rotation overlaps old and new verification material while still-valid tokens expire under policy. The illustrative access lifetime of 300 seconds plus thirty seconds of clock tolerance gives 330 seconds of old-key verification retention if no other issued lifetime applies. Emergency compromise can require earlier invalidation and forced reauthentication. Publish key identifiers only through trusted issuer metadata.

:::warn Watch out
Do not accept an arbitrary `jku` URL or file path from an untrusted token header as the key source. Bind key discovery to a configured issuer and allowed retrieval policy. Otherwise verification can become attacker-controlled trust or server-side fetching.
:::

:::interview Interview lens
**"Why not use JWT for every session?"** Local verification can remove a lookup, but revocation, changing permissions, credential exposure, and token size still need policy. Opaque sessions offer direct current-state invalidation. I would choose from the trust model and lifecycle requirement, then validate issuer, audience, purpose, time, and allowed protection. The token format does not decide authorization by itself.
:::

:::key In one breath
JWT claims become trustworthy only after protection and semantic validation. Check issuer, audience, purpose, time, and allowed algorithms before authorization. Local verification trades an online lookup for explicit revocation and lifetime rules. API keys identify callers, signing keys grant issuance capability, and rotation preserves or intentionally ends their validity boundaries.
:::

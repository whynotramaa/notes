@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. Authentication versus authorization?**

Authentication establishes a principal under a credential protocol. Authorization checks a particular action and resource using trusted context. A valid session does not grant access to every report ID. Preserve that rule through search, exports, thumbnails, storage grants, and internal calls.

**Q2. What is a tenant boundary?**

A scope separating organizations or customers. Derive it from trusted identity and membership, not an arbitrary client header. Apply it to resource lookups and cache keys and preserve it across service calls. Global identifier uniqueness is not permission.

**Q3. Why default deny?**

A missing or unmatched policy must not silently authorize a new endpoint or action. Require an explicit grant under trusted context and define policy-error behavior. A disabled UI control cannot enforce the server boundary. Sensitive operations need an appropriate current-state check.

**Q4. What is least privilege?**

Grant only the actions and resource scope required for a job. It limits the possible effect of exposed credentials or compromised components. It does not stop misuse within the permitted scope. Recovery and monitoring still matter for that remaining authority.

**Q5. What does a session token represent?**

It is a credential referencing continued authenticated state, commonly in a server record. An opaque value need not expose identity claims. Anyone holding a usable copy can attempt to act as the session. Protect its generation, transport, storage, lifecycle, and logs.

**Q6. Why is token randomness not the whole design?**

A large unpredictable space reduces guessing under its assumptions but does not prevent copying, logging, fixation, or indefinite validity. The illustrative thirty-two bytes count 256 bits, not a universal security guarantee. Lifecycle and endpoint protections remain necessary.

**Q7. What does Secure on a cookie do?**

It controls delivery over secure transport under browser rules. It does not authorize a requested object or prevent injected code from issuing actions. Scope, HttpOnly, SameSite, expiry, and server revocation solve different parts of the credential lifecycle.

**Q8. What does HttpOnly prevent?**

It prevents ordinary document-cookie script reading of that cookie. An injected script can still make requests with browser authority. Safe rendering and action protections remain required. Do not interpret the flag as a complete XSS defense.

**Q9. What does SameSite do?**

It controls some cross-site cookie-sending behavior with mode and context-dependent rules. It can reduce certain CSRF paths but needs review against intended cross-site flows. It does not replace server-side resource authorization or every action-specific CSRF check.

**Q10. What is session fixation?**

An attacker-known pre-login session identifier becomes the victim authenticated session. Regenerate the identifier at login or relevant privilege changes and invalidate the old credential. Do not attach identity to an untrusted existing reference. Concurrent requests need a controlled transition.

**Q11. What must logout invalidate?**

The server validity of the chosen session scope as well as the local browser credential. Clearing a cookie alone leaves another copied token usable. Multiple devices require a specific one-session or all-session operation. Cache behavior determines any residual revocation delay.

**Q12. Idle versus absolute session expiry?**

Idle expiry depends on a defined period without qualifying activity. Absolute expiry ends the session regardless of continued activity. Background calls must not accidentally renew forever unless that is intended. Sensitive actions can require fresh authentication separately.

**Q13. Is a JWT encrypted?**

A common signed JWT is readable encoded claims plus protection, not encrypted content. Verification establishes integrity and issuer-related trust only under correct rules. Sensitive claims should not be included merely because the token looks opaque. The token is a bearer credential if possession authorizes use.

**Q14. What must a JWT receiver check?**

Allowed protection and trusted keys, expected issuer, intended audience, token purpose, time rules, and valid claim types. Then apply resource authorization. Decoding is not validation. Token types with different meanings require separate acceptance rules.

**Q15. Why check audience?**

A genuine token can be issued for another recipient. Accepting it at the wrong API can reuse authority outside its intended boundary. Expected audience is part of semantic validation, not a field to trust without comparison. Signature success alone is insufficient.

**Q16. Why constrain algorithms?**

Untrusted token metadata must not choose arbitrary verification behavior. Use a maintained library and an explicit expected algorithm set. Bind key discovery to a trusted issuer. Different symmetric and asymmetric algorithms grant different powers to holders of verification material.

**Q17. What is the revocation cost of local JWT verification?**

Without an online state or revocation check, a previously issued credential can remain accepted until expiry despite a permission removal. The illustrative five-minute lifetime allows up to 300 seconds of residual acceptance. Short lifetime and renewal add their own costs and do not replace current resource policy.

**Q18. What is a refresh token?**

A credential permitting renewal under an authorization-server grant policy. It has a different purpose from an ordinary API access token. Protect, rotate, and revoke it according to the reviewed flow. Removing a grant must close the renewal path as well as addressing existing access validity.

**Q19. What is an API key?**

A caller credential under a service policy. Scope it to necessary actions and resources, record its owner, and support rotation and revocation. Avoid URLs and ordinary logs. Its identity and authority do not automatically represent a human user.

**Q20. How is a signing key different?**

It grants the ability to produce protected issued material. An asymmetric verifier can use a public key without gaining signing authority, while a shared symmetric secret permits both protection and verification. Compromise scope and rotation differ from a single caller API key.

**Q21. What does OAuth authorize?**

Limited delegated resource use by a client under an authorization-server policy. It avoids sharing the resource owner password. Roles, scopes, client identity, and resource enforcement are distinct. Login identity needs the appropriate identity protocol rather than inference from any access token.

**Q22. What is an authorization code?**

A short-lived one-use value returned through the approved flow and exchanged at the token endpoint under client and proof rules. It is not a permanent API credential. Client, redirect, and grant binding matter. Public clients cannot protect a secret simply by embedding it in distributed code.

**Q23. What does PKCE bind?**

Code redemption to a per-attempt verifier whose derived challenge was registered in authorization. An intercepted code alone lacks that verifier. The required derivation and flow binding must be implemented correctly. It is not a reusable client password or a replacement for every response-context check.

**Q24. Does OAuth equal login?**

No. OAuth defines delegated access; OpenID Connect adds an identity layer with its own token and flow validation. An API token may be opaque and intended for the resource server. The client must not infer a logged-in identity from possession of an unrelated access credential.

**Q25. What is RBAC?**

Grouping explicit permissions into roles and assigning those roles to principals in a defined scope. Resource attributes can constrain a broad role. Role names do not create an automatic privilege hierarchy. Current membership and revocation rules determine the actual decision.

**Q26. What is an ACL?**

A resource-specific collection of grants naming principals or groups and actions. It expresses sharing exceptions without necessarily creating another global role. Tenant, issuer authority, group membership, expiry, and current revocation still matter. A grant on one clip does not apply to another.

**Q27. How do attributes complement roles?**

They add conditions such as tenant equality, match assignment, and editable resource state. Inputs must be trusted or validated, not supplied as arbitrary client assertions. Central policy logic still needs correct resource context at each call. Cached decisions need a freshness and invalidation boundary.

**Q28. What is time-of-check/time-of-use here?**

Permission or relevant resource state can change between the check and delayed effect. Sensitive operations can reevaluate at the authoritative write boundary or use a reviewed bounded capability. Queued work retains initiating context. Internal execution is not permission to bypass the user rule.

**Q29. What does TLS protect?**

Confidentiality and integrity for a connection with validated peer identity under its protocol. Encryption with the wrong endpoint is not the intended protection. Termination names where plaintext exists, and later hops need their own trust contract. Application authorization remains separate.

**Q30. What does encryption at rest fail to prevent?**

A compromised component already authorized to decrypt can still read its permitted data. Protection depends on the threat, key location, and access authority. Backups and retained keys must restore together. Metadata can remain exposed outside encrypted payloads.

**Q31. What is envelope encryption?**

A data key encrypts content and another key protects that data key under managed authority. Stored metadata identifies the relevant versions. Wrapping-key rotation can have a different transition from reencrypting data. Deleting a required key can make backups unreadable.

**Q32. What belongs in secrets management?**

Controlled creation, scoped retrieval, distribution, rotation, revocation, and audit of confidential capabilities. Source files and images create uncontrolled copies. Logs should contain identifiers and errors rather than secret values. Rotation must account for running readers and emergency compromise.

**Q33. Why password hashing rather than a fast digest?**

Offline attackers can test guesses very cheaply against a fast digest. Reviewed password functions deliberately consume time or memory under adjustable parameters. Salt individual records and measure safe deployment settings from current guidance. The chapter numbers are illustrative capacity assumptions, not recommended strengths.

**Q34. Salt versus pepper?**

A salt is a per-record random value stored with the verifier and need not be secret. A pepper is additional secret material managed separately where used. They serve different purposes. Losing or rotating a pepper can require a larger credential transition than changing one stored field.

**Q35. Why limit hash concurrency?**

Anonymous requests can trigger deliberately expensive work and exhaust CPU or memory. Bound admission and queues while preserving reviewed verifier strength. Endpoint limits, account controls, and recovery flows must avoid creating easy lockout abuse. General QPS alone does not represent that resource cost.

**Q36. What is a signed URL?**

A scoped bearer capability protected over object, method, validity, and supported request conditions. The app authorizes issuance, while storage verifies presentation. Another holder may use a copied URL during validity. Logout does not automatically revoke an independent already issued capability.

**Q37. Does signed upload mean trusted content?**

No. It permits a bounded transfer under supported conditions. The app still validates object identity, size, content, ownership, and publication state. Client-selected paths cannot choose arbitrary storage authority. Transfer success and public acceptance are separate boundaries.

**Q38. What does CORS do?**

It controls eligible browser cross-origin response access under a declared protocol. Non-browser clients do not rely on that restriction. Some requests can execute before a response-read block. Server authentication, authorization, and intentional-action protection remain independent.

**Q39. What does CSRF exploit?**

Automatic browser credentials on an unwanted cross-site action. Use a reviewed session-bound proof and suitable origin/cookie policies for the flow. CORS alone does not prevent the action. XSS can act inside the legitimate origin and needs separate safe-rendering controls.

**Q40. What makes abuse controls complete?**

They budget expensive endpoint work, aggregate capacity, principal and network fairness, and response policy. Per-user request limits can sum to far more than global capacity. Logs and alerts need bounded meaningful context without secrets. Credential containment and tested revocation complete the failure trace.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** •• Trace a valid user requesting another tenant object.

**E2** • Count the illustrative session token bits and space.

**E3** • Count raw session record bytes.

**E4** •• Show the fixation-resistant login transition.

**E5** •• Explain logout after a token copy leaked.

**E6** •• Validate a signed JWT for the wrong audience.

**E7** • Compute the illustrative encoded JWT length.

**E8** • Compute residual acceptance under a five-minute expiry-only policy.

**E9** • Compute illustrative refresh duration.

**E10** • Compute old verification-key overlap in the chosen rotation exercise.

**E11** •• Trace intercepted authorization code under PKCE.

**E12** •• Explain why a browser bundle cannot hide a client secret.

**E13** • Count the role-permission administration grid.

**E14** • Count illustrative ACL entries.

**E15** •• Handle queued work after permission revocation.

**E16** •• Describe TLS termination at an edge.

**E17** • Compute the chosen ciphertext format overhead.

**E18** •• Explain wrapping-key rotation versus data-key rotation.

**E19** • Compute idealized password verification capacity.

**E20** • Compute active hashing memory for four workers.

**E21** • Compute signed request expiry.

**E22** •• Trace CSRF despite a response CORS block.

**E23** • Compute maximum aggregate policy admissions for fifty thousand users.

**E24** • Count rejected attempts in the simple login limit example.

**E25** ••• Respond to a leaked scoped API key without leaking it again.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Resolve the authenticated principal and trusted tenant eight. Load the resource within permitted scope and compare its stored tenant seven. Deny absent an explicit valid cross-tenant grant. Do not accept a client header claiming tenant seven or infer permission from a known ID.

**E2.** Thirty-two bytes times eight gives 256 bits. The possible byte-string space is two raised to 256. This is counting an assumed random representation, not guaranteeing a deployment secure against copying or weak generation.

**E3.** Fifty thousand records times two hundred bytes gives ten million bytes. Indexes, replication, runtime overhead, and audits are additional. The store policy also determines revocation consistency and outage behavior.

**E4.** Token A identifies an anonymous pre-login session. Successful login creates token B for the authenticated principal and invalidates A under the transition rule. An attacker knowing A does not gain B. Cleanup and concurrent old requests must follow the same boundary.

**E5.** Invalidate the server session record in the chosen scope and clear the browser cookie. The copied token then fails current validity checks. Deleting the browser copy alone cannot affect the leaked copy. Caches need a stated residual revocation delay.

**E6.** Verify its allowed protection using trusted issuer material, then compare the audience to the intended API. Reject the wrong recipient even if signature and expiry pass. Resource authorization follows only after appropriate token acceptance.

**E7.** The chosen encoded header has forty-eight characters, payload two hundred forty, and signature forty-three. Add two dot separators to get 333 characters. Actual token length varies with content and protection.

**E8.** Five minutes times sixty seconds gives 300 seconds. Revocation just after issuance can leave almost that entire validity under local expiry-only checks. An online revocation boundary changes the result and adds state.

**E9.** Thirty days times 86,400 seconds equals 2,592,000 seconds. This is a chosen example lifetime, not a recommended credential duration. Renewal and compromise policies must independently validate the grant.

**E10.** Access validity is three hundred seconds and clock tolerance thirty. Adding them gives 330 seconds of old-key verification retention under that simplified issued-token policy. Other token lifetimes or emergency compromise require another rule.

**E11.** The initiating client created verifier V and registered challenge H(V). The interceptor has the code but not V. Redemption must supply a verifier whose recomputed challenge matches the stored value. Flow context, client, and redirect rules still apply.

**E12.** Distributed code is accessible to users and attackers. A value in the bundle is therefore not a confidential-client authentication capability. Use a reviewed public-client flow and per-attempt proof instead of treating source obfuscation as secrecy.

**E13.** Four roles times six named permissions gives twenty-four cells. This counts a policy representation, not the number of objects or runtime checks. Tenant and resource constraints can add further rules.

**E14.** A thousand objects times three assumed grants each gives three thousand entries. Group membership, expiry metadata, indexes, and replication add work and storage. Permission for one object does not generalize to another.

**E15.** Retain initiating principal, action, and resource context. At the chosen sensitive effect boundary, recheck current policy or validate a permitted bounded capability. A stale UI permission result must not become an unrestricted worker identity.

**E16.** The edge receives protected bytes, validates the configured connection context, and obtains plaintext at termination. The edge-to-app hop needs its own protection and identity assumptions. A private network does not automatically preserve the original end-to-end confidentiality.

**E17.** A million-byte plaintext plus twelve nonce bytes plus sixteen tag bytes equals 1,000,028 bytes. The exercise assumes that explicit format and excludes framing. It is not a universal encryption-size formula.

**E18.** Wrapping-key rotation can re-protect stored data keys under the supported envelope protocol without rewriting large payloads. Replacing actual data encryption keys changes a different boundary and may require reencrypting data. Keep key versions and test restores before deleting old authority.

**E19.** One hundred milliseconds per serial verification gives ten each second per worker. Four workers give forty per second under the assumption. Actual hardware, contention, and hash parameters require measurement.

**E20.** Four times sixty-four MiB gives 256 MiB. That counts selected concurrent hash memory, excluding process overhead and request queues. It is an illustrative resource assumption, not recommended cryptographic parameterization.

**E21.** Start time one thousand plus sixty seconds gives expiry 1,060 on the same time axis. Provider rules determine clock tolerance and ongoing-transfer behavior. The numeric expiry alone does not prove an active download ends then.

**E22.** The victim browser may send an eligible credentialed state-changing request triggered from another site. The server must reject missing action proof or invalid origin under its protocol. A browser later blocking response access does not undo an action already performed.

**E23.** One hundred per minute times fifty thousand gives five million per minute. Divide by sixty to obtain 83,333.333333 per second rounded. This is policy arithmetic, not expected traffic or capacity; global admission still needs a budget.

**E24.** Twenty attempts encounter a five-allowed rule in the same identity window. Five are accepted and fifteen rejected. Distributed identities and lockout abuse require further policy beyond this tiny count.

**E25.** Identify owner, permitted actions, and exposure interval using safe identifiers. Revoke or rotate the usable capability and update legitimate consumers through controlled distribution. Review relevant actions and preserve restricted audit context without raw secret values. Removing a visible log line alone leaves other copies usable.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Session creation, rotation, and lifecycle.

[JWT best practices RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html). Protection and semantic token validation.

[OAuth security RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html). Current delegated-access flow and credential security.

[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Reviewed verifier functions, salts, and work-factor concerns.

[OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Intentional authenticated-request protections.

[MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS). Browser cross-origin response rules and preflight behavior.

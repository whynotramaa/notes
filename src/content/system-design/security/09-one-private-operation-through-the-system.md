@part IX | Case study: securing one operation | We assemble identity, policy, cryptography, and browser rules in one request. A successful login is only the first boundary. We will trace a private read, a scorer command, a leaked capability, and the complete operational contract. | where:9

## 33. Follow an authorized private download

Mira requests clip 7 through a secure connection to the expected Heron host. The app resolves her current session, derives tenant membership from trusted records, and loads the clip within that scope. It checks the read grant and current object state. Only then does it issue a scoped signed download request.

The client uses that capability over protected transport to the storage or CDN endpoint. That endpoint verifies the signed conditions before returning encrypted-at-rest data through its controlled decryption path. The app records an audit event with resource, principal, decision, and correlation identity, omitting the raw session and signed URL credential.

@fig sd_security_full_read | Illustrative private-download trace. Application authorization precedes capability issuance, while storage verifies delegated request conditions.

The session, permission decision, and signed URL have different lifetimes. Revoking the session stops new issuance but may not stop an already valid capability. A private-data deletion needs to reach storage, caches, derived indexes, and retained outputs under policy. Follow the resource beyond the app's response to understand its actual exposure.

:::story Picture this
The building verifies Mira's badge, the records room checks her invitation, and an attendant gives a dated collection ticket for one package. The warehouse recognizes that ticket under its own rules. Canceling the badge later need not cancel an already issued ticket unless the system explicitly connects those lifetimes.
:::

## 34. Follow a scorer write at its effect boundary

A scorer sends an authenticated command with a stable operation ID and expected match version. The service checks tenant, scorer permission, current assignment, and editability. It validates fields and applies the command in the authoritative transaction under its idempotency and concurrency rules.

If the response is lost, the scorer retries the same operation identity and receives the prior result rather than creating another scoring action. A permission change while a queued command waits is handled by the declared effect-time policy. Session validity and idempotency do different jobs: one establishes authority, the other prevents repeated effects after uncertain completion.

@fig sd_security_full_write | Illustrative scorer write path. A valid credential cannot bypass state checks or make a new operation identity idempotent.

A failed policy or expected-version check must leave no partial score effect. Keep validation and authoritative mutation connected by a transaction or another correct concurrency rule. Returning an error after applying part of the command does not restore the boundary. The stable operation identity also records which completed result a retry should receive.

The illustrative authentication-path budget has five milliseconds of session lookup, two of membership lookup, one of local token or format work, and ten of resource/policy retrieval, totaling eighteen milliseconds. These are sizing assumptions, not benchmarks. The actual query and cache design must preserve current authorization and revocation boundaries while meeting latency.

## 35. A leaked credential has a containment trace

An API key appears in a build log. Treat it as exposed rather than merely deleting the visible line. Identify the credential owner and scope, revoke or rotate the capability, distribute new material through the controlled path, and investigate relevant usage while preserving safe audit records.

An **audit trail** records security-relevant actions and decisions with enough context to investigate them. It should include who acted, which resource or operation was involved, outcome, and a reliable correlation identity. It must not become a second store of raw passwords, access tokens, or signed URLs. Restrict its readers and retention too.

@fig sd_security_leaked | Illustrative leaked-credential response. Deleting a log line does not remove other copies or invalidate the credential.

Different capabilities need different emergency plans. Signing-key compromise can affect issued-token trust across many receivers. A single scoped API key can have a narrower owner and action boundary. Encryption-key loss can cause unreadable data rather than unauthorized writes. Classify the capability and trace its actual powers before applying a generic rotation checklist.

:::note Protect audit availability
A security decision should not blindly succeed because logging failed, nor should every optional telemetry outage block every public read. Define which actions require durable audit and how their failure path works. Buffering and retention must remain bounded and avoid storing secret values.
:::

## 36. Defend the full security design

The app distinguishes authentication from resource authorization, derives trusted scope, and denies absent grants. Sessions, JWTs, API keys, refresh credentials, and signed URLs each have explicit issuer, holder, purpose, lifetime, and revocation behavior. Cookie and browser controls address their actual threat boundaries rather than substituting for server policy.

TLS validates protected peers and names termination points. Stored encryption defines protected threats and controlled key access. Password verifiers use reviewed expensive derivation with bounded login admission. Secrets are retrieved by scoped identities, rotated under a tested transition, and omitted from logs. Abuse limits account for expensive actions and aggregate capacity.

@fig sd_security_contract | Illustrative credential lifecycle comparison. Exact provider behavior must be verified before promising immediate revocation.

:::warn Watch out
The numerical exercises count chosen costs and format sizes. They do not prescribe cryptographic strength or production hash parameters. Use current reviewed protocols and libraries, and verify deployment-specific flows and threat boundaries before relying on a security claim.
:::

:::interview Interview lens
**"What security belongs in a system design answer?"** I would trace trusted identity into a resource-specific permission check, then follow the operation through storage and delegated capabilities. Credential lifecycle, tenant isolation, protected transport, key control, safe password verification, browser request threats, and abuse budgets belong to that trace. Logs identify actions without copying secrets. I would state revocation and failure behavior rather than imply that encryption or JWT makes every boundary safe.
:::

:::key In one breath
A complete security trace connects identity to a current scoped permission and an authoritative effect. Every credential has a purpose, holder, validity, and revocation boundary. Cryptography protects stated data paths under controlled keys, while browser controls and admission rules address different threats. Test lifecycle and failure branches, and keep secret capabilities out of ordinary telemetry.
:::

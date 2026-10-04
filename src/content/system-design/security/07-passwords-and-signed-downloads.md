@part VII | Password hashing and signed URLs | We protect credentials and limited download authority. Fast hashing and bearer URLs can make a stolen copy useful for longer than intended. We will trace password verification, capacity and abuse limits, signed URLs, and object-bound permissions. | where:7

## 25. Passwords need a deliberately expensive verifier

An attacker steals a password-verifier database and tests guesses offline. A fast general-purpose hash lets the attacker try many guesses cheaply. **Password hashing** derives a verification value using a function designed to make guessing costly, often through adjustable time and memory work. It is not ordinary reversible encryption of the password.

A **salt** is a distinct random value stored with each verifier so equal passwords do not share the same derived value and precomputed work does not apply universally. The salt need not be secret. A **pepper**, where used, is additional secret material kept outside the verifier database under a managed lifecycle.

@fig sd_security_password | Illustrative verifier flow. The stored record includes the parameters needed to verify and upgrade its derivation.

[OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends reviewed password-hashing choices and discusses salts and work factors. Use current guidance and measure on deployment hardware. The exercise's hundred-millisecond and memory settings are illustrative sizing assumptions, not prescribed secure parameter values.

:::story Picture this
The verifier is a check that is deliberately costly to test repeatedly, rather than a hidden original password. A unique salt makes an attacker repeat work for each record. A secret pepper is another controlled capability, so losing or rotating it has operational consequences beyond changing a database field.
:::

## 26. Hash work needs an admission budget

Assume one password verification takes one hundred milliseconds and uses sixty-four MiB during the expensive work. One worker can complete ten verifications per second under this idealized serial assumption. Four concurrent workers give forty per second and 256 MiB of active hashing memory, before process overhead and scheduling.

A public login endpoint can trigger that work without already being authenticated. Bound concurrency and queue length, apply abuse controls, and avoid revealing whether a user exists through timing or error differences. Do not lower the hash cost casually to survive an attack; protect the admission path and review the full credential protocol.

@fig sd_security_hash_capacity | Computed illustrative sizing. These are not recommended password-hash parameters or measured benchmark results.

A login request can be rejected before expensive derivation for malformed size or format, but that path should not reveal account existence. Apply equivalent externally visible outcomes where policy requires them and measure timing behavior. Rate and concurrency controls must also cover password reset and recovery endpoints, since attackers can shift to the weakest credential-lifecycle path.

On successful login, the verifier can be upgraded to current parameters under the library's protocol. Password changes and account recovery may invalidate sessions and refresh credentials according to policy. Avoid inventing a bespoke recovery channel that bypasses stronger normal login checks. Credential lifecycle includes reset, not only verification.

## 27. A signed URL is a limited bearer capability

Mira is authorized to download clip 7. The application creates a URL whose protected fields identify the object, method, expiry, and other permitted request conditions. A **signed URL** grants limited access to a resource to a holder who presents the valid signed request under the storage or delivery system's protocol.

The app checks Mira's current resource permission before issuing it. The storage or CDN verifies the signature and conditions before serving data. It need not know Mira's full session if the capability is the chosen delegation boundary. Anyone obtaining that URL may be able to use it during its validity, so treat it as a credential rather than ordinary public text.

@fig sd_security_signed | Illustrative direct-download flow. Object and method scope are part of the protected request conditions.

The illustrative signer starts at time 1,000 with a sixty-second validity, giving expiry 1,060 on the same time axis. Expiry bounds acceptance under the protocol's check, not necessarily an already active download's complete lifetime. Verify the provider's rule for ongoing requests, clock tolerance, cancellation, and revocation before making a stronger promise.

:::note Signed and private are not synonyms
A signed URL can limit who has a usable capability only by controlling distribution and validity. It does not bind to a user identity unless the protocol and request policy do so explicitly. Referer, logs, chat sharing, and analytics can expose the URL, so avoid collecting it unnecessarily.
:::

## 28. Upload grants need limits too

The service authorizes an upload into a controlled object key rather than giving the client unrestricted bucket credentials. The grant can restrict method, target, size, type checks, checksum expectations, and expiration under the provider's supported mechanism. **Upload validation** checks that the resulting stored content meets product and safety rules before it becomes publicly available.

A client-selected filename does not choose arbitrary server paths or overwrite another user's object. Use a server-controlled identity and namespace. Claimed content type alone does not prove file contents. Quarantine or process uploads before publication where required, and keep the metadata transaction separate from successful byte transfer until completion is verified.

@fig sd_security_upload | Illustrative controlled upload path. Resource ownership and content acceptance remain application responsibilities.

Revocation of a signed capability can require object policy changes, key rotation, or other provider-specific controls. A session logout does not automatically invalidate a previously issued independent signed URL. Choose short validity and additional controls according to the resource sensitivity, and document the residual access window.

:::warn Watch out
Never construct the authorized storage key solely from a client-provided path. Bind it to a trusted owner and operation identity, and validate its allowed namespace. Signature correctness does not fix signing the wrong object or method.
:::

:::interview Interview lens
**"How do clients download files without passing them through the app?"** The app first authorizes the exact resource and issues a scoped short-lived signed request under the storage protocol. The storage or CDN verifies that capability before serving bytes. I would limit method, object, and validity and avoid logging the credential. Revocation and ongoing-transfer semantics need provider-specific verification rather than assuming logout ends the link.
:::

:::key In one breath
Password verifiers use reviewed expensive derivation with salts and explicit parameter lifecycle. Login admission protects costly anonymous work without weakening the verifier. Signed URLs delegate scoped bearer authority after application authorization. Transfer completion, content validation, publication, and independent-capability revocation have separate boundaries.
:::

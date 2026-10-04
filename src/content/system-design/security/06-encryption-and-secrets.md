@part VI | Encryption and secrets | We protect data and capabilities at rest and in motion. Encryption without key control merely moves the secret into another file. We will trace TLS identity, encrypted storage, envelope keys, and secret rotation with counted overhead boundaries. | where:6

## 21. TLS protects a named connection

A browser sends a private session over the network. **Transport Layer Security**, or TLS, protects a connection's confidentiality and integrity and supports peer authentication under its protocol and certificate validation rules. **Encryption in transit** applies such protection while data moves between defined endpoints.

The browser validates the server's certificate chain, identity name, and other required conditions, then derives session protection under the negotiated protocol. It must not accept any certificate merely because bytes became encrypted. Encryption with an attacker can still hide traffic from observers while giving the attacker the plaintext.

@fig sd_security_tls | Illustrative TLS responsibilities. Detailed protocol messages depend on the configured TLS version and are covered in the networking chapter.

TLS termination defines where plaintext becomes available. If the edge terminates TLS, the next hop needs its own protection and identity assumptions. Internal network placement does not automatically provide confidentiality or integrity. A mutually authenticated service connection can verify both peers where required, but application authorization remains another layer.

:::story Picture this
A locked courier bag protects a letter during one delivery leg, and the recipient checks which courier delivered it. If an intermediate office opens the bag, the next leg needs its own protection. Keeping the bag key beside the letter defeats the protection when both are stolen together.
:::

## 22. Encryption at rest depends on the threat

Heron stores private clips on disk or object storage. **Encryption at rest** protects stored bytes under an encryption and key-management scheme. It can protect against stolen media or an unauthorized storage-layer read, depending on where keys and decryption authority live. It does not prevent an authorized compromised application from asking to decrypt its permitted data.

An encryption boundary can exist at disk, database, object storage, or application fields. Each protects against different access paths and imposes different operational costs. Define the attacker and data exposure being reduced before saying a checkbox makes data secure. Backups and replicas need matching protection and key-recovery policies.

@fig sd_security_at_rest | Illustrative encryption-at-rest boundary. A compromised authorized decryptor remains a separate risk.

Encryption also needs integrity protection appropriate to the format. A ciphertext changed by an attacker should not become accepted unauthenticated plaintext. Use a reviewed authenticated-encryption construction and verify before interpreting data. Nonce uniqueness or other algorithm-specific conditions are operational requirements, so a storage writer must follow the library protocol rather than choose values casually.

For a chosen authenticated-encryption format in the sizing exercise, a million-byte plaintext plus a twelve-byte nonce and sixteen-byte tag produces 1,000,028 stored bytes before other framing. This arithmetic describes the stated format, not every cipher. Use reviewed libraries and safe nonce handling; do not implement a new cipher or substitute an ordinary hash for encryption.

## 23. Envelope encryption separates data and key protection

A large clip is encrypted with a **data encryption key**, a key used for that data's encryption. A separate **key encryption key** protects or wraps the data key. **Envelope encryption** stores ciphertext and the protected data key while a key-management service controls the wrapping authority.

The application obtains or unwraps the data key under policy, decrypts the authorized data, and avoids retaining plaintext keys longer than necessary. Rotating a wrapping key can sometimes rewrap data keys without rewriting all large payloads, under the system's protocol. Rotation of the actual data key requires a different data transition.

@fig sd_security_envelope | Illustrative envelope-encryption responsibilities. Stored metadata connects the data to the appropriate key version.

A wrapped key record should bind to its intended data and key version under the supported format. Losing that association can make a valid ciphertext impossible to decrypt or cause the wrong key to be selected. Audit key retrieval without recording plaintext keys. Restore tests must use the same identity and access path expected during an actual incident.

Availability and recovery depend on key access. Deleting a required key can make valid backups unreadable. Restrict destructive key operations, audit their use, and test restore with the actual retained key versions. Key separation helps only if identities permitted to unwrap keys are controlled and monitored.

:::note Encryption does not hide every attribute
Object size, access timing, key names, or unencrypted metadata can reveal information even when payloads are encrypted. Decide which metadata is sensitive and protect it appropriately. Do not promise complete confidentiality from payload encryption alone.
:::

## 24. Secrets need retrieval and rotation rules

An application needs a database credential and a signing capability. **Secrets management** controls how such confidential capabilities are created, stored, distributed, rotated, and revoked. A secret embedded in source or a container image can remain in many copies after its visible file is changed.

Prefer a managed retrieval or workload-identity mechanism appropriate to the environment. Grant the application only the secret or action it needs, bound access, and avoid ordinary logs or traces carrying secret values. Separate development and production credentials. A configuration loader should fail clearly when required secret context is unavailable rather than select a public default password.

@fig sd_security_secret | Illustrative secrets lifecycle. Retrieval authority and emergency invalidation are part of the design.

Rotation needs a compatibility window or an atomic switch appropriate to the credential type. Deploy readers that accept new material, change issuance or use, then revoke old authority after its permitted overlap. Emergency compromise can shorten that transition and disrupt clients. Test the procedure rather than assuming changing one environment variable updates every running process.

:::warn Watch out
Do not print environment contents while debugging a production failure. Secrets can enter terminal logs, monitoring, or support transcripts. Log identifiers, versions, and retrieval errors without exposing the capability itself.
:::

:::interview Interview lens
**"What does encryption at rest protect?"** It protects stored bytes against defined storage-access threats when the attacker lacks decryption authority. It does not stop a compromised authorized application from reading data it can decrypt. I would specify where plaintext exists, how keys are protected, and how backups restore with retained key versions. Transit TLS and application authorization protect different boundaries.
:::

:::key In one breath
TLS protects a connection to validated peers, and termination determines where plaintext exists. Encryption at rest protects against stated storage threats, while key authority limits its effectiveness. Envelope encryption separates data keys from their protection and lifecycle. Secrets need scoped retrieval, rotation, revocation, safe logging, and tested recovery.
:::

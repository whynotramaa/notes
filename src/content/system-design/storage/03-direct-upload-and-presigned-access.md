@part III | Presigned URLs and direct upload | We move large bytes directly between the client and storage while the application controls permission. Delegated upload access must be narrow enough that a leaked capability cannot change unrelated objects. We will calculate transfer cost, constrain signed requests, bound expiration, and recover interrupted sessions. | where:3

## 9. Why the application should not proxy every video
Heron's illustrative video is 5,000,000,000 bytes. If the application receives it and forwards it, the application path handles 10,000,000,000 payload bytes across ingress and egress. A small 2,000-byte control exchange is a different workload. Their ratio is 5,000,000 in this simplified byte-count exercise.

At an illustrative direct transfer rate of 10,000,000 bytes per second, upload takes 500 seconds. If the application-proxied bottleneck is 2,000,000 bytes per second, it takes 2,500 seconds. These are assumed link rates, excluding setup, retransmission, storage work, and protocol overhead.

@fig sd_storage_paths | Direct-upload architecture. The application controls the operation without proxying the complete payload.

The application creates a pending record, reserves an object identity, and returns delegated access. The client then uploads bytes to storage. Completion returns through the application so it can verify that the reserved upload met its constraints. The absence of payload proxying does not remove ownership, validation, or quota checks.

:::story Picture this
A warehouse clerk issues a delivery permit, while the truck goes straight to the loading bay. Routing the entire truck through the clerk's office would waste that office's space. The permit still identifies which delivery is authorized and where it may unload.
:::
## 10. Presigned URLs delegate a specific operation
A **presigned URL** is a request whose authorization parameters are signed by an identity with permission to perform the operation. The holder can use that delegated operation while the signature and underlying authority remain valid. It is a capability and should be handled as a secret during its usable lifetime.

For Heron, reserve a private unique upload key and sign only the required method and resource. Bind supported required headers, checksum, or content constraints when the chosen API permits them. Do not give a client general bucket credentials or a reusable key for overwriting another user's published clip.

@fig sd_storage_signed | Presigned-operation boundary. Supported constraints depend on the specific operation and signature scheme.

[S3 presigned URL documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) explains expiration and authority constraints. Presigned access is not inherently single-use. Repeated use may overwrite or repeat the permitted operation under its actual object rules, so immutable identity and state validation still matter.

:::warn Watch out
Do not log complete signed URLs in request logs, analytics, or error messages. A holder may use their delegated authority. Redacting the secret portion and keeping a separate upload identifier preserves useful diagnosis without distributing the capability.
:::
## 11. Expiration follows the underlying credential
Heron requests an illustrative 3,600-second URL lifetime, but the signing temporary credential has only 1,200 seconds remaining. The delegated authorization cannot outlive the required underlying credential. The simplified effective lifetime is the smaller value, 1,200 seconds, subject to other policy restrictions.

A 5,000,000,000-byte transfer at the assumed direct rate takes 500 seconds. Against an illustrative 600-second upload planning budget, that leaves 100 seconds. A URL expiring before the expected retry horizon can cause a partial upload to need fresh delegated access rather than forcing the client to discard all progress.

@fig sd_storage_expiry | Illustrative planning arithmetic. Request-start, ongoing-transfer, and reissued-request expiration semantics are product-specific.

Do not claim that every ongoing transfer is terminated exactly at its signed expiration. Check when the service validates the request and what happens to a reconnect after expiration. Multipart transfers make this clearer: individual part requests can obtain fresh scoped signatures while preserving the same upload session.

:::note Revocation is a separate promise
Short expiration bounds exposure but does not supply immediate application-level revocation by itself. Permission changes, credential invalidation, and storage-side policy can affect access according to their documented propagation and evaluation rules.
:::
## 12. Initiate, upload, verify, publish
The client obtains upload access but closes the tab halfway through. The database must not treat initiation as a playable clip. Use a state machine such as pending, uploaded, verified, processing, and published, with failed or expired states where necessary.

Initiation records ownership and expected content constraints. Upload completion confirms storage state under the reserved identity. Verification checks length, checksum type and value, and required inspection. Processing creates derived immutable objects. Publication changes the database pointer only after its required objects and facts are ready.

@fig sd_storage_states | Simplified publication states. Heron's processing stage can occur between verification and publication when renditions are required.

@fig sd_storage_completion | Direct-upload sequence. A completion request is a claim to verify, not proof supplied by the client.

Make each transition idempotent under its upload identity. A duplicate completion call should recover the same state rather than start duplicate conversions or create duplicate metadata. Retain unfinished reservations long enough for recovery, then reclaim them through a safe cleanup rule.

:::interview Interview lens
**"How do you bypass the app for file bytes safely?"** The app authenticates the owner, reserves a private unique object identity, and issues narrow delegated access. The client sends bytes directly, then the app verifies the reserved object and advances an idempotent publication state. Expiration, replay, inspection, quota, and orphan cleanup remain explicit responsibilities.
:::
:::key In one breath
Direct upload separates permission and metadata from bulk transfer. A presigned request grants narrow temporary authority and is not automatically single-use. Underlying credentials and storage policy bound its usable lifetime. Upload initiation, byte completion, verification, processing, and publication are separate recoverable states.
:::

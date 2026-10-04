@part V | Checksums and integrity | We detect changed bytes and distinguish integrity from ownership and content safety. A matching client claim is useful only when the expected value belongs to the intended object. We will compare concrete digests, define checksum scope, verify downloads, and inspect multipart identity. | where:5

## 17. A checksum detects a changed byte sequence
Heron stores a score-export payload `Heron:7:120`. Its ASCII encoding has 11 bytes. Changing the final score character produces `Heron:7:121`, also 11 bytes, so length alone cannot detect the difference. A **checksum** is a compact value computed from bytes to help detect changes under a chosen error or adversary model.

The numeric script computes SHA-256 for both payloads. Their digests begin `5eae8f64` and `09a87f96`, respectively. It also computes CRC32 values 4,221,786,988 and 2,359,585,786. These are computed examples; neither equal length nor a filename can substitute for checking the intended byte content.

@fig sd_storage_digest | Computed ASCII payload examples. Digest prefixes are for display, not a sufficient production comparison.

A cryptographic hash addresses stronger collision and adversarial requirements than a simple error-detection checksum, but a hash supplied by the same untrusted uploader does not prove the content is authorized or safe. Integrity asks whether bytes match the intended bytes; permission and inspection ask different questions.

:::story Picture this
A package weight catches a missing heavy item but cannot distinguish two equal-weight items. A detailed inventory fingerprint can detect different contents, yet it still does not prove the sender had permission to ship them. Length, integrity, and authorization need different evidence.
:::
## 18. Bind the expected value to the upload
The client reports checksum X during initiation, then uploads different bytes and reports checksum Y on completion. If Heron accepts the changed claim without comparison, it has not checked the reserved upload. Retain the expected algorithm, checksum value, and length with the upload identity.

Constrain the delegated operation when supported so storage validates the claimed checksum. On completion, compare observed verified attributes with the reservation. If the chosen multipart checksum is composite, its meaning and part layout need to match the expected representation. Do not compare checksums with different scopes just because both look like hex strings.

@fig sd_storage_binding | Checksum binding. The trusted expected value and observed verified value must refer to the same content scope.

The expected value may still originate from the client for transfer integrity. That is acceptable when the goal is detecting corruption between the client's chosen bytes and storage. For a trusted signed source or fixed server artifact, expected evidence should come from that trusted publisher instead. State which integrity problem you are solving.

:::warn Watch out
Checking that the upload matches its uploader's own hash does not establish that the uploader sent harmless content. Scanning, format validation, authorization, and integrity are independent requirements.
:::
## 19. ETag is not a universal content digest
A service returns an **ETag**, an entity validator associated with a representation. Do not assume its format always equals a whole-object MD5 digest. Multipart construction, encryption, and product rules can change that relationship.

S3's [checksum documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html) distinguishes full-object and composite checksums and documents multipart ETag limitations. Use the explicit supported checksum fields with a known algorithm and scope. An ETag can still be useful for conditional retrieval without being the integrity value your application expected.

@fig sd_storage_etag | Distinct uses. Some product cases relate these values, but the relationship must be verified.

When copying or reassembling objects, checksum representation can change while bytes remain equal. Keep the checksum's type and scope beside its value in metadata. A migration that compares only raw strings can falsely reject equal content or falsely accept incompatible evidence.

:::note Checksum choice
Pick the algorithm supported end to end and appropriate to the error model. Verify its exact API behavior rather than writing a generic rule that every multipart checksum is computed over concatenated full bytes.
:::
## 20. Verify reads and bound verification work
The upload passed checks, but a later worker reads media for conversion. Verify the retrieved content according to its trusted metadata when the workflow requires end-to-end integrity. Stream the checksum calculation as bytes arrive rather than making a second full in-memory copy.

A range read can retrieve an illustrative 1,000,000-byte sample from a 5,000,000,000-byte object. That is 0.0002 of the object, or 0.02%. At the assumed 10,000,000 bytes per second it transfers in 0.1 seconds before overhead. A whole-object checksum cannot be recomputed from that tiny range alone.

@fig sd_storage_range | Illustrative bytes and bandwidth. Partial-content integrity needs matching trusted range or chunk evidence.

Chunk-level trusted hashes can validate independently retrieved pieces, but that adds a manifest and its own authenticity requirement. The manifest becomes authoritative metadata. A complete design accounts for its storage, transfer, versioning, and association with the exact immutable object.

:::interview Interview lens
**"How would you verify a large upload?"** I retain expected length and checksum scope under the reserved upload identity, use storage-side verification where supported, and compare trusted completion evidence before publication. I do not treat ETag as a universal whole-content hash. Downstream reads use matching immutable identity and verification scope, with separate content-safety checks.
:::
:::key In one breath
Length and checksum detect different changes, while authorization and content safety need separate evidence. Bind algorithm, scope, and value to the intended upload identity. An ETag is not a universal whole-object digest. Stream verification and ensure a range or chunk check proves exactly the byte scope its trusted evidence covers.
:::

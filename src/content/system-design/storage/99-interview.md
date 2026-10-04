@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. What makes local storage unsuitable as the only clip copy?**

Its lifetime and recovery follow the host or execution environment. A replacement worker may not have the bytes. Use it for scratch or reconstructable state unless its actual persistence contract meets the publication promise.

**Q2. What does block storage expose?**

Addressable blocks, often as a device-like volume. A filesystem or database supplies higher-level names and transactions. Volume durability does not by itself establish application commit semantics.

**Q3. What does file storage add?**

A namespace and file operations with their supported visibility and locking rules. Shared access needs documented protocol semantics. A familiar path is not evidence that every remote filesystem behavior matches a local one.

**Q4. What does object storage expose?**

Named objects and object operations through an API. Complete immutable media fits that interface well. It does not automatically provide partial in-place filesystem updates or a transaction with a separate database.

**Q5. Why use a metadata database beside object storage?**

Permissions, relationships, processing state, and queries are small structured facts. Large byte transfer and retention can use a separate bulk path. Explicit publication states handle the coordination gap.

**Q6. What are bucket and key?**

The bucket is an administrative object container or namespace. The key names an object within it. Knowing the address does not establish permission.

**Q7. How does object metadata differ from application metadata?**

Object attributes describe stored bytes, while application state describes ownership, visibility, and relationships. Client-supplied attributes still need validation. Neither set replaces the other's operations.

**Q8. Why choose immutable object identities?**

Readers, workers, and retries stay attached to the same bytes. Publication changes a database pointer instead of overwriting content underneath them. Retention and cleanup must manage old identities deliberately.

**Q9. Does versioning remove retention planning?**

No. Full old versions can multiply stored bytes and have their own deletion policy. References must specify the version they mean. Recovery depends on actual usable retained versions.

**Q10. Is every object API eventually consistent?**

No. Check the chosen product, bucket type, and operation. A strong completed-object read still does not transact with application metadata or prove a remote copy is current.

**Q11. Why avoid proxying large uploads through the app?**

It makes application capacity carry bulk ingress and egress rather than small control operations. Direct transfer separates those workloads. Permission, quota, verification, and publication still belong to the application.

**Q12. What is a presigned URL?**

It delegates a signed operation under the signer's authority for a bounded usable period. Scope method, resource, and supported constraints. Treat it as a secret because the holder can use that authority.

**Q13. Is presigned access single-use?**

Not inherently. Repeated use follows the permitted operation and storage semantics. Unique immutable reservations and explicit state prevent it from becoming an unintended overwrite or publication path.

**Q14. What limits presigned lifetime?**

The requested expiration, underlying credential lifetime, and applicable storage policy. A temporary credential can expire sooner than the requested URL lifetime. Ongoing-transfer and reconnect behavior need product-specific verification.

**Q15. Why keep pending upload state?**

Initiation does not prove bytes exist or are safe to publish. Pending state retains owner, expected attributes, and reserved identity for recovery. Later verification and processing determine publication.

**Q16. What does multipart upload solve?**

It allows independently transferable and recoverable parts under one session. A failed part can be retried without every byte. Explicit completion assembles the intended object but does not publish application metadata.

**Q17. How many illustrative parts does Heron use?**

Five billion bytes divided by one hundred million gives fifty parts. The division is exact, so the final part is the same size. A nonexact division would round the part count upward.

**Q18. What is the multipart completion manifest?**

It is the ordered part evidence required by the storage API to assemble the object. Retain correct session and part identifiers. A partial local list or stale response is not sufficient proof of intended completion.

**Q19. Does parallel upload multiply link bandwidth?**

No. Concurrent parts share a fixed saturated link. Parallelism may hide per-request waits or improve utilization, but it can also increase memory, sockets, and retries. Measure the actual bottleneck.

**Q20. How do you clean abandoned multipart sessions?**

Abort them after the supported resume horizon under an explicit ownership rule. Distinguish unfinished parts from completed unpublished objects. Reconciliation must not delete valid published replacements.

**Q21. Why is length insufficient for integrity?**

Different payloads can have equal length. The two illustrative score strings each have eleven bytes but distinct computed hashes. Use the appropriate full checksum and trusted scope.

**Q22. Does matching the uploader's hash prove safety?**

No. It can prove that storage received the bytes the uploader intended under the transfer model. Authorization, format inspection, and malicious-content handling are separate checks.

**Q23. How should expected checksums be retained?**

Store algorithm, value, scope, length, and upload identity together. Compare verified completion evidence with that reservation. A changed completion claim must not silently rewrite the expectation.

**Q24. Why is ETag not a universal hash?**

It is a representation validator with product-specific semantics. Multipart and encryption can change its relationship to a whole-object digest. Use explicit supported checksum fields for integrity.

**Q25. Can a range read verify a whole-object checksum?**

Not by itself. It observes only part of the bytes. Trusted chunk or range evidence can verify that scope, but its manifest must be authentic and attached to the exact immutable object.

**Q26. What does replication factor tell you?**

It counts copies in a stated model. Placement, acknowledgement, consistency, integrity, and repair determine the actual guarantee. Shared causes can defeat every copy.

**Q27. What does erasure coding trade?**

It uses derived parity pieces to reduce physical space compared with full copies. Reconstruction and repair can require several pieces and extra network work. The code and placement determine the tolerated loss.

**Q28. What does a distributed filesystem coordinate?**

The namespace, data locations, ownership, and recovery of pieces across machines. Metadata and data transfer can have different owners. Product-specific file semantics remain necessary.

**Q29. Why do remote copies need metadata recovery too?**

Bytes are not useful unless the application can find and authorize the intended version. A pointer to absent bytes is also unusable. Reconcile both sides before publishing recovery state.

**Q30. What is a lifecycle policy?**

It transitions or expires objects according to supported rules. It affects every retained version and unfinished state covered by those rules. Storage class can change retrieval readiness as well as price.

**Q31. Why can archived existence differ from playback availability?**

Some tiers require restoration before ordinary retrieval. The app needs explicit restore or availability state. A signed URL alone cannot make unretrievable bytes playable.

**Q32. How does application deletion cross services safely?**

Record a deletion state and exact identities in the database, stop new access, then retry storage cleanup idempotently. Previously issued capabilities, cached copies, and recovery retention need separate policy. Do not infer current mutable keys during an old cleanup retry.

**Q33. What does a reconciler do?**

It compares retained states across owners and repairs stranded gaps through bounded idempotent actions. It can complete publication, abort stale sessions, or finish tombstoned cleanup. It uses exact identities rather than assumptions about missing replies.

**Q34. Do notifications replace reconciliation?**

Only if their actual contract supplies all required loss and duplicate handling, which should be verified. A notification can accelerate the fast path. A retained-state scan can recover events the fast path did not resolve.

**Q35. How do you recover a lost completion reply?**

Inspect the exact reserved object and existing application state. Verify length and checksum scope, then return or advance the same operation. Creating a fresh upload identity can hide an orphan and duplicate work.

**Q36. How do conversion retries avoid duplicate publication?**

Tie processing identity to source version and recipe, retain output identities, and use idempotent state transitions. Recover verified outputs where possible. Publication changes the intended pointer once rather than accepting any similarly named object.

**Q37. Which storage totals should be counted separately?**

Logical payload, allocation, redundancy, metadata, old versions, incomplete parts, temporary work, and restore copies. Traffic bytes are another quantity. Do not add mutually exclusive redundancy models or count every live delivery as retained original data.

**Q38. Why is storage size alone insufficient for capacity?**

Request patterns, bandwidth, size distribution, verification, repair, and metadata coordination can dominate. A large but cold archive differs from a hot upload service of equal bytes. Test the actual operations and failure paths.

**Q39. Walk me through the complete media path.**

Authenticate and reserve private immutable identity, send bytes directly through a scoped multipart session, then verify and process. Publish through the metadata database and issue playback access only for allowed state. Reconcile interrupted transfer, publication, deletion, and recovery under retained identities.

**Q40. What changes from a local file upload to this design?**

State and bytes have separate owners, delegated transfer bypasses application bandwidth, and completion becomes a recoverable protocol. Immutable identities, checksums, lifecycle, and remote recovery are explicit. That replaces dependence on one worker's directory with a named service contract.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** ● Compute the illustrative multipart count.

**E2** ● Compute the last inclusive byte range.

**E3** ● Compute ideal direct upload duration.

**E4** ● Compute the application-proxied bottleneck duration.

**E5** ● Compute application ingress plus egress payload.

**E6** ● Compute the single-failed-part retransmission reduction.

**E7** ● Compute three-copy media payload.

**E8** ● Compute abandoned storage for ten sessions with two parts each.

**E9** ● Compute metadata payload for the illustrative retained clip population.

**E10** ● Compute the simplified presigned lifetime.

**E11** ●● Compute block allocation and padding for the upload.

**E12** ●● Compute the four-data, two-parity model.

**E13** ●● Compute hot and other-tier media retention.

**E14** ●● Trace the parallel part bandwidth model.

**E15** ●● Compute the event and record storage models separately.

**E16** ●● Explain direct upload without equations.

**E17** ●● Explain backup versus replication without equations.

**E18** ●● Explain why object metadata does not replace the database.

**E19** ●● Compute the range fraction and ideal transfer time.

**E20** ●● Recover a completed object whose application publication failed.

**E21** ●●● Prove the part ranges have neither a gap nor overlap.

**E22** ●●● Derive the retention population and its assumptions.

**E23** ●●● Write streaming checksum verification for a fixed source.

**E24** ●●● Design idempotent deletion across metadata and storage.

**E25** ●●● Count the complete one-video storage and traffic design.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Divide 5,000,000,000 by 100,000,000 to obtain 50. No rounding remainder exists, so every part including the last contains 100,000,000 bytes.

**E2.** The final start is 49 times 100,000,000 = 4,900,000,000. The final inclusive endpoint is total size minus one, or 4,999,999,999. Their difference plus one is 100,000,000.

**E3.** Divide 5,000,000,000 bytes by 10,000,000 bytes per second to obtain 500 seconds. Setup and protocol overhead are excluded.

**E4.** Divide the same size by assumed 2,000,000 bytes per second to obtain 2,500 seconds. This is an illustrative bottleneck comparison, not a benchmark.

**E5.** The application receives 5,000,000,000 and sends 5,000,000,000. Their sum is 10,000,000,000 payload bytes. Protocol and extra copies are excluded.

**E6.** Whole retransmission is 5,000,000,000 bytes while one failed part is 100,000,000. Their ratio is 50. This counts retransmitted payload, not total speedup.

**E7.** Multiply the 5,000,000,000-byte logical object by three. The result is 15,000,000,000 bytes before metadata and temporary states.

**E8.** One session holds 2 times 100,000,000 = 200,000,000 bytes. Ten hold 2,000,000,000. An abort policy must respect the supported resume horizon.

**E9.** The population is 100 clips per day times 30 days = 3,000. Multiply by 500 bytes per record to obtain 1,500,000 bytes. Index and database overhead are additional.

**E10.** Take the smaller of requested 3,600 seconds and remaining credential 1,200 seconds. The result is 1,200. Other policy and request-evaluation rules still apply.

**E11.** Round 5,000,000,000 divided by 4,096 upward to 1,220,704 blocks. Multiplication yields 5,000,003,584 allocated bytes. Subtract logical size to obtain 3,584 bytes of padding under this simplified model.

**E12.** Each data shard holds 5,000,000,000 divided by 4 = 1,250,000,000 bytes. Six shards total 7,500,000,000. Physical/logical ratio is 1.5; reconstruction from any four is an explicit code assumption.

**E13.** Seven days at 100 clips per day and 5,000,000,000 each gives 3,500,000,000,000 bytes. Twenty-three days gives 11,500,000,000,000. The sum is 15,000,000,000,000 for the full thirty-day population.

**E14.** Five parts share 10,000,000 bytes per second, so each gets 2,000,000. A 100,000,000-byte part takes 50 seconds. A group carries 500,000,000 bytes in 50 seconds; ten groups take 500 seconds, ignoring overhead.

**E15.** Events use 20 times 200 times 86,400 = 345,600,000 bytes per day, and thirty days gives 10,368,000,000. Records use 8,640,000 times 500 = 4,320,000,000 daily, thirty days gives 129,600,000,000, and three copies give 388,800,000,000. They are distinct workloads.

**E16.** The application validates the owner and reserves a private immutable object identity. It gives narrow delegated access so the client sends bytes directly to storage. Completion returns through the application for verification and publication state.

**E17.** Replication maintains serving copies and can copy a destructive change. A recovery copy preserves usable earlier state under its retention and access rules. Both need verification, but they protect different incidents.

**E18.** Object attributes describe bytes under the storage API. The database queries permissions, match relationships, and publication state. Keeping those facts separate needs an explicit recoverable protocol because the services do not share a transaction.

**E19.** Divide 1,000,000 by 5,000,000,000 to obtain 0.0002, or 0.02%. Divide 1,000,000 by the assumed 10,000,000-byte-per-second rate to obtain 0.1 seconds. The range does not establish the whole-object checksum.

**E20.** Use the retained upload reservation to inspect the exact immutable object. Compare its verified length and checksum scope with expected state, then advance the original publication transition idempotently or reclaim under the documented expiry rule. Do not create a new clip merely because the old reply was absent.

**E21.** For zero-based part index i, start is i times part size and inclusive end is the smaller of total size minus one and the next start minus one. The following part starts exactly one byte after the prior end while full parts remain. The final bound ends at total size minus one, so every logical byte belongs to exactly one part.

**E22.** With a constant arrival rate, no earlier deletion, and retention duration T, retained count is arrivals per day times T days after steady state. Multiply by per-object logical size for payload. Versions, incomplete sessions, renditions, irregular arrivals, and replicas violate a single-population simplification and must be counted separately.

**E23.** Retain the trusted expected checksum and read the exact immutable source.

```python
import hashlib
def verify(chunks, expected_digest, expected_size):
    digest = hashlib.sha256()
    size = 0
    for chunk in chunks:
        digest.update(chunk)
        size += len(chunk)
    if size != expected_size:
        raise ValueError("unexpected length")
    if digest.hexdigest() != expected_digest:
        raise ValueError("checksum mismatch")
    return True
```

This verifies the full streamed scope, not permission or content safety. The numeric ledger separately checks the computed illustrative payload digests.

**E24.** Commit a tombstone and exact object/version identities, stop issuing new access, then enqueue retained cleanup work. Retry deletion under those recorded identities until verified completion. Keep cache, old signed access, recovery-copy retention, and legal policy explicit; do not delete whichever mutable key happens to be current.

**E25.** Logical bytes are 5,000,000,000 with 50 parts. Three full copies would be 15,000,000,000, while the alternative coding model is 7,500,000,000; they are alternatives. Application proxying would move 10,000,000,000 ingress-plus-egress bytes, whereas direct upload uses the small control path. Versions, renditions, unfinished parts, and verification reads are separate retained or transferred quantities.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[Amazon S3 object model and consistency](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html). Concrete object, bucket, key, and operation guarantees.

[S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html). Delegated request scope, expiration, and credential lifetime.

[S3 multipart lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html). Initiation, part transfer, completion, and unfinished-session cleanup.

[S3 upload checksums](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html). Full and composite checksum scope and ETag limitations.

[S3 lifecycle management](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html). Supported transitions and expiration actions.

[The Google File System](https://research.google/pubs/the-google-file-system/). A concrete distributed-filesystem design and its workload-dependent trade-offs.

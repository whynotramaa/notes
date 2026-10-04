@part VII | Lifecycle and retention | We decide how long source bytes, derived bytes, versions, and unfinished transfers remain. Moving data to another tier can change retrieval behavior as well as cost. We will compute retention totals, make deletion explicit, recover orphaned states, and preserve operational evidence. | where:7

## 25. Lifecycle policies move or expire objects
Heron keeps a clip for the illustrative 30-day retention period, but most reads happen early. A **lifecycle policy** applies actions such as storage-class transition or expiration according to object age, tags, or other supported rules. It changes the retained object population over time.

Assume an additional illustrative media workload of 100 clips per day, each 5,000,000,000 bytes. Thirty days retains 3,000 clips and 15,000,000,000,000 payload bytes. If 7 days remain in a hot tier, that population holds 3,500,000,000,000 bytes, while the remaining 23 days hold 11,500,000,000,000 in another tier.

@fig sd_storage_lifecycle | Illustrative clip workload and decimal units. Replication, metadata, versions, and incomplete parts are additional.

[S3 lifecycle documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) describes supported transition and expiration actions. A selected class can require restoration or different access charges. Do not quote prices from memory; a design can compare bytes and retrieval requirements without inventing a current bill.

:::story Picture this
An archive moves old boxes out of the reading room to a warehouse. Space in the reading room falls, but retrieving an old box now has another step. A cheaper storage location can change the user's waiting experience.
:::
## 26. Retrieval behavior is part of the policy
A viewer requests an archived clip and the app returns a signed URL immediately. If the selected storage tier requires a restore first, the link may not supply playable bytes yet. Retention policy must coordinate with playback availability and the application state.

Represent archival or restore progress explicitly. Heron can show that a clip is retained but not immediately playable, start a permitted restore request, and publish availability only when the object is retrievable. A cached rendition may provide a limited alternative, but it has its own age, availability, and authorization contract.

@fig sd_storage_archive | Retrieval-state concept. Exact restore duration and access behavior depend on the selected tier.

The storage calculation should count source, renditions, old versions, restore copies, and transfer buffers separately where they coexist. A lifecycle transition does not delete every derived object automatically. Associate each derived identity with its source and policy so cleanup can decide what is still needed.

:::warn Watch out
Applying an age rule to one prefix can leave versions, renditions, or incomplete multipart parts outside the intended retention contract. Test the policy against every retained state, not just the published source object.
:::
## 27. Delete through a recoverable application state
A user deletes clip `c7`. If the object disappears before metadata changes, the app may still offer a broken playback link. If metadata disappears first and storage deletion fails, bytes remain orphaned. There is no single shared transaction across those owners.

Commit a deletion state or tombstone in the database, stop issuing new playback access, and perform storage cleanup under a retained idempotent job. Record the exact immutable identities or versions to delete. A worker retry should not infer the current key and accidentally remove a replacement upload.

@fig sd_storage_deletion | Recoverable deletion sequence. Previously issued capabilities and cached bytes require their own revocation or expiry policy.

Deletion is a security and product promise as well as space reclamation. Retained backups, legal retention, version histories, and already-issued access may affect what disappear means. State these boundaries instead of assuming a successful object delete instantly erases every copy and cached response.

:::note Derived-object ownership
A conversion manifest can record every output identity. It lets deletion and retry refer to the original outputs rather than a mutable prefix. Keep that manifest associated with the processing command and source version.
:::
## 28. Reconciliation finds stranded states
A worker completes storage upload but crashes before publishing metadata. Another fails after marking deletion but before deleting bytes. A **reconciler** compares retained state across owners and repairs mismatches through idempotent actions. It is a designed recovery path, not a speculative cleanup script.

For each pending upload, ask whether the exact reserved object or multipart session exists and is still within its supported lifetime. For each published record, verify required object identities according to the chosen audit policy. For each tombstone, finish recorded cleanup. These scans need bounded batches and indexes so they do not overload normal serving.

@fig sd_storage_reconcile | Reconciliation matrix. An old pending record alone is not proof that a published replacement can be deleted.

A notification can speed discovery, but notifications need deduplication and loss recovery according to their actual delivery contract. Periodic reconciliation catches states not resolved by the fast path. Keep command evidence long enough that retries and cleanup can distinguish completed work from new work.

:::interview Interview lens
**"How do you prevent storage and metadata from diverging?"** I make the divergence states explicit rather than claiming they never occur. Upload, publication, deletion, and cleanup use stable identities and idempotent transitions. A bounded reconciler repairs stranded states after crashes or lost notifications, while access is issued only for the permitted publication state.
:::
:::key In one breath
Lifecycle policy governs every retained state, not only current published objects. A tier transition can change retrieval readiness and must fit playback behavior. Deletion records exact identities before asynchronous cleanup, with explicit cached-access and recovery-copy boundaries. Reconciliation repairs cross-service gaps using state and idempotent actions rather than assuming one transaction exists.
:::

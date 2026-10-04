@part VIII | Case study: the media upload path | We now trace the clip from permission through transfer, verification, storage, and playback. Each state has a specific owner and a recovery rule. We will reconcile the byte budget, follow interrupted completion, and explain what every component contributes. | where:8

## 29. A complete upload trace
The uploader asks Heron to reserve clip `c7`. The app authenticates ownership, checks policy, creates pending metadata, and chooses an immutable source identity. It returns scoped upload access, while the client sends 50 illustrative parts directly to storage for the 5,000,000,000-byte clip.

After completion, the app verifies the reserved length and checksum scope. Conversion workers read the exact immutable source, use temporary local storage, and create derived immutable outputs. Publication atomically changes the database's active clip state and output pointer. The object service never decides match ownership on the application's behalf.

@fig sd_storage_fullupload | End-to-end upload. Each arrow crosses a separate failure and ownership boundary.

@fig sd_storage_ownership | Architecture summary. CDN delivery follows publication and keeps its own cache and access rules.

A viewer receives playback access only after the database permits it. That access may point through a CDN rather than directly to origin storage. The next chapter examines whether cached bytes are fresh and authorized, and how edge and origin behavior changes the load model.

:::story Picture this
A publisher receives a manuscript, checks it, produces print files, then adds the finished edition to its catalog. Having a file in a warehouse is earlier than offering the book for sale. Heron's pending object and published clip have the same distinction.
:::
## 30. Interrupted completion and idempotent recovery
The client completed multipart transfer, but its final response was lost. A retry asks about the same upload identity. The app verifies the exact completed object, advances the existing state if needed, and returns the already-known result. It does not create a new object because the previous reply was absent.

A conversion message can also be delivered again. The worker uses a processing identity tied to source version and output recipe. It can recover existing verified outputs and complete publication once. It must not accept an output from a different source merely because a familiar key exists.

@fig sd_storage_retrycomplete | Idempotent completion trace. Storage evidence and application state refer to the same immutable identity.

Cleanup must coordinate with this recovery horizon. Expiring the reservation before supported retries end can make the app misclassify legitimate completed bytes as abandoned. Retaining it indefinitely wastes state. The contract chooses a bounded horizon and the numeric and failure tests verify behavior around its endpoints.

:::warn Watch out
Retrying completion with a new clip identity hides the uncertain old object and creates an orphan. Recover the original operation first. A repeated user action that intentionally uploads a new clip is a different operation.
:::
## 31. Reconcile all byte budgets
The shared illustrative database write model is 8,640,000 records per day at 500 bytes, giving 4,320,000,000 bytes daily. Thirty days gives 129,600,000,000, and three full copies give 388,800,000,000. This is a database workload, not the separate 100-clips-per-day media assumption.

The shared event workload is 20 events per second at 200 bytes, giving 345,600,000 bytes per day. Thirty days gives 10,368,000,000 before replicas and indexes. A live fan-out copy delivered to every viewer should not be counted as a separate retained original unless the system actually stores each delivery.

@fig sd_storage_baseline | Computed shared Heron assumptions. Media storage is a separate explicitly illustrative extension.

@fig sd_storage_mediabudget | Alternative illustrative physical and traffic budgets. Do not add mutually exclusive redundancy models together.

Capacity tests need request rate, object size distribution, transfer bandwidth, incomplete-upload population, verification work, conversion cost, and repair traffic. A storage total alone cannot predict upload time, and a fast link alone cannot establish durable publication.

:::note What the numbers exclude
The ledgers distinguish logical payload from allocation, redundancy, metadata, protocol overhead, versions, temporary parts, and restored copies. Those excluded terms belong in a production measurement rather than an invented percentage overhead.
:::
## 32. The interview design and its boundary
At the whiteboard, draw metadata through the app to the database and file bytes directly to object storage. Then annotate the upload-state machine, scoped access, checksum verification, multipart session, and immutable publication pointer. Show how each crash is recovered under the same identity.

Compare a local disk, a block volume, a shared file service, and an object API by their operations and failure contract. Explain how replicas or coding keep data available, how lifecycle affects retrieval, and how backups and independent metadata recovery support disaster restoration. None of these labels alone promises a cross-service transaction.

@fig sd_storage_final | Complete design checklist expressed as mechanism boundaries. Evidence must refer to the exact object and operation.

This chapter has not designed a production distributed filesystem or promised current storage prices and capacities. It has supplied the mechanisms needed to evaluate one and to build a media path without routing every byte through the app. The next boundary is content delivery, where cached bytes introduce another freshness, identity, and permission layer.

:::interview Interview lens
**"Design the storage path for large videos."** I separate small queryable metadata from bulk immutable bytes and authorize direct multipart transfer to reserved private identities. Verification and processing precede idempotent publication, while reconciliation handles cross-service crash gaps. I calculate payload, redundancy, transfer, retention, and repair separately, then explain access expiration, checksums, and recovery guarantees.
:::
:::key In one breath
Heron's media path gives every state an owner: the application authorizes, the database publishes, storage holds bytes, and workers create verified outputs. Multipart, checksums, and immutable identities recover interrupted transfer and processing. Reconcile logical bytes, physical redundancy, retained populations, and transfer traffic separately. CDN delivery begins only after the storage and publication contract is explicit.
:::

@part II | Buckets, objects and metadata | We give media bytes stable identities and keep application facts where they can be queried safely. The object name and the permission to access it are different things. We will build the object address, choose immutable versions, distinguish metadata types, and inspect consistency boundaries. | where:2

## 5. Bucket, object, key, and metadata
A worker needs to find the clip uploaded for a match. A **bucket** is an object service's container or administrative namespace. An **object** is the stored byte sequence together with object-associated attributes. A **key** names that object within the bucket. **Metadata** describes it, but the term needs its owner stated.

Heron might place an immutable source at a key such as `tenant-a/clips/c7/source-v1`. The bucket and key identify a stored object; the database separately says who owns clip `c7`, which match it belongs to, and whether viewers may play it. A predictable key is not an authorization check.

@fig sd_storage_address | Illustrative names. The application should not derive permission merely from a caller knowing the key.

The API may provide content type, size, checksums, tags, or user metadata as object attributes. Those do not replace relational queries over clip visibility, processing status, and ownership. [The S3 object model](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) is one concrete example; bucket types and guarantees must be checked rather than generalized blindly.

:::story Picture this
A library shelf address tells you where a book is stored. The borrowing record tells you whether you may take it, and the catalog tells you which edition it is. A shelf label alone does not supply the permission or the searchable catalog.
:::
## 6. Immutable keys and version identity
A viewer starts downloading a source while another upload overwrites the same key. If processing or range requests silently see different bytes, the clip can become inconsistent. An **immutable object identity** names bytes that will not be changed after publication.

Upload to a new object identity, verify it, then atomically change the database's active pointer. Old readers keep using the previous identity while new readers use the new one. Object versioning can supply another identity dimension, but application references must preserve the version they mean rather than accidentally requesting the latest bytes.

@fig sd_storage_immutable | Versioned publication. Retention determines how long old references remain valid.

The cost is retained old content and explicit cleanup. Three full illustrative versions of a 5,000,000,000-byte clip total 15,000,000,000 bytes before replication or encoding. Versioning protects earlier bytes only under its actual retention and deletion rules; it is not an excuse to ignore storage growth.

:::note Object identifiers and hashes
A content-derived key can identify equal bytes, while an application-generated identity can distinguish separate uploads with equal content. Deduplication must still respect ownership, encryption, deletion, and privacy. Equal bytes do not imply equal permission.
:::
## 7. Storage attributes versus application facts
The object reports a content type and checksum. The database reports that the clip is private and still processing. These facts answer different questions. Treat object metadata supplied by the client as input to validate, not as a statement that the bytes are safe or belong to the claimed user.

Heron records expected length, checksum type, uploader, and a reserved object identity during upload initiation. On completion it compares observed storage attributes with the reservation, then starts inspection or conversion. Only a later publication state permits viewers to obtain playback access.

For an illustrative population of 100 clips per day retained for 30 days, there are 3,000 metadata records. At the shared assumed 500 bytes per record, metadata payload is 1,500,000 bytes. Indexes, row versions, and database overhead are separate. The media bytes under the same clip assumptions are 15,000,000,000,000 bytes, so their transfer and storage paths differ dramatically.

@fig sd_storage_metabytes | Illustrative media workload added for this unit. Database and object implementation overhead are excluded.

:::warn Watch out
A filename extension, claimed content type, or client checksum does not establish that an upload is safe to execute or display. Inspect content under a bounded processing policy, and preserve private state until it passes required checks.
:::
## 8. Consistency is a product and operation property
A design claims that object storage is always eventually consistent. That generalization can be wrong for the chosen service and operations. S3's general-purpose object API documents strong read-after-write behavior for relevant object operations, but this does not create a transaction across the metadata database and the object service.

Name the operation. Reading a completed object by exact key, listing a container, retrieving metadata, changing access policy, and reading a cross-region replica may have different guarantees. Check current primary documentation and the selected bucket type rather than applying an old memory of one product to every operation.

@fig sd_storage_consistency | Consistency boundaries. Strong object reads do not atomically commit a database row.

A retry after a lost upload-completion reply can query the exact reserved identity and verify expected length and checksum. That uses the storage guarantee to recover one step. It still needs an idempotent database state transition to publish the relationship once, and must not accept another user's object merely because the key exists.

:::interview Interview lens
**"Is object storage eventually consistent?"** I check the chosen product, bucket type, and operation. Strong visibility of a completed object still does not transact with my metadata database or guarantee a remote replica is current. I keep those boundaries separate and use explicit publication states.
:::
:::key In one breath
Bucket and key locate an object, while application metadata controls ownership and publication. Immutable identity keeps readers and retries attached to the same bytes. Validate client attributes and budget retained versions. Consistency belongs to a specific storage operation; no object-read guarantee removes the separate database publication gap.
:::

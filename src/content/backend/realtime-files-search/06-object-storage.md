@part VI | Object storage | We store files in object storage and keep them out of the application server entirely. Object stores are built for enormous numbers of immutable blobs, cheap at rest and fast to serve through a CDN. We will cover the object model, presigned URLs and why large files should bypass the app, multipart uploads with checksums, and lifecycle rules with processing pipelines. | where:6

## 18. Buckets, objects and metadata

**Object storage**, popularized by Amazon S3 in 2006 and offered as Google Cloud Storage, Azure Blob Storage, Cloudflare R2 and open-source MinIO, stores data as **objects** in **buckets**. An object is a blob of bytes, from zero bytes to terabytes, plus **metadata**, its size, content type, an ETag, a last-modified time and user-defined key-value pairs, all addressed by a **key** such as `menu/9/biryani.jpg`.

The namespace is flat. Keys look like paths, and consoles display them as folders, but there are no directories. The slash is just a character, and listing "the folder" `menu/9/` means listing keys that start with that prefix. There is no rename, since renaming a "directory" means copying every object under the prefix to new keys and deleting the old ones. And objects are immutable in the sense that a `PUT` replaces the whole object, with no appending or editing in the middle.

@fig be_os_model | A bucket holds keys, each pointing at bytes and metadata. The slashes are only characters.

In return, object storage scales almost without limit, and it is durable. S3 is designed for eleven nines of durability, 99.999999999% per object per year, by storing data redundantly across several facilities. It is cheap at rest, a few cents per gigabyte per month, with colder storage classes much cheaper still. Since December 2020, S3 has offered strong read-after-write consistency, so a read after a successful write returns the new object, which removed a long-standing class of bugs. Other providers offer similar guarantees.

Object storage is the natural home for anything file-shaped, user uploads, receipts, exports, backups, logs and build artefacts, and it is a poor fit for anything that needs updates in place, queries across objects, or many tiny writes per second to one key. Wren keeps file bytes in object storage and everything about the files, who owns them, which order they belong to, their processing status, in PostgreSQL, linking the two by key.

Access control matters as much as for any database. Buckets are private by default and should stay that way. Public data is served through a CDN with an origin access identity that only the CDN can use, and private data through signed URLs, the next section, rather than through public buckets, which have been the cause of many large data leaks.

## 19. Presigned URLs, and why files should bypass the app

Wren's first upload endpoint accepted photos through the API. The phone sent 5 MB to an API server over a 10 Mbit/s uplink, which takes 5 × 8 ÷ 10 = 4 s, and the server streamed it on to object storage. For those 4 s an API worker was tied up waiting on a slow network. At 500 uploads per minute, about 8.3 per second, each holding a worker for 4 s, Little's law gives 33 workers busy doing nothing but waiting for uploads. Every byte also crossed the API twice, in and out, consuming bandwidth and, on most clouds, money.

@fig be_os_through_app | A worker held for 4 s per photo, and every byte crossing the app twice.

A **presigned URL** removes the application from the data path. The app asks the API, "I want to upload a photo for order 124". The API checks the user's permissions, generates a key, `u/42/8f3a2c91.jpg`, and returns a URL for that key, signed with the API's own storage credentials, valid for 5 minutes, and limited to a `PUT` of that one key. The phone uploads the 5 MB directly to object storage with that URL. Storage verifies the signature and expiry and accepts the bytes. The API spent a few milliseconds signing and never touched the file.

@fig be_os_presigned | The API signs a permission slip. The bytes go straight to storage, which announces their arrival.

The signature encodes exactly what is allowed. A presigned `PUT` names the key and can require headers such as content type. A presigned `POST` policy, an alternative designed for browser forms, can also restrict content length ranges, so the storage service itself rejects anything over 10 MB, and key prefixes. Expiry should be short, minutes rather than the 7 days that SigV4 allows, since anyone who obtains the URL can use it. The same mechanism signs downloads, giving a user a 10-minute link to their receipt PDF without making it public, the signed URLs of Unit VII at the storage layer.

When the upload completes, the object store emits an **event**, such as an S3 event notification to a queue, and Wren's pipeline from Part V picks it up, validates the object, and records it in the database. The client may also call the API to say it has finished, but the event is the reliable signal, since clients can crash or lie.

Uploads that bypass the app also bypass its validation, which is why the quarantine and processing steps happen after the upload, and why the presigned key lands in a quarantine prefix, `quarantine/u/42/...`, that nothing serves from.

## 20. Multipart uploads and checksums

A restaurant uploads a 5 GB kitchen video. As a single `PUT`, a dropped connection at 4.9 GB means starting again, and single-request uploads to S3 are capped at 5 GB anyway. **Multipart upload** splits the object into parts that are uploaded independently and assembled at the end.

The client calls `CreateMultipartUpload` and receives an upload id. It then uploads parts, each with `UploadPart`, a part number and the upload id, in parallel if it likes, with each part's response returning an ETag. For the video, 100 MB parts give 5,000 MB ÷ 100 MB = 50 parts. If part 17 fails, only part 17 is retried. When all parts are uploaded, `CompleteMultipartUpload` with the list of part numbers and ETags assembles them into one object atomically. On S3, parts must be at least 5 MiB except the last, at most 5 GiB, there can be up to 10,000 parts, and the final object can be up to 5 TiB.

@fig be_os_multipart | Fifty parts in parallel. One fails and is retried alone, then all are stitched together.

Each part can be presigned separately, so browsers and phones upload large files directly in parallel, with the API signing part URLs as needed. Parallel parts also speed up uploads on fast connections, since several TCP streams fill the pipe better than one.

Large transfers need integrity checks, because a corrupted byte in a multi-gigabyte upload is otherwise silent. A **checksum** computed by the client, such as SHA-256 or CRC32C, is sent with each part, `x-amz-checksum-sha256` on S3 or `Content-MD5` in older APIs, and the storage service computes the same checksum on what it received and rejects the part on a mismatch. A checksum over the whole object can be stored as metadata and verified on download, so corruption anywhere, in transit or at rest, is detected.

Incomplete multipart uploads are a hidden cost. Parts already uploaded are stored and billed until the upload is completed or aborted. Clients that crash midway leave orphaned parts behind, invisible in ordinary listings. Wren's lifecycle rules, next section, abort incomplete uploads after 7 days.

## 21. Lifecycle rules, processing and delivery

Objects accumulate. Temporary uploads that were never confirmed, old receipts, superseded image variants and logs all keep costing money. **Lifecycle rules** attached to a bucket act on objects automatically by prefix and age. Wren's rules expire `uploads/tmp/` objects after 1 day, abort incomplete multipart uploads after 7 days, move `receipts/` to an infrequent-access storage class after 30 days, since they are rarely read after the first week, and move original photos to an archive class after 90 days, keeping the derived variants in standard storage.

@fig be_os_lifecycle | Four rules: expire temporary uploads, abort abandoned multipart uploads, and move cooling data to cheaper classes.

Retention requirements cut the other way. Receipts may have to be kept for years for tax purposes, so their lifecycle never expires them, and **object lock** can make them undeletable for a fixed period, even by administrators, which protects against ransomware and mistakes. **Versioning** keeps previous versions of overwritten or deleted objects, so an accidental overwrite can be undone, at the cost of storing every version until a lifecycle rule removes old ones.

Processing hangs off storage events. When an upload lands, the `ObjectCreated` event goes to a queue. A worker validates it, Part V, then a thumbnailer generates 400 px, 800 px and WebP variants under versioned keys, `menu/9/biryani.v3.800.webp`, and writes them to a public variants bucket. The database records the variant keys and marks the photo ready, and an event tells the app to refresh.

@fig be_os_processing | An upload event triggers validation and resizing. The variants are served from the CDN for a year.

Delivery goes through the CDN of Unit VII. Variants are immutable, since a new version gets a new key, so they are served with `Cache-Control: max-age=31536000, immutable` and almost never reach the bucket after the first request. The CDN reads from the bucket through an origin identity, so the bucket stays private, and private files are delivered with signed URLs or signed cookies at the edge. The application server is not in the path of a single byte of file content, from upload to download.

:::story Picture this
A self-storage warehouse. You do not carry your boxes through the manager's office. The manager checks your booking and hands you a gate code valid for the next hour, you drive to your unit and unload, and the gate logs your visit. The warehouse moves boxes nobody has opened for a year to the cheaper basement, and throws away anything left in the loading bay overnight.
:::

:::note Content-addressed keys
Using a hash of the content as the key, `sha256/9b2c…`, deduplicates identical uploads and makes keys immutable by construction, since different bytes always get a different key. It also lets clients check whether a file already exists before uploading it. The database maps from business ids to content keys.
:::

:::warn Watch out
A presigned URL is a bearer credential. Anyone who has it can use it until it expires. Keep expiry to minutes, scope it to one key and method, require content type and length conditions where possible, and never log full presigned URLs.
:::

:::interview Interview lens
**"Why shouldn't large uploads go through your application servers, and what do you do instead?"** Uploads over slow mobile links hold workers for seconds each, 500 photos a minute at 4 s each keeps about 33 workers waiting, and every byte crosses the app twice. Instead the API authorizes the upload and returns a short-lived presigned URL scoped to one key, the client uploads directly to object storage, using multipart with per-part checksums for large files, and a storage event triggers validation, processing and database updates from a quarantine prefix. Lifecycle rules clean up temporary and incomplete uploads, and a CDN serves the results.
:::

:::key In one breath
Object storage keeps immutable objects with metadata under keys in flat buckets, with eleven nines of durability, strong consistency on S3 since 2020 and no directories or renames, while the database records what each file means. Presigned URLs let clients upload straight to storage under a key and expiry the API chose, freeing the 33 workers that 500 uploads a minute would otherwise tie up, with storage events driving the pipeline. Multipart uploads send parts of 5 MiB or more in parallel, up to 10,000 parts and 5 TiB, each checksummed and retried alone, and lifecycle rules expire temporaries, abort abandoned uploads and move cooling data to cheaper classes, with a CDN serving immutable variants.
:::

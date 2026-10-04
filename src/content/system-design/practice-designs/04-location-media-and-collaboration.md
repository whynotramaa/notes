@part IV | Uber, YouTube, Instagram, Docs | We design systems with live updates and expensive payloads. A successful API does not prove fresh location, playable media, or a merged document. We will trace ride matching, video, photo feeds, and collaborative edits. | where:4

## 13. Uber-style matching: candidates and assignment

Nearby drivers appear on a map, but their last location may be old. A **geospatial index** groups positions so a query can retrieve nearby candidates without scanning every driver. It does not grant ownership of a driver.

Drivers publish location with identity, sequence, and freshness. The location service updates spatial buckets and expires stale entries. Matching retrieves candidates, filters availability, and requests an authoritative assignment. A conditional driver or trip state ensures a driver is not committed to incompatible rides. A rejected candidate triggers another bounded attempt. Location frequency, bucket size, and query radius trade update cost against candidate volume. After reconnect, newer sequence and freshness policy prevent delayed older locations from moving a driver backward.

Assume 50,000 active drivers report every five seconds. Location ingestion is 10,000 updates per second. At 200 payload bytes per update, it carries 2,000,000 bytes per second before framing and spatial-index maintenance. Faster reporting raises this write path even if ride-request rate stays unchanged.

Two riders can receive the same nearby driver in their candidate lists. That is allowed until assignment commits, because discovery is a derived view and not ownership. The assignment authority compares current driver and request state before creating the accepted relation. A stale location can suggest an unusable candidate; skip or refresh it without treating it as a commitment. A driver reply that arrives after assignment expiry must match the current offer identity before advancing the trip. Preserve location sequence and freshness separately from assignment generation so late telemetry cannot reopen an obsolete offer.

@fig sd_practice_designs_13 | Illustrative spatial buckets and search radius. Fresh locations identify possible drivers; conditional assignment turns a candidate into one committed match.

A driver can receive two concurrent offers; the winner must be decided by the assignment authority rather than by which dispatcher happens to reply first.

:::story Picture this
A dispatcher writes nearby taxis on a board, then gives one ride to the first driver who accepts while crossing that driver off the board. Two dispatchers may see the same taxi, so the assignment desk must choose one winner atomically. The candidate board helps search but does not own the ride.
:::

## 14. YouTube-style video: processing and playback

A video upload finishes while playback still cannot start. A **transcoding workflow** produces derived media formats from a stored original. Upload completion, processing completion, and publication are different states.

Transfer the original directly to object storage under a verified session. Commit a durable processing job, then workers generate renditions and manifests under an output version. Publish a playable manifest only when its required outputs are complete. Retry jobs by input and output identity so a crash cannot publish a partial replacement. Playback obtains authorized metadata and retrieves segments through the CDN; origin load depends on misses, not total viewer delivery. View counts are independently derived and can accept a different consistency rule than access or media publication.

The illustrative original is 5,000,000,000 bytes, transferred in 50 parts under the shared upload assumptions. At the assumed 10,000,000 bytes per second, transfer takes 500 seconds before processing. Rendition count, media duration, codec work, and playback concurrency need separate assumptions; original byte size alone cannot compute transcoding capacity.

Stop the transform worker after it writes a rendition but before it records completion. On restart, it verifies the versioned output and resumes the same processing intention rather than announcing a second clip. Other required renditions can still be missing, so publication waits for the declared complete set and its manifest. If the manifest becomes visible before its objects are retrievable, viewers can cache failures or start unusable playback. Commit the published identity only after verification, then deliver segments under that identity. The original upload survives independently as recovery input and does not itself prove playback readiness.

@fig sd_practice_designs_14 | Illustrative youTube-style video: processing and playback. A complete rendition manifest publishes playable media after verified processing. Orange marks playback from the complete published manifest.

Publishing the manifest before its segments exist produces a fast API response followed by broken playback. This is a hypothetical video design, not a claim about YouTube’s private pipeline.

:::note Processing state versus playback
Separate original durability, processing, and playable publication. Make outputs versioned and jobs repeatable, then serve a confirmed manifest through a content path. CDN hits reduce origin work but not viewer egress.
:::

## 15. Instagram-style media: feed references and access

A photo appears in a feed before its resized image is ready. A **media publication state** tells readers which original and derivatives can safely be served. Feed references should point to a published version, not to an unfinished upload.

For the illustrative 1,000 daily images at 2,000,000 bytes each, originals alone add 2,000,000,000 bytes per day. Derivatives, replication, and retention add separate storage. Upload and process under versioned identities, publish metadata after verification, then fan out references according to feed policy. A private account’s policy changes must affect serving and discovery independently of cached feed references. Deletion emits derived cleanup while authoritative reads deny access immediately under the chosen contract.

The owner publishes verified media and the derived feed receives a reference to its version. If permission is revoked before a viewer opens the feed, the reference may remain while serving denies the media. Decide whether the thumbnail and caption also require the same visibility filtering. A source tombstone or version helps derived cleanup, but cleanup delay must not become unauthorized retrieval. Protect direct object and edge routes as well as the application lookup. The illustrated original-byte production excludes thumbnails and other derivatives, so their retained copies and transformation work require separate sizing inputs.

@fig sd_practice_designs_15 | Illustrative instagram-style media: feed references and access. A cached feed reference cannot grant access after media permission changes. Orange marks current permission instead of authority inferred from a feed reference.

A thumbnail can leak private content even when the full-image route checks access. Apply the same visibility boundary to every derivative.

:::warn Watch out
Commit a verified media state before publishing its feed reference. Count originals and derivatives separately. Feeds and CDN copies are derived; the permission and deletion contract still governs serving.
:::

## 16. Google Docs-style collaboration: concurrent operations

Two users insert text at the same position from the same document version. A **collaborative operation** names a change with identity and enough causal context for a deterministic merge rule. Applying raw positional edits in arrival order can make replicas diverge.

Choose a server-ordered transformation approach or an appropriately defined replicated data type. Under server ordering, accept one operation, transform the concurrent operation against accepted changes, and return the canonical position and version. Clients preserve pending operations and reconcile them against confirmed history. Under a replicated-data approach, define stable element identities and merge rules instead of borrowing only its name. Persist operations, bound retained history, and recover a reconnect through missing operations or a snapshot plus continuation boundary.

For an illustrative collaborative stream of 20 operations per second at 200 payload bytes each, input is 4,000 bytes per second and 345,600,000 bytes per day. Recipient delivery multiplies that by the applicable fan-out, while transformation and merge work depend on operation conflicts and pending history. A small operation payload is not proof of a cheap merge.

Let clients edit the same base before either has received the other's operation. The server orders or merges accepted operations under the chosen algorithm and sends the canonical result or operation relation back. Each client reconciles that acceptance with its local pending edit, retaining stable operation identity across retries. Simply replacing the local document with a late server response can discard unacknowledged local work. A reconnect needs a valid base and retained operation continuation, or a snapshot plus reconciliation policy. Convergence follows from the defined transformation or merge rules; a shared socket transport alone establishes none of them.

@fig sd_practice_designs_16 | Illustrative google Docs-style collaboration: concurrent operations. Clients reconcile pending edits against the authority's canonical operations. Orange marks clients reconciling pending operations to the canonical document.

A WebSocket transports edits but supplies no merge rule. This hypothetical exercise does not claim the current internals of Google Docs.

:::interview Interview lens
**"What must a collaborative editing algorithm define?"** Choose and explain the actual concurrent-operation algorithm. Stable identity, causal context, durable history, and reconnect recovery are required whichever family is used. Show one concurrent edit through both clients rather than listing OT or CRDT.
:::

:::key In one breath
Separate candidates from authoritative assignment, originals from derived media, and operations from final document state. Bound freshness, processing lag, output queues, and concurrent conflict rules.
:::

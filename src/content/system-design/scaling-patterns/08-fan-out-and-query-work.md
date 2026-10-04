@part VIII | Fan-out on write vs on read | We place repeated work on the write or read path. The wrong placement makes one popular publisher dominate the system. We will compute write fan-out, read fan-out, hybrid feeds, and consistent ranking. | where:8

## 29. Fan-out on write

A worker can crash halfway through recipient creation. Store its recoverable position or rescan using unique recipient-post identities, so restart fills missing recipients without creating another entry for recipients already processed.

A publisher posts once and many followers will read it. **Fan-out on write** places a reference in each recipient’s feed when the post is published, making later feed reads cheap.

At the illustrative 100 posts per second and 10,000 recipients per post, workers create 1,000,000 recipient entries per second. Each reference needs an identity that combines recipient and source post, so duplicate deliveries do not create duplicate feed entries. The publication path can commit the post first and fill feeds asynchronously, but then visibility lag is part of the contract. A celebrity post creates a large burst, and deletion or permission changes must invalidate the copied references.

Treat recipient creation as resumable work, because publication can outlive the worker building feeds. Each recipient-post relation has a unique identity; restart can skip those already committed and fill the missing relations. If the publisher's permissions change before a delayed recipient entry arrives, serving still checks current visibility rather than treating insertion as permanent authorization. The illustrated million entries per second measures reference creation, not content-byte duplication or finished user reads. Keep source post identity in each reference so deletion and rebuild have a target. A popular publisher changes this work suddenly even if publication rate remains steady.

@fig sd_scaling_patterns_29 | Illustrative fan-out on write. Write-time fan-out prepares references for later feed reads. Orange marks the prepared recipient feed that makes later retrieval cheaper.

A copied feed reference does not grant permanent access. Recheck authorization when content visibility changes.

:::story Picture this
A post office sorts a newsletter into each subscriber's mailbox when the publisher sends it. Reading is quick because each mailbox already has its copy, but one mailing creates work for every recipient. A later unsubscribe must remove or ignore the prepared copy under the mailbox's authority rules.
:::

## 30. Fan-out on read

Many followers never open their feeds. Precomputing entries for them spends write capacity without serving a read. **Fan-out on read** gathers candidate posts from followed publishers when the user requests a feed.

At the illustrative 50 feed reads per second and 200 gathered candidates per read, candidate processing is 10,000 items per second. This is not automatically cheaper than write fan-out: the scenarios must share publication rates, active readership, candidate sizes, and ranking work. The query needs bounded fetches, timeouts, and a merge rule. The slowest required publisher source can delay the page, so cache or precompute stable candidate lists where useful. A page cursor should represent the ordering boundary, not merely a changing numeric offset.

Follow a read whose candidate owners finish at different times. Merge only the bounded results allowed by the request deadline and declare whether a missing owner permits a partial page. A ranking cursor must encode the chosen continuation context so a later request does not simply skip a moving numeric offset. The illustrated candidate-processing rate omits remote call overhead and the work of ranking each candidate. Batch retrieval by owner where the data model allows it, then account for that owner's fan-out. Avoid comparing this candidate count with write-time entry creation as though they were interchangeable units of work.

@fig sd_scaling_patterns_30 | Illustrative fan-out on read. Read-time fan-out gathers candidates before forming a stable continuation page. Orange marks a page formed with its stable continuation boundary.

If every followee becomes a separate network call, candidate count understates request fan-out. Batch by storage owner and count those requests too.

:::note Read work and page stability
Fan-out on read pays only when a feed is requested but creates gather and ranking work on the latency path. Count candidates and remote fetches, bound the merge, and preserve pagination semantics under new posts.
:::

## 31. Hybrid fan-out and skew

A normal publisher can be precomputed cheaply while a celebrity has too many recipients for the same policy. A **hybrid fan-out** combines write-time feeds for one population with read-time retrieval for another.

Classify publishers using measured fan-out cost and read demand. The feed reader merges precomputed entries with recent celebrity posts, deduplicates by post identity, applies permissions, and ranks the combined candidates. A publisher changing class needs a migration boundary so its posts neither disappear nor appear twice. Keep the classification version with the cutover or query both paths during a bounded transition. Hybrid routing solves skew only if the read path remains bounded for users who follow many high-fan-out publishers.

A publisher changing classification can leave old posts in precomputed feeds while new posts arrive only through read-time gathering. During transition, query the appropriate paths and deduplicate by source post identity. Preserve a classification boundary or version so restart can explain which publications were supposed to reach which path. Readers still apply the same permission and pagination contract to the merged candidates. A classifier based only on follower count can miss expensive active readership or overprepare feeds for inactive users. Measure both write fan-out and read gather cost before changing that placement policy.

@fig sd_scaling_patterns_31 | Illustrative hybrid fan-out and skew. Hybrid feeds merge both work paths under identity and permission rules. Orange marks the merge that deduplicates candidates and applies current permissions.

An arbitrary follower threshold without workload evidence can move too much traffic into the read path and harm latency.

:::warn Watch out
Hybrid fan-out moves extreme publishers to a different work placement. The merge needs identity, cutover, permission, and pagination rules. Calculate the worst active-reader path as well as saved writes.
:::

## 32. Ranking, deletion, and stable pages

A feed page ends at a score boundary, and new posts arrive before the next page. Offset pagination skips or repeats entries as the ranked list moves. **Stable pagination** carries a boundary and a ranking context that allow continuation without pretending the feed never changes.

Use a source identity as a tie breaker and a cursor that captures the chosen order boundary. If ranking depends on mutable scores, decide whether the session uses a snapshot-like ranking version or accepts documented movement. Deleted or unauthorized posts should be filtered without allowing their copies to bypass current policy. A tombstone or source-version check can coordinate derived deletion, but the authoritative permission check must still protect content. Ranking is part of the data contract, not decoration applied after correctness.

Suppose the next-page request arrives after a post above its previous boundary has been deleted. The continuation rule should describe whether it fills the page from later candidates and which ranking context those candidates use. Current authorization can remove entries even when the ranking snapshot stays fixed, so a stable cursor cannot promise immutable access. Use a deterministic source-identity tie breaker for equal ranks and validate the cursor's scope. A cursor for one user or query should not grant access to another population. Keep ranking stability and content visibility as separate decisions when explaining why an entry disappeared.

@fig sd_scaling_patterns_32 | Illustrative ranking, deletion, and stable pages. The next page preserves ordering context while filtering newly inaccessible entries. Orange marks continuation under the same ranking context while excluding deleted entries.

A cursor over a mutable score cannot promise a perfectly stable sequence unless the design preserves the relevant ranking context.

:::interview Interview lens
**"How do you keep a paginated feed stable while data changes?"** Define the ranking and continuation contract. Carry a deterministic tie breaker and, when needed, a ranking snapshot or version. Deletion and authorization remain authoritative even when references are cached or precomputed.
:::

:::key In one breath
Fan-out on write precomputes recipient entries; fan-out on read gathers candidates at read time. Compare total work and hot-publisher behavior. Hybrid designs also need deduplication, deletion, and pagination rules.
:::

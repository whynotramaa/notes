@part I | Cache layers: local, shared, HTTP | We locate the reusable object before naming a cache. A shorter path is useful only when the reused answer is permitted. We will separate local copies, shared copies, and response layers. | where:1

## 1. A copy saves a particular kind of work

A viewer refreshes Heron's score five times while the score has not changed. Recomputing the same representation from the database on every request repeats useful work once and redundant work afterward. A **cache** stores a reusable result so a later request can skip that work. The stored result might be a response, a value, or a page.

Start by naming the expensive operation. Reusing a final JSON response might avoid database access and serialization. Reusing a score value avoids the lookup but can still require permission checks and formatting. Reusing a database page avoids a disk read while the engine still executes the query. These benefits have different boundaries and cannot share an unexplained hit-ratio number.

Heron keeps the database authoritative for official scores. Deleting a cached score therefore removes a performance copy, not the match itself. A miss means 'fetch from the source under the read contract', rather than 'this match does not exist'. Recovery is possible because the source and the derivation are defined independently of the cached object.

The illustrative cache holds version 7, score 10. A new request may reuse it when a public-display contract permits that version and age. A scorer requiring position 8 cannot reuse it. The value can be present, well formed, and cheap to read while still being unsuitable for this caller. Cache eligibility is more than key existence.

A cache is worthwhile when the saved work exceeds lookup, memory, fill, invalidation, and operational costs under the actual workload. A low-reuse private response may cost more to coordinate than to compute. Before adding a cache to Heron, draw one request with the cache and one without it, then name the exact source operation that disappears on a permitted hit.

@fig sd_cache_trace_1 | The trace separates an authoritative score from its reusable copy; orange marks the v8-required reader that rejects a present v7 entry.

:::story Picture this
A librarian keeps a commonly requested page at the desk. The book remains on the shelf. Losing the desk copy means another bounded trip to the shelf, not proof that the book disappeared.
:::

## 2. Local caches trade network waits for duplicate state

Heron starts several application processes, each with a small dictionary of frequently used values. A repeated request handled by the same process can avoid another network trip. The first request handled elsewhere still misses. An **in-process cache** lives within one process, so its warmth and lifetime follow that process rather than the fleet as a whole.

A local lookup avoids a separate cache-service network wait. The process still needs safe concurrent access, bounded capacity, expiry, and a derivation rule. Restarting it loses its entries unless they are restored separately. Scaling from one process to many creates more copies and more places that can retain an old value after a change.

Use an illustrative 10-process fleet. Each process caches the same 2,000-byte score response with 100 assumed metadata bytes. The duplicated object occupies 10 times 2,100, or 21,000 accounted bytes across the fleet. One shared accounted copy would be 2,100 bytes before its service overhead and replication. This comparison is about duplication, not measured implementation memory.

Local copies suit immutable configuration keyed by version, compiled templates, or public score snapshots with an explicit stale contract. They require a different rule for revocable permissions or session-sensitive values. A change notification can reduce old-copy lifetime but can be missed, so its reliability and fallback determine the actual freshness promise.

Measure the local hit ratio per process and after restarts, not just as one fleet average. Uneven routing can leave one process warm and others cold. A process leak or unconstrained key space can turn a performance optimization into memory exhaustion. Heron's local cache therefore has a capacity bound and stores only derived values whose absence is recoverable.

@fig sd_cache_trace_2 | The trace counts duplicate local copies across ten processes; orange marks the restart boundary where process A must reload from the source.

:::note A hit needs eligibility
An entry can be present but unsuitable because its version, visibility, or age violates the caller contract. Count eligible hits at the relevant layer.
:::

## 3. Shared caches add a service boundary

A request arrives at a different Heron application process, but the shared score entry is already warm. A **distributed cache** is accessed over the network by multiple processes and owns cache state independently of any one application process. It avoids some duplicate loading while adding a dependency whose network and service can fail.

The caller sends the key, waits for the service, and checks the result's version and eligibility. The cache may partition keys across owners or replicate them. Each choice adds routing, failover, and consistency behavior. 'Distributed' describes the access and deployment model; it does not imply that entries are durable authority or always fresh.

For the illustrative read workload, Heron receives 1,000 reads per second at peak. If 90% are suitable hits, the shared service handles those requests plus misses, and the database receives 100 miss loads per second before refill duplication. Losing the service can expose all 1,000 reads to the database unless fallback is bounded.

Compared with local copies, the shared cache can coordinate warm entries and per-key single-flight across callers if that feature exists. It still costs a network request on a hit and can itself become saturated. A high hit ratio does not prove low latency if one popular key sends most requests to one owner or client connection pool.

Heron treats the service as replaceable derived storage. Cache commands have a short deadline within the request budget, errors remain distinguishable from ordinary misses, and source access has independent admission limits. We will calculate those limits later. For now, the important boundary is ownership of truth: shared state can save work without becoming the authoritative score record.

@fig sd_cache_trace_3 | Illustrative cache-service demand is traced from a 90% hit rate to 100 source loads per second; orange marks the fallback case when all 1,000 reads arrive at the source.

:::warn Keys carry representation and visibility
Omitting locale, format, or permission dimensions can return incorrect or private data. Avoid caching a response layer when its safe reuse boundary is unclear.
:::

## 4. Response layers and keys define what can be reused

A public score response can be identical for many viewers, while a private scorer response can contain permissions and unpublished corrections. Caching both under only `match:7` risks serving the wrong representation. A **cache key** names the exact reusable object, including every request dimension that changes its permitted content.

A **browser cache** stores HTTP responses locally under HTTP cache rules. A **CDN** can reuse responses closer to viewers. A **database buffer cache** stores engine pages rather than final user responses. These are distinct layers: a browser hit can avoid every downstream request, while a buffer hit can still require the entire query and application response path.

Heron's public key might include match identifier, representation version, and locale. Its scorer view either bypasses shared response caching or includes a carefully defined identity and permission boundary. Putting a bearer token directly into a broadly logged key can leak credentials; omitting authorization dimensions can leak data. Often the simpler answer is to avoid caching that response layer.

[HTTP caching in RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) defines freshness, validation, and directives such as `private` and `no-store`. `Vary` affects reuse across selected request headers. These rules cannot be replaced with a generic dictionary TTL. A response's age, validators, cache-control directives, and request context all participate in its reuse decision.

In Heron's trace, a public English representation and a public Hindi representation are different keys. A database page used for either remains the same kind of low-level cached object and still obeys query visibility rules. Naming the stored unit makes both security review and performance counting possible. We will now trace how one eligible application value is loaded.

@fig sd_cache_trace_4 | The rows separate public locale keys, private scorer data, and database pages; orange marks the page layer where a query still runs after the page hit.

@fig sd_caching_placement | The split compares per-process copies with a shared cache service; orange marks the shared placement, whose missing copy does not mean missing truth.

:::interview Interview lens
**"Where would you put the first cache?"** I would name the repeated expensive operation and its permitted reuse first. Placement then determines network waits, duplicated memory, freshness coordination, and failure behavior.
:::

:::key In one breath
A cache stores a reusable result derived from an authority. Placement changes saved work, duplicated memory, and failure dependencies. Keys identify the exact representation and security boundary. Hit ratio must be measured at a named layer.
:::

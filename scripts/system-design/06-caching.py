from author import publish
raw=r'''
@part The cache boundary | We reuse work whose result is still useful. The saved work depends on where the copy sits. We will distinguish caches by ownership and the path they shorten.

## Local and distributed caches

A popular match receives the same score read repeatedly. A **cache** keeps a reusable copy to avoid repeating an expensive operation. An **in-process cache** sits in one application process and avoids a network hop, but each process warms and invalidates separately. A **distributed cache** shares entries across processes and adds network and service failure costs.

Heron can use local copies for immutable configuration and shared copies for common score reads. A shared cache must declare whether it owns authoritative state; here it does not. Its recovery path is a bounded fetch from the database, not silently treating a missing cache record as a missing match.

@draw placement | split | WHERE THE REUSABLE COPY LIVES | [["in process","no cache network hop\nper-process copies"],["distributed","shared warm entries\nnetwork and service cost"]] | Illustrative cache placements. | a missing copy is not missing truth

## Browser, CDN, and database buffers

A viewer's browser can reuse an asset without contacting Heron. A **browser cache** stores HTTP responses locally under HTTP rules. A **CDN** stores responses near users. A **database buffer cache** stores database pages inside the engine; it avoids some disk reads but still executes the query and visibility checks.

These caches hold different objects and have different invalidation boundaries. A cached JSON response may skip authorization code unless its cache key and cache policy are correct. A cached database page does not bypass row visibility. Name the stored unit before computing hit rate or claiming a request vanished.

@draw levels | flow | EACH CACHE SHORTENS A DIFFERENT PATH | ["browser response","edge response","app value","DB page"] | Conceptual cache hierarchy; these are not guaranteed serial misses. | cached pages still participate in queries

:::key In one breath
Caches reuse responses, values, or pages at different boundaries. Local copies trade shared freshness for a shorter path. Distributed copies share warm state but add a dependency. Define the stored object and authoritative source before describing recovery.
:::

@part Read paths | We decide who fills a missing entry. Without a clear owner, misses can duplicate work or hide errors. We will compare cache-aside with read-through.

## Cache-aside

Heron checks the shared score cache, misses, reads the database, and fills the entry. **Cache-aside** makes the application manage that sequence. A hit avoids the database, but a miss includes both the cache and database waits. Cache fill should not turn an otherwise successful authoritative read into a user error.

The example assumes a 90% hit ratio at 1,000 reads per second, leaving 100 database reads per second. This arithmetic depends on the workload and key distribution. A match-start cold burst can have a very different hit ratio from a daily average.

@draw aside | sequence | THE APPLICATION OWNS THE MISS PATH | {"actors":["application","cache","database"],"steps":[[0,1,"get: miss"],[0,2,"read truth"],[2,0,"score + version"],[0,1,"fill with expiry"]]} | Illustrative cache-aside read. | fill failure need not fail the read

## Read-through

A **read-through cache** owns a loader behind its read interface. The caller asks the cache, and the cache retrieves a missing value. This centralizes loading but does not remove source failures, concurrency, or staleness. The loader needs deadlines, admission limits, and a clear error contract.

A library that wraps a dictionary with a callback can implement local read-through; a service can do it remotely. The pattern name says who loads, not where the data sits or how durable it is. Keep errors distinguishable from legitimate 'not found' results so failures do not poison the cache.

@draw through | flow | THE LOADER IS INSIDE THE CACHE CONTRACT | ["caller","cache lookup","bounded loader","source result"] | Illustrative read-through ownership. | a timeout must not become a cached absence

:::key In one breath
Cache-aside puts miss handling in the application. Read-through puts it behind the cache interface. Both need bounded source access and distinct error states. Hit ratios are observations for a workload, not permanent properties of a product.
:::

@part Write paths | We choose when a copy changes relative to durable truth. Fast acknowledgement can move data-loss risk to another boundary. We will compare write-through and write-behind.

## Write-through

A **write-through cache** sends a write to the authoritative store as part of its write path before returning under the chosen contract. It can keep a useful fresh copy, but it adds source latency and must explain what happens when only one update succeeds. The name alone does not mean a cross-service atomic transaction exists.

Heron can commit the score first and update or invalidate the copy afterward. A failure after commit must not make a retry repeat the score effect; retain command identity. Versions keep a delayed cache update from replacing a newer copy.

@draw throughwrite | flow | ACKNOWLEDGEMENT FOLLOWS THE SOURCE CONTRACT | ["write","authoritative commit","copy update","return result"] | Illustrative write ordering, not an atomic cache/database commit. | define every partial failure

## Write-behind

A **write-behind cache** acknowledges before asynchronously writing to the backing store. That can reduce immediate latency or combine repeated updates, but unsent changes need durable storage and a replay rule if they matter. A process crash can otherwise erase acknowledged work.

Write-behind may suit replaceable counters with an explicitly accepted loss window. It is a poor default for authoritative score commands or payments. If the buffer itself is durable and replayable, describe its log, acknowledgement point, ordering, and recovery rather than implying that memory buffering created durability.

@draw behind | split | THE ACKNOWLEDGEMENT POINT CHANGES RISK | [["write-through","source finishes\nthen acknowledge"],["write-behind","buffer accepts\nsource finishes later"]] | Conceptual acknowledgement contracts. | fast acknowledgement needs a survival story

:::warn Watch out
Deleting the cache after a database write is not a complete coherence protocol. An older in-flight read can refill a stale value after that deletion.
:::

:::key In one breath
Write-through includes source work in the acknowledgement contract. Write-behind postpones it and needs a durable buffer or accepted loss. Cache and source updates can fail independently. Versions and operation identity keep delayed work from becoming a second effect or a backward update.
:::

@part Freshness and eviction | We decide how long a reused result remains acceptable. Capacity removal and freshness expiry solve different problems. We will distinguish invalidation, TTL, and replacement policies.

## Invalidation, stale data, and TTL

A reader starts loading version 7, a writer commits version 8 and invalidates, then the reader fills version 7. **Cache invalidation** removes or marks copies that may no longer be valid. **Stale data** is older than the required observation contract. A TTL bounds entry age under the cache's expiry behavior, not freshness relative to every concurrent write.

Version checks, generation keys, serialized fills, or explicit stale-while-revalidate policies can make the contract clearer. A short TTL trades staleness for more source work. Do not claim immediate read-your-writes from a time expiry alone.

@draw race | sequence | A STALE FILL CAN FOLLOW INVALIDATION | {"actors":["reader","database","cache"],"steps":[[0,1,"read old version"],[1,2,"writer invalidates"],[0,2,"fill old version"],[2,0,"later hit is stale"]]} | Illustrative invalidation race. | compare versions at the fill boundary

## Eviction, LRU, and LFU

The cache has room for fewer entries than callers request. **Eviction** removes entries to satisfy a capacity policy. **LRU**, least recently used, favors recently touched entries; **LFU**, least frequently used, favors frequently accessed entries. Real implementations can approximate these policies and age frequency counts.

Heron's illustrative 100,000 entries each use 2,000 payload bytes plus 100 overhead bytes, totaling 210 MB. In a 256 MB budget that is 82.03125% before any omitted allocator or implementation overhead. Leave capacity for reality and observe evictions, object sizes, and usefulness rather than copying this illustrative overhead into a production estimate.

@draw eviction | rows | CAPACITY AND FRESHNESS ARE DIFFERENT LIMITS | [["TTL","too old","expire"],["LRU","least recent","evict"],["LFU","least frequent","evict"]] | Conceptual policies; implementation details vary. | eviction does not mean the source was deleted

:::key In one breath
Invalidation responds to changes and TTL limits reuse age. Neither fixes all concurrent refill races. Eviction manages capacity and differs from freshness expiry. Count payload, keys, metadata, and implementation overhead before assigning a memory budget.
:::

@part Correlated misses | We prevent many callers from rebuilding the same copy together. An average hit ratio hides synchronized failure. We will distinguish stampede, penetration, avalanche, and hot keys.

## Stampede and penetration

A popular entry expires and many callers all read the source. A **cache stampede** is concurrent refill work for the same missing or expired value. Single-flight loading lets one bounded loader fetch while others wait or use permitted stale data. The loader still needs a timeout and a policy when it fails.

**Cache penetration** is repeated source access for keys that are absent or cannot be cached usefully. Validate invalid key shapes early and use short negative caching for genuine absence where creation semantics permit it. Do not negative-cache an unavailable source as though it proved nonexistence.

@draw stampede | fan | ONE MISS SHOULD NOT CREATE MANY SOURCE READS | {"source":"expired hot key","targets":["caller waits","one bounded loader","stale copy if allowed"]} | Illustrative single-flight policy. | absence and source failure are different

## Avalanche and hot keys

A **cache avalanche** is a correlated surge of misses across many keys, often after aligned expiries or a cache outage. Randomized expiry and staged warming spread refills. A **hot key** attracts concentrated traffic even when its value is present, so the cache owner itself can saturate.

Local replicated read copies can spread a hot read key when its freshness contract permits them. Splitting a hot write key is harder because it changes ordering and merge semantics. Watch per-key skew and source admission; a globally high hit ratio can coexist with one overloaded owner.

@draw correlated | split | TWO DIFFERENT SOURCES OF CONCENTRATION | [["many keys miss","expiry or outage\nsource refill surge"],["one key hits","popular owner\ncache service surge"]] | Illustrative avalanche and hot-key distinction. | a hit can still overload its owner

:::key In one breath
Stampede duplicates a refill for one key. Penetration repeatedly asks for absent keys. Avalanche correlates misses across keys, while a hot key concentrates hits or writes. Refill coordination and source admission must survive both normal expiry and cache outages.
:::

@part Cache failure | We keep a replaceable component from destroying the authoritative one. A fallback path needs a capacity budget. We will count the miss surge and bound degradation.

## What happens when Redis goes down?

Under Heron's illustrative 90% hit ratio, the database serves 100 reads per second. Losing the cache can send it 1,000, a tenfold increase. **Graceful degradation** preserves selected useful behavior while reducing service under failure. Blind fallback to the database is not graceful if it overwhelms the source.

Limit fallback concurrency, protect scorer writes, serve explicitly permitted stale snapshots, and reject lower-priority reads. Time out the failed cache rapidly within the total deadline and avoid repeated reconnection storms. The database needs capacity for the chosen degraded contract, not necessarily for every original request.

@draw outage | bars | ILLUSTRATIVE SOURCE DEMAND AFTER CACHE LOSS | [["normal misses",100,"reads/s"],["unbounded fallback",1000,"reads/s"]] | Computed for a 90% normal hit ratio. | fallback capacity must be designed

## Distributed cache consistency

A shared cache can replicate entries and fail over to an older copy. That can reintroduce a value the application thought it removed. Include cache replicas, failover, local copies, and client caches in the consistency model. Protect authorization and balances by consulting authoritative state when correctness requires it.

Heron's complete cache read checks a versioned entry, uses it under the declared freshness rule, and admits a bounded miss fetch. Its write commits truth with identity, then updates or invalidates derived copies under version rules. This unit does not replace database durability or distributed agreement; the cache shortens a permitted read path.

@draw complete | flow | THE CACHE IS A SHORTER PERMITTED READ PATH | ["fresh hit?","bounded miss","truth + version","safe fill"] | Illustrative complete cache-aside contract. | truth must remain recoverable without the copy

:::interview Interview lens
**"Why not cache every read?"** Some reads require current authority or have low reuse. I would identify the freshness contract and saved source work, then include invalidation, memory, and outage behavior. A cache adds another failure path as well as a faster path.
:::

:::key In one breath
A cache outage can multiply source demand. Bound fallback and preserve the operations that matter most. Replicated and local cache copies share a consistency obligation. Cache performance is useful only inside a correct freshness and recovery contract.
:::
'''
qa=[('Cache-aside or read-through?','The application loads cache-aside misses; the cache interface owns read-through loading. Neither removes source failures.'),('What does write-behind risk?','Acknowledged unsent changes can disappear unless the buffer is durable or loss is accepted. Define the acknowledgement boundary.'),('Does TTL guarantee read-your-writes?','No. A timed copy can be stale relative to a recent write, and refill races can recreate old values.'),('LRU or LFU?','LRU favors recency and LFU favors frequency. Inspect the actual implementation and workload, including aging and scan behavior.'),('Stampede or avalanche?','A stampede duplicates one key\'s refill; an avalanche correlates many misses. Both need source admission limits.'),('What is penetration?','Absent-key traffic repeatedly reaches the source. Validate keys and distinguish genuine absence from failure before negative caching.'),('Why can a cache hit be slow?','A hot key owner, network, or cache service can saturate. A hit ratio does not measure owner capacity.'),('What happens on cache loss?','Source demand can multiply. Bound fallback, preserve essential writes, serve suitable stale copies, and reject excess work.')]
ex=[('●','Compute normal source reads.','1,000 times (1-0.9) gives 100 reads/s.'),('●','Compute the fallback multiplier.','1,000 divided by 100 gives a tenfold increase.'),('●','Compute illustrative cache bytes.','100,000 times (2,000+100) gives 210,000,000 bytes.'),('●','Compute occupancy in 256 MB.','210/256=0.8203125, or 82.03125%, before omitted overhead.'),('●●','Trace invalidation followed by stale fill.','A reads an old version, B commits and invalidates, then A fills the old version. Version-aware fill or another coherence rule must reject or bound that stale copy.'),('●●','Protect the database after a cache outage.','Bound miss concurrency and connection use, reserve scorer capacity, permit suitable stale reads, and reject excess lower-priority traffic.'),('●●●','Specify negative caching for newly created matches.','Only cache verified absence, use a bounded expiry, and invalidate or version that absence on creation. Source timeout must never be recorded as absence.')]
publish(6,'caching','Copies that save work',['Copies That','Save Work'],'Cache placement, read and write patterns, freshness races, eviction, correlated misses, hot keys, and failure-safe fallback.','Draw a cache hit, miss, stale refill, and outage without losing the authoritative data contract.',raw,qa,ex,[('HTTP caching','https://www.rfc-editor.org/rfc/rfc9111','Response reuse and validation.'),('Redis eviction','https://redis.io/docs/latest/develop/reference/eviction/','Capacity policies and implementation behavior.'),('Redis persistence','https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/','Snapshot and append-only durability choices.')])

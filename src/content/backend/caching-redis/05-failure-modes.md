@part V | Cache failure modes | We study the ways a cache turns from a shield into a threat. Each failure has a name, a recognisable signature on the dashboards, and a short list of cures. We will cover stampedes and three ways to stop them, early refresh and stale-while-revalidate, penetration and Bloom filters, avalanches, hot keys and big keys, and what happens when Redis disappears. | where:5

## 13. Cache stampede

Friday at 8 p.m., restaurant 9 runs a promotion and its menu is read 2,000 times a second. The key `menu:9` expires. In the 200 ms it takes to rebuild the menu, every request misses, and every request starts its own rebuild. That is 2,000 × 0.2 = 400 identical, expensive database queries arriving at once. The database slows under the load, the rebuild takes longer, more requests miss, and the window grows. This is a **cache stampede**, also called a thundering herd or dog-piling.

@fig be_cache_stampede | One expiry, 400 identical rebuilds. The slower the database gets, the bigger the crowd.

The first cure is **request coalescing**. Within one process, only the first miss for a key starts a load, and every other request for the same key waits for that load's result. Go's `singleflight` package, Caffeine's loading cache and Varnish's request collapsing all do this. With four app instances, the 400 rebuilds become at most 4, one per instance.

@fig be_cache_coalesce | Many callers, one flight to the database. Everyone shares the answer.

To get from 4 to 1 across processes, Wren adds a **rebuild lock** in Redis. The first request to miss runs `SET lock:menu:9 <token> NX PX 2000`, which succeeds only if no lock exists and expires after 2 s in case the winner crashes. The winner rebuilds and writes the menu. The losers do not query the database. If a stale copy is available, they serve it. If not, they wait 50 ms and try the cache again. The lock's expiry must comfortably exceed the rebuild time, and the winner deletes the lock only if it still holds its own token, which Unit IX covers in detail.

@fig be_cache_lock_refresh | One request wins the lock and rebuilds. The others serve a stale copy or wait briefly.

Both cures share one assumption, that the losers have something to do while they wait. Serving stale data is usually the best option, which is why the next section's techniques keep a stale copy around on purpose.

## 14. Refreshing early and serving stale

A stampede happens because a hot key disappears. The cleanest fix is never letting it disappear, by refreshing it shortly before it expires.

**Probabilistic early expiration**, from a 2015 paper by Vattani, Chierichetti and Lowenstein known as XFetch, makes each request roll a die as expiry approaches. Each cache entry stores the time its last rebuild took, δ. A request refreshes early if `now − δ · β · ln(rand()) ≥ expiry`, where rand() is uniform between 0 and 1 and β, usually 1, tunes eagerness. Because −ln(rand()) is occasionally large, a few requests refresh early, and the chance grows as expiry nears. With δ = 0.2 s, β = 1 and 2,000 requests per second, the chance that someone has already refreshed reaches one half about 1.2 s before expiry. One request does the work, while everyone else keeps reading the still-valid entry.

@fig be_cache_xfetch | The chance that someone has refreshed, against time before expiry. It climbs steeply in the last two seconds.

The technique needs no locks and no coordination, just one extra number per entry. Its weakness is that it only works for keys that are read often enough for someone to roll the die. That is exactly the set of keys that can stampede.

**Stale-while-revalidate** takes the opposite approach. The entry carries two lifetimes, a fresh period and a stale period. During the fresh period it is served normally. During the stale period it is still served, instantly, but the first request also triggers a background refresh. Only after the stale period is a request forced to wait. HTTP has this built in as `Cache-Control: max-age=60, stale-while-revalidate=30`, from RFC 5861 in 2010, and CDNs and browsers honour it. In application caches, Wren stores the menu with a logical expiry inside the value and a longer Redis TTL, so a reader can see "stale but present" and trigger a refresh.

@fig be_cache_swr | Fresh for 60 s, usable for 30 s more while a background refresh runs.

A sibling setting, **stale-if-error**, lets a cache serve a stale copy when the origin fails. If the database is down, users see a menu that may be 10 minutes old instead of an error page. For a menu that is nearly always the right trade. Combined with coalescing, these techniques mean a hot key's expiry is invisible to users and to the database.

## 15. Cache penetration

Cache-aside assumes that a miss is followed by a value worth caching. An attacker, or a buggy client, can break that assumption by requesting keys that do not exist, `/orders/9912`, `/orders/18277`, `/orders/40211`, each a fresh random id. Every request misses the cache, queries the database, finds nothing and caches nothing. The cache is bypassed entirely. This is **cache penetration**, and a few thousand requests per second of it hit the database as if there were no cache at all.

@fig be_cache_penetration | Random ids pass straight through the cache. A Bloom filter turns most of them away first.

Three defences stack. Negative caching from Part IV stores "not found" for 30 s, which stops repeated requests for the same missing id but not a stream of new random ones. Input validation rejects ids that cannot be valid, such as an order id beyond the current maximum or a malformed public id. Unit IV's opaque random ids already make guessing hard. And a **Bloom filter**, invented by Burton Bloom in 1970, answers "could this id exist?" in memory before the cache is even asked.

A Bloom filter is a bit array with k hash functions. Adding an item sets the k bits its hashes point to. Checking an item looks at the same k bits. If any is 0, the item was definitely never added. If all are 1, it was probably added, with a small chance of a false positive when other items happened to set those bits. There are never false negatives.

@fig be_cache_bloom | order:123 set bits 2, 9 and 15. order:999 finds a 0 at bit 13, so it was never added.

The size follows from the item count n and the false positive rate p.

$$m = -\frac{n \ln p}{(\ln 2)^2}, \qquad k = \frac{m}{n} \ln 2$$

Read the first as "bits needed grow with the number of items and with how rare you want false positives". For Wren's 5,000,000 order ids at p = 1%, m = 47,925,292 bits, about 6.0 MB, and k = 6.64, rounded to 7 hashes. Six megabytes in memory stop 99% of requests for non-existent orders from touching Redis or PostgreSQL. Standard Bloom filters cannot delete items, so deleted orders stay "probably present", which is harmless here, since those lookups fall back to the negative cache. RedisBloom offers the structure as a Redis module.

## 16. Avalanches, hot keys and big keys

A **cache avalanche** is a stampede across many keys at once. It has three usual causes. Many keys written together with the same TTL expire together, which jitter prevents. A cache node restarts empty, which persistence, replicas and warming soften. Or a deploy changes the key format, say from `menu:9` to `menu:v2:9`, which makes every key miss at once. Wren's database is comfortable at about 1,000 queries per second and normally sees 400. With the cache empty it would see 4,000.

@fig be_cache_avalanche | Illustrative. A restarted cache sends the full query load to the database until it refills.

The defences are the ones already met, jitter, warming, gradual traffic shifts, and staging key format changes so old and new formats coexist, plus the load shedding of the next section for when everything else fails.

A **hot key** is a single key read so often that it overloads the one Redis shard that holds it. During a promotion, `menu:9` might be read 50,000 times a second. A Redis shard handles roughly 100,000 simple operations a second, but this key also competes with everything else on that shard, while the other shards sit idle. Sharding cannot help, because one key lives on one shard. The fixes all spread or absorb the reads. A local cache with a 1 s TTL on 20 app instances turns 50,000 reads into 20. Replicating the key under several names, `menu:9#1` to `menu:9#8`, and choosing one at random spreads it across shards. Reading from Redis replicas adds capacity. `redis-cli --hotkeys`, available since Redis 4.0, reports the hottest keys when the server runs an LFU eviction policy.

@fig be_cache_hot_key | One shard pinned by one key. Local copies and replicated keys spread the load.

A **big key** is a single value so large that operations on it are slow. A 10 MB hash holding every restaurant's menu, read with `HGETALL`, takes 8 ms just to cross a 10 Gbit/s network, and Redis's single thread spends milliseconds serializing it, during which every other command waits. Deleting a big key with `DEL` can block for longer, which is why Redis 4.0 added `UNLINK`, which frees memory in a background thread. The fixes are to split big values into many small keys, read only the fields needed with `HGET` or `HSCAN`, and find offenders with `redis-cli --bigkeys` or `MEMORY USAGE`.

@fig be_cache_big_key | One 10 MB value on a single-lane road. Every small command queues behind it.

## 17. When Redis goes down

At 8:05 p.m. on Friday, Wren's Redis primary fails. What happens next depends on choices made months earlier.

Without preparation, every request tries Redis and waits for its timeout. If the client timeout is the library default of several seconds, every request now takes several seconds, app workers fill up, and the whole API stalls, including endpoints that never needed the cache. If the timeout is short, requests fall through to the database. At 2,000 requests per second with no hits, PostgreSQL receives 4,000 queries per second, four times its comfortable limit, and slows down for everyone. The cache outage has become a database outage.

@fig be_cache_outage | Every request falls through. The database is asked for four times what it can comfortably do.

Wren's defences work in layers. Redis calls have a 50 ms timeout, so a dead cache costs at most 50 ms per request. A **circuit breaker**, which Unit X covers in depth, notices repeated Redis failures and stops calling it for a few seconds, so requests skip the 50 ms wait entirely and go straight to the fallback. The local cache keeps serving the hottest keys, often 60% of reads under Zipf popularity. The database pool's short wait and statement timeouts from Unit VI stop the database from drowning, and requests that cannot be served get 503 with Retry-After rather than hanging. For some endpoints, Wren serves a static fallback, such as yesterday's menu snapshot from object storage.

Recovery is the other half. Redis Sentinel or a managed service promotes a replica within seconds to tens of seconds, as Part VIII describes. The replica is warm, since it holds a copy of the data, so the hit ratio recovers quickly. If Redis restarted empty instead, the avalanche defences from the last section apply.

The design question to ask of every cache is whether the system must survive its loss. Wren's answer is that the API must stay up, slower and partly degraded, but up. Sessions and rate limits, which live in a separate Redis with replicas, are treated as critical infrastructure, not as cache.

:::story Picture this
A concert hall's doors open at 7 p.m. sharp and 4,000 people push through four doors at once. People are trampled, and the doors jam. Opening the doors a little early, letting people in a few at a time, and keeping an usher at each door to say "wait one moment" turns the same crowd into a calm queue. Early refresh, locks and coalescing are those three habits.
:::

:::note Probabilistic structures in Redis
Redis has a HyperLogLog built in, Part VI, and Redis Stack and the RedisBloom module add Bloom filters, cuckoo filters, which support deletion, count-min sketches for approximate counts, and top-k for finding heavy hitters, which is another way to spot hot keys.
:::

:::warn Watch out
A default client timeout of seconds on a cache call turns a cache outage into a full outage. Set cache timeouts in tens of milliseconds, treat cache errors as misses, and put a circuit breaker around the cache client.
:::

:::interview Interview lens
**"A hot key expires and the database falls over. What happened and how do you prevent it?"** A cache stampede. Every concurrent request missed and rebuilt the same value, 2,000 requests per second times a 200 ms rebuild is 400 duplicate queries, and the database slowed, widening the window. Prevent it with request coalescing per process, a short Redis lock so one request rebuilds across the fleet, probabilistic early refresh so hot keys are rebuilt before they expire, and stale-while-revalidate so readers get the old copy instantly. Add TTL jitter so many keys never expire together.
:::

:::key In one breath
A stampede is many requests rebuilding one expired hot key at once, 400 for Wren, cured by coalescing, a NX PX lock so one request rebuilds, XFetch early refresh about 1.2 s before expiry, and stale-while-revalidate or stale-if-error. Penetration is requests for keys that never exist, stopped by validation, negative caching and a Bloom filter, 6.0 MB and 7 hashes for 5,000,000 ids at 1%. Avalanches come from shared TTLs, empty restarts and key format changes, hot keys need local copies or replicated names, and big keys need splitting. When Redis dies, short timeouts, a circuit breaker, local caches and load shedding keep the database from taking 4,000 queries per second.
:::

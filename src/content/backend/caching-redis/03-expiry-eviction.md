@part III | Expiry, eviction and sizing | We decide how long entries live and which ones go when memory runs out. A TTL bounds staleness, an eviction policy bounds memory, and a sizing model tells you how much memory buys how much hit ratio. We will cover TTLs and jitter, LRU, LFU and Redis's approximations, and sizing a cache from the shape of popularity. | where:3

## 7. TTLs and jitter

A **time to live**, TTL, tells the cache to drop an entry a fixed time after it was written. Wren sets menus with `SET menu:9 <json> EX 300`, so the copy lives for 300 s. Within that window every read is a hit. When it expires, the next read misses, reloads and starts a new 300 s window. The TTL also bounds staleness. If restaurant 9 changes its menu 120 s into the window and the delete somehow fails, users see the old menu for at most the remaining 180 s.

@fig be_cache_ttl | One key's life. The TTL is the longest a reader can see old data if every other invalidation fails.

Choosing a TTL is a trade between freshness and load. A 5 s TTL on menus means restaurant 9's menu is reloaded about 720 times an hour if it is read continuously, while a 1 hour TTL means once. Wren's rule of thumb is to ask the product owner how old the data may be in the worst case, set the TTL to that, and use explicit invalidation to make the usual case much fresher. Menus get 300 s, restaurant opening hours 60 s, a user's permissions 30 s, and the list of cuisines a day.

Every entry should have a TTL, even when invalidation is explicit. Bugs in invalidation code, writes from scripts that skip the delete, and the race from Part II all leave stale entries, and a TTL is the safety net that eventually cleans them up. Keys without a TTL also never leave unless the cache is full, which wastes memory on data nobody reads.

The second rule is to add **jitter**, a random spread, to TTLs. Suppose a deploy warms the cache by loading the 10,000 most popular menus at once, all with a TTL of 3,600 s. One hour later all 10,000 expire in the same second and the database receives 10,000 reloads at once. Multiplying each TTL by a random factor between 0.9 and 1.1 spreads those expiries over 720 s, about 556 every 40 s, which the database barely notices.

@fig be_cache_jitter | The same 10,000 keys with one TTL and with ±10% jitter. The spike becomes a gentle slope.

Jitter costs nothing and prevents one of the cache avalanches of Part V, so Wren's cache helper applies it to every SET by default.

## 8. Eviction: LRU, LFU and what Redis really does

A cache has a memory limit, 8 GB for Wren's Redis, set with `maxmemory`. When it is full and a new entry arrives, something must go. The **eviction policy** decides what.

**Least recently used**, LRU, evicts the entry that has gone longest without being read. It keeps entries ordered by last access, moves an entry to the front whenever it is read, and drops from the back. LRU works well when recent use predicts future use, which is true for most web workloads.

@fig be_cache_lru | Reading a key moves it to the front. The key unused for longest falls off the end.

LRU has a known weakness, **scan pollution**. A batch job that reads 100,000 menus once each, say to rebuild a search index, makes each of them "most recently used" and pushes out the genuinely popular keys. **Least frequently used**, LFU, counts accesses instead and evicts the entry with the fewest. The scan's keys each have one access and go first, while restaurant 9's menu, read thousands of times, stays. LFU's weakness is the opposite. An entry that was popular last week keeps a high count and lingers after interest has moved on, so real implementations decay counts over time.

@fig be_cache_lfu | A one-off scan flushes LRU. LFU's counters protect the popular keys.

Redis implements neither exactly. A true LRU needs a linked list through every key, costing memory and a pointer update on every read. Redis instead stores a 24-bit clock per key and, when it must evict, samples a few random keys, 5 by default as set by `maxmemory-samples`, and evicts the one idle longest. Since Redis 3.0 it also keeps a small pool of good candidates between evictions. With 10 samples the result is very close to true LRU. Redis 4.0 added an LFU mode using a logarithmic counter that decays over time.

@fig be_cache_sampling | Five keys sampled, the one idle for 90 s evicted. Cheap and close to LRU.

The policy is chosen with `maxmemory-policy`. `allkeys-lru` and `allkeys-lfu` evict from all keys, the usual choice for a pure cache. The `volatile-` variants evict only keys with a TTL, which protects keys without one, such as rate-limit configuration. `noeviction` refuses writes when memory is full, which is right when Redis holds data that must not vanish, such as a queue, and wrong for a cache, because writes start failing at peak. Wren runs separate Redis instances for its cache, with `allkeys-lfu`, and for sessions and queues, with `noeviction` and alerts on memory.

## 9. Sizing a cache

How much memory does Wren need? The answer depends less on how much data exists than on how unevenly it is used. Popularity on the web usually follows a **Zipf distribution**, named after George Kingsley Zipf, who described it for word frequencies in 1935. The k-th most popular item is read in proportion to 1 ÷ k. The top item is read twice as often as the second, ten times as often as the tenth.

Take Wren's 100,000 menu items with Zipf popularity and exponent 1. The share of reads that go to the top k items is H(k) ÷ H(100,000), where H(n) is the harmonic number 1 + 1/2 + … + 1/n. Caching the top 100 items, 0.1% of them, serves 42.9% of reads. The top 1,000, 1%, serve 61.9%. The top 10,000 serve 81.0%, and the top 50,000 serve 94.3%.

@fig be_cache_zipf | Hit ratio against how many of 100,000 items are cached, under Zipf popularity.

The shape has two consequences. A small cache goes a long way, since 1% of the items gives most of the benefit. And the last few points of hit ratio are expensive, since going from 81% to 94% needs five times the memory. Real workloads are often more skewed than an exponent of 1, which makes small caches even better.

The arithmetic for memory is simple once the working set is known. Each Redis key costs its value plus overhead for the key itself, the hash table entry and metadata, roughly 50 to 100 bytes for small values. Wren's 2,000 restaurant menus at about 2,000 bytes each need about 4 MB. Its 200,000 active sessions at about 500 bytes each need about 100 MB. User profiles, permissions and order summaries for active users fill the rest. An 8 GB instance is generous, and leaves room for fork overhead during snapshots, which Part VII explains.

The best sizing tool is measurement. Redis reports evictions in `INFO stats`. If `evicted_keys` grows steadily while the hit ratio falls, the cache is too small. If memory sits at 30% and nothing is evicted, it is larger than it needs to be.

:::story Picture this
A café's display counter. It cannot hold every cake the bakery makes, so it holds the ones people buy most. Croissants sell every five minutes and never leave the counter. A rare lemon tart sells once a day and lives in the back. When a tour group asks to see every cake once, a sensible manager does not clear the croissants to make room.
:::

:::note TTL and eviction are different
A TTL removes an entry because it is too old. Eviction removes an entry because memory is full. A cache can be full of entries that are all within their TTLs, and eviction will still remove some. Conversely, expired entries can sit in Redis memory for a while until Redis notices them, which Part VII explains.
:::

:::warn Watch out
Running a cache and a durable store, such as sessions, job queues or rate-limit state, in the same Redis instance under `allkeys-lru` means a traffic spike in the cache can evict sessions and log every user out. Separate them, or at least give the durable keys no TTL and use a `volatile-` policy.
:::

:::interview Interview lens
**"How do you choose TTLs and an eviction policy?"** Set the TTL to the worst-case staleness the business accepts, rely on explicit invalidation for the usual case, give every key a TTL as a safety net, and add jitter so keys written together do not expire together. For a pure cache use `allkeys-lru` or `allkeys-lfu`, LFU when batch scans would pollute LRU. Keep durable data such as sessions or queues in a separate instance with `noeviction`. Size from the working set and the popularity curve, and watch evictions and hit ratio.
:::

:::key In one breath
A TTL bounds staleness and cleans up after failed invalidations, so every key gets one, chosen from the business's worst-case tolerance, with ±10% jitter so 10,000 keys loaded together expire over 720 s instead of one second. When memory fills, LRU evicts the least recently used key and LFU the least frequently used, which resists scans, and Redis approximates both by sampling 5 keys. Under Zipf popularity, caching 1% of 100,000 items serves 62% of reads and 10% serves 81%, so small caches go far and the last points of hit ratio are costly.
:::

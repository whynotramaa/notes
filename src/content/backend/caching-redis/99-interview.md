@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Why cache, and where

**Q1. What does a cache buy you, in numbers?**

Lower average latency, h × t_hit + (1 − h) × t_miss, and lower load on the source, which sees only misses. At 2,000 requests per second, a 90% hit ratio sends 200 to the database instead of 2,000.

**Q2. Why does a drop from 90% to 80% hit ratio matter so much?**

Database load follows the miss ratio, which doubles from 10% to 20%. A database sized for the cached load can be pushed past its limit by a modest drop.

**Q3. Name the layers where a web request can be cached.**

Browser or app, CDN edge, gateway, local in-process cache, distributed cache such as Redis, the database buffer cache and the operating system page cache. Outer layers are cheaper per hit and harder to invalidate.

**Q4. Local cache or distributed cache?**

Local is microseconds and needs no network, but each instance has its own copy that can disagree and is lost on restart. Distributed is shared and consistent across instances at the cost of a round trip and serialization. Combine them with a short local TTL for hot keys.

**Q5. When should you not cache?**

When data changes as often as it is read, when stale reads are unacceptable, such as balances or payment status, or when the source is already fast enough. Caching adds staleness and a new failure mode.

### Caching patterns

**Q6. Describe cache-aside.**

Read the cache, on a miss load from the database and write the cache with a TTL, and delete the key after writes commit. It caches only what is read and degrades to the database if the cache fails.

**Q7. What is the cache-aside race?**

A reader misses and loads an old value, a writer updates the database and deletes the key, and then the reader writes the old value back, where it stays until the TTL. Versioned keys, leases or a delayed second delete close it.

**Q8. Why delete on write rather than update the cache?**

Two writers can update the database in one order and the cache in the opposite order, leaving an older value cached. A delete has no ordering problem, because the next reader loads whatever the database holds.

**Q9. Read-through versus cache-aside?**

In read-through the cache library loads misses through a loader function, so callers never handle misses and the library can coalesce them. Cache-aside puts that logic in application code.

**Q10. What are write-through, write-behind and write-around?**

Write-through updates cache and database before acknowledging. Write-behind acknowledges after the cache write and flushes later in batches, risking loss. Write-around writes only the database and deletes the key.

### Expiry, eviction and sizing

**Q11. How do you choose a TTL?**

From the worst-case staleness the business accepts, with explicit invalidation for the usual case. Every key gets one as a safety net, and TTLs get random jitter.

**Q12. Why add jitter to TTLs?**

Keys written together with the same TTL expire together and reload together, spiking the database. Multiplying by a random factor, such as 0.9 to 1.1, spreads expiries out.

**Q13. LRU or LFU?**

LRU evicts the least recently used key and suits most web workloads but is flushed by one-off scans. LFU evicts the least frequently used and resists scans, with decay so old popularity fades.

**Q14. How does Redis implement LRU?**

It samples a few random keys, 5 by default, and evicts the one idle longest, keeping a small pool of candidates. It stores a 24-bit clock per key instead of a linked list, which approximates true LRU well at 10 samples.

**Q15. Which maxmemory policies matter?**

allkeys-lru or allkeys-lfu for a pure cache, volatile variants to evict only keys with TTLs, and noeviction for data that must not vanish, such as queues, where writes fail instead.

**Q16. How do you size a cache?**

From the working set and the popularity distribution. Under Zipf popularity a small fraction of items serves most reads, 1% of 100,000 items about 62%. Watch evictions and hit ratio to adjust.

### Invalidation

**Q17. What are the main invalidation strategies?**

TTL expiry, delete on write after commit, versioned keys, and event-driven invalidation from the database's change stream. Most systems combine a TTL with one or two others.

**Q18. How do versioned keys help?**

Readers include a version stored with the source, such as menu:9:v42. A change bumps the version, so new reads miss and load fresh data, and a late write from a slow reader lands under the old name, which nobody reads.

**Q19. Why drive invalidation from change data capture?**

It catches every writer, including scripts and other services, in commit order, and decouples writers from caches. The cost is a pipeline and a delay of tens to hundreds of milliseconds.

**Q20. What is negative caching?**

Caching the fact that a key does not exist, with a short TTL, so repeated lookups for missing data skip the database. Creation of the key must delete the marker.

**Q21. What is cache warming and when do you need it?**

Loading popular keys before sending traffic to a cold cache, such as a new cluster or after a key format change. Ramping traffic gradually achieves the same without a load burst.

### Failure modes

**Q22. What is a cache stampede?**

A popular key expires and many concurrent requests miss and rebuild it at once, multiplying load on the database, which slows and widens the window. 2,000 requests per second and a 200 ms rebuild give 400 duplicate queries.

**Q23. How do you prevent stampedes?**

Request coalescing per process, a short lock in Redis so one request rebuilds across the fleet, probabilistic early refresh before expiry, and serving stale copies while refreshing.

**Q24. Explain probabilistic early expiration.**

Each read refreshes early with probability that rises as expiry approaches, using now − δ·β·ln(rand) ≥ expiry, where δ is the rebuild time. One request usually refreshes the key shortly before it expires, without coordination.

**Q25. What is stale-while-revalidate?**

Serving a slightly expired copy immediately while refreshing it in the background, within a configured stale window. stale-if-error extends it to serving stale copies while the origin fails.

**Q26. What is cache penetration and how do you stop it?**

Requests for keys that never exist bypass the cache and hit the database every time. Validate ids, cache negative results, and use a Bloom filter to reject ids that were never created.

**Q27. How does a Bloom filter work?**

A bit array and k hash functions. Adding sets k bits, checking reads them, and any zero means definitely absent. False positives are possible, false negatives are not, and size follows m = −n ln p ÷ (ln 2)².

**Q28. What is a cache avalanche?**

Many keys missing at once, from a shared TTL, a restarted empty cache or a key format change, sending the full load to the database. Jitter, persistence, replicas, warming and staged key changes prevent it.

**Q29. What are hot keys and big keys?**

A hot key is read so often it overloads its shard, fixed with local copies, replicated key names or replica reads. A big key is a value so large its operations block the single thread and the network, fixed by splitting and partial reads.

**Q30. What happens to your service when Redis goes down?**

With long timeouts, every request waits and the API stalls. With short timeouts, all traffic falls through to the database, which may collapse. Short timeouts, a circuit breaker, local caches, coalescing and load shedding keep the service degraded but up.

### Redis structures

**Q31. Which Redis types would you use for sessions, rate limits, leaderboards and queues?**

Hashes with TTLs for sessions, INCR with EXPIRE or sorted sets or Lua for rate limits, sorted sets for leaderboards, and lists or streams with consumer groups for queues.

**Q32. How is a sorted set implemented?**

A hash from member to score plus a skip list ordered by score, with span counts for ranks. Inserts, updates, ranks and lookups are O(log n), and range reads O(log n + k).

**Q33. Streams versus lists versus pub/sub?**

Pub/sub broadcasts to current subscribers with no storage. Lists are simple queues with blocking pops. Streams are logs with consumer groups, pending entries, acknowledgements and replay.

**Q34. When would you use HyperLogLog or a bitmap?**

HyperLogLog to estimate unique counts in 12 KB with 0.81% error when exact membership is not needed. Bitmaps for exact per-user flags over dense integer ids, such as daily activity, with set operations across days.

### Redis internals

**Q35. Why is Redis single-threaded, and what does that imply?**

Commands run one at a time on an event loop, so there are no locks and every command is atomic. Any slow command, such as KEYS or HGETALL on a huge hash, blocks every client.

**Q36. What does pipelining do?**

Sends many commands without waiting for each reply, paying roughly one round trip instead of one per command. It is not atomic.

**Q37. MULTI/EXEC versus Lua scripts?**

MULTI/EXEC queues commands and runs them together but cannot branch on values read inside and has no rollback. WATCH adds optimistic aborts. Lua scripts read, decide and write atomically on the server.

**Q38. How do keys expire in Redis?**

Lazily when accessed, and actively by sampling 20 keys with TTLs ten times a second and repeating while more than 25% are expired. Expired keys can occupy memory until found.

**Q39. Compare RDB and AOF.**

RDB forks a child to write a snapshot using copy-on-write, compact and fast to restore, losing writes since the last snapshot. AOF logs every write, losing about a second with everysec, and is rewritten periodically.

### Redis at scale

**Q40. How does Sentinel fail over?**

Sentinels detect the primary is unreachable, agree by quorum, elect a leader that promotes the best replica and reconfigures the others, and clients ask sentinels for the new address. Asynchronous replication means recent writes can be lost.

**Q41. How does Redis Cluster place keys?**

CRC16 of the key modulo 16,384 picks a slot, and each primary owns a slot range. Clients cache the map and follow MOVED and ASK redirects. Hash tags keep related keys in one slot for multi-key operations.

**Q42. Should Redis be your database of record?**

Usually not. Data lives in memory, replication is asynchronous and persistence can lose seconds. Use it for fast copies and short-lived state, with the durable truth in a database.

### CDNs

**Q43. How does a CDN work?**

Users are routed to a nearby POP, which serves cached responses or fetches from the origin on a miss, governed by HTTP caching headers and a cache key.

**Q44. What goes into a CDN cache key?**

Whatever changes the response, path, relevant query parameters and headers listed in Vary, and nothing else. Strip tracking parameters, normalize values and never include cookies for shared content.

**Q45. How do you update content cached at the edge?**

Fingerprinted URLs with long immutable lifetimes for assets, and purges by URL or surrogate-key tags for fixed URLs, often driven by the same change events as application caches.

**Q46. What is an origin shield?**

A middle cache tier that edges ask on a miss, so the origin sees one fetch per object instead of one per POP, with concurrent misses collapsed.

**Q47. What security does the edge provide?**

DDoS absorption across many POPs, WAF rules against common attacks, bot mitigation, and signed URLs or cookies for private content. The origin must still be secure and should accept only CDN traffic.

### Primary sources

[Nishtala et al., Scaling Memcache at Facebook, NSDI 2013](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala). Leases, stampedes and invalidation at scale.

[Vattani, Chierichetti and Lowenstein, Optimal Probabilistic Cache Stampede Prevention, VLDB 2015](https://www.vldb.org/pvldb/vol8/p886-vattani.pdf). The XFetch algorithm.

[Redis documentation](https://redis.io/docs/latest/). Data types, eviction, persistence, Sentinel and Cluster.

[Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/). Hash slots, redirects and failover.

[RFC 9111, HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111) and [RFC 5861](https://www.rfc-editor.org/rfc/rfc5861). Cache-Control, stale-while-revalidate and stale-if-error.

[Bloom, Space/Time Trade-offs in Hash Coding with Allowable Errors, 1970](https://dl.acm.org/doi/10.1145/362686.362692). The original Bloom filter.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Hit ratios, TTLs and sizing

**E1** ● With hits at 0.5 ms and misses at 9 ms, what is the average latency at a 95% hit ratio?

**E2** ● A service receives 3,000 requests per second with an 85% hit ratio and 3 queries per miss. How many queries per second reach the database?

**E3** ● 20,000 keys are written together with a TTL of 1,800 s and ±20% jitter. Over how many seconds do they expire, and about how many per second?

**E4** ● Under Zipf popularity with exponent 1 over 100,000 items, what hit ratio does caching the top 5,000 give?

**E5** ● Layers return 40% from the browser, 90% of the rest from the CDN and 80% of what remains from Redis. What fraction of requests reach the database?

**E6** ● The browser caches for 30 s, the CDN for 120 s and a local cache for 2 s. What is the longest Redis TTL that keeps worst-case staleness within 300 s?

### Failure modes

**E7** ● A key is read 1,500 times per second and takes 300 ms to rebuild. How many rebuilds start when it expires without protection, with per-process coalescing on 6 instances, and with a Redis lock?

**E8** ● Size a Bloom filter for 10,000,000 ids at a 0.1% false positive rate. How many bits, megabytes and hash functions?

**E9** ● With XFetch, δ = 0.5 s, β = 1 and 1,000 reads per second, at about what time before expiry has someone refreshed with probability one half?

**E10** ●● A service gets 3,000 requests per second, 2 queries per miss, and its database is comfortable at 1,200 queries per second. Redis fails, and a local cache serves 40% of requests. How many requests per second must be shed?

**E11** ●● Trace the cache-aside race with exact steps and show how versioned keys prevent it.

**E12** ●● Two writers update a price to 100 and then 120. Show how updating the cache on write can leave 100 cached, and why deleting does not.

**E13** ●● A scraper requests 5,000 random order ids per second. Which defences apply in which order, and what reaches the database?

**E14** ●● A promotion makes `menu:9` 50,000 reads per second on one shard of a three-shard cluster. Propose two fixes and estimate the Redis load after each with 20 app instances.

### Redis

**E15** ● How long do 1,000 commands take one at a time at a 0.8 ms round trip, and pipelined with 2 µs of server time each?

**E16** ● How much memory does a daily active-user bitmap need for 50,000,000 users, and for 30 days?

**E17** ● Estimate memory for 5,000,000 unique visitor ids of 16 bytes in a set at about 66 bytes per member, compared with a HyperLogLog.

**E18** ● An 8 GB Redis forks for a snapshot at 15 ms per GB of page table copying. How long is the pause, and what is the worst-case memory during the snapshot?

**E19** ● With AOF everysec and 3,000 writes per second, roughly how many writes can a crash lose?

**E20** ●● Choose structures and commands for online couriers per zone with heartbeats, unique visitors per restaurant per day, a job queue with acknowledgements, weekly top restaurants, and a 100 per minute per user rate limit.

**E21** ●● Write a Lua script that decrements stock only if it is positive and returns the result. Why prefer it to WATCH under contention?

**E22** ●● Code runs `MGET user:42:name user:42:city` and a Lua script that updates `user:42:cart` and `user:42:prefs`. What breaks when moving to Cluster, and how do you fix it?

**E23** ●● Describe a Sentinel split-brain scenario, what is lost, and which settings bound the loss.

### CDNs and design

**E24** ● 20,000,000 image requests a day hit a CDN at 97%. How many reach the origin per day and per second on average?

**E25** ● 400 new images are published and each is requested in all 250 POPs. How many origin fetches occur without and with an origin shield?

**E26** ●●● Write pseudocode for a cache helper with versioned keys, jittered TTLs, per-process coalescing, negative caching and a stale fallback when the database fails.

**E27** ●●● Design caching for an order status endpoint polled every 5 s by 50,000 active orders, with a 5 s staleness budget.

**E28** ●●● Prove that when each cache layer fills from the next and none is invalidated, the worst-case staleness seen by a client is the sum of the layers' TTLs, and give a timeline that reaches it.

**E29** ●●● Design weekly leaderboards for 2,000 restaurants overall and in 50 cities, with ties broken by earliest achievement and a clean weekly rollover.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 0.95 × 0.5 + 0.05 × 9 = 0.475 + 0.45 = 0.925 ms.

**E2.** Misses are 3,000 × 0.15 = 450 per second, each running 3 queries, so 1,350 queries per second.

**E3.** The TTLs fall between 0.8 × 1,800 = 1,440 s and 1.2 × 1,800 = 2,160 s, a span of 720 s, so about 20,000 ÷ 720 ≈ 27.8 keys expire per second.

**E4.** H(5,000) ÷ H(100,000) ≈ 0.752, so about 75.2% of reads.

**E5.** 0.6 × 0.1 × 0.2 = 0.012, so 1.2% of requests reach the database.

**E6.** 300 − 30 − 120 − 2 = 148 s.

**E7.** Without protection, 1,500 × 0.3 = 450 rebuilds. With coalescing, at most one per instance, 6. With a Redis lock, 1.

**E8.** m = −10,000,000 × ln 0.001 ÷ (ln 2)² ≈ 143,775,876 bits, about 17.97 MB, and k = (m ÷ n) ln 2 ≈ 9.97, so 10 hash functions.

**E9.** The expected number of early refreshes before time T is 1,000 × 0.5 × e^(−T ÷ 0.5) = 500 e^(−2T). The chance that at least one happened is one half when 500 e^(−2T) = ln 2, so T = ln(500 ÷ 0.693) ÷ 2 ≈ 3.29 s before expiry.

**E10.** The local cache serves 40% of 3,000 = 1,200, leaving 1,800 requests per second needing the database, 3,600 queries per second. The database can do 1,200, which serves 600 requests. So 1,800 − 600 = 1,200 requests per second must be shed or queued, 40% of traffic, unless stale copies or a static fallback cover them.

**E11.** Reader R gets a miss on menu:9 at t0 and reads price 100 from the database at t1. Writer W commits price 120 at t2 and deletes menu:9 at t3. R writes menu:9 = 100 at t4. Every reader until the TTL sees 100. With versioned keys, W's transaction also bumps menu_version from 41 to 42. R read version 41 and writes menu:9:v41 at t4. New readers look up version 42, miss menu:9:v42, and load 120. The stale value sits under a key nobody reads until it expires.

**E12.** Writer A commits price 100 and writer B commits 120, in that order. A is slow to reach the cache, so B sets 120 first and A then sets 100. The database says 120 and the cache says 100 until the TTL. If both delete instead, the order of deletes does not matter, the key is absent, and the next reader loads 120.

**E13.** The edge's bot rules and rate limits drop much of it. Validation rejects malformed or out-of-range ids. The Bloom filter rejects ids that were never created, letting through about 1%, roughly 50 per second. Those check the negative cache, then the database, which stores a 30 s negative marker. The database sees at most about 50 queries per second, and fewer if ids repeat.

**E14.** A 1 s local cache on 20 instances turns the reads into about 20 Redis reads per second, since each instance reloads once a second. Alternatively, replicate the key as menu:9#1 to menu:9#8 placed on different shards, giving about 6,250 reads per second per copy, spread over all shards. The local cache is cheaper and the replicated key keeps the data in one place, and both can be combined.

**E15.** One at a time, 1,000 × 0.8 = 800 ms. Pipelined, about 0.8 + 1,000 × 0.002 = 2.8 ms.

**E16.** 50,000,000 bits is 6,250,000 bytes, 6.25 MB per day, and 187.5 MB for 30 days.

**E17.** About 5,000,000 × 66 = 330,000,000 bytes, 330 MB, against at most 12 KB for a HyperLogLog with 0.81% standard error.

**E18.** 8 × 15 = 120 ms of pause. In the worst case every page is written during the snapshot and copied, so memory approaches 16 GB.

**E19.** About one second of writes, roughly 3,000.

**E20.** Online couriers: a sorted set per zone, member courier id, score last heartbeat time, ZADD on each heartbeat and ZREMRANGEBYSCORE to drop those silent for 30 s. Unique visitors: PFADD visitors:9:2026-10-06 user:42 and PFCOUNT. Job queue: a stream with XADD, XREADGROUP, XACK and XAUTOCLAIM. Weekly top restaurants: ZINCRBY board:2026-W41 1 rest:9 and ZREVRANGE 0 9. Rate limit: INCR rl:42:<minute> with EXPIRE 60 for a fixed window, or a sorted set or Lua token bucket for smoother limits.

**E21.** One version:

```lua
local s = tonumber(redis.call('GET', KEYS[1]) or '0')
if s > 0 then
  return redis.call('DECR', KEYS[1])
end
return -1
```

The script runs atomically on Redis's single thread, so no other command interleaves and there are no retries. With WATCH, every concurrent buyer whose key changed between WATCH and EXEC gets nil and retries, and under heavy contention most attempts fail and retry, multiplying traffic.

**E22.** The keys hash to different slots, user:42:name and user:42:city to two slots and user:42:cart (slot 12,984) and user:42:prefs (slot 10,740) to two more, so MGET and the script fail with CROSSSLOT. Rename them with a hash tag, {user:42}:name, {user:42}:city, {user:42}:cart and {user:42}:prefs, which all hash user:42 to slot 15,880. Migrate with dual reads or a one-time copy before switching to the cluster.

**E23.** A partition separates the primary and a few clients from the sentinels and replicas. The sentinels reach quorum, promote a replica, and other clients write to it. The old primary keeps accepting writes from its side. When the partition heals, the old primary becomes a replica of the new one and discards its writes from the partition. Setting min-replicas-to-write 1 and min-replicas-max-lag 10 makes the old primary stop accepting writes about 10 s after it loses its replicas, bounding the loss to that window.

**E24.** 20,000,000 × 0.03 = 600,000 per day, about 600,000 ÷ 86,400 ≈ 6.94 per second on average, with peaks well above that.

**E25.** Without a shield up to 400 × 250 = 100,000 origin fetches. With a shield, 400, one per image.

**E26.** One approach:

```text
function cached(family, id, load, ttl, budget_stale):
  version = versions.get(family, id)            # cached ~1 s locally
  key = family + ":" + id + ":v" + version
  hit = redis.get(key, timeout = 50 ms)          # errors count as misses
  if hit is NEGATIVE: return NOT_FOUND
  if hit and not hit.logically_expired(): return hit.value
  return inflight.do(key, () ->                  # per-process coalescing
    try:
      value = load(id)
      redis.set(key, value or NEGATIVE,
                ex = (value ? ttl : 30) * random(0.9, 1.1) + budget_stale)
      return value or NOT_FOUND
    except DatabaseUnavailable:
      if hit: return hit.value                   # stale fallback
      raise ServiceUnavailable(retry_after = 5))
```

Values carry a logical expiry inside them, so a stale copy is still present for the fallback. The version lookup removes the stale-set race, coalescing removes per-process stampedes, and negative markers stop repeated missing-key lookups.

**E27.** Polls arrive at 50,000 ÷ 5 = 10,000 per second. Store each order's status in Redis as a small hash, `status:123`, written by the order service on every status change after commit, a write-through for this one field, with a TTL of a few hours as a safety net. Polls read only Redis, about 0.5 ms each, and fall back to the database on a miss. Because writes update Redis directly, staleness is normally milliseconds, well within 5 s. To cut polling, offer server-sent events or push notifications, Unit XII, and add an ETag so unchanged polls return 304 with no body. Never cache the payment state, which reads from the database.

**E28.** Let layers 1 to n have TTLs T1 to Tn, layer i filling from layer i + 1 and layer n from the source. A value served by layer 1 at time t was copied into layer 1 at most T1 earlier. At that moment layer 2's copy was at most T2 old, and so on, so the source value it reflects was read at least t − (T1 + … + Tn) and could have changed immediately after. Tightness: the source changes just after layer n copies it at time 0. Layer n − 1 copies from layer n just before Tn, layer n − 2 copies from layer n − 1 just before Tn + Tn−1, and so on, until layer 1 serves its copy just before T1 + … + Tn. That client sees data that has been stale for nearly the full sum.

**E29.** Use one sorted set per week overall, board:2026-W41, and one per city, board:2026-W41:pune, updated on every order. For ties broken by earliest achievement, encode the score as orders × 10^10 + (10^10 − seconds since week start at the last increment), so equal counts rank the one that got there first higher. A short Lua script reads the score, adds one order, replaces the time part and writes it back, and the values stay below 2^53, so doubles hold them exactly. Read the top ten with ZREVRANGE 0 9 and a position with ZREVRANK. At week end, a job copies the final top 100 per board to PostgreSQL and the next week's keys start empty, with old keys given a 30-day TTL. 2,000 restaurants across 51 sets is tiny. For exact counts, also count orders in the database and rebuild a board from it if Redis loses data.

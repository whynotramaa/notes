@part VI | Redis data structures | We open Redis and find that it is a server of data structures, not just a place to put strings. Choosing the right structure turns many backend features into a single command that runs in microseconds. We will cover strings, hashes, lists and sets, sorted sets for rankings, streams, bitmaps and HyperLogLog, and pub/sub. | where:6

## 18. Strings, hashes, lists and sets

Every Redis value lives under a key, and each key holds one of several types. The commands for each type run on the server, so a client can ask Redis to do the work rather than fetching data, changing it and writing it back.

A **string** holds up to 512 MB of bytes, text, JSON, serialized objects or numbers. Cached menus are strings. So are counters, because `INCR`, `INCRBY` and `DECR` treat a string as a 64-bit integer and change it atomically, which makes Redis the natural home for rate-limit counters and view counts. `SET key value NX EX 30` sets a value only if it does not exist and with an expiry, in one atomic step, which is the building block for locks and idempotency markers.

@fig be_redis_types | Six of the structures. Each comes with commands that run on the server.

A **hash** holds fields and values inside one key, like a small dictionary. Wren stores a session as `HSET sess:a1 user_id 42 role customer created 1791200000`, and can read one field with `HGET` or change one with `HSET` without fetching the whole object. Small hashes are stored compactly in a **listpack**, a single packed block of memory, until they pass a size threshold, `hash-max-listpack-entries`, 128 by default, which makes many small hashes far more memory-efficient than many separate keys.

A **list** is an ordered sequence with fast pushes and pops at both ends. `LPUSH` and `RPOP` make a simple queue, and `BRPOP` blocks until an item arrives, so a worker can wait without polling. `LMOVE` atomically moves an item from one list to another, which lets a worker keep a "processing" list for crash recovery. Lists are fine for simple job queues. Streams, below, are better when consumers need acknowledgements and replay.

A **set** holds unique members with no order. `SADD online:9 user:42` adds a member, `SISMEMBER` checks one in constant time, and `SINTER`, `SUNION` and `SDIFF` combine sets on the server. Wren uses sets for "which couriers are online in zone 7" and for tag membership. Set operations on large sets are linear in their size, so intersecting two million-member sets is a big-key problem in disguise.

The common thread is to push work to the data. Fetching a hash, changing one field in the application and writing it back is a read-modify-write race and three times the traffic. `HINCRBY` does it in one atomic command.

## 19. Sorted sets for rankings

A **sorted set** holds unique members, each with a numeric score, kept in order of score. It is the most distinctive Redis type and the answer to a large family of interview questions. Wren's "top restaurants this week" board is one sorted set, `board:week`, where each restaurant's score is its order count. `ZINCRBY board:week 1 rest:9` adds one order. `ZREVRANGE board:week 0 9 WITHSCORES` returns the top ten. `ZREVRANK board:week rest:9` returns restaurant 9's position, and `ZCOUNT` counts members in a score range.

Underneath, a large sorted set uses two structures. A hash table maps each member to its score for constant-time lookups. A **skip list**, a structure William Pugh described in 1990, keeps members in score order. A skip list is a sorted linked list with extra express lanes. Each node appears in the bottom lane, roughly half also appear in the lane above, a quarter in the lane above that, and so on, chosen at random. A search starts in the top lane and drops down whenever the next node's score is too high, so it touches about log₂ n nodes. For a million members, that is about 20 steps.

@fig be_redis_zset | Express lanes above a sorted list. A search skips most nodes and drops down a lane at a time.

Redis augments its skip list with the width of each lane jump, so it can compute a member's rank in O(log n) as well. Inserts, deletes, score changes and ranks are all O(log n), and reading a range of k members costs O(log n + k).

Sorted sets solve more than leaderboards. With a timestamp as the score, a sorted set becomes a time-ordered index, so `ZRANGEBYSCORE` returns everything in a window and `ZREMRANGEBYSCORE` trims old entries, which is exactly the sliding window log rate limiter of Unit X. With a due time as the score, it becomes a delay queue, where a worker repeatedly takes members whose score is below now. With a geohash as the score, Redis's `GEOADD` and `GEOSEARCH` commands implement "restaurants within 3 km" on top of a sorted set. A large ranking with millions of members fits easily, since each member costs tens of bytes plus its name.

## 20. Streams, bitmaps and HyperLogLog

A **Redis stream**, added in Redis 5.0 in 2018, is an append-only log of entries, each with an id made from a millisecond timestamp and a sequence number, such as `1703-0`. `XADD` appends, `XRANGE` reads a range, and `XREAD BLOCK` waits for new entries. The design borrows from Kafka, which Unit VIII covers, at a much smaller scale.

**Consumer groups** make streams a work queue. `XREADGROUP` delivers each entry to exactly one consumer in a group, and the entry stays in the group's **pending entries list** until the consumer acknowledges it with `XACK`. If a consumer crashes, its pending entries remain, and another consumer can claim them with `XAUTOCLAIM` after they have been idle too long. Wren's kitchen notifications run on a stream with a group of two workers. Streams are trimmed with `MAXLEN` or `MINID` so they do not grow forever, and because they live in memory, they suit thousands of entries per second retained for hours, not months.

@fig be_redis_stream | Entries append on the right. Each one goes to one consumer in the group and stays pending until acknowledged.

A **bitmap** is a string treated as an array of bits. `SETBIT dau:2026-10-06 42 1` marks user 42 as active today. `BITCOUNT` counts active users, and `BITOP AND` across two days gives users active on both, the core of a retention report. For 1,000,000 users a day's bitmap is 1,000,000 bits, 125,000 bytes. Bitmaps work best when ids are dense integers. Sparse ids, such as 64-bit random ones, waste memory.

**HyperLogLog**, from Philippe Flajolet and colleagues in 2007, estimates how many distinct items a set has seen without storing them. `PFADD visitors:9 user:42` records a visitor, and `PFCOUNT` returns an estimate. Each HyperLogLog uses at most 12 KB whatever the count, with a standard error of 0.81%. For restaurant 9's unique visitors, an estimate of 48,210 might really be anything from about 47,800 to 48,600. It cannot list the members or remove one, so it suits dashboards and analytics, not billing.

@fig be_redis_bits_hll | Exact counting with a bitmap, approximate counting in 12 KB with HyperLogLog.

The trade-off between the two is precision against memory and flexibility. A bitmap is exact and supports set operations across days, at a cost proportional to the id range. A HyperLogLog is approximate and fixed in size, and two can be merged with `PFMERGE` to count uniques across restaurants.

## 21. Pub/sub

**Pub/sub**, short for publish and subscribe, delivers messages from publishers to whoever is subscribed to a channel at that moment. Wren's app instances subscribe to `menu-changed`. When the catalogue service publishes `PUBLISH menu-changed 9`, every subscribed instance receives it and clears restaurant 9 from its local cache. That is how the two-tier cache from Part I keeps local copies within milliseconds of Redis instead of waiting for the 1 s TTL.

@fig be_redis_pubsub | A broadcast to everyone listening right now. A restarting instance simply misses it.

Redis pub/sub is fire-and-forget. Messages are not stored. A subscriber that is disconnected, restarting or too slow misses messages, and nobody tells it. There is no acknowledgement and no replay. For local cache invalidation that is acceptable, because the 1 s TTL bounds the damage of a missed message. For anything that must arrive, such as an order notification, it is the wrong tool, and streams or a real broker belong there.

Pub/sub also has a scaling quirk in Redis Cluster. Classic pub/sub broadcasts every message to every node in the cluster, so traffic grows with cluster size. Redis 7.0 added **sharded pub/sub**, `SPUBLISH` and `SSUBSCRIBE`, which keeps a channel's messages on the shard that owns the channel's slot.

Choosing between the Redis messaging options is a question of guarantees. Pub/sub gives instant broadcast with no memory. Lists give simple point-to-point queues with blocking pops. Streams give a log with consumer groups, acknowledgement and replay. Kafka, in Unit VIII, gives the same ideas with durable storage on disk, partitions and retention measured in days.

:::story Picture this
A town's message board, a postbox and a radio station. The board, a sorted set, keeps the rankings pinned up for anyone to read. The postbox, a stream, holds each letter until someone signs for it. The radio station, pub/sub, broadcasts to whoever has a radio on, and anyone who was asleep simply missed the news.
:::

:::note Key naming
Redis has no schema, so key names carry the structure. Wren uses `type:id[:field]`, such as `menu:9`, `sess:a1`, `rl:42:2026-10-06T20:05`, with colons as separators, a short type prefix, and versions or dates inside the name when they matter. Consistent names make `SCAN` patterns, memory analysis and invalidation by prefix possible. `KEYS *` on a production server blocks the event loop and should never be run.
:::

:::warn Watch out
Using a Redis list or pub/sub as a durable job queue is a common source of lost work. A `RPOP` removes the job before it is processed, so a worker crash loses it, and pub/sub drops messages for absent subscribers. Use `LMOVE` with a processing list, or streams with consumer groups, or a real broker.
:::

:::interview Interview lens
**"Design a real-time leaderboard for a million players."** A Redis sorted set keyed by board, with the player id as member and the score as score. `ZINCRBY` updates a score in O(log n), `ZREVRANGE 0 9` returns the top ten, and `ZREVRANK` gives a player's position, both O(log n) thanks to the skip list. A million members fits in tens of megabytes. Use one set per period, such as a week, with an expiry, and persist results to a database at period end. For ties, encode a tiebreaker such as time into the score.
:::

:::key In one breath
Redis serves data structures whose commands run on the server. Strings hold values and atomic counters, hashes hold small objects compactly in listpacks, lists make simple queues with blocking pops, and sets give membership and set algebra. Sorted sets keep members ordered by score with a skip list and hash, giving O(log n) updates and ranks for leaderboards, sliding windows, delay queues and geo search. Streams add a log with consumer groups and acknowledgements, bitmaps count 1,000,000 users in 125,000 bytes, HyperLogLog estimates uniques in 12 KB with 0.81% error, and pub/sub broadcasts without storing anything.
:::

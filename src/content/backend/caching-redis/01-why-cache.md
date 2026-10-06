@part I | Why cache, and where | We start with what a cache buys and what it costs, measured in latency and in database load. The numbers explain why a small change in hit ratio can decide whether a database survives the dinner rush. We will cover hit ratio arithmetic, the layers of caching along a request's path, and the choice between local and distributed caches. | where:1

## 1. What a cache buys

Wren's menu endpoint reads the same data again and again. Restaurant 9's menu changes a few times a week and is read thousands of times an hour. Loading it from PostgreSQL costs two queries of 4 ms each, plus connection time from the pool. Loading it from Redis costs one round trip of about 0.5 ms. A **cache** is a store that keeps a copy of data somewhere faster or closer than its source, so repeated reads can skip the slow trip.

The fraction of reads the cache answers is the **hit ratio**. A read the cache answers is a **hit**, and one it cannot answer is a **miss**, which goes to the source and usually puts the result in the cache for next time. With a 90% hit ratio, average latency is a weighted mix.

$$t_{avg} = h \cdot t_{hit} + (1 - h) \cdot t_{miss}$$

Read it as "the share of hits times their cost, plus the share of misses times theirs". With a hit costing 0.5 ms and a miss costing about 9 ms, the GET, two queries and a SET, Wren averages 0.9 × 0.5 + 0.1 × 9 = 1.35 ms. At 99% it would be 0.585 ms, and at 80% it would be 2.2 ms.

@fig be_cache_why | Nine trips in ten end at the fridge. The tenth walks to the supermarket.

The second benefit matters more than latency. The database only sees misses. At 2,000 requests per second and a 90% hit ratio, 200 requests per second miss, each running two queries, so PostgreSQL handles 400 queries per second. Drop to 80% and the database sees 800. Climb to 99% and it sees 40. The database's load follows the miss ratio, which is why going from 90% to 99% is a tenfold change, not a 9% one.

@fig be_cache_hitratio | Database load against hit ratio. A ten-point drop doubles the queries.

That curve also explains the danger. A database sized for 400 queries per second with a cache in front is a database that cannot survive without the cache. Part V comes back to this with the cache outage.

Caches cost something too. They need memory and servers. They introduce **staleness**, the window in which the copy differs from the source. They add failure modes of their own. And they make the system harder to reason about, because every read now has two possible sources. Caching is worth it when data is read far more often than it changes, when the source is slow or expensive, and when slightly old data is acceptable. Wren's menus, restaurant profiles and session lookups fit. Account balances and stock counts usually do not.

## 2. The layers of caching

A request for restaurant 9's menu passes through several places that can keep a copy, and each one saves a trip to the next. The user's browser or app keeps responses according to HTTP caching headers, which Unit I covered. A **content delivery network**, a CDN, keeps copies at edge locations near users, the subject of Part IX. The API gateway can cache whole responses. Inside each app instance, a local cache in process memory can keep the hottest objects. A distributed cache such as Redis keeps shared copies for all instances. And inside PostgreSQL, the buffer cache keeps recently used pages in memory, as does the operating system's page cache beneath it.

@fig be_cache_layers | Seven rings, from the browser to the disk. Every inner ring is slower to reach and closer to the truth.

The outer layers are the cheapest per hit and the hardest to control. A response cached in a user's browser costs Wren nothing to serve again, but Wren cannot take it back. If the menu changes, the browser keeps the old copy until its `max-age` runs out, unless the response told it to revalidate. A copy in Redis can be deleted in a millisecond. The rule follows directly. The further out the cache, the shorter its lifetime should be or the more carefully its keys should be versioned.

Each layer also caches a different thing. The browser and CDN cache whole HTTP responses, keyed by URL and some headers. The gateway can do the same. The application caches objects or fragments, such as a serialized menu or a user's permissions, keyed however the code likes. The database caches pages of tables and indexes, regardless of which query wanted them. Choosing what to cache at which layer is mostly a question of what is shared between users. A menu is the same for everyone and can live at the CDN. A user's order history is private and belongs in the application cache, keyed by user.

Layers multiply staleness. If the CDN caches the menu for 60 s and Redis caches it for 300 s, the CDN can refresh from Redis just before Redis expires, and a user can see data up to 360 s old. Part X traces exactly that.

## 3. Local and distributed caches

A **local cache** lives inside the application process, as a hash map with a size limit, using a library such as Caffeine for Java, `functools.lru_cache` or cachetools for Python, or ristretto for Go. A lookup is a memory access, about a microsecond, with no network and no serialization. The weaknesses come from the same fact. Each of Wren's four instances has its own copy. When the tip on order 123 changes, one instance may hold tip 30 while another still holds 20, and nothing tells them. Each copy uses that instance's memory, and a restart empties it.

@fig be_cache_local_remote | Four local caches can disagree. One Redis gives everyone the same copy, half a millisecond away.

A **distributed cache** runs as a separate server that all instances share. Memcached, created by Brad Fitzpatrick for LiveJournal in 2003, popularized the idea, and Redis, released by Salvatore Sanfilippo in 2009, became the most common choice. Every instance sees the same copy, deleting a key invalidates it for everyone, and the cache survives app restarts. The price is a network round trip per lookup, serialization of every value, and one more server to run.

Most busy systems use both, a pattern called a **two-tier cache**. Wren keeps a small local cache, 10,000 entries with a 1 s TTL, for the very hottest keys such as the menus of the top restaurants during a promotion. Everything else goes to Redis. The 1 s limit bounds how long instances can disagree. When restaurant 9 changes its menu, users may see the old one for up to a second on some instances, which Wren accepts for menus and would never accept for an order's payment status.

Local caches have one more use that is easy to miss. They protect Redis itself from hot keys, which Part V explains. If 50,000 requests per second read one key, a 1 s local cache on 20 instances turns that into 20 Redis reads per second.

:::story Picture this
A home kitchen. The fridge holds what you use every day, a few seconds away. The supermarket holds everything, twenty minutes away. A good cook keeps the fridge stocked with what they actually use, throws out what has gone off, and accepts that sometimes the milk in the fridge is a day older than the milk in the shop. A cook who forgets the fridge exists drives to the supermarket for every egg.
:::

:::note Measuring hit ratio honestly
Count hits and misses per cache and per key family, such as `menu:*` and `user:*`, not one global number. A global 90% can hide a family at 30% that is quietly hammering the database. Redis reports `keyspace_hits` and `keyspace_misses` in `INFO stats`, and application metrics should label each lookup.
:::

:::warn Watch out
A database sized for the miss traffic is only safe while the cache is healthy. Before relying on a 90% hit ratio, ask what happens when it drops to 0% for a minute, during a deploy, a cache restart or a key format change. Part V shows the answer and the defences.
:::

:::interview Interview lens
**"When would you add a cache, and what does it cost?"** When data is read far more than it changes, the source is slow or expensive, and some staleness is acceptable. At 2,000 requests per second, a 90% hit ratio sends 200 requests a second to the database instead of 2,000, and average latency drops from about 9 ms to 1.35 ms. The costs are staleness, memory, a new failure mode when the cache is cold or down, and the complexity of keeping two copies in step. I would choose the layer by what is shared, CDN for public responses, Redis for shared objects, a short local cache for the hottest keys.
:::

:::key In one breath
A cache keeps a copy close by, and average latency is h × t_hit + (1 − h) × t_miss, so Wren's 90% hit ratio gives 1.35 ms instead of about 9 ms. The database sees only misses, 400 queries per second at 90% and 800 at 80%, which is both the benefit and the risk. Caches sit in layers from browser and CDN to local memory, Redis and database buffers, outer layers being cheaper and harder to invalidate. Local caches are microseconds but disagree between instances, distributed caches are shared but cost a round trip, and two tiers combine them.
:::

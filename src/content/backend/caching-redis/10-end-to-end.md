@part X | The menu request end to end | We follow one menu request through every cache layer and then break the layers one by one. A layered cache is only as good as the weakest agreement between its layers. We will cover the request's path with timings, staleness that adds up across layers, the Friday night Redis failure, and the whole unit on one page. | where:10

## 32. GET /restaurants/9/menu through every layer

User 42 opens restaurant 9 in the app at 8 p.m. The app checks its own HTTP cache first. The last response arrived 40 s ago with `Cache-Control: max-age=60`, so the app shows it without any network request. A minute later the copy is too old, and the app sends `GET /restaurants/9/menu`.

The request reaches the nearest CDN edge in about 5 ms. The edge holds a copy from 20 s ago with `s-maxage=60`, a hit, and it answers. At this layer roughly 95% of menu requests end. A request that misses at the edge goes to the origin shield and then to Wren's gateway, about 20 ms into the request, where it is authenticated, rate-limited and routed. The menu service checks its local cache, which holds the menus of the 1,000 hottest restaurants for 1 s, and restaurant 9 is among them during its promotion. If not, it asks Redis for `menu:9:v42`, the versioned key from Part IV, at about 20.5 ms. Only if Redis misses does the service run its two queries against PostgreSQL, about 28.5 ms in, then fill Redis with a jittered TTL near 300 s and respond with headers that let the edge and the app cache the result.

@fig be_cache_e2e | Six places that can answer. Most requests end at the first or second.

The numbers are illustrative, but the shape is real. Each layer's hit ratio multiplies, so even modest ratios compound. If 50% of opens are served by the app's own cache, 95% of the rest by the CDN, 30% of what reaches the service by the local cache and 90% of the remainder by Redis, then only 0.5 × 0.05 × 0.7 × 0.1 = 0.175% of menu opens reach PostgreSQL.

Every layer also adds staleness. The app may show a copy 60 s old. The edge may have fetched that copy when it was nearly 60 s old itself. The local cache adds up to 1 s, and Redis up to its TTL if invalidation fails. Wren's menus use versioned keys and change events, so Redis and the local cache are normally fresh within a second, and the CDN is purged by surrogate key. The worst case, when every invalidation fails, is the sum of the TTLs, about 60 + 60 + 1 + 300 = 421 s. The staleness budget for menus is 5 minutes, so Wren shortens the Redis TTL to 180 s, which brings the worst case to 301 s. Writing down that sum is how layered caches are kept honest.

## 33. Friday night failures, and the unit on one page

At 8:05 p.m. the Redis primary fails during restaurant 9's promotion. Each design decision in this unit now decides an outcome. Redis calls time out after 50 ms instead of seconds, and after a handful of failures the circuit breaker opens, so requests stop waiting at all. The local cache keeps serving the hottest menus, including restaurant 9's. Misses go to PostgreSQL, and request coalescing ensures that each menu is built once per instance rather than once per request. The database pool and statement timeouts from Unit VI keep PostgreSQL from drowning, and the few requests that cannot be served get 503 with Retry-After. The CDN, configured with `stale-if-error`, keeps serving cached menus even for requests that would have reached the origin. Within about 20 s, Sentinel promotes a replica, the circuit breaker closes after its probe succeeds, and the hit ratio is back near 90% because the replica held a copy of the data.

The same evening exercises the other failure modes. When the promotion's banner goes live, a key format change in the deploy could have caused an avalanche, but the new format was introduced alongside the old one and ramped. When restaurant 9's menu key expires at peak, early refresh rebuilt it 1.2 s earlier and nobody noticed. A scraper requesting random order ids is turned away by the Bloom filter and the edge's bot rules. Nothing here is luck. Each failure was named, and each has a cure built in before the evening started.

@fig be_cache_components | Patterns, expiry, invalidation, failures, Redis at scale and the edge, around one idea.

Put together, the unit is one idea seen from many sides. A cache is a copy, and every copy raises the same questions. Who fills it, who updates it and in what order, how old may it get, what happens when it is missing, and what happens when many requests notice that at the same moment? Redis answers many of them with fast data structures, an atomic single thread and configurable durability, and CDNs answer them at the edge of the network. Unit VIII turns to queues and events, which share the same change streams this unit used for invalidation.

:::story Picture this
A chain of corner shops supplied by a central warehouse. Each shop keeps popular items on its shelves, the regional depot keeps more, and only rare requests go to the warehouse. When the depot's lorry breaks down, shops sell from their shelves, put up "back tomorrow" signs for rare items, and do not send every customer to drive to the warehouse themselves. The shelves were stocked for exactly that day.
:::

:::warn Watch out
Layered caches make debugging confusing, because a user's stale data could come from any layer. Include the source in responses during debugging, such as `X-Cache: HIT` from the CDN and an `X-Cache-Source: local|redis|db` header from the service, and log cache outcomes alongside the request id.
:::

:::interview Interview lens
**"Walk me through how you would cache a popular, mostly public endpoint like a restaurant menu."** Version the data, set `Cache-Control` with a short `s-maxage` plus stale-while-revalidate and stale-if-error so the CDN serves most traffic, and tag responses with surrogate keys. In the service, use cache-aside on Redis with versioned keys, jittered TTLs and request coalescing, and a 1 s local cache for hot restaurants. Drive invalidation from database change events to Redis and the CDN. Sum the TTLs to check the worst-case staleness against the product's budget, and plan for Redis failure with short timeouts, a circuit breaker and load shedding.
:::

:::key In one breath
A menu request can be answered by the app's cache, the CDN edge in about 5 ms, the local cache, Redis at about 20.5 ms or PostgreSQL at about 28.5 ms, and multiplied hit ratios leave only 0.175% of opens reaching the database. Worst-case staleness is the sum of the layers' TTLs, 421 s until Redis's TTL is cut to 180 s, bringing it to 301 s within a 5-minute budget. When Redis fails, short timeouts, a circuit breaker, local caches, coalescing, database timeouts and stale-if-error at the edge keep the service up until Sentinel promotes a warm replica.
:::

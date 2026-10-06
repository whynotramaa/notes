<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A cache is a copy kept closer to where it is needed. It makes reads fast and protects the database, and in return it creates a second version of the truth that can be wrong, missing, or suddenly gone.</p>

This unit treats caching as a design discipline rather than a trick. The first five parts cover the ideas that apply to any cache, why caches work, the patterns for reading and writing through them, how entries expire and get evicted, how to invalidate them, and the failure modes that turn a cache into an outage. Parts VI to VIII open Redis, the most common cache server and much more than a cache, from its data structures through its single-threaded core to replication and clustering. Part IX moves the cache to the edge of the network with CDNs, and Part X follows one menu request through every layer.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to choose a caching pattern and defend its consistency, explain a stampede and three cures, pick the right Redis structure for a job, and say what happens to Wren when Redis disappears at the Friday peak.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Peak traffic | 2,000 requests per second | Load on every layer |
| Redis hit ratio | 90% | Database load |
| Redis round trip | 0.5 ms | Cost of a hit |
| Miss path | 2 queries of 4 ms, plus GET and SET | Cost of a miss, about 9 ms |
| Database comfort limit | 1,000 queries per second | When a cache outage hurts |
| Restaurants and menu items | 2,000 and 100,000 | Working set and popularity |
| Menu response | 2,000 bytes, rebuilt in 200 ms | Stampede cost |
| Redis memory | 8 GB, one primary and two replicas, later 3 shards | Eviction and scale |
| Active sessions | 200,000 at about 500 bytes each | Session storage |
| CDN | 300 edge locations, 95% hit ratio for images | Origin load |

The main request in this unit is `GET /restaurants/9/menu`, which thousands of users send every minute during dinner. Part X follows it from the browser to the disk.

</section>

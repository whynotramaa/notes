<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Most backend outages that start with "the database" are really about how the service talks to it. The database is fine, and the pool is empty, a transaction is holding a lock, or a migration is waiting at the door.</p>

This unit sits between your code and PostgreSQL. It does not teach SQL or indexing from scratch, which the database fundamentals guide covers. It teaches what a backend engineer controls, which is how connections are opened and shared, how long each query may run, what an ORM does behind your back, where transactions begin and end, how two requests editing the same row are kept from destroying each other's work, and how to change a table that serves 2,000 requests a second without stopping it.

The first five parts follow a single query. They cover connections and pools, the query itself, the ORM that writes it, the transaction around it, and the locks it takes. Parts VI and VII change the schema underneath while traffic flows. Part VIII spreads reads across replicas and connections across a pooler, and Part IX traces the order write and three ways it fails.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to size a pool on a whiteboard, explain N+1 and its fixes, choose between `SELECT FOR UPDATE` and a version column, and plan a column rename that never takes the site down.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Peak traffic | 2,000 requests per second, 500 per instance | Load on the data layer |
| App instances | 4 normally, up to 20 when autoscaled | Total connections |
| Pool per instance | 10 connections | Concurrency to the database |
| PostgreSQL | 8 cores, `max_connections` 100, 3 reserved | The hard ceiling |
| Cache hit ratio | 90%, so 50 misses per second per instance | Requests that reach SQL |
| Queries per miss | 2, at 4 ms each | Time a connection is held |
| Round trip to the database | 0.8 ms including execution of a simple lookup | N+1 cost |
| New connection | 5 ms (illustrative) | Why pools exist |
| Orders table | 5,000,000 rows, 50 new orders per second at peak | Migrations and backfills |

The main request in this unit is `POST /orders` from user 42 for one biryani from restaurant 9, plus the read `GET /orders/123`. Part IX traces the write through every stop.

</section>

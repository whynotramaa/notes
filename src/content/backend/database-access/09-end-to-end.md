@part IX | The order write end to end | We follow Wren's order through the data layer with timings, then break it three ways. Tracing one request through every stop is the quickest way to check that the unit's ideas fit together. We will cover the order write step by step, the failure chain when the database slows down, a primary failover, and the whole unit on one page. | where:9

## 30. The order write, step by step

User 42 places an order for one biryani from restaurant 9. Units III to V got the request through authentication, authorization, validation and the idempotency check. The service charged the card through the payment provider with an idempotency key, before any transaction opened, as Part IV recommended. Now `OrderService.place` must record everything.

It opens a unit of work, which borrows a connection from the pool in about 0.05 ms. It sends `BEGIN`, a 0.5 ms round trip. It loads the menu items with `SELECT ... WHERE id = ANY($1)`, one query for all items rather than one per item, 4 ms. It inserts the order with `INSERT ... RETURNING id`, 4 ms, and gets back id 124. It inserts all five order items in one multi-row `INSERT`, 4 ms. It inserts the outbox event that Unit VIII will turn into a kitchen notification, 4 ms. Then it sends `COMMIT`, which waits for PostgreSQL to flush the WAL to disk, about 2 ms here. The unit of work returns the connection to the pool.

@fig be_db_e2e | Seven steps, 18.55 ms of illustrative time. Only the COMMIT makes it permanent.

The total is 0.05 + 0.5 + 4 + 4 + 4 + 4 + 2 = 18.55 ms with one borrowed connection. Several choices from the unit show up in those numbers. The items were loaded with one query, not one per item, which avoids a small N+1. The order items used one multi-row insert, which saves four round trips. The stock decrement, not shown, uses the atomic `UPDATE ... WHERE stock > 0` from Part V, and a sold-out item makes it update 0 rows, which raises a domain error and rolls back the whole transaction. The idempotency key's unique index guarantees that a retry of the whole request cannot create order 125 as a duplicate.

What is not in the transaction matters as much. The payment call is outside. So is publishing to the message broker, which happens when the outbox relay reads the committed row. If the process crashes between `COMMIT` and the response, the order exists, the outbox will deliver its event, and the client's retry with the same idempotency key gets the stored response. Every failure leaves the system in a state the design already handles.

## 31. When the database slows down

A forgotten index makes a common query take 2 s instead of 4 ms during the Friday dinner peak. The chain of failures is predictable, and every link was covered somewhere in the unit.

Each cache-miss request now holds its connection for about 4 s. Little's law says each instance needs 50 × 4 = 200 connections and has 10. The pools exhaust within a second. New requests wait 250 ms to borrow, fail, and return 503. Mobile clients retry, adding load to a database that is already saturated with slow queries. Requests that hit the cache are fine at first, but if the web server's workers are all waiting on the pool, those requests queue too.

@fig be_db_dominoes | Each link was a design decision. Each one is also a place to break the chain.

The unit's tools break the chain at different links. `statement_timeout` of 200 ms cancels the slow queries, so each connection is freed in 200 ms instead of 2 s, and the pool serves at least some requests. The short pool wait fails fast and keeps workers free for cached requests. The 503 with Retry-After and jittered client backoff, which Unit X builds on, stops retries from multiplying load. The pool and database dashboards from Unit XIV show what happened, wait time rising, active connections pinned at 10, one query at the top of `pg_stat_statements` by total time.

The fix is the index, created with `CREATE INDEX CONCURRENTLY` so the cure does not cause its own outage. The lesson is that pool size was never the problem and raising it would have made things worse.

## 32. When the primary dies, and the unit on one page

On another evening the primary's host fails. To the application, a failover looks like a sequence. Open connections error, because their TCP connections have died. The pool notices on the next borrow or liveness check and evicts them. Requests in flight fail, and the ones with idempotency keys can be retried safely. Meanwhile the platform promotes a replica, which on managed services typically takes tens of seconds, and points the database's DNS name or proxy at it. New connections from the pool reach the new primary, and service recovers.

@fig be_db_failover | The pool's job during failover is to throw away dead connections quickly and reconnect.

Three details decide how smoothly that goes. The pool's max lifetime and liveness checks must drop dead connections rather than hand them to requests. DNS caching in the application must respect the record's short TTL, or the app keeps dialling the dead host. And transactions in flight at the moment of the crash may or may not have committed, depending on whether the WAL reached the replica. With asynchronous replication, the last few milliseconds of commits can be lost, which is why payment and order flows rely on idempotency keys and reconciliation rather than on the database alone.

@fig be_db_components | Code, pool, transaction, locks, primary and replicas, all while migrations reshape the tables underneath.

Put together, the unit is one path with a limit at every stop. Code writes SQL directly or through an ORM, whose loading strategy decides how many round trips a page makes. The pool lends a few warm connections, sized by Little's law and protected by short waits. The transaction groups one use case's writes and nothing slower. Locks, versions, atomic statements and constraints keep concurrent writers honest. The primary writes the WAL and enforces constraints, and replicas serve reads a little behind. Migrations change the tables underneath while all of this keeps running. Unit VII adds a cache in front of the whole path.

:::story Picture this
A restaurant kitchen during a rush. Orders come in on tickets, a fixed number of cooks work the stoves, each dish leaves only when every part of it is ready, and nobody takes two portions from the last tray at once. When the oven breaks, the head chef stops taking orders the kitchen cannot cook, rather than letting a hundred tickets pile up, and moves to the second oven. Every rule in this unit has a version on that kitchen wall.
:::

:::warn Watch out
Load tests often run against a database with a few thousand rows and miss every problem in this part. Test with production-sized data, or at least a realistic copy, so query plans, index sizes and migration times match what will really happen.
:::

:::interview Interview lens
**"Walk me through what happens in the data layer when your service creates an order, and what happens if the database becomes slow."** The service borrows a pooled connection, begins one transaction, loads items in one query, decrements stock atomically, inserts the order, items and an outbox row, and commits, about 19 ms, with the payment call and event publishing outside the transaction and a unique idempotency key against duplicates. If the database slows, connections are held longer, Little's law says the pool needs far more than it has, and it exhausts. Statement timeouts free connections, short pool waits fail fast with 503 and Retry-After, clients back off with jitter, and the fix is the slow query, not a bigger pool.
:::

:::key In one breath
Wren's order write borrows a connection, runs BEGIN, one items query, the order, items and outbox inserts, and COMMIT in about 18.55 ms, with payment and publishing outside the transaction and idempotency keys guarding retries. When a query slows from 4 ms to 2 s, connections are held 4 s, pools exhaust and retries amplify the load, and statement timeouts, fast-failing pool waits and client backoff break the chain while a concurrent index fixes the cause. In a failover the pool must discard dead connections and reconnect to the promoted replica, and idempotency covers commits lost in the switch.
:::

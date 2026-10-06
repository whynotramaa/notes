@part III | Inside an ORM | We open the ORM to see how rows become objects and how changed objects become SQL. Most ORM performance disasters come from not knowing when the ORM decides to talk to the database. We will cover hydration, the identity map and dirty checking, the N+1 problem with its three cures, and the places where an ORM quietly turns dangerous. | where:3

## 9. Hydration, the identity map and dirty checking

When Wren's code asks the ORM for order 123, the ORM writes a `SELECT`, gets back a row of plain values, and builds an `Order` object from it. Building objects from rows is called **hydration**. It is not free. For each row the ORM creates an object, converts each column to the right type, registers the object in its bookkeeping and sets up placeholders for related objects that have not been loaded yet. For 20 rows this costs microseconds. For 100,000 rows it can cost seconds and hundreds of megabytes, which is why reporting code should not load entities at all.

@fig be_db_hydration | Rows go in, linked objects come out. Two orders point at one restaurant object.

Two patterns named by Martin Fowler in *Patterns of Enterprise Application Architecture* (2002) explain most of what an ORM session does. The **identity map** keeps one object per database row per session. Ask for order 123 twice and you get the same object back, and the second request makes no query at all. This keeps the session consistent, since a change made through one reference is visible through every other, and it saves round trips.

@fig be_db_identity_map | The second lookup never reaches the database. Both names point at one object.

The **unit of work** tracks every object the session has loaded or created and works out what to write when the transaction commits. To know what changed, the ORM keeps a snapshot of each object's original values. At flush time it compares current values against the snapshot, a step called **dirty checking**, and writes an `UPDATE` containing only the changed columns. Wren's code sets `order.tip = 30` and never writes SQL, and at commit the ORM emits `UPDATE orders SET tip = 30 WHERE id = 123`.

@fig be_db_dirty | The snapshot says 20, the object says 30, so the UPDATE sets one column.

The consequence is that SQL runs at moments the code does not spell out. A flush happens at commit, but also before some queries, so the query sees pending changes, and whenever the code calls flush. A developer reading the service sees assignments to fields. The database sees statements at flush time. Knowing when flushes happen, and logging the SQL during development, removes most of the mystery.

## 10. The N+1 query problem

Wren's order history page shows user 42's 20 most recent orders, each with its restaurant's name. A natural ORM version loads the orders with one query, then loops over them and reads `order.restaurant.name`. The restaurant relation is **lazy**, which means the ORM loads it only when code touches it, so every iteration triggers a separate `SELECT` for one restaurant. That is 1 query for the list plus 20 for the restaurants, the **N+1 problem**, named for the one query you meant and the N you did not.

At 0.8 ms per round trip, 21 queries cost 16.8 ms. Doing the same work in 2 queries costs 1.6 ms. If the page also shows each order's items through another lazy relation, it becomes 1 + 20 + 20 = 41 queries and 32.8 ms, most of it spent waiting on the network, and each query also borrows the connection and adds load to the database. Put the service in one region and the database in another, 60 ms apart, and the page takes over two seconds.

@fig be_db_n1 | Twenty-one trips to the kitchen, or two. The work is the same; the walking is not.

There are three cures. **Eager loading with a join** fetches orders and restaurants in one query. It is a single round trip, but each order row repeats the restaurant's columns, and joining two one-to-many collections multiplies rows, 20 orders × 5 items × 3 payments becomes 300 rows to deduplicate. **Select-in loading**, also called batch loading, runs the order query and then one more query, `SELECT * FROM restaurants WHERE id IN (9, 14, 31)`, and stitches the results in memory. It is two round trips with no duplication, and it is usually the best default for collections. Lazy loading itself is fine when only a few rows will touch the relation.

@fig be_db_loading | Lazy, joined and select-in. The last one is the usual answer for lists.

GraphQL servers meet the same problem in a different shape, as Unit V described, and solve it with a DataLoader that collects ids during one tick and issues one batched query.

The hard part is noticing. N+1 hides in templates, serializers and helper methods far from the code that loaded the list. Wren catches it in three ways. Development mode logs a warning when one request issues more than 30 queries. Tests assert the number of queries for key endpoints. And `pg_stat_statements` in production shows a simple `SELECT FROM restaurants WHERE id = $1` with an enormous call count, the fingerprint of a loop.

## 11. When an ORM becomes dangerous

ORMs are safe for the work they were designed for, loading a handful of entities, changing a few fields and saving them. Outside that zone they fail in recognisable ways.

Hidden queries are the first. Because relations load on access, a line in a template like `order.restaurant.name` can run a query, and a serializer that walks relations can run hundreds. Some ORMs offer a strict mode that raises an error on lazy loading, which turns a silent performance bug into a loud one in development.

Bulk work is the second. To mark 100,000 old notifications as read, an ORM-shaped loop loads 100,000 objects, hydrates each one, dirty-checks each one and sends 100,000 `UPDATE` statements. One `UPDATE notifications SET read = true WHERE created_at < $1` does the same in a single statement, in a fraction of the time, though Part VII explains why even that should be batched on a big table.

@fig be_db_orm_traps | Hidden queries, bulk loops, lazy loads after the session closes, and SQL nobody read.

Session lifetime is the third. Objects belong to the session that loaded them. If code loads an order, closes the session, and later touches `order.items`, the ORM cannot run the lazy query and raises an error, such as SQLAlchemy's `DetachedInstanceError` or Hibernate's `LazyInitializationException`. The tempting workaround, keeping the session open for the whole request including rendering, the "open session in view" pattern, makes the error go away by allowing queries from the view layer, which brings back hidden N+1.

The fourth is generated SQL that nobody reads. An innocent-looking filter can produce a query that cannot use any index or that joins tables the developer did not expect. Wren's rule is that every query on a hot path gets read in its SQL form and run through `EXPLAIN ANALYZE` before it ships.

None of this argues against ORMs. It argues for knowing which rung of the ladder from Part II each piece of work needs.

:::story Picture this
A personal assistant who fetches whatever you mention. Say "the report" and they walk to the archive. Say "and its appendix" and they walk again. They never complain and never batch, and at the end of the day they have walked twenty kilometres. Telling them in the morning "bring me these twenty files and their appendices" saves every trip.
:::

:::note Counting queries in tests
A test that asserts "GET /users/42/orders runs at most 3 queries" costs a few lines and catches every N+1 regression on that endpoint. Django's `assertNumQueries` and similar helpers in other frameworks count statements during a block. The number should not grow with the size of the list.
:::

:::warn Watch out
Eager loading everything by default is not a fix. Joining every relation on every query loads data the page never shows and multiplies rows. Choose the loading strategy per query, where you know what the caller will touch.
:::

:::interview Interview lens
**"What is the N+1 problem and how do you fix it?"** Loading a list with one query and then running one more query per row to fetch a relation, usually because the ORM loads relations lazily. Twenty orders cost 21 round trips instead of 2. Fix it by loading the relation for all rows at once, either with a join or, usually better for collections, with a second query using `WHERE id IN (...)`. Detect it by logging query counts per request, asserting query counts in tests and watching call counts in `pg_stat_statements`.
:::

:::key In one breath
An ORM hydrates rows into objects, keeps one object per row in an identity map, and tracks changes with snapshots so that at flush time it writes only changed columns, which means SQL runs at moments the code does not spell out. Lazy relations cause N+1, one list query plus one per row, which for Wren is 16.8 ms against 1.6 ms, and select-in loading usually fixes it best. ORMs turn dangerous with hidden queries in templates, bulk work done object by object, lazy loads after the session closes and generated SQL nobody reads.
:::

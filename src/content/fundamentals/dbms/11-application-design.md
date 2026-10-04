@part XI | Application design and PostgreSQL | A database choice is useful only when it supports the application's operations and failure rules. A schema or pool that works on one process can fail when the application grows. We will compare data models, build the booking tables, and connect PostgreSQL tuples, plans and connection budgets to earlier mechanisms. | where:11

## 53. SQL, NoSQL and access patterns

Heron needs to prevent duplicate seat claims, join bookings to shows and report revenue by customer. A key-value lookup alone does not express all those operations. Another service may read one complete profile by id and rarely join it to anything else. Their database choices should follow those differences.

A **relational database** organizes named relations with declared constraints and relational queries. **NoSQL** is a broad grouping of database families rather than one storage or consistency protocol. Document, key-value, wide-column and graph systems have different query and update units. Both relational and non-relational databases can enforce schemas, maintain indexes and offer transactions under their own scope and guarantees.

| Family | Natural access unit | Main design question |
|---|---|---|
| Relational | Rows joined by keys | Which constraints and queries must remain local? |
| Document | One aggregate document | Which fields change or load together? |
| Key-value | Value under a known key | Which lookups require another maintained index? |
| Wide-column | Partition and ordered range | Can the key distribute load while serving range access? |
| Graph | Vertices and relationships | Which traversals dominate and how are paths stored? |
| Time-series | Time-bounded observations | How do retention and aggregation handle ingestion? |

@fig dbms_access_models | Database families compared by access path. Orange marks Heron's relational booking requirements; no family label alone determines durability or consistency.

Heron's core data has $100+8+800+160=1068$ rows before new work. The tiny fixture's revenue is $120+120+80=320$ currency units. A relational query can join the booking owner and aggregate that exact result without duplicating customer attributes into every booking. A denormalized read model could precompute it, but then updates need a propagation and reconciliation contract.

The costs include write fan-out for maintained read views, query flexibility, transaction boundaries, migration and operations. A document holding all seats for a show makes aggregate retrieval direct but can concentrate contention and grow beyond a useful update unit. Splitting each seat makes writes independent while requiring a query path for the show's inventory. Model those operations before choosing a product.

The interview answer should compare joins, constraints, indexes, consistency and scaling strategy. "SQL is structured and NoSQL is unstructured" misses the mechanism. A declared schema can exist in either family, while a flexible value format does not remove the need to validate the business meaning of a reservation.

:::story Picture this
A workshop stores tools in drawers, complete repair kits in cases and parts in bins labelled by size. Each arrangement serves a different retrieval task. Putting everything in cases makes taking a whole kit easy but replacing one shared tool awkward. The storage arrangement should follow what people fetch and change together.
:::

## 54. Booking schema, idempotency and outbox

Ada and Bo both try to reserve physical seat A7 for the same show. A seat id alone is not enough to decide uniqueness because that physical seat can be sold for another performance. The inventory identity must include the show.

The application schema separates users, events, venues, seats, shows, bookings, booking items and payment attempts. An event describes the production; a show is a dated performance at a venue. A physical seat belongs to a venue, and a show-seat record describes that seat's inventory state for one show. A booking belongs to a user and its items refer to claimed inventory records.

@fig dbms_booking_design | Physical seats become inventory only in a show context. Orange marks the show-seat identity that concurrency control must protect.

Primary keys provide identity, foreign keys preserve references, and uniqueness enforces the appropriate business boundary. A unique `(show_id, seat_id)` inventory key prevents duplicate inventory rows; it does not alone prevent two bookings referencing the same row. The reservation transaction must atomically change availability or enforce a separate unique active claim. A booking-items table needs the matching constraint and cancellation policy if it owns that claim.

Use an application submit key under a database uniqueness rule so a lost response can return the existing booking. Validate that the repeated key names the same payload. The seat claim, booking and outbox event share a local transaction; a relay publishes only committed intent. Payment remains a separate operation when its provider does not share the database transaction.

The running fixture has 160 bookings. Adding one booking header makes 161, and the core-table subtotal becomes $1068+1=1069$ when inventory is updated in place. Read this as a subtotal for the four front-matter tables, not a total for the expanded schema. Booking items, payment attempts and outbox rows require their own accounting and are intentionally outside that original fixture.

:::warn Watch out
Do not hold a database row lock while waiting for a human or a remote payment provider. Commit a bounded reservation state, release the transaction and reconcile the later outcome. Expiration and confirmation must compete under one atomic state transition so a late payment cannot reclaim a seat already sold again.
:::

## 55. PostgreSQL tuples, MVCC and VACUUM

Ada updates the seat while a report still reads an earlier snapshot. The report must be able to see its permitted history without reading an uncommitted replacement. PostgreSQL's tuple lifecycle connects the MVCC idea from Part VIII to actual maintenance work.

A PostgreSQL tuple is a stored row version. Its metadata includes transaction information conventionally discussed through `xmin` and `xmax`. These fields participate in visibility and locking rules; a naive numeric comparison with the current transaction id is not the full algorithm. Snapshots, transaction status and special states matter. An update can create another version, while old versions remain until no permitted reader can require them.

@fig dbms_pg_versions | Readers select a version allowed by their snapshot. Orange marks obsolete versions eligible for reclamation once no reader needs them; a current update does not instantly erase history.

### Dead tuples and autovacuum

A **dead tuple** is an obsolete version no longer needed by valid snapshots. VACUUM reclaims reusable space and performs related maintenance, while **autovacuum** schedules that work automatically. A long-running snapshot can delay reclamation even when an update committed long ago. Repeated updates then accumulate versions and index cleanup work.

The toy index example uses versions 7 and 8 to illustrate an application-visible version increment, $7+1=8$. Those identifiers are not PostgreSQL transaction ids and must not be used to predict `xmin` or `xmax`. Similarly, the 4,096-byte pages and 124-byte records from the front matter are a teaching layout, not PostgreSQL's physical tuple calculation.

PostgreSQL 18's [vacuuming reference](https://www.postgresql.org/docs/18/routine-vacuuming.html) explains reusable space and transaction-age maintenance. The engine also maintains visibility information used by index-only access. A covering index does not automatically avoid every heap visibility check under every maintenance state.

### Processes, WAL and checkpoints

At a high level, client sessions use server processes while shared state and background work manage buffers, WAL and maintenance. WAL preserves recovery ordering and checkpoints bound restart work; neither replaces tuple visibility. A commit can be durable while changed data pages remain dirty in shared buffers. These are the same distinctions established in Part IX, now connected to a concrete engine.

The operational mistake is blaming every growing table on insufficient disk. Inspect old snapshots, dead-version generation and maintenance progress before changing storage. Correct visibility needs retained versions, but forgetting the reclamation side lets correctness machinery become an avoidable resource problem.

:::note Application versions and tuple transaction metadata
The chapter's seat version 7 becoming 8 is a business concurrency token. PostgreSQL tuple transaction metadata belongs to the engine's visibility and locking protocol. They solve related observation problems at different layers and are not interchangeable counters.
:::

## 56. EXPLAIN ANALYZE, indexes and connection budgets

Heron's query planner expects 16 rows but the query actually visits 80 matching rows. A plan that looked cheap under the estimate can perform much more work. Understanding the mismatch is more useful than adding an index to every column.

`EXPLAIN` presents the planned operations and estimates. `EXPLAIN ANALYZE` executes the statement and adds observed execution information, so a write statement can have real effects. In our fixed fixture, estimated selectivity is 2 percent of 800, giving $800\times0.02=16$. Actual matches are 80, or $80/800=0.1$. The count error is $80/16=5$ times. Read that ratio as actual rows divided by estimated rows for the same operator input.

@fig dbms_pg_plan | Illustrative planner estimate of 16 versus 80 actual rows. Orange marks the fivefold count error; it is not a measured PostgreSQL benchmark.

Check predicates, data skew, maintained statistics and column dependence. An index can help selective access, but a large fraction of a table may be cheaper to scan. A composite index must match leading-key and ordering needs, and every maintained index adds update work. PostgreSQL 18's [EXPLAIN guide](https://www.postgresql.org/docs/18/using-explain.html) defines its output and the execution boundary.

### Connection limits and pools

Eight application instances each plan a 20-connection pool, demanding $8\times20=160$ possible database sessions. The illustrative server limit is 80, with 16 reserved for operational work. Application allowance is $80-16=64$, so eight pools of eight fit exactly, $8\times8=64$.

@fig dbms_pool_budget | Illustrative application pools must share a global limit. Orange marks eight pools of eight fitting the 64-session application allowance rather than eight independent twenty-session promises.

A **connection pool** reuses sessions and bounds concurrency; it cannot add database service capacity. Waiting for a pooled connection needs a deadline and a bounded queue. More sessions can increase contention rather than shorten requests. Settings such as `max_connections`, memory budgets and vacuum controls must be interpreted across the whole deployment, including background work and concurrent operators. Do not invent a universal setting value from this toy fixture.

:::interview Interview lens
**"What do you inspect when a PostgreSQL query becomes slow?"** I compare the plan's estimated and actual work, then examine predicate selectivity, indexes, statistics and waits. I distinguish execution time from time waiting for a pooled connection or lock. I also remember that EXPLAIN ANALYZE executes the statement, so its use on writes needs a deliberate transaction boundary.
:::

:::key In one breath
Database families should be compared through access paths, constraints and transaction scope. The booking schema makes show-seat identity and atomic state transitions explicit, with idempotency and outbox at the local commit. PostgreSQL MVCC retains tuple versions until maintenance can reclaim them. Plan evidence and globally bounded pools connect query theory to actual resource decisions.
:::

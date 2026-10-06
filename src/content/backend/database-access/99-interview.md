@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Connections and pools

**Q1. What does a database driver do?**

It turns library calls into the database's wire protocol and sends them over a socket, then turns the replies back into rows. For PostgreSQL that means messages such as Parse, Bind, Execute and Sync. It also handles TLS, authentication and type conversion.

**Q2. Why is opening a PostgreSQL connection expensive?**

It costs a TCP handshake, a TLS handshake, an authentication exchange and a process fork on the server, which then loads catalog data. That is several milliseconds, often more than the query. Each connection also holds server memory for its whole life.

**Q3. Why not just raise max_connections to 5,000?**

Every connection is a process competing for a fixed number of cores. Past a few times the core count, context switching, memory use and lock contention reduce throughput. More connections add queueing inside the database, not capacity.

**Q4. What is a connection pool and which settings matter?**

A set of open connections a process lends to requests and takes back. Maximum size, minimum idle, the wait timeout for borrowing, idle timeout and max lifetime. Leak detection helps find code that never returns connections.

**Q5. How do you size a pool?**

Use Little's law, connections in use equal arrival rate times hold time, add burst headroom, and keep the fleet total near what the database can run in parallel, roughly cores × 2 plus disks. Then load-test and watch pool wait time and database CPU.

**Q6. What causes pool exhaustion?**

Connections held longer than expected. Slow queries, lock waits, leaked connections and transactions that include network calls are the usual causes. Traffic spikes are a less common cause than people think.

**Q7. Why should a request fail after a short pool wait instead of waiting indefinitely?**

Waiting ties up a worker thread or event loop slot, so requests that need no database also stall. A short wait with a 503 and Retry-After keeps the rest of the service alive and makes the problem visible.

**Q8. Why do pools retire connections after a max lifetime?**

So that failovers, DNS changes, load balancer moves and credential rotations take effect, and slow server-side memory growth is reset. Without it, a pool can keep talking to an old host for days.

### Queries from code

**Q9. Which timeouts would you configure?**

A request deadline, a short pool wait, a server-side statement_timeout per role, lock_timeout, idle_in_transaction_session_timeout and a client socket timeout. Inner limits must be shorter than outer ones. Long jobs get their own role and pool.

**Q10. What does idle_in_transaction_session_timeout protect against?**

Sessions that begin a transaction, take locks and then sit idle, usually while the application calls something slow or waits on a user. It ends the session so the locks are released. When it fires it points to a bug.

**Q11. How do parameterized queries prevent SQL injection?**

The SQL text and the values travel separately, so the database parses the statement before seeing any value and a value can only ever be data. Identifiers such as column names cannot be parameters and need an allowlist.

**Q12. What is a prepared statement and what is a generic plan?**

A statement parsed and planned once per connection and executed many times with new values. After five executions PostgreSQL may use a generic plan that ignores the specific values, which is usually faster and occasionally worse for skewed data.

**Q13. Raw SQL, query builder or ORM?**

Raw SQL for full control and hot paths, query builders for safely composing dynamic queries, ORMs for routine entity work with relationships. Most teams combine an ORM with raw SQL and keep the generated SQL visible in logs.

### Inside an ORM

**Q14. What is hydration and why can it be slow?**

Building objects from rows, converting types and registering each object with the session. It is cheap for tens of rows and expensive for hundreds of thousands. Reports should select plain values instead of entities.

**Q15. What is the identity map?**

A per-session map from primary key to object, so loading the same row twice returns the same object and skips the second query. It keeps changes consistent within the session.

**Q16. How does an ORM know what to update?**

It keeps a snapshot of each loaded object and compares at flush time, dirty checking, then writes only changed columns. The flush happens at commit, before some queries and when code calls it.

**Q17. Explain N+1 with numbers.**

A list query plus one query per row for a relation. Twenty orders with lazy restaurants cost 21 round trips, 16.8 ms at 0.8 ms each, against 2 round trips and 1.6 ms with batch loading. Across regions the gap becomes seconds.

**Q18. Joined eager loading or select-in loading?**

Joins give one round trip but repeat parent columns and multiply rows when several collections are joined. Select-in loads the relation in a second query with WHERE id IN (...) and avoids duplication. Select-in is usually better for collections, joins for single many-to-one relations.

**Q19. How do you detect N+1 in a codebase?**

Log query counts per request in development, assert query counts in tests for key endpoints, enable strict modes that forbid lazy loading, and look for very high call counts on simple lookups in pg_stat_statements.

**Q20. When is an ORM the wrong tool?**

Bulk updates, reports over many rows, complex queries that need specific PostgreSQL features, and hot paths where every round trip counts. Use set-based SQL there.

### Transactions in code

**Q21. Where should transactions begin and end in a layered service?**

Around one use case in the service layer, with all repositories sharing the connection through a unit of work. Controllers and repositories should not decide transaction boundaries.

**Q22. Why keep network calls out of transactions?**

Every millisecond inside a transaction holds locks and a connection. A slow external call stalls other writers and drains the pool, and a commit failing after the external call succeeded leaves the two systems disagreeing.

**Q23. Describe PostgreSQL's isolation levels.**

Read committed, the default, gives each statement a fresh snapshot. Repeatable read gives the whole transaction one snapshot and fails on conflicting updates. Serializable uses SSI to guarantee a serial-equivalent result, aborting with 40001 when needed. Read uncommitted behaves as read committed.

**Q24. What is write skew?**

Two transactions read overlapping data, each checks a rule that holds, and each updates different rows, so together they break the rule. Two couriers both ending shifts and leaving none is the example. Serializable or a lock on a shared row prevents it.

**Q25. How do you handle 40001 and 40P01?**

Retry the whole transaction from BEGIN, re-reading data, with a capped number of attempts and jittered exponential backoff. Keep side effects outside so retries are safe. Other errors should not be retried.

**Q26. How do you prevent deadlocks?**

Lock rows in a consistent order, keep transactions short, and lock fewer rows. PostgreSQL detects cycles after deadlock_timeout, 1 s by default, and aborts one victim, which the application retries.

### Concurrency control

**Q27. What is a lost update?**

Two read-modify-write cycles interleave, both read the same value and the later write overwrites the earlier one. Two orders both reading stock 5 and writing 4 lose one decrement.

**Q28. When would you use SELECT FOR UPDATE?**

For short, server-side critical sections where conflicts are common, such as decrementing stock with logic that cannot be one statement. The lock lasts until commit, so the transaction must be short and lock order consistent.

**Q29. What are NOWAIT and SKIP LOCKED for?**

NOWAIT fails immediately when a row is locked, useful for interactive actions. SKIP LOCKED skips locked rows, which lets several queue workers claim different jobs without waiting on each other.

**Q30. How does optimistic locking work?**

Each row has a version. Updates include WHERE version = the version read and increment it. Zero rows updated means someone changed it, so the caller reloads and retries or returns 409 or 412.

**Q31. Optimistic or pessimistic?**

Optimistic when conflicts are rare and the work spans requests or users, since it holds no lock. Pessimistic for hot rows and short server-side sections, since retries grow as 1 ÷ (1 − p) with conflict probability p.

**Q32. Why prefer atomic statements and constraints?**

They make the database check and change data in one step under its own locks, so no interleaving can break them. A unique index cannot be raced, while an application-level "check then insert" can.

### Schema migrations

**Q33. How do migration tools work?**

Versioned scripts applied in order, with a table recording which ran. The same files run in every environment. Applied files are never edited, and new changes get new files.

**Q34. Why can adding a column take a site down?**

Most ALTER TABLE forms need an ACCESS EXCLUSIVE lock. If a long query holds a conflicting lock, the ALTER waits, and every later query on the table queues behind the ALTER. Pools fill in a fraction of a second. lock_timeout bounds the damage.

**Q35. How does CREATE INDEX CONCURRENTLY differ from CREATE INDEX?**

The plain form blocks writes for the whole build. The concurrent form registers the index, waits for older transactions, scans twice and validates, letting writes continue. It is slower, cannot run in a transaction block, and leaves an invalid index if it fails.

**Q36. Which changes are safe on a large PostgreSQL table?**

Adding a nullable column or one with a non-volatile default, concurrent index builds, and constraints added NOT VALID then validated. Type changes, volatile defaults and renames of columns in use need expand and contract.

**Q37. Where should migrations run in a deploy?**

Once per deploy, as a pipeline step before rollout, under an advisory lock so only one runner applies them. Not from every instance at start-up.

### Zero-downtime migrations

**Q38. Explain expand and contract.**

Change the schema in steps compatible with both old and new code. Add the new shape, write both, backfill, switch reads, stop writing the old shape, then remove it. Each step can be rolled back.

**Q39. How do you backfill millions of rows safely?**

In small batches by primary key range, each its own short transaction, idempotent by skipping rows already done, resumable from a recorded position, and throttled on replication lag and database load.

**Q40. How do you verify data before a cutover?**

Shadow reads that compare old and new sources and log differences, plus a batch comparison job. Switch reads behind a feature flag in stages, and drop the old data only after a quiet period.

### Scaling access

**Q41. What do read replicas give you and what do they cost?**

Read capacity and a failover target. They do not scale writes, they lag behind the primary, and long queries on them can conflict with WAL replay.

**Q42. How do you provide read-your-writes with replicas?**

Route a user to the primary for a few seconds after a write, or record the commit LSN and read from a replica only once it has replayed past it, or always read a user's own data from the primary.

**Q43. What does PgBouncer's transaction mode change?**

Clients hold a server connection only for one transaction, so many clients share few connections. Session state such as SET outside a transaction, LISTEN, session advisory locks and temporary tables no longer works reliably.

**Q44. Why can autoscaling break the database?**

Each new instance brings its own pool, so connections grow with instance count and can exceed max_connections. Budget connections for the maximum instance count or put a pooler in front.

### End to end

**Q45. Walk through an order write in the data layer.**

Borrow a connection, BEGIN, load items in one query, decrement stock atomically, insert order, items and outbox rows, COMMIT, return the connection. Payment and publishing stay outside the transaction, and a unique idempotency key blocks duplicates.

**Q46. The database slows from 4 ms to 2 s per query. What happens?**

Connections are held thousands of times longer, the pool needs 200 per instance and has 10, requests wait and fail, and client retries add load. Statement timeouts, fast-failing waits and backoff break the chain. The fix is the slow query.

**Q47. What should the application do during a primary failover?**

Evict dead connections quickly, reconnect to the promoted primary through DNS or a proxy with short TTLs respected, retry idempotent requests, and rely on idempotency keys for writes whose commit status is unknown.

### Primary sources

[PostgreSQL documentation, Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html). Lock modes and the conflict table.

[PostgreSQL documentation, Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html). Read committed, repeatable read and serializable.

[PostgreSQL wiki, Number Of Database Connections](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections). The cores × 2 rule.

[Little, A Proof for the Queuing Formula L = λW, 1961](https://doi.org/10.1287/opre.9.3.383). The law behind pool sizing.

[Fowler, Patterns of Enterprise Application Architecture, 2002](https://martinfowler.com/eaaCatalog/). Unit of work, identity map and data mapper.

[Sato, Parallel Change, 2014](https://martinfowler.com/bliki/ParallelChange.html). Expand and contract.

[PgBouncer documentation](https://www.pgbouncer.org/features.html). Pooling modes and their limits.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Pools, queries and ORMs

**E1** ● An instance receives 600 requests per second with an 85% cache hit ratio. Each miss runs 3 queries of 5 ms on one connection. How many connections are busy on average?

**E2** ● The same queries slow to 500 ms each. How many connections does the instance now need?

**E3** ● What starting pool total does the cores × 2 + spindles rule give for a 16-core database on SSDs?

**E4** ● A page lists 50 orders and lazily loads each order's restaurant and items. How many queries run, and how long do they take at 0.8 ms each? How many with select-in loading for both relations?

**E5** ● Repeat E4 with the database in another region at 60 ms per round trip.

**E6** ● 300 cache misses per second each open a new connection costing 5 ms. How much setup time is spent per second, and how many processes does the server fork per second?

**E7** ● Prove that a pool of size N whose connections are each held for W seconds can complete at most N ÷ W requests per second, and compute it for 10 connections at 8 ms and at 4 s.

**E8** ● Eight instances keep 50 client connections each to PgBouncer. Together they run 1,200 transactions per second averaging 6 ms. How many server connections are busy on average?

### Transactions and locking

**E9** ● Retries wait between half and all of 10, 20 and 40 ms. What are the shortest and longest total waits for three retries?

**E10** ● Five requests per second need the same restaurant row lock. What is the lock's utilization if each holds it 812 ms, and if each holds it 12 ms? What happens in the first case?

**E11** ● With optimistic locking, how many attempts per successful update are expected at conflict probabilities of 10%, 30% and 60%?

**E12** ●● Two devices add a 10 rupee tip to order 123, whose tip is 20, at the same moment using read-modify-write. Trace the outcome and give a one-statement fix.

**E13** ●● Transaction A locks orders 123 then 124. Transaction B locks 124 then 123. Trace the deadlock, say what PostgreSQL does and after how long, and fix the code.

**E14** ●● Trace the courier write skew under repeatable read and show how `SELECT ... FOR UPDATE` on the zone row prevents it.

**E15** ●● Explain, with an example, why retrying only the failed statement after a 40001 is wrong.

**E16** ●● Four job workers use `SELECT ... LIMIT 1 FOR UPDATE` without SKIP LOCKED. What happens, and what changes with SKIP LOCKED?

**E17** ●● Choose a loading strategy for an order detail page with one restaurant, a list of 50 orders with restaurant names, and a list of 20 orders each with 5 items and 3 payments. Justify each.

**E18** ●● With a 300 ms gateway, 280 ms handler, 50 ms pool wait and 200 ms statement_timeout, a query would take 400 ms. Trace what happens and what the client receives.

### Migrations and scaling

**E19** ● A table receives 500 queries per second and the fleet's pools hold 60 connections. An ALTER waits 45 s behind a long query. How quickly do the pools fill, and how many queries queue or fail?

**E20** ● A plain CREATE INDEX takes 90 s on a table receiving 120 writes per second. How many writes are blocked?

**E21** ● Backfill 12,000,000 rows in batches of 2,000, each taking 80 ms with a 20 ms pause. How many batches and how long?

**E22** ● 12 instances use pools of 15 against max_connections 200 with 3 reserved. Does it fit? What about 30 instances? What pool size fits a 120-connection budget at 30 instances?

**E23** ●● Classify for PostgreSQL 14 as safe, careful or rewrite-or-break: add `rating int`; add `status text NOT NULL DEFAULT 'new'`; change `total` from int to bigint; add a foreign key from order_items to orders; add `created_at timestamptz DEFAULT now()`; rename `note`.

**E24** ●● A replica lags 6 s and Wren uses a 5 s sticky primary window. User 42 writes at t = 0 and reads at t = 3 s and t = 7 s. Which reads are fresh? What if lag is 9 s?

**E25** ●● A service runs `SET statement_timeout = '200ms'` once per connection at start-up through PgBouncer in transaction mode. What goes wrong and how do you fix it?

### Code and design

**E26** ●●● Write pseudocode for a function that runs a unit of work under serializable isolation with correct retries.

**E27** ●●● Plan a zero-downtime change of `orders.total` from integer to bigint on a 5,000,000-row table.

**E28** ●●● Design a job queue in PostgreSQL that survives crashed workers, using SKIP LOCKED and leases.

**E29** ●●● Design Wren's connection budget for max_connections 100, an API that autoscales to 20 instances, 4 workers, migrations, admin and monitoring.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** Misses are 600 × 0.15 = 90 per second. Each holds a connection for 3 × 5 ms = 15 ms. By Little's law, 90 × 0.015 = 1.35 connections are busy on average.

**E2.** Hold time becomes 3 × 0.5 = 1.5 s, so 90 × 1.5 = 135 connections are needed. A pool of 10 exhausts at once.

**E3.** 16 × 2 + 1 = 33 active connections, as a starting point for load testing.

**E4.** Lazy loading runs 1 + 50 + 50 = 101 queries, 101 × 0.8 = 80.8 ms. Select-in runs 3 queries, orders, restaurants and items, 3 × 0.8 = 2.4 ms.

**E5.** 101 × 60 = 6,060 ms, about 6 s, against 3 × 60 = 180 ms. Network latency multiplies the cost of every extra round trip.

**E6.** 300 × 5 ms = 1.5 s of setup work every second, more than one full core's worth, and 300 forks per second on the database server.

**E7.** At saturation all N connections are busy, so L = N. Little's law gives λ = L ÷ W = N ÷ W, and no higher rate is sustainable because L cannot exceed N. For N = 10, W = 0.008 s gives 1,250 per second, and W = 4 s gives 2.5 per second.

**E8.** 1,200 × 0.006 = 7.2 server connections busy on average, so a PgBouncer pool of about 20 leaves room for bursts while 400 clients stay connected.

**E9.** The shortest is 5 + 10 + 20 = 35 ms and the longest 10 + 20 + 40 = 70 ms, plus the time of the attempts themselves.

**E10.** Utilization is 5 × 0.812 = 4.06, above 1, so the queue for the lock grows without bound and requests time out. At 12 ms it is 5 × 0.012 = 0.06, so waits are rare and short.

**E11.** 1 ÷ 0.9 ≈ 1.11, 1 ÷ 0.7 ≈ 1.43 and 1 ÷ 0.4 = 2.5 attempts per success.

**E12.** Both devices read tip 20, both compute 30, and both write 30. The final tip is 30 instead of 40. The fix is `UPDATE orders SET tip = tip + 10 WHERE id = 123`, which reads and writes the row under its lock in one statement, so the second update sees 30 and writes 40. If the client means "set to 30", use a version check instead, so the second request learns the tip changed.

**E13.** A holds 123 and waits for 124. B holds 124 and waits for 123. Neither can proceed. After deadlock_timeout, 1 s by default, PostgreSQL detects the cycle, aborts one transaction with 40P01 and the other continues. Fix it by sorting ids and locking in ascending order, so both lock 123 first and one simply waits.

**E14.** Under repeatable read, T1 and T2 each count 2 couriers on shift in their snapshots, each updates its own row, and the rows do not overlap, so both commit and 0 remain. Under read committed with `SELECT * FROM zones WHERE id = 7 FOR UPDATE` at the start of each transaction, T2 waits for T1's commit, and its next statement takes a fresh snapshot, counts 1 on shift and refuses. Under repeatable read the lock alone is not enough, because T2's snapshot was taken before T1 committed. There, use serializable, or have each transaction also update the zone row so the second fails with 40001 and its retry counts 1.

**E15.** A transaction reads balance 100, then fails on its second statement, which deducts 30 based on that read. Meanwhile another transaction committed a deduction of 80. Rerunning only the deduction would subtract 30 from a balance it believes is 100, but it is now 20. Rerunning from BEGIN rereads 20 and refuses. The failed statement depended on reads that are no longer valid.

**E16.** All four workers select the same first ready job. One locks it and the other three wait on that row. When the first commits, the others re-check the row, which is no longer ready, and return nothing or the next row after waiting, so workers mostly queue behind each other and throughput approaches one worker. With SKIP LOCKED each worker skips locked rows and takes the next free one, so all four work in parallel.

**E17.** The detail page touches one restaurant, so a join or a lazy load costs one extra query at most. The 50-order list should use select-in loading, two queries with no duplication, or a join since restaurant is many-to-one and duplication is small. The 20 orders with items and payments should use select-in for each collection, three or four queries, because joining two collections would give 20 × 5 × 3 = 300 rows.

**E18.** The statement_timeout fires at 200 ms after the query starts. PostgreSQL cancels it with 57014 and aborts the transaction. If the pool wait took up to 50 ms, the failure surfaces about 250 ms into the request, inside the 280 ms handler limit. The handler rolls back, returns the connection, and the error handler maps the timeout to 503 or 504 with a retryable flag. The client gets a structured error before the gateway's 300 ms deadline.

**E19.** The pools fill in 60 ÷ 500 = 0.12 s. Over 45 s, 45 × 500 = 22,500 queries queue or fail. A 2 s lock_timeout would bound the stall to 2 s per attempt.

**E20.** 90 × 120 = 10,800 writes are blocked during the build, which is why the build should be concurrent.

**E21.** 12,000,000 ÷ 2,000 = 6,000 batches, each taking 80 + 20 = 100 ms, so 6,000 × 0.1 = 600 s, which is 10 minutes.

**E22.** 12 × 15 = 180, within 200 − 3 = 197. At 30 instances, 30 × 15 = 450, far over. A budget of 120 at 30 instances allows 120 ÷ 30 = 4 connections per instance, or a pooler in front.

**E23.** Adding nullable `rating int` is safe. Adding `status text NOT NULL DEFAULT 'new'` is safe on PostgreSQL 11 and later, since the constant default is stored in the catalog and existing rows satisfy NOT NULL through it. Changing int to bigint rewrites the table, so it is rewrite-or-break and needs expand and contract. Adding a foreign key is careful, done with NOT VALID then VALIDATE CONSTRAINT. Adding `created_at` with `DEFAULT now()` is safe, because now() is stable rather than volatile and is evaluated once. Renaming `note` breaks running code, so it needs expand and contract.

**E24.** At t = 3 s the sticky window routes the read to the primary, which is fresh. At t = 7 s the window has ended, so the read goes to the replica, which applied the write at t = 6 s, so it is fresh too. With 9 s of lag, the replica applies the write at t = 9 s, so the read at t = 7 s is stale. The sticky window only works while lag stays below it, which is why Wren alerts on lag above 5 s, or uses LSN tracking.

**E25.** In transaction mode each transaction may run on a different server connection. The SET applies only to the server connection where it ran, which then serves other clients, and this client's later transactions may land on connections without it. Some clients get the timeout and others do not. Fix it by setting the timeout on the database role with `ALTER ROLE wren_api SET statement_timeout = '200ms'`, or with `SET LOCAL` inside each transaction.

**E26.** One approach:

```text
function run_serializable(work, max_attempts = 3):
  for attempt in 1..max_attempts:
    conn = pool.borrow(timeout = 50 ms)
    try:
      conn.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")
      result = work(conn)
      conn.execute("COMMIT")
      return result
    except DbError as e:
      conn.execute("ROLLBACK")
      if e.sqlstate not in ("40001", "40P01") or attempt == max_attempts:
        raise
      base = 10 ms * 2 ** (attempt - 1)
      sleep(random_between(base / 2, base))
    finally:
      pool.give_back(conn)
```

The whole `work` reruns, rereading everything. It must not perform external side effects, or must record them in an outbox row inside the transaction. Only serialization and deadlock errors are retried.

**E27.** Add `total_big bigint` as a nullable column. Deploy code that writes both `total` and `total_big` on every insert and update, or add a trigger that copies one to the other. Backfill in batches of 1,000 by id, `UPDATE orders SET total_big = total WHERE id BETWEEN ... AND total_big IS NULL`, throttled on replication lag, 5,000 batches. Verify with a query counting rows where they differ, and shadow-read for a day. Add `CHECK (total_big IS NOT NULL) NOT VALID`, validate it, then `SET NOT NULL`, which skips the scan. Deploy code that reads `total_big` behind a flag. Stop writing `total`. After a quiet week, drop `total` and rename `total_big` to `total` in one short migration with lock_timeout, timed with a deploy whose code uses the new name, or keep the new name. Each step can be rolled back up to the drop.

**E28.** A `jobs` table holds id, kind, payload, status (ready, running, done, failed), attempts, run_after and lease_until, with an index on (status, run_after). A worker claims a job in one short transaction, `UPDATE jobs SET status = 'running', lease_until = now() + interval '60 s', attempts = attempts + 1 WHERE id = (SELECT id FROM jobs WHERE status = 'ready' AND run_after <= now() ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`, and commits, so no lock is held while the job runs. On success it sets done. On failure it sets ready with run_after pushed back by exponential backoff, or failed after a maximum number of attempts. A sweeper resets running jobs whose lease_until has passed to ready, so a crashed worker's job is picked up again. Jobs must be idempotent because a job can run twice when a lease expires. Workers extend the lease for long jobs. Done rows are deleted or archived in batches.

**E29.** Of 100 connections, 3 are reserved for superusers, leaving 97. The API runs through PgBouncer in transaction mode with a server pool of 40, so 20 instances with up to 100 client connections each fit without changing the database. Four workers get 2 direct connections each, 8, because they need session features such as advisory locks. Migrations and admin get 5 on a separate role. Monitoring gets 3. The total is 40 + 8 + 5 + 3 = 56, leaving 41 for headroom, a failover reconnection surge and emergencies. Per-instance settings derive from the budget, and an alert fires when total connections pass 80.

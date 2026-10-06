@part V | Concurrency control | We stop two requests that edit the same row from destroying each other's work. The database will happily let both succeed unless the code asks for protection in the right way. We will cover the lost update, pessimistic locks with SELECT FOR UPDATE and SKIP LOCKED, optimistic locking with a version column, and atomic statements and constraints that need no lock at all. | where:5

## 15. The lost update

Restaurant 9 has five portions of biryani left, tracked in `menu_items.stock`. Two customers order at the same moment. Wren's first version of the code read the stock, checked it was above zero, and wrote back the stock minus one. Both requests read 5. Both decided there was enough. Both wrote 4. Two biryanis were sold and the stock dropped by one. The second write silently replaced the first, a lost update, and nothing in the logs looks wrong, because each transaction did exactly what it was told.

The pattern behind it is called **read-modify-write**. The code reads a value into the application, computes a new value, and writes it back, assuming nothing changed in between. Under PostgreSQL's default read committed level, that assumption is false. The two transactions do not see each other's uncommitted work, and when the second one's `UPDATE` runs, it waits for the first to commit and then overwrites the row with the value it computed from stale data.

@fig be_db_lost_update | Both read 5, both write 4. The counter should say 3.

The same bug appears wherever two writers touch one record. Two support agents edit the same order's delivery note and the slower one wins. A user taps "add tip" twice on two devices. Two background workers both mark a job as started. In each case the fix belongs to one of four families, and the rest of this part covers them in turn.

The first family uses **pessimistic locking**. Lock the row when you read it so nobody else can change it until you finish. The second, **optimistic locking**, lets everyone read freely and checks at write time whether the row changed. The third is the atomic statement, where you never read the value into the application at all and let one SQL statement compute and write it. The fourth is the constraint, a rule inside the database that refuses any write breaking an invariant, however the race happened.

Repeatable read, from Part IV, also catches this case, since the second transaction fails with 40001 instead of overwriting. That works, but it means every such transaction needs a retry loop, and it does not protect code that someone later moves to a read committed path. Wren prefers making the protection explicit in the statement itself.

## 16. Pessimistic locking with SELECT FOR UPDATE

`SELECT ... FOR UPDATE` reads rows and takes a **row lock** on them, held until the transaction ends. Any other transaction that tries to update, delete or lock those rows waits. Wren's order flow runs `SELECT stock FROM menu_items WHERE id = 17 FOR UPDATE`, checks the value, updates it and commits. The second customer's transaction blocks at its own `SELECT ... FOR UPDATE` until the first commits, then reads 4, not 5, and writes 3. Plain readers without `FOR UPDATE` are not blocked, because PostgreSQL's multiversion design lets them read the last committed version.

@fig be_db_for_update | The first buyer holds the padlock. The second waits, then sees the true stock.

Two variants change what happens when the row is already locked. **NOWAIT** fails immediately with an error instead of waiting, useful for an interactive action where "someone else is editing this, try again" beats a frozen screen. **SKIP LOCKED**, added in PostgreSQL 9.5 in 2016, silently skips rows that are locked and returns the next ones. It is made for job queues.

Wren keeps a table of background jobs, sending receipts and notifying kitchens. Four workers poll it. Each runs `SELECT * FROM jobs WHERE status = 'ready' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`, processes the job, marks it done and commits. Worker 1 locks job 501, worker 2 skips 501 and locks 502, worker 3 takes 503, and worker 4 skips all three and takes 504. No two workers ever process the same job, and no worker waits for another.

@fig be_db_skip_locked | Each worker locks a different row. Locked rows are skipped, not waited on.

Pessimistic locks have costs. Locks are held for the length of the transaction, so a slow transaction stalls everyone who needs the same row, and the rules from Part IV about short transactions apply with double force. Locking several rows in different orders invites deadlocks. And a lock lives in the database session, so it cannot span an HTTP request, a user thinking for a minute, or two services. For those cases, optimistic locking fits better.

## 17. Optimistic locking with a version column

Optimistic locking assumes conflicts are rare and checks for them only at write time. Each row carries a `version` integer. A transaction reads the row, remembers its version, and writes with a condition, `UPDATE orders SET tip = 30, version = 8 WHERE id = 123 AND version = 7`. If nobody changed the row, the condition matches, one row is updated, and the version becomes 8. If someone else got there first, the version is already 8, the condition matches nothing, and the update reports 0 rows. The code then knows its data was stale.

@fig be_db_optimistic | T1's update matches version 7 and wins. T2's matches nothing and must reload.

What to do on 0 rows depends on who is asking. A background job reloads the row and retries its change. An API request from a human usually returns 409 Conflict, or 412 Precondition Failed when the client sent the version as an ETag in an `If-Match` header, as Unit I described. The client then shows "this order changed while you were editing" with the fresh data. ORMs support the pattern directly, through Hibernate's `@Version`, Rails' `lock_version` column and SQLAlchemy's `version_id_col`.

The big advantage is that no lock is held between read and write. The read can happen in one HTTP request and the write ten minutes later in another, with the version travelling through the client. That makes optimistic locking the natural choice for edit forms, mobile apps that sync, and anything that crosses a network boundary.

Its weakness is contention. Each conflict costs a wasted attempt. If the chance that a write conflicts is p, the expected number of attempts per success is 1 ÷ (1 − p). At p = 5% that is about 1.05 attempts, nearly free. At p = 50% it is 2, and on a single very hot row it can spiral. Pessimistic locking costs roughly the same whatever the contention, since writers queue rather than retry.

@fig be_db_opt_vs_pess | An illustrative cost model. Optimistic is cheaper until conflicts become common.

With a flat illustrative cost of 1.3 for locking, the curves cross near p = 23%. The real crossing depends on the workload, but the shape gives the rule. Use optimistic locking where conflicts are rare and work crosses requests, and pessimistic locking for short, hot, server-side critical sections.

## 18. Atomic statements and constraints

Often the best lock is none. The stock problem disappears if the application never reads the value at all.

```sql
UPDATE menu_items SET stock = stock - 1
WHERE id = 17 AND stock > 0
RETURNING stock;
```

The database reads, checks and writes the row in one statement while holding the row lock for microseconds. Two concurrent executions queue on the row, the second re-evaluates `stock > 0` against the new committed value, and the last portion can only be sold once. If the statement updates 0 rows, the item is sold out, and the service returns 409 `ITEM_SOLD_OUT`. This is an **atomic update**, and it is the first tool to reach for with counters, balances and quotas.

@fig be_db_atomic | Read, decide and write in code leaves gaps. One statement leaves none.

The second tool is a **constraint**, a rule the database enforces on every write. A `CHECK (stock >= 0)` constraint makes negative stock impossible, whatever bug or race tries it. A unique index on `idempotency_key` makes it impossible for two retries of the same request to create two orders. Code that checks first, `if not exists(key): insert(key)`, races, because both requests can pass the check before either inserts. The unique index cannot be raced, because PostgreSQL checks it while inserting, under its own locks. The second insert fails with SQLSTATE 23505, unique violation, and Wren catches that specific error and returns the stored response from the first request.

@fig be_db_constraint | Two inserts with the same key. The index lets one through and turns the other away.

PostgreSQL's `INSERT ... ON CONFLICT DO NOTHING` or `DO UPDATE` wraps this pattern into one statement, called an **upsert**, which avoids the error entirely when a duplicate is expected. Exclusion constraints go further, for example forbidding two bookings of one table whose time ranges overlap.

Constraints are the last line of defence and the cheapest. Wren puts invariants in the database whenever SQL can express them, and keeps application checks for friendly error messages, not for correctness.

:::story Picture this
Three ways to stop two people buying the last concert ticket. A clerk can hold the ticket in their hand while you decide, which is pessimistic. Everyone can browse freely, and the till checks the ticket is still there when you pay, which is optimistic. Or the machine itself dispenses tickets one at a time and shows "sold out" when empty, which is atomic. The seat numbers printed on each ticket, so that no seat is ever sold twice, are the constraint.
:::

:::note Advisory locks
PostgreSQL also offers **advisory locks**, locks on an arbitrary number that the database does not tie to any row, taken with `pg_advisory_lock(key)` or the transaction-scoped `pg_advisory_xact_lock(key)`. Wren's migration runner in Part VI uses one so only one migrator runs at a time. They are a cheap distributed lock when every participant already shares the database, and Unit IX compares them with Redis-based locks.
:::

:::warn Watch out
`SELECT ... FOR UPDATE` inside a transaction that then calls a slow external service holds the row lock for the whole call. Combine short transactions with locks, or use optimistic locking when the work cannot be made short.
:::

:::interview Interview lens
**"Two requests decrement the same stock counter. How do you prevent a lost update?"** The simplest fix is an atomic statement, `UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0`, checking the affected row count, backed by a `CHECK (stock >= 0)` constraint. If the logic must run in application code, lock the row with `SELECT ... FOR UPDATE` in a short transaction, or use a version column and conditional update for optimistic locking when conflicts are rare or the work spans requests. For queues, `FOR UPDATE SKIP LOCKED` lets workers claim different rows without blocking.
:::

:::key In one breath
Read-modify-write under read committed loses updates, as two orders both reading stock 5 and writing 4 show. Pessimistic locking with `SELECT ... FOR UPDATE` makes the second writer wait, NOWAIT fails instead and SKIP LOCKED lets queue workers claim different rows. Optimistic locking checks a version column in the `UPDATE` and suits rare conflicts and work that spans requests, costing 1 ÷ (1 − p) attempts. Better still are atomic statements such as `stock = stock - 1 WHERE stock > 0` and constraints like unique indexes, which no race can get past.
:::

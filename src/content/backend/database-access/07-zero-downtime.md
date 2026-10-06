@part VII | Zero-downtime migrations | We make the risky schema changes, renames, type changes and data moves, without a maintenance window. The method is always the same, adding the new shape beside the old one and moving across in small, reversible steps. We will cover expand and contract, batched backfills, and dual writes with a careful cutover. | where:7

## 23. Expand and contract

Wren's orders table has a column called `note`, which the kitchen reads. Product wants it renamed to `kitchen_note`, because a separate customer note is coming. `ALTER TABLE orders RENAME COLUMN note TO kitchen_note` takes a millisecond. It also breaks every running instance at once, because old code selects `note` and the column no longer exists. During a rolling deploy, some instances run old code and some new, so there is no single moment when renaming is safe.

The answer is **expand and contract**, also called parallel change, a pattern Danilo Sato described on Martin Fowler's site in 2014. The change is split into steps, and each step is compatible with the code running before it and the code running after it.

@fig be_db_expand_contract | Six steps. At every moment, the code that is running works with the schema that exists.

For the rename, there are six steps. First, expand the schema by adding `kitchen_note` as a nullable column, which old code ignores. Second, deploy code that writes to both columns on every insert and update but still reads `note`. Third, backfill, copying `note` into `kitchen_note` for every existing row, in batches as the next section describes. Fourth, deploy code that reads `kitchen_note`, while still writing both, so instances that have not yet updated keep working. Fifth, deploy code that stops writing `note`. Sixth, contract by dropping `note` once nothing references it.

Each step can be rolled back on its own. If step four reveals a bug, the previous version still reads `note`, which is still being written, so rolling back loses nothing. That is the point. A single big change has one moment of truth and no way back. A sequence of small changes has many safe stopping points.

@fig be_db_versions_overlap | During a rollout, two versions of the code share one schema. Both must be satisfied.

The cost is calendar time and discipline. A rename that looks like one line takes six steps, often spread over several days so that each can be observed in production. Teams track multi-step migrations in a ticket with a checklist, and some write the contract step as a dated reminder, because forgotten old columns pile up for years. The same shape handles changing a column type, splitting a table in two, moving data to another database and replacing an enum with a lookup table.

## 24. Batched backfills

Step three copies data in 5,000,000 rows. The obvious statement is one `UPDATE orders SET kitchen_note = note`. On a big busy table it causes several kinds of damage at once. It runs as one transaction, so it holds row locks on all 5,000,000 rows until it commits, and any order update by a customer or the kitchen waits. It writes a new version of every row, so the table and its indexes temporarily double in size until vacuum cleans up. It generates gigabytes of write-ahead log in one burst, which replicas must replay, so their lag climbs. And if it fails after 20 minutes, everything rolls back and the next attempt starts from zero.

A **batched backfill** updates a small slice at a time, each in its own short transaction.

```sql
UPDATE orders SET kitchen_note = note
WHERE id BETWEEN $1 AND $1 + 999
  AND kitchen_note IS NULL;
```

@fig be_db_backfill | 5,000 batches of 1,000 rows. Each one is a short transaction, so customers never notice.

With batches of 1,000 rows, 5,000,000 rows take 5,000 batches. At an illustrative 50 ms per batch, the work itself takes 5,000 × 0.05 = 250 s. Wren adds a 50 ms sleep between batches so the database and its replicas can keep up, which doubles the total to 5,000 × 0.1 = 500 s, a little over eight minutes. Each batch locks at most 1,000 rows for 50 ms, so a customer editing an order waits at most that long.

Three properties make the job safe to run in production. It is **resumable**, because it walks the primary key range and records its position, so a crash restarts from the last completed batch. It is **idempotent**, because `kitchen_note IS NULL` skips rows already done, and running it twice is harmless. And it is **throttled**, slowing down or pausing when replication lag or database CPU crosses a threshold.

@fig be_db_backfill_lag | Illustrative. One giant UPDATE pushes replicas minutes behind; small batches keep lag flat.

Batch size is a trade. Bigger batches finish sooner and hold locks longer, smaller ones are gentler and slower. Start with 1,000, watch the lock waits and lag, and adjust.

## 25. Dual writes, verification and cutover

Between steps two and five, the application writes the same data to two places. That window has its own risks, and the larger the data move, the more they matter.

Within one database, dual writes are simple. The code sets both columns in the same `UPDATE`, inside the same transaction, so they can never disagree. A database trigger can do the same job, copying `note` to `kitchen_note` on every write, which also covers writers outside the main application, such as an admin tool or a script. Triggers are invisible to most developers, so Wren uses them sparingly and removes them in the contract step.

Across two systems, say moving the orders table to a new database, dual writes cannot be atomic without a distributed transaction. Writing to the old store and then the new one leaves a gap where one write succeeds and the other fails. The safer pattern is to write to the old store as the source of truth and feed the new one from its change stream, through change data capture or an outbox as Unit VIII explains, so the new store converges even after failures.

Before cutting reads over, verify. Wren runs a **shadow read** for a day. The code reads from both columns, returns the old one to the user and logs any difference, with the order id. A comparison job also scans in batches and counts mismatches. Cutover happens when both report zero. For a cross-database move, shadow reads also prove that the new store can handle production query patterns and latency before any user depends on it.

The cutover is a code change behind a feature flag, so it can be flipped back in seconds without a deploy. Wren moves 1% of reads first, then 10%, then all, watching error rates and latency at each step. Only after a quiet week does the contract step drop the old column, because a drop is the one step that cannot be undone.

:::story Picture this
Replacing a bridge without closing the road. Engineers build the new bridge beside the old one, open it to a few lanes of traffic, watch it for a while, move all traffic across, and only then demolish the old bridge. Nobody blows up the old bridge on the morning the new one is finished.
:::

:::note Renaming without moving data
For a pure rename inside PostgreSQL, a shortcut exists. Rename the column and create a view, or use a generated column, so old code still sees the old name. It saves the backfill but adds indirection, and most teams reserve it for emergencies. The full expand and contract sequence is easier to reason about.
:::

:::warn Watch out
The contract step is where data is actually lost. Before dropping a column or table, confirm nothing reads it, using query logs or `pg_stat_statements`, take a backup, and consider renaming it to `note_deprecated` for a week first, so a forgotten reader fails loudly and the data is still there.
:::

:::interview Interview lens
**"How would you rename a column on a large table with zero downtime?"** Expand and contract. Add the new column, deploy code that writes both and reads the old one, backfill existing rows in small, resumable, throttled batches, verify with shadow reads and a comparison job, deploy code that reads the new column behind a flag and still writes both, stop writing the old column, and finally drop it after a quiet period. Every step is compatible with the code before and after it, so each can be rolled back.
:::

:::key In one breath
Expand and contract changes a schema in steps that are each compatible with the old and the new code, so a column rename becomes add, write both, backfill, read new, stop writing old, drop. Backfills run in short batches that are resumable, idempotent and throttled, so 5,000,000 rows take 5,000 batches and about 500 s with pauses instead of one giant locking transaction that floods the replicas. Dual writes within one database share a transaction, moves between systems use change data capture, and reads switch behind a flag only after shadow reads show zero differences.
:::

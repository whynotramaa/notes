@part VI | Schema migrations | We change the shape of tables that are serving live traffic. Most migration outages come not from slow changes but from locks that make every other query wait. We will cover migration tools and how they run in a deploy, DDL locks and the lock queue, building indexes without blocking writes, and which changes are safe on a large PostgreSQL table. | where:6

## 19. Migration tools and how they run

The database schema changes as the product changes. Wren adds a tip column, an index for a new filter, a table for promotions. A **migration** is a small, versioned script that moves the schema from one state to the next, and a **migration tool** applies them in order and remembers which have run. Rails popularized the idea with Active Record migrations in 2005. Flyway, Liquibase, Alembic, Django migrations, golang-migrate and Prisma Migrate all work the same way.

Each migration is a file with a sortable version, such as `0044_add_kitchen_note.sql`. The tool keeps a table in the database, often named `schema_migrations`, with one row per applied version. When it runs, it compares the files to the table and applies the missing ones in order, recording each as it succeeds. The same files run on a laptop, in CI, in staging and in production, so every environment reaches the same schema by the same path.

@fig be_db_migration_files | Files 0044 and 0045 have not run. The migrate step applies them in order and records each.

Three habits keep this reliable. Never edit a migration that has already run anywhere, because environments that applied the old version will never see the new one. Write a new migration instead. Keep each migration small, one logical change, so a failure is easy to understand and to retry. And make migrations safe to run while the old code is still serving traffic, which is the subject of the rest of this part and the next.

Wren runs migrations as a separate step in the deploy pipeline, after the new image is built and before the rollout. A single job runs them, protected by a PostgreSQL advisory lock, so two pipelines started at once cannot apply the same migration twice. Running migrations from every app instance at start-up is a common mistake that turns 20 instances into 20 migrators racing each other.

@fig be_db_migration_deploy | Build, migrate once under a lock, then roll the instances out one by one.

During the rollout, instances running v41 and v42 serve traffic side by side for several minutes. The migrated schema must therefore work for both versions, which rules out many changes that look harmless.

Down migrations, scripts that undo a change, exist in most tools. Wren writes them for development but rarely runs them in production. Rolling back a schema that has already accepted new data can destroy that data. The safer pattern is to roll forward with a new migration.

## 20. DDL locks and the lock queue

Schema changes are **DDL** statements, data definition language, such as `ALTER TABLE`, `CREATE INDEX` and `DROP COLUMN`. Most `ALTER TABLE` forms take an **ACCESS EXCLUSIVE** lock on the table, the strongest lock PostgreSQL has, which conflicts with every other lock, including the light ACCESS SHARE lock that a plain `SELECT` takes. Adding a nullable column only needs the lock for a millisecond to update the catalog. The danger is not how long it holds the lock. The danger is how long it waits to get it.

Picture Wren at peak. An analyst's report has been running a `SELECT` on `orders` for 30 s, holding ACCESS SHARE. The deploy runs `ALTER TABLE orders ADD COLUMN kitchen_note text`. The ALTER needs ACCESS EXCLUSIVE, which conflicts with the analyst's lock, so it waits. PostgreSQL's lock queue is first come, first served, so every new query on `orders`, even a simple `SELECT`, must now wait behind the ALTER, since its lock would conflict with the ALTER's pending request.

@fig be_db_lock_queue | The ALTER waits at the door behind one long query, and every later query queues behind the ALTER.

The arithmetic is brutal. Wren sends roughly 200 queries per second to `orders` at peak. All 40 pooled connections are stuck within 40 ÷ 200 = 0.2 s, and from then on requests fail with pool timeouts. If the report takes another 30 s, about 30 × 200 = 6,000 queries pile up or fail. A change that needs a millisecond of locking causes a 30-second outage.

The fix is `lock_timeout`. Wren's migrations start with `SET lock_timeout = '2s'`. If the ALTER cannot get its lock within 2 s, it gives up, the queue behind it drains, and the migration tool retries after a pause. Each attempt causes at most a 2 s stall instead of an unbounded one, and the ALTER eventually lands in a quiet moment, holding its lock for 5 ms.

@fig be_db_lock_timeout | Two bounded stalls and one successful attempt, instead of one long outage.

Two more habits help. Run migrations away from peak traffic and long-running jobs, and set `statement_timeout` on reporting roles so no query holds a lock on a busy table for 30 s in the first place.

## 21. Building indexes without blocking writes

A plain `CREATE INDEX` takes a SHARE lock on the table for the whole build. Reads continue, but every `INSERT`, `UPDATE` and `DELETE` waits. On Wren's 5,000,000-row orders table, an illustrative build time of 40 s means 40 × 50 = 2,000 order writes blocked at peak, and most of those customers see errors. For a large, busy table that is unacceptable.

**`CREATE INDEX CONCURRENTLY`**, added in PostgreSQL 8.2 in 2006, builds the index without blocking writes. It works in phases. It registers the new index in the catalog as not yet valid, so new writes start maintaining it. It waits for every transaction that might not have seen that registration to finish. It scans the table and builds the index. It waits again, scans a second time to pick up rows written during the first scan, and finally marks the index valid. Writes flow throughout.

@fig be_db_index_concurrently | The plain build stops writes for 40 s. The concurrent build takes longer and lets them through.

The price is time and some fragility. A concurrent build reads the table twice and waits for older transactions, so it takes longer, and a long-running transaction anywhere in the database delays it. It cannot run inside a transaction block, which means migration tools that wrap every migration in a transaction need an explicit opt-out for that file. If it fails, for example because a unique index finds a duplicate, it leaves an **invalid index** behind. The index is maintained on every write but never used for reads, so it costs performance and helps nothing. Wren's runbook checks for invalid indexes after any failed build, drops them with `DROP INDEX CONCURRENTLY`, and tries again.

The same idea, doing work in phases so locks are brief, runs through all safe schema changes. MySQL offers online DDL for many operations, and tools such as GitHub's gh-ost (2016) and Percona's pt-online-schema-change copy a table in the background and swap it in, for changes the database cannot do online itself.

## 22. Safe and unsafe changes on a live table

Every proposed migration on a large table answers two questions. Does it rewrite or scan the table while holding a strong lock, and will the code currently running still work after it? Wren's reviewers sort changes into three groups for PostgreSQL 11 and later.

**Safe** changes need only a brief catalog lock. Adding a nullable column is instant. Adding a column with a constant default has also been instant since PostgreSQL 11 (2018), which stores the default in the catalog instead of writing it into every row. `CREATE INDEX CONCURRENTLY` is safe, as the last section showed. Adding a check or foreign key constraint with `NOT VALID` is instant too, because it applies only to new writes. A later `VALIDATE CONSTRAINT` checks existing rows under a lighter lock that allows reads and writes.

@fig be_db_safe_changes | Green, amber and red. Most red changes become green when split into steps.

**Careful** changes are safe only with a technique. `SET NOT NULL` scans the whole table under ACCESS EXCLUSIVE, unless a validated `CHECK (col IS NOT NULL)` constraint already exists, in which case PostgreSQL 12 and later skip the scan. Adding a foreign key should use `NOT VALID` then `VALIDATE`. Dropping a column is instant for the database but breaks any running code that still selects it, so the code must stop using it first.

**Rewrite or break** changes need a different approach entirely. Changing a column's type, say `integer` to `bigint`, rewrites the whole table under ACCESS EXCLUSIVE, minutes for 5,000,000 rows. Adding a column with a volatile default such as `clock_timestamp()` rewrites too. Renaming a column is instant for the database and instantly breaks every running instance that uses the old name.

Every item in the red group has a safe path, and it is always the same shape. Add the new thing beside the old one, move the data and the code across in small steps, and remove the old thing when nothing uses it. Part VII walks through it.

:::story Picture this
Repainting a lane of a busy motorway. The paint itself takes ten minutes. Closing the lane takes ten minutes too, if the cones go out at 3 a.m. Put the cones out at rush hour behind a broken-down lorry and traffic backs up for kilometres, all because of a job that needed ten minutes. Lock timeouts are the rule that says "if the lane is not clear in two minutes, take the cones back and try later".
:::

:::note Linting migrations
Tools such as squawk for PostgreSQL and strong_migrations for Rails read migration files in CI and flag dangerous operations, a missing `CONCURRENTLY`, a `SET NOT NULL` without a prior check constraint, a type change on a large table. They turn this part's rules into a failing build instead of a production incident.
:::

:::warn Watch out
Never run migrations automatically from every application instance at start-up. Twenty instances become twenty migrators, and a slow migration delays every instance's readiness, which can fail the whole rollout. Run them once, as a pipeline step, under a lock.
:::

:::interview Interview lens
**"How do you add an index to a large, busy table in PostgreSQL?"** Use `CREATE INDEX CONCURRENTLY`, outside a transaction block, so writes continue during the build. It takes longer, waits for older transactions and scans twice. Set `lock_timeout` so the brief lock it needs cannot queue behind a long query. If it fails, drop the invalid index it leaves and retry. Run it as its own migration, off peak, and check that no long transactions are open first.
:::

:::key In one breath
Migrations are numbered scripts that a tool applies once each, in order, recorded in a table, and Wren runs them as one pipeline step under an advisory lock while old and new code briefly coexist. Most `ALTER TABLE` forms need an ACCESS EXCLUSIVE lock, and waiting for it behind a 30 s query queues every other query, filling 40 connections in 0.2 s, so migrations set `lock_timeout` and retry. `CREATE INDEX CONCURRENTLY` builds without blocking writes, and changes split into safe, careful and rewrite-or-break groups, with the red ones handled by expanding first and contracting later.
:::

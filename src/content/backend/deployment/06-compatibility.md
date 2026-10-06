@part VI | Compatibility and zero-downtime migrations | We learn the rules that let two versions of a service run side by side, which every strategy in Part V quietly assumes. A deploy without downtime is mostly a question of data formats, not of infrastructure. We will cover backward and forward compatibility across APIs, events and caches, and expand-and-contract database migrations. | where:6

## 18. Backward and forward compatibility

During every rollout, Wren runs version N and version N+1 of the orders service at the same time, for minutes in a rolling update, for an hour or more in a slow canary. They share the same database, the same Redis, the same Kafka topics, and the same clients. Anything one version writes, the other may read. A deploy has zero downtime only if both directions work.

**Backward compatibility** means the new version can handle what the old version produced: rows it wrote, events it published, cache entries it stored, and requests from clients built against the old API. **Forward compatibility** means the old version can handle what the new version produces, which matters because during a rollout, and after any rollback, old code reads data written by new code. Forward compatibility is the one teams forget. A new version that writes a new enum value, such as order status `"scheduled"`, breaks every old pod that reads that order and does not know the value, and it breaks them again after a rollback, when only old pods remain.

@fig be_dep_compat | During a rollout, N and N+1 read each other's rows, events and cache entries. Both directions must work.

The rules for data formats follow from this. Add fields, never remove or rename them in one step. Readers ignore fields they do not know, which JSON parsers do if not configured to reject unknown fields, and Protocol Buffers do by design, Unit V. New fields are optional, with defaults that old writers' data can use. Enum values are added in two releases: first deploy code that tolerates the new value, then deploy code that writes it. The same applies to Kafka event schemas, where a schema registry can enforce backward and forward compatibility on every change, Unit VIII, and to cache entries, where Wren puts a version in each key, `order:v3:123`, so a format change uses new keys rather than old code reading new structures, Unit VII.

APIs exposed to clients have the longest tail. A mobile app version may stay installed for years, so Wren's public API keeps every field it has ever promised until the old versions' traffic is negligible, and introduces breaking changes only under a new version, Unit V. Internal APIs between services are easier because both ends are deployed by Wren, but the order of deploys still matters. A new field that the orders service starts sending must be accepted by payments first, so the receiver deploys before the sender. Contract tests in CI, Unit V, check that each service's current version works with its consumers' and providers' deployed versions, which catches the mistakes that ordering rules alone miss.

## 19. Expand-and-contract migrations

Database schema changes are the hardest part of compatibility, because the database is shared by every version at once and many changes cannot be undone by redeploying. Suppose Wren wants to rename the column `orders.addr` to `orders.delivery_address`. Doing it in one step, renaming the column and deploying code that uses the new name, breaks every old pod the moment the migration runs, because they still query `addr`. And rolling back the code after the migration breaks again for the same reason.

The safe pattern is **expand and contract**, sometimes called parallel change, in several deploys. **Expand**: add the new column `delivery_address`, nullable, alongside the old one. Old code ignores it. **Dual write**: deploy code that writes both columns and still reads the old one. **Backfill**: copy existing values from `addr` to `delivery_address` in batches. **Switch reads**: deploy code that reads the new column, still writing both, so a rollback to the previous version still finds `addr` up to date. **Stop writing the old column**: deploy code that uses only the new one. **Contract**: after enough time has passed that no rollback will need it, drop `addr`. Every step is compatible with the versions on either side, so any one deploy can be rolled back.

@fig be_dep_expand_contract | Six steps to rename a column. At every step, the current and previous versions both work.

The mechanics of each step matter as much as the order. In PostgreSQL, adding a nullable column without a default, or with a constant default since version 11, is a metadata change that is instant even on a large table. Adding a `NOT NULL` constraint to an existing column scans the table under a lock, so Wren adds it as a `CHECK` constraint marked `NOT VALID`, which is instant, and then runs `VALIDATE CONSTRAINT`, which scans without blocking writes. Indexes are built with `CREATE INDEX CONCURRENTLY`, which does not block writes but takes longer and can fail, leaving an invalid index to drop and retry. Every migration sets a `lock_timeout`, such as 2 seconds, so a migration waiting behind a long transaction gives up instead of queueing every other query behind its lock request, the classic way a "quick" migration takes a site down, Unit VI.

Backfills run in batches, never as one `UPDATE` over the whole table. One statement over 50 million rows would hold locks and generate write-ahead log for a long time, lag every replica, and roll back entirely if it failed at row 49 million. In batches of 5,000 rows by primary key range, it is 10,000 small transactions. At 100 ms each, that is 1,000 seconds, about 17 minutes, with a short sleep between batches if replica lag rises. The job records its last key so it can resume.

@fig be_dep_backfill | 50 million rows as 10,000 batches of 5,000, each a short transaction, pausing when replica lag rises.

Migrations run as their own step in the pipeline, as a Kubernetes Job before the rollout, Part II, not from application startup, where four pods would race to run the same migration. And the "contract" step is scheduled, not forgotten. Wren's migration tool lists expanded columns that are still waiting to be dropped, so dead columns do not accumulate for years.

:::story Picture this
Moving a shop's stock to a new shelf layout while the shop stays open. You put up the new shelves next to the old ones first. For a while, staff put new deliveries on both, while customers still shop from the old shelves. Then the old stock is moved across a box at a time. Then signs point customers to the new shelves, and only weeks later, when nobody has asked for the old aisle in a long time, are the old shelves taken down.
:::

:::note Deploy order for producers and consumers
When a change adds something, deploy the reader first, then the writer. When a change removes something, deploy the writer first, so nothing produces the old form, then remove the reader's handling of it. Getting the order backwards is the usual cause of errors that last exactly as long as a rollout.
:::

:::warn Watch out
Renaming or dropping a column, changing a type, or adding a NOT NULL constraint in one migration breaks the old version during the rollout and makes rollback impossible. Use expand and contract over several deploys, set lock_timeout on every migration, build indexes concurrently and backfill in batches.
:::

:::interview Interview lens
**"How do you rename a column with zero downtime?"** Expand and contract. Add the new column, deploy code that writes both and reads the old, backfill in batches, deploy code that reads the new and still writes both, then stop writing the old, and drop it only once no rollback could need it. Each step is compatible with the versions on either side, so rollouts and rollbacks keep working. Run migrations as a separate pipeline step with lock_timeout, build indexes concurrently, and validate constraints without blocking writes.
:::

:::key In one breath
Every rollout runs two versions against the same database, caches, topics and clients, so new code must read old data, backward compatibility, and old code must read new data, forward compatibility, including after a rollback. Add fields rather than renaming or removing, make readers ignore unknown fields, add enum values in two releases, version cache keys, deploy readers before writers, and check with contract tests. Schema changes use expand and contract over several deploys, with instant nullable columns, NOT VALID constraints validated later, concurrent index builds, lock_timeout, and batched backfills, 50 million rows as 10,000 batches of 5,000 in about 17 minutes.
:::

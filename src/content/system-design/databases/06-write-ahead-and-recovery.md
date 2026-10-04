@part VI | WAL, recovery and connection pools | We recover a committed change after memory disappears. Updating a table page in memory cannot by itself justify a durable reply. We will follow the log before the page, recover after a crash, and bound the sessions that submit work. | where:6

## 25. WAL persists recovery information before pages

The scorer receives success, then the database machine loses power before its updated table page reaches storage. Requiring every modified page to flush before every reply can create scattered writes. **Write-ahead logging**, or **WAL**, records recovery information before the dependent data pages are persisted.

The illustrative transaction prepares three log records: a score change, an event insertion, and a command-result insertion. Assuming 200 bytes per record gives 600 bytes of log payload. A real engine also records transaction and structural information; this toy count is not a prediction of its WAL volume.

The engine appends log information, completes the configured commit durability condition, and can acknowledge the transaction. Dirty table pages can flush later. A **dirty page** is a cached page changed since its persisted copy; before writing it, the engine must ensure the log required to recover that page is safely written under the storage protocol.

@fig sd_databases_wal | Illustrative log-first ordering. A commit reply can precede table-page flush because recovery information already satisfies the chosen durability contract.

This separates durable decision from final page placement. Sequential log appends can collect several transactions into fewer flushes, while later background writes place table pages. **Group commit** shares a durability operation across several commits without pretending that an unflushed memory buffer is durable.

The cost includes log bytes, flush waiting, page writes, and storage behavior. Disabling a durability wait can reduce latency while allowing recent acknowledged work to vanish. [PostgreSQL's WAL introduction](https://www.postgresql.org/docs/18/wal-intro.html) describes its log-before-page rule and redo purpose.

:::story Picture this
A warehouse records a completed move in a durable journal before replacing the shelf's inventory card. If the card update is interrupted, the journal explains which move to restore. A journal still in the clerk's volatile memory cannot recover a power failure.
:::

## 26. Crash recovery reconciles pages with log history

A crash leaves some changed pages persisted and others missing. **Crash recovery** uses durable recovery records and transaction decisions to reconstruct a valid database state. It is not equivalent to rerunning every API request that happened to reach the application.

Consider a persisted page containing score 10 and a durable committed log describing score 11 plus event `e5` and command `k7`. Recovery applies the required logged changes, yielding the committed score, event, and result. If a page already contains the relevant update, engine-specific page and log metadata prevent applying it as another logical increment.

@fig sd_databases_recovery | Illustrative committed log with an older table page. Redo reconstructs the committed effect instead of inventing a second command.

Uncommitted log records can also exist at crash time. Engines handle them through their transaction and recovery design, including undo or visibility rules where appropriate. Do not describe recovery as blindly replaying all bytes into application-visible committed state. The log describes physical or logical changes and transaction history under a specific protocol.

A **checkpoint** records a recovery starting boundary and coordinates persisted state so startup need not always replay from the beginning of history. It is not a replacement for per-commit durability. Log retained for replicas, backups, or old recovery requirements can outlive the work needed for local restart.

:::warn Watch out
WAL is not an independent backup of everything. Losing the only durable storage containing both table files and log can lose the database. Recovery after a process crash, restoration after storage loss, and regional disaster recovery need different surviving material.
:::

## 27. Connection pools bound sessions and occupancy

Applications can open more database sessions than the engine can usefully execute. A **connection pool** keeps reusable sessions and lends them under a bounded policy. It saves setup work and limits concurrent submitted work, but cannot create CPU, disk, or lock capacity.

Heron's illustrative pool has 20 connections. At 0.01 s occupancy per operation, the ideal occupancy bound is $20/0.01=2,000$ operations per second. If every operation keeps the connection for another 0.09 s while waiting on a remote call, occupancy becomes 0.1 s and the bound drops to 200. The database work did not become slower; the application held the scarce slot longer.

@fig sd_databases_pool | Illustrative occupancy budgets. Connection holding time, including unnecessary waits, determines the pool's upper bound.

Five application processes each configured with 20 connections can open 100 sessions in total. Scale application instances without checking the combined database budget and contention can get worse. A bounded acquisition queue and deadline keep overload from becoming an unlimited collection of waiting requests.

Transaction state belongs to the borrowed session under the pool's contract. Return a clean session, avoid idle open transactions, and know whether the pool operates by session or transaction. A client timeout does not always cancel a completed or still-running database command, so reconcile uncertain writes through command identity.

:::interview Interview lens
**"What would you measure before increasing a pool?"** I measure acquisition wait, occupancy, useful query execution, and database bottlenecks. I compare the total across processes with the dependency's tested capacity. If callers hold connections during remote waits, I first shorten that holding interval rather than adding more waiting sessions.
:::

:::key In one breath
WAL makes later page recovery possible when the required log survives before dependent pages. Crash recovery reconciles logs, pages, and transaction decisions, while checkpoints bound restart work. Durability still depends on configuration and surviving storage. Pools bound sessions, and occupancy includes every wait while a connection remains borrowed.
:::

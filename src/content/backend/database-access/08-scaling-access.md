@part VIII | Scaling database access | We spread reads across replicas and connections across a pooler when one primary and a few pools are no longer enough. Each step adds capacity and a new way to read stale data or run out of connections. We will cover read replicas and lag, read-your-writes strategies, PgBouncer and its pooling modes, and connection budgets across many instances. | where:8

## 26. Read replicas and replication lag

Wren's primary database handles every write and every read. Reads outnumber writes by about eight to one, so the obvious relief is a **read replica**, a second PostgreSQL server that receives a continuous copy of the primary's changes and serves read-only queries. PostgreSQL has supported **streaming replication** since version 9.0 in 2010. The primary records every change in its write-ahead log, the WAL, and streams those records to each replica, which replays them in the same order.

@fig be_db_replicas | Writes go to the primary. WAL records stream to two replicas, which serve reads.

Replication is asynchronous by default. The primary commits and replies to the client without waiting for replicas, so they are always a little behind. The delay is **replication lag**, usually a few milliseconds and occasionally much more, when a replica is busy, a large transaction is replaying, or the network hiccups. A batch backfill without throttling, from Part VII, is a classic cause of minutes of lag.

Lag produces a familiar bug. User 42 changes the tip on order 123 from 20 to 30. The `PATCH` goes to the primary and commits at 5 ms. The app immediately shows the order page, which sends a `GET` to a replica at 30 ms. The replica applies the change at 80 ms. The user sees tip 20 and assumes the change failed, and taps again.

@fig be_db_lag | The write committed at 5 ms. The replica caught up at 80 ms. The read at 30 ms saw the past.

Replicas also have operational limits. They do not scale writes, since every write still lands on the primary and must be replayed on every replica. A long query on a replica can conflict with WAL replay, because replay wants to remove row versions the query still needs, and PostgreSQL then either delays replay or cancels the query, depending on `max_standby_streaming_delay` and `hot_standby_feedback`.

Synchronous replication, where the primary waits for at least one replica to confirm before reporting a commit, removes data loss on failover for that replica, but adds a round trip to every commit and does not by itself make replicas readable at the latest state. Wren keeps replicas asynchronous and handles freshness in the application.

## 27. Reading your own writes

Most reads tolerate a few milliseconds of staleness. A restaurant's menu or another user's review can be 100 ms old without anyone noticing. The reads that cannot are a user's view of something they just changed. The guarantee they need is **read-your-writes consistency**. After you write, your own reads reflect the write, even if other users still see the old value for a moment.

@fig be_db_ryw | A sticky window, a log position, or a rule about whose data lives where.

Wren can choose among three strategies. The simplest is a **sticky primary window**. When a user writes, the service records the time in a cookie or the session, and for the next 5 s it routes that user's reads to the primary. Lag beyond 5 s still leaks through, and a user who writes constantly sends all their reads to the primary, but it is easy to build and covers most cases.

The precise strategy tracks **log positions**. After a commit, the service asks the primary for its current WAL position, a **log sequence number** or LSN such as `0/3A2F10`, and stores it in the user's session. Before reading from a replica, it checks the replica's replay position with `pg_last_wal_replay_lsn()`. If the replica has replayed past the session's LSN, the read is safe. If not, the service waits a few milliseconds or falls back to the primary. This costs an extra query or a cached position check, and it guarantees freshness however large the lag.

The third strategy routes by ownership. Reads of a user's own data, their orders, their profile, their cart, go to the primary, and reads of everyone else's data go to replicas. The split matches how people notice staleness and needs no bookkeeping, but it sends a large share of reads to the primary.

Monotonic reads are a related guarantee. A user who refreshes twice should not see the tip go from 30 back to 20 because the second request hit a more lagging replica. Pinning a session to one replica, or applying the LSN rule to every read, prevents that.

## 28. PgBouncer and pooling modes

Pools live inside each application process, as Part I showed. That works until the number of processes grows. Wren's API runs 4 instances with a pool of 10, but its background workers, admin tools and a dozen cron jobs all keep their own pools. An external **connection pooler** sits between all of them and PostgreSQL, accepting many client connections and multiplexing them onto a few server connections. **PgBouncer**, first released by Skype in 2007, is the most widely used. Pgpool-II, Odyssey, PgCat and the poolers built into managed services such as Amazon RDS Proxy do the same job.

@fig be_db_pgbouncer | Four instances open 400 client connections. PgBouncer feeds them through 40 real ones.

How long a client keeps a server connection depends on the **pooling mode**. In **session mode**, a client keeps one server connection from connect to disconnect, idle time included, so PgBouncer saves only connection setup. In **transaction mode**, a client gets a server connection only for the length of one transaction and returns it at `COMMIT`. Between transactions the same server connection serves other clients. Because most client connections sit idle most of the time, 400 clients can share 40 server connections comfortably. **Statement mode** returns the connection after each statement and forbids multi-statement transactions, so it is rarely used.

@fig be_db_pool_modes | Session mode holds a connection the whole time. Transaction mode holds it for BEGIN to COMMIT.

Transaction mode is where the savings are and also where the surprises are. Anything that lives in the session, rather than the transaction, can leak to another client or vanish. `SET search_path` or `SET statement_timeout` outside a transaction applies to whichever client gets that server connection next. `LISTEN`, session-level advisory locks and temporary tables break. Prepared statements were a long-standing problem, since they live on one server connection and the next transaction may land elsewhere, until PgBouncer 1.21 in 2023 added support for protocol-level prepared statements in transaction mode.

Wren's rules for transaction mode are short. Use `SET LOCAL` inside transactions, which resets at commit. Use transaction-scoped advisory locks. Keep `LISTEN` and other session features on a direct connection.

## 29. Connection budgets across many instances

The database's `max_connections` is a hard ceiling, 100 for Wren with 3 reserved for superusers, leaving 97. Every pool in every process draws from that budget, so the number that matters is the sum across the fleet.

At 4 instances with pools of 10, Wren uses 40, comfortably within 97. On a busy evening the autoscaler adds instances. At 20 instances, the same configuration asks for 20 × 10 = 200 connections, more than twice the budget. The first 97 succeed, and the rest fail with `FATAL: sorry, too many clients already`. The instances that were added to handle load start up broken, health checks fail, and the autoscaler may add even more.

@fig be_db_conn_math | Scaling the app from 4 to 20 instances multiplies connections past the database's limit.

Serverless platforms make this sharper. A thousand concurrent function invocations, each opening its own connection, ask for 1,000 connections in a second. The usual answers are an external pooler such as RDS Proxy or PgBouncer, or a database designed for that pattern with an HTTP or pooled connection layer.

Wren budgets connections explicitly. The plan reserves 40 for API instances at the autoscaler's maximum of 20, by running them through PgBouncer in transaction mode with 40 server connections. It reserves 10 for background workers, 5 for migrations and admin, and 5 for monitoring, leaving headroom below 97. The per-instance pool size is derived from the budget, budget ÷ maximum instances, not chosen per service by whoever wrote it.

When even that is not enough, the bottleneck is no longer connections but the primary's capacity. The next steps are caching from Unit VII, moving reads to replicas, splitting workloads across databases, and eventually sharding, which the system design guide covers.

:::story Picture this
A library with ten reading desks and a thousand members. If each member reserved a desk for the whole day, ten people would read and everyone else would wait outside while desks sat empty at lunch. Lend desks per visit instead, and a thousand members share ten desks easily. Transaction pooling lends desks per visit. The catch is that anything left on the desk, a bookmark or a note, will be found by the next reader.
:::

:::note Measuring lag
On the primary, `pg_stat_replication` shows each replica's sent, written, flushed and replayed WAL positions and the time lag for each. On a replica, `now() - pg_last_xact_replay_timestamp()` estimates how far behind it is, though it overstates lag when the primary is idle. Wren alerts when replay lag exceeds 5 s, the same as its sticky window.
:::

:::warn Watch out
Do not route reads to replicas by default and fix staleness bugs later. Decide per endpoint which reads may be stale and which must see the user's own writes, and make the routing rule part of the repository, not something each handler remembers.
:::

:::interview Interview lens
**"You add read replicas and users complain that their changes seem to disappear. What happened and how do you fix it?"** Asynchronous replication lag. The write committed on the primary and the next read went to a replica that had not replayed it yet. Fix it with read-your-writes routing: send a user's reads to the primary for a few seconds after they write, or record the commit's LSN in their session and read from a replica only once it has replayed past it, or route reads of a user's own data to the primary. Alert on lag and pin sessions to avoid moving backwards in time.
:::

:::key In one breath
Read replicas replay the primary's WAL asynchronously and scale reads, not writes, and replication lag means a read right after a write can see the past, as with the tip that read 20 at 30 ms when the replica caught up at 80 ms. Read-your-writes comes from a sticky primary window, LSN tracking or routing a user's own data to the primary. PgBouncer in transaction mode lets 400 client connections share 40 server connections at the cost of session state, and every pool across the fleet must fit inside `max_connections`, because 20 instances × 10 = 200 is more than Wren's 97.
:::

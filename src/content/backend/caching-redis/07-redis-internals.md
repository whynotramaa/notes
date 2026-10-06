@part VII | Redis internals | We look inside a Redis server to see why it is fast, why it is atomic, and how it keeps data across restarts. Most Redis surprises in production, latency spikes, lost writes, memory doubling, trace back to these internals. We will cover the event loop and RESP, pipelining, transactions and Lua, expiration and eviction, and RDB and AOF persistence. | where:7

## 22. The event loop and RESP

Redis runs every command on a single thread. That sounds like a limitation and is the source of its speed and simplicity. Data lives in memory, so most commands take a microsecond or less. A single thread needs no locks, so there is no contention and no lock overhead. And because commands run one at a time, each one is atomic. `INCR` can never interleave with another `INCR` on the same key.

The thread runs an **event loop**. It asks the operating system, through `epoll` on Linux or `kqueue` on BSD and macOS, which client sockets have data ready, reads the commands, executes them in order, and writes the replies. Thousands of clients share the thread, each command taking its turn. A simple command costs about 10 µs of server time including networking, so one core handles roughly 100,000 simple commands per second. Wren's peak of about 2,500 Redis commands per second uses a few percent of it.

@fig be_redis_event_loop | Many clients, one cook. Each command runs to completion before the next starts.

The single thread is also the main hazard. Any slow command blocks every client. `KEYS *` over millions of keys, `HGETALL` on a huge hash, `SMEMBERS` on a large set, a long Lua script or `DEL` on a big key can each stall the server for milliseconds to seconds. The `SLOWLOG` command lists commands that took longer than a threshold, and it is the first place to look when Redis latency spikes. Redis 6.0 in 2020 added **I/O threads** that read and write sockets in parallel, but commands still execute on the main thread, so the rule against slow commands stands. Forks of Redis such as KeyDB and Dragonfly run commands on many threads, and Valkey, the Linux Foundation's fork created in 2024 after Redis changed its license, has improved I/O threading further.

Clients speak **RESP**, the Redis serialization protocol. A command is an array of bulk strings, each prefixed by its length in bytes. `SET user:42:name Asha` travels as `*3\r\n$3\r\nSET\r\n$12\r\nuser:42:name\r\n$4\r\nAsha\r\n`. The reply is `+OK\r\n`. Length prefixes mean values can contain any bytes without escaping, and parsing needs no searching for delimiters, which keeps the server's per-command cost tiny.

@fig be_redis_resp | Every piece has a length, so nothing needs escaping.

RESP3, introduced with Redis 6, adds types such as maps, sets, doubles and out-of-band push messages, which client-side caching uses to tell clients when a key they read has changed.

## 23. Pipelining, transactions and Lua

Each command costs a network round trip, and on Wren's network that is about 0.5 ms, fifty times the server's work. Sending 100 commands one after another, each waiting for its reply, takes 100 × 0.5 = 50 ms, almost all of it waiting. **Pipelining** sends all 100 commands without waiting, then reads all 100 replies. The total is about one round trip plus the server's work, 0.5 + 100 × 0.002 = 0.7 ms with an illustrative 2 µs per command. Every serious client library supports it, and it is the first fix when a batch job talks to Redis slowly.

@fig be_redis_pipeline | A rally of 100 round trips, or one trip carrying everything.

Pipelining is only about the network. Other clients' commands can run between the pipelined ones, so a pipeline is not atomic.

When commands must run together, Redis offers three tools. **MULTI and EXEC** form a transaction. Commands after `MULTI` are queued and run all at once when `EXEC` arrives, with nothing from other clients in between. It is not a transaction in the database sense. There is no rollback, and if one queued command fails at run time, the others still run. And no command inside can see another's result, so a transaction cannot read a value and branch on it.

**WATCH** adds optimistic locking, the same idea as the version column in Unit VI. `WATCH stock:17` marks the key, the client reads it, decides, and sends `MULTI`, its writes and `EXEC`. If any watched key changed in the meantime, `EXEC` returns nil and nothing runs, so the client retries. Under contention the retries add up.

@fig be_redis_multi_lua | Queued commands, optimistic checks, or logic that runs on the server.

**Lua scripts** solve the problem most directly. `EVAL` sends a short script that Redis runs atomically on its single thread, so the script can read keys, decide, and write without anyone interleaving. Wren's stock check is one script, read the stock, decrement if positive, return the result. Rate limiters, lock releases that check ownership, and conditional updates are all classic scripts. Redis 7.0 added **functions**, named scripts loaded once and called by name, which replace the older pattern of sending scripts by their SHA. The constraint is the single thread. A script that loops over 100,000 keys blocks every client for its whole run, so scripts must stay short, and in a cluster all the keys a script touches must live in the same slot.

## 24. Expiration and eviction inside Redis

Each key with a TTL has its absolute expiry time stored in a separate dictionary. Redis removes expired keys in two ways. **Lazy expiration** checks a key's expiry whenever a command touches it, and deletes it if the time has passed, returning nil as if it never existed. That alone would leave expired keys that nobody reads in memory forever.

**Active expiration** handles those. Ten times a second, Redis takes 20 random keys from the set of keys with a TTL, deletes the expired ones, and if more than 25% of the sample was expired, repeats immediately, up to a time limit. The logic is statistical. If many keys are expired, Redis keeps sweeping, and if few are, it stops quickly. Redis 6.0 improved the sweep so it adapts its effort, but the idea is unchanged.

@fig be_redis_expiry | Lazy checks on access, plus a statistical sweep that repeats while more than a quarter of the sample is expired.

Two consequences matter in practice. Memory usage can include expired keys that have not yet been found, so used memory is not the same as live data. And many keys expiring at once makes the active sweep work harder, adding latency to everything, another reason for TTL jitter.

Replicas do not expire keys on their own. The primary sends an explicit `DEL` through replication when it expires a key, so primary and replicas stay identical. A replica answering a read for a logically expired key whose `DEL` has not yet arrived returns nil since Redis 3.2, but older behaviour returned the value, which surprised many people.

Eviction runs when memory reaches `maxmemory` and a command needs more. Before executing the command, Redis evicts keys according to the policy from Part III, sampling candidates and removing the best, until memory is below the limit. Eviction therefore adds latency to the write that triggered it, and a burst of large writes into a full cache can show up as a latency spike. Memory **fragmentation**, the gap between memory Redis uses for data and memory the allocator holds, can also grow after many deletes. `INFO memory` reports the ratio, and `activedefrag yes` lets Redis compact memory in the background.

## 25. Persistence: RDB and AOF

Redis keeps data in memory, but it can save it to disk so a restart does not start empty. It offers two mechanisms, often used together.

An **RDB snapshot** writes the whole dataset to a compact binary file. Redis calls `fork()`, which creates a child process that shares the parent's memory. The child writes the snapshot while the parent keeps serving clients. The operating system's **copy-on-write** makes this possible. Both processes share memory pages until one of them writes to a page, and only then is that page copied. If few keys change during the snapshot, few pages are copied. If the workload is write-heavy, many pages are copied, and in the worst case memory use approaches double the dataset. That is why Wren's 8 GB of data runs on a host with headroom, and why Linux hosts for Redis disable transparent huge pages, which make each copy 2 MB instead of 4 KB.

@fig be_redis_persistence | The child shares the parent's pages and copies only those written during the snapshot. AOF appends every write.

The fork itself pauses the parent while the kernel copies the page tables, which takes roughly 10 to 20 ms per GB on typical hardware, a visible latency spike for a large instance. Snapshots run on a schedule, such as every 5 minutes if any keys changed, so a crash loses everything written since the last one.

The **append-only file**, AOF, logs every write command as it happens. On restart Redis replays the log. The `appendfsync` setting decides how often the file is flushed to disk. `always` flushes after every write, safest and slowest. `everysec`, the usual choice, flushes once a second, so a crash loses at most about one second of writes. `no` leaves it to the operating system, usually every 30 s. The AOF grows forever, so Redis periodically rewrites it from the current dataset, again using a fork. Since Redis 7.0 the AOF is split into a base file and incremental files, and the base can be in RDB format, which makes restarts faster.

Wren's session store uses both, RDB snapshots for backups and fast restarts and AOF with `everysec` for a one-second loss window. Its pure cache uses neither, because a restarted cache that refills from the database is acceptable, and skipping persistence avoids fork pauses. The question for each Redis instance is how much data loss the business can accept and how long a cold restart may take.

:::story Picture this
A shopkeeper who keeps the day's sales in their head, which is fast, and who has two ways to avoid forgetting. Every hour an assistant photographs the whole sales board while the shopkeeper keeps working, which is the snapshot. And every sale is also jotted on a till roll, which is the log. If the shopkeeper faints, the photograph plus the till roll since that photograph reconstructs the day.
:::

:::note Client-side caching
Redis 6 added server-assisted client-side caching. A client opts in with `CLIENT TRACKING ON`, and Redis remembers which keys it has read. When one of those keys changes, Redis pushes an invalidation message over RESP3. The client can then keep a local copy without guessing a TTL, which is the two-tier cache from Part I with the server doing the invalidation bookkeeping.
:::

:::warn Watch out
A Redis instance with persistence enabled and almost no free memory can fail during a snapshot, because copy-on-write needs extra memory and the kernel may refuse the fork or the out-of-memory killer may end the process. Keep memory headroom, monitor `rdb_last_bgsave_status`, and set `vm.overcommit_memory = 1` as the Redis documentation recommends.
:::

:::interview Interview lens
**"Why is Redis fast, and how does it avoid losing data?"** It keeps data in memory, executes commands on one thread with an event loop so there are no locks and every command is atomic, and uses a simple length-prefixed protocol. Clients pipeline to avoid round trips. For durability, RDB snapshots fork a child that writes the dataset using copy-on-write, losing writes since the last snapshot on a crash, and the append-only file logs every write, losing about a second with `everysec`. Replication to replicas adds a copy on another machine, though it is asynchronous.
:::

:::key In one breath
Redis runs commands one at a time on a single event-loop thread, so each command is atomic and a simple one costs about 10 µs, and any slow command blocks everyone. RESP prefixes every value with its length. Pipelining turns 100 round trips of 0.5 ms, 50 ms, into about 0.7 ms, MULTI/EXEC queues commands without rollback, WATCH adds optimistic checks, and Lua scripts or functions run read-decide-write atomically. Keys expire lazily on access and by a sampling sweep, eviction runs before writes when memory is full, RDB snapshots fork and rely on copy-on-write, and AOF with everysec loses at most about a second.
:::

@part VIII | Redis at scale | We give Redis copies on other machines and then spread its data across several. Each step adds availability or capacity, and each brings rules that application code must follow. We will cover replication and Sentinel failover, Redis Cluster with its 16,384 hash slots, and how backends use Redis well beyond caching. | where:8

## 26. Replication and Sentinel

A single Redis server is a single point of failure. **Replication** keeps copies on other servers. A replica connects to the primary, receives a full snapshot to start with, and then a continuous stream of every write command. Replicas can serve reads and, more importantly, can replace the primary if it dies. Wren runs one primary and two replicas in different availability zones.

Replication is asynchronous. The primary acknowledges a write to the client and sends it to replicas afterwards. If the primary dies a few milliseconds after acknowledging a write, that write may not have reached any replica, and when a replica is promoted, the write is gone. The `WAIT` command lets a client block until a given number of replicas have received its writes, which narrows that window, but it is still not a consensus protocol, and the Redis documentation is careful to say so. For a cache this rarely matters. For a lock or a rate limit it sometimes does, a topic Unit IX takes up.

Something has to notice that the primary is dead and promote a replica. **Redis Sentinel** is a separate set of processes, usually three, that watch the primary and the replicas. When one sentinel cannot reach the primary, it marks it subjectively down. When a **quorum** of sentinels, 2 of 3 for Wren, agree, the primary is objectively down. The sentinels then elect a leader among themselves, which picks the most up-to-date replica, promotes it, reconfigures the other replica to follow it, and tells clients the new address.

@fig be_redis_sentinel | Three sentinels agree the primary is gone and promote the replica with the most data.

Clients must cooperate. A Sentinel-aware client asks the sentinels for the current primary's address and reconnects when told it changed. A client configured with a fixed IP keeps calling the dead server. Managed services such as Amazon ElastiCache and Google Memorystore hide Sentinel behind a DNS name that moves on failover, which raises the DNS caching question from Unit VI. Failover typically takes from a few seconds to about 30 s, depending on the `down-after-milliseconds` setting and the vote.

A network partition can create a **split brain**. The old primary, cut off from the sentinels but still reachable by some clients, keeps accepting writes while a new primary is promoted on the other side. When the partition heals, the old primary becomes a replica and its writes from the partition are discarded. The settings `min-replicas-to-write` and `min-replicas-max-lag` make a primary refuse writes when it cannot see enough replicas, which bounds how much is lost.

## 27. Redis Cluster

Replication copies the same data to every server, so it adds read capacity and availability but not memory or write capacity. When Wren's data outgrows one machine's memory, or one core's 100,000 operations per second, it needs **sharding**, splitting the keys across servers. **Redis Cluster**, released with Redis 3.0 in 2015, does it with **hash slots**.

The key space is divided into 16,384 slots. Each key's slot is `CRC16(key) mod 16384`, using the XMODEM variant of CRC16. Each primary in the cluster owns a range of slots, and each primary has its own replicas for failover. With three shards, A owns slots 0 to 5,460, B owns 5,461 to 10,922 and C owns 10,923 to 16,383. The key `user:42` hashes to slot 15,880, so it lives on shard C. `order:123` lands in slot 15,115, also on C, and `user:42:cart` in slot 12,984, again C by coincidence.

@fig be_redis_cluster | Slots split three ways. A hash tag keeps a user's keys in one slot.

Clients are cluster-aware. They download the slot map, compute each key's slot and send the command straight to the right primary. If a client's map is out of date, the server answers `MOVED 15880 10.0.3.7:6379`, and the client updates its map and retries. During resharding, when a slot is moving between shards, the answer `ASK` redirects one command without changing the map. Moving slots between shards happens live, key by key, which is how a cluster grows from three shards to six without downtime.

Sharding brings a rule that changes how code is written. A command that touches several keys, `MGET`, a `MULTI` transaction, a Lua script, `SINTER`, works only if all its keys are in the same slot. Otherwise it fails with `CROSSSLOT`. **Hash tags** solve this. If a key contains `{...}`, only the part inside the braces is hashed. `{user:42}:cart` and `{user:42}:prefs` both hash `user:42` and land in slot 15,880, so a script can update a user's cart and preferences atomically. The cost is the risk of a hot slot, if too many keys share one tag.

Cluster has other limits. There is only one logical database, number 0. Pub/sub messages are broadcast to every node unless the sharded commands are used. And clients must handle redirects and topology changes, which most libraries do. A simpler alternative used by some teams is client-side sharding across independent Redis servers using consistent hashing, which gives up atomic multi-key operations entirely but needs no cluster protocol.

## 28. Redis as a backend primitive

Wren uses Redis for far more than caching, and so do most backends. Each use leans on a different structure and has a different tolerance for loss.

Sessions use a hash per session with a TTL equal to the idle timeout, refreshed on each request, as Unit III described. Losing them logs users out, so they live on a replicated instance with AOF. Rate limits use `INCR` with `EXPIRE` for fixed windows, sorted sets for sliding windows, or a Lua script for token buckets, all covered in Unit X. Losing a few seconds of counts is acceptable. Distributed locks use `SET key token NX PX ttl` and a script to release only one's own token, and Unit IX explains why a lock on asynchronously replicated Redis is a performance lock, not a correctness guarantee.

@fig be_redis_uses | Eight jobs for one server, each with its own structure and its own tolerance for loss.

Leaderboards use sorted sets. Queues use lists or streams, with the caveats from Part VI. Presence, "which couriers are online", uses a set or sorted set where each member's score is its last heartbeat, and a sweep removes members silent for more than 30 s. Counters, such as view counts or likes, use `INCR` with write-behind to the database. Unique counts use HyperLogLog. Feature flags and small configuration can live in hashes that every instance reads and caches locally.

The danger is one Redis doing all of these. A cache under memory pressure evicting session keys, a slow Lua script in the rate limiter blocking cache reads, a failover dropping locks and counters together. Wren splits by tolerance. One instance or cluster for pure cache, with eviction and no persistence. One replicated instance with persistence and `noeviction` for sessions, rate limits and locks. Streams that matter move to a proper broker when they outgrow Redis.

Redis is also not a database of record for most data. It keeps everything in memory, its replication is asynchronous, and its persistence can lose a second or more. Anything that would be a disaster to lose, orders, payments, account balances, lives in PostgreSQL, with Redis holding fast copies and short-lived state around it.

:::story Picture this
A busy restaurant's whiteboard by the pass. It holds today's specials, the table queue, which waiter is on break and a tally of desserts sold. It is fast, everyone can see it, and losing it would be annoying rather than ruinous, because the real bookings and the accounts are in the office. Nobody would keep the restaurant's payroll on the whiteboard.
:::

:::note Checking a slot yourself
`CLUSTER KEYSLOT user:42` returns 15880 on any cluster node. The CRC16 variant Redis uses gives 0x31C3 for the ASCII string "123456789", the standard check value for XMODEM, which is a quick way to confirm a client library uses the right one.
:::

:::warn Watch out
Moving from a single Redis to Cluster breaks code that uses multi-key commands, transactions or scripts across unrelated keys, and code that uses `SELECT` to switch databases. Audit those uses and add hash tags before migrating, not during the incident that forces the move.
:::

:::interview Interview lens
**"How does Redis Cluster distribute keys, and what changes for the application?"** Keys map to one of 16,384 hash slots by CRC16 modulo 16384, each primary owns a range of slots with its own replicas, and clients cache the slot map and follow MOVED and ASK redirects. Multi-key commands, transactions and scripts must stay within one slot, which hash tags such as `{user:42}` arrange, at the risk of hot slots. There is only database 0, and pub/sub should use the sharded commands. Replication within each shard is asynchronous, so failover can lose recent writes.
:::

:::key In one breath
Replicas receive an asynchronous stream of writes, so failover can drop recently acknowledged writes, and Sentinel's three watchers declare the primary down by quorum, promote the best replica and redirect clients, while `min-replicas-to-write` limits split-brain losses. Redis Cluster shards keys across 16,384 slots by CRC16 mod 16384, `user:42` landing in slot 15,880, with MOVED and ASK redirects and hash tags to keep multi-key operations in one slot. Backends use Redis for sessions, rate limits, locks, leaderboards, queues, presence and counters, which should be split by how much loss each can tolerate.
:::

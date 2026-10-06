@part V | Distributed locks | We build a lock that many processes on many machines can share, then break it in every way the real world allows. The one-line Redis lock is the right answer to an interview question only if you can explain why it is not enough. We will cover SET NX PX and ownership, leases, pauses and heartbeats, fencing tokens, Redlock and clocks, and consensus-based locks with the question of when not to lock at all. | where:5

## 12. A Redis lock: SET NX PX

Wren's nightly report job must not run on two instances at once. The simplest shared lock uses Redis.

```text
SET lock:report:9 a7f3 NX PX 30000
```

`NX` sets the key only if it does not exist, so only one client can succeed. `PX 30000` makes the key expire after 30,000 ms, so if the holder crashes, the lock frees itself instead of blocking everyone forever. The value `a7f3` is a random token unique to this holder, and it exists for one reason. When the holder finishes, it must release only its own lock.

@fig be_lock_setnx | Acquire with NX and an expiry, release with a script that checks the token first.

Releasing with a plain `DEL` is wrong. Suppose client A's job takes 35 s, longer than the 30 s expiry. At 30 s the key expires and client B acquires the lock with its own token. At 35 s, A finishes and runs `DEL lock:report:9`, deleting B's lock. Client C now acquires it too, and B and C run at the same time. The fix is to release with a short Lua script that deletes the key only if its value is still the holder's token, which runs atomically on Redis's single thread.

@fig be_lock_wrong_release | A's lease expired, B took the lock, and A's careless DEL let C in alongside B.

The token and the script make the lock **owned**. Only the holder can release it. That fixes careless releases, and it does not fix the deeper problem, which the same example already shows. A held the lock and kept working after it expired. For 5 s, from 30 s to 35 s, A and B both believed they held it. No release logic can prevent that, because the problem is that A did not know its lock had expired.

There is also the question of where Redis's own failures leave the lock. Redis replicates asynchronously, as Unit VII explained. If the primary acknowledges A's `SET` and crashes before replicating it, Sentinel promotes a replica that never saw the key, and B acquires the same lock. A single Redis instance's lock is therefore exactly as reliable as that instance, and a replicated one can be granted twice across a failover.

## 13. Leases, pauses and heartbeats

A lock with an expiry is really a **lease**, a grant of exclusive access for a limited time. Leases solve the crashed-holder problem, since a dead holder's lease simply runs out. They create a new problem, because the holder must know it still holds the lease when it acts, and it cannot.

The textbook failure is the **process pause**. Client A acquires a 30 s lease and starts writing the report. A stop-the-world garbage collection pause, a virtual machine being live-migrated, a laptop lid closing on a developer's test, or the operating system swapping the process out freezes A for 40 s. To A, no time has passed. It still believes it holds the lease. Meanwhile the lease expired at 30 s, B acquired it, and B wrote its version of the report. At 44 s A wakes, finishes its write, and overwrites B's work.

@fig be_lock_gc_pause | A pause longer than the lease. A wakes believing it holds a lock that B now holds.

Checking the lease before writing does not help, because the pause can happen between the check and the write. Network delays do the same thing, since a write sent before the lease expired can arrive after. Martin Kleppmann's 2016 essay "How to do distributed locking" made this argument famous, with almost exactly this example. Pauses of tens of seconds are rare but real, and over enough runs they happen.

Long jobs also need longer leases than they can predict. Wren's report usually takes 10 s and occasionally 2 minutes. A lease of 30 s expires during slow runs. A lease of 10 minutes leaves the job blocked for 10 minutes after a crash. The answer is a **heartbeat**, a background task that renews the lease periodically while the holder is alive, for example extending a 30 s lease every 10 s. Redisson's watchdog for Java does exactly this. If the holder crashes, renewals stop and the lease expires within 30 s. If it is slow but alive, it keeps the lease as long as it needs.

@fig be_lock_heartbeat | Renewals every 10 s keep a 30 s lease alive while the holder works. When renewals stop, it expires.

Heartbeats solve the crash case and the slow case. They do not solve the pause case, because a paused process cannot send heartbeats either, and when it wakes, it does not know they stopped. Some other mechanism must stop a stale holder from doing damage, and that is the fencing token.

## 14. Fencing tokens

A **fencing token** is a number, issued with each lock grant, that strictly increases every time the lock is granted. Client A gets token 33. When A's lease expires and B acquires the lock, B gets token 34. Every write to the protected resource carries the writer's token, and the resource, not the client, remembers the highest token it has seen and rejects any write with a lower one.

Replay the pause. A acquires the lock with token 33 and pauses. B acquires it with token 34 and writes to storage, which records 34 as the highest seen. A wakes and writes with token 33. Storage sees 33 < 34 and rejects the write. A's stale work does no damage, however long it slept.

@fig be_lock_fencing | B's write carries 34. A's late write carries 33 and is refused by the storage itself.

This works because the check happens at the only place that matters, the moment the resource is changed, and it needs no timing assumptions at all. Clocks can drift and processes can pause, and the token order still holds. Google's Chubby lock service, described in 2006, called these tokens sequencers and had resources check them for exactly this reason.

The cost is that the protected resource must cooperate. A database table can, with a column storing the last token and a conditional update, `UPDATE reports SET ..., fence = 34 WHERE id = 9 AND fence < 34`. Object storage with conditional writes can. An email provider cannot, and a third-party API usually cannot, unless it accepts an idempotency key that plays the same role. Where the resource cannot check tokens, the lock alone cannot guarantee safety, and the work must be idempotent instead.

Tokens must come from a source that never repeats or goes backwards. ZooKeeper's zxid and etcd's revision numbers are increasing by design, because they come from a consensus log. A Redis `INCR` on a counter key can produce tokens, but after a failover that loses the latest increments, it can issue a token that was already used, so it is only as safe as Redis's replication.

## 15. Redlock and the clock debate

**Redlock**, proposed by Salvatore Sanfilippo, Redis's creator, tries to make a Redis lock survive node failures without consensus. The client tries to acquire the same lock, with the same random token and a TTL, on 5 independent Redis masters, one after another with short timeouts. If it succeeds on a majority, at least 3, within a time well below the TTL, it holds the lock. Its **validity time** is the TTL minus the time spent acquiring and minus an allowance for clock drift between nodes. With a TTL of 10,000 ms, an acquisition that took 50 ms and a drift allowance of 1% of the TTL plus 2 ms, validity is 10,000 − 50 − 102 = 9,848 ms. If it fails to get a majority, it releases whatever it got.

@fig be_lock_redlock | Three of five nodes granted the lock within 50 ms, leaving 9,848 ms of validity.

Kleppmann's 2016 essay argued that Redlock is unsafe for correctness. It depends on timing assumptions, bounded network delay, bounded process pauses and clocks that advance at roughly the same rate, that real systems violate. A process pause, as in section 13, defeats it like any lease. And a clock jump breaks the majority itself. If node r3's clock jumps forward, perhaps from an NTP correction, its copy of A's lock expires early. B can then acquire r3, r4 and r5, a second majority, while A still holds r1, r2 and r3 in its own view. Redlock also produces no fencing token, so a stale holder cannot be stopped at the resource.

@fig be_lock_clock_jump | r3's clock jumps, A's key there expires early, and B assembles a second majority.

Sanfilippo replied in "Is Redlock safe?" the same year, arguing that the algorithm's assumptions are reasonable in practice, that monotonic clocks avoid jumps, and that the random token can serve for compare-and-set on the resource. The exchange is worth reading in full, and interviewers who mention Redlock usually want the conclusion most engineers draw from it.

That conclusion splits locks by purpose. An **efficiency lock** prevents duplicate work that is wasteful but harmless, such as two instances rebuilding the same cache entry. If it occasionally fails, something is done twice. A single Redis `SET NX PX` is fine, and Redlock adds cost for little benefit. A **correctness lock** prevents outcomes that are wrong, such as double payments or corrupted files. For those, a lease from a consensus system plus fencing tokens checked by the resource is the safe design, or better, restructuring so the lock is not needed.

## 16. Consensus locks, and when not to lock

Consensus systems give locks a firmer foundation. **ZooKeeper**, from Yahoo in 2008, and **etcd**, from CoreOS in 2013, replicate their state through consensus protocols, ZAB and Raft, so a write acknowledged by a majority survives any minority failure and never goes backwards. Clients hold **sessions** kept alive by heartbeats, and data can be tied to a session so it vanishes when the session ends.

The ZooKeeper lock recipe uses that. Each client creates an **ephemeral sequential node** under the lock path, `/locks/report-9/lock-0000000041`, and ZooKeeper appends an increasing number. The client with the lowest number holds the lock. Every other client watches only the node just before its own, so when a holder releases or its session dies and its node vanishes, exactly one waiter wakes, avoiding a thundering herd. The node's creation zxid serves as a fencing token. etcd offers the same through leases and revisions, and Kubernetes leader election uses Lease objects in etcd.

@fig be_lock_zk | The lowest sequence number holds the lock, and each waiter watches only its predecessor.

Consensus locks still face pauses, since a paused client's session can expire while it believes it holds the lock, so fencing tokens remain necessary for correctness. What consensus removes is the failover problem. A lock granted is never forgotten by a failover, and tokens never repeat.

Databases offer another option that many teams overlook. PostgreSQL **advisory locks**, from Unit VI, are locks on arbitrary numbers. `pg_try_advisory_lock(42)` succeeds for one session, and the lock is released automatically when the session ends or, with the transaction-scoped variant, when the transaction ends. If the protected work's data lives in the same database, the lock and the data share fate, and a transaction-scoped advisory lock is often all that is needed.

Most of the time, though, the best lock is no lock. Before adding one, ask the questions in order. Can the operation be made idempotent, so running it twice does no harm? Can a database constraint enforce the rule? Can one writer own each key, through partitioning? Is all the data in one database, where a row or advisory lock will do? Only efficiency at stake? Then a simple Redis lock is enough. Correctness at stake with external resources? Then a consensus lease with fencing tokens checked by the resource, and if the resource cannot check them, idempotency at the resource.

@fig be_lock_decide | Six questions, in order. Most designs stop before the last one.

Wren's report job ended up with two protections. A unique `job_runs` row per restaurant per night, from Unit VIII, decides which instance runs each report, and the email step uses the run id as an idempotency key with the provider. A lock was never needed.

:::story Picture this
A meeting room booked by a sign on the door that says "in use until 3 p.m.". If someone falls asleep inside past three, the next person walks in, and the sleeper wakes up and carries on talking over them. A fencing token is the receptionist issuing numbered tickets and refusing to connect any call from a ticket older than the newest one handed out.
:::

:::note Leader election is a lock
Electing a leader, one scheduler, one consumer of a singleton task, one primary database, is a lock held for a long time and renewed continuously. Every lesson in this part applies, including fencing. Databases fence old primaries with epochs and promotion terms, and Kafka fences zombie producers with epochs, Unit VIII.
:::

:::warn Watch out
A distributed lock without a fencing token cannot guarantee mutual exclusion, whatever system grants it, because a paused holder can act after its lease ends. If the protected resource cannot check a token, make the operation idempotent rather than trusting the lock.
:::

:::interview Interview lens
**"How do you implement a distributed lock, and is SET NX PX safe?"** `SET key token NX PX ttl` acquires a lock with an expiry, and a Lua script releases it only if the token matches, which gives ownership. It is not safe for correctness. Async replication can lose the lock on failover, and a holder that pauses longer than the TTL can act after another client acquires it. Renewing with heartbeats helps slow holders, not paused ones. For correctness, use a consensus system such as etcd or ZooKeeper for leases and have the resource reject writes with stale fencing tokens. Better still, avoid the lock with idempotency, constraints or a single writer.
:::

:::key In one breath
`SET key token NX PX 30000` gives a lock that expires if its holder crashes, and a token-checking Lua release stops one client deleting another's lock. Every expiring lock is a lease, and a holder paused for 40 s on a 30 s lease wakes up believing it still holds it, which heartbeats cannot fix. Fencing tokens that only increase, checked by the resource, reject the stale write, while Redlock's majority of 5 nodes depends on timing assumptions that pauses and clock jumps break. Use simple Redis locks for efficiency, consensus leases with fencing for correctness, and idempotency, constraints or single writers to avoid locks altogether.
:::

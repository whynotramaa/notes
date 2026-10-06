@part IV | Concurrency across instances | We leave the single process and find that its locks no longer help. Wren runs four to twenty identical instances, and the data they race over lives in shared stores. We will cover why in-process locks fail across a fleet and the lock-free strategies that work, and compare-and-swap on shared storage. | where:4

## 10. Why local locks stop working

Wren's withdrawal code had a mutex around the balance check, added after a race in testing. In production the race came back. The reason is structural. A mutex lives in one process's memory. App instance 1 holds its mutex, app instance 2 holds a different mutex in a different process on a different machine, and both read the balance of 100 from PostgreSQL at the same moment. Each lock was respected perfectly, and each guarded nothing the other could see.

@fig be_cc_multi_instance | Four instances, four separate mutexes. Two of them withdraw 80 each from the same balance.

Any state that more than one instance reads and writes needs coordination that all instances can see. **Distributed concurrency** is that coordination, and the most important design skill here is choosing the cheapest correct form of it. A distributed lock, Part V, is the most expensive and fragile, and good designs try everything else first.

The first option is to let the shared store do the work. Unit VI showed the forms. An atomic statement, `UPDATE accounts SET balance = balance - 80 WHERE id = 7 AND balance >= 80`, checks and writes in one step under the row lock, and 0 rows updated means insufficient funds. A row lock with `SELECT ... FOR UPDATE` serializes the read-check-write in a short transaction. A unique constraint makes duplicates impossible. A version column gives optimistic concurrency. All of these hold across any number of instances, because the database is the single place where the data lives.

The second option is a **single writer**. If all changes to one entity are made by one process, there is no race on that entity. Unit VIII's Kafka partitioning gives this for free. Key commands by account id, and every command for account 7 goes to one partition, processed in order by one consumer. No lock is needed, because there is never more than one writer for account 7 at a time. Actor systems such as Akka and Orleans make the same idea explicit, with each entity owned by one actor that processes its messages one at a time.

The third option is **idempotency**. If the race is between duplicate attempts at the same operation, such as two retries of one payment, an idempotency key with a unique constraint makes the second attempt return the first result. The race stops mattering.

Only when none of these fit, when the work spans several stores or external systems and must not run twice concurrently, is a distributed lock the right tool. Wren's nightly report job is the example the next part uses. It reads from many tables, writes files to object storage and sends emails, and two copies running at once would send every restaurant two reports.

## 11. Compare-and-swap on shared storage

Optimistic concurrency, compare-and-swap at the scale of a whole system, is available in almost every shared store, and it is often the best way to coordinate instances without a lock. The pattern is always the same. Read the item with its version, compute the change, write with a condition that the version is unchanged, and on failure read again and retry or report a conflict.

In SQL it is the version column of Unit VI, `UPDATE ... WHERE id = 123 AND version = 7`. In HTTP it is the ETag and `If-Match` header of Unit I, where a `PUT` with a stale ETag gets 412 Precondition Failed. Amazon S3 added conditional writes with `If-None-Match` in 2024 and `If-Match` soon after, so two instances can safely update the same configuration object. DynamoDB has condition expressions on every write. etcd and ZooKeeper offer compare-and-set on a key's revision. Redis has `WATCH` and Lua scripts, Unit VII.

@fig be_cc_conditional_write | Two instances write the same object. The one carrying the old ETag gets 412 and must reread.

Wren uses it for its feature flag configuration, a JSON document in object storage that several admin instances edit. Each admin reads the document with its ETag, applies a change, and writes with `If-Match`. If two admins edit at once, the second gets 412, rereads the document with the first admin's change included, reapplies its own change and writes again. Neither change is lost, and no lock was held at any point.

Conditional writes beat locks in three ways. Nothing is held while the client thinks, so a crashed or paused client blocks nobody. The check happens in the store, at the moment of the write, which is the only moment that matters, so a paused client that wakes up with stale data simply fails its write instead of corrupting anything. And there is no lock service to run.

Their limit is contention. As in Unit VI, the expected attempts per success is 1 ÷ (1 − p) for conflict probability p. For a hot item updated by many writers, retries pile up, and a single writer or a queue is better. They also apply to one item at a time. Keeping several items consistent needs a store with multi-item transactions, such as DynamoDB's `TransactWriteItems`, or one of the patterns from Unit VIII.

This conditional-write idea comes back in Part V in a sharper form. The fencing token, the fix for unsafe distributed locks, is a conditional write that checks a token instead of a version.

:::story Picture this
Four branch offices of one bank each keep a key to their own safe. A rule that "only one clerk may touch an account at a time" means nothing if each branch enforces it with its own key, because the account lives in head office. Either head office checks every withdrawal itself, or all requests for one account go to one branch, or each slip carries a serial number head office rejects if it has seen it before.
:::

:::note Single writer by design
Many high-throughput systems avoid locks entirely by giving each piece of state one owner. LMAX's trading exchange processed millions of orders per second on one thread, and Kafka Streams and Flink route each key to one task. Designing so that conflicts cannot happen is usually cheaper than detecting and resolving them.
:::

:::warn Watch out
A mutex, a `synchronized` block or an in-memory cache flag does not protect shared data once there is more than one instance, and tests with one instance will never show the bug. Assume every instance runs everything at the same time, and coordinate through the shared store.
:::

:::interview Interview lens
**"Your service runs on several instances. How do you prevent two of them from withdrawing from the same account at once?"** Not with an in-process lock, which only guards one instance. Let the database enforce it, with an atomic conditional update such as `balance = balance - 80 WHERE balance >= 80`, a short row lock, or a version column. Alternatively route all operations for an account to one partition or actor so there is a single writer, and use idempotency keys for retries. A distributed lock is the last resort, for work spanning several systems.
:::

:::key In one breath
An in-process mutex guards nothing across instances, because each instance has its own, so shared data needs coordination all instances see. The cheapest correct options come first. Let the database check and write atomically with conditional updates, row locks, constraints or version columns, give each entity a single writer through partitioning or actors, and make retries idempotent. Conditional writes, If-Match on HTTP and S3, conditions in DynamoDB and revisions in etcd, are compare-and-swap for the whole system, hold nothing while the client works, and fail safely when a client is stale.
:::

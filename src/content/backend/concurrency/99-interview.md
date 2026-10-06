@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Processes, threads and event loops

**Q1. Concurrency or parallelism?**

Concurrency is making progress on many tasks over the same period by interleaving them. Parallelism is running several at the same instant on different cores. Servers need concurrency to use waiting time and parallelism to use all cores.

**Q2. How many requests does an instance hold at once?**

By Little's law, arrival rate times mean latency. 500 requests per second at 50 ms is 25 in flight.

**Q3. Processes versus threads?**

Processes have separate memory and fail independently, at the cost of explicit communication. Threads share a process's memory, which makes communication cheap and shared-state bugs possible.

**Q4. What is the C10k problem?**

Serving 10,000 concurrent connections on one machine, which thread per request handles poorly because of per-thread stacks and scheduling. Non-blocking I/O with event loops, and later lightweight threads, solved it.

**Q5. How does an event loop work?**

Sockets are non-blocking, and one thread repeatedly asks the kernel with epoll or kqueue which are ready, runs their callbacks, and asks again. Each connection is a small state object, not a thread.

**Q6. What must never happen on an event loop?**

Blocking calls and long CPU work, because nothing else on that loop runs until they finish.

### Async code and pools

**Q7. How do callbacks, promises and async/await relate?**

Callbacks pass a continuation explicitly. Promises represent a future result that continuations attach to. Async/await is syntax over promises, compiled to coroutines that suspend at each await.

**Q8. What is a coroutine?**

A function that can pause at defined points and resume later with its local state intact, stored in a small heap object rather than a thread stack.

**Q9. What is the mistake in awaiting inside a loop?**

Independent calls run one after another. Use Promise.all or a task group to run them concurrently, with a concurrency limit to protect downstream services.

**Q10. How do you size a thread pool?**

Cores × (1 + wait ÷ compute). 8 cores with 10 ms of CPU and 40 ms of waiting per task needs 40 threads. Pure CPU pools need about one thread per core.

**Q11. Why must pool queues be bounded?**

An unbounded queue hides overload, grows memory and adds latency until the process dies. A bounded queue forces an early, visible decision to reject or block.

**Q12. What is event loop lag?**

The delay between when a timer should fire and when it does. Rising lag means CPU work or microtask chains are monopolizing the loop.

### Races in memory

**Q13. What is a race condition?**

A bug where the result depends on the timing of concurrent operations, typically a read-check-write sequence interleaved with another one on the same data.

**Q14. Why is count++ not safe?**

It is load, add and store. Two threads can load the same value and both store the same result, losing an increment.

**Q15. Mutex or semaphore?**

A mutex admits one holder for mutual exclusion. A semaphore admits up to N, for capping concurrency, such as 5 calls per instance to a partner API.

**Q16. What are the conditions for deadlock and how do you prevent it?**

Mutual exclusion, hold and wait, no preemption and circular wait. Prevent it by breaking one, most often by acquiring locks in a fixed global order, or by using timeouts on acquisition.

**Q17. What is compare-and-swap?**

An atomic instruction that writes a new value only if the current value equals an expected one. Read, compute and CAS in a retry loop gives lock-free updates.

**Q18. What is the ABA problem?**

A value changes from A to B and back to A, so a CAS that expected A succeeds although the state changed meanwhile. Version counters or garbage collection prevent it.

### Across instances

**Q19. Why does a mutex not protect a database row shared by four instances?**

Each instance has its own mutex in its own memory. Coordination must happen in the shared store or through a single writer.

**Q20. How do you coordinate instances without a lock?**

Atomic conditional updates, row locks, constraints or version columns in the database, a single writer per key through partitioning, idempotency keys, and conditional writes such as If-Match.

**Q21. What is a conditional write?**

A write that succeeds only if the stored version or ETag is unchanged, compare-and-swap at the storage level, as in SQL WHERE version, HTTP If-Match, S3 and DynamoDB conditions.

### Distributed locks

**Q22. What does SET key token NX PX ttl provide?**

An exclusive key set only if absent, expiring after the TTL so a crashed holder frees it, with a unique token so a Lua script can release only the holder's own lock.

**Q23. Why is that lock not safe for correctness?**

Asynchronous replication can lose it on failover, granting it twice, and a holder paused longer than the TTL resumes and acts after another client acquired it.

**Q24. What does a heartbeat or watchdog fix, and what does it not?**

It renews the lease while the holder is alive, so slow jobs keep it and crashed holders lose it quickly. It cannot help a paused holder, which sends no heartbeats and does not know it stopped.

**Q25. What is a fencing token?**

A number that increases with every lock grant, sent with each write and checked by the resource, which rejects tokens lower than the highest it has seen. It stops stale holders regardless of timing.

**Q26. What is Redlock and what is the criticism?**

Acquiring the lock on a majority of 5 independent Redis nodes within a validity time. Kleppmann argued it relies on bounded pauses, delays and clock behaviour, which real systems violate, and produces no fencing token.

**Q27. Efficiency lock or correctness lock?**

An efficiency lock prevents harmless duplicate work, and a simple Redis lock suffices. A correctness lock prevents wrong outcomes and needs a consensus-backed lease with fencing, or idempotency at the resource.

**Q28. How does a ZooKeeper lock work?**

Clients create ephemeral sequential nodes under a lock path. The lowest number holds the lock, each waiter watches its predecessor, and a dead session's node vanishes. The zxid can serve as a fencing token.

**Q29. When should you not use a distributed lock?**

When an idempotency key, a database constraint, a single writer per key, or a database row or advisory lock would do. Most designs avoid distributed locks entirely.

### Backpressure

**Q30. 50,000 requests per second arrive and 10,000 can be served. Where do the rest go?**

Without design, into memory, 80 MB per second at 2 KB each, until latency, retries and an out-of-memory crash. With design, into bounded queues for bounded time, back upstream through flow control, or refused early with 503 and Retry-After.

**Q31. What is flow control?**

Backpressure built into a protocol, such as TCP's receive window, HTTP/2 and gRPC stream windows, and Reactive Streams credits, which stop a sender when the receiver cannot keep up.

**Q32. What is load shedding?**

Deliberately refusing some work under overload so the rest completes, cheapest and least important traffic first, as early as possible in the request path.

**Q33. What is goodput?**

The rate of useful work completed. Without shedding it collapses past capacity, because the server works on requests that time out. With shedding it stays near capacity.

### Leaks

**Q34. What causes memory leaks in garbage-collected backends?**

Long-lived references to short-lived data, unbounded caches, global maps, listeners added per request, closures capturing large objects, uncleared timers and unconsumed streams.

**Q35. Memory grows, CPU is normal, GC is more frequent. What next?**

Confirm the live floor is rising, take two heap snapshots apart and diff them, follow the retainer path to the code, fix ownership or bound the cache, and alert on the trend.

**Q36. What is a file descriptor leak and how does it show?**

Sockets or files opened and never closed. The count climbs to the limit, then every open, connect or accept fails with EMFILE, while CPU and memory look fine.

**Q37. What is a goroutine leak?**

A goroutine blocked forever, usually on a channel send or receive that will never happen, holding its stack and references. Count goroutines and give every one a guaranteed exit.

### Runtimes

**Q38. Describe Node's event loop phases.**

Timers, pending callbacks, idle and prepare, poll for I/O, check for setImmediate and close callbacks, with the nextTick queue and then promise microtasks drained after every callback.

**Q39. What uses libuv's thread pool?**

File system operations, dns.lookup, asynchronous crypto such as pbkdf2 and scrypt, and zlib. It has 4 threads by default, configurable with UV_THREADPOOL_SIZE.

**Q40. How does Node use multiple cores?**

Multiple processes, through cluster or several containers, for request handling, and worker_threads for CPU-heavy JavaScript inside one process.

**Q41. How do Node streams apply backpressure?**

write() returns false when the buffer passes highWaterMark, and the producer should pause until drain. pipe and pipeline do it automatically.

**Q42. Explain Go's G-M-P model.**

Goroutines run on OS threads through GOMAXPROCS processors, each with a local run queue, with work stealing between them, a netpoller for network I/O and preemption of long loops.

**Q43. What do channels, select and context do?**

Channels pass values between goroutines, buffered ones acting as bounded queues. Select waits on several channel operations. Context carries deadlines and cancellation so work stops when the request ends.

**Q44. How does Go's GC decide when to run?**

GOGC sets the heap growth over the live set before the next collection, 100% by default, and GOMEMLIMIT adds a soft ceiling. Escape analysis keeps short-lived values on the stack.

**Q45. What is the GIL and how does Python scale?**

CPython's global interpreter lock lets one thread run bytecode at a time. I/O-bound threads still help, and servers scale with processes and asyncio. A free-threaded build is optional since 3.13.

### Primary sources

[Kleppmann, How to do distributed locking, 2016](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html). Pauses, clocks and fencing tokens.

[Sanfilippo, Is Redlock safe?, 2016](http://antirez.com/news/101). The reply.

[Burrows, The Chubby lock service, OSDI 2006](https://research.google/pubs/the-chubby-lock-service-for-loosely-coupled-distributed-systems/). Coarse-grained locks and sequencers.

[Node.js documentation, The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick). Phases, timers and nextTick.

[Go documentation, Effective Go and the Go memory model](https://go.dev/ref/mem). Goroutines, channels and happens-before.

[Kegel, The C10K problem, 1999](http://www.kegel.com/c10k.html). The original survey.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Runtimes and pools

**E1** ● An instance serves 800 requests per second at 30 ms each. How many are in flight?

**E2** ● Compare reserved stack memory for 50,000 connections with 1 MB threads and with 2 KB goroutines.

**E3** ● Tasks compute for 5 ms and wait for 95 ms on a 16-core machine. What thread pool size keeps the cores busy?

**E4** ● A Node process at 400 requests per second runs a 300 ms synchronous task. How many requests arrive while it blocks?

**E5** ● 5% of 1,000 requests per second each need 150 ms of CPU. How much CPU time per second do they need, and what does that mean for one event loop?

**E6** ● A partner allows 150 concurrent calls and Wren runs 12 instances. What per-instance semaphore keeps the fleet within the limit?

**E7** ● A Node process hashes passwords in 80 ms each on libuv's default pool. What is the maximum hash rate, and with 8 threads on 8 cores?

**E8** ● A Go service has 600 MB live. At what heap size does the next GC start with GOGC=100, and with GOGC=50?

### Locks and overload

**E9** ● Redlock with a TTL of 8,000 ms takes 120 ms to acquire a majority, with drift allowance 1% of the TTL plus 2 ms. What is the validity time?

**E10** ● A CAS loop conflicts with probability 0.2 per attempt. How many attempts per success are expected?

**E11** ● 30,000 excess requests per second of 4 KB each are buffered in memory. How fast does memory grow, and how long until a 6 GB heap is full?

**E12** ● An instance admits 300 concurrent requests that each take 75 ms. What is its maximum throughput?

**E13** ● A service leaks 2 descriptors per second. How long until it hits a limit of 1,024, and of 65,536?

**E14** ● 3% of 800 requests per second time out, and each timeout leaks one goroutine whose stack has grown to 8 KB. How many goroutines and how much stack memory leak per hour?

### Traces and explanations

**E15** ●● Trace two concurrent withdrawals of 80 from a balance of 100 and give three fixes that work across instances.

**E16** ●● Two goroutines lock mutexes A then B and B then A. Show the deadlock and fix it.

**E17** ●● Explain the ABA problem with a lock-free stack and give two fixes.

**E18** ●● Trace how releasing a Redis lock with plain DEL lets two clients hold it at once.

**E19** ●● Trace a GC pause defeating a 30 s lease, then show how a fencing token stops the damage.

**E20** ●● Give the print order of: `setTimeout(a, 0); Promise.resolve().then(b); process.nextTick(c); queueMicrotask(d); console.log(e)`.

**E21** ●● A Go handler starts a goroutine that sends a result on an unbuffered channel and selects on that channel and ctx.Done(). Explain the leak and fix it.

**E22** ●● Choose a concurrency strategy for each: decrementing stock; ensuring one nightly report per restaurant; updating a shared JSON config in object storage; processing all commands for one account in order.

**E23** ●● Design priority-based load shedding for Wren's API.

**E24** ●● Write an investigation plan for a Node service whose memory grows 200 MB per day.

### Code and design

**E25** ●●● Write pseudocode for a Redis lock with token, renewal and safe release, and explain why the protected write still needs a fencing token.

**E26** ●●● Design a bounded pipeline in Go that reads jobs, processes them with 8 workers and writes results, with backpressure and cancellation.

**E27** ●●● Prove that acquiring locks in a single global order prevents deadlock.

**E28** ●●● Design adaptive admission control that keeps p99 latency under 200 ms.

**E29** ●●● Design leader election for a scheduler on etcd, including lease renewal, fencing and failover.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 800 × 0.03 = 24 requests in flight.

**E2.** 50,000 × 1 MB ≈ 48.8 GB of reserved stack for threads, against 50,000 × 2 KB ≈ 97.7 MB for goroutines.

**E3.** 16 × (1 + 95 ÷ 5) = 16 × 20 = 320 threads.

**E4.** 400 × 0.3 = 120 requests arrive and wait.

**E5.** 50 requests per second × 0.15 s = 7.5 s of CPU per second. One event loop has 1 s per second, so it saturates and latency grows without bound. At least 8 cores' worth of workers or processes are needed for that work alone.

**E6.** 150 ÷ 12 = 12.5, so 12 permits per instance, 144 in total, leaving a small margin.

**E7.** With 4 threads, 4 ÷ 0.08 = 50 hashes per second. With 8 threads on 8 cores, 100 per second, if nothing else needs the pool.

**E8.** With GOGC=100, at about 1,200 MB. With GOGC=50, at about 600 × 1.5 = 900 MB, collecting more often for a smaller heap.

**E9.** 8,000 − 120 − (80 + 2) = 7,798 ms.

**E10.** 1 ÷ (1 − 0.2) = 1.25 attempts.

**E11.** 30,000 × 4,000 = 120 MB per second, so a 6 GB heap fills in 6,000 ÷ 120 = 50 s.

**E12.** 300 ÷ 0.075 = 4,000 requests per second.

**E13.** 1,024 ÷ 2 = 512 s, under 9 minutes. 65,536 ÷ 2 = 32,768 s, about 9.1 hours.

**E14.** 0.03 × 800 = 24 leaks per second, 86,400 goroutines per hour, holding about 86,400 × 8 KB ≈ 691 MB of stack per hour plus whatever they reference.

**E15.** A reads 100, B reads 100, both check 100 ≥ 80, both write 20, and 160 is paid out. Fixes that hold across instances: an atomic statement `UPDATE accounts SET balance = balance - 80 WHERE id = 7 AND balance >= 80` that checks and writes under the row lock, a short transaction with `SELECT ... FOR UPDATE`, or a version column with a conditional update. Routing all withdrawals for an account to one partition with a single consumer also works.

**E16.** Goroutine 1 holds A and waits for B. Goroutine 2 holds B and waits for A. Neither proceeds. Fix it by always locking A before B in both, so whichever gets A first also gets B, and the other waits on A without holding anything.

**E17.** Thread 1 reads top = A with next = B and prepares CAS(top, A, B). It pauses. Thread 2 pops A, pops B, frees B, and pushes A back, so top = A with next = C. Thread 1's CAS succeeds because top is A, and sets top to B, a freed node. Fix it with a tagged pointer, a version counter beside the pointer that every update increments so the CAS compares both, or with memory reclamation such as garbage collection or hazard pointers that stops A and B from being reused while referenced.

**E18.** A acquires with a 30 s expiry and runs for 35 s. At 30 s the key expires and B acquires it. At 35 s A finishes and runs DEL, deleting B's key. C acquires immediately, and B and C both run. Releasing with a script that deletes only if the stored value equals the caller's token makes A's release a no-op.

**E19.** A acquires a 30 s lease with token 33 and pauses for 40 s. At 30 s the lease expires and B acquires it with token 34, writing to storage, which records 34. At 40 s A wakes and writes with token 33. Storage compares 33 with the highest seen, 34, and rejects the write. Without the token check, A would overwrite B's data.

**E20.** e first, synchronous. Then c, from the nextTick queue. Then b and d, in the order they were queued, since both are promise-queue microtasks, so b then d. Then a, the timer. Output: e, c, b, d, a.

**E21.** When ctx.Done() wins the select, the handler returns and nobody will receive from the channel. The goroutine's send blocks forever, leaking it and everything it references, one per timed-out request. Make the channel buffered with capacity 1 so the send always completes, or have the goroutine select on ctx.Done() as well when sending.

**E22.** Stock: an atomic conditional UPDATE with a CHECK constraint. Nightly report: a unique run row per restaurant and date, with idempotent email sending. Shared JSON config: conditional writes with If-Match and retry on 412. Commands for one account in order: partition by account id so one consumer processes them sequentially.

**E23.** The gateway assigns a priority header per route: checkout and payment critical, order tracking high, browsing medium, recommendations, prefetch and analytics low. Each instance has an adaptive concurrency limit. When in-flight requests exceed 70% of the limit, reject low-priority requests with 503 and Retry-After. Above 85%, also medium. Above 95%, also high. Critical is only rejected at the hard limit. Requests that have queued more than 100 ms are dropped before processing. Clients back off with jitter, and the gateway sheds even earlier for clients over their rate limit.

**E24.** Plot heap used after GC and resident memory over days, to confirm a rising floor and to see whether growth is in the V8 heap or outside it. Correlate growth with traffic or with specific events such as deploys or a cron job. On one instance out of rotation, take a heap snapshot, replay traffic for an hour, take another, and compare by retained size and object count. Follow retainer paths for growing objects to the owning module. Check listener counts, timers, open handles with `process.getActiveResourcesInfo()`, and descriptor counts. If resident memory grows but the heap does not, inspect Buffers and native modules. Fix ownership, add a bounded cache or cleanup, and add an alert on the heap floor's weekly slope.

**E25.** One version:

```text
acquire(key, ttl = 30 s):
  token = random_128_bits()
  if redis.set(key, token, NX, PX = ttl): start_renewal(key, token, every = ttl / 3)
                                          return token
  return None

renew(key, token, ttl):     # Lua, atomic
  if GET(key) == token then return PEXPIRE(key, ttl) else return 0
  # a 0 result means the lease was lost: stop work immediately

release(key, token):        # Lua, atomic
  if GET(key) == token then return DEL(key) else return 0
```

Even so, a pause longer than the remaining lease lets the holder act after another client took the lock, and a Redis failover can grant it twice. The protected write must therefore carry a fencing token, such as an increasing number from etcd or a database sequence issued with the lock, and the resource must reject writes with a token lower than the highest it has seen, or the operation must be idempotent.

**E26.** A reader goroutine reads jobs and sends them on `jobs := make(chan Job, 100)`, a bounded buffer, so it blocks when workers fall behind. Eight worker goroutines loop with `select { case j, ok := <-jobs: if !ok { return }; r := process(ctx, j); select { case results <- r: case <-ctx.Done(): return }; case <-ctx.Done(): return }`. A writer goroutine reads from `results := make(chan Result, 100)` and writes to storage. An errgroup with a shared context runs them all, so the first error cancels the others. The reader closes jobs when input ends, the workers finish and a WaitGroup closes results, and the writer then ends. Backpressure flows from the writer to the workers to the reader through the bounded channels, and cancellation stops everything through the context.

**E27.** Number all locks with a total order. Every thread acquires the locks it needs in increasing order. Suppose a deadlock exists. Then there is a cycle of threads T1, …, Tk where each Ti holds lock Li and waits for L(i+1), and Tk waits for L1. Since Ti holds Li and requests L(i+1) later, the order rule gives Li < L(i+1) for every i, so L1 < L2 < … < Lk < L1, a contradiction. So no cycle of waiting can form, and circular wait, a necessary condition for deadlock, never holds.

**E28.** Track a concurrency limit L per instance, starting at a safe value such as 100. Measure latency of admitted requests over short windows. If p99 stays below a target of about 150 ms, raise L by a small additive step. If it rises above 200 ms, cut L by a multiplicative factor such as 0.8, similar to TCP's congestion control and Netflix's gradient limiter. Admit a request only if in-flight is below L, otherwise reject with 503 and Retry-After, lowest priority first as in E23. Drop requests that have queued longer than 50 ms. Export L, in-flight, rejections and latency so operators can see the limiter at work, and clamp L between a minimum and maximum.

**E29.** Every scheduler instance creates an etcd lease with a 15 s TTL and keeps it alive with KeepAlive. Each tries to create the key `/wren/scheduler/leader` with its id, attached to its lease, inside a transaction that succeeds only if the key does not exist, which etcd's election API wraps. The winner is leader, and the key's creation revision is its fencing token. Followers watch the key. If the leader dies or its keepalives stop, the lease expires, the key is deleted, and a follower's transaction succeeds, giving a higher revision. The leader includes its revision in every job it enqueues and every write it makes, and the job table or downstream store rejects writes from lower revisions. On losing its lease or failing a keepalive, a leader stops scheduling immediately. Failover takes up to the 15 s TTL, during which no new jobs are scheduled, and duplicate scheduling is prevented by fencing plus idempotent job ids.

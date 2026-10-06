@part III | Race conditions in memory | We look at what goes wrong when two threads touch the same data, and at the tools that make them take turns. The bugs are rare, timing-dependent and maddening to reproduce, so they must be prevented by design. We will cover race conditions and critical sections, mutexes, semaphores and deadlock, and atomic operations with compare-and-swap. | where:3

## 7. Race conditions and critical sections

A **race condition** is a bug where the result depends on the timing of concurrent operations. The syllabus's example is the canonical one. An account holds 100. Two withdrawal requests of 80 arrive at the same moment. Each reads the balance, sees 100, checks that 100 ≥ 80, and writes 100 − 80 = 20. Both succeed. The bank has paid out 160 from an account that held 100, and the balance says 20.

@fig be_cc_balance_race | Both requests passed the check before either wrote. 160 left an account holding 100.

The bug is not in any single line. Each request's code is correct alone. It is in the gap between reading and writing, during which the value it read can change. A sequence of steps that must not be interleaved with another thread's steps on the same data is a **critical section**, and making sure only one thread is inside it at a time is called **mutual exclusion**.

Races exist even inside a single expression. `count++` looks atomic and is three machine operations, load the value from memory into a register, add one, store it back. Two threads that interleave those steps, both loading 41, both adding, both storing 42, lose an increment. Run two threads that each increment a shared counter a million times and the final value is often well short of 2,000,000. The exact shortfall changes from run to run, which is the signature of a race.

@fig be_cc_counter_race | Both threads loaded 41. Both stored 42. One increment vanished.

A subtler class is **check-then-act**. Code checks a condition and acts on it, `if not exists(file): create(file)`, `if user not in cache: cache[user] = load(user)`, `if seats_left > 0: book()`. Between the check and the act, another thread can change the condition. The fix is always the same in spirit. Make the check and the act one indivisible step, either by holding a lock across both or by using an operation that does both at once.

Some runtimes reduce the surface. Node runs JavaScript on one thread, so there are no data races in JavaScript memory, but there are still races across `await` points, since another request's callback can run while yours is suspended. Python's GIL makes single bytecode operations atomic but not `count += 1`, which is several. Go and Java have true shared-memory parallelism, and Go's race detector, `go test -race`, finds many races at test time.

Races in memory are only half the story for a backend. The balance lives in a database, read and written by four instances, and Unit VI already handled that version with row locks, atomic updates and versions. This part is about races inside one process, and Part IV crosses to the shared world.

## 8. Mutexes, semaphores and deadlock

A **mutex**, short for mutual exclusion lock, lets one thread at a time hold it. A thread calls `lock()` before the critical section and `unlock()` after. Any other thread calling `lock()` meanwhile waits. Wren's in-memory rate limiter, a map from user id to counters, is guarded by a mutex so that two requests from the same user cannot both read and update a counter at once.

@fig be_cc_mutex | One key to one room. The holder does the read, check and write, and everyone else waits at the door.

Mutexes have rules that keep them safe. Hold them briefly, only around the shared data's read and write, never around I/O such as a database call or an HTTP request. Release them on every path, including exceptions, with `defer mu.Unlock()` in Go, `with lock:` in Python or `try`/`finally` in Java. And keep shared mutable state small, since every piece of it needs a lock and every lock is a chance to get it wrong. A **read-write lock** allows many readers or one writer, which helps when reads far outnumber writes.

A **semaphore**, defined by Edsger Dijkstra in the 1960s, generalizes the mutex to N holders. It holds a count of permits. Acquiring takes a permit or waits if none are left, and releasing returns one. Wren's kitchen partner allows 100 concurrent API calls in total. With 20 instances, each instance holds a semaphore of 5 permits around its kitchen calls, so the fleet never exceeds 100. Connection pools are semaphores over connections, and `p-limit` is a semaphore over promises.

@fig be_cc_semaphore | Five spaces in the car park. The barrier lets a car in only when one leaves.

With more than one lock comes **deadlock**, where threads each hold a lock and wait for another's, forever. Dijkstra's **dining philosophers** problem from 1965 pictures it. Five philosophers sit at a round table with one fork between each pair, and each needs both neighbouring forks to eat. If all pick up their left fork at the same moment, each waits for a right fork that its neighbour holds, and nobody ever eats.

@fig be_cc_philosophers | Five philosophers, five forks, each holding one and waiting for the next. Nobody eats.

Edward Coffman and colleagues identified in 1971 four conditions that must all hold for deadlock. Resources are held exclusively, threads hold some while waiting for others, resources cannot be taken away, and there is a circular chain of waiting. Breaking any one prevents it. The practical fix is **lock ordering**. Number the locks and always acquire them in increasing order, so the circle cannot form, exactly the advice Unit VI gave for row locks. Timeouts on lock acquisition, `tryLock` with a deadline, turn a permanent deadlock into a recoverable error.

## 9. Atomic operations and compare-and-swap

Locks make a thread wait. For simple updates, CPUs offer a cheaper tool. An **atomic operation** completes as one indivisible step that other cores cannot observe half done. Atomic increment, `atomic.AddInt64` in Go or `AtomicLong.incrementAndGet` in Java, fixes the counter race from section 7 without any lock. On x86 it compiles to a single instruction with a `LOCK` prefix that holds the cache line exclusively for the duration.

The most general atomic is **compare-and-swap**, CAS. It takes an address, an expected value and a new value, and writes the new value only if the current value equals the expected one, reporting whether it did. To increment with CAS, a thread reads 7, computes 8, and asks "set to 8 if still 7". If another thread changed it to 9 in the meantime, the CAS fails, and the thread reads 9, computes 10 and tries again. This read-compute-CAS-retry loop is the building block of **lock-free** data structures, which never block a thread.

@fig be_cc_cas | Read 7, compute 8, CAS fails because the value is now 9, so read again and retry.

CAS is the same idea as the version column in Unit VI and the `WATCH` in Unit VII's Redis transactions. Read a version, compute, write only if the version is unchanged, retry on conflict. Optimistic concurrency at every scale, from a CPU cache line to a database row to an S3 object, follows this pattern.

CAS has one famous trap, the **ABA problem**. A thread reads A, gets paused, and meanwhile another thread changes the value to B and back to A. The CAS succeeds, because the value is A again, but the world has changed. In a lock-free stack, A might be a node that was popped, freed and pushed back, and the paused thread's CAS links in a node that no longer means what it thought. The fixes are to pair the value with a version counter that only increases, so A-version-1 differs from A-version-3, or to rely on a garbage collector that cannot reuse A's memory while a thread still references it.

@fig be_cc_aba | The top of the stack is A again, but it is not the same A, and the CAS cannot tell.

Atomics also bring **memory visibility**. Without synchronization, a write by one core may sit in its cache and not be visible to another core for a while, and compilers and CPUs may reorder operations. Every language defines a memory model, Java's since 2004 and C++'s since 2011, in which locks and atomics create **happens-before** relationships that guarantee visibility. Code that shares variables between threads without either is broken even if it seems to work, and usually breaks on a different CPU or under load.

For application developers the guidance is short. Prefer not sharing mutable state at all. When you must, use the language's concurrent collections and atomics. Reach for raw locks next, and write lock-free structures almost never.

:::story Picture this
A shared office whiteboard listing who has the meeting room. Two colleagues both look, see it free, and both write their names, and two meetings arrive at one room. A mutex is a single key hanging by the door. A semaphore is a rack of five keys for five rooms. Compare-and-swap is writing your name only if the board still shows the version you just read, and rubbing it out and rereading if not.
:::

:::note Go's advice
Go's documentation puts it as "do not communicate by sharing memory; instead, share memory by communicating". Instead of guarding a map with a mutex, give one goroutine ownership of the map and send it requests through a channel. One owner means no race, and Part IX shows the pattern. Mutexes remain fine for small, simple critical sections.
:::

:::warn Watch out
Holding a mutex while doing I/O turns a microsecond critical section into a millisecond one, and every other thread queues behind the slowest network call. Copy what you need inside the lock, release it, then do the I/O.
:::

:::interview Interview lens
**"Two threads increment a shared counter a million times each and the result is less than two million. Why, and how do you fix it?"** Increment is load, add and store. Two threads can both load the same value and both store the same result, losing an increment. Fix it with an atomic increment, which the CPU performs indivisibly, or a mutex around the increment. More generally, any read-check-write on shared data is a critical section and needs mutual exclusion or a compare-and-swap loop, with locks acquired in a fixed order to avoid deadlock.
:::

:::key In one breath
A race condition lets timing decide the result, as when two withdrawals of 80 both see a balance of 100, or when `count++`, really load, add and store, loses increments. Critical sections need mutual exclusion through mutexes held briefly and never across I/O, semaphores cap concurrency at N such as 5 kitchen calls per instance, and deadlocks are prevented by acquiring locks in a fixed order. Atomics and compare-and-swap update shared values without locks through read-compute-CAS-retry loops, with version counters against the ABA problem.
:::

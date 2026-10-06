@part VII | Memory and resource leaks | We hunt the slow failures, where something is acquired on every request and released on none. Leaks rarely crash a service on the day they ship, which is exactly why they reach production. We will cover the common sources of memory leaks, descriptor, connection and goroutine leaks, and how to investigate a heap that keeps growing. | where:7

## 20. Where backend memory leaks come from

In a garbage-collected language, a **memory leak** is memory that the program no longer needs but still references, so the collector cannot free it. The program is not forgetting to free memory. It is remembering things it should have forgotten. Almost every backend leak is a reference held by something that lives for the whole process, a module-level variable, a singleton, a long-lived object, accumulating entries for things that live for one request.

The most common source is an **unbounded cache**. Wren's first session lookup cached user objects in a module-level `Map` keyed by user id, with no size limit and no expiry. Every user who logged in added an entry of about 1 KB, and nothing removed them. After a million distinct users the map held about 1 GB. The fix is a bounded cache with eviction, the LRU from Unit VII, or no in-process cache at all for per-user data.

@fig be_leak_sources | Six common places where memory goes in and never comes out.

Close relatives of the cache are **global registries**, maps from request ids to callbacks, from user ids to WebSocket connections, from job ids to progress objects, where entries are added on the way in and the removal on the way out is skipped on some error path. **Event listeners** leak the same way. Code that adds a listener to a long-lived emitter on every request, `db.on('error', handler)`, and never removes it keeps every handler and everything the handler references. Node prints `MaxListenersExceededWarning` after 10 listeners on one event, a warning worth treating as an error.

**Closures** capture variables from their surrounding scope, so a small callback stored for later can keep a large request object alive, including its body buffer. **Timers** created with `setInterval` and never cleared keep their callbacks and everything those reference forever. **Buffers and streams** that are opened and never consumed or closed hold their data and their underlying resources.

The pattern behind all of them is ownership. Something long-lived takes a reference to something short-lived, and nobody is responsible for giving it back. Unit V's rule that the code which acquires a resource releases it applies to memory references as much as to connections.

## 21. Descriptor, connection and goroutine leaks

Memory is not the only resource that leaks, and the others often fail faster and more confusingly. Every open socket, file and pipe uses a **file descriptor**, and each process has a limit, set by `ulimit -n`, often 1,024 by default and raised to 65,536 for servers. Code that opens a connection to the email provider and forgets to close the response body on an error path leaks one descriptor per failure. At 5 failures per second, the process reaches 65,536 descriptors in 65,536 ÷ 5 = 13,107 s, about 3.6 hours. Then every attempt to open a socket, file or connection fails with `EMFILE: too many open files`, including accepting new client connections, and the service stops responding while CPU and memory look normal.

@fig be_leak_fd | A leaked socket per failure climbs steadily to the descriptor limit, then everything that opens a file fails.

The fix is the ownership discipline again. In Go, `defer resp.Body.Close()` immediately after checking the error from an HTTP call, on every path. In Node, consume or destroy every response stream. In Java and Python, try-with-resources and `with` blocks. The count is easy to watch, from `/proc/<pid>/fd` or the runtime's metrics, and Wren alerts when it passes half the limit.

**Database connection leaks** are a special case that Unit VI met. A connection borrowed from the pool and never returned shrinks the pool by one, and once all are leaked, every request waits for the pool timeout and fails. Pool leak detection, which logs a stack trace for connections held longer than a threshold, points straight at the guilty code.

**Goroutine and thread leaks** are the concurrent version. A goroutine started to do some work blocks forever, waiting on a channel nobody will send to or receive from, or on a network call with no timeout. It holds its stack, at least 2 KB, plus everything it references. One per request at 500 requests per second is 1.8 million goroutines an hour. Go exposes the count through `runtime.NumGoroutine()` and the goroutine profile in pprof, Part IX shows a classic example. Threads leaked in Java pools or Python executors behave the same way, with much larger stacks.

Sockets in `CLOSE_WAIT` state are a telltale sign of a leak on the receiving side. The remote end closed the connection, and the local application never called `close()`. A growing count in `ss -s` or `netstat` output means some code path is not closing its connections.

## 22. Investigating a growing heap

The syllabus describes the classic signature. Memory grows continuously, CPU is normal, and garbage collection runs more and more often. A healthy service's heap follows a sawtooth. It rises as requests allocate and drops at each collection back to roughly the same floor, the live data. A leaking service's floor rises. Each collection frees less, because more of the heap is reachable, so collections come more often and accomplish less, and eventually the process spends most of its time collecting, or runs out of memory and is killed.

@fig be_leak_sawtooth | Illustrative. A healthy sawtooth returns to the same floor. A leak raises the floor until there is no room left.

The first step is to confirm it is a leak and not a working set that is legitimately larger, such as a cache warming up to its configured size. A leak keeps growing in proportion to traffic or time and never plateaus. Comparing memory after the same traffic on two days, or forcing a full collection and checking whether the floor returns, separates the two.

The second step is to find what is retaining the memory. The most effective technique is to take two **heap snapshots** some time apart and compare them. Most of the heap will be the same in both. The objects whose count and retained size grew between the snapshots are the leak, and the **retainer path**, the chain of references from a garbage collection root to those objects, names the culprit. For Wren, the diff showed a `Map` called `sessionCache` that had grown by 412 MB in 30 minutes, retained by a module-level variable.

@fig be_leak_heap_diff | Two snapshots half an hour apart. The growth is concentrated in one map.

The tools depend on the runtime. Node uses Chrome DevTools heap snapshots, taken with `--inspect` or the `v8.writeHeapSnapshot()` API, and `--heapsnapshot-near-heap-limit` to capture one automatically before an out-of-memory crash. Go uses pprof's heap profile, `go tool pprof -base old.pb.gz new.pb.gz` to diff two profiles, and the goroutine profile for goroutine leaks. The JVM uses `jcmd GC.heap_dump` and Eclipse MAT's dominator tree. Python has `tracemalloc`, which compares snapshots by allocation site.

Heap snapshots pause the process and can be large, so take them on one instance taken out of the load balancer or in a staging environment that reproduces the traffic. **Allocation profiling**, which samples where memory is allocated rather than what is retained, is cheap enough for production and helps when the leak is a high allocation rate rather than retention.

Memory outside the managed heap complicates things. Node's `Buffer` data, native addons, Go's cgo allocations and JVM direct buffers do not show in heap snapshots. If the process's resident memory grows while the heap does not, look at off-heap usage, and at the allocator itself, since fragmentation in glibc's malloc can make freed memory look used, which switching to jemalloc or tuning arenas sometimes fixes.

:::story Picture this
A hotel cloakroom where the attendant hands out a ticket for every coat but never asks for tickets back when guests leave. Each night a few coats stay on the rails, owned by nobody. For weeks nothing seems wrong. Then one Saturday the rails are full, and nobody can check a coat at all. Finding the problem means walking the rails and asking which ticket each coat belongs to.
:::

:::note Container memory limits
In Kubernetes, a container that exceeds its memory limit is killed with exit code 137, OOMKilled, without any graceful shutdown. Runtimes must know the limit. Go's `GOMEMLIMIT`, Node's `--max-old-space-size` and the JVM's container awareness let the runtime collect harder near the limit rather than be killed by the kernel.
:::

:::warn Watch out
Restarting instances on a schedule to "fix" a leak hides it while it grows. Traffic grows, the time to exhaustion shortens, and one day the restart interval is longer than the time to the next crash. Use restarts as a stopgap while the heap diff finds the cause.
:::

:::interview Interview lens
**"Memory keeps growing, CPU is normal, and garbage collection is getting more frequent. What do you do?"** It looks like a leak, the live set is rising so each collection frees less. Confirm it grows with time or traffic and does not plateau. Take two heap snapshots apart and diff them to find which objects and retainers grew, then follow the retainer path to the code, commonly an unbounded cache, a global map, listeners added per request, uncleared timers or unclosed streams. Check descriptors, connections and goroutine counts too. Fix ownership, bound caches, and alert on the trend.
:::

:::key In one breath
Backend memory leaks are references kept by long-lived objects to short-lived things, most often unbounded caches like a per-user map reaching 1 GB after a million users, global registries, listeners, closures, timers and unclosed streams. Descriptor leaks hit the limit and fail with EMFILE, 65,536 descriptors lasting about 3.6 hours at 5 leaks per second, and connection and goroutine leaks behave the same way. A leak shows as a rising floor under the GC sawtooth, and diffing two heap snapshots, with pprof, DevTools or MAT, finds the retainer to fix.
:::

@part IX | Go and other runtimes | We open the Go runtime, the syllabus's second example, and compare it briefly with the JVM and Python. Go hides the event loop behind ordinary blocking code, and knowing how it does that explains its behaviour under load. We will cover goroutines and the G-M-P scheduler, channels, select, context and synchronization, and garbage collection with a comparison of runtimes. | where:9

## 26. Goroutines and the G-M-P scheduler

A **goroutine** is a function running concurrently with others, started with the `go` keyword. It is not an operating system thread. A goroutine starts with a 2 KB stack that grows and shrinks as needed, and creating one costs about a microsecond. A Go server typically starts one goroutine per connection or request, and running 100,000 of them is routine.

Go's runtime schedules goroutines onto threads with the **G-M-P model**, introduced by Dmitry Vyukov in Go 1.1 in 2013. **G** is a goroutine. **M** is a machine, an operating system thread. **P** is a processor, a scheduling context that an M must hold to run Go code. There are `GOMAXPROCS` Ps, by default the number of cores, and since Go 1.25 also aware of container CPU limits. Each P has a local run queue of runnable goroutines, and an M with a P takes goroutines from that queue and runs them.

@fig be_go_gmp | Four Ps with their own queues, each driving one thread. An idle P steals work from a busy one.

When a P's queue runs empty, it looks in a global queue, then steals half of another P's queue, which keeps all cores busy without a central lock. When a goroutine makes a blocking system call, its M blocks with it, and the P is handed to another M, so other goroutines keep running. When a goroutine does network I/O, it does not block an M at all. The runtime's **netpoller**, built on epoll or kqueue, parks the goroutine and wakes it when the socket is ready. Code reads like blocking code, `n, err := conn.Read(buf)`, and runs like an event loop.

Since Go 1.14 in 2020, the scheduler can **preempt** a goroutine that runs a long loop without function calls, by sending its thread a signal. Before that, such a loop could hog its P indefinitely. CPU-heavy goroutines therefore share cores fairly, but they still occupy them. A Go server is not stalled by one CPU-heavy request the way a Node server is, but it still has only `GOMAXPROCS` cores to give.

The practical consequences are a few. Start goroutines freely, and make sure each one can finish, section 27. Set `GOMAXPROCS` to the CPUs actually available, which older Go versions in containers got wrong, so a process limited to 2 CPUs ran 64 Ps on a 64-core host and was throttled. The `automaxprocs` library fixed that before the runtime did.

## 27. Channels, select, context and synchronization

Go's preferred way to coordinate goroutines is the **channel**, a typed pipe. One goroutine sends with `ch <- v` and another receives with `v := <-ch`. An **unbuffered channel** makes the sender wait until a receiver takes the value, a handoff. A **buffered channel**, `make(chan Job, 100)`, lets up to 100 values wait, and the sender blocks only when it is full, which is a bounded queue with backpressure built in. Closing a channel tells receivers no more values will come.

**select** waits on several channel operations at once and proceeds with whichever is ready first. Combined with **context**, Go's standard way to carry deadlines and cancellation through a call chain, it gives the shape of almost every Go worker. A `context.Context` created at the edge of a request with a 300 ms deadline is passed to every function and every outgoing call. When the deadline passes or the client disconnects, `ctx.Done()` closes, and every goroutine selecting on it stops its work. That is how a cancelled request stops its database queries and downstream calls rather than finishing work nobody will read.

@fig be_go_channels | A worker selects between the next job and the context's Done channel, and stops when told.

The `sync` package provides the classic tools for shared memory. `sync.Mutex` and `sync.RWMutex` guard critical sections, Part III. `sync.WaitGroup` waits for a group of goroutines to finish, with `Add`, `Done` and `Wait`. `sync.Once` runs initialization exactly once. The `errgroup` package combines a WaitGroup with context cancellation and the first error, which is the standard way to run several calls in parallel and fail fast.

The classic Go leak is a goroutine blocked forever on a channel. A request handler starts a goroutine to make a slow call and send the result on an unbuffered channel, then waits in a `select` for either the result or the context's deadline. When the deadline wins, the handler returns. The goroutine finishes its slow call later and tries to send, but nobody will ever receive, so it blocks forever, holding its stack and everything it references. One per timed-out request accumulates steadily.

@fig be_go_leak | The handler gave up at the deadline. The goroutine's late send blocks forever, one more each time.

The fix is one character, a buffer of 1, `make(chan result, 1)`, so the late send succeeds and the goroutine exits. The broader rule is that every goroutine must have a guaranteed way to finish, a context it watches, a channel that will be closed, or a send that cannot block. Uber's `goleak` package checks for leftover goroutines at the end of tests.

## 28. Garbage collection and other runtimes

Go's **garbage collector** is a concurrent, non-moving, tri-color mark-and-sweep collector. It marks reachable objects while the program keeps running, with only brief stop-the-world pauses, usually well under a millisecond. Its pacing is controlled by **GOGC**, 100 by default, which starts a collection when the heap has grown by 100% over the live data left by the last collection. With 400 MB live, the next collection starts at about 800 MB. Since Go 1.19 in 2022, **GOMEMLIMIT** sets a soft memory ceiling, and the collector works harder as the heap approaches it, which suits containers with hard limits.

@fig be_go_gc | With GOGC=100, a 400 MB live set means collecting each time the heap reaches about 800 MB.

The compiler's **escape analysis** decides where each value lives. A value that provably does not outlive its function stays on the stack and costs the collector nothing. A value whose address escapes, returned, stored in a heap object, captured by a goroutine, moves to the heap. `go build -gcflags=-m` prints these decisions, and reducing allocations in hot paths, by reusing buffers with `sync.Pool` or avoiding needless pointers, is the main lever on GC cost.

Other runtimes answer the same questions differently. The **JVM** runs Java, Kotlin and Scala on platform threads, one-to-one with operating system threads, usually in pools. Its collectors range from throughput-oriented ones to low-pause ones, G1 by default and ZGC for sub-millisecond pauses on huge heaps. Java 21 in 2023 made **virtual threads** standard. Millions of lightweight threads are scheduled onto a few carrier threads, and blocking I/O parks the virtual thread instead of the carrier, so thread-per-request code gains goroutine-like scaling without rewriting.

**Python's** CPython interpreter has the **global interpreter lock**, the GIL, which lets only one thread execute Python bytecode at a time. Threads still help for I/O-bound work, since the GIL is released while waiting, but CPU-bound Python does not run in parallel on threads. Python servers scale with multiple processes, gunicorn or uvicorn workers, and with asyncio's event loop for high concurrency. Python 3.13 in 2024 shipped an optional free-threaded build without the GIL, from PEP 703, still experimental for most libraries.

@fig be_runtime_compare | Four runtimes, four ways of letting 1,000 requests share 8 cores.

The comparison shows the trade every runtime makes. Event loops are cheap per connection and fragile to CPU work. OS threads are simple and costly at scale. Green threads, goroutines and virtual threads, give simple code and cheap concurrency, with the runtime doing the scheduling. Knowing which one your service runs, and what blocks it, is the knowledge the syllabus asks you to bring to an interview.

:::story Picture this
A large kitchen with eight stations and a crowd of cooks. Each station has its own pile of tickets, a cook at an idle station walks over and takes half of a busy station's pile, and a cook waiting for the oven steps aside so someone else can use the station meanwhile. Every ticket also carries a deadline, and when the customer leaves, everyone working on that ticket drops it.
:::

:::note Tracing the scheduler
`GODEBUG=schedtrace=1000` prints the scheduler's state every second, Ps, threads, queue lengths. `go tool trace` records goroutine scheduling, blocking, syscalls and GC in detail and shows them on a timeline, which is the best way to see why a Go service is slow while its CPU is idle.
:::

:::warn Watch out
Starting a goroutine without a way for it to end is the Go equivalent of an unbounded queue. Every `go func()` in request-handling code should watch a context, have a buffered result channel or be part of an errgroup, and goroutine count belongs on the dashboard.
:::

:::interview Interview lens
**"How does Go schedule goroutines?"** With the G-M-P model. Goroutines (G) start with 2 KB stacks and wait in run queues on processors (P), of which there are GOMAXPROCS. Each P is driven by an OS thread (M). Idle Ps steal from busy ones. A blocking syscall hands the P to another thread, network I/O parks the goroutine on the netpoller, built on epoll, and since 1.14 long loops are preempted. Channels, select and context coordinate goroutines and cancel work, and every goroutine needs a guaranteed exit to avoid leaks.
:::

:::key In one breath
Goroutines start with 2 KB stacks and are scheduled by the G-M-P model, GOMAXPROCS processors with local run queues and work stealing, driving OS threads, with the netpoller parking goroutines on network I/O and preemption since Go 1.14. Channels, buffered or not, select and context deadlines coordinate and cancel work, and an unbuffered send after the receiver gave up is the classic goroutine leak, fixed with a buffer of 1. Go's concurrent GC triggers at double the live heap with GOGC=100 and respects GOMEMLIMIT, the JVM now offers virtual threads, and CPython's GIL pushes CPU-bound scaling to processes.
:::

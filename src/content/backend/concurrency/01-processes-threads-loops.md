@part I | Processes, threads and event loops | We look at how one server handles many requests at once. The answer is different in each runtime, but every answer is built from the same three pieces, processes, threads and event loops. We will cover concurrency against parallelism, processes and threads with their costs, and blocking I/O against event loops. | where:1

## 1. Concurrency and parallelism

At peak, each Wren instance receives 500 requests per second, and each takes 50 ms on average. By Little's law, which sized connection pools in Unit VI, 500 × 0.05 = 25 requests are in progress at any moment. The instance must make progress on 25 things at once. How it does that is the subject of this part.

@fig be_cc_inflight | Twenty-five requests inside one instance at any moment, each somewhere between arriving and leaving.

Two words get confused here. **Concurrency** means dealing with many tasks over the same period, so that all of them make progress, by switching between them. **Parallelism** means executing several tasks at the same instant on different cores. A cook watching three pans is concurrent, moving from pan to pan as each needs attention. Two cooks are parallel. Rob Pike's talk "Concurrency is not parallelism" (2012) put it as "concurrency is about dealing with lots of things at once, parallelism is about doing lots of things at once".

@fig be_cc_conc_par | One cook keeps three pans going. Two cooks cook two dishes at the same instant.

For a typical backend request, the distinction matters because most of the time is spent waiting. Wren's request uses about 10 ms of CPU and spends 40 ms waiting on the database, Redis and other services. While it waits, the core it was using could be serving someone else. Concurrency is how a server turns that waiting into useful work. Parallelism is how it uses all 8 of its cores for the 10 ms bursts of computation.

So a server needs two things. It needs a way to hold many requests in progress, mostly waiting, which costs memory per request. And it needs a way to run the computing parts on all cores. Processes, threads and event loops are three tools for those two jobs, and each runtime combines them differently. Getting this right decides how many requests an instance can hold, how much memory it uses, and what happens when one request misbehaves.

## 2. Processes and threads

A **process** is a running program with its own memory space, file descriptors and at least one thread. The operating system isolates processes from each other, so one cannot read or corrupt another's memory, and a crash in one leaves the others running. Creating a process costs a system call and some memory for its page tables. Communicating between processes needs explicit channels, pipes, sockets or shared memory segments.

A **thread** is a sequence of execution inside a process. All threads of a process share its memory, so they can pass data by simply reading and writing the same objects. The operating system schedules threads onto cores, and switching a core from one thread to another, a **context switch**, costs a few microseconds of saved registers, kernel work and cold caches.

@fig be_cc_proc_thread | Processes are separate houses, each with its own kitchen. Threads are roommates sharing one.

The classic server model, **thread per request**, gives each request its own thread from a pool. Code is simple to write, because each request runs top to bottom and blocks when it waits. Apache's worker model and traditional Java servlet containers work this way. With 25 requests in flight, Wren would need about 25 threads, which is no problem at all.

The model strains when connections grow and requests wait longer. Each thread reserves a stack, 1 MB by default on the JVM and 8 MB of virtual address space by default for Linux threads, though only touched pages use physical memory. Ten thousand threads reserve about 9.8 GB at 1 MB each, and the scheduler spends a growing share of its time switching between them. That limit, serving 10,000 simultaneous clients on one machine, was named the **C10k problem** by Dan Kegel in 1999, and the solutions to it shaped every modern runtime.

@fig be_cc_thread_cost | Stack memory reserved for 10,000 concurrent connections, by model, on a log scale.

The solutions all reduce the cost per waiting request. Go's goroutines start with 2 KB stacks that grow as needed, so 10,000 of them need about 20 MB. Event loops, next, hold a waiting request as a small object rather than a thread. Java 21's virtual threads, from Project Loom, give the thread-per-request programming model with goroutine-like costs.

## 3. Blocking I/O and event loops

When a thread calls `read()` on a socket with no data yet, the operating system suspends the thread until data arrives. This is **blocking I/O**. It is simple, and the waiting thread uses no CPU, but it occupies a thread for the whole wait. With blocking I/O, concurrency equals the number of threads.

**Non-blocking I/O** changes the contract. A socket set to non-blocking mode returns immediately from `read()` with an error code, `EAGAIN`, if nothing is ready. A program can then ask the kernel, with one call, which of thousands of sockets are ready. Linux's **epoll**, added in kernel 2.5.44 in 2002, BSD's kqueue from 2000, and Windows' I/O completion ports all provide that call, and they scale to hundreds of thousands of sockets because they report only the ready ones.

@fig be_cc_blocking | Blocked threads sit idle while waiting. One event loop interleaves five requests on a single thread.

An **event loop** is a thread that repeats a simple cycle. It asks the kernel which sockets are ready, runs the code waiting for each, and asks again. Each request is a small state object plus callbacks, not a thread. Nginx, Node.js, Redis, Python's asyncio and Netty in Java are all built on event loops. One thread can serve tens of thousands of mostly idle connections, because at any instant only a few have work to do.

@fig be_cc_event_loop | One thread asks the kernel what is ready, runs that work, and asks again.

The event loop has one rule that must never be broken. Code running on the loop must not block and must not compute for long, because while it runs, nothing else on that loop runs. A request that does 200 ms of CPU work stalls every other request on that loop for 200 ms, which Part II examines. Blocking calls, such as a synchronous file read or a database driver that is not asynchronous, are just as bad.

A newer Linux interface, **io_uring** from kernel 5.1 in 2019, goes further. Programs submit I/O operations to a ring buffer shared with the kernel and collect completions from another, which cuts system call overhead for high-throughput servers and works for files as well as sockets. Most application code meets it only through runtimes and libraries that adopt it.

:::story Picture this
A restaurant with one waiter per table needs fifty waiters for fifty tables, most of them standing around while diners read the menu. A restaurant with one sharp waiter who walks the floor, takes an order wherever a hand is raised and moves on, serves fifty tables alone, as long as no single table asks the waiter to sit down and peel a sack of potatoes.
:::

:::note Parallelism in event-loop runtimes
One event loop uses one core. To use eight, Node and Redis run several processes, one loop each, and Nginx runs one worker process per core. Netty and Go use several loops or schedulers inside one process. Either way, there is roughly one execution thread per core, with concurrency inside each.
:::

:::warn Watch out
A single blocking call hidden in an event-loop server, a synchronous DNS lookup, `fs.readFileSync` in a request handler, or a database driver without async support, quietly serializes the whole server. Profile under load and look for long, uninterrupted stretches on the loop thread.
:::

:::interview Interview lens
**"Compare thread-per-request with an event loop."** Thread per request gives each request a thread that blocks on I/O, which is simple to write but costs a stack and scheduling per request, so it strains at tens of thousands of connections. An event loop uses non-blocking sockets and epoll to serve many connections on one thread, holding each request as a small state object, which scales to very many idle connections but breaks if any code blocks or computes for long. Modern runtimes such as Go and Java's virtual threads combine the simple blocking style with event-loop costs.
:::

:::key In one breath
At 500 requests per second and 50 ms each, an instance holds 25 requests in flight, and concurrency is making progress on all of them while parallelism is running several at the same instant on different cores. Processes isolate memory, threads share it, and thread per request is simple but reserves about 1 MB per thread, which is why 10,000 connections became the C10k problem. Non-blocking sockets with epoll let one event loop serve thousands of mostly idle connections, as long as nothing on the loop blocks or computes for long.
:::

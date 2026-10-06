@part VIII | The Node.js runtime | We open Node.js, the runtime the syllabus uses as its first example of what an interviewer may ask. Knowing what runs where, and in what order, explains its strengths and every way it stalls. We will cover V8, libuv and the event loop's phases with microtasks, the thread pool, worker threads and clustering, and streams and buffers. | where:8

## 23. V8, libuv, phases and microtasks

Node.js, created by Ryan Dahl in 2009, is two main pieces glued together. **V8**, Google's JavaScript engine from Chrome, parses and compiles JavaScript to machine code and manages its heap and garbage collection. **libuv**, a C library written for Node, provides the event loop, non-blocking networking on epoll, kqueue or IOCP, timers, and a thread pool for operations that cannot be done without blocking. Your JavaScript runs on one main thread, and libuv decides when.

The event loop runs in **phases**, in a fixed order on each turn. The timers phase runs callbacks for `setTimeout` and `setInterval` whose time has come. **Pending callbacks** runs some deferred system callbacks, such as certain TCP errors. **Idle and prepare** are internal. The **poll** phase is the heart of it. It collects new I/O events, runs their callbacks, and if there is nothing else to do, waits for I/O here. **Check** runs `setImmediate` callbacks. **Close callbacks** handles events such as a socket's `close`.

@fig be_node_phases | Six phases per turn of the loop, with the microtask queues drained after every callback.

Between all of these sit the **microtasks**. Every time a callback finishes, before the loop moves on, Node drains two queues completely. First the `process.nextTick` queue, then the promise microtask queue, which holds `.then` callbacks and the continuations of `await`. Everything else, timers, I/O callbacks and immediates, is informally called a **macrotask**. Since Node 11, microtasks are drained between each individual timer or immediate callback, matching browsers.

That ordering produces a favourite interview puzzle. Synchronous code runs first. Then `process.nextTick` callbacks, then resolved promise callbacks. Only then does the loop proceed to its phases, where `setTimeout(fn, 0)` and `setImmediate(fn)` compete. From the main module their order depends on how quickly the loop starts, since a 0 ms timeout is really at least 1 ms. Inside an I/O callback, `setImmediate` always runs first, because check comes right after poll.

@fig be_node_order | Synchronous code, then nextTick, then promises, then timers and immediates.

The microtask queue has a hazard of its own. Because it is drained completely before the loop continues, a microtask that schedules another microtask, recursively, starves the loop just like a CPU-bound callback. A recursive `process.nextTick` or an endless chain of resolved promises can stop all I/O. The rule for the event loop applies to every queue. No piece of work may run for long without letting the loop turn.

## 24. The thread pool, worker threads and cluster

Some operations have no non-blocking form in the operating system, or are CPU-bound. libuv runs them on its thread pool, which has 4 threads by default. File system calls, `dns.lookup`, which uses the system resolver, the asynchronous `crypto` functions such as `pbkdf2`, `scrypt` and `randomBytes`, and `zlib` compression all use it. Network sockets do not, since they use epoll on the main thread.

The pool's small default surprises people. Wren's login endpoint hashes passwords with `crypto.pbkdf2`, which takes about 100 ms of CPU each. With 4 threads, one process can do at most 4 × (1 ÷ 0.1) = 40 hashes per second. A burst of 200 logins per second queues behind those 4 threads, and because file reads and DNS lookups share the same pool, unrelated requests that read a template or resolve a host name queue too. Raising `UV_THREADPOOL_SIZE`, up to 1,024, helps up to the core count. Moving hashing to a separate service, or using a cheaper algorithm configuration within the security guidance of Unit III, helps more.

@fig be_node_threadpool | Four pool threads busy hashing. The fifth hash, and an innocent file read, wait.

For CPU-heavy JavaScript, **worker_threads**, stable since Node 12 in 2019, run additional JavaScript threads, each with its own V8 isolate, heap and event loop. They communicate with the main thread by message passing, copying data by the structured clone algorithm, or by sharing memory through `SharedArrayBuffer` with `Atomics` for synchronization. A pool of workers, such as Piscina, is the standard place to put PDF rendering, image work or heavy parsing.

To use all cores for request handling, Node runs several processes. The built-in **cluster** module forks one worker process per core, all sharing the listening port, with the primary distributing connections. In containers, the more common approach is one Node process per container and several containers per machine, letting the orchestrator handle the multiplying. Either way, processes do not share memory, so in-process caches and rate limiters exist once per process, and anything shared must live in Redis or a database.

@fig be_node_scaling | Processes, one per core, for request throughput. Worker threads for CPU work inside one process.

The choice follows the work. I/O-bound request handling scales with processes. CPU-bound tasks inside a request go to worker threads or out to a queue. And the main thread's event loop stays reserved for what it does best, moving bytes between sockets and calling short callbacks.

## 25. Streams and buffers

Node handles binary data with **Buffers**, fixed-size chunks of memory allocated outside V8's heap, and handles data that arrives over time with **streams**. A readable stream produces chunks, a writable stream consumes them, and piping one into the other moves data through without holding all of it in memory. Serving Wren's 2 GB monthly export file as a stream uses a few hundred kilobytes, while `fs.readFile` followed by `res.end` would allocate 2 GB.

Streams carry backpressure, Part VI, through a simple contract. Each writable stream has a buffer with a **highWaterMark**, 64 KB by default for byte streams since Node 22 and 16 KB before it. `write(chunk)` returns `false` when the buffer is above the mark, meaning "stop sending until I emit `drain`". A well-behaved producer pauses when it sees `false` and resumes on `drain`. `pipe()` and, better, `stream.pipeline()` do this automatically and also clean up every stream if any of them errors.

@fig be_node_streams | The slow client's buffer passes its high-water mark, write() returns false, and reading pauses until drain.

The classic bug ignores the return value. A loop that reads from a fast source and calls `res.write(chunk)` for every chunk, without checking, buffers everything the slow client has not yet received. With a 2 GB file and a client on a slow phone connection, almost all of it ends up in memory, multiplied by every such client. That is the unbounded buffer of Part VI inside one function.

Buffers have their own cautions. `Buffer.allocUnsafe` returns memory that may contain old data, which is fast but must be fully overwritten before use. Small buffers are carved from a shared pool, so keeping a small slice of a large buffer alive keeps the whole parent alive, a subtle memory leak. Buffer memory is counted outside the V8 heap, so a process can be killed for memory while its heap snapshot looks small, as Part VII warned.

Async iteration, `for await (const chunk of stream)`, is now the clearest way to consume a readable stream. It respects backpressure on the reading side by pulling the next chunk only when the loop body finishes, though writes inside the loop still need awaiting `drain` or using `pipeline`.

:::story Picture this
A busy post room with one sorter at the counter and four helpers in the back. The sorter never leaves the counter, takes letters, and hands heavy parcels to the helpers. Notes marked "urgent" are always dealt with before the next letter from the queue. If the four helpers are all wrapping huge parcels, a simple "look up this address" request waits for one of them, even though the sorter is free.
:::

:::note Measuring the loop
`perf_hooks.monitorEventLoopDelay()` gives a histogram of event loop delay, and `performance.eventLoopUtilization()` reports the fraction of time the loop was busy. Wren exports both as metrics. Utilization near 1 with rising delay means the loop is saturated with CPU work, while low utilization with high latency points at slow I/O or a saturated thread pool.
:::

:::warn Watch out
Synchronous APIs, `fs.readFileSync`, `crypto.pbkdf2Sync`, `zlib.gzipSync`, `JSON.parse` on huge strings, are fine at startup and deadly in a request handler. Lint for them in request paths and use the asynchronous forms or worker threads.
:::

:::interview Interview lens
**"Explain the Node.js event loop and where it can block."** V8 runs JavaScript on one thread, and libuv's loop cycles through timers, pending callbacks, poll for I/O, check for setImmediate and close callbacks, draining the nextTick and promise microtask queues after each callback. Network I/O is non-blocking on the loop, while file system, DNS lookups, crypto and zlib use libuv's thread pool of 4 threads by default. It blocks when synchronous CPU work or a runaway microtask chain runs on the main thread, or when the thread pool is saturated. Use worker threads for CPU work, processes for cores, and streams with backpressure for large data.
:::

:::key In one breath
Node.js is V8 running JavaScript on one thread plus libuv's event loop, which cycles through timers, pending callbacks, poll, check and close phases and drains the nextTick queue and then promise microtasks after every callback. libuv's thread pool, 4 threads by default, handles file system, DNS lookups, crypto and zlib, so 100 ms hashes cap a process at 40 per second. CPU-heavy work belongs in worker threads, request throughput across cores comes from processes, and streams move large data with backpressure through highWaterMark, write() returning false and drain.
:::

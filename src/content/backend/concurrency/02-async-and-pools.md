@part II | Async code and pools | We look at how code is written for concurrent runtimes and how the resources it uses are pooled. The syntax has changed from callbacks to async and await, but what runs underneath has not. We will cover callbacks, futures, promises and coroutines, sizing thread and worker pools, and what happens when CPU work blocks an event loop. | where:2

## 4. Callbacks, futures, promises and coroutines

On an event loop, code cannot simply wait for the database. It must say what to do when the result arrives and give the thread back. The first way to say it was a **callback**, a function passed along with the request, `getOrder(id, (err, order) => ...)`. Callbacks work, but a request with five sequential steps becomes five nested functions, error handling must be repeated at every level, and the shape is known as callback hell.

A **future**, called a **promise** in JavaScript, is an object representing a result that will exist later. `getOrder(id)` returns a promise immediately, and `.then(fn)` attaches what to do with the value. Promises can be chained, combined with `Promise.all` to wait for several, and carry errors down the chain to one `.catch`. Java's `CompletableFuture`, Python's `asyncio.Future` and Rust's `Future` are the same idea.

@fig be_cc_async_styles | Callbacks, promises and async/await, all expressing the same three steps.

**Async/await** makes promise-based code look sequential. `const order = await getOrder(id)` suspends the function at that line, returns control to the event loop, and resumes the function when the promise settles, with the value assigned. C# introduced it in 2012, JavaScript in 2017, Python in 3.5 in 2015, and Rust in 2019.

Underneath, an async function is a **coroutine**, a function that can pause at defined points and resume later with its local variables intact. Its state is saved in a small heap object, a few hundred bytes, rather than a full thread stack. Thousands of coroutines can be suspended at once, each waiting on its own I/O, with one thread running whichever is ready.

@fig be_cc_coroutine | Each coroutine pauses at an await and the loop thread runs another. Nothing blocks.

Two mistakes recur. The first is awaiting in a loop when the steps are independent. `for (const id of ids) await getUser(id)` makes ten calls one after another, ten round trips. `await Promise.all(ids.map(getUser))` or Python's `asyncio.gather` makes them concurrently, though it also needs a limit on how many run at once, or it fires a thousand requests at a downstream service. The second is forgetting to await, which starts work whose errors nobody sees and whose completion nobody waits for, a source of the leaks in Part VII.

Go and Java's virtual threads take a different path. Code is written as ordinary blocking calls, and the runtime suspends the goroutine or virtual thread instead of the operating system thread. The programmer gets sequential code without `async` keywords, and the runtime does the coroutine work.

## 5. Thread pools, worker pools and their sizes

Creating a thread per request and destroying it afterwards wastes time, and unlimited threads exhaust memory under load. A **thread pool** keeps a fixed set of threads and a queue of tasks. A request becomes a task, a free thread runs it, and when all threads are busy, tasks wait in the queue. Tomcat, Jetty and most Java servers have a request thread pool, 200 threads by default in Tomcat. A **worker pool** is the same idea for background jobs, and Unit VIII sized one with Little's law. The connection pool from Unit VI is a pool of a different resource, used the same way.

How big should a thread pool be? It depends on how much of each task is computing and how much is waiting. A rule from Brian Goetz's *Java Concurrency in Practice* (2006) gives the number of threads that keeps all cores busy.

$$N_{threads} = N_{cores} \times \left(1 + \frac{W}{C}\right)$$

Read it as "one thread per core, plus enough extra threads to fill the time each one spends waiting". Wren's request computes for 10 ms and waits for 40 ms, so W ÷ C = 4, and on 8 cores the pool needs 8 × (1 + 4) = 40 threads. Fewer leaves cores idle while threads wait. Many more adds context switching and memory without adding throughput.

@fig be_cc_pool_sizing | One thread computes 10 ms and waits 40 ms, so 5 threads per core keep it busy, 40 on 8 cores.

For pure CPU work, W is near zero, and the answer is about one thread per core, which is why image resizing pools and parallel stream pools default to the core count. For pools that call slow external services, W ÷ C can be 100 or more, which is exactly when thread pools become expensive and event loops or virtual threads shine.

Every pool also needs a bounded queue and a policy for when it is full. An unbounded task queue in front of a thread pool is the unbounded buffer of Part VI, and Java's `Executors.newFixedThreadPool` creates exactly that by default. Wren's request pool has a queue of 100 and rejects beyond it with 503, which turns overload into a visible error instead of a slow memory leak.

Pools also interact. A request thread that borrows a database connection, then waits on a pool of HTTP clients, then on a lock, can deadlock if those pools are sized so that every request holds one resource while waiting for another. Sizing pools together, and acquiring resources in a consistent order, avoids it.

## 6. Blocking the event loop

Wren's first receipt feature rendered the PDF inside the Node.js request handler. Rendering took 200 ms of pure CPU. During those 200 ms the event loop ran nothing else. At 500 requests per second, about 0.2 × 500 = 100 requests arrived during each render and waited for it to finish before even being parsed. Their latency jumped by up to 200 ms, health checks timed out, and the orchestrator restarted instances that were busy rather than broken.

@fig be_cc_blocked_loop | One 200 ms task holds the loop. A hundred requests queue behind it, and the health check too.

The arithmetic gets worse with volume. If 10% of requests did 200 ms of CPU work, the instance would need 50 × 0.2 = 10 s of CPU per second on a loop that has 1 s per second to give. The loop saturates, the queue of pending events grows without bound, and latency climbs until requests time out. Nothing is technically broken, and nothing is getting done.

The usual culprits are easy to name. Large JSON parsing or serialization, such as a 5 MB request body. Complex regular expressions, especially those that backtrack catastrophically on crafted input, an attack called **ReDoS**. Password hashing done synchronously. Image and PDF processing. Synchronous compression. Sorting or transforming large arrays in memory.

The fixes move CPU work off the loop. Node's `worker_threads` run JavaScript on separate threads with their own event loops, and a pool such as Piscina hands tasks to them. Heavy, slow or retryable work goes to a job queue and separate worker processes, Unit VIII, which is what Wren did with receipts. Where work cannot move, it can be split into chunks that yield to the loop between them. And input limits, such as maximum body sizes and safe regular expression engines, stop attackers from creating the CPU work in the first place.

@fig be_cc_offload | The loop keeps doing I/O. CPU-heavy tasks go to worker threads or a queue.

The symptom to watch is **event loop lag**, the delay between when a timer should fire and when it does. Node exposes it through `perf_hooks.monitorEventLoopDelay`, and a p99 lag above tens of milliseconds means something is hogging the loop. Python's asyncio has a debug mode that logs callbacks taking longer than 100 ms.

:::story Picture this
A help desk with one clerk who handles quick questions from a long line. It works beautifully until one visitor asks the clerk to fill in a twenty-page form on their behalf. Everyone else waits. The fix is not a faster clerk. It is a back office where long forms go, while the clerk keeps answering quick questions.
:::

:::note Structured concurrency
Python's `asyncio.TaskGroup` (3.11), Java's `StructuredTaskScope` and Kotlin's coroutine scopes tie child tasks to a parent's lifetime. If one child fails, the others are cancelled, and the parent cannot finish while children are still running. That removes the "forgotten task" class of bugs and makes cancellation propagate like Go's context.
:::

:::warn Watch out
`Promise.all` over a large array of calls launches them all at once. Mapping 5,000 order ids to `fetchOrder` sends 5,000 concurrent requests to a downstream service. Use a concurrency limit, such as `p-limit` or a semaphore, sized to what the downstream can take.
:::

:::interview Interview lens
**"What happens when you run CPU-heavy work in a Node.js request handler?"** The event loop is single-threaded, so while that code runs, no other callback runs. Every concurrent request, timer and health check waits. A 200 ms render at 500 requests per second delays about 100 requests each time, and if enough requests do it, the loop saturates and latency explodes. Move the work to worker threads or a job queue, chunk it, or cap the inputs that create it, and monitor event loop lag.
:::

:::key In one breath
Callbacks gave way to promises and then async/await, which compiles to coroutines that pause at each await in a few hundred bytes instead of a thread, and independent calls should run together with a concurrency limit. Thread pools are sized as cores × (1 + wait ÷ compute), 40 threads for Wren's 10 ms of CPU and 40 ms of waiting on 8 cores, with bounded queues that reject instead of growing. CPU work on an event loop stalls everything, 100 requests behind each 200 ms render, so it moves to worker threads or queues, and event loop lag is the metric that reveals it.
:::

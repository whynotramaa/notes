<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A backend is a crowd of requests sharing a handful of cores, connections and rows. Concurrency is the discipline of letting them share without corrupting what they share, and without letting one slow member of the crowd stall everyone else.</p>

The unit works outwards. The first three parts stay inside one process. They cover how processes, threads, event loops and coroutines run many requests at once, how pools are sized, and how races, mutexes, semaphores and compare-and-swap behave in memory. Parts IV and V cross process boundaries, first with techniques that need no lock at all and then with distributed locks, leases, fencing tokens and the Redlock debate. Part VI handles overload, where more work arrives than can be done, and Part VII handles leaks, where resources go in and never come out. Parts VIII and IX open the Node.js and Go runtimes, which interviews increasingly ask about directly, and Part X follows one request through an instance.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to explain why a lock in one process does not protect a row shared by four, why `SET NX PX` alone is not a safe lock, where the extra 40,000 requests per second go when only 10,000 can be served, and what happens inside Node when a request does 200 ms of CPU work.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Traffic per instance at peak | 500 requests per second, 50 ms mean latency | Requests in flight |
| Cores per instance | 8 | Thread pool sizing |
| Typical request | 10 ms of CPU, 40 ms waiting on I/O | Wait-to-compute ratio |
| Instances | 4 normally, 20 at peak | Locks across processes |
| Kitchen partner API | 100 concurrent calls allowed | Semaphores |
| Report lock lease | 30 s, renewed every 10 s | Distributed locks |
| Overload scenario | 50,000 requests per second offered, 10,000 served | Backpressure |
| File descriptor limit | 65,536 per process | Resource leaks |
| Password hash | 100 ms of CPU | Node's thread pool |

The examples follow Wren's order request through one instance, the nightly report job that must run under a lock, and two incidents, a blocked event loop and a slow memory leak.

</section>

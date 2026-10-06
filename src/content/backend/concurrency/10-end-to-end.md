@part X | One instance end to end | We follow Wren's order request through one instance and see every idea of the unit at work. Then we replay three incidents, each traced to a mechanism from an earlier part. We will cover the request's path through runtime, pools and shared state, the three incidents, and the unit on one page. | where:10

## 29. POST /orders inside one instance

User 42's `POST /orders` reaches one of Wren's instances, which runs Go. The listener goroutine accepts the connection, and the HTTP server starts a goroutine for the request, created with a context carrying the gateway's 300 ms deadline. That goroutine is one of about 25 requests in flight on this instance, scheduled across 8 Ps.

The handler parses and validates the body, about 0.3 ms of CPU, and checks the idempotency key, Unit V. It then borrows a database connection, which is a semaphore acquire on the pool of 10 with a 50 ms wait limit. While it waits for the connection, and later for each query, the goroutine is parked on the netpoller and its P runs other requests. The transaction from Unit VI runs, about 18.55 ms of mostly waiting, holding row locks only inside PostgreSQL. No in-process mutex is involved, because the shared state, stock and the order itself, lives in the database, and Part IV's rule was to let the store coordinate.

@fig be_cc_e2e | Accept, validate, borrow, transact, enqueue, respond. Only the database holds a lock, and only for milliseconds.

After the commit, the outbox row is already written, so nothing else must happen before the response. The handler returns 201. Kitchen notifications and receipts happen later, through Unit VIII's relay and workers, which have their own bounded queues, semaphores for the kitchen API's 100-call limit, and retry policies.

Several limits protected this request without being visible. The instance's admission control would have refused it with 503 if 200 requests were already in progress. The connection pool's 50 ms wait would have failed it fast if the database were saturated. Its context would have cancelled every query and downstream call if the gateway's deadline passed. And the goroutine could not leak, because every channel it used was buffered or tied to the context.

## 30. Three incidents, and the unit on one page

The first incident ran on Wren's older Node.js service. Latency rose tenfold and CPU sat at 100% on one core per process while the others idled. A profile showed `JSON.parse` on a 5 MB request body sent by a misbehaving partner integration, plus a regular expression that backtracked on its contents, blocking the event loop for over a second per request. Every other request on that process waited, health checks failed, and the orchestrator restarted processes that were merely busy. The fixes came straight from Parts II and VIII, a 1 MB body limit at the gateway, a linear-time regex engine for user input, and a worker thread for the remaining heavy parsing, with event loop delay on the dashboard.

@fig be_cc_failures | A blocked loop, a growing heap and a duplicate report, each traced to a mechanism from this unit.

The second incident was slow. Memory on every instance grew steadily over days while CPU stayed normal, and garbage collection ran more often each hour, until instances were OOMKilled every few days. Two heap snapshots half an hour apart showed a per-user map growing by 412 MB, the session cache from Part VII. Replacing it with a bounded LRU with a TTL fixed it, and an alert on the heap floor's trend now catches the next one weeks earlier.

The third incident sent some restaurants their nightly report twice. The report job used a Redis lock with a 30 s lease and no renewal. On one night, a slow storage write and a long GC pause pushed a run past 30 s, the lease expired, a second instance acquired the lock, and both sent the report. The fix followed Part V's decision list. The job now claims a unique run row per restaurant and night, and the email step uses that run's id as an idempotency key, so even two concurrent runs send one email.

@fig be_cc_components | Runtimes, races, locks and overload, around two rules.

The unit's ideas fit around two rules. Every shared thing needs exactly one owner at a time. Inside a process, mutexes, atomics and single-owner goroutines provide it. Across processes, the database, a single writer, a conditional write or a fenced lease does. And every buffer needs a limit. Thread pools, connection pools, queues, channels, stream buffers and admission control all bound how much work can be waiting, so that overload becomes a visible, early error instead of a slow death. Leaks are the failure of the first rule over time, where something takes ownership and never lets go. Unit X builds on these limits with rate limiting, timeouts, retries and circuit breakers between services.

:::story Picture this
A busy hospital ward. One nurse at a time handles each patient's medication chart, and that chart lives at the bedside, not in each nurse's pocket. The ward admits only as many patients as it has beds and redirects ambulances when full, and every night someone checks that no equipment was signed out and never returned.
:::

:::warn Watch out
Incidents in this unit rarely show up in functional tests. Races need concurrency, leaks need hours, blocked loops need production-sized inputs, and lock failures need pauses. Load tests with realistic concurrency and duration, soak tests that run for a day, and fault injection for pauses and slow storage are how these bugs are found before customers find them.
:::

:::interview Interview lens
**"CPU is at 100% on one core and latency has jumped. How do you investigate?"** One core pinned in a single-threaded runtime like Node suggests CPU work blocking the event loop. Check event loop delay and utilization, take a CPU profile or flame graph under load, and look for synchronous parsing, regex backtracking, hashing or compression in request paths. Mitigate by capping input sizes and restarting, then move the work to worker threads or a queue and add a lag alert. In a multi-threaded runtime, the same profile points at a hot lock or a tight loop.
:::

:::key In one breath
Inside one instance, Wren's order request is one goroutine of about 25 in flight, parked on the netpoller while it waits for a pooled connection and an 18.55 ms transaction, with locks held only inside PostgreSQL and limits from admission control, pool waits and context deadlines protecting it. The three incidents map to the unit, a 5 MB body blocking Node's event loop, an unbounded per-user map leaking 412 MB in half an hour, and a lease expiring under a pause that a run row and idempotency key fixed. Every shared thing needs one owner at a time, and every buffer needs a limit.
:::

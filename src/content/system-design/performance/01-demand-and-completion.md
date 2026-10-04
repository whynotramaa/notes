@part I | Latency, throughput and Little's law | We count arriving work, completed work, and the time spent between them. A service can finish many requests while making each viewer wait. We will follow one request, separate rates from durations, and derive the concurrency budget. | where:1

## 1. Latency versus throughput

You open Heron's score page and wait while thousands of other viewers do the same. Your wait and the service's completed-request count answer different questions. **Latency** is elapsed time between a chosen operation's start and finish. **Throughput** is work completed per unit time. Neither number tells the whole story alone.

Mark the boundaries before measuring. Client latency includes network travel and browser work when those occur inside the timer. Application latency may start only after a proxy has accepted the request. Database latency can exclude waiting for a connection. Each timer can be correct while reporting a different duration for the same user action.

Suppose our illustrative service accepts 1,000 requests during a second and finishes 900 successfully. Arrival rate is 1,000 requests per second, useful throughput is 900, and the difference is 100 requests. Those requests might wait, fail, or still be executing. Calling the arrival count throughput hides that distinction and makes overload look like success.

A faster response does not necessarily increase fleet throughput. Removing a network wait helps a viewer, but a shared write lock may still cap completions. More asynchronous callers may increase completions while increasing each caller's queueing delay. Say which outcome you need before suggesting a fix.

@fig sd_performance_demand | Illustrative daily demand is 8,640,000; average and peak rates are computed.

## 2. Where one request spends its time

A score lookup feels like one action, but several clocks run inside it. The proxy waits for an application worker, the worker waits for a database connection, and the query waits for its result. **Service time** is time actively consuming the resource being studied. **Queueing time** is time waiting to receive that service.

Our illustrative trace spends 30 ms reaching the application, 20 ms waiting for admission, 10 ms acquiring a database connection, 40 ms on database work, and 100 ms returning and finishing the response. Adding these sequential intervals gives 200 ms. The database's 40 ms measurement is only part of the viewer's 200 ms experience.

Draw the intervals along one timeline. A parent span contains a child span, so adding both durations counts the same time twice. Parallel calls overlap, so their durations also cannot simply be added. Sum disjoint sequential intervals; use the latest completion when the parent waits for parallel children.

Now imagine reducing database work while leaving pool acquisition untouched. The query chart improves, yet an exhausted pool can still dominate the user's wait. Inspect the longest unexplained interval, then identify the resource or policy that owns it. This gives the optimization a specific target instead of treating latency as one undifferentiated number.

@fig sd_performance_trace | Illustrative disjoint intervals sum to 200 ms; overlapping spans must not be added again.

:::story Picture this
At a cafe, the time from joining the line to receiving a drink includes the line and the preparation. A faster coffee machine helps preparation. It does little when every order waits for a single cashier, so you first time the stages separately.
:::

## 3. Daily averages and peak demand

Heron receives 8,640,000 API requests in an illustrative day. Dividing by the day's 86,400 seconds gives 100 requests per second. This is useful for daily traffic totals, but match starts concentrate demand. Our assumed peak multiplier of 10 gives 1,000 requests per second, with no claim that a real service has this exact shape.

**Queries per second**, abbreviated **QPS**, counts queries inside a named measurement boundary. Interview sizing often uses the same arithmetic for incoming API requests, so say which operations the count represents. One API request can issue several database queries, and a cache hit can issue none. Heron's 100 average API requests per second is therefore not automatically 100 database QPS.

$$\lambda_{\text{avg}}=D/T$$

Read this as: average arrival rate $\lambda_{\text{avg}}$ equals request count $D$ divided by observation duration $T$. Keep the time units consistent. If the observation is a day, the denominator must be seconds per day when the output is requests per second.

A window can conceal its own burst. An illustrative pair of 10-second windows contains 3,000 requests and 7,000 requests. Their rates are 300 and 700 requests per second. Combining them reports 500 requests per second over 20 seconds, even though the second window needs more capacity than that average suggests.

Record the peak's duration and what causes it. A brief rush can fit in a bounded queue; a long capacity deficit cannot. Separate background traffic, reconnects, scheduled jobs, and viewer demand when they coincide. The question is whether the whole arriving workload fits through the path while its deadlines remain useful.

@fig sd_performance_windows | Illustrative window counts produce rates of 300 and 700 requests/s, with a combined rate of 500 requests/s.

:::note Units belong beside every count
Requests per second, concurrent requests, and open sockets describe different things. Keep the units on the whiteboard. A unit mismatch often reveals a mistaken calculation before you need a benchmark.
:::

## 4. Concurrency and Little's law

A viewer request remains inside the service while it waits and runs. Count those unfinished requests as **concurrency**, or work in progress. Idle keep-alive sockets are connections, but they are not automatically unfinished requests. A system can have many open sockets and little request concurrency.

**Little's law** connects long-run mean work in progress, mean completion rate, and mean time inside the same boundary. In a stable operating interval, every completed request contributes its residence time to the total work-in-progress area. Dividing that area by the observation duration produces the mean number present.

$$L=\lambda W$$

Read this as: mean concurrent work $L$ equals mean throughput $\lambda$ times mean residence time $W$. Heron's illustrative peak of 1,000 requests per second and mean residence time of 0.2 seconds gives 200 concurrent requests. The seconds cancel, leaving requests. This uses the mean duration, not the p99.

A queue that keeps growing has no sustainable steady-state mean to size around. You can still measure finite-window quantities, but you must account for unfinished requests and changing backlog. Do not use a short observation of completions to declare a permanently overloaded system stable. Check arrivals, departures, and work in progress together.

@fig sd_performance_concurrency | Illustrative steady-state rate times mean duration gives 200 active requests.

## 5. Concurrency budgets and connection pools

Heron can have 200 requests in flight without needing 200 database connections. Some requests wait on the client network, some read a cache, and some already released their connection. A **connection pool** shares a bounded set of reusable connections so opening sockets is not part of every query.

Assume each database operation occupies a connection for an illustrative 10 ms. A pool with 20 continuously busy connections has an ideal upper bound of $20/0.01=2,000$ operations per second. This is only a residence-time bound. The database might saturate its CPU, storage, or locks before reaching it.

Measure pool-acquisition duration separately from connection-hold duration. If acquisition grows while query time stays flat, callers wait before the database timer starts. Adding pool slots may move that wait into the database instead. It can also make memory use and lock competition worse without producing more useful completions.

Set a pool budget across the fleet. Five application instances with 20 slots each can offer 100 simultaneous database operations. A per-instance limit that looks small can become a large shared load after horizontal scaling. Bound acquisition by the request deadline, release connections on cancellation, and reserve capacity only when the workload requires it.

@fig sd_performance_pool | Illustrative 20-slot pool and 10 ms hold time imply an ideal 2,000 operations/s ceiling.

:::warn Watch out
A connection count is not a CPU capacity claim. Increasing callers changes offered load. Confirm that the resource performing the work has spare capacity before increasing its queue.
:::

:::interview Interview lens
**"How many concurrent requests should this service expect?"** I first state the measurement boundary and the mean completion rate. For the illustrative stable peak, 1,000 requests per second times 0.2 seconds gives 200 active requests. Then I budget each dependency's occupancy separately, because not every active request holds a connection for its entire life.
:::

:::key In one breath
Latency measures an operation's elapsed time and throughput measures completed work per time. Trace disjoint intervals before adding them, and compare arrivals with useful departures. Daily averages need an explicit burst shape. Little's law gives mean concurrency from consistent steady-state boundaries, while pool sizing depends on actual connection-hold time and shared dependency capacity.
:::

@part VIII | Performance engineering | We learn to find where a service spends its time and to prove a change made it faster. Guessing at performance problems wastes days, and measuring them usually takes minutes with the right tool. We will cover latency, throughput and Little's law, locating the slow layer, profiling with flame graphs, runtime costs such as garbage collection and syscalls, and load, stress and soak tests. | where:8

## 25. Latency, throughput and Little's law

Three quantities describe how a service performs, and they are linked. **Latency** is how long one request takes. **Throughput** is how many requests are completed per second. **Concurrency** is how many requests are in progress at once. **Little's law**, proved by John Little in 1961, ties them together for any stable system. The average number in the system equals the arrival rate times the average time each spends there, L = λ × W. It holds regardless of the distribution of arrivals or service times, which makes it unusually practical.

At Wren's peak, 2,000 requests a second with a mean latency of 50 ms give 2,000 × 0.05 = 100 requests in flight across the fleet, 25 per instance. If latency doubles to 100 ms with the same traffic, 200 are in flight, and every resource held per request, threads, memory, pool connections, doubles with it. That is why a slow dependency exhausts a service's threads or pool, Unit X. The service did not get more traffic. Each request just stayed longer.

@fig be_obs_little | Little's law. 2,000 requests a second staying 50 ms each means 100 inside at any moment.

Work divides into two kinds. **CPU-bound** work spends its time computing, serialising JSON, hashing passwords, compressing, rendering templates, and is limited by cores. **I/O-bound** work spends its time waiting for the network, the database or the disk, and is limited by how many waits can overlap. Most API requests are mostly I/O-bound, a few milliseconds of CPU around tens of milliseconds of waiting. If each Wren request uses 2 ms of CPU, an instance at 500 requests a second needs 500 × 0.002 = 1 core-second per second, one full core, while its 25 concurrent requests spend most of their time waiting. More cores will not help an I/O-bound service, and more concurrency will not help a CPU-bound one.

Utilisation drives queueing, and queueing drives the tail. In the simplest queueing model, with random arrivals and one server that takes 2 ms per request, the average time in the system is the service time divided by one minus utilisation. At 50% utilisation that is 2 ÷ 0.5 = 4 ms, at 80% it is 10 ms, at 90% it is 20 ms and at 95% it is 40 ms. Latency climbs steeply as utilisation approaches 100%, long before the resource is "full". This is why Wren plans capacity for about 60% CPU at peak, not 95%, and why saturation in the USE method, Part V, predicts latency trouble better than utilisation does.

## 26. Finding the slow layer

A customer says the app feels slow. "Slow" could live in a dozen places: the phone's network, DNS, the TLS handshake, the CDN, the load balancer, the gateway, the application, the database, the cache, a downstream service, or a third-party API. The fastest investigation follows the request in order and compares the time each layer saw, because each layer's time includes everything beneath it.

The load balancer's access log records two numbers for each request, the total time from first byte received to last byte sent, and the time the upstream application took. Nginx calls these `$request_time` and `$upstream_response_time`. If total time is high but upstream time is low, the time went to the client side, a slow phone network, a large response, or the proxy itself buffering. If upstream time is high, the application or something behind it is slow. Inside the application, a trace, Part IV, splits the remaining time into the service's own code and each call it made.

@fig be_obs_layers | Each layer's time contains the layers beneath. Subtracting adjacent numbers finds where the time went.

Wren's checklist for a slow endpoint follows that path. Is it all endpoints or one, all instances or one, all users or a region? All endpoints on one instance suggests the instance, noisy neighbours, CPU throttling or a bad deploy on that node. One endpoint everywhere suggests its code or its queries. A region suggests the network or the CDN. Then the trace for a slow request shows whether the time is in the service's own code, which needs a profiler, section 27, or in a dependency, which moves the investigation to that dependency's metrics.

Databases and caches have their own evidence. PostgreSQL's `pg_stat_statements` ranks queries by total time and mean time, so a query that became slow because a plan changed, or that runs far more often after a code change, is at the top, Unit VI. `EXPLAIN ANALYZE` on that query shows whether an index is used. Redis's `SLOWLOG` lists commands slower than a threshold, often a `KEYS` or a large `HGETALL`, Unit VII. Pool metrics show whether requests wait for a connection before any query runs, which looks like a slow database from the application but is not.

The discipline that matters most is to measure before changing anything. "It's probably the database" leads to a week of index tuning for a problem that was a 300 ms DNS lookup on every outbound call because a resolver cache was turned off.

## 27. Profiling and flame graphs

When a trace shows the time is inside the service's own code, the next tool is a **profiler**, which shows which functions use the time. A **sampling CPU profiler** interrupts the program at a fixed rate, often around 100 times a second, and records the full call stack each time. Over 30 seconds that is about 3,000 stacks per core. A function that appears in 40% of the samples used about 40% of the CPU time. Sampling has low overhead, typically a few percent, so it is safe in production, unlike tracing profilers that record every call.

Thousands of stacks need a picture, and the standard one is the **flame graph**, invented by Brendan Gregg in 2011. Each stack is drawn as a column of boxes, the entry point at the bottom and the function running at the top. Stacks are merged where they share frames and sorted alphabetically, not by time, so the x-axis is not a timeline. The width of each box is the share of samples in which that function was on the stack. Wide boxes at the top are functions burning CPU themselves. A wide box lower down whose children are all narrow means the time is spread among many callees.

@fig be_obs_flame | A flame graph. Width is share of samples. The wide plateau at the top is JSON serialisation inside the orders handler.

Reading one is a matter of looking for wide plateaus. In Wren's order service, a flame graph during a CPU spike showed 38% of samples in JSON serialisation of the order history response, which turned out to include every order's full item list because a field selection was ignored. The fix was in the query, not the serialiser.

CPU is one kind of profile. A **heap profile** shows what is holding memory now, by allocation site, and is the tool for leaks, Part X. An **allocation profile** shows which code allocates most, which matters in garbage-collected runtimes because allocation rate drives GC work. Off-CPU or **wall-clock profiles** show where threads wait, on locks, I/O or sleeps, which CPU profiles miss entirely. Each runtime has its tools: `pprof` in Go, async-profiler and Java Flight Recorder for the JVM, `py-spy` for Python, the V8 profiler through `--cpu-prof` for Node.js, and `perf` for anything on Linux.

**Continuous profiling** runs a low-overhead profiler on every instance all the time and stores the results, with tools such as Grafana Pyroscope, Parca or hosted equivalents. It turns "can we reproduce it?" into "show me the profile from 20:04 on api-3", and lets a team compare the CPU profile of one release against the previous one.

## 28. Garbage collection, allocations and syscalls

Some costs do not belong to any one line of application code. They come from the runtime and the operating system underneath, and they show up as latency spikes or CPU use that the code does not explain.

**Garbage collection** reclaims memory that is no longer used. Modern collectors, Go's concurrent collector, the JVM's G1 and ZGC, V8's Orinoco, do most of their work alongside the application, but still pause it briefly and use CPU. The amount of work grows with the **allocation rate**. If each Wren request allocates 200 KB of temporary objects, 500 requests a second allocate 100 MB a second, and the collector must clear that. Reducing allocation, by reusing buffers, streaming large responses instead of building them in memory, and avoiding needless copies, cuts GC CPU and pause frequency. GC metrics, pause duration, frequency and CPU share, belong on every service dashboard, and a p99.9 that lines up with GC pauses is a classic finding.

@fig be_obs_gc | Allocation fills the heap, the collector clears it, and each pause lands on whatever requests were running.

**System calls** are requests from the program to the kernel, to read a socket, write a file or get the time. Each crosses from user space into the kernel and back, costing on the order of a hundred nanoseconds to a few microseconds. That is nothing once, and a lot when a logging library calls `write` for every line or a loop calls `gettimeofday` millions of times. `strace -c` counts system calls by type, and `perf` shows their share of CPU.

**Context switches** happen when the kernel moves a CPU from one thread to another. Each costs a few microseconds directly and more through cold caches afterwards. A service with thousands of threads each doing little work can spend a noticeable share of its CPU switching, which is part of why event loops and lightweight threads, Unit IX, scale better for I/O-bound work. `vmstat` shows switches per second, and a sudden jump often points to lock contention, where threads repeatedly wake and block.

Containers add one more cost, **CPU throttling**. A container with a CPU limit of 2 cores is allowed 200 ms of CPU time per 100 ms period. A multi-threaded runtime that uses 8 threads in a burst can spend its 200 ms allowance in 25 ms and then be stopped for the remaining 75 ms of the period, adding up to 75 ms to any request in flight, while average CPU use looks modest. The kernel counts this in `cpu.stat` as throttled periods, and it is a common hidden cause of tail latency, Unit XV.

## 29. Load, stress and soak testing

Profilers explain a running system. **Load tests** predict how it will behave under traffic that has not happened yet. They answer questions such as "can we handle the New Year's Eve peak?", "did this release make us slower?" and "where does the system break first?".

There are several kinds, distinguished by their shape. A **load test** runs at the expected peak, or a margin above it. Wren's peak is 2,000 requests a second, so it tests at 3,000, 1.5 times peak, for 30 minutes and checks that the SLO holds. A **stress test** raises load step by step until something fails, to find the limit and see how the system fails, whether it degrades gracefully by shedding load with 503s or collapses into timeouts. A **spike test** jumps suddenly from normal to several times normal to test autoscaling and cold caches. A **soak test** runs at normal load for many hours, eight or more, to catch problems that grow slowly, memory leaks, connection leaks, log files filling disks, and caches that never evict.

@fig be_obs_load_shapes | Load, stress, spike and soak tests have different shapes and find different problems.

The tools differ in style. `ab`, Apache Bench, and `wrk` are simple command-line tools that hit one URL as fast as possible, good for a quick check of one endpoint. `wrk2` adds a fixed request rate to avoid coordinated omission, Part III. **k6** writes scenarios in JavaScript, supports arrival-rate executors that keep a constant rate whatever the latency, and checks thresholds such as `p(99) < 300`. **Locust** writes user behaviour in Python and simulates many users with think time, which is closer to real traffic. Gatling and JMeter are older alternatives common in the JVM world.

A load test is only as good as its realism. It should run against an environment shaped like production, with production-sized data, because a query that is fast on a 1,000-row test table can be slow on a 50-million-row one. It should replay a realistic mix of endpoints, weighted like real traffic, with realistic cache hit ratios, not one URL a million times. It should run long enough for caches to warm and GC to reach a steady state. And it should be watched with the same dashboards as production, so that the test finds the saturating resource, not just a number. Wren runs a short load test against staging on every release and compares p99 and CPU per request with the previous release, failing the pipeline on a regression larger than 10%.

:::story Picture this
A supermarket's tills. Little's law says that if 20 shoppers arrive a minute and each spends 3 minutes at the tills, there are 60 people in the queue area on average. Open fewer tills and each shopper's wait grows, so the crowd grows, without one extra customer coming in. And the queue does not grow gently as the tills get busier. At nine-tenths busy, it explodes.
:::

:::note Benchmarks lie in small ways
Microbenchmarks of one function are distorted by caches, JIT warm-up and the optimiser removing unused results. Use the language's benchmark harness, JMH for Java, `testing.B` for Go, `pytest-benchmark` for Python, run long enough, and confirm improvements with a profile of the real service.
:::

:::warn Watch out
Load tests against small datasets, single endpoints or closed-loop tools that wait for each reply produce reassuring numbers that production will contradict. Test with production-sized data, a realistic traffic mix and a fixed arrival rate, and watch saturation while it runs.
:::

:::interview Interview lens
**"An API is slow. How do you find out why?"** Start from metrics to see the scope, which endpoints, instances and regions, and when it started relative to deploys. Compare layer timings, load balancer total versus upstream, then use a trace to split the service's own time from its dependencies. For dependencies, go to their metrics, `pg_stat_statements` and pool wait times. For the service's own time, take a CPU profile and read the flame graph for wide plateaus, check GC pauses and CPU throttling. Confirm the fix with a load test at a fixed arrival rate on production-sized data.
:::

:::key In one breath
Little's law, L = λW, makes 2,000 requests a second at 50 ms into 100 in flight, so slower requests hold more resources without more traffic, and queueing delay climbs steeply with utilisation, 4 ms at 50% to 40 ms at 95% for 2 ms of work. Find the slow layer by comparing each layer's time, load balancer total against upstream, then traces, then database statistics. Profile CPU with sampling and read flame graphs by width, and use heap, allocation and wall-clock profiles for other questions. GC, syscalls, context switches and CPU throttling add hidden costs, and load, stress, spike and soak tests at fixed arrival rates on realistic data predict behaviour before users find it.
:::

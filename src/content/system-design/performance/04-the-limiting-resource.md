@part IV | CPU-bound, I/O-bound and bottlenecks | We locate the stage that prevents useful completions. Buying capacity for another stage can leave the wait unchanged. We will separate computation from I/O waits, identify bottlenecks, and interpret utilization. | where:4

## 16. CPU-bound work and service demand

A clip transcoder repeatedly calculates new pixel values while the score service mostly waits for reads. A **CPU-bound** workload reaches its capacity through computation. A busy core is useful evidence only when the time is spent on required work rather than avoidable serialization, spinning, or repeated failed attempts.

Suppose each Heron API request needs an illustrative 2 ms of CPU service. At 1,000 requests per second, CPU demand is $1,000\times0.002=2$ CPU-seconds per second, equivalent to two fully occupied cores under ideal scheduling. Four fully available cores imply a service-demand ceiling of $4/0.002=2,000$ requests per second.

That ceiling assumes the work parallelizes and no other stage limits it. Garbage collection, synchronization, compression, and system work can consume capacity outside the timer. A single event loop can saturate one core while a host-level average shows spare cores. Inspect utilization at the thread or execution unit that owns the work.

Optimize the large measured CPU contribution first. Avoid repeating parsing or transformation when the same result can be reused safely. Then remeasure the entire path, because moving the CPU limit may expose the database as the next bottleneck. A capacity improvement is meaningful only when useful throughput or the relevant latency improves.

@fig sd_performance_cpu | Illustrative 2 ms CPU demand at 1,000 requests/s requires two CPU-seconds/s.

## 17. I/O-bound work and useful overlap

A score request can spend most of its time waiting for a remote service while using very little CPU. An **I/O-bound** workload reaches its useful limit through input/output capacity or waiting. Threads and asynchronous tasks let independent requests overlap those waits, but they do not shorten the remote operation itself.

Picture a request issuing a database call and yielding its execution slot. Another request can use that slot while the first waits. When the reply arrives, the scheduler resumes the original task. This increases overlap without reserving a fully active thread for every outstanding operation in an asynchronous design.

The shared dependency still sees all those operations. If it already saturates its storage or pool, raising concurrency puts more work into its queue. The callers look idle because their wait is elsewhere. This is why low application CPU and high user latency can occur together during overload.

Separate waiting for admission, waiting for a socket, waiting for storage, and waiting for a result. Bound simultaneous calls to each dependency, propagate deadlines, and cancel abandoned work. Use overlap until it fills actual service capacity; beyond that, reduce demand or increase the capacity that performs the I/O. The waiting location tells you which action is plausible.

### Network-bound work

A **network-bound** workload reaches its useful limit through data transfer. Heron's illustrative live delivery payload is 200 MB/s, or 1.6 billion bits/s, while a 1-billion-bit/s link cannot carry even that payload alone. More CPU cannot create link capacity; distribute delivery or reduce transferred data where the product permits it.

Distinguish link saturation from CPU spent on compression or encryption. Both involve network responses, but they consume different limiting resources. Inspect transferred bytes, retransmissions, send-buffer waits, and CPU service before choosing a remedy. A slow recipient can also retain a buffer without saturating the whole gateway's link.

@fig sd_performance_bounds | Illustrative compute saturation versus waiting callers; the relevant resource determines the remedy.

## 18. Bottlenecks across a pipeline

Heron's application fleet accepts work faster than a shared database completes it. A **bottleneck** is the stage that limits sustainable throughput for the current workload. It can change when the request mix changes, so there is no permanent answer such as "the database is always the limit."

For serial stages with comparable counted work, path capacity cannot exceed the smallest stage capacity. If one request performs several operations at a stage, divide that stage's capacity by operations per request before comparing it with request throughput. A raw database-operation rate is not directly comparable with an API-request rate.

The limiting stage shows a combination of demand, saturation, and growing wait. A high resource percentage without a queue may simply reflect efficient usage. A queue without high CPU may reveal a lock or downstream I/O limit. Use completion rate and oldest waiting age to confirm that more arriving work does not produce proportional useful completions.

Then change one cause and observe the result. Reducing query page reads addresses storage demand; coalescing replaceable score snapshots addresses fan-out; widening a pool addresses only an admission limit when the database has room. State the predicted metric change before the experiment. A wrong prediction teaches you which stage you misunderstood.

@fig sd_performance_bottleneck | Illustrative pipeline capacity belongs to the whole path and its per-request service demands.

:::story Picture this
A packing line has people selecting items, one person sealing boxes, and people carrying boxes away. Adding carriers does not help when every completed box waits at sealing. Time the queue and completions at each station before hiring for the wrong one.
:::

## 19. Utilization and queueing near saturation

A worker that is busy most of the time seems productive, yet its queue grows after small bursts. **Utilization** is the fraction of service capacity in use at the resource being measured. A mean utilization value can hide uneven shards or intervals where arrivals exceed capacity.

A simplified M/M/1 queue assumes independent Poisson arrivals, exponential service durations, a single server, and a stable arrival rate below service rate. This is a teaching model, not a measurement claim about Heron. With arrival rate $\lambda$ and service rate $\mu$, utilization is $\rho=\lambda/\mu$.

$$W=\frac{1}{\mu-\lambda}$$

Read this as: mean time in the model's system $W$ is the reciprocal of service rate $\mu$ minus arrival rate $\lambda$. For $\mu=1,000$ operations per second, arrival rates of 500, 900, and 990 give mean times of 2, 10, and 100 ms. All include the model's queue wait and service.

The mechanism matters more than fitting this equation blindly. When little spare service remains, a random burst takes longer to clear while new work keeps arriving. Real service-time variance, lock contention, and scheduling can alter the curve. Load-test the shape for your own workload and reserve capacity based on the tail objective you actually need.

@fig sd_performance_queue_curve | Computed M/M/1 examples under the stated assumptions; these are not measured production latencies.

## 20. Finding a limit with a load test

A single test at one request rate cannot show where a system begins losing control of its queue. Increase offered load in stages while holding the workload mix and data set explicit. The purpose is to connect each rate with completions, latency distribution, resource usage, and waiting state.

For Heron, warm score reads, cold score reads, writes, and live deliveries use different resources. Test their individual paths, then their expected mixture. Keep payload sizes and key popularity realistic. Uniform random keys may hide a hot match; repeatedly querying one key may exaggerate a cache hit rate that users do not receive.

Watch whether throughput plateaus while queue age increases. This identifies an offered-load increase that creates waiting rather than useful work. Repeat the relevant interval with a failed application server, cold cache, or slow dependency when that condition is part of the design's promise. Keep the failure in place long enough to inspect recovery behavior.

Record what the load generator itself cannot sustain. Client CPU, sockets, or network limits can cap offered load before Heron saturates. A useful result states its boundaries and conditions, then names the next uncertain assumption. It is evidence for a particular workload, not a timeless capacity label for a machine.

@fig sd_performance_loadtest | Illustrative experiment records offered work, useful completions, and queue age together.

:::warn Watch out
A low fleet CPU average can hide one saturated core, one hot partition, or many callers waiting for a shared resource. Inspect the distribution and the waiting reason before concluding that capacity is available.
:::

:::note Queue-model boundaries
The M/M/1 formula assumes specific arrival and service distributions. Heavy-tailed work and correlated arrivals can behave differently. Use it to explain spare service, then use measurements to size the actual path.
:::

:::interview Interview lens
**"CPU is low but latency is high. What do you inspect?"** I split the trace into admission, pool acquisition, query, lock, storage, and network waits. Then I compare offered rate, useful completions, and queue age at the waiting stage. Increasing threads helps only if it fills unused service capacity; it cannot repair a saturated shared dependency.
:::

:::key In one breath
CPU service demand gives a compute bound, while I/O overlap fills waits until a shared dependency saturates. The bottleneck is workload-specific and must use comparable units. Near saturation, little spare service remains to clear bursts. Load tests should expose queues, completion plateaus, hot ownership, and behavior during the failure you promise to tolerate.
:::

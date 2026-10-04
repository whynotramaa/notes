from author import publish
raw=r'''
@part Demand and completion | We count how much work arrives and how long it stays. A busy server can still be slow for every user. We will distinguish latency, throughput, and concurrent work.

## Latency versus throughput

A viewer waits for one score response; the service completes many viewers' requests together. **Latency** is elapsed time for an operation. **Throughput** is completed work per unit time. An asynchronous server can have high throughput while individual requests wait in a queue. State whether you count successful completions, all attempts, or useful work after deduplication.

Heron's daily workload gives $8,640,000/86,400=100$ requests per second on average. The assumed peak multiplier gives 1,000 requests per second. A daily average cannot size a match-start burst. Describe the peak duration and arrival shape as well as the multiplier.

@draw demand | bars | ILLUSTRATIVE DAILY AVERAGE AND PEAK | [["average",100,"req/s"],["peak",1000,"req/s"]] | Computed from the illustrative daily count and peak multiplier. | the average hides the match-start burst

## Concurrency and Little's law

The server has idle keep-alive sockets and requests currently waiting for results. Count the latter as **concurrency**, or work in progress. For a stable system over a consistent observation window, **Little's law** connects mean work in progress, mean throughput, and mean time in the system.

$$L=\lambda W$$

Read this as: mean concurrent work $L$ equals completion rate $\lambda$ times mean duration $W$. Heron's assumed 1,000 requests per second and 0.2 s mean duration give 200 concurrent requests. The formula uses means, not p99 latency. In a queue growing without bound, a steady-state calculation does not describe a sustainable operating point.

@draw concurrency | flow | THE UNITS CANCEL TO REQUESTS | ["1,000 requests/s","0.2 seconds","200 requests"] | Illustrative steady-state concurrency. | use the mean, not a percentile

:::story Picture this
A cafe serves customers at a steady rate. The number inside includes people waiting and people eating. Faster arrivals or longer visits put more people inside even when the number of tables stays fixed.
:::

:::key In one breath
Latency measures one operation's elapsed time. Throughput measures completed work per time. Little's law connects mean throughput and mean duration to mean concurrency in a stable system. Count peaks and useful completions separately from daily averages and retry attempts.
:::

@part The tail of the distribution | We inspect the users hidden by an average. A small slow fraction can dominate a multi-call page. We will compute percentiles and then reason about fan-out.

## p50, p95, and p99

Most score reads are fast, but a few wait on disk. A **percentile** reports a value below which a chosen fraction of observations lies. A **p99** latency is the value at the 99th percentile; it is not the mean of the slowest requests. Specify the estimator and window when comparing results.

Use an illustrative sorted sample with 50 observations at 5 ms, 45 at 40 ms, four at 100 ms, and one at 200 ms. The nearest-rank method takes rank $\lceil qn\rceil$ for fraction $q$ and sample count $n$. Ranks 50, 95, and 99 give p50 of 5 ms, p95 of 40 ms, and p99 of 100 ms. A small sample makes the tail unstable.

@draw tail | bars | ILLUSTRATIVE NEAREST-RANK PERCENTILES | [["p50",5,"ms"],["p95",40,"ms"],["p99",100,"ms"]] | Computed from the explicitly specified 100-observation sample. | averages do not show who waited

## Fan-out and tail amplification

A page asks several services and waits for the slowest one. Even if each service is usually fast, the page has more chances to encounter a slow call. If $n$ independent calls each finish within a threshold with probability $p$, all finish within it with probability $p^n$. Independence is an assumption; shared dependencies can create correlated failures.

Hedging sends a duplicate after a delay to reduce some long waits, but adds work and requires duplicate-safe reads or effects. Start by removing unnecessary fan-out and measuring the slow dependency. Do not promise a page p99 by adding the p99 values of independent hops; quantiles do not generally add that way.

@draw fanout | fan | THE PAGE WAITS FOR ITS LAST DEPENDENCY | {"source":"page request","targets":["score returns","profile returns","clip still waiting"]} | An illustrative fork of one request. | the last reply determines the finish

:::warn Watch out
Averaging per-instance p99 values does not produce the fleet p99. Merge observations or compatible histogram buckets before computing the fleet quantile.
:::

:::key In one breath
Percentiles describe positions in an observed distribution. Nearest-rank percentiles need a stated sample and window. Fan-out adds opportunities to hit a slow dependency, and shared dependencies can correlate those delays. Measure the distribution before proposing duplicate work.
:::

@part Bytes and storage operations | We count the resources that carry the work. Request rate alone cannot size a disk or network. We will distinguish bandwidth from IOPS and account for record storage.

## Bandwidth and network-bound work

A tiny score response and a video upload consume very different links. **Bandwidth** is a data rate, measured in bytes or bits per second. A **network-bound** workload spends its limiting resource on data transfer rather than computation. Protocol overhead and retransmissions make wire traffic larger than payload traffic.

Heron's peak API payload is $1,000\times2,000=2,000,000$ bytes per second, or 16,000,000 bits per second. Its live path emits $20\times50,000=1,000,000$ deliveries per second; at 200 bytes each, that is 200,000,000 payload bytes per second. Replication between gateways and external viewer delivery are separate traffic paths.

@draw bandwidth | bars | ILLUSTRATIVE PAYLOAD BY PATH | [["API",2,"MB/s"],["live viewers",200,"MB/s"]] | Decimal MB, before headers and retransmission. | delivery count is not API request count

## IOPS and the shape of disk work

A disk can move a large sequential file while struggling with many small random reads. **IOPS** is the number of input/output operations completed per second. Operation size, read/write mix, locality, durability requirements, queue depth, and cache hits decide what that number means. A database query can cause several physical operations or none when pages are cached.

For an illustrative write-heavy capacity exercise, each daily request stores a 500-byte record. That gives 4,320,000,000 bytes per day, 129,600,000,000 bytes over 30 days, and 388,800,000,000 bytes with three copies. Indexes, page slack, WAL, backups, and deletion lag are extra. This is a distinct assumed write workload, not a claim that every score read writes a row.

@draw storage | bars | ILLUSTRATIVE LOGICAL AND REPLICATED STORAGE | [["one copy",129.6,"GB"],["three copies",388.8,"GB"]] | Computed decimal bytes, excluding database overhead. | count the physical work, not just rows

:::key In one breath
Bandwidth measures bytes per time and IOPS measures operations per time. Operation size and access pattern connect them. Heron's API and live paths have different traffic counts. Storage estimates begin with logical records and then add copies, indexes, logs, and operational headroom.
:::

@part The limiting resource | We identify the resource that stops the system from going faster. Adding the wrong capacity changes cost without changing throughput. We will distinguish CPU work, I/O waiting, and shared bottlenecks.

## CPU-bound versus I/O-bound

A transcoder spends time computing frames; a score read may spend time waiting for a disk page. A **CPU-bound** workload saturates compute capacity. An **I/O-bound** workload waits on input or output. Inspect utilization and wait reasons together: low CPU can accompany long queues for locks, pools, or network calls.

Asynchronous I/O helps a process overlap independent waits. It does not make the disk or remote service faster. More threads can increase useful overlap until a shared resource saturates; beyond that they add queues and scheduling work. Measure at the component that owns the wait, not only at the caller.

@draw bounds | split | DIFFERENT WAITS NEED DIFFERENT FIXES | [["compute limit","busy cores\noptimize or add compute"],["I/O wait","waiting callers\nbound overlap and inspect I/O"]] | Illustrative workload classes, not measured capacities. | idle CPU does not prove spare capacity

## Bottlenecks and utilization

If applications can accept more work than the database completes, the database decides sustainable throughput. A **bottleneck** is the limiting stage for the workload. **Utilization** is the fraction of a resource's service capacity in use. Average utilization hides burst concentration and uneven shards.

For a simple queue with arrival rate $\lambda$ and service rate $\mu$, stability requires $\lambda<\mu$. As utilization $\rho=\lambda/\mu$ approaches one, small bursts take longer to clear. The M/M/1 model gives mean system time $1/(\mu-\lambda)$ under Poisson arrivals and exponential service; do not apply that model to arbitrary measured traffic without checking its assumptions.

@draw bottleneck | flow | THE SLOWEST SHARED STAGE LIMITS COMPLETIONS | ["many callers","app admission","DB service limit","bounded result rate"] | Illustrative pipeline. | capacity is a property of the whole path

:::interview Interview lens
**"CPU is low but latency is high. What do you inspect?"** I look for pool acquisition, locks, disk and network waits, and queue growth. I separate arrival rate from successful completion rate. Low CPU does not mean the dependency has spare capacity.
:::

:::key In one breath
CPU work and I/O waits need different remedies. Concurrency can overlap waits but cannot create dependency capacity. The bottleneck limits sustainable completions. Queueing becomes sensitive near saturation, so size for bursts and failures as well as average utilization.
:::

@part Scaling and serial work | We ask which work can run in parallel. A larger fleet cannot speed up a serial dependency without limit. We will compare vertical and horizontal scaling and compute Amdahl's law.

## Vertical versus horizontal scaling

Heron can use a larger database machine or distribute independent application requests across machines. **Vertical scaling** gives one machine more resources. **Horizontal scaling** adds machines and divides work. Vertical scaling keeps coordination simpler but has a machine ceiling; horizontal scaling introduces routing, state placement, and coordination costs.

Stateless requests spread easily when state lives behind a shared contract. A hot database row or one ordered event partition does not become parallel merely because more callers exist. Partition only after naming the independently executable unit, and account for cross-partition operations.

@draw scaling | split | WHERE THE CAPACITY IS ADDED | [["vertical","one larger worker\nshared state stays local"],["horizontal","several workers\nstate and routing need a plan"]] | Illustrative scaling choices. | first identify independent work

## Amdahl's law

Suppose an illustrative job spends 20% of its time in a serial step and 80% in parallel work. **Amdahl's law** bounds speedup when the parallel portion gets more workers, assuming fixed work and no added overhead.

$$S(n)=\frac{1}{s+(1-s)/n}$$

Read this as: speedup $S$ with $n$ workers is the reciprocal of serial fraction $s$ plus the parallel fraction divided by workers. With $s=0.2$, four workers give 2.5 times speedup and eight give 3.3333 times, rounded to four decimals. Even unlimited workers approach a bound of five times. Communication and contention can make measured speedup worse.

@draw amdahl | bars | ILLUSTRATIVE SPEEDUP WITH A SERIAL FRACTION | [["four workers",2.5,"times"],["eight workers",3.3333,"times"],["limit",5,"times"]] | Computed for a fixed 20% serial fraction; displayed values are rounded. | parallelize the part that consumes time

:::key In one breath
Vertical scaling enlarges one machine; horizontal scaling divides work across machines. Independent work is the prerequisite for useful distribution. Amdahl's law exposes a fixed serial bound. More workers can add coordination cost while leaving the serial bottleneck unchanged.
:::

@part Queue growth and backpressure | We make overload visible instead of storing it forever. A queue can absorb a burst but cannot repair a sustained capacity deficit. We will count backlog and control admission.

## Backlog and drain time

Assume 1,200 jobs arrive per second while workers complete 1,000 for 60 s. The backlog grows by $(1,200-1,000)\times60=12,000$ jobs. When arrivals fall to 600 per second, spare service is 400 jobs per second, so clearing that backlog takes $12,000/400=30$ s under the stated constant-rate assumptions.

A **queue** stores waiting work. Its length is useful, but oldest-job age is often closer to the user promise. Give the queue a capacity, an expiry policy, and a clear rejection behavior. Otherwise storage becomes the hidden limit and stale work consumes recovery capacity.

@draw backlog | bars | ILLUSTRATIVE BURST AND RECOVERY | [["arrival during burst",1200,"jobs/s"],["service",1000,"jobs/s"],["arrival after burst",600,"jobs/s"]] | The computed backlog is 12,000 jobs and drain time is 30 s. | drain rate is service minus new arrivals

## Backpressure and admission control

A slow downstream stage should make the upstream stage reduce useful work entering it. **Backpressure** communicates that capacity is limited, through bounded queues, flow-control credits, blocked producers, or explicit rejection. **Admission control** decides whether to accept a new operation before spending its full cost.

Heron can reject excess reads, coalesce replaceable score snapshots, and reserve a separate budget for scorer writes. Blocking every request on one unbounded queue hides overload until timeouts synchronize. Choose whether each work class can wait, be dropped, or must be persisted; a payment command and a stale thumbnail fetch should not share an unquestioned policy.

@draw pressure | flow | CAPACITY FEEDBACK MUST REACH THE PRODUCER | ["producer","bounded queue","worker limit","reduce admission"] | Illustrative feedback policy. | overload needs an explicit response

:::warn Watch out
A queue that is almost full is not spare capacity. Its accumulated wait may already exceed the request's useful deadline.
:::

:::key In one breath
Backlog grows at arrival rate minus service rate. Drain time uses spare service after new arrivals. Bounded queues make the waiting cost explicit. Backpressure and admission policies must reach the actor that can reduce demand.
:::

@part A complete capacity argument | We turn arithmetic into a design claim. A calculation without its assumptions is impossible to review. We will size Heron's path and state what still needs measurement.

## Failure capacity and headroom

Assume five application servers each sustain 300 requests per second for this workload. Normal capacity is 1,500; losing one leaves 1,200 against a 1,000-request peak. The spare 200 is a capacity budget, not proof that latency targets hold. A shared database can still cap the fleet below this rate.

**Headroom** is capacity intentionally left unused for bursts, failures, and variance. Verify the failed-node workload with a load test, realistic response sizes, and the actual dependency limits. Do not put all replicas in a failure domain that can disappear together.

@draw headroom | bars | ILLUSTRATIVE ONE-SERVER FAILURE BUDGET | [["peak demand",1000,"req/s"],["one lost",1200,"req/s"],["all available",1500,"req/s"]] | Capacities are illustrative assumptions; totals are computed. | test the path while a component is missing

## One request, several resource counts

The same peak gives 200 concurrent API requests, 2 MB/s of API payload, and a separate live workload of 1,000,000 deliveries per second. If the write-capacity scenario retains every assumed record, three copies consume 388.8 GB before overhead. A cache must count keys and entry overhead rather than borrowing the database byte total.

| Count | Input | Computed result |
|---|---|---|
| API concurrency | Rate times mean latency | 200 requests |
| API payload | Rate times response size | 2 MB/s |
| Live delivery | Events times viewers | 1,000,000 deliveries/s |
| Live payload | Deliveries times event size | 200 MB/s |
| Cache entries | 100,000 times 2,100 bytes | 210 MB |

@draw budget | rows | KEEP THE UNITS BESIDE THE NUMBERS | [["API","1,000/s","200 active"],["live","20 events/s","50,000 viewers"],["cache","100,000 keys","210 MB"]] | All values are illustrative inputs or computed from them. | different resources have different units

:::note The next boundary
This unit sizes requests and waits. The database unit explains what an index lookup, transaction, lock, and durable write actually do with those resources.
:::

:::key In one breath
Capacity arguments connect a workload to specific resource counts. Headroom must survive the chosen failure and meet the latency objective. Separate useful work, retries, payload bytes, stored bytes, and connections. Every calculated total is a hypothesis to test against the actual path.
:::
'''
qa=[('Latency or throughput?','Latency is one operation\'s elapsed time; throughput is completed work per unit time. High concurrency can improve throughput while increasing waiting.'),('When does Little\'s law apply?','Use consistent boundaries and stable mean measurements. It does not turn an overloaded, growing queue into a sustainable operating point.'),('Why is the daily average insufficient?','A concentrated burst can exceed capacity despite a modest average. Specify peak shape and duration.'),('What does p99 mean?','It is a position in an observed distribution, with a stated estimator and window. It is not the mean of the slowest requests.'),('Can you average p99 values?','No. Combine observations or compatible histograms, then compute the quantile.'),('Why does fan-out affect tail latency?','The request waits for several chances to be slow. Independence and shared dependencies determine the combined probability.'),('Bandwidth or IOPS?','Bandwidth counts bytes per time; IOPS counts operations per time. Operation size and access pattern connect them.'),('Why can CPU be low during overload?','The limiting work may wait on disk, network, locks, or pools. Inspect waits and queue age.'),('What does horizontal scaling require?','A unit of work that can execute independently. Shared ordered state still needs coordination.'),('What does Amdahl\'s law assume?','A fixed workload with a fixed serial fraction and ideal parallel work. Communication overhead can lower measured speedup.'),('Can a queue solve sustained overload?','No. When arrivals exceed completions for long enough, backlog grows until a limit is hit.'),('What is the recovery drain rate?','Service capacity minus new arrivals. Dividing by total service capacity understates recovery time.'),('What does backpressure do?','It communicates downstream limits to the actor producing work. Bounded queues and rejection make overload visible.'),('What must a sizing argument include?','Workload, mean and tail objectives, resource counts, failure capacity, and measurements that could disprove its assumptions.')]
ex=[('●','Compute average and peak QPS.','8,640,000/86,400=100; multiplying by 10 gives 1,000.'),('●','Compute mean API concurrency.','1,000 requests/s times 0.2 s gives 200 requests.'),('●','Compute API payload bits per second.','1,000 times 2,000 times 8 gives 16,000,000 bits/s.'),('●','Compute live payload bytes per second.','20 times 50,000 times 200 gives 200,000,000 bytes/s.'),('●','Compute three-copy retained record storage.','8,640,000 times 500 times 30 times 3 gives 388,800,000,000 bytes.'),('●','Compute the specified cache size.','100,000 times the sum of 2,000 payload and 100 overhead bytes gives 210,000,000 bytes.'),('●●','Find p50, p95, and p99 of the specified sample.','Nearest ranks are 50, 95, and 99. Their observations are 5, 40, and 100 ms.'),('●●','Compute the burst backlog and recovery time.','The deficit is 200 jobs/s for 60 s, giving 12,000 jobs. Spare recovery capacity is 400 jobs/s, so drain time is 30 s.'),('●●','Compute surviving application capacity.','Four surviving servers times 300 gives 1,200 requests/s, leaving 200 above peak.'),('●●','Explain low CPU and high latency without equations.','A dependency or shared lock can keep callers waiting while their cores are idle. Inspect the waiting stage and its queue.'),('●●●','Derive the Amdahl bound for the example.','Normalize original duration to one. Serial time is 0.2 and parallel time is 0.8/n, so speedup is their sum\'s reciprocal. Four workers give 2.5, eight give 3.3333 rounded, and the limit is 5.'),('●●●','Defend an admission policy for scorer writes and replaceable score snapshots.','Reserve a bounded durable path for valid writes. Coalesce obsolete snapshots and reject excess reads before consuming the write budget; measure both oldest-job age and useful completions.')]
publish(2,'performance','Counting work and waiting',['Work and','Waiting'],'Latency, tail distributions, bandwidth, IOPS, concurrency, queueing, bottlenecks, scaling, and overload with computed capacity budgets.','Explain which resource limits a design and show how it behaves during a burst or a server failure.',raw,qa,ex,[('Little\'s law paper','https://doi.org/10.1287/opre.9.3.383','The relationship between mean inventory, arrival rate, and time.'),('The tail at scale','https://research.google/pubs/the-tail-at-scale/','Tail latency in fan-out services.'),('Amdahl\'s original paper','https://doi.org/10.1145/1465482.1465560','The serial limit to parallel speedup.')])

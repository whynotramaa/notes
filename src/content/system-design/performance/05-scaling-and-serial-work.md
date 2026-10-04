@part V | Scaling and Amdahl's law | We ask which work can run independently. A larger fleet cannot remove a serial dependency by itself. We will compare scaling directions, expose state placement, and calculate the bound from serial work. | where:5

## 21. Vertical versus horizontal scaling

Heron can move a database to a larger machine or add application instances. **Vertical scaling** gives a machine more resources. **Horizontal scaling** distributes work across more machines. Each solves a capacity problem only when the added resource serves the limiting work.

A larger machine keeps local state and coordination in one place. It can enlarge memory for cached pages, add compute, or provide stronger storage. Its limits include the available machine size, the downtime or migration needed to change it, and the consequences of losing that machine. A single hot lock can remain serial on a larger host.

More application instances distribute independently executable requests. They introduce load routing, connection budgets, deployment coordination, and more copies of local state. When state is shared in a database, the database must absorb the combined demand. Adding callers can therefore worsen the exact bottleneck you hoped to remove.

Choose the smallest change that addresses measured demand. If page misses are the limit and a larger memory tier contains the working set, vertical scaling may be enough. If independent application CPU work is the limit, additional instances may distribute it. Explain the failure behavior and state boundary alongside the capacity benefit.

@fig sd_performance_scaling | Illustrative scaling choices; their usefulness depends on the measured limiting resource.

## 22. Stateless requests and shared state

A load balancer sends successive score reads to different Heron workers. A **stateless request handler** can complete a request using its input and shared services without requiring an earlier request to have reached the same worker. This property makes routing and replacement simpler, but the system still has state somewhere.

Move durable score records and session validation behind explicit shared contracts. Local caches may differ temporarily, so define how stale they may be and how they refresh. A worker can disappear without deleting the authoritative score. Its in-flight requests may still need retry or cancellation handling.

Now count the shared limits. Five illustrative instances with 20 database pool slots each offer 100 simultaneous operations. Doubling application instances while leaving per-instance pools unchanged doubles that offered concurrency. The database does not gain service capacity merely because the callers became easier to replace.

State placement also controls failure blast radius. A per-worker live connection belongs to that worker until reconnect; it cannot become stateless by naming the application tier stateless. A gateway needs reconnect and subscription recovery rules. State which parts can move freely and which require replay, reattachment, or coordination.

@fig sd_performance_shared_pool | Illustrative five instances contribute 100 shared database pool slots in total.

## 23. Partitioning and hot work

One match attracts most of Heron's viewers while other matches are quiet. **Partitioning** divides data or work into separately owned subsets. It can make independent owners scale, but one popular key can still overload its owner while the fleet average looks comfortable.

Choose the unit that can run independently. Different matches may have independent score histories, while events within a single match need an order. Adding partitions for quiet matches does little for one match's write sequence. Viewer delivery, however, can distribute recipients across gateways without reordering the authoritative match updates.

Splitting a hot key changes the read plan. A latest-score value is easy to replicate as a derived read copy; an ordered event history may need multiple ranges merged or a sequencer retained. Count the extra messages and define which owner enforces the invariant. Distribution changes the work as well as the location.

A cache or replica can spread reads when staleness permits. Writes that update one invariant need a coordination rule even when clients run everywhere. Explain which part of the operation is parallel and which must remain ordered. That answer determines whether horizontal scaling is possible or only creates more contention.

@fig sd_performance_hotkey | Illustrative independent matches and one hot match show why average fleet capacity can mislead.

:::story Picture this
Adding checkout counters helps customers buying separate baskets. It does not let several cashiers independently edit the same unfinished receipt without agreement. The work boundary decides what can be parallel.
:::

## 24. Amdahl's law, step by step

An illustrative Heron maintenance job takes 100 ms on one worker. It spends 20 ms in a serial step and 80 ms in work that can divide perfectly across workers. **Amdahl's law** bounds speedup for a fixed workload with that unchanged serial fraction.

With four workers, parallel work takes $80/4=20$ ms, so total time is $20+20=40$ ms. Speedup is $100/40=2.5$. With eight workers, parallel work takes 10 ms, total time is 30 ms, and speedup is 3.3333, rounded to four decimals. The serial 20 ms does not divide.

$$S(n)=\frac{1}{s+(1-s)/n}$$

Read this as: speedup $S$ with $n$ workers is the reciprocal of serial fraction $s$ plus parallel fraction $1-s$ divided by worker count $n$. Here $s=0.2$. With unlimited ideal workers, parallel time approaches zero and speedup approaches $1/0.2=5$.

The model omits added communication, scheduling, and contention, so measured speedup can be worse. It also assumes the same job rather than a larger workload. Increasing throughput by processing more independent jobs is a different question from shortening one job's serial critical path. State which outcome the calculation predicts.

@fig sd_performance_amdahl | Computed fixed-work speedups for illustrative serial fraction 0.2.
@fig sd_performance_amdahl_trace | Illustrative 100 ms job becomes 40 ms with four workers and 30 ms with eight.

## 25. Reducing the serial fraction

After adding eight workers, the maintenance job still spends most of its remaining duration in the serial step. More workers have diminishing benefit because they reduce the smaller remaining parallel component. The next useful action is to inspect why the serial step exists.

Some order is essential, such as applying one match's updates in sequence. Other serial work comes from an avoidable shared lock, repeated setup, or a central queue. Separate the invariant from its current implementation. Sharding independent match ownership can preserve each match's order without serializing unrelated matches together.

For a second illustrative fixed-work comparison, reduce the serial fraction to 0.1 while keeping normalized one-worker work equal to one. With eight ideal workers, speedup becomes $1/(0.1+0.9/8)=4.7059$, rounded to four decimals. This illustrates the effect of the fraction; it does not claim an implementation change costs no work.

Measure the revised job from start to finish. Removing a lock can add coordination elsewhere, and splitting work can increase total CPU even when wall time improves. Keep wall-clock duration, total service demand, and useful throughput as separate outcomes. The fastest design for one request is not automatically the least expensive design for a whole workload.

@fig sd_performance_serial_reduction | Computed normalized speedups at eight workers, with illustrative serial fractions 0.2 and 0.1.

:::warn Watch out
Amdahl's law describes a fixed job and ideal parallelization. Do not use it to claim that a cluster's total throughput must have the same bound when it processes independent jobs. Identify the shared serial resource first.
:::

:::note The historical result
Gene Amdahl presented the serial-limit argument in his 1967 paper on approaches to large-scale computing. The lasting design question is where a fixed job must wait for ordered work. [Original paper record](https://doi.org/10.1145/1465482.1465560).
:::

:::interview Interview lens
**"Why did doubling the application fleet barely help?"** I check whether the added workers serve independent work or call the same constrained state owner. I compare connection budgets and hot-key demand with the shared dependency's useful completions. Then I distinguish shortening one request's serial path from processing more independent requests.
:::

:::key In one breath
Vertical scaling enlarges a machine and horizontal scaling distributes independent work. Stateless handlers still depend on state owners and shared resource budgets. Partitioning helps only when the work boundary permits independence. Amdahl's law explains the fixed-job serial bound, so a useful optimization may reduce shared serial work instead of adding callers.
:::

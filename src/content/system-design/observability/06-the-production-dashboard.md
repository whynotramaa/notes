@part VI | Dashboards and golden signals | We inspect the signals that narrow a failure. Resource graphs alone do not reveal user harm. We will connect request rates, latency, saturation, queues, and caches. | where:6

## 21. Traffic and useful completion

Compare offered traffic with completions after a routing change. A retry storm can leave logical user demand unchanged while attempt traffic rises; separate attempt identity from business identity before concluding that popularity caused the extra load.

The admitted request rate is steady, but successful replies fall. The difference may be timeouts, rejections, or accumulating work. **Throughput** counts completions per time; request arrival rate counts offered work. Charting both reveals whether the service is keeping up.

At Heron’s peak the offered rate is 1,000 attempts per second. Count accepted, rejected, and completed attempts separately, then compare the difference with in-flight requests and queue growth. Retries can raise arrivals even when logical commands are unchanged. Split read and write paths because a read-heavy aggregate can hide failing scorer writes. The dashboard’s first row should reveal the user-visible change before it asks the operator to interpret CPU graphs.

Consider a client that times out after the server commits and repeats the same command. Arrival counters observe extra attempts even though the idempotency lookup returns the existing result and no additional score change occurs. A dashboard that labels attempt traffic as new business demand would encourage capacity planning against the wrong population. Conversely, a business-only chart would conceal the load of those repeated attempts. Compare the admitted and completed attempt streams with in-flight work, then inspect the business outcome stream separately. A rise in retries can be both a consequence of latency and a source of further saturation.

@fig sd_observability_21 | Illustrative traffic and useful completion. Offered attempts and useful completed outcomes reveal different consequences of retries. Orange marks useful completions, which can diverge from offered attempts.

A service that sheds work can keep latency low for admitted requests while rejecting most users. Put admission loss beside latency.

:::story Picture this
A shop manager counts people entering, purchases completed, and customers still waiting. A busy doorway does not prove that the shop is serving people, because a blocked checkout can turn arrivals into a queue. The useful measure follows the result the customer came for, alongside the work offered.
:::

## 22. Error rates and weighted aggregation

A failed regional health route can reduce the measured denominator by keeping requests away from that region. Show rejected or unroutable demand separately so a healthier aggregate does not hide users whose requests never reached the counted handler.

One region serves 900 requests and fails nine; another serves 100 and fails ten. Their error percentages are one percent and ten percent. Averaging these gives 5.5 percent, but the fleet actually fails 19 of 1,000 requests, or 1.9 percent.

A **weighted aggregate** preserves each population’s contribution. Add compatible failed counts and compatible attempt counts, then divide. Read the calculation aloud: all failed eligible requests divided by all eligible requests. Keep the region view too, because the fleet ratio can hide severe harm in the smaller region. If error eligibility differs between regions, normalize definitions before aggregation rather than applying weights to incompatible measurements.

The small region contributes less weight to the fleet but can still be the region where intervention is urgent. In the example, the fleet result of 1.9 percent comes from 19 failures across the full 1,000 requests. Preserve the regional counts beside that result so the ten-percent regional failure remains visible. If routing moves clients elsewhere, track the routing rejection or delay as well as the receiving region's application errors. A lower aggregate failure fraction after evacuation does not establish recovery for stranded users. The service promise determines whether success is judged by request population, region, or another bounded group.

@fig sd_observability_22 | Illustrative error rates and weighted aggregation. The fleet fraction uses total failed requests divided by total eligible requests. Orange marks the traffic-weighted fleet fraction.

A fleet target can pass while one tenant’s entire workload fails. Choose whether the promise concerns requests, users, regions, or another population.

:::note Weighted error denominators
Aggregate numerator and denominator before dividing. Retain bounded regional and operation views to detect concentrated failures, and use the same eligibility definition everywhere.
:::

## 23. CPU, memory, and saturation

A CPU chart is high while request latency stays within its target. Another service has quiet CPU but requests wait for a database connection. **Saturation** means demand is pressing against a resource limit, usually creating waiting or lost work.

Measure utilization with wait time and completions. CPU utilization can show busy cores, but runnable work and throttling reveal whether work is waiting. Memory occupancy can be intentional caching; allocation growth, collection pauses, and out-of-memory kills give different evidence. A database pool with 32 busy slots out of 40 has occupancy 0.8, yet the wait distribution determines whether that occupancy harms requests. For each resource, identify its limiting unit and the queue that forms before it.

Follow quiet CPU during a database incident. Requests wait for slots rather than execute application instructions, so CPU can fall even as end-to-end latency rises. If the database then slows, each acquired slot stays busy longer and the pool queue grows. Increasing the pool admits more simultaneous queries but may lengthen database execution further. Compare acquisition wait with execution time and the dependency's completion rate before changing concurrency. Memory has similar ambiguity when queued requests retain payloads during that wait. The resource graph explains the incident only when its state connects to the actual request path and queue.

@fig sd_observability_23 | Illustrative cPU, memory, and saturation. Resource limits turn demand into waiting or rejection before users see the delay. Orange marks the user-visible delay caused by the resource limit.

Increasing a connection pool can move waiting into the database and make it slower. Size the dependency’s sustainable concurrency rather than treating every queue as a reason to add callers.

:::warn Watch out
Use resource measurements to explain a symptom. For CPU inspect runnable work and throttling; for memory inspect growth and pauses; for pools inspect acquisition waits. A high percentage is not an incident by itself.
:::

## 24. Queue age, depth, connections, and cache hits

The notification queue has many records, but its oldest item is young because workers are catching up. Later its depth stays flat while the oldest item grows because one poison message keeps retrying. **Queue age** measures waiting experienced by work; depth measures how much work is present.

Track both, with arrival, successful processing, retry, and dead-letter rates. Track database acquisition delay beside open and busy connections. For the cache, 900 hits and 100 misses give a hit ratio of 900 divided by 1,000, or 0.9. A high global ratio can hide a hot key that always misses or a write path that returns stale data. Count miss load reaching the database, not only cache lookups, because coalescing can combine several misses into one dependency request.

A queue depth can stay constant while workers repeatedly fail the same item. Arrival and removal counts appear balanced, yet that item's oldest age rises and no useful effect commits. Record retry attempts separately from effect completions so the dashboard exposes this state. For reads, coalesced cache misses can generate less database work than the raw miss count, while a cache outage can erase that protection. Compare the miss-load stream with connection acquisition waiting, then inspect returned versions for freshness. The illustrated hit fraction of 0.9 describes reuse frequency; it alone proves neither acceptable data age nor sufficient source capacity.

@fig sd_observability_24 | Illustrative queue age, depth, connections, and cache hits. Queue age, pool wait, and cache hits describe separate resource boundaries. Orange marks the cache hit fraction, which must be read alongside source load and freshness.

A retry queue can look busy while useful progress is zero. Count successful effects separately from processing attempts.

:::interview Interview lens
**"Which measurements help diagnose queues, pools, and caches?"** Combine queue depth with age and completion rates, pools with acquisition waits, and hit ratio with dependency load and freshness. Each pairing connects an internal quantity to the effect it can explain.
:::

:::key In one breath
Start with traffic, errors, and latency. Use CPU, memory, queue age, connections, and cache misses to explain a change. Compare like-for-like populations and include missing-data status.
:::

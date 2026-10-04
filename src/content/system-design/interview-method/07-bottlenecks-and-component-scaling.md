@part VII | Bottlenecks and scaling | We change the component that limits useful work. Scaling every box wastes time and can add coordination. We will inspect resource limits, cache loss, queue recovery, and key skew. | where:7

## 25. Bottleneck identification

Read delay rises while CPU is quiet. The service can be waiting for storage or connections rather than computation. **Capacity** is sustainable useful work under a specified workload and objective, not a hardware label.

Inspect CPU work, storage operations, network bytes, pool acquisition, and queue age. Name the limiting unit, such as queries per second at a latency target or bytes per second on a link. A benchmark from a different record size or query mix does not establish Heron’s capacity. Change one relevant mechanism and verify the result under the same workload. Vertical resources can help until the workload’s serial or external limit dominates; horizontal copies help only the work that can be distributed safely.

A slow read may wait for a pool slot, execute an expensive query, or spend time delivering its response. Each case predicts different evidence and suggests a different change. Record acquisition and execution separately, inspect request traces, and compare useful completion under the same offered workload. A larger pool can shift waiting into the database; another API instance can multiply source concurrency; a cache can reduce repeated reads while increasing cold-path risk. Explain the measurement expected to improve after the chosen change. That prediction makes the architecture decision reviewable rather than a list of familiar scaling products.

@fig sd_interview_method_25 | Illustrative bottleneck identification. The chosen scaling change addresses an identified waiting resource. Orange marks a mechanism change assessed under the same workload.

Adding workers can increase contention at an already saturated database and reduce useful throughput.

:::story Picture this
A kitchen can be slowed by one oven, one prep table, or a shortage of plates. Adding cooks does nothing while the oven is full, and adding plates does nothing if chopping is the queue. Measure the station where work waits, then add capacity or admission control at that station.
:::

## 26. Normal capacity and failure headroom

Assume five API instances can each sustain 300 requests per second on this workload. Normal capacity is 1,500. With one unavailable, four survivors supply 1,200 against the 1,000 peak, leaving 200 of arithmetic headroom.

**Failure headroom** is spare sustainable capacity after the promised loss. It is not the difference between normal capacity and normal demand. The calculation assumes load can be redistributed, warm survivors can accept it, and shared dependencies still work. A rolling deployment or zone failure can remove more than one instance. State the failure domain and the required surviving capacity. Use admission limits if offered traffic can exceed the protected downstream rate.

The illustrated normal fleet has 1,500 requests per second of sustainable capacity, but the failure decision uses the 1,200 that remains after losing an instance. Compare that surviving rate with the same 1,000-request offered population, retaining the shown 200 of spare capacity. Routing must actually reach the survivors and respect their individual limits; total capacity can conceal uneven placement. Also separate request-rate capacity from connection or memory capacity. A replacement instance may begin cold and temporarily increase source misses. Failure headroom therefore needs the altered workload as well as an arithmetic count of the surviving instances.

@fig sd_interview_method_26 | Illustrative capacity after failure. Five instances provide 1,500 requests/s; four surviving instances provide 1,200 requests/s, leaving 200 requests/s above the stated demand.

Five instances in one failing zone do not provide capacity after that zone is lost. Failure domains matter as much as counts.

:::note Failure headroom
Calculate capacity after the named failure and compare it with peak demand. Include redistribution, warmup, and shared dependencies. Headroom is a workload-specific assumption until tested under failure.
:::

## 27. The cache outage calculation

At the illustrative peak and a 0.9 hit fraction, 100 of 1,000 reads reach the database. If the cache disappears and every read falls through, the source receives 1,000, ten times its normal miss load.

A **cache failure policy** determines which work is admitted when the fast copy cannot serve it. Use bounded fallback, request coalescing, admission limits, and allowed stale results to protect the authority. The policy must honor the freshness contract, so a stale score can be allowed for one display and forbidden for a scorer confirmation. A cache is an optimization only when its absence has a designed behavior; otherwise it is an undocumented capacity dependency.

At the illustrated normal hit rate, the source sees 100 reads per second. If the cache vanishes and every request immediately falls through, that same viewer demand offers 1,000 source reads per second. Extra API instances do not restore source capacity and can admit still more competing work. Add a bounded fallback gate, request coalescing where safe, and a declared stale or rejection policy. Recovery warming also consumes source work, so place it within the same budget. A candidate should show what happens to the caller under that gate rather than claiming cache failure is transparent.

@fig sd_interview_method_27 | Illustrative the cache outage calculation. Cache loss transfers the entire read stream to a source normally serving misses. Orange marks fallback amplification when all reads reach the source.

A timeout followed by unrestricted fallback can overload the source while callers continue spending time on the failed cache.

:::warn Watch out
Size the source for the intended cache failure policy. Calculate miss demand and complete-cache-loss demand, then bound fallback to sustainable capacity. Allowed stale data and rejected work should be explicit user outcomes.
:::

## 28. Queue recovery and backpressure

Workers complete 1,000 tasks per second while arrivals reach 1,200 for 60 seconds. The backlog grows by 200 per second, ending at 12,000. If arrivals later fall to 600, spare drain is 400 per second and recovery takes 30 seconds.

**Backpressure** makes upstream work respond to downstream limits through reduced admission, slowed production, or an explicit rejection. A queue buys time and decouples bursts; it does not create infinite throughput. Bound queue bytes, age, retries, and each task’s work. Keep dead-letter and recovery paths for poison inputs, and count successful effects separately from attempts. Google’s [overload chapter](https://sre.google/sre-book/handling-overload/) discusses overload controls and the danger of cascading work.

The illustrated burst leaves 12,000 tasks, and ordinary input later consumes part of the worker rate while that backlog remains. The available 400 tasks per second for old work gives the stated 30-second drain. If successful service falls below arrivals, no finite drain exists under unchanged conditions. A deeper queue postpones rejection but increases wait and retained memory. Bound admissions or task expiry from the business deadline, and preserve durable work where the contract requires it. Count useful completions separately from retry attempts so a poison task cannot make the queue appear to recover while effects stay stalled.

@fig sd_interview_method_28 | Illustrative queue recovery and backpressure. Queue recovery uses spare service after ongoing input, rather than total service rate. Orange marks recovery using spare service after continuing arrivals.

Unbounded retries can turn one task into repeated offered work and prevent the queue from ever recovering.

:::interview Interview lens
**"How do you size for failure headroom?"** Compute backlog from excess arrivals and drain time from spare capacity while arrivals continue. Bound the queue and apply upstream admission when capacity is exhausted. A queue is a buffering policy, not a substitute for sufficient processing.
:::

:::key In one breath
Name the limiting unit and the waiting it creates. Calculate normal and failure demand. Shard independent state, replicate safe reads, and use admission limits when downstream capacity is bounded.
:::

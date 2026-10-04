@part V | Eviction: LRU and LFU | We separate memory removal from freshness. A full cache needs a replacement rule even for still-valid values. We will count memory and trace LRU and LFU on the same request sequence. | where:5

## 17. Count payload and metadata separately

Heron's cache holds 100,000 response entries. Each response has 2,000 payload bytes, but an entry also needs a key, expiry, links or counters, and allocator space. Saying the cache needs 200 MB by multiplying only the payload misses those costs. Capacity planning starts with an accounted model and then checks it against implementation measurements.

**Eviction** removes entries to satisfy a capacity policy. It does not mean the source record was deleted or the cached value was stale. A perfectly current object can be evicted because other entries are more useful. **Expiry** removes eligibility because of an age rule, so it answers a different question from capacity replacement.

Assume 100 metadata bytes per entry for the illustrative accounting exercise. Each accounted entry is 2,000+100=2,100 bytes, so 100,000 entries use 210,000,000 bytes. In a decimal 256,000,000-byte budget, accounted occupancy is 210,000,000 divided by 256,000,000, or 82.03125%. The remaining accounted space is 46,000,000 bytes.

$$M=n(b+o)$$

Read this as accounted memory M equals entry count n times payload bytes b plus assumed per-entry overhead o. Real overhead need not be constant, and the model excludes buffers, replication, allocator fragmentation, and other process memory unless explicitly added. A decimal MB is 1,000,000 bytes; do not replace it with MiB while keeping the same number.

[Redis eviction documentation](https://redis.io/docs/latest/develop/reference/eviction/) explains implementation policy choices and memory-accounting behavior. Heron's assumptions are not Redis benchmarks. Measure actual representative keys and values, peak buffers, and eviction churn under load. A budget with no space for transient work can fail before the simple entry-count estimate suggests it should.

@fig sd_cache_trace_17 | Illustrative capacity arithmetic separates 200,000,000 payload bytes from 10,000,000 metadata bytes; orange marks the 210,000,000 byte accounted total.

:::story Picture this
A small desk tray holds only a few pages. Removing the page touched longest ago follows recency; removing the least-requested page follows frequency. Neither action means the book was deleted from the library.
:::

## 18. LRU moves a touched key to the recent end

Heron's three-entry cache receives requests A, B, A, C, A, D, B. Which key leaves when D arrives? We can answer exactly after defining the ordering convention. **Least recently used**, or LRU, evicts the entry whose most recent access is oldest. A hit updates that recency even though it does not load another value.

Write the cache order from least recent to most recent. A first creates [A]. B creates [A,B]. The next A is a hit and moves A to the right, producing [B,A]. C creates [B,A,C]. The next A hit produces [B,C,A]. We have filled capacity but have not evicted anything yet.

D is a miss at full capacity, so B is the victim and the state becomes [C,A,D]. The final B is now another miss, evicting C and producing [A,D,B]. Across the 7 references, the hits are the third and fifth references, giving 2 hits and 5 misses. The computed hit fraction is 2/7.

An exact constant-time LRU implementation often combines a hash map with a linked recency list, moving or removing known nodes. That data structure is implementation work and consumes metadata. Distributed products can approximate recency by sampling rather than maintaining one exact global order; check the documented policy before expecting this toy sequence to match every product trace.

LRU fits workloads where recent use predicts near-future use. A sequential scan larger than capacity can replace a useful working set with one-time values. Heron's workload must be measured by keys, not only aggregate rate. The trace gives a mechanical explanation of recency, while a production policy choice depends on object sizes, misses, scans, and update behavior.

@fig sd_cache_trace_18 | Illustrative LRU state moves a touched A to the recent end and evicts B, then C; orange marks the final order after the second miss.

:::note Toy policy and product policy differ
The exact LRU and LFU traces define their counting and tie-break rules. Implementations can sample, approximate, or decay metadata, so verify the selected product policy.
:::

## 19. LFU keeps counts and needs a tie-breaker

Use the same three-entry cache and request sequence A, B, A, C, A, D, B. **Least frequently used**, or LFU, evicts the entry with the smallest access count under a defined counting policy. Counts alone do not choose between equal entries, so our illustrative exact policy breaks ties by least recent access among tied residents.

A reaches count 3 by the fifth reference. B and C each have count 1. B was last touched before C, so D's miss evicts B and inserts D at count 1. The remaining resident counts are A:3, C:1, D:1. The last B request misses and evicts C because C is older than D among the minimum-count entries.

The final resident state is A:3, D:1, B:1. Like the LRU trace here, LFU has 2 hits and 5 misses, so the hit fraction is 2/7. Equal results on this sequence do not make the algorithms equivalent. One remembers access counts, while the other remembers the latest access order; another workload can choose different victims.

To show a difference, use capacity 2 and references A, A, A, B, C. Before C, A has been frequent but B is more recent. LRU evicts A and retains [B,C]. LFU with our counting and tie-break rule evicts B and retains A:3 and C:1. Both have 2 hits across these 5 references, but their future contents differ.

Unaged counts can let formerly popular values occupy memory long after demand changes. Real LFU implementations may approximate and decay counters, so the counting interval and decay rule are part of the policy. Heron compares workloads after match transitions, not just during one popular match, before deciding whether frequency history predicts future usefulness better than recency.

@fig sd_cache_trace_19 | Illustrative LFU state keeps access counts and breaks equal-count ties by age; orange marks the policy decision where LRU and LFU retain different keys.

:::warn Entry count can hide byte pressure
A large low-reuse value can occupy the space of many small useful entries. Bound bytes and transient memory, not only the number of keys.
:::

## 20. Policy choice depends on scans and object size

A one-time report reads many old matches and displaces the few live matches every viewer needs. A cache can have a sensible replacement policy and still admit the wrong objects. **Admission** decides whether a newly requested value should enter the cache, while replacement decides which resident value leaves when capacity is needed.

A large object can also consume the space of many small ones. Heron's illustrative ordinary response uses 2,000 payload bytes and 100 accounted metadata bytes. A special 20,000-byte response with the same assumed metadata uses 20,100 bytes, which exceeds 9 ordinary accounted entries and is smaller than 10 such entries. Entry-count capacity cannot capture that size difference.

Compare usefulness as avoided cost per constrained resource when sizes and source expense vary. A repeatedly read large value might still deserve space, but one oversized low-reuse report can be a poor admission. Some policies separate temporary scan entries, cap value size, or use a frequency-aware admission test. The exact implementation and measurement determine the result.

Expiry and replacement can interact. A key with no expiry may be ineligible for an eviction policy that selects only expiring entries. A policy configured to refuse writes rather than evict creates an explicit full-cache error path. Application code must handle that failure as copy maintenance failure, not lose an already committed authoritative score.

For Heron, compare LRU and LFU on recorded reference sequences, measure bytes and source work avoided, and include cold starts and scan workloads. A high hit fraction on cheap small requests can hide expensive misses. The goal is a bounded cache that saves meaningful work, rather than a maximum hit number with no connection to source pressure or response latency.

@fig sd_cache_trace_20 | Illustrative object-size arithmetic compares 2,100 accounted bytes with 20,100; orange marks admission as a saved-work-per-byte decision.

@fig sd_caching_eviction | The rows distinguish expiry by age from eviction by recency or frequency; orange marks LFU, while all three discard a copy rather than source truth.

:::interview Interview lens
**"How would you choose LRU versus LFU?"** I would replay representative key traces and measure useful source work avoided. Recency handles changing working sets differently from historical frequency, so scans and popularity shifts belong in the comparison.
:::

:::key In one breath
Eviction manages a capacity limit and differs from expiry. Memory includes keys, values, metadata, and implementation overhead. LRU uses recent access while LFU uses access counts under an aging and tie-break rule. Compute victims from a concrete trace before choosing a policy.
:::

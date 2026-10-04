@chapter faq | Interview question bank | Explain the operation, intermediate states, and exact failure boundary before naming the product.

### The cache boundary

**Q1. What exactly does a cache save?**

It avoids a named repeated operation by reusing a permitted derived result. A response cache, value cache, and database page cache skip different work. Name the stored object before reporting performance.

**Q2. Why use a local cache?**

It avoids a cache-service network hop and can cheaply reuse process-local work. Each process warms independently and holds its own memory and invalidation state. Restart and fleet-wide source loading remain separate concerns.

**Q3. What does a shared cache add?**

It shares warm entries across application processes but adds network and service failure costs. Distributed placement does not make entries authoritative or current. Source fallback must be independently bounded.

**Q4. What belongs in a cache key?**

Every dimension that changes the reusable representation and its visibility contract. Locale and format version can matter alongside identity and permissions. Some private responses are simpler and safer to bypass at that layer.

**Q5. Walk through cache-aside.**

Check a permitted entry, admit a miss, load suitable source state, and attempt a safe fill. The application owns these steps. A fill failure need not fail a correct source read, but an old fill must not defeat the coherence rule.

### Read paths

**Q6. What is different about read-through?**

The cache interface owns loading instead of the application. It still needs deadlines, eligibility, source admission, and distinct result states. The name alone does not imply single-flight or a particular placement.

**Q7. Compute warm source demand.**

At 1,000 reads per second and an eligible 90% hit ratio, 100 reads per second miss. This assumes one source load per miss and excludes refresh or duplicate work. Cold bursts need another operating point.

**Q8. Why distinguish not found from timeout?**

Only a successful source lookup can establish absence. A timeout leaves existence unknown. Caching it as absence turns a source outage into a false-data interval.

**Q9. Does write-through imply a cross-service transaction?**

No. It includes backing-store work in the write contract, but cache and source steps can fail independently. State their ordering, acknowledgement point, and read behavior after a partial failure.

**Q10. What does write-behind risk?**

It acknowledges before source application. An undurable buffer can lose acknowledged work; a durable buffer still needs replay, identity, and ordering. The operation semantics determine whether combining updates is legal.

### Write paths

**Q11. What does a durable buffer guarantee?**

It can preserve accepted buffered operations under its storage contract. It does not mean the source has applied them or that replay is duplicate-safe. Visibility and recovery progress need explicit boundaries.

**Q12. How do you reject delayed old cache updates?**

Carry a comparable source version and perform an atomic conditional update. Comparing only against a currently present value loses protection after eviction. Retain a floor, generation rule, or suitable authoritative validation.

**Q13. Does TTL imply read-your-writes?**

No. A young entry can already predate a completed write. A session requiring version 8 must reject version 7 regardless of its age. TTL controls reuse duration under an expiry rule.

**Q14. Explain the invalidate-then-fill race.**

A reader holds old source state while a writer commits and deletes the cache key. The delayed reader then fills the old state into the empty key. A surviving version floor or generation protocol is needed to reject or isolate it.

**Q15. What do generation keys solve?**

They separate old and new fills into different keys. A current reader still needs a suitable generation-selection rule, or a stale pointer keeps it on the old key. Cleanup and memory are separate concerns.

### Freshness and invalidation

**Q16. When is stale-while-revalidate acceptable?**

When the requesting operation explicitly permits the old result within a declared interval. One bounded refresh can serve many waiters. Authority checks and strict scorer reads require their own contract.

**Q17. Expiry or eviction?**

Expiry makes reuse ineligible under age rules; eviction frees capacity. A current object can be evicted, and an old object can remain resident but unusable. Neither means the authoritative record was deleted.

**Q18. Trace LRU rather than define it.**

At capacity 3, A B A C A leaves recency order B C A. D evicts B; the following B evicts C. The full sequence has 2 hits and 5 misses.

**Q19. What else must LFU specify?**

The count interval, admission behavior, aging, and tie-break rule. Our exact resident-count example breaks minimum-count ties by least recent access. Real policies may sample and decay counters, so product behavior can differ.

**Q20. Why separate admission from replacement?**

Admission chooses whether a new value deserves cache space. Replacement chooses which resident to remove when space is needed. A scan or large low-reuse object can be a poor admission under an otherwise sensible policy.

### Capacity and eviction

**Q21. What is a stampede?**

Concurrent callers load the same missing or expired object independently. Single-flight can share one compatible result, while bounded waiting handles loader failure. A global source limit still protects many distinct misses.

**Q22. What is penetration?**

Absent-key traffic repeatedly reaches the source. Validate malformed keys and consider short caching of verified absence under creation and permission rules. Distinct random keys may defeat repeated-key negative reuse.

**Q23. What is an avalanche?**

Many keys miss together after aligned expiry or shared cache failure. Spread warming and expiry, but keep independent source admission. Per-key coalescing cannot combine loads for different values.

**Q24. How can hits overload a cache?**

A hot key sends concentrated traffic to its owner even when the value is present. Local or edge read copies can spread permitted reads but add freshness obligations. Hot writes need ordering or merge semantics before splitting.

**Q25. Compute the cache-outage multiplier.**

With normal h=0.9, source demand is 100 from 1,000 reads per second. Full fallback offers 1,000, a tenfold increase. More retry or refill work can make offered demand worse.

### Correlated misses

**Q26. How do you bound fallback?**

Limit admitted source concurrency and waiting, with reserved scorer resources. Under the illustrative 4 slots and 20-millisecond read, the ideal bound is 200 reads per second. Slower reads reduce it, so this is an assumed calculation rather than a benchmark.

**Q27. What does a cache circuit breaker do?**

It reduces wasted calls and waiting on a failing dependency and probes recovery under a controlled policy. It does not prove keys are absent. Skipped-cache requests still enter bounded fallback.

**Q28. Can cache failover revive a deleted value?**

Yes, when a promoted lagging replica did not receive deletion. A version floor stored in that cache may also regress. Strict reads need a surviving authority or version requirement that rejects the old copy.

**Q29. What is the complete read contract?**

Construct a correct key, test eligibility, return a permitted copy or admit a bounded suitable load, then attempt a safe fill. Preserve absence versus errors. Keep the source authoritative when the copy disappears.

**Q30. What happens after source commit but cache maintenance failure?**

The official write stays committed under its source contract. Retrying the same command retrieves its result, and a strict subsequent read rejects old cache state. Public reads use only their explicitly permitted stale behavior.

### Cache failure

**Q31. How do you size cache memory?**

Account for payload, keys, metadata, implementation overhead, buffers, and copies. The illustrative 100,000 entries at 2,100 bytes use 210,000,000 bytes. Measure actual objects and transient memory before setting production capacity.

**Q32. What histories should cache QA include?**

Pause old fills across writes and eviction, promote a lagging replica, burst one expired key, and cold-start many keys. Also test timeout versus absence, process restart, and bounded fallback. A warm-hit benchmark reaches none of those contracts by itself.

**Q33. Does a database buffer hit bypass the query?**

No. It reuses an engine page and can avoid a storage read. Query execution and visibility rules still participate. It is different from reusing a final application response.

**Q34. Does a 304 response avoid every origin cost?**

No. Conditional validation can avoid retransmitting a body but still contacts the origin and may perform work. Fresh reuse and validation save different resources. Count request and payload work separately.

**Q35. Why is hit ratio not enough?**

It omits miss cost, rejected old values, per-key skew, fill duplication, and outage pressure. Hits can overload a hot owner while cheap hits hide costly misses. Measure source work saved and latency at a named layer.

### The complete cache contract

**Q36. Why does local single-flight not prove a fleet-wide limit?**

Each process has its own in-flight group. Ten processes can each load the same key once. A shared or conservatively divided source budget is needed when a global bound matters.

**Q37. What if an old negative entry survives match creation?**

Readers can keep seeing permitted absence until invalidation or expiry under the declared contract. Generation changes can separate new existence from old absence. Never pretend the earlier absence remains current automatically.

**Q38. Can frequency retain an obsolete popular key?**

Yes. Without aging, old counts can dominate after workload changes. LFU implementations often decay or approximate frequency. Evaluate the transition between popular matches, not only one steady hot period.

**Q39. Walk through the whole cache system under failure.**

Time out the failed service, use only permitted stale values, and admit a bounded subset of suitable source loads while reserving critical work. Keep safe fills and version requirements active during failover and warming. Report rejected or degraded outcomes honestly.

**Q40. What changed from a dictionary to the complete design?**

The dictionary supplied storage and lookup. The complete design defines representation, authority, freshness, concurrency, capacity, and failure recovery. Its extra mechanisms each enforce a specific promised behavior rather than merely make the lookup faster.

@chapter exercises | Exercises | One dot is direct arithmetic, two dots require a worked history, and three dots require a derivation, code, or complete budget.

**E1** ● Compute source demand for 1,000 reads/s and h=0.9.

**E2** ● Compute source demand for the same workload and h=0.5.

**E3** ● Compute full fallback multiplier from the h=0.9 case.

**E4** ● Compute full fallback multiplier when h=0.99.

**E5** ● Compute 100,000 entries at 2,000 payload bytes plus 100 assumed metadata bytes.

**E6** ● Compute that accounted occupancy in 256 decimal MB.

**E7** ● Compute local duplication of a 2,100-byte accounted entry in 10 processes.

**E8** ● Compute mean wait at h=0.9 with 2 ms cache and 20 ms source, no blocking fill.

**E9** ● Compute ideal fallback throughput for 4 slots and 20 ms source reads.

**E10** ● Compute the same ideal rate when source reads slow to 100 ms.

**E11** ●● Trace LRU at capacity 3 for A B A C A D B.

**E12** ●● Trace exact resident-count LFU on the same sequence, breaking ties by oldest access.

**E13** ●● Show the LRU/LFU victim difference at capacity 2 for A A A B C.

**E14** ●● Explain the stale-fill race without equations.

**E15** ●● Explain why TTL does not prove a current score without equations.

**E16** ●● Explain negative caching without equations.

**E17** ●● Trace 100 concurrent compatible misses with and without single-flight.

**E18** ●● Spread 1,000 scheduled refills evenly across 10 one-second buckets.

**E19** ●● Compute hot-key traffic with 80% of 1,000 reads/s and 2,000-byte values.

**E20** ●● Trace invalidation lost before replica promotion.

**E21** ●●● Derive the full-fallback multiplier.

**E22** ●●● Derive why present-entry version comparison fails after eviction.

**E23** ●●● Write one bounded read routine that preserves absence versus source failure.

**E24** ●●● Count two full service copies plus ten full local copies, each using the illustrative entry model.

**E25** ●●● Budget a cache outage at 1,000 reads/s with 4 source slots and a 20 ms assumed read.

@chapter solutions | Worked solutions | Each numerical result follows the stated illustrative assumptions and is reproduced in copies-review-numbers.py.

**E1.** 1,000 times (1-0.9)=1,000 times 0.1=100 source reads/s, assuming one load per miss and no additional refresh traffic.

**E2.** 1,000 times (1-0.5)=500 source reads/s under the same assumptions. The source work is 5 times the 100-read warm case.

**E3.** 1,000/100=10. Equivalently 1/(1-0.9)=10 for the same incoming rate.

**E4.** Normal source demand is 1,000 times 0.01=10 reads/s. Full fallback offers 1,000/10=100 times that normal demand.

**E5.** Each accounted entry is 2,100 bytes. 100,000 times 2,100=210,000,000 bytes, or 210 decimal MB, before omitted overhead.

**E6.** 210,000,000/256,000,000=0.8203125, or 82.03125%. Remaining accounted space is 256,000,000-210,000,000=46,000,000 bytes.

**E7.** 10 times 2,100=21,000 accounted bytes. This assumes every process holds the entry, excluding other process memory and allocator overhead.

**E8.** A hit spends 2 ms and a sequential miss 2+20=22 ms. The mean is 0.9 times 2 plus 0.1 times 22=1.8+2.2=4 ms, excluding queueing and unrelated work.

**E9.** 20 ms is 0.02 s. 4/0.02=200 reads/s if slots remain busy at that duration. This is an assumed occupancy bound, not a measured service guarantee.

**E10.** 100 ms is 0.1 s. 4/0.1=40 reads/s. The same concurrency cap protects the pool while completion throughput falls.

**E11.** Orders from least to most recent are [A], [A,B], [B,A], [B,A,C], [B,C,A], [C,A,D], and [A,D,B]. D evicts B and the final B evicts C. References 3 and 5 hit, so 2/7 are hits and 5/7 are misses.

**E12.** A reaches count 3; B and C have count 1 before D. D evicts older B. Final B evicts C rather than newer D, leaving A:3, D:1, B:1. There are 2 hits and 5 misses, matching this LRU trace despite a different rule.

**E13.** A repeated twice after insertion gives count 3 and 2 hits. B is newest with count 1. On C, LRU evicts A because it is less recent; LFU evicts B because its count 1 is less than A count 3. Both traces have 2/5 hits at that point.

**E14.** An old reader fetches version 7 and pauses. A writer commits version 8 and deletes the cache. The old reader resumes and fills version 7 into the empty key. Preserve a floor or isolate generations rather than relying on deletion alone.

**E15.** A copy can be loaded, then become old immediately after a source write while still within its allowed age. A lagging source can also fill an already old value. A strict read needs a comparable version or suitable source observation, not merely a young entry.

**E16.** Cache only a successful source conclusion that the requested visible object is absent. Creation can make the old absence stale, so use expiry, invalidation, or a generation rule. A timeout or unavailable source proves nothing about existence.

**E17.** Independent loading makes 100 source reads. One successful single-flight group makes 1 read and avoids 99 duplicated loads. Across 10 separate local groups there can still be up to 10 loads, so local coalescing is not a fleet-wide proof.

**E18.** 1,000/10=100 scheduled loads per second in the ideal even schedule. Aligned refills in 1 second need 1,000 loads/s for that interval. Random jitter has variable bucket occupancy, so its peak is not guaranteed to equal this ideal schedule.

**E19.** 0.8 times 1,000=800 reads/s for that key. 800 times 2,000=1,600,000 payload bytes/s. Ten evenly used local copies would handle 800/10=80 reads/s each under the ideal routing assumption.

**E20.** Primary P removes v7 while replica Q still holds v7. P fails and Q is promoted, exposing v7 again. A required-v8 read rejects it. A floor stored only on lagging Q may regress too, so include metadata storage in the coherence model.

**E21.** Normal source demand is lambda times (1-h), while full fallback offers lambda. Divide to obtain 1/(1-h) for h<1. The assumption is unchanged arrival rate and one source load per request; retries and coalescing change offered load.

**E22.** The comparison rejects v7 when retained entry v8 exists. Evicting v8 removes that comparison state. A late v7 fill now sees absence and can succeed. To preserve rejection, the design must retain a version floor elsewhere or select a current generation through a suitable authority rule.

**E23.** The pseudocode below checks eligibility, enters a bounded source slot, fetches a typed source result, fills only successful values or permitted verified absence, and returns that source result. Source exceptions remain exceptions or explicit errors. A production implementation must define deadline and safe-fill atomicity at their actual boundaries.

```python
entry = cache.get(key, deadline=cache_deadline)
if permitted(entry, required_version):
    return entry.result
with source_slots.acquire(deadline=request_deadline):
    result = source.read(key, required_version)
    if result.is_value or permitted_verified_absence(result):
        cache.safe_fill(key, result, deadline=request_deadline)
    return result  # source failures remain distinct errors
```

**E24.** One copy is 100,000 times (2,000+100)=210,000,000 bytes. Two service copies are 420,000,000 bytes and ten full local copies are 2,100,000,000 bytes. Together they account for 2,520,000,000 bytes before omitted overhead, with no automatic freshness guarantee.

**E25.** The ideal admitted rate is 4/0.02=200 reads/s, leaving 1,000-200=800 requests/s for stale reuse or bounded rejection. If cache wait consumes 5 ms of a 50 ms budget and source takes 20 ms, 25 ms remain. Reserve scorer resources and bound queueing because slower source reads reduce throughput.

### Primary references and arithmetic

[RFC 9111, HTTP caching](https://www.rfc-editor.org/rfc/rfc9111). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Redis eviction and memory policy](https://redis.io/docs/latest/develop/reference/eviction/). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[RFC 5861, stale cache-control extensions](https://www.rfc-editor.org/rfc/rfc5861). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

The independent arithmetic and policy traces are kept in `scripts/system-design/copies-review-numbers.py`. They cover Heron workload budgets, quorum counts, local state transitions, cache replacement victims, and the numerical exercise answers.

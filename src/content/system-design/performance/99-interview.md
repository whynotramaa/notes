@chapter faq | Interview question bank | Answer with the mechanism, the example, and the boundary of the guarantee.

### Demand and completion

**Q1. Latency or throughput?**

Latency is elapsed time inside a chosen operation boundary; throughput is completed work per time. More overlapping requests can increase completions while making each viewer wait longer. Report useful successes and attempts separately so failed work does not inflate the claim.

**Q2. What is the API concurrency at the assumed stable peak?**

The mean completion rate is 1,000 requests per second and mean residence time is 0.2 seconds. Their product is 200 active requests under the steady-state assumptions. Idle connections and dependency occupancy are separate counts.

**Q3. Where should the request timer start?**

Start where the user promise starts, then use narrower timers to explain its components. A database timer may exclude pool acquisition and the application timer may exclude proxy admission. Those measurements are useful only when their boundaries are named.

**Q4. Why is daily average demand insufficient?**

It removes the timing of arrivals. A match-start burst can exceed service even when the daily average is modest. State the peak rate, duration, key concentration, and whether reconnect or background work arrives at the same time.

**Q5. How does a pool bound throughput?**

Connection count divided by mean connection-hold time gives an ideal occupancy ceiling. With 20 slots and 10 ms hold time, that ceiling is 2,000 operations per second. The database's actual CPU, storage, or lock capacity can impose a lower ceiling.

### The tail of the distribution

**Q6. What does p99 mean?**

It is a threshold at the stated percentile of an observed population under a stated estimator. For the chapter's nearest-rank sample, rank 99 has latency 100 ms. It is neither the maximum nor the average of the slowest requests.

**Q7. Can we average instance p99 values?**

No, because each threshold discarded its instance's population count and distribution. Combine observations or compatible histogram counts before computing the fleet quantile. The worked uneven-population example has a fleet p99 of 5 ms despite a slow instance's 200 ms p99.

**Q8. What is coordinated omission?**

The offered workload slows when the measurement client waits for replies, so some delays that independent arrivals would experience disappear from the sample. Use the arrival model that matches the intended workload and report generator delay. A closed-loop test is still useful for a genuinely fixed population making sequential calls.

**Q9. Why does fan-out amplify tails?**

Every required child adds another chance to miss the page's threshold. Under independent calls, all-finish probability is the per-call probability raised to the child count. Shared slow dependencies change that probability structure, so traces should identify common causes.

**Q10. Can child p99 values be added?**

They do not generally produce the parent's p99. Serial disjoint intervals add per request, while required parallel work finishes at its latest child completion. Calculate the parent distribution from measured request histories or a justified joint model.

**Q11. When does hedging help?**

A delayed duplicate can help a safe read when an independent destination avoids the original tail cause. Budget the extra attempt and cancel the loser where possible. If both attempts queue at the same overloaded database, duplication can make the tail worse.

**Q12. Why propagate a deadline?**

A child must know how much of the parent's useful time remains. Granting a fresh full timeout at each hop can continue work after the user already left. Include acquisition and network time, and release resources when cancellation is supported.

### Bytes and storage operations

**Q13. IOPS or bandwidth?**

IOPS counts storage operations per second and bandwidth counts transferred bytes per second. Operation size connects them. A query can require several operations or none when its pages are cached, so query rate is a different boundary.

**Q14. How much payload does the API return at peak?**

The illustrative 1,000 requests per second times 2,000 response bytes gives 2,000,000 bytes per second. Multiplying by eight gives 16,000,000 bits per second. Headers, requests, retransmissions, and internal copies remain outside that payload total.

**Q15. Why does sequential access help?**

Neighboring data can share larger transfers and reuse pages. This can reduce operation count for the same payload, although reading unused adjacent bytes can increase total work. Inspect locality and actual page use instead of assigning one I/O to every row.

**Q16. What is the retained record-storage total?**

The illustrative write workload adds 4,320,000,000 logical bytes per day. Thirty retained days contain 129,600,000,000 bytes; three copies contain 388,800,000,000. Indexes, logs, backups, maintenance overlap, and deletion delay require separate entries.

**Q17. Why not size cache memory from payload alone?**

Keys and entry bookkeeping consume memory as well as values. The example's 100,000 entries at 2,100 total bytes need 210,000,000 bytes before process and allocator overhead. Copies, connection buffers, and temporary objects add more memory.

### The limiting resource

**Q18. CPU is low but latency is high. What next?**

Find the wait in the trace, including admission, pool acquisition, locks, disk, and network. Then compare arrivals, useful completions, and queue age at that stage. More threads help only when useful independent overlap can fill unused service capacity.

**Q19. How do you estimate CPU demand?**

Multiply request rate by CPU service time per request. The illustrative 1,000 requests per second at 2 ms CPU each needs two CPU-seconds per second. Do not substitute wall time, which includes waits, or ignore a single saturated execution thread hidden by the host average.

**Q20. What makes a stage the bottleneck?**

It limits sustainable useful completions for the current workload. Translate stage operations into per-request demand before comparing capacities. A completion plateau with growing wait is stronger evidence than a resource percentage alone.

**Q21. Why does queueing rise near saturation?**

Little spare service remains to clear random bursts while new arrivals continue. The stated M/M/1 model shows how mean time grows as service minus arrivals shrinks. Real distributions and correlations require measurement rather than blind use of that formula.

**Q22. What should a load test report?**

Offered arrivals, useful completions, outcomes, latency distribution, and waiting state at relevant components. Preserve payload mix and key skew and report generator limits. Test the promised failed-component case while the workload continues.

### Scaling and serial work

**Q23. Vertical or horizontal scaling?**

Enlarge the resource serving the measured limit or distribute genuinely independent work. Vertical scaling can keep coordination local but has a machine and failure ceiling. Horizontal scaling adds routing, state placement, and shared dependency budgets.

**Q24. Does a stateless application mean no state?**

No, it means requests do not require earlier requests to reach the same handler. Durable records and session contracts still have owners, and live connections belong to gateways until recovery. Local caches may differ, so their freshness and replacement rules remain explicit.

**Q25. Why can adding application instances hurt the database?**

Per-instance pools and retries combine at the shared dependency. Five instances with 20 slots each can offer 100 simultaneous operations. Adding callers without database capacity moves or enlarges queues rather than increasing useful work.

**Q26. Does partitioning solve a hot key?**

Only if the constrained work can divide across independent owners. Separate matches may parallelize while one match's ordered source writes remain serial. Read replicas or delivery gateways can spread selected read or fan-out work without inventing independent authoritative writers.

**Q27. What does Amdahl assume?**

A fixed workload has a fixed serial fraction and ideally divisible parallel work. The example's 20 ms serial step survives every worker increase. Communication and contention can reduce actual speedup, and throughput of independent jobs is a different question.

**Q28. What is the serial speedup bound?**

For serial fraction 0.2, unlimited ideal workers approach five times speedup. Four workers produce 40 ms total from the 100 ms job, or 2.5 times. The calculation identifies why reducing shared serial work can help more than adding workers.

### Queue growth and backpressure

**Q29. Can a queue solve sustained overload?**

No, a positive arrival-minus-service deficit keeps adding waiting work. A queue absorbs a finite burst only within its byte and age budget. Admission, expiry, and service capacity determine whether the user promise survives.

**Q30. What is the burst backlog?**

Arrivals exceed service by 200 jobs per second for 60 seconds. That produces 12,000 waiting jobs under the equal-cost constant-rate assumptions. Job-cost variance and expiry can change how count translates into remaining service time.

**Q31. What is the recovery drain rate?**

Subtract continuing arrivals from service capacity. With 1,000 service and 600 arrivals per second, the spare rate is 400. The 12,000-job backlog therefore takes 30 seconds to clear in the simple model.

**Q32. Why measure oldest-job age?**

Queue count does not reveal whether the next useful deadline is already lost. Variable job costs also make equal counts represent different service work. Pair count, retained bytes, age, expiry, and useful completion metrics.

**Q33. What makes backpressure real?**

The capacity signal reaches an actor capable of reducing entering work. A bounded channel, credit limit, or explicit overload response can do this. Moving requests to another unbounded queue simply relocates waiting.

**Q34. How should scorer writes and snapshots share capacity?**

Authoritative scorer updates need a durable recovery path. Replaceable snapshots can often be coalesced by match and version, so old pending snapshots need not consume service. Use explicit class budgets so optional traffic cannot take every critical slot.

**Q35. Why budget retries?**

Attempts consume service even when they represent no new useful operation. The illustrative retry fractions produce 1,110 attempts for 1,000 original requests per second. Backoff spreads attempts, but an attempt cap and deadline are still needed to protect capacity.

### A complete capacity argument

**Q36. What does one-server headroom establish?**

Under the illustrative capacity assumptions, four surviving servers provide 1,200 requests per second against a 1,000 peak. It establishes application capacity count for one missing server. It does not prove the shared database or tail objective survives the same failure.

**Q37. How many application servers does the example need?**

The ceiling of 1,000 divided by 300 is four, then add one for the stated unavailable-server case. The answer is five under the chosen per-server capacity assumption. Place them across the failure domains the design actually promises to tolerate.

**Q38. Why separate live traffic from API traffic?**

Event production, gateway copies, and recipient delivery have different multipliers. Heron's live path needs 1,000,000 deliveries per second and 200 MB/s payload, while its API response payload is 2 MB/s. A connection-count test alone does not prove the delivery path fits.

**Q39. Walk me through the entire capacity argument.**

State workload, burst shape, payloads, and objectives first. Compute request concurrency, CPU service, dependency occupancy, physical I/O, fan-out bytes, retained storage, and failure capacity with their own units. Then test key skew, failed components, and recovery while new work continues.

**Q40. What changed between the initial calculation and the complete design?**

The initial daily average gave one request rate. The complete argument adds tails, resource boundaries, state ownership, retries, recovery, and failure cases that rate could not establish. Each precise total now carries assumptions and a matching measurement instead of claiming one machine label proves the path fits.

@chapter exercises | Exercises | One dot is a direct calculation, two dots require a trace or explanation, and three dots require a derivation, implementation, or complete design.

### Direct calculations

**E1** ● Compute the average and peak API arrival rates.

**E2** ● Compute mean API concurrency at the stated stable peak.

**E3** ● Add the disjoint request-trace intervals.

**E4** ● Find the mean of the chapter's latency sample.

**E5** ● Compute API payload bits per second.

### More resource counts

**E6** ● Compute live payload bytes per second.

**E7** ● Find the byte rate of 2,000 reads/s at 4 KiB each.

**E8** ● Compute retained payload with three copies.

**E9** ● Size the specified cache including entry overhead.

**E10** ● Compute CPU demand for the assumed 2 ms per request.

### Traces and choices

**E11** ●● Find nearest-rank p50, p95, and p99 for the sample.

**E12** ●● Combine the two instance populations in Section 7.

**E13** ●● Compute the 60-second backlog and recovery while 600 jobs/s continue.

**E14** ●● Find the ideal occupancy ceiling of the 20-slot pool.

**E15** ●● Explain low CPU and high latency without equations.

### Failures and recovery

**E16** ●● Explain why a queue cannot create service capacity without equations.

**E17** ●● Explain when an event can be coalesced without equations.

**E18** ●● Compute survivor capacity and both utilization ratios.

**E19** ●● Compute the two model mean times at 900 and 990 arrivals/s.

**E20** ●● Count the expected retry attempts.

### Derivations and complete designs

**E21** ●●● Derive the fixed-job Amdahl bound.

**E22** ●●● Prove the spare-service recovery rule for constant equal-cost work.

**E23** ●●● Write a small function computing the bounded-queue arithmetic.

**E24** ●●● Build the full illustrative resource ledger.

**E25** ●●● Defend the failure load test and admission policy.

@chapter solutions | Worked solutions | Illustrative inputs are stated in the chapter. Every worked arithmetic result is reproduced by scripts/system-design/capacity-review-numbers.py.

**E1.** Divide 8,640,000 by 86,400 to get 100 requests/s. Multiplying by the assumed peak factor 10 gives 1,000 requests/s.

**E2.** Multiply 1,000 requests/s by 0.2 s. The seconds cancel, giving 200 active requests inside the chosen boundary.

**E3.** The intervals are 30, 20, 10, 40, and 100 ms. Their sum is 200 ms; nested child spans must not be added again.

**E4.** The weighted sum is 50 × 5 + 45 × 40 + 4 × 100 + 1 × 200 = 2,650 ms. Dividing by 100 observations gives 26.5 ms.

**E5.** First multiply 1,000 × 2,000 = 2,000,000 payload bytes/s. Then multiply by 8 to obtain 16,000,000 payload bits/s, before wire overhead.

**E6.** Twenty events/s × 50,000 viewers gives 1,000,000 deliveries/s. Multiplying by 200 bytes gives 200,000,000 payload bytes/s.

**E7.** Four KiB is 4 × 1,024 = 4,096 bytes. Thus 2,000 × 4,096 = 8,192,000 bytes/s, or 8.192 decimal MB/s.

**E8.** The daily write payload is 8,640,000 × 500 = 4,320,000,000 bytes. Thirty days gives 129,600,000,000; three copies give 388,800,000,000 bytes.

**E9.** Each entry is 2,000 + 100 = 2,100 bytes. For 100,000 entries, counted memory is 210,000,000 bytes; two identical copies contain 420,000,000 before process overhead.

**E10.** At 1,000 requests/s, multiply by 0.002 CPU-seconds/request to get 2 CPU-seconds/s. Four ideal usable cores at that service demand imply 2,000 requests/s before other limits.

**E11.** Ranks are ceil(0.5 × 100) = 50, ceil(0.95 × 100) = 95, and ceil(0.99 × 100) = 99. Their observations are 5, 40, and 100 ms respectively.

**E12.** There are 1,010 observations, with 1,000 at 5 ms and 10 at 200 ms. The p99 rank is ceil(0.99 × 1,010) = 1,000, so pooled p99 is 5 ms. The arithmetic mean of the instance p99 values, 102.5 ms, is not the fleet quantile.

**E13.** The burst deficit is 1,200 - 1,000 = 200 jobs/s, producing 12,000 jobs in 60 s. Recovery spare service is 1,000 - 600 = 400 jobs/s. Drain time is 12,000/400 = 30 s.

**E14.** Twenty slots divided by 0.01 seconds hold time gives 2,000 operations/s. This ceiling assumes continuous use and does not establish storage, lock, or CPU capacity.

**E15.** Callers may be waiting for a lock, pool, disk, or remote result instead of running code. Inspect acquisition and wait intervals at that resource and compare arrivals with useful completions. More callers can lengthen the same wait rather than help.

**E16.** It stores work that has already committed future service. If new work keeps arriving faster than workers finish, the stored work keeps increasing. Bounded admission or added service at the actual limit is needed; more storage only delays the limit.

**E17.** A replaceable latest-state notification can discard an older pending snapshot when a newer one carries the full required state. An accepted event that changes authoritative history must retain a replay route. Decide from the message meaning before applying one queue policy to both.

**E18.** Normal capacity is 5 × 300 = 1,500 requests/s. Four survivors provide 1,200, leaving 200 above the 1,000 peak. Utilization is 66.6667% normally and 83.3333% after failure, rounded to four decimals.

**E19.** For stated M/M/1 service rate 1,000/s, time is 1/(1,000-900) = 0.01 s = 10 ms. At 990/s it is 1/10 = 0.1 s = 100 ms. These results depend on the model assumptions.

**E20.** The assumed original fractions yield 1,000 originals, 100 first retries, and 10 second retries per second. Total attempt rate is 1,110/s, while useful operation count still begins from 1,000/s.

**E21.** Normalize original duration to one. With serial fraction 0.2, duration on n ideal workers is 0.2 + 0.8/n. Its reciprocal is speedup; as n grows, the duration approaches 0.2 and speedup approaches five. Four workers give 2.5 and eight give 3.3333 rounded.

**E22.** During time t, workers finish μt jobs and new arrivals contribute λt. Net backlog reduction is (μ-λ)t. Equating that reduction to initial backlog Q gives t = Q/(μ-λ), provided μ exceeds λ; otherwise this model cannot drain.

**E23.** The function below separates burst accumulation from recovery and rejects a recovery rate that cannot drain.

```python
def burst_and_drain(arrival, service, duration, recovery_arrival):
    backlog = max(0, (arrival - service) * duration)
    spare = service - recovery_arrival
    if spare <= 0:
        raise ValueError("recovery cannot drain this queue")
    return backlog, backlog / spare

assert burst_and_drain(1200, 1000, 60, 600) == (12000, 30)
```

**E24.** The API has 200 active requests, 2 CPU-seconds/s, 2 MB/s response payload, and 400 physical page misses/s under the stated page model. Live delivery has 1,000,000 recipients/s and 200 MB/s. Retained-write payload is 388.8 GB with three copies, and one cache copy has 210 MB. These roles use distinct assumptions and boundaries.

**E25.** Run the peak with one application server absent and observe useful successes, tail latency, shared waits, and recovery. Preserve the scorer path with bounded reservations, coalesce replaceable snapshots, and reject optional excess work early. Include retry demand and cold-cache effects; the spare application count alone is not a proof.

Read the next boundary when you can redraw the request path and explain one failure without consulting the pictures.


@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. What does 100 requests per minute mean?**

It is incomplete until the interval and counted work are defined. Fixed buckets, exact trailing windows, and burst-capable sustained rates differ. Clarify the contract before choosing an algorithm.

**Q2. Why is trusted identity required?**

A client that can mint its own subject key can mint fresh allowance. Use authenticated identity or a trusted pre-authentication dimension. Bound key cardinality as well as request rate.

**Q3. Why is an IP rule not a per-user rule?**

Many users can share an IP address, while attackers can distribute across addresses. It is a coarse network abuse control. Its fairness and bypass behavior differ from authenticated identity.

**Q4. How does a concurrency limit differ?**

It counts currently occupied work rather than work admitted over an interval. Slow operations can exhaust concurrency despite a modest rate. Use a separate resource limit where needed.

**Q5. What does a fixed window store?**

A count for an identity and bucket. Bucket identity is derived from time and interval length. State and cleanup are cheap, but adjacent buckets can admit a short burst.

**Q6. Why can fixed windows admit 200 near a boundary?**

The old and new buckets each allow 100 independently. Requests at 59.9 and 60.1 seconds can therefore total 200 in a 0.2-second span. That obeys the fixed-window contract while violating a different moving-window contract.

**Q7. Should rejected requests increment a counter?**

That is a policy decision. Attempt accounting increments them, while accepted-work accounting does not. Explain how invalid attempts and uncertain retries are treated.

**Q8. Why combine increment and expiration?**

A crash between separate commands can leave a key without intended cleanup. Accepted-only comparison also needs serialization with its update. An atomic procedure covers the whole decision rather than one increment.

**Q9. What does a sliding log retain?**

Recent accepted arrivals in a stated moving interval. It removes expired entries, counts retained work, and appends only an admitted event. Exact timestamp history supplies exact interval membership.

**Q10. Which interval does this chapter use?**

It uses the open-left, closed-right interval ending at the decision time. An event exactly one full interval old is expired. Cleanup and admission comparisons must use the same convention.

**Q11. Why must log members be unique?**

Two accepted arrivals can share a timestamp. A timestamp used as the member identity can overwrite one of them. Keep time as an ordering score and a unique admission identity as the member.

**Q12. What is the log memory trade-off?**

It retains one entry per recent accepted event. At many active users and high limits that exceeds a per-subject counter. The simplified byte calculation omits actual representation and replication overhead.

**Q13. How do you derive log retry advice?**

Find when the oldest retained admission expires. That gives the earliest possible next slot under the current history. Another caller can consume it first, so it is advice rather than a reservation.

**Q14. What does a sliding counter estimate?**

It combines current count with a time-weighted portion of the previous bucket. It assumes elapsed overlap predicts retained event count. It saves history at the cost of placement error.

**Q15. Compute the 80/30 estimate at 15 seconds.**

Elapsed fraction is 15 divided by 60, or 0.25. Previous weight is 0.75. Adding 30 to 80 times 0.75 gives 90.

**Q16. Why can that estimate undercount?**

Older events may be clustered late and all remain in the true moving interval. Then previous 80 plus current 30 is 110 while the estimate is 90. The missing timestamps cannot be recovered by more precise arithmetic.

**Q17. How does counter rollover work?**

Store bucket identity with counts. A one-bucket advance moves current into previous; a longer idle gap clears obsolete history. Rollover and admission must be atomic together.

**Q18. Why is token capacity separate from refill rate?**

Capacity controls saved burst allowance. Refill rate controls sustained replenishment. Changing one need not change the other, so both belong in the contract.

**Q19. How does lazy refill work?**

Store balance and last accounting time. On each decision, add elapsed refill up to capacity, then debit if enough remains. It requires no timer for every idle user.

**Q20. What is the token burst-plus-rate bound?**

Admitted cost cannot exceed initial saved capacity plus refill during the interval. That is capacity plus rate times duration under the stated atomic and clock assumptions. It is not an exact moving-window count.

**Q21. Does a 100-capacity token bucket enforce 100 in every minute?**

No, it can spend saved allowance and the minute's refill. Its illustrative accounting bound over 60 seconds is 200. Choose a strict moving algorithm when that is the required rule.

**Q22. How does weighted cost change admission?**

A request requires its full cost rather than one token. Check prospective cost against available allowance atomically. Validate positive bounded cost so input cannot create credit.

**Q23. How should clock rollback affect tokens?**

It must not create negative elapsed refill or move retained accounting time backward. Use nonnegative elapsed time and a nondecreasing retained timestamp. Shared clock assumptions still need documentation.

**Q24. What is leaky-bucket shaping?**

Accepted work leaves at a controlled rate through a bounded queue or schedule. It can smooth bursts but adds waiting. A policer that only admits or rejects has different user behavior.

**Q25. When is shaping unsuitable?**

When the waiting implied by the queue exceeds the interactive deadline. A background job can tolerate delays that a score read cannot. Reject work whose promised departure is already too late.

**Q26. How do you calculate the queue delay?**

Divide queued cost ahead of a request by the modeled release rate. Add its own processing and scheduling costs separately. Equal job counts work only when their assigned costs are equal.

**Q27. What does a virtual-time limiter store?**

A future availability or debt schedule rather than every payload. It accounts for future rate, but another owner must actually schedule deferred effects. Atomic schedule updates do not establish exactly-once execution.

**Q28. Why is read-check-write unsafe?**

Concurrent gateways can see the same last allowance before either updates it. Both then admit work. Serialize the comparison and mutation as one decision.

**Q29. What does Redis scripting guarantee?**

It prevents competing commands from interleaving during that script on the serving server. It does not automatically make replicas current or turn every runtime error into rollback. Keep scripts bounded and validate before mutation.

**Q30. Why can Redis failover weaken enforcement?**

Asynchronous recovery can restore older state and recreate already-spent allowance. Local atomicity and durable replicated accounting are different guarantees. State the tolerated over-admission or use stronger authority for a hard quota.

**Q31. What causes limiter hot keys?**

A shared tenant or global budget serializes work even when user keys distribute. Heavy subjects can also dominate one shard. Key distribution alone does not remove aggregate policy serialization.

**Q32. How do multiple dimensions complicate atomicity?**

User, tenant, and endpoint keys may have different owners. One local script can atomically debit only a compatible key set. Cross-owner decisions need a deliberate partial-charge, reservation, or allocation protocol.

**Q33. What does fail open trade?**

It preserves service admission when the normal limiter cannot be checked. It exposes the protected resource or policy to additional demand. Bound fallback capacity and name the relaxed guarantee.

**Q34. What does fail closed trade?**

It preserves the requirement to verify admission but rejects useful requests during limiter faults. Sensitive or hard-quota operations may need that behavior. It should be explicit per operation class.

**Q35. Why do local full budgets multiply allowance?**

Each independent replica has its own saved state and admits a full policy allocation. Four 100-request local budgets can admit 400 in total. Shared identity does not make separate counters shared.

**Q36. What does partitioned allowance trade?**

Fixed shares can preserve an aggregate cap under stated membership and ownership. Uneven load strands allowance at idle replicas. Dynamic recovery needs a rule preventing the same share from being spent twice.

**Q37. What are token leases?**

A central owner allocates bounded allowance chunks to local gateways. This reduces per-request coordination but can strand unused tokens and complicate crash recovery. Lease ownership must prevent replay or double spending.

**Q38. What should a 429 response do?**

Explain that rate policy rejected the request and provide documented retry advice when useful. It must not be cached under the cited HTTP rule. Keep the rejection path cheap and distinguish it from a limiter infrastructure fault.

**Q39. Walk me through the whole Heron limiter.**

Validate identity, derive policy keys, and execute one atomic admission transition before expensive work. Return clear allow or reject behavior and apply downstream deadlines and concurrency controls separately. Measure state and decision cost, then test clock, concurrency, timeout, and failover boundaries.

**Q40. What changes from a local limiter to a distributed one?**

State ownership, atomic interleaving, clock interpretation, and recovery of debits become explicit problems. Independent local allowances no longer enforce a single aggregate budget. The outage and partition policy becomes part of the advertised guarantee.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** ● Compute the sustained rate for 100 requests per 60 seconds.

**E2** ● Compute the stated fixed-window boundary burst rate.

**E3** ● Compute the sliding-counter estimate at 15 seconds for counts 80 and 30.

**E4** ● Compute it at 30 seconds with the same counts.

**E5** ● Compute the undercount for the late-clustered history.

**E6** ● Compute the token balance after the initial burst of 80.

**E7** ● Compute refill over 6 seconds.

**E8** ● Compute tokens after spending 15 from that balance.

**E9** ● Compute the wait for cost 20 at balance 15.

**E10** ● Compute total independent allowance for four local full budgets.

**E11** ●● Trace the moving log at time 60.

**E12** ●● Compute simplified counter and log memory.

**E13** ●● Compute the token bound over a full 60-second interval.

**E14** ●● Compute a 20-job shaping delay and full 100-job drain.

**E15** ●● Compute mean outstanding limiter calls and three-dimension operation rate.

**E16** ●● Compute a fixed equal share and stranded leased allowance.

**E17** ●● Explain exact moving history without equations.

**E18** ●● Explain token and leaky buckets without equations.

**E19** ●● Explain the unavailable-limiter policy without equations.

**E20** ●● Compute the illustrative weighted upload cost and three-operation total.

**E21** ●●● Prove the token burst-plus-rate bound.

**E22** ●●● Construct a sliding-counter counterexample.

**E23** ●●● Write the reference atomic token state transition.

**E24** ●●● Design a last-slot race test and failover test.

**E25** ●●● Count all state and boundaries in the strict Heron user limiter.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Divide 100 by 60 to obtain 1.666666 recurring requests per second. It is a refill rate, not permission to admit a fraction of a cost-one request.

**E2.** The two buckets admit 100 each, giving 200. The span from 59.9 to 60.1 is 0.2 seconds. Dividing 200 by 0.2 yields 1,000 requests per second over that span.

**E3.** Elapsed fraction is 15/60 = 0.25. Previous overlap is 0.75, so the weighted previous count is 60. Add current 30 to obtain 90.

**E4.** Elapsed fraction is 30/60 = 0.5. Previous weighted count is 80 times 0.5 = 40. Add 30 to obtain 70.

**E5.** The true retained count is previous 80 plus current 30, or 110. The estimate is 90. Subtracting gives 20 admissions of undercount.

**E6.** The initial balance is 100. Spending 80 leaves 20, before any elapsed-time refill.

**E7.** Rate is 100/60 tokens per second. Multiplying by 6 adds 10. Starting at 20 gives 30, below the capacity cap.

**E8.** Subtract 15 from 30 to obtain 15 tokens. A simultaneous cost-20 request cannot pass without more elapsed refill.

**E9.** Deficit is 20 minus 15, or 5 tokens. Divide by 100/60 to obtain 3 seconds. The advice assumes no other spend takes the refill.

**E10.** Each local budget has 100. Multiplying by four gives 400. This does not preserve the shared 100-request rule.

**E11.** Start with times 0, 10, 40, and 59. The open-left cutoff is 60 minus 60 = 0, so remove time 0. Three entries remain; accepting time 60 gives four, at 10, 40, 59, and 60.

**E12.** The counter model uses 100,000 subjects times 32 bytes, or 3,200,000 bytes. The log holds 100,000 times 100 = 10,000,000 events. At assumed 24 bytes each it is 240,000,000 bytes; real representation overhead is excluded.

**E13.** Saved capacity is 100. Refill contributes (100/60) times 60 = 100. The accounting upper bound is 200 cost units, under the stated endpoint and atomic assumptions.

**E14.** At release rate 100/60, twenty jobs ahead imply 20 divided by that rate = 12 seconds. A 100-job queue with no new arrivals drains in 60 seconds. Processing costs are additional.

**E15.** At 1,000 decisions per second and 0.003-second round trip, the product is 3 mean in-flight calls. Three separate dimensions make 3,000 operations per second before retries. These are workload relations, not capacity measurements.

**E16.** Dividing 100 by four gives 25 per gateway. If four gateways each lose an unused 20-token lease, 4 times 20 = 80 tokens are stranded. Safely returning those tokens requires proving they cannot still be spent.

**E17.** Keep a unique slip for every accepted arrival still inside the declared recent interval. Remove old slips, count the rest, and append the new one only if room remains. The entire procedure must be one serialized decision.

**E18.** A token bucket saves bounded spending credit and admits a burst while credit remains. A shaping leaky bucket makes retained work leave at a steady pace. The former limits admission through credit; the latter can make accepted work wait.

**E19.** Choose explicitly whether each operation rejects, admits under a relaxed rule, or uses a bounded local allocation. Protect the downstream resource in every case. Independent full local budgets must not be described as the original shared allowance.

**E20.** The upload has 5,000,000,000 bytes and costs one unit per 100,000,000, giving 50 units. Costs 20, 30, and 50 total 100. Adding one more produces 101 and must fail when no refill occurred.

**E21.** The starting balance is at most capacity B. Refill during the interval adds at most rate r times duration, and cap clipping can only discard allowance. Every admitted cost is debited exactly once, so total admitted cost is at most B plus r times duration. A stale recovered balance or independent duplicate bucket violates the proof's premises.

**E22.** Store previous count 80 and current count 30 at 15 seconds into the new bucket. Place all previous events late enough to remain inside the exact trailing interval. Exact count is 110, while weighted estimate is 30 plus 80 times 0.75 = 90. The estimate cannot infer the missing placements.

**E23.** Use this transition under one serialized owner per subject.

```python
def admit(balance, last, now, cost, capacity, rate):
    if cost <= 0 or rate <= 0 or capacity <= 0:
        raise ValueError("invalid policy input")
    elapsed = max(0, now - last)
    available = min(capacity, balance + rate * elapsed)
    timestamp = max(last, now)
    if available < cost:
        return False, available, timestamp, (cost - available) / rate
    return True, available - cost, timestamp, 0
```

The numeric script checks the final-token race and rollback case. A per-process function alone does not supply distributed serialization.

**E24.** Issue simultaneous cost-one requests against one token with no elapsed refill. Exactly one serialized decision can allow; the other rejects. Separately fail over after a debit that was acknowledged but not retained by the recovered replica, and verify that the documented policy either detects, tolerates, or prevents recreated allowance.

**E25.** The trusted subject selects a recent accepted-event log and every accepted event has a unique identity. At the assumed active population, logs contain 10,000,000 events and simplified bytes total 240,000,000. The atomic boundary covers cleanup, count, append, and expiration; authentication, application effects, replica durability, and outage policy remain separate boundaries.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[Redis INCR](https://redis.io/docs/latest/commands/incr/). Counter patterns and increment-expiration races.

[Redis Lua scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/). Atomic local execution and bounded script behavior.

[Redis rate limiting](https://redis.io/docs/latest/develop/use-cases/rate-limiter/). Shared limiter representations and usage.

[Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/). Slot ownership and replication limitations.

[RFC 6585](https://www.rfc-editor.org/rfc/rfc6585). HTTP 429 and its cache and retry-advice rules.

[RFC 3290](https://www.rfc-editor.org/rfc/rfc3290). Token-bucket meters and shaping/policing terminology.

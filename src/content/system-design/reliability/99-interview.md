@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. What is a single point of failure?**

It is a required component whose failure alone defeats a specified operation. Several callers can still share one such component. Identify it by tracing the complete operation rather than counting replicas.

**Q2. Can a service be reachable but unreliable?**

Yes. A reachable response may be incorrect, unauthorized, stale beyond its contract, or late. Success must include the operation's actual requirements.

**Q3. How do you define availability?**

Choose a success definition and denominator, then count the successful fraction of eligible time or requests. Time-based and request-based measurements need not agree. State planned exclusions explicitly.

**Q4. What is the thirty-day 99.9% time budget?**

The interval is 2,592,000 seconds, and its failure fraction is 0.001. Multiplication gives 2,592 seconds. This is an accounting budget rather than an individual-incident recovery promise.

**Q5. What changes at 99.99%?**

The same interval permits 259.2 seconds because the unavailable fraction is 0.0001. That is one tenth of the 99.9% budget. It does not establish a data-loss objective.

**Q6. Why do required dependencies multiply availability?**

All required components must be usable at the same time. Under independent failures their joint successful probability is the product. Correlation or mismatched definitions invalidate a naive calculation.

**Q7. Why does redundancy need sufficient alternatives?**

A surviving path must perform the whole required job. An out-of-date read replica cannot substitute for a fresh authoritative read unless the contract permits it. Capability matters as much as reachability.

**Q8. What is a failure domain?**

It is the set of resources that one incident can disable together. Hosts, zones, regions, software deployments, credentials, and control services define different domains. Name the event when describing independence.

**Q9. Why can a global deployment defeat geographic redundancy?**

Every location can receive the same invalid binary or configuration. Moving hardware does not remove that shared software cause. Staged rollout and rollback protect a different failure domain.

**Q10. How do you size a fleet for replica loss?**

Calculate usable surviving capacity against original traffic and recovery attempts. Test the cold survivor workload, not only normal average utilization. Distribution skew can invalidate an even-load model.

**Q11. What does active-active mean?**

Multiple sites accept live work. It does not specify how they coordinate writes or resolve conflicts. The consistency and ownership contract remains a separate design decision.

**Q12. What does active-passive require?**

The standby needs sufficiently current state, usable credentials, recovery procedures, and capacity. Promotion and routing take time. An idle process that has never been tested is not evidence of readiness.

**Q13. How does fault tolerance differ from degradation?**

Fault tolerance preserves a stated guarantee despite named faults. Degradation switches to a documented smaller capability or quality. Both must preserve remaining mandatory rules, including permission and integrity.

**Q14. Can cached scores be a fallback?**

Only if the fallback freshness and authorization rules permit them. Expose age when it affects the user, and bound database fallback traffic. A cache outage can otherwise multiply load on the database.

**Q15. Why do slow dependencies exhaust callers?**

Longer waits raise in-flight work at the same arrival rate. That work holds memory, connections, and slots. Deadlines and concurrency bounds stop the dependency from consuming all caller resources.

**Q16. What is a cascading failure?**

It is a failure that feeds further failure through increased load or lost resources. Replica loss, retries, and health-based routing can reinforce one another. Remove the feedback and reduce demand enough for surviving capacity.

**Q17. How do you calculate backlog drain?**

Subtract continuing arrivals from processing capacity first. Divide the backlog by that positive net drain rate. If arrivals meet or exceed capacity, the backlog does not drain.

**Q18. Which errors should not be retried automatically?**

Permanent validation and permission failures usually need a corrected request. Uncertain effects require identity-based recovery rather than a new operation. Only eligible transient failures belong in a bounded retry policy.

**Q19. What does exponential backoff control?**

It increases the delay ceiling between attempts. A cap bounds one delay, while the deadline and attempt budget bound the operation. Backoff alone does not prevent synchronized retries.

**Q20. What does full jitter mean?**

Sample uniformly between zero and the current ceiling. The mean is half the ceiling, but an individual delay can be anywhere in that interval. Its purpose is spreading retry times rather than enforcing fairness.

**Q21. Why have one retry owner?**

Multiple retrying layers multiply downstream attempts. The owner should know whether the effect is safe to repeat and how much useful time remains. Other layers should report outcomes without hiding their own extra attempt counts.

**Q22. What does a service-wide retry budget add?**

It bounds recovery demand across many original requests. Per-request limits can still permit a large fleet-wide retry surge. Both limits are useful during a shared outage.

**Q23. How does a timeout differ from a deadline?**

A timeout bounds one wait; a deadline bounds the whole operation. Downstream waits must fit inside remaining useful time. Fresh downstream timeouts should not restart the original budget.

**Q24. Does a timeout prove rollback?**

No. The callee may complete after the caller stops waiting. Recover an uncertain write using its original identity or authoritative state rather than assuming it did nothing.

**Q25. What does a circuit breaker do?**

It temporarily suppresses calls after chosen failure evidence. Controlled probes test recovery before reopening. Its states protect resources and do not prove global failure or leadership.

**Q26. What belongs in half-open behavior?**

A bounded probe set, success and failure criteria, and a rule for reopening or closing. A successful probe is evidence of progress, not full recovered capacity. Ramp admission with capacity measurements.

**Q27. What is a bulkhead?**

It bounds the resources one workload or dependency can consume. Separate slots or pools prevent that workload from exhausting every caller. Other shared resources can still defeat incomplete isolation.

**Q28. Why separate liveness and readiness?**

Restarting a process and removing it from routing answer different questions. A shared dependency outage may justify removing a capability without restarting every caller. A process can remain alive while temporarily unable to accept work.

**Q29. Why use consecutive health failures?**

They reduce reactions to isolated missed probes at the cost of detection delay. Probe timing, timeout, and phase determine actual removal timing. Recovery needs hysteresis so routing does not repeatedly flap.

**Q30. What is draining?**

Stop admitting new work to an instance while existing work finishes within its bounds. It separates routing change from termination. Unbounded existing work still needs cancellation or a final deadline.

**Q31. What contributes to failover time?**

Detection, state recovery, safe ownership, routing, and readiness. Some may overlap, but only the actual critical path determines completion. A leader selection event alone does not restore service.

**Q32. Why can failover create split brain?**

The old owner can remain alive in a partition even though the controller cannot reach it. Promoting another owner then gives competing authority. The protected resource must reject obsolete ownership.

**Q33. What is a fencing token?**

It is an ordered authority value checked at the effect boundary. A newer owner makes older tokens obsolete. A local timer alone cannot force a remote paused writer to stop.

**Q34. Why is replication different from backup?**

Replication tracks changes, including destructive ones. A recovery copy preserves earlier recoverable state under its retention rules. Both are useful but protect different incidents.

**Q35. What is RTO?**

It is a targeted maximum restoration time for a defined service after a defined incident. Specify when timing starts and which operation must succeed when it stops. Test the full path against that objective.

**Q36. What is RPO?**

It is the targeted maximum gap in recoverable committed state. It is commonly described as time, but can be translated to a workload-specific record count. It is independent of restoration speed.

**Q37. Can snapshot frequency establish RPO by itself?**

No. Failed snapshots, delayed completion, missing keys, and unreadable copies change the latest usable point. Independently retained log replay may improve it. Measure recoverable committed history.

**Q38. What makes a restore drill complete?**

It exercises the actual recovery identity, replacement infrastructure, data restore, history replay, invariant checks, and routing. It records time and preserved state. Include a failed newest copy and the key recovery path.

**Q39. Walk me through the whole Heron recovery path.**

Bound admission and caller resources, classify uncertain effects, and route only to capable surviving paths. Safely recover and fence ownership, restore independent state if needed, verify application invariants, and reopen gradually. Measure capacity, user success, RTO, and RPO separately.

**Q40. What changes between simple redundancy and a complete reliability plan?**

Simple redundancy supplies spare components. The complete plan names common causes, survivor capacity, safe effects, bounded recovery traffic, and tested restoration. Those details determine whether the spare components can actually preserve the operation.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** ● Compute the illustrative thirty-day interval in seconds.

**E2** ● Compute its 99.9% unavailable-time budget.

**E3** ● Compute its 99.99% unavailable-time budget.

**E4** ● Compute required-path availability for the three independent 99.9% components.

**E5** ● Compute two-path independent availability with each path at 99.9%.

**E6** ● Add the shared 99.9% dependency to that alternative-path model.

**E7** ● Compute normal and one-loss capacity for the reliability variant.

**E8** ● Compute three-layer amplification with three attempts at each layer.

**E9** ● Compute the mean full-jitter delay under an 800 millisecond ceiling.

**E10** ● Compute the request-based daily 99.9% error budget.

**E11** ●● Trace the remaining deadline after the stated reserves and spent work.

**E12** ●● Compute in-flight work before and during the stated slowdown.

**E13** ●● Compute database demand after loss of the 90% read cache.

**E14** ●● Calculate the illustrative backlog drain time.

**E15** ●● Calculate the failover trace and name the stages.

**E16** ●● Calculate restore time and RTO margin.

**E17** ●● Translate the snapshot gap and replica lag to event counts.

**E18** ●● Explain graceful degradation without equations.

**E19** ●● Explain a bulkhead without equations.

**E20** ●● Explain RTO and RPO without equations.

**E21** ●●● Derive the alternative-path formula and its assumptions.

**E22** ●●● Show why retries at independent layers multiply attempt counts.

**E23** ●●● Write a bounded retry loop that preserves command identity.

**E24** ●●● Count all recovery demand for the one-replica-loss hedging example.

**E25** ●●● Design a drill for a returning old writer.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Multiply 30 days by 24 hours, then by 60 minutes and 60 seconds. The result is 2,592,000 seconds; this is the interval used by the time-based budget.

**E2.** Subtract 0.999 from 1 to get 0.001. Multiply 2,592,000 by 0.001 to obtain 2,592 seconds.

**E3.** Subtract 0.9999 from 1 to get 0.0001. Multiply 2,592,000 by 0.0001 to obtain 259.2 seconds.

**E4.** Multiply 0.999 by 0.999 to get 0.998001. Multiply again by 0.999 to obtain 0.997002999, or 99.7002999%.

**E5.** Each path fails with probability 0.001. Both fail with probability 0.001 squared, or 0.000001. Subtract this from 1 to obtain 0.999999.

**E6.** The pair is available with probability 0.999999. Multiplying by 0.999 gives 0.998999001. The common dependency dominates the small independent pair failure probability.

**E7.** Four replicas at 350 requests per second supply 1,400. Removing one leaves three at 350, or 1,050. At peak 1,000 demand, the survivor margin is 50.

**E8.** The gateway contributes 3 attempts, each service attempt contributes another factor of 3, and the database wrapper another factor of 3. The product is 27 downstream attempts per logical operation.

**E9.** A uniform delay between zero and 800 milliseconds has mean 800 divided by 2. The result is 400 milliseconds; it is not an exact delay for a particular caller.

**E10.** The unavailable fraction is 0.001. Multiplying 8,640,000 eligible requests by 0.001 gives 8,640 failed requests. Integrity remains a separate requirement.

**E11.** Start with 500 milliseconds. Remove 40 of network reserve and 60 of response reserve, leaving 400. Remove 120 already spent, leaving 280 useful milliseconds for new application work.

**E12.** At 1,000 arrivals per second and 0.2 seconds mean duration, the product is 200 requests. At 2 seconds it is 2,000. The increase is a factor of 10 with unchanged original demand.

**E13.** Normal misses are 1,000 multiplied by 0.1, or 100 per second. Unconditional fallback sends all 1,000. Dividing 1,000 by 100 gives a factor of 10.

**E14.** Processing supplies 800 jobs per second while arrivals add 600. Net drain is 200. A 12,000-job backlog takes 12,000 divided by 200, or 60 seconds, assuming both rates remain stable.

**E15.** Detection takes 15 seconds, promotion 10, and routing 5. The serial sum is 30. This trace assumes those stages do not overlap and that promotion includes the required safety work.

**E16.** Preparation takes 60 seconds and restoration 180, giving 240. Verification and routing add 120, giving 360. Against the 600-second objective, the margin is 240 seconds.

**E17.** A 300-second snapshot gap at 20 events per second exposes 6,000 events. A 2-second lag at the same rate exposes 40. Neither calculation alone guarantees the real failure interval is bounded that way.

**E18.** Return the required score with its permitted freshness and authorization while omitting unavailable recommendations. The response states any reduced capability. It does not weaken score correctness or blindly send all cache misses to an overloaded database.

**E19.** Give clip calls their own bounded slots so stalled clips cannot occupy every application slot. Preserve a resource allocation for score reads. Check other shared resources because a common database or memory limit can still defeat thread isolation.

**E20.** RTO asks when the defined service can work again after the incident. RPO asks how far back the newest recoverable committed state may be. Fast restoration can still lose data, and perfect preservation can still take a long time to restore.

**E21.** An operation fails only if all sufficient alternatives fail. Independent failures multiply their individual failure probabilities, each equal to one minus availability. Subtract their product from one. Independence and sufficient capability are necessary; shared dependencies and stale substitutes violate the model.

**E22.** For every top-layer attempt, the next layer can issue its full permitted attempt set. Repeating this through the call tree gives the product of each layer's total attempt limit. Returning errors sooner does not change that upper bound; assigning one retry owner removes the independent branching.

**E23.** Keep the same command key outside the loop. Before each eligible retry, check attempt budget and remaining deadline, then sleep for a full-jitter delay inside that remainder.

```python
key = command.key
for attempt in range(max_attempts):
    if deadline.remaining() <= 0:
        break
    result = call(command, key, deadline)
    if result.success or not result.retryable:
        return result
    delay = random.uniform(0, min(cap, base * 2**attempt))
    if delay >= deadline.remaining():
        break
    sleep(delay)
return recover_or_report_uncertain(key)
```

The downstream service must atomically retain the effect and result for this key; the loop itself cannot make an unsafe write idempotent.

**E24.** Original demand is 1,000 requests per second. A 5% hedge rate adds 50, producing 1,050. The surviving fleet also supplies 1,050, so no modeled margin remains. Retries, load skew, and backlog work need extra room or admission reduction.

**E25.** Pause the original writer after it acquires authority, promote another writer under a newer fenced authority, then resume the original. The state store must reject the original's late effect and accept only current authority. Verify committed command history and ensure the client can recover an uncertain old command without duplicating it.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[Google SRE: addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/). Overload feedback, deadline propagation, bounded queues, and retry amplification.

[Amazon Builders' Library: timeouts, retries, and jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/). Retry timing and capacity controls.

[Amazon Builders' Library: idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/). Recovering uncertain effects using caller request identity.

[AWS disaster recovery objectives](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/recovery-objectives.html). Recovery time and recoverable data objectives.

[Kubernetes probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/). Startup, readiness, and liveness have distinct operational purposes.

[The Chubby lock service](https://research.google/pubs/the-chubby-lock-service-for-loosely-coupled-distributed-systems/). Lock authority and checking ownership at protected resources.

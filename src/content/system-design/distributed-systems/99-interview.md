@chapter faq | Interview question bank | Explain the operation, intermediate states, and exact failure boundary before naming the product.

### Partitions and promises

**Q1. What does a partition leave unknown?**

It hides what the other side is doing, not merely whether it has crashed. A living isolated process can still handle local requests. Heron therefore makes authority a protocol decision rather than a health-check inference.

**Q2. State CAP without a product label.**

During a partition, an asynchronous read/write system cannot promise both linearizable operations and completion of every operation at non-failing nodes. Name the operation that waits or rejects, or the one that can return an older value. Monthly uptime is a different property.

**Q3. Can one product have different partition behavior?**

Yes. Heron refuses an authoritative score correction without usable authority while allowing explicitly stale public reads. The same store can participate in both contracts, but a stale permission check needs separate review.

**Q4. Why does timeout not mean rollback?**

The server may have completed before the reply disappeared or may complete after the caller stops waiting. Retry the same operation identity or query its status. Changing the identity can create another valid effect.

**Q5. What can an overlapping linearizable read return?**

It can return the value before or after the overlapping write if a legal single order exists. A read begun after the write finishes must reflect that write or a later one. The real-time boundaries make the difference.

### Observable histories

**Q6. What makes eventual consistency eventual?**

A repair mechanism and its stated progress conditions force convergence. A dropped update without repair can leave a replica old forever. A maximum convergence delay is a further contract, not part of the phrase alone.

**Q7. How do you prevent a reply appearing before its cause?**

Carry the causal dependency and delay visibility until the replica has it. Independent changes need not share a universal order. A physical timestamp alone does not prove the dependency.

**Q8. Read-your-writes or monotonic reads?**

Read-your-writes preserves a session own changes, while monotonic reads prevents that session moving behind previously observed history. Carry a comparable minimum position and wait or route to a suitable replica. Sticky routing alone fails after unsuitable failover.

**Q9. What does a single leader simplify?**

It gives conflicting writes an explicit ordering point. Followers can still lag, and acknowledgement timing determines recovery exposure. Leadership also needs a safe change protocol when the old process is unavailable.

**Q10. Compute the asynchronous replica exposure.**

At 20 events per second and 5 seconds of lag, the candidate lacks 100 events. At 200 payload bytes per event that is 20,000 bytes. This is exposure on that copy, not proven permanent loss.

### Replica architectures

**Q11. Why is last-write-wins a business decision?**

It discards one concurrent value under an ordering convention. Clock skew can choose a winner different from real-time order. Convergence does not show that a unique booking or official correction invariant survived.

**Q12. What does R plus W greater than N actually prove?**

Within fixed owners it proves a minimum read/write set overlap. Version selection, concurrent and incomplete writes, durable acknowledgements, and membership still need rules. It is not a complete linearizability proof.

**Q13. What does a heartbeat prove?**

It proves recent contact when received. A missing signal creates suspicion and can reflect a pause or congestion. The takeover protocol must remain safe when the suspected process resumes.

**Q14. What is the lease-holder pause problem?**

A process can check ownership, pause beyond expiry, and resume at the next instruction. The old check does not authorize a later effect. A protected resource needs authority enforcement compatible with takeover.

**Q15. When does highest-seen fencing reject token 7?**

After the resource has processed and persisted a greater token, such as 8, and atomically checks it with the effect. Issuing 8 only at the coordinator does not update the resource. Immediate revocation needs a stronger validation or coordinated installation boundary.

### Detection and ownership

**Q16. Does fencing also deduplicate commands?**

No. A current owner can send the same valid-token command twice. Command identity prevents a repeated effect, while the fencing token rejects obsolete authority. Both need the appropriate atomic state boundary.

**Q17. Why agree on command order?**

Different orders can produce different results for conditional replacement. Equivalent starting state and deterministic application of the agreed sequence give equivalent state. Matching log bytes alone does not control local random choices or external lookups.

**Q18. Safety or liveness?**

Safety rules out forbidden outcomes, while liveness requires eventual progress under specified conditions. A cluster can safely stop without a suitable quorum. Lowering timeouts cannot justify contradictory accepted histories.

**Q19. Stored, committed, or applied?**

Stored means bytes exist locally, committed means the protocol has accepted the prefix, and applied means the local state machine has executed it. A follower can have all three positions different. A read needs the relevant visible applied state and authority proof.

**Q20. Does consensus make an email exactly once?**

No. It orders commands inside its own history. An external effect needs durable intent, stable identity, and the receiver or provider recovery contract. An outbox allows retry but can still deliver duplicates.

### Consensus

**Q21. Why persist a Raft vote?**

A restart must not let a voter grant a second vote in the same term. The persisted term and vote support election safety. A vote count without the restart rule is incomplete.

**Q22. Why can a shorter Raft log be fresher?**

Raft compares the final entry term before its index. Term 4 at index 8 outranks term 3 at index 9. When terms tie, the larger final index is fresher.

**Q23. What does an AppendEntries predecessor check do?**

It verifies the history immediately before the new suffix. A mismatch is rejected and the leader retries from an earlier matching prefix. Only then can a conflicting uncommitted suffix be replaced safely.

**Q24. Why commit a current-term entry?**

Raft direct majority commitment applies to an entry in the leader current term. Committing it also commits its preceding prefix. Counting copies of an older-term entry alone skips the election-related safety condition.

**Q25. What belongs in a coordination service?**

Small ownership, membership, and configuration decisions with documented API semantics. Heron viewer payloads follow their own data path. The resource still validates the authority that the control decision grants.

### Raft log safety

**Q26. How does a watch recover after disconnect?**

Resume from a compatible retained position if the API supports replay. Otherwise reread state and establish a compatible watch without a gap. Notifications do not replace resource-side authority checks.

**Q27. Can two processes say leader without corrupting state?**

Yes, if only suitable current authority can produce accepted effects. Old local belief can survive isolation. The safety question is what the protocol or protected resource rejects.

**Q28. Why not replace all voter addresses at once?**

Old and new groups can form disjoint majorities. Use the implementation supported coordinated membership transition. Sharing a listed member alone does not ensure every pair of majorities intersects.

**Q29. Walk through an authoritative correction.**

Validate permission, authority, identity, and expected version; order the command; commit under the protocol; apply score and result together. Return a required read position. Publish external intent through its separate recovery boundary.

**Q30. What happens when the leader crashes before replying?**

The client outcome is uncertain. A new suitable leader preserves committed history and a keyed retry retrieves the accepted result. An uncommitted proposal may survive or be replaced, so the missing reply proves neither result.

### Coordination services

**Q31. What must a state-machine snapshot contain?**

A compatible included index and term plus application state needed for future behavior. Deduplication state cannot be forgotten while old retries remain valid. Continue replay after the included prefix, not before it.

**Q32. Count the illustrative three-copy event stream.**

Each logical 200-byte event takes 600 payload bytes across three copies. At 20 events per second that is 12,000 stored payload bytes per second before overhead. Viewer deliveries are a separate fan-out budget.

**Q33. Why is a leader local read sometimes unsafe?**

An isolated old leader can still have local data while lacking current authority. A linearizable read needs a suitable protocol read barrier and sufficient application progress. The role name alone is no proof.

**Q34. What changes when quorum owners are substituted?**

The read and write sets may no longer be subsets of the same fixed owner universe. The simple overlap inequality then does not apply unchanged. Handoff, reconciliation, and owner tracking need their own protocol.

**Q35. What can resurrect a deleted distributed record?**

An old replica can return a value if deletion knowledge was discarded before repair. Retain suitable tombstones or another deletion-generation rule. Convergence must include absence as well as positive values.

### The complete distributed write

**Q36. What is outside the crash-failure model?**

A participant that fabricates messages or behaves arbitrarily is Byzantine. Crash-tolerant majority counts do not prove tolerance of those faults. Choose a different protocol or state that boundary explicitly.

**Q37. Why are logical clocks not physical clocks?**

They order information flow rather than measure elapsed wall time. A causal predecessor receives a smaller appropriate logical timestamp, but scalar inequality does not prove causality in reverse. Dependency metadata can provide the needed stronger relation.

**Q38. Why retain operation results?**

An old retry otherwise becomes indistinguishable from new work after its identity record disappears. Bound retry lifetime or retain durable identity information. Retention is part of the duplicate-effect contract.

**Q39. Walk through the whole thing after a partition.**

Identify the communicating authority group, reject obsolete effects at the resource, and preserve the protocol accepted history. Repair replicas, apply committed state, and satisfy required read positions. External events reconcile through stable identities rather than assuming one global transaction.

**Q40. What changed from naive copying to the complete design?**

Naive copying reproduces values without defining authority, ordering, acknowledgement, or recovery. The complete design makes those boundaries explicit and attaches identities and read requirements. Its cost is coordination, metadata, and sometimes refusal to proceed during failure.

@chapter exercises | Exercises | One dot is direct arithmetic, two dots require a worked history, and three dots require a derivation, code, or complete budget.

**E1** ● For N=3, W=2, R=2 compute the fixed-set overlap lower bound.

**E2** ● For N=5, W=3, R=3 compute the overlap lower bound.

**E3** ● Count the majority and tolerated unavailable voters for N=3.

**E4** ● Repeat the majority calculation for N=5.

**E5** ● Count events exposed by 20 events/s and a 5-second replica gap.

**E6** ● Count payload bytes for those exposed 200-byte events.

**E7** ● Count three stored copies of one 200-byte event.

**E8** ● Count three-copy payload storage rate at 20 events/s.

**E9** ● Count fan-out payload at 20 events/s, 50,000 viewers, and 200 bytes.

**E10** ● Compute time beyond a lease expiry at 3 when its holder resumes at 4.

**E11** ●● Show a forbidden linearizable history without equations.

**E12** ●● Explain causal visibility without equations.

**E13** ●● Explain why quorum overlap is insufficient without equations.

**E14** ●● Trace a session requiring position 8 on followers at 7 and 9.

**E15** ●● Trace token 8 issued at the coordinator before storage sees it.

**E16** ●● Trace token 7 after storage atomically installs token 8.

**E17** ●● Compare Raft log pairs B=(4,8), C=(3,9), D=(4,7).

**E18** ●● Repair C=[1,2,3] from leader B=[1,2,4] with the final entries uncommitted.

**E19** ●● Commit an old term-4 entry at 8 under leader term 5.

**E20** ●● Recover a snapshot through 8 with committed suffix 9 and 10.

**E21** ●●● Prove the fixed-set overlap lower bound.

**E22** ●●● Derive the minimum voters needed to tolerate f unavailable voters.

**E23** ●●● Write the protected state update that enforces highest-seen fencing and command identity.

**E24** ●●● Count the full one-day event payload budget across 3 copies and compare one second of fan-out.

**E25** ●●● Design a lost-reply correction with an external update and verify every boundary.

@chapter solutions | Worked solutions | Each numerical result follows the stated illustrative assumptions and is reproduced in copies-review-numbers.py.

**E1.** R+W-N=2+2-3=1 participating owner. The bound assumes both sets use the same fixed universe.

**E2.** 3+3-5=1. Two sets of size 3 drawn from the same 5 owners cannot be disjoint.

**E3.** floor(3/2)+1=2 voters form a majority. 3-2=1 voter may be unavailable if the remaining eligible voters communicate.

**E4.** floor(5/2)+1=3 is a majority. 5-3=2 unavailable voters leave the required 3, under the same communication and protocol assumptions.

**E5.** 20 times 5 gives 100 events absent from that candidate copy. The count is exposure, not a claim that no surviving source can recover them.

**E6.** 100 times 200 gives 20,000 payload bytes. Headers, indexes, and framing are outside the stated payload size.

**E7.** 3 times 200 gives 600 payload bytes. This is replicated storage, not viewer deliveries.

**E8.** 20 times 200 gives 4,000 logical payload bytes/s. Multiplying by 3 copies gives 12,000 stored payload bytes/s.

**E9.** 20 times 50,000 gives 1,000,000 deliveries/s. Multiplying by 200 gives 200,000,000 payload bytes/s, before transport overhead.

**E10.** 4-3=1 second beyond the illustrative expiry. The pause example does not itself establish any real clock bounds.

**E11.** A completes score 11, then B starts a read and returns 10 without an intervening write. That later read cannot fit before the completed write, so no legal score-register order explains the result.

**E12.** Show complaint P before reply Q that was written after observing P. A replica holding Q but lacking P delays Q until P is available. Unrelated messages need not wait for a universal order.

**E13.** The overlap identifies a possible informed participant, but a reader could still return the first old response. Version selection, interrupted writes, durability, and owner membership need explicit rules before claiming a stronger consistency property.

**E14.** The position-7 follower waits or redirects. The position-9 follower can be eligible if its visible view and read authority satisfy the contract. After observing 12, the session minimum rises to 12.

**E15.** Storage still records highest token 7, so highest-seen fencing can accept a token-7 write. B must install or validate token 8 at the effect boundary. Only after processing the greater token does that comparison reject the old request.

**E16.** Storage persists highest token 8 and acknowledges the installation. A sends token 7. The comparison 7<8 rejects the request before its protected mutation; a new token-8 command remains separately subject to identity and precondition checks.

**E17.** Compare term first: 4>3 makes B fresher than C. B and D tie at term 4, and 8>7 makes B fresher than D. A longer index alone does not outrank a newer final term.

**E18.** A request referencing predecessor index 3, term 4 fails because C holds term 3 there. Retry with predecessor index 2, term 2 and the leader entry at 3. C removes the conflicting suffix and ends with [1,2,4].

**E19.** Append a current-term entry at 9 and replicate it under Raft to a majority. Directly commit 9 using its current term, which also commits preceding index 8. Counting copies of 8 alone is insufficient for that direct rule.

**E20.** Install the compatible snapshot with its included term and index and required application state. Replay 9 and then 10. Do not reapply 8 as another effect or skip 9 because 10 was transferred first.

**E21.** The read/write union is a subset of N fixed owners, so its size is at most N. Inclusion-exclusion gives intersection size R+W minus union size, at least R+W-N. The theorem about sets does not establish version ordering or durability.

**E22.** A majority of N is floor(N/2)+1. Requiring N-f to reach it gives the familiar sufficient odd size N=2f+1, whose majority is f+1 and whose survivors after f failures number f+1. This also requires suitable communication and protocol state.

**E23.** Inside one atomic transaction, reject token below highest, validate a prior command payload or insert its unique identity, update highest when needed, apply the effect, and store the result. The pseudocode below intentionally leaves the transaction implementation to the authoritative resource; an application-side check followed by an unchecked write is incorrect.

```python
with resource.transaction() as tx:
    tx.reject_if(token < tx.highest_token)
    prior = tx.command_result(command_id)
    if prior is not None:
        tx.require_same_payload(prior, payload)
        return prior.result
    tx.highest_token = max(tx.highest_token, token)
    result = tx.apply(payload)
    tx.record_command(command_id, payload, result)
return result
```

**E24.** One day has 24 times 60 times 60=86,400 seconds. One-copy payload is 20 times 200 times 86,400=345,600,000 bytes. Three copies use 1,036,800,000 bytes. One second of the viewer path carries 20 times 200 times 50,000=200,000,000 bytes, a different delivery workload.

**E25.** Commit score 11, c9 result, and e9 intent together. After a lost API reply, retry c9 and return its recorded result rather than score 12. Repeated e9 delivery is allowed, while the consumer atomically stores e9 identity with its effect. The source, broker, and consumer retain separate durability and recovery boundaries.

### Primary references and arithmetic

[Gilbert and Lynch, CAP proof](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Lamport, logical clocks and event order](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Raft paper by Ongaro and Ousterhout](https://raft.github.io/raft.pdf). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Fischer, Lynch, and Paterson, asynchronous consensus](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[etcd API guarantees](https://etcd.io/docs/v3.6/learning/api_guarantees/). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[ZooKeeper coordination model](https://zookeeper.apache.org/doc/current/zookeeperOver.html). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

[Chubby lock service](https://research.google/pubs/the-chubby-lock-service-for-loosely-coupled-distributed-systems/). Read the original contract alongside the illustrative histories; the Heron capacities are assumptions, not product benchmarks.

The independent arithmetic and policy traces are kept in `scripts/system-design/copies-review-numbers.py`. They cover Heron workload budgets, quorum counts, local state transitions, cache replacement victims, and the numerical exercise answers.

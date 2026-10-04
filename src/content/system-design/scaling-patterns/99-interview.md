@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How would you explain a limit is not a pattern name in a production design?**

Describe the limit in units of work and name the demand that reaches it. A pattern is justified by the mechanism it changes, not by the familiarity of its name. Compare the current flow with the proposed flow before adding services. A design can move the bottleneck downstream. Verify the new dependency and failure workload, not only the faster normal request.

**Q2. How would you explain invariants before distribution in a production design?**

Write the rule in terms of allowed transitions, then identify the commit boundary that enforces it atomically. A read check outside that boundary leaves a race. Distribution must preserve or explicitly weaken the invariant. An application check followed by an unconditional write can lose an intervening update. Expected-version enforcement belongs in the same atomic operation as the state change.

**Q3. How would you explain replication changes copies in a production design?**

Replication adds copies and can add read capacity or recovery options. Name which copies acknowledge a write, which serve reads, and how failover chooses a sufficiently current owner. It does not automatically multiply write capacity. Acknowledgement semantics determine loss risk. A replica that exists but has not received the latest acknowledged write does not meet a zero-loss failover promise.

**Q4. How would you explain partitioning changes ownership in a production design?**

Partitioning distributes subsets of state. Choose a key from the operations and invariants that need locality, then calculate skew and cross-shard work. The balanced average is only a starting assumption. A cross-shard transaction is a new coordination problem. Adding shards without changing the ownership rule can spread storage while leaving the hottest request on one node.

**Q5. How would you explain partition keys and locality in a production design?**

Choose a primary locality for the invariant, then provide secondary derived access paths when their freshness contract permits it. Count scatter work and merge delay for queries that cannot name one owner. A user-facing query pattern can change after schema design. Track which operations fan out as the access patterns evolve.

**Q6. How would you explain consistent hashing and movement in a production design?**

Consistent hashing limits ownership movement when membership changes. Distinguish ideal balance from actual key distribution, and distinguish placement from data transfer and consistency. A membership epoch keeps routing decisions interpretable. Moving a cache key can be a miss; moving authoritative database state needs a safe transfer protocol. The same hash function does not supply the same recovery contract.

**Q7. How would you explain hot keys survive balanced hashing in a production design?**

Hash balance spreads many keys, not the requests for one key. Mitigate hot reads with bounded replication or caching, and split writes only when their invariant permits a merge rule. Salting a key without a query plan moves the problem to reads, which now need to gather and reconcile the salted pieces.

**Q8. How would you explain resharding without two owners in a production design?**

Separate copy, catch-up, and ownership switch. The switch needs a version or fence that prevents both owners from committing independently. Verify records changed during copying, not only static snapshot counts. A router cache can preserve old ownership after the switch. The old owner must enforce the epoch rather than trusting every client to refresh immediately.

**Q9. How would you explain cqrs separates models in a production design?**

CQRS separates update and query models because their jobs differ. It does not require event sourcing or microservices. Add a separate read store only when its benefit pays for lag, rebuilding, and another failure path. Using two endpoint names over the same unchanged logic does not explain a useful model separation. State what representation differs and why.

**Q10. How would you explain materialized views pay early in a production design?**

A materialized view precomputes a query answer. State what changes invalidate it, how updates reach it, and how readers identify its source version. It saves repeated computation by adding stored derived state and maintenance work. A mutable card with no source version cannot tell whether an out-of-order update overwrote a newer result.

**Q11. How would you explain projection updates and duplicate delivery in a production design?**

A projection must tolerate its actual delivery semantics. Use a monotonic version for replacements or a durable deduplication record for nonrepeatable effects. Checkpoint and effect should not create an independent failure window. Global sequence numbers are not implied by per-partition offsets. Keep the version rule scoped to the aggregate or partition whose ordering it describes.

**Q12. How would you explain lag, catch-up, and read-your-writes in a production design?**

A derived read needs an explicit lag policy. Return a write version and let reads require it when read-your-writes matters. Compute recovery from spare processing capacity while arrivals continue. Waiting forever for a projection turns a lagged read store into an unbounded request queue. Use a deadline and a documented fallback.

**Q13. How would you explain event sourcing preserves domain changes in a production design?**

Event sourcing makes the event history authoritative. State is a deterministic fold over ordered domain changes. A broker or database change log is not automatically a domain event store. An event that says fetch the current team data cannot reliably reproduce historical state after that team data changes.

**Q14. How would you explain expected versions and concurrent appends in a production design?**

Append against the version used to validate the command. On conflict, reload and reconsider the command rather than blindly repeating a precomputed event. Deduplicate repeated commands separately from concurrent distinct commands. A unique event ID prevents duplicate identity, but does not by itself prevent two different events from violating a state invariant.

**Q15. How would you explain snapshots and replay cost in a production design?**

A snapshot accelerates reconstruction but remains derived state. Pair it with its exact source boundary, validate it, and keep a path to recover without it. Snapshot loading and replay are separate costs. Deleting history solely because a snapshot exists changes the audit and recovery contract. A snapshot cannot answer every historical question.

**Q16. How would you explain replay, schema evolution, and outside effects in a production design?**

Keep deterministic reconstruction separate from live outside effects. Version event meaning and test old histories. Store completed effect outcomes when recovery must know them, rather than asking the outside world to repeat the action. Changing the transition code can change the reconstructed result. Treat that as a migration or correction with explicit tests, not a harmless refactor.

**Q17. How would you explain the dual-write failure window in a production design?**

Independent commit points leave a crash window. Make the authority and a publication intention recoverable together, then let a retryable relay perform the outside publication. Name when the client’s success becomes safe. A local try/finally block does not run after a power loss. Recovery needs durable state, not only an exception handler.

**Q18. How would you explain transactional outbox in a production design?**

Commit business state and the outbox row together. The relay makes the intention visible outside the database later. The pattern prevents a committed change from losing its publication intention, while allowing duplicate sends. An outbox row inserted after the business transaction recreates the original failure window. Both belong to the same local commit.

**Q19. How would you explain relays, claims, and acknowledgement loss in a production design?**

A claim reduces contention; it does not remove the send-and-mark failure window. Choose safe redelivery over silent loss and make consumers repeatable. Polling delay is one part of delivery lag, not its entire bound. Deleting an outbox record immediately after a local send call can lose publication when the broker never accepted it. Use the actual broker acknowledgement semantics.

**Q20. How would you explain cdc checkpoints and retained logs in a production design?**

CDC follows committed database changes from a recoverable position. Pair snapshot and stream boundaries, retain the needed log, and tolerate restart duplicates. Translate storage mutations into business meaning when the consumers require it. Advancing the checkpoint before applying the effect can lose work. Applying the effect first can replay it after a crash; that path needs atomic progress or deduplication.

**Q21. How would you explain saga steps and local commits in a production design?**

A saga coordinates local commits with explicit recovery. Persist state and use repeatable commands at each step. State which intermediate results are visible because a saga does not hide them like a single isolated transaction. Returning purchase complete after merely requesting a charge confuses intention with confirmed effect.

**Q22. How would you explain compensation is a new action in a production design?**

Compensation is a separately committed repair with its own identity and failures. Define it from the business consequence, not as a blind inverse SQL statement. Persist pending compensation and tell the user the true state. A reservation release after expiry can race with a new owner. Condition the action on the reservation identity and current state.

**Q23. How would you explain orchestration state machines in a production design?**

An orchestrator persists the workflow state and the next durable command intention. Recovery resumes that state machine; unknown outside outcomes need reconciliation. Make the coordinator’s own failure behavior explicit. An in-memory chain of RPC calls is not durable orchestration. A process crash loses its place unless the workflow is persisted.

**Q24. How would you explain choreography and event contracts in a production design?**

Choreography distributes reactions, not responsibility for recovery. Each service needs local atomicity and duplicate handling. Use an explicit event contract and an observable workflow relation; choose orchestration when next-step ownership becomes hard to follow. An event broadcast with no service responsible for a missed transition can leave a workflow pending forever.

**Q25. How would you explain leader election and authority in a production design?**

Election establishes an agreed owner within its protocol. The protected resource must enforce that ownership or make duplicate effects safe. A process being alive does not prove that it still holds authority. A heartbeat timeout suspects failure; it cannot distinguish a dead process from a partitioned or paused one.

**Q26. How would you explain leases and pause expiry in a production design?**

Lease expiry releases coordination authority, not the old process’s ability to execute instructions. A delayed worker can overlap its replacement. Protect effects with fencing or duplicate-safe state transitions. Making the lease much longer increases failover delay and still cannot cover an arbitrarily long pause.

**Q27. How would you explain fencing tokens at the resource in a production design?**

A fencing token lets the resource reject obsolete owners. Compare and persist it atomically with the protected effect. A lease alone coordinates contenders but does not enforce exclusion after pauses. A random lock value proves who should release a lock, but randomness does not establish a newer ownership generation.

**Q28. How would you explain distributed locks and the smallest scope in a production design?**

Choose the smallest authority that enforces the rule. A distributed lock needs safe ownership, expiry, and release, and may need fencing at the effect. Prefer an atomic resource operation when it already solves the race. Treating a cache-based lock as a guarantee for an irreversible external effect can exceed its actual failure contract.

**Q29. How would you explain fan-out on write in a production design?**

Fan-out on write pays recipient work early. Compute posts times recipients, make each feed entry duplicate-safe, and define asynchronous visibility and deletion rules. Large publishers can dominate this write workload. A copied feed reference does not grant permanent access. Recheck authorization when content visibility changes.

**Q30. How would you explain fan-out on read in a production design?**

Fan-out on read pays only when a feed is requested but creates gather and ranking work on the latency path. Count candidates and remote fetches, bound the merge, and preserve pagination semantics under new posts. If every followee becomes a separate network call, candidate count understates request fan-out. Batch by storage owner and count those requests too.

**Q31. How would you explain hybrid fan-out and skew in a production design?**

Hybrid fan-out moves extreme publishers to a different work placement. The merge needs identity, cutover, permission, and pagination rules. Calculate the worst active-reader path as well as saved writes. An arbitrary follower threshold without workload evidence can move too much traffic into the read path and harm latency.

**Q32. How would you explain ranking, deletion, and stable pages in a production design?**

Define the ranking and continuation contract. Carry a deterministic tie breaker and, when needed, a ranking snapshot or version. Deletion and authorization remain authoritative even when references are cached or precomputed. A cursor over a mutable score cannot promise a perfectly stable sequence unless the design preserves the relevant ranking context.

**Q33. How would you explain the complete scorer commit in a production design?**

Trace input identity, invariant validation, atomic commit, and returned version. Keep duplicate command handling separate from concurrent version conflict. Return acceptance only after the chosen durability boundary. An API timeout after commit is an unknown client outcome. The stable key lets the client safely ask again without repeating the effect.

**Q34. How would you explain the complete derived publication in a production design?**

Publish from recoverable intention, apply each consumer effect safely, and keep independent progress. Derived consumers share an event but do not share one atomic commit. Preserve source history sufficient for their rebuild contract. A dead-letter event can make a projection permanently incomplete. The design needs a visible recovery workflow, not only a destination queue.

**Q35. How would you explain the crash matrix in a production design?**

Enumerate crashes around every acknowledgement and commit. Name the state that survives and the action restart takes. Then prove repeated operations preserve the invariant and obsolete owners cannot commit. A test that kills only before the first write misses the hardest windows, which occur after one authority committed but before another party learned it.

**Q36. How would you explain choosing fewer patterns at changed scale in a production design?**

Keep the smallest design that meets the stated workload and failure contract. Add a pattern when it solves a measured or required problem, and include the new recovery path in the trade-off. A design can remain strong while using few patterns. Traffic multiplication is not uniform across paths. A live-delivery increase and an API read increase stress different resources.

**Q37. How do CQRS and event sourcing differ?**

CQRS separates update and query models. Event sourcing makes a domain event history the source of truth. Either can exist without the other, and neither requires microservices. A current-state database with a derived score card can use CQRS without preserving every domain change as its authority.

**Q38. Does an outbox provide exactly-once effects?**

It atomically preserves business state and publication intention. A relay can resend after an acknowledgement loss, and a consumer can repeat processing after a crash. The effect still needs deduplication or a repeatable transition tied to its authority.

**Q39. Why does a lease need fencing?**

Expiry allows a successor but cannot halt the former owner’s instructions. A paused owner can resume later. A monotonically newer token checked by the protected resource rejects that obsolete authority at the actual effect boundary.

**Q40. When should you avoid a saga?**

Avoid a saga when a local transaction already enforces the required invariant or when the service split creates an unnecessary cross-authority workflow. A saga adds intermediate visible states, compensation, persisted progress, and unknown outside outcomes. Use it only when the workflow really crosses independent commits.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute balanced shard demand and identify the hot-owner assumption.

**E2** •• Compute projection catch-up after the pause.

**E3** •• Compute fan-out work and explain why the two strategies need comparable workloads.

**E4** •• Compute full and snapshot-tail replay time.

**E5** ••• Trace a relay crash after broker acceptance and before progress storage.

**E6** •• Draw the state before and after the failure in Section 1. Name the observation that distinguishes this failure from a healthy but slow operation.

**E7** •• Draw the state before and after the failure in Section 2. Name the observation that distinguishes this failure from a healthy but slow operation.

**E8** •• Draw the state before and after the failure in Section 3. Name the observation that distinguishes this failure from a healthy but slow operation.

**E9** •• Draw the state before and after the failure in Section 4. Name the observation that distinguishes this failure from a healthy but slow operation.

**E10** •• Draw the state before and after the failure in Section 5. Name the observation that distinguishes this failure from a healthy but slow operation.

**E11** •• Draw the state before and after the failure in Section 6. Name the observation that distinguishes this failure from a healthy but slow operation.

**E12** •• Draw the state before and after the failure in Section 7. Name the observation that distinguishes this failure from a healthy but slow operation.

**E13** •• Draw the state before and after the failure in Section 8. Name the observation that distinguishes this failure from a healthy but slow operation.

**E14** •• Draw the state before and after the failure in Section 9. Name the observation that distinguishes this failure from a healthy but slow operation.

**E15** •• Draw the state before and after the failure in Section 10. Name the observation that distinguishes this failure from a healthy but slow operation.

**E16** •• Draw the state before and after the failure in Section 11. Name the observation that distinguishes this failure from a healthy but slow operation.

**E17** •• Draw the state before and after the failure in Section 12. Name the observation that distinguishes this failure from a healthy but slow operation.

**E18** •• Draw the state before and after the failure in Section 13. Name the observation that distinguishes this failure from a healthy but slow operation.

**E19** •• Draw the state before and after the failure in Section 14. Name the observation that distinguishes this failure from a healthy but slow operation.

**E20** •• Draw the state before and after the failure in Section 15. Name the observation that distinguishes this failure from a healthy but slow operation.

**E21** •• Draw the state before and after the failure in Section 16. Name the observation that distinguishes this failure from a healthy but slow operation.

**E22** •• Draw the state before and after the failure in Section 17. Name the observation that distinguishes this failure from a healthy but slow operation.

**E23** •• Draw the state before and after the failure in Section 18. Name the observation that distinguishes this failure from a healthy but slow operation.

**E24** •• Draw the state before and after the failure in Section 19. Name the observation that distinguishes this failure from a healthy but slow operation.

**E25** •• Draw the state before and after the failure in Section 20. Name the observation that distinguishes this failure from a healthy but slow operation.

**E26** •• Draw the state before and after the failure in Section 21. Name the observation that distinguishes this failure from a healthy but slow operation.

**E27** •• Draw the state before and after the failure in Section 22. Name the observation that distinguishes this failure from a healthy but slow operation.

**E28** •• Draw the state before and after the failure in Section 23. Name the observation that distinguishes this failure from a healthy but slow operation.

**E29** •• Draw the state before and after the failure in Section 24. Name the observation that distinguishes this failure from a healthy but slow operation.

**E30** •• Draw the state before and after the failure in Section 25. Name the observation that distinguishes this failure from a healthy but slow operation.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Divide 1,000 reads per second by four shards to obtain 250 per shard if balanced. A match receiving 60 percent of all reads sends 600 to its owner. That owner is above the balanced average even if all other keys are evenly distributed.

**E2.** Multiply 20 events per second by ten seconds to obtain 200 queued events. The recovering projector has 100 minus 20, or 80 events per second of spare capacity. Divide 200 by 80 to obtain 2.5 seconds.

**E3.** Write fan-out creates 100 times 10,000, or 1,000,000 recipient entries per second. Read fan-out processes 50 times 200, or 10,000 candidates per second. The result does not prove a universal winner; candidate size, readership, publication frequency, and ranking work must describe the same workload.

**E4.** Divide 1,000,000 events by 20,000 per second to obtain 50 seconds. Divide 1,000 remaining events by the same rate to obtain 0.05 seconds. Snapshot reading, validation, and I/O contention are separate costs.

**E5.** The committed outbox still appears pending. Recovery sends the same event identity again. The broker can accept another delivery, but the projection checks its stored identity or source version and prevents another effect. Marking sent before confirmed publication would instead risk loss.

**E6.** Describe the limit in units of work and name the demand that reaches it. A pattern is justified by the mechanism it changes, not by the familiarity of its name. Compare the current flow with the proposed flow before adding services. A design can move the bottleneck downstream. Verify the new dependency and failure workload, not only the faster normal request.

**E7.** Write the rule in terms of allowed transitions, then identify the commit boundary that enforces it atomically. A read check outside that boundary leaves a race. Distribution must preserve or explicitly weaken the invariant. An application check followed by an unconditional write can lose an intervening update. Expected-version enforcement belongs in the same atomic operation as the state change.

**E8.** Replication adds copies and can add read capacity or recovery options. Name which copies acknowledge a write, which serve reads, and how failover chooses a sufficiently current owner. It does not automatically multiply write capacity. Acknowledgement semantics determine loss risk. A replica that exists but has not received the latest acknowledged write does not meet a zero-loss failover promise.

**E9.** Partitioning distributes subsets of state. Choose a key from the operations and invariants that need locality, then calculate skew and cross-shard work. The balanced average is only a starting assumption. A cross-shard transaction is a new coordination problem. Adding shards without changing the ownership rule can spread storage while leaving the hottest request on one node.

**E10.** Choose a primary locality for the invariant, then provide secondary derived access paths when their freshness contract permits it. Count scatter work and merge delay for queries that cannot name one owner. A user-facing query pattern can change after schema design. Track which operations fan out as the access patterns evolve.

**E11.** Consistent hashing limits ownership movement when membership changes. Distinguish ideal balance from actual key distribution, and distinguish placement from data transfer and consistency. A membership epoch keeps routing decisions interpretable. Moving a cache key can be a miss; moving authoritative database state needs a safe transfer protocol. The same hash function does not supply the same recovery contract.

**E12.** Hash balance spreads many keys, not the requests for one key. Mitigate hot reads with bounded replication or caching, and split writes only when their invariant permits a merge rule. Salting a key without a query plan moves the problem to reads, which now need to gather and reconcile the salted pieces.

**E13.** Separate copy, catch-up, and ownership switch. The switch needs a version or fence that prevents both owners from committing independently. Verify records changed during copying, not only static snapshot counts. A router cache can preserve old ownership after the switch. The old owner must enforce the epoch rather than trusting every client to refresh immediately.

**E14.** CQRS separates update and query models because their jobs differ. It does not require event sourcing or microservices. Add a separate read store only when its benefit pays for lag, rebuilding, and another failure path. Using two endpoint names over the same unchanged logic does not explain a useful model separation. State what representation differs and why.

**E15.** A materialized view precomputes a query answer. State what changes invalidate it, how updates reach it, and how readers identify its source version. It saves repeated computation by adding stored derived state and maintenance work. A mutable card with no source version cannot tell whether an out-of-order update overwrote a newer result.

**E16.** A projection must tolerate its actual delivery semantics. Use a monotonic version for replacements or a durable deduplication record for nonrepeatable effects. Checkpoint and effect should not create an independent failure window. Global sequence numbers are not implied by per-partition offsets. Keep the version rule scoped to the aggregate or partition whose ordering it describes.

**E17.** A derived read needs an explicit lag policy. Return a write version and let reads require it when read-your-writes matters. Compute recovery from spare processing capacity while arrivals continue. Waiting forever for a projection turns a lagged read store into an unbounded request queue. Use a deadline and a documented fallback.

**E18.** Event sourcing makes the event history authoritative. State is a deterministic fold over ordered domain changes. A broker or database change log is not automatically a domain event store. An event that says fetch the current team data cannot reliably reproduce historical state after that team data changes.

**E19.** Append against the version used to validate the command. On conflict, reload and reconsider the command rather than blindly repeating a precomputed event. Deduplicate repeated commands separately from concurrent distinct commands. A unique event ID prevents duplicate identity, but does not by itself prevent two different events from violating a state invariant.

**E20.** A snapshot accelerates reconstruction but remains derived state. Pair it with its exact source boundary, validate it, and keep a path to recover without it. Snapshot loading and replay are separate costs. Deleting history solely because a snapshot exists changes the audit and recovery contract. A snapshot cannot answer every historical question.

**E21.** Keep deterministic reconstruction separate from live outside effects. Version event meaning and test old histories. Store completed effect outcomes when recovery must know them, rather than asking the outside world to repeat the action. Changing the transition code can change the reconstructed result. Treat that as a migration or correction with explicit tests, not a harmless refactor.

**E22.** Independent commit points leave a crash window. Make the authority and a publication intention recoverable together, then let a retryable relay perform the outside publication. Name when the client’s success becomes safe. A local try/finally block does not run after a power loss. Recovery needs durable state, not only an exception handler.

**E23.** Commit business state and the outbox row together. The relay makes the intention visible outside the database later. The pattern prevents a committed change from losing its publication intention, while allowing duplicate sends. An outbox row inserted after the business transaction recreates the original failure window. Both belong to the same local commit.

**E24.** A claim reduces contention; it does not remove the send-and-mark failure window. Choose safe redelivery over silent loss and make consumers repeatable. Polling delay is one part of delivery lag, not its entire bound. Deleting an outbox record immediately after a local send call can lose publication when the broker never accepted it. Use the actual broker acknowledgement semantics.

**E25.** CDC follows committed database changes from a recoverable position. Pair snapshot and stream boundaries, retain the needed log, and tolerate restart duplicates. Translate storage mutations into business meaning when the consumers require it. Advancing the checkpoint before applying the effect can lose work. Applying the effect first can replay it after a crash; that path needs atomic progress or deduplication.

**E26.** A saga coordinates local commits with explicit recovery. Persist state and use repeatable commands at each step. State which intermediate results are visible because a saga does not hide them like a single isolated transaction. Returning purchase complete after merely requesting a charge confuses intention with confirmed effect.

**E27.** Compensation is a separately committed repair with its own identity and failures. Define it from the business consequence, not as a blind inverse SQL statement. Persist pending compensation and tell the user the true state. A reservation release after expiry can race with a new owner. Condition the action on the reservation identity and current state.

**E28.** An orchestrator persists the workflow state and the next durable command intention. Recovery resumes that state machine; unknown outside outcomes need reconciliation. Make the coordinator’s own failure behavior explicit. An in-memory chain of RPC calls is not durable orchestration. A process crash loses its place unless the workflow is persisted.

**E29.** Choreography distributes reactions, not responsibility for recovery. Each service needs local atomicity and duplicate handling. Use an explicit event contract and an observable workflow relation; choose orchestration when next-step ownership becomes hard to follow. An event broadcast with no service responsible for a missed transition can leave a workflow pending forever.

**E30.** Election establishes an agreed owner within its protocol. The protected resource must enforce that ownership or make duplicate effects safe. A process being alive does not prove that it still holds authority. A heartbeat timeout suspects failure; it cannot distinguish a dead process from a partitioned or paused one.

These exercises describe illustrative designs, not the private architectures of the named products. Continue by defending the same flows under a changed workload, while keeping each safety rule explicit.

### Primary sources

[CQRS](https://martinfowler.com/bliki/CQRS.html). Model separation and its added complexity.

[Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html). Domain histories and replay.

[Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html). Local atomicity and duplicate publication.

[Saga](https://microservices.io/patterns/data/saga.html). Local transactions with compensation.

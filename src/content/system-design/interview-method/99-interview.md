@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How would you explain functional requirements as actions in a production design?**

State the user, action, and result in a sentence before choosing components. Separate upload acceptance from publication and say which features are excluded. The critical flow must implement the named result. A design optimized for playback can omit the required upload recovery path if the action list is never written.

**Q2. How would you explain non-functional requirements as tests in a production design?**

Make each requirement observable. Name the operation, population, window or failure, and acceptable outcome. Different records can have different freshness and invariant requirements within one design. An average response target does not constrain the slowest users. Ask for the population and statistic before using a latency number.

**Q3. How would you explain scope, priorities, and conflict in a production design?**

When requirements conflict, show the failing scenario and ask which outcome is allowed. Scope consistency and availability to the operation and invariant, then state the chosen policy explicitly. A statement that a system is strongly consistent does not explain which operations are blocked when authority is unreachable.

**Q4. How would you explain assumptions and unresolved questions in a production design?**

Mark given facts, working assumptions, and derived results separately. Proceed with useful explicit assumptions, then name the decisions sensitive to them. Never imply a hypothetical named-product workload is a measured architecture fact. Quietly changing the workload halfway through makes alternatives incomparable. Update the ledger and recompute dependent quantities.

**Q5. How would you explain daily requests, average, and peak in a production design?**

Divide the daily total by seconds per day, then apply an explicitly assumed peak shape. State whether the rate counts offered attempts, admitted requests, or useful completions. Keep retries from being mistaken for extra business commands. A daily total cannot reveal bursts or hot-key skew. Ask for their shape or label a scenario and test it.

**Q6. How would you explain concurrency from compatible rates in a production design?**

Use mean throughput and mean time for the same boundary to calculate mean in-flight work. State the stability assumption. Use percentiles for user experience and admission limits for overload rather than substituting them into the mean calculation. A rising backlog violates the intended steady-state interpretation. Show arrivals, completions, and queue growth when the service cannot keep up.

**Q7. How would you explain storage, retention, and copies in a production design?**

Multiply write count, record bytes, and retention to get logical storage, then add copies and representation costs separately. State the write fraction and temporary recovery space. A read workload does not create stored rows by default. Replication and backups are different copies with different recovery jobs. Counting one does not automatically satisfy the other.

**Q8. How would you explain bandwidth and fan-out in a production design?**

Compute each traffic path separately and label the link. Fan-out bytes are event rate times recipients times event payload, before protocol costs. Upstream gateway aggregation does not erase downstream delivery work. A live event with large payloads can saturate egress while API queries remain cheap. Size the right path.

**Q9. How would you explain resource modeling and outcomes in a production design?**

Model stable resources and explicit states. Return the state actually established, with a way to query or continue pending work. A resource identity lets recovery refer to the same operation across requests. Returning success with no durable identity leaves the caller unable to distinguish a lost reply from a lost operation.

**Q10. How would you explain validation, authentication, and authorization in a production design?**

Separate input validity, caller identity, and permission for the resource. Common gateway checks reduce work but do not replace the authority’s final permission and invariant checks. Never treat a correlation ID as proof of identity. Authenticating a user does not authorize every resource they can name in a URL.

**Q11. How would you explain pagination and changing lists in a production design?**

Pagination is a consistency contract as well as a query shape. Use a deterministic order and tie breaker, carry the necessary context in the cursor, and choose an access path that supports that order. A cursor cannot silently promise stable ranked results if the ranking score changes and no snapshot or ranking context is preserved.

**Q12. How would you explain idempotency and unknown outcomes in a production design?**

A timeout is an unknown outcome, not proof of failure. Use a caller-scoped key bound to intent, store its outcome with the effect, and document retention. Separate distinct equal-looking commands from a repeated command. An in-memory key cache disappears on restart and cannot protect a durable effect after a process failure.

**Q13. How would you explain entities, keys, and relationships in a production design?**

Model identity, relationships, and lifecycle first. Trace the records used by the critical operations and identify their authority. Derived indexes reference source state and need their own freshness and deletion rules. Duplicating metadata without an authority rule leaves services unable to decide which copy wins after concurrent changes.

**Q14. How would you explain atomic state transitions in a production design?**

Identify the invariant and the changes that must commit together. Enforce the precondition with the transition at the authority. Cross-store work needs explicit intermediate state and reconciliation. A prior read followed by an unconditional update leaves a race. Use an atomic condition or suitable transaction isolation.

**Q15. How would you explain indexes from access patterns in a production design?**

Derive indexes from predicates, ordering, and returned fields. State which query they support and the write and storage work they add. A small page size does not make an unsupported full scan cheap. An index useful for owner ordering may not help a global sort, because its leading key groups rows by owner.

**Q16. How would you explain authoritative and derived data in a production design?**

Name the source of truth for each fact and which copies are derived. Document acceptable lag and rebuilds. Authorization and deletion should not depend solely on a stale discovery index. A signed URL can remain usable until its expiry unless the serving design supplies revocation. Include that interval in the permission contract.

**Q17. How would you explain a box needs a job in a production design?**

Give every box a job and every arrow a payload, timing, and acknowledgement. Keep jobs together when a simple implementation meets the contract. Explain added failure boundaries when separating them. A box that only forwards the same request can add latency and another outage dependency without adding a needed guarantee.

**Q18. How would you explain control paths and byte paths in a production design?**

Separate large-payload transfer from permission and metadata. Calculate the assumed transfer time and keep validation and recovery in the control path. Direct transfer changes byte routing, not the need to prove a complete authorized object. A client saying upload finished does not prove the object exists, is complete, or belongs to the authorized session.

**Q19. How would you explain synchronous and asynchronous boundaries in a production design?**

Put work before the response when the promised result depends on it. Move optional delayed work behind a durable intention, with status and recovery. State what acceptance proves at each boundary. Fire-and-forget work in the request process can disappear when that process exits, even if the HTTP response succeeded.

**Q20. How would you explain ownership and service boundaries in a production design?**

Choose boundaries from state authority and operational reasons. Keep tightly coupled invariants local when possible. Explain the network and recovery costs of a split, and consider a modular monolith before distributed coordination. Independent deployments do not remove coupling if both services still depend on the same hidden schema or shared mutable fields.

**Q21. How would you explain the complete read flow in a production design?**

Walk validation, routing, cache decision, source read, and response. State the freshness requirement and source-unavailable policy. Bound miss work and measure the final user outcome. A cache hit without version or age cannot prove it satisfies a read-your-writes requirement.

**Q22. How would you explain the complete write flow in a production design?**

Trace the write’s invariant and the atomic commit, then show lost-reply recovery. Distinguish repeated intent from a concurrent version conflict. Downstream events follow from durable intention and have separate recovery. Returning the new version before commit completes can give the client a result that recovery cannot find.

**Q23. How would you explain the complete upload flow in a production design?**

Trace initiation, parts, completion validation, processing, and publication. Stable session and part identity make partial retry possible. Cleanup and metadata reconciliation are part of the upload design. A completed object with failed metadata publication is an orphan state that needs reconciliation, not proof that the whole user operation completed.

**Q24. How would you explain the complete live-update flow in a production design?**

Follow commit, ordering, gateway delivery, client version, and reconnect recovery. Calculate gateway demand with failure spare capacity separately. Bound slow clients and use replay or snapshots rather than assuming connections never break. A message sent on a socket is not an application-level receipt. Delivery guarantees need explicit acknowledgement or a reconnect recovery contract.

**Q25. How would you explain find the limiting resource in a production design?**

Identify the resource whose demand limits useful completion and measure it in the relevant unit. Compare changes on the same workload and objective. A server count without per-server evidence is a sizing assumption. Adding workers can increase contention at an already saturated database and reduce useful throughput.

**Q26. How would you explain normal capacity and failure headroom in a production design?**

Calculate capacity after the named failure and compare it with peak demand. Include redistribution, warmup, and shared dependencies. Headroom is a workload-specific assumption until tested under failure. Five instances in one failing zone do not provide capacity after that zone is lost. Failure domains matter as much as counts.

**Q27. How would you explain the cache outage calculation in a production design?**

Size the source for the intended cache failure policy. Calculate miss demand and complete-cache-loss demand, then bound fallback to sustainable capacity. Allowed stale data and rejected work should be explicit user outcomes. A timeout followed by unrestricted fallback can overload the source while callers continue spending time on the failed cache.

**Q28. How would you explain queue recovery and backpressure in a production design?**

Compute backlog from excess arrivals and drain time from spare capacity while arrivals continue. Bound the queue and apply upstream admission when capacity is exhausted. A queue is a buffering policy, not a substitute for sufficient processing. Unbounded retries can turn one task into repeated offered work and prevent the queue from ever recovering.

**Q29. How would you explain crash windows and unknown progress in a production design?**

Trace surviving state and knowledge separately. Enumerate interruption around each commit and acknowledgement, then prove the restart action is safe. Stable identities and atomic progress turn unknown outcomes into recoverable operations. A successful retry handler does not prove the original attempt did not commit. It must check the durable command identity.

**Q30. How would you explain replica lag and read-your-writes in a production design?**

Carry a committed version into the read requirement when the session needs it. Choose a bounded adequate-copy policy. Keep ordinary eventual reads and writer-confirmation reads as separate contracts. Sticky routing to one follower does not help if that follower is behind the acknowledged version.

**Q31. How would you explain recovery time and recoverable history in a production design?**

Define RTO and RPO for a failure scenario, then walk restore, replay, validation, and cutover. Replication and backup have different jobs. Include outside effects and pending workflows in recovery, not only database availability. An untested backup is a stored object, not evidence that recovery will meet the objective.

**Q32. How would you explain graceful degradation and admission in a production design?**

Separate optional from essential dependencies, bound waiting, and preserve the core result. Return honest partial or rejected outcomes and control retries during recovery. Degradation must not weaken an invariant silently. Dropping a payment verification or permission check is not an optional simplification merely because it improves latency.

**Q33. How would you explain compare alternatives on the same contract in a production design?**

Compare concrete mechanisms on identical requirements and workload. Name the benefit, cost, and decisive failure behavior. A strong choice is defensible because its contract fits the problem, not because its product name is familiar. Changing durability or freshness between alternatives makes their latency comparison misleading.

**Q34. How would you explain the complete whiteboard answer in a production design?**

Give a coherent causal answer: contract, computed demand, API, data authority, critical flow, bottleneck, failure trace, and trade-off. Keep the diagram consistent with its acknowledgements and retained state. State uncertainty precisely. A component list with no complete flow cannot demonstrate how the system accepts one operation safely.

**Q35. How would you explain changing one requirement in a production design?**

Trace a changed requirement to the specific boundary it affects. Revise the mechanism and explain its added cost and failures. Preserve the rest of the argument when its assumptions still hold. Saying invalidate the CDN does not automatically revoke every existing authorization token or every client-held copy.

**Q36. How would you explain practice by reproducing mechanisms in a production design?**

Practice by reconstructing state transitions and failures, then transfer the mechanism to a different system. Explain why every box is needed and calculate its demand. Use uncertainty as a study target rather than filling it with product names. Memorizing a finished diagram can conceal that its original assumptions no longer fit the next problem.

**Q37. What should you ask before scale estimation?**

Ask who acts, what action matters, and what result must be visible. Clarify durability, freshness, failure domains, geography, retention, and exclusions when they change the critical flow. Workload arithmetic has meaning only after the operation and counted population are defined.

**Q38. Why not start with microservices?**

A deployment split adds network calls, ownership transitions, and cross-authority recovery. Start with coherent responsibilities and the invariant. A modular monolith can keep local atomicity while preserving code boundaries; separate services need a concrete operational or ownership reason.

**Q39. Can a queue solve insufficient worker capacity?**

A queue buffers excess work and changes waiting. If arrivals remain above successful completions, backlog grows until its bound or deadline fails. Compute spare recovery capacity and use backpressure or admission. Queue existence does not establish a completion-time promise.

**Q40. What makes a design answer deep?**

It explains the intermediate state, authority, commit, acknowledgement, restart action, and limiting resource for its critical operations. It computes the demand, defends the invariant under failures, and compares alternatives on the same contract. More named components do not substitute for that reasoning.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute average, peak, and mean in-flight API work.

**E2** •• Compute logical and three-copy retained storage for the all-write exercise.

**E3** •• Compute API payload and live fan-out payload, then name the link.

**E4** •• Compute failure capacity and cache-source amplification.

**E5** ••• Trace the unknown write outcome and upload recovery.

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

**E1.** Divide 8,640,000 daily requests by 86,400 seconds to obtain 100 per second. Multiply by the assumed peak factor ten for 1,000. Under stable compatible throughput and mean latency, multiply 1,000 by 0.2 seconds for 200 mean in-flight requests. The result does not bound backlog under overload.

**E2.** Multiply 8,640,000 by 500 bytes for 4,320,000,000 bytes per day. Multiply by 30 days for 129,600,000,000 logical bytes. Multiply by three for 388,800,000,000 bytes before indexes, backups, compression, and temporary rebuilds. Real read requests do not create rows by this assumption.

**E3.** API responses carry 1,000 times 2,000, or 2,000,000 bytes per second. Live delivery is 20 times 50,000, or 1,000,000 recipient messages per second, carrying 200,000,000 bytes per second at 200 bytes each. The live result sizes recipient egress, not merely broker-to-gateway traffic.

**E4.** Five instances at 300 each give 1,500 normal capacity. Four survivors give 1,200, leaving 200 above the 1,000 peak. A 0.9 cache hit fraction sends 100 reads per second to the source; full unrestricted fallback sends 1,000, ten times as many. These assumptions need failure load tests.

**E5.** A lost write reply is resolved using the durable caller-scoped idempotency key and stored result; a new key could create another effect. The multipart upload resumes under its stable session and part identities, verifies completion, and reconciles metadata. Neither flow should equate a timeout with proof that nothing committed.

**E6.** State the user, action, and result in a sentence before choosing components. Separate upload acceptance from publication and say which features are excluded. The critical flow must implement the named result. A design optimized for playback can omit the required upload recovery path if the action list is never written.

**E7.** Make each requirement observable. Name the operation, population, window or failure, and acceptable outcome. Different records can have different freshness and invariant requirements within one design. An average response target does not constrain the slowest users. Ask for the population and statistic before using a latency number.

**E8.** When requirements conflict, show the failing scenario and ask which outcome is allowed. Scope consistency and availability to the operation and invariant, then state the chosen policy explicitly. A statement that a system is strongly consistent does not explain which operations are blocked when authority is unreachable.

**E9.** Mark given facts, working assumptions, and derived results separately. Proceed with useful explicit assumptions, then name the decisions sensitive to them. Never imply a hypothetical named-product workload is a measured architecture fact. Quietly changing the workload halfway through makes alternatives incomparable. Update the ledger and recompute dependent quantities.

**E10.** Divide the daily total by seconds per day, then apply an explicitly assumed peak shape. State whether the rate counts offered attempts, admitted requests, or useful completions. Keep retries from being mistaken for extra business commands. A daily total cannot reveal bursts or hot-key skew. Ask for their shape or label a scenario and test it.

**E11.** Use mean throughput and mean time for the same boundary to calculate mean in-flight work. State the stability assumption. Use percentiles for user experience and admission limits for overload rather than substituting them into the mean calculation. A rising backlog violates the intended steady-state interpretation. Show arrivals, completions, and queue growth when the service cannot keep up.

**E12.** Multiply write count, record bytes, and retention to get logical storage, then add copies and representation costs separately. State the write fraction and temporary recovery space. A read workload does not create stored rows by default. Replication and backups are different copies with different recovery jobs. Counting one does not automatically satisfy the other.

**E13.** Compute each traffic path separately and label the link. Fan-out bytes are event rate times recipients times event payload, before protocol costs. Upstream gateway aggregation does not erase downstream delivery work. A live event with large payloads can saturate egress while API queries remain cheap. Size the right path.

**E14.** Model stable resources and explicit states. Return the state actually established, with a way to query or continue pending work. A resource identity lets recovery refer to the same operation across requests. Returning success with no durable identity leaves the caller unable to distinguish a lost reply from a lost operation.

**E15.** Separate input validity, caller identity, and permission for the resource. Common gateway checks reduce work but do not replace the authority’s final permission and invariant checks. Never treat a correlation ID as proof of identity. Authenticating a user does not authorize every resource they can name in a URL.

**E16.** Pagination is a consistency contract as well as a query shape. Use a deterministic order and tie breaker, carry the necessary context in the cursor, and choose an access path that supports that order. A cursor cannot silently promise stable ranked results if the ranking score changes and no snapshot or ranking context is preserved.

**E17.** A timeout is an unknown outcome, not proof of failure. Use a caller-scoped key bound to intent, store its outcome with the effect, and document retention. Separate distinct equal-looking commands from a repeated command. An in-memory key cache disappears on restart and cannot protect a durable effect after a process failure.

**E18.** Model identity, relationships, and lifecycle first. Trace the records used by the critical operations and identify their authority. Derived indexes reference source state and need their own freshness and deletion rules. Duplicating metadata without an authority rule leaves services unable to decide which copy wins after concurrent changes.

**E19.** Identify the invariant and the changes that must commit together. Enforce the precondition with the transition at the authority. Cross-store work needs explicit intermediate state and reconciliation. A prior read followed by an unconditional update leaves a race. Use an atomic condition or suitable transaction isolation.

**E20.** Derive indexes from predicates, ordering, and returned fields. State which query they support and the write and storage work they add. A small page size does not make an unsupported full scan cheap. An index useful for owner ordering may not help a global sort, because its leading key groups rows by owner.

**E21.** Name the source of truth for each fact and which copies are derived. Document acceptable lag and rebuilds. Authorization and deletion should not depend solely on a stale discovery index. A signed URL can remain usable until its expiry unless the serving design supplies revocation. Include that interval in the permission contract.

**E22.** Give every box a job and every arrow a payload, timing, and acknowledgement. Keep jobs together when a simple implementation meets the contract. Explain added failure boundaries when separating them. A box that only forwards the same request can add latency and another outage dependency without adding a needed guarantee.

**E23.** Separate large-payload transfer from permission and metadata. Calculate the assumed transfer time and keep validation and recovery in the control path. Direct transfer changes byte routing, not the need to prove a complete authorized object. A client saying upload finished does not prove the object exists, is complete, or belongs to the authorized session.

**E24.** Put work before the response when the promised result depends on it. Move optional delayed work behind a durable intention, with status and recovery. State what acceptance proves at each boundary. Fire-and-forget work in the request process can disappear when that process exits, even if the HTTP response succeeded.

**E25.** Choose boundaries from state authority and operational reasons. Keep tightly coupled invariants local when possible. Explain the network and recovery costs of a split, and consider a modular monolith before distributed coordination. Independent deployments do not remove coupling if both services still depend on the same hidden schema or shared mutable fields.

**E26.** Walk validation, routing, cache decision, source read, and response. State the freshness requirement and source-unavailable policy. Bound miss work and measure the final user outcome. A cache hit without version or age cannot prove it satisfies a read-your-writes requirement.

**E27.** Trace the write’s invariant and the atomic commit, then show lost-reply recovery. Distinguish repeated intent from a concurrent version conflict. Downstream events follow from durable intention and have separate recovery. Returning the new version before commit completes can give the client a result that recovery cannot find.

**E28.** Trace initiation, parts, completion validation, processing, and publication. Stable session and part identity make partial retry possible. Cleanup and metadata reconciliation are part of the upload design. A completed object with failed metadata publication is an orphan state that needs reconciliation, not proof that the whole user operation completed.

**E29.** Follow commit, ordering, gateway delivery, client version, and reconnect recovery. Calculate gateway demand with failure spare capacity separately. Bound slow clients and use replay or snapshots rather than assuming connections never break. A message sent on a socket is not an application-level receipt. Delivery guarantees need explicit acknowledgement or a reconnect recovery contract.

**E30.** Identify the resource whose demand limits useful completion and measure it in the relevant unit. Compare changes on the same workload and objective. A server count without per-server evidence is a sizing assumption. Adding workers can increase contention at an already saturated database and reduce useful throughput.

These exercises describe illustrative designs, not the private architectures of the named products. Continue by defending the same flows under a changed workload, while keeping each safety rule explicit.

### Primary sources

[Idempotent API intent](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/). Stable caller intent and lost-reply recovery.

[Multipart uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html). Initiation, parts, completion, and abort.

[Handling overload](https://sre.google/sre-book/handling-overload/). Admission and cascading overload.

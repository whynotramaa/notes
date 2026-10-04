@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How would you explain one event, independent readers in a production design?**

A retained log supports independently paced readers and replay. Consumer progress does not delete the record. Retention still bounds recovery, and the design must name its group semantics and product version. A broker alone does not establish that the producer’s authoritative database change and publication are atomic. That gap belongs to the source flow.

**Q2. How would you explain records, keys, and topics in a production design?**

Define key, value, schema, headers, and topic policy. Key choice can preserve aggregate locality, but topic identity does not create global order. Keep domain version and diagnostic context distinct. Changing serialization without compatible readers can poison replay even while the broker correctly stores every byte.

**Q3. How would you explain partitions and ordering scope in a production design?**

Partitioning provides parallel logs and partition-local order. Choose the key from the ordering requirement, consider skew, and plan partition-count changes. A merged topic reader must not invent a global sequence from unrelated offsets. Equal offsets in different partitions identify different positions. Store topic, partition, and offset together when using source position as an effect identity.

**Q4. How would you explain the retained workload in a production design?**

Compute event count, payload, retention, and copies separately. Retention bounds replay independently of consumer success. A size limit can change the effective time window when traffic grows, so recovery needs both policy and observed log start. The simple byte calculation is not a benchmark or full disk budget. Compression, segment layout, indexes, and recovery headroom remain separate measured costs.

**Q5. How would you explain bootstrap metadata and leader routing in a production design?**

Bootstrap supplies metadata; actual requests route to partition leaders. Plan advertised-address reachability and stale-metadata refresh. A connected client can still fail if its needed leader is unavailable. A load balancer in front of bootstrap cannot correct unreachable broker addresses advertised in metadata.

**Q6. How would you explain batching, compression, and delay in a production design?**

Batching amortizes request overhead and can improve compression, while adding waiting and buffer cost. Name size, timing, memory, and delivery bounds. Compression changes stored bytes but does not remove the logical record identities. A producer buffer accepting a record does not mean the broker has accepted it. Application success must follow the required completion boundary.

**Q7. How would you explain segment append and offset assignment in a production design?**

The leader appends a validated batch into segments and assigns partition offsets. The log end is the next append position. Local append, replica agreement, transactional visibility, and crash-safe persistence are separate states. A process’s in-memory end offset cannot prove that the same tail survives a machine or disk failure.

**Q8. How would you explain log start, end, and visible boundaries in a production design?**

Keep retained start, local end, replicated read boundary, transaction stability, and group progress distinct. State whether each number is an inclusive record offset or an exclusive next position. Offsets are not interchangeable counters. Off-by-one progress errors can skip the last unprocessed record or replay an unnecessary record. Write the next-position convention beside the trace.

**Q9. How would you explain leader, followers, and isr in a production design?**

Separate configured replicas from the current ISR and each replica’s position. Followers copy the leader, and their progress affects replicated visibility and write policy. A lagging configured copy is not equivalent to a current one. ISR membership is protocol state, not a static count chosen once at topic creation. Explain writes after membership shrinks.

**Q10. How would you explain acknowledgements and minimum isr in a production design?**

State producer acknowledgements and topic minimum ISR together. The strong policy can reject writes when too few replicas qualify. Replica count alone does not describe successful produce, and acknowledgements are not a universal per-record filesystem flush guarantee. Saying acks all means every configured replica is wrong when some configured replicas are outside the ISR. Use the product’s documented protocol and membership semantics.

**Q11. How would you explain the high watermark in a production design?**

The high watermark is a replicated visibility boundary, not merely the leader’s log end. Trace follower fetch and progress observation before moving it. Transactions can impose a separate lower stable boundary for committed readers. Adding leader and follower offsets together measures nothing useful. Compare progress in the same partition and convention.

**Q12. How would you explain leader failover and divergent tails in a production design?**

Failover needs eligible history and a new ownership epoch. Explain the availability and loss policy if no sufficiently safe replica remains. The simple ISR story is an introductory model; version-specific eligible-leader settings affect the full protocol. An old process remaining alive does not make it current leader. Clients and brokers must reject obsolete authority under the protocol.

**Q13. How would you explain fetch position and durable commit in a production design?**

Separate fetched position from durable restart position. Commit the next offset after the contiguous completed prefix is safe. A high completed offset cannot justify skipping unfinished lower work. Automatic progress commits can race application processing. Use a policy aligned with effect completion rather than assuming fetch means handled.

**Q14. How would you explain at-most-once through commit first in a production design?**

Committing progress before effect creates a loss window after the commit. It supports at-most-once attempt semantics under that flow, not reliable effect completion. State whether losing those records is acceptable. A successful offset commit is not a business completion acknowledgement. It proves only the stored group progress boundary.

**Q15. How would you explain at-least-once through effect first in a production design?**

Apply safely before committing progress, then tolerate replay with durable effect identity or a repeatable transition. At-least-once plus idempotent consumers is common because it turns uncertain acknowledgements into safe repetition. An in-memory set of handled offsets disappears on restart and cannot protect a durable external effect.

**Q16. How would you explain external databases and deduplication in a production design?**

Coordinate effect and its deduplication record at the effect authority. Commit Kafka progress afterward and accept replay. Scope identity with topic and partition, and preserve it for the intended replay horizon. Kafka transactions do not automatically include an arbitrary SQL database or payment provider. Exactly-once scope must name the participants.

**Q17. How would you explain consumer groups and independent applications in a production design?**

A group represents one application’s assignment and progress. Ordinary partition-exclusive groups divide partitions among members; separate applications use separate groups. State the assumed group model because share groups differ. Putting projector and notification processes in the same ordinary group makes them divide records instead of each application seeing the required history.

**Q18. How would you explain heartbeats, polling, and failure detection in a production design?**

Liveness and useful progress are distinct. Choose timer and batch policies from processing behavior, bound outside waits, and inspect the group protocol in use. A suspected member can still have unfinished work after ownership changes. Increasing a timeout can hide slow processing and delay recovery. It does not raise the effect system’s capacity.

**Q19. How would you explain rebalance and obsolete work in a production design?**

Rebalance changes ownership and can repeat in-flight work. Group protocol fences obsolete commits; external effects still need repeatability or fencing. Define revoke, finish, cancel, and restart behavior explicitly. An application that keeps processing a revoked partition without a protection rule can race its replacement even if Kafka correctly rejects its old offset commit.

**Q20. How would you explain parallelism, skew, and contiguous progress in a production design?**

Parallel application work must preserve its ordering invariant and contiguous restart boundary. A completed high offset is not permission to skip lower pending work. Scale independent keys and measure skew before adding members. Unlimited completion tracking is another queue. Bound the out-of-order window and apply backpressure when an early record stalls.

**Q21. How would you explain idempotent producer sequences in a production design?**

Producer idempotence suppresses supported retry duplicates at the append protocol. It does not infer whether two separately submitted records represent the same business command. Preserve event identity for application-level repeats. Recreating an ordinary producer and resending a payload can be a new protocol identity. Do not extend producer retry guarantees beyond their documented scope.

**Q22. How would you explain transactional identity and producer fencing in a production design?**

A stable transactional identity supports recovery and fencing for a logical producer owner. Assign it consistently without sharing it between unrelated concurrent owners. A fenced producer must stop and resolve ownership, not blindly retry. Randomly changing the transactional identity on each restart can prevent the intended cross-instance fencing and recovery relationship.

**Q23. How would you explain atomic kafka output and consumed offsets in a production design?**

Kafka can atomically commit Kafka output records and consumed offsets for a defined consume-transform-produce workflow. State reader isolation and ownership. Exactly-once scope stops at systems not participating in that atomic boundary. A payment call or SQL mutation inside the transaction’s code block is not made atomic with Kafka merely because the code is nested there.

**Q24. How would you explain last stable offset and committed reads in a production design?**

Committed readers respect transaction stability as well as replicated visibility. An open transaction can hold later data behind its first unresolved offset. Distinguish consumer isolation from producer acknowledgement and application effect safety. A stalled committed reader can be waiting for transaction resolution rather than a slow fetch or lagging replica. Inspect both boundaries.

**Q25. How would you explain time and size retention in a production design?**

Retention reclaims eligible segments without waiting for consumers. Size and time policies shape the available source horizon, and cleanup granularity matters. Define the out-of-range recovery policy before lag exceeds the retained log. Silently resetting to latest can discard required effects. Earliest resumes only the retained history, which may still be insufficient for a full rebuild.

**Q26. How would you explain compaction and keyed state in a production design?**

Compaction supports keyed-state rebuild, not an unlimited complete event history. It is asynchronous and leaves offset gaps. Tombstone retention must cover the rebuilding consumer’s recovery needs. A consumer that begins too late can miss an expired tombstone and keep an obsolete local key. Its rebuild and retention contract must address that case.

**Q27. How would you explain replaying a projection in a production design?**

Rebuild from a valid retained source, track completed progress, and catch up while new input continues. Verify the required boundary before switching readers. Keep reconstruction separate from outside effects that must not repeat. If retention no longer covers the initial source, replay alone cannot rebuild complete state. Use a compatible snapshot plus continuation or another authoritative source.

**Q28. How would you explain schema evolution in old history in a production design?**

Compatibility applies to replay and rolling upgrades, not only newly written data. Test both old-history interpretation and mixed reader-writer deployment. Define defaults from meaning and keep schema, business version, and offset separate. Treating a missing old field as zero can change a financial or score calculation rather than simply supplying a harmless default.

**Q29. How would you explain kraft metadata and data replication in a production design?**

Separate agreed cluster metadata from replicated partition data. Controllers establish topology and leadership state; brokers store and serve logs under those decisions. Version the architecture, because older ZooKeeper deployments are a different historical setup. Calling all Kafka replication Raft confuses the metadata quorum with the partition data path and obscures their distinct failure behavior.

**Q30. How would you explain disk, network, and skew budgets in a production design?**

Budget every traffic and storage path, including independent consumers and recovery. Measure skew and per-partition work. A retained-payload total is a storage starting point, not a sustainable throughput claim. Compression ratio from one payload cannot be applied to another without measurement. Recovery throughput can fall when live work uses the same resource.

**Q31. How would you explain lag, backpressure, and poison records in a production design?**

Use lag with effect rate, age, retries, and resource waits. Bound application queues and apply backpressure at the appropriate boundary. A poison-record policy must state the lost or pending business consequence. A dashboard showing fetch throughput can look healthy while every required effect is failing or stuck behind an earlier record.

**Q32. How would you explain permissions, quotas, and safe operations in a production design?**

Secure identity and topic actions separately, then bound noisy clients through quotas and request limits. Protect administration and test changes against replication and consumer recovery. Kafka’s availability does not make every tenant entitled to all its capacity. An authenticated producer with overly broad topic permissions can still corrupt another application’s input history.

**Q33. How would you explain complete success: source to projection in a production design?**

Connect source atomicity, safe append, independent reader effects, and group progress. Kafka does not replace the outbox gap or consumer effect contract. Each acknowledgement proves a particular boundary, and derived visibility follows later. Returning downstream completion based only on source commit or broker acceptance overstates what the consumer has actually applied.

**Q34. How would you explain complete crash: lost produce acknowledgement in a production design?**

Protocol retries and restarted business publication are different duplicate sources. Idempotent append handles its documented producer scope; stable event identity and consumer rules handle a repeated business event at another offset. Preserve the outbox until its chosen confirmation. Deduplicating only by Kafka offset cannot collapse the same domain event republished as a new record with a different offset.

**Q35. How would you explain complete catch-up calculation in a production design?**

Catch-up uses spare effect capacity while arrivals continue. Check retained source, compatible state, schema, and destination limits. Fetch speed alone does not establish projection recovery time. If arrivals equal useful processing capacity, the backlog never shrinks under the simple model, even though the consumer is busy.

**Q36. How would you explain when kafka is justified and when it is not in a production design?**

Use a retained log when independent readers, replay, and partition-local ordering solve the problem. Compare a queue on the same contract. Defend source publication, reader effects, retention, and recovery without extending Kafka’s guarantees beyond their participants. Adding Kafka to a request path solely because it is common introduces another operational dependency without a demonstrated requirement.

**Q37. Does acks all mean a per-record fsync on every configured replica?**

No. It is a replication acknowledgement contract governed by ISR and relevant settings, not a universal promise of synchronous filesystem flushing on every configured node. State the documented protocol, durability failure assumptions, minimum ISR, and leader policy. A configured replica outside the ISR is not an acknowledged current copy.

**Q38. Can producer idempotence deduplicate two business submissions?**

Not generally. It identifies supported protocol retries using producer identity and sequence state. Two independent submissions or a restart under a different ordinary producer identity can produce two records for the same domain event. A stable event identity and duplicate-safe consumer effect close that business-level window.

**Q39. What does exactly once include?**

The answer depends on the atomic boundary. Kafka transactions can commit Kafka outputs and consumed offsets together for a specified workflow and reader isolation. An arbitrary SQL mutation or provider call is outside that transaction and needs coordinated integration, repeatability, or durable deduplication.

**Q40. Why mention ordinary versus share groups?**

The classroom assignment model gives a partition one active owner within an ordinary group. Share groups use different work-sharing and acknowledgement mechanisms, so that rule cannot be claimed universally for all Kafka consumption. Label the version and group protocol, then explain the actual ownership contract used.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute retained payload and balanced per-partition mean.

**E2** •• Trace local end, high watermark, and stable read boundary.

**E3** •• Trace the two consumer commit orderings.

**E4** •• Compute useful group parallelism and catch-up.

**E5** ••• Trace outbox restart with a repeated domain event at another offset.

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

**E1.** Multiply 20 by 200 by 86,400 for 345,600,000 payload bytes per day. Multiply by seven and three for 7,257,600,000. Divide 20 events per second by four partitions for five per second if balanced. Skew, encoding, indexes, and recovery work are separate.

**E2.** Offsets 100, 101, 102, and 103 give local next position 104. Replica next positions 104, 104, and 103 give the illustrative replicated boundary 103 after the relevant protocol observation. An unresolved transaction at 102 can place the stable boundary at 102, so committed readers remain below it. The three boundaries answer different questions.

**E3.** Committing 102 before effects of 100 and 101 can lose both effects after a crash. Applying the effects before committing 102 can repeat them after restart from 100. The safe at-least-once design records effect identity atomically with each effect and then commits its contiguous next position.

**E4.** Four partitions and six ordinary group members provide at most four active owners and two idle members under the simple model. A ten-second pause at 20 per second accumulates 200. Processing 100 per second while 20 arrive leaves 80 spare, so catch-up is 2.5 seconds under fixed record cost.

**E5.** The original event may have reached Kafka before its relay progress was stored. Restart republishes the durable intention and can create another offset under a new protocol identity. Offset-only deduplication treats it as new; the stable domain event identity or equivalent source-version rule prevents a repeated effect. Source publication and append-protocol retry need separate reasoning.

**E6.** A retained log supports independently paced readers and replay. Consumer progress does not delete the record. Retention still bounds recovery, and the design must name its group semantics and product version. A broker alone does not establish that the producer’s authoritative database change and publication are atomic. That gap belongs to the source flow.

**E7.** Define key, value, schema, headers, and topic policy. Key choice can preserve aggregate locality, but topic identity does not create global order. Keep domain version and diagnostic context distinct. Changing serialization without compatible readers can poison replay even while the broker correctly stores every byte.

**E8.** Partitioning provides parallel logs and partition-local order. Choose the key from the ordering requirement, consider skew, and plan partition-count changes. A merged topic reader must not invent a global sequence from unrelated offsets. Equal offsets in different partitions identify different positions. Store topic, partition, and offset together when using source position as an effect identity.

**E9.** Compute event count, payload, retention, and copies separately. Retention bounds replay independently of consumer success. A size limit can change the effective time window when traffic grows, so recovery needs both policy and observed log start. The simple byte calculation is not a benchmark or full disk budget. Compression, segment layout, indexes, and recovery headroom remain separate measured costs.

**E10.** Bootstrap supplies metadata; actual requests route to partition leaders. Plan advertised-address reachability and stale-metadata refresh. A connected client can still fail if its needed leader is unavailable. A load balancer in front of bootstrap cannot correct unreachable broker addresses advertised in metadata.

**E11.** Batching amortizes request overhead and can improve compression, while adding waiting and buffer cost. Name size, timing, memory, and delivery bounds. Compression changes stored bytes but does not remove the logical record identities. A producer buffer accepting a record does not mean the broker has accepted it. Application success must follow the required completion boundary.

**E12.** The leader appends a validated batch into segments and assigns partition offsets. The log end is the next append position. Local append, replica agreement, transactional visibility, and crash-safe persistence are separate states. A process’s in-memory end offset cannot prove that the same tail survives a machine or disk failure.

**E13.** Keep retained start, local end, replicated read boundary, transaction stability, and group progress distinct. State whether each number is an inclusive record offset or an exclusive next position. Offsets are not interchangeable counters. Off-by-one progress errors can skip the last unprocessed record or replay an unnecessary record. Write the next-position convention beside the trace.

**E14.** Separate configured replicas from the current ISR and each replica’s position. Followers copy the leader, and their progress affects replicated visibility and write policy. A lagging configured copy is not equivalent to a current one. ISR membership is protocol state, not a static count chosen once at topic creation. Explain writes after membership shrinks.

**E15.** State producer acknowledgements and topic minimum ISR together. The strong policy can reject writes when too few replicas qualify. Replica count alone does not describe successful produce, and acknowledgements are not a universal per-record filesystem flush guarantee. Saying acks all means every configured replica is wrong when some configured replicas are outside the ISR. Use the product’s documented protocol and membership semantics.

**E16.** The high watermark is a replicated visibility boundary, not merely the leader’s log end. Trace follower fetch and progress observation before moving it. Transactions can impose a separate lower stable boundary for committed readers. Adding leader and follower offsets together measures nothing useful. Compare progress in the same partition and convention.

**E17.** Failover needs eligible history and a new ownership epoch. Explain the availability and loss policy if no sufficiently safe replica remains. The simple ISR story is an introductory model; version-specific eligible-leader settings affect the full protocol. An old process remaining alive does not make it current leader. Clients and brokers must reject obsolete authority under the protocol.

**E18.** Separate fetched position from durable restart position. Commit the next offset after the contiguous completed prefix is safe. A high completed offset cannot justify skipping unfinished lower work. Automatic progress commits can race application processing. Use a policy aligned with effect completion rather than assuming fetch means handled.

**E19.** Committing progress before effect creates a loss window after the commit. It supports at-most-once attempt semantics under that flow, not reliable effect completion. State whether losing those records is acceptable. A successful offset commit is not a business completion acknowledgement. It proves only the stored group progress boundary.

**E20.** Apply safely before committing progress, then tolerate replay with durable effect identity or a repeatable transition. At-least-once plus idempotent consumers is common because it turns uncertain acknowledgements into safe repetition. An in-memory set of handled offsets disappears on restart and cannot protect a durable external effect.

**E21.** Coordinate effect and its deduplication record at the effect authority. Commit Kafka progress afterward and accept replay. Scope identity with topic and partition, and preserve it for the intended replay horizon. Kafka transactions do not automatically include an arbitrary SQL database or payment provider. Exactly-once scope must name the participants.

**E22.** A group represents one application’s assignment and progress. Ordinary partition-exclusive groups divide partitions among members; separate applications use separate groups. State the assumed group model because share groups differ. Putting projector and notification processes in the same ordinary group makes them divide records instead of each application seeing the required history.

**E23.** Liveness and useful progress are distinct. Choose timer and batch policies from processing behavior, bound outside waits, and inspect the group protocol in use. A suspected member can still have unfinished work after ownership changes. Increasing a timeout can hide slow processing and delay recovery. It does not raise the effect system’s capacity.

**E24.** Rebalance changes ownership and can repeat in-flight work. Group protocol fences obsolete commits; external effects still need repeatability or fencing. Define revoke, finish, cancel, and restart behavior explicitly. An application that keeps processing a revoked partition without a protection rule can race its replacement even if Kafka correctly rejects its old offset commit.

**E25.** Parallel application work must preserve its ordering invariant and contiguous restart boundary. A completed high offset is not permission to skip lower pending work. Scale independent keys and measure skew before adding members. Unlimited completion tracking is another queue. Bound the out-of-order window and apply backpressure when an early record stalls.

**E26.** Producer idempotence suppresses supported retry duplicates at the append protocol. It does not infer whether two separately submitted records represent the same business command. Preserve event identity for application-level repeats. Recreating an ordinary producer and resending a payload can be a new protocol identity. Do not extend producer retry guarantees beyond their documented scope.

**E27.** A stable transactional identity supports recovery and fencing for a logical producer owner. Assign it consistently without sharing it between unrelated concurrent owners. A fenced producer must stop and resolve ownership, not blindly retry. Randomly changing the transactional identity on each restart can prevent the intended cross-instance fencing and recovery relationship.

**E28.** Kafka can atomically commit Kafka output records and consumed offsets for a defined consume-transform-produce workflow. State reader isolation and ownership. Exactly-once scope stops at systems not participating in that atomic boundary. A payment call or SQL mutation inside the transaction’s code block is not made atomic with Kafka merely because the code is nested there.

**E29.** Committed readers respect transaction stability as well as replicated visibility. An open transaction can hold later data behind its first unresolved offset. Distinguish consumer isolation from producer acknowledgement and application effect safety. A stalled committed reader can be waiting for transaction resolution rather than a slow fetch or lagging replica. Inspect both boundaries.

**E30.** Retention reclaims eligible segments without waiting for consumers. Size and time policies shape the available source horizon, and cleanup granularity matters. Define the out-of-range recovery policy before lag exceeds the retained log. Silently resetting to latest can discard required effects. Earliest resumes only the retained history, which may still be insufficient for a full rebuild.

These exercises describe illustrative designs, not the private architectures of the named products. Continue by defending the same flows under a changed workload, while keeping each safety rule explicit.

### Primary sources

[Kafka 4.1 design](https://kafka.apache.org/41/design/design/). Partition logs, replication, delivery and transaction scope.

[Kafka 4.1 producers](https://kafka.apache.org/41/configuration/producer-configs/). Acknowledgements, retries, idempotence, and bounded buffers.

[Kafka 4.1 consumers](https://kafka.apache.org/41/configuration/consumer-configs/). Group, progress, and read isolation configuration.

[Kafka 4.1 topics](https://kafka.apache.org/41/configuration/topic-configs/). ISR, retention, and compaction policies.

[Kafka 4.1 KRaft](https://kafka.apache.org/41/operations/kraft/). Metadata quorum and controller operation.

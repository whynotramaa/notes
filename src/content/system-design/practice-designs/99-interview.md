@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How would you explain url shortener: creation and redirect in a production design?**

The authority uniquely binds a short key to a destination. Creation retries need stable caller intent; random-key collisions need a unique constraint and another candidate. Redirect caches must respect expiry, edits, and abuse policy. A hash of the URL can still collide, and equal URLs do not necessarily mean the caller wants the same ownership or expiry. The contract decides deduplication.

**Q2. How would you explain pastebin: bytes and expiry in a production design?**

Publish only after the stored content is verified and metadata is committed. Enforce logical expiry on reads, then reclaim physical bytes asynchronously. Stable creation identity and orphan cleanup recover the cross-store failure window. TTL eviction is not an access-control guarantee. A replica or CDN can retain bytes after the logical expiry unless its serving rule also enforces the deadline.

**Q3. How would you explain rate limiter: atomic token decision in a production design?**

The token decision is one atomic transition. Compute refill from elapsed time, cap it, check cost, and store the remainder. Key scope, clock policy, and failure behavior are part of the limiter, not deployment details. An atomic increment followed by a separate expiry operation can leave an immortal window key after a crash. Use one atomic script or command composition that protects the whole state.

**Q4. How would you explain notifications: intent, attempt, and receipt in a production design?**

Keep the durable notification identity separate from each delivery attempt. Name whether accepted means queued, provider accepted, delivered to a device, or seen. Recover unknown provider outcomes with stable intent and reconciliation. Unlimited retries of a permanently invalid destination waste capacity. Classify retryable failure and expose terminal or pending recovery states.

**Q5. How would you explain chat: durable order and reconnect in a production design?**

Put message identity and conversation order at a durable authority. Push is a delivery optimization over recoverable history. A reconnect resumes from an acknowledged position, and duplicate sends preserve the same message effect. A timestamp assigned by a phone can be wrong or repeated. It cannot safely establish authoritative conversation order by itself.

**Q6. How would you explain whatsapp-style messaging: device fan-out in a production design?**

Separate message acceptance, per-device delivery, and reading. Durable ciphertext can be delivered under stable envelope identity, with explicit membership and key-version rules. Offline retention bounds the recoverable history. An acknowledgement from one device does not prove all recipient devices have stored or displayed the message. This is a hypothetical exercise, not a description of WhatsApp internals.

**Q7. How would you explain news feed: work placement and ranking in a production design?**

The feed moves work between publish and read paths. Count recipient writes and candidate reads, handle skew, and make entry identity, ranking, pagination, deletion, and permissions explicit. A hybrid needs a safe class-change boundary. The two arithmetic scenarios do not prove read fan-out always wins; they differ in the work measured and must be tied to a shared workload.

**Q8. How would you explain dropbox-style sync: blocks and versions in a production design?**

Sync separates reusable bytes from authoritative namespace and version metadata. Commit a complete verified manifest conditionally, detect concurrent edits, and recover changes through a cursor or rescan. Transfer savings do not remove metadata races. Content hashes must be verified and scoped safely; a guessed hash should not grant permission to another user’s file. The exercise does not claim Dropbox uses this exact block size.

**Q9. How would you explain google drive-style files: sharing and upload state in a production design?**

Separate object bytes from namespace, revision, and permission authority. Resumable transfer recovers partial bytes; conditional metadata publication recovers concurrent changes. Validate permissions at the serving boundary and keep a client change cursor. A stale sharing cache or long-lived signed URL can extend access after revocation. State the allowed revocation delay.

**Q10. How would you explain search autocomplete: prefix candidates in a production design?**

Build an access path for normalized prefixes and bound candidate and fuzzy work. Version client input to reject out-of-order responses. Caching and personalization need matching keys, and stale suggestions must not expose forbidden content. A fast index does not prevent a stale older network response from overwriting the latest suggestions in the browser.

**Q11. How would you explain ticket booking: one seat, one winner in a production design?**

Enforce one winner with an atomic authoritative transition. Bind payment and release to the reservation identity, and define delayed-payment recovery after expiry. Discovery availability can be eventually consistent while ownership cannot. A distributed lock whose lease expires cannot by itself stop a paused old owner from selling the seat later. The seat state must reject obsolete ownership.

**Q12. How would you explain payments: intent, ledger, and reconciliation in a production design?**

Persist payment intent and use stable outside identity. Resolve unknown outcomes through provider semantics and reconciliation. Record balanced ledger effects atomically, and make webhooks repeatable with a state transition rule. Do not treat a webhook’s arrival order as the business order, or create a second charge under a new identity just because the first reply was lost.

**Q13. How would you explain uber-style matching: candidates and assignment in a production design?**

Use spatial state for candidate discovery and a separate authoritative transition for assignment. Version and expire locations, bound retries, and decide how stale a candidate may be. Map proximity does not prove availability. A driver can receive two concurrent offers; the winner must be decided by the assignment authority rather than by which dispatcher happens to reply first.

**Q14. How would you explain youtube-style video: processing and playback in a production design?**

Separate original durability, processing, and playable publication. Make outputs versioned and jobs repeatable, then serve a confirmed manifest through a content path. CDN hits reduce origin work but not viewer egress. Publishing the manifest before its segments exist produces a fast API response followed by broken playback. This is a hypothetical video design, not a claim about YouTube’s private pipeline.

**Q15. How would you explain instagram-style media: feed references and access in a production design?**

Commit a verified media state before publishing its feed reference. Count originals and derivatives separately. Feeds and CDN copies are derived; the permission and deletion contract still governs serving. A thumbnail can leak private content even when the full-image route checks access. Apply the same visibility boundary to every derivative.

**Q16. How would you explain google docs-style collaboration: concurrent operations in a production design?**

Choose and explain the actual concurrent-operation algorithm. Stable identity, causal context, durable history, and reconnect recovery are required whichever family is used. Show one concurrent edit through both clients rather than listing OT or CRDT. A WebSocket transports edits but supplies no merge rule. This hypothetical exercise does not claim the current internals of Google Docs.

**Q17. How would you explain metrics and logging platform: bounded ingestion in a production design?**

Bound tenants, series cardinality, queues, retention, and query work. Compute sample and byte rates separately. Name the ingestion durability and query-freshness contract, and observe the observer’s own loss path. If every exporter retries without admission limits, the platform’s recovery can create another synchronized overload burst.

**Q18. How would you explain distributed job scheduler: claim and fencing in a production design?**

Persist the logical job and each ownership attempt. Atomic claims and lease checks coordinate workers; fencing or repeatable effects protect the actual task outcome. Scheduling needs missed-run and overlap semantics. A worker reporting complete after its lease expired must not overwrite the replacement’s progress or repeat an irreversible effect.

**Q19. How would you explain kafka-style event log: append and replay in a production design?**

Explain partition-local order, leader append, replication acknowledgement, independent progress, and retention. A log serves replaying independent readers; it is not simply a queue that deletes each handled message. External effects still need repeatable processing. A committed consumer offset does not prove an external database effect committed unless the design coordinates or deduplicates those boundaries.

**Q20. How would you explain distributed cache: placement and source protection in a production design?**

A cache needs placement, version, expiry, eviction, hot-key handling, and source-failure protection. Compute memory from the stored representation and copies. A cache outage must not turn every waiting caller into unrestricted source load. A key hashing algorithm chooses placement but does not transfer data, enforce freshness, or make a node’s acknowledgement durable.

**Q21. How would you explain design redis itself: protocol and execution in a production design?**

Design the parser, execution authority, data structures, expiry, and output buffers rather than saying in-memory database. Stream framing and command work are separate limits. A slow client and a large command need bounded behavior. Splitting commands on spaces breaks binary-safe values, and treating each socket read as one command breaks ordinary stream delivery.

**Q22. How would you explain design kafka itself: segments and visibility in a production design?**

Build the segment append path, offset lookup, replication progress, consumer fetch, and restart validation. Local append is not automatically the same as committed visibility or crash-safe persistence. State the acknowledgement contract. Deleting old segments based only on one consumer’s acknowledgement would destroy replay for other consumers and violates retention-based log behavior.

**Q23. How would you explain design dropbox itself: local scan to remote commit in a production design?**

Trace discovery, stable read, chunk verification, conditional manifest commit, remote cursor, and atomic local apply. Keep namespace authority separate from reusable bytes. Garbage collection uses reachability, not only recent upload time. A watcher alone is not a complete change log, and an unversioned overwrite can erase another device’s concurrent edit.

**Q24. How would you explain design a database itself: pages, wal, and recovery in a production design?**

Trace planning, page lookup, concurrency, log generation, commit durability, page flushing, and recovery. WAL persistence ordering protects crash recovery; transaction isolation and indexes solve different problems. Real tree height includes fill and layout details. A log entry in an application buffer is not durable. A checkpoint cannot replace the need for the log records still required to recover unflushed changes.

**Q25. How would you explain payment timeout: the full reconciliation trace in a production design?**

The failure is a gap in knowledge, not necessarily a failed charge. Reconcile under stable intent, apply local accounting once, and make webhook and polling observations converge through one authority. Compensation has its own durable identity. A retry with a new provider key can create a second charge. A timeout alone never justifies replacing the original intent.

**Q26. How would you explain booking expiry: old owner meets new winner in a production design?**

Bind every release and completion to the exact reservation identity and generation. Atomically reject obsolete ownership at the seat authority. Reconcile late outside payments without violating the one-winner rule. Checking only that the seat is held allows an old customer to complete another customer’s hold if the identity is not compared.

**Q27. How would you explain message receipts: acceptance is not reading in a production design?**

Name the boundary behind each delivery status. Preserve per-device progress and monotonic receipt handling. A socket send cannot establish application receipt, and a device receipt cannot establish that a person read the content. A global delivered flag can hide one offline device. Decide whether the promise concerns any device, every device, or the user account.

**Q28. How would you explain concurrent document inserts: an actual merge rule in a production design?**

Show the chosen tie break and transformation through server and both clients. Preserve operation identity and canonical history. A complete collaboration algorithm must define insertion, deletion, overlap, and reconnect, not only its name. This positional example illustrates a mechanism family; it is not a complete proven OT implementation and does not establish all convergence conditions.

**Q29. How would you explain live fan-out: gateway and link arithmetic in a production design?**

Compute recipient work and egress separately from upstream copies. Add gateway failure capacity and reconnect load, then bound each slow client’s queue. A gateway count based only on normal connections is incomplete. A synchronized reconnect can overload authentication and replay even when steady-state socket capacity is adequate.

**Q30. How would you explain transfer and incremental-sync arithmetic in a production design?**

Separate changed-byte savings from scan, hash, metadata, and commit work. Reuse only verified authorized content and publish a complete conditional manifest. Format and chunking choices determine whether a small edit yields a small transfer. The assumed block size is an exercise input, not an inferred private-product parameter or optimal universal choice.

**Q31. How would you explain retention budgets for logs and metrics in a production design?**

Multiply rate, record size where applicable, and time, then add representation and copies. Choose retention from recovery and investigation needs. Aggregation changes the available evidence rather than merely shrinking identical data. A byte budget cannot be inferred from metric sample count without an encoding and label-storage model.

**Q32. How would you explain queue overload and recovery capacity in a production design?**

Compute queue growth and drain from net rates, then test variable task sizes and retries. Bound count, bytes, age, and concurrency. Backpressure must reach the producer or admission boundary to prevent hidden accumulation. A queue depth that stays constant can still conceal permanent starvation of older items. Inspect oldest age and successful effects.

**Q33. How would you explain the invariant matrix across practice systems in a production design?**

Identify the actual invariant and its authority for each design. Separate approximate discovery and delayed projections from precise effect ownership. Trace the atomic rule instead of applying one consistency label to the whole system. A product name does not determine its consistency contract. Requirements and operations determine which state may lag or conflict.

**Q34. How would you explain a failure drill shared by every design in a production design?**

Use common drills to expose different required mechanisms. State surviving durable data and the safe restart action. Lost knowledge, stale ownership, and insufficient capacity are different problems and need different protections. An exception raised before the effect exercises an easy case; the decisive drill interrupts after an authority committed but before another party learned it.

**Q35. How would you explain heron end to end: one complete design in a production design?**

Assemble the design by connecting complete flows, not by merging every practice diagram. Preserve each authority, acknowledgement, version, and recovery path. Count the API, live-delivery, media, and telemetry workloads separately. Adding every mechanism from the syllabus can create unnecessary dependencies. Include only what the selected actions and guarantees require.

**Q36. How would you explain the next rehearsal and the boundary of these designs in a production design?**

Practice the flow and its failures, then test the assumptions through implementation or measured experiments. Distinguish public documented behavior from illustrative architecture. A strong interview answer can defend its exact contract without claiming private product knowledge. These outlines are not complete production specifications for cryptography, payments regulation, or globally deployed storage. Their purpose is to teach the stated mechanisms and the questions needed for the next boundary.

**Q37. What does every practice design need beyond a component list?**

It needs an invariant, authority, stable identity, state transition, acknowledgement meaning, failure trace, numerical demand, and recovery source. Different systems stress different parts of that argument. A queue, cache, or database name does not establish any of those promises alone.

**Q38. Why practice Redis, Kafka, Dropbox, and a database themselves?**

They expose what ordinary architecture boxes conceal: stream parsing and command execution, segment append and replication, file manifests and concurrent versions, and pages with persistence ordering. Designing those paths makes it possible to defend a caller’s durability, retry, and capacity assumptions.

**Q39. How should a named-product example be described?**

Describe it as a hypothetical service with similar user actions unless primary sources establish a particular public mechanism. Label workload numbers as illustrative. Public API behavior does not reveal every internal service or justify a claimed production capacity.

**Q40. What is the most useful cross-system recovery question?**

Ask what committed before the interruption, which party knows it, and which stable identity lets recovery continue without another effect. Then separately ask whether an obsolete owner can still write and whether fallback load exceeds the authority’s capacity.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute short-key space and explain collision handling.

**E2** •• Compute token remainder, file transfer savings, and upload part count.

**E3** •• Compute live delivery and minimum connection capacity.

**E4** •• Compute cache and event-log retained payload.

**E5** ••• Trace payment timeout, expired booking, and database power loss.

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

**E1.** Seven base-62 positions yield 62 to the seventh power, or 3,521,614,606,208 strings. This is capacity of the string space, not a uniqueness guarantee for random generation. A unique authoritative insert rejects an occupied candidate, and creation retries use a separate caller identity.

**E2.** Twelve seconds refill 100 divided by 60 times 12, or 20 tokens. Starting with 20 gives 40 and spending 25 leaves 15. A 5,000,000,000-byte file divided into 100,000,000-byte parts has 50 parts. Changing two transfers 200,000,000 bytes and reuses 4,800,000,000. These are illustrative fixed-block assumptions.

**E3.** Multiply 20 events per second by 50,000 viewers for 1,000,000 messages per second. Multiply by 200 bytes for 200,000,000 payload bytes per second. Divide 50,000 by the 10,000-connection gateway assumption for five gateways, then add separate failure capacity and overhead assumptions.

**E4.** For 100,000 cache items at 2,000 plus 100 bytes, memory is 210,000,000 bytes; three full copies give 630,000,000. The log carries 20 times 200 times 86,400, or 345,600,000 bytes per day. Seven days and three copies give 7,257,600,000. Both exclude representation overhead.

**E5.** A payment timeout reconciles the same durable intent rather than creating another charge. An expired booking rejects an old reservation identity at the seat transition and recovers any late charge separately. A database power loss recovers from the promised durable log boundary; an in-memory update or log buffer is not proof of committed persistence.

**E6.** The authority uniquely binds a short key to a destination. Creation retries need stable caller intent; random-key collisions need a unique constraint and another candidate. Redirect caches must respect expiry, edits, and abuse policy. A hash of the URL can still collide, and equal URLs do not necessarily mean the caller wants the same ownership or expiry. The contract decides deduplication.

**E7.** Publish only after the stored content is verified and metadata is committed. Enforce logical expiry on reads, then reclaim physical bytes asynchronously. Stable creation identity and orphan cleanup recover the cross-store failure window. TTL eviction is not an access-control guarantee. A replica or CDN can retain bytes after the logical expiry unless its serving rule also enforces the deadline.

**E8.** The token decision is one atomic transition. Compute refill from elapsed time, cap it, check cost, and store the remainder. Key scope, clock policy, and failure behavior are part of the limiter, not deployment details. An atomic increment followed by a separate expiry operation can leave an immortal window key after a crash. Use one atomic script or command composition that protects the whole state.

**E9.** Keep the durable notification identity separate from each delivery attempt. Name whether accepted means queued, provider accepted, delivered to a device, or seen. Recover unknown provider outcomes with stable intent and reconciliation. Unlimited retries of a permanently invalid destination waste capacity. Classify retryable failure and expose terminal or pending recovery states.

**E10.** Put message identity and conversation order at a durable authority. Push is a delivery optimization over recoverable history. A reconnect resumes from an acknowledged position, and duplicate sends preserve the same message effect. A timestamp assigned by a phone can be wrong or repeated. It cannot safely establish authoritative conversation order by itself.

**E11.** Separate message acceptance, per-device delivery, and reading. Durable ciphertext can be delivered under stable envelope identity, with explicit membership and key-version rules. Offline retention bounds the recoverable history. An acknowledgement from one device does not prove all recipient devices have stored or displayed the message. This is a hypothetical exercise, not a description of WhatsApp internals.

**E12.** The feed moves work between publish and read paths. Count recipient writes and candidate reads, handle skew, and make entry identity, ranking, pagination, deletion, and permissions explicit. A hybrid needs a safe class-change boundary. The two arithmetic scenarios do not prove read fan-out always wins; they differ in the work measured and must be tied to a shared workload.

**E13.** Sync separates reusable bytes from authoritative namespace and version metadata. Commit a complete verified manifest conditionally, detect concurrent edits, and recover changes through a cursor or rescan. Transfer savings do not remove metadata races. Content hashes must be verified and scoped safely; a guessed hash should not grant permission to another user’s file. The exercise does not claim Dropbox uses this exact block size.

**E14.** Separate object bytes from namespace, revision, and permission authority. Resumable transfer recovers partial bytes; conditional metadata publication recovers concurrent changes. Validate permissions at the serving boundary and keep a client change cursor. A stale sharing cache or long-lived signed URL can extend access after revocation. State the allowed revocation delay.

**E15.** Build an access path for normalized prefixes and bound candidate and fuzzy work. Version client input to reject out-of-order responses. Caching and personalization need matching keys, and stale suggestions must not expose forbidden content. A fast index does not prevent a stale older network response from overwriting the latest suggestions in the browser.

**E16.** Enforce one winner with an atomic authoritative transition. Bind payment and release to the reservation identity, and define delayed-payment recovery after expiry. Discovery availability can be eventually consistent while ownership cannot. A distributed lock whose lease expires cannot by itself stop a paused old owner from selling the seat later. The seat state must reject obsolete ownership.

**E17.** Persist payment intent and use stable outside identity. Resolve unknown outcomes through provider semantics and reconciliation. Record balanced ledger effects atomically, and make webhooks repeatable with a state transition rule. Do not treat a webhook’s arrival order as the business order, or create a second charge under a new identity just because the first reply was lost.

**E18.** Use spatial state for candidate discovery and a separate authoritative transition for assignment. Version and expire locations, bound retries, and decide how stale a candidate may be. Map proximity does not prove availability. A driver can receive two concurrent offers; the winner must be decided by the assignment authority rather than by which dispatcher happens to reply first.

**E19.** Separate original durability, processing, and playable publication. Make outputs versioned and jobs repeatable, then serve a confirmed manifest through a content path. CDN hits reduce origin work but not viewer egress. Publishing the manifest before its segments exist produces a fast API response followed by broken playback. This is a hypothetical video design, not a claim about YouTube’s private pipeline.

**E20.** Commit a verified media state before publishing its feed reference. Count originals and derivatives separately. Feeds and CDN copies are derived; the permission and deletion contract still governs serving. A thumbnail can leak private content even when the full-image route checks access. Apply the same visibility boundary to every derivative.

**E21.** Choose and explain the actual concurrent-operation algorithm. Stable identity, causal context, durable history, and reconnect recovery are required whichever family is used. Show one concurrent edit through both clients rather than listing OT or CRDT. A WebSocket transports edits but supplies no merge rule. This hypothetical exercise does not claim the current internals of Google Docs.

**E22.** Bound tenants, series cardinality, queues, retention, and query work. Compute sample and byte rates separately. Name the ingestion durability and query-freshness contract, and observe the observer’s own loss path. If every exporter retries without admission limits, the platform’s recovery can create another synchronized overload burst.

**E23.** Persist the logical job and each ownership attempt. Atomic claims and lease checks coordinate workers; fencing or repeatable effects protect the actual task outcome. Scheduling needs missed-run and overlap semantics. A worker reporting complete after its lease expired must not overwrite the replacement’s progress or repeat an irreversible effect.

**E24.** Explain partition-local order, leader append, replication acknowledgement, independent progress, and retention. A log serves replaying independent readers; it is not simply a queue that deletes each handled message. External effects still need repeatable processing. A committed consumer offset does not prove an external database effect committed unless the design coordinates or deduplicates those boundaries.

**E25.** A cache needs placement, version, expiry, eviction, hot-key handling, and source-failure protection. Compute memory from the stored representation and copies. A cache outage must not turn every waiting caller into unrestricted source load. A key hashing algorithm chooses placement but does not transfer data, enforce freshness, or make a node’s acknowledgement durable.

**E26.** Design the parser, execution authority, data structures, expiry, and output buffers rather than saying in-memory database. Stream framing and command work are separate limits. A slow client and a large command need bounded behavior. Splitting commands on spaces breaks binary-safe values, and treating each socket read as one command breaks ordinary stream delivery.

**E27.** Build the segment append path, offset lookup, replication progress, consumer fetch, and restart validation. Local append is not automatically the same as committed visibility or crash-safe persistence. State the acknowledgement contract. Deleting old segments based only on one consumer’s acknowledgement would destroy replay for other consumers and violates retention-based log behavior.

**E28.** Trace discovery, stable read, chunk verification, conditional manifest commit, remote cursor, and atomic local apply. Keep namespace authority separate from reusable bytes. Garbage collection uses reachability, not only recent upload time. A watcher alone is not a complete change log, and an unversioned overwrite can erase another device’s concurrent edit.

**E29.** Trace planning, page lookup, concurrency, log generation, commit durability, page flushing, and recovery. WAL persistence ordering protects crash recovery; transaction isolation and indexes solve different problems. Real tree height includes fill and layout details. A log entry in an application buffer is not durable. A checkpoint cannot replace the need for the log records still required to recover unflushed changes.

**E30.** The failure is a gap in knowledge, not necessarily a failed charge. Reconcile under stable intent, apply local accounting once, and make webhook and polling observations converge through one authority. Compensation has its own durable identity. A retry with a new provider key can create a second charge. A timeout alone never justifies replacing the original intent.

These exercises describe illustrative designs, not the private architectures of the named products. Continue by defending the same flows under a changed workload, while keeping each safety rule explicit.

### Primary sources

[Redis protocol](https://redis.io/docs/latest/develop/reference/protocol-spec/). Stream framing and request/reply types.

[Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/). Snapshot and append-log durability choices.

[Kafka 4.1 design](https://kafka.apache.org/41/design/design/). Partitioned logs, replication, and consumer progress.

[Drive upload API](https://developers.google.com/workspace/drive/api/guides/manage-uploads). Public resumable-upload behavior.

[PostgreSQL WAL](https://www.postgresql.org/docs/current/wal-intro.html). Write-ahead persistence ordering.

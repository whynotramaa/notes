@part VII | Case study: a complete data model | We connect the chosen models into one recoverable request path. A specialized read view is useful only when its source, freshness, and rebuild behavior are clear. We will trace a score event, count maintained copies, and defend the smallest design that fits. | where:7

## 31. One authoritative owner per invariant

A scorer submits an event that changes Heron's score and becomes part of its history. A cache and a search view should not independently decide whether that event happened. An **authoritative owner** is the component allowed to commit the fact or enforce the invariant that readers rely on.

The score owner validates match identity, scorer permission, expected sequence, and operation identity. It commits the accepted event under a defined transaction or log boundary. Derived read stores then reproduce selected facts. Their faster queries do not grant them independent authority to invent or reorder accepted events.

Ownership can be per match rather than global. Different matches may progress independently, while one match's sequence remains ordered. Cross-match operations need another invariant boundary if they must succeed together. State that boundary before choosing a partition layout that makes atomicity inconvenient.

Begin with the simplest owner that can enforce the required rules. One relational database may be enough for Heron's initial score, clip, and history operations. A key-value score cache or graph recommendation view is an addition for a measured query role. Count the new propagation and recovery obligations before assuming the additional store improves the whole system.

@fig sd_nosql_authority | Illustrative accepted-event owner commits truth before derived read models apply it.

## 32. Trace an event into its read models

Follow one illustrative event through the design. The scorer request carries match identity, operation identity, and expected sequence. The authoritative owner accepts it once, assigns the next sequence, and commits the source state. This produces a replayable input rather than an untracked attempt to update every store at once.

The latest-score view replaces its match record only with a newer source sequence. The history view stores the event under match, bucket, and sequence. A scorer-oriented view stores the same source identifier under its alternative key. Each view records progress so a restarted consumer can continue or replay safely.

If a consumer fails after applying a replacement but before acknowledging progress, replay repeats the same source version. A correctly conditional replacement remains unchanged. For an incremental effect, retain a deduplication record or use a supported atomic boundary so replay cannot add the effect again. The event identity connects recovery to the original fact.

The viewer reads from the view whose freshness fits the action. After a scorer save, an authoritative or version-aware path can establish read-your-writes. A public history page may permit a declared delay. The system's claim becomes concrete when it names the source position each view has applied and how a reader handles being ahead of it.

@fig sd_nosql_event_trace | Illustrative accepted event reaches version-aware latest, history, and scorer views with recoverable progress.

## 33. Count messages, storage, and recovery work

At 20 illustrative events per second, a source record plus two additional views creates three logical writes per event. That is 60 record writes per second. With three replicas for each representation, count 180 copy writes per second before log writes, indexes, retries, or compaction.

Each source event contains an illustrative 200-byte payload, so the source log carries 4,000 payload bytes per second. Over 86,400 seconds it carries 345,600,000 bytes. Three copies contain 1,036,800,000 payload bytes for the day. These payload totals do not establish the physical capacity of any named product.

| Role | Source event work | Derived obligation |
|---|---|---|
| Authoritative event owner | Commit once | Validate identity and order |
| Latest score view | Replace by version | Reject older replay |
| Match history view | Store ordered event | Bound bucket growth |
| Scorer access view | Store alternate key | Repair missed copies |
| Replication | Maintain copies | Detect and repair disagreement |

The maintained views add source-load and recovery demands. A one-hour history payload replay has a 14.4-second transfer-only lower bound at the stated 1 MB/s payload rate. Actual catch-up also performs writes while new events arrive. Reserve spare capacity and expose lag before declaring the read model recoverable.

A copy is justified when its repeated read savings exceed the cost and operational difficulty it introduces for this workload. That comparison includes correction and deletion, not only insertion. The ledger makes it possible to remove a view later without losing the fact it once derived.

@fig sd_nosql_full_budget | Computed illustrative source-log and copy-write totals use the same 20-event/s workload.

## 34. Adding a new access pattern safely

The product now asks for events by scorer across matches. The original match-history key cannot make that query local. Add an explicitly derived scorer view rather than disguising a full scan as a new endpoint. The source event identity and version make this new route reconstructible.

Begin with a source boundary and capture later updates while scanning retained events. Populate the new scorer keys, apply subsequent changes, and verify that progress reaches a declared readiness point. Use bounded query comparisons to check completeness, ordering, deletions, and duplicate handling. A successful bulk write count alone cannot establish the view's correctness.

During rollout, keep readers on the old behavior or mark the new results partial until readiness is established. A feature requiring complete history cannot silently serve an incomplete index. If current-only data is acceptable initially, make that reduced scope explicit rather than presenting it as historical coverage.

Retain enough source history for replay, or retain a snapshot and change boundary that rebuild can use. The retention policy of the authoritative source constrains future views. A source that discarded old event identity cannot recreate exact old derived rows merely because the database has room for them now.

@fig sd_nosql_new_query | Illustrative new scorer access path becomes ready after backfill, captured changes, and coverage verification.

## 35. Defending the model end to end

An interviewer asks why Heron needs several database models. Begin with the operations and invariants, not a product catalog. Show the direct current-score lookup, the bounded match-history range, the clip aggregate, and any measured relationship query. Then identify which owner can accept each fact.

Explain the negative cases. A graph does not improve the known-key score read. A document containing every comment grows without bound. A timestamp-leading row key can concentrate new writes. An eventual derived index is not sufficient for every delete-sensitive or immediately fresh query. These boundaries make the choice precise.

Trace one failure completely. If a history consumer crashes after the source commits, replay follows its recorded position. If an old version arrives after deletion, the tombstone rejects it. If a quorum participant is missing, the membership and acknowledgement protocol decide whether the operation continues. A family label cannot answer any of those histories.

This unit stops at choosing and maintaining data representations. It has not derived consensus, proved an isolation level, or specified a complete distributed transaction. The distributed-systems and database units supply those mechanisms. You can now ask them a sharper question: which ordering and failure guarantee does this particular read or write require?

@fig sd_nosql_defense | Illustrative review connects each model with its exact query, owner, freshness, and recovery contract.

:::story Picture this
A workshop keeps an original measurement sheet and several job-specific copies. A copy is useful because it removes repeated lookup work. The original remains the correction source, and each copy needs a way to receive corrections or be rebuilt.
:::

:::note One job for each representation
The authoritative owner validates and commits accepted facts. The latest-score record answers a direct lookup. The history layout orders bounded ranges. A clip document groups metadata. A graph or secondary view serves a different measured query and declares its lag and reconstruction boundary.
:::

:::warn Watch out
Adding a store creates another place that can miss a change, retain a deleted fact, or exhaust recovery capacity. A box on the diagram is justified only when its query benefit and its propagation and repair paths are all explained.
:::

:::interview Interview lens
**"Why not use one database for everything?"** I start with one when its contracts fit the workload. I add a derived representation for a measured expensive access pattern, then state its authoritative source, freshness, deletion, and rebuild behavior. The smallest recoverable design is easier to defend than a collection of unexplained specialized stores.
:::

:::key In one breath
Each invariant has an authoritative owner and every derived view has a replayable source. Heron's model follows known-key reads, bounded histories, owned documents, and optional relationship queries. Count view writes, replicas, storage, and catch-up capacity using the same workload. A complete design explains one request and one failure through all those boundaries before adding another store.
:::

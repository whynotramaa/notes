@part V | The indexing pipeline | We carry committed source changes into a searchable derived copy. Missing events and late versions create stale or resurrected documents. We will build a recoverable ingestion path, distinguish refresh from durability, and trace deletes and rebuilds. | where:5

## 17. Publish changes after the commit

A database transaction writes a report and an outbox row together. The outbox row identifies the report, source version, operation, and changed content or a fetch pointer. A relay later publishes that row to the indexing stream. This removes the dangerous gap where a report commits but the process dies before telling search.

An **indexing pipeline** is the sequence that reads changes, validates documents, analyzes text, and writes the search representation. At-least-once delivery can repeat a change. Use stable document IDs and source versions so repeating the same event does not create additional logical documents.

@fig sd_search_pipeline | Illustrative recoverable indexing path. The database transaction makes the source record and publication intent atomic.

Do not couple source transaction success to every search shard being healthy unless the product requires that synchronous dependency. A durable backlog lets writes continue during a search outage, within a declared lag and retention budget. Monitor oldest unindexed change age, failed documents, and the progress checkpoint. A fast relay that repeatedly rejects one malformed document has not completed ingestion.

:::story Picture this
A newsroom keeps the signed article in its archive and sends a copy to the catalogue clerk. The article remains published even if the catalogue desk is closed. A numbered change register tells the clerk what to catch up on later and prevents an older correction replacing a newer one.
:::

## 18. Bulk work still has partial failures

Sending each document in a separate request pays repeated network and request-parsing overhead. A **bulk request** packages many document operations into one request. An illustrative batch of 1,000 records at 500 bytes each carries 500,000 raw document bytes before framing.

The request-level response is not proof that every item succeeded. The index can accept some records and reject others because of mapping errors, version conflicts, or capacity limits. Examine each item result. Retry only recoverable failures using stable IDs and versions, and move permanently invalid records to a repair path with their error and source identity.

@fig sd_search_bulk | Illustrative partial-failure trace. Item categories are distinct even when the containing request succeeds.

After a retryable rejection, the consumer retains the item identity and source version and schedules another bounded attempt. A malformed field instead needs a corrected document or an explicit quarantine disposition. Keeping the whole batch in an endless retry loop makes the valid documents repeat while the invalid document never improves. Distinguishing item outcomes is what permits safe forward progress.

A larger batch increases throughput only until memory, queueing, or payload constraints dominate. It also increases the work a failure can repeat and the time the earliest document waits for a full batch. Flush by a size or time rule, bound concurrent bulk requests, and back off on overload. Explain those boundaries before calling bulk ingestion an optimization.

## 19. Refresh is a reader visibility boundary

The writer has added a report to the indexing buffer. An existing searcher still uses its old segment view. A **refresh** makes newly indexed operations visible to a search view by opening the relevant segment data. It need not perform the full durable commit associated with a storage flush.

[Elastic's near-real-time search documentation](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search) separates refresh visibility from the heavier commit process. Treat these as different events. Heron's one-second refresh exercise groups an assumed 20 changes; it is not a promise about a product's defaults or maximum delay.

@fig sd_search_refresh | Illustrative states. Search visibility and crash durability are separate guarantees.

For a read-after-write screen, waiting for the next refresh can be better than forcing a new refresh for every write. Forced refreshes can generate small segments and more merge work. For a transactionally authoritative read, use the source record and make clear that search catches up. The design choice follows the user action, not the desire for a single slogan about consistency.

:::note Checkpoints describe completed work
A pipeline checkpoint should advance only beyond changes whose required outcomes are resolved. If one batch item is quarantined, record that explicit disposition. Advancing past an unknown failure can make a missing document invisible to monitoring and replay.
:::

## 20. Version deletes so old events cannot resurrect data

The source emits update version 7, then delete version 8. A delayed update version 6 arrives afterward. If the index blindly overwrites by document ID, it can recreate a document the source has deleted. A **tombstone** records deletion at a particular version so later arrivals can be compared against it.

The consumer checks the incoming source version against the latest applied version. Version 7 can establish the live document. Version 8 changes it to deleted. Version 6 is older and rejected. A repeated version 8 is harmless. Version comparison and the write must be atomic at the index's stated conflict boundary.

@fig sd_search_tombstone | Computed illustrative version order. The delete's version prevents an old update from resurrecting the record.

Tombstone retention must exceed the possible replay horizon or use another durable version registry. A full rebuild also needs deletes that occurred during its snapshot. Rebuilding only live rows while allowing old retained changes to replay can reintroduce removed content. In an interview, follow the delete through every derived copy, cache, and suggestion index.

:::warn Watch out
An event's arrival timestamp is not a safe source version. A retry can arrive later than the correction that supersedes it. Use a source order or version rule that represents the document's actual update sequence.
:::

:::interview Interview lens
**"What happens when the search index is unavailable?"** Source commits can continue if their change publication intent is durable. The ingestion backlog grows, and the product follows a declared stale-search or unavailable-search policy. Recovery replays versions idempotently and tracks lag until catch-up. I would reserve retention and capacity for that recovery instead of assuming the normal ingestion rate can drain the backlog.
:::

:::key In one breath
The indexing pipeline transfers committed changes into a derived searchable representation. Stable IDs and source versions make repeats and out-of-order arrivals manageable. Bulk requests require per-item handling. Refresh makes a write searchable, while durability and deletion-version retention require their own guarantees.
:::

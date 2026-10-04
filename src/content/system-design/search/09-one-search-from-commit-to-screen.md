@part IX | Case study: search end to end | We assemble the chapter's pieces into one defensible system. A named box is useful only when its state and failure boundary are clear. We will follow a report update, a phrase query, a deletion, and the complete resource count. | where:9

## 33. The report update trace

Report 1 changes to source version 8. The database transaction commits its text and an outbox change together. The relay publishes the change. The indexer checks the version, applies the title analyzer, and writes the selected primary shard. Replication follows the engine's acknowledgement rule. A later refresh opens a search view containing the new representation.

The visible checkpoints are different. Source version 8 can be durable before the indexer receives it. The primary can acknowledge indexing before a search view exposes it. The source remains the repair authority if a malformed field prevents ingestion. A status API can describe indexed source progress without pretending that a single timestamp proves all documents are visible.

@fig sd_search_full_write | Illustrative end-to-end write trace. The final self-transition represents a local reader-view change.

The self-transition in the diagram names local state, not a network message. When drawing at a whiteboard, mark which arrows cross machines and which describe an internal action. This habit prevents invented latency and message counts. It also lets a reviewer ask precisely which step can repeat after a crash.

:::story Picture this
A reader follows a report through the archive, copying desk, catalogue, and public reading room. Each desk has its own completion stamp. The report can be archived before the public catalogue includes it. Asking which stamp the reader needs gives a concrete freshness contract.
:::

## 34. The phrase query trace

The viewer queries *red bird*. The query analyzer emits `red` and `bird` with an adjacent phrase rule. The coordinator selects one usable copy of each relevant shard. A shard reads the two posting lists, intersects candidate IDs, checks their positions, applies visibility filters, and computes the selected scoring contributions.

In the tiny corpus the intersection is document 1. Its positions are 1 and 2, so the exact phrase qualifies. Its BM25 contributions sum to 1.049822 under our explicit formula. The shard returns an ID, score, and stable tie-break value. The coordinator chooses global winners and fetches their display fields before the API responds.

@fig sd_search_full_query | Computed illustrative query trace. Score is rounded to six decimals and only compares results under the stated scoring model.

If the phrase finds document 1 but its current permission excludes the viewer, the visible answer is empty. That is a correct negative result despite a positive lexical match and score. The API must also omit its highlight and hidden-document contribution to counts. Walking this branch explains why the permission stage remains necessary inside a supposedly public text-search mechanism.

If the user searches without quotes, the product may choose all-term matching rather than adjacency. Make that decision in query construction. Do not change phrase semantics silently because a broad query is cheaper. A useful interview answer names the exact query contract and follows its representation through the engine.

## 35. The deletion and recovery trace

The owner deletes report 1 at version 9. A durable publication record transfers that decision to the indexer. The consumer records the higher version and removes search visibility. A later replay of version 8 fails its version check. Private suggestion caches and other derived search copies also need the deletion rule.

If the index fails after applying the delete but before advancing its source checkpoint, replay repeats version 9 harmlessly. If it fails before applying the delete, replay applies it on recovery. This is the reason to make the effect idempotent and checkpoint only resolved work. Exactly-once transport is not required to make the document's final state converge correctly.

@fig sd_search_full_delete | Illustrative recovery trace. The deletion version remains authoritative across repeated and late delivery.

During an outage, the product chooses between stale search, disabled search, or a limited alternative. It should not let an unrestricted source scan absorb every failed search request. Recovery capacity must exceed ongoing change input to drain the backlog. Search availability and deletion freshness may deserve different incident policies.

:::note Reconcile the derived copy
Periodically compare source identities and versions with indexed identities and versions using bounded work. Reconciliation finds missed events and historical bugs that normal replay cannot reveal. It complements the streaming path rather than becoming an unbounded scan on every user query.
:::

## 36. Count the whole design and defend its limits

The illustrative source contains 500,000,000 report bytes. The assumed searchable representation uses 750,000,000 bytes, divided into four primaries of 187,500,000 bytes each under equal balance. Three total copies per shard produce twelve shard copies and 2,250,000,000 data bytes. Temporary segments, merges, snapshots, caches, and reindex overlap are separate additions.

The assumed query workload creates 4,000 shard executions per second and up to forty candidates for a top-ten request before fetch. The source changes at 20 per second. A one-second refresh exercise groups twenty changes. A 200-second reindex copy overlaps 4,000 changes that must be replayed. These values reconcile with the same workload rather than changing the service between examples.

@fig sd_search_totals | Computed illustrative capacity summary. The index expansion ratio and throughput assumptions require measurement before deployment.

:::warn Watch out
The tiny formula and corpus explain mechanics. They do not specify a production shard count, analyzer, or capacity benchmark. The next decision is a measured test using the real query mix, writes, permissions, and recovery workload. Preserve the logical guarantees while changing the physical sizes.
:::

:::interview Interview lens
**"Design report search and explain every box."** The source database owns transactional reports and permissions. A durable change path feeds versioned documents to an analyzed index. Shards partition ownership, replicas provide alternate copies, and a coordinator combines eligible scored candidates before fetching display content. I would state freshness, incomplete-result handling, deletion propagation, and a snapshot-plus-replay rebuild plan beside the normal query path.
:::

:::key In one breath
A source version passes through durable publication, analysis, shard replication, and a search-view boundary. A query passes through terms, postings, positions, permissions, scores, and final fetches. Deletes and retries converge through versioned idempotent effects. A complete design counts logical data, physical copies, per-query work, background maintenance, and tested recovery.
:::

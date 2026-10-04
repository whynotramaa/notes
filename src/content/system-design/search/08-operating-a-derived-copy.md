@part VIII | Operating a search cluster | We keep search useful while writes and machines change. Recovery needs more than a replica count and a restart. We will budget work, paginate consistently, rebuild safely, and expose incomplete responses. | where:8

## 29. Budget indexing and querying separately

A report update consumes parsing, analysis, primary writing, replication, and eventual merging. A query consumes dictionary lookup, posting traversal, scoring, coordination, fetches, and optional highlighting. **Indexing throughput** and **query throughput** measure different work even when the same nodes perform both.

Separate the workload descriptions. Heron's assumed 20 changes per second cannot size a search endpoint serving an assumed 1,000 queries per second. A broad aggregation can cost much more than a narrow term query. Record query classes, touched shards, candidate counts, returned bytes, and latency targets.

@fig sd_search_budgets | Computed illustrative workload separation. Query rate is an explicit search sizing assumption.

Bound both ingestion concurrency and query concurrency. A slow disk can make indexing buffers grow while queries contend for the same I/O. Unbounded client requests simply move the queue into the engine. A bounded gateway queue and overload response preserve recovery options. The capacity test must include sustained writes and merges while queries run, not only a read-only warmed benchmark.

:::story Picture this
A catalogue clerk adds new cards while visitors borrow the drawers to search. Hiring more visitors does not make the clerk faster. Giving the clerk every drawer all day stops the visitors. The work types compete for shared resources, so their budgets need to be explicit.
:::

## 30. Deep pagination collects discarded candidates

The user requests ten results after skipping the first thousand. Every shard may need its best 1,010 candidates so the coordinator can determine the global offset page. Four shards produce up to 4,040 candidates, although the response contains only ten results.

**Offset pagination** names a count to skip before returning a page. A **search-after cursor** names the last returned ordering values so the next query can begin beyond that result. With a stable search view and stated order, four shards need only the next local ten candidates, or forty total in our exercise.

@fig sd_search_pagination | Computed illustrative distributed pagination work for four shards and a ten-result page.

A cursor is not simply the last document ID if the sort begins with relevance score or time. It carries the full ordering values and a stable tie-break component. Validate that it belongs to the same query and visibility context. Otherwise a reused cursor can skip relevant results or disclose an ordering boundary from a different private population.

The cursor must include all tie-break values and be bound to the query and visibility context. New writes can still reorder a live collection. A point-in-time view makes the population stable for the cursor's lifetime but holds resources and can retain old data. Set expiration and make a expired-cursor recovery policy explicit.

## 31. Rebuild into another index

An analyzer change makes old terms incompatible with the new representation. Reusing the same folder or rewriting data in place risks a collection containing mixed semantics. A **reindex** rebuilds searchable documents under a new schema or analysis rule, usually into a separate index.

Take a source snapshot with a known change position. Copy its live documents into the new index, then replay later changes with source versions. At an assumed 5,000 documents per second, a million-document snapshot copy takes 200 seconds. Heron's source emits 4,000 further changes during that interval at 20 per second. The new index must catch those up before its stated switch boundary.

@fig sd_search_rebuild | Computed illustrative copy and concurrent-change trace. The replay also includes deletes and version checks.

A **search alias** is a logical name routed to an index or set of indexes. Switching an alias can move readers to the verified new representation. Validate counts, sampled documents, permissions, analyzer outputs, and representative queries before the switch. Retain the old index briefly for rollback, while respecting deletion and data-retention rules. Capacity must hold both copies and their temporary work.

:::note A replica is not a backup
Replicas can copy an erroneous delete or schema mistake. A recoverable source, retained change log, and tested restore procedure cover a different failure class. A rebuild that has never been timed is not a dependable recovery promise.
:::

## 32. Make partial search visible

One of four shards does not answer. A response from the other three lacks one quarter of shard coverage under equal partitioning, but not necessarily one quarter of useful results. The missing shard might contain every report for the queried team. A numerical completeness fraction is therefore not a relevance guarantee.

**Partial results** contain an answer despite some required work being incomplete. A product may accept them for exploratory browse searches, with an explicit indication. A compliance export or exhaustive administrative query should usually fail rather than pretend it searched every document. Make the response contract action-specific.

@fig sd_search_partial | Illustrative missing-shard state. Three of four shards answered; result usefulness depends on the missing shard's contents.

Monitor timeout counts, failed shards, indexing lag, rejected writes, disk pressure, merge backlog, and result quality. A node process being alive does not establish that new source changes are searchable. Keep these signals connected to user effects. The interview's failure discussion should include source-to-index divergence beside machine availability.

:::warn Watch out
Silently accepting a partial response can make an incident look like a relevance regression. Preserve shard-failure metadata through the API and alert on its rate. Otherwise users see missing documents while the request-success chart remains green.
:::

:::interview Interview lens
**"How do you change an analyzer with no lost changes?"** I would build a new index from a source snapshot tied to a change-stream position. I would replay subsequent versioned changes, including deletes, until lag meets the switch requirement. Representative queries and permission tests must pass before an alias switch. The capacity plan includes both index copies and a rollback window.
:::

:::key In one breath
Indexing and querying need separate workload and overload budgets. Offset pages can collect many discarded candidates, while cursors require stable ordering and a view-lifetime policy. Rebuild from an authoritative snapshot plus replay into a new index. Expose missing shards and freshness rather than treating every response as complete.
:::

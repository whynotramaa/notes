@part VI | Shards and replicas | We split one logical collection across machines. Distribution adds coordination work and incomplete-result failure modes. We will trace shard ownership, replica copying, query scatter, and result fetches. | where:6

## 21. A shard is part of the searchable collection

Heron's illustrative million-document index occupies 750,000,000 bytes under an explicitly assumed index-to-source ratio of 1.5. Four equally sized primary shards would each hold 187,500,000 bytes. This is an arithmetic exercise; real shard balance depends on document sizes and routing, and actual index expansion must be measured.

A **shard** is a separately managed subset of a logical index. A **primary shard** accepts a routed write for its replication group. A **replica shard** is another copy of that shard's data, used for availability and potentially read capacity. Replicas duplicate a subset; they do not create additional logical partitions.

@fig sd_search_shards | Illustrative equal shard sizes from the stated index-size assumption. Real distributions must be measured.

With three total copies per primary, four primaries produce twelve shard copies and 2,250,000,000 data bytes before temporary work and metadata. The front matter's replication factor means total copies. Many engine settings instead specify the number of replicas excluding the primary. State which convention you use so storage arithmetic does not silently gain or lose a copy.

:::story Picture this
Divide a catalogue into four labelled drawers and keep copies of each drawer in another room. Dividing creates ownership boundaries. Copying protects each boundary. A request about the whole catalogue still needs one usable copy of every relevant drawer.
:::

## 22. Route writes deterministically

A write for report 7 must repeatedly reach its ownership group. **Routing** maps a document's routing value to a shard. In our tiny illustrative rule, shard equals document ID modulo 4. IDs 1, 2, 3, and 4 map to shards 1, 2, 3, and 0.

This simple rule explains determinism, not a deployed engine's routing algorithm. Changing the modulus when adding a shard changes many assignments, so resizing is a data movement operation. A tenant routing key can narrow tenant queries to fewer shards, but a large tenant can become a hot ownership group. The routing key is therefore both a query optimization and a potential skew source.

@fig sd_search_routing | Computed illustrative modulo routing. This is not a claim about Elasticsearch's internal hash.

A routed read must use the same routing context that located the write. If a custom routing value is omitted later, a point lookup can ask the wrong shard even though the document exists. A wider search might still find it and conceal the bug. Keep routing metadata with the operation and distinguish lookup scope from document identity.

The coordinating node forwards a write to the primary, which validates and replicates according to the engine's protocol. Promotion and acknowledgement rules decide what survives failures. [Elastic's replication description](https://www.elastic.co/docs/deploy-manage/distributed-architecture/reading-and-writing-documents) explains its primary-backup model and in-sync copies. The generic design lesson is to name the copies and acknowledgement boundary, not assume replication is instantaneous.

## 23. Scatter queries and merge candidates

The user asks for the best ten reports across all four shards. A **coordinating node** distributes the query to a usable copy of each relevant shard and merges their candidate results. This is often called **scatter-gather**, because work spreads outward before the answers return to one place.

Each shard can return its local best ten document IDs and scores. The coordinator merges forty candidates and keeps the global best ten. Under a consistent scoring and tie-breaking rule, any global top-ten document must be within its shard's local top ten. A document behind ten better local documents cannot enter the global top ten.

@fig sd_search_scatter | Computed illustrative candidate count is 4 times 10, or 40. Each logical shard contributes one selected copy.

Heron's assumed 1,000 search requests per second would create 4,000 shard query executions per second when every request touches all four shards. More shards can divide local work but also add dispatch, per-shard overhead, and straggler exposure. Distribution is not free parallel speedup.

:::note Deterministic ties need another key
If scores tie, use a stable secondary order within the chosen search view. Without it, paged results can repeat or skip documents even when score values look identical. A snapshot or point-in-time view also prevents ongoing writes from changing the candidate population during pagination.
:::

## 24. Fetch bodies after choosing winners

Returning every matching body from every shard wastes bandwidth. A **query phase** returns compact candidate information. A **fetch phase** retrieves stored fields or source content for the selected winners. In our example, the coordinator receives forty candidate IDs but fetches only ten final documents.

@fig sd_search_fetch | Computed illustrative query-then-fetch trace. Stored source bytes are fetched after candidate selection.

The fetch phase still needs the shard copy and search view that can resolve those candidate IDs. A failure between phases can require retry or produce an explicit partial response. Highlighting may need source text or stored offsets, so it adds work beyond candidate selection. A result's display features belong in the capacity model.

A search timeout needs a declared response policy. Returning partial results can be useful for browsing, but the response must expose incompleteness, and aggregations may be wrong. Rejecting partial results gives a stronger completeness contract but increases visible failures. Choose per product action.

:::warn Watch out
A replica shard is not another independent corpus piece. Querying every copy and merging all of them can duplicate work and results. Query one selected copy of each logical shard, unless an explicit hedging strategy races copies and deduplicates the winner.
:::

:::interview Interview lens
**"Do replicas make indexing scale linearly?"** Replicas copy each write, so they increase replicated write work. They can add read-serving choices and protect availability. Primary shards divide document ownership, while replicas duplicate those partitions. The bottleneck depends on primary work, replication, merges, and the actual query pattern.
:::

:::key In one breath
Shards divide the logical collection and replicas copy each shard. Routing decides ownership and query scope. A coordinator scatters work to relevant shard copies, merges compact candidates, and fetches final content afterward. More shards increase both parallelism and coordination cost, so measure the whole path.
:::

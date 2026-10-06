@part IX | Search engines | We run search as its own system, kept in step with the database. Elasticsearch and OpenSearch distribute Lucene's inverted indexes across machines, and the backend's job is feeding them, changing them safely and keeping queries fast. We will cover how the engine stores and distributes data, the indexing pipeline with consistency and reindexing, and query latency across shards. | where:9

## 27. Lucene, shards and segments

**Lucene**, the Java search library Doug Cutting began in 1999, implements everything in Part VIII, analyzers, inverted indexes, positions, BM25 and far more. **Elasticsearch**, released by Shay Banon in 2010, and **OpenSearch**, the Apache-licensed fork Amazon created in 2021, turn Lucene into a distributed service with a JSON API. Solr is an older sibling built on Lucene too.

An Elasticsearch **index**, a collection of documents such as Wren's `menu` index, is split into **shards**, each a complete Lucene index holding a subset of the documents, routed by a hash of the document id. Each shard has a **primary** and one or more **replicas** on other nodes. Writes go to the primary and are copied to replicas. Reads can go to any copy, so replicas add both availability and read capacity. If a node dies, a replica on another node is promoted, and the cluster rebuilds missing copies elsewhere.

@fig be_es_shards | Three primaries spread across three nodes, each with a replica somewhere else.

A **mapping** defines each field's type and analyzer, `name` as text with Wren's food analyzer plus a keyword subfield for exact filtering and sorting, `price` as an integer, `location` as a geo point, `cuisine` as a keyword for faceting. Mappings are mostly fixed once data is indexed, since changing a field's analysis means the stored terms are wrong, which is why mapping changes need the reindexing of the next section.

Inside each shard, Lucene writes data in **segments**, small immutable inverted indexes. New documents go first into an in-memory buffer. A **refresh**, every 1 s by default, turns the buffer into a new searchable segment, so a newly indexed document becomes visible to searches within about a second. That is why Elasticsearch is called near real-time rather than real-time. A **translog**, a write-ahead log, makes writes durable between the less frequent **flushes** that commit segments to disk. Segments are immutable, so deletes only mark documents as deleted, and updates are a delete plus a new document. Background **merges** combine small segments into larger ones and drop deleted documents.

@fig be_es_segments | New documents become a searchable segment at each refresh. Merges tidy small segments into big ones.

These internals explain common operational advice. A refresh interval of 1 s is expensive for bulk loads, so it is raised or disabled during a full reindex. Many updates to the same documents create many deleted entries until merges catch up. And very many small shards waste memory, since each shard has fixed overhead, which is why guidance suggests shards of roughly 10 to 50 GB.

## 28. The indexing pipeline, consistency and reindexing

The search index is a copy, not the source of truth. Menu items live in PostgreSQL, and the index must follow every change. The **indexing pipeline** is the path from one to the other, and it has the same shape as Unit VII's event-driven cache invalidation. Change data capture reads PostgreSQL's WAL, Unit VIII, and publishes each change to a `menu-events` topic. An **indexer** service consumes the topic, builds the search document for each changed item, often joining data from several tables such as the restaurant's name, location and rating, and writes it to Elasticsearch with the bulk API.

@fig be_es_pipeline | The database stays the truth. Changes flow through CDC and an indexer into the search index.

This makes search **eventually consistent** with the database. A price change commits at time 0, reaches the topic in tens of milliseconds, is indexed in a bulk request shortly after, and becomes searchable at the next refresh, so 1 to 2 s in total. Product design accepts that. Search results show prices from the index, and the menu page, opened from a result, reads the current price from the database, so a stale search result never becomes a wrong charge.

**Incremental indexing** must survive replays, reordering and failures. The indexer upserts by document id, writes the source row's version with Elasticsearch's external versioning, so an older event arriving late is rejected rather than overwriting newer data, and processes deletes as well as updates, since a dish removed from the menu must disappear from search. Unit VIII's idempotency rules apply in full.

Some changes need a full **reindex**, an analyzer change, a new field derived from all data, a mapping fix, or recovery from a pipeline bug. Reindexing a live index in place is impossible, since the old and new terms would mix. The safe pattern uses an **alias**, a name that points to a real index. Searches use the alias `menu`, which points to `menu_v7`. Wren creates `menu_v8` with the new mapping, backfills it from PostgreSQL in batches, with refresh disabled for speed, while the indexer writes every new change to both indexes. When `menu_v8` has caught up and passes checks against judged queries, one atomic alias update points `menu` at `menu_v8`. Searches switch instantly, and `menu_v7` stays for a few days as a rollback.

@fig be_es_alias | Build the new index beside the old one, then swing the alias in one atomic step.

That is Unit VI's expand and contract, applied to a search index, and it makes even large changes to search a routine operation.

## 29. Query latency across shards

A search request to an index with 10 shards is a **scatter-gather** operation. The node that receives it, the coordinator, sends the query to one copy of every shard. Each shard finds and scores its own top results, say its top 20, and returns them. The coordinator merges the 10 lists, keeps the overall top 20, and fetches the full documents for those, a second round trip to the shards that hold them.

The query is as slow as its slowest shard. If each shard answers within its own p99 latency 99% of the time, the chance that all 10 do is 0.99¹⁰ ≈ 0.904, so about 9.6% of queries wait on at least one slow shard. With 50 shards, only 0.99⁵⁰ ≈ 60.5% of queries avoid every slow shard. This is the tail at scale of Unit X in its purest form, and it is why adding shards does not always make search faster.

@fig be_es_tail | Ten shards answer in parallel, and the query waits for the slowest.

The levers are several. Fewer, larger shards reduce fan-out, within the 10 to 50 GB guidance. Replicas give the coordinator a choice, and adaptive replica selection sends each shard request to the copy that has been answering fastest. **Routing** sends a query to a single shard when the data allows, for example routing each restaurant's documents by restaurant id, so a search within one restaurant's menu touches one shard. Caches help repeated queries, the node query cache for filters and the shard request cache for whole results. And timeouts with partial results let a query return what most shards found rather than waiting for a straggler, which suits many search products.

Query shape matters as much. Filters, such as `cuisine = indian` or `is_open = true`, do not affect scoring and are cached as bitsets, so they are cheap. Leading-wildcard queries and regular expressions over large text fields are expensive, the same as in PostgreSQL. Deep pagination, asking for results 10,000 to 10,020, makes every shard rank and return 10,020 results to the coordinator, Unit V's offset problem multiplied by the shard count, so engines cap it and offer cursor-like `search_after` instead. Wren monitors search latency by query type, and the slow log records any query over 200 ms with its full body.

:::story Picture this
A head librarian with ten branch libraries. A reader's question is sent to every branch, each branch sends back its best twenty books, and the head librarian picks the overall best twenty. The reader waits for the slowest branch to reply, so the head librarian keeps a second copy of each branch's catalogue and asks whichever copy has been quickest lately.
:::

:::note Search consistency checks
Pipelines drift, through a dropped event, a bug in document building or a failed bulk request. Wren runs a nightly job that compares counts and checksums of menu items per restaurant between PostgreSQL and the index, and reindexes any restaurant that differs. Detecting drift is cheaper than explaining missing dishes to restaurants.
:::

:::warn Watch out
Writing to the database and then to the search engine in the same request is the dual-write problem of Unit VIII. A crash between the writes leaves search permanently wrong for that item. Feed the index from the database's change stream or an outbox, so every committed change reaches the index eventually.
:::

:::interview Interview lens
**"How do you keep a search index in sync with your database, and change its schema safely?"** Treat the database as the source of truth and feed the index from its change stream, CDC or an outbox, through an indexer that upserts by id with the source version so replays and reordering are harmless, handles deletes, and accepts about a second of lag from the engine's refresh. For mapping or analyzer changes, build a new index behind an alias, backfill it from the database while dual-writing new changes, verify it, swap the alias atomically and keep the old index for rollback. Run periodic consistency checks.
:::

:::key In one breath
Elasticsearch and OpenSearch distribute Lucene indexes as shards with primaries and replicas, define fields in mappings, and write immutable segments that become searchable at each 1 s refresh, with a translog for durability and merges for cleanup. The index follows the database through CDC and an indexer using external versions, so search lags by 1 to 2 s and reindexing uses an alias swap from `menu_v7` to `menu_v8`. Queries scatter to every shard and wait for the slowest, so with 10 shards 9.6% of queries hit one shard's tail, which replicas, routing, caches, sensible shard counts and avoiding deep pagination mitigate.
:::

@part I | Search basics: why LIKE fails | We begin with the document a reader wants to find. A database scan can find characters while missing the reader's meaning. We will separate matching, ranking, freshness, and access control before building the index. | where:1

## 1. A phrase in a million documents

A Heron viewer types *red bird* while looking for a match report. The service stores an illustrative million reports, each occupying 500 bytes. Reading every report examines 500,000,000 bytes before it returns any result. The reader wanted a small list, yet the machine touched the whole collection.

A **search engine** is a system that builds a representation of documents so it can retrieve and rank likely matches without reading every document for every question. It spends work when content arrives, then reuses that work across queries. That trade is attractive when the same collection receives many questions and changes less often than it is searched.

The first distinction is between a document and a result. A document is the stored content, together with identifiers and fields. A result is a document selected for this query, usually with a score and a snippet. The query does not merely ask whether bytes occur. It can ask whether words occur near one another, whether a title deserves extra weight, and whether a document is visible to this user.

@fig sd_search_scan | Illustrative corpus and candidate sizes, computed in search-numbers.py. A candidate count is a workload assumption, not a guaranteed selectivity.

A 100-document candidate set requires 50,000 document bytes before overhead, a factor of 10,000 less than the scan. This does not prove the index is always faster. A broad query may select most documents, and a cold index may cause many random reads. The mechanism removes unnecessary work when words narrow the collection.

:::story Picture this
A library's subject catalogue points you to shelves containing books about birds. You then inspect those books to decide which answers your question. The catalogue does not replace the book and does not prove that the first book is best. Search has the same separation between finding candidates and judging them.
:::

## 2. Why LIKE is a different question

Suppose a report says *systems for distributed scoring*. The SQL condition `body LIKE '%distributed systems%'` rejects it because the exact consecutive characters do not appear. Another report quoting the phrase to criticize it matches. Character containment gives no natural account of relevance, word order variants, spelling errors, or importance within a field.

A leading wildcard usually prevents an ordinary ordered text index from narrowing to a contiguous prefix range. The engine therefore needs a scan or another suitable index structure. Some databases support full-text and trigram indexes, so the honest comparison is between index capabilities, workloads, and operational needs. It is wrong to claim that SQL databases cannot search text.

A **full-text query** asks about analyzed terms and their relationships rather than raw character containment. The index might recognize *distributed* and *systems* independently, store their positions, and rank a title containing both above an unrelated body mention. The application still chooses the intended semantics. Exact phrase, all words, any word, and substring are different questions.

@fig sd_search_like | Illustrative matching trace. The final row changes the predicate, rather than pretending that phrase and term search are equivalent.

Before choosing Elasticsearch, write the query classes and required guarantees. A small catalogue with infrequent writes may work well with database full-text search. A large multilingual corpus with relevance tuning and independent query scaling may justify a separate engine. The cost is another derived copy that can lag, fail, and need rebuilding.

:::note Database search is a valid option
The boundary is a capability boundary. A relational system can maintain an inverted index too. Choose a separate engine when its query features or independent capacity solve a stated problem, and count the synchronization work that choice introduces.
:::

## 3. Matching is not ranking

Our tiny corpus contains four reports. Document 1 says *red bird scores*, document 2 says *blue bird scores*, document 3 says *red match live*, and document 4 says *bird bird match*. A query for *bird* matches documents 1, 2, and 4. The question of which comes first remains unanswered.

**Matching** is the yes-or-no decision that a document satisfies the query. **Ranking** orders the matching documents by a chosen measure of usefulness. A filter such as `visibility=public` can remove a document without contributing a relevance score. A scoring clause can contribute a number while also imposing a matching condition.

The search process first determines eligible candidates, then evaluates the score for those candidates, then retains the best results. In practice, an implementation can interleave these stages and skip work using score bounds. Keep the conceptual responsibilities distinct even when the optimized execution is less linear.

@fig sd_search_matching | Illustrative execution path. A filter removes ineligible candidates before the final response.

A relevance score is not a probability that a report is true. It is a comparison value under a particular query and corpus representation. Two queries may use different terms and have incomparable score scales. Even identical scoring formulas can differ across shards if their local term statistics differ.

:::warn Watch out
Do not fetch a page of private candidates and remove unauthorized results only after returning counts, highlights, or aggregations. Those outputs can leak the existence or content of excluded documents. Access control must constrain every visible output, including suggestions and facets.
:::

## 4. Freshness is part of correctness

A scorer changes a title from *match scheduled* to *match cancelled*. The database acknowledges the change, but search still returns the old title. Nothing in the relevance formula can repair that failure. Search has an independent **freshness** contract, the allowed delay between a source change and its searchable representation.

The sequence is source commit, change publication, index ingestion, and searchable visibility. A write acknowledgement from one stage says nothing automatically about later stages. Name the acknowledgement boundary rather than saying that a write is simply complete.

For Heron, the illustrative source publishes 20 events each second. A one-second refresh interval can collect 20 writes before a new search view opens, apart from ingestion lag. A user needing immediate confirmation should receive the committed source record or use an explicit visibility workflow. Ordinary browse searches can tolerate a bounded delay if the product states it.

@fig sd_search_freshness | Illustrative states. Source durability, indexing progress, and search visibility are separate boundaries.

:::interview Interview lens
**"Why put a search engine beside the database?"** The engine maintains query-oriented term structures and relevance features. The database remains authoritative for transactions and ownership. I would define acceptable indexing lag, version changes, and a rebuild procedure before making search a dependency of the product. A search write acknowledgement must have a named durability and visibility boundary.
:::

:::key In one breath
Search trades ingestion work and extra storage for less repeated query work. Matching selects eligible documents while ranking orders them. A substring predicate, a phrase query, and a term query answer different questions. Freshness and permission checks are correctness requirements beside relevance.
:::

@part III | The inverted index | We reverse the document-to-words relationship. Repeating scans wastes work that an ordered list can avoid. We will build posting lists, intersect them, compress them, and maintain their changes. | where:3

## 9. Build the term dictionary

Take the four reports introduced earlier. Instead of asking each report whether it contains *red*, prepare the answer once. An **inverted index** maps a term to the documents containing it. A **term dictionary** supplies the lookup structure for the distinct terms.

Walking the corpus emits twelve token occurrences. The dictionary contains `red`, `bird`, `scores`, `blue`, `match`, and `live`. For `red`, the document IDs are 1 and 3. For `bird`, they are 1, 2, and 4. The engine can now start a query for *red bird* from two narrow lists rather than from every body string.

@fig sd_search_inverted | Computed postings and positions for the illustrative four-document corpus. Repeated terms keep their occurrences.

A **posting** is an entry linking a term to a document, often carrying frequency or positions. The **posting list** collects those entries for a term in a useful order. Document identifiers are commonly sorted because sorted lists support efficient merging and compact differences. The exact storage format depends on the engine and codec.

The dictionary need not load every term into a giant hash table. Ordered dictionaries and compact prefix structures can support term lookup and prefix enumeration. The essential inversion is logical. Its physical representation should match query frequency, storage size, and access patterns.

:::story Picture this
An index at the back of a book names a topic and lists the pages containing it. That index is useful because a reader begins with the topic. A table of contents answers a different direction of travel, from a chapter to its topics. An inverted index serves the topic-first direction.
:::

## 10. Intersect lists without scanning bodies

The query requires both *red* and *bird*. The sorted lists are `[1,3]` and `[1,2,4]`. Start pointers at their first entries. Both are 1, so emit document 1 and advance both. Now compare 3 with 2. Advance the smaller value to 4. Compare 3 with 4 and advance the smaller list until it ends. The intersection is `[1]`.

**Intersection** retains IDs present in every required list. A two-pointer merge examines list entries in increasing order, giving a bound proportional to the lengths of both lists. Starting with the rarest term can reduce later candidate checks. Skip data and block bounds let optimized engines avoid examining every occurrence.

@fig sd_search_intersection | Computed intersection trace for the tiny corpus. The final candidate is document 1.

Exhausting either required list ends an intersection immediately because no later common ID can exist. Empty posting lists therefore give a cheap negative result. A deleted or unauthorized candidate can still disappear after the intersection, so a nonempty term intersection does not guarantee a visible answer. Keep those later predicates in the trace when explaining why a query returns nothing.

For an any-term query, **union** retains IDs present in at least one list. Here the union is `[1,2,3,4]`. These distinct semantics affect both candidate count and ranking. A common word can produce a long list even in an inverted index, so explain selectivity before promising constant-time search.

## 11. Frequency and compression change storage

Document 4 contains *bird* twice. Storing only membership loses that fact, while storing positions implicitly retains it. **Term frequency** counts a term's occurrences within a document. It is useful for scoring, but raw repetition should not dominate without limit.

A sorted document list `[1,2,4]` can store gaps `[1,1,2]`. **Delta encoding** stores differences between adjacent increasing values. Small differences often take fewer bytes with a variable-length integer representation. Blocks can also store packed integers and skip metadata. Compression decreases bytes read but adds decoding work.

@fig sd_search_gaps | Computed delta-encoding trace. Byte savings depend on a chosen codec, so no unmeasured compression ratio is claimed.

In a deliberately simple uncompressed occurrence representation, twelve IDs at four bytes each occupy 48 bytes, and twelve four-byte positions occupy another 48 bytes. That does not include terms, headers, document values, source text, or dictionaries. It is a bookkeeping example, not a model of a production index's footprint. Count the information stored before estimating a compression ratio.

:::note Membership, frequency, and positions
These are progressively richer representations. Membership can answer whether a term occurs. Frequency supports repetition-sensitive ranking. Positions support phrases and proximity. Store the information your queries require, and expect richer information to increase indexing and storage work.
:::

## 12. Updates create a new representation

A report changes from *red bird scores* to *red match live*. The old document ID still appears in the `bird` list unless the index represents deletion or replacement. A common segment-based design treats existing segments as immutable, marks an old document version dead, and adds the replacement in new data.

A **segment** is a separately searchable chunk of an index. Immutable segments permit readers to use a stable view while writers build new data. A **live-document mask** records which stored document versions still count as visible. Queries apply that mask so obsolete postings do not become results.

@fig sd_search_update | Illustrative update mechanism. Logical deletion and physical reclamation occur at different times.

A **merge** rewrites selected segments into fewer segments, discarding dead entries when safe. This can reduce query overhead and reclaim storage, but consumes CPU and I/O. Write throughput must account for this background work. A system that handles a short ingestion burst may still fail during sustained merge pressure.

:::warn Watch out
An index size after many updates includes obsolete versions until reclamation. Counting only current source documents underestimates disk demand. Allow room for old data, new segments, and merge output existing at the same time.
:::

:::interview Interview lens
**"How does an inverted index answer an AND query?"** It looks up each term's sorted posting list and intersects document IDs. A two-pointer merge advances the smaller current ID and emits equal IDs. It then applies live-document and permission filters and any positional conditions. The cost depends on posting lengths and the engine's skipping strategy, rather than only the number of results returned.
:::

:::key In one breath
The inverted index maps terms to ordered document entries. Posting-list intersections find all-term candidates and unions find any-term candidates. Frequencies and positions retain information beyond membership. Immutable segments, live-document masks, and merges separate search visibility from physical reclamation.
:::

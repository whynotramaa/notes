@part II | Pagination, filtering and sorting | We return useful slices without letting one read scan unlimited work. Concurrent inserts make page numbers less stable than they look. We will trace offsets, cursors, filters, sorting, and snapshot choices. | where:2

## 5. Pagination bounds the result, not automatically the work

A viewer opens the event history of a long-running match. Returning the entire history would create an unbounded response and make latency depend on how old the match is. **Pagination** divides the result into bounded pieces, with a contract for how the caller requests the next piece. That contract needs ordering, continuation, and behavior when the underlying data changes.

A page size limits returned records. It does not automatically limit rows scanned, shards queried, bytes sorted, or permission checks. Heron can inspect 10,000 candidate rows and return 20 if a selective filter has no useful index. The illustrative candidate-to-result ratio is 500, computed as 10,000 divided by 20.

@fig sd_api_page_work | Illustrative read amplification. A small page does not prove a small query.

### What the caller needs to know

A response can contain results, a continuation token, and whether the result reflects a snapshot or a live walk. A total count is another query and can be expensive or quickly stale. Return it only when the product needs its meaning and the implementation can supply that meaning.

The page contract should cap caller-selected sizes and expensive filter combinations. Reject unsuitable requests rather than silently permitting one API consumer to consume the whole query budget. Pagination is a capacity boundary only when the underlying access path is also bounded.

## 6. Offset pagination counts positions in a changing list

**Offset pagination** says to skip a number of ordered records and return the next page. It is easy for a user interface to express as a page number, but the position is relative to the list as observed by that request. When new records appear before that position, the same offset refers to a different slice.

Take illustrative event IDs `[9, 8, 7, 6, 5, 4]` in descending sequence order and a page size of three. The first request returns `[9, 8, 7]`. Before the second request, event 10 arrives, making the list `[10, 9, 8, 7, 6, 5, 4]`. Skipping three now returns `[7, 6, 5]`, repeating event 7 across pages.

@fig sd_api_offset_shift | Illustrative insert between two offset requests. The page boundary moved because the list changed.

### Depth can add scan work

A larger example requests page index 50 with 20 records per page. Its offset is 1,000, computed as 50 times 20. An engine may need to traverse or produce skipped records before returning the page, depending on the plan. Do not promise constant-time deep paging merely because the response still has 20 rows.

Offset paging can be reasonable for small stable lists, administrative interfaces, or a query pinned to a suitable snapshot. The correct comparison is its observed cost and mutation behavior, not a categorical ban on the word offset. State when the list is stable enough and when a jump-to-page requirement justifies it.

## 7. Cursor pagination continues after a key

A viewer wants the next older events without repeating a newly displaced row. **Cursor pagination**, often implemented as keyset pagination, describes continuation relative to an ordered key rather than a number of positions. The cursor records a boundary the caller already observed. The next query uses a key comparison consistent with the same ordering.

For the preceding example, the last observed sequence is 7. Query records with sequence less than 7, in descending order, limited to three. After event 10 arrives, the continuation still returns `[6, 5, 4]`. The inserted newer event is above the boundary rather than shifting a positional skip.

@fig sd_api_cursor_next | Illustrative key continuation. The inserted newer record does not change the next older slice.

### A cursor needs all ordering fields

Timestamps can tie, so creation time alone is often insufficient. Heron can sort by `(created_at, event_id)` and include both in the continuation boundary. In an illustrative list `(100,12), (100,11), (99,10), (99,9)`, a two-record first page ends at `(100,11)`. The next descending page compares complete tuples below that boundary and returns `(99,10)` and `(99,9)`.

@fig sd_api_cursor_ties | Illustrative tied times with a unique secondary key. The comparison uses the complete ordered tuple.

@fig sd_api_cursor_predicate | Illustrative tuple predicate. The equality branch handles tied times without omitting the secondary key.

An opaque cursor can carry that tuple, filter identity, and an optional snapshot boundary. Signing it can stop unauthorized alteration, but signing is not encryption. Do not put private data in a token merely because the API calls it opaque. Validate the cursor's scope and compatibility when it comes back.

## 8. Filtering and sorting choose the physical query

A viewer requests recent published clips for one match. **Filtering** selects records that satisfy predicates; **sorting** defines their order. A useful access path can combine an equality scope with an ordered continuation, such as match identifier followed by creation position and unique ID. An API that permits any filter and any sort promises far more physical work than one bounded query.

The order also affects cursor semantics. If a user changes the sort from newest to most popular, an old newest-order cursor cannot be reused meaningfully. Ranking fields that change between requests can move records across the boundary even without new inserts. Tie breakers prevent ambiguous equal-key order but do not freeze mutable ranking values.

@fig sd_api_filter_order | Scope, order, and continuation jointly define one access pattern. Different combinations can need different indexes.

### Bound the supported combinations

Publish a deliberate query grammar rather than passing arbitrary client strings into a database expression. Validate field names, directions, operator types, and maximum scope. Limit candidates or execution budget at the server as well as returned page size. An unsupported combination should produce a useful rejection rather than a surprise scan.

For Heron, an ordinary event history can use immutable sequence order. A discovery feed ranked by changing popularity has a different contract and may use a cached ranked list or a snapshot token. The result's product meaning determines whether live mutation is acceptable.

## 9. Snapshot paging versus a live walk

A user exports a report and expects every qualifying event exactly once. A live sequence walk is not always enough when records can be edited, deleted, or change filter membership during the walk. A **snapshot** is a defined observation boundary for the dataset, so all pages can interpret a consistent state or logical version.

A database snapshot can require keeping a transaction or version history alive, which consumes resources and constrains cleanup. A server can instead materialize a bounded export job, record its input boundary, and let the client download the completed result. That adds storage and delayed completion, but makes the report's meaning explicit.

@fig sd_api_snapshot | Snapshot and live paging answer different product questions. A cursor alone does not freeze mutable data.

### Choose the allowed omissions and duplicates

A viewer browsing a live event feed may accept new events appearing only after a refresh. An audit export cannot silently skip changes because its page boundary moved. State whether the walk is over immutable append-only events, current mutable records, or a pinned snapshot. The word cursor does not settle that choice.

For the illustrative 1,000-record stable result and 20-record page, there are 50 nominal pages. The arithmetic is simple; the difficult contract is whether '1,000 records' remains the same set during all 50 requests. Use the observation promise to choose the storage and continuation policy.

:::story Picture this
A page number in a printed book points to a fixed page. A position in a constantly rearranged queue does not. A cursor names the last item you saw; a snapshot freezes which edition of the book you are reading.
:::

:::note Total count has its own meaning
A count observed before the first page can differ from the live list observed later. If the interface needs a stable count, tie it to the same snapshot or clearly label the count's observation boundary.
:::

:::warn Watch out
A cursor based only on a non-unique timestamp can omit or repeat tied records. Include a deterministic unique tie breaker and use its complete tuple in both ordering and continuation.
:::

:::interview Interview lens
**"Why use a cursor instead of an offset?"** A stable ordered-key boundary avoids some positional shifts and can let an index seek directly to the next slice. It still needs a unique order, a bounded filter path, and a policy for mutable data. For an audit export I would also define a snapshot boundary rather than claiming a cursor alone gives a consistent report.
:::

:::key In one breath
Pagination bounds returned records, while access paths bound query work. Offsets count positions and can shift under mutation. Cursors continue from complete ordered keys, including tie breakers. Snapshot choice, filters, and mutable ranking determine what the whole walk actually promises.
:::

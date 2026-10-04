@part III | Query execution and joins | We follow the database's physical work after SQL describes the desired result. Similar statements can examine very different numbers of rows. We will read a plan and execute the three common join mechanisms on the same tiny input. | where:3

## 10. A plan turns a question into operators

A query asks for recent events with scorer names. SQL says what the result should contain, but does not dictate which table to read first. A **query plan** is the engine's chosen arrangement of physical operators such as scans, filters, joins, and sorts. The optimizer compares candidate costs using estimates and available access paths.

**Cardinality** is the number of rows an operator produces. **Selectivity** is the fraction of an input satisfying a condition. If an illustrative filter returns 10 rows from 10,000, selectivity is $10/10,000=0.001$, or 0.1%. That estimate can make an indexed lookup look attractive; a broad filter can favor scanning instead.

The engine uses collected statistics rather than discovering the exact result of every possible plan before choosing. Imagine an estimate of 10 qualifying rows when the actual count is 1,000. The row estimate is wrong by a factor of 100. Repeated inner lookups, memory for a hash table, and sort capacity can all be misjudged as a result.

@fig sd_databases_plan | Illustrative estimated and actual cardinality. The mismatch can change the best join or scan, not merely its displayed cost.

Use `EXPLAIN` to see the planned work. In PostgreSQL, `EXPLAIN ANALYZE` executes the statement to collect actual measurements, so a modifying statement changes data unless contained and handled appropriately. Compare rows, loops, buffers, and spilled work. A reported average of five inner rows over 100 loops means 500 rows emitted across those loops, not five in total.

An engine cost is a planning scale, not a duration promised in milliseconds. [PostgreSQL's EXPLAIN guide](https://www.postgresql.org/docs/18/using-explain.html) explains those units and actual execution fields. Inspect the request's full wait as well: a plan can be efficient while its connection acquisition is slow.

:::note Correlated columns confuse simple estimates
Match identity and event sequence are not necessarily independent. A young match may have no high sequences. Statistics that model correlations can improve estimates, but a useful estimate still depends on relevant, sufficiently current data.
:::

## 11. Sequential, index, and bitmap scans

A match filter that returns nearly every event does not benefit much from a lookup structure that then fetches nearly every base row. A **sequential scan** reads table pages and tests rows. An **index scan** searches entries and follows matching row locations. The cheaper choice depends on qualifying work and locality.

For an illustrative table with 10,000 rows packed into 100 pages, a full sequential scan visits those 100 pages. A selective lookup returning 10 rows, with a three-page descent and each result on a different base page, touches at most 13 pages in our simplified count. Cached pages and repeated page locations can reduce physical reads.

Now let 8,000 rows qualify. Charging one independent base-page visit per result gives an intentionally loose upper bound of $3+8,000=8,003$ logical visits. The table still contains only 100 distinct pages. Revisited and cached pages make the exact count lower, but the example shows why a broad index path is not automatically attractive.

@fig sd_databases_scans | Illustrative page accounting. Distinct pages, logical visits, and physical reads are different counts.

A **bitmap scan** can first collect matching row locations, group them by table page, and visit pages in a useful order. It trades construction work and memory for less scattered access. It may lose the index's useful result order, requiring a later sort. The mechanism matters more than treating scan names as a speed ranking.

Choose with a real filter, selected columns, ordering requirement, and buffer state. Cold random I/O, warm memory access, and broad sequential reads have different costs. A query that returns many rows also spends CPU and network bandwidth formatting and delivering them after the scan finishes.

## 12. Nested loops repeat an inner search

We want event identifiers beside current scorer names. A **join** combines rows satisfying a stated relationship. A **nested-loop join** takes an outer row and searches the inner input for matches, then repeats for the next outer row. It is simple enough to execute with a finger on our tiny tables.

Use outer scorer identifiers `[u4, u8, u4, u9]` and inner users `[u4:Asha, u8:Bo, u9:Chen]`. A deliberately full inner scan compares each of four events with all three users. That is $4\times3=12$ equality tests. Matching identifiers emit `e1:Asha`, `e2:Bo`, `e3:Asha`, and `e4:Chen`, four result rows.

An inner primary-key index changes the mechanism. Each outer event makes one indexed lookup for its scorer, giving four probes instead of twelve full-scan comparisons. A probe still has tree and visibility costs. Repeated scorers can also benefit from engine-specific reuse of earlier lookup results.

| Outer event | Lookup key | Found user | Emitted row |
|---|---|---|---|
| e1 | u4 | Asha | e1, Asha |
| e2 | u8 | Bo | e2, Bo |
| e3 | u4 | Asha | e3, Asha |
| e4 | u9 | Chen | e4, Chen |

@fig sd_databases_nested | Illustrative outer loop and indexed inner lookup. A small outer input can make repeated probes cheaper than building another structure.

Nested loops fit selective outer results and cheap indexed inner access. They become costly when a underestimated outer input runs an expensive inner operation repeatedly. Ask how many loops occur, what each probe reads, and whether several inner matches multiply the output.

:::interview Interview lens
**"Is a nested-loop join always bad?"** No. A small outer result with an indexed inner key can be an efficient path. I count the outer rows and the work per inner lookup. I worry when a mistaken row estimate creates many repeated expensive probes.
:::

## 13. Hash joins build once and probe many times

The outer input is no longer tiny, and repeating tree searches costs too much. A **hash join** builds a lookup table from one input's join key, then probes it using the other input. Equal keys are candidates for a match, and the engine still checks the actual equality condition.

Build a table from the three users: `u4 -> Asha`, `u8 -> Bo`, and `u9 -> Chen`. Then probe for the four event scorer identifiers. This toy execution uses three build inserts and four probes, seven principal hash-table operations, and emits the same four rows as the nested loop. The count excludes hash collisions, allocation, and output formatting.

If the build key is not unique, one key maps to a collection of rows. A probe must emit every valid matching pair; it cannot silently keep only the final inserted row. Duplicates can make the output far larger than either input, regardless of how cheaply the lookup table was built.

@fig sd_databases_hash_join | Illustrative three-row build and four-row probe. Repeated u4 probes reuse the same built entry.

The build table must fit its assigned memory to stay wholly in memory. Otherwise an engine can partition work into temporary storage and process partitions in stages. That adds I/O and changes latency. The smaller useful build input often helps, but key width and payload columns also affect memory.

A hash join normally serves equality relationships. A comparison such as "event time falls inside an interval" needs a different strategy or additional predicates. Compare actual memory, spills, input rows, and the relationship rather than assuming hashing is the universal replacement for nested loops.

## 14. Merge joins use order instead of a hash table

Both inputs already have useful scorer-key order. A **merge join** advances pointers through sorted inputs, comparing their current keys. If one key is lower, that side advances; equal keys emit matches. The order prevents repeatedly searching rows that have already been passed.

Sort the event side as `[u4:e1, u4:e3, u8:e2, u9:e4]` and the user side as `[u4:Asha, u8:Bo, u9:Chen]`. Compare u4 with u4 and emit e1, then the next u4 with u4 and emit e3. Compare u8 with the current u4, advance users, compare equal u8 keys and emit e2. Repeat that advance-and-match for u9, emitting e4.

This specific unique-inner trace makes six current-key comparisons. It is not a universal merge-join operation count. With duplicates on both sides, the engine must preserve a matching group and generate the appropriate pairs before advancing beyond it. Nulls and outer-join rules also affect which rows are returned.

@fig sd_databases_merge_join | Illustrative sorted-pointer trace. The user pointer stays on u4 while both matching events are emitted.

Existing index order can save a sort. If neither input is ordered, sorting has a cost in comparisons, memory, and possibly temporary I/O. A merge plan can still win for large useful streams, but the total includes making those streams ordered. The operator name alone does not reveal the total work.

:::warn Watch out
Returning one row per outer record is only valid when the inner relationship is unique. Joining events to multiple matching memberships can duplicate event rows. Define the intended result before interpreting a larger row count as a performance bug.
:::

:::key In one breath
A plan chooses physical operators using estimated cardinalities and costs. Scans trade broad sequential work against selected lookups and grouped page access. Nested loops repeat searches, hash joins build and probe, and merge joins advance ordered inputs. Execute a tiny trace and count loops, rows, memory, and page work before naming a preferred operator.
:::

@part VI | Query execution and optimization | SQL leaves the physical route to the engine. A query can be logically correct and still visit far more rows or pages than its result requires. We will follow parsing and execution, compare join algorithms, estimate cardinality and diagnose plans with evidence. | where:6

## 30. Parse, bind, rewrite, plan and execute

Heron asks for a customer's bookings by email. The engine cannot search a tree until it knows which table owns `email`, what the literal's type is and which relationship joins the customer to bookings. Planning begins with the query's meaning.

**Parsing** turns tokens into a syntax tree. **Semantic analysis**, or binding, resolves names, scopes, types and permissions. **Query rewriting** expands or transforms expressions while preserving meaning, such as exposing a view's underlying query. A **query plan** is a physical operator tree specifying scans, joins, sorts and result construction. Optimization chooses among candidate plans; execution runs the chosen tree.

@fig dbms_executor | A conceptual lifecycle. An engine may combine stages or cache prior work, but it must still establish the query's meaning before producing its results.

A sequential scan visits table pages and tests rows. An index scan navigates candidate index entries and fetches rows. An index-only scan obtains required data from index entries when coverage and visibility permit. A bitmap-style path can collect candidate row locations before visiting heap pages in a more organized order. Selectivity and locality determine which path saves work.

An **iterator execution model** asks child operators for their next tuple: a join requests inputs, a filter tests them, and the projection computes outputs. Other engines process batches or compile specialized code. **Pipelining** passes outputs onward without materializing the complete intermediate result. A sort or a hash-table build may need to consume substantial input before producing its first output, so it can be a blocking stage.

Do not equate written SQL order with operator order. A selective customer lookup can precede joining to bookings even if the query lists tables differently. Outer joins, volatile expressions and semantic dependencies restrict legal transformations. The optimizer is free to reorder only when the result's meaning is preserved.

:::note A prepared statement
Preparing can save repeated parse and plan work, but parameter-sensitive data distributions can make one shared plan unsuitable for all values. Reusing a plan is an optimization choice with a workload-dependent cost.
:::

### One email lookup through the stages

Consider `SELECT b.id FROM users u JOIN bookings b ON b.user_id = u.id WHERE u.email = :email`. Parsing recognizes the selected expression, join and predicate. Binding proves that u.email belongs to users, that b.user_id is compatible with u.id, and that b.id is the requested booking identity. A nonexistent column is a semantic error before any successful data result can be returned.

The logical request joins customers to bookings and filters the customer email. A valid transformation filters users first, because this inner-join predicate refers only to users. If email is unique, at most one customer remains. The planner can then choose a user-email index followed by booking-user lookups, rather than producing the full join and filtering it afterwards.

The executor asks the user scan for a qualifying row, passes its id into the booking access path and projects each resulting booking id. It can return Ada's first booking before consuming unrelated bookings. If ORDER BY requires a sort, the first returned row may instead wait for the operator to gather and order its input. The physical plan explains both total work and when output can begin.

## 31. Nested-loop, hash and sort-merge joins

Joining Heron's 100 users to 160 bookings by testing every possible pair requires $100\times160=16000$ comparisons. Yet the output has one customer match per booking. A physical join algorithm should exploit the equality relation rather than do unnecessary pair tests.

A **nested-loop join** takes an outer row and scans or looks up matches in the inner input, repeating for each outer row. Without an access path, work can be $O(NM)$ for input row counts N and M. Read this as "work grows with the product of input sizes." With an indexed inner key and a small selective outer input, repeated lookups can be a good plan; the product bound no longer describes those indexed operations.

A **hash join** builds a hash table from one input and probes it with the other on an equality key. In a simplified in-memory model, Heron has 100 build visits and 160 probe visits, totaling 260 input visits. This omits output work, hash collisions and allocation; it does not claim 260 CPU instructions. If the build side exceeds memory, partitioning and spilling introduce extra I/O. Highly repeated join keys can still produce a large output.

@fig dbms_join_algorithms | Illustrative work comparison. Input visits and pair comparisons are different units, so the figure is a mechanism comparison rather than a benchmark speedup.

A **sort-merge join** consumes inputs ordered by join keys. It advances the smaller key until keys match, then emits the matching groups' combinations. The merge work is linear in input traversal plus output, but sorting unsorted inputs adds roughly $O(N\log N+M\log M)$. Existing compatible index order can remove that sorting cost. Duplicate groups require care because a match can be many-to-many.

| Algorithm | Useful situation | Main snag |
|---|---|---|
| Nested loop | Small outer side, indexed inner matches | Repeated expensive inner work |
| Hash join | Large equality join, useful build fit | Spill, skew, memory use |
| Sort-merge | Ordered large inputs | Sorting and duplicate groups |

A join's output can dominate all three algorithms. If every user legitimately matches every booking, 16,000 output rows are unavoidable. Distinguish avoiding needless tests from avoiding required results.

:::interview Interview lens
**"When is a nested-loop join good?"** When few outer rows drive cheap indexed inner lookups, it can avoid scanning or building a large other input. It becomes poor when the inner work repeats many times over a large outer relation. I would inspect actual outer rows, loops, the inner access path and output multiplicity before judging the operator name.
:::

### Build and probe the actual relationship

In a hash join with users on the build side, hash each user id and store the corresponding customer record in its bucket. Then visit a booking, hash its user_id, inspect the bucket and compare actual ids to resolve collisions. Ada's two bookings both match Ada's same user record, so both output pairs are emitted. Cy can be in the build table yet produce no pair in an inner join.

This trace explains the simplified 260 input visits: each of the 100 users enters the build once and each of the 160 bookings enters the probe once. It does not count the hash instructions, output copying or collision comparisons, and it assumes the necessary state fits in memory. A speed claim comparing it with 16,000 pair tests would need a real benchmark because those units represent different amounts of work.

For sort-merge, keep the user and booking inputs ordered by the common key. When the user key is smaller, advance users; when the booking key is smaller, advance bookings. At an equal key, emit the matching group, including all of Ada's bookings. When both sides have repeated keys, the algorithm must emit each legal pair in the equal-key groups, not just zip their rows together.

## 32. Statistics, selectivity and join ordering

The planner predicts 16 available seats but execution returns 80. A plan based on a tiny outer result can repeat inner work far more often than expected. The mistaken row estimate can cause the expensive access pattern even when every index is valid.

**Selectivity** is the fraction of input rows passing a predicate. **Cardinality estimation** predicts how many rows an operator produces. For input size N and estimated selectivity s, $\hat N=N\times s$. Read this as "estimated output is input count times the estimated passing fraction." In the illustrative case, $800\times0.02=16$, while the observed 80 rows give an error factor of $80/16=5$.

@fig dbms_estimation | Illustrative planned and observed counts. This is not fabricated PostgreSQL output; it is a calculation showing how an estimate can be wrong.

Statistics summarize distributions. A **histogram** stores bucket boundaries or frequencies over value ranges. Most-common-value statistics capture skew that uniform assumptions miss. Distinct-count estimates help predict grouping and join outputs. Correlated columns break an independence assumption: show identity and seat state may not have independent distributions. PostgreSQL offers [extended statistics](https://www.postgresql.org/docs/18/planner-stats.html) for suitable cases.

A **cost-based optimizer** estimates candidate plans' resource work and chooses a favourable cost. Cost is a model unit, not necessarily elapsed milliseconds. Join order matters because intermediate sizes determine later work. Join a highly selective input early when legal, and the remaining joins may have much less to process. Searching every possible order becomes expensive as the number of relations grows, so optimizers prune or approximate the search.

Statistics age as data changes. A freshly populated or highly skewed table can make a cached assumption poor. Better statistics can change the plan without adding an index. Conversely, accurate estimates do not remove a fundamentally large required output or a badly specified query.

### An estimate can be internally consistent and still wrong

The assumed selectivity 0.02 produces 16 predicted rows out of 800. That arithmetic is correct under the assumption. If observation gives 80, the data distribution or predicate model was wrong. Dividing actual by estimated count gives a factor of 5, so a repeated inner lookup driven by that node may execute five times the predicted number of outer iterations.

Histograms handle ranges by summarizing value intervals, while common-value frequencies help with a hot category. Neither automatically understands that one show's free seats differ from another show's free seats. Assuming independent predicates multiplies their estimated fractions; correlations can make that multiplication wrong in either direction.

A plan can also choose a correct row estimate yet suffer from memory limits or concurrent resource pressure. Cardinality is one input to cost, not the whole explanation of latency. Compare counts first because they propagate through many operator decisions, then inspect the resource that actually became expensive.

## 33. Reading EXPLAIN and investigating a slow query

A query takes longer under load than in an empty development database. Saying "add an index" skips whether it is reading pages, spilling a sort, waiting on a lock or simply returning too much data. Begin with an exact query and representative parameters.

`EXPLAIN` displays the selected plan and its estimates. `EXPLAIN ANALYZE` executes the statement and attaches measured operator data. With PostgreSQL, `BUFFERS` adds buffer-use evidence. Inspect estimated versus actual row counts, repeated loops, filters that discard many rows, temporary work and time-consuming branches. A parent usually includes its children's work; summing every node time can double-count the same elapsed interval. The [EXPLAIN guide](https://www.postgresql.org/docs/18/using-explain.html) documents the output conventions.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, SUM(price)
FROM bookings
WHERE status = 'paid'
GROUP BY user_id;
```

@fig dbms_plan_diagnosis | A diagnosis loop connects the plan to measured row counts and resource waits, then tests one concrete change.

A sequential scan can be correct when the query needs much of a small table. An index can lose when it fetches most rows through scattered heap accesses. A mismatched expression, type cast or collation can prevent the intended index condition. Large `OFFSET`, a correlated subquery with repeated work, and a join at the wrong grain can all waste effort without a missing index.

Reproduce the symptom, inspect the plan, check fresh statistics and wait evidence, then change the actual cause. Measure again under comparable data and cache conditions. Warm and cold runs answer different questions. A cached application result is different from a warm database page cache.

### Read repeated work in a plan

Suppose a nested-loop inner scan returns one match each time it runs. A displayed row count of one can look cheap until you inspect how many outer rows invoked it. Multiplying rows per loop by loops tells you how many result rows that node produced across those invocations. If a filter rejects most visited rows, the returned-row count alone can understate traversal work.

A buffer hit means the database found the page in its own buffer cache. A buffer read means it requested the page from the lower layer; that does not necessarily establish an uncached device read because the operating system may cache it. Temporary reads and writes can indicate spilling work, while a long lock wait may be visible in separate session and wait diagnostics rather than as a large row count.

For a suspect index, inspect the index condition separately from a later filter. A condition handled only by a filter may still require broad index traversal. Try the measured query with representative selective and non-selective parameter values, because a plan suitable for Ada's two bookings may not suit a customer whose history dominates the table.

:::warn Watch out
EXPLAIN ANALYZE executes writes too. Use a safe test environment or an appropriate rollback transaction when examining modification statements, remembering that some external side effects or sequence increments are not undone. Diagnostic output can add overhead, so it is evidence about work rather than a perfect production latency measurement.
:::

:::story Picture this
A route planner predicts a short queue at a bridge and sends traffic there. If the bridge queue is much longer than its statistics say, changing the road map does not fix the prediction. First compare predicted traffic with what actually passed through.
:::

:::key In one breath
The engine establishes SQL meaning, chooses physical operators and runs them over storage. Join algorithms trade repeated lookup, memory build and ordering work, with required output size common to all. Statistics turn predicates into row estimates, and those estimates drive access paths and join order. EXPLAIN gives the plan; measured rows, loops, buffers and waits identify the cause worth changing.
:::

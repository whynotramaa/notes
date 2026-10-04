@part III | Relational algebra and SQL | A query states which facts you want rather than prescribing each disk read. Ambiguous duplicates, missing values and misplaced filters can still make a syntactically valid query wrong. We will build algebra, basic SQL, aggregation, joins, subqueries, CTEs and window functions on one small fixture. | where:3

## 7. Relational algebra, including division

You want the customers who booked every show in a selected festival. Counting arbitrary bookings does not answer that question: a customer can book the same show repeatedly while missing another. Algebra makes the requested set explicit before SQL chooses its syntax.

**Relational algebra** is a set of operators that take relations and produce relations. **Selection** keeps tuples satisfying a predicate, roughly SQL's `WHERE`. **Projection** keeps attributes, roughly `SELECT` columns, but mathematical projection removes duplicate tuples. **Union**, **intersection** and **difference** combine union-compatible relations: their attributes have compatible positions and domains. SQL expresses them with `UNION`, `INTERSECT` and `EXCEPT`; `UNION ALL` deliberately preserves duplicates.

The **Cartesian product** combines every tuple of one relation with every tuple of another. A **rename** gives attributes or relations unambiguous names. A **join** selects matching combinations, often by a foreign-key relationship. An equijoin uses equality; a natural join infers equal-name attributes, which makes schema changes capable of changing its meaning.

@fig dbms_algebra | The operators act on sets in relational theory. SQL's duplicate and NULL rules require separate attention.

**Division** answers "for all". Let $R(customer,show)$ be attended pairs and $S(show)$ the required shows. The relation $R \div S$ contains customers paired with every show in $S$. Read this as "divide the attended pairs by the required shows to find customers who cover all of them." One SQL form tests that no required show is missing:

```sql
SELECT u.id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM required_shows s
  WHERE NOT EXISTS (
    SELECT 1 FROM attendance a
    WHERE a.user_id = u.id AND a.show_id = s.id
  )
);
```

This SQL states universal coverage over all users. Literal algebraic division takes candidates from the dividend R; to match that exact candidate domain, start from distinct customer identifiers in attendance instead. With an empty required set, every candidate in the chosen domain qualifies, so our all-users formulation also returns customers with no attendance. The difference is the candidate relation, not a failure of the universal condition. E. F. Codd's relational work separated logical data operations from physical access; the [original relational-model paper](https://dl.acm.org/doi/10.1145/362384.362685) is the historical source.

### A small algebra trace

Use the fixture with Ada's two bookings and Bo's one booking. Selecting `price >= 100` keeps Ada's two tuples. Projecting only `user_id` under mathematical set semantics yields one Ada identifier, because projection removes the duplicate. SQL's `SELECT user_id ...` yields Ada twice unless DISTINCT is requested. The input predicate is identical; the result multiplicity differs because the models use different duplicate rules.

Union and difference also need compatible relation shapes. You can union customer identifiers from current and archived bookings if their corresponding identifier domains agree. You cannot meaningfully union a customer identifier with a booking price simply because both happen to use integers in one implementation.

For division, imagine required shows `morning` and `evening`. Ada attended both, while Bo attended only evening. The outer candidate Ada has no required show for which her matching attendance is absent, so the double NOT EXISTS succeeds. Bo has a missing morning match, so the outer NOT EXISTS fails. This reads the universal question mechanically: find no counterexample to complete coverage.

## 8. Basic querying and three-valued logic

Ask for the most expensive bookings, then rerun the query after inserting another booking with the same price. Without a complete ordering, page membership can change between runs. SQL correctness includes ordering and missing-value behaviour, not just selecting the right columns.

`SELECT` computes outputs and aliases name them. `WHERE` keeps qualifying input rows. `DISTINCT` removes duplicate outputs. `ORDER BY` chooses a result order; `LIMIT` and `OFFSET` choose a slice in dialects that support them. Use a stable tie-breaker such as `ORDER BY price DESC, id` for pagination. Large offsets can require examining and discarding many rows; keyset pagination starts after the last ordered key instead.

```sql
SELECT id, COALESCE(price, 0) AS display_price,
       CASE WHEN price >= 100 THEN 'high' ELSE 'low' END AS band
FROM bookings
WHERE price BETWEEN 80 AND 120
ORDER BY price DESC, id
LIMIT 2 OFFSET 0;
```

For the illustrative fixture this returns the two 120-unit bookings. **COALESCE** returns its first non-null argument, and **CASE** selects a result from conditions. A display default does not prove that a missing price really means zero. `BETWEEN` includes both endpoints. `LIKE` matches patterns with `%` for a sequence and `_` for one character, with escaping and case rules depending on the dialect. `IN` tests membership, but a NULL in its input affects an unmatched comparison.

@fig dbms_sql_order | Logical query order explains scope and filtering. The optimizer may choose a different physical order while preserving the query's meaning.

TRUE, FALSE and UNKNOWN form SQL's three-valued logic. `NULL = NULL` is UNKNOWN, whereas `NULL IS NULL` is TRUE. `NOT UNKNOWN` stays UNKNOWN. Treating UNKNOWN as FALSE inside every expression is wrong even though `WHERE` discards both. Bind user values as parameters; string concatenation can turn data into executable SQL.

:::warn Watch out
A selected alias is not generally available to `WHERE`, because the logical selection comes later. A nullable boolean expression needs deliberate handling. `ORDER BY price` does not determine the order between equal prices.
:::

### Trace the query rather than reading it top to bottom

The FROM clause supplies the three fixture bookings. The price predicate keeps all of them because both endpoints of BETWEEN are included. The selected expression turns each price into a displayed value and a band: the two 120-unit rows are high, and the 80-unit row is low. ORDER BY puts the expensive rows first and breaks their tie with id. LIMIT keeps the first two. OFFSET zero discards none.

CASE chooses the first condition that is TRUE. If price is NULL, `price >= 100` is UNKNOWN rather than TRUE, so this example falls through to low. That may be a bad domain classification. Add an explicit `WHEN price IS NULL THEN 'unknown'` if missingness is a distinct state; COALESCE in another selected expression does not change CASE's input automatically.

For a date or timestamp range, BETWEEN's inclusive upper endpoint can also surprise you. A half-open predicate `created_at >= :start AND created_at < :next_start` often states the intended reporting interval more precisely. Decide the boundary in the domain, then spell the predicate that implements it. No keyword can decide whether midnight belongs to the current report or the next one.

## 9. Aggregation, GROUP BY and HAVING

Ada has two bookings, priced at 120 each. Bo has one priced at 80. You want customers whose booked total is at least 200. Filtering individual prices cannot express that condition, because the total exists only after the rows are grouped.

An **aggregate** combines several input rows into a result. `COUNT(*)` counts rows; `COUNT(column)` counts non-null values. `SUM`, `AVG`, `MIN` and `MAX` ignore NULL input values. Apart from `COUNT`, these aggregates normally return NULL over no input rows. **GROUP BY** partitions inputs by the grouping expressions; **HAVING** filters the resulting groups.

```sql
SELECT user_id, COUNT(*) AS bookings, SUM(price) AS total
FROM bookings
WHERE status = 'paid'
GROUP BY user_id
HAVING SUM(price) >= 200;
```

On the fixture, with all printed bookings paid, Ada's group has count 2 and sum 240. Bo's group has count 1 and sum 80. The `HAVING` condition returns Ada alone. There is no Cy group because Cy has no booking rows. To include customers with zero bookings, start from `users`, left join bookings, and count a non-null booking key rather than `COUNT(*)`.

@fig dbms_aggregate | Illustrative fixture. The three booking prices total 320, and grouping gives Ada 240 and Bo 80.

Read the accounting formula $T_u = \sum_{b:\,b.user=u} price_b$ as "customer $u$'s total is the sum of the prices of bookings owned by that customer." The sum ranges over that customer's rows. SQL's result for an empty group may need `COALESCE` when the domain intends zero.

A join can multiply input rows before aggregation. Joining bookings to their items and then summing booking-level totals counts one total per item, not per booking. Group at the correct grain, or aggregate the child relation before joining it. This is a common report bug because every individual value looks plausible.

:::interview Interview lens
**"WHERE versus HAVING?"** WHERE filters rows before grouping; HAVING filters groups after aggregation. To find paid customers whose total exceeds a threshold, filter paid rows in WHERE and their sums in HAVING. A HAVING condition that only uses grouping columns may be pushed down by the optimizer when doing so preserves meaning.
:::

### Empty inputs and the row being counted

Start instead from every customer and left join bookings. Ada produces two matched rows, Bo one, and Cy one NULL-extended row. `COUNT(*)` gives Cy a count of one because the joined result contains a row for Cy. `COUNT(b.id)` gives zero because no non-null booking identity exists on that row. This is why the counted expression must match the question, rather than being chosen as a typing habit.

If the fixture prices are the input, SUM gives 320 and AVG gives $320/3$ currency units. Read the average as "the total price divided by the count of present prices." A NULL price would be excluded from both that aggregate's sum and its denominator. It would still contribute to COUNT(*). Treating the missing price as zero with COALESCE changes the denominator and therefore changes the question.

GROUP BY also treats NULL grouping values as one group for grouping purposes. That does not make `NULL = NULL` true in ordinary comparisons. Different operations have specified missing-value semantics; a rule remembered from WHERE should not be applied automatically to grouping, uniqueness or ordering.

## 10. Joins, semi joins and anti joins

Cy has no booking. An inner join removes Cy; a left join preserves Cy and fills the unmatched booking columns with NULL. These are different questions, not faster and slower versions of the same query.

An **inner join** returns matching combinations. A **left outer join** also preserves unmatched left rows; a **right outer join** preserves the right side; a **full outer join** preserves both. A **cross join** returns every pair. A **self join** joins a relation to itself under different aliases, useful for employee-manager or parent-child relationships. None of these guarantees one output per user: Ada's two bookings produce two matched rows.

@fig dbms_join_rows | Illustrative left join. Ada appears twice, Bo once, and Cy once with NULL booking fields.

```sql
SELECT u.name, b.price
FROM users u
LEFT JOIN bookings b
  ON b.user_id = u.id AND b.status = 'paid'
ORDER BY u.id, b.id;
```

Placing `b.status = 'paid'` in `ON` restricts which bookings match while keeping every user. Moving it into `WHERE` discards Cy's NULL-extended row, effectively eliminating the preservation for that predicate. Ask whether the filter restricts the match or restricts the final output.

A **semi join** returns left rows that have a match without returning or multiplying by right rows. `EXISTS` expresses it naturally. An **anti join** returns left rows without a match. To find users who never booked, use `NOT EXISTS` over matching bookings. A left join followed by `WHERE b.id IS NULL` is another form when `b.id` cannot be NULL on a real match.

The cost depends on the algorithm and data, not the keyword alone. Heron's full 100-user and 160-booking inputs have 16,000 possible pairs. An equality predicate can let an indexed lookup or hash join avoid enumerating those pairs. SQL expresses the relation; the execution part will account for the work.

### The output rows make the join type visible

On the fixture, the inner join produces Ada's two matches and Bo's one match. The left join adds Cy's unmatched row. A semi join returns Ada and Bo once each, because it asks whether at least one booking exists rather than returning booking combinations. An anti join returns Cy alone. These outputs are easier to remember than overlapping circles because they show the duplicate behaviour as well as membership.

Use a separate unconstrained teaching pair to make the unmatched right side visible. Left has `(a,L_a)` and `(b,L_b)`; right has `(a,R_a)` and `(c,R_c)`. Join on the first attribute. Only a matches, b is left-only, and c is right-only. A cross join needs no match condition and produces every left-right pair. A semi or anti join outputs left rows alone.

@fig dbms_join_comparison | Illustrative join inputs with one matching, one left-only and one right-only key. These are not bookings with broken foreign keys; they are a separate operator fixture.

A full outer join would also preserve unmatched bookings if the relationship allowed them. A valid non-null foreign key can make that unmatched-booking case impossible in this particular schema, but the operator's semantics do not disappear. Distinguish what an operator would do from which cases the input constraints rule out.

For a self join over an organizational hierarchy, name the roles explicitly: `employees e LEFT JOIN employees manager ON e.manager_id = manager.id`. The left alias is the employee whose row must remain, while the right alias supplies the optional manager. The table is the same; the logical roles are different. An alias identifies which role a column reference belongs to.

## 11. Subqueries, IN, EXISTS and the NULL trap

A blocked-user list contains a missing identifier. You write `WHERE user_id NOT IN (...)` and unexpectedly exclude customers who are not blocked. The snag comes from the membership test's logic, not from a mysterious join bug.

A **scalar subquery** supplies one value, with an error if its query returns too many rows; an empty result supplies NULL. A **correlated subquery** refers to an outer row. It expresses a per-outer-row dependency, but an optimizer can sometimes transform it into a join rather than literally rerunning it for every row.

`IN` asks whether a value equals any returned value. `EXISTS` asks whether the subquery returns any row; its selected expression is irrelevant to existence. They often have similar physical plans, so "EXISTS is always faster" is not a sound rule. Decide semantics first and inspect the actual plan.

@fig dbms_null_logic | Illustrative logic with a nullable exclusion set. The final absence test can be true even when a membership negation is unknown.

For `3 NOT IN (1, NULL)`, `3 = 1` is FALSE and `3 = NULL` is UNKNOWN. The OR is UNKNOWN; its negation is still UNKNOWN. WHERE keeps neither. A correlated `NOT EXISTS` with `blocked.user_id = users.id` instead asks whether a TRUE matching comparison exists. A NULL identifier does not match a non-null user, so it does not suppress every unmatched user.

```sql
SELECT u.id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.user_id = u.id
);
```

On the fixture this returns Cy. If a scalar subquery selects the latest booking, give it a deterministic order and the correct limit. If the outer value itself can be NULL, decide explicitly whether that means excluded, included or invalid; changing syntax is not a substitute for a domain rule.

:::note Subquery scope
A correlated subquery can refer to aliases from an enclosing query. An independent subquery has no such reference. This is a semantic difference; repeated work is a planning question.
:::

### Why the NULL trap changes the whole result

Expand `x NOT IN (a,b)` conceptually into "x is not equal to a, and x is not equal to b." If b is NULL, the second inequality is UNKNOWN. For an x that equals a, the first inequality is FALSE, so the conjunction is FALSE. For an x different from a, the first is TRUE, but TRUE AND UNKNOWN remains UNKNOWN. No candidate makes the whole condition TRUE.

NOT EXISTS expresses a different operation. It searches for rows whose correlation predicate is TRUE; UNKNOWN comparisons do not count as matches. With no matching row, the absence test returns TRUE. This difference is why the rewrite is useful for nullable exclusion sets, but it is not permission to ignore the outer column's own missingness semantics.

A scalar subquery has another distinct contract. It must represent one value for an outer row. If an unconstrained email predicate returns several customers, using it as a scalar is an error rather than an arbitrary choice of customer. If it returns none, the resulting NULL can propagate into later arithmetic. Uniqueness constraints and explicit absence handling turn those assumptions into checkable behaviour.

## 12. CTEs and recursive queries

A report repeats the same expensive-looking query in several places. Giving the intermediate result a name makes the intent easier to inspect, but does not automatically cache it. A **common table expression**, or CTE, defines a named relation within a statement using `WITH`.

```sql
WITH customer_totals AS (
  SELECT user_id, SUM(price) AS total
  FROM bookings GROUP BY user_id
)
SELECT user_id, total
FROM customer_totals WHERE total >= 200;
```

The fixture again returns Ada with 240. A normal CTE provides scope and a decomposition of the query. Whether the engine inlines or materializes it depends on the engine, query and options. In PostgreSQL, `MATERIALIZED` and `NOT MATERIALIZED` can influence eligible cases; neither is a universal performance improvement. The [CTE documentation](https://www.postgresql.org/docs/18/queries-with.html) describes the exact rules.

A **recursive CTE** combines an anchor result with a recursive step over a working frontier. For a venue hierarchy, the anchor chooses a root, the next round chooses its children, and later rounds choose descendants. The working frontier empties when no new rows remain. This is a useful mental model even though the SQL spelling uses recursion.

@fig dbms_recursive | The conceptual evaluation loop for a recursive hierarchy query. The frontier changes each round; the accumulated result retains earlier rows.

```sql
WITH RECURSIVE tree(id, parent_id) AS (
  SELECT id, parent_id FROM venues WHERE parent_id IS NULL
  UNION ALL
  SELECT v.id, v.parent_id
  FROM venues v JOIN tree t ON v.parent_id = t.id
)
SELECT id FROM tree;
```

`UNION ALL` keeps repeated paths. A cycle can keep generating rows, so enforce acyclic input or track visited paths and stop repeats. `UNION` removes duplicate result rows, but adding changing path or depth columns can prevent duplicate elimination from stopping a cycle. Recursive output order also needs an explicit ordering expression.

### Watch the recursive working table

Take a venue tree with a root building, a hall below it, and a balcony below the hall. The anchor returns the building. The recursive step joins that working row to venues whose parent_id is the building, producing the hall. The next working frontier is the hall; its expansion produces the balcony. Expanding the balcony produces no row, so the loop finishes. The accumulated result contains all visited venues, not only the last frontier.

For a deliberate cycle example, change the anchor to `WHERE id = 'building'` and make the building a descendant of the balcony. UNION ALL can now repeatedly traverse the cycle. With the printed `parent_id IS NULL` anchor instead, this single-parent cycle would be disconnected from every root and never reached. A depth limit bounds work but may truncate legitimate deep data, while a visited-path check rejects repeated identity along the path. Choosing the correct termination rule is part of the hierarchy model.

A non-recursive CTE does not provide this iteration simply because a name appears twice. It names a statement-local intermediate relation. If you want to persist a result across statements, use an appropriate table or materialized object with a lifecycle and freshness rule. Scope, evaluation strategy and persistence are separate properties.

## 13. Window functions, ranking and frames

You want each booking row next to its customer's total. GROUP BY would collapse the rows and remove their individual identity. A **window function** computes over related rows while retaining one output for each input row.

`PARTITION BY` divides the input into independent windows. Window `ORDER BY` gives an order within each partition. `ROW_NUMBER` assigns successive positions; `RANK` gives tied peers equal positions and leaves gaps; `DENSE_RANK` gives tied peers equal ranks without gaps. For salaries 90, 90, 70 and 50 ordered descending, those outputs differ as drawn below.

@fig dbms_window_ranks | Illustrative salaries, computed in the number script. The second distinct salary is 70, even though it appears in the third ordered row.

```sql
WITH ranked AS (
  SELECT department, employee, salary,
         DENSE_RANK() OVER (
           PARTITION BY department ORDER BY salary DESC
         ) AS salary_rank
  FROM employees WHERE salary IS NOT NULL
)
SELECT department, employee, salary
FROM ranked WHERE salary_rank = 2;
```

This finds employees earning the second-highest distinct non-null salary in each department. Use `ROW_NUMBER` instead if the question means one chosen employee in the second ordered position, with a deterministic tie-breaker. SQL usually needs an outer query or CTE to filter a window output because window evaluation follows WHERE.

`LAG` reads a preceding row and `LEAD` a following row under the window order. `SUM() OVER` and `AVG() OVER` calculate running or partition aggregates. A **window frame** specifies the subset around the current row. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` gives a physical-row running prefix. The common default with ORDER BY uses a peer-aware frame, so tied order values can share the same cumulative total. Read the frame explicitly rather than assuming each output adds exactly one row. The [window-function reference](https://www.postgresql.org/docs/18/functions-window.html) describes peer and frame behaviour.

### A frame changes which prices contribute

For the fixture's ordered booking prices 120, 120 and 80, an explicit ROWS prefix in deterministic booking order gives running sums 120, 240 and 320. A peer-aware RANGE prefix ordered only by price descending gives 240, 240 and 320, because both equal 120 values are peers and enter the first peer frame together. Both calculations are valid. They answer different cumulative questions.

The precise ROWS spelling is useful to keep beside the values:

```sql
SELECT id, price,
  SUM(price) OVER (
    ORDER BY price DESC, id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM bookings
ORDER BY price DESC, id;
```

@fig dbms_window_frames | Illustrative frame outputs computed by executing the ROWS and RANGE queries. RANGE uses price alone as its window order, while ROWS uses id to settle the tied row order.

Without ORDER BY inside the window, `SUM(price) OVER (PARTITION BY user_id)` gives Ada's partition total 240 on each of her booking rows. The rows still retain their individual prices. Adding an order and a prefix frame changes that partition total into an ordered accumulation. ORDER BY outside the window only changes presentation; it does not define the window calculation's neighbours.

LAG and LEAD require the same attention to order. In a deterministic fixture order, the first row's prior price is absent; the second row's prior price is 120; and the third row's prior price is 120. A tied order without a tie-breaker can choose an unexpected preceding row even when every row receives a unique ROW_NUMBER. Specify the order that the business question intends.

:::story Picture this
Grouping replaces a stack of tickets with one summary card. A window calculation leaves every ticket in place and writes the stack's total in the margin of each. The frame says which neighbouring tickets contribute to each margin note.
:::

:::key In one breath
Algebra expresses relations and SQL implements them with explicit duplicate, NULL and order semantics. WHERE filters rows, HAVING filters groups, outer joins preserve chosen inputs, and EXISTS tests a relationship without multiplying output. CTEs name intermediate queries; recursive CTEs repeatedly expand a working frontier. Window functions retain rows while partition, order and frame determine which neighbours contribute.
:::

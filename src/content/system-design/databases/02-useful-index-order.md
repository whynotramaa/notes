@part II | B-tree, composite and covering indexes | We organize an index around the search the reader actually makes. A fast lookup depends on ordered pages and a useful key, not on the presence of an index name. We will descend a tree, walk a range, and compare what different entries contain. | where:2

## 5. B-trees make a page visit do more work

You know event key 16, but the event is not in memory. Following a narrow pointer tree can require a new page for each comparison. A **B-tree** groups many sorted keys into each node and keeps the search paths balanced. Its width makes one page visit choose among many possible subtrees.

A **separator** is a key that divides child ranges. Our illustrative root has separators 12 and 20, with children containing keys below 12, from 12 up to 20, and from 20 onward. To find 16, compare it with the root boundaries and follow the middle pointer. Search the selected leaf for 16. You avoid examining the unrelated children.

**Fan-out** is the number of children an internal node can address. In an idealized tree with fan-out 100 at each of three decision levels, the number of terminal choices is $100^3=1,000,000$. That calculation explains the value of width. It does not assert that a real million-row index has exactly three pages on every search path.

$$\text{terminal choices}=f^h$$

Read this as: constant fan-out $f$, repeated for $h$ decision levels, gives $f$ to the power $h$ terminal choices. Actual height depends on leaf capacity, entry width, occupancy, and root layout. A cached root removes physical I/O without removing the logical tree step.

@fig sd_databases_btree | Illustrative separator search for key 16. Arrows select ranges, not individual base rows.

Inserting a key can overflow a page. Splitting the page creates another child and a new separator in its parent; parent overflow can propagate upward. This is why a write to a sorted index can change more than one page even when it inserts only one logical record.

:::story Picture this
A catalogue page directs you to one shelf range, and a shelf label directs you to one group of books. Each directory visit rules out many groups. Adding enough books requires another group and an updated directory; a faster search comes with maintenance work.
:::

## 6. B+ trees put range results together

Now the viewer asks for keys from 12 through 20 rather than one key. Repeating a root search for every result would waste the order already present. A **B+ tree** keeps data entries at the leaves, with internal nodes used for routing; linked leaves support continuing through adjacent ranges.

In our toy layout, leaves hold `[4, 8]`, `[12, 14, 16, 18]`, and `[20, 24]`. Descend to the leaf containing the lower bound 12, return its four qualifying entries, then follow the leaf link and return 20. Stop before 24 because it exceeds the upper bound. The computed result is five keys, `[12, 14, 16, 18, 20]`.

A leaf entry can contain the base record or a locator for it, depending on the engine and index organization. The term B+ tree describes the routing and leaf pattern; it does not specify where every payload lives. Product documentation sometimes uses B-tree as the wider family name for an implementation with leaf-oriented features.

Suppose the middle leaf's illustrative capacity is four entries and we insert 15. Sorting gives `[12, 14, 15, 16, 18]`. A valid toy split puts `[12, 14]` on the left and `[15, 16, 18]` on the right, adds separator 15, and repairs the leaf links. The old search path must now route 16 to the new right leaf.

@fig sd_databases_leaf_scan | Illustrative inclusive range scan. The next-leaf link avoids a fresh root descent for each returned key.

@fig sd_databases_leaf_split | Illustrative split after inserting 15 into a four-entry leaf. This is a teaching layout, not an engine's split policy.

Range cost includes the initial descent, visited leaf pages, and any base-row fetches. A large result remains expensive even when locating its first entry is cheap. Pagination limits returned work; it cannot make an unbounded historical scan disappear.

## 7. Composite indexes are ordered tuples

Heron asks for events in match `m7` with sequence at least 2. An index on sequence alone groups events from every match. A **composite index** sorts several columns as a tuple: first compare `match_id`, then compare `sequence` within equal match identifiers.

The tiny sorted index is `(m7,1)`, `(m7,2)`, `(m7,3)`, `(m8,1)`. Equality on `m7` isolates one contiguous slice. Seeking `(m7,2)` starts at the lower sequence bound and walking forward returns `(m7,2)` and `(m7,3)`. Encountering `m8` ends the match slice. That is the mechanism behind the common equality-then-range advice.

```sql
SELECT event_id, sequence
FROM events
WHERE match_id = 'm7' AND sequence >= 2
ORDER BY sequence;
```

An index on `(sequence, match_id)` instead groups all sequence-1 entries together, then all sequence-2 entries. It may serve another access pattern, but the requested match's entries no longer form the same simple slice. A query on a later column alone can require extra scanning or an engine-specific skip strategy.

@fig sd_databases_composite | Illustrative tuple order. The selected match and lower sequence boundary leave exactly two entries.

The next column's order is most useful after preceding equality constraints. A range on an earlier key can leave several groups that are not globally ordered by a later key. Inspect whether the plan still sorts. [PostgreSQL's multicolumn index documentation](https://www.postgresql.org/docs/18/indexes-multicolumn.html) explains its engine's search and skip-scan behavior.

:::warn Watch out
Do not memorize a prefix rule as a claim that every later-column query is impossible. The reliable argument is the ordered tuple layout and the pages a particular plan must visit. Engines can offer alternatives, with costs that depend on the data distribution.
:::

## 8. Covering indexes change what the lookup returns

The key lookup finds two event identifiers, but the page also wants each scorer. Fetching the base row for every identifier adds work. A **covering index** contains all columns needed by a query. The index can then supply the payload without a separate fetch for those values.

For Heron's recent-history query, `(match_id, sequence)` supplies filtering and order, while `event_id` and `scorer_id` supply displayed values. In PostgreSQL an `INCLUDE` column is payload rather than an additional sorting dimension. Adding payload does not change what the unique search key means.

```sql
CREATE INDEX events_recent
ON events(match_id, sequence)
INCLUDE (event_id, scorer_id);
```

Having every requested column is necessary for an **index-only scan**, which tries to answer from index entries. Visibility is another requirement. PostgreSQL may still consult the base page when its visibility metadata cannot prove the row belongs to the reader's snapshot. An updated table can therefore retain heap fetches despite having a covering index.

@fig sd_databases_covering | Illustrative lookup with payload columns. The visibility check is a separate question from whether the columns exist in the index.

Assume an added payload contributes 16 bytes to each of 100,000 entries. That is 1,600,000 extra payload bytes before page and metadata overhead. Wider leaves hold fewer entries and require more cache space. Add columns for a measured saved fetch, and check actual heap fetches in the plan. [PostgreSQL's index-only scan documentation](https://www.postgresql.org/docs/18/indexes-index-only-scans.html) describes the visibility-map requirement.

:::interview Interview lens
**"My index covers the query. Why are there still table reads?"** The engine may need the table for visibility, and a planner may choose another path. In PostgreSQL I inspect heap fetches and visibility-map coverage. I also check that every selected, filtered, and ordered value is supported by the chosen index.
:::

## 9. Clustered organization changes the second hop

An index range returns neighboring entries, but their base rows can sit on distant pages. A **clustered index**, in an engine that maintains one, organizes the base records around its key. A **non-clustered index** keeps a separate ordered structure whose entries locate base records elsewhere.

Picture events 1, 2, and 3 of the same match. In a heap layout their locators might name three scattered pages. In a suitably clustered layout, that match's records are nearby in key order, improving range locality. This describes the physical arrangement, not a guarantee that every range fits on one page.

Only one maintained ordering can organize the same base row store. Choosing match-and-sequence locality does not also make all events by scorer contiguous. A separate scorer index supplies another ordered entry set, then follows locators to the chosen base organization. Those paths share rows but have different search costs.

@fig sd_databases_clustered | Illustrative base-row locations. Index order and base-record order answer different physical questions.

InnoDB uses its clustered primary-key organization and includes the primary-key value in secondary entries. A wide primary key can therefore increase several indexes. PostgreSQL uses a heap; its `CLUSTER` command performs a rewrite rather than maintaining the ordering through every later update. Read those names through the engine's actual layout.

Before choosing a key, compare range reads, insertion locality, key width, and update behavior. A monotonically growing key can concentrate new writes at one end; an unrelated ordering can scatter reads. Neither choice is free. [InnoDB's index documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html) and [PostgreSQL's CLUSTER documentation](https://www.postgresql.org/docs/18/sql-cluster.html) state their different contracts.

:::key In one breath
Wide balanced trees let each visited page choose among many ranges. B+ tree leaves make bounded ordered scans efficient, and splits maintain the structure as it grows. Composite keys determine the useful slice, covering entries determine available payload, and clustered organization determines base-row locality. Explain each physical step before predicting its cost.
:::

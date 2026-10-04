@part V | Storage and indexes | A query must turn logical rows into bounded work on memory and storage. An index helps only when its order and contents match the access pattern, and it also makes writes more expensive. We will lay out pages, navigate and maintain a B+ tree, and choose among hash, clustered, composite and covering indexes. | where:5

## 23. The storage engine and locality

`SELECT state FROM show_seats ...` looks like a request for one value. The engine may need an index page, a heap page and a visibility check to produce it. Thinking in individual logical values hides the units that storage actually transfers and caches.

A **storage engine** organizes records, access paths and persistence beneath query execution. A **record** is the stored representation of a logical row. A **page**, also called a block in many contexts, is a fixed-size unit the engine reads, caches or writes. Large values can span pages or live outside an ordinary row; one tuple does not necessarily equal one page-local record.

@fig dbms_storage_path | The layers turn a logical query into storage requests. A RAM-resident page can satisfy a request without a device read.

RAM allows direct access to resident bytes. Persistent devices retain data after power loss, but have their own latency, transfer granularity and durability semantics. **Sequential I/O** visits nearby locations in order; **random I/O** jumps between locations. SSDs remove mechanical seeks but do not make every pattern identical in cost. Reusing nearby rows and pages gives **locality**, which helps both caches and device access.

A **heap file** stores table records without maintaining the table in a particular key order. The engine tracks free space to choose pages for inserts. Indexes point into that heap or into another primary organization. An operating system page cache and a database buffer pool can both cache data depending on the I/O strategy; their names do not imply they are the same cache.

:::story Picture this
A library retrieves a whole folder even when you need one sentence inside it. An index card points at the folder, and keeping frequently used folders on the desk saves another trip. The database's page is the folder; the analogy stops before concurrency and durability, which require separate rules.
:::

### One tuple request can cause several distinct accesses

An index entry might identify a heap page and a slot. The executor asks the buffer manager for that page. If it is already resident, no device read is needed; otherwise the manager chooses a frame, obtains the page from backing storage and makes it available. The storage code then follows the slot to the record and the visibility code decides whether that record belongs to the query's snapshot.

These are different costs. An index navigation count measures logical page accesses. A cache miss count measures requests that need a lower-layer fetch. A device read count depends further on the operating system's cache and I/O mode. "The query accessed a page" does not prove it performed a physical SSD read.

Sequential access tends to reuse nearby pages and can allow prefetching. A secondary lookup can jump between heap pages even when its own index entries are adjacent. Two queries returning the same number of tuples can therefore move different numbers of pages through the caches. This is why query plans need page and locality evidence as well as row counts.

## 24. Slotted pages and exact page counts

A variable-length row grows after an update. If every index stores its byte offset directly, moving the row can invalidate every pointer. A **slotted page** separates a stable slot identifier from the record's current position inside the page.

The header holds page metadata and space boundaries. A slot directory grows from one side and records grow from the other. A slot records the location and size of its item. Compaction can move record bytes while updating the slot entry. Row locators can use a page identifier and slot identifier, although update semantics and locator stability differ by engine.

@fig dbms_slotted_page | Illustrative Heron page. Band heights are schematic, not proportional; all labelled byte counts are computed from the declared toy layout.

For fixed-size Heron records, page capacity is

$$
c=\left\lfloor\frac{P-H}{R+s}\right\rfloor
 =\left\lfloor\frac{4096-64}{124+4}\right\rfloor=31.
$$

Read this as "records per page equal usable page bytes divided by record-plus-slot bytes, rounded down." $P$ is page size, $H$ the header, $R$ record size and $s$ slot size. The records and slots use $31 \times 128=3968$ bytes; the header uses 64, leaving 64 free.

Heron's 800 inventory rows require $\lceil800/31\rceil=26$ pages, or $26\times4096=106496$ bytes. The first 25 full pages hold 775 rows and the last holds 25. This is a fully packed teaching model, not a prediction of live PostgreSQL occupancy. Alignment, variable values, versions and reserved free space change real counts.

Free-space management avoids scanning every page to find room for an insert. Deleting a record can free space without immediately returning its page to the filesystem. PostgreSQL documents its actual header, item-pointer and tuple layout in the [page-layout reference](https://www.postgresql.org/docs/18/storage-page-layout.html); do not substitute this toy header into that layout.

### Insert, move and delete inside a page

For an insertion, the engine first checks that the page has enough room for both the record and its slot entry. It allocates a slot, places the record in free space and makes the slot point at that location. The page's free-space boundaries change. A free-space directory can then advertise the remaining room to later insertions.

If record bytes move during compaction, the slot keeps its identity while its location field changes. A reference through that slot still finds the item under the engine's locator rules. If the record is deleted, the engine may first mark a logical deletion because snapshots or recovery can still need it. Reclamation happens only when those obligations allow it. A hole inside a page is not automatically a free filesystem block.

The capacity calculation deliberately assumes fixed-size live records and fully packed pages. Heron's first 25 pages contain $25\times31=775$ records; the final page contains the remaining $800-775=25$. Leaving room for later growth would increase the allocated page count. Reserving room can reduce later movement or splits, so denser storage is not always the best write behaviour.

## 25. Why B+ trees have high fanout

An unindexed search may inspect all 800 inventory rows. A balanced binary tree reduces comparisons, but following one separately stored node per page wastes the page's capacity. Database indexes use many entries per node so each fetched page narrows the search much further.

A **B-tree** is a balanced multiway search tree. A **B+ tree** keeps record references or data at its leaves, with separator keys in internal nodes and leaf links for ordered traversal. The **fanout** is the number of child branches an internal node can select. All leaves have the same depth, so the tree's height bounds the navigation path.

@fig dbms_bplus_tree | Illustrative packed Heron index: 800 entries occupy leaves of 252, 252, 252 and 44 entries. One root selects a leaf, whose matching entry locates a heap row.

Heron's toy 16-byte leaf entries yield $\lfloor(4096-64)/16\rfloor=252$ entries per leaf. The 800 entries require 4 leaves and one root in this simplified layout, so the index uses 5 pages. A cold point lookup follows root, leaf and heap: 3 page accesses, before considering caches and visibility details. A balanced binary search among 800 keys needs up to 10 key comparisons in the comparable comparison model; this does not mean 10 actual database page reads.

Search chooses the child interval containing the key at each internal node, then locates matching entries within the leaf. A range query navigates once to its first leaf and follows adjacent leaf links, rather than searching from the root for every next key. With fanout $f$ and $N$ entries, navigation height grows on the order of $\log_f N$. Read this as "the logarithm of entry count in the branching base." $f$ and $N$ are model parameters, not universal constants.

High fanout comes from compact separators and page-sized nodes. Wider keys lower capacity. Partly filled nodes, duplicate handling and internal-node layouts also affect height. The algorithmic reason for B+ trees survives these details: spend a page read to examine many possible branches and keep range data in leaf order.

:::interview Interview lens
**"Why a B+ tree rather than a binary search tree?"** A page-sized multiway node makes each page fetch decide among many branches, reducing navigation height. Linked ordered leaves support range scans after one initial search. A balanced binary tree controls comparison complexity too, but a pointer-rich one-node-per-allocation layout does not automatically provide the same page locality.
:::

### Follow an equality lookup and then a range

For a point lookup, the root separators identify which leaf's key interval can contain the requested show-seat pair. The engine searches that leaf's sorted entries and follows a matching locator to a heap page. It verifies that the row matches the query and its visibility rules before returning state. If the root and leaf are cached, their logical accesses need not become device reads.

For a range, locate the first qualifying key in the same way. Consume the remaining qualifying entries in that leaf, then follow the next-leaf link while the upper boundary still permits matches. The links avoid a fresh root traversal for every consecutive key. They do not eliminate heap access when the requested data or visibility information is absent from the index.

The toy index uses three full leaves and one partly filled leaf: $3\times252+44=800$ entries. That is a useful page budget, not a claim that a live tree stays maximally packed. Internal separator encoding, page overhead, occupancy policies and growing duplicate groups can change the tree. State those assumptions before turning a capacity calculation into an I/O estimate.

## 26. Inserts, splits, deletes and merges

Insert a key into a full leaf. Keeping the old page order by shifting entries does not create more bytes. The tree needs a structural change while preserving every search interval.

An insert searches to the target leaf, inserts in key order, and checks capacity. If the leaf overflows, a **split** distributes its entries between two leaves and installs a separator in the parent. If that parent overflows, splitting propagates upward. Splitting the root creates a new root and increases the height; all leaves still remain at the same depth.

@fig dbms_leaf_split | Illustrative capacity-four leaf. Inserting 25 into 10, 20, 30, 40 creates five entries, split here into two and three; separator 25 guides the right branch.

A delete removes an entry under the engine's visibility and reclamation rules. A textbook underfull node can borrow entries from a sibling or **merge** with it, followed by parent-separator repair. Removing the last useful root level can reduce the height. Production engines may defer physical removal, use different occupancy policies or avoid eager merges; describe the invariant rather than assuming the textbook timing is universal.

Structural modifications must be safe while other workers search or update the same tree. A short physical **latch** protects an in-memory data structure while it changes. A transaction lock protects a logical concurrency rule for a longer lifetime. Mixing the two concepts leads to explanations in which every tree traversal would block unrelated transactions until commit.

Splits add write work and can reduce page density. Insert order, reserved free space and key width affect their frequency. A unique index must coordinate concurrent equal-key inserts so both cannot pass a stale independent check. "First SELECT, then INSERT" in application code does not recreate that engine guarantee.

:::note Textbook tree versus an engine
B+ tree is the useful teaching abstraction. Engines may name their ordered access method B-tree and implement sibling links, duplicate optimizations and concurrency algorithms beyond the textbook. Match an engine claim to its implementation documentation.
:::

### Repair the parent as well as the leaf

In the capacity-four example, 10, 20, 30 and 40 fit before insertion. Adding 25 requires a temporary five-key ordering. Split it into left keys 10 and 20, and right keys 25, 30 and 40. The parent installs 25 as a separator so a future search for 30 follows the right child. The former leaf's next link must also lead through the new neighbour.

If the parent did not change, a correct new leaf could remain unreachable through the old navigation tree. If the sibling links did not change, a range scan could skip the new keys. A split is therefore a coordinated change to search navigation and ordered traversal. The engine's concurrency algorithm must keep searches correct while that change occurs.

Deletion has a similar structural obligation. Removing a separator key from a leaf does not mean the parent can always keep its old boundary without checking the tree's separator convention. Borrowing or merging may require changing a separator or removing a child pointer. Use a separate deletion fixture whose leaves require at least two keys and hold at most four. Left has only 10, while right has 25, 30 and 40. Borrow 25 from the right: left becomes 10,25; right becomes 30,40; and the parent boundary changes from 25 to 30. Both leaves now meet the minimum.

Later remove 25 and 40. The leaves contain 10 and 30, so neither can donate while retaining its own minimum. Merge them into one leaf containing 10,30 and remove the right child's pointer and separator from the parent. If this parent was a root with no other useful children, the surviving leaf can become the root. Real implementations can postpone such repairs, but the textbook example makes their invariants explicit.

@fig dbms_leaf_delete | Illustrative minimum-two, maximum-four leaf occupancy. Borrowing changes a separator; merging removes a child pointer.

These repairs explain why an index insert or delete costs more than writing one isolated entry.

## 27. Hash, clustered and secondary indexes

`WHERE id = ...` and `WHERE price BETWEEN ...` have different access needs. Hashing puts equal keys together but does not preserve the order needed to walk a price range.

A **hash index** maps keys to buckets, then checks actual key equality inside a bucket because collisions exist. Equality lookup can be efficient, but a range generally needs another access path. Hash growth may require bucket splits or a directory. Do not promise constant worst-case time or confuse a hash join's temporary table with a persistent hash index.

A **clustered organization** arranges the table's data through the primary ordered structure, or in terminology specific to an engine, maintains rows near that key order. A **secondary index**, often called non-clustered, stores an alternative key order and a locator for rows kept elsewhere. The exact locator may be a physical row reference or a primary key, affecting entry size and the work of another lookup.

@fig dbms_index_layout | Index structure and table organization are separate choices. "Clustered" needs an engine-specific definition.

A table can have several secondary indexes but cannot simultaneously keep the same row bodies in several different physical orders without additional copies. Range locality is a benefit of a clustered organization; changing its key can be expensive. In PostgreSQL, ordinary indexes are separate from the heap. `CLUSTER` can reorder a table according to an index, but later writes do not automatically maintain that order. The [CLUSTER reference](https://www.postgresql.org/docs/18/sql-cluster.html) documents that distinction.

Choose by workload. Equality-only access can suit hashing; equality plus ranges often suits a B+ tree. Secondary indexes provide several access patterns at the cost of more stored structures and write maintenance. None removes the need to inspect selectivity and query plans.

### Compare the physical routes for one result

With a secondary email index, a lookup finds an email entry and then follows its row locator into the user's primary storage. If the locator is a physical heap reference, it leads toward a page and slot. If the engine stores a clustered primary key as the locator, it may require another tree lookup. The same SQL query can therefore have a different physical route in two engines.

A hash bucket gives another route. Hash the requested id, visit its bucket and check actual keys within it. Two different keys can share a bucket, so the equality check is still necessary. A request for ids between two bounds cannot derive a useful adjacent-bucket walk merely from numeric order; the hash function intentionally destroys that ordering.

For a clustered range, row bodies corresponding to adjacent index keys tend to be in the primary ordered organization. That can reduce scattered row retrieval, but maintaining several different physical row orders would require several copies. Secondary indexes preserve alternative key orders cheaply in terms of row duplication, while still paying for locators, payloads and write maintenance.

## 28. Composite indexes and leftmost prefixes

An index ordered by `(show_id, state, seat_id)` places all seats for one show together, then groups them by state, then orders each group by seat. Asking for `state = 'free'` without choosing a show can scatter matches across the index.

A **composite index** orders by several key attributes, usually lexicographically for a B-tree. The **leftmost-prefix rule** is a useful access-path principle: equalities on leading attributes select a contiguous region, and a condition on the next attribute can bound that region. Conditions after an unconstrained or ranged attribute may still filter entries without narrowing the same single interval.

@fig dbms_composite | Illustrative order. Fixing a selects a region, and fixing a and b selects a smaller region. A b-only predicate is distributed across different a groups.

| Predicate on index `(a,b,c)` | Usual navigation consequence |
|---|---|
| `a = ?` | Bound the a group |
| `a = ? AND b = ?` | Bound the a,b group |
| `b = ?` | No single ordinary leading-key interval |
| `a = ? AND c = ?` | Bound a; use c inside that region |
| `a = ? AND b > ? AND c = ?` | Bound a and a range of b; c may filter |

This does not mean every query missing a leading equality must ignore the index. The engine may scan the full index, combine indexes or use a skip scan when appropriate. PostgreSQL's [multicolumn-index documentation](https://www.postgresql.org/docs/18/indexes-multicolumn.html) describes these alternatives. "Cannot use" is too absolute; "cannot ordinarily isolate one narrow prefix interval" captures the mechanism.

Column order also affects sorting. An index can provide an `ORDER BY` compatible with its key ordering after fixed leading keys. Collations, NULL ordering and direction matter. Design a composite index for a concrete filter-and-order pattern, and verify whether it reduces scanned entries rather than merely appearing in the plan.

### Think in contiguous intervals

For the illustrated `(a,b,c)` order, every east row precedes every west row. Fixing a to east chooses one contiguous interval. Within it, fixing b to its first group chooses a smaller interval containing A7 and A8. A predicate only on c can have matches in several a,b groups, so it cannot normally point to one narrow interval from the root.

A predicate on a and c still benefits from the bounded a region. The c test can discard entries inside it, even though the intervening b attribute remains unconstrained. That explains why "the index is useless" is also too strong. The question is how much of the index must be traversed before the engine knows all matches have been found.

A range on b can leave several b groups to scan. Filtering c within them does not necessarily shrink the outer endpoints of that range. Some engines can perform several distinct probes or choose skip-scan strategies under suitable distributions. A query plan will tell you whether it navigated a narrow interval, repeatedly probed groups or scanned a broad region.

## 29. Covering, partial, expression and unique indexes

A query needs only `state`, but the index contains just the seat identity and a heap locator. The engine still visits the heap to obtain state. Adding the requested value can change that data-access obligation, at a storage and maintenance cost.

A **covering index** contains all values a particular query needs. An **index-only scan** can produce its data from the index, provided the engine can establish visibility without fetching every heap row. PostgreSQL uses a visibility map to skip heap visibility checks for eligible pages; recently changed pages may still require heap visits. Its [index-only-scan reference](https://www.postgresql.org/docs/18/indexes-index-only-scans.html) distinguishes data coverage from visibility.

@fig dbms_index_only | PostgreSQL's conceptual covering path. A covering definition enables index-only data retrieval but does not promise zero heap fetches.

```sql
CREATE INDEX show_seat_state
ON show_seats(show_id, seat_id) INCLUDE (state);
```

The included state is payload rather than another navigation key. A **unique index** enforces uniqueness under its declared semantics. A **partial index** stores only rows meeting a predicate, such as active reservations. The query must imply that predicate for the planner to rely on its coverage. An **expression index** stores the result of an expression, such as `lower(email)`, so a matching search avoids calculating it over every table row.

Why not index every column? Inserts and deletes maintain every relevant structure; updates maintain indexes whose keys or payload change. Indexes occupy storage and cache space, generate logged work and can split pages. Included wide values make leaf entries larger. Expression and partial definitions also encode semantics: case-folded uniqueness and "active" membership must be the intended business rules.

### A partial unique index can express a real lifecycle rule

Suppose historical booking items may retain cancelled purchases, but only held or sold claims should block the same show seat. A partial unique index on `(show_id, seat_id)` restricted to active status can enforce one active claim while allowing cancelled history. The predicate must represent the actual lifecycle, and every status transition into the indexed set must pass the uniqueness check.

An expression index on `lower(email)` expresses a different decision: searches or uniqueness operate on the normalized expression, not the original spelling. The application must use compatible case and collation semantics. Such an index does not mean every unrelated expression on email can use the same stored value.

For a covering seat-state query, state as included payload can avoid a heap data lookup, but it also changes the entry whenever state changes. Heron's hot inventory is updated often, so visibility and write-maintenance costs matter. Include values because a measured access pattern benefits, not because larger indexes sound more complete.

:::warn Watch out
The existence of an index does not prove it is useful. A low-selectivity scan may touch most heap pages anyway, and a covered query can still need heap visibility checks. Compare the entries and pages visited with the rows actually returned.
:::

:::key In one breath
Storage engines operate on records inside pages, and slotted pages separate row location from moving record bytes. B+ trees use high fanout and ordered linked leaves to bound navigation and support ranges, while splits and reclamation maintain their invariants. Hashing, clustered organization and secondary indexes solve different access problems. Composite order, coverage and visibility determine whether an index saves work, and every maintained index adds write and storage cost.
:::

from author import publish
raw=r'''
@part Records and constraints | We model a score as records with enforceable relationships. Without constraints, concurrent writers can create states no reader expects. We will build tables, keys, and the lookup path.

## Tables, rows, and keys

Two scorers create the same match identifier. A **table** groups records with a schema; a **row** is one record. A **primary key** uniquely identifies a row, and a **foreign key** requires a referenced row to exist. Heron stores matches, score events, and users with explicit keys and relationships.

An **index** is a maintained lookup structure that helps locate rows without checking each one. A uniqueness constraint makes the database arbitrate concurrent duplicate insertion. An application check followed by an insert is insufficient because another writer can insert between them. Constraints protect the data even when a new caller forgets the application check.

@draw keys | tree | A SCORE EVENT REFERENCES EXISTING RECORDS | ["event_id = e9","match_id -> m7","scorer_id -> u4"] | Illustrative identifiers; foreign keys preserve the relationships. | checks belong at the shared write boundary

## B-tree and B+ tree indexes

A lookup among many rows needs more than a binary comparison in memory. A **B-tree** keeps sorted keys in a balanced, wide tree. A **B+ tree** keeps record references in leaf pages and usually links leaves for range scans. Wide pages reduce the number of page visits compared with a narrow pointer tree.

Assume a simplified fan-out of 100 and 1,000,000 indexed records. Since $100^3=1,000,000$, a three-decision-level tree can address that many entries in this idealized model. Actual tree height depends on leaf capacity, occupancy, key width, and page layout. Updates pay for index maintenance, splits, and durable logging; an index is not a free copy of the query result.

@draw btree | tree | SORTED RANGES SELECT A CHILD PAGE | ["separator keys","lower range","middle range","upper range"] | Illustrative tree shape, not a product page layout. | range scans continue across leaves

:::story Picture this
A library catalogue first names a shelf, then a group of books, then the exact book. It saves a full-room search, but every new book requires updating the catalogue as well as placing the book.
:::

:::key In one breath
Tables organize rows and keys enforce identity and relationships. Indexes trade extra write work and space for cheaper lookups. Wide balanced trees reduce page visits. An application pre-check cannot replace a shared uniqueness constraint.
:::

@part Useful index order | We shape the index around an actual query. Extra indexes can make writes slower without improving reads. We will compare composite, covering, and clustered structures.

## Composite and covering indexes

Heron reads recent events for one match ordered by sequence. A **composite index** sorts by several columns, such as `(match_id, sequence)`. Equality on the first column narrows a contiguous range, and the next column supplies order. A query by sequence alone may need another strategy; engine-specific skip scans can sometimes help, so the prefix rule is a planning heuristic, not a universal impossibility claim.

A **covering index** contains all values required by a query, avoiding some base-row fetches. In PostgreSQL, an index-only scan also depends on tuple visibility information; having the columns is necessary but not always sufficient. Wider indexes occupy more pages and cost more to update. Inspect a real plan rather than counting index names.

@draw composite | rows | THE SORT ORDER IS A QUERY DECISION | [["keys","m7, 1","m7, 2","m8, 1"],["filter m7","first","second","outside"]] | Illustrative composite keys and selected range. | leading equality makes a contiguous slice

## Clustered and non-clustered indexes

A range query may read adjacent index entries but jump around the table for payloads. A **clustered index**, in engines that maintain one, organizes the base records by its key. A **non-clustered index** has separate entries pointing to base records. Only one maintained physical ordering can organize the same row store at a time.

Names differ by engine. InnoDB organizes records around the primary key; PostgreSQL uses a heap, and `CLUSTER` rewrites it once rather than maintaining that order on every later write. Cluster by the access pattern that benefits most, and remember that a wide primary key may enlarge secondary entries in engines that store that key as the row locator.

@draw clustered | split | FINDING THE KEY IS NOT ALWAYS FINDING THE PAYLOAD | [["separate index","ordered key entries\nthen locate base row"],["clustered organization","ordered base records\nrange locality"]] | Conceptual comparison; physical layouts are engine-specific. | one physical ordering cannot favor every query

:::warn Watch out
An index on every column is not a query plan. It multiplies write maintenance and may still fail to support the filter and order used together.
:::

:::key In one breath
Composite key order follows filters and ordering. Covering indexes can remove payload fetches but still have engine-specific visibility rules. Clustered organization changes row locality. Check plans, page work, and write costs for the actual workload.
:::

@part Query execution | We follow a query past its SQL spelling. The same result can be produced with very different work. We will inspect execution plans and the mechanisms behind joins.

## Plans, scans, and cardinality

The database sees a filter that matches most of the table. It may choose a sequential scan even though an index exists. A **query plan** is the chosen sequence of operators, and **cardinality** is the row count an operator produces. Statistics estimate selectivity, influencing scan type, join order, and memory allocation.

Use `EXPLAIN` to inspect estimates, and execute carefully when collecting actual measurements. Compare estimated and actual rows, loops, reads, sort spills, and wait time. A low-cost index lookup repeated for every outer row can become expensive. Stale statistics, correlated columns, and skew can make a plausible plan wrong for the real workload.

@draw plan | flow | SQL BECOMES PHYSICAL OPERATORS | ["parse + bind","plan choices","scan + filter","result rows"] | Illustrative execution stages. | rows times loops reveals repeated work

## Nested-loop, hash, and merge joins

A page combines score events with user names. A **join** combines rows according to a relationship. A nested-loop join finds matches for each outer row, often using an inner index. A hash join builds a key table for one input and probes it with the other. A merge join advances through inputs ordered by the join key.

Nested loops fit a small selective outer input. Hash joins suit many equality matches but need memory and can spill. Merge joins benefit from existing order but may pay for sorting. Choosing a join requires input sizes, key distributions, memory, and available order. The logical SQL relationship alone does not tell you the physical cost.

@draw joins | rows | DIFFERENT WAYS TO FIND THE SAME MATCHES | [["nested loop","outer row","inner lookup"],["hash join","build table","probe keys"],["merge join","sorted left","sorted right"]] | Illustrative operator mechanics. | inspect input rows and memory

:::interview Interview lens
**"Why did the database ignore my index?"** The planner may expect a scan to touch fewer pages for a broad filter. I would compare cardinality estimates with actual rows and inspect repeated loops, sorting, and heap reads. An index's existence does not make it the cheapest access path.
:::

:::key In one breath
A query plan converts a declarative request into physical work. Cardinality and statistics guide those choices. Join methods trade lookup work, memory, and sorting. Read the plan's row counts and loops instead of treating SQL length as a cost estimate.
:::

@part Transactions and anomalies | We define which intermediate states readers may see. A transaction boundary alone does not serialize every interaction. We will separate ACID from isolation and trace anomalies.

## Transactions and ACID

A score change and its deduplication result must commit together. A **transaction** groups operations into a commit or rollback boundary. **ACID** names atomicity, consistency, isolation, and durability. Atomicity prevents a partial committed group; consistency means application invariants hold when constraints and code enforce them; isolation controls concurrent observation; durability defines what survives an acknowledged commit.

Durability depends on configured logging, flushing, replicas, and the promised failure model. ACID does not automatically know a rule such as 'only assigned scorers can edit this match.' That rule needs explicit enforcement. Nor does one local transaction make a remote message publish atomic with a database write.

@draw acid | rows | FOUR DIFFERENT QUESTIONS ABOUT A COMMIT | [["atomicity","all","or none"],["isolation","which","observations"],["durability","ack","survives what?"]] | Conceptual commit contract. Consistency is the set of explicitly enforced invariants. | a label cannot supply a missing invariant

## Isolation levels and read anomalies

A transaction reads a score, another commits an update, and the first reads again. A **dirty read** sees uncommitted data; a **non-repeatable read** sees a changed value on rereading a row; a **phantom read** sees a changed set of matching rows. An **isolation level** controls which concurrent histories are allowed, with engine-specific implementation details.

Read committed commonly gives each statement a fresh committed view. Repeatable-read behavior varies; PostgreSQL uses a transaction snapshot and prevents the listed phantom anomaly, but write skew can still occur. Serializable transactions must behave like some serial order, often aborting and requiring a whole-transaction retry. Isolation is not a guarantee that clocks, emails, or external calls become transactional.

@draw anomalies | sequence | A COMMITTED CHANGE BETWEEN TWO READS | {"actors":["reader A","database","writer B"],"steps":[[0,1,"read score = old"],[2,1,"commit new score"],[0,1,"read again"],[1,0,"new at read committed"]]} | Illustrative non-repeatable read, not a dirty read. | name the history before naming the level

:::key In one breath
Transactions group local effects. ACID separates atomicity, enforced invariants, concurrent observation, and survival of commits. Isolation levels permit or reject particular histories. Serializable execution can abort, so the entire transaction needs safe retry behavior.
:::

@part Versions, locks, and recovery | We explain how concurrent reads and durable writes coexist. Keeping versions does not remove conflicts or crash recovery. We will follow MVCC, locks, deadlocks, and WAL.

## MVCC, locks, and deadlocks

A reader wants the old committed score while a writer builds the new version. **MVCC**, or multiversion concurrency control, retains versions and chooses visible ones using a snapshot. It reduces some reader-writer blocking, but writers can still conflict. Old snapshots can keep dead versions alive and increase cleanup work.

A **lock** reserves access under a conflict rule. A **deadlock** occurs when transactions form a cycle of waits, such as A holding match X while waiting for Y and B holding Y while waiting for X. Use consistent acquisition order, keep transactions short, and retry an aborted transaction. A lock timeout is a bounded wait, not proof of a deadlock.

@draw deadlock | split | A WAIT CYCLE CANNOT MAKE PROGRESS | [["transaction A","holds X\nwaits for Y"],["transaction B","holds Y\nwaits for X"]] | Illustrative deadlock. Abort one transaction to break the cycle. | a fixed lock order prevents this cycle

## WAL and connection pools

A machine crashes after changing memory but before persisting table pages. **Write-ahead logging**, or **WAL**, persists recovery information before the corresponding dirty pages need to reach stable storage. Recovery replays committed work according to the engine's log rules. Checkpointing bounds later replay work, but does not replace the commit durability policy.

Database **connection pools** reuse sessions and bound concurrent work. The earlier illustrative 20 connections at 0.01 s occupancy give an ideal 2,000 operations per second; lock contention and log flushing can lower it. A transaction that waits on a remote API while holding a connection consumes scarce slots without doing database work.

@draw wal | flow | LOG BEFORE DEPENDENT PAGE PERSISTENCE | ["change + log","durable WAL","commit policy","page flush later"] | Conceptual recovery order. The actual acknowledgement point depends on configuration. | a checkpoint is not every transaction's commit

:::warn Watch out
MVCC does not mean 'no locks.' It changes reader visibility; write conflicts, DDL locks, and engine-specific locking still exist.
:::

:::key In one breath
MVCC separates visible versions from in-progress changes. Locks coordinate conflicts and deadlocks require a broken wait cycle. WAL makes dirty-page recovery possible under a configured durability policy. Bound connection occupancy and avoid remote waits inside a transaction.
:::

@part Copies and partitions | We scale a working database without losing its contract. Copies solve different problems from dividing ownership. We will trace replica lag, sharding, and a complete score write.

## Read replicas and replication lag

Heron writes the leader and immediately reads a follower that has not applied the change. **Leader/follower replication** copies a leader's history to followers. A **read replica** can serve reads from that copied state. **Replication lag** is the delay or position gap between leader progress and follower visibility.

**Synchronous replication** waits for configured replica acknowledgement before completing a write; the acknowledgement may mean received, flushed, or applied, depending on the system. **Asynchronous replication** acknowledges before that wait, allowing stale reads and possible loss of recently acknowledged writes after failover. Route read-after-write traffic to a suitable source or use a commit-position fence; copying alone does not create a consistency promise.

@draw lag | sequence | A FOLLOWER CAN ANSWER BEFORE IT HAS THE WRITE | {"actors":["scorer","leader","follower"],"steps":[[0,1,"commit version v"],[1,0,"acknowledge"],[0,2,"read version"],[2,0,"older version"],[1,2,"apply v later"]]} | Illustrative asynchronous replication trace. | acknowledgment and visibility are separate

## Partitioning, sharding, and resharding

A single machine cannot hold or serve all independent matches. **Partitioning** divides data into subsets; **sharding** places those subsets on separate database owners. A **partition key** determines placement. Hashing match identifiers spreads matches, but one popular match can still become a **hot partition**, a shard whose work exceeds its share.

**Consistent hashing** arranges ownership so adding a node moves a subset rather than remapping every key. Under an ideal uniform ring with equal ownership, adding a fifth owner moves an expected one-fifth of keys. That expectation is not an exact count for a finite key set. **Resharding** needs copying, catch-up, a cutover position, routing updates, and cleanup. Queries and transactions crossing shards add network and coordination costs.

@draw shard | ring | OWNERSHIP CHANGES AT PARTITION BOUNDARIES | ["shard A","shard B","shard C","new owner"] | Illustrative ring; actual moved-key counts must be measured. | a hot key stays hot after uniform hashing

### The completed write

Validate the scorer, begin a transaction, claim the command key, update the score and event sequence, append an outbox row, and commit under the chosen durability policy. Replicas apply the history and the outbox publisher emits it later. This chapter does not solve consensus between database owners; the distributed-systems unit explains that boundary.

@draw complete | flow | THE SCORE AND ITS RECOVERY RECORD COMMIT TOGETHER | ["validated command","score + key","WAL commit","replica + outbox"] | Illustrative local transaction and later propagation. | durable truth precedes derived copies

:::key In one breath
Replicas copy history; shards divide ownership. Replication acknowledgement, application visibility, and failover survival are distinct promises. A partition key must match access patterns and handle skew. A complete write has an atomic local commit plus a deliberate propagation and recovery path.
:::
'''
qa=[('Why enforce keys in the database?','Concurrent callers can race between an application check and an insert. A shared uniqueness or reference constraint arbitrates the commit.'),('Why are B-trees wide?','A wide page routes among many child pages in one visit. Key width and page occupancy determine physical height.'),('How do you order a composite index?','Start with the query\'s equality filters and range or ordering needs. Inspect the plan and engine-specific behavior for other predicates.'),('Does covering guarantee no heap reads?','No. Engine visibility rules and storage layout can still require base-row checks.'),('What chooses a join algorithm?','Input sizes, useful indexes, ordering, available memory, and distribution. The SQL relationship does not uniquely determine the execution method.'),('What does ACID consistency mean?','The transaction preserves the explicitly enforced invariants. It does not invent missing business rules.'),('What distinguishes dirty and non-repeatable reads?','Dirty reads expose uncommitted changes. Non-repeatable reads can expose a later committed change between reads.'),('Why retry serializable transactions?','The database may abort an execution that cannot fit a serial history. Restart the entire transaction with safe external-effect handling.'),('Does MVCC remove locks?','No. It chooses visible versions; writers and structural operations still coordinate conflicts.'),('How do you prevent a deadlock?','Acquire shared resources in a consistent order and keep transactions short. Still handle engine aborts and retry safely.'),('Why write a log before pages?','Crash recovery needs durable information about changes whose table pages may not yet be flushed. The log precedes those dependent writes.'),('What does synchronous replication acknowledge?','That depends on configuration: receipt, durable flush, or application. State the actual promised point.'),('Do replicas solve write scale?','Copies can distribute reads and improve recovery. Independent write ownership usually needs partitioning and a cross-shard contract.'),('Why can a hash shard be hot?','Uniform keys do not imply uniform request rates. One match can dominate one owner.'),('What makes resharding safe?','Copy and catch up before a fenced ownership cutover. Routing and cleanup must agree on which owner can accept writes.')]
ex=[('●','Compute illustrative three-level fan-out capacity.','100 times 100 times 100 gives 1,000,000 leaves in the stated idealized decision model.'),('●','Compute one-copy 30-day record bytes.','8,640,000 times 500 times 30 gives 129,600,000,000 bytes.'),('●','Compute three-copy bytes.','129,600,000,000 times 3 gives 388,800,000,000 bytes before indexes and logs.'),('●','Compute the ideal pool bound.','20 divided by 0.01 gives 2,000 operations/s before contention.'),('●●','Trace a uniqueness pre-check race.','Both writers read absence, then both try insertion. Only an atomic shared uniqueness rule prevents both commits.'),('●●','Choose an index for recent events by match.','Use a composite match identifier and sequence key in the desired scan order. Add needed result columns only after measuring base-row fetch cost.'),('●●','Construct a non-repeatable read.','A reads the old committed row, B commits a new value, and A\'s next statement reads it under read committed.'),('●●','Construct a deadlock.','A holds X and waits for Y; B holds Y and waits for X. Aborting one releases the cycle.'),('●●','Explain a stale read after a successful write.','An asynchronous follower may not have applied the acknowledged leader change. Read from a suitable leader or wait for a commit position.'),('●●●','Derive the ideal moved-key fraction after adding an equal owner.','With five uniform equal owners, the new owner receives an expected 1/5, or 20%, of keys. A real ring and finite sample can differ.'),('●●●','Design safe ownership cutover.','Copy a source snapshot, apply changes through a named position, fence old writes, publish new routing, and verify before deleting the source. Retries keep command identity.'),('●●●','Explain why a database write and broker publish need another pattern.','They do not share a local atomic commit. An outbox records publication intent with the write and retries later; consumers still deduplicate.')]
publish(3,'databases','Inside a relational database',['Inside the','Database'],'Records, indexes, query plans, joins, transactions, isolation, MVCC, locks, recovery, replication, and sharding through a score write.','Explain the physical work behind each query and the exact guarantee behind each acknowledged write.',raw,qa,ex,[('PostgreSQL indexes','https://www.postgresql.org/docs/current/indexes.html','Index types and query support.'),('Multicolumn indexes','https://www.postgresql.org/docs/current/indexes-multicolumn.html','Column ordering and planner choices.'),('Index-only scans','https://www.postgresql.org/docs/current/indexes-index-only-scans.html','Visibility and covering indexes.'),('Transaction isolation','https://www.postgresql.org/docs/current/transaction-iso.html','Allowed histories and serialization failures.'),('Explicit locks','https://www.postgresql.org/docs/current/explicit-locking.html','Lock conflicts and deadlocks.'),('Write-ahead logging','https://www.postgresql.org/docs/current/wal-intro.html','Recovery ordering.'),('Standby replication','https://www.postgresql.org/docs/current/warm-standby.html','Replica acknowledgement and lag.'),('InnoDB clustered indexes','https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html','The primary-key-organized base records.')])

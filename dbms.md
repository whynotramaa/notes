For DBMS, I’d go deeper than the DB section from system design. The target should be **interview depth + enough internals that you can reason from first principles**, rather than memorizing SQL definitions.

I’d make this the complete DBMS syllabus.

## 1. Database fundamentals

Start here, but move through it quickly.

- What is a DBMS?
- DBMS vs filesystem
- Database architecture
- Schema vs instance
- Data abstraction
  - physical level
  - logical level
  - view level
- Data independence
  - physical
  - logical
- DDL / DML / DCL / TCL
- Database users and roles
- DBMS vs RDBMS
- Relational model

Know the relational terminology properly:

- relation
- tuple
- attribute
- domain
- degree
- cardinality
- NULL
- constraints

---

# 2. Keys and constraints

Small topic, **very frequently asked**.

### Keys

- Super key
- Candidate key
- Primary key
- Alternate key
- Composite key
- Foreign key
- Natural key
- Surrogate key

Be able to answer things like:

> Can a table have multiple candidate keys?

> Can a foreign key be NULL?

> Primary key vs UNIQUE?

> Why use a surrogate ID instead of email as primary key?

### Constraints

- NOT NULL
- UNIQUE
- PRIMARY KEY
- FOREIGN KEY
- CHECK
- DEFAULT

Then:

- entity integrity
- referential integrity
- cascading delete/update
- `RESTRICT`
- `SET NULL`
- `CASCADE`

---

# 3. ER modelling

Know enough to model a problem during an interview.

- Entity
- Attribute
- Relationship
- Strong vs weak entity
- Cardinality
- Participation

Relationships:

```text
1 : 1
1 : N
M : N
```

Understand how each becomes relational tables.

Also:

- composite attributes
- multivalued attributes
- derived attributes
- identifying relationships
- associative/junction tables

Practice converting:

```text
Student ←→ Course
```

into:

```text
Student
Course
Enrollment
```

This becomes important later for schema design.

---

# 4. Relational algebra

Don't spend forever here, but understand it.

- Selection
- Projection
- Union
- Intersection
- Difference
- Cartesian product
- Rename
- Join
- Division

Especially understand the relationship between:

```text
Selection → WHERE
Projection → SELECT columns
Join → JOIN
```

Division sometimes appears in theoretical interviews/exams.

---

# 5. SQL — go deep

For backend interviews, this is one of the highest-value sections.

### Basic querying

- SELECT
- WHERE
- DISTINCT
- ORDER BY
- LIMIT / OFFSET
- aliases
- CASE
- NULL handling
- COALESCE
- IN
- BETWEEN
- LIKE

### Aggregation

- COUNT
- SUM
- AVG
- MIN/MAX
- GROUP BY
- HAVING

Know:

> WHERE vs HAVING

### Joins

Very important.

- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- FULL OUTER JOIN
- CROSS JOIN
- SELF JOIN

You should understand joins visually rather than memorizing definitions.

Also:

- semi joins
- anti joins

For example:

> Find users who have never placed an order.

### Subqueries

- scalar subqueries
- correlated subqueries
- `IN`
- `EXISTS`
- `NOT EXISTS`

Understand:

> `IN` vs `EXISTS`

and why `NOT IN` can behave unexpectedly with NULLs.

### CTEs

```sql
WITH ...
```

- normal CTE
- recursive CTE

### Window functions

**Definitely learn these.**

- `ROW_NUMBER`
- `RANK`
- `DENSE_RANK`
- `LAG`
- `LEAD`
- `SUM() OVER`
- `AVG() OVER`
- `PARTITION BY`
- window ordering
- frames

Classic:

> Find the second-highest salary in every department.

---

# 6. Functional dependencies

Now we enter proper DBMS theory.

Understand:

\[
X \rightarrow Y
\]

meaning X functionally determines Y.

Study:

- trivial FD
- non-trivial FD
- completely non-trivial FD
- closure of attributes
- closure of FD sets
- Armstrong's axioms
  - reflexivity
  - augmentation
  - transitivity

Derived rules:

- union
- decomposition
- pseudotransitivity

Then:

- finding candidate keys using closure
- minimal/canonical cover
- extraneous attributes

Candidate-key problems are worth practicing manually.

---

# 7. Normalization

One of the classic interview areas.

Don't memorize:

> “3NF removes transitive dependency.”

Understand **what anomaly we're eliminating.**

Start with:

- insertion anomaly
- update anomaly
- deletion anomaly

Then:

### 1NF

Atomic values.

### 2NF

1NF + eliminate partial dependency on candidate keys.

### 3NF

Eliminate problematic transitive dependencies.

### BCNF

For every non-trivial:

\[
X \rightarrow Y
\]

X should be a superkey.

Understand carefully:

> **3NF vs BCNF**

Then:

- 4NF
- multivalued dependencies
- 5NF / join dependency — conceptual knowledge is usually enough

Also learn:

- lossless decomposition
- dependency preservation

And importantly:

### Denormalization

Why real production databases sometimes intentionally duplicate data.

---

# 8. Storage engine fundamentals

This is where I'd go deeper than standard college DBMS.

A database ultimately has to turn:

```sql
SELECT ...
```

into disk/memory operations.

Understand:

```text
SQL
 ↓
Parser
 ↓
Planner / Optimizer
 ↓
Execution Engine
 ↓
Storage Engine
 ↓
Pages
 ↓
Disk
```

Study:

- pages / blocks
- records
- tuples
- page layout
- heap files
- slotted pages
- free-space management

Then:

- disk vs RAM
- sequential vs random I/O
- locality
- page cache / buffer pool

The key realization:

> Databases generally manipulate pages, not individual bytes directly on disk.

---

# 9. Indexing — very deep

One of the most important sections for backend interviews.

Start with why an index exists.

Without index:

\[
O(n)
\]

scan.

Then study:

### B-Tree / B+ Tree

Understand:

- nodes
- fanout
- root/internal/leaf nodes
- page-sized nodes
- search
- insert
- split
- delete
- merge
- tree height

And **why databases prefer B+ trees rather than ordinary binary trees.**

### Hash indexes

Understand when:

```sql
WHERE id = 123
```

works well versus:

```sql
WHERE age > 25
```

### Clustered vs non-clustered indexes

Understand physically what these mean.

### Composite indexes

Given:

```sql
INDEX(a, b, c)
```

reason about:

```text
WHERE a = ?
WHERE a = ? AND b = ?
WHERE b = ?
WHERE a = ? AND c = ?
```

Learn the **leftmost-prefix idea**.

Then:

- covering indexes
- index-only scans
- secondary indexes
- unique indexes
- partial indexes
- expression indexes

And costs:

> Why not index every column?

Because indexes cost storage and make writes more expensive.

---

# 10. Query execution

Suppose you write:

```sql
SELECT *
FROM users
WHERE email = 'x@example.com';
```

What actually happens?

Study:

- parsing
- semantic analysis
- query rewriting
- planning
- optimization
- execution

Execution strategies:

- sequential scan
- index scan
- index-only scan

For joins:

### Nested-loop join

Conceptually:

\[
O(NM)
\]

though indexing changes the real cost considerably.

### Hash join

Build hash table → probe.

### Sort-merge join

Sort both inputs → merge.

Understand **when each is useful.**

---

# 11. Query optimizer

This is worth dedicated study.

The database may have:

```sql
A JOIN B JOIN C
```

but doesn't necessarily execute them in that written order.

Study:

- cost-based optimization
- statistics
- cardinality estimation
- selectivity
- histograms
- join ordering
- execution plans

Learn to read:

```sql
EXPLAIN
```

and:

```sql
EXPLAIN ANALYZE
```

at a basic practical level.

Important interview question:

> Query is slow. What do you do?

You should be able to investigate rather than immediately saying “add an index.”

---

# 12. Transactions

**Extremely important.**

A transaction:

```text
BEGIN

read A
modify A
modify B

COMMIT
```

Study ACID properly.

### Atomicity

All or nothing.

### Consistency

Transaction preserves database invariants.

### Isolation

Concurrent transactions shouldn't produce invalid observable behaviour.

### Durability

Committed changes survive failures.

But don't stop at definitions.

---

# 13. Concurrency anomalies

Suppose:

```text
T1                  T2

read balance=100
                    read balance=100
+20
                    -50
write 120
                    write 50
```

You just lost an update.

Study:

- dirty read
- dirty write
- lost update
- non-repeatable read
- phantom read
- write skew

You should be able to construct examples for each.

---

# 14. Isolation levels

Learn the standard levels:

```text
Read Uncommitted
        ↓
Read Committed
        ↓
Repeatable Read
        ↓
Serializable
```

Understand what anomalies each allows/prevents, but be careful: actual behavior differs somewhat between database implementations.

Don't just memorize a table.

Understand:

> Why don't we always use SERIALIZABLE?

Concurrency has a cost.

---

# 15. Serializability

College DBMS + interviews often go deeper here.

Study:

- schedules
- serial schedules
- concurrent schedules
- conflict equivalence
- conflict serializability
- precedence/serialization graph
- view serializability

Be able to solve:

```text
R1(X)
W1(X)
R2(X)
W2(X)
```

and determine whether the schedule is conflict serializable.

Also:

- recoverable schedules
- cascadeless schedules
- strict schedules

---

# 16. Locks and concurrency control

Understand:

### Shared lock

Read.

### Exclusive lock

Write.

Compatibility roughly:

| | S | X |
|---|---:|---:|
| S | ✓ | ✗ |
| X | ✗ | ✗ |

Then:

- row locks
- table locks
- intention locks
- lock escalation
- lock granularity

### Two-phase locking

```text
Growing phase → acquire locks
Shrinking phase → release locks
```

Study:

- 2PL
- strict 2PL
- rigorous 2PL

---

# 17. Deadlocks

Classic interview topic.

Example:

```text
T1 locks A
T2 locks B

T1 wants B
T2 wants A
```

Study:

- deadlock conditions
- wait-for graph
- detection
- prevention
- avoidance
- timeout
- victim selection
- rollback

Connect this with OS deadlocks later, but database deadlocks have their own operational behavior.

---

# 18. MVCC

**Very important for modern databases.**

Instead of making readers and writers constantly block each other, maintain multiple row versions.

Conceptually:

```text
Row v1
Row v2
Row v3
```

Transactions see versions appropriate to their snapshots.

Study:

- snapshots
- transaction IDs
- row versions
- visibility
- snapshot isolation
- old-version cleanup
- vacuuming concept
- MVCC vs locking

PostgreSQL is particularly useful to study here.

Understand:

> Why can a reader see an old value while another transaction has already updated the row?

---

# 19. Optimistic vs pessimistic concurrency

### Pessimistic

Lock first.

```sql
SELECT ... FOR UPDATE
```

### Optimistic

Read version:

```text
version = 7
```

Then:

```sql
UPDATE ...
WHERE id = 1
AND version = 7
```

If zero rows changed, somebody modified it.

Study:

- compare-and-swap
- version columns
- optimistic concurrency control

And know when contention determines which approach is sensible.

---

# 20. Logging and recovery

Now connect transactions to physical durability.

Study:

### WAL — Write-Ahead Logging

The basic invariant:

> log the change before the corresponding data page is persisted.

Understand:

```text
Transaction
    ↓
WAL
    ↓
Commit acknowledgement
    ↓
Data pages eventually flushed
```

Study:

- log records
- redo
- undo
- checkpoints
- crash recovery
- dirty pages

Conceptually understand ARIES:

- analysis
- redo
- undo

No need to memorize every ARIES implementation detail unless you're targeting database-heavy roles.

---

# 21. Buffer pool

Very important database internal.

Disk is slow, so DB keeps frequently accessed pages in RAM.

```text
Query
 ↓
Buffer Pool
 ↓ miss
Disk
```

Study:

- pages
- dirty pages
- pinning
- eviction
- flushing
- replacement policies
- cache hit ratio

This also explains why:

> “The database is on SSD”

doesn't mean every query reads directly from SSD.

---

# 22. LSM Trees

Since you're interested in database internals, definitely learn this.

Write path roughly:

```text
Write
 ↓
WAL
 ↓
MemTable
 ↓
Immutable MemTable
 ↓
SSTable
 ↓
Compaction
```

Study:

- MemTables
- SSTables
- sorted runs
- Bloom filters
- compaction
- tombstones

Then compare:

### B+ Tree

Generally suited to balanced read/write workloads and efficient point/range access.

### LSM Tree

Trades extra complexity/read amplification for very efficient sequentialized writes.

Understand:

- write amplification
- read amplification
- space amplification

Your Shardly work already gives you useful intuition here.

---

# 23. Bloom filters

Small but useful.

A Bloom filter tells you:

> definitely not present

or

> possibly present.

Study:

- bit arrays
- hash functions
- false positives
- no false negatives under normal Bloom-filter semantics
- why LSM databases use them

---

# 24. Replication

Now move from single-node DBMS → distributed databases.

Study:

```text
Primary
 ├── Replica
 ├── Replica
 └── Replica
```

Understand:

- primary/replica
- leader/follower
- synchronous replication
- asynchronous replication
- replication lag
- read replicas
- failover
- promotion

Problems:

- stale reads
- lost writes during failover
- read-after-write consistency

---

# 25. Partitioning and sharding

Distinguish:

### Vertical partitioning

Split columns/tables.

### Horizontal partitioning

Split rows.

Then sharding:

```text
hash(user_id) % N
```

Study:

- shard key selection
- range sharding
- hash sharding
- directory-based sharding
- consistent hashing
- hot shards
- resharding
- cross-shard queries
- cross-shard joins
- distributed transactions

Classic question:

> Why is `country` potentially a terrible shard key?

Because distribution can be extremely uneven.

---

# 26. Distributed transactions

Understand why this:

```text
Service A → DB A
Service B → DB B
```

makes atomicity difficult.

Study:

### Two-phase commit

```text
Prepare
  ↓
Commit
```

Understand coordinator failure and blocking problems.

Then conceptually:

- distributed transactions
- Saga pattern
- transactional outbox
- eventual consistency

These overlap with system design, but DBMS is where you should understand the database side.

---

# 27. Database consistency models

Study:

- strong consistency
- eventual consistency
- causal consistency
- read-your-writes
- monotonic reads

Then:

### Quorums

Given:

\[
N = \text{replicas}
\]

\[
W = \text{write quorum}
\]

\[
R = \text{read quorum}
\]

Understand why people discuss:

\[
R + W > N
\]

and why that equation alone doesn't magically guarantee linearizability.

---

# 28. SQL vs NoSQL

Don't prepare this as a silly:

> SQL = structured  
> NoSQL = unstructured

Instead compare:

- relational model
- schema
- joins
- transactions
- consistency
- access patterns
- scaling strategy
- indexing
- query flexibility

Understand:

- relational DB
- document DB
- key-value DB
- wide-column DB
- graph DB
- time-series DB

And most importantly:

> **Why would I choose one?**

---

# 29. Database design in real applications

Take an application like your booking system.

You should be able to design:

```text
users
events
venues
seats
shows
bookings
booking_items
payments
```

Then reason about:

- primary keys
- foreign keys
- unique constraints
- indexes
- normalization
- transactions
- concurrency

For example:

```text
Two users try to book seat A7 simultaneously.
```

This single problem can test:

- transactions
- row locks
- isolation
- optimistic locking
- unique constraints
- idempotency

That's excellent interview practice.

---

# 30. Practical PostgreSQL

Since you're actually using PostgreSQL/Neon, I'd explicitly study some PostgreSQL rather than keeping everything theoretical.

Understand:

- PostgreSQL process architecture at a high level
- heap storage
- pages
- tuples
- MVCC
- `xmin` / `xmax` concept
- VACUUM
- autovacuum
- dead tuples
- WAL
- checkpoints
- indexes
- query planner
- statistics
- `EXPLAIN ANALYZE`
- connection limits
- connection pooling

You don't need DBA-level PostgreSQL knowledge. You should just be able to connect DBMS theory with a database you've actually used.

---

# What I'd prioritize for interviews

Not every section deserves equal time.

### Tier A — know extremely well

**SQL**
- joins
- aggregation
- subqueries
- CTE
- window functions

**Core DBMS**
- keys
- functional dependencies
- normalization
- indexes
- B/B+ trees
- transactions
- ACID
- concurrency anomalies
- isolation levels
- serializability
- locks
- deadlocks
- MVCC

These should become almost automatic.

### Tier B — strong understanding

- query execution
- query optimizer
- storage/pages
- buffer pool
- WAL
- crash recovery
- optimistic/pessimistic concurrency
- composite/covering indexes
- replication
- partitioning
- sharding
- SQL vs NoSQL

### Tier C — understand rather than memorize

- LSM trees
- Bloom filters
- distributed transactions
- quorums
- advanced PostgreSQL internals
- ARIES details
- 4NF / 5NF
- advanced consistency models

---

The depth test I'd use is different from *“Can I define MVCC?”*

I want you to be able to handle an interviewer chaining questions:

> **Why do we need indexes?**  
> → Why B+ tree?  
> → Why not binary search tree?  
> → What is fanout?  
> → Why are leaves linked?  
> → What happens during insertion?  
> → What is a composite index?  
> → Why isn't `(a,b)` necessarily useful for `WHERE b = ?`?  
> → What's a covering index?  
> → Why not create 30 indexes?  
> → Your query still doesn't use the index. Why?  
> → How would you check what PostgreSQL is actually doing?

If you can survive those chains across **indexes, transactions, isolation, locking/MVCC, normalization, SQL, query execution and storage**, your DBMS prep is genuinely interview-level.

And unlike the system-design syllabus, I **wouldn't add much more than these 30 areas**. This covers the academic DBMS questions, backend interview questions, SQL, practical PostgreSQL, and enough database internals to handle deeper follow-ups.

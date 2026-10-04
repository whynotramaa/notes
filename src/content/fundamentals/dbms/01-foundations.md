@part I | What the database promises | A database gives shared facts one controlled place to live. Without that control, concurrent writes and crashes can turn valid application decisions into invalid stored state. We will separate the database's job, its levels of abstraction and the relational vocabulary. | where:1

## 1. A DBMS instead of a collection of files

Ada and Bo both want seat A7 at Heron's evening show. The website displays "available" to each of them. Ada clicks buy, then Bo clicks buy before Ada's result reaches the screen. The application needs to decide who owns the seat even though neither buyer can see the other's actions.

Imagine storing the inventory in a text file. Each worker opens the file, finds A7 marked free, and writes a reservation. If the workers read before either writes, both decisions use the same old state. Locking only the final file write prevents damaged bytes but does not necessarily prevent the stale decisions: the second worker may patiently wait and then write the reservation it already decided to accept. The entire read-decide-write operation needs coordination.

A **database management system**, or DBMS, is software that stores data and controls how applications query and change it. A **database** is the managed collection of facts. The booking rows are the database. The software admitting writes, checking rules and retrieving those rows is the DBMS. This distinction helps when someone says "the database is slow": the cause may be a query plan, an application transaction, a storage device or a competing workload, rather than the rows themselves.

@fig dbms_file_race | An illustrative failure without a shared concurrency rule. Both buyers can observe "free" before either write arrives.

### What the missing control must do

Start from a single inventory fact: A7 is free. Ada requests a transition to held. The authority checks that the current state is still free, admits the transition and records Ada as the owner. Bo's later request finds held rather than free and fails. Checking and changing must be one indivisible admission operation, or another buyer can enter between them. Later parts show how a conditional UPDATE, row locks and constraints provide that guarantee.

Now add a crash. The database accepts Ada's booking and reports success, but loses power before all its changed table pages reach persistent storage. After restart, it must not tell Ada that the booking never existed. The engine needs a durable record of the accepted operation and a way to reconstruct the pages. Conversely, a partly completed operation that never committed must not appear as a successful purchase. These are recovery problems, separate from the original concurrent decision.

The DBMS also checks that Ada is a real customer and A7 is a real seat in the intended show. It finds bookings without making every client scan every byte. It controls which role may read personal data or change inventory. Those jobs share a reason: every application must use the same authoritative rules, including a future script that the original web developer never anticipated.

:::story Picture this
A shared calendar cannot reserve a room safely if everyone edits a separate photocopy. A clerk accepts requests against one authoritative calendar and rejects overlapping reservations. The analogy explains admission control; the database also needs to preserve that calendar if the clerk's desk loses power.
:::

### Files and the guarantees above them

A DBMS commonly stores persistent data in files too. The useful comparison is the set of guarantees supplied above those files. A filesystem provides names, permissions, block allocation and its own persistence rules. It does not know what a booking is, how seat identity includes a show, or why two active owners would be invalid. You can implement those rules over files, but then your application owns their locking, query structures and recovery log.

Files are often sufficient for an immutable export, a configuration file or a single-writer interchange format. The cost changes when there are competing writers, relationships, indexed searches and multi-record operations. Using a DBMS shares tested machinery across those requirements; it does not excuse an incorrect business rule or eliminate the need to choose the right transaction boundary.

A **relational DBMS**, or RDBMS, uses relations as its logical data model. DBMS is the wider category: document, key-value and graph engines also manage databases. SQL is a query language associated with many relational engines, but "supports SQL" and "has a relational model" are not identical claims. We begin with relational systems because their explicit dependencies, constraints and transactions make the booking example easy to reason about.

:::interview Interview lens
**"Why use a database instead of files?"** A database supplies shared constraints, concurrency control, querying and recovery over persistent data. Files can be sufficient for an immutable export or a small single-writer format. For competing reservations, I need the availability check and claim to be one coordinated operation, and I need accepted claims to survive the specified failures. Implementing those mechanisms directly over files means taking responsibility for the same problems a DBMS solves.
:::

## 2. Architecture, schemas and independence

Heron adds an index to speed up finding a customer's email. The query should still mean the same thing. If every client had to know where the row sat on disk, changing an index or moving a record would force application rewrites. Database architecture separates what the data means from how its bytes are arranged.

A **schema** describes data structures and rules. An **instance** is the data in those structures at a particular moment. Creating `users(id, email)` changes the schema; inserting Ada changes the instance. A table can keep the same schema while its instance grows, and a schema migration can change structures while retaining most of the existing facts.

The physical level describes pages, files and access paths. The logical level describes relations, attributes and relationships. The view level presents a chosen interface to a user. A **view** is a named query that exposes such an interface; it can omit attributes or combine facts without requiring the user to understand every base table.

@fig dbms_abstraction | An index changes the physical level. The customer-facing availability view need not change.

### Follow one availability request through the levels

The customer interface asks for available seat codes in a show. Its view may expose only `show_id`, `seat_id` and `price`, leaving internal version or maintenance fields hidden. At the logical level, the view refers to `show_seats` and a predicate over `state`. At the physical level, an index may locate the show's rows and the buffer pool may already hold the corresponding pages.

Replace the physical scan with an index lookup. The rows promised by the query remain the same. This is **physical data independence**: changing storage does not require changing the logical meaning presented to the application. It has limits in performance and operational behaviour, but the interface should not depend on record byte offsets.

Now split an old `users` table into identity and profile tables while preserving a view with the old columns. Existing readers can keep using that view. This illustrates **logical data independence**, where an external interface can survive some logical schema changes. It is harder to provide: dropping information a client genuinely needs cannot be hidden by renaming a table. Updates through the compatibility view may also need explicit rules.

### Client and engine responsibilities

In an embedded architecture, the engine runs inside the application process and accesses its managed storage directly. In a client-server architecture, a client sends requests to a server process that owns database coordination. The client may validate an input for usability, but database constraints remain necessary because other clients can bypass that validation. A trusted writer script must not gain permission to violate a shared identity rule merely because it has a different entry point.

Inside the engine, request handling checks the statement, planning chooses operators, execution asks storage for records, and storage uses cached or persistent pages. These are responsibilities, not a promise that every product assigns each to one separate process. PostgreSQL's concrete process model appears near the end, after we know what the components have to do.

| Command family | Job | Examples |
|---|---|---|
| DDL, data definition | Change structures | `CREATE`, `ALTER`, `DROP` |
| DML, data manipulation | Read or change rows | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| DCL, data control | Set privileges | `GRANT`, `REVOKE` |
| TCL, transaction control | Set a transaction boundary | `BEGIN`, `COMMIT`, `ROLLBACK` |

These categories organize the interface rather than describe different storage engines. Some curricula call SELECT data query language separately; explain its job instead of arguing over the teaching label. A database administrator manages operation and access, a designer defines the schema, an application programmer defines workflows, and reporting users read selected facts. Database roles encode which actions each is allowed to take.

:::note Views and permissions
A view does not automatically make an application secure. Its ownership rules, grants and the caller's access to underlying tables matter. Keep query abstraction separate from an explicit permission design.
:::

## 3. The relational model, NULL and constraints

Print Heron's inventory as a table. Each row says that a particular seat exists in a particular performance and has a current state. If the table says A7 belongs to both the evening and afternoon show, that can be correct: the row's identity includes the show. If it says A7 has two incompatible current states within the same show, the model needs a rule that rejects that instance.

A **relation** is a set of tuples described by attributes. A **tuple** is a row. An **attribute** is a named column. A **domain** is the set of permitted values for an attribute. A seat-state domain might admit `free`, `held` and `sold`, while a price domain admits the chosen numeric representation. Domains describe meaningful values, not merely how many bytes a programming language allocates.

A relation's **degree** is its number of attributes. Its **cardinality** is its number of tuples. The printed projection below has degree 3 and cardinality 3. Heron's full inventory has 8 shows with 100 seats each, so its cardinality is $8\times100=800$. Read that multiplication as "one inventory row for every show-seat pair." The number of columns does not grow merely because another show is added.

@fig dbms_relation | Illustrative projection of three inventory tuples. The full inventory has 8 × 100 = 800 rows.

### Set semantics and SQL's differences

A mathematical relation has no duplicate tuples and no intrinsic row order. Its attributes identify their meanings, so a printed arrangement is only a presentation. A database can store the rows in any arrangement that supports its operations. An index's order is an access path, not automatically the result order promised to a query.

SQL usually uses **bag semantics**, which preserve duplicate results unless the query removes them. Ada has two bookings priced at 120. `SELECT price FROM bookings` legitimately returns 120 twice, because two rows contribute that value. `SELECT DISTINCT price FROM bookings` returns the distinct values 120 and 80, without promising their order. `ORDER BY price` adds an order guarantee. Sorting and removing duplicates are separate operations.

A table may also contain duplicate entire rows unless its constraints prevent them. That is why the relational ideal and an unconstrained SQL table are not interchangeable. We should declare the identifying attributes rather than assume a familiar table shape enforces them. Section 4 makes this identity argument precise with candidate and primary keys.

### Missing is not zero or an empty string

**NULL** represents an absent or unknown value outside ordinary comparison semantics. Suppose Heron has not yet recorded a payment reference. An empty string is a known string of zero length; zero is a known numeric value; NULL says that the reference is absent or unknown. Substituting one for another changes what the data claims.

Comparisons with NULL normally produce UNKNOWN. `payment_ref = NULL` therefore does not find missing references. `payment_ref IS NULL` tests the absence explicitly. A WHERE clause keeps TRUE conditions and discards both FALSE and UNKNOWN. This explains why a query can drop a row with a missing value even when the programmer thinks the negated comparison "must be true."

NULL also affects aggregates and joins. `COUNT(*)` counts rows, while `COUNT(payment_ref)` counts present references. An outer join uses NULL to extend an unmatched side, which is not the same as proving that a real matched row had a missing field. SQL's later sections work these cases through against actual input and output rows.

A **constraint** is a database-enforced rule about legal state. A key rejects duplicate identity, a foreign key checks a reference, and a value check rejects an invalid state or amount. Not every business rule fits one row-level CHECK. A total across several rows or a concurrent capacity decision needs a transaction-aware mechanism. The point of relational modelling is to say which facts exist and which combinations are legal before choosing how quickly to retrieve them.

:::warn Watch out
Do not confuse a relation's cardinality with relationship cardinality in an ER diagram. The first counts rows; the second describes how many entities may participate. A primary key does not make every SELECT return key order, and NULL does not behave like an ordinary sentinel value.
:::

:::key In one breath
The DBMS controls shared data, while the database is the data it manages. Schema and instance separate structure from current contents; physical, logical and view levels separate storage from interfaces. Relations organize tuples over domains, while SQL adds duplicate and NULL behaviour that must be considered explicitly. Constraints state the rules that every admitted write must obey, and transactions coordinate rules that span an operation.
:::

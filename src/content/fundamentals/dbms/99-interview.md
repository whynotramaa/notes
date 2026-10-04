@chapter faq | Interview question bank | Explain the invariant first, then the mechanism and the failure boundary. Hide the figures while answering and use the running fixture for arithmetic.

### Foundations

**Q1. What does a database add beyond a file of records?**

It coordinates queries, constraints, concurrent changes and durable recovery under a stated contract. A file format stores bytes but does not itself decide which concurrent transaction wins. The database's guarantees depend on its engine and configuration.

**Q2. What is data independence?**

It separates the application's logical view from particular storage choices. An index can change without changing the intended result of a query. This does not mean every physical change has no performance or compatibility cost.

**Q3. How do cardinality and degree differ?**

Cardinality counts rows and degree counts attributes in the relation being discussed. Heron's tiny three-row, three-column seat example has both equal to three. The equal values are incidental; the concepts measure different things.

**Q4. Why distinguish a database from its management system?**

The database is the organized stored data, while the management system executes operations and enforces its contracts. Keeping the distinction helps separate a bad data model from a faulty execution or recovery mechanism. Both affect the application's result.

### Keys and modelling

**Q5. Candidate key or primary key?**

A candidate key is a minimal attribute set that uniquely identifies a row under the declared dependencies. A primary key is the chosen candidate used as the main identity. Minimal means no attribute can be removed while retaining uniqueness.

**Q6. Can a foreign key point at a missing parent?**

A properly enforced non-null reference must match the declared referenced key. Nullability and deferred enforcement change when or whether the check applies. The application still needs business rules beyond simple reference existence.

**Q7. Why is a show-seat key different from a physical seat key?**

The same physical seat can be sold for different performances. Inventory identity therefore includes the show and seat. Using only the seat would wrongly prevent legitimate sales across shows.

**Q8. What does an ER relationship become in tables?**

A relationship becomes a key reference or an association relation according to its cardinality and attributes. A many-to-many relation usually needs an association table with the appropriate key. Preserve relationship constraints rather than merely drawing an arrow.

### Relational algebra and SQL

**Q9. WHERE or HAVING?**

WHERE filters rows before grouping, while HAVING filters groups after aggregation. Using an aggregate condition in the wrong stage changes the problem or makes the query invalid. Trace the input rows before describing the final total.

**Q10. Why can a predicate turn a LEFT JOIN into an effective INNER JOIN?**

A right-side predicate in WHERE can reject the null-extended unmatched rows. Put a matching restriction in the join condition when unmatched left rows must remain. The placement changes which stage decides survival.

**Q11. Why is NOT IN dangerous with NULL?**

A comparison against a null member can produce unknown rather than true. SQL's three-valued logic then removes rows a reader expected to pass. Use a properly correlated NOT EXISTS when that expresses the intended absence test.

**Q12. RANK or DENSE_RANK?**

Both give ties the same rank. RANK leaves gaps after ties, while DENSE_RANK advances only for a new distinct value. ROW_NUMBER instead assigns separate positions and needs a deterministic ordering when ties matter.

### Dependencies and normalization

**Q13. What does a functional dependency say?**

Equal values of the determinant require equal values of the dependent attributes within the relation. It describes a rule for valid states, not just a coincidence in one sample. A candidate key determines every attribute under the declared rules.

**Q14. Why compute attribute closure?**

Closure finds everything implied by a starting attribute set and the dependencies. It tests keys and helps reason about decomposition. Repeatedly apply rules until no new attribute appears.

**Q15. How do 3NF and BCNF differ?**

BCNF requires every nontrivial dependency's determinant to be a superkey. Third normal form allows a narrower exception involving a prime dependent attribute. A BCNF decomposition can lose dependency preservation even when it remains lossless.

**Q16. Is denormalization always a mistake?**

No, it can serve a measured read path by storing repeated or precomputed data. It introduces maintenance and consistency obligations when source values change. State the workload benefit and the update protocol instead of calling duplication harmless.

### Storage and indexes

**Q17. Why is a page different from a row?**

A page is a storage and buffering unit that can contain several records plus metadata. A row is a logical relation member and may have several physical versions. Device reads and row counts therefore do not correspond one to one.

**Q18. Why does a B+ tree support ranges?**

Its ordered keys guide the initial lookup, and leaf order supports following adjacent entries. A hash lookup does not provide that same ordered path. Tree shape and storage pages determine the actual traversal cost.

**Q19. What does a composite index's leading key control?**

It controls the lexicographic ordering of index entries. A query on later attributes alone may not define one selective contiguous range. Equality on a leading prefix and an appropriate subsequent range can match the index well.

**Q20. Does a covering index guarantee no heap access?**

It contains the required projected values, which is a prerequisite for avoiding value fetches. Visibility and engine rules may still require heap checks. Index-only behavior must be explained using the actual engine's visibility mechanism.

### Query execution

**Q21. Why can a nested-loop join be expensive?**

Without a helpful inner access path, it can compare each outer row against every inner row. Heron's 100 users and 160 bookings give 16,000 pair comparisons in that simple model. An indexed inner lookup changes the cost, so name the plan before quoting the product.

**Q22. What does a hash join build?**

It builds a hash structure from one input's join keys and probes it with the other. Memory limits and spill behavior affect the cost. Duplicate keys still require producing every matching result rather than one value per key.

**Q23. Why can an optimizer choose the wrong plan?**

It compares estimated costs using statistics and model assumptions. Skew or correlated predicates can make the expected row counts wrong. Heron's estimated 16 versus actual 80 gives a fivefold count error at that boundary.

**Q24. What does EXPLAIN ANALYZE do that EXPLAIN does not?**

It executes the statement and reports observed execution information. A write can therefore change data during analysis. Its timings also need interpretation with loops, waits and measurement overhead.

### Transactions and schedules

**Q25. What is the job of atomicity?**

It makes a transaction's admitted changes form one all-or-nothing outcome under its failure contract. A local transaction does not automatically include an external email or payment provider. Name the participant set before promising atomic effects.

**Q26. Does ACID consistency replace business validation?**

No, the database preserves the rules it actually enforces. An invalid but unconstrained business update can commit atomically. Schema constraints and correct application transitions establish which states are legal.

**Q27. What is a serializable schedule?**

Its transactional result and relevant observations obey an allowed serial execution equivalence under the stated definition. Transactions may still overlap physically. The application can need retries when the engine aborts conflicting work.

**Q28. Why is isolation not the same as durability?**

Isolation controls interactions among concurrent operations. Durability controls survival of acknowledged results under the named persistence boundary. Correct ordering in RAM does not make that RAM survive power loss.

### Concurrency control

**Q29. How does a lost update happen?**

Two transactions read an old value and independently write results based on it. One write replaces the other instead of incorporating both. An atomic increment or validated version update changes that mechanism.

**Q30. How can write skew survive snapshot reads?**

Transactions can read a shared condition but update different rows. Their individual row changes need not conflict while the combined result violates an invariant. Serializable enforcement or a shared lock target can protect that wider condition.

**Q31. Two-phase locking or two-phase commit?**

Two-phase locking constrains lock acquisition and release to control schedules. Two-phase commit coordinates one decision across prepared participants. A distributed system can use both, but the phases solve different problems.

**Q32. Why must a deadlock victim retry the transaction?**

The engine aborts one participant to break the wait cycle. Its prior reads may no longer justify the same decision after other transactions proceed. Retry the complete logical transaction under a bounded policy and stable operation identity.

### MVCC and recovery

**Q33. What does MVCC preserve for a reader?**

It provides versions that a snapshot may observe while other transactions change data. It does not remove every write conflict or every maintenance obligation. Old versions must remain until valid readers no longer require them.

**Q34. Why must WAL reach durable storage before its data page?**

Recovery needs the relevant record if the page change persists and later recovery must interpret or reconstruct it. Merely appending to userspace memory is insufficient. The engine's flush contract determines what survives the named failure.

**Q35. Why does ARIES redo unfinished history?**

Redo reconstructs the logged history under its page-position rules, then undo reverses unfinished transactions. Compensation records make undo restartable. Repeating history and presenting committed state are separate phases.

**Q36. What does a Bloom-filter positive prove?**

Only possible membership. Another key may have set the same positions, so the engine still checks the real data. A negative is decisive under intact insertion-only filter semantics and consistent hashing.

### Distributed databases

**Q37. What can asynchronous promotion lose?**

A follower may not have received or persisted an acknowledged primary change. Promotion must compare history against the required durability boundary. Routing to a reachable replica cannot recreate missing updates.

**Q38. Why does a shard key need workload reasoning?**

It controls locality and concentration of rows and requests. A show key keeps reservation work local but can make a popular show hot. Equal key counts do not imply equal request cost.

**Q39. Why can two-phase commit block?**

A participant that voted YES promised to honor the coordinator's durable decision. If that decision is unavailable, guessing abort can conflict with a commit already learned elsewhere. Prepared state remains until recovery establishes the valid outcome.

**Q40. What does R plus W greater than N prove?**

It proves overlap for read and write sets drawn from the same N replicas. Correct version selection, ordering and membership rules remain necessary. The inequality alone does not establish linearizability.

### Application design and PostgreSQL

**Q41. How do you compare SQL and NoSQL?**

I compare access patterns, constraints, transaction scope, indexes, query flexibility and scaling. NoSQL names several different data models rather than one guarantee. A choice must explain how the application's invariant and queries are implemented.

**Q42. Why use an outbox with a booking?**

It commits the booking and intent to publish together locally. The relay retries uncertain sends from retained intent, and consumers deduplicate stable event identities. It avoids a missing publication after a business commit without claiming remote effects share that commit.

**Q43. Why can VACUUM fall behind despite successful commits?**

Commits do not make every old version immediately reclaimable. Old snapshots and continuing version generation affect cleanup. Inspect visibility lifetime and maintenance progress as well as disk space.

**Q44. Why can more database connections increase latency?**

They can increase active contention and memory demand beyond the engine's useful concurrency. A pool should bound work within the global server budget. Heron's eight pools of twenty demand 160 sessions against only 64 allowed for applications.

### The complete reservation

**Q45. What prevents both buyers from reserving A7?**

An atomic inventory transition or appropriate locking and recheck enforces one active show-seat claim. A uniqueness constraint can protect the claim representation where it lives. A previous SELECT alone is not sufficient evidence at write time.

**Q46. What does the toy inventory storage total include?**

It includes 26 heap pages and 5 index pages under the declared teaching layout. That is 126,976 bytes per copy. It excludes other tables, WAL, backups and obsolete physical versions.

**Q47. Walk me through a committed booking whose response is lost.**

The booking, seat state and local publication intent remain committed under the persistence contract. A repeated submit key finds the existing result rather than creating another claim. Publication and payment recovery use their own stable identities and reconciliation rules.

**Q48. Walk me through the whole reservation from SQL to recovery.**

Parse and bind the request, choose and execute an access path, select visible state and atomically claim the inventory. Record the booking and outbox in the same transaction, then acknowledge only at the configured durable boundary. Buffer pages, indexes, concurrency rules and WAL each supply a distinct part of that result; replicas and external effects need their own recovery contracts.

@chapter exercises | Exercises | The fixture and page layout are illustrative. One dot is arithmetic, two require a trace or explanation, and three require a proof, derivation or implementation.

### Data, SQL and storage

**E1** ● Compute the front-matter core row count from 100 users, 8 shows, 100 seats per show and 160 bookings.

**E2** ● Compute Ada's and Bo's fixture spending from prices 120, 120 and 80, and the total revenue.

**E3** ● Give RANK and DENSE_RANK for descending values 90, 90, 70 and 50.

**E4** ● Compute records per toy page with 4,096 bytes, a 64-byte header, 124-byte records and 4-byte slots. Find unused usable space on a full page.

**E5** ● Compute heap pages and allocated heap bytes for 800 inventory records using E4.

**E6** ● Compute leaf capacity, leaf pages, final-leaf entries and index bytes with 16-byte entries and one root page.

**E7** ● Compute the naive nested-loop comparisons for 100 users and 160 bookings. Compare the 260 input visits of a build-and-probe hash model, excluding collision and output work.

**E8** ● Compute the actual-to-estimated row ratio for an estimate of 16 and observed count of 80.

**E9** ● Compute write amplification when 4,096 logical changed bytes cause 4,096 WAL, 8,192 flush and 16,384 compaction bytes.

**E10** ● Compute the minimum read-write overlap for N=3, R=2 and W=2. State what the arithmetic alone does not prove.

### Traces and application reasoning

**E11** ●● Compute the primary-to-visible-follower lag from visibility at 100 and 120 milliseconds. Compare local acknowledgement at 5 with waiting for required completions at 5, 8 and 12.

**E12** ●● Compare four 200-row shards with the skewed counts 650, 50, 50 and 50. Find the first shard's fraction and its ratio to the equal share.

**E13** ●● Reconcile eight 20-session application pools against a server limit of 80 with 16 operationally reserved. Give a per-instance bound for eight equal pools.

**E14** ●● Explain without equations why an earlier available-seat SELECT cannot prevent two buyers from winning.

**E15** ●● Explain without equations why an index and a lock solve different problems in a reservation.

**E16** ●● Explain without equations why a faithful replica is not a complete backup against an accidental deletion.

**E17** ●● Trace recovery of X=100 and Y=100 when committed T1 writes X=120 and unfinished T2 writes Y=50 in the declared undo/redo model.

**E18** ●● A Bloom mask has four set positions among eight bits and a query chooses two independent uniform positions. Compute its false-positive probability under that fixed-mask model. Explain why a positive still needs a lookup.

**E19** ●● Trace a lost outbox publication confirmation and show why stable event identity remains necessary.

**E20** ●● Trace a version check when Ada and Bo both observe version 7 and Ada commits version 8 first.

### Proofs and implementation

**E21** ●●● Prove quorum overlap when R+W>N for two sets inside the same N-member universe. Explain one protocol assumption outside that proof.

**E22** ●●● Given A→B, B→C and AC→D, derive the closure of A and prove A is a candidate key for ABCD under these dependencies.

**E23** ●●● Write a short Python reservation function around an atomic SQL update. Return failure if no row is claimed, insert a booking only on success and keep the operations in one transaction.

**E24** ●●● Explain the blocking state when both 2PC participants voted YES but cannot recover the coordinator's decision. Show why neither may invent an abort outcome.

**E25** ●●● Count all inventory heap and index bytes in one toy copy and three copies. Reconcile the full and partial heap and leaf pages, then state the structures excluded from that count.

@chapter solutions | Worked solutions | The computations use scripts/fundamentals/numbers.py. Exact counts stay integral, and decimal results use their explicitly stated model.

**E1.** Inventory has $8\times100=800$ rows. Summing $100+8+800+160$ gives 1,068 core rows. Expanded application tables are outside this front-matter subtotal.

**E2.** Ada spends $120+120=240$, Bo spends 80 and revenue is $240+80=320$ currency units. The average booking price is $320/3=106.666667$ after rounding, though the question does not require that average.

**E3.** RANK gives 1, 1, 3, 4 because the tied first pair occupies two positions. DENSE_RANK gives 1, 1, 2, 3 because it advances once for each distinct value. ROW_NUMBER would give 1, 2, 3, 4 with a defined tie-breaking order.

**E4.** Usable bytes are $4096-64=4032$. Record and slot cost is $124+4=128$, so $\lfloor4032/128\rfloor=31$ records fit. They use $31\times128=3968$ bytes, leaving $4032-3968=64$ usable bytes.

**E5.** $\lceil800/31\rceil=26$ heap pages. Their allocation is $26\times4096=106496$ bytes. The first 25 full pages hold $25\times31=775$ rows, leaving $800-775=25$ on the final page.

**E6.** A leaf holds $\lfloor4032/16\rfloor=252$ entries. Four leaves are needed because $\lceil800/252\rceil=4$, with $800-3\times252=44$ in the final leaf. Adding one root gives five pages and $5\times4096=20480$ bytes.

**E7.** The naive comparison count is $100\times160=16000$. The declared hash build-and-probe input model visits $100+160=260$ rows. These are different counted operations; collisions, output cardinality, memory and spills prevent treating their ratio as a measured speedup.

**E8.** $80/16=5$ times. Actual selectivity is $80/800=0.1$ while the estimated fixture selectivity is $16/800=0.02$. The error identifies a planning assumption to inspect, not proof that one particular index must win.

**E9.** Physical writes total $4096+8192+16384=28672$ bytes. Amplification is $28672/4096=7$ physical written bytes per logical changed byte under this accounting boundary. Do not add the logical changed bytes again to the physical total.

**E10.** Minimum overlap is $R+W-N=2+2-3=1$. The count does not establish correct version selection, concurrency ordering or linearizability. It also assumes both sets belong to the same fixed membership.

**E11.** Visible lag is $120-100=20$ milliseconds. Local acknowledgement is 5, while waiting for the declared required persistence completions takes $\max(5,8,12)=12$. Added wait is $12-5=7$ milliseconds, assuming those times share one origin rather than representing serial stages.

**E12.** Both distributions total 800 rows. The skewed first shard holds $650/800=0.8125$, or 81.25 percent. Its ratio to the equal share is $650/200=3.25$. Traffic concentration remains a separate measurement.

**E13.** Planned application demand is $8\times20=160$ sessions. The usable application budget is $80-16=64$. Eight equal pools can each hold $64/8=8$ connections, giving $8\times8=64$ and retaining the declared operational reserve.

**E14.** The seat can change between a read and a later write. Both buyers can read available before either commits. The update must atomically require available state, or the transaction must lock and recheck under its isolation rules, so only a valid current claim creates a booking.

**E15.** The index finds the inventory efficiently. The lock or atomic predicate decides whether a conflicting buyer may change it now. Finding the same row quickly for both buyers does not coordinate their effects; keeping them separate in the explanation prevents a performance mechanism from being mistaken for an invariant.

**E16.** Replication normally propagates valid changes, including an accidental deletion. A separate retained history or recoverable backup can restore a previous state under its policy. More current copies protect some machine failures while faithfully preserving the same mistaken update.

**E17.** Analysis identifies T1 as committed and T2 as unfinished. Redo restores the relevant history to X=120 and Y=50 where pages lack it. Undo then restores Y=100 while retaining X=120. Page positions and compensation records make this recovery restartable; this is the declared textbook model rather than a claim that PostgreSQL performs identical physical undo.

**E18.** Each independent query position lands on a set bit with probability $4/8=1/2$. Both do so with probability $(1/2)^2=1/4=25$ percent. A positive can arise from collisions, so the real membership lookup is still required. This exact fixed-mask result differs from the general approximate Bloom formula.

**E19.** The business row and outbox event commit together. The relay publishes, but its confirmation is lost before the sent marker commits. Restart finds the retained unsent row and publishes it again. The consumer receives the same event identity and recognizes any earlier committed effect rather than treating the replay as another booking.

**E20.** Ada atomically compares version 7 and changes the row to version 8. Bo's later comparison against 7 fails. The application must inspect that failure and report conflict or retry from current state. A separate version SELECT followed by an unconditional UPDATE would not supply the atomic comparison used in this trace.

**E21.** Suppose the read and write sets were disjoint. Their union would contain R+W distinct members, but the universe contains only N, contradicting R+W>N. Thus intersection has at least R+W-N members by inclusion-exclusion. The argument says nothing about whether the shared replica holds the newest durable version or whether the reader chooses it; those are protocol obligations.

**E22.** Begin with closure {A}. A→B adds B, B→C adds C, and AC→D then adds D, giving ABCD. A therefore determines the whole relation. Removing A leaves the empty set, which cannot activate any supplied dependency, so A is minimal and is a candidate key. Other candidate keys must be assessed against the complete declared dependency set rather than sample row coincidence.

**E23.** The transaction must inspect the conditional update result before admitting a booking. This function assumes driver transaction semantics and a schema where the seat-state claim is the active ownership representation.

```python
def reserve(db, show, seat, user, submit_key):
    with db.transaction():
        claimed = db.execute(
            "UPDATE show_seats SET state='held', version=version+1 "
            "WHERE show_id=%s AND seat_id=%s AND state='free' RETURNING seat_id",
            (show, seat),
        ).fetchone()
        if claimed is None:
            return False
        db.execute(
            "INSERT INTO bookings(user_id, submit_key) VALUES (%s, %s)",
            (user, submit_key),
        )
    return True
```

The full handler must first resolve a repeated submit key and validate its payload, and must insert booking items and outbox intent within the same transaction when those tables are used. An insertion error rolls back the claimed seat. This excerpt demonstrates the atomic admission condition rather than a complete payment workflow.

**E24.** Each YES voter has durably promised it can commit. The coordinator may already have logged COMMIT and informed the other participant before disappearing. Inventing ABORT would then leave inconsistent outcomes. Participants retain prepared state and recover the authoritative decision through the protocol; that inability to finish independently is the blocking boundary.

**E25.** Heap capacity is 31 records per page, yielding 25 full pages with 775 rows and one partial page with 25. Heap bytes are $26\times4096=106496$. Leaf capacity is 252, giving three full leaves with 756 entries and one partial leaf with 44. Four leaves plus one root use $5\times4096=20480$ bytes. One copy totals $106496+20480=126976$ across 31 pages, and three copies total $126976\times3=380928$ across 93 pages. Other tables, WAL, obsolete tuple versions, backups and replication metadata are excluded.

### Primary sources

[PostgreSQL 18 concurrency control](https://www.postgresql.org/docs/18/mvcc.html), [WAL](https://www.postgresql.org/docs/18/wal.html), [replication](https://www.postgresql.org/docs/18/warm-standby.html), [VACUUM](https://www.postgresql.org/docs/18/routine-vacuuming.html) and [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html) provide the engine-specific boundaries. The running page and query fixtures remain explicitly illustrative.

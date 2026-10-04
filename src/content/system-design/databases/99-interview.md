@chapter faq | Interview question bank | Answer with a mechanism, a tiny trace, and the failure boundary it protects.

### Records and constraints

**Q1. What is the difference between a table and a page?**

A table is a logical collection of typed records. A page is a physical unit the engine stores and moves. One row lookup can need several page visits, and several rows can share one page.

**Q2. Why keep both an event identifier and a match sequence?**

They identify different things: the event itself and its ordered position in a match. Enforce both intended uniqueness rules. A global generated identifier does not automatically represent per-match commit order.

**Q3. Why does an application uniqueness check race?**

Two callers can both see absence before either inserts. A shared unique constraint arbitrates the later insertion. Treat the conflict as an expected concurrent result.

**Q4. Does a foreign key make a relationship mandatory?**

A nullable reference can represent no relationship under its matching rules. Add `NOT NULL` for Heron's mandatory scorer reference. Choose deletion behavior separately so closing an account does not accidentally erase event history.

**Q5. What does another index cost?**

It stores another maintained lookup path and adds write, cache, and recovery work. The base table plus two indexes is three logical changed structures per suitable insert. Physical IOPS can be different because pages and logs group work.

### Useful index order

**Q6. Why are B-trees wide?**

A page visit chooses among many child ranges rather than only two pointers. Fan-out, entry width, occupancy, and leaf capacity determine height. Cached upper pages can save physical reads without removing logical search steps.

**Q7. What makes a B+ tree useful for ranges?**

Data entries live at ordered leaves, whose links let a scan continue after finding its lower bound. The scan stops when the upper bound or requested count is reached. Base payload fetches can still add work.

**Q8. What happens when a leaf fills?**

The engine splits or otherwise redistributes entries under its maintenance rules. It updates parent routing and neighboring links. Parent overflow can propagate, so one insert can touch several pages.

**Q9. How would you order the recent-event index?**

Use `(match_id, sequence)` for equality on a match followed by a sequence range and ordering. That creates a contiguous match slice. Check whether the exact query still needs a sort or another scan strategy.

**Q10. Why does a range on an earlier composite key affect later ordering?**

It can include several earlier-key groups, each independently ordered by the later key. Concatenating those groups is not necessarily global later-key order. The physical tuple order is the reason, rather than a rule to memorize without a layout.

**Q11. Why can a covering index still read the table?**

Visibility can require a base-row check, and the planner can choose another path. In PostgreSQL, index-only scans consult visibility information. Inspect actual heap fetches rather than assuming supplied columns settle every requirement.

**Q12. How do clustered and separate indexes differ?**

Clustered organization places base records around one maintained key in engines that support it. A separate index locates base records through another structure. Their different locality affects ranges and the cost of the second hop.

### Query execution

**Q13. What is cardinality?**

It is an operator's row count. Wrong estimates can select bad repeated probes or underestimate memory. Compare estimates with actual rows and multiply appropriate per-loop counts by loops.

**Q14. Why might an engine ignore an index?**

A broad filter can make a sequential scan cheaper than repeated scattered base fetches. Requested columns, order, and buffer state also matter. The existence of an index does not establish that it is the lowest-cost path.

**Q15. What does a bitmap scan change?**

It groups selected row locations by base page before fetching. That can reduce scattered work but needs construction memory and may lose useful index ordering. Include any later sort in the total.

**Q16. When does a nested loop make sense?**

A small outer result and a cheap indexed inner lookup can make repeated probes efficient. Count outer rows and work per probe. A large unexpected outer result can magnify an otherwise small lookup cost.

**Q17. How does a hash join work?**

Build a key-to-rows table from one input and probe it with the other. Equal keys produce matching pairs after the condition is checked. Memory pressure and duplicate groups can add substantial work.

**Q18. How does a merge join handle repeated outer keys?**

It keeps the inner matching position or group while emitting the corresponding outer matches. It advances when the order proves a key cannot match. Duplicate groups on both sides must generate all required pairs.

**Q19. Why is EXPLAIN ANALYZE different from EXPLAIN?**

It executes the statement to observe actual work. A modifying statement can therefore change data. Use the appropriate transaction and environment rather than treating it as a harmless planning-only inspection.

### Transactions and anomalies

**Q20. What belongs in Heron's score transaction?**

The score, ordered event, command identity, saved result, and publication intent share one local boundary. A rollback must not leave a successful command record or an unrecorded score effect. External delivery follows a separate recovery path.

**Q21. Atomicity or consistency?**

Atomicity groups changes; consistency preserves declared invariants through correct constraints and logic. A transaction can atomically perform the wrong amounts. The engine cannot infer every business rule from the fact that statements share a transaction.

**Q22. What failure does durability cover?**

That depends on acknowledgement configuration and surviving storage. Local log flush and remote durable copies cover different failures. Backups and regional recovery need their own retained material and policy.

**Q23. Dirty or non-repeatable read?**

A dirty read sees another transaction's uncommitted value. A non-repeatable read can see two different committed values of the same row. The interleaving determines which anomaly occurred.

**Q24. What is a phantom?**

The repeated predicate returns a different matching set, perhaps because another transaction inserted a row. Existing rows need not change. Protecting only the returned rows does not necessarily protect the predicate's absent matches.

**Q25. What does write skew demonstrate?**

Two transactions can use the same valid snapshot and update different rows into an invalid combined state. Same-row write conflict detection does not catch the dependency. Protect the shared rule using a suitable serializable or common-lock protocol.

**Q26. Why retry the whole serializable transaction?**

Its original reads and decisions may no longer be valid. Reread and recompute, rather than replaying only the failed statement. Preserve operation identity and keep external effects outside unsafe retries.

### Versions and locks

**Q27. Does MVCC remove locks?**

No. It selects visible versions for readers while writers and structural changes still coordinate. A stable view and a safe concurrent business decision are separate promises.

**Q28. Why can an old transaction increase storage?**

Its snapshot may still require versions newer transactions no longer need. Safe cleanup waits until those visibility requirements end. Reusable free space and actual file shrinkage are different outcomes.

**Q29. How does a conditional version update help?**

It expresses the expected application state in the write predicate. A changed version can make the update affect no row, forcing reconciliation. That protects a stale decision only when the caller correctly handles the conflict.

**Q30. How do a deadlock and a long wait differ?**

A deadlock contains a cycle of owners waiting on each other. A long wait can still finish when a progressing owner commits. Timeouts bound waits, while cycle detection identifies a different condition.

**Q31. How do you prevent the two-match deadlock?**

Make every relevant caller acquire matches in the same order. A contender then waits before owning the resource needed by the first transaction. Still handle engine aborts and retry whole transactions.

### Recovery and sessions

**Q32. Why write a log before a dirty page?**

The page can contain changes whose transaction state must be recoverable after a crash. Durable recovery information permits reconstructing or interpreting that page safely. A volatile log buffer cannot satisfy a promised stable-storage boundary.

**Q33. Does recovery apply every logged change as a new command?**

No. It reconstructs database state using the engine's log and transaction rules. Page metadata and visibility or undo behavior prevent treating replay as another business effect. Retrying an API operation remains a separate identity question.

**Q34. Why can increasing pools make performance worse?**

The combined fleet submits more concurrent work to a finite dependency. Lock, CPU, or I/O contention can grow. Measure total sessions and useful occupancy before changing limits.

### Copies and partitions

**Q35. What does a follower acknowledgement establish?**

Receipt, durable persistence, or application, according to configuration. Those are separate boundaries. Name the selected followers and the condition before promising failover survival or fresh reads.

**Q36. How do you enforce read-your-writes across replicas?**

Carry a comparable required commit position and use a replica that has applied it. Wait or route when it has not. Endpoint stickiness alone cannot preserve the promise through every failover.

**Q37. Partitioning or sharding?**

Partitioning divides a data set into subsets that may remain local. Sharding assigns separate ownership, commonly across machines. Cross-owner requests then add routing and coordination decisions.

**Q38. What makes resharding safe?**

Copy a snapshot, catch up later writes, establish a cutover boundary, and install new authority at the protected resource. Only then rely on routing and fencing to reject stale owners. Retain recovery material until verification and cleanup are safe.

**Q39. Walk through the complete score command.**

Route to installed authority, validate the scorer, atomically record identity and related state, and commit under the declared durability policy. Use a comparable position for later replica reads. Publish the outbox with stable event identity and duplicate handling at the receiver.

**Q40. What changes when a single database becomes replicated and sharded?**

A local transaction no longer explains every visibility and ownership boundary. Replication introduces lag and promotion rules; sharding introduces routing, cross-owner work, and migrations. Keep the local atomic contract while explicitly adding those separate guarantees.

@chapter exercises | Exercises | Hide the solutions, draw the intermediate states, and use the illustrative inputs rather than product benchmarks.

### Records and indexes

**E1** ● Count event rows, distinct scorers, and entries in one complete event index.

**E2** ● Count the logical structures changed by one insert with two maintained indexes.

**E3** ● Compute the terminal choices for fan-out 100 over three ideal decision levels.

**E4** ●● Search key 16 in the illustrated tree and scan the inclusive range 12 through 20.

**E5** ●● Insert 15 into `[12,14,16,18]` with leaf capacity four. Show the illustrated split and promoted separator.

**E6** ● Compute the added payload for 100,000 covering entries with 16 extra bytes each.

**E7** ●● Execute the composite lookup for `m7` and sequence at least 2. Explain why the leading match matters.

### Plans and joins

**E8** ● Compute selectivity when 10 of 10,000 rows qualify and the error factor when actual rows are 1,000 instead of an estimated 10.

**E9** ● Compute the stated selective page-visit bound and the full table page count.

**E10** ● Compute full-scan nested-loop comparisons, indexed probes, and hash build-plus-probe operations for the tiny tables.

**E11** ●● Execute the sorted merge trace and show every comparison and emitted pair.

**E12** ●● Explain without equations why a broad filter can favor a sequential scan.

### Transactions and versions

**E13** ● Compute both account balances after the illustrative transfer and reconcile the total.

**E14** ●● Trace the two stale score increments. Give the incorrect and intended final values.

**E15** ●● Distinguish a dirty read, a non-repeatable read, and a phantom without equations.

**E16** ●●● Prove that the two-scorer departure history cannot match a serial order of the stated transactions.

**E17** ●● Design a shared-lock alternative for the active-scorer rule. State which callers must obey it.

**E18** ● Compute retained obsolete-version payload for the illustrated snapshot.

**E19** ●● Draw the two-match deadlock and explain how a common acquisition order prevents that cycle.

### Recovery, copies, and ownership

**E20** ● Compute the illustrative WAL payload and both ideal pool throughput bounds, including the remote wait.

**E21** ●● Derive acknowledgement time for local-plus-follower durability and for follower application in the timing trace.

**E22** ● Compute missing events and payload for the asynchronous gap.

**E23** ●●● Derive snapshot-copy time, catch-up backlog, and later drain time under the resharding rates.

**E24** ●●● Write a small ring-owner function and verify exactly which sample keys move when E arrives. Compare the sample fraction with the ideal equal-owner expectation.

**E25** ●●● Trace a complete command whose commit reply is lost, then count daily, retained, and three-copy record payload. Name all omitted storage categories.

@chapter solutions | Worked solutions | The arithmetic is reproduced by scripts/system-design/database-review-numbers.py; identifiers are illustrative labels.

**E1.** The four event rows contain scorer keys u4, u8, u4, and u9, so there are three distinct scorers. One complete ordinary event index contains four logical entries. Two appearances of u4 are two event references to one scorer.

**E2.** One base row structure plus two indexes gives $1+2=3$ logical maintained structures. This does not count WAL or convert directly to three physical disk writes.

**E3.** $100\times100\times100=1,000,000$ terminal choices. This is the ideal repeated decision fan-out model, not a measured real-tree height.

**E4.** The root boundaries give $12\le16<20$, selecting the middle leaf. The range returns 12, 14, 16, and 18 from that leaf, then 20 from the next, five keys in total. Stop before 24.

**E5.** Sorting after insertion gives `[12,14,15,16,18]`. The illustrated valid split is `[12,14]` and `[15,16,18]`, and the new right child's lowest key 15 becomes the separator. Update parent routing and the leaf link.

**E6.** $100,000\times16=1,600,000$ payload bytes, before page and metadata overhead. Adding payload can widen leaves even if it saves some base fetches.

**E7.** Sorted keys are `(m7,1)`, `(m7,2)`, `(m7,3)`, `(m8,1)`. Seek `(m7,2)` and return the two keys `(m7,2)` and `(m7,3)`. Encountering m8 ends the selected leading-key range.

**E8.** $10/10,000=0.001=0.1\%$. The actual-to-estimated ratio is $1,000/10=100$. That error can multiply repeated inner work and mis-size memory.

**E9.** The table has $10,000/100=100$ pages under the stated packing assumption. The selective lookup bound is $3+10=13$ visits. Repeated page locations and caching can reduce physical reads.

**E10.** A full inner scan gives $4\times3=12$ tests. An indexed nested loop makes four probes. A hash join makes three build inserts plus four probes, $3+4=7$ principal hash-table operations. Every correct method emits four pairs for these unique user keys.

**E11.** Compare u4:e1 with u4:Asha and emit e1,Asha. Compare u4:e3 with the same user and emit e3,Asha. Compare u8:e2 with u4 and advance the user pointer; compare u8 with u8 and emit e2,Bo. Compare u9:e4 with u8 and advance; compare u9 with u9 and emit e4,Chen. The explicit trace has six key comparisons.

**E12.** A broad filter needs most base pages anyway. Following many index locators can add entry traversal and scattered or repeated page visits without excluding enough data. A sequential scan reads the relevant table stream directly; requested ordering and buffer state still influence the chosen plan.

**E13.** A becomes $10,000-2,500=7,500$ cents and B becomes $2,000+2,500=4,500$ cents. Before and after totals are $10,000+2,000=7,500+4,500=12,000$. Atomicity alone does not validate the equal transfer amounts.

**E14.** Each caller reads 10 and computes $10+1=11$. Writing both private results can leave 11. The intended two increments give $10+1+1=12$. Express the increment atomically or protect the read-dependent decision.

**E15.** Dirty reads observe another transaction's uncommitted state. Non-repeatable reads observe a changed committed value when rereading the same row. Phantoms change the matching set of a repeated predicate, including through insertion of a new qualifying row.

**E16.** Asha first would leave Bo as the sole active scorer, so Bo's later check would prohibit leaving. Bo first would likewise prohibit Asha's departure. Neither possible serial order produces both off, yet the concurrent snapshot decisions do. The count changes from two to zero and violates the at-least-one rule.

**E17.** Lock a common match permission row before checking active membership. Every departure, activation, deletion, and other relevant writer must follow the same protocol. Locking only each departing person's row still permits independent conflicting decisions.

**E18.** $5,000\times500=2,500,000$ obsolete-version payload bytes. Their safe reclamation depends on visibility, and the number excludes page and index overhead.

**E19.** A owns X and waits for Y; B owns Y and waits for X. If both lock X before Y, the second waits before acquiring Y, leaving the first able to finish. Handle an aborted transaction as a whole retry even after reducing this known cycle.

**E20.** Three assumed 200-byte records give $3\times200=600$ log payload bytes. Database-only pool capacity is $20/0.01=2,000$ operations/s. Adding 0.09 s holding time gives $20/(0.01+0.09)=200$ operations/s; floating-point display in the script can require rounding.

**E21.** Local flush completes at 4 ms and the required follower flush at 7 ms, so both are ready at $\max(4,7)=7$ ms. Requiring follower application also waits through its 12 ms boundary, so the maximum is 12 ms. These absolute illustrative times omit unspecified response overhead.

**E22.** $20\times5=100$ events are absent from that copy. Their payload is $100\times200=20,000$ bytes. Another surviving copy can still preserve them.

**E23.** Snapshot copying takes $1,000,000/10,000=100$ s. The catch-up deficit is $20-15=5$ changes/s for 60 s, giving 300 changes. Later spare catch-up rate is $40-20=20$ changes/s, so drain time is $300/20=15$ s under the stated rates.

**E24.** Select the first clockwise owner position not below the key, wrapping to the lowest position when necessary. Before E, keys 55 and 58 map to D; after insertion at 60, they map to E. The other four sample keys retain their owners. The sample moved fraction is $2/6=1/3$, while an ideal five-equal-owner expectation is $1/5=20\%$.

```python
def owner(ring, key):
    positions = sorted(ring)
    chosen = next((p for p in positions if p >= key), positions[0])
    return ring[chosen]
```

The script runs the function against both rings and asserts the exact moved-key set. Duplicate positions, real hashing, and virtual-node weighting are outside this tiny ring model.

**E25.** The original transaction commits the score, event, command result, and outbox intent; its reply is lost. A keyed retry returns the stored result rather than applying another score change. Record payload is $8,640,000\times500=4,320,000,000$ bytes/day; retaining 30 days gives $4,320,000,000\times30=129,600,000,000$ bytes; three copies give $129,600,000,000\times3=388,800,000,000$ bytes. Add indexes, page slack, retained versions, WAL, outbox retention, backups, and operational free space separately.

### Primary sources

[PostgreSQL constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) explains uniqueness, mandatory columns, and nullable references.

[PostgreSQL multicolumn indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html) explains its ordered key search and skip strategies.

[PostgreSQL index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html) distinguishes payload coverage from visibility checks.

[InnoDB index organization](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html) describes primary-key clustering and secondary locators.

[PostgreSQL CLUSTER](https://www.postgresql.org/docs/18/sql-cluster.html) describes its rewrite rather than a continuously maintained ordering.

[PostgreSQL EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html) explains plan estimates, loops, and actual execution.

[PostgreSQL isolation](https://www.postgresql.org/docs/18/transaction-iso.html) specifies its snapshot behavior and whole-transaction retries.

[PostgreSQL locks](https://www.postgresql.org/docs/18/explicit-locking.html) explains lock conflicts and deadlock handling.

[PostgreSQL vacuum](https://www.postgresql.org/docs/18/routine-vacuuming.html) describes safe reclamation and file-space behavior.

[PostgreSQL WAL](https://www.postgresql.org/docs/18/wal-intro.html) explains the log-before-page recovery rule.

[PostgreSQL replication](https://www.postgresql.org/docs/18/warm-standby.html) distinguishes copying and synchronous acknowledgement conditions.

[Distributed locking and fencing](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) explains why the resource must observe a higher token before rejecting older writes.

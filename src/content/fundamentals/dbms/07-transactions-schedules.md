@part VII | Transactions and schedules | Several correct statements do not automatically make one correct operation. Concurrent reads, writes and failures can expose states that a booking workflow never intended. We will separate ACID, construct the anomalies, compare isolation contracts and prove what a schedule permits. | where:7

## 34. ACID as mechanisms, not a slogan

A transfer subtracts from Ada and adds to Bo. Power fails after the subtraction. Without a transaction boundary, the database can preserve each individual write while losing money across the complete operation.

A **transaction** is a group of operations admitted as one unit under the engine's transaction rules. **Atomicity** makes its effects all-or-nothing. **Consistency** means the operation preserves the declared database and application invariants. **Isolation** constrains what concurrent work can observe. **Durability** preserves an acknowledged commit across the failures covered by the storage contract. Together these are **ACID**.

@fig dbms_acid | A transfer needs several separate guarantees. Preserving bytes does not prove that the transferred amount or business rule was correct.

```sql
BEGIN;
UPDATE accounts SET balance = balance - :amount WHERE id = :sender;
UPDATE accounts SET balance = balance + :amount WHERE id = :receiver;
COMMIT;
```

This fragment needs more rules than its syntax shows: check sufficient balance, validate accounts and amounts, ensure both intended rows changed, and handle errors. A constraint can prevent a negative balance, but it does not prove that the application chose the correct receiver. Database consistency in ACID is about valid state; distributed consistency in Part X is about observations across copies.

Atomicity uses an engine's rollback or version-visibility mechanisms; durability uses logging and persistent storage. Isolation uses locks, versions, validation or combinations. A **savepoint** creates a rollback boundary within a transaction without committing its earlier work. A rolled-back statement must not be followed by an accidental success response from the application.

A commit is not a guarantee against every imaginable failure. An engine configuration that acknowledges before log persistence has different loss exposure from one that waits for durable storage. Local durability also does not imply that an asynchronous replica has received the commit. State the actual failure and acknowledgement boundary.

:::interview Interview lens
**"Does ACID consistency mean the database guarantees my business logic?"** It means a correct transaction should preserve the database's invariants, with constraints enforcing those the database knows. The engine cannot infer that I transferred money to the intended person or charged the intended amount. Isolation and atomicity help preserve the operation, but the application still has to define and implement the right rule.
:::

### The same transfer under three outcomes

Before the transfer, the sender and receiver balances sum to a fixed total. A correct committed transfer subtracts the amount from one balance and adds it to the other, preserving that total. If the sender update succeeds but the receiver update errors, atomicity requires the sender change to be undone or remain uncommitted and invisible. A normal exception in application code is not enough unless the transaction is rolled back.

If another transaction reads the accounts halfway through, it must observe a state allowed by the isolation contract rather than being promised a complete transfer when it has seen only one change. A higher-level report that reads each account in separate statements can still observe different committed snapshots at Read Committed. Grouping writes atomically and choosing a reader's snapshot are related but separate decisions.

If COMMIT succeeds but the connection breaks before the client receives the response, the client does not know whether the transaction committed. Retrying the business operation as a new transfer could move money twice. Durability does not remove that outcome uncertainty. An operation identity and an idempotent admission rule let the application ask for the original result instead of blindly applying the effect again.

## 35. Constructing concurrency anomalies

A balance starts at 100. One worker computes a deposit of 20; another computes a withdrawal of 50. Both read 100 before either writes, then write the absolute values 120 and 50. The expected serial result is $100+20-50=70$, but the final value is 50. This is a **lost update**: one committed effect disappears beneath another stale calculation.

@fig dbms_lost_update | Illustrative read-compute-write interleaving. Writing a stale absolute value loses the deposit; an atomic relative update has different behaviour.

A **dirty read** observes another transaction's uncommitted write, which may later vanish on rollback. A **dirty write** overwrites an uncommitted write, complicating which old value recovery should restore. Many engines prevent dirty writes even at weak read isolation, so do not infer dirty-write allowance from a dirty-read table.

A **non-repeatable read** rereads the same logical row after another transaction commits a change and gets a different value. A **phantom read** reruns a predicate and gets a changed qualifying row set, such as an inserted available seat. Locking existing matching rows alone does not protect a predicate from newly inserted matches.

**Write skew** can happen when transactions read a shared condition but write different rows. Suppose doctors A and B are both on duty and at least one must remain. Each transaction reads the snapshot where both are on, then turns its own doctor off. Their writes do not collide on a row, yet both commits leave nobody on duty. This example is a separate illustrative invariant, not Heron's seat schema.

@fig dbms_write_skew | An illustrative write-skew schedule. Avoiding same-row write conflicts does not prove that a predicate involving several rows remains true.

In Heron, stale read-modify-write can be prevented by an atomic conditional update of one inventory row or by locking and rechecking it. A cross-row condition may need a shared guard row, predicate-aware serializable validation or another complete coordination rule. Fix the anomaly that can occur; locking an unrelated row merely changes timing.

:::warn Watch out
Stable snapshots do not automatically prevent write skew. Likewise, an UPDATE is not proof against stale application arithmetic: `SET balance = :previously_computed_value` has different semantics from `SET balance = balance + :delta`.
:::

### Distinguish the anomaly by changing one event

For a dirty read, T1 writes a held state but has not committed; T2 reads held; then T1 aborts. T2's decision used a state that disappeared. For a non-repeatable read, T1 reads free, T2 changes it to held and commits, and T1 rereads held. The observed change is committed, but the same transaction did not retain its first row value.

For a phantom, T1 counts qualifying available seats, T2 inserts another qualifying inventory row and commits, and T1 reruns the predicate. The new tuple changes the result set. An update moving an existing row into the predicate can produce the same kind of set change; an insertion is the easiest illustration, not its only cause.

For write skew, neither doctor overwrites the other's row. Preventing lost updates on each separate row therefore leaves the shared "someone remains" condition unprotected. A serial order would force the second doctor to see that the other has already left and refuse its own change. Snapshot isolation's concurrent old reads can let both decide to leave. The violated predicate, not row overlap, identifies the missing coordination.

## 36. Isolation levels and implementation differences

A user opens a report while other users keep booking. Should each statement see fresh committed data, should the whole report see one snapshot, or must its decision fit a serial order with all competing transactions? The answer determines the isolation contract.

The standard levels are **Read Uncommitted**, **Read Committed**, **Repeatable Read** and **Serializable**. Their names describe guarantees, not one universal implementation algorithm. The familiar minimum-phenomena table is useful only when paired with the engine's actual semantics.

| Standard level | Dirty reads | Changed reread of a row | Changed predicate set |
|---|---|---|---|
| Read Uncommitted | Permitted | Permitted | Permitted |
| Read Committed | Prevented | Permitted | Permitted |
| Repeatable Read | Prevented | Prevented | Standard may permit |
| Serializable | Prevented | Prevented | Prevented as a serializability violation |

@fig dbms_isolation | The names identify increasingly strong contracts. Stronger guarantees can be implemented through waiting, aborts, versions or combinations.

In PostgreSQL, requesting Read Uncommitted gives Read Committed behaviour. Read Committed ordinary SELECT uses a statement snapshot; Repeatable Read uses a transaction snapshot and also prevents phantoms. PostgreSQL Repeatable Read is snapshot isolation and can still permit serialization anomalies such as write skew. Its Serializable mode adds dependency checks and may abort a transaction to prevent an invalid concurrent history. These engine-specific distinctions are documented in [transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html).

Why not always use Serializable? Waiting, validation, retained read dependencies and retries can affect throughput and latency. The application must retry the whole transaction when the engine rejects its serialization, using fresh reads and bounded retry behaviour. Serializable is often a good choice when invariants are difficult to lock completely, but the cost and error-handling obligations still need measurement.

Read Committed can be sufficient for Heron's conditional same-row seat claim plus its uniqueness constraints. That does not establish that every multi-row business decision is safe at Read Committed. Specify the invariant, construct a dangerous schedule, then choose a mechanism that rules it out.

:::note Serial is not serializable
Serial means transactions actually execute one after another. Serializable means their admitted concurrent result is equivalent to some serial execution. The engine can overlap work and still provide the stronger guarantee.
:::

### What a snapshot does and does not freeze

At statement-snapshot Read Committed, an ordinary SELECT starts with a committed view appropriate to that statement. A later SELECT in the same transaction can start with a newer view. This suits a workflow that explicitly wants fresh committed information at each step, but it can make a multi-statement report internally inconsistent if the report assumes one fixed world.

A transaction snapshot instead fixes the reader's view across its ordinary reads. A newly committed booking remains absent from that older view. The reader is not violating durability by seeing the older state; it is following its snapshot contract. A writer using an old snapshot may encounter a conflict rather than silently modifying a newer version as if nothing happened.

Serializable adds the requirement that admitted transactions fit a serial order. It does not mean every individual read must immediately see the most recent real-time write, nor that transactions physically run one at a time. Real-time ordering is a separate property in distributed consistency. Keeping those definitions separate prevents the common claim that serializable, snapshot and linearizable all mean the same thing.

## 37. Conflict and view serializability

Transactions touch the same rows in different orders. To prove correctness, compare their interactions rather than saying "the operations look sequential enough." A **schedule** orders read, write, commit and abort operations from multiple transactions while preserving each transaction's internal order.

A serial schedule runs each transaction completely before the next. A concurrent schedule interleaves operations. Two operations **conflict** when they belong to different transactions, access the same logical item, and at least one writes. Read-read pairs do not conflict. **Conflict equivalence** preserves the order of every conflicting pair; a schedule is **conflict serializable** if it is conflict-equivalent to a serial schedule.

Build a **precedence graph** with one vertex per transaction. Add an edge $T_i\rightarrow T_j$ when an operation of $T_i$ precedes a conflicting operation of $T_j$. Read the edge as "any equivalent serial order must put i before j." The graph is acyclic exactly when the schedule is conflict serializable. A topological ordering gives the corresponding transaction order.

@fig dbms_serial_graph | Illustrative conflicting operations require both T₁ before T₂ and T₂ before T₁. The cycle prevents a conflict-equivalent serial order.

For `R1(X), W1(X), R2(X), W2(Y), R1(Y)`, the X conflict gives `T1 → T2`; the Y conflict gives `T2 → T1`. Reject it as conflict serializable. By contrast, `R1(X), W1(X), R2(X), W2(X)` gives only `T1 → T2`, so its conflict graph is acyclic.

**View equivalence** preserves which reads see initial values, which writer each read observes, and the final writer of each item. **View serializability** asks whether these observations match a serial schedule. It is a broader property. The blind-write sequence `W1(X), W2(X), W1(X)` has a conflict cycle, but with no reads and final writer T1 it is view-equivalent to serial order T2 then T1. Acyclicity is a complete test for conflict serializability, not a complete test for every view-serializable schedule.

:::story Picture this
If one editor's decision depends on another's change, draw an arrow to say who must come first. A loop says each needs the other to have already finished. The graph records dependencies, not how long either editor spends typing.
:::

### Build the graph operation by operation

Start with T1 and T2 and no edges. R1(X) alone introduces no cross-transaction conflict. W1(X) is also still internal to T1. R2(X) conflicts with the preceding W1(X), so add T1 to T2. W2(Y) introduces an access to another item, but it creates no edge until a different transaction touches Y incompatibly. R1(Y) now conflicts with W2(Y), so add T2 to T1. The graph has a cycle.

A read-read pair would not create an edge because exchanging their order changes no stored or observed value. A write-read, read-write or write-write pair can constrain the order. Draw one edge per required direction even if many operation pairs imply it; repeated arrows do not make the ordering requirement stronger.

For the acyclic X-only example, topological order T1 then T2 satisfies every conflict direction. The schedule need not have already run in that serial order; preserving the conflicting pair orders is the proof. Blind writes explain the view-serializable exception because no reader distinguishes the intermediate writer that the conflict test still orders.

## 38. Recoverable, cascadeless and strict schedules

T2 reads a value written by uncommitted T1, then commits. T1 aborts. A committed transaction now depended on a value that never existed in committed state. Even a serializability discussion has not yet settled whether recovery can cleanly handle this history.

A **recoverable schedule** requires a transaction that reads from another to commit only after that source transaction commits. T2 can read T1 early in such a schedule, but cannot commit before T1. If T1 aborts, T2 must also abort. A **cascading rollback** propagates aborts through these read-from dependencies.

A **cascadeless schedule** permits reads only from committed writes, removing that cascading-read obligation. A **strict schedule** prevents other transactions from reading or overwriting an item written by an uncommitted transaction. Strictness adds dirty-write protection as well as dirty-read protection.

@fig dbms_recovery_order | The schedule properties strengthen different recovery obligations. Under the textbook definitions, strict implies cascadeless, and cascadeless implies recoverable.

For `W1(X), R2(X), C1, C2`, the reader commits after its source, so it is recoverable, but not cascadeless. For `W1(X), C1, R2(X), C2`, the read waits for the committed source and meets the cascadeless rule for this interaction. A schedule that allows `W2(X)` before T1 finishes can still violate strictness even if nobody reads the dirty value.

Do not equate strict schedules with the isolation level Serializable. Serializability concerns equivalence to a serial execution; recoverability concerns commit and abort dependencies. Concurrency-control protocols often aim to provide both, but the properties need separate definitions. The next part explains how locks and versions enforce the desired combination.

### Follow an abort through the read-from chain

In `W1(X), R2(X), C1, C2`, T2 read T1's write while it was still uncommitted, but waited to commit until T1 committed. If T1 aborts instead of C1, T2 cannot keep a successful outcome based on that write. If T3 has already read T2's derived result, the abort obligation can spread further. This is the practical reason to prefer schedules that do not expose dirty values to readers.

A cascadeless schedule postpones R2(X) until T1 commits, avoiding that read-from rollback chain. Strictness also postpones another writer's overwrite of X, so recovery does not have to disentangle overlapping uncommitted ownership of the same item. These conditions simplify recovery without proving that every remaining dependency has a serial order. Serializability and recoverability answer different questions and need both mechanisms where the contract requires both.

:::key In one breath
ACID separates all-or-nothing effects, valid state, controlled concurrent observations and persistence. Anomalies are specific interleavings: dirty reads and writes, lost updates, changed rereads, phantoms and write skew require different protections. Serializable admits only histories equivalent to a serial execution, while conflict graphs provide a precise test for the conflict-based subset. Recoverable, cascadeless and strict schedules describe how dependencies behave when transactions commit or abort.
:::

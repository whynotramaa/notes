@part VIII | Locks, versions and validation | Correct concurrent behaviour requires a mechanism that coordinates the operations which can conflict. Waiting is one option, preserving versions is another, and checking assumptions before committing is a third. We will examine lock granularity, two-phase locking, deadlocks, MVCC and optimistic updates. | where:8

## 39. Shared, exclusive and intention locks

A report reads a seat while a buyer tries to claim it. In a lock-based model, two readers can share the same item, while an exclusive writer must coordinate with incompatible holders. A **lock** is a logical permission the concurrency-control system grants before an operation proceeds.

A **shared lock**, S, permits compatible readers. An **exclusive lock**, X, permits the holder's protected write and conflicts with another holder's S or X on the same protected item. A waiting transaction stays blocked until its request becomes compatible or the engine aborts it. This simplified matrix explains the concept; a real engine may expose more modes.

@fig dbms_lock_compatibility | Simplified S/X compatibility for the same logical item and different transactions. Actual engine lock modes have a richer matrix.

**Lock granularity** chooses the protected unit: a row, page, table or a logical predicate. Fine locks permit unrelated work but increase lock-management overhead. Coarse locks can cover a large operation cheaply but block more concurrent work. **Lock escalation** replaces many finer locks with a coarser one in engines that implement it; do not assume every engine escalates row locks.

An **intention lock** announces locks to be taken below a node in a hierarchy. For example, intention-exclusive, IX, at a table can announce exclusive row locks below. Another transaction requesting a table-wide incompatible lock can check the table-level announcement without scanning all row locks. Intention locks by themselves do not make every row exclusively locked.

@fig dbms_intention | A conceptual hierarchy using IX above an X-locked row. The table announcement does not mean every other row is blocked from writing.

Protecting a range against new qualifying rows may need key-range locks, predicate locks or validation. Locking all currently free Heron seats does not automatically lock every possible future row in that predicate. PostgreSQL combines table modes, row modes and MVCC; its [explicit-locking reference](https://www.postgresql.org/docs/18/explicit-locking.html) defines which actual operations conflict.

:::note Locks versus latches
Transaction locks enforce logical concurrency for an operation's lifetime. Short internal latches protect an in-memory structure while an engine worker inspects or changes it. A page latch does not establish a transaction's isolation contract.
:::

### A shared lock is not a promise to write later

If T1 and T2 both hold S on the same row, both may read it. When T1 wants X, it must wait for incompatible holders, including T2, to release. If T2 also requests X while retaining S, each upgrade can wait on the other's shared lock. Requesting a read lock and later upgrading it has different waiting behaviour from acquiring the needed write lock before the protected decision.

For a multi-seat booking, row granularity allows unrelated shows and seats to proceed. Taking one table-wide lock would also protect the decision, but would serialize much more inventory work. A hierarchy of intention locks lets an engine reconcile these granularities: a table-wide requester can see that descendants have active write intentions without searching every individual row.

A predicate involves possible matches, not just the tuples found today. Protecting "no active reservation exists for A7" by locking a query that returns no row is incomplete unless the engine's range or predicate mechanism covers that absence. A unique active-claim constraint or an existing guard inventory row gives the database something definite to coordinate.

## 40. Two-phase, strict and rigorous locking

T1 releases its read lock on X, then later acquires a write lock on Y. That new acquisition can fit after another transaction's operations in a way that defeats a single consistent serial order. **Two-phase locking**, or 2PL, restricts the lock lifecycle to prevent that pattern.

During the growing phase a transaction can acquire locks but not release them. Once it releases a lock, it enters the shrinking phase and may release more but acquire no new ones. The **lock point** is its final lock acquisition. Ordering transactions by their lock points gives the serial order behind the conflict-serializability argument, assuming the protocol protects all relevant logical conflicts.

@fig dbms_two_phase | The phases concern acquiring and releasing locks. A release cannot be followed by a new acquisition in basic 2PL.

Basic 2PL provides conflict serializability but can release a write lock before commit, allowing another transaction to encounter an uncommitted result. **Strict 2PL** keeps exclusive locks until commit or abort. **Rigorous 2PL**, under the usual textbook convention, keeps both shared and exclusive locks until the end. Some sources use "strict" for the stronger variant too, so state which locks are retained.

| Property | Basic 2PL | Strict 2PL | Rigorous 2PL |
|---|---|---|---|
| New lock after first release | Forbidden | Forbidden | Forbidden |
| Exclusive locks retained to end | Not required | Required | Required |
| Shared locks retained to end | Not required | Not required | Required |
| Conflict serializability | Yes | Yes | Yes |
| Deadlock possible | Yes | Yes | Yes |

Holding locks longer makes recovery simpler but can extend blocking. Lock upgrades need coordination too: two S holders both asking for X can create a deadlock. Two-phase locking and two-phase commit share words but solve different problems. 2PL controls concurrent access; Part X's 2PC coordinates a commit decision across participants.

:::interview Interview lens
**"Does two-phase locking prevent deadlocks?"** No. It guarantees a conflict-serializable schedule when its locking assumptions hold, but transactions can acquire resources in opposite orders and wait in a cycle. Strictness improves recovery behaviour by retaining writes until the end; it does not remove circular waiting.
:::

### Why releasing and then acquiring creates the problem

Imagine T1 reads X, releases its protection, then later writes Y. T2 can write X after that release and read Y before T1's new write. The conflicts can require T1 before T2 on X and T2 before T1 on Y. Basic 2PL rejects T1's lifecycle because its first release makes later acquisition illegal.

Under 2PL, each transaction has one point after which it acquires no new locks. The compatibility rules prevent another transaction's incompatible access from crossing the protected intervals in a way that violates the lock-point order. That is the serializability intuition. The proof assumes locks cover the relevant items and predicates; forgetting an entire conflict does not become safe because the remaining locks obey two phases.

Retaining X to commit also means another transaction cannot read or overwrite an uncommitted write. Retaining S as well is stronger and can simplify the ordering interpretation, but holds more read protection for longer. Long remote calls inside the transaction extend every retained lock's lifetime, making operation boundaries a performance choice as well as a correctness choice.

## 41. Deadlocks, prevention and recovery

T1 locks seat A7 and then asks for A8. T2 locks A8 and asks for A7. Both hold something the other needs, so neither can finish and release its locks. A **deadlock** is a cycle of transactions waiting for resources that cannot become available while the cycle persists.

The classical necessary conditions are mutual exclusion, hold-and-wait, no forced preemption of the resource, and circular wait. A **wait-for graph** has a transaction vertex and an edge from a waiting transaction to its blocker. In the ordinary lock-wait model, a cycle identifies a deadlock. This graph differs from the serialization graph: its edges describe current waits rather than historical conflicting access order.

@fig dbms_deadlock | Illustrative opposite-order seat locking. Aborting one holder releases resources so the other can proceed.

**Prevention** breaks a necessary condition, for example by always locking seats in a common sorted order. Timestamp rules can make a younger transaction abort rather than create an impermissible wait. **Avoidance** admits requests only if the remaining allocation can stay safe under declared future needs; that requires information ordinary application transactions may not provide.

**Detection** allows waits, then searches for cycles. **Recovery** selects a victim, aborts it and releases its locks. Victim cost can consider work already done, resources held or fairness; repeated sacrifice can starve one transaction. PostgreSQL detects lock deadlocks and aborts a participant. A timeout bounds a wait, but does not prove the wait was a deadlock: the blocker may simply be slow.

Heron's multi-seat booking should acquire inventory rows in a consistent `(show_id, seat_id)` order and keep its transaction short. If an abort still occurs, retry the whole unit from a fresh read. Do not retry only the final statement while keeping earlier assumptions. The OS guide will use the same necessary-condition reasoning, but database recovery has a transaction to roll back.

:::warn Watch out
A slow query waiting on a lock is not necessarily deadlocked. Read the wait graph and identify the blocker. A fixed delay or a longer timeout can hide an ordering bug without correcting it.
:::

### A common order removes this specific cycle

Sort every seat request by show_id and seat_id before locking. If both buyers need A7 and A8, each asks for A7 first. One obtains A7 and then A8. The other waits before holding A8, so it cannot become the holder that the first buyer needs. The opposite-order cycle is impossible under that complete ordering rule.

The ordering must apply to every path that locks those resources, including cancellation, administrative changes and multi-seat retries. Adding one workflow that obtains A8 first can reintroduce the cycle. Ordering seats also does not automatically order unrelated customer or payment rows; a broader transaction may need a consistent order across its resource classes.

If detection chooses T2 as a victim, the application should roll back its whole transaction and rerun from current state. Its earlier availability reads are no longer reliable. Retrying with the same business operation identity protects against outcome duplication, while a backoff can reduce simultaneous repeat conflicts. These are application recovery obligations, not proof that the engine's deadlock detector was wrong.

## 42. MVCC, snapshots and version visibility

A report begins before Ada's balance changes from 100 to 120. The report can continue seeing 100 even after the update commits, while a later report sees 120. This is deliberate snapshot behaviour, not evidence that the database forgot a committed update.

**Multiversion concurrency control**, or MVCC, keeps multiple logical versions so readers can select a version valid for their snapshot. A **snapshot** records the transaction-visibility boundary for a read. **Transaction IDs** and commit state let the engine distinguish versions created by committed, aborted or still-running writers. Visibility is not simply "take the numerically newest version."

@fig dbms_mvcc | Illustrative snapshot visibility. An older snapshot can legitimately select the earlier committed balance while a newer snapshot selects the update.

An update creates or records a successor version. A read checks which creation and replacement events are visible to its snapshot, then returns the applicable version. The transaction generally also sees its own prior writes. **Snapshot isolation** gives transactions stable snapshots and detects certain conflicting writes, but disjoint writes can still produce write skew as Section 35 showed.

MVCC reduces direct reader-writer blocking for ordinary reads, but writers still coordinate with writers, schema operations still have locks, and validation may still abort work. A locking SELECT requests stronger coordination than an ordinary snapshot read. MVCC and locking are therefore complementary mechanisms rather than mutually exclusive products.

**Old-version cleanup** reclaims versions no longer needed by possible readers or recovery. A long-lived snapshot can delay reclamation, increasing space and access work. PostgreSQL calls the corresponding maintenance **VACUUM**, with automatic operation through autovacuum. Its exact tuple metadata and cleanup behaviour return in Part XI. Avoid holding an idle transaction open across a slow payment service or an unattended application session.

:::story Picture this
A reader receives a dated edition of a ledger. Editors can publish a new edition without rewriting the reader's pages, so the reader's calculation stays internally consistent. Keeping every edition forever would fill the room, so old editions need a rule for when no reader can still require them.
:::

### Read a version using events, not just an integer

Start with a committed old balance of 100. Reader R establishes a snapshot. Writer W creates a replacement balance of 120, but while W is uncommitted an ordinary other reader must not treat 120 as a committed fact. After W commits, a fresh snapshot can choose 120. R's older transaction snapshot can still choose 100 because W's commit is outside its visibility boundary.

If W aborts, the replacement never becomes an admitted committed version for ordinary readers. If R itself updates the row, its own writes have visibility rules that differ from an unrelated writer's changes. A transaction-id comparison alone cannot explain these cases; the snapshot also needs knowledge of in-progress and completed transactions.

Cleanup can remove 100 only when no qualifying reader or other retention obligation can still need it. An abandoned long-running snapshot makes that horizon older and can retain many versions. This is the connection between transaction lifetime, table growth and maintenance work: a reader can consume little CPU while still preventing space reclamation.

## 43. Optimistic versus pessimistic concurrency

A user edits a booking description while another user edits the same record. You can reserve the record before editing, or accept edits tentatively and reject a stale one at save time. The choice depends on contention and the operation's lifetime.

**Pessimistic concurrency control** coordinates before completing the decision, commonly by holding a lock. `SELECT ... FOR UPDATE` reads and locks selected rows for the transaction's protected operation. That does not lock rows that do not exist, nor every row satisfying a future predicate. A unique constraint or a correct predicate-level mechanism is still needed for those cases.

**Optimistic concurrency control** reads without the long protected decision interval, then validates that its assumptions still hold. A **version column** supports a conditional update. In an illustrative row with version 7, the update both checks 7 and advances to 8 in one atomic statement. This is the database analogue of **compare-and-swap**: change the value only if its expected state still holds.

```sql
UPDATE bookings
SET note = :new_note, version = version + 1
WHERE id = :booking_id AND version = :expected_version;
```

@fig dbms_optimistic | Illustrative version 7 to 8 transition. The version check and write are one atomic operation; a prior independent SELECT check would race.

An affected-row count of zero means the expectation did not match or the row was absent. Treat it as an explicit conflict or absence outcome; do not claim success. Checking a version only on one row does not validate a decision depending on several unversioned rows. General OCC tracks read and write assumptions and validates the set.

At low contention, optimistic work avoids unnecessary waiting. At high contention, repeated rejected work can cost more than a short queued lock. Pessimistic operations can wait or deadlock; optimistic ones can conflict and retry. Both need database-enforced atomic admission, complete retry handling and a business rule that covers all involved facts.

### Two writers validate the same version

Ada's editor and Bo's editor both read booking version 7. Ada's conditional UPDATE finds 7, writes the new note and changes the version to 8. Bo's UPDATE still asks for 7, so it changes zero rows. The engine checks and updates as one operation; there is no interval in which both can independently pass the final validation.

Bo must now reread and decide whether to merge, retry or report a conflict. Automatically retrying an absolute replacement note can overwrite Ada's intended edit even though the version mechanism detects stale input correctly. Concurrency control admits a decision against current state; it cannot infer a user's desired merge policy.

For a shared invariant over several rows, a single booking version is insufficient. Either version and validate every relevant source, use an authoritative guard row or select another complete transaction mechanism. An optimistic update is correct because of the assumptions it validates, not because its SQL includes a version column somewhere.

:::key In one breath
Locks coordinate incompatible operations, with granularity and intention modes balancing concurrency against management cost. Two-phase locking constrains acquisitions and releases; strict and rigorous variants retain more locks through transaction end. Deadlock graphs describe waits and need prevention or victim recovery. MVCC selects versions by snapshots, while optimistic control validates assumptions atomically before admitting a stale decision.
:::

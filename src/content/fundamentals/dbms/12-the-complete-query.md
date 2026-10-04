@part XII | The complete reservation query | One seat reservation connects every mechanism in this chapter. A correct query plan is not enough if two buyers win or a committed result disappears after a crash. We will trace one reservation, resolve a concurrent buyer, reconcile the storage budget and name each component's contribution. | where:12

## 57. A reservation from SQL to durable commit

Ada asks to reserve seat A7 at one show. The application validates the user and begins a transaction. The database parses the SQL, resolves table and column names, checks privileges and chooses a plan using available indexes and statistics. The statement still has to execute under its snapshot and concurrency rules.

The access path locates the inventory key. In the declared index model, a point read visits a root page, one leaf page and the heap page containing the tuple, giving $1+1+1=3$ logical page visits on this path. A buffer hit can satisfy a visit without device I/O. Read that count as structure visits under this toy tree, not three mandatory physical reads in PostgreSQL.

@fig dbms_query_trace | One reservation passes from parsing and planning to page access, concurrency control and durable commit. Orange marks the atomic seat-state check after competing access is controlled.

A conditional update can claim the seat only while it is available. The transaction records a booking and publication intent only if it obtains that claim. The engine preserves required WAL before the associated changed page reaches persistent storage, and the configured durable commit boundary precedes a success response. Pages can remain dirty in the buffer pool after a no-force commit.

```sql
BEGIN;
UPDATE show_seats
SET state = 'held', version = version + 1
WHERE show_id = :show AND seat_id = :seat AND state = 'free'
RETURNING show_id, seat_id, version;
COMMIT;
```

This short statement shows the claim mechanism, not the complete application transaction. The handler must inspect the returned row count and insert the booking and outbox in the same transaction before commit. If no row is returned, it cannot create a successful booking. The actual identifier types and SQL parameter syntax depend on the driver.

On success, Ada's application version changes from 7 to 8 in the worked token example. A lost response is resolved using the stable booking submit key rather than reserving again under a new identity. As promised in the front matter, the single request now crosses schema, plan, index, buffer, visibility, lock and recovery boundaries without treating any one of them as a substitute for the others.

:::story Picture this
A theatre clerk finds the right show ledger, locates the seat entry, checks it is still free and marks it while another clerk waits. The receipt is written into the same durable record before the customer hears success. The directory helped find the entry; the exclusive check prevented another sale; the durable receipt made the promise survive a lost desk copy.
:::

## 58. Two buyers and one seat

Bo reaches the same seat while Ada's reservation transaction is open. Both may have displayed an earlier available state in the browser. That display is a useful hint, not permission to commit a seat claim without checking again.

Under a row-locking path, Ada's update obtains the needed lock. Bo's conflicting update waits or fails under the configured policy. After Ada commits, Bo must evaluate the current permitted row state under the engine's isolation behavior. At PostgreSQL Read Committed, a conflicting update can wait and then re-evaluate its condition on the updated row; an available-state condition cannot keep winning merely because Bo's original view was free.

@fig dbms_booking_race | Ada claims and commits first. Orange marks Bo's resumed check finding held state and returning no claimed row, rather than creating another successful booking.

An optimistic alternative uses the version token. Both clients observed version 7, but Ada's atomic update changes it to 8. Bo's conditional comparison against 7 then fails, forcing the application to report conflict or retry after reading current state. Read $7+1=8$ as an application version change, not an engine transaction-order calculation. The comparison and state update must be atomic; a separate application read followed by an unconditional write reintroduces the race.

A uniqueness constraint is a final enforcement boundary when the schema models active seat claims as unique rows. The application still needs to interpret the conflict and handle expiration, cancellation and confirmation under one allowed state machine. Deleting and recreating claim rows casually can let a late payment confirm the wrong booking generation.

The interview answer should identify the invariant first, one valid active owner per show-seat. Then name the atomic conditional operation or lock, the database constraint where applicable, and the retry identity. Isolation labels alone do not prove that a particular application's sequence implements its invariant. [PostgreSQL's locking reference](https://www.postgresql.org/docs/18/explicit-locking.html) describes the concrete conflicting row-lock behavior used in this trace.

:::warn Watch out
Never infer that the seat remains free because a prior SELECT returned free. A concurrent transaction can change it before your write. Tie validation to the update or perform the required locking and recheck within the transaction.
:::

## 59. Reconcile every inventory storage byte

A diagram says the inventory occupies 26 pages, but a table lists 800 records. We should be able to derive both figures and account for the last partly filled page. This section closes the counting promise made in the front matter.

Each toy page has $4096-64=4032$ usable bytes after its header. A record and slot use $124+4=128$, so capacity is $\lfloor4032/128\rfloor=31$ records. A full page uses $31\times128=3968$ bytes in record-plus-slot payload and leaves $4032-3968=64$ usable bytes empty. Read floor as admitting only whole records that fit.

There are 25 full heap pages holding $25\times31=775$ records and a last page holding $800-775=25$. Total heap pages are $\lceil800/31\rceil=26$, occupying $26\times4096=106496$ bytes. The page header and unused space are included in that total; do not add them again.

The toy index entry occupies 16 bytes, so a leaf holds $\lfloor4032/16\rfloor=252$ entries. Three full leaves hold $3\times252=756$ entries and the fourth holds $800-756=44$. Four leaves and one root give 5 index pages, or $5\times4096=20480$ bytes. The root model assumes its separator entries fit under the earlier toy specification.

@fig dbms_complete_bytes | Illustrative inventory heap and index totals reconcile to 126,976 bytes for one copy. Orange marks that sum; three identical copies occupy 380,928 bytes under the same toy layout.

Combining structures gives $106496+20480=126976$ bytes and $26+5=31$ pages. Three full physical copies give $126976\times3=380928$ bytes. Read this as multiplying one modeled inventory-plus-index footprint by the declared replica count. It excludes WAL, other tables, backups, obsolete versions and replication metadata. Real PostgreSQL storage needs its own page and tuple inputs rather than substituting these teaching settings.

:::note Logical rows and physical history
The 800-row inventory describes logical records. MVCC versions, deleted-but-not-reclaimed tuples, indexes and WAL add other physical history. A logical row count does not uniquely determine a real database's disk footprint.
:::

## 60. Responsibilities of every database component

Ada's receipt says the seat is held. We can explain what produced that result by assigning one job to each mechanism, then checking that their boundaries agree. A fast index cannot prevent duplicate claims; a lock cannot preserve RAM after power loss; a replica cannot repair an invalid schema.

| Component | Contribution | Failure it does not solve alone |
|---|---|---|
| Schema and constraints | Valid identities and references | Race in an unchecked application sequence |
| Relational query and SQL | State the required row computation | Storage and scheduling cost |
| Optimizer | Choose an estimated access plan | Wrong or stale selectivity evidence |
| Index | Locate ordered keys efficiently | Permission and tuple visibility |
| Buffer manager | Reuse pages with pin and dirty rules | Durable commit acknowledgement |
| Locks and atomic predicates | Coordinate competing effects | Replay of an external command |
| MVCC and snapshots | Select allowed row versions | Reclamation without maintenance |
| WAL and recovery | Restore the durable state contract | Loss outside that configured boundary |
| Replication | Maintain additional state copies | Promotion without valid authority |
| Outbox and identity | Recover publication and repeated attempts | Atomic remote effects without a protocol |

@fig dbms_component_jobs | Component jobs kept distinct. Orange marks WAL and recovery, which preserve acknowledged state while the other mechanisms establish what that state is allowed to contain.

Heron's four core tables begin with 1,068 rows; inventory and its toy index occupy 126,976 bytes per copy. One completed booking header increases the four-table subtotal to 1,069 while the seat row changes in place logically. Physical versions and the expanded booking schema remain separately accounted, as Section 54 established. These figures now reconcile rather than silently mixing logical counts and physical history.

The study loop is to redraw the reservation path and change one assumption. Remove the index, hold an old snapshot, lose power after durable commit, let the response disappear, or promote a lagging follower. Each change should lead to a named mechanism and a permitted outcome rather than another vague claim that the database is safe.

This chapter did not implement a SQL optimizer, a full consensus protocol, storage-device guarantees or a payment provider. Computer Networks follows the packets that carry the request. Operating Systems follows the process, memory and I/O machinery on which the database depends. The database boundary is now explicit enough to know what those next chapters must supply.

:::interview Interview lens
**"Walk me through two users trying to book the same seat."** I identify the show-seat key and enforce one active claim with an atomic state transition and the appropriate database constraint. The winner records booking and publication intent in its transaction, while the loser observes a conflict rather than trusting an earlier SELECT. Durable commit, stable request identity and a defined payment lifecycle then handle crashes and uncertain responses without creating a second valid owner.
:::

:::key In one breath
One reservation joins schema, query planning, page access, concurrent state validation and durable commit. Atomic claims or version comparisons prevent two buyers from winning the same inventory record. The toy heap and index counts reconcile exactly while real engine history remains separate. Every component supplies one part of the result, and every external boundary needs its own stated contract.
:::

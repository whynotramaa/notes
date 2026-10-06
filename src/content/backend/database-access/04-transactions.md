@part IV | Transactions in code | We decide where transactions begin and end in a service, which isolation level to ask for, and what to do when the database refuses to commit. The database guarantees atomicity, but only for the boundaries the code draws. We will cover transaction boundaries and the unit of work, isolation levels with the anomalies each one allows, and retrying serialization failures and deadlocks. | where:4

## 12. Transaction boundaries

A **transaction** groups statements so that they all take effect or none do. The database fundamentals guide covers how PostgreSQL achieves that. This section is about the decision every service makes, which code sits between `BEGIN` and `COMMIT`.

Wren places one transaction around each use case, in the service layer from Unit V. `OrderService.place` opens the transaction, the repositories for orders, order items, idempotency records and the outbox all run their statements inside it, and the service commits at the end. If inserting the items fails, the order row disappears too. The controller does not open transactions, because it does not know which writes belong together, and repositories do not either, because one repository cannot see what the others are doing.

@fig be_db_uow | One use case, one transaction, one borrowed connection shared by every repository.

The usual tool is a unit of work object or a context manager, `with unit_of_work() as uow:`, which borrows a connection, begins a transaction, hands the same connection to every repository, commits if the block finishes and rolls back if it raises. Frameworks offer the same thing as annotations, such as Spring's `@Transactional`. They are convenient, and they hide a trap, since a method calling another annotated method on the same object may bypass the proxy and get no transaction at all.

The most important rule is what stays out. A transaction should contain database work and nothing else. Wren's first version of order placement opened a transaction, inserted the order, called the payment provider to charge the card, and committed. The provider takes about 800 ms, so the transaction held its locks for 812 ms, connections were held for 812 ms, and when the provider had a slow day the pool emptied. Worse, if the commit failed after the charge succeeded, the customer paid for an order that did not exist.

@fig be_db_txn_boundary | Same work, two shapes. Moving the network call out cuts the locked window from 812 ms to 12 ms.

The fixed version charges first using an idempotency key, then opens a short transaction to record the order and the payment result. Unit VIII's outbox pattern handles the cases where something must happen reliably after the commit.

## 13. Choosing an isolation level

When transactions run at the same time, each sees some mix of its own work and other transactions' committed work. The **isolation level** controls how much of the others it can see. Weaker levels allow more **anomalies**, results that could not occur if transactions ran one at a time. The SQL standard defines four levels by the anomalies they forbid. PostgreSQL implements three distinct behaviours.

**Read committed** is PostgreSQL's default. Each statement sees data committed before that statement began, so it never sees uncommitted data, a **dirty read**. Two reads of the same row within one transaction may differ if someone commits in between, a **non-repeatable read**, and a repeated range query may find new rows, a **phantom**. **Repeatable read** gives the whole transaction one snapshot taken at its first statement. PostgreSQL's version also prevents phantoms, and if two transactions update the same row, the second fails rather than overwriting, which prevents the **lost update** of Part V. **Serializable**, implemented in PostgreSQL 9.1 (2011) with serializable snapshot isolation, guarantees that the outcome equals some one-at-a-time order, and aborts a transaction with SQLSTATE 40001 when it cannot.

@fig be_db_isolation | Higher levels block more anomalies. Write skew needs serializable or an explicit lock.

The anomaly that surprises people is **write skew**. Wren's rule says at least one courier must stay on shift in each zone. Asha and Ben are the only two on shift, and both tap "end shift" at the same moment. Each transaction counts couriers on shift, sees 2, decides one can leave, and updates its own row. The rows differ, so repeatable read sees no conflict, and both commit. Zero couriers remain.

@fig be_db_write_skew | Each check passed in its own snapshot. Together they broke the rule.

Under serializable, PostgreSQL notices that the reads and writes cannot be ordered and aborts one with 40001. Under read committed, the alternative is a lock on something both transactions must touch, such as the zone row, with `SELECT ... FOR UPDATE`, so the second transaction waits and then counts again with a fresh snapshot.

Wren uses read committed for most work, with atomic statements and explicit locks where invariants matter, and serializable for a few flows such as courier shifts, where the rule spans rows. Serializable costs some throughput and requires retries, the subject of the next section.

## 14. Retrying serialization failures and deadlocks

Under serializable or repeatable read, PostgreSQL may abort a transaction with SQLSTATE **40001**, serialization failure, to protect the guarantee. At any isolation level it may abort one with **40P01**, deadlock detected. Neither is a bug in the database. Both are the database telling the application to try again, and the application must be ready to do so.

A **deadlock** happens when two transactions each hold a lock the other needs. Wren's bulk status update locks order 123 then 124. A concurrent cancellation locks 124 then 123. Each waits for the other forever. PostgreSQL checks for such cycles after a transaction has waited `deadlock_timeout`, 1 s by default, and aborts one victim so the other can proceed. The cheapest prevention is to lock rows in a consistent order, for example by sorting ids, so a cycle cannot form.

@fig be_db_deadlock | Each holds one padlock and waits for the other's. After 1 s, PostgreSQL breaks the cycle.

Retrying correctly has one non-obvious rule. Retry the **whole transaction from BEGIN**, re-reading everything, never just the statement that failed. The transaction's earlier reads came from a snapshot that is now stale, and decisions made from them may be wrong. Code should therefore wrap the entire unit of work in a retry loop that catches only 40001 and 40P01. Other errors, such as a unique violation or a check constraint, will fail the same way again.

Retries need limits and spacing. Wren retries at most three times, waiting a random time between half and all of 10 ms, then 20 ms, then 40 ms. The randomness, called **jitter**, keeps two transactions that collided from colliding again in lockstep, and the growing wait, **exponential backoff**, keeps a hot row from turning retries into a storm. If all attempts fail, the request returns 503 and a retryable error.

@fig be_db_retry | Each attempt starts from BEGIN. Waits grow and are randomised.

Retried transactions must also be safe to repeat. If the transaction body sends an email or calls an API, a retry sends it twice. Keep side effects outside the transaction, or record them in an outbox row that commits with the data, so a retry of the transaction is invisible to the outside world.

:::story Picture this
Two people walking towards each other in a narrow corridor, each stepping aside in the same direction, again and again. The fix is that one of them waits a random moment before moving. Database retries use the same trick, and a rule like "always pass on the left" is the lock ordering that stops it happening in the first place.
:::

:::note Read-only transactions
A transaction that only reads still matters. Under repeatable read it gives a consistent snapshot across several queries, which a report that sums orders and then lists them needs. Declaring it `READ ONLY` lets PostgreSQL skip some work, and under serializable a `READ ONLY DEFERRABLE` transaction never fails with 40001.
:::

:::warn Watch out
Do not put network calls, file uploads or anything slow inside a transaction. Every millisecond inside it is a millisecond of held locks and a borrowed connection, and if the commit fails after an external call succeeded, the two disagree with no way back.
:::

:::interview Interview lens
**"Where do transactions belong in a layered service, and what do you do on a serialization failure?"** One transaction per use case in the service layer, shared by all repositories through a unit of work, containing only database work. Choose read committed by default, and serializable or explicit locks where an invariant spans rows, such as write skew. On 40001 or 40P01, retry the whole transaction from BEGIN with a small capped number of attempts and jittered exponential backoff, keeping side effects outside so a retry is safe. Prevent deadlocks by locking rows in a consistent order.
:::

:::key In one breath
Each use case gets one transaction, opened in the service layer and shared by every repository through a unit of work, with network calls kept outside so locks are held for 12 ms rather than 812. PostgreSQL's read committed default allows non-repeatable reads, phantoms and lost updates, repeatable read blocks those, and only serializable or an explicit lock stops write skew, like two couriers leaving one zone empty. Serialization failures (40001) and deadlocks (40P01) are requests to retry, and the whole transaction must rerun from BEGIN with capped, jittered backoff.
:::

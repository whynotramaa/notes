@part IV | Transactions and isolation levels | We decide which grouped changes can become visible together. Concurrent work can violate a rule even when every individual statement looks correct. We will build a commit boundary, name ACID's separate promises, and execute the histories behind isolation levels. | where:4

## 15. A transaction gives related writes one boundary

Heron updates a score and records the command identifier that prevents a retry from applying the same change again. If only the score commits, a retry may duplicate it. If only the identifier commits, a retry may appear successful while the score never changed. These facts belong to one boundary.

A **transaction** groups database operations into a commit or rollback decision. **Commit** makes the group succeed under the engine's contract; **rollback** discards its transactional changes. The application can perform several statements while keeping their intermediate state outside the final committed result.

Our illustrative command changes score 10 to 11, inserts an event, and records command key `k7` with its result. Begin, check or claim the command identity, apply the score change, insert the related records, then commit. If a later constraint rejects the event, roll back the earlier update too. A caller should receive success only after the chosen commit boundary completes.

@fig sd_databases_transaction | Illustrative score, event, and command-result group. Failure of a member rolls back the group rather than leaving a partial committed command.

The boundary covers transactional database effects, not every action the process performs. Sending an email before commit cannot be undone by rolling back SQL. A remote service might also complete while the database transaction fails. Record an intent inside the transaction and handle the later external action separately, as Part VIII will demonstrate.

A lost commit reply is another problem: the client cannot infer rollback from silence. Query the command identity or retry with the same key. Transaction atomicity prevents partial groups; operation identity lets a caller reconcile which complete group, if any, actually committed.

## 16. Atomicity and consistency answer different questions

Imagine transferring 2,500 illustrative cents from account A to B. Before the transfer A holds 10,000 and B holds 2,000, totaling 12,000. After it, the correct values are 7,500 and 4,500, still totaling 12,000. A crash between separately committed debit and credit would leave the total wrong.

**Atomicity** means the transaction's committed changes happen as a group or not at all. **Consistency**, in ACID's sense, means correctly written transactions preserve declared invariants. An **invariant** is a rule that must hold in valid states, such as a conserved transfer total or a unique match sequence. Atomic grouping does not invent those rules.

A transaction can atomically debit A by 2,500 and credit B by 2,000. Both statements commit together, but the business rule is wrong because the amounts differ. Constraints and correct transaction logic must enforce the valid transition. The words "uses transactions" are not proof that the application preserves its intended state.

@fig sd_databases_transfer | Illustrative cents before and after a correct transfer. The total is computed and unchanged.

**ACID** names atomicity, consistency, isolation, and durability. Keep all four visible: partial groups, broken invariants, concurrent observations, and survival after failure are different questions. A design can satisfy one while making a weaker promise about another.

@fig sd_databases_acid | Four separate commit questions, including consistency. Each row names a promise rather than implying the label enforces application rules.

:::story Picture this
A cashier moves money between envelopes and checks the total before closing the ledger entry. Treating both moves as one entry prevents a half-recorded transfer. It still does not correct a cashier who copied the amount incorrectly; the balance rule needs its own check.
:::

## 17. Isolation and durability need explicit contracts

Two scorers read score 10 and both calculate an increment. If each later writes its private result 11, one increment disappears. **Isolation** constrains the observations and interactions of concurrent transactions. It asks what histories can commit, rather than whether the application happened to run on one thread.

An atomic expression such as `UPDATE matches SET score = score + 1` lets the database coordinate the row update under its conflict rules. A read-then-write sequence using a stale computed value has a different dependency. Protect the needed history with the appropriate transaction, locking, conditional update, or retry rule; do not assume all SQL spellings express the same operation.

**Durability** defines what acknowledged committed data survives. A local durable log can protect against a process crash or machine restart under storage assumptions. Synchronous replication can add survival across a defined machine failure. Neither automatically protects against deleting all copies, corrupted backups, or a whole-region failure.

@fig sd_databases_lost_update | Illustrative stale overwrite. Two intended increments should produce 12, while two writes of the privately computed value can leave 11.

Changing flush or replication settings changes the acknowledgement promise. That can be a valid latency choice, but name the accepted loss exposure. "Committed" in an application log is insufficient evidence unless it refers to a completed database acknowledgement under the promised configuration.

:::interview Interview lens
**"Does ACID mean my write survives any failure?"** No. Durability has a failure model and configuration. I specify whether success waits for local log flush, remote durable copies, or another boundary. I separately explain backup recovery and external effects instead of treating the acronym as an unlimited guarantee.
:::

## 18. Isolation levels describe allowed histories

A reader checks the same match twice while another transaction commits a correction. Should both reads see the same version? An **isolation level** selects a class of permitted concurrent histories. The name is useful only when connected to the engine's actual visibility and conflict rules.

**Read uncommitted** permits dirty reads in the SQL standard's minimum model. **Read committed** excludes uncommitted changes but can give successive statements different committed views. **Repeatable read** prevents a changed reread of existing rows in that minimum model. **Serializable** requires committed effects to correspond to some serial transaction order.

| Standard minimum | Dirty read | Changed row reread | Phantom set | Serialization anomaly |
|---|---|---|---|---|
| Read uncommitted | May occur | May occur | May occur | May occur |
| Read committed | Prevented | May occur | May occur | May occur |
| Repeatable read | Prevented | Prevented | May occur | May occur |
| Serializable | Prevented | Prevented | Prevented | Prevented |

Those are minimum protections, not identical implementations. PostgreSQL treats read uncommitted as read committed. Its repeatable-read transaction snapshot also prevents the listed phantom phenomenon, yet can still permit write skew. A different engine can implement the same named level with different mechanisms and stronger guarantees.

@fig sd_databases_isolation | Standard minimum protections, separated from engine-specific stronger behavior. A level name does not identify its locking algorithm.

Higher isolation can add blocking, dependency tracking, or aborted work. Choose the least expensive contract that actually protects the rule, not the weakest name that seems familiar. [PostgreSQL's isolation documentation](https://www.postgresql.org/docs/18/transaction-iso.html) gives its concrete snapshot and retry behavior.

## 19. Dirty, non-repeatable, and phantom reads

Transaction B changes score 10 to 11 but has not committed. If A reads 11 and B then rolls back, A observed a value that never belonged to committed history. A **dirty read** exposes another transaction's uncommitted change. Waiting or reading an older committed version can avoid that observation.

Now B commits between A's reads. A first reads 10 and later reads 11. This **non-repeatable read** concerns the same row, and both observed values were committed. It can be acceptable for separate fresh requests, but surprising when one transaction expects to calculate against a fixed view.

A **phantom read** changes the set of rows matching a predicate. A initially counts two active scorers; B inserts another qualifying scorer and commits; A repeats the predicate and counts three. No original row had to change. Protecting individual returned rows alone does not necessarily protect the absence of other matching rows.

| History | First observation | Concurrent change | Later observation |
|---|---|---|---|
| Dirty read | Uncommitted 11 | B rolls back | 11 never committed |
| Non-repeatable read | Committed 10 | B commits 11 | Same row gives 11 |
| Phantom read | Two qualifying rows | B inserts qualifying row | Three qualifying rows |

@fig sd_databases_anomalies | Illustrative committed change between two statements. This is a non-repeatable read, because B's value is committed before A reads it.

@fig sd_databases_phantom | Illustrative changed predicate result. Protecting known rows is not the same as protecting the whole matching set.

Give an interviewer the exact interleaving before the anomaly name. That demonstrates which dependency breaks the rule and which protection is required. A stable snapshot can preserve the reader's set without guaranteeing every concurrent decision is safe to commit.

## 20. Write skew survives a stable snapshot

Heron requires at least one active scorer for a match. Asha and Bo are initially active. Asha's transaction sees both active and turns Asha off; Bo's concurrent transaction sees the same initial snapshot and turns Bo off. Each thinks the other scorer remains available.

**Write skew** occurs when concurrent transactions read shared facts but update different records, producing an invalid combined result. The illustrative active count falls from two to zero. There is no same-row write conflict to force either transaction to wait. Stable reads did not protect the cross-row decision.

| Step | Asha's transaction | Bo's transaction |
|---|---|---|
| Read snapshot | Asha on, Bo on | Asha on, Bo on |
| Decision | Bo remains, so leave | Asha remains, so leave |
| Write | Asha off | Bo off |
| Combined commit | No active scorer | No active scorer |

@fig sd_databases_write_skew | Illustrative different-row writes based on the same snapshot. Neither transaction's private explanation predicts their combined result.

A **serialization anomaly** means the committed result cannot match any serial order of those transactions. If Asha left first, Bo's subsequent check would see only Bo and decline to leave. The reverse order has the same protection. Serializable execution prevents both incompatible decisions from committing together, often by aborting one for a whole-transaction retry.

An explicit common coordination row can also serialize the decision: lock the match's permission row before checking active scorers, with every relevant writer following that protocol. Locking only each departing scorer is insufficient. On retry, reread the rule and recompute the decision; replaying the stale update defeats the protection.

:::warn Watch out
Serializable does not mean the engine executes transactions one at a time. It promises a result equivalent to a suitable serial order. A correct application still handles aborted transactions, and external actions must not be repeated carelessly while the whole database transaction retries.
:::

:::key In one breath
A transaction groups local effects, and ACID separates grouping, invariants, concurrent histories, and failure survival. Isolation levels describe permitted observations, with stronger engine-specific details. A snapshot prevents some changed reads but can permit write skew across different rows. Protect the business decision and retry the entire rejected transaction using fresh state.
:::

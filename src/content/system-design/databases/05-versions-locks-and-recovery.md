@part V | MVCC, locks and deadlocks | We explain how a reader sees old committed state while a writer changes it. Versions reduce some waits but cannot remove conflicting decisions or finite storage. We will trace visibility, cleanup, lock ownership, and a deadlock cycle. | where:5

## 21. MVCC chooses a visible version

A reader opens a report while a scorer updates the match. Blocking that reader until every write finishes would make long reports disrupt the live service. **Multiversion concurrency control**, or **MVCC**, keeps enough versions for a reader to select the one its visibility rules permit.

A **snapshot** describes which transactional changes the reader can see. Conceptually, a version carries information about the transaction that created it and the transaction that replaced or removed it. The engine combines those facts with the reader's snapshot and transaction status. A wall-clock timestamp alone is not the visibility algorithm.

Our illustrative row starts at score 10. Writer B creates score 11 while reader A retains an older snapshot. A continues to see 10; a suitable later reader C sees committed 11. During B's uncommitted work, unrelated readers must not treat its new version as committed truth. Rollback leaves the old valid state rather than exposing the abandoned value.

@fig sd_databases_mvcc | Illustrative version selection. Physical versions coexist while different snapshots require different committed views.

Implementations differ in where they keep older values. PostgreSQL keeps row versions in its heap; some engines reconstruct earlier values through undo records. Both must decide visibility and eventually reclaim unnecessary history. The benefit is fewer reader-writer conflicts for ordinary reads, not unlimited independent access to every record.

A reader at read committed can take a new statement snapshot, while a transaction-snapshot level preserves the earlier view. That is the connection between storage versions and Part IV's visible histories. The engine's version mechanism serves the chosen contract; it does not independently choose the application's isolation requirement.

:::story Picture this
A reviewer reads yesterday's saved document while an editor writes today's revision. Both files can exist until the reviewer finishes. Keeping both versions avoids forcing the reviewer to pause, but the editor still cannot safely overwrite another editor's work without a conflict rule.
:::

## 22. Old snapshots turn history into retained work

A reporting transaction remains open long after its user stopped watching. New updates accumulate while that snapshot can still need old values. **Vacuum**, in PostgreSQL's terminology, includes reclaiming dead row-version space when it is safe to do so. Version retention is a resource consequence of the visibility promise.

A replaced version is not immediately disposable merely because the latest reader prefers another version. Some active snapshot can still need it. Cleanup must also maintain indexes and visibility metadata. Removing bytes too early would make an otherwise valid old read impossible or incorrect.

For an illustrative 5,000 retained obsolete versions of 500 bytes each, row payload alone is $5,000\times500=2,500,000$ bytes. That excludes page slack and index effects. The purpose of the count is to connect a long-lived snapshot to physical retention, not to predict a production vacuum schedule.

@fig sd_databases_version_retention | Illustrative old snapshot holding back reclamation. Ending the snapshot makes cleanup possible; it does not guarantee instant file shrinkage.

An application can reduce the cost by finishing transactions promptly and avoiding idle sessions inside a transaction. Database monitoring should distinguish dead versions, retained log, actual file size, and reusable free space. A cleanup process can make space reusable inside a file without returning that file's bytes to the operating system.

[PostgreSQL's vacuum documentation](https://www.postgresql.org/docs/18/routine-vacuuming.html) explains these different maintenance jobs. A database that seems to grow despite deleting rows may need visibility and maintenance analysis rather than another deletion command.

## 23. Locks protect a particular conflicting operation

Two scorers attempt to update the same match. A **lock** grants access under an engine-defined compatibility rule; an incompatible operation waits or fails. Row locks can coordinate writers even while ordinary MVCC readers use older committed versions. A lock does not imply that every reader is blocked.

Suppose A locks match `m7`, checks its current sequence, and prepares an update. B's competing locking operation cannot assume that old sequence is still available. It waits for A to commit or abort, then follows the engine's isolation and conflict rules. A **conditional update** can instead express an expected version in the update predicate and inspect whether the update succeeded.

```sql
UPDATE matches
SET score = score + 1, version = version + 1
WHERE match_id = 'm7' AND version = :expected_version;
```

Here `version` is an application concurrency value, not the engine's internal transaction identity. A changed version can make the predicate match no row, telling the caller to reread and reconcile. It avoids silently applying a decision computed against an older application state.

@fig sd_databases_row_lock | Illustrative conflicting writers on one match. The wait ends after the owner's decision, with visibility governed by the chosen isolation level.

Locks have scope and lifetime. A short physical **latch** protects an internal memory structure and differs from a transaction's logical lock. Schema changes can also require stronger locks. Observe the held resource, owner, waiting operation, and duration; "database lock" is too broad to identify the remedy.

:::warn Watch out
A locking read of existing rows does not necessarily reserve all absent rows that could satisfy a future predicate. Protecting the active-scorer rule may need a common locked record or serializable execution, as Section 20 showed. Lock the decision's scope, not merely whichever rows happened to be returned.
:::

## 24. Deadlocks are cycles rather than long waits

A owns match X and waits for match Y. B owns Y and waits for X. Neither can finish and release its first lock. A **deadlock** is a cycle in the wait-for relationship: progress requires one participant to release something while it is itself waiting for another participant in the cycle.

This is different from B waiting behind a slow but progressing A. A **lock timeout** bounds the wait even when there is no cycle. A deadlock detector can identify a cycle and abort a participant; the application must then retry or report failure according to its operation contract.

@fig sd_databases_deadlock | Illustrative two-transaction wait cycle. Removing either transaction's work and locks breaks the cycle.

Acquiring shared resources in the same order prevents this particular cycle. If both transactions lock X before Y, B waits before owning Y, so A can complete. Keep transactions short and avoid network calls while holding contested locks. A consistent order must cover every caller that takes those resources, including maintenance paths.

:::interview Interview lens
**"How do you fix a deadlock?"** I inspect the cycle, not just the query that was selected as a victim. I standardize acquisition order where possible and shorten the holding interval. The caller still retries the whole aborted transaction with fresh reads and safe operation identity.
:::

:::key In one breath
MVCC gives readers versions compatible with their snapshots. Older snapshots can retain obsolete versions and delay cleanup. Locks coordinate conflicting operations under a defined scope, while deadlocks are cycles that require a broken wait relationship. Visibility, storage reclamation, and conflict control are separate mechanisms that must work together.
:::

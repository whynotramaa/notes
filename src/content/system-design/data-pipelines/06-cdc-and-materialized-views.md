@part VI | CDC and materialized views | We derive another representation from committed changes. Reading changed rows without a consistent capture position can miss or double data. We will trace CDC, snapshot handoff, keyed updates, and maintaining a materialized result. | where:6

## 21. CDC follows accepted source changes

Polling a table's `updated_at` field can miss equal timestamps, deletes, or changes committed around the polling boundary. **Change data capture**, or CDC, transfers committed data changes from a source into another processing path. A log-based implementation can interpret committed changes from the database's write-ahead history.

The captured record needs identity, operation, source position, and enough before/after information for the intended transform. A delete must be a first-class change, not the absence of a row in the next scan. The consumer's checkpoint records how far the target has durably applied those changes under its recovery protocol.

@fig sd_data_pipelines_cdc | Illustrative log-based CDC path. The capture contract identifies committed operations and their replay positions.

[PostgreSQL logical decoding](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html) describes extraction from WAL and warns that changes can repeat after a crash. The generic consumer must therefore handle repeated effects safely. A source capture mechanism with ordered output does not make an unrelated target write exactly once automatically.

:::story Picture this
A clerk copies every correction recorded in the scorer's accepted change register. The clerk records the register number last completed. Copying only the current visible pages would miss pages that were removed. The change register carries the delete as an action with its own place in history.
:::

## 22. Snapshot and stream need a handoff

A new warehouse begins with a full source copy, then follows CDC. If the snapshot ends and streaming begins at unrelated positions, changes between them can be lost or duplicated. A **snapshot handoff** relates a consistent source view to the exact point after which change capture supplies later changes.

The source can provide a snapshot tied to a log position, or another documented capture protocol can buffer changes during copying. Read the snapshot under that protocol, apply it, then consume the corresponding later change suffix. Stable keys and source versions handle any deliberate overlap. Guessing from copy start and end timestamps is not equivalent.

@fig sd_data_pipelines_handoff | Illustrative consistent capture relationship. The source snapshot and stream boundary are compatible by protocol.

The copy can finish while the capture tail remains behind. Do not declare the new projection current solely because every snapshot row was written. Compare captured and applied positions under the handoff protocol, then publish the intended boundary. Deletes during copying must travel through the tail or another compatible reconciliation rule.

A slow CDC consumer can retain source log resources. That protects replay but can fill source storage. Monitor retained-log age and bytes, not only consumer process health. If the replay horizon is lost, restart from a fresh consistent snapshot under an explicit repair procedure rather than pretending the old checkpoint can resume.

## 23. Upserts and deletes maintain keyed state

A source row's value changes from 4 to 6. The analytical sum must remove 4 and add 6, not add another 6 beside the old contribution. An **upsert** inserts a missing keyed row or updates an existing one. A CDC projection needs a source key and version so retries and older changes do not overwrite newer state.

For the sum example, the net adjustment is $-4+6=2$. A delete retracts the prior stored contribution. The consumer may need the before image or a keyed record of the last contribution to compute that removal. If it discarded the old value, an incoming delete cannot reveal how much to subtract.

@fig sd_data_pipelines_cdc_update | Computed illustrative CDC projection update. The delete rule requires the retained prior contribution.

Not every aggregation supports easy deletion. A minimum can change when the smallest member is removed, requiring retained members or recomputation. An approximate sketch may not support arbitrary subtraction. Explain update and deletion behavior before claiming a streaming aggregate can maintain any query incrementally.

:::note Source order and cross-source joins
CDC from one transaction log can give a defined source order. Independent databases have different order and capture positions. A join across their changes needs an explicit consistency and lateness contract. Combining two offsets into one dashboard does not create a distributed transaction snapshot.
:::

## 24. Materialized views store prepared answers

The dashboard repeatedly asks for current runs by team. A **materialized view** stores a derived query result so readers can retrieve it without recomputing the full input each time. Maintenance can be batch refresh, incremental updates, or another engine-specific mechanism.

Our raw contributions produce red 7 and blue 3. A view keyed by team stores those totals, together with its progress or result version. A new red contribution updates red's row. A correction retracts or recomputes according to the view's supported maintenance rule. Read latency improves by moving work into view construction and update.

@fig sd_data_pipelines_view | Computed illustrative materialized totals. Metadata explains which source history and transformation produced them.

The view can lag or fail independently of source transactions. Define whether readers accept stale values, fall back to a bounded recomputation, or receive an unavailable response. A full-source fallback for every failed dashboard query can collapse the OLTP system that separation was meant to protect. Plan degradation rather than creating an accidental hot path.

:::warn Watch out
A sum projection processing duplicate change events can double its effect even when the final source row is correct. Deduplicate the change identity or coordinate keyed prior-state replacement and progress. Source uniqueness is not target-effect uniqueness.
:::

:::interview Interview lens
**"How do you build a view from CDC without losing updates?"** I would start from a snapshot tied to a capture position, then apply the later change suffix. Stable source keys and versions make upserts and repeats safe. Deletes and aggregate corrections need prior contribution information or recomputation. View publication exposes a freshness position and a tested rebuild path.
:::

:::key In one breath
CDC captures accepted changes, including deletes, with replay positions. Initial copying and ongoing capture need a compatible handoff. Keyed updates and aggregate retractions require the previous contribution and an older-version rule. A materialized view gives fast reads by storing a derived answer with progress, lag, and repair obligations.
:::

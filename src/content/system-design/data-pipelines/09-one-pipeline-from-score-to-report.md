@part IX | Case study: score to report | We reconcile capture, computation, storage, and publication into one design. A pipeline is complete only when changes and failures have a trace. We will count Heron's input, follow a corrected total, rebuild history, and defend the final architecture. | where:9

## 33. Follow one accepted record

The score service accepts event c with red contribution 4 at event time 2. Its source transaction commits, and CDC or a durable publication path makes the change available with identity and source position. Validation checks its schema. The processor routes red to its state owner and assigns the event-time window `[0,5)`.

That window's red sum changes from 2 to 6. The pipeline publishes a versioned view update under the sink's recovery contract. Later red contribution 1 belongs to `[5,10)`, making that window's red total 1 while the running red sum becomes 7. The time-window view and running view are different queries over the same source.

@fig sd_data_pipelines_full | Computed illustrative event c trace. The running red total and five-second window totals are separate outputs.

A viewer reading the analytical table sees its result version and freshness boundary. If event c arrives late under the window policy, the output may be corrected or routed to repair. If it repeats after failure, identity and the compatible checkpoint/sink protocol prevent a second contribution. The architecture now explains the failure as well as the arrow.

:::story Picture this
The clerk receives a scored slip, checks its source identity, files it into the correct timed tray, updates the tray's total, and publishes the tray's labelled result. A correction revisits that contribution rather than pretending it is an unrelated extra slip. Recovery uses the saved tray state and source progress together.
:::

## 34. Count input, storage, and state

Twenty events per second produce 1,728,000 daily records. At two hundred payload bytes each, that is 345,600,000 bytes per day. Thirty days retains 10,368,000,000 payload bytes. Three total copies produce 31,104,000,000 payload bytes before formats, indexes, snapshots, and output tables.

A one-day deduplication registry holding thirty-two raw identity bytes per event would contain 55,296,000 bytes before lookup and runtime overhead. That is a distinct state workload, not part of the event payload calculation. Decide whether exact identity retention is required for that horizon or whether a versioned keyed effect supplies a smaller correctness boundary.

@fig sd_data_pipelines_totals | Computed illustrative counts. Format, metadata, runtime overhead, checkpoint copies, and other outputs are separate.

The history can contain corrections and schema versions, so payload byte counts alone do not define query meaning. A reader needs the row type and transformation contract as well as the storage size. Keeping identity and capture metadata adds physical bytes but supplies the information that deduplication, auditing, and repair use after a failure.

A thousand sixty-four-byte state values hold 64,000 raw bytes, while windows, dedup IDs, and joins may need much more. State sizes follow retained information and horizon. Measure serialized checkpoints and restoration time under actual schemas. Raw arithmetic explains where the budget comes from, but it cannot predict every runtime overhead.

## 35. Rebuild history without harming the live job

A corrected transform needs seven days of source history. At twenty records per second, that is 12,096,000 records. At an assumed two thousand records per second, the backfill takes 6,048 seconds before contention and publication work. A **backfill** computes previously available history under a stated transformation and output boundary.

Run it with controlled resource allocation so it does not starve live processing. Write another output generation or identified ranges and reconcile overlap with the ongoing stream. Reusing the live additive sink without distinguishing backfill identity can double historical contributions. Source versions and result generation boundaries must decide which output becomes authoritative.

@fig sd_data_pipelines_backfill | Computed illustrative backfill duration. Live input continues and competes for resources unless isolated.

Reconciliation checks row counts, key totals, selected records, source progress, and the intended correction behavior. Counts alone cannot prove semantic correctness because a duplicated contribution and a missing one can cancel. Use small known traces and representative source samples, including deletes, late data, and repeated events.

:::note Repair should preserve meaning
A new transformation may intentionally change results rather than reconstruct the old computation. Label its version and document the new meaning. Reproducibility means we can explain the difference from input and transformation identity, not that every version must give the same answer.
:::

## 36. Defend the complete pipeline

The transactional source owns accepted changes. CDC or durable publication captures them at a named position. Controlled raw storage retains repairable inputs under privacy limits. A chosen batch or stream processor validates, groups, joins, and aggregates. A warehouse or controlled lake table publishes query-oriented results under a generation or version boundary.

The design states source snapshot handoff, schema evolution, lateness, deletes, duplicate effects, checkpoint restoration, sink compatibility, retained logs, backfill admission, and result freshness. It has a bounded repair path for bad records rather than an infinite retry loop. Each component's purpose is connected to a query or failure requirement.

@fig sd_data_pipelines_contract | Illustrative failure contract. Every branch preserves progress information and an explicit disposition.

:::warn Watch out
Do not report success solely because workers are running. A pipeline can be alive while its source lag grows, its sink rejects records, or its output generation never publishes. Observe accepted-input-to-visible-result progress and test restoration with actual failures.
:::

:::interview Interview lens
**"Design a score analytics pipeline."** I would isolate analytical queries from the live transaction path and capture accepted changes with positions and identities. The time, grain, and freshness requirement determine batch or streaming computation. Keyed state and source progress recover together, while the external sink uses an idempotent or transactional publication rule. The design includes snapshot handoff, late-data policy, deletes, schema repair, backfill capacity, and a measurable result boundary.
:::

:::key In one breath
An accepted change passes through capture, validation, keyed computation, and compatible output publication. Input payload, physical copies, dedup state, windows, and checkpoints have distinct budgets. Backfills are controlled identified computations, not invisible duplicates of live work. A complete pipeline explains time, progress, external effects, repair, and the query meaning of its published answers.
:::

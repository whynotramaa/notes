@part I | OLTP vs OLAP | We begin with a score transaction and a season-wide question. They need different access patterns even when they describe the same sport. We will separate OLTP from OLAP, keep a source of truth, and derive an analytical copy with a measurable freshness contract. | where:1

## 1. A single update and a million-row question

A scorer records one run. The transaction checks one match and changes a small set of records. Later, an analyst asks for total runs by team across the season. That query can read a large fraction of the history. Serving both workloads on the same unconstrained path lets a large scan delay the live score update.

**Online transaction processing**, or OLTP, serves operational actions such as creating a record or updating a score with transactional rules. **Online analytical processing**, or OLAP, serves questions across many records, often grouping and aggregating their values. These names describe workloads and design goals, not a prohibition on a database supporting both.

@fig sd_data_pipelines_workloads | Illustrative workload comparison. The distinction is the work performed, not whether the system happens to use SQL.

An analytical copy can be tuned for large reads without putting every scan on the transactional database. That choice adds synchronization, lag, schema evolution, and recovery work. Begin by naming the question, acceptable delay, and consistency requirement. A separate warehouse is useful when it solves those requirements, not because every system needs another box.

:::story Picture this
The scorer's desk records each accepted play promptly. A historian later studies all the scorebooks to compare seasons. Making the historian hold the scorer's current book for a long survey blocks the live job. A copied archive permits study, but the copy has to record which accepted pages it includes.
:::

## 2. Row storage and column storage read different bytes

A report row occupies an illustrative 500 bytes, but the analyst needs only an eight-byte numeric field. A **row-oriented layout** places much of each record together, making a complete record convenient to retrieve or change. A **column-oriented layout** places values of one field together, making a narrow-field scan convenient.

For a million rows, reading every 500-byte record touches 500,000,000 bytes under the simple exercise. Reading one eight-byte column touches 8,000,000 raw bytes. Dividing gives 62.5 times fewer raw field bytes. This ignores compression, indexes, headers, and storage pages, so it is an access-volume comparison rather than a measured speedup.

@fig sd_data_pipelines_column | Computed illustrative raw-byte scan comparison. Both layouts can have indexes, compression, and other optimizations beyond this exercise.

A query needing several columns reads their combined representation, while a predicate can require additional fields before it knows which rows qualify. Sorting and grouping can also allocate intermediate state. The narrow-column calculation isolates one mechanism. It should not be presented as the total query cost when the query actually performs joins, filters, or multiple aggregations.

Column values often share type and nearby patterns, which can help compression and vectorized processing. Frequent small updates can require another write path or compaction strategy. Row-oriented systems can answer analytics, and column systems can support point access, but their physical tradeoffs differ. Explain data layout before repeating a product label.

## 3. Freshness belongs to the derived answer

An analyst sees a total of ten even though another accepted run has reached the transactional database. The answer may be correct for an earlier source position but stale for the latest one. **Pipeline lag** measures how far the derived processing is behind a named source progress boundary.

A useful result can include an as-of position or freshness timestamp. The pipeline captures accepted changes, transforms them, and commits an analytical result. A producer's event timestamp is not automatically proof that every earlier change has been included. Source progress, processing progress, and result publication need compatible definitions.

@fig sd_data_pipelines_freshness | Illustrative progress boundaries. The output reports which accepted history it represents.

Measure the age of the oldest unprocessed accepted record or a comparable source watermark, with clock assumptions stated. If inputs can arrive late, result finality needs another policy beyond ingestion lag. A pipeline caught up to its transport offsets can still be missing late business events that have not yet arrived. The time part later separates those two questions.

:::note Analytical correctness can be provisional
A near-live dashboard can show a provisional window total and revise it after late events. A financial report may require a stronger finalization and audit policy. Specify whether results can change before choosing windows, lateness limits, and publication behavior.
:::

## 4. Derived data should be reproducible

A transformation bug counts a correction twice. The warehouse has plausible numbers, but there is no easy way to determine their source history. A **data pipeline** is the controlled path that captures, transforms, stores, and publishes data with progress and recovery rules. Reproducibility requires input identity, transformation version, and output meaning.

Keep raw accepted records or another authoritative history according to retention and privacy requirements. Attach source positions and schema versions. A repaired transformation can then rebuild the affected result from known inputs. Do not assume the last output alone contains enough information to reverse every processing error.

@fig sd_data_pipelines_reproduce | Illustrative reproducible pipeline. Retention and deletion policies constrain which rebuilds remain possible.

A transformation should be deterministic under its stated dependencies. If it looks up the current team name during replay, historical results can differ from the original run. Either version that reference data or state that the output deliberately uses current names. Hidden mutable dependencies turn a replay into a new calculation rather than a reconstruction.

:::warn Watch out
An analytical copy is not automatically a backup. It can omit fields, lose transaction relationships, and reproduce a bad transformation. Define restore needs separately from analytical query needs and test both paths when they are required.
:::

:::interview Interview lens
**"Why separate OLTP and OLAP?"** The live write path needs short transactional work, while analytical questions can scan and group many records. A derived analytical layout can isolate that work and optimize the fields being read. It introduces lag and recovery obligations, so I would state source progress, result freshness, and rebuild behavior. SQL can appear on both sides; workload is the distinction.
:::

:::key In one breath
OLTP and OLAP describe operational and analytical work. Physical layout determines which bytes a question reads. A derived answer needs a freshness boundary and a reproducible relationship to accepted inputs. Isolation helps only when synchronization, transformation versions, and repair are part of the design.
:::

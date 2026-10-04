@part II | Batch processing | We process a bounded collection of records. A finite job simplifies completion but delays fresh answers and can still fail halfway. We will select a batch boundary, trace transformations, publish atomically, and recover retries without double counting. | where:2

## 5. A batch has a defined input boundary

Heron collects an hour of accepted score events and processes them together. **Batch processing** operates on a bounded input collection with a known completion point. At twenty events per second, an illustrative hour contains 72,000 records and 14,400,000 payload bytes.

The boundary might be a file set, source offset range, or consistent database snapshot. A wall-clock name like *the noon batch* is not enough if events arrive late or files continue changing. Record the exact input set and its versions. The job can then repeat the same calculation after a failure.

@fig sd_data_pipelines_batch_boundary | Computed illustrative hourly batch size. The manifest or position range defines a reproducible input.

At an assumed 2,000 records per second, processing takes 36 seconds. Under uniformly distributed arrivals within the hour, mean wait before the batch starts is 1,800 seconds. A record just missing the previous boundary can wait roughly one interval plus the next job's 36 seconds, or 3,636 seconds under this simplified schedule. These are assumptions, not product defaults.

:::story Picture this
A clerk closes a tray of scoring slips, writes their serial-number range on the lid, and calculates its total. A late slip goes into a stated correction tray. Calling the first tray *morning* without writing which slips it contains makes rerunning the calculation ambiguous.
:::

## 6. Map records before grouping them

Our tiny input contains four records: red adds 2, blue adds 3, red adds 4, and red adds 1. A **map operation** transforms each record independently, such as emitting a `(team, runs)` pair after validation. It does not need all records together when its meaning depends only on that record.

The mapped output is `(red,2)`, `(blue,3)`, `(red,4)`, and `(red,1)`. The operator must handle invalid fields under a declared policy instead of silently treating a missing number as zero. Preserve event identity through the transform when later duplicate suppression or lineage needs it.

@fig sd_data_pipelines_map | Computed illustrative mapped contributions. Event identities remain available for auditing and retry-safe processing.

Transformations should preserve the declared row grain. Exploding a record with several tags into several output rows changes how later sums must interpret that contribution. If the same scoring value travels on every exploded row, grouping by another field can count it repeatedly. Name that relationship and normalize the contribution before a downstream aggregate assumes independent facts.

A **filter operation** excludes records under a condition. Its rejected count is part of the output's meaning. A pipeline that reports successful processing while rejecting most source records is not serving the intended analysis. Track invalid, filtered, and accepted records separately and retain enough context to repair rejected data safely.

## 7. Shuffle puts equal keys together

The red contributions may begin on different workers. To sum them by team, a **shuffle** redistributes intermediate records so equal grouping keys reach the same aggregation owner. A **reduce operation** combines those grouped values into the chosen result.

The red owner receives `[2,4,1]` and computes 7. The blue owner receives `[3]` and computes 3. Their total is 10. The shuffle moves data across workers and can dominate a job even when each addition is cheap. A local pre-aggregation can combine red values within each worker before transfer, reducing records when the operation permits it.

@fig sd_data_pipelines_shuffle | Computed illustrative grouping and sums. Unicode arrows describe transformation inside labels; all sums are in data-pipelines-numbers.py.

Pre-aggregation is safe for a compatible associative combination, such as sum. An average requires both sum and count, not an average of unequal-size local averages. A hot key can concentrate most intermediate work on one owner. Splitting or salting that key requires a final combination preserving the chosen result's semantics.

:::note Averages need their weights
A local average discards how many records produced it unless the count travels with it. Carry a sum and count, combine both, then divide. This is a small example of information needed for correct distributed aggregation.
:::

## 8. Publish a complete batch result

A worker writes red's total and crashes before writing blue's. Readers now see a mixture of new and old output. A **publication boundary** makes a complete result generation visible as one logical version. Build the generation under a job or batch identity, validate it, then switch the reader's manifest or transactional pointer.

On retry, the same batch identity should replace or recognize its own output rather than add it again. Writing `total=total+batch_sum` without a durable batch-application record duplicates results after an uncertain acknowledgement. A transactional target can record the batch ID with its effect. A file target can publish a committed manifest of the successful generation.

@fig sd_data_pipelines_publish_batch | Illustrative complete-result publication. Temporary partial data is not the current published result.

Task attempts can leave abandoned files or partial target rows. Cleanup needs attempt IDs and ownership rules so an old attempt cannot remove a newer committed generation. Job-level completion does not automatically give atomic visibility at every external sink. Define the sink publication protocol explicitly.

:::warn Watch out
A retry-safe batch input does not make an additive external write retry-safe. The target effect and batch identity must be coordinated. Otherwise the same known input can still contribute twice after a lost response.
:::

:::interview Interview lens
**"How does a batch job avoid half-published reports?"** I would identify its bounded input and write a new output generation under a stable batch identity. Validation checks all expected partitions before a manifest or transactional pointer makes the generation visible. Retries recognize that identity rather than add it again. The sink's publication protocol is part of correctness, not just the worker algorithm.
:::

:::key In one breath
A batch uses a reproducible bounded input and has a completion boundary. Map handles independent records, shuffle groups keys, and reduce combines them with the right retained information. Runtime and schedule determine freshness. Publish a complete identified generation so partial attempts and retries do not create mixed or doubled answers.
:::

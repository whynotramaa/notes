@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. How do OLTP and OLAP differ?**

OLTP serves operational actions with short transactional work, while OLAP answers broader analytical questions across records. The distinction is workload rather than SQL versus another language. Isolation can protect writes from scans. A derived analytical copy introduces freshness and recovery obligations.

**Q2. Why use column storage?**

A question needing one field can read that field across rows without retrieving every complete record. In the raw-byte exercise, one eight-byte column reads eight million bytes against five hundred million full-row bytes. Compression and physical page behavior are additional. This is a layout tradeoff, not a universal performance guarantee.

**Q3. What is pipeline lag?**

It is distance behind a named accepted-source progress boundary. Define whether the metric measures offsets, oldest input age, or another compatible source position. Process health alone does not prove the output is current. Late business events can also be missing before they reach transport offsets.

**Q4. What makes a derived result reproducible?**

Known input identities and versions, a transformation version, and declared reference dependencies. A replay can then reconstruct or explain the result. Looking up mutable current reference data can change historical output. Raw retention and privacy limits constrain future repair.

**Q5. What defines a batch?**

A bounded reproducible input collection, not just a scheduled clock time. It can be a manifest, offset range, or consistent snapshot. Completion and publication refer to that identified set. Late inputs need a stated next-batch or correction policy.

**Q6. How fresh is an hourly batch?**

Its interval creates waiting before computation begins, and runtime adds further delay. Under uniform arrivals the one-hour mean pre-start wait is 1,800 seconds. At the assumed capacity the job adds 36 seconds of runtime. Queueing, failures, and late-data policies can increase that delay.

**Q7. What does map do?**

It transforms records independently under its stated dependencies. Our four events become keyed contributions for red and blue. Preserve identity where audit or retry-safe processing needs it. Invalid and filtered records require explicit counted dispositions.

**Q8. What does shuffle do?**

It redistributes intermediate records so equal keys reach the grouping owner. Network, serialization, and skew can dominate the aggregation arithmetic. Local pre-aggregation can reduce transfer if the combine operation retains the required information. A small final result does not imply a small shuffle.

**Q9. Why not average local averages?**

Unequal group sizes give them different weights. Carry sums and counts, combine both, then divide. An average without its count loses information needed for correct distributed combination. The same principle applies to other statistics with required sufficient information.

**Q10. How does a batch publish atomically?**

Build and validate a new output generation, then expose it through a manifest or transactional pointer. Retry attempts are identified and do not add the same batch again. The external sink needs that publication rule. Completed worker tasks alone do not prove complete reader visibility.

**Q11. How is streaming different from an endless batch?**

The logical input stays open, so the computation produces incremental state or bounded-window results instead of waiting for all future records. A streaming API may execute continuously or through micro-batches. Its state, progress, and publication semantics matter more than the label.

**Q12. What is keyed state?**

Stored operator information associated with a grouping key, such as red team total. Routing must bring related contributions to the correct logical owner. Rescaling requires coordinated state and source progress transfer. Balanced partition counts do not guarantee balanced key work.

**Q13. Why checkpoint source positions with state?**

They must describe the same completed input prefix. Restore state five after a and b and resume at c, not at a or beyond d. Either fact alone can lose or repeat contributions. The sink boundary may require additional coordination.

**Q14. What is backpressure?**

A bounded inability to accept more downstream work that slows upstream stages. It prevents queue growth from becoming unlimited memory use. Retained input provides a replayable backlog within its horizon. Lag and queue age make the delayed result visible.

**Q15. How do you calculate catch-up?**

Subtract ongoing input from recovery processing capacity, then divide backlog by that net rate. Twelve thousand divided by one hundred net records per second gives 120 seconds. Capacity equal to incoming rate never drains the backlog. Restore and external sink time are additional.

**Q16. Why are emitted rows ambiguous?**

A row can be an additive fact, a complete replacement, or a changelog update. Adding successive running totals double-counts. Keys, versions, and operation types must state how the sink applies each row. Choose the representation from the query and recovery contract.

**Q17. What is a retraction?**

It removes a prior contribution so an update or deletion can revise the derived result. Replacing four with six contributes minus four plus six, a net two. Some aggregates require retained members or recomputation rather than simple subtraction. The old value must be available under a declared rule.

**Q18. How do event and processing time differ?**

Event time is a business occurrence timestamp, while processing time is an operator observation. Delays and retries can make them different. Choose the time that answers the intended question and validate its trust source. Neither timestamp alone proves input completeness.

**Q19. What is a tumbling window?**

A consecutive non-overlapping interval assignment. The exercise uses [0,5) and [5,10), including the left boundary and excluding the right. Each event belongs to one such interval. Overlapping sliding or mergeable session windows have different state behavior.

**Q20. What does a watermark mean?**

It expresses event-time progress under a stated lateness assumption. The exercise uses maximum observed seven minus disorder margin two, giving five. It permits time-based work but does not prove no older event can arrive. Late-data policy remains necessary.

**Q21. Why consider all input watermarks?**

A fast input can otherwise finalize a window before a slower relevant input supplies its events. A conservative combined progress rule often uses the minimum participating input watermark. Idle-input policy permits progress but changes later-arrival treatment. Required failed inputs may deserve a different policy.

**Q22. What happens to late events?**

The pipeline can update retained windows, publish corrections, route repair work, or discard under an explicit lossy contract. It must count and expose the disposition. Longer allowed lateness retains more state and delays finality. Choose the policy from business completeness requirements.

**Q23. What does ETL mean?**

Extract source data, transform it, then load the prepared representation into the target. It can enforce target semantics early and avoid propagating unnecessary fields. Repair still needs retained source inputs and transformation identity. The transform can be small when the workload is small.

**Q24. What does ELT mean?**

Extract and load controlled raw data first, then derive representations in the destination. Raw storage still needs format validation, sensitive-data policy, schema interpretation, and retention. ETL and ELT can coexist by assigning different transformations to different boundaries.

**Q25. What is a warehouse?**

An analytical store organized for integrated query-oriented data. Facts and dimensions provide one common structured approach. Table grain and historical reference semantics must be explicit. A warehouse can still yield wrong sums if joins multiply rows.

**Q26. What is a lake?**

A flexible storage layer often holding files in object storage for later processing. A catalogue and table or dataset snapshot define interpretation and visibility. A folder listing is not a transaction. Governance, schema, and deletion policies remain required.

**Q27. Why do small files hurt?**

They multiply listing, open, metadata, and task scheduling work even when total payload is modest. Minute files in the exercise create 1,440 daily objects. Compaction can reduce that overhead but adds rewriting and publication work. File size should follow measured reader and storage behavior.

**Q28. What is CDC?**

Capture of accepted source changes into another processing path. Log-based capture can carry operation type and replay position, including deletes. A current-row scan alone cannot reveal every removed record or commit boundary. The target must still apply repeats safely.

**Q29. Why is snapshot handoff difficult?**

Copying and capture must agree which changes are included in the initial view and which belong to the later stream. An unrelated timestamp boundary can create a missing or repeated interval. Use a documented consistent capture protocol and idempotent overlap handling.

**Q30. Can CDC repeat changes?**

Yes, uncertain progress after crashes or reconnect can repeat delivery. Source order and transport uniqueness do not guarantee external target-effect uniqueness. Stable keys, versions, identities, and compatible target transactions make repeats harmless. Observe retained capture resources as consumers lag.

**Q31. How do deletes affect aggregates?**

A delete removes the prior contribution, which requires a before image or retained keyed value. Some statistics need recomputation or richer state. Treat deletion as an explicit operation. Omission from future updates does not remove its old analytical effect.

**Q32. What is a materialized view?**

A stored derived query answer maintained by batch refresh or incremental work. It moves computation away from repeated reads and adds lag, correction, and recovery obligations. Store its source progress and meaning. A fast view lookup has upstream maintenance costs.

**Q33. What is a checkpoint barrier?**

A marker used by certain engines to coordinate a consistent recoverable snapshot across flowing inputs and operators. Alignment or channel-state treatment is engine-specific. The goal is a consistent cut, not simultaneous wall-clock freezing. External sinks may need another compatible publication mechanism.

**Q34. Does exactly-once state include every side effect?**

No. Internal checkpoint restoration can ensure operator state reflects inputs once while an unrelated sink addition repeats after a lost acknowledgement. Compatible transactional or idempotent sink behavior extends the boundary. Draw the crash between effect and recorded completion to test the claim.

**Q35. Why is deterministic sum not idempotent?**

It computes the same value for the same inputs, but applying an addition twice changes the target twice. Replacing a keyed version with the same value can be idempotent. Computation repeatability and effect repeat safety are distinct properties.

**Q36. What does Spark driver coordinate?**

It plans and schedules application tasks through executor resources and observes their progress. Executors process partitions and exchange data. Collecting a large intermediate onto the driver can create a single memory bottleneck. Input and sink attempt rules still determine retry correctness.

**Q37. What makes a Spark shuffle stage expensive?**

Data must be repartitioned by key across executors with serialization, network, and storage work. Skew can concentrate work and create stragglers. Legal local combinations reduce transfer. Final output size alone does not predict this cost.

**Q38. What do Flink workers and coordinators own?**

TaskManagers run parallel processing tasks, while coordination roles manage execution and checkpoint/recovery responsibilities. Keyed state, source positions, checkpoint storage, and sink compatibility form the recoverable dataflow. Deployment arrangements vary, so use current primary documentation for process details.

**Q39. Spark or Flink?**

Compare bounded or open input, latency, event-time rules, keyed state, joins, connectors, and operational recovery. Both support more than a single workload category. Existing expertise and a simpler adequate processor can matter more than framework popularity. Verify the actual mode and sink guarantees.

**Q40. What makes a backfill safe?**

An identified historical input and transformation version, controlled capacity, separate or versioned output, and a reconciliation/publication boundary. Its overlap with live processing must not double effects. Validate semantics with known traces and source samples, not counts alone. Retention determines what can be repaired.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute daily events and payload bytes.

**E2** • Compute thirty-day logical and three-copy payload storage.

**E3** • Compute hourly batch size and assumed runtime.

**E4** • Compute mean wait and simplified worst scheduled delay.

**E5** •• Map the four records and reduce by team.

**E6** •• Trace incremental keyed sums.

**E7** •• Assign event times 1,3,2,7 to five-second tumbling windows.

**E8** • Compute the illustrative watermark.

**E9** •• Explain why time-2 input can be late after the first window emits.

**E10** • Compute equal partition rates and total processing capacity.

**E11** • Compute raw keyed-state size.

**E12** • Compute simplified thirty-second checkpoint replay.

**E13** •• Restore checkpoint total five at offset one.

**E14** •• Show duplicate external effect if c repeats.

**E15** •• Replace contribution four with six.

**E16** • Compute one-day raw deduplication identities.

**E17** • Compute row versus one-column raw scan volume.

**E18** •• Explain snapshot plus CDC handoff.

**E19** •• Publish a batch whose first worker succeeds and second fails.

**E20** • Compute minute-file count and payload.

**E21** • Compute compacted daily file count at the chosen target size.

**E22** • Compute seven-day backfill records and raw runtime.

**E23** •• Compute catch-up for twelve thousand records with continuing input.

**E24** ••• Choose a sink rule for retried materialized totals.

**E25** ••• Design a repair for a transform bug while live input continues.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Twenty times 86,400 gives 1,728,000 events. Multiplying by two hundred bytes gives 345,600,000 payload bytes. Format, replica, and metadata costs are additional.

**E2.** Multiply daily 345,600,000 by thirty to get 10,368,000,000 bytes. Three total copies give 31,104,000,000. This retains event payload, not every warehouse and checkpoint output.

**E3.** Twenty times 3,600 gives 72,000 events. At two hundred bytes, payload is 14,400,000 bytes. Divide records by assumed two thousand per second to get 36 seconds.

**E4.** Uniform hourly arrivals wait an average half of 3,600, or 1,800 seconds, before processing starts. A record just missing a boundary waits one interval plus thirty-six runtime seconds, giving 3,636 under the simplified schedule.

**E5.** The mapped pairs are red 2, blue 3, red 4, red 1. Group red into [2,4,1] and blue into [3]. Sums are red 7 and blue 3, with total 10. Preserve record identity if later retries require it.

**E6.** After a, red is 2 and blue 0. After b, red 2 and blue 3. After c, red 6 and blue 3. After d, red 7 and blue 3. Each accepted contribution appears once.

**E7.** Times 1,3,2 fall in [0,5), where red totals 6 and blue 3. Time 7 falls in [5,10), where red totals 1 and blue 0. The half-open interval rule avoids a shared boundary belonging twice.

**E8.** Maximum observed event time is seven and the bounded-disorder margin is two. Subtract to obtain five. The policy can release earlier interval work but does not prove late events are impossible.

**E9.** The watermark policy may have advanced beyond its interval and permitted publication or cleanup. A new time-2 record then needs the declared update, repair, or loss branch. Arrival is real even if it violates the progress assumption.

**E10.** Twenty input records divided by four partitions gives five per second per partition under equal balance. Four consumers at assumed ten per second give forty total capacity. A hot key can violate equal balance.

**E11.** One thousand keys times sixty-four bytes gives 64,000 raw bytes. Runtime lookup overhead, windows, buffered inputs, and checkpoint metadata are additional. State cost follows what is retained.

**E12.** Twenty events per second times thirty seconds gives six hundred events. At two hundred bytes each, replay payload is 120,000 bytes. Failed or slow checkpoints can enlarge the actual replay interval.

**E13.** The saved prefix contains offsets zero and one with values two and three. Resume at offsets two and three, adding four and one. Final total is ten. Resuming at zero with state five would repeat the prefix.

**E14.** Correct total is 2+3+4+1=10. Reapplying c gives 2+3+4+4+1=14. Internal state recovery alone cannot undo an unrelated external addition; the sink needs identity or a coordinated transaction.

**E15.** Retract minus four and add plus six. The net change is two. A later delete removes the retained six. Without the prior contribution, the consumer cannot compute the correct retraction from a bare delete.

**E16.** There are 1,728,000 daily records. Thirty-two identity bytes each give 55,296,000 bytes. Index and runtime overhead remain additional, and the retention horizon is a declared correctness policy.

**E17.** A million five-hundred-byte rows require five hundred million bytes. A million eight-byte column values require eight million. The ratio is 62.5, before physical formats and compression.

**E18.** Obtain a consistent source view related to capture position P. Load that view and apply its documented later change suffix. Stable keys and versions handle deliberate overlap. Arbitrary copy timestamps do not establish the missing-change boundary.

**E19.** Keep its output generation uncommitted while required partitions remain missing. Retry identified attempts and validate the full successful set. Only then switch the reader manifest or transactional pointer. Readers continue seeing the prior complete generation.

**E20.** A day divided by sixty seconds gives 1,440 files. Twenty events times two hundred bytes times sixty gives 240,000 payload bytes per file. This illustrates metadata overhead, not a universal file-size recommendation.

**E21.** Divide 345,600,000 daily payload bytes by 128,000,000 and round upward, giving three files. The final file may be smaller. Actual files also contain format and metadata bytes.

**E22.** Seven times 1,728,000 gives 12,096,000 records. Divide by assumed two thousand processed per second to obtain 6,048 seconds. Contention, state restore, and publication time are additional.

**E23.** Processing capacity is one hundred twenty per second and new input twenty, leaving a net hundred. Twelve thousand divided by one hundred gives 120 seconds. At equal input and capacity the backlog would never drain.

**E24.** Use a stable result key and version with idempotent replacement, or coordinate transaction publication with checkpoint completion. Do not add repeated full totals. A crash after effect but before recorded progress must leave a detectable repeated identity or a recoverable committed result.

**E25.** Retain named source history under policy and run the corrected transform with a new version into identified output. Allocate capacity so live processing retains its latency budget. Reconcile overlap using source positions, verify known traces including deletes and late data, then publish a controlled generation. Counts alone cannot prove the correction is semantically right.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[PostgreSQL logical decoding](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html). WAL-derived changes, replay, slots, and snapshot continuity.

[Flink event time](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/). Event-time and watermark semantics.

[Flink stateful processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/). State snapshots and recovery.

[Flink architecture](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/flink-architecture/). Coordination and task runtime responsibilities.

[Spark cluster overview](https://spark.apache.org/docs/latest/cluster-overview.html). Driver, executor, and cluster-manager roles.

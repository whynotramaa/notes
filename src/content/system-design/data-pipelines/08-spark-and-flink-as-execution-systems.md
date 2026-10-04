@part VIII | Spark and Flink | We connect the processing ideas to concrete worker architectures. Naming a framework does not explain where tasks, state, and scheduling live. We will trace Spark's driver and executors, shuffles, Flink's coordinators and workers, and the choice between them. | where:8

## 29. Spark's driver plans work

A batch job reads Heron's event files and groups by team. In Spark, a **driver** runs the application's coordination and builds work to be scheduled, while **executors** run tasks and retain data for that application. A cluster manager supplies resources according to the deployment mode.

The driver derives tasks from the planned computation and input partitions, sends work to executors, and observes completion or failures. It should not collect the whole large dataset into its own memory merely to calculate a sum. Results intended to stay distributed can be written by tasks under a controlled publication protocol.

@fig sd_data_pipelines_spark | Illustrative Spark application roles. Stages and tasks depend on the actual plan and partitioning.

[Spark's cluster overview](https://spark.apache.org/docs/latest/cluster-overview.html) documents driver, executor, and cluster-manager responsibilities. Resource limits and failure behavior depend on the deployment. A driver crash can interrupt coordination, while a task retry can repeat output work. The job's input identity and sink publication rules still matter.

:::story Picture this
A coordinator assigns bundles of scoring slips to clerks, then tells them how to exchange team-specific bundles. The coordinator does not need every slip piled on the coordinator's desk. A worker loss means another clerk repeats its assigned bundle using the declared output-attempt rule.
:::

## 30. Stages follow exchange boundaries

An independent map can run where an input partition is read. Grouping by team needs equal keys together, so a shuffle separates stages of work. A **stage** groups work under the execution system's scheduling and dependency model. A **task** processes one scheduled portion of that work.

The tiny example maps four records, redistributes red's values `[2,4,1]` to one aggregation owner and blue's `[3]` to another, then writes totals 7 and 3. Local combinations reduce transferred data when legal. Broad joins and repartitioning can create large exchanges even if final results are small.

@fig sd_data_pipelines_stages | Computed illustrative map-shuffle-reduce plan for the four-record input. The physical task count is not inferred from the diagram.

A failed shuffle task can be recomputed from the relevant input under the engine recovery rules. That does not mean arbitrary side effects inside a map or reduce task are safe to repeat. Keep computation separate from controlled output publication, and make task attempts identifiable when they write temporary data. Retry behavior belongs in the physical execution explanation.

A **broadcast join** can distribute a small reference table to workers so large fact partitions join locally. It is useful only if the supposedly small side fits the chosen resource budget. A shuffled join moves records by key and must handle skew. Do not call a join cheap because the output happens to contain few rows.

## 31. Flink coordinates long-lived dataflow

A live windowed dashboard needs state and event-time progress to continue as input arrives. In Flink's architecture, the **JobManager** coordinates execution, checkpoints, and recovery roles, while **TaskManagers** run parallel tasks and exchange data. The precise component arrangement depends on deployment and the documented version.

Tasks implement sources, transformations, stateful operators, and sinks. Keyed state belongs to the operator's partitioned computation, with a configured state backend and checkpoint storage. Scaling or restoring that state is coordinated work rather than simply adding a consumer and hoping its memory contains the right total.

@fig sd_data_pipelines_flink | Illustrative Flink responsibility diagram. Checkpoint storage and the state backend have distinct configured roles.

Checkpoint storage must survive the failures it is meant to repair. Storing the only checkpoint on a worker disk that disappears with that worker does not meet that requirement. State backend configuration decides how live state is maintained, while checkpoint storage decides where a recoverable snapshot persists. They have related but different jobs.

[Flink's architecture documentation](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/flink-architecture/) explains these runtime responsibilities. Use it for version-specific deployment details rather than memorizing a timeless process count. The interview explanation should connect each named role to scheduling, processing, state, or recovery.

:::note Frameworks evolve
Spark supports structured streaming and Flink supports bounded inputs as well as streams. Avoid the slogan that Spark means batch and Flink means streaming. Compare the actual API, execution mode, state, latency, connector, and operational requirements of the workload.
:::

## 32. Choose from the workload and recovery contract

An hourly report with bounded files, broad joins, and an existing batch platform may fit Spark well. A low-latency event-time job with long-lived keyed state may fit Flink's streaming model well. These are workload observations, not exclusive capabilities. A simple twenty-event-per-second projection may require neither distributed framework if a small reliable processor meets its contract.

Compare input size, update latency, state size, window and lateness needs, joins, supported sinks, team experience, and recovery operations. Every extra distributed component adds deployment and failure handling. The useful question is whether that complexity solves a measured bottleneck or a semantic requirement unavailable in the simpler implementation.

@fig sd_data_pipelines_choice | Illustrative decision checklist. The rows apply to either framework and to a small custom processor.

Operational ownership matters. Someone must monitor lag, manage schemas, test checkpoint restore, repair bad records, and control backfills. A tool offering a feature does not establish that the deployed job uses it correctly. Put those procedures beside the normal architecture before declaring the pipeline production-ready.

:::warn Watch out
Do not collect a distributed intermediate result into the driver just to avoid learning the output protocol. That can move the largest memory requirement onto one coordinator and make every worker's parallelism irrelevant.
:::

:::interview Interview lens
**"Spark or Flink for this pipeline?"** I would first describe bounded versus ongoing input, latency, keyed state, event-time behavior, joins, and sink recovery. Spark's driver/executor planning and Flink's coordinated stateful dataflow are implementation choices to evaluate against those needs. Both support more than one workload category. A small reliable processor may be enough when volume and semantics do not require a distributed engine.
:::

:::key In one breath
Spark separates driver coordination from executor tasks and exchanges data across stage boundaries. Flink coordinates workers, state, time progress, and checkpoints in its dataflow architecture. Both can process bounded and unbounded work under their supported modes. Choose the execution model and connectors from semantic and operational requirements rather than a product-name shortcut.
:::

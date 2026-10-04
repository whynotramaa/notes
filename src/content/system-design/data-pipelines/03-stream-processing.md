@part III | Stream processing | We keep the computation open as records arrive. An unbounded input has no final last record to wait for. We will maintain keyed state, partition work, bound queues, and define what a continuously changing result means. | where:3

## 9. An unbounded input needs incremental work

Waiting for every future score event would never finish. **Stream processing** computes over arriving data while the input remains open. It can maintain a current result or publish bounded windows instead of waiting for the whole stream to end.

For the tiny sequence, the red running sum moves from zero to 2, then to 6 when the third record arrives, then to 7 on the fourth. Blue moves from zero to 3. A **stateful operator** stores information from earlier records that later records need. The running sum is state; the map that extracts a team is stateless under its simple rule.

@fig sd_data_pipelines_running | Computed illustrative keyed running-sum trace. Each input identity contributes once under the stated semantics.

A stream engine must manage both input progress and state. Restarting a process with only the latest source offset can lose the sum. Restarting with only the sum and an earlier offset can repeat additions. The recovery part will combine them in a checkpoint. Continuous execution does not remove the need for a consistent restoration boundary.

:::story Picture this
A clerk keeps a running total beside an endless conveyor of numbered slips. The clerk cannot wait for the conveyor to stop. To resume after a break, the clerk needs both the written total and the serial number through which it was computed. Either fact alone is insufficient.
:::

## 10. Keyed state has an owner

All contributions for red must update the same logical sum, or a defined merge protocol must combine partial sums. **Keyed state** associates stored operator data with a grouping key. The engine routes equal keys to the same state owner under its partitioning rule.

Four illustrative input partitions each receive five events per second under equal balance. If each assigned consumer can process ten per second, total capacity is forty per second against twenty input. Those averages do not protect a single hot key whose events all reach one owner. Key distributions and per-record cost determine real capacity.

@fig sd_data_pipelines_keyed | Illustrative keyed ownership. The computed red and blue sums come from the same four-record input.

Kafka-style event streams provide partitioned retained inputs and consumer progress rather than a finished analytical answer. The processor chooses a key and reads the corresponding ordered partition positions into its state protocol. Kafka retention and replay can repair transport gaps, while keyed aggregation, event-time interpretation, and sink effects remain processor responsibilities. A broker name does not replace those mechanisms.

Rescaling moves key ownership and its state. The engine must coordinate that movement with source progress and checkpoint restoration so two owners do not independently mutate the same logical state. A map of keys to workers is not enough; the state migration and activation protocol matters. Use the engine's tested mechanism rather than inventing a distributed handoff casually.

## 11. Backpressure slows an upstream stage

A sink writes more slowly than transformations produce output. A **backpressure** mechanism bounds queued work and propagates the inability to accept more records toward upstream stages. Without it, a long-running job can consume memory until it fails, even if each operator is individually correct.

The input log absorbs a bounded recoverable backlog while consumers slow down, under its retention limit. Source progress must not advance beyond work the recovery protocol can restore. Queue age and input lag make the delayed product effect visible. A queue depth of zero in one operator does not prove the external sink is current.

@fig sd_data_pipelines_backpressure | Illustrative bounded stream path. The retained log and checkpoint define recovery while processing falls behind.

If backlog is twelve thousand records, new input remains twenty per second, and recovery capacity is one hundred twenty, net drain is one hundred per second. Catch-up takes 120 seconds. Dividing backlog by total processing capacity would wrongly ignore new arrivals. Reserve recovery capacity beyond normal demand and retention beyond the expected outage plus catch-up period.

:::note Continuous and micro-batch execution
A streaming API can implement work as continuously scheduled records or as frequent bounded micro-batches. The distinction affects latency and execution details, but either can serve an unbounded logical query. Name the actual engine mode before comparing behavior.
:::

## 12. Streaming outputs can be updates

A running total changes after each accepted contribution. The sink can append every version, overwrite the keyed current value, or receive changes to a result table. A **changelog output** describes inserts, updates, or removals in a derived relation rather than pretending every emitted row is an independent fact to add.

An update from contribution 4 to contribution 6 changes the sum by 2. A retraction-style representation can emit minus 4 followed by plus 6. The net adjustment is 2. If a sink adds both old and new complete totals, it double-counts instead of applying the update semantics.

@fig sd_data_pipelines_retraction | Computed illustrative retraction trace. The output contract decides whether the sink receives a replacement or explicit changes.

Sink keys, ordering, and version checks determine how repeated updates behave. A compacted keyed topic, a transactional upsert table, and an append-only audit log serve different purposes. Pick the representation from the reader's question and the recovery contract. A streaming label cannot resolve incompatible output semantics.

:::warn Watch out
Do not add every emitted running total to another total. Running totals are replacements or versioned snapshots, while raw contributions are additive facts. Declare the row's meaning before writing sink code.
:::

:::interview Interview lens
**"What makes a stream processor stateful?"** Its later output depends on information retained from earlier records, such as a keyed running sum. State ownership, source progress, and recovery must move together. Backpressure bounds work when a downstream stage cannot keep up. The sink also needs a contract for whether output rows are facts, replacements, or changelog updates.
:::

:::key In one breath
Stream processing maintains results while input remains open. Keyed state connects related records and needs coordinated ownership and recovery. Backpressure and retained input bound falling behind, while catch-up uses spare capacity after new arrivals. Output semantics determine whether the sink appends, replaces, or retracts a result.
:::

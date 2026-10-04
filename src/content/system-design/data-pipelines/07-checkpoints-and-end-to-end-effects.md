@part VII | Checkpoints and exactly-once | We restore a consistent computation after failure. Saving state or committing offsets alone leaves an ambiguity. We will trace checkpoints, duplicate effects, sink coordination, and bounded recovery capacity. | where:7

## 25. Save state with source progress

The processor has consumed records a and b and holds total 5. A **checkpoint** captures a recoverable combination of operator state and source positions. In the tiny input, the completed position is offset 1 when offsets start at zero. The checkpoint stores that position and state 5.

After a crash, restore both, then read c and d at offsets 2 and 3. Their values 4 and 1 add 5, giving the correct total 10. Restoring state 5 while starting again at offset 0 repeats a and b. Starting at offset 2 with empty state loses them. Consistency lies in the pair.

@fig sd_data_pipelines_checkpoint | Computed illustrative checkpoint and restore trace. Source position convention is explicitly zero-based.

Under an illustrative thirty-second checkpoint interval, twenty events per second can require replaying up to six hundred recent events from the last completed checkpoint in the simplified exercise. That is 120,000 payload bytes. A checkpoint that takes time or fails can increase the gap, so the interval alone is not a strict recovery-work bound.

:::story Picture this
The clerk writes both the running total and the serial number of the last included slip on a recovery card. Restarting from the card is safe because the two facts describe the same prefix. A total copied at one moment and a serial number copied later can describe different histories.
:::

## 26. Barriers coordinate distributed state

A pipeline has several inputs and stateful operators. A consistent checkpoint must avoid a combination where one operator includes a message another operator has not yet represented under the chosen protocol. A **checkpoint barrier** is a marker used by some engines to organize a distributed snapshot boundary in the flowing data.

Operators coordinate the boundary across inputs and record state according to the engine's alignment or channel-state mechanism. Aligned and unaligned approaches have different backpressure and snapshot-cost tradeoffs. The concept is a consistent recoverable cut, not a demand that every machine stop at one wall-clock instant.

@fig sd_data_pipelines_barrier | Illustrative checkpoint coordination. The engine's protocol determines channel treatment and snapshot completion.

A checkpoint completes only when every required snapshot component is durably available according to the protocol. One worker writing its state does not establish job-wide completion. A failed attempt can leave partial checkpoint data that must not be selected for restoration. Retain a known completed generation until the replacement is fully committed.

[Flink's stateful-processing documentation](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/) describes coordinated snapshots and restoring state with source positions. These guarantees depend on configured checkpointing and compatible sources. A framework name alone does not tell us whether a particular job has its recovery mechanism enabled or correctly stored.

## 27. Exactly-once state is not every external effect

Record c adds 4. A crash occurs after an external sink applies that addition but before the job records completion. Replay applies c again, giving an incorrect total 14 instead of 10 in the tiny sequence. A consistent internal state checkpoint does not automatically roll back an unrelated external write.

**At-least-once processing** permits repeated processing after uncertain completion. **Exactly-once state semantics** means recovered operator state reflects each accepted input once under the engine's protocol. **End-to-end exactly-once effects** also require compatible source and sink behavior around that protocol.

@fig sd_data_pipelines_duplicate | Computed illustrative duplicate-effect trace. Internal recovery does not by itself undo an external addition.

An idempotent keyed sink can overwrite a result version instead of adding twice. A transactional sink can coordinate output publication with checkpoint completion. A target transaction can record input identity with its effect. Choose a compatible mechanism and state its limits, especially when output is email, an API call, or another irreversible action.

:::note A sum is deterministic but not idempotent
Adding the same 4 twice changes the result. Replacing a keyed value with the same version can be idempotent. Determinism says repeated computation produces the same proposed value; idempotency says repeating the applied effect does not change the outcome again.
:::

## 28. Recovery must outrun new input

The job has twelve thousand waiting records after an outage. Input continues at twenty per second. With one hundred twenty processing capacity per second, net catch-up is one hundred and recovery takes 120 seconds. At twenty capacity, it never drains; at less than twenty, lag grows further.

**Recovery headroom** is spare processing and downstream capacity available beyond ongoing demand. It includes state restoration, replay, sink writes, and any background compaction or maintenance. A healthy steady-state rate does not establish a useful outage recovery time.

@fig sd_data_pipelines_catchup | Computed illustrative catch-up duration under constant rates. Real restore time and sink bottlenecks are additional.

Heron's illustrative thousand state keys at sixty-four bytes each occupy 64,000 bytes before runtime overhead. A thirty-second snapshot would write an average 0.002133333 MB per second if it rewrote only that raw state. Real checkpoint formats, metadata, incremental state, and storage latency can change the cost. Keep the raw count and measurement separate.

:::warn Watch out
A committed source offset with an uncommitted sink effect loses work. A committed sink effect with an uncommitted offset can repeat it. State, progress, and target visibility need a compatible recovery rule; ordering two independent calls cannot make them atomic.
:::

:::interview Interview lens
**"Does Flink give exactly once?"** I would distinguish its checkpointed operator-state guarantee from external effects. A compatible source and transactional or idempotent sink can extend the guarantee to output under the configured protocol. An arbitrary side-effecting API call cannot be assumed to roll back on replay. I would draw the failure between the sink effect and checkpoint and explain its repair rule.
:::

:::key In one breath
A checkpoint combines source positions and operator state for one consistent prefix. Distributed barriers coordinate that recoverable cut. Internal exactly-once state and external exactly-once effects have different boundaries. Recovery needs spare capacity after ongoing input and a sink protocol that makes uncertain retries safe.
:::

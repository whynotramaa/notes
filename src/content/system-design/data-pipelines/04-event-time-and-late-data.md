@part IV | Event time, windows, watermarks | We ask when the event happened rather than only when the worker saw it. Network delay can put the same history into a different arrival order. We will trace windows, watermarks, late events, and bounded state without claiming that a clock makes data complete. | where:4

## 13. Arrival time is not occurrence time

The four illustrative records have event times 1, 3, 2, and 7. The third record arrives after the second even though it happened earlier. **Event time** is a timestamp describing when the business event occurred. **Processing time** is when a particular operator handles it. They can differ because of network delay, batching, offline clients, and retries.

An event-time aggregate assigns a record using its declared occurrence time. A processing-time aggregate assigns it using the worker's observation clock. Both are valid when they answer the intended question. A report about plays within a match interval generally wants event time; a dashboard about current ingestion load wants processing observations.

@fig sd_data_pipelines_times | Computed illustrative event-time sequence. The third arrival is out of timestamp order.

Validate timestamps and their trust source. A client can submit an implausible future time that pushes a naive progress rule forward. Clock skew and corrections require a declared policy. Event time is data, not guaranteed truth; processing time is an observation, not the same business moment.

:::story Picture this
A scorer sends numbered slips from different rooms. A slip stamped two minutes can arrive after one stamped three minutes. Sorting by when the delivery clerk received them answers a delivery question. Sorting by the scorer's stamp answers a play-time question, provided the stamp itself is trustworthy.
:::

## 14. Windows bound an otherwise open aggregate

A season-to-date sum can remain open, but a report may need totals for fixed intervals. A **window** groups records according to a time or count boundary. An illustrative five-second tumbling window uses non-overlapping intervals `[0,5)` and `[5,10)`. The left boundary is included and the right excluded, so every timestamp belongs to one interval.

Events at times 1, 3, and 2 belong to the first window. Red contributes 2 and 4, giving 6; blue contributes 3. Event time 7 belongs to the second window, where red contributes 1. A **tumbling window** has consecutive non-overlapping boundaries, while a **sliding window** can include a record in several overlapping intervals.

@fig sd_data_pipelines_windows | Computed illustrative event-time tumbling windows. Interval width is a teaching assumption.

A record exactly at time five belongs to the second interval under the stated half-open rule, not both. Window assignment happens before aggregation, so the rule must remain consistent during replay and backfill. A timezone or timestamp-unit conversion applied differently in another run can change membership even when the raw event is identical.

A **session window** groups activity separated by sufficiently short inactivity gaps. It can require merging previously separate groups when a late event connects them. State retention and output updates therefore depend on window type. Do not assume every window can close simply because a worker's clock reaches the interval end.

## 15. A watermark states a progress assumption

The processor has observed a maximum event time of 7 and allows an illustrative two-second out-of-order margin. A simple **watermark** rule produces $7-2=5$. A watermark is a progress signal expressing that the system believes ordinary relevant events before a point have arrived under its chosen assumptions.

The five-second window can become eligible for output or cleanup according to the engine's watermark and boundary rules. This is not proof that no older event can ever arrive. The system still needs a late-data policy for events violating the assumption. The rule is a controlled trade between latency, completeness, and retained state.

@fig sd_data_pipelines_watermark | Computed illustrative bounded-disorder watermark. Late-data handling remains necessary after the signal advances.

Multiple input partitions may advance at different rates. Combining them conservatively often requires the minimum relevant input watermark; otherwise a fast partition can cause the job to finalize before a slow one delivers its records. An idle partition needs an explicit idleness policy or it can hold progress forever. [Flink's time documentation](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/) describes event time and watermarks in its execution model.

:::note Idle and failed inputs are different
Declaring an input idle can permit time progress, but later records from it may become late. A failed required input may instead warrant pausing or reporting degraded completeness. The watermark policy should match the business completeness requirement rather than silently treating every quiet input as irrelevant.
:::

## 16. Late events need an output policy

After a window is emitted, a record with time 2 arrives. Options include updating the window, routing the record to a late-data repair path, or dropping it under an explicitly lossy contract. **Allowed lateness** defines how long or under what progress boundary the job keeps a window able to accept such corrections.

An updatable result should carry a key and version so the sink can replace the earlier value. An append-only sink can instead publish correction events whose semantics readers understand. If late records are discarded, count them and make the resulting completeness limit visible. A hidden drop can bias totals while normal throughput looks healthy.

@fig sd_data_pipelines_late | Illustrative late-record branches. The policy determines whether the previously emitted result can change.

Window state costs grow with keys, active windows, lateness horizon, and operator data per key. A larger delay budget retains more state and can increase checkpoint and recovery cost. The useful question is which lateness the product must accommodate and how exceptional older data is repaired. Infinite retention is not a recovery design.

:::warn Watch out
Advancing a watermark to the maximum observed timestamp treats any disorder as impossible. One future-dated event can then finalize too much history. Validate time data and choose a stated progress rule with an explicit late-data disposition.
:::

:::interview Interview lens
**"What is a watermark?"** It is an event-time progress signal used to decide when time-based work can proceed under a lateness assumption. It is not certainty that no older event exists. Multiple inputs and idle partitions affect progress, and late arrivals need a stated update, repair, or loss policy. That policy determines latency, completeness, and retained state.
:::

:::key In one breath
Event time describes the business timestamp, while processing time describes operator observation. Windows define assignment boundaries and aggregate related records. Watermarks express a progress assumption so an open stream can emit bounded results. Late-event disposition and state retention decide whether those results are provisional, correctable, or final under a declared limit.
:::

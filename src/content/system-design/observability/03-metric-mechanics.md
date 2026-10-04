@part III | Counters, gauges, histograms | We turn repeated observations into bounded series. A dashboard can lie even when every sample is correct. We will build counters, gauges, distributions, and label budgets. | where:3

## 9. Counters and rates

The request counter increases until the process restarts and its value returns to zero. A **counter** records a cumulative nonnegative count within an instance lifetime. Its absolute value is rarely the chart we need; changes over time reveal the event rate.

Read two valid observations, subtract the earlier from the later, and divide by elapsed time, while treating a restart as a reset. At 1,000 requests per second, a 60-second interval contains 60,000 attempts. If 600 fail, the error rate is 600 divided by 60,000, or 0.01. Read that expression aloud: failed eligible attempts divided by all eligible attempts over the same interval. Summing counters from instances before handling their resets can hide a reset inside another instance’s increase.

The failure numerator must come from the same request population as the attempt denominator. If failures include authentication rejections but attempts count only admitted handlers, the ratio describes no coherent set of events. Process a restarting instance's counter reset before combining its rate with the other instances. Otherwise another instance's increase can conceal the reset and produce an apparently ordinary fleet change. Keep the observed interval and scrape validity alongside the calculation. The illustrated 60,000 attempts and 600 failures establish the interval fraction; they cannot establish the outcome of requests that never entered this measurement boundary.

@fig sd_observability_09 | Illustrative counters and rates. Counter differences yield the attempt rate and the failure fraction for the same interval. Orange marks the computed interval rate and failure fraction.

A missing scrape is not a zero counter. Query behavior must distinguish gaps, resets, and genuinely no traffic.

:::story Picture this
A water meter records the total litres that have passed through a pipe, while a stopwatch measures the flow during a chosen minute. Reading the meter once tells you little about the current flow, but two readings divided by elapsed time give a rate. If the meter is replaced, the new starting reading must not be mistaken for water suddenly flowing backward.
:::

## 10. Gauges and state

The API has a connection pool with 40 slots, of which 32 are busy. A **gauge** measures a present quantity that can increase or decrease. Here occupancy is 32 divided by 40, or 0.8, but occupancy alone does not say whether callers are waiting.

Record busy slots, maximum slots, waiter count, and acquisition delay together. A pool can remain fully occupied while serving quickly, or nearly empty because the database is unreachable. Gauges should describe the state after the operation they observe, with cleanup that runs on exceptions. If an in-flight gauge increments at entry but fails to decrement on an error path, it reports a leak in the instrument rather than a leak in the application. Compare state with completion rates to detect that inconsistency.

Follow a request that needs a database slot. It first joins acquisition waiting, then owns a slot while the operation runs, and finally releases it even if the query fails. Instrument those state transitions so waiting does not count as occupied capacity and cancellation removes the waiter. The illustrated 32 busy slots out of 40 can accompany prompt acquisition or severe waiting if occupancy changed between samples. Compare wait durations and completion rates rather than choosing a larger pool from that snapshot alone. If the instrument retains busy slots after all operations finish, inspect cleanup before diagnosing a database connection leak.

@fig sd_observability_10 | Illustrative gauges and state. Occupancy describes busy slots; waiters and acquisition delay describe competition for them. Orange marks the separate waiter observation needed to interpret pool occupancy.

Summing memory gauges across machines measures total allocation, while averaging them measures a different quantity. Specify the question before choosing the aggregation.

:::note Gauge snapshots and state meaning
Use a gauge for current occupancy, queue length, or memory. Pair it with rates and wait durations, and update it through every exit path. The meaning of a high value depends on what resource it describes.
:::

## 11. Histograms and latency

A fast average hides the viewer who waits longest. A **histogram** groups observations into intervals and stores counts for those intervals. Unlike a mean, it retains enough distribution information to ask how much traffic falls below a threshold.

Heron’s illustrative latency sample contains 50 observations at 5 milliseconds, 45 at 40, four at 100, and one at 200. Cumulative counts are 50, 95, 99, and 100. For a nearest-rank percentile, choose the observation at the ceiling of the requested fraction times the count. The 99th observation is 100 milliseconds. A bucket covering a wide range cannot reveal the exact percentile inside that range; interpolation is an estimate from bucket data and must be described as such. Exact sample percentiles and bucket estimates are different calculations.

Read the cumulative rows as nested populations. The count at 40 milliseconds includes the observations already counted at five, so subtracting 50 from 95 gives the illustrated 45 observations in the next interval. Summing cumulative counts would count fast requests repeatedly. To combine instances, first add counts for matching boundaries and populations, then find the rank in that merged distribution. If bucket layouts differ, reconcile the layouts rather than treating their positions as interchangeable. The exact sample values in this example allow an exact nearest-rank answer; ordinary bucket counts only bound where the desired observation lies.

@fig sd_observability_11 | Computed illustrative interval counts, recovered from cumulative latency buckets: 50, 45, 4 and 1 requests. The columns show counts in the labelled intervals, whose bounds are in milliseconds.

Averages and percentile summaries generally cannot reconstruct the original distribution. Prometheus explains histogram and summary aggregation in its [histogram guidance](https://prometheus.io/docs/practices/histograms/).

:::warn Watch out
Use distributions for latency, and choose bucket boundaries near the user promise. Merge compatible bucket counts across instances before deriving a fleet percentile. Never average instance percentiles to obtain a fleet percentile.
:::

## 12. Cardinality and label budgets

A developer adds user_id to every latency measurement. The dashboard now has a distinct time series for each user and each existing label combination. **Cardinality** is the number of distinct series created by those combinations.

With 12 operations, six regions, and five result values, the possible combinations total 12 times six times five, or 360. An illustrative classic histogram with 12 buckets plus count and sum has 14 series per combination, making 5,040 series. Adding 50,000 users multiplies the base combinations to 18,000,000 before the histogram expansion. Put request and user identifiers in logs or traces, where querying individual records is the purpose. Metrics should use bounded dimensions that answer aggregate questions. Even bounded labels need a multiplication budget when combined.

A review should write down possible values, not merely count the label names. Operation, region, and result combine to form distinct identities even when every value is individually useful. Histogram storage then emits several related series for each identity, so a request identifier added later affects every bucket as well as count and sum. Remove individual identities from aggregate instrumentation before they reach the exporter. When one user needs investigation, locate its request in a log or trace and compare it with bounded population metrics. Dropping the offending label only in a dashboard leaves the ingestion and retention cost intact.

@fig sd_observability_12 | Illustrative cardinality and label budgets. A user label multiplies the series budget before histogram expansion. Orange marks the series growth caused by adding user identity.

A label that currently has few values can grow without bound if its source is free text, URLs with identifiers, or exception messages. Normalize routes and outcomes.

:::interview Interview lens
**"How do metric labels affect storage and diagnosis?"** Metric labels create series, not merely annotations. Multiply their possible values and include histogram expansion before approving a label. Keep individual identities in record-oriented evidence.
:::

:::key In one breath
Counters measure changes over time; gauges measure present state. Histograms preserve distributions for aggregation. Label combinations multiply storage and query work.
:::

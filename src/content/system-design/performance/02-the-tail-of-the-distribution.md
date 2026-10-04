@part II | p50, p95 and p99 latency | We inspect the viewers hidden by an average. A small slow fraction can dominate a page that waits for many services. We will build percentiles from observations, combine populations correctly, and explain fan-out. | where:2

## 6. Building p50, p95, and p99

Most viewers receive a score quickly, but a few wait for a disk read or a crowded connection pool. A mean cannot tell you where those viewers fall. A **percentile** identifies a position in an observed distribution. The p99 is a latency threshold at the 99th percentile, not the average latency of the slowest requests.

Use an illustrative sorted sample containing 50 observations at 5 ms, 45 at 40 ms, four at 100 ms, and one at 200 ms. There are 100 observations. The **nearest-rank** method chooses sorted rank $\lceil qn\rceil$, where $q$ is the requested fraction and $n$ is the observation count.

$$k=\lceil qn\rceil$$

Read this as: percentile rank $k$ is the ceiling of quantile fraction $q$ times sample size $n$. Ranks 50, 95, and 99 contain 5, 40, and 100 ms. The maximum is 200 ms. The mean is $(50\times5+45\times40+4\times100+200)/100=26.5$ ms.

Other estimators interpolate between samples, so two tools can report different values for the same small sample. State the estimator, population, and window. A p99 computed from sparse traffic is especially sensitive to which slow observations happened to arrive during that window.

@fig sd_performance_tail | Nearest-rank thresholds are computed from the specified illustrative 100-observation sample.

## 7. Histograms and fleet aggregation

Two application instances show p99 values of 5 ms and 200 ms. Averaging those values seems tempting, but it discards how many requests each instance served. A **histogram** stores counts in latency intervals. Compatible histograms can combine populations before calculating a fleet percentile.

Assume the first instance serves 1,000 requests, all at 5 ms. The second serves 10 requests, all at 200 ms. The pooled sample has 1,010 observations. Its nearest-rank p99 rank is 1,000, which still lies in the 5 ms group. Averaging the local thresholds gives 102.5 ms, a value no request experienced.

In practice, choose bucket boundaries that resolve the objective you care about. A coarse bucket spanning both acceptable and unacceptable waits cannot establish a precise threshold. The exporter may estimate a quantile within that bucket, so its displayed precision can exceed the data's actual precision.

Preserve the same units and compatible bucket definitions across instances. When distributions have different boundaries, merge raw observations or use a supported reaggregation method. Keep client-side failures visible too; a chart of only successful responses may exclude the very requests whose waits became intolerable.

@fig sd_performance_histograms | Illustrative pooled rank 1,000 yields a 5 ms fleet p99; averaging local percentiles is invalid.

## 8. Measurement bias under overload

A load generator sends a request, waits for its reply, and then sends the next. When the service slows down, the generator also slows its arrivals. The measurement can miss waiting experienced by users who would have continued arriving. **Coordinated omission** is this omission of observations caused by coupling the offered workload to delayed responses.

Use separate clocks for intended arrival and actual dispatch. An arrival-scheduled test can reveal whether the generator itself fell behind before the server saw the request. A closed-loop test is useful for a fixed population of users making sequential operations, but it should not silently stand in for independent incoming traffic.

For Heron, test score-page arrivals separately from established live connections. A connection test that gradually opens viewers says little about a match-start request burst. Preserve the planned arrival pattern and report any load-generator queue alongside the server queue. Otherwise a client-side bottleneck can look like a healthy service ceiling.

Do not erase timeouts from the report. Count successful responses, rejected requests, timeout outcomes, and useful completions after the client gave up. A server may finish abandoned work while the user retries, consuming capacity twice. [Gil Tene's HdrHistogram documentation](https://github.com/HdrHistogram/HdrHistogram) describes correction for coordinated omission and the assumptions behind it.

@fig sd_performance_omission | Illustrative open arrival schedule versus a reply-paced generator; no measured capacity is implied.

:::warn Watch out
A percentile of successful responses excludes failed and abandoned requests unless the measurement explicitly includes them. Pair latency with the outcome rate and the arrival rate so fast rejection does not appear to satisfy a successful-response objective.
:::

## 9. Fan-out and the last reply

Heron's page requests a score, a profile, and a clip preview. If all are required, the page waits for the last reply. **Fan-out** means one operation starts several child operations. It creates several opportunities to encounter a slow dependency even when each dependency is usually fast.

Assume each independent child finishes within a chosen threshold with probability 0.99. With 10 children, the probability that every child meets it is $0.99^{10}=0.9043820750088044$. The probability that at least one misses it is 9.5618%, rounded to four decimals. With 100 children, all meet it with probability 0.3660323412732292.

$$P(\text{all finish by }t)=p^n$$

Read this as: the probability every call finishes by threshold $t$ equals each call's success probability $p$ raised to call count $n$, under independence. Shared database or network stalls violate that assumption. Perfectly correlated calls would all share the same slow event instead of producing independent chances.

Reduce unnecessary calls before treating duplication as a cure. Cache shared metadata, combine lookups where ownership permits, or let optional previews arrive after the score. A page's serial intervals add, but parallel intervals end at the maximum. You cannot derive its p99 by adding child p99 values.

@fig sd_performance_fanout | Illustrative page waits for the slowest required child.
@fig sd_performance_fanout_probability | Computed independent-call success probability falls as required child count grows.

## 10. Deadlines, cancellation, and hedging

A viewer has already left, yet the server continues fetching a clip preview. The work cannot help that viewer, but it still occupies a connection. A **deadline** is the latest useful completion time for an operation. Propagating it lets each child decline work whose remaining budget is insufficient.

First subtract elapsed time from the parent budget. Then include connection acquisition and response travel in the child's budget, rather than granting a fresh full timeout at every hop. When the parent cancels, release the child's resources where the implementation supports cancellation. Measure work that finishes after cancellation to see whether the policy actually saves capacity.

**Hedging** sends a duplicate request after a delay when the original is unusually slow. Either successful answer can complete a safe read. Cancel the loser, use independent destinations when possible, and charge both attempts to the capacity budget. A shared overloaded database can make both copies slow while increasing the overload.

For writes, duplicates require an operation identifier and a defined deduplication boundary. A retry is not a harmless latency trick when it can apply an effect again. Start with one trace, identify the tail's cause, and then decide whether cancellation, a smaller critical path, or carefully budgeted hedging addresses that cause.

@fig sd_performance_hedging | Illustrative delayed duplicate with loser cancellation; the drawing specifies ordering rather than benchmark timing.

:::story Picture this
A group meal arrives only after every required dish is ready. Ordering another copy of a late dish can help if another cook can make it. It adds congestion if both copies join the same crowded kitchen queue.
:::

:::note The threshold is a product decision
The percentile answers how often a measured threshold is met. The product decides which operations must complete, which can arrive later, and which failures count against the objective. The measurement cannot make those decisions for you.
:::

:::interview Interview lens
**"Why is the page slower than every service's dashboard suggests?"** I verify population and timing boundaries first. A page waits for required dependencies, so independent fan-out increases the chance of a slow child. I inspect parent traces, pool waits, shared causes, failures excluded from the dashboards, and whether optional work can leave the critical path.
:::

:::key In one breath
Percentiles describe ordered observations with a stated estimator. Combine observations or compatible buckets before calculating fleet quantiles. Arrival-paced measurement and outcome counts expose waits that a reply-paced test may hide. Fan-out ends at the last required reply, and hedging helps only when its duplicate work fits the budget and the effect is safe.
:::

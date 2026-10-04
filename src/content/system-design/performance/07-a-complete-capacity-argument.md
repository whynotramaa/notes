@part VII | Case study: capacity estimation | We turn resource arithmetic into a design claim someone can review. A total without its workload and failure assumptions cannot defend an architecture. We will trace Heron's paths, count their budgets, and state the evidence still needed. | where:7

## 31. Failure capacity and headroom

Heron's illustrative application fleet has five servers, each assumed to sustain 300 requests per second for the chosen workload. All together provide 1,500 requests per second. Losing one leaves $4\times300=1,200$, which exceeds the assumed 1,000-request peak by 200.

**Headroom** is service capacity intentionally left unused for bursts, failures, and variance. Normal utilization of this capacity model is $1,000/1,500=66.6667\%$, rounded to four decimals. After one failure it is $1,000/1,200=83.3333\%$. These ratios alone do not prove the tail objective holds.

To survive one unavailable server under the same per-server capacity assumption, the fleet needs $\lceil1,000/300\rceil+1=5$ servers. The added server protects an application-server failure. It does not protect a shared database, a rack containing all servers, or a routing failure that isolates the whole fleet.

Run the workload with the failed node absent, not merely with a lower offered rate while all nodes remain healthy. Observe uneven routing, reconnect bursts, cache warm-up, and shared dependency usage. The failure budget is credible only when the surviving path meets its useful completion and latency objectives under those conditions.

@fig sd_performance_headroom | Illustrative normal capacity is 1,500 requests/s; one-server failure leaves 1,200 against demand of 1,000.

## 32. The API request budget

Follow one Heron score request from arrival to response. Admission reserves a bounded application slot; the handler consults the appropriate read path; the response returns and releases the slot. A cache miss adds dependency work, while a cache hit can avoid that work. Both still consume response bandwidth.

At the assumed peak and mean residence time, the API has 200 active requests. Its response payload is 2,000,000 bytes per second. If the illustrative CPU demand is 2 ms per request, it needs two CPU-seconds per second. Each figure counts a different resource, so none can substitute for the others.

For the four-page query example with a 90% page-reference hit ratio, physical read demand is 400 pages per second. At 4,096 bytes each, that is 1,638,400 read bytes per second. This model does not include writes, prefetch, or maintenance. It is a specific query-cost hypothesis to compare with storage measurements.

The pool's ideal 2,000-operation-per-second occupancy ceiling also belongs beside its assumptions. Check query hold time and actual dependency throughput during failures. Then retain a margin for changed request mix and misses. A single "requests per second" label on a box cannot describe the path's CPU, I/O, connection, and payload demands.

@fig sd_performance_api_trace | Computed illustrative request budgets attach distinct units to CPU, pool, storage, and response work.

## 33. The live delivery budget

A scorer emits an update, and Heron's gateways distribute it to subscribed viewers. Event production is 20 events per second; delivery is 1,000,000 recipient messages per second. The distinction determines where batching and coalescing can help without altering authoritative history.

With five illustrative gateways, each receives the event stream once. Upstream payload across those gateway copies is 20,000 bytes per second. Viewer output is 200,000,000 bytes per second. A diagram that draws only one arrow to a viewer conceals that delivery multiplication, so annotate the recipient count explicitly.

A gateway's connection budget is a separate limit from its send rate. Slow recipients retain outgoing buffers and can consume memory even when average link usage fits. Bound per-recipient buffers, detect stalled connections, and reconnect using a known score version or event position. Decide whether an expired snapshot can be replaced by a newer one.

Do not claim that a gateway can serve its nominal connection count at every possible event rate. Test the combination of active recipients, payload size, write rate, encryption cost, and slow readers. A successful connection-opening test establishes neither a delivery-latency objective nor the capacity to recover every recipient together.

@fig sd_performance_live_trace | Illustrative event production, gateway copies, and recipient delivery are separate resource counts.

## 34. The complete resource ledger

Now reconcile the totals without changing their assumptions. The API workload, live workload, retained-write exercise, and cache exercise describe different roles in Heron. They belong in one capacity argument, but a viewer read must not silently become a stored record merely because the storage arithmetic is available.

| Resource | Stated workload | Computed demand |
|---|---|---|
| API active work | 1,000/s times 0.2 s | 200 requests |
| API CPU service | 1,000/s times 2 ms | 2 CPU-seconds/s |
| API response payload | 1,000/s times 2,000 bytes | 2 MB/s |
| Query page misses | 4 pages, 90% hit ratio | 400 reads/s |
| Live recipients | 20 events/s times 50,000 | 1,000,000 deliveries/s |
| Live payload | Deliveries times 200 bytes | 200 MB/s |
| Retained write payload | 30 days, three copies | 388.8 GB |
| Cache entries | 100,000 times 2,100 bytes | 210 MB |

Each row names a path and a measurement boundary. Logs, replicas, retries, indexes, request bodies, and wire overhead need their own entries when they affect that boundary. Keep illustrative ratios visibly separate from measured values. Otherwise an exact-looking total can hide an invented input.

Review a changed assumption by recomputing the affected rows. A larger response changes network demand; a colder cache changes dependency demand; more replicas change retained copies and write traffic. This makes the argument falsifiable. Someone can point to one input and show exactly which capacity conclusion would change.

@fig sd_performance_budget | Computed illustrative resource ledger keeps counts and units beside their workload boundaries.

## 35. Defending the design at a whiteboard

An interviewer asks whether Heron can handle its peak. Start with the user operations and the assumed arrival shape. Explain where a request waits and which resources it uses. Then show that the selected application fleet survives the stated missing-server case without claiming that this alone proves the entire system fits.

Walk through the potential contradictions. The fleet has spare application capacity, but the database may cap the miss path. The API payload fits a smaller link, but live viewer delivery needs a separate distribution budget. The cache fits its entry calculation, but slow live clients and pending requests consume memory elsewhere.

Name the experiment that resolves each uncertainty. Measure CPU service per request, pool hold time, page misses under key skew, send rate with slow recipients, and useful throughput with one node absent. Then inspect recovery while new arrivals continue. The answer becomes stronger when you identify what could disprove it.

This unit stops at resource accounting and performance behavior. It has not explained how an index finds a page, how transactions order writes, or how replicas preserve a fact after failure. Those mechanisms belong in the database and distributed-systems units. You now have the quantities needed to ask whether each mechanism fits the workload.

@fig sd_performance_defense | Illustrative architecture review connects each capacity claim with its unresolved measurement.

:::story Picture this
A bridge design specifies the loads it must carry and the conditions under which it carries them. A capacity argument does the same for a request path. A drawing without workload labels cannot establish whether the path fits.
:::

:::warn Watch out
A computed total is exact only for its inputs. It becomes evidence about a real system when those inputs match the measured workload and failure conditions. Preserve that distinction throughout the design discussion.
:::

:::note One job for each component
Admission bounds accepted work. Application workers spend CPU and manage waits. The database serves the miss and write paths. Gateways own viewer delivery. Caches remove selected dependency work, while queues schedule waiting work under an explicit age and storage policy.
:::

:::interview Interview lens
**"Walk me through your capacity argument."** I state the arrival and payload assumptions, then compute concurrency, CPU demand, dependency work, bandwidth, and retained bytes separately. I test the peak with the promised failed component absent. Finally I name the shared bottleneck and recovery assumptions that the arithmetic has not established.
:::

:::key In one breath
Heron's peak API, live fan-out, cache, and retained-write roles need separate resource budgets. The illustrative five-server fleet survives one missing application server by capacity count, but dependency and tail measurements still matter. Label every total with its boundary and assumptions. A defensible architecture couples those totals to failure tests and specific evidence rather than treating arithmetic as a benchmark.
:::

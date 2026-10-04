@part III | Graceful degradation and fault tolerance | We decide which work remains useful when a dependency slows or disappears. Treating every feature as mandatory can turn a small fault into a service-wide outage. We will separate fault tolerance, degraded answers, bounded queues, and overload recovery. | where:3

## 9. Fault tolerance preserves a stated guarantee
An application worker dies halfway through a score correction. A replacement worker must decide whether the command committed before the crash. **Fault tolerance** is the ability to keep a stated service guarantee despite specified faults. The guarantee must name both the operation and the tolerated fault.

A durable command identifier lets the replacement recover the original outcome. If the database already committed the score and identifier together, the retry returns that result. If it did not commit, the retry can execute. A timeout alone cannot distinguish those cases because the reply may have disappeared after the effect.

@fig sd_reliability_uncertain | A commit trace. The repeated command keeps the same identity so a replacement can recover it.

The mechanism costs retained command evidence and transactional work. Retaining identifiers for less time than the supported retry horizon weakens the promise. This is why fault tolerance begins with the failure contract, not with a blanket claim that retries are safe.

:::story Picture this
A cashier writes the sale and its receipt number in the same ledger entry. If the printer breaks, the next cashier can reprint that receipt. Writing the sale and receipt number in separate ledgers would leave a gap if the cashier stopped between them.
:::
## 10. Graceful degradation changes the permitted result
Heron's recommendations service stops answering. A score read can still return the match and omit related clips. **Graceful degradation** is a documented reduction in functionality or quality that keeps a useful core operation available. It must preserve the rules that remain mandatory, especially permission and write integrity.

Decide this branch before the incident. The application calls recommendations with a bounded budget, records a failure, and returns the score without that optional field. It never waits indefinitely or labels an old score as current. Cached score reads need an explicit maximum age and a visible freshness field if age affects the user.

At a 90% illustrative score-cache hit rate, 1,000 peak reads send 100 misses per second to the database. If the cache disappears and every read falls through, database traffic becomes 1,000, a factor of 10. A bounded stale-read mode or admission limit can be safer than unconditional fallback.

@fig sd_reliability_degraded | Dependency classification. The degraded mode has a separate freshness contract.

:::warn Watch out
A fallback can create a second incident. Cache loss that redirects every request to the database may overload it. The fallback needs a capacity and correctness test just like the normal path.
:::
## 11. Bounded queues and useful waiting
A slow database makes application requests pile up. At the illustrative 1,000 requests per second and mean duration 0.2 seconds, the mean in-flight work is 200 requests. If the duration rises to 2 seconds while the arrival rate stays fixed, that becomes 2,000. Waiting consumes memory, sockets, and deadline time.

$$L=\lambda W.$$
Read this as the mean number of in-flight requests, $L$, equals the mean arrival rate, $\lambda$, multiplied by the mean time in the system, $W$, for a stable measurement interval. This is a workload relation, not proof that the server has enough capacity to remain stable.

@fig sd_reliability_inflight | Same arrival rate of 1,000 requests per second. Protocol and memory overhead are not counted.

Bound the queue before memory exhaustion. When no useful deadline remains, reject or cancel the work before issuing another database request. A bounded queue can preserve completion for admitted work, but an arbitrary large queue mostly converts overload into late replies. [Google's queue-management discussion](https://sre.google/sre-book/addressing-cascading-failures/) explains this resource feedback.

:::note Admission versus waiting
Admission decides whether the server will attempt the operation. Queueing decides when an admitted operation starts. A server can enforce both limits; a rate limit alone does not prevent long-running work from filling concurrency slots.
:::
## 12. Cascades and recovery
A failed replica redirects traffic to its peers. The peers slow down, miss deadlines, trigger retries, then fail their health checks. A **cascading failure** is a fault that increases the likelihood or severity of further faults through this feedback. The first broken machine may no longer be the largest problem.

Heron's illustrative surviving worker capacity drops to 600 requests per second while demand remains 1,000. The excess is 400 requests per second. Keeping every arrival means an increasing backlog; returning many cheap rejections can let admitted work finish. Reduce optional work, stop retry amplification, and restore capacity before reopening admission.

@fig sd_reliability_cascade | Positive feedback in a failure cascade. Each transition changes the next component's demand.

After a queue has 12,000 jobs, an illustrative recovered service processing 800 jobs per second with 600 new arrivals drains only 200 queued jobs per second. Recovery takes 12,000 divided by 200, or 60 seconds. Dividing by the full processing rate would ignore continuing arrivals.

@fig sd_reliability_drain | Stable rates during the modeled recovery interval. A varying arrival rate requires a time-dependent trace.

:::interview Interview lens
**"Why can an outage continue after traffic returns to normal?"** The surviving capacity may still be reduced, and retries or backlogs add work beyond original arrivals. Cold replicas may fail again before becoming useful. Recovery must reduce admitted load and retry feedback enough for resources and queues to stabilize.
:::
:::key In one breath
Fault tolerance preserves a stated guarantee under named faults. Graceful degradation preserves a smaller permitted service without weakening permission or committed effects. Bound queues and concurrency because slow work consumes resources even at an unchanged arrival rate. Cascades stop when admitted demand, retries, and backlog fit the usable surviving capacity.
:::

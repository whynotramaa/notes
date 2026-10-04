@part VII | Cache failure and fallback | We protect the source when the performance copy disappears. Fallback has a finite concurrency and throughput budget. We will trace timeouts, reserve useful work, and inspect replica failover. | where:7

## 25. Cache loss can multiply source demand

Heron's cache normally absorbs 900 of 1,000 reads per second. The service fails, and every application process falls back directly to the database. That turns 100 normal source reads into 1,000. A replaceable performance component has now endangered the authoritative component, even though the database itself had not initially failed.

The multiplier is total read rate divided by normal miss demand. Under the illustrative h=0.9, it is 1,000/100=10. At h=0.99, normal demand is 10 reads per second and full fallback multiplies it by 100. A higher hit ratio can therefore conceal a larger outage surge when source capacity is planned only for normal misses.

$$F=\frac{\lambda}{\lambda(1-h)}=\frac{1}{1-h}$$

Read this as full-fallback multiplier F equals the inverse of the normal miss fraction, for h below 1 and the same arrival rate. It assumes every failed lookup becomes one source read. Retries, duplicate fills, refreshes, or source refusal can change the actual offered load, so the calculation names exposure rather than observed production throughput.

**Graceful degradation** deliberately preserves selected useful behavior while reducing service during failure. Blindly switching every request to the source is not graceful if it exhausts the source pool. Heron can serve allowed stale public snapshots, reject lower-priority refreshes, and preserve official correction capacity. The chosen policy should be visible to the caller when its guarantee changes.

A cache outage should be tested with a warm source, cold application processes, and realistic retry behavior. Compare offered reads with admitted reads and completed reads. The database can become slow before its CPU reaches a simple maximum because lock contention and queueing grow. Recovery must protect that source, not merely reconnect to the cache quickly.

@fig sd_cache_trace_25 | Illustrative cache-loss arithmetic multiplies 100 normal source reads per second to 1,000 offered fallback reads; orange marks degradation that admits a chosen subset.

:::story Picture this
A shortcut bridge closes and all travelers take the small original road. The original road has not changed size. A traffic gate protects it by admitting selected vehicles rather than pretending the detour created extra capacity.
:::

## 26. Bound fallback with a source admission budget

Heron needs an exact rule for how many reads may reach the source during a cache outage. A statement that it will 'rate limit' does not tell us whether the database connection pool survives. We need a bound on concurrent work and a contract for requests outside that bound, chosen independently of the failed cache service.

A **bulkhead** reserves or separates resources so one workload cannot consume every resource another needs. A bounded miss semaphore limits concurrent source loads. A rate limit can separately bound arrivals. Both matter: a low normal request rate can still fill every connection when source operations become slow, while a concurrency limit alone does not define every burst policy.

Assume an illustrative source read takes 20 milliseconds and Heron admits at most 4 simultaneous fallback reads. The ideal occupancy-based throughput bound is 4/0.02=200 reads per second if each slot stays busy at that duration. At 1,000 incoming reads per second, 800 cannot be served by that idealized fallback path and need stale reuse, rejection, or another bounded response.

If source latency rises to 100 milliseconds with the same 4 slots, the ideal rate falls to 4/0.1=40 reads per second. This is why a measured latency assumption cannot become a guaranteed capacity claim. Queueing behind the semaphore must also be bounded by length and deadline, or the application can accumulate unbounded waiting requests instead of source connections.

Heron reserves a separate source budget for scorer commands and caps public fallback. A per-process limit multiplies across the fleet, so 10 processes each with 4 slots permit 40 simultaneous loads. Coordinate or conservatively divide the budget if the global bound matters. The source's own protection remains useful when clients violate their intended local limit.

@fig sd_cache_trace_26 | Illustrative admission arithmetic gives four slots a 200 reads per second ideal bound at 20 ms and 40 at 100 ms; orange marks the slower bound.

:::note Offered and admitted demand differ
The outage multiplier computes work offered by unconstrained fallback. A bounded source pool deliberately admits less and needs a declared result for the rest.
:::

## 27. Timeout and reconnect behavior can cause a second storm

The cache stops responding, so Heron's applications hold every lookup until a long socket timeout. They then all reconnect and retry at once. The outage now consumes application concurrency even before fallback begins. Protecting the database alone is insufficient if requests and reconnect tasks pile up waiting for the failed dependency.

A **circuit breaker** temporarily avoids calls to a dependency after a defined failure pattern, with controlled probes to detect recovery. It is a load and waiting policy, not proof that every cache entry is missing. Requests that skip the cache still enter the independently bounded fallback path. A breaker that sends everything to the database merely moves the overload.

Use an illustrative 50-millisecond request budget with a 5-millisecond cache deadline and 20-millisecond source-read assumption. If the cache consumes its full deadline, 50-5-20=25 milliseconds remain for other work and scheduling. Repeating the cache call three times would consume 15 milliseconds before source work, leaving only 15 milliseconds after that assumed source read.

Retries need a maximum attempt budget and jittered backoff to reduce synchronized reconnect. A connection pool should bound pending waiters as well as active connections. Half-open recovery probes are a selected small workload; every application instance probing independently can multiply it. Ensure the intended fleet-wide probing rate is actually controlled or conservatively estimated.

Heron exposes cache timeout, breaker state, reconnect rate, admitted fallback, and rejected fallback separately. A fast recovery still needs staged warming, because a reachable empty cache can produce an avalanche of misses. The service's health and its data warmth are different states. Treat recovering copies with the same version and freshness checks as any other fill.

@fig sd_cache_trace_27 | Illustrative timeout arithmetic spends 5 ms on a cache attempt and 20 ms on source work; orange marks three attempts consuming 15 ms before other overhead.

:::warn A breaker can move overload
Skipping the failed cache helps only if fallback remains bounded. Sending every skipped lookup straight to the database recreates the same surge.
:::

## 28. Cache replica failover can resurrect an older value

Heron deletes version 7 from the cache after committing version 8 at the source. The cache primary fails before its replica receives that deletion. Promoting the replica can bring version 7 back into the read path. A cache entry can therefore reappear without any application issuing a new old fill after the failover.

A **replicated cache** keeps multiple service copies according to its own propagation and failover contract. It can improve availability, but asynchronous propagation can expose lagging values or metadata. [Redis persistence documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) describes snapshot and append-only choices; those choices must not be confused with a guarantee that every acknowledged change reached every candidate replica.

The illustrative state is primary P absent after invalidation, replica Q still holding v7. P fails and Q is promoted. A public read now finds v7 again. If the application requires minimum v8, it rejects that entry and fetches suitable state. If it permits old public snapshots, it can reuse it only inside that declared freshness policy.

A version floor stored in the same lagging cache can also disappear or move backward on failover. Its coherence proof must include that storage failure model. An authoritative generation check outside the disposable copy may provide a stronger boundary, at the cost of another dependency or source access. Do not rely on forgotten metadata to reject an old fill.

Heron includes local copies, response caches, replicated service state, and client caches in its observation model. The authoritative scorer path consults suitable source state when correctness requires it. A distributed cache helps performance and recovery only within its own contract. Promotion and persistence settings do not convert a derived cache into a globally fresh official-score authority.

@fig sd_cache_trace_28 | Illustrative replica-failover state shows an invalidation reaching P but not Q; orange marks promotion of Q, which can resurrect v7 against a v8 read requirement.

@fig sd_caching_outage | Illustrative bars compare 100 normal miss reads per second with 1,000 unbounded fallback reads; orange marks the outage load that needs a capacity limit.

:::interview Interview lens
**"What if Redis goes down?"** I would cap cache waiting, independently bound fallback, preserve critical source capacity, and use only permitted stale snapshots. Recovery warming and replica freshness are part of the plan after reachability returns.
:::

:::key In one breath
A cache outage can multiply source demand by the inverse miss fraction. Bound fallback independently of the failed cache. Short deadlines, reserved capacity, and permitted stale responses implement a chosen degraded contract. Replicated caches can restore old values and require the same observation review.
:::

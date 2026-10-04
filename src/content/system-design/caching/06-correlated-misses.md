@part VI | Stampede, penetration, avalanche | We examine workloads that defeat average hit ratios. Many requests can synchronize onto one loader or one owner. We will separate stampede, penetration, avalanche, and hot-key pressure. | where:6

## 21. A stampede duplicates the same source load

A popular score expires and 100 viewers arrive before the first replacement is loaded. Every viewer sees a miss and starts the same query. The cache was meant to save source work, but its expiry has aligned that work. A **cache stampede** is duplicated concurrent refill activity for one missing or expired value.

**Single-flight loading** lets one in-flight loader serve other callers asking for the same object under a compatible contract. The first caller becomes loader owner, while later callers wait for its result or use a permitted stale copy. They need bounded waiting and a clear response when the loader fails. A failed owner cannot keep waiters blocked forever.

Heron's illustrative burst of 100 requests with no coalescing creates 100 database reads. A successful single-flight group needs 1 source read for the same eligible value, avoiding 100-1=99 duplicate loads. This is a burst calculation, not a promise that every miss fleet-wide can share a loader. Different versions, permissions, and parameters may require separate groups.

A local single-flight table coordinates only that process. Across 10 independent processes receiving the burst, local coalescing could still create up to 10 loaders if each process sees the key. A shared refill protocol can coordinate further, but adds authority, timeout, and takeover behavior. A loader lock whose holder pauses must not enable an old result to overwrite newer cache state.

Heron combines bounded per-key loading with a source-wide admission limit. Coalescing reduces duplicate work, while global admission controls many unrelated misses. An allowed stale snapshot can keep waiters useful while one refresh happens. These are complementary rules, and each needs its own timeout and failure behavior rather than a box simply labeled 'lock'.

@fig sd_cache_trace_21 | Illustrative stampede state shows 100 callers missing one key; orange marks the single loader that replaces 99 duplicate source reads.

:::story Picture this
Many visitors reach one empty tray and all walk to the same shelf. Another day every tray is empty at once. One shared runner solves the first duplicate trip but still needs a schedule for many different books.
:::

## 22. Penetration is repeated work for absent keys

A client asks repeatedly for matches that do not exist. Each request misses and queries the database again. It can generate expensive work without ever warming a useful positive entry. **Cache penetration** describes source access driven by absent or otherwise uncacheable keys, often made worse by invalid input or deliberate guessing.

Validate malformed identifiers and impossible request shapes before the source call. A syntactically valid unknown match may still require a real lookup. For verified absence, short negative caching can reuse the answer under a defined creation and permission contract. A source timeout must remain a failure, because it did not establish that the identifier was absent.

Assume 100 requests ask for the same verified-absent key within a permitted 5-second negative interval. The first request performs 1 source lookup; the remaining 99 can reuse the negative entry if they share the same visibility rule. If all 100 requests use distinct keys, that reuse disappears and 100 source lookups may still be needed absent another filter or limit.

A probabilistic membership filter can reject some definitely absent keys before the expensive lookup, but false positives still go to the source and updates must keep the filter compatible with creation. Such a filter cannot replace authorization. Its implementation and false-positive budget are another design problem, so use it only when measured absent-key workload justifies it.

Heron reserves source capacity for legitimate scorer work and bounds public lookup admission. Negative entries carry a short lifetime or a creation-generation rule. Observability separates absence, malformed input, permission denial, and source failure without leaking private existence. The mechanism saves repeated proved absence; it does not turn arbitrary attacker keys into a stable high-hit workload.

@fig sd_cache_trace_22 | Illustrative penetration state compares repeated reuse of one absent key with 100 distinct absent keys; orange marks the timeout that must not be cached as absence.

:::note Local coalescing has local scope
Each process can start its own loader for the same key. Fleet-wide source bounds need a shared or conservatively divided admission budget.
:::

## 23. An avalanche aligns misses across many keys

Heron warms many popular scores at startup and gives them identical expiries. Later they all become ineligible together. Each key may have a single loader, yet the database still faces many different simultaneous loads. A **cache avalanche** is a correlated miss surge across keys, caused by aligned expiry, cache loss, or another shared event.

Expiry spreading assigns different refresh or expiry times so one cohort does not become cold at once. Warmup can be staged, and refresh can be scheduled before hard expiry when the policy permits it. These techniques reduce one source of synchronization. They do not make a complete cache outage disappear, which is why the source needs admission independent of the cache.

Use an illustrative batch of 1,000 keys. If all require reloading within 1 second, the batch needs 1,000 loads per second for that interval. Spreading the same batch evenly across 10 one-second buckets yields 100 scheduled loads per second. This is an idealized schedule computation, not the exact peak of independent random expiry or uneven real requests.

Random jitter creates a distribution of expiries rather than this exact even schedule. The expected load can be computed under a model, but finite buckets can exceed it. A hot key can also dominate regardless of how evenly keys are spread. Measure the actual refill concurrency and oldest pending refresh age rather than reporting only the theoretical average.

Heron uses staggered warming and an independent bounded loader pool. Public readers can use a defined stale interval where allowed, while scorer writes retain reserved source capacity. If source refresh falls behind, the service rejects selected work instead of launching unbounded replacement tasks. Avalanche control is a workload scheduling problem alongside a recovery and freshness problem.

@fig sd_cache_trace_23 | Illustrative cache-fill arithmetic spreads 1,000 misses across ten second buckets; orange marks cache-wide loss, where source admission still applies.

:::warn Hot hits can overload one owner
A high hit ratio says nothing about the capacity of the owner serving a popular key. Read replication adds its own freshness obligation.
:::

## 24. A hot key can overload a cache hit path

One final match becomes far more popular than every other match combined. Its score is present in the cache, so the hit ratio looks excellent. The cache owner serving that key still receives nearly all requests. A **hot key** concentrates traffic on one object or owner, and can cause overload without any database miss.

Hashing many keys evenly does not distribute accesses to one key. Heron's shared-cache routing sends `score:m7` to the same owner for every lookup unless another layer deliberately spreads copies. The owner can saturate its CPU, connection pool, network, or output bandwidth. Cache hits save source work but still consume this cache-service work.

With 1,000 illustrative reads per second and 80% directed at one match, that key receives 800 reads per second. If each response has 2,000 payload bytes, it serves 1,600,000 payload bytes per second before overhead. Ten equal local serving copies could divide that assumed traffic into 80 reads per second each, if routing actually distributes it evenly.

Local snapshots, response caching at the edge, or replicated read copies can spread suitable hot reads. Their extra copies create invalidation and freshness obligations. A hot write key is harder: splitting updates across owners changes ordering or requires a merge rule. Do not shard an authoritative score counter merely by adding suffixes without defining its combined state.

Heron monitors per-key rate and cache-owner load alongside hit ratio. A public score snapshot can be replicated under the allowed stale policy, while official writes remain on their authority path. This separates two common incidents: one key's refill stampede hits the database, while one already-cached key's traffic hits the cache owner. Their fixes can differ even at the same endpoint.

@fig sd_cache_trace_24 | Illustrative hot-key arithmetic sends 800 of 1,000 reads per second to one key; orange marks ten ideal copies at 80 reads per second each.

@fig sd_caching_correlated | The split contrasts many simultaneous misses with one popular key hitting one owner; orange marks hot-key concentration, which can overload a hit path.

:::interview Interview lens
**"Stampede, penetration, avalanche, or hot key?"** I would name which work concentrates. One-key refill duplication, absent-key source reads, many-key correlated misses, and concentrated hit traffic have different primary boundaries and may need different controls.
:::

:::key In one breath
A stampede duplicates loading for one missing key. Penetration repeatedly asks for absent keys, while an avalanche correlates misses across keys. A hot key can overload its cache owner even on hits. Coalescing, expiry spreading, and admission have different jobs.
:::

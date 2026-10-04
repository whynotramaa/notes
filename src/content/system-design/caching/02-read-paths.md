@part II | Cache-aside and read-through | We choose the owner of a missing-value load. A miss adds work and can duplicate it under concurrency. We will trace cache-aside, read-through, measured savings, and the loader error contract. | where:2

## 5. Cache-aside exposes each miss step

Heron looks up a score, receives a miss, reads the database, and fills the score entry. **Cache-aside** makes the application own this sequence. It is easy to draw, but its separate steps can fail independently and overlap with writers. The useful design is therefore the sequence plus a contract for those intermediate states.

On a hit, the application checks the entry's version, expiry, and other eligibility conditions before returning the value. On a miss, it first acquires permission to access the source under a bounded concurrency rule. The source returns authoritative score and version, and the application attempts a safe fill. A failed fill need not erase a successful source result.

Use an illustrative cache lookup of 2 milliseconds and source read of 20 milliseconds, with the fill sent after obtaining the value. A permitted hit takes the assumed 2 milliseconds before other application work. A sequential miss spends 2+20=22 milliseconds before returning the source value. If synchronous fill adds 2 milliseconds, that path takes 24 milliseconds.

The cache has added latency to the miss. That can still be a good trade when enough requests are hits, but it must be included in the budget. A source timeout remains an error; it is not a cacheable absent score. A cache timeout can select a bounded fallback path, but it is also not proof that the entry is absent.

Heron preserves source authority and command identity outside this read optimization. It can return a correct loaded value even if a cache outage prevents filling, while reporting the fill failure operationally. It cannot let an old fill overwrite a known new version. We will return to that race after examining who can own the same loading work behind an interface.

@fig sd_cache_trace_5 | The cache-aside trace puts source admission between a miss and the database read; orange marks the safe fill that remains derived even when filling fails.

:::story Picture this
One receptionist checks a tray, then walks to the records room on a miss. Another service accepts the request and makes that trip behind its own counter. The trip still exists; the owner of loading has changed.
:::

## 6. Read-through moves ownership behind the interface

The application asks for a score through one method and never explicitly calls the database on a miss. A **read-through cache** owns the loader behind that read interface. It can centralize key normalization, load admission, and expiry, but the database work still happens. Moving the callback does not change the source's failure model.

A local library can offer read-through by calling a loader when its dictionary lacks an eligible entry. A remote service can do so through its own source access. The pattern does not imply locality, durability, or coherence. Name both where the cache lives and who loads it, because those are separate design dimensions.

Heron's read-through loader looks up `score:m7`, misses, fetches score 10 at version 7, and installs a reusable value with the declared expiry. A second caller arriving during that load may share the result if the cache implements single-flight. If it does not, the same interface can still trigger two source reads, so the API name alone does not prove coalescing.

The loader must accept a bounded deadline and know whether a caller requires a minimum version. A generic memoization method returning any stored value cannot preserve a scorer's session fence unless eligibility is part of the interface. Error handling must preserve at least successful value, verified not found, and unavailable source as different states.

This centralization is useful when it removes inconsistent loading rules across callers. It can also concentrate work into one service that needs its own capacity budget and credentials. Heron chooses it only when that ownership helps the actual application. The caller still needs a clear result contract and must not assume that a single convenient method erased all distributed behavior.

@fig sd_cache_trace_6 | The read-through trace moves the loader behind one cache interface; orange marks installation of the source result under the same freshness rule.

:::note The miss path can be slower
A sequential miss includes both cache and source waits. Include refill and admission behavior when comparing the cache with a direct source read.
:::

## 7. Compute saved work at the named boundary

The dashboard says the cache has a 90% hit ratio. That sounds useful, but we need the denominator and the work each hit avoids. Hits on tiny configuration lookups cannot automatically offset misses on expensive score queries. A value present but rejected by freshness rules should not count as a successful reusable hit for this calculation.

A **hit ratio** is eligible hits divided by the relevant lookup count over a named workload and interval. Let Heron's read arrival rate be lambda=1,000 per second and eligible hit fraction h=0.9. With one source load per miss, source demand is 1,000 times 0.1, or 100 reads per second. This excludes duplicate refill work and background refreshes.

$$\lambda_{\text{source}}=\lambda(1-h)$$

Read this as source load equals incoming read rate times the fraction that does not receive an eligible cache hit. At h=0.5, the same workload produces 500 source reads per second. At h=0, it produces 1,000. The formula's assumptions matter more than the elegance of its symbols.

Under the illustrative 2-millisecond cache wait and 20-millisecond source wait, the mean lookup-plus-load time is 0.9 times 2 plus 0.1 times 22, which equals 4 milliseconds when fill does not delay the result. This mean does not describe tail latency or a correlated cold burst. One match-start spike can have mostly misses while the day's average looks healthy.

Heron therefore measures hit ratio with source reads, per-key skew, loader concurrency, and miss latency. It separates cold starts, normal warm operation, and outages. A weighted cost measurement can be useful when different queries have different expense. The honest conclusion is a computed saved-work budget under assumptions, followed by a workload measurement to see whether those assumptions hold.

@fig sd_cache_trace_7 | Illustrative hit-rate arithmetic turns 1,000 reads per second into 900 hits and 100 miss loads; orange marks the 4 ms mean path, which is not a tail guarantee.

:::warn Absence and error must remain distinct
A failed source lookup does not establish that an object is missing. Negative-cache only verified absence under a defined creation and permission contract.
:::

## 8. Loader errors must not become false absence

A new match does not appear because Heron cached 'not found' after a database timeout. The request was answered quickly afterward, but it answered the wrong question. The source had never proved the match absent. A loader that collapses errors into an empty value can turn a short outage into a longer period of false data.

The result contract distinguishes a successful value, a verified absence, and a failed or timed-out read. A **negative cache entry** stores verified absence for a limited interval. It can save repeated lookup work, but it carries a creation-staleness tradeoff. Caching a transport error as absence changes the meaning and hides the underlying failure.

In Heron's illustrative trace, a database query at time 0 proves `m8` absent and caches that result until time 5. The match is created at time 2. Without invalidation, a read at time 3 still sees cached absence and a read at time 5 can reload. The maximum remaining absence window after creation here is 5-2=3 seconds.

Creation can invalidate or version the negative entry under a safe coherence rule. A broad namespace generation can help when many related keys become valid. A short expiry reduces the stale-absence interval but raises repeated-source work. None of these choices should suppress source errors, which remain observable and may select a separate permitted stale or unavailable response.

Heron validates malformed keys before calling the source, but syntax validity alone does not establish authorization or existence. A guessed identifier may need a permission-aware response policy. Keep negative caching inside that policy, and avoid using one public cache key for private existence information. We will revisit absent-key traffic when discussing penetration and abuse.

@fig sd_cache_trace_8 | The negative-cache trace shows a value created after an absence was cached; orange marks expiry at time 5, when the loader checks the source again.

@fig sd_caching_aside | The sequence shows the application owning lookup, source read, and fill; orange marks the final fill after the database returns the score and version.

:::interview Interview lens
**"Does read-through guarantee one loader?"** No. It describes loading ownership. I would separately check single-flight scope, deadlines, source admission, and freshness requirements for joining an in-flight result.
:::

:::key In one breath
Cache-aside makes the application load and fill misses. Read-through puts that work behind the cache interface. A miss can be slower than a direct source read. Count source work and preserve the distinction between a value, verified absence, and an error.
:::

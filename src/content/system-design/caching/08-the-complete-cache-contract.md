@part VIII | Case study: caching a hot read | We put placement, freshness, and recovery into one read path. A box called Redis cannot supply the missing contract. We will trace a full request, count its budget, and test the boundaries. | where:8

## 29. Trace the permitted hit and the bounded miss

A viewer asks for Heron's public score representation. The application constructs a key whose representation and visibility dimensions are complete, then checks the available copy. It does not simply return any bytes under that key. The copy needs a source version, age metadata, and an eligibility rule for this particular request.

If the entry is permitted, Heron returns it without the avoided source read. If it is missing, expired, behind the required version, or the cache call fails, the request selects the relevant bounded path. The public stale policy can reuse an older snapshot where allowed. Otherwise the caller acquires a source-load slot or receives the defined rejected or unavailable outcome.

The admitted loader fetches score and version from a source suitable for the caller's observation promise. It preserves verified absence versus failure and can return a successful source result even when copy installation fails. A safe fill uses the chosen version floor or generation protocol so an old load cannot overwrite or recreate an impermissible current entry.

For the illustrative scorer session requiring v8, cached v7 is ineligible regardless of its short age. The loader obtains v8, then attempts a compatible fill. For a public caller allowed v7, the same old entry can be an acceptable hit. These paths are different contracts over the same stored object, not inconsistent definitions of whether the object exists.

The diagrams now have one job per mechanism. Key construction controls representation; eligibility controls observation; single-flight controls duplicate loading; admission controls source pressure; safe fill controls race ordering; expiry and eviction control reuse and capacity. The source keeps official truth. A useful cache architecture names all of these even when one library or service implements several together.

@fig sd_cache_trace_29 | The complete read trace builds a key, checks eligibility, bounds a miss, and fills safely; orange marks the version-floor or generation guard.

:::story Picture this
A reusable desk copy shortens a permitted library visit. The checkout record remains in the official ledger, even if the desk copy is lost. A reader needing a specific ledger page must still receive a copy that includes it.
:::

## 30. A score write keeps cache maintenance outside truth

The scorer submits `c9` to change score 10 at source version 7 into score 11. Heron checks permission and authority, then commits the score change and command result together. Cache maintenance follows the declared coherence protocol. A cache outage can slow public visibility without changing whether the official correction was accepted.

The authoritative result carries version 8. Heron updates a versioned key or advances the generation selection under its chosen contract, then expires or retires old copies. A delayed reader holding version 7 cannot fill the version-8 key in the generation-key design. A retained-floor design instead atomically rejects a fill below the surviving floor 8.

If the source commit succeeds but copy maintenance fails, keyed retry returns the recorded result for `c9`. It does not increment again. A strict later scorer read carries minimum version 8 and bypasses an ineligible cached value. Public reads can use an explicitly weaker contract until the copy becomes current, but the API must not present that older view as the official write result.

Asynchronous invalidation delivery needs durable intent or another repair mechanism if its loss can violate the chosen contract. A best-effort notification plus TTL can be acceptable for bounded stale displays under its assumptions. It is insufficient for immediate freshness if an old copy remains reusable. The write protocol must say which promise survives a lost invalidation message.

Heron also controls out-of-order copy updates and replica failover. A high-level box labeled 'invalidate Redis' is only one step, not the complete proof. Put the source commit, copy-generation change, old in-flight fill, and required read fence on the same timeline. Once those states are visible, both the stale allowance and the failure boundary become reviewable.

@fig sd_cache_trace_30 | Illustrative write state commits score 11 at v8 before maintaining copies; orange marks the scorer rule that refuses v7.

:::note Source truth survives copy failure
A committed correction keeps its command result and version independently of cache maintenance. Strict later reads reject a known older cache entry.
:::

## 31. Count normal, cold, and degraded operation

Heron's sizing worksheet needs more than one operating point. Warm steady state, a cold start, and a cache outage can have different hit ratios and source pressure. Use the same incoming workload for each so the comparison reflects the cache state, rather than quietly reducing the traffic while describing failure recovery.

At the illustrative 1,000 reads per second and 90% eligible hit ratio, normal source demand is 100 reads per second before duplicate loads. A fully cold cache can offer 1,000 loads per second. A bounded fallback with 4 slots and 20-millisecond source-read assumption admits an ideal maximum of 200 reads per second, leaving 800 for another declared outcome.

The cache itself accounts for 100,000 times 2,100, or 210,000,000 bytes before omitted overhead. Two illustrative full service copies account for 420,000,000 bytes. Ten local full copies would account for 2,100,000,000 bytes if each process actually retains all entries. Replication and local duplication multiply storage, not the per-reader freshness guarantee.

The mean assumed lookup-plus-load time remains 4 milliseconds for the 90% warm case with 2-millisecond cache and 20-millisecond source waits and nonblocking fill. Cold sequential misses take 22 milliseconds under those same waits. These figures exclude queueing, serialization, networks outside the assumed waits, and tail effects, so they remain labeled exercises rather than service benchmarks.

Track both offered and admitted source work, because rejected or stale-served reads are not successful new source loads. Recovery warming must fit the same source budget as user traffic unless it has a safely reserved share. Heron's operating plan is a set of observable contracts and budgets, not a single impressive warm-hit latency quoted during an outage.

@fig sd_cache_trace_31 | Illustrative cache arithmetic compares warm, cold, and four-slot degraded service; orange marks the 210,000,000 byte full-copy memory cost.

:::warn Test more than steady hits
Pause old fills, evict comparison state, promote lagging replicas, and make many keys cold. Verify source admission and read contracts rather than only latency.
:::

## 32. Test the histories a warm benchmark misses

A benchmark repeatedly reads one already-warm key and reports excellent latency. It has tested one useful path, but almost none of the cache's correctness or recovery boundaries. Heron's review needs histories where time, versions, and component failures change while requests remain in flight. These cases expose bugs that steady hits cannot reach.

Pause an old reader after its source read, commit a newer version, invalidate the cache, then release the old reader. Verify that the declared fill protocol rejects or isolates the old result. Evict the newer entry before that fill and repeat, because a version comparison against only a present entry can lose its proof when the entry disappears.

Fail the cache primary before its replica receives invalidation, then promote the replica. A strict v8 reader must not accept resurrected v7. Expire a hot key under a 100-caller burst and count source loads rather than only successful responses. Then make many distinct keys cold and verify the global load budget still holds when per-key single-flight cannot combine them.

Restart application processes and observe local-cache warming and fleet-wide limits. Verify source timeout is never recorded as absence, and create a match during a negative-entry interval to check the documented stale-absence rule. Test request deadlines and reconnect jitter while the cache is slow, then restore it empty to exercise recovery warming rather than only service reachability.

We have treated caching as a bounded shortcut over authoritative state. We have not implemented a cache server's allocator, hash-ring recovery, or every HTTP extension; the later routing and reliability units deepen those boundaries. You should now be able to draw a hit, miss, stale-fill race, eviction trace, and outage with the exact point at which each promise is enforced.

@fig sd_cache_trace_32 | The test matrix exercises stale fills, replica promotion, hot-key bursts, and cache loss; orange marks the outage test that checks the global fallback budget.

@fig sd_caching_complete | The flow reduces the cache contract to an eligible hit or a bounded miss, followed by truth and a safe fill; orange marks the final reusable copy.

:::interview Interview lens
**"Why not cache every read?"** Some results have little reuse or require current authority. I would compute saved work and include representation safety, freshness, memory, and outage pressure before adding a copy path.
:::

:::key In one breath
A complete cache read tests whether a copy is permitted, then admits a bounded load if needed. Writes retain authority and identity at the source boundary. Counts distinguish saved work, stored copies, and degraded demand. Test stale fills and failover as well as warm hits.
:::

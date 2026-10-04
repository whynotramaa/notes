@part IV | TTL and cache invalidation | We define which older answers remain acceptable. Expiry age and source freshness are different limits. We will work through TTL, a stale-fill race, generation keys, and conditional response reuse. | where:4

## 13. TTL bounds copy age under an expiry rule

A cached score is inserted at time 0 with an expiry at time 30. A scorer changes the authoritative score at time 1. A viewer reading at time 2 can still receive the old copy if Heron uses only expiry. The entry is young, but it is already stale relative to the completed correction.

A **time to live**, or TTL, is a permitted reuse interval under the cache's expiry behavior. **Stale data** is a value older than the caller's required observation contract. Age and freshness are related only through assumptions about loading, changes, and allowed reuse. A recent load from a lagging replica can begin with an old source version.

In the illustrative timeline, the old value can remain reusable for 30-1=29 seconds after the source changes, absent another coherence action. If a slow reader refills the old value at time 20 with a new 30-second TTL, that copy can last until time 50. Expiry measured from insertion therefore does not automatically bound age relative to the source update.

Use a source timestamp or version when the contract requires it, and distinguish loading time from data age. A local cache may remove expired entries lazily on access rather than immediately reclaiming memory. A redisplayed stale snapshot can be permitted, but it must have a bounded contract and must not be used where current authority or permissions are required.

For Heron, public score reads may accept a stated version and age, while the scorer's read-your-writes path carries a minimum history position. TTL helps bound routine reuse and refill frequency on the public path. It cannot enforce that session position by itself. Every statement about freshness should name what is measured and where a concurrent write can occur.

@fig sd_cache_trace_13 | Illustrative TTL arithmetic puts expiry at time 30 while the source changes at time 1; orange marks the remaining 29 seconds of reuse without invalidation.

:::story Picture this
A runner carries an old photocopy while the librarian replaces the original and clears the desk tray. The runner arrives later and puts the old page back. Clearing the tray did not change the page already in transit.
:::

## 14. Invalidation can be followed by an old fill

Reader R starts fetching score 10 at version 7. Before R fills the cache, writer W commits score 11 at version 8 and deletes the cache key. R then finishes and inserts version 7. The delete happened after the correct source change, yet the cache is old again. This is the common cache-aside refill race.

**Cache invalidation** removes a copy or marks it unusable when the underlying state changes. It must account for in-flight work. Deleting the key does not cancel an old source read or remove the old value from another process's memory. The reader can still carry that value to a later fill unless the fill operation checks a surviving authority or generation.

The state sequence is source v7, reader holds v7, source v8, cache absent after deletion, then cache v7 after the reader fills. The absence of an entry at the fourth step contains no record of v8. A conditional update comparing only with a present cache version therefore has nothing newer to compare against and can accept the old value.

One fix retains a version floor, here 8, independently of value eviction and checks the fill atomically against it. Another uses generation keys with an authoritative generation-selection rule. Serializing load and invalidation can also work within a defined shared boundary. Each fix has a failure model and metadata lifetime; none is guaranteed merely by calling it version-aware.

For Heron's strict session read, the caller also rejects cached version 7 when it requires 8, even if copy maintenance failed. Public stale reads can instead permit the value under a weaker declared contract. Keep the two behaviors explicit. A warning box should show the exact old-fill step, because forgetting that step is what makes a plausible invalidation diagram incorrect.

@fig sd_cache_trace_14 | Illustrative sequence shows an old read arriving after a writer deletes the key; orange marks the delayed v7 fill that resurrects stale data.

:::note A version floor must survive
Comparing against a newer present entry works only while that comparison state remains. Include eviction, expiry, and replica failover in its storage assumptions.
:::

## 15. Generation keys isolate old in-flight fills

An old reader can still finish after invalidation. Instead of letting it write to the same current key, Heron can give each source generation a separate cache key. A delayed result for generation 7 can fill only generation 7. New readers resolving generation 8 use a different key, so the old fill cannot overwrite their current value.

A **generation key** includes a comparable source generation in the key, such as `score:m7:v8`. The difficult part is discovering which generation a request should use. A stale cached generation pointer can keep readers on old keys. The method separates copies, but a current-read contract still needs suitable pointer authority or a carried minimum version.

Heron's reader R begins with required generation 7 and key `score:m7:v7`. W commits source generation 8 and makes that generation available through the authoritative selection rule. R later fills the v7 key. Reader S resolves generation 8 and reads `score:m7:v8`, missing if necessary and loading the new source state. The two fills do not collide.

Old keys need bounded retirement. They can expire after no valid request should need them, or a background cleanup can remove them while tolerating still-running old requests. A large number of generations can otherwise multiply memory. Deleting old keys is a capacity task, while deciding which generation is current is an authority and observation task.

Heron does not claim this removes the cost of every database lookup. A strict request may need an authoritative version-selection step, while a public snapshot can accept a cached selection. The design is valuable when separating immutable versions simplifies concurrent fills. Compare it with a retained version floor and choose the smallest mechanism that meets the required read promise.

@fig sd_cache_trace_15 | Illustrative generation-key trace gives v7 and v8 separate names; orange marks the current v8 key that an old fill cannot overwrite.

:::warn TTL is not a source freshness proof
A young entry can predate a just-completed write, and an old read can restart expiry by filling later. A strict session needs the relevant source version.
:::

## 16. Permitted stale serving and HTTP validation

The source is slow while Heron still has a recent public score snapshot. Waiting for every refresh can amplify load and delay all viewers. A declared stale-serving policy can return the snapshot while one loader refreshes it. This is appropriate only when that older result is acceptable to the requesting operation.

**Stale-while-revalidate** allows reuse of a specified older copy while a refresh proceeds under a defined policy. A **validator** lets a server determine whether a stored representation still matches, as with an HTTP entity tag. A successful validation can avoid retransmitting the body while still requiring a request and some source or origin work.

In an illustrative public cache, age up to 5 seconds is fresh, age above 5 through 10 is allowed during background refresh, and age above 10 is not served by that policy. At age 7, the request can reuse the copy and trigger or join one refresh. At age 11, it must obtain a suitable new result or follow the defined unavailable response.

For HTTP, RFC 9111 and related cache-control extensions distinguish fresh reuse, validation, and permitted stale behavior. A `304` response can preserve a cached body after validation. It is not a new body transfer, but it still consumes an origin interaction. A validator and a TTL have different jobs, so count both when estimating saved bandwidth and work.

Heron's scorer correction path never uses an old public snapshot to prove official acceptance or current permission. The public-display policy keeps its own age and version metadata and reports it honestly. Refresh failure can extend reuse only if the declared error policy permits that interval. An unbounded 'serve stale on every failure' loop is a different, weaker guarantee and must not be hidden behind the same label.

@fig sd_cache_trace_16 | The freshness trace separates fresh age 0 to 5, stale-allowed age 7, and rejected age 11; orange marks validation, which still contacts the origin for a 304.

@fig sd_caching_race | The sequence exposes the invalidation race between an old database read and a later fill; orange marks the stale hit created after deletion.

:::interview Interview lens
**"Why are generation keys useful?"** An old load fills an old key rather than overwriting a new-generation key. I would still explain how readers learn the current generation and how obsolete generations are retired.
:::

:::key In one breath
TTL limits reuse age under the cache rule, rather than proving a source version is current. Invalidation can race with old in-flight loads. Preserve a version floor or route fills through a compatible generation. Stale serving and HTTP validation are explicit observation contracts.
:::

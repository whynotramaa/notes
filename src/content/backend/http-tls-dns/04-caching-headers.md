@part IV | HTTP caching headers | We learn the headers that let a client or proxy skip a request, or skip the body, without serving wrong data. At Wren's 2,000 requests per second, every response a cache answers is work the servers never do. We will cover Cache-Control, validators with ETag and Last-Modified, conditional writes, and the supporting headers Vary, Location and Retry-After. | where:4

## 13. Cache-Control

Wren's menu changes a few times a day, yet every app launch fetches it again. If each response said how long it stays valid, the phone and any shared cache along the way could answer repeat requests themselves. **Cache-Control** is the response header that says so. `Cache-Control: max-age=60` means the response is **fresh** for 60 seconds after it was generated. During that time a cache may serve it without contacting the server at all. After that it is **stale**. Stale does not mean deleted. It means the cache must check with the server before using it again.

@fig be_http_cache_control | A 60-second freshness lifetime. Stale is not deleted. It means "ask before using".

Other directives decide who may store a response and how. `private` allows only the end user's own browser to store it, which is right for `/orders/123` because it belongs to user 42. `public` allows shared caches, such as a CDN, to store it for everyone. `no-cache` allows storage but forces a check with the server before every use. `no-store` forbids storing it anywhere, which is right for a page showing card details. `s-maxage` sets a separate lifetime for shared caches only, so a CDN can keep the menu for 300 seconds while browsers keep it for 60.

Two directives deal with what happens after expiry. `stale-while-revalidate=30` lets a cache keep serving the stale copy for up to 30 more seconds while it fetches a fresh one in the background, so no user waits for the refresh. `stale-if-error=600` lets it serve a stale copy for up to 10 minutes if the server is failing, which turns an origin outage into slightly old menus instead of errors.

The arithmetic shows the payoff. If 1,000 of Wren's 2,000 peak requests per second were menu reads, a CDN with `s-maxage=60` would forward roughly one request per menu variant per edge location per minute to Wren. The other several thousand requests per minute at each location never reach the servers. Unit VII returns to CDNs in detail.

:::warn Watch out
`no-cache` does not mean "do not cache". It means "cache, but check with me every time". To forbid storage of sensitive data you need `no-store`. Getting these backwards has left account pages sitting in shared caches.
:::

## 14. ETag, Last-Modified and conditional requests

When a cached copy goes stale, the cache could fetch the whole thing again. Often nothing changed, and re-sending 2,000 identical bytes wastes bandwidth for both sides. **Validators** avoid that. An **ETag** is an opaque version tag the server attaches to a response, for example `ETag: "v7"`. Servers usually derive it from a version column in the database or a hash of the body. **Last-Modified** is a timestamp that does the same job less precisely, since it has one-second resolution and cannot tell two changes in the same second apart.

To check a stale copy, the client sends a **conditional request**. `If-None-Match: "v7"` means "send the body only if your current tag is not v7". If the menu is still at v7, the server answers `304 Not Modified` with headers and no body. If it changed, the server sends `200` with the new body and new tag. `If-Modified-Since` works the same way with a date.

@fig be_http_etag | Revalidation sends the tag back. A match costs a few hundred bytes of headers instead of the full body.

A 304 still costs a round trip, so it saves bandwidth and server rendering work, not latency. For 1,000 revalidations per second, each 304 saves a 2,000-byte body, so Wren sends 2,000,000 fewer body bytes per second.

The same tags protect writes. Two Wren staff open the menu editor at version v7. Asha saves first, and the menu becomes v8. Ben then saves with `If-Match: "v7"`. The server compares v7 with the current v8, sees they differ, and returns `412 Precondition Failed` without writing. Without the check, Ben's save would have silently erased Asha's change. This is **optimistic concurrency control** over HTTP, called optimistic because it assumes conflicts are rare and only detects them at write time. Unit VI builds the database side.

@fig be_http_if_match | If-Match makes the second writer notice the first. Without it, the later save silently erases the earlier one.

:::interview Interview lens
**"How would you stop two clients overwriting each other's edits in a REST API?"** Return an ETag on every read, derived from a version column. Require `If-Match` on PUT and PATCH, and compare it with the current version in the same statement that writes, such as `UPDATE ... WHERE id = 123 AND version = 7`. If no row changed, return 412 so the client re-reads and merges. If a client sends no If-Match at all, return `428 Precondition Required` so nobody can skip the check by accident.
:::

## 15. Vary, Location and Retry-After

A shared cache stores each response under a **cache key**, which by default is the method plus the URL. That breaks when the response depends on a request header. Suppose the CDN stored a Brotli-compressed menu under `/menu` alone. The next client to ask, an old one that cannot decode Brotli, would receive bytes it cannot read. **Vary** lists the request headers that belong in the key. `Vary: Accept-Encoding` makes the cache keep one copy per encoding the clients asked for.

@fig be_http_vary | Vary widens the cache key. Each listed header splits the cache into separate entries.

Vary has a price. Each header listed multiplies the number of entries. With three encodings, `/menu` needs three entries. Add `Vary: User-Agent` and there is one entry per browser version, hundreds of them, and almost every request misses. Vary only on headers with a handful of values. CORS responses that echo the request Origin need `Vary: Origin` for the same reason, as Unit II shows. Many CDNs also normalise headers before keying, for example collapsing every Accept-Encoding value down to `br`, `gzip` or nothing.

Two more headers finish the set. **Location** carries a URL in two different roles, the target of a 3xx redirect and the address of a new resource after a 201. **Retry-After** tells a client when to try again after a 429 or 503, either as seconds (`Retry-After: 30`) or as an HTTP date. Well-behaved clients wait at least that long. After an outage, a server can hand out different Retry-After values to different clients, spreading their returns over a minute instead of letting them all come back in the same second.

:::note Weak and strong ETags
An ETag prefixed with `W/`, such as `W/"v7"`, is weak. It promises the content is equivalent, not byte-identical, so a gzip copy and a Brotli copy of the same JSON can share it. Byte-range requests need strong ETags, because stitching ranges taken from two different byte sequences corrupts the file.
:::

:::key In one breath
Cache-Control sets freshness with max-age and s-maxage, and storage rules with private, public, no-cache and no-store, while stale-while-revalidate and stale-if-error govern what happens after expiry. A stale copy is revalidated with If-None-Match or If-Modified-Since, and a 304 with no body means nothing changed. If-Match turns the same ETag into optimistic concurrency, and a stale writer gets 412. Vary adds request headers to the cache key, Location points at a redirect target or a new resource, and Retry-After tells clients when to come back.
:::

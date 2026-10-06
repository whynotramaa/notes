@part IX | HTTP caching and CDNs | We move the cache to the edge of the internet, a few milliseconds from each user. A CDN is a read-through cache of HTTP responses run across hundreds of locations, with the same questions of keys, lifetimes and invalidation at planetary scale. We will cover edges and cache keys, purges, versioned URLs and origin shields, and signed URLs with the security work that edges do. | where:9

## 29. Edges, POPs and cache keys

Wren's menu photos, app bundles and public menu JSON are the same for everyone who asks. Serving them from Mumbai to a user in London costs a round trip of about 120 ms (illustrative) before the first byte. A content delivery network, a CDN, keeps copies in **points of presence**, POPs, data centres spread across the world, and routes each user to a nearby one, usually by anycast or DNS, as Unit I described. A London user's request reaches a London POP about 10 ms away. If the POP has the object, a cache hit, it answers immediately. If not, a miss, it fetches from Wren's servers, the **origin**, stores the response according to its caching headers and serves it.

@fig be_cdn_pops | Users reach the nearest edge. Only misses make the long trip to the origin in Mumbai.

Akamai, founded in 1998, built the first large CDN. Cloudflare, Fastly, Amazon CloudFront and Google Cloud CDN are common today. They all behave like a read-through cache from Part II, driven by HTTP. The origin's `Cache-Control` header sets the lifetime, `s-maxage` overrides `max-age` for shared caches like the CDN, and `private` or `no-store` keep personal responses out entirely.

The **cache key** decides which requests count as the same response. By default it is the scheme, host, path and query string. Getting the key right is most of the work of configuring a CDN. Include too little and users get each other's responses, the worst CDN bug there is. Include too much and every copy is unique and the hit ratio collapses.

@fig be_cdn_cache_key | The key holds what changes the response, and nothing else.

Wren's image key keeps the path and the width parameter, and adds the `Accept` header through `Vary: Accept`, so browsers that support WebP get WebP. It strips tracking parameters such as `utm_source`, which vary per campaign but never change the image. It normalizes widths, so `?w=401` and `?w=402` become `?w=400`, otherwise each distinct width is a separate copy. And it never includes cookies, which are different for every user and would make the hit ratio zero. Any response that depends on the user, an order history or a cart, should not be cached at a shared CDN at all, or only with keys and rules reviewed by someone who has seen a leak.

The payoff is large. Wren serves about 10,000,000 image requests a day. At a 95% hit ratio, 500,000 reach the origin, and the other 9,500,000 are served from edges at a fraction of the latency and cost.

## 30. Purges, versioned URLs and origin shields

Edges hold copies Wren cannot see, in hundreds of places. Changing what they serve needs one of three approaches.

The cleanest is the **versioned URL**, also called fingerprinting or cache busting. The build process puts a hash of each file's content into its name, `app.3f9a2c.js`. The file is served with `Cache-Control: max-age=31536000, immutable`, a year, because that URL will never have different content. When the code changes, the build produces `app.8b10e4.js` and the HTML references the new name. Nothing needs purging, old and new versions coexist safely, and caches everywhere, CDN and browser alike, keep the old file until it ages out. This is the versioned key from Part IV applied to URLs.

@fig be_cdn_purge | Rename, purge one URL, or purge everything carrying a tag.

When the URL cannot change, such as the public menu JSON at `/menu/9.json`, Wren uses a **purge**, an API call telling the CDN to drop an object everywhere. Purges propagate in a second or two on modern CDNs and in minutes on older ones. **Surrogate keys**, also called cache tags, make purges precise. The origin labels each response with tags in a header such as `Surrogate-Key: menu-9 rest-9`, and one purge of the tag `menu-9` removes the JSON, the HTML page and every image tagged with it, without the caller knowing their URLs. Wren's invalidator from Part IV calls the CDN's purge API alongside its Redis deletes, so change events flow all the way to the edge.

Hundreds of POPs create a stampede problem of their own. When a new menu photo is uploaded, each of 300 POPs misses once and fetches it from the origin, up to 300 requests for one object. An **origin shield** adds a middle tier, a designated POP or regional cache that all edges ask on a miss. The shield misses once and fetches from the origin once, and also collapses concurrent misses for the same object, the request coalescing from Part V. Origin load for new content drops from up to 300 fetches to 1.

@fig be_cdn_shield | Without a shield, every edge asks the origin. With one, the origin is asked once.

CDNs also apply the stale directives from Part V. `stale-while-revalidate` lets edges serve a slightly old menu while refreshing it, and `stale-if-error` lets them keep serving it when the origin is down. For a menu, serving a ten-minute-old copy during an origin outage beats an error page, and the CDN does it without any code at the origin.

## 31. Signed URLs and edge security

Some content should be cached at the edge but not shown to everyone. Order receipts as PDFs, private menu drafts and paid content are examples. A **signed URL** carries an expiry time and a signature computed by Wren's API with a secret key shared with the CDN, typically an HMAC over the path and expiry. The edge recomputes the signature, checks the expiry, and serves the object only if both are valid, without asking the origin. A receipt link valid for 10 minutes can be cached and served fast, and becomes useless when it expires or if anyone edits the path.

@fig be_cdn_signed | The API signs, the client carries, the edge verifies. The origin is never asked.

**Signed cookies** do the same for many files at once. Wren's API sets a cookie carrying a signed policy, "anything under /receipts/42/ until 10:15", and the edge checks the cookie on each request. That suits video segments, where one viewing session fetches hundreds of files. Unit XII returns to signed upload URLs for object storage, which use the same idea in the other direction.

Edges also sit in front of the origin for security, because every request passes through them first. **DDoS protection** absorbs floods of traffic across hundreds of POPs with enormous combined capacity, so a flood that would saturate Wren's own links is spread thin and filtered before it arrives. Anycast routing naturally spreads attack traffic to the POPs nearest its sources.

@fig be_cdn_security | Absorb floods, filter known attacks, and challenge automated clients, before any request reaches the origin.

A **web application firewall**, WAF, inspects requests against rules, blocking known attack patterns such as SQL injection strings, path traversal and exploits for specific software, and enforcing limits on request size and rate. **Bot mitigation** identifies automated clients through rate patterns, browser fingerprints and challenges, and blocks scrapers, credential stuffing and inventory hoarding, the login attacks of Unit III, at the edge. None of these replaces the origin's own defences. A WAF rule catches common SQL injection strings, and the parameterized queries of Unit VI make injection impossible. The edge removes noise and volume, and the origin stays correct on its own.

One last rule ties the security to the caching. The origin should accept traffic only from the CDN, by IP allowlist, a secret header or mutual TLS, otherwise attackers find the origin's address and go around the edge.

:::story Picture this
A newspaper printed in one city and sold everywhere. Instead of every reader travelling to the printing press, copies are trucked to local newsagents, who hand them out in seconds. A correction can be a new edition with a new date on the masthead, a recall of one edition, or a recall of every paper carrying a particular story. And the newsagent checks the subscriber's card at the counter, so the press never has to.
:::

:::note Measuring a CDN
CDNs add response headers such as `X-Cache: HIT` or `Age: 42`, the seconds since the edge stored the object. Wren logs both at the origin and in synthetic checks, tracks the hit ratio per path family, and alerts when origin traffic for images rises above 10% of edge traffic, which usually means a cache key bug.
:::

:::warn Watch out
Caching a response that depends on a cookie or an authorization header without including that in the key serves one user's data to another. Mark personal responses `Cache-Control: private` or `no-store`, review every CDN rule that caches API paths, and test with two accounts.
:::

:::interview Interview lens
**"How would you serve static assets and public API responses through a CDN, and how do you update them?"** Put a content hash in asset file names and serve them with a one-year immutable lifetime, so updates are new URLs and nothing needs purging. Public responses get a short `s-maxage` with stale-while-revalidate and stale-if-error, surrogate-key tags, and a purge by tag from the invalidation pipeline when the data changes. Normalize the cache key, strip tracking parameters, never vary on cookies, enable an origin shield, and lock the origin to accept only CDN traffic.
:::

:::key In one breath
A CDN is a read-through cache of HTTP responses in hundreds of POPs, so a hit answers from about 10 ms away instead of 120 ms, and at 95% only 500,000 of 10,000,000 daily image requests reach the origin. The cache key must contain exactly what changes the response, never cookies. Versioned URLs with a one-year immutable lifetime avoid purges, purges and surrogate-key tags handle fixed URLs, and an origin shield cuts up to 300 origin fetches for new content to 1. Signed URLs and cookies let edges serve private content, and edges absorb DDoS floods, apply WAF rules and stop bots, while the origin accepts only CDN traffic.
:::

@part I | Rate limiting | We limit how much any one caller can ask of the service. A limit protects capacity, keeps one heavy client from starving everyone else, and puts a ceiling on abuse and cost. We will cover why and by what key to limit, the 429 response, the fixed window counter, and the sliding window log. | where:1

## 1. Why limit, and by which key

Wren's API serves millions of people, a few partner integrations and an unknown number of scripts. One buggy partner retrying in a tight loop, one scraper copying every menu, or one attacker guessing passwords can each consume more capacity than thousands of ordinary users. A **rate limit** caps how many requests a caller may make in a period, and requests over the cap are refused rather than served.

Limits do several jobs at once. They give **fairness**, so that one caller's burst does not raise everyone else's latency. They protect capacity, turning a flood into a steady, survivable rate. They bound cost, especially for endpoints that call paid services such as SMS or maps. And they slow abuse, from credential stuffing to scraping, which Part III treats as security. A limit is not a substitute for capacity planning, and it does not stop a large distributed attack on its own, which is the edge's job, Unit VII.

@fig be_rl_why | Four turnstiles keyed four ways. The key decides who shares which allowance.

The most important design choice is the **key**, the identity whose requests are counted together. **Per-user** limits, keyed by user id after authentication, are the fairest for logged-in traffic, and Wren allows 100 requests per user per minute. **Per-IP** limits apply before login and to anonymous endpoints, but many users can share one address behind a carrier NAT or an office proxy, so they must be generous. **Per-API-key** limits govern partners and can follow their contract, 50 requests per second for partner p9. **Global** limits protect a shared resource whatever the caller, such as 2,000 searches per second across the whole service, because the search cluster can take no more.

Real systems layer these. Wren's search endpoint checks the global limit, the user's limit and, for anonymous traffic, the IP's limit, and a request passes only if all three allow it. Limits can also be weighted by cost. A search that scans many rows can cost 5 units against a budget where a menu read costs 1.

When a request is refused, the response should say so clearly. HTTP's **429 Too Many Requests**, defined in RFC 6585 in 2012, is the status. A **Retry-After** header gives the number of seconds to wait, or a date. The IETF's RateLimit header fields, a draft in the HTTP working group, add `RateLimit-Policy`, describing the quota and window, and `RateLimit`, reporting what remains and when it resets, so well-behaved clients can slow down before they hit the wall.

@fig be_rl_429 | The status says no. Retry-After says when. The RateLimit headers say why and how much is left.

## 2. Fixed window counters

The simplest algorithm divides time into fixed windows, such as calendar minutes, and keeps one counter per key per window. Wren's first limiter ran, for each request, `INCR rl:42:2026-10-06T20:05`, set the key to expire after 60 s on its first use, and allowed the request if the counter was at most 100. This is the **fixed window** algorithm, and it costs one Redis command and one small key per user per minute.

It has one well-known flaw, bursts at the window boundary. A client can send 100 requests at 20:05:59 and another 100 at 20:06:00. Both windows are within their limits, yet 200 requests arrived in about two seconds, twice the intended rate. For a limit meant to protect capacity, that doubling matters, since every client that learns the trick can do it at every minute boundary, and clients that start their batches on the minute do it without trying.

@fig be_rl_fixed | Two full windows back to back. A client gets 200 requests through in two seconds.

Fixed windows are still useful. They are perfectly adequate for coarse limits where a brief doubling is harmless, such as daily quotas, "1,000 SMS per account per day". They are easy to reason about and explain to customers, "your quota resets at midnight UTC". And their counters double as usage metrics, since `rl:42:2026-10-06` is simply how many requests user 42 made that day.

Two implementation details matter. The counter and its expiry must be set atomically, Part III shows the race and the fix. And the window key should use a clock everyone agrees on, the Redis server's time or a UTC timestamp, not each app instance's local clock, which can differ by seconds between instances and split one minute into two counters.

The boundary flaw has an intuitive fix, count over the last 60 s rather than the current calendar minute. Doing that exactly is the next algorithm, and doing it approximately is the one after.

## 3. The sliding window log

The **sliding window log** keeps a timestamp for every request in the window, and counts how many fall within the last 60 s at the moment a new request arrives. Old timestamps are discarded as they slide out of the window. If fewer than 100 remain, the request is allowed and its timestamp is added.

A Redis sorted set fits the job exactly, with each request's timestamp as both member and score, made unique with a suffix if two requests share a millisecond. Each request runs three steps, in one Lua script or `MULTI` block. `ZREMRANGEBYSCORE rl:42 0 (now − 60000)` removes entries older than the window. `ZCARD rl:42` counts what remains. If the count is under 100, `ZADD rl:42 now now` records the request and `PEXPIRE rl:42 60000` keeps an idle user's key from lingering.

@fig be_rl_log | The window slides with the clock. Every timestamp inside it counts, and nothing outside does.

The result is exact. At no moment does any 60 s span contain more than 100 allowed requests, so the boundary burst disappears. The price is memory and work. Each user near their limit holds up to 100 entries, and a sorted set entry costs roughly 64 bytes with its overhead, so about 6.4 KB per active user. With 50,000 users active in a minute, that is about 320 MB, against a few megabytes for fixed window counters. Each request also does a range deletion and an insert, O(log n) in the set's size.

The log has a subtler behaviour too. Rejected requests are not recorded, in the version above, so a client that keeps hammering after hitting the limit is allowed again as soon as old entries age out. Recording rejected attempts as well punishes persistent abusers harder, which some security limits want and most API limits do not.

For high-volume limits the memory is hard to justify. A partner allowed 50 requests per second has 3,000 entries per minute in its log. The next part describes two algorithms that give nearly the same behaviour with a constant amount of state per key.

:::story Picture this
A café that gives each customer 10 refills an hour. One barista counts refills per clock hour on a tally sheet, and a sharp customer takes 10 at 2:59 and 10 more at 3:00. Another barista writes the time of every refill on a card and only counts the last 60 minutes, which is fair and exact, and takes a lot of card for a busy regular.
:::

:::note Limit before the expensive part
Rate limits are cheapest at the edge and in the gateway, before authentication, database access or any other work. Wren checks per-IP limits at the gateway, per-user limits right after the token is verified, and endpoint-specific cost limits in the service. A request refused at the edge costs microseconds, and one refused after a database query has already cost the database.
:::

:::warn Watch out
Per-IP limits on their own are easy to evade with many addresses and unfair to users behind shared addresses, such as mobile carriers or universities, where thousands of people appear as one IP. Use per-user and per-key limits wherever callers are identified, and keep per-IP limits generous and focused on anonymous endpoints.
:::

:::interview Interview lens
**"Design rate limiting for an API."** Decide the keys first, per user after authentication, per API key for partners, per IP for anonymous endpoints and global limits for shared resources, layered so a request must pass all that apply. Choose an algorithm per limit, token bucket for most API limits, fixed windows for daily quotas. Store state in Redis with atomic Lua scripts, enforce as early as possible, and return 429 with Retry-After and RateLimit headers. Make limits configurable per plan and monitor rejections.
:::

:::key In one breath
Rate limits protect capacity, keep callers fair, bound cost and slow abuse, and the key decides who shares an allowance, per user, per IP, per API key or global, often layered. Refusals return 429 with Retry-After and RateLimit headers. A fixed window counter is one `INCR` per key per minute but lets 200 requests through in two seconds at a boundary. A sliding window log stores every timestamp in a sorted set and is exact, at about 6.4 KB per active user, 320 MB for 50,000.
:::

@part III | Distributed and security limits | We make limits work across a fleet and then use them as security controls. A limit enforced by each instance alone is not the limit you think it is, and a limit on the wrong key protects nothing. We will cover Redis-based limiters and their races, local and global enforcement, and limits on logins, codes, resets, expensive queries and scrapers. | where:3

## 7. Redis-based limiters

Wren runs 20 instances, and a user's requests land on any of them. A limit of 100 per minute must count all of them together, so the state lives in Redis, which every instance can reach in about 0.5 ms. Every algorithm in Part II maps onto Redis structures, counters for windows, sorted sets for logs and hashes or single values for buckets and GCRA.

The danger is splitting one logical step into several commands. Wren's first fixed-window limiter ran `INCR rl:42:…` and then, if the result was 1, `EXPIRE rl:42:… 60`. Two commands, two round trips. If the instance crashed or the connection dropped between them, the key existed with no expiry. The counter kept growing forever, and user 42 was limited forever, a support ticket that took a day to diagnose.

@fig be_rl_redis_race | INCR succeeded, the crash came before EXPIRE, and the key never resets.

The fix is to make the step atomic. A Lua script runs on Redis's single thread with nothing interleaved, so `INCR` and the conditional `EXPIRE` happen together or not at all. Alternatively, `SET key 0 EX 60 NX` followed by `INCR` makes the expiry part of the creation. Every multi-step limiter, sliding counters, token buckets and logs, belongs in a script for the same reason, and also because reading, deciding and writing in separate commands lets two instances both read "99" and both allow a request.

A Redis limiter adds a round trip to every request, and Redis becomes a dependency of every request. Wren treats it carefully. Limiter calls have a 20 ms timeout. If Redis is unavailable, the limiter **fails open**, allowing the request and logging the failure, for ordinary API limits, because refusing all traffic during a Redis outage would be worse than briefly unlimited traffic. For security limits such as login attempts, it **fails closed**, refusing the request, because an outage must not become a window for password guessing.

At high volume, a single key can become a hot key, Unit VII. A global limit of 2,000 searches per second is 2,000 script calls per second on one key, on one shard. Splitting the global limit across a few keys, each allowing a share, and picking one at random spreads the load at a small cost in accuracy.

## 8. Local and global enforcement

The alternative to Redis is to enforce limits locally, in each instance's memory, with no network call at all. With 20 instances and a limit of 100 per minute, each instance allows 100 ÷ 20 = 5 per user per minute. If the load balancer spreads a user's requests evenly, the user gets about 100 in total.

The trouble is that requests are rarely spread evenly per user. A mobile app keeps one HTTP/2 connection to one instance for minutes, so all of user 42's requests land on one instance, and they are limited at 5 per minute instead of 100. When instances scale from 20 to 4 overnight, each instance's share must change, or the effective limit drops to 20. Local limits are fast and wrong in ways that depend on routing.

@fig be_rl_local_global | Local limits divide the quota and depend on routing. A shared Redis limit is exact and adds a round trip.

There are useful middle grounds. **Approximate global limits** keep counters locally and synchronize with Redis every second or two, adding local counts to a shared total and reading the total back. The limit can overshoot by about one sync interval's worth of traffic, and Redis load drops from one call per request to one call per instance per second. Envoy's rate limit service and many gateways offer a similar split, a local token bucket in front of a global one.

**Local limits for protection, global limits for fairness** is the pattern Wren settled on. Each instance has a local concurrency limit and a local token bucket sized to what that instance can handle, Unit IX, which protects the instance whatever happens to Redis. Per-user and per-key fairness limits are global in Redis, because their purpose is a promise to the customer about their quota, and that promise must hold however requests are routed.

Large services also push limits to where routing is predictable. A gateway that routes each API key consistently to one of a few limiter nodes, by hashing the key, can enforce exact limits locally on those nodes. Unit XI covers that kind of consistent routing.

## 9. Limits as security controls

Several of Wren's limits exist to stop attacks rather than to share capacity, and they need different keys and stricter failure behaviour.

**Login protection** limits guesses per account, 5 attempts per minute for Wren, which stops brute force against one account. It does not stop **credential stuffing**, Unit III, where an attacker tries a leaked password list against a million different accounts, one attempt each. Per-account limits never trigger. Per-IP limits help, but attackers rotate through thousands of addresses. The defences that work combine per-IP limits, a global limit on failed logins with alerts when it spikes, device and behaviour signals from the edge, and multi-factor authentication.

**One-time codes**, the 6-digit SMS or email codes, have 1,000,000 possible values. Without a limit, an attacker at 100 guesses per second covers them all in 10,000 s, about 2.8 hours, and finds the right one in about 1.4 hours on average. With 5 attempts per code and a code that expires after 10 minutes, the chance of guessing one code is 5 ÷ 1,000,000 = 0.0005%. The limit must be per code or per account, never only per IP, and an account that keeps requesting new codes needs its own limit, since each new code gives 5 fresh guesses.

@fig be_rl_security | Four endpoints where the limit is the security control.

**Password reset** requests are limited to a few per account per hour, both to stop inbox flooding and to stop attackers using resets to probe which emails have accounts. The response is the same whether or not the account exists, as Unit III described. **SMS and email sends** are limited because each one costs money, and attackers abuse unprotected OTP endpoints to send millions of premium-rate messages, a fraud called SMS pumping.

**Expensive queries**, such as search with complex filters or report exports, get cost-weighted limits, so a client cannot exhaust the database by sending many cheap-looking requests that are actually costly. **Scraping** of menus and prices is slowed by per-IP and per-session limits, by requiring authentication for bulk access, and by the edge's bot detection. And **denial of service** is mostly the CDN's job, but application limits keep a flood that slips through from reaching the database.

For all of these, the limiter fails closed, logs every refusal with the key and the endpoint, and feeds an alert when refusals spike, because a sudden wave of 429s on the login endpoint is usually an attack in progress.

:::story Picture this
A bank branch limits how often anyone can try the vault combination, not to share the vault fairly but because every try is a chance to break in. It limits each customer, it watches for one person trying many customers' boxes, and it does not loosen the rule on days when the counter-tracking system is down.
:::

:::note Cost of a Redis round trip
At 2,000 requests per second, a limiter call of 0.5 ms adds 1 s of waiting per second across the fleet, spread over 20 instances, plus 2,000 Redis operations per second. That is small next to a database query, which is why most services accept it. For extreme volumes, local buckets with periodic sync cut the cost by orders of magnitude.
:::

:::warn Watch out
Rate limiting by a header the client controls, such as `X-Forwarded-For` taken at face value, lets attackers choose their own key and evade the limit by rotating fake addresses. Use the address seen by your own edge, or the header only as set by your trusted proxy, Unit XI.
:::

:::interview Interview lens
**"How would you protect a one-time code verification endpoint?"** Limit attempts per code and per account, such as 5 tries per code with a 10-minute expiry, so the chance of guessing a 6-digit code is 0.0005%, and limit how often new codes can be requested so attempts do not reset. Add per-IP limits and global anomaly alerts, fail closed if the limiter's store is down, return the same response for valid and invalid accounts where it matters, and log refusals. Without limits, 100 guesses per second covers all 1,000,000 codes in under three hours.
:::

:::key In one breath
Distributed limiters keep state in Redis and must be atomic, since INCR followed by a separate EXPIRE can leave a key with no expiry and lock a user out forever, so they run as Lua scripts. Local limits of 100 ÷ 20 = 5 per instance are fast but depend on routing, approximate global limits sync periodically, and Wren uses local limits for protection and Redis limits for fairness, failing open for ordinary limits and closed for security ones. Security limits key on accounts, codes and sends, and 5 tries per 6-digit code gives a 0.0005% chance, against 2.8 hours to try every code without one.
:::

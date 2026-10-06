@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Rate limiting

**Q1. Why rate-limit an API?**

To share capacity fairly, protect the service from floods, bound costs of paid dependencies, and slow abuse such as brute force and scraping.

**Q2. Which keys can a limit use?**

User id after authentication, API key for partners, IP for anonymous traffic, and global keys for shared resources. They are often layered, and a request must pass every applicable limit.

**Q3. What should a rate-limited response contain?**

Status 429, a Retry-After header with seconds or a date, and ideally RateLimit-Policy and RateLimit headers describing quota, remaining and reset, with a structured error body.

**Q4. What is the flaw in fixed window counters?**

Bursts at the boundary. A client can use a full window's quota at the end of one window and again at the start of the next, twice the rate over a short span.

**Q5. How does the sliding window log work and what does it cost?**

It stores a timestamp per request in a sorted set, removes those older than the window and counts the rest. It is exact, and costs memory proportional to the limit per key.

**Q6. Explain the sliding window counter.**

It estimates the last window's count as the previous fixed window's count times the fraction still overlapping, plus the current count. Two counters per key, small error.

**Q7. Explain the token bucket.**

Tokens refill at a steady rate up to a capacity, and each request takes one. Capacity sets the allowed burst and rate the sustained limit. State is the count and last update time.

**Q8. Leaky bucket versus token bucket?**

As a queue, the leaky bucket smooths bursts into a constant output rate. As a meter it is equivalent to a token bucket. GCRA implements it with one theoretical arrival time per key.

### Distributed and security limits

**Q9. How do you implement a limiter shared across many instances?**

Keep state in Redis and perform read, decide and write in one Lua script using Redis's clock, so it is atomic and every instance sees the same limit.

**Q10. What goes wrong with INCR followed by EXPIRE?**

A crash between the two leaves a key with no expiry, so the counter never resets and the user stays limited. Do both in a script or create the key with its expiry.

**Q11. Should a limiter fail open or closed when Redis is down?**

Open for ordinary capacity and fairness limits, so an outage does not block all traffic. Closed for security limits such as login and OTP attempts, so the outage is not an attack window.

**Q12. What is wrong with dividing a global limit across instances?**

Requests are not evenly spread per user, especially with long-lived connections, so users are limited too hard or too loosely, and the share must change as instances scale.

**Q13. How do rate limits defend logins and OTPs?**

Limit attempts per account and per code, add per-IP and global anomaly limits against credential stuffing, limit how often codes can be requested, and fail closed. Five tries on a 6-digit code gives a 0.0005% chance.

### Timeouts

**Q14. Which timeouts should an HTTP client have?**

A connect timeout, a read or idle timeout, a write timeout and an overall deadline, since read timeouts reset with each byte and slow drips never trip them.

**Q15. Why are default timeouts dangerous?**

Many clients wait forever by default, Python requests, Go's zero-value client, Java's HttpURLConnection, fetch without an abort signal, so one slow dependency can hang a service.

**Q16. How do you choose a timeout value?**

Start slightly above the dependency's p99.9 under normal load, and make sure it fits within the caller's remaining deadline.

**Q17. What is deadline propagation?**

Passing the request's remaining time budget to each downstream call, as gRPC does with its timeout header, so each hop gets what is left and work stops when the deadline passes.

**Q18. Describe a cascading failure.**

A slow dependency holds callers' threads and connections far longer than normal, their pools fill and all their requests stall, and the stall spreads to their callers. Only one component is broken, yet the whole chain fails.

### Retries

**Q19. Which errors are retryable?**

Connection failures, 429, 502, 503 and 504, and timeouts only for idempotent or keyed operations. Not 400, 401, 403, 404, 409 or 422.

**Q20. What is retry amplification?**

Several layers each retrying multiply attempts, so 3 layers with 4 attempts each turn one request into 64 at the bottom. Retry at one layer.

**Q21. What is a retry budget?**

A cap on retries as a fraction of normal traffic, such as 10%, often a token bucket where successes earn tokens and retries spend them, so a failing dependency is not hit with multiples of its load.

**Q22. What are hedged requests?**

Sending a second copy of an idempotent request to another replica if the first has not answered by the p95, using the first reply and cancelling the other, which cuts tail latency for about 5% extra load.

### Breakers and bulkheads

**Q23. How does a circuit breaker work?**

Closed, it passes calls and counts failures. Over a threshold it opens and fails calls immediately. After a cool-down it goes half-open and lets probes through, closing on success and reopening on failure.

**Q24. What should count as a failure for a breaker?**

Timeouts, connection errors and 5xx responses, and optionally slow calls over a threshold. Not 4xx errors caused by the caller.

**Q25. What is a bulkhead?**

A separate, limited pool of threads, connections or permits per dependency or kind of work, so one slow dependency cannot exhaust resources the rest of the service needs.

**Q26. What makes a good fallback?**

An honest partial answer, such as cached data, a default estimate, or holding work to finish later. Never a fallback that misleads, such as empty results, or that weakens security, such as allowing access when authorization is down.

**Q27. What is graceful degradation?**

Predefined levels of reduced service, switched by flags, that drop the least important features first so the core keeps working during an incident.

### Webhooks

**Q28. Design a webhook receiver.**

Verify the signature and timestamp, persist the event by its id in an inbox with a unique constraint, return 2xx quickly, and process asynchronously and idempotently with retries and a dead-letter queue.

**Q29. How is a webhook signature verified?**

Recompute an HMAC, usually SHA-256, over the timestamp and the raw body with the shared secret, and compare to the header's value in constant time.

**Q30. How do you prevent webhook replays?**

Include the timestamp in the signed payload and reject deliveries outside a tolerance, such as 300 s. Within the window, deduplicate by event id.

**Q31. How do you rotate a webhook secret?**

Accept signatures from both the old and new secrets for an overlap period, switch the provider to the new secret, then retire the old one.

**Q32. How do you handle out-of-order webhooks?**

Treat each as a hint that something changed, fetch the object's current state from the provider's API, and run periodic reconciliation for anything missed.

**Q33. How should you send webhooks to customers?**

From a queue, signed with a per-customer secret, with an event id and timestamp, short timeouts, jittered exponential retries over days, and disabling plus notifying after persistent failure. Guard against SSRF in customer-supplied URLs.

### Third-party APIs

**Q34. Why wrap a third-party API?**

To map its responses and errors into your own types, keep its details out of your codebase, make it testable with fakes, and put timeouts, retries, breakers, bulkheads, limits and idempotency in one place.

**Q35. How do you stay within a provider's rate limit from many instances?**

A shared client-side limiter, such as a Redis token bucket set slightly under the provider's limit, adjusted by the provider's rate-limit headers and honouring Retry-After.

**Q36. How should OAuth access tokens be handled?**

Cache them, refresh early at about 80% of their lifetime, coalesce refreshes to one per process, and on a 401 refresh once and retry once.

**Q37. How do you survive a provider changing its API?**

Pin API versions where possible, read tolerantly by ignoring unknown fields and mapping unknown enum values to an alerted unknown, and run contract tests against recorded responses.

**Q38. What is your plan when a provider is down?**

Decided per provider: a second provider for SMS or email, cached data for maps, holding payments to complete later with an honest message. Never let a non-critical provider block core flows.

### Email

**Q39. Trace an email from the application to the inbox.**

The app enqueues a job, a worker sends through a provider's API, the provider looks up the recipient's MX and delivers over SMTP with TLS, and the receiving server checks authentication and reputation before choosing inbox, spam or reject.

**Q40. What do SPF, DKIM and DMARC do?**

SPF lists which servers may send for the envelope domain. DKIM signs messages with a key published in DNS. DMARC requires SPF or DKIM to pass for a domain aligned with the visible From and sets the policy for failures, with reports.

**Q41. Hard bounce or soft bounce?**

A hard bounce is permanent, such as an unknown address, and the address must be suppressed. A soft bounce is temporary, a 4xx reply, and is retried for days.

**Q42. Why separate transactional and bulk email?**

Recipients complain about promotions far more than receipts or resets, and shared domains and IPs let a bad campaign's reputation push critical mail into spam.

**Q43. What do mailbox providers require of large senders?**

Since 2024 Gmail and Yahoo require SPF, DKIM and DMARC with alignment, one-click unsubscribe for marketing mail, and spam complaint rates below 0.3% for senders over 5,000 messages a day.

### Primary sources

[RFC 6585, Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585). 429 Too Many Requests.

[Nygard, Release It!, 2007 and 2018](https://pragprog.com/titles/mnee2/release-it-second-edition/). Circuit breakers, bulkheads and timeouts.

[Dean and Barroso, The Tail at Scale, 2013](https://research.google/pubs/the-tail-at-scale/). Hedged requests and tail latency.

[Google SRE book, Handling Overload and Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/). Retries, budgets and degradation.

[Stripe documentation, Webhooks](https://docs.stripe.com/webhooks). Signatures, timestamps, retries and rotation.

[RFC 7208 SPF, RFC 6376 DKIM and RFC 7489 DMARC](https://www.rfc-editor.org/rfc/rfc7489). Email authentication.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Rate limits

**E1** ● A fixed window allows 60 requests per minute. What is the most a client can send in about two seconds?

**E2** ● A sliding window counter with limit 80 has 50 requests in the previous minute and 30 in the current one, 40% of the way through. Is the next request allowed?

**E3** ● A token bucket has capacity 30 and refills 120 tokens per minute. How big is the burst, what is the spacing after it, how long does a full refill take, and what is the most a client can send in the first minute?

**E4** ● What are GCRA's emission interval and burst tolerance for 300 requests per minute with a burst of 10?

**E5** ● A sliding window log allows 200 requests per minute at about 64 bytes per entry. How much memory do 20,000 users at their limit need?

**E6** ● A global limit of 120 per minute is enforced locally on 8 instances. What is each instance's share, and what happens to a user whose connection is pinned to one instance?

**E7** ● A 4-digit code allows 3 attempts. What is the chance of guessing it, and how long would an unlimited attacker at 50 guesses per second take to try every code?

### Timeouts and retries

**E8** ● A service receives 300 requests per second, each calling a dependency that now takes 20 s. How many concurrent calls does it need, how quickly does a pool of 100 fill, and how many calls are in flight with a 150 ms timeout?

**E9** ● Four layers each make up to 3 attempts. How many calls can one request cause at the bottom?

**E10** ● A client makes 2,000 calls per second with a 20% retry budget. What is the most retries per second, and how many calls per second would 3 retries per failure cause if the dependency failed completely?

**E11** ● What fraction of extra requests does hedging at the p95 add, and at the p90?

**E12** ● A checkout deadline is 3 s. The first payment attempt times out at 2 s and backoff waits 100 ms. What timeout should the second attempt use?

**E13** ● A dependency receives 15 calls per second per instance with a p99 of 0.5 s. How many are in flight normally, and what bulkhead size would you choose?

### Integrations

**E14** ● A webhook captured at time t is replayed at t + 240 s with a 300 s tolerance. What stops it?

**E15** ● Wren sends 180,000 receipts an hour. How many complaints per hour reach 0.3% and 0.1%?

**E16** ● An OAuth token lasts 1,800 s. When should it be refreshed, and what happens if 2,000 requests per second each fetch a new token instead?

**E17** ● A reconciliation job pages through 120,000 provider records at 100 per page with a 20 per second share of the limiter. How long does it take?

### Traces and explanations

**E18** ●● Trace the INCR then EXPIRE race and write the Lua fix.

**E19** ●● Choose an algorithm and key for each: a partner's 50 per second contract; a daily SMS quota per account; login attempts; global search capacity of 2,000 per second.

**E20** ●● Explain why local per-instance limits misbehave with HTTP/2 clients, and propose a design.

**E21** ●● Design the defences for A → B → C → database when C may become very slow.

**E22** ●● Classify for retry: connection reset on a GET; timeout on a POST without a key; timeout on a POST with an idempotency key; 409; 429 with Retry-After 5; 503.

**E23** ●● Trace a breaker with threshold 50% over 20 calls, 30 s open, through a provider outage that lasts 2 minutes.

**E24** ●● A webhook receiver rejects every genuine Stripe event as badly signed. Give the likely cause and fix.

**E25** ●● A refunded event arrives before the succeeded event for the same payment. What should the receiver do?

**E26** ●● Receipts land in spam. Which headers and tools do you check, in what order?

### Code and design

**E27** ●●● Write a Redis Lua token bucket with capacity, refill rate and Retry-After.

**E28** ●●● Design a webhook receiver for a payment provider, end to end.

**E29** ●●● Design a payment adapter with every protection from the unit, including the unknown-outcome path.

**E30** ●●● Prove that a token bucket with capacity B and rate r admits at most B + r·t requests in any interval of length t.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 60 at the end of one window and 60 at the start of the next, 120 in about two seconds.

**E2.** 50 × (1 − 0.4) + 30 = 30 + 30 = 60, below 80, so it is allowed.

**E3.** The burst is 30. Refill is 2 per second, so 0.5 s between requests after it. A full refill from empty takes 30 ÷ 2 = 15 s. In the first minute a client can send 30 + 120 = 150.

**E4.** T = 60 ÷ 300 = 0.2 s, and τ = (10 − 1) × 0.2 = 1.8 s.

**E5.** 200 × 64 × 20,000 = 256,000,000 bytes, about 256 MB.

**E6.** 120 ÷ 8 = 15 per instance. A user pinned to one instance gets only 15 per minute instead of 120.

**E7.** 3 ÷ 10,000 = 0.03% per code. Unlimited at 50 per second, 10,000 ÷ 50 = 200 s to try every code.

**E8.** 300 × 20 = 6,000 concurrent calls. A pool of 100 fills in 100 ÷ 300 ≈ 0.33 s. With a 150 ms timeout, 300 × 0.15 = 45 calls in flight.

**E9.** 3⁴ = 81 calls.

**E10.** At most 2,000 × 0.2 = 400 retries per second. Without a budget, a total failure causes 4 attempts per call, 8,000 calls per second.

**E11.** About 5% at the p95, since only requests slower than it are hedged, and about 10% at the p90.

**E12.** 3 − 2 − 0.1 = 0.9 s remain, so the second attempt gets at most 900 ms, a little less to leave room for the response.

**E13.** 15 × 0.5 = 7.5 in flight normally. A bulkhead of about 20 allows for slow spells without hoarding resources.

**E14.** The signature and timestamp are still valid, since 240 s is within the window, so the event id's unique constraint in the inbox catches it as a duplicate.

**E15.** 180,000 × 0.003 = 540 complaints per hour at 0.3%, and 180 at 0.1%.

**E16.** At 80%, 1,440 s after issue. Fetching per request means 2,000 token requests per second to the provider's token endpoint, which will be rate-limited and add latency to every call.

**E17.** 120,000 ÷ 100 = 1,200 requests, at 20 per second, 60 s.

**E18.** The app runs INCR, which creates the key with value 1, then crashes before EXPIRE. The key has no TTL, the counter keeps growing past the limit and never resets. Fix:

```lua
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return n
```

The script runs atomically, so the expiry is always set with the first increment.

**E19.** Partner contract: token bucket keyed by API key, rate 50 per second with a modest burst. Daily SMS quota: fixed window keyed by account and UTC date. Login attempts: sliding window log keyed by account, plus per-IP, failing closed. Global search: a token bucket or GCRA on a global key, possibly split across a few keys to avoid a hot key, sized to the search cluster's capacity.

**E20.** An HTTP/2 client keeps one connection to one instance for minutes, so all its requests land there and a local share of the limit throttles it far below its quota, while scaling changes each instance's share. Use a shared Redis limiter for per-user fairness, keep local token buckets sized to each instance's own capacity for protection, and if Redis cost matters, sync local counts to Redis every second.

**E21.** B calls C with a connect timeout, an overall timeout slightly above C's normal p99.9 and within B's remaining deadline, which A propagates. B wraps C in a circuit breaker and a bulkhead sized by Little's law, and has a fallback for C's data, such as a cache. Retries happen only at A, with a budget. A and B both have admission control that sheds load when queues grow. C itself has statement timeouts on the database and its own limits.

**E22.** Connection reset on a GET: retry. Timeout on a POST without a key: do not retry blindly, since it may have succeeded, so query status or fail as unknown. Timeout on a POST with a key: retry with the same key. 409: do not retry. 429 with Retry-After 5: retry after at least 5 s plus jitter. 503: retry with backoff within the budget.

**E23.** At the start, calls begin to fail. Once at least 20 calls are in the window and half have failed, the breaker opens, within seconds at normal traffic. For 30 s every call fails immediately with the fallback. It goes half-open and the probe fails, so it opens for another 30 s. This repeats about four times during the 2 minutes. The first probe after the provider recovers succeeds, further probes succeed, and the breaker closes, so recovery is noticed within about 30 s of the provider's return.

**E24.** The body is parsed by JSON middleware before verification, and the signature is computed over the re-serialized JSON rather than the raw bytes, which differ in spacing and order. Capture the raw body before parsing for the webhook route, verify the HMAC over the timestamp and raw bytes in constant time, then parse.

**E25.** Store both events by id. Process them as hints: for either event, fetch the payment intent's current status from the provider's API and update the order to match it, refunded in this case. Order of arrival then does not matter, and the later succeeded event leads to the same fetch and no change.

**E26.** Open a message's raw headers and read Authentication-Results for SPF, DKIM and DMARC pass or fail and alignment. Check the DNS records for SPF, the DKIM selector and DMARC. Then check reputation in Google Postmaster Tools and the provider's dashboard, bounce and complaint rates per stream, and whether receipts share a domain or IPs with marketing. Check blocklists for the sending domain and IPs. Finally look at content and links, such as URL shorteners or mismatched link domains.

**E27.** One version:

```lua
-- KEYS[1] bucket key; ARGV: capacity, rate per second, cost
local cap, rate, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local t = redis.call('TIME'); local now = t[1] + t[2] / 1e6
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) * rate)
local allowed, retry = 0, 0
if tokens >= cost then tokens = tokens - cost; allowed = 1
else retry = (cost - tokens) / rate end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.ceil(cap / rate) + 1)
return { allowed, tostring(retry) }
```

It uses Redis's clock, refills lazily, and returns the seconds until enough tokens exist for Retry-After. The expiry removes idle buckets once they would be full anyway.

**E28.** Route `POST /webhooks/stripe` without CSRF or session middleware, with a body limit and its own rate limit and bulkhead. Read the raw body, parse the signature header, reject if the timestamp is outside 300 s, compute HMAC-SHA256 over timestamp, a dot and the raw body for each active secret, and compare in constant time. Insert `(event_id, type, payload, received_at)` into an inbox with a unique event id, ignoring conflicts, and return 200. A worker claims unprocessed rows with SKIP LOCKED, fetches the referenced object's current state from the provider's API, applies it idempotently with versions or state machine checks, publishes domain events through the outbox, and marks the row done, with retries, backoff and a dead-letter state. An hourly reconciliation lists recent provider objects and repairs differences. Alert on verification failures, inbox age and dead letters, and rotate secrets with an overlap.

**E29.** Interface `charge(order, amount, key)` returning Charged, Declined(reason), Pending or Unavailable. Each call enters a semaphore bulkhead of 20, checks a breaker (50% of 20 calls, 30 s open, half-open probes), takes a token from a Redis limiter at 95 per second, and calls with a 200 ms connect timeout and an overall timeout of min(2 s, remaining deadline − margin), passing the idempotency key. Map declines to Declined, 5xx, connection errors and an open breaker to Unavailable, and 4xx bugs to internal errors. On timeout, the outcome is unknown, so retry once with the same key if the deadline and retry budget allow, otherwise return Pending. The caller stores the order as payment_pending and a job polls `status(key)` with backoff until it resolves, while the webhook usually resolves it first. Metrics cover latency, outcome counts, breaker state and limiter waits, and logs record the provider's request id.

**E30.** Let the bucket hold at most B tokens and gain r per unit time. Take any interval [s, s + t]. At time s it holds at most B tokens. During the interval it gains at most r·t tokens, since it cannot gain more than r per unit time and gains nothing beyond capacity. Each admitted request removes one token and tokens never go negative, so the number of requests admitted in the interval is at most the tokens available at its start plus those gained during it, B + r·t.

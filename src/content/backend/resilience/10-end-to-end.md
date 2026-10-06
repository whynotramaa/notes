@part X | The payment call end to end | We follow Wren's checkout payment through every protection in the unit, then watch the payment provider slow down mid-dinner. The point is to see the protections working together, each covering the gaps of the others. We will cover the payment call step by step, the provider's bad evening minute by minute, and the unit on one page. | where:10

## 28. POST /orders/124/pay, step by step

User 42 taps "Pay" for order 124. The request reaches the gateway, which checks the per-user rate limit, a token bucket with capacity 20 and 100 per minute, and finds plenty of tokens. It sets a deadline of 3 s for checkout, longer than the 300 ms for reads because payment providers are slower, and passes the deadline downstream.

The order service authenticates the request, loads order 124, and asks the `PaymentGateway` adapter to charge it. The adapter enters the payments bulkhead, one of 20 slots on this instance. It checks the payment provider's circuit breaker, which is closed. It takes a token from the fleet-wide provider limiter, set at 95 per second. It builds the call with the idempotency key `pay-124-1`, a connect timeout of 200 ms and an overall timeout of 2 s, or less if the deadline has less left. The provider answers in 380 ms with "requires confirmation" or "succeeded", depending on the card.

@fig be_res_e2e | Eight protections in order. A timeout at the call is an unknown outcome, settled by the key and the webhook.

If the call times out, the outcome is unknown, since the provider may have charged the card. The adapter does not assume failure. Within the deadline and the retry budget, it retries once with the same key `pay-124-1`, and the provider recognises the key and returns the original result. If there is no time left, the order is marked `payment_pending`, the app shows "confirming your payment", and a background job checks the payment status.

Either way, the provider later sends a `payment_intent.succeeded` webhook. Wren verifies its HMAC and timestamp, stores it in the inbox by event id, returns 200, and a worker fetches the payment's current status from the provider before marking order 124 paid and publishing `PaymentCaptured`, Unit VIII. The receipt is queued and sent through SES with SPF, DKIM and DMARC aligned. An hourly reconciliation compares Wren's payments with the provider's list and repairs anything a lost webhook missed.

Every step has a limit, a deadline or a key. Nothing waits forever, nothing is retried unsafely, nothing is trusted without verification, and nothing depends on a single message arriving.

## 29. The provider's bad evening

At 20:15 on Friday, the payment provider has an incident, and its p99 latency jumps from 400 ms to 10 s. Here is how Wren's protections respond, minute by minute.

Within 2 s, calls start hitting the 2 s timeout. The payments bulkhead fills to its 20 slots on each instance, and further payment requests are rejected immediately as `Unavailable`. Menus, tracking and browsing are untouched, because they never shared those slots. Retries are mostly refused by the retry budget, which has few tokens when most calls fail, so the provider sees roughly normal load from Wren rather than four times it.

@fig be_res_story | Six moments from the provider's incident, and what each layer did.

By 20:15:10, half of the last 20 calls have failed, and the breaker opens on every instance. Payment attempts now fail in microseconds. The checkout falls back to the degraded flow from Part VI. Orders are accepted as `payment_pending`, the app tells users "payment is taking longer than usual, we will confirm by SMS", and the orders wait in a queue rather than going to kitchens. The on-call engineer sees the breaker-open alert, checks the provider's status page, and confirms the problem is not Wren's.

Every 30 s, the breaker goes half-open and sends a probe. At 20:15:40 the probe fails, and the breaker stays open. At 20:18 a probe succeeds, then two more, and the breaker closes. A worker drains the pending orders, charging each with its original idempotency key, so any charge that actually succeeded during the incident is not repeated. Webhooks delayed by the provider's incident arrive over the next hour and are deduplicated by the inbox. By 20:30 the pending queue is empty, and reconciliation at 21:00 finds nothing to fix.

Without the protections, the same incident would have filled every thread on every instance with 10 s payment calls, stalled menus and tracking along with checkout, quadrupled the load on the provider through retries, and charged some cards twice. With them, a third-party incident became three minutes of slower checkouts.

## 30. The unit on one page

The unit's ideas fall into two groups, protecting Wren from what calls it, and protecting Wren from what it calls.

From callers, rate limits share capacity fairly and slow abuse. The algorithm decides how bursts are treated, fixed windows for coarse quotas, sliding logs for exact low-volume limits, token buckets and GCRA for most API limits. Limits live in Redis for fairness across instances and locally for protection, run as atomic scripts, fail open or closed depending on whether they guard capacity or security, and key on the identity that matters, user, key, IP, code or account. Webhooks are callers too, verified by HMAC and timestamp, persisted by event id and processed asynchronously.

@fig be_res_components | Limits on the way in. Deadlines, retries, breakers and bulkheads on the way out. Verification for everything from outside.

From dependencies, every call has a deadline propagated from the edge, connect and overall timeouts set from the dependency's real latency, and retries only for retryable errors, at one layer, with jitter and a budget. Circuit breakers stop calling a dependency that is clearly failing, bulkheads keep its failures in their own compartment, and fallbacks and degradation levels decided in advance keep the product useful. Third-party providers sit behind adapters that own all of this, along with idempotency keys, shared client-side limits, token caching and a written plan for their outages. Email adds its own protocol of trust, SPF, DKIM, DMARC, suppression and separate streams.

The common thread is the unit's opening sentence. Assume every dependency will fail, and every caller will misbehave, and design so that when they do, the failure stays small, fast and visible. Unit XI moves into the network between all of these parties, proxies, load balancers and the paths requests take.

:::story Picture this
A well-run airport on a stormy night. Gates admit passengers at a steady rate. Each flight has a departure deadline, and a late inbound plane does not hold every other flight. When one airline's systems go down, its desks close and its passengers are rebooked, while other airlines keep boarding. Nothing is left waiting forever, and every announcement says exactly what is happening and when to check back.
:::

:::warn Watch out
Resilience mechanisms that have never fired are guesses. Breakers with wrong thresholds, bulkheads too small for normal peaks, fallbacks that throw exceptions, retry budgets set to zero by mistake. Exercise them in staging and game days with injected latency and errors, and alert when a breaker opens so that its first opening in production is noticed.
:::

:::interview Interview lens
**"Walk me through how your checkout calls a payment provider safely."** The gateway rate-limits the user and sets a checkout deadline that propagates. The payment adapter runs inside a bulkhead, checks a circuit breaker, takes a token from a shared limiter under the provider's limit, and calls with a short connect timeout, an overall timeout within the remaining deadline and an idempotency key. Retryable failures are retried once within a budget with the same key, and timeouts are treated as unknown. If the breaker is open, orders are held as payment pending with an honest message. The provider's webhook, verified and deduplicated, confirms the result, and hourly reconciliation catches anything missed.
:::

:::key In one breath
Wren's payment call passes a user rate limit, a 3 s propagated deadline, a 20-slot bulkhead, a breaker, a 95 per second shared limiter and a call with 200 ms connect and 2 s overall timeouts and key `pay-124-1`, with timeouts treated as unknown and settled by the key, the webhook and reconciliation. When the provider's p99 jumps to 10 s, the bulkhead contains it, the budget stops retry storms, the breaker opens in 10 s and orders wait as payment pending until probes succeed three minutes later. Limits protect Wren from callers, deadlines, retries, breakers and bulkheads protect it from dependencies, and verification protects it from the outside world.
:::

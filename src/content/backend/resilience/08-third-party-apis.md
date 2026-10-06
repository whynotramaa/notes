@part VIII | Third-party APIs | We integrate services owned by other companies, payment providers, SMS gateways, maps and email providers. They have their own outages, limits, authentication and release schedules, and none of those care about Wren's dinner peak. We will cover wrapping a provider behind Wren's own interface, respecting rate limits and quotas, and handling authentication, schema changes and outages. | where:8

## 22. Wrapping the provider

Wren talks to a payment provider, an SMS gateway, a maps service and an email provider. Each has its own SDK, error codes, field names and failure modes. If that detail leaks through the codebase, every service that touches payments must understand the provider's error taxonomy, and switching providers means changing hundreds of call sites. The first rule of integration is to put each provider behind a small interface that Wren owns, the dependency inversion of Unit V, often called an **anti-corruption layer** after Eric Evans's *Domain-Driven Design* (2003).

Wren's `PaymentGateway` has a handful of methods, `charge(order, amount, idempotency_key)`, `refund(...)` and `status(...)`, returning Wren's own types, `Charged`, `Declined(reason)` and `Unavailable`. The adapter for the current provider maps the provider's responses into those types. A card decline with code `insufficient_funds` becomes `Declined(INSUFFICIENT_FUNDS)`. A 5xx, a timeout or an open breaker becomes `Unavailable`. A 400 caused by a bug in Wren's request becomes an internal error that pages someone, because it is a programmer error, Unit V.

@fig be_tp_wrapper | The provider call sits inside a deadline, a breaker, retries, a limiter and a bulkhead, and the rest of Wren sees only Wren's types.

The adapter is also where all of this unit's protections live, in one place, for every caller. A deadline taken from the request's remaining budget. A connect timeout of 200 ms and an overall timeout of 2 s. Retries for retryable errors within a retry budget. A circuit breaker. A client-side rate limiter matching the provider's limit. A bulkhead of 20 concurrent calls per instance. An idempotency key on every call that changes state. Metrics for latency, errors by type and breaker state, and logs that record the provider's request id alongside Wren's, so a support ticket with the provider can quote the exact call.

Error mapping deserves care, because it decides what users see and what gets retried. Wren's API never passes a provider's message to a client. A decline becomes a structured error with Wren's own code and a message the app can show. A provider outage becomes 503 with Retry-After, or the queued-payment fallback of Part VI. And unexpected provider responses, an unknown status or a missing field, are treated as `Unavailable` and alerted, rather than guessed at.

The interface also makes testing possible. A fake gateway in tests, Unit V, returns declines, timeouts and outages on demand, so every failure path in checkout can be exercised without touching the real provider.

## 23. Rate limits, quotas and pagination

Providers limit their callers. Wren's payment provider allows 100 requests per second per account. Exceeding it returns 429, and repeated violations can get an account throttled harder. Wren's 20 instances share that single limit, so each instance enforcing its own share, 5 per second, would waste capacity whenever traffic was uneven, and enforcing nothing would trip the provider's limit during every peak.

Wren runs a **client-side rate limiter** shared across the fleet, a token bucket in Redis, Part III, set slightly under the provider's limit, 95 per second with a burst of 20, so that clock differences and in-flight requests do not push it over. Calls that cannot get a token wait briefly within their deadline or fail fast as `Unavailable`. The adapter also reads the provider's rate-limit headers, such as `X-RateLimit-Remaining` and `X-RateLimit-Reset`, and slows down when remaining capacity runs low, and it honours `Retry-After` on every 429.

@fig be_tp_ratelimit | One shared bucket set just under the provider's limit, adjusted by the provider's own headers.

**Quotas** are limits over longer periods, 100,000 SMS messages a month or 1,000,000 geocoding calls a day. They are budgets as much as limits, since exceeding them costs money or stops service. Wren tracks usage against each quota in its own metrics, alerts at 70% and 90%, and caches results that can be cached, geocoded addresses for example, Unit VII, so the same lookup is not paid for twice.

Provider APIs paginate, and backfills and reconciliation jobs must page through them correctly. Most use cursors, Unit V, returning a `next_cursor` or `starting_after` id. A reconciliation job listing 50,000 payments at 100 per page makes 500 requests, which at 95 per second takes about 5 s if nothing else uses the budget. In practice batch jobs get a smaller share of the limiter, so user-facing calls always have tokens, and a backfill that needs hours runs slowly in the background rather than starving checkout.

Rate limits interact with retries. A retry after a 429 must wait at least the Retry-After time, and a burst of retries after a provider blip is exactly what trips limits. The retry budget from Part V and the shared limiter together keep Wren a well-behaved client, which matters, because providers can and do suspend clients that abuse their APIs.

## 24. Authentication, schema changes and outages

Providers authenticate callers in a few common ways. **API keys** sent in a header are simple and must be stored in a secret manager, rotated periodically, and scoped to the least access needed, Unit XIII. **OAuth client credentials** give Wren a short-lived access token in exchange for its client id and secret. Wren's maps provider issues tokens valid for 3,600 s.

Token handling has its own small set of rules. Cache the token, rather than fetching a new one per request, which would multiply calls to the provider's token endpoint by Wren's whole request rate. Refresh it early, at 80% of its lifetime, 2,880 s, so it never expires mid-request. Refresh once per process, with request coalescing from Unit VII, so a hundred concurrent requests that notice expiry trigger one refresh, not a hundred. And if a call returns 401, refresh once and retry once, since the token may have been revoked early.

@fig be_tp_token | Refresh at 80% of the token's life, once per process, with a single retry on 401.

Providers change their APIs, and not always on schedule. A **tolerant reader**, a term Martin Fowler popularized, takes only the fields it needs and ignores everything else, so new fields never break it. Unknown enum values, such as a new payment status, map to an explicit "unknown" that is logged and alerted, never to a crash or a silent default. Wren pins the provider's API version where the provider supports it, Stripe's dated versions are an example, and upgrades deliberately, running contract tests against recorded provider responses, Unit V, to catch differences before production does.

@fig be_tp_schema | Take the fields you need, ignore the rest, and alert on values you do not recognise.

Finally, providers go down. Every integration needs a written answer to "what happens when this provider is unavailable for an hour?" For SMS and email, Wren keeps a second provider and fails over automatically when the breaker on the first stays open. For maps, it shows cached tiles and typical delivery times. For payments, a second provider is possible but complex, so the answer is to hold orders and confirm later, as Part VI described, and show users an honest message. In no case does a non-critical provider's outage block placing an order.

@fig be_tp_outage | Provider A is down. SMS fails over to provider B, and payments are held to confirm later.

Watching the provider's status page and incident feeds helps operators know whether a problem is theirs or Wren's, and synthetic checks that call each provider's sandbox every minute often notice an outage before the status page admits it.

:::story Picture this
A restaurant that buys from several suppliers. The chef does not let each supplier's paperwork into the kitchen. A purchasing clerk turns every delivery note into the kitchen's own stock list, knows each supplier's order limits and opening hours, keeps a backup supplier for vegetables, and when the fish supplier fails to turn up, changes the specials board rather than closing the restaurant.
:::

:::note Sandbox and production differ
Provider sandboxes often have different limits, latencies and behaviours from production. Wren's load tests never target a provider's production API, use sandboxes or fakes that reproduce production's documented limits and latencies, and treat the first days after an integration launches as a period of close monitoring.
:::

:::warn Watch out
Logging full provider requests and responses for debugging can write card details, personal data or secrets to logs. Log provider request ids, status codes and Wren's own identifiers, and redact everything else, Unit XIV.
:::

:::interview Interview lens
**"How do you integrate an unreliable third-party API?"** Put it behind an interface you own that maps its responses to your types, and put every protection in that adapter, a deadline, connect and overall timeouts, retries for retryable errors within a budget, a circuit breaker, a bulkhead, idempotency keys and a shared client-side rate limiter set just under the provider's limit. Cache tokens and refresh them early and once, read defensively and pin API versions, monitor quotas, and decide for each provider what happens during an outage, a second provider, cached data, or holding work to complete later.
:::

:::key In one breath
Each provider sits behind an interface Wren owns, an anti-corruption layer that maps responses to `Charged`, `Declined` or `Unavailable` and holds the deadline, timeouts, retries, breaker, bulkhead and idempotency keys in one place. A fleet-wide token bucket at 95 per second keeps 20 instances under a 100 per second provider limit, quotas are tracked and alerted, and backfills page slowly so user traffic keeps its tokens. OAuth tokens are cached and refreshed once at 80% of their 3,600 s life, tolerant readers survive schema changes, and every provider has a written outage plan.
:::

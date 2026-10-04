@part I | Rate limiting requirements | We decide whose requests count, what they cost, and which interval matters. A limit described only as requests per minute leaves several different algorithms possible. We will define Heron's user policy, distinguish rate from concurrency, and choose the enforcement boundary. | where:1

## 1. A hundred requests per user per minute
A viewer reloads a score repeatedly while another viewer sends an automated scraper. Heron wants to limit each authenticated user to 100 requests per minute, but the phrase alone does not say whether a burst is allowed or how the minute moves. A **rate limit** is an admission rule that restricts work over time for a named identity or resource.

Make the contract explicit. Does the limit mean at most 100 accepted operations in every trailing 60 seconds? Does it mean 100 in each wall-clock bucket? Or does it mean a sustained refill rate with room for a burst? These policies answer the same words differently at interval boundaries. The rest of the chapter builds each policy rather than hiding that choice.

The illustrative sustained rate is 100 divided by 60, or 1.666666 recurring requests per second. It is an average replenishment rate; it does not imply fractional requests can be admitted. Algorithms can keep fractional accounting internally while each ordinary request costs one full unit.

@fig sd_rate_limiting_contract | Illustrative Heron policy alternatives. Select the intended admission guarantee before the algorithm.

:::story Picture this
A car park can issue a fresh set of passes at the start of each hour, or require that no more than the allowed number entered in the preceding hour. Those rules behave differently near the clock boundary. The sign must say which rule applies.
:::
## 2. The identity comes from a trusted boundary
A request claims to come from user `u7`. If the limiter trusts an arbitrary request header, the client can change that value and gain a new allowance. A **limiting identity** is the validated subject whose work the policy counts. Authentication or a trusted gateway must establish it before a user-scoped rule can be meaningful.

For Heron, scope a key by tenant, authenticated user, operation class, and policy version where those dimensions matter. An IP-address rule can protect a pre-authentication endpoint, but many people may share an address and attackers may distribute requests across addresses. It is a coarse abuse control, not a perfect user identity.

@fig sd_rate_limiting_identity | Identity construction. A user-supplied field cannot mint its own fresh trusted allowance.

Validate the length and allowed shape of key dimensions. Otherwise an attacker can create unbounded state even when every new key admits little work. Expiration helps reclaim inactive state, but it does not prevent a fast cardinality attack. Bound anonymous identities and separate their policy from authenticated users.

:::note Tenant and user rules
A user rule limits one account, while a tenant rule limits aggregate work for an organization. Both may apply to the same request. Explain whether every required rule must pass and whether rejected requests consume any of their budgets.
:::
## 3. Rate, concurrency, and quota are different
A user makes few requests, but each launches a long clip conversion. A rate policy can admit that user while the conversions fill every worker. A **concurrency limit** bounds work currently in flight. A **quota** bounds a cumulative allocation over a stated accounting period or resource total.

These controls can coexist. Heron admits API calls by a user rate policy, bounds active conversions separately, and may cap retained upload bytes. A successful rate decision does not establish that a downstream worker is available. Perform admission near the resource it protects as well as at the external policy boundary.

@fig sd_rate_limiting_dimensions | Three distinct accounting rules. They can apply to one request without being interchangeable.

At Heron's illustrative peak, 1,000 requests per second each mean 0.2 seconds of work imply 200 mean requests in flight. A user policy of 100 per minute cannot establish that fleet-wide concurrency fits the available pool. The performance and reliability units explain how waiting can increase that pool demand even when rates do not change.

:::warn Watch out
A count of requests treats cheap cached reads and expensive conversions alike unless the policy says otherwise. Measure or assign the protected resource cost instead of assuming every admitted request is equally expensive.
:::
## 4. Where enforcement belongs
The database should not spend its expensive query work discovering that the caller exceeded a cheap gateway rule. Put early coarse protection before costly parsing or downstream calls, then perform trusted user admission after authentication. Protect internal resources with their own bounded concurrency and workload rules.

The gateway needs a prompt outcome from the limiter. Under an illustrative 3-millisecond limiter round trip and 1,000 requests per second, the mean limiter calls in flight are 3. That is an arithmetic workload relation, not a Redis benchmark. Serialization, network tail delay, and hot keys can dominate real behavior.

@fig sd_rate_limiting_boundary | Enforcement path. Internal capacity controls can still reject admitted work when a protected resource is full.

If the limiter is unavailable, the decision is part of the service contract. Public score reads may use a bounded local fallback. Sensitive write operations may reject when their required shared admission state cannot be checked. Neither choice should occur accidentally because a timeout handler forgot to return a result.

:::interview Interview lens
**"How would you design 100 requests per user per minute?"** I first clarify whether the requirement is a strict trailing-window limit or a burst-capable sustained rate. I validate user identity, define which attempts count, and pick a shared atomic enforcement boundary. Then I explain races, state cost, rejection behavior, and the failure policy before drawing replicas.
:::
:::key In one breath
An admission policy needs a trusted identity, a counted cost, an interval rule, and a rejection contract. Rate, concurrency, and quota count different resources. Enforcement should reject work before its expensive effect while respecting authentication. The algorithm must implement the chosen minute semantics rather than silently choosing them.
:::

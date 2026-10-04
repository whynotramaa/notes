@part III | Load balancing algorithms | Equal assignment does not guarantee equal work. A destination with fewer sockets may still have the largest request backlog. We will compute round robin and weighted shares, compare connection and request signals, and select between sampled destinations. | where:3

## 9. Round robin

Six Heron requests have illustrative costs of 10, 100, 10, 10, 100 and 10 milliseconds. Assigning them cyclically to A, B and C gives each server two requests. B nevertheless receives all the expensive work.

**Round robin** chooses successive eligible endpoints in a repeating order. For identical servers and similar independent request costs, it spreads assignment without collecting a load measurement. In the example the order is A, B, C, A, B, C. A receives $10+10=20$ milliseconds of service, B receives $100+100=200$, and C receives $10+10=20$. Read each sum as the service demand assigned to that endpoint, not elapsed wall time if requests run concurrently.

@fig sd_tr_rr | Illustrative cyclic assignment gives two requests to each endpoint but gives B ten times A's service demand. Orange marks B's expensive pair.

The algorithm needs an eligible endpoint list and a current position. Endpoint removal changes the cycle, while several proxies may maintain independent positions. A synchronized starting position can briefly favor one server after all proxies restart. Randomized starts or smooth distribution can reduce that concentration, but the policy still cannot see expensive work it has not measured.

For Heron's five identical 300-request-per-second servers, a long-run equal share of the 1,000-per-second peak is 200 each. The apparent spare room is useful only if the workload that established the 300 limit resembles the assigned workload. A stream of unusually expensive searches can exhaust CPU before request count reaches that limit.

Round robin is a useful baseline because it has little state and predictable assignment. Rejecting it merely because another algorithm sounds more advanced is no better than assuming it solves all skew. Measure the request cost distribution, endpoint differences and failure capacity first. [NGINX documents round robin](https://nginx.org/en/docs/http/load_balancing.html) alongside weighted and connection-aware alternatives.

:::story Picture this
Three checkout lanes receive customers in a repeating order. Each lane gets two shoppers, but one receives both shoppers with full trolleys while the others receive baskets. The allocation counted shoppers, while the work depends on items and checkout time. Counting fairly is useful only when the counted unit resembles the work.
:::

## 10. Weighted routing and canary traffic

One Heron endpoint has more usable compute than its peers. An equal share would underuse it. **Weighted routing** assigns a relative preference to each destination so its long-run share follows that weight within the chosen eligible set.

For weights 1, 2 and 1, total weight is $1+2+1=4$. Endpoint shares are $1/4$, $2/4$ and $1/4$. At 1,000 requests per second, the expected assignments are 250, 500 and 250. Read each share as endpoint weight divided by the sum of eligible weights. The second endpoint must actually support the larger share; putting weight 2 on a 300-per-second endpoint would overload it at this peak.

@fig sd_tr_weight | Illustrative weights 1, 2 and 1 assign 250, 500 and 250 requests per second. Orange marks the larger destination share, which requires matching capacity.

Canary deployment uses the same arithmetic for version groups rather than individual machines. A 5-percent candidate share gives an expected 50 requests per second and leaves 950 for the established version. The candidate pool must support that demand, and its error measurement needs enough observations before making a decision. A weight does not guarantee that one particular request or user sees a particular version.

@fig sd_tr_canary | Illustrative request-weighted rollout at Heron's peak. Orange marks the 50-per-second candidate share; the remaining 950 use the established version.

The sampling boundary matters. Per-user assignment gives a consistent experience but uneven request rates when users differ in activity. Per-request assignment distributes more finely but may send one session to incompatible versions. A release plan chooses the boundary from compatibility and experiment needs, then measures the actual traffic fraction.

Health removal also changes the denominator. When a weighted destination disappears, remaining endpoints absorb its share unless admission falls. The policy must recompute eligible weights and check survivor capacity. A successful route update says nothing about whether the remaining fleet can serve the resulting demand.

:::note A weight is relative
A weight is not an absolute request limit. The same endpoint can receive a larger share when its peers disappear. Use admission or a concurrency limit when the requirement is a hard capacity boundary.
:::

## 11. Least connections

Gateway A holds 100 viewer sockets and B holds 10. If retaining those sockets dominates memory use and their expected lifetimes are similar, B is the sensible destination for a new one. **Least connections** selects an eligible endpoint with the smallest relevant connection count, sometimes normalized by weight.

A proxy updates the count when it establishes and releases an upstream connection. It must define whether idle pooled sockets count, because idle reuse can otherwise distort the signal. A transport balancer may instead count tracked client flows. The implementation's counted connection is part of the mechanism, not an incidental metric label.

In the earlier multiplexed example, A has 5 active requests and B has 200. A least-connections decision still selects B because $10<100$. Read that comparison as a socket comparison only. If request processing is the scarce resource, it sends work toward the more loaded endpoint. If retained idle sockets are the scarce resource, it may be exactly the right choice.

@fig sd_tr_least_conn | Illustrative socket counts select B. Orange marks the least-connections choice; the active-request column shows why it may disagree with useful work.

The policy also sees only its available observations. Multiple independent balancers can each think an endpoint is underused while all choose it at once. Shared telemetry helps only if its freshness and scope match the decision. A local connection count is not necessarily the fleet's total count.

Least connections fits long, unevenly lasting connections better than an assignment counter does. It is less reliable when expensive and cheap requests share connections or when idle pools dominate the count. Ask what grows while a server becomes slow, then choose a signal that grows with it. The next section uses outstanding requests for an API workload.

:::warn Watch out
Do not choose a balancing policy by its name alone. Least connections measures transport ownership. It cannot prove which endpoint has the smallest CPU demand, database wait or application backlog.
:::

## 12. Least outstanding requests

Heron's score endpoint becomes slow while keeping every connection open. New requests keep landing there under a connection policy. Counting unfinished requests exposes the work that remains rather than only the sockets carrying it.

**Least outstanding requests** chooses an eligible endpoint with the smallest number of accepted but incomplete requests under its measurement scope. A proxy increments the count on assignment and decrements it when the response or failure completes. It must also release the count when a deadline expires, or abandoned work corrupts future selection.

With A at 5 outstanding requests and B at 200, the next request selects A because $5<200$. This reverses the least-connections decision from Section 11. If A and B have equal effective capacity, the count is a useful pressure signal. If their capacities differ, normalize or combine it with weights rather than pretending every endpoint can carry equal work.

@fig sd_tr_least_req | The same illustrative endpoints now select A by unfinished requests. Orange marks the smaller request backlog rather than the smaller socket count.

A count still assigns the same nominal cost to a score read and an upload. A request stuck on one dependency may occupy little CPU but a scarce database connection. The signal can protect concurrency while missing the real throughput ceiling. Route-specific pools or cost-aware admission can isolate those differences without forcing the balancer to predict every request's service time.

Choosing the absolute minimum among all endpoints requires a current view of their counts. With many independent routers, a shared minimum can also cause everyone to select the same endpoint before the measurement changes. A sampled policy reduces that synchronized choice, which is the subject of Section 13. [Envoy's load-balancer reference](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers) describes a concrete least-request implementation; distinguish its algorithm from the general policy family.

## 13. Power of two choices and slow start

A router observes loads 8, 3, 6, 2 and 9 on five equal endpoints. Scanning all five finds the minimum of 2, but a stale shared minimum may attract a crowd of routers. A small randomized comparison spreads their decisions.

**Power of two choices** samples two eligible destinations and selects the less loaded one according to a defined signal. In our illustrative sample, endpoints B and E have outstanding counts 3 and 9, so B wins. The choice does not find the global minimum, which is D at 2. Its job is to avoid blindly selecting a busy endpoint without requiring a full fresh scan for every decision.

@fig sd_tr_p2 | Illustrative sampled endpoints B and E carry 3 and 9 unfinished requests. Orange marks B; D's global minimum was not sampled.

The mechanism needs independent sampling and comparable load measurements. Correlated randomness or inconsistent health lists can reduce the benefit. It also cannot recover capacity when all sampled destinations are overloaded; admission and failure handling remain necessary. [Envoy's least-request policy](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers) documents this sampled choice for equal-weight endpoints.

A newly started endpoint creates another problem. It reports zero work before its caches, runtime and connection pools are warm. **Slow start** gradually increases its eligible share instead of immediately giving it a full assignment. Under an illustrative linear 20-second ramp, at 5 seconds its weight is $5/20=0.25$ of its final weight. Read this as elapsed ramp time divided by ramp duration, capped at the full share.

@fig sd_tr_slowstart | Illustrative linear ramp. Orange marks a quarter of final weight after 5 of 20 seconds; health readiness and gradual admission solve different problems.

The ramp is a policy, not evidence of readiness. An endpoint must first satisfy the ability-to-serve contract. If dependency warmup never completes, elapsed time should not make it healthy by itself. Keep startup readiness and assignment ramp as separate decisions.

:::interview Interview lens
**"Why use two random choices instead of the least busy server?"** It reduces the measurement and selection work while avoiding many busy destinations. Independent routers also avoid always targeting one shared apparent minimum. I still define the load signal, health filtering and capacity limit because sampling cannot fix a fleet with insufficient usable capacity.
:::

:::key In one breath
Round robin balances assignment counts, while weights adjust expected shares for unequal destinations or release groups. Connection and outstanding-request policies measure different resources. Two-choice sampling compares a small random set instead of a full fleet, and slow start limits a new endpoint's initial share. Every policy still needs eligibility, workload interpretation and survivor capacity.
:::

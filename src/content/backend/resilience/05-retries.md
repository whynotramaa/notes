@part V | Retries | We decide when to try again and how to keep retries from making a bad situation worse. A retry turns a transient blip into a success, and a careless retry policy turns a dependency's bad minute into an outage. We will cover retryable errors and retry amplification, retry budgets, and hedging and honouring Retry-After. | where:5

## 13. What to retry, and how retries multiply

Many failures are transient. A connection is reset, a server is restarting, a load balancer drops a request during a deploy, a provider returns 503 for a second. Trying again a moment later succeeds. Unit VIII introduced retries for background jobs, and the same rules apply to synchronous calls, with the extra constraint that a user is waiting.

The first rule is to retry only what can succeed and only what is safe. **Retryable errors** are those that say nothing about the request itself. Connection refused or reset, DNS failures, 429 with Retry-After, 502, 503 and 504. **Non-retryable errors** describe the request, 400 bad request, 401 and 403, 404, 409 conflict and 422 validation errors, and will fail the same way every time. Timeouts are retryable only if the operation is idempotent or carries an idempotency key, Unit V, because the first attempt may have succeeded.

@fig be_retry_classes | Two bins. Retry the left with backoff. Fail, log and perhaps dead-letter the right.

The second rule is about layers. Suppose a user's checkout passes through the gateway, the order service and the payment service, and each layer retries failed calls up to 3 times, 4 attempts in all. One user click becomes up to 4 attempts at the gateway, each causing up to 4 at the order service, each causing up to 4 at the payment service, so 4 × 4 × 4 = 64 calls reach the payment provider. When the provider is struggling, that is exactly the load it does not need. This is **retry amplification**, and in deep call chains it turns a partial outage into a total one.

@fig be_retry_amplify | Four attempts at each of three layers. One click, 64 calls at the bottom.

The fix is to retry at one layer only, usually the one closest to the user or the one with the most context, and have lower layers fail fast. A service that has already retried can signal downstream not to retry again, and some systems pass a header or gRPC metadata to say so. Google's SRE book recommends a similar rule, that a backend which is overloaded returns an error that tells callers not to retry, rather than letting every layer try again.

Retries also need backoff and jitter, Unit VIII's full jitter, so that many clients that failed together do not retry together. For synchronous calls the waits are short, tens to hundreds of milliseconds, and the total must fit the remaining deadline from Part IV.

## 14. Retry budgets

Even at a single layer, retries add load in proportion to the failure rate. If the payment service fails 10% of calls and the client retries each failure up to 3 times, traffic rises by up to 30%. If the service fails completely, every call makes 4 attempts and traffic quadruples. The worse the dependency is doing, the harder its clients push, a positive feedback loop that can keep a recovering service down.

A **retry budget** caps retries as a fraction of normal traffic. Wren allows retries to add at most 10% to its successful calls. At 1,000 calls per second, at most 100 retries per second are allowed whatever the failure rate. When failures are rare, every failure gets its retries. When the dependency is down, almost no calls are retried, and the dependency sees close to its normal load instead of four times it.

@fig be_retry_budget | Unlimited retries quadruple the load when the dependency fails. A 10% budget caps it at 1,100 per second.

The usual implementation is a token bucket, the algorithm from Part II used in a new place. Each successful call adds 0.1 token, each retry spends 1, and retries are allowed only while tokens remain. gRPC's retry policy includes exactly this as **retry throttling**, with `maxTokens` and `tokenRatio` settings. Twitter's Finagle library popularized retry budgets for RPC clients, and Envoy and Linkerd offer them for service meshes, Unit XI.

Budgets are per client, per dependency. A client calling the payment provider and the email provider keeps separate budgets, so a failing email provider does not stop payment retries. And budgets work with circuit breakers, Part VI. The breaker stops all calls when a dependency is clearly down, and the budget limits retries in the grey zone where it is partly working.

Retries also deserve visibility. Wren counts attempts per call and alerts when the retry rate passes a few percent, because a dependency that needs many retries to succeed is unhealthy even if users see no errors, and the extra latency of each retry is visible in the p99.

## 15. Hedging and honouring Retry-After

Retries react to failure. **Hedged requests** react to slowness. Google's paper "The Tail at Scale" by Jeffrey Dean and Luiz André Barroso in 2013 described sending a second copy of a request to another replica if the first has not answered within some time, typically the 95th percentile latency, and using whichever answer arrives first. Wren's menu reads go to one of several replicas. With a p95 of 40 ms, a request still waiting at 40 ms gets a hedge to a second replica, which answers in 25 ms, so the user waits 65 ms instead of the slow replica's 260 ms.

@fig be_retry_hedge | No answer at the p95, so a second replica is asked. The first answer wins.

Hedging trades a little extra load for a much shorter tail. Since only requests slower than the p95 are hedged, it adds about 5% more requests. It is only safe for idempotent operations, reads and anything carrying an idempotency key, and the losing request should be cancelled to free its resources. Hedging also needs the same restraint as retries. When the whole service is slow, hedging every request doubles its load, so hedges should come from a budget too.

The other half of good retry behaviour is listening. A 429 or 503 with a Retry-After header tells the client exactly when to try again. A well-behaved client waits at least that long, plus jitter, before retrying, rather than applying its own shorter backoff. Wren's clients for third-party APIs read Retry-After and the provider's rate-limit headers, Part VIII, and its own API sends them, so clients that listen are spared needless refusals and the service is spared needless load.

The overall picture of a well-behaved synchronous call is short. It has a deadline, a connect and per-attempt timeout, at most a couple of retries for retryable errors with jittered backoff within the deadline, a retry budget, an idempotency key for anything that changes state, and respect for Retry-After. The next part adds the breaker that decides when not to call at all.

:::story Picture this
A crowd outside a shop that has just closed its doors for five minutes. If everyone knocks every two seconds, the staff cannot even reach the door to open it. If each person waits a random minute or two, and most give up and come back tomorrow, the shop reopens to a calm queue. A retry budget is the rule that only a few people may knock at all.
:::

:::note Idempotency and retries
Retries and idempotency keys come as a pair. Every state-changing call that may be retried carries a key generated once per logical operation, `pay-124-1` for the first payment attempt on order 124, so the provider recognises a retry and returns the original result. Without the key, a retry after a timeout risks a double charge.
:::

:::warn Watch out
Retrying inside a loop that also has a load balancer, a client library and a service mesh, each with their own retry settings, multiplies attempts invisibly. Audit every layer's retry configuration together, and disable retries in all but one.
:::

:::interview Interview lens
**"How do you design retries so they help rather than hurt?"** Retry only retryable errors, connection failures, 429, 502, 503, 504, and timeouts only for idempotent or keyed operations. Retry at one layer, with few attempts, exponential backoff with full jitter, all within the request's deadline. Cap retries with a budget, such as 10% of successful traffic, so a failing dependency is not hit with several times its load. Honour Retry-After, add a circuit breaker for outright outages, and consider hedging idempotent reads at the p95.
:::

:::key In one breath
Retry connection failures, 429, 502, 503 and 504, and timeouts only for idempotent or keyed calls, never 4xx errors that describe the request. Three layers each making up to 4 attempts turn one click into 64 calls, so retry at one layer with jittered backoff inside the deadline. A retry budget, a token bucket where successes earn 0.1 token and retries spend 1, caps extra load at 10%, 1,100 calls per second instead of 4,000 when the dependency fails. Hedged requests at the p95 shorten the tail for about 5% extra load, and clients must honour Retry-After.
:::

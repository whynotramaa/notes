@part V | Timeouts, retries and backoff | We stop a failed call from consuming unlimited time. Retrying without a budget can magnify the original failure. We will build deadlines, backoff, and duplicate-safe operations. | where:5

## 21. A timeout bounds a particular wait

A score read stalls while acquiring a database connection. A caller needs to stop waiting after the result is no longer useful. A **timeout** gives a bound to a named wait, such as connecting, acquiring a pool slot, writing bytes, or reading a response. The name of the wait is part of the meaning; a socket read timeout does not necessarily bound the whole operation.

Consider a client that receives a tiny response fragment before each read timeout expires. Each read can remain within its limit while the complete response takes far too long. Likewise, a call can spend separate full timeout budgets connecting, acquiring, executing, and retrying. A set of individually bounded waits can still exceed the user-visible budget.

@fig sd_networking_timeout_scopes | Different timeout scopes protect different waits. A total operation boundary must cover the complete path.

### Cancellation is another message

When a caller stops waiting, it can ask downstream work to cancel. The downstream process might observe that request before executing, during a cancellable operation, after committing, or never. A timeout is an observation made by the caller, not a distributed rollback.

Heron must return a useful uncertainty contract for a command whose outcome is unknown. The client can retrieve status or retry using the same operation key. Treating timeout as guaranteed failure can repeat an effect that already committed. Treating it as success can hide an effect that never began.

## 22. A deadline bounds the whole operation

A viewer has an overall 500 ms illustrative budget. A **deadline** names the latest time by which the complete operation should finish. Each downstream call receives the remaining useful budget, accounting for time already spent and time reserved to return a response. The deadline prevents every nested call from restarting the original clock.

Assume 40 ms for network transit and 60 ms reserved for returning the final result. The application starts with $500-40-60=400$ ms of useful work budget. If admission and authentication consume 120 ms, the remaining useful budget is 280 ms. The database call should not receive a fresh 400 ms just because it starts later.

@fig sd_networking_deadline_trace | Illustrative useful-budget propagation. Consumed time subtracts from the same original budget.

$$B_{\text{child}}=\max\left(0,B_{\text{parent}}-t_{\text{spent}}-t_{\text{reserve}}\right)$$

Read this as: child budget $B_{\text{child}}$ is the nonnegative parent budget after elapsed work $t_{\text{spent}}$ and reserved completion time $t_{\text{reserve}}$ are subtracted. All terms use the same time unit. Reserve time once at the appropriate boundary; repeatedly subtracting the same reservation at every hop can unnecessarily exhaust the request.

Use monotonic elapsed-time measurement within a process, rather than trusting a wall clock that can jump. Cross-process deadline propagation also needs a contract for clock uncertainty or remaining duration. The protocol or framework can help carry it, but the service must still respect it when scheduling work.

:::story Picture this
You have a train to catch. Every errand receives the time left before departure, not the time you had when you left home. An errand that starts late does not earn a new train departure time.
:::

## 23. Retrying begins with a failure classification

A database node becomes temporarily unreachable. A repeat attempt against a suitable available owner may succeed. But an invalid match identifier or a forbidden scorer does not become valid after waiting. A **retry** repeats an attempt after a failure or uncertain result; the policy must distinguish transient failure, permanent rejection, and unknown completion.

Retrying a read can still create harmful load. Retrying a write also creates correctness risk unless its intended effect is safe to repeat. Heron checks operation identity before applying a repeated command. The retry preserves that key and the intended payload, instead of generating a fresh command each time the connection fails.

@fig sd_networking_retry_classes | The next action depends on the failure class. Uncertain completion requires operation identity, not a new command.

### Limits belong in the policy

Choose a maximum attempt count, a total time budget, and a budget for additional load. A **retry budget** limits repeated work so failure cannot consume all capacity needed for first attempts. A service near overload may need fewer retries, not more, because another attempt has a low chance of completing and a high chance of extending the queue.

Some responses give an explicit retry delay or indicate a transient overload contract. Respect that advice within the client's deadline. Do not retry every status or exception by default. Explain which failure could have changed between attempts and how that change makes another attempt useful.

:::warn Watch out
A retry that creates a new idempotency key is a new business operation. It does not recover the uncertain original operation. Preserve the original identity across transport and process retries.
:::

## 24. Exponential backoff slows repeated demand

A dependency takes time to recover. Immediate retries consume its remaining capacity before it can catch up. **Exponential backoff** increases the delay after successive failed attempts, usually to a cap. The idea is to give the dependency more recovery time without choosing one large fixed delay for every brief failure.

Use an illustrative base of 100 ms and cap of 800 ms. Attempt indices 0, 1, 2, 3, and 4 produce delay ceilings of 100, 200, 400, 800, and 800 ms. The cap stops the ceiling growing, but it does not cap the total operation duration. A separate attempt limit and deadline still determine when the caller stops.

@fig sd_networking_backoff_steps | Illustrative base and capped ceilings in milliseconds. These are calculated examples, not recommended production settings.

### Jitter separates synchronized callers

**Jitter** randomizes delay so callers that fail together do not all retry together. Full jitter samples between zero and the current capped ceiling. With the example ceilings, expected delays are 50, 100, 200, 400, and 400 ms under a uniform distribution. An individual attempt can wait less or more than that mean.

$$d_k\sim U\left(0,\min(c,b2^k)\right)$$

Read this as: attempt index $k$ waits a random duration $d_k$ uniformly between zero and the smaller of cap $c$ and base $b$ doubled $k$ times. The distribution describes the sampling rule, not a deterministic delay. A large fleet spreads attempts across the interval rather than producing one spike at its right edge.

Jitter does not make the duplicated work disappear. Some attempts can occur soon after a failure, so source admission still matters. Backoff is a timing tool within a bounded policy, not a replacement for capacity control or safe effects.

## 25. Nested retries multiply leaf attempts

The client, gateway, service, and database driver can each believe it owns recovery. A driver failure then causes its caller to repeat a whole operation that includes more driver retries. Attempt counts multiply because each retry at one level can create a fresh set of attempts below it.

Use an illustrative three layers with at most three attempts at each. One original request can create three gateway attempts, nine service attempts, and twenty-seven database attempts. At Heron's 1,000 original requests per second, the theoretical leaf-attempt rate is 27,000 per second if all paths exhaust their budgets. The original useful workload was still only 1,000 requests per second.

@fig sd_retry_amplification | Illustrative worst-case nested attempt counts. Actual work also depends on deadlines and early successes.

### Put recovery at an informed boundary

Choose one layer that knows the operation's identity, failure classes, remaining budget, and suitable target. Other layers can provide transport behavior within that policy instead of independently restarting the business action. A low-level retransmission of missing transport bytes is different from retrying an entire score command.

During a recovering dependency outage, limit new work as well as retries. Otherwise a retry budget can be bounded while fresh arrivals still overwhelm the service. Observe useful completions, duplicate attempts, queue age, and deadline expiry together.

:::interview Interview lens
**"Why did retries turn a small outage into a larger one?"** Repeated work raised demand while the dependency's capacity was already reduced. Nested attempt limits can multiply, and synchronized timing can create bursts. I would establish one informed retry owner, bound added load, propagate deadlines, and add jitter for suitable transient retries.
:::

:::key In one breath
Timeouts bound particular waits and deadlines bound complete operations. Cancellation does not prove that a remote effect stopped. Retry only a failure that may usefully change, while preserving operation identity and bounding additional work. Backoff and jitter spread attempts, but nested retries can still multiply the dependency load.
:::

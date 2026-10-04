@part II | Fixed window counter | We count requests inside explicit clock buckets. The simple state makes this algorithm cheap, but resetting a counter can admit a boundary burst. We will trace bucket selection, rejected attempts, reset behavior, and atomic expiration. | where:2

## 5. Fixed-window buckets
A request arrives just before the minute changes. A **fixed window** places time into nonoverlapping intervals and counts work in the selected interval. Each identity has a counter for a bucket rather than a history of all recent arrivals.

$$w(t)=\left\lfloor t/T\right\rfloor.$$
Read this as bucket identity $w$ is time $t$ divided by window length $T$, rounded down. With a 60-second window, time 60 selects bucket 1 when the illustrative epoch begins at zero. Bucket identifiers are accounting coordinates, not local calendar labels.

The limiter derives the subject key and bucket, atomically increments or conditionally admits against that bucket, then sets cleanup past the bucket's useful lifetime. Every gateway that checks the same rule must choose compatible time and key conventions. A per-process counter is not a shared user limit.

@fig sd_rate_limiting_fixed | Illustrative epoch and 60-second windows. The reset is the algorithm's stated semantics.

:::story Picture this
An office resets its visitor tally when the clock reaches the next hour. The tally needs one number, but arrivals on opposite sides of that clock tick belong to different pages. The pages do not remember how close those arrivals were.
:::
## 6. The boundary burst
Suppose the user sends 100 accepted requests at illustrative time 59.9 seconds and another 100 at 60.1. Each bucket obeys its own limit, yet 200 requests occur inside a 0.2-second span. Dividing 200 by 0.2 gives a 1,000-request-per-second average over that small span.

This does not violate the fixed-window contract. It violates a different contract that promised at most 100 in every trailing minute. The distinction matters when a downstream system cannot absorb the permitted boundary burst. A separate burst or concurrency control can protect it, or the policy can choose a moving-window algorithm.

@fig sd_rate_limiting_boundaryburst | Illustrative arrival times. Both fixed buckets obey 100, while a trailing-window rule would reject part of the second burst.

Different users can synchronize near a reset even without coordinated abuse. A client that displays the reset clock encourages this pattern. Jittering client retries can spread demand, but it does not change the policy's admitted upper bound. State the burst tolerance in the service design.

:::warn Watch out
Saying fixed windows are incorrect misses the real issue. They implement a specific contract cheaply. They are the wrong choice when the required contract is a strict moving interval.
:::
## 7. What counts when admission fails?
The fixed counter is 100. The next request is rejected. Should it leave the counter at 100 or increment it to 101? An increment-first policy counts attempts and allows only values up to the limit; a conditional admission policy can count accepted work only. Both are possible, but their exposed remaining allowance differs.

For Heron, write that choice into the policy. If every attempted request consumes state, the counter may grow while the service keeps rejecting. If only accepted work counts, the atomic operation reads the count, checks the remaining allowance, and increments only on success. Malformed or unauthorized requests may need separate abuse accounting.

@fig sd_rate_limiting_countsemantics | Two valid accounting contracts. A retry and an invalid request need explicit treatment under either policy.

Do not refund work merely because the application returns an error after consuming resources. Refunding can let expensive failing requests repeat without cost. A reservation-and-reconciliation design is possible for variable-cost work, but it needs operation identities and atomic correction rules to avoid negative or duplicated accounting.

:::note Business success is separate
A request can be admitted, consume CPU and database work, then receive an expected business rejection. Rate accounting can charge that work even though it did not create a record. Explain this separately from the availability success definition.
:::
## 8. Atomic increment and expiration
A gateway increments a new counter, then crashes before setting its expiration. The key may remain indefinitely. Atomicity of an individual `INCR` does not make an entire increment-and-expire procedure atomic. [Redis's counter documentation](https://redis.io/docs/latest/commands/incr/) describes this cleanup race.

Combine the necessary state change and expiration decision inside one script or an appropriate atomic transaction. For accepted-only counting, combine the read, comparison, increment, and expiration rule. Expire based on the bucket's remaining useful lifetime plus any deliberate cleanup margin rather than extending the policy interval on every request.

@fig sd_rate_limiting_expiry | Crash gap between separate commands. A script can apply the counter and cleanup rule in one serialized operation.

The script must remain bounded and validate its inputs before mutating state. An atomic script does not promise rollback of earlier mutations after every possible runtime error. Nor does it make asynchronous replicas current. The distributed parts return to these separate guarantees.

:::interview Interview lens
**"Why is INCR alone insufficient?"** It makes the increment atomic, but the admission comparison and expiration may still be separate steps. Accepted-only accounting needs a single serialized decision, and cleanup needs a crash-safe rule. Redis scripting solves local interleaving; replication and failover remain different questions.
:::
:::key In one breath
Fixed windows choose a bucket with $\lfloor t/T\rfloor$ and keep one counter per identity and bucket. They can admit adjacent-bucket bursts beyond a trailing-window limit. Decide whether the counter counts attempts or accepted cost. Atomically combine the decision, update, and expiration so concurrency and crashes do not change the policy.
:::

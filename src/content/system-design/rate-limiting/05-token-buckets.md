@part V | Token bucket | We separate a sustained replenishment rate from a permitted burst. A saved allowance lets a quiet user act quickly without granting unlimited long-term work. We will refill lazily, debit atomically, derive the burst bound, and handle weighted costs and clock changes. | where:5

## 17. Tokens represent spendable allowance
A viewer was idle, then opens several score pages together. A **token bucket** stores a bounded allowance that replenishes with time. Each admitted request spends tokens; capacity limits how much allowance an idle user can save.

The illustrative Heron bucket holds at most 100 tokens and refills at 100 divided by 60 tokens per second. A cost-one request requires at least one token. The algorithm can admit a short burst from saved allowance while enforcing a sustained refill rate across a long interval. Capacity and refill rate are different policy parameters.

$$b'=\min(B,b+r\Delta t).$$
Read this as available tokens $b'$ equal the smaller of bucket capacity $B$ and old balance $b$ plus refill rate $r$ times elapsed time $\Delta t$. A request of cost $c$ is admitted only if $b'\ge c$, then the new balance becomes $b'-c$.

@fig sd_rate_limiting_token | Lazy token-bucket update. The complete refill-and-debit procedure needs atomic ownership per subject.

:::story Picture this
A transit card gains credit over time but cannot hold more than a fixed balance. A quiet rider can spend saved credit on several trips together. Waiting longer after the balance is full does not create unlimited credit.
:::
## 18. The full intermediate token trace
Start with 100 tokens at illustrative time zero. A burst costing 80 leaves 20. After 6 seconds, refill adds 6 times 100 divided by 60, or 10 tokens, so the balance becomes 30. A request group costing 15 leaves 15.

An immediate group costing 20 cannot pass. It lacks 5 tokens, and refill rate is 100 divided by 60, so the minimum modeled wait is 5 divided by that rate, or 3 seconds. Concurrent spend can make the actual future decision different; the wait is advice rather than a reservation.

@fig sd_rate_limiting_tokentrace | Illustrative costs and times at a refill of 100/60 tokens per second. Every debit is serialized.

@fig sd_rate_limiting_tokenwait | Refill-only advice. Another request may spend the newly refilled allowance before this caller returns.

Do not set the balance negative in this policing variant. A virtual-time or debt variant can have different semantics, but it must bound debt and waiting. Name which construction you use before interpreting a negative stored number.

:::warn Watch out
A token bucket with capacity 100 and refill 100 per minute can admit more than 100 in a trailing minute. It implements sustained-rate plus burst semantics. Use a different algorithm for a strict moving-minute count.
:::
## 19. The burst-plus-rate bound
The bucket begins with at most $B$ tokens. During an interval of duration $\Delta t$, refill contributes at most $r\Delta t$ more. Therefore the admitted cost in that interval cannot exceed the initial saved allowance plus added allowance, under one correctly serialized bucket and its clock assumptions.

$$C(\Delta t)\le B+r\Delta t.$$
Read this as admitted cost $C$ over duration $\Delta t$ is at most capacity $B$ plus refill rate $r$ times the duration. For capacity 100 and 60 seconds at refill 100 divided by 60, the upper accounting bound is 200 tokens. Arrival placement and the endpoint convention affect whether the bound is reached exactly.

@fig sd_rate_limiting_tokenbound | Illustrative burst-plus-rate bound. It is different from an exact 100-admission trailing-window contract.

Refill under a cap can discard credit when the bucket is full, making actual admitted cost lower. This does not invalidate the bound. The proof also exposes the distributed failure risk: creating independent fresh buckets gives each replica its own $B$, and restoring a stale balance can recreate already-spent credit.

:::note Policing history
Token-bucket traffic models appear in the IETF's [Diffserv management model](https://www.rfc-editor.org/rfc/rfc3290). API limiting borrows the same separation between replenishment and burst capacity, while its identity, failure, and retry rules belong to the application.
:::
## 20. Weighted cost and time monotonicity
One cheap score read can cost one token while a conversion costs more. For an illustrative upload cost rule of one token per 100,000,000 bytes, a 5,000,000,000-byte upload costs 50 tokens. This is an assigned policy unit, not a claim that CPU cost scales exactly with byte size.

For costs 20, 30, and 50 with no refill, the total is 100 and exhausts the full bucket. Another cost-one request would bring the total to 101 and must be rejected. Validate that each cost is positive and within policy range. Negative or malformed cost must never create allowance.

@fig sd_rate_limiting_costs | Illustrative assigned costs. Resource-specific measurements should inform a production weighting rule.

Clock rollback must not add negative refill or move retained time backward. Use nonnegative elapsed time and retain a nondecreasing accounting timestamp. Across replicas, one authoritative time source or explicit skew bounds are needed. Process-local monotonic clocks are excellent for elapsed local waits but cannot be copied blindly as a shared epoch.

:::interview Interview lens
**"How does a token bucket handle a quiet user and a burst?"** The user saves allowance only up to capacity, then spends it quickly. Elapsed time replenishes at the configured rate, and an atomic refill-and-debit prevents double spending. I state its burst-plus-rate bound because it is not the same as a strict moving-window request count.
:::
:::key In one breath
A token bucket refills elapsed allowance, caps the balance, then spends a request's validated cost. Its bound is $B+r\Delta t$, which permits a burst beyond the sustained rate. Lazy refill needs no timer per user but does need a consistent clock and atomic state transition. Weighted cost, rejection advice, and stale recovered balances all belong to the guarantee.
:::

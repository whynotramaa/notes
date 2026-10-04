@part VIII | Case study: the complete limiter | We trace an authenticated request through accounting, rejection, recovery, and verification. The final design exposes the guarantee actually implemented and tests its hardest boundaries. We will reconcile state cost, capacity, abuse protection, and client behavior. | where:8

## 29. The accepted request
A trusted gateway authenticates the user, derives the policy key, and performs coarse endpoint validation before costly work. For the selected strict trailing-minute Heron policy, the Redis script removes expired accepted events, counts current history, and appends a unique admission only if the prospective count remains within 100.

The application then executes under its own deadline and resource limits. Rate admission does not reserve database capacity or establish command idempotency. A state-changing command retains its original effect identity independently of the admission identifier. The policy must say whether a replay recovering an old result consumes a new allowance.

@fig sd_rate_limiting_accepted | Admission trace. The self-contained script step is one local decision; operation execution has separate correctness rules.

Cleanup, counting, and appending are internal to the atomic limiter decision. The actual network exchange is gateway to limiter and back. Each additional policy dimension and retry belongs in the limiter workload calculation.

:::story Picture this
A venue checks a named ticket before letting the visitor into the hall. The ticket check does not reserve a seat at every exhibit inside. Admission and the capacity of each exhibit remain separate responsibilities.
:::
## 30. The rejected request and Retry-After
The selected rule has no remaining allowance. Return a clear rejection without running the expensive application operation. HTTP status **429** identifies excessive request rate; [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585) allows a `Retry-After` field and requires such responses not to be stored by a cache.

For a token-bucket alternative with 0.5 tokens and cost one, the deficit is 0.5. At refill 100 divided by 60, the modeled refill delay is 0.3 seconds. A protocol field expressed as whole seconds needs deliberate rounding and the current protocol's syntax; never round advice downward so it claims earlier allowance than the model supplies.

@fig sd_rate_limiting_reject | Illustrative token variant. Advice is not a reserved admission and wire-format rounding needs its own rule.

Clients should stop immediate retries, honor useful advice, and add jitter where shared recovery can synchronize them. The server should keep the rejection path cheap, avoid logging each abusive request at an expensive level, and distinguish policy rejection from an internal limiter fault in metrics.

:::warn Watch out
A rejected rate-check can itself become a high-volume workload. Bound response work, logging, key creation, and authentication cost. Protect the limiter and its gateway rather than assuming rejection is free.
:::
## 31. Clock, crash, and concurrency tests
Test the last allowance under simultaneous calls. Start a token bucket with one token and no elapsed time; after one serialized cost-one decision, the next must reject. Test clock rollback with retained time 10 and supplied time 9; elapsed refill must be zero and retained time must stay at least 10.

For fixed windows, test the adjacent-bucket burst explicitly. For logs, test equality at the cutoff and equal arrival timestamps with unique members. For counters, test the 80/30 state with late-clustered history and prove that the estimate of 90 can hide true count 110.

@fig sd_rate_limiting_tests | Verification matrix. The chapter's numeric script checks token transitions and endpoint arithmetic.

Test Redis timeout before execution, timeout after execution with a lost reply, failover to older state, and gateway restart with a leased allocation. An uncertain admission result is not automatically safe to retry with a fresh admission identifier. The chosen accounting can conservatively charge it, recover it, or deliberately tolerate over-admission.

:::note Separate admission and effect deduplication
Reusing an admission identifier can prevent duplicate accounting, while reusing a command identifier prevents a duplicate business effect. They need not share a lifetime or store. Document both so a retry cannot accidentally bypass capacity policy or repeat an irreversible operation.
:::
## 32. Count the complete design
At Heron's illustrative 1,000 checks per second and 3-millisecond round trip, mean outstanding limiter work is 3 calls. Separate user, tenant, and endpoint checks raise the operation count to 3,000 per second. These values omit retries, protocol overhead, hot-key skew, and the cost of cleanup.

For 100,000 active users at a full 100-event log, simplified retained history is 10,000,000 events and 240,000,000 bytes under the assumed 24-byte event size. The simpler counter model is 3,200,000 bytes at 32 per user, but changes the exactness guarantee. Compare those trade-offs using actual memory and tail-latency measurements before selecting deployment capacity.

@fig sd_rate_limiting_totals | Illustrative capacity arithmetic, not product throughput or memory claims. Actual overhead and skew need measurement.

@fig sd_rate_limiting_jobs | Architecture summary. Application effects and downstream concurrency keep separate ownership and correctness rules.

This chapter has not implemented a billing ledger or a durable distributed quota protocol. Those need stronger retained evidence if lost allowance can create unacceptable financial effects. The next unit separates media bytes from metadata so admission and upload traffic can protect the application without making it proxy every file.

:::interview Interview lens
**"Walk me through the full limiter and its trade-offs."** I derive a key from trusted identity, apply the selected policy in one shared atomic operation, and reject before expensive execution. I compare exact moving history with approximate or burst-capable alternatives, then calculate state and decision workload. I test concurrency, clocks, lost replies, failover, and outage behavior, stating any relaxed bound explicitly.
:::
:::key In one breath
A complete limiter implements a declared policy through trusted identity and serialized accounting. Its rejection and outage paths are part of the service behavior. Exact moving history, approximate counters, token bursts, and shaping queues have different bounds and costs. Verify boundary time, equal timestamps, final-token races, stale failover state, and independent operation identity before claiming distributed enforcement.
:::

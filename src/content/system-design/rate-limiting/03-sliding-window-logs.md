@part III | Sliding window log | We keep the recent accepted arrival history to enforce a true moving interval. Exact history removes the reset burst but costs memory and cleanup. We will define the interval endpoints, remove expired entries, preserve unique arrivals, and calculate the state budget. | where:3

## 9. A log of recent admissions
The policy now means no more than 100 accepted requests in every trailing 60 seconds. A **sliding-window log** stores the accepted request times that remain inside that moving interval. Each new request first removes expired history, then counts retained admissions before adding itself.

Choose endpoint semantics explicitly. This chapter uses $(t-T,t]$: an event exactly at $t-T$ is expired, while an event at current time $t$ counts. If the retained count is below the limit, add the new accepted event. If it equals the limit, reject without appending to the accepted-work log.

@fig sd_rate_limiting_log | Endpoint convention used by this chapter. Accepted-work history differs from a log of every attempted request.

A sorted set is one possible Redis representation because it orders timestamp scores and supports range removal and counting. The representation still needs unique member identities. Timestamp equality must not collapse distinct admitted requests, and client-provided times must not allow callers to erase or extend history.

:::story Picture this
A security desk keeps the arrival slips for the preceding hour. Before admitting another visitor, it removes slips older than that hour and counts what remains. Each visitor gets a distinct slip even if several arrive together.
:::
## 10. Intermediate log states
Use a deliberately small illustrative arrival trace to see the mechanism, without changing Heron's policy limit. The log contains accepted events at times 0, 10, 40, and 59 seconds. At time 60 with a 60-second interval, the cutoff is zero.

The event at zero is removed because it lies at the excluded left endpoint. Times 10, 40, and 59 remain, so the retained count is 3. If there is allowance, accepting the current event adds time 60 and raises the count to 4. The history is now `[10, 40, 59, 60]`.

@fig sd_rate_limiting_logtrace | Illustrative times in seconds. The trace shows state transitions rather than replacing the 100-request policy.

@fig sd_rate_limiting_interval | Chosen interval semantics. A different documented endpoint convention must use matching cleanup code.

The whole procedure must be serialized. If gateways independently clean, count, and append, two callers can both see the final slot and append. Exact storage does not imply exact enforcement without the atomic decision boundary.

:::warn Watch out
A timestamp used as the member name can overwrite a previous event at the same timestamp. Use an operation or admission identifier that remains unique while time is the ordering score.
:::
## 11. Memory and time costs
A log costs more than a counter because it stores each recent accepted admission. Under an illustrative 100,000 active subjects at their 100-event limit, there are 10,000,000 retained events. Assuming 24 bytes per retained event for a simplified accounting exercise gives 240,000,000 bytes.

This byte assumption excludes real allocator, key, node, member, and replication overhead. It is a lower-detail sizing model, not a Redis memory measurement. The comparable counter exercise assumes 32 bytes per subject, giving 3,200,000 bytes. Exact real costs need the actual representation and workload.

@fig sd_rate_limiting_memory | Illustrative byte assumptions exclude implementation overhead. Compare measured memory before deployment.

Redis sorted-set insertion and removal carry representation-dependent costs described by the command documentation. Batch removal of many expired events can make one decision slower than the usual small case. Keep the maximum recent history bounded by the admitted-work limit and test cleanup after an idle period.

:::note Idle state reclamation
Set expiration so an inactive subject eventually loses its history after all events can no longer affect admission. Deleting state earlier grants a fresh allowance too soon. Keeping it longer costs memory without changing the policy if timestamp cleanup is correct.
:::
## 12. Rejection time from retained history
The retained count equals the limit, so the next request cannot be admitted. The earliest retained accepted event determines when at least one slot can expire. With the chapter's endpoint convention, a candidate time at that oldest timestamp plus the interval length makes that event no longer count.

The server can return an advisory retry time based on this state. Concurrent admissions can take the newly available slot before the rejected client returns, so the advice is not a reservation. A client still needs backoff and jitter if many users were rejected together.

@fig sd_rate_limiting_oldest | Moving-log rejection logic. Another request can consume the future slot first.

Do not expose detailed arrival history to a caller who only needs a limit decision. Return the policy identity, remaining allowance when useful, and a documented delay. Guard the rejection path against excessive serialization or logging because abusive rejected traffic can still overwhelm a limiter.

:::interview Interview lens
**"Why choose a sliding log?"** It can enforce the exact trailing-window accepted-work rule with clear endpoint semantics. The cost is retaining and cleaning recent admissions. A sorted set plus an atomic cleanup-count-append operation supplies the mechanism, but its memory and hot-key costs must fit the workload.
:::
:::key In one breath
A sliding log retains exact accepted arrivals in the chosen moving interval. Cleanup, counting, and append must form one atomic decision. Unique event identity and trusted time prevent equal timestamps or malicious inputs from corrupting history. Exactness costs per-event memory, and retry advice based on the oldest event is not a reserved future slot.
:::

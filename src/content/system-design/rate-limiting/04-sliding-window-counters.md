@part IV | Sliding window counter | We approximate a moving interval with a small amount of bucket state. The estimate saves memory by assuming where older admissions occurred. We will calculate the interpolation, expose its error, handle skipped buckets, and compare its guarantee with exact history. | where:4

## 13. Two counters approximate the recent past
Heron wants smoother boundaries than a fixed window without retaining every timestamp. A **sliding-window counter** commonly combines the current fixed bucket with a weighted share of the previous bucket. It estimates how much of that older bucket belongs in the trailing interval.

$$\widehat C=C_{\text{now}}+(1-f)C_{\text{previous}}.$$
Read this as estimated recent count $\widehat C$ equals the current bucket count plus the previous bucket count multiplied by its remaining overlap fraction. Here $f$ is elapsed time in the current bucket divided by bucket length. This approximation assumes older admissions were sufficiently spread for time overlap to predict count overlap.

@fig sd_rate_limiting_counter | Two-bucket interpolation. The estimate is not exact trailing-window history.

It needs a bucket identity as well as counts, because state must distinguish a recent previous bucket from an old one after long inactivity. Serialize rollover and admission in the same operation. Otherwise one gateway can rotate counts while another increments the obsolete bucket.

:::story Picture this
A shop knows how many visitors came in the previous hour but no longer has their arrival slips. Halfway through the next hour, it assumes half of last hour's visitors are still recent. That is sensible only if they were not all clustered at one end.
:::
## 14. A complete numerical estimate
The illustrative previous bucket count is 80 and current count is 30. At 15 seconds into a 60-second bucket, elapsed fraction is 15 divided by 60, or 0.25. Previous overlap weight is 0.75, so the estimated recent count is 30 plus 80 times 0.75, or 90.

At 30 seconds, the fraction is 0.5 and the same counts produce 30 plus 40, or 70. The estimated count drops as older work ages out even when the current count remains unchanged. A cost-one request checks the estimate including its prospective cost before it is admitted.

@fig sd_rate_limiting_countertrace | Illustrative counts and times. The drop comes from the assumed overlap, not from observed event expirations.

Floating-point rounding can alter a boundary decision. Use a documented precision and arithmetic representation that matches the policy. Multiplying through by window length can avoid a division in a comparison, but overflow and clock units still require validation. The simplest sound implementation is the one whose stored state and inequalities you can trace.

:::note Prospective cost
Do not compare only the existing estimate to the limit. A request whose cost exceeds remaining allowance should fail even if the existing count is still below the limit. Weighted operations make this distinction obvious.
:::
## 15. Where the estimate is wrong
Place all 80 previous-bucket events near that bucket's end. At 15 seconds into the new bucket, those events can still belong to the true trailing interval. With 30 current events, true recent count is 110 while the interpolation gives 90. The estimate undercounts by 20.

Place older events near the previous bucket's beginning instead, and many may already be expired while the estimate retains a weighted share. That overcount rejects work the exact log could admit. No choice of fractional arithmetic recovers timestamp placement that the counters never stored.

@fig sd_rate_limiting_countererror | Illustrative 80/30 state at 15 seconds. Event placement determines error that the two counters cannot observe.

If a contract requires a strict upper bound in every trailing interval, use exact history or a conservative algorithm designed for that bound. If approximate fairness and cheap smooth limiting are acceptable, document the counter error. Avoid claiming that every sliding-window algorithm has identical semantics; the name covers several different constructions.

:::warn Watch out
A two-bucket estimate is not an exact sliding log. Its smooth appearance can hide bursts admitted because the previous bucket's events were clustered late. Explain the error rather than calling the estimate a strict moving limit.
:::
## 16. Rollover, idle gaps, and alternatives
The next request arrives after the current bucket changes. If it advances by one bucket, move the former current count into previous state and start the new current count. If more than one entire bucket has passed, old counters no longer contribute and can be cleared. Store the bucket identity so this distinction is explicit.

@fig sd_rate_limiting_rollover | Counter state transition. Time units and rollover arithmetic must be consistent at every gateway.

A ring of smaller time buckets can improve resolution at a cost in state and update work. It still groups arrivals inside each subwindow, so endpoint exactness depends on the chosen construction. Compare the guarantee, state memory, admission cost, and boundary error rather than treating algorithm names as a ranking.

For Heron, the strict user promise can choose a sliding log, while a broad low-cost abuse rule may choose the counter approximation. Different limits can deliberately use different semantics if the user-facing policy and operational rules say so.

:::interview Interview lens
**"What does a sliding counter trade away?"** It trades exact event placement for small state. Weighted previous counts smooth a bucket reset but can undercount or overcount clustered arrivals. I choose it only when that error fits the policy and implement rollover with the atomic admission decision.
:::
:::key In one breath
A sliding counter estimates recent work from current and weighted previous buckets. The overlap formula is cheap because it forgets individual arrival times. Clustered older events can make it undercount or overcount, and rollover needs an explicit bucket identity. Use it for an approximate contract, not an undisclosed exact trailing-window promise.
:::

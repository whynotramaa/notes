@part VIII | Alerting and incident diagnosis | We wake a human only when intervention can help. A short spike and sustained damage deserve different responses. We will compute burn, combine windows, assign actions, and verify incident hypotheses. | where:8

## 29. Burn rate arithmetic

The observed bad-event fraction is one percent while the SLO permits 0.1 percent. **Burn rate** divides the observed bad fraction by the permitted fraction. Here 0.01 divided by 0.001 equals ten: the service spends budget ten times as fast as its long-term allowance.

The 60-second incident produces 600 bad events and consumes 600 divided by 2,592,000 of the illustrative monthly budget. At ten bad requests per second, spending the whole budget would take 259,200 seconds under unchanged traffic and error fraction. That forecast is a model, not a promise about the incident’s future. An alert should combine the observed rate with window length and a response policy so a brief spike and sustained damage are treated differently.

Interpret the burn value as a ratio of rates, not as the amount of budget already spent. The illustrated bad fraction gives a burn of ten, while elapsed exposure determines how many bad events accumulated. A brief incident and a sustained incident can therefore show the same instantaneous burn with different consequences for the window. Preserve the bad-event count and observation duration in the alert evidence. When traffic changes, the forecast of when the request budget will run out changes too. Recompute from the declared population rather than treating a burn multiple as a fixed outage deadline.

@fig sd_observability_29 | Illustrative burn rate arithmetic. Observed failures consume the allowed fraction at ten times its sustainable rate. Orange marks the computed rate of budget consumption relative to the allowance.

A burn forecast becomes wrong when traffic changes. Recompute from the current eligible population rather than treating the forecast as an observed outage duration.

:::story Picture this
A bakery has a fixed allowance for burnt loaves each month. One burnt loaf is harmless early in the month, but the same pace near the end would spend the allowance before the month closes. The manager watches both the recent pace and the remaining allowance before calling for action.
:::

## 30. Multiwindow alerts

A short error spike clears before a person could intervene. Paging on its instantaneous rate creates work with no possible repair. A **multiwindow alert** requires evidence in both a short window and a longer window, so the trigger describes recent activity with sustained impact.

The short window checks whether the problem still exists; the long window checks whether it matters to the budget. Choose thresholds and windows from the response time and target budget consumption, not from a copied dashboard. Separate a page for urgent intervention from a ticket for slow sustained spending. Test the rule against a spike, a sustained outage, low traffic, and missing samples. Google’s [SLO alerting chapter](https://sre.google/workbook/alerting-on-slos/) develops this distinction between fast and slow budget consumption.

After a repair, the longer window can retain the incident's errors while recent traffic is healthy. Requiring the corresponding short-window condition avoids paging solely because past damage remains in that history. During a fresh burst, the short window can react first while the longer window rejects isolated noise. Evaluate both against matching eligibility and budget allowance so that their disagreement has a meaningful time interpretation. Keep a separate policy for low-volume routes and missing telemetry. A combined alert is useful only if the human response can change the ongoing condition rather than merely acknowledge budget that was already spent.

@fig sd_observability_30 | Illustrative multiwindow alerts. The short window confirms that the longer-window problem is still active. Orange marks the response decision after both window conditions hold.

Using the same long window for both checks can leave a resolved incident paging. The recovery policy belongs to the alert design too.

:::note Short and long alert windows
Combine a sustained-impact window with a recent-activity window. Pick page and ticket policies according to intervention time, and test recovery and no-data behavior.
:::

## 31. Actionable alerts and runbooks

An alert says high memory and provides no service, owner, or action. The responder first has to reconstruct what the alert meant. An **actionable alert** identifies user harm or a predicted failure and points to a decision someone can make.

Include the affected operation, population, evidence links, known mitigation, and the condition that confirms recovery. A runbook should explain when to rollback, shed load, disable an optional feature, or escalate to a dependency owner. Preserve a safe diagnostic path while the primary system is impaired. Avoid an alert for every internal graph: several resource signals can be symptoms of one failing request flow. Group notifications by incident boundary and retain separate evidence, rather than emitting repeated pages for the same event.

A runbook should name the decision that the evidence supports. A cache-key regression can justify rollback after checking the deployment boundary; a saturated database may instead require reducing admissions while protecting committed work. State the conditions under which each action is safe and the observation expected afterward. If the observation fails to improve, the responder revisits the hypothesis rather than repeating the same command indefinitely. Include the customer-facing outcome in the recovery check, because healthy internal utilization can coexist with a stuck queue or stale cache. An alert without this relation creates interruption without a repair path.

@fig sd_observability_31 | Illustrative actionable alerts and runbooks. The alert links user harm to an owner, a bounded action, and a recovery check. Orange marks the recovery check that establishes whether the action helped users.

Silencing an alert is not repairing the service. Record the reason and duration of suppression, and preserve the user-level check.

:::warn Watch out
An alert should tell an owner what is harmed, what evidence to inspect, which action may help, and how to verify recovery. Internal thresholds support diagnosis unless they predict a specific actionable failure.
:::

## 32. Incident hypotheses and timeline

During a cache outage, the team raises the database pool and increases retries. Latency worsens, but the team cannot tell which change increased contention. An **incident timeline** connects observations, actions, and resulting state changes.

Record the first user symptom, deployment changes, cache failures, pool waits, mitigations, and recovery checks with their evidence. Note which timestamps come from different clocks and which order is proven by a request relationship. Prefer reversible changes whose expected result can be stated before applying them. After restoring service, reconstruct the failure path from accepted work to user harm. The purpose is to identify a mechanism that can be changed or tested, not to assign a person as the cause of a distributed failure.

Build the timeline from event time and known collection delay rather than dashboard arrival alone. A delayed export can make the deployment appear later than the failures it actually preceded. Record the hypothesis, action, and expected changes while preserving uncertainty about clocks and missing records. If rollback restores cache hits but user delay persists, inspect backlog draining before declaring the hypothesis disproved. If hits never recover, the predicted mechanism did not change and needs another explanation. Change one interpretable control when possible, since simultaneous pool, routing, and cache changes make it difficult to connect improvement to any particular cause.

@fig sd_observability_32 | Illustrative incident hypotheses and timeline. The responder records a prediction before mitigation and compares the resulting evidence. Orange marks evidence confirming or rejecting the responder's prediction.

Simultaneous mitigations can be necessary during damage, but then causal confidence is lower. Record that limit instead of writing an unsupported definitive cause.

:::interview Interview lens
**"How do you test an incident hypothesis?"** Maintain a timeline of evidence and actions. State what a mitigation should change, then check the user’s outcome and the predicted internal signal. Treat clock-based order as uncertain when clocks differ.
:::

:::key In one breath
Alert on actionable symptoms with a named owner and runbook. Burn rate compares observed bad events with the permitted bad fraction. Independent evidence is needed before turning a correlation into a cause.
:::

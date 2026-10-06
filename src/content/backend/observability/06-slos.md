@part VI | SLIs, SLOs and SLAs | We put a number on "reliable enough" and use it to decide when to ship features and when to stop and fix things. A service that aims for perfect reliability ships nothing, and one with no target cannot tell an incident from a normal day. We will cover service level indicators, objectives and error budgets, burn-rate alerting, and agreements with customers. | where:6

## 19. Service level indicators

Before Wren can promise anything about reliability, it has to decide what to measure. A **service level indicator**, SLI, is a measurement of some aspect of the service that users care about, expressed as a ratio of good events to valid events, so it always lies between 0% and 100%. The ratio form matters because it is easy to understand, easy to aggregate over any window, and maps directly to a target.

The most common SLI is **availability**, successful requests divided by valid requests. "Valid" excludes requests that should not count, such as health checks and requests rejected for bad input. "Successful" usually means not a 5xx, but Wren has to decide the edge cases. A 429 from rate limiting is the user's own doing and counts as success for the service. A 503 shed by load shedding, Unit X, counts as a failure, because the user did not get what they wanted. A 200 with an empty search result caused by a broken index is a failure that status codes miss, which is why some SLIs come from synthetic probes that check content.

@fig be_obs_sli | An SLI is good events over valid events. Health checks and client mistakes are excluded, 5xx and slow requests are not good.

A **latency SLI** is the fraction of valid requests faster than a threshold, such as "requests to `POST /orders` that complete in under 300 ms". Expressing latency as a fraction, rather than as "p99 under 300 ms", keeps it a ratio of good events, which composes with error budgets. A histogram bucket boundary at exactly 300 ms makes it exact, Part III. Other services need other SLIs. A data pipeline measures **freshness**, the fraction of time data is less than five minutes old, and **correctness**. A storage system measures **durability**. Wren's Kafka consumers use freshness, measured from consumer lag.

Where the SLI is measured changes what it means. Measured at the application, it misses failures in the load balancer and the network. Measured at the load balancer, it catches more and is what most teams use. Measured at the client, through real user monitoring in Wren's app, it is closest to what users experience, including mobile networks, but noisier. Wren uses the load balancer's logs for its SLOs and watches client-side data as context.

SLIs should be few and should reflect user journeys, not internal components. Wren defines SLIs for browsing menus, placing an order, paying and tracking an order, not for each of its 30 internal services, whose health matters only through these journeys.

## 20. Objectives and error budgets

A **service level objective**, SLO, is a target for an SLI over a time window, such as "99.9% of valid order requests succeed, measured over a rolling 30 days". The target is deliberately not 100%. Every additional nine costs far more than the last, in redundancy, testing and slower change, and users cannot tell the difference beyond a point because their own phone networks and Wi-Fi fail more often than that. The SLO should be set where users start to notice and complain, not at the best the system has ever done.

The gap between the SLO and 100% is the **error budget**, the amount of failure the service is allowed. Wren serves 43,200,000 requests a day, 1,296,000,000 over 30 days. At 99.9%, the budget is 0.1% of them, 1,296,000 failed requests. Expressed as time, for a total outage, 0.1% of 30 days is 43.2 minutes. At 99.95% it would be 21.6 minutes, and at 99.99%, 4.32 minutes, too short for a human to even notice and respond to most incidents.

@fig be_obs_budget | A 30-day budget of 1,296,000 failed requests, about 43.2 minutes of full outage, spent by incidents and risky changes.

The error budget turns reliability into a shared decision rather than an argument. While budget remains, the team ships features at normal speed, runs experiments and accepts the risk that comes with change. When the budget is spent, the team agrees in advance to slow down, freezing risky releases and spending engineering time on reliability until the service is back within its objective. That agreement, an **error budget policy**, is written before any incident, signed by both product and engineering leads, so it is not renegotiated in the middle of a bad month.

The budget also says what is worth fixing. If a weekly deploy causes three minutes of errors, that is 12 minutes a month of a 43.2-minute budget, a quarter of it, and worth investing in safer deploys, Unit XV. A dependency that fails for one minute a quarter is not worth a redesign. SLOs give a common unit for comparing very different risks.

Wren reviews its SLOs every quarter. If the service always meets its target with a large unspent budget, the target may be too loose, or the team may be moving too cautiously. If it misses repeatedly while users seem content, the target may be too strict.

## 21. Burn-rate alerting

An SLO needs an alert that says when the budget is being spent too fast. The naive alert, "page if the error rate goes above 0.1%", fires on every brief blip and wakes someone for a two-minute spike that used 1% of the budget. The opposite, "page if the 30-day SLO is breached", fires when it is far too late. The better alert measures **burn rate**, how fast the budget is being consumed relative to the rate that would spend it exactly over the window.

A burn rate of 1 means errors are running at exactly 0.1%, which would spend the whole budget in 30 days. A burn rate of 14.4 means errors at 1.44%, which would spend it in 30 ÷ 14.4 ≈ 2.08 days. The useful number is how much budget a burn rate consumes in a given time. Burning at 14.4 for 1 hour spends 14.4 × 1 ÷ 720 = 2% of a 30-day budget, since 30 days is 720 hours.

@fig be_obs_burn | The budget line drains at the burn rate. A 14.4× burn for one hour spends 2%, a 6× burn for six hours spends 5%.

Google's SRE workbook recommends **multi-window, multi-burn-rate** alerts. Wren pages if the burn rate over the last hour exceeds 14.4, which spends 2% of the budget, and over the last six hours exceeds 6, which spends 6 × 6 ÷ 720 = 5%. It opens a ticket if the burn rate over three days exceeds 1, spending 10%. Each alert also requires the burn rate over a short window, one twelfth of the long one, to be high too, five minutes for the one-hour alert. The short window makes the alert stop quickly once the problem is fixed, rather than staying red for an hour while the long window catches up.

This scheme has good properties. A total outage, errors at 100%, burns at 1,000 times the budget rate, and the one-hour error rate passes 1.44% after 0.0144 hours, about 52 seconds, so it pages within a minute. A slow leak at 2× never pages but appears as a ticket within days. Brief spikes that recover do not page, because the long window must also be high. And the thresholds come from the budget, not from someone's guess about what error rate feels bad, so they stay correct when the SLO changes.

Latency SLOs work the same way, counting requests slower than the threshold as bad events. Wren runs both an availability and a latency burn-rate alert for each user journey, which together replace dozens of older threshold alerts.

## 22. SLAs and reliability versus velocity

A **service level agreement**, SLA, is a contract with customers that says what happens if the service falls short, usually service credits, a percentage of the monthly bill refunded. Wren offers its enterprise customers, companies ordering lunch for staff, an SLA of 99.5% monthly availability on the ordering API, with a 10% credit below that and 25% below 99%. Large cloud providers publish SLAs for every service in this form.

The SLA is a legal and commercial promise, and it should always be looser than the internal SLO. Wren's SLO is 99.9% and its SLA 99.5%. The gap means the team is alerted and acting long before it owes money. If the SLO and SLA were the same, every missed SLO would cost credits, and the team would have no early warning. Many services have SLOs and no SLA at all, because there is no contract, and SLOs are worth having anyway.

@fig be_obs_sla | Three levels. The SLI measures, the SLO targets 99.9% internally, the SLA promises 99.5% with credits.

The three terms are often confused in interviews, so a short summary helps. The SLI is the measurement, good events over valid events. The SLO is the internal target for that measurement over a window, which drives alerts and the error budget. The SLA is the external, contractual promise, looser than the SLO, with consequences.

Underneath sits the real trade-off, **reliability versus feature velocity**. Most outages are caused by changes, deploys, config updates and migrations, so the fastest way to be more reliable is to change less, and the fastest way to ship is to accept more risk. Error budgets make the trade explicit. A product team that wants to ship faster can spend the budget on it. A service that keeps missing its SLO earns a period of reliability work. Both sides use the same number.

Composition limits what is possible. If Wren's ordering journey depends in series on five components, each with 99.95% availability, the best the journey can reach is 0.9995⁵ ≈ 99.75%, below its 99.9% SLO. So the dependencies either need better availability, or the design must remove some from the critical path through caching, fallbacks and asynchronous work, Units VII, VIII and X.

:::story Picture this
A railway timetable. The SLI is the fraction of trains that arrived within five minutes. The SLO is the operator's own goal, 95% this quarter, watched weekly. The SLA is the refund policy printed on the ticket, which pays out below 90%. Budgets of lateness spent on track upgrades are planned, and the operator stops scheduling works when the season's punctuality runs low.
:::

:::note Measuring by time or by requests
Wren's SLOs count requests, so a failure at 3 a.m., when few users are around, uses less budget than the same failure at dinner time. That matches user pain. Time-based SLOs, "the service was up for 99.9% of minutes", are simpler to explain and treat every minute alike.
:::

:::warn Watch out
An SLO of 100%, or a chain of nines nobody can afford, makes every incident a crisis and freezes all change. Pick targets from what users notice, write the error budget policy before you need it, and keep the SLA well below the SLO.
:::

:::interview Interview lens
**"Explain SLI, SLO and SLA, and how you would alert."** The SLI is good events over valid events, such as non-5xx requests over all valid requests, or requests under 300 ms. The SLO is a target over a window, 99.9% over 30 days, which leaves an error budget of 0.1%, here 1,296,000 requests or 43.2 minutes of outage. The SLA is a looser contractual promise with credits. Alert on burn rate with multiple windows, page at 14.4× over an hour and 6× over six hours, ticket at 1× over three days, and use the budget policy to trade reliability against shipping speed.
:::

:::key In one breath
An SLI is good events over valid events, for availability, latency under a threshold, freshness or correctness, measured at the load balancer or client. An SLO targets it over a window, 99.9% over 30 days, giving an error budget of 1,296,000 failed requests or 43.2 minutes, and a written policy says what happens when it runs out. Burn-rate alerts page when the budget drains fast, 14.4× for an hour spends 2% and 6× for six hours spends 5%, with short windows for quick recovery. An SLA is the looser contract with credits, 99.5% against a 99.9% SLO, and five 99.95% dependencies in series cap a journey at about 99.75%.
:::

@part I | Availability and SPOFs | We decide what a successful score request means before adding spare machines. A response can be reachable, wrong, late, or missing a committed update. We will separate these failures, draw their dependencies, and calculate the promise Heron actually makes. | where:1

## 1. Single points of failure
A viewer opens Heron while a match is being scored. Every application replica answers health checks, but all of them need the same database. When that database stops, adding another application replica changes nothing. A **single point of failure** is a component whose failure alone defeats the required operation.

Draw a score read as a dependency graph. The viewer needs a reachable entry point, an application worker, and authoritative score state. Draw an upload separately because its bytes and metadata have different owners. A shared resolver, credential service, storage account, or configuration deployment can be a hidden dependency even when it never appears in the request diagram.

For the illustrative peak, Heron receives 1,000 API requests each second. If every request requires the failed database, all 1,000 lose that path. If a permitted cached score can answer a read, that operation has another path, but a score correction still needs the commit boundary. Reliability belongs to an operation and its contract, not to a list of machines.

@fig sd_reliability_dependency | Illustrative dependency graph. Independent application processes share one required database.

A strong interview answer names the operation, identifies the required dependencies, and asks whether a substitute preserves correctness. Replacing a database with an old cached score is acceptable only if the read contract permits that age. Returning an old score as if it were current hides failure rather than tolerating it.

:::story Picture this
A building has several reception desks but one locked records room. More receptionists help with waiting, but none can answer a question when the only key disappears. The useful spare is another authorized route to the records, not another person outside the same door.
:::
## 2. Reliability, availability, and correctness
The scorer receives a success reply, then reloads the match and sees the previous score. The server was reachable, but the operation did not meet its promise. **Reliability** means that the service performs its specified job under the stated conditions. **Availability** measures the fraction of eligible time or requests during which it meets a chosen success definition.

Write Heron's definition before collecting percentages. A score read succeeds if the user has permission, the answer meets the freshness requirement, and the reply arrives before its deadline. A score correction succeeds only after its durable commit. A deliberate client validation error does not automatically count as a service fault, while an overloaded server that rejects a valid request usually does.

For an illustrative request-based target of 99.9%, 8,640,000 eligible daily requests allow 8,640 failures. That budget is not permission to corrupt 8,640 score changes. Integrity and availability need separate rules because a wrong successful write can survive long after an outage ends.

@fig sd_reliability_success | The chosen operation defines success. These are requirements, not measured service values.

:::note Denominator discipline
Keep health-check traffic, invalid credentials, expected business rejections, and valid user operations distinguishable. A change in which requests count can improve a percentage without improving anyone's experience. Report both the definition and its measured numerator.
:::
## 3. Availability calculations and the two targets
A service advertises 99.99%, but a team cannot say how much outage time fits that statement. Choose an illustrative thirty-day accounting interval. Its duration is 30 times 24 times 60 times 60, giving 2,592,000 seconds. The unavailable fraction is one minus the target availability.

$$B=T(1-A).$$
Read this as the unavailable-time budget equals the total accounting time, $T$, multiplied by one minus availability, $A$. At 99.9%, the fraction is 0.001 and the budget is 2,592 seconds. At 99.99%, it is 0.0001 and the budget is 259.2 seconds. The tighter target leaves one tenth as much unavailable time under this definition.

@fig sd_reliability_availability | Computed for a thirty-day month. Planned exclusions and request-based accounting would change the definition.

A request-based target can behave differently. An outage during a quiet hour may consume little request budget but much time budget. During the final minutes of a popular match, the reverse can happen. Choose the metric that represents the promise, and keep the other metric available for diagnosis.

:::interview Interview lens
**"What does 99.99% availability buy us?"** It is a smaller allowed fraction of failed service under a defined measurement. For this thirty-day time interval it permits 259.2 seconds of unavailability. It says nothing by itself about data loss, geographic coverage, freshness, or how quickly one incident must recover.
:::
## 4. Required dependencies multiply risk
The entry proxy, application, and score database each meet an illustrative availability of 99.9%. A successful uncached read requires all of them. Under an explicitly independent failure model, their joint availability is the product, not the best individual percentage.

$$A_{\text{path}}=\prod_i A_i.$$
Read this as the availability of a required path is the product of each required component's availability, assuming their relevant failures are independent. Multiplying 0.999 by itself for the proxy, application, and database gives 0.997002999, or 99.7002999%. Adding mandatory dependencies can therefore lower the end-to-end promise.

@fig sd_reliability_series | Independent component model, not a measured forecast. Correlated failures invalidate this product.

The independence assumption is usually the fragile part. Shared power, region, identity, software, or load can correlate failures. Do not turn this arithmetic into a guarantee. Use it to expose dependencies, then identify common causes and measure the real service. The same rule applies to optional features: if recommendations are required before returning a score, a recommendation outage has become a score outage.

:::warn Watch out
Do not multiply vendor promises and present the result as measured user availability. Their exclusions, boundaries, and denominators can differ. The useful calculation is a clearly stated model with a list of required dependencies.
:::
:::key In one breath
A single point of failure is defined relative to the operation that needs it. Reachability, correctness, timeliness, and durable effects are separate promises. Under independent failures, required-path availability is a product; the unavailable-time budget is $T(1-A)$. Name the denominator and common causes before trusting a percentage.
:::

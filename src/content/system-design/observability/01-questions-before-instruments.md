@part I | Monitoring goals and telemetry | We begin with a viewer whose score is wrong or late. A healthy process does not prove a healthy experience. We will choose observations before choosing a telemetry product. | where:1

## 1. User outcomes and process health

A viewer refreshes Heron and sees yesterday’s score. The process responds successfully, its CPU is quiet, and its health check is green. Those facts describe the server; none establishes that the returned score is current. **Observability** means reasoning about a system’s behavior from the evidence it emits. Start by naming the user outcome, then ask which observation can disprove success.

Heron’s read operation has separate correctness and speed conditions. We record the returned event version, the latest committed version if available, and elapsed time at the client boundary. A fresh response can be slow, and a fast response can be stale. Combining the two into an undifferentiated success flag hides the repair we need. A server-side timeout also cannot prove that the browser saw a failure, because the reply may have crossed the network before a connection broke.

Follow the stale response backward before replacing a server. The browser receives an old version, the API logs a successful lookup, and the cache records a hit; all those observations can agree. A source read that returns a newer version then locates the missing propagation step between authority and copy. Record that comparison as evidence rather than rewriting the original response outcome. If the source is unreachable, freshness remains unknown unless another trusted version establishes the requirement. This trace separates a propagation fault from a transport fault and tells the responder which state to repair.

@fig sd_observability_01 | Illustrative user outcomes and process health. Server health and response success do not prove that the score is current. Orange marks the viewer outcome that fails despite a successful server response.

A cached old value can survive while the database and API are healthy. Compare the returned version with the contract, rather than treating an HTTP success as proof of correct data.

:::story Picture this
A cinema marquee can be lit and the ticket scanner can beep while the film inside is yesterday's showing. The usher checks the screen the viewer actually sees, while the manager checks the projector and scanner. Those checks answer different questions about the same promised experience.
:::

## 2. Black-box and white-box evidence

The public read fails while an internal health endpoint succeeds. A **black-box check** exercises externally visible behavior. A **white-box measurement** observes internal state such as queue occupancy or database waits. They complement each other because they fail in different ways.

Send a synthetic score read through DNS, the edge, routing, authentication, and the normal read path. Validate its body against a controlled match. Inside the API, count dependency failures and record cache age. If the synthetic check fails but dependency counters are normal, inspect the layers outside the application. If the check succeeds while queue age rises, the write path may be failing before readers notice. Never let a privileged health route bypass the mechanism whose health it claims to establish.

Give the synthetic match a controlled expected result and keep it separate from ordinary user edits. A probe authenticates, reads through the public route, and compares the returned version and content with that result. If authentication fails, it records that boundary rather than reporting a database error it never observed. If the returned body is old, compare internal cache and source observations for that same request. A probe that connects directly to the API cannot test DNS or edge routing. Keep the location and exercised route in its evidence so success has a precise geographic and operational meaning.

@fig sd_observability_02 | Illustrative black-box and white-box evidence. The public probe validates the body after following the normal authenticated read path. Orange marks validation of the returned body, which is the probe's final success condition.

A probe from one region can miss another region. Group its results by test location and operation without putting its unique request ID into a metric label.

:::note External result versus internal evidence
An external probe measures the visible result; internal telemetry narrows the explanation. Keep a controlled test record, protect the probe credentials, and avoid replacing ordinary traffic with a privileged shortcut.
:::

## 3. Symptoms, causes, and hypotheses

The cache hit ratio drops, database connections fill, and read latency rises. It is tempting to say that the database caused the incident because its chart looks worst. But a deployment may have changed cache keys, sending previously cached reads to the database. The database is then the point of saturation, not the initiating fault.

A **symptom** is observed harm; a hypothesis is a proposed explanation that predicts other evidence. Write the hypothesis before changing a setting. The cache-key hypothesis predicts a deployment boundary, a miss increase, stable user traffic, and an increase in database read queries. A database-only slowdown predicts a different sequence. Compare the predictions with timestamps and traces. A reversible rollback that restores hit ratio strengthens the argument, while simultaneous changes make it harder to know which mechanism mattered.

Work through the proposed chain in event order. A deployment changes the lookup key, so existing entries no longer match; the resulting misses create source reads, which hold connection slots while later requests wait. A trace that shows acquisition delay before query execution supports pool contention, while slow execution after immediate acquisition supports a different explanation. Rollback should restore the old lookup behavior if the key hypothesis is right. If misses recover but latency does not, inspect the accumulated queue and dependency state. The first repaired cause need not remove work that the incident already admitted.

@fig sd_observability_03 | Illustrative symptoms, causes, and hypotheses. The cache-key change precedes pool saturation and the final read delay. Orange marks the reader's delay at the end of the proposed failure chain.

Charts that rise together establish correlation. Missing telemetry, clock skew, and changes to measurement definitions can produce the same picture without the proposed failure.

:::warn Watch out
Separate what users experienced from what you think caused it. State a prediction, inspect evidence across boundaries, and make one interpretable change when the situation permits.
:::

## 4. The telemetry contract

A counter named requests is not enough to compare two deployments. Does it include retries? Does an authentication rejection count? At what point does the request enter the denominator? A **telemetry contract** states what event creates a measurement, which attributes it carries, and how unavailable data appears.

For Heron we count admitted API attempts separately from logical scorer commands. We emit the final user-visible outcome after the operation completes, and we count rejected attempts at the admission boundary. The dashboard therefore distinguishes offered load from useful completions. Rename or version a measurement when its meaning changes. Otherwise a deployment can create a false improvement by stopping the count before the failing step. Keep measurement definitions in review alongside the request code; dashboards consume those definitions but cannot repair an ambiguous one.

Consider a command whose database commit succeeds but whose reply disappears. The API records an admitted attempt and a committed effect, while the client records an unknown result and tries again. The next attempt may return the stored result without producing another command commit. Counting every successful HTTP attempt as a new score update would inflate business throughput; counting only commits would hide retry load. Emit separate records at those boundaries and join them by business identity where investigation requires it. A dashboard can then explain both the unchanged useful work and the additional demand created by recovery.

@fig sd_observability_04 | Illustrative the telemetry contract. Attempts, command commits, and viewer-confirmed results cross different telemetry boundaries. Orange marks the outcome boundary where the viewer confirms a usable result.

Instrumentation before completion misses late failures. Instrumentation in a finally block still needs the actual outcome, because completion of the handler does not imply success of the operation.

:::interview Interview lens
**"How do you write a telemetry contract?"** Define the event, unit, population, and outcome of every measurement. Keep attempts, logical commands, and side effects separate so a retry cannot look like extra successful business work. Record where the measurement is emitted and how missing or delayed telemetry appears, so an absent sample cannot be mistaken for a successful operation.
:::

:::key In one breath
Measure the result promised to a user. Keep symptom, explanation, and evidence distinct. A missing measurement is uncertainty, not success.
:::

@part II | Back-of-the-envelope estimation | We translate the workload into rates, bytes, and waiting. A daily total cannot size a peak, and an average cannot describe a hot key. We will compute requests, storage, delivery, and concurrency with explicit assumptions. | where:2

## 5. Daily requests, average, and peak

**Scale estimation** computes workload rates, bytes, and concurrency from explicit assumptions so a design can identify likely resource limits. Heron receives an assumed 8,640,000 API requests per day. A day contains 24 times 60 times 60, or 86,400 seconds. Dividing yields 100 requests per second on average; applying the assumed peak multiplier of ten gives 1,000 at peak.

**Requests per second** measure arrivals or completions per unit time, depending on the stated boundary. Read the formula aloud: daily requests divided by seconds per day. Average demand helps calculate long-term bytes, while peak demand helps size capacity and admission. A peak multiplier is a workload assumption, not a theorem. Request retries, scheduled bursts, and a hot event can change the peak independently of daily volume. Keep logical commands separate from transport attempts.

The illustrated daily total can describe very different arrival shapes. A steady service and a match-driven service can share that total while stressing admission differently. Divide by the day's duration to get the average, then label the chosen peak multiplier separately and use its computed peak for the capacity discussion. Do not use the peak as the steady daily write rate unless that is a separate exercise assumption. A candidate should say which queues and resources are sized for sustained peak and which absorb a bounded burst. Missing burst duration remains a question because a rate alone cannot determine backlog.

@fig sd_interview_method_05 | Illustrative daily requests, average, and peak. The daily count produces an average before an explicit peak multiplier sizes demand. Orange marks the computed peak under the stated multiplier.

A daily total cannot reveal bursts or hot-key skew. Ask for their shape or label a scenario and test it.

:::story Picture this
A bus company counts passengers per day, passengers on an average minute, and the largest rush at the stadium exit. The daily total sizes the depot, but the rush sizes the doors and buses serving that interval. Mixing those rates makes a quiet average hide a crowded platform.
:::

## 6. Concurrency from compatible rates

At the assumed peak the service completes 1,000 requests per second, with mean response time 0.2 seconds. Under a stable compatible population, mean in-flight work is 1,000 times 0.2, or 200 requests. This relationship is **Little’s law**, linking mean work in a system, throughput, and mean time.

Read it aloud: mean in-flight requests equal completed requests per second times mean time spent in the measured system. The boundaries must match. Including upstream waiting in latency while counting only downstream completions changes the population. A percentile is not the mean and cannot replace it in this arithmetic. During uncontrolled queue growth, the stable result is not a promise that only 200 requests will remain present.

Place the measurement boundary around API admission through response completion. The illustrated 1,000 completions per second and 0.2-second mean then imply 200 mean requests inside that boundary under stable conditions. If the duration excludes acquisition waiting while the throughput includes queued requests, the multiplication no longer counts all admitted in-flight work. A percentile cannot substitute for the mean in this relationship. During overload, arrivals can exceed completions and the queue can grow, so state the stability assumption explicitly. Use the result as a concurrency accounting check, then inspect capacity and tail delay separately.

@fig sd_interview_method_06 | Illustrative concurrency from compatible rates. Throughput and mean duration must cover the same request population. Orange marks mean in-flight work under the compatible-rate assumption.

A rising backlog violates the intended steady-state interpretation. Show arrivals, completions, and queue growth when the service cannot keep up.

:::note Concurrency from arrival and duration
Use mean throughput and mean time for the same boundary to calculate mean in-flight work. State the stability assumption. Use percentiles for user experience and admission limits for overload rather than substituting them into the mean calculation.
:::

## 7. Storage, retention, and copies

Assume every request creates a 500-byte record for a sizing exercise, even though the real Heron mix includes reads. Multiplying 8,640,000 by 500 gives 4,320,000,000 logical bytes per day. Retaining 30 days gives 129,600,000,000 bytes; three copies give 388,800,000,000 before indexes and other overhead.

**Logical storage** counts the source records before copies and physical representation. Keep the write fraction explicit rather than treating every read as a new row in a real capacity claim. Add indexes, compaction headroom, backups, deletion lag, and migration space separately. A disk sized only for the final retained dataset may run out during a rebuild that holds old and new representations at once.

Follow the unit in each row of the calculation. The illustrative all-write daily payload becomes logical retained bytes after multiplying by the retention window; complete copies then produce copied payload bytes. Indexes, transaction logs, temporary compaction space, and metadata belong to later terms rather than disappearing inside an unexplained margin. If expiry is logical before cleanup, allocated bytes can outlive the visible retention contract. If updates overwrite records, daily writes do not equal new retained records. State the write and retention model before sizing so the arithmetic answers the particular storage behavior being proposed.

@fig sd_interview_method_07 | Illustrative storage, retention, and copies. Retention and full copies multiply payload before storage overhead is added. Orange marks copied retained payload before representation overhead.

Replication and backups are different copies with different recovery jobs. Counting one does not automatically satisfy the other.

:::warn Watch out
Multiply write count, record bytes, and retention to get logical storage, then add copies and representation costs separately. State the write fraction and temporary recovery space. A read workload does not create stored rows by default.
:::

## 8. Bandwidth and fan-out

A 2,000-byte response at 1,000 API requests per second carries 2,000,000 payload bytes per second. Heron’s live path is a separate workload: 20 events per second sent to 50,000 viewers creates 1,000,000 deliveries and 200,000,000 payload bytes per second with 200-byte events.

**Fan-out** multiplies one input into several recipient deliveries. Read the delivery formula aloud: input event rate times recipients per event. Add protocol framing, encryption, heartbeats, retransmission, and uneven gateway distribution as separate measured or assumed costs. Sending one event to each gateway does not eliminate the gateway-to-viewer bytes; it only reduces the upstream copy count. The candidate should point to the link whose bandwidth the equation sizes.

Trace a score event through producer, gateway, and viewer legs. The producer emits the event once; a gateway then emits a copy for each subscribed viewer. Count payload on each leg before adding protocol overhead and replication. The illustrated live total can dominate the API response total even though score creation is infrequent. A single global requests-per-second figure hides that distinction. If clients only require current state, a coalescing policy might change delivery semantics and reduce work; if each event matters, that policy would violate the contract. Confirm the product requirement before presenting such a reduction as capacity saved.

@fig sd_interview_method_08 | Illustrative bandwidth and fan-out. Live recipient count multiplies delivery work independently of API throughput. Orange marks the recipient-multiplied live payload, separate from API response demand.

A live event with large payloads can saturate egress while API queries remain cheap. Size the right path.

:::interview Interview lens
**"How do you calculate bandwidth for a fan-out path?"** Compute each traffic path separately and label the link. Fan-out bytes are event rate times recipients times event payload, before protocol costs. Upstream gateway aggregation does not erase downstream delivery work.
:::

:::key In one breath
Carry units through every calculation. Distinguish average, peak, skew, logical bytes, copies, and overhead. Use mean latency with a compatible rate for mean in-flight work.
:::

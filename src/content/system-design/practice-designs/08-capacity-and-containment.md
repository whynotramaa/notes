@part VIII | Deep dive: capacity | We calculate the costs that the diagrams imply. Healthy averages can hide a hot publisher, long queue, or large transfer. We will size delivery, bytes, retained ingestion, and recovery under overload. | where:8

## 29. Live fan-out: gateway and link arithmetic

One score event becomes 50,000 deliveries. At 20 events per second, the live output is 1,000,000 messages per second. At 200 payload bytes each, that is 200,000,000 bytes per second before framing and transport overhead.

With a 10,000-connection gateway assumption, five gateways provide the arithmetic minimum for 50,000 viewers. A failed gateway removes both connections and capacity, so the design needs additional spare capacity or a documented temporary rejection policy. Upstream delivery of one copy per gateway reduces stream-to-gateway work, while each gateway still sends to its clients. Bound per-client backlog in bytes and age, disconnect or resynchronize slow clients, and spread reconnects with jitter.

The illustrated live total follows event rate times recipients, then payload per delivered event. Distributing connections across the minimum gateway count does not guarantee balanced egress, because viewers of one hot match can concentrate work. Losing an owner also moves its surviving viewers to another gateway and creates reconnect traffic. Admission must respect both connection and output capacity, with bounded queues for clients that cannot drain. Retained history or snapshots repair missed state after the new owner authenticates the viewer. Producer event rate and gateway delivery rate therefore need separate budgets even when they refer to the same score changes.

@fig sd_practice_designs_29 | Illustrative live fan-out: gateway and link arithmetic. The gateway minimum counts connections while failure spare capacity remains separate. Orange marks the minimum gateway count before failure spare capacity is considered.

A synchronized reconnect can overload authentication and replay even when steady-state socket capacity is adequate.

:::story Picture this
A station announcer speaks once into a microphone, but every listening platform still needs a speaker wire. The booth may handle one announcement while the wires and listeners multiply the delivery work. A full platform must count both the announcer's input and each downstream connection.
:::

## 30. Transfer and incremental-sync arithmetic

The full illustrative file is 5,000,000,000 bytes. At an assumed sustained 10,000,000 bytes per second, full transfer takes 500 seconds. Reusing 48 unchanged blocks and uploading two changed blocks transfers 200,000,000 bytes instead.

A **delta transfer** sends changed content relative to a known base. Its benefit depends on identifying stable reusable content and still committing a correct complete manifest. Changed bytes are not the only cost: scanning, hashing, metadata queries, encryption, and retries remain. Compressed or encrypted formats can change many blocks after a small edit, so do not assume edit size always equals transfer size. Verify checksums and content identity before publication, then count storage copies and temporary upload space separately.

The illustrated changed blocks save transfer only if the receiving service already holds verified reusable content for the remaining manifest references. Verify that assumption before subtracting unchanged bytes. Metadata still needs the complete manifest and a conditional base-version commit; partial upload does not publish a partial file. If the full-transfer reply is lost, the client resumes by verified part or block identity rather than sending an unrelated revision. The stated transfer time assumes the sustained payload rate and omits separate setup and validation work. Treat that arithmetic as a link-budget model, not a guarantee about a real synchronization product.

@fig sd_practice_designs_30 | Illustrative transfer and incremental-sync arithmetic. Incremental transfer reuses unchanged blocks while publication protects the revision. Orange marks reuse of unchanged blocks under the manifest contract.

The assumed block size is an exercise input, not an inferred private-product parameter or optimal universal choice.

:::note Queue dimensions and drain
Separate changed-byte savings from scan, hash, metadata, and commit work. Reuse only verified authorized content and publish a complete conditional manifest. Format and chunking choices determine whether a small edit yields a small transfer.
:::

## 31. Retention budgets for logs and metrics

Retention multiplies an ingestion rate over time. Seven days of the illustrative log stream occupies 302,400,000,000 payload bytes before compression, indexes, and copies. Seven days of the illustrative metrics sampling produces 40,320,000 samples.

A **retention budget** specifies how much history remains queryable or replayable for a purpose. Metrics often have series and sample costs; logs have event payload and index costs; event streams have segment and replication costs. Downsampling changes the questions old metrics can answer. Deleting telemetry can remove incident evidence, while excessive retention increases cost and sensitive-data exposure. Keep raw, aggregated, audit, and replay histories under distinct contracts rather than one global retention setting.

Logs and metric samples answer different questions and can need different retention windows. A request record supports individual investigation, while a metric series supports aggregate rates and distributions. The illustrated seven-day totals count their respective production units before copies and indexes. Reclaiming an index does not necessarily delete archived payload, and retaining metric samples does not preserve the full request evidence they summarize. Set retention per purpose and include all stored copies in cleanup. If an audit or replay contract requires stronger history, place it on a route whose acknowledgement and deletion policy satisfy that requirement.

@fig sd_practice_designs_31 | Illustrative retention budgets for logs and metrics. Retention multiplies daily samples and log payload without assuming identical encoding. Orange marks the distinct purposes that determine retention policy.

A byte budget cannot be inferred from metric sample count without an encoding and label-storage model.

:::warn Watch out
Multiply rate, record size where applicable, and time, then add representation and copies. Choose retention from recovery and investigation needs. Aggregation changes the available evidence rather than merely shrinking identical data.
:::

## 32. Queue overload and recovery capacity

An ingestion worker receives 1,200 tasks per second and completes 1,000 for 60 seconds. It accumulates 12,000 tasks. After arrivals fall to 600, recovery has 400 tasks per second of spare capacity and needs 30 seconds.

The same arithmetic applies to notifications, processing, indexing, and telemetry when a task count adequately represents work. If tasks vary widely in bytes or CPU cost, use those quantities too. Bound queue age to the promised completion time, bytes to memory or disk capacity, and retry attempts to useful recovery. A poison task can consume attempts while successful throughput stays low. Admit less upstream work when the downstream bound is reached instead of letting every layer accumulate its own hidden queue.

The illustrated burst adds 200 tasks per second beyond service for 60 seconds. The resulting 12,000-task backlog then competes with ongoing ordinary work, leaving the shown 400-per-second recovery rate. Count successful task effects in that rate, because repeated poison-task attempts consume workers without reducing unfinished work. Apply an admission or expiry rule before waiting exceeds the business contract and keep durable accepted work recoverable. Extra workers help only if the downstream target supports their combined concurrency. Recovery is complete when the accumulated tasks have a confirmed outcome, not merely when the queue graph stops rising.

@fig sd_practice_designs_32 | Illustrative queue overload and recovery capacity. Useful spare service drains the backlog after excess arrivals stop. Orange marks the computed backlog drain using spare useful service.

A queue depth that stays constant can still conceal permanent starvation of older items. Inspect oldest age and successful effects.

:::interview Interview lens
**"How do you calculate queue drain time during overload?"** Compute queue growth and drain from net rates, then test variable task sizes and retries. Bound count, bytes, age, and concurrency. Backpressure must reach the producer or admission boundary to prevent hidden accumulation.
:::

:::key In one breath
Compute each path separately, carry units, and add copies and overhead explicitly. Use spare capacity for recovery calculations. Bound queues and clients before overload damages an authority.
:::

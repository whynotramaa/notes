@part VI | Idempotence and transactions | We protect the append and output paths from duplicate attempts. Producer idempotence and business idempotence solve different problems. We will follow sequence checks, transaction identity, atomic output and offsets, and stable reads. | where:6

## 21. Idempotent producer sequences

The broker appends a batch, but the acknowledgement is lost. The producer repeats the same protocol batch. An **idempotent producer** uses producer identity, epoch, and partition sequence information so the broker can recognize supported repeated batches.

In the illustrative trace the first one-record batch has sequence zero at base offset 100. A retry keeps sequence zero and is recognized as the same supported append rather than another business event. The next new one-record batch uses sequence one. A batch containing several records advances its sequence range by its record count; this small trace deliberately uses one record per batch. The actual protocol tracks batch ranges and producer state, not a universal semantic equality of payloads. Applications that independently resend a business command under a new producer identity still need their own stable event identity. Enable and configure the feature according to [Kafka 4.1 producer settings](https://kafka.apache.org/41/configuration/producer-configs/).

A sequence check identifies a retry of the supported protocol batch under its producer state. It does not compare business meaning across separately submitted payloads. The fixture's repeated sequence zero can return the already accepted append, while the next sequence identifies new protocol work. A relay restart that creates another independent producer session can republish the same domain event as a new record. Keep that domain identity in the event and let its effect authority suppress the resulting repeated intention. Producer sequence and event identity thus protect different uncertainty windows.

@fig sd_kafka_21 | Illustrative producer-sequence trace. A retry of sequence 0 reuses the original batch at base offset 100; sequence 1 denotes a new batch rather than another copy of the retry.

Recreating an ordinary producer and resending a payload can be a new protocol identity. Do not extend producer retry guarantees beyond their documented scope.

:::story Picture this
A post office clerk stamps each parcel attempt with a sequence number and rejects a repeated stamp when the same sender retries after losing the receipt. The clerk cannot know that two separately handed-in parcels describe the same business order unless the order number is written on both. The sequence stamp protects the delivery protocol, while the order number protects the business meaning.
:::

## 22. Transactional identity and producer fencing

A processing application restarts while its old instance is paused. A **transactional producer identity** connects Kafka transactions to a stable application identity so the coordinator can manage ownership and fence obsolete producers.

The new active producer obtains the protocol’s newer epoch. In the illustrative ownership trace epoch eight becomes nine; the older owner cannot continue as though it retained the current transaction authority. Choose identity so genuinely concurrent shards do not unintentionally fence each other and restarts of the same logical owner can recover. This is different from the random identity of an ordinary producer session. Persist or derive the logical identity under the deployment’s ownership model and inspect coordinator errors instead of retrying fenced operations forever.


The illustrative producer restarts from epoch 8 into epoch 9 under the same recoverable transactional identity. The new epoch makes operations from the old producer obsolete at the transaction boundary. If the old process wakes and sends another operation under epoch 8, the broker must reject it instead of letting two incarnations act as the current producer. This fences producer ownership inside Kafka. It does not notify an external email provider that the old process is stale, so external effects retain their own identity or generation protocol.

@fig sd_kafka_22 | The fencing rows move ownership from epoch 8 to epoch 9; orange marks the old producer's resumed request rejected by the newer epoch.

Randomly changing the transactional identity on each restart can prevent the intended cross-instance fencing and recovery relationship.

:::note Transactional producer ownership
A stable transactional identity supports recovery and fencing for a logical producer owner. Assign it consistently without sharing it between unrelated concurrent owners. A fenced producer must stop and resolve ownership, not blindly retry.
:::

## 23. Atomic Kafka output and consumed offsets

A stream processor consumes a score event and produces an aggregate event. It wants its output and consumed progress to commit together. A **Kafka transaction** can include writes to Kafka partitions and the relevant consumed offsets under the Kafka protocol.

Begin the transaction, process the inputs, produce outputs, send the consumed next offsets with the valid group metadata, and commit. A committed reader sees the outputs according to transaction visibility; after an abort or failed ownership, recovery reprocesses from the appropriate committed input state. The local computation must be deterministic enough for the application’s recovery model. An outside database write performed during this transaction is not rolled back by Kafka, so its effect still needs another integration contract.

Stop the stream processor after producing transactional output but before committing. Under the selected committed-read isolation, unresolved output is not a completed visible result, and the input progress must follow the same transaction decision. An abort lets recovery process the input again without presenting the aborted Kafka output as another accepted result. If an external database mutation already happened during the attempt, Kafka cannot reverse it. That mutation needs its own repeatable rule. The code's lexical transaction block does not define distributed atomicity; the participating authorities and their commit protocol do.

@fig sd_kafka_23 | The transaction rows commit Kafka outputs and consumed offsets together while an external database remains outside; orange marks the unprotected external boundary.

A payment call or SQL mutation inside the transaction’s code block is not made atomic with Kafka merely because the code is nested there.

:::warn Watch out
Kafka can atomically commit Kafka output records and consumed offsets for a defined consume-transform-produce workflow. State reader isolation and ownership. Exactly-once scope stops at systems not participating in that atomic boundary.
:::

## 24. Last stable offset and committed reads

Replication is current through an exclusive high watermark of 103, but a transaction beginning at offset 102 remains open. The **last stable offset** bounds the part of the log that committed readers can resolve without crossing an unsettled transaction.

In this illustrative trace the stable boundary is 102, so committed reads can proceed below 102 while records at and after that boundary wait for transaction resolution. Aborted transactional data is skipped under committed-read semantics, with protocol control information preserving the decision. Nontransactional records after an unresolved transaction can also be held behind the stability boundary. See [Kafka 4.1 consumer isolation configuration](https://kafka.apache.org/41/configuration/consumer-configs/). Replication visibility and transaction resolution are different reasons a locally present record may not reach a consumer yet.

An open transaction at 102 can hold later records even if those later records are not themselves transactional. The committed reader needs a resolved prefix, so a locally present tail and current replication do not alone release that fetch. Transaction resolution determines which records become eligible and which aborted data the reader skips. The group checkpoint advances only after the application handles the resulting visible records under its effect rule. Inspect local end, replicated boundary, stable boundary, and completed group position separately when diagnosing lag, because waiting at each one implies a different next action.

@fig sd_kafka_24 | The rows separate the replicated boundary at 103 from an open transaction at 102; orange marks the last stable offset at 102 exclusive where committed readers stop.

A stalled committed reader can be waiting for transaction resolution rather than a slow fetch or lagging replica. Inspect both boundaries.

:::interview Interview lens
**"What does a Kafka transaction protect, and what does it leave outside?"** Committed readers respect transaction stability as well as replicated visibility. An open transaction can hold later data behind its first unresolved offset. I would distinguish consumer isolation from producer acknowledgement and application effect safety. An external database or email service still needs its own atomicity or deduplication contract.
:::

:::key In one breath
Producer sequence checks suppress repeated protocol batches within their documented identity. Kafka transactions can coordinate Kafka records and consumed offsets. External effects require their own atomicity or deduplication, and committed readers respect transaction visibility.
:::

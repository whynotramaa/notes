@part IV | Consumers, offsets and semantics | We follow a reader from fetch to restart. Saving progress before an effect and after an effect creates different failures. We will inspect positions, commits, delivery semantics, and outside state. | where:4

## 13. Fetch position and durable commit

The consumer fetches records 100 and 101 and moves its in-memory next position to 102. A **consumer position** is where that process will fetch next. A **committed offset** is the durable group restart position stored through the coordinator.

Those values can differ. Fetching does not prove application processing, and moving an in-memory position does not survive a crash. After safely representing both effects, commit next position 102. Restart then begins at 102. If only the first effect completed, committing 102 skips the second; committing 101 resumes it. With parallel processing, save only the contiguous completed boundary, not the highest completed record if earlier work is still pending.

A process can fetch farther than it has applied, especially when it hands records to a bounded worker pool. Keep that fetched position in memory separate from the durable completed prefix. If the process stops after applying 100 but before finishing 101, restart needs 101 even though the previous fetch position reached 102. Recording only the last fetched position would skip the missing effect. Commit the earliest still-unfinished position after the protected effects, and retain enough bookkeeping to distinguish completed later work from the contiguous prefix that recovery may safely bypass.

@fig sd_kafka_13 | The consumer trace applies records 100 and 101 before committing next position 102; orange marks restart at 102 after both effects are safe.

Automatic progress commits can race application processing. Use a policy aligned with effect completion rather than assuming fetch means handled.

:::story Picture this
A warehouse worker pulls orders 100 and 101 from a shelf and writes the next shelf marker only after both parcels reach the loading dock. If parcel 101 is ready but parcel 100 is still being packed, the marker stays before 101 so a restart will not skip it. The worker’s hand position and the marker painted on the shelf are different records of progress.
:::

## 14. At-most-once through commit first

The consumer commits next position 102 before applying the effects of records 100 and 101. It crashes immediately. On restart it begins at 102, so those effects are never attempted again. **At-most-once processing** avoids repeat attempts by accepting a possible loss window.

This behavior can be acceptable for disposable observations, but it is not the right contract for a required notification or ledger update. Define whether the promise concerns record delivery, application attempt, or final effect. Moving the commit earlier does not make work complete; it merely tells recovery not to revisit it. The failure trace makes the cost visible: stored progress is ahead of useful application state.

The restart decision reads durable progress rather than the former handler's intention. In the commit-first trace, the coordinator already stores 102, so recovery has no ordinary reason to revisit 100 or 101 even if neither effect happened. Another consumer application can still read those records from its own position while retention holds them, but that does not restore this application's skipped work. Use an explicit repair process if the business later requires it. The loss window is therefore a consequence of the chosen recovery order, not a broker deletion of the records.

@fig sd_kafka_14 | The commit-first trace saves next position 102 before applying effects; orange marks restart with records 100 and 101 lost.

A successful offset commit is not a business completion acknowledgement. It proves only the stored group progress boundary.

:::note Commit-before-effect semantics
Committing progress before effect creates a loss window after the commit. It supports at-most-once attempt semantics under that flow, not reliable effect completion. State whether losing those records is acceptable.
:::

## 15. At-least-once through effect first

The consumer applies records 100 and 101, then crashes before committing 102. Its previous restart position is still 100. **At-least-once processing** favors repeating work rather than losing it when progress confirmation is uncertain.

Restart fetches the same records again. If an effect is a replacement with a source-version check, it can safely repeat. If it increments a balance or sends an outside action, it needs durable deduplication or another repeatable state transition. Record source identity together with the effect in its authority. Acknowledging after application work is a useful recovery ordering, but it does not make arbitrary effects exactly once; it exposes a replay window that the effect rule must tolerate.

The effect authority may already contain both fixture results when Kafka still stores restart position 100. Restart must process the repeated records under the same durable identity or guarded version transition. A source-version replacement can return an already-new result without another mutation; an increment needs stronger deduplication evidence. Preserve that evidence across restart and for the supported replay horizon. Otherwise an old intentional rewind can repeat a previously protected effect after its deduplication record expires. Effect-first ordering favors recoverable repetition, while the application rule makes that repetition safe.

@fig sd_kafka_15 | The effect-first trace applies records 100 and 101 before committing; orange marks restart replay, which requires deduplicated effects.

An in-memory set of handled offsets disappears on restart and cannot protect a durable external effect.

:::warn Watch out
Apply safely before committing progress, then tolerate replay with durable effect identity or a repeatable transition. At-least-once plus idempotent consumers is common because it turns uncertain acknowledgements into safe repetition.
:::

## 16. External databases and deduplication

A projector writes a score card to a database, but Kafka’s group progress is stored elsewhere. There is no ordinary local transaction covering both. **Effect deduplication** records the source identity with the database mutation so replay can detect an already applied effect.

Begin the database transaction, check or insert topic-partition-offset identity, apply the derived mutation, and commit both. Then commit Kafka progress. A crash between them repeats the record but the database transaction finds its earlier identity. If the application can use a monotonically newer aggregate version, that can protect a replacement representation, but a nonrepeatable increment needs a more explicit record. Retain deduplication identities for the replay horizon promised to the consumer.

Separate a repeated Kafka record from repeated source publication. Topic, partition, and offset identify the same retained source record when replayed. An outbox row published again as a new record can have another offset while describing the same domain event. If the projection must collapse that case too, carry and enforce stable domain event identity in its transaction. A replacement version can offer another suitable rule when the representation allows it. Choose identity from the duplicate source being protected rather than assume every repetition shares one broker position.

@fig sd_kafka_16 | The rows put source identity and the effect in one database transaction while Kafka progress advances later; orange marks replay finding the existing identity.

Kafka transactions do not automatically include an arbitrary SQL database or payment provider. Exactly-once scope must name the participants.

:::interview Interview lens
**"How do you get reliable effects from an at-least-once consumer?"** I coordinate the effect and its deduplication record at the effect authority. I commit Kafka progress afterward and accept replay after a crash. I scope identity with topic and partition, and preserve it for the intended replay horizon. That makes a repeated delivery harmless without claiming that Kafka and the outside authority share one transaction.
:::

:::key In one breath
A consumer fetch position is not its durable restart position. Commit the next offset after safely representing the effect, and tolerate replay. Exactly-once claims must name the atomic boundary and the systems inside it.
:::

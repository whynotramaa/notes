@part IX | Case study: one score event | We connect the whole append and read trace. Unknown acknowledgements and repeated delivery are ordinary recovery cases. We will walk success, crashes, catch-up, and the choice between a log and a queue. | where:9

## 33. Complete success: source to projection

The scorer commits score state and outbox intention together. The relay sends the event under the match key, with stable business event identity. The producer routes to the current leader, batches, appends, and waits for the chosen acknowledgement policy.

The projector fetches the visible record, applies its versioned effect and deduplication identity in its local authority, then commits the next group position. A notification application uses a different group and records its separate delivery progress. Neither reader deletes the source. The client’s scorer result came from the database commit, while downstream visibility follows the durable publication and reader steps. Trace each acknowledgement without treating all of them as one global transaction.

Walk the same accepted event through consumers that finish at different times. The projector can commit its local effect and group position while notification delivery remains pending in another group. A current score read therefore does not prove a notification recipient has received the update. Keep the source commit, replicated broker acceptance, and each effect's result in their own durable records. A lost client reply recovers the scorer result from its source identity, whereas a replayed broker record recovers downstream work under consumer identity. The trace supplies several connected recovery arguments, not one global transaction.

@fig sd_kafka_33 | The success trace commits the score and outbox, appends a replicated Kafka record, and commits the projection offset; orange marks the safe consumer effect.

Returning downstream completion based only on source commit or broker acceptance overstates what the consumer has actually applied.

:::story Picture this
A restaurant writes the order and its kitchen ticket in one order book, then a runner carries a numbered ticket to the kitchen. The kitchen marks its own preparation record, while the dining-room and delivery teams keep separate copies of the ticket and mark their own progress. A runner hearing no reply does not prove that the kitchen missed the ticket, so the number lets a retry find the same order instead of creating a second one.
:::

## 34. Complete crash: lost produce acknowledgement

The broker appends the batch but the relay receives no acknowledgement. The outbox record remains pending. The producer can safely retry the same supported batch under its idempotent protocol, but a full relay restart can submit another business event unless stable event identity is preserved.

The consumer therefore uses the domain event identity or source position contract to prevent another effect. If the duplicate business event has a different Kafka offset, offset-only deduplication does not merge those two source submissions; the domain identity matters. This exposes the difference between protocol retry duplication and independent repeated publication. The safe flow keeps both protections where their failure window applies, rather than advertising producer idempotence as a complete end-to-end solution.


The retry window has three states. Before broker acceptance, retry is needed because the event may be absent. After broker acceptance but before the client learns the acknowledgement, retry is still needed because the producer cannot tell which state occurred. After learning the acknowledgement, the application can advance its publication checkpoint. The illustrative idempotent retry retains sequence 0 rather than choosing sequence 1; the broker recognizes that sequence under the same producer epoch and returns the original accepted outcome. The checkpoint and producer identity must both survive the supported restart path for that reasoning to apply.

@fig sd_kafka_34 | The crash trace loses the broker reply after append, leaves the outbox pending, and republishes by identity; orange marks the consumer effect that remains once.

Deduplicating only by Kafka offset cannot collapse the same domain event republished as a new record with a different offset.

:::note Publication and effect boundaries
Protocol retries and restarted business publication are different duplicate sources. Idempotent append handles its documented producer scope; stable event identity and consumer rules handle a repeated business event at another offset. Preserve the outbox until its chosen confirmation.
:::

## 35. Complete catch-up calculation

The projector pauses ten seconds while Heron continues producing 20 events per second. It accumulates 200 records. After restart it can safely process 100 per second while 20 still arrive, leaving 80 per second of spare capacity and 2.5 seconds of arithmetic catch-up.

The calculation assumes stable record cost, available source history, and no rebalance or dependency slowdown. A retained event horizon longer than this lag is necessary but not sufficient: the consumer still needs a valid initial state, compatible schemas, and repeatable effects. Catch-up can saturate the destination database even when Kafka serves the records quickly. Bound recovery concurrency and measure successful effects, not only fetched batches.

The arithmetic assumes each counted processed record has a safely represented effect. A fast fetch followed by a slow projection transaction consumes destination capacity without advancing useful completion. Bound recovery concurrency so catch-up does not overwhelm that destination and reduce its service rate further. Check that the source start still covers the stored restart boundary and that the projection's initial state is valid for replay. The illustrated drain uses spare completion capacity, so it ceases to describe recovery if poison data, missing history, or schema interpretation prevents those effects from completing.

@fig sd_kafka_35 | Illustrative catch-up arithmetic creates 200 records during a 20 per second pause and drains them at 80 spare per second; orange marks the 2.5 second drain.

If arrivals equal useful processing capacity, the backlog never shrinks under the simple model, even though the consumer is busy.

:::warn Watch out
Catch-up uses spare effect capacity while arrivals continue. Check retained source, compatible state, schema, and destination limits. Fetch speed alone does not establish projection recovery time.
:::

## 36. When Kafka is justified and when it is not

A single short-lived task needs one worker and no replay. A simpler durable queue may provide its required delayed execution with less retained-history and partition management. Another workload needs independent analytics, projection, and audit readers plus rebuilds; retained logs become useful.

Choose Kafka for the behavior it supplies: ordered partition history, independent positions, replay, stream processing, and a suitable throughput model. State what it does not supply automatically: global topic order, arbitrary outside exactly-once effects, unlimited retention, instant failure recovery, or a transaction with the source database. The next boundary is implementing and fault-testing the producer, group, and effect integration under the chosen settings. A strong answer explains why a normal queue would or would not satisfy the same contract.

Compare the queue and retained log using the same user action. A disposable delayed task can finish after one protected worker effect with no need for unrelated readers to rewind. A retained score history supports independent reconstruction and consumers whose progress differs. If that history requirement disappears, Kafka's partition, retention, and operating state may add cost without a needed capability. If it remains, state how source publication and external effects are protected alongside the log. Choosing the product does not remove those integrations, and a familiar name cannot substitute for their restart evidence.

@fig sd_kafka_36 | The rows compare one delayed task with retained replay for independent readers; orange marks the decision that weighs the requirement against operating cost.

Adding Kafka to a request path solely because it is common introduces another operational dependency without a demonstrated requirement.

:::interview Interview lens
**"When is Kafka justified instead of a durable queue?"** I use a retained log when independent readers, replay, and partition-local ordering solve the problem. I compare a queue on the same contract rather than choosing by brand. I defend source publication, reader effects, retention, and recovery separately. I do not extend Kafka’s guarantees beyond the participants that actually share them.
:::

:::key In one breath
Commit the source change and publication intention, safely append, then apply each reader’s effect and progress. Test lost replies and leadership or group changes. Use Kafka only when retained partition history and independent consumers solve the actual problem.
:::

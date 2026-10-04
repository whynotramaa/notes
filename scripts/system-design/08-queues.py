from author import publish
raw=r'''
@part Moving work off the request | We acknowledge one boundary before the whole job finishes. That reduces waiting only when the accepted work can be recovered. We will separate commands, events, and durable acceptance.

## Why add a queue?

A clip upload should not wait for transcoding. A **message queue** holds work for later processing by workers. Heron commits a job's durable identity and returns an accepted status, then a worker produces variants. Queueing moves completion later; it does not increase processing capacity or prove the job succeeded.

## Producers and consumers

A **producer** submits messages and a **consumer** processes them. The producer needs evidence of durable acceptance under the broker's contract; the consumer needs a separate acknowledgement after its effect is safe. A broker acceptance and a consumer completion are different observations.

@draw path | flow | ACCEPTANCE IS NOT COMPLETION | ["request","durable job","queue","worker result"] | Illustrative asynchronous clip job. | the client needs a job status contract

:::key In one breath
A queue separates acceptance from completion. Producers and consumers have different acknowledgement boundaries. Persist identity and status so the client can recover after a lost reply. Processing capacity still limits sustained throughput.
:::

@part Queue, pub/sub, and stream | We choose who should receive each message. Competing workers and independent subscribers have different meanings. We will distinguish distribution from retained history.

## Competing consumers and pub/sub

Workers can compete so one logical job goes to one worker at a time. **Publish/subscribe**, or **pub/sub**, sends a publication to independent interested subscribers. Heron's transcoding workers compete for jobs; search indexing and live delivery each need their own copy of a score event. Redelivery can still make a job run again.

## Event streams

An **event stream** is a retained sequence of records that readers can replay from positions. Retention is independent of one reader's acknowledgement. This supports rebuilding a search view or adding a new consumer later. A transient broadcast that forgets a message after sending cannot supply that history.

@draw subscribers | fan | INDEPENDENT SUBSCRIBERS NEED INDEPENDENT PROGRESS | {"source":"score event","targets":["live delivery","search indexing","analytics"]} | Illustrative pub/sub roles over a retained event source. | job competition is a different contract

:::key In one breath
Competing consumers distribute jobs. Pub/sub distributes copies to independent roles. Retained streams let readers replay history by position. Specify both recipient semantics and retention.
:::

@part Partitions and progress | We preserve order only where the business needs it. Parallelism changes which ordering promises remain possible. We will define partitions, groups, and offsets.

## Partitions and ordering

A **partition** is an independently ordered subset of a stream. Heron keys score events by match so one match's sequence stays in one partition. Different partitions progress independently and have no automatic global order. One hot match can therefore limit one partition even while others are idle.

## Consumer groups and offsets

A **consumer group** shares partition ownership among cooperating readers. An **offset** identifies a position within one partition, not a global timestamp. A checkpoint records recovery progress. If work completes out of order, committing beyond unfinished earlier work can skip that work after a crash.

@draw offsets | rows | RECOVERY MUST RESPECT UNFINISHED EARLIER WORK | [["offset","7","8","9"],["effect","done","pending","done"],["safe checkpoint","before 8","wait","not yet"]] | Illustrative partition progress; exact commit conventions depend on the API. | finishing a later item cannot erase the gap

:::warn Watch out
Adding consumers beyond useful partition ownership does not automatically increase ordered processing parallelism. Partition count and key skew constrain the work.
:::

:::key In one breath
Partitions provide local order and independent progress. Consumer groups divide ownership. Offsets name positions, while checkpoints determine recovery. Do not checkpoint past unfinished required effects.
:::

@part Acknowledgements and delivery | We identify the crash window between an effect and its acknowledgement. Different acknowledgement orders choose different risks. We will trace at-most-once and at-least-once delivery.

## At-most-once

**At-most-once** handling avoids redelivery by marking progress before the effect, or by using a contract that can discard failures. If the worker crashes after acknowledgement but before updating the database, the effect is lost. This can suit disposable telemetry when loss is explicitly acceptable.

## At-least-once

**At-least-once** handling allows redelivery until successful acknowledgement under the system's retention and recovery assumptions. Commit the effect first, then acknowledge. A crash between those steps repeats delivery, so the consumer needs stable message identity and an atomic deduplication boundary with the effect.

@draw crash | sequence | THE EFFECT CAN COMMIT BEFORE ACKNOWLEDGEMENT | {"actors":["broker","worker","database"],"steps":[[0,1,"deliver job J"],[1,2,"commit effect + J"],[1,0,"ack lost in crash"],[0,1,"deliver J again"],[1,2,"find recorded J"]]} | Illustrative at-least-once recovery. | duplicates are a normal failure path

:::key In one breath
Acknowledgement order creates a loss or duplicate window. At-most-once can lose an unfinished effect. At-least-once permits repeated deliveries and needs idempotent handling. State the failure and retention assumptions behind the label.
:::

@part Retries and bad messages | We stop one invalid job from consuming recovery forever. Retrying deterministic failure wastes capacity. We will separate delayed retries from poison-message handling.

## Retries and dead-letter queues

A transient dependency failure can enter bounded delayed retry with backoff and jitter. A **dead-letter queue** stores messages that exceed a handling policy for inspection and controlled replay. Preserve failure reason, original identity, and attempt history. Moving a message there is an operational decision, not successful business completion.

## Poison messages

A **poison message** repeatedly fails for a deterministic reason such as an unsupported schema or invalid payload. Validate before expensive work, quarantine with a reason, and alert on repeated patterns. Replaying without a fix merely recreates the failure; rewriting the identity can also bypass deduplication.

@draw poison | flow | FAILURE CLASS DECIDES THE NEXT PATH | ["failed job","transient?","bounded retry","quarantine if exhausted"] | Illustrative retry policy; permanent validation failure can go directly to quarantine. | replay keeps the original business identity

:::key In one breath
Retry suitable transient failures within a budget. Quarantine deterministic or exhausted failures with diagnostic context. A dead-letter queue needs ownership and a replay policy. Replaying is another potentially duplicate delivery.
:::

@part Exactly once and backpressure | We keep correctness and capacity as separate promises. A delivery label cannot remove an external crash window. We will scope exactly-once effects and count backlog.

## Exactly-once scope

**Exactly-once** must name the effect and transaction domain. A broker transaction can atomically commit output records and input progress within its supported domain. It does not automatically include a remote database, email, or payment API. Heron's worker can make one database effect by recording the job key in the same transaction, then tolerating repeated deliveries.

## Backpressure

At an illustrative 1,200 arrivals and 1,000 completions per second for 60 s, backlog grows to 12,000 jobs. Falling to 600 arrivals leaves 400 spare completions per second and a 30 s drain. Bound producer admission, worker concurrency, retry traffic, and queue age. A durable backlog is still a latency obligation.

@draw semantics | split | TRANSACTION SCOPE DEFINES THE GUARANTEE | [["inside broker","records + progress\nshared transaction"],["external effect","separate commit\nidentity + reconciliation"]] | Conceptual exactly-once boundary. | a label cannot cross an unrelated transaction

:::key In one breath
Exactly-once claims need an explicit effect boundary. At-least-once delivery plus an idempotent consumer often gives the useful application outcome. Backpressure protects finite processing capacity. Queue age determines whether accepted work still meets its promise.
:::

@part The complete asynchronous flow | We connect the database to work delivery without a lost-publication gap. A queue arrow alone cannot make two commits atomic. We will trace an outbox and worker recovery.

## Durable publication intent

Heron commits a clip job and an **outbox** record in one local database transaction. A publisher reads pending intent, sends it, and retries after uncertain acceptance. A crash can duplicate publication, so the worker still records message identity with its result. Deleting intent too early can lose the job.

## One worker's recovery

The worker validates the job, claims suitable ownership, produces an idempotent output object, commits job status, and acknowledges. If it crashes after producing bytes but before status commit, a retry verifies or safely replaces the same output key. Clients poll a durable job status rather than assuming a queue acknowledgement means an encoding exists.

@draw full | flow | ONE JOB HAS SEVERAL RECOVERY BOUNDARIES | ["job + outbox","publish + retry","effect + identity","ack + status"] | Illustrative clip processing flow. | the object key and job key must remain stable

:::interview Interview lens
**"Why is at-least-once plus idempotency common?"** A worker can commit an effect and then lose its acknowledgement. Redelivery recovers from that uncertainty. Stable identity and an atomic effect record turn repeated attempts into one business outcome.
:::

:::key In one breath
A complete asynchronous flow records intent, delivers work, commits an identified effect, and acknowledges progress. Each boundary can fail after performing its action. Stable identity makes those uncertainties recoverable. Kafka's retained-log mechanics are the next unit.
:::
'''
qa=[('Why add a queue?','It separates durable acceptance from later completion. It does not add worker capacity.'),('Queue or pub/sub?','Competing workers divide jobs; independent subscribers need separate copies and progress.'),('What is partition order?','A local record order within one partition. Different partitions do not automatically share one total order.'),('Why can acknowledgements duplicate effects?','The effect can commit before the acknowledgement is lost. Redelivery repeats the attempt.'),('What belongs in a dead-letter queue?','Messages that fail a stated policy, with original identity and diagnostic context. They need owned inspection and replay.'),('What does exactly once include?','Only the named transaction domain and effects. External services need their own identity and reconciliation rules.'),('Why use an outbox?','It commits business state and publication intent locally together. Later publication can duplicate, so consumers still deduplicate.')]
ex=[('●','Compute backlog after the specified burst.','(1,200-1,000) times 60 gives 12,000 jobs.'),('●','Compute recovery drain time.','12,000 divided by (1,000-600) gives 30 s.'),('●●','Trace a lost consumer acknowledgement.','Commit effect and message identity, crash before acknowledgement, receive redelivery, and return the recorded outcome.'),('●●','Explain at-most-once loss without equations.','Acknowledge before the effect and then crash. The broker believes processing finished while the effect never occurred.'),('●●●','Design a consumer transaction.','Use a unique message key, compare payload identity, and commit the effect and deduplication result together. Handle insertion conflicts by rereading the committed outcome.'),('●●●','Trace a poison message replay.','Quarantine preserves original identity and failure reason. Fix its deterministic cause, authorize bounded replay operationally, and retain duplicate-safe effect handling.')]
publish(8,'queues','Work after the response',['After the','Response'],'Queues, pub/sub, retained streams, partitions, progress, acknowledgements, retries, delivery semantics, and recoverable asynchronous effects.','Trace every crash window between accepting a job and finishing its business effect.',raw,qa,ex,[('RabbitMQ acknowledgements','https://www.rabbitmq.com/docs/confirms','Publisher acceptance and consumer acknowledgements.'),('Kafka delivery design','https://kafka.apache.org/41/design/design/','Delivery semantics and transaction boundaries.'),('Transactional outbox','https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html','Publication intent sharing the business commit.')])

@part V | Transactional outbox and CDC | We close the gap between a database commit and an event publication. Independent writes leave a failure window. We will follow the transactional outbox, relay retries, log-based capture, and delivery checkpoints. | where:5

## 17. The dual-write failure window

The API commits a score, then sends its event to a broker. It crashes between those operations, leaving durable state that no consumer hears about. Reversing the order can publish a change that later fails to commit. This is the **dual-write problem**, a gap between independently committed side effects.

Do not solve it by hoping retries happen in the right order. Identify whether both effects can share a transaction or whether a durable recovery record can connect them. The database write is the authority for acceptance, while event delivery can follow after commit under a documented delay. A workflow that returns success before either side is recoverable has not established durability.

Write the restart evidence for both orders. After a database-first crash, the source contains the new score but the broker has no guaranteed event. After a broker-first crash, consumers may observe a proposed score that the source never accepted. A local exception handler covers neither case when the process disappears. Recovery needs a committed publication intention tied to the source transition or another protocol that establishes the required relation. The source result can remain authoritative while event delivery proceeds later. That delayed delivery is a declared contract, whereas silently missing delivery is an unexplained failure state.

@fig sd_scaling_patterns_17 | Illustrative the dual-write failure window. Independent database and broker commits leave a gap in either write order. Orange marks the durable boundary needed to recover publication.

A local try/finally block does not run after a power loss. Recovery needs durable state, not only an exception handler.

:::story Picture this
A clerk updates the official ledger and then posts a notice on a bulletin board. If the clerk stops between those actions, the ledger is correct but the board is stale. A delivery tray beside the ledger records the notice request in the same transaction, so another clerk can finish posting it.
:::

## 18. Transactional outbox

The scorer update and its event intention fit in the same database. A **transactional outbox** writes business state and an event record in one local transaction, then publishes the event later.

Begin the transaction, enforce the expected match version, change the score, and insert the outbox row. Commit once. Either both rows survive or neither does. A relay reads committed outbox rows and sends them to the broker. This removes the lost-intention crash window, but the relay can send the same row again after a lost acknowledgement. Stable event identity and duplicate-safe consumers remain necessary. The [transactional outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html) separates local atomicity from eventual message publication.

Read the outbox only through committed database state. A rolled-back scorer transaction leaves neither an accepted score nor a publication job, so the relay must not publish work from an uncommitted application buffer. After commit, the row remains discoverable even if the original API process never starts a relay task. The consumer still needs duplicate protection because broker acceptance and the database sent mark have separate failure boundaries. Keep event identity and match ordering in the outbox record itself. Recovery can then repeat publication from durable intent without recomputing a different event from today's mutable state.

@fig sd_scaling_patterns_18 | Illustrative transactional outbox. The local transaction stores score and outbox together while the relay may repeat sends. Orange marks the relay send, which can repeat after an uncertain acknowledgement.

An outbox row inserted after the business transaction recreates the original failure window. Both belong to the same local commit.

:::note Outbox transaction boundary
Commit business state and the outbox row together. The relay makes the intention visible outside the database later. The pattern prevents a committed change from losing its publication intention, while allowing duplicate sends.
:::

## 19. Relays, claims, and acknowledgement loss

Two relay workers find the same unsent row. A **relay claim** temporarily assigns processing responsibility so workers avoid unnecessary concurrent sends. It does not make the outside publication atomic with marking the row sent.

Claim a bounded batch with a recoverable owner or lease, send each event, and record confirmed progress. If the relay crashes after the broker accepts a message but before the database marks it sent, another relay must send it again to avoid loss. Deduplication uses the stable event ID; ordering uses the chosen aggregate or partition rule. An illustrative two-second polling interval has one second of mean discovery delay only under uniform event arrival, no backlog, and negligible processing time.

The relay lease prevents unnecessary concurrent work but cannot prove that an expired worker's send never reached the broker. A replacement finds the pending row and republishes its stored identity. If the original send was accepted, the consumer encounters the same event again and uses its effect rule to suppress repetition. If it was not accepted, the replacement supplies the missing publication. Mark progress only after the required broker acknowledgement and preserve pending work when the result is uncertain. Claims and batches improve throughput and contention, while the stable identity and recoverable row provide the correctness argument.

@fig sd_scaling_patterns_19 | Illustrative relays, claims, and acknowledgement loss. A missing broker acknowledgement leaves the row pending for the same-identity resend. Orange marks restart resending the pending row under the same identity.

Deleting an outbox record immediately after a local send call can lose publication when the broker never accepted it. Use the actual broker acknowledgement semantics.

:::warn Watch out
A claim reduces contention; it does not remove the send-and-mark failure window. Choose safe redelivery over silent loss and make consumers repeatable. Polling delay is one part of delivery lag, not its entire bound.
:::

## 20. CDC checkpoints and retained logs

The database already records committed changes in its log. **Change data capture**, or CDC, streams those changes to another system. Log-based capture can observe an outbox without repeatedly polling its table.

Take a consistent snapshot and a corresponding log position, then consume later committed changes without a gap or duplicate-sensitive application. The consumer stores its progress so restart can continue from a known position. The database must retain needed log until the reader advances; a stalled reader can therefore create storage pressure. Capture describes database changes, so translate them into domain events where business meaning matters. PostgreSQL documents logical slots and restart behavior in its [logical decoding concepts](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html); Debezium documents an [outbox event router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html).

A snapshot and stream must meet at a named source position. If the stream begins too late, a committed change between the snapshot and stream disappears; if it overlaps, the receiver must tolerate the repeated change. Persist the checkpoint after applying the receiver's protected effect or combine them where possible. After a reader stall, inspect how much required source history remains and whether the reader can resume from its checkpoint. If history expired, silently starting from the head loses the reconstruction argument. Rebuild from a valid snapshot boundary and declare the temporary serving policy while that work completes.

@fig sd_scaling_patterns_20 | Illustrative cDC checkpoints and retained logs. A stalled CDC reader can retain source log history until storage comes under pressure. Orange marks the storage pressure caused by retaining log for a stalled reader.

Advancing the checkpoint before applying the effect can lose work. Applying the effect first can replay it after a crash; that path needs atomic progress or deduplication.

:::interview Interview lens
**"How does CDC recover across a snapshot and stream?"** CDC follows committed database changes from a recoverable position. Pair snapshot and stream boundaries, retain the needed log, and tolerate restart duplicates. Translate storage mutations into business meaning when the consumers require it.
:::

:::key In one breath
Commit business state and outbox together. A relay can publish duplicates, so consumers need durable deduplication. CDC reads committed changes, while its checkpoint and retained log define recovery.
:::

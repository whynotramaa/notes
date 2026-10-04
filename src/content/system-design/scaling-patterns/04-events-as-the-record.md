@part IV | Event sourcing | We preserve changes rather than only their latest result. Replay becomes dangerous when it repeats outside effects. We will build event histories, optimistic appends, snapshots, and schema evolution. | where:4

## 13. Event sourcing preserves domain changes

The current score says a total, but it no longer says which scoring changes produced that total. **Event sourcing** stores the domain changes as the authoritative history and derives current state from them.

Append a scored event containing its match, version, and domain facts. Apply the event to the previous state using a deterministic state-transition rule. To reconstruct the match, start from its initial state and apply its ordered events. This is different from logging changes to a database row: a row log describes storage mutations, while a domain event describes a business change. Martin Fowler explains replay and event histories in [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html). Keep enough domain meaning to interpret old events without depending on today’s mutable external data.

A correction event should describe the change that the domain accepted, including the meaning needed to apply it later. On reconstruction, replay the same ordered transition interpretation against the preceding state. A current team lookup cannot silently supply historical facts that were different when the event committed. If corrections refer to earlier events, retain that relation explicitly instead of deleting the earlier record and losing the explanation. The latest score can then be rebuilt while the history still answers why it changed. This additional history costs storage and schema discipline, so use it when those capabilities are required.

@fig sd_scaling_patterns_13 | Illustrative event sourcing preserves domain changes. Domain history remains authoritative while current score is reconstructed from it. Orange marks the current score reconstructed from authoritative events.

An event that says fetch the current team data cannot reliably reproduce historical state after that team data changes.

:::story Picture this
A bookkeeper keeps the dated entries that changed an account instead of saving only today's balance. A fresh balance can be reconstructed by adding the entries, but sending a refund to a bank is an outside action that cannot be recreated by rereading the ledger. The ledger and the bank receipt therefore need separate records and recovery rules.
:::

## 14. Expected versions and concurrent appends

Two commands read match version seven and both attempt to append the next event. The log needs an **expected-version append**, an atomic operation that accepts a new event only if the stored stream still has the specified version.

The first append checks seven and commits eight. The second still expects seven, so it fails rather than assigning another competing eight. The caller can reload and decide whether its command remains valid. Retrying the raw event without revalidating the domain rule can be wrong, because the event was decided against old state. An idempotency key can also make a repeated command return the earlier result without appending another effect.

Suppose the second command retries after learning that the stream reached eight. Changing its expected version without reloading and revalidating would hide the concurrent transition that invalidated its original decision. Reload the accepted state and reconsider the command under the domain rule, then create a new event only if it remains allowed. If the original command actually won and only its reply was lost, locate it by its stable identity rather than append another event. Stream version and command identity answer different questions. Both checks belong at the append authority so process scheduling cannot create a gap between validation and commitment.

@fig sd_scaling_patterns_14 | Illustrative expected versions and concurrent appends. Concurrent expected-version appends produce a winner and a conflict. Orange marks the losing append's version conflict.

A unique event ID prevents duplicate identity, but does not by itself prevent two different events from violating a state invariant.

:::note Expected version at append
Append against the version used to validate the command. On conflict, reload and reconsider the command rather than blindly repeating a precomputed event. Deduplicate repeated commands separately from concurrent distinct commands.
:::

## 15. Snapshots and replay cost

Rebuilding a long-lived match from its entire history takes longer than rebuilding a new match. A **snapshot** stores a derived state at a particular source version so recovery can start there and replay only later events.

With an illustrative million events and a replay rate of 20,000 per second, full replay takes 50 seconds. If a valid snapshot leaves only 1,000 later events, replay takes 0.05 seconds under the same rate assumption. Reading and validating the snapshot adds separate work. Store its source version, schema version, and checksum. Publish it atomically so a partial snapshot cannot become the recovery starting point. If validation fails, fall back to an earlier valid snapshot or the event history.

A snapshot's boundary tells recovery which event to apply next. If the stored state includes an event beyond its declared boundary, replay applies that event again; if it omits an included event, recovery silently loses the transition. Publish state and boundary together and verify the snapshot before using the illustrated shorter tail. A partial or incompatible snapshot falls back to a valid earlier starting point under the retained-history contract. The 0.05-second replay figure covers only tail processing at the assumed rate. Loading, validating, and preparing the snapshot are separate steps that still contribute to total recovery time.

@fig sd_scaling_patterns_15 | Illustrative snapshots and replay cost. A valid snapshot reduces replay to the later tail without replacing authoritative history. Orange marks snapshot verification before using the shorter replay tail.

Deleting history solely because a snapshot exists changes the audit and recovery contract. A snapshot cannot answer every historical question.

:::warn Watch out
A snapshot accelerates reconstruction but remains derived state. Pair it with its exact source boundary, validate it, and keep a path to recover without it. Snapshot loading and replay are separate costs.
:::

## 16. Replay, schema evolution, and outside effects

A rebuild replays a payment-requested event and sends another charge to a provider. The event history was correct; the replay mechanism confused state reconstruction with a live effect. **Replay isolation** prevents reconstruction from repeating external actions.

Derive state and projections deterministically. Live consumers can request outside effects through a durable workflow with stable identity; replay consumers reconstruct the recorded result or suppress that effect path. Old event schemas also need interpreters or explicit transformations. An event version tells the reader how to interpret its fields; it is separate from the aggregate’s sequence version. Test replay with old records, duplicate deliveries, and changed reference data. Deletion and privacy requirements need deliberate history design, because an append-only record is not an exemption from data handling rules.

A reconstruction worker and a live payment worker can read the same payment-requested event for different reasons. The former updates a derived state; the latter operates through the recorded effect intention and provider identity. Never make the reconstruction path send solely because the historical event exists. Store the confirmed effect result so rebuilding can recover known payment state without charging again. If old schema interpretation changes, compare reconstructed results before cutover and explain any intended correction. Versioning the event format does not alone make transition code deterministic when that code reads changing external information.

@fig sd_scaling_patterns_16 | Illustrative replay, schema evolution, and outside effects. Replay rebuilds state while a separate workflow protects external effects. Orange marks interpretation of the old schema without changing its meaning.

Changing the transition code can change the reconstructed result. Treat that as a migration or correction with explicit tests, not a harmless refactor.

:::interview Interview lens
**"What must event sourcing preserve during replay?"** Keep deterministic reconstruction separate from live outside effects. Version event meaning and test old histories. Store completed effect outcomes when recovery must know them, rather than asking the outside world to repeat the action.
:::

:::key In one breath
Event sourcing records domain changes as the authoritative history. Append against an expected version, derive state deterministically, and keep replay separate from external effects. Snapshots reduce recovery work but never replace the history contract.
:::

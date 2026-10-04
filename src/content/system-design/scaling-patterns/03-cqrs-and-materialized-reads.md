@part III | CQRS and materialized views | We build different shapes for commands and reads. Without explicit freshness rules, a fast projection can return misleading state. We will separate models, derive views, process updates, and recover lag. | where:3

## 9. CQRS separates models

A scorer update needs a version check, while a viewer wants a compact score card. Forcing both through the same representation can make validation or reading harder. **Command Query Responsibility Segregation**, or CQRS, uses distinct models for updates and queries.

The command model represents allowed changes and enforces the invariant. The query model represents an answer shaped for its readers. They may share a database; separate models do not require separate services or event sourcing. If the read model is stored separately, add a propagation path and define its freshness. Martin Fowler describes this model distinction and warns against applying it indiscriminately in [CQRS](https://martinfowler.com/bliki/CQRS.html). Start with one database and separate query code unless measured needs justify a distributed read store.

For Heron, the command representation needs the expected version and valid score transition, while the read representation needs the card fields presented to the viewer. Separate these representations in code first and preserve a single transaction where that meets the workload. Moving the card to another store adds a commit-to-view delay, a consumer checkpoint, and a rebuild source. Those costs need a read-work or isolation benefit. A command handler should not validate against the faster card if that card can lag. The distinction is valuable when it clarifies the invariant and access pattern, regardless of the number of deployed services.

@fig sd_scaling_patterns_09 | Illustrative cQRS separates models. Command and query models can share a database while serving different jobs. Orange marks the option to keep both models in one database.

Using two endpoint names over the same unchanged logic does not explain a useful model separation. State what representation differs and why.

:::story Picture this
A restaurant keeps the signed order ticket at the kitchen pass and prepares a separate menu board for quick customer questions. The board can lag while the signed ticket remains authoritative, and a new board can be rebuilt from the tickets. The two surfaces serve different jobs, so the fast board must declare how old its information may be.
:::

## 10. Materialized view maintenance

Every score-card read recomputes a join across match and team records. A **materialized view** stores a previously computed answer so reads can retrieve it without repeating that work.

After the authoritative update, compute the score card and store its source version. Reads fetch the card and can decide whether its version meets the request. This shifts work from each read to each relevant update. The saved read work is paid for with update processing, additional bytes, freshness delay, and a rebuild procedure. A database-managed view and an asynchronous service projection have different update and failure mechanics. Explain which one is used rather than treating materialized as a guarantee of immediate freshness.

The figure's source has reached eight while its card still represents seven. An ordinary viewer may accept that card under the stated freshness allowance; the scorer asking for its just-committed result cannot. When an older update arrives after the card reaches eight, the projection must not overwrite it. For replacement events, a guarded source-version write can enforce that rule; for incremental changes, require the necessary contiguous history or deduplication. A failed projector therefore changes read eligibility before it changes the authoritative score. Keep that distinction visible so an operator can rebuild the view without treating it as the only surviving truth.

@fig sd_scaling_patterns_10 | Illustrative materialized view maintenance. The materialized card remains old until its source version is applied. Orange marks application of the source version to the readable card.

A mutable card with no source version cannot tell whether an out-of-order update overwrote a newer result.

:::note Materialized view lag
A materialized view precomputes a query answer. State what changes invalidate it, how updates reach it, and how readers identify its source version. It saves repeated computation by adding stored derived state and maintenance work.
:::

## 11. Projection updates and duplicate delivery

The relay delivers the same score event twice. A **projection** is derived state computed from source records or events. Applying an increment twice changes its result unless the update is duplicate-safe.

For a score-card replacement, compare event version with stored version and accept only a newer valid result. For a derived count, record event identity with the effect in the same transaction, or use another repeatable update rule. Commit projection state and processing checkpoint atomically where the storage model permits it. An acknowledgement after the effect can be lost, causing redelivery; the consumer must then see that the event was already applied. A broker delivery guarantee alone cannot make an arbitrary external update exactly once.

Consider a projection update followed by a failed insert of its deduplication identity. If those operations have separate commits, restart can apply the update again because its evidence of completion is absent. Insert the identity and change the projection inside the same local transaction, rejecting an already present identity without another effect. For a replacement card, an atomic version comparison may supply the repeatable rule instead. Record consumer progress only after the protected effect boundary. A broker acknowledgement then releases delivery responsibility, but the local rule still protects a replay caused by an uncertain or lost acknowledgement.

@fig sd_scaling_patterns_11 | Illustrative projection updates and duplicate delivery. Effect and event identity commit together so redelivery cannot repeat the change. Orange marks redelivery finding the existing identity without another effect.

Global sequence numbers are not implied by per-partition offsets. Keep the version rule scoped to the aggregate or partition whose ordering it describes.

:::warn Watch out
A projection must tolerate its actual delivery semantics. Use a monotonic version for replacements or a durable deduplication record for nonrepeatable effects. Checkpoint and effect should not create an independent failure window.
:::

## 12. Lag, catch-up, and read-your-writes

The projector pauses for ten seconds while Heron creates 20 events per second. The computed backlog is 200 events. On recovery the projector applies 100 per second while 20 new events arrive, leaving 80 per second of spare capacity; catch-up takes 2.5 seconds.

**Projection lag** measures how far derived state trails its source. Give the scorer the committed source version and let a subsequent read require at least that version. The read can wait within a deadline, query the authority, or return an explicit pending state. It must not pretend that an old projection confirms the write. Catch-up capacity, not nominal consumer capacity, determines recovery while traffic continues.

In the illustrated recovery, the projector's 100-event service rate includes new work as well as old work. The ongoing 20-event input consumes part of that capacity, leaving the stated 80 for the backlog. If a read waits for its returned write version, impose a deadline and observe whether the version advances before that deadline. A poison event can stop progression even when total processing attempts appear high. Surface that blocked position and choose a repair policy that preserves event meaning. The arithmetic drain time assumes useful ordered processing continues; failed attempts do not count toward the spare completion rate.

@fig sd_scaling_patterns_12 | Illustrative lag, catch-up, and read-your-writes. Catch-up drains the paused projection using spare capacity after continuing arrivals. Orange marks the drain time computed from spare processing capacity.

Waiting forever for a projection turns a lagged read store into an unbounded request queue. Use a deadline and a documented fallback.

:::interview Interview lens
**"How do you choose a lag contract for a materialized view?"** A derived read needs an explicit lag policy. Return a write version and let reads require it when read-your-writes matters. Compute recovery from spare processing capacity while arrivals continue.
:::

:::key In one breath
CQRS separates write and read models. Materialized views precompute a useful answer. Derived views need version handling, rebuilds, and a read policy for lag.
:::

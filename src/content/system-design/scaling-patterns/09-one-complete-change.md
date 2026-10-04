@part IX | Case study: combining patterns | We connect the patterns through a scorer update. A diagram of services does not show where acceptance becomes durable. We will trace commit, publication, projection, failure, and changed-scale choices. | where:9

## 33. The complete scorer commit

The scorer sends an idempotency key and expected version. The command authority validates the transition, commits the score and outbox in one transaction, and stores the result associated with that key. Only then does it return durable acceptance.

A repeated request with the same key and payload returns the earlier result. A different payload under that key is rejected. A different command with an obsolete expected version conflicts. Those are distinct decisions. The response includes the committed version so a later read can request an adequate projection. This trace uses an ordinary transactional authority; event sourcing is an alternative record model, not an extra box that every system must add.

Walk the version-seven command through validation and durable acceptance. The authority stores version eight, publication intention, and the result associated with the command key in the same commit. If the API loses its connection before replying, the next attempt finds that result and returns eight without changing the score again. A different command still expecting seven receives a conflict. The caller can now require at least eight from a derived read, while ordinary viewers follow their allowed lag policy. Each result names a durable state rather than relying on whether the original request thread reached its return statement.

@fig sd_scaling_patterns_33 | Illustrative the complete scorer commit. The scorer response follows the atomic commit and returns a recoverable versioned result. Orange marks the durable versioned result that a retry can recover.

An API timeout after commit is an unknown client outcome. The stable key lets the client safely ask again without repeating the effect.

:::story Picture this
A chef writes an order in the kitchen ledger, puts the ticket in the service tray, and only then tells the waiter the meal is accepted. If the chef stops after the ledger entry, the tray lets another worker continue; if the waiter hears the answer twice, the ticket number prevents a duplicate meal. Each handoff has a visible state and one durable identity.
:::

## 34. The complete derived publication

After commit, the relay publishes the outbox event under the match ordering key. The projection consumer applies its version rule and records progress. Feed and notification consumers create their own effects under the same durable event identity.

Each consumer needs its own restart behavior because one successful projection does not prove another effect succeeded. Read-your-writes waits for the committed version only on the path that needs it; ordinary viewers may accept documented lag. The event envelope records causation and correlation for investigation without using diagnostic identity as an authorization rule. Derived state can be rebuilt from its source if the recovery contract retains that source and its interpretation.

Stop notification processing while the score projection continues. The projection can reach the required version and make reads current even though notification progress remains pending. Restart notification work from its own durable intention and effect identity rather than from the projection's checkpoint. Likewise, rebuilding the card should not send all notifications again. The shared event envelope supplies the connection between those operations, while their separate commits explain why completion differs. Keep lag and repair status by consumer so one healthy downstream path cannot conceal a permanently skipped event in another.

@fig sd_scaling_patterns_34 | Illustrative the complete derived publication. Consumers share the event but keep independent effect and restart boundaries. Orange marks independent consumers whose effects require separate recovery.

A dead-letter event can make a projection permanently incomplete. The design needs a visible recovery workflow, not only a destination queue.

:::note Publication version and lag
Publish from recoverable intention, apply each consumer effect safely, and keep independent progress. Derived consumers share an event but do not share one atomic commit. Preserve source history sufficient for their rebuild contract.
:::

## 35. The crash matrix

Stop the process before the command commits: neither the state nor the outbox survives. Stop it after commit but before publication: the relay finds the durable intention. Stop the relay after broker acceptance but before its progress mark: publication repeats. Stop the projection after effect but before acknowledgement: delivery repeats again.

The **crash matrix** enumerates these boundaries and the durable state visible on restart. It turns a diagram into a recovery argument. For each row, name the authority, pending work, repeated operation, and protection against a second effect. Add obsolete-owner cases separately; durability does not prevent a paused old worker from resuming. Verify the states with fault injection rather than assuming an exception test covers power loss.

Write the restart evidence as durable facts rather than exception messages. A committed source transition leaves an outbox row, broker acceptance leaves a retained event, and a committed projection leaves its protected event identity or version. At each later crash, choose the repeated operation from those facts. The row may republish and the event may redeliver, but neither is permission to apply a nonrepeatable projection change again. Add a paused old worker to the same exercise and check resource-side ownership enforcement separately. Duplicate delivery and obsolete authority need different safeguards even when they appear during the same recovery.

@fig sd_scaling_patterns_35 | Illustrative the crash matrix. A crash after an effect can cause redelivery, so progress must survive with the effect. Orange marks possible redelivery after the effect, protected by durable completion evidence.

A test that kills only before the first write misses the hardest windows, which occur after one authority committed but before another party learned it.

:::warn Watch out
Enumerate crashes around every acknowledgement and commit. Name the state that survives and the action restart takes. Then prove repeated operations preserve the invariant and obsolete owners cannot commit.
:::

## 36. Pattern selection under changed demand

The interview doubles readership but leaves scorer writes unchanged. The useful change may be a read index or another safe read copy, not a saga or event store. If the write invariant and query shape still fit one database, keep that authority.

At a different boundary, a projection may be justified by repeated expensive reads. At another, an outbox may be justified by the requirement that every committed change eventually reaches consumers. Sharding is justified when independent state exceeds an owner’s sustainable capacity. Explain each choice with demand, invariant, freshness, and recovery. The final design is the set of mechanisms required by those facts, rather than the set of pattern names the candidate can recall.

Compare the changed workload by operation instead of scaling every arrow together. More viewers can increase cached reads or live deliveries while the same scorers generate the same authoritative updates. A card index, reusable cache entry, or eligible read copy addresses different read costs; choose the one matching the measured limit. The outbox remains necessary if committed updates must eventually reach consumers, regardless of reader count. A saga is justified by a cross-authority recovery requirement, not by a read graph getting busier. State the remaining capacity limit and the next decision threshold without adding machinery for a hypothetical future.

@fig sd_scaling_patterns_36 | Illustrative pattern selection under changed demand. A change in read demand can justify a read optimization while retaining write authority. Orange marks the retained authority and invariant after the read-side change.

Traffic multiplication is not uniform across paths. A live-delivery increase and an API read increase stress different resources.

:::interview Interview lens
**"How do you decide whether a new scaling pattern is justified?"** Keep the smallest design that meets the stated workload and failure contract. Add a pattern when it solves a measured or required problem, and include the new recovery path in the trade-off. A design can remain strong while using few patterns.
:::

:::key In one breath
Trace the authoritative commit before the derived effects. Check every restart boundary and stale owner. Keep the smallest architecture that satisfies the invariant, freshness promise, and failure capacity.
:::

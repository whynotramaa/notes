@part IX | Trade-offs and the final answer | We defend choices against alternatives and changed requirements. A conclusion should explain what was paid and what remains unresolved. We will assemble the interview, test it, change scale, and choose the next study exercise. | where:9

## 33. Compare alternatives on the same contract

A candidate says Redis is faster than SQL and chooses it for booking ownership. That comparison omits the required invariant and failure model. A **trade-off** states what one choice improves and what it costs relative to another under the same requirements.

Compare a local transaction with a separate cache for the booking authority: atomic ownership, durable acceptance, recovery, latency, and operational work. Compare direct object upload with API forwarding on the same payload and assumed rates. Use a table when dimensions are parallel, but explain the mechanism behind the decisive dimension. A storage product’s maximum benchmark is not a substitute for the flow’s correctness and sustainable performance.

Compare a local transaction with a cross-service saga for the same booking or payment intention. The local transaction may offer a simpler atomic result while the split adds independent deployment and pending compensation states. If the alternative changes the invariant or acceptance meaning, state that change rather than comparing only latency. Use the same retention, payload, and offered demand for both capacity calculations. Explain the failure each option must recover and the durable evidence it retains. The preferred architecture follows from those costs and required guarantees, not from whether a product name sounds more distributed.

@fig sd_interview_method_33 | Illustrative compare alternatives on the same contract. Alternatives are comparable only under the same workload and failure contract. Orange marks the competing choice's cost under the same contract.

Changing durability or freshness between alternatives makes their latency comparison misleading.

:::story Picture this
Two builders quote different bridges for the same traffic, weight, and flood requirement. Comparing one bridge's steel cost with the other's travel time answers different questions. Hold the contract fixed, then compare capacity, failure behavior, and work required to operate each design.
:::

## 34. The complete whiteboard answer

Begin with the user actions and required guarantees. Compute the workload with units. Define the API and authority, then draw one complete critical flow before expanding the architecture. Follow that flow through commit, publication, derived reads, and recovery.

The written answer should let another engineer reproduce the design argument. Every component has a job, every acknowledgement has a meaning, and every scaling change targets a limit. Close by naming the hardest unresolved assumption and the experiment or requirement question that would resolve it. The interview is not a race to mention every concept in the syllabus; it is a demonstration that the chosen mechanisms compose into the promised behavior.

Return to the initial user action after the deep dive. For a scorer update, show permission, expected version, atomic score and outbox commit, reply, consumer effect, and the viewer's allowed observation. Mark the lost-reply window and recover through the original identity. Then identify which resource the workload approaches and which change would relieve it without weakening the invariant. Keep the diagram consistent with the data and API states already presented. An answer is complete when the interviewer can point to an arrow, interrupt it, and hear what survives and how the operation continues.

@fig sd_interview_method_34 | Illustrative the complete whiteboard answer. The whiteboard answer connects its contract, authoritative flow, recovery, and measurable trade-off. Orange marks the bottleneck and trade-off defended by a measurable test.

A component list with no complete flow cannot demonstrate how the system accepts one operation safely.

:::note Complete answer checklist
Give a coherent causal answer: contract, computed demand, API, data authority, critical flow, bottleneck, failure trace, and trade-off. Keep the diagram consistent with its acknowledgements and retained state. State uncertainty precisely.
:::

## 35. Changing one requirement

An edge that loses its revocation feed needs a defined serving policy. Failing open preserves playback but weakens immediate denial; failing closed preserves denial but can reject authorized viewers. That choice follows directly from the new requirement.

The interviewer now requires a deleted clip to stop playing immediately in every region. The existing expiring signed URLs may remain valid until expiry. A **requirement change** should propagate through the affected mechanisms rather than trigger a fresh unrelated diagram.

Find the contract it changes: authorization visibility at the content-serving boundary. Possible mechanisms include shorter permissions, serving-time validation, revocation state at the edge, or a documented bounded delay if the requirement can be relaxed. Each adds latency, state distribution, or availability costs. Keep unaffected scorer and metadata flows intact while explaining the new failure behavior. The candidate shows understanding by predicting the consequence of the changed promise.

Under expiry-only access, a previously issued usable capability can remain valid after the owner changes permission. Immediate denial requires a serving-time check or another revocation mechanism that reaches every allowed retrieval path. Protect direct origin access as well as the intended edge path. Decide what happens when the revocation authority is unreachable; permissive fallback would weaken the new requirement. Cache the bytes under their content identity without treating byte freshness as authorization freshness. This change affects availability, latency, and control state even when media payload and viewer count remain exactly the same.

@fig sd_interview_method_35 | Illustrative changing one requirement. Immediate revocation adds serving-time authority and a new dependency policy. Orange marks the added state, waiting, and failure policy required by immediate revocation.

Saying invalidate the CDN does not automatically revoke every existing authorization token or every client-held copy.

:::warn Watch out
Trace a changed requirement to the specific boundary it affects. Revise the mechanism and explain its added cost and failures. Preserve the rest of the argument when its assumptions still hold.
:::

## 36. Rehearsal and mechanism transfer

After the interview, draw the same flow without looking at the notes. Replace the normal success with a lost reply, an obsolete owner, a lagged read, a hot key, and a failed cache. If the answer changes, write the surviving state and the next safe operation.

Use the practice chapter’s systems to isolate different pressures: ticket booking for ownership, payments for unknown effects, Dropbox for resumable bytes and versions, Kafka for logs and replay, and metrics for bounded ingestion. Each rehearsal should include computed sizing and a defended invariant. When a mechanism remains hard to explain, return to its dedicated unit and redo its worked example rather than memorizing a larger diagram.

Reproduce the scorer flow without referring to the finished diagram, then stop the API after commit and explain the next retry from durable evidence. Move the same unknown-result problem to a payment provider and identify the external identity and reconciliation difference. Next remove a cache copy and show how admission protects the source. Each rehearsal should expose the exact state or contract that the new system changes. Counting boxes recalled from memory misses that transfer. A useful practice record names the unresolved boundary and the revised spoken explanation rather than declaring the entire design memorized.

@fig sd_interview_method_36 | Illustrative rehearsal and mechanism transfer. Practice transfers a mechanism by tracing its states and interrupting a hard boundary. Orange marks transfer of the same mechanism to another system.

Memorizing a finished diagram can conceal that its original assumptions no longer fit the next problem.

:::interview Interview lens
**"How do you compare designs on a whiteboard?"** Practice by reconstructing state transitions and failures, then transfer the mechanism to a different system. Explain why every box is needed and calculate its demand. Use uncertainty as a study target rather than filling it with product names.
:::

:::key In one breath
Tie every choice to the contract and a failure trace. Compare concrete alternatives on the same workload. Close with the critical flow, bottleneck, recovery, and limits of the assumptions.
:::

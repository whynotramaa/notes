@part IX | Putting it all together | We finish with the study method across all systems. Reusing a mechanism requires checking its assumptions. We will compare invariants, test crash windows, assemble a full Heron design, and plan the next rehearsal. | where:9

## 33. The invariant matrix across practice systems

A shortener needs unique key ownership, a booking system needs one seat winner, and a payment system needs one intended effect with balanced accounting. A feed needs a defined ordering and permission rule, while telemetry needs bounded ingestion and truthful loss reporting.

An **invariant matrix** maps each practice system to the authority that enforces its rule and the copies that may lag. It prevents the common error of treating every result as eventually consistent merely because some derived data can be. For each row, identify the atomic transition, stable identity, acknowledgement, and recovery source. A discovery index can be approximate while the action it suggests requires precise ownership. The candidate should say which distinction applies before choosing storage.

Use the matrix to check which state can grant an operation. A seat's current hold authorizes booking confirmation; a provider result tied to the payment intention supports a financial posting; source permission authorizes retrieval despite a feed reference. A cache or index is useful evidence of a candidate but cannot replace those authorities if it can lag. For each practice design, point to the conditional transition or protected effect that enforces its rule. Similar boxes can therefore require different acceptance and fallback behavior. A transferable design skill recognizes the invariant before reusing the queue or cache pattern.

@fig sd_practice_designs_33 | Illustrative the invariant matrix across practice systems. Booking, payment, and feed visibility depend on different authoritative rules. Orange marks serving-time permission over derived feed candidates.

A product name does not determine its consistency contract. Requirements and operations determine which state may lag or conflict.

:::story Picture this
A referee carries a rule card for each game and checks the relevant move before accepting it. A shared rule, such as one winner for a seat, must be enforced at the table where the score changes, not only on a noticeboard. The matrix makes each design state which rule its authority protects.
:::

## 34. A failure drill shared by every design

Kill the process after a durable effect but before its reply. Then pause an old owner until a successor begins. Then remove a fast derived copy. These drills expose unknown outcomes, obsolete authority, and fallback demand across almost every practice design.

For each drill, write the surviving records, the caller’s knowledge, and the next safe operation. A duplicate-safe identity resolves a repeated intention; a resource check rejects obsolete ownership; bounded fallback protects a source. Some designs need more: sync needs conditional manifests, collaboration needs operation transformation, and an event log needs replica and position recovery. Do not claim one generic retry policy solves every failure. The drill is shared, while its safe state transition is system-specific.

Interrupt a booking or score operation after its protected commit and recover through the stable request identity. Next pause an owner through takeover and show the protected target rejecting its obsolete generation. Finally remove a cache copy and show fallback admissions protecting the source. These failures can overlap, but their repairs solve different problems. Deduplication does not establish current ownership, and fencing does not make an external timeout outcome known. Keep surviving state and caller-visible result explicit in each walkthrough so an interviewer can see why the chosen protection applies at that precise boundary.

@fig sd_practice_designs_34 | Illustrative a failure drill shared by every design. The failure drill distinguishes uncertain results, obsolete ownership, and missing copies. Orange marks bounded fallback after a reusable copy disappears.

An exception raised before the effect exercises an easy case; the decisive drill interrupts after an authority committed but before another party learned it.

:::note Failure drills and evidence
Use common drills to expose different required mechanisms. State surviving durable data and the safe restart action. Lost knowledge, stale ownership, and insufficient capacity are different problems and need different protections.
:::

## 35. Heron end to end: one complete design

The scorer command validates permission and expected version, then commits score, result identity, and event intention. The relay publishes under a match ordering key. The projection builds a versioned score card, and gateways deliver the retained event to bounded viewer connections.

The clip path separately creates an upload session, transfers verified parts, commits processing intention, and publishes confirmed media. The control API grants scoped access while the CDN handles repeated byte delivery. Logs, metrics, and traces observe final outcomes and critical waits without retaining secrets or unbounded labels. When cache or telemetry fails, bounded policies preserve the authority. When a viewer reconnects, replay or snapshot restores its version boundary. Each component has a job derived from the contract.

Trace a scorer commit before involving viewer sockets. The score authority accepts the versioned command and publication intention together, after which consumers independently advance projections and gateway delivery. A disconnected viewer resumes from accepted progress or a suitable snapshot. In the media path, the API owns the upload session and publication state while storage owns verified bytes and workers own restartable processing. No successful socket send proves media publication, and no completed upload proves a current score read. The combined design connects shared identity and telemetry while preserving the distinct authorities of those operations.

@fig sd_practice_designs_35 | Illustrative heron end to end: one complete design. Heron links atomic score acceptance, recoverable live state, and verified media publication. Orange marks media publication after verified bytes and processing.

Adding every mechanism from the syllabus can create unnecessary dependencies. Include only what the selected actions and guarantees require.

:::warn Watch out
Assemble the design by connecting complete flows, not by merging every practice diagram. Preserve each authority, acknowledgement, version, and recovery path. Count the API, live-delivery, media, and telemetry workloads separately.
:::

## 36. Requirement changes and design rehearsal

Choose one practice problem and remove the notes. State its actions, guarantees, workload, API, data authority, and critical flow. Compute its main cost and interrupt it at a hard boundary. Then change one requirement and predict which mechanism must change.

The named systems here are hypothetical teaching designs. Their public protocols and API behaviors supply references, not a claim that a private production architecture uses our exact boxes or capacities. The Redis, Kafka, Dropbox, and database exercises deliberately go below a product label to expose parsing, append, manifest, and persistence mechanics. The next depth is implementation and load or fault testing: measure the assumptions, prove the invariants, and see where the chosen model stops matching the workload.

Take the private-media design and replace expiry-bounded access with immediate denial after revocation. The new serving rule needs current authority or another revocation mechanism on every allowed retrieval route, even though stored content and transfer size are unchanged. Now lose a reply after that authority commits and explain status recovery through the original identity. This exercise makes an architecture change follow a specific promise rather than a product substitution. Rehearse the same approach for stronger booking durability or longer reconnect history. Record the affected state, acknowledgement, and failure policy to make the next practice attempt precise.

@fig sd_practice_designs_36 | Illustrative requirement changes and design rehearsal. A changed requirement tests whether the candidate can predict the required mechanism. Orange marks a changed requirement whose state and failure consequences the candidate must predict.

These outlines are not complete production specifications for cryptography, payments regulation, or globally deployed storage. Their purpose is to teach the stated mechanisms and the questions needed for the next boundary.

:::interview Interview lens
**"How do you test a design's invariant across failures?"** Practice the flow and its failures, then test the assumptions through implementation or measured experiments. Distinguish public documented behavior from illustrative architecture. A strong interview answer can defend its exact contract without claiming private product knowledge.
:::

:::key In one breath
Defend every box by its job and every arrow by its acknowledgement. Rehearse one full flow and its failures. A named-product exercise is hypothetical unless primary sources establish a particular public mechanism.
:::

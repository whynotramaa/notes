@part I | Requirements gathering | We begin with what the user can do and what must survive. An impressive diagram can answer the wrong problem. We will turn actions, limits, correctness, and uncertainty into a written design contract. | where:1

## 1. Functional requirements as actions

The interviewer says design a video service. Before drawing storage, ask what a person does: uploads a clip, starts playback, searches metadata, or posts a comment. A **functional requirement** describes an allowed user action and its observable result.

Choose the critical actions and state exclusions. Heron accepts scorer updates, serves current scores, distributes live changes, and accepts clips. For an upload, distinguish accepted bytes from a published playable clip. Those are separate results because processing can continue after storage. Ask whether editing, deletion, sharing, and moderation are in scope. A question earns its place when its answer could change the API, authority, durability, or request path; unrelated feature questions consume interview time without informing the architecture.

Turn Heron's upload action into a sentence that can fail. A caller creates an upload session, transfers bytes, and later queries whether the clip is processing or playable. If the API returns accepted while the processing worker is down, the design can still meet durable acceptance but cannot yet claim playback readiness. That distinction changes the response model and the work placed before acknowledgement. Record the excluded features too, since editing or deletion would change identity and publication rules. A useful requirement gives the later architecture a specific state to produce and a failure against which that state can be checked.

@fig sd_interview_method_01 | Illustrative operation contract. The scorer needs a committed update and the viewer needs a fresh read; the observable result makes each action testable.

A design optimized for playback can omit the required upload recovery path if the action list is never written.

:::story Picture this
A tailor begins by writing down which garment the customer wants, which measurements matter, and what counts as ready. The pattern is not a list of sewing machines. Each machine earns a place only when it produces part of the promised garment, and excluded alterations stay off the work order.
:::

## 2. Non-functional requirements as tests

The service should be fast is not yet a test. A **non-functional requirement** specifies a property such as delay, availability, durability, privacy, or capacity for a defined operation and population.

Ask where latency is measured and which fraction of requests must meet it. Ask which failure an accepted upload must survive, and whether a score viewer may see an older version. A view counter can accept eventual visibility while ticket ownership cannot accept two winners. Do not apply one consistency adjective to the entire system. Turn each important property into a test: lose a worker after acceptance, read after a scorer update, disconnect a gateway, or replay a notification. Then identify the evidence that decides whether the property held.

Use the scorer and viewer to expose different guarantees. The scorer requires that an acknowledged update survive the named failure and that its subsequent read can request the committed version. The viewer may accept bounded lag but still requires permission and an acceptable response time. A common system-wide consistency label cannot express that difference. For uploads, define whether accepted means a session exists, bytes are stored, or processing is complete. Then place the acknowledgement after the boundary that proves that result. The resulting tests determine which components need authority, durability, or waiting on each critical path.

@fig sd_interview_method_02 | Illustrative non-functional requirements as tests. Each property needs an operation, population, and failure test. Orange marks the specific consistency rule instead of a label for the entire system.

An average response target does not constrain the slowest users. Ask for the population and statistic before using a latency number.

:::note Requirements as observable tests
Make each requirement observable. Name the operation, population, window or failure, and acceptable outcome. Different records can have different freshness and invariant requirements within one design.
:::

## 3. Scope, priorities, and conflict

The interviewer requires immediate global reads, unlimited availability during partitions, and a single unique booking winner. These requests can conflict under the stated failure conditions. A **design priority** resolves which property wins when the system cannot provide every desired result.

Explain the concrete partition: two sites cannot exchange ownership decisions but both receive the same booking request. Serving both independently can violate the winner invariant. Rejecting or delaying one side preserves it but sacrifices that operation’s availability. Ask which result is acceptable, and proceed with a documented choice. The discussion is about this flow, not a slogan about every database. Also rank features by their effect on the core flow so the interview spends depth on the decisions that matter.

Draw the disconnected sites with each receiving a valid contender for the same seat. Their local checks can both pass against old free state, so independent success violates the requested invariant. An ownership rule that authorizes only one site can preserve the winner, but the other site's callers must wait, fail, or route to that authority. Ask about that user outcome rather than reciting a consistency acronym. The same reasoning applies to an obsolete scorer version, though its domain conflict policy can differ. Explain the operation that becomes unavailable and why other independent reads might still continue.

@fig sd_interview_method_03 | Illustrative scope, priorities, and conflict. Preserving one booking winner requires an explicit partition-time policy. Orange marks delaying or rejecting when the unique winner cannot be established safely.

A statement that a system is strongly consistent does not explain which operations are blocked when authority is unreachable.

:::warn Watch out
When requirements conflict, show the failing scenario and ask which outcome is allowed. Scope consistency and availability to the operation and invariant, then state the chosen policy explicitly.
:::

## 4. Assumptions and unresolved questions

The workload is missing. A candidate invents a daily request count and later presents it as a fact about the named product. An **assumption ledger** separates supplied requirements, illustrative inputs, computed results, and unknowns.

Heron’s daily requests, response sizes, and capacity limits are illustrative. Carry those labels into captions and calculations. Keep unresolved questions that materially affect the design, such as retention, geography, privacy, and skew. Choose a working assumption when the interviewer wants forward progress, state why it is adequate for the first design, and explain which decision would change if it were wrong. Do not wait for every number before drawing one complete flow.

Mark every arrow with a quantity that has a clear origin. Daily user demand is an input, requests per second is a computed conversion, and a peak multiplier is another assumption unless supplied. If retention changes, update stored bytes without quietly altering the request rate. If payload size changes, update the bandwidth and storage calculations that depend on it. Keep unknown product behavior out of the arithmetic until its contract matters. The ledger makes disagreement productive because the interviewer can change one assumption and see the affected decisions without having to reconstruct which apparently factual number was invented earlier.

@fig sd_interview_method_04 | Illustrative assumptions and unresolved questions. The assumption ledger keeps inputs distinct from derived demand. Orange marks demand derived from labelled inputs while retaining their units.

Quietly changing the workload halfway through makes alternatives incomparable. Update the ledger and recompute dependent quantities.

:::interview Interview lens
**"How do you present assumptions in a system design interview?"** Mark given facts, working assumptions, and derived results separately. Proceed with useful explicit assumptions, then name the decisions sensitive to them. Never imply a hypothetical named-product workload is a measured architecture fact.
:::

:::key In one breath
Name the users, actions, exclusions, and guarantees. Separate a requirement from an illustrative assumption. A design decision is justified by a requirement or a measured constraint.
:::

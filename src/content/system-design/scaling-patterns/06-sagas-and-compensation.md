@part VI | Saga pattern | We coordinate a workflow that crosses local transactions. Undoing one service does not rewind the world. We will define steps, compensation, orchestration, and choreography. | where:6

## 21. Saga steps and local commits

Buying a match pass reserves inventory, charges a customer, and grants access. These effects belong to different authorities. A **saga** is a workflow of local transactions with explicit recovery actions when a later step fails.

Persist the workflow before sending the next command. Each service commits its own step using a stable command identity. After a confirmed reservation, request the charge; after a confirmed charge, grant access. If granting access fails, decide whether to retry, reverse the charge, or put the workflow into a recoverable pending state. The saga does not provide one globally isolated database transaction. Other observers may see intermediate committed states, so the business model must define what those states mean.

A reservation can commit before the payment step fails, leaving useful durable evidence rather than an automatically rolled-back world. The workflow owner records the current state and decides whether to retry payment or release the reservation under its business rule. If charging succeeds but granting access fails, retrying grant may be appropriate before refunding. Each command carries a stable identity so restart resumes the existing effect rather than creating a second reservation or charge. Intermediate states are observable and may need expiry. A saga provides a recovery protocol across those states; it does not supply isolation from other concurrent workflows.

@fig sd_scaling_patterns_21 | Illustrative saga steps and local commits. Local saga commits leave later failure to an explicit recovery workflow. Orange marks the final local step that still needs recovery if it fails.

Returning purchase complete after merely requesting a charge confuses intention with confirmed effect.

:::story Picture this
A travel agent books a room, a train, and a car at three separate counters. Each counter can commit its own booking, but if the car counter refuses, the agent must cancel the room and train under their own rules. A checklist records which counters finished so a replacement agent knows which compensations remain.
:::

## 22. Compensation is a new action

The charge succeeds but the pass cannot be granted. A **compensation** is a new operation that repairs the business consequence of an earlier committed step. It is not a time machine that erases the original action.

Issue a refund for the confirmed charge identity and release the reservation under its own identity. An illustrative 10,000-cent balance with a 2,500-cent reservation leaves 7,500 cents available; a compensating release restores the reserved availability if no other rule changed it. A refund may have its own delay, fee, or failure. Persist compensation status and retry it safely. The customer-facing state should say refund pending when the outside effect is not yet confirmed.

In the illustrated 2,500-cent charge, record the provider's confirmed charge reference before deciding compensation. A refund request can itself time out, so store its own stable identity and reconcile that outcome just as carefully as the charge. Do not declare the workflow compensated merely because the refund command was sent. If access was granted before the later failure, revocation can have a separate delay and policy. The original financial event remains part of the ledger while compensating entries explain the repair. Recovery therefore has visible intermediate states rather than restoring an imaginary instant before any service acted.

@fig sd_scaling_patterns_22 | Illustrative compensation is a new action. A refund creates a new recorded action and leaves the original charge in history. Orange marks confirmed compensation while retaining the original financial history.

A reservation release after expiry can race with a new owner. Condition the action on the reservation identity and current state.

:::note Compensation is a new commit
Compensation is a separately committed repair with its own identity and failures. Define it from the business consequence, not as a blind inverse SQL statement. Persist pending compensation and tell the user the true state.
:::

## 23. Orchestration state machines

A central workflow record says charged, but no command grants the pass after restart. **Orchestration** uses an explicit coordinator to decide and record the next workflow step.

Represent states such as reservation pending, reserved, charge pending, charged, grant pending, complete, and compensation pending. Atomically store the new state and its outgoing command intention. On restart, inspect persisted state and reissue a command with the same identity if its result is unknown. A delayed response must be checked against the current workflow state before applying it. The coordinator is another service that needs durability, ownership, deadlines, and bounded concurrency. Its value is a recoverable account of the whole workflow.

Stop the orchestrator after it issues the charge but before recording the reply. On restart, its durable state remains charge pending, so it queries or safely repeats that same effect identity. A delayed reply might then arrive after another recovery transition. Compare it with the current workflow state before advancing; otherwise an old success can revive a path already being compensated. Persist the decision and outgoing command intention together where the local store permits it. The workflow is understandable because every accepted transition names its prior state, resulting state, and next recoverable action.

@fig sd_scaling_patterns_23 | Illustrative orchestration state machines. Persisted workflow state interprets restart and late replies under the current step. Orange marks the late reply interpreted against the current workflow state.

An in-memory chain of RPC calls is not durable orchestration. A process crash loses its place unless the workflow is persisted.

:::warn Watch out
An orchestrator persists the workflow state and the next durable command intention. Recovery resumes that state machine; unknown outside outcomes need reconciliation. Make the coordinator’s own failure behavior explicit.
:::

## 24. Choreography and event contracts

The payment service publishes charged and the access service reacts. **Choreography** distributes workflow reactions among services rather than placing every next-step decision in one coordinator.

Each reacting service still needs a durable input, repeatable effect, and outgoing event intention. Document which event triggers which transition and which service handles a failed or missing step. A correlation identity lets operators reconstruct the workflow, but it does not itself ensure progress. When reactions form a long cycle, timeouts and compensation ownership become hard to follow. The [saga pattern description](https://microservices.io/patterns/data/saga.html) presents both choreography and orchestration; the appropriate choice depends on how understandable and recoverable the workflow remains.

Trace the relation from confirmed payment to requested access. The access service commits its local state and publishes its result under the workflow identity. If it cannot complete, a failure event must reach a service responsible for retry or compensation. Merely broadcasting that failure does not choose an owner. Keep a durable view of expected and completed steps so missing reactions are distinguishable from completed workflows. That view can be derived without commanding every step, but somebody must respond when progress stops. As dependencies grow, compare the effort of following these relations with an explicit orchestrator's state machine.

@fig sd_scaling_patterns_24 | Illustrative choreography and event contracts. Distributed reactions still require a named owner for stalled workflow recovery. Orange marks the named owner responsible when distributed reactions stop progressing.

An event broadcast with no service responsible for a missed transition can leave a workflow pending forever.

:::interview Interview lens
**"When should a saga use choreography or orchestration?"** Choreography distributes reactions, not responsibility for recovery. Each service needs local atomicity and duplicate handling. Use an explicit event contract and an observable workflow relation; choose orchestration when next-step ownership becomes hard to follow.
:::

:::key In one breath
A saga is a sequence of local commits with explicit recovery actions. Compensation is a new action that repairs a business consequence. Persist workflow state and make commands and compensations repeatable.
:::

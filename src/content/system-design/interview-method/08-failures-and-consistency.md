@part VIII | Failures and consistency | We rehearse the interrupted flows. A service can be alive while its authority or data is stale. We will trace crash windows, replica lag, recovery, and graceful degradation. | where:8

## 29. Crash windows and unknown progress

The command commits and the process dies before replying. On restart the database has the effect while the caller has no confirmation. A **failure trace** follows which state is durable and which party knows it at every interrupted boundary.

List before commit, after commit, after event send, after consumer effect, and after acknowledgement. For each, name the recovery action and the identity that prevents a second effect. A lost reply is not the same as a lost commit. A retry can be safe only if the service knows how to reconcile that unknown outcome. Keep cross-store publication states explicit, and test termination at the hard boundaries rather than only throwing exceptions before work starts.

Write down which state survives each interruption. Before the protected commit, retry can attempt the transition; after it, retry must discover the stored result. After publication, a broker redelivery can repeat an attempt, while the consumer's durable identity or version rule prevents another effect. A client timeout alone identifies none of those states. Use a status query or stable retry key at the authority to resolve the uncertainty. This answer shows why exceptions and transport errors belong to observations, while the database, broker, and effect records determine recovery decisions.

@fig sd_interview_method_29 | Illustrative crash windows and unknown progress. A lost reply leaves a committed effect uncertain to its caller. Orange marks repeated delivery that needs a duplicate-safe effect.

A successful retry handler does not prove the original attempt did not commit. It must check the durable command identity.

:::story Picture this
A cashier presses the card terminal's button, hears no receipt, and cannot tell whether the bank charged the customer. The cashier keeps the transaction number, checks the terminal's record, and retries only under that identity. Treating silence as failure could charge twice.
:::

## 30. Replica lag and read-your-writes

A projection can skip an event after a poison-message failure and still advance later versions. A version threshold is adequate only when the projection’s definition guarantees it contains the required preceding state or records the gap explicitly.

The scorer receives version eight but its next read reaches a follower still on seven. **Read-your-writes** is a session guarantee that later reads do not go behind the caller’s acknowledged write.

Return the committed version and let the read require an adequate copy. Route to authority, wait within a deadline for a follower to apply that version, or return an explicit pending result. Ordinary viewers may accept lag if the contract permits it. A replication lag chart helps diagnose the situation but does not enforce the guarantee. A follower serving stale data cannot prove write failure; it may simply not have applied the committed change.

The figure's write response establishes eight while the follower still serves seven. Route a read carrying the required version only to a view that has applied it, or wait within a bounded deadline. If the deadline expires, return pending or use an eligible authority under its capacity rule. A sleep chosen without observing progress cannot prove the follower caught up. Different clients can accept different lag policies, so the scorer's stronger read need not force every viewer to the writer. Version evidence makes this selection precise without claiming all replica reads are immediately current.

@fig sd_interview_method_30 | Illustrative replica lag and read-your-writes. The returned write version lets a read reject an old follower. Orange marks the bounded read policy for a follower behind the write version.

Sticky routing to one follower does not help if that follower is behind the acknowledged version.

:::note Replica freshness
Carry a committed version into the read requirement when the session needs it. Choose a bounded adequate-copy policy. Keep ordinary eventual reads and writer-confirmation reads as separate contracts.
:::

## 31. Recovery time and recoverable history

The service has replicas, but a mistaken deletion reaches all of them. **Recovery time objective**, or RTO, is the target time to restore the required service. **Recovery point objective**, or RPO, is the tolerated loss of acknowledged or relevant data under the stated failure model.

Replicas address some node failures; backups and retained history address different failures. Name the restore starting point, history replay, integrity checks, dependency restoration, and traffic cutover. A recovery plan must be tested with the actual dataset and the promised failure domain. State whether pending uploads, queued work, and external effects reconcile after restore. Restoration can return the database while leaving application workflows inconsistent with outside systems.

A backup restore is only a starting point if later acknowledged updates exist in retained history. Replay them under the engine's recovery rule and validate the resulting state before serving it as current. Then check derived indexes, publication intentions, and external effects whose state might not share the restore boundary. Replaying a payment intention cannot safely issue a new charge without its original identity and confirmed result relation. Define the failure whose data-loss allowance the plan meets and the point at which the user operation can resume. Recovery time includes that dependent work, not merely copying the backup bytes.

@fig sd_interview_method_31 | Illustrative recovery time and recoverable history. Recovery includes restored history, dependent reconciliation, and user-visible validation. Orange marks cutover after dependency reconciliation and user checks.

An untested backup is a stored object, not evidence that recovery will meet the objective.

:::warn Watch out
Define RTO and RPO for a failure scenario, then walk restore, replay, validation, and cutover. Replication and backup have different jobs. Include outside effects and pending workflows in recovery, not only database availability.
:::

## 32. Graceful degradation and admission

A recommendations service fails while score reads still work. **Graceful degradation** preserves the required core operation while disabling or simplifying optional work.

Make optional dependencies explicit so their failures do not block the authoritative score path. Use deadlines and bounded concurrency to avoid filling every request slot with work that will not return. For essential work above capacity, reject early with a retry policy rather than accumulating unlimited waiting. A partial response must identify omitted or stale data according to the API contract. Recovery should not release every retry at once; backoff and jitter spread renewed attempts.

During a failed recommendation dependency, Heron can still return the authoritative score if recommendations are optional under the contract. It cannot omit the score's authorization check or claim freshness from unavailable evidence. Keep separate concurrency budgets so waiting optional calls do not exhaust the core request pool. When required work itself exceeds capacity, reject early with a controlled retry policy instead of admitting an unlimited queue. Show the caller's degraded result explicitly. A low latency chart for admitted requests is insufficient if the design silently discards most eligible users at its entrance.

@fig sd_interview_method_32 | Illustrative graceful degradation and admission. Bounded rejection and optional-work isolation preserve the required core operation. Orange marks early bounded rejection that prevents overload from becoming unbounded waiting.

Dropping a payment verification or permission check is not an optional simplification merely because it improves latency.

:::interview Interview lens
**"How do you handle replica lag when a read must see its write?"** Separate optional from essential dependencies, bound waiting, and preserve the core result. Return honest partial or rejected outcomes and control retries during recovery. Degradation must not weaken an invariant silently.
:::

:::key In one breath
State which reads may be stale and which effects must be unique. Check crashes around commits and acknowledgements. Recovery needs a durable starting point, sufficient retained data, and a test under the promised failure.
:::

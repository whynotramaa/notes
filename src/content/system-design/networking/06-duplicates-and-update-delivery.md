@part VI | Idempotency, polling and push | We give repeated messages a predictable meaning. A disconnected client cannot tell whether a command committed. We will separate idempotent effects from polling and push delivery. | where:6

## 26. A lost reply creates uncertainty about the effect

The scorer submits a correction. Heron commits it, then the connection closes before the scorer receives the reply. The scorer knows the operation did not finish visibly, but it does not know whether the effect happened. A second request can be necessary for recovery while also risking a second effect.

**Idempotency** means repeating the same intended operation produces the same intended effect as applying it once. It does not require every response byte to match, nor does it mean the operation ran no code on later attempts. A repeated request can validate, look up a recorded result, and return that result without applying the score correction again.

Consider two payload meanings. 'Set the total to 10' can have an idempotent effect if all relevant preconditions and concurrent-write rules are defined. 'Add 10' normally changes the total again each time it is applied. Neither phrase alone solves a lost reply under concurrent updates; an operation identity and version contract make the intended command explicit.

@fig sd_networking_set_add | Illustrative repeated effects on a starting total of zero. Command identity can make a non-idempotent arithmetic action safe to retry as one operation.

### Intended effects and incidental work

A retried request can create another log entry or increase a retry metric while its business effect remains one score correction. Specify what the guarantee covers. If the command charges a payment provider or sends an email, those effects need their own duplicate handling rather than being dismissed as incidental logging.

A timeout can occur before acceptance, while the effect is in progress, or after commit. The client should use the same command key to recover from every uncertain attempt. A freshly generated key tells Heron that this is a different operation.

## 27. Record identity and outcome in one commit

Heron accepts a **command key**, a stable identifier for one intended operation. It records that key, a payload fingerprint, the authorized scope, and the result. The **payload fingerprint** is a representation that lets the service detect whether another request with that key describes the same command. Its design must avoid treating differently meaningful requests as equivalent.

The score change and command result must share an atomic commit boundary. If the service commits the score first and the key later, a crash between them leaves an applied effect with no deduplication evidence. If it records success first and the effect later, a crash can leave a recorded success for a change that never occurred. Separate commits create opposite incorrect histories.

@fig sd_networking_commit_gap | Either order of separate commits has a crash gap. The key and protected effect belong in one transaction.

A unique constraint on the scoped command key lets the database arbitrate concurrent duplicates. A preliminary 'key not found' read is insufficient: two requests can both observe absence. The second insertion must conflict with or wait for the first transaction, then recover its committed outcome or retry after its rollback.

@fig sd_idempotency_state | The uniqueness check, protected state change, and stored result share the same commit boundary.

### A concrete recovery trace

Request A claims key K and starts the correction. Request B arrives with K while A is not finished. B must not independently apply the effect. Under the chosen database protocol it waits, observes a pending operation, or retries after a conflict. When A commits, B verifies the fingerprint and returns the stored result. If A rolls back, a later attempt can legitimately acquire K and apply the command.

The service returns a conflict when K is reused with a different command meaning. Silently returning the earlier result hides a client error. A key should also be scoped appropriately so one user's operation cannot retrieve another user's private result merely by guessing the identifier.

## 28. Retention and external effects limit the guarantee

A deduplication record consumes storage and cannot be removed without changing the retry contract. If Heron forgets K and a delayed retry arrives, that retry can look new. Choose a supported retry window and retain enough evidence through it. Expiring a response payload may be acceptable while keeping a compact identity tombstone, depending on the product contract.

For an illustrative exercise, Heron supports retries for 24 hours and stores identity evidence for 48 hours. A retry at hour 12 can recover the recorded operation; one at hour 36 is outside the declared client retry window even though evidence may still be present. The extra retained interval is an assumed policy margin, not a proof against arbitrary delayed requests.

@fig sd_networking_key_retention | Illustrative retry and retention windows. The supported client window must fit within the evidence policy.

### A local key cannot atomically wrap every remote action

Suppose a notification worker sends an email, then crashes before recording success in Heron's database. Repeating the worker may send another email. A local transaction cannot include the provider's unrelated commit just because the application opened it first. The provider needs an idempotency contract, or Heron must accept duplicates and reconcile using a suitable delivery model.

For a recoverable score event, Heron can commit an outbox record with the score change and publish it later. Publication may repeat; consumers still identify events and avoid repeated business effects. Idempotency belongs at every uncertain effect boundary, not merely at the first public HTTP endpoint.

:::warn Watch out
Do not call a key table 'exactly once' without naming the protected effect, retention window, and atomic transaction. A remote provider and an expired identity record can both leave an unprotected boundary.
:::

## 29. Polling, long polling, and push spend different resources

A viewer wants to know when the score changed. **Polling** asks repeatedly at a chosen interval. It is simple to recover because each request can fetch a current snapshot, but empty checks consume request capacity. Under Heron's illustrative 50,000 viewers and 5 s interval, polling creates $50,000/5=10,000$ requests per second even before counting ordinary API demand.

If event arrival is uniformly distributed relative to that polling phase, the wait to the next poll is uniform from zero to 5 s. Its mean is $5/2=2.5$ s. That calculation depends on the arrival-phase assumption; synchronized events, correlated polls, and failed requests change the observed delay.

@fig sd_poll_cost | Illustrative repeated-check rate. The live audience produces more polling demand than Heron's ordinary API peak.

**Long polling** holds one request until a suitable event or timeout, then the client opens another. It removes many empty short requests but holds request or connection state while waiting. With one outstanding wait per viewer, the illustrative audience can have 50,000 held requests. Timeout and reconnect bursts still generate traffic.

**Push** sends updates over an established channel such as SSE or WebSocket. It avoids asking repeatedly whether anything changed, but it requires connection ownership, bounded buffers, subscriptions, and recovery. Polling can recover with a fresh snapshot; push must also explain a missed interval. Neither choice eliminates the events' delivery bytes.

@fig sd_networking_delivery_resources | Polling spends repeated requests; held and persistent paths spend waiting state. The figures show different units rather than comparing them as bar lengths.

### Choose using the useful update contract

A feed of replaceable current snapshots can coalesce intermediate versions for a slow viewer. A transaction ledger cannot discard events the same way. Decide whether the client needs every change, the latest state, or a bounded-delay notification before choosing a transport.

:::story Picture this
You can repeatedly phone a shop to ask whether an order is ready, stay on hold until it is ready, or ask the shop to call you. The methods spend repeated calls, waiting lines, or callback records. None changes how much work the shop needs to finish the order.
:::

:::interview Interview lens
**"Can I safely retry a POST after a timeout?"** Only when the application's effect is duplicate-safe under the declared retry contract. I would preserve the original operation key, record its effect and result atomically, reject payload mismatches, and check retention. A method label cannot resolve whether a remote effect already committed.
:::

:::key In one breath
A lost response leaves an uncertain effect. Stable identity plus an atomic effect-and-result record makes a supported retry recoverable. Retention and remote actions define the limits of that guarantee. Polling, long polling, and push shift resource costs while preserving the need for an update and recovery contract.
:::

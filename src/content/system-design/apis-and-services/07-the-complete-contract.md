@part VII | Case study: one API end to end | We assemble the public request and its delayed consequences. A useful API explains what is known after each response and what the client should do next. We will trace a correction, its uncertain reply, downstream publication, and the limits that keep the whole flow operable. | where:7

## 28. One accepted correction has several identities

A scorer opens m7 at revision 7 and sends correction K conditional on that revision. The public request contains caller identity, resource identity, command identity, and observed resource version. Each answers a different question. A service name or connection identifier cannot replace any of them.

The gateway admits the bounded request and forwards trusted caller context. The score service verifies the scorer assignment, then executes a local transaction. It inserts scoped command K, checks revision 7, updates the score to revision 8, stores K's outcome, and writes event E to the outbox. A conflicting use of K is rejected; a duplicate with the same meaning retrieves K's stored outcome.

@fig sd_api_full_command | Illustrative command K and event E remain stable while state changes from revision 7 to 8.

### Read the response precisely

A successful response proves that the authoritative correction committed under the selected database contract. It does not prove every replica, cache, or subscriber has revision 8. Heron can return the committed revision and a suitable read link, letting the client request an observation at least as new as its command result where supported. Derived views can report their own applied revision.

If the reply is lost, the scorer retries K without changing the payload or inventing another key. The service returns K's result at revision 8 even if another command has since created revision 9. As promised in Part III, operation recovery and current-state observation are separate. A later fresh read can describe revision 9 without rewriting K's history.

## 29. A failure matrix is more useful than a generic retry flag

The same HTTP timeout can occur before admission, during execution, or after commit. A **failure matrix** lists observable states, what can already have happened, and the safe next action. It turns 'retry on error' into a contract that a client can implement.

| Observation | Possible authoritative state | Next action |
|---|---|---|
| Shape rejected | No command effect | Correct input |
| Permission refused | No permitted effect | Resolve permission |
| Capacity refused before acceptance | No accepted work | Retry within policy |
| Version conflict recorded | Earlier observation is stale | Read and reconcile |
| Reply lost | K may have committed | Recover using K |
| Derived view behind | Score can already be current | Read suitable authority or wait |

@fig sd_api_failure_matrix | An observed failure determines a recovery path only when the acceptance boundary is known.

The server should not claim no effect after an uncertain database commit. It can expose a pending operation or require recovery through the stable key. Conversely, clients should not keep retrying a deterministic invalid request. Classifying refusal, conflict, uncertain acceptance, and delayed observation reduces wasted work and accidental duplicate commands.

### Error responses are versioned too

A client can depend on a machine-readable error code, the availability of a recovery link, and whether a retry retains identity. Changing a version-conflict error into an automatic overwrite changes semantics even if the success JSON stays the same. Test error and timeout flows in the contract suite, not just successful responses.

:::warn Watch out
Do not use a single `retryable=true` field for every failure without defining the retry action. Repeating the same command, submitting a reconciled new command, and reading status are different operations with different identities.
:::

## 30. Count the contract's retained and induced work

K's durable record enables recovery but consumes storage. Assume, purely for this sizing exercise, every peak-rate request is a command and that peak lasts the full illustrative day. At 1,000 commands per second, the day contains 86,400,000 command records. At an assumed 300 bytes per record, that is 25,920,000,000 payload bytes before indexes, replication, and cleanup overhead. This deliberately differs from Heron's average workload to test a stated worst-case scenario.

$$
B = \lambda T b
$$

Read this as retained payload bytes $B$ equal command rate $\lambda$ times retained seconds $T$ times bytes per command record $b$. Each input is an explicit assumption. Increase retention for long-lived retries and storage increases proportionally. A shorter retention policy must also shorten the supported recovery promise or preserve a smaller tombstone proving that the effect already happened.

@fig sd_api_retained_work | Illustrative full-day peak scenario. Payload storage and recovery support share a retention decision.

Count induced downstream work separately. A 20-command batch with five dependent reads per command creates 100 reads. A local rate limit on HTTP requests cannot see that amplification unless the operation has a cost rule. A subscriber that retries every failed event adds load beyond the original command rate. Capacity checks need units that match the resource they protect.

:::note A command record is not a business audit
A compact recovery record can store identity and outcome without storing every field needed for a long-term audit. Retention, privacy, queryability, and evidence requirements differ. Define both uses explicitly if the same table is intended to satisfy them.
:::

## 31. Defend the complete API without naming products

At the whiteboard, start with the user's intended operation and the invariant it changes. Draw the authority, the local transaction, the recovery identity, and any delayed view. Only then select protocols and deployment boundaries. That explanation works for a new domain because it follows state and uncertainty rather than memorized boxes.

Heron's correction contract supports an atomic resource precondition and durable command recovery. Its service boundary keeps match state and event intent local. The outbox publishes E to independently progressing readers. Admission limits bound induced work, and the client distinguishes a committed correction from delayed media and search updates. Each component now has an observable job.

@fig sd_api_contract_card | The complete contract connects intention, authority, effect, observation, and recovery.

This chapter does not decide every token format or rate-limiting algorithm. Security and rate limiting have their own chapters because their details change the trust and admission guarantees. The reliability chapter next follows the same request through dependency failure and recovery budgets. Carry K, its authoritative result, and its retained progress into that discussion.

:::story Picture this
A repair shop gives you a claim ticket when it accepts a device. The ticket lets another clerk find the same job after a telephone call drops. The acceptance receipt, completed repair, invoice, and notification are related records, but each proves a different stage of work.
:::

:::interview Interview lens
**"Walk through a command whose response is lost."** I preserve the same operation key and payload, then recover at the authority that recorded the effect. Its result names the original committed revision, even if current state has advanced. I separately check derived-view progress and never turn a lost reply into a new business command automatically.
:::

:::key In one breath
The complete API states intention, permission, atomic effect, observation, and recovery. A public success names its commit boundary, while delayed views report their own progress. Failure classification tells clients whether to correct, reconcile, recover, or wait. Retained identity and bounded induced work keep that contract supportable during failure.
:::

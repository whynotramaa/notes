@part VI | Sagas and distributed transactions | We recover a business action whose steps belong to different authorities. A timeout between commits can leave the action partly complete. We will build durable workflow state, compensations, and an outbox before comparing orchestration with choreography. | where:6

## 22. A distributed transaction starts with a partial-commit problem

Heron sells a limited clip-processing credit and then schedules the clip. The credit service commits a debit, but the media service is unavailable. A **distributed transaction** coordinates changes across separate authorities so the intended overall rule survives partial failure. The problem exists even when every individual service uses a correct local transaction.

Use an illustrative account with 10,000 cents and a 2,500-cent debit. The first local commit leaves 7,500 cents. Scheduling can then fail while that debit remains durable. Rolling back the caller's in-memory function does not roll back the remote account. The caller needs to discover whether scheduling happened, retry with stable identity, or perform a supported compensating action.

@fig sd_api_partial_commit | Illustrative debit commits before scheduling fails. A caller exception cannot erase a remote commit.

### Choose the required cross-service guarantee

One choice is a coordinated atomic commit protocol when participants and operating requirements support it. Another is a workflow that permits intermediate states and later resolves them through completion or compensation. Those are different contracts. Calling both 'a transaction' without specifying visibility, waiting, and recovery conceals the decision the reader needs to make.

A workflow may expose `pending`, then `completed` or `compensated`. During `pending`, a client cannot assume both effects exist. A timeout should return an operation identifier the client can query rather than instructing it to create a new debit blindly. The operation identity has the same recovery purpose as the command key in Part III, now spanning several local effects.

:::story Picture this
A travel booking office reserves a room and then a train seat. If the train reservation fails, the office must cancel the room reservation through the hotel's rules. Closing the booking clerk's notebook does not erase the hotel's confirmed booking.
:::

## 23. A saga records a sequence of local commits

The processing credit can be reserved before a final debit, and the reservation can later be released. A **saga** is a business workflow of local transactions with defined compensating actions for steps that need to be undone. Compensation performs another business action. It is not a database rollback across all earlier commits.

Heron's workflow begins with a durable `requested` record. It reserves one of 10 illustrative credits, leaving nine freely available, then asks media to create a gated job J. If media confirms J, it finalizes the debit and marks the workflow complete. If media permanently refuses J and no job exists, it releases the reservation, returning available credits to 10, and records compensation.

@fig sd_api_saga_states | Illustrative reserve, schedule, and resolution states. Each transition is recoverable from durable workflow state.

### Uncertainty needs observation before compensation

Suppose the create-job reply times out. The media service may have created J. Immediately releasing the credit could let the user receive free processing. The workflow first queries or retries the same identified create operation. Its receiver returns the earlier result if J exists. Only a definitive refusal or a business rule for cancellation allows the workflow to proceed toward compensation.

Each step needs a stable key derived from the workflow and step identity. Retrying the reservation must not reserve another credit. Retrying the release must not add another credit. The state machine records which effect has been confirmed so a crash after a step can resume without inferring progress from a worker's temporary memory.

### Hold, finalization, and execution share an ownership rule

Creating J reserves scheduling state; it does not authorize processing yet. Credit finalization atomically changes reservation R from `held` to `finalized` and records that its credit pays for J. A concurrent release or expiry can change only a still-held reservation. If release wins, finalization rejects and the gated job remains unexecutable until the workflow resolves or cancels it. If finalization wins, a delayed release cannot recreate the spent credit.

The media worker starts only after it has durable confirmation of that finalized entitlement for J. The credit service can publish confirmation through its outbox, and media records the event identity with the transition that opens J's gate. If confirmation is delayed, the job waits. If finalization's reply is lost, the workflow recovers the same finalization result before deciding to cancel or release anything. This is a second local transition to recover, not an assumption that job creation and charging share one transaction.

@fig sd_api_entitlement | Illustrative competing reservation outcomes, computed in resumption-numbers.py. Only a durably confirmed finalized entitlement permits J to run.

AWS's saga description distinguishes local steps, compensating steps, and the coordinator's recovery duties. The Heron state trace is an illustrative design using that distinction. [Saga orchestration pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html).

## 24. Compensation has its own failure and concurrency rules

The workflow releases the reservation but loses the release reply. A naive retry increments the credit count again. **Compensation** is an explicit action that restores the business outcome as far as the domain permits. It needs identity, authorization, and recovery just like the forward action.

Store reservation R with `held`, `finalized`, or `released` state. Releasing R performs an atomic transition from `held` to `released` and restores its associated credit once. A repeated release finds `released` and returns the recorded result. A release finding `finalized` cannot restore credit; a refund would be a separate identified business operation. It does not infer how much to restore from the current account balance because other purchases may have changed that balance in the meantime.

@fig sd_api_compensation | Illustrative repeated release changes a named reservation once; it does not reset the whole account to an old snapshot.

### Not every action has an inverse

An email already delivered cannot be unsent. A published score may already have informed spectators. The compensating action might be a correction notice or a refund rather than erasure. State this before choosing a saga. If exposing an intermediate effect is unacceptable, the domain may need reservation, delayed publication, or a different atomic boundary.

A compensation can remain pending because its dependency is down. The workflow needs an owner, bounded retries, visible age, and reconciliation. Marking the workflow failed and forgetting it leaves credit stranded. A terminal API failure and a terminal business outcome are different facts when background recovery continues.

:::warn Watch out
Do not compensate by restoring an entire old row. A later valid purchase may have changed that row. Compensate the named effect under a current invariant, such as releasing reservation R, so unrelated work remains intact.
:::

## 25. Orchestration keeps explicit workflow progress

The process needs to know whether credit was reserved and whether job J exists. **Orchestration** uses a coordinator that records workflow state and issues the next command. It makes progress visible in one state machine while adding a component that must recover its own commands and decisions.

A durable coordinator loads workflow W, finds `credit_reserved`, and issues `create_job(W, media_step)`. It records the confirmed reply before advancing. If it crashes after the job commits but before the reply is stored, recovery sees the same earlier state and repeats the same command identity. The media authority returns the existing job. The coordinator then advances without creating another one.

@fig sd_api_orchestration | One durable coordinator controls step order; retries reuse each step's identity.

### The coordinator is a role, not one irreplaceable process

Multiple coordinator workers can share durable workflow storage, but they need an atomic claim or version check so two workers do not make incompatible transitions. The commands still need duplicate-safe receivers because ownership changes and lost replies can overlap. A lease on coordinator work does not substitute for idempotency at the media or credit authority.

The coordinator can be easier to inspect when workflows have several alternate paths. Its stored record provides an explanation of what remains pending. It can also become overly coupled to every service's internal model if commands expose implementation details. Keep commands expressed as business operations with supported result and compensation contracts.

## 26. Choreography distributes progress through events

The credit service emits `CreditReserved`, and the media service reacts by creating the job and emitting `JobCreated`. **Choreography** lets participants react to events without one central component issuing every step. It can fit independent reactions, but the overall workflow still needs a defined success rule and someone responsible for stalled histories.

Trace the same illustrative workflow W. Credit commits the reservation and durable event intent. Media receives `CreditReserved(W)`, records its event identity with gated job J, and publishes `JobCreated(W,J)`. Credit atomically finalizes the still-held reservation after observing that event and publishes confirmation for J. Media records the confirmation before permitting execution. A duplicate reservation event returns the existing media result. A missing event leaves the workflow pending until publication or reconciliation recovers it.

@fig sd_api_choreography | Event-driven participants still need correlation, duplicate-safe effects, and a visible completion rule.

### Count the hidden coupling

Participants depend on event meaning, timing, and the business states they observe. A change to `CreditReserved` can affect several consumers even though no synchronous caller compiles against the handler. Version schemas deliberately and preserve semantic compatibility. A graph of event handlers can contain cycles and cause repeated work if participants fail to distinguish a new action from their own earlier effect.

Orchestration and choreography can coexist. A coordinator can manage the credit workflow while independent analytics consumes its completion events. Choose the mechanism per workflow. Replacing a coordinator with events does not remove the need for progress tracking; it changes where that tracking lives.

:::note Avoid a global event soup
An event needs an owner, a meaning, a schema policy, and a replay expectation. An unowned stream of arbitrary row changes can force every consumer to infer business meaning and rebuild state differently. Use row-level change streams deliberately when that is the intended contract.
:::

## 27. An outbox closes the state-to-publication gap

The score service updates a match, commits, and crashes before sending `ScoreCorrected`. The database is right, but every derived view stays old. A **transactional outbox** stores publication intent in the same local transaction as the protected business state. A later publisher reads that intent and retries delivery until it can record suitable progress.

Heron commits match revision 8 and outbox event E together. Before commit, neither is visible under the local transaction contract. After commit, both survive recovery. A publisher sends E and receives broker acceptance, then marks E sent. If it crashes before that last mark, another publisher can send E again. The outbox prevents the missing-intent gap; it permits duplicate publication.

@fig sd_api_outbox_windows | Match state and event intent share one commit, while publication and sent status remain separate recoverable actions.

The receiver records E's identity with its own effect or rejects an already-applied revision under a suitable rule. Deleting outbox rows needs a retention and audit policy. Backlog age reveals when accepted score changes have not yet reached downstream views. A publisher reading rows without a safe ownership or progress rule can spend capacity on repeated sends even if receivers remain correct.

The outbox pattern described by AWS addresses a local database write followed by message publication. Heron's retry trace shows why consumers still need duplicate-safe effects. [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

:::interview Interview lens
**"Does an outbox give exactly-once delivery?"** It makes business state and publication intent atomic inside the local database. Sending the event and recording delivery progress are another failure boundary, so a send can repeat. I would retain event identity and make the receiving effect safe under duplicates, then monitor oldest unsent intent.
:::

:::key In one breath
Remote commits cannot be undone by a caller exception. A saga records local steps and named compensating effects, each with its own identity and uncertainty handling. Orchestration centralizes decisions while choreography distributes reactions. An outbox commits state and publication intent together, then recovers duplicate-capable delivery.
:::

@part IV | Heartbeats, leases and fencing | We distinguish missing contact from a stopped process. A healthy replacement can overlap with an old worker that resumes. We will build safe takeover using suspicion, leases, and resource checks. | where:4

## 13. Heartbeats measure recent contact

Heron's publisher sends a heartbeat and then pauses during garbage collection. The coordinator receives nothing while the publisher still exists. A second publisher can start before the first resumes. The challenge is not merely finding a replacement. It is ensuring that the old process cannot corrupt work after the replacement becomes active.

A **heartbeat** is a periodic signal of recent contact. A **failure detector** converts missed signals into suspicion according to a rule. It can suspect a crashed process, but it can also suspect one delayed by scheduling, network congestion, disk stalls, or an overloaded receiver. In an asynchronous model, a finite silence cannot establish which explanation is true.

Assume an illustrative heartbeat period of 1 second and a suspicion threshold of 3 seconds since the last receipt. A signal received at time 0 gives a suspicion deadline at time 3. A process paused until time 4 is suspected despite resuming later. Lowering the threshold shortens detection but makes shorter innocent delays trigger the same action.

The threshold must be tied to observations and the consequences of suspicion. Suspecting a read-only worker can remove it from routing. Suspecting a writer can trigger a takeover protocol with a new authority epoch. Neither action should assume the old process has ceased execution. The protected resource still needs a way to distinguish old and new authority.

Monitor both detection delay and false takeovers. Repeated leadership churn can make a cluster unavailable even while most machines remain alive. A detector is useful input to a protocol, not the safety proof of that protocol. We will make this distinction visible in the ownership record and resource-side checks in the following sections.

@fig sd_ds_trace_13 | The heartbeat trace moves from recent contact to suspicion without proving the worker is dead; orange marks the resumed old worker that can still issue requests.

:::story Picture this
A building changes its entry code while an old employee sleeps. Printing the new code at headquarters does not update the door. The door rejects the old code only after its own authority record changes.
:::

## 14. A lease expires while its holder is paused

Publisher A acquires a lock, checks it, and pauses just before writing. Its permission expires while it is paused. Publisher B acquires the role and writes a newer score. A then resumes at the instruction after its earlier check. That old check cannot know what happened during the pause.

A **distributed lock** coordinates competing processes through shared state. A **lease** grants ownership for a limited interval and requires renewal. The service can expire a lease and reassign ownership, but it cannot reach into a paused client and remove instructions already queued there. Time-limited permission therefore needs an enforcement story at the resource receiving the effect.

Assume A receives a 3-second lease at time 0 and pauses at time 2. The coordinator expires it at time 3 and grants B ownership. A resumes at time 4, which is 4-3=1 second beyond the illustrative expiry. Even if A checks its clock on resumption, another pause can occur between that check and the external write.

Some lease protocols rely on bounded clock drift, bounded communication delays, or a carefully chosen conservative client deadline. Those are assumptions to state and test, not facts created by adding TTL to a key. A lease held through a coordination service also depends on that service's session and quorum behavior. Different APIs expose different boundaries.

Heron therefore treats a lease as the way to propose who should work, while the storage resource verifies an authority value with every protected mutation. A client should stop on lost ownership, but safety must survive a client that resumes late. This requirement is the reason the next section installs authority where the write will happen.

@fig sd_ds_trace_14 | The lease trace expires A's permission at time 3 while A is paused; orange marks its resumed request, which lacks authority after B takes over.

:::note Issuance and installation differ
A coordinator can issue token 8 while storage still remembers 7. The takeover boundary must include processing the newer authority at the resource or a stronger synchronous validation rule.
:::

## 15. Install fencing authority at the resource

A holds token 7 and pauses. B obtains token 8 from the coordinator. It is tempting to say that all of A's future writes are now rejected. That skips a step. If the storage resource has not received or validated token 8, a rule comparing against the highest token it has seen still knows only 7.

A **fencing token** is an increasing authority value carried to a resource, which atomically checks it with the protected effect. Under the highest-seen scheme, the resource stores the greatest processed token. A write carrying a smaller token fails. An equal token can permit more work by the current owner, with command identity providing a separate duplicate check.

Heron's trace starts with stored token 7. The coordinator issues 8 to B. B sends an authority-install operation to storage; storage atomically persists highest token 8 and acknowledges it. Only after that acknowledgement does the takeover claim storage protection. A's delayed write carrying 7 now compares 7<8 and fails before changing the score.

If A's token-7 write arrives before storage processes token 8, highest-seen fencing alone can accept it. This is not a contradiction; the resource's authority transition has not happened yet. A stronger immediate-revocation contract needs synchronous validation against current authority, or a coordinated cutover that waits for resource installation before exposing the new owner as active.

The comparison and effect must share one atomic boundary. Checking in the application, then making an unchecked external write recreates a race. Every protected path must enforce the rule, including retries and background workers. [The Chubby paper](https://research.google.com/archive/chubby-osdi06.pdf) discusses related resource validation with lock sequencers; Heron's increasing-number scheme is an illustrative design.

@fig sd_ds_trace_15 | The fencing trace installs token 8 at storage before takeover; orange marks the delayed token 7 write rejected before it changes the score.

:::warn Check and effect must be atomic
An application check followed by an unchecked write leaves a pause window. Enforce authority where the protected effect commits.
:::

## 16. Token order and command identity solve different problems

B legitimately owns token 8 and sends the same correction twice because its first reply disappears. Both requests carry current authority. Fencing therefore cannot decide whether the second request is a duplicate. Authority and operation identity answer separate questions, and Heron needs both on the same protected write path.

An **authority epoch** identifies an ownership generation rather than a specific command. Heron accepts token 8 for commands `c9` and `c10`, but records each command independently. Reusing `c9` returns its existing outcome. Reusing `c9` with a different payload fails validation, because otherwise one identity would refer to incompatible intended effects.

Start score 10 with highest token 8 and no `c9`. The first `c9` adds 1 and atomically records score 11 plus the result. A second `c9` returns 11 without another increment. A different `c10` can add 1 and produce 12. An old token-7 request is rejected regardless of whether its command is new.

The protected transaction can first reject a token below stored authority, then compare or insert the unique command record, then apply the effect. The precise ordering of duplicate-result lookup and stale-authority rejection is an API choice, but no stale owner may create a new effect. Keep retries distinguishable from fresh work and document whether old owners can retrieve prior results.

Deduplication records require retention. Deleting one while an old request can still return turns a replay into apparently new work. A recovery design can bound the retry lifetime, retain a tombstone, or use durable source identities. None of these questions is answered by the lock TTL. At a whiteboard, label the authority field and command field separately.

@fig sd_ds_trace_16 | The rows separate token order from command identity; orange marks the old token 7 owner, which cannot create a new effect.

@fig sd_distributed_systems_fence | The state history shows coordinator issuance, resource installation, and the stale write check; orange marks the storage-side rejection that makes takeover real.

:::interview Interview lens
**"Does a lock stop an old process?"** No. A lease coordinates intended ownership but a paused holder can resume. I would identify the resource-side rejection rule and the step that installs current authority there.
:::

:::key In one breath
Heartbeats prove recent contact and timeouts create suspicion. A lease is conditional permission under timing assumptions. A resumed old holder remains able to run code. Fencing rejects stale authority only after the resource has processed the higher authority.
:::

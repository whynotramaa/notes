@part VIII | Case study: one replicated write | We combine authority, ordered history, and the user-visible result. A copied record alone does not explain recovery or observation. We will trace one correction, replay its failures, and count its boundaries. | where:8

## 29. Trace one scorer correction end to end

The scorer changes Heron's official score from 10 to 11 using command `c9`, expected score version 7, and current authority epoch 8. We can now trace each decision without hiding it inside a box named 'database'. The command carries both intent and the conditions under which the user wants that intent accepted.

The API authenticates the scorer and checks match permission. The current leader verifies authority at the protected state boundary, checks command identity and payload, and orders the command in its log. For the illustrative Raft group, the leader appends a current-term entry and waits for the protocol's required majority of 2 voters out of 3.

After commitment, state-machine application checks the expected version and updates score 11 with the new version, the recorded `c9` result, and outbox event `e9`. These facts share the authoritative effect boundary. A prior `c9` with matching payload retrieves the same result. A conflicting payload or stale expected version returns the defined rejection rather than another silent change.

The reply carries a required history position suitable for the scorer's next read. A follower can serve that read only after its corresponding state includes the position and the read path satisfies the promised authority contract. Other viewers may use explicitly older public snapshots if their contract permits them. Event delivery proceeds separately through the outbox relay.

This trace gives each component a reason to exist. Identity prevents a retry from becoming another correction; authority rejects obsolete owners; commitment preserves accepted history under the failure model; application creates the visible result; a read fence preserves the session promise. Remove a component only after weakening the relevant promise explicitly, rather than hoping another box happens to provide it.

@fig sd_ds_trace_29 | The end-to-end trace authenticates c9, commits it on two of three replicas, applies the score and event, and reads at a required position; orange marks the eligible observation.

:::story Picture this
A receipt says an instruction was accepted, a ledger page shows it applied, and a courier carries the resulting notice. Losing the courier receipt does not erase the ledger, and repeating the courier trip need not repeat the receiver action.
:::

## 30. Replay crashes at the important boundaries

A design can look correct when every arrow returns on time. Move the crash marker between arrows and the unanswered questions appear. Heron's command can disappear before acceptance, remain uncertain after commitment, or leave external publication pending. Each case needs a recovery action that preserves the same user intent.

Before commitment, a proposed log entry is not yet an accepted score change. It may later commit or be replaced as an uncommitted suffix. The client's deadline cannot determine that outcome. A retry with `c9` lets the authoritative state decide whether to propose new work or return an existing accepted result once the protocol resolves the history.

After commitment but before response, the accepted command survives under the consensus and storage assumptions. A suitable new leader retains committed history, applies it if necessary, and finds `c9`'s result. Heron returns score 11, rather than incrementing to 12. This is the same identity mechanism from Section 4, now attached to a leader-recovery trace.

After the outbox event is sent but before delivery is marked, the relay can repeat `e9`. The consumer deduplicates within its effect boundary. A consumer crash after its own commit but before acknowledgement similarly leads to repeated delivery and the same recorded effect. These are different uncertainty gaps and should not share one vague recovery arrow.

Fault injection should cover these boundaries with invariant checks, not just process restarts. Inspect accepted command count, score version, recovered log prefix, and downstream event effects. Preserve durable storage when testing a crash model that assumes it survives. A test that destroys every copy exercises another disaster model and needs a separately stated recovery plan.

@fig sd_ds_trace_30 | The crash trace distinguishes uncertainty before commit, after commit, after send, and after consume; orange marks consumer deduplication after a lost acknowledgement.

:::note One job per mechanism
Identity handles retry effects, fencing handles ownership generations, commitment handles accepted history, and read barriers handle observation. Their contracts can share storage without becoming interchangeable.
:::

## 31. Snapshots preserve a named history boundary

A follower has been offline long enough that replaying every old command would be wasteful. Heron sends a snapshot of current state, then the commands after it. If the snapshot and remaining log do not agree on their boundary, the follower can skip changes or apply a change twice. A copy of rows alone does not identify that boundary.

A **snapshot** records state corresponding to an agreed history position, with metadata needed to continue the protocol. In a replicated state machine, it needs a compatible last-included index and term, plus application state such as deduplication records that still affect future behavior. A log suffix must begin after that included prefix.

Suppose a snapshot contains applied state through index 8, including score 11 and `c9`'s result. Entries 9 and 10 remain available. The recovering follower installs the snapshot atomically or by a crash-safe procedure, then applies 9 and 10 in order after they are committed. Replaying 8 again would be wrong unless the entire state application were explicitly duplicate-safe.

Snapshot transfer may be interrupted. An implementation needs staging, verification, and a clear installation point so a partial file never becomes accepted state. The sender must retain enough later history or restart from a newer compatible snapshot if the follower falls behind during transfer. Compaction policy therefore affects how much offline time can be recovered efficiently.

For Heron, recovery metadata includes score state, retained command results, outbox progress under its defined policy, and the protocol's snapshot boundary. It does not claim to snapshot a remote broker in the same atomic instant. Match each snapshot to the history it covers, and use external identities to reconcile the histories outside that boundary.

@fig sd_ds_trace_31 | The snapshot trace includes entries through 8 and resumes with 9 then 10; orange marks the verified crash-safe boundary.

:::warn Keep snapshot identity state
Dropping deduplication records from a snapshot while old retries remain possible can create repeated effects after recovery. Snapshot all application state that future commands depend on.
:::

## 32. Count the copies and the limits of the promise

Finish the whiteboard by counting what the design actually stores and what can fail. Heron's illustrative event stream produces 20 events each second, with 200 payload bytes per event. Replication multiplies stored copies, while viewer fan-out multiplies deliveries. Those are different budgets and must not be conflated simply because they contain the same event.

One logical event uses 200 payload bytes. Three replicas store 3 times 200, or 600 payload bytes before log framing and indexes. The stream produces 20 times 200, or 4,000 logical payload bytes per second; three stored copies total 12,000 payload bytes per second. The 50,000-viewer path produces 200,000,000 payload bytes per second of deliveries instead.

The three-voter group requires 2 votes and can continue under suitable timing with 1 unavailable voter and 2 communicating eligible voters. The separate 5-second asynchronous-copy gap exposes 100 events and 20,000 bytes on that copy. It is not Heron's consensus loss guarantee, and it is not proof that every failover loses those events.

The complete promise relies on non-Byzantine participants, correct protocol behavior, the configured durable acknowledgement boundary, and an available connected quorum for progress. Fencing adds a separate resource assumption: the greater epoch must be installed or validated and checked atomically with the effect. Client retries rely on retained identity records and stable payload meaning.

We have followed one authority domain and a small replicated history. We have not implemented every consensus detail, derived Byzantine agreement, or made a distributed transaction across arbitrary external services. The next boundary is the replaceable copy used to save work. The caching unit will show how a faster read path can remain inside these established authority and observation contracts.

@fig sd_ds_trace_32 | Illustrative storage arithmetic counts 600 payload bytes for three copies and 200,000,000 delivery bytes per second for 50,000 viewers; orange marks the delivery cost.

@fig sd_distributed_systems_full | The sequence follows command, replication, commit position, and a read constrained by that position; orange marks observation after the write is safe.

:::interview Interview lens
**"Where does the guarantee stop?"** I would draw every atomic boundary and name its failure assumptions. A replicated history protects its own commands; external delivery still needs durable intent, compatible recovery, and receiver identity checks.
:::

:::key In one breath
A complete write names permission, authority, commitment, application, and read visibility. Stable command identity resolves uncertain replies without inventing a second correction. Snapshots and replica counts require compatible recovery assumptions. External delivery keeps its own durable intent and duplicate checks.
:::

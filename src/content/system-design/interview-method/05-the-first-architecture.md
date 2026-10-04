@part V | High-level architecture | We build the simplest complete request path. Every box introduces a job and a failure boundary. We will separate control and bytes, choose synchronous work, and identify owners. | where:5

## 17. Responsibilities of each component

The diagram contains an API gateway, two services, Redis, Kafka, and several databases. The candidate cannot explain why the request crosses each. A **component responsibility** is the necessary job performed at a boundary.

Heron needs a public route, a command authority, a read path, durable metadata, object bytes, and live delivery. These jobs can share processes until a reason requires separation. For every arrow, say what is sent, whether it is synchronous, and which acknowledgement is returned. A queue belongs where durable delayed work or producer-consumer decoupling is needed, not wherever two boxes connect. A cache belongs where repeated safe reads justify the miss and freshness contract.

Replace the generic service box with its responsibility in the Heron flow. The command authority owns score transitions, the outbox preserves publication intention, and a gateway owns live connections and their bounded queues. An arrow names the payload, timing, and acknowledgement it carries. If a proposed service only forwards a request while sharing the same authority and failure policy, ask what operational requirement justifies that hop. Independent deployments may be useful, but they add failure and recovery states. A clear modular process remains a valid architecture when the workload does not require those additional boundaries.

@fig sd_interview_method_17 | Illustrative responsibilities of each component. Components and arrows earn their place through an owned job and necessary separation. Orange marks the operational reason required to justify another component boundary.

A box that only forwards the same request can add latency and another outage dependency without adding a needed guarantee.

:::story Picture this
A workshop foreman draws a station only when a named step needs a different tool, owner, or failure policy. Splitting one bench into two rooms adds a door, a queue, and a handoff even if the work remains coupled. The station boundary earns its keep only when the new control is worth those costs.
:::

## 18. Control paths and byte paths

A 5,000,000,000-byte upload sent through the API ties API capacity to media transfer. A **control path** handles metadata and permission; a **data path** carries the large payload.

The API creates an authorized upload session, while the client transfers parts directly to object storage. Under the illustrative 10,000,000-byte-per-second direct path, transfer takes 500 seconds. Under a 2,000,000-byte-per-second API path, it takes 2,500 seconds. These are size divided by assumed sustained rate, not product benchmarks. The API still verifies completion, object identity, checksum policy, ownership, and lifecycle state. Direct transfer removes application byte forwarding without removing the security and recovery work.

Follow a client that reports completion after losing its last upload response. The API checks the stored object and session relation rather than trusting that report or creating another clip. If the object is complete, it can recover the metadata transition; if not, the client retries missing parts under the existing session. The illustrated faster transfer removes API byte forwarding, but the API still owns authorization and publication state. A storage capability must be scoped to the intended object and operation. Separating control from bytes therefore changes capacity placement while preserving a concrete proof before the clip becomes usable.

@fig sd_interview_method_18 | Illustrative direct upload. The API grants the upload session while 5,000,000,000 bytes travel to object storage. Object validation precedes the metadata completion transition.

A client saying upload finished does not prove the object exists, is complete, or belongs to the authorized session.

:::note Control path versus byte path
Separate large-payload transfer from permission and metadata. Calculate the assumed transfer time and keep validation and recovery in the control path. Direct transfer changes byte routing, not the need to prove a complete authorized object.
:::

## 19. Synchronous and asynchronous boundaries

The scorer must know whether its update committed, but it need not wait for every notification. **Synchronous work** lies on the caller’s response path; asynchronous work continues from a durable intention after that response.

Keep invariant validation and authoritative commit before acceptance. Store downstream work intention with the commit, then let workers process notifications and projections. Return the committed version or a pending operation identity according to the contract. A queue acknowledgement only proves the broker’s documented acceptance, not the worker’s final effect. Choose asynchronous work when delayed completion is acceptable and a recoverable result can be queried. Without durable intention, moving work to a background task can lose it on restart.

An API can return promptly after acceptance because notification delivery is allowed to finish later. That design is safe only if the committed state contains the work identity and payload needed after the API disappears. A worker can then resume independently, and the caller can query a pending or completed status where required. If the user action promises publication before success, publication stays on the acceptance path or the response must explicitly describe a weaker state. A queue moves waiting, but it does not change the promised result automatically. Name the acknowledgement at each step to show exactly what the caller knows.

@fig sd_interview_method_19 | Illustrative synchronous and asynchronous boundaries. Delayed work starts from durable intention after the required synchronous commit. Orange marks recoverable work that continues after the response.

Fire-and-forget work in the request process can disappear when that process exits, even if the HTTP response succeeded.

:::warn Watch out
Put work before the response when the promised result depends on it. Move optional delayed work behind a durable intention, with status and recovery. State what acceptance proves at each boundary.
:::

## 20. Ownership and service boundaries

A payment service and a pass service both update the same payment status field. Their disagreement makes recovery harder than a single authority would. A **service boundary** assigns a coherent job and the authority for its state.

Separate services when independent ownership, workload, deployment, or fault containment justifies it. Keep an invariant together when separating it would require distributed agreement for every change. A modular monolith can preserve clear code boundaries while using one local transaction. If the workflow really crosses authorities, add durable commands, idempotency, and explicit reconciliation. Microservices are a deployment and ownership choice with network costs; they are not a necessary mark of a strong interview answer.

A score update and its expected-version check belong to the same authority even if the code separates validation and persistence modules. Splitting them across independently committing services creates a network race or a new agreement protocol. When separate payment and access authorities are required, describe their durable workflow and compensation instead of pretending a remote call is part of the local transaction. Compare operational reasons for the split with the extra pending states it creates. A modular monolith can still have explicit ownership inside one transaction boundary. Choose deployment after deciding what must commit together.

@fig sd_interview_method_20 | Illustrative ownership and service boundaries. Keeping an invariant local can avoid a cross-service recovery protocol. Orange marks modular ownership with a shared local transaction.

Independent deployments do not remove coupling if both services still depend on the same hidden schema or shared mutable fields.

:::interview Interview lens
**"How do you choose boundaries between components?"** Choose boundaries from state authority and operational reasons. Keep tightly coupled invariants local when possible. Explain the network and recovery costs of a split, and consider a modular monolith before distributed coordination.
:::

:::key In one breath
Give every component one necessary job. Keep authoritative commits and derived work clear. A high-level diagram is useful only when its arrows and acknowledgement boundaries can be explained.
:::

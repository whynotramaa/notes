@part VII | Deep dive: money and conflicts | We deepen the hardest correctness traces. Unknown outside effects and concurrent edits cannot be repaired by hoping. We will follow payment reconciliation, booking expiry, message receipts, and document transformation. | where:7

## 25. Payment timeout: the full reconciliation trace

The local payment record is pending. The provider confirms a charge internally, but the reply disappears. The local state is now unknown while the money effect may already exist. Recovery must preserve that distinction.

A worker queries by stable intent or repeats under the provider’s documented idempotency contract. It records the provider reference and atomically posts the local ledger effect under that identity. A webhook can arrive before the worker’s query response, so both observations pass through the same state transition and deduplication rule. If the outside effect conflicts with the intended amount or account, move to manual reconciliation rather than inventing a successful local result. Refunds are new identified operations with their own unknown-outcome trace.

The provider's confirmed charge exists while the local workflow still says pending because its reply disappeared. Keep that state queryable and do not create a new payment intention to escape it. The reconciler obtains the original provider result, records its reference, and commits balanced entries under the protected effect identity. If its own database reply disappears, the next reconciliation finds the same committed posting. A provider response that still reports unknown leaves the workflow unresolved rather than failed. This explicit uncertainty prevents a user retry or support action from generating another charge before the first intention's outcome is known.

@fig sd_practice_designs_25 | Illustrative payment timeout: the full reconciliation trace. A provider reference resolves the unknown charge before the local ledger commits once. Orange marks the confirmed provider reference producing the ledger effect once.

A retry with a new provider key can create a second charge. A timeout alone never justifies replacing the original intent.

:::story Picture this
A cashier sends one numbered payment slip to the card machine and waits for a receipt that never arrives. The cashier does not hand the customer a second slip; they look up the first slip's state and reconcile it with the bank. The slip number ties the attempt, provider result, and ledger entry together.
:::

## 26. Booking expiry: old owner meets new winner

A hold expires, another customer acquires the seat, and the first customer’s delayed payment succeeds. A **reservation generation** distinguishes the old hold from the current owner.

The completion command names the old reservation identity. The seat authority checks that identity and current state atomically; because another owner now holds or owns the seat, completion is rejected. Reconcile the confirmed payment under a refund or alternate-allocation policy. The expiry operation similarly releases only the expected reservation, so a late cleanup cannot free a successor’s hold. A lock can coordinate requests, but the stored seat state enforces the invariant against delayed work.

Separate financial confirmation from seat confirmation in the restart evidence. The old customer's provider can report a real payment after the hold expires and another customer acquires the seat. Comparing the callback with the current hold identity then rejects the obsolete booking transition without denying the existence of the charge. Persist compensation intention and reconcile its eventual refund independently. A repeated callback must return that same recovery status. Extending the old hold after seeing the late payment would overwrite the successor's authority and break the winner invariant that the original atomic claim was supposed to protect.

@fig sd_practice_designs_26 | Illustrative booking expiry: old owner meets new winner. An obsolete hold cannot displace its successor after late completion. Orange marks the obsolete completion entering refund recovery instead of taking the new hold.

Checking only that the seat is held allows an old customer to complete another customer’s hold if the identity is not compared.

:::note Expiry and stale ownership
Bind every release and completion to the exact reservation identity and generation. Atomically reject obsolete ownership at the seat authority. Reconcile late outside payments without violating the one-winner rule.
:::

## 27. Message receipts: acceptance is not reading

The server stores a message, a gateway sends it, a phone acknowledges storage, and the user later opens it. A **receipt boundary** states which of those transitions a status actually confirms.

Keep accepted, device received, device stored, and read statuses distinct when the product needs them. A read receipt can be delayed or disabled by user policy. Duplicate receipts are harmless monotonic state observations, but an out-of-order older receipt must not move status backward. Several devices can progress independently. Retention or privacy rules may remove the server’s history while a device still has its copy; deletion guarantees must name that limit. The status shown to the sender should match confirmed state, not the gateway’s optimistic intention.

An offline device illustrates why the states cannot collapse into sent. The server can durably accept a message while no device receives it. A connected device can acknowledge local storage while its user never opens the conversation. A read observation is another client action with its own privacy and synchronization policy. Persist progress under the relevant device or reader identity and make repeated receipts monotonic. A sender's interface should label only the boundary actually established. A lost receipt response can be safely retried without delivering another message or inventing proof that the person saw it.

@fig sd_practice_designs_27 | Illustrative message receipts: acceptance is not reading. Server acceptance, device storage, and reading are distinct receipt claims. Orange marks the read observation beyond server acceptance and device storage.

A global delivered flag can hide one offline device. Decide whether the promise concerns any device, every device, or the user account.

:::warn Watch out
Name the boundary behind each delivery status. Preserve per-device progress and monotonic receipt handling. A socket send cannot establish application receipt, and a device receipt cannot establish that a person read the content.
:::

## 28. Concurrent document inserts: an actual merge rule

Two clients start from the same version and insert different text at the same position. In a server-ordered positional design, the server accepts one operation first and transforms the other against the accepted insertion using a deterministic tie-break rule.

If the first insertion is ordered before the second at the shared position, the second position shifts by the first inserted text’s length. Both clients apply the canonical order and transform their pending local operation against the received remote operation. The important rule is not merely shifting an integer: deletion, overlapping ranges, undo, and repeated delivery need their own transformation definitions. Store operation identity so replay does not insert the text again. A snapshot records a canonical version, and reconnect resumes operations after that version.

### Follow both clients through one insertion pair

The computed toy document is `ab`, with zero-based insertion position one between its characters. Client A inserts `X` and locally shows `aXb`. Client B independently inserts `Y` at the same base position and locally shows `aYb`. The server’s stated tie-break policy orders A before B. After accepting A, its canonical document is `aXb`; transforming B moves its insertion position from one to two, yielding `aXYb`.

Client A applies B’s canonical insertion at position two and reaches `aXYb`. Client B receives A while its own insertion is still pending; the policy puts A’s `X` before B’s `Y`, so B’s displayed document becomes `aXYb`, while its pending operation’s canonical position becomes two. The later acknowledgement of B retires that pending identity and must not insert `Y` a second time. Both clients now agree with the server. The example handles this insertion pair under an explicit order; deletion and more complicated overlap still require their own proven transformation rules.

Begin with the illustrated ab document and both edits targeting position one. Accepting A's X first produces aXb; B's original position now refers to a base that predates X. Under the stated ordering rule, transform B's Y position to two and apply it to obtain aXYb. The server sends the accepted relation back, and each client reconciles its own pending operation rather than applying it twice. Stable operation identity protects lost replies. This tiny trace shows one insertion case; deletion, cursor behavior, and more complex concurrency require the selected algorithm's additional transformation or merge rules.

@fig sd_practice_designs_28 | Illustrative concurrent document inserts: an actual merge rule. Transforming the later insert against the accepted edit makes both clients converge. Orange marks both reconciled clients reaching aXYb under the stated insertion rule.

This positional example illustrates a mechanism family; it is not a complete proven OT implementation and does not establish all convergence conditions.

:::interview Interview lens
**"How do concurrent document edits become one history?"** Show the chosen tie break and transformation through server and both clients. Preserve operation identity and canonical history. A complete collaboration algorithm must define insertion, deletion, overlap, and reconnect, not only its name.
:::

:::key In one breath
Use stable identities and authoritative state transitions. A lease can expire while its old owner remains alive. Receipts name a delivery boundary, and collaboration needs a deterministic concurrent-operation rule.
:::

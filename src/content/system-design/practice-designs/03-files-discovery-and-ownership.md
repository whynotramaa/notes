@part III | Drive, autocomplete, tickets, payments | We combine large data with precise metadata rules. Efficient discovery does not grant permission or ownership. We will build shared files, autocomplete, ticket booking, and payment flows. | where:3

## 9. Google Drive-style files: sharing and upload state

A user uploads a document and shares it with a team. A **file metadata authority** owns identity, parent relationships, permissions, and version state, while object storage holds bytes.

Create a pending upload resource, transfer resumable bytes, validate completion, and atomically publish the object version in metadata. At download, authorize the current caller under the share policy and issue only the needed access. Renames and moves change namespace metadata without copying every byte. Maintain a change cursor for clients and a revision identity for conflict detection. Google’s public [Drive upload guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads) documents resumable API uploads; it does not disclose a complete internal storage architecture. This hypothetical design uses the API behavior as a mechanism reference.

The shared 5,000,000,000-byte upload exercise has 50 parts at 100,000,000 bytes each. A 10,000,000-byte-per-second assumed path takes 500 seconds for the full payload. Resumability avoids resending confirmed bytes after a disconnect; it does not make revision publication safe against another editor without the conditional metadata commit.

A user can finish uploading a revision while sharing permission changes concurrently. The object service's receipt establishes byte storage, not a lasting right to publish or download through the file namespace. Validate the intended revision and current authority during metadata completion under the chosen contract. A pending object that never becomes a visible revision is reconciled or reclaimed separately. Download follows the committed file identity and the request's current permission rule, including any direct-storage capability policy. The design therefore keeps reusable byte content independent of which owner, parent folder, or sharing relation exposes it.

@fig sd_practice_designs_09 | Illustrative google Drive-style files: sharing and upload state. Metadata publication and permission govern retrieval of resumably uploaded bytes. Orange marks verified revision publication and permission-protected download.

A stale sharing cache or long-lived signed URL can extend access after revocation. State the allowed revocation delay.

:::story Picture this
A librarian puts a book in a temporary cart, checks every page, then places its catalog card in the public drawer. A power cut before cataloguing leaves a cart item for cleanup, not a public book. A sharing register decides who may open the catalogued copy.
:::

## 10. Search autocomplete: prefix candidates

A reader types the beginning of a team name and expects suggestions before submitting. **Autocomplete** retrieves and ranks bounded candidates for a partial query. A prefix access path avoids scanning all names for every keystroke.

Normalize text consistently at indexing and query time, then use a trie, prefix index, or precomputed popular-prefix map. Rank candidates using a defined score and tie breaker. Cache shared popular prefixes, but distinguish locale, visibility, and personalization when they change the result. Cancel superseded client queries and show only the response for the latest input version; the network can return an older query after a newer one. Updates change candidate state asynchronously, so define freshness and deletion behavior. Fuzzy matching adds an explicit edit-distance budget rather than an unbounded search.

At the illustrative 1,000 queries per second, 900 compatible shared-prefix cache hits leave 100 source queries per second. This arithmetic assumes the cache key includes every dimension that changes the answer. If personalization makes each query unique, that hit assumption fails and the source must face the full offered workload.

The user types a longer prefix before the earlier lookup finishes. Both responses may be correct for their own prefixes, but their network arrival order does not match input order. Carry an input version or exact request relation and display only the result matching the current text. Normalize the prefix under a documented language and case rule before selecting bounded candidates. Personalized ranking and visibility can prevent safe reuse across callers, so the cache key must reflect the intended equivalence. An empty candidate list differs from a lookup timeout; preserve that distinction instead of silently caching an operational failure as no matches.

@fig sd_practice_designs_10 | Illustrative search autocomplete: prefix candidates. An input version prevents an old autocomplete reply from replacing newer candidates. Orange marks rejection of a response that no longer matches current input.

A fast index does not prevent a stale older network response from overwriting the latest suggestions in the browser.

:::note Candidate index versus authority
Build an access path for normalized prefixes and bound candidate and fuzzy work. Version client input to reject out-of-order responses. Caching and personalization need matching keys, and stale suggestions must not expose forbidden content.
:::

## 11. Ticket booking: one seat, one winner

Two users request the last seat. A **reservation** is temporary authoritative ownership with identity, state, and expiry. The invariant is that at most one live reservation or completed sale owns that seat.

Atomically transition available to held for a specific reservation. The response returns its identity and expiry; payment uses that identity. Completion checks that the same hold remains valid before transitioning to sold. Expiry releases only a hold still owned by that reservation. If a delayed payment confirmation arrives after release and resale, reconcile or refund it instead of assigning the seat twice. A cached seat map can be stale because discovery is not ownership authority. The purchase transaction or conditional transition decides the winner.

Use Heron’s 1,000-attempt-per-second API peak as a contention scenario, rather than claiming a booking throughput benchmark. Many attempts may target the same seat, so the number of successful sales is constrained by unique available inventory. The design must shed or bound losing attempts while preserving the atomic winner; adding replicas to discovery does not multiply that inventory.

The booking authority atomically moves the seat from free to the identified hold. At expiry, another conditional transition can release it and allow a successor. A late payment callback checks the current hold identity before confirming the seat; matching the seat alone is insufficient. If the old charge is real but its hold is obsolete, record a compensation or reconciliation workflow rather than transfer the successor's ownership. Repeated callbacks use the same payment identity and cannot create another confirmation. The seat authority chooses the winner, while the payment authority supplies a separately confirmed financial effect.

@fig sd_practice_designs_11 | Illustrative ticket booking: one seat, one winner. A late payment cannot revive a seat hold that no longer owns the claim. Orange marks reconciliation when the payment's old hold no longer owns the seat.

A distributed lock whose lease expires cannot by itself stop a paused old owner from selling the seat later. The seat state must reject obsolete ownership.

:::warn Watch out
Enforce one winner with an atomic authoritative transition. Bind payment and release to the reservation identity, and define delayed-payment recovery after expiry. Discovery availability can be eventually consistent while ownership cannot.
:::

## 12. Payments: intent, ledger, and reconciliation

A caller sends a 2,500-cent charge and receives a timeout. A **payment intent** identifies the business operation independently of any network attempt. The design must not equate missing confirmation with failure.

Persist the intent, amount, currency, account relation, and state before the outside call. Send a stable provider identity where its API supports it. Query or safely retry an unknown result, then store the confirmed provider reference. Internal accounting uses balanced ledger entries: a 2,500-cent debit and 2,500-cent credit sum to zero under the chosen sign convention. An illustrative 10,000-cent balance reduced by 2,500 becomes 7,500, but the available-balance rule must account for pending holds and concurrent spending. Webhooks are duplicate and potentially out-of-order observations requiring identity and state validation.

For an illustrative 20 payment intents per second with 500 metadata bytes each, the durable intent stream adds 864,000,000 bytes per day before ledger entries and indexes. Provider attempts can exceed intent count after retries. Store amounts in exact smallest-unit values and preserve the currency; floating-point response arithmetic does not define an accounting authority.

The caller's payment intention identifies the 2,500-cent action before contacting the provider. A timeout leaves that intention pending or unknown, because the provider can have accepted while its reply was lost. A reconciler obtains the provider reference or repeats under the same supported identity, then commits the protected local ledger result. Debit and credit equality checks conservation for that posting, but does not alone prevent duplicate postings with different identities. The ledger therefore needs both balanced entries and a unique effect relation. A refund, if required, is a new recorded financial intention rather than deletion of the original charge.

@fig sd_practice_designs_12 | Illustrative payments: intent, ledger, and reconciliation. Stable payment identity resolves uncertainty before the ledger records the confirmed effect. Orange marks balanced ledger entries tied to the confirmed payment intention.

Do not treat a webhook’s arrival order as the business order, or create a second charge under a new identity just because the first reply was lost.

:::interview Interview lens
**"How do you reconcile a payment after a timeout?"** Persist payment intent and use stable outside identity. Resolve unknown outcomes through provider semantics and reconciliation. Record balanced ledger effects atomically, and make webhooks repeatable with a state transition rule.
:::

:::key In one breath
Use metadata authority for permissions and versions, derived indexes for discovery, and atomic ownership for scarce resources. Payment timeouts require stable intent and reconciliation rather than a second charge.
:::

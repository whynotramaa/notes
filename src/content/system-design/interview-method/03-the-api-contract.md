@part III | API design | We describe the boundary before the internals. A caller needs to know whether a retry is safe and what an acknowledgement means. We will model resources, validate input, paginate, and identify repeated commands. | where:3

## 9. Resource modeling and outcomes

The caller asks to create a clip. Should the response contain a playable clip or an upload session? A **resource model** defines stable identities and the states represented at the API boundary.

Create a clip record in pending-upload state and an upload session that authorizes the byte transfer. After verified storage, move to processing; after successful processing, move to playable. Expose those states so the client can recover without inventing meaning from a timeout. A request that starts long-running work can return a durable job identity, while a request that completed an atomic update can return its committed version. Error responses should distinguish invalid input, permission failure, conflict, capacity rejection, and unknown outside progress.

Sketch the clip response before selecting storage products. Creation returns a pending clip and an upload session; verified completion moves it to processing; publication exposes a playable revision. A failed transform preserves a state the caller can query and a retry path tied to that processing intention. It does not erase the stored original or pretend the clip is ready. A repeat completion call should return the same accepted processing state instead of scheduling another untracked transform. Naming these transitions gives the interviewer concrete API semantics and prevents an endpoint called complete from concealing which stage actually completed.

@fig sd_interview_method_09 | Illustrative resource modeling and outcomes. Resource states make stored bytes, processing, and playback different API outcomes. Orange marks playable publication that the client can query.

Returning success with no durable identity leaves the caller unable to distinguish a lost reply from a lost operation.

:::story Picture this
A hotel reservation form names the room, the guest, and the result of the booking attempt. A form submission that times out does not tell the clerk whether the room was reserved, so the receipt number lets the guest ask about the same attempt. The record binds the request's identity to its eventual outcome.
:::

## 10. Validation, authentication, and authorization

A valid JSON score update comes from someone who cannot score that match. **Validation** checks input form and permitted values; authentication establishes the caller; authorization checks permission for this action and resource.

Check each at its appropriate boundary and reject before expensive downstream work when possible. Authorization still needs authoritative policy at the effect boundary, because a stale cached permission can allow an update after access was revoked. Validate payload size, versions, keys, and rate limits before accepting queued work. A gateway can perform common checks, but the service that owns the state must enforce its domain invariant and resource permission. Put the caller and operation into the audit trail without copying credentials.

Walk a validly encoded request from an authenticated scorer who does not own the target match. Validation accepts its shape and authentication establishes its caller, but authorization still rejects the requested effect. Conversely, an authorized caller can send an invalid version transition that the authority must reject. Put the permission and state rule at the actual mutation boundary or bind them to the protected transaction. A private cached response must still meet the serving-time permission contract. Listing an authentication box is insufficient unless the flow shows which resource and action that identity may access.

@fig sd_interview_method_10 | Illustrative validation, authentication, and authorization. Validation, identity, and permission protect different checks before the effect. Orange marks permission for the requested effect after input and identity checks.

Authenticating a user does not authorize every resource they can name in a URL.

:::note Validation versus authorization
Separate input validity, caller identity, and permission for the resource. Common gateway checks reduce work but do not replace the authority’s final permission and invariant checks. Never treat a correlation ID as proof of identity.
:::

## 11. Pagination and changing lists

A user requests the next page of clips after new clips arrive. **Offset pagination** skips a count of rows; **cursor pagination** continues from an ordering boundary. A changing list can shift offsets between requests.

Order by publication time with a stable identity tie breaker. Return a cursor that captures the last boundary and any query or ranking context needed for continuation. Validate the cursor rather than trusting its fields as permission. If a page requires a snapshot-like result, preserve or name that snapshot; a simple cursor alone does not freeze changing content. Filtering and sorting should map to access paths, otherwise a small page can still require scanning or sorting the whole dataset.

A new clip can enter ahead of the first page's last item before the caller requests the next page. Numeric offset continuation can then repeat or omit entries because the ordered list shifted. A cursor carries the defined order boundary and deterministic tie breaker, with a ranking or snapshot context where the contract needs it. Deletion and permission changes can still remove candidates, so decide how the page fills and whether session consistency includes ranking stability. Bind cursor use to the appropriate query and caller scope. The cursor describes continuation; it cannot turn a previously returned reference into continuing authorization.

@fig sd_interview_method_11 | Illustrative pagination and changing lists. Continuation keeps its ordering boundary while enforcing current permissions. Orange marks continuation that preserves cursor context and checks current permission.

A cursor cannot silently promise stable ranked results if the ranking score changes and no snapshot or ranking context is preserved.

:::warn Watch out
Pagination is a consistency contract as well as a query shape. Use a deterministic order and tie breaker, carry the necessary context in the cursor, and choose an access path that supports that order.
:::

## 12. Idempotency and unknown outcomes

The score update commits, but the reply is lost. The caller cannot tell whether retrying will add another effect. **Idempotency** means repeating an operation preserves its intended effect rather than adding another effect.

Accept a stable caller-scoped key and bind it to the request payload and result. Atomically store the key’s outcome with the effect where possible. A repeat with the same intent returns the earlier result; a different payload under the same key conflicts. Set a retention policy long enough for the promised retry horizon. AWS’s [idempotent API discussion](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) explains why caller intent is safer than guessing duplicates from equal parameter values.

Stop the API after its transaction commits but before the client hears success. The client cannot distinguish that state from a failure before commit, so it preserves the operation key and asks again. The authority finds either no committed effect and executes safely, or the existing result and returns it. Store the key, intent comparison, effect, and result under the protected commit rule. A different payload with that key must not receive unrelated success. Diagnostic request identifiers can change between attempts, while the business identity remains stable enough to resolve the uncertainty at the authority.

@fig sd_interview_method_12 | Illustrative idempotency and unknown outcomes. A same-intent retry retrieves the committed result after an unknown reply. Orange marks the repeat returning the original committed result.

An in-memory key cache disappears on restart and cannot protect a durable effect after a process failure.

:::interview Interview lens
**"How do you make a retry safe when the first result is unknown?"** A timeout is an unknown outcome, not proof of failure. Use a caller-scoped key bound to intent, store its outcome with the effect, and document retention. Separate distinct equal-looking commands from a repeated command.
:::

:::key In one breath
An API names resources, permissions, outcomes, and retry semantics. Return a durable state or an explicit pending state. A cursor and idempotency key are contracts with failure behavior.
:::

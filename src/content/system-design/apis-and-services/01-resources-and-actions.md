@part I | Resource modeling and HTTP methods | We give each request a stable meaning. An endpoint that leaks implementation details becomes hard to evolve and hard to recover. We will model resources, commands, methods, and validation before drawing service boxes. | where:1

## 1. Begin with the user's action

A viewer opens a match, and a scorer corrects its latest score. Both touch the same match but ask for different effects. The viewer needs a representation; the scorer requests a state transition. An API design starts by saying what each actor can do and what a successful response means, before choosing paths or field names.

A **resource model** identifies the concepts the application exposes and the relationships among them. Heron has matches, events, clips, and scorer assignments. A match's public identity should remain meaningful if its database owner changes. A client should not need to know the storage shard or internal function that supplies it.

@fig sd_api_resource | Illustrative match resource and actor-specific operations. Public identity and permission are distinct decisions.

### The invariant behind the action

An **invariant** is a rule that must remain true across accepted changes. Heron requires that only an assigned scorer can correct a match, that event sequence never moves backward, and that repeating one command does not create another correction. Those rules determine the write boundary more directly than a preference for REST or microservices.

A response called 'accepted' must say whether the effect is already committed or merely durably queued. A response called 'complete' must say which state and derived copies are ready. Naming those boundaries prevents clients from inferring a stronger guarantee than the implementation provides.

## 2. Model relationships without exposing storage accidents

A clip belongs to a match, but media bytes live in object storage. A score event refers to a scorer, but a user's display name can change. The API should describe those relationships according to product meaning rather than copying every foreign key and column name into the public response.

A **representation** is the data returned to describe a resource. It can contain stable identifiers, selected embedded values, and links to related resources. Embedded values need a freshness contract: a historical scorer-name snapshot and the user's current display name answer different questions. The representation should make that distinction clear.

@fig sd_api_relations | Illustrative related resources. Storage location is separate from ownership of a business rule.

### A tiny example

A match response can contain `match_id`, current score, observed version, and identifiers for published clips. A clip response can contain its processing status and a suitable delivery reference. An unfinished clip should not appear as playable merely because its upload bytes exist. The API exposes state transitions that clients can interpret, not just records that happen to be present.

@fig sd_api_resource_states | Illustrative clip lifecycle. Uploaded bytes, accepted processing, and a published representation prove different states.

When related values change independently, avoid returning a falsely atomic-looking document unless you can supply that observation contract. A combined page can explicitly contain a current authoritative score and eventually refreshed clip suggestions. One JSON response does not prove every field was read at one globally consistent instant.

## 3. Method semantics affect retries and intermediaries

A browser can prefetch an ordinary link without asking the user whether it should change the score. HTTP's **safe method** semantics mean the client requests information rather than a state-changing action. `GET` should therefore retrieve a representation, while a correction uses an explicit write or command contract. Incidental logging does not turn a retrieval into a requested score mutation.

**Idempotent semantics** mean repeating the intended operation has the same intended effect. Repeated `DELETE` can leave the resource absent while returning a different status on a later attempt. Repeated `PUT` can request the same replacement state. `POST` can be made duplicate-safe by an application command key, but the method itself does not supply that promise.

@fig sd_api_method_effects | HTTP method meaning and application effect recovery. The method name does not make an unrelated provider transactional.

### State replacement needs concurrency rules

Suppose two scorers read the same version and each submits a replacement. Without a version precondition, the later accepted replacement can erase a correction the client never observed. Define whether the operation means 'replace unconditionally,' 'replace the version I read,' or 'apply this explicit delta to current state.' Those are different contracts even when each request uses the same method.

The [HTTP semantics specification](https://www.rfc-editor.org/rfc/rfc9110.html) defines the method vocabulary. Heron's permission, version checks, and command identity enforce its business meaning. Keep those layers separate when explaining what a client may safely retry.

## 4. Validation has more than one boundary

A request can be valid JSON and still ask for an impossible score. **Request validation** checks the shape, types, ranges, and semantics of input before expensive or irreversible work. Bound the body size and parsing effort first, then validate fields, then enforce permissions and state-dependent invariants at the appropriate authority.

Shape checks can reject a missing match identifier or unsupported command kind. A semantic check can reject a negative total where the sport's rules forbid it. A state-dependent check can reject an event sequence older than the current committed state. Performing the last check outside the write transaction creates a race if another command changes the state before commit.

@fig sd_api_validation | Illustrative validation layers. The final invariant check belongs with the protected effect, not only at the gateway.

### Errors are part of the contract

Return a stable machine-readable error kind, enough safe detail to correct the request, and a trace identifier for diagnosis. Do not leak internal credentials or stack traces. Distinguish malformed input, unauthorized access, conflict, overload, and unknown completion so the client can choose correction, login, retry, or recovery appropriately.

The [problem-details specification](https://www.rfc-editor.org/rfc/rfc9457) provides a standard shape for HTTP API error information. A shape alone does not decide whether an error is retryable. That decision comes from the operation's state and failure meaning.

:::story Picture this
A booking form can check that a date looks like a date before contacting the hotel. The hotel still has to check that the room exists, that the customer may book it, and that another booking has not taken it. Early validation saves work; the final authority protects the shared rule.
:::

:::warn Watch out
A gateway validation check cannot protect an invariant against an internal caller or a concurrent state change. Recheck the state-dependent rule atomically at the boundary that owns the write.
:::

:::interview Interview lens
**"How would you design an API for score corrections?"** I would first define who may correct which match and whether the command replaces a version or applies a delta. The request carries a stable command key and a concurrency precondition where required. Validation and authorization reject unsuitable input, while the authoritative transaction protects the version, event sequence, and deduplication result together.
:::

:::key In one breath
An API names user actions, resource identities, and invariants. Representations expose a deliberate observation contract rather than storage accidents. Method semantics help clients and intermediaries behave correctly, while version checks and command keys protect actual effects. Validate cheaply at entry and enforce state-dependent rules at the authoritative write boundary.
:::

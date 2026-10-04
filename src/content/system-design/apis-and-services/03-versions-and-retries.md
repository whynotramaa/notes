@part III | Versioning and idempotency keys | We preserve a command's meaning when state or clients change. A safe network retry can still overwrite someone else's work. We will separate resource versions, command identity, conditional writes, and API evolution. | where:3

## 10. A resource version names what the client observed

Two scorers open the same match and both see version 7. A **resource version** identifies a state revision that a reader can later reference. It is different from an API version, which identifies a contract understood by a client. Heron can expose a score revision even while the public field names remain unchanged.

The first scorer corrects the state and receives version 8. The second still holds a representation of 7. Without a precondition, the second's replacement can overwrite a change it never saw. Returning versions gives the client information, but the write must actually check that information at the authoritative commit boundary.

@fig sd_api_observed_version | Illustrative readers of version 7. A later accepted correction changes the state to 8, not the other reader's remembered observation.

### Versions do not all mean the same thing

An **ETag** is an HTTP entity tag used in representation validation and preconditions. A strong tag can support byte-level representation comparison under the HTTP rules, while a weak tag has different matching semantics. An application's logical revision can be used to generate suitable tags, but it should not claim an ordering or equality promise the generation rule cannot supply.

`If-Match` uses strong comparison. A weak tag such as `W/"match-7"` cannot satisfy a tag-based `If-Match` check even if its opaque text matches. A client that needs this conditional-write contract must obtain a suitable strong validator. The special `If-Match: *` condition tests for an existing representation; it does not mean 'the revision I last read is still current'.

A revision is not automatically a wall-clock timestamp. A timestamp can tie or move backward across machines. Choose a version scheme matching the authority and comparison needed: equality for a conditional replacement, an ordered sequence for score events, or a commit position for replica visibility. Do not conflate them because they all look like numbers.

## 11. A command key recovers an uncertain operation

The first scorer's correction commits but the reply disappears. A **command key** identifies one intended operation across attempts. Heron stores the key, payload fingerprint, authorized scope, and result with the protected score change. A retry with the same meaning retrieves that result rather than applying another correction.

The key belongs to the operation, not to a connection or process. Reconnecting, changing application instance, or waiting through failover must not create a new key for the same uncertain command. A second deliberate correction gets a new key. The service rejects the original key reused with different meaning.

@fig sd_api_command_identity | Stable operation identity survives a lost response and a different application instance.

### The response can describe an earlier effect

Suppose Heron committed command K at version 8, then another valid command moved the match to 9. Retrying K should return K's recorded outcome, not apply it again or pretend K created version 9. The response can also provide a link to current state, but the original operation result and the current representation are different facts.

Atomic recording matters. A separate key-table write and score write leave a crash gap. A unique scoped key arbitrates concurrent duplicates, while retention defines how long recovery remains supported. The networking and database units show those mechanisms; here they are part of the public request contract.

## 12. Conditional writes protect a previously observed version

The second scorer submits a replacement conditional on version 7. **Optimistic concurrency control** checks that the relevant state has not changed before committing an update, rather than reserving it for the whole period the user is editing. The client can work independently, but a stale command receives a conflict and must decide how to reconcile.

A database update can require both `match_id=m7` and `version=7`, then change the score and version atomically. If the current version is still 7, one row changes and becomes 8. If the first scorer already changed it to 8, zero rows satisfy the precondition. The service reports a version conflict rather than calling that zero-row result a successful correction.

@fig sd_api_conditional_write | Illustrative conditional update. The predicate and effect share one atomic boundary.

### Retry and conflict are different decisions

Retrying the same precondition after a real version conflict does not make it current. The client needs a fresh read, an explicit merge, or a new command that expresses a suitable delta. Automatically replacing the precondition with the latest version can erase another person's work while appearing to resolve the error.

A stable command key handles network uncertainty; a version precondition handles concurrent state change. Both can be necessary in one request. A command with key K and expected version 7 can be recorded as successful at 8, then recovered by K even after current state reaches 9. The precondition was checked for the original effect, not repeatedly applied as a new correction.

:::warn Watch out
Do not read a version, compare it in application memory, and then perform an unconditional write. Another transaction can change the state between the comparison and effect. The authority must evaluate the precondition atomically with the update.
:::

## 13. API versioning preserves contract meaning

An old mobile client expects a score field to be an integer, but a new server replaces it with a nested object. **API versioning** identifies a public contract so clients and servers can evolve without silently disagreeing. A field can remain parseable while its units, default, or meaning change, so wire compatibility is only one dimension.

Heron can add an optional field when supported clients tolerate unknown fields. Renaming or removing a required field, changing its type, changing default ordering, or strengthening a required precondition can break existing clients. Document compatibility rules and test representative older clients against the proposed response and error behavior.

@fig sd_api_contract_versions | Illustrative compatibility differences. A new optional field and a changed existing meaning are not equivalent changes.

### Choose one explicit transition policy

Path, media-type, or header versioning can each identify a contract. The important mechanism is that routing, documentation, validation, and deprecation agree on which contract a request uses. A request must not accidentally enter a mixed handler where one component interprets the old field and another interprets the new one.

Keep a supported transition window and observe actual client use before removing the old contract. Data migration can run separately using an expand, migrate, and contract sequence: accept a compatible shape, transform stored data, then retire the old shape after readers no longer need it. A deployment date alone does not prove every offline client upgraded.

:::story Picture this
An editor sends comments on the seventh revision of a document. A reply lost in transit should recover those same comments; a later eighth revision means the comments may need merging before a new edit. The revision identifies what was read, while the comment identifier identifies what action was intended.
:::

:::note Result retention and contract support
A supported command retry can outlive a server deployment. Keep enough understanding of the old command meaning and stored result to honor that recovery contract. Deleting an old handler does not automatically end promises already made to clients.
:::

:::interview Interview lens
**"Do idempotency keys solve concurrent updates?"** They solve repeated attempts for the same intended operation within the recorded contract. They do not stop two different operations from overwriting state each read earlier. I would also use an atomic version precondition or an explicitly mergeable command, and distinguish a conflict from an uncertain network outcome.
:::

:::key In one breath
Resource versions describe observed state, while API versions describe public meaning. Command keys recover repeated attempts and conditional writes protect an earlier observation. Their checks must share the effect's authoritative boundary. Contract evolution needs compatible interpretation and a deliberate support window.
:::

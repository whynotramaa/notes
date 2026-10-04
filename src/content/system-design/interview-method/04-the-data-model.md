@part IV | Data model | We place state where its invariants can be enforced. A list of database products says nothing about a concurrent update. We will model records, transactions, access paths, and derived views. | where:4

## 13. Entities, keys, and relationships

A clip belongs to a user and may reference a match. A **data model** describes records, identities, relationships, and rules governing their changes. Begin with what the critical flows read and write.

Give the clip a stable key, store its owner, object identity, lifecycle state, and source version, and define the relationship to match metadata. Put uniqueness and required-reference rules in the authoritative store when its model supports them. A derived search document or feed entry can reference the clip without becoming its authority. List the records needed by one upload and one playback request, then check whether their chosen keys support those operations locally. This process leads to a storage choice rather than beginning with a product name.

Draw a clip row containing its owner, lifecycle state, and published object identity. The object service stores bytes, while a search result or feed entry points back to the clip. Deleting the search entry does not delete the authority; retaining it after source deletion does not make the clip valid. Define which relation is authoritative before choosing how to cache or index it. If object and metadata commits cannot share a transaction, pending upload and orphan cleanup states connect those stores. The data model should expose that relation directly so recovery knows which bytes belong to a visible revision.

@fig sd_interview_method_13 | Illustrative entities, keys, and relationships. Metadata owns identity and permission while indexes retain derived references. Orange marks derived discovery references that do not own clip authority.

Duplicating metadata without an authority rule leaves services unable to decide which copy wins after concurrent changes.

:::story Picture this
A town hall keeps one register for residents, one for addresses, and one for the permits connecting them. Copies on a public noticeboard help people search, but the registers decide who owns a permit and whether it was revoked. Each relationship has an owner and a stable reference between registers.
:::

## 14. Atomic state transitions

Two upload-completion requests attempt to publish the same clip. A **transaction boundary** defines the state changes committed together. Its job is to prevent a partial or competing change from violating the invariant.

Check that the upload session belongs to the caller, the expected object version is complete, and the clip is still in the required prior state. Transition the clip and create its processing intention in one transaction. A repeated completion should return the established result or a safe conflict, not create another independent processing job. When the object store and metadata database are separate authorities, choose an order and a recoverable intermediate state; their commits do not become one transaction merely because the API called them in one function.

Consider verified upload completion followed by a process crash. If metadata enters processing but the job exists only in memory, the clip can remain pending forever after restart. Put the transition and durable processing intention in the same local transaction, with a repeatable completion identity. A worker then discovers the committed intention independently of the API process. If verification failed, the transaction must not publish a state that asserts a complete object. This model ties acceptance to evidence already established and puts later failures in named states rather than relying on a happy-path sequence of function calls.

@fig sd_interview_method_14 | Illustrative atomic state transitions. The local state transition commits work intention with its lifecycle change. Orange marks a repeat recovering the already accepted state transition.

A prior read followed by an unconditional update leaves a race. Use an atomic condition or suitable transaction isolation.

:::note Indexes from access paths
Identify the invariant and the changes that must commit together. Enforce the precondition with the transition at the authority. Cross-store work needs explicit intermediate state and reconciliation.
:::

## 15. Indexes from access patterns

The playback route needs a clip by ID, while a profile page needs the owner’s latest clips. An **index** is an access path that reduces the records examined for a specified lookup or order.

Use the primary identity path for direct lookup, and an owner plus publication-order path for the profile list. Include a stable identity tie breaker so pagination can continue. Each added index consumes write work and storage, and a covering representation can avoid fetching the full row only for the fields it actually holds. A search by arbitrary body text is a different access pattern and may need an inverted index rather than another ordinary metadata index. Explain the query shape before listing indexes.

Compare playback's point lookup with the profile's owner-ordered list. The former finds one clip identity; the latter needs ordering and a continuation boundary within one owner's entries. Choose index fields from that query shape, including its deterministic tie breaker where necessary. Every relevant creation, deletion, or ordering change then maintains another stored structure. A covering representation can reduce later reads while duplicating selected data. If permissions can change, the index cannot grant access from an outdated copy. Explain both the specific query saved and the write and storage work added before proposing indexes for every field.

@fig sd_interview_method_15 | Illustrative indexes from access patterns. An index accelerates its access pattern while adding maintenance on writes. Orange marks the additional writes and bytes paid for each index.

An index useful for owner ordering may not help a global sort, because its leading key groups rows by owner.

:::warn Watch out
Derive indexes from predicates, ordering, and returned fields. State which query they support and the write and storage work they add. A small page size does not make an unsupported full scan cheap.
:::

## 16. Authoritative and derived data

A deleted clip remains in search. **Derived state** is a representation computed from another authoritative record. Its lag can be acceptable for discovery, but it must not override deletion or permission when bytes are served.

The metadata authority controls existence and access. The search index stores discoverable fields and source version, and a deletion event removes or tombstones the entry. Playback still checks the current access rule or a correctly scoped signed permission. Keep a rebuild source and enough change history for search to recover after downtime. The same distinction applies to score cards, feed references, cache entries, and analytics aggregates. Each copy needs a purpose and an allowed freshness window.

Let the search index retain a clip after the owner revokes sharing. Search can still return a candidate if propagation lags, but the serving path must apply the current access rule before revealing private bytes. Decide whether the candidate's metadata itself is sensitive and therefore also requires filtering. A stale search entry is a derived-state repair problem; unauthorized delivery would be a correctness failure. Track source version or tombstone state so rebuild and incremental repair have an interpretable boundary. Separating those rules lets eventual discovery coexist with a stronger serving-time privacy requirement.

@fig sd_interview_method_16 | Illustrative authoritative and derived data. Derived discovery cannot grant access that authoritative metadata denies. Orange marks serving under the current authority rather than granting access from discovery.

A signed URL can remain usable until its expiry unless the serving design supplies revocation. Include that interval in the permission contract.

:::interview Interview lens
**"How do you choose the source of truth?"** Name the source of truth for each fact and which copies are derived. Document acceptable lag and rebuilds. Authorization and deletion should not depend solely on a stale discovery index.
:::

:::key In one breath
Start with keys, invariants, and access patterns. Put atomic rules at the authority that commits them. Separate authoritative data from rebuildable derived state and plan retention and migration.
:::

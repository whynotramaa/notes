@part I | URL shortener, Pastebin, notifications | We start with designs whose authority fits in a simple store. Even a small service has retries, expiry, and abuse. We will build a shortener, paste store, rate limiter, and notification workflow. | where:1

## 1. URL shortener: creation and redirect

A client submits a long URL and receives a short key. A **URL shortener** stores a mapping from an opaque public key to a destination. The keyspace exercise uses seven base-62 positions, giving 62 to the seventh power, or 3,521,614,606,208 possible strings. A large space does not remove collision handling.

Generate a candidate and insert it under a unique constraint. If another mapping already owns it, generate another candidate rather than overwriting that destination. A caller-scoped idempotency key can recover a lost creation reply. A redirect reads the mapping, checks its state and expiry, then returns the chosen redirect semantics. Cache the mapping if its mutability and revocation policy permit it. Rate-limit creation, validate destination rules, and prevent cache failure from sending unrestricted traffic to the source.

Stop creation after the unique insert but before the reply. The original candidate is already assigned, so a client retry should recover that mapping through its creation identity rather than generate an unrelated second link. A genuinely colliding candidate belongs to another stored mapping and requires a different candidate. At redirect time, a cached destination still needs the declared expiry and revocation policy. An editable mapping also needs a version or invalidation rule. The large illustrative keyspace supplies many candidate strings; it does not prove collision-free generation, authorized destinations, or safe recovery after uncertain creation.

@fig sd_practice_designs_01 | Illustrative uRL shortener: creation and redirect. A collision preserves the existing owner; redirect follows the stored mapping and state. Orange marks redirect through the stored mapping and its current state.

A hash of the URL can still collide, and equal URLs do not necessarily mean the caller wants the same ownership or expiry. The contract decides deduplication.

:::story Picture this
A coat-check clerk assigns a numbered token to one coat and writes the token and owner in the register. If the same number is already in the book, the clerk chooses another instead of replacing the first coat's claim. A later customer presents the token, and the clerk checks the register before handing over the coat.
:::

## 2. Pastebin: bytes and expiry

A user saves text with an expiry and later asks for it by key. A **paste store** separates retrievable content from its metadata such as owner, visibility, and deletion time. Large content can live in object storage while the database stores the object identity.

Write the content under a pending identity, verify it, and commit the metadata state that makes it visible. A failure before publication leaves an orphan object for cleanup; a failure after publication but before reply can be recovered by the creation key. At read time enforce expiry from authoritative metadata rather than waiting for a background deletion sweep. Storage lifecycle cleanup removes bytes later, but delayed physical deletion must not keep expired content publicly readable. Cache keys include a version or respect the expiry deadline.

For a separate illustrative paste workload, assume 20 creations per second and 2,000 payload bytes each. That is 40,000 bytes per second and 3,456,000,000 bytes per day before copies. Expiry policy determines how much remains; these bytes do not include metadata or an index.

Consider verified object storage followed by a failed metadata transaction. The bytes exist under a pending identity but no published paste points to them, so reconciliation or orphan cleanup handles them later. If metadata commits and only the reply disappears, retry recovers that accepted paste instead. At expiry, the read authority denies retrieval regardless of whether cleanup has reclaimed the object. A previously cached copy must obey that same serving deadline or revocation rule. The illustrative daily payload calculation sizes content production, while the actual retained set depends on that lifecycle and the delay of physical cleanup.

@fig sd_practice_designs_02 | Illustrative pastebin: bytes and expiry. Publication exposes verified bytes, while expiry denies access before cleanup. Orange marks immediate denial at logical expiry while cleanup proceeds later.

TTL eviction is not an access-control guarantee. A replica or CDN can retain bytes after the logical expiry unless its serving rule also enforces the deadline.

:::note Logical expiry versus physical cleanup
Publish only after the stored content is verified and metadata is committed. Enforce logical expiry on reads, then reclaim physical bytes asynchronously. Stable creation identity and orphan cleanup recover the cross-store failure window.
:::

## 3. Rate limiter: atomic token decision

A user can issue an illustrative 100 requests per minute. A **token bucket** stores available tokens and the last refill time, allowing a bounded burst while restoring capacity at a rate.

At an initial 20 tokens, 12 seconds at 100 divided by 60 tokens per second refill 20 more. Cap at 100, then admit a request costing 25; the computed remainder is 15. Refill, cap, test, decrement, and timestamp update must happen atomically for each limiter key. Otherwise concurrent callers can both spend the same tokens. Choose user, credential, resource, or global scopes from the abuse and capacity contract. If the shared limiter is unavailable, decide explicitly whether local bounded fallback, rejection, or permissive operation is safe for that route.

The illustrated request sees 40 available tokens after refill and needs 25, leaving 15. If competing handlers each read the same pre-spend state before writing independently, they can both authorize costs against overlapping tokens. Execute the entire computation atomically for the chosen key, including the timestamp used for later refill. Rejecting a request should preserve the specified refill state rather than incorrectly charging it. Scope the key to the intended user or resource, and decide how time changes and store loss affect allowance. A token count alone cannot establish abuse protection without those authority and failure rules.

@fig sd_practice_designs_03 | Illustrative rate limiter: atomic token decision. The refill, cap, and spend form one protected token transition. Orange marks the protected spend and the computed remaining tokens.

An atomic increment followed by a separate expiry operation can leave an immortal window key after a crash. Use one atomic script or command composition that protects the whole state.

:::warn Watch out
The token decision is one atomic transition. Compute refill from elapsed time, cap it, check cost, and store the remainder. Key scope, clock policy, and failure behavior are part of the limiter, not deployment details.
:::

## 4. Notifications: intent, attempt, and receipt

The scorer commits an update and a notification intention. A **notification workflow** turns that durable intention into delivery attempts through channels such as push, email, or SMS. The provider’s acceptance is not proof that the person saw it.

Store a notification identity, recipient, channel, content version, and state. A worker claims it, sends with a stable provider key when supported, and records the confirmed boundary. Retry transient failures with backoff and jitter; route invalid recipients or poison payloads to a visible recovery path. A crash after provider acceptance but before local progress leaves an unknown result. Query the provider or repeat under its idempotency contract rather than assuming it failed. Preferences and unsubscribes must be checked under the chosen sending-time policy.

Assume 20 notification events per second and 50 recipients per event. The worker path then creates 1,000 recipient deliveries per second. Provider requests can be batched only under that provider’s contract; one stored event is not one unit of sending work. Channel retries add offered attempts without adding new logical recipients.

A worker sends the durable notification, the provider accepts it, and the worker loses the reply before storing progress. A replacement cannot infer non-delivery from the pending local row. It queries the provider or safely repeats under the original supported identity, then records the confirmed boundary. Delivery to a device and display to a person may still be later observations. Apply recipient preference changes under the chosen send-time policy, especially after long retries. The illustrated fan-out counts recipient work, so monitor successful recipient effects separately from event intake and repeated provider attempts.

@fig sd_practice_designs_04 | Illustrative notifications: intent, attempt, and receipt. Unknown provider acceptance is recovered under the same notification intention. Orange marks restart resolving the uncertain provider outcome.

Unlimited retries of a permanently invalid destination waste capacity. Classify retryable failure and expose terminal or pending recovery states.

:::interview Interview lens
**"What does a notification provider acknowledgement prove?"** Keep the durable notification identity separate from each delivery attempt. Name whether accepted means queued, provider accepted, delivered to a device, or seen. Recover unknown provider outcomes with stable intent and reconciliation.
:::

:::key In one breath
A small design still needs a key, state transition, acknowledgement, and failure policy. Keep read caches separate from authority. Delayed work needs stable identity and durable progress.
:::

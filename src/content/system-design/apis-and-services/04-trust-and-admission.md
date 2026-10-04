@part IV | Auth, validation and API gateway | We decide whose request may perform which action before it consumes scarce work. A valid message can still come from the wrong person or ask for too much. We will build identity, resource permission, gateway policy, and bounded admission as separate checks. | where:4

## 14. Authentication establishes a caller, not a permission

A viewer changes the path from `/matches/m7` to `/matches/m8`. The access token still verifies. Nothing about that verification proves the viewer may correct either match. **Authentication** establishes an identity or other accepted credential claim. **Authorization** decides whether that caller may perform this particular action on this particular resource.

Heron first verifies the credential under a stated trust policy and obtains a caller identity. The handler then loads the scorer assignment for the requested match and evaluates the action. For our illustrative permission table, the scorer is assigned only to m7. The scorer may correct m7 but not m8; a viewer may correct neither. Four caller-resource combinations yield one allowed correction. Read access can use a different rule.

@fig sd_api_permissions | Illustrative correction permission table. A verified credential and a permitted object are separate checks.

### Follow the identity across the service boundary

A gateway may verify public credentials and forward a trusted caller claim. The application must know which intermediary can assert that claim and prevent public clients from forging the same header. A service-to-service credential establishes the calling service; an end-user claim can carry delegated user context. Neither should silently replace the other when the downstream action depends on both.

Permissions can change while a user is editing. A previously permitted read does not reserve a future write. Evaluate the relevant rule at the write boundary, and choose whether the assignment itself must share an atomic transaction with the score change. Otherwise a revoked scorer can pass a check and commit after revocation. The exact guarantee follows the timing contract, not the existence of a token.

OWASP's object-level authorization guidance names the risk of using a client-supplied object identifier without checking permission for that object. Heron's example is an instance of that problem. [OWASP API1:2023](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/).

:::story Picture this
A visitor's identity card proves who arrived at the reception desk. A room-access list decides which door the visitor may open. Carrying the card into the building does not add the visitor to every room's list.
:::

## 15. Validation separates shape, meaning, and state

A correction contains `runs: -4`, an unknown match, and a valid caller credential. Parsing its JSON succeeds. Validation checks whether a request meets the operation's declared input rules. Those rules can concern syntax, types, range, relationships, permission, and the current state of the resource. Checking the outer shape alone leaves most of the business contract unchecked.

Heron bounds body size before parsing, checks that `runs` is an integer in the supported range, and rejects unknown fields under its chosen compatibility policy. It then checks that the match exists, that the caller may correct it, and that the match's lifecycle permits correction. Each rejection should describe enough for an authorized client to recover without exposing another tenant's private records.

@fig sd_api_validation_layers | Shape checks can finish before expensive work; state rules belong at the authoritative effect boundary.

### Count the work behind a valid batch

Suppose a batch contains 20 commands and each command requests five dependent reads. The syntactically small request induces 100 reads. Bounding the number of commands while leaving each command's work unbounded still permits resource exhaustion. Bound nesting, query combinations, expansion fields, and operations induced by the request. The number of output objects does not directly bound database work.

Some checks must occur twice at different levels. A gateway can reject an oversized body before it reaches the application, while the application checks business ranges and still enforces a local size bound for callers that bypass the gateway. This is a trust-boundary decision, not needless duplication. A concurrency-sensitive state check must share the transaction that changes that state.

:::warn Watch out
Do not read `remaining_seats > 0`, perform unrelated work, and then decrement seats unconditionally. Both concurrent callers can pass the earlier check. The state predicate and protected update must use one authoritative atomic boundary.
:::

## 16. Rate policy and capacity admission answer different questions

An abusive viewer sends many reads, while a legitimate batch export also asks for expensive work. **Rate limiting** bounds use under a named identity and time policy. **Admission control** decides whether the system currently has capacity to accept more work. A request can satisfy its account's quota and still be rejected because the destination has no safe capacity.

Heron's public policy allows an illustrative 100 requests per user per minute. The policy needs a scope, an algorithm, an authoritative counter, and a defined outage behavior. Its refill equivalent is 100 divided by 60 tokens per second. That figure describes the policy's average refill, not a guarantee of exactly that many accepted requests in every interval; burst rules depend on the chosen algorithm.

@fig sd_api_admission | A caller quota and a destination capacity check protect different resources.

A capacity limit can bound outstanding database work even when every user is below quota. The application rejects or defers excess work before its queue grows without a bound. The client receives a retryable refusal only when retry is useful, with a delay or deadline consistent with the contract. Delaying thousands of requests inside the gateway can consume the very connections the admission policy was supposed to protect.

### Decide what happens when the policy store fails

An unavailable shared limiter can cause denial for everyone under a fail-closed policy or admit extra use under a fail-open policy. Choose per operation. A public cached score read may tolerate a bounded local fallback; an expensive export or scarce resource mutation may require refusal. A local fallback limit applies per instance unless coordinated, so multiplying instances also multiplies its possible allowance.

The later rate-limiting unit walks through algorithms and atomic counters. Here the public contract must say which identity is limited and whether clients can safely retry. A response code does not define a policy without those rules.

:::note Identity affects fairness
An IP address can represent a shared office or many mobile users behind one carrier address. An account can create multiple credentials. Choosing the counter key defines who shares the allowance, so it is a product decision as well as an implementation detail.
:::

## 17. The API gateway owns an entry decision

A gateway authenticates a request and chooses the score service. The score service later calls an internal administrative endpoint. That second call never passes through the public gateway. An **API gateway** is an intermediary that applies public entry policy and routing. Its position does not make it the only place where trust and resource permission matter.

Trace one admitted correction. The gateway accepts only the supported host and route, applies body and account limits, verifies an accepted credential, and attaches trusted context. The application checks the specific match assignment, validates the command, and commits under its version precondition and command key. Every check has a named input and owner. This makes a bypass path easier to inspect.

@fig sd_api_gateway_trust | The gateway's decision travels as trusted context; the resource owner still checks the requested effect.

A gateway also has queues, connections, configuration, and a failure boundary. If every required service call goes through the same overloaded gateway, more application replicas do not remove that bottleneck. Separate user entry from internal communication when their policy and capacity needs differ. The simplest useful deployment may combine proxy and gateway roles in one component, but the design still needs to explain each role.

:::interview Interview lens
**"We authenticate at the gateway. Can services trust every request?"** Only if they can verify that it came through an authorized intermediary and that the forwarded claims cannot be forged. Authentication still leaves resource-specific authorization to the authority that understands the requested effect. I would also check internal and administrative paths that bypass public entry.
:::

:::key In one breath
Authentication establishes a caller and authorization checks a particular action and object. Validation bounds input and induced work, while state predicates share the effect's atomic boundary. Caller rate limits and destination admission protect different resources. The gateway owns entry policy but does not erase downstream trust boundaries.
:::

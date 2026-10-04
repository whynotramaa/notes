@part I | Authentication vs authorization | We begin with a user opening a private score report. Knowing who sent a request does not decide whether the request is allowed. We will trace authentication, authorization, tenant boundaries, and denial before discussing credentials. | where:1

## 1. A known user can request someone else's report

Heron receives a valid session for user Mira, who requests report 7 owned by another account. The login succeeded, but the read should fail unless the sharing rule permits it. **Authentication** establishes the request's claimed identity under a credential protocol. **Authorization** decides whether that identity may perform a particular action on a particular resource.

The application first resolves the authenticated principal, then validates the requested action and resource, then evaluates policy using trusted ownership and tenant data. It does not treat a client-supplied `owner_id` as proof. A **principal** is the entity whose identity and permissions the system evaluates, such as a user or service.

@fig sd_security_auth | Illustrative private-report request. A valid credential does not grant ownership of every requested object.

Keep authentication middleware and object-level checks connected. A route-level rule saying *logged-in users may read reports* is insufficient for private reports. Every object lookup, export, thumbnail, search result, and download path must preserve the resource rule. Alternate routes are a common way a correct main page becomes an incorrect system.

:::story Picture this
A building guard checks a badge to learn who you are. A locked records room has another rule about who can enter it. A valid badge does not make every room public. The rule also applies to the side door and a photocopy delivered outside the room.
:::

## 2. A tenant boundary is part of every lookup

A user in tenant 8 requests a document whose stored tenant is 7. The service must reject or omit that object under the cross-tenant policy. **Tenant isolation** prevents one customer or organization from accessing another's data and operations except through explicitly permitted sharing.

Derive the request tenant from a trusted identity or validated membership context. Query resources within that tenant scope and verify their actual ownership. Include tenant in cache keys and analytical access rules. A globally unique document ID does not remove the need for authorization; uniqueness answers identity, not permission.

@fig sd_security_tenant | Illustrative tenant boundary using recorded identifiers. Numeric IDs have no implied privilege order.

A cache hit must satisfy the same scope as a database lookup. If the key contains only object ID and omits tenant or visibility context, a private result can cross the boundary without executing the correct database predicate. Cached search pages and object metadata need this check too. Speed cannot change which principal is permitted to receive the value.

An internal service call must preserve identity and scope or apply its own trusted service policy. Passing an unvalidated header like `X-Tenant` through several services can make the entire stack trust a client choice. Prefer a verified context with clearly defined issuers and recipients. The security boundary exists at each trust transition, not only at the internet edge.

## 3. Deny rules need an explicit default

A new API endpoint ships without an ownership branch. If missing policy means allow, the endpoint becomes public accidentally. **Default deny** means an operation remains unauthorized unless a declared rule grants it. Policy errors and missing resource context must not silently become permission.

The service should evaluate the expected action against trusted attributes, return the chosen denial response, and record a bounded audit event where useful. Error wording can avoid exposing whether an inaccessible object exists, according to the product policy. The distinction between not-found and forbidden is a deliberate information boundary.

@fig sd_security_deny | Illustrative policy evaluation. The absence of a matching grant takes the denial branch.

Cache authorization decisions only with their scope, action, resource, principal, policy version, and expiry rules. A cached allow can outlive a permission removal. For sensitive operations, recheck at the effect boundary rather than rely on a long-lived UI result. A disabled button helps users but does not enforce the server's policy.

:::note Denial and availability
A permission service outage can make the correct decision unavailable. Private operations should follow an explicit failure policy preserving the security boundary. A public read may have a different cached policy. Do not generalize one endpoint's fail-open choice to every resource.
:::

## 4. Put trust boundaries in the drawing

A diagram shows browser, edge, application, database, and object storage. Each receives data from another component with a different trust relationship. A **trust boundary** is a point where assumptions about input identity, authority, or integrity change. Marking it tells us where to validate and authenticate.

The browser can choose request fields but cannot choose its server-side identity. The edge may terminate TLS but must convey identity context through a protected validated path. The application can authorize a download but should not expose a storage account's unrestricted credentials. The database should use a least-privilege service identity, not an administrator identity for ordinary requests.

@fig sd_security_boundaries | Illustrative trust boundaries. A network hop is protected according to its identity, integrity, and permission requirements.

**Least privilege** grants only the actions and scope needed for the job. It reduces the effect of a stolen credential or compromised component. It does not replace input validation or eliminate every attack. A service limited to one bucket prefix can still damage that permitted data, so protection and recovery remain necessary.

:::warn Watch out
Do not rely on obscure IDs or hidden URLs as authorization. A reader can obtain or guess an identifier through another channel. The server must apply the resource policy even when the ID looks random and the UI does not show the link.
:::

:::interview Interview lens
**"Authentication versus authorization?"** Authentication establishes the principal under a credential protocol. Authorization checks whether that principal may perform this action on this resource in the current scope. I would derive tenant and ownership from trusted data and default to denial without an explicit grant. Every alternate and derived-data path must preserve the same boundary.
:::

:::key In one breath
Identity and permission are separate decisions. Authorization applies to the requested object, action, and tenant using trusted context. Default denial and least privilege bound missing rules and compromised credentials. Trust boundaries belong in the architecture so validation and identity checks do not disappear inside a network arrow.
:::

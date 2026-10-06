@part IX | Authorization end to end | We follow one write request through every check from this unit, in the order a well-built backend runs them. Seeing the checks in sequence shows why order matters for both security and cost. We will trace Asha's menu edit and then summarise what each mechanism contributes. | where:9

## 31. One request through every check

Asha sends `PATCH /restaurants/9/menu/3` from the Spice Group dashboard at `spice.wren.example`, with a JSON body that changes the price of a biryani from 450 to 480 rupees. Before any business logic runs, the request passes a series of checks, ordered from cheapest to most expensive and from most general to most specific.

The proxy checks the body size against the 1 MB limit and returns 413 if it is over. The JSON parser enforces the depth limit and returns 400 on malformed input. Authentication middleware validates the session or token from Unit III and returns 401 if it is missing or expired. Tenant middleware resolves `t9` from the subdomain, confirms that user 42 is a member of tenant 9, and sets the tenant in the request context, returning 403 if not. Schema validation runs the `UpdateMenuItemRequest` DTO, which allows only `price` and `available`, rejects unknown fields and checks that the price is an integer from 1 to 1,000,000 paise. Failures return 422 with the field names.

Now the authorization decision. The handler asks the policy engine whether user 42 may `menu:edit` on `restaurant:9`, which walks Asha's manager relationship to restaurant 9 and returns allow. It loads menu 3 through the tenant-scoped repository, inside a transaction with `SET LOCAL app.tenant = 9`, so even a mistake in the query cannot see another tenant's menu 3. If menu 3 does not belong to restaurant 9, the result is 404. Business rules come last. If the menu is locked because a promotion is running, the answer is 409. Otherwise the write happens, with the ETag check from Unit I to catch a concurrent edit, and an audit log entry records who changed what, under which policy version.

@fig be_authz_e2e | Eight checks in order. Cheap and general first, object-level after loading, business rules last.

The order matters in two ways. Cheap checks first means that a flood of oversized or unauthenticated requests is rejected before it costs a database query. Authentication before validation detail means that anonymous callers learn nothing about the API's schema from detailed 422 messages. And object checks after loading means the decision is made about the actual resource, not about an id the client typed.

:::story Picture this
Airport security. The bag scanner rejects oversized luggage before anyone looks at a passport. The passport check comes before the boarding-pass check, which comes before the gate agent confirms you are on this specific flight. The flight attendant checks your seat number last, against the actual seat. Each check is cheap at its own stage and would be expensive or meaningless at another.
:::

## 32. What each mechanism contributes

Each mechanism in this unit has one job, and a failure in production usually points to one missing job. Default deny makes unknown actions safe. Access control models, RBAC for coarse roles, ABAC for conditions and ReBAC for relationships, decide who may act. The ownership check, built into scoped queries, stops IDOR on every object. A policy engine or a single authorize function keeps the rules in one reviewable place, and a permission matrix test proves the denies.

On the input side, schemas and allowlists reject malformed and unexpected values, DTOs stop mass assignment, and limits on size, depth, length and regex complexity stop cheap denial-of-service attacks. For tenants, verified tenant context and row-level security keep data apart, and quotas, per-tenant limits and fair queues keep resources fair.

@fig be_authz_components | One job per mechanism. When something leaks, ask which job was skipped.

This unit did not cover the shape of the API itself, how resources are named, how lists are paginated and how clients retry safely, or how the application code is organised so that these checks have an obvious home. Unit V covers API design and service architecture, starting with resources and REST.

:::warn Watch out
Do not let error responses undo the checks. A 404 for another user's order but a 403 for a nonexistent one tells the attacker which ids exist. A 422 that echoes back the full rejected object may include data the caller should not see. Keep error responses consistent and minimal, and log the detail on the server.
:::

:::interview Interview lens
**"Walk me through every check a write endpoint should perform, in order."** Size and parse limits at the edge, then authentication, then tenant resolution with a membership check, then schema and type validation into a DTO that rejects unknown fields. Then the authorization decision for the action, loading the resource through a tenant- and owner-scoped query so foreign objects return 404, then business rules against current state, inside the write transaction. Finally the write with optimistic concurrency and an audit log. Each failure gets its own status code, 413, 400, 401, 403, 422, 404 and 409.
:::

:::key In one breath
A well-built write endpoint checks size and syntax, then authentication, then tenant membership, then schema and types, then the authorization decision, then the scoped load of the specific object, then business rules, and only then writes with an audit record. Cheap and general checks run first so that floods of bad requests cost little, and object checks run after loading so they judge the real resource. Each mechanism has one job, default deny, access models, ownership, policy, validation, DTOs, limits, tenant isolation and fairness. When something leaks, the question is which job was skipped.
:::

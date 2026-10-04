@part V | RBAC, ACLs, and resource policy | We make authorization rules concrete. A broad role or a long access list can hide resource-specific mistakes. We will trace role permission sets, object grants, policy evaluation, and consistent checks at the write boundary. | where:5

## 17. Roles group permissions

A Heron scorer can update scores but cannot manage billing. A moderator can review public comments but cannot edit a match's accepted history. **Role-based access control**, or RBAC, assigns permissions to roles and roles to principals, letting the service administer groups of permitted actions.

A permission describes an action and its scope. Role membership can be tenant-local rather than global. A user who moderates one organization should not inherit the same power elsewhere. Resolve current membership using trusted records and combine it with the requested resource context.

@fig sd_security_rbac | Illustrative role matrix. These are product assumptions, not a universal hierarchy or recommendation.

The illustrative four-role, six-permission administration grid has twenty-four role-permission cells. This count explains one policy representation, not the whole number of authorization checks. Too many slightly different roles can become difficult to audit. Add resource attributes or explicit grants where they express the actual rule more clearly than creating a role for every object.

:::story Picture this
A club gives scorers a defined job badge, while a private room's owner keeps a list of invited guests. The badge covers ordinary job actions. The invitation list covers a particular room. Neither rule should silently erase the other room's restrictions.
:::

## 18. ACLs name grants on an object

Mira shares clip 7 with one analyst. An **access control list**, or ACL, records grants for a specific resource, such as a principal permitted to read that clip. It can express exceptions and object-specific sharing without creating a new global role.

The policy loads the object and its grants within trusted tenant scope, then checks whether the current principal or allowed group receives the requested action. A grant can have expiry and an issuer with authority to create it. Sharing with a group requires a current membership rule. A copied ACL entry from another tenant must not automatically become valid.

@fig sd_security_acl | Illustrative object-grant trace. Permission for clip 7 does not imply permission for clip 8.

Deleting a grant should invalidate the policy view and any derived capability according to its stated lifetime. A shared public cache cannot safely store object-specific private content without matching authorization scope. Group grants add another invalidation dependency because group membership can change without the object ACL changing. Trace both sources of current permission.

With a thousand objects and an assumed three entries each, the ACL table holds three thousand entries before group expansion and metadata. Cache rules must account for changed grants and memberships. A revoked ACL should not remain usable through a previously minted unrestricted download link. The download authorization lifetime is part of the sharing contract.

## 19. Policies can combine roles and attributes

A scorer role may edit a match only while assigned to it and while the match is open. **Attribute-based authorization** evaluates trusted properties of the principal, resource, action, and context. It can express the additional conditions that a broad role alone omits.

A policy might require tenant equality, scorer membership, match assignment, and an open editing state. These are meaningful conjunctions rather than a generic *authenticated* check. Inputs must come from trusted or validated sources. A client-supplied `is_admin=true` is not a principal attribute the server should trust.

@fig sd_security_attributes | Illustrative conjunction of authorization conditions. The request cannot choose the trusted policy attributes.

Centralizing policy logic helps consistency, but does not remove the need to supply correct resource context at every call. A policy service can become another availability dependency. Consider local validated policy data or a documented cache where appropriate, preserving revocation and version boundaries. Architecture should explain where the decision is made and how stale inputs are handled.

:::note Role names are not an ordering relation
A role called owner does not automatically dominate every lower-looking name. Define explicit permissions and constraints. Permission implications and deny rules should be audited from policy, not inferred from labels in a user interface.
:::

## 20. Check authorization at the effect boundary

The application checks Mira's permission, waits in a queue, and later writes after the owner has revoked it. This is a **time-of-check/time-of-use** problem, where relevant state changes between permission evaluation and the effect. Sensitive operations need a stated policy for that interval.

The authoritative service can reevaluate permission in its write transaction or validate a short-lived capability bound to the intended action and resource under policy. A background job should carry the initiating identity and operation context, not simply become all-powerful because it runs internally. Revocation and queued actions need an explicit relationship.

@fig sd_security_effect | Illustrative queued-operation authorization race. The second check follows the stated sensitive-operation policy.

Transactions may also protect resource state conditions, such as whether the match remains editable. Separate authorization from optimistic concurrency: permission says who may act, while a state/version check says whether this action is still valid against current data. Both can be required for one command.

:::warn Watch out
A service account with broad storage access must not bypass the initiating user's resource policy for queued downloads or exports. Preserve action context and check the appropriate authority at the actual operation boundary. Internal execution is another trust transition.
:::

:::interview Interview lens
**"RBAC or ACL?"** RBAC groups recurring job permissions, while ACLs express resource-specific grants. Tenant and resource attributes can constrain either. I would define the actual action predicate and enforce it at every visible and effect path. Cache, revocation, group membership, and queued operations determine whether the policy stays current.
:::

:::key In one breath
RBAC groups explicit permissions and ACLs grant actions on particular resources. Trusted attributes constrain broad roles and sharing rules. Labels do not create a hidden privilege hierarchy. Resource context, cache invalidation, revocation, and effect-time checks keep the policy valid across alternate and delayed paths.
:::

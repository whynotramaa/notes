@part II | Access control models | We compare the four standard ways to express who may do what. Each model makes some policies easy and others painful, and choosing the wrong one produces either role explosion or unanswerable questions. We will cover RBAC, ACLs, ABAC and ReBAC, and how permissions inherit through organisational hierarchies. | where:2

## 4. RBAC

Wren has six kinds of user and forty permissions. Assigning permissions to each user directly would mean managing up to 1,000,000 × 40 = 40,000,000 user-permission pairs, and every new hire at a restaurant would need forty decisions. **Role-based access control** (RBAC) adds a layer in between. Users get **roles**, such as `customer`, `restaurant_manager` or `support`. Roles get **permissions**, such as `menu:write` or `orders:refund`. A user may do something if any of their roles has the permission.

@fig be_rbac | Users point at roles, roles point at permissions. Asha's manager role grants menu edits.

The data model is small. A `user_roles` table and a `role_permissions` table, with 1,000,000 user-role rows and around 200 role-permission rows for Wren, about 1,000,200 rows in all. Checking "may user 42 refund?" is a join, usually cached per session. Auditing is easy, because "what can a support agent do?" is one query. RBAC has been the default model in business software since Ferraiolo and Kuhn formalised it at NIST in 1992, and almost every framework ships some version of it.

@fig be_rbac_explosion | Roles compress assignments by a factor of 40. The risk at scale is a different one.

RBAC's weakness is that roles are global and coarse. "Restaurant manager" says nothing about which restaurant. Teams often respond by creating `manager_restaurant_9`, `manager_restaurant_10` and so on, or roles for every exception, such as "support but can also edit menus on weekends". Wren would end up with thousands of roles nobody understands. That **role explosion** is the sign that the policy depends on attributes or relationships, not just job titles, and that RBAC alone is the wrong tool. Most real systems use roles for the coarse question and another model for the per-object question.

## 5. ACLs

An **access control list** (ACL) attaches permissions to each resource. Restaurant 9's shared menu draft, document 77, carries a list: user 42 is the owner, user 43 may edit, the `kitchen` team may view, everyone else has no access. To check access, load the resource's list and look for the user or one of their groups. Unix file permissions are a tiny ACL, with owner, group and other. Google Docs sharing, S3 bucket policies and Windows file permissions are richer ones.

@fig be_acl | The list travels with the resource. Sharing one document with one person is a single row.

ACLs fit when users share individual objects with each other, because each share is one entry on one object. They struggle with two questions. The first is "what can user 43 see?", which requires scanning every resource's list, so systems keep a reverse index. The second is "change what everyone in support can do", which means editing millions of lists. That is why ACLs usually combine with groups or roles, and why large systems store them as relationship tuples, the ReBAC model in Section 7.

:::note Capabilities
The opposite of an ACL is a capability, an unforgeable token that grants access to whoever holds it. A pre-signed S3 URL that allows downloading one file for 15 minutes is a capability. Capabilities make delegation easy and revocation hard, which is the same trade-off as JWTs in Unit III.
:::

## 6. ABAC

Some rules depend on facts about the request rather than on a job title. Wren's support agents may refund an order only if it is in their own region, only up to 5,000 rupees, and only after signing in with MFA. **Attribute-based access control** (ABAC) expresses such rules as conditions over attributes of the user (role, region, MFA status), the resource (type, amount, region, owner) and the context (time of day, network, device). A policy reads like a sentence: allow if `user.role == support` and `user.region == resource.region` and `resource.amount <= 5000` and `user.mfa`.

@fig be_abac | One rule over three sets of attributes. No new roles needed for each region.

ABAC handles the cases that cause role explosion. A new region needs no new role, only data. A temporary rule such as "no refunds over 2,000 rupees during the fraud incident" is one condition. NIST published guidance for ABAC in 2014, and policy languages such as XACML, OPA's Rego and AWS's Cedar are ABAC engines at heart. AWS IAM policies with conditions are ABAC too.

The costs are visibility and data. "Who can refund order 790?" now depends on every attribute of every support agent at the moment of the request, so there is no simple list to audit. Every decision needs the attributes loaded, which means more database reads or attributes copied into tokens, where they go stale. Use ABAC for the conditions that genuinely depend on attributes, and keep the rest in roles.

## 7. ReBAC

Restaurant software has deep relationships. Asha is a member of the `kitchen` team. The kitchen team owns restaurant 9. Restaurant 9 contains menu 3. Whether Asha may edit menu 3 depends on that chain, not on any single attribute. **Relationship-based access control** (ReBAC) stores these relationships as a graph and answers permission questions by walking it.

@fig be_rebac_graph | Permission follows edges. Adding Asha to the team grants everything the team owns.

Google described its global ReBAC system, **Zanzibar**, in a 2019 paper. Zanzibar stores relation tuples of the form `object#relation@subject`, such as `team:kitchen#member@user:42` and `restaurant:9#owner@team:kitchen#member`. A schema defines rewrite rules, such as "a menu's editors are the owners of its parent restaurant". The check `check(menu:3, edit, user:42)` follows menu 3 to its parent restaurant 9, restaurant 9 to its owner team, and the team to its member user 42, three hops, and returns allowed. Zanzibar serves Google Drive, YouTube and Calendar at millions of checks per second with low latency. Open-source systems such as SpiceDB and OpenFGA implement the same model.

@fig be_rebac_check | Tuples in, one check out. The graph answers questions that would need many roles.

ReBAC subsumes ACLs and roles. A role is a relationship between a user and an organisation, and an ACL entry is a relationship between a user and an object. Its costs are a separate service to run, and keeping the tuples in step with the main database. When an order is created, a tuple saying who owns it must be written too, and a crash between the two leaves them inconsistent, which is the dual-write problem Unit VIII solves with an outbox. Zanzibar also had to solve a subtler ordering problem, the "new enemy" problem, where a check that sees an old version of the graph lets a just-removed user read a just-added document. It attaches consistency tokens, called zookies, to content versions to prevent that.

## 8. Permission inheritance and organisational hierarchies

Real organisations nest. The Spice Group owns restaurants 9 and 10. Each restaurant has a menu, orders and staff. Asha manages restaurant 9 only. The group's owner manages both. Permissions **inherit** down the hierarchy, so a role granted on a node applies to everything under it, until something stops it. A manager of restaurant 9 can edit restaurant 9's menu and orders and nothing of restaurant 10's. The group owner, granted at the group node, can edit everything below.

@fig be_authz_inheritance | A grant on a node flows to its children. Restaurant 10 is outside Asha's subtree.

Inheritance makes administration bearable, since one grant covers thousands of objects. It also makes mistakes travel far. A grant on the wrong node, such as giving a contractor "viewer" on the group instead of one restaurant, exposes everything below it. Some systems add explicit deny rules that override inheritance, such as "nobody except finance may see payroll, even group owners". Deny rules make reasoning harder, because the answer now depends on the order in which rules are evaluated. Prefer structuring the tree so that sensitive data sits in a branch with few grants, and use deny rules sparingly.

:::warn Watch out
When an object moves in the hierarchy, its effective permissions change. If restaurant 9 is sold to another group, every grant inherited from the Spice Group must stop applying immediately, along with any cached decisions and any copied permissions in tokens. Moves are a classic source of lingering access.
:::

:::interview Interview lens
**"Compare RBAC, ABAC and ReBAC. Which would you choose for a multi-restaurant dashboard?"** RBAC maps users to roles to permissions and is simple to audit, but it cannot express "manager of this restaurant" without role explosion. ABAC evaluates conditions over user, resource and context attributes, which suits rules like region and amount limits but is hard to audit. ReBAC walks relationships such as user to team to restaurant to menu, which fits nested organisations and sharing. For a restaurant dashboard I would use ReBAC or role assignments scoped to a resource, such as "manager on restaurant 9", plus a few ABAC conditions for amounts and MFA.
:::

:::key In one breath
RBAC assigns users to roles and roles to permissions, compressing 40,000,000 possible user-permission pairs to about a million rows, but explodes when roles must name specific objects. ACLs attach a list of who may do what to each resource, which suits sharing but not global changes. ABAC evaluates rules over attributes of user, resource and context, and ReBAC answers checks by walking a graph of relationships, as Google's Zanzibar does. Permissions inherit down organisational hierarchies, which saves administration and spreads mistakes.
:::

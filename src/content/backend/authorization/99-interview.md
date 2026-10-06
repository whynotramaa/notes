@chapter faq | Interview question bank | Questions in the order of the unit. Say the answer aloud, then compare.

### Authentication vs authorization

**Q1. What is the difference between authentication and authorization?**

Authentication establishes who the caller is, from credentials or a token. Authorization decides whether that identity may perform a specific action on a specific resource. The first happens once per session, the second on every request.

**Q2. Which status codes go with each failure?**

401 when the caller is not authenticated, with WWW-Authenticate. 403 when the caller is known but not allowed. 404 when the server should not reveal that the resource exists.

**Q3. Why is hiding a button in the UI not authorization?**

The API behind the button is a public URL anyone can call with curl or a modified client. Only the server's check decides. The UI should reflect the policy, never enforce it.

**Q4. What is default deny?**

If no rule explicitly allows a request, the answer is no. New endpoints then start closed rather than open. Frameworks can enforce it by requiring a permission declaration on every route.

**Q5. What is least privilege?**

Every user, role, service and key gets only the permissions its job needs. It limits the damage when an account is compromised. It also forces the team to define what each role is for.

**Q6. Where should authorization checks live?**

Coarse checks, such as token scope and role per endpoint, can run early at the gateway or in middleware. Object-level checks must run where the object is loaded, in the service. Database row-level security can act as a backstop.

### Access control models

**Q7. What is RBAC?**

Role-based access control assigns users to roles and roles to permissions. A user may act if one of their roles has the permission. It is simple to audit and the default in business software.

**Q8. What is role explosion?**

Creating ever more specific roles, such as one per restaurant or per exception, until nobody understands them. It means the policy depends on attributes or relationships, not job titles. ABAC or ReBAC fits better.

**Q9. What is an ACL?**

An access control list attached to a resource, naming which users or groups may do what to it. It suits per-object sharing. It makes "what can this user see?" and global changes expensive.

**Q10. What is ABAC?**

Attribute-based access control evaluates rules over attributes of the user, the resource and the context, such as region, amount and time. It avoids role explosion for conditional rules. It is harder to audit and needs attributes at decision time.

**Q11. What is ReBAC, and what is Zanzibar?**

Relationship-based access control decides by walking a graph of relationships, such as user member of team, team owns restaurant. Zanzibar is Google's global ReBAC system, described in 2019, storing relation tuples and answering checks at very high rates. SpiceDB and OpenFGA implement the model.

**Q12. How do permissions inherit in hierarchies, and what is the risk?**

A grant on an organisation node applies to everything beneath it, such as all restaurants in a group. It saves administration. A grant on the wrong node exposes a whole subtree, and moving objects changes their effective permissions.

### Ownership and IDOR

**Q13. What is IDOR or BOLA?**

The server accepts an object id from the client and acts on that object without checking that the caller may access it. Changing an order id in the URL returns someone else's order. OWASP ranks it first in the API Top 10.

**Q14. How do you prevent IDOR systematically?**

Scope every data access to the caller, for example by querying from the user's own collection or adding the owner condition to the WHERE clause. A missing check then cannot happen. Test every endpoint with a second user's ids.

**Q15. Do UUIDs fix IDOR?**

No. Random ids make guessing impractical, but ids leak through URLs, emails, logs and other responses. They are a second layer on top of the ownership check, never a replacement.

**Q16. Should you return 403 or 404 for another user's object?**

Usually 404, so the response does not confirm the object exists. Apply the choice consistently, because inconsistency itself leaks. 403 remains right when the user may know the object exists but not act on it.

**Q17. What is broken function-level authorization?**

An endpoint that performs a privileged action checks only that the caller is authenticated, not that they hold the right role. A customer calls an admin refund route and it works. Default deny and a permission matrix test catch it.

### Policy engines and testing

**Q18. What are a PEP and a PDP?**

The policy enforcement point is application code that asks for and acts on a decision. The policy decision point evaluates the rules and answers allow or deny. Separating them keeps policy in one reviewable place.

**Q19. Compare OPA and Cedar.**

OPA evaluates Rego policies and is common in infrastructure, gateways and Kubernetes. Cedar is an AWS-designed language for application permissions with a formal specification and analysis tools. Both run embedded or as sidecars.

**Q20. What is the risk of caching authorization decisions?**

A revoked permission keeps working until the cached decision expires. With a 30-second cache, access can linger up to 30 seconds. Use short TTLs, invalidation events or live checks for high-risk permissions.

**Q21. What must an authorization cache key contain?**

The user, the action and the specific resource or scope. Caching "may edit menus" and reusing it for a specific menu grants access across restaurants. Keys that omit part of the question are a privilege escalation bug.

**Q22. How do you test authorization?**

Build a permission matrix of roles against endpoints and assert every allow and deny automatically. Add cross-user tests where one user requests another user's objects. Generate tests from the route table so new endpoints are covered.

### Input validation

**Q23. Why isn't valid JSON valid input?**

Parsing only checks syntax. Fields can be missing, extra, of the wrong type, out of range or inconsistent with the system's state. Validation checks schema, type, semantics and business rules.

**Q24. What are the layers of validation?**

Schema validation checks fields, type validation checks types strictly, semantic validation checks formats and ranges, and business-rule validation checks against current state. The first three need no database and run first. Business rules run with the write.

**Q25. Allowlist or blocklist?**

Allowlist. It names what is acceptable and rejects everything else, so it does not need to anticipate attacks. Blocklists miss the endless variants attackers invent.

**Q26. What is the difference between normalization and sanitization?**

Normalization converts equivalent inputs to one canonical form, such as Unicode NFC or decoded paths. Sanitization removes or alters dangerous content. Normalize before validating, and prefer encoding at output over sanitizing at input.

**Q27. How should an API handle unknown fields?**

On write endpoints, reject them with 422 naming the fields. That stops mass assignment and catches client typos. Responses can add fields freely, and clients should ignore fields they do not know.

**Q28. Which request limits should every API have?**

Body size, JSON depth, array length and string length, enforced before or during parsing. Each blocks a cheap way to make the server do expensive work. Reject with 413 or 422.

### Input attacks

**Q29. What is mass assignment?**

A framework copies every field in the request onto a model, so a client can set fields like role or balance. GitHub suffered it in 2012. Prevent it with per-endpoint DTOs listing allowed fields.

**Q30. What is HTTP parameter pollution?**

Sending a parameter twice so two components that parse duplicates differently disagree about its value. A firewall checks one copy and the app uses the other. Reject duplicate scalar parameters at the edge.

**Q31. What is prototype pollution?**

In JavaScript, merging attacker-controlled keys like `__proto__` writes into Object.prototype, changing properties for every object in the process. It can bypass checks or lead to code execution. Block those keys and use prototype-free maps.

**Q32. What is type confusion?**

A value arrives as an unexpected type, such as a string, array or object instead of a number, and the code behaves differently. An object can become a NoSQL operator. Validate types strictly before use.

**Q33. How can integer overflow cause a security bug?**

A total that exceeds the type's range wraps, for example to a negative number in 32-bit arithmetic. A negative price can become a refund. Bound inputs, use 64-bit or decimal types and compute totals server-side.

**Q34. Why does Unicode normalization matter for security?**

Visually identical strings can have different code points, so comparisons and uniqueness checks fail or succeed unexpectedly. Normalize to NFC before comparing and storing. Use confusable detection for usernames, since NFC does not fold look-alike scripts.

**Q35. What is ReDoS?**

A backtracking regex engine takes exponential time on some inputs for patterns with nested quantifiers. One short request can pin a CPU core for seconds. Use linear-time engines, bound input length and set timeouts.

**Q36. How do you validate an uploaded file?**

Ignore the filename and Content-Type, check the magic bytes, and for images decode and re-encode. Limit size and pixel dimensions, generate the stored name on the server, and serve uploads from a separate domain.

### Multi-tenancy

**Q37. Compare shared schema, schema per tenant and database per tenant.**

Shared schema puts a tenant_id on every row and is cheapest, with isolation depending on every query. Schema per tenant separates tables at the cost of many tables and repeated migrations. Database per tenant isolates fully but multiplies connections and operations.

**Q38. How should a request identify its tenant?**

From a trusted source, such as a signed token claim or the subdomain, followed by a check that the user belongs to that tenant. Never trust a tenant header alone. Carry the verified tenant in the request context and in job payloads.

**Q39. What is row-level security and how do you use it for tenants?**

A PostgreSQL feature that adds a policy predicate to every query on a table. A policy comparing tenant_id with a session setting, set with SET LOCAL per transaction, makes forgotten filters return nothing foreign. Connect as a role that does not own the table and cannot bypass RLS.

**Q40. What is the noisy neighbour problem?**

One tenant's load consumes shared resources and degrades service for others. Contain it with per-tenant rate limits, quotas, concurrency caps and fair queues. Move the largest tenants to dedicated capacity.

**Q41. How do caches leak data between tenants?**

A cache key without the tenant lets one tenant's data be served to another when ids collide. Build every key through a helper that requires the tenant. Include the host in HTTP cache keys.

**Q42. What is fair queueing for jobs?**

Keeping a queue per tenant and having workers take jobs from each in turn. One tenant's 50,000 jobs then cannot delay everyone else's. Jobs also carry the tenant id explicitly.

**Q43. Where do cross-tenant leaks usually come from?**

Shared side paths: hand-written reports, cache keys, search queries, export jobs, support tools and shared storage. The main request path is usually fine. Isolate structurally, test with overlapping tenants and monitor.

### End to end

**Q44. List the checks of a write endpoint in order.**

Size and parse limits, authentication, tenant membership, schema and types, the authorization decision, a scoped load of the object, business rules, then the write with an audit log. Each failure returns its own status. Cheap checks come first.

**Q45. Why does check order matter?**

Cheap checks first make floods of bad requests inexpensive to reject. Authenticating before detailed validation avoids revealing the schema to anonymous callers. Object checks after loading judge the real resource.

**Q46. What changed from early web authorization to current practice?**

Early apps scattered role checks in handlers and trusted ids from URLs. Current practice scopes data access to the caller, centralises policy in an engine or one function, adds relationship models for nested organisations, tests denies systematically and enforces tenant isolation in the database too.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a design.

### Authorization

**E1** ● Wren has 1,000,000 users and 40 permissions. How many rows do direct user-permission grants need in the worst case, and how many with one role per user and 100 roles each listing all 40 permissions?

**E2** ● An attacker enumerates 5,000,000 sequential order ids. How long does it take at 50 requests per second, and at 500?

**E3** ● With UUIDv4 ids (122 random bits) and 5,000,000 orders, what is the chance that one random guess hits an existing order?

**E4** ● Wren caches decisions for 30 s. A decision was cached at t = 0 and the role was removed at t = 12. Until when does access continue, and what is the worst case?

**E5** ●● For each case, pick RBAC, ACL, ABAC or ReBAC and justify: support may refund in their own region up to 5,000 rupees; a menu draft shared with one colleague; managers of a restaurant group see all its branches; cooks may mark orders ready.

**E6** ●● Trace an IDOR attack on `GET /users/42/orders/789` and rewrite the handler's data access so the bug cannot occur.

**E7** ●● Explain to a non-engineer, without jargon, why "only logged-in users can call this endpoint" is not enough security.

**E8** ●● Build the permission matrix for anonymous, customer, manager, support and admin against read menu, read own order, read any order, edit menu and refund, and list which deny cells you would test first.

### Input validation and attacks

**E9** ● What is the largest quantity of a 450-rupee item (45,000 paise) whose total fits in a signed 32-bit integer?

**E10** ● For `(a+)+$` against n letters a and a `!`, about how long do n = 25 and n = 35 take at $10^8$ steps per second?

**E11** ●● Trace what `user.update(**body)` does with `{"name":"Asha","role":"admin"}` and write the DTO that prevents it.

**E12** ●● A WAF reads the first `amount` and the app the last. Trace `?amount=10&amount=1000` and give the fix.

**E13** ●● Explain prototype pollution to a Python developer who has never used JavaScript, and give two defences.

**E14** ●● How many code points are in "é" in NFC and in NFD? Explain why a uniqueness check on usernames must normalize, and why NFC is not enough against impersonation.

**E15** ●● Order these checks and give each failure's status code: unknown field, missing session, 5 MB body, menu locked by a promotion, user not in tenant, menu id belongs to another restaurant.

**E16** ●● Explain without jargon why checking a file's name and Content-Type does not prove it is an image.

### Multi-tenancy

**E17** ● With database per tenant, 2,000 tenants, a pool of 10 per tenant per instance and 4 instances, how many connections are needed?

**E18** ● With schema per tenant, a migration takes 2 s per schema. How long does it take for 2,000 tenants run one after another?

**E19** ● Tenant t9 sends 800 requests per second against a per-tenant limit of 200, while all others send 1,200. How many t9 requests per second are rejected, and what load reaches the app?

**E20** ● 100 workers process 2-second jobs. Tenant t9 enqueues 50,000 jobs just before tenant t10 enqueues 10. How long does t10 wait with one FIFO queue, and roughly how long with round robin across tenant queues?

**E21** ●● A pooled connection runs `SET app.tenant = 9` (not SET LOCAL) for a request, then serves a request for tenant 10 that forgets to set the tenant. Trace what happens under row-level security.

**E22** ●● List four places outside the main query path where Wren could leak one tenant's data, and the structural fix for each.

### Proofs, code and design

**E23** ●●● Prove that if every data access goes through a function `scope(user)` that returns only rows the user owns, no request can return another user's row, and state what must be true of the codebase for the proof to hold.

**E24** ●●● Show that `(a+)+$` has $2^{n-1}$ ways to split n letters a between the outer and inner repetition, which is why backtracking explores exponentially many paths.

**E25** ●●● Write a Python `authorize(user, action, resource)` that combines roles, ownership and tenant checks with default deny, and a test generator that checks every endpoint for every role.

**E26** ●●● Write a Pydantic request model for creating an order that rejects unknown fields, bounds quantities and string lengths, limits items to 100 and normalizes the note to NFC.

**E27** ●●● Design authorization for Wren's restaurant dashboard across 2,000 tenants with owners, managers, cooks and Wren support staff, covering models, enforcement points, data isolation, caching and testing.

**E28** ●●● Count Wren's daily authorization work: 43,200,000 requests, 1.5 decisions per request, a 90% decision cache hit rate and 0.2 ms per engine evaluation. How many decisions, evaluations and CPU seconds per day, and the average cores?

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** Direct grants need up to 1,000,000 × 40 = 40,000,000 rows. With roles, 1,000,000 user-role rows plus 100 × 40 = 4,000 role-permission rows, 1,004,000 in total.

**E2.** At 50 per second, 5,000,000 / 50 = 100,000 s, about 27.8 hours. At 500 per second, 10,000 s, about 2.78 hours.

**E3.** The chance is 5,000,000 / 2^122 ≈ 9.4 × 10^-31 per guess, which makes guessing hopeless and says nothing about leaked ids.

**E4.** The cached allow lasts until t = 30, so access continues for 18 seconds after the removal. The worst case is a decision cached just before removal, which lingers almost the full 30 seconds.

**E5.** The refund rule depends on region and amount, so ABAC. The shared draft is per-object sharing, so an ACL or ReBAC tuple. Group managers seeing branches follows the organisation hierarchy, so ReBAC with inheritance. Cooks marking orders ready is a plain role permission, so RBAC, scoped to their restaurant.

**E6.** The handler takes 789 from the URL, loads `Order.get(789)` and returns it, checking only that a session exists. Asha changes it to 790 and receives user 43's order. Rewrite the access as `SELECT * FROM orders WHERE id = %s AND user_id = %s` with the session's user id, or `current_user.orders.get(id)`, and return 404 when nothing comes back. The path's `/users/42` segment should be ignored or checked against the session, never trusted.

**E7.** Logging in proves who you are, like showing ID at a building's front desk. It says nothing about which offices you may enter. If every office door opens for anyone who got past the desk, any employee can walk into the finance office. The API must check, for each request, whether this person may use this particular thing, such as this order.

**E8.** Anonymous may only read the menu. Customers may read the menu and their own orders. Managers may also edit their restaurant's menu. Support may read any order and refund. Admin may do everything. Test first the denies on dangerous actions: customer and manager on refund, customer on read any order, support on edit menu, and anonymous on everything except the menu.

**E9.** ⌊2,147,483,647 / 45,000⌋ = 47,721 units. Bound quantities far below that, such as 1 to 50.

**E10.** n = 25 needs about 2^25 = 33,554,432 steps, about 0.34 s. n = 35 needs 2^35 ≈ 3.44 × 10^10 steps, about 343.6 s, nearly six minutes from one 36-byte input.

**E11.** The unpacking sets `user.name = "Asha"` and `user.role = "admin"`, and the save persists both, making Asha an admin. A DTO such as `class UpdateProfile(BaseModel): name: str; phone: str` with unknown fields forbidden rejects the body with 422, and the handler copies only `name` and `phone` onto the model.

**E12.** The WAF sees 10 and allows the request. The app sees 1,000 and charges it, so the check and the action used different values. Reject any request with a duplicated scalar parameter at the edge, and make the app use the same parsed object the WAF validated.

**E13.** In JavaScript every plain object silently inherits from one shared parent object. Some merge functions follow a key named `__proto__` into that parent, so a request can set a property on the parent, and every object in the program then appears to have it, like changing a default for every dictionary at once. Defend by rejecting the keys `__proto__`, `constructor` and `prototype`, and by using prototype-free maps for user data.

**E14.** NFC uses 1 code point, U+00E9, and NFD uses 2, U+0065 and U+0301. Without normalization two users can register names that look identical but differ in bytes, and a login can fail for a correctly typed name. NFC does not convert Cyrillic а into Latin a, so "аdmin" still looks like "admin", which needs a confusables check or a single-script rule.

**E15.** The 5 MB body fails first with 413. A missing session gives 401. A user not in the tenant gives 403. An unknown field gives 422. A menu belonging to another restaurant gives 404 after the scoped load. A locked menu gives 409 at the business-rule step.

**E16.** The name is typed by the person uploading, and the type label is written by their software, so both are just claims. A file called menu.jpg labelled as an image can contain a program. Only reading the actual bytes, and ideally redrawing the picture from them, proves it is an image.

**E17.** 2,000 × 10 × 4 = 80,000 connections, far beyond any single PostgreSQL server, which is why database-per-tenant designs need a pooler or router.

**E18.** 2,000 × 2 = 4,000 s, about 67 minutes, during which tenants run different schema versions.

**E19.** 800 − 200 = 600 t9 requests per second are rejected with 429. The app receives 200 + 1,200 = 1,400 per second.

**E20.** With FIFO, t10's jobs start after all 50,000 of t9's, which take 50,000 × 2 / 100 = 1,000 s. With round robin, workers alternate between queues, so t10's 10 jobs are taken in the first round and finish in about 2 s.

**E21.** `SET` persists on the connection after the transaction. The tenant 10 request reuses the connection, never sets the tenant, and RLS filters by the leftover value 9, so tenant 10's users see tenant 9's data. `SET LOCAL` resets at transaction end, and the request would then fail with a missing setting instead of leaking.

**E22.** Reports written as raw SQL skip the repository, so require all tenant tables to be accessed through it and enable RLS. Cache keys without the tenant collide, so build keys through a helper that requires it. Search queries without a tenant filter return foreign documents, so wrap search in a client that always adds the filter or use an index per tenant. Export jobs lose context, so carry tenant id in the job payload and set context in the worker before any query.

**E23.** Let $R_u = \text{scope}(u)$ be the set of rows the user owns, and suppose every query in request handling is of the form "select from $R_u$" plus further conditions. Further conditions only remove rows, so every result set is a subset of $R_u$. Hence no response contains a row outside $R_u$. The proof needs every data access path to go through `scope`, including joins, eager loads, raw SQL, caches and search, and `scope` itself to compute ownership correctly from the server's own data, never from client input.

**E24.** Each run of the inner `a+` takes at least one letter, so a split of n letters into consecutive runs is a composition of n. Choosing a split is choosing, for each of the n − 1 gaps between letters, whether to start a new run there. That gives $2^{n-1}$ compositions. When the trailing `!` makes `$` fail, a backtracking engine tries each split before giving up, so the work grows as $2^{n-1}$.

**E25.** A minimal version:

```python
ROLE_PERMS = {
    "customer": {"menu:read", "order:read:own"},
    "manager": {"menu:read", "order:read:own", "menu:edit"},
    "support": {"menu:read", "order:read:any", "order:refund"},
}

def authorize(user, action, resource):
    if resource.tenant_id is not None and resource.tenant_id not in user.tenant_ids:
        return False
    perms = set().union(*(ROLE_PERMS.get(r, set()) for r in user.roles))
    if action == "order:read" and resource.owner_id == user.id:
        return "order:read:own" in perms
    if action == "order:read":
        return "order:read:any" in perms
    if action == "menu:edit":
        return "menu:edit" in perms and resource.restaurant_id in user.managed_restaurants
    return action in perms

def matrix_tests(routes, users, expected):
    for route in routes:
        for role, user in users.items():
            status = route.call_as(user)
            assert status == expected[(route.name, role)], (route.name, role, status)
```

Any action not matched returns False only if it is absent from the permission set, and unknown roles contribute nothing, so the default is deny. `expected` has one entry per route and role, so a new route without an entry raises a KeyError and fails the build.

**E26.** Using Pydantic v2:

```python
import unicodedata
from pydantic import BaseModel, ConfigDict, Field, field_validator

class Item(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    sku: str = Field(min_length=1, max_length=40, pattern=r"^[a-z0-9-]+$")
    qty: int = Field(ge=1, le=50)

class CreateOrder(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    restaurant_id: int = Field(gt=0)
    items: list[Item] = Field(min_length=1, max_length=100)
    note: str = Field(default="", max_length=500)

    @field_validator("note")
    @classmethod
    def nfc(cls, v):
        return unicodedata.normalize("NFC", v.strip())
```

`extra="forbid"` rejects unknown fields, `strict=True` refuses "3" for an integer, and the bounds keep the total far from any overflow. Prices come from the database, never from the request.

**E27.** Use ReBAC tuples for the organisation, with relations group owner, restaurant manager, cook and member, and roles scoped to restaurants. Wren support staff get a separate, audited support relation granted per ticket with an expiry, rather than standing access to all tenants. Enforce coarse checks in middleware, the tenant membership check on every request, and object checks through tenant-scoped repositories plus PostgreSQL RLS with `SET LOCAL`. Put the rules in a policy engine or a single authorize function, cache decisions for 30 s with invalidation events on membership changes and live checks for payouts and exports. Test with a generated permission matrix and two-tenant cross-access tests, and log every deny and every support access.

**E28.** Decisions are 43,200,000 × 1.5 = 64,800,000 per day. With a 90% hit rate, 6,480,000 reach the engine. At 0.2 ms each that is 1,296 CPU seconds per day, an average of 1,296 / 86,400 = 0.015 cores. Authorization cost is small, so caching should be chosen for latency and load on data sources, and kept short for correctness.

### Primary sources

[OWASP API Security Top 10, 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/). BOLA, BFLA and mass assignment.

[OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). Default deny, least privilege and testing.

[Zanzibar: Google's Consistent, Global Authorization System, 2019](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/). Relation tuples and consistency tokens.

[NIST SP 800-162, ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final). Attribute-based access control.

[PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). RLS behaviour, bypass rules and FORCE.

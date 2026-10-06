@part IV | Policy engines and testing | We move authorization rules out of scattered if-statements into one place that can be reviewed, cached and tested. When rules live in hundreds of handlers, nobody can say what the policy is, and every new endpoint is a chance to forget it. We will cover policy engines, caching decisions safely, and testing authorization with a permission matrix. | where:4

## 12. Policy engines: OPA and Cedar

Wren's authorization started as `if user.role == "support"` inside handlers. Two years later it has 300 such checks, written by 40 engineers, with slightly different interpretations of what a manager may do. When an auditor asks "who can issue refunds over 5,000 rupees?", nobody can answer without reading the whole codebase.

A **policy engine** separates the decision from the code that enforces it. The standard vocabulary, from the XACML specification, names two parts. The **policy enforcement point** (PEP) is the application code that asks the question and acts on the answer. The **policy decision point** (PDP) is the engine that evaluates rules and answers allow or deny. Wren's handler sends the PDP a small document, `{user, action, resource}`, and gets back a decision, sometimes with reasons. The rules live in their own files, in their own repository, reviewed like code and versioned so that every decision can be traced to the policy that made it.

@fig be_policy_engine | The app enforces, the engine decides, and the rules live in one reviewed place.

Two engines dominate. **Open Policy Agent** (OPA), a CNCF project since 2018, uses a language called Rego and is common in Kubernetes admission control, API gateways and microservices. **Cedar**, which AWS released as open source in 2023, has a simpler syntax designed for application permissions and a formal specification that lets tools prove properties of a policy, such as "no policy ever allows a customer to refund". Both run as a library inside the application or as a sidecar service. Zanzibar-style systems from Part II are a third option, specialised for relationship checks.

@fig be_policy_code | The refund rule in Cedar and in Rego. Either one is shorter and more reviewable than 30 scattered if-statements.

Engines bring costs. A remote PDP adds a network call per decision, so most teams embed the engine as a library or sidecar to keep decisions under a millisecond. The engine needs data, such as the user's roles and the resource's owner and amount, and getting the right data to it is often harder than writing the rules. And a policy language is one more thing for every engineer to learn. For a small service, a single well-tested `authorize()` function in the main codebase gives most of the benefit.

:::story Picture this
A company where every manager used to approve expenses by their own rules. Then the company wrote one expense policy, kept it in one binder, and gave every manager a phone number to call with "employee, item, amount". The managers still sign, but the decision comes from one place, and the auditor reads one binder.
:::

## 13. Caching decisions and consistency

At 2,000 requests per second, each needing one or more decisions, authorization becomes a performance question. Loading roles from the database on every request is wasteful, so systems cache. Roles are cached per session, decisions are cached by `(user, action, resource)` key, and some systems copy roles or scopes into the access token itself.

Every cache creates a window in which a revoked permission still works. Wren caches decisions for 30 seconds. At second 12, an admin removes a former employee's support role. Any decision cached in the previous 30 seconds still says allow until it expires, so the former employee can keep refunding orders for up to 18 more seconds. Roles copied into a 15-minute JWT linger for up to 15 minutes. For most permissions that is acceptable. For high-risk ones, such as admin access, payouts and data exports, it may not be.

@fig be_authz_cache | A 30-second cache means up to 30 seconds of lingering access after a role is removed.

There are three ways to shrink the window. Short TTLs cost more lookups. Explicit invalidation, publishing a "roles changed for user 42" event that every instance uses to drop its cache, is precise but adds a message bus and a failure mode. Checking high-risk permissions live against the source of truth, while caching the rest, is often the pragmatic mix. Zanzibar's approach is stricter. A client that has just changed a permission passes a consistency token on later checks, and the system guarantees the check sees at least that change.

:::warn Watch out
Never cache an authorization decision under a key that omits part of the question. Caching "may user 42 edit menus?" and reusing it for "may user 42 edit menu 3?" turns a decision about restaurant 9 into permission for every restaurant. The cache key must include the user, the action and the specific resource or scope.
:::

## 14. Testing authorization

Authorization bugs are almost always missing denies. Tests written by the developer of a feature check that the right user can do the thing, because that is what they are building. They rarely check that the wrong user cannot. A **permission matrix** fixes that by turning the policy into a table. The rows are roles, or more precisely test users with those roles. The columns are actions, which means every endpoint and method. Each cell says allow or deny, and an automated test calls every endpoint as every role and checks the status code.

@fig be_authz_matrix | Five roles against five actions. Every deny cell is a test that most teams never write.

For object-level checks, the matrix needs two users of the same role. Asha and user 43 are both customers, and every endpoint that takes an id is called by Asha with user 43's objects, expecting 404 or 403. Generating these tests from the route table means a new endpoint automatically gets tested and fails until someone fills in its expected row. Security teams also run this as an automated scan against staging, with two accounts, swapping ids between them in every request, which is how most IDOR bugs are found in bug bounty programmes.

Logging decisions helps after the fact. Record every deny, and every allow on sensitive actions, with the user, action, resource and the policy version that decided. When an incident happens, the question "who exported tenant 9's orders last week, and which rule allowed it?" then has an answer.

:::interview Interview lens
**"How would you make sure a new endpoint does not ship with an authorization hole?"** Make the framework deny by default, so a route without a declared permission returns 403. Keep the rules in one authorize function or a policy engine instead of ad-hoc checks. Generate a permission matrix test from the route table that calls every endpoint as every role, and as a second user of the same role with the first user's ids, failing the build on any unexpected 200. Log denies and sensitive allows with the policy version, so mistakes that slip through can be found.
:::

:::key In one breath
A policy engine separates the decision point, such as OPA with Rego or Cedar, from the enforcement point in the application, so rules live in one reviewed, versioned place. Caching decisions or copying roles into tokens creates a window in which revoked permissions still work, 30 seconds for Wren's cache, so high-risk permissions need short TTLs, invalidation or live checks. Cache keys must name the user, action and resource. A permission matrix test calls every endpoint as every role and as a second user of the same role, because authorization bugs are missing denies.
:::

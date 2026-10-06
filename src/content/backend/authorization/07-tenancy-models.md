@part VII | Multi-tenancy models | We design how one backend serves 2,000 restaurant groups that must never see each other's data. The isolation model decides cost, operational effort and how bad a single bug can be. We will compare shared schema, schema per tenant and database per tenant, then cover how a request learns its tenant and how the database itself can enforce isolation. | where:7

## 25. Shared schema, separate schema, database per tenant

Wren's restaurant dashboard serves 2,000 customer organisations, from a single café to the Spice Group with forty branches. Each is a **tenant**, a customer whose data and configuration must stay separate from everyone else's while running on shared software. **Multi-tenancy** is serving many tenants from one deployment. The first design decision is where the separation lives in the database.

In the **shared schema** model, every tenant's rows sit in the same tables, and each row carries a `tenant_id` column. It is the cheapest model by far. One database, one set of tables, one migration, and adding a tenant is inserting a row. Its weakness is that isolation is a `WHERE tenant_id = ?` clause that every query must include. One query that forgets it leaks every tenant's data at once. Most SaaS products, including Salesforce's original architecture, use this model, made safe with the controls in Section 27.

In the **schema per tenant** model, each tenant gets its own PostgreSQL schema with its own copies of the tables, such as `t9.orders` and `t10.orders`. A forgotten filter cannot reach another tenant's tables, as long as the connection's search path is set correctly. The cost is scale. 2,000 tenants with 50 tables each is 100,000 tables, which slows catalogue queries, backups and tooling, and every migration runs 2,000 times, with a plan for the run where tenant 1,317 fails halfway.

In the **database per tenant** model, each tenant gets its own database, possibly its own server. Isolation is strongest, a noisy tenant cannot slow the others, and a tenant can be restored, moved to another region or deleted on its own, which helps with large customers' contracts and data-residency laws. The costs are large. If each tenant's database has a pool of 10 connections per app instance, 2,000 tenants need 20,000 connections from each instance, far beyond PostgreSQL's typical `max_connections` of 100 to a few hundred, so a connection router or pooler becomes mandatory. Operations, monitoring and upgrades multiply by 2,000.

@fig be_tenancy_models | Three isolation models. Moving right buys isolation with money and operational effort.

Many companies mix models. Small tenants share a schema, while the few largest, who pay for it and demand it, get dedicated databases. The application then needs a routing layer that maps each tenant to its storage location, which also makes moving a growing tenant from shared to dedicated a planned operation rather than a rewrite.

:::story Picture this
An office building. A shared schema is an open-plan floor where every desk has a name tag, cheap and flexible, and one careless person can read the next desk's papers. Schema per tenant is a floor of private offices with locks. Database per tenant is giving each company its own building, with its own reception, cleaning and bills.
:::

## 26. Tenant identification

Every request must know which tenant it belongs to before it touches data, and that knowledge must come from somewhere the client cannot simply forge. Wren sees three sources. The subdomain, as in `spice.wren.example`, is convenient for browser dashboards. A claim in the signed access token, `"tenant": "t9"`, is issued by Wren's own auth server at login. A header such as `X-Tenant: t9` is easy for API clients but is pure client input.

@fig be_tenant_id | Resolve the tenant once from a trusted source, verify membership, then carry it in the request context.

The rule is that naming a tenant is not the same as belonging to it. However the tenant is identified, the server must verify that the authenticated user is a member of that tenant on every request, using its own records or a claim it signed. If Asha sends `X-Tenant: t10` and the server trusts it, she is now reading the Burger Barn's orders, which is IDOR at the tenant level. A user who belongs to several tenants, such as a consultant working for two restaurant groups, picks one per request, and the server checks that particular membership.

Once resolved, the tenant goes into a request context object, together with the user, and every layer below reads it from there. Data access code takes the tenant from the context rather than from a function parameter that a caller might fill from user input. Background jobs that the request enqueues carry the tenant id explicitly in the job payload, because the context does not survive the trip through a queue.

## 27. Tenant isolation and row-level security

In a shared schema, the main risk is the forgotten filter. Application-level defences come first. A repository layer requires the tenant for every query, and ORMs support default scopes or query filters that add `tenant_id = ?` automatically, such as Hibernate filters and EF Core global query filters. Code review rejects raw queries on tenant tables that skip the repository.

PostgreSQL adds a database-level backstop called **row-level security** (RLS). The table is marked `ENABLE ROW LEVEL SECURITY`, and a policy such as `USING (tenant_id = current_setting('app.tenant')::int)` makes the database itself add that condition to every query. At the start of each transaction, the app runs `SET LOCAL app.tenant = 9`. From then on, `SELECT * FROM orders` returns only tenant 9's rows, even if the application code forgot the WHERE clause entirely. A bug that would have leaked every tenant now returns nothing from the others.

@fig be_tenant_rls | The database adds the tenant filter itself. A forgotten WHERE clause returns zero foreign rows.

RLS has sharp edges. Table owners and superusers bypass it by default, so the application must connect as a role that neither owns the tables nor has `BYPASSRLS`, and `FORCE ROW LEVEL SECURITY` applies it to the owner too. `SET LOCAL` must be used inside a transaction, because with a connection pooler a plain `SET` can leak the previous request's tenant into the next request on the same connection, which is a cross-tenant leak caused by the defence itself. Policies add a predicate to every query, so `tenant_id` must lead the relevant indexes. And maintenance jobs that legitimately cross tenants need a separate, audited role.

:::warn Watch out
Unique constraints and ids interact with tenancy. A unique index on `(email)` in a shared users table stops two tenants from each having a user with the same email, and sequential ids shared across tenants let one tenant estimate another's order volume. Make uniqueness per tenant, as in `UNIQUE (tenant_id, email)`, and use random or per-tenant ids where volumes are sensitive.
:::

:::interview Interview lens
**"How would you isolate tenants in a shared PostgreSQL schema?"** Every tenant-owned table gets a tenant_id, and the tenant is resolved per request from a trusted source, with membership verified. The data layer requires the tenant on every query, for example with an ORM global filter. As a backstop, enable row-level security with a policy on current_setting('app.tenant'), set it with SET LOCAL at the start of each transaction, and connect as a non-owner role without BYPASSRLS. Make unique constraints and indexes tenant-scoped, and test by trying to read one tenant's data with another tenant's context.
:::

:::key In one breath
A shared schema with a tenant_id column is cheapest and puts isolation in every WHERE clause, schema per tenant adds separation at the cost of 100,000 tables and repeated migrations, and database per tenant isolates fully at the cost of 20,000 pool connections and multiplied operations. Resolve the tenant from a trusted source, verify the user's membership on every request, and carry the tenant in the request context and in job payloads. Back the application filters with PostgreSQL row-level security set per transaction with SET LOCAL, connecting as a role that cannot bypass it.
:::

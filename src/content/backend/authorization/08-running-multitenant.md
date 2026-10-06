@part VIII | Running a multi-tenant backend | We deal with what happens after tenants are isolated on paper but still share CPUs, connections, caches and queues. One tenant's sale day can slow everyone, and one shared component that forgets the tenant can leak data. We will cover noisy neighbours and quotas, tenant-aware caching and jobs, and the paths through which data leaks between tenants. | where:8

## 28. Noisy neighbours, rate limits and quotas

Friday evening, the Spice Group runs a 50%-off promotion across forty branches. Its dashboards and order traffic jump to 800 requests per second, 40% of Wren's 2,000 peak, while the other 1,999 tenants together send their usual 1,200. Database connections, CPU and the order queue all fill with Spice Group work. A café on the other side of the country, which did nothing different, sees its dashboard time out. This is the **noisy neighbour** problem, where tenants share resources and one tenant's load degrades service for the others.

@fig be_noisy_neighbor | One tenant's promotion takes 40% of capacity. Without limits, every other tenant pays.

The defence is to make each tenant's share explicit. **Per-tenant rate limits** cap requests per second per tenant, with headroom set by plan, such as 50 per second for small tenants and 500 for enterprise ones, and return 429 with Retry-After when exceeded, as Unit X builds. **Quotas** cap consumption over longer periods, such as orders per month, storage, or exports per day, and are often tied to billing. Limits apply inside the system too. A per-tenant cap on concurrent database connections, or a separate connection pool for the largest tenants, stops one tenant from holding every connection while its slow reports run.

For the largest tenants, isolation can move up a level. Route their traffic to dedicated app instances, give them their own queue partitions or workers, or move them to their own database as in Section 25. This is sometimes called a cell or a pod architecture, where groups of tenants share a full copy of the stack, and one cell's trouble cannot spread beyond its tenants. Slack and Salesforce both describe architectures of this kind.

Measure per tenant as well as globally. A dashboard of latency and error rate split by tenant shows the noisy neighbour within minutes. A global average hides it, because 1,999 quiet tenants dilute the one that is suffering.

:::story Picture this
A shared office kitchen with one kettle. Most mornings everyone gets tea. The day one team hosts a workshop for forty guests, the queue reaches the stairs and nobody else gets a drink before their first meeting. A rule of "two kettle-loads per team per hour", or a second kettle for the big team, fixes it without banning workshops.
:::

## 29. Tenant-aware caching and jobs

Wren caches menus in Redis under keys like `menu:3`. Menu ids are unique per tenant, not globally, so the Spice Group's menu 3 and the Burger Barn's menu 3 collide. Whichever tenant loaded it last fills the cache, and the other tenant's customers see the wrong restaurant's dishes and prices. The fix is to include the tenant in every key, `menu:t9:3` and `menu:t10:3`. The robust version builds every cache key through one helper function that takes the tenant as a required argument, so a key without a tenant cannot be written by accident.

@fig be_tenant_cache | The leaky key collides across tenants. A helper that requires the tenant prevents it.

The same applies to anything stored on the tenant's behalf: CDN cache keys for tenant-specific pages, search indexes, file storage paths and feature-flag caches. HTTP caches need care too. A response for `spice.wren.example/dashboard` must not be served for `burgerbarn.wren.example/dashboard`, so the cache key must include the host, and private data must carry `Cache-Control: private`.

Background jobs have two tenant problems. The first is context. The request context with its verified tenant does not travel through a queue, so the job payload must carry the tenant id explicitly, and the worker must set its tenant context, and the RLS setting from Section 27, from that id before touching data. The second is fairness. If the Spice Group enqueues 50,000 report exports in a single FIFO queue, every other tenant's jobs wait behind them for hours. **Fair queueing** keeps a queue per tenant, or per tenant group, and has workers take jobs from the queues in turn, so each tenant gets a share of the workers regardless of how many jobs it enqueued.

@fig be_tenant_jobs | A single queue lets one tenant's backlog delay everyone. Round robin across tenant queues keeps it fair.

## 30. Data leakage across tenants

Cross-tenant leaks rarely come from the main request path, which everyone reviews. They come from shared side paths that someone added later. A reporting query written by hand, without the repository layer, forgets `tenant_id`. A cache key omits the tenant. A search index is queried without a tenant filter, and a search for "biryani" returns another restaurant's private draft menu. An export job loses its tenant context and exports from the wrong tenant, or from all of them. Support tools let staff search across every tenant, with logs that nobody reviews. Object storage keeps all tenants' files in one bucket under guessable paths.

@fig be_tenant_leak | Six shared paths. Each one has leaked tenant data in real systems.

Defences come in three groups. Structural controls make the mistake hard to write: repositories and cache helpers that require the tenant, RLS, per-tenant storage prefixes with access policies, and search queries built by a helper that always adds the tenant filter. Testing catches what slips through. Integration tests create two tenants with overlapping ids and assert that every endpoint, job and export returns only the caller's data, and a canary tenant whose data must never appear anywhere else can be checked in production logs and exports. Monitoring detects leaks after the fact, with audit logs of cross-tenant access by staff and alerts when a response for one tenant contains ids belonging to another.

The consequences of a leak are unusually severe in B2B software. A single bug exposes one customer's business data to their competitor, which ends contracts and, under data protection law, triggers mandatory breach notifications. That is why isolation deserves several overlapping layers.

:::warn Watch out
Connection poolers and thread pools reuse state. A tenant id stored in a thread-local, a session variable set with plain `SET`, or a global set during one request can survive into the next request handled by the same thread or connection. Clear tenant context at the end of every request, and prefer `SET LOCAL` inside a transaction.
:::

:::interview Interview lens
**"How do you stop one tenant from degrading the service for others?"** Make each tenant's share explicit. Apply per-tenant rate limits and quotas sized by plan, cap per-tenant concurrency on shared resources such as database connections, and use fair queueing so one tenant's backlog cannot starve others. Watch latency and errors per tenant, not just globally. For the largest tenants, move to dedicated workers, pools or databases, or a cell architecture that limits how many tenants share one copy of the stack.
:::

:::key In one breath
Tenants share CPUs, connections, caches and queues, so one tenant's promotion at 800 of 2,000 requests per second can degrade everyone, and per-tenant rate limits, quotas, concurrency caps and dedicated capacity for large tenants contain it. Every cache key, storage path and search query must include the tenant, built by helpers that require it. Background jobs carry the tenant id explicitly and use fair queues per tenant. Leaks come from side paths, such as reports, caches, search, exports, support tools and storage, so isolate structurally, test with overlapping tenants and monitor.
:::

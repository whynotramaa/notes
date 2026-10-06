@part VIII | Monoliths and microservices | We weigh one deployable application against many small services, without the slogans that usually surround the choice. Splitting a system buys independence in specific dimensions and pays for it in network calls, data ownership and operations. We will cover the monolith, the modular monolith and microservices, what microservices cost including the distributed monolith, and what actually scales independently. | where:8

## 22. Monolith, modular monolith and microservices

Wren began, like most companies, as a **monolith**, one codebase built into one deployable application that handles every feature, with one database. A monolith is the simplest thing that works. A function call between features takes nanoseconds and cannot fail with a network error. A transaction can update orders and payments atomically. One deploy ships everything, one set of logs shows everything, and a new engineer can run the whole system on a laptop. Shopify, Stack Overflow and Basecamp have run some of the busiest sites on the web as monoliths for many years.

Monoliths get into trouble as the team grows, not as traffic grows. With 80 engineers in one codebase, every deploy contains dozens of unrelated changes, so one bad change blocks everyone's release. Test suites take an hour. Modules reach into each other's tables and internals, so a change to orders breaks the restaurant dashboard in ways nobody predicted. The problem is coupling, and a large monolith without boundaries is sometimes called a **big ball of mud**.

@fig be_dep_architectures | The same features as a monolith, a modular monolith with enforced boundaries, and separately deployed services.

A **modular monolith** keeps one deployable but enforces boundaries inside it. Each module, orders, payments, menus, couriers, owns its own tables, exposes a small public interface, and may not reach into another module's internals or data. Tools enforce the rules in CI, such as Shopify's Packwerk for Ruby or ArchUnit for Java, and module boundaries line up with teams. This keeps most of the monolith's simplicity while fixing the coupling that hurts. Unit V covered its internal architecture.

**Microservices** split the system into separately deployed services, each owning one business capability and its own data, communicating over the network by API calls and events. Each team deploys its service on its own schedule, chooses its own scaling, and is on call for it. Amazon's move to services in the early 2000s, and Netflix's later, are the famous examples. The real benefit is organisational, independent deployment and ownership for many teams. Technical benefits such as independent scaling are real but narrower than usually claimed, section 24.

The useful question is not "monolith or microservices" but "where are the boundaries, and which of them need to be network boundaries?". A modular monolith with clean boundaries can be split later along those lines, a service at a time, often with the **strangler fig** pattern, where a proxy routes one endpoint at a time to a new service until the old code is unused. A monolith with no boundaries cannot be split cleanly at all, and splitting it first produces the worst of both, section 23.

@fig be_dep_strangler | A proxy routes one endpoint at a time to the new service until the old code is unused.

## 23. What microservices cost, and the distributed monolith

Every boundary that becomes a network call takes on the problems of earlier units. **Network failures**: a call that was a function call can now time out, fail halfway or succeed without the caller knowing, so it needs timeouts, retries with idempotency, circuit breakers and fallbacks, Unit X. **Latency**: each hop adds serialisation, a network round trip and the callee's queueing, a millisecond or more instead of nanoseconds, and fan-out turns component tails into common slowness, Unit XIV. **Availability**: if a request needs five services in series, each at 99.95%, the best it can achieve is 0.9995⁵ ≈ 99.75%, Unit XIV.

**Data ownership** is the deepest cost. Each service owns its data, so a query that was one SQL join across orders and restaurants becomes two API calls or a copy of data kept in sync by events. A business operation that updated two tables in one transaction now spans two databases, and there is no distributed transaction a sensible team uses in the request path. It becomes a **saga**, a sequence of local transactions with compensating actions when a later step fails, built on the transactional outbox, Unit VIII. Consistency becomes eventual, and the product must handle the window when it is not.

@fig be_dep_distributed_monolith | A distributed monolith: services that must deploy together, share a database and call each other synchronously in chains.

**Operations** multiply. Each service needs its own pipeline, dashboards, alerts, on-call, runbooks, dependency upgrades and security patches. **Service discovery**, Unit XI, **versioning** of every internal API and event schema, Part VI, **observability** through distributed tracing, Unit XIV, and local development of a system no laptop can run are all new work. A platform team often appears just to make this bearable.

The anti-pattern to avoid is the **distributed monolith**, services that are separate in deployment but not in design. Its signs are services that must be deployed together because a change in one breaks another, services that share a database and each other's tables, long chains of synchronous calls where one slow service stalls all of them, and a shared library of domain models that every service must upgrade in lockstep. It has every cost of microservices, network failures, latency, operational load, and none of the benefits, since nothing is independent. It usually comes from splitting by technical layer, a "database service" and an "email service", or by nouns, rather than by business capability with its own data, or from splitting a monolith before its boundaries were clear.

## 24. What actually scales independently

"Microservices scale better" is the answer interviewers hear most and like least. A monolith scales horizontally too, by running more copies behind a load balancer, Unit XI, and many monoliths handle large traffic that way. The precise claim is that separate services let each part be scaled, deployed and resourced on its own, and it is worth checking what that buys in numbers.

Suppose every Wren monolith instance uses 1 core and 2 GiB of memory, mostly for caches and loaded code shared by every feature. Search becomes CPU-heavy and needs 16 more cores at peak. Scaling the monolith means 16 more instances, each carrying the full 2 GiB, 32 GiB of extra memory, mostly holding code and caches for features that are not busy. As a separate service, search instances might need only 0.5 GiB each, so 16 cores cost 8 GiB. The saving, 24 GiB, is real, and it grows with the mismatch between components' needs. But it is a resource efficiency, often modest, not the ability to scale at all.

@fig be_dep_scale_independently | Adding 16 cores of search: 16 monolith copies carry 32 GiB, a search service carries 8 GiB.

What genuinely separates is a longer list. **Deployment**: the search team ships without waiting for orders. **Failure**: a memory leak in search crashes search pods, not checkout, which is the bulkhead of Unit X at the process level. **Resources**: search runs on CPU-optimised nodes, image processing on GPU nodes, each with its own autoscaling. **Technology**: a service can use the language or database that fits it, at the cost of more to maintain. **Data**: each service's database can be sized, tuned and sharded for its own load. **Ownership**: each team has a clear boundary for code, on-call and decisions.

So the decision rests on organisation first. A team of eight with one product almost always does best with a modular monolith, maybe with one or two services split out for a clear reason, such as a component with very different resource needs, a stricter security boundary like payment card handling, or a different availability requirement. As teams multiply and their release schedules collide, splitting along the existing module boundaries buys independence where it is needed. Wren runs a modular monolith for its core ordering flow, plus separate services for search, realtime, image processing and payments, each split out for one of those concrete reasons.

:::story Picture this
A restaurant kitchen. A small kitchen with one team and one pass works best with everyone in one room, shouting across. A huge banqueting operation splits into a pastry kitchen, a butchery and a cold room, each with its own staff and hours, at the cost of runners, order tickets and the occasional lost tray. Splitting the small kitchen into separate rooms would add the runners and tickets without adding any independence.
:::

:::note Conway's law
Melvin Conway observed in 1967 that systems end up shaped like the communication structure of the organisations that build them. Teams that own services end to end produce clean service boundaries; teams split by layer produce systems split by layer. Many organisations now design team boundaries and service boundaries together.
:::

:::warn Watch out
Splitting a codebase into services before its module boundaries are clear produces a distributed monolith with shared tables, lockstep deploys and synchronous call chains. Establish boundaries inside a modular monolith first, then split along them where independence is needed.
:::

:::interview Interview lens
**"Should this system be microservices?"** It depends on what needs to be independent. Start from a modular monolith with enforced boundaries, which keeps local calls and transactions. Split a service out when a component needs independent deployment by a separate team, different resources or scaling, fault isolation, or a stricter security boundary. Accept the costs explicitly: network failures needing timeouts and idempotency, latency and composed availability, data ownership with sagas and eventual consistency, versioned contracts, tracing and per-service operations. Avoid the distributed monolith of shared databases and lockstep deploys.
:::

:::key In one breath
A monolith gives local calls, transactions and simple operations, and hurts through coupling as teams grow. A modular monolith enforces boundaries inside one deployable. Microservices give independent deployment, ownership, failure isolation and resources, and cost network failures, latency, composed availability such as 0.9995⁵ ≈ 99.75%, data ownership with sagas and eventual consistency, and multiplied operations. A distributed monolith has the costs and none of the benefits. Independent scaling is a resource saving, 8 GiB instead of 32 GiB for 16 cores of search here, not the only way to scale, so split along clear boundaries for concrete reasons.
:::

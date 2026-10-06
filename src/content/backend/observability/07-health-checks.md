@part VII | Health checks | We give the platform a way to ask each instance whether it is alive and whether it should receive traffic. These checks are tiny endpoints with outsized consequences, because the platform acts on them automatically by restarting instances and removing them from rotation. We will cover liveness, readiness and startup checks, and why a health check must not depend on everything. | where:7

## 23. Liveness, readiness and startup

A load balancer or orchestrator cannot read Wren's dashboards. It decides which instances get traffic, and which should be restarted, by calling a small endpoint on each one and looking at the status code. Kubernetes, Unit XV, distinguishes three questions, and most platforms ask some version of them.

**Liveness** asks whether the process is alive in a useful sense, or stuck in a way only a restart can fix. A deadlocked thread pool, an event loop blocked forever, or a process wedged after running out of file descriptors still holds its port and may still accept TCP connections, but will never answer a request. A liveness endpoint such as `/livez` returns 200 if the process can run code and answer, and the platform restarts the container if it fails several times in a row. With a check every 10 seconds and a failure threshold of 3, a stuck instance is restarted after about 30 seconds.

@fig be_obs_probes | Startup gates the other two. Readiness controls traffic. Liveness controls restarts.

**Readiness** asks whether this instance should receive traffic right now. An instance can be alive but not ready while it is warming its cache, while it is shutting down, or while it is overloaded and wants a break. A failing readiness check, `/readyz`, removes the instance from the load balancer's pool without restarting it, and a passing one adds it back. With a check every 5 seconds and a threshold of 3, an unready instance stops getting new requests within about 15 seconds. Readiness is also the key to graceful shutdown, Unit XV, where an instance fails readiness on purpose, waits for the balancer to notice, finishes its in-flight requests and then exits.

**Startup** asks whether the process has finished starting. Some services take a long time to boot, loading a large model, warming a JIT compiler or running a migration check. Without a startup check, a liveness check with a 30-second budget would kill a service that needs 90 seconds to start, and the instance would loop forever, restarting before it is ever ready. A startup probe runs first, with its own generous budget, such as 30 attempts 10 seconds apart, 300 seconds in all, and liveness and readiness begin only after it passes.

The endpoints themselves should be cheap and fast, answering in a few milliseconds without allocating much or taking locks, because they run every few seconds on every instance for the life of the service. They should run on the same server and thread pool as real requests, so that a blocked request path also blocks the check. And they should not need authentication, but should be reachable only from inside the cluster, since a detailed health page can reveal versions and dependencies to an attacker.

## 24. Why health checks must not depend on everything

A well-meaning engineer makes Wren's liveness check thorough. It pings PostgreSQL, Redis, Kafka and the payment provider, and returns 500 if any fails. One evening, PostgreSQL fails over to its replica, which takes about 20 seconds, Unit VI. During those 20 seconds every instance's liveness check fails three times in a row, and the platform restarts all four instances at once. They come back with empty caches and empty connection pools, all open 10 connections each to the newly promoted database at the same moment, and all their requests miss the cache together. A 20-second database blip has become a full outage of several minutes, and the restarts made it worse.

The central rule for health checks is that **liveness must check only the process itself**. A restart fixes a stuck process. It cannot fix a database, and restarting every instance because a shared dependency is down turns one failure into two, with the restarts often arriving as a thundering herd on the recovering dependency.

@fig be_obs_health_cascade | A liveness check that pings the database restarts the whole fleet during a 20-second failover and hits the new primary with a cold herd.

Readiness needs more care, because there is a real argument for checking dependencies. If one instance has lost its own connection to the database, because its pool is broken, it is better to take that one instance out of rotation. But if the database is down for everyone, every instance fails readiness at once, the load balancer has no healthy instances, and it returns errors for every request, including ones that did not need the database, such as menu pages served from cache. A partial outage becomes a total one.

Wren's rules come from these failures. Liveness checks only that the process can serve a request, by answering from the request path without touching dependencies. Readiness checks the instance's own condition, startup finished, not shutting down, not overloaded beyond its concurrency limit, and its own critical local state, such as a pool that is not broken. It does not fail because a shared dependency is down. Dependency failures are handled by the request path itself, with timeouts, circuit breakers and fallbacks, Unit X, which can return cached data or a clear 503 for the affected endpoints only. Dependency health is reported on a separate, detailed status endpoint for dashboards and humans, never wired to automatic restarts.

Some balancers add a safeguard of their own. Envoy and several cloud balancers enter **panic mode** when too large a share of instances is unhealthy, and spread traffic across all instances anyway, on the reasoning that a mass failure of health checks is more likely a bad check than a dead fleet. That is a useful backstop, not a design.

:::story Picture this
A hospital that sends a nurse home whenever the pharmacy is closed. One night the pharmacy shuts for an hour and every nurse is sent home, so patients who only needed a bandage now get no care at all, and an hour later every nurse arrives back at once to a queue. A nurse who cannot work should go home. A closed pharmacy is a reason to tell patients that medicine will be late.
:::

:::note Deep checks for synthetic monitoring
End-to-end checks that place a test order through every dependency are valuable, but as external synthetic monitoring that alerts humans, not as probes that restart or remove instances. Wren runs one every minute from three regions and pages if it fails repeatedly.
:::

:::warn Watch out
A liveness check that pings the database will restart your whole fleet the next time the database fails over. Liveness checks the process only. Readiness checks the instance's own state. Shared dependencies are handled in the request path and shown on dashboards.
:::

:::interview Interview lens
**"What should a health check check?"** It depends which one. Liveness asks whether the process is stuck and should be restarted, so it checks only the process and never dependencies, because restarting cannot fix a database and mass restarts make outages worse. Readiness asks whether this instance should get traffic, covering startup, shutdown, overload and its own local state, but not shared dependencies, or one outage makes every instance unready. Startup protects slow boots from liveness. Handle dependency failure in the request path with timeouts and fallbacks, and show dependency health on dashboards.
:::

:::key In one breath
Liveness asks whether the process is stuck and triggers restarts, about 30 s after failing three 10-second checks. Readiness asks whether the instance should get traffic and removes it from the balancer without restarting, and graceful shutdown uses it on purpose. Startup gives slow boots their own budget, such as 300 s, before the other checks begin. Never make liveness depend on a shared dependency, or a 20-second database failover restarts the whole fleet into a cold herd, and keep shared dependencies out of readiness too, handling them in the request path with timeouts and fallbacks.
:::

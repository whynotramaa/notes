@part VI | Service discovery | Routers need a current list of destinations without looking it up for every request. Caching that list preserves availability but delays endpoint changes. We will build a registry, compare client and proxy lookup, and trace stale membership through shutdown and recovery. | where:6

## 22. Registries and service discovery

A replacement score server starts with a new private address. Hard-coded routing still points at the old process. **Service discovery** translates a logical service identity into usable endpoints and associated information such as ports, location and eligibility.

A **service registry** stores advertised membership. An endpoint registers or a platform controller publishes its existence; routers consume the resulting directory. A registration is not proof that the service handles requests correctly. Health evidence and lifecycle state refine which known endpoints are eligible for work.

Heron's illustrative registry changes at time 10 seconds, while a router holds a list fetched at time 0 with a 30-second cache lifetime. It can keep the old list for another $30-10=20$ seconds if it refreshes only at expiry. Read that interval as expiration time minus change time. A directory can be correct at its source while a router still makes an old decision.

@fig sd_tr_registry | Illustrative membership publication and router caching. Orange marks the registry's new list, which the request path has not necessarily consumed yet.

The registry needs ownership rules for updates. A crashed old process must not overwrite its replacement's current registration after waking. Stable service names, instance identifiers, generation numbers and bounded leases can make that distinction. The configuration consumer also needs to reject invalid updates without discarding a usable previous configuration.

A registry outage should not automatically break every request. Routers can keep a last known endpoint set under a declared freshness policy, while active health filters obviously failed destinations. This trades stale membership against total routing loss. The correct choice depends on whether old destinations remain safe to contact, especially during authority changes.

The directory is part of the **control plane**, which computes and distributes routing state. The **data plane** uses accepted state to forward user traffic. Separating them lets requests continue during a short control-plane disruption without pretending that configuration remains fresh forever.

:::story Picture this
A taxi dispatcher maintains a board of drivers and their radio channels. A cab joining updates the board, but a dispatcher working from a printed copy may still call a departed driver. The board describes membership; a radio reply supplies evidence that a listed driver can actually accept the next fare.
:::

## 23. Client-side and proxy-side discovery

An application needs to call the score service. It can ask a library to choose from discovered addresses, or send to a stable proxy that makes the choice. **Client-side discovery** puts endpoint lookup and selection in the caller. **Proxy-side discovery** puts those decisions in an intermediary.

The client-side path fetches a directory, caches it and selects an eligible destination for each new attempt. It avoids an extra forwarding hop but repeats configuration, retry and load-signal behavior across clients. Updating the policy may require changing libraries or applications unless the client consumes external configuration.

A proxy-side path sends the call to a stable address. The proxy owns its endpoint set and selection policy, while the caller still owns the logical request deadline and business retry identity. Heron's five endpoints and 20-socket per-endpoint pool imply 100 upstream sockets per proxy in the illustrative configuration. Adding proxies multiplies their pools; centralized policy is not centralized resource usage.

@fig sd_tr_discovery_modes | Client and proxy paths consume the same service directory at different points. Orange marks the proxy-owned selection and pool boundary.

The costs differ. A proxy adds network and process work, can concentrate failure, and must preserve caller identity and deadlines. A client library spreads selection but may leave different languages with different failure policies. A sidecar can localize proxy behavior while increasing process count and configuration distribution work.

Do not choose from a preference for fewer boxes. Ask where endpoint state, retry decisions and security policy should live for the actual service fleet. A bounded client can be enough for a small uniform environment; a proxy can make heterogeneous callers easier to govern. [Envoy's discovery reference](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/service_discovery) provides concrete DNS and endpoint-discovery mechanisms without requiring every caller to implement them.

:::note Stable name, changing endpoints
A service identity is not one machine address. Preserve the logical name in configuration and observability while recording which endpoint handled an attempt. This lets a retry remain the same business operation even when its transport destination changes.
:::

## 24. DNS discovery, push updates and stale state

Heron's router refreshes its cached list at time 31 seconds. The registry update occurred at time 10, so the router used stale membership for $31-10=21$ seconds in this trace. Expiry at 30 did not itself fetch or apply new information.

Discovery can use periodic DNS resolution, polling a registry or consuming pushed endpoint updates. DNS offers a familiar name-to-address mechanism but its TTL does not compel every application or connection pool to immediately replace a socket. A push stream can carry changes quickly while introducing stream disconnection, reconnection and update validation obligations.

@fig sd_tr_stale | Illustrative timeline from fetch at 0 to registry update at 10, cache expiry at 30 and refresh at 31. Orange marks when the router actually consumes the new set.

A cached membership decision has several ages. The registry's view may already lag the platform; the router's cached view can lag the registry; an established pool can outlive the router's latest list. These are different stages, and removing an address at one does not retroactively terminate every connection at the others.

For shutdown, Heron should advertise draining and allow routing propagation before final exit. For failure, requests can expose the problem before discovery catches up, so health and bounded attempts still matter. A request that hits a stale address may fail cheaply at connect time or may reach an old process still capable of changing state. The latter needs a generation or authority check rather than just a shorter TTL.

The edge case is an empty update during control-plane disruption. A consumer should distinguish "the service has intentionally no endpoints" from "the fetch failed." Replacing a valid list with empty state on every timeout can convert a partial control outage into a full data outage. Retain accepted state under a documented maximum age and alert on increasing uncertainty rather than reporting stale data as current.

:::warn Watch out
A TTL is not a deadline by which every client must use the new route. Resolver caching, delayed refresh, application caches and established sockets each have their own lifecycle. Measure actual convergence at the router making the decision.
:::

## 25. Registration leases and safe endpoint removal

An old Heron application is partitioned from the registry but remains connected to some clients. Its registration lease expires and a replacement starts. If the old application later rejoins, both processes may still receive work from different cached views.

A **registration lease** bounds how long membership is accepted without renewal. It helps remove abandoned instances, but it cannot stop the old process from running. For stateless score reads, stale selection can often be handled with health and retry. For an exclusive write owner, safe transfer needs a **fencing token**, a generation that the authoritative storage checks so a stale owner cannot write.

The illustrative cached-list lifetime is 30 seconds. A change at time 10 can leave the old endpoint selected for 20 more seconds under an expiry-driven consumer. Shorter leases reduce one detection interval but can also remove healthy members during control-plane delay. Read lease and cache durations as independent bounds; subtracting them or calling them the same timeout would be incorrect.

@fig sd_tr_remove | Membership removal changes future assignment. Orange marks the authoritative generation check that rejects an old writer even if a stale router still reaches it.

Safe planned removal begins with rejecting new ownership or advertising draining, then waits for the relevant configuration and request lifetimes. The endpoint finishes or releases current work before exit. If clients hold connections indefinitely, the protocol needs an explicit reconnect signal and final cutoff rather than an infinite wait.

For unplanned removal, preserve the difference between available transport and valid authority. A healthy replacement cannot invent missing state or establish that the old owner is fenced. The routing unit stops at endpoint choice, but it must expose the dependency on state ownership rather than quietly treating discovery as consensus. Part VII applies that boundary to regional writes.

:::interview Interview lens
**"Why is service discovery not enough for safe failover?"** Discovery tells routers which endpoints to try, and its consumers can hold stale views. It neither stops an old process nor transfers exclusive write authority. I combine discovery with health, draining and a checked ownership generation where the business requires one owner.
:::

:::key In one breath
Service discovery maps logical names to endpoints, while health decides which known endpoints can serve. Clients or proxies can own selection, with different deployment and resource costs. Cache expiry, applied updates and existing pools determine real convergence. Leases bound membership evidence, while fencing protects authoritative writes from a stale owner.
:::

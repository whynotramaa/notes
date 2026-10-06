@part VI | Gateways and service meshes | We look at two kinds of proxy layer that organisations add as they grow, one at the front door and one between every pair of services. Both centralize cross-cutting work, and both can become expensive, slow and fragile if they take on more than they should. We will cover the API gateway and its limits, the service mesh, and what a mesh costs. | where:6

## 17. The API gateway

As Wren grew from one application into a dozen services, its clients faced a dozen hostnames, a dozen authentication schemes and a dozen rate-limit policies. An **API gateway** puts one entry point in front of all of them. Clients call `api.wren.example`, and the gateway routes `/users/*` to the users service, `/orders/*` to orders and `/payments/*` to payments. Kong, Apigee, AWS API Gateway, Envoy Gateway and Nginx-based gateways are common.

The gateway's job is the work every request needs and no single service should own. It terminates **TLS**. It **authenticates** requests, verifying JWTs or API keys, Unit III, and passes a verified identity to services in a header they trust. It applies **rate limits and quotas** per user, API key and plan, Unit X. It routes, including by API version, sending `/v1/orders` to the old implementation and `/v2/orders` to the new, Unit V. It **transforms** requests and responses in small ways, adding headers, rewriting paths, translating between REST and gRPC. And it **logs and measures** every request in one consistent format, generating the request id.

@fig be_gw_jobs | Every request stops once at the plaza for the shared checks, then takes its lane to a service.

Centralizing these gives consistency, since every service gets the same authentication and limits without reimplementing them, and gives one place to see all traffic. It also gives a single point where external policy changes, such as a new partner's quota, are made without touching services.

A gateway is still a proxy on the critical path of every request, so the operational rules from Parts I to IV apply in full. It runs as several instances behind a layer 4 balancer, it has timeouts and limits of its own, and its configuration is code, reviewed and tested. When the gateway is down, everything is down, which is why gateways are deliberately kept simple.

## 18. What should not live in the gateway

Gateways attract features. A team needs to join two services' responses for the mobile home screen, and the gateway can do it. Another wants to validate order totals before they reach the orders service, and the gateway sees every order. Someone adds a pricing rule for a promotion. Each change is small and each makes sense alone. After a year, the gateway contains business logic from five teams, every change needs the gateway team's review and a deploy of the component that fronts all traffic, and a bug in a promotion rule can take down checkout.

The principle, which Martin Fowler and James Lewis summarized for microservices as **smart endpoints and dumb pipes**, is that the infrastructure in the middle stays generic and the services at the ends hold the logic. Wren's gateway handles authentication, limits, routing, logging and simple header and path transforms. It does not validate business rules, compute prices, call databases, or aggregate responses from several services.

@fig be_gw_not | Business logic in the gateway couples every team to one deploy. A thin gateway with client-specific BFFs keeps ownership clear.

The legitimate need behind aggregation, giving a mobile app one call for its home screen, has its own pattern, the **backend for frontend**, or BFF, which Sam Newman described in 2015. Each client type gets a small service owned by the team that builds that client. The mobile BFF calls menus, orders and recommendations and shapes the result for the app's screens. The web BFF does the same for the website. The BFFs sit behind the gateway as ordinary services, and when the mobile team wants a different response shape, they change their own BFF without asking anyone. GraphQL servers, Unit V, often play this role.

The test for any proposed gateway feature is simple. Does every service need it, and is it independent of any service's domain? Authentication, rate limiting and request ids pass. Anything that knows what an order or a menu is fails, and belongs in a service or a BFF.

## 19. The service mesh

A gateway handles traffic entering from outside, often called north-south traffic. Inside, Wren's services call each other constantly, east-west traffic, and each call needs the same things Unit X built for third-party calls, timeouts, retries with budgets, circuit breakers and load balancing, plus encryption, authentication between services, and metrics. Implementing all of it in every service, in several languages, gives inconsistent behaviour and slow upgrades.

A **service mesh** moves that work into a proxy next to every service instance. In the classic design, each pod gets a **sidecar** container running a proxy, usually **Envoy**. The application sends plain HTTP or gRPC to what it thinks is the payments service, the sidecar intercepts the connection through iptables rules, and the sidecar handles everything else. It discovers payments instances, balances requests across them, applies timeouts, retries and circuit breaking, encrypts the connection, and records metrics and traces. The sidecar next to payments receives the connection, verifies it, applies its own policies and passes the request to the payments application on localhost.

@fig be_mesh_sidecar | Every pod has an Envoy sidecar. The control plane pushes routes, policies and certificates to all of them.

The sidecars form the **data plane**, which carries every request. A **control plane**, such as Istio's istiod or Linkerd's control plane, configures them. It watches Kubernetes for services and endpoints, compiles routing rules and policies written as Kubernetes resources, and pushes them to every proxy through Envoy's **xDS** APIs, the discovery services for listeners, routes, clusters and endpoints. Changing a retry policy or shifting 10% of traffic to a canary is a configuration change the control plane distributes in seconds, with no application deploy.

The headline feature is **mutual TLS** between services. The control plane acts as a certificate authority, issuing each workload a short-lived certificate encoding its identity, often in the **SPIFFE** format, such as `spiffe://wren/ns/prod/sa/orders`, and rotating it every few hours. Sidecars perform mTLS on every connection, so every call is encrypted and both ends know exactly which service they are talking to. Authorization policies can then say "orders may call payments' charge endpoint, and nothing else may", a zero-trust network inside the cluster, Unit XIII.

@fig be_mesh_mtls | Both sidecars present workload certificates. Policy decides which identities may talk.

Istio, from Google, IBM and Lyft in 2017, and Linkerd, from Buoyant in 2016 and rewritten in Rust for its proxy, are the best-known meshes. Cilium's mesh uses eBPF in the kernel for much of the same work.

## 20. What a mesh costs

The mesh's benefits are real, and so are its costs, which the syllabus asks about directly.

Resources come first. Every pod gets a proxy, with its own memory and CPU. At an illustrative 50 MB per sidecar, Wren's 400 pods spend 20 GB of memory on proxies, plus CPU for TLS and HTTP parsing on every request. For small services the sidecar can use more resources than the application. Latency comes next. Each call between services now passes through two extra proxies, the caller's and the callee's, each adding a little, often around a millisecond at the tail, so a request that fans out across ten internal calls in sequence pays it ten times.

@fig be_mesh_cost | Illustrative costs of running a sidecar per pod.

Operations are the largest cost. The mesh is a distributed system of its own, with a control plane that must stay available, sidecars that must be upgraded across every pod, usually by restarting them, and a configuration language with many interacting resources. Failures become harder to debug, since a 503 might come from the application, its sidecar, the remote sidecar or a policy, and engineers need to read Envoy's logs and access codes as well as their own. Retries configured in the mesh can multiply with retries in application code, Unit X. And start-up ordering can bite, when an application starts before its sidecar is ready and its first calls fail.

Because of these costs, the newer generation of meshes moves away from sidecars. **Istio's ambient mode**, generally available since Istio 1.24 in 2024, runs a per-node proxy for mTLS and basic layer 4 policy, and adds layer 7 proxies only for services that need them. Cilium does much of the work in eBPF programs in the kernel. Both cut per-pod overhead substantially.

Wren's rule for adopting a mesh is to start from the problems. If the need is mTLS everywhere and consistent telemetry across many services in several languages, a mesh is worth its cost. If the need is retries and timeouts in three services written in one language, a shared library is cheaper and simpler. A mesh is infrastructure for an organisation that has many teams and many services, not a starting point for a small system.

:::story Picture this
A large office building. The front desk checks every visitor's badge, logs them in and directs them to the right floor, which is the gateway. In a high-security building, every office also has its own receptionist who checks each colleague who walks in, records the visit and escorts them out, which is the mesh. It is very secure and very observable, and it doubles the number of people on the payroll.
:::

:::note Gateway API
Kubernetes' Gateway API, generally available since 2023, standardizes configuration for both ingress gateways and mesh routing, with resources such as Gateway, HTTPRoute and GRPCRoute. It replaces the older Ingress resource's annotations with portable, role-separated objects that most gateways and meshes now implement.
:::

:::warn Watch out
Turning on mesh-wide retries without removing retries from application clients multiplies attempts at every hop, and a mesh default of a few retries per call across a five-service chain can turn one failing request into hundreds. Decide which layer owns retries for each call path.
:::

:::interview Interview lens
**"What does a service mesh give you, and why might you not use one?"** It moves service-to-service concerns into proxies beside each instance, configured by a control plane: mutual TLS with workload identities, authorization policies, load balancing, timeouts, retries and circuit breaking, traffic shifting for canaries, and uniform metrics and traces, all without application changes. The costs are memory and CPU per sidecar, extra latency per hop, a complex control plane to operate and upgrade, and harder debugging. For a few services in one language, libraries are simpler. Sidecarless designs such as Istio ambient and Cilium reduce the overhead.
:::

:::key In one breath
An API gateway is the single entry point that terminates TLS, authenticates, rate-limits, routes by path and version, transforms lightly and logs every request, and it must stay free of business logic, with client-specific aggregation in backends for frontends. A service mesh puts a proxy, usually Envoy, beside every service, configured over xDS by a control plane, giving mTLS with short-lived SPIFFE identities, policy, balancing, retries, breakers and telemetry for east-west traffic. It costs memory per sidecar, about 20 GB for 400 pods at 50 MB, latency per hop and real operational complexity, which sidecarless designs reduce.
:::

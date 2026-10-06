@part V | Service discovery | We let services find each other by name instead of by address. Instances start, stop and move constantly, and a hardcoded IP address is wrong the moment it is written. We will cover client-side and server-side discovery, registries, DNS and heartbeats, and how Kubernetes Services do it. | where:5

## 14. Names instead of addresses

When Wren had one server per service, the order service's configuration said `PAYMENTS_URL=http://10.43.19.72:8080`. Then payments moved to a new machine and the order service kept calling the old address. Then payments scaled to six instances, and a single address could not represent them. Then instances started being replaced on every deploy, autoscaled several times an hour, and rescheduled onto new nodes when machines failed. An address stopped being a fact about the service and became a fact about one instance at one moment.

**Service discovery** is the mechanism that maps a stable service name, such as `payments`, to the current set of healthy instance addresses. It has two parts, a source of truth about which instances exist and are healthy, and a way for callers to use that information.

There are two broad designs for the second part. In **client-side discovery**, the caller asks the registry for the list of instances and picks one itself, using one of Part III's algorithms. Netflix's Eureka with its Ribbon client, gRPC's built-in resolvers and balancers, and Consul-aware client libraries work this way. There is no extra hop, and the client can balance per request even over long-lived connections, which solves Part IV's problem. The cost is that every client, in every language, needs discovery and balancing logic, and a bug in a client library affects everything that uses it.

@fig be_sd_discovery | The client looks up instances and calls one directly, or it calls a balancer that does the lookup.

In **server-side discovery**, the caller sends requests to a fixed address, a load balancer or proxy, which looks up the instances and forwards each request. Cloud load balancers, Kubernetes Services and service mesh sidecars work this way. Clients stay simple, any language works, and discovery logic lives in one place. The cost is an extra hop, and an extra component that must itself be highly available.

Most modern platforms blend the two. A Kubernetes pod calls `payments` by name, which looks like server-side discovery to the application, while kube-proxy rules or a sidecar on the same machine do the balancing, so the "server" is local and the extra hop costs almost nothing.

## 15. Registries, DNS and heartbeats

The source of truth is a **service registry**, a database of instances and their health. Each instance **registers** when it starts, with its service name, address, port and metadata such as version and zone, and **deregisters** when it shuts down cleanly. Instances that crash cannot deregister, so the registry needs to detect them. Two methods are common. **Heartbeats**, or TTL checks, require each instance to report in periodically, every 10 s for example, and the registry removes an instance whose TTL of 15 s passes without a heartbeat. **Health checks** have the registry or a local agent probe each instance, the same active checks as Part III.

@fig be_sd_registry | Two instances keep heartbeating. The third goes silent and is dropped after its 15 s TTL.

The registry itself must be highly available and consistent enough that callers do not get wildly different answers. **Consul**, from HashiCorp in 2014, uses Raft for its servers and runs agents on every node that check local services and answer queries. **etcd**, Unit IX, stores Kubernetes' entire state, including which pods are ready. **ZooKeeper** was the registry for an earlier generation of Java systems. All three offer watches, so clients learn about changes immediately rather than polling.

**DNS** is the most widely understood discovery interface. A registry can answer DNS queries, so `payments.service.consul` returns the addresses of healthy payments instances, and every language and tool can use it with no library. SRV records add ports and priorities. DNS has known weaknesses for discovery, though. Clients and libraries cache answers, sometimes ignoring TTLs, so a removed instance can keep receiving traffic for minutes. The JVM historically cached DNS lookups forever unless configured otherwise. Many clients take only the first address returned, which defeats any balancing the registry intended. And DNS responses have size limits that can truncate large instance lists.

Wren therefore uses DNS only for names that change slowly, such as the database's endpoint, and relies on the platform's built-in discovery, next section, for services, with short TTLs and clients configured to respect them where DNS is unavoidable.

## 16. Kubernetes Services

Kubernetes builds discovery into the platform, so application code only ever uses names. A **Service** is an object that selects a set of pods by label, such as `app: payments`, and gives them a stable virtual IP, the **ClusterIP**, and a DNS name. CoreDNS, the cluster's DNS server, answers `payments.default.svc.cluster.local`, or simply `payments` from a pod in the same namespace, with that ClusterIP, here 10.96.14.7.

The ClusterIP is not assigned to any machine. On every node, **kube-proxy** watches the Service's endpoints and programs the kernel, with iptables rules, IPVS or nftables, so that packets addressed to 10.96.14.7 are rewritten to the address of one of the ready payments pods, chosen at random or by IPVS's algorithms. The translation happens on the caller's own node, so there is no central balancer and no extra network hop.

@fig be_sd_k8s | A stable name and virtual IP. Rules on each node translate it to a ready pod.

The list of ready pods lives in **EndpointSlices**, which the control plane updates as pods pass or fail their readiness probes, Unit XV. A pod that is starting, or draining during shutdown, is removed from the slice, and kube-proxy on every node stops sending it new connections within seconds. That is the platform's version of Part III's health checks and draining.

Two variations matter. A **headless Service**, with `clusterIP: None`, has no virtual IP, and its DNS name returns the pod IPs themselves, which lets gRPC clients or databases do client-side discovery and balancing. And because kube-proxy's translation happens per connection, a ClusterIP is a layer 4 balancer, with exactly Part IV's problem for long-lived gRPC connections. Wren's internal gRPC calls therefore use headless Services with client-side balancing, or the mesh's sidecars, Part VI, which balance per request.

Traffic from outside the cluster enters through a Service of type LoadBalancer, which asks the cloud for an external balancer, or through an **Ingress** or the newer **Gateway API**, which configure layer 7 proxies such as Nginx or Envoy to route by host and path to Services inside.

:::story Picture this
A company directory instead of a list of desk phone numbers. People move desks, join, leave and work from different floors, but "call accounts" always reaches someone in accounts, because the switchboard keeps the current list and connects you. A sticky note with last year's extension is the hardcoded IP.
:::

:::note Discovery across clusters and regions
Calling a service in another cluster or region adds questions of which instances are local, how to fail over, and how to keep latency down. Meshes and registries offer locality-aware routing, preferring instances in the caller's zone and falling back to other zones only when local ones are unhealthy, which also reduces cross-zone data transfer charges.
:::

:::warn Watch out
Long-lived processes that resolve a service name once at start-up and cache the address, or connection pools that never reconnect, keep talking to old instances after deploys and failovers. Respect DNS TTLs, set a maximum connection lifetime in pools, and prefer the platform's discovery.
:::

:::interview Interview lens
**"How do services find each other in a dynamic environment?"** Through a service registry that tracks healthy instances by name, fed by registration with heartbeats or health checks, such as Consul, etcd or the Kubernetes control plane. Callers either query it and balance themselves, client-side discovery, or call a balancer that does, server-side discovery. Kubernetes gives each Service a stable DNS name and ClusterIP, with kube-proxy on every node translating to ready pods from EndpointSlices, and headless Services return pod IPs for client-side balancing.
:::

:::key In one breath
Service discovery maps a stable name to the current healthy instances, because addresses change with every deploy, scale event and failure. Client-side discovery has callers query a registry and balance themselves, server-side discovery puts a balancer in between, and registries such as Consul and etcd learn of instances by registration, heartbeats with TTLs and health checks, exposing them by API, watches or DNS, whose caching is its weakness. Kubernetes Services give `payments.default.svc.cluster.local` a ClusterIP that kube-proxy translates on each node to ready pods listed in EndpointSlices, and headless Services return pod IPs for client-side balancing.
:::

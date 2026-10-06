@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Reverse proxies

**Q1. Forward proxy or reverse proxy?**

A forward proxy acts for clients and hides them from servers. A reverse proxy acts for servers, giving clients one stable address while instances change behind it.

**Q2. What does a reverse proxy do?**

TLS termination, routing by host and path, load balancing, health checks, compression, static files, caching, buffering, limits on size, rate and time, and header rewriting.

**Q3. How does the application learn the client's IP behind proxies?**

From X-Forwarded-For or Forwarded, read from the right, skipping addresses of its own trusted proxies and taking the first untrusted one. Entries to its left can be forged.

**Q4. Why must the trusted proxy list be exact?**

Trusting any address lets clients forge X-Forwarded-For and evade rate limits, poison logs or bypass IP-based rules.

### Nginx

**Q5. How does Nginx serve many connections without a thread per connection?**

Each worker is a single-threaded event loop over non-blocking sockets registered with epoll or kqueue, so idle connections cost only a little memory and the worker never blocks. One worker per core uses all cores.

**Q6. What do the master and workers do?**

The master reads configuration, binds ports and manages workers, including graceful reloads. Workers accept connections and handle all requests.

**Q7. How do you estimate Nginx's connection capacity?**

Workers times worker_connections gives sockets, and each proxied request uses two, client and upstream, within the file descriptor limit.

**Q8. What does proxy buffering do?**

Nginx reads the upstream response quickly into buffers and feeds slow clients itself, freeing the application. It is turned off for streaming responses.

**Q9. Why enable upstream keep-alive?**

Without it, every request opens a new connection to the backend, adding handshakes, piling up TIME_WAIT sockets and exhausting ephemeral ports under load.

**Q10. What is sendfile?**

A system call that sends file data to a socket inside the kernel, avoiding copies through user space. kTLS lets it work with HTTPS.

### Load balancing

**Q11. L4 or L7 load balancing?**

L4 balances TCP or UDP connections by address and port, fast and protocol-agnostic, once per connection. L7 terminates HTTP and balances per request using host, path, headers and cookies.

**Q12. Name the common algorithms.**

Round robin, weighted round robin, least connections, least response time, random, power of two choices and consistent hashing.

**Q13. Why is power of two choices so effective?**

Comparing two random backends sharply reduces the maximum load compared with one random pick, needs no global state, and avoids many balancers herding onto the same least-loaded backend.

**Q14. What problem does consistent hashing solve?**

With hash mod n, changing n remaps most keys. On a ring, adding a node moves only the keys in its arc, about 1/n of them, and virtual nodes even out the shares.

**Q15. Active versus passive health checks?**

Active checks probe backends on a schedule. Passive checks eject backends that fail real traffic. Both need thresholds of several consecutive results.

**Q16. What are slow start and connection draining?**

Slow start ramps traffic to a new or returning backend. Draining stops new work to a backend while letting in-flight work finish before it is removed.

**Q17. What are the costs of sticky sessions?**

State tied to one backend is lost when it fails, load becomes uneven with heavy users, and scaling and deploys move users. Keeping state external avoids needing them.

### TCP load balancers

**Q18. Full proxy, NAT or DSR?**

A full proxy terminates and re-originates connections. NAT rewrites addresses and returns replies through the balancer. DSR lets backends reply directly, so the balancer only carries inbound traffic.

**Q19. What is the PROXY protocol?**

A header sent at the start of a TCP connection carrying the original client and destination addresses and ports, so backends learn the client without HTTP headers. Both sides must agree to use it.

**Q20. What is conntrack and how does it fail?**

The kernel's table of translated connections on NAT machines. When it is full, new connections are dropped with only a kernel log message.

**Q21. Why do new pods get no traffic after scaling a gRPC service?**

L4 balancing chooses once per connection, and gRPC clients keep HTTP/2 connections for hours, so existing connections stay on old pods. Use L7 or client-side balancing, or a maximum connection age.

### Service discovery

**Q22. Client-side or server-side discovery?**

Client-side has callers query a registry and pick an instance, saving a hop and allowing per-request balancing. Server-side puts a balancer in between, keeping clients simple.

**Q23. How does a registry know an instance has died?**

Through heartbeats with a TTL or health checks. Instances that stop reporting or fail checks are removed.

**Q24. What are the weaknesses of DNS for discovery?**

Caching beyond TTLs, clients using only the first address, slow propagation of removals, and response size limits.

**Q25. How do Kubernetes Services work?**

A Service selects pods by label and gets a DNS name and ClusterIP. kube-proxy on each node translates the ClusterIP to a ready pod from EndpointSlices. Headless Services return pod IPs directly.

### Gateways and meshes

**Q26. What belongs in an API gateway?**

TLS, authentication, rate limits and quotas, routing including by version, light transformations, and uniform logging and request ids.

**Q27. What should not be in a gateway, and where does it go?**

Business logic, validation of domain rules, pricing and multi-service aggregation. They belong in services or in backends for frontends owned by client teams.

**Q28. What does a service mesh provide?**

mTLS with workload identities, authorization between services, discovery and per-request balancing, timeouts, retries and circuit breaking, traffic shifting and uniform telemetry, through proxies configured by a control plane.

**Q29. What are the costs of a mesh?**

Memory and CPU per sidecar, extra latency per hop, a complex control plane to run and upgrade, harder debugging, and the risk of duplicated retries.

### Private networks

**Q30. What makes WireGuard different from older VPNs?**

A small codebase with fixed modern cryptography, a one round trip Noise-based handshake, peers identified by public keys, silent to unauthenticated packets, and roaming built in.

**Q31. How can two machines behind separate NATs connect directly?**

Each learns its public endpoint from STUN, they exchange endpoints through a coordination server, and both send UDP to each other at once, so each NAT creates a mapping that admits the other's packets.

**Q32. When does hole punching fail, and what then?**

With symmetric NATs that use a different port per destination, or networks that block UDP. Traffic then goes through a relay, such as Tailscale's DERP over HTTPS, still end-to-end encrypted.

**Q33. What do Tailscale's control and data planes do?**

The coordination server authenticates devices through SSO and distributes public keys, endpoints and ACLs. WireGuard carries traffic between devices directly or through relays.

### Sockets in production

**Q34. What are the SYN and accept queues?**

Half-open connections wait in the SYN queue, completed ones in the accept queue until the application calls accept. The accept queue is capped by the listen backlog and somaxconn and overflows silently.

**Q35. TIME_WAIT or CLOSE_WAIT?**

TIME_WAIT is held for 60 s by the side that closed first and is normal. Many CLOSE_WAIT sockets mean the application is not closing connections the peer has closed.

**Q36. What causes ephemeral port exhaustion?**

Opening and closing many connections to one destination, since each closed one holds its port in TIME_WAIT for 60 s, so about 470 new connections per second with the default range. Reuse connections.

**Q37. HTTP keep-alive versus TCP keepalive?**

HTTP keep-alive reuses a connection for many requests. TCP keepalive probes idle connections to detect dead peers and keep NAT and balancer entries alive, and its Linux default of 7,200 s is far too long.

**Q38. How can a service fail at 20% CPU?**

By running out of file descriptors, ephemeral ports, conntrack entries, accept queue space, connection pool slots or a dependency's connection limit.

### Cloud

**Q39. VM, container or serverless?**

VMs give a full OS to manage, containers share a kernel and are orchestrated, and serverless runs code per event with automatic scaling, cold starts and execution limits.

**Q40. Public and private subnets?**

Public subnets route to an internet gateway and hold load balancers and NAT gateways. Private subnets have no inbound route from the internet and hold applications and data, reaching out through NAT gateways.

**Q41. Security group or network ACL?**

Security groups are stateful allow rules attached to resources and can reference other groups. Network ACLs are stateless numbered rules on subnets.

**Q42. Why use IAM roles instead of access keys?**

Roles give workloads short-lived credentials from the platform, so there are no long-lived secrets to leak or rotate, and permissions are scoped per workload.

**Q43. Zones or regions?**

Zones are independent data centres close together in a region and are the unit of high availability. Regions are far apart and are the unit of disaster recovery and global latency.

### Primary sources

[Nginx documentation, Inside NGINX and the ngx_http_upstream_module](https://nginx.org/en/docs/). Workers, buffering and keepalive.

[RFC 7239, Forwarded HTTP Extension](https://www.rfc-editor.org/rfc/rfc7239). The standard forwarding header.

[Karger et al., Consistent Hashing and Random Trees, 1997](https://dl.acm.org/doi/10.1145/258533.258660). The original consistent hashing paper.

[Mitzenmacher, The Power of Two Choices in Randomized Load Balancing](https://www.eecs.harvard.edu/~michaelm/postscripts/mythesis.pdf). The analysis behind two choices.

[HAProxy, The PROXY protocol specification](https://www.haproxy.org/download/2.9/doc/proxy-protocol.txt). Versions 1 and 2.

[Donenfeld, WireGuard: Next Generation Kernel Network Tunnel, NDSS 2017](https://www.wireguard.com/papers/wireguard.pdf) and [Tailscale, How NAT traversal works](https://tailscale.com/blog/how-nat-traversal-works). Tunnels and hole punching.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Capacity and limits

**E1** ● Nginx runs 16 workers with worker_connections 4,096. How many concurrent proxied clients can it hold?

**E2** ● A client opens 3,000 new connections per second to one backend and closes each after one request. How many sockets are in TIME_WAIT at steady state?

**E3** ● With the port range widened to 1024 to 65535, what is the new-connection ceiling to one destination?

**E4** ● With the default range, how many new connections per second can a client sustain to two backend addresses on the same port?

**E5** ● What fraction of keys moves when a cache cluster grows from 9 to 10 nodes with consistent hashing, and with hash mod n?

**E6** ● A NAT node with nf_conntrack_max 262,144 sees 5,000 new short connections per second, each tracked for 120 s after closing. How long until the table is full?

**E7** ● A mesh adds a 60 MB sidecar to each of 1,200 pods. How much memory do the sidecars use?

**E8** ● A request makes 6 sequential internal calls, each through two sidecars adding 0.5 ms each. How much latency do the sidecars add?

**E9** ● Requests are 1 KB and responses 20 KB at 50,000 requests per second. How much traffic does a NAT-mode balancer carry, and a DSR balancer?

**E10** ● A /22 subnet on AWS holds how many usable addresses? Is it enough for 40 nodes each running 30 pods with VPC addresses?

**E11** ● Active checks run every 5 s with 2 failures to eject, and passive checks eject after 5 consecutive errors on a backend receiving 100 requests per second. How quickly does each detect a hard failure?

**E12** ● After a deploy, 2,000 clients reconnect within 100 ms, and the accept loop handles 5,000 accepts per second. How deep must the accept queue be?

**E13** ● For 1,000 backends, compare the asymptotic maximum load terms ln n ÷ ln ln n and ln ln n ÷ ln 2.

**E14** ● A NAT drops idle connections after 350 s. Is Linux's default TCP keepalive enough? Suggest values.

### Traces and explanations

**E15** ●● A request arrives with `X-Forwarded-For: 10.9.9.9, 198.51.100.7, 203.0.113.50` from the load balancer at 10.0.1.20, and trusted ranges are the CDN's 203.0.113.0/24 and 10.0.0.0/16. What is the client address, and why?

**E16** ●● Choose L4 or L7 balancing for PostgreSQL replicas, a public HTTP API routed by path, internal gRPC calls, and WebSocket connections.

**E17** ●● Nginx returns occasional 502s on keep-alive connections to an app whose idle timeout is 5 s while Nginx's is 60 s. Explain and fix.

**E18** ●● Trace UDP hole punching between a laptop behind NAT 198.51.100.7 and a server behind NAT 203.0.113.80.

**E19** ●● Explain why hole punching fails when one side's NAT is symmetric, and what Tailscale does.

**E20** ●● A service's CLOSE_WAIT count grows by thousands per hour. What is wrong and how do you find it?

**E21** ●● Classify for the gateway or elsewhere: JWT verification; partner quotas; checking that an order's items exist; combining menu and recommendations for the app home screen; adding X-Request-Id.

**E22** ●● Describe three ways DNS-based discovery sends traffic to a removed instance.

**E23** ●● Trace a request from an orders pod to `payments` through a Kubernetes ClusterIP Service.

### Design

**E24** ●●● Write the essential parts of an Nginx configuration for Wren's orders API behind a CDN, with real IP handling, buffering, upstream keep-alive and timeouts.

**E25** ●●● Design Wren's VPC across two zones, with subnets, routing, gateways and security groups.

**E26** ●●● Show that when a new node joins a consistent hashing ring of n nodes with uniformly random positions, the expected fraction of keys that move is 1 ÷ (n + 1).

**E27** ●●● Design a zero-downtime rolling deploy through a cloud balancer, Nginx ingress and Kubernetes, covering readiness, draining and keep-alive.

**E28** ●●● Design service-to-service communication for 30 services in three languages, deciding whether to use a mesh.

**E29** ●●● Design secure engineer access to production databases using a tailnet.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 16 × 4,096 = 65,536 sockets, and each proxied client uses 2, so about 32,768 clients.

**E2.** 3,000 × 60 = 180,000 sockets in TIME_WAIT.

**E3.** 65,535 − 1,024 + 1 = 64,512 ports, so about 64,512 ÷ 60 ≈ 1,075 new connections per second to one destination.

**E4.** Each destination address has its own 28,232 ports, so about 2 × 470 ≈ 941 per second.

**E5.** With consistent hashing about 1/10 of keys move. With hash mod n, a key stays only if its hash has the same remainder modulo 9 and 10, which is 9 of every 90 residues, 10%, so 90% move.

**E6.** Entries accumulate at 5,000 per second and last 120 s, aiming for 600,000, more than the maximum. The table fills in 262,144 ÷ 5,000 ≈ 52 s, after which new connections are dropped.

**E7.** 1,200 × 60 MB = 72 GB.

**E8.** 6 calls × 2 sidecars × 0.5 ms = 6 ms.

**E9.** Inbound is 50,000 × 1 KB = 50 MB/s and outbound 50,000 × 20 KB = 1 GB/s. A NAT-mode balancer carries both, about 1.05 GB/s. A DSR balancer carries only the 50 MB/s inbound.

**E10.** A /22 has 1,024 addresses, and AWS reserves 5, leaving 1,019. 40 nodes plus 1,200 pods need 1,240, so it is not enough. Use a larger subnet, several subnets, or a network plugin that does not give pods VPC addresses.

**E11.** Active checks eject within 5 to 10 s, since two consecutive failed probes are needed. Passive checks eject after 5 consecutive errors, which at 100 requests per second takes about 50 ms.

**E12.** In 100 ms the loop accepts 500, so 1,500 connections must wait in the queue at the peak. A backlog of 128 drops most of them. One of 4,096 absorbs the burst.

**E13.** ln 1,000 ÷ ln ln 1,000 ≈ 6.91 ÷ 1.93 ≈ 3.57, against ln ln 1,000 ÷ ln 2 ≈ 1.93 ÷ 0.693 ≈ 2.79. The gap widens quickly with n, since the second grows doubly logarithmically.

**E14.** No. The default starts probing after 7,200 s idle, long after the NAT forgot the connection at 350 s. Set keepalive idle to about 60 s, interval 10 to 15 s and 3 to 5 probes on pooled connections, and close idle pooled connections after about 300 s.

**E15.** The connection comes from 10.0.1.20, which is trusted. Reading the header from the right, 203.0.113.50 is in the CDN's trusted range, so skip it. 198.51.100.7 is not trusted, so it is the client. 10.9.9.9, to its left, was supplied by the client and is ignored, even though it looks like a private address.

**E16.** PostgreSQL replicas: L4, since the protocol is not HTTP and connections are pooled. Public HTTP API routed by path: L7. Internal gRPC: L7 or client-side balancing, because long-lived HTTP/2 connections defeat L4. WebSockets: L7 for the upgrade and routing, with least-connections balancing at connection time, since each connection is a long session.

**E17.** The app closes idle connections after 5 s. Nginx thinks they are reusable for 60 s, so it sometimes sends a request on a connection the app has just closed, and the request fails with a 502. Set Nginx's upstream keepalive_timeout shorter than the app's idle timeout, for example 4 s, or raise the app's to above Nginx's, and let Nginx retry idempotent requests on a fresh connection.

**E18.** The laptop asks a STUN server and learns its mapping, 198.51.100.7:41641. The server learns 203.0.113.80:52010. Both send their endpoints to the coordination server, which tells each the other's. Both send UDP packets to each other's public endpoint. The laptop's packet creates a mapping in its NAT for 203.0.113.80:52010 and may be dropped at the server's NAT. The server's packet creates its NAT's mapping for 198.51.100.7:41641 and passes the laptop's NAT, which now has a matching mapping. After a round trip, packets flow both ways and WireGuard's handshake completes over the path.

**E19.** A symmetric NAT assigns a different public port for each destination, so the port the device learned from STUN is not the one it will use toward the peer, and the peer sends to a port with no mapping. With port prediction and many attempts it sometimes still works, but often it does not. Tailscale starts every connection over a DERP relay, reachable over HTTPS, and keeps trying direct paths in the background, upgrading if one succeeds. Traffic over DERP remains WireGuard-encrypted end to end.

**E20.** Sockets in CLOSE_WAIT have received the peer's FIN but the application never called close, so a code path is leaking connections, often a response body not closed on an error path or a client object created per request. Use `ss -tanp state close-wait` to find the process and the remote addresses, which identify the dependency, then check that code's handling of errors and timeouts, and add a descriptor count alert.

**E21.** JWT verification: gateway. Partner quotas: gateway. Checking that items exist: the orders service, since it is domain logic. Combining menu and recommendations for the home screen: a mobile BFF. Adding X-Request-Id: gateway.

**E22.** Clients or resolvers cache the answer longer than its TTL, so they keep the old address. Long-lived connections opened before the removal keep sending to it. Applications resolve once at start-up and never again, or the runtime caches lookups indefinitely, as older JVMs did.

**E23.** The pod resolves `payments` through CoreDNS to the ClusterIP 10.96.14.7. It opens a connection to 10.96.14.7:8080. On the pod's own node, kube-proxy's iptables or IPVS rules match the destination and rewrite it to a ready pod's address, such as 10.244.2.3:8080, chosen from the Service's EndpointSlices, and conntrack records the translation so later packets and replies follow it. The packet travels over the cluster network to that pod. If the pod becomes unready, it is removed from the EndpointSlice and new connections stop choosing it.

**E24.** A sketch:

```nginx
set_real_ip_from 203.0.113.0/24;  set_real_ip_from 10.0.0.0/16;
real_ip_header X-Forwarded-For;   real_ip_recursive on;
upstream orders { server orders-1:8080; server orders-2:8080;
                  keepalive 32; keepalive_timeout 4s; }
server {
  listen 443 ssl reuseport;  http2 on;
  client_max_body_size 1m;  client_header_timeout 10s;  client_body_timeout 10s;
  location /orders/ {
    proxy_pass http://orders;
    proxy_http_version 1.1;  proxy_set_header Connection "";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Request-Id $request_id;
    proxy_connect_timeout 200ms;  proxy_read_timeout 5s;
    proxy_buffering on;
    proxy_next_upstream error timeout; proxy_next_upstream_tries 2;
  }
}
```

Real IP handling trusts only the CDN and internal ranges, keep-alive reuses upstream connections with a timeout below the app's, buffering protects the app from slow clients, and timeouts and limits bound every phase.

**E25.** VPC 10.0.0.0/16 in zones a and b. Public subnets 10.0.0.0/24 and 10.0.1.0/24 hold the load balancer nodes and one NAT gateway per zone, with routes to an internet gateway. Private application subnets 10.0.16.0/20 and 10.0.32.0/20, large for pod addresses, route outbound through their zone's NAT gateway. Private data subnets 10.0.64.0/24 and 10.0.65.0/24 hold PostgreSQL primary and replica and Redis, with no outbound internet route. VPC endpoints for object storage and the secret manager. Security groups: the balancer accepts 443 from the internet and the CDN, nodes accept traffic only from the balancer's group, the database accepts 5432 only from the nodes' group, Redis 6379 likewise. Network policies inside Kubernetes restrict pod-to-pod traffic by namespace.

**E26.** Place n nodes uniformly at random on a ring of circumference 1, and then a new node, also uniform. By symmetry, all n + 1 nodes are exchangeable, so each owns the same expected share of the ring, the arc from its predecessor to itself, and these shares sum to 1. So the new node's expected share is 1 ÷ (n + 1). The keys that move are exactly those in its arc, which previously belonged to its successor, so the expected fraction of keys that move is 1 ÷ (n + 1), for keys hashed uniformly.

**E27.** Pods have a readiness probe on a lightweight endpoint and a preStop hook or SIGTERM handler. The Deployment uses maxUnavailable 0 and maxSurge 25%, so new pods start first, warm up, pass readiness and join the Service's endpoints, with slow start at the ingress. For each old pod, Kubernetes removes it from EndpointSlices and sends SIGTERM. The app keeps serving for a few seconds while kube-proxy, the ingress and the cloud balancer stop sending new requests, then stops accepting, finishes in-flight requests within terminationGracePeriodSeconds, sends `Connection: close` or GOAWAY on keep-alive and HTTP/2 connections, and exits. Nginx's upstream keepalive timeout is shorter than the app's, and the balancer's deregistration delay exceeds the drain time.

**E28.** With 30 services in three languages, consistent mTLS, policy, retries, timeouts and telemetry are hard to get from libraries alone, so a mesh is justified, preferably a lower-overhead one such as Istio ambient or Linkerd. The mesh issues SPIFFE identities and enforces mTLS everywhere, with default-deny authorization and explicit allows per caller and route. Retries and timeouts are configured per route in the mesh, and application clients do not retry. gRPC traffic is balanced per request by the mesh. Golden metrics and traces come from the proxies. A small platform team owns mesh upgrades, with canaried rollouts of the data plane. If the organisation were smaller, a shared library per language plus network policies would be the cheaper choice.

**E29.** Engineers' laptops join the tailnet through SSO with device posture checks and keys that expire every 30 days. A subnet router in each private data subnet advertises only the database addresses, or a bastion with Tailscale SSH sits beside them. ACL grants allow only the oncall group to reach tag:db on port 5432, and only through just-in-time access approved for a few hours. Database credentials are short-lived, issued by a secrets manager per session, and every connection is logged with the user's identity. No database port is exposed to the internet or to the general VPC, and direct WireGuard paths keep latency low, with DERP as the fallback.

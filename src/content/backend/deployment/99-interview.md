@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Containers

**Q1. What is a container image?**

A stack of read-only, content-addressed layers plus configuration for the command, user, ports and environment, pushed to a registry and identified immutably by its digest.

**Q2. Why does the order of Dockerfile instructions matter?**

Each instruction's layer is cached until its inputs change. Copying the dependency manifest and installing before copying source means code changes rebuild only the top layers.

**Q3. Tag or digest in a deploy manifest?**

Digest. Tags are mutable, so the image behind a tag can change; a digest always names the exact image that was tested.

**Q4. How is a container different from a virtual machine?**

A container is a host process isolated by namespaces and limited by cgroups, sharing the host kernel. A VM runs its own kernel on virtual hardware, with stronger isolation and more overhead.

**Q5. What do namespaces and cgroups each do?**

Namespaces change what a process can see, its PIDs, network, mounts, hostname, IPC and users. cgroups limit and account what it can use, memory, CPU, I/O and process count.

**Q6. What is an overlay filesystem?**

A union of read-only image layers and one writable container layer, merged into one view, with copy-on-write so containers share image layers.

**Q7. Why is PID 1 special in a container?**

The kernel does not apply default signal actions to PID 1, so an unhandled SIGTERM is ignored, and PID 1 must reap zombie children. Use exec-form CMD, handle SIGTERM, and use tini when the app spawns children.

**Q8. What does a multi-stage build achieve?**

It compiles in a full build image and copies only the outputs into a minimal runtime image, shrinking size and attack surface, for example from 1.2 GB to about 20 MB.

**Q9. How do you harden a container?**

Run as non-root, drop all capabilities, disallow privilege escalation, use a read-only root filesystem, use minimal base images, scan and rebuild regularly, sign images, and never put secrets in layers.

### Kubernetes objects

**Q10. What is a pod?**

One or more containers sharing a network namespace and volumes, scheduled together and replaced rather than repaired.

**Q11. How do Deployments, ReplicaSets and pods relate?**

A Deployment manages ReplicaSets, each keeping a count of pods from one template. A template change creates a new ReplicaSet that grows while the old shrinks, and rollback scales the old one back up.

**Q12. What does a Service provide?**

A stable name and virtual IP for the ready pods matching a selector, implemented through EndpointSlices and kube-proxy or eBPF.

**Q13. What is an Ingress and an ingress controller?**

An Ingress maps hosts and paths to Services with TLS. A controller such as Nginx reads Ingress objects and does the routing, behind one external load balancer.

**Q14. How should configuration and secrets reach a pod?**

ConfigMaps for configuration and Secrets for credentials, as mounted files or environment variables, with a hash on the pod template to roll changes out, and an external secret manager as the source of truth.

**Q15. Are Kubernetes Secrets encrypted?**

Only base64-encoded by default. Encrypt etcd at rest with a KMS key and restrict access by role.

**Q16. When do you use a StatefulSet?**

For pods needing stable names, stable network identity and their own persistent volumes, created and updated in order, such as databases and brokers.

**Q17. What are DaemonSets, Jobs and CronJobs for?**

One pod per node for agents, pods that run to completion with retries, and Jobs on a schedule with a concurrency policy.

### Scheduling, probes and autoscaling

**Q18. How does the scheduler choose a node?**

It filters nodes whose allocatable capacity fits the pod's requests and that satisfy affinity, taints and spread rules, then scores the remainder.

**Q19. Requests versus limits?**

Requests reserve capacity for scheduling and fair share. Limits are enforced at run time, memory by OOM kill and CPU by throttling.

**Q20. What are the QoS classes?**

Guaranteed when requests equal limits, Burstable when requests are below limits, BestEffort with neither, evicted first under memory pressure.

**Q21. What is CrashLoopBackOff and how do you debug it?**

A container failing repeatedly, restarted with delays doubling from 10 s to a 300 s cap. Read previous logs, the exit code and pod events.

**Q22. What does exit code 137 mean?**

128 plus 9, SIGKILL, usually an OOM kill or a forced stop after the grace period.

**Q23. How does the HPA compute replicas?**

Desired = ceil(current × current metric ÷ target), every 15 s, with a 300 s stabilisation window before scaling down.

**Q24. What does the cluster autoscaler do?**

Adds nodes when pods are pending for lack of capacity and removes underused nodes whose pods can move, respecting PodDisruptionBudgets.

### Graceful shutdown

**Q25. Describe the Kubernetes pod termination sequence.**

Endpoint removal and the preStop hook start together, then SIGTERM, then SIGKILL after terminationGracePeriodSeconds, 30 s by default.

**Q26. Why add a preStop sleep?**

Endpoint removal propagates to proxies over a few seconds. Pausing before shutdown keeps the pod serving until routing stops, avoiding 502s.

**Q27. What should an application do on SIGTERM?**

Stop accepting connections, finish in-flight requests with a deadline, close keep-alives with Connection: close or GOAWAY, stop consumers after committing offsets, flush telemetry, close pools, exit 0.

### Deployment strategies

**Q28. What is a build artifact and why build once?**

An immutable, signed image produced by CI. Promoting the same digest ensures what reaches production is what was tested.

**Q29. Explain maxSurge and maxUnavailable.**

How many pods may exist above the desired count, rounded up, and how many may be unavailable below it, rounded down, during a rolling update.

**Q30. What does a rolling update not protect against?**

A version that becomes ready but returns errors or is slow, since rollouts gate only on readiness.

**Q31. Blue-green versus canary?**

Blue-green switches all traffic between two full environments for instant rollback at double capacity. Canary exposes a small share of traffic and promotes only after metrics match the baseline.

**Q32. What is shadow traffic and its limitation?**

Mirroring real requests to a new version and discarding its responses, to compare results. Writes must be isolated or they duplicate side effects.

**Q33. What makes a rollback safe?**

Old code must handle all state the new code wrote, which requires forward compatibility and expand-and-contract migrations designed before the deploy.

### Compatibility

**Q34. Backward versus forward compatibility?**

Backward, new code reads old data and requests. Forward, old code reads data written by new code, needed during rollouts and after rollbacks.

**Q35. How do you add an enum value safely?**

In two releases. First deploy readers that tolerate the new value, then deploy writers that produce it.

**Q36. Describe expand and contract.**

Add the new structure, dual write, backfill in batches, switch reads, stop writing the old, then drop it later, each step compatible with its neighbours.

**Q37. Why set lock_timeout on migrations?**

So a migration waiting behind a long transaction gives up instead of queueing all other queries behind its lock request.

### Feature flags

**Q38. Why use feature flags?**

To separate deploy from release, roll out gradually by percentage and cohort, run experiments and turn things off instantly with kill switches.

**Q39. How are percentage rollouts made sticky?**

Hash the flag name and a stable user id into a bucket from 0 to 99, on when the bucket is below the percentage.

**Q40. Where should flags be evaluated?**

On the server for anything that matters, from a locally cached rule set with safe defaults. Client-side values are only for presentation.

**Q41. What is the risk of stale flags?**

Untested combinations, dead code and accidental reactivation, as in the Knight Capital loss. Flags need owners, expiries and removal of the losing path.

### Architecture and cost

**Q42. Monolith, modular monolith, microservices?**

One deployable; one deployable with enforced internal boundaries; separately deployed services each owning its data.

**Q43. What do microservices cost?**

Network failures, latency, composed availability, data ownership with sagas and eventual consistency, versioning, tracing and per-service operations.

**Q44. What is a distributed monolith?**

Services that must deploy together, share databases and call each other in synchronous chains, with the costs of microservices and none of the independence.

**Q45. "Microservices scale better." Respond.**

Monoliths scale horizontally too. Services let components scale, deploy, fail and be resourced separately, which saves resources when needs differ and gives teams independence.

**Q46. What drives a backend's cloud bill?**

Compute packing, databases, storage, internet egress, cross-zone and cross-region traffic, NAT processing, logs, metric cardinality, cache sizes, queue retention and search clusters.

**Q47. How do you investigate a high bill?**

Tag and allocate cost by service and environment, compute cost per unit of business, then rightsize requests, autoscale, commit or use spot, keep traffic local, cache and compress, sample logs and expire data.

### The full request

**Q48. Walk through GET /orders/123.**

DNS to an anycast edge, a warm TLS connection, edge WAF and cache, L4 balancer, ingress picking a ready pod, sidecar mTLS, HTTP parsing, middleware, JWT verification, validation, cache-aside through Redis and pooled queries, ownership check, a dependency call with a timeout, serialisation and the return path, with logs, metrics and traces at every hop.

**Q49. What if the access token expired?**

The API returns 401, the client refreshes with its rotating refresh token and retries once.

**Q50. Where does the time go on a warm request?**

About 70 ms: 40 ms of network round trips between phone, edge and origin, and about 30 ms on the server on a cache miss, most of it in queries and the payments call.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Arithmetic

**E1** ● A node has 7.5 allocatable CPU and 28 GiB. How many pods requesting 250m CPU and 0.5 GiB fit?

**E2** ● Repeat E1 for pods requesting 750m and 0.5 GiB.

**E3** ● 6 pods run at 85% CPU against a 60% target. What does the HPA choose?

**E4** ● 10 pods run at 30% against a 60% target. What does the HPA choose, and when?

**E5** ● A Deployment of 10 replicas has maxSurge and maxUnavailable of 25%. What are the minimum available and maximum total pods during a rollout?

**E6** ● A container fails immediately on every start. How long is the total back-off before the sixth restart, and the wait before the seventh?

**E7** ● Grace period 30 s, preStop 5 s, drain deadline 20 s, cleanup up to 3 s. Does it fit? What if the drain deadline is 30 s?

**E8** ● 3,000 requests a second, a 2% canary for 15 minutes. How many requests reach the canary?

**E9** ● Backfill 80,000,000 rows in batches of 10,000 at 50 ms per batch. How many batches and how long?

**E10** ● User 42's bucket for a flag is 37. Is the flag on at 25%? At 40%?

**E11** ● How many configurations do 12 independent boolean flags allow?

**E12** ● A request depends in series on 6 services at 99.9%. What is the best availability?

**E13** ● 43.2 million requests a day return 1,500 bytes each. What is a 30-day egress bill at $0.09 per GB?

**E14** ● Search needs 10 more cores. Monolith instances use 1 core and 3 GiB, search service instances 1 core and 0.75 GiB. Compare the extra memory.

**E15** ● Logs are 120 GB a day at $0.50 per GB ingested. What is the 30-day cost, and with sampling that keeps 25%?

**E16** ● Wren's request takes 5 ms to the edge, 15 ms to the origin, 30 ms on the server, and the same network time back. What is the total, and the share spent on the network?

### Traces and explanations

**E17** ●● A Dockerfile ends with `CMD node server.js`. Trace what happens on `kubectl rollout restart` and fix it.

**E18** ●● Reorder `COPY . .`, `RUN npm ci`, `COPY package*.json .` and `FROM node:22-slim` for good caching, and explain.

**E19** ●● A pod is in CrashLoopBackOff with last state OOMKilled, exit 137. Diagnose and fix.

**E20** ●● Trace a pod termination with no preStop hook and an app that closes its listener at once on SIGTERM. Where do 502s come from?

**E21** ●● Plan an expand-and-contract change from `price_cents integer` to `amount_minor bigint` plus `currency char(3)`.

**E22** ●● Choose a release strategy for a stateless API change, a switch of payment provider, a single-writer scheduler, and a new search ranking.

**E23** ●● Version N+1 writes status `"scheduled"`. It is rolled back, and old pods crash. Explain and redesign the release.

**E24** ●● List four signs of a distributed monolith in a design review.

**E25** ●● A bill's NAT gateway line tripled. Give likely causes and fixes.

**E26** ●● At which hops of GET /orders/123 would a 401, a 404, a 429, a 502 and a 503 be produced?

### Designs and proofs

**E27** ●●● Write a production Dockerfile for a Node.js API: multi-stage, non-root, exec form, signal handling and a small final image.

**E28** ●●● Design the release of `checkout_v2` from first commit to flag removal.

**E29** ●●● Give the full GET /orders/123 answer with one failure, its containment and its signal at each of six hops.

**E30** ●●● Prove that with constant load the HPA's choice brings per-pod utilisation to at most the target, and that hash-bucket rollouts only ever add users as the percentage rises.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** By CPU, 7.5 ÷ 0.25 = 30. By memory, 28 ÷ 0.5 = 56. CPU binds, 30 pods.

**E2.** By CPU, 7.5 ÷ 0.75 = 10. By memory 56. 10 pods.

**E3.** ⌈6 × 85 ÷ 60⌉ = ⌈8.5⌉ = 9 pods.

**E4.** ⌈10 × 30 ÷ 60⌉ = 5 pods, applied only after the lower recommendation has held for the 300 s stabilisation window.

**E5.** maxSurge rounds up, ⌈2.5⌉ = 3, so at most 13 pods. maxUnavailable rounds down, ⌊2.5⌋ = 2, so at least 8 available.

**E6.** 10 + 20 + 40 + 80 + 160 = 310 s of back-off before the sixth restart. The next delay would be 320 s, capped at 300 s.

**E7.** 5 + 20 + 3 = 28 s, which fits within 30 s. With a 30 s drain, 5 + 30 = 35 s exceeds the grace period, and SIGKILL arrives at 30 s, cutting off remaining requests and skipping cleanup.

**E8.** 3,000 × 0.02 = 60 requests a second, × 900 s = 54,000 requests.

**E9.** 80,000,000 ÷ 10,000 = 8,000 batches. 8,000 × 0.05 s = 400 s, about 6.7 minutes.

**E10.** At 25%, buckets 0 to 24 are on, so 37 is off. At 40%, buckets 0 to 39 are on, so it is on.

**E11.** 2¹² = 4,096.

**E12.** 0.999⁶ ≈ 0.99401, about 99.40%.

**E13.** 43,200,000 × 1,500 × 30 = 1,944,000,000,000 bytes, 1,944 GB. × $0.09 = $174.96.

**E14.** Monolith: 10 instances × 3 GiB = 30 GiB. Service: 10 × 0.75 = 7.5 GiB. The service saves 22.5 GiB.

**E15.** 120 × 30 × 0.50 = $1,800. Keeping 25%, $450.

**E16.** 5 + 15 + 30 + 15 + 5 = 70 ms. Network is 40 ms, about 57%.

**E17.** Shell form runs `/bin/sh -c "node server.js"`, so sh is PID 1 and does not forward SIGTERM. The kubelet sends SIGTERM, nothing happens, and after 30 s SIGKILL ends Node mid-request, failing in-flight requests on every pod. Fix: `CMD ["node", "server.js"]` so Node is PID 1, add a SIGTERM handler that drains, and add tini if Node spawns child processes.

**E18.** `FROM node:22-slim`, `COPY package*.json .`, `RUN npm ci`, `COPY . .`. Dependencies install in a layer that depends only on the package files, so source changes reuse it and rebuild only the final copy.

**E19.** The container exceeded its memory limit and the kernel killed it, signal 9, exit 137. Check memory metrics against the limit. If usage legitimately needs more, raise the request and limit together. If it grows without bound, it is a leak, Unit XIV. Also check runtime heap settings, such as Node's `--max-old-space-size` or the JVM's maximum heap, which should sit below the container limit.

**E20.** Endpoint removal and SIGTERM start together. The app closes its listener immediately, but kube-proxy rules, ingress upstream lists and mesh proxies on other nodes still route to the pod for a second or two. New connections are refused and existing keep-alive connections are reset, and the ingress returns 502 for them. A preStop pause and graceful draining with Connection: close or GOAWAY remove them.

**E21.** Add nullable `amount_minor bigint` and `currency char(3)`. Deploy code writing both old and new, reading old. Backfill `amount_minor = price_cents` and `currency = 'INR'` in batches. Add NOT NULL as NOT VALID CHECK constraints, then validate. Deploy code reading new, still writing both. Deploy code writing only new. After the rollback window, drop `price_cents`.

**E22.** Stateless API change: rolling update with automated canary analysis. Payment provider switch: a feature flag routing a percentage of payments to the new provider, with a kill switch. Single-writer scheduler: recreate, or a leader-elected rolling update so two never run, Unit IX. Search ranking: shadow traffic to compare results, then an A/B experiment flag measuring clicks and orders.

**E23.** The old version is not forward compatible with the new value, so after rollback every read of a scheduled order fails. Redesign: release 1 teaches readers to handle `"scheduled"`, for example by treating unknown values safely; release 2, after release 1 is everywhere, starts writing it, ideally behind a flag. Any rollback now lands on a version that understands the value.

**E24.** Services that must be deployed together for a change to work. Services reading or writing each other's tables or one shared database. Long synchronous call chains on the request path, where one slow service stalls the rest. A shared domain-model library that all services must upgrade in lockstep.

**E25.** Traffic from private subnets to the internet or to cloud services is going through the NAT gateway, billed per gigabyte: a new dependency pulling large responses, images pulled from a public registry on every node start, logs or metrics shipped to a vendor over the internet, or object storage reached through NAT instead of a private endpoint. Fixes: private endpoints for cloud services, a registry mirror or pull-through cache, compression, and checking which workloads send the bytes with flow logs.

**E26.** 429 at the edge or gateway rate limiter, or the app's limiter. 502 at the ingress or edge when the upstream connection fails or resets. 503 from the app's load shedding or concurrency limit, or the ingress when no ready pods exist. 401 from authentication middleware on an invalid or expired token. 404 from authorization when user 42 does not own the order, or from the controller when it does not exist.

**E27.** Stage one, `FROM node:22-slim AS build`, sets `WORKDIR /app`, copies `package*.json`, runs `npm ci`, copies the source and runs the build, then `npm prune --omit=dev`. Stage two, `FROM gcr.io/distroless/nodejs22-debian12`, copies `/app/node_modules`, `/app/dist` and `package.json` from the build stage, sets `USER 10001`, `ENV NODE_ENV=production`, `EXPOSE 8080` and `CMD ["dist/server.js"]`, which the distroless image runs with node as PID 1 in exec form. The server handles SIGTERM by closing the listener, draining with a 20 s deadline, closing idle connections and pools, then exiting. A `.dockerignore` excludes `.git`, `.env` and tests. The pod spec adds runAsNonRoot, drop ALL capabilities, a read-only root filesystem with an emptyDir for /tmp, and if child processes are spawned, an init such as tini.

**E28.** Create `checkout_v2` as a release flag with an owner and expiry, default off. Merge work daily behind it, with both paths tested in CI. Deploy continuously; nothing changes for users. Turn it on for staff, then a volunteer restaurant group, then one city, watching checkout SLOs, payment success and error rates per dependency. Run a 50/50 experiment on order completion if the change affects conversion. Ramp by percentage with sticky buckets, pausing at each step. Keep the old path as a kill switch until 100% has held for 30 days. Then delete the old code and the flag in one change, and record the removal.

**E29.** DNS: resolver cannot reach authoritative servers; serve-stale and long-lived connections contain it; resolution errors show it. Edge: one location fails; anycast reroutes; edge health and regional latency show it. Ingress: no ready pods after a bad rollout; readiness gating and canary abort contain it; 503s at the ingress show it. Application: JWT expired; 401 and client refresh contain it; auth failure rate shows it. Cache: Redis down; short timeouts, breaker, coalescing and stale local cache contain it; hit ratio drop and Redis errors show it. Database: primary failover; fail fast with retryable errors and idempotency keys contain it; write errors and the failover event show it.

**E30.** Let n pods run at average utilisation u against target t, so total load is L = n × u in units of one pod's request. The HPA chooses n' = ⌈n × u ÷ t⌉ ≥ n × u ÷ t, so the new utilisation is u' = L ÷ n' ≤ (n × u) ÷ (n × u ÷ t) = t. For rollouts, a user with fixed bucket b is on at percentage p exactly when b < p. If p rises to p' ≥ p, then b < p implies b < p', so every user on at p stays on at p', and the set of enabled users only grows.

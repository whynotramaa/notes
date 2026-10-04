@part VIII | The complete routed request | A finished route connects destination choices to the user's promised result. Healthy boxes can still return stale data or repeat a committed write. We will trace a score read and write, reconcile deadline and capacity arithmetic, and state the job of every routing component. | where:8

## 31. One score read from browser to response

A viewer requests match 7 and expects an authorized score within the declared deadline. We can now follow the request without treating any intermediary as magic. Begin with the hostname, resolve an entry, establish or reuse transport, and present the application request through the trusted edge.

On a permitted cache hit, the edge can return the response without application work. On this illustrative miss, the proxy interprets the route, selects the score service, filters its discovered endpoints through readiness and balances the request. The application authenticates the caller, checks access to match 7 and reads the version allowed by the consistency contract. The proxy streams the response back through the client connection.

The constructed serial trace from Section 26 totals 200 milliseconds. A **deadline budget** allocates part of a total request allowance to each stage while preserving the remaining time. With a 250-millisecond deadline, DNS, setup, TLS and routing consume $40+20+30+10=100$ milliseconds, leaving 150. Reserving 40 for return transfer leaves $150-40=110$ for application work.

@fig sd_tr_deadline | Illustrative 250-millisecond deadline after declared setup costs. Orange marks the 110 milliseconds available for application work while preserving 40 for the return path.

The worked request uses 60 milliseconds of application work, leaving $110-60=50$ milliseconds of modeled slack. Read slack as available stage budget minus actual stage time in this trace. Those means and allocated values do not establish a percentile guarantee, and an upstream request must carry the current remaining budget rather than a fresh 250 milliseconds.

@fig sd_tr_trace | Illustrative 200-millisecond serial read. Orange marks the application step; each row names the decision and its computed contribution rather than just a server label.

Failure can occur at each boundary. A DNS failure never reaches the proxy; an edge timeout can hide an application response; a successful status code can carry a disallowed old version. Trace identifiers connect attempts while version evidence establishes content correctness. An end-to-end availability check must examine the response promise, not merely count successful forwarding hops.

:::story Picture this
A courier has a delivery cutoff. Time already spent collecting the parcel cannot be awarded again at each depot. Every depot sees the time left and must leave enough for the final drive. A parcel arriving at a depot before cutoff is still late if the last journey cannot finish in the remaining time.
:::

## 32. One score write through failure and retry

The scorer posts a goal, the application commits it and the response connection breaks. The client sees a timeout. Nothing in that observation says whether the goal reached the score store.

An **operation identity** is a stable key naming one logical command across attempts. The gateway forwards it unchanged, the application validates the payload and authority, and the authoritative store commits the score change with enough identity state to recognize a repeat. If another application receives the retry, it returns the earlier result instead of applying another goal.

The routing deadline still applies. Heron's 250-millisecond total budget leaves the same modeled 110-millisecond application allowance after the declared setup and response reservations. A retry consumes the remaining allowance; it cannot begin with a new full budget. If there is insufficient time, return an uncertain or pending outcome that the client can query using the same operation identity.

@fig sd_tr_write_retry | A write commits before its response is lost. Orange marks the retry returning the committed result under the same operation identity, even through another application server.

A gateway cannot manufacture this guarantee by checking a local cache of keys. Its failure would lose the decision, and concurrent gateways could both admit the same command. The identity must be reconciled at the authoritative effect boundary. External publication follows the outbox mechanism from the queues unit when downstream events are required.

During regional failure, Section 29's fence checks still apply. Rerouting the command to a healthy application does not authorize a lagging region to become a writer. The application uses a state owner that can prove the valid generation or rejects the command temporarily. Transport recovery and transaction recovery cooperate through the identity and state contract rather than substituting for each other.

:::warn Watch out
A timeout is an observation of a missing timely response. It is not evidence of a rollback. Retrying a write with a new operation key can turn one uncertain command into two committed effects.
:::

## 33. Capacity and failure-budget reconciliation

Heron's route needs enough capacity at every stage. Five application servers meet the request workload, but five live gateways fail the one-loss connection requirement. These are different resource pools with different sizing units.

The applications provide $5\times300=1500$ requests per second normally and 1,200 after one loss. At a 1,000-per-second peak, survivor utilization is $1000/1200=0.833333$ after rounding. The live path needs at least six nominal gateways to retain 50,000 connections after one loss at the illustrative 10,000-per-gateway limit. Seven provide room below that limit, but still need measured handshake and replay capacity.

@fig sd_tr_sizing | Illustrative request, connection and recovery budgets reconciled separately. Orange marks the surviving application margin; no row substitutes for another resource's limit.

The API's response payload is 2,000,000 bytes per second, while live fan-out is 200,000,000 and recovery adds 10,000,000 under the declared 20-second spread. A network interface shared by these paths needs combined accounting rather than the API rate alone. The figures explicitly exclude protocol headers, retransmissions and encryption overhead.

The 30-day, 99.9-percent availability example permits 2,592 seconds of unavailability for its stated SLI. A modeled 30-second full-population interruption would consume $30/2592=0.011574$ of that allowance after rounding, or 1.157407 percent. Read the ratio as one accounted interruption divided by the permitted unavailable time. A partial outage requires the chosen request- or user-based accounting rule instead of blindly using wall-clock time.

A failure budget is not permission to ignore correlated failures. A shared database or network path can remove several apparently independent endpoints together. Name the failure domain, compute survivors and include recovery work before calling the fleet redundant. The arithmetic establishes consistency of assumptions; measured capacities establish whether the assumptions hold.

:::note Illustrated capacity is a hypothesis
The endpoint limits in this chapter are declared model inputs. A load balancer can distribute work within those limits but cannot validate them. Compare deployment measurements using the same request mix, latency boundary and failure conditions.
:::

## 34. Responsibilities of each routing component

An interviewer asks why the design has DNS, an edge, a gateway and a balancer. Naming product logos is not an answer. Each component needs an input, one decision and a failure contract.

| Component | Decision | Boundary to explain |
|---|---|---|
| DNS | Resolve a service name to an entry | Cache expiry and new resolutions |
| CDN or edge | Reuse a permitted cached response | Freshness, key and private data |
| Reverse proxy | Forward through a stable endpoint | Upstream pools and trusted metadata |
| API gateway | Apply bounded public API policy | Service route and caller identity |
| L4 balancer | Choose a connection destination | Flow ownership and reconnect |
| L7 balancer | Choose a request destination | Application parsing and load signal |
| Registry | Publish service membership | Stale consumers and update generation |
| Health policy | Filter usable endpoints | Detection time and false removal |
| Application | Produce the authorized result | State version and operation identity |

@fig sd_tr_jobs | Component reference card. Orange marks application authority, which healthy routing and nearby cached copies cannot replace.

For Heron, the answer starts with 1,000 peak API requests per second and 50,000 persistent viewers, then names their separate pools. Equal request routing assigns 200 per application normally and 250 after one loss. The live fleet sizes connection survival independently. Cache misses and replay then supply the demand that those pools must serve during recovery.

Read these numbers as a chain of constraints, not a collection of independent impressive totals. Choosing weighted routing changes endpoint shares; choosing affinity changes locality and skew; choosing a lower TTL changes resolution work and one convergence interval. Each choice has a cost and a testable reason grounded in the operation.

This chapter did not implement DNS authorities, transport packet forwarding, database replication or consensus. The networking and distributed-systems units open those boundaries. A routing design is complete when it names the component that supplies each needed guarantee and refuses to claim guarantees that forwarding alone cannot supply.

:::interview Interview lens
**"Walk me through your load-balancing design."** I start with the operation, its routing unit and its deadline. I choose eligible destinations from discovery and health, select a policy matching the scarce resource, and calculate surviving capacity. Then I trace a timeout or owner failure through stable identity, state recovery and reconnect rather than stopping at a new destination address.
:::

:::key In one breath
A complete route names every destination decision, trust boundary and remaining deadline. Score reads require authorized freshness, while uncertain score writes require stable identity at the effect boundary. Request, connection, cache-miss and replay capacity reconcile separately. Forwarding supplies reachability; state ownership and recovery supply the business result.
:::

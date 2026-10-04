from author import publish
raw=r'''
@part The public entry point | We separate locating a service from routing an individual request. Different entry layers have different information. We will follow DNS, the edge, and the load balancer.

## DNS and geographic routing

A viewer should reach a suitable region. **Geographic routing** selects an endpoint using location, policy, latency observations, or health. DNS answers can influence that choice but remain cached; existing connections do not move when the answer changes. Anycast routing can advertise the same address from several network locations, with route selection controlled by the network.

Choose the nearest suitable region, not merely the shortest map distance. Data authority, legal placement, capacity, and regional failure can constrain the destination. Heron's cached media may come from a nearby edge while a score command travels to the match's authoritative region.

@draw geo | split | READ DELIVERY AND WRITE AUTHORITY CAN DIFFER | [["media request","nearby suitable edge\ncacheable bytes"],["score command","authoritative region\nordered state"]] | Illustrative geographic roles. | nearby is not automatically authoritative

## CDN, reverse proxy, and API gateway

A **reverse proxy** accepts requests for backend servers. An **API gateway** adds application entry policy such as identity checks, quotas, and route selection. A CDN caches eligible responses at edge locations. One deployment may combine these roles, but each adds a different job and possible queue.

Heron's request path is viewer, DNS, CDN or edge, load balancer, then application server. Cacheable assets may finish at the edge; personalized API reads often continue. The gateway does not make downstream authorization unnecessary, especially for calls that bypass the public entry point.

@draw path | flow | ONE PUBLIC REQUEST PATH | ["DNS","edge","balancer","application"] | Illustrative route; a cache hit ends before the application. | every layer needs a reason to exist

:::key In one breath
DNS locates an endpoint and geographic routing chooses a suitable region. Edge caching shortens eligible reads. Reverse proxies represent backends and gateways enforce entry policy. Placement and authority are separate decisions.
:::

@part Routing information | We identify what the balancer can inspect. The route decision changes with the protocol boundary. We will compare L4 and L7 and separate request routing from connection routing.

## L4 versus L7

An L4 balancer can choose a backend from transport addresses and ports without interpreting HTTP. An L7 balancer can route by path, host, or headers and can attach request-level policy. TLS must terminate where encrypted application fields need inspection; encryption can resume to the backend.

A long-lived connection can keep one L4 choice for its whole lifetime. An L7 proxy may reuse or multiplex separate backend connections. A visible request count and a connection count therefore need not distribute the same way. Count the unit each algorithm actually assigns.

@draw layers | rows | THE BALANCER'S INPUTS DEFINE ITS CHOICES | [["L4","address","port"],["L7","host","path"],["unit","connection","request"]] | Conceptual routing inputs; deployment decides the actual assignment unit. | one long connection may carry many requests

## Connection ownership

A WebSocket gateway holds connection state that cannot move through a DNS update. Route new connections to a healthy gateway and let existing ones drain or reconnect. A reconnect must recover subscriptions and missing events. Otherwise balanced new admissions still produce lost application continuity.

Heron's 50,000 viewers at an assumed 10,000 connections per gateway need five gateways for nominal capacity. That count leaves no connection headroom after a gateway loss. Capacity planning must include spare owners and reconnect bursts; the assumption is a sizing input, not a benchmark.

@draw ownership | fan | CONNECTIONS LIVE AT PARTICULAR GATEWAYS | {"source":"new viewer","targets":["gateway A","gateway B","gateway C"]} | Illustrative connection assignment; established connections remain owned. | routing cannot teleport a live socket

:::key In one breath
L4 sees transport information and L7 sees application information. Route decisions assign requests or connections depending on the boundary. Persistent sockets have an owner and need draining or reconnecting. Nominal balanced capacity still needs failure headroom.
:::

@part Stateless balancing | We distribute independent work without depending on one destination. Equal request counts do not guarantee equal effort. We will compare round robin, weights, and least connections.

## Round robin and weighted routing

**Round robin** cycles through destinations. **Weighted routing** assigns a larger fraction to destinations with larger configured weights. Both can work for similar independent requests, but equal counts can hide large differences in execution time and bytes. A slow request can occupy one server while others finish several short requests.

Use weights for tested capacity differences or a gradual rollout, then watch errors and useful completions. A new deployment with a small traffic weight can still receive a disproportionately expensive request mix. Rollout exposure is not the same as CPU exposure.

@draw weights | rows | ASSIGNED REQUESTS DO NOT MEASURE EQUAL COST | [["equal weight","short read","large upload"],["observed cost","small","large"]] | Illustrative uneven work per request. | count resource cost as well as assignments

## Least connections and least outstanding work

**Least connections** favors destinations with fewer active connections. It can fit comparable connection workloads, but an idle persistent connection and a busy multiplexed connection count equally. Least outstanding requests or measured load can better match some HTTP workloads, while adding measurement and feedback complexity.

A delayed measurement can route a burst to the apparently emptiest server and make it hot. Use bounded admission at the destination as well as balancing. No algorithm can distribute a shared database bottleneck out of existence.

@draw least | split | CONNECTION COUNT CAN HIDE REQUEST WORK | [["server A","many idle sockets\nfew active requests"],["server B","few multiplexed sockets\nmany active requests"]] | Illustrative misleading connection counts. | choose the unit that matches useful work

:::interview Interview lens
**"Which load-balancing algorithm is best?"** I first identify whether requests, connections, or resource costs are comparable. Then I choose the simplest method that distributes that work and inspect skew. Destination admission remains necessary even with a good balancer.
:::

:::key In one breath
Round robin distributes assignments and weights express intended shares. Least connections measures sockets, not always work. Load-aware feedback can lag and oscillate. Match the assignment unit to the workload and retain admission limits.
:::

@part Affinity and hashing | We deliberately keep some work together. Affinity saves movement but can trap traffic on a bad owner. We will compare consistent hashing and sticky sessions.

## Consistent hashing

A cache key should usually reach the same owner. **Consistent hashing** maps keys and owners into an ordered space, assigning a key to a selected nearby owner under a defined rule. Adding an owner changes selected ranges rather than remapping every modulo bucket. Virtual positions can improve balance but cannot remove hot-key skew.

An ideal uniform addition from four equal owners to five moves an expected 20% of keys. Real placements and finite samples vary. Count moved bytes and refill demand, not merely the key fraction; a few large or hot values can dominate the transition.

@draw hash | ring | A NEW OWNER CHANGES SELECTED RANGES | ["owner A","owner B","owner C","new owner"] | Illustrative ring; no measured movement claim. | balance keys and inspect demand separately

## Sticky sessions

**Sticky sessions** send a user's requests to a preferred backend, often through a cookie or affinity mapping. This can reduce state lookup but couples availability and load to one owner. The mapping may outlive the server, and popular users can create skew.

Heron stores durable session and match state outside ordinary application workers. Gateway connection affinity is still necessary while a socket exists, but reconnecting can choose another owner and restore subscriptions. Distinguish unavoidable connection ownership from avoidable dependence on one application's memory.

@draw sticky | flow | AFFINITY HAS A FAILOVER OBLIGATION | ["session mapping","preferred owner","owner unavailable","restore elsewhere"] | Illustrative affinity failure path. | state must survive the preferred process

:::key In one breath
Consistent hashing limits remapping under a defined placement rule. Sticky sessions preserve a preferred destination. Both can concentrate demand and need a failure path. Keep durable state recoverable outside a replaceable owner.
:::

@part Health and discovery | We stop routing new work to unsuitable destinations. A process can be alive while unable to serve its dependencies. We will separate health checks, readiness, and service discovery.

## Health checks and failover

A **health check** observes whether an endpoint appears suitable. **Liveness** asks whether the process should keep running; **readiness** asks whether it should receive work. A process can answer a ping while its database pool is exhausted. A dependency outage can also make every instance fail a deep check together.

Use checks that match the routing decision, with hysteresis to avoid flapping. **Failover** sends eligible new work to another destination; the replacement still needs capacity and correct state. Retrying every request on every supposedly healthy instance can magnify overload.

@draw health | rows | DIFFERENT CHECKS SUPPORT DIFFERENT ACTIONS | [["liveness","process progresses","keep or restart"],["readiness","can serve work","route or drain"]] | Conceptual health actions. | a deep check can fail the whole fleet together

## Service discovery

**Service discovery** maps a logical service to current endpoints and metadata. Clients or proxies cache that information and choose destinations. A registry update does not instantly update every cache or close existing connections. Discovery needs refresh, expiry, and behavior when the registry is unavailable.

Heron can keep using recently known suitable endpoints for a bounded period while refreshing. That supports some control-plane outages, but stale endpoints require connection failure handling. Distinguish the registry's availability from the data-plane service's ability to process an already-routed request.

@draw discover | flow | MEMBERSHIP CHANGES REACH ROUTERS LATER | ["registry update","cached endpoints","refresh","new route"] | Illustrative discovery propagation. | control and request paths fail differently

:::warn Watch out
If every health check requires the same failed dependency, the balancer may remove every backend. Decide whether degraded service can still answer and which requests it should admit.
:::

:::key In one breath
Health observations support a specific action. Liveness and readiness are different questions. Discovery propagates endpoint membership through caches. Failover requires state suitability and spare capacity, not just another address.
:::

@part Regional failure | We choose what can move when a region disappears. Geographic duplication without ownership rules can create split brain. We will separate read delivery from write takeover.

## Regional reads and writes

Replicated static media can often be served from another region if the bytes and authorization policy are available. An authoritative score writer needs a supported ownership transition and sufficiently current history. Routing all traffic to the second region does not prove that region may commit writes.

Name the regional data-loss exposure, takeover delay, and resource-side authority check. Cacheable stale reads can continue under a declared contract while writes pause. The consistency requirement determines which operations remain available during the transition.

@draw regional | split | MOVING TRAFFIC IS NOT TRANSFERRING AUTHORITY | [["read failover","suitable copy\npermitted freshness"],["write failover","current history\nfenced new owner"]] | Illustrative regional failure contracts. | traffic and ownership change at different boundaries

## Reconnect and cold-start bursts

After regional failover, clients reconnect, authentication checks recur, caches miss, and destination pools warm. The surviving region receives both ordinary demand and recovery work. Reserve capacity and spread reconnects with jitter; prioritize essential operations while warming selected data.

Heron's nominal five gateway count should become a failure budget rather than a final fleet recommendation. Count expected connections per surviving gateway, subscriptions to restore, and retained events to replay. The exact headroom depends on measured capacity and the chosen recovery window.

@draw surge | fan | FAILOVER ADDS RECOVERY WORK TO NORMAL DEMAND | {"source":"region recovers","targets":["connection setup","cache refill","event replay"]} | Illustrative correlated recovery work. | a healthy destination can be overloaded by recovery

:::key In one breath
Regional reads need suitable copies; regional writes need suitable authority. DNS and proxy changes move traffic but do not transfer ownership. Recovery adds reconnection, warming, and replay work. Test capacity during the selected failure.
:::

@part The complete route | We assemble the route and state what each hop contributes. A chain of boxes can add latency without adding a useful guarantee. We will trace a score read and count surviving application capacity.

## One routed score read

The viewer resolves a suitable endpoint, reaches the edge, and either receives an eligible cached response or continues to the proxy. The proxy applies entry policy and routes to a ready application. The application still checks resource permission and reads a suitable state source within its deadline.

DNS answers, discovery records, readiness observations, and cached values have different ages. Trace their versions or times separately. A stale routing record should produce a bounded connection failure, not an unbounded retry chain.

@draw full | flow | EACH HOP CONTRIBUTES ONE DECISION | ["locate","reuse if allowed","admit + route","authorize + read"] | Illustrative score read. | name the decision made by each layer

## Count the failure budget

Assume five application instances sustain 300 score requests per second each. They provide 1,500 normally and 1,200 after losing one, against Heron's 1,000-request peak. This arithmetic does not include database, edge, or gateway limits; test those shared components too.

The routing algorithm distributes admitted work, health removes unsuitable targets, and the application bounds its own queues. Those mechanisms cooperate; none replaces the others. This unit does not size a CDN's media distribution, which has its own later chapter.

@draw capacity | bars | ILLUSTRATIVE APPLICATION CAPACITY AFTER FAILURE | [["peak",1000,"req/s"],["one lost",1200,"req/s"],["normal",1500,"req/s"]] | Capacities are assumed; totals are computed. | balancing cannot repair a shared bottleneck

:::key In one breath
The full route locates, reuses, admits, selects, and authorizes. Cached control information can be stale independently of data. Surviving capacity must exceed the admitted workload under the promised failure. Explain every routing layer by the decision it owns.
:::
'''
qa=[('Reverse proxy or gateway?','The proxy represents backends. A gateway adds entry policy; one deployment can perform both jobs.'),('Why distinguish L4 and L7?','They see different information and may assign different units of work. Encrypted application fields need a plaintext boundary.'),('Why can round robin be uneven?','Equal request counts can have unequal durations and bytes. Inspect useful work and resource cost.'),('Why can least connections mislead?','Idle and multiplexed connections can carry very different work. Socket count is not request concurrency.'),('What does consistent hashing save?','It changes selected ownership ranges instead of remapping every key. Actual moved bytes and hot demand still need measurement.'),('What does stickiness cost?','It ties load and failover to a preferred owner. Durable state must remain recoverable elsewhere.'),('Readiness or liveness?','Readiness controls routing suitability; liveness controls process recovery. They support different actions.'),('Does DNS failover transfer write ownership?','No. A new region still needs sufficiently current state and fenced authority.')]
ex=[('●','Compute nominal gateway count.','50,000/10,000=5 gateways. This has no failure headroom.'),('●','Compute normal and one-failure application capacity.','5 times 300=1,500; 4 times 300=1,200 requests/s.'),('●','Compute ideal expected movement to a fifth equal hash owner.','1/5=20% under the stated uniform model; a finite placement can differ.'),('●●','Design readiness for a degraded score reader.','Admit only operations the instance can still serve within a declared contract. Avoid a shared dependency check that unnecessarily removes all useful backends.'),('●●','Trace a persistent connection during DNS change.','The existing socket stays with its owner. New admissions use the new route; drain or reconnect old connections and recover subscriptions.'),('●●●','Defend regional write failover.','Verify current committed history, establish new authority with the supported protocol, fence old writes, then admit commands. Route changes alone cannot prevent split brain.')]
publish(7,'traffic-routing','Routing useful work',['Routing','Useful Work'],'Entry layers, L4 and L7 balancing, routing algorithms, affinity, health, discovery, geographic placement, and regional takeover.','Explain where a request goes, why that destination is suitable, and how its state survives a failure.',raw,qa,ex,[('Envoy load balancing','https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancing','Algorithm choices and upstream routing.'),('Google SRE overload','https://sre.google/sre-book/handling-overload/','Admission and recovery behavior.'),('DNS concepts','https://www.rfc-editor.org/rfc/rfc1034','Resolvers and cached naming records.')])

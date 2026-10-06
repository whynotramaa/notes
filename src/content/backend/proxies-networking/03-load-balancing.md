@part III | Load balancing | We spread requests across many instances so that none is overwhelmed and a failed one is skipped. The layer the balancer works at decides what it can see, and the algorithm decides how evenly the load lands. We will cover layer 4 and layer 7 balancing, the common algorithms including power of two choices, consistent hashing, and health checks, slow start, draining and sticky sessions. | where:3

## 7. Layer 4 and layer 7

A **load balancer** distributes incoming work across a pool of backends. The first question is what it looks at to decide. A **layer 4** balancer works at the transport layer, TCP or UDP. It sees source and destination IP addresses and ports, and nothing inside the connection. It makes one decision per connection, choosing a backend when the connection opens, and every byte of that connection goes to the same backend. A **layer 7** balancer works at the application layer, HTTP. It terminates the connection, reads each request's method, host, path, headers and cookies, and makes a decision per request.

@fig be_lb_l4_l7 | Layer 4 sees only the envelope. Layer 7 opens it and reads the request.

Each has its strengths. Layer 4 is fast and protocol-agnostic. It can balance databases, Redis, MQTT, gRPC or anything over TCP, it adds very little latency, and it can pass TLS through untouched so the backend terminates it. Cloud network load balancers, Linux IPVS and Google's Maglev, described in 2016, are layer 4. Layer 7 is flexible. It can route `/orders` and `/menus` to different services, split traffic by header for canary deploys, retry a failed request on another backend, add headers, and balance each request of a long-lived HTTP/2 connection independently. Nginx, HAProxy in HTTP mode, Envoy and cloud application load balancers are layer 7.

The difference matters most for long-lived connections. A mobile app holding one HTTP/2 connection for ten minutes sends all its requests to one backend behind a layer 4 balancer, and to many behind a layer 7 one, which Part IV examines. Most production paths use both. A layer 4 balancer spreads connections across a fleet of layer 7 proxies, which then route and balance individual requests to services.

## 8. Choosing a backend

Once a balancer has a pool of healthy backends, an algorithm picks one for each connection or request.

**Round robin** takes backends in turn, the simplest choice, and fine when backends are identical and requests similar. **Weighted round robin** gives some backends more turns, for machines of different sizes or for sending 5% of traffic to a canary. **Least connections** sends each new connection or request to the backend with the fewest in progress, which adapts when some requests are much slower than others. **Least response time** prefers backends that have answered fastest recently, combining speed and load. **Random** choice is surprisingly good with many requests and needs no shared state.

@fig be_lb_algos | Six algorithms. The power of two choices gets close to least-loaded with almost no coordination.

The **power of two choices**, analysed by Michael Mitzenmacher in his 1996 thesis, deserves special mention. Pick two backends at random and send the request to the less loaded of the two. The improvement over picking one at random is dramatic. With n backends, a single random choice leaves the busiest backend with load growing roughly as ln n ÷ ln ln n above average, while two choices reduce it to about ln ln n ÷ ln 2, an exponential improvement, for the cost of looking at one extra number.

@fig be_lb_p2c | Two random backends sampled, the lighter one chosen.

It also behaves well when there are many balancers. If ten independent Nginx instances each use least connections, they all see the same lightly loaded backend at the same moment and all send to it, a herd that makes it the most loaded. With power of two choices, their random samples differ, and the herd never forms. Envoy's default `LEAST_REQUEST` policy and HAProxy's `random(2)` implement it, and Wren uses it for requests to its services.

## 9. Consistent hashing

Sometimes requests for the same key should go to the same backend. A cache sharded across nodes wants each key on one node, so it is cached once. A WebSocket server may want each chat room on one node. The obvious method, `hash(key) mod n`, works until n changes. Going from 4 nodes to 5 changes the result for most keys. Only keys whose hash gives the same remainder modulo 4 and 5 stay, 4 out of every 20, so 80% of keys move, and a cache cluster loses most of its hits at once.

**Consistent hashing**, from David Karger and colleagues in 1997, places both nodes and keys on a ring, the space of hash values bent into a circle. Each key belongs to the first node clockwise from it. Adding a node E takes over only the arc between E and the node before it, so only the keys in that arc move, all of them from one neighbour. With 4 nodes becoming 5, about 1/5 of keys move instead of 4/5. Removing a node hands its arc to the next node clockwise.

@fig be_lb_consistent | E joins the ring and takes one arc. Only keys in that arc move.

A ring with a few nodes divides unevenly, since random positions leave some arcs much longer than others. **Virtual nodes** fix this. Each physical node is placed at 100 to 200 points on the ring, so its share is the sum of many small arcs and comes out close to equal. Virtual nodes also let a bigger machine take more points and more load. Amazon's Dynamo paper in 2007 popularized the design, and Cassandra, Riak and many caches use it.

Variants trade different properties. **Rendezvous hashing**, or highest random weight, computes a score for each node per key and picks the highest, with similar movement and no ring. **Jump consistent hash**, from Google in 2014, needs no memory but only supports adding and removing nodes at the end. **Maglev hashing** builds a lookup table that spreads load very evenly with minimal disruption, for Google's layer 4 balancers. Envoy offers ring hash and Maglev as load-balancing policies for sticky routing by header or cookie.

## 10. Health checks, slow start, draining and stickiness

A balancer must know which backends can take traffic. **Active health checks** probe each backend regularly. Wren's balancer sends `GET /healthz` every 5 s, removes a backend after 2 consecutive failures, and returns it after 3 consecutive successes, so a single blip neither removes nor restores it. **Passive health checks**, called outlier detection in Envoy, watch real traffic, and eject a backend that returns 5 consecutive 5xx responses or connection resets, for 30 s at first and longer each time it repeats. Passive checks react within seconds of real failures. Active checks find backends that are broken before any user hits them.

The health endpoint should check what makes the instance useful, that it can serve requests, and not every dependency, Unit XV. A health check that fails whenever the database is slow removes every instance at once, turning a slow database into a total outage.

@fig be_lb_health | Probes every 5 s, ejection on repeated errors, and a 30 s ramp for a returning backend.

A backend that has just started, or just returned, may be cold, with empty caches, unloaded code and an unwarmed connection pool. **Slow start** ramps its share of traffic over a period, 30 s for Wren, instead of giving it its full share at once.

Removing a backend for a deploy needs **connection draining**. The instance stops receiving new connections or requests, while those in progress finish, up to a limit such as 20 s, and only then is it stopped. In Kubernetes, that means handling SIGTERM by failing readiness, waiting for the balancer to notice, finishing in-flight work, and closing idle keep-alive connections before exiting, Unit XV.

@fig be_lb_drain | Removed from the pool, in-flight requests finish, then the process exits.

**Sticky sessions**, or session affinity, send a user's requests to the same backend, by a cookie the balancer sets or by hashing the client address. They help when a backend keeps per-user state in memory or a warm per-user cache. They also make that state fragile, since when the backend dies or is drained, its users lose the state, and they unbalance load when some users are much busier than others. Wren keeps sessions in Redis, Unit III, so it needs no stickiness for correctness, and uses it only for WebSocket servers, Unit XII.

@fig be_lb_sticky | A cookie pins the user to backend 2, and to its failure too.

:::story Picture this
Supermarket checkouts. A manager waving each shopper to the next till in turn is round robin. Shoppers choosing the shortest queue is least connections, and they all pick the same one when it opens. Glancing at two random tills and joining the shorter is the power of two choices, and the queues stay remarkably even.
:::

:::note Global load balancing
Above all of this sits balancing between regions, usually by DNS or anycast, Unit I. It sends users to the nearest healthy region and moves them away from a failing one. It works in minutes, because of DNS caching, rather than seconds, which is why each region must also survive the failure of individual zones on its own.
:::

:::warn Watch out
Health checks that are too sensitive, failing on one slow response or checking downstream dependencies, can remove every backend together and cause the outage they were meant to prevent. Require several consecutive failures, check only the instance itself, and have balancers fail open, keep sending to all backends, if every one is marked unhealthy.
:::

:::interview Interview lens
**"Compare L4 and L7 load balancing and name the algorithms you would use."** L4 balances TCP or UDP connections by addresses and ports, is fast and protocol-agnostic, and makes one choice per connection. L7 terminates HTTP and chooses per request by host, path, headers or cookies, enabling routing, canaries, retries and even balancing of long-lived HTTP/2 connections. I would use power of two choices with least requests for general traffic, weighted round robin for canaries, and consistent hashing with virtual nodes for cache affinity, with active and passive health checks, slow start and connection draining.
:::

:::key In one breath
Layer 4 balancers choose once per TCP connection from addresses and ports, and layer 7 balancers terminate HTTP and choose per request from host, path, headers and cookies, and production paths usually stack both. Round robin, weighted, least connections, least response time and random all have uses, and the power of two choices gets near least-loaded with no shared state and no herding. Consistent hashing moves only 1/5 of keys when 4 nodes become 5, against 80% for hash mod n, with virtual nodes for balance. Active and passive health checks, slow start and draining keep backends joining and leaving smoothly, and sticky sessions trade fragility for locality.
:::

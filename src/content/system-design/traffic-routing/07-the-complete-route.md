@part VII | DNS, CDN and geographic routing | A nearby destination is not always the destination allowed to serve a request. Cached media and authoritative score updates need different geographic decisions. We will follow the public route, measure cache and DNS behavior, and separate regional traffic movement from state ownership. | where:7

## 26. User, DNS, edge, balancer and application

A Heron viewer in another region opens a match page. The request passes several decisions before an application reads the score. Drawing one arrow from user to database hides why those layers exist and where a failure can occur.

**DNS** resolves the public name to an address or another name according to the resolver and authority chain. A **CDN**, or content delivery network, can serve allowed cached content from distributed edge locations. The edge or regional entry forwards misses and uncacheable requests to a load balancer, which chooses an eligible application endpoint. The application validates permission and obtains the required state.

Heron's illustrative serial route allocates 40 milliseconds to DNS, 20 to transport setup, 30 to TLS, 10 to edge and routing, 60 to application work and 40 to response transfer. Their sum is $40+20+30+10+60+40=200$ milliseconds. Read this as a constructed non-overlapping trace, not a prediction for every request. Warm caches and reused connections can remove setup work; overlapping stages cannot be added as if all were serial.

@fig sd_tr_geo_path | Illustrative public request route. Orange marks endpoint selection; DNS names an entry address, the edge reuses allowed content and the application owns the result.

A DNS answer does not describe a single application process. The address may lead to an edge, regional proxy or transport balancer. A cache hit may end the request at the edge, while a miss travels farther. Distinguish address resolution, content availability and application authority rather than calling every decision "load balancing."

The figure is the route promised by the syllabus, placed after the mechanisms that let us interpret it. A reader can now explain why each stage may be necessary and when it can be omitted. The next sections examine the two geographic mistakes that recur in interviews, treating TTL as instant migration and treating proximity as permission to write.

:::story Picture this
A visitor looks up a library branch, asks the front desk for a book and receives a local copy if one is available. Otherwise the desk requests it from the holding branch. The address directory finds a building, the desk reuses permitted copies, and the lending record still belongs to the library's record keeper. A closer branch cannot invent a loan history it never received.
:::

## 27. DNS TTL and geographic steering

Heron changes the public record away from a failed region, yet some clients continue reaching the old address. Their resolvers have cached an earlier answer. A **time to live**, or TTL, limits how long a cached DNS record remains reusable under the caching protocol; it is not an instruction that closes existing connections.

Suppose the illustrative record is cached at time 0 with TTL 60 seconds and the authoritative record changes at time 10. Its remaining cache lifetime is $60-10=50$ seconds. Read this as expiration time minus update time for this particular cached answer. A client that receives the record at another moment has a different remaining interval, and an existing live socket can outlast the record entirely.

@fig sd_tr_dns | Illustrative public-record update at 10 seconds leaves a previously cached answer reusable until 60. Orange marks expiry, after which a resolver can obtain the new route.

**Geographic routing** selects an entry based on a location policy, measured network path or deployment region. Resolver location may differ from viewer location, and physical distance does not uniquely determine latency. The policy must consider availability, capacity and the data needed to serve rather than using a map distance alone.

A shorter TTL can shorten one cache interval but increases resolution work and does not eliminate application caching or socket lifetime. A failed old address can still receive connection attempts until consumers converge. Use redundant entry points, bounded attempts and a documented migration policy rather than assuming all traffic moves at the instant of an update.

DNS also cannot establish safe write authority. Steering to another region must wait for the relevant ownership transfer or reject writes temporarily. The record is a directory entry, not a transaction record. Section 29 returns to the old region that may still be alive after its public address is withdrawn.

:::note DNS answers and active connections
DNS caching controls future resolution decisions. It does not move an established TCP or WebSocket connection. Regional failover must account for both new connection selection and existing-client reconnect behavior.
:::

## 28. Edge cache hits, misses and cold failover

Heron's media edge serves nine of ten modeled requests locally. The origin therefore sees less traffic than the viewer-facing layer. Moving traffic to a cold edge can remove that protection immediately.

A **cache hit** returns a reusable stored response. A **cache miss** forwards to the origin and may populate a response for later reuse. Eligibility depends on response freshness, cache key and authorization rules. Personalized score data cannot become public merely because a common URL is convenient to cache.

Under an illustrative 90-percent hit ratio and 1,000 requests per second, origin demand is $1000\times(1-0.9)=100$ per second. If the replacement edge has no useful cached copies, origin demand becomes 1,000 per second, a $1000/100=10$ multiplier. Read this as total viewer rate times the miss fraction, followed by a ratio between cold and warm origin rates.

@fig sd_tr_cache | Illustrative warm and cold edge routes. Orange marks the cold origin demand of 1,000 per second, ten times the warm miss traffic.

Cache refill is not the only added load. Simultaneous misses for the same object can start duplicate origin work; request coalescing can reduce that while bounding waiters. The origin still needs a policy for when the edge cannot contact it. Serving permitted stale media may be acceptable, while stale ticket ownership or private data may violate the application contract.

Separate route health from content freshness. An edge can return quick responses whose score version is obsolete. Health probes that only check status code will miss that failure. Use the observation tied to the promise, such as a controlled score version or allowed maximum data age.

The CDN unit explains cache keys, invalidation and media delivery in detail. Here the routing lesson is that a new healthy location can increase origin work even when viewer demand stays fixed. Regional capacity planning must include cold caches and concurrent retry load instead of sizing only the steady miss fraction.

:::warn Watch out
A warm cache's origin rate is not the peak rate after cold failover. Heron's declared hit ratio hides a tenfold difference. Plan the cold path or reduce admission while useful cached data is rebuilt.
:::

## 29. Regional failover and write authority

The primary region stops responding, but nobody knows whether it lost power or only its connection to the routers. Sending score writes to a replica immediately can leave both regions accepting changes to the same match.

**Write authority** is the rule identifying which owner may commit a business change. Read traffic can often move to a suitable replica with an allowed freshness contract. Write traffic requires current history, a valid new owner and exclusion of stale writers. Reachability and authority are separate properties.

Heron's illustrative replica lags the score stream by 2 seconds at 20 events per second, or $2\times20=40$ events. Read this as the event rate multiplied by the modeled replication lag. It states potentially missing history under that fixed-rate example, not exactly which business effects were lost. Promoting a replica without reconciling its position can abandon acknowledged updates.

@fig sd_tr_region | Moving traffic between regions does not transfer write authority. Read freshness and the new writer's history and fencing checks remain separate decisions.

A safe transfer uses a coordination or storage contract that establishes the new generation and rejects old ones. A public DNS update cannot fence a process still serving through a stale cache or private route. The database and distributed-systems units explain the replication and consensus mechanisms; the router must wait for their output rather than inventing authority itself.

Even read failover needs semantics. A user who just changed a score may require read-your-writes and should not be silently routed to a lagging region. The service can retain an acknowledged version and wait for a replica, route to an owner that has it, or return a clear temporary failure. A geographic route is correct only when it serves the operation's state requirement.

:::interview Interview lens
**"Why is moving DNS not enough for regional failover?"** Cached answers and existing connections delay traffic movement. More importantly, a reachable replica may lack acknowledged history and the old writer may still be alive. I establish state readiness and fenced authority first, then move eligible traffic within the destination's capacity.
:::

## 30. Recovery surges and failure budgets

A failed gateway returns and thousands of viewers reconnect. The application request rate has not increased, but handshakes, session lookups and replay add work. A **recovery surge** is the extra workload needed to restore service state after failure.

Heron's illustrative reconnection cohort needs 1,000,000 replay deliveries over 20 seconds, carrying 10,000,000 payload bytes per second. Normal live delivery carries 200,000,000, so modeled combined output is $200000000+10000000=210{,}000{,}000$ bytes per second. Read this as adding independent steady live and spread replay payload rates, excluding handshakes and framing.

@fig sd_tr_recovery | Illustrative payload demand during gateway recovery. Orange marks the combined live-plus-replay rate; handshake and lookup resources need separate limits.

Bound reconnect concurrency, spread attempts with jitter and prioritize live or recovery work according to the product promise. Delaying some replay may keep current scores flowing, but users must not receive duplicate or reversed updates when the paths meet. Sequence cursors and a snapshot boundary establish how replay rejoins live delivery.

An illustrative failover timeline can budget 15 seconds for declared failure evidence, 10 for route convergence and 5 for reconnect, totaling $15+10+5=30$ seconds. These are assigned stage allowances, distinct from Section 19's probe-derived 11-to-16-second bound. The timeline is a plan to measure, not proof that every viewer recovers within 30 seconds.

For an availability target of 99.9 percent over a declared 30-day window, allowed unavailability is $30\times86400\times(1-0.999)=2592$ seconds. Read this as window duration multiplied by the permitted unavailable fraction. Whether one routing outage consumes that budget depends on the chosen SLI population and success rule. A count of healthy machines alone cannot establish user availability.

:::key In one breath
DNS selects an entry address, the edge reuses permitted content, the balancer selects an endpoint and the application owns authorized results. TTL and connection lifetimes delay geographic convergence. Cold caches and reconnect replay add work beyond the normal path. Regional write failover requires current history and fenced authority before routing can safely admit commands.
:::

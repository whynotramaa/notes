@part IX | Failure scenarios | We practise the questions interviews ask about what happens when one part of the system breaks. Each scenario is a chance to show that you know how failures spread, how they are detected and how they are contained. We will cover a six-question method, failures of the cache and the database, queues and consumers that fall behind, and failures of dependencies, DNS, certificates and traffic spikes. | where:9

## 30. Six questions for every failure

Backend interviews increasingly ask "Redis goes down, what happens?" rather than "what is Redis?". A good answer is not a guess at the outcome. It walks through a fixed set of questions, which also happens to be how a real incident review is structured. Wren's on-call guide asks six.

**What breaks?** Name the first thing that stops working and for whom. **How does it propagate?** Follow the failure through callers, retries, pools and queues, because the first failure is rarely the one users feel. **How do we detect it?** Name the metric, alert or log that would fire, and how quickly. **How do we contain it?** Name what stops it from spreading, timeouts, circuit breakers, bulkheads, load shedding, fallbacks. **How do we recover?** Name the steps back to normal, including side effects such as cold caches and backlogs. **How do we prevent recurrence?** Name the change that makes this failure smaller or impossible next time.

@fig be_obs_six_q | Six questions turn "what happens if X fails?" into a structured answer and a review template.

The questions work because most failures follow a small number of propagation patterns that earlier units described. A slow dependency holds resources longer, by Little's law, until callers run out of threads or connections, Unit X. Retries multiply load on whatever is already struggling. A shared resource, a pool or a queue, lets one tenant or endpoint starve the rest. Recovery causes a second wave, as clients reconnect together, caches refill together and backlogs drain together. Naming the pattern is usually most of the answer.

The detection question deserves a specific answer. "We'd see it in monitoring" is weak. "The burn-rate alert on the order journey fires within a minute because error rate jumps from 0.05% to 30%, and the Redis dashboard shows connection errors on every instance" shows that the candidate knows what the telemetry from Parts I to VI would actually show.

Containment and prevention are where design shows. Every scenario in this part has the same shape of good answer. The failure is detected by a symptom alert, contained by a timeout and a fallback so that most users are unaffected, recovered with attention to the second wave, and followed by a change that reduces the blast radius. The next sections apply the method to the scenarios most often asked.

## 31. The cache and the database fail

**Redis goes down.** What breaks first depends on how Wren calls it. With a 50 ms timeout and a circuit breaker, Unit X, every cache read fails fast, and the code falls through to the database. With the default client timeout of several seconds, every request first waits for Redis, so at 2,000 requests a second with a 1-second wait, Little's law puts 2,000 requests in flight instead of 100, and the service runs out of workers before the database is even involved. That is why the timeout matters more than the cache.

With fast failure, the load moves to the database. At a 90% hit ratio, peak traffic produces 200 misses a second, 400 queries. With no cache it produces 2,000 misses, 4,000 queries a second, ten times the normal load. Those queries take 4 ms each when the database is healthy, so 4,000 × 0.004 = 16 connections busy of 40, which fits, but the database's CPU and I/O may not. Containment uses request coalescing so that concurrent misses for the same key make one query, Unit VII, rate limits on expensive endpoints, and serving stale data from a small in-process cache. Detection is Redis connection errors and the cache hit ratio dropping to zero. Recovery needs care, since a restarted Redis is empty and the cold-cache load lasts until it warms.

@fig be_obs_redis_down | With a 50 ms timeout, misses go to the database at 10× load. With a slow timeout, requests pile up before the database is touched.

**The PostgreSQL primary dies.** Writes fail until a replica is promoted, typically 10 to 30 seconds with Patroni or a managed service, Unit VI. Reads from replicas continue. Connections to the old primary break, and the pool must discard them and reconnect to the new primary through a DNS name or proxy that has moved. Containment is to fail writes quickly with a retryable error, idempotency keys so the client can retry safely, Unit V, and keeping read paths alive. Detection is write errors and the failover event itself. Prevention reviews whether failover time and any lost transactions, if replication was asynchronous, fit the SLO.

**Database latency rises from 10 ms to 2 seconds.** This is often worse than the database failing outright, because slow is harder to detect and holds resources. At 400 queries a second, 2-second queries need 400 × 2 = 800 connections, and Wren has 40. The pools fill, requests wait for connections, and every endpoint that touches the database becomes slow, Unit VI's incident. Containment is a statement timeout so no query runs forever, a short pool acquisition timeout that fails fast with a 503, and shedding non-critical load. The cause is found in `pg_stat_statements`, lock waits in `pg_locks`, or saturation on the database host.

**The connection pool is exhausted.** The symptoms are rising pool wait time and requests timing out while the database itself looks idle. The usual causes are slow queries, leaked connections that a code path never returns, or a transaction held open across a network call. Pool metrics, in use, idle, waiting and wait time, find it, and a leak detector that logs the stack trace of any connection held longer than a few seconds finds the code.

## 32. Queues and consumers fall behind

**A Kafka consumer is six hours behind.** The consumer group for `order-events` normally keeps up with 50 events a second at peak. Six hours of lag at that rate is 6 × 3,600 × 50 = 1,080,000 events waiting. What breaks depends on what the consumer does. If it sends confirmation emails, customers get them hours late. If it updates the search index, Unit XII, search shows stale menus. If it feeds billing, nothing is visible yet, but the data is wrong until it catches up.

The first question is whether the consumer is slow or stopped. A stopped consumer, crashed, stuck on a poison message, or rebalancing in a loop, shows lag growing at exactly the produce rate. A slow one shows lag growing more slowly. Detection should never be "six hours later". Wren alerts when lag measured in time, the age of the oldest unprocessed event, exceeds five minutes, which catches a stopped consumer within minutes, Unit VIII.

@fig be_obs_lag | Lag grows at the produce rate while the consumer is stuck, then drains at the difference between consume and produce rates.

Recovery is arithmetic. If the fixed consumer processes 150 events a second while 50 a second keep arriving, the backlog drains at 100 a second, and 1,080,000 events take 10,800 seconds, three hours. Scaling up helps only to the partition count, since the topic has 12 partitions and at most 12 consumers in a group can work in parallel. Draining that fast pushes extra load onto whatever the consumer writes to, so the catch-up rate may need a limit. And retention must exceed the worst lag. With seven days of retention, six hours is safe, but a consumer stuck over a long weekend with one-day retention loses events for good.

**A queue fills faster than workers consume.** If photo-processing jobs arrive at 60 a second and workers finish 50 a second, the queue grows by 10 a second, 36,000 an hour, without limit. It is the same failure in a different system. Containment is autoscaling workers on queue depth or age, Unit VIII, a maximum queue length with backpressure that rejects or delays new work at the producer, Unit IX, and priorities so that urgent jobs, such as password reset emails, do not wait behind bulk ones. Every queue needs an owner, a depth and age alert, and a plan for what to drop if it cannot catch up.

The general lesson is that asynchronous systems fail quietly. The API returns 202 and looks perfectly healthy while the work behind it piles up. Lag and age alerts are the only symptoms.

## 33. Dependencies, DNS, certificates and spikes

**One downstream service starts returning 503.** The payments service's provider returns 503 for a third of calls. Without protection, Wren's retries, three per call, multiply the load on a provider that is already failing, Unit X. Containment is a retry budget limiting retries to 10% of calls, a circuit breaker that opens when the failure rate passes a threshold and fails fast for 30 seconds before testing again, and a fallback such as queueing the payment for later or offering another provider. Detection is the client-side RED metrics for that dependency, which show the problem before Wren's own error rate does.

**DNS fails.** If Wren's resolvers cannot reach the authoritative servers, cached answers keep working until their TTLs expire, 300 seconds for Wren's records, Unit I. After that, any connection to a new host name fails. Services with long-lived pooled connections keep working, while anything that resolves per request fails at once. Containment is resolvers configured to **serve stale** answers past their TTL when upstream is unreachable, defined in RFC 8767, and connection pools that do not re-resolve unnecessarily. The October 2016 attack on the DNS provider Dyn took down many large sites that depended on it alone, which is the argument for a second DNS provider for critical zones.

@fig be_obs_cert_expiry | A certificate lifetime of 90 days, renewal at day 60, and alerts at 21 and 7 days left.

**A TLS certificate expires.** Every client that validates the certificate refuses to connect, so the failure is total and instant at the expiry second, Unit I. It is also entirely preventable. Wren's certificates last 90 days and are renewed automatically by ACME at day 60, leaving 30 days for renewal problems to be noticed. A ticket fires when any certificate has under 21 days left and a page under 7, checked by an external probe of the live endpoint rather than by reading the file, because a renewed certificate that a server never reloaded still serves the old one. Internal certificates, for mTLS between services and for databases, need the same monitoring and are where expiries usually hide.

**One endpoint suddenly gets 100 times its traffic.** A marketing push sends `GET /promotions` from 20 requests a second to 2,000. If the endpoint is cacheable, the CDN and Redis absorb most of it, Unit VII. If not, it competes with every other endpoint for the same instances, pool and database. Containment is per-endpoint rate limits and concurrency limits, Unit X, bulkheads that give critical endpoints such as checkout their own capacity, autoscaling with a minimum warm buffer, and load shedding that drops the least important traffic first. The test is whether checkout stays healthy while promotions struggles.

:::story Picture this
A fire drill run as a series of questions. Where does the fire start, which way will the smoke go, who smells it first, which doors close to hold it, how does everyone get back in, and what do we fix so it cannot start there again. The same six questions work for a kitchen fire and a server room, and the drill is in knowing to ask them in order.
:::

:::note Game days
Wren rehearses these scenarios on purpose in staging and, carefully, in production, by killing a Redis node, adding latency to the database or blocking a dependency, and checks that alerts fire and fallbacks work. This is chaos engineering, Unit V, and it finds the gaps in the six answers before a real incident does.
:::

:::warn Watch out
"Slow" failures, a database at 2 s instead of 10 ms, a dependency that times out rather than refuses, are more dangerous than clean outages, because they hold resources and often avoid simple health checks. Every outbound call needs a timeout shorter than its caller's, and every pool needs an acquisition timeout.
:::

:::interview Interview lens
**"Redis goes down. What happens?"** Walk the six questions. If calls have short timeouts and a circuit breaker, reads fall through to the database at ten times the normal query load; if they have long timeouts, requests pile up before the database is touched and the service exhausts its workers. Detection is the hit ratio dropping and Redis errors, plus latency SLO burn. Contain with fast failure, request coalescing, local stale caches and rate limits on expensive endpoints. Recover with attention to the cold cache. Prevent with replicas and failover for Redis and load tests with the cache disabled.
:::

:::key In one breath
For every failure ask what breaks, how it spreads, how it is detected, how it is contained, how it recovers and how to prevent it. Redis down sends 10× queries to the database if timeouts are short, and stalls the service if they are long. A database slowing from 10 ms to 2 s needs 800 connections for 400 queries a second, so statement and pool timeouts must fail fast. Six hours of lag at 50 events a second is 1,080,000 events, draining in three hours at a net 100 a second, and only time-based lag alerts catch it early. Failing dependencies need retry budgets and breakers, DNS needs serve-stale, certificates need renewal at day 60 with expiry alerts, and spikes need per-endpoint limits and bulkheads.
:::

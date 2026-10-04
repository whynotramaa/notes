@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

### Part I: Reverse proxies and API gateways

**Q1. What does a reverse proxy do?**

A reverse proxy accepts traffic at a public address and chooses an internal destination. The client sees the proxy, while the proxy can hide backend names, reuse connections, apply timeouts, and record the route. It does not become the owner of application data merely because it forwards the request.

**Q2. How is an API gateway different from a reverse proxy?**

A reverse proxy mainly handles transport and forwarding. A gateway adds entry policy such as authentication checks, rate limits, request normalization, and routing by method or path. One deployment can do both jobs, but the responsibilities should remain explicit.

**Q3. Where should TLS terminate?**

Terminate TLS at a boundary that can inspect the request and enforce the required policy. If the proxy forwards the client identity, it must remove untrusted incoming forwarding headers and add a trusted value after authentication. Encrypting the next hop as well protects traffic inside the service network.

**Q4. Why are retries dangerous at a gateway?**

A retry can turn one client operation into several backend attempts. That is tolerable for a read with a bounded deadline, but a write needs an operation identity or another idempotency mechanism. The gateway must also leave enough time for the final response instead of spending the whole deadline retrying.

**Q5. What should you measure at the proxy?**

Measure route choice, queue time, upstream connection time, upstream response time, status, retries, and bytes. Separate client-visible latency from time spent waiting for an upstream socket. Those fields let you tell a bad route from a slow application and a full connection pool.

### Part II: L4 and L7 load balancing

**Q6. What can an L4 balancer see?**

An L4 balancer sees transport information such as addresses, ports, and connection state. It can choose a destination when a connection begins, but it does not normally choose each HTTP request inside that connection. This makes it simple and fast, but it cannot route by a URL or application header.

**Q7. What does an L7 balancer add?**

An L7 balancer understands an application protocol after it reaches a plaintext or otherwise inspectable boundary. It can route `/score` and `/upload` to different pools, apply request policy, and balance individual requests on a multiplexed connection. The cost is more protocol work and a place where TLS must be handled.

**Q8. Why does HTTP/2 change the unit of balancing?**

One HTTP/2 connection can carry many concurrent streams. An L4 choice pins the connection, so ten sockets do not necessarily mean ten units of work. An L7 balancer can observe streams and assign requests separately, while still accounting for the cost of long-lived connections.

**Q9. How do you drain a WebSocket or another long-lived connection?**

Mark the endpoint unready for new connections, keep existing connections until a bounded drain policy applies, and make clients reconnect with a cursor or session identity. A DNS change cannot move an established socket. The server must also preserve enough state to resume without duplicating or skipping application events.

**Q10. When would you choose L4 over L7?**

Choose L4 when the protocol can remain opaque, connection-level routing is sufficient, and the lower processing cost matters. Choose L7 when request-level routing, authentication, or per-request observability matters. The decision follows the information needed by the policy, not a claim that one layer is always faster.

### Part III: Load balancing algorithms

**Q11. Why can round robin be unfair?**

Round robin gives the next request to the next endpoint, so it equalizes request counts under a stable stream. It does not equalize duration, bytes, memory, or downstream calls. With endpoint costs of 20, 200, and 20 milliseconds, equal assignment can leave one endpoint doing most of the work.

**Q12. How does weighted routing work?**

The router gives each endpoint a share proportional to its weight. Weights of 1, 2, and 1 have a total of 4, so the shares are 1/4, 2/4, and 1/4. The weights describe intended traffic, not proof that each destination has enough capacity.

**Q13. How would you run a canary?**

Give the candidate a small explicit share, observe errors and latency, and increase it only when its contract holds. At a peak of 1,000 requests per second, a 5 percent canary receives 50 and the established version receives 950. Keep rollback independent of the candidate so a bad result does not prevent returning traffic to the known version.

**Q14. Why can least connections make a bad choice?**

Connections are only a proxy for work. An endpoint with 10 idle sockets can be less busy than one with 100 sockets carrying short requests, while a multiplexed socket can carry hundreds of active streams. Use least outstanding requests or a measured load signal when the workload makes socket count misleading.

**Q15. What are power of two choices and slow start solving?**

Power of two choices samples two endpoints and chooses the one with the smaller observed load, which avoids a full scan. Slow start protects a newly healthy endpoint by increasing its share over time. Neither one replaces readiness checks or capacity measurement, because a sampled endpoint can still be unhealthy or overloaded.

### Part IV: Consistent hashing and sticky sessions

**Q16. What problem does consistent hashing solve?**

It keeps most keys with their current owner when the membership changes. A new owner claims an interval on a ring instead of causing every key to use a new modulo divisor. The moved fraction still depends on placement, key distribution, and the cost of rebuilding state.

**Q17. Why does modulo hashing move so many keys?**

Modulo hashing computes a key's owner from the member count. Changing the divisor changes the result for most keys, even when only one owner was added. In the guide's sample, 8 of 12 keys change when the divisor changes from 4 to 5.

**Q18. What do virtual nodes and weights change?**

Virtual nodes give each physical endpoint several positions on the ring, which reduces large ownership gaps. More positions can also represent different capacities. They reduce placement imbalance, but they do not make a hot key cheap or make a failed owner's state instantly available.

**Q19. What is the cost of sticky sessions?**

Stickiness improves locality by preferring the previous endpoint. It also concentrates traffic, complicates draining, and makes a failure path necessary. The session must be reconstructible or stored durably elsewhere, because a cookie that names a dead endpoint is not state recovery.

**Q20. How should a router handle a preferred endpoint that fails?**

Check eligibility before honoring the preference. If the endpoint is unavailable, route to a healthy fallback and carry the session identity so the application can recover state. On reconnect, the client should resume from a known cursor or repeat an idempotent operation rather than assuming the old socket survived.

### Part V: Health checks and failover

**Q21. What is the difference between liveness and readiness?**

Liveness asks whether a process should be restarted. Readiness asks whether the process can accept the class of traffic assigned to it. A process may be alive while its database dependency is unavailable, so using one answer for both decisions can create restart loops or route requests into failure.

**Q22. How do active and passive health checks work together?**

Active probes test a declared endpoint contract on a schedule. Passive checks use failures from real requests and can catch a path that the probe never exercises. Combine them with hysteresis so one transient failure does not remove a healthy endpoint and repeated evidence does not leave a broken endpoint in rotation.

**Q23. How long does a health failure take to remove an endpoint?**

The interval, threshold, and probe timeout determine the bound. With a 5 second interval, 3 failed probes, and a 1 second timeout, the guide records a detection range from 11 to 16 seconds depending on the phase of the failure. Removing the endpoint stops new assignment; it does not undo a request already sent.

**Q24. What is survivor capacity?**

Survivor capacity is the work the remaining endpoints can serve after a failure. Five application endpoints at 300 requests per second provide 1,500 normally and 1,200 after one loss. If the peak is 1,000, the remaining margin is 200 requests per second, but a second loss reduces capacity to 900.

**Q25. How do you fail over without creating split brain?**

First establish which replica has an acceptable history, then transfer or confirm write authority through a fencing protocol. Only after old writers are prevented from committing should the router admit new writes. A route change can direct packets, but it cannot prove which copy owns the next write.

### Part VI: Service discovery

**Q26. What does a service registry provide?**

A registry publishes the current members of a service and enough metadata for a router to select among them. Routers usually cache that information because consulting the registry on every request adds a dependency to the request path. The cache makes the path cheaper but creates a bounded stale-membership interval.

**Q27. Compare client-side and proxy-side discovery.**

With client-side discovery, each client watches the registry and implements selection, health handling, and retries. With proxy-side discovery, a shared proxy owns those decisions and clients use a simpler protocol. The proxy model centralizes policy, while the client model can reduce a hop and spread selection work.

**Q28. What happens when discovery state is stale?**

A router can keep sending traffic to an endpoint after the registry removes it. At a cache lifetime of 30 seconds, a list fetched at time 0 can still be valid when the registry changes at time 10. The router consumes the refreshed list at time 31 in the example, so the observed lag from the update is 21 seconds.

**Q29. Why use leases and generations for endpoint removal?**

A registration lease makes membership expire unless the endpoint renews it. Exclusive write ownership requires a separate generation check at authoritative storage, which rejects operations carrying an older fencing token. Registry expiry changes discovery; storage fencing prevents a delayed or isolated former owner from committing.

**Q30. What is the failure mode of making discovery strongly synchronous?**

Every request path can become dependent on registry availability and latency. That reduces stale membership but makes an unrelated registry outage look like an application outage. A cached list with an explicit expiry, endpoint fencing, and bounded refresh behavior usually gives a clearer failure boundary.

### Part VII: DNS, CDN and geographic routing

**Q31. Walk through the geographic layers of a request.**

The user asks DNS for an entry address. The selected edge can serve a cached object or forward a miss to a load balancer, which chooses an application server. Each layer contributes a different decision: naming, proximity and cache reuse, connection routing, or application authority.

**Q32. What does a DNS TTL guarantee?**

It tells a resolver how long it may reuse an answer under the DNS rules. It does not force every client, connection, or intermediary to move at expiry. With a 60 second TTL and a record update at 10 seconds, a resolver that cached at time 0 can retain the old answer until time 60, leaving 50 seconds after the update.

**Q33. Why is a CDN cache hit different from a regional application failover?**

A cache hit can serve an object without asking the origin, so it reduces origin request rate. It does not establish write authority or guarantee fresh application state. A warm origin path in the example sees 100 requests per second, while a cold path can see 1,000, a tenfold increase.

**Q34. What must a regional write failover check?**

It must check replica freshness, establish a single writer, fence the old region, and make retry identity safe. A healthy route to a stale replica can return old data or accept conflicting writes. Read traffic can often fail over earlier than write traffic because the write contract is stricter.

**Q35. What does a recovery budget include?**

It includes the live request rate plus reconnect, replay, handshake, and discovery work. In the example, live traffic contributes 200,000,000 bytes per second and replay contributes 10,000,000 bytes per second, for 210,000,000 bytes per second at the gateway replay boundary. Recovery needs its own admission limit so it does not consume all capacity required for live requests.

### Part VIII: The complete routed request

**Q36. How would you trace one score read?**

Start with the browser and record each decision, queue, connection, and application step. The example's serial contributions are 40, 20, 30, 10, 60, and 40 milliseconds, which sum to 200 milliseconds. Compare that total with the 250 millisecond deadline and identify the 50 milliseconds of slack rather than calling the route healthy from a status code alone.

**Q37. Why can a successful retry still duplicate a write?**

The first attempt may commit and lose its response before the client receives it. The retry reaches another server, which must recognize the same operation identity and return the committed result. Routing chooses a server, but deduplication and durable state decide whether the repeated command has one effect or two.

**Q38. How do you reconcile application and gateway capacity?**

Keep separate budgets for requests, connections, bytes, and recovery work. Five application endpoints at 300 requests per second have 1,500 normal capacity and 1,200 after one loss, while five gateways at 10,000 connections each have no one-loss headroom for 50,000 viewers. A passing application calculation cannot hide a gateway bottleneck.

**Q39. Which component owns the final answer?**

The application owns business meaning, authorization, freshness, and write authority. DNS, the edge, the balancer, discovery, and health checks make a usable path to it, but none of them can turn a stale copy into an authoritative write. This ownership boundary is the test for whether a proposed routing fix addresses the actual failure.

**Q40. Walk me through one request from user to application and back, including one failure.**

The user resolves a public name, reaches the edge, takes a cache hit or miss path, crosses the balancer, and reaches a healthy application selected from current discovery data. The route records its latency and capacity costs, and the response returns through the established connection. If an endpoint fails, readiness removes it for new work, a safe retry uses an operation identity when needed, and a write failover first establishes authority and fences the old writer.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

### Part I: Reverse proxies and API gateways

**E1** ● A gateway supports 10,000 connections and the service has 50,000 viewers. Compute the nominal gateway count.

**E2** ● Five application endpoints each serve 300 requests per second. Compute normal capacity, one-failure capacity, and the remaining margin at a 1,000 request per second peak.

**E3** ● Round robin assigns work whose per-endpoint totals are 20, 200, and 20 milliseconds. Compute the total listed work and identify the endpoint with the largest work share.

### Part II: L4 and L7 load balancing

**E4** ● Weights are 1, 2, and 1 at a 1,000 request per second peak. Compute each weighted share and then compute the traffic for a 5 percent canary and the established version.

**E5** ● A gateway receives 10,000 long-lived connections that must reconnect within 20 seconds. Compute the required reconnect rate per second. The replay path also sends 200,000,000 bytes per second of live traffic and 10,000,000 bytes per second of replay traffic. Compute their combined rate.

**E6** ●● Explain without equations why an L4 balancer cannot distribute two HTTP/2 requests inside one established connection to different application endpoints, while an L7 balancer can.

### Part III: Load balancing algorithms

**E7** ● Endpoints have weights 1, 2, and 1. Compute the weight total and verify the 250, 500, and 250 requests per second allocation at a 1,000 request per second peak.

**E8** ● With 100 connections and 5 active requests on A, and 10 connections and 200 active requests on B, state which endpoint least connections selects and which endpoint least outstanding requests selects.

**E9** ●● Explain without equations why a 50 request per second canary should not be called safe merely because its request count is small.

**E10** ●● A route has a 250 millisecond deadline. Its serial contributions are 40, 20, 30, 10, 60, and 40 milliseconds. Compute the total and the remaining slack. Then compute the application budget after reserving the 40 millisecond return path.

### Part IV: Consistent hashing and sticky sessions

**E11** ●● A ring sample has five keys, and one key moves after a new owner is inserted. Compute the moved fraction and compare it with the ideal new-owner fraction of one fifth.

**E12** ●● Modulo assignment changes for 8 of 12 sample keys when the divisor changes from 4 to 5. Compute the changed fraction and compare it with the ring sample's moved fraction.

**E13** ●● Explain without equations why a sticky cookie that names a failed endpoint cannot recover a user's session by itself.

### Part V: Health checks and failover

**E14** ●● Health probes run every 5 seconds, remove an endpoint after 3 failures, and have a 1 second timeout. Compute the recorded minimum and maximum detection times.

**E15** ● Five applications each serve 300 requests per second. Compute the utilization after one endpoint fails at a 1,000 request per second peak, then compute capacity after two endpoints fail.

**E16** ●● An application endpoint is alive but cannot reach its score database. Describe whether liveness or readiness should change, what traffic should stop, and why restarting the process may be the wrong response.

### Part VI: Service discovery

**E17** ● A router fetches membership at time 0. The registry changes at time 10, the cache lifetime is 30 seconds, and the router consumes the refresh at time 31. Compute the stale interval after the registry change.

**E18** ●● Trace the failure boundary when a stale router sends a write to an endpoint whose lease expired. Name the check that must reject the old writer and the routing fact that is insufficient by itself.

**E19** ●● Explain without equations why making every request synchronously consult the registry can turn a registry outage into an application outage.

**E20** ● A 99.9 percent availability target allows 2,592 seconds in the stated month budget. Compute the outage budget as a fraction and as a percentage using the 30 seconds of route failure recorded in the example.

### Part VII: DNS, CDN and geographic routing

**E21** ●●● Prove that consistent hashing moves only the keys in the interval claimed by a newly inserted ring position, assuming each key maps to the first position at or after its hash.

**E22** ●●● Prove that forwarding the remaining deadline after each completed stage preserves one end-to-end budget. Evaluate the residual after serial contributions of 40, 20, 30, 10, 60 and 40 milliseconds under a 250-millisecond deadline.

**E23** ●●● Write Python code for a retry identity check. The first request may commit before its response is lost, so a retry with the same operation identity must return the stored result rather than apply the write twice.

### Part VIII: The complete routed request

**E24** ●●● Design a regional write failover sequence using the existing 30 second failover interval and 40 regional lag events. State the order of freshness check, writer fencing, route change, and retry handling.

**E25** ●●● Full sizing exercise. Size the application and gateway layers for a 1,000 request per second peak, 50,000 viewers, five application endpoints at 300 requests per second, and gateways supporting 10,000 connections each. Compare five gateways with six and seven gateways when one gateway is lost, and state the surviving application margin after one application loss.

@chapter solutions | Solutions | Worked answers with every intermediate calculation shown.

**E1.** Divide the 50,000 viewers by 10,000 connections per gateway. The result is $50{,}000 / 10{,}000 = 5$ gateways. This is the nominal count, so losing one leaves 4 gateways carrying $50{,}000 / 4 = 12{,}500$ connections each, above the 10,000 connection capacity.

**E2.** Normal capacity is $5 \times 300 = 1{,}500$ requests per second. After one loss, 4 endpoints provide $4 \times 300 = 1{,}200$ requests per second. At the 1,000 request per second peak, the remaining margin is $1{,}200 - 1{,}000 = 200$ requests per second.

**E3.** Add the listed endpoint work: $20 + 200 + 20 = 240$ milliseconds. The middle endpoint has 200 milliseconds of the 240 milliseconds, so it has the largest work share. Equal assignment did not equalize work because its requests cost more.

**E4.** The weight total is $1 + 2 + 1 = 4$. The shares are $1/4$, $2/4$, and $1/4$, which produce $1{,}000/4 = 250$, $2{,}000/4 = 500$, and $1{,}000/4 = 250$ requests per second. A 5 percent canary receives $1{,}000 \times 0.05 = 50$ requests per second, leaving $1{,}000 - 50 = 950$ for the established version.

**E5.** Divide the reconnect connections by the reconnect window: $10{,}000 / 20 = 500$ connections per second. Add the live and replay byte rates: $200{,}000{,}000 + 10{,}000{,}000 = 210{,}000{,}000$ bytes per second. The two figures describe different resources, so the gateway needs both connection admission and byte-rate protection.

**E6.** L4 chooses a destination when the transport connection begins. The two HTTP/2 requests are streams inside that same connection, so L4 sees one chosen flow and keeps both streams with its destination. L7 terminates or inspects the application protocol, sees the individual streams, and can apply a route to each request.

**E7.** The weights sum to $1 + 2 + 1 = 4$. One weight unit receives $1{,}000 / 4 = 250$ requests per second. The three destinations therefore receive $250$, $2 \times 250 = 500$, and $250$ requests per second, which sum to $1{,}000$.

**E8.** Least connections compares 100 with 10 and selects B. Least outstanding requests compares 5 with 200 and selects A. The different choices show why a socket count is not a request workload measure.

**E9.** The 50 request per second share says how many requests enter the canary, not how expensive those requests are or whether the canary's dependencies work. A small share can still expose every request to a broken authorization path or a slow downstream call. The operator must compare the canary's error, latency, and resource signals with the established version before increasing traffic.

**E10.** Add the serial contributions: $40 + 20 + 30 + 10 + 60 + 40 = 200$ milliseconds. The deadline slack is $250 - 200 = 50$ milliseconds. If the final 40 milliseconds are reserved for the return path, the application budget is $250 - (40 + 20 + 30 + 10) - 40 = 110$ milliseconds, matching the recorded backend budget.

**E11.** One of five keys moves, so the sample moved fraction is $1/5 = 0.2$, or 20 percent. The ideal fraction for a new equal owner is also $1/5 = 0.2$. The equality is a property of this small sample and placement, not a promise that every finite ring has exact ideal movement.

**E12.** The changed fraction is $8/12 = 2/3$, which is 66.666667 percent after rounding. The ring sample moved $1/5 = 20$ percent. The modulo result changes for more of this sample because the divisor changed for every key calculation, while the ring insertion claimed one interval.

**E13.** The cookie contains a preference, not the session's durable state. If the named endpoint has failed, honoring the cookie cannot make that endpoint answer. The fallback must find or reconstruct the session from durable state, then the application can issue a new preference for the healthy endpoint.

**E14.** The shortest recorded detection is two intervals plus one timeout: $2 \times 5 + 1 = 11$ seconds. The longest is three intervals plus the timeout: $3 \times 5 + 1 = 16$ seconds. The difference comes from the phase at which the failure occurs relative to the probe schedule.

**E15.** After one loss, capacity is $4 \times 300 = 1{,}200$ requests per second. Utilization at the 1,000 request per second peak is $1{,}000 / 1{,}200 = 0.833333$, or 83.333333 percent after rounding. After two losses, capacity is $3 \times 300 = 900$ requests per second, which is below the peak by $1{,}000 - 900 = 100$ requests per second.

**E16.** The process is alive, so liveness need not fail. Readiness should fail for score traffic because the endpoint cannot satisfy that route's dependency contract, and the router should stop assigning new score requests to it. Restarting the process does not repair a database dependency and can turn one unavailable dependency into a restart loop.

**E17.** The registry changes at time 10 and the router consumes the new list at time 31. The stale interval after the change is $31 - 10 = 21$ seconds. The 30 second lifetime explains why the old list could remain usable after the update, while the explicit refresh time gives the observed bound in this example.

**E18.** The router's stale membership is not authority. Authoritative storage must reject a write carrying an old fencing generation under its ownership protocol. An expired registration lease alone cannot stop an isolated endpoint from writing. A route change alone only changes where packets go; it cannot prove that an old process is no longer allowed to commit.

**E19.** If every request waits for the registry, the registry becomes a dependency of every request. A registry outage or slow response then blocks routing even when the application endpoints are healthy. A cached list permits bounded stale membership, while leases, health, and endpoint rejection handle the unsafe cases.

**E20.** The stated 30 seconds of failure divided by the 2,592 second budget gives $30 / 2{,}592 = 0.011574$ as the recorded fraction. Compute the percent from the unrounded ratio, $(30/2592)\times100=1.157407$ percent after rounding. This uses the route failure interval in the example and does not change the 99.9 percent target.

**E21.** Let q be the old position immediately preceding the inserted position p in clockwise order. A key in the clockwise interval (q,p] previously reached the old successor of q; after insertion it reaches p first. For every key outside that interval, an old position still appears before p on its clockwise search, so its first position and owner stay unchanged. Thus insertion moves exactly the keys in (q,p], including an interval that wraps around the ring's origin. This proof assumes distinct ring positions and the stated first-position ownership rule.

**E22.** Let D be the original deadline allowance and t_i the elapsed duration of stage i. After the first stage, remaining time is D minus t_1. If after j stages it equals D minus their accumulated elapsed time, subtracting stage j+1's elapsed time gives the same rule for j+1. By induction, no stage receives time already consumed by another stage. In the serial trace, elapsed sums are 40, 60, 90, 100, 160 and 200 milliseconds. Remaining allowances are therefore 210, 190, 160, 150, 90 and 50. The final slack is $250-200=50$ milliseconds. Forwarding a fresh D instead would invalidate the invariant. This argument assumes correctly accounted elapsed time and compatible clock or relative-budget handling.

**E23.** Store the operation identity and its result in the same database transaction as the business effect. This example assumes `operations.operation_id` is unique, the same id always names the same validated payload, and the account exists.

```python
def apply_once(db, operation_id, account_id, amount):
    with db.transaction():
        claimed = db.execute(
            "INSERT INTO operations(operation_id) VALUES (%s) "
            "ON CONFLICT DO NOTHING RETURNING operation_id", (operation_id,),
        ).fetchone()
        if not claimed:
            return db.execute("SELECT result FROM operations WHERE operation_id=%s", (operation_id,)).fetchone()[0]
        result = db.execute("UPDATE accounts SET balance=balance+%s WHERE id=%s RETURNING balance", (amount, account_id)).fetchone()[0]
        db.execute("UPDATE operations SET result=%s WHERE operation_id=%s", (result, operation_id))
    return result
```

A failed transaction rolls back both the identity and the increment. A crash after commit but before response leaves a stored result that the next attempt returns without repeating the increment. The database's conflict and transaction semantics must make the completed prior row visible to the conflict path; a plain in-memory check followed by a write would not supply this guarantee.

**E24.** First stop admitting new writes to the failed region and check whether the other copy includes the required history. The example records a 30 second failover interval and 40 lag events, so the system must evaluate that lag against the write contract before selecting the copy. Next establish and fence the new writer, change routing, and make retries carry the same operation identity so a response loss does not create another write. Only after fencing should the new route accept writes.

**E25.** The application layer has normal capacity $5 \times 300 = 1{,}500$ requests per second. After one application loss it has $4 \times 300 = 1{,}200$, leaving $1{,}200 - 1{,}000 = 200$ requests per second of peak margin.

For gateways, five gateways provide $5 \times 10{,}000 = 50{,}000$ connection capacity, exactly matching the 50,000 viewers. After one gateway loss, four gateways provide $4 \times 10{,}000 = 40{,}000$, so the load per survivor is $50{,}000 / 4 = 12{,}500$, which exceeds 10,000. Six gateways provide $6 \times 10{,}000 = 60{,}000$ normally; after one loss, five survivors provide 50,000 and each carries $50{,}000 / 5 = 10{,}000$, exactly at capacity. Seven gateways provide $70{,}000$ normally; after one loss, six survivors provide 60,000 and each carries $50{,}000 / 6 = 8{,}333.333333$ connections, below capacity. Five gateways have no one-loss margin, six have zero connection margin after one loss, and seven retain $10{,}000 - 8{,}333.333333 = 1{,}666.666667$ connections per survivor.

### Primary sources

[Envoy load balancing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancing). Algorithm choices and upstream routing.

[Google SRE overload](https://sre.google/sre-book/handling-overload/). Admission and recovery behavior.

[DNS concepts](https://www.rfc-editor.org/rfc/rfc1034). Resolvers and cached naming records.

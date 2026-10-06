@part VI | Circuit breakers and bulkheads | We stop calling a dependency that is clearly failing, and we wall off its failures so they cannot spread. Both ideas come from older engineering, electrical breakers and ship hulls, and both work the same way in software. We will cover circuit breakers and their states, bulkheads, and failing fast with fallbacks and graceful degradation. | where:6

## 16. Circuit breakers

When Wren's payment provider is down, every call to it waits for the 2 s timeout and then fails. Each failed call holds a thread for 2 s, adds latency for the user, and adds load to a provider that is trying to recover. Timeouts limit the damage of each call, and they do nothing about the obvious pattern that the last twenty calls all failed. A **circuit breaker** notices that pattern and stops making calls for a while. Michael Nygard named the pattern in *Release It!* in 2007, after the electrical device that cuts the circuit when the current is dangerous.

A breaker has three states. In the **closed** state, calls pass through normally, and the breaker counts successes and failures over a recent window. When failures cross a threshold, Wren's is 50% of the last 20 calls, it trips to **open**. In the open state, every call fails immediately, in microseconds, without touching the provider, and the caller runs its fallback. After a cool-down, 30 s for Wren, the breaker moves to **half-open** and lets a few probe calls through. If they succeed, it closes, and normal traffic resumes. If they fail, it opens again for another cool-down.

@fig be_cb_states | Closed while healthy, open after too many failures, half-open to test recovery.

The open state is where the value lies. Users get an immediate response from the fallback instead of a 2 s wait. Threads and connections are freed for other work, which stops the cascade of Part IV. And the struggling provider gets a break from traffic, which often lets it recover sooner.

@fig be_cb_timeline | Illustrative. The breaker opens soon after failures climb, probes once, and closes when the provider recovers.

Tuning matters. The window should contain enough calls to be meaningful, so a minimum of 20 calls before the breaker can trip stops a single failure at low traffic from opening it. The failure count should include timeouts and 5xx responses but not 4xx errors caused by the caller, which say nothing about the provider's health. Some breakers also trip on slow calls, treating anything over a latency threshold as a failure, which catches a provider that is slow but not erroring. Libraries such as Resilience4j for Java, Polly for .NET, gobreaker for Go and opossum for Node implement all of this, and service meshes offer a related mechanism, outlier detection, that ejects a bad instance from a load-balancing pool, Unit XI.

Breakers are per dependency, and sometimes per endpoint or per instance of the dependency. One breaker for "the payment provider" makes sense. One breaker for "all outgoing HTTP" would cut off healthy dependencies when one fails.

## 17. Bulkheads

Ships are divided into watertight compartments by walls called **bulkheads**, so that a breach floods one compartment and the ship stays afloat. In software a bulkhead gives each dependency or kind of work its own limited pool of resources, so one cannot exhaust what the others need.

Without bulkheads, Wren's order service handled all outgoing calls with one thread pool of 200. When the payment provider slowed, payment calls occupied all 200 threads, and requests for menus and order tracking, which never touched the provider, had no threads left. A slow dependency used by 5% of requests took down 100% of them.

@fig be_bulkhead | Payments flood their own compartment. Menus, kitchen calls and everything else stay dry.

With bulkheads, payment calls get a pool of 20 concurrent calls per instance, kitchen calls 20, menu work 80 and everything else 80. When payments slow, they fill their 20, and further payment requests are refused or queued briefly, while the other 180 slots keep serving everything else. The bulkhead can be a separate thread pool, as in Hystrix's thread isolation, or a semaphore limiting concurrent calls, as in Resilience4j's semaphore bulkhead, which is cheaper and works in event-loop runtimes.

The sizes come from Little's law again. Payment calls arrive at most at about 10 per second per instance and take 400 ms at the p99, so 10 × 0.4 = 4 are in flight normally, and 20 leaves room for a slow spell without hoarding. Unit IX's semaphores and Unit VI's separate connection pools for reports and APIs are bulkheads by another name.

Bulkheads apply at larger scales too. Separate worker fleets for different queues, separate database pools for batch jobs, and **cell-based architecture**, which divides a whole service into independent cells, each serving a slice of users with its own copy of the stack, are all bulkheads. A failure in one cell affects only that cell's users. Amazon has written about using cells to limit the blast radius of failures in large services.

## 18. Fail fast, fallbacks and graceful degradation

**Failing fast** means detecting that a request cannot succeed and saying so immediately, rather than after a long wait. Open breakers, full bulkheads, exhausted pool waits, expired deadlines and admission control all fail fast. A fast failure frees resources, gives the user a quick answer and lets the caller decide what to do. A slow failure ties up resources and teaches users to hammer refresh.

What the caller does next is the **fallback**. Good fallbacks depend on the dependency. When the recommendation service is down, the menu page shows no "people also ordered" carousel, which almost nobody notices. When the live delivery-time estimate is unavailable, the app shows the restaurant's typical time. When the menu service cannot reach the database, it serves the cached menu, stale by up to 10 minutes, Unit VII's stale-if-error. When the payment provider is down, there is no honest fallback that charges the card, so Wren holds the order, tells the user the payment will be confirmed shortly, and retries in the background with the same idempotency key.

Some fallbacks are dangerous. Returning an empty list when the search service fails looks like "no results", which misleads users. Returning a default "allowed" when the authorization service is down opens a security hole, and authorization must fail closed. Fallbacks should be honest about being fallbacks, both to users and in logs and metrics.

**Graceful degradation** organizes fallbacks into levels. Wren defines five. Full service. Recommendations and personalization off. Menus served from cache. Orders accepted into a queue and confirmed later. And read-only mode, where users can browse but not order. Each level is a set of feature flags, decided in advance, tested in game days and switchable in seconds, so that during an incident the on-call engineer turns a dial instead of writing code.

@fig be_degrade | Five levels, each decided in advance. During an incident, someone turns the dial.

Degradation can also be automatic. Breakers trigger fallbacks per dependency, admission control sheds low-priority traffic first, and load-based flags turn off expensive features when latency rises. The principle behind all of it is that a partial service is better than none, and that what to drop first is a product decision made calmly beforehand, not an engineering decision made at 3 a.m.

:::story Picture this
A house's fuse box. When the kettle shorts, its fuse trips, the kitchen sockets go dark, and the lights, the fridge and the heating stay on. You do not keep plugging the kettle back in every few seconds. You wait, reset the fuse once, and if it trips again, you leave the kettle unplugged and make tea on the stove.
:::

:::note Test the failure paths
Fallbacks that never run in normal operation rot. Wren's game days inject failures, a dependency returning 503, a 10 s delay, a dropped connection, and check that breakers open, bulkheads hold, fallbacks render and alerts fire. Chaos tools such as Gremlin, Chaos Mesh and AWS Fault Injection Service automate this, Unit V's chaos tests.
:::

:::warn Watch out
A circuit breaker shared across all instances through a central store adds a dependency to every call and a single point of failure. Breakers are normally local to each instance, each observing its own calls, which is simpler and tolerates the central store being down.
:::

:::interview Interview lens
**"Explain the circuit breaker pattern."** A breaker wraps calls to one dependency. Closed, it passes calls and tracks failures over a window. When failures cross a threshold, such as 50% of the last 20 calls, it opens and fails calls immediately without calling the dependency, so callers run fallbacks, resources are freed and the dependency can recover. After a cool-down it goes half-open and lets probes through, closing on success and reopening on failure. Combine it with timeouts, bulkheads that isolate the dependency's resources, and honest fallbacks.
:::

:::key In one breath
A circuit breaker counts failures per dependency, opens when, say, 50% of the last 20 calls fail, then fails calls in microseconds for 30 s before letting half-open probes test recovery. Bulkheads give each dependency its own pool, 20 payment calls per instance, so a slow provider cannot take the threads that serve menus, and cells apply the same idea to whole stacks. Failing fast frees resources, fallbacks such as cached menus or held orders give honest partial answers, authorization fails closed, and graceful degradation is a dial of levels decided before the incident.
:::

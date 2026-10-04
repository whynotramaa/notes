@part V | Monoliths and microservices | We choose where code, state, and deployment can change independently. Splitting a program adds network and ownership boundaries to operations that used to share memory. We will compare a monolith, a modular monolith, and services by following the invariants they must preserve. | where:5

## 18. A monolith can have a clear internal structure

Heron's score correction updates a match row and records an event in one transaction. Keeping these operations in one deployed program makes the transaction straightforward. A **monolith** is an application deployed as one main unit. It can still contain separate packages, well-defined interfaces, and carefully enforced data ownership.

Start with score, media, and identity modules in the same application. The score module owns score mutations; the media module owns upload state. An internal method call can pass an ordinary value and return a result. A shared database permits one local transaction where the business invariant needs it. The deployment boundary does not tell us whether the code is organized well.

@fig sd_api_monolith | Modules can have separate owners while sharing one process and deployment.

### The useful cost comparison

The process shares a failure and resource boundary. A media task that exhausts memory can harm score reads unless isolated through budgets or separate workers. Deploying a small identity change can require redeploying the whole application. These are reasons to improve boundaries; they do not prove every module should become a remote service immediately.

A **modular monolith** keeps one deployment while enforcing explicit module interfaces and ownership rules. Modules avoid writing each other's tables directly, even if one database holds them. This exposes accidental coupling before adding unreliable network calls. If the module interface cannot explain the intended operation inside one process, making it remote usually makes that ambiguity more expensive.

:::story Picture this
Different counters in one shop can have their own inventories and staff while sharing a building. Moving a counter into a separate building adds deliveries, independent opening hours, and records of what was handed over. It does not automatically fix a confusing inventory policy.
:::

## 19. A service boundary should match an ownership boundary

The media team needs to scale encoders independently of score readers. **Microservices** divide an application into separately running services communicating through explicit interfaces. The useful boundary is often a business responsibility with its own data authority, deployment cadence, and failure policy. One remote service per table rarely explains how a complete business action should recover.

Heron's score service owns an ordered match history. The media service owns uploaded clip processing. An event can connect them without requiring each score read to call an encoder. Separating these paths makes their capacity needs independent. Splitting score state across separate match and event services, however, would turn the correction's local invariant into a cross-service commit problem.

@fig sd_api_boundaries | Put state that must commit together inside one authority when independent ownership adds no useful benefit.

### State the invariant before drawing the boundary

Suppose the rule is that an accepted correction always has a corresponding durable event. With one database transaction, the row and event commit together. With two independent services, a successful row update followed by failed event publication violates the rule unless an outbox or another recoverable protocol preserves intent. The drawing must include that protocol rather than an arrow labeled 'send event.'

Services also create operating work: independent health, discovery, credentials, schema evolution, traces, and on-call ownership. Those costs grow with the number of interactions, especially if a user request synchronously touches many services. Choose boundaries because they solve a measured ownership or isolation problem, and keep the original invariant visible through the change.

:::warn Watch out
A separate service with a shared database and unrestricted cross-service table writes has weak data ownership. It can combine remote-call failure with hidden database coupling. Either enforce ownership through interfaces or explain why the shared transaction boundary is deliberately retained.
:::

## 20. Synchronous calls add waiting and shared success conditions

A score page asks the score, identity, media, and recommendation services for data. A **synchronous call** makes the caller wait for the callee's result before continuing the dependent work. Splitting a page into services can add transit and queueing even if every service performs the same computation as before.

Use an illustrative latency trace with four independent 20 ms calls. Issuing them serially costs 80 ms before merge work; issuing them concurrently has a 20 ms critical path under the stated equal timing and zero-overhead assumptions. Parallel calls still create four pieces of downstream work. If they all share one exhausted database pool, concurrency can increase contention instead of shortening the page.

@fig sd_api_sync_budget | Illustrative serial and concurrent calls have the same four operations but different critical paths.

For five required independent components each available with probability 0.999 under a deliberately simplified model, the product is 0.995009990004999. This is a computed model, not a service prediction. Failures are often correlated, and optional data can be omitted. The point is that a required chain creates more ways for the whole request to fail.

### Carry one useful deadline

Give the whole request 500 ms. If entry consumed 40 ms and response work needs 60 ms, 400 ms remains for dependencies. Two serial dependent stages cannot each spend 400 ms and still meet the parent deadline. Divide or propagate remaining time, cancel abandoned work where supported, and report the stage that exhausted the budget.

@fig sd_api_deadline | Illustrative parent deadline. Entry and response work leave 400 ms for all serial dependencies together.

If recommendations are optional, return the current score without them when they exceed a smaller budget. That turns the product rule into a degradation policy. Calling every dependency with the same generous timeout ignores which result the user actually needs.

## 21. Asynchronous communication changes the observation contract

A correction commits and the media service learns about it later. **Asynchronous communication** lets the sender continue without waiting for the receiver's complete business effect. It can reduce a required success chain, but it adds delay, replay, duplicates, and progress that someone must observe.

Heron records correction intent and an event in a local transaction. A publisher later delivers the event. The media service uses the event identity to avoid repeated work and records the last applied score revision. The user can see the accepted correction before all media captions catch up, so the response and UI must distinguish authoritative score state from a delayed derived view.

@fig sd_api_async_boundary | A committed command and a later derived view have different observation times.

A **command** asks an authority to perform an action; an **event** records that a fact has occurred under that authority's contract. `CorrectScore` can be rejected. `ScoreCorrected` should identify the committed effect and revision. Treating both as anonymous JSON messages makes failure recovery unclear: can the receiver reject the fact, or must it record that it could not apply a derived update?

### Service discovery connects names to changing processes

A logical score service can run on different endpoints after deployment. **Service discovery** supplies current endpoint information to callers or proxies. A cached entry can outlive its process, so connection failure needs bounded refresh and retry. Discovery identifies a possible destination; it does not grant that destination authority over every match. The routing chapter separates those decisions.

An asynchronous consumer also needs discovery for brokers or remote sinks, but its durable backlog changes the recovery path. A temporarily missing destination can be retried later without holding the original user's socket. That improves one failure boundary while making retained work and oldest-event age operational responsibilities.

:::note One interface, several transports
A module's operation can be expressed through an internal call, HTTP, gRPC, or a durable message. Choose the interaction contract first. Transport syntax does not decide whether the action may be retried, must be ordered, or can finish after the caller stops waiting.
:::

:::interview Interview lens
**"When would you split a modular monolith?"** I would name an ownership, deployment, or resource-isolation need that the current boundary prevents. Then I would show which invariants stay local and how any newly remote effect recovers. Independent scaling helps only when the split workload has a different bottleneck and the added calls do not recreate a required shared chain.
:::

:::key In one breath
A monolith describes deployment, while modularity describes internal ownership. A service boundary adds unreliable communication and separate commit authority. Synchronous calls extend the request's success chain; asynchronous calls create delayed observation and retained recovery work. Choose boundaries around invariants and measured operating needs.
:::

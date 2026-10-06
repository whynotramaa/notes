@part X | Code quality and the full request | We close with the habits that keep backend code changeable and then trace one request through everything in the unit. Interviews often move from architecture straight into code, and the same principles decide whether a codebase is still pleasant to change in three years. We will cover separation of concerns and dependency inversion, side effects, immutability and resource ownership, when abstraction pays for itself, and Wren's POST /orders end to end. | where:10

## 36. Separation of concerns, dependency inversion and interface design

**Separation of concerns** means each piece of code deals with one reason to change. Wren's pricing function changes when the business changes its discount rules. The repository changes when the database schema changes. The controller changes when the API changes. Mixing them means a schema change forces a careful reread of pricing logic, and a pricing change risks breaking SQL. The layering from Part VII is separation of concerns applied at the scale of a request.

**Dependency inversion**, the "D" in Robert Martin's SOLID principles, says that high-level policy should not depend on low-level detail. Both should depend on an abstraction owned by the policy. `OrderService` does not import `StripeClient`. It declares the `PaymentGateway` interface it needs, `charge(order_id, amount, key) -> PaymentResult`, and `StripeGateway` implements it. When Wren adds Razorpay for Indian cards, it writes a second implementation and changes one line of wiring. The service and its tests do not change.

@fig be_quality_dip | The service owns the interface; the Stripe class implements it. Swapping providers touches one adapter.

Good **interface design** follows from what the caller needs, not from what the implementation happens to offer. A payment gateway interface with one `charge` method and one `refund` method is easy to fake, easy to implement twice, and hard to misuse. An interface that mirrors all 200 endpoints of Stripe's SDK is neither. Prefer composition over inheritance. A service that holds a gateway, a repository and a clock is easier to understand than one that inherits behaviour through four base classes, because everything it can do is visible in its constructor.

Naming is part of design. `OrderService.place(order)` tells a reader what happens. `OrderManager.process(data)` tells them nothing. Names should come from the business vocabulary, the words restaurant staff and product managers actually use, so code, tickets and conversations talk about the same things.

## 37. Side effects, immutability, resource ownership and when abstraction pays

A **side effect** is anything a function does besides returning a value: writing to the database, sending an email, charging a card, logging, reading the clock. Side effects are necessary, since a backend exists to cause them, but they are what makes code hard to test and reason about. A useful habit keeps business decisions in pure functions, which compute a result from their inputs alone, and pushes effects to the edges. Wren's `price(basket, menu, coupon, now)` is pure and trivially testable with any inputs. The service gathers its inputs, calls it, and then performs the effects in a transaction. This arrangement is sometimes called "functional core, imperative shell".

**Immutability** helps the same way. A value that cannot change after creation can be shared between threads without locks and passed to functions without fear that they modify it. Domain events and DTOs are natural immutable values. Mutable shared state, such as a module-level dictionary used as a cache, is a common source of concurrency bugs and of test pollution across runs.

**Resource ownership** is the question of who opens and who closes. A database connection, a file handle, a lock or an HTTP response body must be released exactly once, on every path, including errors. Languages provide structured forms for this, such as Python's `with`, Java's try-with-resources, Go's `defer` and Rust's ownership rules. The function that acquires a resource should release it, and resources should not be passed around in ways that make it unclear who is responsible. Unit IX shows the outages that leaked connections cause.

Finally, every abstraction costs something to read, write and change, and it pays back only when it is used. An interface with one implementation that will never have a second, and is never faked in a test, is pure cost. A rough rule is to write the concrete code first, extract the abstraction when the second real use appears, and accept a little duplication rather than the wrong abstraction. As an illustrative model, the cost of change without an abstraction grows quickly with the number of implementations and call sites, while with one it starts higher and grows slowly. The lines cross somewhere around the second implementation.

@fig be_quality_abstraction | Illustrative cost curves. Abstractions start expensive and pay back as uses multiply.

:::warn Watch out
Do not turn every simple CRUD service into a showcase architecture with abstract factories, generic repositories over generic repositories, and mappers between identical classes. Interviewers increasingly ask when you would not add an abstraction. A good answer names what the abstraction protects and what it costs.
:::

## 38. POST /orders through the whole architecture

User 42 taps "Place order" for one biryani from restaurant 9. The app sends `POST /orders` with an `Idempotency-Key`, a bearer token and a JSON body. The router matches the path to `OrderController.create`. Middleware assigns request id `req_7Hq2`, enforces the body limit and the user's rate limit, authenticates the token, and resolves the tenant. The controller parses the body into `CreateOrderRequest`, which rejects unknown fields and bounds quantities, returning 422 with field errors if anything is off.

Next, the idempotency layer from Part IV inserts the key with status `running`. If the key already exists with a stored response, the controller returns that response immediately. Then the controller calls `OrderService.place(user, request)`. The service loads the restaurant and menu through repositories, checks that restaurant 9 is open and the items are available, and calls the pure `price()` function with the current time from an injected clock. It opens a transaction, inserts the order through the repository, records the idempotency response, and writes an outbox event, which Unit VIII uses to notify the kitchen. It commits.

If anything fails, the error travels up wrapped with context and the global handler maps it. A closed restaurant becomes 409 `RESTAURANT_CLOSED`, a database outage becomes 503 with Retry-After, and an unexpected exception becomes a generic 500 with an alert and a logged cause chain. On success the controller maps the domain `Order` to `OrderResponse` and returns `201 Created` with `Location: /orders/124`. Every log line along the way carries `req_7Hq2`.

@fig be_api_e2e | Eight steps. Only the orange one makes business decisions; the rest each do one supporting job.

Each piece of the unit plays a part in that one request. Resource URLs and status codes make it predictable. Idempotency keys make it retryable. The contract fixes its shape for every client. Layers and ports give each concern a home that can be tested alone. The error model makes failures honest and actionable. Tests at each level prove it works. What this unit did not cover is what happens inside the repository, how connections, transactions, ORMs and migrations behave under load. Unit VI opens that box.

@fig be_api_components | The unit on one page. Each card is one job the request needed.

:::story Picture this
A well-run post office. The address format means any clerk can route a parcel (resources). A tracking number means a resent form does not send two parcels (idempotency keys). The form layout is printed and agreed (the contract). Sorting, weighing and loading happen at separate desks (layers). A returned parcel comes back with a reason code (errors). And the whole process was rehearsed before opening day (tests).
:::

:::interview Interview lens
**"Walk me through what happens in your service when a client sends POST /orders."** The router dispatches to the order controller after middleware assigns a request id, enforces limits, authenticates and resolves the tenant. The controller validates the body into a DTO and checks the idempotency key, returning a stored response for repeats. The service loads the restaurant and menu through repositories, checks business rules, prices the order with a pure function, and in one transaction inserts the order, the idempotency record and an outbox event. Errors are wrapped and mapped by a global handler to 409, 422, 503 or a generic 500, and success returns 201 with a Location header and the response DTO.
:::

:::key In one breath
Separation of concerns gives each piece of code one reason to change, dependency inversion lets the service own the interfaces its details implement, and good interfaces follow what the caller needs. Pure functions for decisions, effects at the edges, immutable values and clear resource ownership keep code testable and safe. Abstractions pay back only when used, roughly from the second implementation. POST /orders passes router, middleware, controller, idempotency, service, repository and error mapping, and returns 201 with a Location header, every step logged under one request id.
:::

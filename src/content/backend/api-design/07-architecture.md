@part VII | Application architecture | We move inside the server and give every concern of a request a single, obvious home. Code where HTTP parsing, business rules and SQL are mixed in one function is quick to write and slow to change, test or secure. We will cover the router-to-repository layers, DTOs, models, configuration and dependency injection, layered and modular monolith architectures, and hexagonal and clean architecture. | where:7

## 24. Router, middleware, controller, service and repository

Wren's first `POST /orders` handler was 300 lines. It parsed JSON, checked the session, validated items, computed prices, opened a transaction, inserted rows with hand-built SQL, called the payment provider, formatted the response and caught exceptions, all in one function. Testing the pricing rule meant starting a web server and a database. Changing the database meant reading every handler. The standard cure is to split a request's journey into layers, each with one job, which most frameworks encourage.

The **router** maps a method and a URL pattern to a handler, `POST /orders` to `OrderController.create`. **Middleware** wraps every request with cross-cutting work: authentication, rate limiting, request ids, logging, CORS, error mapping. The **controller** (or handler) is the HTTP boundary. It turns the request into a DTO, calls one service method, and turns the result into a response with a status code. It contains no business rules. The **service** holds the business logic for one use case, such as "place an order": check the restaurant is open, price the items, apply the coupon, run it all in a transaction. It knows nothing about HTTP, so the same service can run from a CLI command or a queue consumer. The **repository** hides data access behind methods like `orders.add(order)` and `orders_for(user).get(id)`, and contains queries but no business decisions.

@fig be_arch_layers | One job per layer. The service is where decisions live, and it does not know about HTTP or SQL.

The test for whether layers are in the right place is what each one imports. Controllers import the HTTP framework and services. Services import domain models and repository interfaces. Repositories import the database driver or ORM. When a service imports the request object, or a controller runs SQL, a boundary has leaked, and changes on one side start breaking the other. The point of layering is not the number of folders but the ability to change one concern without reading the others.

## 25. DTOs, models, configuration and dependency injection

An order takes three shapes as it passes through these layers. The incoming **DTO**, `CreateOrderRequest`, is exactly what the client may send, validated as in Unit IV. The **domain model**, `Order`, is the business object with its rules, such as an `id`, a `status` and a `version`, and methods like `place()` and `cancel()` that enforce valid state changes. The outgoing DTO, `OrderResponse`, is exactly what the client may see. Keeping them separate means a new internal field, such as `fraud_score`, never appears in API responses by accident, and a rename in the database does not change the public API. Mapping between them is tedious code, and that tedium is the price of the decoupling.

@fig be_arch_dto_model | Three shapes, three owners. The response DTO stops internal fields from leaking.

**Configuration** is everything that differs between environments: database URLs, API keys, timeouts, feature flags. It belongs outside the code, in environment variables or a configuration service, loaded once at startup into a typed settings object that fails fast when a required value is missing. Secrets get special handling, which Unit XIII covers. A service should never read `os.environ` deep inside business logic, since that hides a dependency and makes tests depend on the environment.

**Dependency injection** (DI) means a component receives its collaborators instead of creating them. `OrderService` takes an order repository, a payment gateway and a clock in its constructor. In production, the application's startup code wires in `PostgresOrderRepo`, `StripePayments` and `SystemClock`. In tests, it wires in an in-memory repository, a fake payment gateway and a fixed clock set to 10:00 on a Friday. The service code is identical in both cases. DI can be done by hand in a few lines of startup code, or by frameworks such as Spring, NestJS, FastAPI's `Depends` and Google's Guice. The pattern matters more than the framework.

@fig be_arch_di | The service asks for interfaces. Startup code decides which implementations to plug in.

:::story Picture this
A restaurant kitchen. The waiter takes the order and writes a ticket in a fixed format (the controller and DTO). The head chef decides how the dish is made (the service). The storeroom clerk fetches ingredients from wherever they are kept (the repository). The chef never goes to the storeroom, and the waiter never cooks. When the restaurant changes suppliers, only the storeroom changes.
:::

## 26. Layered architecture, MVC and the modular monolith

**Layered architecture**, the stack from Section 24, is the default for most backends and the right starting point. **MVC** (model, view, controller), from Trygve Reenskaug's work on Smalltalk in 1979, is a related pattern for user interfaces. In server frameworks such as Rails, Django and Spring MVC, the model is data and rules, the view renders HTML or JSON, and the controller handles requests. For JSON APIs, the view is usually a serializer, and the service layer is often added between controller and model when business logic outgrows the model.

As Wren grows, the layers stay but the codebase splits by business area. Orders, payments, menus and delivery each have their own controllers, services and repositories. A **modular monolith** makes those areas explicit modules inside one deployable application, with enforced boundaries. Each module exposes a small public interface, such as `payments.charge(order_id, amount)`, and hides everything else, including its own tables. Other modules call only the public interface, never its internals or tables. Tools such as ArchUnit for Java, import-linter for Python and Packwerk for Ruby fail the build when a module reaches into another.

@fig be_arch_modular | One process, three modules, each with a public API and its own tables.

The modular monolith keeps the simplicity of one deployment, one database transaction across modules when needed, and in-process calls that cannot time out. It also prepares for splitting later. A module with a clean interface and its own tables can become a separate service with far less pain than a tangle of shared code. Shopify runs one of the largest Rails applications in the world as a modular monolith for this reason, and Unit XV discusses when splitting into services is worth its costs.

## 27. Hexagonal architecture, ports and adapters, and clean architecture

Layered code still tends to let the database leak upward, with services returning ORM objects and business rules written as queries. **Hexagonal architecture**, described by Alistair Cockburn in 2005 and also called **ports and adapters**, flips the dependency. The domain core sits in the middle and defines **ports**, interfaces for what it needs, such as `OrderRepository` and `PaymentGateway`, and for what it offers, such as `PlaceOrder`. **Adapters** on the outside implement those ports. On the driving side, an HTTP controller and a gRPC handler call the core. On the driven side, a Postgres repository and a Stripe client implement the core's interfaces. The core imports nothing from the outside world.

@fig be_arch_hexagonal | The core defines the ports. Adapters on both sides plug into them.

**Clean architecture**, Robert Martin's 2012 synthesis of hexagonal and similar ideas, draws the same thing as concentric circles: entities in the centre, use cases around them, adapters around those, and frameworks and databases on the outside. Its single rule is the **dependency rule**: source code dependencies point only inward. The ORM adapter imports the core's `Order`. The core never imports the ORM.

@fig be_arch_dependency_rule | Arrows point inward. The business rules do not know which database or web framework is used.

The question to ask of any of these architectures is why a given boundary exists. A boundary pays when it protects something that changes at a different rate or for a different reason than its neighbours. Wren's pricing rules change weekly, its payment provider maybe once in five years, its web framework rarely. Putting a port between pricing and payments lets Wren test pricing without Stripe, swap Stripe for Razorpay in one adapter, and run the same use case from HTTP and from a queue. A boundary that protects nothing, such as an interface with one implementation that will never change and is never faked in a test, is cost without benefit.

:::warn Watch out
Do not turn a simple CRUD service into clean architecture with six layers, a use-case class per endpoint and mappers between identical objects. Each layer costs code that must be read and changed together. Start with controller, service and repository, and introduce ports where a real second implementation, a test fake or a fast-changing rule justifies them.
:::

:::interview Interview lens
**"Explain hexagonal architecture and when it is worth it."** The business core defines interfaces, called ports, for what it needs, such as a repository or a payment gateway, and adapters implement them for specific technologies, HTTP and gRPC on the driving side, Postgres and Stripe on the driven side. Dependencies point inward, so the core can be tested with fakes and run from any entry point. It is worth it where business rules are complex and outlive their infrastructure, or where several adapters really exist. For a thin CRUD service it is mostly ceremony.
:::

:::key In one breath
The router maps requests to controllers, middleware handles cross-cutting concerns, controllers translate HTTP to DTOs and back, services hold the business rules without knowing HTTP, and repositories hide data access. Separate request DTOs, domain models and response DTOs keep internal fields private, configuration lives outside code in typed settings, and dependency injection lets tests swap real collaborators for fakes. A modular monolith enforces module boundaries in one deployable, and hexagonal or clean architecture points dependencies inward toward a core defined by ports. Every boundary should exist because it protects something that changes for a different reason.
:::

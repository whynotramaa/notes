@part V | RPC, GraphQL and gRPC | We compare REST with the three other styles a backend engineer meets, and learn where each fits. Choosing the wrong style for a job produces chatty clients, overloaded databases or APIs nobody outside the company can call. We will cover RPC, GraphQL with its resolvers, N+1 problem, complexity limits and caching issues, gRPC with Protocol Buffers, streaming and deadlines, and a comparison. | where:5

## 14. RPC style versus REST

REST models an API as resources. The older and simpler idea models it as functions. In **RPC** (remote procedure call), the client calls a named operation with arguments, `createOrder(restaurant=9, items=[...])` or `chargeCard(card, 450)`, as if it were a local function, and the framework turns that into a network request. Over HTTP this usually looks like `POST /createOrder` or `POST /rpc` with a method name in the body, as in JSON-RPC. Slack's Web API is RPC style, with endpoints such as `chat.postMessage`.

@fig be_rpc_vs_rest | RPC names actions; REST names resources. Both work, and they suit different jobs.

RPC fits operations that are naturally verbs, such as "recalculate delivery fees for zone 4" or "merge these two accounts", which REST must contort into sub-resources. It is also a natural fit between services in the same company, where both sides share a code base and want typed calls rather than URLs. Its costs are that everything is a POST, so HTTP caches, idempotent retries by generic clients, and method-based permissions at gateways stop helping, and that a flat list of hundreds of verbs is harder to explore than a resource tree. Most real APIs mix the two, REST for resources and a few RPC-style actions.

The deeper risk of RPC is pretending the network is not there. A call that looks like a local function can take 300 ms, fail halfway, or succeed without returning. Peter Deutsch's "fallacies of distributed computing", written at Sun in the 1990s, begin with "the network is reliable", and RPC frameworks that hide the network make it easy to forget. Every remote call needs a timeout, a retry policy and an idempotency story, whatever the style.

## 15. GraphQL: schema, queries, mutations, resolvers and subscriptions

Wren's mobile home screen needs a user's last three orders, each with its restaurant name and items, plus the menu of the restaurant they order from most. With REST that is four or five round trips, or a custom endpoint built for that one screen. Each new screen wants another custom endpoint, and the web app wants slightly different fields. **GraphQL**, which Facebook built in 2012 for its mobile apps and released in 2015, lets the client describe exactly the data it needs in one query, and get back exactly that shape.

A GraphQL API has a **schema** that defines types and their fields, such as `type Order { id: ID!, total: Int!, restaurant: Restaurant!, items: [Item!]! }`, plus root types for operations. **Queries** read data, **mutations** change it, and **subscriptions** push updates over a long-lived connection, usually a WebSocket. Everything goes through one endpoint, typically `POST /graphql`. The query `{ order(id: 123) { total restaurant { name } items { name qty } } }` returns `{"data": {"order": {"total": 450, "restaurant": {"name": "Spice"}, "items": [...]}}}`, the same shape as the question.

@fig be_gql_query | The query and the response have the same shape. The client takes exactly what it asked for.

On the server, each field has a **resolver**, a function that produces its value. `Query.order` loads order 123. `Order.restaurant` takes that order and loads its restaurant. `Order.items` loads its items. The GraphQL engine walks the query tree, calling resolvers level by level and assembling the result. Resolvers are small and easy to write, and that ease hides a performance trap, the subject of the next section.

@fig be_gql_resolvers | One resolver per field, called as the engine walks the query tree.

GraphQL has no URLs per resource, and errors come back with status 200 and an `errors` array next to partial `data`, which surprises monitoring that only counts HTTP status codes. Schema changes follow the compatibility rules of Part III, with fields marked `@deprecated` rather than removed, since the schema itself is the contract.

## 16. N+1 queries and DataLoader

Ask GraphQL for 20 orders, each with its restaurant and its five items. The `orders` resolver runs one query and returns 20 orders. The engine then calls `Order.restaurant` once per order, 20 queries, and `Order.items` once per order, 20 more, each returning about 5 items. If items have their own nested fields that also query, the numbers multiply. Counting the restaurant and item lookups, the request performs 1 + 20 + 100 = 121 database queries when items are loaded one by one, where a hand-written REST endpoint would have used 3. This is the **N+1 problem**, one query for the list plus N queries for its children, and it is the most common GraphQL performance bug. ORMs with lazy loading cause the same problem in REST code, as Unit VI shows.

@fig be_gql_n_plus_1 | Naive resolvers issue 121 queries. Batched loading issues 3.

The standard fix is **DataLoader**, a pattern from Facebook released as a library in 2015. Instead of querying immediately, each resolver asks a loader for a key, such as `restaurantLoader.load(9)`. The loader collects every key requested during the current tick of the event loop, removes duplicates, and then issues one batched query, `SELECT * FROM restaurants WHERE id IN (9, 10, 11)`. It hands each resolver its own result. The loader also caches within the request, so restaurant 9 is fetched once even if 12 orders ask for it. Loaders are created per request, never shared, because a shared cache would serve one user's data to another and ignore permissions.

@fig be_gql_dataloader | Keys collected for one tick, deduplicated, fetched in one query.

## 17. Query complexity, depth limits, persisted queries, authorization and caching

GraphQL lets clients write arbitrary queries, and that includes expensive ones. `orders(first: 50) { items(first: 20) { name } }` touches 50 + 50 × 20 = 1,050 nodes. Nest a few more levels, such as each item's restaurant's orders' items, and one small request asks for millions of nodes. GraphQL servers therefore compute a **query cost** before execution, multiplying list sizes down the tree, and reject queries above a budget. They also set a maximum depth, such as 10, and rate-limit clients by total cost per minute rather than by request count, since one request can cost a thousand times another. GitHub's GraphQL API publishes exactly this kind of point-based limit.

@fig be_gql_complexity | One query touching 1,050 nodes. Cost is computed and checked before anything runs.

**Persisted queries** go further. The client app is built with a fixed set of queries. At build time each is registered with the server under its hash. At runtime the client sends only the hash and the variables. The server runs only queries it knows, so attackers cannot send arbitrary expensive or exploratory queries, requests are smaller, and because they can be sent as GET with the hash in the URL, CDNs can cache them.

@fig be_gql_persisted | The server runs only registered queries. Unknown hashes are rejected.

Authorization in GraphQL must happen in resolvers or in the data layer, per object, because one query can reach the same object through many paths. If `Order.customer` checks permissions but `Restaurant.recentOrders.customer` does not, the second path leaks every customer's details. Field-level rules belong in the shared data-loading layer so every path inherits them. Introspection, the query that returns the whole schema, is useful for tools and often disabled in production for public APIs.

Caching is the other cost. REST responses are cacheable by URL. GraphQL sends different queries to one URL with POST, so HTTP caches and CDNs cannot help unless persisted queries turn reads into GETs. Client libraries such as Apollo and Relay cache by object type and id instead, normalising responses into a local store.

:::warn Watch out
GraphQL APIs often return HTTP 200 for every request, with failures inside the `errors` array. Dashboards that count 5xx responses will show a healthy service while half the queries fail. Instrument resolver errors explicitly, and alert on them.
:::

## 18. gRPC and Protocol Buffers

Inside Wren, the orders service calls the payments service hundreds of times per second. Both are owned by Wren, both are written in typed languages, and the calls are on the critical path. JSON over HTTP/1.1 works, but each call pays for text parsing, field names repeated in every message, and hand-written client code that drifts from the server. **gRPC**, released by Google in 2015 as the open version of its internal Stubby system, is RPC designed for this situation.

A gRPC service is defined in a `.proto` file using **Protocol Buffers** (protobuf), Google's schema language and binary format. The file declares services with methods, such as `rpc GetOrder(GetOrderRequest) returns (Order)`, and messages with numbered fields, such as `int64 id = 1; int64 total_paise = 2; string status = 3;`. The `protoc` compiler generates server stubs and typed client libraries for many languages from that one file, so the client and server cannot disagree about field names or types.

@fig be_grpc_proto | The .proto file is the contract. Field numbers, not names, go on the wire.

On the wire, protobuf is compact. Each field is a tag holding the field number and wire type, followed by the value. Integers use varints, which store 7 bits per byte with the high bit meaning "more bytes follow". The field `id = 123` encodes as two bytes, `08 7B`, where `08` is field 1 with varint type and `7B` is 123. In JSON, `{"id":123}` is 10 bytes. The value 300 needs two varint bytes, `AC 02`. Messages are smaller and much faster to parse than JSON, and the cost is that they are unreadable without the schema, so debugging needs tools such as `grpcurl`.

@fig be_grpc_varint | Two bytes for id = 123. The schema is needed to know what field 1 means.

gRPC runs over HTTP/2, which gives it multiplexed streams and four call types. A **unary** call is one request and one response. **Server streaming** returns a stream of messages, such as `WatchOrder` pushing status updates. **Client streaming** sends a stream and gets one answer, such as uploading location points. **Bidirectional streaming** lets both sides send freely, such as a live chat. Every stream has HTTP/2 flow control, so a slow reader slows the sender instead of exhausting memory.

@fig be_grpc_streams | Four call types, all on HTTP/2 streams.

## 19. Deadlines, metadata, interceptors and schema evolution

A gRPC call carries a **deadline**, an absolute time by which the caller needs the answer. Wren's gateway gives the whole request 300 ms. It spends 50 ms, then calls the orders service with a deadline 250 ms away. Orders spends 100 ms and calls payments with 150 ms left. If payments sees that its remaining budget cannot cover its work, it refuses immediately with `DEADLINE_EXCEEDED` rather than doing work whose result nobody will wait for. This **deadline propagation** stops a slow request from consuming resources at every hop after the user has given up, and Unit X builds on it.

@fig be_grpc_deadline | Each hop receives what is left of the original budget, not a fresh timeout.

**Metadata** is gRPC's name for headers, key-value pairs sent with a call, carrying the authorization token, the trace id and the request id. **Interceptors** are gRPC's middleware, functions wrapped around every call on the client or server side, used for authentication, deadline checks, tracing, logging and retries. Retries in interceptors must apply only to idempotent methods, for the reasons in Unit I.

@fig be_grpc_interceptors | Interceptors run around every call, the same idea as HTTP middleware.

Protobuf's numbered fields make **schema evolution** safe if a few rules are followed. Adding a field with a new number is compatible, because old readers skip unknown fields and new readers see a default for missing ones. Renaming a field is safe on the wire, since only numbers travel, but breaks generated code. Changing a field's type or reusing a deleted field's number is dangerous, because old messages are then read as the wrong thing. Mark removed numbers as `reserved` so nobody reuses them. Tools such as `buf breaking` check these rules automatically in CI.

:::note gRPC in browsers
Browsers cannot speak gRPC's HTTP/2 trailers directly, so public browser clients need gRPC-Web through a proxy such as Envoy, or Connect, a compatible protocol that also works over HTTP/1.1 with JSON. That friction is the main reason gRPC is mostly used between services, not from browsers.
:::

## 20. Choosing between REST, GraphQL and gRPC

Each style wins in a different place. REST suits public APIs and anything that benefits from HTTP's ecosystem, such as caching by URL, simple curl debugging, CDN delivery and universal client support. GraphQL suits product APIs with many client screens that need different shapes of the same data, especially mobile apps on slow networks, at the cost of harder caching and the need for cost limits. gRPC suits internal service-to-service calls where performance, strict contracts, generated clients, streaming and deadlines matter, at the cost of browser support and readability.

@fig be_api_choose | Each style is best somewhere. Many companies use all three in different layers.

A common arrangement uses all three. Public partners get REST. The mobile and web apps talk to a GraphQL layer, sometimes called a backend for frontend, that aggregates data. Internally, services call each other with gRPC. The mistake is choosing by fashion, for example putting GraphQL in front of a single simple CRUD service, or forcing gRPC on external partners who just want to call an endpoint from a shell script.

:::story Picture this
Three ways to order at a restaurant. REST is the printed menu with numbered dishes that everyone understands. GraphQL is telling the waiter exactly what you want on one plate, "rice from dish 4, sauce from dish 7, no onions". gRPC is the kitchen's internal ticket system, fast and precise, written in shorthand that only the staff can read.
:::

:::interview Interview lens
**"When would you choose GraphQL over REST, and what problems does it bring?"** When many clients need different shapes of related data, especially mobile apps where round trips are expensive, GraphQL lets each screen fetch exactly what it needs in one request through a typed schema. It brings the N+1 problem, solved with per-request DataLoader batching, unbounded query cost, solved with depth and cost limits or persisted queries, harder HTTP caching, and authorization that must be enforced per object in resolvers or the data layer. For simple CRUD or public APIs, REST is usually simpler.
:::

:::key In one breath
RPC names actions and suits verb-like operations and internal calls, but hides the network and loses HTTP caching. GraphQL exposes a typed schema through one endpoint, where clients choose fields and resolvers fill them, which needs DataLoader to avoid N+1 queries (121 down to 3 for Wren's list), cost and depth limits, persisted queries and per-object authorization. gRPC defines services in Protocol Buffers with numbered fields, compact varint encoding, four streaming types over HTTP/2, deadlines that propagate, metadata and interceptors. REST fits public APIs, GraphQL fits varied client screens, and gRPC fits internal service calls.
:::

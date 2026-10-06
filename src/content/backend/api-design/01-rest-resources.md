@part I | REST resources | We design Wren's URLs and requests around resources, the way most public HTTP APIs are built. A predictable API is cheaper for every client to learn and lets caches, proxies and tools understand it without help. We will cover resource-oriented URLs and nesting, statelessness and representations, the mapping of methods and status codes, and filtering, sorting, search and field selection. | where:1

## 1. Resource-oriented URLs and nested resources

Wren's first API grew one endpoint at a time: `/getOrders`, `/createNewOrder`, `/order_cancel`, `/fetchMenuForRestaurant?rid=9`. Every client developer had to learn each name separately, and nobody could guess the next one. **REST** (Representational State Transfer), described by Roy Fielding in his 2000 PhD thesis, offers a more regular design. The API exposes **resources**, the nouns of the domain such as orders, users and restaurants, each with a URL. The HTTP method supplies the verb. So instead of `/getOrders` and `/createNewOrder`, Wren has one URL, `/orders`, and two methods on it, GET and POST.

The conventions are simple and widely shared. Collections use plural nouns, `/orders`, `/restaurants`. An item is the collection plus its id, `/orders/123`. Related collections can be **nested** under their owner, `/users/42/orders` or `/restaurants/9/menu`, which reads naturally and makes ownership visible in the URL. Use lowercase and hyphens, `/menu-items`, and keep verbs out of paths. An action that does not map onto a method, such as cancelling an order, becomes a resource of its own, `POST /orders/123/cancellation`, which also gives the cancellation an id, a status and a place to store its reason.

@fig be_api_resources | Nouns in the URL, verbs in the method. One URL per thing.

Nesting has limits. A path like `/restaurants/9/menus/3/sections/2/items/17/options/4` forces the server to validate every level and the client to know the whole chain to reach option 4. Most guides recommend nesting at most one level, for ownership, and using top-level URLs for everything with its own identity, such as `/menu-items/17`, where the item itself records which restaurant it belongs to. The ownership check from Unit IV still runs on `/menu-items/17`, since a short URL does not grant access.

@fig be_api_nesting | Deep nesting couples the URL to the data model. Link to items instead of burying them.

Strictly, Fielding's REST also requires hypermedia, where responses carry links that tell the client what it can do next, as in `"links": {"cancel": "/orders/123/cancellation"}`. Most APIs called RESTful skip that part and rely on documentation. That is fine, as long as you know the difference when someone asks.

## 2. Statelessness and representations

REST asks that each request contain everything needed to process it: the credentials, the resource, any paging position and any preferences. The server keeps no conversation state between requests in its own memory. This is the **statelessness** constraint, the same property Unit I described for HTTP itself, and it is what lets Wren run four identical app instances behind a load balancer and send each request to whichever is free.

@fig be_api_stateless | Everything the server needs is in the request or in shared stores. Any instance can answer.

Statelessness does not mean the system has no state. Orders, sessions and carts live in databases and caches that every instance shares. What it forbids is state that lives in one server process between requests, such as "page 3 of your last search" held in memory. Instead, the client sends a cursor that says where it is, as Part II shows. A server restart or a deploy then interrupts nothing.

The "representation" in REST's name is the second idea. A resource is the abstract thing, order 123. What travels over HTTP is a **representation** of it, a JSON document, a CSV row or a PDF receipt, chosen through content negotiation with the Accept header. Separating the two helps. The same order can be offered as JSON to the app and as CSV to a restaurant's accounting export without becoming two resources with two URLs.

@fig be_api_representation | Order 123 is the resource. JSON and CSV are two pictures of it.

:::story Picture this
A library that remembers nothing about you between visits. Each time you come, you bring your card and a slip saying exactly which book and which page you want. It sounds less friendly than a librarian who remembers you, but any librarian at any desk can serve you, and nothing is lost when one goes home.
:::

## 3. Methods and status codes on resources

With resources named, each operation becomes a method on a URL, with a predictable status. `GET /orders` lists orders and returns 200. `POST /orders` creates one and returns 201 with `Location: /orders/124`. `GET /orders/123` reads one, 200 or 404. `PUT /orders/123` replaces it and `PATCH /orders/123` changes part of it, each returning 200 with the new representation or 204 with no body. `DELETE /orders/123` removes it, 204. PUT, PATCH and DELETE on the whole collection are rare and usually dangerous, so most APIs do not offer them.

@fig be_api_verb_map | The standard mapping. A client who knows it can guess most of Wren's API.

Following this mapping lets the rest of the HTTP ecosystem help. Caches know that GET can be cached and POST cannot. Client libraries know that GET, PUT and DELETE can be retried after a timeout and POST cannot, from Unit I's idempotency rules. API gateways can apply rate limits and permissions per method. Monitoring can separate reads from writes without custom configuration.

Two decisions deserve consistency across the whole API. The first is what writes return. Returning the full updated resource after PATCH saves the client a follow-up GET and shows server-computed fields, such as a new total. The second is how errors look, which Part VIII covers. Pick one answer for each and apply it to every endpoint, because a client author learns the pattern once and then trusts it.

## 4. Filtering, sorting, searching and field selection

A restaurant's dashboard needs "today's paid orders, newest first, only the id, total and status". That is four separate jobs, and REST APIs conventionally express all of them in the query string of the collection URL. **Filtering** uses field parameters, `?status=paid&created_after=2026-10-06`. **Sorting** names a field with a direction, `?sort=-created_at`, where the minus means descending. **Searching** uses a free-text parameter, `?q=biryani`, which usually goes to a search engine rather than a SQL LIKE, as Unit XII explains. **Field selection** lets the client ask for less, `?fields=id,total,status`, shrinking responses on slow mobile networks.

@fig be_api_filtering | One query string, four jobs. Every field name in it must be on an allowlist.

Each of these needs care on the server. Every filter and sort field must be on an allowlist, both for security, since a `sort` value pasted into SQL is an injection, and for performance, since sorting 5,000,000 orders by an unindexed column takes a full table scan. In practice the allowed combinations are driven by the indexes the database has. Wren supports sorting orders by `created_at` and `total` within one restaurant, because it has indexes on `(restaurant_id, created_at)` and `(restaurant_id, total)`, and rejects other sort fields with 422.

Filters on ranges and sets need a syntax. Common choices are suffixed names like `created_after` and `total_gte`, or bracket syntax like `total[gte]=1000`. Pick one style for the whole API. Field selection that gets complicated, with nested relations and per-relation fields, is the point at which GraphQL in Part V starts to look attractive.

:::warn Watch out
A list endpoint without a mandatory limit eventually returns 5,000,000 rows to someone. Always paginate collections, with a default page size such as 20 and a maximum such as 100, even when today's collection is small.
:::

:::interview Interview lens
**"Design the URLs for a food-ordering API."** Resources are plural nouns: /restaurants, /restaurants/{id}/menu, /orders, /orders/{id}, /users/{id}. Methods supply verbs, so POST /orders creates with 201 and a Location header, GET /orders/{id} reads, PATCH updates, and an action like cancel becomes POST /orders/{id}/cancellation. Lists accept allowlisted filters, a sort parameter, field selection and cursor pagination with a default and maximum page size. Nesting goes one level deep for ownership, and every request is stateless.
:::

:::key In one breath
REST exposes resources as plural-noun URLs and uses HTTP methods as the verbs, with actions that do not fit becoming sub-resources such as `/orders/123/cancellation`. Every request is stateless, carrying credentials and position, so any instance can serve it, and a resource can have several representations chosen by Accept. The standard method and status mapping lets caches, clients and gateways help. Filtering, sorting, search and field selection live in the query string, restricted to allowlisted, indexed fields, and every collection is paginated.
:::

@part I | Authentication vs authorization | We separate proving who someone is from deciding what they may do, and set the ground rules for every check that follows. Most API breaches happen after a perfectly good login, when the server forgets to ask whether this user may touch this thing. We will cover the distinction, server-side enforcement with default deny and least privilege, and where in the stack each check belongs. | where:1

## 1. Who are you versus what can you do

Asha logs in to Wren with a valid password and a valid second factor. Unit III's machinery did its job, and every request she sends now carries a session that says "user 42". None of that tells the server whether user 42 may read order 790, edit restaurant 9's menu, or refund an order. Those are different questions, and they need a different mechanism.

**Authentication** answers "who are you?" It turns credentials into an identity. **Authorization** answers "what may you do?" It takes an identity, an action and a resource and returns allow or deny. Authentication happens once per session or token. Authorization happens on every request, often several times per request, once for each resource the request touches.

The two fail differently, and the status codes from Unit I reflect it. A failed authentication is 401, which tells the client to get credentials and try again. A failed authorization is 403, or 404 when the server should not reveal that the resource exists, which tells the client that trying again with the same identity will not help.

@fig be_authz_vs_authn | Authentication opens the building once. Authorization decides every room, every time.

The most important fact about authorization is how often it goes wrong. The OWASP API Security Top 10, a list compiled from real incidents, put broken object-level authorization first in both its 2019 and 2023 editions, and broken function-level authorization fifth. In the Optus breach of 2022, around 10 million customer records were exposed through an API endpoint that required no authentication and let callers walk customer ids, and in many other breaches the caller was authenticated and the server simply never checked ownership. Attackers do not need to break your login. They log in as themselves and ask for other people's data.

:::story Picture this
An office building. Showing your ID badge at the front door gets you into the building, which is authentication. Each office door then has its own reader that decides whether your badge opens that particular room, which is authorization. A building that checks badges at the front door and leaves every office unlocked is the most common API design in breach reports.
:::

## 2. Server-side enforcement, default deny and least privilege

Three rules underlie every design in this unit. The first is **server-side enforcement**. Every decision is made and enforced on the server, on every request. Wren's app hides the "Refund" button from customers, which is good interface design and not security at all. The API behind that button is a public URL. Anyone can call `POST /orders/123/refund` with curl, a modified app or a browser's developer tools. If the API does not check the caller's role, the hidden button protects nothing.

@fig be_authz_server_side | The interface reflects the policy. Only the server enforces it.

The second rule is **default deny**. When no rule explicitly allows a request, the answer is no. This matters most when the system changes. A developer adds `GET /admin/exports` on Friday and forgets to attach a permission. Under default allow, that endpoint is open to everyone until someone notices. Under default deny, it returns 403 to everyone until someone grants access, and the bug report is "admins cannot export", which is annoying but safe. Frameworks help by requiring a permission annotation on every route and failing the build or the test suite when one is missing.

@fig be_authz_default_deny | No matching allow rule means 403. New endpoints start closed.

The third rule is **least privilege**. Every user, role, service and API key gets only the permissions its job needs. Wren's support agents can read orders and issue refunds up to a limit. They cannot change menus or read card numbers. The billing job can read orders and cannot write them. Least privilege limits the blast radius when an account is compromised, which, given credential stuffing and phishing, will happen. It also forces the team to write down what each role is for, which is half the work of getting authorization right.

:::warn Watch out
Do not put authorization data the client controls into the decision. A request body with `"role": "admin"`, a query parameter `?is_staff=true`, or a JWT claim the server never issued must all be ignored. Roles come from the server's own records or from a signed token the server issued.
:::

## 3. Where checks live

A request passes several layers, and each layer can see different things. The API gateway sees the token and the URL. It can check that the token is valid and carries the scope `orders:write`, and reject obvious junk before it reaches the app. Route middleware sees the authenticated user and the route. It can check coarse rules such as "only staff may call `/admin/*`". The handler or service layer sees the actual resource after loading it, so only it can check that order 790 belongs to user 42 or that restaurant 9 belongs to Asha's tenant. The database can enforce a last line of defence, such as PostgreSQL row-level security restricting every query to one tenant, which Part VII covers.

@fig be_authz_layers | Coarse checks early, object checks where the object is known, and a database backstop.

The mistake is to put all authorization in one early layer. A gateway can check "this token may call `PATCH /menus/:id`", but it cannot know whether menu 3 belongs to the caller's restaurant, because that requires loading menu 3. Object-level checks must live where the object is loaded. Duplicating cheap checks is fine. Ask "may this role call this endpoint?" at the edge, so bad requests fail fast, and ask "may this user touch this object?" in the service.

Consistency matters more than placement. If every handler implements its own checks in its own style, one of them will forget. Teams that get this right centralise the logic in one function, such as `authorize(user, action, resource)`, call it from every handler, and test it directly. Part IV takes that further with policy engines.

:::interview Interview lens
**"What is the difference between authentication and authorization, and where would you enforce each?"** Authentication establishes who the caller is, from credentials or a token, once per session. Authorization decides whether that identity may perform this action on this resource, on every request. Authenticate at the edge or in middleware. Do coarse authorization, such as role and scope checks, early, and object-level authorization in the service after loading the resource, with database row-level security as a backstop. Everything is enforced server-side with default deny.
:::

:::key In one breath
Authentication turns credentials into an identity once, while authorization decides on every request whether that identity may act on a resource, and failures return 401 and 403 respectively. Most API breaches come from authenticated users reaching objects that are not theirs. Enforce on the server, deny by default and grant least privilege. Do coarse checks at the edge, object checks where the object is loaded, and use the database as a backstop.
:::

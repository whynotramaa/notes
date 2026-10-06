@part III | Resource ownership and IDOR | We look at the single most common real authorization bug in APIs, and the simple discipline that prevents it. An endpoint that trusts an id from the URL without checking who owns it hands every user's data to anyone with an account. We will cover ownership checks in queries, IDOR and BOLA, and broken function-level authorization. | where:3

## 9. Resource ownership checks

Most of Wren's data belongs to someone. An order belongs to the customer who placed it and to the restaurant that cooks it. A saved card belongs to one user. A menu belongs to one restaurant. For every request that names a resource, the server must confirm that the caller has a relationship to that specific resource that permits the action. That is the **ownership check**, and it is the object-level half of authorization from Section 3.

The fragile way to write it loads the resource first and checks afterwards: fetch order 790, then compare `order.user_id` with the caller. Every handler has to remember the second step. One forgotten comparison in one of hundreds of handlers is a breach. The robust way puts the ownership condition into the query itself, as in `SELECT ... FROM orders WHERE id = %s AND user_id = %s`. If order 790 belongs to someone else, the query returns nothing and the handler returns 404, exactly as if the order did not exist. There is no separate step to forget.

@fig be_authz_ownership | Scope the query to the caller. A missing check then becomes impossible, not merely unlikely.

Frameworks make the robust way the default. In an ORM, start every query from the caller's own collection, such as `current_user.orders.get(790)` in Rails or a repository method `orders_for(user).get(790)`, rather than from the global `Order` model. Some teams ban direct global lookups in code review, or with a lint rule, outside a handful of admin services. For data with several owners, such as an order visible to the customer, the restaurant and the assigned courier, the scope becomes a policy function that builds the right WHERE clause for the caller's relationship.

Returning 404 rather than 403 for someone else's object is usually the right choice here. A 403 confirms that order 790 exists, which tells an attacker which ids are worth probing and leaks how many orders Wren has.

## 10. IDOR and BOLA

The bug that the ownership check prevents has two names. Security testers have long called it **IDOR** (insecure direct object reference). The OWASP API Security project calls it **BOLA** (broken object level authorization) and ranks it first. The mechanics are almost embarrassingly simple. Asha requests `GET /users/42/orders/789` and sees her order. She changes 789 to 790 and gets user 43's order, with their address and phone number. She changes the user id too, to `/users/43/orders/790`, and the server answers again, because it checked that she was logged in and never checked that order 790 or user 43 had anything to do with her.

@fig be_idor_attack | The token proves user 42. Nothing checked that order 790 belongs to user 42.

IDOR becomes a mass breach through enumeration. Wren's orders have sequential ids up to 5,000,000. A script requesting 50 orders per second walks through all of them in 5,000,000 / 50 = 100,000 seconds, about 27.8 hours, slow enough to avoid most alarms. The Optus breach in 2022 and the First American Financial exposure of 885 million records in 2019 both followed this pattern of walking predictable identifiers on an endpoint without proper authorization.

Random identifiers, such as UUIDv4 with 122 random bits, make enumeration hopeless, since there are $2^{122}$ possible values. They are a good second layer and do not replace the ownership check. Ids leak constantly, in URLs shared on social media, in emails, in logs, in browser history, and in other API responses that list related objects. An attacker who learns one id from a screenshot still gets the order if the check is missing.

@fig be_idor_enum | Sequential ids make a missing check enumerable in a day. Random ids slow guessing, nothing more.

:::story Picture this
A coat check that hands back any coat whose ticket number you say aloud, without looking at the ticket in your hand. Numbering the tickets randomly makes it harder to guess a good number. It does not fix the attendant, who should check that you hold the ticket.
:::

:::warn Watch out
IDOR hides in places nobody reviews: export endpoints, file downloads such as `/invoices/790.pdf`, GraphQL resolvers that load related objects, websocket subscriptions such as `subscribe(order: 790)`, and batch endpoints that accept a list of ids. Every path that accepts an identifier from the client needs the same ownership check.
:::

## 11. Broken function-level authorization

IDOR is about objects. **Broken function-level authorization** (BFLA) is about actions. Wren's customer routes check ownership carefully. Its admin route `POST /admin/refunds` was written for the support dashboard, sits behind the same authentication middleware, and checks only that the token is valid. Any customer who finds that URL, in the app's JavaScript bundle, in an old API document or by guessing common paths, can issue refunds. OWASP ranks this fifth in its API list.

@fig be_bfla | The admin endpoint authenticated the caller and never asked whether they were an admin.

BFLA also appears without separate admin routes. A `PATCH /users/42` endpoint that lets a user update their profile may accept a `role` or `is_verified` field, so the "function" of promoting a user is reachable through an ordinary endpoint. Part VI covers that variant as mass assignment. Another form is HTTP method confusion, where `GET /orders/790` is checked but `DELETE /orders/790` on the same route is not, because the permission was attached to the GET handler only.

The defences are default deny with a permission declared on every route, separate deployments or networks for internal admin tools so that they are not reachable from the internet at all, and a permission matrix test (Section 14) that calls every endpoint as every role and checks for 403. Discovery is easy for attackers, because mobile apps and single-page apps ship their API paths in their code, so "nobody knows that URL" is never a control.

:::interview Interview lens
**"What is IDOR or BOLA, and how do you prevent it systematically?"** It is an authorization failure where the server accepts an object identifier from the client and returns or modifies that object without checking that the caller may access it. Changing 789 to 790 in a URL returns another user's order. Prevent it by scoping every data access to the caller, for example starting queries from the user's own collection or adding the owner condition to the WHERE clause, so a missing check cannot happen. Add random ids to slow enumeration, return 404 for objects outside the caller's scope, and test every endpoint with a second user's ids.
:::

:::key In one breath
Every request that names a resource must check the caller's relationship to that specific resource, ideally by scoping the query so that other users' objects simply are not found. IDOR, which OWASP calls BOLA and ranks first, is changing an id and getting someone else's data, and sequential ids let it scale to a full breach in about a day. Random ids slow guessing but never replace the check. Broken function-level authorization exposes actions, such as admin routes that authenticate without checking role.
:::

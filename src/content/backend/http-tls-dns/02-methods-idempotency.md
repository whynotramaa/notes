@part II | HTTP methods and idempotency | We learn what each HTTP method promises and which promises let a client retry safely. Networks drop responses, and a client that cannot tell a lost request from a lost reply will either give up too early or do the work twice. We will cover the five everyday methods, the three special ones, the safe and idempotent properties, and how an idempotency key makes a POST retryable. | where:2

## 5. GET, POST, PUT, PATCH and DELETE

Wren's order API needs five operations: read an order, create one, replace one, change one field, and cancel one. HTTP has a verb for each. **GET** reads a representation of a resource and must not change it. **POST** asks the server to process the enclosed data. Most often that means creating a new resource inside a collection, as in `POST /orders`, where the server picks the new id and returns it. **PUT** replaces the resource at the given URL with the enclosed representation, creating it if the client chose the URL. **PATCH** applies a partial change. **DELETE** removes the resource.

@fig be_http_methods | One resource, five verbs. POST targets the collection because the server chooses the new id.

The difference between PUT and PATCH shows up in real bugs. `PUT /orders/123` with the body `{"note":"no onions"}` means "order 123 is now exactly this". Every field you left out, the items, the address, the total, is gone or reset to a default. `PATCH /orders/123` with the same body means "change only the note". Mobile clients that send PUT with partial objects wipe data this way, often because an older app version does not know about a field that a newer server added.

PATCH bodies come in two common formats. **JSON Merge Patch** (RFC 7396) sends the fields to overwrite, and `null` means delete. **JSON Patch** (RFC 6902) sends a list of operations, for example `[{"op":"add","path":"/items/-","value":{"sku":"pie"}}]`, which can also append to arrays and test a value before changing it. The server should say which format it expects through the request Content-Type, `application/merge-patch+json` or `application/json-patch+json`.

POST is the catch-all. Actions that do not fit a resource model, such as `POST /orders/123/refund` or `POST /search` with a large query body, use it. That flexibility is also why POST promises nothing about repeats, as Section 7 shows.

:::warn Watch out
A GET that changes state, such as `GET /orders/123/cancel`, will eventually be triggered by a link preview bot, a browser prefetch or a crawler. Caches and proxies also assume GET is harmless, so they may repeat it or serve it from a cache. Use POST or DELETE for anything that changes data.
:::

## 6. HEAD, OPTIONS and CONNECT

Three methods exist for the machinery around requests rather than for application data. **HEAD** is GET without the body. The server returns the same status and headers, including Content-Length and ETag, and stops there. A client that wants to know whether a 10,000,000-byte menu export changed, or how large it is before downloading, sends HEAD and spends a few hundred bytes instead of ten million. Frameworks usually implement HEAD automatically by running the GET handler and discarding the body, which is correct but wastes the work of building the body.

**OPTIONS** asks what a resource supports. The server answers with an `Allow` header listing methods, such as `Allow: GET, HEAD, PUT, DELETE`. Browsers also send OPTIONS on their own as the CORS preflight described in Unit II, so OPTIONS requests must reach the CORS handler without needing a login.

**CONNECT** asks a proxy to open a raw TCP tunnel to a host and port, as in `CONNECT api.wren.example:443 HTTP/1.1`. When the proxy replies `200`, it stops interpreting HTTP and copies bytes in both directions. A browser behind a corporate proxy reaches Wren this way. The TLS session runs end to end through the tunnel, so the proxy learns the destination host and port and nothing else.

@fig be_http_connect | CONNECT turns a forward proxy into a tunnel. Only the destination host and port are visible to it.

There is one more, TRACE, which echoes the request back for debugging. Servers disable it, because echoing headers once let scripts read cookies they were not supposed to see.

:::note A 405 must say what is allowed
When the route exists but the method is wrong, as in `DELETE /menu`, the correct answer is `405 Method Not Allowed` with an `Allow: GET, HEAD` header. A 404 there would tell the client the menu does not exist, which is false and confuses debugging.
:::

## 7. Safe and idempotent methods

Two properties decide what a client, proxy or library may do with a request without asking you first. A method is **safe** if the client does not request any change to server state. GET, HEAD and OPTIONS are safe. The server can still write an access log or bump a view counter. The client did not ask for those effects and is not responsible for them. Safety is a promise about intent, and crawlers, prefetchers and caches rely on it.

A method is **idempotent** if sending the same request once or ten times leaves the server in the same final state. Every safe method is idempotent, since none of them change anything. PUT and DELETE are idempotent too. POST and PATCH are not, by default.

@fig be_http_safe_idem | Safe implies idempotent, but not the reverse. POST and PATCH carry neither promise by default.

Work through Wren's examples. `PUT /orders/123` with a full order sets the state to that order, and a second copy sets it to the same thing. `DELETE /orders/123` removes the order. A repeat finds nothing to remove, and the state is the same, even though the second call returns 404 instead of 204. Idempotency is about the final state, not about getting identical responses. `POST /orders` is different. Two copies create two orders, 124 and 125, and the customer is charged for two meals.

PATCH depends on its content. "Set the note to X" gives the same result however often it runs, so it is idempotent in practice. "Append item Y to the basket" adds one more item each time, so it is not.

These properties are what let HTTP client libraries retry automatically. Many retry idempotent requests after a connection reset and refuse to retry POST, because they cannot know whether the first attempt took effect.

:::interview Interview lens
**"Is DELETE idempotent if the second call returns 404?"** Yes. Idempotency is defined by the effect on server state, not by the response. After one DELETE or five, order 123 is gone, so the final state is the same. The different status codes only report what each call found. A client can retry a timed-out DELETE without risking extra damage.
:::

## 8. Idempotency and retries

Here is the case that costs real money. The Wren app sends `POST /payments` for 450 rupees. The server charges the card and returns `201 Created`. The phone goes into a lift and loses signal before the response arrives, so the app times out. From the app's side there are two possibilities. Either the request never arrived, or it arrived, succeeded and only the reply was lost. The app cannot tell them apart. If it retries blindly, the customer may pay 900.

@fig be_http_retry_ambiguity | The request succeeded and only the response was lost. Without an identity for the operation, the server cannot tell a retry from a new payment.

The fix gives the operation an identity the client chooses. When the user taps "Pay", the app generates a random **idempotency key**, usually a UUID, and sends it as `Idempotency-Key: 7f3a...` on the first attempt and on every retry of that same tap. The server stores the key together with the outcome, in the same database transaction as the payment record. When a request arrives with a key it has seen, it returns the stored response instead of charging again. If the first attempt is still running, the second gets `409 Conflict` and retries a little later. Stripe made this design popular, and an IETF draft standardises the header name.

@fig be_http_idem_key | The first arrival runs and records its outcome under the key. Every later arrival is a lookup.

Three details make it work. The key must live longer than any client's retry window, and 24 hours is common. The server should also store a fingerprint of the request body, so the same key arriving with a different amount is rejected with `422` instead of silently returning the old result. And the key belongs to one user action, not one HTTP attempt, so the app must generate it before the first try and reuse it. Unit V designs the full storage.

:::story Picture this
You post a cheque with a serial number on it. If the bank receives two cheques with the same serial number, it pays once and files the second as a duplicate. The serial number is not the amount or the payee. It names this one payment, and you chose it before you posted the envelope.
:::

:::key In one breath
GET reads, POST processes or creates, PUT replaces, PATCH changes part, DELETE removes, HEAD is GET without the body, OPTIONS asks what is allowed and CONNECT opens a tunnel. Safe methods request no change, and idempotent methods reach the same final state however many times they run. GET, HEAD, OPTIONS, PUT and DELETE are idempotent, while POST and most PATCHes are not. A lost response makes a retry ambiguous, and a client-chosen idempotency key stored with the outcome turns the retry into a lookup.
:::

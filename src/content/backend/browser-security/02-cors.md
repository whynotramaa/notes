@part II | CORS: simple and preflight requests | We learn how a server grants other origins permission to read its responses. Wren's web app and its API live on different origins, so without CORS the app cannot read a single API response. We will cover why CORS exists, simple requests, preflight requests and the response headers that make up the protocol. | where:2

## 4. Why CORS exists

Wren's web app runs at `https://app.wren.example` and calls the API at `https://api.wren.example`. Those are different origins, so the same-origin policy hides every API response from the app's scripts, and the developer sees "blocked by CORS policy" in the console on the very first call. Wren has two ways out. It could put the API under the app's origin, for example by having the app's server proxy `/api/*` to the API. That works for its own app. But partners such as `https://partner.example` embed a Wren menu widget on their own pages, and their scripts also need to read the API. Wren needs a way to say "these other origins may read my responses".

**CORS** (Cross-Origin Resource Sharing) is that way. When a script makes a cross-origin request, the browser adds an `Origin` header naming the script's origin. The server answers with `Access-Control-Allow-Origin` (ACAO) naming the origin it allows. The browser compares the two, and only on a match does it hand the response to the script. If the header is missing or names a different origin, the script gets a network error and nothing else, not even the status code, so it cannot probe the server.

@fig be_cors_why | The server states who may read. The browser enforces it.

Two facts follow from this design. CORS never blocks anything. It is a controlled relaxation of the SOP, so a server that sends no CORS headers at all is as locked down as it gets. And the server never enforces CORS itself. It only declares a policy, and browsers carry it out. Before CORS was standardised around 2014, sites worked around the SOP with JSONP, hidden iframes and server-side proxies, all of which were either insecure or awkward.

:::story Picture this
A bank teller will read your balance aloud only to you. CORS is a signed note from you, kept at the bank, that says "you may also tell my accountant". The teller checks the visitor's ID against the note before speaking. The note does not stop anyone walking into the bank or making a deposit. It only controls who hears the answer.
:::

## 5. Simple requests

Some cross-origin requests were possible long before CORS, because an HTML form can send them. A form can send GET or POST with a body of type `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`, to any origin. Servers have always had to cope with such requests arriving from anywhere. So CORS does not ask permission before sending them. It treats requests that a form could have sent as **simple requests**. The browser sends a simple request immediately with an Origin header, and it checks ACAO only when the response comes back.

@fig be_cors_simple | The request reaches the server and runs. The browser only decides whether the script sees the answer.

The precise rule has three conditions. The method must be GET, HEAD or POST. Every header the script set must be on the CORS safelist, which includes Accept, Accept-Language, Content-Language and a restricted Content-Type, with value limits of 128 bytes. And the Content-Type, if any, must be one of the three form types. A request that meets all three skips the preflight.

The important consequence is that a simple POST runs on the server before the browser decides anything. If Wren answers without a matching ACAO, the browser hides the response from the script, but the order was still placed and the email was still changed. CORS is not a write protection, and treating "CORS blocked it" as "the server rejected it" is a common misreading of the console error.

:::warn Watch out
A request with `Content-Type: text/plain` whose body happens to contain JSON is still a simple request. If your API parses JSON whatever the Content-Type says, a cross-site form can send it a JSON body with no preflight. Reject bodies on JSON endpoints unless Content-Type is exactly `application/json`.
:::

## 6. Preflight requests

Anything a form could not send gets a **preflight**, a permission request sent before the real one. Suppose the app wants to send `PUT /orders/123` with a JSON body. Before sending it, the browser sends `OPTIONS /orders/123` with `Origin: https://app.wren.example`, `Access-Control-Request-Method: PUT` and `Access-Control-Request-Headers: content-type`. The preflight carries no cookies and no body. The server answers with the origins, methods and headers it allows. Only if that answer covers the planned request does the browser send the real PUT. If not, the PUT never leaves the browser, and the server never sees it.

@fig be_cors_preflight | The preflight asks first. A refusal means the real request is never sent.

Three questions decide whether a request needs a preflight. Is the method GET, HEAD or POST? Are all the headers safelisted? Is the Content-Type one of the three form types? A single "no" triggers one. In practice almost every call from a modern single-page app is preflighted, because `Content-Type: application/json` and `Authorization` are not on the safelist, and most APIs use PUT, PATCH and DELETE.

@fig be_cors_simple_vs_preflight | JSON bodies, custom headers and methods such as PUT and DELETE all trigger a preflight.

Preflights cost a round trip each. At Wren's 40 ms round trip, an uncached preflight doubles the latency of a small API call. Part III shows how to cache them, and why the cache helps less than people expect.

:::note Preflights are not authenticated
The preflight carries no cookies and no Authorization header, so the OPTIONS handler must answer without a logged-in user. Authentication middleware that rejects OPTIONS with 401 breaks every preflight, and the developer sees a CORS error that is really an auth error. Route OPTIONS to the CORS handler before authentication runs.
:::

## 7. CORS response headers

The server's side of the protocol is six response headers. `Access-Control-Allow-Origin` names the single origin allowed to read, or `*` for any origin. On preflight responses, `Access-Control-Allow-Methods` lists the allowed methods, such as `GET, PUT, DELETE`, and `Access-Control-Allow-Headers` lists the allowed request headers, such as `content-type, x-request-id`. `Access-Control-Allow-Credentials: true` allows the browser to send cookies and to expose the response that came back with them.

`Access-Control-Expose-Headers` lists the response headers a script may read beyond the few safelisted ones, which are Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified and Pragma. If Wren wants the app to log `X-Request-Id` or read a pagination `Link` header, it must expose them. Otherwise `response.headers.get("x-request-id")` returns null even though the header is visible in the network tab, which wastes many afternoons. `Access-Control-Max-Age` says how many seconds the browser may cache this preflight answer.

@fig be_cors_headers | Wren's preflight response. Each header unlocks one specific thing.

ACAO accepts exactly one value. A header like `Access-Control-Allow-Origin: https://app.wren.example, https://partner.example` is invalid, and browsers reject it. Supporting several origins means choosing one per request, which Part III covers. ACAO must also appear on the real response, not only on the preflight. Forgetting it on error responses, such as a 500 from an exception handler that bypasses the CORS middleware, makes the browser report a CORS error instead of the real failure.

:::interview Interview lens
**"Why does CORS exist, and who enforces it?"** CORS lets a server opt in to having its responses read by scripts from other origins, which the same-origin policy otherwise forbids. The browser enforces it. It sends Origin, checks Access-Control-Allow-Origin on the response, and sends a preflight for requests a plain form could not have sent. The server only declares policy. Non-browser clients ignore CORS completely, which is why it is never an access control mechanism.
:::

:::key In one breath
CORS lets a server allow named origins to read its responses, and the browser enforces the check. Requests a form could send, meaning GET, HEAD or POST with safelisted headers and form content types, go out straight away and are only checked on the way back. Everything else gets an uncredentialed OPTIONS preflight that must approve the method and headers first. The response headers are Allow-Origin, Allow-Methods, Allow-Headers, Allow-Credentials, Expose-Headers and Max-Age, and Allow-Origin holds exactly one origin or a wildcard.
:::

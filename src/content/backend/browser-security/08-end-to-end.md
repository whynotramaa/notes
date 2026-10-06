@part VIII | The browser boundary end to end | We combine origins, CORS, cookies and CSRF checks into one traced request and one configuration. Real incidents come from the interactions between these mechanisms, not from any one of them alone. We will trace a credentialed cross-origin update, write Wren's complete configuration, and map each defence to the attack it stops. | where:8

## 28. A credentialed cross-origin update, traced

User 42 edits order 123 in the app at `https://app.wren.example`, changing the delivery note. The app calls `fetch("https://api.wren.example/orders/123", {method: "PATCH", credentials: "include", headers: {"Content-Type": "application/json", "X-CSRF-Token": token}, body: ...})`. The method is PATCH, the content type is JSON and there is a custom header, so the browser needs a preflight. Unless one is cached for this URL, it sends `OPTIONS /orders/123` first, with `Origin: https://app.wren.example`, `Access-Control-Request-Method: PATCH` and `Access-Control-Request-Headers: content-type, x-csrf-token`. No cookie goes with it.

The API's CORS middleware runs before authentication. It looks up the app origin in its allowlist, finds it, and answers 204 with `Access-Control-Allow-Origin: https://app.wren.example`, `Access-Control-Allow-Credentials: true`, the allowed methods and headers, `Access-Control-Max-Age: 600` and `Vary: Origin`. The browser caches that answer and sends the real PATCH. This time it carries the `__Host-sid` session cookie, because the API host set it and the request is same-site, plus the CSRF token header and the Origin.

Now the API runs its checks in order. Is the session cookie present, known and unexpired? Is the Origin in the allowlist? Does the CSRF token match the one bound to this session? Does order 123 belong to user 42, and is it still editable? Each failure has its own status: 401 for the session, 403 for the origin or token, 404 or 403 for the ownership check, 409 if the order was already dispatched. All pass, so the API writes the change and returns 200, again with the CORS headers. The browser compares ACAO with the app's origin and releases the body to the app's code, which updates the screen.

@fig be_browser_trace | Two HTTP requests, five checks. The preflight carries no cookie, and the real request carries every proof.

:::story Picture this
An embassy visit. First you phone ahead to ask whether you may bring a certain document, and the embassy tells you which documents it accepts (the preflight). Then you arrive in person with your passport (the cookie), a printed appointment code (the CSRF token) and a visitor badge from the right office (the Origin). The clerk still checks that the file you are asking about is yours before stamping it (authorization).
:::

## 29. Wren's configuration on one card

Every decision in this unit ends up as a header or a middleware rule, and it helps to see them together. The session cookie is `__Host-sid`, an opaque 128-bit random value with Secure, HttpOnly, SameSite=Lax, Path=/ and Max-Age=1800. A separate `__Host-csrf` cookie holds a signed token with SameSite=Strict and no HttpOnly, so the app's script can copy it into the header. CORS allows exactly `https://app.wren.example` with credentials and `https://partner.example` without them. It sets `Vary: Origin` on every response and caches preflights for 600 seconds.

Unsafe methods require an allowed Origin and a matching token. A Fetch Metadata gate in front of everything rejects cross-site requests that are not top-level navigations. HSTS with includeSubDomains keeps every host on HTTPS, so that the Secure flag protects something. Nothing on this card is exotic, and every major web framework has a setting or a small library for each line.

@fig be_browser_config | Eight lines of configuration. Each traces back to a section of this unit.

Configuration like this drifts over time. Someone adds a new endpoint outside the shared middleware chain. A debugging flag that reflects origins gets left on in production. A new marketing subdomain sets a parent-domain cookie with the same name. Each of these quietly undoes part of the card. The defences that survive are the ones applied to every route by default, with an explicit and reviewed exception list, and tested in CI with attacker origins and missing tokens.

:::warn Watch out
Exception handlers and framework error pages often bypass the middleware that adds CORS headers. The browser then reports every server error as a CORS error, and developers "fix" it by loosening CORS. Make sure CORS headers are added to error responses too, in the outermost layer.
:::

## 30. Which defence stops which attack

Each mechanism answers one question, and confusing them is the root of most browser security bugs. The same-origin policy stops cross-site reads by default. CORS selectively re-opens reads for named origins, and it never blocks anything the SOP allowed. SameSite stops cookies from travelling with most cross-site requests, which defeats both cross-site reads of private data and most CSRF. CSRF tokens and Origin checks stop forged writes that slip through SameSite's gaps. HttpOnly stops injected scripts from taking the session id away, but not from using it while the page is open.

@fig be_browser_defences | One row per attack, one column per defence. The last row is out of scope for all of them.

None of these defend against an attacker who already holds a stolen cookie and sends it from their own machine with curl. The browser plays no part in that request, so none of its rules apply. That case needs server-side session controls: short expiry, rotation at login, binding sessions to device signals, and revocation, which open Unit III.

This unit also did not cover cross-site scripting itself, the bug that turns your own origin into the attacker's origin and makes every defence here irrelevant, since the attacker's script then runs as you. Unit XIII covers XSS and output encoding with the rest of the attack surface.

:::interview Interview lens
**"Walk me through how a single-page app on one subdomain safely calls an API on another with cookies."** The API sets a host-only `__Host-` session cookie with Secure, HttpOnly and SameSite=Lax. CORS allows exactly the app origin with credentials and Vary: Origin, and answers preflights before authentication. Unsafe requests must carry an allowed Origin and a CSRF token, ideally behind a Fetch Metadata gate. The API then authenticates the session and authorises the specific resource, because none of the browser rules prove the user may touch order 123.
:::

:::key In one breath
A credentialed cross-origin PATCH costs a cookieless preflight plus the real request, and the server checks session, Origin, CSRF token and ownership. Wren's whole policy fits on one card of cookie attributes, an exact CORS allowlist with Vary: Origin, Origin and token checks, a Fetch Metadata gate and HSTS. The SOP blocks reads, CORS re-opens them for named origins, SameSite keeps cookies at home, tokens and Origin checks stop forged writes, and HttpOnly stops theft by script. Stolen cookies used from elsewhere need server-side session controls, which Unit III covers.
:::

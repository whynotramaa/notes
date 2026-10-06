@part III | CORS credentials and caching | We cover the CORS settings that decide whether cookies travel and how often the browser asks. Credentialed CORS is where real data leaks happen, and wrong caching makes correct configurations fail at random. We will go through the credentials rules, choosing an origin from an allowlist, Vary: Origin, preflight caching and the null origin. | where:3

## 8. Credentials and the wildcard

By default a cross-origin `fetch` sends no cookies, and the response it gets is anonymous. Wren's app needs the user's session, so it opts in with `fetch(url, {credentials: "include"})`. The server must also opt in. It returns `Access-Control-Allow-Credentials: true`, and its `Access-Control-Allow-Origin` must name the exact requesting origin. If the server answers a credentialed request with `Access-Control-Allow-Origin: *`, the browser refuses to expose the response. The same rule bans wildcards in Allow-Headers, Allow-Methods and Expose-Headers whenever credentials are involved. In those headers `*` loses its special meaning and is read as a literal header name.

@fig be_cors_credentials | Credentials plus the wildcard is refused. The server must name the origin it trusts.

The rule exists because a credentialed response is personal. `GET /me` with user 42's cookie returns their email, phone and saved address. If `*` worked with credentials, every website user 42 visited could quietly fetch that data. Forcing the server to name one origin makes whoever configures it decide whom they trust with logged-in data. A public, uncredentialed endpoint, such as Wren's menu, can safely use `*`, because it returns the same thing to everyone.

There is a second check on the browser side that people forget. Third-party cookie blocking applies here too. If the app and API were on different sites, Safari and Firefox would refuse to send the API's cookies on the app's fetch at all, whatever the CORS headers say. Wren avoids that by keeping both under `wren.example`, so the request is cross-origin but same-site.

:::note What counts as credentials
In the Fetch standard, credentials means cookies, TLS client certificates and HTTP authentication entries the browser holds. A bearer token that the script itself puts in an Authorization header is not a credential in this sense. It needs a preflight, because Authorization is not safelisted, but it works with `credentials: "omit"` and with a wildcard ACAO.
:::

## 9. Origin allowlists and Vary: Origin

Wren has to allow two origins, its own app and the partner widget, but ACAO holds only one value. So the server reads the request's Origin header, compares it with an allowlist and, if it matches, echoes it back in ACAO. This **dynamic origin reflection** is safe only with an exact match against a fixed set of strings. Parse the Origin, compare the whole string, and send no CORS headers at all for anything that does not match. Sending a fixed "default" origin to strangers is harmless but confusing, while sending nothing makes the browser's error message say plainly that the origin was not allowed.

@fig be_cors_allowlist | A set lookup on the full origin string. Anything not in the set gets no CORS headers.

A dynamic ACAO creates a caching hazard. Suppose a CDN caches `/menu` right after a request from the partner, so the stored response carries `ACAO: https://partner.example`. The next request comes from the app, and the CDN serves the stored copy. The app's browser sees the partner's origin in ACAO and blocks the response. Users of the app see a broken menu, but only sometimes, depending on who filled the cache last, which makes the bug look random.

The fix is `Vary: Origin` on every response whose CORS headers depend on the request's Origin. That includes responses to disallowed origins that carry no CORS headers, because otherwise a cached "no headers" copy gets served to an allowed origin. Browsers have their own HTTP cache, and the same bug happens there without a CDN involved.

@fig be_cors_vary | One cached answer, two origins. Vary: Origin keeps one entry per origin.

:::warn Watch out
Forgetting `Vary: Origin` causes intermittent CORS failures that are hard to reproduce. Engineers often "fix" them by switching to reflecting any origin, which turns a caching bug into a security hole. Fix the Vary header instead.
:::

## 10. Preflight caching and the null origin

Each preflight costs a round trip before the real request. Wren's app makes 120 PUT requests to the same URL during a 10-minute editing session. Without preflight caching that is 240 HTTP requests, half of them OPTIONS. With `Access-Control-Max-Age: 600`, the browser keeps the first preflight answer for 10 minutes, and the session needs 121 requests.

Browsers cap the value. Chromium allows at most 7,200 seconds, and Firefox 86,400. A larger value is silently clipped. The cache is also keyed by origin, URL and request shape. If the 120 PUTs go to 120 different order URLs, such as `/orders/1` to `/orders/120`, each needs its own preflight, and caching saves nothing. APIs with ids in their paths pay the preflight on almost every write. Some teams avoid it by serving the API under the app's origin through a reverse proxy, which makes the requests same-origin and removes CORS entirely.

@fig be_cors_maxage | One preflight instead of 120. The cache is per URL, so ids in paths reduce its value.

Some requests carry `Origin: null`. Sandboxed iframes, pages opened from `file://`, `data:` URLs and some cross-origin redirects all produce it. A developer testing from a local HTML file sees `null` in the logs, adds it to the allowlist so the test works, and ships it. That is dangerous, because an attacker can produce a null origin on purpose. A sandboxed iframe on `evil.example` sends `Origin: null`, so allowing null with credentials lets any website read user data.

@fig be_cors_null | Four unrelated sources of the same null value. It identifies nothing.

:::interview Interview lens
**"Our API needs to allow three front-end origins with cookies. How do you configure CORS?"** Keep the three origins in a set, read the request's Origin and, on an exact match, echo it in Access-Control-Allow-Origin with Allow-Credentials true. Send no CORS headers otherwise, and set Vary: Origin on all these responses so caches do not mix them. Answer preflights before authentication runs, with an explicit list of methods and headers and a Max-Age. Never reflect arbitrary origins, never use regex prefix or suffix checks, and never allow null.
:::

:::key In one breath
Credentialed CORS needs `credentials: "include"` on the client, Allow-Credentials true on the server and an exact origin, never a wildcard. Several allowed origins mean echoing the request's Origin after an exact allowlist match, and every response that depends on Origin needs Vary: Origin, including refusals. Max-Age caches preflights per URL and request shape, up to 7,200 seconds in Chromium. The null origin comes from sandboxes, files and redirects, can be produced on purpose, and must never be trusted.
:::

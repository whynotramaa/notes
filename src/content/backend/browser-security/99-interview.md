@chapter faq | Interview question bank | Questions follow the order of the unit. Say each answer aloud before reading the model.

### Origins and the same-origin policy

**Q1. What is an origin?**

The scheme, host and port of a URL, such as `https://app.wren.example:443`. The path and query are not part of it. Two URLs are same-origin only if all three parts match exactly.

**Q2. What is the difference between an origin and a site?**

A site is the scheme plus the registrable domain, such as `https://wren.example`. All subdomains of `wren.example` share a site but have different origins. Cookies' SameSite uses sites, while CORS and the SOP use origins.

**Q3. What does the same-origin policy block?**

Scripts reading cross-origin responses, including bodies, most headers and DOM content of cross-origin frames. It allows cross-origin writes such as form posts and embeds such as images and scripts. It is not a firewall for requests.

**Q4. What headers tell a server where a browser request came from?**

Origin carries the initiating origin on CORS and unsafe requests, Referer carries the referring URL subject to policy, and Sec-Fetch-Site, Mode and Dest describe the relationship and purpose. Page scripts cannot set any of them. Non-browser clients can set all of them.

**Q5. Why can't you use the Origin header as authentication?**

Only browsers guarantee it, and only against other web pages. Any curl command or server can send any Origin value. Authentication must rest on a credential the attacker does not have.

### CORS

**Q6. Why does CORS exist?**

To let a server allow specific other origins to read its responses, which the same-origin policy forbids by default. Without it, an app on one origin could not read an API on another. It relaxes the SOP, it never tightens it.

**Q7. Who enforces CORS?**

The browser. The server only declares its policy in response headers, and the browser decides whether to hand the response to the script. A server that ignores CORS is not more permissive to curl, because curl never checked it.

**Q8. What makes a request "simple"?**

It uses GET, HEAD or POST, only safelisted headers, and a Content-Type of form-urlencoded, multipart or text/plain. These are requests an HTML form could already send. They go out immediately and are checked on the way back.

**Q9. What is a preflight request?**

An OPTIONS request the browser sends before a non-simple request, carrying the intended method and headers but no cookies or body. The server answers which methods, headers and origins it allows. If it refuses, the real request is never sent.

**Q10. Why must the OPTIONS handler run before authentication?**

Preflights carry no cookies or Authorization header, so they always look anonymous. If authentication middleware rejects them with 401, every non-simple cross-origin request fails. Answer preflights in CORS middleware first.

**Q11. What does Access-Control-Expose-Headers do?**

It lists response headers a script may read beyond the safelisted ones such as Content-Type. Without it, the app cannot read headers like X-Request-Id or a pagination Link. It does not affect what the server sends.

**Q12. Can Access-Control-Allow-Origin list several origins?**

No. It takes exactly one origin or `*`. To support several, the server checks the request Origin against an allowlist and echoes the match, with Vary: Origin.

### CORS credentials and caching

**Q13. Why can't you use `*` with credentials?**

A credentialed response contains the user's private data. If any origin could read it, every website the user visited could steal it. Browsers therefore require an explicit origin when Allow-Credentials is true.

**Q14. Why is Vary: Origin needed?**

When the CORS headers depend on the request Origin, a shared cache must keep separate copies per origin. Otherwise one origin's answer is served to another, and the browser blocks it or, worse, exposes data under a wrong policy. It belongs on responses for disallowed origins too.

**Q15. How does Access-Control-Max-Age help, and what limits it?**

It lets the browser reuse a preflight answer for that many seconds, removing an extra round trip per request. Browsers cap it, Chromium at 7,200 seconds. The cache is per origin, URL and request shape, so many distinct URLs still trigger many preflights.

**Q16. When does a browser send Origin: null, and should you allow it?**

From sandboxed iframes, file and data URLs, and some cross-origin redirects. An attacker can produce it deliberately with a sandboxed iframe. Never allow it, especially with credentials.

### CORS vulnerabilities

**Q17. What happens if a server reflects any Origin with credentials?**

Any website can read any logged-in user's API responses through the user's own browser. The attacker's script fetches with credentials included, the browser attaches the cookie, and the reflected origin passes the check. It is one of the most common real CORS bugs.

**Q18. What is wrong with `origin.endswith("example.com")`?**

It accepts `evilexample.com`, which anyone can register. Prefix checks fail the same way with `example.com.evil.net`, and unescaped regex dots accept any character. Compare full origins for equality against a fixed list.

**Q19. Why is trusting all subdomains risky?**

Every subdomain's weakest page becomes trusted. An XSS bug on an old blog, or a dangling CNAME an attacker takes over, gives them a trusted origin. Allow exact origins you control and audit.

**Q20. Why is CORS not authentication?**

It only constrains browsers, and only reads. Non-browser clients ignore it completely. Every endpoint must authenticate requests itself.

**Q21. Why is CORS not CSRF protection?**

Simple requests such as form posts are sent and executed regardless of CORS policy. The attacker in CSRF does not need to read the response. CORS only hides the response afterwards.

### Cookies

**Q22. What is the difference between Set-Cookie and Cookie?**

Set-Cookie is a response header that stores a cookie with attributes in the browser. Cookie is a request header in which the browser sends back matching cookies as name=value pairs only. The attributes never travel back to the server.

**Q23. What does the Domain attribute do?**

Without it, the cookie is host-only and goes to exactly the host that set it. With it, the cookie goes to that domain and every subdomain. Setting Domain widens exposure, so omit it for session cookies.

**Q24. Is Path a security boundary?**

No. Pages on the same origin can read each other's cookies through frames regardless of Path. It only organises which requests carry the cookie.

**Q25. What is the difference between a session cookie and a persistent cookie?**

A session cookie has no Expires or Max-Age and lasts until the browser session ends. A persistent cookie lasts until its expiry. Neither replaces a server-side session expiry.

**Q26. What do Secure and HttpOnly do?**

Secure sends the cookie only over HTTPS, so network attackers cannot capture it. HttpOnly hides it from JavaScript, so XSS cannot read and exfiltrate it. HttpOnly does not stop XSS from making requests that carry the cookie.

**Q27. What do the `__Host-` and `__Secure-` prefixes enforce?**

`__Secure-` requires the Secure attribute and an HTTPS origin. `__Host-` also requires Path=/ and no Domain, making the cookie host-only. That stops sibling subdomains from setting or overwriting it.

### SameSite and third-party cookies

**Q28. What is a third-party cookie?**

A cookie sent to a site other than the one in the address bar, typically by an embedded iframe, image or script. It lets an embed track a user across sites. Safari and Firefox block them by default.

**Q29. Compare SameSite Strict, Lax and None.**

Strict sends the cookie only on same-site requests. Lax also sends it on top-level navigations with safe methods, such as link clicks. None sends it on all requests and requires Secure.

**Q30. What changed when browsers made Lax the default?**

Cookies without a SameSite attribute stopped riding on cross-site POSTs, iframes and fetches. That blocked classic form-POST CSRF on most of the web without any site changes. Sites needing cross-site cookies had to opt in with None; Secure.

**Q31. Where does SameSite=Lax still allow CSRF?**

State-changing GETs triggered by top-level navigation, requests from same-site subdomains, browsers that ignore the attribute, and historically Chrome's two-minute Lax-plus-POST window. It needs a second layer such as Origin checks or tokens.

### CSRF

**Q32. What is CSRF?**

An attack in which another site makes the victim's browser send an authenticated, state-changing request to the target. The browser attaches cookies automatically, so the server sees a valid session. The attacker does not need to read the response.

**Q33. What conditions does CSRF need?**

Ambient credentials such as cookies, a state-changing request the attacker can fully predict, and a way to send it cross-site without a preflight. Every defence removes one of these. SameSite removes the first, tokens the second, and strict content-type checks force preflights to remove the third.

**Q34. How does the synchronizer token pattern work?**

The server stores a random token in the session and embeds it in pages or provides it to the app. Every unsafe request must send it back in a field or header, and the server compares. A cross-site attacker cannot read the token through the SOP.

**Q35. How does the double-submit cookie pattern work?**

The server sets a random value in a cookie, and the client copies it into a header. The server checks the two match. The signed variant binds the value to the session with an HMAC so a sibling subdomain cannot plant a matching pair.

**Q36. How does Origin verification prevent CSRF?**

On unsafe methods, the server rejects any request whose Origin, or Referer when Origin is absent, is not in an exact allowlist. Browsers set these headers truthfully and page scripts cannot change them. It needs no storage or client changes.

**Q37. What is a Fetch Metadata resource isolation policy?**

Middleware that reads Sec-Fetch-Site and related headers and rejects cross-site requests other than top-level navigations. It blocks CSRF and cross-site leaks in one rule. Requests without the header fall through to other checks.

**Q38. Why doesn't JWT authentication automatically eliminate CSRF?**

CSRF depends on the browser attaching the credential, not on its format. A JWT in a cookie is attached to forged requests and validates fine. Only a token sent by script in an Authorization header avoids CSRF, at the cost of exposure to XSS.

**Q39. Is it safe to skip CSRF checks for JSON APIs?**

Only if the server strictly requires `Content-Type: application/json`, which forces a preflight that cross-site pages cannot pass. Many frameworks parse JSON-looking bodies sent as text/plain. When in doubt, check the token or Origin on all unsafe methods.

### End to end

**Q40. How many HTTP requests does a credentialed cross-origin PUT need?**

Two the first time, an uncredentialed OPTIONS preflight and the real PUT. After that, the preflight answer is cached for Max-Age seconds per URL and request shape. The real request carries the cookie and any CSRF header.

**Q41. Walk through the server checks on a cookie-authenticated cross-origin PUT.**

CORS middleware answers the preflight and later adds response headers. Then the server validates the session cookie and its expiry, checks the Origin against the allowlist, checks the CSRF token, and authorises the specific resource. Only then does it perform the write.

**Q42. Which attacks does none of this stop?**

A stolen cookie or token used directly from an attacker's machine, since the browser plays no part. XSS on a trusted origin, which runs with the user's privileges. Those need server-side session controls and output encoding.

**Q43. What would you check first in a CORS security review?**

Whether any code reflects the Origin header, how the allowlist is matched, whether credentials are allowed and for which origins, whether null or wildcard subdomains are trusted, and whether Vary: Origin is set. Then test with attacker origins rather than reading the code alone.

@chapter exercises | Exercises | One dot is quick reasoning or arithmetic, two dots need a trace or explanation, three dots need a proof, code or a design.

### Origins and CORS

**E1** ● For each URL, say whether it is same-origin and same-site with `https://app.wren.example`: `https://app.wren.example:443/x`, `http://app.wren.example`, `https://api.wren.example`, `https://app.wren.example.evil.com`, `https://wren.example`.

**E2** ● Does each request need a preflight? `GET` with `Accept: application/json`; `POST` with `Content-Type: application/json`; `POST` with a form body; `DELETE`; `GET` with an `Authorization` header.

**E3** ● Wren's app makes 120 PUTs in 10 minutes to the same URL. How many HTTP requests are sent with no preflight caching, and with Max-Age 600?

**E4** ● The same 120 PUTs go to 120 different order URLs. How many HTTP requests are sent with Max-Age 600, and why?

**E5** ● A server sets Max-Age 86,400. How many preflights per day does a Chromium user active for 8 hours on one URL shape trigger?

**E6** ●● A CDN caches `/menu` with dynamic ACAO and no Vary header. The partner requests first, then the app. Trace what each browser sees.

**E7** ●● For each check, give one attacker origin that passes it: `endswith("wren.example")`, `startswith("https://app.wren.example")`, regex `https://app.wren.example` unanchored, and `"wren" in origin`.

**E8** ●● Explain, without HTTP jargon, to a front-end engineer why reflecting any origin with credentials "to fix CORS errors" lets other sites steal user data.

### Cookies and SameSite

**E9** ● Wren's session id is 128 random bits. How many characters is it in hex, and in unpadded base64url?

**E10** ● An attacker can test 10^9 session ids per second for a year against 1,000,000 active sessions. What is the expected number of hits with 128-bit ids?

**E11** ● A request carries `__Host-sid` with a 22-character value and `__Host-csrf` with a 22-character value, a dot and a 43-character signature. How many bytes is the line `Cookie: __Host-sid=...; __Host-csrf=...`, and how many bytes per second is that at 2,000 requests per second?

**E12** ●● For each cookie, list the hosts that receive it: host-only set by `api.wren.example`; `Domain=wren.example` set by `app.wren.example`; `__Host-x` set by `api.wren.example` with `Domain=wren.example`.

**E13** ●● With SameSite=Lax, which of these from `evil.example` carry Wren's cookie: a link click to `/menu`, an auto-submitted form POST, an `<img>` of `/avatar`, a `fetch` with credentials, and a `window.location` redirect to `/orders/7/cancel`?

**E14** ●● Explain without jargon why SameSite does nothing against an attacker who controls `blog.wren.example`.

### CSRF

**E15** ●● Write the hidden form an attacker would use against a Wren endpoint `POST /account/email` that accepts form-encoded bodies, and list the three conditions it relies on.

**E16** ●● A Wren endpoint accepts JSON but parses bodies regardless of Content-Type. Show how a cross-site form can still deliver a JSON-shaped body, and give two fixes.

**E17** ●● Explain why unsigned double-submit cookies fail when a sibling subdomain is compromised, and how signing and the `__Host-` prefix each fix it.

**E18** ●● Decide whether each request passes Wren's Fetch Metadata policy: same-origin POST; cross-site top-level GET navigation; cross-site POST navigation; cross-site no-cors image request; request with no Sec-Fetch headers.

**E19** ●● Explain without jargon why storing a JWT in localStorage removes CSRF but creates another risk.

**E20** ● A synchronizer token is 128 bits. What is the chance an attacker guesses it in one try, written as a power of two?

### Proofs, code and design

**E21** ●●● Prove that an exact-match allowlist check never accepts an origin outside the list, and show why any suffix match on host names cannot have this property for a domain others can register under.

**E22** ●●● Prove that the synchronizer token defeats a cross-site attacker under the same-origin policy, stating exactly which assumptions the proof needs.

**E23** ●●● Write Python middleware that implements Wren's CORS policy, two origins with credentials only for the app, preflight handling before authentication, Vary: Origin, and Max-Age 600.

**E24** ●●● Write Python middleware that enforces CSRF protection on unsafe methods with an Origin allowlist, a Referer fallback and a signed double-submit token.

**E25** ●●● Design the cookie, CORS and CSRF configuration for a new `checkout.wren.example` that is embedded as an iframe on partner sites. Say what must change and what risk you accept.

**E26** ●●● A security reviewer finds `Access-Control-Allow-Origin` echoed from the request with credentials on `/me`. Plan the incident response, covering fix, scope of exposure, detection in logs and prevention.

@chapter solutions | Worked solutions | Every number was computed from the stated inputs.

**E1.** `https://app.wren.example:443/x` is same-origin and same-site, since 443 is the default port. `http://app.wren.example` is neither, because the scheme differs and sites include the scheme. `https://api.wren.example` is a different origin but the same site. `https://app.wren.example.evil.com` is neither, since its registrable domain is `evil.com`. `https://wren.example` is a different origin, same site.

**E2.** GET with Accept is simple, no preflight. POST with application/json needs one. POST with a form body is simple. DELETE needs one. GET with Authorization needs one, because Authorization is not safelisted.

**E3.** Without caching each PUT has its own preflight, 120 + 120 = 240 requests. With Max-Age 600, one preflight covers the whole 10 minutes, 1 + 120 = 121 requests.

**E4.** The preflight cache is keyed by URL, so each new order URL needs its own preflight: 120 + 120 = 240 requests. Moving the id out of the path, for example into the body of a POST to one URL, or making the request simple, avoids that, but changing API design to dodge preflights is rarely worth it.

**E5.** Chromium caps Max-Age at 7,200 seconds. Eight hours is 28,800 seconds, so 28,800 / 7,200 = 4 preflights.

**E6.** The partner's request reaches the origin, which answers `ACAO: https://partner.example`, and the CDN stores it under `/menu`. The partner's browser sees a matching origin and exposes the body. The app's request is served from cache with the partner's ACAO. The app's browser compares `https://app.wren.example` with `https://partner.example`, finds no match and blocks the response, so the app sees a CORS error. Adding `Vary: Origin` gives each origin its own entry.

**E7.** `endswith("wren.example")` passes `https://evilwren.example`. `startswith("https://app.wren.example")` passes `https://app.wren.example.evil.com`. The unanchored regex passes `https://appXwren.example` and `https://app.wren.example.evil.com`. `"wren" in origin` passes `https://wren-giveaway.example`.

**E8.** The browser holds Wren's login cookie and sends it with any request to Wren, no matter which website's script asked. The one thing stopping other sites from reading the answers is the browser asking Wren "may this site read this?" Reflecting the origin makes Wren answer "yes" to every site. So any page the user visits, including an attacker's, can quietly fetch the user's profile and orders and send them home. The "CORS errors" were the browser doing its job.

**E9.** Hex encodes 4 bits per character, so 128 / 4 = 32 characters. Base64url encodes 6 bits per character, so ⌈128 / 6⌉ = 22 characters without padding.

**E10.** Total guesses are 10^9 × 31,536,000 = 3.1536 × 10^16. Each guess hits one of 10^6 valid ids out of 2^128 ≈ 3.4028 × 10^38, so the expected hits are 3.1536 × 10^16 × 10^6 / 2^128 ≈ 9.27 × 10^-17. Guessing is hopeless, and attackers steal ids instead.

**E11.** The line is `Cookie: ` (8) + `__Host-sid=` (11) + 22 + `; ` (2) + `__Host-csrf=` (12) + 22 + `.` (1) + 43 = 121 bytes. At 2,000 requests per second, 121 × 2,000 = 242,000 bytes per second of request headers before HTTP/2 compression, which HPACK reduces to a few bytes per request after the first.

**E12.** The host-only cookie goes only to `api.wren.example`. The `Domain=wren.example` cookie goes to `wren.example` and every subdomain, including `api`, `app`, `admin` and `blog`. The `__Host-x` cookie with a Domain attribute violates the prefix rules, so the browser refuses to store it at all.

**E13.** The link click is a top-level GET navigation, so it carries the cookie. The form POST does not. The image does not. The credentialed fetch does not. The redirect to `/orders/7/cancel` is a top-level GET navigation and carries it, which is why that endpoint must not be a GET.

**E14.** SameSite asks only whether the request comes from the same "site", which means the same main domain. The blog and the API both live under wren.example, so to the browser they are the same site, and every cookie is sent as if the request came from Wren itself. The attacker who controls the blog looks like family. Only checks on the exact origin, or keeping cookies host-only and untouchable by siblings, tell them apart.

**E15.** The form is `<form method="POST" action="https://api.wren.example/account/email"><input name="email" value="me@evil.example"></form><script>document.forms[0].submit()</script>`. It relies on the session cookie being attached automatically to cross-site POSTs (no SameSite or None), on the request having no unpredictable values such as a token, and on a form-encoded POST being a simple request that needs no preflight.

**E16.** The attacker uses `<form method="POST" enctype="text/plain" action="https://api.wren.example/account/email"><input name='{"email":"me@evil.example","x":"' value='"}'></form>`, which sends the body `{"email":"me@evil.example","x":"="}` as text/plain with no preflight. Fix it by rejecting any body on JSON endpoints whose Content-Type is not exactly application/json, which forces a preflight cross-site pages cannot pass, or by requiring a CSRF token or allowed Origin on every unsafe method.

**E17.** Unsigned double submit only checks that the header equals the cookie. An attacker on `blog.wren.example` can set a cookie for `wren.example` with a value it chose, then from its own pages send a request whose header carries the same value, so the check passes. Signing binds the value to the victim's session id with a server key, so an attacker-chosen value fails verification. The `__Host-` prefix stops the sibling from setting the cookie in the first place, since prefixed cookies cannot carry a Domain attribute.

**E18.** Same-origin POST passes. Cross-site top-level GET navigation passes, so inbound links work. Cross-site POST navigation is rejected, which is the form CSRF case. Cross-site no-cors image request is rejected. A request without Sec-Fetch headers passes this gate and must satisfy the Origin and token checks.

**E19.** In localStorage the token is never sent by the browser on its own, only when the app's code adds it to a request, so another site cannot borrow it. But any script running on the page can read localStorage. If an attacker gets one line of script onto Wren's pages, through a bad dependency or an injection bug, they copy the token and use it from their own computer until it expires, even after the user closes the tab. An HttpOnly cookie cannot be read by script that way.

**E20.** One guess succeeds with probability 1 / 2^128.

**E21.** Let $A$ be the finite allowlist of origin strings and the check accept $o$ iff $o \in A$. If the check accepts $o$, then $o \in A$ by definition, so no origin outside $A$ is accepted. For a suffix rule "host ends with $s$", take any $s$ such as `wren.example`. Anyone can register the domain `x` + $s$ when $s$ is not preceded by a dot, as in `evilwren.example`, which ends with $s$ yet is outside $A$. If the rule requires a dot, as in `.wren.example`, it still accepts every subdomain, including ones created later or taken over by dangling records, which are outside any fixed list. So no suffix rule can guarantee acceptance only of a fixed list.

**E22.** Assume the token $t$ is chosen uniformly from $2^{128}$ values, is stored server-side with the session, is delivered only in responses to same-origin requests, is never placed in URLs, and the target origin has no XSS. A cross-site attacker page can cause requests but, by the SOP, cannot read any response from the target origin, so it learns nothing about $t$. Its forged request therefore carries a value independent of $t$, which equals $t$ with probability $2^{-128}$. The server rejects mismatches, so the forgery fails except with negligible probability. Each assumption is necessary, since XSS or a token in a URL leaks $t$.

**E23.** A WSGI-style middleware that runs before authentication:

```python
APP, PARTNER = "https://app.wren.example", "https://partner.example"
ALLOWED = {APP: True, PARTNER: False}

def cors(handler):
    def wrapped(req):
        origin = req.headers.get("Origin")
        creds = ALLOWED.get(origin)
        if req.method == "OPTIONS" and "Access-Control-Request-Method" in req.headers:
            resp = Response(status=204)
        else:
            resp = handler(req)
        resp.headers.add("Vary", "Origin")
        if creds is not None:
            resp.headers["Access-Control-Allow-Origin"] = origin
            if creds:
                resp.headers["Access-Control-Allow-Credentials"] = "true"
            if req.method == "OPTIONS":
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE"
                resp.headers["Access-Control-Allow-Headers"] = "content-type, x-csrf-token"
                resp.headers["Access-Control-Max-Age"] = "600"
            resp.headers["Access-Control-Expose-Headers"] = "x-request-id"
        return resp
    return wrapped
```

The dictionary lookup is an exact match, a null or unknown origin gets no CORS headers, and Vary is added on every response, allowed or not.

**E24.** The middleware runs after session loading:

```python
import hmac, hashlib
from urllib.parse import urlsplit

UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}
ORIGINS = {"https://app.wren.example"}

def origin_of(url):
    p = urlsplit(url)
    return f"{p.scheme}://{p.netloc}"

def csrf(handler, key):
    def wrapped(req):
        if req.method in UNSAFE:
            src = req.headers.get("Origin") or (req.headers.get("Referer") and origin_of(req.headers["Referer"]))
            if src not in ORIGINS:
                return Response(status=403)
            cookie = req.cookies.get("__Host-csrf", "")
            header = req.headers.get("X-CSRF-Token", "")
            rnd, _, sig = cookie.partition(".")
            want = hmac.new(key, (req.session_id + rnd).encode(), hashlib.sha256).hexdigest()
            if not (hmac.compare_digest(cookie, header) and hmac.compare_digest(sig, want)):
                return Response(status=403)
        return handler(req)
    return wrapped
```

A missing Origin and Referer gives `src = None`, which is not in the set, so the request is rejected. Comparisons use `compare_digest` to avoid timing leaks.

**E25.** An iframe on partner sites is a third-party context, so the checkout session cookie must be `SameSite=None; Secure`, and it will not be sent at all in Safari and Firefox with default settings. Prefer a design without third-party cookies, such as a top-level redirect or popup to `checkout.wren.example` that sets a first-party Lax cookie, or a short-lived signed token passed into the iframe and sent in an Authorization header. If the iframe cookie is unavoidable, accept that classic CSRF is back for that cookie and require a synchronizer token and an Origin allowlist containing the partner origins on every unsafe request. Add `Content-Security-Policy: frame-ancestors` listing only partner origins to stop clickjacking, and keep the cookie host-only on the checkout host so it cannot authenticate to the main API.

**E26.** Fix first by replacing reflection with an exact allowlist and deploying. Rotate nothing yet, since cookies were not stolen directly, but consider invalidating sessions if exposure was long. Scope exposure by searching access logs for requests to `/me` and other credentialed endpoints with an Origin outside the allowlist that received 200, grouped by origin and user. Each such pair means that user's data may have been read by that site. Notify affected users if personal data was exposed, as required by law in many jurisdictions. Prevent recurrence by moving CORS into shared middleware, adding CI tests that send attacker origins and assert no ACAO, and alerting on responses whose ACAO is not in the list.

### Primary sources

[Fetch Standard, CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol). Simple requests, preflights, credentials and the null origin.

[RFC 6265bis, Cookies](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/). Domain, Path, SameSite and cookie prefixes.

[OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Tokens, double submit, Origin checks and Fetch Metadata.

[web.dev, Protect your resources with Fetch Metadata](https://web.dev/articles/fetch-metadata). Resource isolation policies.

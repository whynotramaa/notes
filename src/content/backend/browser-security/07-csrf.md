@part VII | CSRF | We learn how cross-site request forgery works and the five defences that stop it. Any API that authenticates with cookies is exposed by default, because browsers attach cookies to requests that other sites start. We will build the attack, then synchronizer tokens, double-submit cookies, Origin and Referer checks, Fetch Metadata, and the case of a JWT stored in a cookie. | where:7

## 22. How CSRF works

User 42 is logged in to Wren in one tab. In another tab they open a link promising a free meal, which loads `https://evil.example/prize`. That page contains a hidden form with `action="https://api.wren.example/account/email"`, `method="POST"` and one field, `email=me@evil.example`, plus one line of script that submits it as soon as the page loads. The browser sends the POST to Wren, and because the session cookie matches Wren's domain, it attaches it. Wren sees a valid session for user 42 and changes the account email to the attacker's address. A minute later the attacker clicks "forgot password", receives the reset link at their own address, and owns the account. User 42 saw a page flash and nothing more.

@fig be_csrf_attack | The attacker never sees the cookie. The browser attaches it on the attacker's behalf.

This is **cross-site request forgery** (CSRF), in which one site makes the user's browser send an authenticated request to another site. It needs three conditions together. The target must authenticate with something the browser attaches on its own, such as a cookie or HTTP basic auth. The target must expose an action whose request the attacker can predict completely, every field and value. And the browser must be willing to send that request cross-site without asking first, which is true of form posts and simple fetches. Remove any one condition and the attack fails. SameSite attacks the first condition, tokens attack the second, and strict content types plus Origin checks attack the third.

CSRF was once among the most common web vulnerabilities. In 2008 researchers showed it against major sites, including a bank where a forged request could transfer money and a video site where it could add videos to a user's favourites. Default Lax cookies made it rarer, but every API that uses cookies still has to think about it.

:::story Picture this
Someone slips a pre-filled cheque into a pile of papers you are signing at your desk. You sign the whole pile because every page has your name on it, and the bank sees your genuine signature. The defences are a page the forger cannot reproduce, such as a secret serial number known only to you and the bank, or a bank that checks which desk each cheque came from.
:::

## 23. Synchronizer tokens

The classic defence makes the request unpredictable. When the server creates a session, it also creates a random **CSRF token**, at least 128 bits from a cryptographic generator, and stores it with the session. Every page that renders a form embeds the token in a hidden field. Single-page apps fetch it from an endpoint, or read it from a non-HttpOnly cookie, and send it in a header such as `X-CSRF-Token`. On every state-changing request the server compares the submitted token with the copy in the session and rejects a mismatch with 403.

@fig be_csrf_synchronizer | The token lives in the session and in the page. A foreign page cannot read either.

The attacker's page can make the browser send the cookie, but the same-origin policy stops it from reading Wren's pages or API responses, so it never learns the token. Its forged form carries a missing or wrong token, and the server refuses it. This is the **synchronizer token pattern**, named because the token in the page must stay in sync with the token in the session.

A few rules keep it sound. The token must be compared in constant time. It must never appear in a URL, where it would leak through logs, history and Referer headers. A per-session token is enough for most applications, and per-request tokens add little security while breaking the back button and multiple tabs. The pattern needs server-side session state, which is natural for session-based apps and awkward for stateless ones.

## 24. Double-submit cookies

Stateless servers that do not want to store a token per session use the **double-submit cookie** pattern. The server sets a cookie containing a random value. The client's JavaScript reads that cookie and copies its value into a request header. The server checks that the header equals the cookie. An attacker on another site can make the browser send the cookie, but the SOP stops the attacker's script from reading it, so it cannot put the same value in the header.

@fig be_csrf_double_submit | The browser sends the cookie. Only a same-origin script can copy it into the header.

The naive version has a flaw. If an attacker controls any sibling subdomain, or can inject a `Set-Cookie` through some other bug, they can plant a cookie with a value they chose for `wren.example`, then send a request whose header carries that same value. Header equals cookie, and the check passes. The fix is the **signed double-submit** variant. The token is `random.HMAC(key, session_id + random)`, so the server can check that the cookie was made by Wren for this session, and an attacker-chosen value fails. Combined with the `__Host-` prefix, which stops siblings from setting the cookie at all, it is a sound defence that needs no server-side storage.

:::warn Watch out
Do not exempt JSON endpoints from CSRF checks on the theory that a form cannot send JSON. A form can send `text/plain` containing JSON-shaped text, and some frameworks parse request bodies whatever the Content-Type says. Either enforce `Content-Type: application/json` strictly, which forces a preflight, or check the token on every unsafe method.
:::

## 25. SameSite, Origin and Referer verification

The browser already labels each request with where it came from, so a server can refuse unsafe requests from origins it does not recognise. For POST, PUT, PATCH and DELETE, the server reads the Origin header. If Origin is present and not in Wren's allowlist, it rejects with 403. If Origin is absent, which happens with some older browsers and privacy settings, it falls back to the Referer and extracts the origin from it. If both are missing on a cookie-authenticated request, the safe choice is to reject, perhaps with an exception for specific endpoints you have reviewed.

@fig be_csrf_origin_check | Four steps on every unsafe request. The browser supplies the evidence and the server checks it.

Origin checking needs no tokens, no storage and no client-side code, so it fits any front-end framework and protects form posts and fetches alike. OWASP lists it as a defence in depth alongside tokens. Its weak spot is the same as SameSite's. A request from a compromised `blog.wren.example` carries `Origin: https://blog.wren.example`, so the allowlist must name exact origins, `https://app.wren.example`, and never a pattern like `*.wren.example`.

Combining SameSite=Lax with an Origin check covers almost every gap from Section 21. The state-changing GET is gone because GETs must be safe. The cross-site POST is stopped twice, by the cookie not being sent and by the Origin. The old browser that ignores SameSite still sends Origin, which the server rejects.

## 26. Fetch Metadata resource isolation

`Sec-Fetch-Site` gives the server a direct statement of how the requesting page relates to the target, and that enables a simple gate. A **resource isolation policy** is middleware that runs before any handler. It allows `same-origin` requests. It allows `same-site` requests only if you trust every subdomain. It allows `none`, which means the user typed the URL or used a bookmark. It allows `cross-site` requests only when they are top-level GET navigations, so links from email and search still work. Everything else that is cross-site is rejected with 403 before it reaches application code.

@fig be_fetch_metadata | One middleware rule stops cross-site POSTs, cross-site fetches and cross-site embeds of private data.

This one rule blocks CSRF and a wider class of **cross-site leaks**, where an attacker learns something by embedding your resources and watching whether they load, how long they take or how large they are. Google rolled resource isolation policies out across many of its services from 2020 and published the approach. Requests without Sec-Fetch headers come from older browsers or non-browser clients, so the policy lets them through to the other checks rather than rejecting them, otherwise it would break curl and mobile apps.

## 27. JWT in a cookie still needs CSRF protection

A common belief says that switching from server sessions to JWTs ends CSRF. It does not, because CSRF depends on how a credential is delivered, not on what it contains. If Wren stores the JWT in a cookie, the browser attaches it to a forged cross-site request exactly as it would attach a session id. The server verifies the signature, finds it valid, and accepts the request. A JWT in a cookie needs SameSite, an Origin check or a CSRF token, like any session cookie.

@fig be_csrf_jwt_cookie | Where the token is stored decides the attack. A cookie invites CSRF, script memory invites theft by XSS.

If the app instead keeps the JWT in JavaScript memory or localStorage and sends it in an `Authorization: Bearer` header, the browser never attaches it on its own, so CSRF is impossible. But any cross-site scripting bug can now read the token and send it to the attacker, who uses it from anywhere until it expires. An HttpOnly cookie would have stopped that read. So the choice is between two risks. The usual answer is an HttpOnly, Secure, SameSite cookie plus Origin or token checks, because CSRF is well understood and fully preventable, while XSS bugs keep appearing in large front-end codebases. Unit III continues this comparison.

:::interview Interview lens
**"Why doesn't JWT authentication automatically eliminate CSRF?"** CSRF exploits the browser attaching credentials on its own, not the format of the credential. A JWT stored in a cookie is attached to cross-site requests just like a session id, and its signature is valid, so the forged request succeeds. Only a token sent in an Authorization header by script is immune, and that trades CSRF risk for exposure to XSS. A cookie-stored JWT still needs SameSite plus an Origin check or a CSRF token.
:::

:::key In one breath
CSRF makes the victim's browser send a predictable state-changing request to a site where cookies authenticate it. Synchronizer tokens and signed double-submit cookies add a value the attacker cannot read. Origin and Referer checks and a Sec-Fetch-Site isolation policy reject requests from unknown origins using labels the browser writes. SameSite=Lax is a strong default layer, and a JWT in a cookie is exactly as exposed as a session id.
:::

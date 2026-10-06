@part VII | Access and refresh tokens | We split one long-lived credential into a short access token and a long refresh token. A single token that lasts for weeks is a disaster when stolen, while one that lasts minutes forces constant logins. We will cover short-lived access tokens, refresh rotation with reuse detection, revocation and where a browser app should keep its tokens. | where:7

## 20. Short-lived access tokens

Every credential faces the same tension. A stolen token is useful until it expires, so shorter is safer. But a token that expires every 15 minutes would force user 42 to log in four times an hour, and nobody would use the app. The way out is two tokens with two jobs. An **access token** is short-lived, 15 minutes for Wren, and goes with every API call to every service. A **refresh token** is long-lived, 30 days for Wren, and goes only to the auth server, which exchanges it for a new access token shortly before the old one expires. The app does this in the background, so the user stays logged in for 30 days without noticing.

@fig be_tok_access_refresh | Access tokens come and go every 15 minutes. One refresh token renews them for 30 days.

The split limits damage in a specific way. The access token travels to many services and lands in more memory, more logs and more proxies, so it is more likely to leak. But a leaked one works for at most 15 minutes. The refresh token is far more valuable, and it travels to exactly one endpoint, is stored more carefully, and is checked against server-side state on every use. That check is the moment where revocation, reuse detection and "has this user been disabled?" all happen.

The lifetimes are tunable. Over 30 days, one refresh token can produce up to $30 \times 86{,}400 / 900 = 2{,}880$ access tokens. Shortening access tokens to 5 minutes tightens the revocation window but triples refresh traffic to the auth server. Many systems also set an absolute limit on the refresh chain, so that even an active user re-authenticates every 90 days, and require a fresh password for sensitive actions however recently they refreshed.

## 21. Refresh token rotation and reuse detection

A refresh token that lives for 30 days is still a valuable target. **Refresh token rotation** issues a new refresh token every time one is used, and retires the old one. User 42's app uses R1 and receives a new access token plus R2. Fifteen minutes later it uses R2 and receives R3. Every refresh token works exactly once, so a stolen copy goes stale as soon as the real app refreshes.

Rotation makes **reuse detection** possible. Suppose R1 shows up again after it was retired. Only two explanations exist. Either the app has a bug, or two parties hold copies of the chain, the real app and someone who stole an earlier token. The server cannot tell which caller is the thief, so it revokes the whole token family, R1, R2, R3 and any access tokens it tracks, and forces a fresh login. The thief loses access. The real user logs in again once, which is an acceptable price. The OAuth 2.0 security best practice document recommends exactly this behaviour for public clients such as mobile and browser apps.

@fig be_tok_rotation | A retired token used again proves a copy exists. The safe answer is to end the whole family.

:::story Picture this
A cinema that stamps your ticket and hands you a fresh one each time you step out for snacks. If someone shows up with a ticket that was already exchanged, the usher knows two copies exist. They cancel every ticket in that chain until you show your ID at the box office again.
:::

:::warn Watch out
Rotation with reuse detection breaks naive mobile clients that send two refreshes in parallel, for example when the app wakes from the background and two screens ask for data at once. The second request presents a token the first just used, which looks like reuse, and the user gets logged out. Serialise refreshes in the client behind a lock, or allow a grace period of a few seconds in which the previous token returns the same new pair.
:::

## 22. Revocation and token storage

A JWT access token stays valid until `exp`, so revoking one early needs some state. Wren keeps the `jti` of revoked tokens in a Redis deny list, each entry with a TTL equal to the token's remaining lifetime, and every service checks the list. The list stays tiny, because entries disappear as soon as the token would have expired anyway. With 10,000 logouts a day and 900-second tokens, it holds on average $10{,}000 \times 900 / 86{,}400 \approx 104$ entries. For "log out everywhere", a per-user "tokens issued before" time does the job in one write. Any token whose `iat` is older is rejected. Both designs add a fast lookup per request, which is the price of early revocation.

@fig be_tok_revocation | The deny list only needs entries for tokens that would otherwise still be valid.

Where a browser app keeps tokens decides what can steal them. localStorage is readable by any script on the page, so one XSS bug or one compromised npm package sends the refresh token to an attacker, who can use it from anywhere for 30 days. JavaScript memory is lost when the page reloads, and it is still readable by an XSS payload while the page is open. An HttpOnly, Secure, SameSite cookie is invisible to scripts, but it brings back the CSRF problem from Unit II and needs those defences.

The **backend-for-frontend** (BFF) pattern sidesteps the choice. A small server owned by the web app, on the app's own origin, performs the OAuth flows and holds the access and refresh tokens. The browser only ever has an ordinary HttpOnly session cookie for the BFF. The BFF attaches the access token when it forwards API calls. The IETF's current guidance for browser-based apps recommends this pattern, because no token is ever exposed to JavaScript. The cost is an extra hop and a server to run.

@fig be_tok_storage | Four places to keep tokens, each with a different exposure. The orange row is the usual compromise.

:::interview Interview lens
**"How do you revoke a JWT before it expires?"** You cannot change the token, so you add state that verifiers consult. Keep access tokens short, 5 to 15 minutes, so most revocation is simply refusing the next refresh. For immediate revocation, put the jti in a deny list with a TTL equal to its remaining life, or store a per-user minimum issued-at time and reject older tokens. Both add a fast lookup per request, which is the price of revocability.
:::

:::key In one breath
Short access tokens, 15 minutes for Wren, go to every service and limit the damage of theft, while a 30-day refresh token goes only to the auth server to mint new ones. Rotation issues a new refresh token on every use, and seeing a retired one again triggers revocation of the whole family. Revoking a JWT early needs a jti deny list or a per-user issued-before time, and the deny list only holds still-valid tokens. In browsers, prefer HttpOnly cookies or a backend-for-frontend over localStorage.
:::

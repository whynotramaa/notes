@part I | Session authentication | We build stateful session authentication from a single login to a request that carries it. Sessions are still the default for web apps because they are simple to reason about and easy to revoke. We will cover the login flow, the session store, expiry policies, rotation and fixation, and hijacking. | where:1

## 1. Stateful authentication and the login flow

User 42 types an email and password into Wren. Checking that password takes about a quarter of a second, because Part III makes it slow on purpose. Repeating that on all of the dozens of API calls the app makes per minute would be absurd, and the app should not keep the password in memory anyway. So the server checks it once and hands back something cheaper to verify on later requests.

In **session authentication**, the server creates a **session** record after a successful login and stores it on the server side. The browser receives only a random identifier, in a cookie. On every later request the server reads the cookie, looks up the record and learns that this request comes from user 42. The approach is called **stateful** because the server holds the state. The cookie is a meaningless pointer, and the record it points to is what matters. That arrangement has a useful consequence. To log someone out, or to cut off a stolen session, the server deletes one record, and the cookie stops working everywhere at once.

@fig be_auth_session_login | Prove once with a password, then carry a random id. Every later request costs one lookup instead of one password check.

The identifier must be unguessable. Wren uses 128 random bits from a cryptographic generator, such as Python's `secrets.token_urlsafe(16)`, encoded as 22 characters. Unit II showed that guessing one of a million live 128-bit ids at a billion guesses per second for a year has odds around $10^{-16}$. Never derive the id from the user id, a timestamp, a counter or an ordinary random number generator like Python's `random`, whose output can be predicted after observing a few values. Early PHP and Java servers made exactly that mistake.

The login handler itself is short. Look up the user by normalised email, verify the password hash, create the session record, set the cookie, and return. The details that make it safe, such as uniform error messages, rate limits and session rotation, take up the rest of this unit.

:::story Picture this
A hotel key card. At check-in you show your passport once. The front desk writes your stay into its computer and hands you a card that carries only a number. Each door asks the computer whether that number may open it, and the desk can cancel a card at any moment without needing to find it.
:::

## 2. The session store

Wren runs four app instances behind a load balancer, and any of them may receive user 42's next request. So sessions cannot live in one instance's memory. If they did, a request routed to a different instance would look logged out, and a deploy that restarted instances would log everyone out. Sessions go in a shared **session store**, usually Redis for speed or the main database for simplicity. At peak, Wren does 2,000 session lookups per second, one per request, each a single Redis `GET` that takes well under a millisecond.

@fig be_auth_session_store | A shared store lets any instance serve any user. It also makes the store a dependency of every request.

The record holds the user id, timestamps, the device and an authentication level, such as "password only" or "password plus one-time code". Some systems also keep a small cache of permissions there to save a database query per request. Store the record under a hash of the session id, not the id itself. Then a leaked copy of the store, from a backup, a debugging dump or a misconfigured Redis replica, contains no working cookies. The server hashes the incoming cookie with SHA-256 and looks up the hash. A fast hash is fine here, because the id is random and has nothing for an attacker to guess.

At about 200 bytes per record and 200,000 active sessions, Wren's store holds 40,000,000 bytes, which is small enough for one Redis instance with a replica. Redis adds some overhead per key, so measure the real figure. Using the main PostgreSQL database instead works for smaller systems, but 2,000 extra queries per second and a write on every request for sliding expiry put real load on the most precious database in the system.

@fig be_auth_session_record | A session record. The key is a hash of the cookie value, never the raw value.

:::warn Watch out
If the session store goes down, every user is logged out at once, or every request fails. Run it replicated, and decide in advance what an outage means. Failing closed rejects requests. Failing open for read-only public pages may be acceptable. Failing open for writes is never acceptable.
:::

## 3. Session expiration: idle, sliding and absolute

A session cannot live forever. A cookie left on a library computer, or taken from a stolen laptop, would otherwise stay valid indefinitely. Three policies combine to bound it. An **idle timeout** ends the session after a period without requests, 30 minutes for Wren. A **sliding** session pushes that idle deadline forward on every request, so a user who keeps using the app is never interrupted. An **absolute timeout** ends the session a fixed time after login, whatever the activity, 12 hours for Wren. The absolute limit matters because an attacker using a stolen cookie keeps it active with steady requests, and only the absolute limit stops that.

@fig be_auth_expiry | Activity keeps a sliding session alive. The absolute limit ends it anyway.

Walk through user 42's day. They log in at minute 0 and make requests at minutes 10, 25 and 50. Each request moves the idle deadline to 30 minutes later, so after the request at minute 50 the session will end at minute 80 unless another request arrives. None does, so at minute 80 the session expires. When they return at minute 300, the server finds no session, returns 401, and the app shows the login screen.

In Redis, the idle timeout is simply the key's TTL, refreshed with `EXPIRE` on each use, and the absolute deadline is a field in the record that every lookup checks. Refreshing the TTL on every request doubles the store's write load. Many systems refresh only if more than a minute has passed since the last refresh, which trades a minute of precision for half the writes. Choosing the numbers is a product decision as much as a security one. A banking app might use 5 minutes idle, while a chat app might keep users logged in for 30 days on their own phone and ask for the password again only before sensitive actions.

## 4. Session rotation and fixation

In a **session fixation** attack, the attacker gets the victim to use a session id the attacker already knows. First the attacker visits Wren without logging in and receives an anonymous session id, `AAA`. Then they plant `AAA` in the victim's browser. On old frameworks that accepted ids in URLs, a link like `https://app.wren.example/?sid=AAA` was enough. Today it takes a cookie set from a compromised sibling subdomain, which is why Unit II insisted on `__Host-` cookies. The victim logs in normally, and a careless server attaches user 42 to the existing session `AAA`. The attacker, still holding `AAA`, is now logged in as user 42 without ever seeing a password.

@fig be_auth_fixation | The attacker never steals anything. They choose the id in advance and wait.

The fix is **session rotation**. Whenever the privilege attached to a session changes, the server deletes the old session and issues a new random id, copying over any data worth keeping, such as a basket. Rotation happens at login, at logout, after a second authentication factor succeeds, and when the user's role changes. A planted pre-login id becomes worthless at exactly the moment it would have become valuable. Every mature framework has a call for this, such as `request.session.cycle_key()` in Django, `session.regenerate()` in Express and `request.changeSessionId()` in Java servlets. The bug is almost always that someone wrote a custom login handler and forgot it.

@fig be_auth_rotation | A new id at every privilege change. The old one is deleted, not just abandoned.

## 5. Session hijacking

**Session hijacking** means using someone else's valid session id. Ids leak in several ways. An XSS bug can read a cookie that lacks HttpOnly. A request over plain HTTP exposes a cookie without Secure. Malware on the device can copy cookies straight out of the browser profile, and since 2023 "infostealer" malware that does exactly this has driven many high-profile breaches. Application logs sometimes record cookie headers. A stolen or shared laptop carries all its sessions with it. Once taken, the id works from any machine until the server ends the session.

@fig be_auth_hijack | A stolen id is a valid id. The server can only notice changes in context and react.

Defences come in layers. The cookie flags from Unit II make theft harder in the first place. Short idle and absolute timeouts shorten the useful window. The server records context at login, such as the IP address range, country and user agent, and compares it on later requests. A session that logged in from Pune and is suddenly used from another continent ten minutes later is suspicious.

Binding a session strictly to one IP address breaks mobile users, whose addresses change whenever they move between cell towers or Wi-Fi networks. So most systems use context changes to raise friction instead of rejecting outright. They ask for the password again before changing the email address or adding a payment method, and they notify the user about logins from new devices. Newer browser features go further. Device Bound Session Credentials, which Chrome began testing in 2024, tie a session to a key stored in the device's hardware, so a copied cookie stops working on another machine.

:::interview Interview lens
**"How do sessions differ from JWTs, and when would you pick sessions?"** A session id is a random pointer to server-side state, so each request needs a store lookup, and revoking it is a single delete. A JWT carries signed claims and can be checked locally, but it cannot be revoked before it expires without extra state. For a browser app talking to its own backend, sessions are simpler and safer, since revocation, rotation and device lists come for free. JWTs pay off when many independent services must verify identity without calling a central store.
:::

:::key In one breath
Session authentication checks the password once, stores a server-side record and gives the browser a 128-bit random id in a cookie. A shared store such as Redis lets any instance find the session, at one lookup per request, keyed by a hash of the id. Idle, sliding and absolute timeouts bound how long a session lives. Rotating the id at every privilege change defeats fixation, and hijacking with a stolen id is limited by cookie flags, short lifetimes and context checks.
:::

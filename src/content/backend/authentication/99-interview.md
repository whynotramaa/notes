@chapter faq | Interview question bank | Questions follow the unit's order. Answer aloud first, then compare.

### Sessions

**Q1. What is session-based authentication?**

The server verifies credentials once, stores a session record server-side and gives the client a random id in a cookie. Each request presents the id and the server looks up the record. Revocation is deleting the record.

**Q2. Why must a session id be random and long?**

Anyone who knows a valid id is that user. A guessable or sequential id lets attackers enumerate sessions. 128 bits from a cryptographic generator puts guessing beyond reach.

**Q3. Where do sessions live when you run several app instances?**

In a shared store such as Redis or the database, so any instance can serve any request. In-process memory only works with sticky routing and loses sessions on restart. The store becomes a per-request dependency that needs replication.

**Q4. Why store a hash of the session id instead of the id?**

So that a leaked copy of the store, from a backup or a debugging dump, cannot be replayed as live cookies. The server hashes the presented cookie and looks up the hash. A fast hash suffices because the id has full entropy.

**Q5. Compare idle, sliding and absolute session expiry.**

Idle expiry ends a session after inactivity. Sliding renewal extends the idle deadline on each request. Absolute expiry ends it after a fixed lifetime regardless, which caps the value of a stolen, actively used cookie.

**Q6. What is session fixation and how do you prevent it?**

The attacker gets the victim to log in with a session id the attacker already knows, then uses it. Prevent it by issuing a new session id at login and every privilege change and deleting the old one. Never accept session ids from URLs.

**Q7. What is session hijacking?**

Using a stolen valid session id from another machine. Theft happens through XSS, plain HTTP, malware or logs. Limit it with cookie flags, short timeouts, context-change detection and step-up authentication for sensitive actions.

### Logout and devices

**Q8. Why isn't clearing the cookie enough for logout?**

A copied id stays valid on the server until it expires. Logout must delete the server-side session. Clearing the cookie only tidies the browser.

**Q9. How do you implement "log out everywhere"?**

Keep a per-user index of sessions and delete them all, or keep a session version on the user that each session records and bump it. Older sessions then fail their next lookup. With JWTs, revoke refresh tokens and reject access tokens issued before a per-user timestamp.

**Q10. How would you limit a user to three concurrent sessions?**

Keep a per-user sorted set of sessions by creation time. On a new login, if the set has three entries, delete the oldest session and remove it from the set. Evicting the oldest is friendlier than rejecting the new login.

### Password storage

**Q11. Why isn't SHA-256 suitable for passwords?**

It is designed to be fast, so attackers can test billions of guesses per second against a leaked hash. Password hashes must be slow and tunable. Argon2id, scrypt or bcrypt make each guess thousands of times more expensive.

**Q12. What does a salt do?**

It makes each user's hash unique even for identical passwords, which defeats precomputed tables and forces attackers to crack users one by one. It is random per user and stored openly. It adds no secrecy.

**Q13. What is a pepper?**

A secret key mixed into every password hash and stored outside the database, typically in a KMS. A database dump alone then cannot be cracked offline. Losing or rotating it requires care.

**Q14. Compare bcrypt, scrypt and Argon2.**

bcrypt makes guessing CPU-expensive and truncates input at 72 bytes. scrypt adds a memory cost that hurts GPUs and ASICs. Argon2id tunes memory, time and parallelism separately and is the current default recommendation.

**Q15. How do you choose and change the work factor?**

Pick the most expensive setting your peak login rate can afford, typically a few hundred milliseconds per hash. The parameters are stored in the hash string. After each successful login, re-hash with new parameters if the stored ones are older.

### Login attacks

**Q16. What is a timing attack on a comparison?**

An early-exit comparison runs longer when more leading bytes match, so measured response times reveal the secret byte by byte. Use constant-time comparison functions for tokens, signatures and API keys. Library password verifiers already do so.

**Q17. How can a login form leak which users exist?**

Through different messages or different timing for unknown and known accounts, since only known accounts trigger the slow hash. Return one generic message and hash a dummy password for unknown users. Check signup and reset forms too.

**Q18. What is credential stuffing?**

Replaying email and password pairs leaked from other sites, one attempt per account, from many IP addresses. Per-account and per-IP limits rarely trigger. Global failure monitoring, breached-password checks, bot detection and MFA are the defences.

**Q19. What is password spraying?**

Trying a few common passwords against many accounts slowly, staying under per-account lockout thresholds. It targets weak password policies. Block common passwords and watch failure patterns across accounts.

**Q20. Why are hard account lockouts risky?**

Anyone can lock any account by failing logins on purpose, which turns the defence into a denial-of-service tool. Prefer progressive delays, CAPTCHA, step-up verification and short automatic unlocks.

### Password reset

**Q21. Walk through a secure password reset flow.**

Accept an email and always give the same response. Generate 256 random bits, store their hash with a short expiry and single-use flag, and email a link built from the configured host. On use, verify, set the new password, invalidate the token and all sessions, and notify the user.

**Q22. Why store a hash of the reset token?**

So a leaked database does not contain working reset links. A fast hash is fine because the token has 256 bits of entropy. The raw token exists only in the email.

**Q23. What is host header poisoning in reset emails?**

The app builds the reset link from the request's Host header, which the attacker controls. The victim receives a genuine email with a link to the attacker's domain, and clicking it sends the token there. Build links from configuration.

**Q24. Why revoke sessions after a reset?**

The reset may be recovery from a compromise, and the attacker may hold a session. Without revocation they stay logged in after the password changes. Revoke all sessions and refresh tokens, optionally except the current one.

### JWT

**Q25. What are the three parts of a JWT?**

A base64url header naming the algorithm and key id, a base64url payload of claims, and a signature over the first two. The first two parts are readable by anyone. Only the signature depends on a key.

**Q26. What do iss, sub, aud, exp, nbf, iat and jti mean?**

Issuer, subject, audience, expiry, not-before, issued-at and a unique token id. iss and aud say who made it and who should accept it, exp and nbf bound its validity, and jti supports revocation and replay detection. Each must be checked where relevant.

**Q27. HS256 versus RS256: which and why?**

HS256 uses one shared secret, so every verifier can also forge tokens. RS256 and ES256 sign with a private key held only by the issuer, and verifiers use public keys. Use asymmetric algorithms whenever more than one service verifies.

**Q28. What is a JWKS and how do you rotate keys with it?**

A JSON document of public keys tagged by kid, published at a well-known URL. Publish the new key before signing with it, switch signing, and remove the old key after its last token expires. Verifiers refetch once when they see an unknown kid.

**Q29. JWT or opaque token?**

JWTs verify locally without a lookup but cannot be revoked early without extra state. Opaque tokens need a lookup but are revoked instantly and reveal nothing. Many systems use short JWT access tokens and opaque refresh tokens.

### Access and refresh tokens

**Q30. Why split access and refresh tokens?**

Access tokens travel to every service and are short-lived, so theft has a small window. Refresh tokens are long-lived but sent only to the auth server, where each use can be checked. Together they give long sessions with short exposure.

**Q31. What is refresh token rotation?**

Each refresh returns a new refresh token and retires the old one, so every refresh token works once. That limits the life of a stolen copy. It also enables reuse detection.

**Q32. How does refresh token reuse detection work?**

If a retired refresh token is presented again, two parties hold the chain. The server cannot tell which is legitimate, so it revokes the whole family and forces a new login. Clients must avoid parallel refreshes to prevent false alarms.

**Q33. How do you revoke a JWT access token early?**

Store its jti in a deny list with a TTL equal to its remaining life, or keep a per-user minimum issued-at time. Both add a lookup per request. Short expiry keeps the list small.

**Q34. Where should a browser app store tokens?**

Not in localStorage, which any XSS can read. Prefer an HttpOnly, Secure, SameSite cookie with CSRF defences, or a backend-for-frontend that keeps tokens server-side and gives the browser a session cookie. In-memory storage is a middle ground that still loses to XSS.

### JWT attacks

**Q35. What is algorithm confusion?**

The attacker sets alg to HS256 and signs with the server's RSA public key as the HMAC secret. A library that takes the algorithm from the token verifies it successfully. Pin the algorithm per key in configuration and reject alg none.

**Q36. Why must you check aud and iss after the signature?**

A valid signature proves who signed, not whom the token was for. Without aud a token for another API is accepted, and without iss a token from another environment sharing a key is accepted. Each check blocks a genuine token used in the wrong place.

**Q37. Why are weak HS256 secrets dangerous?**

One captured token lets an attacker guess the secret offline, testing candidates against the signature without contacting the server. Once found, they can mint any token. Use at least 256 random bits from a secret manager.

**Q38. What should never go in a JWT payload?**

Personal data such as email, phone or address, and anything secret. The payload is readable by every party that sees the token, including logs and proxies. Keep identifiers and authorization data only, or use JWE.

### OAuth 2.0

**Q39. What problem does OAuth 2.0 solve?**

Delegated authorization: letting an app access a user's resources on another service with limited scope and time, without the user's password. The user can revoke access later. It is not an authentication protocol by itself.

**Q40. Name the four OAuth roles.**

Resource owner, the user. Client, the app requesting access. Authorization server, which authenticates the user and issues tokens. Resource server, the API that accepts the tokens.

**Q41. Why does the authorization code flow use a code instead of returning the token directly?**

The browser redirect is a front channel that leaks into history, logs and Referer headers. A short-lived, single-use code is less valuable there. The client exchanges it for tokens on a direct back channel, with client authentication and PKCE.

**Q42. What is PKCE and what attack does it stop?**

The client sends a hash of a random verifier with the authorize request and the verifier itself at the token step. The server checks they match. An attacker who intercepts the code cannot redeem it without the verifier.

**Q43. When do you use client credentials?**

For service-to-service calls with no user, such as a batch job reading an API. The service authenticates as itself and receives a token representing itself. Scope it narrowly and rotate its secret.

**Q44. What does the state parameter protect against?**

Login CSRF, where an attacker completes the victim's callback with the attacker's code, logging the victim into the attacker's account. A random state bound to the browser session and checked on the callback rejects that. It can also carry the post-login return path.

**Q45. Why must redirect URIs match exactly?**

The authorization code is delivered to the redirect URI. Prefix or pattern matching lets attackers register look-alike URLs or chain open redirects to receive codes. Exact matching against pre-registered values closes that.

### OpenID Connect and the full login

**Q46. What is the difference between OAuth and OpenID Connect?**

OAuth delegates access to an API and says nothing reliable about who the user is. OIDC adds a signed ID token, addressed to the client, stating the user's identity at the provider. Use OIDC for login and never use an OAuth access token as proof of identity.

**Q47. How do you validate an ID token?**

Verify the signature against the provider's JWKS, then check iss equals the provider, aud equals your client id, exp is in the future and nonce equals the value stored for this login. Only then trust sub. Link the user by iss and sub.

**Q48. Why not identify users by email from the provider?**

Emails change, may be unverified and can be reassigned. Linking by email lets an attacker who controls your address at a weak provider log into your account. Use iss plus sub, and link by email only when it is verified and trusted.

**Q49. Walk me through "Sign in with Google" on a web app.**

Create state, nonce and a PKCE verifier, redirect to Google with the challenge, openid scope and an exact redirect URI. On callback, check state, exchange code and verifier, validate the ID token's signature, iss, aud, exp and nonce. Find or create the user by iss and sub, rotate into a fresh session and redirect into the app.

**Q50. What changed between early web logins and current practice?**

Early systems stored fast unsalted hashes, used long-lived session ids from URLs, and asked users for third-party passwords. Now passwords use memory-hard hashes, sessions use secure host-only cookies with rotation, and third-party access uses OAuth code flow with PKCE and OIDC. Short-lived tokens with rotation replaced long-lived bearer secrets.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Sessions and passwords

**E1** ● Wren's session records are 200 bytes. How much memory do 200,000 and 500,000 active sessions need?

**E2** ● Each login costs 250 ms of one core. How many cores does hashing need at 20 logins per second, and during a promotion at 60 per second?

**E3** ● Count the 10-character passwords over 62 symbols (letters in both cases and digits). How long does an exhaustive search take at $10^4$ guesses per second, and at $10^{10}$?

**E4** ● Wren raises bcrypt from cost 12 (250 ms) to cost 14. How long does one hash take now?

**E5** ● A stuffing attack replays 1,000,000 pairs with 0.5% reuse on Wren. How many accounts fall if 60% of reused accounts have MFA?

**E6** ● A spraying attack tries 3 passwords against 1,000,000 accounts, at most one attempt per account per hour. What is the minimum duration, and the average attempt rate in that hour?

**E7** ●● User 42 makes requests at 0, 10, 25, 50 and 300 minutes. The session has a 30-minute sliding idle timeout and a 12-hour absolute limit. When does the session end, and what happens at minute 300?

**E8** ●● Trace a session fixation attack against a Wren that does not rotate ids, then show which single line of code prevents it.

**E9** ●● Explain to a product manager, without jargon, why "log out of all devices" is easy with sessions and awkward with JWTs.

### Reset and tokens

**E10** ● A reset token is 32 random bytes. How many bits of entropy is that, and how many characters in hex?

**E11** ● Wren's access token is 560 characters. How many bytes per second do these headers add at 2,000 requests per second before HTTP/2 compression?

**E12** ● How many 15-minute access tokens can one 30-day refresh token produce at most?

**E13** ● Wren sees 10,000 logouts a day with 900-second access tokens. How many entries does a jti deny list hold on average?

**E14** ● An ES256 signature is 64 bytes and an RS256 signature 256 bytes. How many base64url characters is each, and how many characters does switching save per token?

**E15** ● A PKCE verifier is 43 base64url characters. How many bits of randomness can it carry?

**E16** ●● Two refresh requests leave a phone at the same moment with token R5. Trace what happens under strict reuse detection, and give two fixes.

**E17** ●● For each token, say which check rejects it: signed by staging with `iss` staging; `aud` analytics; `exp` one hour ago; `nbf` ten minutes ahead; `alg` none.

**E18** ●● Explain algorithm confusion to a junior developer without cryptographic notation, and the one-line fix.

### OAuth and OIDC

**E19** ●● Explain without jargon the difference between OAuth and OpenID Connect, using a hotel as the example.

**E20** ●● Trace a login CSRF attack against a Wren callback that ignores state, and show what the state check compares.

**E21** ●● List which parameter or check defends against each: intercepted code on mobile, code sent to a look-alike domain, planted callback, replayed ID token, token issued to another app.

### Proofs, code and design

**E22** ●●● Prove that rotating the session id at login defeats session fixation, given that the attacker can only learn or set ids issued before the login.

**E23** ●●● Derive the expected time for an attacker to crack one password chosen uniformly from an alphabet of $a$ symbols and length $L$, at rate $r$ guesses per second, and evaluate it for $a = 36$, $L = 8$, $r = 10^{10}$.

**E24** ●●● Write a Python login function with Argon2id that returns one generic error, hashes a dummy password for unknown users, and re-hashes when parameters are outdated.

**E25** ●●● Write the SQL schema and Python logic for refresh token rotation with family revocation on reuse.

**E26** ●●● Design Wren's full authentication system: password login with MFA, Google login, browser and mobile clients, sessions or tokens, reset, revocation, and the limits on each endpoint.

**E27** ●●● Count Wren's daily authentication load. Assume 432,000 password logins a day at 250 ms each, 200,000 active users who each refresh every 15 minutes for 4 hours, and 43,200,000 requests that each verify a token or session. Give CPU seconds and cores for hashing, refreshes per second, and verifications per second on average.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 200,000 × 200 = 40,000,000 bytes, and 500,000 × 200 = 100,000,000 bytes. Redis adds per-key overhead on top, often 50 to 100 bytes, so measure the real footprint.

**E2.** 20 × 0.25 = 5 cores, and 60 × 0.25 = 15 cores. Plan the login service for the promotion, or the hashing queue will push login latency up.

**E3.** $62^{10} = 839{,}299{,}365{,}868{,}340{,}224$. At $10^4$ per second that is $8.39 \times 10^{13}$ seconds, about 2,661,401 years. At $10^{10}$ per second it is $8.39 \times 10^{7}$ seconds, about 971 days. Length and a slow hash both matter.

**E4.** Each cost step doubles the time, so two steps multiply by 4: 250 × 4 = 1,000 ms. That quadruples Wren's hashing cores too.

**E5.** Reused accounts are 1,000,000 × 0.005 = 5,000. Those without MFA are 5,000 × 0.4 = 2,000.

**E6.** Three passwords at one per account per hour need at least 3 hours. Each hour covers 1,000,000 attempts, so the rate is 1,000,000 / 3,600 ≈ 277.8 per second, low enough to hide among normal login traffic at many sites.

**E7.** Each request pushes the idle deadline to 30 minutes later: 30, 40, 55, then 80 minutes after the request at 50. No request arrives before minute 80, so the session ends at 80 minutes. The request at minute 300 finds no session and gets 401, and the user must log in again. The 12-hour absolute limit was never reached.

**E8.** The attacker visits Wren and gets anonymous id AAA. They plant AAA in the victim's browser, for example via a cookie set from a compromised sibling subdomain. The victim logs in and the server writes user 42 into session AAA. The attacker requests `/me` with AAA and is user 42. The fix is to call the framework's rotate function, such as `request.session.cycle_key()`, right after the password check succeeds, which deletes AAA and issues a new id.

**E9.** With sessions, Wren keeps a list of every logged-in device on its own servers, so "log out everywhere" means crossing out every line on that list, and the next request from any device is refused. With JWTs, each device holds a signed pass that Wren's servers check by themselves without keeping a list, so there is nothing to cross out. To cancel them early, Wren has to start keeping a list again, or wait until the passes expire.

**E10.** 32 bytes × 8 = 256 bits, and hex uses 2 characters per byte, 64 characters.

**E11.** 560 × 2,000 = 1,120,000 bytes per second of Authorization headers. HPACK indexes repeated headers on one connection, so after the first request each repeat costs only a few bytes.

**E12.** 30 × 86,400 / 900 = 2,880 access tokens.

**E13.** 10,000 × 900 / 86,400 ≈ 104.17 entries on average, because each entry lives only for the remaining life of its token.

**E14.** Base64url needs ⌈64 × 8 / 6⌉ = 86 characters for ES256 and ⌈256 × 8 / 6⌉ = 342 for RS256. Switching saves 342 − 86 = 256 characters per token.

**E15.** 43 × 6 = 258 bits, at least 256 when generated from a secure random source.

**E16.** The first request reaches the server, R5 is retired and the response carries R6. The second request presents R5, which is now retired, so the server sees reuse and revokes the family, R5, R6 and the rest, and the user is logged out. One fix serialises refreshes in the client behind a lock, so only one request uses R5. Another allows a grace window of a few seconds in which a just-retired token returns the same R6 instead of triggering revocation.

**E17.** The staging token fails the `iss` check, or the key lookup if staging keys are not in production's JWKS. The analytics token fails `aud`. The expired token fails `exp`. The not-yet-valid token fails `nbf`. The `alg` none token fails the pinned-algorithm check before any claim is read.

**E18.** Our server stamps tokens with a private stamp and gives everyone a photo of the stamp, called the public key, so they can check it. A trick token says "check me the other way", using a method where the checker uses the same secret to stamp and to check. A careless library obeys and uses the photo as the secret. But the photo is public, so the attacker used it too and the stamps match. The fix is to tell the library which method to use, for example `algorithms=["RS256"]`, so it ignores what the token asks for.

**E19.** OAuth is a hotel giving a cleaner a key card that opens room 412 between 10 and 12, without telling anyone the guest's name. OpenID Connect is the front desk also handing over a signed slip saying "the person at this door is Asha Rao, checked in at 9:14, and this slip was written for you". A key card proves what the holder may open. Only the slip proves who someone is, and it names the business it was written for.

**E20.** The attacker starts "Sign in with Google" on Wren with their own Google account, captures the redirect to `/callback?code=X` and does not follow it. They send the victim a link or hidden image to that URL. The victim's browser calls Wren's callback with code X, Wren exchanges it and logs the victim in as the attacker. With state, Wren stores a random value in the victim's pre-login session before redirecting and compares it with the `state` in the callback. The attacker's link carries the attacker's state, which does not match the victim's session, so Wren rejects it.

**E21.** PKCE defends against an intercepted code on mobile. Exact redirect URI matching defends against a look-alike domain. State defends against a planted callback. The nonce defends against a replayed ID token. The `aud` check defends against a token issued to another app.

**E22.** Let $I_0$ be the set of ids issued before the login, which is everything the attacker can know or set. At login the server deletes the session for the presented id $s_0$ and creates a new id $s_1$ from a cryptographic generator, attaching the user to $s_1$ only. Since $s_1$ is drawn after the attacker's knowledge was fixed and independently of it, the attacker guesses $s_1$ with probability $2^{-128}$. The attacker's ids, all in $I_0$, are either deleted ($s_0$) or anonymous. So no id the attacker holds is attached to the user, and fixation fails except with negligible probability.

**E23.** There are $N = a^L$ equally likely passwords. Trying candidates in any fixed order, the correct one is equally likely to be at each position, so the expected number of tries is $(N + 1)/2 \approx N/2$, and the expected time is

$$T = \frac{a^L}{2r}.$$

Read it as half the search space divided by the guess rate. For $a = 36$, $L = 8$, $r = 10^{10}$: $36^8 / (2 \times 10^{10}) = 2{,}821{,}109{,}907{,}456 / 2 \times 10^{10} \approx 141$ seconds.

**E24.** Using the `argon2-cffi` library:

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(memory_cost=19456, time_cost=2, parallelism=1)
DUMMY = ph.hash("not-a-real-password")
GENERIC = "email or password is incorrect"

def login(db, email, password):
    user = db.find_user(email.strip().lower())
    stored = user.password_hash if user else DUMMY
    try:
        ph.verify(stored, password)
    except VerifyMismatchError:
        return None, GENERIC
    if user is None:
        return None, GENERIC
    if ph.check_needs_rehash(stored):
        db.set_password_hash(user.id, ph.hash(password))
    return user, None
```

Unknown users pay the same hashing cost as known ones and get the same message, so neither timing nor text reveals which emails exist.

**E25.** Each token row records its family and whether it was used.

```sql
CREATE TABLE refresh_tokens (
  token_hash  bytea PRIMARY KEY,
  family_id   uuid NOT NULL,
  user_id     bigint NOT NULL,
  used_at     timestamptz,
  revoked     boolean NOT NULL DEFAULT false,
  expires_at  timestamptz NOT NULL
);
```

```python
import hashlib, secrets

def refresh(db, presented):
    h = hashlib.sha256(presented.encode()).digest()
    with db.transaction():
        row = db.fetchone("SELECT * FROM refresh_tokens WHERE token_hash = %s FOR UPDATE", [h])
        if row is None or row.revoked or row.expires_at < db.now():
            return None
        if row.used_at is not None:
            db.execute("UPDATE refresh_tokens SET revoked = true WHERE family_id = %s", [row.family_id])
            return None
        db.execute("UPDATE refresh_tokens SET used_at = now() WHERE token_hash = %s", [h])
        new = secrets.token_urlsafe(32)
        db.execute("INSERT INTO refresh_tokens (token_hash, family_id, user_id, expires_at) VALUES (%s, %s, %s, now() + interval '30 days')",
                   [hashlib.sha256(new.encode()).digest(), row.family_id, row.user_id])
    return new, issue_access_token(row.user_id)
```

`FOR UPDATE` serialises concurrent uses of one token, so exactly one wins and any later presentation sees `used_at` set and revokes the family.

**E26.** Passwords are stored with Argon2id at m = 19 MiB, t = 2, p = 1, with a KMS pepper, and checked against a breached-password list at signup. Login is rate-limited at 5 failures per account per minute and 20 per IP per minute, with global failure-rate alerts, CAPTCHA after repeated failures, and TOTP or passkey MFA offered to all users and required for staff. Google login uses OIDC code flow with PKCE, state and nonce, linking by iss and sub. The browser app uses server sessions in a `__Host-sid` cookie with Secure, HttpOnly and SameSite=Lax, 30-minute sliding and 12-hour absolute expiry, rotation at login and MFA, and CSRF defences from Unit II. Mobile apps use OAuth code flow with PKCE against Wren's own auth server, receiving 15-minute RS256 access tokens and 30-day rotated opaque refresh tokens with reuse detection. Reset uses 256-bit hashed single-use tokens with a 30-minute expiry, a canonical host and revoke-all. A per-user session version and refresh-family revocation implement "log out everywhere", and a jti deny list handles urgent access-token revocation.

**E27.** Hashing costs 432,000 × 0.25 = 108,000 CPU seconds per day, an average of 108,000 / 86,400 = 1.25 cores, with peaks several times higher. Refreshes are 200,000 users × (4 × 60 / 15 = 16) = 3,200,000 per day, an average of 3,200,000 / 86,400 ≈ 37.04 per second. Verifications follow requests, 43,200,000 / 86,400 = 500 per second on average and 2,000 at peak, each a local signature check or one session lookup.

### Primary sources

[OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Argon2id, scrypt and bcrypt parameters and peppering.

[OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Session ids, expiry, rotation and fixation.

[RFC 7519, JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519) and [RFC 8725, JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725). Claims and verification pitfalls.

[RFC 6749, OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749), [RFC 7636, PKCE](https://www.rfc-editor.org/rfc/rfc7636) and [RFC 9700, OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700). Flows and current security guidance.

[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html). ID tokens, nonce and validation rules.

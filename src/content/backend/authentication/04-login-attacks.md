@part IV | Login attacks and defences | We study how attackers get into accounts without ever touching the password database. A login endpoint is a public oracle that answers "right or wrong" to anyone, and attackers query it at scale with breached passwords. We will cover timing leaks and user enumeration, credential stuffing and password spraying, and the layered limits that defend against them. | where:4

## 11. Timing attacks and constant-time comparison

Most string comparisons stop at the first differing byte. That makes them fast, and it also makes their running time depend on the secret. Suppose an endpoint checks a submitted API key with `==`, and the real key starts `a9f1`. A guess starting `b7` fails at the first byte. A guess starting `a3` fails at the second. A guess starting `a9f` fails at the fourth and takes slightly longer. By measuring response times, an attacker learns the key one byte at a time, needing about 256 guesses per byte instead of $256^{32}$ guesses for the whole key.

Over a network the difference is tiny, nanoseconds per byte, buried under milliseconds of jitter. But averaging thousands of measurements removes the jitter, and researchers have demonstrated such attacks across the internet and within cloud data centres, where the noise is lower. You should assume that a timing difference is measurable.

@fig be_pw_timing | Each matching byte adds a little time. The attacker reads the secret off the clock.

A **constant-time comparison** examines every byte whatever happens, so its duration reveals nothing about where the first mismatch was. Use the library function every time you compare a secret: `hmac.compare_digest` in Python, `crypto.timingSafeEqual` in Node.js, `subtle.ConstantTimeCompare` in Go, `MessageDigest.isEqual` in Java. That covers API keys, session tokens, CSRF tokens, reset tokens and HMAC signatures. Password hash verification functions already compare in constant time internally.

The same leak appears one level up, as **user enumeration**. If an unknown email returns in 3 ms with "no such user", while a known email spends 250 ms hashing and returns "wrong password", the attacker learns which emails have Wren accounts. That list is valuable on its own. It focuses credential stuffing, it enables targeted phishing ("your Wren order has a problem"), and for some services it reveals sensitive facts, such as membership of a health app. The fix is to run a dummy hash for unknown users, so both paths cost the same time, and to return one message for both, "email or password is incorrect". Signup ("this email is already registered") and reset pages leak the same way and need the same care, for example by sending an email to the address instead of answering on screen.

@fig be_pw_enumeration | Different timing or different text both reveal which accounts exist.

## 12. Credential stuffing and password spraying

Most account takeovers today involve no guessing at all. In **credential stuffing**, the attacker takes email and password pairs leaked from another site's breach and tries each one on Wren. Billions of such pairs circulate in combined lists. Many people reuse passwords, so a fraction of those pairs work on Wren. With 1,000,000 leaked pairs and an illustrative 0.5% reuse rate, 5,000 Wren accounts fall.

What makes stuffing hard to stop is its shape. Each account sees exactly one attempt, with that account's real former password. The attempts come from a botnet or a residential proxy service with tens of thousands of IP addresses, so each address makes only a few requests. A per-account limit of 5 failures per minute never triggers, and neither does a per-IP limit. To Wren's servers, the attack looks like a few thousand users who mistyped their passwords once.

@fig be_pw_stuffing | One attempt per account from thousands of addresses. Classic brute-force limits see nothing.

**Password spraying** turns brute force on its side. Instead of many passwords against one account, the attacker tries a few common passwords, such as `Summer2026!` or `Wren@123`, against every account. Three attempts across Wren's 1,000,000 accounts is 3,000,000 requests. Spread over three hours, that is about 278 requests per second, low enough to blend into normal login traffic at many companies. Spraying works best against organisations with predictable password rules, and it has been used against corporate single sign-on portals in several major intrusions.

@fig be_pw_spraying | A handful of passwords, a million accounts, never more than one try per account per hour.

:::story Picture this
A burglar with a bag of keys copied from flats in another city. They do not pick locks. They walk down your street trying one key in each door, once. No door sees anything unusual, but a few doors open, because some people use the same lock everywhere.
:::

## 13. Brute-force protection, rate limits and lockouts

No single limit catches every attack shape, so Wren layers them, and each layer targets a different pattern. A per-account limit of 5 failures per minute stops classic brute force against one user. A per-IP limit, 20 per minute for Wren, stops one noisy machine. A global alert on the login failure rate catches stuffing, because although each account and IP looks quiet, the total failure rate jumps from its normal 2% to 30%. Checking passwords against breach corpora, at signup and on successful login, removes the passwords stuffing relies on. The Have I Been Pwned "range" API lets a server check a password by sending only the first five hex characters of its SHA-1 hash and comparing the returned list locally, so the password itself never leaves Wren. Finally, multi-factor authentication makes a correct password insufficient on its own, which defeats all of the above.

@fig be_pw_limits | Five layers, each aimed at a different attack shape.

Hard lockouts, such as "locked for 24 hours after 5 failures", look strong and create a new attack. Anyone can lock any user out by failing on purpose, so an attacker with a list of emails can deny service to all of them, for example during a sale or against a competitor's staff. Prefer progressive delays that grow with each failure, a CAPTCHA after a few failures, a step-up check by email, and short locks that clear themselves. Return 429 with Retry-After for rate limits, and keep the login response identical for a locked account and a wrong password, so the lock itself does not confirm that the account exists.

:::warn Watch out
Rate limiting by IP alone breaks for users behind carrier-grade NAT, where thousands of mobile users share one address, and it does nothing against botnets. Key limits by account, by IP and by device fingerprint, and watch global rates too. Unit X builds the rate limiter itself.
:::

:::interview Interview lens
**"How do you protect a login endpoint against credential stuffing?"** Per-account and per-IP limits are necessary but not enough, since stuffing spreads one attempt per account across thousands of IPs. Add monitoring of the global failure rate and a breached-password check at signup and login, plus bot detection such as a CAPTCHA when traffic looks automated. Offer and encourage MFA, which defeats a correct stolen password. Keep responses uniform, so the attacker cannot even confirm which emails exist.
:::

:::key In one breath
Compare secrets with constant-time functions, and make unknown and known accounts look identical in timing and in text to prevent user enumeration. Credential stuffing replays breached pairs once per account from many IP addresses, and password spraying tries a few common passwords across all accounts. Defend with layered limits per account and IP, global failure monitoring, breached-password checks and MFA. Avoid hard lockouts, which hand attackers a denial-of-service tool.
:::

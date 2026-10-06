@part V | Password reset | We design the account recovery flow that bypasses the password entirely. Because reset grants access without knowing the password, it is the easiest path into an account when implemented carelessly. We will build the safe eight-step flow and then study the ways real reset implementations are exploited. | where:5

## 14. The reset flow

A reset link lets someone into an account without the password, so it is a password substitute that travels by email, and it needs the same care as a password. Wren's flow has eight steps.

First, the user submits an email address. Wren always replies "if an account exists for that address, we have sent a link", whatever the outcome, so the form cannot be used to find out who has an account. Second, if the account exists, Wren generates a token of 32 random bytes (256 bits) from a cryptographic generator. Third, it stores only `sha256(token)`, together with the user id. Fourth, it records an expiry 30 minutes ahead and a "used" flag. Fifth, it emails a link containing the raw token, built from a configured canonical host name, `https://app.wren.example/reset?t=...`.

When the link is opened, the sixth step validates it. Wren hashes the presented token, finds the matching row, and checks that it is unexpired and unused. Seventh, the user chooses a new password, which Wren checks against breached-password lists and hashes with Argon2id. Eighth, Wren marks the token used, deletes any other outstanding reset tokens for that user, revokes every existing session and refresh token, and emails the user that their password changed, with a link to report it if they did not.

@fig be_pw_reset_flow | Eight steps. The stored hash means a database leak does not leak working reset links.

Storing a hash of the token follows the same logic as password hashing. If the reset table leaks, its contents cannot be turned into working links. A fast hash such as SHA-256 is fine here, unlike for passwords, because the token is 256 random bits rather than something a human chose, so there is nothing to brute-force. The 30-minute expiry limits the damage of a link sitting in a mailbox. The single-use flag stops a link found later in browser history or a forwarded email from working a second time.

Revoking sessions in the last step matters more than it looks. Users often reset their password because something is wrong, such as a strange login notification or a suspicious order. An attacker who already holds a session would otherwise stay logged in after the reset, and the user would believe they had fixed the problem.

:::story Picture this
A locksmith who lets you into your flat when you have lost your keys. A good one asks for proof sent to your registered address, comes once, changes the lock behind you, and the proof expires that evening. A bad one leaves a spare key under the mat, labelled with your flat number, for anyone who asks politely.
:::

## 15. How reset implementations become exploitable

Four mistakes recur, and each turns the reset email into someone else's login. The first is **host header poisoning**. If the application builds the link from the incoming Host header, an attacker submits a reset request for user 42's email with `Host: evil.example`. User 42 receives a genuine email from Wren, correctly signed and from the right sender, whose link points at `https://evil.example/reset?t=...`. One click sends the token to the attacker, who then uses it on the real site. Several popular frameworks and applications have shipped exactly this bug. The fix is to build links from configuration, never from request headers, and to reject requests whose Host is not one you serve.

The second is **token leakage**. The token sits in a URL, so it lands in the web server's access logs, in browser history and in any analytics tool that records page URLs. If the reset page loads third-party scripts, images or fonts, the browser may send the URL to those third parties in the Referer header. Set `Referrer-Policy: no-referrer` on reset pages, keep third-party content off them, scrub the `t` parameter from logs, and have the page exchange the URL token for a short-lived form token as soon as it loads, so the URL becomes useless.

@fig be_pw_reset_bugs | Four common holes. Each one turns the reset email into someone else's login.

The third is missing expiry or reuse checks. A reset email left in a mailbox that is breached months later still works, and so does a link that was already used once. The fourth is leaving existing sessions alive after a reset, which keeps the attacker logged in, as the previous section explained.

Other variants show up in security reviews. Tokens built from a timestamp, the user id or a weak random generator can be predicted. Six-digit numeric reset codes sent by SMS have only 1,000,000 values, so without strict attempt limits they can be brute-forced within their lifetime. Flows that let a user change the email address and the password in one step let an attacker lock the real owner out of recovery. Security questions such as "your first pet's name" are guessable from social media and should not exist.

:::warn Watch out
Do not let the reset endpoint reveal whether an email exists, through its message, its timing or its rate-limit behaviour. Rate-limit reset requests per account and per IP as well, since an attacker can otherwise flood a victim's inbox or damage your email sender reputation.
:::

:::interview Interview lens
**"Design a password reset flow and tell me how it gets attacked."** Accept an email and always return the same response. Generate 256 random bits, store only their hash with a 30-minute expiry and a single-use flag, and email a link built from the configured host. On use, verify the hash, expiry and unused flag, set the new password, invalidate the token and all sessions, and notify the user. The classic attacks are host header poisoning of the link, token leakage through logs and Referer, tokens that never expire, and sessions that survive the reset.
:::

:::key In one breath
A reset link is a temporary password, so generate 256 random bits, store only their hash, expire it in 30 minutes and allow one use. Always answer the request with the same message, build links from a configured host name, and revoke every session after a successful reset. The common exploits are host header poisoning, token leakage through URLs, logs and Referer, missing expiry, and sessions that outlive the reset. Rate-limit the flow like a login, because it is one.
:::

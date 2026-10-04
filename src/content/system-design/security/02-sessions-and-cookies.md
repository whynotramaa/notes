@part II | Sessions and cookies | We preserve a login across requests. A session credential can be copied, fixed, or left valid after the user thinks it ended. We will trace session creation, cookie transport, expiration, rotation, and revocation. | where:2

## 5. A session links an opaque token to server state

Mira signs in successfully. The service creates an unpredictable token and stores a record identifying Mira, creation time, expiry, and other policy context. A **session** is authenticated application state continued across requests, commonly referenced by a client credential. An **opaque session token** carries no application meaning to the client; the server resolves it.

The next request presents the token, and the service looks up its current record before authorizing the requested action. The session record can be revoked centrally. Its identifier must be generated with a cryptographically secure source, protected during transport and storage, and excluded from ordinary logs.

@fig sd_security_session | Illustrative opaque-session flow. Resource authorization occurs after session resolution.

An illustrative thirty-two-byte random token has 256 bits and $2^{256}$ possible byte strings. This counts a chosen token space, not a universal prescription or an attack-success guarantee. Real security also depends on randomness quality, exposure, lifecycle, and endpoint controls. [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) covers those lifecycle concerns.

:::story Picture this
A cloakroom ticket is an opaque reference to a record held by the attendant. The ticket does not need to list the coat owner's private details. Anyone holding the ticket may try to use it, so hiding its meaning does not remove the need to protect the ticket itself.
:::

## 6. Cookies transport credentials under browser rules

A **cookie** is browser-managed state associated with a name, scope, and delivery attributes. The browser can automatically attach a session cookie to qualifying requests. This convenience also creates cross-site-request concerns because the application code did not explicitly add the credential for each action.

`Secure` restricts cookie delivery to secure transport under the browser's rules. `HttpOnly` prevents script access through the ordinary document cookie interface; it does not stop injected script from making authenticated requests. `SameSite` controls some cross-site sending behavior, with different modes and contextual rules. Domain and path select scope but are not replacements for resource authorization.

@fig sd_security_cookie | Illustrative cookie responsibilities. These controls reduce different risks and do not substitute for each other.

Browser cookie scope must be tested against the intended subdomains and paths. A broad domain can expose a credential to additional hosts under that domain, while a path attribute is not a security boundary against all same-origin code. Prefer deliberate host scoping and verify the provider or framework behavior. Cookie delivery policy is separate from the application resource predicate.

Use a deliberately scoped cookie and avoid broader domain access than needed. The application must also review lifetime, logout, rotation, and cross-site flows. A cookie marked HttpOnly is still a bearer credential on the wire. Do not log it or expose it in URLs because another copy can remain usable after the browser is protected.

## 7. Rotate after identity changes

An attacker persuades Mira to use a session identifier the attacker already knows, then waits for Mira to log in. **Session fixation** is an attack in which a known pre-authentication session becomes the victim's authenticated session. Regenerating the session identifier at authentication or privilege changes prevents that old reference from becoming the new credential.

The service creates a new authenticated session and invalidates the old identifier according to a controlled transition. It should not merely attach Mira's identity to the existing attacker-known token. The browser receives the new credential. Concurrent requests and old-session cleanup need defined behavior so the transition does not reopen the previous state.

@fig sd_security_rotation | Illustrative fixation-resistant session transition. A new credential accompanies the identity change.

Rotation also follows privilege changes and recovery flows where the policy requires it. A stolen old token should not retain elevated access after a new session is issued. Central session records help enforce invalidation, but distributed caches can delay it unless their consistency and lifetime are chosen deliberately.

:::note Login devices and session lists
A user can hold several sessions across devices. Revoking one device and revoking all sessions are different operations. Track session identities and creation context without collecting unnecessary sensitive device information. The UI action should map to the exact server-side revocation scope.
:::

## 8. Expiration and logout are server decisions

Mira clicks logout. Deleting a browser cookie does not revoke another stolen copy of the session token. **Revocation** makes a credential or its associated permission unusable before its ordinary expiry. For server sessions, invalidate the session record and clear the browser credential under the chosen scope.

A session can have both idle and absolute limits. An idle limit expires after no qualifying activity; an absolute limit expires regardless of activity. Define which requests renew idle activity so automated background calls do not unintentionally keep a session alive forever. Reauthentication for sensitive actions can establish a fresher assurance boundary.

@fig sd_security_logout | Illustrative server-side logout flow. Clearing the local cookie alone would leave another copy valid.

Fifty thousand illustrative two-hundred-byte session records occupy 10,000,000 raw bytes before indexes, replication, and runtime overhead. The session store's availability and cache policy influence login continuity. Do not keep sessions valid indefinitely to conceal an outage. State whether stale cached records can be used and what revocation delay that allows.

:::warn Watch out
An HTTP redirect to a login page is not a complete security response for every API client. Return an appropriate explicit authentication outcome, avoid leaking credentials, and make retry behavior clear. Clients should not repeatedly submit a revoked token in an infinite loop.
:::

:::interview Interview lens
**"What happens when a user logs out?"** The service invalidates the relevant server session and clears the browser credential. A stolen copy must fail against current validity, not remain accepted because the local cookie disappeared. Multiple devices need an explicit revocation scope. Cache and replication behavior determine any delay, which the security contract should state.
:::

:::key In one breath
An opaque session token references current server state and is itself a credential. Cookie attributes control specific browser behaviors but do not replace authorization or CSRF protection. Rotate session identifiers after identity changes and invalidate them at logout. Expiration, devices, cache delays, and session-store failure behavior are explicit lifecycle decisions.
:::

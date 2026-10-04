@part VIII | CORS, CSRF and abuse prevention | We examine requests a browser can send on someone else's behalf. Read restrictions and credential sending are different controls. We will trace CORS, CSRF, script injection implications, and layered limits for public resource use. | where:8

## 29. CORS controls browser access to responses

A page on an attacker origin requests Heron's API. The browser's **same-origin policy** restricts some cross-origin interaction according to origin rules. **Cross-Origin Resource Sharing**, or CORS, lets a server declare which browser origins may access eligible responses under a controlled protocol.

An **origin** combines scheme, host, and port under the web platform's definition. A server should compare allowed origins deliberately rather than reflect any received Origin value with credentials enabled. A **preflight** is a browser permission-check request for qualifying cross-origin operations before the actual request proceeds.

@fig sd_security_cors | Illustrative CORS boundary. Some requests do not require preflight, so no diagrammed step is a universal send barrier.

[MDN's CORS documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) explains browser enforcement and credentialed response rules. A non-browser client can send requests without that browser restriction. CORS does not authorize the user, protect a stolen token, or stop every cross-site request from being sent. Apply server authentication and resource policy independently.

:::story Picture this
A browser guard controls whether one office's script can read another office's returned document. That does not prove nobody can deliver an envelope to the other office. CSRF concerns an unwanted action sent with the victim's credentials, while CORS concerns allowed browser access to a response.
:::

## 30. CSRF abuses automatic credentials

Mira is logged in with a session cookie. Another site causes her browser to send a state-changing request to Heron, and the browser automatically attaches eligible cookies. **Cross-site request forgery**, or CSRF, tricks a browser into performing an unwanted authenticated action by exploiting automatic credential delivery.

The server needs an action-specific protection, such as a validated unpredictable CSRF token bound to the session or a reviewed equivalent pattern, plus origin checks where appropriate. Use safe methods for reads rather than state changes. SameSite cookies reduce some cross-site delivery but have contextual rules and should be evaluated alongside the full flow.

@fig sd_security_csrf | Illustrative cookie-authenticated CSRF attempt. A CORS read block alone does not establish that the state-changing request was rejected.

A CSRF token must not be accepted from an unrelated session merely because it has the expected length. Bind its verification to the authenticated session or reviewed double-submit construction and reject missing or mismatched proof. If a state-changing endpoint supports several content types, ensure none offers a simpler bypass of the intended action protocol.

[OWASP CSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) discusses token and browser-context defenses. Do not treat the presence of any header as secret proof if an attacker can cause or choose it under the relevant flow. Validate the protocol and bind the proof to the expected session and action context.

## 31. Script injection can use the authenticated page

An attacker-controlled report title becomes executable script in Heron's page. **Cross-site scripting**, or XSS, occurs when untrusted content executes in a site's context. It can read exposed credentials or perform actions with the user's browser authority even when an HttpOnly cookie prevents direct cookie reading.

Render untrusted text through the framework's safe escaping, avoid constructing executable HTML from arbitrary strings, and use carefully reviewed sanitization where rich markup is required. A content-security policy can reduce some execution paths, but it supplements correct handling rather than making arbitrary HTML safe. Different HTML, attribute, URL, and script contexts require appropriate treatment.

@fig sd_security_xss | Illustrative plain-text rendering path. Rich content requires an explicitly reviewed sanitization and policy path.

XSS can undermine CSRF proof by acting inside the legitimate origin. That relationship does not make CSRF defenses unnecessary; it shows why multiple boundaries matter. Avoid storing bearer credentials in unnecessarily script-readable places, and review third-party scripts that execute with the page's authority. Every included script expands the trusted code set.

:::note CORS and CSRF answer different questions
CORS determines whether the browser exposes eligible cross-origin responses. CSRF defenses determine whether an authenticated action is intentional under the chosen request protocol. A blocked response can follow an action already executed, so the two controls must not be substituted for one another.
:::

## 32. Abuse budgets protect more than request count

An anonymous caller repeatedly requests expensive fuzzy searches, password verification, and large downloads. **Abuse controls** bound resource use and harmful action patterns through admission, quotas, verification, and detection. A single global requests-per-minute rule cannot represent the different cost of every endpoint.

Heron's illustrative per-user allowance is one hundred requests per minute. Fifty thousand users could collectively be admitted five million requests per minute, or 83,333.333333 per second, if all consume that limit. This policy arithmetic is not the site's ordinary demand. Combine per-principal, per-network, per-resource, and global budgets as the threat and fairness requirements dictate.

@fig sd_security_abuse | Computed illustrative maximum admission under the stated independent-user policy. It is not measured traffic or guaranteed capacity.

A login rule allowing five attempts in sixty seconds rejects fifteen of twenty attempts in the simple single-identity exercise. Distributed attackers can change addresses or accounts, while harsh account-only limits can enable lockout abuse. Design response policy and monitoring together. Rate limiting, input-size limits, query budgets, and concurrency limits protect different resources.

:::warn Watch out
A failed CORS check is not evidence that the server refused the action. Some cross-origin requests are sent before response access is blocked. A state-changing endpoint needs its own credential, intention, and permission checks.
:::

:::interview Interview lens
**"CORS versus CSRF?"** CORS is a browser response-access protocol for cross-origin interactions. CSRF is an unwanted authenticated action exploiting automatic credentials. I would use explicit action protection and suitable cookie/origin policy for CSRF, while configuring CORS only for intended browser consumers. XSS can act inside the origin, so safe rendering and credential exposure controls remain separate requirements.
:::

:::key In one breath
CORS governs browser response access and is not user authorization or a universal request-send barrier. CSRF defenses protect intentional authenticated actions when credentials are automatic. XSS executes inside the site's authority and requires safe data handling plus supporting browser policy. Abuse prevention budgets the actual expensive actions and total capacity, not only one request counter.
:::

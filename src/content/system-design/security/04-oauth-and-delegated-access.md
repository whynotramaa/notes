@part IV | OAuth 2.0 and PKCE | We give one application limited access without sharing the user's password. A token response alone does not prove the intended login identity. We will trace OAuth roles, the authorization-code flow, PKCE, and consent and refresh boundaries. | where:4

## 13. Delegation is a different problem from login

Mira wants a clip-analysis application to read selected Heron media without learning her Heron password. **OAuth 2.0** is an authorization framework for delegated access. A client obtains a credential granting a defined scope to a resource service under an authorization server's policy.

The **resource owner** controls the relevant access, the **client** requests delegated access, the **authorization server** issues the grant and tokens, and the **resource server** enforces access to the API. These roles can share deployment infrastructure but have distinct responsibilities. A client identity is not the same as the user identity it represents.

@fig sd_security_roles | Illustrative OAuth role relationships. The authorization server's policy controls grants, while the API enforces the resulting permitted use.

**Scope** describes the permitted use of a grant, with semantics defined by the service. A token with read scope still needs resource ownership and tenant checks. Scope is not a universal string whose name automatically enforces a policy. The API must map it to actual allowed actions.

:::story Picture this
Mira authorizes a courier to pick up one package from a warehouse. She does not give the courier her master key. The warehouse recognizes a limited dated permission from a trusted office and still checks which package it names. That is delegated access, not sharing the owner's password.
:::

## 14. The authorization code is exchanged at another boundary

The client sends the user to the authorization server with a registered redirect URI and flow context. The user authenticates there and approves the requested access under policy. The server returns an **authorization code**, a short-lived one-use value, through the redirect. The client exchanges that code at the token endpoint under the flow's client and proof rules.

The browser redirect carries a code rather than treating the redirect URL as a permanent API credential. The authorization server checks that the redemption matches the intended client, redirect URI, and grant context. A confidential client authenticates as required; a public client cannot keep a secret merely because its source code contains one.

@fig sd_security_code | Illustrative authorization-code flow. Exact client authentication and proof rules follow the deployment and current OAuth security guidance.

The code exchange should occur through the intended secure endpoint and registered flow context. A client must not send the code to an arbitrary token URL supplied by untrusted input. The browser-facing redirect and server-facing exchange therefore have different validation responsibilities. Logging their full URLs can also expose sensitive one-use values during the flow.

[OAuth's security best current practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), documents secure flow choices and redirect, token, and client concerns. Follow current provider documentation for implementation. Do not invent a homegrown redirect matching rule or reuse the user's password as a client credential.

## 15. PKCE binds redemption to the initiating client

An attacker intercepts an authorization code. If that code can be redeemed alone, the attacker can obtain the resulting credential. **Proof Key for Code Exchange**, or PKCE, binds the code exchange to a secret value generated for this authorization attempt. The client creates a verifier and sends a derived challenge in the authorization request.

At redemption, the client supplies the verifier. The authorization server recomputes the challenge under the required method and compares it with the value associated with the code. Someone holding only the intercepted code lacks the verifier. The challenge is not a reusable client secret and must be created and bound correctly for each attempt.

@fig sd_security_pkce | Illustrative PKCE mechanism. H denotes the required challenge derivation, not an arbitrary hash choice.

The client also binds the browser response to its initiating context and validates expected authority and redirect behavior. A **state parameter** can carry a protected unpredictable correlation value for the flow under a reviewed protocol. OpenID Connect adds identity-specific rules, including nonce where applicable. Do not treat any one parameter as a complete defense for every flow confusion.

:::note OAuth is not automatically identity authentication
A delegated API token authorizes a resource use. For user login, OpenID Connect defines an identity layer and validation rules. An access token's existence is not enough to infer who logged in to the client. Validate the correct token type, issuer, audience, and flow context.
:::

## 16. Grants, refresh, and revocation need policy

Mira removes the clip-analysis application's access. The authorization server stops renewal and revokes the relevant grant according to policy. Existing access tokens may remain accepted until expiry unless the resource server checks current grant validity. That is the same local-validation tradeoff discussed earlier, now applied to delegated access.

A **consent record** captures approved access under the service's user and client policy. A refresh credential should remain scoped to that grant and protected against copying. Rotation or sender-constraining mechanisms can limit replay under the chosen design. A long-lived credential in a public repository or browser log defeats the separation delegation was meant to provide.

@fig sd_security_revoke_grant | Illustrative delegated-access revocation. Existing access validity follows the resource server's declared expiry or online-check rule.

Least-scope requests improve user comprehension and limit damage. Do not request all media writes when the app only reads a chosen clip. Client registration, redirect restrictions, token storage, and resource enforcement are part of the architecture. In an interview, draw the browser, client server, authorization server, and API separately so their credentials do not become interchangeable.

:::warn Watch out
A secret embedded in a browser or distributed mobile application is not a confidential client secret. The user and attacker can inspect distributed code. Use the flow and proof mechanisms appropriate to a public client instead of hiding a shared password in the bundle.
:::

:::interview Interview lens
**"Explain OAuth without saying login with a provider."** It lets a client receive limited delegated access to an API under an authorization server's policy without the user's password. The authorization-code flow separates user approval from token exchange, and PKCE binds redemption to the initiating attempt. Login identity needs an appropriate identity protocol and token validation. Scopes, grants, refresh, and resource ownership checks determine what the client can actually do.
:::

:::key In one breath
OAuth delegates limited resource use through distinct client, authorization-server, and resource-server roles. Authorization codes separate user approval from token exchange. PKCE binds redemption to a per-attempt verifier, while flow context and redirect rules prevent other confusions. Revocation must address the grant, refresh path, and residual access-token validity.
:::

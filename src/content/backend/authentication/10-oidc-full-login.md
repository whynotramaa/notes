@part X | OpenID Connect and the full login | We add identity on top of OAuth and assemble Wren's complete login. OAuth alone says what an app may do, and treating its tokens as proof of who the user is has caused real account takeovers. We will cover ID tokens and nonce, an OAuth security checklist, and Wren's "Sign in with Google" from click to session. | where:10

## 31. OpenID Connect: ID tokens and nonce

Wren wants "Sign in with Google". That is an identity question, who is this person, not a delegation question. **OpenID Connect** (OIDC, 2014) is an identity layer built on OAuth 2.0 by the OpenID Foundation, and Google, Microsoft, Apple, Okta and Auth0 all implement it. The client adds `openid` to its requested scopes, plus `email` or `profile` if it wants those, and the token response then includes an **ID token**. The ID token is a JWT signed by the provider that states who logged in. It carries `iss` (the provider), `sub` (a stable, unique id for the user at that provider), `aud` (the client's own client id), `exp` and `iat`, a `nonce`, and optionally `email`, `email_verified` and `auth_time`, the time the user last actually entered credentials.

@fig be_oidc_id_token | The access token is for the API. The ID token is for the client, and says who logged in.

The two tokens have different audiences, and mixing them up causes bugs. The access token is meant for the resource server, and the client should treat it as opaque, even when it happens to be a JWT. The ID token is meant for the client, which must validate it fully before trusting a single field. That means the signature against the provider's JWKS, `iss` equal to the expected provider exactly, `aud` equal to its own client id, `exp` in the future, and `nonce` equal to the value it sent. The `aud` check is the one that prevents a token issued to a different app, perhaps a malicious one the user also signed into with Google, from logging into Wren.

The **nonce** binds an ID token to one login attempt. Before redirecting, the client generates a random value, stores it in the user's pre-login session, and sends it in the authorize request. The provider copies it into the ID token. If an attacker replays an ID token captured from an earlier login, its nonce does not match the current session's nonce, and the client rejects it. State and nonce look alike, and both are random values tied to the session. State protects the callback request, and nonce protects the ID token, which matters because some flows deliver ID tokens through channels state does not cover.

@fig be_oidc_nonce | Generate, send, receive, compare. A replayed ID token carries a stale nonce.

:::warn Watch out
Identify users by the pair (`iss`, `sub`), never by email. Emails change, may be unverified, and some providers let users set any address. Linking accounts by email lets an attacker who registers your address at a weaker provider log into your Wren account. Link by email only when `email_verified` is true and the provider is authoritative for that domain.
:::

## 32. An OAuth and OIDC security checklist

The attacks in this part and the previous one reduce to a short list, which is worth memorising for interviews and for code review. Use the authorization code flow with PKCE for every client type, public or confidential. Register redirect URIs in advance and match them exactly. Bind `state` to the browser session and check it on every callback, and in OIDC send and check `nonce`. Keep client secrets only on servers, in a secret manager, and rotate them. Validate ID tokens fully, and never treat an access token as proof of identity. Request the smallest set of scopes, and handle `insufficient_scope` by asking again rather than by requesting everything up front.

@fig be_oauth_checklist | Seven rules. Each closes an attack described in Sections 27 to 31.

Token handling deserves its own lines. Tokens must never travel in URLs, which rules out the implicit flow and any API that accepts `?access_token=`. Authorization codes must be single-use and expire within seconds to a minute. If a code is presented twice, the authorization server should revoke the tokens issued from it, since one of the two presenters is an attacker. A refresh token from a third-party provider, such as the Google refresh token Wren keeps to add calendar events, is a long-lived credential to the user's account at another company. Encrypt it at rest in Wren's database with a key from a KMS, so a database leak does not hand an attacker access to thousands of Google calendars.

:::note OAuth 2.1
OAuth 2.1, in draft at the IETF, folds the security best practices into the core specification. It requires PKCE for all clients, removes the implicit and password grants, requires exact redirect URI matching, and bans bearer tokens in query strings. Designing to 2.1 today means designing to current best practice.
:::

## 33. Wren's login, end to end

User 42 taps "Sign in with Google". Wren's backend creates three random values, a state, a nonce and a PKCE verifier, and stores all three in a short-lived pre-login session tied to a cookie. It redirects the browser to Google's authorize endpoint with its client id, the exact registered redirect URI, `scope=openid email`, the state, the nonce and the PKCE challenge. Google authenticates the user, by password, passkey or an existing Google session, and shows the consent screen on first use. Google then redirects back to `https://app.wren.example/callback` with a code and the state.

Wren's callback handler compares the state with the one in the pre-login session, then posts the code and verifier to Google's token endpoint along with its client secret. It receives tokens and validates the ID token: the signature against Google's JWKS, `iss` equal to `https://accounts.google.com`, `aud` equal to Wren's client id, `exp` in the future and `nonce` matching. Then it looks up the Wren user linked to the pair (`https://accounts.google.com`, `sub`). If none exists, it creates one, or offers to link to an existing account after the user proves they own it.

Finally Wren discards the pre-login session, which rotates the session id as Part I required, creates a fresh `__Host-sid` session for user 42, and redirects into the app. From this point every request is ordinary session authentication. Google proved identity once, and Wren's own session carries it, with Wren's own expiry and revocation rules. Google's tokens are used only if Wren needs to call Google's APIs.

@fig be_auth_e2e | Eight steps from click to cookie. The orange step is where identity is actually established.

Each piece of this unit has one job, and knowing the jobs tells you which piece failed in an incident. Password hashing makes a stolen table useless, and limits and MFA make guessing useless. Sessions remember a login in a way that can be revoked. The reset flow recovers access without a backdoor. Access and refresh tokens split short proof from long renewal. OAuth delegates access, and OIDC states identity. What this unit did not cover is what user 42 may do once identified. That is authorization, the subject of Unit IV.

@fig be_auth_components | One job per component. Knowing which job each does tells you which one failed.

:::interview Interview lens
**"What is the difference between OAuth and OpenID Connect?"** OAuth 2.0 is delegated authorization. It gives a client an access token to call an API on the user's behalf, and says nothing reliable about who the user is. OpenID Connect adds an identity layer. With the openid scope, the provider also returns a signed ID token whose sub, iss and aud tell the client who logged in and that the token was meant for it. Use OIDC for login, OAuth for API access, and never use an OAuth access token as proof of identity.
:::

:::key In one breath
OpenID Connect adds a signed ID token to OAuth, stating who logged in, which the client validates by signature, iss, aud, exp and nonce. Users are identified by the issuer and subject pair, not by email. The checklist is code flow with PKCE, exact redirect URIs, state and nonce, server-only secrets, full ID token validation and minimal scopes. Wren's Google login ends by rotating into an ordinary session, so after login everything works as in Part I.
:::

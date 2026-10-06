@part IX | OAuth 2.0 | We learn how one application gets limited access to a user's data on another service without seeing the user's password. Before OAuth, apps asked for your email password to read your contacts, and kept it. We will cover the four roles, the authorization code flow, PKCE, client credentials with scopes and consent, and the redirect and state attacks. | where:9

## 26. Actors and delegated authorization

Wren wants to add a delivery reminder to user 42's Google Calendar. Around 2007 the usual way to do this was to ask for the user's Google password and log in as them, and many sites did exactly that to import contacts. That gave the app full access to everything, forever, with no way to revoke it short of changing the password. Google could not tell the app's logins from the user's. **OAuth 2.0** (RFC 6749, 2012) replaced it with **delegated authorization**, where a user grants an application limited access to their data on another service, the service issues a token for that limited access, and the user can revoke it later.

OAuth has four roles. The **resource owner** is the person who owns the data, user 42. The **client** is the application asking for access, Wren. The **authorization server** authenticates the user, asks for consent and issues tokens, here `accounts.google.com`. The **resource server** holds the data and accepts the tokens, here the Google Calendar API. The client never sees the user's Google password. It receives an access token limited in scope, such as "add events", and in time.

@fig be_oauth_actors | Four roles. The authorization server issues the token, and the resource server accepts it.

The same roles appear inside one company. When Wren builds its own auth server for its mobile apps, Wren's auth service is the authorization server, the orders API is a resource server, and the Wren iOS app is a client. Using OAuth internally gives the mobile apps the same standard flows, libraries and security reviews that third parties use.

OAuth answers one question: may this app act for this user on this API? It does not reliably answer who the user is. That second question needs OpenID Connect, in Part X. Using a plain OAuth access token as proof of identity, for example by calling a "get profile" endpoint with whatever token the client presents, has caused real account takeovers, because a token issued to any other app the user has authorised could be replayed to yours.

## 27. The authorization code flow

The **authorization code flow** is the main OAuth flow for any app with a user. It runs in two halves, one through the user's browser and one directly between servers.

In the first half, Wren's backend redirects the browser to Google's `/authorize` endpoint with query parameters: its `client_id`, the `redirect_uri` where the user should come back, the requested `scope`, a random `state`, and a PKCE challenge. Google shows its login page if needed, then a consent screen listing what Wren asks for. If the user approves, Google redirects the browser back to Wren's redirect URI with a short-lived, single-use **authorization code** and the same state.

In the second half, Wren's backend calls Google's `/token` endpoint directly, server to server, over TLS. It sends the code, its client credentials, and the PKCE verifier. Google checks everything and returns the access token, usually a refresh token, and, if OpenID Connect was requested, an ID token.

@fig be_oauth_code_flow | The browser carries only a short-lived code. Tokens travel on a direct back-channel call.

The extra step exists because the browser redirect is a leaky channel. URLs land in browser history, server logs, Referer headers and browser extensions. A code that is useless without the client's credentials and verifier, and that expires within a minute or so and works only once, can survive that exposure. Tokens could not.

:::story Picture this
A valet key for your car. You do not hand over your house keys. The car maker issues a special key that opens the doors and starts the engine but not the boot or the glovebox, and you can cancel it at any time. The authorization code is the claim ticket the valet desk gives you, which the valet exchanges for that key at the back office.
:::

:::note The implicit flow is gone
OAuth 2.0 originally had an implicit flow that returned the access token directly in the redirect URL, for browser apps without a backend. It leaked tokens into history and logs and could not use PKCE. The OAuth 2.0 Security Best Current Practice (RFC 9700, 2025) deprecates it, and every new browser app uses the code flow with PKCE.
:::

## 28. PKCE

The authorization code in the redirect can be intercepted, and on mobile this is easy. A Wren app on Android registers a custom URL scheme, such as `wren://callback`, to receive the redirect. A malicious app installed on the same phone can register the same scheme, and the operating system may hand the redirect, code included, to the malicious app. In browsers, codes can leak through logs, Referer headers and extensions. A public client such as a mobile app has no client secret to protect the token step, since anything embedded in the app can be extracted, so a stolen code would be as good as tokens.

**PKCE** (Proof Key for Code Exchange, RFC 7636, pronounced "pixie") binds the code to the client instance that started the flow. Before redirecting, the client generates a random **code verifier**, 43 to 128 characters long. It sends only a hash of it, the **code challenge**, in the authorize request.

$$\text{challenge} = \text{base64url}(\text{SHA-256}(\text{verifier}))$$

Read it as the challenge being the encoded hash of the verifier, which can be published because the hash cannot be reversed. The authorization server stores the challenge along with the code it issues. At the token step, the client sends the verifier itself. The server hashes it and compares the result with the stored challenge. An attacker who intercepted the code never saw the verifier, which stayed inside the legitimate app, so their exchange fails.

@fig be_oauth_pkce | The challenge goes out on the front channel, and the verifier only on the back channel.

PKCE was designed in 2015 for public clients, and current guidance requires it for every client, including server-side apps that have a secret. The reason is code injection, where an attacker gets a stolen code redeemed inside the victim's session. A client secret does not prevent that, because the legitimate client redeems the code with its own secret. PKCE does, because the injected code was issued against a different verifier.

## 29. Client credentials, scopes, consent and refresh

Not every caller is a user. Wren's nightly billing job needs to read all of yesterday's orders from the orders API. In the **client credentials** flow, the job authenticates to the authorization server as itself, using its own client id and secret or a signed assertion, and receives an access token that represents the job. There is no user, no browser and no consent screen. The token's subject is the client, and the orders API authorises it as a service account. Keep these tokens short-lived, around 10 minutes, scope them narrowly, and give each job its own client so one leaked secret does not expose every integration.

@fig be_oauth_client_credentials | A service authenticates as itself. The token represents the job, not a person.

**Scopes** name the permissions a token carries, such as `email`, `calendar.events` or Wren's own `orders:read`. The client asks for the scopes it needs. The user sees them in plain language on the **consent** screen, and the token records what was granted, which may be less than requested if the user unticks some. The resource server checks the scope for each endpoint. A call to `POST /events` without `calendar.events` gets `403` with an `insufficient_scope` error in the WWW-Authenticate header, so the client knows to ask for more. Ask for the smallest set. Users decline broad requests, app stores and providers review apps that ask for sensitive scopes, and every extra scope enlarges what a leaked token can do.

Refresh tokens from the code flow let the client get new access tokens later without showing the consent screen again. They stay valid until the user revokes the grant in their account settings, the provider expires it, or the user changes their password, depending on the provider's policy. Clients must handle a refresh failure gracefully by sending the user through the flow again.

@fig be_oauth_scopes | Consent is granted per scope, and the API enforces scope per endpoint.

## 30. Redirect URIs, state and the attacks on them

The redirect URI decides where the authorization code is delivered, so attackers aim at it. If the authorization server compares redirect URIs loosely, for example with a prefix match on `https://app.wren.example`, an attacker can send a victim to an authorize URL with `redirect_uri=https://app.wren.example.evil.example/cb`. The prefix matches, the user logs in and consents to what looks like Wren, and the code goes to the attacker. An open redirect anywhere on Wren's domain can be chained in the same way, with a redirect URI that bounces the code onward. Authorization servers must compare redirect URIs against values registered in advance, by exact string match, and clients must register the fewest URIs possible.

@fig be_oauth_redirect_attack | A prefix check passes the attacker's domain. Exact matching plus PKCE closes it.

The `state` parameter protects the client against **login CSRF**. Without it, an attacker starts their own "Sign in with Google" on Wren, logs in with their own Google account, and stops just before the browser follows the redirect back. They now hold a URL, `https://app.wren.example/callback?code=ATTACKERS_CODE`. They get the victim's browser to load it, through a link or a hidden image. Wren's callback exchanges the code and logs the victim in, as the attacker. If the victim then saves a delivery address or a payment card, it lands in the attacker's account, where the attacker can see it.

A random state value fixes this. Before redirecting, Wren generates a state, stores it in the user's pre-login session, and puts it in the authorize URL. On the callback, it compares the returned state with the one in the session. The attacker's planted URL carries the attacker's state, which does not match the victim's session, so Wren rejects it.

@fig be_oauth_state | A planted code logs the victim into the attacker's account. State ties the callback to the browser that started it.

:::warn Watch out
Client secrets belong only on servers. A secret embedded in a mobile app or a single-page app's JavaScript can be extracted in minutes, so those apps are public clients and must rely on PKCE. Rotate server-side secrets, keep them in a secret manager, and prefer private-key JWT client authentication where the provider supports it.
:::

:::interview Interview lens
**"Walk me through the OAuth authorization code flow with PKCE, and what each parameter defends against."** The client creates a verifier and sends its SHA-256 challenge, along with client_id, an exactly registered redirect_uri, scopes and a random state, to /authorize. After login and consent, the server redirects back with a single-use code and the state. The client checks the state against its session, which blocks login CSRF, then exchanges the code and verifier at /token over a back channel. Exact redirect matching stops code theft by redirection, PKCE stops redemption of an intercepted code, and the short code lifetime limits replay.
:::

:::key In one breath
OAuth 2.0 lets a user delegate limited access to a client, with an authorization server issuing tokens that a resource server accepts. The authorization code flow sends only a short-lived code through the browser and exchanges it for tokens on a back channel, and PKCE binds that exchange to the client that started it. Client credentials serve service-to-service calls, and scopes limit what each token may do. Exact redirect URI matching stops code theft, state stops login CSRF, and client secrets live only on servers.
:::

@part VI | JSON Web Tokens | We take apart a JSON Web Token, its claims, its signature and the keys behind it. JWTs let many services verify a user without calling a central store, which is useful and easy to misuse. We will cover the structure and registered claims, HS256 versus RS256 and ES256, JWKS and key rotation, and when an opaque token is the better choice. | where:6

## 16. Structure and claims

Wren is splitting its backend into services for orders, payments and the menu, and each of them must know who is calling. If every service asked the central session store on every request, all of them would depend on that store, and the store would see the sum of everyone's traffic. A **JSON Web Token** (JWT, RFC 7519, 2015) takes a different approach. It carries the identity inside the token, signed, so any service holding the right key can check it locally without a network call.

A JWT is three base64url strings joined by dots. The **header** names the algorithm and the key, for example `{"alg":"RS256","typ":"JWT","kid":"2026-10"}`. The **payload** holds **claims**, which are statements about the subject. The **signature** is computed over the encoded header, a dot and the encoded payload. For Wren's access token the three parts are 58, 158 and 342 characters long, 560 characters in all with the two dots, and that string travels on every API call. Base64url is an encoding, not encryption. Anyone holding the token can paste it into a decoder and read the payload, so the signature protects only against changes, never against reading.

@fig be_jwt_anatomy | Header, payload and signature. Only the signature depends on a secret, and anyone can read the rest.

RFC 7519 registers seven claims, each answering one question. `iss` (issuer) says who made the token, here `https://auth.wren.example`. `sub` (subject) says whom it is about, user `42`, written as a string. `aud` (audience) says who should accept it, `api.wren.example`, and can be a list. `exp` (expiry) and `nbf` (not before) bound when it is valid, as Unix timestamps in seconds. `iat` (issued at) records when it was created. `jti` (JWT ID) is a unique identifier, used to revoke one token or detect replays.

Applications add their own claims. Wren adds `scope`, listing what the token allows, such as `orders:read`. For Wren's token, `exp − iat = 1,791,367,200 − 1,791,366,300 = 900` seconds, the 15-minute lifetime. Keep custom claims small and stable. Every byte goes out on every request, and anything in a token stays there until it expires, so a role removed from a user at 10:00 is still in their tokens until 10:15.

@fig be_jwt_claims | Wren's access token. The two orange claims are the ones most often left unchecked.

## 17. Signing and verification: HS256, RS256 and ES256

The `alg` header names one of a few algorithm families. **HS256** is an HMAC using SHA-256 and a single shared secret. The same key both signs and verifies, so every service that can check a token can also create one. If the payments service has the secret, a bug in payments lets an attacker mint tokens accepted by orders. **RS256** signs with an RSA private key and verifies with the matching public key. **ES256** does the same with an elliptic-curve key on the P-256 curve, and its signatures are 64 bytes instead of RSA's 256 bytes, which saves 256 characters per token after encoding. EdDSA with Ed25519 is a newer option with similar size and simpler implementation. With any asymmetric algorithm, only the auth server holds the private key, and every other service gets the public key, so it can verify tokens but never forge them.

@fig be_jwt_hs_vs_rs | With HMAC, every verifier is a potential forger. With signatures, verifiers cannot mint tokens.

Verification has a fixed order, and getting the order wrong is how most JWT bugs happen. Parse the token into its three parts. Choose the verification key by `kid`, and take the algorithm from your own configuration for that key, never from the token's header. Verify the signature and reject on failure. Only then read the payload and check the claims, `iss`, `aud`, `exp` and `nbf`. Only after all of that may the code trust `sub` and `scope`. Good libraries do this in one call, given the expected algorithms, issuer and audience, and the main job is to pass those arguments every time.

@fig be_jwt_verify_steps | Nothing in the payload can be trusted until the signature check passes.

:::story Picture this
A wax seal on a letter. Anyone can read the letter, because the seal hides nothing. But only the holder of the signet ring can make that seal, and anyone with a picture of the ring's pattern can check it. HS256 hands every recipient a copy of the ring itself. RS256 gives them only the picture.
:::

## 18. JWKS and key rotation

Signing keys must change. A key may leak, an employee with access may leave, a compliance rule may demand yearly rotation, or the algorithm may need an upgrade. If every service has the public key pasted into its configuration, rotation means redeploying everything at the same moment. A **JWKS** (JSON Web Key Set) avoids that. The auth server publishes its current public keys as a JSON document at a well-known URL, typically `/.well-known/jwks.json`, each key tagged with a `kid`. Services fetch the set, cache it for some minutes, and pick the key whose `kid` matches the token's header.

Rotation has to overlap, because caches and tokens both lag. Wren publishes the new key `2026-10` two days before using it, so every service's cached JWKS includes it by the time the first token signed with it arrives. On day four the auth server switches signing to the new key. The old key `2026-09` stays published until every token it signed has expired, which for 15-minute access tokens is shortly after the switch. Then it is removed from the set.

@fig be_jwt_jwks | Publish before signing, and keep the old key until its last token expires.

Services need one more rule. When a token arrives with a `kid` they do not know, they should refetch the JWKS once before rejecting, since the key may be newer than their cache. That refetch must be rate-limited, otherwise an attacker sending tokens with random `kid` values makes every service hammer the auth server.

## 19. JWT versus opaque tokens

An **opaque token** is a random string, like a session id, that means nothing without a lookup. A service that receives one asks the token store, or calls the auth server's introspection endpoint (RFC 7662), to find out who it belongs to. Comparing the two kinds clarifies when each fits.

A JWT verifies locally with no network call. That suits a system with many services, high request rates, or services in other regions far from the auth server. But it cannot be revoked before `exp` without adding state, its claims can go stale, and it makes every request larger by its size. An opaque token needs a lookup or introspection call per request, which adds latency and a dependency. In return it can be revoked with one delete, it always reflects current permissions, and it reveals nothing to anyone who holds it, which matters when tokens pass through third parties.

@fig be_jwt_vs_opaque | Local verification against instant revocation. Most systems use both, for different tokens.

The common hybrid uses each where it fits. Short-lived JWT access tokens are verified locally by every service, so the request path needs no lookups. Opaque refresh tokens are stored server-side and checked only when renewing, every 15 minutes, so revocation is one step away. Part VII builds that design.

:::warn Watch out
Do not put a JWT in a cookie, call the system stateless, and then check a server-side deny list on every request. You have built a session store with extra parsing. If every request already does a lookup, a plain opaque session id is simpler and smaller.
:::

:::interview Interview lens
**"When would you choose RS256 over HS256?"** Whenever a verifier should not be able to mint tokens, which means any system with more than one service, or any third party verifying. With HS256 the shared secret lets every verifier forge tokens, and a leak from any of them compromises all. RS256 or ES256 keeps the private key on the auth server only, and verifiers fetch public keys from a JWKS endpoint, which also makes rotation clean. HS256 is acceptable only when the same service both signs and verifies.
:::

:::key In one breath
A JWT is a base64url header, payload and signature, readable by anyone and trustworthy only after the signature verifies. The registered claims are iss, sub, aud, exp, nbf, iat and jti, and Wren's access token lives exp minus iat, which is 900 seconds. HS256 shares one secret, while RS256 and ES256 let verifiers check without being able to forge, using keys published in a JWKS and rotated with overlap. JWTs verify locally but resist revocation, while opaque tokens need a lookup but die with a single delete.
:::

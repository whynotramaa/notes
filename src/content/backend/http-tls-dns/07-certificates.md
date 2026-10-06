@part VII | Certificates and trust | We learn why a client believes that the server holding a key really is `api.wren.example`. Encryption with an impostor is worthless, and an expired or misconfigured certificate takes a whole service offline at once. We will build the chain from root to leaf, list the checks a client runs, handle revocation with OCSP and stapling, and finish with HSTS, pinning and TLS termination. | where:7

## 25. Certificate authorities and the chain

Key exchange alone proves nothing about who is on the other end. An attacker on the cafe Wi-Fi could run one Diffie-Hellman exchange with your phone and another with Wren, then pass traffic between them, reading everything. This is a **man-in-the-middle** attack. Both encrypted channels are perfectly secure. The problem is that one of them leads to the wrong party. The client needs proof that the key it is talking to belongs to `api.wren.example`.

A **certificate** is that proof. It is a signed document that binds a public key to one or more names, with a validity period and a serial number, issued by a **certificate authority** (CA). The standard format is X.509. When Wren applies for a certificate, the CA checks that Wren controls the domain, usually by asking it to serve a random token at a URL or publish it in a DNS TXT record. That automated check is the ACME protocol, which Let's Encrypt introduced in 2015 and which made free certificates normal.

Trust is arranged as a **chain**. A **root CA** certificate is self-signed and ships pre-installed in the operating system or browser trust store, which holds roughly 150 roots. Root private keys are kept offline in hardware security modules and used rarely. Roots sign **intermediate CA** certificates, and intermediates sign the **leaf** certificate for your domain. During the handshake the server sends its leaf plus the intermediates. The client walks up the chain, checking each signature with the public key in the next certificate up, until it reaches a root it already trusts.

@fig be_cert_chain | Each certificate is vouched for by the one above it. Only the root must already be on the client.

The most common chain bug is a server that sends only its leaf. Browsers often paper over it by fetching or caching the missing intermediate, so the site looks fine in a browser. Then a Java or Python client, which does not do that, fails with "unable to get local issuer certificate". Always configure the full chain file.

:::story Picture this
A passport is trusted because a government issued it, and the government is trusted because your country recognises it. The border officer does not phone the issuing government for each traveller. They check the seal and the security features against a list of known issuers kept at the desk. The trust store is that list, and an intermediate CA is a regional passport office with its own authorised seal.
:::

## 26. Certificate validation, SAN and expiry

Before sending a single HTTP header, the client runs a fixed list of checks, and any failure ends the connection. The chain must end at a trusted root, and every signature on it must verify. The current time must fall between the certificate's `notBefore` and `notAfter` dates. The host name the client asked for must appear in the **Subject Alternative Name** (SAN) extension, the list of names the certificate covers. Wren's leaf lists `api.wren.example`, and a wildcard such as `*.wren.example` would match exactly one label, so it covers `api.wren.example` but not `v2.api.wren.example`. The certificate must not be revoked. Finally the server must prove it holds the matching private key, which TLS 1.3 does with the CertificateVerify signature.

@fig be_cert_validate | Six checks, all mandatory. Skipping any one of them reopens the impostor attack.

Expiry is the check that most often takes real services down. Microsoft Teams, Spotify and many others have had outages from a forgotten certificate, and the outage is instant and total at the expiry second. Wren uses 90-day certificates from an ACME authority and renews at day 60, which leaves 30 days to notice that renewal broke. Short lifetimes are deliberate. They limit how long a stolen key is useful, and they force automation, since nobody renews by hand every two months. The CA/Browser Forum voted in 2025 to cut the maximum lifetime of public certificates in stages, to 200 days in 2026, 100 days in 2027 and 47 days in 2029.

@fig be_cert_expiry | Renewing at two thirds of the lifetime leaves a month of margin.

:::warn Watch out
Never disable certificate verification in production clients, such as `verify=False` in Python requests or `InsecureSkipVerify` in Go. It usually starts as a quick fix in a test environment and ships by accident. After that, anyone in the network path can impersonate your dependency. Add the internal CA to the client's trust store instead.
:::

## 27. Revocation, OCSP and OCSP stapling

Sometimes a certificate must stop working before it expires, for example when its private key leaks or the domain changes owner. Revocation tells clients to stop trusting it. The original mechanism is the **CRL** (certificate revocation list), a signed list of revoked serial numbers that clients download. CRLs grew to megabytes, which made them too slow to fetch during a handshake. **OCSP** (Online Certificate Status Protocol) lets the client ask the CA's responder about one certificate and get a signed "good" or "revoked" answer.

OCSP has its own problems. It adds a round trip to a third party in the middle of the handshake. It tells the CA which sites each user visits. And when the responder is slow or unreachable, browsers "soft fail" and accept the certificate anyway, because failing hard would make every CA outage a web outage. An attacker who can block traffic to the responder therefore defeats the check entirely.

**OCSP stapling** moves the query to the server. Every few hours, Wren's server fetches a signed, time-limited OCSP response for its own certificate and attaches it to the handshake. The client checks the CA's signature on that response without contacting anyone. That removes the extra round trip and the privacy leak.

@fig be_cert_ocsp | Stapling removes the third-party round trip and the privacy leak.

The industry is now moving away from online revocation altogether, toward short-lived certificates that expire before revocation would matter. Let's Encrypt stopped its OCSP service in 2025 for this reason, and browsers instead push compact lists of revoked certificates to clients, such as Firefox's CRLite.

## 28. HSTS, certificate pinning and TLS termination

HTTPS has a weak first moment. A user types `wren.example` into the address bar. The browser tries `http://` first, and an attacker on the network can intercept that plain request and keep the user on HTTP, forwarding everything to the real site over HTTPS. This is SSL stripping. **HSTS** (HTTP Strict Transport Security) fixes every later visit. The response header `Strict-Transport-Security: max-age=31536000; includeSubDomains` tells the browser to use only HTTPS for this domain for the next year, and to refuse certificate errors without offering a click-through. Sites on the browser **HSTS preload list**, compiled into Chrome and copied by other browsers, are HTTPS-only from the very first visit.

@fig be_tls_hsts | After one HTTPS response, the browser rewrites http links itself and never sends the plain request.

**Certificate pinning** means a client accepts only specific keys for a host, rather than any certificate from any trusted CA. Banking apps sometimes pin to protect against a compromised or coerced CA. The risk is self-inflicted outage. If the pinned key has to change in a hurry, every installed copy of the app fails until users update, which can take weeks. Browsers removed HTTP header pinning (HPKP) in 2018 after sites bricked themselves with it. If you pin, pin the CA or intermediate key rather than the leaf, keep a backup pin, and keep a remote switch that turns pinning off.

**TLS termination** is the point where encryption ends. Wren's load balancer holds the certificate, decrypts incoming traffic and forwards plain HTTP to the four app instances on a private network. That keeps certificates in one place, lets the balancer route on paths and headers, and spares the app instances the handshake CPU. The cost is that traffic inside the network is readable by anything that gets in. Higher-security setups re-encrypt from the balancer to the backends, or use mutual TLS between services, as Unit XI shows.

@fig be_tls_termination | The balancer terminates TLS. Inside, traffic is plain or re-encrypted, depending on how far you trust the network.

:::interview Interview lens
**"Your TLS certificate expired in production. What happens and how do you prevent it?"** Every client that validates certificates fails the handshake at the expiry second. Browsers show a full-page error and API clients throw exceptions, so the outage is total. The fix is to deploy a renewed certificate and reload the TLS terminators. Prevention is automated ACME renewal at two thirds of the lifetime, a probe that alerts below 14 days remaining, and an inventory of every certificate, including internal ones that nobody remembers.
:::

:::key In one breath
A certificate binds a public key to names, and clients trust it by walking a chain from the leaf through intermediates to a root in their trust store. Validation checks the chain, the signatures, the validity dates, the SAN host name, revocation and proof of the private key. OCSP stapling lets the server deliver fresh revocation status, while short lifetimes and automated renewal are replacing revocation. HSTS stops downgrade to HTTP, pinning trades CA risk for outage risk, and TLS termination at the load balancer centralises certificates at the cost of plain traffic inside.
:::

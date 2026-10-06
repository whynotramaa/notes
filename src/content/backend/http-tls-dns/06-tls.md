@part VI | TLS and the handshake | We build TLS from the problem it solves to the exact messages of a TLS 1.3 handshake. Without it, anyone on the network path can read passwords and rewrite responses, and with a weak version they can decrypt traffic recorded years ago. We will cover why HTTPS exists, symmetric and asymmetric encryption, ECDHE and forward secrecy, the handshake itself, resumption and 0-RTT, and the SNI and ALPN extensions. | where:6

## 20. HTTP vs HTTPS and the history of SSL

You log in to Wren from a cafe. Everyone on that Wi-Fi network can see your packets, and so can every router between the cafe and Wren's data centre. With plain HTTP the login request travels as readable text, password included. Anyone in the path can also change what comes back, for example by injecting a script into the page or swapping the bank details on an invoice. Coffee-shop attacks of exactly this kind were common enough in 2010 that a browser extension called Firesheep let anyone click a button and take over other people's Facebook sessions on the same network.

**HTTPS** is HTTP sent inside a **TLS** (Transport Layer Security) connection. TLS gives three guarantees. Confidentiality means only the two ends can read the bytes. Integrity means any change in transit is detected and the connection fails. Authentication means the client knows it is talking to the real `api.wren.example` and not to someone pretending. TLS does not hide everything. An observer still sees the server's IP address, the timing and size of each message and, unless Encrypted Client Hello is in use, the host name.

@fig be_tls_why | Plain HTTP is a postcard. HTTPS is a sealed envelope that still shows the address and the size.

Netscape designed **SSL** (Secure Sockets Layer) in the mid-1990s. SSL 2.0 and 3.0 both had serious design flaws, and the IETF took over the protocol, renaming it TLS 1.0 in 1999. TLS 1.2 (2008) added modern ciphers and is still widely used. TLS 1.3 (2018) removed every old algorithm and cut the handshake to one round trip. TLS 1.0 and 1.1 were formally deprecated in 2021 by RFC 8996. People still say "SSL certificate" out of habit, but no modern server should accept SSL at all, and a configuration that allows anything below TLS 1.2 fails most security audits.

@fig be_tls_history | Six versions in 23 years. Only TLS 1.2 and 1.3 are acceptable today.

## 21. Symmetric and asymmetric encryption, ECDHE and forward secrecy

TLS combines two kinds of cryptography because each is good at one job. **Symmetric encryption** uses one shared key both to encrypt and to decrypt. AES-GCM, the usual choice, runs at several gigabytes per second on a modern CPU with AES instructions, so encrypting Wren's 4,000,000 bytes per second is negligible work. Its weakness is the key itself. Two strangers on the internet have no private channel over which to agree on one.

**Asymmetric encryption** uses a key pair, a public key anyone may see and a private key only the owner holds. It solves the agreement problem, but it is thousands of times slower than AES. So TLS uses asymmetric cryptography only during the handshake, to agree on symmetric keys and to prove identity, and then switches to the fast symmetric cipher for all the data.

@fig be_tls_sym_asym | The handshake uses slow asymmetric crypto to agree on fast symmetric keys.

The agreement step is a **key exchange**, and TLS uses a form of Diffie-Hellman. Both sides publicly agree on a prime $p$ and a base $g$. Each picks a secret number, computes a public value from it, and sends that value. Each then combines its own secret with the other side's public value, and both arrive at the same result. With toy numbers $p = 23$ and $g = 5$, the client picks $a = 6$ and sends $5^6 \bmod 23 = 8$. The server picks $b = 15$ and sends $5^{15} \bmod 23 = 19$. The client computes $19^6 \bmod 23 = 2$, and the server computes $8^{15} \bmod 23 = 2$.

$$K = g^{ab} \bmod p$$

Read it as follows. The shared key $K$ is the base raised to both secrets, and each side can compute it from one secret it holds and one public value it received. An eavesdropper sees 8 and 19 but cannot work back to 6 or 15 when the numbers are hundreds of digits long. Real TLS uses **ECDHE**, the same idea on an elliptic curve such as X25519, with 32-byte keys and fresh secrets for every connection.

@fig be_tls_dh | Both ends reach the same key without ever sending it. The secrets 6 and 15 never leave their machines.

:::story Picture this
Two painters agree in public on a common yellow. Each secretly mixes in a private colour and posts the mixture openly. Each then adds their own private colour to the other's mixture. Both end up with the same brown. Anyone who saw the two posted mixtures cannot unmix them to find the private colours, because paint is easy to mix and practically impossible to separate.
:::

The "E" at the end of ECDHE stands for ephemeral, and it buys **forward secrecy**. Many TLS 1.2 setups used RSA key transport instead. The client invented a session key, encrypted it with the server's long-term public key and sent it. An agency that recorded that traffic for years, then obtained the server's private key through a breach or a court order, could decrypt every recorded session. With ephemeral keys, the session secrets exist only in memory during the connection and are thrown away afterwards. The certificate key only signs the handshake, so stealing it later reveals nothing about past traffic. TLS 1.3 removed RSA key transport for exactly this reason.

@fig be_tls_forward_secrecy | With ephemeral keys, a stolen certificate key cannot unlock past recordings.

## 22. The TLS 1.3 handshake and cipher suites

The client speaks first with **ClientHello**. It lists the TLS versions and cipher suites it supports. It already includes a key share, its ECDHE public value for the curve it expects the server to pick, usually X25519, which is the trick that saves a round trip. It also carries extensions such as the server name and the application protocols it speaks.

The server replies with **ServerHello**, choosing a cipher suite and sending its own key share. At that point both sides can compute the shared secret, and everything after ServerHello is encrypted, including the server's certificate, which TLS 1.2 sent in the clear. The server then sends its Certificate. Next comes **CertificateVerify**, a signature over the whole handshake transcript made with the certificate's private key, which proves the server actually holds that key and is not replaying someone else's certificate. Last is Finished, a MAC over the transcript that detects any tampering with earlier messages, such as an attacker removing strong ciphers from the ClientHello.

The client checks the certificate chain, the signature and the Finished MAC, sends its own Finished, and in the same flight sends the first HTTP request. Setup costs exactly one round trip.

@fig be_tls13_handshake | One round trip of setup. The request travels together with the client's Finished message.

A **cipher suite** names the algorithms used. TLS 1.3 suites are short. `TLS_AES_128_GCM_SHA256` means AES with 128-bit keys in GCM mode for the records and SHA-256 for the handshake hash. Key exchange and signature algorithms are negotiated separately. TLS 1.2 suites pack four choices into one name, as in `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`: key exchange, signature, cipher and hash. TLS 1.3 allows only five suites, all of them AEAD ciphers that encrypt and authenticate in one step. That removed whole families of attacks against older CBC-mode ciphers, such as Lucky Thirteen and POODLE.

@fig be_tls_cipher_suite | A TLS 1.3 suite names only the record cipher and the hash. A TLS 1.2 suite names four algorithms.

:::interview Interview lens
**"What is different between TLS 1.2 and TLS 1.3?"** TLS 1.3 sends the key share in the first message, so a full handshake takes one round trip instead of two. It removed RSA key transport, so every connection has forward secrecy, and it dropped static Diffie-Hellman, CBC ciphers, RC4, SHA-1 and compression. It encrypts the server certificate, which TLS 1.2 sent in the clear. It also adds 0-RTT resumption, which is fast but replayable, so servers must limit it to idempotent requests.
:::

## 23. Session resumption, tickets and 0-RTT

A returning client should not repeat the full key exchange and certificate check every time. At the end of a TLS 1.3 handshake the server can send a **session ticket**, an encrypted blob that lets the client resume later using a pre-shared key derived from the first session. Resumption skips certificate validation and its signature work, which matters at scale, but it still costs one round trip.

**0-RTT** goes one step further. With a ticket in hand, the client sends **early data**, for example `GET /menu`, in its very first flight, before the handshake finishes. The server can answer straight away. The cost is replay. An attacker who captures that first flight can send it again, and the server cannot tell the copy from the original, because early data is not protected by the fresh handshake. Replaying `GET /menu` is harmless. Replaying `POST /payments` is not. Servers therefore either accept early data only for safe methods, or have the proxy mark it, as Nginx does with an `Early-Data: 1` header, so the application can answer `425 Too Early` and make the client resend after the handshake.

@fig be_tls_resumption | Resumption saves work. 0-RTT also saves a round trip but accepts replay risk.

Count the cost of a first request with a 40 ms round trip, 30 ms of server time and an illustrative 25 ms DNS lookup. TCP plus TLS 1.2 takes 25 + 40 + 80 + 70 = 215 ms, since TLS 1.2 needs two round trips and the request needs one more plus server time. TCP plus TLS 1.3 takes 175 ms. QUIC merges transport and TLS for 135 ms. QUIC with 0-RTT reaches 95 ms. A warm connection that already exists needs only the request round trip and the server time, 70 ms.

@fig be_tls_rtt | Every removed round trip saves 40 ms. Reusing connections beats every handshake optimisation.

:::warn Watch out
Session tickets are encrypted with a ticket key that the server holds. If every server in a fleet uses the same ticket key forever, stealing that one key decrypts every resumed session, which undoes forward secrecy for them. Rotate ticket keys every few hours, and share the current set across all instances so resumption still works behind a load balancer.
:::

## 24. SNI and ALPN

One IP address often serves many domains, each with its own certificate. The server must choose a certificate before the HTTP request, and its Host header, ever arrives. The **SNI** (Server Name Indication) extension solves this by putting the requested host name, `api.wren.example`, into ClientHello. Before SNI became universal around 2010, every HTTPS site needed its own IP address, which was a real cost when IPv4 addresses were running out.

**ALPN** (Application-Layer Protocol Negotiation) carries the list of protocols the client speaks, such as `h2` and `http/1.1`. The server picks one in its reply, and HTTP/2 starts immediately on the new connection with no extra round trip to upgrade. A server that does not support ALPN, or picks `http/1.1`, quietly limits every client to HTTP/1.1, which is a common reason "we enabled HTTP/2" has no visible effect.

@fig be_tls_sni | SNI chooses the certificate, ALPN chooses the protocol. Both travel in ClientHello.

SNI goes out before encryption starts, so a network observer can see which site you visit even over HTTPS, and some national firewalls block sites by reading it. **Encrypted Client Hello** (ECH) encrypts the real ClientHello with a key published in DNS and shows observers only a shared outer name, such as the CDN's. Firefox and Chrome support it and some CDNs deploy it, but as of 2026 it is not universal.

:::note TLS between services
Inside a data centre, both sides can present certificates. In **mutual TLS** (mTLS) the server also asks for a client certificate and verifies it, so each service proves its identity to the other. Unit XI shows how service meshes automate this.
:::

:::key In one breath
HTTPS is HTTP inside TLS, which provides confidentiality, integrity and server authentication, and SSL plus TLS 1.0 and 1.1 are retired. The handshake uses asymmetric cryptography, ECDHE for key exchange and signatures for identity, to agree on fast symmetric keys such as AES-GCM, and ephemeral keys give forward secrecy. TLS 1.3 takes one round trip, with ClientHello carrying the key share, SNI and ALPN, and everything after ServerHello encrypted. Tickets resume sessions cheaply, while 0-RTT saves a further round trip but can be replayed, so allow it only for idempotent requests.
:::

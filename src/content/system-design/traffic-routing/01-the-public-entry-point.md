@part I | Reverse proxies and API gateways | A public address must direct each request to the service allowed to handle it. Forwarding without a clear trust boundary lets client input become internal authority. We will build a reverse proxy, place gateway policy around it, and separate routing from business authorization. | where:1

## 1. Reverse proxies

A viewer opens Heron's score page while an application server is being replaced. The browser should not need that server's private address or know when its replacement starts. It sends a request to a stable public endpoint, and an intermediary chooses a suitable internal destination.

A **reverse proxy** receives requests on behalf of servers and forwards them upstream. The browser connects to the proxy; the proxy makes or reuses another connection to the application. Those are separate connections with separate timeout, encryption and failure boundaries. A successful connection to the proxy does not establish that an application can answer.

For Heron's illustrative peak of 1,000 requests per second and a 0.2-second mean response lifetime, $L=\lambda W=1000\times0.2=200$ requests are in flight. Read this as arrival rate multiplied by time in the request path. The proxy must carry that work and its associated buffers, even though its own forwarding computation may be small. The five application servers receive 200 requests per second each under equal assignment.

@fig sd_tr_proxy | Illustrative connections on both sides of the proxy. Orange marks the stable public endpoint; replacing an upstream does not change the browser's destination.

Forwarding includes the method, path, body and selected headers. The proxy also returns the upstream response, or an error when the upstream cannot finish. Streaming a body avoids buffering all uploaded video in memory, but then a failed partially forwarded upload is harder to retry. Buffering and streaming are resource and recovery choices, not interchangeable flags.

The proxy can centralize TLS certificates and hide private topology. It also becomes infrastructure that needs redundancy and bounded work. Adding another hop never removes the need for application permission checks. [NGINX's load-balancing guide](https://nginx.org/en/docs/http/load_balancing.html) gives a concrete reverse-proxy configuration; the subsequent parts explain how its destination choice works.

:::story Picture this
A building's reception desk accepts a visitor and phones the correct office. The visitor needs the building address, not every employee's room number. Reception can refuse an unknown appointment, but the office still checks whether the visitor may read the requested file. Moving an employee changes the desk's directory rather than every visitor's directions.
:::

## 2. API gateways and routing policy

Heron receives a score read and a clip upload through the same public hostname. The read belongs to the score service; the upload belongs to the media service. An **API gateway** combines request routing with public API policy such as credential checks, request limits and protocol handling.

A route can match a hostname, path prefix and method before choosing an upstream service. `GET /scores/match-7` and `POST /clips` therefore need not reach the same pool. Within the selected pool, a load balancer chooses an endpoint. Service selection and endpoint selection answer different questions, even when one process performs both.

Suppose a rollout sends 5 percent of Heron's 1,000 requests per second to a candidate version. The expected rates are $1000\times0.05=50$ to the candidate and $1000\times0.95=950$ to the established version. Read these as fractions of routing decisions over enough requests, not a guarantee that every short interval contains exactly that split. Persistent connections or user affinity can change the sampling unit.

@fig sd_tr_gateway | Route matching chooses a service before balancing chooses a server. Orange marks the upload route; score reads remain in their own upstream pool.

A gateway can reject a missing credential cheaply, but ownership of a particular clip still belongs to the application with access to the authoritative record. Central checks reduce repeated work; they do not make internal requests trustworthy by themselves. A compromised internal caller must not bypass authorization by avoiding the public gateway.

The failure case is an overgrown gateway that calls many databases and services before forwarding. It now has its own distributed workflow and failure modes. Keep the gateway's policy bounded, document which service owns each business decision, and measure rejected traffic separately from upstream errors. Otherwise the same status code can conceal a failed route, failed credential check or failed application.

:::note Service routing and endpoint routing
A path rule selects the score service. A balancing algorithm selects one healthy score-service endpoint. A gateway and a load balancer can occupy the same process, but the decisions still have separate inputs and failure cases.
:::

## 3. TLS termination and trusted forwarding headers

The application sees the proxy's socket address rather than the viewer's address. If it needs the original client's address or scheme, the proxy can send forwarding metadata. Accepting that metadata directly from the public request lets a caller claim an arbitrary origin.

**TLS termination** means the proxy decrypts a client TLS connection. A new encrypted connection can protect the proxy-to-application hop. The second connection has its own peer identity and certificate validation; a public HTTPS URL does not automatically encrypt internal forwarding. Passing encrypted bytes through without terminating them has different routing visibility, which Part II examines.

Heron's payload rate is $1000\times2000=2{,}000{,}000$ bytes per second before headers and encryption overhead. Read this as request rate multiplied by response payload size. A terminating proxy sends those response bytes toward clients and receives them from upstreams on misses, so its capacity accounting includes both interfaces and active TLS sessions. It cannot be sized from certificate count alone.

@fig sd_tr_tls | Separate client and upstream security boundaries. Orange marks trusted metadata added after public headers are removed or normalized.

A public-edge proxy should remove or normalize caller-provided forwarding headers before writing its own. Subsequent trusted hops can append metadata according to one documented convention. The application accepts that convention only from authenticated or otherwise restricted proxy peers. The proxy must also normalize ambiguous request framing so that downstreams do not interpret a different body boundary.

One practical mistake is building absolute redirects from an untrusted `Host` or scheme header. Another is treating source IP as a user identity behind NAT or a proxy. Forwarded metadata can describe transport context, but the authenticated principal and application permission remain separate. This distinction returns in Part VIII when we trace the scorer's write.

:::warn Watch out
Do not trust a forwarding header because its name looks internal. Public callers can send the same header. Establish the trusted proxy boundary, normalize the inbound value there and restrict which peers the application accepts as forwarding authorities.
:::

## 4. Connection pools, timeouts and retries

A proxy opens a fresh upstream TCP connection for every score read. Even if the application is fast, connection setup becomes repeated work. An **upstream connection pool** retains connections for reuse, with limits on active and idle resources.

Heron's five application endpoints each permit an illustrative pool of 20 sockets from one proxy, giving $5\times20=100$ upstream sockets for that proxy. That is a pool limit rather than 100 concurrent application requests in every protocol. A connection may be idle, carry one HTTP request or carry several multiplexed requests. Count the unit the limit actually controls.

@fig sd_tr_pool | Illustrative per-endpoint socket pools. Orange marks reuse of an existing upstream socket; the pool count does not measure active HTTP/2 requests.

A timeout should bound a named interval, such as connecting, waiting for response headers or completing the whole request. Give the upstream the remaining request deadline rather than starting a fresh full deadline at every hop. In the complete route, Heron's 250-millisecond end-to-end budget leaves only 110 milliseconds for application work after the declared network and proxy allowances.

Retries require the same discipline. If three layers independently make up to three attempts, one user request can cause $3^3=27$ leaf attempts. Read this as multiplying the attempt limits, including each initial attempt. A retry at one owner, within a shared deadline and budget, prevents that multiplication. A timed-out write may already have committed; a stable operation identity is required before retrying it.

A pool also concentrates stale endpoints. When an application drains, stop new assignment and decide whether idle connections should close. Existing requests may finish, while long streams need an explicit drain deadline and reconnect contract. A deploy cannot simply move an established socket to another process.

:::interview Interview lens
**"Why can a reverse proxy amplify an outage?"** It can retain too much work, retry failed requests and send extra demand to surviving servers. I bound connections and request lifetimes, give retries one owner, and preserve the original deadline. For writes, I require a stable operation identity because a lost response does not prove the effect failed.
:::

:::key In one breath
A reverse proxy forwards on behalf of servers, while a gateway adds bounded API policy and service routing. Application authorization remains tied to authoritative business state. TLS termination, trusted headers and upstream pools each create a separate boundary to configure. Deadlines and one retry budget prevent forwarding layers from turning one failed request into many attempts.
:::

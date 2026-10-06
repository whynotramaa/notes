<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Between a user's phone and Wren's code sit half a dozen machines that each open a connection, read a little of the request, decide where it should go and open another connection. Most of them are invisible until one runs out of something, and then the whole service is down while the CPU graph says everything is fine.</p>

The unit follows a request inwards. Parts I and II cover reverse proxies in general and Nginx in particular, from forwarded headers to worker processes and zero-copy file serving. Parts III and IV cover load balancing, the difference between balancing connections and balancing requests, the algorithms, and what layer 4 balancers do to packets. Part V finds services by name instead of address, and Part VI adds API gateways and service meshes. Part VII builds private networks with WireGuard and Tailscale, including how two machines behind separate NATs connect directly. Part VIII goes down to sockets, queues, ports and NAT tables, the limits that fail before CPU does, and Part IX maps all of it onto cloud building blocks. Part X follows one request across every hop.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to explain why Nginx needs no thread per connection, choose between L4 and L7 balancing, explain why new pods sometimes receive no traffic, describe UDP hole punching, and debug a service that fails at 20% CPU.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Peak traffic | 2,000 requests per second | Connection rates |
| Ingress | Nginx, 8 workers, `worker_connections` 10,000 | Proxy capacity |
| App instances | 4 normally, 20 at peak, as Kubernetes pods | Load balancing |
| Ephemeral port range | 32768 to 60999, 28,232 ports | Port exhaustion |
| TIME_WAIT | 60 s on Linux | Socket reuse |
| NAT idle timeout | 350 s | Dropped idle connections |
| TCP keepalive default | 7,200 s idle before the first probe | Keepalive tuning |
| Accept queue | `somaxconn` 4,096 | Listen backlog |
| Mesh | about 400 pods with sidecars at 50 MB each (illustrative) | Mesh overhead |
| Public address | `api.wren.example`, 203.0.113.10 | Examples |

The main request is `GET /orders/123` from user 42's phone at 198.51.100.7. Part X follows it through DNS, the CDN, the cloud load balancer, Nginx, a sidecar and the orders pod, and on to the payments service by name.

</section>

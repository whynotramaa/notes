@part VII | Case study: one request end to end | We assemble the path and explain every boundary. A diagram is useful only if it predicts waiting and failure. We will trace a read, count its costs, and name the next question. | where:7

## 30. Trace one score read through every boundary

A viewer asks for match `m7` and Heron chooses an uncached authoritative read. The client resolves the name, selects an address, establishes a suitable protected connection, and sends the resource request. The proxy admits it, chooses a ready application, and forwards the request. The application checks the viewer's permission, acquires a bounded database connection, and reads a version suitable for the contract.

The response returns through a representation encoder, proxy, protected connection, and client parser. A useful trace records the same request identity across the hops and distinguishes time spent executing from time spent waiting. A server span that lasts a long time may contain a pool wait or lock wait rather than continuous CPU work.

@fig sd_network_end_to_end | Illustrative uncached score read. The connection and application hops have separate timeout and recovery boundaries.

### A worked critical-path budget

Use an illustrative warm read with 40 ms for the network exchange, 20 ms for proxy and admission, 30 ms for authentication and permission work, 10 ms for pool acquisition, 60 ms for query execution and its waits, and 40 ms for encoding and response handling. Assuming those costs are serial, their sum is 200 ms.

| Serial stage | Assumed duration | Computed cumulative time |
|---|---|---|
| Network exchange | 40 ms | 40 ms |
| Proxy and admission | 20 ms | 60 ms |
| Identity and permission | 30 ms | 90 ms |
| Pool acquisition | 10 ms | 100 ms |
| Query and waits | 60 ms | 160 ms |
| Encode and return | 40 ms | 200 ms |

These values explain one example, not a measurement of Heron or a recommended split. If stages overlap, sum the critical path instead of every duration. If one query takes longer, record its actual distribution rather than preserving the example total by silently shrinking another stage.

@fig sd_networking_read_time | Illustrative cumulative serial durations. Every duration and cumulative sum is reproduced in the networking computation script.

### What a failed trace tells us

A resolver error prevents the address choice. A connect failure means no suitable transport was established. A TLS failure means the protected endpoint contract was not established. An application rejection can be a valid permission decision. A lost response after a command requires operation recovery because the effect may already be committed.

Name the boundary before recommending a retry. If authentication failed, another database replica is irrelevant. If the database pool wait exhausted the deadline, opening more viewer sockets does not create database capacity. The complete path shows both which component owns the problem and which caller can reduce demand.

## 31. Count work without mixing units

Heron's daily API count of 8,640,000 divided by 86,400 seconds gives 100 requests per second on average. The illustrative peak multiplier of 10 gives 1,000 requests per second. With 2,000-byte responses, the peak API payload rate is 2,000,000 bytes per second, or 16,000,000 bits per second. Headers, encryption overhead, retransmission, ingress, and connection setup are additional traffic.

Using the illustrative mean duration of 0.2 s at that peak, mean in-flight requests are $1,000\times0.2=200$ in a stable observation window. This is a count of work in progress, not a count of sockets. Idle keep-alive sockets have no active request, while a multiplexed socket can carry several requests at once.

@fig sd_network_budget | Computed API payload calculation shown as rows. Bytes, request rate, and byte rate have different units and should not share quantitative bar lengths.

### Live delivery is another workload

The live service emits 20 events per second to 50,000 viewers. That produces 1,000,000 recipient deliveries per second. At an assumed 200 bytes per delivery, it carries 200,000,000 payload bytes per second. The viewer-side fan-out is much larger than one copy of the incoming event stream, so sizing the gateway from producer event rate alone misses its main work.

| Workload | Multiplication | Computed payload rate |
|---|---|---|
| API responses | 1,000 responses/s times 2,000 B | 2,000,000 B/s |
| Event input | 20 events/s times 200 B | 4,000 B/s |
| Viewer delivery | 20 times 50,000 times 200 B | 200,000,000 B/s |

@fig sd_networking_live_counts | The producer stream and viewer fan-out count different network paths. All sizes and rates are illustrative inputs or computed totals.

A five-gateway nominal split at the assumed 10,000 connections each fits 50,000 viewers. It leaves no connection headroom if one gateway disappears. The performance and real-time units turn that observation into a failure-capacity and reconnect calculation. Never confuse a nominal division with a tested production recommendation.

## 32. Give every component one job and one recovery story

A whiteboard diagram is complete only when each box changes a useful decision or owns a required state. DNS locates candidate endpoints. TCP or QUIC implements the chosen transport behavior. TLS authenticates and protects a connection. The proxy admits and routes requests. The application enforces resource semantics and permission. The database supplies a defined read or committed effect.

A live gateway adds connection and subscription ownership, while the retained event source adds replay. A command-key record adds recovery after uncertain completion. These are distinct jobs. Putting them inside one deployment does not make their failure boundaries disappear; splitting them into services does not automatically improve them.

@fig sd_networking_component_jobs | A reference card for the complete request. The recovery job is as important as the happy-path job.

### The interview version of the trace

Start with what the user is allowed to do and what a response means. Draw the request's path, then name the state and deadline at each boundary. Follow a lost response, a stale address, a busy pool, and a resumed old connection through the same diagram. Only after that choose a balancing policy, cache, or extra replica that solves a demonstrated problem.

This chapter follows messages and bounded waits. It does not teach packet-level TCP implementation, complete cryptographic proofs, database consensus internals, or measured production tuning. Those boundaries deserve their own material. The next unit counts throughput, percentile latency, queue growth, and failure headroom for the path we can now draw.

:::interview Interview lens
**"Walk me through a score read, including what can go wrong."** The client resolves a suitable endpoint, establishes a protected connection, and sends a resource request through admission and routing. The application checks permission and reads suitable state with bounded pool and execution waits. I distinguish setup, execution, and queueing in the trace, and I recover uncertain commands using their original identity rather than treating a timeout as proof of rollback.
:::

:::note Request identity is not permission
A request identifier connects observations across hops. It is diagnostic context, not evidence that the caller may read a match. Propagate a verified identity and check resource permission separately from the trace identifier.
:::

:::warn Watch out
Adding each hop's p99 does not generally calculate the end-to-end p99. The table adds durations for one explicitly serial example. A percentile describes a distribution and needs observations of the complete path or a stated model.
:::

:::story Picture this
A parcel's tracking code follows it through collection, sorting, transit, and delivery. A delay report is useful when it names the stage holding the parcel. The tracking code does not grant permission to open it, and a dispatch scan does not prove delivery.
:::

:::key In one breath
A complete request crosses naming, transport, protection, routing, permission, and state boundaries. Trace the critical path and assign each wait a deadline and owner. Keep request counts, connection counts, producer bytes, and viewer-delivery bytes in their own units. A strong design explains recovery using the same state and identities as the happy path.
:::

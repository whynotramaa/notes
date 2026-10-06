@part VI | Backpressure and overload | We answer the syllabus's sharpest question, where the extra requests go when more arrive than can be served. The honest answer is that they go somewhere, memory, queues, timeouts or errors, and the only choice is which. We will cover what overload does to an unprepared service, bounded queues and flow control, and load shedding with admission control. | where:6

## 17. Where the extra work goes

Suppose Wren's API receives 50,000 requests per second during a viral promotion and its workers can process 10,000. Every second, 40,000 requests are neither finished nor refused. They have to be somewhere. In an unprepared service they sit in memory, in the web server's accept queue, in an in-process task queue, in buffered request bodies, in pending promises. At about 2 KB each, that is 40,000 × 2,000 = 80 MB of new memory per second. A 4 GB heap fills in 4,000 MB ÷ 80 MB per second = 50 s.

@fig be_bp_where | Fifty thousand in, ten thousand out. The difference piles up in memory at 80 MB a second.

Long before memory runs out, the service is already failing. Every queued request waits behind all the ones before it, so latency climbs by about one second for every 10,000 queued. Clients time out after a few seconds and retry, adding more requests. The work the server does finish is mostly for clients that have already given up, so its useful output falls even though it is busy. Garbage collection runs constantly against a full heap, stealing CPU from real work. Finally the process runs out of memory and dies, losing everything it was holding, and the load moves to the remaining instances, which follow it down.

This sequence, overload turning into collapse, is the reason **backpressure** exists. Backpressure means a component that cannot keep up pushes back on its source, so the source slows down, waits, or stops sending, instead of the excess piling up invisibly. The syllabus question has only a few honest answers for where the 40,000 go. They wait in a bounded buffer for a bounded time. They are slowed at the source by flow control. They are refused, with an error that says so. Or they are dropped. A good design chooses among those deliberately, per kind of traffic, instead of letting the runtime default to "pile up in memory".

The choice also depends on where the overload is. If one downstream dependency is the bottleneck, such as the kitchen API, backpressure means limiting calls to it and queuing or shedding the work that needs it, while unrelated endpoints carry on. If the whole service is out of CPU, it means refusing work at the front door, section 19, and autoscaling if the burst lasts.

## 18. Bounded queues and flow control

The first rule is that every queue and buffer has a limit. An **unbounded queue** hides overload until it kills the process. A **bounded queue** fills up and then forces a decision, and the decision is made at the moment overload begins, while there is still memory and time to make it.

@fig be_bp_bounded | The unbounded queue grows until the process dies. The bounded one hits its limit and says so.

There are three things to do when a bounded queue is full. **Block** the producer until there is room, which pushes the problem one step upstream, the right choice inside a pipeline where the producer can afford to wait. **Reject** the new item with an error, such as 503 with Retry-After for an HTTP request or a full-queue exception for a job submission, which tells the caller immediately. Or **drop** something, the new item or the oldest one, which suits data whose value decays, such as telemetry or position updates. Wren's request queue rejects, its metrics pipeline drops the oldest, and its internal stream processing blocks.

**Flow control** is backpressure built into a protocol. TCP has had it since 1981. Each side advertises a receive window, the free space in its receive buffer. A slow reader's buffer fills, its window shrinks, and when it reaches zero the sender stops sending and only probes occasionally to see if space has opened. The sender's own send buffer then fills, and its `write()` call blocks or returns `EAGAIN`, which pushes pressure into the sending application. Pressure travels upstream hop by hop with no extra code, as long as each hop stops reading when it cannot keep up.

@fig be_bp_tcp | The reader's buffer fills, it advertises a zero window, and the sender must stop.

Application protocols add the same idea at a higher level. HTTP/2 and gRPC have per-stream and per-connection flow-control windows. **Reactive Streams**, a specification from 2015 adopted in Java 9 as `java.util.concurrent.Flow`, makes it explicit for in-process streams. A subscriber calls `request(16)` to grant credit for 16 items, and the publisher may send no more until more credit arrives. Node streams do it with `highWaterMark` and the return value of `write()`, Part VIII. Kafka consumers do it simply by not fetching until they are ready.

@fig be_bp_reactive | The consumer grants 16 credits. The producer sends 16 and waits for more.

The anti-pattern that breaks all of this is a component that reads eagerly from a fast source and buffers without limit, an async loop that pulls every message from a queue into an in-memory array, or a proxy that reads a whole upload before forwarding it. Each one cuts the backpressure chain, and everything upstream of it believes all is well until it dies.

## 19. Load shedding and admission control

When a service is overloaded, it cannot serve everyone, and trying to serve everyone means serving almost nobody well. **Load shedding** deliberately refuses some work so the rest succeeds. **Admission control** is the gate that decides, at the front door, whether a new request may enter.

The simplest admission control is a concurrency limit. Wren caps each instance at 200 requests in progress. Request 201 is refused immediately with 503 and a Retry-After header, costing microseconds instead of holding memory and a slot for a request that would time out anyway. Better limits adapt. Netflix's concurrency-limits library adjusts the limit from observed latency, the way TCP's congestion control adjusts its window, shrinking it when latency rises. Queue-time limits, inspired by the CoDel algorithm from Kathleen Nichols and Van Jacobson in 2012, drop requests that have waited longer than a target, such as 100 ms, since a request that has queued that long is likely to time out at the client.

@fig be_bp_shedding | The gate admits 200 at a time and turns the rest away while there is still time to say so.

Shedding should be selective. Not all requests are equal. Wren ranks its traffic. Checkout and payment are critical. Order tracking is important. Restaurant browsing is useful. Analytics beacons, prefetches and recommendation refreshes are sheddable. Under overload it sheds from the bottom of the list first, so a hungry customer can still pay while the "people also ordered" carousel shows nothing. Requests carry their priority in a header set at the gateway, and every tier's admission control respects it, an approach Google's SRE book describes for its own systems.

The payoff shows in **goodput**, the rate of useful work completed, as opposed to throughput, the rate of work attempted. Without shedding, goodput rises with load up to capacity and then falls, sometimes towards zero, because the server spends its time on requests that will time out. With shedding, goodput rises to capacity and stays there, because every admitted request gets enough resources to finish in time.

@fig be_bp_goodput | Illustrative. Without shedding, useful work collapses past capacity. With shedding, it holds.

Clients complete the picture. A 503 with Retry-After works only if clients respect it, back off with jitter and cap their retries, as Unit X covers with retry budgets and circuit breakers. Producers further upstream can be throttled by rate limits, also Unit X, so a single client cannot push the service into overload alone. And autoscaling adds capacity when the overload lasts, though it takes minutes, so shedding is what carries the service through the first minutes of a spike.

:::story Picture this
A nightclub at capacity. A bouncer who lets everyone in creates a crush where nobody can reach the bar, and the night is ruined for all. A bouncer who keeps the room at capacity, lets guests on the list in first, and tells the rest of the queue "an hour's wait, try the place next door" gives everyone inside a good night and everyone outside an honest answer.
:::

:::note Little's law, one more time
A concurrency limit and a latency target together imply a throughput. An instance that admits 200 requests at a time, each taking 50 ms, completes at most 200 ÷ 0.05 = 4,000 per second. If measured throughput is lower at the limit, requests are taking longer than 50 ms, which usually means a downstream dependency is the real bottleneck.
:::

:::warn Watch out
Shedding at the wrong layer wastes the work already done. Rejecting a request after authenticating it, loading the user and querying the database throws all that away. Refuse as early as possible, at the gateway or the first middleware, before expensive work begins.
:::

:::interview Interview lens
**"Your API receives 50,000 requests per second and can process 10,000. Where do the other 40,000 go?"** In an unprepared service they pile up in memory, about 80 MB per second at 2 KB each, latency climbs, clients time out and retry, and the process dies within a minute. A prepared one chooses. It bounds every queue and rejects with 503 and Retry-After when full, sheds low-priority traffic first, uses flow control so upstream components slow down, rate-limits heavy clients, and autoscales if the load persists. Goodput then stays at capacity instead of collapsing.
:::

:::key In one breath
When 50,000 requests per second arrive and 10,000 can be served, the other 40,000 pile up in memory at 80 MB a second and fill a 4 GB heap in 50 s, while latency, timeouts and retries collapse useful output. Backpressure makes slow parts push back, through bounded queues that block, reject or drop, TCP's receive window, HTTP/2 and gRPC windows, and Reactive Streams credits. Admission control refuses work early with 503 and Retry-After, sheds the least important traffic first, and keeps goodput at capacity instead of letting it collapse.
:::

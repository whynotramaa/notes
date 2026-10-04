@part VI | Fan-out and slow consumers | We count the repeated work after a single event. Fast producers can fill queues behind slow recipients and destabilize healthy viewers. We will compute fan-out, choose batching, bound per-client queues, and isolate hot topics. | where:6

## 21. One event multiplies by its recipients

Heron's twenty events per second each reach fifty thousand viewers. **Fan-out** is the replication of one input into deliveries to many recipients. The calculation is $F=e\times v$, read as deliveries per second equal events per second times viewers. It gives 1,000,000 deliveries per second.

Payload bandwidth is $B=e\times v\times m$, where $m$ is payload bytes per event. At 200 bytes, the result is 200,000,000 bytes per second or 1,600,000,000 bits per second before framing, TLS, transport, retransmission, and other traffic. A gateway with ten thousand viewers handles 200,000 deliveries and 40,000,000 payload bytes per second.

@fig sd_realtime_fanout | Computed illustrative payload bandwidth. Bars compare different delivery boundaries explicitly; protocol overhead is excluded.

A tiny event rate can therefore produce a network-bound system. Zero-copy techniques or shared encoding can reduce CPU, but each recipient still needs bytes over its connection. Multicast assumptions do not apply automatically to ordinary internet clients. The architecture must spread final egress and retain enough capacity after a gateway fails.

:::story Picture this
Printing one announcement and making fifty thousand copies takes more work than writing its text. Reusing the typeset page saves preparation, but every recipient still needs a physical copy. Encoding once is useful; it does not remove network delivery per recipient.
:::

## 22. Batch when the latency contract permits it

Five consecutive events can be grouped into one application message. **Batching** combines multiple logical records into one transport operation. At twenty events per second with evenly spaced illustrative arrivals, waiting for a five-event batch makes the first event wait at most $4/20=0.2$ seconds before the fifth arrives.

The payload is $5\times200=1,000$ bytes under the stated sizes, before a batch envelope. Batching reduces per-message framing and scheduling overhead but does not reduce the sum of event payloads. A size-or-time flush rule bounds waiting when arrivals slow down. Without the timer, a quiet match could leave an incomplete batch waiting indefinitely.

@fig sd_realtime_batch | Computed illustrative evenly spaced batching trace. The time bound relies on the stated arrival pattern unless a flush deadline enforces it.

The batch envelope should carry enough per-event identity and ordering data for the client to apply the same reducer rules as individual messages. A repeated batch is not a new group of changes. If one item cannot parse, the recovery protocol must explain whether the entire batch is rejected or how valid item progress is acknowledged without hiding a gap.

**Coalescing** keeps the latest state instead of every intermediate event. It can reduce payload work when spectators only need the current score, but loses intermediate display states. Never coalesce an audit stream or command history whose individual events matter. Batching preserves all included events; coalescing changes which information is delivered.

## 23. Bound the queue of each slow recipient

A viewer's link drains 1,000 bytes per second while incoming events require 4,000 payload bytes per second. The outbound queue grows at 3,000 bytes per second. At a sixty-thousand-byte queue limit, the illustrative queue fills in twenty seconds. Larger buffers delay failure but cannot fix a sustained production rate above drain rate.

**Backpressure** communicates or enforces a limit when downstream work cannot keep pace. For broadcast, one slow viewer should not force every healthy viewer to stop receiving updates. Each connection needs an independent queue budget and a policy at that budget. Options include coalescing replaceable state, dropping explicitly lossy updates, or disconnecting with a recoverable cursor.

@fig sd_realtime_slow | Computed illustrative slow-client queue growth. Sizes count event payload and exclude framing.

Record queue age as well as bytes. A queue with little data may still contain old messages if events are rare. The overflow policy depends on whether the payload is a complete state or required deltas. Disconnecting a delta consumer is safe only when reconnect can recover the missed changes or fetch a compatible snapshot.

:::note Shared encoding is different from shared queues
Encode one public event once and share an immutable byte representation while gateway loops schedule deliveries. Each connection still needs independent progress and queue accounting. One mutable shared buffer or queue can corrupt data or let a slow connection retain memory needed by many others.
:::

## 24. Hot topics need their own budget

Three matches have 30,000, 15,000, and 5,000 viewers in the illustrative split. At twenty events per second each under this separate sizing exercise, their fan-out rates are 600,000, 300,000, and 100,000 deliveries per second. The popular topic's work dominates even when match counts are balanced.

A **hot topic** creates disproportionate delivery demand for one logical channel. Gateways can spread its clients across machines, while the producer remains match-local ordered. An intermediate routing tier or hierarchical broker topology may spread delivery work, but it adds another failure and latency boundary. Introduce it when measured topic fan-out exceeds the simpler path's capacity.

@fig sd_realtime_topics | Computed illustrative per-topic fan-out under a twenty-event-per-second assumption for each topic. This separate split sums to the same million deliveries.

Admission controls protect healthy topics when one match becomes overloaded. Reserve or fairly allocate gateway CPU, outbound bytes, and registration work. A connection limit alone cannot express the difference between an idle spectator and a spectator receiving a busy stream. Observe the resources responsible for the product delay.

:::warn Watch out
Never let an unbounded outbound queue retain all missed messages for an offline client. That turns a live gateway into accidental durable storage with no retention policy. Persist the history in the intended event store and keep gateway queues bounded.
:::

:::interview Interview lens
**"What happens when one event reaches millions of clients?"** The delivery cost multiplies by recipients, so I would budget final egress and scheduling separately from producer input. Gateways share encoding and route only relevant topics, but each client still needs bounded delivery state. Slow clients receive a stated coalescing or disconnect policy. The recovery path prevents buffer limits from becoming silent data loss.
:::

:::key In one breath
Fan-out multiplies event rate by recipients and payload size. Batching reduces operations while spending latency; coalescing discards intermediate states under an explicit contract. Per-client queues need byte, age, and overflow limits. Hot topics require delivery-resource budgets that connection counts alone cannot provide.
:::

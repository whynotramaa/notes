@part VI | Flow and congestion control | Sending faster only helps while the receiver and the path can absorb the bytes. Without separate limits, a fast host can exhaust another host's buffer or fill every shared queue. We will calculate a sliding window, distinguish receive and congestion windows, and compare feedback with traffic shaping. | where:6

## 28. Sliding windows and bandwidth-delay product

Finch's `100` Mb/s path has an illustrative `40` ms RTT. A sender that waits after every packet leaves most of that path idle. A **sliding window** permits several unacknowledged bytes at once and advances their allowed range when acknowledgements arrive. The sender retains those bytes so it can retransmit a missing range.

The **bandwidth-delay product**, or BDP, counts the data that can occupy a path during one round trip. A `100,000,000` bit/s rate multiplied by `0.04` seconds gives `4,000,000` bits, or `500,000` bytes. A `64,000` byte window can supply only `64,000 / 0.04 = 1,600,000` bytes/s, equivalent to `12.8` Mb/s, before overhead or loss reduces it further.

$$
T\leq\min\left(R,\frac{8W}{\operatorname{RTT}}\right).
$$

Read this as throughput T, in bits per second, cannot exceed either link rate R or eight times window bytes W divided by round-trip seconds. The bound assumes acknowledgements keep advancing and the application has data ready. It describes a bottleneck, not a complete prediction of throughput.

@fig cn_window | A `64,000` byte window limits the illustrative path to `12.8` Mb/s. Orange marks the window limit, while the `500,000` byte BDP explains how much data a full path would need. | narrow

### Stop-and-Wait, Go-Back-N and Selective Repeat

Stop-and-Wait sends one unit and waits for its acknowledgement. In the supplied `1,500` byte teaching model, including `0.12` ms serialization gives `0.2991026919242273` Mb/s. Go-Back-N retransmits from a missing unit onward and usually keeps a contiguous receiving prefix. Selective Repeat retains separately received units and retransmits specific gaps. TCP combines a byte-oriented sliding window with recovery options rather than implementing either classroom frame protocol literally.

Finite sequence space also limits a safe window. If old packets can be mistaken for new ones after wraparound, a receiver loses the ability to distinguish duplicates. The protocol must constrain both packet lifetime and outstanding sequence ranges. More buffering buys utilization but increases memory per connection and can amplify latency when queues hide congestion.

:::story Picture this
A courier can carry several numbered envelopes before returning with receipts. Waiting for a receipt after every envelope leaves the road empty. The window is the number of unreceipted envelopes allowed on the road, while the receiver's free shelves decide how many can be accepted.
:::

## 29. TCP flow control and the receive window

Finch's server pauses its application reads while it works on a response. Packets can still arrive, but the receive buffer has finite space. **Flow control** limits a sender according to the receiver's ability to accept bytes. TCP communicates this allowance through the advertised **receive window**, usually written rwnd.

An acknowledgement establishes a sequence reference and a window allowance after it. The sender keeps its unacknowledged data within the permitted range. As the application consumes bytes, buffer space becomes available and the receiver can advertise a larger window. A zero window asks the sender to pause new data, even if the network itself has plenty of capacity.

@fig cn_flow | Illustrative receive-buffer cutaway. Used bytes reduce available space, which constrains the advertised receive window. Receiver flow control and network congestion control are different limits.

A lost window-update packet must not leave both sides waiting forever. TCP uses a persist mechanism to probe for a reopened window. Such a probe solves a control-message deadlock; it is not permission to send the entire backlog into a full receiver. Window scaling can express allowances larger than the base header field can represent, provided the endpoints negotiated it.

Finch's illustrative `64,000` byte window allows `12.8` Mb/s over `40` ms when receiver capacity is the active bound. The same host can advertise that allowance while network congestion limits sending below it. Buffer sizing must account for application service rate, memory across active sockets and the path BDP. Allocating every socket a large buffer can exhaust memory before link bandwidth becomes the bottleneck.

A strong answer separates destination overload from path overload. If the server stops reading, rwnd can shrink without packet loss. If a router queue fills, cwnd should react even when rwnd remains large. Looking only at the total socket buffer misses which side currently limits the stream.

:::warn Watch out
Receive window and congestion window protect different resources. Increasing the receiver buffer cannot repair a congested router, and increasing cwnd cannot make an application consume its pending input.
:::

## 30. TCP slow start, congestion avoidance and recovery

Finch can fit more outstanding data in the receiver than the shared path can safely carry. **Congestion control** limits a sender according to inferred or signaled network capacity. The sender maintains a **congestion window**, written cwnd, and restricts new outstanding bytes by both cwnd and rwnd.

$$
W_{\text{usable}}=\min(\operatorname{cwnd},\operatorname{rwnd}).
$$

Read this as the usable outstanding-byte allowance is the smaller of the network estimate and the receiver allowance. A connection can therefore be receiver-limited, congestion-limited or application-limited. A full link-rate calculation must also include the bytes already in flight.

In the illustrative teaching trace, cwnd starts at one `1,460` byte segment. With a simple slow-start assumption, successful rounds raise it to `2,920`, `5,840` and `11,680` bytes. These are computed teaching states, not a claim about a universal production initial window. **Slow start** increases permission quickly while success suggests more capacity. At a threshold, congestion avoidance uses gentler growth.

@fig cn_congestion | The illustrative slow-start window doubles across successful rounds. Orange marks the final `11,680` byte state before a different growth rule would apply. | narrow

### Reno, CUBIC and BBR

Reno uses loss-based increase and decrease, with fast retransmit and fast recovery handling some losses without returning to an empty pipeline. CUBIC changes growth according to elapsed time around a remembered window maximum. BBR models delivered bandwidth and RTT to choose pacing and in-flight limits. They share transport obligations but use different evidence to estimate the path. [CUBIC](https://www.rfc-editor.org/rfc/rfc9438) specifies its time-based growth rule, and the [BBR specification draft](https://datatracker.ietf.org/doc/html/draft-ietf-ccwg-bbr) describes the bandwidth and delay model. BBR is an evolving draft rather than a fixed universal TCP behavior.

Loss is ambiguous. It may indicate a full router queue, interference on a wireless link or reordering that temporarily looks like a gap. No algorithm can infer every cause from one packet trace. The lesson is to identify its measurement and reaction before claiming it sends faster. [The congestion-control standard](https://www.rfc-editor.org/rfc/rfc5681) documents the classic baseline, while the classroom trace deliberately omits its implementation-specific refinements.

:::interview Interview lens
**"What is the difference between flow control and congestion control?"** Flow control protects the receiver's buffer using advertised capacity. Congestion control protects the path using feedback about delivery, delay, loss or explicit marks. TCP respects the smaller allowance. A slow reader and a full router queue therefore require different diagnoses.
:::

## 31. Congestion, ECN and backpressure

A router that receives bytes faster than it forwards them stores the difference in a queue. If arrival demand remains above service capacity, the queue eventually overflows. **Congestion** is a condition where offered work exceeds a network resource's ability to handle it. **Congestion collapse** occurs when traffic and repeated recovery consume capacity while little useful data reaches applications.

Open-loop control chooses a policy before observing current feedback, such as an admission budget or a configured shaper. Closed-loop control measures outcomes and adjusts sending. A choke message explicitly requests a reduction; packet loss is an implicit signal. **Explicit Congestion Notification**, or ECN, lets a participating router mark packets so endpoints can react before relying solely on dropped data.

@fig cn_control | Open-loop policies prevent excess demand, while closed-loop mechanisms react to observations. Orange marks feedback that reaches the sender through marks, delay or loss. | narrow

**Backpressure** propagates lack of capacity toward an upstream producer. It may mean pausing a socket writer, rejecting new requests or limiting a queue. Keeping every buffer unbounded simply relocates the failure into memory exhaustion. Each boundary needs to say whether it pauses, drops or refuses work when its downstream consumer slows.

Finch's one-link model includes `0.5` ms queue delay. Removing that term changes `5.67` ms to `5.17` ms; the `5` ms propagation remains. Queue delay is thus a cost of waiting, not a speed-of-light limit. A longer queue can hide overload for a while and worsen request latency even when the measured packet-loss rate falls.

ECN requires support along the relevant path and a sender that interprets the feedback. An encrypted payload does not prevent routers reading the IP-level mark. Congestion feedback also does not authenticate application requests or allocate fair business priority. Admission control at the application and forwarding policy in the network solve related but separate problems.

:::note Queueing and bufferbloat
A buffer can preserve throughput during a short burst yet add excessive waiting under sustained demand. Diagnose queue delay together with service rate and application deadlines; a larger queue is not automatically a better path.
:::

## 32. Leaky bucket and token bucket traffic shaping

Finch's application can enqueue a burst faster than the WAN should transmit it. A **leaky bucket** queues admitted work and drains it at a configured rate, smoothing its output. A **token bucket** accumulates permission up to a capacity and spends that permission to admit a controlled burst. The distinction is whether the mechanism primarily schedules queued output or grants burst permission.

For an illustrative bucket capacity of `50` packets and refill rate of `25` packets/s, an empty token bucket takes `2` seconds to fill. An idle client can then send up to `50` admitted packets immediately, subject to downstream scheduling. Sustained admission cannot remain above `25` packets/s after the saved tokens run out.

$$
t_{\text{fill}}=\frac{B}{r}=\frac{50}{25}=2\ \text{s}.
$$

Read this as fill time equals bucket capacity B divided by token refill rate r. The packet unit is an assumption. A byte-based bucket treats large packets differently, and a request-based API limiter does not control byte bandwidth at all.

@fig cn_bucket | Saved tokens permit a burst, while the refill rule caps sustained admission. Orange marks the tokens that are spent by Finch's next burst. | narrow

A shaper delays traffic until permission exists. A policer instead rejects or marks traffic beyond the configured rule. Either needs a bounded queue or an explicit refusal policy. A leaky bucket with output `25` packets/s needs `2` seconds to drain `50` queued packets under the model, whereas a full token bucket can admit them at once. The numerical equality of refill and drain time does not make their burst behavior equal.

Use elapsed monotonic time to refill tokens and cap the result at capacity. Refilling on a periodic timer can introduce unnecessary timing races or coarse bursts. Multiple distributed limiters also need a clear consistency policy for shared tokens. None of these controls makes the path lossless; TCP still reacts to the aggregate traffic from other senders.

:::key In one breath
A sliding window keeps bytes in flight while acknowledgements travel, and the BDP describes a fully occupied path. rwnd protects the receiver while cwnd protects the network, so TCP obeys both. Loss, delay and ECN are feedback, while shaping and admission rules can constrain traffic before overload. Leaky buckets smooth output and token buckets permit bounded bursts without changing the sustained budget.
:::

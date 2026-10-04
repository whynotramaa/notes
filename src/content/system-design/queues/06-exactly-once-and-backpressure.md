@part VI | Exactly-once and backpressure | Exactly-once and backpressure are the two topics where a short slogan hides the real mechanism. The first holds only inside a named transaction boundary, and a queue under sustained overload only postpones failure until someone slows the producer. We will define exactly what exactly-once covers, measure backlog and lag during a burst, and build backpressure and autoscaling from the numbers. | where:6

## 24. What exactly-once actually covers

A vendor page says "exactly-once delivery". A transcoder that writes files to object storage reads that and drops its idempotence. Then a rebalance repeats a job and two thumbnails appear. The claim was true, but about something narrower than the reader assumed.

**Exactly-once** is a statement about effects within a boundary: each input contributes to the output exactly once *inside the system that runs the transaction*. Kafka's exactly-once semantics, for example, combine an idempotent producer, which deduplicates retried sends by sequence number, with transactions that atomically write output records and commit the input offsets. A Kafka-to-Kafka stream processor with `isolation.level=read_committed` readers therefore sees each input reflected once. Kafka Streams and Flink build on this.

The boundary ends at anything outside the transaction. An email, a payment API call, a write to Postgres or a file in S3 is not part of Kafka's transaction, so a crash after the external effect and before the transaction commits causes a retry that repeats it. No broker can make an external side effect exactly-once by itself, because the two systems would need a shared atomic commit.

@fig sd_q_eos_boundary | Exactly-once holds inside the broker's transaction. The external email crosses the boundary and still needs its own idempotency key.

There is one widely used way to stretch the boundary: keep the consumer's progress in the same database as the effect. The consumer writes the effect and the source offset in one database transaction, and on restart reads its offset from that database instead of from the broker. Then the effect and the progress cannot disagree, and the outcome is exactly-once for that database. Section 19's deduplication table is a looser version of the same idea.

:::warn Watch out
Do not remove idempotence because a component advertises exactly-once. Ask which systems participate in the transaction. Anything outside that list, including your own database unless the offset lives there, still receives at-least-once delivery.
:::

## 25. Arrival rate against service rate

The final whistle blows and fans upload clips. For 120 seconds, uploads arrive at 40 per second instead of 6. Heron's 200 workers complete $200/30\approx6.67$ jobs per second. What happens to the queue?

During the burst, $40\times120=4{,}800$ jobs arrive and $6.67\times120=800$ complete, so the backlog grows to 4,000 jobs. A queue is a buffer: it absorbs the difference between arrival rate and service rate. While arrivals exceed service, backlog grows linearly at the difference, here $40-6.67\approx33.3$ jobs per second.

After the burst, arrivals return to 6 per second. The backlog drains only at the spare capacity, $6.67-6\approx0.67$ jobs per second. At that rate, 4,000 jobs take $4{,}000/0.667=6{,}000$ seconds, 100 minutes. This is the arithmetic that surprises teams: a system running at 90% utilization handles a two-minute burst by being late for nearly two hours.

@fig sd_q_backlog | Backlog during and after the burst. It rises for 2 minutes and drains for 100 minutes, because ongoing arrivals consume 90% of capacity.

Spare capacity, not peak capacity, sets recovery time. With 300 workers, capacity is 10 jobs per second, spare capacity is 4, and the same backlog drains in 1,000 seconds, 16.666667 minutes. Adding 50% more workers made recovery six times faster. Section 28 turns that into an autoscaling rule.

The backlog's bytes are rarely the problem. At 1,000 bytes per message, 4,000 jobs occupy 4 MB of broker storage. The problem is time: each of those messages represents a user waiting for a clip.

:::story Picture this
A motorway toll plaza with ten booths handles 900 cars an hour against a capacity of 1,000. After a stadium empties, 3,000 extra cars arrive in ten minutes. The queue builds in minutes and then shrinks by only 100 cars an hour, because nine of every ten booth-minutes are still serving the normal traffic.
:::

## 26. Lag measured in time, not messages

Heron's dashboard shows "4,000 messages in queue". Is that bad? A single worker completing one score update every 5 milliseconds needs 20 seconds to clear that backlog if no new work arrives. The 200-worker transcode pool needs 600 seconds under the same no-new-arrivals assumption. A message count without a service rate does not tell anyone whether users are waiting.

Measure lag in time. Two numbers matter. The **age of the oldest message** is how long the most delayed piece of work has waited; SQS exposes it as `ApproximateAgeOfOldestMessage`, and stream consumers compute it from record timestamps at the committed offset. The **expected wait** for a new message is backlog divided by service rate, from Little's law. With 4,000 jobs ahead and 6.67 completing per second, a clip uploaded at the end of the burst waits $4{,}000/6.67=600$ seconds, 10 minutes, before a worker even starts it.

For streams, **consumer lag** per partition is the latest offset minus the committed offset. It is a count, so convert it with that partition's consumption rate. Sum lag across partitions for capacity, but alert on the maximum per partition, because one hot partition can be hours behind while the total looks small.

@fig sd_q_lag_time | The same backlog of 4,000 means 20 seconds of work for score updates and 10 minutes for transcodes. Alert on time.

Tie the alert to a promise. If Heron promises renditions within 5 minutes of upload, alert when the oldest message is older than, say, 3 minutes. That gives the autoscaler and the on-call engineer time to act before the promise breaks, instead of alerting on an arbitrary queue depth that means different things for different queues.

:::note Timestamps and clocks
Age of oldest message depends on comparing a timestamp written by the producer with the consumer's clock. Clock skew of a few seconds is harmless for minutes-scale lag but misleading for millisecond-scale streams. For tight streams, measure lag in offsets and convert with a measured rate instead.
:::

## 27. Backpressure: making the producer slow down

The burst in Section 25 lasted two minutes. Suppose instead uploads stay at 10 per second for an hour. Arrivals exceed capacity by 3.33 jobs per second forever, so the backlog grows by 12,000 jobs an hour, every user waits longer each minute, and eventually the broker's storage or the retention limit fills. A queue buffers bursts; it cannot fix sustained overload. Something must tell the producer to slow down, and that signal is **backpressure**.

Backpressure has three levels, from gentlest to harshest. Flow control inside the pipe: a consumer's prefetch or a credit window limits how many messages it accepts, and a full consumer stops pulling, so the broker holds the excess. Producer blocking: a bounded queue blocks or slows `send` when it reaches a limit, as a Kafka producer's `buffer.memory` and `max.block.ms` do and as RabbitMQ does when it throttles publishers at its memory high watermark. Admission control at the edge: the API refuses new work with `429 Too Many Requests` or `503` with `Retry-After` when the oldest message age passes a threshold, so the user learns immediately instead of waiting an hour.

Credit-based flow control is easy to size. With 50 messages of credit and a service rate of 6.67 per second, a consumer holds at most $50/6.67=7.5$ seconds of work, which bounds both the memory it uses and the work stranded if it crashes. Reactive Streams, HTTP/2 flow-control windows and AMQP 1.0 link credit all use the same idea.

@fig sd_q_backpressure | Three places to push back. Each later level is harsher but protects more of the system.

The edge decision is the one that matters most for users. If Heron would make a clip wait an hour, a fast "uploads are busy, try again in a few minutes" is more honest than a `202 Accepted` that hides the delay. Load shedding should prefer cheap rejections early over expensive work late, and it can prioritize: a verified creator's upload might bypass a limit that a bulk import respects.

:::interview Interview lens
**"Your queue keeps growing. What do you do?"** First I check whether it is a burst or sustained overload by comparing arrival rate with service rate. A burst drains on its own at the spare capacity, and I can shorten that with more consumers. Sustained overload will not drain, so I add capacity if the bottleneck allows it and apply backpressure: bound the queue, slow or block producers, and reject at the edge with Retry-After based on the oldest message age. Letting the queue grow without limit just converts overload into unbounded latency and eventually lost data.
:::

## 28. Autoscaling consumers and its limits

An autoscaler watches the backlog and adds workers. The question is what signal to scale on and where the ceiling is. CPU is the wrong signal for queue consumers: a worker blocked on a slow database uses little CPU while its backlog grows. Scale on backlog per worker or on oldest message age.

A target of backlog per worker makes the arithmetic explicit. If each worker should hold at most 60 seconds of queued work, and one worker completes $1/30$ job per second, the target is 2 queued jobs per worker. A backlog of 4,000 then asks for 2,000 workers. That number is a hint, not a plan, because something else always runs out first.

Ceilings come from three places. Partition count caps a stream consumer group, as in Section 10: Heron's 12-partition score topic cannot use a 13th indexer. Downstream capacity caps everything: 2,000 transcoders writing renditions might saturate the object store's request rate or the database's connection limit, so the autoscaler has moved the bottleneck rather than removed it. And startup time limits reaction: if a worker takes 90 seconds to pull its image and warm up, a 2-minute burst is mostly over before it helps.

@fig sd_q_autoscale | Drain time against worker count for the 4,000-job backlog. Going from 200 to 300 workers cuts drain from 100 minutes to 16.666667 minutes; beyond the dependency limit, more workers only add contention.

Design the scale-down too. Removing a worker mid-job causes a redelivery after its lease expires, so workers should stop taking new messages, finish or release the current one, and then exit. KEDA on Kubernetes and the AWS target-tracking policies for SQS both implement backlog-per-task scaling; neither knows your downstream limits, so set a maximum replica count from them.

:::key In one breath
Exactly-once holds only inside one transactional boundary, such as Kafka's producer-plus-offsets transactions or a database that stores the consumer's offset with the effect, and external effects still need idempotence. A burst builds backlog at arrival minus service rate and drains only at spare capacity, which is why 90% utilization turns a 2-minute burst into 100 minutes of delay. Measure lag in time, push back through credit, producer blocking and edge admission when overload is sustained, and autoscale on backlog per worker up to the partition and dependency ceilings.
:::

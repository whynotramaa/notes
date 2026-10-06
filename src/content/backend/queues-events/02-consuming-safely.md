@part II | Consuming safely | We look at the consumer's side of the contract, how long it may hold a message, how many it may take at once, and what happens when it cannot keep up. Most queue incidents are a consumer holding too much, too long, or falling behind without anyone noticing. We will cover visibility timeouts, prefetch and backpressure, and the arithmetic of backlogs. | where:2

## 4. Visibility timeouts and leases

When a worker takes a message, the broker cannot know whether the worker is busy, slow or dead. It needs a rule. SQS's rule is the **visibility timeout**. A received message is hidden from other consumers for a set time, 30 s by default. If the worker deletes it within that time, it is done. If the time runs out first, the message becomes visible again and the next `ReceiveMessage` hands it to another worker. The same idea appears elsewhere as a **lease**, the job-table lease of Unit VI or RabbitMQ's requeue when a consumer's connection drops.

The timeout must be longer than the job, and here is what happens when it is not. Wren's refund worker calls the payment provider, which on a bad day takes 40 s. At 30 s the message reappears. Worker B receives it and starts a second refund while worker A is still waiting on the first. Both succeed. The customer is refunded twice.

@fig be_q_visibility | The message reappears at 30 s while worker A is still busy, and worker B repeats the work.

There are three defences, and Wren uses all three. Set the visibility timeout well above the longest expected job, such as six times the typical duration. Extend it while working, with SQS's `ChangeMessageVisibility` called every so often, as a heartbeat, for jobs whose length varies. And make the job idempotent, Part III, because no timeout can be perfect. A worker can pause for a long garbage collection, lose network for a minute, or simply be slower than anyone guessed.

The opposite mistake is a timeout that is far too long. If a worker crashes holding a message with a 12-hour visibility timeout, the message sits hidden for 12 hours before anyone retries it. Short timeouts with heartbeats give fast recovery and protection against duplicates, which is why most mature job systems, such as Sidekiq Enterprise, Temporal and Celery with acks late, work that way.

Kafka has no per-message timeout. A consumer holds a whole partition, and the equivalent rule is `max.poll.interval.ms`, five minutes by default. If a consumer does not ask for more records within that time, the group assumes it is stuck and gives its partitions to someone else, Part VI.

## 5. Prefetch and backpressure

Fetching one message per round trip is slow, so brokers let consumers take several at a time. RabbitMQ calls this the **prefetch count**, the number of unacknowledged messages the broker will push to one consumer. SQS lets a receive return up to 10 messages. Kafka consumers fetch batches up to `max.poll.records`, 500 by default.

A high prefetch improves throughput when jobs are fast and uniform, because the consumer always has work ready. It hurts when jobs vary. Suppose Wren's PDF workers use a prefetch of 100. A slow worker, stuck on a complex receipt, holds 99 messages in its buffer that it will not touch for minutes, while a fast worker next to it sits idle with an empty buffer. Those 99 jobs are also all redelivered if the slow worker crashes. With a prefetch of 1 to 10, work goes to whoever is actually free.

@fig be_q_prefetch | A large prefetch lets a slow worker hoard work. A small one keeps it flowing to whoever is free.

**Backpressure** is the general name for a slow part of a system pushing back on a fast part, so the fast part slows down instead of overwhelming it. Prefetch limits are one form. They stop a broker from flooding a consumer's memory. A bounded queue is another. When it is full, the producer's publish blocks or fails, and the producer must slow down, drop, or buffer elsewhere. RabbitMQ applies backpressure to publishers when memory or disk runs low, and Kafka producers block when their buffer fills.

The opposite of backpressure is an unbounded buffer, a queue in memory that grows until the process runs out of memory and crashes, losing everything in it. Wren's rule is that every buffer has a limit and every limit has a defined behaviour when reached, block, reject with 503, or drop the lowest-priority work. Unit X returns to this as load shedding.

Inside a worker, concurrency is a second dial. One worker process can handle several jobs at once with threads or async tasks. The total in-flight work is workers × concurrency, and it must fit the downstream limits, the email provider's rate limit, the database pool from Unit VI, or the kitchen API's capacity. A fleet of 40 workers each running 10 jobs at once can easily send 400 concurrent requests to a provider that allows 100.

## 6. Backlogs and worker sizing

A queue's depth changes by the difference between what arrives and what leaves. On Friday evening Wren's kitchen notification jobs arrive at 50 per second, and its workers, slowed by a sluggish kitchen API, complete 40 per second. Depth grows by 10 per second, 600 a minute, 36,000 an hour. Nothing has failed. Every job will eventually be processed. But a kitchen ticket that arrives an hour late is a failure as far as the customer is concerned.

@fig be_q_bathtub | Fifty in, forty out. The level rises steadily, and the only fix is the rates.

The arithmetic is the bathtub's. A backlog B drains at the surplus rate, so draining takes B ÷ (service rate − arrival rate). If Wren adds workers to reach 70 per second after an hour of growth, the 36,000 backlog drains at 70 − 50 = 20 per second, which takes 1,800 s, half an hour. Even after capacity is restored, the queue stays long for a while, and the jobs at the back wait the whole time.

Little's law gives the waiting time. In a steady state, the average time in queue equals depth ÷ throughput. A queue holding 36,000 jobs and processing 40 per second makes a new job wait 900 s, fifteen minutes. That is why Wren alerts on the **age of the oldest message**, which SQS reports as `ApproximateAgeOfOldestMessage`, not only on depth. Depth tells you how much work there is. Age tells you how late it is.

Sizing workers starts from Little's law too. Kitchen jobs at 50 per second taking 0.2 s each need 50 × 0.2 = 10 concurrent workers at least. Wren runs 16 for headroom and autoscales on queue age, adding workers when the oldest message passes 30 s. Autoscaling on CPU is a common mistake for workers, because a worker waiting on a slow API uses little CPU while its queue grows.

There is a limit to scaling, though. If the kitchen API is the bottleneck, more workers only send it more concurrent requests and may slow it further. When the downstream cannot go faster, the choices are to accept the delay, to prioritize, sending new orders' tickets before old status updates, or to shed work that has lost its value, such as a "your food is 5 minutes away" message that is now 30 minutes old.

:::story Picture this
A post office on the day before a holiday. Letters arrive faster than clerks can sort them, and the pile in the back room grows by the hour. Hiring more clerks helps, but the pile still takes time to clear, and the letters at the bottom are the oldest. A good manager counts how long the oldest letter has waited, not just how tall the pile is, and sends the urgent parcels to the front.
:::

:::note Priority without starvation
Separate queues per priority, with more workers or weighted polling for the high-priority queue, is usually simpler than priority inside one queue. RabbitMQ supports per-message priorities, and SQS does not. Weighted polling, such as reading high, high, low in rotation, keeps low-priority work moving instead of starving it forever.
:::

:::warn Watch out
Autoscaling workers on CPU utilization fails for I/O-bound jobs, which wait on networks while using little CPU. Scale on queue depth divided by throughput, or better on the age of the oldest message, and cap the worker count at what the downstream service can absorb.
:::

:::interview Interview lens
**"Your job queue keeps growing. How do you reason about it?"** Depth changes by arrival rate minus completion rate, so first measure both. 50 in and 40 out grows 36,000 an hour, and draining needs a surplus, 36,000 at 20 per second takes half an hour. Find the bottleneck, worker count, worker speed or the downstream service. Scale workers using Little's law and queue age, check prefetch so slow workers do not hoard, prioritize urgent work, shed stale work, and alert on the age of the oldest message.
:::

:::key In one breath
A visibility timeout or lease hides a message while one worker handles it, and a 30 s timeout on a 40 s job delivers it twice, so timeouts must exceed jobs, be extended by heartbeats, and be backed by idempotent workers. Prefetch trades throughput for fairness, and a large one lets slow workers hoard, while backpressure and bounded buffers make slow parts push back instead of overflowing. Backlogs grow by arrivals minus completions, 36,000 an hour at 50 in and 40 out, drain only at the surplus rate, and are best watched by the age of the oldest message.
:::

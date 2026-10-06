@part II | More limiting algorithms | We look at the algorithms that give accurate limits with constant state per key. Each makes a different choice about bursts, which is the real design question behind any limit. We will cover the sliding window counter, the token bucket, and the leaky bucket with its one-timestamp form, GCRA. | where:2

## 4. The sliding window counter

The **sliding window counter** approximates the sliding log with two numbers. It keeps fixed-window counters for the current minute and the previous one, and estimates how many requests fell in the last 60 s by assuming the previous minute's requests were spread evenly across it.

Suppose it is 15 s into the current minute, 25% of the way through. The last 60 s include the final 45 s of the previous minute, 75% of it, and all 15 s so far of the current one. If the previous minute had 84 requests and the current one has 36 so far, the estimate is 84 × 0.75 + 36 = 99. That is under 100, so one more request is allowed.

$$\text{estimate} = \text{prev} \times \left(1 - \frac{t_{elapsed}}{w}\right) + \text{curr}$$

Read it as "the part of the previous window that still overlaps, plus everything in this one". The state is two counters per key, the work is two reads and one increment, and the boundary burst mostly disappears. A client that sends 100 requests at the end of one minute finds them still counted, at full weight, in the first instants of the next.

@fig be_rl_counter | The 60 s window slides across two fixed windows, weighting the older one by its overlap.

The assumption of an even spread is where error enters. If all 84 of the previous minute's requests came in its last second, the true count in the last 60 s is 84 + 36 = 120, and the estimate of 99 lets the client exceed the limit. If they all came in its first second, the true count is 36, and the estimate is too strict. Cloudflare reported in 2017 that across 400 million requests the approach wrongly allowed or limited only 0.003% of them, which is accurate enough for most API limits.

In Redis the counter needs two keys per user per minute, or a hash with two fields, and a short Lua script that reads both, computes the estimate, increments the current counter if allowed and sets an expiry of two windows. That keeps the read-decide-write atomic, the same requirement every algorithm in this part shares.

## 5. The token bucket

The **token bucket** is the most widely used algorithm for API limits, because it states the burst explicitly. Each key has a bucket that holds up to a **capacity** of tokens and is refilled at a steady **rate**. Each request takes one token. If the bucket has a token, the request is allowed. If it is empty, the request is refused, or waits.

Wren's API limit is a bucket with capacity 20 and a refill rate of 100 tokens per minute, about 1.67 per second. A user who has been idle has a full bucket and can make 20 requests at once, a burst, which suits an app opening and loading a screen of data in parallel. After that they can make one request every 0.6 s, the refill interval. An empty bucket becomes full again after 20 ÷ 1.67 = 12 s of rest. Over any long period, the rate cannot exceed 100 per minute plus the initial 20.

@fig be_rl_token | Tokens drip in at 1.67 per second up to 20. Each request takes one.

The bucket needs no timer to refill it. The state is the token count and the time of the last update. When a request arrives, the limiter computes the tokens added since the last update, rate × elapsed time, adds them up to the capacity, then tries to take one. A Redis implementation keeps both values in a hash and runs the arithmetic in a Lua script with the server's clock, so every instance sees the same bucket.

Two parameters give the design freedom fixed windows lack. Capacity answers "how big a burst is acceptable", and rate answers "what is the sustained limit". A partner with a nightly batch might get capacity 500 and rate 10 per second. A login endpoint might get capacity 5 and rate 5 per minute. Tokens can also be weighted, so an expensive request takes 5.

The token bucket is the algorithm behind AWS API Gateway's throttling, Stripe's API limits and many others. Network equipment has used it for decades to shape traffic. Its sibling, the leaky bucket, makes the opposite choice about bursts.

## 6. The leaky bucket and GCRA

The **leaky bucket** pictures requests poured into a bucket with a small hole in the bottom. Water leaks out at a constant rate however fast it pours in. If requests arrive faster than the leak, the bucket fills, and once it is full, new requests overflow and are refused. Used as a queue, the leaky bucket smooths bursty input into perfectly even output, which suits work that must be sent to a downstream at a steady pace, such as calls to a partner that throttles harshly.

@fig be_rl_leaky | Requests pour in unevenly, leave at a steady 1.67 per second, and overflow when the bucket is full.

Used as a meter rather than a queue, the leaky bucket decides only whether to admit each request, without delaying it, and it then behaves exactly like a token bucket with the same rate and capacity. The two names describe the same arithmetic from opposite sides, one counting tokens available and the other counting water accumulated.

The **generic cell rate algorithm**, GCRA, designed for ATM networks in the 1990s, implements the metering form with a single timestamp per key. It stores the **theoretical arrival time**, TAT, the time at which the key's next request would be exactly on schedule. The **emission interval** T is the time between requests at the sustained rate, 60 ÷ 100 = 0.6 s for Wren. The **burst tolerance** τ is how far ahead of schedule a client may run, (capacity − 1) × T = 19 × 0.6 = 11.4 s for a burst of 20.

@fig be_rl_gcra | Now is 10 s behind the theoretical arrival time, within the 11.4 s tolerance, so the request is allowed.

When a request arrives at time now, GCRA allows it if TAT − now ≤ τ, and then sets TAT to max(TAT, now) + T. If the request would put the key more than τ ahead of schedule, it is refused, and TAT − τ − now is exactly the Retry-After value. One key, one number and one short Lua script give token bucket behaviour with no refill computation, which is why libraries such as redis-cell and many gateways use it.

@fig be_rl_compare | The five algorithms compared on state, bursts and accuracy.

Choosing among them is mostly about bursts and memory. Fixed windows suit coarse quotas. Sliding logs suit low-volume limits that must be exact, such as login attempts. Sliding counters and token buckets, or GCRA, suit most API limits, with token buckets preferred when the burst should be explicit. Leaky buckets as queues suit outgoing traffic that must be smooth.

:::story Picture this
A token bucket is a jar of arcade tokens refilled by one every few seconds. If you saved up, you can play twenty games in a row, then you wait for each new token. A leaky bucket is a funnel over a single spout. Pour as fast as you like, and the drink still comes out at the same steady trickle, until the funnel overflows.
:::

:::note Sharing the clock
Every algorithm here compares times. If each app instance uses its own clock, a few seconds of drift between instances becomes a few seconds of error in every limit. Running the arithmetic in Redis with `redis.call('TIME')`, or passing the Redis time to the script, gives all instances one clock.
:::

:::warn Watch out
A token bucket with a large capacity can defeat the purpose of the limit for a protected resource. If the database can take 2,000 searches per second, a global bucket with rate 2,000 and capacity 50,000 still lets 50,000 arrive in one second after a quiet period. Size capacity from what the protected resource can absorb in a burst, not from what clients would like.
:::

:::interview Interview lens
**"Explain the token bucket and how you would implement it across many servers."** Each key has a bucket with a capacity, the allowed burst, refilled at a steady rate, the sustained limit. A request takes a token or is refused. State is the token count and last update time, and on each request the limiter adds rate × elapsed tokens up to the capacity, then tries to take one. Across servers, keep the state in Redis and do the computation in a Lua script using Redis's clock so it is atomic, or use GCRA, which needs only a theoretical arrival time per key.
:::

:::key In one breath
The sliding window counter estimates the last 60 s as prev × overlap + current, 84 × 0.75 + 36 = 99 in the example, with two counters and very small error in practice. The token bucket holds up to a capacity of tokens refilled at a steady rate, Wren's 20 tokens at 1.67 per second allowing a burst of 20 and then one request every 0.6 s, refilling fully in 12 s. The leaky bucket smooths output as a queue and equals the token bucket as a meter, and GCRA implements it with one theoretical arrival time, T = 0.6 s and τ = 11.4 s for Wren.
:::

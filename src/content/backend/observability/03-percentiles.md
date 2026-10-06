@part III | Latency percentiles | We learn to describe latency the way users experience it, as a distribution with a long slow tail. A single average blends fast and slow requests into a number no request actually had. We will cover why the average hides a disaster, how percentiles are computed from histogram buckets, and why tail latency grows when one request fans out to many. | where:3

## 9. Why the average hides a disaster

Wren's dashboard used to show one latency line, the mean, and it sat at a comfortable 75 milliseconds. Customers were nonetheless complaining that checkout sometimes hung for several seconds. Both were true. Take 1,000 checkout requests in which 985 finish in 30 ms and 15 wait 3,000 ms for a payment provider that is timing out. The mean is (985 × 30 + 15 × 3,000) ÷ 1,000 = (29,550 + 45,000) ÷ 1,000 = 74.55 ms. No request took anywhere near 75 ms. The typical request took 30 ms and the unlucky ones took 3 seconds, and the mean described neither.

A **percentile** answers a different question. The p99 latency is the value that 99% of requests are at or below, so 1% are slower. Here the 990th fastest request is one of the slow ones, so p99 is 3,000 ms, which shows the problem at once. The **median**, p50, is the middle value, 30 ms, which describes the typical request. Teams usually watch p50, p90 or p95, p99, and for large services p99.9. Each says something different: p50 is the normal experience, p99 is the experience of the one request in a hundred that is unlucky, and p99.9 shows rare but serious stalls such as garbage collection pauses or lock waits.

@fig be_obs_mean_lies | 985 requests at 30 ms and 15 at 3 s. The mean of 74.55 ms falls in a gap where no request lives.

Latency distributions are almost never symmetric. They have a hard floor, a request cannot be faster than its network round trip and its minimum work, and a long tail to the right made of cache misses, retries, queueing, GC pauses and slow dependencies. Many are **bimodal**, with two humps. Wren's `GET /orders/123` has a cache-hit hump near 5 ms and a cache-miss hump near 60 ms. With 90% hits the mean is 0.9 × 5 + 0.1 × 60 = 10.5 ms, again a value between the humps that matches no real request. Any change to the hit ratio moves the mean, and you cannot tell from the mean whether hits got slower or there were more misses.

The tail matters more than the 1% suggests, because users make many requests. A page that loads with 20 API calls, each with a 1% chance of exceeding p99, has a 1 − 0.99²⁰ = 18.2% chance that at least one call is that slow. Nearly one page load in five sees the p99. And the users who make the most requests, Wren's most active customers and restaurants with the largest menus, see the tail most often. Amazon's internal practice of setting targets at p99.9 came from exactly this observation, that its most valuable customers had the most data and the slowest requests.

## 10. Percentiles from histogram buckets

Computing an exact p99 means keeping every observation and sorting them, which no metric system does at 2,000 requests a second across a fleet. Prometheus estimates percentiles from histogram buckets instead, section 6. Wren's latency histogram for one minute of `GET /orders/:id` across all four instances has these cumulative counts: 1,200 requests at or under 10 ms, 4,100 under 25 ms, 7,600 under 50 ms, 9,300 under 100 ms, 9,920 under 250 ms, 9,975 under 500 ms, 9,995 under 1,000 ms and 10,000 in total.

To find p50, the estimator needs the 5,000th request. It falls between the 25 ms bucket, which holds 4,100, and the 50 ms bucket, which holds 7,600, so it lies in the 25 to 50 ms range, which contains 3,500 requests. Assuming they are spread evenly through that range, the 5,000th is 900 requests in, so p50 ≈ 25 + (900 ÷ 3,500) × 25 = 31.4 ms. For p99 the 9,900th request lies in the 100 to 250 ms range, between counts 9,300 and 9,920, so p99 ≈ 100 + (600 ÷ 620) × 150 = 245.2 ms. For p99.9, the 9,990th lies between 9,975 and 9,995 in the 500 to 1,000 ms range, giving 500 + (15 ÷ 20) × 500 = 875 ms. This is what Prometheus's `histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))` does.

@fig be_obs_buckets | Cumulative buckets for 10,000 requests. The 9,900th falls in the 100 to 250 ms bucket, and interpolation places it at 245.2 ms.

The estimate is only as good as the buckets. All the estimator knows is that the 9,900th request took between 100 and 250 ms. The true value could be 101 ms or 249 ms. If Wren's SLO threshold is 300 ms, a bucket boundary at 300 ms makes "what fraction is under 300 ms" exact, which is why bucket bounds should be placed at the thresholds people care about. Wide buckets at the high end make p99.9 especially rough. Native and exponential histograms fix this by using many narrow buckets with boundaries a fixed ratio apart, keeping relative error to a few percent.

Two more rules prevent wrong answers. First, percentiles cannot be averaged. The mean of four instances' p99s is not the fleet's p99, and neither is the p99 of per-minute p99s over an hour. Combine the bucket counts first and then estimate, which histograms allow and summaries do not. Second, check the count. A p99 computed from 30 requests is the value of roughly the slowest one and moves wildly. Wren's dashboards show the request count beside every percentile so that a low-traffic route's frightening p99 can be read in context.

## 11. Tail latency and fan-out

Wren's restaurant dashboard page is assembled by a backend that calls ten services in parallel, orders, menu, reviews, payouts and six more, and waits for all of them. Each service is healthy, with a p99 of 250 ms. How often is the page slow? The page is as slow as its slowest call. Each call has a 1% chance of exceeding its p99, so the chance that all ten avoid it is 0.99¹⁰ = 0.904, and the chance that at least one is slow is 9.6%. With 100 parallel calls, as in a search query spread over 100 shards, it is 1 − 0.99¹⁰⁰ = 63.4%. The rare event for each backend becomes the common case for the request.

This was the central point of Jeffrey Dean and Luiz Barroso's 2013 paper "The Tail at Scale", written from Google's experience. In systems with wide fan-out, component tails become the user-facing median. A service that looks fine by its own p99 can make every request that touches it slow.

@fig be_obs_fanout | Ten parallel calls each with a 1% tail make 9.6% of pages slow. A hundred make 63.4%.

There are three responses. The first is to cut the tail at its source, by finding what makes the slowest 1% slow, GC pauses, lock contention, cold caches, noisy neighbours, a slow disk, and fixing it, which Part VIII's tools are for. The second is to tolerate it with techniques from Unit X: **hedged requests**, which send a second copy of a request to another replica if the first has not answered by the p95 and use whichever replies first, and tight per-call timeouts with partial results, so the dashboard shows nine panels and a "reviews unavailable" placeholder rather than waiting. Dean and Barroso report that hedging after the p95 cut a fan-out's p99.9 sharply for about 2% extra load. The third is to reduce fan-out by caching combined results or precomputing the page.

Measuring the tail honestly needs care too. Load-testing tools that send one request, wait for its reply and only then send the next will, during a stall, simply stop sending, so the stall is recorded as one slow request instead of the hundreds that real users would have queued up behind it. Gil Tene named this **coordinated omission**. Tools such as wrk2 and k6 with arrival-rate executors send at a fixed rate regardless of replies, which measures what users would actually see. Part VIII returns to load testing.

:::story Picture this
A school trip that waits for every pupil before the coach leaves. Each child is late only one day in a hundred, but with forty children the coach leaves late on a third of trips. Measuring the average child's punctuality says nothing about whether the coach leaves on time.
:::

:::note Apdex and fractions over a threshold
Some teams prefer "what fraction of requests finished under 300 ms" to "what is p99". The fraction is exact if a bucket boundary sits at 300 ms, adds across instances and time windows, and maps directly to an SLO, Part VI. Apdex is an older score built on the same idea, counting requests as satisfied, tolerating or frustrated against two thresholds.
:::

:::warn Watch out
Averaging percentiles, across instances or across time, produces numbers that look plausible and mean nothing. Sum the histogram buckets first, then compute the percentile, and show the request count next to it.
:::

:::interview Interview lens
**"Why not just monitor average latency?"** Latency is skewed with a long tail and often bimodal, so the mean lands between real values, 985 requests at 30 ms and 15 at 3 s average 74.55 ms. Percentiles show the typical case and the tail separately. Users make many requests, so a page with 20 calls sees a p99 on 18% of loads, and a fan-out to 100 backends sees one on 63% of requests. Use histograms so percentiles can be aggregated across the fleet, put bucket bounds at the thresholds you care about, and measure with tools that avoid coordinated omission.
:::

:::key In one breath
Averages hide tails, 985 requests at 30 ms and 15 at 3,000 ms give a mean of 74.55 ms that no request had, while p99 shows 3,000 ms. Percentiles are estimated from cumulative histogram buckets by interpolation, so 9,900 of 10,000 requests landing between counts 9,300 and 9,920 in the 100 to 250 ms bucket gives p99 ≈ 245.2 ms, with accuracy set by bucket width. Never average percentiles, sum buckets first. Fan-out turns component tails into common latency, 1 − 0.99¹⁰ = 9.6% for ten calls and 63.4% for a hundred, which hedging, timeouts and partial results address.
:::

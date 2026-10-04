<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Records, indexes, query plans, joins, transactions, isolation, MVCC, locks, recovery, replication, and sharding through a score write. Explain the physical work behind each query and the exact guarantee behind each acknowledged write.</p>

Read each small topic as a separate whiteboard explanation. First draw the four event rows and three user rows from Part I. The index sections rearrange their keys, the joins combine their records, and the transaction sections change their state. Read the paragraph, execute its tiny example, then check that you could redraw the intermediate state yourself.

The orange map marks the part you are reading. Picture this boxes give a physical analogy, notes explain a useful variant, warnings name a mistake, and interview boxes give an answer you can say aloud. Each part closes with In one breath. The interview page has questions, graded exercises, and worked answers; use it after reading, with the diagrams hidden.

These are design lessons, not measured capacity claims. All Heron workloads, durations, limits, and record sizes are illustrative assumptions. The shared workload arithmetic lives in `scripts/system-design/numbers.py`; this chapter's page, join, transaction, and migration traces live in `scripts/system-design/database-review-numbers.py`. Product-specific behavior is linked to primary documentation. Capacity still needs a load test on your workload.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Heron

**Heron** is an illustrative live-score and media service. A scorer changes a match, viewers read its score, subscribers receive updates, and users upload clips. We keep the workload fixed across the series so a faster path, a replica, or a cache changes the same calculation instead of quietly changing the question.

| Assumed setting | Symbol | Value | What it controls |
|---|---|---|---|
| Daily API requests | $D$ | 8,640,000 | Baseline request demand |
| Peak multiplier | $p$ | 10 | Peak relative to daily average |
| Mean response time at peak | $W$ | 0.2 s | Mean in-flight work |
| API response size | $b$ | 2,000 bytes | Payload bandwidth |
| Stored record size | $r$ | 500 bytes | An illustrative write workload |
| Record retention | $t$ | 30 days | Storage calculation |
| Live events | $e$ | 20 per second | Fan-out input |
| Live viewers | $v$ | 50,000 | Fan-out recipients |
| Event payload | $m$ | 200 bytes | Live payload bandwidth |
| Gateway capacity assumption | $g$ | 10,000 connections | A sizing exercise, not a benchmark |
| Replication factor | $N$ | 3 | Copies of a logical record |
| Rate policy | $L$ | 100 requests per user per minute | Admission rule |

The computed baseline is 100 requests per second on average and 1,000 at peak. At the assumed mean latency, 200 requests are in flight. Live fan-out is 1,000,000 deliveries per second, carrying 200,000,000 payload bytes per second before protocol overhead. These are different workloads; never size the live path using the API request rate.

</section>

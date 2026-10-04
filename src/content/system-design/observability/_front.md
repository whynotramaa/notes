<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Seeing the production system. Explain each state change, its cost, and its failure boundary.</p>

Read each small topic as a separate whiteboard explanation. Start with the concrete failure, follow the mechanism, and check the worked example before looking at the picture. A paragraph introduces one idea; the next picture shows the state or message that changes. You should be able to redraw it and say where it can fail.

The orange map marks the part you are reading. Picture this boxes give a physical analogy, notes explain a useful variant, warnings name a mistake, and interview boxes give an answer you can say aloud. Each part closes with In one breath. The interview page has questions, graded exercises, and worked answers; use it after reading, with the diagrams hidden.

These are design lessons, not measured capacity claims. All Heron workloads, durations, limits, and record sizes are illustrative assumptions. The arithmetic lives in `scripts/system-design/observability-numbers.py`; real product behavior is linked to its primary documentation. A decimal MB is a million bytes; a GiB is a power-of-two unit. Capacity still needs a load test on your workload.

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

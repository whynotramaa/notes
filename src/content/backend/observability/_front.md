<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every earlier unit ended with a warning that something can fail quietly: a pool that fills, a consumer that falls behind, a cache that stops hitting. This unit is about seeing those failures, first from the outside as a user would, then from the inside, until the cause is a line of code or a setting someone can change.</p>

Parts I to IV cover the three kinds of telemetry. Logs record individual events, metrics count and measure in aggregate, and traces follow one request across services. Part III sits between them because percentiles, and the way an average hides a disaster, matter for everything after. Part V turns telemetry into dashboards and alerts using the golden signals, RED and USE. Part VI sets reliability targets with SLIs, SLOs and error budgets, and alerts on burn rate. Part VII covers health checks. Part VIII is performance engineering, from Little's law to flame graphs and load tests. Parts IX and X practise the questions interviews ask, what happens when Redis, the database or a queue fails, and how to debug a slow API, a hot CPU, a growing heap and a bad deploy.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to design the logging, metrics and tracing for a service, compute a percentile from histogram buckets, set an SLO with burn-rate alerts, write health checks that do not cause outages, and walk an interviewer from "p99 doubled" to a root cause.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Daily requests | 43,200,000 (500/s average, 2,000/s peak) | Log and trace volume |
| Latency | mean 50 ms at peak, p50 30 ms, p99 250 ms | Percentiles |
| Instances | 4, database pool of 10 each | Saturation |
| Log output | 5 lines per request, 400 bytes each | Log cost |
| Routes and status codes | 120 routes, about 10 status codes in use | Metric cardinality |
| Trace sampling | 10% of requests, about 20 spans each | Trace cost |
| Availability SLO | 99.9% of requests over 30 days | Error budget |
| Kafka `order-events` | 12 partitions, 50 orders/s at peak | Consumer lag |
| Sample request | `GET /orders/123` by user 42, request id `req_7Hq2` | Correlation |

The unit ends with one evening's incident, a deploy that doubles p99 latency, traced from the first alert to the line of code.

</section>

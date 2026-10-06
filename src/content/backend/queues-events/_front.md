<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A request should do what the user is waiting for and nothing else. Everything else, the email, the receipt, the kitchen ticket, the analytics, is work that can happen a moment later, and this unit is about making sure it does happen, exactly as often as it should.</p>

The first four parts cover queues and background jobs. They explain why work leaves the request, how consumers take and acknowledge messages, what "at least once" and "exactly once" really promise, and what to do with messages that fail. Parts V to VII cover Kafka, which looks like a queue and is really a replicated log, from partitions and offsets to replication, transactions and the operational problems of lag and ordering. Parts VIII and IX lift the view to events as a way of designing systems, with schemas, eventual consistency, event sourcing, the transactional outbox and sagas. Part X handles scheduled work and follows one order's events end to end.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to explain why exactly-once delivery is hard and what to build instead, size a worker pool and a backlog, choose Kafka partition keys, design an outbox, and answer "you have 20 instances, how does a daily job run once?"

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Orders at peak | 50 per second | Job and event volume |
| Events per order | about 5 (placed, paid, accepted, assigned, delivered) | 250 events per second at peak |
| Average event size | 1 KB | Kafka storage |
| Kafka topic `order-events` | 12 partitions, replication factor 3, `min.insync.replicas` 2 | Parallelism and durability |
| Retention | 7 days | Replay window |
| Receipt email | 300 ms per send | Worker sizing |
| Receipt PDF | 800 ms per render | Worker sizing |
| Queue visibility timeout | 30 s | Redelivery |
| Retry policy | 8 retries with waits from 1 s doubling to 128 s, then a dead-letter queue | Failure handling |
| App instances | 20 at peak | Scheduled job duplication |

The main flow in this unit is what happens after `POST /orders` commits order 124. Part X follows its events to the kitchen, the receipt, analytics and search.

</section>

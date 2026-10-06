<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every backend depends on things it does not control, clients that send too much, services that answer too slowly, providers that go down, and mail servers that decide whether your receipts are spam. Resilience is the set of habits that keep one misbehaving party from taking everyone else down with it.</p>

The first three parts protect Wren from its callers with rate limits, from the five classic algorithms to limits shared across a fleet and limits that are really security controls. Parts IV to VI protect Wren from its dependencies. They cover timeouts and deadlines, retries that help rather than hurt, and the circuit breakers, bulkheads and fallbacks that contain a failing dependency. Parts VII to IX deal with the outside world, receiving and sending webhooks, integrating third-party APIs, and getting email delivered. Part X follows a payment call through every protection.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to implement a token bucket in Redis, explain why a dependency that takes 30 s instead of 30 ms can take down three services, design a webhook receiver that survives duplicates and replays, and explain why a receipt landed in spam.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| API rate limit | 100 requests per user per minute, burst 20 | Rate limiting examples |
| Login limit | 5 attempts per account per minute | Security limits |
| Instances | 20 at peak | Distributed limits |
| Gateway deadline | 300 ms for reads, 3 s for checkout | Timeouts |
| Payment provider | p99 400 ms normally, limit 100 requests per second | Integration |
| Provider timeouts | connect 200 ms, overall 2 s | Timeout values |
| Circuit breaker | opens at 50% failures over the last 20 calls, stays open 30 s | Breakers |
| Payments bulkhead | 20 concurrent calls per instance | Isolation |
| Webhook tolerance | 300 s timestamp window | Replay protection |
| Receipts | 50 per second at peak, 180,000 an hour | Email volume |

The main flow in this unit is `POST /orders/124/pay`, the checkout payment, and the webhook that later confirms it. Part X follows both.

</section>

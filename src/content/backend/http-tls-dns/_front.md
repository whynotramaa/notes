<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every backend request starts as a name, becomes an address, crosses an encrypted connection and arrives as an HTTP message. This chapter follows that path slowly enough that you can redraw each step and say what breaks when it fails.</p>

Each section opens with a situation you can picture, explains the mechanism, and works one example with real numbers. Then comes a figure. Read the paragraph first, look at the figure, and check that you could have drawn it yourself. If you could not, read the paragraph again before moving on.

The orange map at the start of each part shows where you are on the path. Four kinds of box interrupt the text. *Picture this* gives a physical analogy, a note adds a useful side detail, *Watch out* names a mistake people make in code or in interviews, and *Interview lens* gives a question with an answer you can say aloud. Each part ends with *In one breath*, a short recap worth memorising.

The goal is concrete. By the end you should be able to stand at a whiteboard and answer "walk me through what happens after I type `https://api.wren.example/orders/123`" for ten minutes, naming each round trip, each header that matters and each status code the server could return.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

Abstract examples are easy to nod along to and hard to remember. So every unit of this series uses the same small service. **Wren** is an illustrative food-ordering API. Customers browse a menu, place orders and pay. Its numbers are assumptions chosen to make the arithmetic readable, not benchmarks.

| Setting | Value | What it controls |
|---|---|---|
| API host | `api.wren.example`, `203.0.113.10` | The name we resolve and connect to |
| Daily requests | 43,200,000 | 500 requests per second on average |
| Peak multiplier | 4 | 2,000 requests per second at peak |
| Mean latency at peak | 50 ms | 100 requests in flight |
| App instances | 4 | 500 requests per second each at peak |
| Response size | 2,000 bytes | 4,000,000 bytes per second at peak |
| Client round-trip time | 40 ms | Cost of every handshake |
| Server time for `GET /orders/123` | 30 ms | The useful work |
| DNS TTL | 300 s | How long a stale address can live |
| Certificate lifetime | 90 days | Renewal schedule |

In this chapter the sample request is `GET /orders/123`, sent by user 42 from a phone. By Part IX we will have counted every round trip it takes, from a cold start at 175 ms down to 70 ms on a reused connection.

</section>

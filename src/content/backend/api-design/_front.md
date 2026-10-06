<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">An API is a promise to everyone who calls it, and the code behind it is a promise to everyone who will change it next year. This chapter covers both halves, designing the outside of a service so clients can rely on it and organising the inside so engineers can.</p>

The first six parts look at the API from outside. They cover resources and REST conventions, pagination that stays fast and correct, versioning and bulk operations, idempotency keys for safe retries, the alternatives RPC, GraphQL and gRPC, and the contracts that keep clients and servers in agreement. The last four look inside. They cover the classic application layers and the architectures built around them, an error model that tells clients the truth without leaking secrets, the test suite that proves it all, and the code-quality habits that keep it changeable.

Each section starts from a Wren situation, explains the mechanism, works an example with numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

The goal is to be able to design Wren's order API on a whiteboard, defend every URL, status code and pagination choice, and then draw where each line of the server code would live.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic.

| Setting | Value | What it controls |
|---|---|---|
| Orders table | 5,000,000 rows | Pagination cost |
| Page size | 20 | Rows per page |
| Orders created at peak | 50 per second | Idempotency key volume |
| Idempotency key retention | 24 hours, about 300 bytes per row | Key storage |
| Typical list response | 20 orders with restaurant and 5 items each | GraphQL N+1 example |
| Request deadline at the gateway | 300 ms | gRPC deadline propagation |
| Test suite | 1,000 unit, 200 integration, 20 end-to-end | Test pyramid example |
| API versions | v1 (deprecated), v2 (current) | Versioning example |

The main request in this unit is `POST /orders`, which user 42 sends to place a biryani order with restaurant 9. Part X follows it through every layer of the server.

</section>

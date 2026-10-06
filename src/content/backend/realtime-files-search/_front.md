<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Most of this series has been about a request that arrives, does a little work and leaves. This unit covers three things that break that shape: news that the server must push to a client that did not ask, files too large to pass through an API, and queries that a database index cannot answer well.</p>

Parts I to IV are about realtime. They compare polling, long polling, server-sent events, WebSockets and WebTransport, open the WebSocket protocol, deal with authentication, ordering and slow clients, and then scale connections across servers with fan-out, presence and reconnect storms. Parts V and VI are about files. They cover how uploads arrive, how to validate them without trusting anything the client says, and why large files should go straight to object storage through presigned URLs. Parts VII to X are about search, from the limits of `LIKE` through analyzers, inverted indexes and BM25 to search engines, embeddings, HNSW and hybrid retrieval. Part XI follows one evening's tracking, upload and search.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to choose a realtime transport and defend it, design a WebSocket service for a million connections, design a safe upload path, compute a BM25 score by hand, and explain why hybrid search beats either keywords or vectors alone.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements.

| Setting | Value | What it controls |
|---|---|---|
| Active orders being tracked | 50,000 at peak, each about 40 minutes with 5 status changes | Realtime load |
| Realtime connections | up to 200,000, about 20 KB of state each | WebSocket scaling |
| Couriers online | 5,000, heartbeating every 10 s | Presence |
| Photo uploads | 500 per minute, about 5 MB each, over 10 Mbit/s uplinks | Upload path |
| Large uploads | restaurant videos up to 5 GB | Multipart upload |
| Menu items | 100,000, average description length 20 terms | Search |
| Embeddings | 768 dimensions, 4-byte floats | Vector search |
| Search shards | 10 | Query latency |

The main flows in this unit are user 42 tracking order 124 live, a customer uploading a photo of their biryani, and a search for "chicken biryani". Part XI follows all three.

</section>

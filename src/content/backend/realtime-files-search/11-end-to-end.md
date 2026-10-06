@part XI | Track, upload and search end to end | We follow one evening in the app that uses all three parts of the unit at once. Each flow keeps large or long-lived work away from the API servers, in a different way. We will cover tracking an order live, uploading a photo, searching for dinner, and the unit on one page. | where:11

## 33. One evening, three flows

User 42 places order 124, and the app opens a live tracking screen. It asks the API for a ticket, `POST /ws-ticket`, and opens an SSE stream to `rt.wren.example/orders/124/events` over HTTP/2 with that ticket. The realtime server redeems the ticket, checks that order 124 belongs to user 42, and subscribes its process to the `order:124` channel on the broker. When the kitchen accepts the order, the order service commits, its outbox event reaches Kafka, Unit VIII, and a publisher sends `order:124 version 3, accepted` to the broker. Only the realtime server holding user 42's stream is subscribed, and it writes the event, with id 3, to the stream. The phone shows "accepted" within a few hundred milliseconds of the commit.

The phone loses signal in a lift. The stream drops with no close frame. When signal returns, `EventSource` reconnects with `Last-Event-ID: 3`, the load balancer sends it to a different realtime server, and that server replays events 4 and 5 from the replay buffer and carries on. The courier's location arrives over the courier app's WebSocket every 5 s, is coalesced to the latest position per order, and appears on the map. No API server held a connection for any of this.

@fig be_rt_e2e | Tracking over a resumable stream, a photo straight to storage, and a search that blends words and meaning.

When the food arrives, user 42 photographs it and uploads it with a review. The app asks the API for a presigned URL. The API checks that user 42 can review order 124, generates `quarantine/u/42/8f3a2c91.jpg`, and returns a `PUT` URL valid for 5 minutes and limited to images under 10 MB. The phone uploads 5 MB directly to object storage. The `ObjectCreated` event starts the pipeline. A worker checks the magic bytes, decodes and re-encodes the image without its GPS metadata, scans it, writes 400 px, 800 px and WebP variants under versioned keys to the public bucket, and marks the review's photo ready in PostgreSQL. The app's next refresh shows the photo from the CDN.

The next evening, user 42 searches "spicy rice dish near me". The search service analyzes the query with the food analyzer, embeds it, and sends one query to the search engine with filters for open restaurants within 5 km. BM25 and HNSW retrieve candidates in parallel from the `menu` alias. RRF fuses them, a cross-encoder reranks the top 50, distance and rating boosts adjust the order, and the first result is restaurant 9's chicken biryani, which BM25 alone would have ranked far lower. A price shown in the results was indexed 2 s after the restaurant's last change, and the dish page, opened from the result, reads the current price from the database.

@fig be_rt_components | Realtime connections, files and search, each a different shape of work leaving the request-response box.

Put together, the unit is three answers to the same question, what to do with work that does not fit one short request. Realtime keeps connections open, so it treats each connection as state, authenticated by tickets, authorized per subscription, bounded by send buffers, fanned out through a broker, and resumed by sequence or event id after the inevitable drops. Files are large and hostile, so they go straight to object storage through presigned URLs, are validated and transformed in quarantine, cleaned up by lifecycle rules, and served from a CDN. Search needs structures a transactional database is not built for, so analyzers, inverted indexes, BM25 and vectors live in an engine that follows the database through a change stream and changes shape safely behind aliases. Unit XIII turns to the attacks that each of these surfaces invites, and the rest of the backend's security.

:::story Picture this
A restaurant on a busy night. The host keeps a pager for each waiting table and buzzes it the moment a table is ready. Deliveries arrive at the back door, are checked against the order and inspected before anything reaches the kitchen. And the head waiter, asked for "something spicy with rice", combines the menu's wording with what diners usually mean, then suggests the dish that fits both. None of these jobs is done at the front counter, which keeps serving.
:::

:::note Measuring all three
Wren tracks realtime delivery latency from commit to client, reconnect rates and replay sizes, upload pipeline time from object creation to "ready" with failure counts by stage, and search latency, zero-result rate and click-through per query type. Each flow has its own dashboard, because each fails in its own way.
:::

:::warn Watch out
All three flows depend on an asynchronous pipeline, the broker for realtime, the processing queue for uploads, the CDC stream for search, and each can fall behind silently while the API looks healthy. Alert on the lag of each pipeline, not only on errors, Unit XIV.
:::

:::interview Interview lens
**"A product needs live order tracking, photo uploads and dish search. Sketch the backend for each."** Tracking: SSE or WebSockets on a separate realtime fleet, ticket authentication, per-subscription authorization, a broker fanning out order channels from outbox events, sequence ids with a replay buffer for resumption, and bounded send buffers. Uploads: presigned PUTs to a quarantine prefix, storage events triggering validation, re-encoding, scanning and thumbnailing, lifecycle cleanup, and CDN delivery. Search: a search engine fed by CDC with versioned upserts and alias reindexing, BM25 plus vector retrieval fused with RRF and reranked, with prices confirmed from the database.
:::

:::key In one breath
Order 124's tracking runs over a ticket-authenticated SSE stream subscribed to `order:124`, fed from the outbox through a broker and resumed with Last-Event-ID 3 on another server after a dropped connection. The review photo goes by presigned PUT to `quarantine/u/42/8f3a2c91.jpg`, is validated, re-encoded without GPS metadata, scanned, resized and served from the CDN. The search for "spicy rice dish near me" fuses BM25 and HNSW results with RRF, reranks the top 50 and applies boosts, finding restaurant 9's chicken biryani with prices confirmed from the database.
:::

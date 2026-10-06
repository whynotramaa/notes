@chapter faq | Interview question bank | Questions in the order of the unit. Answer aloud first, then compare.

### Realtime options

**Q1. What are the costs of polling?**

Most requests return nothing new, wasting capacity, and updates wait up to the polling interval. 50,000 clients at 5 s is 10,000 requests per second, about 1% with news.

**Q2. How does long polling work?**

The server holds each request until there is news or a timeout, then the client immediately asks again. It delivers quickly over plain HTTP at the cost of one held connection per client and a gap after each reply.

**Q3. What are server-sent events?**

A long HTTP response of text events with ids, consumed by EventSource, which reconnects automatically and sends Last-Event-ID so the server can resume. One direction only.

**Q4. When would you choose WebSockets over SSE?**

When the client also sends frequent messages, such as chat, collaboration, games or live location. SSE suffices for server-to-client feeds and works better with standard HTTP infrastructure.

**Q5. What is WebTransport?**

A newer API over HTTP/3 and QUIC with multiple independent streams and unreliable datagrams, avoiding TCP head-of-line blocking. It suits low-latency media and games where support allows.

### The WebSocket protocol

**Q6. Describe the WebSocket handshake.**

An HTTP GET with Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Version 13 and a random Sec-WebSocket-Key. The server answers 101 with Sec-WebSocket-Accept, the base64 SHA-1 of the key plus a fixed GUID.

**Q7. Is the Sec-WebSocket-Key a security feature?**

No. It proves the server understood a WebSocket request rather than replaying something by accident. Authentication and origin checks are separate.

**Q8. What does a WebSocket frame contain?**

FIN, reserved bits, an opcode for text, binary, continuation, close, ping or pong, a mask bit, a length of 7, 16 or 64 bits, an optional mask key, and the payload.

**Q9. Why must clients mask frames?**

So malicious pages cannot craft byte sequences that broken intermediaries would misinterpret and cache, poisoning them for others. Masking is not encryption.

**Q10. How do you detect a dead WebSocket?**

Pings every 30 s or so with a pong timeout, plus application-level pings from browser clients, since abnormal drops send no close frame and TCP may not notice for a long time.

**Q11. How should clients reconnect?**

With exponential backoff and jitter, fresh authentication, and resumption from the last sequence number so missed messages are replayed.

### Realtime application concerns

**Q12. How do you authenticate a WebSocket from a browser?**

Browsers cannot set headers on the handshake. Use a short-lived single-use ticket from the authenticated API, or a cookie with a strict Origin check, and avoid long-lived tokens in URLs because they reach logs.

**Q13. What is cross-site WebSocket hijacking?**

A page on another site opening a WebSocket to your service, with the browser attaching the victim's cookies, since CORS does not apply. Check the Origin header against an allowlist.

**Q14. What authorization does a realtime service need?**

Checks on every subscription and every incoming message, the same as for API requests, rechecked when permissions change, with connections closed when tokens are revoked.

**Q15. How do you handle a slow WebSocket consumer?**

Cap each connection's send buffer, then coalesce to the latest state, drop low-priority messages, or disconnect so the client resumes later. Never buffer without limit.

### Scaling realtime

**Q16. Why are WebSocket servers harder to scale than API servers?**

Each connection is state on one server, so messages must find that server, deploys disconnect clients, and new servers fill only as clients reconnect.

**Q17. How do you deliver a message to a user connected to an unknown server?**

Publish to a channel in a broker such as Redis pub/sub, NATS or Kafka, to which each server subscribes for its clients' rooms, so only servers with interested clients forward it.

**Q18. How would you implement presence?**

Heartbeats every few seconds written as timestamps into a shared store such as a Redis sorted set, with users considered offline after missing several, rather than relying on disconnect events.

**Q19. What is a reconnect storm and how do you prevent it?**

Many clients reconnecting at once after a server restart or network blip, overwhelming handshakes, auth and state loading. Prevent it with jittered backoff, gradual drains, resumption buffers, cached auth and admission control.

### File uploads

**Q20. How is a file sent in multipart/form-data?**

The body has parts separated by a boundary string, each with headers naming the field and, for files, a filename and content type, followed by the bytes.

**Q21. Why stream uploads instead of buffering them?**

Buffering holds whole files in memory or temporary storage, so concurrent large uploads can exhaust resources. Streaming passes chunks through at constant memory and enforces limits early.

**Q22. How do you validate an uploaded file's type?**

Ignore the client's filename and content type, check magic bytes against an allowlist, decode and re-encode images in an isolated worker with size limits, and scan other files for malware before publishing.

**Q23. What is path traversal in uploads, and how do you prevent it?**

A filename such as ../../etc/passwd escaping the upload directory. Never use client filenames for storage, generate keys, and if paths must be built, resolve and check them against the base directory.

**Q24. How should user uploads be served?**

With the true content type, nosniff, Content-Disposition where appropriate, ideally from a separate domain so any content that slipped through cannot run with your site's cookies.

### Object storage

**Q25. How does object storage differ from a filesystem?**

Flat buckets of immutable objects addressed by keys, with metadata, no real directories, renames or partial updates, very high durability, and HTTP access.

**Q26. What is a presigned URL?**

A URL signed with the service's credentials that allows one operation on one key until an expiry, so clients upload or download directly to storage without credentials of their own.

**Q27. Why should large uploads bypass application servers?**

Slow clients would hold application workers for seconds per upload and every byte would cross the application twice. Presigned uploads move the data path to storage.

**Q28. How do multipart uploads work?**

Create an upload, send parts independently and in parallel with checksums, retry failed parts alone, and complete with the list of part ETags. S3 parts are 5 MiB to 5 GiB, up to 10,000 parts and 5 TiB.

**Q29. What are lifecycle rules for?**

Automatically expiring temporary objects, aborting incomplete multipart uploads, and moving aging data to cheaper storage classes, by prefix and age.

### Database search

**Q30. Why is LIKE '%term%' slow?**

A B-tree orders values from their first character, so a leading wildcard cannot use it, and every row is scanned.

**Q31. What do trigram indexes provide?**

Substring and fuzzy matching by indexing three-character sequences, with similarity scores that tolerate misspellings. They suit short fields.

**Q32. When is PostgreSQL full-text search enough?**

When search is word-based over moderate data, needs transactional consistency and SQL filters, and does not need advanced relevance tuning, typo tolerance or many languages at high load.

### Full-text search

**Q33. What does an analyzer do?**

Tokenizes text and transforms tokens by lowercasing, folding accents, removing stop words, stemming and adding synonyms. The same analysis must apply to queries.

**Q34. What is an inverted index?**

A map from each term to a sorted posting list of documents containing it, with term frequencies and positions, so queries intersect or union lists instead of scanning documents.

**Q35. How do phrase queries work?**

Using positions in posting lists to require terms to appear adjacent and in order, or within a given distance for proximity queries.

**Q36. Explain BM25.**

For each query term, IDF, higher for rarer terms, times a term frequency component that saturates towards k1 + 1 and normalizes for document length with b, summed over terms.

### Search engines

**Q37. How does Elasticsearch store data?**

Indexes are split into shards, each a Lucene index with a primary and replicas on different nodes. Shards write immutable segments, refreshed every second for near real-time search, with a translog and background merges.

**Q38. How do you keep a search index consistent with the database?**

Feed it from the database's change stream with an indexer that upserts by id with the source version and handles deletes, accept about a second of lag, and check consistency periodically.

**Q39. How do you change a search mapping without downtime?**

Create a new index behind an alias, backfill it while dual-writing new changes, verify it, swap the alias atomically, and keep the old index for rollback.

**Q40. Why does adding shards not always make search faster?**

Each query fans out to every shard and waits for the slowest, so more shards raise the chance of hitting one shard's tail and add coordination overhead.

### Vector and hybrid search

**Q41. What is an embedding?**

A vector produced by a model so that semantically similar inputs have similar vectors, compared by cosine similarity or dot product.

**Q42. How does HNSW work?**

Layered neighbour graphs with sparse upper layers. Searches walk greedily from the top layer down, then explore a candidate list on the bottom layer, trading recall for speed with ef_search.

**Q43. Why combine keyword and vector search?**

Keywords catch exact names and rare terms, vectors catch meaning and paraphrases, and their failures differ, so fusion with RRF and reranking with a cross-encoder outperforms either alone.

### Primary sources

[RFC 6455, The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455). Handshake, frames, masking and close codes.

[HTML Living Standard, Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html). EventSource and the event stream format.

[Amazon S3 User Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html). Presigned URLs, multipart upload, checksums and lifecycle.

[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Validation, storage and serving.

[Robertson and Zaragoza, The Probabilistic Relevance Framework: BM25 and Beyond, 2009](https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf). BM25 explained by its authors.

[Malkov and Yashunin, HNSW, 2016](https://arxiv.org/abs/1603.09320) and [Cormack et al., Reciprocal Rank Fusion, 2009](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf). ANN graphs and rank fusion.

@chapter exercises | Exercises | One dot is arithmetic, two dots need a trace or explanation, three dots need a proof, code or a full design.

### Realtime

**E1** ● 80,000 orders are polled every 4 s. How many requests per second is that, and what fraction carry news if each 30-minute order changes status 6 times?

**E2** ● The same clients use long polling with a 25 s timeout and no changes. How many requests per second remain, and how many connections are held?

**E3** ● What is the frame header size for a 200-byte message sent by a client, and by the server?

**E4** ● 500,000 connections use about 30 KB each. How much memory is that, and how many servers at 100,000 connections each?

**E5** ● 120,000 clients reconnect with a uniformly random delay up to 60 s. What is the average reconnect rate?

**E6** ● 8,000 couriers heartbeat every 15 s, and are offline after 3 missed heartbeats. What is the write rate, and the offline timeout?

### Files

**E7** ● 1,200 uploads per minute of 8 MB arrive over 16 Mbit/s uplinks through the app. How many workers are busy on uploads?

**E8** ● How many 64 MiB parts does a 12 GiB upload need? What is the smallest part size that allows a 5 TiB object within 10,000 parts?

**E9** ● How much memory do 40 concurrent buffered 200 MB uploads need?

### Search

**E10** ● List the trigrams pg_trgm extracts from "paneer", which pads with two spaces in front and one behind.

**E11** ● Compute BM25's IDF for a term in 50 of 100,000 documents.

**E12** ● Compute BM25's term part for tf = 3 in a document twice the average length, with k1 = 1.2 and b = 0.75.

**E13** ● A query hits 20 shards that each exceed their p99 1% of the time independently. What fraction of queries meets at least one slow shard?

**E14** ● How much memory do 2,000,000 vectors of 1,024 float32 dimensions need, and with 8-bit quantization?

**E15** ● With RRF and k = 60, compare a document ranked 2nd by BM25 and 5th by vectors with one ranked 1st by vectors only.

**E16** ● A client requests page 500 with 20 results per page from an index with 10 shards. How many results do the shards send to the coordinator?

### Traces and explanations

**E17** ●● Choose a transport for: order tracking, a chat between customer and courier, a dashboard of today's sales refreshed every minute, and multiplayer cooking game positions.

**E18** ●● Trace an SSE client dropping after event 41 and resuming.

**E19** ●● Trace a cross-site WebSocket hijacking attempt and two defences.

**E20** ●● Choose slow-consumer policies for order status, chat messages, typing indicators and courier location.

**E21** ●● Describe the fan-out for `order:124`, `restaurant:9` and a broadcast to 200,000 users across 10 servers.

**E22** ●● Explain how a polyglot file and a decompression bomb evade naive checks, and the defences.

**E23** ●● A filename arrives as `%2e%2e%2f%2e%2e%2fconfig`. Why does checking for ".." fail, and what is the robust fix?

**E24** ●● Search for "Biryanis" returns nothing although "biryani" items exist. Give two likely causes.

**E25** ●● Trace a phrase query "masala dosa" against "masala dosa with chutney" and "dosa batter and masala".

**E26** ●● List the steps to change the menu index's analyzer with zero downtime.

### Design and proofs

**E27** ●●● Design a WebSocket chat backend for a million concurrent users, with delivery guarantees.

**E28** ●●● Design a photo upload service from the app's button to the CDN.

**E29** ●●● Design hybrid menu search with filters, fusion, reranking and evaluation.

**E30** ●●● Show that BM25's term frequency component increases with tf and never exceeds k1 + 1.

@chapter solutions | Worked solutions | All numbers computed from the stated inputs.

**E1.** 80,000 ÷ 4 = 20,000 requests per second. Each order is polled 1,800 ÷ 4 = 450 times with 6 changes, so 6 ÷ 450 ≈ 1.3% carry news.

**E2.** Each client makes one request per 25 s, 80,000 ÷ 25 = 3,200 requests per second, and 80,000 connections are held open.

**E3.** 200 bytes exceeds 125, so the length uses the 126 marker plus 2 extra bytes. The server's header is 2 + 2 = 4 bytes, and the client's is 4 + 4 bytes of mask key = 8 bytes.

**E4.** 500,000 × 30 KB = 15 GB, across 5 servers of 100,000 connections, 3 GB each before headroom.

**E5.** 120,000 ÷ 60 = 2,000 reconnects per second on average.

**E6.** 8,000 ÷ 15 ≈ 533 writes per second, and the timeout is 3 × 15 = 45 s.

**E7.** Each upload takes 8 × 8 ÷ 16 = 4 s, and uploads arrive at 20 per second, so 20 × 4 = 80 workers are busy.

**E8.** 12 × 1,024 ÷ 64 = 192 parts. For 5 TiB in 10,000 parts, each must be at least 5 × 1,024 × 1,024 ÷ 10,000 ≈ 524.3 MiB.

**E9.** 40 × 200 MB = 8 GB.

**E10.** From "  paneer ": "  p", " pa", "pan", "ane", "nee", "eer", "er ", 7 trigrams, of which 4 lie wholly inside the word.

**E11.** ln(1 + (100,000 − 50 + 0.5) ÷ 50.5) = ln(1 + 1,979.2) ≈ 7.59.

**E12.** The length factor is 1 − 0.75 + 0.75 × 2 = 1.75, so K = 1.2 × 1.75 = 2.1, and the term part is 3 × 2.2 ÷ (3 + 2.1) ≈ 1.29.

**E13.** 1 − 0.99²⁰ ≈ 1 − 0.818 = 18.2%.

**E14.** 2,000,000 × 1,024 × 4 ≈ 8.19 GB, and at one byte per dimension about 2.05 GB, plus the graph's links.

**E15.** 1 ÷ 62 + 1 ÷ 65 ≈ 0.0315 against 1 ÷ 61 ≈ 0.0164, so the document found by both ranks higher.

**E16.** Page 500 needs results 9,981 to 10,000, so each shard returns its top 10,000 and the coordinator receives 10 × 10,000 = 100,000, to keep 20. Use search_after instead.

**E17.** Order tracking: SSE, one-way with built-in resumption. Chat: WebSockets, two-way with acknowledgements and durable storage. Sales dashboard every minute: polling. Game positions: WebSockets, or WebTransport datagrams where available, since fresh data matters more than complete data.

**E18.** The client has seen event 41 when the connection drops. EventSource waits the retry interval and reconnects, possibly to another server, sending Last-Event-ID: 41. The server looks up the replay buffer or durable log for that stream, sends events 42 onward, and continues live. If 41 is older than the buffer holds, it sends a reset event telling the client to reload state.

**E19.** A user logged into Wren visits evil.example, whose script opens `wss://rt.wren.example/ws`. The browser attaches Wren's cookies to the handshake, and if the server authenticates by cookie alone, the script can read the user's realtime data and send messages as them. Defences: check the Origin header on the handshake against an allowlist and refuse others, and authenticate with a ticket obtained by an authenticated API call, which the attacker's page cannot obtain.

**E20.** Order status: coalesce to the latest version per order. Chat messages: never drop, keep them in durable storage, disconnect the slow client and let it fetch missed messages on reconnect. Typing indicators: drop freely. Courier location: coalesce to the latest position.

**E21.** `order:124` has one subscriber, so only the server holding it subscribes and receives one message to forward. `restaurant:9` has a few screens, perhaps on two servers, each receiving one copy. The 200,000-user broadcast goes from the broker as one message to each of the 10 servers, which then write it to their 20,000 local connections each, batched and spread over a second or two.

**E22.** A polyglot is valid as two formats, such as an image that is also HTML or JavaScript, so magic bytes pass while a browser could interpret it as script if served wrongly. A decompression bomb is a small file that decodes to an enormous image, exhausting memory. Defences: decode and re-encode images, which keeps only pixels, with limits on dimensions and decoded size in an isolated worker, serve with the correct type and nosniff from a separate domain, and scan non-image files.

**E23.** The string contains no literal "..", only percent-encoded dots and slashes, which become `../../config` after decoding, and doubled encodings or backslashes defeat further naive checks. Never use the filename for a path. Generate storage keys, and where paths are unavoidable, decode once, resolve the full path, and check that it lies inside the base directory before use.

**E24.** The query is not analyzed the same way as the documents, for example the field was indexed with stemming but the query bypasses the analyzer, or vice versa, so "biryanis" never becomes "biryani". Or the field is a keyword type, matched exactly and case-sensitively, rather than an analyzed text field.

**E25.** In "masala dosa with chutney", masala is at position 1 and dosa at 2, adjacent and in order, so it matches. In "dosa batter and masala", dosa is at 1 and masala at 4, wrong order and not adjacent, so it fails the phrase query, although it matches a plain query for both words.

**E26.** Create `menu_v8` with the new analyzer and mapping. Start dual-writing every change from the indexer to both `menu_v7` and `menu_v8`. Backfill `menu_v8` from PostgreSQL in batches with refresh disabled, then re-enable refresh. Compare counts and run judged queries against both. Swap the `menu` alias to `menu_v8` atomically. Keep `menu_v7` updated for a few days for rollback, then stop dual writes and delete it.

**E27.** Clients authenticate with tickets and hold WebSockets to a realtime gateway tier, about 100,000 connections per server, 10 to 20 servers with headroom. Each message is sent by the client with a client-generated id, written by a chat service to a durable store partitioned by conversation, which assigns a sequence number per conversation, and acknowledged to the sender only after the write. The chat service publishes to a broker channel per conversation, gateway servers subscribe for their connected participants and deliver, and recipients' clients acknowledge their last sequence number. On reconnect, clients send their last sequence per conversation and fetch missed messages from the store. Typing and presence go through the broker without storage, with heartbeats for presence. Duplicate sends are deduplicated by client id. Backpressure caps send buffers, and reconnects use jittered backoff with gradual drains.

**E28.** The app requests an upload, and the API checks permission, creates a database row in state pending with a generated key under `quarantine/`, and returns a presigned PUT valid for 5 minutes with content type and a 10 MB limit. The app uploads directly, using multipart for large files. An ObjectCreated event goes to a queue. A worker checks size and magic bytes, decodes and re-encodes in a sandbox with dimension limits, strips metadata, scans if needed, writes variants under versioned keys to a public bucket, and updates the row to ready, or rejected with a reason. Lifecycle rules expire quarantine objects after a day and abort incomplete multipart uploads after 7 days. The CDN serves variants with immutable caching, and the app learns of readiness through a realtime event or polling.

**E29.** Index menu items with text fields analyzed per language, keyword and numeric fields for filters, a geo point, and a dense vector from an embedding model, with the model version recorded. Feed the index from CDC with versioned upserts. At query time, analyze the text, embed it, and run BM25 and HNSW retrieval in parallel with the same filters, open now, within 5 km, dietary flags. Fuse the top 100 of each with RRF at k = 60, rerank the top 50 with a cross-encoder, then apply boosts for distance, rating and personal history. Cache popular queries briefly. Evaluate with a set of judged queries using NDCG at 10 and zero-result rate before each change, and A/B test click-through and orders after.

**E30.** Let f(tf) = tf (k1 + 1) ÷ (tf + K), with K = k1 (1 − b + b |d| ÷ avgdl) > 0 and k1 > 0. Its derivative is (k1 + 1) K ÷ (tf + K)², which is positive, so f increases with tf. And f(tf) = (k1 + 1) × tf ÷ (tf + K) < k1 + 1 because tf ÷ (tf + K) < 1 for any finite tf, approaching k1 + 1 as tf grows without bound. So repetition always helps, by less and less, and never beyond k1 + 1.

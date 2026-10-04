@part VI | Designing Redis, Kafka and a database | We replace named boxes with their internal mechanisms. A label cannot explain a commit or restart. We will design a Redis-like server, Kafka-like broker, Dropbox-like sync engine, and database storage path. | where:6

## 21. Design Redis itself: protocol and execution

Replace the Redis box with a server that accepts a byte stream. **RESP** is Redis’s public serialization protocol for typed requests and replies. A parser must handle a command split across reads and several commands arriving in one read; TCP does not preserve application message boundaries.

Keep a bounded connection input buffer and parser state. Read the array and bulk-length framing, reject invalid or oversized input, then enqueue a complete command for the execution path. The executor checks command and key types, mutates its in-memory structures under its concurrency model, and writes a reply into a bounded output buffer. Long commands can delay unrelated clients, so budget command work and large results. [Redis’s protocol specification](https://redis.io/docs/latest/develop/reference/protocol-spec/) documents framing; the hypothetical implementation must also choose authentication, limits, and scheduling.

The shared cache model holds 100,000 values with 2,000 payload and 100 assumed overhead bytes per item, totaling 210,000,000 bytes. Treat that as an input to the implementation exercise: measure dictionary entries, allocator overhead, expiration structures, client buffers, and persistence-copy memory separately before claiming a real server memory limit.

For a concrete protocol frame, `*3\r\n$3\r\nSET\r\n$1\r\nk\r\n$1\r\nv\r\n` occupies 27 ASCII bytes. The array has three arguments whose payload lengths are three, one, and one: `SET`, `k`, and `v`. If a socket read stops after a bulk-length prefix, the parser waits for the remaining payload and terminator. If another frame follows in the same read, it retains the unconsumed bytes for the next parse.

### Expiry, eviction, and persistence are different mechanisms

A key expiry deadline controls when reads should treat the key as absent. The server can remove expired keys lazily on access and actively through bounded background work. Eviction instead chooses which still-valid keys to discard when the memory budget is full. Those choices affect the cache contract; neither is equivalent to a durable deletion in an authoritative store.

A Redis-like persistence path can record mutations in an append log or produce a snapshot. The acknowledgement must say whether the effect is only in memory, logged in an operating-system buffer, or persisted under the chosen policy. Restart loads the valid snapshot and later log according to that policy, recreating expiry and value state without claiming that an unflushed last write survived. Replication copies the chosen history but has its own lag and failover loss assumptions. [Redis’s persistence guide](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) describes the snapshot and append-log choices; this exercise must explicitly choose the required one.

Consider a client that declares a bulk payload length and then stalls before sending its terminator. The server retains parser state only within its connection input limit and deadline; it must not execute the partial command. Another read can contain the remaining bytes and the next complete frame, so the parser consumes only the bytes belonging to each command. After execution, a slow peer can retain replies and exhaust output memory unless the connection has a bound. Command validation, input framing, execution scheduling, and output backpressure therefore belong to the server design independently of value storage capacity.

@fig sd_practice_designs_21 | Illustrative design Redis itself: protocol and execution. Only a complete validated frame reaches execution, and replies remain bounded. Orange marks the bounded reply path and its slow-client policy.

Splitting commands on spaces breaks binary-safe values, and treating each socket read as one command breaks ordinary stream delivery.

:::story Picture this
A shop counter receives one customer's request, finds the item in a nearby drawer, changes the stock card, and answers before serving the next customer. A durable journal records the change before a crash can erase it. The counter's single order does not remove the need to define what survives a power cut.
:::

## 22. Design Kafka itself: segments and visibility

Replace the broker box with a storage process. A **log segment** is a file holding a consecutive range of records, typically paired with an index that helps locate an offset. Append order and readable committed order need separate state.

Validate a record batch, append to the active segment, advance the local log end, and make it available to follower fetches. Advance the safe read boundary only after the configured replication protocol permits it. A consumer fetch uses its requested offset and returns a bounded batch without deleting records. Segment rolling permits retention to reclaim whole old files, while compaction follows keys under a different policy. On restart, validate the last segment and recover the durable metadata rather than trusting the former process’s in-memory counters.

A follower can lag while the leader has already appended a new batch. Advancing the local end identifies stored bytes on that leader, while the safe visibility boundary follows the chosen replication protocol. Fetch must not expose a record outside the reader's permitted boundary merely because its file offset is available. On restart, validate incomplete trailing data and recover the relevant positions before answering consumers. Retention removes eligible old segments under its own policy and preserves an explicit earliest readable position. A checkpoint older than that position cannot silently continue as though no records were lost.

@fig sd_practice_designs_22 | Illustrative design Kafka itself: segments and visibility. The broker separates local append, replicated visibility, and bounded offset fetch. Orange marks bounded fetch by source position and permitted byte count.

Deleting old segments based only on one consumer’s acknowledgement would destroy replay for other consumers and violates retention-based log behavior.

:::note Log segments and visibility
Build the segment append path, offset lookup, replication progress, consumer fetch, and restart validation. Local append is not automatically the same as committed visibility or crash-safe persistence. State the acknowledgement contract.
:::

## 23. Design Dropbox itself: local scan to remote commit

A sync client must notice local changes, not merely upload a selected file. A **sync engine** compares local observed state with a remote versioned namespace and turns differences into safe transfers and commits.

Watch the filesystem but also rescan, because notifications can be lost. Avoid hashing a file that is still being written without a stable read or retry policy. Chunk and verify content, upload missing chunks, then conditionally commit a complete manifest against the base version. Consume remote changes with a persistent cursor and apply them atomically to local paths. A crash after downloading bytes but before renaming the final file leaves a recoverable temporary object, not a partially visible replacement. Garbage collection must prove that no reachable manifest still needs a block.

The client can crash after downloading temporary bytes but before replacing the visible file. Restart verifies or discards that temporary content according to the download identity, then applies the complete revision atomically at the path. Advance the remote cursor only under a rule that preserves unfinished local applications; otherwise restart can skip a change it never made visible. Rescan catches local changes missed by watchers, while conditional manifest publication prevents an old base from overwriting a newer remote revision. Garbage collection follows all reachable manifests, because a block unused by one device can remain necessary for another retained revision.

@fig sd_practice_designs_23 | Illustrative design Dropbox itself: local scan to remote commit. Sync verifies blocks before manifest publication and complete local replacement. Orange marks complete local replacement after temporary bytes are verified.

A watcher alone is not a complete change log, and an unversioned overwrite can erase another device’s concurrent edit.

:::warn Watch out
Trace discovery, stable read, chunk verification, conditional manifest commit, remote cursor, and atomic local apply. Keep namespace authority separate from reusable bytes. Garbage collection uses reachability, not only recent upload time.
:::

## 24. Design a database itself: pages, WAL, and recovery

A row update reaches memory, then the machine loses power. A **write-ahead log**, or WAL, records recovery information before the corresponding data pages are made durable. The recovery rule is about ordering persistence, not merely writing a text log.

Parse and plan the query, locate pages through an index, acquire the necessary transaction state, and create log records for the change. The commit acknowledgement follows the chosen log durability rule. Dirty data pages can be flushed later, while recovery replays the durable committed history according to the storage engine’s protocol. With an illustrative fan-out of 100 and a million entries, the idealized tree depth is the ceiling of logarithm base 100 of a million, or three. [PostgreSQL’s WAL introduction](https://www.postgresql.org/docs/current/wal-intro.html) explains its write-before-data principle.

Stop the database after log durability but before a dirty page reaches its data file. The acknowledged transaction survives because recovery can apply the committed log history to that older page state. A stop before the chosen log boundary cannot justify the same survival claim. Checkpoint records identify recovery progress while retained log covers changes still needed by data pages. Transaction concurrency must separately prevent invalid interleavings; a durable log does not automatically choose an allowed isolation level. Indexes also need their recovery changes included so a recovered row and its search structure cannot disagree about the accepted transaction.

@fig sd_practice_designs_24 | Illustrative design a database itself: pages, WAL, and recovery. Durable log commitment lets restart recover page state before service resumes. Orange marks restart rebuilding page state from the durable log.

A log entry in an application buffer is not durable. A checkpoint cannot replace the need for the log records still required to recover unflushed changes.

:::interview Interview lens
**"How do protocol execution and durability interact?"** Trace planning, page lookup, concurrency, log generation, commit durability, page flushing, and recovery. WAL persistence ordering protects crash recovery; transaction isolation and indexes solve different problems. Real tree height includes fill and layout details.
:::

:::key In one breath
Parse bounded requests, commit at a specified durability boundary, and recover from persistent state. Ordering, snapshotting, log replay, and version checks have separate jobs. Prove them through actual intermediate states.
:::

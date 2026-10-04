@part II | Producers and brokers | We follow one producer batch into storage. A successful local send does not establish a broker commit. We will trace routing, batching, segments, and offsets. | where:2

## 5. Bootstrap metadata and leader routing

The producer connects to one bootstrap address, but its target partition lives on another broker. **Metadata discovery** tells the client which brokers host partition leaders and what cluster topology applies.

Use bootstrap servers to obtain metadata, then send each partition batch to its current leader. If leadership changes, a stale request receives an appropriate error or refresh trigger, and the client updates its route before retrying under the producer contract. Several bootstrap addresses improve initial reachability; they are not a proxy through which all record bytes must pass. Network permissions must permit the advertised broker addresses. A bootstrap success does not prove every partition leader is reachable.


Trace the first attempt concretely. The client contacts a bootstrap broker and learns that the score partition belongs to broker A. It then opens the permitted connection to A and sends the partition batch directly. If A loses leadership, the client refreshes metadata and resends under the producer identity rather than treating the new address as a new event. An advertised private hostname that the client cannot resolve fails at this second connection even though bootstrap worked. A connection log that records only bootstrap success therefore misses the route that carries the actual records.

@fig sd_kafka_05 | The route begins with bootstrap discovery, resolves a partition leader, and sends produce traffic there; orange marks the refreshed target after metadata changes.

A load balancer in front of bootstrap cannot correct unreachable broker addresses advertised in metadata.

:::story Picture this
A railway station gives a traveller a current platform board at the entrance, but the traveller then walks to the platform named for the train. If the train moves to another platform, the traveller returns for a refreshed board and tries the new route. Reaching the station does not help if the platform address the board gives is behind a locked gate.
:::

## 6. Batching, compression, and delay

Sending one network request for every small score event spends framing and request work repeatedly. A **record batch** groups records for a partition so the producer and broker process larger contiguous work.

The producer buffers records by destination, builds batches under size and timing limits, optionally compresses the batch, and sends them when ready. Batching trades some waiting for fewer requests and often better compression. A larger batch can also consume more memory and make a failed request repeat more work. Bound producer buffer space and total delivery time so an unavailable broker does not make the application queue unlimited records. Separate time waiting for a batch from network, broker, and acknowledgement time in diagnostics.


Use the four-record fixture as one partition batch. Records that will receive offsets 100 through 103 enter the producer buffer before any of them has a broker offset. The size or timing rule closes the batch, compression operates on that batch if configured, and the client sends one bounded produce request. An acknowledgement then resolves the batch under the selected replication policy. If the send is uncertain, all four records can be retried as one unit. This trace explains both the saved request framing and the larger repeat unit without assuming a particular compression ratio.

@fig sd_kafka_06 | The rows show records entering a bounded partition buffer, forming a batch under size or delay rules, and then sending; orange marks the bounded request.

A producer buffer accepting a record does not mean the broker has accepted it. Application success must follow the required completion boundary.

:::note Batch latency and memory bounds
Batching amortizes request overhead and can improve compression, while adding waiting and buffer cost. Name size, timing, memory, and delivery bounds. Compression changes stored bytes but does not remove the logical record identities.
:::

## 7. Segment append and offset assignment

The leader receives a valid batch for one partition. A **log segment** is a file containing a consecutive range of records, with indexes that help find positions. The active segment receives new appends until rolling policy starts another.

Validate the batch, assign its offsets, append the encoded data, and advance the local end position. In the illustrative sequence, records receive offsets 100, 101, 102, and 103; the next local position is 104. Offset assignment preserves append order but is distinct from replication completion and transactional visibility. Segment indexes support locating an offset without scanning every earlier byte. On restart, the broker reconstructs valid local state and handles incomplete tail data according to its log recovery protocol.

A batch can reach the leader's segment while its acknowledgement remains unresolved. Offset assignment then establishes local append order but does not yet establish replicated visibility or what survives the named failure. A segment index points from a logical position toward encoded bytes; its presence is not a consumer completion record. During restart, validate the append tail before trusting the recovered end. Keep incomplete data from becoming an apparently valid record. This distinction matters because a process-level successful write can precede the durability boundary the application intended to promise.

@fig sd_kafka_07 | The append trace assigns offsets 100 through 103 and leaves 104 as the next position; orange marks the segment metadata used to validate restart state.

A process’s in-memory end offset cannot prove that the same tail survives a machine or disk failure.

:::warn Watch out
The leader appends a validated batch into segments and assigns partition offsets. The log end is the next append position. Local append, replica agreement, transactional visibility, and crash-safe persistence are separate states.
:::

## 8. Log start, end, and visible boundaries

A consumer asks for offset 103 while the local log end is 104. The record exists locally, but readers may not yet be allowed to see it. A **log end offset** is the next local append position; a **log start offset** is the earliest retained position.

The illustrative start is 100 and end is 104. A replication visibility boundary of 103 permits records below 103, namely 100, 101, and 102, but not 103. A transaction-stability boundary can further restrict committed readers. Treat these boundaries as exclusive next positions throughout the trace. An offset can exist without representing a currently visible user record, and cleanup can create gaps. The consumer’s committed position is another boundary owned by its group, not by the broker’s local append state.

Trace a request for the locally present record at 103. The leader's end of 104 says that append space follows it, while the replicated boundary of 103 excludes it from the illustrated ordinary read. A group restart position meanwhile says which records that application needs, not which records the broker may expose. If retention advances the start past that restart position, the consumer needs an explicit reset or rebuild. Write these separate boundaries next to the operation so a shared word such as offset cannot conceal an off-by-one or recovery-policy error.

@fig sd_kafka_08 | The rows distinguish retained start 100, end 104, and replicated boundary 103 exclusive; orange marks a consumer's independent committed restart position.

Off-by-one progress errors can skip the last unprocessed record or replay an unnecessary record. Write the next-position convention beside the trace.

:::interview Interview lens
**"Why can a record exist on a broker but remain invisible to a consumer?"** I would keep retained start, local end, replicated read boundary, transaction stability, and group progress distinct. I would state whether each number is an inclusive record offset or an exclusive next position. These boundaries answer different questions, so offsets are not interchangeable counters.
:::

:::key In one breath
The client discovers the partition leader, batches records, and sends a bounded request. The leader assigns offsets and appends to segments. Offset, local log end, replicated visibility, and consumer progress are different boundaries.
:::

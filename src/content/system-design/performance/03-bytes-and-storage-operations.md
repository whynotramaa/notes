@part III | IOPS, bandwidth and storage | We count the resources carrying each operation. Request rate alone cannot size a disk or a network link. We will connect operation size to IOPS, payload rate to bandwidth, and logical records to retained storage. | where:3

## 11. IOPS and operation size

A disk copies a long file efficiently but stalls when Heron requests unrelated pages. **IOPS** means input/output operations completed per second. **Bandwidth** means bytes transferred per second. They describe different limits, connected by how much data each operation transfers.

Assume an illustrative device completes 2,000 reads per second and each read transfers 4 KiB. A KiB is 1,024 bytes, so each read is 4,096 bytes. The transferred data rate is $2,000\times4,096=8,192,000$ bytes per second. This is 8.192 decimal MB per second, before any extra work outside those reads.

$$B=I\times b$$

Read this as: byte rate $B$ equals operation rate $I$ times bytes per operation $b$. The relationship only describes the counted operations. It does not predict a device's capacity without operation size, read/write mix, locality, queue depth, and durability behavior.

A database query is not one I/O by definition. Its pages may already be in memory, it may read several pages, or it may initiate additional work to maintain indexes and logs. Measure physical operations at the storage boundary. Translate application queries into that work before comparing the workload with a device limit.

@fig sd_performance_iops | Illustrative 2,000 operations/s at 4,096 bytes each produce 8,192,000 bytes/s.

## 12. Locality, caching, and durable writes

Heron's recent match events sit near each other, while unrelated profile lookups touch scattered pages. **Locality** means work reuses nearby or recently accessed data. Sequential access can combine requests into larger transfers; random access makes the system locate different regions more often.

An illustrative 64 KiB contiguous region contains 16 pages of 4 KiB. Reading it in one larger operation changes the operation count while transferring the same payload. It can also read bytes the caller never uses, so fewer operations do not always mean less total work. The access pattern determines whether that trade helps.

A **cache hit** means the requested data is already available in the measured cache. Suppose each query references four pages and 90% of those page references hit memory. At 1,000 queries per second, the expected physical read demand is $1,000\times4\times0.1=400$ pages per second. This simple model assumes the given hit ratio remains valid under the workload.

Durable writes add a different requirement. The caller may need acknowledgement after data reaches the chosen persistence boundary, rather than after it enters a volatile buffer. Grouping writes can reduce flush operations, but it introduces waiting and recovery rules. Keep read misses, log writes, data writes, and background compaction as separate demands.

@fig sd_performance_locality | Illustrative 64 KiB region contains 16 pages; the query model produces 400 physical page reads/s.

:::note Decimal and binary units
A decimal kB is 1,000 bytes; a KiB is 1,024. A decimal GB is 1,000,000,000 bytes; a GiB is 1,073,741,824. Write the intended unit explicitly so a storage budget does not change halfway through a calculation.
:::

## 13. Bandwidth and fan-out bytes

Heron's API responses are small, but a live event must reach many viewers. Bandwidth demand depends on payload size and recipient count as well as event production. Count bytes at the actual transfer boundary before comparing that demand with a link's capacity.

At 1,000 requests per second and 2,000 payload bytes per response, API payload is 2,000,000 bytes per second. Multiplying by eight gives 16,000,000 bits per second. These counts exclude request bodies, headers, TLS records, acknowledgements, retransmissions, and any inter-service copies of the response.

The live path produces 20 events per second for 50,000 viewers. That is 1,000,000 deliveries per second. Each carries an illustrative 200-byte payload, yielding 200,000,000 bytes per second, or 1,600,000,000 bits per second. Payload alone exceeds an illustrative 1,000,000,000-bit-per-second link by a factor of 1.6.

Sending each event to five gateways costs only $20\times5\times200=20,000$ payload bytes per second on that particular upstream path. The gateways then perform the large viewer fan-out. Draw both boundaries before sizing them. Moving the fan-out changes which machines pay the delivery cost; it does not eliminate those deliveries.

@fig sd_performance_bandwidth | Computed illustrative payload rates are 2 MB/s for API responses and 200 MB/s for live delivery.
@fig sd_performance_fanout_bytes | Illustrative gateway input is 20,000 bytes/s; viewer output is 200,000,000 bytes/s.

## 14. Retained storage and physical overhead

Suppose a separate illustrative write workload stores a 500-byte record for every daily request. A score read does not necessarily do this; we introduce the assumption to practice storage accounting. Daily logical data is $8,640,000\times500=4,320,000,000$ bytes.

With 30 days retained, one logical copy contains 129,600,000,000 bytes. With three replicas, the payload occupies 388,800,000,000 bytes, or 388.8 decimal GB. This is approximately 362.0982 GiB, rounded to four decimals. The unit conversion changes the reported number, not the actual bytes.

Now assume index data adds 20% of logical record bytes and uses the same replication factor. Records plus indexes occupy $129,600,000,000\times1.2\times3=466,560,000,000$ bytes. The index ratio is illustrative. Real indexes depend on keys, pointers, page layout, compression, and update behavior.

Add logs, backups, temporary rebuild space, compaction overlap, page slack, and deletion delay using explicit measurements or assumptions. A retention policy states when data becomes eligible for removal; it may not reclaim physical bytes immediately. Recovery also needs free space. A disk filled to the exact retained-data total cannot safely perform every maintenance operation.

@fig sd_performance_storage | Computed illustrative retained payload is 129.6 GB logical and 388.8 GB with three copies.
@fig sd_performance_storage_overhead | With illustrative index overhead of 20%, replicated records plus indexes total 466.56 GB.

## 15. Cache size and the working set

A cache containing Heron's latest scores does not need every historical database record. The **working set** is the data actively needed during the workload's relevant interval. A cache budget begins with which keys are useful, how many exist, and how long they remain useful.

Assume 100,000 entries, each with a 2,000-byte payload and 100 bytes of combined key and bookkeeping overhead. Payload alone is 200,000,000 bytes. The entries together occupy 210,000,000 bytes. An additional identical replica doubles that counted storage to 420,000,000 bytes before allocator slack and process overhead.

A server also stores connection buffers, executable code, temporary objects, and housekeeping structures. Cache entry bytes are not the whole process footprint. Use measured resident memory under a representative key distribution, including deletion and replacement activity. Large values or unusually long keys can invalidate an average-entry assumption.

Eviction bounds memory but changes hit rate. If the hottest keys stay resident, a modest cache can remove much database work. If a burst cycles through previously unseen keys, the same memory budget yields many misses. Measure distinct keys, value-size distribution, and miss traffic together instead of treating cache capacity as a hit-rate guarantee.

@fig sd_performance_cache | Illustrative entry budget adds payload and overhead before counting copies.

:::story Picture this
A desk holds the files you are using, while the archive holds every retained file. Desk capacity depends on the current work, not the archive's total size. Extra copies on the desk consume space even when the original file already exists elsewhere.
:::

:::warn Watch out
A physical operation, a database row, and an application request are different units. A cache miss can trigger several page reads, and one response can be delivered to many recipients. Count at the boundary whose capacity you intend to size.
:::

:::interview Interview lens
**"How much bandwidth and storage does this service need?"** I separate API payload, internal traffic, and viewer delivery, then convert bytes to bits when comparing links. For storage I state record size, write volume, retention, indexes, replicas, and maintenance space. The computed totals are workload hypotheses, so I name the measurements that could disprove them.
:::

:::key In one breath
IOPS counts operations and bandwidth counts transferred bytes; operation size connects them. Locality and cache misses determine how requests become physical work. Fan-out multiplies delivery bytes even when event production is small. Storage and cache budgets need logical payload, overhead, copies, and the maintenance or working-set behavior relevant to their roles.
:::

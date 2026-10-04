@part IV | Wide-column: Cassandra, Bigtable | We lay out large histories in an order that makes chosen ranges cheap. A table-shaped interface can conceal very different placement and scanning rules. We will separate sorted row ranges from clustered partitions, then bound growth and read fan-out. | where:4

## 16. Bigtable-style ordered rows

A viewer asks for nearby events rather than every event ever recorded. A **wide-column store** organizes sparse values under row and column keys with explicit ordering and storage policies. The name covers related models, so inspect the concrete row, partition, and query rules instead of assuming every product behaves identically.

Bigtable's original model is a sorted mapping indexed by row key, column key, and timestamp. A **column family** groups related columns under shared organization and policies. A row can contain some columns and omit others, so the model need not allocate every possible cell like a dense spreadsheet.

For Heron, a row key can include match and ordered event identifier. Neighboring events then sit in a useful key range. A query specifies the start and end keys and selected columns. The timestamp dimension can preserve cell versions, but an application still needs a policy defining which version is useful.

The row-key order is a design choice with consequences. A layout favoring one match's history may not make a global scorer query local. That query needs another maintained view or a declared scan. [Chang and colleagues' Bigtable paper](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/) defines the original mapping and describes its distributed implementation.

@fig sd_nosql_wide | Illustrative sparse rows show row order and selected column families; they are not a physical partition map.

## 17. Lexicographic locality and write concentration

Every new event uses a larger timestamp, so new writes all target the latest ordered region. **Range partitioning** assigns neighboring keys to the same region or owner. It favors scans through neighboring keys but can concentrate sequential new writes at one end of the key space.

A match prefix keeps one match's history local, but a hot match can still dominate that region. A hash prefix spreads keys at the cost of global order. The reader must query several prefixes and merge their ordered results. The write fix therefore creates a read-planning obligation.

Consider four illustrative write prefixes serving 10,000 operations per second equally. Each gets 2,500 operations per second. A whole-match ordered query may now touch four streams. Taking only 20 final results does not remove those stream reads; the coordinator needs enough candidates to know which results come first.

Choose spreading only after identifying the concentrated owner and proving the merge is acceptable. A time bucket bounds historical growth but does not necessarily spread concurrent writes in the current bucket. A hash prefix spreads current writes but does not bound retention. These are different tools, and a design may need one or both.

@fig sd_nosql_prefixes | Illustrative four-prefix distribution reduces equal write load per prefix but adds ordered-read merging.

## 18. Cassandra-style partition and clustering keys

Heron wants the newest events for one match without scanning other matches. A Cassandra-style table uses a partition key to identify the distributed record group and **clustering columns** to order rows inside that group. The selected keys determine the cheap query shape.

For a bounded history table, use match and time bucket as the partition key, then sequence as the clustering key. The partition owner can seek within that sequence range. A query for all events by scorer has different locality, so it may need its own table keyed by scorer rather than relying on the match-history layout.

[Apache Cassandra's data-modeling documentation](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/intro.html) describes query-driven tables and partition/clustering roles. Its table interface does not imply relational joins or foreign-key enforcement. Heron must state who verifies that a scorer and match exist when writing an event.

A query-specific copy can be reasonable when reads are stable and narrowly known. Keep each table's source event identifier and version so missed writes can be replayed. If the application writes several tables independently, a crash between them can leave inconsistent views. The read model needs propagation and repair, not just convenient primary keys.

@fig sd_nosql_clustering | Illustrative match-and-bucket partition contains events ordered by sequence; another query needs another route.

## 19. Bucketing a growing history

One match keeps producing events until its partition grows far beyond the working set. A **bucket** limits a record group by a known interval or size boundary. Bucketing prevents one history owner from growing forever, but it changes which groups a range query must inspect.

Heron's illustrative history produces 20 events per second. An hour contains 72,000 rows and 14,400,000 payload bytes. A 15-minute bucket contains $20\times15\times60=18,000$ rows and 3,600,000 payload bytes. Four such buckets cover the hour. These counts exclude keys, storage structures, and replicas.

A recent 15-minute query can cross a bucket boundary and touch two buckets even when its duration equals one bucket width. For example, an interval ending midway through the current bucket needs the tail of the previous one too. Choose the bucket identifiers from the time bounds, then merge by sequence or event time under a stated ordering rule.

Small buckets reduce each group's growth but increase query fan-out and metadata work. Large buckets preserve locality longer but can concentrate more writes or produce expensive maintenance. Measure the largest active group and the busiest owner, not just the mean bucket size. A bucket limits size; it does not guarantee evenly distributed traffic.

@fig sd_nosql_buckets | Computed illustrative 15-minute buckets each contain 18,000 events and 3.6 MB of payload.
@fig sd_nosql_bucket_boundary | Illustrative recent-history interval crosses two bucket owners despite having one bucket's duration.

## 20. Query tables, deletion, and repair

A scorer page and a match page use different query tables for the same event. **Write amplification** is extra write work created by indexes, replicas, or additional representations of one logical change. Query-specific tables exchange that maintenance work for predictable read paths.

At 20 source events per second, three maintained logical representations require 60 record writes per second if every event enters every representation once. Three replicas per representation imply 180 counted copy writes per second in this simplified exercise. This excludes logs, index structures, batching, and retry work.

Deletion must reach every representation whose contract requires removal. A background repair can compare source identifiers and versions, replay a source range, or rebuild the table from a checkpoint. A delete marker protects against delayed old updates while those copies are catching up. The exact cleanup boundary depends on the replay and repair guarantees.

Keep a registry of each view's key layout, owner, source boundary, progress, and retention policy. If nobody can reconstruct a query table after loss, it has become another undocumented authority. That makes changes dangerous because the system no longer knows which copy is allowed to correct the others.

@fig sd_nosql_query_tables | Illustrative 20 events/s across three views and three copies gives 180 counted copy writes/s.

:::story Picture this
A library can arrange books by author or by topic. Two directories make both searches easy, but each new book and removal must update both directories. Shelving convenience does not eliminate directory maintenance.
:::

:::note Similar names hide different mechanics
Bigtable's sorted row ranges and Cassandra's partition-and-clustering model should be drawn separately. Both reward planned queries, but their placement and scanning contracts are not interchangeable. Use the documented operation rather than a family name to defend locality.
:::

:::warn Watch out
Time bucketing bounds history size but does not spread every write inside the active bucket. A popular match can still overload its current owner. Hash spreading addresses another problem and forces additional read merging.
:::

:::interview Interview lens
**"Why choose this partition key?"** I show the exact query that uses it, the ordering inside the group, and the largest group's growth calculation. Then I identify the hottest owner and how a bucket boundary changes reads. Any extra query table has a source, an update route, and a rebuild policy.
:::

:::key In one breath
Wide-column models make chosen ordered ranges efficient, but row and partition rules depend on the system. Key order determines locality and possible write concentration. Buckets bound growth while prefixes spread work and increase read merging. Query-specific tables add explicit write, deletion, and repair obligations that must be counted alongside their read benefit.
:::

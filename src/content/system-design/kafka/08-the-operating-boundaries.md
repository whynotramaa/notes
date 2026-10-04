@part VIII | Operating Kafka: KRaft and lag | We expose what the Kafka box consumes and depends on. A healthy broker can still have lagging replicas or consumers. We will inspect metadata agreement, resource costs, backpressure, and safety controls. | where:8

## 29. KRaft metadata and data replication

A partition leader change must be agreed and published, while record bytes still flow through partition replication. **KRaft** is Kafka’s consensus-based metadata control architecture. It manages cluster metadata, not a claim that every data partition uses an identical Raft record commit path.

Controllers maintain the metadata agreement and brokers follow its decisions. Producers and consumers learn topology through broker metadata responses. Partition data has its own append, follower, ISR, visibility, and leader protocol. A controller-quorum failure and a data-replica failure therefore affect different operations and must be tested separately. Kafka 4.1 uses KRaft, and its [KRaft operations guide](https://kafka.apache.org/41/operations/kraft/) documents controller roles and quorum management. Do not copy an older ZooKeeper architecture into a version-labelled design without explaining the historical distinction.


A metadata decision identifies the current partition leader, while the partition replicas establish which record tail is available under the data protocol. Losing the controller connection does not instantly erase a broker's existing segment files, and having those files does not authorize that broker to appoint itself leader. On recovery, the client consumes the accepted metadata route and the selected leader serves the permitted log boundary. An operator must inspect both histories when diagnosing an unavailable partition. Treating the controller quorum as another copy of every score record would miscount storage and misstate the failure boundary.

@fig sd_kafka_29 | The rows separate KRaft controller consensus for metadata from partition replication for record bytes; orange marks client metadata refresh toward a broker.

Calling all Kafka replication Raft confuses the metadata quorum with the partition data path and obscures their distinct failure behavior.

:::story Picture this
A harbour office keeps the official map of berths and records which ship may dock where. The dock crews then copy cargo manifests between ships and decide which cargo copy is ready to show customers. The office can change the berth map without copying every crate, and a cargo-copy failure is different from an office-map failure.
:::

## 30. Disk, network, and skew budgets

The retained payload arithmetic fits on disk, but replication or a hot partition limits throughput. A **resource budget** counts the work a path creates at each constrained resource.

Producer ingress, follower fetches, consumer egress, storage append, indexes, compression CPU, and page-cache behavior all consume different work. Three copies multiply retained bytes in the simple model, but network traffic depends on the chosen topology and readers. A hot key concentrates a partition, so balanced five-event-per-second means cannot prove its maximum demand. During broker replacement or replica catch-up, recovery shares bandwidth and disk with live work. Reserve and test recovery headroom instead of consuming all capacity in the normal benchmark.

A replacement follower copies retained data while live producers and consumers continue using the same disks and links. Its recovery rate can therefore be lower than an isolated transfer measurement. Inspect producer ingress, follower fetch, and consumer egress separately, including the hot partition that may dominate a broker. A total retained-payload budget says how much source data the fixture keeps, not how quickly these competing paths complete. Compression can reduce byte work while adding CPU, with the actual trade-off depending on payload and implementation. Budget recovery as concurrent work rather than idle-time cleanup.

@fig sd_kafka_30 | The budget rows follow producer ingress, follower replication, consumer egress, and recovery traffic; orange marks catch-up sharing the same resources.

Compression ratio from one payload cannot be applied to another without measurement. Recovery throughput can fall when live work uses the same resource.

:::note Resource and recovery budgets
Budget every traffic and storage path, including independent consumers and recovery. Measure skew and per-partition work. A retained-payload total is a storage starting point, not a sustainable throughput claim.
:::

## 31. Lag, backpressure, and poison records

The consumer’s lag grows while it repeatedly attempts one invalid event. **Consumer lag** measures a position or time difference between available source and consumer progress. It does not alone say why useful effects are missing.

Track fetched and committed positions, oldest unprocessed age, successful effects, retries, and poison-record state. Pause or slow ingestion into application queues when the effect authority is saturated. Quarantine an invalid record only with a visible recovery policy that preserves its business requirement; skipping it can make a projection incomplete. A group member can fetch quickly and commit slowly because its database is the bottleneck. Growing producer buffers are another upstream waiting state, not extra Kafka capacity.


Quarantining a record is a durable outcome, not just a catch block. At offset 102, retain the original payload and source identity in the quarantine system under a recoverable publication contract. Only after that transfer is safely represented may the consumer mark 102 handled according to its stated policy and advance through completed 103 to 104. If quarantine publication is uncertain, replay must tolerate another quarantine attempt rather than advancing and losing the record. For ordered match effects, moving the record aside may also violate the business sequence, so the affected key needs an explicit parked or repair state.

@fig sd_kafka_31 | The lag trace shows source position growing while a poison record stalls effects; orange marks bounded pause or quarantine that exposes the gap.

A dashboard showing fetch throughput can look healthy while every required effect is failing or stuck behind an earlier record.

:::warn Watch out
Use lag with effect rate, age, retries, and resource waits. Bound application queues and apply backpressure at the appropriate boundary. A poison-record policy must state the lost or pending business consequence.
:::

## 32. Permissions, quotas, and safe operations

A buggy service writes into the wrong topic and fills broker storage. **Topic authorization** controls which identities may produce, consume, or administer a topic. **Quotas** bound resource use by the configured client or principal scope.

Separate transport encryption, identity, and permission. Give a projector read access to its inputs and only necessary write access to its outputs. Protect administrative operations such as retention changes or partition creation. Quotas and bounded requests contain noisy clients, while schema and payload limits protect consumer work. Operational changes need a compatible version and rolling plan, plus checks for ISR, lag, and resource recovery. Diagnostic IDs should help investigation without carrying credentials into the event payload.

A consumer credential should establish the allowed topic operations before its client begins fetching. Valid authentication does not authorize writing another application's input or changing retention. Quotas then constrain resource use within the permitted operations, while request and payload bounds limit work that a single accepted request can create. A blocked producer needs a finite buffer and delivery policy rather than retaining endless local records. Protect administration separately because a permitted retention change can remove another consumer's recovery source. Security and capacity rules interact through those paths but remain different checks.

@fig sd_kafka_32 | The rows limit an authenticated client's topic actions with ACLs and quotas; orange marks noisy-client containment rather than broad permission.

An authenticated producer with overly broad topic permissions can still corrupt another application’s input history.

:::interview Interview lens
**"How would you keep one Kafka client from harming the rest of the cluster?"** I would secure identity and topic actions separately, then bound noisy clients through quotas and request limits. I would protect administration and test changes against replication and consumer recovery. Kafka’s availability does not make every tenant entitled to all its capacity. I would watch the effect on ISR, lag, and resource recovery after the limit changes.
:::

:::key In one breath
Separate metadata consensus from partition data replication. Measure bytes, skew, ISR changes, produce errors, consumer lag, and successful effects. Bound client and broker work, and protect identities and topic permissions.
:::

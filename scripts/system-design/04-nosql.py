from author import publish
raw=r'''
@part The query comes first | We design records around the operations that must be cheap. A store cannot optimize every relationship at once. We will turn a user action into a key and a bounded access path.

## Access-pattern-driven schema design

A viewer asks for the latest score of one match, then its recent events. **Access-pattern-driven schema design** starts with those reads and writes, including their ordering and scope, before choosing stored shapes. Record the key, expected result count, update frequency, consistency need, and hottest possible owner for each operation.

A direct match lookup and a time-range event scan are different paths. An unbounded 'find all events matching any field' query needs a separate index or a scan. Heron keeps the authoritative score under a match key and orders event history by sequence within that match.

@draw access | rows | THE REQUEST DETERMINES THE LOOKUP KEY | [["latest score","match_id","one record"],["event history","match_id","sequence range"]] | Illustrative access patterns. | bound the amount of work per request

## Denormalization

The page needs a scorer name beside each event. **Denormalization** copies related facts into a read-friendly record rather than joining them at read time. Reads get cheaper, but changing the original fact now requires a propagation policy. A historical name snapshot and a current display name are different requirements.

Heron may store the scorer name observed when the event occurred. Renaming the user then does not rewrite history. If the product requires the current name everywhere, copied records need versioned updates or a read-time lookup. A duplicate field is a consistency obligation, not merely a storage choice.

@draw copies | fan | ONE FACT CAN HAVE SEVERAL DERIVED COPIES | {"source":"user name","targets":["current profile","historical event label","search document"]} | Illustrative copies with different freshness contracts. | first decide whether history should change

:::story Picture this
A delivery slip carries the address used for that delivery. A contact book carries the person's current address. They can disagree without either being wrong because they answer different questions.
:::

:::key In one breath
Start with bounded access patterns. Keys and record shapes make selected operations cheap. Denormalization shifts work into update and propagation paths. Define whether each copy represents current truth or a historical snapshot.
:::

@part Key-value records | We address a record directly. The simple interface helps when the caller already knows the key. We will distinguish an in-memory cache from a durable distributed key-value design.

## Redis-style key-value access

Heron reads `score:m7` without searching other matches. A **key-value store** maps a key to a value through direct operations. Redis also exposes data structures and atomic operations; treating it as a generic byte dictionary misses those mechanisms. Its persistence and replication settings determine which failures can lose acknowledged data.

An in-memory cache can discard data because another source rebuilds it. An authoritative state store cannot use that recovery promise. The same key-value interface can sit in either role, so say which copy owns truth and what happens when memory, the process, or a replica disappears.

@draw kv | flow | A KNOWN KEY HAS A DIRECT ACCESS PATH | ["score:m7","key lookup","score value","version check"] | Illustrative key-value lookup. | interface does not specify durability

## DynamoDB-style partitioned access

A distributed key-value or key-and-sort-key table routes a record using a **partition key**, then may order records within that key using a sort key. Heron can put a match's events under its identifier and order by sequence. This favors one-match queries but puts one popular match's demand together.

DynamoDB's API, indexes, and read consistency options are product-specific. **Dynamo** was an earlier Amazon design with a different contract; the names are not interchangeable. Partition-key choice must consider request skew, item size, and query scope, rather than assuming that a managed service removes hot ownership.

@draw partition | tree | ONE PARTITION KEY ORGANIZES A RANGE | ["match = m7","sequence 1","sequence 2","sequence 3"] | Illustrative records, not a claimed physical partition map. | one popular match can dominate its owner

:::key In one breath
Key-value access is cheap when the key is already known. Durability belongs to the configured role and implementation. A partition-and-sort-key model groups bounded ranges. Managed distribution still needs a key that survives skew.
:::

@part Documents | We store related values together when they are usually read together. A flexible record still has a schema the application must respect. We will separate aggregate boundaries from indexes.

## Document aggregates

A viewer reads a clip with its title, thumbnail references, and encoding variants. A **document store** keeps related named fields and nested values as one record. An **aggregate** is the unit the application reads or updates together. Embedding variants makes a clip lookup local, but embedding every comment can make the document grow without a bound.

MongoDB-style documents support indexed queries, but the product's size limits and transaction rules still matter. Choose embedding when ownership and lifecycle align; use references when a collection grows independently or many documents share one changing fact. Flexibility means evolution needs explicit validation and compatibility.

@draw document | tree | KEEP ONE OWNED AGGREGATE TOGETHER | ["clip c9","title + owner","thumbnail key","encoding variants"] | Illustrative clip document; comments stay independently bounded. | a flexible schema is still a contract

## Secondary indexes

The caller knows an owner, not a clip key. A **secondary index** supplies an alternate lookup path from another field to matching record identifiers. Maintaining it adds writes and storage; a distributed index may also use different partitioning and freshness rules from the base table.

Heron can index clips by owner and creation time. A broad owner with many clips still needs pagination. A new index may require a backfill while writes continue, followed by a verified readiness boundary. Do not serve incomplete index results as complete truth without stating the migration policy.

@draw secondary | flow | AN ALTERNATE KEY STILL LEADS TO BASE RECORDS | ["owner + time","index entries","clip identifiers","clip records"] | Illustrative alternate access path. | index freshness has its own contract

:::warn Watch out
'No schema' usually means the database enforces fewer shape rules. The readers still expect fields, types, meanings, and compatible versions.
:::

:::key In one breath
Documents group a bounded owned aggregate. Embedding improves local reads but can create unbounded records or repeated facts. Secondary indexes add alternate query paths and maintenance costs. Schema evolution and index backfill need explicit compatibility boundaries.
:::

@part Wide-column records | We order large histories by a useful key. A spreadsheet analogy hides the storage and query constraints. We will inspect ordered row ranges and clustered event histories.

## Bigtable-style ordered rows

A time range should read neighboring keys rather than search all events. A **wide-column store** organizes sparse values under row and column keys, often with ordered row ranges and versions. Bigtable describes a sorted mapping indexed by row key, column key, and timestamp. Related column families have shared storage policies.

The row-key order decides scan locality. A timestamp-only leading key can send all new writes to the newest range. Prefixing or bucketing can spread writes, but then a time query must merge more ranges. Explain the ordering you give up when you choose distribution.

@draw wide | rows | A ROW KEY CAN GROUP AND ORDER HISTORY | [["row key","m7:001","m7:002","m8:001"],["family","score","score","score"]] | Illustrative sparse ordered records. | key order chooses locality

## Cassandra-style query tables

A Cassandra-style table uses a partition key and clustering columns to make selected within-partition reads efficient. It is common to maintain query-specific tables when different access patterns require different ordering. This is a model choice, not a permission to create unlimited copies without a repair path.

Heron may bucket a match's long history by a time period, limiting partition size. Recent-history queries then touch known buckets. Bucket width trades write concentration against the number of partitions read. Global sorting or arbitrary filters need another maintained path rather than a hidden full-cluster scan.

@draw buckets | tree | BOUND A GROWING HISTORY WITH BUCKETS | ["match history","older bucket","recent bucket","current bucket"] | Illustrative partition buckets; width is a workload decision. | distribution changes how reads merge

:::key In one breath
Wide-column designs make chosen ordered ranges efficient. Row-key and clustering order define locality. Write spreading can increase read fan-out. Bound partitions and document every query-specific copy's repair policy.
:::

@part Graph relationships | We ask questions about connected records. A relationship index matters when traversal dominates the workload. We will compare graph traversal with simple key lookup.

## Nodes, edges, and traversal

A viewer asks which followed scorers are connected to a match organizer. A **graph database** models entities as nodes and relationships as edges. A **traversal** walks selected relationships, avoiding repeated discovery of neighbors through generic joins when the storage and query model support adjacency well.

Neo4j-style graphs fit relationship-heavy queries, but a high-degree node can still expand huge candidate sets. Heron should bound traversal depth, edge kinds, visited nodes, and result count. A graph is not a shortcut for returning a million neighbors within a tiny deadline.

@draw graph | fan | RELATIONSHIPS EXPAND THE CANDIDATE SET | {"source":"viewer","targets":["follows scorer","belongs to group","supports organizer"]} | Illustrative typed relationships. | bound the expansion, not just the final page

## SQL versus NoSQL

A relational design can scale, and a non-relational design can become overloaded. **NoSQL** is a broad family label, not one consistency or scalability guarantee. Choose using relationships, access patterns, invariants, operations, and team ability to repair failures. A payment ledger and a replaceable clip search document have different obligations.

| Need | Likely starting point | Cost to inspect |
|---|---|---|
| Related invariant updates | Relational transactions | Contention and joins |
| Known-key access | Key-value | Alternate query paths |
| Owned nested aggregate | Documents | Growth and copied facts |
| Ordered sparse history | Wide-column | Key skew and read fan-out |
| Relationship traversal | Graph | High-degree expansion |

@draw choice | split | THE DATA CONTRACT CHOOSES THE MODEL | [["authoritative ledger","cross-record invariants\ntransaction boundary"],["derived read view","access-specific layout\nrebuild and freshness"]] | Illustrative roles, not product rankings. | SQL versus NoSQL is more than scale

:::key In one breath
Graph stores make relationships explicit. Traversals still need bounded expansion. SQL and NoSQL labels do not determine capacity or correctness. Pick a model for the operations and invariants it must support.
:::

@part Copies and consistency | We count replicas without confusing them with agreement. A read can intersect a write and still lack a useful ordering contract. We will state what quorums establish and what they leave open.

## Eventual consistency and versioned copies

A clip title changes before the search view catches up. **Eventual consistency** promises convergence if updates stop and the system's recovery and delivery assumptions hold. It does not bound staleness by itself. State what happens to concurrent writes, deletes, delayed retries, and readers changing replicas.

A versioned update lets a derived view reject older messages instead of overwriting a newer title. Deletion needs a tombstone or comparable rule so delayed old records cannot resurrect the clip. Repair compares versions or replays the authoritative history; waiting without a repair mechanism is not a convergence plan.

@draw versions | rows | DELAYED UPDATES MUST NOT GO BACKWARDS | [["arrives","version 8","version 7"],["stored","accept 8","reject 7"]] | Illustrative version order. | deletions also need an ordering rule

## Quorum reads, writes, and replication factor

Heron keeps $N=3$ copies and waits for $W=2$ write acknowledgements. A read of $R=2$ overlaps any completed write set by at least $R+W-N=1$ replica when both use the same fixed membership.

$$R+W>N$$

Read this as: read count $R$ plus write count $W$ exceeds replica count $N$. Intersection alone does not guarantee linearizability. Concurrent versions, read reconciliation, incomplete writes, sloppy membership, and whether acknowledgement means persistence all matter. The distributed-systems unit turns those qualifications into explicit histories.

@draw quorum | matrix | FIXED READ AND WRITE SETS INTERSECT | {"rows":["write set","read set"],"cols":["A","B","C"],"values":[["yes","yes","no"],["no","yes","yes"]]} | Illustrative fixed membership; B is the overlap. | overlap is necessary information, not a full protocol

:::interview Interview lens
**"Why not use one database for everything?"** I would start with one when its contracts fit. I add another store only for a measured access pattern or a different data role, then explain propagation and recovery. Every extra copy introduces freshness and operational work.
:::

:::key In one breath
Replica count measures copies, not automatically consistency. Eventual convergence needs ordering and repair assumptions. Fixed read and write quorums can intersect, but a complete protocol must resolve versions and failure histories. Keep one authoritative owner for each fact and explain every derived view.
:::
'''
qa=[('Why begin with access patterns?','They determine keys, ordering, and bounded read work. A generic model choice cannot answer how a request finds its records.'),('What does denormalization cost?','Copied facts need a propagation or snapshot policy. Update work and repair replace some read-time joins.'),('Is Redis necessarily a cache?','No. Its role and configuration decide whether it is replaceable or authoritative.'),('Are Dynamo and DynamoDB interchangeable?','No. Dynamo is an earlier system design; DynamoDB is a managed product with its own API and consistency options.'),('When should a document embed data?','When the related values share bounded ownership and lifecycle. Independently growing collections or widely shared facts often need references.'),('What does a secondary index add?','Another maintained lookup path, with storage, writes, and possibly its own freshness contract.'),('Why can time-ordered writes be hot?','New records can all target the newest ordered range. Spreading prefixes trades that concentration for read merging.'),('Why make query-specific tables?','Different key orders make different bounded reads efficient. Each copy needs update and repair rules.'),('What limits graph traversal?','Degree, depth, candidate count, and filters. A small output page does not automatically mean a small traversal.'),('Is SQL versus NoSQL a scale decision?','Scale is one factor. Invariants, relationships, queries, consistency, and operations often decide more.'),('What does eventual consistency promise?','Convergence under the stated delivery and repair assumptions after writes stop. It does not provide a staleness bound alone.'),('What does quorum intersection prove?','At least one member overlaps fixed read and completed write sets. It does not by itself prove linearizability.')]
ex=[('●','Compute the overlap lower bound for the stated quorum.','R+W-N is 2+2-3=1 overlapping replica.'),('●','Compute replicated record storage.','129,600,000,000 logical bytes times 3 gives 388,800,000,000 bytes before overhead.'),('●●','Choose keys for match history and latest score.','Use a direct match key for latest state and a match-scoped ordered sequence for history. Bound history with buckets if it grows too large.'),('●●','Decide whether a historical scorer name changes after a rename.','First choose historical or current semantics. A snapshot stays fixed; a current-name requirement needs propagation or a read-time relationship.'),('●●','Trace a stale retry after deletion.','A delayed older update arrives after a deletion. A versioned tombstone rejects it; removing all deletion history too early can resurrect the record.'),('●●','Design an index backfill while writes continue.','Take a consistent starting boundary, backfill records, catch up changes, and verify completeness before routing reads to the new index.'),('●●●','Disprove the claim that quorum overlap alone gives linearizability.','Two concurrent writes can reach overlapping sets with conflicting versions; a read still needs a protocol to select and order them. Set intersection does not impose a single real-time history.'),('●●●','Compare one authoritative database with two read stores.','The authoritative transaction owns invariants. Each read store receives versioned updates, records progress, supports rebuild, and declares staleness. Count the added operations before accepting the extra stores.')]
publish(4,'nosql','Choosing a data model',['Keys, Documents,','and Relationships'],'Key-value, document, wide-column, and graph models through access patterns, copied facts, indexes, partition keys, and consistency.','Choose a store by the work and invariants it must support, then defend its read and repair paths.',raw,qa,ex,[('Dynamo paper','https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf','Replication and reconciliation in the original system.'),('DynamoDB partition keys','https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html','Access skew and key design.'),('MongoDB data modeling','https://www.mongodb.com/docs/manual/data-modeling/','Embedding and references.'),('Bigtable paper','https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/','The sorted sparse mapping.'),('Cassandra data modeling','https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/intro.html','Query-driven partition and clustering keys.'),('Neo4j graph concepts','https://neo4j.com/docs/getting-started/appendix/graphdb-concepts/','Nodes, relationships, and properties.')])

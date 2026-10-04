@part II | Key-value stores: Redis, DynamoDB | We address a record directly when the caller knows its key. The same interface can describe a disposable cache or authoritative state with very different recovery duties. We will follow lookup, conditional update, durability, and distributed key ownership. | where:2

## 6. Redis-style key-value access

A Heron worker needs the latest score for `m7`. It asks for `score:m7` directly instead of searching all matches. A **key-value store** maps an identifying key to a value. The caller usually supplies the exact key, so the interface favors direct access rather than arbitrary relationship queries.

The request travels to the owner, the owner locates the key, and the result returns. The stored value can encode a score and version. A missing key needs an explicit meaning: unknown match, expired cache entry, or incomplete rebuild. Returning "not found" for all of these can hide an infrastructure failure as a product fact.

Redis also offers structured values and operations, so a design can update a field or perform a supported atomic operation without replacing an opaque byte string. The specific command and its atomic scope matter. [Redis data types documentation](https://redis.io/docs/latest/develop/data-types/) describes those interfaces rather than promising one universal transaction boundary.

For Heron, keep authoritative events elsewhere when Redis is a rebuildable score cache. A cache miss then triggers a bounded source lookup or reconstruction, followed by cache population. If Redis instead owns the score, state the persistence, replication, and recovery contract. The familiar key syntax does not decide those obligations.

@fig sd_nosql_kv | Illustrative known-key lookup returns score and version; the storage role determines recovery behavior.

## 7. Lost updates and conditional writes

Two workers read score version 7 and compute different updates. Both replace the record, so the later replacement can erase the earlier one. A **lost update** occurs when a change overwrites another change because it was based on an older shared state.

A **conditional write** applies only if the stored record satisfies a condition. In this example, both workers request "write version 8 only if the current version is 7." The store must check and update atomically. One succeeds; the other sees a failed condition and rereads or rejects its stale operation.

The check cannot happen as a separate ordinary read followed by an unconditional write. Another actor could update the record between those steps. The storage operation must enforce the comparison inside the same atomic boundary. Returning a condition-failed result gives the application evidence that its expected state was no longer current.

This prevents an overwrite based on stale state, but it does not decide the business policy for conflicting scorers. Heron may require one authorized scorer per match, or it may serialize accepted commands through a sequencer. Conditional updates defend a record boundary; authorization and cross-record invariants need their own explicit rules.

@fig sd_nosql_conditional | Illustrative concurrent version-7 writers compete for one atomic version transition; one must retry or fail.

## 8. Cache eviction versus authoritative loss

A score key disappears because the cache needs memory. **Eviction** removes a cached entry under a space policy. It is safe only when the entry can be reconstructed within the service's recovery and load budget. The same disappearance is data loss if that entry was the only authoritative copy.

An expiry time can bound the useful lifetime of a derived score, but it does not prove the entry is current before expiry. A scorer update may arrive immediately after the cache fill. Define whether updates invalidate the key, replace it with a newer version, or let a short stale interval remain acceptable.

After a cache failure, every viewer may try the source at once. The key-value access that made reads cheap can conceal a much smaller source capacity. Bound miss concurrency, coalesce identical match refreshes, and protect scorer updates from the read flood. The caching unit examines those overload policies in more detail.

For an authoritative key-value service, deletion is an application operation with durability and ordering requirements. A stale retry must not recreate a deleted score accidentally. Keep tombstones or source versions as needed for the replay contract. Calling the operation an eviction does not excuse losing a fact the service promised to retain.

@fig sd_nosql_cache_role | Illustrative cache rebuild and authoritative recovery have different failure obligations.

## 9. Persistence and acknowledgement boundaries

A worker receives a successful write response, then the process restarts. Was the value saved? **Persistence** stores state so it can survive the specified loss of volatile memory. The acknowledgement boundary tells the caller which persistence work completed before success was returned.

A snapshot periodically saves a point-in-time state. An append-only log records operations for replay. Each needs a policy for writing and flushing data. A successful in-memory mutation is a different event from a durable log flush, and replication acknowledgement is a different event again.

Redis provides RDB snapshots and AOF persistence with configurable behavior. The safety and recovery tradeoffs depend on those choices, so an authoritative design must name them. [Redis persistence documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) is the source for the mechanisms; this guide assigns no universal loss window to every Redis deployment.

Heron's derived score cache can rebuild from authoritative events, so its failure can trade availability and load without losing history. An authoritative score store needs recovery tests that kill the process or host after acknowledgement and verify retained effects. Persistence is a claim about specified failures, not simply the presence of a file on disk.

@fig sd_nosql_persistence | Illustrative mutation, log append, flush, and acknowledgement are distinct states whose order must be specified.

## 10. DynamoDB-style partitioned access

Heron wants all events for one match in sequence order. A **partition key** identifies a record group used for routing and placement. A **sort key** orders records within a chosen group when the model supports it. The pair lets a caller locate a match and scan its bounded event range.

Distribution does not remove skew. If every viewer asks for `m7`, that logical owner receives concentrated demand even when many quiet matches exist. A larger number of keys helps only when traffic spreads over them. Cache hot reads or distribute derived read copies when the freshness contract permits it.

DynamoDB is a managed product; Dynamo was an earlier Amazon design. They are not interchangeable names for the same API. DynamoDB tables and local secondary indexes support specified strong-read options, while global secondary index reads are eventual. [DynamoDB read consistency documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html) defines the product boundaries.

An illustrative hot read rate of 10,000 requests per second divided evenly across four independently usable read owners gives 2,500 per owner. That division assumes routing distributes requests and each owner has a valid copy. It does not establish how writes converge or turn a single ordered write invariant into four independent writers.

@fig sd_nosql_partition | Illustrative partition-and-sort-key access groups one match's event range without claiming a physical node map.

:::story Picture this
A locker number makes retrieval direct because you already know the location. If you only know whose coat is inside, you need a separate directory. More lockers do not make everyone asking for the same locker less concentrated.
:::

:::note Product names are not protocols
Dynamo, DynamoDB, and Redis expose different operations and guarantees. State the specific read, write, condition, and failure behavior. A family resemblance does not let one product inherit another system's consistency claims.
:::

:::warn Watch out
A separate read-then-write sequence does not implement an atomic condition. Another writer can change the record between the steps. Use a supported conditional operation or a defined serialization protocol.
:::

:::interview Interview lens
**"Can Redis hold our authoritative score?"** I first separate the key-value interface from the recovery promise. If it is authoritative, I name persistence, acknowledgement, replication, and replay behavior under the required failures. If it is a cache, I show how to rebuild it while bounding the load on the source.
:::

:::key In one breath
Known-key access avoids discovery work but requires a declared missing-key meaning. Atomic conditional writes prevent stale replacements within their supported boundary. Cache eviction and authoritative loss need different recovery policies. Persistence, replication, and partition keys describe distinct parts of the contract, while hot ownership remains a workload problem in a managed service.
:::

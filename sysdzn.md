For **system design interviews**, I’d study it as a stack of layers rather than memorizing “Design YouTube / Uber / Twitter.” The goal is that when someone gives you an unfamiliar system, you know which questions to ask and which building blocks to reach for.

Given your backend direction and the kinds of projects you’re building, I’d use roughly this syllabus.

## 1. Foundations: how distributed systems actually behave

These need to be genuinely understood.

**Networking**
- HTTP/1.1, HTTP/2, HTTP/3 basics
- TCP vs UDP
- DNS resolution
- TLS / HTTPS
- WebSockets
- SSE
- gRPC
- REST
- Reverse proxies
- L4 vs L7 load balancing
- Connection pooling
- Keep-alive
- Timeouts, retries, exponential backoff + jitter
- Idempotency
- Long polling vs polling vs push

**Performance**
- Latency vs throughput
- p50 / p95 / p99 latency
- IOPS
- Bandwidth
- CPU-bound vs I/O-bound
- Network-bound workloads
- Horizontal vs vertical scaling
- Amdahl's law intuition
- Backpressure
- Queueing and bottlenecks

You should be comfortable doing rough calculations:

\[
QPS = \frac{\text{requests/day}}{86400}
\]

and estimating storage, bandwidth, cache size, peak QPS and concurrency.

---

# 2. Databases

This is probably the single biggest section.

### Relational databases

Know:

- tables / rows / indexes
- primary and foreign keys
- B-tree / B+ tree indexes
- composite indexes
- covering indexes
- clustered vs non-clustered indexes
- query execution
- joins
- transactions
- ACID
- isolation levels
- dirty/non-repeatable/phantom reads
- MVCC
- locks
- deadlocks
- WAL
- connection pools

Then scaling:

- read replicas
- leader/follower replication
- synchronous vs asynchronous replication
- replication lag
- partitioning
- sharding
- resharding
- hot partitions
- consistent hashing

### NoSQL

Understand the *reason* each model exists.

**Key-value**
Redis, DynamoDB style systems.

**Document**
MongoDB style.

**Wide-column**
Cassandra / Bigtable style.

**Graph**
Neo4j style.

Learn:

- access-pattern-driven schema design
- denormalization
- secondary indexes
- eventual consistency
- quorum reads/writes
- replication factor
- partition keys

And especially:

> SQL vs NoSQL is not a scalability question alone.

It's mostly about data model, consistency requirements, query patterns and operational tradeoffs.

---

# 3. Distributed systems fundamentals

This is where system design becomes much more interesting.

Study:

### CAP theorem

Understand what partition tolerance actually means.

Then:

- consistency vs availability
- strong consistency
- eventual consistency
- causal consistency
- read-your-writes
- monotonic reads

### Replication

- leader/follower
- multi-leader
- leaderless replication
- replication lag
- failover
- split brain
- quorum

Understand:

\[
R + W > N
\]

and what it does and **doesn't** guarantee.

### Distributed coordination

- leader election
- distributed locks
- leases
- heartbeats
- failure detection
- consensus intuition
- Raft basics
- ZooKeeper / etcd purpose

You don't need to implement Raft for most interviews, but you should understand why distributed consensus exists.

---

# 4. Caching

Don't stop at “put Redis in front of PostgreSQL.”

Study:

- local/in-process cache
- distributed cache
- CDN
- browser cache
- database buffer cache

Patterns:

- cache-aside
- read-through
- write-through
- write-behind

Problems:

- cache invalidation
- stale data
- TTL
- eviction
- LRU / LFU
- cache stampede
- cache penetration
- cache avalanche
- hot keys
- distributed cache consistency

Important interview question:

> What happens when Redis goes down?

Your design should normally degrade rather than collapse the database underneath it.

---

# 5. Load balancing and traffic routing

Study:

- reverse proxy
- API gateway
- L4/L7 load balancers
- round robin
- weighted routing
- least connections
- consistent hashing
- sticky sessions
- health checks
- failover
- service discovery

Then geographically:

```text
User
 ↓
DNS
 ↓
CDN / Edge
 ↓
Load Balancer
 ↓
Application Servers
```

Understand what each layer actually contributes.

---

# 6. Async systems and message queues

Very important.

Understand why:

```text
request → service → database
```

sometimes becomes:

```text
request → service → queue → workers → database
```

Study:

- message queues
- pub/sub
- event streams
- producers / consumers
- consumer groups
- partitions
- ordering
- offsets
- acknowledgements
- dead-letter queues
- retries
- poison messages
- backpressure

Kafka concepts deserve dedicated study:

- broker
- topic
- partition
- offset
- consumer group
- replication
- retention

Then semantics:

- at-most-once
- at-least-once
- exactly-once

Especially understand why **at-least-once + idempotent consumers** is extremely common.

---

# 7. APIs and service architecture

Study API design beyond REST syntax.

- resource modeling
- pagination
- cursor vs offset pagination
- filtering
- sorting
- versioning
- idempotency keys
- rate limits
- request validation
- authentication
- authorization
- API gateway

Then architecture:

```text
Monolith
   ↓
Modular monolith
   ↓
Microservices
```

Understand why microservices aren't automatically better.

For microservices:

- service boundaries
- service discovery
- inter-service communication
- synchronous vs asynchronous communication
- distributed transactions
- Saga pattern
- orchestration vs choreography

---

# 8. Reliability

This is frequently what separates an average design from a strong one.

Study:

- single points of failure
- redundancy
- graceful degradation
- fault tolerance
- retries
- exponential backoff
- jitter
- timeouts
- circuit breakers
- bulkheads
- health checks
- failover
- disaster recovery

Understand:

**RTO**

How long can the system remain unavailable?

**RPO**

How much data can we afford to lose?

Also:

- availability calculations
- 99.9 vs 99.99%
- active-active
- active-passive

---

# 9. Rate limiting

Know these properly:

- fixed window
- sliding window log
- sliding window counter
- token bucket
- leaky bucket

Then distributed rate limiting using Redis.

You should be able to design:

```text
100 requests/user/minute
```

and explain race conditions, atomic operations and what happens if the rate limiter becomes unavailable.

---

# 10. Storage systems

Understand the differences between:

- local disk
- block storage
- file storage
- object storage
- databases
- distributed file systems

Object storage concepts:

```text
bucket
object
key
metadata
```

Study:

- multipart uploads
- presigned URLs
- checksums
- replication
- lifecycle policies

Then the classic design:

```text
Client
  │
  ├── metadata → Application → DB
  │
  └── file ───────────────→ Object Storage
```

Instead of sending a 5 GB video through your application server.

---

# 11. CDN and content delivery

Know:

- edge locations
- origin
- cache hit/miss
- TTL
- invalidation
- pull vs push CDN
- signed URLs
- geographic routing

Very relevant when designing:

YouTube, Instagram, Netflix, image hosting, static assets.

---

# 12. Search

This will connect nicely with your doc-store/search-engine work.

Study:

- inverted indexes
- tokenization
- posting lists
- TF-IDF / BM25 intuition
- indexing pipeline
- Elasticsearch architecture
- shards
- replicas
- indexing vs querying
- autocomplete
- prefix search
- fuzzy search

Also understand why:

```sql
SELECT * FROM docs
WHERE body LIKE '%distributed systems%'
```

doesn't replace a search engine at scale.

---

# 13. Real-time systems

Very relevant to Howzat.

Study:

- WebSockets
- SSE
- polling
- long polling
- connection management
- heartbeat
- reconnect
- presence
- fan-out
- pub/sub

Example:

```text
Scorer
   ↓
Score Service
   ↓
Event Stream
   ↓
Realtime Gateway
   ↓
50,000 viewers
```

Think about what happens when one event needs to reach millions of connected clients.

---

# 14. Data pipelines

Know the distinction between:

```text
OLTP
```

and

```text
OLAP
```

Then:

- batch processing
- stream processing
- ETL / ELT
- data warehouse
- data lake
- CDC
- Kafka-style event streams
- materialized views

Basic understanding of Spark/Flink architecture is useful, even if you never use them directly.

---

# 15. Security

System design interviews don't normally require deep cryptography, but these matter:

- authentication vs authorization
- sessions
- JWT
- OAuth 2.0
- cookies
- API keys
- RBAC
- ACL
- encryption at rest
- encryption in transit
- TLS
- secrets management
- password hashing
- signed URLs
- CORS
- CSRF
- common abuse/rate-limit considerations

---

# 16. Observability

A production system isn't finished when it runs.

Know the three basic signals:

**Logs**

What happened?

**Metrics**

How much/how often?

**Traces**

Where did the request spend its time?

Then:

- structured logging
- correlation/request IDs
- distributed tracing
- dashboards
- alerts
- SLI / SLO / SLA

Useful metrics:

```text
request rate
error rate
latency
CPU
memory
queue depth
DB connections
cache hit ratio
```

---

# 17. Scaling patterns

Once the fundamentals are done, study recurring architectural patterns.

You should recognize:

- sharding
- replication
- CQRS
- event sourcing
- Saga
- transactional outbox
- CDC
- consistent hashing
- leader election
- distributed locks
- materialized views
- fan-out-on-write
- fan-out-on-read

Not because every design needs them, but because you should know when they solve a real problem.

---

# 18. The interview method itself

For every design problem, train yourself to move roughly through:

```text
Requirements
        ↓
Scale estimation
        ↓
API
        ↓
Data model
        ↓
High-level architecture
        ↓
Critical request flows
        ↓
Identify bottlenecks
        ↓
Scale individual components
        ↓
Failures / consistency
        ↓
Trade-offs
```

Start with functional requirements:

> Users can upload videos.

Then non-functional:

> uploads must survive failures  
> video playback should start quickly  
> 100M DAU  
> eventual consistency is acceptable for view counts

Those requirements determine architecture.

---

# Systems I would actually practice

After learning the pieces above, I'd practice designs that progressively force different concepts:

| System | Main concepts |
|---|---|
| URL shortener | DB, hashing, caching |
| Pastebin | storage, expiry |
| Rate limiter | Redis, distributed state |
| Notification system | queues, retries |
| Chat | WebSockets, ordering |
| WhatsApp | messaging + delivery guarantees |
| News feed | fan-out, ranking |
| Dropbox | object storage, sync |
| Google Drive | metadata + file storage |
| Search autocomplete | trie/index/cache |
| Ticket booking | concurrency, locking |
| Payment system | idempotency, transactions |
| Uber | geospatial indexing, realtime |
| YouTube | storage, CDN, transcoding |
| Instagram | feed + media architecture |
| Google Docs | realtime collaboration |
| Metrics/logging platform | ingestion pipeline |
| Distributed job scheduler | queues, leases |
| Kafka | logs, partitions, replication |
| Distributed cache | hashing, replication |

And eventually one particularly useful exercise:

> **Design Redis / Kafka / Dropbox / a database itself.**

Those force you beneath the usual “put Redis + Kafka here” interview answers.

### For your preparation, I'd split the syllabus mentally into four depths

**Must know cold:** networking, SQL/database internals, caching, queues, load balancing, replication, sharding, consistency, API design, concurrency, reliability.

**Deep interview knowledge:** Kafka, Redis architecture, distributed transactions, consensus, consistent hashing, realtime systems, object storage, CDN, search.

**Pattern recognition:** CQRS, Saga, CDC, outbox, event sourcing, leader election, distributed locks.

**Practice:** repeatedly design systems and defend every box you draw.

The important standard is not *“I know what Kafka is.”* It is being able to answer **why Kafka is here, why a normal queue wouldn't suffice, what happens when a consumer dies, what ordering exists, what gets duplicated, how you recover, and what bottleneck appears at 10× traffic.**

That's the depth I'd target for interviews.

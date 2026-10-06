For backend interviews, I’d treat this as a **backend-engineering curriculum**, not merely “Node/Express/Spring/Django topics.” You should be able to follow one request from DNS → TCP/TLS → proxy → application → auth → cache/database/queue → response, and then explain what happens when any part becomes slow, overloaded, compromised, or unavailable.

Given that we already separated **DBMS, CN, OS, and System Design** into their own deep tracks, I would avoid duplicating their theory here. Backend should focus on **using those concepts to build and operate production services**. 

# Backend Engineering — Complete Interview Syllabus

## 1. HTTP from a Backend Engineer's Perspective

### HTTP fundamentals
- Request/response lifecycle
- Request line
- Status line
- HTTP methods
  - GET
  - POST
  - PUT
  - PATCH
  - DELETE
  - HEAD
  - OPTIONS
  - CONNECT
- Safe methods
- Idempotent methods
- Idempotency vs retries
- HTTP headers
- Request body
- Response body
- Content-Type
- Accept
- Content-Length
- Content-Encoding
- Transfer-Encoding
- Host
- User-Agent
- Referer
- Origin
- Authorization
- Location
- Retry-After
- Cache-Control
- ETag
- Last-Modified
- Vary

### Status codes

Know the meaning and correct usage of:

**2xx**
- 200
- 201
- 202
- 204
- 206

**3xx**
- 301
- 302
- 303
- 304
- 307
- 308

**4xx**
- 400
- 401
- 403
- 404
- 405
- 409
- 410
- 412
- 413
- 415
- 422
- 429

**5xx**
- 500
- 502
- 503
- 504

Be able to answer things like:

> Why is authentication failure 401 while authorization failure is usually 403?

> Why might an API return 409 instead of 400?

> What's the difference between 502 and 504?

### HTTP versions

#### HTTP/1.0
- Short-lived connections

#### HTTP/1.1
- Keep-alive
- Persistent connections
- Pipelining
- Head-of-line problems

#### HTTP/2
- Binary framing
- Streams
- Multiplexing
- HPACK
- Stream prioritization
- HTTP/2 head-of-line behavior

#### HTTP/3
- QUIC
- UDP
- Stream independence
- Connection migration
- TLS 1.3 integration
- Why HTTP/3 reduces transport HOL blocking

---

# 2. HTTPS, TLS and Certificates

Know the complete:

```text
https://api.example.com
        ↓
DNS
        ↓
TCP / QUIC
        ↓
TLS handshake
        ↓
Certificate verification
        ↓
HTTP
```

Study:

- HTTP vs HTTPS
- TLS
- SSL history
- TLS 1.2 vs TLS 1.3
- ClientHello
- ServerHello
- Cipher suites
- Key exchange
- Symmetric encryption
- Asymmetric encryption
- ECDHE
- Forward secrecy
- Session resumption
- TLS tickets
- 0-RTT
- CA
- Root CA
- Intermediate CA
- Certificate chain
- Certificate validation
- SAN
- Certificate expiration
- OCSP
- OCSP stapling
- SNI
- ALPN
- HSTS
- Certificate pinning
- TLS termination

Interview question:

> Walk me through exactly what happens after entering `https://example.com`.

You should eventually be able to answer that for 10–15 minutes.

---

# 3. Browser ↔ Backend Security Boundary

This deserves considerably more attention than most backend courses give it.

## Same-Origin Policy

Understand what an **origin actually is**:

```text
scheme + hostname + port
```

Then:

- Same-origin policy
- Cross-origin reads
- Cross-origin writes
- Embedded resources
- Origin header
- Referer
- `Sec-Fetch-*` headers

## CORS

Study:

- Why CORS exists
- What CORS does **not** protect
- Simple requests
- Preflight requests
- OPTIONS
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Expose-Headers`
- `Access-Control-Max-Age`
- Wildcard origins
- Credentials + wildcard restrictions
- Dynamic origin reflection
- Origin allowlists
- `Vary: Origin`
- Preflight caching
- `null` origin

### CORS vulnerabilities

Understand the failure modes, not just configuration:

```text
Origin: https://attacker.com

Server:
Access-Control-Allow-Origin: https://attacker.com
Access-Control-Allow-Credentials: true
```

Study:

- Arbitrary origin reflection
- Weak regex validation
- Prefix/suffix validation bugs
- Trusting subdomains
- Compromised trusted origins
- `null` origin trust
- Origin parsing bugs
- Credentialed cross-origin requests
- Why CORS isn't authentication
- Why CORS isn't CSRF protection

---

# 4. Cookies, Sessions and Browser Authentication

### Cookies

- `Set-Cookie`
- Cookie header
- Domain
- Path
- Expires
- Max-Age
- Secure
- HttpOnly
- SameSite

SameSite:

- Strict
- Lax
- None

Understand:

- First-party cookies
- Third-party cookies
- Session cookies
- Persistent cookies
- Cookie scope
- Cookie prefixes
- `__Host-`
- `__Secure-`

### Session authentication

```text
login
 ↓
server validates credentials
 ↓
create session
 ↓
session_id → Redis/database
 ↓
Set-Cookie: session_id=...
 ↓
browser automatically sends cookie
```

Know:

- Stateful authentication
- Session store
- Session expiration
- Sliding sessions
- Session rotation
- Session fixation
- Session hijacking
- Logout
- Revoke all sessions
- Device sessions
- Concurrent sessions

---

# 5. Authentication

## Password authentication

- Password hashing
- Salt
- Pepper
- bcrypt
- scrypt
- Argon2
- Work factors
- Why SHA-256 isn't a password hash
- Timing attacks
- Constant-time comparison
- Credential stuffing
- Password spraying
- Brute-force protection
- Rate limiting
- Account lockouts

### Password reset

Understand the entire flow:

```text
request reset
→ generate random token
→ store hashed token
→ short expiry
→ email link
→ validate token
→ rotate password
→ invalidate token
→ potentially revoke sessions
```

And how reset implementations become exploitable.

## JWT

Know JWT beyond:

```text
header.payload.signature
```

Study:

- Claims
- `iss`
- `sub`
- `aud`
- `exp`
- `nbf`
- `iat`
- `jti`
- Signing
- Verification
- HS256
- RS256
- ES256
- JWKS
- Key rotation
- Access tokens
- Refresh tokens
- Token rotation
- Refresh token reuse detection
- Revocation
- Short-lived access tokens
- Token storage
- JWT vs opaque tokens

### JWT attacks / mistakes

- Missing signature verification
- Algorithm confusion
- Weak secrets
- Trusting claims before verification
- Missing issuer validation
- Missing audience validation
- Excessively long expiry
- Token leakage
- Storing sensitive information in payload
- Poor key rotation

---

# 6. OAuth 2.0 and OpenID Connect

Know the actors:

```text
Resource Owner
Client
Authorization Server
Resource Server
```

Study:

- Authorization Code flow
- PKCE
- Client Credentials
- Refresh tokens
- Scopes
- Consent
- Redirect URI
- `state`
- `nonce`
- Access tokens
- ID tokens

Understand:

```text
OAuth = delegated authorization

OIDC = identity layer on OAuth
```

Security:

- Redirect URI attacks
- Authorization code interception
- CSRF
- State validation
- Token leakage
- PKCE
- Client secret handling

---

# 7. Authorization

Authentication:

> Who are you?

Authorization:

> What can you do?

Study:

### RBAC

```text
User → Role → Permissions
```

### ABAC

Authorization based on attributes.

### ACL

Resource-specific permission lists.

### ReBAC

Relationship-based authorization:

```text
user → member_of → team
team → owns → document
```

Then:

- Resource ownership
- Tenant isolation
- Organization permissions
- Permission inheritance
- Policy engines
- Least privilege
- Default deny
- Server-side enforcement

And especially:

### IDOR / BOLA

```http
GET /users/123/orders/789
```

What happens if the attacker changes `789`?

This is one of the most important real backend authorization bugs.

---

# 8. Backend Application Architecture

Understand the responsibilities of:

```text
Request
 ↓
Router
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

Study:

- Routes
- Controllers
- Services
- Repositories
- Models
- DTOs
- Middleware
- Dependency injection
- Configuration
- Adapters
- Domain layer
- Infrastructure layer

And architectural approaches:

- Layered architecture
- MVC
- Modular monolith
- Hexagonal architecture
- Ports and adapters
- Clean architecture

Don't memorize architecture diagrams. Be able to explain why a boundary exists.

---

# 9. Input Validation

Study:

- Schema validation
- Type validation
- Semantic validation
- Business-rule validation
- Sanitization
- Normalization
- Whitelisting
- Blacklisting
- Nested object validation
- Unknown fields
- Request-size limits
- File validation

Example:

```json
{
  "email": "...",
  "age": -500,
  "role": "admin"
}
```

Syntactically valid JSON does not mean valid input.

Understand:

- Mass assignment
- Parameter pollution
- Prototype pollution
- Type confusion
- Integer overflow
- Unicode normalization
- Regex DoS

---

# 10. API Design

## REST

Understand resources:

```text
/users
/users/:id
/users/:id/orders
```

Study:

- Resource-oriented URLs
- HTTP verbs
- Status codes
- Statelessness
- Representation
- Nested resources
- Filtering
- Sorting
- Searching
- Field selection
- Bulk APIs
- Partial updates

## Pagination

### Offset pagination

```sql
LIMIT 20 OFFSET 100000
```

Understand why large offsets become expensive.

### Cursor pagination

```text
?after=eyJpZCI6...
```

Study:

- Stable ordering
- Cursor encoding
- Duplicate/missing records
- Concurrent writes

### Keyset pagination

```sql
WHERE created_at < ?
ORDER BY created_at DESC
LIMIT 20
```

## API versioning

- URL versioning
- Header versioning
- Compatibility
- Deprecation
- Backward-compatible changes
- Breaking changes

## Idempotency

Especially:

```http
POST /payments
Idempotency-Key: abc123
```

Study:

- Retry-safe APIs
- Deduplication
- Idempotency key storage
- Request fingerprinting
- Expiry
- Concurrent duplicate requests

---

# 11. REST vs RPC vs GraphQL vs gRPC

Understand where each fits.

### RPC

```text
createUser(...)
chargeCard(...)
```

### GraphQL

Study:

- Schema
- Queries
- Mutations
- Resolvers
- Subscriptions
- N+1 queries
- DataLoader
- Query complexity
- Depth limiting
- Persisted queries
- GraphQL authorization
- Caching difficulties

### gRPC

- Protocol Buffers
- HTTP/2
- Unary RPC
- Server streaming
- Client streaming
- Bidirectional streaming
- Deadlines
- Metadata
- Interceptors
- Schema evolution

---

# 12. Error Handling

A production backend needs an error model.

Understand:

- Operational errors
- Programmer errors
- Validation errors
- Authentication errors
- Authorization errors
- Dependency failures
- Timeouts
- Conflict errors

Design structured errors:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User does not exist",
    "request_id": "..."
  }
}
```

Study:

- Global error middleware
- Error propagation
- Exception boundaries
- Error wrapping
- Error causes
- Stack traces
- Internal vs external errors
- Information leakage
- Error codes
- Retryability

---

# 13. Database Access from Backend Services

Keep database theory in our DBMS track, but learn the application-facing pieces here.

- Connection strings
- Connection pools
- Pool sizing
- Pool exhaustion
- Query timeouts
- Prepared statements
- Parameterized queries
- Transactions from application code
- Isolation selection
- ORM
- Query builders
- Raw SQL
- N+1 problem
- Lazy loading
- Eager loading
- Batch loading
- Database migrations
- Schema migrations
- Zero-downtime migrations
- Backfills
- Dual reads/writes
- Expand-and-contract migrations

### ORM internals

Understand:

```text
ORM call
→ query builder
→ SQL
→ driver
→ connection
→ DB
→ result
→ hydration
→ application object
```

Know when an ORM becomes dangerous.

---

# 14. Caching

Know the patterns deeply.

### Cache-aside

```text
request
 ↓
Redis?
 ↙   ↘
hit   miss
       ↓
       DB
       ↓
      cache
```

### Read-through
### Write-through
### Write-behind
### Write-around

Study:

- TTL
- Eviction
- LRU
- LFU
- Cache invalidation
- Stale data
- Cache consistency
- Cache warming
- Negative caching
- Local cache
- Distributed cache
- CDN caching
- HTTP caching

### Failure modes

- Cache stampede
- Cache penetration
- Cache avalanche
- Hot keys
- Big keys
- Stale reads
- Redis outage

Solutions:

- Request coalescing
- Locks
- Probabilistic early expiration
- TTL jitter
- Stale-while-revalidate

---

# 15. Redis as a Backend Primitive

Not just:

> Redis = cache.

Study:

- Strings
- Hashes
- Lists
- Sets
- Sorted sets
- Streams
- Bitmaps
- HyperLogLog
- Pub/Sub
- Transactions
- Lua scripts
- Pipelining

Internals:

- Event loop
- RESP
- Expiration
- Eviction
- RDB
- AOF
- Replication
- Sentinel
- Cluster
- Hash slots

Uses:

- Cache
- Sessions
- Rate limiting
- Locks
- Leaderboards
- Queues
- Presence
- Counters

---

# 16. Background Jobs and Queues

Understand why:

```text
HTTP request
→ send email
→ resize image
→ generate PDF
→ call external API
```

is often a bad synchronous request path.

Instead:

```text
API
 ↓
Queue
 ↓
Worker
```

Study:

- Producer
- Consumer
- Broker
- Worker
- Job
- Acknowledgment
- Visibility timeout
- Consumer groups
- Prefetch
- Backpressure

Delivery semantics:

- At-most-once
- At-least-once
- Effectively-once
- Why true exactly-once is difficult

Failure handling:

- Retries
- Exponential backoff
- Jitter
- Dead-letter queues
- Poison messages
- Duplicate processing
- Idempotent consumers

Systems to understand conceptually:

- RabbitMQ
- Kafka
- SQS
- Redis Streams

---

# 17. Kafka

Kafka deserves its own interview block.

Understand:

```text
Topic
 ├── Partition 0
 ├── Partition 1
 └── Partition 2
```

Study:

- Broker
- Topic
- Partition
- Offset
- Producer
- Consumer
- Consumer group
- Partition leader
- Replica
- ISR
- Retention
- Compaction
- Ordering guarantees
- Consumer lag
- Rebalancing
- Offset commits
- Producer acknowledgments
- Idempotent producers
- Kafka transactions

And:

> Why Kafka isn't simply "another queue."

---

# 18. Events and Event-Driven Backend Design

Study:

- Events vs commands
- Pub/Sub
- Event bus
- Event schemas
- Schema evolution
- Event versioning
- Eventual consistency
- Event replay
- Event sourcing
- CQRS

### Transactional outbox

Understand the dual-write problem:

```text
UPDATE orders...
publish OrderCreated
```

What happens if one succeeds and the other fails?

Study:

- Outbox table
- CDC
- Inbox pattern
- Idempotent consumer
- Saga
- Choreography
- Orchestration
- Compensating transactions

---

# 19. Concurrency in Backend Services

Study:

- Processes
- Threads
- Event loops
- Async I/O
- Blocking I/O
- Non-blocking I/O
- Futures
- Promises
- Coroutines
- Worker pools
- Thread pools
- Connection pools

Backend race conditions:

```text
read balance = 100
read balance = 100

subtract 80
subtract 80
```

Understand:

- Race conditions
- Critical sections
- Mutex
- Semaphore
- Atomic operations
- Optimistic locking
- Pessimistic locking
- Compare-and-swap
- Distributed concurrency

---

# 20. Distributed Locks

Study:

```text
SET lock_key random_value NX PX 30000
```

Then understand why this alone isn't universally safe.

Study:

- Lock ownership
- Lease expiration
- Heartbeats
- Lock renewal
- Fencing tokens
- Clock assumptions
- Redis locks
- Database advisory locks
- ZooKeeper-style coordination
- Redlock debate

Know when **not** to use a distributed lock.

---

# 21. Rate Limiting

Algorithms:

### Fixed window
### Sliding window log
### Sliding window counter
### Token bucket
### Leaky bucket

Understand:

- Per-user limits
- Per-IP limits
- Per-API-key limits
- Global limits
- Distributed rate limiting
- Redis-based limiters
- Atomic increments
- Burst handling
- `429 Too Many Requests`
- `Retry-After`

Security implications:

- Login protection
- OTP endpoints
- Password resets
- Expensive queries
- Scraping
- DoS mitigation

---

# 22. Timeouts, Retries and Resilience

One of the most underrated backend interview areas.

Study:

- Connect timeout
- Read timeout
- Write timeout
- Request deadline
- Retry budget
- Retry storms
- Exponential backoff
- Jitter
- Retryable errors
- Non-retryable errors
- Idempotency
- Deadline propagation

Patterns:

- Circuit breaker
- Bulkhead
- Load shedding
- Graceful degradation
- Fail fast
- Fallbacks

Understand cascading failures:

```text
A → B → C → database
```

What happens when C takes 30 seconds instead of 30 ms?

---

# 23. Reverse Proxies

Understand:

```text
Internet
   ↓
Nginx
   ↓
Backend instances
```

Study:

- Forward proxy vs reverse proxy
- Request forwarding
- Header manipulation
- TLS termination
- Compression
- Static files
- Caching
- Rate limiting
- Buffering
- Connection reuse
- Health checks
- Load balancing

Important headers:

- `X-Forwarded-For`
- `X-Forwarded-Proto`
- `X-Real-IP`
- `Forwarded`

Understand trusted proxies and spoofing.

---

# 24. Nginx Internals

Since you specifically mentioned it, go deeper than configuration.

Study:

- Master process
- Worker processes
- Event-driven architecture
- `epoll` / `kqueue`
- Non-blocking sockets
- Worker connections
- Accepting connections
- Request parsing
- Upstream connections
- Buffers
- Proxy buffering
- Keep-alive
- Worker limits
- File descriptors
- `sendfile`
- Zero-copy concepts
- TLS termination
- Load balancing algorithms

Understand why Nginx can handle many connections without creating one thread per connection.

---

# 25. Load Balancing

### Layer 4

```text
TCP
```

Decisions based on:

- IP
- Port
- Connection

### Layer 7

```text
HTTP
```

Decisions based on:

- Host
- Path
- Header
- Cookie
- Request metadata

Algorithms:

- Round robin
- Weighted round robin
- Least connections
- Least response time
- Random
- Power of two choices
- Consistent hashing

Study:

- Health checks
- Active vs passive checks
- Sticky sessions
- Connection draining
- Slow start
- Backend pools
- Failover

---

# 26. TCP Load Balancers

Understand the data path.

Study:

- TCP proxy
- Connection termination
- Connection forwarding
- Full proxy
- NAT
- DSR
- Source IP preservation
- PROXY protocol
- Connection tracking
- Long-lived connections
- Connection balancing vs request balancing

Then understand why:

> L4 load balancing and L7 HTTP load balancing solve different problems.

---

# 27. DNS for Backend Engineers

Again, networking theory stays in CN, but backend operational behavior belongs here.

Study:

- A
- AAAA
- CNAME
- TXT
- MX
- NS
- SRV
- TTL
- Recursive resolver
- Authoritative DNS
- DNS caching
- Negative caching
- DNS propagation

Backend uses:

- Service discovery
- Failover
- Geographic routing
- Weighted routing
- Multi-region services

And failure cases:

> What happens when you change an IP but clients still have the old DNS record cached?

---

# 28. Service Discovery

Understand:

```text
service A → "payments"
```

instead of hardcoding:

```text
service A → 10.43.19.72
```

Study:

- Client-side discovery
- Server-side discovery
- DNS discovery
- Service registry
- Health registration
- Heartbeats
- Consul
- etcd
- Kubernetes Services

---

# 29. Tailscale and Modern Private Networking

Since you specifically want it included, study how [Tailscale](https://tailscale.com/?utm_source=chatgpt.com) works conceptually.

Understand:

```text
Device A
   ↕
WireGuard tunnel
   ↕
Device B
```

Study:

- WireGuard
- Public/private keys
- Tailnet
- Control plane
- Data plane
- Peer discovery
- NAT traversal
- UDP hole punching
- STUN
- DERP relays
- Coordination server
- MagicDNS
- ACLs / grants
- Exit nodes
- Subnet routers
- Device identity
- Key rotation

The important conceptual question:

> How can two machines behind separate NATs establish a direct encrypted connection?

---

# 30. WebSockets and Realtime Backends

Study handshake:

```http
Connection: Upgrade
Upgrade: websocket
```

Then:

- Full duplex communication
- Frames
- Ping/pong
- Heartbeats
- Connection lifecycle
- Reconnection
- Message ordering
- Backpressure
- Authentication
- Authorization

At scale:

```text
Client
 ↓
LB
 ↓
WS server
 ↓
Redis Pub/Sub / broker
 ↓
other WS servers
```

Understand:

- Sticky connections
- Connection state
- Fan-out
- Presence
- Rooms/channels
- Horizontal scaling
- Millions of connections

---

# 31. SSE, Long Polling and WebSockets

Know when to use:

### Polling
### Long polling
### Server-Sent Events
### WebSockets
### WebTransport

Compare:

- Directionality
- Complexity
- Reconnection
- Proxy compatibility
- Scalability
- Browser support
- Use cases

---

# 32. File Uploads and Object Storage

Study:

- `multipart/form-data`
- Streaming uploads
- Buffering
- File size limits
- MIME validation
- Magic bytes
- Malware scanning
- Filename attacks
- Path traversal

Object storage:

```text
client
 ↓
presigned URL
 ↓
object storage
```

Study:

- S3-style storage
- Buckets
- Objects
- Presigned URLs
- Multipart uploads
- Checksums
- CDN delivery
- Metadata
- Lifecycle policies

Understand why large files usually shouldn't pass through your application server.

---

# 33. Search

Since you already have Trace, this section should become particularly deep for you. 

### Database search

- `LIKE`
- Prefix search
- Index limitations

### Full-text search

- Tokenization
- Normalization
- Stop words
- Stemming
- Inverted index
- Posting lists
- Term frequency
- Document frequency
- TF-IDF
- BM25
- Phrase queries
- Positional indexes

### Search engines

Understand conceptually:

- Elasticsearch
- OpenSearch
- Lucene

Backend concerns:

- Indexing pipeline
- Incremental indexing
- Reindexing
- Search/database consistency
- Aliases
- Mapping
- Sharding
- Replication
- Query latency

Then:

- Vector search
- Embeddings
- ANN
- HNSW
- Hybrid retrieval
- Reranking

---

# 34. Security — Backend Attack Surface

You should have an explicit security track rather than learning vulnerabilities randomly.

Study the modern [OWASP Top 10](https://owasp.org/www-project-top-ten/?utm_source=chatgpt.com) plus API-specific threats.

Know deeply:

- SQL injection
- NoSQL injection
- Command injection
- LDAP injection
- Template injection
- XSS
- CSRF
- SSRF
- XXE
- Path traversal
- Open redirects
- IDOR / BOLA
- Broken authentication
- Broken authorization
- Mass assignment
- Insecure deserialization
- Prototype pollution
- Request smuggling
- HTTP response splitting
- Host header injection
- Cache poisoning
- Cache deception
- Race-condition attacks
- ReDoS
- Zip bombs
- File-upload attacks
- Credential stuffing
- Brute force
- Enumeration attacks

For **every vulnerability**, learn four things:

```text
How it works
      ↓
Why vulnerable code permits it
      ↓
How an attacker exploits the weakness
      ↓
How the backend prevents it
```

That is much more useful than memorizing vulnerability names.

---

# 35. SSRF in Depth

This deserves special backend attention.

Example:

```http
POST /fetch
{
  "url": "http://169.254.169.254/..."
}
```

Study:

- Internal service access
- Cloud metadata endpoints
- localhost attacks
- Private IP ranges
- DNS rebinding
- Redirect bypasses
- URL parsing confusion
- Alternate IP representations
- Protocol restrictions

Defenses:

- Allowlisting
- Network isolation
- DNS validation
- Redirect validation
- Metadata service protection
- Egress controls

---

# 36. CSRF in Depth

Understand why cookies make CSRF possible.

Study:

- Cross-site requests
- Cookie auto-attachment
- CSRF tokens
- Synchronizer token
- Double-submit cookie
- SameSite
- Origin verification
- Referer verification

And especially:

> Why JWT authentication doesn't automatically eliminate CSRF if the JWT lives in a cookie.

---

# 37. Secrets and Configuration

Study:

- Environment variables
- Config files
- Secret managers
- API keys
- Database credentials
- Encryption keys
- Key rotation
- Secret rotation
- Credential scopes
- Temporary credentials

Never:

```text
API_KEY=abc123
```

inside Git history.

Understand:

- `.env`
- Production configuration
- Vault-like systems
- Cloud secret managers
- KMS
- Envelope encryption

---

# 38. Encryption and Data Protection

Study:

### Encryption in transit
TLS.

### Encryption at rest
Disk/database/object encryption.

### Application-level encryption

Then:

- AES
- AES-GCM
- RSA
- ECC
- Hashing
- HMAC
- Digital signatures
- Random number generation
- Nonces
- IVs
- Key derivation
- Key rotation

Know the difference between:

```text
encoding
encryption
hashing
signing
```

---

# 39. Logging

A backend should generate useful **structured logs**, not:

```text
something went wrong lol
```

Study:

```json
{
  "timestamp": "...",
  "level": "error",
  "service": "payments",
  "request_id": "...",
  "user_id": "...",
  "error": "..."
}
```

Concepts:

- Structured logging
- Log levels
- Contextual logging
- Correlation IDs
- Request IDs
- Trace IDs
- Centralized logging
- Log aggregation
- Sampling
- Redaction
- PII
- Secret leakage
- Log retention

Understand why logs need to be machine-queryable.

---

# 40. Metrics

Know the distinction:

```text
Logs → individual events

Metrics → aggregated measurements

Traces → request journey
```

Study:

- Counter
- Gauge
- Histogram
- Summary

Backend metrics:

- Request rate
- Error rate
- Latency
- CPU
- Memory
- Connections
- Queue depth
- Cache hit ratio
- DB pool utilization

Latency:

- Average
- Median
- p50
- p90
- p95
- p99
- p99.9

Understand why average latency can hide a disaster.

---

# 41. Distributed Tracing

Understand:

```text
request
   ↓ trace_id = abc

API
 └─ span
      ↓
payment service
 └─ span
      ↓
database
 └─ span
```

Study:

- Trace
- Span
- Parent span
- Span ID
- Trace ID
- Context propagation
- Sampling
- Baggage

Know [OpenTelemetry](https://opentelemetry.io/?utm_source=chatgpt.com) conceptually.

---

# 42. Observability

Not:

> We have Grafana.

Understand observability as being able to investigate unknown system behavior from emitted telemetry.

Study:

- Logs
- Metrics
- Traces
- Events
- Dashboards
- Alerting
- Correlation

Golden signals:

- Latency
- Traffic
- Errors
- Saturation

RED:

- Rate
- Errors
- Duration

USE:

- Utilization
- Saturation
- Errors

---

# 43. SLI, SLO and SLA

Know:

### SLI
What you measure.

### SLO
The reliability target.

### SLA
External commitment.

Example:

```text
SLI:
successful requests / total requests

SLO:
99.95%

SLA:
99.9%
```

Study:

- Availability
- Error budgets
- Burn rate
- Reliability vs feature velocity

---

# 44. Health Checks

Study:

```text
/health
/ready
/live
```

Understand:

### Liveness
Is the process alive?

### Readiness
Can it safely receive traffic?

### Startup checks

Don't blindly make health checks depend on every downstream dependency.

Know why.

---

# 45. Graceful Shutdown

When deployment sends SIGTERM:

```text
SIGTERM
 ↓
stop accepting traffic
 ↓
finish active requests
 ↓
stop workers
 ↓
close DB connections
 ↓
exit
```

Study:

- Signals
- Connection draining
- Request draining
- Queue consumer shutdown
- Timeout
- Forced termination
- Kubernetes termination behavior

---

# 46. Deployment Fundamentals

Study:

```text
code
 ↓
build
 ↓
artifact
 ↓
deploy
 ↓
health check
 ↓
traffic
```

Strategies:

- Recreate
- Rolling
- Blue-green
- Canary
- Feature flags
- Shadow traffic

Understand:

- Rollbacks
- Database compatibility
- Zero-downtime deployments
- Backward compatibility
- Forward compatibility

---

# 47. Containers

Docker from the backend engineer's perspective:

- Image
- Container
- Layer
- Dockerfile
- Registry
- Volume
- Network
- Port
- Environment
- Entrypoint
- PID 1
- Signals
- Multi-stage builds

Internals:

- Namespaces
- cgroups
- Overlay filesystems
- Container networking

Security:

- Rootless containers
- Minimal images
- Image scanning
- Secrets
- Capabilities

---

# 48. Kubernetes for Backend Engineers

You don't need to become a cluster administrator, but understand:

```text
Deployment
 ↓
ReplicaSet
 ↓
Pods
```

Study:

- Pod
- Deployment
- ReplicaSet
- Service
- ConfigMap
- Secret
- Ingress
- Namespace
- StatefulSet
- DaemonSet
- Job
- CronJob
- PersistentVolume
- PersistentVolumeClaim

Operational concepts:

- Scheduling
- Resource requests
- Limits
- Liveness
- Readiness
- Autoscaling
- Rolling deployments
- Service discovery
- Pod termination
- CrashLoopBackOff

---

# 49. Performance Engineering

Study:

- Latency
- Throughput
- Concurrency
- CPU-bound work
- I/O-bound work
- Memory usage
- Allocations
- Garbage collection
- Context switching
- Syscalls

Performance investigation:

```text
slow API
 ↓
network?
 ↓
proxy?
 ↓
application?
 ↓
database?
 ↓
cache?
 ↓
downstream?
```

Know:

- Profiling
- CPU profiles
- Heap profiles
- Flame graphs
- Load testing
- Stress testing
- Soak testing

Tools/concepts:

- `wrk`
- `ab`
- k6
- Locust

---

# 50. Backpressure

Very important.

Suppose:

```text
API receives 50k requests/sec
worker processes 10k/sec
```

Where do the remaining 40k/sec go?

Study:

- Queue growth
- Memory growth
- Bounded queues
- Flow control
- Load shedding
- Admission control
- Rate limiting
- Producer throttling
- TCP backpressure
- Reactive streams

---

# 51. Memory Leaks and Resource Leaks

Study backend causes:

- Unbounded caches
- Event listeners
- Global maps
- Closures
- Timers
- Buffers
- Forgotten streams
- Goroutine/thread leaks
- DB connection leaks
- Socket leaks
- File descriptor leaks

Learn how to investigate:

```text
memory grows continuously
CPU normal
GC increasingly frequent
```

---

# 52. Multi-Tenancy

Architectures:

### Shared database/shared schema
### Shared database/separate schema
### Database per tenant

Study:

- Tenant identification
- Tenant isolation
- Authorization
- Noisy neighbors
- Rate limits
- Per-tenant quotas
- Data leakage
- Tenant-aware caching
- Tenant-aware jobs

---

# 53. Webhooks

Know the complete production design.

```text
Provider
   ↓ POST event
Your endpoint
   ↓
verify signature
   ↓
persist
   ↓
ack quickly
   ↓
process asynchronously
```

Study:

- HMAC signatures
- Timestamp validation
- Replay attacks
- Retries
- Duplicate events
- Idempotency
- Event ordering
- Dead-letter handling
- Endpoint rotation

---

# 54. Third-Party API Integration

Real backend engineering frequently means unreliable external APIs.

Study:

- Timeouts
- Retries
- Backoff
- Jitter
- Circuit breakers
- Rate limits
- Quotas
- Authentication
- Pagination
- Webhooks
- Idempotency
- Error mapping
- Schema changes
- Dependency outages

Design assuming the dependency **will fail**.

---

# 55. Email Backend

Know enough to explain:

```text
application
 ↓
email queue
 ↓
provider
 ↓
SMTP
 ↓
recipient server
```

Study:

- SMTP
- SPF
- DKIM
- DMARC
- Bounce
- Complaint
- Suppression list
- Transactional email
- Bulk email
- Delivery retries

---

# 56. Cron and Scheduled Work

Study:

- Cron
- Distributed schedulers
- Leader election
- Duplicate execution
- Missed execution
- Job locking
- Retry
- Catch-up behavior

Classic interview problem:

> You have 20 backend instances. How do you ensure a daily job executes only once?

---

# 57. Feature Flags

Study:

- Boolean flags
- Percentage rollouts
- User targeting
- Cohort targeting
- Kill switches
- Experimentation
- Server-side evaluation
- Flag caching
- Stale flags
- Cleanup

Feature flags become technical debt if permanent.

---

# 58. Monoliths and Microservices

Understand:

### Monolith
### Modular monolith
### Microservices

Microservice issues:

- Network failures
- Latency
- Deployment complexity
- Distributed transactions
- Observability
- Service discovery
- Versioning
- Data ownership

Understand the **distributed monolith** anti-pattern.

Don't answer:

> Microservices scale better.

Explain exactly what independently scales and what complexity you're accepting.

---

# 59. API Gateway

Understand:

```text
clients
   ↓
API Gateway
   ↓
users | orders | payments
```

Responsibilities:

- Routing
- Authentication
- Rate limiting
- TLS
- Logging
- Request transformation
- Quotas
- Version routing

And what **shouldn't** become gateway business logic.

---

# 60. Service Mesh

Understand conceptually:

```text
Service A
 ↓
sidecar proxy
 ↓
sidecar proxy
 ↓
Service B
```

Study:

- Data plane
- Control plane
- Sidecars
- Envoy
- mTLS
- Traffic policies
- Retries
- Circuit breakers
- Observability

And why service meshes can create substantial operational complexity.

---

# 61. CDN and Edge

Study:

```text
User
 ↓
Edge POP
 ↓
Origin
```

Understand:

- Edge cache
- Cache key
- TTL
- Purge/invalidation
- Origin shield
- Cache hit
- Cache miss
- Stale content
- Signed URLs
- Signed cookies

Security:

- DDoS protection
- WAF
- Bot mitigation

---

# 62. Database/Cache/Queue Failure Scenarios

You should practice questions rather than only technologies.

Examples:

> Redis goes down. What happens?

> PostgreSQL primary dies.

> Kafka consumer is six hours behind.

> Connection pool is exhausted.

> DB latency changes from 10 ms to 2 seconds.

> One downstream service starts returning 503.

> DNS fails.

> TLS certificate expires.

> Queue fills faster than workers consume.

> One endpoint suddenly receives 100× traffic.

For every failure ask:

```text
What breaks?
How does it propagate?
How do we detect it?
How do we contain it?
How do we recover?
How do we prevent recurrence?
```

---

# 63. Production Debugging

Practice scenarios such as:

### API latency increased

Investigate:

```text
p99
→ endpoint
→ trace
→ application span
→ DB queries
→ cache
→ dependencies
→ resource saturation
```

### CPU at 100%

Investigate:

- Traffic
- Infinite loops
- Serialization
- Compression
- GC
- Regex
- Encryption
- Hot endpoints

### Memory keeps growing

- Heap dump
- Allocation profile
- Cache growth
- Leaks
- Queues

### 500 rate increased after deployment

- Deployment diff
- Error logs
- Trace IDs
- Rollback
- Database migrations
- Feature flags

Backend interviews increasingly test this kind of reasoning.

---

# 64. Backend Testing

Study:

### Unit tests
### Integration tests
### API tests
### End-to-end tests
### Contract tests
### Load tests
### Chaos tests

Understand:

- Test doubles
- Mocks
- Stubs
- Fakes
- Fixtures
- Test databases
- Transaction rollback
- Deterministic tests
- Flaky tests
- Dependency mocking

For distributed services:

- Consumer-driven contracts
- Schema compatibility

---

# 65. API Documentation and Contracts

Study:

- OpenAPI
- JSON Schema
- Swagger
- Protocol Buffers
- API contracts
- Generated clients
- Schema validation
- Backward compatibility

Know what makes a good API contract.

---

# 66. Backend Code Quality

Interviewers can move from architecture straight into code.

Know:

- Separation of concerns
- Dependency inversion
- Interface design
- Composition
- Error boundaries
- Naming
- Immutability
- Side effects
- Pure functions where appropriate
- Resource ownership
- Configuration management

Avoid turning every simple CRUD service into "Clean Architecture™."

Know when abstraction pays for itself.

---

# 67. Language Runtime Knowledge

For whichever backend language you claim on the résumé, know its runtime.

For **Node.js**, for example:

```text
V8
Event loop
libuv
microtasks
macrotasks
Promise queue
timers
I/O callbacks
worker pool
worker_threads
cluster/processes
streams
buffers
```

Understand what happens when CPU-heavy work blocks Node.

If using **Go**, know:

```text
goroutines
channels
scheduler
G-M-P model
select
contexts
mutexes
WaitGroups
interfaces
escape analysis
GC
```

A backend interview can absolutely cross from API architecture into runtime internals.

---

# 68. Production Networking Topics

Beyond the CN syllabus, connect networking directly to backend behavior:

- Socket
- Port
- Listen backlog
- Accept queue
- SYN queue
- Keep-alive
- TIME_WAIT
- CLOSE_WAIT
- Connection reuse
- Ephemeral ports
- Connection exhaustion
- File descriptors
- `ulimit`
- TCP keepalive
- HTTP keepalive
- NAT
- NAT tables
- Proxy protocol

Know why a backend can fail despite:

```text
CPU = 20%
RAM = 40%
```

because it ran out of sockets/file descriptors/connections.

---

# 69. Cloud-Native Backend Concepts

Vendor-neutral concepts matter more than memorizing AWS products.

Understand:

- VM
- Container
- Serverless
- Managed database
- Managed queue
- Object storage
- Load balancer
- CDN
- VPC
- Public/private subnet
- Security groups/firewalls
- NAT gateway
- IAM
- Autoscaling
- Availability zones
- Regions

Then map those concepts to whichever cloud you encounter.

---

# 70. Cost-Aware Backend Engineering

A strong senior-ish interview can ask:

> It works. Why is the cloud bill ₹20 lakh/month?

Understand cost drivers:

- Compute
- Memory
- Database
- Storage
- Network egress
- Cross-region traffic
- Logs
- Metrics cardinality
- Cache size
- Queue retention
- Search clusters

Backend engineering isn't just making requests succeed.

---

# 71. The Request-Lifecycle Master Question

By the end of this syllabus, you should be able to take:

```text
https://api.example.com/orders/123
```

and explain the entire journey:

```text
Browser / Client
        ↓
DNS resolution
        ↓
TCP / QUIC
        ↓
TLS handshake
        ↓
CDN / Edge
        ↓
L4 Load Balancer
        ↓
L7 Proxy / Nginx
        ↓
API Gateway
        ↓
Backend socket
        ↓
HTTP parser
        ↓
Middleware
        ↓
Authentication
        ↓
Authorization
        ↓
Validation
        ↓
Controller
        ↓
Service
      ↙   ↓   ↘
 Redis    DB    Queue
          ↓      ↓
      connection worker
        pool
          ↓
       response
          ↓
    serialization
          ↓
       Nginx
          ↓
        TLS
          ↓
       Client
```

And simultaneously explain the **side channels**:

```text
                 Backend
             ↙      ↓       ↘
           logs   metrics   traces
             \      |       /
               observability
```

Then I can interrupt anywhere:

> What if Redis is down?

> What if the JWT has expired?

> What if two requests update the same order?

> What if the worker processes the event twice?

> What if Nginx dies?

> What if the DB pool is exhausted?

> What if the user retries POST?

> What if an attacker changes the Origin header?

> What if p50 is 30 ms but p99 is 8 seconds?

> What if 100 servers simultaneously miss the same cache key?

> What if deployment happens while requests are active?

> What if the queue has 20 million messages?

> What if your TLS certificate expires?

If you can reason through those rather than recall canned answers, **that's backend-interview readiness**.

For our study plan, I would make **Backend Engineering a separate major subject alongside DBMS, CN, OS and System Design**, with practical implementation alongside it. It also fits neatly between your fundamentals work and system design: backend teaches you how the individual production pieces actually behave; system design then asks you to compose them into larger systems.

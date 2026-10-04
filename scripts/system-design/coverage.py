"""Map the supplied syllabus to concrete chapter locations for human review.
A textual match inventories coverage; depth is checked separately by read-through.
"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
groups={
'networking':'HTTP/1.1;HTTP/2;HTTP/3;TCP;UDP;DNS;TLS;HTTPS;WebSocket;SSE;gRPC;REST;reverse proxy;L4;L7;connection pool;keep-alive;timeout;retry;exponential backoff;jitter;idempotency;long polling;polling;push',
'performance':'latency;throughput;p50;p95;p99;IOPS;bandwidth;CPU-bound;I/O-bound;network-bound;horizontal;vertical;Amdahl;backpressure;queueing;bottleneck;QPS;storage;cache size;peak;concurrency',
'databases':'table;row;index;primary key;foreign key;B-tree;B+ tree;composite;covering;clustered;non-clustered;query execution;join;transaction;ACID;isolation;dirty;non-repeatable;phantom;MVCC;lock;deadlock;WAL;connection pool;read replica;leader;follower;synchronous;asynchronous;replication lag;partition;shard;reshard;hot partition;consistent hashing',
'nosql':'key-value;Redis;DynamoDB;document;MongoDB;wide-column;Cassandra;Bigtable;graph;Neo4j;access pattern;denormalization;secondary index;eventual consistency;quorum;replication factor;partition key;SQL;operational',
'distributed-systems':'CAP;partition tolerance;consistency;availability;strong consistency;eventual consistency;causal consistency;read-your-writes;monotonic reads;leader/follower;multi-leader;leaderless;replication lag;failover;split brain;quorum;leader election;distributed lock;lease;heartbeat;failure detection;consensus;Raft;ZooKeeper;etcd',
'caching':'local;in-process;distributed cache;CDN;browser cache;buffer cache;cache-aside;read-through;write-through;write-behind;invalidation;stale data;TTL;eviction;LRU;LFU;stampede;penetration;avalanche;hot key;consistency;Redis;failure',
 'traffic-routing':'reverse proxy;API gateway;L4;L7;load balancer;round robin;weighted;least connections;consistent hashing;sticky session;health check;failover;service discovery;geographic;DNS;edge;application',
 'queues':'message queue;pub/sub;event stream;producer;consumer;consumer group;partition;ordering;offset;acknowledgement;dead-letter;retry;poison;backpressure;at-most-once;at-least-once;exactly-once;idempotent;outbox',
 'kafka':'broker;topic;partition;offset;consumer group;replication;retention;at-most-once;at-least-once;exactly-once;idempotent',
 'apis-and-services':'resource model;pagination;cursor;offset;filtering;sorting;versioning;idempotency;rate limit;validation;authentication;authorization;API gateway;monolith;modular monolith;microservice;service boundar;service discovery;inter-service;synchronous;asynchronous;distributed transaction;saga;orchestration;choreography',
 'reliability':'single point;redundancy;graceful degradation;fault tolerance;retry;exponential backoff;jitter;timeout;circuit breaker;bulkhead;health check;failover;disaster recovery;RTO;RPO;availability;99.9;99.99;active-active;active-passive',
 'rate-limiting':'fixed window;sliding window log;sliding window counter;token bucket;leaky bucket;Redis;100;race;atomic;unavailable',
 'storage':'local disk;block storage;file storage;object storage;database;distributed file system;bucket;object;key;metadata;multipart;presigned;checksum;replication;lifecycle;5 GB',
 'cdn':'edge;origin;hit;miss;TTL;invalidation;pull;push;signed URL;geographic;YouTube;Instagram;Netflix;image;static',
 'search':'inverted index;tokenization;posting;TF-IDF;BM25;indexing pipeline;Elasticsearch;shard;replica;indexing;querying;autocomplete;prefix;fuzzy;LIKE',
 'realtime':'WebSocket;SSE;polling;long polling;connection management;heartbeat;reconnect;presence;fan-out;pub/sub;scorer;score service;event stream;gateway;50,000',
 'data-pipelines':'OLTP;OLAP;batch;stream;ETL;ELT;warehouse;lake;CDC;Kafka;materialized view;Spark;Flink',
 'security':'authentication;authorization;session;JWT;OAuth;cookie;API key;RBAC;ACL;encryption at rest;encryption in transit;TLS;secret;password hashing;signed URL;CORS;CSRF;abuse;rate',
 'observability':'log;metric;trace;structured;correlation;request ID;distributed tracing;dashboard;alert;SLI;SLO;SLA;request rate;error rate;latency;CPU;memory;queue depth;DB connection;cache hit',
 'scaling-patterns':'sharding;replication;CQRS;event sourcing;saga;transactional outbox;CDC;consistent hashing;leader election;distributed lock;materialized view;fan-out-on-write;fan-out-on-read',
 'interview-method':'functional;non-functional;requirement;scale estimation;API;data model;architecture;critical request;flow;bottleneck;scale;failure;consistency;trade-off;100M',
 'practice-designs':'URL shortener;Pastebin;rate limiter;notification;chat;WhatsApp;news feed;Dropbox;Google Drive;autocomplete;ticket;payment;Uber;YouTube;Instagram;Google Docs;metrics;logging;distributed job scheduler;Kafka;distributed cache;Redis;database'
}
aliases={
 'strong consistency':'linearizability','non-clustered':'nonclustered','query execution':'execution plan','secondary index':'secondary indexes','partition tolerance':'partition tolerant','distributed lock':'lock service','inter-service':'service-to-service','rate limit':'rate limiting','failure detection':'failure detector','at-most-once':'at most once','at-least-once':'at least once','exactly-once':'exactly once','retry':'retri','I/O-bound':'IO-bound','in-process':'in process','distributed cache':'shared cache','buffer cache':'buffer pool','single point':'single point of failure','RTO':'recovery time objective','RPO':'recovery point objective','unavailable':'outage','5 GB':'5,000,000,000','TF-IDF':'TF IDF','indexing pipeline':'indexing path','connection management':'connection ownership','encryption at rest':'at rest','encryption in transit':'in transit','request ID':'request identifier','DB connection':'database connection','scale estimation':'scale estimate','critical request':'critical flow','100M':'100,000,000','access pattern':'access-pattern','leader/follower':'leader follower','fan-out-on-write':'fan out on write','fan-out-on-read':'fan out on read'}
def norm(s):return re.sub(r'[^a-z0-9+]+',' ',s.lower()).strip()
rows=[];missing=[]
for slug,topics in groups.items():
 folder=ROOT/'src/content/system-design'/slug
 files=sorted(folder.glob('*.md'))
 for topic in topics.split(';'):
  needles=[norm(topic)]
  if topic in aliases:needles.append(norm(aliases[topic]))
  location=None
  for f in files:
   if f.name=='_front.md' or f.name=='99-interview.md':continue
   lines=f.read_text().splitlines();heading='Front matter'
   for i,line in enumerate(lines,1):
    if line.startswith('## '):heading=line[3:]
    if any(n in norm(line) for n in needles):
     location={'file':str(f.relative_to(ROOT)),'line':i,'section':heading};break
   if location:break
  row={'unit':slug,'topic':topic,'location':location};rows.append(row)
  if not location:missing.append(f'{slug}: {topic}')
output={'syllabus':'sysdzn.md','topics':rows,'missingTextualMatches':missing,'note':'Matches inventory textual coverage. They do not replace the independent mechanism and depth review.'}
(ROOT/'scripts/system-design/coverage.json').write_text(json.dumps(output,indent=2)+'\n')
print(f'{len(rows)} syllabus topics; {len(missing)} need location review.')
for m in missing:print(m)

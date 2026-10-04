@part I | DNS, TCP and UDP | We follow a score request to the server that owns it. A name alone cannot deliver a packet. We will separate DNS lookup, transport, and the application contract. | where:1

## 1. The first request starts before HTTP

You enter `scores.heron.test/matches/m7` in a browser. The browser cannot send that string directly to an arbitrary machine. It first needs an address, a port, a transport connection, and a way to verify that the endpoint represents the requested name. The page's visible loading time includes that preparation as well as the eventual score read.

The URL separates these decisions. The scheme says which application exchange to use, the host names the service, and the path identifies a resource at that service. **DNS**, the Domain Name System, resolves names into typed records. An address record gives a destination address; it does not contain the score, choose the database query, or establish a connection.

A **client** initiates an exchange, and a **server** accepts it at a defined endpoint. Those are roles, not permanent machine identities. Heron's application is a server to the browser and a client to its database. Keeping the roles local to each exchange helps explain which side owns a timeout, sends an acknowledgement, or holds a waiting connection.

@fig sd_networking_url_decisions | Illustrative URL decomposition. Name lookup, connection setup, and resource lookup are different work.

### The first useful distinction

A browser may already have an address cached or a suitable live connection. In that case it can skip some preparation. If the cache is empty and no connection exists, the cold request pays more work. That is why two users can read the same score from the same application code and observe different latency.

A successful name lookup proves only that the resolver returned records. The chosen address may be unreachable, point to an old deployment, or accept a connection that later fails verification. We will follow each boundary separately rather than calling the entire preparation step 'the network.'

:::note The namespace is illustrative
The `.test` name is a teaching name. None of the addresses or timing values in this chapter describe a live Heron deployment. Literal identifiers such as `m7` name example records, not measured counts.
:::

## 2. A DNS lookup, message by message

Suppose the browser has no cached answer. A **stub resolver** is the small resolver on the client that asks a configured **recursive resolver** to find an answer. A recursive resolver performs the lookup work on the client's behalf. The recursive resolver may already have a suitable cached record and answer immediately.

If it has no relevant cache, the recursive resolver asks a root server where to find the requested top-level domain's authority. It then asks a top-level-domain server where the named zone's authority lives, and finally asks an **authoritative server**, which serves that zone's records. These intermediate answers are referrals. They point toward the answer rather than supplying the application response.

For an illustrative fresh lookup, count one client-to-recursive request, then three recursive-to-authority request/response exchanges: root, top-level domain, and zone authority. That is four logical request/response exchanges. This simplified count omits address lookups for name servers, aliases, retries, DNSSEC work, and transport setup. It explains the dependency order rather than promising an exact packet count.

@fig sd_networking_dns_sequence | Illustrative uncached lookup with four logical request/response exchanges. Referrals are followed by the recursive resolver.

@fig sd_dns_path | A cached record can end the walk before all authority levels are contacted.

### Aliases and record types

An `A` record maps a name to an IPv4 address, while `AAAA` maps it to IPv6. A `CNAME` gives an alias to another name, which may require another resolution step. The browser and network can choose among returned addresses using their own connection policy. One name therefore need not identify one permanent machine.

The record's owner and type matter. A cache can hold the name-server referral even when it has no final address. On the next lookup, the resolver can start closer to the zone authority. The root is not contacted for every page view; it is contacted when the lookup needs information not already available from a suitable cache.

:::story Picture this
A receptionist can give you the department's room number or tell you which building's receptionist maintains that directory. The second answer is a referral. Following referrals finds the room, but nobody in that chain delivers the document you came to collect.
:::

## 3. TTL, expiry, and deployment changes

Heron moves the score service to another address. The authoritative DNS record changes, but a viewer's recursive resolver still has the old record. A **TTL**, or time to live, limits how long that cached record can be reused under the resolver's caching rules. It is not a broadcast that erases all caches when the authority changes.

Use an illustrative timeline. The resolver caches the old address at time 0 with a 60 s TTL. The authority changes the address at time 20. A lookup at time 30 can still use the old address because only 30 s of its cached lifetime have elapsed. A lookup at time 61 needs a refreshed answer under this simplified expiry policy. The computed remaining cache lifetime at the authority change is 40 s.

@fig sd_networking_dns_expiry | Illustrative seconds from initial caching. The address can stay cached after the authority changes it.

Lowering the TTL immediately before the change does not shorten a previously cached record's original lifetime. To influence caches before a scheduled migration, publish the shorter lifetime early enough for earlier answers to expire. Keep the old endpoint serving during the overlap. A rollback also has a cache propagation window.

### Connections have their own lifetime

Even a refreshed resolver cannot move a connection that is already established. A WebSocket can continue exchanging data with the old gateway while new connections use the new address. DNS expiry and connection draining are separate mechanisms. Heron needs a plan for both if the old process must disappear.

Long cache lifetimes reduce lookup work and can help during an authority outage. Short lifetimes permit quicker endpoint changes but increase refresh traffic and dependency on the resolver path. Choose the lifetime using the deployment and failure contract, not a blanket rule that smaller is always better.

:::warn Watch out
Do not shut down the old endpoint merely because the authoritative record now names the new one. Cached answers and existing connections can still reach the old endpoint. Observe and drain those paths before removal.
:::

## 4. A timeout does not identify the failed component

The browser receives no answer and eventually reports a loading failure. That observation could mean a resolver timeout, an unreachable address, a refused connection, failed certificate verification, or an application that accepted the request and never replied. The user sees one symptom, but the corrective action differs at each boundary.

A **round-trip time**, or **RTT**, is the elapsed time for a message to travel to a peer and for a response to return. RTT differs from application execution time. A distant server can answer a trivial query slowly because of transit; a nearby server can answer slowly because it waited on a lock. Measure those costs separately before proposing a larger machine.

For the simplified lookup above, four serial exchanges at an assumed 10 ms RTT each contribute 40 ms. That computation deliberately treats each exchange's RTT as the same illustrative value and omits processing and setup. It shows why a cold dependency chain adds delays even when each participant does little local work.

@fig sd_networking_lookup_budget | Illustrative serial lookup budget: four assumed 10 ms exchanges sum to 40 ms.

:::interview Interview lens
**"A DNS migration completed but some clients still reach the old server. Why?"** Some resolvers can still reuse an earlier answer until its lifetime expires, and established connections do not consult DNS again for every message. I would keep the old endpoint available, inspect cached-answer age, and drain connections under a separate policy. Changing the record is one step in the migration, not evidence that every path has moved.
:::

## 5. TCP delivers bytes, not application messages

The browser now has a suitable address and opens a connection. **TCP** presents a reliable, ordered byte stream while the connection operates. A stream means the receiver sees bytes in sequence, without preserved boundaries matching each sender write. Sending `hello` in one write does not promise one corresponding receiver read.

TCP assigns sequence positions to bytes and uses acknowledgements to learn what the receiver has accepted. Missing data can be retransmitted; duplicate data does not become a second piece of the delivered stream. The receiver may buffer later bytes while waiting for a gap. Flow control limits what the receiver can accept, while congestion control adjusts sending to the network path's conditions.

Use a tiny illustrative message stream. The application encodes `A`, `B`, and `C` as three sequential units. The unit carrying `B` is lost, while `A` and `C` arrive. TCP can deliver `A`, but it must not deliver `C` ahead of the missing bytes if the application expects ordered stream delivery. After retransmitted `B` arrives, delivery can continue with `B` and `C`.

@fig sd_transport_order | Illustrative loss of the middle unit. TCP buffers later bytes behind the missing sequence range.

### Framing belongs above the byte stream

Heron must know where one request or event ends. HTTP framing, a length prefix, or a defined delimiter can provide that boundary. A parser must handle a header split across reads, several messages arriving in one read, and a peer ending the stream mid-message. Treating each read as one message is a common implementation error.

A completed transport send still does not prove that the application committed the score. The receiving process can accept bytes, parse them, begin a transaction, and crash before commit. Or it can commit and lose the reply. Durable operation identity will later let us resolve that uncertainty.

## 6. UDP and application-owned recovery

A live video decoder may prefer a newer frame to a late fragment of an old one. **UDP** sends separate datagrams without a delivery or ordering guarantee from the transport. Each received datagram preserves its own boundary, but a datagram can be missing, duplicated, or reordered. The application must decide which of those events matter.

Suppose Heron sends illustrative updates with sequence labels A, B, and C. If B disappears and C arrives, a datagram application can choose to display C as the latest replaceable snapshot. That choice is valid only if the update is a self-contained snapshot. If C means 'add another point,' skipping B can create an incorrect score.

@fig sd_networking_datagram_effect | A missing snapshot can be replaced by a newer snapshot; a missing delta needs recovery. Labels are illustrative events.

UDP does not mean 'there can be no reliability.' QUIC builds secure connections, ordered streams, loss recovery, and congestion control over UDP. The transport substrate and the application's exposed guarantee are separate questions. Choosing UDP is useful only with a clear plan for the behavior the application needs.

:::key In one breath
DNS turns a name into records through cached answers and referrals. TTL bounds cached reuse, while established connections follow their own lifetime. TCP provides ordered bytes and requires application framing; UDP provides datagrams and leaves recovery semantics above it. Neither transport proves that a remote business operation committed.
:::

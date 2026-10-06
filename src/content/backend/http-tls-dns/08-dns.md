@part VIII | DNS for backend engineers | We look at DNS from the side of the people who run services behind it. Every request starts with a lookup, and DNS caching decides how fast you can move traffic, fail over, or recover from a bad change. We will read the record types, follow a recursive resolution, work through TTLs and caching, use DNS for routing, and plan a safe IP migration. | where:8

## 29. DNS record types

The Wren app knows a name, `api.wren.example`, and needs an IP address to connect to. **DNS** (Domain Name System) is the distributed database that maps names to records. It is split into **zones**, slices that one operator controls. Wren controls `wren.example` and edits it through a DNS provider. Each record has a name, a type, a TTL and a value, and the type decides what question the record answers.

**A** maps a name to an IPv4 address, and **AAAA** maps it to an IPv6 address. Wren publishes both, and clients that support IPv6 try it first and fall back to IPv4 within a few hundred milliseconds, a race called Happy Eyeballs. **CNAME** makes a name an alias for another name. `www.wren.example` is a CNAME to `wren.cdn.example`, so it follows the CDN's addresses whenever the CDN changes them. A CNAME must be the only record at its name, and the zone apex, `wren.example` itself, must also hold NS and SOA records. So the apex cannot be a CNAME, which is why providers offer non-standard ALIAS or ANAME records that resolve the target on their side and return plain A records.

**MX** names the mail servers for the domain, each with a priority number, where lower means preferred. **TXT** holds free text. Mail uses it for SPF and DMARC policies, and CAs and cloud providers use it for domain ownership checks. **NS** names the authoritative servers for the zone, and the parent zone holds a matching delegation. **SRV** gives the host and port of a named service, as in `_grpc._tcp.orders.wren.example` pointing at port 8443, which some service discovery systems and protocols such as SIP and XMPP use. Newer **HTTPS** records can also advertise that a host supports HTTP/3.

@fig be_dns_records | Wren's zone. Each record type answers a different question about the same domain.

:::story Picture this
A company switchboard directory. Some entries give a direct extension (A records). Some say "ask for the front desk instead" (CNAME). One says where to deliver parcels (MX), and one notice on the wall says which receptionists are allowed to answer for the company at all (NS).
:::

## 30. Resolvers, caching and TTL

A lookup involves two kinds of server. A **recursive resolver** does the work on behalf of clients and caches what it learns. Your ISP runs one, your company runs one, and public ones such as 1.1.1.1 and 8.8.8.8 serve millions of users. An **authoritative server** holds a zone and gives definitive answers for it. On a cold cache, the resolver asks a root server, which replies "ask the `.example` servers". The `.example` top-level-domain servers reply "ask `ns1.dns.example`". That authoritative server finally answers `A 203.0.113.10` with a TTL of 300 seconds. The app's own stub resolver only ever talks to the recursive resolver, and the recursive resolver caches each referral, so the root is rarely asked twice in a day.

@fig be_dns_resolution | A cold lookup takes three referrals. A warm one is answered from the resolver's cache in about a millisecond.

Every record carries a **TTL** (time to live) in seconds, and every cache on the path may keep the answer that long. The browser, the operating system and the recursive resolver each hold their own copy. Each cache counts down from the moment it fetched the record, so at any moment different users hold copies with different time left. With a 300-second TTL, a change you make now reaches a user anywhere between 0 and 300 seconds later, depending on when their caches last asked.

**Negative caching** stores "no such name" answers too. The duration comes from the zone's SOA record. If someone mistypes a record, deletes it and adds the right one, resolvers that saw the "does not exist" answer keep returning it until the negative TTL runs out. What people call **DNS propagation** is not a push from your provider to the world. It is old answers expiring from caches you do not control.

@fig be_dns_ttl | Three caches, three clocks. A change becomes visible to a user only when every cache on their path expires.

:::warn Watch out
Long-running programs often resolve a name once and keep the address forever. Older JVMs cached successful lookups indefinitely under a security manager, and many connection pools never re-resolve. After a failover these clients keep calling the old IP long after the TTL has passed. Configure the runtime's DNS cache to respect TTLs, and recycle pooled connections periodically.
:::

## 31. DNS for routing and failover

The authoritative server chooses its answer per query, so DNS can steer traffic. **Weighted routing** answers 90% of queries with the v1 pool and 10% with v2, which gives a coarse canary. **Geographic** or latency-based routing answers by where the resolver sits, sending Indian users to a Mumbai region and European users to Frankfurt. **Failover routing** answers with a standby address when health checks on the primary fail. Managed DNS services such as Amazon Route 53, Google Cloud DNS and Cloudflare offer all three. Inside a data centre, service discovery uses the same idea at much shorter TTLs, which Unit XI covers.

@fig be_dns_routing | Three routing policies at the authoritative server. All of them work only as fast as caches expire.

DNS routing has two limits. First, it sees the recursive resolver's address, not the user's. A user in Chennai on a public resolver whose nearest instance is in Singapore may get the Singapore answer. Resolvers that send the EDNS Client Subnet extension pass a truncated user address to fix this, at some cost to privacy. Second, every policy change waits for TTLs. That is why DNS failover is measured in minutes, while a load balancer in front of servers can fail over in seconds. Many large services also use anycast, announcing the same IP address from many locations so that internet routing, not DNS, picks the nearest one.

:::interview Interview lens
**"What happens when you change an IP but clients still have the old DNS record cached?"** They keep connecting to the old IP until their caches expire. With a 300-second TTL that takes up to five minutes after each cache last fetched the record, and some clients take much longer because they ignore TTLs or hold long-lived connections. So the old server must keep serving, or at least redirect, until traffic to it falls to zero. Lowering the TTL well before the change shrinks that window.
:::

## 32. A safe DNS migration

Wren is moving `api.wren.example` from 203.0.113.10 to a new load balancer. Changing the A record in one step creates a mixed period of up to 300 seconds while caches still hold the old answer, followed by a long tail of clients that ignore TTLs. The safe sequence has four steps. First, lower the TTL from 300 to 60 seconds. Second, wait at least the old TTL, 300 seconds, so that every cache has picked up the record with its short TTL. Third, change the A record, after which every TTL-respecting cache converges within 60 seconds. Fourth, keep the old server running and watch its traffic until it drops to zero, then decommission it.

@fig be_dns_stale | Lower the TTL, wait out the old one, change the record, then drain the old address.

The waiting step is the one people skip. If you lower the TTL and change the address in the same minute, a cache that fetched the record just before still holds the old address with up to 300 seconds left, and the short TTL did nothing for it. Watching the old server matters because some clients never re-resolve: embedded devices, old Java services, partners with hard-coded IPs. Their requests show up in the old server's access log, which tells you whom to contact.

Short TTLs are not free. Each expiry sends another query to your authoritative servers, and each cache miss adds a lookup delay of tens of milliseconds for some user. Raise the TTL again once the move is complete.

:::note DNS is not a health check
DNS answers say nothing about whether a server is up. A client with a cached address keeps trying a dead server until the TTL ends. Put a load balancer or an anycast address behind the name, so that the IP stays stable while the servers behind it come and go.
:::

:::key In one breath
DNS maps names to records: A and AAAA for addresses, CNAME for aliases, MX for mail, TXT for text, NS for delegation and SRV for service host and port. Recursive resolvers walk the root, top-level and authoritative servers and cache each answer for its TTL, negative answers included, so propagation is really cache expiry. Authoritative servers can route by weight, geography or health, but every change waits for caches. To migrate, lower the TTL, wait out the old one, change the record and keep the old server up until its traffic stops.
:::

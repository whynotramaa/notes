@part IV | Consistent hashing and sticky sessions | Some requests benefit from returning to the same owner. A fixed owner also concentrates demand and creates a state recovery obligation. We will measure hash remapping, build a consistent ring, and separate preferred routing from durable session state. | where:4

## 14. Consistent hashing

Heron caches match data across four owners and adds a fifth. A simple `hash(key) % owner_count` changes the divisor. Many keys move even though only one owner was added, creating cold caches and a refill surge.

**Consistent hashing** maps keys and owner positions into the same ordered hash space. A key belongs to the first owner encountered clockwise, wrapping to the beginning if necessary. Adding a position changes only the interval that now ends at that position. The mechanism preserves the unaffected intervals rather than computing a new remainder for every key.

Our illustrative ring places A at 10, B at 30, C at 60 and D at 90. Keys at 5, 20, 45, 70 and 95 belong to A, B, C, D and A. Add E at 50. Only key 45 changes owner, moving from C to E; the others retain their assignments. The observed moved fraction is $1/5=0.2$, or 20 percent for this fixed sample.

@fig sd_tr_ring | Illustrative ring insertion at 50 transfers the interval after 30 through 50 from C to E. Orange marks that new interval and its key at 45.

For integer keys 0 through 11, changing modulo from 4 to 5 changes owners for keys 4 through 11. That is $8/12=2/3$ of this different declared sample. Read the fractions as counted moved keys divided by sampled keys. Neither finite example proves a production movement rate. Under uniform distribution and equal ownership, the ideal new-owner fraction is one fifth; real token placement and traffic can differ.

@fig sd_tr_modulo | Illustrative modulo comparison for twelve fixed keys. Orange marks the eight assignments that change when the divisor becomes five.

The hash ring does not copy data. A cache may tolerate a miss at the new owner, while a durable shard must migrate records and coordinate reads and writes. That is why consistent hashing is a routing tool rather than a complete storage migration algorithm. The storage and scaling units cover the extra ownership protocol.

:::story Picture this
A circular street has four delivery depots. Each house uses the next depot clockwise. Opening a depot between two existing depots transfers only the houses on that stretch of street. The new directory tells drivers where to go, but someone still has to move the stored parcels.
:::

## 15. Virtual nodes, weights and hot keys

The ring's physical owners are unevenly spaced. One gets a large interval and another a small one. A hash function spreads keys through positions; it does not force a handful of owner positions to divide the space evenly.

A **virtual node** is an additional logical position assigned to a physical owner. Giving each owner several positions makes its share the sum of several smaller intervals. A larger-capacity owner can receive more positions, although its actual demand must still be measured. Positions and endpoint identity belong to a versioned routing configuration so different routers agree on the mapping.

Heron's illustrative sticky demand split is 70, 10, 10 and 10 percent over four owners. At 1,000 requests per second, loads are 700, 100, 100 and 100. Equal key counts would not fix that traffic distribution if one match causes most requests. Read each load as the total rate multiplied by that owner's demand share. A 300-per-second server receiving 700 is overloaded even while others are underused.

@fig sd_tr_hot | Illustrative uneven demand sends 700 requests per second to one owner. Orange marks the hot owner; balanced key counts do not establish balanced traffic.

More virtual nodes can smooth uneven hash-space ownership. They cannot split a single hot key if the policy requires that key to stay together. Replicated cache reads, a separate hot-key route or a finer business key can help, but each changes the mechanism. A ledger key needing ordered writes cannot simply be scattered without an ordering protocol.

Membership changes also create disagreement during configuration rollout. If two routers use different ring versions, the same key can temporarily reach two owners. For disposable caches this creates duplication and cold misses. For stateful authority it can create conflicting writes. Treat ring version and transfer fencing as explicit state when correctness depends on exclusive ownership.

:::note Key balance and demand balance
A uniform hash spreads distinct keys under its model. A popular key can still receive most requests. Measure traffic and cost per destination as well as the number of keys assigned there.
:::

## 16. Sticky sessions

A user logs in through application A, which stores the session only in its own RAM. The next request reaches B and appears logged out. **Sticky sessions** prefer the same backend for related requests, commonly through a cookie, source-derived key or explicit routing identifier.

The router derives the affinity key, consults or computes its owner, filters that owner through eligibility rules, then forwards. A cookie-based owner label needs integrity protection if callers could otherwise choose a backend or avoid a rollout policy. Source-IP affinity groups users behind shared NAT and changes when a client's network changes. A transport address is therefore not a reliable user identifier.

With the illustrative 70-percent affinity share from Section 15, A receives $1000\times0.7=700$ requests per second. The affinity rule wins over equal-share balancing unless a fallback policy deliberately overrides it. Read that number as the work concentrated by preference. Affinity improves locality but can defeat the load signal the balancer would otherwise use.

@fig sd_tr_sticky | A preferred backend is checked for eligibility before forwarding. Orange marks fallback when that backend fails; durable session state must be available there.

The login example's actual fix is durable or shared session state, or a validated self-contained credential with its own revocation rules. Affinity can then be an optimization rather than the only reason login works. If the owner disappears, another server reconstructs state from the authorized source instead of treating routing as a backup mechanism.

Sticky routing also complicates deployment. A candidate version selected per user may require compatible shared data and cookies throughout the rollout. Removing affinity to balance load can break a version-specific local session. State compatibility, owner failure and overload fallback must be part of the route's contract before calling the service stateless.

:::warn Watch out
A sticky cookie is a preference, not a backup of the session. If losing one process loses authenticated state or accepted work, balancing has hidden a durability problem. Make the fallback read the required state from a surviving authority.
:::

## 17. Affinity, failover and reconnect recovery

A gateway holding 10,000 Heron viewers fails. Affinity still points at it, but health removes it from eligibility. The router must decide whether to reject, choose another endpoint or wait for the preferred owner to recover.

A **fallback policy** states what happens when the preferred route cannot serve. For score reads, another healthy application can read authorized state from the database. For a live socket, the client reconnects and resumes delivery from a cursor. For a shard owning ordered writes, a new route needs the ownership transfer and fencing contract; it cannot simply pick any healthy server.

Five nominal gateways are insufficient under one loss, as Section 5 computed. Six leave five survivors, each at $50000/5=10{,}000$ connections, exactly the illustrative limit. Seven leave six survivors, each at $50000/6=8{,}333.333333$ after rounding. Read these as viewer demand divided by surviving gateways under equal reassignment, excluding handshake and replay overhead.

@fig sd_tr_affinity_failure | Illustrative gateway capacity after losing one endpoint. Orange marks six survivors from a seven-gateway fleet, leaving room below the connection limit.

Capacity is necessary but not sufficient. Reconnects need state lookup, authentication and replay; the normal live workload continues throughout. The 200,000,000 bytes of replay from Section 8, spread over 20 seconds, add $200000000/20=10{,}000{,}000$ payload bytes per second to the normal 200,000,000. Total modeled output is 210,000,000 payload bytes per second before protocol overhead.

A cursor also needs a clear scope. A global event offset cannot automatically describe independent partition histories. A snapshot followed by partition-specific positions may be the correct resume contract. Routing restores transport reachability; retained data and sequence rules restore application meaning. We return to this distinction during regional takeover in Part VII.

:::interview Interview lens
**"When would you use sticky sessions?"** I use them for locality or a protocol that benefits from a preferred owner, after defining what happens when that owner fails. Session durability and authorization must survive elsewhere. I also inspect demand skew because affinity can concentrate a hot user or match beyond one server's capacity.
:::

:::key In one breath
Consistent hashing limits assignment changes to affected hash intervals, but data movement requires another protocol. Virtual nodes smooth owner ranges while hot keys can still dominate demand. Sticky sessions prefer an owner and need an explicit eligibility and fallback rule. Durable state, reconnect cursors and survivor capacity make that fallback meaningful.
:::

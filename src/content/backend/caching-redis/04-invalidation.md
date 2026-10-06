@part IV | Invalidation and consistency | We keep the cache's copy honest when the source changes. Phil Karlton's joke that cache invalidation is one of the two hard things in computer science is a joke because it is true. We will cover the four ways to invalidate, the races that undo them and how leases and versions close those races, and negative caching, warming and staleness budgets. | where:4

## 10. Four ways to invalidate

Every cached copy eventually differs from its source. **Cache invalidation** is how a system notices and stops serving the old copy. Wren uses four techniques, often together.

The first is the TTL from Part III. Wait long enough and the entry disappears. It needs no code at the writer and catches every kind of change, including ones made by tools nobody remembered. Its weakness is that staleness lasts up to the full TTL.

The second is **delete on write**. The code that changes the database deletes the affected keys after the commit, as in cache-aside. Staleness drops to milliseconds in the normal case. Its weaknesses are that every writer must know which keys depend on the data it changed, and a write from anywhere that skips the delete, a migration, a support script, a second service, leaves stale data until the TTL. Dependencies are the harder half. Changing the price of one biryani affects `menu:9`, the search results that include it, and perhaps a "popular dishes" list. Missing one key is a common bug.

@fig be_cache_invalidation | TTL, delete on write, versioned keys and change events. Most systems combine two or three.

The third is a **versioned key**. Instead of deleting, the writer bumps a version number stored with the source, and readers include the version in the key. Restaurant 9's row has `menu_version = 41`, readers use `menu:9:v41`, and when the menu changes the transaction sets the version to 42. Every reader after the commit asks for `menu:9:v42`, misses once and loads the new menu. The old entry is never read again and expires by TTL.

@fig be_cache_versioned | Bump the version and the old entry becomes an orphan. A late SET lands on a name nobody reads.

Versioned keys remove the delete-and-race problem, because a slow reader that loaded old data writes it under the old version's name. They also make bulk invalidation trivial. Bumping a single version can invalidate a whole family of keys that include it. The cost is one lookup for the current version, which is small and often cached itself for a second. The same idea at the edge is the fingerprinted asset URL from Part IX.

The fourth technique drives deletes from the database's own change log, the subject of the next section.

## 11. Change events and closing the races

A delete in application code depends on every writer remembering. Wren's catalogue service, its admin tool and a nightly price-import script all change menus, and the script was written by someone who never heard of Redis. **Event-driven invalidation** moves the responsibility to the database. A **change data capture** reader, such as Debezium, follows PostgreSQL's write-ahead log and publishes each committed change to a stream such as a Kafka topic. An invalidator service consumes the stream and deletes or refreshes the affected keys.

@fig be_cache_cdc | The WAL feeds a stream, and an invalidator turns each change into deletes.

This catches every writer, because every write goes through the database. It is ordered, because the log is ordered, so a later change is never undone by an earlier delete arriving late. And it decouples writers from caches, since the catalogue service no longer needs to know which keys exist. The costs are a pipeline to run, Unit VIII covers change data capture in depth, and a delay of tens to hundreds of milliseconds between commit and invalidation. Wren uses it for menus and restaurant data, and keeps direct deletes for user-facing writes where the delay would be noticed.

Two races remain even with good invalidation. The first is the stale SET from Part II, a reader that loaded old data before the write and stores it after the delete. Three fixes exist. Versioned keys make the late SET land on an orphaned name. Leases, as at Facebook, give each miss a token that a delete invalidates, so the late SET is rejected. And a **delayed double delete** deletes the key at commit and again a short time later, say 500 ms, to catch any SET that slipped in between. The last is a heuristic, not a guarantee, and Wren prefers versions.

The second race is replication. If invalidation deletes from the Redis primary and a reader reads from a replica that has not yet applied the delete, the reader sees old data. Reading cache keys from the primary, or tolerating that small window, are the only choices.

The deeper point is that a cache can never be strongly consistent with its source without coordinating every write, which would cost more than the cache saves. The design goal is bounded staleness. Wren writes down, per kind of data, how stale a read may be in the worst case and which mechanism enforces it.

## 12. Negative caching, warming and staleness budgets

Not every lookup finds something. Wren's apps request `GET /orders/999` for orders that were deleted, restaurants that closed, or promo codes users typed wrongly. Cache-aside caches only values that exist, so every such request misses Redis and queries the database. **Negative caching** stores the fact that something does not exist. On a database miss, Wren writes a special marker, `SET order:999 "∅" EX 30`, and later lookups return 404 straight from Redis.

@fig be_cache_negative | The database said "not found" once. Redis says it for the next 30 s.

Negative entries need short TTLs and care at creation time. If order 999 is created a second later, the marker would hide it for up to 30 s, so the creation path deletes any negative marker for the new key. Negative caching also defends against the cache penetration attack in Part V, where an attacker requests millions of ids that do not exist.

A cache that starts empty is a **cold cache**, and every early request misses. After a Redis failover to an empty replica, a new cluster or a key format change in a deploy, the database briefly takes the full load. **Cache warming** fills the cache before traffic arrives. Wren warms by loading the 10,000 most-read keys from the previous day, identified from access logs, before shifting traffic to a new Redis cluster. With that done, the hit ratio starts near 86% instead of zero.

@fig be_cache_warming | Illustrative. A cold cache climbs slowly while the database takes the misses. A warmed one starts near its usual level.

Warming has a cost of its own. Loading 10,000 keys at full speed is itself a burst of 10,000 database reads, so warmers run with rate limits and jittered TTLs. Many teams prefer to shift traffic gradually instead, sending 1%, then 10%, then everything to the new cache, which warms it naturally without a spike.

Each cached kind of data in Wren carries a **staleness budget**, a sentence a product owner has agreed to. Menus may be up to 5 minutes stale in the worst case and are normally fresh within a second through change events. Restaurant open or closed status may be 60 s stale. Order status may be 5 s stale. Payment status is never cached. Writing the budget down turns arguments about caching into simple checks against a number.

:::story Picture this
A newspaper office with a board of headlines for the receptionist. Some editors remember to update the board when a story changes, some do not, and the board gets wiped every evening anyway. A better office prints a version number on each story, so an old headline can be spotted at a glance, and has the printing press send a slip to the receptionist every time a story is reprinted.
:::

:::note Write the invalidation map
For each cached key family, list the source tables, the events that change them and the mechanism that invalidates. Menus come from `menus`, `menu_items` and `restaurants`. Price edits, item changes and restaurant renames invalidate through change events and the version column. Reviewing that map catches missing dependencies before they become support tickets.
:::

:::warn Watch out
Invalidate after the database transaction commits, never before or inside it. Deleting before commit lets a reader reload the old value before the new one is visible, and if the transaction rolls back, the delete was pointless but harmless. Deleting after commit, plus a TTL, is the safe order.
:::

:::interview Interview lens
**"How do you keep a cache consistent with the database?"** Accept bounded staleness and enforce it. Give every key a TTL equal to the worst-case tolerance. Delete keys after the database commit, or better, use versioned keys so a late write from a slow reader lands on an orphaned name. For data changed by many writers, drive invalidation from the database's change stream so nothing is missed. Close the stale-set race with versions or leases, cache negative results briefly, and warm or ramp traffic onto new caches.
:::

:::key In one breath
Invalidation combines TTLs, which catch everything slowly, deletes after commit, which are fast but rely on every writer, versioned keys, which make late writes land on orphaned names, and change events from the WAL, which catch every writer in order. The stale-set race is closed with versions, leases or a delayed second delete, and replica reads add their own small window. Negative caching stores "not found" for 30 s, warming or gradual ramps avoid cold-cache spikes, and every cached kind of data gets a written staleness budget.
:::

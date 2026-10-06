@part II | Caching patterns | We look at the five standard ways to arrange reads and writes between an application, a cache and a database. Each pattern answers who loads a miss, who writes the cache, and what happens to a write if something crashes halfway. We will cover cache-aside and its race, read-through and write-through, and write-behind and write-around. | where:2

## 4. Cache-aside

**Cache-aside**, also called lazy loading, is the pattern most backends use, and Wren's menu endpoint is a textbook case. The application asks Redis for `menu:9`. On a hit it returns the value. On a miss it loads the menu from PostgreSQL, writes it to Redis with a TTL, and returns it. When the menu changes, the code that updates the database also deletes `menu:9`, so the next read loads the new version.

@fig be_cache_aside | Check, load, fill. The cache is a passive store and the application does everything.

The pattern's strengths come from its simplicity. Only data that someone actually reads ends up in the cache, so memory holds the working set and nothing else. If Redis is down, the application can fall back to the database, slower but still correct. And the cache needs no knowledge of the database, so any store can sit behind it.

Its weaknesses are just as concrete. Every miss costs three steps, the failed GET, the load and the SET, so a cold cache is slower than no cache. Each piece of code that reads must remember the pattern, which is why teams wrap it in one helper. And there is a race. A reader misses and loads tip 20 from the database, but before it writes to Redis, a writer updates the tip to 30 and deletes the key. The reader's delayed SET then puts 20 back into the cache, where it stays until the TTL expires.

@fig be_cache_aside_race | The delete came before the stale SET, so the old value survives for the whole TTL.

The race needs a slow reader and a write in a narrow window, so it is rare, and that is exactly what makes it dangerous, because it is nearly impossible to reproduce. Three defences exist. A short TTL bounds how long the stale value lives. Deleting on write is better than updating on write, because two concurrent updaters can write to the cache in the opposite order from the database. And for data where the race matters, Part IV shows versioned keys and leases that close the window entirely.

Why delete and not update? If the writer sets the new value in the cache, two writers that update the database in the order A then B might update the cache in the order B then A, leaving A's older value cached. A delete has no ordering problem, since the next reader fetches whatever the database holds.

## 5. Read-through and write-through

In **read-through** caching, the application talks only to the cache, and the cache knows how to load a miss itself. The application calls `cache.get("menu:9")`, and on a miss the cache library calls a loader function that queries the database, stores the result and returns it. Local cache libraries such as Caffeine and Guava work this way, and so does a CDN, which fetches from the origin on a miss without the client doing anything.

@fig be_cache_read_through | The loader lives inside the cache. The application never sees a miss.

The benefit is that loading logic lives in one place, so every caller gets the same behaviour, and the library can add features such as coalescing concurrent misses for the same key, which Part V shows is the cure for stampedes. The cost is coupling. The cache now depends on the database, and for a distributed cache like Redis there is no built-in loader, so read-through usually means a local library or a wrapper the team writes.

**Write-through** handles the other direction. Every write goes to both the cache and the database before the application acknowledges it. When restaurant 9's owner changes the price of biryani, the service updates PostgreSQL and then sets the new menu in Redis, and only then replies. The cache is always warm for anything recently written, so the next read is a hit and never sees old data in the normal case.

@fig be_cache_write_through | Both writes before the reply. Reads that follow are always hits.

Write-through has two costs. Every write pays both latencies. And it fills the cache with data that may never be read, which matters when writes are frequent and reads of the same data rare, such as Wren's order status updates. The two writes are also not atomic. If the process dies after the database write and before the cache write, the cache holds the old value. Write-through therefore still needs a TTL as a safety net. In practice it is usually combined with read-through, so that the cache is filled on writes and on misses alike, and it fits data that is read soon after it is written, such as a user's own profile after they edit it.

## 6. Write-behind and write-around

**Write-behind**, also called write-back, acknowledges a write once it is in the cache and writes it to the database later, often in batches. Wren could use it for view counters. Each time someone views restaurant 9, the service increments a counter in Redis, and a job writes the totals to PostgreSQL every minute. Thousands of increments become one `UPDATE` per restaurant per minute.

@fig be_cache_write_behind | Writes pile up in the cache and flush in batches. A crash in between loses them.

Write-behind gives the fastest writes and absorbs bursts that would overwhelm the database. The cost is durability. Anything acknowledged but not yet flushed is lost if the cache crashes, so write-behind fits only data where small losses are acceptable, such as counters, analytics and presence. It also makes the database lag behind reality, so anyone reading the database directly sees old values. For orders, payments and anything a customer would notice, write-behind is the wrong choice.

**Write-around** writes only to the database and leaves the cache alone, apart from deleting the affected key. The next read misses and loads the new value. This is the write side of cache-aside and the right default when written data is not read immediately, so filling the cache would waste memory. Wren's order status changes use write-around. The kitchen updates the status many times, and the customer's app reads it every few seconds, so the cache is refilled by readers when they need it.

@fig be_cache_write_around | Write the database, delete the key, and let the next reader fill the cache.

Most real systems combine a read pattern and a write pattern per kind of data. Wren uses cache-aside with write-around for menus and orders, write-through for user profiles, and write-behind for view counters. The figure below sets the five side by side.

@fig be_cache_patterns_map | Who talks to the database and when. Write-behind alone can lose acknowledged writes.

The choice for each kind of data comes down to three questions. How soon after a write will it be read? How bad is a stale read? How bad is a lost write? Answer those and the pattern usually follows.

:::story Picture this
Five ways to keep a family's shopping list on the fridge in sync with the pantry. Cache-aside is checking the list, and if an item is missing, walking to the pantry and writing it down. Read-through is asking a helper who does that for you. Write-through is updating the list and the pantry together every time you buy something. Write-behind is scribbling purchases on a sticky note and updating the pantry log on Sunday, hoping nobody throws the note away. Write-around is updating the pantry log and crossing the item off the fridge list.
:::

:::note Leases at Facebook scale
Facebook's 2013 paper "Scaling Memcache at Facebook" describes **leases** to fix the cache-aside race. On a miss, memcached hands the reader a lease token. A delete invalidates outstanding tokens, and a SET with an invalid token is rejected, so a slow reader can no longer put back a value that a writer has since deleted. The same token rate-limits misses for a key, which also tames stampedes.
:::

:::warn Watch out
Never update the cache before the database commits. If the transaction rolls back, the cache holds a value that never existed, and readers will act on it. Delete or set the cache after the commit succeeds, and accept that a crash between the two leaves a stale entry for one TTL.
:::

:::interview Interview lens
**"Compare cache-aside, write-through and write-behind."** Cache-aside loads on miss in application code and deletes on write, so it caches only what is read and degrades to the database if the cache fails, at the cost of miss latency and a stale-set race. Write-through writes the cache and database together so recent writes are always cached, at the cost of write latency and caching unread data. Write-behind acknowledges after the cache write and flushes later, giving the fastest writes and absorbing bursts, but losing unflushed data on a crash, so it suits counters, not orders.
:::

:::key In one breath
Cache-aside checks Redis, loads misses from the database and deletes keys on write, which is simple and resilient but has a race where a slow reader puts back an old value. Read-through moves loading into the cache, and write-through updates cache and database together so recent writes are always warm. Write-behind acknowledges after the cache write and flushes in batches, fast but lossy, while write-around writes only the database and deletes the key. Choose per kind of data by how soon it is read after writing, how bad stale reads are, and how bad lost writes are.
:::

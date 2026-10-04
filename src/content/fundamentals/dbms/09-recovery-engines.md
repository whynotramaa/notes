@part IX | Recovery and storage engines | An acknowledged transaction must remain meaningful after RAM disappears. Writing data pages immediately is one possible strategy, but it makes every commit pay for scattered storage work. We will build write-ahead logging, recovery, buffer management, LSM write paths and Bloom-filter membership tests. | where:9

## 44. Write-ahead logging and crash boundaries

Ada's reservation commits while its modified inventory page is still in RAM. Power disappears. If the database retained only the page's old disk contents, the successful reservation would vanish. The engine needs durable evidence from which it can reconstruct the admitted change.

**Write-ahead logging**, or WAL, records recovery information before the corresponding changed data page is allowed to reach persistent storage. A **log record** describes an operation with the information needed by the engine's recovery method. A **dirty page** is a cached page changed relative to its backing copy. The central ordering rule is about durable log data preceding durable page data, not merely appending bytes to a userspace buffer.

@fig dbms_wal | A conceptual durable-commit path. A data page may be flushed before or after commit as long as the required WAL is durable first; the diagram shows the useful no-force case.

### Why one ordered log helps

Changing a reservation may touch a heap page and several index pages at different storage locations. Forcing every one to stable storage at every commit can add scattered work. The log can collect a compact ordered recovery record, and several transactions can share a flush through **group commit**. Data pages can be written later according to cache and checkpoint policies.

A **no-force policy** does not require every changed data page to be flushed at commit, so recovery may need **redo** to restore committed work missing from pages. A **steal policy** can flush a page containing uncommitted changes when it needs the frame, so the recovery design must prevent those changes from becoming valid committed state. A conventional undo/redo design needs **undo**; a version-based engine can also use visibility to keep uncommitted versions out of reads. These are engine design choices, not synonyms for WAL itself.

@fig dbms_crash_cases | The failure boundary determines whether recovery must restore a committed effect or exclude unfinished work. Durable recovery information makes the distinction possible.

### Walk through the failure cases

If an update exists only in RAM and no relevant log reached storage, losing it is allowed when the transaction never received a durable commit acknowledgement. If its update log is durable but its commit is not, recovery must not present the unfinished transaction as committed. If the commit is durable but the data page is old, redo reconstructs the missing change. If the page already includes the change, replay must avoid applying an increment twice.

A **log sequence number**, or LSN, orders log positions. A page can record the newest log position already reflected in it, allowing recovery to determine whether a particular redo action is still needed. The recovery operation must be restartable: a second crash halfway through recovery cannot turn the same committed increment into another increment.

A **checkpoint** records a recovery starting boundary and associated durable state so restart need not replay the complete lifetime of the database. Checkpointing can spread writes over time rather than stopping all users for one enormous flush. Old log can be removed only when all relevant recovery, replication and backup obligations permit it, not just because a transaction committed.

:::warn Watch out
Appending WAL to RAM is not durable persistence. A successful operating-system write can also leave bytes in a volatile cache; the engine's flush and storage contract determine durability. PostgreSQL's [asynchronous-commit documentation](https://www.postgresql.org/docs/18/wal-async-commit.html) explicitly describes the different loss boundary when commit acknowledgement does not wait for WAL persistence.
:::

## 45. ARIES: analysis, redo and undo

A crash leaves some committed changes absent from pages and some unfinished changes already present. Recovery needs to identify both classes without guessing from the final page value alone. **ARIES** is a recovery method organized around logged history, page positions and restartable undo.

Its phases are analysis, redo and undo. Analysis reconstructs information about transactions and potentially dirty pages from checkpoint and log state. Redo repeats the relevant logged history, using page state to avoid applying an already-present action again. Undo reverses the remaining unfinished transactions. Repeating history can include changes from transactions that will later be undone; "redo only committed records" is not the general ARIES mechanism.

@fig dbms_aries | Illustrative undo/redo engine. X changes from 100 to 120 under committed T₁; Y changes from 100 to 50 under unfinished T₂. After recovery, X is 120 and Y is 100.

### A small recovery trace

Start with durable pages X=100 and Y=100. The log contains T1's change X=120, T2's change Y=50, and T1's commit. T2 has no commit when the machine crashes. Whether either data page already reached its new value is a separate question; the log establishes the transaction status.

Analysis identifies T1 as committed and T2 as unfinished, along with pages that may need replay. Redo brings the applicable page history to X=120 and Y=50 if those changes are missing. A page whose recorded log position already covers the operation can skip it. Undo reverses T2's Y update to 100 while retaining T1's X update at 120.

A **compensation log record**, or CLR, records the action taken during undo. If recovery crashes again, redo can repeat the compensation safely and undo can continue from the remaining work, rather than reversing the compensation as if it were an ordinary new application change. This is why restartable recovery needs more than "read the log backwards."

### Page policies explain the need for the phases

No-force creates the need to reconstruct committed work not yet forced to data pages. Steal creates the possibility that uncommitted history is already on disk. ARIES coordinates these flexible buffer policies with fine-grained transactional work. The [original ARIES paper](https://research.ibm.com/publications/aries-a-transaction-recovery-method-supporting-fine-granularity-locking-and-partial-rollbacks-using-write-ahead-logging), by C. Mohan and colleagues, explains the full recovery design.

PostgreSQL uses WAL and MVCC but should not be described as simply running this textbook physical-undo trace. Its uncommitted tuple versions remain invisible and are reclaimed through its own mechanisms. ARIES is the conceptual recovery method requested by the syllabus; the practical PostgreSQL part returns to that engine's specific lifecycle. Keep a general recovery algorithm separate from a claim about a named product.

:::interview Interview lens
**"Why does ARIES redo an uncommitted transaction?"** Its redo phase repeats the relevant history to establish a recoverable page state, while undo then reverses unfinished transactions. Page log positions keep redo restartable, and compensation records keep undo restartable. The transaction's admission status and the physical history present on a page are separate facts.
:::

## 46. Buffer pools, pinning and eviction

The index asks for the same root page on many lookups. Reading it from the device each time would waste work. A **buffer pool** caches database pages in RAM, mapping persistent page identities to in-memory frames.

On a hit, the manager finds a resident page and lets the caller use it. On a miss, it obtains a free or reusable frame, loads the requested page, and updates the mapping. A **pin** prevents a frame from being evicted while a caller still needs it. Pinning does not grant exclusive permission to change page contents: an internal latch may be needed for that separate task.

@fig dbms_buffer | A hit uses the resident page; a miss must obtain a frame and load data. A dirty victim needs a safe flush before reuse.

### What makes a frame reusable

A clean unpinned page can be discarded because its backing copy already represents its contents. A dirty page cannot simply vanish: the engine must preserve its changes according to the logging and writeback rules. Before flushing it, the manager ensures the WAL required by that page is durable. It then writes the page safely and eventually reuses the frame when no caller pins it.

If every frame is pinned, ordinary eviction cannot make space. A caller that forgets to unpin can therefore cause resource exhaustion even when the cache's nominal byte size seems adequate. Long page usage intervals and transaction lifetime are different issues; some engines retain logical locks after releasing page pins.

A **replacement policy** chooses which reusable page should leave. Least-recently-used reasoning favours pages accessed lately, while clock-style policies approximate recency with cheaper metadata updates. A large sequential scan can pollute a cache intended for repeatedly accessed point queries, so engines may distinguish one-time scans from reusable working data.

For Heron's illustrative 100 page requests with 90 buffer hits, the **cache hit ratio** is $90/100=0.9$, or 90 percent. Read this as "the fraction of requests satisfied by the cache." The remaining 10 misses do not necessarily equal 10 uncached device reads because another cache layer may satisfy them. A high hit ratio also does not prove low latency if the few misses are expensive or the workload waits on locks.

### Flush is not eviction, and cache is not durability

An engine can flush a dirty page and retain it in the pool as a clean page. It can later evict that clean page without another write. A transaction can commit while some dirty pages remain cached under a no-force design. These distinctions connect the buffer manager to WAL: the cache optimizes access, while the recovery contract determines what must survive RAM loss.

:::story Picture this
A desk holds folders currently being used. A pin says someone still has a folder open and it cannot be replaced. A dirty marker says the desk copy has edits missing from the cabinet copy. Filing those edits and choosing which folder leaves the desk are different actions.
:::

## 47. LSM trees, compaction and amplification

A B+ tree update changes a page in its ordered structure. A write-heavy workload may instead benefit from collecting updates in memory and writing sorted runs sequentially. A **log-structured merge tree**, or LSM tree, organizes several sorted components and periodically merges them.

The write path commonly appends recovery information to WAL and applies the update to an ordered **MemTable** in RAM. When that structure fills, it becomes an **immutable MemTable** so a background flush can write it while a new mutable table receives later writes. A **sorted string table**, or SSTable, is an immutable sorted file containing keys and associated versioned data or deletion markers.

@fig dbms_lsm | A conceptual LSM lifecycle. The exact ordering of acknowledgement and persistence depends on the engine's configured durability contract.

### A read must resolve several possible copies

Suppose a key first has a free value in an older SSTable and later receives a held value in the MemTable. The reader searches appropriate newer components and selects the visible newest version under the engine's version rules. It cannot return the old free value merely because it found that copy first. Range reads merge ordered iterators across components while resolving duplicates and versions.

A **tombstone** records a deletion. Removing a key only from the newest component would expose an older copy again. The marker must remain until compaction and retention rules prove that no older visible value can reappear. Snapshots and overlapping runs complicate that proof.

**Compaction** merges selected sorted runs, resolves versions that can be removed, propagates necessary tombstones and writes replacement files. Once readers and recovery no longer need the old runs, the engine can retire them. Leveled and tiered strategies choose different overlap and rewrite patterns; their read, write and space costs differ. RocksDB's [compaction documentation](https://github.com/facebook/rocksdb/wiki/Compaction) gives concrete versions of these strategies.

### Count the work a write causes

**Write amplification** is physical bytes written divided by logical bytes changed, under a stated accounting boundary. **Read amplification** counts extra read work required to answer a logical request; define whether that work means runs, blocks or bytes. **Space amplification** compares stored bytes with the live logical data, including obsolete versions and duplication within the chosen boundary.

@fig dbms_amplification | An illustrative accounted batch changes 4,096 logical bytes and causes 28,672 physical bytes across WAL, flush and compaction. This is a declared workload example, not a measured engine prediction.

The batch writes 4,096 WAL bytes, 8,192 flush bytes and 16,384 compaction bytes. Total physical work is $4096+8192+16384=28672$ bytes, giving $28672/4096=7$ amplification. Read this as "seven physical written bytes per logical changed byte in this accounting example." Background work can occur long after the foreground update that caused it.

B+ trees and LSM trees both support useful point and range access. B+ trees maintain an ordered mutable structure; LSMs collect and merge ordered runs. LSM writes can be sequentialized, but reads and compaction pay for multiple components. A compaction backlog can increase read work, consume space and eventually stall incoming writes. Choose from measured workload and retention behaviour rather than calling either family universally faster.

:::note A storage engine is not a full application database
RocksDB is a concrete LSM storage engine. An application using an engine must still obtain the required transaction, replication, query and schema behaviour from the surrounding system or supported engine facilities. An SSTable format alone does not provide Heron's complete booking contract.
:::

## 48. Bloom filters and one-sided errors

An LSM lookup searches for a seat key that does not exist. Without help, it may inspect many SSTables before proving absence. A **Bloom filter** is a compact probabilistic membership structure that can say "definitely absent" or "possibly present."

Initialize a bit array to zero. To insert a key, compute its hash positions and set those bits to one. To query a key, compute the same positions. If any corresponding bit is zero, the key could not have been inserted into that filter. If all are one, the key may have been inserted, or other keys may have set the same bits. That second outcome requires checking the real data.

@fig dbms_bloom | Illustrative eight-bit array with set positions 1, 3, 4 and 6. A query requiring bit 0 is rejected; a query requiring bits 1 and 6 still needs a data lookup.

### Why false positives are possible but ordinary false negatives are not

A **false positive** says possibly present for a key absent from the represented set. It happens because different keys share hash positions. For the pictured fixed mask, with two independent uniform query positions, both selected positions land among the four set bits with probability $(4/8)^2=1/4=25$ percent. This is an exact calculation under that declared query-position model, not a measurement of production keys.

An inserted key's positions remain set, so an unchanged ordinary Bloom filter has no **false negatives**. Clearing a bit to delete one key is unsafe because another inserted key may share it. A counting variant can track counts, but overflow and correct decrement handling introduce different obligations. The no-false-negative claim assumes consistent hashing, an intact filter and normal insertion-only semantics for the represented set.

For a general m-bit filter with n inserted keys and k hashes, the familiar independent-bit approximation is

$$
p\approx\left(1-e^{-kn/m}\right)^k.
$$

Read this as "a false positive needs every queried bit to have been set; the formula estimates that event under the model." Here m is bit count, n is inserted-key count and k is hashes per key. For m=1,024, n=100 and k=3, evaluating the formula gives 1.638 percent after rounding. The filter uses $1024/8=128$ bytes. The computed approximation is labelled as a model result, not a guaranteed rate for every hash family.

### Where an LSM uses the result

A filter for an SSTable lets the engine skip a point lookup into that file when absence is certain. A positive still requires the file's index and data checks. The filter must represent relevant tombstone keys too, because skipping a file containing a deletion marker could reveal an obsolete value from another run. Range queries need suitable range or prefix mechanisms; an ordinary whole-key membership filter cannot prove an arbitrary interval is empty. The [RocksDB Bloom-filter reference](https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter) shows how a real engine integrates this idea.

:::key In one breath
WAL orders durable recovery records ahead of corresponding data pages, while commit policy defines the acknowledgement boundary. Recovery distinguishes committed missing work from unfinished work and must itself survive another crash. Buffer pools cache pages with separate pin, dirty, flush and replacement obligations. LSMs trade ordered run writes for merge and read costs, and Bloom filters skip definitely absent point lookups without replacing the real membership check.
:::

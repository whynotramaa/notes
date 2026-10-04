@part I | Local, block, file, object storage | We decide what operations the application needs before choosing where bytes live. A disk, a filesystem, an object service, and a database expose different promises even if all eventually use physical drives. We will trace their boundaries, compare their failure ownership, and calculate a small allocation example. | where:1

## 1. Local disk and the lifetime of a machine
A Heron worker saves an uploaded clip under its local temporary directory, then the worker is replaced. The next worker has the database row but cannot find the bytes. **Local disk** is storage attached to the machine or its local execution environment, whose availability and retention follow that environment's rules.

Local storage can be useful for buffers, intermediate conversion files, caches, or state that another source can reconstruct. It is unsafe as the only durable copy of a published clip unless the machine's retention and recovery contract actually meets the requirement. A container path is not automatically a persistent host path, and a host path is not automatically a replicated recovery copy.

@fig sd_storage_local | Local-storage lifetime. Whether the bytes survive depends on the actual volume and recovery contract.

Separate processing scratch space from authoritative stored media. A conversion worker can download an immutable source object, build renditions locally, and publish new objects after verification. If it crashes, another worker repeats that job from retained source state rather than depending on its abandoned scratch directory.

:::story Picture this
A restaurant prepares food on a counter but stores ingredients in a managed storeroom. Losing the preparation counter should lose unfinished work, not every ingredient. Temporary files and authoritative media need that same separation of lifetime.
:::
## 2. Block storage exposes addressable blocks
The score database needs to change a small page within a large persistent dataset. **Block storage** exposes a sequence of addressable blocks to a host, commonly as a device-like volume. A filesystem or database organizes those blocks into its own structures, and that higher layer supplies names and transactions.

A volume being durable does not mean it has a shared-filesystem interface. Multiple writers require a supported coordination and filesystem model. A crash can leave dirty in-memory pages absent from persistent storage, so the database's flush, log, and recovery rules still matter. Storage completion semantics need verification at the device and software boundary.

For an illustrative allocation exercise, store 5,000,000,000 bytes in 4,096-byte blocks. Rounding the division upward gives 1,220,704 blocks. Their allocated total is 5,000,003,584 bytes, leaving 3,584 bytes of final-block padding. This is a simplified contiguous accounting model, not an actual filesystem space report.

@fig sd_storage_block | Illustrative blocks. Metadata, sparse allocation, compression, and implementation overhead are excluded.

:::note Layers above the volume
A database can organize pages directly or use files on a filesystem. Either way, block durability alone does not establish transaction atomicity. The database log and recovery rules decide which effects can be acknowledged safely.
:::
## 3. File storage supplies a namespace
Several workers need named files in shared directories. **File storage** exposes a filesystem-like namespace and operations such as opening paths, reading ranges, and changing files. Its supported locking, rename, permissions, and cache semantics must be checked for the chosen protocol and implementation.

Names add coordination work. A directory listing, file lock, and file-content write can have different visibility rules across clients. If Heron stores uploaded media through a shared filesystem, it must understand when a finished file becomes visible and how a crashed writer leaves partial content. Publishing through a supported atomic rename can help in some filesystems, but that assumption cannot be transferred to every remote storage service.

@fig sd_storage_file | Filesystem interface. Each named operation has product and protocol semantics that need verification.

File storage can suit applications built around path operations or shared file tooling. Object storage can suit complete named media objects with a separate metadata database. Choose by the operations and failure contract, then size bandwidth and metadata contention. Familiar path syntax alone is not a reason to impose a filesystem on a workload that needs immutable objects.

:::warn Watch out
A slash in an object key does not automatically create a filesystem directory. Do not assume file locking, partial in-place update, or atomic rename merely because a console displays a folder-like view.
:::
## 4. Object storage and databases have different jobs
A clip is a large byte sequence; its owner, visibility, processing state, and match relationship are small structured facts. **Object storage** stores named objects through an object API. A **database** stores structured state with query and update guarantees appropriate to its model.

Heron keeps clip bytes in the object service and searchable application facts in its metadata database. That division lets the application authorize a small operation while the client transfers bytes without passing them through application workers. It also creates a coordination problem: the database and object service do not share the same transaction.

@fig sd_storage_interfaces | Interface comparison. Physical drives can exist beneath every interface without making the contracts equivalent.

If the clip is stored but its database publication fails, the bytes may be orphaned. If metadata publishes before upload is verified, a viewer can be directed to missing or unsafe content. The later parts solve this through explicit upload states and idempotent completion rather than pretending a cross-service transaction exists.

:::interview Interview lens
**"Why not store every file in the database?"** A database can store bytes, but large media transfer and retention have different bandwidth and operational needs from small queryable metadata. I choose object storage for immutable media and the database for permissions and relationships. I then explicitly handle the publication gap between them.
:::
:::key In one breath
Local, block, file, object, and database storage expose different lifetimes and operations. Durability of a device does not establish transactional or namespace guarantees above it. Keep reconstructable scratch work separate from authoritative media. Heron separates large objects from metadata and therefore needs an explicit coordination protocol between their owners.
:::

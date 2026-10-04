@part VI | Replication and distributed file systems | We keep bytes available across machines without assuming every copy is fresh or safe. Replication, erasure coding, and distributed filesystems move failure ownership into another service. We will calculate physical bytes, examine repair, separate data from metadata coordination, and trace cross-region recovery. | where:6

## 21. Replication multiplies physical storage
A single local media copy disappears with its only disk. **Replication** keeps multiple copies of the same logical data so surviving copies can serve or restore it under the chosen failure model. Copies need placement, update, integrity, and repair policies; the count alone supplies none of these.

For Heron's illustrative 5,000,000,000-byte object and three complete copies, payload storage is 15,000,000,000 bytes. This excludes object metadata, coding, snapshots, and temporary transfer storage. If all copies share a rack or credential that can delete them, that common cause can defeat the logical redundancy.

@fig sd_storage_replication | Decimal GB in an illustrative full-copy model. Actual service placement and coding are product-specific.

Replica acknowledgement determines which copies must have the data before the caller hears success. An asynchronous remote copy can still be absent after local acknowledgement. A synchronously required remote copy can add delay or reduce write availability during its failure. Choose the guarantee, then trace acknowledgement and recovery.

:::story Picture this
Several photocopies help only if they are readable, current enough, and stored beyond the same accident. A clerk also needs a rule for making a new copy when one disappears. A list saying three copies exist is not that rule.
:::
## 22. Erasure coding trades repair for space
A large immutable object can be split into data pieces with parity information. **Erasure coding** stores enough derived pieces to reconstruct data after a stated number of missing pieces, according to the code and placement. It can use less storage than full replication while changing read and repair behavior.

In an illustrative systematic four-data, two-parity model, each shard holds 1,250,000,000 bytes for the 5,000,000,000-byte object. Six shards total 7,500,000,000 bytes, a factor of 1.5 of logical payload. An appropriate code can reconstruct from any four available shards, tolerating two missing shards under this model.

@fig sd_storage_erasure | Illustrative erasure-code model, not a claim about a chosen storage provider's internal layout.

Repair may need several surviving pieces and network reconstruction work rather than copying one intact replica. Small random reads and updates can incur different costs from sequential immutable reads. Do not assume erasure coding is automatically the best choice for a latency-sensitive database page workload.

:::note Repair bandwidth
A failed disk creates background repair demand that competes with serving. Include degraded reads and repair traffic in capacity tests. Space-efficient redundancy can still have a costly recovery path.
:::
## 23. Distributed file systems coordinate names and pieces
A large dataset no longer fits or survives on one host. A **distributed file system** coordinates a file namespace and storage pieces across machines. It must locate data, maintain authoritative metadata, detect failures, and repair or replicate pieces according to its semantics.

[The Google File System paper](https://research.google/pubs/the-google-file-system/) describes a concrete design shaped by its workloads rather than a universal filesystem contract. It separates metadata coordination from data transfer to chunk servers and treats component failure as expected. The lesson is to explain where file metadata and payload ownership live, not to copy its policies into every application.

@fig sd_storage_dfs | Distributed-filesystem architecture concept. Guarantees vary by implementation and protocol.

A coordinator outage can affect opening or changing files even when data servers still hold their pieces. Cached locations may permit limited continued reads but need version and lease rules. Heron's object-service choice similarly delegates a distributed storage implementation, yet the app still owns its database-to-object relationship and permissions.

:::warn Watch out
Distributed storage does not mean every operation survives every partition. Namespace authority, write ordering, and piece availability have separate dependencies. Identify which operations remain possible under the stated fault.
:::
## 24. Cross-region copies and recoverable state
Heron needs media after losing the active region. A remote copy must include the intended immutable object and enough metadata to find and authorize it. Replicating bytes without the active clip pointer can leave an unusable library; replicating pointers ahead of bytes can expose missing media.

An illustrative score-log replication gap of 5 seconds at 20 events per second represents 100 events. The same principle applies to object replication, but large objects and completion events have different transfer time and ordering. Measure which acknowledged objects exist at the recovery destination rather than converting an unrelated row lag into media safety.

@fig sd_storage_region | Cross-region recovery concept. Byte and metadata replication must be reconciled by identity and state.

@fig sd_storage_remote | Illustrative score-gap arithmetic. It cannot substitute for object-copy evidence.

:::interview Interview lens
**"How do you make stored media survive a region loss?"** I choose storage placement and retained history for that fault, then verify which immutable objects and metadata references exist in the recovery region. I separate acknowledged-copy guarantees from asynchronous replication. The restore procedure reconciles the publication pointer, access policy, and exact object identity before serving.
:::
:::key In one breath
Replication stores full copies under acknowledgement and placement rules. Erasure coding saves space through reconstructable pieces while changing repair and read costs. Distributed filesystems separate namespace coordination from payload storage according to their documented semantics. Regional recovery needs both verified bytes and their usable metadata references, with workload-specific evidence of what survived.
:::

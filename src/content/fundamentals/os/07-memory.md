@part VII | Paging and virtual memory | A virtual address is a name whose physical location can change. Paging gives the kernel fixed-size units for protection, sharing and replacement, while the TLB keeps common translations close to the CPU. We will compute Finch's translation, table size, page faults, replacement traces, thrashing and segmentation. | where:7

## 26. Memory management goals

If programs used physical addresses directly, one process could overwrite another and relocation would be difficult. A **virtual address** belongs to a process's address-space view. A **physical address** names a location in RAM. The memory manager maps one to the other and checks permissions before the hardware performs the access.

The goals are isolation, relocation, protection, allocation and sharing. A private page can be mapped to different frames in different processes. A read-only code page can be shared. A missing page can be brought in only when used. These choices let the 32-bit model expose 1,048,576 virtual pages without requiring every page to occupy RAM at once.

@fig os_virtual_memory | Illustrative cards separate private views, permissions, shared frames and demand residency. Orange marks the private address-space view, which does not require every mapped page to be resident.

Contiguous allocation makes placement simple but produces holes. Paging removes external fragmentation from physical placement, though the final page can still contain unused bytes.

### Contiguous allocation and fragmentation

Fixed partitions reserve predefined regions; variable partitions find a free hole large enough for each request. First fit takes an adequate hole encountered early, best fit selects a small adequate hole, and worst fit selects a large one. Searching and splitting have costs, and none eliminates the need to coalesce adjacent free regions when allocations end.

Internal fragmentation is unused space within an allocation. External fragmentation is free space spread across holes that cannot satisfy a requested contiguous region. Finch's later 10,000-byte request occupies three 4,096-byte pages, giving 12,288 allocated bytes and 2,288 unused bytes. Physical paging permits those frames to be separated, but it does not make the final page's unused bytes disappear. The allocator and page manager therefore solve related placement problems at different scales.

@fig os_contiguous_alloc | Illustrative fixed and variable allocations separate unused bytes inside an allocation from free holes between allocations. Orange marks external fragmentation.

## 27. Paging and address translation

With 4,096-byte pages, a 32-bit virtual address has 12 offset bits and 20 virtual-page-number bits. Finch's address 13,396 gives VPN 3 and offset 1,108. The page table maps VPN 3 to frame 9. The physical address is frame times page size plus offset, or $9\times4096+1108=37972$.

The offset does not change during translation. The page table entry adds the frame and permission state. A present bit says whether the frame is resident; protection bits say which access is allowed. Dirty and referenced bits help writeback and replacement decisions.

@fig os_addresses | Illustrative translation splits 13,396 into VPN 3 and offset 1,108, then combines frame 9 with the unchanged offset to produce 37,972. Orange marks the final physical address.

A page is the fixed-size unit in virtual memory, while a frame is the corresponding fixed-size physical unit. Compute the split explicitly: $13396=3\times4096+1108$. The quotient selects the virtual page and the remainder selects a byte within it. Translating to frame 9 changes only that quotient, giving $9\times4096=36864$ before adding the unchanged remainder. Read both equations as base-plus-offset calculations.

The hardware cannot simply trust a frame number supplied by application code. It consults the translation and protection state installed by the kernel. A writable access to a read-only mapping can fault even when the frame is present. Conversely, a permitted virtual region can fault because its backing page is not resident yet. Separating permission from residency prevents the common mistake of treating every page fault as invalid memory.

## 28. Page tables and TLBs

A linear table needs one 4-byte entry for each of 1,048,576 virtual pages, which is 4,194,304 bytes per address space. Multi-level tables allocate lower branches only for populated regions. Inverted designs index by physical frame and store which virtual page occupies it, changing lookup trade-offs.

A **translation lookaside buffer**, or TLB, caches recent virtual-to-physical translations. With a 90 percent hit rate, a hit costs 10 ns of TLB lookup plus 100 ns of memory access. A miss costs 10 ns plus two 100 ns memory accesses. The weighted effective time is 120 ns.

$$
E=h(t+m)+(1-h)(t+2m)=0.9(110)+0.1(210)=120\text{ ns}.
$$

Read this as hit probability h times hit cost plus miss probability times miss cost. E is the expected access time, t the 10 ns TLB lookup and m the 100 ns memory access. The example assumes one page-table memory lookup on a miss and excludes page faults.

@fig os_page_table | Illustrative comparison of a flat table, which costs 4,194,304 bytes whatever is mapped, with a two-level tree that allocates a directory and only three populated branches, 16,384 bytes. Orange marks the populated branches.
@fig os_tlb | Illustrative ten translations: nine hit the TLB and take the short path, one misses and walks the page table in memory first. Orange marks the miss path and the weighted 120 ns result.

Context switches can flush or partition TLB state. ASIDs or PCIDs let supported hardware retain entries while tagging ownership.

A flat table is simple because the VPN directly selects an entry. A sparse process still pays for many entries it never uses. A multilevel walk uses portions of the VPN to select successive tables, allowing absent lower branches to represent large unmapped ranges. That saves table memory under a sparse model while increasing translation work on a miss. An inverted table trades per-address-space entries for a structure organized around physical frames and needs another lookup method.

### Virtual memory and translation tags

Private views, protection and shared mappings are the purpose of virtual memory; backing pages with storage is only one mechanism. Translation tags distinguish entries from different address spaces so a switch can retain correctly identified cached translations. A retained TLB entry must still follow mapping changes and invalidation rules. A larger hit rate cannot repair an outdated entry that grants the wrong permission.

## 29. Demand paging and faults

Demand paging leaves a valid virtual mapping without a resident frame until the CPU touches it. A **page fault** transfers control to the kernel. The kernel checks whether the address is legal, locates file-backed bytes or creates a zero page, obtains a frame, updates the PTE and retries the faulting instruction.

A minor fault can be satisfied without storage I/O, while a major fault needs slower backing storage. A dirty evicted page must be written before its frame can be reused. The process is blocked during the wait, so page faults affect both memory latency and scheduler state.

@fig os_demand_paging | Illustrative fault path locates or creates a page, maps a frame and retries the same instruction. Orange marks the kernel decision that distinguishes an invalid access from a valid missing page.

A fault handler begins with the process's permitted region, not a disk read. An anonymous demand-zero page can receive a cleared frame. A file-backed page may already exist in the page cache, giving a minor fault even though the process has not mapped it. Only the path that needs storage access requires the corresponding I/O wait. The process can therefore change from running to blocked and later ready during one instruction's attempted access.

After the backing bytes or zero state are ready, the kernel installs the mapping and resumes at the interrupted instruction according to the architecture. The application observes its intended load rather than a special second operation. An address outside the allowed region cannot use this repair path. It receives the relevant access-failure behavior, which is why catching a segmentation signal is not a substitute for establishing a valid mapping.

## 30. Page replacement

With three frames and reference string 1,2,3,4,1,2,5,1,2,3,4,5, FIFO produces 9 faults. With four frames it produces 10, the exact Belady anomaly in the supplied trace. LRU with three frames produces 10, while OPT produces 7 because it knows future references and is a benchmark rather than a deployable predictor.

FIFO evicts the oldest resident page, LRU the least recently used, and Clock approximates recency with a referenced bit. Replacement must also consider dirty state, sharing and working-set locality.

@fig os_replacement_fifo | Illustrative early FIFO trace shows the supplied page references and the three-frame state. Orange marks the first hit after page 5 arrives.
@fig os_replacement_compare | Illustrative comparison shows FIFO's 9 versus 10 faults, LRU's 10 and OPT's 7. Orange marks the anomaly.

The first references 1, 2 and 3 fill the three frames. Reference 4 evicts the oldest loaded page, 1. References 1 and 2 then fault because FIFO's earlier decisions removed them. After loading 5, the next references to 1 and 2 hit. The remaining references distinguish the policies because FIFO remembers admission order, LRU remembers recent use and OPT compares the next future use.

### FIFO, optimal, LRU and Clock

Clock maintains a hand over resident entries. A referenced bit grants a second chance: clear the bit and continue rather than immediately evicting that frame. An unreferenced candidate can be reclaimed subject to dirty-page and ownership rules. This approximates recent use without keeping a perfectly ordered record of every access. OPT remains a benchmark because the future reference string is supplied only in the exercise. FIFO's anomaly shows that additional capacity alone need not improve every policy.

## 31. Thrashing and segmentation

When a task's working set does not fit, it faults, loads a page, evicts a useful page and faults again. **Thrashing** means the system spends most of its time paging instead of executing. Locality, working-set size and page-fault frequency provide signals for reducing active work or adding frames.

Segmentation names logical regions such as code, heap and stack. Paging beneath segmentation supplies fixed physical placement and avoids external holes. A segment plus offset still needs bounds and permissions, while a page mapping handles frame placement.

@fig os_thrashing | Illustrative loop shows a working set that exceeds available frames and repeatedly evicts useful pages. Orange marks the useless fault cycle.
@fig os_segmentation | Illustrative logical regions are named separately from physical paging. Orange marks the page layer that removes external placement holes.

### Working sets and page-fault frequency

A working set is the pages a task actively needs over a stated observation window. The window matters because a server can move between parsing, database access and response generation. If active tasks collectively need more frames than remain available, admitting still more work can reduce useful throughput. Page-fault frequency exposes that pressure, but diagnosis must distinguish compulsory first access from repeated eviction of useful pages.

### Segmentation and paging

A segment-relative address combines a logical segment identity with an offset checked against its bounds. Pure contiguous segmentation can leave external holes as segments grow and disappear. Paging beneath the segment maps pieces to independent frames while retaining the logical region's permissions. Neither scheme licenses a pointer beyond its allowed bounds. The distinction is logical organization versus physical allocation, which also explains why a process's code and stack need not occupy adjacent RAM.


:::story Picture this
A worker requests a box by its catalogue name, not its shelf position. A current address card maps that name to a shelf, while a small desk index remembers recent mappings. Moving a box requires updating the mapping and withdrawing outdated cards. The catalogue is the virtual view; shelves are frames; the desk index is the TLB.
:::

:::note Permissions before repair
A page fault does not grant permission to create an arbitrary mapping. The kernel first checks the permitted virtual region and the requested access, then supplies backing only when that access belongs to the process's contract.
:::

:::interview Interview lens
**"What happens on a page fault?"** The kernel checks whether the mapping and access are permitted before finding backing. It can supply a cached or zero page without storage, or block for the required I/O. It then installs the translation and retries the instruction; an illegal access cannot use that repair path.
:::

:::warn Watch out
A TLB miss is not automatically a page fault. The page-table walk can find a valid resident frame. A page fault is a translation or protection event requiring kernel handling, and only some fault paths need storage I/O.
:::

:::key In one breath
Paging maps VPN 3 and offset 1,108 to frame 9 and physical address 37,972. A flat table costs 4,194,304 bytes, while a 90 percent TLB hit rate gives 120 ns effective access time. Replacement policy changes fault count, and thrashing appears when locality exceeds resident capacity.
:::

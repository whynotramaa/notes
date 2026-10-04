@part VIII | Copy-on-write and mappings | Process creation, file loading and allocation all use virtual mappings. Copy-on-write delays copies until a write, `mmap` gives files and anonymous memory an address-space view, and allocators serve small requests above kernel primitives. We will connect those mechanisms to stack lifetime, heap fragmentation and shared mappings. | where:8

## 32. Copy-on-write after fork

The parent and child can initially point at the same 8 pages marked read-only. A child write triggers a protection fault, the kernel allocates a new frame, copies 4,096 bytes and updates the child's mapping. The model therefore grows from 32,768 bytes to 36,864 bytes after one private page, while 7 pages remain shared.

Copy-on-write is a sharing policy, not a promise that writes are free. Many writes create many copies, and dirty pages consume memory. Private file mappings can also use copy-on-write; shared writable mappings instead deliberately expose changes to peers.

@fig os_cow | Illustrative ledger computes 8 pages before fork, 8 shared pages after fork and one copied page after a write. Orange marks the new private allocation.

The byte count measures unique physical page payload across parent and child, excluding page tables and kernel records. Counting both mappings as separate payload would incorrectly report a full copy immediately after fork. The new copy changes the physical-frame count from eight to nine, while each process still sees eight virtual pages. The writer's page-table entry changes; the sibling keeps its previous mapping.

The protection fault is intentional. Both mappings initially refuse an ordinary write so the kernel can perform the private-copy operation first. Another process can fault on the same source under its own mapping without sharing the writer's change. A private file mapping uses the same general idea, while a shared writable mapping deliberately publishes changes to other mappings. Copy-on-write is therefore not the policy for every region merely because multiple processes can address it.

## 33. `mmap` and file-backed memory

`mmap` associates a virtual range with a file or anonymous backing. The first access can fault in the relevant page, so a program can address file contents like memory without issuing a read for every byte. Dirty file-backed pages can later be written back according to mapping and synchronization rules.

The same mechanism supports shared memory, executable loading, shared libraries and anonymous arenas. `read` gives an explicit copy into a supplied buffer, while `mmap` exposes a mapping whose faults and page cache interactions are managed by the kernel.

@fig os_mmap | Illustrative file offset becomes a virtual mapping, then a page fault loads the needed page before the memory access. Orange marks the mapping because it connects file identity to an address.

A file mapping records which file range backs a virtual region; a not-yet-resident entry does not already contain the final physical frame. When the process first touches the range, the kernel resolves the backing page and establishes a resident translation. A shared mapping can make changes visible through the shared backing, while a private mapping gives the writer private changes under copy-on-write. Those policies must be selected deliberately.

Mapping avoids an explicit user-buffer copy on some paths but does not eliminate faults, validation or lifetime costs. Truncating a mapped file can invalidate later accesses, and a pointer remains usable only while its mapping remains valid. `read` instead makes the requested transfer and return count explicit. Neither API automatically establishes persistent-storage durability after modifying bytes. Synchronization and writeback semantics remain part of the file contract.

## 34. Heap allocators

`malloc(100)` normally asks a user-space allocator for a block from existing arenas. If it lacks space, the allocator may request more virtual memory with mechanisms such as `brk` or `mmap`. The allocator stores metadata, rounds sizes, splits blocks and coalesces freed neighbors.

Internal fragmentation is space inside an allocated block that the caller does not use. External fragmentation is free space split into pieces that cannot satisfy a larger request. Arenas can reduce lock contention for threads but can increase total retained memory. A leak is different from fragmentation: the program loses useful ownership of allocated memory instead of merely having unusable holes.

For the page-level allocation model, a 10,000-byte request needs the ceiling of $10000/4096$, namely three pages. The payload allowance is $3\times4096=12288$ bytes, leaving $12288-10000=2288$ unused. Read ceiling as taking enough whole pages to contain the request. A user allocator may subdivide such regions into much smaller blocks, so this calculation must not be presented as the exact cost of every `malloc` call.

Freeing a block returns it to the allocator's bookkeeping, which may retain the backing region for future requests. Process resident memory therefore need not fall immediately after every `free`. Coalescing and arena reuse can reduce future kernel calls while retaining spare capacity. Diagnose whether bytes are still owned, available for reuse or returned to the kernel before calling every stable resident footprint a leak.

@fig os_heap_stack | Illustrative heap allocation tracks explicit block ownership, while stack frames follow calls. Orange marks call-scoped lifetime.

## 35. Stack frames and overflow

A call frame commonly contains arguments, a return address, saved registers and local variables. The stack pointer identifies the current frame, while a frame pointer may help debugging when used. Recursion allocates another frame per call, so unbounded recursion can exhaust the mapped stack and fault.

The stack is not simply faster than the heap. It has structured lifetime tied to calls and often favorable locality. The heap supports data that outlives a call but needs allocator metadata and an ownership rule. A dangling pointer violates lifetime in either region.

@fig os_heap_stack | Illustrative cards separate call-scoped stack lifetime, explicit heap lifetime, allocator metadata and stack overflow. Orange marks lifetime because it determines safe ownership.

The exact frame layout follows the calling convention and compiler decisions. Some arguments live in registers, some local values never reach memory, and optimized calls can remove a frame entirely. The useful rule concerns lifetime: returning ends the frame's ownership of its local storage. Returning a pointer to that storage does not extend the lifetime, even if the bytes happen to remain unchanged for a while.

Stack growth also has a protection boundary. A guard mapping can turn growth beyond the supported region into a fault instead of silently overwriting another region. Recursion depth and frame size jointly determine consumption, so replacing one large automatic buffer with another does not cure an unbounded recursion path. Finch's callbacks should keep stack use bounded while handing longer-lived response buffers to a clearly owned allocation.


:::story Picture this
Two readers share an unchanged workbook. Before one reader marks a page, the clerk makes a private copy of that page for the writer. The untouched pages remain shared, while the sibling still reads the original. A shared writable workbook would have a different rule and would deliberately show the mark to both readers.
:::

:::note Mappings and object lifetime
A valid virtual mapping does not make every pointer inside it an owned application object. An allocator can free a block while its surrounding arena remains mapped. The kernel's permissions and the language's object lifetime protect different boundaries.
:::

:::interview Interview lens
**"Why is fork cheaper with copy-on-write?"** Private writable pages can initially share physical backing under read-only mappings. The first write faults and gives that writer a private copy. The saving depends on how many pages are actually modified and excludes the setup cost of mappings and kernel records.
:::

:::warn Watch out
Do not treat a shared writable mapping as private copy-on-write memory. Shared mappings deliberately expose permitted changes to peers. Select the mapping policy and synchronization contract before interpreting another process's writes.
:::

:::key In one breath
Copy-on-write turns one page write into one 4,096-byte private copy. `mmap` connects files, anonymous memory and executable loading to virtual addresses. Heap allocation and stack frames differ by lifetime and ownership, not by a simplistic speed label.
:::

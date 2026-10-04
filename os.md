For **Operating Systems**, I’d keep the same bar as DBMS and CN: college fundamentals + interview questions + enough Linux internals that concepts such as processes, `fork`, virtual memory, page faults, file descriptors, `epoll`, and containers actually connect.

The central mental model should eventually become:

```text
Application
    ↓
System calls
    ↓
Kernel
 ┌───────────────┐
 │ Processes     │
 │ Scheduler     │
 │ Virtual Memory│
 │ Filesystems   │
 │ Networking    │
 │ Device / I/O  │
 └───────────────┘
    ↓
Hardware
```

# 1. OS fundamentals

Start with:

- What is an operating system?
- Kernel vs OS
- User space vs kernel space
- Kernel mode vs user mode
- Privileged instructions
- OS responsibilities
- Resource management
- Abstraction
- Protection and isolation

Types:

- batch OS
- multiprogramming
- multitasking
- multiprocessing
- time-sharing
- distributed OS
- real-time OS

Know the difference between:

> Multiprogramming vs multitasking vs multiprocessing vs multithreading.

---

# 2. Kernel architectures

Understand:

### Monolithic kernel

Many OS services run in kernel space.

Linux is broadly monolithic but modular.

### Microkernel

Keep kernel functionality minimal and move more services outside it.

### Hybrid kernel

Mix of approaches.

Know:

- monolithic
- microkernel
- modular kernel
- hybrid kernel

More importantly, understand the trade-off:

```text
performance ↔ isolation/modularity
```

---

# 3. System calls

This is the boundary between applications and the OS.

Examples:

```c
open()
read()
write()
close()

fork()
exec()
wait()

socket()
mmap()
```

Understand:

```text
Application
    ↓
library/API call
    ↓
system call
    ↓
kernel
    ↓
hardware/resource
```

Study:

- syscall interface
- syscall number concept
- arguments
- mode switch
- return to userspace

Important:

> Function call vs system call.

A normal function call does not inherently enter the kernel.

---

# 4. Interrupts, exceptions and traps

Know these carefully.

### Interrupt

Typically asynchronous external event.

Example:

```text
network packet arrives
keyboard input
timer fires
```

### Exception

Synchronous event caused while executing an instruction.

Example:

```text
divide by zero
page fault
invalid instruction
```

### Trap

Terminology varies by architecture/textbook, but commonly refers to intentional/synchronous control transfer into the kernel, such as a syscall or debugging trap.

Don't memorize overly rigid definitions without acknowledging architecture differences.

---

# 5. Processes

**One of the biggest OS topics.**

A program is passive code.

A process is an executing instance with associated state/resources.

Understand process memory:

```text
High address
┌──────────────┐
│    Stack     │
│      ↓       │
│              │
│      ↑       │
│     Heap     │
├──────────────┤
│ BSS          │
│ Data         │
│ Text / Code  │
└──────────────┘
Low address
```

Study:

- text
- data
- BSS
- heap
- stack

Know what typically lives in each.

---

# 6. Process Control Block

The OS needs to track every process.

PCB conceptually contains:

- PID
- process state
- program counter
- CPU registers
- scheduling information
- memory-management information
- open-resource information
- accounting/security information

Understand:

> Why does the OS need a PCB?

Because the process must be stopped and resumed later.

---

# 7. Process states

Classic model:

```text
        admitted
New ─────────────→ Ready
                    │
                 dispatch
                    ↓
                  Running
                  /     \
          I/O wait       exit
              ↓           ↓
          Waiting      Terminated
              │
         I/O complete
              ↓
            Ready
```

Know:

- new
- ready
- running
- waiting/blocked
- terminated

Also understand suspended states conceptually.

---

# 8. Context switching

Suppose CPU switches:

```text
Process A
   ↓
Process B
```

OS must save A's execution state and restore B's.

Study:

- registers
- program counter
- stack pointer
- address-space context
- scheduler involvement

Understand:

> Context switches are useful but aren't free.

They consume CPU time and can hurt cache/TLB locality.

---

# 9. Process creation: `fork()`

For Linux/Unix interviews, **know this well**.

```c
pid_t pid = fork();
```

Conceptually:

```text
Parent
   │
 fork()
   ├──── Parent
   │
   └──── Child
```

Both continue from after `fork()`.

Know return values:

```text
parent → child's PID
child  → 0
failure → -1
```

Then understand:

- parent/child relationship
- inherited file descriptors
- address-space semantics
- copy-on-write

---

# 10. `exec()`

`exec` does not create another process.

It replaces the current process image.

Typical shell behavior:

```text
Shell
 ↓
fork
 ↓
Child
 ↓
exec("ls")
```

Know:

> `fork()` vs `exec()`.

Very common question.

---

# 11. `wait()`, zombies and orphans

Understand:

### Zombie

Process has exited, but its termination status has not yet been collected by its parent.

### Orphan

Parent terminates while child remains alive; Unix-like systems arrange for such children to be reparented/reaped appropriately.

Study:

```c
wait()
waitpid()
```

Know why zombie processes exist in the first place.

---

# 12. Threads

A process owns resources/address space.

Threads are execution units within a process.

Conceptually:

```text
Process
 ├── Thread A ─ stack A
 ├── Thread B ─ stack B
 └── Thread C ─ stack C

Shared:
code
heap
global data
open resources
```

Each thread has its own:

- stack
- registers
- program counter/execution state

Shared:

- address space
- heap
- code
- many process resources

---

# 13. Process vs thread

Know this extremely well.

Compare:

- memory isolation
- communication
- creation cost
- context switching
- fault isolation
- shared state
- synchronization requirements

Don't reduce it to:

> Threads are lightweight processes.

Explain **why** they can be cheaper and what sharing costs you.

---

# 14. User threads vs kernel threads

Study:

- user-level threads
- kernel-level threads

Models:

- many-to-one
- one-to-one
- many-to-many

Understand why the kernel needs visibility into schedulable execution entities for true multicore parallelism in common threading models.

---

# 15. Concurrency vs parallelism

Important distinction.

### Concurrency

Multiple tasks make progress over overlapping periods.

### Parallelism

Multiple tasks literally execute simultaneously on different execution resources.

A single CPU core can provide concurrency through scheduling without true simultaneous execution.

---

# 16. Race conditions

Suppose:

```text
counter = 10

Thread A             Thread B

read 10              read 10
+1                   +1
write 11             write 11
```

Expected 12.

Got 11.

Study:

- race condition
- critical section
- atomicity
- mutual exclusion

This leads into synchronization.

---

# 17. Critical-section problem

A good solution should reason about:

- mutual exclusion
- progress
- bounded waiting

Understand why:

```c
counter++;
```

isn't necessarily one atomic CPU operation.

It can conceptually be:

```text
load
increment
store
```

---

# 18. Atomic operations

Study:

- atomic read/write concept
- test-and-set
- compare-and-swap (CAS)
- fetch-and-add

Example:

```text
CAS(address, expected, desired)
```

means roughly:

> Update only if the value is still what I expected.

This connects OS concurrency with DB optimistic concurrency and lock-free algorithms.

---

# 19. Mutexes

Basic mutual exclusion:

```text
lock()
critical section
unlock()
```

Understand:

- ownership
- contention
- blocking
- sleeping vs spinning

And what happens if a lock isn't released.

---

# 20. Semaphores

**Classic interview topic.**

Study:

### Binary semaphore

Values effectively 0/1.

### Counting semaphore

Represents multiple available resources.

Operations traditionally:

```text
wait / P / down
signal / V / up
```

Understand:

> Mutex vs semaphore.

A mutex typically represents ownership of a critical section. A semaphore represents permits/resources or signaling.

Practice:

- producer-consumer
- bounded buffer

---

# 21. Condition variables

Often neglected but important.

Imagine:

```text
consumer:
while queue.empty():
    wait()
```

Producer adds work and signals.

Study:

- `wait`
- `signal`
- `broadcast`
- predicate checking

Understand why waiting should generally happen in a loop:

```text
while (!condition)
    wait()
```

not merely `if`.

---

# 22. Monitors

Conceptual abstraction combining:

- shared state
- mutual exclusion
- condition synchronization

Know how monitors relate to mutexes + condition variables.

No need to go language-runtime-deep.

---

# 23. Classic synchronization problems

Definitely practice:

### Producer-consumer

Tests:

- mutex
- semaphore
- bounded buffer

### Readers-writers

Tests:

- concurrency
- starvation
- preference policies

### Dining philosophers

Tests:

- deadlock
- resource ordering

Also understand sleeping barber conceptually if your coursework uses it.

---

# 24. Deadlocks

**Know cold.**

Four Coffman conditions:

1. Mutual exclusion
2. Hold and wait
3. No preemption
4. Circular wait

All four are necessary for classical resource deadlock.

Example:

```text
P1 holds A → wants B
P2 holds B → wants A
```

---

# 25. Deadlock handling

Four broad approaches:

### Ignore

Ostrich approach in some contexts.

### Prevention

Break one Coffman condition.

### Avoidance

Only enter safe resource-allocation states.

### Detection + recovery

Allow deadlock, detect it, then recover.

Know these distinctions carefully.

---

# 26. Banker's algorithm

Classic academic/interview numerical.

Understand:

- available
- maximum
- allocation
- need

\[
Need = Max - Allocation
\]

Then determine whether a **safe sequence** exists.

Important:

> Unsafe state does not necessarily mean deadlocked right now.

It means the system cannot guarantee avoiding deadlock under future requests.

---

# 27. Starvation and livelock

Don't confuse:

### Deadlock

Nobody can proceed.

### Starvation

A particular task repeatedly fails to obtain required resources/CPU.

### Livelock

Processes remain active and respond to each other but make no useful progress.

Example analogy:

```text
A moves left
B moves right

both adjust

A moves right
B moves left

repeat forever
```

---

# 28. CPU scheduling

Another major topic.

Understand:

- arrival time
- burst time
- completion time
- turnaround time
- waiting time
- response time

Equations:

\[
TAT = CT - AT
\]

\[
WT = TAT - BT
\]

Know the difference between **waiting time and response time**.

---

# 29. Scheduling algorithms

Practice numericals for:

### FCFS

Simple, can cause convoy effect.

### SJF

Shortest job first.

### SRTF

Preemptive SJF.

### Priority scheduling

Preemptive/non-preemptive.

Understand starvation + aging.

### Round Robin

Time quantum.

Understand:

> What happens if quantum is too small?

Many context switches.

> Too large?

Approaches FCFS.

Also understand multilevel queues and MLFQ conceptually.

---

# 30. Preemption

Understand:

- preemptive scheduling
- non-preemptive scheduling
- timer interrupts
- time slices

The OS needs timer interrupts so a user process can't simply retain the CPU forever.

This connects hardware → interrupts → scheduler.

---

# 31. Multicore scheduling

Conceptual interview depth:

- SMP
- per-CPU queues
- load balancing
- CPU affinity
- cache affinity
- migration cost

You don't need Linux CFS internals yet, but understanding the problems is useful.

---

# 32. Memory management fundamentals

Now the second huge OS area.

Understand:

- logical/virtual address
- physical address
- address space
- relocation
- protection
- allocation

Question:

> Why can't every process simply use physical addresses directly?

Because we want isolation, flexible placement, protection and virtual-memory abstractions.

---

# 33. Contiguous allocation

Historical but important for understanding fragmentation.

Study:

- fixed partitions
- variable partitions

Allocation strategies:

- first fit
- best fit
- worst fit

Then:

### Internal fragmentation

Allocated block larger than required.

### External fragmentation

Free memory exists but is split into unusable pieces.

Know this distinction cold.

---

# 34. Paging

**Extremely important.**

Virtual memory divided into:

```text
pages
```

Physical memory divided into:

```text
frames
```

Virtual address:

```text
page number | offset
```

Page table maps:

\[
virtual\ page \rightarrow physical\ frame
\]

Understand translation properly.

---

# 35. Page tables

Study:

- page table entry
- valid/present bit
- protection bits
- dirty bit
- referenced/accessed bit

Problem:

A process can have a huge virtual address space.

A naïve page table itself becomes huge.

This leads to:

- multi-level page tables
- inverted page tables conceptually

---

# 36. TLB

**Very important.**

Translation Lookaside Buffer caches recent address translations.

Without TLB:

```text
virtual address
 ↓
page table memory access
 ↓
actual memory access
```

With TLB hit:

```text
virtual address
 ↓
TLB
 ↓
physical address
 ↓
memory
```

Study:

- TLB hit
- TLB miss
- effective access time

And why context switches interact with TLB state; ASIDs/PCIDs can reduce flushing needs on supported architectures.

---

# 37. Virtual memory

This is bigger than simply “using disk as RAM.”

Virtual memory provides:

- private address spaces
- isolation
- protection
- flexible mapping
- demand paging
- sharing
- memory-mapped files

Understand that virtual address space can be much larger than currently resident physical memory.

---

# 38. Demand paging

Pages are loaded when required.

If page isn't resident:

```text
CPU accesses page
       ↓
Page fault
       ↓
Kernel
       ↓
Locate/back or create page
       ↓
Bring/map into physical memory
       ↓
Update page table
       ↓
Resume instruction
```

Study:

- minor vs major page faults conceptually
- page-fault handling
- demand zero pages
- disk-backed pages

---

# 39. Page replacement

If memory is full, which page gets evicted?

Study:

### FIFO

Simple but can exhibit Belady's anomaly.

### Optimal

Theoretical benchmark.

### LRU

Uses recency.

### Clock / Second Chance

Practical approximation family.

Practice page-reference-string numericals.

Know:

> Belady's anomaly.

---

# 40. Thrashing

When working sets don't fit:

```text
execute briefly
 ↓
page fault
 ↓
load page
 ↓
evict another
 ↓
page fault
 ↓
...
```

System spends more time paging than doing useful work.

Study:

- locality
- working set
- page-fault frequency
- thrashing

---

# 41. Segmentation

Memory divided according to logical regions:

```text
code
heap
stack
...
```

Address:

```text
segment | offset
```

Understand:

- segmentation
- paging
- segmentation + paging

And why paging avoids external fragmentation in physical allocation while still potentially introducing internal fragmentation.

---

# 42. Copy-on-write

This connects directly to `fork()`.

Naïve `fork()`:

```text
copy entire address space
```

expensive.

Instead:

```text
Parent pages
     ↑
 shared read-only
     ↓
Child pages
```

When either writes:

```text
page fault
 ↓
copy that page
 ↓
writer receives private copy
```

Study COW carefully.

Very common interview question.

---

# 43. `mmap`

Memory-map a file or anonymous region into virtual address space.

Conceptually:

```text
file
 ↓
virtual memory mapping
 ↓
memory-like access
```

Understand uses:

- file I/O
- shared memory
- loading executables/libraries
- anonymous mappings

Then compare:

> `read()` vs `mmap()` conceptually.

---

# 44. Heap memory and allocators

Your program asks:

```c
malloc(100);
```

but `malloc` is primarily a userspace allocator API, not itself necessarily a syscall.

Understand conceptually:

```text
malloc
 ↓
userspace allocator
 ↓
existing heap/arenas
 ↓ if more memory needed
brk / mmap
 ↓
kernel virtual memory
```

Study:

- allocation
- free
- fragmentation
- allocator metadata
- arenas conceptually

Useful bridge between C/C++ and OS.

---

# 45. Stack

Understand stack frames.

A function call may involve:

```text
arguments
return address
saved registers
local variables
```

Study:

- stack pointer
- call stack
- stack overflow
- recursion

Know:

> Stack vs heap.

Not merely “stack is faster.”

Explain allocation lifetime, layout, ownership and allocator behavior.

---

# 46. Filesystems

Third major OS area.

Understand:

```text
filename
 ↓
directory entry
 ↓
inode / filesystem metadata
 ↓
data blocks
```

Study:

- files
- directories
- metadata
- blocks
- inode concept
- file types

On Linux:

```bash
ls -i
```

can show inode numbers.

---

# 47. File descriptors

**Extremely important for backend engineers.**

When:

```c
int fd = open("file.txt", ...);
```

you receive a small integer representing an entry in the process's file-descriptor table.

Understand:

```text
Process
  │
  ├─ fd 0 → stdin
  ├─ fd 1 → stdout
  ├─ fd 2 → stderr
  └─ fd 3 → file/socket/pipe/etc.
```

Key insight:

> Sockets, pipes and many other I/O resources are exposed through file descriptors on Unix-like systems.

This connects OS and CN directly.

---

# 48. Inodes

Understand what an inode contains conceptually:

- file type
- permissions
- owner
- size
- timestamps
- link count
- pointers/references to file data

Usually **not the filename itself**.

Directory entries map:

```text
name → inode
```

Very common interview question.

---

# 49. Hard links vs symbolic links

### Hard link

Another directory entry referencing the same underlying inode/file.

### Symbolic link

A separate file containing a path/reference to another name.

Understand behavior when:

- original filename is deleted
- target is moved
- filesystem boundaries are involved

---

# 50. Filesystem allocation

Study conceptually:

- contiguous allocation
- linked allocation
- indexed allocation
- inode-based allocation

Understand:

- blocks
- free-space management
- fragmentation

You don't need ext4 implementation-level depth for ordinary interviews.

---

# 51. Filesystem caching

Disk access is expensive.

OS caches file data/pages in memory.

Understand:

- page cache
- buffered writes
- dirty pages
- flushing

This is an important connection to DBMS.

Your database may have:

```text
DB buffer pool
      ↓
OS page cache
      ↓
storage
```

depending on its I/O strategy.

---

# 52. Journaling

What happens if power dies during filesystem modification?

Study:

- filesystem consistency
- journal
- metadata journaling
- crash recovery

Conceptually compare this with database WAL.

They solve related durability/recovery problems at different layers.

---

# 53. I/O fundamentals

Understand:

- CPU-bound
- I/O-bound
- blocking I/O
- non-blocking I/O
- synchronous I/O
- asynchronous I/O

Don't casually treat:

```text
blocking = synchronous
non-blocking = asynchronous
```

as exact synonyms. They're related but distinct concepts.

---

# 54. Device I/O

Understand:

```text
Application
 ↓
syscall
 ↓
kernel
 ↓
device driver
 ↓
device controller
 ↓
hardware
```

Study:

- device drivers
- controllers
- interrupts
- DMA

### DMA

Device transfers data to/from memory with less continuous CPU involvement.

Then signals completion via mechanisms such as interrupts.

---

# 55. Blocking vs non-blocking sockets

Connect directly to CN.

Blocking:

```text
read(fd)
 ↓
nothing available
 ↓
thread sleeps
```

Non-blocking:

```text
read(fd)
 ↓
nothing available
 ↓
returns immediately
```

Then your program needs some mechanism to know when descriptors become ready.

Which leads to...

---

# 56. I/O multiplexing

**Very important for backend engineering.**

Study:

- `select`
- `poll`
- `epoll`
- `kqueue`

Conceptually:

```text
10,000 sockets
      ↓
epoll
      ↓
"these 17 are ready"
      ↓
process those 17
```

This is why you don't necessarily need 10,000 threads for 10,000 mostly-idle connections.

---

# 57. `select` vs `poll` vs `epoll`

Know conceptually.

### `select`

- older interface
- descriptor-set limitations
- repeatedly scans supplied sets

### `poll`

- avoids some `select` limitations
- still requires examining a descriptor collection

### `epoll`

Linux readiness-notification mechanism designed to scale better for large descriptor sets.

Understand:

- level-triggered
- edge-triggered

No need to memorize kernel source.

---

# 58. Event loops

Now Node.js becomes less magical.

Conceptually:

```text
Event Loop
    │
    ├── socket ready
    ├── timer expired
    ├── callback/task ready
    └── repeat
```

Understand:

- non-blocking I/O
- readiness/completion notification
- event loop
- worker pools where needed

Then answer:

> How can Node handle thousands of connections with one main JS thread?

Because network I/O doesn't require that JS thread to block waiting on every socket.

---

# 59. IPC — Interprocess Communication

Processes have isolated address spaces, so they need mechanisms to communicate.

Study:

- pipes
- named pipes/FIFOs
- message queues
- shared memory
- signals
- sockets

Compare:

```text
Pipe
Shared memory
Socket
```

in terms of:

- scope
- copying
- synchronization
- complexity
- network capability

---

# 60. Pipes

Understand:

```text
Process A
    │
   pipe
    │
Process B
```

Classic shell example:

```bash
cat file.txt | grep hello
```

The shell creates a pipe and wires:

```text
stdout(cat) → pipe → stdin(grep)
```

This is worth understanding end to end.

---

# 61. Shared memory

Usually among the fastest IPC approaches because processes can map the same memory region.

But:

```text
shared memory
     +
synchronization
```

is necessary.

Otherwise → race conditions.

Understand why shared memory trades copying overhead for synchronization complexity.

---

# 62. Signals

Unix signals:

- `SIGINT`
- `SIGTERM`
- `SIGKILL`
- `SIGSEGV`
- `SIGCHLD`

Understand:

> SIGTERM vs SIGKILL.

SIGTERM can be handled/caught by a process.

SIGKILL cannot be caught, blocked, or ignored.

Also understand why `Ctrl+C` commonly causes SIGINT.

---

# 63. Protection and security

Study:

- user/kernel separation
- process isolation
- memory protection
- access control
- users/groups
- permissions

Unix:

```text
rwx rwx rwx
```

Owner / group / others.

Understand:

```bash
chmod 755 file
```

and what the bits mean.

---

# 64. Privilege

Understand:

- UID / GID
- root
- effective UID concept
- privileged operations
- `sudo`
- setuid conceptually

Also:

> Why shouldn't your backend run as root?

Because compromise then grants far broader system privileges.

---

# 65. Virtualization

Understand:

```text
Hardware
   ↓
Hypervisor
   ↓
VM
   ↓
Guest OS
   ↓
Application
```

Study:

- Type 1 hypervisor
- Type 2 hypervisor
- VM
- guest OS
- virtual CPU
- virtual memory/device concepts

Then compare VMs with containers.

---

# 66. Containers

Important for modern backend work.

A container is **not simply a lightweight VM**.

Conceptually:

```text
Machine
   ↓
Linux kernel
 ┌───────┬───────┬───────┐
 │ App A │ App B │ App C │
 │ns/cg  │ns/cg  │ns/cg  │
 └───────┴───────┴───────┘
```

Containers share the host kernel while isolating resources/views.

Study:

- namespaces
- cgroups
- filesystem layers
- container processes

---

# 67. Linux namespaces

Understand conceptually:

- PID namespace
- network namespace
- mount namespace
- user namespace
- UTS namespace
- IPC namespace

Example:

A process inside a PID namespace can believe:

```text
PID = 1
```

while having another PID from the host's perspective.

---

# 68. cgroups

Control/account resource usage:

- CPU
- memory
- process counts
- I/O, depending on controller/configuration

Conceptually:

```text
namespace → what can I see?
cgroup    → how much can I use?
```

That distinction is extremely useful.

---

# 69. Boot process

Not top priority, but useful Linux knowledge.

Conceptually:

```text
Firmware
  ↓
Bootloader
  ↓
Kernel
  ↓
initramfs / early userspace
  ↓
init system
  ↓
services
  ↓
login/userspace
```

For modern Linux:

```text
systemd
```

is commonly PID 1.

Know this at conceptual depth.

---

# 70. Linux process introspection

Since you actually use Linux, make OS prep practical.

Understand tools like:

```bash
ps
top
htop
free
vmstat
lsof
strace
```

Especially:

### `strace`

Shows system calls.

Running:

```bash
strace ls
```

is one of the nicest ways to see:

```text
program
 ↓
syscalls
 ↓
kernel
```

in reality.

---

# 71. `/proc`

Linux exposes lots of kernel/process information through a pseudo-filesystem.

Examples:

```text
/proc/cpuinfo
/proc/meminfo
/proc/<pid>/
/proc/<pid>/fd/
```

Understanding `/proc/<pid>/fd` makes file descriptors much more concrete.

---

# 72. Resource limits

Understand:

- maximum open files
- process limits
- memory constraints

Conceptually:

```bash
ulimit
```

This matters when someone asks:

> Why can my server not accept more connections?

One possible answer is:

> You exhausted file descriptors.

Not every scalability problem is CPU.

---

# 73. Memory leaks and resource leaks

Understand:

### Memory leak

Memory remains allocated/reachable from the allocator/runtime's perspective but is no longer useful and isn't reclaimed appropriately.

### File descriptor leak

Application keeps opening descriptors without closing them.

### Thread leak

Uncontrolled thread accumulation.

Know how these eventually affect long-running servers.

---

# 74. Cache hierarchy

OS interviews often overlap computer architecture.

Understand:

```text
Registers
   ↓
L1
   ↓
L2
   ↓
L3
   ↓
RAM
   ↓
SSD
   ↓
slower storage
```

As you move downward generally:

```text
capacity ↑
latency ↑
cost per byte ↓
```

Understand:

- temporal locality
- spatial locality
- cache lines

This explains a surprising amount of performance behavior.

---

# 75. False sharing

A deeper but useful concurrency topic.

Two threads modify separate variables that happen to occupy the same cache line.

```text
Cache line:
[A][B]
 ↑  ↑
T1  T2
```

They aren't logically sharing variables, yet cache-coherence traffic can hurt performance.

Know conceptually.

---

# 76. User-space vs kernel-space networking

Useful bridge to high-performance systems.

Traditional:

```text
NIC
 ↓
kernel network stack
 ↓
socket
 ↓
application
```

Higher-performance approaches may reduce overhead through techniques such as:

- kernel bypass
- zero-copy
- io_uring-style newer Linux I/O interfaces
- DPDK conceptually

You don't need to implement these. Know why copies/syscalls/context transitions can become expensive.

---

# 77. Zero-copy

Normally data may travel through several buffers/copies.

For file transfer:

```text
Disk
 ↓
kernel
 ↓
userspace
 ↓
kernel socket
 ↓
NIC
```

Techniques such as:

```text
sendfile()
```

can avoid some unnecessary copying/user-space transitions.

This is useful for understanding high-performance servers.

---

# 78. `io_uring`

Optional but useful modern Linux knowledge.

Know the basic idea:

- submission queue
- completion queue
- asynchronous operations
- reducing syscall/dispatch overhead in appropriate workloads

Don't spend much time here until `epoll`, threads, and normal I/O are solid.

---

# What matters most for interviews

I wouldn't treat all 78 topics equally.

## Tier A — know cold

These are non-negotiable:

- process vs program
- process states
- PCB
- context switching
- `fork`, `exec`, `wait`
- zombie vs orphan
- process vs thread
- concurrency vs parallelism
- race conditions
- critical sections
- mutex
- semaphore
- synchronization
- deadlock
- Coffman conditions
- deadlock prevention/avoidance/detection
- Banker's algorithm
- starvation vs deadlock vs livelock
- CPU scheduling
- FCFS / SJF / SRTF / Priority / RR
- virtual vs physical memory
- paging
- page tables
- TLB
- page faults
- demand paging
- page replacement
- fragmentation
- virtual memory
- stack vs heap
- filesystems
- file descriptors
- IPC

These cover most classical OS interviews.

## Tier B — strong backend depth

For the roles you're targeting, I'd also know these properly:

- system calls
- user/kernel mode
- interrupts
- copy-on-write
- `mmap`
- inodes
- hard vs soft links
- page cache
- blocking vs non-blocking I/O
- `select` / `poll` / `epoll`
- event loops
- sockets as file descriptors
- pipes
- shared memory
- signals
- memory/resource leaks
- Linux permissions
- containers
- namespaces
- cgroups

## Tier C — understand conceptually

- kernel architectures
- filesystem allocation internals
- journaling details
- multicore scheduling internals
- allocators
- boot process
- false sharing
- zero-copy
- `io_uring`
- kernel bypass
- advanced virtualization internals

---

## The OS version of our “follow the chain” test

For CN, it was:

> What happens when you type a URL?

For DBMS:

> What happens when you execute a SQL query?

For OS, I'd use:

> **What happens when you run a program?**

You type:

```bash
./server
```

Eventually you should be able to walk through something like:

```text
Shell
 │
 ├─ fork / process creation
 │
 └─ exec
      │
      ▼
Executable loaded/mapped
      │
      ├─ virtual address space
      ├─ code/data mappings
      ├─ stack
      └─ shared libraries
              │
              ▼
         Process runs
              │
          system calls
              │
              ▼
            Kernel
        ┌─────┴─────┐
        │           │
     Scheduler    Memory
        │           │
       CPU       Page tables
                    │
                   TLB
                    │
                   RAM
```

Then suppose the server does:

```c
socket();
bind();
listen();
accept();
```

Now OS and CN connect.

A connection arrives:

```text
NIC
 ↓
interrupt / kernel processing
 ↓
network stack
 ↓
socket receive structures
 ↓
fd becomes ready
 ↓
epoll
 ↓
event loop
 ↓
application
```

Application queries PostgreSQL:

```text
socket fd
 ↓
syscall
 ↓
kernel networking
 ↓
DB server
 ↓
DB buffer pool
 ↓
page
 ↓
filesystem/storage
```

And suddenly **OS + CN + DBMS + System Design are no longer four separate subjects.**

That's the level I'd aim for. If you can explain these chains and survive follow-ups around **processes/threads, synchronization, scheduling, virtual memory, deadlocks, filesystems and I/O**, your OS preparation is deep enough for SWE/backend interviews.

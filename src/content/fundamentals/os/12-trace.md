@part XII | The complete server trace | A program becomes a server through process creation, address translation, scheduling, descriptors, readiness, files and resource limits. Each layer contributes a different guarantee, and a failure at one layer changes the next observable state. We will walk Finch's two-core request from fork to container quota and close with the complete mental model. | where:12

## 50. Starting the server

The shell forks, and the child inherits the descriptors needed for its environment. The child calls exec, which replaces its image, maps code and libraries, creates a stack and establishes virtual-memory permissions. The parent waits or continues its prompt. The process now has a PID, PCB, address-space context and descriptor table.

The first instruction may fault in a code page or demand-zero data. The kernel maps a frame, updates the page table and retries. The scheduler places the runnable process on a ready queue, and one of 2 cores eventually runs it. This path connects process creation, memory and scheduling before the server accepts one client.

A successful exec continues in the newly loaded program and does not return to the old image. The executable loader establishes mappings before every backing page necessarily becomes resident. This is why first use can still enter a page-fault path after the process is already runnable. The initial stack carries the program's startup information under its platform convention, while libraries and the runtime may perform further setup before the server's own main routine runs.

Inherited resources need an explicit policy. The child can keep standard streams while unrelated descriptors are marked close-on-exec. The parent needs to collect the child's eventual status if it retains that responsibility. Otherwise a working server launch can still accumulate lifecycle records or keep an unintended pipe open. The process trace therefore includes both what execution inherits and what the launch path deliberately closes.

## 51. Accepting connections

The server creates a socket, binds an address, listens and calls accept. Each accepted connection becomes a descriptor, consuming one entry from the process table. With a limit of 1,024 and 24 reserved descriptors, the declared 1,000 connections fill the working allowance exactly.

The NIC receives packets, the driver and DMA path place bytes in kernel buffers, and the network stack associates them with a socket. The kernel marks a descriptor ready. A blocked event loop wakes, reads available bytes and returns to its wait. Idle connections remain represented without consuming a running core.

@fig os_network_path | Illustrative packet moves from NIC through kernel networking and socket buffers until an fd becomes ready. Orange marks readiness because it wakes user work.

The listener is a descriptor too and is included in the declared reserve rather than in the thousand accepted connections. Listening creates a place for connection handling; accepting returns the application handle for a particular connection. A connection waiting in kernel queues does not yet have to consume a separate running application thread. Application admission must account for accept errors and limits instead of assuming every incoming connection becomes a usable handle.

Readiness says an operation can make progress under the current socket state. It does not promise a complete request or successful business result. A read can return a partial message or closure, and the parser must preserve state between notifications. At shutdown, the server stops admitting connections, defines how existing requests finish and closes each owned resource. Socket closure and child collection solve different lifetime obligations.

## 52. Scheduling request work

Twenty descriptors are ready while 980 are idle. The event loop dispatches short callbacks, and the scheduler may run other processes or threads on the second core. If a callback blocks on a file or lock, it stops serving unrelated descriptors even though the sockets are non-blocking.

The scheduler's metrics now have operational meaning. Response time is the delay before a ready callback starts, waiting time is ready work without a core, and turnaround includes the full request. A cgroup can throttle a container after 50 ms in a 100 ms period, increasing ready time without changing application code.

@fig os_complete_trace | Illustrative complete trace joins process creation, scheduling, translation, readiness, file access and cgroup budget. Orange marks file and cache work because it is where the request leaves pure CPU execution.

For the arithmetic example, suppose twenty independent jobs have actually entered an application work queue serviced by two worker threads. Then two can execute simultaneously and eighteen remain pending at that instant. This is a declared worker model, not an inference from the twenty ready descriptors. A single event-loop thread would execute one callback at a time even on the same two-core machine.

The container's quota is another ceiling. Both workers can consume the same aggregate 50 ms budget, exhausting it sooner in wall time when they run together. During throttle, ready work can wait despite an otherwise idle host core. Inspect runnable state, worker queue ownership and quota counters separately. CPU availability at the machine layer does not grant CPU entitlement to every cgroup, just as socket readiness does not grant a dedicated thread.

## 53. Reading a file and translating memory

The callback calls read on a descriptor. The kernel checks the descriptor and destination pointer, then copies bytes into the process's buffer. The TLB can hit at 110 ns or miss at 210 ns in the declared model, whose weighted average is 120 ns. A missing page enters the fault path and may wait for storage.

Opening the file resolved its name through directory entries and inode metadata. The later descriptor read can obtain cached bytes without device I/O. A cache miss invokes allocation, driver and DMA work. Dirty data later crosses the filesystem's writeback and journaling boundary.

The descriptor already refers to an open resource. A `read` on that descriptor ordinarily does not repeat the original path lookup, although opening the file required directory and inode resolution. The destination buffer is a virtual mapping whose permission and residency must be checked. An explicit read transfers bytes into that buffer; mapping the file is a different API and should not be described as an interchangeable action of the same call.

A TLB hit in the declared model costs 110 ns, not the weighted 120 ns average over hits and misses. A miss costs 210 ns under the single-level table assumption. Those tiny modeled times exclude a page fault needing storage. Mixing the average translation cost with a fault's much larger backing operation would hide the actual wait. The filesystem page cache and the process's translation cache are separate caches with separate purposes.

## 54. IPC and worker coordination

The event loop may send a job through a pipe or socket to a worker process, share a memory region with a helper, or signal a child on exit. A pipe preserves byte order but needs descriptor closure to signal end of file. Shared memory needs the same mutex and condition-variable reasoning as threads.

The kernel provides isolation between processes, but IPC creates an explicit channel. The channel's buffer can fill, making a non-blocking write return immediately or a blocking writer sleep. That state belongs in the trace because the request can be ready in user logic while blocked on IPC.

A non-blocking write to a full pipe returns a would-block result; it does not secretly complete the transfer. The sender must retain the unsent data and arrange another readiness opportunity. A blocking writer sleeps until the pipe can accept data or another outcome occurs. Closing all write references lets the reader observe end-of-file after it drains remaining bytes, which makes reference ownership part of the shutdown protocol.

With shared memory, both processes can see the region without using a pipe for every message. They still need a rule for which slot contains complete data and who may overwrite it. A mutex and predicate wait can express that contract for a bounded queue. A crashed participant also needs a defined recovery policy. Fast shared access cannot supply one merely because both page tables name the same physical frame.

@fig os_ipc | Illustrative IPC choices separate byte streams, shared mappings and message boundaries. Orange marks sockets, which support local or network communication under their protocol.

## 55. Failure boundaries

A leaked descriptor can exhaust the 1,024 limit before CPU saturation. A page fault can make a short callback wait on storage. A deadlock can leave sleeping threads blocked on locks, while a spin-based wait may remain runnable. A cgroup quota can delay work after its 50 ms allowance, and a SIGTERM can begin a graceful shutdown while SIGKILL cannot be handled.

Each diagnosis asks which queue or ownership rule stopped progress. `strace` reveals syscall boundaries, `/proc/<pid>/fd` reveals descriptor ownership, page-fault counters reveal memory pressure, and scheduler or cgroup data reveals CPU wait. The tool is useful only when tied to a mechanism.

First separate a process waiting in the kernel from a thread spinning in user code. A sleeping lock waiter is blocked, while an incorrectly designed spin loop may remain runnable and waste CPU without useful progress. Deadlock does not require every participant to look runnable. Ownership evidence, rather than CPU usage alone, distinguishes the cycle from ordinary contention.

Then preserve evidence around the first exhausted resource. Descriptor failure can appear at accept even when the listener still exists; quota throttling can delay every worker despite low host utilization. A major fault can block file or memory access inside a callback whose network socket was ready. Signal-driven shutdown must release references and collect children through safe code paths. A catchable termination request permits that policy, while an uncatchable kill requires external recovery from whatever persistent state survived.

## 56. The application-to-hardware map

The complete chain is application, system call, kernel subsystem and hardware. The application names intent. The syscall carries checked arguments across the privilege boundary. Processes and scheduler state choose who runs, virtual memory maps names to frames, filesystems map names to blocks, networking maps packets to sockets, and devices move bytes through drivers and DMA.

The final question is always a contract question. Which state is protected, which resource is owned, which event makes progress possible, and which boundary makes the result durable or visible? Finch's 1,000 descriptors, 20 ready descriptors, 2 cores, 13,396 virtual address, 37,972 physical address, 1,024 descriptor limit and 50 ms quota are one connected trace, not separate trivia.

:::interview Interview lens
**"Walk me through a request on a Linux server."** The process was forked and exec loaded its image, the scheduler ran it, and virtual memory translated its pointers through a TLB and page table. The NIC and driver placed data into socket buffers, epoll reported ready descriptors, and the application called read. A file lookup then used descriptors, inodes, page cache and possibly DMA, while cgroups and limits constrained the work.
:::

:::note What this chapter leaves out
The trace does not specify one Linux kernel version, filesystem implementation, CPU microarchitecture or storage device. Those details change defaults and costs, so production claims need the relevant primary documentation and measurements.
:::

| Layer | Its contribution | What it cannot establish alone |
|---|---|---|
| Application | Request meaning and resource ownership | Privileged device access |
| System call | Checked operation and arguments | Unlimited capacity |
| Scheduler | Select runnable execution | Correct application synchronization |
| Virtual memory | Translate and protect mappings | Application object lifetime |
| Filesystem | Names, blocks and persistence policy | Database transaction meaning |
| Readiness interface | Report possible I/O progress | Completed application request |
| Driver and DMA | Transfer under buffer ownership | Authorization of user intent |
| Cgroup and limits | Bound admitted resource use | Absence of resource leaks |

The chapter has not implemented a production scheduler, a filesystem recovery engine or a CPU cache-coherence protocol. Those implementations determine further costs and guarantees. The trace supplies the questions needed to study them without confusing a fast interface with a correct application outcome.


:::story Picture this
A customer's ticket passes from the front desk to a work queue, then to a bench and finally to the records desk. A ticket can wait at each handoff for a different reason. Counting all tickets in the building does not count the workers using benches. Trace the owner and the event that releases each wait before adding more workers.
:::

:::note Ownership during shutdown
Closing the listener stops new admission but leaves accepted connections, worker jobs and child status. Graceful shutdown needs a defined owner for each remaining resource and a bounded policy for completing or cancelling it.
:::

:::warn Watch out
A ready socket is not a scheduled thread, and an idle host core does not override a container quota. Trace descriptor readiness, application queues, runnable threads and resource entitlement separately before deciding where progress stopped.
:::

:::key In one breath
Running a server is one path through process creation, scheduling, address translation, descriptors, readiness, files, devices and limits. Each layer owns a different state and failure mode. The application-to-system-call-to-kernel-to-hardware map is the mental model that joins the syllabus.
:::

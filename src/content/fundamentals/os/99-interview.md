@chapter faq | Interview question bank | Questions that test the mechanism, not a memorized label.

### OS fundamentals

**Q1. What is the difference between an OS and a kernel?**

The kernel is the privileged core that enforces resource and protection rules. The OS also includes shells, libraries, services and utilities.

**Q2. Why separate user and kernel mode?**

The processor restricts privileged instructions and protected memory to kernel mode. A system call gives user code a checked entry path.

### Processes and system calls

**Q3. What is a process?**

It is a live execution with an address-space view, saved state and resource references. A program file is passive.

**Q4. What belongs in a PCB?**

Identity, program counter, registers, scheduling state, memory context, open resources and accounting or security state. The record references resource state rather than copying every memory byte on a switch.

**Q5. Why can a process be ready but not running?**

Ready means it can run but awaits a CPU. On 2 cores, a third runnable task must wait.

**Q6. What does a context switch cost?**

The kernel saves and restores state, changes address-space context and can lose cache and TLB locality. The saved context must belong to the selected address space before execution resumes.

**Q7. Explain fork, exec and wait.**

Fork creates a child, exec replaces one process image, and wait collects a child's exit status. A shell combines all three.

**Q8. Zombie versus orphan?**

A zombie has exited but awaits status collection. An orphan's parent exited while it is still alive and it is reparented.

### Fork, exec and threads

**Q9. Why are threads cheaper than processes?**

They share an address space and many resources, so setup and communication can avoid a separate map. The same sharing increases fault and race impact.

### Concurrency and synchronization

**Q10. Concurrency versus parallelism?**

Concurrency is interleaved or overlapping progress. Parallelism is simultaneous execution on separate resources.

**Q11. Why is counter increment not automatically atomic?**

It can load, add and store, so another thread can read between those operations. Synchronization must cover the whole read-change-write invariant.

**Q12. State the critical-section requirements.**

Mutual exclusion, progress and bounded waiting. The implementation must protect the invariant, not a convenient line.

**Q13. Mutex versus semaphore?**

A mutex represents ownership of exclusion. A semaphore represents permits or signaling and may count beyond one.

**Q14. Why wait on a condition in a loop?**

A wakeup only says the state may have changed. Another thread can consume the condition before the waiter reacquires the mutex.

**Q15. What does CAS provide?**

It changes a word only if it still equals an expected value. Failure exposes interference and permits a retry.

**Q16. What does a monitor package?**

Shared state, mutual exclusion and condition synchronization in one abstraction. A condition wakeup still requires a predicate recheck under the monitor's mutex.

### Deadlocks

**Q17. Name the four Coffman conditions.**

Mutual exclusion, hold and wait, no preemption and circular wait. Their simultaneous presence permits deadlock; an observed cycle and the resource model establish the actual blocked state.

**Q18. Unsafe versus deadlocked?**

Unsafe means no future completion order is guaranteed under the claims. Deadlocked means an actual wait cycle prevents progress.

**Q19. Starvation versus livelock?**

Starvation denies one task while others progress. Livelock keeps tasks active but their actions produce no useful progress.

**Q20. Why does resource ordering help?**

It prevents circular wait by requiring every path to acquire locks in one global order.

### CPU scheduling

**Q21. What is turnaround time?**

Completion time minus arrival time. Waiting time is turnaround minus CPU burst.

**Q22. Why can SJF starve a long job?**

If short jobs keep arriving, the long job can remain behind them indefinitely. Aging can raise its priority.

**Q23. Why does a small round-robin quantum cost more?**

It creates more timer events and context switches. A large quantum approaches FCFS.

**Q24. What does multicore affinity trade?**

Affinity preserves cache locality but can leave one CPU idle. Migration balances load while losing locality.

### Memory

**Q25. Compute Finch's physical address.**

VPN 3 maps to frame 9 and offset 1,108 stays unchanged. $9\times4096+1108=37972$.

**Q26. Why use a TLB?**

It caches recent translations so a hit avoids a page-table memory access. The model's 90 percent hit rate gives 120 ns effective time.

**Q27. What is a page fault?**

A translation or protection failure transfers control to the kernel. The kernel can repair a permitted demand mapping or copy-on-write access, but an illegal access must fail rather than acquire arbitrary memory.

**Q28. Explain Belady's anomaly.**

For FIFO, adding a frame can increase faults. The supplied trace gives 9 faults with 3 frames and 10 with 4.

**Q29. What is thrashing?**

The system spends most of its time faulting because active working sets exceed resident memory. Reducing admitted work can recover locality instead of adding still more paging pressure.

### Copy-on-write and mappings

**Q30. Why use copy-on-write?**

Fork can share pages read-only and copy only pages a writer changes. Eight pages grow from 32,768 to 36,864 bytes after one copy.

### Filesystems

**Q31. Does an inode contain a filename?**

Usually no. A directory maps the filename to the inode, which stores metadata and data references.

**Q32. Hard link versus symbolic link?**

A hard link names the same inode. A symbolic link stores a path and can dangle.

**Q33. Why are sockets file descriptors?**

The kernel gives many I/O resources a uniform process-local handle and operation interface. Their readiness and buffering semantics still differ.

### I/O, IPC and event loops

**Q34. Blocking versus non-blocking?**

Blocking waits in the caller when progress is unavailable. Non-blocking returns immediately, often with a would-block result.

**Q35. How does epoll help?**

It reports ready descriptors so one thread need not block on each of many idle sockets. Finch processes 20 ready connections among 1,000 open ones.

**Q36. What does DMA change?**

The device moves bytes to a kernel buffer with less CPU copying, then interrupts report completion.

**Q37. Pipe versus shared memory?**

A pipe gives ordered kernel-buffered bytes. Shared memory avoids copies but requires explicit synchronization.

### Protection and Linux

**Q38. What does `755` mean?**

Owner has read, write and execute, while group and others have read and execute. The digits are 7, 5 and 5.

**Q39. Namespace versus cgroup?**

A namespace changes what a process can see. A cgroup limits how much resource it can use.

**Q40. Why is a container not a VM?**

Containers share the host kernel. A VM includes a guest kernel behind a hypervisor.

**Q41. What does `/proc/<pid>/fd` show?**

It exposes links for the process's open descriptors, making ownership and leaks inspectable. Count and classify references over time before deciding which owner failed to release them.

**Q42. Why can a server hit a limit while CPU is idle?**

It may exhaust descriptors, memory, process counts or a cgroup quota before using all CPU. Check the exhausted resource and ownership path before adding CPU capacity.

**Q43. What is false sharing?**

Two threads update separate variables on one cache line, causing coherence invalidations. Separate ownership or layout can reduce that traffic without repairing an actual shared-counter race.

**Q44. What does zero-copy avoid?**

It avoids selected user-space buffer copies or transitions. It does not remove device, cache or network costs.

### The complete server trace

**Q45. Walk through a request.**

Fork creates a child and exec replaces its image, then the scheduler gives its thread CPU time. The NIC and kernel make a descriptor ready, epoll reports it, and the application dispatches a callback. File or database work can then enter cache, fault or device paths under its separate operation contract.

### Graded exercises

@chapter exercises | Exercises | Solve from the declared running example and the exact OS numbers.

**E1** ● Compute Finch's idle connections from 1,000 total and 20 ready.

**E2** ● Compute physical address for frame 9, page 4,096 and offset 1,108.

**E3** ● Compute the flat page-table bytes from 1,048,576 entries of 4 bytes.

**E4** ● Compute TLB effective time with hit rate 0.9, TLB 10 ns and memory 100 ns.

**E5** ● Compute FIFO faults with 3 frames from the supplied trace.

**E6** ● Compute the FIFO anomaly difference between 4 and 3 frames.

**E7** ● Compute COW bytes after one copied page from 8 pages of 4,096 bytes.

**E8** ● Compute internal waste from a 10,000-byte allocation in 3 pages of 4,096 bytes.

**E9** ● Compute Finch's unreserved descriptor capacity from limit 1,024 and reserve 24.

**E10** ● Compute container quota fraction from 50 ms per 100 ms.

**E11** ●● Compute FCFS waiting times for A, B and C from the exact FCFS schedule.

**E12** ●● Compute round-robin completion order using quantum 2 ms.

**E13** ●● Explain without equations why a ready socket does not imply a running thread.

**E14** ●● Explain without equations why a zombie is not an orphan.

**E15** ●● Explain without equations why `exec` does not create a process.

**E16** ●●● Prove that FIFO can have more faults with 4 frames than 3 using the supplied counts.

**E17** ●●● Prove that a global lock order prevents circular wait.

**E18** ●●● Write pseudocode for a mutex-protected counter increment.

**E19** ●● Compare pipe and shared memory for a producer-consumer design.

**E20** ●●● Design a leak diagnosis using `/proc`, descriptor counts and a release path.

**E21** ●● Compute the total bytes for 8 COW pages before fork and after one copy.

**E22** ●● Compute all three FCFS turnaround times.

**E23** ●● Compute all three SRTF waiting times.

**E24** ●● Explain why a non-blocking callback can still block the event loop.

**E25** ●●● Full sizing: Finch has 1,000 connections, 20 ready descriptors, 2 cores, a 1,024-descriptor limit with 24 reserved, and aggregate CPU quota of 50 ms per 100 ms. Reconcile descriptor headroom and CPU share of both one core and the whole host. Evaluate quota exhaustion with two busy workers, and distinguish a single event loop from twenty queued worker jobs.

@chapter solutions | Worked solutions | Numeric answers are computed and asserted in os-numbers.py. Non-integral displayed results are rounded to six decimal places.

**E1.** $1000-20=980$ idle connections.

**E2.** $9\times4096+1108=36864+1108=37972$.

**E3.** $1048576\times4=4194304$ bytes.

**E4.** A hit costs $10+100=110$ ns. A miss costs $10+100+100=210$ ns. The average is $0.9\times110+0.1\times210=99+21=120$ ns.

**E5.** The three-frame trace faults on references at positions 1, 2, 3, 4, 5, 6, 7, 10 and 11, counting nine. Positions 8, 9 and 12 hit, so $12-3=9$ faults.

**E6.** $10-9=1$ additional fault with four frames.

**E7.** Eight pages occupy $8\times4096=32768$ bytes. One copied page adds 4096, giving $32768+4096=36864$ bytes.

**E8.** Three pages provide $3\times4096=12288$ bytes. Waste is $12288-10000=2288$ bytes.

**E9.** $1024-24=1000$ descriptors.

**E10.** $50/100=0.5$, or half of one CPU on average; across a two-core host that is 25 percent of ideal total capacity.

**E11.** A waits $0$, B waits $5-1=4$, C waits $8-2=6$. The mean is $(0+4+6)/3=10/3=3.333333$.

**E12.** The exact intervals are A 0 to 2, B 2 to 4, C 4 to 5, A 5 to 7, B 7 to 8, A 8 to 9. Completion order is C, B, A.

**E13.** Ready means the descriptor can make progress, while running means a core is executing its task. Two cores permit at most two execution contexts, but a single event loop can handle those ready sockets one callback at a time.

**E14.** A zombie has ended and retains status. An orphan is still alive after its parent exits and is reparented.

**E15.** Exec replaces code, data, mappings and entry point in the calling process. The PID remains, so no new process exists.

**E16.** With three frames, hit positions are 8, 9 and 12, leaving $12-3=9$ faults. With four frames, only positions 5 and 6 hit, leaving $12-2=10$ faults. Thus the same reference string under FIFO has $10>9$ faults after capacity increases, which is a counterexample to the claim that adding frames always helps FIFO. OPT or LRU require their own policy argument rather than inheriting this result.

**E17.** Assume every lock is acquired in ascending order. A circular wait would require one edge from a higher lock to a lower lock, contradicting the rule. Therefore circular wait cannot occur, so the four-condition deadlock cannot form.

**E18.**

```python
import threading

mutex = threading.Lock()
counter = 10

def increment():
    global counter
    with mutex:
        counter += 1
```

Every reader and writer of the invariant must use the same mutex.

**E19.** A pipe gives ordered kernel-buffered bytes and simple ownership. Shared memory avoids copies but needs a separate protocol for visibility, mutual exclusion and shutdown.

**E20.** Record `/proc/PID/fd` counts over time, compare them with 1,024, identify descriptors whose owner path never closes, and add a close or lifetime handoff at the owning boundary. A larger limit hides the leak rather than fixing it.

**E21.** Before fork, $8\times4096=32768$ bytes. After one copy, $9\times4096=36864$ bytes.

**E22.** A completes at 5 and arrives at 0, so TAT is 5. B completes at 8 and arrives at 1, so TAT is 7. C completes at 9 and arrives at 2, so TAT is 7.

**E23.** The supplied SRTF rows give A waiting 4, B waiting 1 and C waiting 0. The mean is $(4+1+0)/3=5/3=1.666667$.

**E24.** Non-blocking applies to the socket call. The callback can still perform a blocking file read, wait on a lock, or run CPU work for a long time, preventing the loop from servicing other ready descriptors.

**E25.** Two cores permit at most two execution contexts at once; a single event-loop thread still invokes callbacks sequentially. Idle connections are $1000-20=980$. Working descriptor allowance is $1024-24=1000$, so headroom after admitting all connections is $1000-1000=0$. Aggregate CPU quota is $50/100=0.5$ CPU on average, which is $0.5/2=0.25$, or 25 percent, of the two-core host's ideal capacity. Two busy workers consume 50 ms of aggregate CPU in $50/2=25$ ms of wall time, leaving $100-25=75$ ms until the next fixed period. These figures assume no extra allowance or outside constraint. If twenty independent jobs are queued to those two workers, $20-2=18$ are initially pending. Twenty ready sockets alone do not imply that worker topology.

### Primary sources

[Linux fork](https://man7.org/linux/man-pages/man2/fork.2.html) defines child creation and inherited references. [Linux mmap](https://man7.org/linux/man-pages/man2/mmap.2.html) distinguishes private and shared mappings. [Linux epoll_wait](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) defines readiness results. [The cgroup v2 CPU controller](https://docs.kernel.org/admin-guide/cgroup-v2.html) defines aggregate quota and period controls. All numerical costs here remain illustrative inputs.

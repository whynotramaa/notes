@part I | OS fundamentals | An operating system turns shared hardware into controlled resources for programs. Without a protected boundary, one process can overwrite another process or keep every other task from running. We will move from the user program through the kernel to the hardware and compare the kernel designs that place services on that path. | where:1

## 1. OS responsibilities and operating modes

Finch has 1,000 open connections but only 2 cores, so a program cannot simply claim a core, a memory address, or a device forever. An **operating system** is the privileged software that allocates those resources and presents stable operations to less trusted programs. It schedules execution, translates addresses, names files, moves device data and checks permissions. The word OS is broader than kernel. Shells, libraries, services and utilities are part of the working system, while the kernel is the privileged core that enforces the hardware boundary.

The kernel gives the application abstractions such as a process, a file descriptor and a virtual address. These abstractions hide physical placement without hiding the cost. A socket descriptor still consumes a table entry, and an idle connection still consumes memory. The running example separates 980 idle connections from 20 ready ones because the OS can wait for readiness instead of giving every connection a running thread.

@fig os_boundary | Illustrative machine cutaway. Application intent crosses the controlled system-call boundary before the kernel validates the request and acts on cores, memory or devices.

Resource management answers who runs, where bytes live and which device receives a request. **Isolation** keeps those answers local to each process or container. Protection fails if a user process can write a page-table entry or program a device without a kernel check.


### OS types


Finch's server needs several programs to make progress while others wait. **Multiprogramming** keeps several programs in memory so the CPU can run another when one waits for I/O. **Multitasking** adds the policy and mechanism for switching among runnable tasks, often with timer interrupts. **Multiprocessing** means the machine has multiple processors or cores that can execute at the same time. **Multithreading** means one process has multiple execution contexts that share process resources.

These terms describe different axes. A one-core machine can multitask without parallel execution. A two-core machine can run two threads simultaneously, but it still needs scheduling and protection. Time-sharing emphasizes interactive response by dividing CPU time among users or tasks. Batch systems optimize throughput for queued jobs, while real-time systems make deadline guarantees part of the contract. Distributed operating systems coordinate multiple machines as a more unified system, though most modern distributed applications expose machine boundaries explicitly.

@fig os_concurrency_parallel | Illustrative execution strips. One core interleaves A and B, while separate cores can execute them together. The strips show the distinction rather than measured task durations.

The distinction matters when a claim says "the server handles 1,000 connections at once." It may mean 1,000 descriptors exist, 20 descriptors are ready, or 2 callbacks are executing. Those are different counts with different memory and CPU costs. The OS turns the workload into states and queues before any performance claim is meaningful.

## 2. Kernel architectures

A faulty driver can damage shared privileged state or fail inside a separate service, depending on its placement. A monolithic kernel places many services in one privileged address space. Linux is broadly monolithic but supports loadable modules, so "monolithic" does not mean every feature is compiled into one immutable binary. A **microkernel** keeps the privileged core small and moves more services into isolated processes that communicate through messages. A **hybrid kernel** combines choices, retaining some services in privileged space for performance while using separate boundaries elsewhere.

The trade-off is not a simple speed-versus-safety slogan. A message between isolated services can add copying, scheduling and failure handling. A service inside the kernel can call internal data structures quickly, but a bug can corrupt the whole kernel. Modular kernels change the deployment unit without necessarily giving a driver the same isolation as a user process. The right comparison asks where a failure stops, how data crosses the boundary, and which latency the workload can afford.

@fig os_kernel_types | Illustrative architecture cutaways compare placement of services and the cost of crossing between them. Orange marks the monolithic path used as the running reference.

History explains why no design won universally. Early systems valued direct hardware control, while later systems needed drivers, portability and stronger fault boundaries. Modern operating systems also use hardware virtualization, sandboxing and namespaces, so a production system can combine monolithic kernel services with many user-space isolation layers.

## 3. System calls and controlled entry

When Finch calls `read`, the application does not receive permission to inspect arbitrary RAM. The call enters a kernel-controlled path with arguments that the kernel validates. **User space** is the less privileged execution environment for applications and libraries. **Kernel space** is the privileged environment where the OS can configure page tables, service devices and change scheduling state.

The processor records a mode bit or equivalent privilege state. A user instruction that tries to alter a protected register traps instead of silently succeeding. The kernel checks the pointer, length, descriptor and current permissions before copying or mapping data. It then returns a value or an error and restores user mode. A normal function call changes the instruction pointer within one privilege level; a system call also changes the protection regime and often flushes or checks more state.

The boundary is not a security guarantee by itself. A kernel bug, a confused-deputy interface or a leaked capability can still expose data. Isolation requires page permissions, address-space separation, identity checks and careful device access. The useful mental model is an actor with authority, not a magical wall.

@fig os_syscall_entry | Illustrative syscall trace labels the argument handoff, number dispatch, kernel validation and return path. The orange arrow is the controlled mode transition.

A **privileged instruction** is one the processor restricts to kernel mode, such as changing address-translation controls or configuring interrupt delivery. The exact list depends on the architecture. Linux's system-call ABI and entry instructions vary by architecture, so a portable explanation should describe the contract rather than claim one universal opcode.

## 4. Interrupts, exceptions and traps

A packet can arrive while Finch executes an unrelated instruction. The CPU needs a way to enter the kernel without waiting for that program to call a library. An **interrupt** reports an asynchronous event, such as device completion or a timer tick. An **exception** arises from the current instruction, such as an illegal access or division error. A **trap** is a synchronous entry used for purposes such as a deliberate system call or debugging; exact terminology varies by architecture.

The processor records the interrupted execution point and enters an authorized handler. The handler acknowledges or classifies the event, updates kernel state and may make a waiting thread runnable. A timer can trigger a scheduling decision, while a packet interrupt can arrange later network processing. Returning to user code and switching to another thread are separate choices. Kernel entry does not always mean a context switch.

@fig os_event_kinds | Illustrative interrupts arrive independently of the current instruction, while exceptions and deliberate traps arise synchronously. Orange marks the deliberate entry used by the syscall model.

For Finch, arrival on one of the 1,000 sockets changes readiness, not the machine's 2-core capacity. The driver must identify the affected buffer, and the network stack must identify the socket before useful application work exists. Deferring expensive work helps keep the interrupt path bounded. A page fault differs again because the kernel must determine whether the current access is legal and whether the instruction can resume after repairing the mapping.

:::story Picture this
A workshop keeps its tools in locked cabinets. Visitors request a named tool at a counter, and the clerk checks whether they may borrow it. A bell announces a delivery independently of the current visitor. The request is controlled entry, the cabinet rule is protection, and the bell is an interrupt rather than another visitor's request.
:::

:::note Library calls and system calls
A library function executes in user space until it invokes a kernel entry. An allocator can satisfy a request from existing memory without making a syscall. Compare the wrapper's work with the privileged operation before counting boundary crossings.
:::

:::warn Watch out
An interrupt or syscall does not necessarily replace the running thread. A handler can return to the same context. A scheduler switch must save one execution context and select another.
:::

:::interview Interview lens
**"How does a program reach protected hardware?"** It invokes a controlled entry with a defined operation and arguments. The processor changes privilege and the kernel checks resources, pointers and permissions. Devices can also request service through interrupts, while illegal instruction behavior enters through an exception.
:::

:::key In one breath
The OS supplies abstractions, allocation and protection around shared hardware. User and kernel modes limit who may change privileged state, while kernel architectures decide which services share that privilege. System calls request controlled work; interrupts and exceptions enter for different events. Kernel entry and a scheduling switch are separate operations.
:::

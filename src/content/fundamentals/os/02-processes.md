@part II | Processes and system calls | A process is the OS's record of one executing program image, not merely a file on disk. Without process state, the kernel could not stop one task and resume another or collect its exit status. We will trace memory layout, PCB fields, state transitions, context switching, fork, exec and wait in dependency order. | where:2

## 5. Processes and memory layout

Running `./server` creates an executing process from a passive executable. The **process** owns an address-space view, an execution state and references to resources. Its **text** holds instructions, **data** holds initialized writable globals, **BSS** represents zero-initialized storage, the heap serves dynamic allocation, and the stack holds call frames. These regions are logical parts of one virtual address space, not promises that the bytes occupy adjacent physical RAM.

The stack grows as calls create frames and returns discard them. The heap persists allocations until the program or allocator releases them. A buffer allocated on the heap can outlive the function that requested it, while a local stack variable cannot safely outlive its frame. The kernel records mappings and permissions, but a user-space allocator manages many heap requests before it asks the kernel for more virtual memory.

@fig os_process_image | Illustrative process image separates code, static storage, heap lifetime and call-stack lifetime. Orange marks heap growth because it depends on allocator and kernel interactions.

When Finch's child later calls `exec`, the process identity can remain while the old image disappears. That distinction lets a shell create a child, load a new program into it and still wait for the same child. A process is therefore a live contract around execution and resources, not an immutable executable format.

:::note Address direction
The familiar stack-down and heap-up drawing describes a common virtual layout. It is a teaching model, not a universal physical placement rule.
:::

## 6. Process control blocks

The scheduler cannot save "the process" as a vague idea. It needs a **process control block**, or PCB, containing the identity, state and execution details required to stop and resume it. The PCB conceptually stores a PID, program counter, CPU registers, stack pointer, scheduling data, memory-management references, open-resource links and accounting or security information.

The program counter names the next instruction. Registers hold temporary values that the calling convention and instruction set require. The address-space context tells the CPU which translations apply. Open-resource information connects descriptor numbers to files, sockets or pipes. Security information lets the kernel check the process's identity and credentials when it requests an operation.

@fig os_pcb | Illustrative PCB groups the fields needed for identity, resumption, scheduling, memory and resources. The orange execution rows are the minimum needed to continue at the right instruction.

The PCB is not necessarily one public C struct with exactly these fields. Kernels split state across scheduler records, task structures, address-space objects and file tables. The conceptual grouping is useful because it explains why a context switch costs work in several subsystems, not only a register save.

:::interview Interview lens
**"Why does the OS need a PCB?"** It needs a retained record of a task's identity, execution point, memory map, resources and scheduling state. When the scheduler removes the task from a core, those fields let the kernel resume it later. Without them, a process could not be preempted safely.
:::

## 7. Process states

Finch's process is **ready** when it can run but waits for a core, **running** while a core executes it, and **blocked** when it waits for an event such as a socket or disk completion. A new process first needs admission and setup. A terminated process has finished execution, but its exit status may remain until the parent collects it.

The transition cause matters. A timer can move running to ready. A blocking read can move running to waiting. An interrupt or completion can move waiting to ready. The scheduler dispatches a ready task to running, while an explicit exit moves it to terminated. Suspended states add storage or memory pressure to the model, but they do not replace the core distinction between runnable and waiting.

@fig os_states | Illustrative state path labels the event that causes each transition. Orange marks running because only that state consumes a core at the moment shown.

For the server, 20 ready connections do not imply 20 running threads. On 2 cores, at most 2 tasks execute simultaneously, while the rest remain ready or wait on I/O. A useful trace records both the event and the queue, because "the process is slow" could mean CPU wait, lock wait, a page fault or a device wait.

:::warn Watch out
Waiting is not the same as ready. A blocked task cannot usefully run until its event occurs, while a ready task only lacks a scheduling turn.
:::

## 8. Context switching

When the scheduler changes from process A to process B, it saves A's registers, program counter and stack pointer, selects B, restores B's saved state and installs the relevant address-space context. A **context switch** is that change of execution context. It is necessary for sharing a core, but it is not productive application work.

The cost includes direct save and restore work plus lost locality. New instructions may miss in caches, and address translation may need TLB entries for the new address space. The OS may preserve some translation entries with address-space identifiers, but the principle remains that changing execution context has a cost. The supplied model gives a switch of 0.1 ms against a 2.1 ms total schedule span, a fraction of 0.047619, or 4.761905 percent, each rounded independently from the exact ratio.

@fig os_context_switch | Illustrative sequence shows saved state, scheduler choice, restored mapping and resumed work. Orange marks saving the interrupted execution state before another context resumes.

A smaller time slice improves response but increases switch frequency. A larger slice lowers overhead but lets one task delay another. Multicore scheduling adds migration cost when moving a task to balance cores, especially when its cache data stays behind.

:::note What is not saved
The kernel does not copy an entire process memory image on every switch. It changes the saved CPU state and address-space reference, leaving memory pages in place.
:::

:::story Picture this
A mechanic leaves a repair bench with a card recording the unfinished step and tools in use. Another mechanic can resume only if that card belongs to the right repair and its parts are still present. The execution record is the PCB, the interrupted repair is the saved context, and the bench is the core being reassigned.
:::

:::key In one breath
A process is a live execution and resource record built from a program image. The PCB holds the state needed to schedule and resume it. State transitions identify why work is runnable or waiting, and a context switch pays both direct save cost and lost locality.
:::

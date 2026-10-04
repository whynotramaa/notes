@part III | Fork, exec and threads | A shell needs a way to create a child without losing its own prompt. Threads then let one process overlap work while sharing an address space. We will trace fork's copy-on-write pages, exec's replacement, wait's cleanup, and the ownership choices that distinguish processes from threads. | where:3

## 9. Fork and parent-child execution

`fork()` returns twice because the kernel creates a child process that continues at the instruction after the call. The parent receives the child's PID, the child receives zero, and failure returns negative one to the caller. The two processes have separate execution state but initially similar memory mappings and inherited resource references.

The kernel does not need to copy every page immediately. It marks shared writable pages so a write causes a protection fault; the fault handler allocates a private page and copies the old bytes. This **copy-on-write** scheme makes a fork followed quickly by exec cheaper than eagerly copying the entire image. In the running model, 8 pages occupy 32,768 bytes before the child writes and 36,864 bytes after one page becomes private.

@fig os_fork_cow | Illustrative fork shares eight pages until a write creates one private copy. Orange marks the writer's private page after the fault changes sharing.

File descriptors are inherited as references to open-file state, so parent and child can share file offsets or socket endpoints according to the kernel's descriptor semantics. That inheritance is useful for shell pipelines and servers, but it also means a forgotten descriptor can keep a pipe from reaching end of file.

:::warn Watch out
Fork does not mean "run the child from the beginning." Both flows continue after the fork, and the return value tells them which flow they occupy.
:::

## 10. Exec replaces the process image

`exec` creates no process. It replaces the calling process's program image with a new executable, mapping its text, data, stack and shared libraries and setting a new entry point. The PID and many process relationships remain, which is why a shell can fork once, exec `ls` in the child and wait for that child.

The replacement discards the old user-space code and data, but descriptor inheritance follows close-on-exec rules. A descriptor marked close-on-exec does not survive, while ordinary inherited descriptors can connect the new program to a pipe or socket. The loader also validates the executable format and prepares the initial stack with arguments and environment.

@fig os_exec_image | Illustrative fork creates a child, while exec changes only the child image. Orange marks the loader because it installs the new address space.

The distinction matters for security and debugging. A failed exec returns to the old image, so the child must report the error and exit rather than pretending the target ran. A successful exec never returns to the old instruction stream.

:::interview Interview lens
**"What is the difference between fork and exec?"** Fork creates another process and returns in both parent and child. Exec replaces the calling process image and returns only on failure. A shell combines them so the parent remains interactive while the child becomes the requested command.
:::

## 11. Wait, zombies and orphans

When a child exits, the kernel keeps a small termination record containing its status until the parent collects it. That retained process is a **zombie**. `wait()` or `waitpid()` copies the status to the parent and releases the record. A zombie is not consuming its former address space, but a large accumulation can exhaust process-table capacity.

If a parent exits while its child continues, the child becomes an orphan and is reparented to a system process or supervisor that can collect it. Orphan and zombie describe different events. An orphan may continue running normally. A zombie has already stopped and only awaits collection.

@fig os_wait_reap | Illustrative trace separates exit, retained status, wait, reparenting and collection. Orange marks the `wait` action that releases the record.

A server should install a deliberate child-reaping path instead of assuming the shell will do it. Signals such as `SIGCHLD` can notify a parent, but the handler or event-loop integration must still collect all available statuses safely.

:::note Exit status
The status record is useful information, not dead memory. A parent can distinguish normal exit from signal termination and record that result for supervision.
:::

## 12. Threads and shared process resources

A **thread** is an execution path inside a process. Each thread needs its own stack, registers and program counter, while threads share the process's code, heap, globals, address space and many open resources. This sharing removes some process-creation and communication cost, but it also makes a stray write visible to sibling threads.

On common one-to-one models, the kernel schedules each thread as an execution entity and can place threads from one process on both cores. A many-to-one user-thread runtime cannot obtain the same parallelism because the kernel sees only one schedulable entity. Many-to-many models multiplex user threads over kernel entities, trading runtime complexity for flexible mapping.

@fig os_threads | Illustrative private stacks and registers sit beside shared code, heap and resource state. Orange marks the shared heap because it creates synchronization obligations.

Threads are not automatically faster. They can reduce address-space setup, but contention, cache traffic and coordination can dominate. Processes provide stronger fault isolation, while threads make low-latency shared-memory communication easy and dangerous at the same time.

### Process versus thread

Finch can put a worker in a separate process or add a thread to the current process. Separate address spaces provide an isolation boundary: one process cannot directly dereference another's private pointer. Threads instead communicate through shared memory and share descriptor resources, which reduces some setup costs while making ownership mistakes easier. A thread crash can terminate the whole process rather than only that task.

### User threads and kernel threads

A many-to-one runtime schedules several user tasks onto one kernel execution entity. It can switch those tasks cheaply, but cannot run them simultaneously on both cores without another kernel entity. One-to-one threads give the kernel a schedulable entity per thread. Many-to-many designs multiplex runtime tasks across several kernel threads. Blocking behavior depends on that mapping, so counting language tasks does not establish CPU parallelism.

@fig os_thread_models | Illustrative thread mappings compare runtime work with kernel scheduling entities. Orange marks the one-to-one mapping; two physical cores still bound simultaneous execution.


:::story Picture this
A theatre manager keeps a desk while sending an assistant to a performance. The assistant receives a copy of the desk's instructions, then replaces that copy with the performance script. The manager still knows which assistant was sent and collects the return report. Creating the assistant, replacing the script and collecting the report are fork, exec and wait.
:::

:::key In one breath
Fork creates a child, exec replaces one process image, and wait collects a child's exit record. Copy-on-write delays page copying until a write. Threads share a process address space and resources, so they can run in parallel but require explicit synchronization.
:::

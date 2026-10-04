@part X | I/O, IPC and event loops | Devices, files and sockets all make programs wait, but the wait can block a thread or return a readiness signal. DMA moves bytes, pipes connect processes, signals report events, and event loops keep idle connections cheap. We will build from device I/O through `select`, `poll`, `epoll`, IPC and the server's 1,000 descriptors. | where:10

## 40. I/O fundamentals

Blocking describes what a calling thread does when progress is unavailable. A blocking read can sleep until bytes arrive. A non-blocking read returns immediately with a would-block result when no bytes are ready. Synchronous describes waiting for an operation's completion, while asynchronous describes submitting work and receiving completion later. The pairs overlap but are not synonyms.

A server can use non-blocking descriptors with readiness notification, then perform short reads and writes. If the callback performs slow disk or CPU work, the event loop still stalls even though the socket is non-blocking.

@fig os_block_nonblock | Illustrative quadrants separate caller blocking from operation completion. Orange marks immediate return, which is the key non-blocking property.

### CPU-bound and I/O-bound work

CPU-bound work spends its critical time executing instructions; I/O-bound work spends much of it waiting for an external transfer. The distinction concerns the workload, not an immutable property of a process. A request can parse bytes on a core, block on storage and later resume computation. Adding threads helps only if the bottleneck and available resources permit that overlap.

### Completion and caller behavior

A non-blocking read can return some bytes, end-of-file or a would-block error. Immediate return does not mean the requested application message is complete. The program must retain its parser state and wait for more readiness when needed. An asynchronous interface instead associates completion with a submitted operation. Submitting work, knowing a descriptor is ready and knowing an operation finished are different events.

## 41. Device I/O and DMA

An application enters through a syscall, the kernel selects a driver, the controller programs a device and hardware transfers data. **Direct memory access**, or DMA, lets a device move bytes to or from a RAM buffer without a CPU copying every byte. Completion commonly arrives as an interrupt, after which the kernel marks a buffer or descriptor ready.

DMA still needs ownership, mapping and cache-coherence rules. The kernel must not let a device write arbitrary memory. A network packet can therefore travel from NIC to a kernel buffer, then into a socket receive queue before the application reads it.

@fig os_dma | Illustrative DMA transfer. The CPU supplies the destination and length, the device transfers bytes to RAM, and a completion interrupt reports progress without making the CPU copy each byte.

The driver translates a kernel request into the controller's command and buffer format. It arranges which memory the device may access, submits work and later handles completion or error. A controller can move bytes while the CPU executes unrelated work, but the application must not consume a buffer before the transfer completes. Ownership and visibility barriers matter even though the CPU did not run a byte-copy loop.

A completion interrupt does not necessarily execute the application's callback immediately. It can update kernel queues and wake a sleeping thread, which must still receive CPU time. On Finch's two-core machine, a packet arriving for another socket does not create an additional core. Network protocol processing, receive-buffer management and the application's later read remain distinct stages. Each stage can queue, fail or consume resources while the others appear healthy.

## 42. Blocking sockets and I/O multiplexing

### Blocking and non-blocking sockets

A blocking socket can put its calling thread to sleep when bytes are absent. A non-blocking socket reports would-block instead, making waiting a separate operation. That choice belongs to the socket access path, while readiness tells the program when another attempt may be useful.

### I/O multiplexing

`select` and `poll` let one thread ask about many descriptors. The kernel reports descriptors that can make progress, after which the thread performs the I/O. `epoll` stores interest and reports ready descriptors without requiring the application to resubmit a full set each time. Level-triggered mode reports continued readiness; edge-triggered mode reports state changes and requires draining until would-block.

Finch has 1,000 connections, 980 idle and 20 ready. The event loop can wait once and process 20 rather than scan and block on every connection. This reduces waiting overhead, but it does not make 20 expensive callbacks free.

@fig os_epoll | Computed illustrative readiness set. One thousand open descriptors include 980 idle and 20 ready descriptors; the ready list feeds work to two cores. Each dot is one descriptor.

### select, poll, epoll and kqueue

`select` represents interest through descriptor sets with interface-specific limits. `poll` submits an array of descriptors and events, avoiding that particular set representation while still examining the supplied collection. Linux `epoll` retains an interest set and provides ready results; BSD systems provide `kqueue` with their own event contracts. These are interfaces with different lifecycle and registration rules, not universal promises of constant application work.

Readiness can disappear before a read if another consumer drains the socket. Use non-blocking operations so that race does not trap the event loop in an unexpected wait. Edge-triggered handlers must also complete their drainage or arrange a safe continuation. Stopping halfway through available input can leave unread data without another transition to wake the program. Fairness still requires bounding work for a continuously active socket.

## 43. Event loops

An event loop waits for readiness, dispatches a callback, handles timers or completions and returns to the wait. Node-style systems can keep one main language thread responsive because the thread does not sleep inside every network read. Work that blocks or runs too long needs a worker pool or another process.

The event loop is a scheduling policy layered over kernel readiness. It does not remove kernel queues, socket buffers or memory pressure. A slow callback delays unrelated connections, so bounded handler time is part of the design.

@fig os_event_loop | Illustrative event loop cycles from wait to ready descriptor to callback and back. Orange marks callback work because it is the part that can delay peers.

A ready descriptor is not itself a kernel-scheduled thread. One loop can collect Finch's twenty ready sockets and invoke callbacks sequentially in one execution context. Parallel callback execution needs multiple schedulable threads or processes and a policy for distributing ownership. Two available cores are a machine ceiling, not evidence that one main loop automatically runs two callbacks at once.

Timers and completion notifications share the loop with socket work. A handler that performs a long computation delays their observation too. A worker pool can take that computation, but its queue must be bounded and its result delivered back through a safe ownership path. Cancellation and shutdown must account for outstanding worker jobs, not just close the visible sockets. An event loop moves waiting out of individual connections while leaving actual work and resource lifetimes explicit.

## 44. Pipes, shared memory and signals

A pipe is an ordered byte stream with a read end and write end. The shell can connect `cat` standard output to a pipe and `grep` standard input to the other end. Shared memory avoids repeated copying by mapping one region into multiple processes, but it needs mutexes, semaphores or atomics. A message queue preserves message boundaries through kernel-managed buffers.

Signals are small asynchronous notifications. `SIGTERM` can be handled, `SIGKILL` cannot, and `SIGINT` commonly comes from Ctrl+C. Signals are a poor bulk-data channel because delivery and safe handler behavior are constrained.

@fig os_pipe_signal | Illustrative pipe carries bytes from cat's stdout to grep's stdin. Orange marks the ordered buffer between writer and reader; the parser still needs complete lines.

### IPC channels and pipes

A named pipe gives a filesystem entry for reaching a pipe-like channel. Message queues preserve message boundaries; a byte-stream pipe does not, so a reader must frame records itself. A socket can connect local processes or communicate across a network under the chosen protocol. Shared memory removes repeated transfer copies while making publication, synchronization and recovery the processes' responsibility.

### Shared memory and signals

Close unused pipe ends after fork, or a reader may never see end-of-file while a sibling still owns a write reference. Signals report lifecycle or control events rather than carry the application's bulk messages. `SIGCHLD` announces child changes; `SIGSEGV` reports invalid access under the relevant fault policy. Ctrl+C commonly sends `SIGINT` to the foreground process group. A handler must respect restricted safe operations instead of performing arbitrary allocation or locking.


:::story Picture this
A receptionist waits for lamps showing which desks have paperwork ready. A lit lamp means the desk can make progress; it does not mean the whole case is complete. The receptionist handles a short step and checks the next lamp. Taking a long investigation at one desk delays every other desk despite the lamps continuing to work.
:::

:::note Readiness is not completion
A ready socket may provide only part of a request or an end-of-file result. Use non-blocking operations and preserve parser state. An edge-triggered handler must drain or arrange continuation rather than assume another notification will arrive.
:::

:::interview Interview lens
**"How can one thread handle many idle sockets?"** It keeps descriptors and waits for readiness instead of dedicating a blocked thread to every connection. It performs bounded non-blocking operations on the ready set. CPU work still needs time, and parallel callbacks need additional schedulable execution contexts.
:::

:::warn Watch out
A non-blocking socket does not make every callback non-blocking. A callback can still wait on a file, lock or long computation. Move bounded work to the appropriate owner and preserve cancellation and result-delivery rules.
:::

:::key In one breath
DMA moves device bytes into RAM and interrupts report completion. Blocking concerns the caller, while non-blocking returns immediately when progress is absent. Multiplexing and event loops make 1,000 descriptors manageable, and IPC choices trade copying against synchronization.
:::

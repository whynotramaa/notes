@part XI | Protection, containers and Linux | Security begins with identity and page permissions, then extends to virtual machines, namespaces and cgroups. The host can show a process a restricted world and limit it to 50 ms of CPU in each 100 ms period. We will connect permissions, boot, introspection, limits, leaks, caches, zero-copy and io_uring. | where:11

## 45. Permissions and privilege

Unix permission digits encode read as 4, write as 2 and execute as 1. `755` therefore gives the owner 7, group 5 and others 5. A **privilege** is authority to perform an operation such as changing protected mappings or binding a restricted resource. UID, GID and effective UID participate in permission checks; root has broad authority and therefore a large failure radius.

`sudo` changes the identity context for a command under policy. Setuid programs run with an effective identity that may differ from the invoking user, so their input handling must be strict. A backend should run with only the files, ports and devices it needs.

@fig os_permissions | Illustrative three permission classes expand 755 into exact bit sums. Orange marks owner permissions because they are the first class checked for the file owner.
@fig os_privilege | Illustrative identity fields lead to a privileged operation decision. Orange marks effective UID because it is the permission-check identity.

### Protection and access control

For a directory, execute permission means search or traversal rather than running its bytes as a program. Read lists names, and write participates in changing directory entries under the filesystem's rules. File mode digits alone do not decide every access: credentials, mount policy and other access controls can also apply. The illustrated owner, group and other classes describe the declared basic permission model.

### UID, GID and effective identity

The effective identity used for a check can differ from the original invoking identity. A setuid executable can therefore acquire authority the caller ordinarily lacks. Its trusted operation must not let untrusted arguments select arbitrary protected resources. A server running as root makes an application compromise reach a much wider set of kernel-approved operations. Reduce authority to the needed resources, while still enforcing application authorization for individual users.

## 46. Virtual machines and containers

A virtual machine includes a guest OS above a hypervisor. A Type 1 hypervisor runs close to hardware, while a Type 2 runs through a host OS. Containers share the host kernel and isolate process views and resource budgets. Calling a container a lightweight VM hides the kernel-sharing difference.

Namespaces control what a process can see. Cgroups control how much it can use. Filesystem layers supply an initial tree, but the process still uses host kernel mechanisms for scheduling, memory and devices.

@fig os_virtualization | Illustrative VM path adds a guest kernel between application and hardware. Orange marks the hypervisor boundary.
@fig os_container_layers | Illustrative namespace visibility, cgroup budget, filesystem layer and host kernel are separate container mechanisms. Orange marks the namespace view; the host kernel remains shared.

### Hypervisors and containers

A VM exposes virtual CPUs, memory and devices to its guest kernel. The hypervisor maps those virtual resources onto host resources and establishes the isolation boundary. A guest scheduler makes decisions among guest tasks while a host layer still schedules the virtual CPU. Being runnable inside the guest does not imply receiving physical CPU time immediately.

A container normally runs ordinary host-kernel processes under configured isolation and accounting. A filesystem image supplies the initial files; it does not introduce another guest kernel. Resource control can therefore throttle a process whose namespace view remains unchanged. Conversely, hiding another process's PID does not reserve additional RAM or CPU. Choosing a VM or container requires examining the intended trust boundary, deployment cost and resource policy rather than comparing only image size.

## 47. Namespaces, cgroups and boot

PID namespaces can make a process see itself as PID 1 while the host assigns another PID. Network namespaces split interfaces and routes, mount namespaces change filesystem views, user namespaces map identities, and IPC or UTS namespaces isolate other kernel views. A cgroup is the resource boundary, not the visibility boundary.

Finch's container has a 50 ms quota in a 100 ms period. Once it consumes its quota, the controller throttles it until the period permits more CPU. Boot passes control from firmware to bootloader, kernel, early userspace and PID 1, which starts services. On a systemd-based installation, systemd supplies that init role; another init implementation can supply the same lifecycle responsibility.

@fig os_namespaces | Illustrative ledger maps PID, network, mount and user namespaces to the view each changes. Orange marks PID identity because inside and outside can name one process differently.
@fig os_cgroup | Illustrative quota ledger shows 50 ms of CPU permitted in each 100 ms period on a 2-core host. Orange marks the quota boundary.
@fig os_boot | Illustrative firmware, bootloader, kernel, init and service form the startup chain. Orange marks the kernel because it establishes the execution environment.

### Namespaces and cgroups

The CPU quota measures aggregate scheduled CPU time across the group's threads. A 50 ms allowance per 100 ms is half of one CPU on average, not half of Finch's entire two-core host. If two threads run simultaneously, they consume the allowance together and can exhaust it after 25 ms of wall time under this ideal model. The remaining 75 ms of the period can be throttled if no other allowance applies. Read the division as quota divided by simultaneous CPU execution rate.

### Boot process

An initramfs can supply early userspace needed to find and mount the intended root filesystem. The init system then starts services and collects adopted child status according to its policy. PID 1 has lifecycle duties distinct from an ordinary callback process. A container's apparent PID 1 still needs deliberate signal forwarding and child collection; restricting its process view does not perform those duties automatically.

## 48. Introspection, limits and leaks

`/proc` exposes process and kernel information as a pseudo-filesystem. `/proc/<pid>/fd` shows descriptor links, while `strace` displays system calls. `ulimit` and related limits cap resources such as open files. Finch has a descriptor limit of 1,024 and reserves 24, leaving 1,000 working slots in the declared model.

A memory leak retains useless allocations. A descriptor leak retains sockets or files until the process hits its limit. A thread leak retains execution resources and scheduling overhead. Diagnosis needs a count over time and a release path, not only a larger limit.

@fig os_proc_limits | Illustrative cards connect `/proc`, descriptor inspection, limits and syscall tracing. Orange marks the limit because it turns a leak into a hard failure.
@fig os_leaks | Illustrative each leak holds a finite resource until a distinct failure appears. Orange marks the descriptor leak because it can block a server before CPU is full.

### Linux process introspection and /proc

`ps`, `top` and `htop` expose different views of task activity; `free` and `vmstat` help distinguish memory and paging behavior. `lsof` connects open resources to processes. A syscall trace can reveal repeated would-block returns or an unexpected blocking operation, but its own collection cost and access permissions remain relevant. No single display converts a symptom into a cause without a timeline.

### Resource limits and leaks

Compare descriptor counts at the same workload phase and identify the owning release path. Memory can remain mapped for allocator reuse without being a leak, while unreachable or useless retained allocations can grow without bound. Thread leaks include accumulating live execution contexts or uncollected thread resources. Raising a limit can postpone failure while increasing resource consumption. The repair needs bounded ownership, cleanup on error and shutdown, and a rule for handing resources between callbacks.

## 49. Caches, false sharing and fast I/O

Registers, caches, RAM and SSD trade capacity for latency. A cache line is the unit moved by cache coherence; Finch's model uses 64 bytes. **False sharing** occurs when two threads update separate variables on one cache line, causing invalidations even though the variables are logically independent.

User-space networking can reduce copies or transitions through mechanisms such as `sendfile`, which can send file-backed data without copying it through an application buffer. `io_uring` uses submission and completion queues to submit operations and receive results. These interfaces reduce a particular dispatch cost; they do not remove storage latency or make blocking work safe in an event loop.

@fig os_cache_hierarchy | Illustrative hierarchy shows smaller, faster levels above larger, slower storage. Orange marks cache lines because coherence operates at that granularity.
@fig os_false_sharing | Illustrative two threads write separate words inside one 64-byte line. Orange marks coherence traffic caused by false sharing.
@fig os_zero_copy | Illustrative file bytes move from page cache toward the NIC without an application buffer hop. Orange marks the kernel-owned path.
@fig os_io_uring | Illustrative submission and completion queues separate request posting from result consumption. Orange marks completion because it is the application-visible event.

### Cache hierarchy and false sharing

Temporal locality reuses recently accessed data; spatial locality accesses nearby bytes likely to share a fetched line. Finch's illustrative 64-byte line can contain eight 8-byte counters. Placing different writers' counters there can cause coherence invalidations despite logically independent variables. Padding or separating ownership can remove that sharing at a memory-footprint cost; it does not correct an actual race on the same counter.

### User-space networking, zero-copy and io_uring

`sendfile` follows a kernel file-to-socket path that can avoid an application-buffer transfer. It still uses kernel networking, so it is not kernel bypass. A DPDK-style design changes where packet handling runs and needs device access, buffer ownership and isolation rules. `io_uring` uses submission and completion queues for supported operations, with completion and error handling still required. Each approach changes a named copy or dispatch boundary rather than eliminating all I/O work.


:::story Picture this
A room key determines which equipment a worker can see and enter. A timed pass separately limits how much machine time that worker may consume. Giving a worker a private room does not increase the pass allowance, and a larger allowance does not open another room. Namespace views and cgroup accounting make the same distinction.
:::

:::note Quota across the group
CPU quota is aggregate execution time across the group's threads. Finch's 50 ms per 100 ms gives half of one CPU on average. Two simultaneous workers can exhaust that allowance in 25 ms of wall time under the declared model.
:::

:::interview Interview lens
**"How are namespaces different from cgroups?"** Namespaces change a process's view of kernel resources such as PIDs or network interfaces. Cgroups account for and limit resource consumption. Neither changes the fact that ordinary container processes share the host kernel.
:::

:::warn Watch out
A namespace does not reserve resources. A private PID or network view can coexist with a tight shared CPU or memory allowance. Check cgroup accounting and limits separately from which names the process sees.
:::

:::key In one breath
Permissions and effective identity control authority. VMs add a guest kernel, while containers share the host kernel and separate visibility with namespaces and usage with cgroups. Linux exposes state through `/proc`, limits descriptors, and offers cache-aware and lower-copy I/O paths with costs that remain measurable.
:::

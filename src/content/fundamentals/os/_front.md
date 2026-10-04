<section class="front">

<div class="part-kicker">Fundamentals · Operating Systems</div>

# How to read this chapter

<p class="lede">A server accepts 1,000 connections on 2 cores, yet only 20 are ready and 980 are idle. This guide follows the decisions that let the machine keep those connections separate, schedule useful work, translate addresses, persist files and limit a container.</p>

The syllabus order is the contract. The first parts establish the kernel boundary, processes and synchronization. The middle follows scheduling and virtual memory. The last parts connect files, devices, descriptors, event loops, IPC, protection, containers and Linux inspection into one trace.

Read each section with its figure covered. Re-draw the state change, then change one condition: the child writes after `fork`, a page is absent, a descriptor reaches its limit, or a peer closes a pipe. The interview boxes give a spoken answer, while the final page gives questions, graded exercises and worked solutions.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch's server

**Finch's server** is an illustrative two-core Linux-like machine serving 1,000 connections. Twenty connections are ready for work and 980 are idle. A process forks, the child calls `exec`, and the server then accepts sockets, waits with `epoll`, reads files and runs inside a constrained container.

| Setting | Symbol or resource | Value | What it controls |
|---|---|---:|---|
| CPU cores | $C$ | 2 | Simultaneous execution capacity |
| Connections | $N$ | 1,000 | Open client resources |
| Ready connections | $R$ | 20 | Descriptors with work now |
| Idle connections | $I$ | 980 | Descriptors waiting for readiness |
| Page size | $P$ | 4,096 bytes | Virtual-memory offset size |
| Virtual address | $V$ | 13,396 | Translation worked example |
| Physical address | $P_A$ | 37,972 | Translation result |
| Descriptor limit | $L$ | 1,024 | Per-process open-file ceiling |
| Reserved descriptors | $Q$ | 24 | Listener, logs and other declared resources |
| Container quota | $q$ | 50 ms per 100 ms | CPU allocation |

The schedule and page-replacement traces use the exact values in `src/data/fundamentals/os-numbers.json`. `scripts/fundamentals/os-numbers.py` computes and asserts the exercises from the shared fixture. The connection counts and resource settings are the chapter's declared running-example values. They are illustrative teaching inputs, not claims about every Linux release.

</section>

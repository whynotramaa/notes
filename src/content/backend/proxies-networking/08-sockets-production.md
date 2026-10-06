@part VIII | Sockets and connections in production | We go down to the kernel objects every backend depends on and that dashboards rarely show. Sockets, ports, queues and translation tables are finite, and running out of them takes a service down while CPU and memory look healthy. We will cover listen and accept queues, TIME_WAIT, CLOSE_WAIT and ephemeral ports, keep-alives and NAT timeouts, and diagnosing a failure at 20% CPU. | where:8

## 24. Sockets, ports and the listen queues

A **socket** is the kernel's object for one end of a network conversation, and the process holds it as a file descriptor, Unit IX. A TCP connection is identified by four values, the **4-tuple**, source address, source port, destination address and destination port. A **port** is a 16-bit number, so 65,536 values per address and protocol, and a server listens on a well-known one such as 443.

A listening socket has two queues, and both have limits. When a client's SYN arrives, the kernel records a half-open connection in the **SYN queue** and replies with SYN-ACK. When the client's final ACK arrives, the connection is complete and moves to the **accept queue**, where it waits until the application calls `accept()` to take it. The `backlog` argument to `listen()` sets the accept queue's size, capped by `net.core.somaxconn`, which has defaulted to 4,096 since Linux 5.4 and was 128 before. The SYN queue's size is governed by `tcp_max_syn_backlog`, and SYN cookies let the kernel survive SYN floods without storing state.

@fig be_sock_queues | Half-open connections wait in one room, completed ones in another, until the application accepts them.

If the application accepts too slowly, because its event loop is blocked, Unit IX, or all its threads are busy, the accept queue fills. The kernel then drops new ACKs or sends resets, depending on `tcp_abort_on_overflow`, and clients see connection timeouts or refusals while the application, busy elsewhere, logs nothing at all. `netstat -s` reports "times the listen queue of a socket overflowed", and `ss -lnt` shows each listening socket's current and maximum accept queue in its Recv-Q and Send-Q columns.

Many frameworks pass a small backlog by default, and old guides recommend setting `somaxconn` to 128. For a busy server, the accept queue should absorb a burst of connections, such as a reconnect storm after a deploy, and the fix for a full queue is usually to make accepting faster, not just the queue bigger.

## 25. TIME_WAIT, CLOSE_WAIT and ephemeral ports

When a TCP connection closes, the side that sends the first FIN, the **active closer**, enters **TIME_WAIT** after the exchange finishes and stays there for twice the maximum segment lifetime, fixed at 60 s on Linux. TIME_WAIT exists so that delayed packets from the old connection cannot be mistaken for packets of a new connection with the same 4-tuple, and so the final ACK can be resent if lost. It is normal and necessary. It becomes a problem only when there are a great many of them.

The other side, the **passive closer**, receives the FIN and enters **CLOSE_WAIT**, where it stays until its application calls `close()` on the socket. A healthy application closes promptly, so CLOSE_WAIT sockets are rare and short-lived. A growing number of sockets in CLOSE_WAIT means application code is not closing connections the other side has finished with, the descriptor leak of Unit IX. TIME_WAIT is the kernel's business, and CLOSE_WAIT is yours.

@fig be_sock_states | TIME_WAIT on the side that closed first, CLOSE_WAIT on the side that has not yet closed.

Outgoing connections need a source port, chosen by the kernel from the **ephemeral port range**, `net.ipv4.ip_local_port_range`, 32768 to 60999 by default, which is 28,232 ports. Each connection to the same destination address and port needs a distinct source port, and a port in TIME_WAIT for that destination cannot be reused for it. If a client opens and closes connections to one destination, every closed connection holds a port for 60 s, so the sustainable rate of new connections to that one destination is about 28,232 ÷ 60 ≈ 470 per second. Beyond that, `connect()` fails with `EADDRNOTAVAIL`, "cannot assign requested address".

@fig be_sock_ephemeral | Ports fill as connections close into TIME_WAIT. About 470 new connections per second to one destination is the ceiling.

That is exactly the Nginx scenario of Part II. Without upstream keep-alive, 2,000 requests per second to one application address need 2,000 new connections per second, over four times the ceiling. The fixes, in order of preference, are to reuse connections with keep-alive and pools, which removes the problem, to spread connections over more destination addresses, since the limit is per 4-tuple, to widen the port range, and to enable `net.ipv4.tcp_tw_reuse`, which lets outgoing connections reuse TIME_WAIT ports safely using TCP timestamps. The old `tcp_tw_recycle` option broke clients behind NAT and was removed in Linux 4.12.

## 26. Keep-alives, NAT tables and idle connections

Two different mechanisms share the name keep-alive. **HTTP keep-alive**, persistent connections, means reusing one TCP connection for many HTTP requests, which HTTP/1.1 does by default and HTTP/2 extends with multiplexing. It is a performance feature, and it is what Part II's upstream pools and Unit VI's database pools rely on. **TCP keepalive** is a liveness feature. When a connection has been idle for a while, the kernel sends a probe packet. If the peer answers, the connection is alive. If several probes go unanswered, the kernel declares it dead and the application's next read or write fails.

Linux's TCP keepalive defaults are almost useless for servers, 7,200 s of idle time before the first probe, then probes every 75 s, giving up after 9. A peer that vanished, a crashed machine or a pulled cable, is not detected for over two hours. Applications that hold idle connections, connection pools, message consumers, WebSocket servers, should set much shorter values per socket, or send their own application-level pings.

The more common reason is NAT and stateful middleboxes. Every NAT, firewall and load balancer between two endpoints keeps a table entry for each connection and drops entries that have been idle for too long. An AWS NAT gateway drops idle connections after 350 s, application load balancers after 60 s by default, and home routers after anything from minutes to hours. When the entry is gone, neither endpoint is told. The next packet, perhaps a query on a pooled database connection after a quiet night, is dropped or answered with a reset, and the application waits for a timeout.

@fig be_sock_keepalive | An idle connection through a NAT is forgotten at 350 s. Keepalive probes every 60 s keep it known.

Wren's rule is to keep traffic on idle connections more frequent than the shortest idle timeout on the path. Database and Redis pools send TCP keepalives every 60 s, and pools close idle connections after 300 s, before the NAT does. gRPC clients use HTTP/2 PING frames, and WebSocket servers send pings every 30 s, Unit XII.

Linux machines doing NAT, including Kubernetes nodes, keep their own **conntrack** table, Part IV. It fills when many short connections pass through, and when it is full, new connections are dropped with a kernel log line and nothing else. Sizing `nf_conntrack_max` for the connection rate, shortening timeouts for closed states, and reusing connections all keep it healthy.

## 27. Failing at 20% CPU

The syllabus asks why a backend can fail with CPU at 20% and memory at 40%. The answer is that the resources that ran out are not on the dashboard. Each of the limits in this part, and in Unit IX, can stop a service cold while it has plenty of CPU and memory.

**File descriptors** run out when every socket, file and pipe counts against `ulimit -n`, and the process gets `EMFILE: too many open files` on every `accept()` and `open()`. **Ephemeral ports** run out when outgoing connections churn faster than about 470 per second to one destination, and `connect()` fails with `EADDRNOTAVAIL`. The **conntrack table** fills on a NAT node, and new connections are silently dropped. The accept queue overflows when the application accepts too slowly, and clients time out at connect. Connection pools to databases and other services are exhausted, Unit VI, and requests wait for a connection that never comes. And the dependency at the other end may hit its own limit, a database's `max_connections` or a provider's concurrent-call limit.

@fig be_sock_cpu20 | CPU and memory look fine. Descriptors, ports, conntrack and the accept queue are full.

Diagnosing them takes a short list of commands, worth knowing by heart. `ss -s` summarizes sockets by state, showing huge TIME_WAIT or CLOSE_WAIT counts. `ss -tan state time-wait | wc -l` counts one state. `ls /proc/<pid>/fd | wc -l` against `cat /proc/<pid>/limits` shows descriptor use against the limit. `netstat -s | grep -i -E "overflow|drop"` reveals listen queue overflows. `dmesg | grep conntrack` shows a full table, and `conntrack -C` its current size. Application logs usually contain the specific error, `EMFILE`, `EADDRNOTAVAIL`, connection timeouts, if anyone looks for them.

Wren now exports these as metrics, open descriptors per process, sockets by state per node, conntrack usage, accept queue overflows and pool wait times, and alerts at 70% of each limit, so the next incident of this kind shows up on a dashboard before it shows up as an outage.

:::story Picture this
A car park attendant reporting that the barrier motor is running at 20% and the ticket printer has plenty of paper, while the car park is full and a queue of cars stretches down the road. The thing that ran out was spaces. Measuring the motor told nobody that.
:::

:::note SO_REUSEADDR and SO_REUSEPORT
`SO_REUSEADDR` lets a server bind its listening port while old connections from a previous process are still in TIME_WAIT, which is why restarted servers can listen immediately. `SO_REUSEPORT` lets several sockets listen on the same port, with the kernel spreading connections among them, which Nginx's `reuseport` and many servers use for load distribution across processes.
:::

:::warn Watch out
Setting a very short TIME_WAIT or turning on obscure kernel options found in old blog posts can corrupt connections in subtle ways. Fix connection churn at its source with keep-alive and pooling, and treat kernel tuning as a last resort, changed one setting at a time with measurement.
:::

:::interview Interview lens
**"A backend fails under load with CPU at 20% and memory at 40%. What could have run out?"** File descriptors, ephemeral ports from connection churn and TIME_WAIT, the conntrack table on NAT nodes, the listen accept queue if accept is slow, connection pools, or a dependency's connection limit. I would check `ss -s` for socket states, open descriptors against the process limit, `netstat -s` for listen overflows, `dmesg` for conntrack, and the application's errors such as EMFILE or EADDRNOTAVAIL. Fixes start with connection reuse and pooling, then limits sized to the workload, and alerts on each resource.
:::

:::key In one breath
A TCP connection is a 4-tuple, a listening socket queues half-open connections in the SYN queue and completed ones in the accept queue capped by somaxconn, 4,096 since Linux 5.4, and a slow accept loop overflows it silently. The active closer holds TIME_WAIT for 60 s, so 28,232 ephemeral ports allow about 470 new connections per second to one destination, while CLOSE_WAIT means your code has not closed sockets. HTTP keep-alive reuses connections, TCP keepalive probes idle ones, and NATs and balancers drop idle connections after 350 s or 60 s, so services fail at 20% CPU when descriptors, ports, conntrack, queues or pools run out.
:::

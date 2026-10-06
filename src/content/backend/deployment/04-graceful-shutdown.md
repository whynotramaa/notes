@part IV | Graceful shutdown | We stop a running instance without failing any of the requests or jobs it is handling. Every deploy, scale-down and node upgrade stops pods, so a service that shuts down badly fails requests many times a day. We will cover signals and the Kubernetes termination sequence, and draining requests, connections and queue consumers within a deadline. | where:4

## 12. SIGTERM and the pod termination sequence

A pod is stopped many times a week at Wren: by every rollout, by every scale-down, by node upgrades and by the cluster autoscaler removing a node. Each time, the orders pod holds about 25 requests in flight, by Little's law from Unit XIV, plus open keep-alive connections and perhaps a Kafka consumer partway through a batch. A **graceful shutdown** finishes or hands off all of that before the process exits. An abrupt one fails it.

Unix processes are asked to stop with **signals**. `SIGTERM`, signal 15, is a polite request, which a program can catch and handle by cleaning up. `SIGINT`, signal 2, is what Ctrl+C sends and is usually handled the same way. `SIGKILL`, signal 9, cannot be caught, and the kernel ends the process immediately, with no cleanup. Orchestrators send `SIGTERM` first, wait a **grace period**, and send `SIGKILL` if the process is still running. Docker waits 10 seconds by default, and Kubernetes waits `terminationGracePeriodSeconds`, 30 seconds by default.

@fig be_dep_termination | Deleting a pod starts two things in parallel: endpoint removal across the cluster and SIGTERM to the container. They race.

When Kubernetes deletes a pod, two things start at the same moment. The kubelet runs the container's `preStop` hook, if any, and then sends `SIGTERM`. Meanwhile, the EndpointSlice controller removes the pod from its Services, and that change propagates to kube-proxy on every node, to ingress controllers and to service mesh proxies, each of which updates its routing on its own schedule, often within one or two seconds, sometimes more. These two paths race. If the application stops accepting connections as soon as it receives `SIGTERM`, some proxies have not yet heard that the pod is going away and still send it new requests, which fail with connection refused or reset. This race is the most common reason teams see a small burst of 502s on every deploy.

The standard fix is to delay the shutdown slightly. Wren's pods have a `preStop` hook that sleeps for 5 seconds, `sleep 5`, or the native `sleep` action in recent Kubernetes versions. During those 5 seconds the pod is still serving normally while the rest of the cluster stops routing to it. Only then does `SIGTERM` arrive, by which time new requests have stopped coming. The grace period is counted from the start of the hook, so the hook's time comes out of the 30 seconds.

Some applications also fail their readiness probe on purpose as the first step of shutdown. That helps with balancers that rely on health checks rather than endpoint updates, such as a cloud load balancer checking each node, Unit XI, but it does not remove the need for the pause, because readiness changes take several probe periods to be noticed.

## 13. Draining requests, connections and consumers

Once `SIGTERM` arrives, the application drains in a fixed order. Wren's sequence, budgeted within the 30-second grace period after the 5-second pause, is as follows.

First, **stop accepting new connections**: close the listening socket, so the kernel refuses new connections to this pod. Second, **finish in-flight requests**. Most of the 25 finish within milliseconds. The server waits for them up to a deadline of 20 seconds, which must be shorter than the remaining grace period, and longer than any normal request. Third, **close idle keep-alive connections**. Clients and proxies holding a keep-alive connection to this pod would otherwise send their next request into a closing server. HTTP/1.1 servers send `Connection: close` on the last response of each connection, and HTTP/2 servers send a `GOAWAY` frame, which tells the client which streams will be completed and that it should open a new connection for anything else. Go's `http.Server.Shutdown`, Node.js's `server.close()` plus closing idle connections, and gunicorn's graceful timeout implement these steps.

@fig be_dep_drain | Within 30 s: a 5 s pause, stop listening, finish in-flight requests up to 20 s, close connections and resources, exit.

Fourth, **stop background work**. A Kafka consumer stops polling, finishes processing its current batch, commits its offsets and leaves the consumer group cleanly, which lets the group rebalance its partitions to other members at once instead of waiting for a session timeout, Unit VIII. A worker pulling jobs from a queue stops taking new jobs and either finishes its current one or returns it to the queue, which only works if jobs are idempotent and leases expire. WebSocket servers send a close frame with code 1001, "going away", so clients reconnect elsewhere with backoff and resume, Unit XII. Fifth, **release resources**: flush buffered logs, metrics and traces, close database pools and other clients, and exit with code 0.

Deadlines bound every step, because the grace period ends with `SIGKILL` regardless. A request that takes longer than the drain deadline is cut off, so long operations such as large exports should run as jobs, not requests. If shutdown is still running after the deadline, the application logs what it abandoned and exits, rather than being killed silently. The total must fit: 5 s of pause plus up to 20 s of draining plus a few seconds of cleanup is under 30. Services with longer work raise `terminationGracePeriodSeconds`, but long grace periods slow rollouts and node drains.

Shutdown should be tested like any other path. Wren's load test in CI runs a rollout in the middle of steady traffic and fails the pipeline if any request returns 502 or a connection reset. Before the `preStop` pause and the HTTP/2 `GOAWAY` handling were added, each rollout of the orders service failed a few dozen requests. Afterwards, it failed none.

:::story Picture this
A shop closing for the night. The manager first takes the shop off the delivery app's map and waits a few minutes for couriers already on their way. Then the door is locked to new customers, while those already inside finish their shopping. Staff tell regulars at the counter that the till is closing. The last orders are packed, the safe is counted, and only then are the lights turned off. A shop that switched off the lights at the first knock would leave people in the dark.
:::

:::note PodDisruptionBudgets and node drains
`kubectl drain` evicts every pod from a node before maintenance, respecting PodDisruptionBudgets so that, for example, at least 3 of 4 orders pods stay available. Each evicted pod goes through the same termination sequence, so a node upgrade is safe only if graceful shutdown is.
:::

:::warn Watch out
Exiting immediately on SIGTERM drops in-flight requests, and stopping the listener immediately races with endpoint removal and produces 502s. Pause in preStop, stop listening, drain with a deadline under the grace period, send Connection: close or GOAWAY, commit consumer offsets, then exit.
:::

:::interview Interview lens
**"How do you shut down a service with zero dropped requests in Kubernetes?"** Kubernetes removes the pod from Service endpoints and sends SIGTERM in parallel, so add a preStop sleep of a few seconds while routing updates propagate. On SIGTERM, stop accepting connections, finish in-flight requests with a deadline inside terminationGracePeriodSeconds, close keep-alive connections with Connection: close or HTTP/2 GOAWAY, stop consumers after committing offsets, flush telemetry and close pools, then exit 0. Make PID 1 the application so it receives the signal, and test it under load during a rollout.
:::

:::key In one breath
Orchestrators send SIGTERM, wait the grace period, 30 s in Kubernetes, then SIGKILL, and Kubernetes removes the pod from endpoints in parallel with SIGTERM, so a 5 s preStop pause stops the race that causes 502s on deploy. On SIGTERM, close the listener, finish the 25 or so in-flight requests within a 20 s deadline, close keep-alive connections with Connection: close or GOAWAY, stop consumers after committing offsets and leaving the group, send WebSocket 1001, flush telemetry, close pools and exit 0. Every step has a deadline inside the grace period, and long work belongs in jobs.
:::

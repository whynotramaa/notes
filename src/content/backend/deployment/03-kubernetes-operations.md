@part III | Scheduling, probes and autoscaling | We look at how Kubernetes decides where each pod runs, what happens when a pod misbehaves, and how the number of pods follows traffic. These are the behaviours that surprise teams in their first months on a cluster. We will cover scheduling with requests and limits, probes, restarts and CrashLoopBackOff, and horizontal, vertical and cluster autoscaling. | where:3

## 9. Scheduling, requests and limits

When a new orders pod is created, the **scheduler** picks a node for it. It first filters out nodes that cannot run the pod, and then scores the rest. The most important filter is resources, and it uses the pod's **requests**, the CPU and memory the pod declares it needs. Wren's orders container requests `cpu: 500m`, half a core, and `memory: 1Gi`. A node can accept a pod only if the sum of the requests of the pods already on it, plus this one, fits within the node's **allocatable** capacity, its total minus what the system and kubelet reserve.

Wren's nodes have 8 vCPU and 32 GiB, of which, illustratively, 7.6 CPU and 29 GiB are allocatable. By CPU, 7.6 ÷ 0.5 = 15 orders pods fit. By memory, 29 ÷ 1 = 29 fit. CPU is the binding limit, so 15 pods per node, leaving 14 GiB of memory unrequested. Scheduling uses requests, not actual use, so a pod that requests far more than it uses wastes capacity that no other pod can claim, and one that requests far less than it uses leaves the node overcommitted. Setting requests from measured usage, for example the p95 of CPU and the peak of memory over a week, is one of the most effective cost controls in Kubernetes, Part IX.

@fig be_dep_scheduling | Pods are packed by their requests. 15 pods at 500m fill a node's 7.6 allocatable CPU while memory sits half empty.

**Limits** are enforced at run time through cgroups, Part I. A memory limit is a hard ceiling, and a container that exceeds it is killed, `OOMKilled`, and restarted. A CPU limit throttles the container when it uses its quota in a period, Unit XIV. Requests and limits together set a pod's **quality of service class**. Pods with requests equal to limits for every container are **Guaranteed**. Pods with requests below limits are **Burstable**. Pods with neither are **BestEffort**, and they are the first to be evicted when a node runs short of memory.

@fig be_dep_qos | Requests and limits set the QoS class, and the class sets the order of eviction under memory pressure.

Wren's policy follows a common practice. Memory limit equals memory request, because memory cannot be throttled, only killed, and a predictable ceiling is better than a pod being evicted when a neighbour bursts. CPU has a request but no limit for latency-sensitive services, so a pod can use idle CPU on its node during bursts instead of being throttled, while its request still guarantees its fair share under contention. Batch workloads get CPU limits so they cannot crowd out the request path.

Beyond resources, the scheduler honours placement rules. **Node selectors** and **node affinity** restrict pods to certain nodes, such as GPU nodes. **Taints** on nodes repel pods unless they carry a matching **toleration**, which keeps general workloads off special nodes. **Pod anti-affinity** and **topology spread constraints** spread replicas across nodes and zones, so Wren's four orders pods land in at least two availability zones and losing one zone leaves the service running.

## 10. Probes, restarts and CrashLoopBackOff

The **kubelet**, the agent on each node, runs a pod's containers and its probes, Unit XIV. Probes can be an HTTP GET that must return a 2xx or 3xx status, a TCP connection that must open, a command that must exit 0, or a gRPC health check. Each has a period, a timeout, and failure and success thresholds. Wren's orders pod uses a startup probe on `/startupz` every 10 s with a threshold of 30, a liveness probe on `/livez` every 10 s with a threshold of 3, and a readiness probe on `/readyz` every 5 s with a threshold of 3.

When a liveness probe fails its threshold, or the container exits, the kubelet restarts the container in the same pod, according to the pod's `restartPolicy`, which is `Always` for Deployments. The pod keeps its name, IP and volumes, and its restart count goes up. When a readiness probe fails, the kubelet marks the pod not ready, and the EndpointSlice controller removes it from every Service, so no new connections go to it, while the container keeps running.

@fig be_dep_crashloop | A container that keeps failing is restarted with doubling delays, 10 s, 20 s, 40 s, up to a 5-minute cap.

A container that fails over and over enters **CrashLoopBackOff**. The kubelet does not restart it immediately each time. It waits 10 seconds after the first failure, then 20, 40, 80, 160, and caps the wait at 300 seconds, five minutes, so a broken pod does not consume the node's resources restarting in a tight loop. The backoff resets once the container has run successfully for 10 minutes. CrashLoopBackOff is a state, not a cause, and the cause is found in the previous container's logs with `kubectl logs --previous`, its exit code and the pod's events from `kubectl describe pod`.

The common causes are a short list. The application crashes at startup because configuration is missing or wrong, such as a missing environment variable or an unreachable secret. A dependency it needs at startup is unavailable and it exits rather than retrying. The container is `OOMKilled`, shown as exit code 137, which is 128 plus 9 for `SIGKILL`, because its memory limit is below what it needs. A liveness probe is too strict, killing a slow-starting or briefly busy container, which is what startup probes and generous thresholds prevent. Or the image's command is wrong and exits immediately. Two related states point earlier in the pipeline: `ImagePullBackOff` means the node cannot pull the image, a wrong tag or missing registry credentials, and `Pending` means no node can fit the pod's requests or satisfy its placement rules.

## 11. Autoscaling

Traffic at Wren varies four-fold between quiet afternoons and the dinner peak, Unit I. Running enough pods for the peak all day wastes money, and running enough for the afternoon fails at dinner. Kubernetes has three autoscalers, each for a different dimension.

The **Horizontal Pod Autoscaler**, HPA, changes the number of replicas. Every 15 seconds it reads a metric, by default average CPU utilisation as a percentage of the pods' requests, and computes the desired replica count as the current count times the ratio of current to target utilisation, rounded up. With Wren's target of 60% and 4 pods at 90% CPU, desired = ⌈4 × 90 ÷ 60⌉ = ⌈6⌉ = 6 pods. Within limits of 4 to 20, it scales to 6. Because utilisation is measured against requests, the HPA only works well when requests are set realistically.

@fig be_dep_hpa | The HPA scales on utilisation against requests: 4 pods at 90% against a 60% target become 6.

The HPA has deliberate damping. It scales up quickly but scales down only after the lower recommendation has held for a **stabilisation window**, 300 seconds by default, so a brief dip does not remove pods that the next minute needs. It can scale on other metrics, such as requests per second per pod, queue length or consumer lag, through the custom and external metrics APIs, and KEDA extends this to event sources such as Kafka lag, Unit VIII, including scaling to zero. For I/O-bound services, requests per second or concurrency is often a better signal than CPU, which may stay low while latency climbs.

The **Vertical Pod Autoscaler**, VPA, changes pods' requests instead, recommending or setting CPU and memory from observed usage. It applies changes by recreating pods, so it is commonly used in recommendation mode to inform the requests engineers set, and not combined with an HPA on the same CPU metric.

The **Cluster Autoscaler**, or Karpenter on AWS, changes the number of nodes. When pods are `Pending` because no node has room for their requests, it adds nodes, and when nodes are underused and their pods can move elsewhere, it removes them. Adding a node takes a minute or more, plus image pulls, so scaling from a dinner-rush spike can lag. Wren keeps some headroom by running low-priority placeholder pods that real pods preempt instantly, while the autoscaler adds a node for the evicted placeholders in the background. **PodDisruptionBudgets**, such as `minAvailable: 3` for orders, stop node scale-down and maintenance from evicting too many replicas at once.

:::story Picture this
A shipping yard. Containers are loaded onto ships by their declared weight, not their actual weight, so a box labelled 10 tonnes takes 10 tonnes of a ship's allowance even if it holds feathers. A box that turns out heavier than its label is thrown overboard. And the harbourmaster adds ships when boxes are waiting on the quay, and sends empty ones away when the quay has been quiet for a while.
:::

:::note Exit codes worth knowing
Exit code 0 is success, 1 a generic application error, 137 is 128 + 9 for SIGKILL, usually an OOM kill or a forced stop after the grace period, and 143 is 128 + 15 for SIGTERM, a normal requested shutdown. `kubectl describe pod` shows the last state's reason, such as `OOMKilled` or `Error`.
:::

:::warn Watch out
Requests that are too low pack too many pods on a node and make HPA utilisation look high; requests that are too high waste nodes and keep the HPA from ever scaling. Set requests from measured usage and revisit them, ideally with VPA recommendations.
:::

:::interview Interview lens
**"How do requests, limits and autoscaling interact?"** The scheduler places pods by their requests against node allocatable, so requests decide packing and cost. Limits are enforced by cgroups, a memory limit kills, a CPU limit throttles, and requests and limits set the QoS class that decides eviction order. The HPA scales replicas on utilisation measured against requests, desired = ceil(current × current ÷ target), with a scale-down stabilisation window. The cluster autoscaler adds nodes when pods are pending and removes idle ones, respecting PodDisruptionBudgets.
:::

:::key In one breath
The scheduler places pods by requests against allocatable capacity, so 500m pods fit 15 to a node with 7.6 allocatable CPU, while limits are enforced by cgroups, memory by OOM kill and CPU by throttling, and together they set Guaranteed, Burstable or BestEffort. Probes drive restarts and Service membership, and a container that keeps failing backs off from 10 s doubling to a 300 s cap in CrashLoopBackOff, diagnosed from previous logs, exit codes such as 137 and events. The HPA computes ⌈4 × 90 ÷ 60⌉ = 6 replicas and scales down only after a 300 s window, the VPA tunes requests, and the cluster autoscaler adds nodes for pending pods.
:::

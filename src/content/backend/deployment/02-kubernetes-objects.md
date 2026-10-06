@part II | Kubernetes objects | We learn the handful of Kubernetes objects that a backend engineer writes and reads every week. Kubernetes works by comparing a declared desired state with what is running and acting to close the gap. We will cover pods, ReplicaSets and Deployments, Services, Ingress and namespaces, ConfigMaps, Secrets and volumes, and StatefulSets, DaemonSets, Jobs and CronJobs. | where:2

## 5. Pods, ReplicaSets and Deployments

Kubernetes is a system for running containers on a cluster of machines, called **nodes**, without deciding by hand which container runs where. Its central idea is **declarative desired state**. Wren does not tell Kubernetes "start four copies of the orders service". It writes an object that says "there should be four copies of this", stores it in the cluster's API server, and a set of **controllers** run loops that watch the desired state, compare it with reality, and act to close any gap. If a node dies and takes a copy with it, the controller notices three copies where four are wanted and starts another. Nobody runs a command.

The smallest unit Kubernetes runs is a **pod**, one or more containers that share a network namespace, so they share an IP address and can talk over `localhost`, and can share volumes. Most pods have one application container. Some add **sidecars**, such as a service mesh proxy, Unit XI, or a log shipper, and **init containers**, which run to completion before the application starts, for example to wait for a dependency or fetch configuration. Pods are disposable. They are never repaired, only replaced, and a replacement gets a new name and a new IP address.

@fig be_dep_deployment | A Deployment owns ReplicaSets, a ReplicaSet owns pods. A rollout is a new ReplicaSet growing while the old one shrinks.

A **ReplicaSet** keeps a specified number of identical pods running, matched by labels such as `app: orders`. Engineers rarely create ReplicaSets directly. They create a **Deployment**, which manages ReplicaSets on their behalf. Wren's orders Deployment says: 4 replicas, of a pod template with image `orders@sha256:…`, CPU and memory requests, probes and environment. When the template changes, for example a new image digest, the Deployment creates a new ReplicaSet for the new template and scales it up while scaling the old one down, according to its rollout strategy, Part V. The old ReplicaSet is kept, scaled to zero, so `kubectl rollout undo` can scale it back up, which is the quickest rollback in Kubernetes.

The objects are written in YAML, usually kept in Git and applied by a CI pipeline or a **GitOps** controller such as Argo CD or Flux, which continuously syncs the cluster to what Git says. Each object has `metadata` with a name, namespace and labels, a `spec` with the desired state, and a `status` that controllers fill in with the observed state. Labels and **selectors** tie everything together. A Deployment selects its pods by label, a Service selects its endpoints by label, and a policy selects what it applies to by label, so consistent labels such as `app`, `version` and `team` are the glue of a cluster.

## 6. Services, Ingress and namespaces

Pods come and go with new IP addresses, so nothing should call a pod by address. A **Service** gives a set of pods a stable name and virtual IP. The `orders` Service selects pods labelled `app: orders` and gets a cluster IP and a DNS name, `orders.prod.svc.cluster.local`, or just `orders` from within the same namespace. Unit XI described how it works underneath. An EndpointSlice lists the ready pods, and kube-proxy, or an eBPF data plane such as Cilium, programs each node so that connections to the virtual IP are spread across those pods. Only pods passing their readiness probe appear in the list, which is how readiness controls traffic, Part III.

Services come in types. **ClusterIP**, the default, is reachable only inside the cluster. **NodePort** opens the same port on every node. **LoadBalancer** asks the cloud to create an external load balancer pointing at the Service. A **headless** Service, with no cluster IP, returns the pods' own addresses from DNS, which StatefulSets use so each replica can be addressed individually.

@fig be_dep_service_ingress | Ingress routes HTTP by host and path to Services, which spread connections across ready pods.

HTTP traffic from outside usually enters through an **Ingress**, an object that maps host names and paths to Services, `api.wren.example/orders` to the `orders` Service, with TLS certificates for each host. An Ingress is only a configuration. An **ingress controller**, such as Nginx, Traefik, HAProxy or a cloud's own, reads Ingress objects and configures itself to route accordingly. It runs as pods behind one LoadBalancer Service, so the whole cluster needs one external balancer rather than one per service. The newer **Gateway API** splits this into roles, a Gateway owned by the platform team and HTTPRoutes owned by application teams, with richer matching and traffic splitting that canary releases use, Part V.

**Namespaces** divide one cluster into named groups of objects. Wren uses one per environment and team, `orders-prod`, `orders-staging`, `payments-prod`. Names only need to be unique within a namespace, and namespaces are the unit for access control, which team may change which objects, **resource quotas**, the total CPU and memory a namespace may request, and **network policies**, which pods may talk to which. Wren's default network policy denies all traffic between namespaces and then allows specific paths, such as the orders pods calling the payments Service on port 8443, the zero-trust stance Unit XI described. Namespaces are not a hard security boundary on their own, since all namespaces share nodes and the kernel, so tenants who do not trust each other get separate clusters.

## 7. ConfigMaps, Secrets and volumes

The same image runs in staging and production, so configuration must come from outside it, the **twelve-factor** principle of separating config from code. Kubernetes provides two objects for it.

A **ConfigMap** holds non-secret configuration as key-value pairs or files, such as the payment provider's base URL, the log level, or a feature flag service address. A pod consumes it as environment variables or as files mounted into the container. The difference matters on change. Environment variables are read once at process start, so changing the ConfigMap has no effect until pods restart. Mounted files are updated in place by the kubelet within about a minute, and an application that watches the file can reload without restarting. Wren adds a hash of each ConfigMap's contents to the pod template's annotations, so changing configuration changes the template and triggers a normal, controlled rollout, rather than half the pods running old config and half new.

@fig be_dep_config | The same image in every environment. Configuration and secrets arrive from outside at start.

A **Secret** has the same shape, for sensitive values such as database passwords and API keys. By default a Secret's values are only base64-encoded in the API, which is encoding, not encryption, so anyone who can read Secrets in the namespace can read the values, and the cluster's data store must be encrypted at rest with a KMS key for the values to be protected there. Access to Secrets is restricted by role. Many teams, Wren included, keep the source of truth in an external secret manager, such as Vault or a cloud provider's, and sync values in with the External Secrets Operator or mount them through the Secrets Store CSI driver, so secrets can be rotated centrally. Mounting secrets as files is safer than environment variables, which leak into crash dumps, child processes and debugging output more easily.

Pods are disposable, so data that must outlive them goes in **volumes**. Some volumes live only as long as the pod, such as `emptyDir`, scratch space for temporary files that is deleted with the pod. Durable storage uses a **PersistentVolumeClaim**, PVC, a request by a pod for storage of a size and class, such as 100 GiB of `ssd`. Kubernetes binds the claim to a **PersistentVolume**, PV, an actual disk, usually created on demand by a **StorageClass** that calls the cloud's disk API. When the pod moves, the volume is detached and reattached to the new node. Cloud block disks belong to one zone, so a pod with such a volume can only be scheduled in that zone, a constraint that shapes how stateful workloads are spread.

## 8. StatefulSets, DaemonSets, Jobs and CronJobs

Deployments suit stateless services, where any pod is like any other. Other workloads need different guarantees, and Kubernetes has a controller for each common shape.

A **StatefulSet** runs pods that each need a stable identity and their own storage, such as a database, a Kafka broker or a ZooKeeper ensemble. Its pods are named in order, `kafka-0`, `kafka-1`, `kafka-2`, keep their names when rescheduled, get a stable DNS name through a headless Service, and each gets its own PersistentVolumeClaim from a template, which follows the pod wherever it goes. Pods are created, updated and deleted one at a time in order, so a cluster that needs a quorum is never disrupted all at once. Running databases on Kubernetes this way is possible and common with operators, controllers that encode a database's operational knowledge, but many teams, Wren included, prefer managed databases and keep only stateless services in the cluster.

@fig be_dep_workloads | Four shapes of workload: identity and storage, one per node, run to completion, run on a schedule.

A **DaemonSet** runs exactly one pod on every node, or every node matching a selector. It is the shape for per-node agents: log collectors such as Fluent Bit, Unit XIV, metrics agents, network plugins and storage drivers. When a node joins, the DaemonSet's pod starts on it automatically.

A **Job** runs pods until a specified number complete successfully, with retries on failure up to a `backoffLimit`. Wren uses Jobs for one-off tasks such as a data backfill, and for database migrations run as a step before a rollout. A Job can run pods in parallel, for example 10 workers processing a backfill, with `completions` and `parallelism`. An `activeDeadlineSeconds` caps total runtime, so a stuck Job does not run for ever, and `ttlSecondsAfterFinished` cleans up finished Jobs.

A **CronJob** creates Jobs on a cron schedule, such as `0 3 * * *` for 03:00 every day. Its settings answer the questions Unit VIII raised about scheduled work. `concurrencyPolicy: Forbid` stops a new run from starting while the previous one is still going, `Replace` cancels the old one, and `Allow` runs both. `startingDeadlineSeconds` says how late a missed run may still start, for example after a control-plane outage. The schedule's time zone is set with `timeZone`, so "03:00" does not quietly mean UTC. And the job itself must be idempotent, because Kubernetes may, rarely, start a scheduled run twice, or not at all if the controller is down at the moment it was due.

:::story Picture this
A restaurant manager with a seating plan. The manager does not seat each party by hand. The plan says how many waiters each section needs, and whenever a waiter goes home sick, the agency sends another, who is given a section by the plan. Some staff are interchangeable waiters, some are named sommeliers with their own cellar keys, one cleaner is assigned to each floor, and the deep clean happens every night at three.
:::

:::note Requests flow through the API server
Every change, from `kubectl apply` to a controller scaling a ReplicaSet, goes through the API server, which validates it, runs admission controllers that can reject or modify it, such as the image-signature policy in Part I, and stores it in etcd. Controllers and the kubelet on each node watch the API server for changes. Nothing talks to nodes directly.
:::

:::warn Watch out
Kubernetes Secrets are base64-encoded, not encrypted. Turn on encryption at rest for etcd with a KMS key, restrict who can read Secrets, prefer an external secret manager as the source of truth, and mount secrets as files rather than environment variables.
:::

:::interview Interview lens
**"Walk me through the Kubernetes objects for a typical web service."** A Deployment declares the replicas and pod template, and manages ReplicaSets so rollouts and rollbacks are a matter of scaling one up and another down. A Service gives the ready pods a stable name and virtual IP, and an Ingress or Gateway routes external HTTP by host and path to it. ConfigMaps and Secrets inject configuration and credentials, with a config hash on the template to roll changes out. Namespaces separate teams and environments with quotas and network policies. Stateful systems use StatefulSets, node agents DaemonSets, and batch work Jobs and CronJobs.
:::

:::key In one breath
Kubernetes controllers reconcile declared desired state with reality, so a Deployment of 4 replicas is restored whenever a pod dies, through ReplicaSets that also make rollouts and rollbacks simple. Pods share a network namespace and are replaced, never repaired. Services give ready pods a stable name and virtual IP, Ingress or the Gateway API routes HTTP into them, and namespaces carry access rules, quotas and network policies. ConfigMaps and Secrets keep config out of images, with Secrets only base64-encoded unless etcd is encrypted, and PVCs bind durable disks. StatefulSets give stable identity and storage, DaemonSets one pod per node, Jobs run to completion, and CronJobs schedule them with concurrency policies.
:::

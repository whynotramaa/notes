@part IX | Cost-aware backend engineering | We learn where a backend's cloud bill comes from and how to read it. A service that works but costs ten times what it should is a design problem, not an accounting one. We will cover the main cost drivers with Wren's illustrative numbers, and how to find and cut the expensive parts of a bill. | where:9

## 25. What a backend costs

An interviewer asks: "It works. Why is the cloud bill twenty lakh rupees a month?" The question tests whether a backend engineer knows what their design consumes. Every unit in this series made choices that show up on a bill, and the drivers are a fairly short list. The prices below are illustrative on-demand list prices from a large cloud provider, used for arithmetic, and real bills vary by provider, region and discount.

**Compute** is usually the largest line. Wren's cluster runs 12 nodes of 8 vCPU and 32 GiB at about $0.384 an hour each. Over a 730-hour month that is 12 × 0.384 × 730 ≈ $3,364. What matters is not the nodes but how full they are. Pods are packed by their requests, Part III, so a service that requests 500m of CPU and uses 150m reserves capacity that nobody else can use.

**Databases** come next, and they are expensive per unit because they need memory, fast disks and replicas. Wren's PostgreSQL primary and one replica, managed, cost about $0.80 an hour each, $1,168 a month, before storage and backups. **Storage** for objects and disks is cheap per gigabyte, but grows forever unless lifecycle rules expire old data, Unit XII.

@fig be_dep_bill | An illustrative month: compute, the database, logs, network and egress, about $6,400 for 1.296 billion requests.

**Network** charges are where architecture surprises people. Data leaving the cloud to the internet, **egress**, costs about $0.09 per GB. Wren sends 2,000 bytes per response, 43.2 million times a day, 2,592 GB a month, about $233. Traffic between availability zones costs about $0.01 per GB in each direction. If each request causes 20 KB of internal service-to-service traffic, that is 25.92 TB a month, and with services spread evenly across three zones about two-thirds of it crosses a zone, 17.28 TB at $0.02 per GB for the round trip, about $346. Cross-region traffic and NAT gateways, which charge per gigabyte processed, can be far larger. A chatty microservice design, Part VIII, pays in exactly this line.

**Observability** is often the surprise. Unit XIV's 86.4 GB of logs a day is 2,592 GB a month, and at an illustrative $0.50 per GB ingested that is $1,296, a fifth of the whole bill, before indexing and retention. Hosted metrics charge per active series, so a cardinality explosion from a user id label, Unit XIV, can multiply the metrics bill overnight. Traces cost by volume and sampling rate. **Caches**, **queue retention** and **search clusters** are sized by memory and disk: a Redis cluster sized for every key ever written, a Kafka topic retaining 30 days when consumers need 2, and a search cluster with replicas for an index nobody queries.

Wren's illustrative total is about $6,400 a month for 1.296 billion requests, about $4.94 per million requests. That number, cost per unit of business, matters more than the total.

## 26. Finding and cutting the expensive parts

A bill is investigated like an incident, with data rather than guesses. The first tool is **cost allocation**. Every cloud resource carries tags for service, team and environment, and Kubernetes costs are split by namespace and workload using requests and usage, with tools such as OpenCost or Kubecost. Without tags, the bill says "EC2: $40,000" and nobody knows whose it is. With tags, it says "search staging: $9,000", and someone can ask why staging needs a full-size search cluster.

The second tool is **unit economics**: cost per request, per order, per active user or per tenant. Wren tracks cost per thousand orders monthly. Total cost rising with traffic is healthy. Cost per order rising means something got less efficient, a new feature, a design change or waste, and the per-service breakdown says where. It also lets Wren price enterprise plans with known margins.

@fig be_dep_rightsizing | Requests set at 500m with p95 use of 150m. Lowering requests to 200m lets memory, not CPU, decide packing.

The usual savings come from a familiar list. **Rightsizing** sets requests from measured usage, Part III. If orders requests 500m and its p95 is 150m, lowering the request to 200m raises the pods that fit on a node by CPU from 15 to 38, and memory, at 29 pods, becomes the limit, so nearly twice as many pods share each node. **Autoscaling** removes pods and nodes in quiet hours, since paying for peak capacity all day wastes most of it at a four-to-one peak ratio. **Commitments and spot capacity** cut unit prices: reserved instances or savings plans for the steady baseline, often 30% to 60% cheaper, and spot or preemptible nodes for interruptible work such as batch jobs and CI, which tolerate being stopped.

The architecture-level savings are larger and take longer. **Keep traffic local**: topology-aware routing that prefers pods in the same zone, Unit XI, cuts cross-zone charges, and a CDN, Unit VII, cuts egress and origin load at once. **Compress** responses, since egress is billed per byte. **Log less**: sample routine logs, drop debug logs in production, cap retention and archive to object storage, Unit XIV. **Bound cardinality** in metrics. **Expire data**: lifecycle rules on objects, retention on topics and indexes sized for what is queried. **Delete idle resources**: unattached disks, old snapshots, forgotten load balancers and test environments left running, which a weekly report of untagged and idle resources finds.

@fig be_dep_cost_levers | Where the bytes and cores go, and the lever that cuts each.

Cost is one of the trade-offs a backend engineer makes alongside latency and reliability. Three replicas across three zones cost more than one, and Wren pays for them because its SLO needs them. A cache costs memory and saves database capacity. The skill is knowing what each choice consumes, measuring it, and spending deliberately rather than by accident.

:::story Picture this
A household electricity bill. The total says little. A smart meter that shows each appliance shows that the old freezer in the garage, half empty, uses more than the oven, and that the heating runs all day in an empty house. The fixes are mostly unglamorous: a smaller freezer, a timer, turning off what nobody uses.
:::

:::note Cost alerts
Wren alerts on cost the way it alerts on errors. A daily job compares each service's spend with its trailing average and opens a ticket for jumps above 20%, which catches a runaway log stream or an autoscaler stuck at maximum within a day rather than at the end of the month.
:::

:::warn Watch out
Logging, metrics cardinality, cross-zone traffic and NAT gateway processing are the bill lines that grow silently with design choices. Tag everything, track cost per unit of business, and review the top five lines monthly.
:::

:::interview Interview lens
**"The service works but the bill is too high. What do you look at?"** Break the bill down by tagged service and environment, then compute cost per request or per order to see what changed. Check compute packing, requests versus actual usage and idle autoscaling floors. Check network: internet egress, cross-zone and cross-region traffic and NAT processing. Check observability volume and metric cardinality. Check storage retention, cache sizes, topic retention and search clusters. Fix with rightsizing, autoscaling, commitments and spot for interruptible work, local routing, compression, CDN caching, log sampling and lifecycle rules.
:::

:::key In one breath
A backend's bill is mostly compute, databases, network, storage and observability. Wren's illustrative month is about $3,364 of nodes, $1,168 of database, $1,296 of logs, $346 of cross-zone traffic and $233 of egress, around $6,400 or $4.94 per million requests. Find waste with tags, cost allocation by namespace and cost per unit of business. Cut it by rightsizing requests, which lifts pods per node from 15 to 29 here, autoscaling, commitments and spot capacity, then by keeping traffic in-zone, caching at the CDN, compressing, sampling logs, bounding cardinality, expiring data and deleting idle resources.
:::

@part IX | Cloud building blocks | We map everything so far onto the vocabulary every cloud uses. Products have different names in each provider, but the concepts underneath, compute, networks, firewalls, identities and zones, are the same everywhere. We will cover compute and managed services, virtual networks, subnets and firewalls, and identity, zones, regions and autoscaling. | where:9

## 28. Compute and managed services

Cloud compute comes in three common shapes, and the difference is what you manage. A **virtual machine** is a whole computer with its own operating system kernel, running on a hypervisor that shares physical hardware among many tenants. You choose the size, patch the OS, install the runtime and run your processes. It boots in tens of seconds to minutes, and it can run anything. Amazon EC2, Google Compute Engine and Azure Virtual Machines are VMs.

A **container** packages an application with its libraries and runs it as an isolated process on a shared kernel, using Linux namespaces and cgroups, Unit XV. Containers start in seconds or less, pack densely onto machines, and are scheduled by an orchestrator such as Kubernetes, which the cloud often runs for you as a managed service, EKS, GKE or AKS. You manage the image and its configuration, and the platform manages the machines underneath, to a degree that depends on the service.

@fig be_cloud_compute | A house you maintain, a flat in a managed building, or a hotel room by the night.

**Serverless** functions, such as AWS Lambda, Google Cloud Functions and Cloudflare Workers, run code in response to events, scale from zero to thousands of instances automatically, and bill per invocation and duration. You manage only the code. The costs are cold starts, the latency of starting a new instance, which can be hundreds of milliseconds, limits on duration and memory, and the connection storms of Unit VI, where a thousand concurrent functions each open a database connection. Serverless containers, such as Cloud Run and AWS Fargate, sit between containers and functions.

The same spectrum applies to everything else. A **managed database**, such as Amazon RDS, Cloud SQL or Aurora, runs PostgreSQL or MySQL with backups, patching, replicas and failover handled for you. A **managed queue**, SQS or Pub/Sub, a managed Kafka, MSK or Confluent Cloud, and managed Redis, ElastiCache or Memorystore, follow the pattern. **Object storage**, S3, Cloud Storage or Azure Blob Storage, stores files as objects with very high durability, Unit XII. Managed **load balancers** and **CDNs** provide Parts III and IV and Unit VII as services.

Wren runs its services in containers on managed Kubernetes, its databases on a managed PostgreSQL, and its queues and object storage as managed services. Every managed service trades control and some cost for operational work Wren does not have to do, and the interview skill is explaining that trade for each component rather than naming products.

## 29. Virtual networks, subnets and firewalls

A **virtual private cloud**, VPC, or virtual network in Azure, is a private, isolated network inside the cloud, with an address range you choose, such as Wren's 10.0.0.0/16, 65,536 addresses. Machines inside it talk to each other on private addresses, and nothing reaches them from the internet unless the configuration allows it.

A VPC is divided into **subnets**, each a smaller range in one availability zone, such as 10.0.0.0/24 in zone a. A **public subnet** has a route to an **internet gateway**, so resources in it with public addresses can receive traffic from the internet. Wren puts only its load balancers and NAT gateways there. A **private subnet** has no direct route from the internet. Wren's Kubernetes nodes, databases and caches live in private subnets, reachable from the internet only through the load balancers.

@fig be_cloud_vpc | Public subnets hold the edge, private subnets hold everything else, mirrored across two zones.

Private resources still need to reach out, to call payment providers or download packages. A **NAT gateway** in a public subnet gives them outbound access through a shared public address, without allowing inbound connections, the NAT of Part VII run as a managed service, with the 350 s idle timeout of Part VIII. Routes decide where traffic goes. Each subnet's **route table** sends traffic for the VPC's own range locally, internet-bound traffic from public subnets to the internet gateway, and from private subnets to the NAT gateway. **VPC endpoints** or private links let private resources reach managed services such as S3 without going over the internet at all.

Firewalls come in two forms. A **security group** is a stateful firewall attached to individual resources, an instance or a load balancer. Its rules only allow, such as "allow port 5432 from the security group of the orders nodes", and because it is stateful, replies to allowed traffic are permitted automatically. Referring to other groups rather than addresses means rules keep working as instances come and go. A **network ACL** is a stateless filter on a whole subnet, with numbered allow and deny rules, where return traffic needs its own rule. Most designs rely on security groups and leave ACLs broad, using them for coarse blocks.

@fig be_cloud_sg | Security groups wrap instances and remember connections. Network ACLs guard subnet borders and do not.

Kubernetes adds its own layer, **network policies**, which restrict which pods may talk to which, enforced by the cluster's network plugin. Wren's policy is default-deny between namespaces, with explicit allows, so a compromised pod cannot reach the payments database just because it shares a VPC.

## 30. Identity, zones, regions and autoscaling

**Identity and access management**, IAM, controls what every person and workload may do to cloud resources. A **policy** lists allowed actions on resources, such as reading objects in the `wren-receipts` bucket. A **role** is an identity that workloads assume, receiving short-lived credentials, typically valid for an hour, rather than holding long-lived keys. Wren's orders pods use Kubernetes workload identity, IRSA on AWS or Workload Identity on GCP, to assume the `orders-prod` role, and the cloud SDK picks up its temporary credentials automatically. No access keys exist in configuration, images or environment variables, so none can leak, Unit XIII.

@fig be_cloud_iam | The pod assumes a role, receives credentials valid for an hour, and can read receipts and nothing more.

Clouds are organized geographically. A **region**, such as ap-south-1 in Mumbai, is a separate geographic area with its own copy of the cloud's services. Regions are independent, so an outage in one rarely affects others, and they are tens to hundreds of milliseconds apart. An **availability zone** is one or more data centres inside a region, with independent power, cooling and networking, typically 1 to 2 ms from the other zones in the region. A region has three or more zones.

@fig be_cloud_regions | Regions are far apart and independent. Zones inside a region are close and fail separately.

Zones are the unit of high availability. Wren runs every tier across at least two zones, load balancer nodes, Kubernetes nodes, database primary and replica, Redis primary and replicas, so that losing a whole zone, which happens a few times a year somewhere in every large cloud, leaves the service running at reduced capacity. Data that crosses zones costs money, a few cents per gigabyte in each direction on most clouds, which is why locality-aware routing, Part V, prefers instances in the caller's zone. Regions are the unit of disaster recovery and of latency for global users, and running in several regions is a large step in complexity, involving data replication, global routing and conflict handling, that the system design guide treats in depth.

**Autoscaling** adjusts capacity to load. Instance groups or Kubernetes' Horizontal Pod Autoscaler add or remove replicas based on CPU, memory, request rate or queue age, Unit VIII, and a cluster autoscaler adds or removes the machines underneath. Scaling takes time, seconds for pods on existing machines and minutes when new machines are needed, so autoscaling handles gradual changes and sustained surges, while rate limits and load shedding, Units IX and X, handle the first minutes of a spike. Every resource that scales with instances, database connections, ephemeral ports, IP addresses in a subnet, must have room for the maximum scale, Unit VI's connection budget being the classic case.

:::story Picture this
A business park. Each company rents a fenced plot, the VPC, with a reception building facing the road and offices behind it with no street entrance. Guards at each office door check badges against a list of departments, the security groups. The park sits in a city, the region, spread over several districts with separate power, the zones, so a blackout in one district leaves the others working. And staff receive day passes for the rooms they need, never master keys.
:::

:::note The same concepts, different names
AWS VPC, Google VPC and Azure Virtual Network are networks. Security groups, firewall rules and network security groups are firewalls. EC2, Compute Engine and Virtual Machines are VMs. IAM roles, service accounts and managed identities are workload identities. Learning the concept once and mapping the names is how engineers move between clouds without starting over.
:::

:::warn Watch out
A subnet's address range limits how many pods and instances it can hold, and some Kubernetes network plugins give every pod an address from the VPC. A /24 holds only 251 usable addresses on AWS, so autoscaling can fail with "insufficient IP addresses" long before CPU or budget runs out. Size subnets for the maximum scale.
:::

:::interview Interview lens
**"Design the network for a web service in the cloud."** One VPC spanning at least two availability zones. Public subnets in each zone hold the internet-facing load balancer and NAT gateways, and private subnets hold application nodes, databases and caches, reachable from the internet only through the load balancer. Security groups allow only the needed ports from specific groups, such as the database port only from application nodes, with network policies inside Kubernetes. Workloads use IAM roles with short-lived credentials, managed services are reached through VPC endpoints, and every tier is replicated across zones with autoscaling sized within IP, connection and port limits.
:::

:::key In one breath
VMs give a whole OS to manage, containers share a kernel and are orchestrated, and serverless runs code per event with cold starts and connection storms, while managed databases, queues, caches, object storage, balancers and CDNs trade control for less operations. A VPC holds public subnets for load balancers and NAT gateways and private subnets for everything else, with route tables, VPC endpoints, stateful security groups per resource and stateless network ACLs per subnet. IAM roles give workloads hour-long credentials instead of keys, zones 1 to 2 ms apart are the unit of availability, regions the unit of disaster recovery, and autoscaling must fit within IP, port and connection limits.
:::

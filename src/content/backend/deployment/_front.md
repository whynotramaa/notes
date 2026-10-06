<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every earlier unit assumed that Wren's code was already running somewhere, on four instances, behind a load balancer, able to be replaced. This unit explains how that happens, from a Dockerfile to a pod that Kubernetes starts, probes, scales, drains and replaces, and how a new version reaches users without anyone noticing. It ends by following one request through everything in the series.</p>

Part I opens containers, images, namespaces, cgroups and PID 1. Parts II and III cover the Kubernetes objects a backend engineer meets and how the cluster schedules, restarts and scales them. Part IV is graceful shutdown. Parts V and VI cover deployment strategies and the compatibility rules that make zero-downtime releases possible, including database migrations. Part VII is feature flags. Part VIII weighs monoliths against microservices. Part IX is about what all of this costs. Part X is the capstone, `GET /orders/123` from the phone to the database and back, with the questions an interviewer can interrupt with at every hop.

Each section starts from a Wren situation, explains the mechanism, works the numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names real mistakes, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to write a production Dockerfile, read a Deployment manifest and predict how a rollout will behave, shut a service down without dropping requests, choose a release strategy, change a database schema with no downtime, and walk an interviewer through a request end to end.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. These are the numbers this unit uses. All are assumptions chosen for readable arithmetic, not measurements, and prices are illustrative list prices.

| Setting | Value | What it controls |
|---|---|---|
| Orders service | 4 replicas, requests 500m CPU and 1 GiB, limit 1 GiB | Scheduling |
| Nodes | 8 vCPU, 32 GiB each | Packing |
| Autoscaling | target 60% CPU, 4 to 20 replicas | HPA |
| Rollout | maxSurge 25%, maxUnavailable 25% | Rolling update |
| Termination grace | 30 s, with a 5 s pre-stop pause | Graceful shutdown |
| Canary | 5% of traffic for 10 minutes | Release safety |
| Peak traffic | 2,000 requests/s, 2,000-byte responses | Egress cost |
| Logs | 86.4 GB a day, Unit XIV | Logging cost |
| Sample request | `GET /orders/123` by user 42 | The capstone |

</section>

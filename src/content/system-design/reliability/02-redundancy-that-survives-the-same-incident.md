@part II | Redundancy, active-active, passive | We add spare execution and state without assuming they fail independently. A spare that shares the original failure cause provides less protection than its diagram suggests. We will calculate parallel availability, divide failure domains, and check survivor capacity. | where:2

## 5. Redundancy and parallel paths
The score application loses a process, but another process can serve the same authenticated read. **Redundancy** is an additional resource that can supply the required job when another resource cannot. It helps only if the replacement has the state, credentials, capacity, and network access needed to finish that job.

For two illustrative independent paths, each with failure probability 0.001, both fail with probability 0.000001. Availability is therefore 0.999999. Read the complementary formula slowly: the alternative paths fail only when every usable alternative fails.

$$A_{\text{alternative}}=1-\prod_i(1-A_i).$$
Here $A_i$ is the availability of alternative $i$. This expression assumes any surviving alternative can satisfy the whole operation and that their failures are independent. A read replica with unacceptable lag is not such an alternative for a freshness-sensitive read.

@fig sd_reliability_parallel | Two possible paths. The probability calculation is illustrative and explicitly independent.

:::story Picture this
Two water tanks help if either tank can feed the house. They do not help with a blocked pipe shared by both tanks. The spare tank and the common pipe need different protection.
:::
## 6. Failure domains and common causes
Both application replicas restart after the same configuration change. The hardware was separate; the mistake was shared. A **failure domain** is the set of resources a particular incident can disable together. A host failure, a zone outage, and an invalid global configuration have different domains.

Suppose the two independent paths from the previous section still share a dependency with illustrative availability 0.999. The combined model is 0.999 times 0.999999, giving 0.998999001. The shared dependency dominates the pair's smaller independent failure probability. Merely drawing the application boxes apart does not remove it.

@fig sd_reliability_common | Configuration is a common dependency even when the execution hosts differ.

Write the incident beside each boundary: host crash, lost zone network, expired credential, bad binary, overloaded database. Then decide which boundary contains it. Staged deployment, independent credentials, and bounded configuration rollout may help against software causes that geographic replication does not solve.

:::note Independent enough for which event?
A zone-separated pair may protect against one host or one zone failure while sharing a regional control service. State the failure being tolerated. There is no useful universal statement that two machines are independent.
:::
## 7. Spare capacity after failure
Heron's illustrative reliability variant uses four application replicas, each assumed to sustain 350 requests per second for this workload. With 1,000 peak requests per second, each normally receives 250. After one replica disappears, the surviving capacity is 3 times 350, or 1,050 requests per second.

The surviving per-replica load is 1,000 divided by 3, or 333.333 recurring requests per second in the even-distribution model. That is below the assumed limit but leaves only 50 requests per second of total headroom. Uneven routing, cache misses, and retries can consume that margin.

@fig sd_reliability_survivor | Assumed workload-specific capacity. It is a sizing exercise, not a benchmark.

A replica that exists but is cold may not reach the assumed capacity immediately. Startup, connection establishment, state recovery, and cache warming belong in the failure test. Autoscaling can be a later response, but it cannot supply capacity before its detection and startup path completes.

:::warn Watch out
A cluster sized for normal traffic can fail after losing only one instance. Test the surviving fleet with the real workload and its cold paths. Average normal utilization is insufficient evidence.
:::
## 8. Active-active and active-passive
A second region can either serve production traffic now or wait to take over. **Active-active** means multiple sites accept live work. **Active-passive** means a standby takes ownership when the active site stops or is deliberately replaced. These words describe traffic and ownership, not a complete consistency guarantee.

In active-active, decide whether both regions can write the same score. If they can, they need a conflict rule or coordinated ownership. In active-passive, the standby needs replicated data, working secrets, a tested promotion path, and enough capacity. A powered-on standby with stale credentials is not a ready standby.

@fig sd_reliability_regions | Alternative operating modes. Neither label settles replication lag or split-brain behavior.

For Heron, reads can be geographically distributed while a match has one authoritative writer. An outage may move that authority, but old writers must lose permission before new writers commit. The coordination and replication units explain that boundary; this chapter asks whether it remains usable during the incident.

:::interview Interview lens
**"Does active-active give zero downtime?"** It supplies more than one live serving location. Recovery still depends on routing, capacity, state freshness, and safe write ownership. A shared control dependency or bad global rollout can defeat every active site together.
:::
:::key In one breath
Redundancy needs a sufficient replacement path, a different relevant failure cause, and usable survivor capacity. Alternative-path arithmetic assumes independent failures and complete capability. Failure domains include software and control dependencies as well as hardware. Active-active and active-passive describe operating modes; neither removes the need for a write-ownership rule.
:::

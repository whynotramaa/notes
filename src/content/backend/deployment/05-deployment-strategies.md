@part V | Deployment strategies | We get new code from a merged pull request to users without downtime, and with a fast way back if it is wrong. Most outages begin with a change, so how a change is released matters as much as what it contains. We will cover the build pipeline and artifacts, recreate and rolling updates, blue-green and canary releases, and shadow traffic with rollbacks. | where:5

## 14. From commit to artifact

A change to Wren's orders service starts as a pull request. When it merges, a **CI pipeline** runs the same steps every time: compile or package the code, run unit and integration tests, Unit V, run static analysis and dependency scanning, build the container image, scan it, sign it, and push it to the registry with its digest, Part I. The output is an **artifact**, one immutable image identified by `sha256:…`, which is the only thing that moves through the later stages. The same artifact is deployed to staging and then to production. Rebuilding for each environment would mean that what reached production was not what was tested.

The second half of the pipeline, **continuous delivery**, takes that artifact through environments. Wren deploys to staging automatically, runs smoke tests and a short load test, and then promotes to production by changing the image digest in the production manifests in Git, which Argo CD applies, Part II. Production deploys are automatic after staging passes, during working hours, because a deploy needs people around to watch it. A typical change reaches production 30 minutes after merge, which keeps each deploy small. Small deploys are easier to watch, easier to roll back, and easier to diagnose when something breaks, because the diff is short.

@fig be_dep_pipeline | Build once, then promote the same signed artifact through staging and production, watching health at each step.

Configuration and infrastructure follow the same path. Kubernetes manifests, Helm values, Terraform for cloud resources and feature flag defaults are all in Git, reviewed and applied by pipelines. That gives every change a record, a reviewer and a revert, and makes "what changed at 20:03?", Unit XIV, a matter of reading the Git history.

The steps after a deploy begin are where strategies differ. Each strategy is an answer to two questions. How many users see the new version before we are confident it works? And how fast can we go back if it does not? The next sections answer them four ways.

## 15. Recreate and rolling updates

The simplest strategy is **recreate**, which stops every old pod and then starts the new ones. There is a gap with no pods serving, so it causes downtime, and every user sees the new version at once. It has one real use, when old and new versions cannot run at the same time, for example a single-writer process that must never have two copies. For a web service it is almost never right.

A **rolling update**, Kubernetes' default for Deployments, replaces pods a few at a time. Two settings control it. `maxSurge` is how many extra pods may exist above the desired count during the rollout, and `maxUnavailable` is how many below the desired count may be unavailable. Wren's orders Deployment has 4 replicas with both set to 25%, which is 1 pod each. The rollout starts one new pod, giving 5. When it passes readiness, one old pod is terminated, back to 4. Then another new pod starts, and so on. At every moment at least 3 pods are ready and at most 5 exist. Kubernetes rounds `maxSurge` up and `maxUnavailable` down, so for 4 replicas, 25% gives exactly 1 of each.

@fig be_dep_rolling | Four replicas with maxSurge 1 and maxUnavailable 1. New pods join only after passing readiness.

Readiness gates the rollout. A new pod that never becomes ready stops the rollout, leaving most old pods serving, and the Deployment reports `ProgressDeadlineExceeded` after `progressDeadlineSeconds`, 600 by default. That catches crashes and broken startup, but not a pod that is ready and wrong, returning errors or slow responses. A plain rolling update has no idea of error rates. `minReadySeconds` adds a short wait after a pod becomes ready before counting it, which catches pods that crash shortly after starting.

During a rolling update both versions serve traffic at once, often for several minutes. A user may hit the new version on one request and the old on the next. That is the source of the compatibility rules in Part VI, which every rolling, blue-green and canary strategy depends on. Rollback is another rolling update in the opposite direction, scaling the previous ReplicaSet back up, which takes as long as the rollout did.

## 16. Blue-green and canary releases

A **blue-green deployment** runs two complete environments. Blue serves all traffic with the current version. Green is deployed alongside it with the new version, tested with internal traffic, and then the router, a load balancer, an ingress or DNS, switches all traffic from blue to green at once. Blue stays running, idle, so rollback is switching back, which takes seconds. The costs are double capacity during the release, 8 pods instead of 4 for orders, and the fact that the switch moves every user at once, so a bug that only shows under real traffic hits everyone. Long-lived connections, such as WebSockets, also need draining from blue after the switch.

@fig be_dep_blue_green | Green is deployed and tested beside blue, the router flips, and blue waits idle for a fast rollback.

A **canary release** sends a small fraction of real traffic to the new version first, watches it, and increases the fraction only if it behaves. The name comes from canaries in coal mines, which showed danger before it reached the miners. Wren's canary sends 5% of traffic to the new version for 10 minutes. At 2,000 requests a second, that is 100 requests a second, 60,000 requests in 10 minutes, enough to compare error rates and latency with the stable version with real confidence. If the canary's metrics stay within thresholds of the baseline, the rollout continues to 25%, 50% and 100%, with a pause at each step. If not, traffic returns to the stable version automatically.

@fig be_dep_canary | 5% of traffic goes to the canary for 10 minutes, about 60,000 requests, compared with the baseline before each step up.

Automated **canary analysis** makes this safe without a human staring at graphs. Tools such as Argo Rollouts and Flagger split traffic through the ingress, Gateway API or service mesh, query Prometheus for the canary's and baseline's error rate and p99, and promote or abort according to rules. The comparison matters. Comparing the canary with the baseline at the same time, rather than with a fixed threshold, cancels out effects that hit both, such as a slow dependency. Unit XIV's incident showed the other lesson. Compare per-dependency and per-endpoint error rates, not only the total, or a failure confined to one path hides in the average.

Canaries expose a few users to the bug instead of all of them, and blue-green gives the fastest rollback. Many teams combine them, deploying the new version alongside the old and shifting traffic gradually with automatic analysis.

## 17. Shadow traffic and rollbacks

**Shadow traffic**, or mirroring, copies real requests to the new version without returning its responses to users. The router sends each request to the stable version, which answers the user, and a copy to the shadow, whose response is recorded and discarded. Comparing the two shows whether the new version produces the same results and how it performs under real load, without any user seeing its output. Wren used shadowing when it rewrote its pricing engine. For two weeks every pricing request was mirrored, and a comparison job reported the 0.3% of cases where totals differed, each of which was a bug in the old engine or the new.

Shadowing works for reads and is dangerous for writes. A mirrored `POST /orders` would create a second order and charge the card twice, unless the shadow writes to its own copy of the database and calls stubbed payment providers. Mirrored traffic also doubles load on any dependency the shadow calls. So shadows are usually limited to read paths, or to services that can run fully isolated.

@fig be_dep_shadow | The stable version answers. A copy goes to the shadow, whose response is compared and discarded.

Every strategy needs a **rollback** that is fast, practised and safe. Fast means one command or one click, `kubectl rollout undo`, an Argo CD revert of the Git commit, or flipping a blue-green router, and it should take minutes at most. Practised means it is used often enough that people trust it. Wren's runbooks say to roll back first when errors follow a deploy, Unit XIV, and on-call engineers do so without asking permission.

Safe is the hard part, because a rollback runs old code against whatever state the new code left behind. If the new version wrote rows in a new format, changed a cache entry's structure, published events with a new schema or ran a migration that removed a column, the old version may fail on that state, and the rollback becomes a second incident. That is why rollback safety is designed before the deploy, not during the incident. The rules that make it possible, backward and forward compatibility and expand-and-contract migrations, are Part VI. When a rollback is impossible, the alternative is to **roll forward** with a fix, which is slower and riskier, and feature flags, Part VII, are often the faster way to turn off the broken behaviour.

:::story Picture this
A theatre changing its lead actor. Recreate cancels a night's show. A rolling change swaps one actor per scene. Blue-green rehearses a whole second cast backstage and swaps everyone at the interval, keeping the first cast in costume. A canary lets the new actor play one Tuesday matinee and reads the reviews. Shadowing has the understudy rehearse every line in the wings during real shows, with nobody in the audience hearing them.
:::

:::note Deploy is not release
Deploying puts new code on servers. Releasing exposes a behaviour to users. Feature flags separate the two, so code can be deployed dark, disabled, and released later to a percentage of users, Part VII. That lets teams deploy many times a day while releasing features on their own schedule.
:::

:::warn Watch out
A rolling update only checks readiness, so a version that starts fine and then returns 5% errors rolls out to every pod. Add automated canary analysis that compares error rates and latency per endpoint and dependency against the baseline, and abort automatically.
:::

:::interview Interview lens
**"Compare rolling, blue-green and canary deployments."** Rolling replaces pods gradually within maxSurge and maxUnavailable, gated only by readiness, cheap and default, but slow to roll back and blind to error rates. Blue-green runs a full second environment and switches all traffic at once, with instant rollback but double capacity and all users exposed together. Canary sends a small share of real traffic to the new version, 5% for 10 minutes here, and promotes only if its metrics match the baseline, limiting blast radius. All of them run two versions at once, so both must be compatible with the same schema and messages.
:::

:::key In one breath
Build one signed artifact per commit and promote that exact digest through staging and production, keeping deploys small and frequent. Recreate stops everything first and causes downtime. Rolling updates with maxSurge and maxUnavailable of 25% move 4 replicas one pod at a time between 3 and 5, gated only by readiness. Blue-green switches all traffic between two full environments for instant rollback at double capacity. Canaries send 5% of traffic, about 60,000 requests in 10 minutes, and promote only after automated comparison with the baseline. Shadowing mirrors reads to compare results without user impact, and rollbacks must be fast, practised and made safe in advance by compatibility.
:::

@part VI | Queueing and backpressure | We make overload visible and bounded. Waiting storage cannot repair a sustained deficit in service capacity. We will count backlog, derive recovery time, and choose which work to admit. | where:6

## 26. Backlog during a burst

Heron workers complete 1,000 jobs per second while a match-start burst submits 1,200. A **queue** stores work waiting for service. For a constant-rate interval, the backlog grows by arrivals minus completions when arrivals exceed service and no jobs expire or are rejected.

Over 60 seconds, the deficit is $1,200-1,000=200$ jobs per second. The accumulated backlog is $200\times60=12,000$ jobs. At elapsed times of 15 and 30 seconds, it is 3,000 and 6,000. These intermediate states show how a seemingly modest deficit becomes a large wait.

$$Q(t)=\max(0,Q_0+(\lambda-\mu)t)$$

Read this as: backlog $Q$ after time $t$ is the starting backlog $Q_0$ plus arrival rate $\lambda$ minus service rate $\mu$, multiplied by elapsed time, with a floor at zero. This simple model assumes constant rates and counts all work as equally expensive.

Real jobs can have different costs, so queue length alone can hide backlog in service-seconds. Separate small score reads from large clip jobs or record their estimated work. Also track oldest-job age. A queue can stay short because requests expire while still failing the user promise continuously.

@fig sd_performance_backlog | Computed illustrative burst deficit is 200 jobs/s and final backlog is 12,000 jobs.
@fig sd_performance_backlog_trace | Computed queue states show 0, 3,000, 6,000, and 12,000 jobs during the burst.

## 27. Recovery uses spare service

The burst ends, but new Heron jobs continue arriving. Workers must serve those jobs as well as the backlog. Recovery rate is spare service, not total service. Dividing the backlog by full worker throughput assumes new arrivals disappear.

If arrivals fall to an illustrative 600 jobs per second while service remains 1,000, spare service is $1,000-600=400$ jobs per second. Clearing the 12,000 waiting jobs takes $12,000/400=30$ seconds. Dividing by 1,000 would produce 12 seconds, which ignores the continuing work.

$$t_{\text{drain}}=Q/(\mu-\lambda)$$

Read this as: drain duration equals backlog $Q$ divided by service rate $\mu$ minus ongoing arrival rate $\lambda$, when service exceeds arrivals. If they are equal, this model never drains. If arrivals exceed service, the queue grows instead.

Recovery capacity can change during failure. A database cache may be cold, retries may arrive together, and workers may replay old work while accepting new work. Count those tasks in the same budget. Prioritizing new requests reduces their wait but delays recovery; prioritizing the backlog restores history faster but can harm current viewers. State the policy deliberately.

@fig sd_performance_drain | Illustrative 12,000-job backlog drains at 400 jobs/s over 30 s while new work continues.

## 28. Queue age, deadlines, and memory

The queue has space, yet a viewer's request is already too old to help. **Queue capacity** bounds waiting count or bytes. It does not by itself bound waiting time, because service rate and job costs vary. A useful queue policy includes both a storage budget and a deadline rule.

Under an illustrative constant service rate of 1,000 jobs per second, a job behind 12,000 others waits 12 seconds before its own service. If the useful wait budget is 0.1 seconds, a same-cost first-in-first-out queue can hold at most 100 jobs ahead of it under that service assumption. This is a waiting budget, not a complete response-time guarantee.

Suppose each pending job retains 16 KiB of request state. A 12,000-job backlog retains $12,000\times16\times1,024=196,608,000$ bytes. The broker's serialized message may be smaller than the application state held by its waiting callers. Count both when the queue spans a request and a background worker.

Expire work before it consumes service when completion no longer helps. A latest-score snapshot can replace an older snapshot, while an authoritative scorer event must survive until applied or explicitly repaired. Dropping all old work indiscriminately can delete required history. The business meaning decides which deadline is safe.

@fig sd_performance_queue_budget | Illustrative wait and memory budgets differ; 12,000 pending requests retain 196,608,000 bytes under the stated assumption.

## 29. Backpressure and admission control

A worker cannot keep up, but the producer continues filling its queue. **Backpressure** communicates a downstream capacity limit to the actor that can reduce new work. **Admission control** decides whether to accept an operation before spending its full cost.

A bounded in-process channel can pause its producer. A network service can return explicit overload, or a broker can reduce delivery through credits. The feedback must reach the real source. Moving work from one unbounded queue to another merely moves where waiting accumulates.

Heron should reserve the authoritative scorer path rather than letting replaceable viewer reads consume every slot. Coalesce pending score snapshots by match where only the latest version matters. Reject excess optional work early, and make the retry policy aware of overload. A shared queue without work classes lets a clip backlog delay a small urgent score update.

Admission rules should use the constrained resource, such as dependency concurrency or retained queue bytes, rather than one global request count for unequal jobs. Release the reservation on completion, failure, and cancellation. Otherwise leaked permits create artificial overload even after traffic falls. Test rejection and recovery as part of the normal behavior.

@fig sd_performance_pressure | Illustrative bounded queue feeds a capacity signal back to the producer.

## 30. Retries, fairness, and stale work

An overloaded response times out, the client retries, and the original operation continues running. Offered attempts can exceed useful user actions. A **retry budget** bounds additional attempts so recovery traffic does not consume all the capacity needed for successful new work.

For an illustrative 1,000 original requests per second, assume 10% make one retry and 1% make a second retry. Total attempts are $1,000\times(1+0.1+0.01)=1,110$ per second. The assumptions describe fractions of original requests, not an unbounded recursive retry policy. Useful completions still correspond to original operations.

Use backoff with jitter to avoid synchronized retries, but do not mistake spacing for capacity. Repeated attempts still spend work. Retry only errors that can be transient, preserve an idempotency identifier for effects, and stop when the original deadline expires. The networking unit explains the attempt sequence in detail.

Keep work classes from starving one another. Reserve a bounded share for scorer updates, give each tenant an explicit budget, and discard stale replaceable work before spending service. If 12,000 snapshots wait and only 5,000 fit the stated five-second service window, 7,000 do not fit. This count motivates a coalescing or expiry policy, not automatic deletion of durable events.

@fig sd_performance_retry_budget | Computed illustrative 1,000 original operations produce 1,110 total attempts under the stated retry fractions.

:::story Picture this
A waiting room absorbs a rush but does not make the doctor faster. Booking fewer new visits while clearing a backlog changes the deficit. Adding chairs only lets the same deficit remain hidden longer.
:::

:::warn Watch out
A queue near capacity is not spare service capacity. Its stored work has already committed future service time. Admission based only on empty storage can accept requests whose useful deadlines are impossible to meet.
:::

:::note Different messages have different rights
A command that changes authoritative state must have a recovery path. A replaceable notification of the latest state can often be coalesced. Call both "messages" if you like, but do not give them the same loss policy without inspecting their meaning.
:::

:::interview Interview lens
**"Can a queue handle this traffic burst?"** I calculate the rate deficit and burst duration, then compare backlog bytes and waiting age with the capacity and deadline limits. Recovery uses service minus continuing arrivals. I explain admission, expiry, retry budgets, and which messages may be coalesced before claiming the queue preserves the user promise.
:::

:::key In one breath
Backlog grows at arrival rate minus service and drains using spare service after new arrivals. Waiting count, waiting age, and retained bytes need separate budgets. Backpressure must reach the real producer, while admission should protect the resource performing the work. Retried attempts and stale snapshots consume capacity unless the design bounds or removes them.
:::

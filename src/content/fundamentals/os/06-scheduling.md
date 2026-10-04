@part VI | CPU scheduling | The scheduler decides which ready work gets a core and when a timer can take it back. A schedule can improve response while worsening completion or context-switch overhead. We will compute FCFS, SJF, SRTF and round-robin timelines, then add preemption, multicore queues and cache affinity. | where:6

## 22. Scheduling metrics

Three jobs arrive at times 0, 1 and 2 with bursts 5, 3 and 1. **Completion time** is when a job finishes. **Turnaround time** is completion minus arrival. **Waiting time** is turnaround minus burst. **Response time** is first run minus arrival. These metrics answer different questions, so one average cannot describe the whole schedule.

For FCFS, A completes at 5, B at 8 and C at 9. B has turnaround 7 and waiting 4, while C has turnaround 7 and waiting 6. The mean waiting time is 3.333333. Those values come from the supplied trace, not a rounded diagram estimate.

@fig os_schedule_metrics | Illustrative FCFS timeline keeps completion, turnaround, waiting and response distinct. Orange marks waiting because it is time ready work loses while another job runs.

Response matters to an interactive server, while turnaround matters to a batch job. A scheduler that optimizes one can worsen another. Always draw the timeline first, then compute each row from its own arrival and burst.

For B, completion at 8 minus arrival at 1 gives 7 time units in the system. Its 3 units of actual CPU service leave 4 units waiting, and first service at 5 also gives a response delay of 4. These happen to match in non-preemptive FCFS, but preemption can separate them: a task can receive its first short slice promptly and then wait again before finishing.

The simplified trace uses one core, exact CPU bursts and no I/O or switching cost. Finch's real two-core server has additional queues, so these results are a teaching workload rather than measured callback latency. Keep the arrival event consistent. Socket readiness, application queue insertion and first CPU instruction occur at different boundaries. Starting a stopwatch at one and naming a metric from another can hide part of the delay.

## 23. FCFS, SJF and SRTF

First-come, first-served runs A from 0 to 5, B from 5 to 8 and C from 8 to 9. It is simple and non-preemptive, but a long A creates a convoy for shorter jobs. Shortest-job-first runs A, then C from 5 to 6, then B from 6 to 9 because C is shorter among the jobs available after A.

Shortest-remaining-time-first can preempt. A starts at 0, B arrives at 1 with 3 units against A's remaining 4, and C arrives at 2 with 1. The exact trace is A, B, C, B, A over intervals 0 to 1, 1 to 2, 2 to 3, 3 to 5 and 5 to 9. Its mean waiting time is 1.666667.

@fig os_schedule_fcfs | Illustrative FCFS exposes convoy waiting in the A, B, C trace. Orange marks A because its long first burst delays both later jobs.
@fig os_schedule_sjf | Illustrative SJF chooses C after A completes. Orange marks C because the shortest available burst finishes first.
@fig os_schedule_srtf | Illustrative SRTF preempts as shorter jobs arrive. Orange marks C's one-unit interval because it is the shortest remaining work.

The price of preemption is extra context switching and state management. SJF also needs a burst estimate, which real systems infer rather than know exactly.

## 24. Round robin and preemption

Round robin gives each ready job a time quantum of 2 ms. The exact trace is A from 0 to 2, B from 2 to 4, C from 4 to 5, A from 5 to 7, B from 7 to 8 and A from 8 to 9. A completes at 9, B at 8 and C at 5. Their waiting times are 4, 4 and 2, with mean 3.333333.

If the quantum is too small, timer interrupts and context switches consume more CPU. If it is too large, the schedule approaches FCFS and response worsens. Preemption depends on a timer or another kernel event that returns control from user code. Without it, a process could retain a core indefinitely.

@fig os_schedule_rr | Illustrative round-robin timeline uses the declared 2 ms quantum and exact completion order. Orange marks the first slice because it establishes the rotation.

Priority scheduling adds another starvation risk. Aging raises a long-waiting job's priority, while multilevel feedback queues change a task's queue based on observed CPU behavior.

### Priority and multilevel scheduling

A priority scheduler selects according to an assigned rank, which may reflect urgency or policy. Preemptive priority can stop a lower-ranked task when urgent work becomes runnable; non-preemptive priority waits for the current burst to end. Either needs a rule for ties and starvation. Aging adjusts waiting tasks so continuously arriving high-priority work does not exclude them forever.

A multilevel queue assigns classes to separate queues under a policy between classes. A multilevel feedback queue also moves tasks according to observed behavior. A task that repeatedly uses its whole slice can move toward longer slices, while interactive work may retain faster service. These are policies above the timer mechanism. Priority inversion is a separate problem when urgent work waits on a resource held by a less urgent task.

## 25. Multicore scheduling

On a symmetric multiprocessor, each core can run a ready thread. A global queue simplifies balancing but increases contention. Per-CPU queues reduce queue contention and preserve cache locality, but one core can become idle while another has work. Load balancing migrates tasks and pays for lost cache affinity.

Affinity pins a task or process to selected CPUs. It helps when cache-hot state matters, but hard pinning can strand capacity. A scheduler therefore balances utilization, fairness, response and locality instead of maximizing one value.

@fig os_preemption_multicore | Illustrative timer preemption, SMP execution, affinity and migration form separate mechanisms. Orange marks migration because it trades balance for locality.

Finch has 20 ready connections and 2 cores, so two worker threads could run two independent jobs while eighteen wait, if each ready connection has supplied one queued job. The count says nothing about how long each callback runs, which is why event-loop callbacks must remain bounded.

:::story Picture this
Three repairs arrive while one mechanic works. Letting the first repair finish follows arrival order. Interrupting it to complete a shorter repair improves one customer's completion while forcing the mechanic to put away tools and resume the earlier job. The repair duration, first service and final completion measure different customer experiences.
:::

:::note What the schedule excludes
The timeline uses one core and exact CPU bursts with no I/O or context-switch cost. Finch's two-core server remains the running machine; this smaller workload isolates the scheduling policy before multicore queues are added.
:::

:::interview Interview lens
**"Which scheduling metric would you optimize?"** I name whether the user needs first response or final completion, then compute that measure from a timeline. I include switch cost and fairness before reducing the slice. Multiple cores add placement and locality decisions beyond the single-core exercise.
:::

:::warn Watch out
A short time quantum does not create CPU capacity. It changes when ready tasks receive turns and can increase switching overhead. Keep workload demand, useful CPU time and context-switch time in separate terms.
:::

:::key In one breath
Draw a schedule before computing metrics. FCFS is simple, SJF favors short jobs, SRTF preempts, and round robin trades response against switch overhead with a 2 ms quantum here. Multicore scheduling adds queues, affinity, balancing and migration cost.
:::

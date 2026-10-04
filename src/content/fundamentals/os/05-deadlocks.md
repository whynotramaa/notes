@part V | Deadlocks and resource safety | A blocked task can hold exactly the resource another task needs. Deadlock handling differs from starvation and livelock because the cycle is a resource-allocation fact. We will identify the four conditions, compare handling strategies, compute Banker's safe sequence and separate lack of progress from lack of fairness. | where:5

## 17. Classic synchronization problems

The bounded-buffer producer-consumer problem has a finite number of slots. Producers need an empty slot, consumers need a full slot, and both must change the queue safely. A mutex protects the queue structure while counting semaphores track empty and full permits. Readers-writers adds a policy question: allowing many readers can starve a writer, while writer preference can delay readers.

Dining philosophers exposes a circular wait. If each philosopher holds one fork and waits for the next, five participants can wait forever. Resource ordering breaks the cycle by requiring forks to be acquired in a global order. The sleeping-barber variant adds a finite waiting room and tests whether arriving work is admitted or turned away.

@fig os_sync_classics | Illustrative problems share state but stress different guarantees: bounded capacity, fairness and resource ordering. Orange marks dining philosophers because its partial ownership creates the cycle.

The lesson is to name the resource and the invariant before choosing a primitive. A semaphore that counts queue slots does not by itself protect the queue links. A readers-writer lock that admits readers concurrently still needs a policy for writers.

## 18. Deadlock and Coffman conditions

Finch can deadlock if process P1 holds resource A and waits for B while P2 holds B and waits for A. **Deadlock** means every task in the cycle waits for an event only another task in the cycle can cause. The classical cycle needs mutual exclusion, hold and wait, no preemption and circular wait.

Mutual exclusion makes at least one resource non-shareable. Hold and wait lets a task retain one resource while requesting another. No preemption means the system cannot safely take a held resource away. Circular wait closes the loop. Remove any one condition and this particular deadlock cannot form, though another failure such as starvation may remain.

@fig os_deadlock | Illustrative two lanes show P1 holding A and P2 holding B before each waits for the other. Orange marks the circular wait edge.

Lock ordering is a practical prevention rule. If every path acquires locks in ascending order, no task can wait for an earlier lock while retaining a later lock. The rule must include every lock and callback path, or the missing edge remains a production failure.

:::warn Watch out
High contention is not automatically deadlock. If a waiter eventually acquires the resource, the system is slow or unfair, not deadlocked.
:::

## 19. Handling deadlocks

An operating system can ignore deadlocks, prevent them by breaking a condition, avoid them by admitting only safe allocations, or detect and recover after a cycle appears. Ignoring can be reasonable when recovery is cheap and the failure is rare. Prevention adds ordering, preemption or one-shot allocation constraints that may reduce flexibility.

Avoidance requires knowledge of maximum future claims, which is why it fits a teaching model better than many general-purpose services. Detection can build a wait-for graph, choose a victim, roll it back or terminate it. Recovery must release resources and preserve system invariants, not merely kill an arbitrary process.

@fig os_deadlock_handling | Illustrative four strategies place cost before, during or after allocation. Orange marks avoidance because it needs a future-resource claim.

Starvation can appear in a prevention scheme if one class always loses access. A good design states both safety and fairness, then measures the cost of the chosen guarantee.

Consider the lock-order rule for Finch's connection table and output queue. Taking the connection lock first on every path prevents a worker from holding the output lock while requesting the connection lock. A callback that silently takes them in the opposite order invalidates the proof. Prevention is therefore a rule about all acquisition paths, not just the code visible in the first example.

Detection works differently. The system observes waiting relationships and searches for a cycle under its resource model. Breaking the cycle requires an operation that actually releases a needed resource. A transaction can sometimes roll back safely, while killing a thread that owns a user mutex may leave corrupted state behind. Select recovery according to the resource's ownership and rollback contract.

## 20. Banker's algorithm

Banker's algorithm asks whether a hypothetical allocation leaves some order in which every process can finish. **Need** equals maximum claim minus current allocation. With available work equal to 1, process B needs 1, so B can finish and release its allocation. Work becomes 2, then A's need 2 can finish and work becomes 3, then C's need 2 can finish and work becomes 4.

The resulting safe sequence is B, A, C. "Safe" does not mean no process is waiting now. It means the declared maximum claims admit at least one completion order. An unsafe state cannot guarantee avoiding deadlock under every future request, although it may not contain a cycle at this instant.

@fig os_banker | Illustrative ledger computes the safe sequence from available work and remaining need. Orange marks B because it is the first process whose maximum remaining claim fits.

The algorithm is a proof about an input model, not a promise that real applications reveal maximum claims accurately. If the claims are false, the safety result is false. If the request is smaller than the declared maximum, the system can evaluate the request and then rerun the safety test.

:::interview Interview lens
**"Does an unsafe Banker's state mean deadlock?"** No. It means the system cannot prove a future completion order from the declared claims. Deadlock is an actual wait cycle; unsafe is a conservative allocation state.
:::

## 21. Starvation and livelock

**Starvation** means a particular task waits indefinitely while the system continues serving others. Priority scheduling without aging can starve a low-priority task. **Livelock** means tasks remain active, repeatedly react and still make no useful progress, as when two polite workers step aside for one another forever. Deadlock means the tasks are stuck waiting on a cycle.

Fair locks, aging, bounded retries and backoff address different failures. A retry loop can convert a lock collision into livelock if every worker retries at the same instant. Randomized backoff changes timing but does not prove fairness. A queue with explicit ownership can provide a stronger bound.

@fig os_starvation_livelock | Illustrative cards separate no movement, one task's denial and active but useless movement. Orange marks starvation because it is a fairness failure.

Diagnosis needs observations: who holds the resource, who waits, how long, and whether useful state changes. Calling every long wait a deadlock produces the wrong fix.

:::story Picture this
A clerk keeps the key to one cupboard while asking another clerk for a second key. The second clerk holds that key and asks for the first. Writing a rule that keys are always requested in the same cupboard order prevents this exchange from forming a cycle. It does not guarantee that every clerk receives a turn promptly.
:::

:::note Maximum claims are inputs
Banker needs each process's maximum future claim. A changing or false claim invalidates the safety argument. General-purpose applications often cannot provide that information, which is a reason to use another resource policy.
:::

:::key In one breath
Deadlock needs four conditions and creates a cycle. Handling can ignore, prevent, avoid, or detect and recover. Banker's algorithm proves a safe completion order, while starvation is unfair denial and livelock is activity without progress.
:::

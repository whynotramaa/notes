@part IV | Concurrency and synchronization | Two workers can read the same counter and erase one another's update. Synchronization gives shared state an ordering contract, but each primitive has ownership, wakeup and fairness costs. We will build the critical-section requirements from atomic operations through mutexes, semaphores, condition variables, monitors and classic problems. | where:4

## 13. Concurrency and parallelism

Finch's 2 cores can execute 2 runnable threads at one instant, while a single core can still make several tasks progress by switching between them. **Concurrency** means tasks have overlapping lifetimes or make interleaved progress. **Parallelism** means work executes simultaneously on separate execution resources. The distinction predicts whether a lock protects a true simultaneous collision or an interleaving on one core.

A scheduler can preempt a thread between two instructions. An interrupt can also change the point at which another task runs. Therefore correctness cannot rely on a particular observed order, even on one core. Parallel hardware adds cache coherence and memory-order concerns, but the lost-update bug exists before two cores are involved.

@fig os_concurrency_parallel | Illustrative cards distinguish interleaving on one core from simultaneous work on two cores. Orange marks concurrency because it does not require a second core.

The right question is not "does this code have threads?" It is "which state can be observed between operations, and what order must readers and writers obey?" That question leads directly to races and critical sections.

:::story Picture this
Two clerks update one paper ledger. One clerk reads 10, the other reads 10, and each writes 11. The clerks can alternate at one desk or work at two desks. Either way, the ledger loses an update unless the read-change-write action has a rule.
:::

## 14. Race conditions and critical sections

The expression `counter++` looks small but may load, add and store. With an initial value of 10, two threads can both load 10 and both store 11, even though the intended result is 12. A **race condition** occurs when the result depends on an uncontrolled timing relationship. A **critical section** is the code that must be protected from conflicting interleavings.

A solution must provide mutual exclusion, progress and bounded waiting. Mutual exclusion keeps conflicting entries apart. Progress says a choice can be made when no one is inside. Bounded waiting prevents one thread from being bypassed without limit. Atomicity describes an operation that observers cannot see halfway through; it is a property of the operation and memory model, not merely a short source line.

@fig os_race_counter | Illustrative trace shows both reads of 10 and the two writes of 11. Orange marks the wrong final value, 11 instead of the computed 12.

The fix must cover the whole invariant, not only the final store. A lock around the read-change-write sequence works if every access uses the same lock. A lock around only one writer leaves readers or sibling writers outside the contract.

:::warn Watch out
Volatile does not turn a compound update into an atomic one. Use the synchronization operation that matches the invariant.
:::

## 15. Atomic operations

Hardware supplies small operations that cannot be interleaved by another observer. **Compare-and-swap**, or CAS, reads a word, compares it with an expected value and stores a desired value only if the comparison succeeds. A failed CAS tells the caller another writer changed the word, so the caller can reread and retry.

Test-and-set can acquire a one-bit lock. Fetch-and-add can reserve a distinct counter value. Atomic read and write are enough only for single-word state under the architecture's guarantees. A multi-field invariant still needs a lock, a transaction protocol or a carefully proven lock-free algorithm.

@fig os_atomic_ops | Illustrative CAS makes the expected old value explicit and turns interference into a retry. Orange marks the compare step that rejects a stale writer.

Atomics also need a memory-ordering story. A successful publication must make the protected data visible in the intended order, not merely change a flag. The exact ordering names vary by language and architecture, but the interview answer should connect atomicity with visibility and ordering.

:::interview Interview lens
**"When would you choose CAS over a mutex?"** CAS suits a small state transition where retries are bounded and contention is low. A mutex is easier when the invariant spans several fields or the critical section may wait. CAS does not remove the need to reason about memory visibility, starvation or the cost of repeated failure.
:::

## 16. Mutexes, semaphores and condition variables

A **mutex** is an ownership-based exclusion primitive. A thread locks it, executes the critical section and unlocks it; another contender may sleep instead of burning a core. A **semaphore** is a counter of permits or signals. A counting semaphore initialized to 2 allows two users, while a binary semaphore resembles a permit but does not necessarily encode owner identity.

A **condition variable** lets a thread sleep until shared state may satisfy a predicate. The waiter must hold the associated mutex, check the predicate in a loop, then wait atomically while releasing the mutex. A signal wakes a waiter, but the waiter must reacquire the mutex and check again because another thread may consume the condition first.

@fig os_mutex | Illustrative sequence shows mutex ownership, critical work, release and a sleeping waiter. Orange marks lock acquisition before protected work.
@fig os_condition | Illustrative condition trace shows predicate checking, atomic release and wakeup. Orange marks the retry because wakeup is not proof.

Spinning can be cheaper for a very short wait, while blocking is better when the wait may last. A monitor packages shared state, mutual exclusion and condition operations into one abstraction. The primitive does not choose the invariant for you; the program must state what the protected state means.

### Semaphores

The permit counter changes atomically. A producer waits for an empty-slot permit before inserting into a bounded queue; a consumer releases that permit after removing an item. The mutex still protects the queue links. Permit ownership is not mutex ownership, so replacing every mutex with a binary semaphore can admit the wrong thread's release.

@fig os_semaphore | Illustrative two initial permits are consumed to zero before another caller waits. Orange marks exhaustion of available permits.

### Monitors

A **monitor** combines protected state, mutually exclusive methods and condition waiting. It makes the access contract visible at the object boundary. Under a wake-and-recheck convention, a notified caller must reacquire ownership and examine the predicate again. A notification carries no stored queue item by itself, so the queue state remains the durable fact within this in-memory protocol.

@fig os_monitor | Illustrative protected state, methods and condition waiting share one access contract. Orange marks exclusion around the monitor's state.


:::note Notifications and stored permits
A semaphore retains permit state, while a condition notification does not by itself retain an application item for a future waiter. The queue predicate supplies that state. Choose the primitive from whether the protocol needs stored permits, exclusive ownership or a wait on protected state.
:::

:::key In one breath
Concurrency exposes interleavings, and a race makes the result timing-dependent. Critical sections need mutual exclusion, progress and bounded waiting. Atomics support small transitions, mutexes encode ownership, semaphores count permits, and condition variables sleep while a predicate is false.
:::

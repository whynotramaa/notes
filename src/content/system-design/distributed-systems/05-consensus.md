@part V | Consensus | We agree on a decision history instead of independently electing a winner. Missing messages can stop progress without making contradictory decisions safe. We will distinguish agreement, application, and external effects before tracing Raft. | where:5

## 17. Agreement orders the same commands

A says the next official correction is `c9`; B says it is `c10`. Both commands may be valid, but applying them in different orders can produce different results when a correction replaces state or checks a precondition. Heron needs replicas to agree on what occupies each accepted position, rather than merely agree that some command happened.

**Consensus** makes participants agree on a decision under a defined failure model. A **replicated state machine** extends this idea to an ordered sequence of commands applied to equivalent initial state. A fixed ordered command sequence and deterministic execution give equivalent results. Consensus over the log is one ingredient in that construction.

Start score 10 at version 7. Command `c9` means replace with 11 if version is 7. Command `c10` means replace with 12 if version is 7. If all replicas apply `c9` first, it succeeds and advances the version; `c10` then fails its old precondition. Reversing the order selects a different winner. Agreement makes the chosen result consistent.

The command must include enough information for deterministic application. Reading local wall time or independently generating randomness while applying can produce different results despite identical log bytes. Values such as an accepted timestamp can instead be chosen before commitment and recorded in the command. External lookups require similar care and a defined retry story.

This chapter assumes crash and omission failures, not a participant that maliciously invents votes or changes protocol data. **Byzantine failure** is arbitrary faulty behavior and requires another fault model and protocol. The fact that a design tolerates a crashed follower does not prove it tolerates a lying follower. Name this boundary before presenting a quorum count.

@fig sd_ds_trace_17 | The agreement trace rejects c10's stale precondition after c9 advances the shared version; orange marks the equivalent final state reached by every replica.

:::story Picture this
Every clerk receives the same numbered instructions. They must execute them in order with the same rules. If one clerk independently rolls dice while interpreting an instruction, equal instruction pages do not produce equal ledgers.
:::

## 18. Safety can hold while progress stops

Heron loses contact with enough voters that no group can establish a new accepted decision. A stopped write path is frustrating, but accepting incompatible decisions would be worse for an official score. To reason about this situation, separate the promise that forbidden outcomes never occur from the promise that useful work eventually completes.

**Safety** means nothing prohibited happens, such as two different commands being committed at the same log position. **Liveness** means the protocol eventually makes progress under its required conditions. A protocol can preserve safety while repeatedly failing to elect a leader. This is why 'available machines' and 'available authority' are different counts.

For N=3 voters, a majority is floor(3/2)+1=2. A single reachable voter lacks that authority. Two suitable voters that can communicate may elect and replicate under the protocol's timing and log rules. Three live voters split into isolated singletons still cannot communicate a majority, even though the machine inventory reports no crashed server.

[The FLP result](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf) concerns deterministic consensus in a fully asynchronous model with possible crash failure. It does not say practical agreement is impossible. It says termination cannot be guaranteed for every allowed schedule. Practical protocols use conditions such as eventually stable communication and randomized election timing to obtain progress while preserving their safety rules.

An operational response should therefore ask whether a suitable quorum is connected, whether storage works, and whether election churn prevents progress. Lowering a timeout might help a known stalled leader, or worsen repeated false elections. Removing safety checks is not a liveness fix. Heron's degraded public reads can remain useful while authoritative corrections wait for the protocol to recover.

@fig sd_ds_trace_18 | The voter trace shows a three-node majority continuing with two nodes and stopping with one; orange marks three isolated voters that cannot form a connected majority.

:::note Crash faults are a stated model
These quorum examples assume non-Byzantine participants and the protocol durable state. They do not establish tolerance of arbitrary forged votes or storage corruption.
:::

## 19. Stored, committed, and applied are separate states

A follower receives an entry but has not yet applied it. Its log is current while its score view is old. Another entry may be stored on one machine but not committed at all. Combining these states into a single 'replicated' label hides the exact point at which Heron can safely reply or serve a read.

A **log index** identifies an ordered entry. A **commit index** identifies the known committed prefix under the protocol. An **applied index** identifies the prefix executed by the local state machine. In an ordered application design, the applied index cannot exceed the known commit index, though it can lag behind it when application work is slow.

Let a follower store through index 10, know commitment through 9, and apply through 8. It has bytes for entry 10 without permission to apply that uncommitted suffix. It can apply 9 to catch up. A session requiring the result at 9 must wait until the relevant state is actually available, not merely until the log contains entry 9.

$$a\le c\le \ell$$

Read this as local applied position a is at most known committed position c, which is at most local stored log end ell for this illustrative follower. This is a state accounting relation, not a complete consensus proof. Implementations must also preserve the commit and recovery rules when snapshots or crashes replace in-memory state.

Application lag can grow even while replication is healthy. Measure both separately. A linearizable read path must establish current authority and adequate application progress, often through a protocol read barrier. A follower exposing a stored command as if it were a committed score can show a value later overwritten after election. That is why the distinct markers belong in the diagram.

@fig sd_ds_trace_19 | The rows distinguish stored end 10, known commit 9, and applied prefix 8; orange marks a read that waits until the view reaches position 9.

:::warn External effects keep their own boundary
A committed database command cannot atomically cover an unrelated broker or email API by itself. Use durable intent and identity at each receiving effect.
:::

## 20. Agreement stops at the external-effect boundary

Heron commits a correction and then sends an update to a broker. The process crashes after the broker accepts the message but before Heron records delivery. Consensus preserved the correction, yet replay can send the update again. A database log and a remote service do not automatically share one atomic action.

A **transactional outbox** records publication intent with the authoritative change in the same local transaction or replicated command. A relay later sends that intent. The relay may repeat a send after uncertainty. An **idempotent consumer** stores event identity with its own effect so repeated delivery does not repeat the accepted consumer-side change.

For command `c9`, Heron commits score 11 and outbox event `e9` together. The relay sends `e9`, loses its reply, and sends `e9` again. A consumer's unique `e9` record and update share its local commit boundary. The first delivery applies the update; the second retrieves the existing outcome or skips an already completed effect.

The outbox removes the gap where the score commits but no durable publication intent exists. It does not remove all possible duplicate deliveries. A consumer calling an unrelated email or payment API needs that provider's identity and reconciliation contract too. Otherwise a crash between the provider effect and local record can still leave an uncertain outcome.

In an interview, draw a boundary around each atomic commit. A consensus group orders its own history; a broker and receiver each have separate histories. Attach command and event IDs at those crossings. This explanation is more useful than saying 'exactly once' without specifying whether you mean log storage, database effects, or an action visible outside every participating store.

@fig sd_ds_trace_20 | The external-effect trace carries event e9 from an authoritative commit through retry and consumer deduplication; orange marks one accepted effect despite uncertain delivery.

@fig sd_distributed_systems_consensus | The flow turns a command into an agreed log entry and then the same state change on replicas; orange marks the shared state result.

:::interview Interview lens
**"Why can consensus stop safely?"** Without usable authority, refusing another decision can preserve the accepted history. Liveness needs suitable communication and timing conditions; violating agreement is not a valid progress strategy.
:::

:::key In one breath
Consensus gives agreement under a stated failure model. Safety can hold while liveness waits for usable timing and a quorum. Replicas need deterministic ordered application in addition to a matching log. External effects need separate intent and deduplication boundaries.
:::

@part V | Consumer groups and rebalancing | We share partitions among several processes. A process can be alive but no longer own its assignment. We will follow group membership, rebalance, parallelism, and bounded processing. | where:5

## 17. Consumer groups and independent applications

Several projector processes should divide one workload, while notifications should read every relevant event independently. A **consumer group** gives one logical application a shared partition assignment and durable progress.

In the standard group model used here, one partition has one active assigned member within the group. Another group can independently read that same partition from another position. Four partitions and six members give at most four active partition owners and two idle members under the simple balanced assignment. More members do not create more than four partition-local sequential processing lanes. Kafka 4.1’s share groups and protocol variants should not be mistaken for this introductory ownership contract.

Use the notification application as a separate group rather than another projector member. Within the projector group, the assignment divides partition work among members and shares their logical application's progress. Across groups, notifications can independently read records the projector already handled. An idle projector member does not create another partition-local lane in the illustrated ordinary-group contract. Assigning a different group identity on every restart would also create another history rather than resume the intended application position. Group identity therefore belongs to the application's recovery model, not merely to a temporary process name.

@fig sd_kafka_17 | The rows assign four partitions among six projector members while a notification group keeps independent progress; orange marks the second application's separate history.

Putting projector and notification processes in the same ordinary group makes them divide records instead of each application seeing the required history.

:::story Picture this
A theatre manager gives each usher one set of aisles for a shift, and the ushers in that shift share the work without two of them owning the same aisle. A second team, such as cleaners, receives its own aisle list and can walk every aisle independently. When an usher leaves, the manager redraws the assignment, so work already in the old usher’s hands may need a handoff rule.
:::

## 18. Heartbeats, polling, and failure detection

A process sends heartbeats while its application thread stops making progress. **Failure detection** suspects unavailable or stalled group members using protocol timers and progress rules. Heartbeats and application polling answer different questions.

Bound processing batches so the client can satisfy the documented group behavior. A member that cannot poll or renew as required can lose its assignment even while its process is alive. Large records and blocking outside calls can turn an apparently healthy connection into a stalled consumer. Use pause and bounded worker queues carefully: moving work off the poll thread does not remove the need to commit only completed contiguous work. Timer values trade detection speed against false suspicion under pauses.


A member can continue sending heartbeats while an outside database call prevents its application from finishing the fetched batch. The coordinator can therefore receive evidence of protocol liveness while the last durable offset remains 102. If the applicable progress limit expires, ownership can move and a replacement begins at 102. The old database call may still complete later. A timed sequence must distinguish the last heartbeat, the last required poll, the ownership-expiry event and the last effect completion; only the timers appropriate to the chosen client protocol decide when revocation occurs.

@fig sd_kafka_18 | The rows separate heartbeats from bounded polling and work progress; orange marks assignment change while old work may still be in flight.

Increasing a timeout can hide slow processing and delay recovery. It does not raise the effect system’s capacity.

:::note Liveness and ownership boundaries
Liveness and useful progress are distinct. Choose timer and batch policies from processing behavior, bound outside waits, and inspect the group protocol in use. A suspected member can still have unfinished work after ownership changes.
:::

## 19. Rebalance and obsolete work

A consumer loses a partition while one of its fetched records is still being processed. A **rebalance** changes group assignments when membership or relevant metadata changes. The replacement can replay work from the committed boundary.

Stop accepting new work for a revoked partition, finish or cancel the permitted in-flight work under the protocol, and commit only a valid completed boundary while ownership allows it. Group generations reject obsolete progress updates. But an external database does not learn that generation automatically; a late old worker can still try its effect. Duplicate-safe source identity or explicit resource fencing protects that boundary. Cooperative and newer rebalance protocols can reduce disruption but do not make outside effects magically atomic with ownership.


Follow offset 102 through the handoff. The old member fetched it but has not recorded a safely completed prefix beyond 102. After revocation, the replacement starts at 102 and can attempt the same effect. If the old call later finishes, a broker generation check prevents its obsolete progress commit but does not undo its database call. The database must reject a stale resource generation or recognize the same source identity. A consumer that merely stops fetching after revoke still has this race unless it also handles its already-issued effects.

@fig sd_kafka_19 | The rebalance trace revokes a partition from old member work and starts the new member at the committed position; orange marks obsolete completion outside the protected effect.

An application that keeps processing a revoked partition without a protection rule can race its replacement even if Kafka correctly rejects its old offset commit.

:::warn Watch out
Rebalance changes ownership and can repeat in-flight work. Group protocol fences obsolete commits; external effects still need repeatability or fencing. Define revoke, finish, cancel, and restart behavior explicitly.
:::

## 20. Parallelism, skew, and contiguous progress

A consumer runs several tasks concurrently, and record 103 finishes before 102. **Contiguous completion** means every record below the committed next position has a safely represented effect.

Do not commit 104 merely because 103 finished. Preserve a completion map or another bounded tracker until 102 also completes; then the safe boundary can advance. If the domain requires sequential match state, parallelize across independent keys or partitions rather than reordering that match. A hot partition can limit one group despite many idle workers. Increasing partitions improves some parallelism but changes routing and history assumptions. Measure successful effect rate and oldest unprocessed age, not only fetch throughput.

The completion tracker must remain bounded while an earlier effect stalls. If 103 completes but 102 remains pending, retain the completed result and hold the durable next position at the safe prefix. Once 102 safely completes, the tracker can release the contiguous completed work and permit 104. If later tasks keep finishing while 102 never resolves, pause new application intake before the map grows indefinitely. The business ordering rule may require stopping that key earlier still. Successful parallel work is useful only when restart can distinguish its completed effects from the unfinished prefix.

@fig sd_kafka_20 | The progress rows show offset 102 pending while 103 is complete; orange marks waiting for the contiguous prefix instead of committing 104.

Unlimited completion tracking is another queue. Bound the out-of-order window and apply backpressure when an early record stalls.

:::interview Interview lens
**"How should a consumer group scale without losing ordering?"** Parallel application work must preserve its ordering invariant and contiguous restart boundary. A completed high offset is not permission to skip lower pending work. I would scale independent keys and measure skew before adding members. I would also treat a rebalance as an ownership change that can leave old work in flight.
:::

:::key In one breath
A standard consumer group assigns a partition to one active member at a time. Rebalance changes ownership and can repeat work. Group generations protect commits, while outside effects still need repeatability or fencing.
:::

@part III | Replication, ISR, high watermark | We decide which appended records readers may trust. Copies that lag have different failure value. We will follow ISR, acknowledgements, high watermarks, and leader change. | where:3

## 9. Leader, followers, and ISR

The leader has appended through 103, but a follower has only reached 102. A **follower replica** copies the leader’s partition history. The **in-sync replica set**, or ISR, tracks replicas meeting Kafka’s documented synchronization criteria.

Followers fetch from the leader and report their progress. The leader and one follower have next position 104 while another ISR member has 103. Their minimum next position is 103 in this simple trace, which limits replicated visibility until the slower replica catches up or membership changes under the protocol. Replica count says how many configured copies exist; ISR says which replicas currently satisfy the relevant synchronization state. Neither is simply a promise that all configured nodes hold every latest record at all times.

The slow follower's local receipt and the leader's observation of its progress are separate events. The leader must learn enough replication state under the protocol before advancing the shared visibility boundary. If a replica leaves the current in-sync set, reassess the acknowledgement condition and minimum requirement rather than keep treating the original membership as current. A configured copy that is offline cannot serve as a witness to a new append. Monitor per-partition progress and membership because an aggregate replica count cannot locate the tail that limits this partition.

@fig sd_kafka_09 | Illustrative replica progress. Leader and follower A have next position 104, while follower B has 103. The exclusive watermark at 103 keeps the local tail beyond it out of the visible prefix.

ISR membership is protocol state, not a static count chosen once at topic creation. Explain writes after membership shrinks.

:::story Picture this
A clerk copies a signed ledger from the master book to several desks. The clerk counts a desk as current only after it has copied through the required page, while a desk that was assigned a book but stopped halfway is still a configured copy, not a current witness. The master can release a page as shared only up to the slowest desk still counted as current.
:::

## 10. Acknowledgements and minimum ISR

The producer uses a strong replicated acknowledgement policy and the topic requires a minimum of two ISR members in the illustrative three-copy setup. **Producer acknowledgements** define when a produce operation reports success; `min.insync.replicas` constrains eligible writes under the relevant `acks=all` policy.

With enough eligible replicas, the leader waits for the configured replication acknowledgement behavior. If the ISR shrinks below the required minimum, the write fails rather than silently meeting a weaker replica count. `acks=1` instead confirms the leader path without the same all-ISR condition; `acks=0` does not wait for a broker acknowledgement. These are distinct trade-offs, not universal durability grades independent of other settings. See [Kafka 4.1 producer configuration](https://kafka.apache.org/41/configuration/producer-configs/) and [topic configuration](https://kafka.apache.org/41/configuration/topic-configs/).


In the declared replication fixture, the leader and follower A have next position 104 while follower B is still at 103. A policy requiring acknowledgements from the current in-sync set must account for that lag rather than equating the leader append with completion. The configured minimum ISR is a condition for accepting the write under the relevant acknowledgement mode; it is not simply the number of copies a client asks to return. If too few eligible replicas remain, refusing the write preserves the chosen contract at the cost of availability. Restoring a response quickly by weakening that policy changes the durability promise.

@fig sd_kafka_10 | The rows compare three configured copies with current ISR and minimum-ISR policy; orange marks the strong policy that rejects a write below two live in-sync copies.

Saying acks all means every configured replica is wrong when some configured replicas are outside the ISR. Use the product’s documented protocol and membership semantics.

:::note Acknowledgement and ISR policy
State producer acknowledgements and topic minimum ISR together. The strong policy can reject writes when too few replicas qualify. Replica count alone does not describe successful produce, and acknowledgements are not a universal per-record filesystem flush guarantee.
:::

## 11. The high watermark

The slow follower reaches next position 104. The **high watermark** is the replication-defined boundary of records safe for the ordinary consumer visibility rule. This unit uses an exclusive-next-offset convention for its examples.

Before catch-up, the simple three-member progress trace has positions 104, 104, and 103, with boundary 103. After the final follower reaches 104, the boundary can advance to 104 once the protocol observes and confirms the relevant progress. All four illustrative records are then below it. The real protocol has report and observation steps, so a follower’s local append is not a magical instantaneous global update. Transactional readers can have a lower last stable offset even when replication is current.

A consumer waiting at 103 can fetch the final fixture record only after the exclusive replicated boundary permits it. Once the relevant progress is observed and the boundary reaches 104, that record lies below the boundary. This step does not advance the consumer group's checkpoint, which still depends on its own safely completed effects. A committed transactional reader can remain blocked by a lower stable boundary even after replication catches up. Inspect the reason for each wait rather than equate follower catch-up with immediate application progress.

@fig sd_kafka_11 | The trace raises the high watermark from 103 to 104 as all replicas catch up; orange marks the post-catch-up visible boundary.

Adding leader and follower offsets together measures nothing useful. Compare progress in the same partition and convention.

:::warn Watch out
The high watermark is a replicated visibility boundary, not merely the leader’s log end. Trace follower fetch and progress observation before moving it. Transactions can impose a separate lower stable boundary for committed readers.
:::

## 12. Leader failover and divergent tails

The leader fails after appending a record that was not safely replicated. A replacement must use a history compatible with the successful-write contract. A **leader epoch** identifies a generation of partition leadership so stale leaders and divergent histories can be detected.

The metadata authority selects an eligible leader under the configured protocol and updates clients. Replicas compare history and reconcile their tails using the epoch and replication rules. Promoting a stale replica under an unsafe availability policy can lose previously visible or acknowledged data; avoiding that promotion can keep the partition unavailable. Kafka 4.1 also documents eligible-leader mechanisms beyond the simple classroom ISR trace. Name the chosen settings and eligibility model rather than assuming every version has exactly one election path.

Let the former leader return after replacement. Its local segment may contain a tail that the new authoritative history does not retain, and being alive again does not authorize it to restore that tail as accepted state. It must follow the accepted leadership epoch and history-reconciliation protocol. Clients with stale metadata refresh their route instead of independently choosing the recovered node. If no eligible history meets the configured survival promise, the availability policy must describe whether the partition waits. Recovered files, current leadership, and promised write survival are different checks.

@fig sd_kafka_12 | The failover rows discard an unreplicated tail, select an eligible history, and reconcile the new leader; orange marks the safe source after epoch change.

An old process remaining alive does not make it current leader. Clients and brokers must reject obsolete authority under the protocol.

:::interview Interview lens
**"What does a safe Kafka failover need to decide?"** Failover needs eligible history and a new ownership epoch. I would explain the availability and loss policy if no sufficiently safe replica remains. The simple ISR story is an introductory model, and version-specific eligible-leader settings affect the full protocol. I would name those settings instead of assuming that replica count alone defines safety.
:::

:::key In one breath
Replication copies each partition behind its leader. The ISR and acknowledgement policy determine what successful produce establishes. Leadership changes need epochs and a safe history; replica count alone does not supply a universal loss guarantee.
:::

@part VI | Eventual consistency and quorums | We distinguish replica count from the ordering promised to readers. An overlapping read and write set can still lack a complete agreement protocol. We will trace delayed versions, deletions, repair, and the exact statement made by quorum arithmetic. | where:6

## 26. Eventual consistency and observable lag

A clip owner edits a title, but Heron's search page still shows the old text. **Eventual consistency** promises convergence under the system's delivery and repair assumptions after relevant updates stop. It does not, by itself, promise a maximum delay or require every reader to observe the same intermediate version.

Follow one change. The authoritative owner commits it, a propagation path records it, a consumer receives it, and the derived view applies it. A failure can occur between any of those states. A correct design knows whether to retry, replay, compare versions, or rebuild after that failure.

For an illustrative event rate of 20 per second, five seconds of propagation delay correspond to 100 events behind if rates are constant. That converts lag into a workload count, but it does not establish the actual view is exactly five seconds old. Measure source progress and consumer progress using comparable positions or timestamps.

Choose how readers behave during lag. A clip editor may read directly from the authoritative owner after saving. A recommendation page may permit a stale view. A delete-sensitive query may need stronger treatment. State the acceptable behavior per operation instead of treating "eventual" as a permission for any outcome.

@fig sd_nosql_lag | Computed illustrative five-second delay at 20 events/s corresponds to 100 unapplied events.

## 27. Versioned application and out-of-order delivery

The view receives version 8 and then a delayed retry of version 7. Blind replacement moves it backwards. A **version** is an ordering identifier within a defined authority. A derived view should compare source versions and reject older state when its update contract represents replacement by newer state.

Store the value and its version in the same atomic update boundary. First check the incoming identity, then compare its source version, then apply the new value and progress marker. If those steps can split across failures, a consumer may record progress without storing the change or store a change without knowing it completed.

A monotonic sequence assigned by one match owner works for that match's state. It is not automatically a global order across unrelated matches or independent writers. Wall-clock timestamps can also disagree because clocks differ or several operations share a timestamp. State who assigns the order and how conflicts are represented.

Replay should be safe. Reapplying the same replacement version can be a no-op, but reapplying an increment can add the effect twice unless the event identity is deduplicated. Heron should distinguish snapshots from operations. The update type determines whether version comparison, event deduplication, or explicit conflict resolution is needed.

@fig sd_nosql_versions | Illustrative replacement view accepts source version 8 and rejects delayed version 7.
@fig sd_nosql_apply_boundary | Illustrative apply and progress marker must preserve a recoverable boundary under consumer failure.

## 28. Tombstones and stale resurrection

A moderator deletes a clip, then an old title update arrives. If the delete simply removed every trace of the record, the update may recreate it. A **tombstone** is a retained deletion marker that carries enough identity or order to reject older state.

In Heron's illustrative trace, replacement version 8 is followed by deletion version 9. A delayed version-7 or version-8 update must remain older than the version-9 tombstone. A legitimate new record needs a defined new identity or a newer authorized recreation operation. The consumer must not infer permission to recreate from the absence of visible data.

Tombstones have a cleanup problem. Retaining them forever costs storage, but removing one too early lets a long-disconnected replica or delayed retry resurrect the old record. Safe removal depends on replay retention, repair progress, and the maximum supported disconnected interval, rather than a convenient arbitrary expiry.

Deletion may need to reach indexes, graph edges, caches, and backups under their own policies. A base-record tombstone does not automatically remove search visibility. Keep deletion progress observable and verify the relevant derived paths. A design that can create several copies must also explain how those copies stop presenting a deleted fact.

@fig sd_nosql_tombstone | Illustrative version-9 deletion blocks older delayed updates; cleanup needs a replay and repair boundary.

## 29. Repair and rebuild are mechanisms

A consumer crashes after missing an update, so the derived score stays old. **Repair** detects and corrects disagreement with an authoritative source. **Rebuild** creates a replacement view from a known source boundary. Waiting alone does neither unless a delivery path actually resumes the missing work.

A repair process can compare source and view versions for known keys, replay a range from a checkpoint, or compare partition summaries before inspecting mismatches. Each choice trades bandwidth, detection delay, and source load. Record enough identity and progress to know which repair operation is valid.

For Heron's illustrative hour of 72,000 events at 200 bytes each, a full payload replay transfers 14,400,000 bytes. At an assumed payload rate of 1,000,000 bytes per second, transfer alone takes 14.4 seconds. Parsing, index work, persistence, and ongoing updates can make actual rebuild longer.

A 100-event backlog replayed at 40 events per second while 20 new events continue arrives at spare rate 20. Drain time is five seconds. Capacity planning must reserve that catch-up work; otherwise a view that keeps pace during normal operation cannot recover from even a brief outage. The performance unit derives the same spare-service rule.

@fig sd_nosql_repair | Illustrative 100-event lag drains in five seconds using 20 events/s of spare replay capacity.

## 30. Quorum reads, writes, and replication factor

Heron stores a logical record on three fixed replica members. **Replication factor** $N$ counts those copies. A write waits for $W$ acknowledgements; a read asks $R$ members. A **quorum** is a required participating set, but its useful guarantee depends on the protocol around that set.

With $N=3$, $W=2$, and $R=2$, the read and completed write sets overlap by at least $R+W-N=1$ member. For example, write members A and B intersect read members B and C at B. The arithmetic assumes the same fixed membership and the acknowledged write set actually satisfies the stated write boundary.

$$R+W>N$$

Read this as: read count $R$ plus write count $W$ exceeds replica count $N$, ensuring intersection under the fixed-set assumptions. Intersection alone does not order concurrent writes, explain incomplete writes, or tell the reader which version to select. It also does not define whether an acknowledgement means persistence.

The illustrated quorum size of two can proceed with one unavailable member if the remaining members communicate and the rest of the protocol permits the operation. More copies increase storage and repair work, not automatically freshness. The [original Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) describes reconciliation and membership behavior that must be understood alongside read and write counts.

@fig sd_nosql_quorum | Computed illustrative fixed sets intersect at B; membership and version-selection assumptions are part of the claim.

:::story Picture this
Two groups of two chosen from the same three people must share someone. That shared person can carry information between the groups. The overlap does not tell the group how to settle two conflicting instructions or whether the person wrote the instruction down safely.
:::

:::note Membership is part of quorum arithmetic
If failed replicas are replaced by temporary owners, the effective read and write sets may differ from the fixed sets in the simple proof. Inspect the system's actual membership and reconciliation protocol before using the inequality to promise fresh reads.
:::

:::warn Watch out
Quorum intersection is a set statement. Linearizability requires a complete real-time ordering protocol, including concurrent and interrupted operations. Do not turn the inequality alone into a claim that every read sees one globally agreed latest value.
:::

:::interview Interview lens
**"Does a quorum read guarantee the latest write?"** Fixed-set intersection ensures the read reaches at least one member of a completed write set. I still need acknowledgement semantics, version selection, concurrent-write handling, membership behavior, and interrupted-operation rules. Those protocol details decide the actual read guarantee.
:::

:::key In one breath
Eventual convergence requires delivery and repair, while lag is an observable position or time difference. Versions must follow a defined authority and apply atomically with recoverable progress. Tombstones prevent stale resurrection until replay and repair make cleanup safe. Replica count and quorum intersection describe copies and sets; the ordering guarantee comes from the complete protocol.
:::

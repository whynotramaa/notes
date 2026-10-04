@part VII | Disaster recovery, RTO, and RPO | We recover from faults that defeat the normal replicas and their shared dependencies. A backup file is useful only if its restore path meets the service's promises. We will separate downtime from data loss, calculate recovery stages, and rehearse the return to service. | where:7

## 25. Disaster recovery includes usable restoration
An operator accidentally deletes the score table, and replication promptly copies the deletion. **Disaster recovery** restores the service after an incident that defeats ordinary fault tolerance. It needs independently recoverable state, executable procedures, credentials, infrastructure, and verification.

A **backup** preserves recoverable state from a chosen time. A replica maintains another serving copy and can copy a destructive change. The difference explains why replication and backup should be distinct parts of the design. A recovery copy may need different permissions and a deletion policy that routine application credentials cannot override.

@fig sd_reliability_backup | Separate roles. A specific storage product's retention and versioning semantics need verification.

Test the complete path. Create a replacement database, restore the snapshot, replay permitted log history, verify invariants, and update application routing. Secrets and configuration may require their own recoverable source. An encrypted backup without its usable key is not a usable backup.

:::story Picture this
A photocopy kept beside the original helps with a spilled drink on one page but not a fire in the room. A copy stored elsewhere still needs someone who knows how to find it and a readable format. Recovery needs both the surviving material and the procedure.
:::
## 26. RTO is the unavailability objective
Heron can tolerate an illustrative ten-minute recovery target for a regional disaster. The **recovery time objective**, or **RTO**, is the target maximum time to restore the required service after the defined incident. Specify when the clock starts and which operation must work when it stops.

The illustrative restore trace spends 60 seconds preparing a replacement, 180 restoring data, and 120 verifying and routing. Total recovery is 360 seconds. A 600-second objective leaves 240 seconds of margin in this model. That margin must cover variable startup, operator response, and recovery failures rather than disappear into an optimistic estimate.

@fig sd_reliability_rto | Illustrative serial recovery. A tested distribution of restore times is needed for an operational promise.

A time objective is a target, not a measurement. Record actual drill times and failures. Returning a process ping may happen before authorized reads or writes are safe; that earlier event cannot stop the clock for a service promise that requires those operations. [AWS recovery guidance](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/recovery-objectives.html) distinguishes these objectives.

:::note Different operations can have different RTOs
Score reads, scorer writes, clip upload, and background indexing need not return together. Explicit staged objectives can preserve a useful degraded service while the strongest write guarantees recover.
:::
## 27. RPO is the data-loss objective
A recovery snapshot is an illustrative 300 seconds old when the region fails. At 20 score events per second, 300 times 20 is 6,000 events potentially absent from that snapshot. This is a time gap translated through the stated event workload, not a universal loss bound.

The **recovery point objective**, or **RPO**, is the target maximum gap in recoverable committed data, commonly expressed as time before the incident. Log replay can shrink the gap if its log survives independently. A snapshot schedule alone does not establish the gap because a failed or delayed backup can make the latest usable copy older.

@fig sd_reliability_rpo | Worst gap in this illustrative constant-rate model. Independently retained log replay can reduce it.

An asynchronous replica lagging 2 seconds represents 40 events at the same rate. Do not describe that as guaranteed RPO without bounding lag during failure and checking what was acknowledged. Synchronous commitment to sufficient surviving replicas can protect acknowledged effects against a named fault, but it adds dependencies and latency.

@fig sd_reliability_lagloss | Lag translated into events. A lag sample is not a guaranteed recovery bound.

:::warn Watch out
RTO and RPO measure different damage. A service can return rapidly with missing data, or preserve every acknowledged write while remaining unavailable for a long recovery. State both promises.
:::
## 28. Restore verification and recovery drills
A restore finishes without errors, but the restored score rows do not match the event history. Successful file copying is only one stage. Recovery verification checks the service's invariants before making restored state authoritative.

For Heron, reconcile command identifiers, match versions, and score totals. Verify that object metadata does not advertise missing media and that old writers cannot commit after the new database is promoted. Record which acknowledged interval is preserved and which interval, if any, needs user reconciliation.

@fig sd_reliability_drill | Recovery procedure. Each stage needs credentials, retained inputs, and an observable result.

Run the drill with realistic size and permissions. A tiny restore does not exercise the bandwidth, storage allocation, and index rebuild required by production. Measure time from the chosen incident boundary to the promised operation, and test a deliberately unusable recovery copy so the fallback procedure is also exercised.

:::interview Interview lens
**"How do you prove your backup strategy works?"** I restore into an isolated environment using the actual recovery identity, replay the retained history, and check application invariants. I measure recovery time and the recoverable committed interval. I also test loss of the newest copy and key availability because creating a backup does not prove it can restore service.
:::
:::key In one breath
Disaster recovery handles faults beyond ordinary serving replicas. RTO limits the targeted service interruption, while RPO limits the targeted gap in recoverable state. Replication can copy corruption or deletion, so independently recoverable history has a separate job. Restore drills must include permissions, keys, application invariants, fencing, and routing before they count as successful recovery.
:::

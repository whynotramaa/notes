@part VII | Retention, compaction and replay | We decide what history survives. Reading does not reclaim records, and compaction does not retain every historical value. We will calculate retention, delete segments, compact keys, and rebuild consumers. | where:7

## 25. Time and size retention

A slow reader falls behind while the broker removes old segments. **Retention deletion** reclaims log segments under the topic’s configured age or size policy, independently of whether every consumer has read them.

The illustrative segment contains records zero through 999, with the next segment beginning at 1,000. When that segment is eligible and deleted, the earliest retained position can advance. Segment granularity means cleanup does not operate as one instantaneous deletion per aged record. A reader requesting an unavailable position needs a documented reset or rebuild policy. Increasing retention buys more replay time with disk and recovery costs; it does not accelerate the reader. See [Kafka 4.1 topic retention settings](https://kafka.apache.org/41/configuration/topic-configs/).

Segment deletion follows the retention policy rather than a vote by completed consumers. If the segment containing a reader's needed offset disappears, the reader cannot reconstruct that missing tail by requesting the same position forever. Compare its stored progress with the broker's earliest retained position and choose the declared reset or rebuild path. A reset to the newest position abandons earlier effects unless another source repairs them. A snapshot-based rebuild must name the source boundary it includes and the retained continuation after it. Retention is therefore part of the application's recovery promise.

@fig sd_kafka_25 | The retention rows delete an old segment covering offsets 0 to 999 while retaining the next segment; orange marks a slow reader that must reset or rebuild.

Silently resetting to latest can discard required effects. Earliest resumes only the retained history, which may still be insufficient for a full rebuild.

:::story Picture this
A library moves a whole shelf of newspapers to recycling when its age or storage rule says the shelf is eligible, even if a researcher has not finished reading it. A later shelf remains available, but the missing shelf leaves a gap in the researcher’s sequence. The researcher must arrange a replacement archive or reset rule before falling behind the last retained shelf.
:::

## 26. Compaction and keyed state

A key has several updates but a rebuilding state store needs only its latest value. **Log compaction** removes superseded keyed records under Kafka’s cleanup rules while preserving a recoverable latest-state representation.

The log’s offsets remain positions; surviving records need not form a dense sequence. A null keyed value can represent a tombstone, whose retention helps rebuilding consumers learn deletion before that marker is reclaimed. Compaction is asynchronous, so older values can remain until cleanup runs. It is not a promise of one physical record per key at every instant, and it does not preserve every historical change for audit or event replay. A topic can combine deletion and compaction policies with carefully defined recovery consequences.


Consider a projection whose stored match row still exists when its source key is deleted. The log records a tombstone, and a continuously running projector applies that deletion. A paused projector that resumes only after the relevant tombstone has expired cannot infer the missing deletion from the remaining records. Replaying into an already populated table can therefore retain an obsolete match. Rebuilding into an empty target with an appropriate snapshot and retained-log boundary, or preserving deletion history long enough for supported readers, supplies the missing proof. Compaction is not a universal full-history backup.

@fig sd_kafka_26 | The compaction rows replace an old value with a new value and retain a tombstone for deletion; orange marks the keyed state with offset gaps.

A consumer that begins too late can miss an expired tombstone and keep an obsolete local key. Its rebuild and retention contract must address that case.

:::note Compaction and tombstone limits
Compaction supports keyed-state rebuild, not an unlimited complete event history. It is asynchronous and leaves offset gaps. Tombstone retention must cover the rebuilding consumer’s recovery needs.
:::

## 27. Replaying a projection

The score-card projection loses its store but Kafka still retains the required events. A **rebuild cursor** identifies where reconstruction starts and how a new projection catches up to the live source.

Create a new derived store, replay from the valid source boundary, and apply events with the same version or deduplication rule. Record its completed contiguous position. As live input continues, the new store needs spare processing capacity to catch up. Switch readers only after the required boundary and integrity checks hold, and keep an old-store fallback if appropriate. A replay must not reissue notifications or payment effects merely because those consumers also read the topic. Separate pure reconstruction from live external actions.

Build the replacement projection without letting readers confuse its partial state with the served view. Track the applied contiguous boundary and verify domain results against the intended source interpretation. New records continue arriving during replay, so the rebuild needs useful spare capacity after those arrivals. Once it reaches the required boundary, switch reads under an explicit cutover rule and preserve a recovery option if validation later fails. External effect consumers do not share this pure rebuild path. Reconstructing a score card must not send historic notifications simply because both consumers use the same log.

@fig sd_kafka_27 | The replay rows build an isolated store from retained events, checkpoint catch-up, and cut over after checks; orange marks the served new view.

If retention no longer covers the initial source, replay alone cannot rebuild complete state. Use a compatible snapshot plus continuation or another authoritative source.

:::warn Watch out
Rebuild from a valid retained source, track completed progress, and catch up while new input continues. Verify the required boundary before switching readers. Keep reconstruction separate from outside effects that must not repeat.
:::

## 28. Schema evolution in old history

A consumer upgrade expects a new field that old retained events do not contain. **Schema compatibility** is the rule that lets writers and readers interpret both old and new records without inventing incorrect meaning.

Define defaults only when they preserve domain meaning. Version the schema or use a compatible encoding and registry process appropriate to the system. Test new readers against old history and rolling deployments where old readers still see new records. A replay interpreter can transform older representations, but it needs a deterministic rule and tests. Keep event schema version distinct from source aggregate version and Kafka offset. One describes interpretation, one business order, and one log position.

Take an old record that lacks the new field and ask what its original domain meaning was. A default is valid only if it reproduces that meaning under the new reader, not merely because parsing succeeds. During rolling deployment, older consumers can also see newer writer output, so check that direction separately. The broker's faithful byte retention cannot protect a consumer from an incompatible interpreter. Record schema identity independently of aggregate ordering and partition position. Replay then uses an explicit interpretation rule instead of silently treating the latest reader code as the meaning of all stored history.

@fig sd_kafka_28 | The schema rows keep old records readable while a new reader uses a tested compatible interpretation; orange marks the separate jobs of schema, aggregate, and offset versions.

Treating a missing old field as zero can change a financial or score calculation rather than simply supplying a harmless default.

:::interview Interview lens
**"What must a schema change prove before a retained log is replayable?"** Compatibility applies to replay and rolling upgrades, not only newly written data. I would test old-history interpretation and mixed reader-writer deployment. Defaults must preserve meaning rather than silently turn a missing field into a value. I would keep schema, business version, and offset separate.
:::

:::key In one breath
Retention removes old segments under policy; compaction preserves a latest-state recovery representation by key with documented tombstone handling. Offsets are positions, not a dense promise after cleanup. Rebuilds need enough retained source and a cutover boundary.
:::

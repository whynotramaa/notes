@part III | Document stores: MongoDB | We keep related values together when readers and writers use them together. Flexible shape does not remove growth limits, invariants, or migration work. We will choose aggregate boundaries, compare embedding with references, and trace index maintenance. | where:3

## 11. Document aggregates

A viewer opens a clip and needs its title, owner, thumbnail key, and available encodings. A **document store** keeps named fields and nested values in one record. An **aggregate** is the bounded group of values the application treats as a useful read or update unit.

Keeping the clip's encoding metadata together makes the common lookup local. Heron's illustrative document has an 800-byte base and three 200-byte variant descriptors, totaling $800+3\times200=1,400$ bytes. These are metadata descriptors, not the video files themselves. Object storage owns the large media bytes.

The aggregate boundary should follow ownership and lifecycle. A variant descriptor belongs to the clip and normally disappears with it. A shared owner profile has its own updates and can outlive the clip, so copying every profile field creates another propagation problem. A reference preserves that independent ownership.

MongoDB writes are atomic at the single-document level, and it also supports multi-document transactions under its documented conditions. Those facts do not make every related value a good embedding candidate. [MongoDB atomicity documentation](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/) explains the operation boundaries. Choose a bounded aggregate first, then check the invariants that remain outside it.

@fig sd_nosql_document | Illustrative clip metadata groups owned fields; the computed three-variant document is 1,400 bytes.

## 12. Embedding versus references

A clip accumulates comments long after upload. Embedding every comment makes a single read convenient at first, but the collection grows independently. **Embedding** stores a related value inside its owning document. A **reference** stores an identifier used to find a separate record.

Assume 100,000 illustrative comments of 200 bytes each beside an 800-byte base. The embedded payload becomes $800+100,000\times200=20,000,800$ bytes. Even before product limits, reading or updating a growing aggregate changes the working set and write contention. An independently paged comment collection avoids loading the whole history for a clip overview.

Embedding is useful when values are bounded, read together, and updated within the same ownership boundary. References are useful when values grow independently, have many owners, or change under a separate lifecycle. [MongoDB data-modeling guidance](https://www.mongodb.com/docs/manual/data-modeling/best-practices/) describes these tradeoffs; the decision still depends on Heron's concrete access patterns.

A reference adds another access path, so plan the read. Batch the comment-owner identifiers instead of blindly making one remote lookup per comment. If a page requires a consistent relationship snapshot, state how the database or application provides it. Splitting records removes one growth problem while introducing coordination and lookup work.

@fig sd_nosql_embedding | Illustrative bounded encoding metadata is compared with an independently growing comment collection.

## 13. Schema evolution without surprise readers

A clip title changes from a string field to a translated-title map. Old readers still expect a string. **Schema evolution** changes stored shape or meaning while readers and writers continue to operate. The database's flexibility does not automatically make incompatible application versions agree.

Begin with a reader that accepts the old and new representations. Then deploy a writer for the new representation, migrate old records in a bounded background process, and verify that no unsupported old records remain before removing compatibility. During the overlap, define which representation wins when both exist.

Store a schema version when it helps distinguish meaning, but do not treat the number as the migration itself. A reader must actually interpret each supported version. Defaults need care: an absent visibility field may mean legacy public content, unknown content, or a malformed record. Choose the meaning before filling the field.

A migration can be retried after failure, so make each transformation idempotent and preserve source identity. Count progress by source records rather than attempted writes. Heron should also reject unsupported future shapes safely, because a rollback may encounter records written by the newer version. Compatibility includes deployment reversal, not just forward migration.

@fig sd_nosql_schema_migration | Illustrative compatible reader, new writer, backfill, and removal form distinct deployment states.

:::warn Watch out
"No schema" means fewer shape constraints may be enforced by the database. Applications still require types, meanings, and compatible versions. A missing or renamed field can fail a reader even when storage accepted the document.
:::

## 14. Secondary indexes and write amplification

A viewer asks for clips owned by a scorer, but only knows the owner identifier. A **secondary index** provides another lookup path using fields other than the base key. Its entries point to records or include selected fields needed by the query.

Heron can order clips by owner and creation time, then page through that owner's range. Assume 100,000 illustrative entries of 40 bytes each. One index adds 4,000,000 payload bytes; two add 8,000,000 before structural overhead and replicas. This index-entry size is an input to the exercise, not a product benchmark.

An update that changes indexed values may remove old entries and add new ones. For an illustrative record with two affected indexes, count one base update plus two removals and two additions, or five logical mutations. Actual implementations may batch or represent those mutations differently, but the maintenance obligation remains.

A distributed index can use a different key and freshness boundary from the base store. A fresh base record does not establish that a query through a stale index finds it. State whether the index is authoritative enough for the query, whether missing results are tolerated, and how deletions and repairs propagate to its entries.

@fig sd_nosql_secondary | Illustrative owner-and-time index locates clip identifiers before base-record retrieval.
@fig sd_nosql_index_updates | Illustrative two-index key change requires five logical mutations including the base update.

## 15. Building an index while writes continue

Heron adds an owner-and-time view after clips already exist. **Backfill** populates a new derived structure from existing authoritative records. A scan alone is insufficient when new writes continue, because records can change after their scanned position or appear after the scan's boundary.

Take a consistent source boundary, begin recording changes from it, scan existing records, and apply captured changes in version order. The exact snapshot and change-stream mechanism depends on the source. The invariant is that every relevant source state after the boundary has a route into the new view.

An illustrative 100,000-record scan at 1,000 records per second takes 100 seconds. If 20 new updates per second continue, 2,000 updates arrive during the scan. Replaying at 1,000 per second while new updates continue at 20 gives spare rate 980; clearing that backlog takes $2,000/980=2.0408$ seconds, rounded to four decimals.

Do not route readers merely because the scan completed. Verify source coverage, captured-change progress, version ordering, and a known readiness boundary. Compare selected query results with the authoritative source. Keep the old read path until the new one meets its correctness and performance contract, and retain a rebuild plan for a missed update.

@fig sd_nosql_backfill | Illustrative 100-second scan accumulates 2,000 updates; catch-up uses spare replay capacity, not total replay rate.

:::story Picture this
A directory copied from a changing address book becomes wrong while you write it. Mark where the copy starts, record every later edit, then apply those edits before declaring the directory complete. Finishing the initial copy is only one stage.
:::

:::note Large media stays outside the document
A clip document holds object identifiers, ownership, and processing status. It need not contain the media payload. This keeps metadata reads separate from large-byte transfer and gives each storage role its own lifecycle and access policy.
:::

:::interview Interview lens
**"Why use a document here?"** The clip's bounded owned metadata is usually read together, so a document makes the common operation local. Comments and shared profiles grow or change independently, so I keep references for those. I count index maintenance and state how schema changes and new indexes become ready while writes continue.
:::

:::key In one breath
Documents group bounded owned values, and references preserve independent growth or lifecycle. Schema evolution needs compatible readers, controlled writes, idempotent backfill, and rollback behavior. Secondary indexes add lookup paths and maintenance work. Building one safely requires a source boundary, captured changes, version ordering, and verified readiness before reads move.
:::

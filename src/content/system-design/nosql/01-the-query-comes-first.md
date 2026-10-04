@part I | Access-pattern-driven design | We design records around the operations that must be cheap. One layout cannot make every query local and every update independent. We will begin with user actions, bound their work, and assign meaning to copied facts. | where:1

## 1. Access-pattern-driven schema design

A viewer opens match `m7`, reads the latest score, and then scrolls its recent events. Those actions sound related, but they need different lookup paths. **Access-pattern-driven schema design** starts with the reads and writes the product requires, then chooses records and keys that make that work explicit.

For each action, state the known input, desired ordering, result bound, and freshness requirement. The latest-score read knows a match identifier and returns one record. History knows a match identifier and a sequence boundary, then returns a bounded page. A list of matches by organizer knows a different key and needs another ordered access path.

Record the write side too. A scorer appends an event and updates current score; a clip owner edits a title; a moderator deletes a clip. Ask which records must change together and which readers may temporarily see an older view. These answers constrain the model before a database brand enters the discussion.

Heron uses one concrete history workload: 20 illustrative events per second, each carrying 200 bytes. Over an hour that is 72,000 events and 14,400,000 payload bytes. A layout that is convenient for a handful of events may fail when its supposedly small embedded history grows through the whole hour.

@fig sd_nosql_access | Illustrative lookup contracts distinguish one latest record from a bounded history range.

## 2. Keys turn questions into bounded work

A caller knows the match, so searching every match to find its score is unnecessary. A **key** identifies a record or an ordered record group. A useful key turns the user's input into a narrow storage operation instead of asking the system to discover the relevant records by scanning everything.

Use `score:m7` for a direct current-state lookup. For history, pair match identifier `m7` with a sequence value. The query selects one match and reads sequence values after its cursor. These keys expose both ownership and order. A timestamp on its own may not distinguish events that share the same timestamp.

Sorting must match representation. The illustrative strings `m7:1`, `m7:2`, and `m7:10` sort lexicographically as `m7:1`, `m7:10`, `m7:2`. Fixed-width sequence strings `001`, `002`, and `010` preserve this tiny numeric order. A native numeric sort field avoids this particular string-encoding problem when the database supports it.

Now test the negative case. "Show every event mentioning a scorer" cannot use the match key when the caller does not know the matches. It needs a maintained scorer access path or a declared scan. Naming a field in a document does not automatically create an efficient route to that field.

@fig sd_nosql_key_order | Computed illustrative string ordering shows why an ordered key needs a deliberate encoding.

## 3. A small page can hide a large scan

The API returns only 20 clips, yet the database examines 100,000 candidates to find them. **Bounded work** means the operation limits what it must inspect, not merely what it returns. A response limit can conceal a broad scan if filtering happens after the storage engine selects candidates.

The illustrative ratio is $100,000/20=5,000$ examined records per returned record. Reducing the response page does not necessarily reduce that work. A matching owner-and-time index can narrow selection before filtering, while a low-selectivity filter may still examine many candidates inside that owner.

Describe the access path in order. The key locates a partition or range, the ordering identifies where to begin, and a result limit stops iteration. If a filter removes records along the way, count how far the iterator may travel before collecting a page. Sparse matches can create long and unpredictable waits.

For Heron history, a cursor containing the last sequence value can continue after that value without revisiting every older event. Concurrent writes require a pagination contract, such as a stable upper sequence boundary when a fixed history snapshot matters. The key defines efficient motion; the consistency policy defines what the reader is entitled to see.

@fig sd_nosql_scan | Illustrative 100,000 candidates for 20 results yield a 5,000-to-one examined/returned ratio.

## 4. Denormalization and copied facts

An event page shows a scorer's name beside every event. **Denormalization** copies a related fact into a read-friendly record so a reader need not fetch the related record each time. It exchanges some read-time relationship work for storage, write propagation, and repair work.

Assume an illustrative 24-byte display name appears in 1,000 event records. Those copies add 24,000 payload bytes. If each must change when the profile changes, renaming can require one source update plus 1,000 view updates, or 1,001 logical operations. This count excludes index maintenance and replicas.

The alternative keeps a scorer identifier in every event and resolves the current name while reading. A page can batch identifiers to avoid one network request per event. That design pays lookup and coordination cost at read time, but a rename changes one authoritative profile instead of every historical copy.

Do not choose by storage alone. Ask how frequently names change, how many readers reuse the same name, and what a partial propagation would mean. The cheapest read path may create a difficult deletion or correction workflow. Copy only after assigning each duplicate a source owner and a rule for becoming current.

@fig sd_nosql_copies | Illustrative source and copied labels require explicit freshness semantics.

## 5. Historical snapshots versus current truth

A scorer changes a display name after an event has happened. Should yesterday's event show the old name or the new one? A **snapshot** records a fact as observed at a particular event boundary. It can intentionally disagree with today's profile without being stale or incorrect.

For Heron, a historical audit view can store the observed scorer name beside the immutable event. A current community page can instead resolve the scorer identifier to the current profile. The two pages answer different questions. One copying policy cannot satisfy both meanings unless the record stores enough information to distinguish them.

Write that distinction into field names and read logic. `scorer_name_at_event` signals historical meaning; a field simply called `name` hides it. If a correction must change history, define whether it creates a correction event, a new version, or a controlled rewrite. Do not make ordinary profile updates silently rewrite an audit record.

For current derived copies, record source version and propagation progress. A reader that requires a fresh value may wait for that version or use the authoritative source. A reader that permits older values can display the derived view. The data model becomes clearer once every duplicate has a stated reason to exist.

@fig sd_nosql_snapshot | Illustrative profile rename leaves historical snapshots unchanged while current views follow the source version.

:::story Picture this
A delivery slip records the address used for that delivery. A contact book records the person's current address. They can disagree because they answer different questions. Rewriting every old delivery slip after a move would erase useful history.
:::

:::note The model is a contract
The same field can mean current state, an event snapshot, or a cached answer. Choose one meaning and name it. Schema flexibility does not remove the reader's dependence on that meaning.
:::

:::warn Watch out
A result limit is not a scan limit. Inspect selected candidates, filters, ordering, and storage reads before claiming that a small response implies bounded request work.
:::

:::interview Interview lens
**"Why did you denormalize this field?"** I state the read it removes and the source that owns the fact. Then I explain whether the copy is historical or current, how a correction or rename propagates, and how a missed update gets repaired. The added write and deletion work is part of the decision.
:::

:::key In one breath
Start with access patterns, invariants, and explicit result and work bounds. Keys turn known inputs into narrow lookups or ordered ranges. Denormalization shifts relationship work into storage and propagation. Historical snapshots and current copies need different update rules, so every duplicated fact must have an owner and a meaning.
:::

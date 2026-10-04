@chapter faq | Interview question bank | Answer with the mechanism, the example, and the boundary of the guarantee.

### The query comes first

**Q1. Why begin with access patterns?**

They tell you which inputs are known, which order is needed, and how much work is acceptable. A match lookup, an event range, and a scorer-wide query need different paths. Record writes and invariant boundaries too before selecting a model.

**Q2. What belongs in an access-pattern contract?**

The key input, result bound, ordering, freshness, write frequency, and hottest plausible owner. Include the operation's failure behavior and atomicity needs. These make the eventual key layout reviewable rather than merely convenient.

**Q3. Why can a 20-result page still be expensive?**

A filter may examine many candidates before finding the page. The illustrative scan examines 100,000 to return 20, or 5,000 candidates per result. Bound selection and traversal work as well as output size.

**Q4. What does denormalization cost?**

It creates copied facts with storage, propagation, correction, and deletion obligations. A current copy needs a freshness rule, while a historical snapshot can remain intentionally unchanged. The saved read work must be weighed against the actual update and repair workload.

**Q5. Should a renamed scorer change old events?**

That is a product semantics choice. An event snapshot preserves the name observed then; a current-name view follows the profile. Name the field's meaning so ordinary profile updates do not accidentally rewrite audit history.

**Q6. Why does key encoding matter?**

Stored order follows the key's actual representation. The strings 1, 2, and 10 sort lexicographically as 1, 10, 2. Use an order-preserving encoding or a supported numeric sort field when numeric sequence is the intended range.

### Key-value records

**Q7. Is Redis necessarily a cache?**

No, its interface does not assign its data role. A cache can rebuild from another owner; authoritative state needs persistence and recovery under the promised failures. Name the configured role before claiming acknowledged writes survive.

**Q8. How does a conditional write prevent a lost update?**

The store checks expected state and applies the update atomically. If two writers expect version 7, only the defined successful transition can proceed before the other sees changed state. Separate read-then-write calls leave a race between the check and replacement.

**Q9. Does eviction have the same meaning as deletion?**

No, eviction removes a derived entry under a space policy while an authoritative deletion changes a product fact. Eviction needs a bounded rebuild path. Deletion needs ordering and propagation rules so stale retries cannot restore the fact.

**Q10. What acknowledgement boundary matters?**

State whether success follows an in-memory mutation, log append, durable flush, or required replica acknowledgement. Those states survive different failures. Recovery tests must match the exact promise rather than treating the presence of persistence files as proof.

**Q11. Are Dynamo and DynamoDB interchangeable?**

No, the original Dynamo design and the managed DynamoDB product have different contracts. Inspect the product operation and its read and index consistency options. Do not attach a paper's reconciliation behavior to another API because the names are similar.

**Q12. What makes a partition key good?**

It narrows important queries while distributing the expected and hottest demand within the required ownership rules. A key with many possible values still performs poorly if nearly everyone requests one value. Bucket growth and active-write concentration need separate checks.

### Documents

**Q13. When should documents embed values?**

When the values are bounded, owned together, and normally read or updated together. Clip variant descriptors fit that reasoning. An independently growing comment collection or widely shared changing profile often needs references and its own paged path.

**Q14. Does a flexible schema remove migration work?**

No, readers still depend on types and meaning. Deploy compatibility, change writes, backfill, verify coverage, then remove the old representation. Include rollback readers that may encounter newer records.

**Q15. What does a secondary index add?**

A maintained alternate route from another field to the needed records. It consumes entries and update work and may have a distinct freshness boundary. The base record being fresh does not prove an eventual index query finds it immediately.

**Q16. How do indexed updates amplify writes?**

A changed key can require removing an old entry and adding a new one. The illustrative two-index change has one base update plus four index mutations. Replicas, logs, and retries add more work outside that logical count.

**Q17. When is a backfilled index ready?**

After coverage and captured-change progress reach the declared source boundary and results are verified. Finishing the initial scan alone can leave updates missed during the scan. Keep the prior read behavior or label incomplete results until the required readiness contract holds.

### Wide-column records

**Q18. What is Bigtable's original data model?**

A sorted sparse mapping indexed by row key, column key, and timestamp. Row-key order determines useful scan locality. It does not automatically make every application query local or enforce every relational invariant.

**Q19. Why can timestamp-leading writes be hot?**

New keys can accumulate at the latest ordered region. Prefix spreading distributes that demand but makes ordered reads merge several streams. Time bucketing bounds a group's historical growth without necessarily spreading the active bucket's writes.

**Q20. What do Cassandra clustering columns do?**

They order rows inside the chosen partition. The partition key locates the group and the clustering order makes selected ranges cheap. Another global ordering or relationship query requires another access path, not an assumed relational join.

**Q21. How large is Heron's illustrative history bucket?**

At 20 events per second, a 15-minute bucket holds 18,000 events. With 200 bytes each, payload is 3,600,000 bytes before overhead and copies. Measure the hottest bucket and owner in addition to the mean.

**Q22. Why can a one-bucket-duration query touch two buckets?**

The requested interval may begin in the previous bucket and end in the current one. Bucket alignment, not duration alone, decides group count. Calculate identifiers from time boundaries and merge the relevant ordered ranges.

**Q23. What does a query-specific table require?**

A source owner, source identity, update route, progress boundary, deletion policy, and rebuild mechanism. It exchanges extra maintenance for a selected cheap read. If it cannot be reconstructed, it is another undocumented authority rather than a disposable view.

### Graph relationships

**Q24. When does a graph model help?**

When repeated relationship paths and adjacency work are important queries. Define edge types, direction, properties, and result semantics first. A direct score key or simple fixed relation is not sufficient reason by itself to add a graph store.

**Q25. What limits graph traversal?**

Degree, depth, edge filters, frontier size, execution budget, and visited-state semantics. A small final page can still require a large expansion. Inspect high-degree hubs and distinguish complete absence from deliberately truncated exploration.

**Q26. Why distinguish reachability from path counting?**

Several paths may reach one node. A reachability result can deduplicate that node, while an evidence query may need every valid route. The visited-set optimization must preserve the specific result meaning.

**Q27. Where should graph authorization happen?**

Restrict which nodes and edges may influence traversal, not only which final rows may be displayed. Hidden edges can affect counts or ranking if filtering happens too late. Apply the same visibility semantics to caches and derived recommendations.

**Q28. Is SQL versus NoSQL mainly scalability?**

Scale matters, but the labels do not specify one set of guarantees. Compare known queries, invariants, ordering, transaction scope, recovery, and operational cost. Begin with one store if it satisfies those contracts and add views for measured needs.

### Copies and consistency

**Q29. What does eventual consistency promise?**

Convergence under delivery and repair assumptions after relevant updates stop. It does not alone bound staleness or establish one intermediate observation order. Give each read operation an explicit acceptable-lag and fallback policy.

**Q30. Why reject delayed versions?**

An older replacement can overwrite newer source state if replay is blind. Compare source versions inside the update's atomic boundary. The ordering identifier needs a defined authority; unrelated writers or wall clocks do not automatically form one sequence.

**Q31. Is version comparison sufficient for increments?**

Not always, because replaying an operation can repeat its effect. A replacement snapshot and an increment have different replay semantics. Preserve event identity and use deduplication or an appropriate atomic operation boundary for effects.

**Q32. Why keep a tombstone?**

It retains deletion order so delayed old state cannot recreate the record. Cleanup must wait until replay and repair cannot reintroduce older data under the supported failure assumptions. Also propagate removal to indexes, graphs, and caches whose visibility contracts require it.

**Q33. What makes repair different from waiting?**

Repair detects or replays a missing change using source identity, versions, or checkpoints. Waiting works only when an actual delivery path resumes the missing update. Recovery also requires spare capacity after continuing arrivals.

**Q34. What does replication factor measure?**

The number of copies assigned to the logical record under the membership rules. It increases storage and repair obligations. It does not by itself state when a read is fresh or whether an acknowledgement means durable persistence.

**Q35. What does quorum intersection prove?**

For the same fixed members, read and completed-write sets overlap when their sizes sum above replica count. In the three-copy, two-read, two-write example, the overlap lower bound is one. Ordering, persistence, concurrent writes, and membership behavior still need a protocol.

**Q36. Can a quorum of two survive one missing member?**

In the illustrative fixed three-member set, two reachable members remain after one is unavailable. Whether operations actually proceed also depends on the protocol and failure behavior. The count does not prove availability under every partition shape or safety under membership changes.

### A complete data model

**Q37. Who owns truth in a multi-store design?**

One authoritative component owns each accepted fact or invariant. Derived views consume its identities and ordered changes under explicit freshness and rebuild rules. Specializing a read layout does not authorize it to independently invent accepted events.

**Q38. How much write work do three views create?**

At 20 events per second and one write to each of three representations, logical write demand is 60 per second. Three replicas per representation give 180 counted copy writes per second in the simplified model. Indexes, logs, retries, and maintenance remain separate.

**Q39. Walk me through a score event and one failure.**

The scorer supplies operation identity and expected sequence, the owner validates and commits once, and each view applies the accepted source event with recoverable progress. If a consumer crashes, replay follows the source position and avoids repeating the effect. Readers use the authority or a declared-lag view according to their freshness need.

**Q40. What changes when a new query is added?**

Its known keys and required order may need another derived layout. Backfill from a source boundary, capture ongoing changes, verify readiness, and preserve deletion and replay semantics. The new endpoint creates maintenance obligations rather than receiving an efficient query for free.

@chapter exercises | Exercises | One dot is a direct calculation, two dots require a trace or explanation, and three dots require a derivation, implementation, or complete design.

### Direct calculations

**E1** ● Count one hour of Heron history and its payload.

**E2** ● Compute a 15-minute bucket's count and payload.

**E3** ● Find the copied-name bytes for 1,000 labels.

**E4** ● Compute the three-variant clip document.

**E5** ● Compute payload if 100,000 comments are embedded.

### More resource counts

**E6** ● Count two secondary-index payloads.

**E7** ● Count three-hop candidates for branching factor three.

**E8** ● Compute the fixed quorum overlap lower bound.

**E9** ● Count maintained copy writes for three representations and three replicas.

**E10** ● Compute one day of source-log payload and three copies.

### Traces and choices

**E11** ●● Order the unpadded and padded sequence keys.

**E12** ●● Choose keys for latest score and bounded match history.

**E13** ●● Explain current names versus snapshots without equations.

**E14** ●● Trace a failed stale conditional writer.

**E15** ●● Explain embedding versus references without equations.

### Failures and recovery

**E16** ●● Trace an older update after deletion.

**E17** ●● Compute backfill duration and catch-up.

**E18** ●● Explain why bucket size alone does not prevent a hot owner.

**E19** ●● Deduplicate the three illustrative neighbor lists.

**E20** ●● Compute lag and recovery at the stated consumer rates.

### Derivations and complete designs

**E21** ●●● Prove the fixed-set overlap bound.

**E22** ●●● Show why overlap alone does not prove linearizability.

**E23** ●●● Write a version-aware replacement-view apply function.

**E24** ●●● Design a new scorer view while writes continue.

**E25** ●●● Defend the whole Heron data-model ledger.

@chapter solutions | Worked solutions | Illustrative inputs are stated in the chapter. Every worked arithmetic result is reproduced by scripts/system-design/capacity-review-numbers.py.

**E1.** Twenty events/s × 3,600 s gives 72,000 events. At 200 bytes per event, payload is 14,400,000 bytes, or 14.4 MB before overhead.

**E2.** The interval is 15 × 60 = 900 s. At 20 events/s it contains 18,000 rows, carrying 3,600,000 payload bytes. Four buckets cover an hour.

**E3.** Each assumed label is 24 bytes. Multiplying by 1,000 gives 24,000 payload bytes. A current-name rename can require one source update plus 1,000 copy updates, or 1,001 logical operations.

**E4.** The base is 800 bytes and variants add 3 × 200 = 600. Total illustrative metadata is 1,400 bytes; it excludes actual media files.

**E5.** Comments add 100,000 × 200 = 20,000,000 bytes. Adding the 800-byte base gives 20,000,800 bytes, before document structures and indexes.

**E6.** One index has 100,000 × 40 = 4,000,000 bytes of entries. Two contain 8,000,000 before structural overhead and replicas.

**E7.** The frontiers contain 3, 9, and 27 entries. Summing them gives 39 expansions in the no-overlap tree model. Distinct nodes in a graph with shared paths may be fewer.

**E8.** For N = 3, W = 2, and R = 2, R + W - N = 1. At least one fixed member overlaps a read set and completed write set; the protocol must still select and order versions.

**E9.** Twenty events/s × 3 representations gives 60 logical writes/s. Multiplying by 3 copies gives 180 counted copy writes/s, before logs, indexes, retries, or compaction.

**E10.** Twenty events/s × 200 bytes gives 4,000 bytes/s. Over 86,400 s, one copy contains 345,600,000 bytes. Three copies contain 1,036,800,000 bytes.

**E11.** Lexical order is m7:1, m7:10, m7:2. The fixed-width examples order as m7:001, m7:002, m7:010. The key representation must preserve the intended numeric order across every supported value.

**E12.** Use a direct match key for latest state, and a match-and-bucket partition with ordered sequence for history. Derive bucket identifiers from the requested interval and merge a bounded range. A scorer-wide query needs another route because its input does not identify the match groups.

**E13.** An event snapshot answers what name was recorded when the event happened. A current view answers what name the profile has now. Renames update current copies but leave historical snapshots unchanged unless an explicit correction policy says otherwise.

**E14.** Both writers read version 7. One atomic condition-and-update stores version 8; the other expected-version-7 condition fails against that new state. The failed writer must reread, merge under policy, or reject, rather than overwrite unconditionally.

**E15.** Embed bounded values with shared ownership and lifecycle when common reads use them together. Reference independently growing comments or widely shared profiles. Plan the extra read path and invariant boundary instead of treating references as cost-free.

**E16.** Store version 8, then retain deletion marker version 9. A delayed replacement at version 7 or 8 fails the version comparison. Removing the marker before all supported replay and repair paths exclude those old states can resurrect the record.

**E17.** A 100,000-record scan at 1,000 records/s takes 100 s. Twenty updates/s produce 2,000 changes during that scan. Spare replay is 1,000 - 20 = 980/s, so catch-up takes 2,000/980 = 2.0408 s rounded, under the simplified constant-rate model.

**E18.** All current events for a popular match may still enter its active bucket. Bucketing bounds growth over time, while prefix spreading distributes concurrent demand. Prefixes require readers to merge additional ranges, so inspect that cost separately.

**E19.** The lists contain nine entries altogether: x,y,z; y,z,w; z,w,v. Their union is x,y,z,w,v, or five nodes. Reachability can expand that union once, while path-sensitive results may need to preserve the repeated routes.

**E20.** Five seconds behind at 20 events/s is 100 unapplied events under constant rates. A consumer applying 40/s while 20/s continue has spare rate 20/s. The backlog drains in 100/20 = 5 s.

**E21.** For read set A and completed write set B within N fixed members, the union cannot exceed N. Since |A ∩ B| = |A| + |B| - |A ∪ B|, intersection is at least R + W - N. A positive bound proves overlap but says nothing by itself about version ordering or durable acknowledgement.

**E22.** Two concurrent writes can produce conflicting replica versions while satisfying the counted sets. An overlapping reader still needs a protocol deciding their order and handling writes whose response was interrupted. The set proof supplies a member carrying information, not the complete real-time history.

**E23.** The code below assumes one source assigns comparable integer versions for each key. It models atomic compare-and-replace; a real implementation must use a storage boundary that makes the check and update indivisible, including deletion markers.

```python
def apply_replacement(stored, incoming):
    if stored is None or incoming["version"] > stored["version"]:
        return dict(incoming)  # also keeps a tombstone's version
    return stored

state = apply_replacement(None, {"version": 8, "score": 42})
state = apply_replacement(state, {"version": 9, "deleted": True})
assert apply_replacement(state, {"version": 7, "score": 40}) == state
```

**E24.** Choose a source snapshot or boundary and capture later changes. Backfill source identifiers into scorer keys, replay changes by defined order, verify coverage and deletion progress, then declare readiness. Preserve a source retention and checkpoint policy that can rebuild the view after loss.

**E25.** One owner validates and commits accepted score events. Versioned latest-state and bounded match-history views reproduce them; optional scorer or graph views serve distinct measured queries. Count 60 logical writes/s and 180 copy writes/s in the stated three-view exercise, plus source log payload and recovery spare service. Every added representation declares freshness, deletion, identity, and rebuild behavior.

Read the next boundary when you can redraw the request path and explain one failure without consulting the pictures.


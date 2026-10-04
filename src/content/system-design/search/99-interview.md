@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. Why does a leading-wildcard LIKE not solve ranked search?**

It asks for consecutive characters and gives neither analyzed-word semantics nor a relevance order. An ordinary ordered text index usually cannot narrow a leading wildcard into a prefix range. A database can still support specialized full-text or trigram indexes. Choose capabilities and workload boundaries rather than treating SQL as incapable of search.

**Q2. What is inverted about an inverted index?**

Source documents point to their terms. The index reverses that direction so a term points to documents containing it. The query begins with words, looks up their posting lists, and combines document IDs. That avoids reopening every document merely to check whether the word occurs.

**Q3. What belongs in a posting?**

At minimum it identifies a document containing the term. Frequency and positions add repetition and phrase information. The representation may also include other per-occurrence metadata. A query must not require information that ingestion discarded, and richer postings cost more storage and writing work.

**Q4. Trace the AND of red and bird.**

Compare sorted lists [1,3] and [1,2,4]. Equal first entries emit 1. Then compare 3 with 2 and advance the smaller entry. Compare 3 with 4 and exhaust the red list. The answer is [1], before phrase and permission checks.

**Q5. How is OR different?**

OR forms a union of eligible IDs. The two lists in our corpus produce [1,2,3,4]. It has more candidates than their intersection. Scoring can still reward documents matching more terms, but matching semantics should be stated separately from that ordering decision.

**Q6. Why preserve positions?**

Membership cannot distinguish red bird from bird red. Positions let a phrase query test order and distance. In document 1, red is at 1 and bird at 2, so adjacency succeeds. Position storage increases bytes per occurrence and is unnecessary for pure membership queries.

**Q7. What is an analyzer?**

It is the ordered transformation pipeline that turns input text into comparison tokens. Tokenization chooses boundaries, while later filters can normalize or expand tokens. Query and index representations must agree. Inspect emitted terms before assuming a missing result is a ranking problem.

**Q8. Why preserve original text?**

The representation useful for lookup can fold case, accents, or word forms. Those transformations may lose spelling, punctuation, and distinctions required for display or identity. Store original content separately. Exact identifiers and forgiving text search should use explicit separate rules.

**Q9. Does lowercasing always improve search?**

It can improve matching when case is irrelevant, but can destroy distinctions when case participates in identity or meaning. The rule depends on field and language. Test examples and preserve source values. A broader candidate set is not automatically a better result set.

**Q10. What do stop words change?**

They reduce selected common tokens but can change phrase behavior and meaning. Position gaps matter when words are omitted. A query quoting a title may need common words retained. Omitting them should be an analyzer decision justified by the workload.

**Q11. Why use fields?**

Fields assign distinct representations and query responsibilities to document components. A title can use analyzed text while owner and tenant use exact equality. Field boundaries also keep terms from combining across unrelated components. They allow weighting and filtering without losing the meaning of each value.

**Q12. What is document frequency?**

It counts documents containing a term, not all occurrences of that term. Bird appears in three documents even though document 4 repeats it. This collection statistic supplies rarity weighting. Term frequency describes a different dimension inside one document.

**Q13. Explain IDF.**

A term matching nearly every document discriminates poorly. IDF downweights common terms and gives rare terms more contribution under the scoring model. A rarity score does not establish factual truth. State the smoothing and logarithm convention before comparing numeric values.

**Q14. Why is TF-IDF a family?**

Implementations choose different frequency transforms, smoothing, and normalization. Without those choices, the phrase does not identify a reproducible score. Our natural-log N/df example gives red 0.693147. A production engine may use another stated variant.

**Q15. What does BM25 saturation do?**

It gives diminishing benefit to repeated terms so raw repetition cannot grow the score linearly forever. Its frequency factor approaches a bound controlled by k1. Length normalization and rarity are separate factors. The purpose is a useful ranking assumption, not spam protection by itself.

**Q16. What does b control?**

It controls the strength of document length normalization in the stated BM25 formula. With b equal to zero, length does not influence that adjustment. Larger values increase the penalty for a document longer than the collection average. Tune using judgments for the actual field and query set.

**Q17. Are scores probabilities?**

No. They are comparison values under a query, representation, and scoring rule. Different queries can have different scales. A high score does not prove truth or permission. Evaluate whether the order serves users rather than interpreting the number as confidence.

**Q18. Why can shards affect ranking?**

A shard can use local document-frequency and length statistics. Uneven term distribution then changes score contributions across shards. Broader statistics gathering adds coordination and can improve comparisons for some workloads. Test whether the effect matters rather than prescribing an extra pass universally.

**Q19. What is precision?**

It is relevant returned results divided by all returned results. Three useful results among five gives 0.6 in the illustrative exercise. It assesses the result set under explicit relevance labels. Rank-sensitive quality needs another measure.

**Q20. What is recall?**

It is relevant returned results divided by relevant available results. Retrieving three of four gives 0.75. Increasing recall can introduce irrelevant results and reduce precision. The denominator requires a judged reference set rather than a guess from clicks.

**Q21. Why not make source and search writes independently?**

A crash between them can commit the report while losing its indexing intent. A transactional outbox or suitable change capture closes that gap. The indexer can later replay changes. Search remains a derived copy with a documented lag boundary.

**Q22. How do you handle repeated indexing events?**

Use stable document IDs and source versions. Repeating the same version leaves the same logical state. Older versions are rejected under an atomic version rule. Advance progress only after the required item outcomes are known.

**Q23. Why do bulk responses need inspection?**

One containing request can report success while individual documents fail. Each item may be accepted, permanently invalid, or recoverably rejected. Retry the appropriate items and record repairable source identities. A single request-level success count hides missing documents.

**Q24. What does refresh guarantee?**

It makes indexed operations visible to a search view. That is different from the durability boundary needed to survive a crash. Name both. Forced refreshes also create maintenance costs, so a visibility requirement should determine when to wait or refresh.

**Q25. Why are segments immutable?**

Stable segments let readers use a consistent view while writers add new data. Updates create new representations and mark old versions dead. Merges later reclaim and consolidate data. This separates logical visibility from physical cleanup at the cost of background rewriting.

**Q26. Why is a tombstone useful?**

It records deletion at a source version. A delayed older update can then be rejected rather than resurrecting the document. Tombstone retention must cover possible replay or rely on another durable version registry. Follow the delete into suggestions and caches too.

**Q27. What does a primary shard own?**

It owns a subset of document writes selected by routing. Its replicas copy that subset. Primary count partitions logical ownership, while replica count duplicates data. Those counts have different effects on write work, read options, storage, and failure behavior.

**Q28. What does a coordinating node do?**

It receives the query, dispatches to required shard copies, merges candidates, and retrieves chosen display data. It must report missing shard work according to the product contract. It can itself become a CPU, memory, or network bottleneck for broad queries.

**Q29. Why return local top k?**

A global top-k document cannot have k strictly better documents on its own shard under the same comparison rule. Thus local top-k candidates suffice for global top k. Tie-breaking must be consistent. Fetching full source content can wait until the coordinator selects final winners.

**Q30. How do replicas help reads?**

They provide alternative usable copies of each logical shard, permitting distribution of read load and survival of failures. A query normally uses one selected copy per required shard. Replicas also receive write work and consume storage. They are not independent additional corpus partitions.

**Q31. How does routing help tenant queries?**

A tenant routing key can place its documents in a known ownership group so the query touches fewer shards. It can also concentrate a large tenant on a hot shard. The routing key changes both read scope and load balance. Choose it from measured tenant distributions.

**Q32. Why is deep offset pagination expensive?**

Each shard may need enough candidates to cover the global skipped prefix and returned page. Skipping 1,000 for ten results across four shards can collect 4,040 candidates. A stable search-after cursor avoids that repeated discarded prefix. It still needs tie-break values and view semantics.

**Q33. What does a point-in-time view cost?**

It preserves a search population for consistent paging while writes continue elsewhere. The engine may retain old segments and reader resources until expiration. Set a lifetime and cursor recovery rule. It is a consistency choice with a resource budget.

**Q34. How is a prefix query different from a substring query?**

A prefix begins at the term start and can use an ordered dictionary range or trie path. A substring can begin inside a term and needs another representation. Bird matches bir as a prefix; songbird does not. State semantics before choosing an index.

**Q35. What do edge n-grams trade?**

They store leading token fragments so incomplete input has prepared lookups. More fragments increase index size and ingestion work. Bounds on fragment lengths control that growth. Autocomplete still needs ranking, field choices, and permission filtering.

**Q36. What is fuzzy search?**

It matches terms within a specified edit distance from the input. The edit convention matters, including whether transposition is a single operation. It can expand into many dictionary terms, so use limits and appropriate fields. Exact identity checks must not become fuzzy.

**Q37. How should autocomplete handle races?**

The client tags input requests with an order and accepts only responses appropriate to the current input. Canceling earlier requests reduces some work but does not prove server execution stops. Debounce and server budgets control load. Cache keys must retain query and visibility context.

**Q38. How do you rebuild an index safely?**

Copy an authoritative source snapshot associated with a change position into a new index. Replay later versioned changes, including deletes. Validate representation, queries, counts, and permissions before switching routing. Keep capacity for overlapping copies and a stated rollback interval.

**Q39. Is a replica a backup?**

No. It can faithfully repeat an accidental deletion or corrupt application write. A retained source, change history, and tested restore path address different failure classes. Recovery needs timed procedures and enough capacity to catch up while new writes continue.

**Q40. What makes the design complete?**

It specifies query semantics, ranking, freshness, permissions, shard work, source publication, deletion propagation, partial responses, and recovery. The arithmetic counts copies and background work without turning assumptions into benchmarks. The next validation uses real queries and writes under failure and rebuild load.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** • Compute bytes scanned for a million 500-byte reports.

**E2** • Compute bytes for 100 candidate reports and the scan ratio.

**E3** •• Build red and bird document lists.

**E4** •• Intersect the lists and show pointer moves.

**E5** •• Union the lists with no duplicate ID.

**E6** •• Explain why document 1 satisfies red bird as a phrase.

**E7** • Delta-encode [1,2,4] and reconstruct it.

**E8** • Count uncompressed ID and position bytes for twelve occurrences.

**E9** • Calculate the natural-log TF-IDF rarity weight for red.

**E10** •• Compute the smoothed bird IDF in the stated BM25 form.

**E11** •• Explain the one-occurrence BM25 contribution at average length.

**E12** •• Compare bird twice with bird once.

**E13** •• Compute document 1 score for red bird under the chosen formula.

**E14** • Calculate precision and recall for three useful results among five, with four useful available.

**E15** • Calculate assumed index bytes and replicated bytes.

**E16** • Calculate equal primary sizes and total shard copies.

**E17** •• Trace illustrative routing for IDs 1 through 4.

**E18** • Count shard tasks at 1,000 queries per second touching four shards.

**E19** •• Count candidates for top ten and distinguish fetch count.

**E20** •• Compare offset 1,000 with a cursor for ten results.

**E21** • Count buffered changes in a one-second refresh exercise.

**E22** •• Trace update 7, delete 8, and late update 6.

**E23** •• Compute rebuild duration and overlapping changes.

**E24** •• Compare edit distances for bird, brd, and brad against bird.

**E25** ••• Design a safe analyzer migration with an indexing failure halfway through.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** Multiply 1,000,000 by 500 to obtain 500,000,000 bytes. This excludes object and transport overhead. It is the document bytes inspected by the stated full-scan exercise.

**E2.** Candidates require 100 times 500, or 50,000 bytes. Dividing 500,000,000 by 50,000 gives 10,000. Candidate selectivity is assumed, so this is a work comparison rather than a measured latency speedup.

**E3.** Walk the four source strings. Red appears in documents 1 and 3, giving [1,3]. Bird appears in documents 1, 2, and 4, giving [1,2,4]. Repeated bird occurrences in document 4 affect frequency, not the distinct membership list.

**E4.** Start at 1 and 1, emit 1, and advance both pointers. Compare 3 and 2, advancing bird to 4. Compare 3 and 4, exhausting red. The result is [1]. Bodies are not scanned during these pointer operations.

**E5.** Emit 1 once from the equal entries. Then emit 2 from bird, 3 from red, and 4 from bird. The result is [1,2,3,4]. This is an any-term candidate set, not the exact phrase result.

**E6.** Red has position 1 and bird position 2. The latter equals the former plus 1, so the stated adjacency condition holds. Membership alone would not establish this. Document 4 has bird positions 1 and 2 but lacks red.

**E7.** The first value is 1, then differences are 2 minus 1 equals 1 and 4 minus 2 equals 2. Store [1,1,2]. Prefix sums recover 1, then 2, then 4. Actual byte savings require a stated integer codec.

**E8.** Twelve four-byte IDs occupy 48 bytes. Twelve four-byte positions occupy another 48 bytes. Together they occupy 96 bytes, excluding dictionaries, frequencies, document storage, headers, and live masks.

**E9.** There are four documents and red occurs in two. N/df equals 2. The natural logarithm gives 0.693147 after rounding to six decimals. This is the explicitly chosen variant, not every formula called TF-IDF.

**E10.** Insert N=4 and df=3. The ratio is (4-3+0.5)/(3+0.5)=1.5/3.5. Add 1 and take the natural logarithm to obtain 0.356675 rounded. The numbers script keeps the full-precision value.

**E11.** At average length the adjustment is 1. Frequency factor is 1 times 2.2 divided by 1 plus 1.2, so it equals 1. Multiplying bird IDF by 1 leaves 0.356675 rounded.

**E12.** Twice gives the frequency factor 2 times 2.2 divided by 2 plus 1.2, or 1.375. Multiplying by the bird IDF gives 0.490428 rounded. It is larger than 0.356675 but less than twice that score.

**E13.** Both terms appear once in a length-three document equal to the average. Their frequency factors are each 1. Red contributes 0.693147 and bird 0.356675. Their full-precision sum rounds to 1.049822.

**E14.** Precision is 3/5=0.6. Recall is 3/4=0.75. The two denominators answer different questions, and both rely on explicitly judged relevance rather than click counts alone.

**E15.** Source bytes are 1,000,000 times 500, or 500,000,000. The assumed 1.5 expansion gives 750,000,000. Three total copies give 2,250,000,000 data bytes. Temporary data and maintenance capacity remain additional.

**E16.** Divide 750,000,000 by four to get 187,500,000 bytes per primary under equal balance. Four primaries times three total copies gives twelve shard copies. This uses total copies, not replicas excluding primary.

**E17.** Modulo four gives 1, 2, 3, and 0. Repeated writes using the same ID map to the same ownership group. This rule teaches deterministic routing but does not claim to be Elasticsearch internal hashing.

**E18.** Every request creates four shard query executions. Multiply 1,000 by four to get 4,000 per second. Replica selection distributes those executions across copies; it does not multiply required logical shard coverage.

**E19.** Four shards each return local top ten, making forty candidates. The coordinator keeps global top ten and fetches those ten bodies. Candidate metadata and final source documents are different byte costs.

**E20.** The offset approach can request 1,010 candidates from each of four shards, or 4,040. A stable search-after query requests the next ten per shard, or forty. Both require consistent comparison and tie-breaking.

**E21.** The assumed input is twenty changes per second. Multiplying by one second gives twenty. This is buffer grouping arithmetic, not a maximum freshness bound because pipeline lag is separate.

**E22.** Apply version 7 as live, then version 8 as deleted. Compare late version 6 against 8 and reject it. A repeated version 8 leaves the same state. The deletion version must remain available across the replay horizon.

**E23.** A million documents divided by an assumed 5,000 documents per second gives 200 seconds. At twenty source changes per second, 4,000 occur during copying. Replay those changes with versions and include deletes before switching.

**E24.** Bird to bird costs zero. Brd to bird needs insertion of i and costs one. Brad to bird needs two substitutions under insertion/deletion/substitution Levenshtein rules. A transposition-aware convention would be a different explicitly stated model.

**E25.** Keep the old index serving queries. Record the source snapshot and change position for the new representation. Resume idempotent copying and replay with source versions, quarantine invalid items explicitly, and validate permission and query behavior. Switch the logical name only after the new index meets its freshness requirement; capacity and rollback policy include both copies.

Read the next unit when you can explain these mechanisms without the pictures.

### Primary sources

[Elasticsearch near-real-time search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search). Reader refresh and segment visibility.

[Elasticsearch reading and writing documents](https://www.elastic.co/docs/deploy-manage/distributed-architecture/reading-and-writing-documents). Primary-backup replication and request coordination.

[Lucene BM25Similarity](https://lucene.apache.org/core/9_12_1/core/org/apache/lucene/search/similarities/BM25Similarity.html). Parameter meanings and the documented IDF form.

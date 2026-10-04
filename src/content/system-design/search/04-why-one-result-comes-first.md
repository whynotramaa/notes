@part IV | Ranking: TF-IDF and BM25 | We give matching documents a comparison score. Raw word counts reward repetition and ignore whether a word is common. We will derive TF-IDF intuition, BM25 saturation, length normalization, and field-aware ranking. | where:4

## 13. Rare terms carry more evidence

Every report could contain *match*, while only a few contain a team name. Matching the team name tells us more about the user's intent. **Document frequency** counts how many documents contain a term. **Inverse document frequency**, or IDF, gives rarer terms more weight.

A simple TF-IDF variant uses $\log(N/df)$, where $N$ is the number of documents and $df$ is document frequency. Read that as the logarithm of collection size divided by the number of documents using the term. In our corpus, `red` appears in 2 of 4 documents, giving $\log(4/2)=0.693147$. A term appearing in all documents would receive zero under this particular variant.

@fig sd_search_idf | Computed values for the stated natural-log TF-IDF variant. Different variants use different smoothing.

**TF-IDF** combines term frequency inside a document with inverse document frequency across the corpus. It is a family of formulas rather than one uniquely specified score. State normalization and smoothing before comparing numbers. Rarity measures discrimination under the text representation, not factual accuracy or trustworthiness.

:::story Picture this
If every shelf label says *book*, that word tells the librarian little. A rare author name narrows the search. Repeating the author name on a single label does not make that book infinitely useful. Rarity across books and repetition inside a book are separate pieces of evidence.
:::

## 14. BM25 limits the benefit of repetition

Document 4 repeats *bird*, while documents 1 and 2 use it once. Rewarding repetition linearly lets a spammer repeat a term until a poor document dominates. **BM25** is a relevance scoring family that gives diminishing returns for repetition and adjusts for document length.

For one term, use this stated illustrative form:

$$s=\log\left(1+\frac{N-df+0.5}{df+0.5}\right)\frac{tf(k_1+1)}{tf+k_1(1-b+b\ell/\overline{\ell})}.$$

Read the first factor as a smoothed rarity weight. The second factor rewards term frequency $tf$ while its denominator grows with frequency and a length adjustment. Here $k_1$ controls saturation, $b$ controls the strength of length normalization, $\ell$ is document length, and $\overline{\ell}$ is average document length. These are named tuning values, not measured truths about language.

All four tiny reports have length 3, so average length is 3. With $k_1=1.2$ and $b=0.75$, the length term becomes 1. For *bird*, $df=3$ gives IDF $0.356675$. One occurrence contributes $0.356675$, while two contribute $0.490428$. Doubling occurrences increases the score by less than a factor of two.

@fig sd_search_saturation | Computed BM25 values, rounded to six decimals for the stated four-document corpus and parameters.

[Lucene's BM25 API](https://lucene.apache.org/core/9_12_1/core/org/apache/lucene/search/similarities/BM25Similarity.html) documents its parameter meanings and IDF form. Scores in this chapter are calculated with the explicit formula above, so they can be reproduced independently of a deployed engine version.

## 15. Length normalization compares context

A long report has more opportunities to mention *bird* once than a short title does. BM25's length adjustment counters that tendency. For a document twice the corpus average length, the adjustment is $1-0.75+0.75\times2=1.75$. The denominator grows, reducing the same term-frequency contribution.

This correction is an assumption about how length relates to relevance. A long match report may be useful precisely because it explains more. Setting $b$ close to zero reduces the length penalty. Setting it close to one makes the document-to-average length ratio more influential. Tune using representative judgments, not a claim that a parameter is universally optimal.

@fig sd_search_lengths | Computed length adjustment for the explicitly chosen illustrative parameter b=0.75.

A multi-term score commonly sums the contributions from matched terms. For document 1 and query *red bird*, the stated formula gives $0.693147+0.356675=1.049822$. This arithmetic is meaningful only under the stated term statistics and query construction. Query boosts, field normalization, and implementation choices can change a real engine's result.

:::note Statistics can vary across shards
A distributed search may score using local shard statistics. Uneven distributions can then affect comparable-looking scores. A statistics-gathering search mode can collect broader statistics at extra coordination cost. Measure the ranking effect for your corpus before assuming every multi-shard query requires that additional pass.
:::

## 16. Relevance needs evaluation

Suppose the search returns five reports and a human judges three useful. Four useful reports exist in the collection for that question. **Precision** is useful returned results divided by all returned results, here $3/5=0.6$. **Recall** is useful returned results divided by all useful results, here $3/4=0.75$.

Changing an analyzer can increase recall by finding variants, but may reduce precision by merging unrelated meanings. A ranking change can move useful reports upward without changing membership. Keep a judged query set with difficult names, common words, spelling errors, and private content. A click log is informative but biased by what users were shown and where it appeared.

@fig sd_search_evaluation | Computed illustrative retrieval metrics. Relevance judgments are declared labels, not inferred truth.

**NDCG**, normalized discounted cumulative gain, evaluates graded usefulness with more credit for earlier ranks and normalization against an ideal ordering. State the gain convention before calculating it. The study script records rank discounts, but we do not manufacture a quality score without a judged result ordering.

:::warn Watch out
A query latency improvement that silently drops a shard or weakens matching is not the same service. Track missing shards, empty results, freshness, and judged relevance beside latency. A faster wrong answer can make the dashboard look healthy.
:::

:::interview Interview lens
**"Explain BM25 without reciting its formula."** It rewards a document for containing query terms, rewards rare terms more, and limits how much repeated occurrences help. It also adjusts for a document having more opportunities to match because it is long. I would test those assumptions on a judged query set. The numerical score is a ranking value, not a probability of correctness.
:::

:::key In one breath
Document frequency measures term commonness across the corpus. TF-IDF combines corpus rarity with within-document occurrence, while BM25 adds saturation and length adjustment. The exact formula and statistics must be stated before comparing scores. Precision, recall, and judged ranking tests tell us whether the representation and score serve actual queries.
:::

@part VIII | Full-text search | We build up the ideas behind every search engine, from how text becomes terms to how documents are ranked. These fundamentals explain both how Elasticsearch works and why its results sometimes surprise. We will cover analysis with tokenization, normalization, stop words and stemming, inverted indexes with posting lists and positions, and scoring with TF-IDF and BM25. | where:8

## 24. Analysis: from text to terms

A search engine does not search text. It searches **terms**, the normalized units that text is broken into, and the process that produces them is called **analysis**. The same analysis must run on documents when they are indexed and on queries when they are searched, or a query term and a document term that a human would call the same will not match.

An **analyzer** is a pipeline. A **tokenizer** splits text into tokens, usually at spaces and punctuation, so "Crème Brûlée & the Spiciest Biryanis!" becomes Crème, Brûlée, the, Spiciest, Biryanis. **Token filters** then transform the tokens. **Lowercasing** makes "Biryani" and "biryani" the same. **ASCII folding** removes accents, so "crème" matches "creme", which matters because users rarely type accents. **Stop word** removal drops very common words such as "the", "and" and "with", which appear everywhere and help little in matching, though modern engines often keep them so phrase searches like "the hungry cat" still work.

@fig be_srch_analyzer | Tokenize, lowercase, fold accents, drop stop words, stem. The same pipeline runs on queries.

**Stemming** reduces words to a common root, so "biryanis", "spiciest" and "spiced" become "biryani", "spici" and "spice". The Porter stemmer, published by Martin Porter in 1980, applies suffix-stripping rules and is still widely used, along with its successor Snowball. Stems need not be real words, since they only have to match each other. **Lemmatization** uses a dictionary to find the true base form, "ran" to "run", more accurate and slower. Stemming improves recall, finding more relevant documents, and can hurt precision, as when "university" and "universe" stem alike.

Beyond these, analyzers can add **synonyms**, so "biriyani", "briyani" and "biryani" match, which for Wren's food names was the single biggest improvement. **N-gram** filters split words into fragments for partial and autocomplete matching. Language-specific analyzers handle compound words, such as German's, and scripts without spaces, such as Chinese and Japanese, which need dictionary-based segmentation. Wren's menus are in English, Hindi and other Indian languages, so each language field gets its own analyzer.

The art of analysis is that every choice trades recall against precision, and the right choices depend on the domain. Food names have many spellings, few stop words matter, and stemming plurals is helpful while stemming "spicy" to the same stem as "spice" is acceptable. A legal search engine would make different choices.

## 25. Inverted indexes and posting lists

The data structure behind full-text search is the **inverted index**. A normal, forward index maps documents to their words. An inverted index maps each term to the list of documents that contain it, its **posting list**. For Wren's menu, the term "biryani" maps to documents 17, 203 and 911, "chicken" to 17, 88, 203 and 640, and so on for every term in the vocabulary.

@fig be_srch_inverted | Each term points to the documents and positions where it appears.

A query for "chicken biryani" looks up both posting lists and intersects them, giving documents 17 and 203. Because posting lists are sorted by document id, intersection is a merge that walks both lists once, and engines speed it further with **skip lists** inside posting lists, jumping ahead over long runs, so intersecting a rare term's short list with a common term's long one touches only a few entries of the long one. A query for "chicken OR biryani" takes the union instead.

Posting lists store more than ids. A term frequency per document records how often the term appears there, which ranking needs. **Positions** record where in the document each occurrence is, enabling **phrase queries**. A search for the exact phrase "chicken biryani" needs documents where "biryani" appears at the position right after "chicken". Document 17, "chicken biryani with spiced raita", matches, with chicken at position 1 and biryani at 2. Document 203, "biryani and kebabs for the chicken lover", contains both words, and fails the phrase check because biryani comes first and far away. Proximity queries generalize this, allowing terms within a few positions of each other.

@fig be_srch_phrase | Both documents contain both words. Only one has them side by side, in order.

Inverted indexes compress very well, because posting lists are sorted lists of increasing numbers. Storing the gaps between consecutive ids instead of the ids themselves gives small numbers, which compress to a byte or less each with variable-length or block encodings. A search index for millions of documents fits mostly in memory, which is why search engines can answer complex queries in milliseconds.

The index has one more piece, **document frequency**, the number of documents containing each term, which is just the length of its posting list. Ranking uses it to tell rare, informative terms from common ones.

## 26. Scoring: TF-IDF and BM25

Matching decides which documents are results. **Scoring** decides their order, and the order is what users notice. The classic intuition has two parts. A document that mentions a query term more often is more likely about it, **term frequency**. And a term that appears in few documents is more informative than one that appears in many, **inverse document frequency**, an idea Karen Spärck Jones published in 1972. "Biryani" in a menu of 100,000 items is a strong signal, and "chicken", which appears in 9,000, is weaker. **TF-IDF** multiplies the two for each query term and sums.

**BM25**, from Stephen Robertson and colleagues' Okapi system, presented in 1994, refines both parts and is the default ranking in Lucene, Elasticsearch and OpenSearch. Its IDF for a term with document frequency df among N documents is ln(1 + (N − df + 0.5) ÷ (df + 0.5)). Its term frequency part saturates and normalizes for length.

$$\text{score} = \sum_{t} \text{IDF}(t) \cdot \frac{tf \cdot (k_1 + 1)}{tf + k_1 \left(1 - b + b \cdot \frac{|d|}{avgdl}\right)}$$

Read it as "for each query term, how rare it is, times how often it appears in this document, with diminishing returns, adjusted so long documents do not win just by being long". The parameter k1, usually 1.2, controls saturation, and b, usually 0.75, controls length normalization.

@fig be_srch_bm25 | The score for "chicken biryani" on one menu item, step by step.

Work it for document 17. With N = 100,000, df(biryani) = 400 and df(chicken) = 9,000, the IDFs are ln(1 + 99,600.5 ÷ 400.5) ≈ 5.52 for biryani and ln(1 + 91,000.5 ÷ 9,000.5) ≈ 2.41 for chicken. The document is 12 terms long against an average of 20, has biryani twice and chicken once. The length factor is 1 − 0.75 + 0.75 × 12 ÷ 20 = 0.7, so the biryani term part is 2 × 2.2 ÷ (2 + 1.2 × 0.7) ≈ 1.55 and chicken's is 1 × 2.2 ÷ (1 + 0.84) ≈ 1.20. The score is 5.52 × 1.55 + 2.41 × 1.20 ≈ 11.43. A 30-term item mentioning biryani once, and not chicken, scores about 4.58.

The saturation is BM25's key difference from plain TF-IDF. As term frequency grows, BM25's term part approaches k1 + 1 = 2.2 and stops growing, so a restaurant that writes "biryani" twenty times in a description gains little over one that writes it twice. Linear term frequency would reward that keyword stuffing without limit.

@fig be_srch_saturation | TF-IDF's weight keeps growing with repetition. BM25's flattens towards 2.2.

Real relevance combines BM25 with other signals. Wren boosts matches in names over descriptions, restaurants that are open and nearby, dishes with high ratings and items the user has ordered before. Those **function scores** and boosts are where search relevance is tuned, and changes are evaluated against a set of real queries with judged results, measuring metrics such as precision at 10 and NDCG, before shipping.

:::story Picture this
A librarian with a card for every word, listing which books contain it. Asked for "chicken biryani", they pull two cards and compare the lists. They trust "biryani" more than "chicken", because far fewer books mention it, and they are not impressed by a book that repeats "biryani" on every page, since after a few mentions the point has been made.
:::

:::note Why analysis must match
If documents are stemmed and queries are not, a query for "biryanis" looks for a term that was never indexed. If the index folds accents and the query keeps them, "crème" finds nothing. Engines apply the field's analyzer to queries automatically, and custom query code must do the same, which is a common source of "search is broken" bugs.
:::

:::warn Watch out
Changing an analyzer changes the terms in the index, so existing documents indexed with the old analyzer no longer match queries analyzed with the new one. Analyzer changes require reindexing everything, Part IX, and are tested against judged queries before going live.
:::

:::interview Interview lens
**"How does full-text search work, and how are results ranked?"** Text is analyzed into terms by tokenizing, lowercasing, folding accents, optionally removing stop words and stemming, and the same analysis runs on queries. An inverted index maps each term to a sorted posting list of documents with term frequencies and positions, so queries intersect or union lists and phrases check positions. Ranking uses BM25, which sums for each query term its inverse document frequency times a saturating, length-normalized term frequency, with k1 about 1.2 and b about 0.75, then combines it with business signals such as field boosts, popularity and distance.
:::

:::key In one breath
Analyzers turn text into terms by tokenizing, lowercasing, folding accents, removing stop words and stemming, with synonyms for spelling variants, and the same analysis runs on queries. An inverted index maps each term to a sorted, compressed posting list of documents with frequencies and positions, so "chicken biryani" intersects two lists and phrase queries check adjacent positions. BM25 sums IDF × saturating, length-normalized term frequency, giving 5.52 × 1.55 + 2.41 × 1.20 ≈ 11.43 for the worked item, and repetition approaches a cap of k1 + 1 instead of growing without bound.
:::

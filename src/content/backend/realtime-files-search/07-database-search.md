@part VII | Searching the database | We start search where most products start, with the database they already have. PostgreSQL can answer more search queries than people expect, if you know which ones its indexes can and cannot help. We will cover LIKE, prefix and trigram search, and PostgreSQL's built-in full-text search. | where:7

## 22. LIKE, prefix search and trigrams

Wren's first menu search was `SELECT * FROM menu_items WHERE name ILIKE '%biryani%'`. It worked in development with 200 rows. In production, with 100,000 menu items, every search read every row, because no ordinary index can help with a pattern that starts with a wildcard. A B-tree index on `name` orders values from the first character, so it can find names starting with "bir" quickly, but a name containing "biryani" somewhere in the middle could be anywhere in that order. PostgreSQL falls back to a sequential scan, comparing the pattern against all 100,000 names, which is fast enough at that size and becomes slow at millions of rows or with many concurrent searches.

@fig be_srch_like | A leading wildcard scans everything. A prefix uses a B-tree range. A trigram index handles both, and typos.

**Prefix search**, `WHERE name LIKE 'bir%'`, can use a B-tree, because all matching names sit together in the index's order. With a non-C collation, PostgreSQL needs the index built with `text_pattern_ops` for LIKE to use it. Prefix search suits autocomplete on short fields, such as restaurant names as the user types, and nothing else.

**Trigram indexes**, from the `pg_trgm` extension, handle the general case. A trigram is a sequence of three consecutive characters. "biryani" contains the trigrams `bir`, `iry`, `rya`, `yan` and `ani`, plus padded ones at the edges. A GIN or GiST index over trigrams maps each trigram to the rows containing it, so `ILIKE '%biryani%'` becomes "rows containing all of these trigrams", checked against the index, then confirmed against the actual text. Trigrams also give **similarity**, the fraction of trigrams two strings share, so `WHERE name % 'biriyani'` finds "biryani" despite the misspelling, a big win for food names that people spell a dozen ways.

These techniques have clear limits. They match characters, not words or meanings. A search for "biryanis" with trigrams finds "biryani" by similarity, but a search for "rice dish" finds nothing about biryani at all. They do not rank results by relevance, beyond a similarity score. Searching across several fields, the name, the description and the restaurant, needs either several indexes or a combined field. And trigram indexes are large, often several times the size of the text they index.

For Wren's "find a restaurant by name" box, trigrams were exactly right. For "find dishes that match what I mean", something word-aware was needed, starting with PostgreSQL's own full-text search.

## 23. Full-text search in PostgreSQL

PostgreSQL has had built-in full-text search since version 8.3 in 2008. It converts text into a **tsvector**, a sorted list of normalized words, called lexemes, with their positions. `to_tsvector('english', 'Chicken Biryani with spiced basmati rice')` produces `'basmati':5 'biryani':2 'chicken':1 'rice':6 'spice':4`. The text was split into words, lowercased, the stop word "with" was removed, and "spiced" was stemmed to "spice", using a dictionary for English, Part VIII. Positions are kept, so phrase queries are possible.

Queries are **tsqueries**, built the same way. `websearch_to_tsquery('english', 'chicken biryani')` produces `'chicken' & 'biryani'`, and supports quoted phrases and minus signs like a web search box. The match operator `@@` tests a document against a query. Ranking functions, `ts_rank` and `ts_rank_cd`, score matches by how often and how close together the terms appear, and `ts_headline` produces snippets with matched words highlighted.

@fig be_srch_pg_fts | A tsvector of stemmed words with positions, a query, a match and a rank.

Wren stores a generated column, `search tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED`, which weights names above descriptions, and indexes it with GIN. A GIN index is an inverted index, Part VIII, mapping each lexeme to the rows that contain it, so a query touches only the rows that match its terms.

The great advantage is that search lives in the same database as the data. Results are transactionally consistent, a newly added dish is searchable the moment its transaction commits, there is no second system to run, monitor and keep in sync, and search can be combined with ordinary SQL filters, joins and permissions in one query, such as dishes matching "biryani" from restaurants that are open now within 5 km.

The limits show at larger scale and higher expectations. Ranking is simpler than the BM25 of Part VIII and harder to tune. Language support covers stemming but not much beyond it, such as synonyms or typo tolerance, without extensions. Search load competes with transactional load on the same primary. And features such as faceting, "how many results per cuisine", autocomplete with fuzziness and relevance tuning take real effort. For many products, PostgreSQL's search is enough for years. Wren moved menu search to a dedicated engine, Part IX, when it needed typo tolerance, multilingual menus and relevance tuning at its traffic, and kept PostgreSQL search for internal admin tools.

:::story Picture this
A library card catalogue sorted by title. Finding books whose titles start with "Bir" is a quick flip to the right drawer. Finding every book with "biryani" anywhere in the title means reading every card. A second catalogue, indexed by every word in every title, answers that instantly, and it is the first step towards what search engines do.
:::

:::note Trigram index size
A trigram GIN index stores an entry for every distinct trigram in every row, and for long text it can be larger than the table. It suits short fields such as names, titles and codes. For long descriptions, word-level full-text indexes are much smaller and more useful.
:::

:::warn Watch out
Building full-text search by concatenating user input into `to_tsquery` breaks on punctuation and operators and can raise syntax errors. Use `websearch_to_tsquery` or `plainto_tsquery`, which accept arbitrary user text, and pass the input as a parameter, Unit VI.
:::

:::interview Interview lens
**"How would you implement search over product names in PostgreSQL?"** A leading-wildcard LIKE scans every row, so for autocomplete on prefixes I would use a B-tree with text_pattern_ops, and for substring and typo-tolerant matching on short fields a pg_trgm GIN index with similarity. For word-based search over names and descriptions, a weighted tsvector generated column with a GIN index, queried with websearch_to_tsquery and ranked with ts_rank. That keeps results consistent with the data and combinable with SQL filters, and I would move to a dedicated engine when relevance tuning, typo tolerance or load demanded it.
:::

:::key In one breath
`ILIKE '%biryani%'` scans all 100,000 rows because B-trees cannot use a leading wildcard, prefix searches can use a B-tree with text_pattern_ops, and pg_trgm GIN indexes match substrings and misspellings by shared trigrams such as bir, iry and rya, best on short fields. PostgreSQL full-text search turns text into tsvectors of stemmed lexemes with positions, queries them with websearch_to_tsquery, ranks with ts_rank and indexes with GIN. It is transactionally consistent and combinable with SQL, and engines take over when ranking, typo tolerance, languages or load outgrow it.
:::

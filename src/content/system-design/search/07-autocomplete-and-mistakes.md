@part VII | Autocomplete and fuzzy search | We respond while the user is still typing. Prefixes and spelling corrections broaden matching and can multiply work. We will build trie intuition, indexed prefixes, edit distance, and ranked suggestions with explicit bounds. | where:7

## 25. Prefix search starts at the beginning

The user has typed *bir* and wants *bird*. A **prefix query** matches terms beginning with the supplied characters. It differs from a substring query, which may match characters inside a term. An ordered term dictionary can seek to `bir` and enumerate terms until that prefix no longer matches.

A **trie** stores character paths so terms with a common prefix share their initial path. For *bird*, the path is `b`, then `i`, then `r`, then `d`. A terminal marker distinguishes a complete term from a path that is only a prefix. Walking *bir* reaches the subtree whose descendants supply possible completions.

@fig sd_search_trie | Illustrative single-word trie path. The search for bir reaches the node before the terminal d.

The lookup cost includes walking query characters and enumerating or ranking descendants. A popular one-character prefix can have a huge candidate set, so saying tries make autocomplete constant time hides the output problem. Bound suggestions, require a useful prefix length where appropriate, and store ranking summaries if the workload needs them.

:::story Picture this
A street directory sorted by name lets a clerk open at *Bir* and read nearby entries beginning with those letters. It does not help find *bird* in the middle of *songbird*. That requires another representation. The starting position is part of the question.
:::

## 26. Indexed prefixes trade space for query work

Instead of walking all candidate dictionary terms, the index can store selected leading fragments of each token. An **edge n-gram** is a token fragment taken from the beginning or end, usually the beginning for autocomplete. For *bird*, leading fragments of lengths 1 through 4 are `b`, `bi`, `bir`, and `bird`.

A query for `bir` now looks up a prepared posting list. The cost moves into ingestion and storage because one original token can generate several fragments. The maximum length and minimum length limit that expansion. A multiword query also needs a rule about whether only the final incomplete word is a prefix while earlier words must match normally.

@fig sd_search_prefixes | Computed illustrative prefixes for the word bird. Real analyzer settings choose a bounded fragment range.

**Autocomplete** is the user-facing suggestion task; prefix search is one possible matching component. Suggestions may be report titles, team names, or popular complete queries. A completion structure can rank a small set of known suggestions without searching every report body. Decide the thing being suggested before choosing an index.

:::note Suggestion privacy
A private title must not appear because it is popular. Suggestions need tenant and visibility rules just like full results. A shared suggestion cache must include those rules in its key or contain only universally visible data.
:::

## 27. Fuzzy search compares edits

The user types *brd* and expects *bird*. **Edit distance** is the minimum number of permitted edits needed to transform one string into another. With insertion, deletion, and substitution, *brd* needs one insertion of `i`, while *brad* needs two substitutions to become *bird* under the stated convention.

A **fuzzy query** accepts terms whose edit distance from the input is within a limit. Dynamic programming defines the distance by a grid of prefixes. The cell for prefixes ending at characters $i$ and $j$ takes the best of deletion, insertion, and substitution or equality. Each transition builds a longer pair of compared prefixes from shorter ones.

@fig sd_search_fuzzy | Computed Levenshtein distances with insertion, deletion, and substitution. Transposition is not an allowed single edit in this example.

For a negative candidate, the distance grid still establishes that no permitted sequence of edits fits the limit. Optimized engines can stop exploring dictionary branches whose minimum possible cost already exceeds the budget. That pruning depends on the defined edit operations. Changing transposition behavior changes the accepted language and must be reflected in examples and tests.

The straightforward distance algorithm costs the product of the two word lengths. Engines can use automata and dictionary traversal to avoid comparing every word independently. A high edit limit, short query, or large expansion cap still makes a broad request. Restrict the fuzzy scope and expansion budget before it becomes a public resource-exhaustion endpoint.

## 28. Rank suggestions without teaching the wrong lesson

A suggestion list that always displays a famous team can suppress an exact but less popular match. Suggestion ranking often combines lexical fit, popularity, recency, and user context. Those signals answer different questions, so inspect them separately when a result seems wrong.

A small cache of popular public prefix results can remove repeated work. Under an assumed hit rate of 0.8 at 1,000 queries per second, 800 requests hit the cache and 200 reach the engine. That hit rate is illustrative. Short prefixes are popular, but personalization and permission dimensions reduce sharing and make cache keys larger.

@fig sd_search_suggestion_cache | Computed illustrative miss rate under a declared 0.8 hit-rate assumption. The cache key includes visibility context.

Canceling an older browser request prevents stale results from overwriting a newer input, but does not guarantee that the server stops its work. Include request sequence numbers at the client and bound server query time. Debouncing reduces the number of requests, while a minimum input length controls candidate breadth. Neither changes the fundamental matching semantics.

:::warn Watch out
Do not apply fuzzy matching blindly to IDs, payment references, or authorization values. A close-looking value is not the same identity. Use exact equality for identifiers and explicit tolerance only for text discovery.
:::

:::interview Interview lens
**"How would you design autocomplete?"** I would first decide whether the response contains terms, documents, or complete query suggestions. A trie or indexed prefixes can support the matching path, with bounded candidate expansion. I would rank exact lexical fit alongside measured popularity and keep permission filters in both the index and cache. Client request ordering prevents older responses replacing a newer typed query.
:::

:::key In one breath
Prefix queries match term starts, and tries share those character paths. Edge n-grams prepare incomplete-token lookups at an ingestion and storage cost. Fuzzy search broadens matching using a specified edit rule and needs expansion limits. Autocomplete adds ranking, privacy, and request-ordering requirements beyond prefix membership.
:::

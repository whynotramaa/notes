@part II | Tokenization and analysis | We turn a document into the pieces the index can compare. An inconsistent transformation makes relevant documents disappear before ranking begins. We will trace tokenization, normalization, positions, and fields with the same tiny corpus. | where:2

## 5. Tokenization preserves a decision

A report title contains *Red bird scores*. We need to decide whether *Red*, *red*, and punctuation around the word refer to the same indexed term. **Tokenization** splits input text into candidate word-like pieces, often retaining offsets and positions. The result is not a universal linguistic truth. It is a deliberate representation for a family of queries.

Our illustrative tokenizer splits on spaces. The first title becomes `Red`, `bird`, `scores` at positions 1, 2, and 3. A subsequent lowercase transformation gives `red`, `bird`, `scores`. Real tokenizers handle punctuation, scripts, compound words, and languages without spaces. We use the tiny rule because every state fits on the page, not because it is a production recommendation.

@fig sd_search_tokens | Illustrative whitespace tokenizer and lowercase transformation. Positions remain 1, 2, and 3.

An **analyzer** is the ordered pipeline that transforms text into indexed or queried tokens. The order matters. A transformation performed before tokenization can change boundaries, while a token filter changes already selected tokens. Keep analyzer versions with the index so the service can explain which transformation produced a missing result.

:::story Picture this
A clerk copies names onto index cards after applying a spelling convention. A second clerk searching the cards must apply the same convention. If one files *McDonald* under a punctuation-sensitive name and the other searches a rewritten form, the card may be present but unreachable.
:::

## 6. Normalize without destroying meaning

The words *résumé* and *resume* illustrate the tension. Accent folding can make a user without an accent key find the same documents, but it may collapse distinct words in some languages. **Normalization** maps surface forms into a chosen comparison form. Lowercasing, Unicode normalization, and accent folding solve different representation problems.

An implementation applies the transform deterministically at indexing time and, where appropriate, at query time. It may store both an original field and a normalized field. The original remains available for display and exact identity. The normalized field supports forgiving lookup. Treat these as separate purposes rather than overwriting the only copy.

**Stemming** reduces related word forms with rules, while **lemmatization** maps a word to a dictionary form using more linguistic knowledge. A stem need not be a readable word. These techniques can improve recall, but collapsing unrelated forms damages precision. A product search over model identifiers may need exact tokens even when a report body benefits from word normalization.

@fig sd_search_normalize | Illustrative dual representation. The display value is preserved while a separate field supplies searchable terms.

The cost is more indexed data and more schema decisions. Test representative language examples, including names and identifiers, before adopting a transformation. A query that starts returning more matches has not necessarily become more useful.

:::note Stop words can matter
A stop word is a common token omitted by some analyzers. Removing *not* or words from a quoted title can change meaning. Position gaps must still represent the original sequence if phrase behavior depends on distance. Omitting common words is a workload decision, not a rule that all search engines must follow.
:::

## 7. Positions make phrases possible

Both *red bird* and *bird red* contain the same distinct terms. A term-only representation cannot tell them apart. A **position** records where a token occurs in a document's analyzed sequence. A **phrase query** looks for terms whose positions satisfy an order-and-distance rule.

Document 1 stores `red` at position 1 and `bird` at position 2. The exact phrase succeeds because the second position is the first plus 1. Document 4 stores `bird` at positions 1 and 2 but has no `red`, so it fails before position checking. A document saying *red fast bird* would satisfy both terms but fail an exact adjacent phrase.

@fig sd_search_positions | Computed token positions in the illustrative corpus. The final row is the adjacency condition.

A phrase check usually runs only after term membership has narrowed candidates. It then compares the stored positions inside each remaining document. This ordering avoids reading positional details for documents already known to lack a required term. If a token filter creates multiple terms at one position, phrase interpretation also needs that graph relationship rather than a flat list of offsets.

**Phrase slop** permits a bounded departure from the strict phrase position pattern, with exact semantics depending on the engine. Do not invent an implementation-independent count rule for transpositions. Explain the product requirement first, then consult the engine's phrase semantics. Position storage costs bytes per occurrence, so an index serving only term membership can omit data that a phrase index needs.

## 8. Fields stop unrelated terms combining

A report has a title, a body, a sport, and an owner. A query for *red bird* could accidentally combine *red* from the title with *bird* from the owner's name if every field becomes one undifferentiated bag. A **field** is a named document component with its own representation and query rules.

The engine can index the title as analyzed text, sport as an exact category, creation time as an ordered value, and owner as an authorization identifier. A title match may receive more weight than a body match. An exact category filter should not stem or lowercase identifiers unless the schema explicitly defines that equality rule.

@fig sd_search_fields | Illustrative mapping. Each field has a query purpose and an independent representation.

A **mapping** declares field types and analysis behavior. Changing a field's analysis after documents have been indexed does not rewrite their existing terms. Plan a new index and reindex workflow for semantic representation changes. Uncontrolled dynamic fields can also create a growing schema, so validate incoming document structures instead of allowing arbitrary keys to become permanent index fields.

:::warn Watch out
A lowercase query against an exact field containing `Red Bird` may not match. Query analysis and field representation must agree. Inspect the emitted tokens and the field type before changing ranking weights to solve a missing-match problem.
:::

:::interview Interview lens
**"Why can the same query work for one field and fail for another?"** Fields can use different types and analyzers. I would inspect the stored representation and the query's emitted tokens. An exact-value lookup and an analyzed full-text lookup have different equality rules. Reindexing may be required when the desired representation changes.
:::

:::key In one breath
An analyzer turns source text into comparison terms through ordered transformations. Keep original text for display and identity. Positions supply phrase order and distance, while fields prevent unrelated components from becoming one ambiguous bag. Query analysis must agree with the representation actually indexed.
:::

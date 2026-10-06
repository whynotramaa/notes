@part X | Vector and hybrid search | We add search by meaning to search by words. Keyword search cannot find "biryani" for a user who typed "spicy rice dish", and embeddings can. We will cover embeddings and similarity, approximate nearest neighbour search with HNSW, and hybrid retrieval with fusion and reranking. | where:10

## 30. Embeddings and similarity

A user types "spicy rice dish" into Wren's search. BM25 looks for those words, finds menu items containing "spicy", "rice" or "dish", and misses a biryani whose description says "fragrant basmati layered with masala chicken". The words differ and the meaning is the same. **Vector search** finds documents by meaning rather than by shared words.

An **embedding model**, a neural network trained on large amounts of text, turns a piece of text into an **embedding**, a vector of numbers, typically a few hundred to a few thousand of them. Wren's model produces 768 numbers per text. The model is trained so that texts with similar meanings get vectors that point in similar directions. "Chicken biryani", "hyderabadi dum biryani" and "spicy rice dish" end up close together, and "margherita pizza" far away. Images, and texts in different languages, can be embedded into the same space with multimodal and multilingual models, so a Hindi query can find an English description.

@fig be_vec_embed | A two-dimensional sketch of a 768-dimensional space. Similar dishes cluster, and the query lands among them.

Closeness is usually measured by **cosine similarity**, the cosine of the angle between two vectors, a·b ÷ (|a| |b|), which is 1 for vectors pointing the same way and near 0 for unrelated ones. If vectors are normalized to length 1, cosine similarity is just the dot product. Search becomes "find the k vectors most similar to the query vector", **k-nearest neighbours**.

The direct way, comparing the query with every vector, is exact and expensive. Wren's 100,000 menu items with 768 dimensions at 4 bytes each take 100,000 × 768 × 4 = 307.2 MB, and each query needs 100,000 × 768 = 76.8 million multiply-adds. That is fine for one query on a modern CPU, a few tens of milliseconds, and too slow for thousands of queries per second, or for millions of items. Embedding is also a cost. Every document is embedded once at indexing time, and every query is embedded at search time, adding a model call, often tens of milliseconds on a GPU or a remote API, to each search.

Embeddings have specific weaknesses too. They blur exact details, so a search for a specific dish code, a brand or a number may return near misses ahead of exact matches. They depend on the model, so changing models means re-embedding everything. And similarity is not relevance, since "not spicy" and "very spicy" can embed close together.

## 31. Approximate nearest neighbours and HNSW

**Approximate nearest neighbour** search, ANN, trades a little accuracy for a lot of speed. It returns most of the true nearest neighbours, measured as **recall**, such as 95% of the true top 10, in a tiny fraction of the time. Several families exist. Inverted file indexes cluster the vectors and search only the nearest clusters. Product quantization compresses vectors into short codes to save memory. Graph indexes, the most popular today, connect each vector to its neighbours and search by walking the graph.

**HNSW**, hierarchical navigable small world graphs, described by Yury Malkov and Dmitry Yashunin in 2016, is the graph index most systems use, including pgvector, Elasticsearch, OpenSearch, Lucene and most vector databases. It builds several layers of graph. The bottom layer contains every vector, each linked to a set number of close neighbours, a parameter usually called M, such as 16. Each higher layer contains a random, exponentially smaller subset of the vectors, like the express lanes of a skip list, Unit VII.

@fig be_vec_hnsw | Long hops across the sparse top layer, then shorter hops in denser layers, ending near the query.

A search enters at the top layer and greedily moves to whichever neighbour is closest to the query, until no neighbour is closer. It then drops to the layer below and continues from there, with more vectors and shorter links, until it reaches the bottom layer, where it explores a candidate list of size **ef_search** to collect the final results. The number of steps grows roughly with the logarithm of the collection size, so a search over millions of vectors visits only a few thousand of them. Raising ef_search improves recall and costs time, which gives a dial between accuracy and latency.

HNSW's costs are memory and building time. The graph's links add to the vectors' own memory, and the whole structure needs to stay in RAM for good performance. Building the graph is slower than inserting into an inverted index, and deletes are awkward, often handled by marking and periodic rebuilds. Quantization, storing vectors as 8-bit integers or binary codes, reduces memory by 4 to 32 times with some loss of recall, often recovered by re-scoring the top candidates with full vectors.

Wren stores its menu embeddings in its search engine's vector field alongside the text fields, so a single query can filter by "open now" and "within 5 km" and rank by similarity. For smaller collections, pgvector inside PostgreSQL gives the same HNSW indexes with SQL filters and transactional consistency, Part VII's advantage again.

## 32. Hybrid retrieval and reranking

Keyword and vector search fail in opposite ways. BM25 finds exact names, codes and rare words reliably and misses paraphrases. Vector search finds meaning and blurs specifics. Asked for "chicken biryani", BM25 ranks the item literally named "chicken biryani" first, and vector search might rank "hyderabadi dum biryani" first and "chicken pulao" second. Asked for "spicy rice dish", BM25 struggles and vector search shines. **Hybrid retrieval** runs both and combines the results, which in practice beats either alone on most query sets.

Combining scores directly is awkward, because BM25 scores and cosine similarities are on different scales that vary by query. **Reciprocal rank fusion**, RRF, from Gordon Cormack and colleagues in 2009, ignores scores and uses ranks. Each document's fused score is the sum, over the result lists it appears in, of 1 ÷ (k + rank), with k usually 60. For "chicken biryani", the item ranked 1st by BM25 and 3rd by vectors gets 1 ÷ 61 + 1 ÷ 63 ≈ 0.0323, which beats any item ranked high in only one list, such as the vector list's 1st, "hyderabadi dum biryani", at 1 ÷ 61 plus nothing from BM25, about 0.0164. Elasticsearch, OpenSearch and most vector databases implement RRF natively.

@fig be_vec_hybrid | Two lists nominate candidates, RRF merges them, and a reranker reads the top 50 with the query.

**Reranking** improves the top of the list further. A **cross-encoder** is a model that takes the query and one candidate document together and outputs a relevance score. Unlike an embedding model, which encodes query and document separately, it can attend to how each word in the query relates to each word in the document, so it is much more accurate and much slower. Running it on all 100,000 items would be impossibly slow. Running it on the top 50 fused candidates takes tens of milliseconds and reorders them well. Retrieval finds plausible candidates cheaply, and reranking orders a few of them expensively.

Business ranking signals come last, the same as Part VIII's boosts, distance, open status, ratings, price and personal history, either as features in a learned ranking model or as adjustments on the reranked list. Wren evaluates every change against judged queries before rollout and runs A/B tests on click-through and order conversion afterwards, since the only relevance that matters is whether people find food they order.

The same retrieval stack, BM25 plus vectors plus reranking, is what powers retrieval-augmented generation, where a language model answers questions using retrieved documents. The backend concerns are the same, indexing pipelines, consistency with the source, latency budgets and evaluation.

:::story Picture this
Two assistants hunting for a recipe. One searches cookbooks for the exact words you said and never misses a dish called by its name. The other understands what you meant and suggests dishes you did not know to ask for, but sometimes confuses two similar ones. You take both of their shortlists, give priority to anything both suggested, and ask a chef to put the final few in order.
:::

:::note Choosing where vectors live
A dedicated vector database, such as Qdrant, Weaviate, Milvus or Pinecone, suits very large collections and vector-first workloads. Vectors inside an existing search engine suit hybrid search with filters. pgvector suits moderate collections that benefit from SQL joins and transactions. The main questions are collection size, filter complexity, update rate and how many systems the team wants to run.
:::

:::warn Watch out
Mixing embeddings from different models, or from different versions of one model, in the same index silently breaks similarity, since vectors from different models live in different spaces. Record the model version with every vector, and re-embed the whole collection into a new index, behind an alias, when the model changes.
:::

:::interview Interview lens
**"How would you add semantic search to an existing keyword search?"** Embed documents with an embedding model at indexing time and store the vectors in an ANN index such as HNSW alongside the text fields, embedding queries at search time. Run BM25 and vector retrieval in parallel, with the same filters, and fuse them with reciprocal rank fusion, then rerank the top 50 or so with a cross-encoder and apply business boosts. Track the model version per vector and reindex behind an alias on model changes, budget latency for query embedding and reranking, and evaluate with judged queries and online tests.
:::

:::key In one breath
Embeddings map texts to vectors, 768 numbers for Wren, so similar meanings sit close by cosine similarity, and brute force over 100,000 items needs 307.2 MB and 76.8 million multiply-adds per query. HNSW builds layered neighbour graphs and searches greedily from sparse top layers to the dense bottom, visiting a few thousand vectors with recall tuned by ef_search, at a cost in memory and build time. Hybrid retrieval fuses BM25 and vector results with RRF, 1 ÷ 61 + 1 ÷ 63 ≈ 0.0323 for an item ranked 1st and 3rd, then a cross-encoder reranks the top 50 before business signals.
:::

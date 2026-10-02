@part XI | The KV Cache: Keep the Keys, Skip the Redo | A model writes its reply one token at a time, and done naively, every new token re-processes the entire text from scratch. Because the causal mask means old tokens never change, their keys and values can be saved and reused. This part shows the waste, builds the cache, explains why queries are not cached, and counts the memory bill that shapes how modern models are designed. | where:11

## 58. Generation Without a Cache

Part I described generation: run the model on the text so far, pick the next token, append it, and run again. Take Finch-19 writing *was* after *The cat sat because it*. To produce the next token, it runs on six tokens. To produce the one after, it runs on seven. Done naively, each run starts from scratch: every token's embedding, every layer, every query, key and value is recomputed, even though five of those six tokens were processed a moment ago.

Count the waste for the key and value computations alone. Generating the first token from a one-token prompt computes 1 key/value pair per layer; the next step computes 2, then 3, and so on. To produce 6 tokens that is $1 + 2 + 3 + 4 + 5 + 6 = 21$ computations, of which only 6 were new. In general, generating $T$ tokens naively costs $T(T+1)/2$, which grows as a square.

@fig no_cache | Generation without a cache. Each row is one step. Orange cells recompute keys and values that were already computed in the previous step; the waste forms a growing triangle.

Is the repeated work really identical each time? Yes, and the reason is the causal mask from Part VIII. Token 2's key and value depend only on tokens 0 to 2. Appending token 6 cannot change anything about tokens 0 to 5, in any layer, because no earlier position is allowed to see later ones. So their keys and values come out bit for bit the same every time we recompute them.

## 59. The Cache: Compute One Row, Append, Look Up the Rest

Save each token's keys and values in every layer when first computed, then reuse them. This saved store is the **KV cache**. At each generation step, only the newest token goes through the model. In each layer, it computes its own query, key and value; appends its key and value to that layer's cache; and then uses its query to score against *all* the cached keys, old and new, and to blend all the cached values.

@fig with_cache | Generation with a cache. The new token computes its own q, k and v, appends k and v to the shelf, and scores its query against every key on the shelf. Nothing old is recomputed.

```python
k_cache = torch.cat([k_cache, k_new], dim=2)    # (B, H, T_old + 1, d_head)
v_cache = torch.cat([v_cache, v_new], dim=2)
att = softmax(q_new @ k_cache.transpose(-2, -1) / 8.0, dim=-1)  # (B, H, 1, T_old + 1)
out = att @ v_cache                             # (B, H, 1, d_head)
```

Now each step computes exactly one new key/value pair per layer. Generating $T$ tokens costs $T$ computations instead of $T(T+1)/2$. For 1,000 tokens, that is 1,000 instead of 500,500, a factor of about 500. The attention step still has to score against every cached key, so each step's attention work grows in a line with the length so far, but that is a line, not a square, and it involves no recomputation.

@fig cache_work | Total key/value computations to generate T tokens. Without a cache the count grows as T(T + 1)/2; with a cache it is a straight line.

This is the single biggest reason chat models answer at a usable speed. Every production inference system uses it.

:::story Picture this
Imagine writing a long letter and, before adding each new word, re-reading the whole letter from the top to remind yourself what it says. By page ten you spend nearly all your time re-reading. A sensible writer keeps notes in the margin as they go, a running summary of each paragraph, and glances at the notes instead of re-reading. The KV cache is the margin notes: written once per token, consulted at every later step.
:::

## 60. Why K and V, but Not Q?

If caching keys and values helps, why not cache queries too? Because nobody ever needs an old query again.

Look at the attention weight grid during generation. The new token's row is the only one we compute: its query against every key. The rows above it belong to old queries. Each old query was used exactly once, at the step when its token was new, to compute that token's output. The causal mask guarantees no later step will ever need that row again, because outputs for old positions never change. Keys and values are different: every *future* query will be scored against every old key and will blend every old value. So keys and values are reused at every step from now on, and queries are not. That is why it is called a KV cache and not a QKV cache.

@fig why_not_q | The weight grid during generation. Only the newest row is computed. Old queries (grey rows) were used once and are never needed again; every key and value column is needed by the newest query.

:::interview Interview lens
**"Why do we cache keys and values but not queries?"** Under causal attention, each position's output depends only on its own query and the keys and values at or before it, and earlier outputs never change. At decode time only the newest token's query is needed, once, while every future query must attend to all past keys and values. So keys and values are reused at every subsequent step and are worth storing; old queries are dead after their step.
:::

## 61. The Cost: Memory

Speed is not free. The cache holds a key and a value for every token, in every layer, for every key/value head. Counting it is pure multiplication:

$$\text{cache bytes} = 2 \times L \times H_{kv} \times d_{\text{head}} \times T \times B \times \text{bytes per number}$$

Read it factor by factor: two tensors (keys and values), for each of $L$ layers, for each of $H_{kv}$ key/value heads, each $d_{\text{head}}$ numbers long, for each of $T$ tokens, for each of $B$ sequences in the batch, times the size of one number (2 bytes in 16-bit precision).

For Finch-19 that is $2 \times 8 \times 8 \times 64 \times 2 = 16{,}384$ bytes per token, so a full 1,024-token context needs 16 MiB per sequence. Small. Now take a Llama 3 8B-sized model: 32 layers, 8 key/value heads of 128. That is $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes, 128 KiB, per token. At 8,192 tokens, 1 GiB per sequence. At a 128,000-token context (Llama 3.1's length), 16 GiB per sequence. Serve a batch of 8 such conversations and the cache alone needs 128 GiB, more than an 80-gigabyte GPU holds, before counting the model's 16 gigabytes of weights.

@fig cache_calc | KV cache sizes on a log scale. A small model's cache is tiny; a Llama 3 8B-sized model at 128k tokens needs 16 GiB per sequence, and a batch of eight overflows one 80 GB GPU. Without grouped-query attention it would be four times larger again.

That number, not the size of the weights, is often what limits how many users a server can handle at once and how long a context it can offer.

### Sharing keys and values shrinks the cache

Look at the formula again: the cache is proportional to $H_{kv}$, the number of key/value heads. With the grouped-query attention previewed in Section 52, many query heads share one key/value head. Llama 3 8B has 32 query heads but only 8 key/value heads, which is why its cache is 128 KiB per token rather than 512 KiB. Going from 32 to 8 key/value heads cuts the cache to a quarter; going to 1 (multi-query attention) cuts it to a thirty-second. That is the main reason nearly every modern model uses GQA, and Unit II covers it in depth.

## 62. Prefill, Then Decode

Generation has two phases.

First, **prefill**. The whole prompt is processed in one forward pass, all tokens in parallel, exactly like a training step without the backward pass. This fills the cache for every prompt token. A GPU loves prefill: each weight it loads from memory is used for every prompt token, so it does a lot of arithmetic per byte moved. Prefill is **compute-bound**: limited by how fast the GPU can multiply.

Then **decode**. One token per step. Each step pushes a single token through every layer, which means reading every weight of the model from memory to use it once, plus reading the whole KV cache for attention. For a 16-gigabyte model on a GPU that reads memory at about 2 terabytes per second, just reading the weights takes about 8 milliseconds per token, no matter how little arithmetic there is. Decode is **memory-bound**: the GPU spends most of its time waiting for data, not doing maths.

@fig prefill_decode | Prefill processes the prompt in one wide, compute-bound pass. Decode adds one token per step and is limited by reading the weights and the cache from memory.

That is why making the cache smaller makes generation *faster*, not just cheaper: every byte of cache is read at every decode step. It is also why servers batch many users' decode steps together. Reading the weights once and using them for 32 users' tokens costs barely more time than using them for one.

### Sharp edges of the KV cache

**Editing an earlier token invalidates everything after it.** The cache assumes the past never changes. If a user edits a word in the middle of a conversation, every cached key and value after that point is wrong. Truncate the cache at the edit and recompute from there.

@fig cache_edit_boundary | Editing position 1 preserves the cache at position 0 and invalidates positions 1 through 6 in every layer. Later words may be unchanged, but their context has changed. Token labels and positions are illustrative.

**The position offset.** A new token's position is the number of tokens already in the cache, not 0. Get this wrong with RoPE (Part V) and the new token is rotated as if it were at the start of the text. Pass the cache length as the position offset.

**Ragged batches waste memory.** Conversations in a batch have different lengths, and allocating every cache for the longest one wastes most of the memory. **Paged attention**, introduced with the vLLM system by Woosuk Kwon and colleagues in 2023, stores the cache in fixed-size blocks, like pages of memory in an operating system, and allocates them only as needed.

**Evicting old entries breaks sinks.** To cap memory on very long chats you can drop old cache entries. But dropping the first few tokens breaks the attention-sink heads of Section 50. Keep the first few tokens plus a recent window.

**Quantized caches.** Storing the cache in 8-bit or 4-bit numbers halves or quarters its memory. The quality loss is usually small but tends to appear first on long-context tasks, so measure there.

**Shared prefixes can share a cache.** Many requests start with the same long system prompt. Its cache can be computed once and reused for every request that starts the same way. This is what "prompt caching" in commercial APIs does.

:::warn Watch out
The KV cache is per layer and per key/value head, not per model. It is easy to compute "2 × tokens × d_model × 2 bytes" and get an answer 32 times too small for a 32-layer model, or to use the number of *query* heads and get an answer 4 times too large for a GQA model. Always multiply by layers, and use $H_{kv}$.
:::

:::key In one breath
Because of the causal mask, past tokens' keys and values never change, so generation stores them in a per-layer KV cache: each step computes only the new token's $q$, $k$, $v$, appends $k$ and $v$, and attends over the cache, turning $T(T+1)/2$ key/value computations into $T$. Old queries are never needed again, so only K and V are cached. The cache costs $2 \times L \times H_{kv} \times d_{\text{head}} \times T \times B \times$ bytes (16,384 bytes per token for Finch-19, 128 KiB per token for a Llama 3 8B-sized model, 16 GiB at 128k), which is why GQA exists; prefill is compute-bound, decode is memory-bound, so a smaller cache directly speeds up generation.
:::

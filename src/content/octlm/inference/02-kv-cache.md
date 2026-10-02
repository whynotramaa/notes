@part II | The KV Cache in Practice | Chapter 1 introduced the KV cache as an idea: keep the keys and values of past tokens, compute only the new token's row. This part makes it concrete for a real model: exact tensor shapes for Qwen3-0.6B, the memory bill and how it scales, one cached decode step traced operation by operation, and the tests that prove a cache is correct. The ideas are short to state and easy to get subtly wrong, so most of the part is about shapes, positions and parity. | where:2

## 5. KV Cache

Chapter 1 built the cache from scratch: [Section 59](/octlm/attention/11-kv-cache/#s59) shows that a new token only needs its own query, key and value, plus the keys and values of everything before it, and [Section 60](/octlm/attention/11-kv-cache/#s60) explains why the keys and values can be stored and the queries cannot. Here is the short version, then the parts Chapter 1 did not cover: the exact layout of a real cache.

### What gets cached, and why

**What gets cached** is the output of the key and value projections, after RoPE has rotated the keys, for every past position, in every layer. **Keys can be reused** because under the causal mask a past position's key depends only on tokens at or before it, and those tokens never change: position 7's key in layer 3 is the same number on step 8 and on step 800. **Values can be reused** for the same reason. **Queries are recomputed**, or rather never stored, because a query is only used once: the newest token's query asks its question against all the keys, and once that step is done no future step ever needs it again. Old queries have no future readers.

### Cache tensor shapes

For a model with $L$ layers and $H_{kv}$ key/value heads of size $d_h$, each layer keeps two tensors:

$$K^{(\ell)},\ V^{(\ell)} \in \mathbb{R}^{B \times H_{kv} \times S \times d_h}$$

Read it as: for each of $B$ sequences in the batch, for each key/value head, one row of $d_h$ numbers per cached position, where $S$ is the number of positions cached so far. For Qwen3-0.6B, each layer's key tensor is $(B, 8, S, 128)$, and so is its value tensor. **Cache per layer**: each layer has its own pair, because each layer has its own $W_K$ and $W_V$ and produces different keys from different hidden states, so there are 28 pairs, 56 tensors in all. **Cache per KV head**: the cache is stored at $H_{kv} = 8$ heads, not the 16 query heads. Query heads 0 and 1 both read key/value head 0, and the sharing happens at attention time, never in the cache ([Chapter 2, Section 19](/octlm/modern-arch/04-gqa/#s19)).

@fig inf_cache_shapes | The cache of Qwen3-0.6B. Each of 28 layers stores a key tensor and a value tensor of shape (B, 8, S, 128); every decode step adds one row of 128 numbers to each of the 8 heads in all 56 tensors.

### Cache growth with sequence length

The cache grows by exactly one position per token. In bf16, one key/value head stores $2 \times 128 \times 2 = 512$ bytes per token per layer (key plus value, 128 numbers each, 2 bytes per number). Eight heads make 4,096 bytes per layer, and 28 layers make 114,688 bytes per token. After the 26-token prompt of Part X, the cache holds $26 \times 114{,}688 = 2{,}981{,}888$ bytes, under 3 MB. After 32,768 tokens it holds 3.5 GiB, about three times the model's own 1.19 GB of weights.

```python
cache_k = torch.empty(B, 8, S_max, 128, dtype=torch.bfloat16)  # one per layer
cache_v = torch.empty_like(cache_k)
cache_k[:, :, pos:pos + n] = k_new        # k_new: (B, 8, n, 128), already rotated
k_all = cache_k[:, :, :pos + n]           # (B, 8, S, 128) view, no copy
```

Real implementations either grow a list with `torch.cat`, which is simple and reallocates every step, or preallocate the full length once and write into it, as above. Serving engines go further and store the cache in fixed-size pages, the idea behind vLLM's PagedAttention (Kwon and colleagues, 2023), so that memory is allocated as sequences grow and nothing is wasted on reserved space a short reply never uses.

## 6. KV Cache Memory

The size formula was derived in [Chapter 1, Section 61](/octlm/attention/11-kv-cache/#s61) and pushed to Llama 3 8B in [Chapter 2, Section 20](/octlm/modern-arch/04-gqa/#s20). Here it is with every factor named, because each one is a lever someone has pulled:

$$\text{cache bytes} = 2 \times L \times H_{kv} \times d_h \times S \times b \times B$$

The factor 2 counts keys and values. $L$ is the **number of layers**, $H_{kv}$ the **number of KV heads**, $d_h$ the **head dimension**, $S$ the **sequence length** cached so far, $b$ the bytes per number set by the **data type** (2 for bf16, 1 for fp8), and $B$ the number of sequences. Every factor enters linearly. **Memory scaling** is therefore simple: double any one of them and the cache doubles.

For the three models in this book, per token per sequence:

| Model | $L$ | $H_{kv}$ | $d_h$ | Bytes per token (bf16) |
|---|---|---|---|---|
| Finch-24 | 8 | 2 | 64 | 4,096 |
| Qwen3-0.6B | 28 | 8 | 128 | 114,688 |
| Llama 3 8B | 32 | 8 | 128 | 131,072 |

Notice that Qwen3-0.6B, a model thirteen times smaller than Llama 3 8B, has almost the same cache per token. Its weights are small but it has 28 layers of eight 128-wide key/value heads, so its per-token memory is nearly a big model's.

### Why long context becomes expensive

Weights are paid once; the cache is paid per token per sequence. For Qwen3-0.6B, the cache equals the size of the weights, 1.19 GB, after about 10,394 tokens. Beyond that, the context costs more memory than the model. At the 40,960 positions its config allows, one sequence's cache is 4.375 GiB. For Llama 3 8B, the cache is 1 GiB at 8k tokens, 4 GiB at 32k and 16 GiB at 128k, per sequence. On an 80 GB GPU, the weights fit easily and the caches decide how many users you can serve (Section 15).

@fig inf_cache_growth | Qwen3-0.6B's KV cache for one sequence as the context grows, against its 1.19 GB of weights. The lines cross near 10,400 tokens; at the config's 40,960 positions the cache is almost four times the model.

### GQA and KV-cache savings

The $H_{kv}$ factor is where grouped-query attention pays off. Chapter 2 explained the mechanism and the spectrum of sharing ([Section 18](/octlm/modern-arch/04-gqa/#s18)); here is what it means for Qwen3-0.6B at 32,768 tokens, holding everything else fixed.

| | MHA | GQA (Qwen3) | MQA |
|---|---|---|---|
| Key/value heads | 16 | 8 | 1 |
| Bytes per token | 229,376 | 114,688 | 14,336 |
| Cache at 32,768 tokens | 7 GiB | 3.5 GiB | 0.4375 GiB |
| Decode bytes read per step at 32k (weights + cache) | 8.71 GB | 4.95 GB | 1.66 GB |

During inference, the difference between **MHA, MQA and GQA** is mostly this table. All three compute the same number of query heads, so the arithmetic is nearly identical; what changes is how many bytes the cache holds and how many bytes each decode step must read. Because decode is memory-bound (Section 3), the last row is roughly the ratio of decode step times at long context. Qwen3 chose 8 key/value heads for 16 query heads, a group of 2, which is a mild amount of sharing: Llama 3 8B shares four ways.

### Shrinking the cache further

The data type is the other easy lever. Storing keys and values in fp8 instead of bf16 halves the cache to 57,344 bytes per token for Qwen3-0.6B; vLLM and TensorRT-LLM both support it. Part IV explains what such a cast costs in accuracy. Beyond that, models change the architecture itself: DeepSeek-V2 (2024) compresses keys and values into a small shared latent vector, and some models use sliding-window attention in some layers so those layers cache only the last few thousand positions.

@fig inf_cache_levers | The cache formula as a row of levers. Orange factors are the ones real systems shrink; the bottom line prices each choice for Qwen3-0.6B.

:::interview Interview lens
**"How much memory does the KV cache need, and what can you do about it?"** It is $2 \times L \times H_{kv} \times d_h \times S \times b$ bytes per sequence: keys and values, for every layer and key/value head, for every cached position, at $b$ bytes per number. For Llama 3 8B in bf16 that is 128 KiB per token, 16 GiB for one 128k-token sequence. Each factor is a lever: GQA or MQA reduce $H_{kv}$, fp8 caches halve $b$, sliding windows cap $S$ in some layers, latent compression like DeepSeek's MLA shrinks the per-token size, and paged allocation stops you from wasting memory on positions you have reserved but not used.
:::

## 7. Cached Attention Step by Step

Here is one decode step inside one attention layer of Qwen3-0.6B, at the moment it generates token 27 of the Part X conversation. The prompt was 26 tokens, so the cache holds positions 0 to 25 and the new token sits at position 26. Batch size is 1. Follow the shapes.

1. **New token embedding.** The new token ID is looked up in the embedding table and has gone through the earlier layers; this layer receives its hidden state $x$, shape $(1, 1, 1{,}024)$, and normalizes it with RMSNorm.
2. **New Q.** $q = x W_Q$ gives $(1, 1, 2{,}048)$, reshaped to $(1, 16, 1, 128)$: one 128-wide query per head. Qwen3 normalizes each head's query with its own small RMSNorm (Section 28), then RoPE rotates it by position 26.
3. **New K/V.** $k = x W_K$ and $v = x W_V$ each give $(1, 1, 1{,}024)$, reshaped to $(1, 8, 1, 128)$. The key is normalized and rotated by position 26; the value is not.
4. **Append K/V to cache.** The cache tensors go from $(1, 8, 26, 128)$ to $(1, 8, 27, 128)$. The new row is written before attention, so the token can attend to itself.
5. **Query against all cached keys.** Each query head is matched with its key/value head (heads 0 and 1 with head 0, and so on) and scores are $q K^\top / \sqrt{128}$: shape $(1, 16, 1, 27)$, one row of 27 scores per head.
6. **Weighted sum over cached values.** Softmax turns each row into 27 weights that sum to 1, and the weighted sum of the 27 value rows gives $(1, 16, 1, 128)$.
7. **Produce next hidden state.** The heads are concatenated back to $(1, 1, 2{,}048)$, $W_O$ projects to $(1, 1, 1{,}024)$, and the result is added to the residual stream. The MLP half of the block follows, then the next layer.
8. **Repeat.** After the last layer, the final norm and LM head produce one row of 151,936 logits; sampling picks token 28, and the step runs again at position 27 with a cache of 27 rows.

@fig inf_cached_step | One cached decode step inside one Qwen3-0.6B layer at position 26, with every shape. Only the new token's row is computed; the 26 earlier rows of K and V are read from the cache.

### With real numbers

Shrink it to one head of size 2 so it fits on a page. The cache holds three keys $[1, 0]$, $[0, 1]$, $[1, 1]$ and three values $[1, 2]$, $[3, 0]$, $[0, 4]$. The new token arrives with $q = [2, 1]$, $k = [1, -1]$ and $v = [2, 2]$. Appending gives four keys and four values. The raw scores of $q$ against the four keys are $2, 1, 3, 1$; divided by $\sqrt{2}$ they are $1.4142, 0.7071, 2.1213, 0.7071$. Softmax gives weights $0.2491, 0.1228, 0.5052, 0.1228$, so the output is $0.2491 \cdot [1, 2] + 0.1228 \cdot [3, 0] + 0.5052 \cdot [0, 4] + 0.1228 \cdot [2, 2] = [0.8633, 2.7648]$.

@fig inf_toy_attention | The worked example of this section. Three keys and values come from the cache, the fourth was appended this step; the weights come from the scaled scores, and the output is their weighted sum of values.

Two things are worth seeing in that arithmetic. The new token's own key and value took part (the fourth weight), which is why the append comes before attention. And nothing about the first three positions was recomputed: their keys and values were read, and that is all.

:::story Picture this
A meeting has a shared notes document. Each person who arrives reads everything already written, writes one new line of their own, and adds it to the bottom. Nobody rewrites the earlier lines, because they cannot have changed; the people who wrote them were not influenced by anything that came later. The notes document is the cache. Reading it is attention. Writing one line is the append. A latecomer's question (the query) is asked once, answered from the notes, and not written down.
:::

@fig inf_notes_scene | The shared notes of the analogy. A newcomer reads every line, adds exactly one, and never rewrites what is there.

## 8. Cache Correctness

A cached implementation produces the same text as a naive one most of the time even when it is wrong, because a wrong cache often degrades the model rather than breaking it. So correctness is not "the output looks fine". It is a pair of tests against the naive loop from Section 4.

### Cached vs uncached generation

Run the same prompt through two loops: the naive loop, which reprocesses the full sequence each step, and the cached loop. Use greedy decoding (always pick the highest logit) so there is no randomness. **Token parity** means the two loops produce the identical sequence of token IDs for, say, 50 or 100 steps. **Logit parity** is stricter: at every step, compare the two rows of logits and require the largest absolute difference to be below a tolerance.

Logit parity will usually not be exact equality. The cached path multiplies a $(1, d)$ row by the weights; the naive path multiplies a $(T, d)$ block. GPU kernels choose different tilings and summation orders for different shapes, and floating-point addition is not associative, so the last bits differ. In fp32 the difference is typically around $10^{-5}$ or smaller; in bf16 it can reach a few hundredths on logits of size 10 or so. Section 40 explains how to pick the tolerance. If the difference is 0.5 or 3, there is a bug.

@fig inf_parity_loops | The cache parity test. The naive and cached loops consume the same prompt, their logits are compared at every step, and the same argmax token is fed back into both.

```python
ids_a, ids_b = prompt.clone(), prompt.clone()
cache = model.new_cache()
logits_b = model(ids_b, cache=cache, pos=0)[:, -1]            # prefill
for step in range(50):
    logits_a = model(ids_a, cache=None, pos=0)[:, -1]          # naive, full sequence
    assert (logits_a - logits_b).abs().max() < tol, step
    nxt = logits_a.argmax(-1, keepdim=True)
    ids_a = torch.cat([ids_a, nxt], 1)
    logits_b = model(nxt, cache=cache, pos=ids_a.shape[1] - 1)[:, -1]
```

### Position handling with cache

With a cache, the model no longer sees where the new token sits; you have to tell it. The new token's position is the number of tokens already cached, here 26, and that position drives RoPE. Chapter 2 drew the classic bug, every new token rotated as if it were at position 0, in [Section 5](/octlm/modern-arch/01-rope/#s5). The cached keys were rotated by their own positions when they were written, so they must never be rotated again.

### Common cache bugs

Most cache bugs fall into a short list, and the parity test catches all of them.

| Bug | Symptom | Fix |
|---|---|---|
| New tokens get position 0 | fine for a few tokens, then drifts and repeats | position = cache length before the append |
| Keys cached before RoPE, rotated again on read | parity fails from the first decode step | cache keys after rotation, never rotate cached keys |
| Cache not reset between requests | the second request "remembers" the first | new cache per sequence, or reset its length |
| Expanded GQA heads stored in the cache | correct output, memory doubles or worse | store $H_{kv}$ heads, expand at attention |
| Causal mask applied in decode with the wrong alignment | new token cannot see the prompt | no mask for one query row, or bottom-right alignment |
| Cache kept in fp32 while the model runs bf16, or the reverse | small parity gaps, dtype errors in fused kernels | cache in the model's compute dtype |

### Off-by-one errors

The most common cache bug of all is an off-by-one, and it hides in three places. The **position** of the new token is the cache length *before* appending it: a prompt of 26 tokens occupies positions 0 to 25, so the first generated token is at 26, not 27. The **append** must happen *before* the attention read, or the token cannot attend to itself and every output is slightly wrong. And the **slice** of the cache that attention reads must include the new row, `[:pos + 1]`, not `[:pos]`. Each of these produces correct shapes and plausible text, and each fails logit parity immediately.

:::warn Watch out
A cache bug often passes token parity for short tests. Three wrong positions out of 100 may never change the argmax on a 20-token prompt. Always test logit parity, test at least one prompt longer than a few hundred tokens, and test generation that continues past the prompt by more than a handful of steps, because position bugs grow with distance.
:::

## 9. Attention During Inference

The attention formula is the same in both phases, softmax of $QK^\top / \sqrt{d_h}$ times $V$ ([Chapter 1, Part VII](/octlm/attention/07-scaled-dot-product/#s38)). What differs is the shape of $Q$ against the shape of $K$, and that difference decides which mask is needed and which kernel is fast.

**Prefill attention shape.** All $T$ prompt positions are queries and all $T$ are keys: scores are $(B, H, T, T)$. For a 26-token prompt that is a 26 by 26 grid per head.

**Causal masking during prefill.** The grid's upper triangle must be blocked, so position 5 cannot read position 9, exactly as in training ([Chapter 1, Section 45](/octlm/attention/08-causal-mask/#s45)). With SDPA this is `is_causal=True`.

**Decode attention shape.** One query against $S$ keys: scores are $(B, H, 1, S)$, a single row per head. At position 26 that row has 27 entries.

**Why decode only has one new query row.** Only the new token needs a new output; every earlier position's output was produced on an earlier step and is never revisited. And that one row needs no mask at all, because every key in the cache belongs to a position at or before the query. Passing `is_causal=True` here is a real bug in PyTorch: its causal mask is aligned to the top-left corner, so a $1 \times 27$ "causal" mask lets the query see only the first key ([Chapter 2, Section 25](/octlm/modern-arch/05-sdpa/#s25)). Use `is_causal=False` for single-token decode, or a bottom-right-aligned mask when several new tokens arrive at once (chunked prefill, speculative decoding).

@fig inf_attn_shapes | Attention scores in the two phases. Prefill is a square with its future masked; decode is a single row over the whole cache, and needs no mask.

**Context length growth.** The decode row gets one entry longer every step. Its cost, $2 \times H \times d_h \times S$ multiply-adds per layer for scores and as many again for the weighted sum, grows linearly with the context, and the bytes of cache it reads grow the same way. At short context, a decode step is dominated by the weights; at long context, by the cache (Chapter 2's [decode-reads figure](/octlm/modern-arch/04-gqa/#s20) draws the crossover).

:::key In one breath
The KV cache stores, for every layer, a key tensor and a value tensor of shape $(B, H_{kv}, S, d_h)$, $(B, 8, S, 128)$ in each of Qwen3-0.6B's 28 layers, holding RoPE-rotated keys and plain values; queries are never cached because nothing reads them twice. It costs $2 L H_{kv} d_h S b$ bytes, 114,688 bytes per token for Qwen3-0.6B, which passes the model's own 1.19 GB at about 10,400 tokens, and GQA, fp8 caches, windows and paging are the levers that shrink it. A cached decode step computes one new $q$, $k$, $v$, appends $k$ and $v$ at position equal to the old cache length, then scores one query row of shape $(B, H, 1, S)$ against the whole cache with no mask. Correctness means token and logit parity with the naive loop, and the bugs to hunt are wrong positions, double rotation, missing resets, stored GQA expansions, misaligned masks and off-by-ones in position, append order and slicing.
:::

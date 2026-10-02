@part IV | Grouped-Query Attention | In Chapter 1 every query head had its own keys and values, and all of them had to be kept in the KV cache and read back for every generated token. That reading, not the arithmetic, is what makes generation slow. Grouped-query attention lets several query heads share one set of keys and values: Finch-24 has 8 query heads and 2 key/value heads, Llama 3 8B has 32 and 8. This part shows the spectrum of sharing, how the shapes are made to line up (and the silent bug that breaks them), what it saves, and how to convert an existing model. | where:4

## 17. Decoding Is a Memory-Reading Contest

Chapter 1, Section 62, drew the line between prefill and decode. Prefill processes the whole prompt at once and is limited by arithmetic. Decode generates one token per step and is limited by memory: every step must read every weight of the model, plus the entire KV cache, from the GPU's main memory, to do a small amount of arithmetic for a single token.

Count it for a Llama 3 8B-sized model with full multi-head attention, 32 key/value heads of 128 in each of 32 layers. The weights are about 16.1 gigabytes in 16-bit. The cache costs $2 \times 32 \times 32 \times 128 \times 2 = 524{,}288$ bytes per token, half a mebibyte. At a context of 32,768 tokens that is 16 GiB of cache, as large as the model itself, and every decode step has to read all of it. At 128k tokens it is 64 GiB, four times the model.

So during long-context generation, most of the time per token is spent reading keys and values. Shrinking the cache makes generation *faster*, not just cheaper in memory. The cache size is proportional to the number of key/value heads, $H_{kv}$. Grouped-query attention reduces exactly that number.

## 18. The Spectrum: MHA, GQA, MQA

In **multi-head attention**, MHA, every query head has its own key head and value head: Finch-19 has 8 of each. At the other extreme, **multi-query attention**, MQA, proposed by Noam Shazeer in 2019 in *Fast Transformer Decoding: One Write-Head is All You Need*, keeps all 8 query heads but gives them a single shared key head and value head. The cache shrinks by a factor of 8, but quality drops noticeably, and training can be less stable, because one key/value head has to serve every kind of question.

**Grouped-query attention**, GQA, introduced by Joshua Ainslie and colleagues at Google in 2023, sits in between. The query heads are split into groups, and each group shares one key/value head. Finch-24 has 8 query heads in 2 groups of 4, so 2 key/value heads. Llama 3 8B has 32 query heads in 8 groups of 4. Mistral 7B uses the same 32 and 8; Qwen 2.5 7B uses 28 query heads and 4 key/value heads, groups of 7.

@fig gqa_spectrum | The sharing spectrum for 8 query heads. MHA gives each query head its own keys and values; GQA lets groups of four share; MQA makes all eight share one. Matching colours show a group.

Query heads in the same group still ask different questions, because each has its own slice of $W_Q$ and so its own query vector. They just look the answers up in the same keys and read the same values. In effect, GQA says: the *questions* need diversity, but the *index* and the *contents* can be shared across a few questions without much loss.

| | MHA | GQA | MQA |
|---|---|---|---|
| Key/value heads | $H$ | $H / g$ (groups of $g$) | 1 |
| Finch K and V projections | $512 \times 512$ each | $512 \times 128$ each | $512 \times 64$ each |
| Cache per token, Finch | 16,384 bytes | 4,096 bytes | 2,048 bytes |
| Quality | best | close to MHA | noticeably lower |
| Used by | GPT-2, Llama 1, Finch-19 | Llama 2 70B, Llama 3, Mistral, Qwen, Finch-24 | PaLM, Falcon 7B |

## 19. Making the Shapes Line Up

Attention code written for MHA expects as many key and value heads as query heads. With GQA, the projections produce fewer: Finch-24's $k$ and $v$ come out as $(B, 2, T, 64)$ while $q$ is $(B, 8, T, 64)$. The simplest fix, before attention runs, is to copy each key/value head so there is one copy per query head in its group:

$$(B, H_{kv}, T, d_h) \xrightarrow{\ \texttt{repeat\_interleave}(H / H_{kv},\ \texttt{dim}=1)\ } (B, H, T, d_h)$$

Key/value head 0 is copied into slots 0 to 3 and key/value head 1 into slots 4 to 7. Now the shapes match and attention runs exactly as before. Query head $i$ ends up reading key/value head $\lfloor i / g \rfloor$, where $g = H / H_{kv}$ is the group size: heads 0, 1, 2 and 3 read key/value head 0, heads 4 to 7 read key/value head 1.

@fig repeat_kv | Expanding two key/value heads to eight. Each one is repeated four times in a row, so query heads 0 to 3 read the first and 4 to 7 read the second.

### The silent bug

The *order* of copies matters, and there are two PyTorch functions that both produce the right shape. `repeat_interleave(4, dim=1)` repeats each head in place, giving the order 0, 0, 0, 0, 1, 1, 1, 1, which is correct. `.repeat(1, 4, 1, 1)` tiles the whole block, giving 0, 1, 0, 1, 0, 1, 0, 1. The shapes are identical, nothing crashes, and half the query heads are now paired with the wrong keys and values. The model loads and runs and gives worse answers with no error anywhere.

@fig head_mapping | Which key/value head each query head reads. The correct grouping gives runs of the same head; tiling with .repeat interleaves them, so four of the eight query heads read the wrong one.

```python
def repeat_kv(x, n_rep):                      # x: (B, H_kv, T, d)
    B, H_kv, T, d = x.shape
    if n_rep == 1:
        return x
    x = x[:, :, None, :, :].expand(B, H_kv, n_rep, T, d)   # no copy yet
    return x.reshape(B, H_kv * n_rep, T, d)                # 0,0,0,0,1,1,1,1
```

That helper, close to the one in Hugging Face's Llama code, does the same as `repeat_interleave` using `expand`, which creates a view without copying, followed by a reshape. Modern attention kernels can skip even that: PyTorch's `scaled_dot_product_attention` with `enable_gqa=True` (since PyTorch 2.5) and FlashAttention both accept fewer key/value heads directly and handle the sharing inside, with no copy at all.

:::interview Interview lens
**"How do you implement GQA, and what is the classic bug?"** Project keys and values to $H_{kv}$ heads, cache them at that size, and before attention expand each key/value head to the $H / H_{kv}$ query heads of its group, so query head $i$ uses key/value head $\lfloor i \cdot H_{kv} / H \rfloor$. The classic bug is tiling with `.repeat` instead of `repeat_interleave`: same shape, wrong pairing, no error. A related bug is caching the expanded tensor, which throws away the entire memory saving.
:::

## 20. What It Saves

### The cache

The cache formula from Chapter 1 is proportional to $H_{kv}$. For a Llama 3 8B-sized model (32 layers, 128-wide heads, 16-bit), the cache per token is 512 KiB with 32 key/value heads, 128 KiB with 8 and 16 KiB with 1. At a 128k context that is 64 GiB, 16 GiB and 2 GiB per sequence. With MHA a single long conversation nearly fills an 80 GB GPU on its own, before counting the weights. With GQA you can serve several.

@fig cache_vs_ctx | KV cache per sequence against context length for 32, 8 and 1 key/value heads. At 128k tokens the MHA cache alone nearly fills an 80 GB GPU; GQA-8 is a quarter of that.

For Finch-24 the saving is the same factor of four: 4,096 bytes per token instead of Finch-19's 16,384, so a full 4,096-token context costs 16 MiB of cache instead of 64 MiB. The key and value projections shrink too, from $512 \times 512$ to $512 \times 128$ each, which is why Finch-24's attention has 655,360 weights per layer instead of 1,048,576.

### The speed

Now put the cache next to the weights in the per-token memory bill. At 8,192 tokens the weights dominate either way: about 20.4 GB read per token with MHA, 17.1 GB with GQA. At 32,768 tokens the cache has caught up: 33.2 GB with MHA against 20.4 GB with GQA. At 128k tokens it is 84.8 GB against 33.2 GB. At a typical high-end GPU memory speed of 2 terabytes per second, that is roughly 42 milliseconds per token against 17: GQA makes long-context decoding about two and a half times faster in this example, because there is simply less to read.

@fig decode_reads | Bytes read from memory for each generated token, weights plus cache, for one sequence. At short contexts the weights dominate and GQA barely matters; at long contexts GQA's smaller cache cuts the total sharply.

### The quality

The GQA paper measured the trade-off on T5 models. With 8 key/value heads, GQA came close to the quality of full MHA while running nearly as fast as MQA. That combination, most of the speed for very little quality loss, is why it became the standard.

@fig gqa_tradeoff | The trade-off, sketched. GQA with eight key/value groups keeps nearly all of MHA's quality while getting most of MQA's speed. (Illustrative.)

### Converting an MHA checkpoint

You do not have to train from scratch to get GQA. The GQA paper's recipe, called **uptraining**, converts an existing MHA model: split the key heads into groups and replace each group by the **mean** of its heads, do the same for the value heads, then continue training for a short while, about 5% of the original pretraining compute in the paper, so the model adapts to the shared heads. The query heads and everything else stay as they were.

@fig uptrain | Uptraining. Each group of key heads is averaged into one new key head (values likewise), then training continues briefly to adapt.

## 21. Sharp Edges of GQA

**$H$ must divide by $H_{kv}$.** Every group has to be the same size, so the number of query heads must be a multiple of the number of key/value heads. 32 and 8 works; 32 and 6 does not.

**`.repeat` versus `repeat_interleave`.** Covered above, and worth repeating: correct shapes, wrong pairing, no error. Test it once by checking that query head 0 and query head 3 receive identical keys and query head 4 receives different ones.

**Caching the repeated tensor.** If you expand the key/value heads first and then store the expanded tensor in the cache, you have thrown away the entire memory saving. Cache the small $(B, H_{kv}, T, d_h)$ version and expand on the fly, or let the kernel handle it.

**More GPUs than key/value heads.** Large models split heads across GPUs (tensor parallelism). With 8 GPUs and only 4 key/value heads, some key/value heads must be duplicated onto more than one GPU. Serving frameworks handle this, but it affects memory planning.

**Kernels can skip the copy.** When the attention kernel supports grouped heads natively, passing already-expanded keys and values wastes memory bandwidth for nothing. Pass $H_{kv}$-shaped tensors with `enable_gqa=True` or to FlashAttention directly.

:::warn Watch out
GQA changes the number of key/value *heads*, not their *size*. Finch-24's key/value heads are still 64 wide, the same as its query heads, because each query is dotted with a key. A common slip is to describe GQA as "smaller keys"; the keys are the same length, there are just fewer of them, each shared by a group of queries.
:::

:::key In one breath
Decoding is limited by reading weights and the KV cache from memory, and the cache is proportional to the number of key/value heads, so grouped-query attention lets groups of query heads share one key/value head (8 query and 2 key/value heads in Finch-24, 32 and 8 in Llama 3 8B). Before attention each key/value head is expanded to its group with `repeat_interleave` or expand-reshape (query head $i$ reads $\lfloor i/g \rfloor$); tiling with `.repeat` gives correct shapes and wrong pairings, and caching the expanded tensor wastes the saving. GQA-8 cuts the cache fourfold (128 KiB instead of 512 KiB per token for a Llama 3 8B-sized model) and long-context decode time by more than half with near-MHA quality, and MHA checkpoints convert by mean-pooling each group and uptraining with about 5% of the original compute.
:::

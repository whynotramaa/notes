@part III | Attention Kernels at Inference Time | Chapter 2 spent two parts on how attention is computed fast: PyTorch's one-line SDPA call and the FlashAttention kernel behind it. This part does not repeat them. It recaps each idea in a paragraph, links to the full treatment, and adds what changes at inference time: prefill and decode want different things from the kernel, decode needs a different way to split the work, and batch size, context length and head layout decide which resource runs out first. | where:3

## 10. Scaled Dot-Product Attention APIs

The **standard attention equation** is $\text{softmax}(QK^\top / \sqrt{d_h} + M)\,V$, where $M$ is a mask of zeros and $-\infty$. Chapter 1 derived it piece by piece ([Section 38](/octlm/attention/07-scaled-dot-product/#s38)). **Fused attention implementations** compute the whole expression in one GPU kernel instead of five separate operations, and PyTorch's front door to them is **SDPA**, `torch.nn.functional.scaled_dot_product_attention`. Chapter 2 covers it in full: the six lines it replaces ([Section 22](/octlm/modern-arch/05-sdpa/#s22)), each argument ([Section 23](/octlm/modern-arch/05-sdpa/#s23)), **mask handling** and boolean conventions ([Section 25](/octlm/modern-arch/05-sdpa/#s25)), and getting tensors into the $(B, H, T, d)$ layout it expects ([Section 26](/octlm/modern-arch/05-sdpa/#s26)).

Three of those details matter more at inference than in training.

**Causal mode.** `is_causal=True` is right for prefill and wrong for single-token decode, because PyTorch aligns its causal mask to the top-left corner. Section 9 showed the failure. Decode with one query row needs no mask; several new rows against a longer cache need an explicit bottom-right-aligned mask.

**Dropout behavior.** SDPA applies dropout whenever `dropout_p > 0`. It does not look at `model.eval()`. Hugging Face's Qwen3 code passes a dropout of 0.0 unless the module is training, and your own code must do the same, or inference becomes random in a way that greedy decoding cannot remove. Qwen3's config sets `attention_dropout` to 0.0 anyway, but a ported model with a nonzero value will bite.

**Padding in batched inference.** When several prompts of different lengths are batched, the short ones are padded and the padding must be masked. That forces an explicit boolean mask, and an explicit mask rules out some kernels (Section 14).

**Why framework kernels outperform manual attention**: a hand-written version launches separate kernels for the matmul, the scale, the mask, the softmax and the second matmul, and writes the full score matrix to GPU memory between them. A fused kernel reads $Q$, $K$ and $V$ once, keeps the scores in on-chip memory and writes only the output. The next section counts what that saves.

@fig inf_fused_vs_manual | Where the time goes in hand-written attention: each of five kernels writes its result to GPU memory and the next reads it back. A fused kernel keeps the scores on the chip and touches memory only for its inputs and output.

## 11. The Memory Problem With Standard Attention

Chapter 1 counted the score matrix's memory ([Section 56](/octlm/attention/10-quadratic/#s56)) and Chapter 2 traced its round trips through GPU memory ([Sections 27 and 28](/octlm/modern-arch/06-flashattention/#s27)). In brief: standard attention materializes a $T \times T$ **attention matrix** per head, plus **intermediate tensors** of the same size for the masked scores and the softmax output, and each one is written to and read back from **GPU HBM**, the large but comparatively slow main memory. The arithmetic is cheap; the **memory bandwidth** spent on those **reads and writes** is what makes it slow. This is the general lesson of Part I applied to one operation: **memory movement can dominate computation**.

At inference time, the two phases feel this problem very differently. In prefill, the square is real and large: for Llama 3 8B at a 32,768-token prompt, one layer's scores in bf16 take $32 \times 32{,}768^2 \times 2$ bytes, 64 GiB, which does not even fit on the GPU. In decode, the scores are a single row per head: at the same context, 2 MiB per layer. Decode has no score-matrix problem. Its memory problem is reading the KV cache, which no attention kernel can avoid, only read efficiently.

## 12. FlashAttention

**FlashAttention** (Tri Dao and colleagues, 2022) computes **exact attention, not approximate attention**: the same numbers as the formula, up to floating-point rounding. It gets its speed from **tiling**: **processing blocks of Q/K/V** small enough to sit in the GPU's on-chip **SRAM**: an H100 has about 228 KB of it per processor, some 30 MB in all, against 80 GB of **GPU global memory** (HBM), but SRAM is many times faster to read. For each block of queries it walks across the blocks of keys and values, keeps a running softmax (Section 13), and writes only the final output. By **avoiding the full attention matrix**, it turns the quadratic memory traffic into linear traffic. That **reduced memory traffic** is **why FlashAttention is faster**. Chapter 2 has the full mechanism with numbers in [Section 29](/octlm/modern-arch/06-flashattention/#s29), the traffic count in [Section 30](/octlm/modern-arch/06-flashattention/#s30) and the three versions in [Section 31](/octlm/modern-arch/06-flashattention/#s31).

### What changes at decode: Flash-Decoding

FlashAttention divides its work among the GPU's processors by batch, head and block of queries. In prefill there are many query blocks, so all 132 processors of an H100 get work. In decode there is one query per sequence. With batch 1 and 32 heads, there are only 32 pieces of work for 132 processors, and each piece walks serially across the entire cache. Most of the GPU idles while a few processors read 32k rows of keys one block after another.

**Flash-Decoding**, published in October 2023 by Tri Dao, Daniel Haziza, Francisco Massa and Grigory Sizov, splits the other way. It cuts the cache into chunks along the sequence, lets different processors handle different chunks of the same head in parallel, and then merges the partial results with one small extra step. The merge uses exactly the rescaling rule of online softmax, so the result is still exact. The authors reported up to eight times faster generation for very long sequences. vLLM, SGLang and FlashInfer all use split-KV decoding of this kind.

@fig inf_flash_decoding | Decode with one query. FlashAttention gives each head to one processor, which walks the whole cache alone; Flash-Decoding splits the cache into chunks processed in parallel, then merges the partial results.

## 13. Online Softmax

**Ordinary softmax expects the whole row**: it needs the row's maximum (for numerical stability) and the sum of all exponentials before it can produce a single weight. Tiled attention sees the row one block at a time. **Online softmax** fixes this by carrying a **running maximum** $m$ and a **running normalization sum** $\ell$, and rescaling what has been accumulated so far whenever a new block raises the maximum. This makes the **numerically stable block-wise softmax** possible. Chapter 1 introduced it in [Section 57](/octlm/attention/10-quadratic/#s57), and Chapter 2 worked a full example in [Section 29](/octlm/modern-arch/06-flashattention/#s29).

Inference adds one use: **combining partial attention blocks** computed by different processors, as Flash-Decoding does. Each chunk returns three things: its maximum score $m_i$, its sum of exponentials $\ell_i$ (computed relative to $m_i$), and its normalized output $o_i$. The merged result is

$$m = \max(m_1, m_2), \qquad a_i = \ell_i\, e^{m_i - m}, \qquad o = \frac{a_1 o_1 + a_2 o_2}{a_1 + a_2}.$$

Read it as: bring both sums onto the same reference maximum, then average the two outputs weighted by how much probability mass each chunk holds.

### With the numbers from Section 7

Take the four scaled scores of Section 7, $1.4142, 0.7071, 2.1213, 0.7071$, with values $[1, 2], [3, 0], [0, 4], [2, 2]$, and split them into two chunks of two. Chunk 1 has $m_1 = 1.4142$, $\ell_1 = 1 + e^{-0.7071} = 1.4931$ and output $o_1 = [1.6605, 1.3395]$. Chunk 2 has $m_2 = 2.1213$, $\ell_2 = 1 + e^{-1.4142} = 1.2431$ and $o_2 = [0.3911, 3.6089]$. The merged maximum is 2.1213, so $a_1 = 1.4931 \times e^{-0.7071} = 0.7362$ and $a_2 = 1.2431$. The merge gives $(0.7362\, o_1 + 1.2431\, o_2) / 1.9793 = [0.8633, 2.7648]$, exactly the output Section 7 computed in one piece.

@fig inf_online_merge | Two chunks of the cache processed separately, then merged with the online-softmax rule. The merged output equals the single-pass result of Section 7 to four decimals.

## 14. SDPA vs FlashAttention

The two names are often used as if they were the same thing. They are not. **SDPA as an interface** is a function signature: give it $Q$, $K$, $V$ and a mask, get the attention output. **FlashAttention as an implementation** is one particular kernel that can compute it. SDPA has several kernels behind it and a dispatcher that picks one per call, which Chapter 2 drew in [Section 24](/octlm/modern-arch/05-sdpa/#s24).

**When SDPA can dispatch to FlashAttention** depends on the inputs. The **hardware and dtype requirements** for PyTorch's flash backend are an NVIDIA GPU of the Ampere generation or newer, fp16 or bf16 tensors, and a head size it supports (up to 256). It also does not accept an arbitrary `attn_mask`; it handles causal masking through `is_causal`. When any condition fails, SDPA uses one of its **fallback implementations**: the memory-efficient kernel, which accepts masks and fp32, or the plain math kernel, which builds the full score matrix like the hand-written version.

At inference this has a practical consequence. Batched decode with padded prompts needs an explicit mask, which can silently move you from the flash kernel to a slower one. Running a model in fp32 for a parity test does the same. Neither is an error; both show up as a speed difference you did not expect. Serving engines avoid padding altogether by packing sequences of different lengths into one ragged batch and passing their lengths to kernels written for that.

:::warn Watch out
A slow inference run is often a kernel-dispatch problem, not a model problem. Check which backend runs (Chapter 2, [Section 26](/octlm/modern-arch/05-sdpa/#s26), shows how to force one and get an error instead of a silent fallback). Forcing the flash backend in a benchmark is a quick way to find the input that disqualifies it: an fp32 tensor, a mask, a head size it does not support.
:::

## 15. Attention Performance

Everything in this part comes down to one question per workload: does the GPU run out of arithmetic or out of memory bandwidth first? Five quantities decide it.

**Sequence length** grows attention's arithmetic quadratically in prefill and its cache reads linearly in decode. **Batch size** multiplies the arithmetic but, for the weights, not the bytes: one read of $W_Q$ serves every sequence in the batch. **Head dimension** and **number of heads** set the size of each query and key: the arithmetic scales with $H \times d_h$, the cache with $H_{kv} \times d_h$.

### Prefill throughput

Prefill is compute-bound, so its throughput is the GPU's arithmetic rate divided by the operations per token. For Llama 3 8B with a 2,048-token prompt, that is at most about 63,600 prompt tokens per second on one H100, falling as prompts get longer because attention's share grows (Section 2). Batching several prompts together barely helps once a single prompt is long enough to fill the GPU.

### Decode throughput

Decode is where batch size changes everything. Each decode step reads the weights once for the whole batch, but each sequence brings its own cache. For Llama 3 8B at a context of 2,048 tokens, on one H100 at peak bandwidth and arithmetic:

| Batch | Memory used | Step time | Total tokens/s | Tokens/s per user | Limit |
|---|---|---|---|---|---|
| 1 | 16.3 GB | 4.56 ms | 219 | 219 | bandwidth |
| 8 | 18.2 GB | 5.12 ms | 1,562 | 195 | bandwidth |
| 32 | 24.7 GB | 7.04 ms | 4,542 | 142 | bandwidth |
| 64 | 33.2 GB | 9.61 ms | 6,661 | 104 | bandwidth |
| 128 | 50.4 GB | 14.74 ms | 8,686 | 68 | bandwidth |
| 238 | 79.9 GB | 23.55 ms | 10,106 | 42 | memory capacity |

Read the columns from left to right. Going from batch 1 to batch 64 multiplies total throughput by 30 and halves each user's speed. Beyond that, the caches dominate the bytes read, and every extra sequence adds almost as much time as it adds tokens, so total throughput flattens. At 238 sequences the 80 GB of memory is full, and that, not arithmetic, ends the table. In this whole range decode never becomes compute-bound.

@fig inf_batch_tradeoff | Decode throughput for Llama 3 8B on one H100 at a 2,048-token context. Total tokens per second (orange) rises and flattens as the batch grows; each user's tokens per second (slate) falls. Memory runs out at 238 sequences.

### Memory versus compute bottlenecks

Why does decode stay memory-bound even at batch 238? Because batching shares the weights and does not share the caches. Each cached key element (2 bytes) is used by the query heads of its group, 4 of them in Llama 3 8B, for one multiply-add each: 8 operations per 2 bytes, an intensity of 4, no matter how big the batch. Attention in decode is memory-bound by construction. Batching rescues the weight reads; GQA, fp8 caches and shorter contexts are the only ways to cheapen the cache reads.

@fig inf_shared_vs_private | Why batching helps the weights and not the cache. One read of each weight serves every user in the batch; every user's cache is read for that user alone.

| | Prefill | Decode |
|---|---|---|
| Queries per sequence | $T$ | 1 |
| Score shape | $(B, H, T, T)$ | $(B, H, 1, S)$ |
| Mask | causal | none (one row) |
| Bottleneck | arithmetic | memory bandwidth, then capacity |
| Kernel that wins | FlashAttention | split-KV (Flash-Decoding), paged |
| Helped by | faster matmul, fewer FLOPs | batching, GQA, quantization, smaller cache |

:::interview Interview lens
**"Why doesn't batching make decode attention compute-bound the way it does for the MLP?"** Batching helps a matmul because all sequences multiply by the same weights, so one read of each weight serves the whole batch. Attention in decode multiplies each sequence's query by that sequence's own cache, so nothing is shared: each 2-byte cached key is used only by the query heads in its GQA group, an intensity of a few operations per byte however many sequences you add. The cache reads therefore grow with batch and context, and the levers are fewer key/value heads, lower-precision caches and kernels like Flash-Decoding that at least spread those reads across the whole GPU.
:::

:::key In one breath
SDPA is PyTorch's interface for fused attention and FlashAttention is one kernel behind it, chosen only for fp16 or bf16 on recent GPUs with supported head sizes and no arbitrary mask; at inference, `is_causal=True` is wrong for single-row decode and dropout must be zeroed by hand. Standard attention's $T \times T$ round trips through HBM are a prefill problem (64 GiB per layer for Llama 3 8B at 32k); decode's problem is reading the cache, which Flash-Decoding parallelizes by splitting it into chunks and merging partials with the online-softmax rule $o = (a_1 o_1 + a_2 o_2)/(a_1 + a_2)$, $a_i = \ell_i e^{m_i - m}$. Prefill is compute-bound; decode is bandwidth-bound at every batch size, because batching shares weights but never caches, so throughput rises from 219 to about 10,100 tokens per second between batch 1 and 238 while each user slows from 219 to 42.
:::

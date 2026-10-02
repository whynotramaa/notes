@part V | Comparing what the cache stores | This part puts MHA, MQA, GQA, and MLA on the same memory ledger. A smaller cache does not establish better quality, and a positional rotation can prevent an otherwise useful matrix reassociation. We will count dimensions, locate the crossover rank, explain decoupled RoPE, and connect the design to DeepSeek. | where:5

## 14. MLA vs MHA

Two models have the same number of query heads, yet one cache is far smaller. The cache stores keys and values, so counting query heads misses the difference.

@fig kv_sharing_spectrum | Computed cached widths for four attention designs with eight query heads of width 64. Lines show which stored state each query head reads; the MLA row adds a 16-feature rotary key beside its 64-feature latent.

### Full independent KV heads and cache size

**Multi-head attention**, or **MHA**, gives every query head its own key and value projections. For $H$ heads of width $d_h$ the cache holds `2Hd_h` features per token per layer: `2 × 8 × 64 = 1,024`. Our MLA fixture stores `r+d_R=64+16=80`.

At batch 2, 8 layers, length 4,096 and two-byte elements, MHA uses `2 × 8 × 4,096 × 1,024 × 2 = 134,217,728` bytes, or 128 MiB. The MLA fixture's 10 MiB is 12.8 times smaller. This compares cache layouts, not equal-parameter trained models.

@fig attention_cache_comparison | Computed payloads use the same batch, layers, sequence length, and element size. The MLA bar includes its positional key; its illustrative rank is not a measured optimum.

### Representation capacity

MHA's projected states are free of a joint low-rank constraint. MLA can produce different head features, but all of them come from one latent, and being able to write the reconstruction does not make quality equal. MHA heads are "independent" only in having separate projections; they all read the same hidden vector.

## 15. MLA vs MQA

One shared key and value can serve every query head. The heads still ask different questions, but they search the same keys and retrieve the same values.

### Shared KV and latent compression

**Multi-query attention**, or **MQA**, uses one KV head for all query heads, so the cache holds `2d_h` = 128 features and the fixture payload is `2 × 8 × 4,096 × 128 × 2 = 16,777,216` bytes, or 16 MiB. Shazeer proposed it in 2019 to cut the memory bandwidth spent on K/V during incremental decoding. [Multi-query attention paper](https://arxiv.org/abs/1911.02150).

MLA's 80 features are `128/80=1.6` times smaller here, but that is not universal. At latent rank 128 with the same 16 positional features, MLA stores 144 and loses to MQA's 128. Count the actual rank and positional branch before claiming a saving.

### Quality vs memory

MQA shares explicit head states; MLA shares a latent but transforms it per head. These are different restrictions, so cache size cannot rank their quality. Compare trained models at a declared budget on the runtime you will actually use.

## 16. MLA vs GQA

Finch-24 already shares KV across query groups. Comparing MLA only against MHA would overstate its saving against the model we actually start from.

### Grouped KV heads and compressed latent KV

**Grouped-query attention**, or **GQA**, uses fewer KV heads than query heads, each KV head serving a group. Finch has 8 query heads and 2 KV heads, so groups of 4, a cached width of `2 × 2 × 64 = 256`, and a 32 MiB fixture payload. Ainslie and colleagues (2023) studied it as the middle ground between MHA and MQA. [GQA paper](https://arxiv.org/abs/2305.13245).

### Cache-size differences and computational trade-offs

The MLA fixture is `256/80=3.2` times smaller than GQA. The crossover is

$$
r+d_R<2H_{KV}d_h.
$$

Read this as latent rank plus positional width must stay below the explicit K/V width for MLA to save payload. Here `r+16<256`, so MLA wins when `r<240` and ties at 240. At rank 256 it needs 272 features and 34 MiB, above GQA's 32 MiB.

@fig mla_rank_crossover | Computed cache dimensions cross the Finch GQA baseline at rank 240. Rank sets both capacity and persistent storage.

GQA reuses familiar head layouts; MLA moves work into latent projections and absorbed paths. Strong GQA kernels against a slow MLA reference can favor GQA despite the larger payload, so compare prefill and decode separately at equal context and batch, and report the kernels.

| Design | Cached features per token/layer | Payload in the fixture | Main sharing rule |
|---|---|---|---|
| MHA | 1,024 | 128 MiB | Separate K/V per query head |
| GQA | 256 | 32 MiB | One KV head per query group |
| MQA | 128 | 16 MiB | One KV head for all queries |
| MLA fixture | 80 | 10 MiB | Shared content latent plus positional key |

The original Llama 3 8B has 32 layers, 8 KV heads, and head width 128. At batch 1 and two-byte elements, each cached token costs `32 × 2 × 8 × 128 × 2 = 131,072` bytes, so 8,192 tokens take 1,073,741,824 bytes, or 1 GiB. That is the tensor payload, not whole-process memory. [Original Llama 3 implementation](https://github.com/meta-llama/llama3/blob/main/llama/model.py).

:::note Keeping the denominator honest
Cache payload excludes weights, attention workspaces, page tables, padding, and quantization metadata. Going from 32 MiB to 10 MiB shrinks this one component; total memory and latency do not fall by the same factor.
:::

## 17. MLA and RoPE

The absorption identity in Section 13 worked because the up-projection was one fixed linear map. A key rotated by its position applies a different map at every historical position, which changes what can be moved onto the query.

### Positional information and the difficulty with naive compression

**Rotary position embedding**, or **RoPE**, rotates paired query and key coordinates by position-dependent angles. With key rotation $R_t$ and query rotation $R_s$, a naive rotated-content score is

$$
(R_s q)^\top R_t W_U^K c_t
=q^\top R_s^\top R_t W_U^K c_t.
$$

Read this as the relative rotation sits between the query and the key up-projection. It depends on the historical position $t$, so no single query transform can absorb it for every cached token. Compression is still possible; this simple absorption is what fails.

### Separating positional and content components

**Decoupled RoPE** splits a content-key path from a rotary positional-key path, and each head's score adds the two:

$$
\mathrm{score}_{s,t,i}
=\frac{(q^C_{s,i})^\top k^C_{t,i}
 +(q^R_{s,i})^\top k^R_t}{\sqrt{d_C+d_R}}.
$$

Read this as add the content and positional dot products, then apply the declared scale. $C$ marks content, $R$ the rotary branch, $i$ a head, and $s,t$ the query and key positions. The content term keeps the absorption identity; the rotary key is cached explicitly and shared across heads.

@fig decoupled_rope_paths | The illustrative content branch reads the latent through an absorbed query; the positional branch compares separately rotated features. The two score contributions add before softmax.

With content width 64 and rotary width 16, the query/key width is 80 and the rotary key adds 16 cached features per token per layer. Its down-projection from Finch's 512-feature hidden state has `16 × 512 = 8,192` parameters. The head-specific query rotary projection must also be counted in a full architecture.

:::story Picture this
A catalog keeps an item's description and its shelf address in separate fields. A compact description supports content matching while the address still says where it belongs. MLA's decoupled design keeps content and position comparisons apart in the same way.
:::

:::warn Watch out
Never drop the positional key from an MLA cache estimate, and do not rotate the shared latent expecting both ordinary RoPE and absorption to survive. Declare the exact query/key split, scale, and cached tensors.
:::

## 18. DeepSeek architecture connection

Many readers, many tokens, and a cache fetched for every new query: cutting bytes per historical token is the architectural case for MLA, strongest when context and batch grow together.

### Why MLA is used and architectural motivation

DeepSeek-V2 combines joint low-rank KV compression with a separate rotary branch, keeping head-specific content transforms with a small cache. It also uses mixture-of-experts feed-forward layers, so its throughput cannot be credited to MLA alone. [DeepSeek-V2 architecture and evaluations](https://arxiv.org/html/2405.04434v5).

### KV-cache efficiency and long-context inference

In our fixture, 32 MiB to 10 MiB follows from stored widths 256 and 80. If decoding is cache-bandwidth bound, fewer bytes help. If projection work, kernel overhead, or weight reads dominate, the gain shrinks or vanishes.

MLA compresses features per token; it does not bound the number of tokens. The latent cache still grows linearly with length and dense prefill is still quadratic. Sparse patterns and latent memory attack different dimensions of the problem.

:::interview Interview lens
**"Is MLA always smaller and faster than GQA?"** It is smaller only when latent rank plus positional width is below the GQA K/V width. At our dimensions, rank 64 gives 80 features against 256, but rank 256 gives 272 and loses. Speed also depends on absorption, kernels, and the bottleneck, and quality needs training and evaluation.
:::

:::key In one breath
MHA, GQA, and MQA share explicit K/V heads at different levels; MLA shares a learned content latent. Count the rotary key with the latent and compare against the real baseline. Decoupled RoPE keeps a position-independent content path for absorption and handles position separately. A smaller payload is an opportunity that still needs a controlled experiment for quality and latency.
:::

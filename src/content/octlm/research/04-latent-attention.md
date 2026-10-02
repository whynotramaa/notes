@part IV | Storing a latent instead of full heads | This part changes the feature representation stored for each token. Reconstructing every head at every decode step would surrender much of the cache benefit. We will derive a joint latent, follow its shapes, and see how linear algebra can let queries interact with it directly. | where:4

## 12. Multi-head latent attention

Every generated token adds a key and value per stored KV head. At long context and large batch, reading that cache can limit decoding even when the weights fit. Could the decoder keep a smaller vector per position and still serve several heads?

### KV-cache bottleneck and latent KV representations

**Multi-head latent attention**, or **MLA**, learns a low-dimensional vector from which keys and values are derived. A **latent** is an internal feature vector rather than explicit K/V head states. The idea is joint compression: a token's keys and values both come from the same smaller vector.

MLA is a trained parameterization, not a file compressor applied to an existing Finch GQA cache. Finch-24 stays the baseline; the dimensions below describe an illustrative variant that would need training and evaluation.

@fig latent_vs_full_cache | Illustrative per-token storage compares separate full K/V features with a shared latent. The positional-key branch is shown separately because the decoupled RoPE design in Part V cannot cache the content latent alone.

### Low-dimensional compression and reconstructing attention information

For hidden vector $h_t\in\mathbb R^{512}$, choose latent rank $r=64$ and down-projection $W_D\in\mathbb R^{64\times512}$:

$$
c_t=W_D h_t,\qquad k^C_{t,i}=W^K_{U,i}c_t,\qquad v_{t,i}=W^V_{U,i}c_t.
$$

Read this as compress token $t$ into $c_t$, then use per-head up-projections for the content key and value. With 8 heads of width 64, each combined up-projection is `512 × 64`. The down-projection and each up-projection have 32,768 parameters. Queries, positional branches, normalization, and output projection are counted separately.

Reconstructed keys and values lie in a learned subspace of rank at most 64. That is a representational restriction, and whether it is adequate is a training result, not something the algebra proves.

DeepSeek introduced MLA in DeepSeek-V2 (2024), with learned joint compression and an inference form that keeps compact states. [DeepSeek-V2 architecture paper](https://arxiv.org/html/2405.04434v5).

:::story Picture this
A music file stores compact coefficients that each speaker channel transforms into its own output. MLA lets different heads derive different features from one shared latent the same way, though unlike lossless compression, the small latent is a limit the model must learn to live with.
:::

## 13. MLA internals

The cache stores 64 content features, but the equations rebuild 512 key and 512 value features. If inference materializes those full histories, it spends the memory it claimed to save.

### Latent projection and compressed KV representation

An input batch `[2,8,512]` projects to `[2,8,64]`, one latent per item and token. Training can expand keys and values explicitly to check the math. Cached decoding instead stores `[B,T,64]` per layer.

@fig mla_projection_shapes | Computed illustrative shapes show the down-projection and two up-projections. Orange marks the latent that persists in the cache; expanded training intermediates need not be stored during decoding.

### Query interaction and reconstructed keys/values

Let $q_i$ be a content query for head $i$. Ignoring position for now:

$$
q_i^\top W^K_{U,i}c_t
=\left((W^K_{U,i})^\top q_i\right)^\top c_t.
$$

Read this as move the key up-projection onto the query once, then compare that 64-feature query with every cached latent. Folding linear maps into neighboring projections this way is called **weight absorption**.

A tiny example: hidden `[2,1]` and down row `[1,2]` give latent `1 × 2 + 2 × 1 = 4`. Up-key column `[1,2]` gives key `[4,8]`, and query `[1,2]` scores `1 × 4 + 2 × 8 = 20`. The absorbed query is `1 × 1 + 2 × 2 = 5`, and `5 × 4 = 20`.

@fig mla_absorbed_dot_product | Both routes through this illustrative one-dimensional latent produce score 20 in exact arithmetic. This checks algebra, not task quality.

Values work the same way. With normalized attention weights $a_{i,t}$ for head $i$:

$$
\sum_t a_{i,t}W^V_{U,i}c_t
=W^V_{U,i}\left(\sum_t a_{i,t}c_t\right).
$$

Read this as form the weighted latent sum first, then expand it once. The value up-projection can be merged into the matching output-projection slice. Each head keeps its own attention weights; shared storage does not mean a shared attention pattern.

### Cache savings

Our decoupled design adds a 16-feature positional key per token, so the cached width is `64+16=80`. At batch 2, 8 layers, length 4,096 and two-byte elements, that is `2 × 8 × 4,096 × 80 × 2 = 10,485,760` bytes, or 10 MiB, against 32 MiB for Finch GQA. Section 17 explains why the positional part sits outside the latent.

Absorbed queries still do head-specific work, and kernel layout, projection cost, rank, and the positional path all affect speed. A Python version that caches reconstructed K/V can verify the math while showing none of the memory saving.

:::note Normalization convention
The latent dot product is a reassociation of the original content score. Do not rescale by the square root of the latent rank just because the cached vector is shorter. With 64 content and 16 positional query features, the concatenated score uses the declared width of 80.
:::

:::warn Watch out
These identities need linear up-projections. A nonlinearity in that path generally breaks the reassociation. Reordered floating-point matmuls also differ slightly, so check agreement with a tolerance suited to the dtype.
:::

:::interview Interview lens
**"Why can MLA store a latent without rebuilding all historical keys?"** The content-key up-projection is linear, so its transpose can move onto the query before reading the cached latents. A weighted sum of expanded values equals the expansion of the weighted latent sum. Heads keep distinct queries and weights. RoPE complicates the key identity, which is why the decoupled positional branch exists.
:::

:::key In one breath
MLA represents a token's content keys and values through one smaller latent. Linear reassociation lets queries and value sums use the latent directly instead of rebuilding full heads. Our 64-feature latent plus 16-feature positional key needs 10 MiB in the Finch-shaped fixture. Cache size, projection work, capacity, and kernels all belong in the comparison.
:::

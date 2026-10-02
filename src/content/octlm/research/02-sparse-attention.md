@part II | Choosing fewer connections | This part changes where each token can look. Fewer permitted comparisons can save work, but they can also remove a dependency the task needs. We will compare local, sliding, global, strided, and hybrid patterns while separating mask geometry from actual kernel performance. | where:2

## 4. Sparse attention

A code file refers to a variable declared far earlier. If the declaration lies outside a local-only decoder's window, the final layer cannot inspect it directly. The connection pattern is part of what the model can learn.

### Dense vs sparse attention and reducing attended positions

**Sparse attention** restricts each query to a subset of positions. A binary **attention mask** lists the allowed query-key pairs. Dense causal attention allows every nonfuture position; a sparse causal pattern allows fewer and still forbids the future.

@fig sparse_mask_families | Computed illustrative masks for eight tokens compare dense causal attention, a window including three positions, and that window plus fixed global positions. Each orange cell is an allowed connection, not a measured attention weight.

### Complexity reduction and information trade-offs

If each of $T$ queries reads at most $w$ keys, arithmetic scales as `O(Tw)` instead of `O(T²)`, but only if the kernel actually skips disallowed pairs. Computing dense scores and then zeroing entries is still dense work, and a dense Boolean mask still costs quadratic memory.

Absent edges cannot carry a direct comparison at that layer. Deeper layers or global paths may recover indirect communication, which is not the same as full attention. Child and colleagues' Sparse Transformer explored structured sparsity for long sequences. [Sparse Transformer paper](https://arxiv.org/abs/1904.10509).

For eight tokens, dense causal attention has 36 pairs. A width-4 causal window has `1 + 2 + 3 + 4 + 4 + 4 + 4 + 4 = 26`, a structural saving of 10 pairs, not evidence that any GPU kernel is faster.

## 5. Local attention

In prose, a pronoun usually depends on a nearby noun. Restricting attention to a neighborhood keeps that structure while skipping distant comparisons.

### Fixed local neighborhoods and nearby-token attention

**Local attention** restricts each position to a neighborhood: a symmetric radius in a bidirectional encoder, a past-only span in a causal decoder. Fixed blocks do not overlap; sliding neighborhoods move with each query.

A causal window holding the current token and three predecessors lets position 7 read positions 4 to 7. Position 1 sees only 0 and 1 because nothing comes earlier. These boundaries matter when counting cost or writing masks.

### Reduced cost

For $T\ge w$, a causal window of width $w$ including the current position has

$$
N_{\mathrm{local}}=\frac{w(w+1)}{2}+(T-w)w.
$$

Read this as the first $w$ positions contribute growing prefixes, and each of the remaining $T-w$ contributes $w$ comparisons. At $T=8,w=4$, the count is `10 + 4 × 4 = 26`. For $T<w$, use the full triangular count.

Fixed blocks can strand two adjacent tokens on either side of a boundary. A sliding window avoids that but still drops distant edges. Pick the pattern from the paths the task needs and the kernels you have.

## 6. Sliding-window attention

The sequence keeps growing, but each query reads only the most recent span. Layers that need only that span can keep a rolling cache instead of all past keys and values.

### Window size and restricted context

**Sliding-window attention** uses a neighborhood defined relative to each query. Our **window size** $w$ includes the current position, so width 4 means three prior positions plus the current one. Some implementations count only past tokens, so translate their values before comparing.

### Receptive-field growth across layers

A **receptive field** is the set of input positions that can influence a representation. With $L$ layers of causal width-$w$ attention, the maximum span is `1 + L(w-1)`, clipped at the sequence start. That is a set of possible paths, not lossless storage along them.

@fig window_receptive_growth | Computed reach for a width-4 causal window expands by at most three positions per layer. The drawing shows reachability, not attention strength or successful retrieval.

For Finch-24's 8 layers, width 4 gives `1 + 8 × 3 = 25` tokens and width 256 gives `1 + 8 × 255 = 2,041`. A farther dependency has no path at all; a nearer one may still be poorly learned.

### Memory savings and long-range limitations

At batch 2 with 8 layers, 2 KV heads, head width 64, and two-byte elements, a full 256-token rolling cache uses `2 × 8 × 256 × 2 × 2 × 64 × 2 = 2,097,152` bytes, or 2 MiB, against 32 MiB for the full 4,096-token cache. The 16-fold saving assumes the runtime really evicts old states and no other layer needs them.

Mistral 7B (2023) used sliding-window attention with a rolling cache. [Mistral 7B paper](https://arxiv.org/abs/2310.06825).

## 7. Global and strided attention

A distant header names the document's subject. Local edges alone need many layers to carry it to every paragraph; a few long-range links shorten the path.

### Global tokens and periodic long-range links

**Global tokens** take part in connections beyond the local neighborhood. In a causal decoder they still obey the past-only rule: later queries can read a prefix token, but that token cannot summarize what comes after it in the same pass.

Longformer combined local attention with task-selected global positions in a bidirectional encoder. Copying its global behavior into causal generation unchanged would leak the future. [Longformer paper](https://arxiv.org/abs/2004.05150).

### Strided patterns and combining local/global information

**Strided attention** connects positions at periodic intervals. One rule reads keys in the same residue class modulo stride $s$; another lets every query read indices that are multiples of $s$. They connect different pairs, so document which one a mask implements.

With eight positions and a width-3 window, adding prefix globals at indices 0 and 4 raises the allowed count from 21 to 27. Count the union, so a global key already inside the window is not counted twice, and queries before index 4 still cannot see it.

A fixed number $g$ of globals gives `O(T(w+g))` pairs. A stride exposing about `T/s` distant keys per query gives `O(Tw + T²/s)`, still quadratic at fixed stride. "Strided" does not mean linear.

## 8. Hybrid attention

Most layers can use local windows while a few read the full prefix. Recent-token work stays bounded, and long-range access survives at chosen depths.

### Local layers, full-attention layers, and periodic global attention

**Hybrid attention** mixes patterns within one model, for example three local layers then one full layer, repeated. **Periodic global attention** here means a full causal layer at a set depth, not a bidirectional global token.

@fig hybrid_layer_schedule | An illustrative eight-layer Finch schedule has full attention at layers 4 and 8, with six local layers. It is a proposed variant and carries no measured quality claim.

### Efficiency vs context access

Full layers keep their full-prefix cache, so a hybrid's memory is the sum over layers. At batch 2, length 4,096, window 256, and Finch KV dimensions, a full layer stores 4 MiB and a local layer 0.25 MiB. The schedule uses `2 × 4 + 6 × 0.25 = 9.5` MiB against 32 MiB for all-full layers.

Pair counts mix the same way. A 4,096-token full layer has 8,390,656 causal pairs and a width-256 layer has 1,015,936. The schedule totals `2 × 8,390,656 + 6 × 1,015,936 = 22,876,928`, against `8 × 8,390,656 = 67,125,248` for all-full layers. Head and batch factors multiply both.

@fig hybrid_cost_ledger | Computed cache payload and causal pair counts for all-full, hybrid, and all-local schedules under the same Finch shapes. The two full layers account for 8 of the hybrid's 9.5 MiB.

These counts predict arithmetic and payload, not wall time or quality. A dense fallback for local masks erases the saving, and the full layers only help if training teaches the model to use them. Compare against an all-full baseline at the same budget and test dependencies at several distances.

:::note Pattern union
Local and global edges overlap. Count the set of allowed pairs, not the sum of separate counts, and check mask geometry on short sequences before measuring kernels.
:::

:::warn Watch out
Swapping a causal flag for an arbitrary dense Boolean mask does not prove sparse execution. Record the selected backend, actual allocation, and measured latency instead of inferring speed from the mask.
:::

:::interview Interview lens
**"Does stacking local-attention layers recover full attention?"** Stacking widens the set of positions that can influence a representation through indirect paths, up to $1+L(w-1)$ after $L$ causal width-$w$ layers. Each layer still makes no direct full-prefix comparison, and distant detail can be lost along the way. Global edges or full layers change connectivity, but quality still needs an experiment.
:::

:::key In one breath
Sparse attention removes query-key edges, and speed savings need kernels that skip them. Local windows have linear pair count at fixed width, while indirect reach grows with depth. Global and strided rules need explicit causal masks and honest asymptotic counts. A hybrid stores full history only in its full layers, trading memory and arithmetic against tested long-range behavior.
:::

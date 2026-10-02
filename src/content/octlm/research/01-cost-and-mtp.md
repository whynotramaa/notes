@part I | The cost and the next few tokens | This part separates attention's growing cost from the training signal used to predict text. Reducing one cost does not automatically improve another. We will count dense attention, add future-token objectives, and explain why proposed future tokens still need verification. | where:1

## 1. Why modify standard attention

Double the input from 8 tokens to 16, and a full attention score grid grows from 64 entries to 256. A long-context decoder pays for those relationships even when most are unhelpful.

### Quadratic attention cost

**Dense attention** lets each query compare with every allowed key. In a causal decoder, position $t$ sees only current and earlier positions, giving `T(T+1)/2` pairs, while a naively materialized score tensor has `T²` entries per head.

$$
N_{\mathrm{pairs}}=\sum_{t=1}^{T}t=\frac{T(T+1)}{2}.
$$

Read this as the allowed causal pairs equal the sum of the visible prefix lengths. At 8 tokens there are 36; at 16 there are 136.

@fig dense_attention_growth | Computed causal pair and full-grid counts for two illustrative sequence lengths. The square grid is a representation choice; an optimized kernel need not store it all.

### KV-cache growth and long-context limitations

The **KV cache** retains past keys and values during decoding and grows linearly with length. Finch-24's GQA cache uses 4,096 bytes per token, so a 4,096-token sequence uses 16 MiB and a batch of 2 uses 32 MiB. Fitting tokens in a buffer does not mean the model uses them well; that needs suitable training and positional behavior.

### Training efficiency

**Training efficiency** is the quality obtained for a compute and memory budget. FlashAttention cuts memory traffic and never materializes the score matrix, but it still computes exact dense attention, so the arithmetic stays quadratic. [FlashAttention paper](https://arxiv.org/abs/2205.14135).

Sparse attention changes which relationships exist. Compressed and latent memory change what is stored. Multi-token prediction changes the loss. Keep them separate before comparing results.

:::story Picture this
A librarian can compare a question with every book description, look only at nearby shelves, or consult summaries of distant shelves. Organizing comparisons efficiently differs from making fewer of them or shortening the descriptions.
:::

## 2. Multi-token prediction

At the prefix "the bolt is," ordinary training asks for the next token. An extra objective can also ask what comes after that, pushing the shared representation to support a longer continuation.

### Standard next-token prediction and predicting several future tokens

**Next-token prediction** learns the distribution of the immediate next token. **Multi-token prediction**, abbreviated MTP, adds objectives for several future positions, for example through a shared decoder trunk with one prediction head per offset.

### Multiple prediction heads and auxiliary objectives

A **prediction head** maps a shared representation to an output distribution. An **auxiliary objective** adds a target beyond the primary one. Heads need separate transformations: the same tied output matrix on the same hidden state gives the same logits.

@fig mtp_future_heads | A schematic parallel MTP design gives one prefix several future targets. The words and head depths are illustrative; simultaneous independent samples are not an autoregressive continuation.

Gloeckle and colleagues proposed shared-trunk independent future heads in 2024. DeepSeek-V3 instead chains sequential prediction modules conditioned on shifted ground-truth token embeddings. [MTP paper](https://arxiv.org/abs/2404.19737), [DeepSeek-V3 report](https://arxiv.org/html/2412.19437v2).

### Loss weighting and training signal

With future offset $j$ and nonnegative weight $\lambda_j$, one possible sum is

$$
\mathcal L_{\mathrm{MTP}}=\sum_{j=1}^{K}\lambda_j\mathcal L_j,
\qquad
\mathcal L_j=-\frac{1}{N_j}\sum_t\log p_j(x_{t+j}\mid x_{\le t}).
$$

Read this as the MTP loss sums weighted losses over $K$ future offsets. $p_j$ is the offset-$j$ head's distribution and $N_j$ counts positions that have an in-sequence target at that offset.

For illustrative losses 1, 2, and 3 with weights 1, 0.5, and 0.25, the weighted sum is `1 + 1 + 0.75 = 2.75`. Dividing by the weight sum 1.75 gives 1.571429. Both conventions exist, so state which one you report.

@fig mtp_target_alignment | An illustrative sequence shows offset-specific target alignment. Future offsets lose valid positions near the end and need their own masks.

### Inference implications

MTP may improve the shared representation even when inference uses only the next-token head. Extra heads can also propose drafts, but proposal cost, acceptance, and verification decide whether decoding gets faster.

For a simplified Finch variant, one bias-free `512 × 512` linear map per extra head adds 262,144 parameters while reusing the tied output matrix. Two extra heads add 524,288, for a total of 41,034,240. This toy design does not reproduce either published architecture.

## 3. MTP and speculative decoding

A head predicts *red* after "the bolt is," but the target model favors *blue*. Writing *red* directly would change the model being sampled, so future prediction needs a verification rule.

### Drafting future tokens and verification

A **draft** is a proposed continuation that a target model checks. **Verification** evaluates the target's probabilities or greedy choices at each draft position under the proper causal prefix.

### Accept/reject behavior

For **greedy verification**, accept the draft prefix that agrees with the target's greedy choices and replace the first mismatch with the target's choice. Candidates after the mismatch were conditioned on a wrong prefix and are discarded. Exact stochastic sampling needs acceptance probabilities and a residual distribution, derived in Section 19.

@fig mtp_verify_prefix | An illustrative greedy check accepts the first two proposed tokens, replaces the third, and discards the dependent suffix. The `?` marks a target choice that must be recomputed under the corrected prefix.

### Relationship between MTP and faster decoding

MTP is a training design; speculative decoding is an inference algorithm. Independent marginal forecasts are not the joint proposal that sequential drafting gives, so candidate construction and verification must be specified together.

If four drafted tokens all pass and the algorithm adds a bonus target token, the round emits five tokens. That is the best case, not a fivefold speedup. Section 20 computes the expected count including rejections and proposal cost.

:::note Extra head cost
Finch-24's tied vocabulary matrix already has 16,384,000 parameters. An untied vocabulary matrix per future head would change the budget substantially, so state whether the output matrix is shared.
:::

:::warn Watch out
Do not emit future-head guesses as ordinary autoregressive samples. A rejected token changes every later prefix. Use a specified verification procedure, then measure parity and throughput.
:::

:::interview Interview lens
**"Does multi-token prediction make a model generate several correct tokens in one pass?"** It trains extra predictions of future tokens, which may improve representations or provide drafts. The drafts still need causal verification to keep the target model's behavior. I would measure training quality, draft acceptance, and end-to-end decode speed separately.
:::

:::key In one breath
Dense causal attention has quadratic pair count, while ordinary KV storage grows linearly with length. Efficient kernels, sparse connections, and compressed representations change different costs. MTP adds weighted future-target losses through distinct heads. It can supply drafts, but a verification algorithm decides which tokens are emitted.
:::

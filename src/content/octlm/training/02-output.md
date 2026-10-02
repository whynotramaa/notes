@part II | Turning a hidden vector into predictions | This part finishes the decoder's forward computation. A contextual vector is not yet a score for any vocabulary item, and its scale still affects the output head. We will normalize the last residual stream, project to logits, share the embedding weights, and trace the complete decoder. | where:2

## 3. Final normalization

Imagine two final token vectors pointing in the same direction, one with larger magnitude. A linear head can turn that scale difference into a much sharper distribution even if the relative preferences are unchanged. The last residual addition also bypasses the normalization at the start of its sublayer. A pre-norm stack therefore usually has one more normalization after the final block.

**Final normalization** is the normalization applied to the last residual-stream tensor before the vocabulary projection. It acts on each token's feature dimension, preserving `B × T × d`. It is separate from the two norms inside each Finch-24 block. "Every block has a norm" does not establish that the tensor leaving the last residual addition is normalized.

The complete LayerNorm/RMSNorm calculation is in [the earlier side-by-side computation](/octlm/modern-arch/02-rmsnorm/#s8), and [norm placement and epsilon](/octlm/modern-arch/02-rmsnorm/#s11) explains the conventions. Here the extra training concern is the scale of the last residual stream reaching the head. For a short reference calculation, RMSNorm with unit gain and epsilon omitted maps $[3,4]$ to $[0.848528,1.131371]$, preserving direction before the learned gain. The final layer acts on each token's features, not across the batch.

@fig train_final_norm | A pre-norm block normalizes its branch input, then adds to the residual stream. The final RMSNorm acts after the last addition, immediately before the vocabulary head.

@fig train_norm_geometry | The illustrative vector `[3, 4]` keeps its direction under unit-gain RMS normalization when epsilon is omitted. Orange shows the calculated normalized radius; learned unequal gains can also change direction.

### What the final hidden representation means

A **hidden representation** is an internal numeric description learned for the prediction task. Here it has combined the current input token with all permitted earlier positions through the block stack. Coordinate meanings need not be individually named or stable across retraining. The head reads the whole vector to assign vocabulary scores.

Normalization controls a scale presented to the head and helps the chosen architecture train. It does not make logits probabilities, ensure calibrated predictions, or stop the learned head weights from growing. Learned gains may also change the normalized scale. RMSNorm's scale invariance is approximate in the presence of epsilon and assumes positive input rescaling. It is not invariance to adding a constant, which LayerNorm has before its learned affine transformation.

Finch-24's final RMSNorm has 512 parameters, one gain per feature. LayerNorm with gain and bias at the same width has 1,024. The reduction and scaling cost $O(BTd)$, small beside the vocabulary projection's $O(BTdV)$. Computing squared values and the reduction in FP32 is a useful numerical choice even if the surrounding matrix multiplies use BF16. Part V will explain the precision tradeoff.

Ba, Kiros and Hinton introduced LayerNorm in 2016; Zhang and Sennrich introduced RMSNorm in 2019. Llama 3's reference forward pass applies its final RMSNorm before its output projection. Norm placement belongs to the trained architecture: moving or deleting it in a checkpoint changes the function. [LayerNorm](https://arxiv.org/abs/1607.06450), [RMSNorm](https://arxiv.org/abs/1910.07467), [Llama 3 implementation](https://github.com/meta-llama/llama3/blob/main/llama/model.py).

## 4. LM head

The final vector has 512 coordinates, but Finch-24 has 32,000 possible next tokens. We need one score for every candidate, not a rule saying "coordinate seven is the word *cat*." A vocabulary projection supplies that learned interpretation.

The **language-model head**, or LM head, is the projection from the final hidden width to vocabulary scores. The earlier [LM head](/octlm/attention/12-decoder-block/#s68) defines logits and [stable softmax](/octlm/attention/07-scaled-dot-product/#s41) explains the score-to-probability conversion. A logit is an unnormalized score; a probability is a nonnegative share of a distribution that sums to one. Logits can be negative, larger than one, or shifted by the same constant without changing their softmax probabilities.

$$
Z=\widehat{X}W_{\text{out}},\qquad
p_{b,t,v}=\frac{\exp(Z_{b,t,v})}{\sum_{u=1}^{V}\exp(Z_{b,t,u})}.
$$

Read this as: multiply the normalized hidden tensor $\widehat{X}$ by the output matrix $W_{\text{out}}$ to obtain logits $Z$; at batch index $b$ and position $t$, exponentiate candidate $v$'s logit and divide by the sum of exponentials over all vocabulary candidates $u$. $W_{\text{out}}$ has shape $(d,V)$ in the row-vector convention. There is no output bias in Finch-24.

The output shape is `B × T × V`, so our example is `(2, 8, 32000)`. Every sequence position gets its own next-token distribution. The logits at position $t$ predict the token after that input position, using the causal prefix through $t$. During generation, only the last position's logits normally choose the next token; that does not mean training should discard the others.

@fig train_logits_token_grid | The Finch-24 output has two sequences, eight positions per sequence, and 32,000 vocabulary scores per position. Drawn columns are symbolic; one row supplies one supervised target prediction.

### A miniature vocabulary

Take a width-2 illustrative hidden vector $h=[1,2]$. Give vocabulary rows $[2,0]$, $[1,0]$ and $[0,0]$ to tokens A, B and C. Their dot products with $h$ are $[2,1,0]$. Stable softmax first subtracts the maximum, yielding $[0,-1,-2]$. Exponentials are $[1,0.367879,0.135335]$, with sum 1.503215. Dividing gives probabilities $[0.665241,0.244728,0.090031]$.

@fig train_head | An illustrative three-token head turns a two-feature vector into logits. The vocabulary rows define three dot products; softmax then converts scores into a distribution.

A **stable softmax** subtracts the maximum logit before exponentiation. This leaves the distribution unchanged because the common exponential factor cancels, but avoids overflow from large positive scores. If a row has no finite allowed candidate, softmax cannot create a valid distribution; check the mask and filtering policy before sampling.

### The cost is visible at small scale

Our example output has $2\times8\times32,000=512,000$ values. It occupies 1,024,000 bytes in BF16 or 2,048,000 in FP32, before any gradient or temporary tensor. At full Finch-24 context with `B = 2`, a materialized BF16 logits tensor occupies $2\times4,096\times32,000\times2=524,288,000$ bytes, or 500 MiB. Tied weights do not remove this output tensor.

The dense head's example matrix multiply uses 524,288,000 floating-point operations under the convention that one multiply plus one add counts as two, excluding softmax. Vocabulary size can make this projection a material cost even for a small model. Chunked or fused linear-cross-entropy implementations can avoid keeping the whole logits tensor during training; they change memory traffic, not the mathematical objective. During ordinary prompt prefill for generation, projecting only the last hidden state can avoid unnecessary output work when earlier logits are not needed.

:::story Picture this
A judge receives a report and scores every candidate on the same sheet. The report is the hidden vector; each candidate has a learned scoring rule. Softmax converts the score sheet into a distribution for choosing a candidate. It does not independently decide whether the report is true, or whether the candidates are good answers to a user's question.
:::

:::warn Watch out
Pass logits, not probabilities, to `cross_entropy`. Its stable implementation already performs the log-softmax calculation. Applying softmax first changes the function and the gradients; squeezing away the batch or time axis can also quietly change which predictions are being compared.
:::

## 5. Weight tying

The input embedding already owns a row for every token. The output head also needs a learned vector for every candidate. For Finch-24, storing both independently would add an entire 16,384,000-parameter matrix. The model can instead use one shared parameter in both roles.

The [embedding lookup](/octlm/attention/02-embeddings/#s10) and [weight-tying mechanism](/octlm/attention/02-embeddings/#s14) are already established. Keep their convention: input rows come from $E$ of shape $(V,d)$, and a tied output uses $E^\top$. The new concern here is how that shared parameter receives gradients and optimizer state.

$$
z_v=h\cdot E_v,\qquad
\nabla_E\mathcal{L}=\nabla_E\mathcal{L}_{\text{input path}}+\nabla_E\mathcal{L}_{\text{output path}}.
$$

Read the first expression as: candidate $v$'s score $z_v$ is the dot product of the normalized hidden vector $h$ and embedding row $E_v$. Read the second as: because both uses refer to the same parameter $E$, the loss gradient on that parameter adds the contributions through input lookup and output scoring. The path subscripts label contributions to the same loss, not separate objectives.

The input lookup sends gradients only to rows that appeared as input, apart from any other regularization. The full-softmax output path generally sends gradients to every vocabulary row. A rare token can therefore receive output-side updates even if it did not occur in this particular input batch. Sharing does not force the token's final contextual vector to equal its input embedding.

@fig train_tying | One stored `(32000, 512)` parameter supplies both input rows and output dot products. The backward pass adds both paths' contributions to the same gradient tensor.

Finch-24's tied total is 40,509,952. Untying adds $32,000\times512=16,384,000$, producing 56,893,952 unique parameters. In a full FP32 AdamW tensor ledger, that extra matrix also brings its gradient and two moment buffers, for $16\times16,384,000=262,144,000$ additional bytes, or 250 MiB. The tied embedding alone is 40.444383% of Finch-24's unique parameters.

### Tied and untied are architectural choices

| Property | Tied head | Untied head |
|---|---|---|
| Unique vocabulary matrices | One | Two |
| Input/output geometry | Shared | Independently learned |
| Finch-24 unique parameters | 40,509,952 | 56,893,952 |
| Gradient routes to embedding | Lookup and head | Lookup only |
| Head arithmetic | Dense projection | Dense projection |
| Checkpoint requirement | Restore aliasing | Restore separate weights |

Weight tying can reduce storage and influence generalization, but it constrains the model's input and output representation spaces. It is not universally better. Press and Wolf's work on output embeddings helped establish it for language models. The original Llama 3 8B has separate token embeddings and output weights, so its parameter count includes both vocabulary matrices. [Weight tying](https://arxiv.org/abs/1608.05859), [Llama 3's two parameter objects](https://github.com/meta-llama/llama3/blob/main/llama/model.py).

```python
embedding = torch.nn.Embedding(V, d)
head = torch.nn.Linear(d, V, bias=False)
head.weight = embedding.weight   # same Parameter, not a copied value
```

The assignment must happen before constructing the optimizer, and the optimizer must not receive duplicate references to the same parameter. Loading equal numeric matrices is insufficient if they become independent parameters afterward. A useful identity check is `head.weight is embedding.weight`.

:::note Tying and decay policy
If the policy excludes input embeddings from decay but decays output projections, a tied matrix belongs to both descriptions. Choose one policy for the shared parameter and deduplicate it by identity. There is no separate output copy on which to apply a contradictory setting.
:::

## 6. The complete decoder forward pass

Put our eight input IDs on a whiteboard. We can now follow their tensors without any missing "and then the model predicts" step. Use [the classic complete decoder](/octlm/attention/12-decoder-block/#s68) and [the finished modern block](/octlm/modern-arch/07-modern-block/#s35) for the architectural derivation. Here we retain the training shape trace and parameter references, rather than repeat the attention or SwiGLU explanation.

**A forward pass** is one evaluation of the model's operations with fixed current parameters. Token IDs select rows from the embedding. Each block applies RMSNorm, causal grouped-query attention with RoPE, and a residual addition; then RMSNorm, SwiGLU, and another residual addition. The final RMSNorm prepares the residual stream for the tied vocabulary projection.

$$
X^{(0)}=E[\mathrm{ids}],\quad
U^{(\ell)}=X^{(\ell)}+\operatorname{Attn}_{\ell}(\operatorname{Norm}_{a,\ell}(X^{(\ell)})),\quad
X^{(\ell+1)}=U^{(\ell)}+\operatorname{FFN}_{\ell}(\operatorname{Norm}_{f,\ell}(U^{(\ell)})).
$$

Read this as: the initial hidden tensor $X^{(0)}$ is the embedding lookup for the input IDs; block $\ell$ adds its attention update to make $U^{(\ell)}$, then adds its feed-forward update to make the next residual tensor $X^{(\ell+1)}$. The norms labeled $a$ and $f$ belong to the attention and FFN branches. Blocks have independent weights; sharing across positions does not mean sharing across depth.

| Operation | Example output shape | Unique parameters used |
|---|---|---|
| Input IDs | `(2, 8)` | None |
| Embedding lookup | `(2, 8, 512)` | 16,384,000 |
| Attention RMSNorm | `(2, 8, 512)` | 512 per block |
| Q projection | `(2, 8, 512)` | 262,144 per block |
| K and V projections | Each `(2, 8, 128)` | 65,536 each per block |
| Head reshape | Q `(2, 8, 8, 64)`; K/V `(2, 2, 8, 64)` | None |
| RoPE and causal GQA | `(2, 8, 8, 64)` | No extra learned positions |
| Merge and output projection | `(2, 8, 512)` | 262,144 per block |
| Attention residual addition | `(2, 8, 512)` | None |
| FFN RMSNorm | `(2, 8, 512)` | 512 per block |
| Gate and up | Each `(2, 8, 1536)` | 786,432 each per block |
| SiLU and product | `(2, 8, 1536)` | None |
| Down projection and addition | `(2, 8, 512)` | 786,432 per block |
| After all 8 blocks | `(2, 8, 512)` | 24,125,440 across blocks |
| Final RMSNorm | `(2, 8, 512)` | 512 |
| Tied head | `(2, 8, 32000)` | Reuses 16,384,000 |

The head-first reshape order in the table uses `(B, H, T, d_h)` for attention. The two consecutive eights in the query shape have different meanings. RoPE rotates queries and keys; it does not add a learned position table to the embedding. Normal training uses the complete causal sequence without a persistent generation KV cache.

@fig train_forward | Finch-24's complete forward pass preserves the token grid through the block stack, then changes the feature axis from 512 to the 32,000-token vocabulary.

### Parameter flow is not parameter movement

Each operation reads the parameter tensors that belong to it. The embedding and head read the same stored object, and each block reads its own projection and gain tensors. Activations flow between operations; weights do not get passed down the sequence as if they were tokens. No optimizer updates happen inside this forward pass. The graph records the dependencies needed to differentiate the eventual loss in Section 10.

Finch-24's unique count remains $16,384,000+8\times3,015,680+512=40,509,952$. A forward call in evaluation mode can still allocate gradients unless gradient recording is disabled. Conversely, disabling gradient recording does not automatically disable dropout. Those two switches control different behavior, which Part VI will use in validation.

:::interview Interview lens
**"Walk through a batch of two eight-token sequences and tell me where the vocabulary appears."** The IDs have shape `(2, 8)`, embeddings and residual tensors `(2, 8, 512)`, and each SwiGLU branch `(2, 8, 1536)`. Attention changes the dependency between positions, while the residual width stays 512. Only the final head changes the last axis to 32,000, giving `(2, 8, 32000)` next-token logits; tying reuses the embedding parameter but does not change those shapes.
:::

:::key In one breath
The last pre-norm residual addition is followed by a separate final normalization. The LM head maps each final width-$d$ token vector to $V$ logits, and softmax supplies probabilities when needed. Weight tying uses $E^\top$ for the head and adds both gradient routes to one parameter. Finch-24 maps `(2, 8)` IDs to `(2, 8, 32000)` logits with exactly 40,509,952 unique parameters.
:::

@part III | Giving the decoder something to learn | This part turns text into predictions with checkable answers. A wrong label shift or an unmasked future token can make a broken model look successful. We will build windows and batches, compute the token-weighted objective, and follow its derivatives back into shared parameters. | where:3

## 7. Building training examples

Take the illustrative token stream `[17, 23, 5, 81, 9, 44, 2, 7, 3]`. The model receives `[17, 23, 5, 81, 9, 44, 2, 7]` and should predict `[23, 5, 81, 9, 44, 2, 7, 3]`. Each answer is already present in the text. No person has to annotate these next-token labels.

A **corpus** is the collection of text chosen for learning. A **tokenized corpus** is that text represented as the tokenizer's IDs; the [tokenizer guide](/octlm/attention/01-tokenization/) explains how the IDs are constructed. A **context window** is a bounded contiguous sequence used as input. A **target** is the token ID that the loss asks a position to predict. For next-token learning, targets are shifted one position relative to inputs.

$$
x_t=s_{i+t},\qquad y_t=s_{i+t+1},\qquad 0\leq t<T.
$$

Read this as: for a corpus stream $s$, window start $i$, and input length $T$, input position $t$ reads stream token $i+t$, while its target reads the following token. The window needs $T+1$ source tokens to supply $T$ supervised positions. For a stream of length 20 and $T=8$, there are $20-8=12$ valid start positions, numbered 0 through 11. A start of 12 would lack the last target.

@fig train_shift | The illustrative nine-ID stream supplies eight inputs and eight next-token labels. Column arrows connect each input position to its answer; the last source token is a target even though it is not in the input window.

### Why all positions can train in parallel

The answers are known before the forward pass, so every position can receive the true prefix. This is **teacher forcing**, providing actual earlier tokens when training a sequence predictor. Parallel computation is valid because the [causal mask](/octlm/attention/08-causal-mask/) prevents the state at position $t$ from reading input positions beyond $t$. The target for that position is at $t+1$, which the mask hides. Batched matrix multiplies evaluate many separate causal dependencies at once.

Packing unrelated documents into one stream is a deliberate modeling choice. An EOS separator tells the model that one text ended, but it does not itself block attention between documents. If the intended objective conditions each document only on itself, reset the appropriate positions and use a document-boundary attention mask; also mask targets that would predict a different document's first token. If the objective is the concatenated stream, cross-boundary predictions are part of the objective. State which one you use.

A context window changes the conditioning available at its left edge. A token whose previous paragraph lies outside the window has less information than the same token evaluated with that paragraph. Document packing, EOS policy and context cropping therefore affect both the training objective and later evaluation. Dropping this detail can make equal "token counts" describe different tasks.

## 8. Batching and data loading

Our window is ready, but a GPU can usually process several windows together. Stack two eight-token inputs into an integer tensor `(2, 8)` and stack their targets in the same order. The batch must preserve which label belongs to which position, while selecting windows according to the experiment's data policy. A **microbatch** is the group processed in one forward and backward pass; several can contribute to one optimizer update.

The **data loader** selects examples, groups them, and supplies tensors to the model. Random starts sample windows from a long stream; shuffling examples visits a permutation of a dataset. Sampling with replacement can revisit some examples and skip others, whereas a full shuffled epoch visits each example once. An **epoch** is one complete pass through a finite dataset under that traversal policy. Large streaming runs may be tracked by tokens and updates rather than an epoch count.

```python
def sample_batch(tokens, B, T, generator):
    assert tokens.ndim == 1 and len(tokens) >= T + 1
    starts = torch.randint(len(tokens) - T, (B,), generator=generator)
    offsets = torch.arange(T + 1)
    rows = tokens[starts[:, None] + offsets]   # (B, T + 1)
    return rows[:, :-1], rows[:, 1:]           # each (B, T)
```

This sketch assumes a CPU token stream and CPU generator; move the resulting integer tensors to the model's device afterward. Token IDs must be in the model's vocabulary range, with a sufficiently wide storage dtype. Dataset ingestion should validate that once, rather than let a GPU embedding lookup discover corrupt IDs halfway through a run. Data-loader workers, pinned memory and asynchronous copies can improve supply rate, but correctness of labels and splits comes first.

@fig train_batch | Two illustrative length-eight rows become a `(2, 8)` input and target pair. Their 16 supervised positions form one microbatch; the same labels stay aligned through the model and loss.

### Train, validation, test and leakage

The **training split** supplies gradient updates. The **validation split** guides model selection and development choices. The **test split** is held for the final assessment after those choices are settled. **Data leakage** means information from an evaluation set enters learning or selection in a way that makes the reported assessment unfair. Exact duplicates, nearby overlapping windows, copied passages and related documents can all create leakage.

Split and deduplicate at the appropriate source level before drawing windows. Randomly assigning overlapping windows after tokenization can put almost the same passage on both sides. Group related documents, users or time periods according to the intended generalization claim. Train a learned tokenizer on the permitted training source, or disclose that a frozen external tokenizer has its own provenance. A split called "test" is no longer untouched if you repeatedly tune decisions on it.

For an illustrative collection of 1,000 documents, an 80%/10%/10% split gives 800 training, 100 validation and 100 test documents. This arithmetic does not prescribe the right proportions; near-duplicates can still cross such a split. Validation should use a stable declared set and evaluation policy, not a newly sampled easy batch every time.

@fig train_split_leak | Split documents before producing overlapping windows. The orange boundary prevents windows from the same source from becoming both learning examples and apparent evidence of generalization.

:::story Picture this
You practice an exam using one set of questions and evaluate yourself using another. Moving nearly identical rewordings into the second pile does not create an independent test. Source-level grouping is how a corpus split avoids that same mistake.
:::

## 9. Cross-entropy during training

The model assigns the correct next token a probability of 0.25. That prediction should incur more loss than probability 0.5, and a confidently wrong prediction should incur much more. The [earlier cross-entropy introduction](/octlm/attention/13-optimization/#s70) explains the negative-log penalty; here we need its tensor mechanics and exact averaging rule.

**Cross-entropy** for a one-hot next-token target is the negative natural logarithm of that token's model probability. It is also the per-token **negative log-likelihood**, or NLL. A **nat** is an information unit using the natural logarithm. Minimizing the sum of these losses maximizes the assigned probability of the observed sequence under its declared conditioning contexts.

$$
\ell_{b,t}=\operatorname{logsumexp}_{v}(Z_{b,t,v})-Z_{b,t,y_{b,t}},\qquad
\mathcal L=\frac{\sum_{b,t}m_{b,t}\ell_{b,t}}{\sum_{b,t}m_{b,t}}.
$$

Read this as: at batch row $b$ and time $t$, take the log of the summed exponentials of the vocabulary logits $Z$, then subtract the correct target logit. Average these losses only over positions whose validity indicator $m_{b,t}$ equals one. The denominator counts supervised tokens. **Log-sum-exp** is the log of a sum of exponentials, evaluated by subtracting the largest input before exponentiating and adding it back afterward.

For illustrative logits $[2,1,0]$ with target A, log-sum-exp is $2+\ln(1+e^{-1}+e^{-2})=2.407606$, so loss is 0.407606. The correct probability is 0.665241, and $-\ln(0.665241)$ gives the same rounded loss. No sampled output token is needed to compute this objective.

With correct probabilities $[0.5,0.25,0.125,0.125]$, individual losses are $[0.693147,1.386294,2.079442,2.079442]$. Their sum is 6.238325 and mean is 1.559581 nats per token. Lower mean loss means the geometric mean of the correct-token probabilities is higher. It does not imply that every token improved, that top-1 accuracy improved, or that a factual answer is correct.

@fig train_loss_reduction | Four illustrative correct-token probabilities become four losses and one mean. Loss aggregates all supervised positions, not only the last token and not the sampled prediction.

```python
logits = model(x)                              # (B, T, V)
loss = F.cross_entropy(
    logits.float().reshape(-1, V),             # (B*T, V)
    y.reshape(-1),                            # (B*T,), integer IDs
    ignore_index=-100,
)
```

For an unweighted index-target loss, `ignore_index` removes those labels from both sum and mean denominator. It does not remove them from attention: padding or document isolation needs a separate attention mask. If every label is ignored, there is no defined token mean; reject or skip that batch deliberately. Label smoothing and class weighting change the objective and denominator, so their losses should not be silently reported as plain corpus NLL. [PyTorch's loss contract](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html).

A uniform vocabulary distribution gives $\ln 32,000=10.373491$ nats for Finch-24. This is a mathematical reference, not a guaranteed initialization loss: random logit variance, weight tying and input-target correlations can change the starting value. Investigate surprising values, but do not diagnose a bug from that baseline alone.

@fig train_nll_curve | Correct-token probability maps to negative log-likelihood. The curve and marked points are computed; small probabilities produce much larger penalties.

## 10. Backpropagation through the language model

The loss is a scalar, but Finch-24 has 40,509,952 parameters. Re-running the forward computation after separately perturbing every parameter would be an impractical way to find all its slopes. A single reverse traversal uses the operations' local derivative rules instead.

The [gradient introduction](/octlm/attention/13-optimization/#s71) describes the downhill direction. A **computational graph** records which values depend on which operations and parameters. **Backpropagation** traverses that graph backward, using the chain rule to combine local derivatives. A **gradient** is the collection of derivatives of the scalar loss with respect to a tensor's entries. It has the same shape as that tensor, so a projection weight receives a projection-shaped correction, not one scalar per layer.

For a softmax cross-entropy row with one-hot target vector $q$:

$$
\frac{\partial\ell}{\partial z_v}=p_v-q_v.
$$

Read this as: the loss derivative for candidate $v$'s logit $z_v$ is its predicted probability $p_v$ minus its target indicator $q_v$. With logits $[2,1,0]$ and target A, it is $[-0.334759,0.244728,0.090031]$. The correct logit receives a negative derivative, so descending the loss raises it; competing logits receive positive derivatives. These derivatives sum to zero because a common shift in all logits leaves the loss unchanged.

### A full scalar calculation

Use an illustrative binary head $z=wx$, with $w=0.5$, $x=2$ and target class one. The logit is 1, its sigmoid probability is 0.731059, and its loss is 0.313262. The derivative with respect to the logit is $0.731059-1=-0.268941$. Multiplying by $\partial z/\partial w=x=2$ gives the weight derivative $-0.537883$. An illustrative gradient-descent step of size 0.1 changes $w$ to $0.5-0.1(-0.537883)=0.553788$.

@fig train_backprop | One illustrative binary prediction traced through its value and derivative. The backward route multiplies local derivatives; it does not guess a separate perturbation for every parameter.

### Branches, residuals and accumulation

At an addition, the incoming derivative goes to both operands. At a shared value, contributions from all dependent uses add. At a residual block $x+f(x)$, the derivative includes the identity route and the route through $f$; the branch does not erase the identity contribution. The [residual-stream chapter](/octlm/attention/12-decoder-block/#s65) explains why that path helps depth. It is not a promise that gradients can never vanish or explode.

**Gradient accumulation** can mean these mathematical sums through a graph, or the training technique of summing gradients over several microbatches before an update. PyTorch accumulates into `.grad` by default. For four equal-size microbatches, divide each mean loss by four before backward to get the gradient of their combined token mean. With our `B=2, T=8`, the update then uses eight sequences and 64 supervised tokens. Different valid-token counts require weighting by those counts, not an equal average of microbatch means. With illustrative microbatch means of 2 and 4 over 2 and 6 valid tokens, the correct mean is $(2\times2+6\times4)/8=3.5$, not $(2+4)/2=3$.

@fig train_token_weighting | Two illustrative microbatches show why averaging their means gives the wrong token objective. The weighted mean is 3.5 nats per token.

The graph needs forward intermediates to compute backward. Detaching a tensor, converting the loss to a Python number, or running the forward pass under `no_grad` breaks derivative paths. Keep the tensor loss for backward. `loss.item()` can log its value before or after backward, but a Python number cannot supply backward. A loss gradient also does not perform an optimizer step by itself; Section 11 separates computing a correction from applying it.

:::note Discrete IDs and differentiable weights
Integer token IDs do not receive gradients. The embedding values selected by them do. Sampling a token is also a discrete operation; standard next-token pretraining differentiates the logits and loss directly, without differentiating through the sampled token.
:::

:::warn Watch out
Do not shift labels twice. Some model APIs accept input IDs and internally construct next-token labels; other APIs return raw aligned logits and expect already-shifted targets. Inspect the contract. A correct shape can still hide the wrong task, and a missing causal mask can reveal the very target being scored.
:::

:::interview Interview lens
**"How can a causal model learn from all positions in one pass without cheating?"** The batch supplies actual prefixes and their shifted next-token answers. Causal attention hides future input positions, so each state can use its prefix but cannot read its own target. The loss combines every valid position, and reverse-mode differentiation adds their contributions into shared weights; padding and document boundaries need their own declared masks.
:::

:::key In one breath
A length-$T$ training example uses $T+1$ source tokens to make inputs and one-position-shifted targets. Split sources before sampling windows, and keep causal, padding and label masks conceptually separate. Cross-entropy is stable log-sum-exp minus the target logit, averaged over valid target tokens. Backpropagation sends $p-q$ through the graph, adds shared contributions, and accumulation must preserve the intended token-weighted mean.
:::

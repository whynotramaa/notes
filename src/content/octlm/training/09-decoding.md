@part IX | Turning predictions into text | This part uses a fixed trained predictor to choose a continuation. Likelihood defines a distribution, but generation still needs a selection rule and a stopping contract. We will compare teacher forcing with autoregressive use, then trace greedy choice, temperature, top-k, sampling and termination. | where:9

## 27. From training to inference

During training, the entire input row is already known. During generation, the next token is precisely what we do not know. That small difference changes which work can run in parallel: training scores supplied positions together, while ordinary generation must choose a token before that token can become the next input.

**Inference** evaluates a learned model without updating its parameters. Teacher forcing uses the observed earlier tokens as the context for each supervised prediction, as Section 7's shifted examples already do. **Autoregressive generation** feeds the chosen output back into the context and repeats. The [first chapter's next-token loop](/octlm/attention/01-tokenization/#s1) introduces this behavior; the training consequences are our focus here.

For Finch-24, a training input of shape `(2, 8)` produces logits `(2, 8, 32000)` and compares all 16 positions with the shifted labels. Generation from a prompt of eight tokens can produce the same full logit tensor initially, but only its last-position distribution chooses the first new token. That chosen token then participates in the next forward step. Earlier prompt logits answer predictions inside the prompt; they are not separate alternative futures to sample simultaneously.

@fig train_teacher_forcing | Illustrative training uses supplied prefix tokens at every position; generation feeds its own chosen token into the next context. Orange marks the context element whose source changes.

### Fixed weights and a changing context

Use evaluation mode and disabled gradient recording, as Section 20 explains. No optimizer moments or backward graph are needed for ordinary generation. Prompt processing is called **prefill**, and subsequent next-token steps are called **decode**. A **KV cache** stores earlier attention keys and values so fixed-weight decoding can reuse them; the [previous cache chapter](/octlm/attention/11-kv-cache/#s59) provides the mechanism and position rules.

Without a cache, an illustrative implementation can rerun the whole available prefix and still choose the correct next token for that context. With a correct cache, it computes only the new query and new keys/values at each layer, while attending to accumulated earlier keys/values. The LM head can project only the last hidden state when no earlier logits are requested. For Finch-24 with batch 1, that is `(1, 512)` to `(1, 32000)` rather than projecting every prompt position.

A BF16 Finch-24 cache for one sequence stores $2\times8\times2\times64\times2=4{,}096$ bytes per cached position: two K/V tensors, eight layers, two KV heads, 64 components and two bytes per value. Eight positions cost 32,768 bytes. That count excludes metadata, padding and allocator policy. GQA's query-head count does not multiply these KV tensors.

@fig train_decode_steps | Three illustrative generation steps extend the same prefix one selected token at a time. Each new logit row depends on the token chosen at the preceding step.

### Contexts the model creates itself

Teacher forcing evaluates conditionals under real prefixes. Generation visits prefixes selected by the model and the decoder, including its own errors. One odd choice can change every later conditional. This **exposure mismatch** helps explain why good held-out next-token loss does not guarantee coherent long continuations, but it does not make teacher forcing an incorrect likelihood objective: the data sequence's joint likelihood factorizes through those observed prefixes.

Parallel teacher-forced evaluation can score a known complete continuation. It cannot choose an unknown ordinary autoregressive continuation in a single standard decoder pass. Methods such as speculative decoding can reduce wall-clock dependence using draft proposals and verification; they require extra machinery beyond the basic generation loop. The next chapter, [Inference Engineering](/octlm/inference/), treats serving as its own problem.

## 28. Greedy decoding

Our illustrative vocabulary has logits `[2, 1, 0]`. The first token has the highest score. Choosing it requires neither a softmax nor a random draw, because softmax preserves logit order. This is **greedy decoding**: select the highest-scoring available token at each step.

$$
x_{t+1}=\operatorname*{arg\,max}_{v\in\{0,\ldots,V-1\}}z_{t,v}.
$$
Read this as choosing vocabulary ID $v$ whose logit $z_{t,v}$ is largest after prefix position $t$; $V$ is vocabulary size and $x_{t+1}$ is the chosen next token. Ties require an implementation's tie policy. A logit processor can change which IDs are available, so an argmax after processing is greedy for that modified score vector.

With fixed model outputs and tie behavior, greedy decoding is deterministic. It is convenient for debugging and repeatable comparisons, and it avoids sampling low-probability alternatives. Those advantages do not imply that it gives the best answer for every task. Minor numerical changes across kernels can also alter an argmax near a tie.

### Local choice is not a sequence optimum

Suppose first-token probabilities are $p(A)=0.6$ and $p(B)=0.4$. After $A$, the largest second-token probability is 0.5; after $B$, it is 0.99. Greedy starts with $A$ and achieves a best two-token joint probability of $0.6\times0.5=0.3$. The path through $B$ reaches $0.4\times0.99=0.396$. A locally better first token did not yield the highest-probability complete two-token sequence.

@fig train_greedy_tree | Illustrative two-step probabilities give greedy path A a joint probability of 0.3, while B followed by its best continuation reaches 0.396. Greedy makes a local decision.

Greedy generation can produce repetitive or predictable text because selecting the same locally strong continuation can repeatedly enter similar contexts. It does not always repeat, and sampling does not guarantee an escape. Data, training quality, prompt and stopping policy matter too. Holtzman and colleagues analyzed this decoding problem in [*The Curious Case of Neural Text Degeneration*](https://arxiv.org/abs/1904.09751), motivating alternatives to repeatedly maximizing a token score.

## 29. Temperature sampling

Keep the logits `[2, 1, 0]`, but divide them by 0.5 before softmax. Their gaps double, and the highest token receives more probability. Divide them by 2 instead, and the gaps shrink. We have changed the distribution's concentration without retraining the model.

**Temperature** is a positive scalar $\tau$ that rescales logits before probability normalization. It controls relative logit gaps, not the vocabulary or the model's learned knowledge. Low positive temperatures concentrate probability on higher logits; high temperatures flatten the distribution over finite available logits. They preserve ranking.

$$
p_\tau(v)=\frac{\exp(z_v/\tau)}{\sum_u\exp(z_u/\tau)}.
$$
Read this as exponentiating each temperature-scaled logit $z_v$ and normalizing across available vocabulary IDs $u$; $p_\tau(v)$ is the sampling probability and $\tau>0$ is temperature. A stable implementation subtracts the maximum scaled logit before exponentiation. Negative-infinity masks remain excluded.

| Temperature | Probability of ID 0 | ID 1 | ID 2 |
|---|---|---|---|
| 0.5 | 0.866813 | 0.117310 | 0.015876 |
| 1 | 0.665241 | 0.244728 | 0.090031 |
| 2 | 0.506480 | 0.307196 | 0.186324 |

These probabilities were computed from the same logits. Temperature 1 preserves the model's normalized distribution. The limit as temperature tends to zero concentrates on the maximum-logit set; an exact zero value is normally implemented as a separate greedy branch, because division by zero is invalid. If several logits tie for the maximum, the limiting softmax shares mass among them, while an argmax tie policy may choose one ID.

@fig train_temperature_bars | Computed distributions for logits `[2, 1, 0]` share the same rank but different concentration. Orange marks ID 0, making its mass shift visible as temperature changes.

As temperature tends to infinity, finite unmasked logits approach a uniform distribution. For a large vocabulary, flattening too much gives substantial probability to poor continuations. “Higher temperature means more creative” is an informal observation about some outputs, not a guaranteed relation to quality. Temperature changes selection randomness; it cannot add facts or reasoning capabilities missing from the trained predictor.

## 30. Top-k sampling

A temperature-adjusted distribution can still include many undesirable alternatives in its tail. Keep only its two largest logits in our three-token example. The candidate set now contains IDs 0 and 1, while ID 2 has zero sampling probability. This is **top-k sampling**: truncate to a fixed number of highest-scoring IDs and renormalize.

$$
q(v)=\frac{p(v)\,\mathbf1[v\in K]}{\sum_{u\in K}p(u)}.
$$
Read this as preserving probability $p(v)$ only when token $v$ belongs to selected set $K$ of size $k$, then dividing by the probability mass retained in that set. The indicator $\mathbf1$ is 1 for a retained ID and 0 otherwise. The resulting $q$ sums to 1 across the retained candidates.

At temperature 1, IDs 0 and 1 originally have probabilities 0.665241 and 0.244728. Their combined mass is 0.909969. Dividing by it gives 0.731059 and 0.268941; ID 2 receives zero. Applying softmax to just their logits `[2, 1]` gives the same retained distribution. There is no need to compute a full softmax before truncating logits.

@fig train_topk_bars | Top-2 truncation removes ID 2 and renormalizes the retained mass. Computed values show ID 0 rising from 0.665241 to 0.731059 after truncation.

With $k=1$, the rule becomes a single-candidate choice. With $k=V$, it leaves the distribution untruncated. A small $k$ restricts diversity; a large $k$ retains more tail candidates. Positive temperature leaves ranking unchanged, so the same top-k set is selected before or after its scaling when ties are handled identically, but the sampling probabilities still depend on temperature.

### Exact candidates and tied scores

Select the top-k indices and sample within that compact tensor. A threshold mask such as `logits < kth_score` can keep more than $k$ IDs when scores tie at the boundary. That may be an intentional policy, but it is not an exact-k guarantee. Gathered indices make the candidate-count contract explicit. Validate $1\le k\le V$ and reject an empty or nonfinite distribution.

:::note Nucleus sampling
Top-p, or nucleus sampling, chooses a candidate set by retained probability mass instead of a fixed count. It can retain few IDs when the distribution is concentrated and many when it is diffuse. This is a useful modern alternative, but the required outline's worked decoder here uses temperature and exact top-k; neither truncation rule is a training objective.
:::

## 31. Multinomial sampling

At temperature 1 without truncation, our three probabilities have cumulative boundaries 0.665241, 0.909969 and 1. A uniform draw of 0.2 lands in ID 0's interval; 0.8 lands in ID 1's interval; 0.95 lands in ID 2's interval. Probability has become a concrete next-token choice.

**Categorical sampling** draws one ID from a discrete distribution. PyTorch exposes this operation through `torch.multinomial`; the **multinomial distribution** describes category counts across repeated draws. For a language-model step, we request one draw per unfinished sequence, then recompute its next distribution after extending the prefix. We do not draw an entire dependent continuation from one unchanged distribution.

@fig train_sampling_intervals | Computed interval widths are the probabilities for logits `[2, 1, 0]`. Three illustrative uniform draws select IDs 0, 1 and 2; real sampling draws are pseudorandom.

This helper receives finite FP32-representable last-position logits of shape `(B, V)`, an optional exact candidate count, and a generator on the matching device. It returns chosen IDs of shape `(B, 1)`. `temperature=0` explicitly requests the greedy branch. `torch.multinomial` accepts nonnegative finite weights with a positive row sum, as its [API contract](https://docs.pytorch.org/docs/stable/generated/torch.multinomial.html) states; a normalized softmax is a convenient way to provide them.

```python
def pick_token(last, temperature, k, generator):
    assert temperature >= 0 and math.isfinite(temperature)
    assert torch.isfinite(last).all()          # (B, V)
    if temperature == 0:
        return last.argmax(-1, keepdim=True)
    assert torch.finfo(torch.float32).tiny <= temperature <= torch.finfo(torch.float32).max
    scores = last.double()
    assert torch.isfinite(scores.float()).all()
    scores = ((scores - scores.amax(-1, keepdim=True)) / temperature).float()
    if k is not None:
        assert 1 <= k <= scores.size(-1)
        scores, ids = scores.topk(k, dim=-1)
    probs = scores.softmax(-1)
    selected = torch.multinomial(probs, 1, generator=generator)
    return selected if k is None else ids.gather(-1, selected)
```

The helper restricts positive temperatures to the normal FP32 range, because an even smaller Python scalar could round to zero in an FP32 tensor path. It forms the centered logit gaps and temperature division in FP64 before casting to FP32: subtracting opposite large finite FP32 values can otherwise overflow before a large temperature makes the gap small again. This explicit teaching path favors its stated numerical contract over the fastest sampling implementation; a production FP32 path can instead enforce narrower logit and temperature bounds. Extremely negative scaled scores may become negative infinity after the final cast, yielding zero probability while the maximum remains zero. If other processors already introduced negative infinities, replace the all-finite input contract with a check that each row retains at least one finite valid candidate.

### Randomness and reproducibility

Give generation a separate generator so drawing text does not alter later training samples. Save that generator state if resuming the same generation stream matters. Equal seeds under the same execution contract can reproduce draws, but different devices, implementations, batch order or probability values may change the result. A tiny probability change can move a cumulative boundary past the same random draw.

Sampling supports diversity because repeated calls can take different permitted paths. It is still conditioned by the model's probabilities, truncation and temperature. Stochastic output is not evidence of a stochastic training update at inference time: the parameters stay fixed. To compare model quality rather than one lucky sample, keep prompts and decoding settings fixed and evaluate an appropriate collection of outputs.

## 32. Stopping generation

A generator that keeps appending tokens forever has no usable output contract. A model may emit an end marker, but it may also repeat or continue beyond the caller's budget. Stopping requires explicit conditions that the caller can enforce.

An **EOS token**, meaning end of sequence, is an ID trained to indicate a boundary. A **maximum new-token limit** caps appended tokens independently of prompt length. A **stop sequence** is a declared token sequence or decoded-text pattern that ends a response. These controls have different meanings: reaching a length cap does not mean the model decided its answer was complete.

@fig train_stop_controls | Three separate termination conditions stop the same illustrative stream: a learned EOS marker, a caller's new-token cap, or a matched stop pattern. Orange marks the reason termination occurred.

Here is an intentionally uncached single-sequence loop that uses the helper above. It requires a nonempty prompt, a nonnegative new-token budget, and enough context capacity to keep the entire resulting sequence. `eos_ids` is a set of accepted stop IDs, and `model(ids)` returns the raw full sequence logits. This code explains the control flow, not an efficient serving implementation.

```python
assert ids.ndim == 2 and ids.size(0) == 1 and ids.size(1) > 0
assert max_new_tokens >= 0 and ids.size(1) + max_new_tokens <= context_limit
model.eval()
with torch.inference_mode():
    for _ in range(max_new_tokens):
        logits = model(ids)                   # (1, current_T, V)
        token = pick_token(logits[:, -1, :], temperature, k, gen)
        ids = torch.cat((ids, token), dim=1)
        if token.item() in eos_ids:
            break
```

A checkpoint's tokenizer and generation configuration determine the meaningful EOS IDs. Some instruction-tuned systems distinguish end-of-turn and end-of-document markers; use the checkpoint's documented contract rather than inventing an ID. The [generation configuration documentation](https://huggingface.co/docs/transformers/main_classes/text_generation) distinguishes new-token limits, total-length limits and stop strings. These are external decoder settings, not new learned weights.

### Stop strings, batches and repetition

A stop string can cross token boundaries, and incremental UTF-8 decoding can cross byte boundaries too. Check the accumulated decoded suffix with the tokenizer's decoding contract or use a token-aware matcher that preserves enough history. Do not assume a textual marker is always one token. Decide whether the stop marker itself appears in the returned text.

For a batch, maintain a finished mask and stop when all rows are finished or the shared limit is reached. Finished rows must not continue contributing ordinary output tokens; padding or cache positions need a consistent policy. If only one row has EOS, breaking the entire batch truncates other replies. Our single-row loop avoids that complication, but does not solve it for a batch.

**Degenerate generation** is output that becomes repetitive, incoherent or otherwise collapses into an unhelpful pattern under the chosen model and decoder. A repeated phrase can signal a weak model, a misleading prompt, a cache/position bug, excessive concentration or a poor stopping contract. Repetition penalties and n-gram bans change the distribution and can suppress legitimate repeated material; they are controls to evaluate, not universal repairs. A hard maximum always limits cost even if quality fails.

:::warn Watch out
Training label alignment and generation position selection are separate contracts. Training uses every supervised logit row; a non-padded prompt's last row supplies the next-token distribution for generation. With right-padded batches, the tensor's last column may be padding rather than the final real token, so gather the correct row or use a padding convention supported by the implementation.
:::

:::interview Interview lens
**"Explain temperature, top-k and multinomial sampling in the order you would implement them."** I would get the last valid position's logits, handle a zero-temperature greedy request separately, and scale finite logits by a positive temperature. I would select the exact top-k candidates if requested, normalize them, sample one category per unfinished sequence, and map compact candidate indices back to vocabulary IDs. I would then append the token, update any cache consistently and enforce EOS, stop-pattern and new-token-limit policies.
:::

:::key In one breath
Teacher forcing scores known prefixes in parallel; ordinary autoregressive generation chooses a token before using it as context. Greedy takes a local argmax, temperature changes concentration, top-k removes candidates, and multinomial sampling makes a categorical draw. Fixed weights do not mean fixed output when the decoder samples. Generation also requires valid positions, compatible tokenizer markers, reproducible random-state policy and an explicit termination budget.
:::

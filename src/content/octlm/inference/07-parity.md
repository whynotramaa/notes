@part VII | Proving the Implementation Is Correct | Our Qwen3 loads and talks. That proves almost nothing: a model with a subtle bug usually still talks. This part replaces "it looks right" with a measurement: run the same tokens through our model and through a trusted reference, compare the raw numbers, and when they disagree, find the first layer where they part ways. It ends with how close is close enough, and why that answer depends on the number format. | where:7

## 35. Why Good-Looking Text Is Not Enough

Load Qwen3-0.6B with RoPE's pairing convention swapped, interleaved instead of half-split, and ask it for the capital of France. There is a fair chance it still says Paris. Language models are strongly redundant: a short prompt carries enough signal through 28 layers that a damaged position encoding, a slightly wrong epsilon or one mis-mapped head often leaves the top answer unchanged. The damage shows up later, on long prompts, hard questions or benchmarks, as a model that is "a bit worse than the paper said".

**Plausible output can hide implementation bugs** because fluency is the skill the model learned most thoroughly, and the last one to break. Three things make eyeballing hopeless. **Sampling introduces randomness**: two runs of a correct model differ, so a difference between yours and the reference proves nothing. **Small numerical errors compound**: an error in layer 3 is carried by the residual stream through 25 more layers, and in generation one changed token changes every token after it. And a wrong model and a right one can produce identical text for dozens of prompts and then diverge on the next.

So we **need deterministic validation**: the same inputs, no randomness, a reference we trust, and a numerical comparison with a threshold decided in advance.

@fig inf_fluent_bug | Two models answer the same short prompt fluently. One has the RoPE pairing convention swapped. Only the numbers underneath, compared position by position, tell them apart. (Illustrative.)

:::story Picture this
A bank teller who counts cash by eye will be right on most days. A shortfall of one note in a thick bundle looks exactly like a full bundle. That is why banks count by machine against a ledger, every time, and investigate any difference rather than any bundle that "looks thin". Parity testing is counting against the ledger.
:::

## 36. Reference Implementation

A **reference implementation** is a second, trusted way to compute the same function. For Qwen3 the obvious one is Hugging Face's `transformers` implementation, which the Qwen team contributed and which produced the published results. The comparison is only meaningful if everything except the code under test is held identical.

**Same checkpoint**: both models load the identical `model.safetensors`, not two downloads of possibly different revisions. **Same tokenizer** and **same input tokens**: tokenize once and feed both models the same tensor of IDs, so tokenization differences cannot hide in the comparison (Part VIII tests the tokenizer separately). **Same dtype where possible**: for the tightest comparison run both in fp32, where rounding noise is tiny; then repeat in bf16 with a looser tolerance. And the **reference Hugging Face model** should use its simplest attention path (`attn_implementation="eager"`) so a kernel choice is not a variable.

```python
ref = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen3-0.6B", torch_dtype=torch.float32, attn_implementation="eager").eval()
ours = load_ours("model.safetensors", dtype=torch.float32).eval()
ids = torch.tensor([prompt_ids])                       # (1, 26), tokenized once
with torch.inference_mode():
    a = ref(ids).logits                                # (1, 26, 151936)
    b = ours(ids)                                      # (1, 26, 151936)
```

@fig inf_parity_harness | The parity setup. One file of weights, one tensor of token IDs, two implementations, one comparison. Everything that is not the code under test is shared.

## 37. Logit Parity

**Logit parity** means our model's raw logits match the reference's within a stated tolerance. **Compare raw logits**, not probabilities or text: logits are the last numbers before any nonlinearity hides the difference. For the 26-token prompt, each model produces $26 \times 151{,}936 = 3{,}950{,}336$ logits, and we want a few numbers that sum up their difference, each catching a different failure.

The **maximum absolute difference**, $\max_i |a_i - b_i|$, catches any single badly wrong value, and is the main pass/fail number. The **mean absolute difference** tells you whether the error is everywhere (a systematic bug, or a dtype difference) or concentrated in a few places. The **relative error**, $|a_i - b_i| / |a_i|$, puts differences on the scale of the values, though it explodes for logits near zero, so use it with care. **Same argmax token** checks that both models would pick the same next token at every position. And **position-by-position comparison**, the maximum difference per position rather than over the whole tensor, shows where in the sequence the error lives, which points straight at position bugs.

### With numbers

Take five logits at one position (illustrative values, chosen to look like a bf16 reference and an fp32 reimplementation). Reference $[14.8125, 13.9375, 9.25, -2.125, 7.6875]$; ours $[14.8130, 13.9361, 9.2503, -2.1243, 7.6890]$. The absolute differences are $0.0005, 0.0014, 0.0003, 0.0007, 0.0015$: maximum 0.0015, mean 0.00088. The largest relative error is 0.00033. Both argmaxes are the first token, and the margin between first and second is 0.875 logits, far larger than any difference, so the agreement is not luck. Through softmax, the probabilities move from $0.70348$ and $0.29325$ to $0.70387$ and $0.29286$, and the KL divergence between the two distributions is $3.7 \times 10^{-7}$.

@fig inf_logit_diff | The five illustrative logits from the two implementations, side by side, with their differences magnified a thousand times below. The top token and the margin are what generation depends on.

```python
d = (a - b).abs()                                   # (1, 26, 151936)
print("max", d.max().item(), "mean", d.mean().item())
print("per position", d.amax(-1).squeeze(0))        # (26,)
print("argmax equal", (a.argmax(-1) == b.argmax(-1)).all().item())
```

The per-position line is the one to look at first. A healthy implementation has differences of similar size at every position. A difference that is zero at position 0 and grows with position is the signature of a RoPE or position bug, because position 0 is not rotated at all. A difference that appears only at the last position points at the LM head or final norm path.

@fig inf_position_diff | Maximum logit difference by position, three illustrative cases. Flat and tiny: healthy. Zero at position 0 and growing: a RoPE or position bug. Large everywhere: a weight or layer bug.

## 38. Layer-Level Debugging

When logit parity fails, the logits only tell you that something is wrong, not where. **Layer-level debugging** finds the first point at which the two models disagree. Both models compute the same sequence of intermediate tensors, so capture them in both and compare in order: the first mismatch is downstream of the bug and upstream of everything else.

The checkpoints, in the order data flows, are the **embedding output**, the hidden state **after normalization**, the **Q/K/V tensors** (before and after the QK norm and RoPE), the **attention output** (before and after `o_proj`), the **residual stream** after the attention add, the **FFN output**, the residual after the MLP add, and so on through the layers to the **final hidden state** after the last norm, and the **LM logits**.

```python
acts = {}
def keep(name):
    return lambda mod, inp, out: acts.setdefault(name, out.detach().float())
for i, layer in enumerate(ref.model.layers):
    layer.self_attn.q_proj.register_forward_hook(keep(f"ref.{i}.q"))
    layer.mlp.register_forward_hook(keep(f"ref.{i}.mlp"))
# same names on our model, then compare in data-flow order:
for name in order:
    diff = (acts["ref." + name] - acts["ours." + name]).abs().max()
    print(f"{name:12s} {diff:.2e}")
```

Forward hooks capture a module's output without changing its code. For intermediate values that are not module outputs, such as $q$ after RoPE, add a temporary line that stores them in both implementations. Compare in the order of computation and stop at the first tensor whose difference jumps by orders of magnitude.

@fig inf_layer_bisect | Bisecting a parity failure. Differences stay at rounding level through the embedding, norm and projections, then jump at q after RoPE: the bug is in the rotation, and everything after it is a consequence.

A useful trick is to compare on a tiny input first: one sequence of 4 or 5 tokens. Tensors are small enough to print and inspect by eye, and position-dependent bugs still show (they need at least two positions).

## 39. Common Sources of Parity Failure

Most porting bugs come from a short list, and each has a place in the data flow where it first shows. The table is the order to check them in when Section 38's bisection points at a stage.

| Bug | First diverges at | Signature |
|---|---|---|
| **Wrong RoPE implementation** (interleaved vs half-split, wrong base) | q, k after RoPE | zero at position 0, grows with position |
| **Wrong position IDs** | q, k after RoPE | fine in prefill, wrong in decode (Section 8) |
| **Q/K/V shape errors** (`head_dim` from width, view order) | q, k, v | usually a crash; sometimes a silent reshape |
| **Head ordering** | attention output | `view(B, H, T, d)` instead of `view(B, T, H, d).transpose` |
| **GQA replication mistakes** | attention output | `.repeat` instead of `repeat_interleave` |
| **Incorrect normalization epsilon** | after norm | tiny, larger for small-norm inputs |
| **Incorrect weight transpose** | that projection | square matrices load silently (Section 32) |
| **Wrong activation** (GELU for SiLU) | FFN output | everywhere, moderate |
| **Wrong causal mask** | attention output | position 0 fine, later positions see the future |
| **Dtype differences** | everywhere, slightly | uniform small noise, no pattern by position |

Two of these deserve a picture. The **head ordering** bug comes from reshaping a $(B, T, H \cdot d_h)$ projection into heads. The correct move is `view(B, T, H, d_h).transpose(1, 2)`: split each token's 2,048 numbers into 16 consecutive chunks of 128, one per head. Writing `view(B, H, T, d_h)` directly produces the same shape, but it takes the flat memory in the wrong order, so each "head" receives a mix of different tokens' features. Nothing crashes.

@fig inf_head_order | Splitting a projection into heads. The correct view cuts each token's row into 16 consecutive 128-wide chunks. Viewing straight to (B, H, T, d) has the same shape but scrambles tokens and heads together.

The **epsilon** bug is a good example of a bug that hides in typical inputs. RMSNorm divides by $\sqrt{\text{mean}(x^2) + \varepsilon}$. For an input $[3 \times 10^{-3}, -4 \times 10^{-3}]$, the mean square is $1.25 \times 10^{-5}$. With Qwen3's $\varepsilon = 10^{-6}$ the output is $[0.8165, -1.0887]$; with $\varepsilon = 10^{-5}$, a common default, it is $[0.6325, -0.8433]$, more than a fifth smaller. For a typical hidden state with entries near 1, the same mistake changes the output in the sixth decimal place. The bug is invisible on most tokens and large on a few.

:::warn Watch out
Fix the first divergence, then rerun from the top. Several bugs often coexist, and the second one is invisible until the first is fixed, because everything downstream of the first was already wrong. Bisection finds one bug at a time.
:::

## 40. Numerical Tolerance

### Exact equality vs approximate equality

Two correct implementations almost never produce identical numbers, so **exact equality** is the wrong test, and **approximate equality** needs a threshold. The reason is **floating-point rounding**. Every addition rounds to the nearest representable number, and the rounding depends on the order of the additions. In fp32, the spacing between representable numbers near $10^8$ is 8, so $10^8 + 1$ rounds back to $10^8$. Then $(10^8 + 1) - 10^8 = 0$, while $(10^8 - 10^8) + 1 = 1$. The same three numbers, added in two orders, give two answers. A matmul sums 1,024 products, and different kernels sum them in different orders, in different tile shapes, with different fused operations. Both answers are correct to within rounding; neither is "the" answer.

@fig inf_tolerance_bands | Representable values near a logit of 12 in three formats. In fp32 they are a millionth apart, in fp16 0.0078 apart, in bf16 0.0625 apart, so a bf16 logit can only be 11.9375, 12 or 12.0625 in this range.

### FP32 vs BF16/FP16

The format sets the scale of the noise. Near a logit of 12, neighbouring values are $9.5 \times 10^{-7}$ apart in fp32, 0.0078 in fp16 and 0.0625 in bf16. A bf16 computation rounds every intermediate value through 28 layers at that coarseness, so two correct bf16 implementations can easily differ by a few bf16 steps in the logits. Comparing a bf16 model against an fp32 reference mixes both kinds of difference, which is why the tightest test runs both in fp32 first.

### Choosing meaningful tolerances

A tolerance should be large enough to pass every correct implementation and small enough to fail every bug in the table of Section 39. Real bugs produce logit differences of 0.5 to 10 or more. Rounding produces differences of a few units in the last place of the format, compounded mildly by depth. That leaves a wide gap, and the tolerance goes in it.

| Comparison | Typical correct max abs diff (logits) | A sensible threshold |
|---|---|---|
| fp32 ours vs fp32 reference | $10^{-5}$ to $10^{-4}$ | $10^{-3}$ |
| bf16 ours vs bf16 reference | a few bf16 steps, up to about 0.1 to 0.3 | 0.5, plus argmax checks |
| bf16 ours vs fp32 reference | similar to bf16 vs bf16 | 0.5, plus argmax checks |

PyTorch's `torch.testing.assert_close` encodes the same idea with defaults per dtype: for fp32 a relative tolerance of $1.3 \times 10^{-6}$ and an absolute one of $10^{-5}$; for bf16 a relative tolerance of $1.6 \times 10^{-2}$. Those defaults suit single operations; a 28-layer model needs the looser end-to-end numbers above.

### Top-token agreement

Because generation only uses the argmax (or the distribution's shape), **top-token agreement** is the second test: at every position, both models pick the same most likely token. It needs one exception. When the top two logits are closer together than the tolerance, a **near-tie**, rounding alone can swap them, so either answer is acceptable there. Count near-ties separately; a correct model has a handful in a long text, and a buggy one disagrees on clear winners.

:::interview Interview lens
**"Your port matches the reference to 0.03 in the logits. Is it correct?"** It depends on the dtypes. In fp32 against fp32, rounding differences are around $10^{-5}$, so 0.03 is three orders of magnitude too big and points to a real bug, probably a small one like a wrong epsilon or a missing fp32 upcast. In bf16, where neighbouring values near a logit of 12 are 0.0625 apart, 0.03 is below one rounding step and is fine. I would rerun both in fp32 to separate rounding from bugs, check the per-position pattern for position bugs, and confirm argmax agreement except at near-ties.
:::

## 41. Generation Parity

Logit parity tests one forward pass. **Generation parity** tests the whole loop: the cache, the position bookkeeping and the stopping logic. It uses **greedy decoding**, always taking the argmax, because it is deterministic. Feed the **same prompt** as token IDs to our generator and to the reference's `generate(do_sample=False)`, run both for 100 or 200 tokens, and require the **same generated tokens**.

Two parities are worth separating. **Cached vs uncached parity** compares our own generator with and without its KV cache (Section 8), which isolates cache bugs from everything else. **Reference vs custom** parity compares our cached generator against Hugging Face's, which tests everything at once.

Greedy runs can diverge at a near-tie without any bug: rounding swaps the top two tokens at step 37, and from then on the texts differ. When a divergence happens, look at the logits at that step. If the top two were within tolerance in both models, it is a near-tie; continue the test by forcing both models to take the reference's token and keep comparing. If the reference's winner beat the runner-up by a clear margin, it is a bug.

@fig inf_generation_parity | Two greedy token streams, ours and the reference. They agree step for step; where they split, the logits at that step decide whether it was a near-tie (fine, force the reference token and continue) or a bug.

:::note Greedy is for testing, not serving
Qwen's model card warns against greedy decoding for Qwen3 in thinking mode, because it can cause endless repetition and lower quality, and recommends temperature 0.6, top-p 0.95 and top-k 20. That advice is about the quality of real answers. Parity tests use greedy anyway, because the goal is determinism, not good prose.
:::

:::key In one breath
Fluent output proves little: models are redundant enough that RoPE, epsilon or head-mapping bugs leave short answers intact, sampling adds randomness, and errors compound through layers and tokens. Prove correctness against a reference (Hugging Face's Qwen3, eager attention, same checkpoint and same token IDs, fp32 first) by comparing raw logits: max and mean absolute difference, per position, plus argmax agreement, and when they fail, capture intermediate tensors with hooks and find the first stage that diverges, then check the usual suspects there (RoPE convention, position IDs, head view order, GQA repeat, epsilon, transposes, activation, mask, dtype). Tolerances come from the format: fp32 noise is around $10^{-5}$ in the logits, while bf16 steps near 12 are 0.0625, so 0.03 is a bug in fp32 and rounding in bf16; finish with greedy generation parity, cached against uncached and ours against the reference, treating divergences at near-ties as rounding and divergences at clear margins as bugs.
:::

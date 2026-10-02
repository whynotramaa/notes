@part V | SDPA: One Call, Several Kernels | Chapter 1 wrote attention by hand: multiply, scale, mask, softmax, multiply. It is the right way to learn, and it is slow and memory-hungry, because it builds the whole score grid. PyTorch has one function, `scaled_dot_product_attention`, that computes exactly the same thing and picks the fastest available engine to do it. This part reads its arguments, shows how it chooses an engine and when it silently falls back to the slow path, and covers the two mask rules where most of its bugs live. | where:5

## 22. Six Lines Become One

Chapter 1's hand-written attention:

```python
s = q @ k.transpose(-2, -1)            # scores        (B, H, T, T)
s = s / math.sqrt(q.size(-1))          # scale
s = s.masked_fill(mask, float('-inf')) # causal mask
w = s.softmax(dim=-1)                  # weights       (B, H, T, T)
w = F.dropout(w, p, training)          # optional dropout
o = w @ v                              # output        (B, H, T, d)
```

Every line is correct, and every line hands a full $(B, H, T, T)$ tensor to the next one through the GPU's main memory. **SDPA**, `torch.nn.functional.scaled_dot_product_attention`, added in PyTorch 2.0 in 2023, replaces all six with one call that computes the same mathematical result:

```python
o = F.scaled_dot_product_attention(q, k, v, is_causal=True,
                                   dropout_p=p if self.training else 0.0)
```

@fig sdpa_lines | Six hand-written lines and the single call that replaces them. The answer is the same; the difference is that the call can run as one fused kernel that never writes the score grid to memory.

The difference is what happens inside. A **kernel** is a program that runs on the GPU. The hand-written version launches several kernels, each reading its input from main memory and writing its output back. SDPA can instead run one **fused** kernel that does all six steps in a single pass, keeping intermediate results in the GPU's small, fast on-chip memory. Part VI shows why that matters so much. For now: same answer, often several times faster, and far less memory.

## 23. The Arguments

Each argument maps onto something from Chapter 1.

`query`, `key` and `value` are the three tensors, with the heads before the tokens: shape $(B, H, L, E)$ for the query, where $L$ is the number of query positions and $E$ the head size, and $(B, H_{kv}, S, E)$ for keys and values, where $S$ is the number of key positions. In training $L = S = T$. During generation with a cache, $L$ is 1 and $S$ is the cache length.

`attn_mask` is an optional mask, either boolean or numeric. `dropout_p` is the probability of randomly dropping attention weights; it applies whenever it is non-zero, so you must pass 0 at evaluation yourself. `is_causal` applies the causal triangle for you. `scale` defaults to $1/\sqrt{E}$, as in Chapter 1's Part VII. `enable_gqa`, added in PyTorch 2.5, lets keys and values have fewer heads than queries and shares them across groups without copying (Part IV).

@fig sdpa_args | The arguments of scaled_dot_product_attention. Each corresponds to one piece of the hand-written version; is_causal is highlighted because its alignment rule causes the most bugs.

## 24. Which Kernel Runs

SDPA is a dispatcher. Each time you call it, it checks your inputs and picks one of several implementations, called backends. On an NVIDIA GPU the main ones are **FlashAttention** (Part VI), the fastest but the pickiest; **memory-efficient attention**, based on Meta's xFormers work, which handles more cases and still never stores the full grid; a **cuDNN** backend on recent hardware; and the **math** backend, which is simply the six hand-written lines in C++, the fallback that handles everything.

The checks are, roughly: is the data type 16-bit (fp16 or bf16)? Is there no custom mask tensor? Is the head size within the supported range? Is the GPU recent enough? Pass all of them and you get FlashAttention. Fail the data type check, for example by running in 32-bit, and Flash is skipped immediately; you usually get the memory-efficient kernel instead. Pass an arbitrary `attn_mask` tensor and Flash is skipped too. If nothing else applies, the math kernel runs.

@fig dispatcher | A simplified view of the dispatch decision. 16-bit inputs with no custom mask and a supported head size get FlashAttention; fp32 or an explicit mask tensor drop to the memory-efficient kernel; anything else falls back to math.

The math fallback is the dangerous one, because it is silent. It gives correct answers, so tests pass, and it stores the full weight grid, so memory explodes with length. For Finch-24 with 8 heads in bf16, one layer's weights take 16 MiB at 1,024 tokens, 256 MiB at 4,096, 4 GiB at 16,384 and 64 GiB at 65,536. A fused kernel needs only a few hundred kilobytes of on-chip tiles regardless of length. At long contexts, that is the difference between fitting on the GPU and crashing with an out-of-memory error.

@fig fallback_memory | Memory for one layer's attention weights. The math kernel stores the full T × T grid and grows as a square; fused kernels hold only small tiles.

:::warn Watch out
The single most common reason people do not get the speed-up they expected from SDPA is running in 32-bit. FlashAttention only supports 16-bit inputs. Wrap the forward pass in `torch.autocast(device_type='cuda', dtype=torch.bfloat16)` or cast the model to bf16. The second most common reason is passing an explicit `attn_mask` that merely encodes the causal triangle; use `is_causal=True` instead so the fast path stays available.
:::

## 25. Masks: Where the Bugs Live

### Boolean masks: True means attend

SDPA accepts a boolean mask in which `True` means "this query **may** attend to this key" and `False` means "hide it". That is the opposite of `masked_fill` in Chapter 1's code, where `True` marked the cells to *fill with minus infinity*, and the opposite of several other libraries. Take three real tokens followed by two padding tokens. The correct mask has `True` in the first three columns and `False` in the last two. Invert it by accident and real tokens can see *only* the padding and not each other. Nothing crashes; the model quietly reads garbage.

@fig bool_mask | Boolean masks in SDPA. True means may attend. The inverted mask is just as valid a tensor, so it runs without error while every real token attends only to padding.

A numeric mask is the other option: a float tensor that is *added* to the scores, with 0 where attention is allowed and $-\infty$ where it is not, exactly as in Chapter 1's Section 45. Numeric masks are unambiguous, which is one reason some codebases prefer them.

### is_causal when L ≠ S

When the number of queries equals the number of keys, `is_causal=True` gives the usual triangle and all is well. But during generation with a KV cache, there is 1 new query and $S$ keys. Where should the triangle sit?

PyTorch's `is_causal=True` aligns the triangle with the **top-left** corner: query 0 may see key 0, query 1 may see keys 0 and 1, and so on. With one query and six keys, the single new query lands in row 0 and may see only key 0. That is wrong: the newest token is the *last* position and should see all six. What decode needs is the triangle aligned to the **bottom-right** corner, where the last query sees every key.

@fig causal_align | Causal alignment when queries are fewer than keys. Top-left alignment, which is what is_causal=True does, lets the single decode query see only the first key; bottom-right alignment lets it see them all.

Two fixes cover these cases. For a single new token, pass `is_causal=False`: the newest token may see everything before it, so no mask is needed. For several new tokens at once, such as speculative decoding or chunked prefill, use PyTorch's `torch.nn.attention.bias.causal_lower_right(L, S)` helper, which builds the bottom-right-aligned mask in a form the fast kernels still accept.

:::interview Interview lens
**"What goes wrong if you pass is_causal=True during decoding with a KV cache?"** PyTorch aligns the causal mask to the top-left, so with one query and $S$ cached keys the query is treated as position 0 and can only attend to the first key. Decode needs bottom-right alignment, where the newest query sees all keys. For one new token pass `is_causal=False`; for several, use a lower-right causal mask. It does not raise an error, it just produces wrong outputs.
:::

## 26. Shapes and Control

### Getting into (B, H, T, d) and back

SDPA wants the heads before the tokens. After the projection, a Finch-24 query comes out as $(B, T, 512)$. `view(B, T, 8, 64)` splits it into heads, giving $(B, T, 8, 64)$. `transpose(1, 2)` swaps heads and tokens, giving $(B, 8, T, 64)$, the order SDPA wants. After SDPA, transpose back to $(B, T, 8, 64)$ and reshape to $(B, T, 512)$ to glue the heads together for the output projection.

@fig sdpa_shapes | The shape round trip around SDPA. Split into heads, move heads before tokens, run attention, move them back, and merge.

One subtle detail. After a transpose, the tensor's numbers are no longer laid out in memory in the order its shape suggests, and `view` refuses to reshape such a tensor (or, in older code with `.contiguous()` forgotten, people work around it wrongly). Use `.reshape`, which copies when it must, or call `.contiguous()` before `.view`. Getting the order of these steps wrong is the reshape bug of Chapter 1, Section 52: right shapes, scrambled heads.

### Forcing and checking a backend

Sometimes you want to be certain you are getting a fused kernel rather than quietly falling back. PyTorch provides a context manager for that:

```python
from torch.nn.attention import sdpa_kernel, SDPBackend

with sdpa_kernel(SDPBackend.FLASH_ATTENTION):        # allow only Flash
    o = F.scaled_dot_product_attention(q, k, v, is_causal=True)
```

If the inputs are not supported by FlashAttention, this raises an error instead of silently slowing down. It is a good check to run once when setting up a model; in production you usually let the dispatcher choose.

### Sharp edges of SDPA

**attn_mask and is_causal together.** Passing both is an error in PyTorch, and ambiguous anyway. Fold the causal pattern into your mask, or use only `is_causal`.

**dropout_p at evaluation.** SDPA does not know whether the model is training. A fixed `dropout_p` drops weights during evaluation too. Pass `dropout_p=self.p if self.training else 0.0`.

@fig sdpa_eval_dropout | Illustrative attention weights are 0.1, 0.2, 0.3 and 0.4. One possible dropout draw at p = 0.5 drops the first and third and scales survivors by 1 / (1 − p), giving 0, 0.4, 0 and 0.8. Dropout does not renormalize the row. Passing dropout_p = 0.0 retains every weight during evaluation.

**Rows with nothing to see.** If a mask hides every key from some query, softmax divides zero by zero and returns NaN, as in Chapter 1, Section 42. Make sure every query can attend to at least one key.

**The default scale.** The default is $1/\sqrt{E}$. Models that use a different scale, or none, must pass `scale` explicitly; otherwise results are subtly wrong.

**Grouped heads on older PyTorch.** Before version 2.5 there is no `enable_gqa`; keys and values must be expanded to the query head count first, using the expand-reshape helper of Part IV.

:::key In one breath
`F.scaled_dot_product_attention(q, k, v, attn_mask, dropout_p, is_causal, scale, enable_gqa)` computes exactly $\text{softmax}(qk^\top/\sqrt{E} + M)\,v$ on $(B, H, L, E)$ tensors, but dispatches to a fused kernel (FlashAttention, memory-efficient, cuDNN) that never stores the $L \times S$ grid, falling back silently to the math kernel otherwise (64 GiB per layer at 65k tokens for Finch-24). Flash needs 16-bit inputs, no custom mask tensor and a supported head size, so fp32 and redundant causal masks are the usual reasons for missing the speed-up. Boolean masks use True for "may attend", `is_causal` aligns the triangle top-left (wrong for one decode query against a cache; use `is_causal=False` or `causal_lower_right`), dropout must be zeroed at eval, and `sdpa_kernel` can force and verify a backend.
:::

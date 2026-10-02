@chapter faq | Interview Question Bank | Forty questions on the modern decoder block, in the order of the chapter, each answered the way a strong candidate would say it out loud.

### RoPE in practice

**Q1. Where exactly is RoPE applied in a Llama-style layer?**

After the Q and K projections and the reshape into heads, before the KV cache and before attention. Only queries and keys are rotated; values and the residual stream are untouched, and cached keys are stored already rotated.

**Q2. What does `rope_theta` control?**

The base of the frequency ladder, $\theta_i = \text{base}^{-2i/d_{\text{head}}}$. A larger base slows every pair except pair 0, putting more pairs into the slow, long-range regime that never wraps within the context; Llama 3 raised it from 10,000 to 500,000 for long-context resolution.

**Q3. Why precompute cos and sin tables?**

The rotation angle depends only on position and pair, never on the content, so a $(T_{\max}, d_{\text{head}})$ table of each can be built once, in fp32 for precision, and indexed by position in every forward pass.

**Q4. What is rotate_half?**

$[x_1, x_2] \mapsto [-x_2, x_1]$ on the two halves of a head. Then $q\cos + \text{rotate\_half}(q)\sin$ rotates each pair $(x_i, x_{i + d/2})$ by its angle, implementing RoPE with two multiplies and an add instead of a sparse rotation matrix.

**Q5. Why do Meta's and Hugging Face's Llama implementations need weight conversion?**

Meta pairs adjacent dimensions (interleaved, via complex numbers); Hugging Face pairs dimension $i$ with $i + d/2$ (rotate_half). Both are valid, but the Q and K projection rows must be permuted to move a checkpoint from one convention to the other.

**Q6. What position does a newly generated token get?**

The current cache length, so positions continue where the prompt ended. Using 0 makes every new token look like the start of the text and corrupts all relative distances; with left padding, positions must come from the attention mask.

**Q7. Compare position interpolation, NTK-aware scaling and YaRN.**

Interpolation divides all positions (all pair speeds) by the stretch factor, blurring fast pairs. NTK-aware raises the base so pair 0 is unchanged and the slowest pair is slowed by the full factor. YaRN slows pairs by wavelength band, leaving high-frequency pairs alone, fully interpolating low-frequency ones, blending between, and slightly rescaling attention logits; all benefit from long-context fine-tuning.

**Q8. What happens if you run a model with the wrong RoPE base?**

Every pair rotates at the wrong speed. Short prompts often look fine because angles stay small, but long prompts degrade sharply. Always read `rope_theta` and `rope_scaling` from the config.

### RMSNorm

**Q9. What is RMSNorm?**

Divide each token's vector by its root mean square, $\sqrt{\text{mean}(x^2) + \varepsilon}$, and multiply by a learned per-channel gain. Unlike LayerNorm it does not subtract the mean and has no bias.

**Q10. Why does dropping the mean subtraction not hurt?**

The useful property of normalization is invariance to the scale of the input, which stabilizes deep networks; RMSNorm keeps it. Shift invariance turned out not to matter in practice, so removing it saves a reduction and half the parameters without a quality loss.

**Q11. Geometrically, what does each norm do?**

RMSNorm keeps the vector's direction and rescales it onto a sphere. LayerNorm first projects out the all-ones direction (centring), then rescales, so it discards one direction of information.

**Q12. Why compute RMSNorm in fp32?**

Squaring 16-bit activations can overflow or lose precision. Reference implementations upcast to fp32 for the mean of squares and the reciprocal square root, then cast back.

**Q13. What is QK-norm and why use it?**

Applying a norm to the queries and keys inside attention, before the dot product. It keeps attention logits bounded, preventing the logit growth that causes loss spikes in large or long training runs.

**Q14. What does ε do beyond preventing division by zero?**

It sets a floor: inputs whose RMS is well below $\sqrt{\varepsilon}$ are not amplified to unit size but shrink with the input. Use the value the model was trained with.

**Q15. What is unusual about Gemma's RMSNorm?**

It computes $x \cdot (1 + \gamma)$, so stored weights sit near zero. Loading them into standard $x \cdot \gamma$ code multiplies every layer's output by nearly zero.

### SwiGLU

**Q16. Write the SwiGLU MLP.**

$W_{\text{down}}(\text{SiLU}(W_{\text{gate}}x) \odot W_{\text{up}}x)$, with SiLU$(x) = x\,\sigma(x)$ and no biases. One projection acts as a smooth per-feature switch on the other.

**Q17. Why is the hidden size about $8d/3$?**

Three matrices instead of two: matching the $8d^2$ parameters of a $4d$ vanilla MLP requires $3dh = 8d^2$, so $h = 8d/3$, then rounded up to a hardware-friendly multiple, sometimes with an extra multiplier. Llama 3 8B uses 14,336 for $d = 4{,}096$.

**Q18. What does the gate add over a plain activation?**

A multiplicative interaction between two learned projections: one decides how much of each feature passes, the other what it carries. A plain activation can only bend a single projection.

**Q19. What did Shazeer's GLU paper find?**

Gated variants (GLU, bilinear, ReGLU, GEGLU, SwiGLU) beat ReLU, GELU and Swish MLPs at equal parameter count, with GEGLU and SwiGLU best, and the paper declined to explain why.

**Q20. What are the common SwiGLU porting bugs?**

Assuming the hidden size is $4d$; swapping the gate and up halves of a fused matrix (Meta's `w1` is gate, `w3` is up, `w2` is down); and adding biases that the trained model does not have.

### GQA

**Q21. Why is decoding memory-bound, and how does GQA help?**

Each step reads all weights and the whole KV cache to do one token's arithmetic. The cache is proportional to the number of key/value heads, so sharing each key/value head across a group of query heads shrinks the bytes read per token, which directly speeds up long-context decoding.

**Q22. Compare MHA, GQA and MQA.**

MHA gives each query head its own keys and values; MQA shares one key/value head among all query heads; GQA shares one per group. GQA gets most of MQA's cache and speed savings with nearly MHA quality.

**Q23. How do you implement GQA without a special kernel?**

Project keys and values to $H_{kv}$ heads, cache them at that size, and expand each to its group with `repeat_interleave` (or expand plus reshape) before attention, so query head $i$ reads key/value head $\lfloor i / g \rfloor$.

**Q24. What is the classic GQA bug?**

Using `.repeat`, which tiles heads as 0, 1, 0, 1, instead of `repeat_interleave`, which gives 0, 0, 1, 1. Same shape, wrong pairing, no error. Caching the expanded tensor is a second bug that wastes the memory saving.

**Q25. How do you convert an MHA model to GQA?**

Mean-pool the key heads and the value heads within each group into one head, then uptrain briefly, about 5% of the original compute in the GQA paper.

**Q26. How large is Llama 3 8B's KV cache?**

$2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes per token in 16-bit, so 1 GiB at 8k tokens and 16 GiB at 128k. With 32 key/value heads it would be four times larger.

### SDPA and FlashAttention

**Q27. What does `scaled_dot_product_attention` do?**

Computes $\text{softmax}(qk^\top / \sqrt{E} + M)v$ and dispatches to the fastest valid backend (FlashAttention, memory-efficient, cuDNN, or the math fallback) based on dtype, mask, head size and hardware.

**Q28. Why might SDPA not give a speed-up?**

The inputs are fp32, an explicit mask tensor is passed, or the head size or hardware is unsupported, so it falls back to a slower kernel, possibly the math kernel that stores the full score matrix.

**Q29. What does True mean in an SDPA boolean mask?**

"May attend". It is the opposite of `masked_fill` conventions and of some other libraries; an inverted mask runs silently and makes tokens attend only to what should be hidden.

**Q30. What is wrong with `is_causal=True` during decode?**

It aligns the triangle top-left, so with one query and many cached keys the query sees only the first key. Use `is_causal=False` for a single new token, or a lower-right causal mask for several.

**Q31. Why is attention memory-bound on a GPU?**

Softmax, scaling and masking do a few operations per element, while the hand-written version writes and reads the $T \times T$ scores and probabilities through HBM, which is about ten times slower than on-chip SRAM. Traffic, not arithmetic, dominates.

**Q32. How does FlashAttention work?**

It tiles queries, keys and values, keeps a query block in SRAM while streaming key/value tiles, computes each score tile, updates a running max, running sum and running output (online softmax, rescaled when the max increases), and writes only the final output, never the score matrix.

**Q33. Is FlashAttention exact?**

Yes, it computes the same function in a different order. Results can differ in the last bits because floating-point addition is not associative, but there is no approximation.

**Q34. What does FlashAttention do in the backward pass?**

It stores only a per-row log-sum-exp and recomputes score tiles from $Q$ and $K$, trading extra arithmetic for far less memory and traffic, which ends up faster.

**Q35. How does FlashAttention exploit the causal mask?**

Tiles entirely above the diagonal are skipped, tiles below need no mask, and only diagonal tiles are masked elementwise, so causal attention costs about half of full attention.

**Q36. What changed in FlashAttention-2 and -3?**

Version 2 parallelized across the sequence and reduced non-matmul work, roughly doubling speed. Version 3 targets Hopper GPUs, overlapping data movement with compute and adding FP8.

### The assembled block

**Q37. List the differences between a GPT-2 block and a Llama 3 block.**

RoPE instead of learned positions, RMSNorm instead of LayerNorm, SwiGLU instead of a GELU MLP, grouped-query instead of full multi-head key/value heads, fused SDPA/FlashAttention instead of hand-written attention, and no biases. The pre-norm residual skeleton is unchanged.

**Q38. Where are the parameters in a Llama 3 8B block?**

About 218M per block: q and o projections 16.8M each, k and v 4.2M each, and three MLP matrices of 58.7M each, so the MLP is about 81% of the block; 32 blocks plus untied 128k-vocabulary embeddings give 8.03B.

**Q39. Walk me through a modern decoder block's forward pass with shapes.**

$x$ $(T, d)$ goes through RMSNorm; q becomes $(T, H, d_h)$ and k, v $(T, H_{kv}, d_h)$; RoPE rotates q and k; k and v are appended to the cache; SDPA with grouped heads produces $(T, H, d_h)$, merged and projected back to $(T, d)$ and added to the stream. Then RMSNorm, gate and up to $(T, d_{ff})$, SiLU and multiply, down to $(T, d)$, added to the stream.

**Q40. What would you check when porting a model?**

RoPE base, scaling and pairing; norm epsilon and gain convention; intermediate size and gate/up order; head counts and grouping; causal alignment at decode; dtype; biases; tied embeddings; and finally compare logits against the reference implementation.

@chapter exercises | Exercises | Thirty problems in the order of the chapter. ● is quick arithmetic, ●● is multi-step or an explanation, ●●● is a derivation, a proof or code.

### Parts I and II

**E1** ● For a 128-wide head with base 500,000, what is the speed of the slowest pair, and its wavelength?

**E2** ●● Apply $q\cos + \text{rotate\_half}(q)\sin$ to $q = [2, 0, 1, 1]$ at position $m = 2$ with pair speeds $\theta = (0.5, 0.05)$.

**E3** ●● Llama 3 8B ($d_{\text{head}} = 128$, base 500,000) is stretched from 8,192 to 32,768 tokens. What is the interpolation factor, and what base would NTK-aware scaling use?

**E4** ●●● Show that $q\cos + \text{rotate\_half}(q)\sin$ rotates each half-split pair $(q_i, q_{i + d/2})$ by its angle.

**E5** ● With base 10,000 and a 64-wide head, how many pairs complete at least one full turn within 2,048 tokens?

**E6** ●● Apply RMSNorm and LayerNorm (ignore $\varepsilon$, $\gamma = 1$, $\beta = 0$) to $[3, 4]$.

**E7** ● How many normalization parameters does Llama 3 8B have in total?

**E8** ●● Explain without equations why RMSNorm keeps a vector's direction and LayerNorm does not.

**E9** ● With $\varepsilon = 10^{-6}$, below roughly what input RMS does $\varepsilon$ dominate RMSNorm?

### Parts III and IV

**E10** ●● Compute $\text{SiLU}$ of $[-2, 0, 2]$ and the gated output for up values $[1, 1, 1]$.

**E11** ●● Using Llama's rule, what MLP width does $d = 2{,}048$ get with `multiple_of = 256` and no multiplier? With a multiplier of 1.5?

**E12** ● How many MLP parameters does Finch-24 have across all 8 layers?

**E13** ●● Explain to a friend what the gate and the up projection each contribute.

**E14** ●● Compute Qwen 2.5 7B's KV cache per token (28 layers, 4 key/value heads of 128, bf16) and for 32,768 tokens.

**E15** ● With 32 query heads and 8 key/value heads, which key/value head should query head 13 read? Which does it read with the `.repeat` bug?

**E16** ●●● Write `repeat_kv(x, n_rep)` for $x$ of shape $(B, H_{kv}, T, d)$ without copying data unnecessarily.

**E17** ●● Eight key heads have first entries $[1, 3, 5, 7, 2, 4, 6, 8]$. Mean-pool them into two groups.

**E18** ●● A model has 14 GB of weights and a 2 GB cache, on a GPU reading 3.35 TB/s. Estimate the time per generated token and tokens per second at batch 1.

### Parts V and VI

**E19** ● How much memory does the math kernel need for one layer's attention weights with 32 heads at $T = 8{,}192$ in bf16?

**E20** ●● Draw the bottom-right-aligned causal mask for 2 new queries against 5 keys (3 cached, 2 new).

**E21** ● Convert the boolean SDPA mask `[True, True, False]` into an additive float mask.

**E22** ●● Run online softmax with values: block 1 scores $[0, 1]$, values $[1, 2]$; block 2 scores $[2, -1]$, values $[3, 4]$. Check against the direct computation.

**E23** ● What fraction of tiles does FlashAttention compute for causal attention with 32 blocks per side?

**E24** ● How many bytes of HBM traffic do $S$ and $P$ cause in standard attention for one head at $T = 8{,}192$ in 16-bit?

**E25** ●●● Explain why FlashAttention's backward pass is faster even though it recomputes the forward scores.

### Part VII

**E26** ●●● Count every parameter of a Finch-24-style model with $d = 1{,}024$, 16 layers, 16 query heads and 4 key/value heads of 64, a SwiGLU width from Llama's rule with `multiple_of = 256`, $V = 32{,}000$, tied embeddings, RMSNorm and no biases.

**E27** ●● For Finch-24 at its full 4,096-token context, what share of a block's per-token forward FLOPs is attention? At what context are the two equal?

**E28** ● How many parameters would Llama 3 8B have if its embeddings were tied?

**E29** ●● Reconcile Finch-19's 42,128,384 parameters with Finch-24's 40,509,952, component by component.

**E30** ● What is Finch-24's KV cache per token if stored in fp32?

@chapter solutions | Solutions | Worked answers to every exercise. Where a number appears, it was computed, not estimated.

**E1.** $\theta_{63} = 500{,}000^{-126/128} \approx 2.46 \times 10^{-6}$ radians per position; wavelength $2\pi / \theta_{63} \approx 2{,}559{,}196$ tokens.

**E2.** Angles are $2 \times 0.5 = 1.0$ for pair (0, 2) and $2 \times 0.05 = 0.1$ for pair (1, 3). Pair (0, 2) is $(2, 1)$: $(2\cos 1 - \sin 1,\ 2\sin 1 + \cos 1) = (0.2391, 2.2232)$. Pair (1, 3) is $(0, 1)$: $(-\sin 0.1, \cos 0.1) = (-0.0998, 0.9950)$. So $q' = [0.2391, -0.0998, 2.2232, 0.9950]$.

**E3.** Factor $32{,}768 / 8{,}192 = 4$. NTK-aware base $500{,}000 \times 4^{128/126} \approx 2{,}044{,}497$.

**E4.** With halves $x_1 = (q_0, \dots, q_{d/2 - 1})$ and $x_2$, and the cos and sin rows holding $\cos\phi_i$ and $\sin\phi_i$ in both halves, entry $i$ of the result is $q_i \cos\phi_i - q_{i + d/2}\sin\phi_i$ and entry $i + d/2$ is $q_{i + d/2}\cos\phi_i + q_i \sin\phi_i$. That is exactly the 2D rotation of $(q_i, q_{i + d/2})$ by $\phi_i$.

**E5.** Wavelength below 2,048 requires $10000^{2i/64} < 2048 / 2\pi = 325.9$, so $i < 20.1$: pairs 0 to 20, which is 21 pairs.

**E6.** RMS $= \sqrt{(9 + 16)/2} = 3.536$, so RMSNorm gives $[0.849, 1.131]$, the same direction. LayerNorm: mean 3.5, centred $[-0.5, 0.5]$, standard deviation 0.5, result $[-1, 1]$.

**E7.** $32 \times 2 \times 4{,}096 + 4{,}096 = 266{,}240$.

**E8.** RMSNorm divides every entry by the same positive number, so all entries keep their signs and ratios: the arrow only gets shorter or longer. LayerNorm first subtracts the average from every entry, which slides the arrow sideways along the all-ones direction before rescaling, so where it points changes.

**E9.** $\sqrt{10^{-6}} = 0.001$.

**E10.** $\text{SiLU}(-2) = -2 \times 0.119 = -0.238$, $\text{SiLU}(0) = 0$, $\text{SiLU}(2) = 1.762$. With up values of 1 the gated output is the same, $[-0.238, 0, 1.762]$: the first feature is nearly shut, the second fully shut, the third open.

**E11.** $\lfloor 8 \times 2{,}048 / 3 \rfloor = 5{,}461$, rounded up to a multiple of 256: 5,632. With 1.5: $\lfloor 1.5 \times 5{,}461 \rfloor = 8{,}191$, rounded up: 8,192.

**E12.** $8 \times 3 \times 512 \times 1{,}536 = 18{,}874{,}368$.

**E13.** Both look at the same token. The up projection writes the content each hidden feature should carry. The gate projection, passed through a soft switch, decides for each feature how much of that content gets through for this token. Separating "what" from "whether" lets one feature be useful only in the right context.

**E14.** $2 \times 28 \times 4 \times 128 \times 2 = 57{,}344$ bytes, 56 KiB per token; at 32,768 tokens, 1.75 GiB.

**E15.** Groups of $32/8 = 4$, so $\lfloor 13 / 4 \rfloor = 3$. With `.repeat`, the pattern is $i \bmod 8 = 5$: the wrong head.

**E16.**

```python
def repeat_kv(x, n_rep):                       # (B, H_kv, T, d)
    if n_rep == 1:
        return x
    B, H_kv, T, d = x.shape
    x = x[:, :, None].expand(B, H_kv, n_rep, T, d)   # a view, no copy
    return x.reshape(B, H_kv * n_rep, T, d)          # heads 0,0,..,1,1,..
```

**E17.** Group 1: $(1 + 3 + 5 + 7)/4 = 4$. Group 2: $(2 + 4 + 6 + 8)/4 = 5$.

**E18.** $16 \text{ GB} / 3.35 \text{ TB/s} = 4.78$ ms per token, about 209 tokens per second, a ceiling set by memory bandwidth alone.

**E19.** $32 \times 8{,}192^2 \times 2 = 4$ GiB for one layer.

**E20.** The new queries sit at positions 3 and 4. Query 0 may see keys 0 to 3; query 1 may see keys 0 to 4:

```text
[ T T T T F ]
[ T T T T T ]
```

**E21.** `[0, 0, -inf]`.

**E22.** Block 1: $m = 1$, $\ell = e^{-1} + e^{0} = 1.3679$, $O = 0.3679 \times 1 + 1 \times 2 = 2.3679$. Block 2: $m' = 2$, factor $e^{-1} = 0.3679$; $\ell' = 0.3679 \times 1.3679 + e^0 + e^{-3} = 1.5530$; $O' = 0.3679 \times 2.3679 + 3 + 4e^{-3} = 4.0702$. Output $4.0702 / 1.5530 = 2.6209$. Direct: weights from $e^{[0, 1, 2, -1]}$ give the same 2.6209.

**E23.** $(32 \times 31 / 2 + 32) / 1{,}024 = 528 / 1{,}024 = 51.6\%$.

**E24.** $4T^2$ elements: $4 \times 8{,}192^2 \times 2$ bytes $= 512$ MiB per head per layer.

**E25.** The standard backward pass must read the stored $T \times T$ probability matrix from HBM (and write gradients of the same size), which is pure memory traffic. FlashAttention instead keeps one log-sum-exp per row and rebuilds each tile of probabilities in SRAM from $Q$ and $K$ tiles it must load anyway. The extra arithmetic is cheap on a GPU with far more compute than bandwidth, while the avoided traffic is expensive, so the total time falls, and memory use becomes linear in $T$.

**E26.** Hidden width: $\lfloor 8 \times 1{,}024 / 3 \rfloor = 2{,}730$, rounded up to 2,816. Attention per layer: $q$ and $o$ $1{,}024^2 = 1{,}048{,}576$ each, $k$ and $v$ $1{,}024 \times 256 = 262{,}144$ each, total 2,621,440. MLP: $3 \times 1{,}024 \times 2{,}816 = 8{,}650{,}752$. Norms 2,048. Block 11,274,240; 16 blocks 180,387,840. Embeddings $32{,}000 \times 1{,}024 = 32{,}768{,}000$, final norm 1,024. Total 213,156,864.

**E27.** Linear layers: $2 \times 3{,}015{,}680 = 6{,}031{,}360$ FLOPs. Attention: $4 \times 4{,}096 \times 512 = 8{,}388{,}608$. Attention is 58.2%. They are equal at $T = 6{,}031{,}360 / (4 \times 512) = 2{,}945$ tokens. Small, narrow models reach attention-dominated territory at much shorter contexts.

**E28.** $8{,}030{,}261{,}248 - 128{,}256 \times 4{,}096 = 7{,}504{,}924{,}672$.

**E29.** Position table $-524{,}288$; norms $8 \times (1{,}024 - 2{,}048) + (512 - 1{,}024) = -8{,}704$; attention $8 \times (655{,}360 - 1{,}050{,}624) = -3{,}162{,}112$; MLP $8 \times (2{,}359{,}296 - 2{,}099{,}712) = +2{,}076{,}672$. Sum $-1{,}618{,}432$, and $42{,}128{,}384 - 1{,}618{,}432 = 40{,}509{,}952$.

**E30.** $2 \times 8 \times 2 \times 64 \times 4 = 8{,}192$ bytes per token.

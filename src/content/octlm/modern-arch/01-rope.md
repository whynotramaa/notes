@part I | RoPE, Properly | Chapter 1 explained why rotating queries and keys gives attention a sense of distance. That is enough to understand RoPE, but not to write it, load someone else's weights, or stretch a model to longer texts. This part is the practical version: exactly where RoPE sits in the code, how the base sets every rotation speed, the two incompatible ways code arranges the pairs, how positions work during generation, and how models are stretched from thousands of tokens to over a hundred thousand. | where:1

## 1. Where RoPE Lives

Chapter 1, Part V, built the idea: each pair of numbers in a query or key is rotated by an angle equal to the token's position times that pair's speed, and the dot product of a rotated query and a rotated key then depends only on the distance between them. Finch-24 drops Finch-19's learned position table entirely and uses RoPE instead. The first practical question is: where, exactly, in the code?

Follow the data through one Finch-24 attention layer. The input $x$ has shape $(B, T, 512)$: batch, tokens, width. Three projections produce $q$ with shape $(B, T, 512)$ and, because Finch-24 uses grouped-query attention (Part IV), $k$ and $v$ with shape $(B, T, 128)$: two key/value heads of 64. A reshape and a transpose give each head its own block, $(B, 8, T, 64)$ for queries and $(B, 2, T, 64)$ for keys and values. Then, and only then, $q$ and $k$ go through "apply RoPE", using two precomputed tables of cosines and sines. The rotated $k$ and the *unrotated* $v$ are appended to the KV cache. Finally everything meets in the attention function.

@fig rope_shapes | RoPE inside one Finch-24 attention layer, with the shape of every tensor. Rotation happens after the projections and head reshape, on queries and keys only, before the cache and before attention.

Three details cause most RoPE bugs. RoPE comes *after* the reshape into heads, because each head's 64 numbers are rotated as 32 pairs of their own. The cache stores keys *already rotated*, so they never need rotating again. And values are never rotated at all. Also, the token embeddings are no longer touched by any position information, and there is no position table, so Finch-24's context of 4,096 is a training choice, not a table size.

## 2. The Frequency Table and the Base

Every pair in a head turns at its own speed, and all 32 speeds come from one number in the config, the **base**, called `rope_theta` in Hugging Face configs:

$$\theta_i = \text{base}^{-2i/d_{\text{head}}}, \qquad \lambda_i = \frac{2\pi}{\theta_i}$$

$\theta_i$ is the rotation speed of pair $i$ in radians per position, and $\lambda_i$ is its **wavelength**, the number of positions it takes to make one full turn. In code the speeds are usually called `inv_freq` and computed in one line:

```python
inv_freq = 1.0 / (base ** (torch.arange(0, 64, 2).float() / 64))   # (32,) speeds
```

For Finch-24, base 10,000 and $d_{\text{head}} = 64$, pair 0 has a wavelength of 6.3 tokens and pair 31 about 47,000. With a context of 4,096 tokens, pairs 0 to 22 complete at least one full turn inside the context; pairs 23 to 31, nine of them, never do. Those nine slow pairs behave differently from the others. Within the context their angle only ever sweeps part of the circle, so they act like a smooth, monotonic "how far apart are we?" signal, while the fast pairs act like fine-grained, repeating "exactly how many steps?" signals.

@fig rope_freq_bars | Wavelengths of the 32 pairs of a 64-wide head for two bases, on a log scale, against a 4,096-token context. Raising the base from 10,000 to 500,000 pushes more pairs into the slow group that never wraps around.

Raising the base pushes more pairs into the slow group. At base 500,000 with the same head size, 16 of the 32 pairs never complete a turn within 4,096 tokens. That is why Llama 3 raised its base from Llama 2's 10,000 to 500,000: more slow pairs give the model more resolution for judging distances across very long texts. Llama 3 8B has 128-wide heads and an 8,192-token training context, and with base 500,000, 29 of its 64 pairs stay in the slow regime.

:::warn Watch out
The base is part of the trained model, like any weight. A model trained with base 500,000 and run with 10,000 has every rotation speed wrong. Output often looks fine for short prompts, where all pairs have turned only a little either way, and falls apart on long ones. Read `rope_theta` from the config; never hardcode it.
:::

## 3. Build cos and sin Once, Look Them Up Forever

The rotation angle for a pair depends only on the position and the pair's speed, $m\,\theta_i$, never on the text. So code computes $\cos(m\theta_i)$ and $\sin(m\theta_i)$ for every position once, at start-up, and stores them as two tables of shape $(T_{\max}, d_{\text{head}})$. During the forward pass it looks up the rows for the positions it needs. Each table has 64 columns rather than 32 because each pair's value is stored twice, once for each of its two members, in the order the rotation code expects.

@fig rope_cache_tables | The few lines that build the cos and sin tables, and the tables themselves for positions 0 to 47. Fast pairs on the left change from row to row; slow pairs on the right barely change. The outlined row is what a token at position 20 uses.

Two practical rules. Build the angles in 32-bit floating point and convert only the final cosines and sines to 16-bit. At position 4,000 the angle for pair 0 is 4,000 radians, and 16-bit floats have so few digits that the rounding error in the angle itself would be larger than a radian. And allocate the tables for the longest context you will ever use, because recomputing them mid-generation is easy to forget.

## 4. Pairing Conventions and rotate_half

RoPE rotates numbers in pairs. But which two numbers in a 64-wide head form a pair? There are two conventions, and mixing them up is one of the most common bugs when porting a model.

**Interleaved** pairing puts neighbours together: dimension 0 with 1, 2 with 3, and so on. That is how the RoFormer paper wrote it and how Meta's original Llama code implements it, by viewing each head as 32 complex numbers. **Half-split** pairing puts dimension $i$ with dimension $i + 32$: the first half of the head with the second half. That is what the Hugging Face `transformers` library does.

@fig rope_pairing | Two ways to choose the pairs in an eight-wide toy head. Interleaved pairs neighbours; half-split pairs each dimension with the one half a head away. Both train equally well, but their weights are not interchangeable.

Both conventions produce equally good models, because the projection matrices learn to put matching information into whichever dimensions get rotated together. The trouble is that a checkpoint trained with one convention gives nonsense in code written for the other. Conversion scripts fix this by permuting the rows of the $W_Q$ and $W_K$ weights so that dimensions that were neighbours end up half a head apart.

### rotate_half, step by step

The half-split convention leads to a neat trick that avoids building any rotation matrix. Write the head as two halves, $x_1$ (the first 32 numbers) and $x_2$ (the last 32). Define

$$\text{rotate\_half}([x_1, x_2]) = [-x_2,\ x_1], \qquad q' = q \odot \cos + \text{rotate\_half}(q) \odot \sin$$

where $\odot$ is entry-by-entry multiplication and $\cos$, $\sin$ are rows from the tables. Check it on a 4-wide head, $q = [1, 2, 3, 4]$, at position $m = 1$, with pair speeds $\theta_0 = 1$ and $\theta_1 = 0.01$ (base 10,000 for a 4-wide head). The pairs are dimensions (0, 2) and (1, 3). The cos row is $[\cos 1, \cos 0.01, \cos 1, \cos 0.01] = [0.5403, 1.0000, 0.5403, 1.0000]$ and the sin row is $[0.8415, 0.0100, 0.8415, 0.0100]$. $\text{rotate\_half}(q) = [-3, -4, 1, 2]$.

Now multiply and add: $q \odot \cos = [0.5403, 2.0000, 1.6209, 3.9998]$, $\text{rotate\_half}(q) \odot \sin = [-2.5244, -0.0400, 0.8415, 0.0200]$, and the sum is $q' = [-1.9841, 1.9599, 2.4624, 4.0198]$. Check pair (0, 2) the long way, rotating $(1, 3)$ by 1 radian: $(1 \cdot \cos 1 - 3 \sin 1,\ 1 \cdot \sin 1 + 3 \cos 1) = (-1.9841, 2.4624)$. It matches.

@fig rotate_half_steps | rotate_half on a four-wide head at position 1. Multiplying q by the cos row, rotate_half(q) by the sin row, and adding gives exactly the pairwise rotation.

```python
def rotate_half(x):
    x1, x2 = x.chunk(2, dim=-1)           # first and second half of the head
    return torch.cat([-x2, x1], dim=-1)

def apply_rope(q, k, cos, sin):           # q: (B, H, T, 64), cos/sin: (T, 64)
    return q * cos + rotate_half(q) * sin, k * cos + rotate_half(k) * sin
```

That is the actual code found in most model implementations, and it does exactly what Chapter 1's block-diagonal rotation matrix does, with two multiplications and an addition instead of a $64 \times 64$ matrix that is 97% zeros.

:::interview Interview lens
**"What is rotate_half, and why do two implementations of RoPE disagree?"** rotate_half maps $[x_1, x_2]$ to $[-x_2, x_1]$, so $q \cos + \text{rotate\_half}(q) \sin$ rotates each pair $(x_i, x_{i + d/2})$ by its angle without building a rotation matrix. That is the half-split pairing used by Hugging Face; Meta's reference code pairs adjacent dimensions instead. Both are valid, but weights trained under one need the Q and K projection rows permuted to work under the other.
:::

## 5. Positions at Decode Time

During generation (Chapter 1, Part XI), tokens arrive one at a time and old keys sit in the cache, already rotated. Each new token must be rotated by its true position in the whole text. If the prompt had five tokens at positions 0 to 4, the first generated token is at position 5, then 6, then 7.

$$\text{position\_ids} = \text{cache\_len} + \text{arange}(\text{new\_tokens})$$

It sounds too obvious to get wrong, and it is one of the most common bugs in hand-written inference loops. If the code forgets the offset and rotates every new token as if it were at position 0, the relative distance between the new query and the cached keys is wrong for every pair. The model behaves as though each new word were the first word of the text, and output falls apart within a few tokens.

@fig rope_decode_pos | Prompt keys are rotated for positions 0 to 4 and cached. New tokens must continue at 5, 6, 7. If they are rotated as position 0, every relative distance is wrong.

Left padding causes the same bug in disguise. When prompts of different lengths are batched with padding on the left, the first real token of a short prompt sits at index 3 or 4. If positions are taken from the raw index, every real token is rotated by the wrong amount. Derive `position_ids` from the attention mask, counting only real tokens.

## 6. Stretching to Longer Contexts

### Proof by picture: only distance matters

Before stretching anything, it is worth seeing the relative-position property directly. Put the same query content at every position and the same key content at every position, and compute the score for every pair of positions $(m, n)$. With RoPE, every diagonal of the grid, every set of cells with the same $n - m$, is one solid colour: pairs the same distance apart get exactly the same score, wherever they sit. With learned absolute positions added to the content instead, the colours change along each diagonal, because the score also depends on absolute position.

@fig rope_distance_grid | Scores for identical content at every position. Under RoPE each diagonal (fixed n − m) is a single value. With learned absolute positions the pattern is irregular.

### Three ways to stretch

A model trained on 4,096 tokens has never seen the angles its slow pairs reach at 16,384. Chapter 1 introduced **position interpolation**: divide every position by the stretch factor $s$ before rotating, which is the same as dividing every pair's speed by $s$. It works, but it slows the fast pairs too, and the fast pairs did not need it: they wrapped around thousands of times during training and have seen every angle. Slowing them blurs the model's fine view of nearby words.

**NTK-aware scaling**, proposed in 2023 by a Reddit user writing as bloc97, changes the base instead of the positions: $\text{base}' = \text{base} \cdot s^{d_{\text{head}} / (d_{\text{head}} - 2)}$. For Finch-24 stretching by $s = 4$, the base goes from 10,000 to about 41,800. Because each pair's speed depends on the base raised to a power that grows with $i$, pair 0 is not slowed at all, the slowest pair is slowed by exactly $s$, and pairs in between are slowed smoothly in between.

**YaRN**, published by Bowen Peng and colleagues in 2023, makes the split explicit by wavelength. Pairs whose wavelength is much shorter than the original context (more than 32 full turns within it) are left alone. Pairs whose wavelength is longer than the original context are fully interpolated, slowed by $s$. Pairs in between are blended linearly. YaRN also scales the attention logits slightly, by a factor that grows with $\ln s$, to counter the way longer contexts flatten softmax. For Finch-24 at $s = 4$, pairs 0 to 10 keep their speed, pairs 23 to 31 are slowed by 4, and pair 16 is slowed by a factor of about 2.6.

@fig rope_scaling | How much each pair's speed is reduced to stretch 4,096 tokens to 16,384. Linear interpolation slows every pair equally; NTK-aware scaling slows smoothly from none to four times; YaRN leaves fast pairs alone, fully stretches slow ones, and blends in between.

| Method | Fast pairs | Slow pairs | Extra training | Notes |
|---|---|---|---|---|
| Position interpolation | slowed by $s$ | slowed by $s$ | short fine-tune | simple, blurs local detail |
| NTK-aware | unchanged | slowed by $s$ | works even without, better with | one new base number |
| YaRN | unchanged | slowed by $s$ | short fine-tune | plus a small logit scale |
| Llama 3.1 scaling | unchanged (wavelength < 2,048) | slowed by 8 (wavelength > 8,192) | long-context training | blend in between |

Meta's Llama 3.1 used its own variant of the same idea to go from 8,192 to 128,000 tokens: wavelengths shorter than 2,048 are untouched, wavelengths longer than 8,192 are divided by a factor of 8, and those in between are blended, followed by a substantial long-context training phase. All of these methods change *which angles* long texts produce; none of them removes the need for at least some training on long text.

### Sharp edges of RoPE in practice

**Rotating v.** Rotating values as well as queries and keys makes the content passed between tokens depend on position. The model runs, and quality quietly drops.

**Converted checkpoints.** Moving weights between Meta's interleaved format and Hugging Face's half-split format requires permuting the Q and K projection rows. Skip it and the model talks nonsense. Use the conversion script that ships with the model.

**Partial rotary.** GPT-NeoX, Phi and some others rotate only part of each head, a fraction set in the config (`rotary_pct` or `partial_rotary_factor`). Rotating the whole head breaks them.

@fig partial_rotary_head | An illustrative eight-wide head with a rotary fraction of 0.5 rotates four dimensions and copies four unchanged. Two interleaved pairs each turn by 90 degrees for this arithmetic demonstration; actual RoPE pairs use their own frequencies.

**Scaling config fields.** Long-context checkpoints carry a `rope_scaling` entry in their config (type, factor, and for Llama 3.1 the low and high frequency factors). Code that ignores it computes the original, unstretched speeds and degrades past the original context.

:::key In one breath
RoPE runs after the Q/K projections and head reshape and before the cache and attention, on queries and keys only, using cos and sin tables of shape $(T_{\max}, d_{\text{head}})$ built once in fp32 from $\theta_i = \text{base}^{-2i/d_{\text{head}}}$. The base (`rope_theta`) sets how many pairs are slow, long-range signals (9 of 32 for Finch-24 at 4,096 tokens; Llama 3 uses 500,000). Implementations pair dimensions either interleaved (Meta) or half-split with $q\cos + \text{rotate\_half}(q)\sin$ (Hugging Face), which needs permuted weights to convert; decode positions start at the cache length. Contexts are stretched by slowing pairs: uniformly (interpolation), smoothly via a new base (NTK), or by wavelength band (YaRN, Llama 3.1), plus long-text training.
:::

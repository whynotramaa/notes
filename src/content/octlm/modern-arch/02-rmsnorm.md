@part II | RMSNorm: Rescale, Skip the Re-Centring | Every block normalizes its input twice, before attention and before the MLP, to keep numbers at a steady size through dozens of layers. Chapter 1 used LayerNorm, which does two jobs: re-centre each vector to mean zero, then rescale it to unit size. In 2019 two researchers asked whether the first job was needed at all, and found it was not. This part shows exactly what RMSNorm drops, what that means geometrically, what it saves, where modern models put their norms, and the small details that break ported models. | where:2

## 7. Two Jobs, and the 2019 Question

Recall LayerNorm from Chapter 1, Section 66. For each token's vector it does two separate things. First it **re-centres**: subtract the average of the vector's entries, so they average to zero. Then it **rescales**: divide by their standard deviation, so their spread is one. Finally a learned gain $\gamma$ and a learned shift $\beta$, one per channel, let the model undo either effect where useful.

Why normalize at all? A deep network passes each token's vector through dozens of layers, and if each layer can make its output a bit larger or smaller, the scale drifts multiplicatively. A drift of 10% per layer compounds to a factor of 17 over 30 layers. Normalization resets the scale before each sub-layer, so every sub-layer sees inputs of a familiar size no matter what happened before. That keeps training stable and makes the learning rate meaningful across depth.

In 2019 Biao Zhang and Rico Sennrich published *Root Mean Square Layer Normalization*. Their question was simple: which of LayerNorm's two jobs actually matters? Their hypothesis was that the useful property is **re-scaling invariance**, that the output does not change when the input is scaled up or down, and that re-centring contributes little. So they proposed dropping it. They found models trained just as well and ran faster, reporting speed-ups of 7% to 64% for the normalization-heavy models they tested. Llama, Mistral, Qwen, Gemma and Finch-24 all use RMSNorm.

## 8. The Computation, Side by Side

Here are both formulas:

$$\text{LayerNorm}(x) = \frac{x - \mu}{\sqrt{\sigma^2 + \varepsilon}} \odot \gamma + \beta \qquad \text{RMSNorm}(x) = \frac{x}{\sqrt{\tfrac{1}{d}\sum_{i} x_i^2 + \varepsilon}} \odot \gamma$$

Read the right-hand one slowly. Square every entry, take the average of the squares, add a tiny $\varepsilon$, take the square root, and divide the vector by the result. That denominator is the **root mean square**, RMS, of the vector: literally the square **root** of the **mean** of the **squares**, a way of measuring its typical size. Then multiply each entry by its learned gain. No mean is subtracted and there is no $\beta$.

Let us run both on $x = [2, -1, 4, 3]$. LayerNorm needs the mean, 2, in one pass over the numbers; then the variance of the centred values $[0, -3, 2, 1]$, which is $(0 + 9 + 4 + 1)/4 = 3.5$, in a second pass. Dividing by $\sqrt{3.5} = 1.871$ gives $[0, -1.604, 1.069, 0.535]$. RMSNorm needs only the mean of the squares, $(4 + 1 + 16 + 9)/4 = 7.5$, in a single pass. Dividing by $\sqrt{7.5} = 2.739$ gives $[0.730, -0.365, 1.461, 1.095]$.

@fig norm_side_by_side | The same input through both norms. LayerNorm takes two passes over the vector and centres it; RMSNorm takes one pass and keeps its direction.

Look at the two outputs. LayerNorm's has mean 0 and standard deviation 1, and its first entry is exactly zero because the original first entry equalled the mean. RMSNorm's output is the input vector scaled by $1/2.739$: every entry keeps its sign and its proportion to the others, and the result has root mean square exactly 1.

## 9. What the Two Norms Do Geometrically

To picture the difference, use a vector with just two numbers, so it is a point on a flat plane. Take $x = (2.0, 0.6)$.

**RMSNorm** keeps the point's direction and slides it along that direction until its root mean square is 1. With two numbers, "root mean square 1" means the point lies on a circle of radius $\sqrt 2$. So $(2.0, 0.6)$ becomes $(1.355, 0.406)$: the same direction, on the circle. Every possible input direction maps to a different point on the circle, so no directional information is lost.

**LayerNorm** first subtracts the mean, 1.3, giving $(0.7, -0.7)$. Subtracting the mean always lands on the line $x_1 + x_2 = 0$: it removes the component along the all-ones direction $(1, 1)$. Then it rescales onto the circle. With two numbers the line meets the circle at only two points, $(1, -1)$ and $(-1, 1)$, so *every* two-number input becomes one of two outputs. Most of the information is gone.

@fig norm_geometry | Where each norm sends the point (2.0, 0.6). RMSNorm keeps its direction and moves it onto the circle. LayerNorm first projects it onto the line x₁ + x₂ = 0, so only two outputs are possible.

With hundreds of numbers instead of two, LayerNorm loses much less: it discards exactly one direction out of 512, the all-ones direction, and keeps the other 511. But that is still one direction thrown away for no clear benefit, and a computation spent doing it.

### What each norm ignores

Another way to compare them is to ask which changes to the input leave the output unchanged. Double every entry, $2x = [4, -2, 8, 6]$: both norms give exactly the same output as for $x$, because both divide by a measure of size that doubles too. Add 3 to every entry, $x + 3 = [5, 2, 7, 6]$: LayerNorm gives the same output, because subtracting the mean removes the shift, but RMSNorm's output changes to $[0.94, 0.37, 1.31, 1.12]$.

@fig norm_invariance | Both norms ignore scaling the input. Only LayerNorm ignores shifting it. The RMSNorm paper's result is that ignoring shifts was never what made LayerNorm useful.

The surprising empirical finding is that losing shift invariance costs nothing measurable. The residual stream does not tend to drift by a constant offset across all channels in the way it drifts in overall scale, so there is nothing for re-centring to fix.

:::interview Interview lens
**"What is the difference between LayerNorm and RMSNorm, and why do modern LLMs use RMSNorm?"** LayerNorm subtracts the per-token mean, divides by the standard deviation, then applies a gain and a bias. RMSNorm skips the mean subtraction and the bias, dividing by the root mean square and applying only a gain. It keeps scale invariance, which is what stabilizes training, drops shift invariance, which turns out not to matter, and needs one reduction instead of two and half the parameters, so it is cheaper and simpler with no loss in quality.
:::

## 10. The Learned Gain and What You Save

### γ: one learned number per channel

After normalizing, RMSNorm multiplies each channel by its gain $\gamma_i$. The gain starts at 1 for every channel, so at initialization the norm only rescales. During training, the model learns to make some channels louder and others quieter, which matters because the normalization itself treats every channel identically.

@fig gamma_bars | A trained RMSNorm gain vector. Most entries stay near 1, where they started; a couple of channels grow far larger. (Illustrative, but the pattern is well documented.)

In trained models most gains stay near their starting value, but a handful of channels typically grow very large. These **outlier channels** are well documented in large models. They seem to be part of how the model works internally, and they cause real trouble when people compress models into 8-bit integers, because one scale factor has to cover both the tiny ordinary channels and the huge outliers.

### What you save

RMSNorm needs one **reduction**, a pass that sums over the whole vector, instead of LayerNorm's two (one for the mean, one for the variance). It has fewer elementwise operations (no subtraction of the mean, no addition of $\beta$). And it has half the parameters: $d$ gains instead of $d$ gains plus $d$ shifts. For Finch-24 that is $2 \times 512$ per block plus 512 for the final norm, 8,704 in total, against Finch-19's 17,408.

| | LayerNorm | RMSNorm |
|---|---|---|
| Reductions per vector | 2 (mean, variance) | 1 (mean of squares) |
| Learned parameters | $2d$ ($\gamma$, $\beta$) | $d$ ($\gamma$) |
| Ignores input scale | yes | yes |
| Ignores input shift | yes | no |
| Finch model norm parameters | 17,408 (Finch-19) | 8,704 (Finch-24) |

On its own, normalization is a small share of a training step, so the saving is a few percent of the total rather than a dramatic speed-up. But norms run twice in every block, the kernel is simpler to fuse with neighbouring operations, and fewer parts means fewer things to get wrong.

## 11. Where the Norms Sit, and the ε

### Pre-norm, sandwich and QK-norm

Modern models do not all put norms in the same places. **Pre-norm**, as in Chapter 1, puts one RMSNorm before attention and one before the MLP, with a final RMSNorm before the output head. Llama, Mistral and Finch-24 do this. **Sandwich norm** adds a second norm *after* each sub-layer too, before its output is added back to the stream; Gemma 2 does this, which bounds how much any one sub-layer can add. **QK-norm** also normalizes the queries and the keys inside attention, after their projections and before RoPE and the dot product. That stops attention scores from growing out of control in large or long training runs, a failure mode where a few logits become huge, softmax saturates and the loss spikes. OLMo 2, Gemma 3 and Qwen3 use QK-norm.

@fig norm_placements | Three placements. Pre-norm normalizes the input of each sub-layer; sandwich norm also normalizes each output; QK-norm also normalizes queries and keys inside attention.

### What ε does

The $\varepsilon$ in the denominator, typically $10^{-5}$ or $10^{-6}$, exists so the code never divides by zero. But it also changes behaviour for small inputs. For an input whose RMS is much larger than $\sqrt{\varepsilon}$ (about 0.0032 for $\varepsilon = 10^{-5}$), $\varepsilon$ is negligible and the output's RMS is 1, which is the norm doing its job. For an input whose RMS is much smaller, $\varepsilon$ dominates the denominator and the output shrinks along with the input instead of being blown up. So $\varepsilon$ quietly decides what counts as "too small to bother normalizing", and noise vectors near zero are not amplified into full-size signals.

@fig eps_curve | Output size against input size for RMSNorm. Above the square root of ε, outputs have size 1. Below it, ε takes over and the output shrinks with the input.

### A reference implementation

```python
class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-5):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))       # gamma starts at 1

    def forward(self, x):                                  # x: (B, T, dim), often bf16
        x32 = x.float()                                    # square in fp32
        x32 = x32 * torch.rsqrt(x32.pow(2).mean(-1, keepdim=True) + self.eps)
        return self.weight * x32.type_as(x)                # back to input dtype, then gain
```

Three details in eight lines are worth noticing. The weight starts at all ones, so the norm is a pure rescale at initialization. The input is converted to 32-bit floats before squaring, because in 16-bit formats squaring a moderately large activation can overflow or lose precision. And `rsqrt` computes one over the square root in a single operation, so the division becomes a multiplication.

### Sharp edges of RMSNorm

**Gemma stores γ − 1.** Gemma's RMSNorm computes $x \cdot (1 + \gamma)$, so its saved weights sit near 0 instead of near 1. Load them into ordinary RMSNorm code and every layer's output is multiplied by roughly zero. Check how the weight is applied before porting.

**Squaring in bf16.** Skip the conversion to 32-bit and large activations can overflow when squared, or lose enough precision to change results. Convert before the power, convert back after.

**Weight decay on γ.** Weight decay pulls weights toward zero. For a gain, zero means "silence this channel", which is not a sensible default. Exclude norm weights (and biases, where they exist) from weight decay.

**ε inside or outside the root.** Most code adds $\varepsilon$ inside the square root; some adds it outside. The difference is tiny but enough to make numerical checks against a reference implementation fail. Match the reference exactly.

**The order of the cast and the gain.** Llama's reference casts back to the input type *before* multiplying by $\gamma$; some other code multiplies in 32-bit first. Outputs differ in the last bits, which matters when you are checking a port against reference logits.

:::warn Watch out
"RMSNorm is LayerNorm without the mean" is the right one-line summary, but do not stop there in an interview. Say what it keeps (scale invariance, a per-channel gain) and what it drops (shift invariance, the bias and one reduction), and mention that it is applied per token over the feature dimension, not across the batch. Mixing it up with BatchNorm, which normalizes across the batch, is a common slip.
:::

:::key In one breath
RMSNorm divides each token's vector by its root mean square, $\sqrt{\frac{1}{d}\sum x_i^2 + \varepsilon}$, and multiplies by a learned per-channel gain $\gamma$ (initialized to 1), with no mean subtraction and no bias; $[2, -1, 4, 3]$ becomes $[0.730, -0.365, 1.461, 1.095]$. It keeps the scale invariance that stabilizes deep networks, drops shift invariance that turned out not to matter, and uses one reduction and $d$ parameters instead of two and $2d$ (8,704 norm parameters in Finch-24). Modern models place it pre-norm, sometimes as a sandwich or also on queries and keys (QK-norm); compute it in fp32, keep the trained $\varepsilon$, exclude $\gamma$ from weight decay, and watch for Gemma's $1 + \gamma$ convention.
:::

@part III | SwiGLU: A Gated MLP | The MLP is where each token works on what attention gathered, and it holds most of a block's parameters. Chapter 1's version widened the vector, bent it with GELU, and narrowed it back. SwiGLU makes two widened vectors instead of one and lets one of them act as a smooth on/off switch for the other, feature by feature. This part compares the two designs, runs one token through the gate by hand, shows how the hidden size is chosen to keep the comparison fair, and covers the paper, the family of variants, and the bugs. | where:3

## 12. Two MLPs

Here are the two recipes side by side. The vanilla MLP of Finch-19 and GPT-2 has two matrices. SwiGLU, used by Finch-24, Llama, Mistral, Qwen and most current open models, has three:

$$\text{vanilla: } W_{\text{down}}\, \text{GELU}(W_{\text{up}}\, x) \qquad \text{SwiGLU: } W_{\text{down}} \big( \text{SiLU}(W_{\text{gate}}\, x) \odot W_{\text{up}}\, x \big)$$

Read the SwiGLU version from the inside out. The token's vector $x$ is projected twice, by two different matrices, into two vectors of the same hidden width $h$: the **gate** $W_{\text{gate}} x$ and the **up** projection $W_{\text{up}} x$. The gate passes through SiLU, a smooth switch function. Then the switched gate and the up vector are multiplied together entry by entry, which is what $\odot$ means. Finally the down projection brings the result back to the model width. Modern versions drop all biases.

@fig mlp_vs_swiglu | The vanilla MLP and the SwiGLU MLP for one Finch token. SwiGLU splits the widening into a gate branch and a content branch and multiplies them; its hidden width is smaller to keep the parameter count comparable.

The idea of multiplying one learned projection by a squashed copy of another is called a **gated linear unit**, GLU, introduced by Yann Dauphin and colleagues in 2016 for language modelling with convolutional networks. SwiGLU is the member of that family that uses SiLU as its switch, named in Noam Shazeer's 2020 paper *GLU Variants Improve Transformer*.

## 13. ReLU, GELU and SiLU

An activation function is the "bend" applied to each number in the MLP's hidden layer. Three are worth knowing.

**ReLU**, the rectified linear unit, is the simplest: negative inputs become zero and positive inputs pass unchanged, $\max(0, x)$, with a sharp corner at zero. **GELU**, from Chapter 1, multiplies $x$ by $\Phi(x)$, the probability that a standard bell-curve variable is below $x$; it behaves like a smooth ReLU and dips slightly below zero, to about $-0.17$, for small negative inputs. **SiLU**, the sigmoid linear unit, also called **Swish**, multiplies $x$ by the sigmoid $\sigma(x) = 1/(1 + e^{-x})$, the S-shaped curve that runs from 0 to 1:

$$\text{SiLU}(x) = x \cdot \sigma(x) = \frac{x}{1 + e^{-x}}$$

Some values: $\text{SiLU}(1) = 0.731$, $\text{SiLU}(-1) = -0.269$, and its lowest point is $-0.278$ at $x = -1.28$. For large positive $x$, $\sigma(x) \approx 1$ and SiLU is almost $x$; for large negative $x$, $\sigma(x) \approx 0$ and SiLU is almost 0. So it is a soft switch: "on" for positive inputs, "off" for negative ones, with a smooth transition and no corner. Smooth slopes everywhere make training a little better behaved, because the gradient never jumps.

@fig activations | ReLU, GELU and SiLU. All three pass large positive inputs nearly unchanged and suppress negative ones; GELU and SiLU do it smoothly and dip slightly below zero.

The name Swish comes from a 2017 Google Brain paper by Prajit Ramachandran and colleagues, who found it with an automated search over candidate activation functions; it had been proposed earlier under the name SiLU. The Swish family has a parameter $\beta$, $x \cdot \sigma(\beta x)$; SiLU is $\beta = 1$.

## 14. The Gate in Action

What does the gate do to the numbers? Run one token through a toy SwiGLU with a hidden width of 4. Suppose the gate projection gives $g = [2.0, -3.0, 0.5, 1.0]$ and the up projection gives $u = [1.5, 2.0, -1.0, 0.8]$.

First apply SiLU to the gate: $\text{SiLU}(2.0) = 1.762$, $\text{SiLU}(-3.0) = -0.142$, $\text{SiLU}(0.5) = 0.311$, $\text{SiLU}(1.0) = 0.731$. Then multiply by the up vector entry by entry: $1.762 \times 1.5 = 2.642$, $-0.142 \times 2.0 = -0.285$, $0.311 \times (-1.0) = -0.311$, $0.731 \times 0.8 = 0.585$. So the hidden vector is $h = [2.642, -0.285, -0.311, 0.585]$, which the down projection then maps back to the model width.

@fig gate_elementwise | One token through the gate. Where the gate is strongly negative (unit 1), SiLU nearly closes it and the large up value of 2.0 barely gets through.

In unit 1, the up projection sent a strong value, 2.0. But the gate for that unit was $-3.0$, SiLU turned it into $-0.142$, and the product is a small $-0.285$. The gate decided that this feature should mostly not pass for this token, whatever the content said. In unit 0: gate open (1.762), content 1.5, and a strong 2.642 goes through. The gate decides *whether*; the up vector decides *what*.

### The gate surface

Draw the output $\text{SiLU}(g) \times u$ for every combination of gate value $g$ and up value $u$ from $-3$ to 3. On the left half, where the gate is negative, everything is close to zero: the gate is closed. On the right half the gate is open, and the output follows $u$: positive above the middle, negative below.

@fig gate_surface | The output of one gated unit over a grid of gate and up values. A closed gate (left) gives near zero; an open gate (right) passes the up value through.

A plain activation bends one number. Here two learned numbers work together, one controlling flow and one carrying content, so a single hidden unit can represent "pass this feature only when that condition holds". That multiplicative interaction is the best available explanation for why gated MLPs work better, although, as the next section says, the original paper did not claim to know.

:::story Picture this
Think of a mixing desk with two hands on every channel. One hand sets the fader, how loud the channel is (the up value). The other hand presses or releases the mute button, softly, with a dimmer rather than a click (the SiLU gate). A vanilla MLP has only faders that automatically mute themselves when pulled below zero. SwiGLU lets one learned signal decide the mute for each channel independently of the signal that sets the volume.
:::

## 15. Sizing the Hidden Layer

A third matrix means more parameters, so a fair comparison has to shrink the hidden width. A vanilla MLP with hidden width $4d$ has two matrices of $d \times 4d$, so $8d^2$ weights. SwiGLU has three matrices of $d \times h$, so $3dh$ weights. Setting $3dh = 8d^2$ gives $h = \tfrac{8}{3}d$, about $2.67d$.

That number is then rounded up to a multiple of 256 or 1,024, because GPUs process matrices fastest when their dimensions are multiples of large powers of two. For Finch-24: $\tfrac{8}{3} \times 512 = 1{,}365.3$, which rounds up to 1,536. Llama's code computes it as `int(2 * 4d / 3)` and then rounds up to `multiple_of`. For Llama 2 7B with $d = 4{,}096$: $10{,}922$, rounded up to a multiple of 256, gives 11,008. Llama 3 8B multiplies by an extra factor of 1.3 first, giving 14,198, and rounds up to a multiple of 1,024: 14,336. That is 3.5 times the width, and why "the MLP is $4d$" is wrong for modern models.

$$h = \text{multiple\_of} \cdot \left\lceil \frac{\text{mult} \cdot \lfloor 8d/3 \rfloor}{\text{multiple\_of}} \right\rceil$$

@fig hidden_sizing | Choosing the hidden width. Two thirds of 4d keeps the parameter bill equal to a vanilla MLP; rounding up for GPU efficiency adds a little. Finch-24 lands at 1,536.

For Finch-24 the rounding costs something: three matrices of $512 \times 1{,}536$ hold 2,359,296 weights against the vanilla MLP's 2,097,152, 12.5% more. With the exact width of 1,365 the two would be within 0.03% of each other. For Llama 3 8B the MLP holds $3 \times 4{,}096 \times 14{,}336 = 176{,}160{,}768$ weights per block, which Part VII shows is about 81% of the whole block.

## 16. The Family, the Paper and the Code

### The GLU family

SwiGLU is one member of a family that all compute $(\text{switch}(xW) \odot xV)\,W_2$ and differ only in the switch applied to the gate. **GLU** uses the sigmoid itself, a switch between 0 and 1. **Bilinear** uses no switch at all, just the product of two projections. **ReGLU** uses ReLU. **GEGLU** uses GELU. **SwiGLU** uses SiLU.

@fig glu_family | The gated linear unit family. All share the same shape and multiply a gated projection by an ungated one; only the switch on the gate differs.

### What the paper found

Shazeer's 2020 paper trained the same Transformer with each MLP variant on the same data and compared their log-perplexity, lower being better. After 65,536 training steps the plain MLPs scored worst: ReLU 1.997, Swish 1.994, GELU 1.983. Every gated variant beat them: GLU 1.982, Bilinear 1.960, ReGLU 1.953, SwiGLU 1.944 and GEGLU 1.942. The differences look small, but in language modelling a few hundredths of log-perplexity is the kind of gain people spend months chasing, and it came at no extra parameter cost.

@fig glu_results | Results from Shazeer (2020). Gated variants beat plain MLPs, with GEGLU and SwiGLU best. The axis starts at 1.93 so the gaps are visible.

The paper is famously candid about why. Its conclusion says: "We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence." The gain has held up in every major model family since, which is why SwiGLU became the default even without a satisfying theory.

:::interview Interview lens
**"Why is the SwiGLU hidden size about 8/3 of d instead of 4d?"** SwiGLU has three weight matrices (gate, up, down) instead of two, so to keep the parameter count equal to a $4d$ vanilla MLP, $3dh = 8d^2$, which gives $h = \tfrac{8}{3}d$. Implementations then round up to a multiple of 256 or 1,024 for GPU efficiency, and some apply an extra multiplier; Llama 3 8B ends up at 14,336 for $d = 4{,}096$. Always read `intermediate_size` from the config.
:::

### Fusing gate and up

Gate and up both take the same input $x$. So instead of two matrix multiplications, code can do one, with a matrix twice as wide, and cut the result in half. One large multiply keeps the GPU busier and reads $x$ once instead of twice.

@fig fused_gate_up | Gate and up fused into one 512 × 3,072 matrix. One multiply, then the output is split into the gate half and the up half.

```python
class SwiGLU(nn.Module):
    def __init__(self, d=512, h=1536):
        super().__init__()
        self.gate_up = nn.Linear(d, 2 * h, bias=False)   # fused W_gate and W_up
        self.down = nn.Linear(h, d, bias=False)

    def forward(self, x):                                # x: (B, T, 512)
        g, u = self.gate_up(x).chunk(2, dim=-1)          # each (B, T, 1536)
        return self.down(F.silu(g) * u)                  # (B, T, 512)
```

### Sharp edges of SwiGLU

**The hidden size is not 4d.** It is usually between 2.7 and 3.5 times $d$. Guessing it from $d$ gives the wrong shapes, and the weights will not load.

**Swapped halves.** With a fused matrix, which half is the gate and which is the up projection depends on how the checkpoint was saved. Swap them and the model still runs, because both halves have the same shape, but it computes $\text{SiLU}(u) \odot g$ and quality collapses.

@fig swiglu_swap_effect | Swapping gate and up changes the answer even though their shapes match. With illustrative scalar projections g = −3 and u = 2, SiLU(g) × u is −0.285, while SiLU(u) × g is −5.285, rounded to three decimals. These are hidden activations before the down projection.

**More activation memory.** During training, the backward pass needs both $g$ and $u$, so SwiGLU stores two hidden-width vectors per token instead of one. Activation checkpointing or fused kernels that recompute the gate help.

**No biases.** Modern MLPs drop biases entirely. Code that adds them anyway will not match the trained weights.

**Names vary.** The same three matrices are called `w1`, `w3`, `w2` in Meta's code (gate, up, down respectively, which surprises people), and `gate_proj`, `up_proj`, `down_proj` in Hugging Face's. Map them explicitly when converting.

:::warn Watch out
In Meta's Llama code the forward pass is `w2(silu(w1(x)) * w3(x))`: `w1` is the gate, `w3` is the up projection and `w2` is down. People who assume the numbering follows the order of use get gate and up backwards. The shapes of `w1` and `w3` are identical, so nothing complains.
:::

:::key In one breath
SwiGLU replaces the two-matrix GELU MLP with three bias-free matrices: $W_{\text{down}}(\text{SiLU}(W_{\text{gate}}x) \odot W_{\text{up}}x)$, where $\text{SiLU}(x) = x\,\sigma(x)$ is a smooth switch, so one projection gates the other feature by feature (a gate value of $-3$ becomes a multiplier of only $-0.142$). To keep parameters comparable the hidden width is $\tfrac{8}{3}d$ rounded up (1,536 for Finch-24, 11,008 for Llama 2 7B, 14,336 for Llama 3 8B with an extra 1.3), giving $3dh$ weights per block. Shazeer (2020) found gated variants beat plain MLPs (SwiGLU 1.944 versus ReLU 1.997 log-perplexity) without a theory why; implementations fuse gate and up into one matmul, and the common bugs are wrong hidden size and swapped gate/up halves.
:::

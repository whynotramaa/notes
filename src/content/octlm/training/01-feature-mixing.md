@part I | Feature computation, now seen from training | This part connects the existing decoder explanations to learning. The FFN and its gate must carry derivatives as well as activations, or their parameters cannot improve. We will use the earlier architecture sections as references, then inspect nonlinear gradients and SwiGLU's training cost. | where:1

## 1. Feed-forward networks

Suppose *bank* has already collected context from *river*. The architectural reason to process that context locally is covered in [why attention has an FFN beside it](/octlm/attention/12-decoder-block/#s63). Attention emphasizes **token mixing**, communication across positions; the FFN emphasizes **feature mixing**, transformation within each contextual token vector. Attention's own projections and input-dependent weights also transform features, so "attention is linear" is not a sound argument for needing an FFN.

### Standard Transformer FFN, expansion and projection back

Use [the standard FFN and its parameter count](/octlm/attention/12-decoder-block/#s67) for the complete mechanism: project width $d$ to an **intermediate dimension** $f$, activate, then project back to $d$ before the residual addition. The function is shared across positions, while different blocks have different parameters. Its output remains `B × T × d`; expansion creates feature channels, not additional tokens. For Finch-19 the two matrices and biases have 2,099,712 parameters per block, as counted in that section.

### Activation functions and the backward route

The training question is what the nonlinear operation does to a correction signal. An **activation function** changes a projected coordinate nonlinearly. Its derivative also changes the correction sent to the expansion matrix. ReLU sends zero derivative through a negative preactivation; SiLU has a smooth derivative that can be negative in part of its input range. A gate that looks nearly closed is not automatically a branch that never learns.

$$
\operatorname{SiLU}'(u)=\sigma(u)+u\sigma(u)\big(1-\sigma(u)\big),\qquad \sigma(u)=\frac{1}{1+e^{-u}}.
$$

Read this as: the derivative of SiLU at preactivation $u$ is its sigmoid plus $u$ times the sigmoid times one minus that sigmoid. At illustrative values $u=[-2,0,2]$, the derivatives are $[-0.090784,0.5,1.090784]$. A loss gradient arriving at an activated coordinate is multiplied by that local derivative. The smooth curve does not promise that all derivatives are positive or below one.

@fig train_activation_backward | Calculated SiLU derivatives at three illustrative preactivations. Orange marks the local multipliers that transform a gradient; a negative preactivation can still receive a nonzero correction.

The standard FFN's matrix multiplication gradient also collects contributions from every input position that used the matrix. For illustrative input rows $[1,2]$ and $[3,4]$, and scalar output gradients $0.5$ and $-0.25$, a shared column's weight gradient is $[1,2]\times0.5+[3,4]\times(-0.25)=[-0.25,0]$. The contributions add because the same weight participates twice. Parallel token processing does not create independent weight copies.

@fig train_ffn_shared_gradient | Two illustrative positions contribute to one shared projection gradient. The orange sum is the update signal for one weight column, not a separate column for each token.

:::story Picture this
Several customers use the same pricing rule. An error on each receipt tells you how that rule should change, and you combine those corrections before replacing the rule. FFN weights are shared in that sense: every position contributes evidence about the same transformation.
:::

## 2. From GELU to SwiGLU

A gate changes the derivative route as well as the forward value. For the architecture itself, follow [ReLU, GELU, SiLU and Swish](/octlm/modern-arch/03-swiglu/#s13), [GLU and SwiGLU's gate](/octlm/modern-arch/03-swiglu/#s14), and [the family and implementation](/octlm/modern-arch/03-swiglu/#s16). These sections define the activation curves, gating intuition, and the separate gate, up and down projections. Swish with its parameter set to one equals SiLU; the general Swish family allows a different parameter.

### Gating, three projections and intermediate width

The two expanded branches carry content and a learned SiLU factor, and the third projection returns their product to the residual width. The [intermediate-width derivation](/octlm/modern-arch/03-swiglu/#s15) compares $3df$ SwiGLU weights with $8d^2$ weights in a bias-free standard FFN. Finch-24's selected $f=1,536$ has 2,359,296 FFN weights per block, 12.5% more than the bias-free Finch-19 FFN. Rounding means these configurations are not an exact equal-budget experiment.

### Why the two branches both learn

Let gate preactivation be $g$, up value be $u$, and their product be $a=\operatorname{SiLU}(g)u$. Let $r$ be the loss derivative arriving at that product from the down projection. The local derivatives are:

$$
\frac{\partial\mathcal L}{\partial g}=r\,u\,\operatorname{SiLU}'(g),\qquad
\frac{\partial\mathcal L}{\partial u}=r\,\operatorname{SiLU}(g).
$$

Read this as: the gate's correction is the incoming derivative $r$ multiplied by the content and the slope of SiLU; the content's correction is $r$ multiplied by the gate's activated value. These are scalar formulas applied independently to each expanded coordinate. The two projection matrices then receive gradients through their ordinary matrix multiplies.

For illustrative $g=-2$, $u=3$ and $r=1$, the forward product is $-0.715218$. The gate correction is $3\times(-0.090784)=-0.272353$, and the content correction is $-0.238406$. Neither is zero. Swapping the branches changes both the output and this derivative route.

@fig train_gate_backward | One illustrative SwiGLU coordinate splits an incoming gradient into different gate and content corrections. The multipliers come from the product rule and the calculated SiLU derivative.

### SwiGLU versus a standard FFN during training

The [original gated-FFN experiments](https://arxiv.org/abs/2002.05202) support the use of gated variants under their controlled setup. Llama 3's [reference implementation](https://github.com/meta-llama/llama3/blob/main/llama/model.py) provides a specific modern example. This does not establish that SwiGLU is best for every workload, or that a model's architecture is modern merely because its activation has that name. We will test architectural choices with seed spread and controlled budgets in Part VIII.

For the example batch, each Finch-24 expanded branch has $2\times8\times1,536=24,576$ elements, or 49,152 BF16 bytes. Gate and up together occupy 98,304 bytes before counting the product, saved intermediates, gradients or kernel temporaries. This named-tensor count is not peak memory. Fused kernels or activation recomputation can change which intermediates survive for backward.

@fig train_ffn_storage | Two named BF16 expansion tensors in one Finch-24 FFN. Each contains 24,576 values, or 49,152 bytes; the combined 98,304-byte subtotal excludes the product and other saved state.

:::note Fused does not mean tied
Combining gate and up into one matrix multiply changes scheduling and layout. It does not share their learned entries or remove one branch's parameter count. Weight tying in Part II is a different operation.
:::

:::warn Watch out
A SiLU gate is not a probability and does not always attenuate content. It can be negative or exceed one, and its derivative has a separate shape. Read the checkpoint's branch ordering and activation convention before using the existing block code.
:::

:::interview Interview lens
**"How does the gradient split at a SwiGLU product?"** The gate branch receives the incoming gradient times the up value times SiLU's derivative; the up branch receives it times the activated gate. Both branches then differentiate their projections using the same token input. Forward gating can reduce a feature without eliminating all learning in its gate branch, and every position's matrix gradient adds into the same shared parameters.
:::

:::key In one breath
The earlier chapters explain feature mixing and the three-projection SwiGLU architecture; training adds shared parameter gradients and saved activation cost. SiLU's derivative is $\sigma(u)+u\sigma(u)(1-\sigma(u))$. At a gate product, the content multiplies the gate's derivative route, while the activated gate multiplies the content's route. Finch-24's gate and up example tensors each require 49,152 BF16 bytes, before the rest of backward's state.
:::

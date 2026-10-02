@part V | LoRA as a small correction | This part changes a projection without training all of its weights. The saving comes from restricting the update, so memory and capacity must be considered together. We will count full-training state, factor a small update, follow its forward pass, and explain scaling and initialization. | where:5

## 27. Full fine-tuning

A weight needs more company in training than in inference: its gradient and the optimizer's running statistics. A model that fits for generation can fail to fit for training.

### Updating all parameters and compute cost

**Full fine-tuning** makes all selected parameters trainable, normally all of them. The forward pass predicts, backpropagation computes gradients, and the optimizer updates weights. The forward pass is a full decoder computation however small the dataset.

### Memory cost and optimizer-state cost

An **optimizer state** is information kept between updates. Adam keeps first and second moment estimates per trainable parameter. Counting weights, gradients, and both moments in FP32 at 4 bytes each gives `4 + 4 + 4 + 4 = 16` bytes per parameter, before activations and temporaries.

$$
M_{\mathrm{state}} = P(b_W+b_G+b_m+b_v).
$$

Read this as parameter-state memory is the parameter count $P$ times the bytes for a weight, its gradient, and the two moments. It describes this accounting convention, not every mixed-precision optimizer.

For Finch-24, `40,509,952 × 16 = 648,159,232` bytes. Mixed precision may keep low-precision weights plus a high-precision master copy, changing the terms. Activations depend on batch, sequence length, checkpointing, and kernels, and are extra.

@fig lora_memory_ledger | Computed Finch-24 parameter-state payload under two stated conventions. Full training uses FP32 weights, gradients, and Adam moments; LoRA uses BF16 frozen weights and FP32 adapter state. Neither row includes activations.

## 28. Parameter-efficient fine-tuning

The stockroom task needs a small tool vocabulary and a consistent protocol. Updating every feature may be unnecessary, and storing a full model copy per specialization is expensive.

### PEFT, adapters, and why LoRA exists

**Parameter-efficient fine-tuning**, or PEFT, trains a subset of parameters or a small added set. An **adapter** is a trainable component attached to a fixed model. PEFT methods differ in what they change; the term is not a synonym for LoRA.

**Low-rank adaptation**, or LoRA, adds a factored correction to a weight matrix and keeps the original fixed. Hu and colleagues introduced it in 2021 as a useful restriction on adaptation, not a proof that all updates are low rank. [LoRA paper](https://arxiv.org/abs/2106.09685).

Our all-projection Finch adapter trains 606,208 parameters beside the 40,509,952 frozen ones. In 16 bits it stores `606,208 × 2 = 1,212,416` bytes instead of another full checkpoint.

Training still runs the base forward pass, and gradients still flow through frozen layers to reach earlier adapters. LoRA removes base gradients and base optimizer state, but activations and most decoder compute remain. Its memory saving is easier to predict than its speedup.

:::story Picture this
An audio engineer keeps the original mix and adds a small correction track, changing the final signal without rerecording every instrument. LoRA adds a trainable branch to a fixed projection in the same spirit, though its correction is a restricted matrix product.
:::

## 29. LoRA intuition

A projection already encodes useful language patterns, and we want it to adapt to tool calls without replacing it. Write the effective matrix as the old one plus a learned correction.

### Frozen base weights and low-rank updates

**Frozen weights** take part in the forward pass but get no optimizer updates. A **low-rank update** expresses change through fewer independent directions than a general dense matrix. For a projection from width $d_{\mathrm{in}}$ to $d_{\mathrm{out}}$, LoRA learns factors $A$ and $B$ instead of every entry.

$$
W' = W + \Delta W, \qquad \Delta W = sBA.
$$

Read this as the effective weight is the frozen weight plus correction $sBA$. With column vectors, $W$ is `d_out × d_in`; libraries may store the transpose for the same map.

### Why low rank can be enough

Adapting a trained representation may need far fewer directions than learning it from scratch. A small rank can still touch every output coordinate; it does not mean only a few rows change, nor that the capacity suffices for every task.

@fig lora_frozen_branch | A schematic projection adds a trained correction to the frozen path. Grids show shapes at a small schematic size, not Finch-24's full dimensions.

A rank-one update to a `4 × 4` matrix has 8 factor entries instead of 16, at the cost of routing every correction through one scalar feature. Section 35 treats how many features a task needs as a validation question.

## 30. Low-rank factorization

A matrix with many entries can describe a change built from one shared feature. What matters is how many independent directions the update can express, not how many entries are nonzero.

### Matrices A and B, rank r, and shape intuition

The **rank** $r$ is the width of the adapter's intermediate representation. $A$ is `r × d_in`, mapping the input to $r$ features; $B$ is `d_out × r`, expanding them back. Their product is `d_out × d_in` with rank at most $r$.

$$
P_{\mathrm{LoRA}}=r(d_{\mathrm{in}}+d_{\mathrm{out}}), \qquad P_{\mathrm{dense}}=d_{\mathrm{in}}d_{\mathrm{out}}.
$$

Read this as the adapter stores rank times the sum of the widths, while a dense matrix stores their product. It saves parameters only when the first is smaller.

### Parameter savings

Finch-24's `512 × 512` query projection has 262,144 weights. At rank 8 the factors hold `8 × 512 + 512 × 8 = 8,192`, which is 32 times fewer.

@fig lora_factorization_geometry | An illustrative `4 × 4` rank-one correction uses a `4 × 1` and a `1 × 4` factor. The computed count falls from 16 dense entries to 8 factor entries.

The key projection is rectangular, 512 in and `2 × 64 = 128` out, so rank 8 costs `8 × (512 + 128) = 5,120`. Treating it as square would overstate the adapter, so read actual module shapes before totaling.

## 31. LoRA forward pass

Take input $x=[2,1]^\top$ and an identity base matrix, so $Wx=[2,1]^\top$, and follow a tiny adapter through every value.

### Base projection, adapter branch, and combining outputs

With `A = [[1, 2]]` and `B = [[3], [4]]` (rank 1), `Ax = 1 × 2 + 2 × 1 = 4` and `B(Ax) = [12, 16]`. At scale 2 the correction is `[24, 32]`, and the output is `[26, 33]`.

$$
y = Wx + sB(Ax).
$$

Read this as the output is the base projection plus the scaled adapter projection. Computing $Ax$ first avoids building a dense $BA$ during unmerged inference.

@fig lora_toy_multiply | Every intermediate value in this illustrative rank-one forward pass is computed. The identity base matrix makes its contribution visible.

### Training only adapter parameters

For a `2 × 8 × 512` batch, a rank-8 Finch query adapter makes a `2 × 8 × 8` intermediate and a `2 × 8 × 512` correction. Base output and correction must match in shape, device, and dtype. Square matrices can hide a transpose bug, so check the rectangular key and value projections.

The optimizer gets only the factors and any explicitly chosen extras. Freezing $W$ stops updates to $W$, not gradient flow through it; gradients still pass to the input and upstream adapters.

## 32. LoRA scaling

Doubling rank changes both the number of features and how their output is scaled. A comparison that silently changes the effective scale confuses capacity with update size.

### Rank, alpha, and alpha/r

The original convention sets scale $s=\alpha/r$ from an **alpha** parameter. Finch-24's adapter uses rank 8 and alpha 16, so `16 / 8 = 2`; Section 31's toy used rank 1 and alpha 2 for the same scale.

$$
s = \frac{\alpha}{r}.
$$

Read this as the correction multiplier is alpha over rank. Alpha is a scale setting, not rank or learning rate, and it changes both the forward correction and the gradients through it.

### Controlling update magnitude

At `alpha=16`, ranks 4, 8, and 16 give scales 4, 2, and 1. Learned correction norms need not follow those ratios, since training moves $A$ and $B$. Record rank and scale together, and judge by validation, not by treating alpha as a quality dial.

@fig lora_scale_by_rank | Computed scales for three ranks at alpha 16. More adapter features come with a smaller multiplier, so rank and scale must be reported together.

Some methods divide by $\sqrt r$ instead. Load the convention used in training: applying the wrong one changes the function even when the tensors load cleanly. PEFT records these options in its [LoRA configuration reference](https://huggingface.co/docs/peft/v0.21.0/package_reference/lora).

:::note Scale is part of the artifact
An adapter is more than two sets of matrices. Rank, scaling, target modules, base checkpoint identity, and any extra trained parameters define the model, and missing metadata can make a loadable adapter numerically wrong.
:::

## 33. LoRA initialization

Attaching an adapter to a trained model should leave its outputs unchanged at first. A random correction would shift behavior before the first step and muddy the baseline comparison.

### Initializing A, initializing B, and base equivalence

**Initialization** sets parameters before training. The common LoRA choice is random nonzero $A$ and zero $B$, so `BA = 0` and `W + sBA = W` at attachment. Other schemes exist; this chapter uses this one.

It also shapes the first backward pass. With $B=0$, the gradient for $A$ contains $B$ and is zero, while the gradient for $B$ is nonzero because $A$ is. If both start at zero, both gradients are zero and the adapter never starts learning.

@fig lora_zero_initialization | Schematic factor grids show a zero correction at attachment time. Random-grid shades are illustrative; every entry of the zero factor is exactly zero.

Check attachment by comparing base and adapted logits in evaluation mode with the same numerics. Dropout, changed precision, or a modified template can cause differences unrelated to the correction, so disable stochastic layers and record the tolerance.

$BA=0$ makes the functions equal mathematically, but measure anyway: replacement-module bugs can transpose weights, double the scale, or alter a bias. Section 69 applies the same check to merging, where floating-point arithmetic adds more differences.

:::warn Watch out
Do not wrap the whole frozen model in a no-gradient region during adapter training; that cuts the gradient path the adapters need. Freeze base parameters individually and let gradients flow through the graph.
:::

:::interview Interview lens
**"Why initialize only one LoRA factor to zero?"** Zero $B$ makes the initial correction zero, so the model starts as the base. Nonzero $A$ gives $B$ a useful gradient on the first step. With both at zero, each factor's gradient depends on the other's zeros and learning stalls. Once $B$ moves, $A$ gets gradient too.
:::

:::key In one breath
LoRA adds $sBA$ to a frozen projection and trains the two factors. It costs $r(d_{\mathrm{in}}+d_{\mathrm{out}})$ parameters and runs as $Wx+sB(Ax)$ unmerged. The original scale is $\alpha/r$, and nonzero $A$ with zero $B$ starts from the base function. It saves parameter state, not decoder compute or activation memory.
:::

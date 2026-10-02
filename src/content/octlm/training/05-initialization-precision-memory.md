@part V | Keeping learning inside numerical limits | This part treats the model as a finite-precision computation stored on a device. Initialization sets the starting scale, while dtype and saved state determine which gradients survive and how much memory training needs. We will calculate variance, floating-point range, mixed precision and a tensor-by-tensor memory ledger. | where:5

## 15. Initialization

Give every neuron the same starting weights and the same inputs, and their derivatives can remain the same. Make random weights too large and activations or attention scores may begin at an unhelpful scale. Initialization must both distinguish the learned features and keep the first forward and backward passes usable.

**Initialization** is the rule for assigning parameters before training begins. **Random initialization** samples selected weights from a declared distribution. It breaks the symmetry between otherwise identical channels; a fixed random seed chooses a repeatable sample. Other parameters can have deterministic initial values: RMSNorm gains often start at one, and biases, when present, may start at zero. "Initialize everything randomly" is not the rule.

**Variance** measures the average squared deviation from a mean. Under an illustrative independence model, the variance of a sum is the sum of variances. For a projected coordinate $y=\sum_{i=1}^{n}w_i x_i$, independent zero-mean weights and inputs give:

$$
\operatorname{Var}(y)=n\,\operatorname{Var}(w)\operatorname{Var}(x).
$$

Read this as: the projected coordinate's variance equals the number of input terms $n$ times a weight's variance times an input coordinate's variance. This equation assumes independent terms with the same variance; learned vectors need not satisfy that assumption. It explains why weight scale should account for the number of incoming coordinates.

### Xavier and Kaiming intuition

**Fan-in** is the number of input coordinates feeding an output; **fan-out** is the number of outputs receiving an input. **Xavier initialization** balances forward and backward variance using both fan-in and fan-out. **Kaiming initialization** accounts for the effect of a rectifier such as ReLU, whose positive-half selection changes the variance calculation. Neither formula is a universal optimal Transformer recipe.

$$
\sigma_{\text{Xavier}}=\sqrt{\frac{2}{n_{\text{in}}+n_{\text{out}}}},\qquad
\sigma_{\text{Kaiming,ReLU}}=\sqrt{\frac{2}{n_{\text{in}}}}.
$$

Read this as: with gain one, Xavier-normal weights have standard deviation equal to the square root of two divided by the input-plus-output counts; a fan-in ReLU Kaiming-normal choice has standard deviation equal to the square root of two divided by the input count. These specify a normal-distribution example, not the bounds for the related uniform initializers.

For a Finch-24-shaped $512\to1,536$ projection, the illustrative Xavier standard deviation is $\sqrt{2/2,048}=0.03125$. The ReLU Kaiming value is $\sqrt{2/512}=0.0625$. SwiGLU also multiplies two branches and uses SiLU, so importing a ReLU argument unchanged would miss that product. A model's trained initialization recipe must be assessed with its activation, norm placement and depth. [Glorot and Bengio's 2010 work](https://proceedings.mlr.press/v9/glorot10a), [He and colleagues' rectifier analysis](https://arxiv.org/abs/1502.01852), [PyTorch initializer conventions](https://docs.pytorch.org/docs/stable/nn.init.html).

@fig train_init_variance | An illustrative projection sums 512 weighted inputs. The fan-in term explains why the weight distribution's variance must depend on width; the figure does not assume trained coordinates stay independent.

### Transformer-specific scaling and the residual path

The [earlier residual discussion](/octlm/attention/12-decoder-block/#s68) introduces depth scaling for projections that write into the stream. Finch-24 has two residual additions per block and eight blocks, giving 16 additions. In a toy model with starting stream variance one and 16 independent unit-variance branch contributions, final variance would be 17. Scaling each contribution's standard deviation by $1/\sqrt{16}=0.25$ reduces its variance to $1/16$, so the final variance becomes two.

For an illustrative base weight standard deviation of 0.02, that residual-write scaling gives 0.005. It is a depth-aware initialization example, not a verified universal choice for every Llama-like architecture. Independence and equal contribution variance are a model for intuition; normalization, correlations and learning alter the actual trajectory.

@fig train_residual_init | A calculated independence model compares 16 unscaled residual contributions with contributions scaled by one-quarter in standard deviation. Variance totals are 17 and 2, not measurements from a trained Finch-24 run.

Initialization affects early logit variance, gradient size and optimizer transients. Warmup can help with those transients, but cannot undo a missing mask or an incorrectly loaded parameter. When using a pretrained checkpoint, its learned values replace the initialization; creating and then reinitializing a tied head can accidentally overwrite the embedding too.

## 16. Precision in neural-network training

A weight of one needs a very small change, but the chosen numeric format may round that change away. Another activation may be representable until squaring it exceeds the format's range. These are different failures: too few nearby representable values and too small a permitted magnitude range.

**Floating point** stores a sign, an exponent that determines scale, and a fraction that gives detail within that scale. **FP32** is a common 32-bit format. **FP16** is the IEEE half format, and **BF16**, bfloat16, uses a wider exponent and shorter fraction than FP16 while keeping the same total storage size. **Numeric range** is the span of magnitudes a format can represent. **Precision** describes how finely it resolves nearby numbers at a given scale.

| Property | FP32 | FP16 | BF16 |
|---|---|---|---|
| Bits per scalar | 32 | 16 | 16 |
| Bytes per scalar | 4 | 2 | 2 |
| Exponent bits | 8 | 5 | 8 |
| Stored fraction bits | 23 | 10 | 7 |
| Largest finite value | $3.402823\times10^{38}$ | 65,504 | $3.389531\times10^{38}$ |
| Smallest positive normal | $1.175494\times10^{-38}$ | $6.103516\times10^{-5}$ | $1.175494\times10^{-38}$ |
| Spacing from 1 toward 2 | $1.192093\times10^{-7}$ | 0.0009765625 | 0.0078125 |

The spacing is local, not a constant absolute error at every magnitude. BF16 has approximately FP32's exponent range but far less precision. FP16 has more fraction bits than BF16 but a much narrower range. Neither format is uniformly "more accurate" across all possible computations.

@fig train_float_formats | The bit allocations explain the tradeoff. BF16 spends more bits on exponent range, while FP16 spends more on the fraction; both store two bytes per scalar.

**Overflow** occurs when a computed magnitude exceeds the representable finite range. **Underflow** concerns magnitudes near or below the smallest representable positive values. **Subnormal values** fill a small range below the normal minimum with reduced relative precision; actual kernels may flush them to zero. FP16's smallest positive subnormal is $2^{-24}=5.960464\times10^{-8}$. An illustrative gradient of $10^{-8}$ rounds to zero when cast to FP16 under ordinary nearest rounding, even though FP32 represents it.

A stable softmax subtracts its row maximum to prevent an avoidable exponent overflow. A norm can compute squares and reductions in FP32. These targeted choices are more useful than casting the whole training program to FP16 and hoping the same algorithm survives. Precision errors can accumulate, and floating-point addition is not associative: reordering a reduction can change its rounded result.

@fig train_precision_spacing | Computed representable steps above one compare FP16 with BF16 on the same numeric interval. Wider BF16 spacing is the price of its larger exponent range at the same storage size.

## 17. Mixed-precision training

The model spends much of its work multiplying large matrices. Lower-precision inputs can use less memory bandwidth and, on suitable accelerators, faster matrix hardware. We still want enough range for sensitive operations and enough detail to accumulate small parameter changes. Using different precisions for different jobs is the basic solution.

**Mixed-precision training** evaluates selected operations in lower precision while keeping other operations or stored values at higher precision. **Autocast** chooses operation dtypes according to the framework's policy inside a region. It is not an instruction that every operation, gradient and optimizer buffer becomes 16-bit. Hardware support, tensor dimensions, kernel choice and the rest of the workload determine any speed benefit.

### Lower-precision forward and FP32 values

A common PyTorch setup keeps the model parameters in FP32 and uses `torch.amp.autocast` for the forward and loss region. Selected linear operations use BF16 or FP16 representations; sensitive operations can remain or be explicitly performed in FP32. Backward follows the dtypes of the recorded operations; running backward outside the autocast region is the documented pattern. A matrix multiply may accumulate internally at higher precision on suitable hardware, but that is a kernel contract, not a property of every low-precision operation. [Current autocast documentation](https://docs.pytorch.org/docs/stable/amp.html).

```python
with torch.amp.autocast("cuda", dtype=torch.bfloat16):
    logits = model(x)                              # (B, T, V)
    loss = F.cross_entropy(logits.float().reshape(-1, V), y.reshape(-1))
loss.backward()
```

**FP32 master values** are high-precision parameter values retained for updates when a separate low-precision parameter copy is used for computation. In the FP32-parameter autocast setup, the persistent FP32 parameters already fill that role; another full FP32 copy is not inherently necessary. Directly storing BF16 parameters and using a custom optimizer can choose a different state layout. Check the implementation instead of inferring it from the word "mixed."

For an illustrative weight 1 and decrement 0.0001, the FP32 result is 0.9999, which rounds back to one in BF16. Repeating updates directly on the rounded BF16 value can keep losing such a change. A retained FP32 value can accumulate it before producing a BF16 computation copy. This illustrates rounding loss in updates, not a claim that every BF16-training implementation must use the same master-copy arrangement.

@fig train_master_values | An illustrative small update survives in a stored FP32 value but can disappear in a directly rounded BF16 parameter. Master values retain changes that the computation copy cannot yet resolve.

### Loss scaling and dynamic loss scaling

**Loss scaling** multiplies the loss by a factor $S$ before backward, producing gradients scaled by $S$ as well. The optimizer must see gradients divided by the same factor. This helps FP16 gradients avoid rounding to zero in the lower range; it does not create more information than the computation supplies.

$$
\nabla_\theta(S\mathcal L)=S\nabla_\theta\mathcal L,\qquad g=\frac{g_{\text{scaled}}}{S}.
$$

Read this as: differentiating a loss multiplied by constant scale $S$ multiplies every parameter derivative by $S$; divide the resulting gradient by $S$ to recover the intended correction. In exact arithmetic this is algebraically neutral. Rounding makes the intermediate range change useful.

An illustrative gradient $10^{-8}$ scaled by 65,536 becomes 0.00065536, within FP16's normal range. Unscaling must happen before clipping, or the threshold applies to the enlarged gradient. **Dynamic loss scaling** adjusts $S$ in response to finite and nonfinite gradients: a scaler can skip an overflowing update and reduce the scale, then grow it after a finite interval. It does not fix all causes of NaNs.

@fig train_loss_scaling | A calculated illustrative FP16 gradient is enlarged before the limited-range stage and reduced before the optimizer. Overflow detection can skip the update; clipping belongs after unscaling.

```python
scaler = torch.amp.GradScaler("cuda")
with torch.amp.autocast("cuda", dtype=torch.float16):
    loss = compute_loss(model(x), y)
scaler.scale(loss).backward()
scaler.unscale_(optimizer)
torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
scaler.step(optimizer)
scaler.update()
```

BF16 usually does not need FP16-style loss scaling because its exponent range is much wider. That does not make BF16 overflow, rounding or poor optimization impossible. Use the current `torch.amp` interface rather than the deprecated `torch.cuda.amp` forms. Micikevicius and colleagues' [mixed-precision paper](https://arxiv.org/abs/1710.03740) explains master copies and loss scaling; their arrangement is one specific memory design.

:::note Precision beyond this baseline
FP8 and FP4 training paths exist on supported hardware and software, with their own tensor scaling and accumulation policies. They are not interchangeable with simply setting this autocast region to another dtype. The [Transformer Engine guide](https://docs.nvidia.com/deeplearning/transformer-engine-releases/release-2.13/user-guide/examples/fp8_primer.html) documents such formats and recipes. FP32/BF16/FP16 remain the formats needed to understand this chapter's baseline and its memory calculations.
:::

## 18. GPU memory during training

Finch-24's BF16 weights occupy 81,019,904 bytes. That number is a useful inference subtotal, but it does not describe a full AdamW training run. The update has companions: gradients, moment estimates, forward values saved for backward, and temporary work buffers.

An **optimizer state** is persistent history used by the update rule, such as Adam's $m$ and $v$. **Activations** are tensors computed from input data inside the forward pass. An **activation checkpoint** saves selected values and recomputes other forward operations during backward, trading extra computation for less saved activation memory. This differs from a disk training checkpoint, which Part VI will explain.

### A named-tensor ledger

In a full FP32 parameter/gradient/Adam-moment layout, there are four 4-byte values per learned scalar: the parameter, gradient, first moment and second moment. That gives $16P=648,159,232$ bytes for Finch-24, or 618.133 MiB after rounding. Optimizer moments are commonly allocated when a parameter first receives an update, so measuring before the first step can undercount steady-state memory.

| Declared layout | Bytes per parameter | Finch-24 persistent subtotal |
|---|---|---|
| BF16 weights only | 2 | 81,019,904 bytes |
| FP32 weights only | 4 | 162,039,808 bytes |
| FP32 weights, gradients, FP32 Adam moments | 16 | 648,159,232 bytes |
| Separate 16-bit weights, FP32 master, FP32 grads and moments | 18 | 729,179,136 bytes |
| Separate 16-bit weights and grads, FP32 master and moments | 16 | 648,159,232 bytes |

The last two rows describe particular storage arrangements, not a universal AMP allocation formula. Autocast's FP32-parameter layout can use the third row's persistent tensors plus temporary casts. Moment dtype, gradient dtype, offload and optimizer implementation change the count. The table also excludes non-parameter buffers, allocator reserves and all activations.

@fig train_memory_ledger | Finch-24's full FP32 AdamW layout stores four equal-size named arrays. The 648,159,232-byte subtotal excludes saved activations, temporary tensors and allocator overhead.

### Batch size and sequence length

A single Finch-24 residual tensor at `B=2, T=8` contains 8,192 values, or 16,384 BF16 bytes. A single expanded SwiGLU branch contains 24,576 values, or 49,152 bytes. These scale linearly with $BT$, but a materialized attention-score tensor scales with $BHT^2$. Our tiny score tensor occupies 2,048 BF16 bytes; at `B=2, H=8, T=4096`, one such tensor is 536,870,912 bytes, or 512 MiB, for one layer.

@fig train_memory_growth | Calculated named-tensor counts separate linear activation growth from quadratic materialized attention scores. Fused attention avoids saving the complete score grid; it does not remove the dense attention arithmetic.

The [FlashAttention chapter](/octlm/modern-arch/06-flashattention/) explains how avoiding that score grid changes storage and memory traffic. Checkpointing can reduce saved activations, accumulation can reduce the active microbatch size at a fixed effective batch, and sharding can partition persistent state. These solve different parts of the ledger. Shorter contexts may change the modeling task, so they are not a neutral memory optimization.

Inference under disabled gradient recording usually needs weights, temporary forward activations and a KV cache for generation, rather than gradients and Adam moments. For larger scale, the same declared FP32 Adam ledger for the original Llama 3 8B parameter count gives $16\times8,030,261,248=128,484,179,968$ bytes before activations. Real training systems distribute or alter this storage; fitting BF16 weights is not evidence that full training fits on one device.

:::story Picture this
A builder needs the finished drawing, measurements of what to change, notes about earlier corrections, and temporary calculations. Keeping only the drawing is enough to show it to someone, but not enough to repeat the construction procedure. Training stores all those numeric roles; their exact byte cost follows their actual dtypes.
:::

:::warn Watch out
Measure peak memory after representative forward, backward and optimizer steps, and distinguish allocated tensors from reserved allocator memory. A smaller weight dtype does not automatically halve total training memory. Check the largest logits tensor, saved activations, optimizer state and kernel temporaries before choosing a fix.
:::

:::interview Interview lens
**"Why does BF16 usually need no scaler, and why can mixed precision still use substantial memory?"** BF16 keeps a wide exponent range, so FP16's tiny-gradient range problem is much less severe, but BF16 has fewer fraction bits. Mixed precision can retain FP32 parameters or master values, gradients and optimizer history while using 16-bit matrix operands. I would count those tensors separately from saved activations and temporaries, rather than apply one multiplier to the BF16 weight size.
:::

### Activation recomputation

**Activation checkpointing**, also called rematerialization, saves selected boundary activations and recomputes omitted intermediates during backward. It trades additional forward work for reduced saved-activation memory. It is separate from a disk training checkpoint, which saves the experiment for later resume. The recomputed region must behave consistently with the original forward, including random draws and any mutable state; read the library's RNG and reentrant behavior contract rather than assuming arbitrary code can be replayed.

The [PyTorch checkpoint API](https://docs.pytorch.org/docs/stable/checkpoint.html) documents these execution choices. This method can help when retained activations dominate, but it does not remove the model's parameters, gradients or optimizer moments. Chunking the output loss or using an attention kernel that avoids materialized score matrices tackles different categories in the memory ledger. A memory intervention should identify the category it saves.

@fig train_activation_recompute | An illustrative region either retains its intermediate activation grids or saves a boundary input and regenerates the interior during backward. The grids show the storage policy, not a measured peak-memory reduction.

:::key In one breath
Initialization balances variance and residual depth under explicit assumptions; symmetry breaking does not mean every parameter starts randomly. FP16 offers finer local detail than BF16 but less range, while BF16 keeps a wide exponent and fewer fraction bits. Mixed precision assigns different jobs to different dtypes; FP16 scaling must be undone before clipping, and BF16 usually needs no scaler. Finch-24's declared full FP32 AdamW persistent subtotal is 648,159,232 bytes, with activation and temporary costs added separately.
:::

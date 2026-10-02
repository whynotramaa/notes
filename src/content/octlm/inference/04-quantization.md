@part IV | Quantization | A trained model stores every weight as a 16-bit floating-point number, and Part I showed that decode speed is set by how many of those bytes must be read per token. Quantization stores the weights in 8 or 4 bits instead, with a small amount of extra information to map them back. This part builds it from the number formats up: what the bits mean, how a float becomes an integer and back, where the error comes from, how to keep it small with the right ranges and groups, and how to tell whether a quantized model is actually faster and still good. | where:4

## 16. Why Quantize an LLM

Llama 3 8B in bf16 is 16.06 GB of weights. A gaming GPU with 24 GB holds it, with 8 GB left for the cache and everything else. A laptop GPU with 8 GB cannot hold it at all. Stored in 4 bits per weight, the same model is about 4.1 GB and fits with room to spare. That is the first reason to quantize, and the most common one.

**Model memory** is the size of the weights: parameters times bytes per parameter. **GPU memory limits** set a hard ceiling: if weights plus cache plus working memory do not fit, the model does not run, or runs split across devices. **Memory bandwidth** is the second reason, and on a big GPU it is the main one. Part I showed that a decode step's time is roughly the bytes read divided by bandwidth. Halving the bytes per weight halves the lower bound: for Llama 3 8B on an H100, from 4.48 ms per token in bf16 to 2.24 ms in 8-bit and 1.16 ms in 4-bit. **Deployment constraints** are the third: phones, laptops, CPUs and edge boxes have little memory and modest bandwidth, and a quantized model is often the only one that fits.

| Model | fp32 | bf16 | int8 | int4, groups of 128 |
|---|---|---|---|---|
| Qwen3-0.6B | 2.38 GB | 1.19 GB | 0.60 GB | 0.31 GB |
| Llama 3 8B | 32.12 GB | 16.06 GB | 8.03 GB | 4.14 GB |

@fig inf_format_costs | Llama 3 8B's weights in three formats, and the decode lower bound each gives on an H100 with a fused kernel. Halving the bytes halves the time.

The cost is the **precision vs quality trade-off**. Fewer bits means each weight is rounded more coarsely, and enough rounding error changes the model's predictions. The rest of this part is about getting the memory and speed without paying much of that cost. As a rough guide from published results, 8-bit weights are close to lossless for most models, 4-bit weights with small groups lose a little, and below 4 bits quality drops noticeably unless the method is quite sophisticated.

:::story Picture this
A recipe written by a pastry chef specifies 237.4 grams of flour. A home cook with kitchen scales that read in 5-gram steps will use 235 or 240 grams, and the cake will be fine. A cook with scales that read in 100-gram steps will use 200 grams, and the cake will not. Quantization chooses the step size of the scales. A well-chosen step, matched to the amounts in the recipe, costs almost nothing; a step chosen badly, or one step size for both the flour and the salt, ruins the result.
:::

@fig inf_scales_scene | The kitchen scales of the analogy. The same 237.4 g of flour, weighed on a scale with fine steps and on one with coarse steps.

## 17. Numerical Representations

Every number in a model is stored in some fixed number of bits, and the format decides two different properties. **Dynamic range** is how large and how small a number can be represented at all. **Precision** is how finely numbers are spaced within that range. Floating-point formats spend bits on both; integer formats spend them all on evenly spaced steps.

A floating-point number has a sign bit, some **exponent** bits that pick a power of two, and some **mantissa** bits that pick a position between that power and the next. More exponent bits give more range; more mantissa bits give more precision.

| Format | Bits | Sign / exponent / mantissa | Largest value | Smallest normal | Relative step |
|---|---|---|---|---|---|
| FP32 | 32 | 1 / 8 / 23 | $3.40 \times 10^{38}$ | $1.18 \times 10^{-38}$ | $1.2 \times 10^{-7}$ |
| FP16 | 16 | 1 / 5 / 10 | 65,504 | $6.1 \times 10^{-5}$ | $9.8 \times 10^{-4}$ |
| BF16 | 16 | 1 / 8 / 7 | $3.39 \times 10^{38}$ | $1.18 \times 10^{-38}$ | $7.8 \times 10^{-3}$ |
| INT8 | 8 | integer | 127 | 1 | 1 (absolute) |

The relative step is the gap between 1 and the next representable number, $2^{-\text{mantissa bits}}$. Read the table as a set of trades. **FP32** has both range and precision and costs 4 bytes per parameter. **FP16** keeps 10 mantissa bits of precision but only 5 exponent bits, so anything above 65,504 overflows to infinity, which is why fp16 training needs loss scaling. **BF16**, designed at Google Brain for TPUs, keeps all 8 of fp32's exponent bits and cuts the mantissa to 7: the same range as fp32, much less precision. Converting fp32 to bf16 is just dropping the low 16 bits. **INT8** has no exponent at all: 256 evenly spaced integers from $-128$ to 127. Its range is set entirely by a separate scale factor, the subject of the next section.

@fig inf_float_bits | Bit layouts. BF16 keeps FP32's exponent and gives up mantissa; FP16 keeps more mantissa and gives up range; INT8 has neither, just 256 evenly spaced steps.

Precision is easier to feel with a number. The decimal 0.1 stored in bf16 becomes 0.099609375. Near 12, a typical logit size, the gap between neighbouring representable values is 0.00000095 in fp32, 0.0078 in fp16 and 0.0625 in bf16. So a bf16 logit of 12 can only be 11.9375, 12 or 12.0625, never anything in between. Section 40 uses this fact to choose comparison tolerances.

**Number of bits per parameter** is what decides memory: 32, 16, 16 and 8 for the four formats, plus 4 for the INT4 formats that most local LLM deployments use. INT4 has 16 levels, $-8$ to 7, which is coarse enough that how the levels are placed matters a great deal.

## 18. Quantization Fundamentals

**Quantization** maps floating-point values onto a small set of integers so they can be stored in fewer bits, and dequantization maps them back. The mapping is a straight line with two parameters. The **scale factor** $s$ is the width of one integer step in real units. The **zero point** $z$ is the integer that represents real zero. The **quantization range** is the real interval the integers cover.

$$q = \operatorname{clamp}\!\left(\operatorname{round}\!\left(\frac{x}{s}\right) + z,\ q_{\min},\ q_{\max}\right), \qquad \hat{x} = s\,(q - z)$$

Read the first equation as **quantize**: measure $x$ in units of $s$, round to the nearest whole step, shift by the zero point, and clip to the integers the format allows. Read the second as **dequantize**: undo the shift and multiply by the step width. The result $\hat{x}$ is not $x$ again. The difference, $x - \hat{x}$, is the **quantization error**.

### With real numbers

Take six weights, $[0.817, -1.273, 0.046, 2.54, -0.309, 1.128]$, and quantize them to INT8 with zero point 0. The largest magnitude is 2.54, and we want it to land on 127, so $s = 2.54 / 127 = 0.02$. Dividing each weight by 0.02 gives $40.85, -63.65, 2.3, 127, -15.45, 56.4$; rounding gives $q = [41, -64, 2, 127, -15, 56]$. Those six integers take one byte each. Dequantizing multiplies back by 0.02: $\hat{x} = [0.82, -1.28, 0.04, 2.54, -0.30, 1.12]$. The errors are $-0.003, 0.007, 0.006, 0, -0.009, 0.008$, all within $s/2 = 0.01$.

Now INT4, with 7 as the largest positive level. The scale becomes $2.54 / 7 = 0.3629$, eighteen times coarser. The integers are $[2, -4, 0, 7, -1, 3]$ and the reconstruction is $[0.7257, -1.4514, 0, 2.54, -0.3629, 1.0886]$. The errors are now up to 0.178, and the small weight 0.046 has become exactly zero.

@fig inf_quant_map | The six weights on a number line, with the INT8 grid (fine ticks) and the INT4 grid (coarse ticks). Each weight snaps to its nearest tick; with INT4, 0.046 snaps to zero.

### Two kinds of error

As long as $x$ is inside the range, the error is **rounding error**, at most half a step, $|x - \hat{x}| \le s/2$. Outside the range, the clamp kicks in and the error is **clipping error**, which can be arbitrarily large. Choosing the range is a trade between them. A wide range, set by the single largest value, never clips but makes every step wide. A narrow range gives fine steps for the bulk of the values and clips the rare large ones. For weights, which are fixed and known in advance, most methods use the maximum magnitude and avoid clipping; methods that search for a slightly smaller range sometimes do better.

## 19. Symmetric vs Asymmetric Quantization

The example above used **zero-centered ranges**: $[-2.54, 2.54]$ mapped to integers centred on 0, with zero point $z = 0$. This is **symmetric quantization**. It uses **signed integer ranges** ($-127$ to 127 for INT8, usually leaving $-128$ unused so the range is balanced), and it is the natural choice when values are spread roughly evenly on both sides of zero, as trained weights are.

**Asymmetric quantization** maps an arbitrary interval $[x_{\min}, x_{\max}]$ onto the unsigned integers 0 to 255. The scale is $(x_{\max} - x_{\min}) / 255$ and the **zero point** is the integer that lands on real 0, $z = \operatorname{round}(-x_{\min} / s)$. It pays off when values are lopsided. Activations after SiLU are a good example: they can dip slightly below zero but mostly sit above it.

### With real numbers

Take five activations, $[-0.28, 0, 0.41, 1.93, 3.70]$. Asymmetrically, $s = 3.98 / 255 = 0.015608$ and $z = \operatorname{round}(0.28 / 0.015608) = 18$. The integers are $[0, 18, 44, 142, 255]$, and dequantizing gives $[-0.2809, 0, 0.4058, 1.9354, 3.6991]$: errors of at most 0.0054. Symmetrically, the range must cover $[-3.70, 3.70]$, so $s = 3.70 / 127 = 0.029134$, nearly twice as coarse. The integers are $[-10, 0, 14, 66, 127]$; the codes from $-127$ to $-11$ are never used. Only 138 of the 256 codes can ever be hit, so almost half the format is wasted on negative values that do not occur.

@fig inf_asym_sym | The same five activations, quantized symmetrically and asymmetrically. Symmetric wastes the codes below −10 on values that never occur; asymmetric spends every code on the range that is actually used.

### Trade-offs

Asymmetric is more accurate for skewed data, but the zero point costs something at matmul time. A product of a dequantized weight and an activation, $s_w (q_w - z_w) \cdot s_a (q_a - z_a)$, expands into four terms, and the extra ones have to be computed or precomputed. With $z = 0$ that algebra disappears. So the usual compromise is symmetric for weights, where it costs little accuracy, and asymmetric or symmetric-with-calibration for activations. One rule holds in both: real zero must map to an exact integer. Padding, masked positions and ReLU outputs are exactly zero, and they must come back as exactly zero.

## 20. Granularity

A scale has to be shared by some set of values, and the choice of that set is called **granularity**. With **per-tensor quantization**, one scale covers a whole weight matrix: 2 million numbers in one of Qwen3's query projections. With **per-channel quantization**, each output row of the matrix gets its own scale, so a matrix with 2,048 rows has 2,048 scales. With **per-group quantization**, each row is cut into groups of consecutive weights, typically 32, 64 or 128, and each group gets its own scale.

### Why smaller groups preserve more information

A scale is set by the largest magnitude it must cover. One outlier inflates the scale for everything that shares it, and every other value in the set is rounded more coarsely. Smaller groups confine the damage: the outlier inflates only its own group.

Here is a real example. Row 0 of the query projection in layer 0 of Qwen3-0.6B has 1,024 weights. Their typical magnitude is small: the median absolute value is 0.0082 and 99% of them are below 0.0304. The largest is 0.0518, an outlier about six times the median. Quantize the row to 4 bits in three ways:

| Granularity | Scales for this row | Relative error (RMS) | Weights rounded to 0 | Bits per weight |
|---|---|---|---|---|
| int8, one scale per row | 1 | 1.0% | 13 | 8.016 |
| int4, one scale per row | 1 | 17.8% | 257 | 4.016 |
| int4, groups of 128 | 8 | 11.7% | 163 | 4.125 |
| int4, groups of 32 | 32 | 10.0% | 138 | 4.5 |

The relative error is the root of the summed squared error divided by the root of the summed squared weights. With one scale for the row, the 0.0518 outlier sets the INT4 step at $0.0518 / 7 = 0.0074$, nearly the size of a typical weight, so a quarter of the weights round to zero. With groups of 128, only the first group's scale is set by the outlier; the other seven groups have maxima between 0.0265 and 0.0352, a half to two thirds as large, and their steps shrink accordingly. The relative error drops by a third.

@fig inf_group_scales | The largest magnitude in each group of 128 for a real Qwen3-0.6B weight row. With one scale for the row, every group is quantized as if it held the 0.0518 outlier; with one scale per group, only the first group is.

### Metadata overhead

Each scale has to be stored, usually in fp16, so smaller groups cost bits. One 16-bit scale per 128 weights adds $16 / 128 = 0.125$ bits per weight; per 32 weights it adds 0.5. Asymmetric schemes also store a zero point per group. That is why "4-bit" models are really 4.125 to 4.5 bits per weight, and why group size 128 is the common default: most of the accuracy of small groups for an eighth of a bit.

:::interview Interview lens
**"Why do 4-bit LLM quantization schemes use groups of 64 or 128 instead of one scale per tensor?"** A scale is set by the largest value it covers, and LLM weights have rare large outliers, so one shared scale makes the step size large for everything and rounds many small weights to zero. With a scale per group of 128, an outlier only coarsens its own group. On a real Qwen3-0.6B weight row, 4-bit error falls from 17.8% with one scale per row to 11.7% with groups of 128, at a cost of one fp16 scale per 128 weights, 0.125 extra bits per weight.
:::

## 21. Weight-Only Quantization

There are two things you could quantize in a linear layer: the weights, which are fixed, and the activations, which change with every input. **Weight-only quantization** means **quantizing model weights** and **keeping activations in floating point**. It is the most common scheme for LLM inference, and its name in papers is W8A16 or W4A16: 8-bit or 4-bit weights, 16-bit activations.

With **INT8 weight storage**, each linear layer keeps an int8 matrix and one fp16 scale per output row (or per group). The matmul itself still runs in bf16: **dequantization during computation** turns each weight back into bf16 just before it is multiplied. In a well-written kernel this happens in registers, one tile at a time, so the bf16 weights never exist in memory.

```python
def quantize_rows(w):                         # w: (out, in), bf16
    s = w.abs().amax(dim=1, keepdim=True) / 127   # (out, 1): one scale per row
    q = torch.round(w / s).clamp(-127, 127).to(torch.int8)
    return q, s.to(torch.float16)

def linear_w8(x, q, s):                       # x: (B, T, in), bf16
    w = q.to(x.dtype) * s.to(x.dtype)         # dequantize: (out, in)
    return x @ w.T                            # a fused kernel never builds w
```

### Memory savings

For Llama 3 8B, every weight in int8 gives 8.03 GB instead of 16.06 GB. Many recipes keep the embedding table in bf16, because a lookup reads only one row per token and gains nothing from compression, which brings it to 8.56 GB. In 4-bit with groups of 128 it is 4.14 GB. Qwen3-0.6B goes from 1.19 GB to 0.60 GB in int8.

### Better than rounding

The code above is **round-to-nearest**, the simplest method. It works well at 8 bits and loses noticeably at 4. Two methods from 2022 and 2023 do much better at 4 bits without retraining. **GPTQ** (Frantar and colleagues, 2022) quantizes a layer's weights one column at a time and adjusts the not-yet-quantized columns to compensate for each column's rounding error, using second-order information from a few hundred calibration samples. **AWQ** (Lin and colleagues, 2023) observes that a small fraction of input channels, those with large activations, matter most, and scales them up before quantization so their weights are rounded more finely. Both produce ordinary int4 weights with group scales, so they run on the same kernels.

:::note Quantizing activations too
Weight-and-activation schemes (W8A8) quantize the activations as well, so the matmul itself can run on int8 or fp8 tensor cores, which matters for compute-bound prefill. Activations are harder: Dettmers and colleagues found in *LLM.int8()* (2022) that models above roughly 6.7 billion parameters develop a few activation channels with values far larger than the rest, which ruin per-tensor activation scales. *SmoothQuant* (Xiao and colleagues, 2022) moves that difficulty from activations into weights with a per-channel rescaling. On recent GPUs, fp8 weights and activations are the common choice for serving.
:::

## 22. Quantization and Performance

The easy benefits come straight from the bytes. **Smaller checkpoints** download and load faster. **Lower memory usage** leaves more room for the KV cache, and so for larger batches. **Reduced bandwidth** per decode step shortens each step, ideally in proportion: for Llama 3 8B on an H100, the lower bound drops from 4.48 ms per token in bf16 to 2.24 ms in int8 and 1.16 ms in int4 with groups of 128.

Those numbers assume something that is not automatic: **kernel support**. The speed-up only appears if a kernel reads the compressed weights from memory and dequantizes them on the chip, inside the matmul. Such fused kernels exist for common formats and GPUs, for example Marlin for 4-bit weights on recent NVIDIA GPUs, and serving engines pick them automatically. Without one, the format saves memory and costs speed.

### Why a smaller model may still run slower

Picture the naive path. A layer stores int8 weights. Before each matmul, it dequantizes the whole matrix into a temporary bf16 tensor in HBM and then calls the normal bf16 matmul. Count the bytes per weight: read 1 byte of int8, write 2 bytes of bf16, read those 2 bytes again for the matmul. That is 5 bytes per weight instead of the 2 of plain bf16. For Llama 3 8B the decode lower bound becomes 11.2 ms per token, two and a half times slower than not quantizing at all.

@fig inf_dequant_paths | Bytes moved per weight in a decode step. Plain bf16 reads 2. A fused int8 kernel reads 1 and dequantizes on the chip. A naive int8 path reads 1, writes 2 and reads 2 again: smaller on disk, slower to run.

**Dequantization overhead** is the other cost. Even in a fused kernel, each weight needs a convert and a multiply by its scale, and for int4 an unpack from half a byte. In memory-bound decode at small batch this work hides behind the memory reads and is free. In compute-bound prefill, or at large batch, it is extra arithmetic on the critical path, and a W4A16 model can prefill more slowly than the bf16 original. Measure prefill and decode separately (Section 23), because quantization can help one and hurt the other.

:::warn Watch out
Quantization changes numbers you might not expect. Two common surprises: tied embeddings, where quantizing the LM head also quantizes the embedding table that shares its storage, and fused QKV or gate-up projections, where a single per-tensor scale ends up shared across what were three separate matrices with different ranges. Quantize per output row or per group, and check how your library handles tied tensors.
:::

## 23. Measuring Quantized Models

A quantized model is a different model. It must be measured on its own, against the original, with the same prompts, template and decoding settings. Seven measurements cover it.

**Checkpoint size** is the bytes on disk, including scales and zero points. **GPU/CPU memory** is the peak memory while running, which includes the cache, activations and the framework's workspace, not just the weights; measure it at the batch size and context length you will serve. **Decode speed** is tokens per second for one stream at a fixed context, after a warm-up, averaged over several runs. **Prefill speed** is prompt tokens per second, or time to first token, at a fixed prompt length. Report both, for the reason given in Section 22.

**Quality regression** is measured three ways, from cheapest to most meaningful. **Logit differences** compare the quantized model's next-token distribution with the original's on the same inputs: the largest absolute difference in logits, the **KL divergence** between the two softmax distributions,

$$D_{\text{KL}}(p \,\|\, \hat{p}) = \sum_i p_i \log \frac{p_i}{\hat{p}_i},$$

which reads as "the average extra surprise when the quantized model's probabilities $\hat{p}$ are used in place of the original's $p$", and the **top-1 agreement**, the fraction of positions where both models pick the same most likely token. **Perplexity** on held-out text summarizes the same thing as a single number (the training chapter defines it, [Unit III](/octlm/training/)). And **end-task evaluation**, running real benchmarks such as question answering, maths word problems or code generation, tells you whether a difference in logits actually changes answers.

| Measure | Tells you | Watch for |
|---|---|---|
| Checkpoint size | download and load cost | scales and zero points included |
| Peak memory | what fits, how many users | measured at serving batch and context |
| Decode tokens/s | streaming speed | warm-up, fixed context, same batch |
| Prefill tokens/s or TTFT | wait before the first word | can get worse when decode gets better |
| Logit diff, KL, top-1 agreement | how far the distribution moved | per position, not just averaged |
| Perplexity | overall fit to text | same text and tokenizer for both models |
| End-task scores | whether answers change | enough examples to see a real difference |

:::key In one breath
Quantization stores weights in fewer bits, cutting Llama 3 8B from 16.06 GB in bf16 to 8.03 GB in int8 and 4.14 GB in int4 with groups of 128, and because decode is bandwidth-bound it can cut the per-token lower bound from 4.48 ms to 2.24 and 1.16 ms. A value is quantized as $q = \operatorname{clamp}(\operatorname{round}(x/s) + z)$ and recovered as $\hat{x} = s(q - z)$, with rounding error at most $s/2$ inside the range and clipping error outside; symmetric schemes ($z = 0$) suit weights, asymmetric ones suit skewed activations, and per-group scales stop one outlier from coarsening a whole row (17.8% error per row against 11.7% with groups of 128 on a real Qwen3 row, for 0.125 extra bits). Weight-only W8A16 or W4A16 keeps activations in bf16 and needs fused dequantize-in-the-matmul kernels, because a naive path moves 5 bytes per weight and runs slower than bf16, and every quantized model must be re-measured for size, memory, prefill and decode speed, logit drift, perplexity and task scores.
:::

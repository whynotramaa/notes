@chapter faq | Interview question bank | Fifty questions test the mechanism, the numerical contract and the judgment needed to explain training at a whiteboard.

### I. Feature mixing

**Q1. Why does a Transformer need an FFN after attention?**

Attention communicates context between positions, while the FFN applies learned nonlinear feature computation to each contextual vector. Attention itself also transforms features, so I would not justify the FFN by incorrectly calling attention linear. The FFN provides a separate shared per-position transformation with an expanded intermediate representation.

**Q2. What changes shape in the standard FFN?**

The feature width expands from `d` to `f`, an activation changes those coordinates, and the down projection returns to `d`. Batch and sequence dimensions remain unchanged. Returning to the residual width permits the residual addition.

**Q3. Compare ReLU, GELU and SiLU.**

ReLU has a hard zero branch and zero derivative on negative inputs; GELU smoothly weights inputs by a Gaussian-CDF-related factor. SiLU multiplies its input by a sigmoid and has a smooth, sometimes negative slope. Those differences affect forward features and their backward corrections, not just visual smoothness.

**Q4. Why does SwiGLU have three projections?**

Gate and up projections create two independent expanded branches; a SiLU-activated gate multiplies the content branch, then a down projection returns the product to the residual width. All three matrices are learned. Fusing gate and up into one kernel does not remove either matrix's learned entries.

**Q5. Is a SiLU gate a probability?**

No: SiLU can be negative and exceed one. At a product, the gate gradient is the incoming gradient times the content times SiLU's derivative, while the content gradient is multiplied by the activated gate. A nearly closed feature can still supply a nonzero correction to its gate.

### II. Final normalization and output

**Q6. Why add a final norm if each block already has norms?**

In a pre-norm block, the last residual addition bypasses the branch-input normalization. A separate final norm prepares the resulting residual stream for the vocabulary head. Its placement is part of the trained function, so deleting it changes a loaded checkpoint.

**Q7. What are logits, and how do they become probabilities?**

Logits are unnormalized candidate scores, which can be any real values. Softmax exponentiates and normalizes a row across vocabulary candidates. Subtracting that row's maximum before exponentiation preserves the distribution and avoids positive exponential overflow.

**Q8. What is Finch-24's output shape for the example batch?**

Two sequences with eight input positions produce `(2, 8, 32000)` logits. Each position predicts its own next token. Generation usually reads the final valid position, while training uses all supervised positions.

**Q9. How does weight tying change gradients?**

One embedding parameter is read by both input lookup and output projection. Its gradient adds contributions from both routes, so the optimizer stores one moment pair for that shared object. Equal copied values are not enough: the parameter identity must actually be shared.

**Q10. How many parameters does Finch-24 save by tying?**

It saves `32000 × 512 = 16,384,000` learned entries. Untying increases the total from 40,509,952 to 56,893,952. In a full FP32 parameter, gradient and Adam-moment ledger, the additional named arrays occupy 262,144,000 bytes.

### III. Examples, objective and derivatives

**Q11. How do you build a next-token training example?**

Take a window containing one more token than the desired input length. The input uses all but the final token, and the target uses all but the first. Apply a causal attention contract so the target token is not visible to its predicting position.

**Q12. Why can all training positions run together?**

Their prefix inputs are already supplied by the corpus, and causal masking determines which of those inputs each position may use. Matrix operations can therefore process positions together without selecting unknown future tokens. This is teacher forcing, not parallel ordinary autoregressive generation.

**Q13. Where should data splitting happen?**

Split documents, sources or the relevant correlated groups before forming overlapping token windows. Splitting neighboring windows randomly can put nearly the same text on both sides. Deduplication and contamination checks are also needed because nominal document boundaries do not prevent repeated material.

**Q14. Derive the cross-entropy gradient with respect to logits.**

For one target `y`, loss is log-sum-exp of logits minus the target logit. Differentiating gives predicted probability minus the one-hot target. For a token mean, divide each supervised row's contribution by the combined valid-target count.

**Q15. Why can mean-of-microbatch-means be wrong?**

Microbatches can have different valid-target counts after masking. Equal weighting then gives a small microbatch the same influence as a larger one. Sum NLLs and valid counts, or weight each mean by its valid count before forming the combined objective.

### IV. Optimizer and schedule

**Q16. What does Adam store?**

It keeps exponentially weighted averages of the gradient and its square, plus counters needed for bias correction. The first moment carries signed history and the second measures gradient scale; the second is not a centered variance estimate. The optimizer uses their corrected values to scale each coordinate's update.

**Q17. Why does Adam use bias correction?**

The moment buffers start at zero, which initially shrinks the exponential averages. Dividing by one minus the corresponding decay coefficient raised to the update count corrects that zero-start bias under the estimator's assumptions. It does not make stochastic gradients noise-free or guarantee convergence.

**Q18. How does AdamW differ from Adam with L2 regularization?**

L2 adds a parameter-proportional term to the gradient, so Adam's moments and adaptive scaling process that term. AdamW shrinks parameters separately from the adaptive loss-gradient update. These are equivalent under plain SGD with matching conventions, but generally differ under adaptive optimization.

**Q19. When do you clip gradients?**

After the intended microbatch contributions are accumulated, and after unscaling if loss scaling is used. Compute one global norm over unique parameter gradients and rescale together. Clipping each contribution first changes the result, and clipping a NaN is not a numerical repair.

**Q20. Which counter should a learning-rate schedule use?**

Use the counter defined by the experiment, usually executed optimizer updates or presented tokens. A microbatch is not automatically an update, and an FP16 overflow attempt can consume data without changing parameters. Save the schedule's state and apply the same order on resume.

### V. Initialization, arithmetic and memory

**Q21. Why does initialization depend on fan-in?**

A projected coordinate sums many weighted inputs, so its variance depends on the number of terms and their weight variance. Xavier and Kaiming rules choose scales under different activation and independence assumptions. Residual branches also accumulate through depth, which motivates an additional architecture-specific scaling policy.

**Q22. Compare FP16 with BF16.**

Both use two bytes per scalar. BF16 has more exponent bits and a much larger range, while FP16 has more fraction bits and finer relative precision within its normal range. BF16 therefore avoids many FP16 range failures but still rounds small differences more coarsely.

**Q23. Why can a BF16 parameter lose a small update?**

A small increment can fall between representable values and round away. For example, subtracting 0.0001 from an exactly represented one rounds back to one in BF16. Retaining a more precise parameter value or update accumulator allows such changes to affect future steps.

**Q24. What is loss scaling, and why must clipping follow unscaling?**

Loss scaling multiplies the backward signal so small FP16 gradients are less likely to underflow. The optimizer needs the original scale, so gradients are divided back before clipping and stepping. Otherwise the clipping threshold would apply to an arbitrary scaler multiplier rather than the intended gradient.

**Q25. Why is training memory much larger than inference memory?**

Training retains gradients, optimizer histories and forward information needed for backward, beyond the learned values. Inference normally omits those arrays but adds a generation cache and other runtime storage. Exact totals require declared dtypes, kernels, activation retention and allocator policy; there is no universal bytes-per-parameter multiplier.

### VI. Resume and execution

**Q26. Is a model state dictionary enough to resume AdamW training exactly?**

No: it restores the predictor but omits optimizer history, schedule position and data randomness. A resumable snapshot also needs those states, any scaler, used RNGs and the experiment identities. Exact replay further depends on execution conditions and loader state.

**Q27. When should RNG state be restored during loading?**

After model and optimizer initialization and other loading actions that might consume randomness. Restoring first lets initialization advance the saved random stream before the next batch. Separate training and validation generators also prevent evaluation from changing the intended training sequence.

**Q28. How do `eval()` and `inference_mode()` differ?**

Evaluation mode changes module behavior such as dropout. Inference mode disables derivative recording and extra autograd tracking. They solve different problems, so ordinary held-out evaluation and generation use both, then restore the previous module mode when returning to training.

**Q29. What changes if you checkpoint during accumulation?**

You must preserve the partial gradients and the exact position inside the accumulation group as well as the ordinary state. Otherwise resume repeats or loses contributions. Saving just after a completed optimizer update gives a smaller state contract.

**Q30. What would you log from a training update?**

I would log token-weighted NLL, applied learning rate, pre-clipping norm, executed update count and consumed tokens. Metadata would identify data, tokenizer, architecture and numerical policy. Timing would declare whether evaluation, loading and checkpoint work are included.

### VII. Evaluation units

**Q31. What does a widening training/validation gap tell you?**

It can indicate overfitting, but first make the measurement settings comparable. Online training loss may include dropout and changing batches, while validation uses fixed held-out examples and evaluation mode. The curves identify a pattern, not a unique cause.

**Q32. Is perplexity the arithmetic mean of per-token perplexities?**

No: it is the exponential of mean token NLL, equivalently a geometric mean of reciprocal target probabilities. Average total NLL by valid-token count first, then exponentiate. Averaging batch perplexities changes the statistic.

**Q33. Can you compare perplexity across tokenizers?**

Not directly, because the denominator counts different prediction events. The same sequence likelihood can produce different perplexities when segmentation changes. A shared raw-byte denominator gives a more useful cross-tokenizer comparison under a consistent encoding and context policy.

**Q34. What is the exact BPB conversion?**

Divide total next-token NLL in nats by the evaluated raw-byte count times `ln(2)`. The numerator and denominator must describe the same scored text span. Do not include context-only bytes in the denominator if their targets were excluded from the numerator.

**Q35. Why does sliding-window evaluation need a target mask?**

Earlier overlapping tokens provide context but should not be counted repeatedly. Score newly introduced targets once while preserving their permitted prefix. The stride, boundaries and internal label-shift convention all affect which positions enter the final metric.

### VIII. Experiment design

**Q36. Why is one seed insufficient for a small architecture claim?**

Initialization, data order and execution variation can imitate a small gain. One result measures one trajectory rather than the recipe's average behavior. Repeated controlled runs estimate the method's performance and its spread.

**Q37. What is the difference between standard deviation and standard error?**

Standard deviation describes the observed spread of individual scores. Standard error estimates uncertainty in an average under assumptions such as independent sampling. Error bars need to say which quantity they show and how many runs support them.

**Q38. Why might paired seeds help?**

Valid matching can let shared nuisance conditions cancel within the score difference. Compute a difference for each pair and study the distribution of those differences. Matching an integer seed alone is insufficient if architecture changes alter random-draw consumption or data order.

**Q39. How can undertraining reverse a comparison?**

Different architectures can learn at different rates, so an early budget can rank them differently from a later budget. Report the actual token and compute budget and inspect learning curves. That does not invalidate equal-budget learning-speed results; it limits the claim about final attainable performance.

**Q40. Is 20 tokens per parameter a universal training requirement?**

No: it is a familiar approximation associated with a historical compute-optimal regime. Data quality, reuse, architecture, optimization and serving cost change the allocation. Use scaling intuition to design controlled budgets rather than treating the number as a law.

### IX. Generation

**Q41. Does greedy decoding maximize sequence probability?**

It maximizes the next score locally, not the probability of a complete continuation. A slightly less likely first token can permit a much more likely later continuation. A two-step counterexample is enough to show the distinction.

**Q42. What does temperature change, and what stays fixed?**

It changes probability concentration by rescaling logit gaps before softmax. Positive temperature preserves candidate ranking, and it does not retrain the model or add knowledge. Zero is handled as a separate greedy request, with a declared tie policy.

**Q43. What does top-k do when scores tie?**

An exact index selection keeps the declared number of candidates using its tie policy. A threshold comparison against the kth score can retain extra candidates tied at that boundary. State which behavior the implementation provides, then normalize the retained distribution.

**Q44. How would you reproduce a sampled continuation?**

I would save the model, prompt, tokenizer, decoding settings and generator state under a declared execution environment. The probability tensors and draw order must also match; batching or kernel changes can change results. Generation would use its own RNG so it does not consume the training sampler's sequence.

**Q45. Why are EOS and a token cap both useful?**

EOS is a learned boundary decision, while a cap is a caller-enforced resource limit. A model can fail to emit EOS or repeat indefinitely, so the cap guarantees termination. Stop strings add another contract and may cross token or byte boundaries.

### X. The complete system

**Q46. Which tensors grow with sequence length during training?**

Hidden and FFN activations scale with batch times length times feature width. A materialized attention score grid scales quadratically with length, while an ordinary logits tensor scales with batch times length times vocabulary. Kernels and recomputation policies determine which of those tensors remain resident.

**Q47. What must remain compatible when loading a checkpoint?**

The architecture, parameter names and shapes, tokenizer meaning, position rules, normalization conventions, branch order and tying must match. A state dictionary loading without a shape error is necessary but not sufficient. Compare meaningful outputs and, for resume, the next state transitions.

**Q48. How do you count a bias-free tied GQA decoder?**

Count one vocabulary matrix, independent block projections and norm gains, and the final norm. Each block has two full `d × d` attention matrices, two smaller KV matrices, three `d × f` FFN matrices and two width-`d` gains. The head reuses the embedding, while RoPE adds no learned position table.

**Q49. Walk me through the whole training-to-generation system.**

Create document-level splits, tokenize consistently and sample shifted causal examples. The decoder maps them to logits; token NLL, backward, clipping and the optimizer produce parameter updates under the numerical and schedule policies. Evaluate controlled held-out scores, save complete state, and use a selected fixed checkpoint to continue a prompt under an explicit sampling and stopping contract.

**Q50. What changed between the original Transformer recipe and the modern recipe here?**

The residual attention-plus-FFN structure survives, but this decoder uses causal self-attention, RoPE, pre-norm RMSNorm, GQA and SwiGLU with bias-free projections. The original encoder-decoder Transformer used different positional and normalization choices and a ReLU FFN; GPT-2's decoder recipe used learned positions, LayerNorm and GELU. Numerical kernels, training precision and serving policies are further implementation choices, not reasons to conflate all three architectures.

@chapter exercises | Exercises | Thirty problems move from quick arithmetic to mechanisms, derivations and code. One dot is quick, two dots require several steps, and three dots require a derivation or implementation.

### I. Feature mixing

**E1** ● Count Finch-24's bias-free SwiGLU matrices from `d = 512` and `f = 1536`. Compare with a two-matrix bias-free FFN of width 2048.

**E2** ●● For one SwiGLU coordinate with gate -2, up value 3 and incoming gradient 1, compute the forward product and both branch gradients.

**E3** ●●● Derive the derivative of SiLU from `x × sigmoid(x)`. Explain why a negative input can have a nonzero derivative and give its value at zero.

### II. Output

**E4** ● Count Finch-24's example `(2, 8, 32000)` logit values and their BF16 and FP32 bytes.

**E5** ●● Untie Finch-24's vocabulary weights. Compute the new parameter total and the extra FP32 parameter/gradient/two-moment storage in bytes and MiB.

**E6** ● Count the learned final RMSNorm gains at width 512. Compare with a final LayerNorm containing gain and bias.

### III. Objective and derivatives

**E7** ● Form eight input IDs and eight shifted targets from `[17, 23, 5, 81, 9, 44, 2, 7, 3]`.

**E8** ●● Two microbatches have mean NLL 2 and 4 with valid-target counts 2 and 6. Compute their combined mean, compare with the unweighted mean, and state which denominator backward should use for summed losses.

**E9** ●●● Derive the gradient of `logsumexp(z) - z_y`. Evaluate it for logits `[2, 1, 0]` and target ID 0, and show that the components sum to zero.

### IV. Optimizer

**E10** ● Clip gradient `[3, 4]` to global norm 1. State the scale factor and resulting norm.

**E11** ●● Starting with zero Adam moments, use gradients 0.2 and 0.4, beta1 0.9 and beta2 0.999. Compute stored and corrected moments after each update.

**E12** ●● Evaluate the chapter's warmup/cosine schedule at updates 50, 100, 550 and 1000. State the rate used by the first executed update in Section 20.

### V. Precision and memory

**E13** ● Compute Finch-24's FP32 parameter-only bytes and its named FP32 Adam tensor bytes. Exclude activations.

**E14** ●● Compare FP16 and BF16 spacing just above one. Which has finer precision there, by what factor, and which has the wider normal range?

**E15** ●● With eight blocks and two residual branches per block, compute the illustrative residual standard-deviation factor `1 / sqrt(2L)`. Apply it to base standard deviation 0.02, and compare independent unit-variance branch totals with and without that scaling.

### VI. Execution

**E16** ● For Finch-24's example batch and accumulation count, compute sequences and target presentations per update. How many unmasked updates present one million targets?

**E17** ●● Explain without equations why restoring weights and a seed can fail to reproduce the next AdamW update. Include the order of RNG restoration.

**E18** ●●● Write a Python function that combines microbatch mean-gradient vectors using positive valid-token counts, then clips the combined vector once. Reject mismatched shapes, empty input, nonfinite gradients and invalid counts or thresholds. Check the two scalar mean gradients 2 and 4 with counts 2 and 6 before and after clipping to norm 1.

### VII. Evaluation

**E19** ● Compute token NLLs and dataset perplexity for target probabilities `[0.5, 0.25, 0.125, 0.125]`. Compare with the mean of their per-token perplexities.

**E20** ●● Two tokenizers give equal total NLL `8 × ln(2)` on eight raw bytes, with four and eight tokens respectively. Compute each PPL and BPB. Give the UTF-8 byte count of composed `café`.

**E21** ●●● Derive BPB from mean token NLL and mean evaluated bytes per token. Explain why the aggregate formula remains correct when tokens represent unequal numbers of bytes, while an unweighted mean of per-token loss-per-byte generally differs.

### VIII. Experiment design

**E22** ● Compute the mean and range of illustrative scores `[2.10, 2.14, 2.08, 2.12, 2.16]`.

**E23** ●● Using Section 25's paired results, compute mean difference, sample standard deviation of the differences, and standard error of their mean. Explain what that standard error assumes.

**E24** ●● Explain without equations how a larger model can lose an early-budget comparison and win a later one. State which conclusion an equal-token early result can still support.

### IX. Decoding

**E25** ● Compute top-2 probabilities for logits `[2, 1, 0]` at temperature 1. Include the excluded token's probability.

**E26** ● Use Section 31's cumulative boundaries to select IDs for illustrative uniform draws 0.2, 0.8 and 0.95. State whether these three draws claim observed generation frequencies.

**E27** ●● Explain without equations why raising temperature cannot teach a fixed model a missing fact. Contrast its effect with top-k and with a new optimizer update.

### X. Full audit

**E28** ● Compute Finch-24's BF16 KV-cache bytes for one sequence per cached position and for eight positions. Use KV heads rather than query heads.

**E29** ●●● Count every unique learned parameter of a new tied bias-free decoder with vocabulary 10000, width 256, four blocks, four query heads, two KV heads, head size 64, FFN width 768 and RMSNorm gains. RoPE has no learned position table. Also compute its BF16 learned-value bytes.

**E30** ●●● Derive why teacher-forced token NLL equals negative log-likelihood of the observed continuation under causal factorization. Explain why parallel scoring does not allow choosing that unknown continuation in one ordinary forward pass, and describe a check for future-token leakage.

@chapter solutions | Worked solutions | Each answer follows the stated numerical and modeling assumptions. The accompanying numbers script and runnable algorithm checks verify the arithmetic.

### I. Feature mixing

**E1.** One SwiGLU matrix contains `512 × 1536 = 786,432` entries. Three contain `3 × 786,432 = 2,359,296`. The standard pair contains `2 × 512 × 2048 = 2,097,152`; the difference is 262,144, and dividing by 2,097,152 gives 0.125, or 12.5%. Bias terms are excluded from both sides, so the comparison is consistent but the budgets are not equal.

**E2.** Sigmoid at -2 is 0.119203, so SiLU is `-2 × 0.119203 = -0.238406` at displayed precision. Multiplying by up value 3 gives -0.715218. SiLU's derivative is `0.119203 + (-2) × 0.119203 × (1 - 0.119203) = -0.090784`; multiplying by incoming gradient 1 and content 3 gives gate gradient -0.272353. The content gradient is `1 × (-0.238406) = -0.238406`.

**E3.** Apply the product rule to $x\sigma(x)$: differentiate the first factor to get $\sigma(x)$ and differentiate the second to get $x\sigma(x)(1-\sigma(x))$. Their sum is the SiLU derivative. Sigmoid is nonzero for finite negative inputs, and cancellation is not identically zero on that whole region, so a negative input need not have a zero correction. At zero, sigmoid is 0.5 and the second term vanishes, giving derivative 0.5; at -2 the value is -0.090784.

### II. Output

**E4.** The element count is `2 × 8 × 32000 = 512,000`. BF16 uses two bytes each, giving 1,024,000 bytes; FP32 uses four, giving 2,048,000. These are values of one named logit tensor, excluding gradients and temporaries.

**E5.** The extra vocabulary matrix has `32000 × 512 = 16,384,000` learned scalars. Adding it to 40,509,952 gives 56,893,952. Its FP32 parameters, gradients, first moments and second moments each use four bytes per scalar, so the extra named storage is `16 × 16,384,000 = 262,144,000` bytes. Dividing by `2^20 = 1,048,576` gives 250 MiB.

**E6.** A final RMSNorm with a learned gain has 512 entries. LayerNorm with gain and bias has `512 + 512 = 1,024`. Both preserve the token tensor's shape; the difference is learned affine state, not a vocabulary dimension.

### III. Objective and derivatives

**E7.** The input is `[17, 23, 5, 81, 9, 44, 2, 7]` and the target is `[23, 5, 81, 9, 44, 2, 7, 3]`. Pairing each input position with its next ID supplies eight prediction events. The causal mask still has to hide later inputs from each earlier prediction.

**E8.** The summed losses are `2 × 2 = 4` and `4 × 6 = 24`. Their sum 28 divided by combined count `2 + 6 = 8` is 3.5. An unweighted mean of the two means is `(2 + 4) / 2 = 3`, which gives the smaller microbatch too much weight. Divide each summed microbatch loss by the common denominator 8 before backward.

**E9.** Differentiating $\ln\sum_j e^{z_j}$ with respect to coordinate $z_i$ gives $e^{z_i}/\sum_j e^{z_j}=p_i$. Differentiating the subtracted target logit gives the one-hot indicator, so the result is $p_i-\mathbf1[i=y]$. Stable normalization of `[2,1,0]` gives `[0.665241,0.244728,0.090031]`, and target ID 0 yields `[-0.334759,0.244728,0.090031]`. Their sum is zero up to rounding because probabilities sum to one and the one-hot row also sums to one.

### IV. Optimizer

**E10.** The norm is `sqrt(3^2 + 4^2) = sqrt(25) = 5`. Scale by `min(1, 1 / 5) = 0.2`, giving `[0.6, 0.8]`. The new norm is `sqrt(0.36 + 0.64) = 1`; the direction is unchanged.

**E11.** First stored moments are `m1 = 0.1 × 0.2 = 0.02` and `v1 = 0.001 × 0.2^2 = 0.00004`. Correcting by 0.1 and 0.001 gives 0.2 and 0.04. Second stored moments are `m2 = 0.9 × 0.02 + 0.1 × 0.4 = 0.058` and `v2 = 0.999 × 0.00004 + 0.001 × 0.4^2 = 0.00019996`. Their correction denominators are `1 - 0.9^2 = 0.19` and `1 - 0.999^2 = 0.001999`, giving 0.305263 and 0.100030.

**E12.** Update 50 is halfway through the 100-update warmup, so its rate is `0.001 × 50 / 100 = 0.0005`. Update 100 reaches 0.001. At update 550 the decay progress is `(550 - 100) / 900 = 0.5`, so the cosine is zero and the rate is `0.0001 + 0.5 × 0.0009 = 0.00055`. Update 1000 uses cosine of pi and reaches 0.0001. Section 20's first executed update uses `lr_at(1) = 0.00001`.

### V. Precision and memory

**E13.** Parameter-only storage is `40,509,952 × 4 = 162,039,808` bytes. Adding an equally shaped FP32 gradient and two FP32 moments produces `40,509,952 × 16 = 648,159,232` bytes. Dividing by 1,048,576 gives 154.533203125 and 618.1328125 MiB respectively; the latter is not total peak training memory.

**E14.** FP16's spacing just above one is `2^-10 = 0.0009765625`; BF16's is `2^-7 = 0.0078125`. The ratio is `2^3 = 8`, so FP16 has eight times finer spacing there. BF16 has eight exponent bits rather than FP16's five, giving a much wider normal range. Precision and range are separate properties.

**E15.** The factor is `1 / sqrt(2 × 8) = 1 / 4 = 0.25`. Multiplying base standard deviation 0.02 gives 0.005. Under the explicitly independent unit-variance illustration, an initial variance of 1 plus 16 unscaled branch variances gives 17. Scaling standard deviation by 0.25 scales each variance by 0.0625, so the total is `1 + 16 × 0.0625 = 2`; trained residual branches are not generally independent.

### VI. Execution

**E16.** Four microbatches of two sequences give `4 × 2 = 8` sequence presentations per update. Each has eight targets, so the count is `4 × 2 × 8 = 64`. One million divided by 64 is 15,625 unmasked executed updates under this no-skip illustration. Data consumed by skipped FP16 attempts requires separate accounting.

**E17.** Weights fix the current predictor, but Adam's moments and counters determine its next correction. A seed restarts a pseudorandom sequence instead of resuming its current position, and the data sampler or loader may hold an order and cursor of its own. Initialize the objects, load their states and restore RNG states after initialization has finished, so creation of the model does not consume the resumed stream. Exact replay also needs matching execution and loader conditions.

**E18.** Weight each mean-gradient vector by its valid count and divide by the combined count before computing the global norm. For scalar gradients 2 and 4 with counts 2 and 6, the result is `(2 × 2 + 4 × 6) / 8 = 3.5`; norm clipping to 1 multiplies by `1 / 3.5`, giving 1. The following function validates the example contract and clips once; the runnable version is in `scripts/training/algorithms.py`.

```python
def combine_clip(grads, counts, threshold):
    assert grads and len(grads) == len(counts)
    width = len(grads[0])
    assert width > 0 and all(len(g) == width for g in grads)
    assert all(type(n) is int and n > 0 for n in counts)
    assert math.isfinite(threshold) and threshold > 0
    assert all(math.isfinite(v) for g in grads for v in g)
    total = sum(counts)
    combined = [sum(g[j] * n for g, n in zip(grads, counts)) / total
                for j in range(width)]
    norm = math.hypot(*combined)
    assert math.isfinite(norm)
    scale = min(1, threshold / norm) if norm else 1
    return [v * scale for v in combined]
```

### VII. Evaluation

**E19.** NLLs are `ln(2) = 0.693147`, `ln(4) = 1.386294` and twice `ln(8) = 2.079442`. Their sum is 6.238325 and mean is 1.559581, using full precision before display rounding. Exponentiating gives 4.756828, equivalently the fourth root of `2 × 4 × 8 × 8 = 512`. Averaging the four per-token perplexities instead gives `(2 + 4 + 8 + 8) / 4 = 5.5`.

**E20.** Total cost is `8 × ln(2) = 5.545177` nats, or eight bits. Four tokens give mean loss `ln(4) = 1.386294` and PPL 4; eight tokens give mean loss `ln(2) = 0.693147` and PPL 2. Both give `8 bits / 8 bytes = 1` BPB. Composed `café` contains four code points but five UTF-8 bytes, because its final character takes two bytes.

**E21.** If total scored NLL is $S$, there are $n$ targets and the corresponding text has $M$ bytes, then mean NLL is $S/n$ and mean bytes per token is $M/n$. Their ratio, with the nat-to-bit conversion, is $(S/n)/((M/n)\ln2)=S/(M\ln2)$, so unequal token byte lengths do not affect the aggregate identity. An unweighted mean of local ratios gives a one-byte token the same influence as a many-byte token and therefore changes the weighting. Token boundaries can also split Unicode bytes, so the safest operational contract counts bytes of the scored raw span rather than treating every token as a complete character.

### VIII. Experiment design

**E22.** The scores sum to 10.60; dividing by five gives 2.12. The maximum is 2.16 and minimum is 2.08, so their range is 0.08. Selecting only the minimum hides the spread of the recipe.

**E23.** Differences are `[-0.01, -0.03, -0.01, -0.02, -0.03]`, whose sum is -0.10 and mean is -0.02. Deviations from that mean are `[0.01,-0.01,0.01,0,-0.01]`; squared deviations sum to 0.0004. Dividing by four gives sample variance 0.0001, its square root gives standard deviation 0.01, and dividing by `sqrt(5)` gives standard error 0.004472. That interpretation requires independent representative pairs and a valid pairing policy; it does not establish a universal architecture gain.

**E24.** A larger model can need more evidence or optimization to develop useful features, while a smaller model reaches a useful predictor earlier. Later, the smaller model can saturate while the larger model keeps improving. This is a possible curve shape, not a law that large models always win. The early equal-token result can support better performance at that declared budget, without establishing better final performance at every budget.

### IX. Decoding

**E25.** Keep logits 2 and 1, subtract their maximum, and exponentiate to get `1` and `0.367879`. Their sum is 1.367879, giving probabilities 0.731059 and 0.268941 with excluded ID 2 at zero. Full precision is used before the displayed rounding.

**E26.** Draw 0.2 is below the first cumulative boundary 0.665241, so it picks ID 0. Draw 0.8 lies between 0.665241 and 0.909969, so it picks ID 1. Draw 0.95 lies between 0.909969 and 1, so it picks ID 2. These are illustrative draw locations; selecting each ID once does not mean their true probabilities are equal.

**E27.** Raising temperature changes how often the decoder explores lower-scored candidates from the same fixed predictor. Top-k changes which candidates remain available; neither writes new learned facts into the parameters. A new optimizer update changes learned values using a gradient from evidence and an objective. A lucky sampled correct answer can already be possible without showing that the underlying model learned during inference.

### X. Full audit

**E28.** The count is `2 K/V × 8 layers × 2 KV heads × 64 components × 2 bytes = 4,096` bytes per cached position. Eight positions use `8 × 4,096 = 32,768` bytes. Eight query heads do not replace the two KV heads in that formula.

**E29.** The embedding has `10000 × 256 = 2,560,000` parameters. Query and output each have `256 × 256 = 65,536`; key and value each have `256 × (2 × 64) = 32,768`, so attention totals 196,608 per block. Each FFN matrix has `256 × 768 = 196,608`, and three total 589,824; two norm gains add 512. One block therefore has `196,608 + 589,824 + 512 = 786,944`, and four have 3,147,776. Adding the embedding and 256 final gains gives `2,560,000 + 3,147,776 + 256 = 5,708,032`; the tied head adds zero. BF16 learned values use `2 × 5,708,032 = 11,416,064` bytes.

**E30.** The chain rule of probability factors the observed continuation's likelihood into one next-token conditional per target under its observed prefix. Taking a negative logarithm turns that product into a sum, which is precisely summed teacher-forced token NLL. Those known prefixes can be processed in parallel under causal masking, but an unknown generated token must be selected before the next dependent context is known. To check future-token leakage, fix evaluation settings, alter an input strictly after a chosen position and compare logits at that position and earlier ones; they should remain unchanged within the declared numerical tolerance. Also inspect that shifted labels are never supplied as visible future inputs to those predicting positions.

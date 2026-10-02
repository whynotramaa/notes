@part VI | Choosing and carrying an adapter | This part turns the LoRA equation into a complete model artifact. Wrong target shapes or missing metadata can make a small checkpoint behave incorrectly without a loading error. We will locate the projections, count trainable parameters, compare ranks, and follow saving, loading, and merging. | where:6

## 34. LoRA target modules

A library accepts `target_modules`, but naming a projection does not guarantee the intended tensors changed. Inspect the model's actual modules and report the trainable names and shapes before training.

### Q, K, V, and output projection

A **target module** is a projection chosen for adaptation. Query makes attention questions, key makes lookup features, value makes returned content, and output mixes the concatenated heads. In Finch-24 they are Q `512 × 512`, K `128 × 512`, V `128 × 512`, and O `512 × 512`.

### Gate, up, and down projections

The SwiGLU **gate projection** and **up projection** each map 512 features to 1,536. SiLU of the gate times the up output passes through the **down projection** back to 512. Adapting these changes how the decoder transforms attended content; attention-only adapters change a different part of the computation.

@fig lora_module_targets | Computed Finch-24 projection shapes inside one block. Normalization and residual adds are omitted for readability; all seven projections are adapted in the counting example.

At rank 8, Q and V alone cost `8 × (8,192 + 5,120) = 106,496` parameters across the decoder, and all seven projections cost 606,208. The smaller choice saves storage, but quality must be measured on the same held-out tasks. Advice from another model can fail when names, fused projections, or layouts differ.

## 35. Choosing rank

An adapter fits the demonstrations perfectly at rank 32. That makes it better than rank 8 only if the extra capacity improves unseen behavior enough to pay for itself.

### Capacity, memory, and small vs large rank

**Capacity** is the range of behavior the trainable parameters can express. Larger rank widens the set of possible corrections and grows parameter state linearly: for all seven Finch projections, ranks 4, 8, 16, and 32 cost 303,104, 606,208, 1,212,416, and 2,424,832 parameters.

@fig lora_rank_budget | Computed all-projection Finch-24 adapter counts grow linearly with rank. The highlighted rank is the teaching configuration, not an experimentally chosen optimum.

### Overfitting

**Overfitting** means gains on training examples fail to transfer to the intended unseen distribution. Higher rank makes memorization easier but does not decide it alone; dataset size, diversity, epochs, learning rate, and the starting model matter too.

Keep rank comparisons controlled. Under original scaling, fixing alpha changes `alpha/r`, and fixing the ratio changes alpha, so say which you did. Run a small grid on one split and model version, then pick the cheapest configuration that meets task and regression requirements.

The factors are not unique: scaling $B$ by a nonzero number and $A$ by its inverse leaves $BA$ unchanged. Factor norms therefore underdescribe the update, so compare the product or its effect on inputs.

:::story Picture this
Light from one direction can change how a whole wall looks but cannot reproduce every lighting pattern; more independent directions give more control. Rank counts those directions, and validation tells you how many the task needs.
:::

## 36. Trainable parameter count

The report says "1.5% trainable." Without a denominator, you cannot tell whether that compares with the base or with base plus adapter.

### Base parameters, adapter parameters, and percentage trainable

The **trainable parameter count** sums parameters with optimizer updates enabled. In our no-bias, all-projection example only the LoRA factors train. One block counts as follows.

| Projection | Base shape | Adapter count at `r=8` |
|---|---|---|
| Q | `512 × 512` | 8,192 |
| K | `128 × 512` | 5,120 |
| V | `128 × 512` | 5,120 |
| O | `512 × 512` | 8,192 |
| Gate | `1,536 × 512` | 16,384 |
| Up | `1,536 × 512` | 16,384 |
| Down | `512 × 1,536` | 16,384 |
| One block total | | 75,776 |
| All 8 blocks | | 606,208 |

@fig adapter_parameter_breakdown | Computed factor counts show why the feed-forward projections dominate this adapter's total. Segment widths are proportional to parameter counts.

Against the base the fraction is `606,208 / 40,509,952 = 1.496442%`; against the combined model it is `606,208 / 41,116,160 = 1.474378%`. Both are fine with the denominator stated, and only the second is the share of loaded parameters that train.

The original Llama 3 8B dimensions give 20,971,520 all-projection adapter parameters at rank 8, a computed shape total, not a recommendation or a quality result. Trained biases, embeddings, or auxiliary modules add to the count and must be reported.

## 37. Adapter checkpoints

You send a small adapter file to someone who loads it onto a different revision of the same model family. The tensors fit and the results change: the adapter's base is part of its identity.

### Saving adapters and loading adapters

An **adapter checkpoint** stores the trained factors and the configuration to attach them: target modules, rank, alpha, scaling convention, base revision, tokenizer revision, template, and any extra trained modules. Resuming training also needs optimizer state, schedule, RNG state, and data position; inference does not.

The [PEFT checkpoint-format documentation](https://huggingface.co/docs/peft/en/developer_guides/checkpoint) separates adapter weights from configuration. Loading rebuilds the base, attaches adapters, restores factors, and checks metadata; a clean deserialization proves nothing.

@fig adapter_checkpoint_dependency | Computed parameter counts contrast the base and adapter artifacts. The effective model depends on both, including the exact base identity and scaling.

### Base-model dependency and multiple adapters

**Base-model dependency** means the adapter was learned against particular frozen weights, which a model name may not pin down. **Multiple adapters** can specialize one base for different tasks, but switching them changes cache validity and behavior.

Our adapter's 16-bit payload is 1,212,416 bytes, excluding metadata and file overhead. Combining or routing among adapters needs an explicit policy; adding independently trained corrections does not guarantee useful composition.

## 38. Merging LoRA

The runtime computes two branches per projection. If only one adapter will ever be used, storing their sum as one matrix may be simpler.

### Folding adapter weights into base weights

**Merging** builds `W_merged = W + sBA` explicitly, the same linear map as the unmerged pass in exact arithmetic. With an identity base, `BA=[[3,6],[4,8]]`, and scale 2, the merged weight is `[[7,12],[8,17]]`.

@fig lora_merge_matrix | Every entry in the illustrative merged matrix is computed. Applied to `[2,1]` it returns `[26,33]`, the same output as the separate branch.

### Merged checkpoints and runtime implications

A **merged checkpoint** stores full effective weights, so inference drops the adapter branch and the separate load. It also loses easy adapter switching unless the base and factors are kept elsewhere.

PEFT's `merge_and_unload` merges supported configurations; assign its returned model and verify it, since quantized or specialized paths differ in support. [PEFT LoRA merge reference](https://huggingface.co/docs/peft/v0.21.0/package_reference/lora).

Rounding and multiplication order make merged and unmerged logits differ slightly, and adapter dropout must be off for the comparison. Saving and reloading is a further boundary, tested separately in Section 69.

:::note Payload is not peak memory
The LoRA parameter-state example uses `81,019,904 + 9,699,328 = 90,719,232` bytes: 16-bit frozen base weights plus FP32 adapter weights, gradients, and Adam moments. Peak training memory adds activations and temporaries.
:::

:::warn Watch out
Never merge an adapter into weights that already contain it; the correction is then added twice. Record the base identity and merge state, and compare a reloaded merged artifact against base plus adapter.
:::

:::interview Interview lens
**"How do you count LoRA parameters in a grouped-query decoder?"** Read each projection's real input and output widths and sum $r(d_{\mathrm{in}}+d_{\mathrm{out}})$ over targeted modules and layers. Key and value projections are rectangular because there are fewer KV heads than query heads. State the percentage's denominator and count trained embeddings, biases, or auxiliary modules separately.
:::

:::key In one breath
Target modules set both capacity and cost, so inspect their real shapes. Finch-24's rank-8 all-projection adapter trains 606,208 parameters, and its metadata must name the exact base and scaling. A merged weight is $W+sBA$, checked for parity after saving and reloading. Keep the originals if you may switch adapters or undo the merge.
:::

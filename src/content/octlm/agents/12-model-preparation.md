@part XII | The prepared model in a complete system | This part carries the trained artifact back into inference. Merging and quantization create new numerical boundaries even when every file loads correctly. We will validate the unmerged, merged, and quantized forms, then walk the request through the entire architecture and reconcile its parameter count. | where:12

## 67. Base model + adapter inference

Training saved a small adapter, and inference still needs the model it corrects. An adapter file alone is not a language model.

### Loading base weights and loading LoRA

**Base-plus-adapter inference** loads the exact frozen checkpoint and applies the trained factors at the selected projections. Verify base revision, tokenizer, chat template, target modules, rank, alpha, scaling convention, and dtype, and set evaluation mode so dropout does not change the result.

### Runtime adapter application

**Runtime adapter application** computes `Wx + sB(Ax)` in every targeted projection. A Finch query adapter has intermediate width 8 between base widths of 512; the tensors are small, but the full model still runs.

@fig model_preparation_path | Three artifact forms carry the same specialization through different representations. Each transformation needs fresh validation in the real inference runtime.

The combined model holds 40,509,952 base and 606,208 factor parameters, 41,116,160 in total. A merged artifact returns to the base tensor shapes with changed values.

Switching the active adapter invalidates dependent KV-cache states: identical tokens produced different keys and values under different effective weights. Rebuild the affected cache rather than comparing message text.

## 68. Adapter merge

A runtime that cannot apply adapter branches needs a standalone artifact. Merging gives it ordinary weight tensors, which must contain exactly the trained correction.

### Merge into base weights and save merged model

Build `W_merged = W + (alpha/r)BA` for each target under the stored convention. Save the merged model with configuration, tokenizer, template, and provenance, and record that the adapter is already included so nobody applies it again.

### Verify parity

**Parity** is agreement between two implementations under a stated test and tolerance. In exact arithmetic, `W_merged=[[7,12],[8,17]]` applied to `[2,1]` gives `[26,33]`, matching Section 31. Floating-point model inference needs a measured tolerance instead.

Test both the in-memory merge and the saved-and-reloaded artifact; serialization can change dtype, drop a tensor, or mishandle tied weights. A successful merge call proves neither the artifact nor the serving path.

Build the correction in higher precision when possible, then cast for the target runtime. Keep the unmerged sources so a failed comparison can be traced to the merge rather than an unknown base.

:::story Picture this
A printer can keep a base page plus a transparent correction sheet, or print the combination as one page. The content should match, but the single page loses the easy swap of correction sheets. Merging trades the same way, with rounding as an extra concern.
:::

## 69. Post-merge validation

The merged model answers an easy prompt the same way. That proves little, since many wrong models share a common first word. Look below the sampled text and at complete tasks.

### Logits and generation

**Post-merge validation** starts by comparing logits for identical tokenized inputs under deterministic settings. **Logits** are the unnormalized vocabulary scores before the probability transform. Report a statistic such as maximum absolute difference, on inputs that include tool boundaries and long prefixes.

Generation tests compare serving behavior. Greedy output can flip on a tiny logit change near a tie, so exact text equality is sometimes stronger and sometimes weaker than a numerical tolerance, and sampled runs also depend on RNG and earlier choices.

### Tool evaluation

Rerun the fixed tool benchmark on the reloaded merged model: calls, arguments, recovery, final state, regressions. Near-matching logits on a few prompts do not prove task parity, and unchanged success does not prove numerical equivalence.

Both routes give `[26,33]` in the tiny example. For Finch-24, the pre-head activations are `2 × 8 × 512` and the logits `2 × 8 × 32,000`; compare matching positions, not different last-token slices or separately rendered prompts.

:::note Tolerance belongs to the test
Report dtype, device, kernels, inputs, and tolerance with any parity claim. Equal merged linear maps do not mean bit-identical floating-point execution, and a tolerance chosen after seeing the worst difference is not a predeclared check.
:::

## 70. Quantizing the fine-tuned model

The merged weights take two bytes each in 16-bit storage. Integers can shrink that, but they approximate the values and may change tool behavior.

### Merge then quantize and INT8 conversion

**Quantization** represents values on a discrete grid with scale metadata; **INT8** stores eight-bit integers. A simple deployment merges the correction in floating point and then quantizes the effective weights with the runtime's supported method. Quantized-base adapters and QLoRA-style training are separate routes.

On an illustrative symmetric per-tensor grid with maximum absolute weight 1, the scale is `s_q=1/127`. Quantize by rounding `x/s_q` and clipping, reconstruct with `s_q × q`. For `x=0.5`, rounding gives 64, which reconstructs to `64/127 = 0.503937`, an error of 0.003937.

@fig quantization_number_line | Computed illustrative INT8 grid points show one rounding error. The scale and rounding convention belong to this example, not every INT8 kernel.

### Memory changes and quality regression

Finch-24's base tensors take `40,509,952 × 2 = 81,019,904` bytes in 16 bits and ideally 40,509,952 in one byte. Scales, unquantized norms, alignment, packing, and buffers keep real files and peak memory from that ideal ratio.

@fig artifact_payload_ladder | Computed ideal payloads for each artifact form, with the batch-2 KV cache for scale. Weight quantization halves the weights and leaves the cache untouched.

Re-evaluate task success and regressions after quantizing, since a small numerical shift can change a tool name, a quantity token, or a stop decision. When the quantizer calibrates, calibration data should match the workload. [QLoRA](https://arxiv.org/abs/2305.14314) trains adapters over a frozen quantized base, a different route from post-merge INT8 conversion.

## 71. Final agent evaluation

The quantized model is smaller on disk, but the agent may still be slower if tools dominate latency or the integer path is poorly supported. Evaluate the deployed combination, not the tensor conversion.

### Accuracy, speed, memory, and tool reliability

A **final agent evaluation** reruns the benchmark on the real serving configuration. Accuracy covers task correctness and the call diagnostics. Speed covers prefill, decode, tool time, and end-to-end latency with named boundaries. Memory covers resident weights, KV cache, and peak allocation.

**Tool reliability** covers dispatch, timeout semantics, retry deduplication, and result formatting on the real service. An adapter can improve call choice while an outage lowers completion; report both so model quality is not confused with service availability.

The full-context Finch cache at batch 2, 4,096 tokens, 8 layers, 2 KV heads, head width 64, and two-byte elements is `2 × 4,096 × 8 × 2 × 2 × 64 × 2 = 33,554,432` bytes, or 32 MiB. Quantizing weights does not quantize it, so state the cache dtype separately.

Evaluate the original, unmerged adapted, reloaded merged, and quantized systems on the same tasks to see where each gain or regression entered. Save the report with artifact hashes and runtime configuration so the claim points to a reproducible object.

## 72. End-to-end agent architecture

Back to the request: reserve 3 bolts if enough are available, then report what remains. Every component below must work for "3 reserved; 9 remain" to be justified.

### Model, tokenizer, and chat template

The **tokenizer** maps rendered text and control tokens to vocabulary IDs. The chat template renders current tools and role-correct history. The model maps that causal sequence to candidate assistant outputs, using base, adapter, merged, or quantized weights.

### Harness, tools, state, and evaluation

The runtime parses complete calls, validates arguments and authorization, dispatches trusted tools, keeps state, and enforces budgets. Tools read or change the environment and return evidence. Evaluation watches each boundary and checks that the final inventory and answer satisfy the request.

@fig complete_agent_architecture | Computed Finch-24 counts beside an illustrative complete stockroom system. Model computation and external action stay on separate paths joined by validated calls and returned receipts.

| Component | One job | Failure if missing |
|---|---|---|
| Tokenizer | Encode the intended vocabulary IDs | Different input sequence |
| Chat template | Preserve roles and call boundaries | Wrong learned continuation |
| Model and adapter | Propose the next assistant decision | Wrong choice or value |
| Runtime parser and checks | Convert a permitted complete call to an action | Ambiguous or unauthorized execution |
| Tool service | Enforce the operation atomically | Incorrect external state |
| State record | Retain evidence and identities | Lost dependencies or duplicate effects |
| Evaluation | Compare the outcome with the goal | Unsupported improvement claims |

### The complete shape trace

The batch's encoded input is `2 × 8`; the embedding gives `2 × 8 × 512`; each of 8 blocks and the final RMSNorm keep that shape; the tied output projection gives `2 × 8 × 32,000` logits. Generation continues until a protocol boundary, and the runtime decides whether that boundary is a call or a final answer.

### Counting the whole model

| Parameter group | Computation | Distinct parameters |
|---|---|---|
| Tied embedding and output | `32,000 × 512` | 16,384,000 |
| Attention per block | `2 × 512² + 2 × 512 × 128` | 655,360 |
| SwiGLU per block | `3 × 512 × 1,536` | 2,359,296 |
| RMSNorm per block | `2 × 512` | 1,024 |
| All blocks | `8 × 3,015,680` | 24,125,440 |
| Final RMSNorm | `512` | 512 |
| Base total | `16,384,000 + 24,125,440 + 512` | 40,509,952 |
| All-projection adapter | `8 × 75,776` | 606,208 |
| Combined total | `40,509,952 + 606,208` | 41,116,160 |

The model count reconciles exactly, and so does the stockroom: 17 in stock minus 5 reserved gives 12 available, and one reservation of 3 leaves 9. A complete agent makes both computations meaningful, one as model accounting and one as an observed transition.

This chapter covered supervised specialization and a bounded tool loop, not preference optimization, reinforcement learning, distributed training, or open-ended planning. The next chapter studies architectural changes and the experiments that decide whether they improve a decoder.

:::warn Watch out
Validating the model file does not validate the system. Tokenizer, template, parser, service semantics, state policy, and limits all shape the outcome; record them with the artifact or the same weights become a different agent.
:::

:::interview Interview lens
**"Walk me through a fine-tuned tool agent from user input to final answer."** The runtime renders request, tools, and history with the checkpoint's template, tokenizes, and invokes the model. A complete call is parsed, validated, authorized, and dispatched to a trusted tool, and the result returns under its call ID. The loop continues until a final answer or a documented limit. Success is judged from the observed environment and a supported answer, on the same benchmark across original, adapted, merged, and quantized artifacts.
:::

:::key In one breath
The deployed agent is model, tokenizer, template, runtime, tools, state policy, and evaluation contract together. Merging stores $W+sBA$ directly, and quantization is a new approximation that needs testing. Finch-24 has 40,509,952 base parameters and a 606,208-parameter rank-8 adapter. A correct stockroom answer follows one observed commit from 12 available bolts to 9, not a generated claim that it happened.
:::

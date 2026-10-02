@part X | The complete training-to-generation pipeline | This part follows one experiment from raw text to a sampled continuation. The model, the optimization state and the decoder serve different jobs, and the parameter and memory totals must reconcile. We will trace Finch-24 end to end, count every learned entry, and finish with the checks that make the pipeline explainable at a whiteboard. | where:10

## 33. The complete training-to-generation pipeline

Take the illustrative token stream `[17, 23, 5, 81, 9, 44, 2, 7, 3]`. Eight IDs become one input window and the eight IDs after them become its labels. By the end of this chapter, there is no unexplained arrow between that stream and a checkpoint that can continue a prompt. There is also no claim that these invented IDs spell meaningful words: they make alignment and shape visible.

### Corpus, tokenizer and batches

Start with raw documents and define cleaning, boundary handling and deduplication. Split documents or source groups into training, validation and test before constructing overlapping windows. Learn or select the tokenizer under the declared split policy, and persist its exact vocabulary and special-token configuration. The [earlier tokenization part](/octlm/attention/01-tokenization/) supplies the algorithm; Part III supplies the example-building contract.

Convert the training corpus to the matching token IDs. Sample two windows of eight inputs and their one-position-shifted labels per microbatch, with any packed-document attention mask and ignored-target policy made explicit. Four microbatches provide 64 supervised targets for the example optimizer update. A validation example comes from held-out material, not a different random start inside the same training document.

### Transformer, loss, backpropagation and optimizer

Look up embeddings, apply eight independent blocks, normalize the final stream and project to vocabulary logits. The core shape trace is below. It lists the operations relevant to training without repeating the earlier attention derivations.

| Stage | Example shape | What changes |
|---|---|---|
| Input and target IDs | Each `(2, 8)` | One-position target shift |
| Embedding | `(2, 8, 512)` | IDs become learned vectors |
| Each block's residual stream | `(2, 8, 512)` | Context and features |
| Query heads | `(2, 8, 8, 64)` | Eight query heads |
| Key/value heads | Each `(2, 2, 8, 64)` | Two shared KV heads |
| SwiGLU gate/up/product | Each `(2, 8, 1536)` | Expanded feature computation |
| Final RMSNorm | `(2, 8, 512)` | Head input scale |
| Vocabulary projection | `(2, 8, 32000)` | One score per candidate |
| Flattened loss inputs | `(16, 32000)` and `(16,)` | Target alignment only |
| Summed microbatch NLL | Scalar | Cost of valid targets |
| One accumulated parameter gradient | Matches each parameter | Contributions from 64 targets |

Each microbatch's summed NLL is divided by the combined valid-target count before backward. Reverse-mode differentiation adds contributions through residual branches, shared token projections and both uses of the tied embedding. Parameters do not change until all four backward calls finish. Then the loop unscales if the precision policy requires it, checks and clips the combined gradient, applies one AdamW update with the declared learning rate, and advances the correct counter.

@fig train_complete_pipeline | Finch-24's training branch carries token IDs to a loss and parameter update. Its fixed-checkpoint branch carries prompt IDs to logits, selection and decoded text; orange marks the shared learned predictor.

### Evaluation, checkpoint and prompt

At chosen boundaries, evaluate fixed held-out targets with module evaluation mode and gradient recording disabled. Sum NLL and valid-token counts, then derive loss, perplexity and BPB under the shared text contract. Compare controlled runs before crediting a small score change to an architecture. Save the training state at a completed update boundary, and separately identify the checkpoint selected for inference.

The inference artifact needs the architecture, learned state and matching tokenizer, plus the positional, numerical and generation conventions. It does not need Adam's moments to produce logits. If the caller later resumes training, the weights-only inference artifact is insufficient unless the missing histories can be restored from another source. A “checkpoint” filename therefore does not establish whether the file is resumable.

Tokenize the prompt with that exact tokenizer, use evaluation mode, and process it with the fixed parameters. Read the last valid position's logits. Apply the requested temperature and candidate filter, choose one token, append it, and repeat under the termination policy. Decode IDs to text with correct byte handling. The output depends on the trained predictor, the prompt and the decoder policy together.

:::story Picture this
A music rehearsal changes the performers' habits; a concert uses the habits they have learned. The rehearsal notes, timing history and next exercise matter when rehearsal resumes, but the concert only needs the prepared performers and its own score. The analogy maps to optimizer history versus fixed-weight inference, not to a claim that generating text is human performance.
:::

## 34. Counting every Finch-24 parameter and stored state

If someone says the model has “about forty million weights,” ask where those numbers live. The earlier [modern-block counting exercise](/octlm/modern-arch/07-modern-block/#s34) reconciles the architectural changes from Finch-19. Here we audit the final learned objects and the state that training adds to them.

### The unique parameter ledger

Use mathematical input-to-output shapes for matrices, while remembering that PyTorch linear weights are stored with output dimension first. No listed projection has a bias. RMSNorm gains are learned; RoPE frequencies and the causal mask are not extra learned parameters. The tied head is a second use of the embedding object, not another object.

| Object | Mathematical shape | Per-object count | Multiplicity | Total |
|---|---|---|---|---|
| Token embedding | `(32000, 512)` | 16,384,000 | 1 | 16,384,000 |
| Query projection | `(512, 512)` | 262,144 | 8 | 2,097,152 |
| Key projection | `(512, 128)` | 65,536 | 8 | 524,288 |
| Value projection | `(512, 128)` | 65,536 | 8 | 524,288 |
| Attention output | `(512, 512)` | 262,144 | 8 | 2,097,152 |
| Gate projection | `(512, 1536)` | 786,432 | 8 | 6,291,456 |
| Up projection | `(512, 1536)` | 786,432 | 8 | 6,291,456 |
| Down projection | `(1536, 512)` | 786,432 | 8 | 6,291,456 |
| Block RMSNorm gains | `(512,)` | 512 | 16 | 8,192 |
| Final RMSNorm gain | `(512,)` | 512 | 1 | 512 |
| Tied output head | Reuses embedding transpose | 0 new | 1 use | 0 new |
| Unique total | | | | 40,509,952 |

Attention is $2d^2+2dH_{kv}d_h=655,360$ weights per block. The FFN is $3df=2,359,296$. The two norm gains add $2d=1,024$. Their sum is 3,015,680 per block, and eight blocks contain 24,125,440. Add 16,384,000 embedding weights and 512 final gains to reach 40,509,952 exactly.

$$
P=Vd+L\big(2d^2+2dH_{kv}d_h+3df+2d\big)+d.
$$
Read this as the tied bias-free model's unique parameter count: vocabulary size $V$ times hidden width $d$, plus $L$ blocks containing query/output matrices, smaller key/value matrices, three FFN matrices and two norm gains, then the final gain. The KV-head count is $H_{kv}$, head size $d_h$, and FFN intermediate width $f$. Untying adds another $Vd$ term; learned positions or biases would require their own terms.

@fig train_parameter_budget | A computed proportional bar divides Finch-24's 40,509,952 parameters among the embedding, attention projections, FFNs and norm gains. The tiny norm share is called out separately so it remains visible.

### Training state is a different count

FP32 parameter values occupy $4P=162,039,808$ bytes. With FP32 gradients and two FP32 Adam moments, the named dense tensor total is $16P=648,159,232$ bytes, or 618.1328125 MiB. This is before activations, kernel workspaces and allocation reserves. A separate BF16 compute copy can add $2P=81,019,904$ bytes if the implementation keeps one persistently; ordinary autocast with FP32 parameters does not by itself guarantee that exact persistent-copy layout.

A BF16 weights-only export has 81,019,904 bytes of raw learned values, or 77.2666015625 MiB. File headers, unlearned buffers and serialization behavior can change disk size. A float tensor's dtype changes its storage, not the count of learned scalars. A tied serialization also needs to preserve or recreate aliasing when loaded.

@fig train_state_vs_weights | Computed named-array totals distinguish BF16 learned values, FP32 learned values, and FP32 AdamW training tensors. These bars exclude activations and file-format overhead.

The original Llama 3 8B's parameter ledger is already worked through in [the previous chapter](/octlm/modern-arch/07-modern-block/#s35). Its corresponding architecture has 8,030,261,248 parameters including an untied head. At 16 bytes per parameter, the same illustrative FP32 Adam ledger would require 128,484,179,968 bytes before activations. This arithmetic explains why an 8B inference-memory estimate cannot be copied into a training-memory plan. The dated model specification and its bias-free, untied implementation are documented in [Meta's model code](https://github.com/meta-llama/llama3/blob/main/llama/model.py).

:::note Nonparameter state
RoPE tables, masks and cache metadata can consume memory without being optimized. Adam step counters, scheduler state and RNG state also matter for resume without changing the learned parameter count. Separate “learned scalars,” “resident bytes” and “checkpoint contents” in an interview; they are different ledgers.
:::

## 35. What each component contributes

Erase the formulas and draw the pipeline from memory. Can you name one job for each component and say what would fail if it were removed? That is a better test of understanding than recalling a library's default values. The tables and drawings should now support that explanation rather than replace it.

| Component | Its job | A concrete failure when wrong |
|---|---|---|
| Corpus and splits | Supply the target distribution and held-out test | Leakage makes validation optimistic |
| Tokenizer | Map text to stable IDs and back | Wrong vocabulary changes every token meaning |
| Shifted labels | Define the next-token task | Double shift trains the wrong alignment |
| Causal mask | Hide future inputs from each prediction | The model can see its answer |
| Embedding | Supply learned input vectors | IDs are treated as false numeric magnitudes |
| Attention and positions | Use permitted context with position information | Context or position dependence is wrong |
| FFN | Transform contextual features at each position | Feature computation is changed or removed |
| Residuals and norms | Carry state and control the chosen branch scales | Depth and head input behave differently |
| LM head | Score vocabulary candidates | Hidden features never become token scores |
| Cross-entropy | Measure observed next-token likelihood | The optimized target differs from evaluation |
| Backpropagation | Compute derivatives of that objective | Parameters lack the required correction signal |
| Optimizer and schedule | Apply history-dependent parameter updates | The intended training trajectory changes |
| Precision and clipping | Keep declared arithmetic and gradients usable | Underflow, overflow or excessive updates |
| Validation and seed repeats | Measure generalization and uncertainty | A lucky run is mistaken for a method gain |
| Checkpoint | Restore the declared state | Resume loses history or the next data draw |
| Decoder and stopping | Choose and terminate a continuation | Output repeats, overruns, or uses bad markers |

@fig train_component_jobs | Six illustrated stations compress the pipeline into data, predictor, learning, measurement, saved state and generation. Each station has a distinct job; no station alone constitutes the whole language model system.

### A whiteboard diagnosis

If training loss drops immediately to almost zero, inspect target visibility and alignment before celebrating. If loss is nonfinite, inspect inputs, logits, reductions and gradients before clipping anything. If training improves but validation worsens, inspect split integrity, measurement policy and fitting behavior. If sampled text is bad despite plausible held-out likelihood, compare greedy outputs, verify tokenizer and positions, and inspect the decoder settings.

If a resumed run diverges from the uninterrupted run immediately, compare the next batch, applied learning rate and Adam state before blaming floating-point chaos. If an architecture variant wins one run, inspect seed spread and actual compute. If the model runs out of memory, identify which tensor category grows with batch or context; adding parameters, activations and an attention score grid under one vague “model size” label hides the remedy. These diagnoses follow the contracts developed in the chapter.

@fig train_failure_paths | An illustrative diagnostic map starts from the observed failure and points to the first contract to inspect. The arrows indicate investigations, not proofs that one symptom has only one cause.

### The boundary of this chapter

We have trained a causal predictor under an explicit small-model recipe and defined how to evaluate and sample it. We have not built a distributed training stack, a production data-curation service, supervised instruction tuning, preference optimization, retrieval or a complete model-serving engine. Those layers introduce further objectives, state and resource constraints. [Inference Engineering](/octlm/inference/) follows the fixed checkpoint into caching, kernels, weight loading and real checkpoint parity.

:::warn Watch out
A good-looking sample is not a substitute for held-out evaluation, and a lower held-out NLL is not a guarantee that the model answers a particular user's task correctly. Report the objective you measured, the data and decoding contract, and the uncertainty of the comparison. Keep the evidence connected to the claim.
:::

:::interview Interview lens
**"Walk me from a corpus to a reply, including what learns and what does not."** I would create document-level splits, tokenize with a fixed mapping, and train shifted causal examples through embeddings, blocks, final normalization and the vocabulary head. Cross-entropy and backpropagation give gradients, and the optimizer updates the unique learned parameters under the schedule and numerical policy. I would evaluate held-out likelihood, compare repeat runs, save the complete training state, and use a selected fixed checkpoint with its matching tokenizer for generation. Temperature, candidate selection, random draws, caching and stopping control inference behavior without becoming optimizer updates.
:::

:::key In one breath
The corpus and tokenizer define the prediction events; the decoder maps causal input tokens to vocabulary logits. Cross-entropy, backpropagation and the optimizer turn those events into updates to Finch-24's 40,509,952 unique parameters. Evaluation and repeated controlled runs measure the result, while checkpoints preserve its training state. A fixed selected checkpoint then conditions on a prompt, chooses new IDs under a decoder policy, stops, and decodes the resulting bytes to text.
:::

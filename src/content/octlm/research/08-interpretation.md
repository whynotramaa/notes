@part VIII | From an idea to a defensible result | This part joins architecture, training, measurement, and interpretation. An implemented feature can be educational even when the experiment cannot establish that it improves a model. We will examine OCTLM's change of plan, read paper claims against their controls, and finish with a complete Finch experiment and parameter ledger. | where:8

## 26. Why OCTLM changed its experiment plan

The code for Day 3 existed, but the planned experiment never ran. Before spending the next GPU session, the project asked whether those runs could answer its questions and serve its learning goal.

### Day 3 architecture experiments

The project's Day 3 record proposed MTP, sparse attention, compressed KV, and an MLA prototype, with a baseline comparison first. On 2026-09-23 the plan was withdrawn before that first GPU stage, to keep the from-scratch learning track, train a more useful small model, and add instruction fine-tuning and an agent runtime. It was a change of plan, not a measured defeat for any architecture.

This history is checked against the local OCTLM checkout's `notes/day3.md`, `configs/day3.toml`, and Day 2 result table; the token totals below are recomputed here. [OCTLM Day 3 record](https://github.com/whynotramaa/octlm/blob/main/notes/day3.md), [Day 3 configuration](https://github.com/whynotramaa/octlm/blob/main/configs/day3.toml), [Day 2 result table](https://github.com/whynotramaa/octlm/blob/main/README.md).

### Insufficient training scale and seed noise

These are real OCTLM configurations, separate from our illustrative 40,509,952-parameter Finch. The Day 3 config counted 3,740,160 parameters. Its 2,000 steps at batch 8 and context 256 give `2,000 × 8 × 256 = 4,096,000` positions; the longer-context config gives `2,000 × 8 × 512 = 8,192,000`. The previous 400-step recipe processed 819,200.

@fig octlm_budget_record | Computed token-position totals compare the previous recipe and two planned Day 3 budgets. Planned bars are not completed runs; the 20-token-per-parameter reference is a heuristic, not a required minimum.

The short budget gives 1.095140 positions per parameter. The 20-per-parameter heuristic would need 74,803,200 positions, 18.2625 times more. Repeated exposure is not the same as unique tokens, and the heuristic cannot diagnose a particular run.

The Day 2 table recorded baseline BPB 2.9339 with seed spread 0.0434, SwiGLU BPB 2.8521, and the bundled modern recipe BPB 2.8045 with spread 0.1194. The gaps are `2.9339-2.8521=0.0818` and `2.8521-2.8045=0.0476`. The bundled recipe changed several components, so its gap isolates none of them.

These numbers justified caution about small-budget experiments. They do not prove that undertraining caused all variation or that the seed range is a significance threshold; that would need per-seed comparisons and learning curves. As Part VII showed, a mean gap and a spread measure different things.

### Why implementation alone does not establish an improvement

The prototype can verify equations, shapes, causal masks, and cache dimensions. A naive MLA without an absorbed decode path teaches the representation while missing its memory and speed mechanism. No planned GPU outcome should be reported as observed.

### Moving experiments to better-trained models

The research ideas fit better later, once the baseline is trained well enough and the workload exposes the bottlenecks they target. Agent reliability also needs instruction behavior, tool data, and task evaluation, which no architecture pilot supplies.

The lesson is to keep useful code and revise the claim. "This code implements a causal compressed-memory prototype" can be checked directly. "This architecture improves long-context quality per unit compute" needs the controlled runs the withdrawn plan never produced.

:::note Source precision
The planning note uses rounded sizes and ratios. Here 1.095140 uses the exact Day 3 count 3,740,160. Never pair a rounded denominator from one model with an exact numerator from another.
:::

## 27. Reading architecture papers critically

The abstract claims a large speed gain. Before copying the method, ask what the comparison held fixed and what workload it measured. The strongest number may answer a narrower question than your deployment asks.

### Claimed improvement and baseline quality

A **claim** states a benefit under specified conditions. Find its unit and denominator: loss, tokens per second, KV payload, training FLOPs, or task accuracy. Then find the baseline implementation, recipe, and error bars. A weak baseline inflates the comparison; it limits attribution without making the method useless.

### Training budget, dataset, and parameter count

Check data sources, preprocessing, split leakage, tokenization, exposure, and optimization, and match the budget to the question as in Section 21. For mixture-of-experts models, separate total from active parameters; for auxiliary-head models, separate training from deployed parameters. Equal headline size is not equal work.

### Hardware and evaluation setup

Read batch, context, precision, kernels, devices, warmup, timing boundaries, and whether speed was measured in training, prefill, or decode. A design can win architecturally and lose on a stack without the right kernel; report that limit precisely.

@fig paper_claim_evidence | A schematic reading path ties a claim to the baseline, budget, implementation, and measurement behind it. A missing link narrows what the claim can establish.

### Ablations and reproducibility

**Reproducibility** means someone else can recover the result closely enough to test the claim from the documented artifacts. Look for code, configs, data details, seeds, checkpoints, and measurement procedures. When full retraining is impractical, say which parts can still be checked.

| Question | Evidence to find | What a missing answer limits |
|---|---|---|
| What improved? | Metric and denominator | Meaning of the headline |
| Compared with what? | Baseline recipe and implementation | Attribution to the new design |
| At what budget? | Tokens, FLOPs/time, optimizer | Fairness and learning regime |
| On what data? | Corpus, split, preprocessing | Generalization and leakage claims |
| At what capacity? | Total/active parameters and shapes | Capacity versus architectural effects |
| On what machine? | Hardware, dtype, kernels | Portability of efficiency |
| With what uncertainty? | Seeds, repeated timings, exclusions | Precision of a small gain |
| Which part mattered? | Ablations | Contribution of each component |
| Can it be checked? | Code, configs, data and procedure | Independent verification |

For the Finch cache, "3.2 times smaller KV payload" follows from 256 versus 80 stored features. "3.2 times faster inference" does not. Apply the same test to your own paper summaries.

:::story Picture this
A new oven finishes a recipe sooner, but the test used a smaller cake and skipped preheating. The oven may be good; the headline just does not say why the time changed. Check the recipe, portion, equipment, and clock before crediting the design.
:::

## 28. From research idea to valid experiment

You want to replace six Finch full-attention layers with local ones. Here is the path from that idea to a result another engineer can assess, including the valid outcome "not resolved at this budget."

### Hypothesis, implementation, and baseline

A **hypothesis** is a testable prediction with a declared scope, for example: "The six-local, two-full Finch schedule reduces KV payload at length 4,096 while keeping the selected retrieval tasks within a declared margin." Choose the margin and tasks before the run; no tolerance is universally right.

Keep Finch's tokenizer, vocabulary, width, depth, GQA projections, SwiGLU, normalization, and output tying fixed, and change only the layer masks and local-cache retention. Check that every edge is causal, window boundaries are right, and full layers keep full history. Masks add no learned weights, so the variant has the baseline's shapes and parameter count.

### Full parameter count

| Finch-24 component | Computed parameters |
|---|---|
| Tied embedding/output table, `32,000 × 512` | 16,384,000 |
| Attention in one block | 655,360 |
| SwiGLU in one block, `3 × 512 × 1,536` | 2,359,296 |
| Two RMSNorm vectors in one block | 1,024 |
| One block total | 3,015,680 |
| Eight blocks | 24,125,440 |
| Final RMSNorm vector | 512 |
| Complete baseline and mask-only hybrid | 40,509,952 |

The total is `16,384,000 + 24,125,440 + 512 = 40,509,952`, with the tied output table counted once. It matches the front matter and Unit V's frozen base. A learned compression module or MTP branch would need a new count.

### Controlled run, multiple seeds, and measurement

Make equal-token training the primary comparison and report measured compute as a cost. Train paired seeds on the same split and exposure. Validate masks and cache continuation before expensive runs, and use the baseline's learning curves to pick a regime that can answer the question.

At batch 2 and length 4,096, the baseline GQA payload is 32 MiB. With full layers 4 and 8 and width-256 local layers elsewhere, it is `2 × 4 + 6 × 0.25 = 9.5` MiB, and causal pairs per query head and sequence fall from 67,125,248 to 22,876,928. Sparse-kernel speed still needs measuring.

@fig complete_research_pipeline | The investigation carries a fixed architecture and data contract into training, measurement, and interpretation. The loop returns to the hypothesis when the evidence cannot answer it.

### One forward path through the model

Input IDs `[2,8]` become embeddings `[2,8,512]`. In each block, normalization keeps that shape; Q has width 512 and K and V width 128 each, split into 2 KV heads of 64. The 8 query heads apply the causal mask, combine values, and O projects back to `[2,8,512]` for the residual add.

The feed-forward branch forms gate and up outputs `[2,8,1,536]`, multiplies `SiLU(gate)` by up, and projects down to `[2,8,512]`. After 8 blocks and a final norm, the transposed tied embedding gives logits `[2,8,32,000]`.

@fig finch_forward_shapes | Computed tensor shapes for one Finch-24 forward pass at batch 2 and eight tokens. Orange marks the attention projections; the hybrid changes which K and V entries are kept, never their shapes.

### Interpretation and stop condition

A **stop condition** is a declared rule for ending the experiment: success, failure, or an exhausted budget. Stop when the measurements support a decision, or record that the budget was inconclusive. Never keep adding seeds until one gives the desired headline.

| Component | Its job in the experiment |
|---|---|
| Tokenizer and dataset split | Define comparable inputs and unseen evaluation |
| Baseline and variant code | Isolate the proposed mechanism |
| Training recipe | Define how both models learn |
| Seeds and run ledger | Expose variation and exclusions |
| Evaluation tasks | Test the capability the hypothesis names |
| Memory and timing procedure | Measure implementation costs |
| Acceptance rule | Turn evidence into a declared decision |

If the hybrid meets the quality bar with the smaller payload and a real speedup, keep it for that workload. If quality drops too far, reject the configuration. If the baseline is weak or uncertainty swamps the effect, revise the experiment and say what remains unknown. Each is a valid outcome when it follows the declared question.

:::warn Watch out
A working prototype, a favorable count, and a measured quality gain are three different results. Keep their evidence separate, and keep negative and inconclusive runs next to the successful ones.
:::

:::interview Interview lens
**"How would you test whether your new attention idea works?"** State a scoped hypothesis and build a correct baseline. Implement the isolated change, verify shapes and causality, then train under a declared budget with several seeds. Measure held-out quality and the costs the workload cares about, and apply a stopping rule fixed in advance, accepting that the answer may be inconclusive.
:::

:::key In one breath
OCTLM's withdrawn Day 3 plan is evidence about choosing experiments, not a ranking of architectures. A paper claim is only as broad as its baseline, budget, data, implementation, and evaluation. A valid Finch investigation keeps the model contract visible, verifies mechanics, trains controlled runs, and measures quality with costs. Running those experiments on a well-trained baseline is the next step; this chapter supplies the tools to judge the result.
:::

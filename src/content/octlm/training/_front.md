<section class="front">

<div class="part-kicker">Unit III</div>

# How to read this chapter

<p class="lede">You can draw a decoder and still have no model that predicts useful text. This chapter shows how its parameters learn, how to tell whether that learning generalizes, and how to turn the trained decoder into a generator.</p>

The earlier guides explain attention and the modern decoder block. Here we finish the route through its feed-forward network and output head, then follow the training data in the other direction: prediction, error, derivative, update. We will work with small vectors before counting Finch-24's full tensors. You should leave able to trace a batch through training, explain every line of a training loop, diagnose a misleading experiment, and defend a generation policy at a whiteboard.

The chapter preserves the supplied topic order. Parts I and II finish the forward pass. Part III builds examples and the loss graph. Parts IV and V explain the update and its numerical constraints. Part VI assembles checkpointing and the training loop. Parts VII and VIII ask whether a result is useful and whether a comparison is fair. Part IX turns evaluation into autoregressive generation, and Part X follows the whole pipeline with shapes, parameters, memory and state.

Read the paragraph before the figure. Close the page and redraw the mechanism, including its shapes and the place where a failure could happen. Then answer the interview question aloud before reading its answer. The interview page contains a question bank, graded exercises and worked solutions; use the solutions only after you have made an attempt. An arithmetic answer without an explanation of the assumptions is unfinished.

A story box gives an analogy. A note box carries a convention or historical detail. A warning box names a mistake that changes the result. An interview box gives a question and a spoken answer. Each part ends with an "In one breath" box that compresses its mechanism. Diagrams use the site's paper, ink and orange palette in both themes; orange points to the operation that the caption asks you to remember.

This is a pretraining chapter about a dense causal language model. **Pretraining** means learning a next-token distribution from a text corpus before task-specific adaptation. Instruction tuning, preference optimization, distributed sharding, mixture-of-experts routing and production serving are separate topics. They do not change the need to understand the objective and update taught here, but they add their own data and systems constraints.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch-24 again

Finch-24 is the same illustrative model used in the modern-architecture guide, with the 2024 recipe kept fixed. It is a teaching configuration, not a claim that every model built today uses these settings. Real-model comparisons use the original Llama 3 8B release. Architecture facts have a named model and source; optimizer settings and toy losses here are illustrative, not measured training results.

| Setting | Symbol | Finch-24 | What it controls |
|---|---|---|---|
| Vocabulary | $V$ | 32,000 | Possible token IDs |
| Hidden width | $d$ | 512 | Features per token |
| Decoder blocks | $L$ | 8 | Depth |
| Query heads | $H$ | 8 | Attention queries |
| Key/value heads | $H_{kv}$ | 2 | Shared key/value groups |
| Head width | $d_h$ | 64 | Features per head |
| SwiGLU intermediate width | $f$ | 1,536 | Feature expansion |
| Maximum context | $T_{\max}$ | 4,096 | Supported training window |
| Rotary base | $\theta$ | 10,000 | RoPE frequencies |
| Normalization | | Pre-norm RMSNorm | Block and final normalization |
| Norm epsilon | $\varepsilon$ | $10^{-5}$ | Denominator floor |
| Bias parameters | | None | Projection convention |
| Output head | | Tied | Shares the input embedding |
| Unique parameters | $P$ | 40,509,952 | Learned scalar values |
| Example batch size | $B$ | 2 | Sequences per microbatch |
| Example sequence length | $T$ | 8 | Input positions per sequence |
| Illustrative accumulation | $A$ | 4 | Microbatches per update |
| Tokens per example update | $ABT$ | 64 | With no masked labels |

**Batch size** is the number of sequences processed together. **Sequence length** is the number of token positions in each sequence. We use `B = 2, T = 8` for readable shape traces, and a separate full-context calculation when memory matters. A microbatch is one group processed in a forward and backward pass. The accumulation setting combines several such groups before an optimizer update; Part III defines that mechanism precisely.

One illustrative encoded sequence is `[17, 23, 5, 81, 9, 44, 2, 7, 3]`. Its first eight IDs are input; its last eight are targets. These IDs do not name a particular tokenizer's words. Giving them a convenient English interpretation would invent tokenizer facts, so text examples and arithmetic IDs are kept explicit.

The embedding contains 16,384,000 parameters. Each block contains 3,015,680, so the blocks contain 24,125,440. The final norm contributes 512, and the tied head adds no unique parameters. The sum is exactly 40,509,952. Part X will reconstruct this ledger operation by operation rather than ask you to memorize the total.

All worked arithmetic is reproducible with `python scripts/training/numbers.py`; the figures use its generated ledger. Rounded values are calculated, not eyeballed. Counts are exact under the stated configuration. Memory tables count named tensors, not the allocator's peak, and performance formulas state which operations they omit.

</section>

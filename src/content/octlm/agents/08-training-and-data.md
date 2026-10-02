@part VIII | Training on traces that deserve imitation | This part checks the data before spending optimization steps on it. Low loss on a broken or repetitive dataset teaches the wrong behavior efficiently. We will inspect trace quality and balance, then walk through the training loop, its hyperparameters, and overfitting checks. | where:8

## 46. Dataset quality

A trace says 3 bolts were reserved while the environment shows 4. Training on it teaches the model to misreport a mistake. A pleasing final answer does not make a demonstration correct.

### Correct traces, consistent formats, and valid schemas

**Dataset quality** means demonstrations accurately show the behavior we want. Correct traces keep request values, action preconditions, observed transitions, and supported final answers. Consistent formats share one role schema, call representation, and template version. Valid schemas cover only part of this.

@fig trace_integrity_checks | The illustrative successful trace reconciles the request, the quantity sent, the transition from 12 to 9, and the final report.

### Noise control

**Noise control** removes or repairs mislabeled, contradictory, incomplete, and corrupted examples, recording why. A schema error followed by a corrected, successful action is a useful recovery demonstration when the correction and result are present. It is noise if the error vanishes and the answer claims an unobserved success.

Check `available_before - quantity = available_after` only after a successful reservation; a refusal leaves availability unchanged. Against a real concurrent service, use the transaction receipt's state, not unrelated reads.

Validate the final serialized batch as well as source rows, since templates, masking, and truncation can damage a correct trace. Keep rejected examples out unless they become explicitly labeled error-handling demonstrations.

## 47. Dataset balance

Every training row uses a tool, so the assistant learns that every request deserves a call and starts querying stock when the user wants a definition. The action distribution in the data becomes a behavioral prior.

### Tool vs non-tool examples and different tools

**Dataset balance** describes how examples and supervised tokens spread across behaviors. Include tool and non-tool examples, different tools, and valid refusals in proportions matching the application or a deliberate reweighting. Equal counts are a choice, not an optimum.

### Easy/hard examples and error-handling examples

Easy reads teach syntax; conditional actions require using observations; error-handling examples teach recovery, reconciliation, or refusal. Do not let always-commit demonstrations drown out correct refusals.

An illustrative grid of 4 items, 3 quantities, and 5 phrasings gives `4 × 3 × 5 = 60` requests but says nothing about action balance. Add environment conditions so both available and unavailable paths occur, and count no-tool requests separately.

Under token-average loss, long traces contribute more supervised tokens than short answers, so a set balanced by conversation count can be dominated by one verbose family. Report token counts per behavior and sample or weight deliberately. Relabeling one trace as several examples does not add diversity.

## 48. SFT training loop

The adapter attaches correctly and examples render correctly. Training is now a concrete sequence of operations, and the smallest useful check is one batch whose supervised spans and loss you can verify.

### Load model, attach LoRA, batch, and forward pass

Load the recorded checkpoint with its tokenizer and template, attach LoRA to the chosen modules, and confirm initial parity. A **batch** groups encoded examples with input IDs, attention masks, and labels. The forward pass computes causal next-token logits.

### Masked loss and backpropagation

**Backpropagation** computes gradients of the masked loss through the graph, and only the trainable parameters reach the optimizer. Padding and non-assistant targets stay ignored. A batch with no supervised targets should fail preprocessing or be skipped explicitly, not report a misleading zero loss.

### Validation and save adapter

**Validation** measures held-out loss and generated task behavior without updating weights. Save the adapter configuration and factors from the checkpoint the declared criterion selects, with enough state to reproduce it and compare it to the initial model.

```python
optimizer.zero_grad()
for batch in microbatches:
    logits = model(batch["input_ids"], batch["attention_mask"])
    loss = masked_next_token_loss(logits, batch["labels"])
    (loss / len(microbatches)).backward()
optimizer.step()
```

This averages microbatch mean losses, which equals a global token average only when supervised-token counts match. With unequal counts, accumulate summed token losses and divide by the update's total supervised tokens. Precision scaling and clipping add detail without changing what the targets mean.

@fig gradient_accumulation_sft | The illustrative update groups four microbatches of two examples. At equal target counts this matches an effective batch of eight; unequal counts need token weighting.

## 49. SFT hyperparameters

The run sees the same data, but a shorter sequence length cuts off most reservation receipts, and the loss still falls. Some hyperparameters change optimization; others change which evidence survives.

### Learning rate, batch size, sequence length, and epochs

A **learning rate** sets update size. **Batch size** counts examples or tokens processed together and needs a stated unit. **Sequence length** caps the encoded span and can truncate dependencies. An **epoch** is one pass over the dataset's sampling order.

### Gradient accumulation and warmup

**Gradient accumulation** combines microbatches before one optimizer update. With 96 examples, microbatch 2, and accumulation 4, the effective batch is `2 × 4 = 8`, an epoch is `96 / 8 = 12` updates, and 3 epochs are 36, assuming no dropped rows and even division.

**Warmup** ramps the learning rate up early in training. For a target of 0.0002 over 4 linear warmup updates, the first value is `0.0002 / 4 = 0.00005` when update one uses the first positive rate. Schedulers differ in when they step, so check the logged values.

@fig sft_update_schedule | Computed update counts and warmup values for the illustrative run. Dashed lines mark epoch boundaries at updates 12 and 24; the flat rate after warmup is a placeholder, not a recommendation.

### LoRA rank and LoRA alpha

Rank sets factor shapes; alpha sets the scale together with rank. Our rank 8 and alpha 16 give scale 2 and are arithmetic fixtures, not defaults. Choose hyperparameters from held-out behavior, memory limits, and a baseline, not from another checkpoint's config.

:::note Effective batch units
Eight conversations can hold very different numbers of supervised tokens from one update to the next. Report example and token counts when comparing runs, and match loss normalization and schedules to that unit.
:::

## 50. SFT overfitting

The assistant reproduces every training call perfectly and fails when the user says "set aside" instead of "reserve." Falling training loss shows imitation of the examples, not general competence.

### Memorization and template overfitting

**Memorization** reproduces specific training values or traces without learning the mapping. **Template overfitting** ties performance to the exact wording or layout of demonstrations. Vary names, quantities, states, and phrasings, and hold out combinations or families that test the generalization you want.

### Loss of general behavior and validation

**Loss of general behavior** is regression on capabilities the specialization should keep, such as ordinary chat or non-tool reasoning. Keep a regression set independent of the tool corpus; a small adapter changes few parameters but can still do harm.

@fig sft_overfit_curves | Illustrative loss fixtures show training improving after validation starts to worsen. The curves are not Finch-24 measurements, and checkpoint choice should also weigh task outcomes.

Validation losses of 1.9, 1.5, 1.2, 1.3, and 1.5 bottom out at the middle checkpoint while training loss keeps falling. That is a diagnostic, not a full stopping rule: generated tool behavior can worsen earlier or later than token loss, especially when easy syntax tokens dominate the loss.

:::warn Watch out
Tuning rank, epochs, prompt, and masking repeatedly against the test set fits your choices to it. Iterate on validation and keep a separate final test for the claim. A held-out file name does not stop task-family leakage.
:::

:::interview Interview lens
**"What would you inspect when SFT loss falls but tool performance does not improve?"** First decode a batch and check roles, shifts, and supervised spans. Then trace correctness, tool versus no-tool balance, and whether validation families differ from training ones. Free generation can fail while teacher-forced predictions look fine. Finally compare against the original checkpoint in the same runtime and benchmark.
:::

:::key In one breath
Teach only traces whose actions and observations agree. Balance behaviors and supervised tokens, not just rows. Training links template and masks to a controlled update, and validation checks loss and generated outcomes. Report hyperparameters with their units, and remember that falling training loss can hide narrow imitation or lost general behavior.
:::

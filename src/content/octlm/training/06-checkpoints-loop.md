@part VI | Running and resuming the experiment | This part assembles the training procedure into a repeatable operation. Saving weights alone cannot restore Adam's history or the next batch, and a misplaced update can change the objective. We will save complete state at update boundaries, then trace sampling, backward, clipping, stepping, logging and validation. | where:6

## 19. Checkpointing

Stop immediately after update 550 of our illustrative schedule. The rate for the next update depends on that counter, Adam depends on its moment history, and the next random window depends on a generator's state. Reloading only Finch-24's weights restores the current predictor, but not the continuation of its training trajectory.

A **training checkpoint** is a saved snapshot of the model and the state needed to continue the declared training procedure. A **model state** contains learned parameters and persistent model buffers. A **scheduler state** contains the counter and any history needed by the learning-rate policy. A **random-number generator state**, or RNG state, describes where a particular generator is in its sequence. A seed starts a sequence; a state resumes it from its current position.

The [earlier reproducibility introduction](/octlm/attention/13-optimization/#s75) names the state categories. Here the practical contract is that resume restores the next training action, not merely equal logits at load time. Adam's first and second moments have the same tensor shapes as their parameters, and its update counters affect bias correction. A scaler's state matters for FP16 because its current scale and growth history affect overflow handling.

| State | Why it matters | Typical saved representation |
|---|---|---|
| Model parameters and buffers | Current predictor | `model.state_dict()` |
| Optimizer moments and counters | Next parameter correction | `optimizer.state_dict()` |
| Schedule and executed updates | Next learning rate | State dictionary or explicit counter/config |
| FP16 scaler, if used | Scale and skipped-update behavior | `scaler.state_dict()` |
| Training sampler | Next sampled examples | Generator state, order and cursor |
| CPU and device RNGs | Dropout and other randomness | RNG state tensors |
| Python/NumPy RNGs, if used | Preprocessing or sampling | Serialized generator state |
| Token count and other counters | Budgets and logging | Integers |
| Architecture/tokenizer/data identity | Meaning of weights and IDs | Configuration and hashes |
| Software and execution policy | Reproducibility conditions | Recorded environment metadata |

@fig train_checkpoint_state | A checkpoint contains the predictor and the histories that determine its next training action. Orange marks optimizer, counter and random state that a weights-only export omits.

### Saving and loading at a boundary

Saving between completed updates avoids having to persist partly accumulated gradients and a microbatch cursor. If you save mid-accumulation, those gradients and the exact position within the accumulation group become additional required state. Saving a `state_dict` reference for an in-memory "best model" also needs a copy if training continues, because its tensors can otherwise track later parameter mutations. A serialized disk snapshot contains the saved values.

This compact snapshot is for a single-process run with a CPU random-window generator and a functional schedule. The `config` object contains the architecture, tokenizer and data identities, schedule configuration, and declared policies. `seen_tokens` counts consumed supervised tokens, including any separately recorded attempted batches if your policy distinguishes them.

```python
payload = {
    "model": model.state_dict(), "optimizer": optimizer.state_dict(),
    "update": update, "seen_tokens": seen_tokens, "config": config,
    "sampler_rng": train_generator.get_state(),
    "torch_rng": torch.get_rng_state(),
    "cuda_rng": torch.cuda.get_rng_state_all() if torch.cuda.is_available() else [],
    "python_rng": random.getstate(),
}
# Add scaler/scheduler states when those objects are used.
torch.save(payload, str(path) + ".tmp")
os.replace(str(path) + ".tmp", path)
```

On a local filesystem that supports atomic replacement, this avoids presenting a partly written file under the final checkpoint name. It does not promise durability after sudden power loss, and object storage has different commit rules. A crashed temporary file must not be treated as a completed checkpoint. For multi-process sharded state, use a coordinated checkpoint format with an explicit completion marker; the small example does not implement that distributed transaction.

Load into the intended architecture, recreate tied aliases, create the optimizer with the same parameter groups, and create any scheduler object before loading its saved state in the documented order. Then load model and optimizer values, restore the completed-update counter and sampler, and restore RNG states after initialization and loading have finished. Initialization itself consumes randomness, so restoring the RNG too early can change the next training draw. Verify tokenizer and dataset identity before resuming, because equal tensor shapes do not prove equal token meanings.

```python
saved = torch.load(path, map_location="cpu", weights_only=True)
assert saved["config"] == config
model.load_state_dict(saved["model"])
optimizer.load_state_dict(saved["optimizer"])
update, seen_tokens = saved["update"], saved["seen_tokens"]
train_generator.set_state(saved["sampler_rng"])
torch.set_rng_state(saved["torch_rng"])
if saved["cuda_rng"]:
    torch.cuda.set_rng_state_all(saved["cuda_rng"])
random.setstate(saved["python_rng"])
model.train()
```

This payload uses tensor and ordinary Python-value state; other objects, including some NumPy states or custom classes, may require an explicit compatible representation. `weights_only=True` is a restricted loader mode, not a claim that only the model's weights can be stored: compatible optimizer and primitive metadata can also load. Do not casually switch to unrestricted loading for an unfamiliar checkpoint. The [serialization documentation](https://docs.pytorch.org/docs/stable/notes/serialization.html) and [saving/loading guide](https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html) describe the contracts.

### Exact training resume

**Exact resume** means the continuation matches the uninterrupted run under the declared conditions, potentially bit for bit. Matching weights, state, data order and counter is necessary but not sufficient across changed hardware, kernels or software versions. Nondeterministic kernels can also defeat a bitwise match on the same environment. Data-loader prefetch queues and worker randomness complicate restoration: a dataset cursor alone can miss samples that workers already drew.

The simplest exact-resume demonstration uses a synchronous random-window sampler with an explicitly saved generator, saves at update boundaries, and tests replay in the same deterministic environment. A production streaming loader needs a stronger state contract. **Statistical reproducibility** instead means the method produces a comparable distribution of outcomes over reruns; it does not require every stored bit to match. [PyTorch's reproducibility note](https://docs.pytorch.org/docs/stable/notes/randomness.html) explains its limits across environments.

@fig train_resume_boundary | An illustrative save after completed update 550 restores the next batch draw and the update-551 learning-rate decision. A weights-only restart loses these histories even when loaded predictions initially agree.

:::story Picture this
Pause a board game after a completed turn. A picture of the board saves the visible position, but continuing the same game also requires the deck order, whose turn comes next, and any pending rules state. A model-only checkpoint is the board picture; a training checkpoint records the rest of the declared procedure too.
:::

## 20. Training loop from end to end

We now have all the pieces needed to execute one Finch-24 update. The example uses FP32 stored parameters, CUDA BF16 autocast, AdamW, four microbatches, and a functional learning-rate schedule. It assumes a device and kernels that support this path. No FP16 scaler is used in this particular loop; the FP16 variation follows afterward.

The [earlier loop sketch](/octlm/attention/13-optimization/#s69) gives the sequence. Here we need each action's exact role. Sample batches using the training generator. Forward produces logits and cross-entropy measures the target positions. Zero the gradient buffers before the first backward in an accumulation group. Backward adds derivatives, clipping caps the final combined norm, and the optimizer changes parameters once. Update the counter and learning-rate policy according to successful updates, then log, validate or checkpoint at the chosen boundaries.

### A computed schedule implementation

This function implements Part IV's illustrative schedule. `s` is the update coordinate chosen by the calling loop, `warmup` and `total` are its boundary updates, and `peak` and `minimum` are the rate endpoints. Clamping prevents accidental cosine growth beyond the end.

```python
def lr_at(s, warmup=100, total=1000, peak=1e-3, minimum=1e-4):
    assert 0 < warmup < total and 0 <= minimum <= peak
    s = min(max(s, 0), total)
    if s < warmup:
        return peak * s / warmup
    progress = (s - warmup) / (total - warmup)
    return minimum + 0.5 * (peak - minimum) * (1 + math.cos(math.pi * progress))
```

The first executed update below uses `lr_at(1)`, with value 0.00001. Update 100 uses the peak 0.001. Completed-update state tells the resumed loop which argument to use next; the scheduler does not need hidden history in this functional form. A stateful scheduler would instead need its state dictionary and its declared step order.

### The accumulated update

Prepare four microbatches first so the denominator counts all their valid target tokens. With no masks, the example denominator is $4\times2\times8=64$. For each microbatch, compute a summed loss and divide by that combined denominator before backward. This preserves the combined token mean even when masks give the microbatches different valid counts.

```python
batches = [sample_batch(tokens, B, T, train_generator) for _ in range(A)]
valid = sum(int((y != -100).sum()) for _, y in batches)
assert valid > 0
optimizer.zero_grad(set_to_none=True)
for x, y in batches:
    x, y = x.to(device), y.to(device)
    with torch.amp.autocast("cuda", dtype=torch.bfloat16):
        z = model(x)                           # (B, T, V)
        summed = F.cross_entropy(z.float().reshape(-1, V), y.reshape(-1),
                                 ignore_index=-100, reduction="sum")
    assert torch.isfinite(summed)
    (summed / valid).backward()
```

Zeroing with `set_to_none=True` removes the old gradient tensors rather than filling them with zeros. It can reduce writes and allows the optimizer to distinguish a parameter that received no gradient from a parameter with an actual zero gradient. That distinction can affect whether an optimizer applies state updates or decay to it. A tied embedding/head must appear only once in `params` and the optimizer groups.

@fig train_accumulation | Four illustrative Finch-24 microbatches contribute summed losses divided by the same 64-token denominator. One clipping operation and one optimizer step follow the combined backward work.

```python
norm = torch.nn.utils.clip_grad_norm_(params, 1.0, error_if_nonfinite=True)
next_lr = lr_at(update + 1)
for group in optimizer.param_groups:
    group["lr"] = next_lr                     # same base rate in this example
optimizer.step()
update += 1
seen_tokens += valid
```

`params` is the unique parameter list used by the optimizer. The clipping threshold 1 is illustrative. The counter advances after the optimizer step; the functional schedule has no separate `scheduler.step()` call. If you use a stateful scheduler instead, call it in its documented order after the successful optimizer step and remove the manual rate assignment. Combining both policies would make the active rate ambiguous.

@fig train_loop_order | The declared BF16 update runs zero, accumulated forward/loss/backward, global clipping, rate selection, optimizer step and counter advancement. Logging and checkpoints occur after that completed boundary.

### The FP16 variant and skipped steps

Replace the autocast dtype with FP16, multiply each microbatch loss by the same scaler factor, and accumulate without updating the scale between those microbatches. Unscale once after all backward calls, clip the unscaled gradients, then use the scaler's optimizer step and update methods. An overflow can skip the parameter update while still consuming sampled batches. Distinguish the attempt counter, data cursor, consumed-token counter and successful-update counter.

A single standard `GradScaler` can indicate an overflow skip when its updated scale decreases under its ordinary policy, but the optimizer's usual `None` return is not a reliable success flag. More complex optimizer/scaler arrangements need their own explicit success contract. Do not advance a schedule designed for executed updates merely because `scaler.step()` was called. Preserve these semantics in the checkpoint and logs.

### Logging, validation and checkpointing

Log the loss as total NLL divided by total valid tokens, along with update, consumed tokens, applied learning rate and pre-clipping norm. Record dtype, configuration and the data identity once in the run metadata. Timing metrics should name whether they include data loading, validation, checkpoint writing and synchronization. Retaining `loss` tensors in a log list can retain their graphs; store detached values for history instead.

Validation turns off training-only behavior and gradient recording, then uses a stable held-out corpus. `model.eval()` changes module behavior such as dropout; `torch.inference_mode()` disables derivative recording and extra autograd tracking. Use both for ordinary validation, and restore the model's previous mode afterward. A separate validation generator or deterministic traversal avoids validation consuming the training sampler's RNG sequence. The [SDPA evaluation warning](/octlm/modern-arch/05-sdpa/#s23) explains why explicit attention dropout arguments must also follow evaluation mode.

```python
was_training = model.training
model.eval()
with torch.inference_mode():
    total_nll, total_valid = evaluate_fixed_validation(model)
    validation_loss = total_nll / total_valid
model.train(was_training)
```

`evaluate_fixed_validation` must return summed unweighted next-token NLL and the supervised-token count, with no all-ignored evaluation set. Validate after a completed update at a declared interval, and save a snapshot after any intentional validation-driven state change. Keep a recent resumable checkpoint and, if useful, a distinct best-validation checkpoint. The latter's model weights are for model selection; its full training state is required only if you intend to resume that earlier trajectory.

@fig train_validation_modes | Module evaluation mode and disabled gradient recording control different mechanisms. Both belong in validation; restoring training mode is part of returning to the loop.

:::note A smoke check before a long run
Try to overfit a tiny fixed batch under a known configuration. Check causal dependence by changing a future input token and comparing earlier logits, and compare an uninterrupted update sequence with a save/load continuation. These checks answer different questions: whether gradients work, whether the target is hidden, and whether state restoration is faithful.
:::

:::warn Watch out
`zero_grad` belongs before the first backward whose contributions should form an update, not between its accumulated microbatches. A generation cache computed under old weights also does not belong in a new training forward pass. Training changes parameters and records derivative dependencies; the ordinary inference cache contract assumes fixed weights.
:::

:::interview Interview lens
**"What would you save, and how would you prove resume is exact?"** I would save model and optimizer state, the executed-update schedule state, any scaler, all used RNG states, and the data sampler or cursor with the experiment identities. I would save at a completed accumulation boundary and restore RNGs after object initialization. Then I would compare the next batches, losses, moments and parameters against an uninterrupted run in the same deterministic environment; matching only the loaded model's logits is insufficient.
:::

:::key In one breath
A training checkpoint restores predictor, optimizer history, schedule, scaler if used, data position and all used randomness. Exact replay also depends on the execution environment, and a mid-accumulation snapshot needs partial gradients. The loop accumulates one token-weighted gradient, unscales if needed, clips once, steps once and advances the declared successful-update counter. Validation uses both evaluation mode and disabled gradient recording, with its own stable data policy.
:::

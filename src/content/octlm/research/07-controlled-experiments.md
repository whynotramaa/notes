@part VII | Making the comparison believable | This part separates an architectural idea from evidence that it helps. A weak baseline, a changed budget, or one lucky seed can make a result look better than it is. We will define controls, measure variation, distinguish undertraining from noise, and compare quality with speed and memory. | where:7

## 21. Architecture experiment design

The sparse model finishes faster, but it also trained on fewer tokens. Its result cannot say whether sparsity improved efficiency at equal quality, because more than the mechanism changed.

### Baselines and one variable at a time

A **baseline** is the reference implementation and recipe a change is judged against. Start from a working, tested model and a clear hypothesis, such as "a local/full layer schedule cuts KV payload while keeping distant retrieval at the declared budget." Keep the baseline runnable instead of editing it in place.

A **controlled experiment** holds everything comparable except the factor under study. Changing attention, normalization, optimizer, tokenizer, and dataset together tests a package and cannot isolate the attention effect. An **ablation** removes or alters one component to test what it contributes.

@fig experiment_control_ledger | A schematic run ledger pairs baseline and variant by seed, dataset, and declared budget. The changed attention pattern is explicit; hidden recipe changes would invalidate the attribution.

### Equal compute, equal datasets, and equal training budgets

**Equal-token comparison** gives both models the same training tokens. **Equal-compute comparison** gives them the same training work. **Equal-wall-time comparison** gives them the same elapsed time on declared hardware. These answer different questions, and an architecture that changes cost cannot satisfy all three at once.

For example, 2,000 steps at effective batch 2 and length 1,024 process `2,000 × 2 × 1,024 = 4,096,000` token positions. Auxiliary prediction heads keep the positions the same but add loss terms and arithmetic. With padding or masked targets, separate processed positions from supervised targets.

Fix the primary constraint before seeing results. For "better loss after the same data," use equal tokens and report compute; for "better loss within a budget," use equal compute or time and report tokens. Keep dataset versions, splits, order, optimizer, and evaluation fixed where the question needs it. Matching parameters by changing width is a second design change and must be disclosed.

## 22. Seed variance

Two unchanged baseline runs give different held-out losses, because initialization and batch order change the optimization path. A gain smaller than that run-to-run variation is hard to read from one comparison.

### Random initialization and multiple seeds

A **random seed** initializes a pseudorandom generator that drives weight initialization, dropout, or shuffling. **Seed variance** is the spread across seeds under one recipe. A seed alone does not guarantee identical runs across devices, libraries, or nondeterministic kernels.

Illustrative held-out losses for five paired seeds follow. Pairs share seed labels and data order, though a changed architecture may consume random draws differently.

| Seed label | Baseline loss | Variant loss | Baseline minus variant |
|---|---|---|---|
| A | 2.10 | 2.09 | 0.01 |
| B | 2.14 | 2.11 | 0.03 |
| C | 2.08 | 2.07 | 0.01 |
| D | 2.12 | 2.10 | 0.02 |
| E | 2.16 | 2.13 | 0.03 |
| Mean | 2.12 | 2.10 | 0.02 |

@fig paired_seed_losses | Every plotted illustrative loss is listed in the table. Lines join paired runs; they are not training trajectories.

### Noise floor and why small improvements may not be real

A **noise floor** is the variation that limits how finely an experiment can separate effects. It is not a fixed cutoff equal to the baseline's range; use the uncertainty of the difference you actually care about.

For paired differences $\Delta_i$:

$$
\bar\Delta=\frac{1}{n}\sum_i\Delta_i,
\qquad
SE=\frac{s_\Delta}{\sqrt n}.
$$

Read this as average the paired improvements, then divide their sample standard deviation $s_\Delta$ by $\sqrt n$. Our differences have mean 0.02 and standard deviation 0.01, so `SE = 0.01/√5 = 0.004472`.

Assuming independent pairs and roughly normal differences, the two-sided 95% Student-t interval with 4 degrees of freedom is `0.02 ± 2.776445 × 0.004472136`, or `[0.007583,0.032417]`. It excludes zero, but five pairs are thin evidence, and the interval ignores any search over many variants. Report the assumptions and selection policy too.

@fig paired_difference_interval | The five illustrative paired differences, their mean, and the computed 95% interval. The interval sits right of zero even though the baseline's own range, 0.08, is four times the mean gain.

The baseline range `2.16-2.08=0.08` exceeds the mean gain of 0.02, which alone does not sink the paired result: paired and unpaired uncertainty differ. Show the full run table so readers can judge.

:::warn Watch out
Picking each variant's best seed turns luck into a selection rule, and comparing the best of a large search against one baseline run inflates the gain. Fix the comparison in advance and report every seed, failed run, and exclusion.
:::

## 23. Undertraining and false conclusions

The validation curve is still falling steeply when training stops. One architecture may learn faster early while another needs longer to show its advantage. A short run answers a short-budget question only.

### Insufficient tokens and too few optimization steps

**Undertraining** means the budget is too small for the regime the experiment means to test, judged from learning curves, data exposure, and the stated goal. Bad data, bugs, or a weak recipe can also cause poor held-out results.

@fig training_budget_visibility | A schematic learning-curve comparison marks an early and a later observation window. It contains no measured values and shows why a short run cannot set a final ranking.

The planned OCTLM Day 3 configuration, 2,000 steps at batch 8 and length 256, processes 4,096,000 positions. With 3,740,160 parameters, that is `4,096,000/3,740,160=1.095140` positions per parameter. The earlier 400-step budget gave 819,200 positions. Section 26 places these numbers in the project decision.

### Tiny models and architecture effects hidden by noise

A **tiny-model proxy** is a small experiment meant to reveal how a larger design behaves. It is good for shape checks, mask checks, and debugging, but its quality ranking may not transfer when depth, data, optimizer, or hardware change. Some designs only matter at the scale where their bottleneck appears.

Hoffmann and colleagues' 2022 compute-optimal study is often summarized as about 20 training tokens per parameter in its regime. Twenty times the OCTLM count is 74,803,200 positions, `74,803,200/4,096,000=18.2625` times the planned budget. That rule is context, not a universal minimum or convergence certificate. [Chinchilla scaling study](https://arxiv.org/abs/2203.15556).

So state what a small experiment can establish. An exact mask count and a passing cache test establish implementation properties; a quality claim needs training in the intended regime with controls. Do not drop an idea because one underpowered pilot was inconclusive, or promote it because the code runs.

:::note Small models can still answer real questions
A well-defined simple task can be learned by a small model. TinyStories trained small language models on a deliberately simple story distribution. That says nothing about general instruction following, but "small" does not mean "useless." [TinyStories paper](https://arxiv.org/abs/2305.07759).
:::

## 24. Measuring research architectures

The paper reports faster inference. Was the prompt processed faster, or were output tokens produced faster once the cache existed? The two phases have different shapes and bottlenecks.

### Validation loss and BPB

**Validation loss** is the declared loss on held-out data under a specified tokenizer and reduction, usually mean negative log probability per token. Compare it directly only when tokenization and targets agree.

**Bits per byte**, or **BPB**, divides total negative log likelihood by the number of text bytes:

$$
\mathrm{BPB}=\frac{\sum_t-\ln p(x_t\mid x_{<t})}{N_{\mathrm{bytes}}\ln2}.
$$

Read this as convert total loss from nats to bits, then divide by the raw bytes the targets cover. Define how special tokens, boundary context, and padding count. Different tokenizers give the same bytes different token counts, which is why per-token loss compares poorly across tokenizers.

An 8-byte text with total loss `12 ln 2` has `12/8=1.5` BPB. Over 4 tokens its mean token loss is `12 ln 2 /4 =3 ln 2=2.079442` nats: the same probabilities over a different denominator.

### Memory usage, training speed, prefill speed, decode speed, and KV-cache size

**Prefill** processes the known prompt and builds its attention states. **Decode** extends the sequence one token, or one verified batch, at a time. **Throughput** is work per unit time; **latency** is elapsed time for one request or phase. A larger batch can raise throughput and worsen latency.

| Measurement | Declare | Common mistaken inference |
|---|---|---|
| Validation loss/BPB | Corpus, targets, denominator, tokenizer | Lower train loss proves better generalization |
| Memory | Weights, cache payload, peak allocated and reserved bytes | Formula bytes equal whole-process usage |
| Training speed | Useful tokens per second, batch, sequence length, precision | More steps per second means more useful training |
| Prefill | Prompt length, batch, kernel, warmup | Prefill gain guarantees decode gain |
| Decode | Context, emitted tokens, batch, sampler, cache | Short-context speed applies at every length |
| KV cache | Stored tensors, dtype, token count, padding/pages | Fewer KV heads prove faster wall time |

Synchronize asynchronous device work at timing boundaries or use device events. Warm up outside the timed runs, repeat, and record hardware and software versions. Reset peak-memory counters, separate allocated from reserved memory, and name the timing statistic.

## 25. Quality vs efficiency

One variant lowers loss but adds decode latency. Another keeps loss and halves cache memory. They serve different deployments, and one "best model" label hides the choice.

### Better loss but slower model and other trade-offs

A **Pareto improvement** makes at least one declared objective better and none worse. A **Pareto frontier** holds the candidates no other candidate dominates. Uncertainty and untested tasks still limit what the frontier says.

| Illustrative candidate | Held-out loss | Decode time/token | KV payload |
|---|---|---|---|
| Baseline | 2.12 | 10 ms | 32 MiB |
| A | 2.10 | 12 ms | 32 MiB |
| B | 2.12 | 8 ms | 16 MiB |
| C | 2.18 | 6 ms | 10 MiB |

@fig architecture_tradeoff_scatter | The plotted loss and time are illustrative arithmetic fixtures. Candidate B matches baseline loss while reducing time and memory; A and C trade quality for time in opposite directions.

### Choosing meaningful trade-offs

With these values B dominates the baseline: equal loss, `10-8=2 ms` faster, `32-16=16 MiB` less cache. A improves loss by `2.12-2.10=0.02` and costs 2 ms. C saves `10-6=4 ms` and raises loss by `2.18-2.12=0.06`. A real experiment would attach uncertainty to each difference.

Set acceptance criteria before testing. A memory-bound agent may need its cache to fit at the target batch while tool success stays above a floor; a claim about loss per training compute needs a different criterion. State the trade-off plainly: same task quality in less memory, or a stated quality cost for lower latency.

:::interview Interview lens
**"A new attention layer beats the baseline once. What do you check before believing it?"** A correct baseline, comparable data and budget, and one isolated change. Then repeated seeds and the uncertainty of the difference. Then loss, task quality, prefill, decode, and peak memory on declared hardware. A small pilot can validate mechanics without proving a scalable gain.
:::

:::key In one breath
An architecture comparison needs a declared baseline, one isolated change, and an explicit budget constraint. Repeated seeds estimate uncertainty; the baseline range is not a significance threshold. Undertraining and tiny proxies limit what a run supports. Measure loss or BPB, useful throughput, prefill, decode, and real memory, then judge the trade-off the workload needs.
:::

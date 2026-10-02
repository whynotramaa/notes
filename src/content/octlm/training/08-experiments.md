@part VIII | Comparing experiments fairly | This part separates a change in the method from a lucky run. Initialization, data order and an insufficient training budget can hide or imitate an improvement. We will measure seed spread, compare controlled runs, and state the compute and token budgets before judging an architecture. | where:8

## 24. Experimental noise

Train Finch-24 twice with the same configuration, but change the initialization and sampled windows. The resulting validation losses need not match. Early gradients differ, Adam's histories differ, and later updates follow those earlier choices. One scalar score contains both the effect of the method and the outcome of a particular trajectory.

**Experimental noise** is variation in a reported result caused by random choices or uncontrolled conditions rather than the treatment we intend to compare. Here a **seed** initializes a pseudorandom generator. Different generators can separately control weight initialization, training data, dropout and sampling. A seed value does not identify an experiment without the code, configuration, data and environment that interpret it.

The [earlier reproducibility section](/octlm/attention/13-optimization/#s75) distinguishes repeatable runs from general results. Section 19 explains how to restore a particular trajectory. Here the question changes: would a claimed improvement persist if we repeated the experiment under other valid random choices?

### Where variation enters

Random initialization changes the initial feature directions. Data-order randomness changes which evidence the optimizer receives first, and moment estimates make that history matter. Dropout or stochastic preprocessing adds further draws where those mechanisms are enabled. Nondeterministic floating-point reductions can create small differences that later optimization amplifies. Validation sampling itself can add measurement variation even when the checkpoint is fixed.

For Finch-24, the illustrative five-run baseline losses are 2.10, 2.14, 2.08, 2.12 and 2.16. Their mean is 2.12, and their range is 0.08. Looking only at the first run and the third run could make unchanged code appear to improve by 0.02. That is why a single comparison of 2.10 and 2.08 does not settle an architecture question.

@fig train_seed_spread | Five illustrative baseline runs span 2.08 to 2.16 nats per token. The dots are computed examples, not measured results; the center line marks mean 2.12.

To isolate training variance, evaluate every checkpoint on the same fixed validation targets. To study sensitivity to initialization, hold the data schedule fixed while varying only initialization. To estimate ordinary deployment-of-the-training-recipe variation, vary the intended random components together. These are different experiments and should be named differently.

:::story Picture this
Compare two recipes by baking each in the same ovens on the same days. Oven variation still exists, but pairing the recipes by day makes their difference easier to read. Baking one recipe on a good day and the other on a bad day confuses the recipe with the conditions; training seeds and data schedules can create the same confusion.
:::

## 25. Seed spread and fair comparisons

Our proposed change gets illustrative losses 2.09, 2.11, 2.07, 2.10 and 2.13. Every value looks plausible beside the baseline. To compare them, we need the central result, the spread, and the relationship between runs rather than just the lowest number.

The **sample mean** estimates average performance over the tested run distribution. **Sample variance** measures squared deviations from that mean, using a denominator of one less than the sample count for the usual unbiased variance estimate. Its square root is the **sample standard deviation**, the run-to-run spread in the original metric units. A **standard error** instead estimates uncertainty in a mean under stated sampling assumptions.

$$
\bar x=\frac{1}{n}\sum_{i=1}^{n}x_i,
\qquad
s_x^2=\frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar x)^2.
$$
Read this as averaging the $n$ run scores $x_i$, then averaging their squared deviations with denominator $n-1$. The symbol $\bar x$ denotes the mean, $s_x^2$ the sample variance, and $n$ the number of independently sampled runs. Treating dependent reruns as independent makes uncertainty look smaller than it is.

### A paired worked example

Suppose each row uses a shared data schedule and a declared matched initialization policy. Record variant minus baseline within each row. Lower NLL is better, so negative differences favor the variant. The losses and their differences are illustrative values generated in `numbers.py`.

| Pair | Baseline NLL | Variant NLL | Variant minus baseline |
|---|---|---|---|
| 1 | 2.10 | 2.09 | -0.01 |
| 2 | 2.14 | 2.11 | -0.03 |
| 3 | 2.08 | 2.07 | -0.01 |
| 4 | 2.12 | 2.10 | -0.02 |
| 5 | 2.16 | 2.13 | -0.03 |

The baseline mean is 2.12 with sample standard deviation 0.031623. The variant mean is 2.10 with standard deviation 0.022361. Pairwise differences average -0.02 with standard deviation 0.01. For these five independent pairs, the estimated standard error of their mean difference is $0.01/\sqrt5=0.004472$.

@fig train_paired_seeds | The same illustrative five comparisons are connected by pair. Each orange endpoint is below its baseline endpoint, and the paired differences are smaller than the raw run spread.

$$
\delta_i=b_i-a_i,
\qquad
\bar\delta=\frac{1}{n}\sum_i\delta_i,
\qquad
\operatorname{SE}(\bar\delta)=\frac{s_\delta}{\sqrt n}.
$$
Read this as computing the variant score $b_i$ minus baseline score $a_i$ within each pair, averaging those differences, and dividing their sample standard deviation $s_\delta$ by the square root of the pair count. Pairing can reduce nuisance variation when the matched conditions move both methods similarly. It is not an excuse to claim a distribution-free guarantee from a small set of runs.

### A noise floor is a measurement limit

A **noise floor** in this context is the size of changes our current experiment can reliably distinguish. It depends on run variance, evaluation-set size, independence, the number of runs and the analysis policy. It is not always equal to one standard deviation. A small average effect can be distinguishable after many well-controlled independent repeats; a large best-run effect can disappear under honest repetition.

Report what an error bar represents: standard deviation, standard error or a confidence interval. Show the sample count and whether the comparison is paired. Small-sample uncertainty, skewed scores, cherry-picked seeds and many unreported trials all weaken the claim. Validation improvements should survive an independent held-out assessment rather than just additional tuning on the same split.

### The controlled experiment

A **controlled experiment** changes the treatment of interest while keeping other relevant choices fixed or explicitly accounting for them. For an architecture comparison, keep tokenizer, data splits, training mixture, evaluation targets, context policy and loss definition fixed. Declare whether the resource constraint is equal parameters, equal tokens, equal estimated FLOPs or equal wall-clock time. These budgets answer different questions.

An FFN variant that expands more channels may improve loss simply by adding parameters and computation. A faster attention kernel can fit more tokens into a fixed time budget without changing the mathematical architecture. Both can be useful results, but the causal claim should match the comparison. Record the matched baseline, the actual resource use and the uncertainty, not only the winning checkpoint.

:::warn Watch out
The same integer seed does not guarantee the same data order after an architecture edit. A changed initialization can consume a different number of random draws before the sampler starts. Give initialization and data independent generators, and save or predeclare the data schedule when matching runs.
:::

## 26. Undertraining

Give Finch-24 one million supervised token presentations. At 64 valid targets per accumulated update, that is 15,625 updates. Its unique parameter count is 40,509,952, so the presentations-to-parameters ratio is only 0.024685. Those counts do not prove failure, but they expose how little fitting opportunity was provided relative to model size.

**Undertraining** means stopping before the model has received enough optimization and data exposure for the comparison or intended objective. It differs from insufficient capacity: a larger model may look worse simply because its training trajectory is less developed at the measured budget. It also differs from an optimizer bug. We first need a correct training procedure before asking whether it has run long enough.

### Model size, data size and steps

Distinguish unique data tokens from tokens presented during training. Repeating a small corpus increases presentations but adds no new documents; it can reduce training loss while increasing overfitting. A step count by itself is incomplete because batch size, sequence length, masks and accumulation change how many targets a step contains. Log both successful updates and token presentations, with the data-reuse policy.

For an unmasked single-process experiment, presentations equal executed updates times $A B T$, where $A$ is the accumulation count. With our $A=4$, $B=2$ and $T=8$, each update uses 64 targets. Real runs with rejected batches, masks or FP16 overflow skips need separate consumed-token and successful-update accounting, as Section 20 explains. A scheduled run must also state whether its learning rate is indexed by updates or consumed tokens.

@fig train_training_budget | Finch-24's illustrative update budget is a rectangle of four microbatches, two sequences and eight target positions. One million presentations correspond to 15,625 such 64-token updates.

### Scaling intuition without a universal recipe

Hoffmann and colleagues' 2022 [Chinchilla study](https://arxiv.org/abs/2203.15556) showed that a compute-optimal allocation under its tested conditions balances model size with more training tokens, rather than spending nearly all the budget on a larger model. The familiar roughly 20-token-per-parameter heuristic belongs to that fitted regime. It is not a law for every dataset, tokenizer, architecture, training stage or deployment objective.

Applying that heuristic illustratively to Finch-24 gives $20\times40{,}509{,}952=810{,}199{,}040$ token presentations. At 64 targets per update, covering at least that count requires 12,659,360 updates. This absurdly large count for our tiny demonstration batch illustrates why a readable shape example is not a production batch recommendation. A real experiment would choose its batch and schedule together with the available hardware and objective.

Inference cost changes the optimum. Training a smaller model for longer may cost more once during pretraining and save repeated serving cost later. Data quality, limited unique data and context-dependent attention costs also change the trade-off. The [Llama 3 report](https://arxiv.org/abs/2407.21783) is a dated example of a recipe chosen for broader constraints than the historical pretraining-compute optimum.

$$
C\approx6PD.
$$
Read this as an approximate dense-model training compute ledger: $C$ is floating-point operations, $P$ is the parameter count used in the approximation, and $D$ is presented training tokens. The factor 6 summarizes dense projection forward and backward work; this estimate omits sequence-length-dependent attention work and many systems costs. Sparse activation, tied lookup details, rematerialization and optimizer overhead can change the accounting.

For the illustrative one-million-token Finch budget, this approximation gives $6\times40{,}509{,}952\times1{,}000{,}000=243{,}059{,}712{,}000{,}000$ FLOPs. This is computed arithmetic under a named approximation, not a measured hardware throughput or an exact model operation count. Use exact tensor-operation counts or a profiler when the omitted work matters.

@fig train_undertraining_curves | Illustrative crossing learning curves show why a ranking at an early budget can differ from a ranking after more training. The picture demonstrates a possibility, not a promise that the larger model must win.

### What a fair conclusion sounds like

“I found a lower held-out NLL at equal token budget with matched data and multiple seeds” is a useful result. “This architecture is always better” is a different claim and needs evidence across budgets, datasets and tuning policies. If the curves are still moving, disclose that the comparison measures performance at that budget. Learning speed is an outcome; final attainable quality is another outcome.

:::note Equal-budget choices
Equal tokens asks which method learns better from the same amount of presented evidence. Equal FLOPs asks which method uses an arithmetic budget better. Equal wall-clock time also measures implementation and hardware efficiency. Equal parameter count isolates one capacity budget, but does not imply equal computation or equal memory.
:::

:::interview Interview lens
**"Your new architecture improves validation loss by 0.02. How do you defend the claim?"** I would show the same tokenizer, data and evaluation contract, the resource budget, and repeated controlled runs. I would report the mean difference and its uncertainty, using matched pairs only when the pairing is valid. I would also inspect learning curves across training budgets, because a lucky seed, extra parameters or a baseline stopped too early can produce the same apparent improvement.
:::

:::key In one breath
A single run mixes method effects with initialization, data-order and execution variation. Measure seed spread, report the sample count, and distinguish run standard deviation from uncertainty in a mean. Controlled comparisons must name their data, evaluation and resource contracts. Undertraining can reverse an architecture ranking, and historical scaling heuristics guide experiments rather than replacing them.
:::

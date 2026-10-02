@part VII | Measuring the predictor | This part turns held-out next-token scores into interpretable measurements. A falling training curve alone cannot show generalization, and a metric with the wrong denominator can reverse a comparison. We will read paired curves, compute perplexity, and normalize likelihood by bytes when tokenizers differ. | where:7

## 21. Training loss versus validation loss

Suppose Finch-24's training loss keeps falling while its held-out loss bottoms out and then rises. The optimizer is succeeding at its assigned job: fitting the examples it sees. That does not mean the predictor is improving on new text. We need separate measurements of fitting and transfer.

**Training loss** measures next-token error on the training distribution under a declared measurement procedure. **Validation loss** measures that error on held-out examples used for choices such as the learning-rate schedule or checkpoint selection. **Generalization** is the ability to retain useful predictive behavior on examples outside the fitted sample. The [earlier loss-curve introduction](/octlm/attention/13-optimization/#s74) provides the basic picture; here the emphasis is on making those curves comparable.

An online training loss can include dropout, data augmentation, changing batches and parameters updated throughout the reporting interval. Validation normally uses fixed weights, evaluation mode and a stable held-out set. For a cleaner comparison, periodically score a fixed training subset with the same evaluation settings as validation. Otherwise some of the gap is measurement policy rather than memorization. With Finch-24's no-dropout configuration, differences in data selection and timing still remain.

### Reading the curve without inventing a diagnosis

**Overfitting** means further fitting to the training sample harms, or fails to improve, the chosen held-out objective. **Underfitting** means the model has not fitted the relevant predictive structure well enough. Insufficient capacity can cause underfitting, but so can a poor optimizer, too few updates, harmful regularization or broken labels. A high loss by itself does not identify which explanation is correct.

Our illustrative curve has training losses 4.8, 3.5, 2.8, 2.3, 1.9, 1.65 and 1.5 at updates 0, 100, 200, 400, 600, 800 and 1,000. Its validation losses are 4.9, 3.6, 2.95, 2.6, 2.55, 2.7 and 2.9 at the same updates. The best measured checkpoint is update 600 for this validation protocol, even though update 1,000 fits training text better. These are computed illustrative coordinates, not observations from a trained Finch run.

@fig train_loss_curves | Illustrative curves show training loss continuing downward after validation loss reaches its minimum at update 600. Orange marks the held-out curve and the model-selection point; these are not measured training results.

A flat pair of curves can mean optimization has converged, capacity is limited, or the learning rate is too small. A noisy validation curve may come from a small evaluation set or changing random windows. A sudden jump can mean a learning-rate change, a data-mixture change, a corrupt checkpoint or nonfinite arithmetic. Read the logs and inspect the data before assigning a story to the line.

### Aggregation and honest selection

For the ordinary unweighted next-token objective, accumulate summed NLL and the exact number of valid targets across the entire evaluation set. Divide once. If one validation batch contains two valid targets with mean loss 2 and another contains six with mean loss 4, total NLL is $2\times2+6\times4=28$ and the token count is 8. The correct mean is 3.5; the mean of batch means is 3. That error comes entirely from the denominator.

$$
\widehat{\mathcal L}_{\mathrm{val}}=\frac{\sum_b S_b}{\sum_b n_b}.
$$
Read this as total validation loss divided by total supervised tokens: $S_b$ is the summed next-token NLL in batch $b$, and $n_b$ is its valid-target count. Accumulate these totals with sufficient numerical precision and evaluate the same token positions for every model. Padding, context-only overlap and ignored targets contribute neither NLL nor denominator.

@fig train_metric_reduction | Two illustrative evaluation batches contain different token counts. Token weighting gives 28 divided by 8, or 3.5; treating the batches equally gives 3.

Validation is for development decisions; the test split is for an evaluation after those decisions are fixed. Repeatedly optimizing architecture and data choices against validation can overfit that split too. Record what was selected, how often the split was inspected, and whether the reported metric came from validation or an untouched test set. A model's best checkpoint is defined relative to the chosen objective, not every possible user task.

:::story Picture this
Two classes take a test: one has two pupils, the other has six. Averaging the class averages gives the small class the same influence as the large class. To measure the average pupil's result, add every pupil's score and divide by the total number of pupils; supervised tokens play the pupils' role in our evaluation.
:::

## 22. Perplexity

A target probability of one quarter costs $-\ln(1/4)=\ln4$ nats. Exponentiate that loss and you get 4. We have converted a logarithmic penalty into a reciprocal-probability scale. That is the starting point for understanding **perplexity**, abbreviated PPL.

For one target, the exponentiated NLL is its reciprocal probability. For an evaluation set, perplexity is the exponential of the mean token NLL, not the arithmetic mean of per-token reciprocals. It describes the geometric average penalty assigned to the observed continuations. Lower is better for the same data and evaluation contract.

$$
\operatorname{PPL}=\exp\!\left(-\frac{1}{n}\sum_{i=1}^{n}\ln p_i\right)
=\left(\prod_{i=1}^{n}\frac{1}{p_i}\right)^{1/n}.
$$
Read this as the geometric mean of reciprocal correct-token probabilities: $n$ is the number of supervised targets and $p_i$ is the probability assigned to target $i$ under its declared context. The equality follows by exponentiating the average of logarithms. Here loss is in nats; if it were in bits, the corresponding exponential would use base 2.

### A worked comparison

Section 9's four probabilities, 0.5, 0.25, 0.125 and 0.125, give per-token perplexities 2, 4, 8 and 8. Their product is 512, and its fourth root is 4.756828. Their mean NLL is 1.559581 nats and $\exp(1.559581)=4.756828$ at the displayed precision. The arithmetic mean of 2, 4, 8 and 8 is 5.5, which is a different statistic.

@fig train_perplexity_geometry | Four illustrative token probabilities turn into reciprocal penalties. Dataset perplexity is their geometric mean, 4.756828, rather than their arithmetic mean, 5.5.

A model choosing uniformly among four candidates would also have PPL 4 on those targets. This gives a useful “effective branching” intuition, but a real model need not be uniform, and PPL is not a literal count of equally plausible next tokens. A loss improvement of 0.5 nats changes PPL by a factor of $e^{0.5}=1.648721$. Ratios are often easier to interpret than subtracting PPL values.

### Tokenizer and context dependence

Changing tokenizers changes the prediction events and the denominator. A tokenizer can make the same string into fewer, harder-to-predict tokens or more, easier-to-predict tokens. Perplexity is therefore unsuitable for a direct cross-tokenizer ranking unless the tokenization is held fixed. The [earlier vocabulary discussion](/octlm/attention/01-tokenization/#s7) introduces this problem; Section 23 works through a denominator that is shared by the raw text.

Context policy changes the conditionals too. Resetting at every disjoint chunk deprives boundary tokens of previous context. A sliding or strided window can preserve more context, but overlapping context tokens must not be counted again as fresh targets. The [Transformers evaluation guide](https://huggingface.co/docs/transformers/en/perplexity) documents this fixed-context issue. Choose a policy, score each target once, and disclose stride, maximum context, boundary handling and any excluded initial targets.

@fig train_eval_windows | Illustrative overlapping evaluation windows use earlier tokens as context while scoring only newly introduced targets. Orange means “count this target once,” not “hide this token from attention.”

Perplexity measures likelihood on the chosen corpus, not factual accuracy, helpfulness, reasoning reliability or calibration on every task. Label smoothing, class weighting and auxiliary objectives also mean a reported “training loss” may not be plain token NLL; exponentiating that mixed objective does not produce ordinary perplexity. Compute the metric from the actual unweighted next-token log probabilities. Evaluate the model distribution, before generation temperature or truncation.

:::warn Watch out
Do not average per-batch perplexities. Sum valid-token NLLs, divide by their combined count, and exponentiate once. Also check whether the model's API shifts labels internally: passing already shifted labels to an API that shifts them again changes the prediction task.
:::

## 23. Bits per byte

Two tokenizers encode the same eight bytes, but one uses four tokens and the other uses eight. Suppose both assign their chosen encodings the same total NLL, $8\ln2=5.545177$ nats. The first gets PPL 4 and the second gets PPL 2. There is no likelihood improvement in this example. The unit of averaging changed.

**Bits per byte**, or BPB, divides total negative log probability in bits by the number of evaluated raw bytes. A **bit** is the base-2 information cost of halving probability; a nat is the corresponding natural-log unit. To convert nats to bits, divide by $\ln2$. Byte normalization supplies a denominator tied to text rather than the tokenizer's segmentation.

$$
\operatorname{BPB}=\frac{-\sum_{i=1}^{n}\ln p_i}{M\ln2}
=\frac{n\mathcal L}{M\ln2}.
$$
Read this as total coding cost in bits divided by evaluated bytes: $M$ is the byte count of the same scored text span, $n$ is its token count, and $\mathcal L$ is its mean token NLL in nats. The formula does not average per-token BPBs. It uses one text-level numerator and denominator.

For the example, $5.545177/\ln2=8$ bits at displayed precision. Dividing by eight bytes gives BPB 1 for either tokenizer. With four tokens, mean NLL is $\ln4=1.386294$, so PPL is 4. With eight tokens, mean NLL is $\ln2=0.693147$, so PPL is 2. The two metrics answer related questions with different units.

@fig train_bpb_segmentation | Illustrative tokenizers segment the same eight raw bytes differently. Equal total NLL gives equal BPB, even though token-normalized perplexities differ.

### Bytes mean bytes

Use an explicit encoding such as UTF-8. The string *café* has four Unicode code points and five UTF-8 bytes in its composed form. A decomposed accent can encode differently; normalization decisions are part of the data contract. `len(text)` in Python counts code points, while `len(text.encode("utf-8"))` counts bytes. Count the actual canonical evaluation stream.

Special tokens have no ordinary text-byte contribution. Decide consistently whether document boundaries, BOS and EOS are scored and how their costs belong in the text-level numerator. Excluding a prefix from loss while counting its bytes in the denominator artificially improves BPB. Context-only bytes are conditioning information, not fresh evaluated bytes. Store scored spans or offsets so numerator and denominator refer to the same material.

### What BPB fixes and what it does not

BPB removes the arbitrary number-of-tokens denominator, making a cross-tokenizer comparison more meaningful on the same losslessly represented byte stream. It does not make preprocessing, context length or dataset choice irrelevant. Different tokenizers also expose different numbers of raw bytes within a fixed token context; disclose that difference or control the raw-context policy where the experiment requires it.

A token model assigns probability to token sequences. If multiple token sequences decode to the same byte string, the likelihood of one canonical encoding is not necessarily the model's marginal probability of that string, which would sum over all matching encodings. Standard BPB reporting uses a declared canonical encoding and its sequence likelihood. It is a useful reproducible comparison, not a proof that every tokenizer induces the same byte-level probability model.

| Property | Perplexity | Bits per byte |
|---|---|---|
| Numerator | Next-token NLL | Same NLL converted to bits |
| Denominator | Valid predicted tokens | Corresponding raw bytes |
| Output | Exponentiated mean | Mean bits per byte |
| Shared tokenizer needed | Yes for direct ranking | Not for the denominator |
| Shared data policy needed | Yes | Yes |
| Measures task success directly | No | No |

:::note A compression interpretation
An ideal arithmetic coder driven by the same causal probabilities approaches their total negative log probability in bits, apart from finite coding overhead and framing costs. BPB therefore has a compression interpretation under a shared encoding and boundary contract. It is not the measured size of a model checkpoint or of a general-purpose compressed archive.
:::

:::interview Interview lens
**"Can a model have lower perplexity but worse text likelihood?"** Yes, if tokenizers differ, because perplexity divides by different numbers of prediction events. I would compare the total NLL of a common lossless text stream normalized by its evaluated UTF-8 bytes, while holding data, boundaries and context policy fixed. BPB repairs the unit mismatch, but it does not repair data leakage or hidden preprocessing differences.
:::

:::key In one breath
Training loss measures fitting; validation loss measures held-out prediction under a declared protocol. Aggregate summed NLL by valid target count before computing perplexity, $\operatorname{PPL}=e^{\mathcal L}$. PPL is tokenizer- and context-dependent, whereas BPB divides the same sequence cost in bits by its corresponding raw bytes. Neither metric replaces task evaluation, and both require honest splits and consistent scoring boundaries.
:::

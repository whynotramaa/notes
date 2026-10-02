@part XIII | Training: From Random Numbers to a Model | Everything so far assumed the model's 42 million numbers were already good. A new model's weights are random and its predictions are noise; training is the loop that turns them into something useful. This part builds that loop from the loss that measures a miss, through gradients and the optimizer that follows them, to the learning-rate schedule and the safety nets, and ends with what it takes to run the same training twice and get the same answer. | where:13

## 69. One Loop, Repeated Many Times

Training is one loop, repeated tens of thousands of times. Grab a **batch** of text: for Finch-19, 256 sequences of 1,024 tokens, which is 262,144 tokens. Run it **forward** through the model to get logits at every position. Compute the **loss**, a single number that says how wrong those predictions were. Run **backward** to compute the **gradient**: for every one of the 42,128,384 weights, which direction would lower the loss, and how strongly. Let the **optimizer** take a step, nudging every weight a little in its downhill direction. Then **zero** the stored gradients so they do not pile into the next step.

@fig train_loop | One training step. Every model you have heard of was trained by running these six moves over and over, with the line of code for each move beside it.

That is the whole algorithm. Everything else in this part is about doing each move well: how to measure "wrong", how to compute the downhill direction for 42 million weights at once, how big a step to take, and how to keep the process stable and repeatable.

## 70. Measuring a Miss: Cross-Entropy

At every position the model outputs a probability for each of the 32,000 tokens. We know the correct next token. The loss used for language models is the **cross-entropy**, which for one position is beautifully simple: take the probability the model gave to the correct token, and compute minus its natural logarithm.

$$\text{loss} = -\ln p(\text{correct token})$$

Read the behaviour off the formula. If the model gave the correct token probability 1, the loss is $-\ln 1 = 0$: no surprise at all. At $p = 0.9$ the loss is 0.105. At $p = 0.5$ it is 0.693. At $p = 0.1$ it is 2.303. At $p = 0.01$ it is 4.605. As the probability approaches zero, the loss shoots towards infinity. The model is punished hardest for being confidently wrong, which is exactly the behaviour we want. The unit of this loss is the **nat**, because it uses the natural logarithm; dividing by $\ln 2$ converts it to bits (Section 7).

@fig neglog | The cross-entropy loss for one position. Near p = 1 it is almost zero; as p falls toward zero it climbs steeply. Being confidently wrong is very expensive.

The loss for a batch is the average over all positions in it, 262,144 of them for Finch-19. Two numbers are worth knowing by heart. At the start of training, the model's predictions are close to uniform, roughly $1/V$ for every token, so the loss should be about $-\ln(1/32{,}000) = \ln 32{,}000 = 10.37$. If your untrained model reports a loss of 50, or 2, something is broken before you even start. And **perplexity**, from Part I, is just $e^{\text{loss}}$: at the start it is $e^{10.37} = 32{,}000$, meaning the model is as unsure as if it were picking uniformly among all 32,000 tokens.

:::interview Interview lens
**"What loss should an untrained language model have, and why?"** About $\ln V$. At initialization the logits are small and similar, so softmax is close to uniform and the probability of the correct token is about $1/V$; cross-entropy is $-\ln(1/V) = \ln V$, which is 10.37 for a 32,000-token vocabulary. It is a quick sanity check: a very different starting loss usually means a bug in initialization, masking, or the loss calculation.
:::

## 71. Gradients: Which Way Is Downhill

Picture the loss as hilly terrain. Every possible setting of the 42 million weights is a point, and the loss at that point is the height. Training is walking downhill toward low ground. The **gradient** tells you the slope under your feet: for each weight, how much the loss would change if you nudged that weight up a tiny bit. A negative slope for a weight means increasing it lowers the loss; a positive slope means decreasing it does.

Take a toy loss with one weight, $L(w) = (w - 3)^2$, whose lowest point is at $w = 3$. Standing at $w = 1$, the loss is 4 and the slope is $2(w - 3) = -4$. The slope is negative, so we should increase $w$. **Gradient descent** takes a step against the slope, scaled by a small number called the **learning rate**, $\eta$ (eta):

$$w \leftarrow w - \eta \, \frac{\partial L}{\partial w}$$

With $\eta = 0.1$: $w \leftarrow 1 - 0.1 \times (-4) = 1.4$. The loss drops from 4 to 2.56. Repeat, and $w$ creeps toward 3. The symbol $\partial L / \partial w$ is the partial derivative, mathematician's notation for "the slope of $L$ in the direction of $w$, holding everything else fixed".

@fig gradient_slope | A gradient is a slope. At w = 1 the slope of (w − 3)² is −4, so a step against it with learning rate 0.1 moves w to 1.4, closer to the minimum at 3.

For 42 million weights, the gradient is a list of 42 million slopes, one per weight, and computing them efficiently is the job of **backpropagation**. The idea is the chain rule from calculus, applied backwards through the model. The loss depends on the logits, which depend on the last block's output, which depends on the block before, and so on down to the embedding rows. Backpropagation starts at the loss and walks backward through each operation, multiplying local slopes together, so that one backward pass costs only about twice a forward pass and yields every weight's slope at once. PyTorch's `loss.backward()` does this automatically; it records every operation during the forward pass and replays them in reverse. This is also where the residual stream of Section 65 earns its keep: at each plus sign, the backward signal flows straight down the main line as well as through the sub-layer.

## 72. How Big a Step, and Which Direction

### The learning rate

The learning rate is how big a step you take downhill, and getting it right is the most important tuning choice in training. Run six steps on our toy loss from $w = 1$. With $\eta = 0.01$, $w$ only reaches 1.23: far too slow. With $\eta = 0.1$ it reaches 2.48: steady progress. With $\eta = 0.45$ it lands at 3.00 within three steps. With $\eta = 1.1$, it goes 1, 5.4, 0.12, 6.46, $-1.15$, 7.98, $-2.97$: each step overshoots the valley by more than the last, and training diverges.

@fig lr_bowl | Six steps from the same start at four learning rates. Too small crawls, well chosen converges, too big overshoots further on every step.

Real loss surfaces are not one tidy bowl, and the best learning rate is not knowable in advance; it is found by experiment. For a model of Finch's size, a peak learning rate around $6 \times 10^{-4}$ is typical. Larger models use smaller ones.

### Adam and AdamW

Plain gradient descent, often called **SGD** (stochastic gradient descent, "stochastic" because each batch is a random sample of the data), uses the same learning rate for every weight. That works badly in long, narrow valleys, which are common in real models: the steepest slope points mostly across the narrow side, so SGD zig-zags from wall to wall and makes slow progress along the valley floor.

**Adam**, introduced by Diederik Kingma and Jimmy Ba in 2014, fixes this by keeping two running averages for every weight: $m$, the average of recent gradients (which direction it has been pushed lately), and $v$, the average of recent *squared* gradients (how large its pushes usually are). Each step moves the weight by $m / \sqrt{v}$, scaled by the learning rate.

$$m \leftarrow \beta_1 m + (1 - \beta_1)\, g \qquad v \leftarrow \beta_2 v + (1 - \beta_2)\, g^2 \qquad w \leftarrow w - \eta \, \frac{\hat m}{\sqrt{\hat v} + \varepsilon}$$

Here $g$ is the current gradient for this weight, $\beta_1$ and $\beta_2$ (typically 0.9 and 0.95 for language models) control how long the averages remember, and $\hat m$, $\hat v$ are the averages with a small correction for their first few steps. Dividing by $\sqrt{v}$ means a weight whose gradients are usually huge takes cautious steps and a weight whose gradients are usually tiny takes bolder ones. The zig-zag across the valley, where gradients are large and alternate in sign, gets damped; the steady push along the valley floor accumulates in $m$.

@fig sgd_adam | In a long, narrow valley, plain gradient descent bounces from wall to wall while Adam's per-weight step sizes head down the valley. (Illustrative.)

**AdamW**, by Ilya Loshchilov and Frank Hutter in 2017, adds **weight decay** done correctly: every step, each weight is also shrunk slightly toward zero, separately from the gradient step, which discourages weights from growing large without reason. AdamW trains almost every large language model today. Its cost is memory: two extra numbers per weight. For Finch-19 in 32-bit precision, weights, gradients, $m$ and $v$ together take $42{,}128{,}384 \times 16$ bytes, about 674 megabytes.

## 73. Warmup, Decay and Clipping

### The schedule

The learning rate is usually not fixed. The standard shape starts tiny and rises in a straight line for a short **warmup**, because at the start the weights are random, Adam's averages have not settled, and big steps can wreck the model. Then it slowly decays along a cosine curve toward a small final value, so the model can settle into a good spot at the end instead of bouncing around it. Finch-19's schedule warms up for 200 steps to $6 \times 10^{-4}$, then decays: about $3.4 \times 10^{-4}$ halfway through, $6 \times 10^{-5}$ at step 10,000. Most large models use something very close to this shape.

@fig lr_schedule | Linear warmup, then cosine decay. Big steps early when there is far to go, small steps late to settle.

### Gradient clipping

Sometimes a batch produces a huge gradient, from an odd example or a numerical spike, that would send the weights flying. **Gradient clipping** caps the total length of the gradient vector at a threshold $c$:

$$g \leftarrow g \cdot \min\!\left(1, \frac{c}{\lVert g \rVert}\right)$$

If the gradient is short enough it is left alone. If it is longer than $c$, it is scaled down to length $c$, keeping its direction. With $g = [4, 3]$, the length is 5; with $c = 1$ the scale is 0.2, giving $[0.8, 0.6]$, length 1, pointing the same way. Nearly every large training run clips at a total length of 1.0, computed across all 42 million slopes at once.

@fig grad_clip | Gradient clipping keeps the direction and caps the length. A gradient of length 5 becomes length 1.

| Finch-19's recipe | Value |
|---|---|
| Batch | 256 sequences × 1,024 tokens = 262,144 tokens |
| Steps | 10,000 (about 2.6 billion tokens) |
| Optimizer | AdamW, $\beta_1 = 0.9$, $\beta_2 = 0.95$, weight decay 0.1 |
| Learning rate | warmup 200 steps to $6 \times 10^{-4}$, cosine to $6 \times 10^{-5}$ |
| Gradient clipping | total norm 1.0 |
| Precision | bf16 compute, fp32 master weights and optimizer state |

## 74. Reading Loss Curves

The most important diagnostic tool in training is a plot of loss against steps. Always plot two curves. The **training loss** is measured on the batches the model is learning from. The **validation loss** is measured on held-out text the model never trains on.

Early on both fall fast, from about 10.37 toward 3. Then they flatten. If training continues long enough on data that is small compared to the model, the validation loss stops falling and starts *rising* while the training loss keeps going down. That is **overfitting**: the model has begun memorizing its training text instead of learning patterns that carry over to new text. The best checkpoint to keep is the one where validation loss was lowest.

@fig loss_curves | Training and validation loss. Both fall from about ln 32,000; when the model starts memorizing, validation turns upward. Keep the checkpoint at the validation minimum. (Illustrative.)

Large language models usually see each piece of text only once or a few times, so they barely overfit; their curves just flatten. Small experiments, fine-tuning on small datasets, and Finch-sized models trained for many passes over a small corpus overfit all the time. Two other shapes are worth recognizing. A loss that suddenly jumps up mid-training and then slowly recovers is a **loss spike**, usually from an odd batch or a learning rate that is too high. A loss that sits flat at $\ln V$ and never moves usually means the gradients are not reaching the weights at all, from a detached tensor, a learning rate of zero, or a broken mask.

## 75. Running It Twice: Reproducibility

If you cannot rerun an experiment and get the same answer, you cannot tell whether a change helped or you just got lucky. Reproducibility sounds easy and turns out not to be.

Everything "random" in training, the initial weights, the order of the data, dropout, comes from a **random number generator** started from a number called the **seed**. Fix the seed and the "random" numbers come out the same every time. Two runs with the same seed and the same everything else should produce identical loss curves. Two runs with different seeds follow different paths from the start but typically end at similar losses.

@fig repro_runs | Three situations. The same seed gives identical curves; a different seed gives a different path to a similar place; the same seed with nondeterministic GPU kernels starts identical and slowly drifts. (Illustrative.)

The third case is the sneaky one. Some GPU operations add up numbers from thousands of parallel threads in whatever order the threads finish. Floating-point addition is not exactly associative: $(a + b) + c$ can differ from $a + (b + c)$ in the last digit, because each addition rounds. So the same computation, with the same seed, can produce answers that differ in the last bit from run to run. Those tiny differences feed into the next step, and the next, and grow until the curves visibly drift apart.

@fig repro_checklist | What makes a run reproducible. Seeding alone is not enough; data order, kernels, versions, checkpoints and hardware all matter.

### Sharp edges of training

**Atomic adds on GPU.** Use `torch.use_deterministic_algorithms(True)` to force deterministic kernels where they exist, at some speed cost. Operations without a deterministic version will raise an error, which is what you want.

**Different hardware.** Different GPUs, drivers and library versions do arithmetic in slightly different ways. Bit-for-bit matches across machines are rare. Record versions and expect "statistically the same", not "bitwise the same", across machines.

**Data loader workers.** Data loading often runs in several parallel workers. If they share one seed, or get a fresh random one each run, the data order changes between runs. Seed each worker from the base seed plus its worker id.

**Resuming loses state.** If you stop a run and restart from a checkpoint that saved only the weights, Adam's running averages are gone and the schedule restarts from the beginning; the run will not continue as it would have. Checkpoint the weights, optimizer state, scheduler state, random number generator states and the position in the data.

**Changing batch size changes the best learning rate.** A bigger batch gives a less noisy gradient, so the best learning rate usually rises. Doubling the batch and keeping everything else fixed often trains worse. Retune, or scale the learning rate with the batch size and check.

:::warn Watch out
"Set the seed" is the answer people give in interviews, and it is incomplete. A reproducible run needs seeded generators on every device, deterministic kernels, seeded data workers, a recorded data order, pinned library versions, full checkpoints including optimizer and RNG state, and a note of the hardware. Name at least three of those and you have shown you have debugged a real training run.
:::

:::key In one breath
Training repeats batch, forward, loss, backward, step, zero. The loss is cross-entropy, $-\ln p(\text{correct})$, averaged over positions; it should start near $\ln V = 10.37$ for Finch-19, and perplexity is $e^{\text{loss}}$. Backpropagation applies the chain rule backward to get every weight's slope in about twice the cost of a forward pass, and AdamW steps each weight by $\eta\,\hat m / \sqrt{\hat v}$ with decoupled weight decay, under a warmup-then-cosine learning-rate schedule and gradient clipping at norm 1. Watch training and validation curves for overfitting and spikes, and remember that reproducibility needs far more than a seed, because nondeterministic floating-point reductions make same-seed runs drift.
:::

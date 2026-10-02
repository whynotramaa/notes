@part IV | Choosing the parameter update | This part explains how a derivative becomes a training step. Raw gradients alone do not specify memory of earlier batches, regularization, or how the step size changes over the run. We will compare optimizers, separate weight decay from clipping, and calculate a warmup and cosine schedule. | where:4

## 11. Gradient descent and optimizers

Our scalar example ended with a weight gradient of -0.537883. That tells us which local direction reduces its loss, but not how much to move or whether earlier batches should influence the decision. The optimizer supplies that rule and carries any history it needs. The [earlier optimizer introduction](/octlm/attention/13-optimization/#s72) gives the first overview; here we calculate its state.

**Gradient descent** subtracts a positive step size times the current gradient. **Stochastic gradient descent**, or SGD, uses a sampled batch's gradient rather than the whole corpus's gradient. The **learning rate** $\eta$ is that step-size multiplier. "Stochastic" refers to the data estimate, not to adding an arbitrary random direction to the update.

$$
\theta_{s+1}=\theta_s-\eta_s g_s.
$$

Read this as: parameter tensor $\theta$ at update $s+1$ equals its current value minus update $s$'s learning rate $\eta_s$ times batch gradient $g_s$. Every operation is coordinatewise where appropriate. For an illustrative scalar weight 1, gradient 0.2 and rate 0.1, the new weight is 0.98. A larger positive rate makes a larger local move, but the linear downhill prediction need not remain true for a large move.

### Momentum and adaptive learning rates

**Momentum** keeps a running direction so a sequence of consistent gradients can carry more influence than one noisy batch. With the illustrative recurrence $v_s=0.9v_{s-1}+g_s$, initial $v_0=0$, and gradients 0.2 then 0.4, the buffers are 0.2 then 0.58. This convention differs from an exponential average that multiplies the new gradient by $1-0.9$; do not compare numeric momentum states without naming the recurrence.

An **adaptive learning rate** scales updates separately for different parameter coordinates using gradient history. It does not mean the optimizer knows each coordinate's ideal rate or that no global schedule is needed. Large typical squared gradients can reduce one coordinate's normalized update, while another with smaller typical gradients can receive a different scaling.

### Adam's first and second moments

**Adam** tracks an exponential average $m$ of gradients and an average $v$ of squared gradients. The **first moment** is the average of the gradient value. The **second raw moment** is the average of its square, not a centered variance. Because both buffers begin at zero, their early values are biased toward zero; **bias correction** compensates for that initialization under the averaging model.

$$
m_s=\beta_1m_{s-1}+(1-\beta_1)g_s,\qquad
v_s=\beta_2v_{s-1}+(1-\beta_2)g_s^2.
$$

Read this as: keep fraction $\beta_1$ of the old first buffer and add fraction $1-\beta_1$ of the new gradient; do the same for the squared-gradient buffer using $\beta_2$. Both coefficients lie between zero and one. Squaring is elementwise, so the state tensors have the same shapes as their parameters.

$$
\widehat m_s=\frac{m_s}{1-\beta_1^s},\qquad
\widehat v_s=\frac{v_s}{1-\beta_2^s},\qquad
\theta_{s+1}=\theta_s-\eta_s\frac{\widehat m_s}{\sqrt{\widehat v_s}+\epsilon_{\text{opt}}}.
$$

Read this as: divide each moment by its initialization correction, then update with the corrected gradient average divided by the square root of the corrected squared-gradient average plus optimizer epsilon. $s$ counts optimizer updates starting at one for this formula. $\epsilon_{\text{opt}}$ avoids a zero denominator and differs from the norm epsilon in the architecture. Adam's square root is outside its epsilon in this convention.

For illustrative $g_1=0.2$, $\beta_1=0.9$ and $\beta_2=0.999$, the stored values are $m_1=0.02$ and $v_1=0.00004$. Correction gives $\widehat m_1=0.2$ and $\widehat v_1=0.04$. With weight 1, $\eta=0.001$ and $\epsilon_{\text{opt}}=10^{-8}$, the result is 0.99900000005. The first step is close to a signed step of size 0.001 because the gradient's magnitude cancels between numerator and denominator; epsilon prevents exact cancellation near zero.

For $g_2=0.4$, the stored moments become $m_2=0.058$ and $v_2=0.00019996$. Correction gives 0.305263158 and 0.100030015. The next weight is 0.998034818055. Retaining the raw gradient but resetting these buffers would produce a different trajectory. These illustrative settings teach the recurrence; they are not a prescribed Finch-24 training recipe.

@fig train_adam_moments | Two illustrative gradients produce stored and bias-corrected Adam moments. Orange marks the corrected state used by the update, not a new gradient computed from another batch.

Kingma and Ba introduced Adam in 2014. Its adaptive normalization is useful in many training settings, but it is not a general convergence guarantee and it does not replace experiment-specific tuning. **AdamW** applies weight decay separately from that normalization, which Section 12 now makes precise. Adam variants and SGD are alternatives whose quality and memory cost depend on the workload. [Adam](https://arxiv.org/abs/1412.6980), [AdamW](https://arxiv.org/abs/1711.05101).

| Property | SGD | Momentum SGD | AdamW |
|---|---|---|---|
| History buffers | None | Direction buffer | First and second moments |
| Coordinate normalization | None | None | Squared-gradient history |
| Global learning rate | Required | Required | Required |
| Decay policy | Declared explicitly | Declared explicitly | Decoupled |
| Extra named state per scalar | 0 | 1 buffer | 2 buffers |
| Main pitfall | Noisy or oversized moves | Convention mismatch | State reset or wrong decay |

## 12. Weight decay

Two parameter settings may fit a training sample similarly, while one uses much larger values. Penalizing or shrinking weights can change which solution optimization prefers. It can also limit parameter growth. This is a modeling choice, not a theorem that smaller weights always give better language-model quality.

**Regularization** changes the learning procedure to encourage selected properties of the solution. **L2 regularization** adds a penalty proportional to squared weight values to the loss. **Weight decay** shrinks weights during the update. Their equivalence depends on the optimizer and coefficient convention.

$$
\mathcal L_{\text{reg}}=\mathcal L+\frac{\lambda}{2}\|\theta\|_2^2,\qquad
g_{\text{reg}}=g+\lambda\theta.
$$

Read this as: add half the coefficient $\lambda$ times the sum of squared parameter values to the data loss; its derivative adds $\lambda\theta$ to the data gradient $g$. With weight 1, data gradient 0.2 and $\lambda=0.1$, the combined gradient is 0.3. Plain SGD then yields a shrinkage term proportional to the same learning rate as the data update.

Adam processes that combined gradient through its moment estimates and coordinatewise denominator. The penalty then changes the gradient statistics themselves. **Decoupled weight decay** instead shrinks the parameter separately from Adam's moment-based correction:

$$
\theta_{s+1}=(1-\eta_s\lambda)\theta_s-\eta_s\frac{\widehat m_s}{\sqrt{\widehat v_s}+\epsilon_{\text{opt}}}.
$$

Read this as: multiply the old parameter by one minus learning rate times decay coefficient, then subtract Adam's data-gradient update. The moments describe the data gradients, not a data-plus-L2 gradient. With our first Adam example and $\lambda=0.1$, the shrinkage factor is 0.9999 and the result is 0.99890000005. Without a data gradient, repeatedly applying that factor 1,000 times gives 0.904832894 of the original weight, under a fixed rate and decay policy.

@fig train_decay_routes | L2 adds a penalty derivative before Adam's moments. AdamW applies shrinkage on a separate route. These routes differ because adaptive normalization acts on the first route's penalty.

### Which parameters receive decay

A common dense-model policy decays matrix weights and excludes normalization gains and bias vectors. Norm gains control channel scaling, and pushing them toward zero is a different intervention from shrinking a projection matrix. Biases set offsets. Excluding these parameters is a convention to test, not a universal mathematical requirement. Embeddings and a tied head require one consistent shared policy, as Part II explained.

Under an illustrative Finch-24 policy that decays every matrix but no RMSNorm gains, $(2\times8+1)\times512=8,704$ scalars are excluded and 40,501,248 receive decay. Finch-24 has no biases. Deduplicate tied parameters by identity before grouping them; their names alone can describe two roles for the same object.

@fig train_decay_groups | An illustrative Finch-24 grouping decays matrices and excludes RMSNorm gains. Both totals count unique parameters, so the tied head is included once.
 PyTorch's [AdamW documentation](https://docs.pytorch.org/docs/stable/generated/torch.optim.AdamW.html) specifies the decoupled update and optimizer-state loading behavior.

:::note Decay strength depends on the run
The accumulated shrinkage is the product of $1-\eta_s\lambda$ over executed updates. Changing schedule length, accumulation or skipped updates changes that product even if the printed `weight_decay` coefficient stays fixed. Matching one coefficient is not enough to match two experiments' effective decay.
:::

## 13. Gradient clipping

A batch can produce a correction much larger than the recent ones. Applying it directly may destabilize training before the next loss is even measured. Clipping caps the raw gradient magnitude presented to the optimizer; it does not identify the cause of the spike.

The [earlier stabilization overview](/octlm/attention/13-optimization/#s73) introduces clipping. A **global gradient norm** is the Euclidean length of all selected parameter gradients treated as one concatenated vector. **Global norm clipping** multiplies every selected gradient by one common scale if that length exceeds a positive threshold $c$.

$$
G=\sqrt{\sum_j g_j^2},\qquad
g'_j=g_j\min\left(1,\frac{c}{G}\right).
$$

Read this as: square and sum all gradient entries $g_j$, take the square root to get norm $G$, then scale each entry by the smaller of one and threshold $c$ divided by $G$. If $G=0$, no scaling is needed. Implementations may add a tiny numerical stabilizer to the denominator.

For illustrative $g=[3,4]$, the norm is $\sqrt{9+16}=5$. With threshold 1, multiply both entries by 0.2 to obtain $[0.6,0.8]$, whose norm is 1. Elementwise value clipping to `[-1, 1]` would give $[1,1]$ instead, changing the direction and leaving norm $\sqrt2$. These are different operations.

@fig train_clip | Global clipping rescales the illustrative vector `[3, 4]` to `[0.6, 0.8]` at threshold 1. Direction is preserved; the illustration does not claim to bound Adam's eventual parameter-update norm.

In an accumulated update, clip after combining the microbatch gradients. Clipping and addition do not commute: gradients $[3,0]$ and $[-2,0]$ clipped individually at norm 1 sum to zero, while their sum $[1,0]$ clipped once remains $[1,0]$. If using FP16 loss scaling, unscale before measuring and clipping. In sharded training, "global" must include all relevant shards, not merely the local device's fragment.

@fig train_clip_order | Illustrative gradients show why clipping each microbatch changes the update. The accumulated gradient must be measured once, after any loss unscaling.

Clipping nonfinite values is not a repair: a NaN norm cannot define a meaningful scale. Reject the step or investigate the numerical failure. Log the pre-clipping norm and clipping frequency, because frequent clipping may reveal an unsuitable learning rate, data issue or other instability. The [PyTorch norm-clipping contract](https://docs.pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html) defines the combined norm and returns its value before clipping. Pascanu and colleagues discussed norm clipping for recurrent-network instability in their [2012 work](https://arxiv.org/abs/1211.5063).

## 14. Learning-rate scheduling

An aggressive first update acts on uncalibrated representations and moment estimates. A tiny fixed rate may be stable early but spend the whole budget making slow progress. A learning-rate schedule declares how the step multiplier changes as the run advances; it cannot guarantee stability, but it makes that choice explicit.

The [earlier warmup and decay overview](/octlm/attention/13-optimization/#s73) gives the motivation. **Warmup** raises the rate from a small initial value to a chosen **peak learning rate** over an initial interval. **Cosine decay** lowers it along a half-cosine curve to a **minimum learning rate**. These are schedule components; cosine decay need not include warm restarts just because the SGDR paper studied them.

Define completed-update coordinate $s$, warmup boundary $w$, end boundary $S$, peak $\eta_{\max}$ and minimum $\eta_{\min}$:

$$
\eta(s)=
\begin{cases}
\eta_{\max}\,s/w,&0\le s<w,\\
\eta_{\min}+\dfrac{\eta_{\max}-\eta_{\min}}{2}\left[1+\cos\left(\pi\dfrac{s-w}{S-w}\right)\right],&w\le s\le S.
\end{cases}
$$

Read this as: during the first $w$ completed updates, scale the peak rate by the fraction of warmup completed; after that, interpolate from peak to minimum using a half-cosine across the remaining $S-w$ updates. Require $0<w<S$, and a nonnegative minimum no greater than the peak. Clamp outside the defined interval or stop at the end, rather than accidentally cycling upward again.

With illustrative $w=100$, $S=1,000$, $\eta_{\max}=0.001$ and $\eta_{\min}=0.0001$, the values are:

| Completed updates $s$ | Stage | $\eta(s)$ |
|---|---|---|
| 0 | Start | 0 |
| 50 | Halfway through warmup | 0.0005 |
| 100 | Peak | 0.001 |
| 550 | Halfway through decay | 0.00055 |
| 1,000 | End | 0.0001 |

@fig train_schedule | A computed illustrative warmup and cosine schedule. Orange marks the rate, and the two vertical boundaries identify the warmup endpoint and the end of decay.

### Which step does the scheduler count?

A microbatch is not an optimizer update when accumulation is active. Finch-24's illustrative accumulation processes four microbatches per update, so 1,000 updates consume 4,000 microbatches and 64,000 supervised tokens with the fixed example sizes. Advancing the schedule after every microbatch would run it four times faster in update units. Variable-size batches make a token-based schedule an alternative; state which counter the policy uses.

The displayed table is a mathematical curve indexed by completed updates. A concrete loop must choose whether the next update uses $\eta(s)$ or $\eta(s+1)$. In Part VI we set the first executed update's rate with $\eta(1)$, then increment the completed-update counter only when an optimizer update actually occurs. This avoids a first update at exactly zero while preserving a declared boundary convention. A stateful PyTorch scheduler needs its own documented call order; do not stack it with a manually set rate unless that is intentional.

Linear decay, constant-rate plateaus and schedules with later cooldown are alternatives. A comparison that stops a model before its planned decay endpoint is a comparison of partially completed optimization plans. [The SGDR paper](https://arxiv.org/abs/1608.03983) provides the historical cosine schedule; the appropriate schedule for a new corpus remains an experimental choice.

:::story Picture this
A driver chooses a route, an accelerator setting and a speed limit. The optimizer determines how the gradient becomes a move, the schedule changes the accelerator setting over time, and clipping caps one part of the immediate input to that move. Weight decay is a separate pressure on the vehicle's position in parameter space, so the driving analogy does not fully describe it.
:::

:::warn Watch out
An FP16 scaler can skip an optimizer update after overflow. If a schedule intended to count successful updates still advances, the schedule and optimizer histories diverge. Record attempted batches and executed updates separately, and restore that same convention when resuming.
:::

:::interview Interview lens
**"Is Adam with L2 regularization the same as AdamW, and does clipping bound the update?"** No: L2 adds a gradient term that Adam normalizes and stores in its moments, while AdamW shrinks the parameter separately. Global clipping caps the raw combined gradient norm, but Adam's coordinate scaling means its actual update need not have the same direction or norm. I would inspect the learning rate, decay group, moment state, clipping point and successful-update counter to compare the two training procedures.
:::

:::key In one breath
SGD subtracts $\eta g$; Adam keeps bias-corrected first and second raw moments and scales coordinates by their squared-gradient history. AdamW applies decay separately, so it differs from an L2 penalty passed through Adam. Clip the combined unscaled gradient once, using a global norm, and treat nonfinite gradients as a failed step. Warmup and cosine schedules need explicit update or token units, boundary conventions and resume state.
:::

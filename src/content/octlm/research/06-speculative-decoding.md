@part VI | Drafting more than one token | This part changes the decoding schedule while keeping a declared target distribution. Guessing several future tokens is useful only when checking them costs less than separate target passes. We will trace draft and verification steps, derive rejection correction, and compute when speculation speeds up or slows down decoding. | where:6

## 19. Speculative decoding

The large model takes a costly pass to produce one token. A cheaper model could propose several tokens in that time, but a fast guess is no substitute for the target, so the target has to check it.

### Draft model, target model, and candidate tokens

**Speculative decoding** uses a cheap **draft model** to propose tokens and a **target model** to verify them. From the accepted prefix, the draft samples candidates autoregressively. The target then runs the candidate sequence through one causally masked forward pass, getting its next-token distribution at every candidate position.

Each candidate is still conditioned on the ones before it. Verification runs in parallel only because all proposed inputs are already known. If every candidate passes, the same pass also gives the distribution for a bonus token.

@fig speculative_verification_ledger | An illustrative four-token draft agrees with the target's greedy choices for two tokens. At the first mismatch, the later draft suffix is discarded and the target token replaces the mismatch.

### Verification and accept/reject behavior

For greedy decoding, compare each draft token with the target's argmax under that prefix and keep the longest matching run. At the first mismatch, emit the target's argmax, drop the remaining candidates, and draft again. With exact target computation and the same tie-breaking, this reproduces the greedy target output.

For sampling, keeping tokens that happen to match is not exact. Let $q(x)$ be the draft probability of candidate $x$ and $p(x)$ the target probability at the same prefix. Accept with probability

$$
a(x)=\min\left(1,\frac{p(x)}{q(x)}\right).
$$

Read this as always accept proposals the draft underweights, and thin out those it overweights. On rejection, draw a replacement from the normalized positive difference `max(0,p-q)`, drop later candidates, and continue. Use the distributions after the declared temperature and filters.

### Accepting several tokens per target pass

A complete two-outcome example: the draft gives `q=[0.6,0.4]` to A and B, the target `p=[0.3,0.7]`. Acceptance is `[min(1,0.3/0.6),min(1,0.7/0.4)]=[0.5,1]`, so accepted mass is `[0.6 × 0.5,0.4 × 1]=[0.3,0.4]`, total 0.7, with 0.3 rejected.

The positive difference `[max(0,0.3-0.6),max(0,0.7-0.4)]=[0,0.3]` normalizes to `[0,1]`, so every rejection becomes B. Final mass is `[0.3,0.4+0.3]=[0.3,0.7]`, exactly the target.

@fig speculative_probability_mass | Computed probability mass shows where rejected A proposals go. Accepted draft mass plus corrected replacement mass equals the target distribution.

In general, accepted mass at $x$ is `min(p(x),q(x))` and the correction adds `max(0,p(x)-q(x))`; together they give `p(x)`. Applied at each prefix, this preserves the target sampling distribution, though not identical sample paths unless the random draws are coupled.

Leviathan, Kalman, and Matias described exact speculative decoding in 2022, published 2023. [Speculative decoding paper](https://arxiv.org/abs/2211.17192). The guarantee covers the declared target distribution, not a different sampler or approximate verification.

:::warn Watch out
After a rejection, drop the unaccepted suffix's cache states in both draft and target, or the next prediction depends on tokens no longer in the sequence. Enforce EOS and length limits even when a whole draft is accepted.
:::

## 20. Speculative decoding performance

A speculative implementation accepts many tokens and still runs slower than plain decoding. The verifier was efficient; the draft's cost and synchronization ate the saving.

### Acceptance rate and draft-model speed

The **acceptance rate** is how often draft candidates survive verification. A smaller draft is cheaper but agrees less; a larger one agrees more but costs more. Measure agreement and cost together.

In a simplified model with draft length $K$ and a constant, independent acceptance probability $\alpha$ per position, the expected tokens per round, counting the replacement or bonus token, is

$$
E[N]=\sum_{i=0}^{K}\alpha^i.
$$

Read this as a round always emits one token, a second if the first candidate survives, and so on up to all $K$ plus a bonus. Real acceptance varies with position and prefix; this is a simplification.

At `K=4` and `alpha=0.8`, `E[N]=1+0.8+0.64+0.512+0.4096=3.3616` tokens, an average over rounds rather than a count any round emits.

### Verification cost and when speculation helps

With draft time $t_D$ per token, verification time $t_V(K)$, and ordinary target time $t_T$ per token, ignoring other overhead:

$$
S=\frac{t_T E[N]}{K t_D+t_V(K)}.
$$

Read this as ordinary time for the expected output divided by one speculative round's time. Speculation helps when $S>1$. Verification costs less than $K$ target passes but grows with $K$.

@fig speculation_speed_tradeoff | Computed speed ratios assume a 1 ms draft step, a 12 ms four-candidate verification pass, and a 10 ms ordinary target step. These are arithmetic fixtures, not hardware measurements.

The illustrative round takes `4 × 1 + 12 = 16 ms`. At acceptance 0.8, the expected output would take `10 × 3.3616=33.616 ms` normally, so `S=33.616/16=2.101`. At 0.2, `E[N]=1+0.2+0.04+0.008+0.0016=1.2496` and `S=12.496/16=0.781`: slower.

Speculation has the most room when target decoding is bound by weight movement and verification reuses those weights across positions. At high batch or with a compute-heavy verifier the balance shifts, and draft memory, transfers, sampling, and synchronization all count. Measure end to end to pick the draft length.

:::story Picture this
An assistant drafts several lines of a form before a supervisor checks them together. If most lines are right, the form finishes sooner. If an early line is wrong or the assistant is slow, the draft is wasted. The check is what keeps the supervisor's standard.
:::

:::note MTP as a proposal source
The future-token heads in Part I can replace a separate draft model, as long as their proposals fit the verification algorithm. Training the heads alone proves neither exact sampling nor a speedup.
:::

:::interview Interview lens
**"How can speculative decoding be exact and still faster?"** The draft proposes cheaply, and one causal target pass verifies several known inputs together. Acceptance thinning and corrected rejection sampling preserve the target distribution. The speedup comes from amortizing one expensive pass across several tokens, and it disappears when acceptance is low or drafting costs too much.
:::

:::key In one breath
With exact verification and correction, speculative decoding changes how tokens are produced, not the target distribution. Greedy verification keeps the matching prefix; sampling accepts with $\min(1,p/q)$ and corrects from the positive difference. In the constant-rate model a round yields $\sum_{i=0}^K\alpha^i$ tokens on average. Weigh that against draft, verification, memory, and synchronization costs.
:::

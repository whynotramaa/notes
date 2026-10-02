@part VII | Scaled Dot-Product Attention | Part VI did attention one token at a time. Real models do it for every token at once with a single line of maths, and that line runs inside every attention head of every GPT, Llama and Claude model. This part walks through the line stage by stage with real numbers, explains the division by the square root of the head size that everyone gets asked about, and shows how softmax is computed safely without numbers overflowing. | where:7

## 38. One Line Runs Every Head

The attention formula:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}} + M\right) V$$

It reads in plain words like this. Compare every query with every key, all at once ($QK^\top$). Shrink the scores by the square root of the key length ($\div \sqrt{d_k}$). Hide anything that should not be seen ($+\,M$, the mask, which is Part VIII's subject). Turn each row of scores into weights that are positive and add up to one (softmax). Use the weights to blend the values ($\cdot\, V$). Every symbol has appeared before except $d_k$, the length of each query and key vector, which is 64 per head in Finch-19, and $M$, the mask.

The name, **scaled dot-product attention**, is just a description of the formula: scores are dot products, and they are scaled. It comes from the 2017 *Attention Is All You Need* paper. The authors chose it over an older alternative, "additive attention", which ran each query-key pair through a small neural network, because the dot-product version can be computed as a few large matrix multiplications. Graphics processors (GPUs) are extremely good at large matrix multiplications, so the whole computation runs fast.

## 39. Six Stages, With Real Numbers

Run the formula on the first four tokens of our sentence, *The cat sat because*, with toy vectors four numbers long. Then $d_k = 4$ and $\sqrt{d_k} = 2$.

**Stage 1: scores.** Multiplying $Q$ ($4 \times 4$) by $K^\top$ ($4 \times 4$) gives the score grid $S$ ($4 \times 4$), where row $i$, column $j$ is $q_i \cdot k_j$. For example, the query of *sat* is $[0.2, 1.0, 0.6, 0.1]$ and the key of *sat* is $[0.1, 0.9, 0.8, 0.2]$, so $S_{2,2} = 0.02 + 0.90 + 0.48 + 0.02 = 1.42$.

**Stage 2: scale.** Divide every score by $\sqrt{d_k} = 2$. $S_{2,2}$ becomes 0.71.

**Stage 3: mask.** Add $-\infty$ (minus infinity) to every cell where a token would be looking at a later token, that is, above the diagonal. Part VIII explains why; for now, notice that row 0 (*The*) keeps only column 0, row 1 keeps columns 0 and 1, and so on.

**Stage 4: softmax, row by row.** For each row, raise $e$ to each entry, then divide by the row's total. Since $e^{-\infty} = 0$, the masked cells become exactly zero. Take row 2 (*sat*), whose scaled scores for the three visible keys are 0.185, 0.415 and 0.71. Exponentiating gives 1.203, 1.514 and 2.034, which sum to 4.752, so the weights are 0.253, 0.319 and 0.428.

**Stage 5: blend.** Multiply the weight grid $W$ ($4 \times 4$) by $V$ ($4 \times d_v$). With toy two-number values, row 2 of the output is $0.253 \times [1.0, 0.0] + 0.319 \times [0.0, 1.0] + 0.428 \times [0.5, 0.5] = [0.467, 0.533]$.

@fig sdpa_steps | The whole computation on four tokens. Scores, scaling, masking, row-wise softmax, and the multiplication by V. Masked cells become exactly zero after softmax.

That is five stages; the sixth is simply "do this for every head in every layer". For Finch-19 that is 8 heads in each of 8 layers, 64 runs of the same formula per forward pass, each on its own $Q$, $K$ and $V$.

### Every row is Part VI again

Look at any single row of the weight grid. Row 2 holds the weights of *sat* asking its question: one query, its scores against the visible keys, a softmax, a set of weights that add up to one. That is exactly the one-token story of Part VI. The matrix form does nothing new. It just does all the rows at once, which is what GPUs are fast at.

@fig row_bars | One row of the weight grid is one token's attention, the same picture as Part VI. Every row sums to one.

## 40. Why Divide by √d_k

Why divide by $\sqrt{d_k}$? This is one of the most common interview questions about Transformers, and the answer is a two-line argument about spread.

Suppose the entries of $q$ and $k$ are independent random numbers with an average of 0 and a **variance** of 1. (Variance measures spread: the average squared distance from the mean. Its square root is the **standard deviation**, the "typical size" of a deviation.) A freshly initialized network produces numbers roughly like that. Their dot product is a sum of $d_k$ terms $q_i k_i$. Each term has average 0 and variance 1. When you add independent random quantities, their variances add, so the sum has variance $d_k$ and standard deviation $\sqrt{d_k}$.

So the typical size of a score grows with the head size. For $d_k = 4$ the scores have a standard deviation of about 2. For $d_k = 64$, Finch's head size, about 8. For $d_k = 512$, about 22.6. Dividing by $\sqrt{d_k}$ brings the standard deviation back to 1, regardless of the head size. A quick simulation with three thousand random vector pairs at each width confirms it: measured spreads of 1.99, 8.01 and 32.1 for $d_k$ of 4, 64 and 1,024, against predictions of 2, 8 and 32.

$$\operatorname{Var}(q \cdot k) = \sum_{i=1}^{d_k} \operatorname{Var}(q_i k_i) = d_k \quad\Longrightarrow\quad \operatorname{Var}\!\left(\frac{q \cdot k}{\sqrt{d_k}}\right) = 1$$

@fig dk_spread | The spread of raw dot products grows with the head size (left). Dividing by the square root of the head size gives the same spread for every head size (right).

### Large scores freeze softmax

Why do we care about the spread of scores? Because softmax is sensitive to the *scale* of its inputs. Softmax of $[1, 2, 3]$ is $[0.09, 0.24, 0.67]$: a clear preference, with real weight on all three. Multiply the same scores by ten, $[10, 20, 30]$, and the softmax becomes $[0.000000002, 0.00005, 0.99995]$. The model's preference has become a hard choice.

@fig softmax_saturate | Softmax of [1, 2, 3] multiplied by growing factors. At c = 10 one token takes everything, and the gradient through the winning weight falls from 0.223 to 0.00005.

A hard choice is bad for learning. Training improves the model by asking "if I nudged this score a little, how much would the result change?". That rate of change is called the **gradient**, and Part XIII builds it properly. For the winning weight $p$ of a softmax, the gradient with respect to its own score is $p(1 - p)$. At $p = 0.665$ that is 0.223. At $p = 0.99995$ it is 0.00005, four thousand times smaller. When softmax saturates, the signal that would teach it which other tokens matter almost vanishes, and learning in that head stalls. Dividing by $\sqrt{d_k}$ stops scores from drifting into this frozen zone just because the vectors are wide.

:::interview Interview lens
**"Why divide by $\sqrt{d_k}$ and not by $d_k$?"** Because the goal is to normalize the *standard deviation* of the scores, not their variance. With zero-mean, unit-variance components, $q \cdot k$ has variance $d_k$, so its standard deviation is $\sqrt{d_k}$; dividing by that gives unit variance at any head size and keeps softmax out of saturation, where gradients vanish. Dividing by $d_k$ would shrink scores toward zero as heads get wider and make attention nearly uniform.
:::

## 41. Softmax, Carefully

Softmax turns any list of scores into weights that are positive and sum to one:

$$\text{softmax}(s)_i = \frac{e^{s_i}}{\sum_j e^{s_j}}$$

Read it: raise $e$ to each score, then divide each result by the total of all of them. Raising to a power makes everything positive, and dividing by the total makes the results add up to one. Larger scores get disproportionately larger weights, because $e^s$ grows fast: a score 1 higher gets 2.718 times the weight.

It is simple, but the obvious way to code it breaks. Computers store numbers in fixed-size formats, and the largest number a 32-bit float can hold is about $3.4 \times 10^{38}$, which is $e^{88.7}$. A 16-bit float overflows at 65,504, which is $e^{11.1}$. So $e^{1000}$ becomes "infinity". If all scores are large, the top and bottom of the fraction are both infinity, and infinity divided by infinity is **NaN**, "not a number", which then spreads through every calculation it touches and ruins the model.

The fix is to subtract the largest score from all of them first:

$$\text{softmax}(s)_i = \frac{e^{s_i - \max(s)}}{\sum_j e^{s_j - \max(s)}}$$

This gives exactly the same answer, because subtracting a constant from every score multiplies every $e^{s_j}$ by the same factor $e^{-\max(s)}$, which cancels between top and bottom. But now the largest exponent is $e^0 = 1$ and every other one is smaller, so nothing can overflow. Scores $[1000, 1001, 1002]$ become $[-2, -1, 0]$, exponentials $[0.135, 0.368, 1.000]$, total 1.503, weights $[0.090, 0.245, 0.665]$: the same weights as $[1, 2, 3]$, which makes sense, since softmax only cares about differences between scores.

@fig softmax_stable | The overflow trap. Naively exponentiating large scores overflows to infinity and then to NaN. Subtracting the maximum first gives the same weights with every intermediate number small.

Every serious implementation, including PyTorch's `torch.softmax`, does this subtraction for you. You need to know it because you will write it yourself in kernels, in loss functions, and in interviews, and because Day 2's FlashAttention is built on a clever extension of it.

## 42. What the Scores and the Output Mean

### A dot product is alignment times size

What does a dot product actually measure? Geometrically, $q \cdot k = \lVert q \rVert \, \lVert k \rVert \cos\theta$: the length of $q$, times the length of $k$, times the cosine of the angle between them. Another way to see it: drop a perpendicular from the tip of $k$ onto the line of $q$; the length of that shadow, times the length of $q$, is the score. Point $k$ the same way as $q$ and the score is big. At right angles it is zero. Pointing apart, it goes negative. Making $k$ longer raises the score too.

@fig dot_projection | A dot product is the length of q times the shadow of k on q. Aligned vectors score high, perpendicular ones score zero, opposed ones score negative.

So an attention score is "how much do they point the same way" times "how big are they". It is the cosine similarity of Section 12 with the lengths left in. The lengths matter: a key with a large norm gets attention from many queries, which is one way models create "attention sink" tokens (Part IX).

### The output never leaves the values

Because softmax weights are all positive and sum to one, the output of attention is a **convex combination** of the value vectors: a weighted average. Geometrically, the output always lies inside the shape whose corners are the values. With three values, it lies inside their triangle, whatever the scores are.

@fig convex_blend | Three value vectors form a triangle. Whatever the weights, the output (orange dots) lands inside it, because the weights are positive and sum to one.

That means attention can only *mix* existing information. It cannot invent a vector outside what the values already offer. Creating genuinely new features, transforming what was gathered, is the job of the MLP in each block (Part XII). Attention moves information between tokens; the MLP processes it.

### Sharp edges of the attention formula

**A fully masked row produces NaN.** If masking hides every key from some query, its whole row of scores is $-\infty$, and softmax computes zero divided by zero. The result is NaN, and it spreads everywhere. Make sure every query can see at least one key, usually itself.

**$-10^9$ is not safe in half precision.** Code often uses $-10^9$ as a stand-in for minus infinity. A 16-bit float cannot represent a number that big; it becomes real $-\infty$ and can trigger the NaN above. Use the data type's own minimum value instead of a magic number.

**Near-uniform weights at the start are normal.** At initialization the scores are small and similar, so softmax gives every visible token roughly the same weight. Training breaks the ties.

**Attention dropout must be off at evaluation.** Some models randomly zero out attention weights during training as a regularizer. Forget to switch that off when evaluating (in PyTorch, `model.eval()`) and results become random and worse.

**Not every model uses $1/\sqrt{d_k}$.** Some use a different scale or learn one. A trained model expects the scale it was trained with, so never change it on a pretrained model.

:::warn Watch out
When writing attention by hand, the softmax goes along the *key* dimension, the last axis of the $T \times T$ score grid, so that each *row* (each query) sums to one. Softmax over the wrong axis makes each column sum to one instead: every key distributes a fixed budget of attention among the queries, which is meaningless. The shapes still match, so nothing crashes. Check that `weights.sum(-1)` is all ones.
:::

:::key In one breath
Every head computes $\text{softmax}(QK^\top / \sqrt{d_k} + M)\,V$: all pairwise query-key dot products, scaled, masked, softmaxed along each row, then used to average the values; each row is one token's attention. The scale exists because a dot product of $d_k$ unit-variance terms has standard deviation $\sqrt{d_k}$ (8 for Finch's 64-wide heads), and unscaled large scores saturate softmax, shrinking gradients like $p(1-p)$ toward zero. Softmax is computed as $e^{s - \max s} / \sum e^{s - \max s}$ to avoid overflow, and because weights are positive and sum to one, the output is always a blend inside the values.
:::

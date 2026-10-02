@part XII | The Decoder Block and the Whole Model | Attention lets tokens share information, but a model also needs a step where each token works on what it collected, and a way to stack dozens of layers without the numbers blowing up. This part assembles the decoder block from attention, an MLP, normalization and residual connections, then puts eight blocks between the embeddings and an output head to make the whole of Finch-19, follows it to an actual next-token probability, and counts every one of its parameters. | where:12

## 63. Attention Alone Is Not a Model

We now have every piece of attention. But attention alone is not a model, for a reason Section 42 made precise: its output is always a weighted average of value vectors. It moves information between tokens, but it cannot transform that information into something new. After *it* has pulled in information about *cat*, something still has to work out what that implies: that *it* is an animal, that *tired* probably describes the cat, that *purred* might come next.

That job belongs to the **MLP**, short for multi-layer perceptron, a small neural network applied to each token on its own. (You will also see it called the feed-forward network, or FFN.) A **decoder block** wraps the two together: attention, where tokens share information with each other, then the MLP, where each token processes what it gathered. Two helpers hold the block together: **normalization**, which keeps the numbers at a steady size, and **residual connections**, which let each part add to the token's vector rather than replace it.

Stack the same block many times and you have a language model. GPT-2 small stacks 12. Llama 3 8B stacks 32. Finch-19 stacks 8. Each block has its own weights; only the design repeats.

## 64. One Trip Through a Block

Follow one token's vector through a Finch-19 block. It enters as $x$, a 512-number vector (or, for the whole sentence, a $T \times 512$ grid). It travels straight up a main line, the **residual stream**, and takes two side trips.

On the first side trip, a copy of $x$ is normalized and fed to multi-head attention. Attention's output is *added* back onto the main line. Call the result $h$. On the second side trip, a copy of $h$ is normalized and fed to the MLP, and the MLP's output is added back onto the main line. That is the block's output.

$$h = x + \text{Attn}\big(\text{LN}(x)\big) \qquad \text{out} = h + \text{MLP}\big(\text{LN}(h)\big)$$

Read the formula left to right: the new vector is the old vector plus a correction computed from a normalized copy of it. The formula preserves the input shape, $T \times 512$, so blocks can be stacked as many times as you like. And nothing is ever overwritten: each part only adds.

@fig block_trip | One pre-norm decoder block. The residual stream runs straight up; attention and the MLP sit on side trips that read a normalized copy and add their result back at the plus signs.

```python
class Block(nn.Module):
    def __init__(self):
        super().__init__()
        self.ln1, self.attn = nn.LayerNorm(512), MultiHeadAttention(512, 8)
        self.ln2, self.mlp = nn.LayerNorm(512), MLP(512, 2048)

    def forward(self, x):                 # x: (B, T, 512)
        x = x + self.attn(self.ln1(x))    # tokens share information
        x = x + self.mlp(self.ln2(x))     # each token processes it
        return x                          # (B, T, 512)
```

## 65. The Residual Stream

The residual connection, $x + f(x)$, looks like a small detail. It is one of the most important ideas in deep learning, and it came from image recognition: Kaiming He and colleagues introduced residual networks, ResNets, in 2015 and used them to train networks over a hundred layers deep for the first time.

The best way to think of the residual stream is as a **shared notebook** that runs through the whole model. The embedding writes the first page. Each sub-layer, every attention and every MLP, reads the current notebook, works something out, and writes a short note at the bottom. Nothing gets erased. By the top of the model, the notebook contains the original token plus every layer's contributions.

@fig residual_notebook | The residual stream as a shared notebook. Each row is the same token's vector after another sub-layer; outlined cells are the ones that sub-layer changed. Most changes are small additions. (Illustrative.)

Why does this help so much? Two reasons. First, learning becomes easier: a layer that has nothing useful to add can output nearly zero and the stream passes through unchanged, so adding layers never has to make things worse. Second, and more important, it gives training a direct path. Part XIII explains that training sends a correction signal backwards through the model. Every time it passes through a plus sign, part of the signal goes straight down the main line, untouched by the sub-layer. So even the first layer of a deep model receives a clear signal. Without residuals, that signal is multiplied through every layer on the way down and tends to shrink to nothing or blow up.

:::story Picture this
A team edits a shared document. In a no-residual setup, each editor receives the previous editor's version, rewrites it from scratch, and passes it on. After thirty editors, the original is unrecognizable and nobody knows whose change caused a problem. In the residual setup, everyone works on the same document using tracked changes: each editor only adds suggestions, the original text is always there underneath, and you can trace any line back to the edit that introduced it.
:::

## 66. Where the Norm Goes

### Pre-norm versus post-norm

The original 2017 Transformer put normalization on the main line, *after* each addition: $x \leftarrow \text{LN}(x + f(x))$. That is **post-norm**. Every layer's output gets squashed before moving on, so the main line is interrupted at every step, and deep post-norm stacks were hard to train without a carefully tuned warm-up of the learning rate.

GPT-2 moved the normalization onto the side trips, *before* attention and before the MLP: $x \leftarrow x + f(\text{LN}(x))$. That is **pre-norm**, and almost every model since uses it. The main line stays a clean path from bottom to top with nothing in the way, which is exactly what the residual argument above wants. Deep pre-norm models train much more reliably.

@fig pre_post | Post-norm places LayerNorm on the residual stream after each addition; pre-norm places it on the side trips, leaving the stream an uninterrupted highway.

One consequence of pre-norm: the main line itself is never normalized inside the blocks, and it tends to grow as layers keep adding to it. So pre-norm models need one final normalization after the last block, before the output head. Forgetting it is a classic bug.

### What LayerNorm does

Normalization keeps the numbers in each token's vector at a steady size, so they neither blow up nor shrink away as they pass through dozens of layers. **LayerNorm**, introduced by Jimmy Lei Ba and colleagues in 2016, does two things to each token's vector separately. It subtracts the vector's average, so the numbers centre on zero. Then it divides by their standard deviation, so their spread is one. Finally it multiplies each entry by a learned gain $\gamma$ and adds a learned shift $\beta$, one of each per channel, so the model can undo the normalization wherever that helps.

$$\text{LN}(x) = \gamma \odot \frac{x - \mu}{\sqrt{\sigma^2 + \varepsilon}} + \beta$$

Here $\mu$ is the average of the vector's entries, $\sigma^2$ their variance, $\varepsilon$ a tiny number (such as $10^{-5}$) that prevents division by zero, and $\odot$ means multiply entry by entry. Let us do one: $x = [2, -1, 4, 3]$. The mean is 2. Subtracting it gives $[0, -3, 2, 1]$. The variance is $(0 + 9 + 4 + 1)/4 = 3.5$ and its square root is 1.871. Dividing gives $[0, -1.604, 1.069, 0.535]$, which has mean 0 and spread 1.

@fig layernorm_steps | LayerNorm by hand. Subtract the mean, divide by the standard deviation, then apply the learned gain and shift.

Finch-19 has two LayerNorms per block plus the final one, each with 512 gains and 512 shifts. Day 2 replaces LayerNorm with RMSNorm, which skips the mean subtraction.

## 67. The MLP: Widen, Bend, Narrow

The MLP is three steps applied to each token separately. Widen the vector with a matrix, usually to four times its size: for Finch-19, 512 numbers become 2,048. Pass every one of those numbers through a bendy function called an **activation**. Shrink back to 512 with a second matrix.

$$\text{MLP}(x) = W_2\, \text{GELU}(W_1 x + b_1) + b_2$$

Why the bend? Without it, the two matrices would multiply together into one plain matrix, and a stack of plain matrices can only represent straight-line relationships, no matter how many you stack. The activation is what lets the network represent curved, complicated ones. GPT-2 and Finch-19 use **GELU**, the Gaussian error linear unit, which behaves like "keep positive inputs, suppress negative ones" but smoothly: $\text{GELU}(1) = 0.841$, $\text{GELU}(0) = 0$, $\text{GELU}(-1) = -0.159$, and very negative inputs give almost exactly 0. An older, simpler choice is **ReLU**, which outputs zero for negatives and the input itself for positives, with a sharp corner at zero.

@fig mlp_gelu | The MLP widens each token's vector four times, bends every number with GELU, and narrows it back. Right: GELU next to ReLU; GELU is smooth and dips slightly below zero.

Count it for Finch-19: $W_1$ is $512 \times 2{,}048 = 1{,}048{,}576$ weights, $W_2$ the same, plus biases of 2,048 and 512. That is 2,099,712 parameters per block, twice the attention's 1,050,624. Researchers who study trained models find that MLPs store a great deal of the model's factual knowledge; in a sense, attention finds the relevant context and the MLP looks up what follows from it.

### Two halves, two axes

The clearest way to see what each half of the block does is to picture the input as a grid with one column per token and one row per feature. Attention moves information *across columns*: the value from *cat*'s column flows into *it*'s column. The MLP works *within each column*: it transforms *it*'s features using only *it*'s own features, with no idea what the other tokens contain. A block alternates the two. Share, then think. Share, then think.

@fig mix_axes | Attention mixes across tokens, the MLP mixes within each token. Every block does one of each.

:::interview Interview lens
**"Why does a Transformer need both attention and an MLP?"** Attention is the only place tokens exchange information, but its output is a convex combination of value vectors, a weighted average, so it cannot create new features by itself. The MLP applies a learned nonlinear transformation to each position independently and holds most of the parameters (about two thirds of a GPT-2-style block). Residual connections let both write into a shared stream, so layers alternate between routing information and processing it.
:::

## 68. The Whole Model, to the Next Token

Stack eight blocks and add the two ends and you have Finch-19. At the bottom: the tokenizer, the embedding lookup and the position table (Parts I to III). In the middle: eight decoder blocks. At the top: a final LayerNorm, then the **LM head**, which turns each position's final 512-number vector into 32,000 scores, one per token in the vocabulary.

Those raw scores are called **logits**. A logit can be any number; a higher logit means "more likely next". The LM head is a $512 \times 32{,}000$ matrix, and in Finch-19 it is tied to the embedding table (Section 14), so the logit for token $j$ is the dot product of the final vector with row $j$ of $E$: how well the model's final thought matches each token's embedding. Softmax turns the 32,000 logits into the probabilities from Part I.

During training, every position's logits are used, one prediction per position (Part VIII). During generation, only the last position's logits matter, because that is the prediction for the token after the text.

### Temperature

Before softmax, the logits are usually divided by a number called the **temperature**, $\tau$:

$$p_j = \frac{e^{z_j / \tau}}{\sum_k e^{z_k / \tau}}$$

Take logits $[2.0, 1.0, 0.1, -1.0]$ for *tea*, *coffee*, *water* and *rocks*. At $\tau = 1$ the probabilities are $[0.638, 0.235, 0.095, 0.032]$. At $\tau = 0.5$ the logits are doubled before softmax and the distribution sharpens to $[0.862, 0.117, 0.019, 0.002]$: the top choice dominates and output becomes safe and repetitive. At $\tau = 2$ the logits are halved and the distribution flattens to $[0.451, 0.274, 0.174, 0.101]$: output becomes more varied and more random. Temperature is the setting in chatbot settings panels, and this is exactly what it does. At $\tau \to 0$ it always picks the top token, which is called greedy decoding.

@fig temperature | The same logits at three temperatures. Low temperature sharpens the distribution toward the top token; high temperature flattens it.

### Counting every parameter

Every learned number in Finch-19, as promised in the front matter:

| Component | Count | Share |
|---|---|---|
| Token embeddings $32{,}000 \times 512$ (tied with the LM head) | 16,384,000 | 38.9% |
| Position table $1{,}024 \times 512$ | 524,288 | 1.2% |
| Attention, 8 layers × ($4 \times 512^2 + 4 \times 512$) | 8,404,992 | 20.0% |
| MLP, 8 layers × ($2 \times 512 \times 2{,}048 + 2{,}048 + 512$) | 16,797,696 | 39.9% |
| LayerNorm, 8 × 2 × 1,024 + final 1,024 | 17,408 | 0.04% |
| **Total** | **42,128,384** | 100% |

@fig param_bars | Where Finch-19's parameters live. The embedding table and the MLPs dominate; attention is a fifth; the norms are a rounding error.

Per block, attention is $4d^2$ and the MLP is $8d^2$ (ignoring biases), so the MLP is two thirds of each block. In a small model like Finch the embedding table is a large slice too. Make $d$ and the number of layers larger and the blocks swamp everything else: the same formula, $12 d^2 N$ for the blocks, gives about 85 million for GPT-2 small ($d = 768$, $N = 12$), which together with its 38.6 million embedding and 0.8 million position parameters makes its well-known 124 million.

### Sharp edges of the block

**Forgetting the final norm.** With pre-norm, the stream is never normalized inside the blocks, so the final LayerNorm before the LM head is required. Leave it out and the logits come out at a wild scale.

**The stream grows with depth.** Every layer adds to the stream, so without care the vectors grow with depth. GPT-2 scales the initial weights of the layers that write into the stream by $1/\sqrt{N_{\text{res}}}$, where $N_{\text{res}}$ is the number of residual additions (two per block), so the sum of all contributions starts at a sensible size.

**Never assume the MLP is $4d$.** Finch-19 and GPT-2 use $4d$, but Day 2's SwiGLU uses three matrices and a hidden width near $\tfrac{8}{3}d$, rounded. Read the hidden size from the config.

**Norm epsilon and precision.** Normalization divides by a standard deviation. Compute it in 32-bit precision and keep $\varepsilon$ at what the model was trained with, typically $10^{-5}$ or $10^{-6}$; too small an epsilon in 16-bit arithmetic causes blow-ups.

**Dropout placement.** Dropout randomly zeroes parts of the network during training to reduce overfitting. GPT-2 used it after attention and after the MLP. Most large models trained on huge datasets use none at all in pretraining.

:::warn Watch out
"The MLP is applied to each token independently" does not mean tokens are processed in separate passes. All $T$ tokens go through the MLP in one matrix multiplication of a $T \times 512$ grid by a $512 \times 2{,}048$ matrix. Independence means no token's MLP output depends on another token's values, which is why the MLP needs no mask and why its cost per token does not grow with context length.
:::

:::key In one breath
A pre-norm decoder block computes $h = x + \text{Attn}(\text{LN}(x))$ then $\text{out} = h + \text{MLP}(\text{LN}(h))$: attention mixes information across tokens, the MLP ($512 \to 2{,}048 \to 512$ with GELU in Finch-19) transforms each token independently, and residual additions keep a clean stream that carries gradients straight down. LayerNorm centres and rescales each vector with learned $\gamma$ and $\beta$; pre-norm keeps the stream uninterrupted and needs a final norm before the tied LM head, whose logits become probabilities through a temperature-scaled softmax. Per block, attention is $4d^2$ and the MLP $8d^2$; Finch-19's total is 42,128,384 parameters, 38.9% of them in the embedding table.
:::

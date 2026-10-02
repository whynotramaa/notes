@part VIII | The Causal Mask: No Peeking | A language model learns by predicting the next token, and to train fast we feed it whole sentences at once. That creates a loophole: every token could simply look ahead and read the answer. This part closes the loophole with a triangle of minus infinities, shows why one forward pass then gives one lesson per position, and covers the other masks real batches need. | where:8

## 43. Why Hide the Future

Part I said a language model plays one game: given the tokens so far, guess the next one. During training we know the whole sentence in advance, and it would be painfully slow to feed it in one token at a time. So we feed all seven tokens of *The cat sat because it was tired* at once and ask every position to predict the token after it: position 1 (*␠cat*) should predict *␠sat*, position 4 (*␠it*) should predict *␠was*, and so on.

That creates a problem. In Part VII every query could score against every key. If *␠cat* can attend to *␠sat*, it can simply copy *␠sat*'s value and "predict" the word it is looking at. The answer is sitting right there in the input. Training loss would drop to nearly zero, and the model would have learned nothing useful, because when it later generates text for real, the next word does not exist yet. There is nothing to peek at.

@fig cheat | The cheating problem. Without a mask, the token whose job is to predict *␠sat* can attend directly to *␠sat*. It aces training and fails completely at generation.

The fix is the **causal mask**. It hides the future: each token may attend only to itself and the tokens before it. "Causal" refers to the direction of cause and effect. The past can influence the present, the future cannot. A model trained this way is called a **causal language model**, which is what GPT, Llama, Claude, Mistral and Finch-19 all are.

## 44. One Pass, Seven Lessons

Training on the whole sentence at once gives many predictions per pass. Take a chunk of $T + 1$ consecutive tokens from the training data. The input is the first $T$ tokens. The **targets**, the correct answers, are the same chunk shifted one position to the left: the last $T$ tokens. Line them up column by column. At position 0 the model sees *The* and should predict *␠cat*. At position 1 it sees *The cat* and should predict *␠sat*. At position 6 it sees the whole input and should predict the full stop.

@fig shift_targets | Shifted targets. One chunk of text yields one prediction per position. The target row is the input row moved one step left, so position 3 sees four tokens and must predict *␠it*.

In code this is almost embarrassingly short:

```python
chunk = tokens[i : i + T + 1]   # T+1 token ids from the training text
x = chunk[:-1]                  # input:  positions 0 .. T-1
y = chunk[1:]                   # target: positions 1 .. T
```

With the mask in place, one forward pass over a 1,024-token sequence is not one example. It is 1,024 examples, one per position, all computed at once in a single set of matrix multiplications. That parallelism is a big part of why Transformers displaced the recurrent networks that came before them, which had to walk through a sequence one step at a time even during training.

Look again at the column view. When the model predicts position 4, it is given the *true* tokens at positions 0 to 3, straight from the dataset, not whatever it would have generated itself. This is called **teacher forcing**.

:::story Picture this
A teacher hands out a fill-in-the-blanks worksheet with a twist: after you write your answer in each blank, the teacher immediately writes the correct word next to it, and you continue from the correct word rather than from your own. You never wander off down a wrong path, and every blank can be graded on its own. That is teacher forcing. The cost is that during the real exam, generation, nobody corrects you, and you have to continue from your own answers, mistakes included.
:::

That small mismatch between training (always perfect prefixes) and use (your own prefixes) has a name, **exposure bias**. Large models trained on enough data cope with it well, and later training stages partly address it, but the term comes up in interviews.

## 45. The Mask Itself

The mask is a grid $M$ the same size as the score grid, $T \times T$. Rows are queries, the tokens asking. Columns are keys, the tokens being looked at. A cell holds 0 where looking is allowed and $-\infty$ where it is not:

$$M_{ij} = \begin{cases} 0 & \text{if } j \le i \\ -\infty & \text{if } j > i \end{cases}$$

Read it: query $i$ may look at key $j$ only if $j$ comes at or before $i$. Row 0 sees only column 0. Row 1 sees columns 0 and 1. Row 6 sees everything. Everything above the diagonal is hidden. The allowed cells form a triangle, which is why people call it the causal triangle or a **lower-triangular** mask.

The mask is *added* to the scaled scores, before softmax. Any finite score plus $-\infty$ is $-\infty$, and $e^{-\infty} = 0$, so after softmax every hidden cell has a weight of exactly zero. The visible cells share the full weight of 1 among themselves, exactly as if the hidden tokens did not exist.

@fig mask_build | Building the masked attention. The raw scores plus the causal mask, then softmax along each row. Every row sums to one and only reaches back in time.

In code, the mask is built once and reused:

```python
mask = torch.triu(torch.ones(T, T, dtype=torch.bool), diagonal=1)  # True above the diagonal
scores = scores.masked_fill(mask, float('-inf'))                   # hide the future
weights = torch.softmax(scores, dim=-1)                            # each row sums to 1
```

`torch.triu(..., diagonal=1)` picks the cells strictly above the diagonal. The `diagonal=1` matters: it leaves the diagonal itself open, so every token can see itself.

## 46. Mask Before Softmax, Not After

The order of operations matters. A tempting mistake is to run softmax over the whole row and *then* set the future weights to zero. Let us see what that does, using row 2 (*sat*) from Section 39, whose scaled scores over all four keys are 0.185, 0.415, 0.71 and 0.445.

The right way masks first: the last score becomes $-\infty$, and softmax over the three visible scores gives 0.253, 0.319 and 0.428, summing to 1. The wrong way runs softmax over all four: the exponentials are 1.203, 1.514, 2.034 and 1.560, summing to 6.312, so the weights are 0.191, 0.240, 0.322 and 0.247. Then it zeroes the last one. What is left sums to 0.753. A quarter of the attention budget was spent on a token that was then thrown away.

@fig mask_order | Mask before softmax versus after. Masking first gives weights that sum to one over the visible tokens. Zeroing after softmax leaves weights summing to 0.753.

The damage is subtle. The output vector shrinks by a different amount at each position, depending on how much weight happened to fall on the future, and the model learns from distorted numbers. Worse, the future still influenced the result through the denominator: changing *␠because* changes 6.312, which changes every weight in the row. That is a leak. The mask must go on the scores, before softmax.

:::interview Interview lens
**"How does the causal mask work, and why add negative infinity rather than multiplying weights by zero?"** It is a $T \times T$ matrix with zeros on and below the diagonal and $-\infty$ above, added to the scaled scores before softmax. Since $e^{-\infty} = 0$, future positions get exactly zero weight and the remaining weights renormalize to sum to one over the visible tokens. Zeroing after softmax would leave rows that no longer sum to one and would let future scores influence the normalizer, which leaks information.
:::

## 47. Testing It, and the Other Masks

### A live causality test

To check a mask on any model: Feed in the sentence, record the attention outputs at every position, then change only the last word (*tired* to *hungry*) and run it again. If the mask is right, the outputs at positions 0 to 5 stay exactly the same, bit for bit. Only position 6 changes. That is the definition of causal: changing the future must not change the past.

@fig causality_test | The causality test. Changing the last token must leave every earlier output identical. If any earlier row changes, information is leaking backwards.

If an earlier position changes when you edit a later token, something is cheating. Suspiciously low training loss, much lower than comparable models report, is the classic symptom, and a leaky mask is the most common cause.

### Padding masks

Real batches have sentences of different lengths. To stack them into one rectangular block, the short ones are filled up with a **padding token**. Padding is not real text, so no real token should attend to it. A **padding mask** hides the padding columns. In practice you need both masks at once, combined so that a cell is allowed only if *both* masks allow it, a logical AND.

@fig mask_combined | Combining masks. The causal triangle AND a padding mask that hides the last two positions gives the mask real code actually uses.

The padding rows themselves are a separate concern. A padding position's prediction is meaningless, so it must be excluded from the loss, typically by setting its target to a special "ignore" value.

### Three mask shapes, three model families

The causal triangle is not the only shape. **Encoders** such as BERT use no mask at all, a full square, because they read a whole text to understand or classify it rather than generate it, and seeing both directions helps. **Decoders** such as GPT, Llama and Finch use the triangle. **Prefix language models** let the prompt see itself fully in both directions, then use a triangle for the part being generated.

@fig mask_families | Three mask shapes. A full square for encoders, a triangle for decoders, and a prefix language model that lets the prompt see itself fully before generating causally.

### Sharp edges of masks

**Off by one on the diagonal.** The diagonal is a token looking at itself and must stay open. Mask it too and the first token can see nothing at all, which produces the NaN of Section 42. `torch.triu(..., diagonal=1)` is correct; `diagonal=0` is the bug.

**Padding rows with nothing to see.** With left padding, a padding token's own row might have every key masked, giving NaN. Let pad rows see something harmless, such as themselves, and drop them from the loss.

**Generation needs no triangle for the new token.** When generating one new token at a time (Part XI), the new token is the last one and may see everything before it. There is nothing to hide. Applying a triangle aligned to the wrong corner at this step is a classic bug, which Day 2's SDPA chapter looks at closely.

**Sliding windows add, never replace.** Some models let each token see only the last few thousand tokens. That is another mask, and it must be combined with the causal mask by AND. Overwriting one with the other lets tokens see the future again.

:::warn Watch out
In PyTorch's built-in attention function, a *boolean* mask uses `True` to mean "may attend". In `masked_fill`, as above, `True` means "hide this". Several other libraries use the opposite convention. Mixing them up does not crash; it inverts the mask, so tokens see only what they should not. Always check what `True` means in the function you are calling.
:::

:::key In one breath
Training feeds whole sequences at once with targets equal to the input shifted left by one (teacher forcing), so one pass gives $T$ predictions; the causal mask stops each position from reading its own answer. It is a $T \times T$ matrix with 0 on and below the diagonal and $-\infty$ above, added to the scaled scores *before* softmax so future weights are exactly zero and each row still sums to one (zeroing after softmax leaves 0.753 in our example and leaks through the normalizer). Real batches AND it with a padding mask, encoders use no mask, and the test is simple: changing a later token must not change any earlier output.
:::

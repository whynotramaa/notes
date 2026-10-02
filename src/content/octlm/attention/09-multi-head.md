@part IX | Multi-Head Attention | One attention computation gives each token one set of weights, which means one blended answer to one question. Words usually need several things at once, so real models run many smaller attentions side by side, each free to look for something different. This part shows the blur that one head suffers, how heads split the width without growing the model, the habits trained heads fall into, and how their answers are stitched back together. | where:9

## 48. One Softmax, Two Needs

Look at *it* in *The cat sat because it was tired* once more. To build a good vector for *it*, the model wants at least two things. It wants the antecedent, *cat*, to know what *it* refers to. It also wants the word *because*, to know that *it* is the subject of a new clause explaining something. Those are two different reasons to look at two different tokens.

A single attention computation produces one set of weights per token, and the weights must sum to one. If one head tries to serve both needs, it has to split its budget: roughly half on *cat* and half on *because*. The output is then a fifty-fifty blend of *cat*'s value and *because*'s value, a muddy average that is neither "the cat" nor "a reason clause" and is harder for later layers to use than either clean signal.

@fig one_vs_two_heads | One head must split a single budget between two needs, giving a blurred average. Two heads can each take one job and give two sharp answers.

**Multi-head attention** fixes this by running several smaller attention computations side by side, each with its own queries, keys and values. Each one is called a **head**. One head can learn to resolve pronouns while another tracks clause structure, and a third tracks something else entirely. Their outputs are combined at the end. Every real Transformer uses this: GPT-2 small has 12 heads per layer, Llama 3 8B has 32, Finch-19 has 8.

:::story Picture this
Two people each reading one book do better than one person trying to read two books at once. Asking a single reader to sum up both a cookbook and a train timetable in one paragraph gives you a confusing paragraph. Give each reader one book and ask for two short summaries, and both come back clear. Heads are the readers.
:::

## 49. Split the Width, Do Not Multiply It

Heads do not make the model bigger. Finch-19's query for one token is 512 numbers long. With 8 heads, those 512 numbers are simply cut into 8 slices of 64. Head 0 uses numbers 0 to 63, head 1 uses 64 to 127, and so on. The same happens for keys and values. Each head runs the whole Part VII formula on its own slice, with $d_k = 64$.

$$d_{\text{head}} = \frac{d_{\text{model}}}{H} = \frac{512}{8} = 64$$

In code, the split is two reshape operations. After the projection, `q` has shape `(B, T, 512)`. Viewing it as `(B, T, 8, 64)` cuts the last dimension into 8 heads of 64. Transposing to `(B, 8, T, 64)` moves the head dimension before the token dimension, so that each head's $T \times 64$ block sits together and the attention formula can run on all 8 heads in one batched matrix multiplication.

@fig head_split | Splitting the width. A 512-number query is cut into eight 64-number heads, and two reshapes rearrange the tensor so all heads run in parallel.

```python
q = q.view(B, T, H, d_head).transpose(1, 2)   # (B, T, 512) -> (B, 8, T, 64)
k = k.view(B, T, H, d_head).transpose(1, 2)   # same for keys
v = v.view(B, T, H, d_head).transpose(1, 2)   # and values
att = softmax(q @ k.transpose(-2, -1) / 8.0 + mask, dim=-1)   # (B, 8, T, T); sqrt(64) = 8
out = att @ v                                  # (B, 8, T, 64)
```

So with 8 heads you get 8 independent attention patterns for about the same cost as one. There is one cost that does grow: each head has its own $T \times T$ weight grid, so 8 heads means 8 grids. Part X takes that seriously.

## 50. What Different Heads Learn

Nobody tells a head what to focus on. Each head's $W_Q$, $W_K$ and $W_V$ slices start random, and training sorts out a division of labour on its own. Researchers who open up trained models find the same habits again and again.

A **previous-token head** always looks one step back. It is one of the simplest patterns and one of the most useful: knowing "what came right before me" is the raw material for spotting phrases. An **antecedent head**, or more generally a coreference head, links words like *it* back to what they refer to. A **sink head** dumps most of its weight on the very first token when it has nothing useful to do, which works like a "no-op" setting, because the first token's value can learn to be harmless. A **broad head** spreads its weight evenly and produces a general summary of the context so far.

@fig head_habits | Four habits that heads fall into in trained models. Arc thickness shows attention weight. These patterns are illustrative, but each is documented in real models.

@fig head_matrices | The same four habits as weight grids. A line just under the diagonal, a bright column at the antecedent, a bright first column, and an even wash. Once you know these shapes, you can spot them in real attention maps.

A famous combination is the **induction head**, described by researchers at Anthropic in 2022. It works with a previous-token head in an earlier layer to implement the rule "if *A B* appeared earlier and I am now at *A*, predict *B*". That simple copy-the-pattern trick is a large part of how models learn from examples placed in their prompt.

:::note Attention sinks
The sink pattern turned out to matter in practice. In 2023, Guangxuan Xiao and colleagues showed that if you trim a long conversation by dropping its oldest tokens, including the first few, quality collapses, because many heads were parking their attention on token 0. Keeping the first few tokens around, as "sinks", alongside a window of recent tokens fixed it. Part XI comes back to this.
:::

## 51. Putting Heads Back Together

Each head produces its own output: for Finch-19, 8 outputs of 64 numbers per token. They have to become one 512-number vector again, so the block can add it back to the token's vector. Two steps do this.

First, **concatenate**: place the 8 outputs end to end, giving 512 numbers. That only stacks them side by side; head 0's findings sit in numbers 0 to 63, head 1's in 64 to 127, and they do not interact. Second, multiply by one more learned matrix, the **output projection** $W_O$, which is $512 \times 512$. Each of its output numbers is a weighted sum over all 512 concatenated numbers, so it can combine what the antecedent head found with what the clause head found.

$$\text{MultiHead}(x) = \text{concat}(\text{head}_1, \dots, \text{head}_H)\, W_O$$

@fig concat_wo | Concatenation stacks the eight head outputs into one 512-number vector; the output projection then mixes information across heads.

### More heads, same parameter bill

Count the attention parameters for one Finch-19 layer. $W_Q$, $W_K$, $W_V$ and $W_O$ are each $512 \times 512 = 262{,}144$ weights. Splitting into heads just cuts the same matrices into column blocks: head 0 uses columns 0 to 63 of $W_Q$, and so on. So the weight count is $4 \times 262{,}144 = 1{,}048{,}576$ whether you use 1 head, 8 heads or 64. With Finch's four bias vectors of 512, the layer's attention holds 1,050,624 parameters. In general, multi-head attention costs $4 d_{\text{model}}^2$ weights per layer, independent of $H$.

@fig head_params | The number of heads only changes how the projection matrices are cut, not their size. Four 512 × 512 matrices hold 1,048,576 weights for any head count.

:::interview Interview lens
**"Does adding more attention heads increase the parameter count?"** No. With $d_{\text{head}} = d_{\text{model}} / H$, the Q, K, V and output projections are each $d_{\text{model}} \times d_{\text{model}}$ regardless of $H$; more heads just slice those matrices into narrower blocks. What does grow is the number of $T \times T$ attention maps, and each head gets narrower, which is why head size is usually kept at 64 or 128.
:::

## 52. Heads Can Share Keys and Values

Unit II extends this idea. In standard multi-head attention, called **MHA**, every query head has its own keys and values. But the keys and values have to be stored during generation, in the KV cache of Part XI, and that storage is often what limits how long a conversation can be or how many users a server can handle.

So people asked: what if several query heads shared one set of keys and values? Each head still asks its own question with its own query, but they all look it up in the same keys and read the same values. With 8 query heads sharing 2 key/value heads in groups of 4, that is **grouped-query attention**, **GQA**. With all 8 sharing a single key/value head, it is **multi-query attention**, **MQA**. Noam Shazeer proposed MQA in 2019; Joshua Ainslie and colleagues at Google introduced GQA in 2023. Nearly every modern model uses GQA: Llama 3 8B has 32 query heads and 8 key/value heads. Unit II covers it in depth, and Finch-24 will use 8 query heads with 2 key/value heads.

@fig mha_gqa_mqa | Multi-head, grouped-query and multi-query attention. Query heads always stay separate; what changes is how many key/value heads they share. The KV cache shrinks in proportion.

### Sharp edges of multi-head attention

**$d_{\text{model}}$ must divide evenly by $H$.** 512 with 8 heads gives 64 per head; 768 with 12 gives 64. 768 with 10 heads would give 76.8, which does not work.

**Heads that are too narrow stop working well.** With too many heads, each slice is so thin it cannot represent much, and the $\sqrt{d_k}$-scaled scores get noisy. Almost every model keeps $d_{\text{head}}$ between 64 and 128, and adds more heads as the model gets wider rather than making heads thinner.

**Many heads are redundant, but you still need them in training.** Paul Michel and colleagues showed in 2019, in *Are Sixteen Heads Really Better than One?*, that many heads can be removed from a trained model with little loss. But training with fewer heads from the start usually does worse. Extra heads seem to help training find good solutions.

**The reshape bug.** Splitting into heads is a reshape, and one wrong axis order, such as `view(B, H, T, d_head)` instead of `view(B, T, H, d_head)` followed by a transpose, mixes numbers from different heads and different tokens. The shapes come out correct, the code runs, and the output is garbage. Check one head's output against a simple single-head reference implementation.

:::warn Watch out
When reading an attention visualization, check which layer and head you are looking at, and remember that a head's pattern on one sentence is not its "meaning". A head that looks like an antecedent head on *it* may do something different on code or numbers. Heads are habits learned for prediction, not labelled modules.
:::

:::key In one breath
Multi-head attention runs $H$ attention computations in parallel on slices of width $d_{\text{head}} = d_{\text{model}}/H$ (8 heads of 64 for Finch-19), so different heads can attend for different reasons without blurring into one average. Outputs are concatenated and mixed by $W_O$, and the four projections cost $4 d_{\text{model}}^2$ weights (1,048,576 in Finch-19) regardless of $H$, though each head adds its own $T \times T$ map. Trained heads show recurring habits (previous-token, coreference, sink, broad, induction), and sharing keys and values across query heads (GQA, MQA) shrinks the KV cache, the subject of Unit II.
:::

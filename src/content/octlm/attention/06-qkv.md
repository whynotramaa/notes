@part VI | Queries, Keys and Values | So far every token has its own vector, but tokens cannot see each other: *it* has no idea that a cat was mentioned. Attention is the mechanism that lets tokens look at one another and borrow information, and it works by giving every token three roles at once. This part builds those roles, the query, the key and the value, from a library analogy, through three learned projections, to a full worked example where *it* finds *cat*. | where:6

## 33. Every Token Plays Three Roles

Read our sentence again: *The cat sat because it was tired*. To understand *it*, you have to look back, find *cat*, and carry over what you know about cats. Without that step, the vector for *it* is just the generic embedding of the word "it", the same in every sentence ever written (Section 13 warned about exactly this). The model needs a way for one token to search the others and pull in information from the relevant ones. That mechanism is **attention**, and it is the single idea the Transformer is named for.

The names attention uses come from searching a library or a database, so let us start there. You walk into a library with a question written on a slip of paper: "who is *it*?". That is your **query**. Every book has a label on its spine, like *cat* or *because*. Those labels are the **keys**. You compare your question with the spines and find the best match. Then you open that book and read what is inside. That is the **value**.

@fig library | Query, key and value as a library visit. The query is compared with every spine label (key); the contents (values) are read in proportion to how well each label matched.

There is one big difference from a real library. Attention does not pick a single book. It reads a little from every book, a lot from the good matches and only a trace from the poor ones, and blends what it read into one answer. That blending is what makes attention trainable: a smooth mixture can be nudged a little at a time during training, whereas a hard "pick one" cannot.

The deep idea is that **every token plays all three roles at once**. *it* asks a question with its query. But *it* also has a key and a value, so that later tokens, *was* and *tired*, can find *it* and borrow from it. Every token is simultaneously a reader with a question, a book with a label, and the contents of that book.

## 34. Making Q, K and V

Where do the three vectors come from? Each one is the token's vector multiplied by a different learned weight matrix. Same input, three different views of it:

$$Q = x W_Q \qquad K = x W_K \qquad V = x W_V$$

Here $x$ is the input grid from Parts II to V, one row per token, shape $T \times d_{\text{model}}$. $W_Q$, $W_K$ and $W_V$ are three learned matrices, each $d_{\text{model}} \times d_{\text{model}}$ in Finch-19, that is $512 \times 512$. Multiplying a $7 \times 512$ grid by a $512 \times 512$ matrix gives another $7 \times 512$ grid. So $Q$, $K$ and $V$ each have one row per token: row 4 of $Q$ is the query of *it*, row 1 of $K$ is the key of *cat*, and so on. (Part IX cuts each of these into 8 heads of 64 numbers; for now, think of one big head.)

What does "multiply by a matrix" mean in plain words? Each output number is a weighted sum of all 512 input numbers, with the weights taken from one column of the matrix. So each column of $W_Q$ is a little recipe: "take 0.3 of input feature 17, minus 0.1 of feature 204, plus..." and the result is one feature of the query. A $512 \times 512$ matrix holds 512 such recipes. Training adjusts the recipes, and that is how the model learns *what to look for* ($W_Q$), *what to advertise* ($W_K$) and *what to pass along* ($W_V$).

@fig qkv_proj | One input, three projections. The 7 × 512 input is multiplied by three different learned 512 × 512 matrices, producing the queries, keys and values for all seven tokens at once.

Let us count. Each matrix has $512 \times 512 = 262{,}144$ weights, and Finch-19, like GPT-2, also adds a learned **bias** vector of 512 numbers after each projection (a fixed amount added to every output). So the three projections hold $3 \times (262{,}144 + 512) = 787{,}968$ parameters per layer. One more matrix of the same size, the output projection $W_O$, comes in Part IX, for a total of 1,050,624 attention parameters per layer.

In code it is three linear layers, or more commonly one fused layer three times as wide whose output is cut into three:

```python
qkv = nn.Linear(512, 3 * 512)(x)       # x: (B, T, 512) -> (B, T, 1536)
q, k, v = qkv.split(512, dim=-1)       # each (B, T, 512)
```

@fig qkv_all | Every token produces its own query, key and value. *it* asks with its q, and it can also be found, by later tokens, through its k and v.

## 35. Matching: The Score

Now we use them. To decide how much token $i$ should attend to token $j$, compare token $i$'s query with token $j$'s key using the dot product from Section 12: multiply them entry by entry and add up the results. A large positive score means "this key matches what I am looking for".

$$s_{ij} = q_i \cdot k_j$$

Let us run it for *it*, with toy 4-number vectors so we can do the arithmetic by hand. The query of *it* is $q = [1.0, 0.8, 0.0, 0.2]$. In a model like Finch-19, *it* is only allowed to look at itself and the tokens before it (Part VIII explains why), so it compares against five keys. The key of *cat* is $[1.2, 1.0, 0.1, 0.0]$, so the score is $1.0 \times 1.2 + 0.8 \times 1.0 + 0.0 \times 0.1 + 0.2 \times 0.0 = 2.00$. The key of *sat* is $[0.2, 0.3, 0.9, 0.1]$, giving $0.2 + 0.24 + 0 + 0.02 = 0.46$. Doing the same for the others gives 0.12 for *The*, 0.24 for *because* and 0.68 for *it* itself.

Scores can be any size and any sign, so they are not yet weights. To turn them into weights that are all positive and add up to 1, attention uses **softmax**: raise $e$ (about 2.718) to the power of each score, then divide each result by the total. Part VII looks at softmax in detail; here is the arithmetic. $e^{0.12} = 1.127$, $e^{2.00} = 7.389$, $e^{0.46} = 1.584$, $e^{0.24} = 1.271$ and $e^{0.68} = 1.974$. They sum to 13.346. Dividing each by 13.346 gives weights of 0.084, 0.554, 0.119, 0.095 and 0.148, which add up to 1.

@fig it_scores | The query of *it* scored against every key it can see (left), then turned into weights by softmax (right). More than half of the attention, 0.554, goes to *cat*. (Toy vectors.)

The tallest bar is *cat*. The model has learned to make the query of a pronoun match the key of a recently mentioned noun of the right kind. Nobody wrote that rule. Training found matrices $W_Q$ and $W_K$ that produce queries and keys with this property, because resolving *it* correctly helps predict what comes next (*was tired* is about the cat, so it predicts *purring* better than *parking*).

(Part VII adds one step we have skipped: the scores are divided by $\sqrt{d_k}$ before the softmax. With our tiny 4-number vectors it would not change the story.)

## 36. Mixing: The Weighted Sum of Values

Now the weights do their job. Each token's value vector is scaled by its weight, and the scaled values are added up into one output vector for the asking token:

$$o_i = \sum_j w_{ij} \, v_j$$

Read it out loud: the output for token $i$ is the sum, over every token $j$ it can see, of the weight from $i$ to $j$ times $j$'s value. Take toy 3-number values. *cat*'s value is $[0.9, 0.8, 0.1]$, and scaling it by its weight 0.554 gives $[0.498, 0.443, 0.055]$. *sat*'s value $[0.1, 0.0, 0.7]$ scaled by 0.119 gives $[0.012, 0.000, 0.083]$. Doing the same for all five and adding them up gives the output $[0.540, 0.485, 0.163]$.

@fig value_mix | Mixing the values. Each value is scaled by its weight and the results are summed. The output for *it* is dominated by *cat*'s value, with a little of everything else mixed in.

Compare the output with *cat*'s value: $[0.540, 0.485, 0.163]$ against $[0.9, 0.8, 0.1]$. The output points in roughly the same direction, a bit diluted by the other tokens. After this step, the vector for *it* carries information about the cat. That is what attention adds to a model, and it happens for every token in every layer: every token asks its question, gets a blend of answers, and is updated with what it learned.

:::story Picture this
Think of a mixing desk in a recording studio. Each token's value is one microphone channel. The attention weights are the faders: for the token *it*, the *cat* fader is pushed most of the way up, *it* and *sat* sit low, and *The* is nearly silent. The output is the mixed track. Change the query and you get a different fader setting, so every token hears its own mix of the same channels.
:::

:::interview Interview lens
**"Walk me through what attention computes for one token."** The token's query is dotted with every visible key to get one score per token; the scores are scaled and passed through softmax to get positive weights summing to one; the output is the weighted sum of the value vectors. So each token's new vector is a content-addressed blend of other tokens' values, where "content-addressed" means the blend is chosen by how well keys match the query, not by position.
:::

## 37. Why Keys and Values Are Separate

Why have both a key and a value? Couldn't one vector do both jobs?

Look at the box for *cat*. The label on the outside, the key, might encode "singular animal noun, grammatical subject". That is what helps a pronoun find it. The contents, the value, might encode "furry, purrs, the one who did the sitting". That is what is useful once you have found it. What makes you findable and what you have to offer are different things. A library would be useless if a book's spine label had to *be* its entire contents.

@fig kv_separate | A token's key is the label that makes it findable; its value is what it contributes once found. Two separate vectors let the model learn each without compromise.

Two separate matrices, $W_K$ and $W_V$, let the model learn each role without compromise. There is a practical consequence too: queries and keys must have the same length, because they are dotted together, but values can be a different length, because they are only ever scaled and summed. In standard multi-head attention all three are the same size (64 per head in Finch), but nothing forces it.

### Shapes, to scale

Here is the whole computation for one head, as shapes. $Q$ is $T \times d_k$. $K$ turned on its side, $K^\top$, is $d_k \times T$. Multiplying them gives $S = QK^\top$, a $T \times T$ grid holding one score for every pair of tokens: row $i$, column $j$ is $q_i \cdot k_j$. Softmax along each row turns $S$ into the weight grid $W$, still $T \times T$. Then $W$ times $V$ (shape $T \times d_v$) gives the output $O$, shape $T \times d_v$, one row per token again.

@fig shapes_sheet | The shapes of one attention head, drawn to scale for seven tokens and four-number heads. The score grid is T × T, one entry per pair of tokens.

Look hard at that $T \times T$ grid. It grows with the *square* of the text length: 49 entries for our sentence, a million for a thousand tokens, ten billion for a hundred thousand. Part X is entirely about it.

### Self-attention and cross-attention

In **self-attention**, the version in GPT-style models and in Finch, the queries, keys and values all come from the same sequence: the text looks at itself. In **cross-attention**, the queries come from one sequence and the keys and values from another. The original 2017 Transformer was built for translation and used cross-attention in its decoder: the sentence being written asked questions of the sentence being translated. Decoder-only models such as GPT, Llama and Finch use only self-attention.

### Sharp edges of Q, K and V

**Scores are not symmetric.** How much *it* attends to *cat* is not the same as how much *cat* attends to *it*, because the first uses *it*'s query and *cat*'s key, and the second uses *cat*'s query and *it*'s key. Read attention maps row by row: one row is one token's point of view.

**Tokens attend to themselves.** A token's query is also scored against its own key, and tokens often give themselves a sizeable weight (0.148 for *it* above). That is normal and useful.

**Attention weights are not explanations.** A large weight does not prove the model "used" that token for its final answer; many other parts of the model also shape the result. Treat attention maps as clues, not proof.

**Biases or no biases.** Finch-19 and GPT-2 put biases on the projections. Llama and most modern models drop them. Qwen keeps them on Q, K and V only. Loading weights into code that expects the other choice either crashes or silently gives wrong answers.

:::warn Watch out
Do not say "the query is the current token and the keys are the previous tokens". Every token has a query, a key and a value, and in training all of them are computed for all positions at once. The query of *it* is compared with the keys of *The* through *it*, and at the same moment the query of *tired* is compared with the keys of everything, including *it*'s key. The roles are per comparison, not per token.
:::

:::key In one breath
Attention lets tokens borrow information from each other. Each token's vector is projected three ways, $Q = xW_Q$, $K = xW_K$, $V = xW_V$ (three $512 \times 512$ matrices plus biases, 787,968 parameters per layer in Finch-19), giving every token a query (what I seek), a key (what I advertise) and a value (what I offer). Scores are dot products $q_i \cdot k_j$, softmax turns each token's scores into weights summing to one, and the output is the weighted sum $\sum_j w_{ij} v_j$; in the toy example *it* gives 0.554 of its attention to *cat*. Keys and values are separate so findability and content can be learned independently, and the score grid $QK^\top$ is $T \times T$.
:::

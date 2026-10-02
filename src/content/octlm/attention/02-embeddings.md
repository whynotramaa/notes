@part II | Embeddings: Giving Each Token a Meaning | The tokenizer hands the model a list of ids, but an id is only a name tag: the number 8415 says nothing about cats. This part replaces every id with a list of learned numbers, called an embedding, that the model can actually compute with. We will build the lookup table, see why a lookup counts as a matrix multiply, measure similarity between meanings, watch where the meanings come from, and count what the table costs. | where:2

## 9. An Id Is a Name Tag, Not a Quantity

After Part I, our sentence has become seven ids: 791, 8415, 7731, 1606, 433, 574, 19781. It would be tempting to feed those integers straight into the network as numbers. That would be a disaster, and seeing why is the whole motivation for this part.

Ids are like seat numbers on a train. Seat 8415 tells you which seat, not anything about who is sitting there. Nobody would say seat 8415 is "twice" seat 4207, or that the person in seat 8415 is more similar to the person in seat 8416 than to the person in seat 12. But arithmetic on raw ids says exactly those things. A network that multiplied the id by some weight would treat *␠cat* (8415) as almost the same as *␠sat* (7731), because the numbers are close, and very different from *␠kitten* (23140), because the numbers are far apart. The ids were handed out by the tokenizer in roughly the order the merges were learned, which has nothing to do with meaning.

@fig id_numberline | Token ids on a number line. Numerical closeness is an accident of when each merge was learned: *cat* lands next to *sat* and far from *kitten*. Any arithmetic on raw ids would learn from that accident.

What we want instead is a description of each token: a list of numbers where tokens with similar meanings get similar lists. Then "close" would actually mean "similar". That list is called an **embedding**, or an embedding vector. A **vector** is just an ordered list of numbers, like `[0.8, 0.6, 0.1, 0.0]`, and the number of entries is its **dimension**. From this point on, the model never touches the ids again. Everything downstream works with vectors.

## 10. The Lookup Table

The model keeps one big table, called the **embedding matrix** and written $E$. A matrix is a grid of numbers with rows and columns. $E$ has one row per token in the vocabulary and one column per dimension of the embedding. For Finch-19 that is 32,000 rows and 512 columns, so $E \in \mathbb{R}^{32{,}000 \times 512}$. (Read that as "E is a grid of real numbers, 32,000 by 512".) Row 8415 is the vector for *␠cat*. Row 433 is the vector for *␠it*.

Turning an id into a vector is exactly as simple as it sounds: go to the row with that number and copy it out. Nothing is computed. For our sentence, seven ids fetch seven rows, and stacking them gives a grid with 7 rows and 512 columns. That grid is called $x$, and it is the input to everything that follows.

$$x_i = E[\text{id}_i] \qquad x \in \mathbb{R}^{T \times d_{\text{model}}}$$

Read it out loud: the vector for position $i$ is row number $\text{id}_i$ of $E$, and the whole input $x$ has $T$ rows (one per token) and $d_{\text{model}}$ columns. For our sentence $T = 7$ and $d_{\text{model}} = 512$, so $x$ is $7 \times 512$, which is 3,584 numbers.

@fig embed_lookup | The embedding lookup. Each id selects one row of E and copies it into the input grid x. The table does not care about order or neighbours: the same token always gets the same row, wherever it appears.

Notice two things. First, the table has no idea where a token sits in the sentence. *␠cat* at position 1 and *␠cat* at position 100 fetch the identical row. Part III is entirely about fixing that. Second, in real training we feed many sentences at once, a **batch**. With a batch of $B$ sequences each $T$ tokens long, the input is a three-dimensional block of shape $B \times T \times d_{\text{model}}$. For a batch of 2 sequences of 8 tokens in Finch-19, that is $2 \times 8 \times 512 = 8{,}192$ numbers.

In code the whole step is one line:

```python
emb = torch.nn.Embedding(32000, 512)   # the table E, 16,384,000 numbers
x = emb(ids)                           # ids: (B, T) integers  ->  x: (B, T, 512)
```

:::story Picture this
A hotel front desk keeps a binder with one page per guest, filed by room number. When a message arrives for room 8415, the clerk does not compute anything about the number 8415. They flip to page 8415 and read what is written there: the guest's name, preferences, language. The room number is only how you find the page; the page is what you use. The embedding table is that binder, and training is how the pages get written.
:::

## 11. Why a Lookup Counts as a Matrix Multiply

You will often read that the embedding layer "is a matrix multiply". This is true, and seeing why makes it obvious how training can adjust the table like any other weight.

Write the id as a **one-hot vector**: a row of $V$ zeros with a single 1 in the position of the id. For id 2 in a toy vocabulary of 5, that is `[0, 0, 1, 0, 0]`. Now multiply that row by the table. Matrix multiplication takes each entry of the row, multiplies it by the matching row of the table, and adds the results. Every row of the table gets multiplied by zero except row 2, which gets multiplied by 1. What comes out is exactly row 2.

@fig one_hot | A lookup written as a multiply. The one-hot row for id 2 selects row 2 of the table; every other row is multiplied by zero and contributes nothing.

$$\text{onehot}(\text{id}) \cdot E = E[\text{id}]$$

So "look up a row" and "multiply a one-hot vector by $E$" give the same answer. Code always does the lookup, because building a 32,000-long vector of zeros to pick out one row would be absurdly wasteful. The multiply view matters for understanding training: when the model learns, the correction for $E$ only touches the rows that were actually used in that batch. Row 8415 gets updated when *␠cat* appears and is left alone otherwise.

:::interview Interview lens
**"Why can't we feed token ids directly into the network?"** Because ids are labels, not quantities. Any arithmetic on them would treat numerically close ids as similar and impose an ordering that has nothing to do with meaning. An embedding lookup is equivalent to multiplying a one-hot vector by a learned matrix, which gives each token its own independent, trainable vector, and only the rows for tokens in the batch receive gradient.
:::

## 12. A Map of Meaning

Each embedding is a list of 512 numbers, which you can think of as a point in a 512-dimensional space. Nobody can picture 512 dimensions, so the drawings squash things down to two, but the idea survives the squashing. After training, words that are used in similar ways end up close together. Animals sit near animals, vehicles near vehicles, feelings near feelings.

@fig embed_map | A two-dimensional sketch of embedding space. Similar words cluster. Directions can carry meaning too: the arrow from *man* to *woman* is roughly parallel to the arrow from *king* to *queen*. (Positions are illustrative.)

Directions can mean something too. The most famous example comes from word2vec, a 2013 method by Tomas Mikolov and colleagues at Google for learning word vectors. Take the vector for *king*, subtract *man*, add *woman*, and the nearest vector to the result is *queen*. The difference between *man* and *woman* acts like a "male to female" direction, and adding it to *king* moves you in that direction. Not every relationship works this cleanly, and transformer embeddings are messier than word2vec's, but the principle that geometry encodes meaning carries over.

### Measuring "similar": cosine similarity

To say how similar two vectors are, we need a number. The standard choice is **cosine similarity**, which asks one question: do the two arrows point the same way? It ignores how long the arrows are and looks only at the angle $\theta$ between them.

$$\cos\theta = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert}$$

Read it piece by piece. The top, $a \cdot b$, is the **dot product**: multiply the two vectors entry by entry and add up the results. The bottom multiplies their lengths, where the length $\lVert a \rVert$ is the square root of the sum of squared entries. Dividing by the lengths removes the effect of size, leaving only direction. The result runs from 1 (same direction) through 0 (at right angles, nothing in common) to $-1$ (opposite directions).

@fig cosine_angle | Cosine similarity depends only on the angle. Same direction gives 1, a sixty-degree angle gives 0.5, a right angle gives 0, and opposite directions give minus one.

Let us compute one. Give *cat* the toy vector $[0.8, 0.6, 0.1, 0.0]$ and *kitten* $[0.7, 0.7, 0.2, 0.1]$. The dot product is $0.8 \times 0.7 + 0.6 \times 0.7 + 0.1 \times 0.2 + 0.0 \times 0.1 = 0.56 + 0.42 + 0.02 + 0 = 1.00$. The length of *cat* is $\sqrt{0.64 + 0.36 + 0.01 + 0} = 1.005$ and the length of *kitten* is $\sqrt{0.49 + 0.49 + 0.04 + 0.01} = 1.015$. So the cosine is $1.00 / (1.005 \times 1.015) = 0.98$: almost the same direction. Now *cat* against *car*, $[0.1, 0.0, 0.9, 0.4]$: the dot product is $0.08 + 0 + 0.09 + 0 = 0.17$, the length of *car* is 0.990, and the cosine is $0.17 / (1.005 \times 0.990) = 0.17$. Barely related.

@fig cosine_heat | Six toy embeddings as colour strips (left) and every pairwise cosine similarity (right). The animals form one bright block, the vehicles another, and *the* resembles nothing.

Hold on to the dot product. It is the single most important operation in this chapter. In Part VI, attention decides how much one token should listen to another by taking exactly this dot product between two vectors, just without dividing by the lengths.

## 13. Where the Map Comes From

Nobody writes these vectors by hand, and nobody tells the model that cats and kittens are related. At the start of training, every row of $E$ is filled with small random numbers. The map is noise. Then training begins: the model predicts next tokens, measures how wrong it was, and nudges every weight, including the rows of $E$ that were used, a tiny bit in the direction that would have made the prediction better. Part XIII covers that loop in detail.

Why do clusters form? Because of a simple pressure. *cat* and *kitten* appear in similar sentences: both are followed by *purred*, *sat*, *was hungry*. If their vectors are similar, the rest of the network can handle them with the same machinery, and predictions after either one improve together. Every update that helps predict "the cat purred" also nudges *cat* toward whatever direction is useful for "purred", and so does every update for "the kitten purred". Over millions of steps, words used in similar contexts get pulled toward similar vectors. The map is a side effect of learning to predict.

@fig embed_training | Before and after training. At step 0 the rows are random and the map has no structure; after training, words that appear in similar contexts have been pulled into clusters. (Illustrative.)

This idea has a name in linguistics, the **distributional hypothesis**, usually quoted from J. R. Firth in 1957: "You shall know a word by the company it keeps." Embeddings are that hypothesis turned into an optimization.

:::warn Watch out
One token gets one vector, regardless of context. *bank* gets the same row whether the sentence is about rivers or money, and *it* gets the same row whether it refers to a cat or a car. The embedding cannot know the context, because it is a lookup. Fixing that is precisely what attention does: it mixes in information from the surrounding tokens so the vector for *it* can come to mean "the cat" in our sentence. Do not expect embeddings alone to handle ambiguity.
:::

## 14. The Size of the Table, and Sharing It

The embedding table is often the single largest weight matrix in a small model. Its size is $V \times d_{\text{model}}$. For Finch-19 that is $32{,}000 \times 512 = 16{,}384{,}000$ numbers, out of 42,128,384 in the whole model, or 38.9%. Stored in 16-bit precision (2 bytes per number), the table alone takes about 32.8 megabytes. For Llama 3 8B, with $V = 128{,}256$ and $d_{\text{model}} = 4{,}096$, it is 525,336,576 numbers, just over half a billion.

There is a second matrix of exactly the same size at the far end of the model. After the last layer, each position holds a 512-number vector, and the model must turn it into 32,000 scores, one per possible next token. That job is done by the **LM head** (language-model head), a matrix of shape $512 \times 32{,}000$, which Part XII covers. Notice that it has the same shape as $E$ flipped on its side, written $E^\top$ (the **transpose**: rows become columns).

So a natural idea is to use the same numbers for both. This is called **weight tying**. The input side asks "what vector represents token 8415?" and the output side asks "how well does this final vector match token 8415?", and it turns out one matrix can answer both. Tying was proposed in 2016 by Ofir Press and Lior Wolf, and by Hakan Inan and colleagues, who found it saves parameters and often improves quality in smaller models.

@fig tie_weights | Weight tying. The embedding matrix E is reused, transposed, as the LM head. For Finch-19 this saves 16,384,000 parameters, which would otherwise add 39% to the model.

Whether to tie is a size question. GPT-2 tied its embeddings, and so does Finch-19. Llama 3.2's small 1B and 3B models tie them too. Llama 3 8B and larger models keep them separate, because in a big model the table is a small fraction of the total and the extra flexibility helps.

### Sharp edges of embeddings

**Out-of-range ids crash.** If the tokenizer produces id 32,003 but the table only has 32,000 rows, the lookup fails. On a GPU the error message is often a confusing "device-side assert". This usually happens after someone adds special tokens to the tokenizer and forgets to resize the model's table. Always check that the tokenizer and the model agree on $V$, including special tokens.

**Padding has a row too.** When sentences of different lengths are batched together, short ones are filled up with a padding token. That token still fetches a row and produces a vector. The model will happily attend to it unless you mask it out, which Part VIII shows how to do, and you must also exclude it from the loss.

**Rare tokens barely move.** A token that appears a handful of times in training gets a handful of updates, so its row stays close to random. This is the mechanism behind the under-trained tokens of Section 8.

**Scaling conventions differ.** The original 2017 Transformer multiplied each embedding by $\sqrt{d_{\text{model}}}$ before adding position information, and Gemma does the same. GPT-2 and Llama do not. Loading weights trained one way into code written the other way changes every input by a factor of about 22.6 (the square root of 512 for Finch) and quietly breaks the model.

:::interview Interview lens
**"What is weight tying, and when would you not use it?"** It reuses the input embedding matrix, transposed, as the output projection to vocabulary logits, since both map between token identity and a $d_{\text{model}}$-dimensional vector. It saves $V \times d_{\text{model}}$ parameters, which is a large fraction of a small model (39% of Finch-19), and acts as a mild regularizer. Large models often untie because the table is a small share of their parameters and separate input and output roles can help quality.
:::

:::key In one breath
Token ids are labels, so each one is replaced by a learned vector: row $\text{id}$ of the embedding matrix $E \in \mathbb{R}^{V \times d_{\text{model}}}$, giving an input $x$ of shape $T \times d_{\text{model}}$ (7 × 512 for our sentence). The lookup equals a one-hot row times $E$, so only used rows get gradients. Training pulls tokens that appear in similar contexts toward similar directions, and we measure that with cosine similarity, $a \cdot b / (\lVert a \rVert \lVert b \rVert)$, whose dot product reappears at the heart of attention. The table costs $V \times d_{\text{model}}$ numbers (16.4M for Finch-19) and can be tied to the LM head to save that cost again.
:::

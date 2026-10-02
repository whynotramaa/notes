@part III | Positions: Order Is Invisible Until You Add It | Attention, the engine at the heart of the model, compares every token with every other token and has no idea what order they came in. This part shows that blind spot with our own eyes, separates the two meanings of "where", and builds the simplest fix, the learned position table GPT-2 shipped with. We then find its two weaknesses, which set up the smarter schemes of Parts IV and V. | where:3

## 15. The Blind Spot

"Dog bites man" is not news. "Man bites dog" is. The two sentences contain exactly the same three words, and the only thing that separates a boring headline from a front page is order. Any model of language must care about order. Here is the strange fact this part is built around: the attention mechanism, on its own, does not.

We have not built attention yet (that is Part VI), so take one property on trust for now and we will prove it there. Attention works by letting each token look at every other token and blend in information from the ones it finds relevant. The amount each token takes from another depends only on *what* the two tokens are, never on *where* they are. If you shuffle the input tokens, attention shuffles its outputs in exactly the same way and changes nothing else. Mathematicians call this being **permutation equivariant**: rearrange the input, and the output is rearranged identically.

@fig shuffle_blind | The shuffle test. With no position information, the attention output for *dog* is identical in "dog bites man" and "man bites dog". The model literally cannot tell who bit whom.

In other words, without help, attention sees a sentence as a bag of words. Every word knows which other words are present, but not where they are. So we must add position information somehow. The rest of this part, and the next two, are three different answers to "how?".

:::story Picture this
Imagine a meeting where everyone writes their contribution on an index card and drops it into a hat. You can pull out all the cards and read every idea, but you have lost who spoke first, who replied to whom, and which remark came at the end. To recover the conversation you would need each card stamped with a time. Position information is that stamp.
:::

## 16. Two Kinds of "Where"

Before we stamp anything, we should decide what "position" means, because there are two quite different answers.

**Absolute position** is a fixed seat number counted from the start: "I am token number 4." **Relative position** is a distance between two tokens: "the word I care about is three steps behind me." In our sentence, *it* is at absolute position 4 and *cat* is at absolute position 1, so *cat* is three positions behind *it*.

@fig abs_rel | Absolute versus relative position. Absolute says "I sit at seat 4". Relative says "the token I need is three seats back". For language, the gap is usually what matters.

For language, relative position is usually what matters. "The" right before "cat" means the same thing at the start of a book and on page 300. A pronoun tends to refer to a noun a few words back, wherever the sentence happens to sit. A model that only knows absolute positions has to learn "an adjective one step before a noun" separately at position 5, position 6, position 7 and every other position, which is wasteful. A model that sees relative positions directly learns it once. Keep this in mind: it is the reason RoPE, in Part V, won.

## 17. Learned Absolute Positions

The simplest fix borrows the idea from Part II. We already have a table with one row per token. Make a second table, called the **position embedding** table $P$, with one row per *position* instead. Look up the row for each position and add it, number by number, to the token's vector:

$$x_i = E[\text{id}_i] + P[i]$$

Read it out loud: the input vector at position $i$ is the token's own vector plus the vector for position $i$. For Finch-19, $P$ has 1,024 rows (the context length) and 512 columns (the model width), so it holds $1{,}024 \times 512 = 524{,}288$ learned numbers. Like $E$, it starts random and is learned during training.

Let us add one by hand. *␠cat* sits at position 1. Its token vector begins $[0.12, -0.40, 0.33, 0.05, -0.21, 0.18, \dots]$ and row 1 of $P$ begins $[0.02, 0.10, -0.05, 0.20, 0.07, -0.11, \dots]$ (illustrative values). Adding entry by entry gives $[0.14, -0.30, 0.28, 0.25, -0.14, 0.07, \dots]$. The same addition happens for all 512 numbers, for all seven tokens. Now *dog* at position 0 and *dog* at position 2 produce different inputs, and the shuffle test fails, which is what we wanted.

@fig pos_add | Adding a position. The token's row from E and the position's row from P are added entry by entry. The result carries both "which token" and "which seat" in the same 512 numbers.

@fig pos_table | The position table. Each position fetches its own row, whatever token happens to sit there: position 3 always gets row 3. Our seven tokens use rows 0 to 6.

Why *add* rather than glue the position vector onto the end, making each vector longer? Gluing would double the width of everything downstream, which is expensive. Adding keeps the width at 512. The cost is a squeeze: the same numbers now carry two kinds of information at once, and the model has to learn to keep "what" and "where" apart. In a space with hundreds of dimensions there is plenty of room, and in practice the model manages, but it is not a clean separation. Part V's RoPE avoids the squeeze entirely.

GPT-2 used exactly this scheme with a table of 1,024 rows, as did BERT with 512, and Finch-19 copies GPT-2.

:::note Where the positions go in code
In code this is two lookups and one addition: `x = tok_emb(ids) + pos_emb(torch.arange(T))`. The position ids are simply 0, 1, 2 up to $T - 1$. The batch dimension takes care of itself, because the same position rows are added to every sequence in the batch.
:::

## 18. What the Learned Table Ends Up Looking Like

Nobody told the model anything about how positions relate. Position 7 and position 8 got two independent random rows at the start, exactly as unrelated as position 7 and position 900. So what do the rows look like after training?

A good way to look is to compute the cosine similarity (Section 12) between every pair of position rows and draw the result as a grid. The diagonal is bright, which is trivial: every row is identical to itself. The interesting part is just off the diagonal. In trained models such as GPT-2, the brightness fades smoothly as you move away from the diagonal. Position 8 is quite similar to 7 and 9, less similar to 5 and 11, and barely similar to 2 or 14.

@fig pos_similarity | Similarity between learned position rows after training. Nearby positions end up with similar vectors, and similarity fades smoothly with distance. (Illustrative of the pattern seen in GPT-2.)

That pattern was learned, not designed. The model discovered on its own that nearby positions should look alike, which is a crude form of relative position: if positions 7 and 8 have similar vectors, then "the token right before me" looks roughly the same wherever you are. The model is trying to reinvent relative position from absolute parts. That is a hint that we should give it relative position directly.

## 19. Where Learned Positions Break

The learned table works. GPT-2 shipped with it and so did many models after. But it has two real weaknesses, and they are why newer models moved on.

### The maximum-length wall

The table has exactly as many rows as the longest text seen in training: 1,024 for Finch-19 and GPT-2. A token at position 1,024 has no row to fetch. That is not a soft degradation, it is a hard wall. A model trained this way literally cannot read token 1,025 unless you add new rows and train them, and those new rows start out random.

@fig pos_wall | The maximum-length wall. Positions past the end of the table have nothing to fetch. GPT-2 hit this wall at 1,024 tokens.

There is a softer version of the same problem inside the limit. If most training documents are short, the rows for high positions are trained on far fewer examples than the rows for low positions. The model then behaves a little worse near the end of long inputs, even before the wall.

### The same relationship, learned many times

The second weakness is the one Section 16 warned about. Put the pair *the cat* at positions 2 and 3, then put it again at positions 102 and 103. The gap is one step both times, so the relationship is the same. But rows 2, 3, 102 and 103 of $P$ are four independent vectors. Nothing in their numbers says "these two pairs are one step apart in the same way". The model has to learn the "one step back" relationship separately at every offset it could appear at, and it only generalizes to offsets it has seen enough.

@fig same_relation | The same relationship at two places. The gap is one position each time, but the four position vectors have nothing in common, so the model gets no free generalization from one place to the other.

:::warn Watch out
Position schemes are baked into the trained weights. You cannot take a model trained with learned positions and switch it to another scheme without substantial retraining, because every layer has learned to read the position signal in the form it was trained with. Choose the scheme at the start, or budget a real fine-tuning phase for the switch.
:::

## 20. Three Answers, Three Injection Points

Here is the map the next two parts will fill in. There are three main families of position scheme, and the clearest way to tell them apart is *where* they inject position into the model.

**Learned absolute positions** (this part) add a trained table $P$ to the token vectors once, at the very bottom, before the first layer. **Sinusoidal positions** (Part IV) also add a vector at the bottom, but compute it from a fixed formula of sine and cosine waves instead of learning it, so there are no parameters and no table to run out of. **RoPE** (Part V) does something different in kind. It never touches the input at all. Instead, inside every attention layer, it rotates the vectors used for comparing tokens by an angle that depends on their positions, in such a way that the comparison only sees the distance between them.

@fig pos_injection | Where each scheme injects position. Learned and sinusoidal positions are added once at the bottom. RoPE rotates the query and key vectors inside every attention layer and leaves the token vectors alone.

| | Learned | Sinusoidal | RoPE |
|---|---|---|---|
| Where | added at the bottom | added at the bottom | inside every attention layer |
| Parameters | $T_{\max} \times d_{\text{model}}$ (524,288 for Finch-19) | none | none |
| Past training length | hard wall, no rows | computable, but untrained | computable, and can be stretched |
| Relative position | learned indirectly | implicit in the waves | exact, by construction |
| Used by | GPT-2, BERT | original 2017 Transformer | Llama, Mistral, Qwen, Gemma |

### Sharp edges of positions

**Left padding shifts positions.** When you batch prompts of different lengths for generation, you often pad short prompts on the *left* so that all of them end at the same place. The first real word of a padded prompt then sits at position 3 or 4 instead of 0, and the model thinks the text started later than it did. Compute position ids from the attention mask (count only real tokens), never from the raw index.

**Packed documents need a decision.** To avoid wasting compute on padding, training often packs several short documents end to end into one long row. Should the second document's positions restart at 0, or continue from where the first ended? Both work, but the attention mask must agree with your choice, so that tokens from one document cannot see the previous one.

**No positions is not quite zero information.** A surprising result: a model with the causal mask of Part VIII and no position scheme at all can still infer some order, because each token can see a different number of earlier tokens, and it can learn to count them. This is a curiosity worth knowing for interviews, not a replacement for real positions.

:::interview Interview lens
**"Why does a Transformer need positional encodings at all?"** Because self-attention is permutation equivariant: attention weights depend only on the content of the query and key vectors, so shuffling the input tokens just shuffles the outputs. Without positions, "dog bites man" and "man bites dog" are indistinguishable. Positional information can be added to the inputs (learned or sinusoidal) or injected into the query-key comparison (RoPE), and the second approach gives relative position directly.
:::

:::key In one breath
Attention is blind to order, so position must be added. Absolute position is a seat number; relative position is a gap, and language mostly cares about gaps. Learned positions add a trained row, $x_i = E[\text{id}_i] + P[i]$, with $P \in \mathbb{R}^{1024 \times 512}$ (524,288 parameters) for Finch-19, and after training nearby rows come out similar. The scheme hits a hard wall at the table's last row and must relearn every relationship at every offset, which motivates formula-based positions (Part IV) and rotations inside attention (Part V).
:::

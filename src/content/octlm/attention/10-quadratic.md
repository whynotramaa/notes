@part X | The n × n Matrix: Where the Cost Lives | Every token scores every other token, so the score grid has one entry for every pair: 49 for our sentence, a million for a thousand tokens, ten billion for a hundred thousand, per head and per layer. This part makes that square visible, works out exactly when it becomes the bottleneck and when it does not, and introduces the two ways real systems cope: compute it cleverly, or compute less of it. | where:10

## 53. Every Token Scores Every Token

In Part VII the score grid $S = QK^\top$ had one row per query and one column per key. With $T$ tokens, that is $T \times T = T^2$ scores. For our 7-token sentence, 49. For 1,000 tokens, 1,000,000. For 100,000 tokens, 10,000,000,000. And that is for *one* head in *one* layer: Finch-19 has 8 heads in each of 8 layers, so 64 such grids per forward pass.

This growth with the square of the length is called **quadratic cost**, and it is the main reason long contexts are hard and expensive. The tokens themselves grow in a line: double the text, double the tokens. The grid grows in both directions at once: double the text, and both the number of rows and the number of columns double, so the area quadruples.

@fig grid_grow | Tokens grow in a line; scores grow in a square. Four tokens make 16 scores, eight make 64, sixteen make 256.

Strictly speaking, the causal mask hides about half the grid, so a decoder only *needs* $T(T+1)/2$ scores: 28 for our sentence, 136 for 16 tokens. Half of a square is still a square in how it grows. Dividing by two does not change the shape of the curve.

## 54. Doubling Is Quadrupling

The quadratic law has a counter-intuitive consequence that is worth stating as plainly as possible. Going from a 4,000-token context to an 8,000-token one does not double the attention work; it quadruples it. Going from 4,000 to 128,000 tokens multiplies the tokens by 32 and the scores by $32^2 = 1{,}024$.

@fig doubling_squares | Each square has double the side of the previous one and four times the area. Five doublings from 4k to 64k multiply the score grid by 256.

:::story Picture this
Picture a party where every guest shakes hands with every other guest. Ten guests means 45 handshakes. Twenty guests, twice as many people, means 190 handshakes, more than four times as many. A hundred guests means 4,950. Attention is that party: every token greets every token, and the host's job grows far faster than the guest list.
:::

## 55. When Does Attention Actually Dominate?

The square sounds alarming, but attention is not the only work in a layer, and for short texts it is not even the biggest. To compare fairly, count **FLOPs**, floating-point operations (one multiplication or one addition each). A matrix multiply of an $m \times n$ matrix by an $n \times p$ matrix costs about $2mnp$ FLOPs, one multiply and one add for each term.

Per token, per layer, the four attention projections ($W_Q$, $W_K$, $W_V$, $W_O$, each $d \times d$) cost $4 \times 2d^2 = 8d^2$ FLOPs. The MLP (Part XII), which widens to $4d$ and back, costs $2 \times 2 \times d \times 4d = 16d^2$. Together the linear layers cost about $24d^2$ FLOPs per token, and that does not depend on the length of the text. The attention computation itself, scoring the token's query against $T$ keys and blending $T$ values, costs about $2Td + 2Td = 4Td$ FLOPs per token, which grows with $T$.

$$\underbrace{24\,d^2}_{\text{projections + MLP}} \quad \text{versus} \quad \underbrace{4\,T\,d}_{\text{attention}} \quad\Longrightarrow\quad \text{equal when } T = 6d$$

Read the conclusion out loud: attention's arithmetic overtakes everything else in the layer once the context is about six times the model width. For a model with $d = 4{,}096$, such as Llama 3 8B, that is around 24,576 tokens. Below it, the projections and MLP cost more and attention is not the bottleneck. Above it, attention takes over. For Finch-19, with $d = 512$, the crossover is at 3,072 tokens, three times its whole context window, so in Finch attention arithmetic never dominates. Wider models stay in the "attention is cheap" zone for longer.

@fig attn_vs_linear | Forward FLOPs per token per layer for a 4,096-wide model. The linear layers cost a flat 24d²; attention grows in a line with T and crosses at T = 6d, about 24,600 tokens.

(For causal attention the real attention cost is about half, $2Td$ averaged over positions, which moves the crossover to roughly $12d$. Both conventions appear in the literature; the shape of the argument is what matters.)

:::interview Interview lens
**"Is attention the bottleneck in a Transformer?"** It depends on context length relative to width. Per token per layer, projections and MLP cost about $24d^2$ FLOPs while attention costs about $4Td$, so attention arithmetic dominates only when $T$ exceeds roughly $6d$, about 24k tokens for $d = 4096$. For short prompts the MLP and projections dominate; for long contexts attention's arithmetic and, even more, its memory traffic dominate.
:::

## 56. The Memory Bill

The square costs twice: once in arithmetic, and once in memory. A simple implementation computes the whole score grid, stores it, applies softmax, stores the result, and then multiplies by $V$. Storing one grid in 16-bit numbers takes $T^2 \times 2$ bytes per head.

For Finch-19 at its full context of 1,024 tokens, one layer's 8 grids take $8 \times 1{,}024^2 \times 2 = 16.8$ megabytes. Harmless. For a model with 32 heads at 8,192 tokens, it is 4.3 gigabytes per layer. At 32,768 tokens it is 68.7 gigabytes, almost the entire memory of one 80-gigabyte data-centre GPU, for one layer's scores alone. At 131,072 tokens it is 1.1 terabytes. No GPU can hold that.

@fig score_memory | Memory needed to store one layer's full score grids in 16-bit, for 8 and 32 heads, on a log scale. Past about 32k tokens, a 32-head layer no longer fits on one 80 GB GPU.

There is a subtler cost hiding here too. Even when the grid fits, writing gigabytes of scores out to the GPU's main memory and reading them back for softmax takes time, and on modern GPUs that data movement, not the arithmetic, is usually what makes attention slow. Day 2's FlashAttention chapter is built entirely on that observation.

## 57. How Real Systems Cope

There are two ways out. Keep exactly the same maths but never store the full grid, or deliberately skip most of the grid.

### FlashAttention: never build the whole square

**FlashAttention**, introduced by Tri Dao and colleagues in 2022, cuts the score grid into tiles and handles one tile at a time. A block of queries is loaded into the GPU's small, very fast on-chip memory. The method then sweeps across the blocks of keys and values: for each tile it computes the scores, uses them immediately to update a running result, and throws them away. The full $T \times T$ grid is never stored anywhere. Tiles entirely above the diagonal are skipped completely, because the causal mask would hide them anyway.

@fig flash_tiles | FlashAttention's tiling. One query block stays in fast memory while key/value blocks stream past; each tile's scores are used and discarded. Future tiles are skipped entirely.

The answer at the end is *exactly* the same as ordinary attention, not an approximation. The trick that makes that possible is the next subsection.

### Online softmax

Softmax seems to need the whole row at once: the maximum (for the overflow fix of Section 41) and the total of all the exponentials. How can you do it tile by tile? By keeping two running numbers per query row, the largest score seen so far, $m$, and the running sum of exponentials relative to it, $\ell$, and correcting them whenever a bigger maximum turns up.

Take one query whose scores arrive in two chunks. The first chunk is $[2.0, 1.0, 3.0]$, so $m = 3$ and $\ell = e^{-1} + e^{-2} + e^{0} = 0.368 + 0.135 + 1 = 1.503$. The second chunk is $[5.0, 0.0, 4.0]$, which contains a bigger maximum, 5. Everything in $\ell$ was measured relative to 3, so we shrink it to be relative to 5 by multiplying by $e^{3 - 5} = 0.135$, giving 0.203. Then we add the new chunk's exponentials relative to 5: $e^0 + e^{-5} + e^{-1} = 1 + 0.007 + 0.368 = 1.375$. The total is $\ell = 1.578$. Computing the sum of $e^{s - 5}$ over all six scores in one go gives 1.578 exactly. The same rescaling is applied to a running weighted sum of values, so the final output matches too.

@fig online_softmax | Online softmax with two chunks. When a larger maximum arrives, the old running sum is rescaled by e to the power of (old max minus new max) before adding the new terms. The result equals the all-at-once sum.

This technique is called **online softmax**, described by Maxim Milakov and Natalia Gimelshein in 2018. FlashAttention combines it with tiling. Day 2 gives FlashAttention a whole part, including what happens during training.

### Or compute fewer scores

The other approach is to not compute most of the grid. **Sparse attention** patterns choose a subset of query-key pairs. A **sliding window** lets each token see only its last $w$ neighbours. A **strided** pattern adds a few long-distance links, for example every fourth token. For 16 tokens, full causal attention computes 136 cells; a window of 4 computes 58; window plus stride computes 73. For long texts the savings become enormous, because a window's cost grows in a line with $T$, not as a square.

@fig sparse_patterns | Three patterns on 16 tokens. Full causal attention keeps 136 cells, a sliding window of four keeps 58, and adding a stride of four keeps 73.

Unlike FlashAttention, this is not exact. Some tokens can no longer see each other directly, and information has to hop through intermediate tokens across layers, so quality can drop on tasks that need precise long-range lookups. Mistral 7B's first version used a 4,096-token sliding window, and several large models mix windowed layers with a few full-attention layers.

### Sharp edges of attention cost

**For short prompts, blame the MLP.** With a few hundred tokens, attention is a small share of the work; the projections and MLP dominate (Section 55). Measure before you optimize attention.

**FlashAttention is exact.** People sometimes avoid it thinking it trades accuracy for speed. It computes the same answer in a different order, with only last-digit rounding differences.

**Padding wastes squares.** If one sequence in a batch has 2,000 tokens and the rest have 100, everyone is padded to 2,000 and you compute a huge grid that is mostly padding. Sort batches by length, pack sequences together, or use kernels that accept variable lengths.

**Generation is linear per step.** When generating one token at a time, the new token's query scores only against the existing keys: one row of $T$, not a $T \times T$ grid. Each step's attention cost grows in a line with the length. Part XI shows how.

**Linear attention trades quality.** Some methods replace softmax attention with alternatives whose cost grows linearly with length. They are much cheaper but usually remember precise long-range details less well, which is why hybrids often mix a few full-attention layers back in.

:::warn Watch out
"Attention is $O(T^2)$" is true of the score grid but is not the same as "Transformers are slow because of attention". At typical chat lengths, most FLOPs are in the weight matrices, and during generation most *time* is spent reading weights and the KV cache from memory. Say which cost you mean: arithmetic, memory capacity, or memory traffic.
:::

:::key In one breath
The score grid has $T^2$ entries per head per layer (about half needed under the causal mask), so doubling the context quadruples it and 4k to 128k multiplies it by 1,024. Per token per layer the linear layers cost about $24d^2$ FLOPs and attention $4Td$, so attention arithmetic dominates only past $T \approx 6d$ (24,576 for $d = 4096$, never within Finch-19's context), but storing the grids costs $H \times T^2 \times 2$ bytes per layer, 1.1 TB at 128k with 32 heads. FlashAttention avoids storing the grid by tiling with online softmax (exact; the running sum is rescaled by $e^{m_{\text{old}} - m_{\text{new}}}$), while sparse and sliding-window patterns compute fewer scores at some cost in quality.
:::

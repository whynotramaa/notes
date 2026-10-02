@chapter faq | Interview Question Bank | Forty-eight questions in the order of the chapter, each answered the way a strong candidate would say it out loud: the claim first, then the reason, then the detail that shows depth.

### Language modeling and tokens

**Q1. What does a decoder-only language model compute?**

A probability distribution over the vocabulary for the next token, conditioned on all previous tokens. Generation repeats it: sample a token, append it, run again. Everything a chat model does is built on that single next-token prediction.

**Q2. Why can a decoder train on all positions in parallel but not generate in parallel?**

In training the whole target sequence already exists, so every position's true prefix is available at once and the causal mask keeps each position honest. In generation, token $t+1$ does not exist until token $t$ has been produced, so the steps form a dependency chain.

**Q3. Why do modern tokenizers start from bytes rather than characters or words?**

Bytes are a fixed alphabet of 256 values that can spell any text in any language, so nothing is ever unknown. Words need an open-ended vocabulary with an unknown token; characters need about 150,000 symbols. BPE on bytes then adds merges so common text stays short.

**Q4. Walk me through BPE training.**

Pre-tokenize the corpus into chunks, spell each chunk as bytes, count every adjacent pair weighted by chunk frequency, merge the most frequent pair into a new token with the next id, and repeat until the vocabulary reaches its target size. The ordered list of merges is the tokenizer; ties must be broken deterministically.

**Q5. Why does the order of merges matter at encoding time?**

Merges compete for the same bytes. Encoding replays merges in learned order; applying a later merge first can block an earlier one from ever matching and produce a different, usually longer, encoding.

**Q6. What is pre-tokenization for?**

It splits text into words, numbers, punctuation and whitespace before merging, so merges never cross those walls. Without it you get tokens like "dog." and "of the" that waste vocabulary and fragment meaning. GPT-style patterns attach the leading space to the following word.

**Q7. What are the trade-offs of a larger vocabulary?**

Fewer tokens per document, so cheaper attention and more text per context window, but a larger embedding table and LM head ($V \times d_{\text{model}}$ each) and rarer tokens with fewer training updates. Gains in compression flatten while cost grows linearly, which is why vocabularies sit between about 32k and 256k.

**Q8. Why compare models with bits per byte rather than perplexity?**

Perplexity is per token, and a model with shorter tokens faces easier predictions. Bits per byte divides the loss in nats by $\ln 2$ and by average bytes per token, measuring surprise per unit of actual text, which is comparable across tokenizers.

**Q9. Why do language models struggle to count letters in a word?**

They see token ids, not characters. "strawberry" arrives as one or two tokens with learned vectors; the spelling has to have been memorized from training text, which it is only imperfectly.

### Embeddings and positions

**Q10. Why not feed token ids directly into the network?**

Ids are labels, not quantities; arithmetic on them invents an ordering and a notion of closeness that has nothing to do with meaning. An embedding lookup gives every token an independent learned vector.

**Q11. Why is an embedding lookup equivalent to a matrix multiply?**

Multiplying a one-hot row vector by the embedding matrix selects exactly one row. So the lookup is a linear layer with a sparse input, and only rows for tokens present in the batch receive gradient.

**Q12. What is cosine similarity and where does its core operation reappear?**

$a \cdot b / (\lVert a \rVert \lVert b \rVert)$, the cosine of the angle between two vectors, from $-1$ to 1. Its numerator, the dot product, is exactly how attention scores a query against a key, without the normalization.

**Q13. What is weight tying?**

Reusing the input embedding matrix, transposed, as the output projection to vocabulary logits. It saves $V \times d_{\text{model}}$ parameters, 39% of a model like Finch-19, and is common in small models; large models often untie.

**Q14. Why does a Transformer need positional information?**

Self-attention is permutation equivariant: weights depend only on query and key content, so shuffling inputs only shuffles outputs. Without positions "dog bites man" and "man bites dog" are indistinguishable.

**Q15. What are the weaknesses of learned absolute position embeddings?**

A hard wall at the table's length, since positions beyond it have no row, and no sharing between offsets: the same relationship at positions 2 and 102 uses unrelated vectors and must be learned separately.

**Q16. Explain sinusoidal position encodings.**

Each dimension pair holds $\sin(p\,\omega_i)$ and $\cos(p\,\omega_i)$ with frequencies $\omega_i = 10000^{-2i/d}$ forming a geometric ladder. Vectors are bounded, unique, need no parameters, and $\text{PE}(p) \cdot \text{PE}(p+k) = \sum_i \cos(k\omega_i)$ depends only on the offset.

**Q17. Why do sinusoidal encodings not really extrapolate?**

The formula can be evaluated anywhere, but combinations of wave phases beyond the training length were never seen, so the layers never learned to interpret them; quality drops past the training length.

**Q18. How does RoPE work?**

It rotates each two-dimensional pair of the query and the key by an angle equal to the token's position times a per-pair frequency, after the Q and K projections and before the dot product. Values and the residual stream are untouched.

**Q19. Why does RoPE give relative position?**

The dot product of two rotated vectors equals the dot product of the original query with the key rotated by the position difference: $\langle R_m q, R_n k\rangle = \langle q, R_{n-m} k \rangle$. Absolute positions cancel; only $n - m$ remains.

**Q20. How can a RoPE model be extended to longer contexts?**

Position interpolation divides positions by the extension factor so angles stay in the trained range, then fine-tunes briefly on long text. NTK-aware scaling and YaRN instead change frequencies unevenly, preserving fast pairs and stretching slow ones.

### Attention

**Q21. What are queries, keys and values?**

Three learned linear projections of each token's vector: the query encodes what the token seeks, the key what it offers for matching, the value what it contributes if attended to. Every token produces all three.

**Q22. Why scale by $\sqrt{d_k}$?**

For components with zero mean and unit variance, $q \cdot k$ has variance $d_k$. Large-variance scores push softmax into saturation, where gradients like $p(1-p)$ vanish. Dividing by $\sqrt{d_k}$ restores unit variance at any head size; dividing by $d_k$ would overshrink.

**Q23. How do you compute softmax without overflow?**

Subtract the maximum score from every score before exponentiating. The result is mathematically identical, because the common factor cancels, and the largest exponent becomes $e^0 = 1$.

**Q24. Can attention create new features?**

No. Softmax weights are positive and sum to one, so the output is a convex combination of value vectors and lies inside their convex hull. New features come from the projections and the MLP.

**Q25. Why add $-\infty$ for the causal mask rather than zeroing weights after softmax?**

Adding $-\infty$ before softmax gives exactly zero weight to masked keys and renormalizes over visible ones. Zeroing after softmax leaves rows summing to less than one and lets future scores influence the denominator, which leaks information.

**Q26. What is teacher forcing?**

During training each position is given the true previous tokens from the data rather than the model's own predictions, so all positions can be trained in parallel. The mismatch with generation, where the model consumes its own outputs, is called exposure bias.

**Q27. How would you test that a causal mask is correct?**

Change only the last token and check that the outputs at every earlier position are bit-for-bit identical. Any change upstream means information leaks from the future.

**Q28. Why use multiple heads?**

One head yields one weight distribution per token and must split it among competing needs, blurring them together. Several narrower heads can each attend for a different reason, and the output projection recombines them.

**Q29. Do more heads mean more parameters?**

No. With $d_{\text{head}} = d_{\text{model}} / H$, the four projections stay $d_{\text{model}} \times d_{\text{model}}$; heads just slice them. More heads means more $T \times T$ attention maps and narrower heads.

**Q30. Name some patterns attention heads learn.**

Previous-token heads, coreference heads that link pronouns to antecedents, attention sinks that park weight on the first token, broad averaging heads, and induction heads that copy continuations of earlier patterns.

**Q31. What are MQA and GQA?**

Multi-query attention shares one key/value head across all query heads; grouped-query attention shares each key/value head across a group. Both shrink the KV cache in proportion to the number of key/value heads, with GQA losing much less quality than MQA.

### Cost and inference

**Q32. Why is attention quadratic?**

Every query is scored against every key, giving a $T \times T$ grid per head per layer. Doubling the context quadruples the scores, and going from 4k to 128k multiplies them by 1,024.

**Q33. When does attention dominate compute?**

Per token per layer, projections and MLP cost about $24d^2$ FLOPs and attention about $4Td$, so attention arithmetic dominates beyond roughly $T = 6d$: about 24k tokens for $d = 4096$. At short lengths the matrix multiplies dominate.

**Q34. What does FlashAttention do?**

It computes exact attention in tiles held in fast on-chip memory, using online softmax to keep running maxima and sums, so the full score matrix is never written to main memory. Same result, far less memory traffic.

**Q35. Explain online softmax.**

Process scores in chunks while keeping a running maximum $m$ and running sum $\ell$ of exponentials relative to it. When a larger maximum arrives, rescale $\ell$ (and the running output) by $e^{m_{\text{old}} - m_{\text{new}}}$ before adding the new terms. The final result equals the one-shot softmax.

**Q36. What is the KV cache and why does it work?**

During generation, keys and values of past tokens are stored per layer and reused, so each step computes only the new token's projections. It works because the causal mask guarantees past keys and values never change.

**Q37. Why not cache queries?**

An old query is used once, to compute its own position's output, and never again. Every future query needs all past keys and values.

**Q38. How big is a KV cache?**

$2 \times \text{layers} \times H_{kv} \times d_{\text{head}} \times \text{tokens} \times \text{batch} \times \text{bytes}$. For a Llama 3 8B-sized model that is 128 KiB per token in 16-bit, so 16 GiB for a 128k-token sequence.

**Q39. Why is decoding memory-bound?**

Each decode step pushes one token through every layer, reading every weight and the whole cache from memory to do very little arithmetic. Prefill reuses each weight for many tokens and is compute-bound.

### Blocks and training

**Q40. Why does a Transformer need both attention and an MLP?**

Attention routes information between positions but only averages values; the MLP transforms each position nonlinearly and holds most parameters. Blocks alternate sharing and processing.

**Q41. What does the residual connection buy you?**

An identity path: each sub-layer adds a correction instead of replacing its input, so useless layers can do nothing and gradients flow straight down the stream, which makes deep networks trainable.

**Q42. Pre-norm or post-norm, and why?**

Pre-norm, normalizing the input of each sub-layer, keeps the residual stream uninterrupted and trains stably at depth without delicate warmup. It needs a final norm before the output head.

**Q43. What does LayerNorm do?**

Per token, it subtracts the mean, divides by the standard deviation (plus a small epsilon), and applies learned per-channel gain and shift. It keeps activations at a steady scale across layers.

**Q44. What does temperature do?**

Logits are divided by $\tau$ before softmax. $\tau < 1$ sharpens the distribution toward the top token; $\tau > 1$ flattens it; $\tau \to 0$ is greedy decoding.

**Q45. What is the cross-entropy loss and its expected starting value?**

$-\ln p(\text{correct token})$ averaged over positions. At initialization predictions are near uniform, so the loss is near $\ln V$, 10.37 for $V = 32{,}000$.

**Q46. Why Adam rather than plain SGD?**

Adam keeps per-parameter running averages of the gradient and its square and steps by their ratio, adapting the step size to each weight's typical gradient scale. That damps zig-zagging in narrow valleys; AdamW adds decoupled weight decay.

**Q47. Walk me through a decoder-only Transformer, end to end.**

Text is tokenized with byte-level BPE into ids; ids index an embedding table; positions are added or applied as RoPE inside attention. Each of $N$ pre-norm blocks adds multi-head causal attention and then an MLP to the residual stream. A final norm and the (often tied) LM head produce logits; softmax with temperature gives next-token probabilities. Training minimizes cross-entropy with AdamW, warmup and cosine decay, and gradient clipping; inference uses a KV cache.

**Q48. What changed between the 2017 Transformer and a 2019 GPT-2 block?**

Decoder-only instead of encoder-decoder, so no cross-attention; pre-norm instead of post-norm, with a final LayerNorm; learned positions instead of sinusoidal; GELU instead of ReLU; byte-level BPE; and residual-branch initialization scaled by $1/\sqrt{N_{\text{res}}}$. Day 2 covers the changes from GPT-2 to Llama 3.

@chapter exercises | Exercises | Thirty-five problems in the order of the chapter. ● is quick arithmetic, ●● is multi-step or an explanation, ●●● is a derivation, a proof or code. Every answer is worked in the next section.

### Parts I to III

**E1** ● How many bytes does the two-character string *日本* take in UTF-8?

**E2** ●● Using the six merges learned in Section 5, encode *bandana* and *banda*. Give the final tokens and ids.

**E3** ●● Model A has loss 2.8 nats per token at 3.6 bytes per token. Model B has loss 2.5 nats per token at 3.0 bytes per token. Compute both perplexities and both bits per byte. Which model is better?

**E4** ●● Explain to a friend, without equations, why *␠the* and *the* are different tokens and why that can change a model's answer.

**E5** ● How many parameters does GPT-2's embedding table have ($V = 50{,}257$, $d = 768$)?

**E6** ●● Compute the cosine similarity of $[1, 2, 2]$ and $[2, 1, 2]$.

**E7** ●● Explain why only the embedding rows for tokens in the current batch receive gradient updates.

**E8** ● How many parameters would Finch-19's learned position table have if the context were raised to 2,048?

**E9** ●● Explain, without equations, why attention cannot distinguish "dog bites man" from "man bites dog" without position information.

### Parts IV and V

**E10** ●● For a toy model with $d = 8$ and base 10,000, write the full sinusoidal position vector for position 3, to three decimal places.

**E11** ●●● Prove that $\text{PE}(p) \cdot \text{PE}(p + k) = \sum_i \cos(k\,\omega_i)$.

**E12** ● What is the wavelength of the slowest pair for $d = 512$ with base 500,000?

**E13** ●● Rotate the pair $(0.6, 0.8)$ for a token at position $m = 3$ with $\theta = 0.5$. Check that the length is unchanged.

**E14** ●●● Show that for 2D rotation matrices $R(a)^\top R(b) = R(b - a)$, and use it to prove RoPE's relative-position property.

**E15** ● A RoPE model trained on 4,096 tokens must run on 32,768. What position-interpolation factor do you use, and what happens to the gap between adjacent positions?

### Parts VI to IX

**E16** ●● A query $q = [1, 0, 1]$ attends to keys $k_1 = [1, 1, 0]$, $k_2 = [0, 1, 1]$, $k_3 = [1, 0, 1]$. Compute the unscaled scores and the softmax weights.

**E17** ● How many parameters do GPT-2 small's Q, K and V projections hold in one layer, including biases ($d = 768$)?

**E18** ●● Redo E16 with the $\sqrt{d_k}$ scaling.

**E19** ● What is the typical standard deviation of raw attention scores for $d_k = 128$ with unit-variance components?

**E20** ●● Compute the softmax of $[500, 502, 499]$ in a numerically safe way.

**E21** ●● Write the $4 \times 4$ causal mask. How many query-key pairs are allowed for $T = 1{,}024$?

**E22** ●●● Write a function `causal_attention(q, k, v)` in PyTorch for tensors of shape `(B, H, T, d)`, without using built-in attention.

**E23** ● A model has $d_{\text{model}} = 1{,}024$ and 16 heads. What is the head size, and how many weights do its four attention projections hold?

### Parts X to XIII

**E24** ●● How much memory do one layer's full score grids take for 16 heads at $T = 16{,}384$ in 16-bit?

**E25** ● At what context length does attention arithmetic overtake the linear layers for $d = 2{,}048$?

**E26** ●● Compute the KV cache per token, and for 32,768 tokens, for a model with 24 layers, 8 key/value heads of size 128, in 16-bit.

**E27** ● How many key/value computations per layer does generating 2,000 tokens take with and without a cache?

**E28** ●● Apply LayerNorm (no gain or shift, ignore epsilon) to $[1, 3, 5, 7]$.

**E29** ●●● Count every parameter of a model built like Finch-19 but with $d_{\text{model}} = 768$, 12 layers, $d_{\text{ff}} = 3{,}072$, $V = 32{,}000$, context 1,024, tied embeddings, biases and LayerNorm.

**E30** ●● Compute next-token probabilities for logits $[3, 1, 0]$ at temperature 1 and at temperature 0.5.

**E31** ● What should the starting loss be for an untrained model with Llama 3's vocabulary of 128,256?

**E32** ●● Clip the gradient $[6, 8]$ to a maximum norm of 2.

**E33** ●● Run three steps of gradient descent on $(w - 3)^2$ from $w = 0$ with learning rate 0.25.

**E34** ●● Roughly how much memory do weights, gradients and both Adam moments take in 32-bit for an 8.03-billion-parameter model?

**E35** ●●● Explain why two training runs with the same seed on the same GPU can produce different loss curves, and how to prevent it.

@chapter solutions | Solutions | Worked answers to every exercise. Where a number appears, it was computed, not estimated.

**E1.** Each of the two characters is a CJK character, which UTF-8 stores in 3 bytes, so the string takes 6 bytes.

**E2.** *bandana* starts as 7 bytes. Merge 256 (*a + n*) gives *b an d an a*; 257 (*b + an*) gives *ban d an a*; 258 (*an + a*) gives *ban d ana*; 259 (*ban + d*) gives *band ana*; 260 finds no *ban + ana*; 261 (*band + ana*) gives *bandana*. One token, id 261. *banda* goes *b an d a*, then *ban d a*, then 258 finds no *an + a*, then *band a*: tokens *band* and *a*, ids 259 and 97.

**E3.** A: perplexity $e^{2.8} = 16.44$, bits per byte $2.8 / 0.6931 / 3.6 = 1.122$. B: perplexity $e^{2.5} = 12.18$, bits per byte $2.5 / 0.6931 / 3.0 = 1.202$. B looks better per token only because its tokens are shorter; A spends fewer bits per byte of real text, so A is the better model.

**E4.** The tokenizer first splits text into chunks and glues each space onto the front of the next word, so "the" in the middle of a sentence is really "space-the", a different chunk from "the" at the start. Different chunks get different merges and different ids, so the model sees two unrelated tokens. A stray trailing space changes which token comes last, and therefore what the model predicts next.

**E5.** $50{,}257 \times 768 = 38{,}597{,}376$.

**E6.** Dot product $2 + 2 + 4 = 8$. Both lengths are $\sqrt{1 + 4 + 4} = 3$. Cosine $8 / 9 = 0.889$.

**E7.** A lookup equals multiplying a one-hot vector by the table. The gradient of the loss with respect to the table is the one-hot vector (transposed) times the gradient arriving at the looked-up row, so every row whose one-hot entry is zero gets a zero gradient. Only rows for tokens present in the batch change.

**E8.** $2{,}048 \times 512 = 1{,}048{,}576$, double the current 524,288.

**E9.** Attention decides how much one word listens to another only by comparing what the two words are. Nothing in that comparison says where either word sits. Swap the words around and every word still finds the same partners with the same strengths, so it produces the same output, just in a different slot. Who bit whom is invisible.

**E10.** Frequencies are $10000^{-2i/8}$: 1, 0.1, 0.01, 0.001. The vector is $[\sin 3, \cos 3, \sin 0.3, \cos 0.3, \sin 0.03, \cos 0.03, \sin 0.003, \cos 0.003] = [0.141, -0.990, 0.296, 0.955, 0.030, 1.000, 0.003, 1.000]$.

**E11.** For one pair, the contribution is $\sin(p\omega)\sin((p+k)\omega) + \cos(p\omega)\cos((p+k)\omega)$. By the identity $\cos(A - B) = \cos A \cos B + \sin A \sin B$ with $A = (p+k)\omega$ and $B = p\omega$, this equals $\cos(k\omega)$. Summing over pairs gives $\sum_i \cos(k\omega_i)$, with no $p$.

**E12.** $2\pi \times 500{,}000^{510/512} \approx 2{,}984{,}615$ tokens, about 49 times the base-10,000 value.

**E13.** The angle is $3 \times 0.5 = 1.5$ rad, with $\cos 1.5 = 0.0707$ and $\sin 1.5 = 0.9975$. New pair: $(0.6 \times 0.0707 - 0.8 \times 0.9975,\ 0.6 \times 0.9975 + 0.8 \times 0.0707) = (-0.756, 0.655)$. Length before $\sqrt{0.36 + 0.64} = 1$; after $\sqrt{0.571 + 0.429} = 1.000$.

**E14.** $R(a)^\top = R(-a)$, because the transpose flips the sign of the sine terms, and rotations compose by adding angles, so $R(-a) R(b) = R(b - a)$. Then $(R(m\theta) q)^\top (R(n\theta) k) = q^\top R(m\theta)^\top R(n\theta) k = q^\top R((n - m)\theta) k$. Applied pair by pair with each pair's own $\theta_i$, the full RoPE score depends only on $n - m$.

**E15.** Factor $32{,}768 / 4{,}096 = 8$: position $m$ is rotated as $m / 8$. Adjacent tokens now differ by one eighth of a step, which the model has never seen, so a short fine-tune on long text is needed.

**E16.** Scores: $q \cdot k_1 = 1$, $q \cdot k_2 = 1$, $q \cdot k_3 = 2$. Exponentials $2.718, 2.718, 7.389$, sum 12.826. Weights $0.212, 0.212, 0.576$.

**E17.** $3 \times (768^2 + 768) = 3 \times 590{,}592 = 1{,}771{,}776$.

**E18.** $d_k = 3$, so divide by $\sqrt 3 = 1.732$: scores $0.577, 0.577, 1.155$. Exponentials $1.781, 1.781, 3.173$, sum 6.736. Weights $0.264, 0.264, 0.471$: softer than unscaled, as expected.

**E19.** $\sqrt{128} = 11.31$.

**E20.** Subtract the maximum, 502: $[-2, 0, -3]$. Exponentials $0.135, 1, 0.050$, sum 1.185. Weights $0.114, 0.844, 0.042$.

**E21.** Rows are queries, columns keys:

```text
[  0  -inf -inf -inf ]
[  0    0  -inf -inf ]
[  0    0    0  -inf ]
[  0    0    0    0  ]
```

Allowed pairs for $T = 1{,}024$: $1{,}024 \times 1{,}025 / 2 = 524{,}800$.

**E22.**

```python
import math, torch

def causal_attention(q, k, v):                  # each (B, H, T, d)
    T, d = q.shape[-2], q.shape[-1]
    s = q @ k.transpose(-2, -1) / math.sqrt(d)  # (B, H, T, T)
    mask = torch.triu(torch.ones(T, T, dtype=torch.bool, device=q.device), 1)
    s = s.masked_fill(mask, float('-inf'))      # hide the future
    w = torch.softmax(s, dim=-1)                # rows sum to 1; softmax subtracts the max
    return w @ v                                # (B, H, T, d)
```

**E23.** Head size $1{,}024 / 16 = 64$. Weights $4 \times 1{,}024^2 = 4{,}194{,}304$, independent of the head count.

**E24.** $16 \times 16{,}384^2 \times 2 = 8{,}589{,}934{,}592$ bytes, exactly 8 GiB, for one layer.

**E25.** $T = 6d = 12{,}288$ tokens.

**E26.** Per token $2 \times 24 \times 8 \times 128 \times 2 = 98{,}304$ bytes, 96 KiB. For 32,768 tokens $3{,}221{,}225{,}472$ bytes, exactly 3 GiB.

**E27.** Without a cache $2{,}000 \times 2{,}001 / 2 = 2{,}001{,}000$; with a cache 2,000, about a thousand times fewer.

**E28.** Mean 4; centred $[-3, -1, 1, 3]$; variance $(9 + 1 + 1 + 9)/4 = 5$; standard deviation 2.236. Result $[-1.342, -0.447, 0.447, 1.342]$.

**E29.** Embeddings $32{,}000 \times 768 = 24{,}576{,}000$. Positions $1{,}024 \times 768 = 786{,}432$. Per block: attention $4 \times 768^2 + 4 \times 768 = 2{,}362{,}368$; MLP $2 \times 768 \times 3{,}072 + 3{,}072 + 768 = 4{,}722{,}432$; two LayerNorms $3{,}072$; block total $7{,}087{,}872$; twelve blocks $85{,}054{,}464$. Final LayerNorm $1{,}536$. Total $24{,}576{,}000 + 786{,}432 + 85{,}054{,}464 + 1{,}536 = 110{,}418{,}432$. (This is GPT-2 small with a 32k vocabulary; GPT-2's 50,257-token vocabulary is what takes it to 124M.)

**E30.** $\tau = 1$: exponentials $20.09, 2.718, 1$, sum 23.80, probabilities $0.844, 0.114, 0.042$. $\tau = 0.5$: logits become $[6, 2, 0]$, exponentials $403.4, 7.389, 1$, sum 411.8, probabilities $0.980, 0.018, 0.002$.

**E31.** $\ln 128{,}256 = 11.76$ nats.

**E32.** Norm $\sqrt{36 + 64} = 10$; scale $\min(1, 2/10) = 0.2$; clipped gradient $[1.2, 1.6]$, length 2.

**E33.** Slope $2(w - 3)$. Step 1: $0 - 0.25 \times (-6) = 1.5$. Step 2: $1.5 - 0.25 \times (-3) = 2.25$. Step 3: $2.25 - 0.25 \times (-1.5) = 2.625$. Each step halves the remaining distance to 3.

**E34.** Four 4-byte numbers per parameter: $8.03 \times 10^9 \times 16 \approx 128.5$ GB, before activations. This is why large training runs keep optimizer state sharded across many GPUs.

**E35.** Many GPU kernels sum values from thousands of threads in whatever order they finish, and floating-point addition rounds at each step, so different orders give results that differ in the last bit. Those differences feed into the next step's weights and grow over thousands of steps, so the curves start identical and drift apart. Prevent it with `torch.use_deterministic_algorithms(True)` (and the matching cuDNN and cuBLAS settings), seeded data workers and a fixed data order, accepting some speed cost.

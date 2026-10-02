@part V | RoPE: Rotate, Don't Add | Rotary position embedding takes the clock-hand idea from Part IV and uses it in a smarter place: instead of adding a position vector at the bottom, it rotates the two vectors attention compares, right before the comparison. The result is that the comparison sees only the distance between tokens, which is the relative position we have wanted since Part III. We will rotate one pair by hand, give every pair its own speed, prove that only the gap survives, and see how RoPE stretches to longer texts. | where:5

## 27. Rotate, Don't Add

RoPE stands for **rotary position embedding**. It was introduced in 2021 by Jianlin Su and colleagues in a paper called *RoFormer*, and it is now what nearly every open model uses: Llama, Mistral, Qwen, Gemma, DeepSeek and many more. To explain it we need two words from Part VI a little early. When attention compares two tokens, it does not compare their raw vectors. Each token first makes a **query** vector, written $q$, which says "here is what I am looking for", and a **key** vector, written $k$, which says "here is what I contain". The comparison is a dot product $q \cdot k$, and a bigger dot product means the asking token pays more attention to the other one. That is all you need for now.

Part IV showed that a (sine, cosine) pair is a point on a circle and that moving forward in position is a rotation. RoPE's idea is to skip the "add a position vector" step entirely and apply the rotation *directly to the query and key*, by an angle that depends on each token's position. Take two numbers from the query, treat them as a point on a flat plane, and spin that point around the centre. The further along the sentence the token sits, the further you spin it.

The formula is the school formula for rotating a point by an angle $\phi$:

$$\begin{bmatrix} q'_0 \\ q'_1 \end{bmatrix} = \begin{bmatrix} \cos\phi & -\sin\phi \\ \sin\phi & \cos\phi \end{bmatrix} \begin{bmatrix} q_0 \\ q_1 \end{bmatrix}, \qquad \phi = m\,\theta$$

Read it out loud: the new first number is the old first number times $\cos\phi$ minus the old second number times $\sin\phi$, and the new second number is the old first times $\sin\phi$ plus the old second times $\cos\phi$. The angle $\phi$ is the token's position $m$ times a fixed rotation speed $\theta$ (the Greek letter theta) for this pair.

Take a query pair $q = (1.00, 0.50)$ for a token at position $m = 2$, with a toy speed of $\theta = 0.5$ radians per position. The angle is $\phi = 2 \times 0.5 = 1.0$ radian, and $\cos 1 = 0.540$, $\sin 1 = 0.841$. The new first number is $1.00 \times 0.540 - 0.50 \times 0.841 = 0.12$. The new second number is $1.00 \times 0.841 + 0.50 \times 0.540 = 1.11$. So the rotated pair is $(0.12, 1.11)$.

@fig rope_pair | One query pair rotated by its position. The dashed arrow is the pair before rotation; the orange arrow is the same pair at position 2. Dots mark where it would point at positions 1, 3 and 4. The length never changes, only the direction.

Check the lengths. Before: $\sqrt{1.00^2 + 0.50^2} = 1.118$. After: $\sqrt{0.12^2 + 1.11^2} = 1.118$. A rotation never changes an arrow's length, only its direction. So the "size" of the token's content is untouched, and position is stored purely as an angle. Compare that with adding a position vector, which changes both the length and the direction of the token's vector and mixes position into its content.

## 28. Every Pair Has Its Own Speed

A real query has many pairs, not one. Finch's attention heads are 64 numbers wide, so each query has 32 pairs. RoPE gives each pair its own dial and its own speed, exactly like the clock hands of Part IV:

$$\theta_i = \text{base}^{-2i/d_{\text{head}}}, \qquad i = 0, 1, \dots, \tfrac{d_{\text{head}}}{2} - 1$$

With base 10,000 and a 64-wide head, pair 0 turns at $\theta_0 = 1$ radian per position, pair 8 at 0.1, pair 16 at 0.01, pair 24 at 0.001 and the last pair, 31, at 0.000133. Notice that $d$ here is the *head* size (64), not the model width (512), because RoPE acts inside each head separately.

@fig rope_dials | Four of the 32 pairs for a token at position 5. Pair 0 has turned 5 radians, most of a full turn. Pair 24 has turned only 0.005 radians, which is barely visible.

Fast pairs are good at noticing small gaps such as "the very next word", because one step makes a big difference to their angle. But they wrap around every few positions, so on their own they cannot tell position 1 from position 7. Slow pairs are good at big gaps such as "something a few paragraphs back", because they take tens of thousands of positions to wrap around, but one step barely moves them. With 32 speeds spread geometrically, every gap from 1 to tens of thousands is resolved by some pair. The slowest pair here has a wavelength of $2\pi / 0.000133 \approx 47{,}100$ tokens. The base sets how slow that slowest pair is, which is why long-context models raise it.

:::story Picture this
Picture two runners on a set of circular tracks of different sizes, one track per pair. Every second, each runner moves one step forward on every track at once. On the small tracks they lap constantly; on the huge tracks they creep. If you only ever look at *how far apart the two runners are* on each track, you learn how many seconds apart they started, and nothing about when the race began. That is what a RoPE dot product sees.
:::

## 29. The Trick: Only the Gap Survives

Rotate the query by its position $m$ and the key by its position $n$, then take their dot product. Using $R(\phi)$ for "rotate by angle $\phi$", the result can be rewritten as:

$$\big(R(m\theta)\,q\big) \cdot \big(R(n\theta)\,k\big) = q \cdot \big(R((n - m)\theta)\,k\big)$$

Read the right-hand side: it is the dot product of the *unrotated* query with the key rotated by the *difference* of the positions. The absolute positions $m$ and $n$ have disappeared; only $n - m$, the distance between the two tokens, remains. The reason is the same as Part IV's clock hands. Rotating both arrows by the same extra amount does not change the angle between them, and the dot product of two arrows depends only on their lengths and the angle between them.

To check with numbers, keep $q = (1.00, 0.50)$ and take a key pair $k = (0.80, -0.60)$, with $\theta = 0.5$. Put the query at position 2 and the key at position 5, a gap of 3. Rotating and taking the dot product gives 1.0329. Now move both tokens ten places later, to positions 12 and 15. The score is again 1.0329, identical to four decimal places. Move them to 0 and 3: still 1.0329. Change the gap to 1 (positions 2 and 3) and the score changes to 0.9182. Without any rotation the score would be 0.5000, so the rotation genuinely reshapes the score, but in a way that depends only on the gap.

@fig rope_shift | Shifting both tokens by ten positions. Both arrows turn by the same extra angle, so the angle between them, and therefore the score, is unchanged at 1.0329.

This is the relative position property, delivered exactly and for free. "Two words apart" scores the same on page 1 and on page 300. The model learns "a pronoun often looks a few tokens back" once, and it applies everywhere.

:::interview Interview lens
**"How does RoPE encode relative position if it rotates by absolute position?"** Each token's query and key are rotated by an angle proportional to its own absolute position, but attention only ever uses dot products between a query and a key. The dot product of two rotated vectors equals the dot product of the original query with the key rotated by the position difference, $\langle R_m q, R_n k\rangle = \langle q, R_{n-m} k\rangle$, so the score depends only on $n - m$. You get absolute-position bookkeeping with relative-position behaviour, no parameters, and no change to vector lengths.
:::

## 30. Where RoPE Sits in Attention

Where exactly does the rotation happen? Part VI builds attention properly, but the outline is short. Each token's vector $x$ is multiplied by three learned matrices to produce its query $q$, its key $k$ and its **value** $v$, the content it will hand over if another token attends to it. RoPE rotates $q$ by the query token's position $m$ and $k$ by the key token's position $n$. Then the rotated queries and keys are compared, the scores pass through softmax (Part VII) to become weights, and the weights blend the values.

@fig rope_where | RoPE inside attention. The query and key are rotated after their projections and right before the dot product. The value is never rotated, so the content passed between tokens does not depend on position.

Notice that $v$ is not rotated. The rotation exists only to shape the scores, that is, to decide *who listens to whom*. The content that actually gets passed along stays untouched. Notice also that the token vectors $x$ flowing up the model are never modified by RoPE. Position lives only inside the attention comparison, which is exactly why RoPE avoids the "what and where share the same lanes" tax of Parts III and IV. And because the rotation happens in every attention layer, every layer gets fresh, exact position information rather than relying on a signal added once at the bottom and gradually blurred.

### The rotation as one matrix

If you want to write the whole rotation as one matrix for a 64-wide head, it is a $64 \times 64$ grid that is almost entirely zeros, with small $2 \times 2$ rotation blocks down the diagonal. Each block rotates one pair and leaves every other pair alone. For a 64-wide head that is 32 blocks, and 3,968 of the 4,096 entries are zero.

@fig rope_matrix | The rotation for position m written as a matrix, for a toy 8-wide head. Each orange block rotates one pair by its own angle; everything off the blocks is zero.

Real code never builds that matrix, because multiplying by thousands of zeros is wasted work. It multiplies by precomputed tables of $\cos(m\theta_i)$ and $\sin(m\theta_i)$ directly, using a little helper called `rotate_half`, which Unit II walks through line by line. The answer is identical.

## 31. Far-Apart Tokens Get a Weaker Pull

RoPE has a pleasant side effect. Imagine a query and a key with exactly the same content, so that without rotation their score would be as high as possible. As the distance between them grows, the fast pairs end up pointing in all sorts of directions relative to each other, and their contributions to the dot product partly cancel out. The slow pairs still agree, but there are fewer of them.

Averaging over the 32 pairs of a 64-wide head with base 10,000, the score as a fraction of its maximum is 0.97 at a distance of 1, 0.61 at a distance of 16 and 0.28 at a distance of 128. The curve wobbles, because some fast pairs swing back into agreement at certain distances, but it trends downward. All else being equal, RoPE gives far-away tokens a somewhat weaker pull than nearby ones.

@fig rope_decay | The average score of two identical vectors under RoPE as their distance grows. It starts at the maximum, wobbles, and drifts down.

That is a sensible default for language, where nearby words usually matter more, and the model can still overcome it: a query and key with strongly matching content in the slow pairs can attend across thousands of tokens. The RoFormer paper called this **long-term decay**.

## 32. Beyond the Training Length

What happens when you want a model to read longer texts than it was trained on? Suppose a RoPE model was trained on 1,024 tokens. Look at its slowest pair, which turns 0.000133 radians per position. During training, that pair only ever saw angles between 0 and $1{,}023 \times 0.000133 = 0.136$ radians. Run the model on 4,096 tokens and the same pair reaches 0.546 radians, four times further round than anything training showed it. The fast pairs are fine, because they wrapped around thousands of times during training and have seen every angle, but the slow pairs swing into territory the model never learned to interpret. That is when quality collapses.

RoPE has a neat escape hatch. **Position interpolation**, published by Shouyuan Chen and colleagues at Meta in 2023, divides every position by the stretch factor before rotating. To go from 1,024 to 4,096 tokens, divide by 4: position 4,095 is rotated as if it were 1,023.75, giving 0.1365 radians, right back inside the familiar range. Nearby tokens now differ by a quarter of a step instead of a full step, which the model has also never seen, so it needs a short round of extra training on long texts to adjust. In the paper, about a thousand training steps were enough to extend Llama models from 2,048 to 32,768 tokens.

@fig rope_pi | The angles the slowest pair sees. Training covered 0 to 0.136 radians. Running on four times the length pushes it to 0.546, unseen territory; dividing positions by four squeezes it back inside.

Interpolation slows every pair down equally, including the fast ones that did not need it, which blurs their fine view of nearby words. Better methods, NTK-aware scaling and YaRN, slow the pairs unevenly, leaving fast pairs nearly alone and stretching the slow ones the most. Unit II compares them in detail.

| | Learned (Part III) | Sinusoidal (Part IV) | RoPE (Part V) |
|---|---|---|---|
| Acts on | the input, once | the input, once | $q$ and $k$, in every layer |
| Parameters | $T_{\max} \times d_{\text{model}}$ | none | none |
| Relative position | learned indirectly | implicit, blurred by adding | exact, by construction |
| Mixes into content? | yes | yes | no ($v$ and $x$ untouched) |
| Longer than training | impossible without new rows | computable, untrained | stretch with interpolation plus short training |

That last row, plus the exact relative behaviour and zero parameters, is why RoPE won.

### Sharp edges of RoPE

**Never rotate v.** Only queries and keys get rotated. If the values are rotated too, the content passed between tokens depends on absolute position, and output quality drops in confusing ways. If outputs drift with absolute position, check this first.

**Which numbers form a pair?** Some code pairs neighbours (entry 0 with entry 1, 2 with 3). Other code pairs the first half of the head with the second half (entry 0 with entry 32 in a 64-wide head). Both train equally well, but weights trained one way give garbage in code written the other way. Unit II shows the conversion.

**Rotated keys in the cache.** During generation (Part XI), old keys are stored already rotated. The new token must be rotated by its true position, which is the number of tokens already stored, not 0.

**Partial rotary.** Some models, such as GPT-NeoX and Phi, rotate only part of each head and leave the rest alone. Rotating the whole head breaks them. Read the config's rotary fraction before porting.

**Precision of the angles.** Angles get large at long positions. Computing $\cos$ and $\sin$ in 16-bit precision loses accuracy exactly where you need it. Precompute the tables in 32-bit.

:::warn Watch out
A very common interview slip is to say RoPE "adds a rotation to the embeddings". It does not touch the embeddings, the residual stream, or the values. It rotates the query and key vectors inside each attention layer, after their projections and before the dot product. Say that precisely and you have shown you know where it lives in the code.
:::

:::key In one breath
RoPE rotates each pair of a query and a key by an angle equal to the token's position times that pair's speed, $\theta_i = \text{base}^{-2i/d_{\text{head}}}$, after the $q$ and $k$ projections and before the dot product; values and the residual stream are never touched. Because $\langle R_m q, R_n k\rangle = \langle q, R_{n-m} k\rangle$, the score depends only on the distance $n - m$: exact relative position with no parameters and no change in length (1.0329 at a gap of 3, wherever the pair sits). Scores of matching content decay gently with distance, and contexts can be stretched by interpolating positions ($m / s$) plus brief long-text training, which is why RoPE replaced learned and sinusoidal positions.
:::

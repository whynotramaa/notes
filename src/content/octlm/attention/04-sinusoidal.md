@part IV | Sinusoidal Positions: A Ruler Made of Waves | Instead of learning a position table, the 2017 Transformer computed every position's vector from sine and cosine waves of many speeds, so there is no table to run out of. This part builds that formula from a picture of clock hands, shows why the waves are spaced like rungs on a ladder, and proves the property that makes it clever: comparing two positions only depends on the gap between them. That property is the seed of RoPE. | where:4

## 21. A Ruler Made of Waves

Part III ended with two complaints about the learned table: it stops dead at its last row, and it treats every position as unrelated to its neighbours. In 2017, the paper that introduced the Transformer, *Attention Is All You Need* by Ashish Vaswani and colleagues at Google, took a different route. Instead of learning position vectors, it *calculated* them with a formula. A formula can be evaluated at any position, so there is no table to run out of, and a well-chosen formula can build the relationship between neighbours in from the start.

The formula uses sine and cosine waves, the smooth up-and-down curves from school trigonometry. If those feel rusty, here is all you need. A sine wave rises from 0 to 1, falls through 0 to $-1$, and comes back, forever, always between $-1$ and 1. The cosine wave is the same shape shifted by a quarter turn. How fast a wave wiggles is set by its **frequency**, written $\omega$ (the Greek letter omega). A wave with $\omega = 1$ wiggles quickly; a wave with $\omega = 0.001$ crawls.

Give each pair of numbers in the position vector its own wave, from very fast to very slow, and to get the vector for position $p$, read off the height of every wave at the point $p$.

$$\text{PE}(p, 2i) = \sin(p \cdot \omega_i) \qquad \text{PE}(p, 2i+1) = \cos(p \cdot \omega_i) \qquad \omega_i = \frac{1}{10000^{2i/d}}$$

Read it slowly. $\text{PE}(p, j)$ means "entry number $j$ of the position vector for position $p$". The entries come in pairs: entry $2i$ (an even number) holds the sine of the $i$-th wave and entry $2i + 1$ (the odd number right after it) holds its cosine. $d$ is the model width, so there are $d/2$ pairs and $d/2$ waves. The frequency of wave $i$ is $\omega_i = 1/10000^{2i/d}$. For pair 0 that is $1/10000^0 = 1$, the fastest wave. For the last pair it is close to $1/10000$, the slowest. Each pair in between is a fixed factor slower than the one before.

@fig sin_lanes | Reading a position off the waves. Each lane is one wave pair (only the sine is drawn). The dashed line at position 7 crosses every wave; the heights read top to bottom become the position's vector. Fast waves change a lot between neighbours; slow waves barely move.

Let us read position 7 off a toy model with $d = 16$, so 8 waves with frequencies 1, 0.316, 0.1, 0.0316 and so on, each about 3.16 times slower than the last. The sine entries are $\sin(7 \times 1) = 0.657$, $\sin(7 \times 0.316) = 0.800$, $\sin(7 \times 0.1) = 0.644$, $\sin(7 \times 0.0316) = 0.220$, and then 0.070, 0.022, 0.007, 0.002 for the slow waves, which have barely started rising. Every position gets a different list, because no two positions hit all the waves at exactly the same heights.

The position vector is then added to the token vector, exactly as in Part III: $x_p = E[\text{id}_p] + \text{PE}(p)$. The only change is where the second vector comes from.

## 22. The Famous Heatmap

If you search for "positional encoding" you will meet one picture over and over. It comes from drawing many position vectors as rows of coloured cells, one row per position and one column per dimension, with colour showing the value (orange for positive, blue for negative).

@fig sin_heatmap | Sinusoidal position vectors for positions 0 to 47 in a 64-dimensional model. Columns on the left come from fast waves and flip colour within a few rows; columns on the right come from slow waves and hardly change. The outlined row is position 20.

The left side flickers because those columns come from fast waves: going down one row moves the wave by a whole radian, which is enough to change its sign within a few positions. The right side looks like solid stripes because those waves are so slow that across 48 positions they barely move. Read any single row and you have one position's vector, the same kind of strip you read off the waves in Section 21. The fast columns tell nearby positions apart. The slow columns tell distant positions apart. Together they give every position a unique fingerprint.

## 23. Clock Hands and Binary Counting

Treat each (sine, cosine) pair as the tip of a clock hand. The cosine is how far the tip is to the right of the centre and the sine is how far it is up, so the pair always sits on a circle of radius 1. Every time the position goes up by one, hand $i$ turns by $\omega_i$ radians. (A radian is a unit of angle; a full turn is $2\pi \approx 6.283$ radians.) The first hand spins fast, a whole radian per step. The fourth hand turns only 0.032 radians per step and needs about 200 steps to go once around.

@fig clock_binary | Position 7 on four clock hands. Each hand turns by its own frequency per step, so at position 7 hand 0 has turned 7 radians (a little more than one full turn) while hand 3 has turned only 0.22. The binary counter below works on the same principle with on/off digits.

Now compare it with counting in binary, the base-2 counting computers use. In binary, 7 is written `0111`. The last digit flips on every step, the next one every two steps, the next every four, and the first every eight. Fast digits track small changes; slow digits track big ones; together they pin down any number. The clock hands do exactly the same job, but smoothly. Instead of jumping between 0 and 1, each hand glides around its circle. That smoothness matters, because a neural network learns more easily from quantities that change gradually.

:::story Picture this
Think of the clock on a wall. The second hand tells you about the last minute in great detail but loops every 60 seconds, so on its own it cannot tell 3:00 from 3:01. The hour hand moves so slowly it is useless for seconds but tells you the time of day. Read all three hands together and you know the exact time. A sinusoidal position vector is a clock with 256 hands, for Finch-sized models, each turning at its own speed.
:::

## 24. Why Waves, and Why These Speeds?

Why not just use the plain number, 0, 1, 2, 3, as the position? Two reasons. First, scale: by position 1,000 the number would be enormous compared to the token vector's entries, which are around 1, and it would swamp the meaning. Waves always stay between $-1$ and 1. Second, information: a single number gives the network one dimension to work with, and comparing two positions would require the network to learn subtraction. Waves spread position across many dimensions and, as the next section shows, make comparison almost free.

### The geometric ladder

The frequencies are not arbitrary. Each wave is a constant factor slower than the one before, so the **wavelengths** (how many positions one full cycle takes, $\lambda_i = 2\pi / \omega_i$) form a geometric ladder. For $d = 512$ with base 10,000, the fastest wave repeats every $2\pi \approx 6.3$ positions and the slowest every $2\pi \times 10000^{510/512} \approx 60{,}611$ positions. In between, every 32 pairs the wavelength grows by a factor of $10000^{64/512} = 10^{0.5} \approx 3.16$.

@fig wavelength_ladder | Wavelengths of the 256 wave pairs in a 512-wide model, sampled every 32 pairs, on a log scale. They run from 6.3 tokens to about 60,600 tokens in even multiplicative steps.

That range is the point. Some waves resolve "the word right next to me" and others resolve "something thousands of words back". The number 10,000 is called the **base**, and it sets how slow the slowest wave is. There is nothing magic about it. Models that need very long contexts raise it so the slowest waves stretch further; Unit II shows Llama 3 using 500,000 for exactly that reason.

## 25. The Dot Product Only Cares About Distance

Now the property that makes sinusoidal positions clever. Take two positions, $p$ and $p + k$, and compute the dot product of their position vectors (multiply matching entries, add them up, as in Section 12). For one wave pair the contribution is $\sin(p\omega)\sin((p+k)\omega) + \cos(p\omega)\cos((p+k)\omega)$. There is a trigonometry identity, the cosine of a difference, that says this equals $\cos(k\omega)$. The starting position $p$ has cancelled out completely. Summing over all pairs:

$$\text{PE}(p) \cdot \text{PE}(p + k) = \sum_{i=0}^{d/2 - 1} \cos(k \, \omega_i)$$

Look for $p$ on the right-hand side. It is not there. The similarity between two positions depends only on the gap $k$, never on where you start. "Two words apart" produces the same similarity at the start of a text and deep inside it.

Let us put numbers on it for $d = 512$. With $k = 0$ every cosine is 1, so the sum is 256. Dividing by 256 to make it a fraction: a gap of 1 gives 0.97, a gap of 10 gives 0.68, a gap of 50 gives 0.51, and a gap of 500 gives 0.26. Similarity falls smoothly as positions get further apart, which is exactly the "nearby positions look alike" pattern that the learned table of Section 18 had to discover by itself. Here it is built in.

@fig sin_dot | Similarity between the position vectors of p and p + k, divided by its maximum. It peaks at k = 0 and falls smoothly with distance, and the curve is identical whatever p you start from.

### A shift is a rotation

Why does $p$ cancel? Go back to the clock picture. Moving forward $k$ positions turns hand $i$ by $k\omega_i$, whatever angle it started at. So the angle *between* the hand at position $p$ and the hand at position $p + k$ is always $k\omega_i$. Spin both hands forward together and the angle between them does not change. The dot product of two unit arrows is the cosine of the angle between them, so it does not change either.

@fig shift_rotation | One wave pair as a point on a circle. Moving three positions turns the point by the same angle whether you start at position 2 or position 10. The arrows move; the gap between them does not.

This picture leads to Part V. "Moving forward in position is a rotation" is exactly what RoPE takes and applies in a smarter place. Sinusoidal positions have the rotation property but then throw it partly away by *adding* the position vector to the token vector, which mixes the two and muddies the clean distance-only comparison once the vectors pass through the model's learned weights. RoPE keeps the rotation and never adds.

:::interview Interview lens
**"Why did the original Transformer use sine and cosine for positions?"** Because they give every position a unique, bounded vector without any parameters, they can be computed for any length, and the dot product between two position vectors depends only on their offset: $\text{PE}(p) \cdot \text{PE}(p+k) = \sum_i \cos(k\omega_i)$. Equivalently, shifting position is a rotation of each (sin, cos) pair, which the authors hoped would let the model attend by relative position easily.
:::

## 26. "Works at Any Length" Is Only Half True

Since the formula can be evaluated at any number, sinusoidal positions were often described as working for sequences of any length. Sort of. The model can certainly compute a vector for position 10,000. But if it only ever trained on 1,024 positions, the combinations of wave heights that appear past 1,024 are combinations it has never seen, and every layer has learned to interpret only the ones it saw. In practice, quality degrades past the training length, often quickly. Being able to compute a vector is not the same as understanding it.

@fig extrap_loss | The typical result of running past the training length. Loss is flat inside the trained range and climbs once positions go beyond it. (Illustrative.)

### Sharp edges of sinusoidal positions

**Position and meaning share lanes.** The position wave is added on top of the token's vector, in the same 512 numbers, so every layer has to untangle "what" from "where". The model can do this, but it is a tax. RoPE avoids the mixing entirely.

**Slow lanes are nearly constant, and that is fine.** The slowest waves barely change across a normal text, so those entries are almost the same for every position. They are not wasted: the model can use those dimensions mostly for token meaning.

**Interleaved or split halves.** Some code places sine and cosine side by side (sin, cos, sin, cos, as in the formula). Other code puts all the sines first and all the cosines after. Both are fine, but loading weights trained one way into code written the other way scrambles every position.

**Precision at huge positions.** At position 100,000 the angle for the fastest wave is 100,000 radians. In 16-bit floating point, numbers that large carry very few digits after the decimal point, so the rounding error in the angle is bigger than the wave's whole period and the sine comes out as noise. Compute angles in 32-bit precision and only convert the final sine and cosine.

:::warn Watch out
Do not confuse the **base** (10,000) with the **context length** (1,024 for Finch-19). The base sets the slowest wave's speed; the context length is how far training actually went. Raising the base does not, by itself, teach the model anything about longer texts. It only changes which angles long texts produce. Part V and Unit II show how base changes are combined with extra training to stretch a model.
:::

:::key In one breath
Sinusoidal positions compute $\text{PE}(p, 2i) = \sin(p\,\omega_i)$ and $\text{PE}(p, 2i+1) = \cos(p\,\omega_i)$ with $\omega_i = 10000^{-2i/d}$, a ladder of clock hands from a wavelength of 6.3 tokens to about 60,600 for $d = 512$, and add the result to the token vector. Each (sin, cos) pair is a point on a circle and moving $k$ positions rotates it by $k\omega_i$, so $\text{PE}(p) \cdot \text{PE}(p+k) = \sum_i \cos(k\omega_i)$ depends only on the gap. There are no parameters and no table wall, but positions past the training length are still untrained, and adding mixes position into content, which RoPE fixes by rotating instead of adding.
:::

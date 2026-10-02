@part VI | FlashAttention: Exact Attention That Respects Memory | You would expect attention to be slow because of all the multiplying. Mostly it is not: modern GPUs multiply astonishingly fast. What slows hand-written attention down is moving the score grid in and out of the GPU's main memory. FlashAttention rearranges the work so the grid never leaves the chip's small fast memory, and gets exactly the same answer. This part explains the memory hierarchy that makes it necessary, the tiling and online softmax that make it possible, what it does in the backward pass, and how the three versions differ. | where:6

## 27. The Real Bottleneck: Moving Data

A GPU has a tiny amount of very fast memory and a much larger amount of slower memory. On the NVIDIA A100 used in the FlashAttention paper, each of the chip's 108 streaming multiprocessors has 192 kilobytes of on-chip **SRAM**, about 20 megabytes in total, readable at around 19 terabytes per second. The GPU's main memory, called **HBM** (high-bandwidth memory), is the "40 GB" or "80 GB" on the spec sheet; it is far larger and roughly ten times slower, 1.5 to 2.0 terabytes per second. Beyond that sits the computer's ordinary memory, which is huge and slower again by more than a hundred times.

@fig memory_hierarchy | The memory hierarchy of an A100 GPU. SRAM is tiny and very fast; HBM is large and about ten times slower. Arithmetic happens on the chip, so every number must travel up from HBM first.

Arithmetic only happens on the chip, so every number used must first be read from HBM, and every result kept must be written back. A useful way to think about any operation is to compare how many arithmetic operations it does per byte it moves, called its **arithmetic intensity**. An A100 can do about 312 trillion 16-bit floating-point operations per second on matrix multiplications but move only about 2 trillion bytes per second, so an operation needs to do well over a hundred operations per byte moved to keep the arithmetic units busy. Large matrix multiplications manage that. Softmax, masking and scaling do a handful of operations per number and are entirely limited by memory traffic.

## 28. Standard Attention's Round Trips

Now trace the hand-written attention of Chapter 1 through that hierarchy, for one head with $T$ tokens and head size $d$. $Q$, $K$ and $V$ live in HBM. The GPU reads $Q$ and $K$ onto the chip, computes the score grid $S = QK^\top$, and, because $S$ is far too big to keep on the chip for long sequences, writes it back to HBM: $T^2$ numbers out. Then it reads $S$ back in, computes the softmax $P$, and writes $P$ out: $T^2$ in, $T^2$ out. Then it reads $P$ and $V$ back in and computes the output $O$: another $T^2$ in.

@fig round_trips | Standard attention's memory traffic. The two T × T grids, S and P, each go out to HBM and come back, about 4T² elements of traffic, against only 4Td for the inputs and output.

Count it for Finch-24 at its full context, $T = 4{,}096$ and $d = 64$, per head per layer. The inputs and output are $4Td = 1{,}048{,}576$ numbers. The two grids, each written once and read once, are $4T^2 = 67{,}108{,}864$ numbers, 64 times more. Almost all of the traffic, and therefore almost all of the time, is spent shuffling intermediate results that nobody needs once the output exists. The arithmetic is not the problem.

## 29. Tiles and Online Softmax

FlashAttention, published by Tri Dao, Daniel Fu, Stefano Ermon, Atri Rudra and Christopher Ré in 2022, attacks exactly that traffic. Its idea is never to build the whole score grid. Cut $Q$ into blocks of rows and $K$ and $V$ into blocks of rows too. Load one query block into SRAM and keep it there. Then sweep across the key/value blocks one at a time. For each one, compute that tile of scores, use it immediately to update the output for the query block, and throw it away. When the sweep finishes, the query block's output is complete; write it to HBM once and move on to the next query block.

@fig flash_sweep | FlashAttention's sweep. One query block stays in SRAM while key/value blocks stream past. Only the current tile of scores exists at any moment, plus three running quantities per query row.

The catch is softmax. To normalize a row you need the maximum score and the total of the exponentials across the *whole* row, but the sweep only ever sees one tile of the row at a time. The solution is the **online softmax** of Chapter 1, Section 57, extended to carry the output along. For each query row keep three running quantities: $m$, the largest score seen so far; $\ell$, the running sum of $e^{s - m}$; and $O$, the running sum of $e^{s - m}\,v$. When a new tile arrives with scores $s$ and values $v$:

$$m' = \max(m, \max s) \qquad \ell' = e^{m - m'}\,\ell + \sum e^{s - m'} \qquad O' = e^{m - m'}\,O + \sum e^{s - m'}\,v$$

and at the very end the output is $O / \ell$. Read the update in words: if the new tile contains a bigger maximum, everything accumulated so far was measured against the old maximum and is too large by a factor of $e^{m' - m}$, so shrink it by $e^{m - m'}$; then add the new tile's contributions measured against the new maximum.

### With real numbers

One query, two key blocks of three, with scalar values to keep it readable. Block 1 has scores $[1.0, 2.0, 0.0]$ and values $[10, 20, 30]$. So $m = 2.0$, $\ell = e^{-1} + e^{0} + e^{-2} = 1.5032$ and $O = 0.368 \times 10 + 1 \times 20 + 0.135 \times 30 = 27.739$. If we stopped here the output would be $27.739 / 1.5032 = 18.45$.

Block 2 has scores $[3.0, 0.5, 1.0]$ and values $[40, 50, 60]$. The new maximum is 3.0, so the correction factor is $e^{2 - 3} = 0.3679$. The new terms are $e^{0} = 1$, $e^{-2.5} = 0.0821$ and $e^{-2} = 0.1353$, summing to 1.2174, and their weighted values sum to $40 + 4.104 + 8.120 = 52.224$. So $\ell' = 0.3679 \times 1.5032 + 1.2174 = 1.7704$ and $O' = 0.3679 \times 27.739 + 52.224 = 62.429$. The output is $62.429 / 1.7704 = 35.262$.

Now check it the ordinary way: softmax over all six scores gives weights $[0.0764, 0.2078, 0.0281, 0.5648, 0.0464, 0.0764]$, and the weighted sum of the six values is 35.262. Exactly the same.

@fig online_softmax_full | Online softmax carrying the output, worked by hand. After the second block raises the maximum, the old sum and output are rescaled by e to the power of minus one before the new terms are added. The final answer matches the all-at-once computation.

:::story Picture this
Imagine counting votes in an election where each ballot box reports its tallies in a different currency, and the only fair comparison is against the strongest currency seen so far. Each time a box arrives with a stronger currency, you convert your running total into the new currency with one multiplication and carry on. You never need to keep the individual ballots, only the running total and the current reference currency, and at the end the result is exactly what you would have got by gathering every ballot in one room.
:::

## 30. What It Buys

### Less traffic

Because the score grid never touches HBM, FlashAttention's traffic is dominated by reading $K$ and $V$ once per query block. The paper proves that standard attention needs $\Theta(Td + T^2)$ HBM accesses while FlashAttention needs $\Theta(T^2 d^2 / M)$, where $M$ is the size of SRAM. For typical head sizes of 64 to 128 and SRAM of around 100 kilobytes per processor, $d^2 / M$ is much smaller than 1, so FlashAttention moves many times less data, and the advantage holds at every length. In the paper, that translated into about three times faster training for GPT-2 at sequence length 1,024 and a 15% end-to-end speed-up for BERT-large, a model already optimized heavily.

@fig hbm_traffic | HBM traffic against sequence length on log scales, using the shapes of the paper's bounds with an illustrative SRAM size. Both grow, but FlashAttention sits far below, and the gap depends on the head size.

Memory *use* falls even more dramatically. Standard attention stores the full $T \times T$ grid; FlashAttention stores nothing of size $T^2$, so its extra memory grows only linearly with $T$. That is what made long context windows practical.

### Backward: recompute instead of store

Training also needs a backward pass, which normally uses the softmax grid $P$ saved from the forward pass. For long sequences that grid is enormous: 8 MiB per head at 2,048 tokens, 128 MiB at 8,192, 2 GiB at 32,768, multiplied by heads, layers and batch. FlashAttention does not save it. It saves only one number per query row, the **log-sum-exp** $m + \ln \ell$, which is all you need to rebuild any tile of $P$ exactly. During the backward pass it recomputes the scores tile by tile from $Q$ and $K$, which are saved anyway.

@fig recompute_backward | What the backward pass needs from the forward pass, per head. Standard attention keeps the full T × T grid P; FlashAttention keeps one log-sum-exp number per row and recomputes P's tiles.

That costs extra arithmetic, roughly redoing the forward computation. But arithmetic is cheap and memory traffic is expensive, so the backward pass ends up faster *and* uses a tiny fraction of the memory. "Recompute rather than store" is one of the most useful ideas in GPU programming, and FlashAttention is its best-known example.

### Causal masking for free, at block level

With a causal mask, the upper triangle of the grid is hidden. FlashAttention works on whole tiles, so it can sort them into three kinds. Tiles entirely above the diagonal are skipped completely: no loads, no arithmetic. Tiles entirely below the diagonal need no mask at all. Only tiles that sit on the diagonal need the mask applied cell by cell. With 4 blocks per side, 62.5% of the tiles are computed; with 8, 56.3%; with 16, 53.1%. As the number of blocks grows the computed share approaches one half, so causal attention costs about half of full attention.

@fig causal_blocks | Tiles under a causal mask. Tiles above the diagonal are skipped, tiles below need no mask, and only diagonal tiles are masked. With more blocks, the computed share approaches one half.

:::interview Interview lens
**"Is FlashAttention an approximation? Why is it faster?"** It is exact: the same softmax attention, computed in a different order. It is faster because attention is memory-bound, and FlashAttention tiles $Q$, $K$ and $V$ so each tile of scores is computed, used and discarded in on-chip SRAM, with online softmax (a running max and sum, rescaled when the max grows) to normalize across tiles. The $T \times T$ matrix never touches HBM; in the backward pass it is recomputed from a saved per-row log-sum-exp instead of stored.
:::

## 31. Three Versions

**FlashAttention** (2022) introduced the combination of tiling, online softmax and recomputation in the backward pass. **FlashAttention-2** (Tri Dao, 2023) reorganized how work is divided among the GPU's processors, in particular parallelizing along the sequence dimension so that long sequences with small batches still keep every processor busy, and cut the non-matrix-multiply operations that GPUs run slowly. It is roughly twice as fast as the first version and reaches 50% to 73% of an A100's theoretical peak. **FlashAttention-3** (Jay Shah, Tri Dao and colleagues, 2024) was written for NVIDIA's Hopper generation, such as the H100. It uses Hopper's asynchronous hardware to overlap loading the next tile with computing on the current one, and adds support for 8-bit floating-point (FP8) inputs.

@fig flash_versions | Three versions of FlashAttention, each built on the previous one.

You rarely call FlashAttention directly. PyTorch's SDPA (Part V) dispatches to it automatically when your inputs qualify, and inference engines such as vLLM bundle their own variants. What matters is knowing what it requires and what it guarantees.

## 32. Sharp Edges of FlashAttention

**Exact, not approximate, but not bitwise identical.** It computes the same mathematics in a different order. Floating-point addition rounds at every step, so results can differ in the last few digits from a hand-written version, the same way adding a column of numbers top to bottom and bottom to top can differ. Expect tiny numeric differences, not quality loss.

**16-bit only.** It is built for fp16 and bf16. With 32-bit inputs it will not run, and frameworks fall back quietly to slower code. Run attention under bf16 autocast.

**Head size limits.** The kernels are tuned for particular head sizes, up to 256 in FlashAttention-2. Unusual sizes are unsupported or slower. Keep head size at 64, 128 or 256.

**Nondeterministic backward.** In the backward pass, several processors add into the same gradient numbers in whatever order they finish (Chapter 1, Section 75). Results can vary very slightly between runs. Use the deterministic option when you need bitwise reproducibility, at some speed cost.

**Packed sequences.** When many short texts are packed together, padding each to the longest wastes work. FlashAttention's variable-length interface takes the real lengths, as cumulative offsets, and attends within each sequence only, with no padding at all.

:::warn Watch out
FlashAttention reduces memory *traffic* and *storage* for attention; it does not reduce attention's arithmetic, which is still about $4T^2d$ operations per head per layer (halved under the causal mask). At very long contexts attention is still expensive, just no longer dominated by memory. Saying "FlashAttention makes attention linear" is wrong; its memory is linear in $T$, its compute is still quadratic.
:::

:::key In one breath
Attention is memory-bound: on an A100, SRAM is about 20 MB at 19 TB/s and HBM 40 to 80 GB at 1.5 to 2 TB/s, and standard attention spends most of its time writing and reading the two $T \times T$ grids (64 times the input traffic for Finch-24 at 4,096 tokens). FlashAttention keeps a query block in SRAM, streams key/value tiles past it, and uses online softmax with running $m$, $\ell$ and $O$, rescaled by $e^{m - m'}$ when the maximum grows, to produce the exact result (35.262 in the worked example) without ever storing the grid. The backward pass recomputes tiles from a saved per-row log-sum-exp, causal tiles above the diagonal are skipped (computing about half), and versions 2 and 3 improved GPU utilization and added Hopper and FP8 support; it needs 16-bit inputs and supported head sizes.
:::

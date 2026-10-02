@part III | Keeping a smaller past | This part reduces the number of memory entries for old tokens. A summary can preserve useful context while losing an exact detail the next query needs. We will keep recent states intact, pool historical blocks, compute the storage saving, and test what survives. | where:3

## 9. Compressed attention

The next word depends on a variable declared near the top of a long file, and a short local window has already dropped it. Keeping a smaller representation of old material sits between remembering every token and forgetting it.

### Exact recent context and compressed old context

**Compressed attention** lets queries read a reduced representation of part of their history. Our teaching design keeps exact recent K/V entries and pools old K/V blocks. Part IV instead compresses the feature dimensions of every token.

The recent region keeps the original attention states. The historical region stores fewer entries, each standing for several old positions, and queries attend over both. The decoder must be trained with this memory, or it will expect information that is no longer there.

@fig compressed_history_timeline | Illustrative memory at length 1,024 keeps 256 recent entries and compresses 768 old entries in blocks of 8. The 96 compressed blocks are drawn schematically, not as 96 boxes.

### Block-based compression and pooling old K/V states

**Pooling** combines several vectors into one summary, here their componentwise mean. For block size $b$:

$$
\bar k_j=\frac{1}{b}\sum_{i\in \mathcal B_j}k_i,
\qquad
\bar v_j=\frac{1}{b}\sum_{i\in \mathcal B_j}v_i.
$$

Read this as each compressed key and value is the average over block $\mathcal B_j$ of $b$ positions. Keys `[1,0]` and `[3,2]` pool to `[(1+3)/2,(0+2)/2]=[2,1]`; values `[4,2]` and `[8,6]` pool to `[6,4]`.

@fig pooled_memory_vectors | All entries in this illustrative mean-pooling example are computed. Two positions become one key and one value, so their separate identities are lost.

Pooling does not reproduce attention. For query `[1,0]` with unscaled scores 1 and 3, full attention's first output component is `(exp(1) × 4 + exp(3) × 8)/(exp(1)+exp(3)) = 7.523188`. Attention to the single pooled value returns 6. Averaging before softmax removes the choice between contents, and no block-length bias can restore each original score from the means.

Rae and colleagues' Compressive Transformer (2019) learned compressed memory with auxiliary objectives; our mean pooling isolates one mechanism and does not reproduce it. [Compressive Transformer paper](https://arxiv.org/abs/1911.05507).

## 10. Compressed KV memory

The cache fits at length 1,024 but not at the deployment's larger batch. How much could block compression save, and what must the runtime maintain?

### Recent KV and historical compressed KV

**Compressed KV memory** stores fewer attention states for historical context. The runtime keeps an exact recent buffer and a historical buffer. When a full block leaves the recent region, it is summarized, appended to history, and its exact entries are released.

For $T\ge w$, recent width $w$, and block size $b$, with $T-w$ divisible by $b$:

$$
M=w+\frac{T-w}{b}.
$$

Read this as keep $w$ recent entries plus one summary per $b$ old entries; when $T\le w$, $M=T$. At `T=1,024`, `w=256`, `b=8`, this gives `256 + 768/8 = 352`, a payload smaller by `1,024/352 = 2.909091` at the same feature width.

### Memory reduction and information loss

For Finch KV shapes, batch 2 and 8 layers, the reduced payload is `2 × 8 × 352 × 2 × 2 × 64 × 2 = 1,441,792` bytes, or 1.375 MiB, against 4,194,304 bytes (4 MiB) for all 1,024 tokens. Allocator overhead, positions, temporaries, and compression compute are excluded.

@fig compression_memory_ledger | Computed Finch payloads separate exact recent memory from compressed history. Compression reduces token entries; the width of each stored key and value is unchanged.

At fixed block size, history still grows linearly with length: smaller, not bounded. Recursive compression or dropping old summaries bounds it further but changes the contract again. Block size 1 compresses nothing, and a window covering the whole sequence leaves nothing to compress.

Partial blocks need a rule. Keep their exact states until the block completes, and store boundaries or counts if later logic uses them. A summary may become visible only once all its positions are in the query's past; exposing a precomputed block to a query inside it leaks the future during training.

:::story Picture this
A notebook keeps recent receipts individually and older ones as weekly totals. You can still answer how much was spent that week, but not which receipt held a particular item. A pooled attention state loses detail the same way.
:::

:::warn Watch out
Pooling keys that were already rotated at different positions does not yield one meaningful RoPE position. Specify whether compression acts before rotation, on rotated states, or on a separately trained memory. Position handling is part of the architecture.
:::

## 11. Evaluating long-context compression

A compressed model writes a fluent paragraph about a document but misses one account number buried in it. Fluency alone does not show that memory kept the details the task needed.

### Copy tasks and needle-in-a-haystack tests

A **copy task** asks the model to reproduce an earlier sequence exactly, stressing token identity. A **needle-in-a-haystack test** hides a known fact among unrelated text and asks for it later. Vary length and insertion depth, especially across the recent-to-compressed boundary.

@fig compression_retrieval_probe | A schematic retrieval test moves the same fact between old compressed history and the recent region. The answer stays fixed, so a change in score reflects memory access, not a different question.

In an illustrative probe with 8 cases at each of three depths, hit counts 8, 6, and 4 give 100%, 75%, and 50%. These are scoring fixtures, not Finch results. The overall `18/24=75%` hides the failure the depth breakdown shows.

### Long-range retrieval and compression quality

**Compression quality** is how well the reduced memory keeps the information declared tasks need at a declared budget. Test exact facts, multiple facts, ordering, distractors, dependencies between distant passages, and held-out loss. A summary that keeps the topic may still fail exact copying.

RULER (2024) varies the work the context must support, not just its length. [RULER paper](https://arxiv.org/abs/2404.06654). Liu and colleagues showed that results depend on where the relevant information sits. [Lost in the Middle paper](https://arxiv.org/abs/2307.03172).

Compare full, local-only, and compressed memory on the same queries and generation settings, and report stored bytes, memory-building cost, prefill time, and decode time with accuracy. Block size 4 keeps `256+768/4=448` entries and block size 8 keeps 352; neither count picks the winner without measurements.

:::note Distinguishing two kinds of compression
This part reduces the number of historical token entries. MLA in the next part reduces the features per token and keeps every position. Both can discard information, and their memory formulas count different dimensions.
:::

:::interview Interview lens
**"Why is attention over average keys and values not equivalent to full attention?"** Full attention scores each key separately and softmax picks a weighted mix of values. Mean pooling removes those choices before the nonlinearity, so different histories can share pooled vectors yet need different answers. It saves storage by defining a different computation that needs training and task-level evaluation.
:::

:::key In one breath
Historical compression trades exact old entries for summaries while keeping recent states. Mean-pooled blocks cut the entry count to $w+(T-w)/b$. Softmax over summaries cannot recover full attention, and causality and positions need explicit rules. Test exact retrieval and broader long-context tasks at several depths, with real memory and latency.
:::

<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A decoder can use less memory and still give worse answers. This chapter follows the mechanisms behind architectural changes and the measurements that let you decide whether a change helped.</p>

We begin with the cost of ordinary attention, then study several ways to change it. Some remove connections between tokens. Some summarize old keys and values. One stores a shared latent vector from which many heads derive their memory. Multi-token prediction changes the training signal, while speculative decoding changes the sequence of inference work. These ideas touch different costs and should not be described as interchangeable speed tricks.

The notes keep your topic order as Sections 1 to 28. The orange map shows where each part sits in the investigation. Each mechanism has a small example whose arithmetic can be checked by hand, then a cost calculation on Finch-24. A proposed variant is always identified as a variant. A paper's measured result is attributed to that paper and is not transferred to our teaching model.

Read every comparison with its denominator in view. A latent cache that looks tiny beside full multi-head attention may save much less beside grouped-query attention. A sparse mask can reduce allowed connections while the implementation still runs a dense kernel. A copy test can measure memory of a repeated sequence while saying little about answering a difficult question.

The closing parts turn these distinctions into an experiment. We account for training tokens, compute, seeds, latency, memory, and quality. The OCTLM case study uses its local decision record and config, not a reconstructed story. The skill you should leave with is the ability to read an architecture paper, implement a limited test, and say exactly which conclusion the evidence supports.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Finch-24 under controlled changes

We reuse Finch-24's dimensions so every comparison has a known starting point. Unless a section explicitly changes it, the decoder is causal, uses grouped-query attention, stores keys and values in a 16-bit format, and ties its output projection to its embedding matrix. A byte count in this chapter counts tensor payload only. Allocator padding, page metadata, temporary buffers, model weights, and activations are separate costs.

| Setting | Symbol | Value | Convention |
|---|---|---|---|
| Vocabulary | `V` | 32,000 | Tied output head |
| Model width | `d` | 512 | No projection biases |
| Layers | `L` | 8 | Pre-norm RMSNorm |
| Query and KV heads | `H, H_kv` | 8, 2 | Grouped-query baseline |
| Head width | `d_h` | 64 | Content width in baseline |
| Feed-forward width | `f` | 1,536 | SwiGLU |
| Base parameter count | `P` | 40,509,952 | Recomputed in Python |
| Cache example | `B, T` | 2, 4,096 | Full context |
| Small sequence | `T_small` | 8 | Drawn masks and traces |
| Local example | `w` | 4 | Includes current token |
| Compression example | `T, w, c` | 1,024, 256, 8 | Exact window, block size |
| Illustrative MLA variant | `d_c, d_R` | 64, 16 | Cached latent and position key |
| Illustrative speculation | `k, a` | 4, 0.8 | Draft length and acceptance assumption |

At the full-context cache example, ordinary multi-head attention needs 128 MiB, Finch-24's grouped-query attention needs 32 MiB, and a one-KV-head variant needs 16 MiB. The illustrative MLA variant needs 10 MiB. All four counts use the same batch, context, layer count, and element size; the MLA row changes the representation and requires its own training and quality evaluation.

Historical references are dated designs, not claims about the newest model release. We use Gloeckle and colleagues' 2024 multi-token prediction paper, DeepSeek-V2's 2024 latent-attention design, DeepSeek-V3's 2024 technical report, and Leviathan and colleagues' speculative-decoding algorithm published at ICML in 2023. The formulas and source links appear beside the mechanisms they explain. All illustrative arithmetic is reproducible with `python scripts/unit4-unit5/numbers.py`.

</section>

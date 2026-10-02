<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Chapter 1 built the textbook decoder: learned positions, LayerNorm, a GELU MLP, full multi-head attention written by hand. It works, and it is the right thing to learn first, but nobody builds a large model that way any more. This chapter swaps in the handful of upgrades that turned the 2019 GPT-2 block into the 2024 Llama 3 block, one at a time, until you could read a modern model's code and config file line by line.</p>

Each part takes one upgrade and asks the same questions. What does it replace? What problem did the old part have? How does the new one work, with numbers you can check by hand? What does it cost or save, counted for a real model? And what are the bugs it causes when people build or port models, which are often silent: the model loads, runs and gives slightly worse answers, with no error anywhere. Those silent bugs are what interviewers at companies that train models like to ask about, because they reveal who has actually done it.

You will want Chapter 1's ideas fresh, especially attention (Parts VI and VII), the KV cache (Part XI) and the decoder block (Part XII). When a section depends on one of them, it says so and gives the section number. The five box types work as before: **Picture this** for analogies, **Note** for side details, **Watch out** for real mistakes, **Interview lens** for questions phrased as an interviewer would ask them, and a dark **In one breath** box at the end of every part.

The chapter has seven parts. Parts I to III upgrade the pieces inside the block: RoPE in practice, RMSNorm and SwiGLU. Parts IV to VI upgrade attention itself: grouped-query attention, PyTorch's fused attention call, and FlashAttention. Part VII assembles everything into the finished block, follows real Llama 3 8B shapes through it, counts its parameters, reads its code and finishes with a porting checklist.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch-24

Chapter 1's Finch-19 was built the way GPT-2 was built in 2019. **Finch-24** is the same small model rebuilt with the 2024 recipe, the one Llama 3, Mistral and Qwen use. The width, depth, vocabulary and number of query heads stay the same, so every difference you see in the numbers comes from an upgrade, not from a resize. Where a section needs a real model's numbers, it uses Llama 3 8B, and the comparison table in Part VII sets the two side by side.

| Setting | Finch-19 (2019 recipe) | Finch-24 (2024 recipe) | Changed in |
|---|---|---|---|
| Vocabulary `V` | 32,000 | 32,000 | |
| Width `d_model` | 512 | 512 | |
| Layers `N` | 8 | 8 | |
| Query heads `H` | 8 | 8 | |
| Key/value heads `H_kv` | 8 | 2 | Part IV |
| Head size `d_head` | 64 | 64 | |
| Positions | learned table, 1,024 rows | RoPE, base 10,000, no table | Part I |
| Context `T_max` | 1,024 | 4,096 | Part I |
| Normalization | LayerNorm, pre-norm | RMSNorm, pre-norm, ε = 1e-5 | Part II |
| MLP | GELU, 2,048 wide | SwiGLU, 1,536 wide | Part III |
| Attention kernel | written by hand | SDPA / FlashAttention | Parts V, VI |
| Biases | everywhere | none | Part VII |
| Output head | tied to embeddings | tied to embeddings | |
| Parameters | 42,128,384 | 40,509,952 | Part VII |

Notice two things before we start. Finch-24 is slightly *smaller* than Finch-19, by 1,618,432 parameters, even though it is a better model: most upgrades are not about size. And its KV cache per token is four times smaller, 4,096 bytes instead of 16,384, which Part IV explains. By the end of Part VII you will have accounted for every one of those differences.

</section>

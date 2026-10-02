<section class="front">

<div class="part-kicker">Unit IV</div>

# How to read this chapter

<p class="lede">A trained model is a file of numbers. This chapter turns that file into a chat reply you can defend: load a real pretrained checkpoint into your own decoder, prove that it computes the same numbers as the reference implementation, and run cached, templated, correctly terminated generation through it.</p>

The earlier chapters built the decoder, upgraded it to the modern block and trained it. Several of their ideas come back here in a different role. The KV cache, grouped-query attention, SDPA and FlashAttention were introduced as pieces of architecture; here they are levers on latency, memory and throughput. When a topic was already explained, this chapter gives a short recap and a link to the section that explains it, and spends its own pages on what is new: what changes at inference time, what it costs on real hardware, and what breaks when you do it by hand.

The ten parts follow one chat message through the stack. Parts I to III cover how a decoder runs at inference time: prefill and decode, the KV cache in practice, and the attention kernels that serve it. Part IV shrinks the weights with quantization. Parts V and VI open a real checkpoint, Qwen3-0.6B, read its config, reconstruct its architecture and load its tensors into our own code. Part VII proves the result is correct, number by number. Parts VIII and IX cover the two pieces of text processing that sit in front of the model, the production tokenizer and the chat template. Part X assembles the whole pipeline, measures it and ends with a checklist.

The boxes work as before: **Picture this** for analogies, **Note** for side details, **Watch out** for real mistakes, **Interview lens** for questions phrased the way an interviewer asks them, and a dark **In one breath** box at the end of every part. The interview page at the end has a question bank, graded exercises and worked solutions. Read a paragraph, then look at its figure and check that you could have drawn it. By the end you should be able to take a checkpoint you have never seen, rebuild it from its config, load it, show that your logits match the reference to within a tolerance you can justify, and serve a chat turn through it with a cache.

</section>

<section class="front">

<div class="part-kicker">The running examples</div>

# Meet Qwen3-0.6B

The earlier chapters used Finch-24, a small model whose every number fits on a page. Finch-24 comes back for quick arithmetic, but this chapter is about real checkpoints, so its main example is a real one: **Qwen3-0.6B**, released by Alibaba's Qwen team in April 2025. It is small enough to run on a laptop, it is built from exactly the parts of the modern block, and it has two details that make good lessons: a head size that does not equal the width divided by the heads, and an extra normalization on queries and keys. Every value below was read from its published `config.json`, `tokenizer_config.json` and the header of its `model.safetensors` file.

| Setting | Config key | Qwen3-0.6B | Finch-24 |
|---|---|---|---|
| Vocabulary rows | `vocab_size` | 151,936 | 32,000 |
| Width | `hidden_size` | 1,024 | 512 |
| Layers | `num_hidden_layers` | 28 | 8 |
| Query heads | `num_attention_heads` | 16 | 8 |
| Key/value heads | `num_key_value_heads` | 8 | 2 |
| Head size | `head_dim` | 128 | 64 |
| SwiGLU width | `intermediate_size` | 3,072 | 1,536 |
| RoPE base | `rope_theta` | 1,000,000 | 10,000 |
| RMSNorm epsilon | `rms_norm_eps` | $10^{-6}$ | $10^{-5}$ |
| Position limit | `max_position_embeddings` | 40,960 | 4,096 |
| Tied embeddings | `tie_word_embeddings` | true | true |
| Stored dtype | `torch_dtype` | bfloat16 | |
| Unique parameters | | 596,049,920 | 40,509,952 |
| KV cache per token (16-bit) | | 114,688 bytes | 4,096 bytes |

Where a section needs the numbers of a larger model, it uses Llama 3 8B, as Chapter 2 did: 8,030,261,248 parameters, 32 layers, 32 query heads and 8 key/value heads of 128. Where it needs a GPU, it uses the datasheet peaks of an NVIDIA H100 SXM: 80 GB of memory, 3.35 terabytes per second of memory bandwidth and 989.4 teraFLOPS of dense bf16 arithmetic. Times computed from those peaks are **lower bounds**, the fastest the hardware could possibly go. Real systems land above them, and each section says by how much and why.

Every number in this chapter can be reproduced with `python scripts/inference/calc.py`, and every token ID with `python scripts/inference/tokens.py`, which downloads the real Qwen3 tokenizer and renders its real chat template. By the end of Part X you will have rebuilt Qwen3-0.6B from its config, counted all 596,049,920 of its parameters, found all 311 tensors in its file, and traced a 26-token chat prompt through prefill, decode and back into text.

</section>

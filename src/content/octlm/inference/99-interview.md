@chapter faq | Interview Question Bank | Fifty questions on inference engineering, in the order of the chapter, each answered the way a strong candidate would say it out loud.

### Prefill and decode

**Q1. What is the difference between prefill and decode?**

Prefill runs the whole prompt through the model in one parallel pass, building the KV cache and producing the first token's logits; it sets the time to first token. Decode then generates one token per step, each a single-position forward pass that reads the cache; its step time is the inter-token latency.

**Q2. Why is inference cheaper per token than training?**

No backward pass, so about $2N$ operations per token instead of about $6N$; no stored activations, gradients or optimizer state; and with a cache, only the new token's row is computed each step.

**Q3. Why is decode memory-bound?**

Each step reads every weight once to process one token, so each 2-byte bf16 weight does one multiply-add: an arithmetic intensity of about 1 operation per byte against an H100 balance point near 295. The time is set by bandwidth: at least 4.48 ms per token for Llama 3 8B on an H100.

**Q4. What do TTFT and ITL measure, and what drives each?**

Time to first token is the wait before anything appears: queueing, templating, tokenization and mostly prefill, so it grows with prompt length. Inter-token latency is the time per decode step, set by bytes read per step: weights plus cache.

**Q5. How does batching trade latency for throughput?**

A batch shares one read of the weights across all sequences, so total tokens per second rises sharply; each sequence's step gets slower because there is more cache to read and more arithmetic. For Llama 3 8B at a 2,048-token context on an H100, batch 64 gives about 30 times the total throughput of batch 1 while each user's speed halves.

**Q6. Why is long-prompt prefill slow?**

Projection and MLP work grows linearly with prompt length, attention work quadratically. For Llama 3 8B the attention share of prefill rises from 0.2% at 128 tokens to 36% at 32,768, and the lower bound reaches 782 ms.

### The KV cache

**Q7. What exactly is stored in the KV cache?**

For every layer, the key and value projections of every past position, keys already rotated by RoPE, at $H_{kv}$ heads: tensors of shape $(B, H_{kv}, S, d_h)$, two per layer.

**Q8. Why are queries not cached?**

A query is used only on the step it is computed, to attend from the newest token; no later step ever reads an old query, so storing it would waste memory.

**Q9. Give the KV cache size formula and a real number.**

$2 \times L \times H_{kv} \times d_h \times S \times b$ bytes per sequence. Qwen3-0.6B: $2 \times 28 \times 8 \times 128 \times 2 = 114{,}688$ bytes per token, so 3.5 GiB at 32,768 tokens, about three times the model's weights.

**Q10. What position does the first generated token get?**

The number of tokens already in the cache: with a 26-token prompt at positions 0 to 25, the first new token is at 26. Using 0, or using the cache length after appending, is an off-by-one that corrupts RoPE.

**Q11. How do you test a cache implementation?**

Generate greedily with and without the cache and compare logits at every step, requiring the maximum difference to stay within a rounding tolerance, and the tokens to match. Test long prompts and long generations, because position bugs grow with distance.

**Q12. Does decode attention need a causal mask?**

Not for a single new token: every cached key is at or before the query's position. Passing `is_causal=True` in PyTorch is wrong there, because it aligns the mask to the top-left and lets the query see only the first key.

**Q13. Name three ways to shrink the KV cache.**

Fewer key/value heads (GQA, MQA), fewer bytes per element (fp8 cache), fewer cached positions in some layers (sliding windows), or compressed per-token representations (DeepSeek's latent attention). Paging does not shrink it but stops reserved memory from being wasted.

### Attention kernels

**Q14. What is the difference between SDPA and FlashAttention?**

SDPA is PyTorch's function interface for attention; FlashAttention is one kernel that can implement it. SDPA dispatches to FlashAttention only for supported GPUs, fp16 or bf16 inputs, supported head sizes and no arbitrary mask, and otherwise falls back to a memory-efficient or plain math kernel.

**Q15. Why is FlashAttention faster if it does the same arithmetic?**

It tiles $Q$, $K$ and $V$ into blocks that fit in on-chip SRAM, computes softmax online across blocks, and never writes the $T \times T$ score matrix to HBM. The arithmetic is unchanged; the memory traffic drops from quadratic to linear.

**Q16. What is Flash-Decoding and why is it needed?**

At decode there is one query per sequence, so splitting work by batch, head and query block leaves most of a large GPU idle. Flash-Decoding splits the cache along the sequence into chunks processed in parallel and merges the partial results with the online-softmax rescaling, so the result is still exact.

**Q17. How do you merge two partial softmax-attention results?**

With maxima $m_i$, sums $\ell_i$ and normalized outputs $o_i$: take $m = \max(m_1, m_2)$, weights $a_i = \ell_i e^{m_i - m}$, and output $(a_1 o_1 + a_2 o_2) / (a_1 + a_2)$.

**Q18. Why does batching not make decode attention compute-bound?**

Batching shares weights, but each sequence attends over its own cache, so each cached element is used only by the query heads of its group: an intensity of a few operations per byte however large the batch.

### Quantization

**Q19. Why quantize an LLM for inference?**

To fit in less memory, and because decode time is roughly bytes read divided by bandwidth: Llama 3 8B drops from 16.06 GB to 4.14 GB in 4-bit with groups of 128, and its decode lower bound from 4.48 ms to 1.16 ms per token on an H100.

**Q20. Compare FP16 and BF16.**

Both are 16 bits. FP16 has 5 exponent and 10 mantissa bits: more precision, maximum 65,504. BF16 has 8 exponent and 7 mantissa bits: the range of FP32 with much less precision, which avoids overflow in training and inference.

**Q21. Write the quantize and dequantize equations.**

$q = \operatorname{clamp}(\operatorname{round}(x/s) + z, q_{\min}, q_{\max})$ and $\hat{x} = s(q - z)$. The rounding error inside the range is at most $s/2$; values outside are clipped.

**Q22. When would you use asymmetric quantization?**

When the values are lopsided around zero, such as activations after SiLU: mapping the actual range onto all 256 codes uses about twice the resolution of a symmetric range that wastes half its codes on negatives that never occur. Weights are roughly symmetric, so symmetric is usual for them.

**Q23. Why use per-group scales?**

A scale is set by the largest value it covers, and one outlier coarsens every value sharing it. Groups of 128 confine outliers: on a real Qwen3 row, 4-bit error fell from 17.8% with one scale per row to 11.7%, for 0.125 extra bits per weight.

**Q24. Can a quantized model be slower than the original?**

Yes. Without a fused kernel, dequantizing the weights into a bf16 copy in memory and then running a bf16 matmul moves 5 bytes per weight instead of 2, and in compute-bound prefill the dequantization arithmetic is extra work. Speed depends on kernel support, not just on bits.

**Q25. How do you evaluate a quantized model?**

Against the unquantized baseline on identical inputs: size, peak memory, prefill and decode speed, logit differences and KL divergence per position, top-1 agreement, perplexity, and end-task scores.

### Reading a real model

**Q26. What does `head_dim` in Qwen3-0.6B's config tell you?**

That the head size is 128, not width over heads (64), so attention runs 2,048 wide: `q_proj` is $(2{,}048, 1{,}024)$ and `o_proj` is $(1{,}024, 2{,}048)$. Code that derives the head size from the width cannot load the checkpoint.

**Q27. What is QK-norm in Qwen3?**

An RMSNorm with a learned 128-entry gain applied to every query head and every key head after projection and before RoPE. It bounds query and key lengths, so attention scores cannot grow without limit during training.

**Q28. How many parameters does Qwen3-0.6B have, and how do you check?**

596,049,920: 15,730,944 per layer for 28 layers, 155,582,464 in the tied embedding, and 1,024 in the final norm. The non-embedding count, 440,467,456, matches the card's 0.44B.

**Q29. Why is the vocabulary size 151,936 when the tokenizer has 151,669 tokens?**

The embedding is padded to a multiple of 128 for efficient kernels; the extra 267 rows are never produced by the tokenizer.

**Q30. Why does PyTorch store a linear layer's weight as (out, in)?**

Because `nn.Linear` computes $x W^\top$; each row of the weight produces one output feature. Checkpoints from PyTorch models inherit that layout, so head $h$ of `q_proj` is a band of rows and head $h$'s input to `o_proj` is a band of columns.

### Checkpoints and loading

**Q31. What is inside a safetensors file?**

An 8-byte little-endian header length, a JSON header mapping each tensor name to its dtype, shape and byte offsets, and the raw tensor bytes packed end to end. No code.

**Q32. Why prefer safetensors to pickle checkpoints?**

Unpickling can call arbitrary functions named in the file, so loading an untrusted pickle runs untrusted code. Safetensors only describes tensors, can be memory-mapped, and lets you read any single tensor by offset.

**Q33. What do missing keys, unexpected keys and shape mismatches tell you?**

Missing: parameters your model has that the file lacks, which keep random values under `strict=False`. Unexpected: tensors in the file your model has no place for. Shape mismatches: the same name with a different shape, which usually means a config or layout error.

**Q34. Which transposition bugs are silent?**

Those on square matrices: a transposed $(1{,}024, 1{,}024)$ `k_proj` loads without complaint and computes nonsense. Rectangular ones fail with a shape error. Only numerical parity catches the silent kind.

**Q35. How should a tied LM head be loaded?**

Load the embedding, point the LM head at the same tensor, and skip the checkpoint's `lm_head.weight` after verifying it equals the embedding. Qwen3-0.6B stores both copies, 311 MB of duplication.

**Q36. How do you load a model without running out of memory?**

Construct it on the meta device so no random weights are allocated, then stream tensors one at a time in the stored dtype straight to the target device. For Qwen3-0.6B the peak falls from 3.89 GB to 1.19 GB; for Llama 3 8B from about 48 GB to 16 GB.

### Proving correctness

**Q37. Why isn't fluent output evidence of a correct port?**

Models are redundant enough that many bugs, such as a swapped RoPE convention or wrong epsilon, leave short answers intact while degrading long or hard ones; sampling adds randomness; and errors compound silently through layers and tokens.

**Q38. How do you set up a parity test?**

Same checkpoint, same token IDs, same dtype (fp32 first), the Hugging Face model with eager attention as reference; compare raw logits by maximum and mean absolute difference, per position, and argmax agreement.

**Q39. Parity fails. How do you find the bug?**

Capture intermediate tensors in both models with forward hooks, compare them in data-flow order, and stop at the first stage where the difference jumps from rounding level. The bug is there; everything after is a consequence.

**Q40. What does a logit difference of zero at position 0, growing with position, suggest?**

A RoPE or position-ID bug, because position 0 is not rotated at all.

**Q41. How do you choose a parity tolerance?**

From the format: fp32 implementations agree to about $10^{-5}$ in the logits, so a threshold of $10^{-3}$ is safe; bf16 values near 12 are 0.0625 apart, so differences of a few tenths are normal and bugs show up as differences of 0.5 or more. Check argmax agreement too, allowing near-ties.

**Q42. Why might greedy generation diverge between two correct implementations?**

At a near-tie, where the top two logits differ by less than the rounding noise, the argmax can flip; after that the texts differ. Check the logits at the divergence step, and if it was a near-tie, force the reference token and continue comparing.

### Tokenizers and templates

**Q43. Why can't you swap tokenizers between models?**

An ID is just a row index whose meaning was learned in training; another tokenizer assigns different strings to the same rows. GPT-2's IDs for "Hello world" read as " presentationception" to Qwen3.

**Q44. What does a byte-level BPE tokenizer do with text it has never seen?**

It always succeeds, because all 256 byte values are in its base vocabulary; there is no unknown token. Rare characters become several byte-level tokens.

**Q45. What is dangerous about literal special-token strings in user input?**

With default settings the tokenizer turns the string `<|im_end|>` into the real control token, letting a user end their own turn and write text the model reads as another role. Tokenize user content with special-token matching off and insert control tokens by ID.

**Q46. Why must streaming detokenization buffer bytes?**

One character can span several tokens: Qwen3 encodes 🫠 as three tokens, each of which decodes alone to a replacement character. A streaming decoder holds bytes back until they form a complete UTF-8 character.

**Q47. What does a chat template do?**

It serializes a list of messages into the single token sequence format the model saw in post-training: role markers, end-of-turn tokens, tool and reasoning formatting, and the generation prompt that opens the assistant's turn.

**Q48. How does Qwen3 switch off thinking?**

The template's `enable_thinking=False` appends an empty think block, `<think>\n\n</think>\n\n`, four tokens, to the generation prompt, so the model starts directly on the answer.

**Q49. Name three chat-template failure modes.**

No generation prompt (the model may continue the user's turn), another family's special tokens (they become plain text), and keeping old reasoning in the history or truncating mid-turn (inputs unlike training, quietly worse output).

### End to end

**Q50. Walk me through serving one chat turn with your own implementation.**

Render the messages with the checkpoint's template and generation prompt, tokenize to IDs, prefill them in one pass to fill the KV cache and get the last position's logits, sample with the configured settings, then decode one token per step at increasing positions, appending to the cache, until the end-of-turn token or a length limit, and detokenize with byte buffering, splitting off any reasoning. Before trusting it, I'd have proved shapes, parameter count, logit parity, cache parity, tokenizer and template equality, and termination, in that order.

@chapter exercises | Exercises | Thirty-three problems in the order of the chapter. ● is quick arithmetic, ●● is multi-step or an explanation, ●●● is a derivation, code or a full count.

### Parts I to III

**E1** ● Llama 3 8B reads 15.01 GB of bf16 weights per decode step. On a GPU with 1 TB/s of memory bandwidth, what is the lower bound on time per token and the upper bound on tokens per second at batch 1?

**E2** ●● For a 200-token prompt and a 100-token reply, how many token positions does the naive loop push through the model, how many does the cached loop, and what is the ratio?

**E3** ● A request has a TTFT of 120 ms and an ITL of 8 ms. How long does a 300-token reply take?

**E4** ●● What is the arithmetic intensity of the weight reads in a batch-16 decode step in bf16, ignoring the cache? Is the step memory-bound on an H100?

**E5** ● Mistral 7B has 32 layers and 8 key/value heads of 128. What is its bf16 KV cache per token, and for one 32,768-token sequence?

**E6** ●● A 24 GB GPU holds Qwen3-0.6B's 1.19 GB of weights. Ignoring everything else, how many 8,192-token sequences of KV cache fit?

**E7** ● In Qwen3-0.6B, a decode step generates the token at position 40. What are the shapes of one layer's key cache after the append and of the attention scores?

**E8** ●●● Show that the merge rule $o = (a_1 o_1 + a_2 o_2)/(a_1 + a_2)$ with $a_i = \ell_i e^{m_i - m}$ gives exactly softmax attention over the union of the two chunks.

**E9** ●● Merge two partial results: chunk 1 has $m_1 = 2$, $\ell_1 = 1.5$, $o_1 = [1, 0]$; chunk 2 has $m_2 = 3$, $\ell_2 = 2$, $o_2 = [0, 1]$.

**E10** ● How much memory would one layer's full score matrix take for Qwen3-0.6B (16 heads) prefilling 32,768 tokens in bf16?

### Part IV

**E11** ●● Quantize $[0.91, -0.3, 0.15, -1.8]$ to symmetric INT8 with one scale. Give the scale, the integers, the reconstruction and the errors.

**E12** ●● Quantize $[-1.0, 0.5, 2.0, 6.0]$ to asymmetric UINT8. Give the scale, the zero point, the integers and the reconstruction.

**E13** ● What is the storage cost in bits per weight of INT4 with an fp16 scale and an fp16 zero point per group of 64?

**E14** ●● Qwen3-0.6B is quantized to INT4 with groups of 128 everywhere except the tied embedding, which stays bf16. How large are the weights? What does the answer say about small models with large vocabularies?

**E15** ●● Explain without equations why a quantized model that dequantizes its weights into memory before each matmul can be slower than the bf16 original.

**E16** ●●● Write `quantize_groups(w, group=128)` and `dequantize_groups(q, s)` for symmetric INT4 on a weight of shape (out, in).

**E17** ● Compute the KL divergence $D_{\text{KL}}(p \,\|\, q)$ for $p = [0.7, 0.2, 0.1]$ and $q = [0.6, 0.3, 0.1]$, in nats.

### Parts V and VI

**E18** ●●● Qwen3-1.7B's config has `hidden_size` 2,048, 28 layers, 16 query heads, 8 key/value heads, `head_dim` 128, `intermediate_size` 6,144, vocabulary 151,936 and tied embeddings, with QK-norm and no biases. Count every parameter, and the non-embedding total.

**E19** ●● For the Qwen3-1.7B config of E18, does computing the head size as width divided by heads give the wrong answer? Why does this make Qwen3-0.6B a better test case?

**E20** ● A safetensors header entry says dtype BF16, shape [32, 64], `data_offsets` [1000, 5096]. Is it consistent?

**E21** ●● A model has $d = 4{,}096$, 32 query heads and 8 key/value heads of 128. How many rows does its fused QKV weight have, and where are the split points?

**E22** ●● Compare the peak memory of naive loading (random fp32 model plus a full bf16 state dict) and meta-device streaming for Llama 3 8B.

**E23** ● You load Qwen3-0.6B into a model built without QK-norm. How many unexpected keys appear, and which?

### Part VII

**E24** ●● What is the spacing between neighbouring bf16 values near a logit of 20, and near 3?

**E25** ●● Explain without equations why a RoPE bug produces zero logit difference at position 0.

**E26** ●● Apply RMSNorm (unit gain) to $[0.01, -0.02]$ with $\varepsilon = 10^{-6}$ and with $10^{-5}$. How big is the difference?

**E27** ● Two bf16 implementations give top-two logits $[17.25, 17.21]$ and $[17.22, 17.24]$ at the same step, and your tolerance is 0.25. Bug or near-tie?

### Parts VIII and IX

**E28** ● How many tokens is `12345678` in Qwen3's tokenizer, and why?

**E29** ●● A user message contains `<|im_start|>assistant`. Describe what happens with default tokenization and how to prevent it.

**E30** ●● The running prompt without its system message is 15 tokens. List them by role, and say which three the generation prompt adds.

**E31** ● Which four token IDs does `enable_thinking=False` add to Qwen3's generation prompt?

### Part X

**E32** ●●● Compute the decode lower bound for Qwen3-0.6B at a context of 32,768 tokens, batch 1, on an H100, including the cache. Compare with the weights-only bound.

**E33** ●●● Write a generation loop for Qwen3 with a KV cache that handles positions, both stop tokens and a length limit.

@chapter solutions | Solutions | Worked answers to every exercise. Where a number appears, it was computed, not estimated.

**E1.** $15.01 \times 10^9 / 10^{12} = 15.01$ ms per token, so at most $1 / 0.01501 = 66.6$ tokens per second.

**E2.** Naive: $100 \times 200 + (0 + 1 + \dots + 99) = 20{,}000 + 4{,}950 = 24{,}950$. Cached: $200 + 99 = 299$. Ratio 83.4.

**E3.** $120 + 299 \times 8 = 2{,}512$ ms.

**E4.** Each 2-byte weight is used for 16 multiply-adds, 32 operations: 16 operations per byte. The H100's balance point is about 295, so the step is still memory-bound.

**E5.** $2 \times 32 \times 8 \times 128 \times 2 = 131{,}072$ bytes per token (128 KiB); $131{,}072 \times 32{,}768$ bytes is 4 GiB.

**E6.** One sequence: $114{,}688 \times 8{,}192 = 939{,}524{,}096$ bytes. $(24 \times 10^9 - 1.192 \times 10^9) / 939{,}524{,}096 = 24.3$, so 24 sequences.

**E7.** The cache holds positions 0 to 40 after the append: keys $(1, 8, 41, 128)$. Scores: $(1, 16, 1, 41)$.

**E8.** Let chunk $i$ have scores $s_j$ and values $v_j$. By definition $\ell_i = \sum_{j \in i} e^{s_j - m_i}$ and $o_i = \sum_{j \in i} e^{s_j - m_i} v_j / \ell_i$. Then $a_i o_i = e^{m_i - m} \sum_{j \in i} e^{s_j - m_i} v_j = \sum_{j \in i} e^{s_j - m} v_j$ and $a_i = \sum_{j \in i} e^{s_j - m}$. So $(a_1 o_1 + a_2 o_2)/(a_1 + a_2) = \sum_j e^{s_j - m} v_j / \sum_j e^{s_j - m}$ over all positions, which is softmax attention over the union, computed relative to the global maximum $m$.

**E9.** $m = 3$, $a_1 = 1.5\, e^{-1} = 0.5518$, $a_2 = 2$. $o = [0.5518, 2] / 2.5518 = [0.2162, 0.7838]$.

**E10.** $16 \times 32{,}768^2 \times 2 = 34{,}359{,}738{,}368$ bytes, 32 GiB, for one layer.

**E11.** $s = 1.8 / 127 = 0.014173$. Dividing gives $64.21, -21.17, 10.58, -127$, so $q = [64, -21, 11, -127]$. Reconstruction $[0.9071, -0.2976, 0.1559, -1.8]$; errors $0.0029, -0.0024, -0.0059, 0$, all within $s/2 = 0.0071$.

**E12.** $s = 7 / 255 = 0.027451$, $z = \operatorname{round}(1 / 0.027451) = \operatorname{round}(36.43) = 36$. $q = [0, 54, 109, 255]$. Reconstruction $[-0.9882, 0.4941, 2.0039, 6.0118]$; errors at most 0.0118, within $s/2 = 0.0137$.

**E13.** $4 + (16 + 16)/64 = 4.5$ bits per weight.

**E14.** Non-embedding: $440{,}467{,}456 \times 4.125 / 8 = 227{,}116{,}032$ bytes. Embedding in bf16: 311,164,928 bytes. Total 538,280,960 bytes, 0.54 GB, of which the embedding is 58%. In a small model with a large vocabulary, the embedding dominates once everything else is compressed, so it is often quantized too, or kept and accepted as the floor.

**E15.** The plan saves space on disk but not traffic at run time. Before each multiply, the layer reads the small integer weights, writes out a full-size 16-bit copy, then reads that copy back to multiply. That is more bytes moved per weight than just reading the 16-bit original once, and decode speed is set by bytes moved.

**E16.**

```python
def quantize_groups(w, group=128):                 # w: (out, in), in % group == 0
    out, inp = w.shape
    g = w.float().view(out, inp // group, group)
    s = g.abs().amax(-1, keepdim=True) / 7         # (out, in/group, 1)
    q = torch.round(g / s).clamp(-8, 7).to(torch.int8)
    return q, s.half()

def dequantize_groups(q, s):
    out, n, group = q.shape
    return (q.float() * s.float()).view(out, n * group)
```

**E17.** $0.7 \ln(0.7/0.6) + 0.2 \ln(0.2/0.3) + 0.1 \ln 1 = 0.10791 - 0.08109 + 0 = 0.02681$ nats.

**E18.** Per layer: $W_Q$ $2{,}048 \times 2{,}048 = 4{,}194{,}304$; $W_K$ and $W_V$ $2{,}048 \times 1{,}024$ each, 4,194,304 together; $W_O$ 4,194,304; QK-norm 256; MLP $3 \times 2{,}048 \times 6{,}144 = 37{,}748{,}736$; two norms 4,096. Layer total 50,336,000; 28 layers 1,409,408,000. Embedding $151{,}936 \times 2{,}048 = 311{,}164{,}928$; final norm 2,048. Total 1,720,574,976; non-embedding 1,409,410,048, matching the card's 1.7B and 1.4B.

**E19.** No: $2{,}048 / 16 = 128$, which equals `head_dim`. A port that wrongly derives the head size would pass on Qwen3-1.7B and fail on Qwen3-0.6B, where $1{,}024 / 16 = 64 \ne 128$. Test on the configuration where the shortcut and the truth differ.

**E20.** $5{,}096 - 1{,}000 = 4{,}096$ bytes $= 32 \times 64 \times 2$. Consistent.

**E21.** $32 \times 128 + 8 \times 128 + 8 \times 128 = 4{,}096 + 1{,}024 + 1{,}024 = 6{,}144$ rows. Split at rows 4,096 (end of $W_Q$) and 5,120 (end of $W_K$).

**E22.** Naive: $4 \times 8{,}030{,}261{,}248 + 2 \times 8{,}030{,}261{,}248$ bytes $= 48.18$ GB. Streaming: 16.06 GB.

**E23.** 56: `model.layers.{i}.self_attn.q_norm.weight` and `k_norm.weight` for $i = 0$ to 27.

**E24.** Values in $[16, 32)$ are $2^{4 - 7} = 0.125$ apart; values in $[2, 4)$ are $2^{1 - 7} = 0.015625$ apart.

**E25.** RoPE turns each pair of numbers by an angle proportional to the position. At position 0 the angle is zero, so no turning happens, and a wrong way of turning has nothing to get wrong. From position 1 on, the wrong turn moves the numbers, and the further along the position, the further they move.

**E26.** The mean square is $2.5 \times 10^{-4}$. With $\varepsilon = 10^{-6}$ the scale is $1/\sqrt{2.51 \times 10^{-4}} = 63.12$, giving $[0.6312, -1.2624]$. With $10^{-5}$ it is $62.02$, giving $[0.6202, -1.2403]$: 1.7% smaller, a systematic error on every small-norm input.

**E27.** The top two differ by 0.04 in the first model and 0.02 in the second, far below 0.25, so the flip is a near-tie, not a bug. Force the reference token and continue.

**E28.** 8 tokens: the pre-tokenizer splits every digit into its own chunk, so merges can never join digits.

**E29.** With special-token matching on, `<|im_start|>` becomes token 151644, so the user's message now contains a new turn whose role is `assistant`, and the model reads the following text as its own earlier words. Tokenize user content with `encode_special_tokens` (or `split_special_tokens`) on, insert control tokens only by ID, and reject or escape added-token strings like `<think>` that the flag does not cover.

**E30.** User turn: `<|im_start|>`, `user`, `\n`, `What`, ` is`, ` the`, ` capital`, ` of`, ` France`, `?`, `<|im_end|>`, `\n` (12 tokens). The generation prompt adds `<|im_start|>`, `assistant`, `\n`.

**E31.** 151667 (`<think>`), 271 (`\n\n`), 151668 (`</think>`), 271 (`\n\n`).

**E32.** Weights 1,192,099,840 bytes plus cache $114{,}688 \times 32{,}768 = 3{,}758{,}096{,}384$ bytes: 4,950,196,224 bytes per step. At 3.35 TB/s that is 1.478 ms, at most 677 tokens per second, against 0.356 ms and 2,810 tokens per second for the weights alone. At this context the cache is three quarters of every step.

**E33.**

```python
def generate(model, ids, max_new=512, stops=(151645, 151643)):
    cache = model.new_cache(max_len=len(ids) + max_new)
    logits = model(torch.tensor([ids]), cache=cache, pos=0)[:, -1]   # prefill
    out = []
    for _ in range(max_new):
        nxt = int(sample(logits))
        if nxt in stops:
            break
        out.append(nxt)
        pos = len(ids) + len(out) - 1           # cache length before append
        logits = model(torch.tensor([[nxt]]), cache=cache, pos=pos)[:, -1]
    return out                                  # stop token excluded
```

@part I | Prefill and Decode | A trained model answers a prompt in two very different phases: one large parallel pass over the prompt, then a long series of tiny passes, one per generated token. The two phases stress different parts of the hardware, so almost every inference optimization helps one and not the other. We start from what changes between training and inference, then take each phase apart with Llama 3 8B's numbers on a real GPU, and end with the waste that motivates the KV cache. | where:1

## 1. Training vs Inference

In training, the model never waits for itself. A 2,048-token sequence arrives complete, the targets are the same tokens shifted by one, and the causal mask lets every position predict its next token in one forward pass. Chapter 1 called this "one pass, seven lessons" ([Section 44](/octlm/attention/08-causal-mask/#s44)): $T$ predictions for the price of one pass.

At inference the next input is the model's own previous output, which does not exist until the previous step finishes. This is **autoregressive generation**: predict a token, append it, predict again ([Section 1](/octlm/attention/01-tokenization/#s1)). Each step is the same forward pass as in training, but the steps form a chain: the 200th token cannot be computed before the 199th is chosen.

@fig inf_train_vs_infer | Training sees the whole sequence at once and predicts every position in one pass. Inference generates left to right, each new token waiting for the one before it.

### Why inference does less work per token

Inference is cheaper per token for three reasons. There is no backward pass: Kaplan and colleagues' 2020 accounting puts a forward pass at about $2N$ operations per token for $N$ parameters and a training step at about $6N$. Nothing is kept for gradients, so memory holds the weights and little else. And with a cache (Part II), each step computes only the new token's row.

### Two jobs: reading the prompt and writing the reply

A chat request is two jobs. **Prompt processing** reads the input: every prompt token is known, so all go through the model in one parallel pass, as in training. **Token generation** writes the reply, one token per step, each step a full trip through every layer for one position. The industry names are **prefill** and **decode**.

### Latency versus throughput

Two kinds of speed pull against each other. **Latency** is how long one user waits, split into **time to first token** (TTFT), mostly prefill, and **inter-token latency** (ITL), the time per decode step. With TTFT 40 ms and ITL 5 ms, a 200-token reply takes $40 + 199 \times 5 = 1{,}035$ ms. **Throughput** is tokens per second across all users.

A server raises throughput by **batching** users' decode steps so one read of the weights serves all of them, at the cost of slower steps for each user. Section 15 puts numbers on it: at batch 64, Llama 3 8B on one H100 produces about thirty times the total tokens per second of batch 1, while each stream slows by half.

@fig inf_latency_timeline | One request on a timeline. Prefill ends at the first token; each decode step then adds one. TTFT is the wait before anything appears, ITL the streaming speed.

:::story Picture this
A court stenographer reads a 40-page brief before a hearing, then answers questions one word at a time. Reading is fast per page because the whole stack is there to skim: prefill. Answering is slow per word because each word must be chosen and spoken before the next: decode. A faster reader shortens the silence; a faster speaker shortens everything after.
:::

@fig inf_steno_scene | The stenographer of the analogy. Reading the brief is one parallel pass over many pages; answering is a chain of single words, each waiting for the last.

## 2. Prefill

A user pastes a 2,048-token document and asks about it. Before the first word of the answer, the model must run all 2,048 tokens through all 32 layers of Llama 3 8B.

**Prefill** does that in one forward pass over input of shape $(B, T, d)$, every position in parallel under the causal mask, as in training. Two things are special. Each layer writes its prompt keys and values into the KV cache, so prefill **builds the initial cache**: one key and value row per position, layer, and KV head. And only the last position's output is needed, because only it predicts the next token.

@fig inf_prefill_pass | Prefill: all prompt positions pass through every layer together. Each layer leaves its keys and values in the cache; only the final position goes on to the LM head.

That second point is a free saving. Qwen3-0.6B's LM head is $151{,}936 \times 1{,}024$; for a 26-token prompt, full logits are $26 \times 151{,}936 = 3{,}950{,}336$ numbers, of which generation uses the last 151,936. Hugging Face exposes this as `logits_to_keep=1`; in your own code it is `h[:, -1:, :]` before the head.

### Why prefill is parallel, and fast per token

A $T$-token prompt turns every projection into a matrix-matrix multiply, so each weight is read once and used $T$ times. For Llama 3 8B, a 2,048-token prefill needs about $3.18 \times 10^{13}$ operations, at least 32.2 ms at the H100's 989.4 teraFLOPS, while reading the 15.0 GB of weights takes at least 4.6 ms. Arithmetic takes seven times longer than memory traffic, so prefill is **compute-bound**.

### Time to first token

**Time to first token** covers tokenization and template (microseconds to a millisecond), queueing, prefill, and the LM head and sampling for the last position. On an idle server with a long prompt, prefill dominates, so TTFT tracks prompt length.

### Prefill cost for long prompts

Projections and MLP cost $2N$ operations per token and grow **linearly** with prompt length; attention scores grow with $T^2$. The linear part dominates short prompts, and the quadratic part catches up on long ones.

| Prompt (tokens) | Prefill FLOPs | Lower bound | Attention share |
|---|---|---|---|
| 128 | $1.93 \times 10^{12}$ | 1.9 ms | 0.2% |
| 2,048 | $3.18 \times 10^{13}$ | 32.2 ms | 3.5% |
| 8,192 | $1.41 \times 10^{14}$ | 142.1 ms | 12.5% |
| 32,768 | $7.73 \times 10^{14}$ | 781.6 ms | 36.4% |

The table assumes Llama 3 8B on one H100 at peak, with causal attention counted as half the square. Real prefill runs at roughly half to three quarters of peak, so a 32k-token prompt takes over a second before the first word. Hence servers cache the KV of popular prefixes, such as a long system prompt (Section 52).

@fig inf_prefill_cost | Prefill lower bound for Llama 3 8B on an H100 by prompt length, attention share in orange. Four times the tokens costs a little over four times the time at short lengths and more at long ones.

:::note Chunked prefill
One 32k-token prefill would stall every other user's decode for most of a second. Engines such as vLLM split long prompts into chunks of a few thousand tokens interleaved with other requests' decode steps. Total work is unchanged; nobody's stream freezes.
:::

## 3. Decode

After prefill the model has logits for the first new token. Sampling picks one (greedy, temperature, top-k and top-p are covered in [Unit III](/octlm/training/)), and the second phase begins.

**Decode** generates one token per step from input of shape $(B, 1, d)$. In every layer the new token computes its query, key, and value, appends the key and value to the cache, attends over the whole cache, and passes one row through the MLP. The LM head yields one row of logits, sampling picks the next token, and the step repeats, reusing everything about earlier tokens.

@fig inf_decode_step | One decode step: one new row goes up through the layers, reading every weight once and the whole cache once, and comes out as one token.

### Decode latency and tokens per second

Step time is the **inter-token latency**; its inverse is the **tokens per second** one user sees. At batch 1, Llama 3 8B must read all 7,504,924,672 bf16 parameters it multiplies by, about 15.0 GB, which takes at least 4.48 ms at 3.35 TB/s: no H100 exceeds about 223 tokens per second for one user. The cache adds to the bill as context grows:

| Context | Bytes per step | Lower bound | Tokens/s, at best |
|---|---|---|---|
| 2,048 | 15.28 GB | 4.56 ms | 219 |
| 8,192 | 16.08 GB | 4.80 ms | 208 |
| 32,768 | 19.30 GB | 5.76 ms | 174 |
| 131,072 | 32.19 GB | 9.61 ms | 104 |

### Why decode is memory-bandwidth heavy

Each decode step reads a 2-byte weight and does one multiply-add with it, 2 operations. Operations per byte moved is **arithmetic intensity**, and batch-1 decode sits at 1. An H100 needs about $989.4 / 3.35 = 295$ operations per byte to keep its multipliers busy, so at intensity 1 they idle more than 99% of the time. Decode is **memory-bandwidth bound**.

Chapter 2 used this to motivate grouped-query attention ([Section 17](/octlm/modern-arch/04-gqa/#s17)), and it predicts which optimizations work. Fewer bytes per token (smaller caches, quantized weights) speed decode almost one for one; less arithmetic does almost nothing. Batching works because it raises intensity: at batch 64, each weight byte serves 64 tokens.

@fig inf_roofline | A roofline for the H100. Below 295 operations per byte, speed is capped by bandwidth; above it, by arithmetic. Batch-1 decode sits far down the slope; long-prompt prefill sits on the flat roof.

:::interview Interview lens
**"Why is LLM decoding memory-bound while prefill is compute-bound?"** In prefill each weight read is used against every prompt token, thousands of operations per byte, so arithmetic is the limit. In decode each 2-byte weight does one multiply-add for one token, about 1 operation per byte against an H100 balance near 295. Step time is the time to stream weights and cache from HBM, about 4.5 ms for Llama 3 8B, which is why quantization, GQA, and batching help decode and faster matmul kernels mostly do not.
:::

## 4. Why Naive Autoregressive Inference Is Wasteful

Chapter 1's cache-free generation ([Section 58](/octlm/attention/11-kv-cache/#s58)) reruns the whole sequence to produce each token and keeps only the last row of logits. It works and repeats almost all its work.

**Reprocessing the entire context.** With a 1,000-token prompt and a 500-token reply, the naive loop processes 1,000, then 1,001, up to 1,499 tokens: $500 \times 1{,}000 + (0 + 1 + \dots + 499) = 624{,}750$ positions. A cached loop processes the prompt once and then one token per step, 1,499 positions. The naive loop does about 417 times the work, all of it reproducing existing numbers.

**Recomputing old K and V.** Position 37's key in layer 12 depends only on tokens 0 to 37, so it never changes, yet the naive loop recomputes it every step: 623,251 unnecessary key and value rows per layer here.

**Growing context length and increasing attention cost.** At length $t$ the naive step also redoes all $t(t+1)/2$ attention scores when only the newest row of $t$ is new, so per-step cost grows quadratically and generation keeps slowing down.

@fig inf_naive_waste | The work of the naive loop. Each step reprocesses the whole prefix (grey); only the newest row (orange) is new. The cached loop computes only the orange cells.

**Motivation for caching.** The repeated numbers are keys and values of old positions, which never change. Store them once and each step needs only the new row. Part II puts that into practice.

:::warn Watch out
Keep the naive loop in your tests as the reference a cached implementation must match exactly (Section 8). Never ship it, and never report a speed-up measured against it; every serious stack already caches.
:::

:::key In one breath
Training predicts every position of a known sequence in one pass; inference generates autoregressively. A request splits into **prefill**, one compute-bound pass that builds the KV cache and sets the **time to first token**, and **decode**, single-token passes whose **inter-token latency** is set by how fast weights and cache can be read. For Llama 3 8B on an H100, a 2,048-token prefill takes at least 32.2 ms and each decode step at least 4.48 ms, because every 2-byte weight does one multiply-add, intensity 1 against a balance point of 295. Batching trades per-user latency for throughput, and the cache-free loop does about 417 times the necessary work for a 1,000-token prompt and 500-token reply.
:::

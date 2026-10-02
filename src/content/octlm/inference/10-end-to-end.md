@part X | End-to-End Real LLM Inference | Every piece is now built and tested on its own. This part puts them in a row and runs one real chat turn through Qwen3-0.6B, from the folder of files on disk to the decoded reply, with the shape, size and cost of every stage. Then it measures the result properly and ends with the checklist that separates an inference stack that seems to work from one you can prove works. | where:10

## 56. Loading a Real Model From Scratch

The Qwen3-0.6B release is a folder of files, and each one feeds one stage of the pipeline.

| File | Size | Feeds |
|---|---|---|
| `config.json` | 726 bytes | the architecture (Part V) |
| `model.safetensors` | 1,503,300,328 bytes | the weights (Part VI) |
| `tokenizer.json` | 11,422,654 bytes | normalizer, pre-tokenizer, vocabulary, merges (Part VIII) |
| `tokenizer_config.json` | | special tokens and the chat template (Parts VIII, IX) |
| `generation_config.json` | | stop tokens and default sampling settings |

Loading from scratch is six steps, each covered earlier. **Read config** into a dataclass, taking `head_dim` literally. **Construct architecture** from it on the meta device. **Load safetensors** tensor by tensor and **map parameters** by name, tying the LM head. **Load tokenizer** from `tokenizer.json` and its template from `tokenizer_config.json`. **Load generation settings** from `generation_config.json`, which for Qwen3-0.6B says: stop on 151645 or 151643, pad with 151643, and sample with temperature 0.6, top-k 20 and top-p 0.95.

@fig inf_checkpoint_folder | The checkpoint folder and what each file becomes. Two files make the model, two make the text processing around it, one sets how it generates.

The generation settings are easy to forget and matter more than they look. They are the model authors' tested defaults, and for Qwen3 the model card adds a different set for non-thinking mode (temperature 0.7, top-p 0.8). How temperature, top-k and top-p work is the subject of the training chapter's decoding part ([Unit III](/octlm/training/)).

## 57. Preparing a Prompt

Part IX covered this in full; here are the steps in the order the pipeline runs them. **Message objects**: a system message and one user question. **Chat template**: rendered with `add_generation_prompt=True` and thinking on, 138 characters of text. **Tokenization**: 26 token IDs, starting `151644, 8948, 198` and ending `151644, 77091, 198`. **Input IDs**: a tensor of shape (1, 26). **Position IDs**: 0 to 25, all real tokens, so the plain count works; with batching, from the attention mask (Section 51).

## 58. Running Prefill

The 26 IDs go into the model in one forward pass.

**Embeddings**: the 26 IDs select 26 rows of the 151,936 by 1,024 table, giving $(1, 26, 1{,}024)$. **Layer-by-layer forward pass**: 28 times, RMSNorm, attention with QK-norm and RoPE at positions 0 to 25, the residual add, RMSNorm, SwiGLU, the residual add. **Building KV caches**: as each layer computes its keys and values, they are written into its cache, $(1, 8, 26, 128)$ for keys and the same for values, 56 tensors holding 2,981,888 bytes in all. **Final logits**: the last position's hidden state goes through the final norm and the LM head, giving one row of 151,936 logits; the other 25 positions are skipped (Section 2). **Selecting first generated token**: sampling, or argmax for a test, picks the first token of the reply. In thinking mode that token is `<think>` (151667).

The whole prefill is about $2.33 \times 10^{10}$ floating-point operations: 440,401,920 matmul weights times 26 tokens times 2, plus the LM head for one position and a little attention. At an H100's peak that is 0.024 ms. Real prefill of a prompt this short takes far longer, because a small model on a big GPU is limited not by arithmetic or bandwidth but by the fixed cost of launching hundreds of small kernels one after another. Serving stacks remove most of that with CUDA graphs, which record the whole sequence of kernels once and replay it.

@fig inf_prefill_trace | The prefill of the running prompt, with every shape. Twenty-six IDs become a (1, 26, 1,024) block that climbs 28 layers, filling the cache on the way; one row comes out the top as 151,936 logits.

## 59. Running Decode

From the first generated token on, every step is the same. **New token**: its ID is looked up in the embedding table, $(1, 1, 1{,}024)$. **Position update**: the first new token is at position 26, the next at 27, and so on, always equal to the cache length before appending. **Cached attention**: in each layer the token's query attends over the 26, then 27, then 28 cached rows (Section 7). **Append new K/V**: each layer's cache grows by one row per step, 114,688 bytes per token in total. **Generate next logits**: one row of 151,936. **Repeat** until a stop condition.

The cost of each step is set by reading the weights. Qwen3-0.6B's 1.19 GB at an H100's 3.35 TB/s is at least 0.36 ms per token, at most about 2,810 tokens per second for one stream. On a laptop whose memory delivers 100 GB/s, it is at least 11.9 ms per token, at most about 84 tokens per second. In both cases the bound is the bytes, which is why Part IV's 4-bit weights would make the laptop nearly four times faster (1.19 GB down to 0.31 GB).

### Stopping

Generation stops on the first of four conditions: the model emits `<|im_end|>` (151645), the end of its turn; it emits `<|endoftext|>` (151643); the reply reaches a maximum length you set; or a stop string you configured appears in the decoded text. The stop token itself is not shown to the user. Without a length limit, a model that never emits its end-of-turn token (the result of most template bugs in Section 55) generates until the context window is full.

```python
ids = tok.encode(prompt_text)                         # 26 IDs
cache = model.new_cache(max_len=4096)
logits = model(torch.tensor([ids]), cache=cache, pos=0)[:, -1]     # prefill
out = []
for step in range(max_new_tokens):
    nxt = sample(logits, temperature=0.6, top_k=20, top_p=0.95)    # one ID
    if nxt in (151645, 151643):
        break
    out.append(nxt)
    pos = len(ids) + len(out) - 1                     # 26 on the first step
    logits = model(torch.tensor([[nxt]]), cache=cache, pos=pos)[:, -1]
text = stream_decode(out)                             # buffered UTF-8
think, answer = split_on_last(out, 151668)            # </think>
```

## 60. The Complete Inference Pipeline

Here is the whole path from messages to text, as one diagram, with the running example's numbers at every stage.

@fig inf_full_pipeline | The complete inference pipeline for one chat turn of Qwen3-0.6B. Each box is a part of this chapter; the loop on the right runs once per generated token until an end-of-turn token or a length limit stops it.

The same chain in text form, as an outline you could implement top to bottom:

```text
messages                    2 messages (system, user)
  v  chat template          138 characters, generation prompt added
  v  tokenizer              26 token IDs, (1, 26)
  v  prefill                one pass, 28 layers
  v  KV cache               56 tensors, (1, 8, 26, 128), 2,981,888 bytes
  v  first-token logits     (1, 151936)
  v  sampling               temperature 0.6, top-k 20, top-p 0.95
  v  new token              position 26
  v  decode with cache      one row per step, cache +114,688 bytes
  v  sampling               ... repeat ...
  v  EOS / stop condition   151645 or 151643, or max length
  v  decoded text           buffered UTF-8, reasoning split at 151668
```

Each arrow is a place where Parts I to IX found a bug class: template and tokenizer mismatches above the model, shape and mapping errors inside it, cache and position errors in the loop, and stop and decoding errors below it.

## 61. Measuring Real LLM Inference

A measurement is only useful if it names what was measured, under what conditions. These are the standard numbers, and how to get each one.

| Metric | Definition | How to measure |
|---|---|---|
| **Time to first token** | request received to first token out | wall clock around template, tokenize, prefill, sample |
| **Inter-token latency** | time between consecutive tokens | median and 99th percentile over the reply |
| **Tokens per second** | generated tokens / decode time, per stream | exclude prefill; report batch size |
| **Prefill throughput** | prompt tokens / prefill time | fixed prompt length, after warm-up |
| **Decode throughput** | all generated tokens / time, across the batch | at a stated batch size and context |
| **Peak memory** | highest memory allocated during the run | `torch.cuda.max_memory_allocated()` |
| **KV-cache memory** | $2 L H_{kv} d_h S b B$ | compute it, then confirm against peak memory |
| **Model-loading time** | process start to ready | cold and warm file cache, separately |

Three habits make the numbers mean something. Warm up first: the first run includes kernel compilation, memory allocation and file caching, and can be many times slower. Synchronize before reading the clock: GPU work is asynchronous, so `time.perf_counter()` without `torch.cuda.synchronize()` measures how fast Python queued the work, not how fast it ran. And report the conditions: model, dtype, batch size, prompt length, generated length, context, hardware and software versions.

```python
torch.cuda.synchronize(); t0 = time.perf_counter()
logits = model(prompt_ids, cache=cache, pos=0)[:, -1]
torch.cuda.synchronize(); t1 = time.perf_counter()            # prefill done
for _ in range(n_new):
    logits = model(next_ids(logits), cache=cache, pos=cache.len)[:, -1]
torch.cuda.synchronize(); t2 = time.perf_counter()
print("TTFT ms", (t1 - t0) * 1e3, "decode tok/s", n_new / (t2 - t1))
print("peak GB", torch.cuda.max_memory_allocated() / 1e9)
```

Compare every measurement with its lower bound. For Qwen3-0.6B, the decode bound is 0.36 ms per token on an H100 and 11.9 ms on a 100 GB/s laptop; loading 1.5 GB from a disk that reads 3 GB/s takes at least 0.5 seconds. A measurement close to its bound means the code is efficient and only a smaller model, fewer bytes or more hardware will help. A measurement far from it means overhead, and the overhead is where to look.

@fig inf_metrics_timeline | Where each metric lives on the timeline of one request, from model load through prefill and decode to the last token, with memory drawn underneath.

## 62. Final Engineering Checklist

Each line is a claim, and each claim has a test from this chapter that proves it.

| Claim | Proved by | Section |
|---|---|---|
| **Architecture matches config** | parameter count equals the card and the checkpoint: 596,049,920 | 26 |
| **Tensor shapes match checkpoint** | every header shape equals its parameter's shape | 30, 33 |
| **Weight mapping is correct** | every parameter loaded exactly once; lm_head tied and checked | 32, 33 |
| **Logit parity passes** | max abs logit difference below tolerance, fp32 and bf16 | 37, 40 |
| **Tokenizer matches checkpoint** | IDs equal the reference tokenizer's on a multilingual corpus; round trips exact | 42, 46 |
| **Chat template matches training format** | rendered prompts equal the reference template's, token for token | 50, 55 |
| **Cached and uncached outputs agree** | token and logit parity over 100 decode steps | 8, 41 |
| **Quantized model is re-evaluated** | size, memory, speed, KL and task scores against bf16 | 23 |
| **Generation terminates correctly** | stops on 151645 and 151643, respects max length, stop token hidden | 59 |

@fig inf_checklist_card | The nine claims as a card to pin above the desk. Each one is a test, not a feeling.

The order matters. Shapes before parity, because a shape error makes parity meaningless. Logit parity before generation parity, because a single-pass bug hides inside generation noise. Tokenizer and template before any quality evaluation, because a wrong prompt makes a correct model look bad. Quantization last, because it is a deliberate change that must be measured against a baseline already proved correct.

### What this chapter did not cover

Everything here served one request at a time on one device. Production serving adds a layer above it: **continuous batching**, which adds and removes requests from the running batch at every decode step instead of waiting for a whole batch to finish; **speculative decoding**, which lets a small model guess several tokens that the large model verifies in a single pass; **tensor and pipeline parallelism**, which split a model too large for one GPU across several; and the scheduling, admission and memory management that frameworks like vLLM, SGLang and TensorRT-LLM implement. Each of them is built from the pieces in this chapter, the cache, the kernels, the memory arithmetic and the parity tests, and each is a natural next chapter.

:::interview Interview lens
**"You've written your own inference code for an open-weights model. How do you convince me it's correct?"** I'd show a chain of checks, each one a test. The architecture is rebuilt from the config and its parameter count matches the card and the checkpoint exactly; every tensor in the file maps to one parameter with the right shape, and every parameter was loaded once. Logits match the Hugging Face reference to about $10^{-5}$ in fp32 and within a few bf16 steps in bf16, position by position, and greedy generation matches token for token, both against the reference and between my cached and uncached loops. Tokenizer IDs and rendered chat prompts match the reference's exactly, and generation stops on the model's end-of-turn token. Only after all that would I quantize, and I'd re-measure quality and speed against the proven bf16 baseline.
:::

:::key In one breath
A release is five files: `config.json` builds the architecture, `model.safetensors` fills it, `tokenizer.json` and `tokenizer_config.json` turn messages into IDs through the chat template, and `generation_config.json` sets the stop tokens (151645, 151643) and sampling defaults. One chat turn of Qwen3-0.6B renders to 26 IDs, prefills in one pass of about $2.33 \times 10^{10}$ operations that fills 56 cache tensors with 2,981,888 bytes and produces one row of 151,936 logits, then decodes one token per step at positions 26, 27 and on, each step bounded by reading 1.19 GB of weights (0.36 ms on an H100, 11.9 ms at 100 GB/s), until an end-of-turn token or a length limit, and decodes the IDs with buffered UTF-8, splitting off reasoning at 151668. Measure TTFT, inter-token latency, prefill and decode throughput, peak and cache memory and load time after a warm-up, with synchronization, against their lower bounds; and prove correctness in order: config and parameter count, shapes and mapping, logit parity, generation parity, tokenizer and template equality, termination, and only then quantization.
:::

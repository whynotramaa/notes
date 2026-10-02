@part VI | Checkpoints and Loading | Part V rebuilt Qwen3-0.6B's architecture with random numbers in every weight. This part fills it with the real ones. We open the checkpoint file byte by byte, see how tensors are named and why the format refuses to run code, map every name in the file onto a parameter in our own model, and load them with the right dtype, on the right device, without running out of memory. Each step has a silent failure, and each gets a check. | where:6

## 30. Safetensors

### What a model checkpoint stores

A **checkpoint** is the trained numbers and nothing else: one tensor per parameter, each with a name, a shape and a data type. It does not contain the architecture. Nothing in the file says "this tensor is a query projection, multiply by it after the norm". That knowledge lives in the code, which is why Part V had to come first. Qwen3-0.6B's checkpoint is one file, `model.safetensors`, 1,503,300,328 bytes. Larger models split theirs across several **shards** plus a small `model.safetensors.index.json` that says which tensor lives in which shard; Llama 3 8B ships as four.

### The format

A safetensors file has three parts, in order. The first 8 bytes are an unsigned little-endian integer $N$, the length of the header. The next $N$ bytes are the header, plain JSON. Everything after that is raw tensor data, packed end to end. For Qwen3-0.6B, $N = 35{,}552$, and the data section is 1,503,264,768 bytes, so the file is $8 + 35{,}552 + 1{,}503{,}264{,}768 = 1{,}503{,}300{,}328$ bytes. Every byte is accounted for.

@fig inf_safetensors_layout | Qwen3-0.6B's checkpoint, drawn to its real proportions in three zooms. An 8-byte length, a 35,552-byte JSON header, then 1.5 GB of bf16 numbers packed end to end; each header entry points at its own slice.

The header maps each **tensor name** to its **tensor dtype**, its **tensor shape** and a pair of byte offsets into the data section. Here is the real entry for the first layer's query projection:

```text
"model.layers.0.self_attn.q_proj.weight": {
  "dtype": "BF16",
  "shape": [2048, 1024],
  "data_offsets": [647500288, 651694592]
}
```

The slice is $651{,}694{,}592 - 647{,}500{,}288 = 4{,}194{,}304$ bytes, exactly $2{,}048 \times 1{,}024 \times 2$. A loader can check that for every tensor before reading a single number. The header also has one optional entry, `__metadata__`, a map of strings; Qwen3's says only `{"format": "pt"}`. **Metadata** is free text for the framework, never code.

The header of Qwen3-0.6B lists 311 tensors, all bf16: 11 per layer for 28 layers, plus the embedding table, the final norm and `lm_head.weight`. Because the format is just offsets, you can read one tensor without touching the rest. The weight row used for the quantization example in Section 20 was fetched from the Hugging Face Hub with two HTTP range requests, first the 8-byte length and the header, then 2,048 bytes at the right offset, without downloading the 1.5 GB file.

### Why safetensors exists

PyTorch's traditional checkpoint, a `.bin` or `.pt` file written by `torch.save`, is a **pickle**: Python's general object serialization format. Unpickling does not just read data; it rebuilds objects by calling functions named in the file. A malicious file can name any function, including one that runs a shell command, and `torch.load` will call it. Loading an untrusted pickle checkpoint is running untrusted code.

**Safetensors**, released by Hugging Face in 2022, is the answer: a format that can only describe tensors. **Safe loading** follows from the design. The loader parses JSON and copies bytes, so there is nothing to execute. It is also fast: the data section can be memory-mapped, so tensors are read from disk only when touched, and with no copy when the dtype and device already match.

| | Pickle (`torch.save`) | Safetensors |
|---|---|---|
| Can run code when loaded | yes, by design | no |
| Read one tensor without reading the file | no | yes, by offset |
| Memory-mapped, zero-copy loading | no | yes |
| Stores arbitrary Python objects | yes (optimizer state, configs) | no, tensors and string metadata only |
| Header readable by any language | no | yes, JSON |

@fig inf_pickle_vs_safe | Opening the two kinds of file. A pickle hands the loader instructions to follow, and some instructions can be anything; a safetensors file hands it a table of contents and a block of bytes.

:::warn Watch out
Since PyTorch 2.6, `torch.load` defaults to `weights_only=True`, which refuses most code-running pickles, but older versions and explicit `weights_only=False` calls do not. Prefer safetensors for anything you download. If you must load a pickle, load it with `weights_only=True` and from a source you trust.
:::

## 31. State Dictionaries

A PyTorch model keeps its parameters inside a tree of modules. A **state dictionary** flattens that tree into a dictionary from **parameter names** to tensors. The names are built from **nested module names**: the attribute path from the root module to the parameter, joined with dots. In Hugging Face's Qwen3, the root `Qwen3ForCausalLM` has a `model` attribute, which has a `layers` list, whose entry 0 has a `self_attn` attribute, which has a `q_proj` linear layer, which has a `weight`. So that tensor is `model.layers.0.self_attn.q_proj.weight`. The checkpoint's tensor names are exactly these state-dict keys.

@fig inf_module_tree | How a tensor gets its name. The path from the root module down to the parameter, joined with dots, is the key in the state dict and the name in the checkpoint.

**Mapping names to tensors** is all a state dict does, and **loading state dictionaries** is the reverse: `model.load_state_dict(sd)` walks the dictionary and copies each tensor into the parameter with the same name. With the default `strict=True` it also compares the two sets of names and reports three kinds of problem.

**Missing keys** are parameters your model has that the dictionary does not. If you built your model with `q_norm` and `k_norm` but load a Qwen2.5 checkpoint, those 56 tensors are missing, and with `strict=False` they keep their random initial values. **Unexpected keys** are tensors in the dictionary your model has no place for. Load Qwen3 into a model built Qwen2.5-style and the 56 norm weights are unexpected; load it into a model whose LM head is tied and has no separate parameter, and `lm_head.weight` is unexpected. **Shape mismatches** are names that match with shapes that do not, and PyTorch raises an error for them even with `strict=False`. The head-size bug of Section 26 shows up here: `q_proj.weight` expected (1,024, 1,024), found (2,048, 1,024).

The dangerous habit is `strict=False` to "make the errors go away". Missing keys then silently keep random values, and the model runs. Use `strict=False` only when you have listed every expected missing or unexpected key and checked the list matches.

## 32. Weight Mapping

### Reference model naming vs our model naming

Our model does not have to use Hugging Face's names, and usually does not. The job of **weight mapping** is a function from each name in the checkpoint to the name and layout of a parameter in our model. For Qwen3 and the model we built in Section 26:

| Checkpoint (reference) name | Our name | Transform |
|---|---|---|
| `model.embed_tokens.weight` | `tok_emb.weight` | none |
| `model.layers.{i}.input_layernorm.weight` | `layers.{i}.norm1.weight` | none |
| `model.layers.{i}.self_attn.q_proj.weight` | `layers.{i}.wq.weight` | none (both (out, in)) |
| `model.layers.{i}.self_attn.k_proj.weight`, `v_proj` | `layers.{i}.wk.weight`, `wv` | none |
| `model.layers.{i}.self_attn.q_norm.weight`, `k_norm` | `layers.{i}.q_norm.weight`, `k_norm` | none |
| `model.layers.{i}.self_attn.o_proj.weight` | `layers.{i}.wo.weight` | none |
| `model.layers.{i}.post_attention_layernorm.weight` | `layers.{i}.norm2.weight` | none |
| `model.layers.{i}.mlp.gate_proj.weight`, `up_proj`, `down_proj` | `layers.{i}.gate.weight`, `up`, `down` | none |
| `model.norm.weight` | `norm_f.weight` | none |
| `lm_head.weight` | (tied to `tok_emb.weight`) | skip, after checking equality |

**Mapping layer by layer** is a loop over $i$ from 0 to 27 that fills in the pattern, plus the three global tensors. Write the mapping as data, not as scattered code, so you can print it, count it (311 entries, one skipped) and diff it against the checkpoint's key list.

@fig inf_name_mapping | The mapping for one layer. Eleven checkpoint names on the left, eleven parameters of our model on the right; every one maps one to one with no transform, because our model also stores weights output size first.

### Transposition issues

Our model used `nn.Linear`, which stores weights as (out, in), the same as the checkpoint, so nothing is transposed. If your model stores a weight as (in, out) and computes `x @ W`, every projection must be transposed when loaded. A real example: Hugging Face's GPT-2 uses a `Conv1D` layer that stores (in, out), so porting GPT-2 into `nn.Linear` code needs transposes and porting Llama does not.

Most wrong transposes fail loudly. `q_proj` is (2,048, 1,024); its transpose is (1,024, 2,048) and the copy raises a shape error. But `k_proj` and `v_proj` are square, (1,024, 1,024), and so are many matrices in many models. A transposed square matrix loads without complaint and computes nonsense. The only defence is a numerical check against the reference, which is Part VII.

@fig inf_transpose_trap | A wrong transpose. For a rectangular matrix like q_proj the shapes disagree and loading fails; for a square one like k_proj the shapes agree, loading succeeds and every output is wrong.

### Concatenated vs separate QKV matrices

Some implementations, including many fast ones, fuse the three input projections into a single matrix so one matmul produces $q$, $k$ and $v$. For Qwen3-0.6B the fused weight has $2{,}048 + 1{,}024 + 1{,}024 = 4{,}096$ rows: rows 0 to 2,047 are $W_Q$, rows 2,048 to 3,071 are $W_K$, rows 3,072 to 4,095 are $W_V$. Loading means concatenating the three checkpoint tensors along dimension 0 in that order, and the forward pass splits the output at 2,048 and 3,072. The same applies to fusing `gate_proj` and `up_proj` into one (6,144, 1,024) matrix. Concatenating in a different order than the forward pass splits is another bug that loads cleanly.

### GQA-specific shapes

With grouped-query attention the three blocks are not the same size. Code written for multi-head attention often assumes a fused QKV of $3 \times 2{,}048$ rows, or splits the output into three equal parts. For Qwen3 the split is 2,048, 1,024 and 1,024. A loader that respects GQA takes the sizes from $H \cdot d_h$ and $H_{kv} \cdot d_h$, never from the width.

@fig inf_fused_qkv | Fusing q_proj, k_proj and v_proj into one matrix for Qwen3-0.6B. Under GQA the blocks are 2,048, 1,024 and 1,024 rows, not three equal thirds.

### Embedding and LM-head handling

Qwen3-0.6B's config says `tie_word_embeddings: true`: one matrix serves as both the embedding table and the LM head ([Chapter 1, Section 14](/octlm/attention/02-embeddings/#s14)). Yet its checkpoint contains both `model.embed_tokens.weight` and `lm_head.weight`, two full copies, 311,164,928 bytes of duplication, a fifth of the file. Comparing the stored bytes of row 0 and of row 9,707, the embedding of the token "Hello", the two copies are identical.

The right handling is to load the embedding, make the LM head point at the same tensor (`model.lm_head.weight = model.tok_emb.weight`), and skip `lm_head.weight` after checking, once, that it equals the embedding. If you load both into separate parameters instead, the model works but uses 311 MB more memory, and if you ever fine-tune it the two copies drift apart and the tie is broken. If a checkpoint for a tied model contains only the embedding, the LM head must be tied explicitly or it stays random.

@fig inf_tied_head | One matrix, two jobs. The checkpoint stores it twice under two names; the loader keeps one copy and points the LM head at it.

## 33. Loading Pretrained Weights

With the mapping in hand, loading is a fixed sequence. Doing the steps in this order avoids every failure from Sections 31 and 32.

1. **Instantiate architecture first**, from the config, on the `meta` device, so no memory is allocated for random weights that will be thrown away.
2. **Load tensors** from the safetensors file, one at a time with `safe_open`, or all at once with `load_file`.
3. **Match dtype**: keep bf16 for inference unless you have a reason not to (Section 34).
4. **Match device**: load straight onto the GPU if that is where the model will run.
5. **Copy parameters**: map each name and assign the tensor to its parameter.
6. **Validate every shape**, and check that every parameter was filled exactly once.
7. **Freeze weights for inference**: no gradients, evaluation mode.

```python
from safetensors import safe_open

with torch.device("meta"):
    model = Qwen3(cfg)                                    # shapes only, no memory
params = dict(model.named_parameters())
seen = set()
with safe_open("model.safetensors", framework="pt", device="cuda") as f:
    for ckpt_name in f.keys():
        ours = mapping(ckpt_name)                         # None for lm_head.weight
        if ours is None:
            continue
        t = f.get_tensor(ckpt_name)                       # bf16, on the GPU
        assert t.shape == params[ours].shape, (ckpt_name, t.shape)
        set_param(model, ours, nn.Parameter(t, requires_grad=False))
        seen.add(ours)
model.lm_head.weight = model.tok_emb.weight               # tie
assert seen == set(params) - {"lm_head.weight"}, set(params) - seen
model.eval()
```

The last assertion is the one people skip. It proves that every parameter of our model came from the file and none was left at its initial value, which `strict=False`, or a missed name in a hand-written loop, would otherwise hide. Run generation under `torch.inference_mode()`, which turns off gradient tracking entirely.

@fig inf_load_steps | Loading, in order. Build the shapes on the meta device, stream tensors from the file straight to the GPU, check each shape, tie the head, prove every parameter was filled, freeze.

## 34. Dtype and Device Handling

### CPU loading and GPU transfer

By default, `load_file` and `torch.load` put tensors on the CPU. **CPU loading** then **GPU transfer** with `.to("cuda")` works, but it holds the weights in CPU memory first and copies them across the bus. Loading straight to the GPU, with `device="cuda"` in safetensors, skips the round trip. Either way, every tensor that takes part in one operation must be on the same device, or PyTorch raises a **device mismatch error** such as "Expected all tensors to be on the same device, but found at least two devices, cuda:0 and cpu!". The usual culprits are buffers created in `__init__` rather than registered with `register_buffer` (they do not move with `.to()`), RoPE tables built on the CPU, and input IDs that were never moved.

### FP32 vs FP16/BF16 checkpoints

Qwen3-0.6B is stored in bf16, as the config's `torch_dtype` says. Load it into a model created in the default fp32 and PyTorch upcasts every tensor on copy: the numbers are the same, the memory doubles to 2.38 GB, and the arithmetic slows down. Inference should run in the checkpoint's dtype unless you are deliberately testing in fp32 (Section 40). fp16 is a poor substitute for bf16 here: values above 65,504 overflow, and a model trained in bf16 can produce activations that large.

### Casting

**Casting** inside the forward pass is deliberate in a few places. RMSNorm upcasts its input to fp32 to compute the mean of squares and casts back, because summing 1,024 squares in bf16 loses precision. RoPE's cos and sin tables are computed in fp32 ([Chapter 2, Section 3](/octlm/modern-arch/01-rope/#s3)). Softmax inside attention kernels accumulates in fp32. Copy those choices from the reference exactly; a missing upcast is a classic small parity failure.

### Memory-conscious loading

Count the bytes for Qwen3-0.6B. The naive path builds the model in fp32 with random weights, 2,384,199,680 bytes, then loads the whole file into a state dict, 1,503,264,768 bytes more, for a peak of 3.89 GB before anything is freed, and it ends with an fp32 model twice the size it needs to be. The careful path builds on `meta`, streams tensors one at a time in bf16 straight to the GPU, and skips the duplicate head: the peak is the model itself, 1,192,099,840 bytes. For an 8B model the same difference is 48 GB against 16 GB, which decides whether loading works on a given machine at all.

@fig inf_load_memory | Peak memory while loading Qwen3-0.6B. Random fp32 weights plus a full state dict peak at 3.89 GB; meta-device construction plus streaming bf16 tensors peaks at the model's own 1.19 GB.

:::interview Interview lens
**"Walk me through loading a Hugging Face checkpoint into your own PyTorch implementation."** Build the model from the config on the meta device so nothing random is allocated, then open the safetensors file and, for each tensor name, map it to my parameter name, check the shape, and assign it in the checkpoint's dtype on the target device. I handle the model-specific cases explicitly: transposes if my layout differs, concatenation order for fused QKV with GQA's unequal block sizes, and tying the LM head to the embedding instead of loading a second copy. Then I assert that every one of my parameters was loaded exactly once, put the model in eval and inference mode, and only then move on to proving parity against the reference.
:::

:::key In one breath
A checkpoint stores named tensors and no code; a safetensors file is an 8-byte header length, a JSON header mapping each name to dtype, shape and byte offsets, and packed raw data (Qwen3-0.6B: $8 + 35{,}552 + 1{,}503{,}264{,}768$ bytes, 311 bf16 tensors), which makes loading safe, lazy and memory-mappable where pickles can run arbitrary code. Names are dotted module paths from the state dict, and `load_state_dict` reports missing keys, unexpected keys and shape mismatches, so loading means a written-down mapping from reference names to ours, with explicit transposes, GQA-sized fused QKV blocks (2,048, 1,024, 1,024), and a tied LM head that skips the checkpoint's duplicate 311 MB copy. Build on the meta device, stream tensors in the stored bf16 straight to the device, assert every shape and every parameter filled exactly once, keep the reference's fp32 upcasts in norms, RoPE and softmax, and freeze: peak memory falls from 3.89 GB to 1.19 GB.
:::

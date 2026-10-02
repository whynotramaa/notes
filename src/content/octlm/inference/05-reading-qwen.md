@part V | Reading a Real Model: Qwen3 | Chapter 2 ended with a block you could build yourself. A real pretrained model is that same block, written down by someone else, with their names, their conventions and a few choices of their own. This part reads Qwen3-0.6B from its `config.json` alone: maps every concept we know onto its names, reconstructs every tensor shape, counts every parameter, and looks closely at the two places where Qwen3 differs from the textbook block. | where:5

## 24. From Our Transformer to Qwen

Download Qwen3-0.6B and you get a folder of files. The one that describes the architecture is a 726-byte `config.json`. Everything else in this part is read out of it. Before reading it, it helps to see that nothing in Qwen3 is new to you. **Mapping known Transformer concepts onto Qwen** is mostly a matter of names.

| Concept | Where this book taught it | Qwen3-0.6B |
|---|---|---|
| **Decoder-only architecture** | [Chapter 1, Part XII](/octlm/attention/12-decoder-block/#s63) | `Qwen3ForCausalLM`, 28 layers |
| **RMSNorm** | [Chapter 2, Part II](/octlm/modern-arch/02-rmsnorm/#s8) | pre-norm, $\varepsilon = 10^{-6}$, plus a final norm |
| **RoPE** | [Chapter 2, Part I](/octlm/modern-arch/01-rope/#s1) | base 1,000,000, half-split `rotate_half` |
| **GQA** | [Chapter 2, Part IV](/octlm/modern-arch/04-gqa/#s18) | 16 query heads, 8 key/value heads |
| **SwiGLU** | [Chapter 2, Part III](/octlm/modern-arch/03-swiglu/#s12) | `gate_proj`, `up_proj`, `down_proj`, width 3,072 |
| **Residual connections** | [Chapter 1, Section 65](/octlm/attention/12-decoder-block/#s65) | two per layer, around attention and MLP |
| **LM head** | [Chapter 1, Section 68](/octlm/attention/12-decoder-block/#s68) | tied to the embedding table |

There is one addition the textbook block does not have, a small RMSNorm applied to each query and key head, which Section 28 covers. Otherwise, if you can draw the block from Chapter 2, you can draw Qwen3.

@fig inf_qwen_block | One Qwen3 decoder layer with its Hugging Face module names. The orange stream is the residual; the only part not in Chapter 2's block is the pair of small norms on q and k.

:::note The Qwen family
Qwen is Alibaba Cloud's model family. Qwen2 (2024) and Qwen2.5 (September 2024) used biases on the query, key and value projections and no query/key norm; Qwen3 (April 2025) dropped those biases and added the norm. That is a good reason to read the config and code of the exact version you are porting rather than assuming one Qwen is like another.
:::

## 25. Reading a Model Configuration

Here is the whole `config.json` of Qwen3-0.6B, as published. Read it top to bottom and each key either confirms something you expected or tells you something you could not have guessed.

```text
{
  "architectures": ["Qwen3ForCausalLM"],
  "attention_bias": false,
  "attention_dropout": 0.0,
  "bos_token_id": 151643,
  "eos_token_id": 151645,
  "head_dim": 128,
  "hidden_act": "silu",
  "hidden_size": 1024,
  "initializer_range": 0.02,
  "intermediate_size": 3072,
  "max_position_embeddings": 40960,
  "max_window_layers": 28,
  "model_type": "qwen3",
  "num_attention_heads": 16,
  "num_hidden_layers": 28,
  "num_key_value_heads": 8,
  "rms_norm_eps": 1e-06,
  "rope_scaling": null,
  "rope_theta": 1000000,
  "sliding_window": null,
  "tie_word_embeddings": true,
  "torch_dtype": "bfloat16",
  "use_cache": true,
  "use_sliding_window": false,
  "vocab_size": 151936
}
```

**Vocabulary size**, `vocab_size`, is 151,936: the number of rows in the embedding table and the LM head. It is not the number of tokens the tokenizer knows, which is 151,669 (Part VIII); the remaining 267 rows are padding, kept so the matrix dimension is a multiple of 128, which suits GPU kernels. **Hidden size**, `hidden_size`, is the residual width $d = 1{,}024$. **Number of layers**, `num_hidden_layers`, is 28. **Attention heads**, `num_attention_heads`, is 16 query heads, and **KV heads**, `num_key_value_heads`, is 8. **Intermediate size**, `intermediate_size`, is the SwiGLU width, 3,072. `head_dim` is 128, which Section 26 will make a fuss about.

**Maximum sequence length**, `max_position_embeddings`, is 40,960. Qwen3 uses RoPE and has no position table, so this number is not a hard limit of the weights; it is the length the authors configured, and the model card states a context length of 32,768. When the two disagree, trust the card for quality and the config for what the code will accept. **RoPE parameters** are `rope_theta`, the base, 1,000,000 (Llama 3 uses 500,000; Finch-24 uses 10,000), and `rope_scaling`, null here, meaning no context stretching is applied ([Chapter 2, Section 6](/octlm/modern-arch/01-rope/#s6)). The **normalization epsilon**, `rms_norm_eps`, is $10^{-6}$, ten times smaller than Finch-24's.

The **token IDs** at the top need care. `bos_token_id` is 151643, `<|endoftext|>`, but Qwen3's tokenizer does not add it to prompts (`add_bos_token` is false). `eos_token_id` is 151645, `<|im_end|>`, the end-of-turn marker of the chat format. The separate `generation_config.json` lists both 151645 and 151643 as stopping tokens and sets 151643 as the padding ID. Part IX explains why a chat model stops on end-of-turn.

The rest is housekeeping: `attention_bias: false` (no bias on the projections), `hidden_act: "silu"` (the gate's activation), `tie_word_embeddings: true` (the LM head reuses the embedding table), `torch_dtype: "bfloat16"` (the dtype the weights were saved in), and the three sliding-window keys, which together say "no sliding window in any layer".

@fig inf_config_map | Every architectural key in the config, numbered, and the part of the model it controls. These ten keys fix the whole architecture.

:::warn Watch out
Configs are not uniform across model families, and missing keys get default values from the library's config class. Llama's config has no `head_dim` in older releases; Qwen3's has one that differs from the default. Mistral's has `sliding_window`; some models have `partial_rotary_factor`, applying RoPE to only part of each head. Read the config class in the reference code, not just the JSON, so you know what every absent key defaults to.
:::

## 26. Reconstructing Architecture From Config

**Building layers from configuration values** means writing a constructor that takes nothing but the config and produces every module with the right shape. Here is the skeleton for Qwen3, in our own naming:

```python
@dataclass
class Cfg:
    vocab: int = 151936; d: int = 1024; n_layers: int = 28
    n_heads: int = 16; n_kv: int = 8; d_head: int = 128
    d_ff: int = 3072; theta: float = 1e6; eps: float = 1e-6; tied: bool = True

class Layer(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.wq = nn.Linear(c.d, c.n_heads * c.d_head, bias=False)   # 1024 -> 2048
        self.wk = nn.Linear(c.d, c.n_kv * c.d_head, bias=False)      # 1024 -> 1024
        self.wv = nn.Linear(c.d, c.n_kv * c.d_head, bias=False)      # 1024 -> 1024
        self.wo = nn.Linear(c.n_heads * c.d_head, c.d, bias=False)   # 2048 -> 1024
        self.q_norm, self.k_norm = RMSNorm(c.d_head, c.eps), RMSNorm(c.d_head, c.eps)
        self.gate = nn.Linear(c.d, c.d_ff, bias=False)
        self.up = nn.Linear(c.d, c.d_ff, bias=False)
        self.down = nn.Linear(c.d_ff, c.d, bias=False)
        self.norm1, self.norm2 = RMSNorm(c.d, c.eps), RMSNorm(c.d, c.eps)
```

### Deriving head dimension

In Chapter 2 the head size was always $d / H$: Finch-24 has $512 / 8 = 64$, Llama 3 8B has $4{,}096 / 32 = 128$. Apply that rule to Qwen3-0.6B and you get $1{,}024 / 16 = 64$. The config says 128. Qwen3's attention runs at width $16 \times 128 = 2{,}048$, twice the residual width: the query projection widens from 1,024 to 2,048, and the output projection narrows back from 2,048 to 1,024. This is legal (nothing in attention requires the head width to divide the model width) and it is a classic porting trap. Code that computes `d_head = d // n_heads` builds a model whose weights will not load, and if someone "fixes" the load by reshaping, a model that runs and produces garbage. Rule: **if the config has `head_dim`, use it.**

@fig inf_headdim_trap | The head-size trap. Dividing the width by the heads gives 64 and a 1,024-wide attention; Qwen3 configures 128, so attention runs 2,048 wide and the projections widen and narrow.

### Deriving GQA grouping

The group size is $H / H_{kv} = 16 / 8 = 2$: query heads 0 and 1 share key/value head 0, heads 2 and 3 share head 1, and in general query head $i$ reads key/value head $\lfloor i / 2 \rfloor$. Expand with `repeat_interleave` or the expand-reshape helper, never with `.repeat` ([Chapter 2, Section 19](/octlm/modern-arch/04-gqa/#s19)).

### Computing tensor shapes and checking the count

Every shape follows from the config, and so does every parameter. Per layer:

| Piece | Parameters |
|---|---|
| $W_Q$: $1{,}024 \times 2{,}048$ | 2,097,152 |
| $W_K$, $W_V$: $1{,}024 \times 1{,}024$ each | 2,097,152 |
| $W_O$: $2{,}048 \times 1{,}024$ | 2,097,152 |
| q_norm, k_norm: 128 each | 256 |
| gate, up, down: $1{,}024 \times 3{,}072$ each | 9,437,184 |
| two RMSNorm gains: 1,024 each | 2,048 |
| **Layer total** | **15,730,944** |

Twenty-eight layers hold 440,466,432 parameters. The embedding table holds $151{,}936 \times 1{,}024 = 155{,}582{,}464$. The final norm adds 1,024, and the tied LM head adds nothing new. The total is **596,049,920**. The **parameter-count sanity check** is to compare this with the model card, which states 0.6B parameters, 0.44B of them non-embedding. Our count excluding the embedding table is 440,467,456. Both match.

@fig inf_param_ledger | Where Qwen3-0.6B's 596,049,920 parameters live. A quarter is the embedding table, which a large vocabulary makes expensive in a small model; within each layer the MLP holds 60% and attention 40%.

The sanity check is cheap and catches whole classes of mistakes. A `head_dim` of 64, from dividing the width by the heads, gives 507,965,952 instead. Forgetting the tie double-counts 155,582,464. An off-by-one in the layer count is out by 15,730,944. If your count matches the card to every digit you can check, the shapes are very likely right.

:::interview Interview lens
**"You're given a config.json for a model you've never seen. How do you rebuild it?"** Map each key to a module: vocab and hidden size give the embedding, the layer count gives the stack, heads and KV heads give the attention projections and GQA group, intermediate size and activation give the MLP, epsilon and RoPE base give the norms and rotary tables. Take `head_dim` from the config when present, because it need not equal hidden size over heads, as in Qwen3-0.6B where it is 128 instead of 64. Then count the parameters from those shapes and check the total against the model card and the checkpoint before loading anything.
:::

## 27. Real Model Tensor Shapes

PyTorch stores a linear layer's weight as $(\text{out features}, \text{in features})$, the transpose of the $x W$ convention used in this book's equations. The layer computes $x W^\top$. So every shape in the checkpoint reads "output size first". These are the shapes in Qwen3-0.6B's file, read from its header (Part VI):

| Tensor | Shape | Role |
|---|---|---|
| **Embedding weights**, `model.embed_tokens.weight` | (151,936, 1,024) | one row per token ID |
| **Q projection**, `self_attn.q_proj.weight` | (2,048, 1,024) | 16 heads of 128 |
| **K projection**, `self_attn.k_proj.weight` | (1,024, 1,024) | 8 heads of 128 |
| **V projection**, `self_attn.v_proj.weight` | (1,024, 1,024) | 8 heads of 128 |
| `self_attn.q_norm.weight`, `self_attn.k_norm.weight` | (128,) | per-head norm gain |
| **Output projection**, `self_attn.o_proj.weight` | (1,024, 2,048) | back to the residual width |
| **SwiGLU gate/up/down projections**: `mlp.gate_proj.weight`, `mlp.up_proj.weight` | (3,072, 1,024) | widen |
| `mlp.down_proj.weight` | (1,024, 3,072) | narrow |
| **Normalization weights**: `input_layernorm.weight`, `post_attention_layernorm.weight` | (1,024,) | pre-norm gains |
| `model.norm.weight` | (1,024,) | final norm |
| **LM head**, `lm_head.weight` | (151,936, 1,024) | same values as the embedding |

Per-layer tensors are prefixed `model.layers.N.` with $N$ from 0 to 27. Notice that `q_proj` and `o_proj` are not square and not transposes of each other's shape by accident: $(2{,}048, 1{,}024)$ and $(1{,}024, 2{,}048)$ are the widen-then-narrow pair from Section 26. In the head-split view, row block $128h$ to $128h + 127$ of `q_proj` produces query head $h$, and column block $128h$ to $128h + 127$ of `o_proj` consumes head $h$'s output. The LM head appears in the file even though it is tied; Section 32 deals with that.

@fig inf_linear_layout | How the checkpoint lays out heads. q_proj is stored (2,048, 1,024), output size first; each band of 128 rows makes one query head. o_proj is stored (1,024, 2,048); each band of 128 columns reads one head.

## 28. Qwen Attention Internals

Qwen3's attention is Chapter 2's attention with two deliberate differences. Walk through it with the shapes for a batch of $B$ sequences of $T$ tokens.

**Qwen query heads.** `q_proj` maps $(B, T, 1{,}024)$ to $(B, T, 2{,}048)$, viewed as $(B, T, 16, 128)$. **Qwen KV heads.** `k_proj` and `v_proj` each give $(B, T, 1{,}024)$, viewed as $(B, T, 8, 128)$. The **GQA layout** pairs query heads $2j$ and $2j + 1$ with key/value head $j$.

**Q/K normalization where applicable.** Qwen3 applies an RMSNorm with a learned 128-entry gain to every query head and every key head, after the projection and reshape and before RoPE. The same `q_norm` gain is shared by all 16 query heads, and the same `k_norm` gain by all 8 key heads. Its job is stability. Without it, the dot products $q \cdot k$ can grow large during training as the projection weights grow, pushing softmax into saturation ([Chapter 1, Section 40](/octlm/attention/07-scaled-dot-product/#s40)); normalizing each head's query and key bounds their lengths, so the scores cannot run away. Chapter 2 mentions QK-norm alongside the other norm placements in [Section 11](/octlm/modern-arch/02-rmsnorm/#s11). Values are not normalized. The bound is easy to compute. After RMSNorm with unit gains, a 128-wide head has root-mean-square 1, so its length is $\sqrt{128} \approx 11.31$; the scaled score $q \cdot k / \sqrt{128}$ is then at most $11.31 \times 11.31 / 11.31 = 11.31$ in magnitude, however large the projection weights grow. The learned gains decide how sharp attention is allowed to get.

@fig inf_qk_norm | What QK-norm does. Without it, query and key lengths can grow with the weights and scores grow with them; with it, every head is rescaled to a fixed length, √128 with unit gains, so scores stay bounded.

**RoPE application.** After the norm, queries and keys are rotated with base 1,000,000 using the half-split `rotate_half` convention, pairing dimension $i$ with $i + 64$ in each 128-wide head ([Chapter 2, Section 4](/octlm/modern-arch/01-rope/#s4)). Rotating all 128 dimensions, with 64 pair speeds from $1$ down to $10^{6 \times (-126/128)}$, about $1.2 \times 10^{-6}$ radians per position.

**Attention.** After transposing to $(B, 16, T, 128)$ and $(B, 8, T, 128)$, SDPA computes causal attention with scale $1 / \sqrt{128}$, with `enable_gqa` or after expanding keys and values. **Attention output projection.** The output $(B, 16, T, 128)$ is transposed back and flattened to $(B, T, 2{,}048)$, and `o_proj` maps it to $(B, T, 1{,}024)$ for the residual add.

@fig inf_qwen_attention | Qwen3-0.6B attention with every shape. The orange boxes are the two Qwen-specific steps: the per-head norms on q and k, and the 2,048-wide attention space that o_proj folds back to 1,024.

**Model-specific architectural details** to check in the reference code, every time: the order of norm and RoPE (norm first in Qwen3), whether the norm gain is per head or shared (shared), whether projections have biases (not in Qwen3; yes in Qwen2.5's q, k and v), and the RoPE pairing convention (half-split). Each of these produces a model that runs if you get it wrong.

```python
q = self.q_norm(self.wq(x).view(B, T, 16, 128)).transpose(1, 2)   # (B, 16, T, 128)
k = self.k_norm(self.wk(x).view(B, T, 8, 128)).transpose(1, 2)    # (B, 8, T, 128)
v = self.wv(x).view(B, T, 8, 128).transpose(1, 2)                 # (B, 8, T, 128)
q, k = rope(q, cos, sin), rope(k, cos, sin)
o = F.scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
x = x + self.wo(o.transpose(1, 2).reshape(B, T, 2048))           # (B, T, 1024)
```

## 29. Qwen Feed-Forward Block

The MLP is Chapter 2's SwiGLU without changes, so the mechanism lives there: two projections, one passed through SiLU and used as a gate on the other, then a projection back ([Chapter 2, Part III](/octlm/modern-arch/03-swiglu/#s12), with the gate in action in [Section 14](/octlm/modern-arch/03-swiglu/#s14)). For Qwen3-0.6B:

$$\text{MLP}(x) = W_{\text{down}}\big(\operatorname{SiLU}(W_{\text{gate}}\,x) \odot W_{\text{up}}\,x\big)$$

Read it as: the **gate projection** maps the 1,024-wide normalized hidden state to 3,072 features and **SiLU**, $z \cdot \sigma(z)$, turns each into a soft switch; the **up projection** maps the same input to 3,072 candidate features; the **element-wise gating** multiplies them feature by feature, so each switch decides how much of its feature passes; and the **down projection** maps the 3,072 results back to 1,024 for the residual add.

The **intermediate dimensions** are a choice, and Qwen3-0.6B makes a simple one: $3{,}072 = 3 \times 1{,}024$. Llama's sizing rule, two thirds of four times the width rounded up to a multiple of 256 ([Chapter 2, Section 15](/octlm/modern-arch/03-swiglu/#s15)), would have given 2,816. The three matrices hold 9,437,184 parameters per layer, 60% of the layer and 44% of the whole model, which is why the MLP dominates both the weight bytes read per decode step and the target list of every quantization method.

@fig inf_swiglu_qwen | Qwen3-0.6B's MLP drawn to scale. The 1,024-wide state fans out into two 3,072-wide projections, the SiLU gate multiplies the up features one by one, and down_proj folds the result back.

:::key In one breath
Qwen3-0.6B is the modern block of Chapter 2 under Hugging Face names: 28 pre-norm layers of GQA attention (16 query heads, 8 key/value heads, groups of 2) with RoPE base 1,000,000, and SwiGLU MLPs 3,072 wide, with tied embeddings over a 151,936-row vocabulary. Its config gives every shape, but two details must be taken literally: `head_dim` is 128, so attention runs 2,048 wide and `q_proj` is $(2{,}048, 1{,}024)$ while `o_proj` is $(1{,}024, 2{,}048)$, and each query and key head passes through a shared 128-entry RMSNorm before RoPE. Counting from the config gives 15,730,944 parameters per layer and 596,049,920 in total, 440,467,456 without the embedding, matching the card's 0.6B and 0.44B, and that count is the first sanity check before any weight is loaded.
:::

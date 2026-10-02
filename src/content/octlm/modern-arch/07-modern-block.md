@part VII | The Modern Decoder Block, Assembled | Each part of this chapter swapped one piece of the 2019 block. Put them all together and you have, almost exactly, the layer that Llama 3, Mistral and Qwen stack 28 to 80 times. This part lays out the full difference from GPT-2, applies the upgrades to Finch one at a time and watches the numbers move, follows real Llama 3 8B shapes through the finished block, counts its parameters, compares four real configs, reads the code, and ends with a checklist for loading someone else's model without silent bugs. | where:7

## 33. The Full Diff

Every design choice that changed between GPT-2 (2019) and Llama 3 (2024), with the part of this chapter that covers it.

| Choice | GPT-2 / Finch-19 | Llama 3 / Finch-24 | Part |
|---|---|---|---|
| Positions | learned table added at the bottom | RoPE on q and k in every layer | I |
| Context | 1,024 | 8,192 (Llama 3), 4,096 (Finch-24) | I |
| Normalization | LayerNorm, pre-norm | RMSNorm, pre-norm | II |
| MLP | GELU, two matrices, $4d$ | SwiGLU, three matrices, about $3.5d$ | III |
| Key/value heads | one per query head | shared by groups of 4 (GQA) | IV |
| Attention kernel | written by hand | SDPA / FlashAttention | V, VI |
| Biases | on every linear layer and norm | none | VII |
| Vocabulary | 50,257 (GPT-2), 32,000 (Finch) | 128,256 (Llama 3), 32,000 (Finch) | |

Look at what did *not* change: the skeleton. Residual stream, norm, attention, add, norm, MLP, add, stacked, then a final norm and an output head. Every upgrade is a swap of one part, not a redesign. That is good news for learning and for interviews: if you can draw the 2019 block, you can draw the 2024 block by relabelling six boxes.

@fig block_diff | The two blocks side by side. The skeleton is identical; the highlighted parts on the right are the swaps, each tagged with the part of this chapter that covers it.

## 34. Applying the Upgrades One at a Time

Start from one Finch-19 block and apply each upgrade in turn, counting the parameters per layer and the KV cache per token per layer as we go.

The Finch-19 block has 1,050,624 attention parameters (four $512 \times 512$ matrices plus biases), 2,099,712 MLP parameters and 2,048 LayerNorm parameters, 3,152,384 in all, and caches 2,048 bytes per token per layer. **Adding RoPE** changes nothing inside the block, but removes the model's 524,288-parameter position table. **Switching to RMSNorm** halves the norm parameters to 1,024, by dropping $\beta$. **Switching to SwiGLU** with a hidden width of 1,536 grows the MLP to 2,362,880 with biases, because the rounded width costs a little more than the vanilla MLP. **Switching to GQA** with 2 key/value heads shrinks the key and value projections to $512 \times 128$, bringing attention down to 656,640, and cuts the KV cache to 512 bytes per token per layer, a quarter. **Switching to SDPA and FlashAttention** changes no parameters at all; it changes how attention runs, never storing the $T \times T$ grid. **Dropping biases** gives the final Finch-24 block: 655,360 attention, 2,359,296 MLP, 1,024 norm, 3,015,680 in all.

@fig upgrades_table | One Finch block as each upgrade is applied. Most upgrades barely move the parameter count; GQA cuts both the attention parameters and the cache sharply.

Now reconcile the totals promised in the front matter. Relative to Finch-19, Finch-24 loses the position table ($-524{,}288$), loses half its norm parameters ($-8 \times 1{,}024 - 512 = -8{,}704$), shrinks attention ($8 \times (655{,}360 - 1{,}050{,}624) = -3{,}162{,}112$) and grows the MLP ($8 \times (2{,}359{,}296 - 2{,}099{,}712) = +2{,}076{,}672$). The net change is $-1{,}618{,}432$, taking 42,128,384 to 40,509,952 exactly. And the KV cache per token across all 8 layers falls from 16,384 bytes to 4,096.

The lesson of the table is that most upgrades are not about size. RMSNorm and SwiGLU make the model learn better per parameter; RoPE makes positions relative and extendable; SDPA and FlashAttention make it faster; GQA makes generation cheaper and faster. Only GQA moves the numbers much.

## 35. Inside the Finished Block: Llama 3 8B

Now the finished block at full size, with Llama 3 8B's real numbers: width 4,096, 32 query heads and 8 key/value heads of 128, an MLP width of 14,336, RoPE base 500,000, RMSNorm with $\varepsilon = 10^{-5}$, no biases.

Follow $T$ tokens down the block. $x$ is $(T, 4096)$. RMSNorm keeps the shape. The query projection gives $(T, 32, 128)$ after splitting heads; the key and value projections give $(T, 8, 128)$ each, a quarter of the size, because of GQA. RoPE rotates queries and keys. The new keys and values are appended to the cache, 8 heads wide. SDPA runs attention with each key/value head shared by 4 query heads, producing $(T, 32, 128)$, which is merged back to $(T, 4096)$ and projected by the output matrix. That is added to the residual stream. Then the second half: RMSNorm, gate and up projections both widen to $(T, 14336)$, SiLU and multiply, and the down projection brings it back to $(T, 4096)$, added to the stream again. The shape going out equals the shape coming in, so the same design stacks 32 times.

@fig llama_shapes | Shapes through one Llama 3 8B block. Queries are 32 heads of 128; keys and values are 8 heads; the MLP widens to 14,336; everything returns to (T, 4096).

### Where one block's parameters live

Count them. The query and output projections are $4{,}096 \times 4{,}096 = 16{,}777{,}216$ each. The key and value projections are $4{,}096 \times 1{,}024 = 4{,}194{,}304$ each, a quarter of the query's, because they produce 8 heads instead of 32. The three MLP matrices are $4{,}096 \times 14{,}336 = 58{,}720{,}256$ each. The two RMSNorms are 4,096 each. The total is 218,112,000.

@fig llama_params | One Llama 3 8B block's parameters. Attention is about a fifth; the three MLP matrices are four fifths; the norms round to nothing.

So in a modern block the MLP holds 80.8% of the parameters and attention only 19.2%, smaller than most people expect. Thirty-two blocks give 6,979,584,000 parameters; add the untied input embedding and output head, $2 \times 128{,}256 \times 4{,}096 = 1{,}050{,}673{,}152$, and the final norm, 4,096, and you get 8,030,261,248, the "8B" in the name.

:::interview Interview lens
**"Roughly where are the parameters in Llama 3 8B?"** Each of the 32 blocks has about 218M: attention about 42M (q and o are $4096^2$ each, k and v a quarter of that because of 8 key/value heads) and the SwiGLU MLP about 176M ($3 \times 4096 \times 14336$). The blocks total about 7.0B, and the untied embedding and LM head add about 1.05B (128,256 × 4,096 each), giving 8.03B. So the MLP holds most of the weights, and the vocabulary matrices are an eighth of the model.
:::

## 36. Four Real Configs and the Code

### Four configs side by side

Here are four real models as their config files describe them. GPT-2 small is the 2019 reference; the other three are 2024-era models of about the same size, all built from the recipe in this chapter.

| Config field | GPT-2 small | Llama 3 8B | Mistral 7B v0.1 | Qwen 2.5 7B |
|---|---|---|---|---|
| `hidden_size` ($d$) | 768 | 4,096 | 4,096 | 3,584 |
| `num_hidden_layers` | 12 | 32 | 32 | 28 |
| `num_attention_heads` | 12 | 32 | 32 | 28 |
| `num_key_value_heads` | 12 | 8 | 8 | 4 |
| `intermediate_size` | 3,072 (GELU) | 14,336 | 14,336 | 18,944 |
| `vocab_size` | 50,257 | 128,256 | 32,000 | 152,064 |
| Positions / `rope_theta` | learned | 500,000 | 10,000 | 1,000,000 |
| Norm | LayerNorm | RMSNorm | RMSNorm | RMSNorm |
| QKV biases | yes | no | no | yes |
| Tied embeddings | yes | no | no | no |
| Context | 1,024 | 8,192 | 32,768 (4,096 sliding window) | 32,768 |

The structure is identical across the three modern models; what you read from each config is the sizes, how many key/value heads they share, the MLP width, the vocabulary, and a few small details such as Qwen keeping biases on the query, key and value projections and Mistral's sliding window.

### The whole block in code

```python
class Block(nn.Module):
    def __init__(self, d=4096, H=32, H_kv=8, hd=128, ff=14336, eps=1e-5):
        super().__init__()
        self.n1, self.n2 = RMSNorm(d, eps), RMSNorm(d, eps)
        self.q = nn.Linear(d, H * hd, bias=False)
        self.k = nn.Linear(d, H_kv * hd, bias=False)
        self.v = nn.Linear(d, H_kv * hd, bias=False)
        self.o = nn.Linear(H * hd, d, bias=False)
        self.gate = nn.Linear(d, ff, bias=False)
        self.up = nn.Linear(d, ff, bias=False)
        self.down = nn.Linear(ff, d, bias=False)
        self.H, self.H_kv, self.hd = H, H_kv, hd

    def forward(self, x, cos, sin, cache=None):          # x: (B, T, d)
        B, T, _ = x.shape
        h = self.n1(x)
        q = self.q(h).view(B, T, self.H, self.hd).transpose(1, 2)
        k = self.k(h).view(B, T, self.H_kv, self.hd).transpose(1, 2)
        v = self.v(h).view(B, T, self.H_kv, self.hd).transpose(1, 2)
        q, k = apply_rope(q, k, cos, sin)                 # Part I
        if cache is not None:
            k, v = cache.update(k, v)                     # store H_kv heads, not H
        a = F.scaled_dot_product_attention(q, k, v, is_causal=T > 1,
                                           enable_gqa=True)   # Parts IV to VI
        x = x + self.o(a.transpose(1, 2).reshape(B, T, -1))
        h = self.n2(x)
        return x + self.down(F.silu(self.gate(h)) * self.up(h))   # Part III
```

Every part of this chapter appears in those lines. Two RMSNorms. Bias-free projections with fewer key/value heads. RoPE on queries and keys only, after the head reshape. A cache that stores the small key/value tensors. SDPA with grouped heads and `is_causal` only when more than one token is being processed, because a single decode query must see every cached key (Part V); processing a chunk of new tokens on top of an existing cache would need the lower-right mask instead. The SwiGLU MLP. Two residual additions. The full model wraps 32 of these between an embedding lookup and a final RMSNorm plus output head, and precomputes `cos` and `sin` once.

### Where compute goes, per generated token

For each generated token, one Llama 3 8B block does about 436 million floating-point operations in its linear layers (two per parameter, 218M parameters) regardless of context, plus about $4 \times T \times 4{,}096$ for attention, where $T$ is the number of cached tokens. At 1,024 tokens attention is 3.7% of the block's work; at 8,192 tokens, 23.5%; at 131,072 tokens, 83.1%.

@fig compute_split | Forward FLOPs per generated token for one Llama 3 8B block. Attention is a thin slice at short contexts and the majority at 128k.

Long-context work therefore focuses on attention (FlashAttention, GQA, sparse and sliding-window patterns), while short-context work focuses on the MLP and the matrix multiplies (quantization, batching, better kernels).

## 37. The Porting Checklist

Before you load someone else's modern model into your own code, check these ten settings. Each one can be wrong without causing any error: the model loads, runs and gives worse answers.

@fig porting_checklist | Ten settings to verify when porting a modern decoder. Each is a silent failure if wrong, and each traces back to a part of this chapter.

The first three are about positions and norms: `rope_theta` and any `rope_scaling` entry; the pairing convention for RoPE; and the norm's $\varepsilon$ and whether $\gamma$ is applied as $\gamma$ or $1 + \gamma$. The next two are about the MLP: `intermediate_size`, never assumed from $d$; and which half of a fused gate/up matrix is the gate. Then attention: the head counts and their grouping, with `repeat_interleave` semantics; and causal alignment during decode. Then the run: the dtype, bf16 for the fast kernels. And finally two config flags people forget: biases, which Qwen keeps on q, k and v; and `tie_word_embeddings`. The practical test is to run one prompt through both the reference implementation and yours and compare the logits at every position; differences beyond the last few digits mean one of these is wrong.

## 38. Real Models That Bend the Recipe

**Qwen keeps QKV biases.** Qwen models keep bias vectors on the query, key and value projections, unlike Llama. Code written for Llama drops them and gives wrong outputs. Do not assume `bias=False` everywhere.

**Mistral's sliding window.** Mistral 7B v0.1 lets each token see only the previous 4,096 tokens. Both the attention mask and the cache size must respect it, which also means the cache can be a fixed-size rolling buffer.

**Gemma's extras.** Gemma multiplies embeddings by $\sqrt{d}$, stores its RMSNorm gain as $\gamma - 1$, and Gemma 2 caps very large attention and output logits with a smooth $\tanh$ "soft cap" and uses sandwich norms. None of that is obvious from a typical config. Read the model's reference code, not just the config.

**Tied embeddings in small models.** Llama 3.2's 1B and 3B models reuse the input embedding as the output head; the 8B model does not. A checkpoint with no output weight usually means the embeddings are tied.

**Initialization for training from scratch.** Training from scratch needs careful starting values: random weights with a small standard deviation (about 0.02 is common), and the projections that write into the residual stream (the attention output and the MLP down projection) often scaled down further by about $1/\sqrt{2N}$ so the stream does not grow with depth, as Chapter 1, Section 68, described for GPT-2.

:::warn Watch out
"Llama, Mistral and Qwen are the same architecture" is true of the block and false of the details, and the details are where ports fail. Mistral's window, Qwen's biases and larger base, Gemma's norm convention and soft caps, and every model's own vocabulary and tokenizer are each enough to break a "should just work" conversion. Compare logits against the reference before trusting a port.
:::

:::key In one breath
The 2024 block keeps GPT-2's skeleton (pre-norm residual stream, attention then MLP) and swaps six parts: RoPE for learned positions, RMSNorm for LayerNorm, SwiGLU for the GELU MLP, GQA for full multi-head key/value heads, SDPA/FlashAttention for hand-written attention, and no biases. Applied to Finch, those swaps take 42,128,384 parameters to 40,509,952 and the KV cache from 16,384 to 4,096 bytes per token, with GQA the only big mover. A Llama 3 8B block has 218,112,000 parameters, 80.8% in the MLP, and 32 of them plus untied 128,256-token embeddings give 8.03B; attention is 3.7% of per-token compute at 1k context and 83.1% at 128k. Port carefully: RoPE base and pairing, norm form, MLP width and gate order, head grouping, causal alignment, dtype, biases and tying are all silent failures.
:::

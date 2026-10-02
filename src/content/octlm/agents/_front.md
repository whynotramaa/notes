<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A model can write "I reserved the parts" without reserving anything. This chapter builds the machinery that makes actions real, then teaches and measures the model's ability to choose those actions.</p>

We follow a small inventory request through the entire system. The model reads tool definitions, proposes a call, sees the result, and decides whether another call is needed. The surrounding program keeps the record, validates arguments, enforces permissions, and stops work that has exceeded its budget. Those responsibilities stay separate even when the interface makes them look like a single assistant.

The first parts explain the loop and its evaluation. The middle parts explain how low-rank updates and supervised demonstrations change the model's behavior. The last parts generate checked training traces, compare the trained model with its starting checkpoint, and prepare the result for inference. Your supplied topics remain in their original order as Sections 1 to 72.

Read the paragraph before the drawing. Then cover the paragraph and explain what every arrow carries. A story box gives an analogy, a note records a useful convention, a warning names an implementation mistake, and an interview box gives a question with a spoken answer. Each part closes with the terms and equations you should be able to recall without looking.

The practical goal is precise: draw the whole tool-use system, identify which component owns each failure, compute its adapter and context costs, and design an evaluation that can detect both an improvement and a regression. Finch-24 is a teaching model, not a claim that a small untrained decoder already knows how to use tools. Its inventory traces, probabilities, timing fixtures, and benchmark scores are illustrative. The arithmetic comes from `scripts/unit4-unit5/numbers.py`.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch-24 and the stockroom

**Finch-24** is the small decoder from the modern-block chapter. We keep its architecture fixed while attaching adapters and changing the runtime. That lets us count the cost of training without quietly changing the model being counted.

| Setting | Symbol | Value | Job |
|---|---|---|---|
| Vocabulary | `V` | 32,000 | Embedding rows |
| Model width | `d` | 512 | Features per token |
| Layers | `L` | 8 | Decoder blocks |
| Query heads | `H` | 8 | Attention questions |
| KV heads | `H_kv` | 2 | Shared memory heads |
| Head width | `d_h` | 64 | Features per head |
| Feed-forward width | `f` | 1,536 | SwiGLU expansion |
| Context limit | `T_max` | 4,096 | Teaching configuration |
| RoPE base | `b` | 10,000 | Position frequencies |
| Normalization | | RMSNorm, pre-norm | Scale control |
| Biases and output head | | No biases, tied embeddings | Parameter accounting |
| Base parameters | `P` | 40,509,952 | Frozen model in LoRA |
| Shape example | `B, T` | 2, 8 | Batch and sequence length |
| LoRA example | `r, alpha` | 8, 16 | Adapter capacity and scale |
| Tool-call limit | | 4 | Illustrative runtime budget |

The stockroom has one item named `bolt`. Its stock is 17 and its already reserved count is 5, so available stock is `17 - 5 = 12`. Our user asks, "Reserve 3 bolts if at least 3 are available, and tell me what remains." A successful trace reads availability, submits an authorized reservation, and reports `12 - 3 = 9` available bolts. An unsuccessful trace might produce flawless JSON and still reserve the wrong quantity.

The read-only tool is `get_stock(sku)`. The state-changing tool is `reserve(sku, quantity, request_key)`. The server checks stock again when it commits the reservation and treats a repeated `request_key` as the same operation. This small task is enough to explain concurrency, retry ambiguity, argument validation, and why task success must inspect the environment.

The shape and parameter formulas also apply to larger checkpoints. When we need real-model dimensions we use the original Llama 3 8B configuration, with width 4,096, 32 layers, 32 query heads, 8 KV heads, head width 128, feed-forward width 14,336, vocabulary 128,256, and untied output weights. These dimensions give 8,030,261,248 parameters using the same counting convention. [Meta's Llama 3 implementation](https://github.com/meta-llama/llama3/blob/main/llama/model.py) is the architectural reference; the model configuration, rather than the name "8B", determines the count.

</section>

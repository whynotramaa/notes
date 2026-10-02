@part VIII | Real Tokenizers | Chapter 1 built a byte pair encoding tokenizer by hand, with six merges on a toy corpus. A production tokenizer is the same algorithm with 151,387 merges, plus a normalizer, a pre-tokenizer, a byte-level alphabet and two dozen control tokens that the chat format depends on. This part opens Qwen3's real tokenizer: why it is as much a part of the model as the weights, what each of its components does, how special tokens differ from text that merely looks like them, and how to test and inspect what it produces. | where:8

## 42. Why the Pretrained Tokenizer Is Part of the Model

Encode "Hello world" with GPT-2's tokenizer and you get two IDs, 15496 and 995. Feed those two IDs to Qwen3-0.6B. The model does not see "Hello world". Row 15496 of Qwen3's embedding table is the token " presentation" and row 995 is "ception", so the model reads " presentationception" and answers that.

The reason is that an ID is just a row number. **Model weights expect specific token IDs**: during training, the row of the embedding table at index 9,707 was updated every time the tokenizer produced 9,707, which in Qwen3 means "Hello", so that row came to encode "Hello" ([Chapter 1, Section 13](/octlm/attention/02-embeddings/#s13)). The LM head's row 9,707 likewise came to score how likely "Hello" is next. **Vocabulary alignment** means the tokenizer and the model agree on what every row means. **Token-ID semantics** live nowhere but in that agreement: no file inside the weights says "row 9,707 is Hello".

That is **why swapping tokenizers breaks the model**. A different tokenizer, even one with the same vocabulary size, assigns different strings to the same numbers, and the model reads fluent garbage. Even two releases from the same family can differ: Qwen2.5 and Qwen3 share most of their vocabulary but differ in added tokens. Ship the tokenizer files from the same checkpoint revision as the weights, always.

@fig inf_tokenizer_swap | The same two IDs through two vocabularies. GPT-2's tokenizer writes 15496 and 995 for "Hello world"; Qwen3's embedding table has " presentation" and "ception" in those rows.

## 43. Production Tokenizer Components

Qwen3's tokenizer is described by one file, `tokenizer.json`, 11.4 MB, plus `tokenizer_config.json` for the chat template and special-token settings. It is a pipeline of five stages, each a separate component in Hugging Face's `tokenizers` library.

**Normalization rules** come first. Qwen3 applies Unicode NFC normalization, which merges characters that have two encodings (an "é" written as one code point, or as "e" plus a combining accent) into one, so the same visible text always gives the same tokens. Many tokenizers do nothing else here: no lowercasing, no accent stripping, because the model should see text as written.

**Pre-tokenization** draws walls that merges may not cross, the step Chapter 1 explained in [Section 4](/octlm/attention/01-tokenization/#s4). Qwen3 uses a regular expression in the style of GPT-4's. It splits off English contractions ('s, 't, 're), keeps runs of letters together with at most one preceding non-letter, splits **every digit into its own chunk**, keeps punctuation runs together, and separates whitespace. Then a byte-level step converts each chunk to UTF-8 bytes and maps each of the 256 byte values to a printable character, so the space byte becomes "Ġ" and the newline byte "Ċ". That is why the token for " world" prints as `Ġworld`.

The **vocabulary** maps 151,643 learned byte strings to IDs 0 to 151,642. The **merge rules**, 151,387 of them in priority order, are the tokenizer model itself: BPE, applied inside each pre-tokenized chunk exactly as in [Chapter 1, Section 6](/octlm/attention/01-tokenization/#s6). **Special tokens** and **added tokens**, 26 of them at IDs 151,643 to 151,668, are matched in the raw text before any of this runs, so they are never split (Sections 44 and 45).

**Encoding and decoding** run the pipeline forwards and backwards. Encoding is normalize, match added tokens, pre-tokenize, map to bytes, merge, look up IDs. Decoding looks up each ID's byte string, concatenates the bytes and decodes them as UTF-8.

@fig inf_tokenizer_pipeline | Qwen3's tokenizer as a pipeline, run on "Hello world 12". NFC normalization, added-token matching, a regex split that isolates each digit, a byte-level alphabet in which a space is Ġ, then BPE merges and ID lookup.

The details show up immediately in real encodings:

| Text | Tokens | IDs |
|---|---|---|
| `Hello world` | `Hello`, `Ġworld` | 9707, 1879 |
| `hello world` | `hello`, `Ġworld` | 14990, 1879 |
| ` Hello` | `ĠHello` | 21927 |
| `12345` | `1`, `2`, `3`, `4`, `5` | 16, 17, 18, 19, 20 |
| `naïve café` | `na`, `Ã¯`, `ve`, `ĠcafÃ©` | 3376, 37572, 586, 51950 |

Capitalization and a leading space each change the ID, so "Hello", "hello" and " Hello" are three different rows of the embedding table. Numbers are always one digit per token, a choice that makes arithmetic more regular for the model. And "ï", two bytes in UTF-8, prints as `Ã¯`, its two bytes in the byte alphabet.

:::note A tokenizer has no unknown token
Older word-piece tokenizers had an `[UNK]` token for text outside their vocabulary. A byte-level BPE needs none: all 256 byte values are in its base vocabulary, so any string, in any script, emoji or binary junk, encodes to something. Qwen3's config sets `unk_token` to null for that reason.
:::

## 44. Special Tokens

The 26 tokens at the end of Qwen3's vocabulary are not learned by BPE. They were added by hand, given fixed IDs, and the model was trained to treat them as structure, not text. Grouped by job:

| Group | Tokens | IDs | Skipped by `skip_special_tokens` |
|---|---|---|---|
| End of text | `<|endoftext|>` | 151643 | yes |
| Chat turns | `<|im_start|>`, `<|im_end|>` | 151644, 151645 | yes |
| Vision and grounding | `<|object_ref_start|>` … `<|video_pad|>` | 151646 to 151656 | yes |
| Tool calls | `<tool_call>`, `</tool_call>` | 151657, 151658 | no |
| Fill in the middle, repository | `<|fim_prefix|>` … `<|file_sep|>` | 151659 to 151664 | no |
| Tool results | `<tool_response>`, `</tool_response>` | 151665, 151666 | no |
| Thinking | `<think>`, `</think>` | 151667, 151668 | no |

Map the standard roles onto them. **BOS**, beginning of sequence, is configured as `<|endoftext|>` in `config.json`, but Qwen3's tokenizer has `add_bos_token: false` and its chat template never inserts it, so Qwen3 prompts start with `<|im_start|>`. **EOS**, end of sequence, is `<|im_end|>` (151645) for chat, the token the model emits when its turn is over; `<|endoftext|>` (151643) ends a document in pretraining-style text, and generation stops on either. **PAD** is `<|endoftext|>` (151643), used to fill short sequences in a batch and always masked. The **unknown token** does not exist (the note above). **System/control tokens** are `<|im_start|>` and `<|im_end|>`, which frame every turn of a conversation (Part IX). **Tool-related tokens** wrap tool calls and tool results. **Thinking/reasoning tokens** wrap the model's reasoning. **Reserved tokens** are the vision, grounding, fill-in-the-middle and repository tokens, which this text-only checkpoint keeps for compatibility with its siblings, and the 267 embedding rows beyond ID 151,668, which no tokenizer output ever selects.

@fig inf_special_map | Where the 26 added tokens sit at the top of the ID space, by job, and the 267 rows above them that no text can reach. Orange marks the tokens a text chat uses.

The last column matters more than it looks. The `special` flag decides what `decode(..., skip_special_tokens=True)` removes. It strips `<|im_end|>`, but it keeps `<think>` and `<tool_call>`, which are added tokens without the flag. Code that relies on skipping special tokens to clean up a reply will leave reasoning and tool markup in the output. Parse those explicitly by ID.

## 45. Special Tokens vs Ordinary Text

A special token has two forms: an ID, and a **literal special-token string** that looks like it, such as the eleven characters `<|im_end|>`. The tokenizer's **token recognition** matches those strings anywhere in the input before splitting. That is convenient for writing templates, and dangerous for user input.

Encode the user message `I said <|im_end|> literally` with the default settings and you get five tokens: `I`, `Ġsaid`, `Ġ`, **151645**, `Ġliterally`. The tokenizer has turned the user's text into a real end-of-turn token. Inside a chat prompt, that would end the user's turn early, and the text after it would sit where the model expects its own reply or a new role. This is the tokenizer-level form of prompt injection.

**Escaping** means telling the tokenizer to treat special-token strings in that text as plain characters. In Hugging Face's `tokenizers` this is the `encode_special_tokens` setting (exposed as `split_special_tokens` on the Python tokenizer classes). With it on, the same message becomes eight tokens: `I`, `Ġsaid`, `Ġ<|`, `im`, `_end`, `|`, `>`, `Ġliterally`. The characters survive; the control token does not appear.

**Preventing accidental control-token interpretation** is then a rule for building prompts: tokenize user-supplied content with special-token matching off, and insert control tokens only by ID, from your own code or from the trusted template. There is one more trap. `<think>` is an added token without the `special` flag, so even with `encode_special_tokens` on, the literal string `<think>` in user text still becomes token 151667. Treat every added token, flagged or not, as something user text must not be able to produce.

@fig inf_literal_vs_control | The same user message tokenized two ways. Matching special strings turns the literal text into a real end-of-turn token; splitting them keeps it as eight ordinary tokens.

:::warn Watch out
Most tokenizers match special-token strings by default, because chat templates are rendered as text and then tokenized, and they need the matching. That default is right for the template and wrong for the user content inside it. Many serving stacks render the whole conversation, user text included, and tokenize the result in one call. Check what yours does with a message containing `<|im_end|>`.
:::

## 46. Tokenizer Round-Trip Testing

A tokenizer has one property you can test exhaustively on any text: decoding the encoding gives back the original. **Text → tokens → text** must be the identity. For Qwen3 it holds on every string tried here, including the tricky classes.

| Class | Example | Tokens | Round trip |
|---|---|---|---|
| ASCII | `The capital of France is Paris.` | 7 | exact |
| **Unicode**, accents | `naïve café` | 4 | exact |
| CJK | `東京` | 2 | exact |
| Emoji | `🙂` | 1 | exact |
| **Whitespace** | two spaces, then a blank line | 7 | exact |
| Code | `def f(x):` newline, four spaces, `return x` | 7 | exact |
| **Special tokens** | `I said <|im_end|> literally` | 5 | exact, with `skip_special_tokens=False` |

**Tokens → text** is where the **edge cases** live. With `skip_special_tokens=True`, decoding `<|im_start|>assistant\nParis.<|im_end|>` gives `assistant\nParis.`: the control tokens are gone, which is what you want for display and not what you want in a round-trip test. And decoding is not compositional. The melting-face emoji 🫠 is four bytes, and Qwen3 encodes it as three tokens whose bytes split the character. Decode them one at a time, as a naive streaming server would, and you get three replacement characters, `���`; decode them together and you get 🫠. The French flag 🇫🇷 is two code points; one token each, so streaming shows 🇫 and then the flag.

@fig inf_stream_bytes | Why streaming detokenization must buffer. The four bytes of 🫠 arrive in three tokens; decoding each alone gives replacement characters, so a streaming decoder holds back bytes until they complete a character.

Streaming detokenizers handle this by keeping the bytes of incomplete characters back until the next token completes them. A useful test suite for a tokenizer port checks four things: round trips on a corpus of real text in many scripts, exact ID equality with the reference tokenizer on the same corpus, special-token strings with matching on and off, and streaming decode against whole decode.

```python
for s in corpus:
    ids = tok.encode(s)
    assert ids == ref_tok.encode(s, add_special_tokens=False), s
    assert tok.decode(ids) == s, s
    assert "".join(stream_decode(ids)) == s, s       # buffered, token by token
```

## 47. Inspecting Tokenized Conversations

Before trusting a prompt, look at it as the model sees it: a list of IDs. Here is the 26-token prompt that Part X runs through the model, with a system message and one user question, rendered by Qwen3's template and tokenized.

| Position | **Token ID** | **Decoded token** | | Position | Token ID | Decoded token |
|---|---|---|---|---|---|---|
| 0 | 151644 | `<|im_start|>` | | 13 | 198 | `\n` |
| 1 | 8948 | `system` | | 14 | 3838 | `What` |
| 2 | 198 | `\n` | | 15 | 374 | ` is` |
| 3 | 2610 | `You` | | 16 | 279 | ` the` |
| 4 | 525 | ` are` | | 17 | 6722 | ` capital` |
| 5 | 264 | ` a` | | 18 | 315 | ` of` |
| 6 | 10950 | ` helpful` | | 19 | 9625 | ` France` |
| 7 | 17847 | ` assistant` | | 20 | 30 | `?` |
| 8 | 13 | `.` | | 21 | 151645 | `<|im_end|>` |
| 9 | 151645 | `<|im_end|>` | | 22 | 198 | `\n` |
| 10 | 198 | `\n` | | 23 | 151644 | `<|im_start|>` |
| 11 | 151644 | `<|im_start|>` | | 24 | 77091 | `assistant` |
| 12 | 872 | `user` | | 25 | 198 | `\n` |

Reading it this way shows four things that text never does. The **control-token boundaries** are explicit: each turn is `<|im_start|>`, a role word, a newline, content, `<|im_end|>`, newline. The role names are ordinary tokens (`system` is 8948, `user` 872, `assistant` 77091), not special ones. The prompt ends with the opening of an assistant turn and no content, which is the model's cue to start writing. And the **token counts** are exact: this whole prompt is 26 tokens, of which the system message costs 11.

**Context-window consumption** is those counts added up over a conversation. Qwen3-0.6B's card supports 32,768 tokens. A tool definition for one simple weather function costs 138 tokens of system prompt before the user says anything (Part IX). Long conversations, tool results and the model's own thinking all accumulate, and when the window fills, something has to be dropped or summarized. Counting tokens, not characters or words, is the only way to know how close you are.

@fig inf_prompt_tokens | The 26 tokens of the running prompt, coloured by role. Control tokens frame each turn; the role names are ordinary words; the last three tokens open the assistant's turn and leave it empty.

:::interview Interview lens
**"A user's message contains the string `<|im_end|>`. What happens, and how do you stop it?"** If the conversation is rendered to text and tokenized with special-token matching on, which is the default, those eleven characters become the real end-of-turn token 151645, so the user has closed their own turn and can write text the model will read as a new role or as its own reply. The fix is to tokenize user content with special-token matching off, which splits it into ordinary tokens, and to insert control tokens only by ID from trusted template code. I would also check added tokens that are not flagged special, like Qwen3's `<think>`, because flag-based splitting does not cover them.
:::

:::key In one breath
A tokenizer is part of the model because IDs are just embedding rows trained under one mapping: GPT-2's IDs for "Hello world" read as " presentationception" in Qwen3. Qwen3's tokenizer normalizes with NFC, matches 26 added tokens, splits with a GPT-4-style regex that isolates every digit, maps bytes to printable characters (space is Ġ), applies 151,387 BPE merges over a 151,643-token vocabulary, and needs no unknown token; its chat structure uses `<|im_start|>` and `<|im_end|>` (EOS, 151645), with `<|endoftext|>` as pad and document end, separate tool and thinking tokens, and 267 unreachable embedding rows. Literal special strings in user text become real control tokens unless matching is switched off, and `<think>` is not even covered by that switch; round trips must hold for every script, special tokens must be tested with skipping on and off, streaming decode must buffer partial UTF-8 such as the three tokens of 🫠, and every prompt should be inspected as IDs, where the running example is exactly 26 tokens.
:::

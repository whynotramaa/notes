@part IX | Chat Templates | A language model reads one sequence of tokens. A chat is a list of messages from different speakers, some with tool calls and hidden reasoning. The chat template is the small program that turns the second into the first, in exactly the format the model saw during post-training. This part reads Qwen3's real template: the roles, the markers, the generation prompt, thinking mode and tool calls, and the ways a wrong template quietly makes a good model worse. | where:9

## 48. Why Chat Models Need Templates

Qwen3-0.6B comes in two releases. **Qwen3-0.6B-Base** is the pretrained model: it continues text. Give it "What is the capital of France?" and it might continue with another quiz question, because lists of questions are common on the web. **Qwen3-0.6B**, the one this chapter uses, was post-trained on conversations: it answers. That is the difference between a **base model and an instruction or chat model**, and the post-training conversations all had one specific shape.

The model has no notion of "messages". **Conversations are serialized into one token sequence**: every message is written out in order, and the only thing marking where one speaker stops and the next begins is a set of **control tokens** placed at the **role boundaries**. The model learned during post-training to read those markers: text after `<|im_start|>user` is a request, text after `<|im_start|>assistant` is its own voice, `<|im_end|>` closes a turn. A **chat template** is the function that produces this serialization, and it lives in the checkpoint's `tokenizer_config.json` as a Jinja program, so every library renders conversations the same way the model was trained.

@fig inf_messages_to_sequence | Three messages become one token sequence. The model never sees message objects, only the control tokens that mark where each speaker starts and stops.

:::story Picture this
A theatre script is one long document, but nobody confuses the characters, because every line starts with a name in capitals and every scene ends with a stage direction. An actor trained on scripts in that format knows that when the page says HAMLET, the next words are theirs to speak. Hand the same actor a script with the names stripped out, or with names in a different style, and the lines are still there but the actor no longer knows when to speak. The template is the script format the model was rehearsed on.
:::

@fig inf_script_scene | The theatre script of the analogy. The same four lines read clearly with speakers named in capitals, and become ambiguous without them.

## 49. Conversation Roles

Qwen3's template knows four roles. A **system** message holds standing instructions for the whole conversation. A **user** message is the person's turn. An **assistant** message is the model's turn, which may contain reasoning, a reply and tool calls. A **tool** message carries a **tool result** back to the model after a tool call. The roles are written as ordinary words after `<|im_start|>`: `system` (token 8948), `user` (872), `assistant` (77091).

| Role in the message list | Rendered as |
|---|---|
| system | `<|im_start|>system\n` … `<|im_end|>\n`, first only |
| user | `<|im_start|>user\n` … `<|im_end|>\n` |
| assistant (in history) | `<|im_start|>assistant\n` reply `<|im_end|>\n`, thinking removed |
| tool | inside a **user** turn: `<tool_response>\n` … `\n</tool_response>` |

Two rows surprise people. Tool results are not given their own role marker in Qwen3: the template wraps them in `<tool_response>` tags inside a user turn, and several consecutive tool results share one user turn. And past assistant messages lose their reasoning. A **multi-turn conversation** of a system message, a question, an assistant reply that contained `<think>\nEasy.\n</think>\n\nParis.`, and a follow-up question renders to 42 tokens, in which the past reply is just `Paris.`. The template strips the thinking from every assistant turn before the latest user message, because the model was trained that way and because old reasoning would waste context (Section 53).

## 50. Chat Template Structure

Every Qwen3 conversation has the same skeleton, which Part VIII printed token by token.

**Beginning of conversation.** No BOS token. The first token is `<|im_start|>`, opening either the system turn or, with no system message, the first user turn. Qwen3's template adds no default system prompt; Qwen2.5's added "You are Qwen, created by Alibaba Cloud. You are a helpful assistant." when none was given, which is one of the differences between the two families' templates.

**Role markers** are `<|im_start|>` followed by the role name and a newline. **Message boundaries** are the newline after `<|im_end|>`, so each turn is followed by token 198 before the next `<|im_start|>`. **End-of-turn markers** are `<|im_end|>`, token 151645, at the end of every message.

The **assistant-generation prompt** is what makes the model speak. With `add_generation_prompt=True`, the template appends `<|im_start|>assistant\n` after the last message, and stops. The model's next token is therefore the first token of its reply. Without it, the sequence ends after the user's `<|im_end|>\n`, and the model has to guess what comes next; it usually writes `<|im_start|>assistant` itself, but not reliably. Our running prompt is 26 tokens with the generation prompt and 23 without.

**EOS behavior** closes the loop. The model ends its reply by generating `<|im_end|>`, 151645, the same marker that ends every other turn. That is why `eos_token_id` in `config.json` is 151645 and why generation must stop on it. `generation_config.json` lists 151643 as a second stop token, for the rarer case where the model emits `<|endoftext|>`.

@fig inf_template_anatomy | One Qwen3 turn, annotated. A role marker opens it, the content follows a newline, an end-of-turn token closes it, and a newline separates it from the next; the generation prompt is an assistant turn opened and left empty.

The template that produces all this is short. Stripped of the tool and thinking branches, its core is:

```text
{%- for message in messages %}
    {{- '<|im_start|>' + message.role + '\n' + message.content + '<|im_end|>' + '\n' }}
{%- endfor %}
{%- if add_generation_prompt %}
    {{- '<|im_start|>assistant\n' }}
{%- endif %}
```

## 51. From Messages to Tokens

A chat request goes through four steps before the model sees it.

1. A **structured message list**: `[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is the capital of France?"}]`.
2. **Template rendering**: the Jinja template turns the list into one string, `<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n<|im_start|>user\nWhat is the capital of France?<|im_end|>\n<|im_start|>assistant\n`.
3. **Tokenization**: the string becomes 26 IDs, with the control strings matched as special tokens (Part VIII).
4. The **final model input**: three tensors.

```python
text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
input_ids = tok(text, return_tensors="pt").input_ids     # (1, 26)
attention_mask = torch.ones_like(input_ids)               # (1, 26), all real tokens
position_ids = attention_mask.cumsum(-1) - 1              # (1, 26): 0, 1, ..., 25
```

The **attention mask** marks which positions are real tokens (1) and which are padding (0). For one prompt it is all ones. The **position IDs** number the real tokens from 0, and they drive RoPE.

Both matter as soon as prompts are batched. Batch our 26-token prompt with the 15-token version that has no system message, and the shorter one needs 11 pad tokens. For generation they go on the **left**, so both sequences end at the same position and the next token for each is predicted from the last column. The short row's mask is eleven 0s then fifteen 1s, and its positions, computed as the running count of real tokens minus one, are 0 to 14 on the real tokens (the padded slots get a filler value, 1 in Hugging Face's code, that is never used because the mask hides them). Without that correction, the short prompt's first real token would be rotated as if it sat at position 11.

@fig inf_render_pipeline | From messages to model input, and what left padding does in a batch. The short prompt is padded on the left, masked there, and its real tokens still get positions starting at 0.

## 52. System Prompts

**Placement.** The system message is rendered first, in its own turn, and only the first message may be a system message in the conventional sense; a later system message is rendered as an ordinary turn with the role name `system`. When tools are provided, Qwen3's template appends the tool definitions to the system turn (Section 54).

**Persistent instructions.** A system prompt is not stored anywhere special. It is just tokens at the start of the sequence, which every later token can attend to. "Persistent" means only that the application sends it with every request and the model was trained to give it weight.

**Interaction with later user messages.** Because it is just context, a later user message can contradict it, and what wins is a matter of training, not mechanism. Qwen3 documents one deliberate interaction: with thinking enabled, a user can write `/think` or `/no_think` in a message to switch reasoning on or off for that turn, and the model follows the most recent instruction.

**Token cost.** Our system prompt costs 11 tokens. A system prompt with one tool definition costs 138. Those tokens are prefilled on every request and occupy the KV cache for the whole conversation: for Qwen3-0.6B, 138 tokens are $138 \times 114{,}688 = 15{,}826{,}944$ bytes of cache. This is where the promise of Section 2 comes due. Because the system prompt is identical across requests and comes first, its keys and values are identical too, so a server can compute them once and reuse them for every request that starts with the same prefix. vLLM calls this automatic prefix caching, SGLang builds it on a radix tree of prefixes. A long shared system prompt then costs its prefill once, not once per request.

@fig inf_prefix_cache | Prefix caching. Requests that start with the same system prompt share its KV cache rows; only the part after the shared prefix is prefilled per request.

## 53. Thinking / Reasoning Formats

Qwen3 is a hybrid reasoning model: it can write out reasoning before answering, or answer directly. The reasoning is ordinary generated text wrapped in two added tokens, `<think>` (151667) and `</think>` (151668). **Visible vs hidden reasoning markers** is then a question for the application, not the model: the model always generates the reasoning tokens, and the application decides whether to show them, hide them or log them.

**Thinking control tokens** structure the output. In thinking mode the model's reply looks like `<think>\n` reasoning `\n</think>\n\n` answer `<|im_end|>`. To separate them, find the last `</think>` by ID and split there; Qwen's own example code searches for the last occurrence of 151668. Do not use `skip_special_tokens` to hide the reasoning: it does not remove these tokens, because they are not flagged as special (Section 44).

**Enabling/disabling thinking mode** is done by the template, through a variable called `enable_thinking`, true by default. When it is false, the generation prompt gets four extra tokens: `<|im_start|>assistant\n<think>\n\n</think>\n\n`. The prompt grows from 26 to 30 tokens and ends with an already-closed, empty think block, so the model, which always writes a think block first, finds it already written and goes straight to the answer. That is the whole mechanism: the switch is made in the prompt, not in the weights.

@fig inf_thinking_modes | The two generation prompts. With thinking on, the assistant turn is opened and left empty; with thinking off, the template pre-fills an empty think block, four tokens, so the model starts directly on the answer.

**Why the template must match model training.** Each of these behaviours, the empty think block, the stripping of old reasoning from history, the soft `/no_think` switch, works only because the model saw exactly that format during post-training. Render the same conversation another way, for instance keeping old reasoning in the history, and the input is now unlike anything the model learned from. It will still produce text. It will just be somewhat worse, in ways no error message will ever report.

## 54. Tool-Call Formatting

A tool call is the model writing a structured request that your code executes. Qwen3's template sets it up in four pieces, and here is a real one, rendered from a single weather tool and a three-message conversation, 190 tokens in all.

```text
<|im_start|>system
# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
{"type": "function", "function": {"name": "get_weather", "description": "Current weather for a city", "parameters": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}}}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{"name": <function-name>, "arguments": <args-json-object>}
</tool_call><|im_end|>
<|im_start|>user
Weather in Paris?<|im_end|>
<|im_start|>assistant
<tool_call>
{"name": "get_weather", "arguments": {"city": "Paris"}}
</tool_call><|im_end|>
<|im_start|>user
<tool_response>
{"temp_c": 18}
</tool_response><|im_end|>
<|im_start|>assistant
```

**Tool schemas in the prompt**: each tool's JSON schema goes inside `<tools></tools>` in the system turn, one per line, followed by instructions on how to call them. That block costs 138 tokens for this one small function, before the user has said anything. **Tool-call control tokens**: the model answers with `<tool_call>` (151657), a JSON object, and `</tool_call>` (151658), then ends its turn with `<|im_end|>`. Note that in the instructions block, the same `<tool_call>` tokens appear as examples; they are real control tokens there too.

**Structured arguments** are JSON: `{"name": "get_weather", "arguments": {"city": "Paris"}}`. Your code parses it, validates it against the schema (the model can and does produce invalid JSON or wrong argument types sometimes), runs the function, and appends a message with role `tool`. **Tool results** are rendered inside a user turn as `<tool_response>\n{"temp_c": 18}\n</tool_response>`. **Returning control to the assistant** is then just the generation prompt again: the template appends `<|im_start|>assistant\n`, and the model, now able to read the tool result, writes its answer.

@fig inf_tool_loop | The tool-call loop. The model writes a call between tool_call tokens and ends its turn; your code runs the function and appends the result as a tool message; the template wraps it and reopens the assistant's turn.

:::warn Watch out
The model's tool call is text it generated, so treat it like any untrusted input: parse it, validate the function name and every argument against the schema, and never pass it to a shell or a database without checking. And remember that tool results flow back into the prompt: a web page or file returned by a tool can contain instructions, or literal control-token strings, aimed at the model.
:::

## 55. Chat-Template Failure Modes

Template bugs never crash. They produce a prompt the model was not trained on, and the model does its best. The common ones:

| Failure | What happens | How to catch it |
|---|---|---|
| **Missing role markers** (raw text to a chat model) | the model continues text instead of answering, or answers in an odd register | always render through the template |
| **Double BOS/EOS tokens** | extra start or end tokens the model never saw at the start of a prompt | inspect the first and last few IDs |
| **Incorrect assistant prefix** (no generation prompt, or "Assistant:" as plain text) | the model may continue the user's message or write its own role marker | check the prompt ends with `<|im_start|>assistant\n` |
| **Wrong special tokens** (another family's markers) | the markers are tokenized as ordinary text pieces | check that control strings became single IDs |
| **Wrong template for checkpoint** | defaults, thinking handling and tool format differ from training | use the template shipped with the exact checkpoint |
| **Context corruption** (old thinking kept, a turn cut in half by truncation, tool results unwrapped) | gradual quality loss, odd behaviour late in conversations | truncate whole turns, re-render the history through the template |

Two of these need a word more. Double BOS is mostly a problem for models that use one, such as Llama 3, whose template writes `<|begin_of_text|>` and whose tokenizer, called with `add_special_tokens=True` on the rendered text, adds a second. Qwen3 has no BOS, so the equivalent mistake is adding `<|endoftext|>` at the start, which the model has only seen as a document separator. Wrong special tokens are easy to spot once you look at IDs: Llama 3's end-of-turn marker `<|eot_id|>` is not in Qwen3's vocabulary, so in a Qwen prompt it becomes a handful of ordinary text tokens, and the model has no reason to treat it as the end of anything.

@fig inf_template_bugs | Four template mistakes, shown as the token strips they produce. Each is a valid sequence the model will happily read; none is one it was trained on.

:::interview Interview lens
**"What does `add_generation_prompt` do, and what goes wrong without it?"** It appends the opening of an assistant turn, `<|im_start|>assistant\n` for Qwen, after the last message, so the very next token the model generates is the first token of its reply. Without it, the sequence ends after the user's end-of-turn marker, and the model must first decide who speaks next; often it writes the assistant marker itself, sometimes it continues the user's text or invents a new user turn. For Qwen3 the generation prompt is also where the template switches thinking off, by pre-filling an empty think block, so getting it wrong changes behaviour in two ways at once.
:::

:::key In one breath
A chat model reads one token sequence, so a chat template, a Jinja program shipped in `tokenizer_config.json`, serializes messages exactly as in post-training: for Qwen3, each turn is `<|im_start|>role\n` content `<|im_end|>\n`, there is no BOS and no default system prompt, tool results are wrapped in `<tool_response>` inside user turns, past reasoning is stripped, and `add_generation_prompt` opens an empty assistant turn so the model writes its reply and ends it with `<|im_end|>` (151645, the EOS). Rendering, tokenizing and building the attention mask and position IDs give the model input (26 tokens for the running prompt), with left padding and positions from the mask's running count in batches. System prompts are just leading tokens (11 here, 138 with one tool), cheap to share with prefix caching; thinking is switched off by pre-filling a four-token empty think block; tool calls are JSON between `<tool_call>` tokens that your code must validate; and every template mistake, from missing markers to wrong checkpoints, produces a valid prompt the model was never trained on.
:::

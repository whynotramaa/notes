@part VII | Teaching the next assistant message | This part turns an action trace into supervised training targets. The model must see observations as context without being taught to invent them. We will follow teacher forcing through conversation serialization, shifted labels, assistant-only masks, and dependent tool calls. | where:7

## 39. SFT fundamentals

We have a correct reservation trace. Training should make its assistant decisions more likely given their recorded context, without running stockroom operations at every optimizer step.

### Demonstration learning, teacher forcing, and behavior imitation

**Supervised fine-tuning**, or SFT, learns from examples of desired outputs. **Teacher forcing** feeds the recorded earlier tokens when predicting each next one. **Behavior imitation** raises the likelihood of demonstrated decisions; it does not directly optimize the environment's final reward.

@fig sft_teacher_forcing | An illustrative tool-call token sequence shows recorded prefixes and next-token targets. The pieces are schematic tokens, not Finch-24 tokenizer output.

### Next-token loss

The **next-token loss** penalizes low probability on the recorded target. With a mask $m_t$ selecting supervised positions:

$$
\mathcal L = -\frac{\sum_t m_t\log p_\theta(x_t\mid x_{<t})}{\sum_t m_t}.
$$

Read this as average, over positions with $m_t=1$, the negative log probability of each recorded token given the tokens before it. $\theta$ are the trainable parameters or adapter factors, and the denominator must be positive.

Supervised targets with probabilities 0.5, 0.25, and 0.125 cost 0.693147, 1.386294, and 2.079442 nats, mean 1.386294. That measures token fit to a demonstration, not task success in free generation.

@fig sft_loss_terms | Computed per-target losses for three illustrative probabilities. Each halving of probability adds the same 0.693147 nats.

## 40. SFT dataset structure

A training row holds only `reserve(bolt,3)`, with no request and no stock observation. The model can copy the spelling but not learn why the call was right. Tool-use examples need their decision context.

### System, user, assistant, and tool call

A **conversation example** stores role-labeled messages under one schema. The system message gives task and tool rules, the user message the request, and the assistant message text or a tool call. Here the call is a structured field on an assistant message, not an operation the model already performed.

### Tool result and final answer

A tool result records what the environment returned, linked to the call ID, and the final answer is the assistant's evidence-grounded report. The full stockroom demonstration has seven messages: system, user, read call, read result, reservation call, reservation result, final answer.

Store results from real execution or a declared simulator. A trace where stock is 12, quantity 3, and remaining 10 contradicts `12 - 3 = 9` and would teach bad arithmetic or unsupported reporting.

The stored schema need not match the raw template. Keep typed call objects in the dataset and let the tokenizer render them, so schema and execution checks run before serialization.

:::story Picture this
A driving lesson records the road sign, the driver's decision, and the turn. Keep only the turn and the learner cannot connect it to the sign. A tool-use trace needs the observation that made the next decision correct.
:::

## 41. Conversation serialization

One list of messages becomes different token sequences under different chat templates. A model trained on one set of boundaries may read another as plain text and continue in the wrong role.

### Chat templates, special tokens, and role boundaries

A **chat template** renders structured messages into the checkpoint's expected sequence. **Role boundaries** mark which speaker owns a segment, and special tokens can mark message ends or other control meanings, mapped by the tokenizer to model IDs.

The [Transformers chat-template documentation](https://huggingface.co/docs/transformers/en/chat_templating) is explicit that a chat still becomes one token sequence. Role markers do not create separate processes for user and assistant; they are learned context.

### Tool boundaries

**Tool boundaries** separate an operation request from a final response and tie a tool result to the continuation. Our readable teaching envelope is not Llama 3's native format; use the template shipped with your checkpoint and inspect its rendered text and token IDs.

Training renders complete recorded conversations, normally with no generation prompt after the final answer. Inference usually needs the opposite: an assistant-start marker where new text begins. Adding duplicate begin or end tokens after rendering silently changes the learned pattern.

Role order must survive serialization. The server's `remaining=9` must never appear as an assistant claim before the reservation happened. Serialization is part of training correctness, not cosmetic formatting.

## 42. Training labels

At one position the model has seen token 22 and must predict 33. If the code compares logits with 22, the model learns to copy, and the off-by-one error yields a smoothly falling, meaningless loss.

### Input IDs, labels, and shifted targets

**Input IDs** are vocabulary indices. **Labels** are target token IDs, with an ignore value at unsupervised positions. **Shifted targets** align the output at position $t$ with the token at $t+1$ in a causal decoder.

The illustrative sequence `[11,22,33,44]` gives pairs `11 -> 22`, `22 -> 33`, and `33 -> 44`; the last input has no target. These IDs are arbitrary fixtures.

@fig sft_shifted_labels | The illustrative token and target sequences differ by one position. The target mask moves with the target token, not the input position.

### Ignore masks

An **ignore mask** removes positions from the loss without removing them from the input. Many PyTorch loss paths use `-100` as the ignore index; use the documented value and check whether the model shifts internally. [PyTorch cross-entropy reference](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html).

If the model shifts internally, pass aligned full-length labels and do not shift again. If you compute loss yourself, shift logits and labels together once. Padding also needs an attention mask, since ignoring a target's loss does not stop attention to padded input.

## 43. Assistant-only loss

The model reads `available=12` from the tool. It should use that observation without learning that it may invent tool responses. The role mask draws that line.

### Masking user/system tokens and training only assistant outputs

**Assistant-only loss** supervises assistant-authored content and keeps other roles as context. User, system, and, in ordinary tool use, tool-result targets are ignored, because the environment supplies results. Boundaries that end a call or final message still need consistent supervision.

@fig sft_role_mask | Schematic role slots show which authored content contributes to loss. The drawing uses role chunks; a real mask is token-level.

In a batch of 2 sequences of length 8 there are `2 × 8 = 16` positions. With 6 supervised targets the loss denominator is 6 and the supervised fraction `6 / 16 = 37.5%`, though all positions still shape those six predictions through causal attention.

### Tool-call supervision

**Tool-call supervision** covers the assistant's call syntax, name, and arguments. Masking out all call tokens teaches only prose. Supervising tool responses teaches the model to imitate observations it should wait for.

Build masks from template-aware role spans, never substring searches for `assistant`, and inspect token IDs around boundaries when the tokenizer splits them oddly. A correct-looking rendered conversation can still carry a wrong mask.

:::note Template support
Assistant-only masking needs the template to expose assistant spans correctly, and some trainer options require generation markers in the template. Check the documented support and inspect a real batch. [TRL SFT trainer reference](https://huggingface.co/docs/trl/en/sft_trainer).
:::

## 44. Tool-call SFT

An assistant can learn to spell `reserve` without learning when to use it. The data needs contrasting decisions and grounded arguments, not a stack of near-identical JSON.

### Correct tool choice, arguments, and serialization

**Tool-call SFT** trains assistant outputs that choose operations and fill their inputs. The right choice follows from request and observation; the right arguments vary with them; the right serialization matches the runtime's format, including envelope and end boundary.

Our example maps "reserve 3" to quantity 3 after a read showing 12. A request for 5 needs quantity 5 and, after commit, `12 - 5 = 7` remaining. A fixed quantity 3 in every demonstration teaches a constant, not extraction.

### Tool-result continuation

A **tool-result continuation** is the assistant message that follows an observation: another call after `get_stock`, a final answer after a receipt. Include errors and insufficient stock so the model sees several valid continuations of the same tool.

The runtime still validates and executes after training; SFT shifts probabilities, it does not make calls trustworthy. Test free generation too, because teacher-forced loss hides errors that compound when the model conditions on its own output.

## 45. Multi-step training examples

The reservation is correct only because the second call uses the first result. Dropping that result in preprocessing changes what the model is asked to learn.

### Tool call, tool result, additional tool call, and final answer

A **multi-step training example** holds dependent decisions with the observations between them. The read returns 12, the reservation requests 3, and the receipt's 9 feeds the final answer. Loss covers the two calls and the final response; both results stay as context.

@fig sft_multistep_dependency | The illustrative read result conditions the reservation, and the reservation result supports the final number. Both observations are kept even though they are not training targets.

Seven messages is one complete path. A failure path has an insufficient-stock result and a refusal; a recovery path has a schema error, a corrected call, a result, and a report. Each teaches a different decision and must be labeled with the states it actually implies.

Truncation must respect boundaries. Cutting before the receipt while keeping a later final answer creates unsupported supervision. Training a prefix that ends in a complete call is fine when that decision is the intended target; pretending a missing result was observed is not.

:::warn Watch out
Never supervise an action against context missing its prerequisite observation. Packing, truncation, and masking can turn a valid trace into an invalid example, so inspect the final batch, not just the source row.
:::

:::interview Interview lens
**"Why mask tool results if the model needs to read them?"** Loss and visibility are separate. The result stays in the causal input so the next decision can use it, but the model is not trained to author it. Calls and the final report are supervised. I would check the shifted mask, because a boundary error silently trains the wrong role.
:::

:::key In one breath
SFT raises the likelihood of recorded assistant decisions given recorded prefixes. The chat template preserves roles and tool boundaries, and targets shift exactly once. Assistant-only masking removes other roles from the loss while keeping them as context. Multi-step examples must keep every prerequisite observation so calls and answers stay grounded.
:::

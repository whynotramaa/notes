@part II | Execution, memory, and stopping | This part carries a proposed action across the boundary into a real service. A correct loop must survive malformed output, missing responses, and growing history. We will separate recoverable errors from uncertain writes, then account for state, context, caching, and termination. | where:2

## 8. Malformed tool calls

The assistant calls `reserve_stock`, but the registry exposes `reserve`. The intent looks obvious, yet the name is not an allowed operation, and silently translating it hides a model failure.

### Hallucinated tools, wrong argument types, and missing fields

A **hallucinated tool** is a generated name absent from the permitted registry. Wrong argument types break the schema, such as a list where `sku` needs a string. Missing fields break presence rules, such as omitting the operation key. Each should produce a precise error before execution.

### Invalid JSON, recovery, and retries

**Recovery** gives the model enough evidence to correct itself. For invalid JSON, the runtime returns a parse error in a protocol-supported observation or asks for regeneration, without pretending a tool ran. For a schema failure it names the field and constraint. A **retry** repeats an attempt under an explicit policy and budget.

Say the model emits `quantity="3"`. The runtime rejects the string and reports that quantity must be an integer; the corrected `quantity=3` passes. That is two attempts and one executed call, and evaluation must keep both or a poor model will look accurate.

@fig failure_reach_agents | Three illustrative failures stop at different stages. Only the timeout reached the service, so only it can have changed stock, and only it needs reconciliation with the original key.

A syntax error never reached the service. A timed-out write may have committed, and changing `request_key` during recovery can turn one intended reservation into several. Error handling needs the execution status, not a generic "try again."

:::story Picture this
A rejected form never reached the stockroom, so rewriting it cannot move parts twice. A missing receipt is different: the parts may already have moved. Ask about the same request before submitting a new one.
:::

## 9. Tool execution

The runtime receives a valid reservation. Nothing should let a generated name become a shell command or an arbitrary Python attribute; execution crosses a narrow, checked interface.

### Tool registry, dispatch, and passing arguments

A **tool registry** maps allowed names to trusted implementations. **Dispatch** picks the implementation after name, schema, and permission checks, and passes the parsed fields against the expected signature. Here the allowed set is exactly `get_stock` and `reserve`; a third name has no path to code.

The service must enforce the reservation condition atomically. Reading 12 available and later reserving 3 does not mean 12 are still available, because another user can reserve in between. The commit checks stock and updates the count in one protected operation.

### Handling failures, exceptions, and timeouts

An **exception** is a program's failure signal. A **timeout** means the caller stopped waiting before a result arrived. The runtime turns expected failures into a documented error object, records whether a write's outcome is known, and never leaks credentials or server internals into model context.

@fig retry_commit_boundary | The illustrative server commits a reservation before its response is lost. Retrying with the same operation key returns the stored receipt and leaves availability at 9.

**Idempotency** means repeating an operation with the same identity has the same business effect as doing it once. If the first `reserve` moved availability from 12 to 9, a retry with `r1` returns that same outcome; a new key is a new operation and could drop it to 6. The server must reject the same key with different arguments.

Abandoning a wait does not stop a synchronous in-process function. A hard limit needs cancellation support or process isolation, and the runtime should record the deadline separately from proof that execution stopped.

:::warn Watch out
A timeout does not prove nothing happened. For writes, return an outcome such as `unknown_commit` and reconcile using the operation key. Blind retries are safe only when the tool deduplicates or repeated effects are impossible.
:::

## 10. Tool results

The stock tool returns every reservation in the warehouse when the next decision needs one number. Pasting the whole response into the conversation slows the task and buries the answer.

### Result formatting and tool-result messages

A **tool result** is the observation tied to a call. Format it with status, data, and error kept separate, and send it as a tool-result message carrying the call ID. The next assistant message can then explain what happened or act again.

For `reserve`, a useful success payload has `committed=true`, a receipt ID, `quantity=3`, and `remaining=9`. "Success" alone cannot support a numerical answer, and "remaining=9" without commit status is ambiguous.

### Structured outputs, large outputs, and truncation

**Structured outputs** expose named, typed values. Large outputs need a deliberate reduction: select rows, paginate, or return a handle for a follow-up read. **Truncation** cuts a payload at a limit and must say what it dropped; cutting raw JSON midway turns a valid observation into invalid syntax.

At an illustrative 192 tokens per result, two results take `2 × 192 = 384` tokens before calls, prompt, or final text. The runtime need not forward everything the service returns, but any reduction must keep the evidence the task needs.

### Context cost

Every retained result costs tokens and cached states. A retrieved document may also contain instructions from an untrusted author: keep it as tool data, and keep authorization outside its control. Text asking to change tool permissions is not a permission change.

## 11. Multi-turn state

The assistant reads stock 12, then forgets it because the next call contains only the user's request. It must ask again or guess. Memory lives in the input and the program around the model.

### Conversation history, assistant messages, tool calls, and tool results

**Conversation history** is the ordered record of messages sent to the model: the request, assistant decisions, tool calls, and results. It should keep identities like receipt IDs even when the displayed chat hides protocol details.

Our stockroom trace has seven messages including the system message. The first call is not a final answer, and the tool result is not user input. Mixing roles changes the evidence the model sees and teaches the wrong continuation in supervised training.

### Stateless model vs stateful harness

A **stateless model invocation** computes output from its inputs without owning application history. A **stateful runtime** keeps the record, tool availability, step count, and operation identities across invocations. Server sessions or caches belong to the serving contract, not to the weights.

The inventory database and the conversation record are separate states. Clearing the conversation does not undo a reservation, and losing the KV cache does not touch the database. That tells you what must survive a restart and what can be recomputed.

Keep an audit record of arguments and results for state-changing calls. The generation context can shrink later while the action record stays complete; Section 12 never treats a summary as a receipt.

## 12. Context management

A long debugging session eventually fills the input limit. Adding a result then fails or pushes out information the assistant still needs, so the runtime must decide what the next decision depends on.

### Context-window growth and tool-result growth

The **context window** is the maximum token span the inference configuration can process. With an illustrative 320-token prompt, each call-result turn adds `48 + 192 = 240` tokens, so three turns reach `320 + 3 × 240 = 1,040` before any final answer. Finch-24's teaching limit of 4,096 tokens covers input and generated output together.

@fig context_growth_agents | Illustrative token budgets grow arithmetically. These values describe a fixture, not the actual tokenization of the displayed messages.

### Dropping irrelevant history, summarization, and compression

**Summarization** replaces verbose history with a shorter statement of what mattered. **Compression** is the broader goal of keeping relevant information in fewer tokens, including extracting structured facts. Dropping repeated read outputs is fine as long as the active task, current evidence, and operation keys survive.

With an 80-token summary and the latest 48-token call and 192-token result, the context is `320 + 80 + 48 + 192 = 640` tokens, 400 fewer. The summary must still say "reservation r1 committed" if a later retry depends on it; a shorter prompt that loses that fact is cheaper and wrong.

@fig context_summary_agents | Computed fixture totals before and after summarizing two old turns. The orange summary replaces 480 tokens of turns with 80.

### Sliding context

**Sliding context** keeps a moving suffix of the record. It is simple and can drop a needed instruction or open dependency, so pin task rules and critical action facts outside the suffix. This is a change to the input record, unlike sliding-window attention, which changes which positions attend to which keys.

## 13. KV cache across agent turns

After a tool call, the history starts with tokens the model already processed. Recomputing them wastes work, and reuse is possible when the old sequence is an exact prefix of the new one.

### Prefix reuse and cache continuation

The **KV cache** stores attention keys and values for processed tokens. **Prefix reuse** skips reprocessing an identical initial sequence, and **cache continuation** appends states for the new suffix. In the fixture, 560 old plus 240 new tokens make 800, so `560 / 800 = 0.7` of positions are reused, which is not a promise of 70% lower latency.

@fig prefix_reuse_agents | The illustrative old prefix and appended suffix need different work. Token identities, positions, weights, and attention configuration must still match.

### Cache invalidation and modified history

**Cache invalidation** discards states whose assumptions changed. Editing an old message changes that token and everything after it. Summaries, a new system prompt, a switched adapter, or a changed chat template can all break reuse, so compare token IDs, not displayed text.

Tool calls add a trap: the raw generated message and its reserialized form can differ. A runtime that parses and rebuilds calls must find the true common token prefix before reusing the cache. The Transformers cache documentation covers strategies and storage trade-offs, but cross-turn validity depends on your inputs. [Cache strategies](https://huggingface.co/docs/transformers/en/kv_cache).

### Latency implications

Finch-24's 16-bit GQA cache costs `2 × 8 × 2 × 64 × 2 = 4,096` bytes per token: K and V, layers, KV heads, head width, bytes per element. Reuse saves prefill compute while keeping that memory, and it skips neither tool latency nor generating the new suffix.

:::note The cache is derived state
Keep the authoritative message record apart from the cache. When validity is uncertain, rebuild from the record. The cache's identity includes weights, adapter, tokens, positions, and attention settings.
:::

## 14. Agent stopping conditions

The model keeps reading stock after it has the answer. Every call is legal, and the task makes no progress. Termination must be something the model cannot postpone forever.

### EOS and final-answer detection

An **end-of-sequence token**, or EOS, ends a generated sequence under the model's protocol. It does not prove the task is done: a tool-call message ends before the tool runs, and a token budget can cut a message short. **Final-answer detection** recognizes the protocol's terminal response and records what the system claims it completed.

### Maximum steps, maximum tool calls, and repetition detection

A **step** is one model decision. Step limits and tool-call limits differ when one decision holds several calls. Our illustrative call ceiling is 4 and the request uses 2, leaving 2 unused, and unused budget is no reason to spend it.

**Repetition detection** finds cycles, like identical reads with no new evidence. Compare normalized names and arguments and whether the environment changed: the same read can be useful after a write and wasteful before one.

@fig stopping_budget_agents | A terminal record distinguishes an observed completion from a forced stop. The budget is illustrative and belongs to the runtime.

### Infinite-loop protection

**Infinite-loop protection** combines call and step ceilings with time, token, and output-size limits. Count invalid attempts too, or a model can loop on malformed JSON forever. Report why the system stopped and what remains unfinished; returning "Done" after the last allowed step disguises failure as success.

:::interview Interview lens
**"Can you reuse the model cache after a tool result arrives?"** Yes, if the new sequence extends an identical cached prefix under the same weights and attention settings: append the result and process only the suffix. If the runtime edits or reserializes history, reuse only the true common prefix. Application state is still needed when the cache is lost.
:::

:::key In one breath
Validate before dispatch, and tell a rejected call apart from an uncertain write. Tool results are evidence with identities. The runtime keeps durable action state and trims the generation context without losing facts retries depend on. Cache reuse needs identical dependencies, and every stop must say whether the task finished or just ended.
:::

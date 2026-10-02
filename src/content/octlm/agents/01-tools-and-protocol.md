@part I | From words to actions | This part gives the model a precise way to ask for work. Without a shared contract, a convincing sentence can be mistaken for an action. We will follow a stockroom request through tool definitions, schemas, serialization, and parsing. | where:1

## 1. From language model to agent

You ask an assistant to reserve bolts, and it replies, "Done." That could record a real reservation or be a sentence that never touched the stockroom. We need a way to tie generated text to observed changes.

### Model vs harness

A **language model** maps a token sequence to probabilities for what comes next. The **harness**, also called the agent runtime here, is the program around it that decides what goes into that sequence and what happens when the model asks for an action. The model proposes; the runtime executes. Mentioning a database does not open a connection.

### Tools, state, environment, and control loop

A **tool** is an operation the runtime exposes through a defined interface. **State** is information kept between steps, such as messages, call IDs, and a receipt. The **environment** is the world the tools read or change, here the inventory database. A **control loop** asks the model for a decision, executes permitted calls, and returns observations until a stopping condition holds.

An **agent** is the system that runs this loop toward a task. What it adds over plain generation is feedback from actions. Finch-24 can observe `17 - 5 = 12` available bolts, reserve 3, and read a receipt showing 9 remain, and it can correct course after an error. That is a property of the system, not evidence of intention.

@fig agent_ownership | The illustrative stockroom request crosses separate ownership boundaries. Only the tool service changes stock; the model reports evidence returned by that service.

The stockroom shows the difference: 5 bolts already reserved, 3 newly reserved, 9 still available. Total stock on the shelf is unchanged; only its reservation state moves.

@fig stockroom_before_after | Illustrative inventory state before and after one successful reservation. Each bolt is one item; the three orange bolts are the newly committed action.

Yao and colleagues' *ReAct* interleaved action decisions with observations in language-model task solving. Its prompt format is one design, not the definition of an agent. [ReAct paper](https://arxiv.org/abs/2210.03629).

:::story Picture this
A clerk writes a request on a form. The stockroom checks it, moves the parts, and returns a receipt. Writing "parts moved" on the form moves nothing. The runtime keeps form, action, and receipt connected.
:::

## 2. The agent loop

The request is conditional: reserve 3 bolts only if enough are available. Answering at once would mean inventing the stock level, so the first step should fetch evidence.

### User request and model generation

The runtime records the user request beside a system message that states the rules and tools. **Model generation** produces the next assistant message from this serialized history; it may hold text, a tool call, or both. The runtime reads the checkpoint's actual call format, not a suggestive English phrase.

### Tool-call detection and tool execution

The first call is `get_stock(sku="bolt")`. Once the runtime detects a complete call, it validates and executes it; the tool returns stock 17, reserved 5, available 12. **Tool-result insertion** places this observation in the history, tagged with the call it answers, and generation continues with the result in view.

The next call is `reserve(sku="bolt", quantity=3, request_key="r1")`. The server checks the condition at commit time, records the reservation, and returns 9 remaining. The final answer should report this receipt, not the model's earlier prediction.

@fig agent_loop_trace | An illustrative successful trajectory has two calls and two matching results. The system message is omitted from the drawing; with it the complete record has seven messages.

The history lives outside the model, which keeps its ownership visible.

@fig agent_loop_notebook | The illustrative runtime keeps the message record and feeds it to each model invocation. Tool evidence returns through the runtime, which decides whether to continue.

### Final answer and stopping conditions

One system message, one user message, two call messages, two result messages, and one final answer make `2 + 2 × 2 + 1 = 7` messages, assuming one call per assistant message. Batched parallel calls change the count but keep each call paired with its result.

The runtime stops on a recognized final answer, an exhausted budget, a cancellation, or an unrecoverable error. A successful answer and a forced stop are different outcomes, and Section 14 records them differently.

## 3. Tool definitions

Two tools named `check` and `do` may have valid signatures, but they give the model little reason to choose correctly. A definition must say what the operation means.

### Tool name, description, and arguments

The **tool name** is the registry key the runtime dispatches on. The **description** explains the operation, when to use it, and conditions to respect. **Arguments** are the named inputs with units and meaning: for `reserve`, `quantity` is a positive count of bolts and `request_key` identifies one logical reservation.

### Outputs and errors

**Outputs** expose the evidence the next decision needs: `committed`, `receipt_id`, and `remaining`. **Errors** say whether the operation failed before committing, after committing, or with unknown outcome. "Something went wrong" is not enough when a retry might reserve twice.

@fig tool_contract_card | The illustrative reservation interface describes the action, its inputs, evidence of success, and distinguishable failure states.

### Read-only vs state-changing tools

A **read-only tool** observes without changing business state; a **state-changing tool** can commit an external change. They need different retry policies. A read may still write access logs or use quota; "read-only" describes the intended business operation.

The definition says `reserve` needs user authorization, checks availability atomically, and takes an idempotency key. Those are server rules the model cannot waive: the description guides tool choice, the implementation enforces the contract.

:::note Interface stability
Keep a tool name stable while its meaning is stable. When a schema or output changes, record its version in training and evaluation traces, or the same arguments can mean different work in two runs.
:::

## 4. Tool schemas

The model emits `{"sku":"bolt","quantity":"three"}`. A person understands it; the reservation function expects an integer. Accepting it unchecked pushes an ambiguous language decision into a business operation.

### JSON Schema, required fields, optional fields, and types

**JSON Schema** is a declarative language for describing permitted JSON values. `properties` describes fields and `required` lists those that must be present; listing a property does not require it. An **optional field** may be absent, and allowing `null` is a separate choice. See the [JSON Schema object reference](https://json-schema.org/understanding-json-schema/reference/object).

```json
{
  "type": "object",
  "properties": {
    "sku": {"type": "string", "enum": ["bolt", "nut", "washer", "screw"]},
    "quantity": {"type": "integer", "minimum": 1},
    "request_key": {"type": "string", "minLength": 1}
  },
  "required": ["sku", "quantity", "request_key"],
  "additionalProperties": false
}
```

### Enums, nested objects, and arrays

An **enum** limits a field to named choices. A **nested object** applies an object schema inside a field, such as a delivery address. An **array** holds ordered values with constrained element types and length. A batch reservation could use an `items` array, but the schema does not make all reservations commit together. [JSON Schema array reference](https://json-schema.org/understanding-json-schema/reference/array).

### Validation

**Validation** checks a parsed value against the contract. `quantity=3` passes type and lower bound; `quantity=0` fails before dispatch. A valid object can still lack permission or ask for more bolts than exist.

@fig schema_gate | Each gate answers a different question. Illustrative values pass syntax and schema checks before authorization and the server's current-stock check.

Some constrained-generation systems support only a subset of JSON Schema, so pin that subset to your serving interface. JSON Schema's `integer` allows JSON `3.0`; a parser that insists on a host-language integer has a narrower contract and should document it.

## 5. Exposing tools to the model

The Python function exists in your process, but Finch-24 cannot read your process memory. A function becomes usable only once the model receives the contract in a form it was trained on.

### Serializing tool definitions and function signatures

**Serialization** turns structured data into the sequence the model reads. A **function signature** states an operation's name and parameters. A chat template renders tool names, schemas, and descriptions into the prompt, where they consume context like any message.

The Transformers tool-use interface accepts JSON schemas or derives them from documented Python functions; the template decides their final tokens. Emitting a function's name does not run it. [Transformers tool-use documentation](https://huggingface.co/docs/transformers/en/chat_extras).

### Tool availability and tool selection

**Tool availability** is the set of operations permitted for this request and user. **Tool selection** is the model's choice among them, including no tool. Enforce availability in the runtime's registry, not by leaving a name out of the prompt.

If this request exposes only `get_stock` and `reserve`, a generated `delete_inventory` call has no dispatch target, whatever the model remembers from training. And "What does a reservation mean?" needs an explanation, not a tool call. More tools do not mean better answers.

For an illustrative 320-token prompt, including tool descriptions, a 48-token call and a 192-token result add 240 tokens per turn. Section 12 shows how verbose definitions and outputs crowd out later work. These counts are stipulated fixtures, not tokenizer output.

## 6. Tool-call representation

Two stock checks finish in the opposite order from their start. If results attach to "the most recent call," the agent could reserve nuts based on bolt stock. The protocol needs identity as well as content.

### Tool names, arguments, and tool-call IDs

A **tool call** is a structured assistant request for an operation; its **tool-call ID** links the request to its result. The name selects the operation and the arguments supply inputs. The ID is a protocol link, while `request_key` identifies the business operation for retry deduplication.

```json
{
  "id": "c1",
  "name": "get_stock",
  "arguments": {"sku": "bolt"}
}
```

This is our teaching protocol, not a universal format. Some APIs send arguments as a JSON string inside an envelope, others as a parsed object. Parsing a string twice, or treating an object as a string, creates a new boundary bug.

@fig call_result_identity | An illustrative pair of reads keeps its IDs with the results. The second item's availability is a separate fixture, not inferred from the first call.

The reservation carries both a call ID and an operation key, and the annotated payload shows which does what.

@fig tool_json_anatomy | An illustrative reservation call separates protocol identity, dispatch name, typed quantity, and business-operation identity.

### JSON formats, special tokens, and model-specific formats

**Special tokens** are vocabulary entries that mark boundaries or control meaning. A checkpoint may express calls as JSON, dedicated delimiters, or a mix of text and control tokens; the tokenizer and template decide which bytes become which IDs.

Never borrow another model's delimiters because both call the feature "tools." Training and inference must use the same representation, and a stop at the end of a tool-call message must be distinguished from finishing the user's task.

## 7. Parsing tool calls

The stream ends after `{"sku":"bolt",`, a plausible prefix of a call and invalid JSON on its own. Executing as soon as `bolt` appears would let partial generation change the environment.

### Detecting tool boundaries and parsing JSON

A **parser** converts a completed protocol payload into structured fields. First the runtime finds where the payload begins and ends, then parses the JSON, then validates arguments against the schema and task rules. Each step reports its own failure.

Use the checkpoint's structured parser or documented delimiters, never a regular expression grabbing the first braces in prose, since braces appear inside strings and quoted text. Python's `json.loads` checks syntax, not authorization, and by default accepts some nonstandard numbers and repeated keys, so a strict protocol must reject those itself. [Python JSON reference](https://docs.python.org/3/library/json.html).

### Partial generations and invalid syntax

**Partial generations** stay buffered until the call is complete. A token-budget stop before the closing boundary gives an incomplete message; bad syntax in a finished message gives a malformed one. Neither is executable.

@fig partial_call_buffer | The illustrative stream accumulates three chunks. Only the completed object becomes a candidate for parsing, validation, and dispatch.

A complete object with only `sku` and `quantity` still lacks the required `request_key` and must not execute. The next part turns such failures into bounded recovery instead of guessing missing values.

:::warn Watch out
Never use `eval` on generated arguments. It runs code instead of checking data. Parse, validate structure, check the operation is allowed, and only then call a registered function.
:::

:::interview Interview lens
**"What makes a language model an agent?"** A loop around it that lets it choose operations, receive observations, and continue using them. The model generates decisions; the runtime owns validation, execution, state, and limits. In the stockroom, the receipt proves the reservation happened, and an eloquent final sentence proves nothing.
:::

:::key In one breath
A model proposes messages and calls; the runtime connects them to tools and state. Definitions explain an operation and schemas constrain its data, but server checks decide permission and business validity. Call IDs pair results with requests, and an operation key prevents duplicate writes on retry. Serialization, parsing, and completion detection must match the checkpoint's protocol.
:::

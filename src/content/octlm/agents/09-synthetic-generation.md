@part IX | Generating useful demonstrations | This part makes correct tool-use data without requiring a person to write every trace. Automation is useful only when the teacher and environment are known. We will build task trajectories with a scripted expert, vary their conditions, and generate calls whose meaning and syntax are both checked. | where:9

## 51. Why synthetic traces

A person can write a few stockroom demonstrations carefully. Writing every item, quantity, refusal, wording, and error by hand gets repetitive, and a program can generate the combinations if it knows what correct behavior is.

### Limited human demonstrations and scalable data generation

A **synthetic trace** is a demonstration produced by a specified program, model, or simulator rather than recorded from a person doing the task. Generation scales coverage while keeping provenance; many rows are not new evidence of correctness.

### Controlled examples

**Controlled examples** vary named factors while the contract stays fixed. Our generator varies the quantity and derives remaining stock from the action, so a reservation of 3 from 12 always returns 9 instead of an invented plausible number.

@fig synthetic_cartesian_tasks | The illustrative generator combines four item names, three quantities, and five phrasings into 60 requests. More phrasings do not make one task family independent.

Schick and colleagues' *Toolformer* had a language model propose API calls and kept those that lowered prediction loss. Our scripted expert instead knows the correct policy directly. [Toolformer paper](https://arxiv.org/abs/2302.04761).

Synthetic data magnifies the teacher's mistakes. Before scaling, read complete examples, compare simulator and real tool behavior, and test held-out cases. A reproducible generator at least makes its failures reproducible.

## 52. Tool-use trajectories

A JSON call alone does not say whether the agent was answering a definition, checking stock, or reserving. The trajectory around it gives the action its reason.

### User request, tool call, tool result, and additional steps

A **trajectory** is the ordered sequence of decisions and observations in a task: a request, calls and results, and further steps that depend on earlier evidence. The environment's starting snapshot is part of its provenance even when the model never sees it.

### Final response

The final response closes the task according to what was observed: a reservation of 3 and 9 left on the success path, the reason nothing committed on the unavailable path. A success answer pasted into a failure path is a wrong demonstration, however well formatted.

The seven-message trajectory's two calls are not interchangeable: the read supplies the reservation's condition, and the receipt supplies the final count. Generators must keep these dependencies, not just sort messages by role.

Build a structured event record before applying a chat template, so calls can be replayed, call IDs checked, and state recomputed. Serialization then renders a checked trajectory instead of reconstructing a missing environment from prose.

## 53. Scripted experts

The generator needs a teacher that knows what should happen next. For a simple inventory contract, a short deterministic policy is easier to audit than free model output.

### Deterministic correct policy, known tool choice, and known arguments

A **scripted expert** is a program that follows a known policy for a task family. It reads stock, compares the request with availability, submits the authorized operation when allowed, and reports the receipt. Tool choice and arguments come from the task specification, not guessed text.

@fig scripted_expert_branches | The illustrative expert reserves 3 from availability 12 and refuses a request for 13 under the declared policy. Both branches are correct demonstrations.

### Generating demonstrations

On the success path, `12 >= 3` permits the action and `12 - 3 = 9` gives the output. On the unavailable path, `12 < 13` blocks the commit and availability stays 12. If the application includes ambiguous requests, expired permissions, timeouts, or retries, the policy needs rules for those too.

The expert is correct only relative to its contract. If the real tool checks stock at commit time and the simulator checks a stale read, the teacher has dropped concurrency semantics. Keep the policy small enough to audit and test it against the real tool before trusting its traces.

:::story Picture this
A teacher builds arithmetic exercises from a template and computes the answer key before handing them out. Changing names in the word problem is easy; checking the arithmetic still matches is the work. Synthetic trajectories need the same split between generating a request and establishing its answer.
:::

## 54. Task generation

Sixty wordings all ask for 3 bolts at the same stock level, and a model can memorize that answer. The decision has to vary, not just the sentence.

### Templates and parameterized tasks

A **task template** is a request form with slots; a **parameterized task** fills the slots with values and environment conditions. Our grid uses 4 items, quantities 1, 3, and 5, and 5 phrasings, for `4 × 3 × 5 = 60` requests before state variants.

### Multi-tool tasks and edge cases

Multi-tool tasks need a read before a write, several reads before a choice, or a write followed by verification. **Edge cases** probe the contract's boundaries: exactly enough stock, zero or negative quantities, unknown items, duplicate keys, unavailable tools.

At availability 12, quantity 12 is a boundary that leaves zero after a valid commit, 13 crosses the condition and must not commit, and zero falls outside the positive-integer contract entirely. Treating them as ordinary examples erases the boundary the model must learn.

@fig quantity_boundary_cases | Computed outcomes for four requested quantities against availability 12. The shaded span is the valid, satisfiable range; each marked case is a distinct demonstration.

Generate semantic task identities first, then phrasings, and fix the held-out combinations before writing any text. Otherwise paraphrases of training tasks leak into validation and inflate generalization.

## 55. Generating tool calls

The expert knows the quantity, but building JSON by string concatenation breaks when an item name contains a quote. Correct policy and correct serialization are separate jobs.

### Correct tool, correct arguments, and schema-valid output

**Call generation** turns the expert's decision into a structured request: pick a permitted tool, derive arguments from task and observations, encode with a data serializer, and validate against the runtime's schema and envelope.

```python
call = {
    "id": call_id,
    "name": "reserve",
    "arguments": {
        "sku": task["sku"],
        "quantity": task["quantity"],
        "request_key": task["request_key"],
    },
}
payload = json.dumps(call, allow_nan=False)
```

This sketch assumes `task` already passed semantic checks, `call_id` is unique in its conversation, and `json` is Python's module. `allow_nan=False` blocks nonfinite numbers, but schema validation is still required.

Omitting the operation key makes the trace invalid before execution even when item and quantity are right. Derive keys reproducibly per logical request and keep them across retries so the teacher demonstrates the intended identity semantics.

:::note Teacher policy versus target policy
A scripted expert may use hidden state to produce a correct trace, but every assistant decision must be justified by what the assistant could see at that step. Otherwise the data teaches oracle actions the deployed model cannot reproduce.
:::

:::warn Watch out
Never add malformed calls as desired outputs without a recovery purpose. A useful error example shows the failure, the observation, and a corrected continuation; unlabeled invalid calls just teach invalid calls.
:::

:::interview Interview lens
**"How would you generate tool-use training data without another language model?"** Define a task family with a deterministic correct policy, generate parameterized requests and fixtures, and run the policy through the real tool interface. Keep requests, calls, results, and answers as structured trajectories. Validate schemas, replay transitions, and split semantic families before adding paraphrases, since row count is not diversity.
:::

:::key In one breath
Synthetic traces expand a known policy into checked demonstrations. Generate semantic tasks and states before varying prose, and derive tool choices and values from visible evidence. A scripted expert is only as correct as its contract and simulator. Schema-valid calls still need causal trajectories and verified state transitions.
:::

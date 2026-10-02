@part X | Proving what the generated data says | This part gives generated traces an evidence trail. A simulator can produce tidy conversations that disagree with the real tool service. We will distinguish execution sources, build role-correct records, validate both outcomes and syntax, and prevent training families from leaking into validation. | where:10

## 56. Tool results

A synthetic tool returns receipts instantly and never times out. The real service has concurrent reservations and sometimes loses a response. Training only on the simulator's success path leaves the agent unready for the real contract.

### Real execution and simulated execution

**Real execution** gets observations from the actual tool in a controlled fixture. **Simulated execution** gets them from a model of the tool's state transitions. The first tests integration; the second makes controlled conditions cheap. Both need declared provenance.

@fig synthetic_real_vs_simulator | The illustrative real and simulated paths share a successful arithmetic transition. Agreement here says nothing about concurrency, timeouts, or duplicate requests.

### Failure cases

Include insufficient stock, schema rejection, permission denial, tool exceptions, and uncertain commits where relevant, and simulate their semantics, not just an error-shaped string. A failure before commit leaves availability at 12; a committed reservation with a lost response leaves 9 and must be reconciled by operation key.

Use isolated databases or reversible fixtures for real writes; never reserve production stock to get realistic text. Compare simulator cases against real execution, especially boundaries and retries, and record what the simulator deliberately leaves out.

## 57. Constructing conversations

Every event is valid, but a tool response sits before the call that produced it. The objects look fine; the conversation is no longer a causal demonstration.

### System prompt, user message, tool call, result, and final answer

**Conversation construction** assembles validated events in protocol order: system prompt with tool definitions and rules, user task, assistant calls, matching results, and a final answer after the last required evidence.

In the stockroom path, IDs `c1` and `c2` appear on their calls and then on their results, and the operation key `r1` persists in the reservation arguments and receipt. These stay typed fields until serialization instead of being recovered from prose.

The trace has seven messages. A generator that adds a recovery attempt must also add the error observation and corrected decision and recount; message count follows from the protocol, not a fixed length.

Check finished conversations for role order and call-result completeness. A refusal without a write can be complete; a success claim without evidence of the commit cannot. Keep execution receipts in the source record even if training renders only some fields.

## 58. Positive and negative examples

The word *negative* can mislead a dataset builder into thinking such rows contain wrong behavior. In SFT, the target output is still the correct response to its situation.

### Successful use and invalid requests

A **positive example** demonstrates an appropriate successful action. A **negative example** here is a situation where an action should be rejected or avoided, calling for a clarification or refusal instead of a tool call. Training rewards that correct response.

### Tool errors and cases where tools should not be used

Tool errors can lead to a corrected call, a safe reconciliation, or a clear report that the work could not finish. Tools should not be used for explanations that need no fresh evidence or requests outside the permitted task. Each needs its own demonstrations and evaluation.

Availability 12 and quantity 3 give a successful action ending at 9. Quantity 13 gives no commit. "Explain what reserved stock means" gives no stock read. The model should learn these conditional differences, not one recurring tool name.

Some datasets train recovery after a bad earlier call. Keep the mistake as context and supervise only the correction; never make the erroneous call a target unless that is deliberate and the imitation risk is understood.

:::story Picture this
A first-aid lesson covers when to apply a treatment and when it is inappropriate, and both are correct lessons. Refusing an invalid reservation is likewise a correct lesson in the contract.
:::

## 59. Synthetic data validation

The generator produces 60 rows; 8 are duplicates and 4 contradict the environment. Keeping all of them turns a coverage count into a misleading training count.

### Schema validation and execution validation

**Synthetic data validation** checks generated data before training. Schema validation covers names, values, types, envelopes, and role structure. **Execution validation** replays calls or checks receipts against the environment's semantics. Neither replaces the other.

### Duplicate removal and corrupted trace filtering

**Duplicate removal** groups equivalent examples by a defined identity. **Corrupted trace filtering** rejects incomplete role sequences, missing results, contradictions, and unsupported final answers. Keep discard reasons and source IDs so the corpus can be audited.

@fig synthetic_validation_funnel | Illustrative disjoint discard buckets reconcile exactly: `60 - 8 - 4 = 48` retained traces. Overlapping categories must be counted as a union, not subtracted twice.

Define duplicates by normalized task, environment state, and action sequence. Text-only matching misses paraphrases of one trajectory, while over-broad normalization merges genuinely different states. Fit the definition to the claim.

Hand-check a sample after automated checks. A schema-valid, execution-consistent trace can still serve the wrong request if the request-to-argument mapping is wrong, and only the task specification catches that.

## 60. Train / validation separation

Training says "Reserve 3 bolts" and validation says "Please reserve three bolts." Different words, possibly the same task on the same stock fixture, so validation may mostly measure paraphrase familiarity.

### Template leakage and task-family leakage

**Template leakage** puts closely related phrasing on both sides of a split when the claim is about unfamiliar templates. **Task-family leakage** puts the same decision family on both sides when the claim is about new families. Neither is always wrong; the split must match the generalization claimed.

### Generalization

**Generalization** is performance on a specified unseen distribution. Hold out values to test new values, combinations to test new tool combinations, and families to test new tasks. A random row split measures familiar-distribution performance only.

@fig synthetic_family_split | An illustrative item-family split gives 45 training requests from three families and 15 validation requests from one held-out family. It tests item-family transfer under shared wording, not new tools or templates.

The counts are `3 × 3 × 5 = 45` and `1 × 3 × 5 = 15`. If the items are interchangeable enum labels, the split mostly tests a new label. A stronger split changes the decision structure, such as a dependent multi-item reservation, with correctness rules kept explicit.

Split semantic identities before generating paraphrases, keep assignments through deduplication, and never tune against a final test set and then call it untouched.

:::note A split tests one boundary
No score is "leakage-free" without a defined distribution. Unseen phrasings of known families and entirely new families answer different questions; report both when both matter, and name which is which.
:::

:::warn Watch out
Removing exact duplicates after a random split leaves semantic leakage, because many strings describe the same request, state, and solution. Deduplicate and assign families by structured identity before generating text.
:::

:::interview Interview lens
**"What checks would you put between a synthetic-data generator and SFT?"** Protocol, schema, call-result matching, and state transitions, then whether each final answer is supported by its results. Semantic deduplication with recorded reasons. Split assignment before paraphrasing. Finally, inspect serialized batches and masks, since preprocessing can corrupt a correct trace.
:::

:::key In one breath
Say whether results came from real tools or a simulator, and validate failure semantics. Build conversations in causal order with stable identities. Correct refusals and no-tool answers belong beside successful actions. Cleaning must reconcile its counts, and the split must match the generalization claimed.
:::

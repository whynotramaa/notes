@part XI | Measuring the change and its regressions | This part puts the adapted model beside its starting checkpoint. A better syntax score can hide new semantic errors or unnecessary actions. We will hold the benchmark fixed, pair outcomes, test generalization and ordinary chat, and inspect complete multi-step traces. | where:11

## 61. Before-vs-after evaluation

The adapted model succeeds on 16 tasks where the starting model succeeded on 12. That is a useful first number, but we still need to know whether the tasks and rules matched and which outcomes changed.

### Base model, fine-tuned model, and same benchmark

A **before-versus-after evaluation** compares the exact starting checkpoint with its adapted version on one benchmark. *Base model* here means the model under the adapter, as in Section 26. Freeze tasks, environments, runtime, schemas, template, sampling settings, and grading.

### Controlled comparison

A **controlled comparison** changes the intended variable and documents anything else that differs. Pair runs by task and, where relevant, sampling seed. Training seeds and sampling seeds are different sources of variation; record both rather than treating one reproducible generation as a stable result.

@fig before_after_paired_tasks | Illustrative paired results: ten successes in both systems, six gains, two losses, and two failures in both. The aggregate rises from 12 to 16 while two new failures appear.

The net gain is `6 - 2 = 4` successes, or 20 percentage points on 20 tasks. A net gain does not mean every task improved, and pairing exposes the new failures the aggregate hides.

This small fixture supports no claim of statistical certainty. Repeated sampling, several training seeds, and a representative evaluation set are separate evidence, and a score on synthetic stockroom tasks covers that distribution only.

## 62. Tool-call improvement

After training, JSON errors nearly vanish, but the assistant still sends quantity 4 for requests of 3. One boundary improved; the user's outcome is still broken.

### Validity, selection, argument accuracy, and task success

**Tool-call improvement** should be reported separately for validity, selection, argument accuracy, and task success. Format-focused data can lift validity directly; tool choice and value grounding need diverse request-state data. Lower SFT loss implies none of these.

The illustrative ledger has 22 valid calls in 24 attempts and 19 correct arguments in those 22: conditional argument accuracy 86.3636%, task success 80% on 20 tasks. Different populations, so do not multiply them as if they were stages of one probability model.

Compare per-task changes and error buckets, not just rates. An extra read raises valid-call counts without improving completion; mean calls and latency reveal it.

Adding a decoding constraint alongside SFT changes both enforcement and weights. For a fine-tuning claim, measure each separately; otherwise call it a system change and name both parts.

## 63. Regression testing

The trained assistant starts calling `get_stock` when asked to write a birthday message. The specialization improved its benchmark and changed how it reads unrelated requests.

### Normal chat, non-tool tasks, and reasoning

**Regression testing** checks behaviors a change should preserve: normal chat, non-tool tasks, and reasoning relevant to the starting model's use. A specialization is not a success because every test resembles its training data.

### Formatting and unexpected tool calls

Formatting tests check response structure and boundary tokens. **Unexpected tool calls** checks whether the model acts when nothing is needed. A no-tool task has a real expected outcome, so an unnecessary call fails it even when the prose is fine.

A no-tool explanation can share the 20-task inventory denominator with reservations, but keep a separate general-behavior regression set too, since a few stockroom explanations do not represent ordinary chat. State that set's scope instead of claiming "general ability is unchanged."

Isolate the environment during regression runs. An unexpected write should show up as an attempted action, blocked or sandboxed by normal authorization, rather than relying on the model to behave.

:::story Picture this
A mechanic repairs the brakes, then checks steering and lights. The brake test is necessary but is not the whole inspection. Post-training evaluation separates the specialized behavior from what the change should leave intact.
:::

## 64. Generalization

"Set aside 5 nuts" differs from "Reserve 3 bolts" in words and values. If the assistant succeeds, which skill transferred? The test must separate phrasing, arguments, and decision structure.

### New phrasings, new argument values, and new combinations

**New phrasings** keep the request and change the language. **New argument values** keep the structure and change items or quantities. **New combinations** compose tools or conditions in ways absent from training. These are separate axes.

@fig generalization_axes_agents | Illustrative changes isolate wording, values, combinations, and environment conditions. Each axis defines a different held-out distribution.

At availability 12, an unseen quantity of 5 should reserve and leave `12 - 5 = 7`. That shows transfer to a new value under the familiar policy, not competence at an atomic multi-item reservation, which is a different contract.

Hold out by the claim: random splits estimate same-distribution performance, family splits test harder boundaries. Report by axis so success on new wording does not hide failure on new dependencies.

## 65. Error buckets

Several failed transcripts end with "I could not complete that." One ran out of steps, one chose the wrong tool, one hit a broken service. The final wording classifies nothing.

### Wrong tool, wrong arguments, and invalid syntax

An **error bucket** groups failures by a common observable cause. Wrong tool is selection, wrong arguments are semantic inputs, invalid syntax is representation. Keep raw output so parser and model responsibility can be separated.

### Premature final answer and unnecessary calls

A **premature final answer** concludes before the required evidence or action. **Unnecessary calls** spend resources without advancing the task. Answering after the read but before the write is premature; rereading unchanged state is unnecessary.

@fig error_bucket_ledger | The ledger defines behavioral buckets before results are counted. The categories are schematic; no measured frequencies are implied.

Give each failed task one primary bucket so totals reconcile, and use secondary tags for consequences. After training, four paired tasks fail, so primary counts sum to 4; a task with wrong arguments and a false final statement counts once.

Bucket shifts point to the next experiment: schema errors suggest format work, valid but wrong values suggest grounding and diversity, and tool-server failures need execution fixes, not training.

## 66. Multi-step evaluation

Our teaching benchmark requires a stock read before reserving, to test decisions conditioned on observations, so writing first violates that declared path. The business goal alone does not need the read, since an authorized direct reservation succeeds through the atomic stock check; accept that shorter path unless the read is an explicit requirement.

### Correct ordering and intermediate decisions

**Multi-step evaluation** checks decisions conditioned on earlier results. Correct ordering means dependencies are satisfied, not that independent calls follow one arbitrary order. Intermediate decisions must use available evidence and keep operation identities.

### Recovery and final completion

Test recovery with injected errors whose semantics are documented. A schema rejection allows correction with no external effect; a timed-out write needs same-key reconciliation. Final completion checks the environment and the report afterwards, including that only one reservation committed.

The normal path has two calls and seven messages. A recovery path can be longer and still correct if it stays within budget and commits exactly one reservation of 3. A shortest-path reference must not reject it for length when recovery is what is being tested.

@fig recovery_scenarios_agents | Four illustrative scenarios and their required end states from availability 12. The orange path reconciles a lost response with the same key, so the stock ends at 9 rather than 6.

These four are illustrative, not a complete fault model. Combined faults and concurrent changes need their own cases if the deployment depends on them.

:::note Reproducibility has a scope
Fixed task and sampling seeds reproduce a run on the same software and hardware, not identical training across devices or library versions. Store environment details and artifacts with the seeds.
:::

:::warn Watch out
Do not loosen the parser between before and after runs without saying so. Accepting more malformed output inflates valid-call rate and pushes ambiguity into execution. A weight-only claim needs an unchanged runtime.
:::

:::interview Interview lens
**"How would you prove a tool-use fine-tune helped?"** Compare original and adapted checkpoints on the same held-out tasks, runtime, and paired conditions. Report task success, validity, selection, arguments, calls, latency, and regressions, then inspect the individual gains and losses. Keep the claim to the tested distribution and measured variability.
:::

:::key In one breath
Compare exact checkpoints on a fixed benchmark and keep paired outcomes. Validity, selection, arguments, and final success answer different questions. Regression tests and held-out axes bound the claim. Complete trajectories, including recovery and environment state, are the unit of correctness the user sees.
:::

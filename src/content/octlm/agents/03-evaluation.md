@part III | Harness evaluation | This part turns the stockroom request into a testable outcome. Good prose and valid JSON can coexist with a wrong action. We will build fixed tasks, define each metric's denominator, and trace failures to the component that caused them. | where:3

## 15. Evaluating agents

The assistant reserves 4 bolts and politely says it reserved 3. The answer reads well and the call is valid JSON, but the stockroom is wrong. Grading fluency would reward the failure.

### Why text quality is insufficient

**Agent evaluation** measures whether a system chooses and executes the right actions and completes the task. Clear text matters, but it does not replace inspecting the environment; a claim of completion is one more thing to verify.

### Tool correctness, task completion, and reliability

**Tool correctness** covers the allowed operation, correct arguments, and valid representation. **Task completion** means the resulting state meets the request and the final answer describes it accurately. **Reliability** is how often both hold across tasks, runs, and changes in wording or state.

Availability starts at `17 - 5 = 12`. Success means one reservation of 3 for the right user and 9 left. Reserving 4 leaves `12 - 4 = 8`, a valid call that fails the task; reserving 3 twice leaves 6 and also fails.

@fig agent_eval_layers | The illustrative wrong-quantity call passes local format checks but fails argument accuracy and the environment-level goal.

Define success before looking at outputs. A benchmark may require one exact outcome while allowing several valid paths, and penalizing every deviation from one reference trace marks correct solutions wrong.

## 16. Evaluation sets

An inventory agent tested only on successful reservations can learn to call `reserve` for everything. It looks capable until someone asks for a definition or for stock that does not exist.

### Fixed tasks and expected outcomes

An **evaluation set** is a versioned collection of tasks, starting environments, permitted tools, and grading rules. **Expected outcomes** describe final conditions, such as one reservation of 3 and 9 remaining. Keep tasks and fixtures fixed across a before-versus-after comparison.

### Single-tool tasks, multi-tool tasks, and negative cases

A **single-tool task** finishes with one operation, such as reading stock. A **multi-tool task** depends on several observations or actions. **Negative cases** call for a refusal, a clarification, or no tool, and they test correct restraint rather than padding the dataset with errors.

@fig eval_task_matrix | Four illustrative task families test reading, conditional action, business refusal, and answering without a tool.

For an illustrative 20-task set with 10 reads, 5 conditional reservations, and 5 no-action cases, report each family's result, not one aggregate, or strong reads will hide a weak write path. These counts are a chosen design, not a standard.

Reset the inventory between trials so one reservation does not change the next task's start. Record model and template versions, sampling settings, fixtures, tool behavior, and evaluator version with every transcript.

## 17. Establishing a baseline

You attach LoRA and see fewer malformed calls. Encouraging, but you need to know what the unmodified checkpoint did in the same runtime; changing parser and weights together hides the source of the gain.

### Base-model performance

A **baseline** is the fully specified comparison system. **Base-model performance** here means the unmodified starting checkpoint, which may already be instruction-tuned, not necessarily a raw pretrained model. Freeze runtime, schemas, tokenizer, template, and tasks before comparing adapters.

### Tool-selection accuracy, valid-call rate, and task success

Report tool-selection accuracy, valid-call rate, and task success separately. One checkpoint may pick the right tool in broken syntax; another may emit valid calls to the wrong operation. The same aggregate can hide opposite training needs.

Our illustrative fixture has 20 tasks. The starting model succeeds on 12, or 60%; the adapted model on 16, or 80%. The absolute gain is 20 percentage points and the relative gain `(16 - 12) / 12 = 0.333333`, or 33.3333%. Neither says whether 20 tasks support a general claim.

Save baseline transcripts before training. They map the failures and later show whether a gain came from selection, arguments, syntax, or recovery. Section 61 returns to this comparison.

## 18. Tool selection accuracy

With current stock already in view, the assistant calls `get_stock` again. The call is harmless and valid, but it is wasted work that can exhaust a tight budget before the reservation.

### Correct tool, wrong tool, missing tool use, and unnecessary tool use

**Tool selection accuracy** measures whether the chosen operation matches what the task needs at that point. The classes are correct tool, wrong tool, missing tool use when evidence or action is needed, and unnecessary tool use. Include an explicit `no_tool` choice in the grading.

Over an illustrative 20 labeled decision points, 18 correct choices give 90%. The denominator is decision points, not generated calls; a missed call must count, or a model that never calls tools escapes evaluation.

At the first step, `get_stock` is right. After the read returns 12, `reserve` is right if the user authorized it. After the receipt shows 9, a final answer is right. The same tool is right at one stage and wrong at another.

When several tools satisfy a task, label the acceptable set. When calls can run in parallel, grade dependencies, not one linear order, or the evaluator punishes freedom instead of errors.

@fig tool_selection_tree | An illustrative decision tree for the stockroom's operation types, with the no-tool branch visible. Being in the registry does not make a call necessary.

## 19. Argument accuracy

The model picks `reserve` with `sku="nut"`. The tool is right; the item is wrong. Arguments need their own grade.

### Correct values, correct types, missing arguments, and hallucinated arguments

**Argument accuracy** checks meaning as well as type. Values must come from the request, current observations, or documented defaults. Missing arguments leave required information out. **Hallucinated arguments** are invented fields or values the task does not support.

In the illustrative fixture, 22 calls are schema-valid and 19 have correct arguments. Over valid calls the rate is `19 / 22 = 0.863636` (86.3636%); over all 24 attempts it is `19 / 24 = 0.791667` (79.1667%). Both are useful if the report names its denominator.

Quantity must be 3, and the schema only says it is a positive integer. The server cannot tell that 4 contradicts the request unless authorization encodes the approved operation, so bind authorization to the relevant arguments.

Compare parsed values, not JSON field order. Missing and explicit `null` can differ. Normalize dates, amounts, and units only by a documented rule, since silent conversion hides exactly the errors training should fix.

## 20. Tool-call validity

The correct quantity sits inside a truncated object. The intent is right, but the runtime cannot execute it. Syntax failures and wrong business decisions need different training examples.

### JSON validity, schema compliance, valid tool names, and complete arguments

A **valid call** passes the protocol's syntax check, names an allowed operation, and supplies complete schema-compliant arguments, plus any envelope rules such as a unique call ID. Keep this definition fixed across baseline and adapted model.

Here 22 of 24 attempts pass, a valid-call rate of `22 / 24 = 0.916667` (91.6667%). The two failures stay in the record even if the agent recovers. Scoring only executed calls would make validity trivially perfect, since invalid calls never dispatch.

@fig eval_denominators | These illustrative metrics use explicit populations. The same numerator gives a different rate when validity, semantics, or task outcomes define the denominator.

Constrained decoding improves syntax but cannot choose the right quantity, and a parser bug can reject correct output. Keep raw and normalized output so failure analysis can tell them apart.

Report calls per task beside validity. Many unnecessary valid calls inflate the call-level sample while hurting completion and latency.

## 21. Task-level success

The agent reads and reserves correctly, then says 12 remain. The environment is right and the answer is wrong. A complete task needs the intended effect and an accurate report.

### Tool correctness vs final-task correctness

**Task-level success** checks the user's goal after the whole trajectory: environment assertions, evidence-grounded text, correct refusals, and the action budget. Correct individual calls are often necessary but never sufficient.

Here 16 successes in 20 tasks give 80%. Each task counts once however many calls it made, so long successful trajectories cannot outweigh short failures.

### Partial completion and multi-step success

**Partial completion** records fulfilled subgoals without calling the whole request done. A correct read is progress on a reservation task, not completion, and a wrong final number can be a separate bucket from a wrong committed quantity.

If each of three steps independently succeeds with probability 0.9, all three succeed with probability `0.9³ = 0.729`. Real errors are not independent: a shared misunderstanding can sink every step, and recovery can rescue a local mistake.

@fig compound_step_success | Computed success probability after one, two, and three independent 90% steps. The independence model is illustrative, not a claim about real agent errors.

Prefer final-state assertions. Exact trace matching fits only when the contract requires that trace; a retry through an idempotency key can legitimately differ from the shortest demonstration.

## 22. Agent metrics

A model completes more tasks with many extra calls and twice the time. Whether it is better depends on the requirements, and one score cannot cover quality, cost, and reliability at once.

### Success rate, valid-call rate, and average tool calls

An **agent metric** is a defined measurement of behavior or resource use. Success rate divides successful by attempted tasks; valid-call rate uses attempted calls; average tool calls divides by tasks, including zero-call tasks. Our fixture gives `24 / 20 = 1.2` calls per task, 80% success, and 91.6667% validity.

### Error-recovery rate

**Error-recovery rate** is the fraction of eligible error episodes the agent resolves. Resolving 3 of 5 injected recoverable errors gives 60%. A business refusal is not a failed retry when reporting it is the correct outcome.

### Latency and token usage

**Latency** is elapsed time for a named operation, with clear start and end points. Task times of 100, 200, 300, and 400 ms have mean 250 ms, and a mean hides slow tails, so report percentiles for real measurements.

**Token usage** separates input, generated calls, answers, and retained tool results under the serving system's accounting. At 800 input and 120 output tokens for each of 20 tasks, the total is `20 × 920 = 18,400`. Report cached input separately if it costs differently, and never equate tokens with time.

:::note Conditional metrics
An argument score over valid calls diagnoses meaning once format succeeds. It cannot replace the unconditional score over all decision points. Use the conditional metric for diagnosis and task success for the user's outcome.
:::

## 23. Failure analysis

The request fails. Retraining now is premature if the tool server ran the wrong operation or the evaluator checked stale state. Find the earliest wrong transition in the record.

### Model failure, prompt failure, and schema failure

A **failure analysis** assigns evidence-backed causes instead of "the model was confused." A model failure picks the wrong item despite correct context. A prompt failure describes quantity as a percentage. A schema failure allows ambiguous units or demands a field the model cannot know.

### Parser failure, tool failure, and evaluation failure

A parser failure misreads a valid representation. A tool failure mishandles a correct request or returns broken evidence. An evaluation failure uses a wrong expected outcome, rejects an equivalent trace, or forgets to reset fixtures. Each needs a different fix.

@fig failure_owner_agents | The first incorrect transition identifies an owner to investigate. Several owners can contribute, so a primary bucket should not erase secondary evidence.

For the wrong-quantity trace, compare the raw `quantity=4` with the requested 3. If normalization kept 4 and the tool reserved 4 correctly, the error came before dispatch. If the model emitted 3 and normalization changed it, the model must not be blamed or trained on a contradictory example.

Give each failed task one primary cause so totals reconcile, plus tags for contributing conditions. Save transcripts with environment snapshots so a fix can be tested against the exact failing transition.

:::interview Interview lens
**"Why can valid-call rate improve while task success stays flat?"** Validity only checks that the runtime can accept the call. The model can still pick the wrong tool, use a wrong but valid value, stop early, or misreport the result. I would compare error buckets on the same tasks and inspect the environment, and check the denominator, since extra valid but unnecessary calls raise a call-level score.
:::

:::key In one breath
Evaluate actions and final state, not the claim of completion. Freeze a baseline and include no-tool, refusal, and multi-call tasks. Every rate needs its denominator, and call validity never stands in for task success. Failure analysis follows raw output through parser, tool, environment, and grader before choosing a fix.
:::

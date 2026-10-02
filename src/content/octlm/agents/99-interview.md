@chapter faq | Interview question bank | Forty questions follow the chapter's data flow. Answer aloud before reading the response, then draw the corresponding mechanism from memory.

### Tools and the runtime

**Q1. What turns a language model into an agent?**

The runtime gives its outputs a path to tools, observations, retained state, and further decisions. The model proposes a call or answer. The runtime validates, executes, updates history, and enforces the stop policy.

**Q2. Who owns a tool's side effect?**

The runtime and tool service own execution and authorization. Generated text alone does not commit a reservation. A receipt and environment state provide evidence that the requested change actually happened.

**Q3. Trace the stockroom loop.**

The user requests 3 bolts. The assistant reads stock, receives availability 12, requests an authorized reservation, receives a receipt with 9 remaining, and reports that result. Our benchmark explicitly requires the read-before-write trace.

**Q4. What makes a tool definition useful?**

A stable name, a description of when to use it, constrained arguments, documented results, and clear failure semantics. State-changing tools also need operation identity and authorization rules so a retry cannot silently duplicate a write.

**Q5. Do JSON Schema properties make fields required?**

No. `properties` describes fields when present; `required` declares which must appear. Optional also does not mean nullable. Explicitly permit `null` if it belongs to the contract.

**Q6. Is valid JSON enough to execute a call?**

No. Check tool name, schema, business constraints, authorization, and operation identity. Reject unknown tools and disallowed fields. Parse complete structured arguments rather than executing generated source code.

**Q7. How are tools exposed to the model?**

The serving interface or chat template serializes available tool definitions into the model's input protocol. The definition visible to the model and the permitted registry used by the runtime must agree. Availability can differ by request and user.

**Q8. Why carry tool-call IDs?**

They attach each result to the request that produced it, including parallel calls or out-of-order results. An operation key serves a separate purpose: recognizing the same external write across retries.

**Q9. When should a streamed call be dispatched?**

After the protocol signals completion and the full arguments pass parsing and validation. A prefix that looks plausible may still be incomplete. Buffering protects the boundary between generation and action.

**Q10. How should malformed calls recover?**

Return a bounded, actionable error to the model when correction is possible. Preserve the failure in history and limit retries. Do not silently invent missing business values or map unknown tool names to arbitrary functions.

**Q11. Can a timed-out write be retried safely?**

A timeout does not prove the server failed to commit. Retry with the same operation key or query operation status when the service supports it. Atomic deduplication returns the original receipt instead of applying a second reservation.

**Q12. Is conversation state the same as model memory?**

The runtime stores the conversation and chooses the next input. An ordinary inference call has no independent memory of previous requests beyond the supplied context and compatible caches. A KV cache is computed model state, not a business ledger.

**Q13. What should a context summary preserve?**

The user goal, unresolved decisions, relevant observations, operation identities, and committed results. Remove irrelevant detail while retaining provenance where needed. A summary is lossy and can change what the next model call can know.

**Q14. When can KV prefix states be reused?**

When the cached prefix and all computation conditions affecting it are unchanged, including token sequence, positions, effective weights, template-derived input, and cache format. Edited history or a switched adapter can invalidate the reuse.

**Q15. What prevents an endless agent loop?**

Explicit final-answer boundaries, step and call limits, repeated-action detection, time budgets, and cancellation. EOS can end one generation without proving the task is complete. Record why execution stopped.

### Evaluation and specialization

**Q16. Why is text quality insufficient for evaluation?**

A fluent answer can describe an action that never occurred. Evaluate tool selection, arguments, valid calls, intermediate dependencies, final environment state, and user-goal completion. Include failure recovery and cases requiring no tools.

**Q17. What belongs in an evaluation set?**

Fixed task inputs, initial environment states, allowed actions, expected outcomes, and scoring rules. Include single-tool, dependent multi-tool, invalid-request, service-error, and no-tool cases. Reset the environment between independent tests.

**Q18. How do tool-selection and argument accuracy differ?**

Selection asks whether the model chose the appropriate tool or appropriately avoided one. Argument accuracy asks whether its proposed values mean the requested action. A correct tool with the wrong quantity still changes the wrong state.

**Q19. How do call validity and task success differ?**

Validity checks protocol and schema. Task success checks the user's outcome. A valid reservation of 4 bolts fails a request for 3, while a task may recover from an earlier invalid call and ultimately succeed.

**Q20. What makes an agent metric interpretable?**

A stated numerator, denominator, population, and measurement boundary. Conditional argument accuracy among valid calls and unconditional accuracy across all proposed calls answer different questions. Report costs and recoveries alongside success.

**Q21. How do you locate a failure's owner?**

Inspect the earliest boundary at which the trace violates the contract. Separate model choice, prompt ambiguity, schema design, parser behavior, service failure, and scoring mistakes. Later symptoms can receive secondary tags without double-counting tasks.

**Q22. When does prompting suffice, and when might fine-tuning help?**

Prompting changes the input and demonstrations available now. Fine-tuning changes weights and can encode repeated syntax or decision patterns. First establish the failure and baseline; training cannot repair a broken dispatcher or unreliable service.

**Q23. Is instruction tuning the same as pretraining?**

Both can use next-token losses, but their data and objectives differ. Pretraining learns broad continuation behavior. Instruction tuning uses task-oriented demonstrations to teach response behavior. Further tool specialization depends on that starting capability.

### LoRA and supervised fine-tuning

**Q24. What does LoRA change?**

It freezes a base matrix and learns a low-rank correction `sBA`. The forward map becomes `Wx+sB(Ax)`. Rank controls the intermediate factor width, and the product can have rank no greater than that width.

**Q25. How many parameters does a LoRA projection add?**

For a base weight with output width $m$ and input width $n$, rank $r$ adds $r(m+n)$ factor parameters. Count each selected projection using its real rectangular shape, then sum across layers.

**Q26. Why initialize one LoRA factor to zero?**

With the usual nonzero random A and zero B, the initial correction is zero, preserving base behavior. B can receive a gradient immediately. Initializing both factors to zero can prevent the adapter from learning through their product.

**Q27. What does alpha/r do?**

It scales the correction under the original LoRA convention. Its numerical value changes with rank when alpha is held fixed. Other scaling variants exist, so save and restore the actual convention rather than assuming it.

**Q28. Which modules can be adapted in Finch?**

Q, K, V, O, and the SwiGLU gate, up, and down projections. Gate passes through SiLU before multiplication by up. Inspect real module names and shapes; fused projection implementations can expose different targets.

**Q29. What must accompany an adapter checkpoint?**

The exact base identity, tokenizer and template, targets, rank, alpha, scaling, and any extra trained modules. A resume artifact needs additional training state. Matching tensor shapes alone does not establish semantic compatibility.

**Q30. Why can LoRA be merged?**

Both branches are linear at the projection, so the effective matrix is `W+sBA`. In evaluation mode this agrees in exact arithmetic. Floating-point order and serialization require numerical and task-level checks.

**Q31. What is teacher forcing?**

Training supplies the recorded correct prefix while learning the next recorded assistant token. It does not roll out the model's sampled earlier choices. That difference helps explain why good training loss need not imply reliable multi-step inference.

**Q32. What does assistant-only loss mask?**

It excludes nonassistant target positions from the loss while leaving their tokens visible as context. Supervise assistant calls and final answers under the chosen template. Shift the target mask consistently with the next-token labels.

**Q33. Should tool results be deleted when they have no loss?**

No. They are the observations the later assistant needs. Masking a token's target contribution does not remove its influence on later predictions. Deletion would teach continuation without the required evidence.

**Q34. Why retain full multi-step demonstrations?**

They teach later choices conditioned on earlier results, including errors and corrections. A call-only dataset can teach syntax while failing to teach how the assistant resumes after a tool response or knows when to finish.

**Q35. What does gradient accumulation change?**

It combines several microbatch contributions before one optimizer update. With correct loss weighting, it can emulate a larger effective batch under suitable conditions. It does not enlarge the context window or necessarily reproduce all batch-dependent behavior.

### Data, regression, and deployment

**Q36. How do you validate synthetic traces?**

Check schema, call-result identity, execution semantics, final outcome, and serialization. Remove duplicates and corrupt traces. A simulator must preserve the contract's important behaviors, and evaluation should expose gaps from real services.

**Q37. Why split by task family or template?**

A random row split can put near-identical generated tasks in both training and validation. Holding out families or templates better tests the intended transfer. Unseen wording, values, combinations, and environment states test different axes.

**Q38. How do you compare before and after training?**

Use the same held-out tasks, reset states, runtime, tool definitions, sampling policy, and budgets. Pair outcomes to expose gained and lost tasks. Test normal chat and no-tool cases for regressions as well as tool-use improvement.

**Q39. What checks follow merging and quantization?**

Compare logits under declared conditions, generation, and complete tool tasks on saved-and-reloaded artifacts. Quantization introduces approximation and can change discrete choices. Weight quantization does not automatically change KV-cache dtype.

**Q40. What is the final deployable agent artifact?**

The model weights or base-plus-adapter, tokenizer, template, permitted tools, runtime, state policy, and evaluation record together. A model file alone does not establish a functioning tool-use system.

@chapter exercises | Exercises | Twenty-five exercises are graded by filled dots: one for a short calculation or explanation, two for a derivation or diagnosis, and three for a complete design. All numerical fixtures are illustrative unless explicitly identified as model shapes.

### Short checks

**E1. ●○○ Inventory.** Starting with stock 17 and reservations 5, reserve 3. Compute availability before and after the operation.

**E2. ●○○ Message count.** Count a conversation with one system message, one user message, two call/result pairs, and one final answer.

**E3. ●○○ Context growth.** Starting at 320 tokens, append three turns containing a 48-token call and 192-token result. Compute total context.

**E4. ●○○ Prefix reuse.** A compatible cached prefix has 560 tokens and the appended suffix has 240. Compute total length and reusable fraction.

**E5. ●○○ Call validity.** Of 24 proposed calls, 22 are valid. Compute valid-call rate and mean calls for 20 tasks.

**E6. ●○○ Task improvement.** Task successes move from 12 to 16 out of 20. Give the rates, percentage-point gain, and relative increase.

**E7. ●○○ One adapter.** Count rank-8 factors for a `512 × 512` query projection and its full base matrix. Give the count ratio.

**E8. ●○○ Scaling.** With rank 8 and alpha 16, compute original LoRA scale. Does that number alone determine the correction's norm?

**E9. ●○○ Effective batch.** With microbatch 2 and accumulation 4, compute effective batch and updates per epoch for 96 examples, assuming complete groups.

**E10. ●○○ Explain aloud.** Explain why a valid JSON reservation call can still be wrong, without using tensor terminology.

### Derivations and diagnoses

**E11. ●●○ Toy forward.** Use identity base, `A=[1,2]`, `B=[3,4]ᵀ`, scale 2, and input `[2,1]`. Compute each branch and the final output.

**E12. ●●○ Merge.** For E11, derive the merged matrix and verify its output on the same input.

**E13. ●●○ Smaller targets.** Count rank-4 Q and V factors across all 8 Finch blocks. Use Q shape `512 × 512` and V shape `128 × 512`.

**E14. ●●○ Masked loss.** Three supervised tokens receive probabilities 0.5, 0.25, and 0.125. Compute mean negative-log loss. In a 16-position batch with 6 supervised positions, compute supervised fraction.

**E15. ●●○ Synthetic split.** Combine 4 SKUs, 3 quantities, and 5 phrasings. Hold out one SKU family. Compute total, train, and validation counts; state what this holdout tests.

**E16. ●●○ Retry diagnosis.** A reserve response times out after the server commits. Explain why retrying with a fresh operation key can change availability from 9 to 6, and how to prevent it.

**E17. ●●○ Derive factor storage.** Prove the rank-$r$ adapter count is $r(m+n)$ and that its matrix correction has rank at most $r$.

**E18. ●●○ Conditional metric.** There are 19 correct argument sets among 22 valid calls and 24 total proposed calls. Compute conditional and unconditional argument accuracy.

**E19. ●●○ Quantization.** On the grid with scale `1/127`, quantize 0.5 using nearest rounding and give the reconstructed value and absolute error.

**E20. ●●○ Explain aloud.** Describe why teacher-forced tool traces can have low loss while the deployed loop still fails after a mistaken first call.

### Complete designs

**E21. ●●● Boundary code.** Write a Python function accepting a complete argument JSON string for the four-SKU `reserve` tool. Reject unknown fields, missing fields, invalid quantity types, empty keys, and nonpositive quantities. It must not execute the reservation. State which production checks remain outside this function.

**E22. ●●● Full count.** Count a no-bias tied-output decoder with vocabulary 4,096, width 256, 4 blocks, 2 KV heads of width 32, SwiGLU width 768, two RMSNorm vectors per block, and one final RMSNorm. Query-head widths together equal model width.

**E23. ●●● State-changing evaluation.** Design a test that detects a duplicated reservation even when the final answer claims success. Include an initial state, a lost response, operation identity, and the outcome assertion.

**E24. ●●● Held-out comparison.** Design a before/after tool-use evaluation that detects overtraining on generated phrasing and unexpected tool calls in ordinary chat. Name controls, split policy, and metrics.

**E25. ●●● Preparation chain.** Specify checks for base-plus-adapter, merged, reloaded, and INT8 artifacts. Include cache identity, numerical comparisons, and a task-level criterion.

@chapter solutions | Worked solutions | Check the intermediate steps, not only the final number. The companion calculation script recomputes the model counts and numerical fixtures.

### Short checks, E1 to E10

**E1.** Before: `17-5=12`. After: `12-3=9`. Total physical stock stays 17; reservations rise to `5+3=8`.

**E2.** `2 + 2 × 2 + 1 = 7` messages. A call and its result are separate messages in this teaching protocol.

**E3.** `320+3 × (48+192)=320+720=1,040` tokens. This fixture already includes the declared message overhead inside those token counts.

**E4.** Total `560+240=800`; reusable fraction `560/800=0.7=70%`. Compatibility must be checked before treating that fraction as reusable computation.

**E5.** Validity `22/24=91.666667%`, rounded. Mean calls `24/20=1.2` per task. They have different denominators.

**E6.** Before `12/20=60%`; after `16/20=80%`. Gain is 20 percentage points. Relative increase is `(16-12)/12=33.333333%`, rounded.

**E7.** Factors contain `8 × (512+512)=8,192` parameters. Base contains `512 × 512=262,144`; it has `262,144/8,192=32` times as many parameters. This is one projection's factor saving, not the total model's memory ratio.

**E8.** Scale `16/8=2`. Correction norm depends on `BA` as well as scale; rank and alpha alone do not fix it.

**E9.** Effective batch `2 × 4=8` examples. Updates per epoch `96/8=12`. Three complete epochs give `3 × 12=36` updates.

**E10.** The call can request the wrong item, wrong quantity, or an unauthorized action while fitting the schema perfectly. The schema checks representation and constraints; the user request and service state determine whether the action is appropriate.

### Derivations and diagnoses, E11 to E20

**E11.** Base output `[2,1]`. `Ax=1 × 2+2 × 1=4`. `B(Ax)=[12,16]`; scaled correction `[24,32]`; final output `[2+24,1+32]=[26,33]`.

**E12.** `BA=[[3,6],[4,8]]`. Adding twice that matrix to identity gives `[[7,12],[8,17]]`. Its output is `[7 × 2+12 × 1,8 × 2+17 × 1]=[26,33]`.

**E13.** Q factors per block: `4 × (512+512)=4,096`. V factors: `4 × (128+512)=2,560`. Across blocks: `8 × (4,096+2,560)=53,248` parameters.

**E14.** Losses are `ln 2`, `2 ln 2`, and `3 ln 2`, or 0.693147, 1.386294, and 2.079442, rounded. Their mean is `2 ln 2=1.386294`. Supervised fraction `6/16=37.5%`. Masked positions are excluded from this loss denominator.

**E15.** Total `4 × 3 × 5=60`. Train `3 × 3 × 5=45`; validation `1 × 3 × 5=15`. This tests transfer to an unseen item family within the declared schemas, not necessarily new templates or unseen tools.

**E16.** A new key labels a new operation, so another 3 can be reserved: `9-3=6`. Reusing the original key lets an atomic deduplication service return its saved receipt. A client-side key is insufficient unless the server enforces that identity.

**E17.** A has shape `r × n`, contributing `rn`; B has shape `m × r`, contributing `mr`. Their sum is `r(m+n)`. Every column of `BA` lies in the span of B's at most $r$ columns, so the correction rank cannot exceed $r$.

**E18.** Conditional accuracy `19/22=86.363636%`; unconditional `19/24=79.166667%`, both rounded. The latter treats invalid proposals as failures in its declared population.

**E19.** Integer `round(0.5 × 127)=64`; reconstructed `64/127=0.503937`, rounded. Error `64/127-0.5=0.003937`, rounded. The example assumes the stated nearest-rounding rule.

**E20.** Training supplies the recorded correct prefix, including results. Deployment must live with its own earlier choices and actual service observations. A mistaken call can create a state absent from training. Recovery examples and rollout evaluation reveal this gap.

### Complete designs, E21 to E25

**E21.** This small parser rejects duplicate keys and JSON's nonstandard nonfinite constants as well as the requested schema violations. It accepts a complete string only; a streaming buffer must establish completion first.

```python
import json

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate key")
        result[key] = value
    return result

def reject_constant(value):
    raise ValueError("nonfinite JSON number")

def reserve_arguments(raw):
    obj = json.loads(raw, object_pairs_hook=unique_object,
                     parse_constant=reject_constant)
    fields = {"sku", "quantity", "request_key"}
    if type(obj) is not dict or set(obj) != fields:
        raise ValueError("missing or unknown fields")
    if obj["sku"] not in ("bolt", "nut", "washer", "screw"):
        raise ValueError("unknown sku")
    # bool is an int subclass, so check exact type.
    if type(obj["quantity"]) is not int or obj["quantity"] <= 0:
        raise ValueError("quantity must be a positive integer")
    if type(obj["request_key"]) is not str or not obj["request_key"].strip():
        raise ValueError("request_key must be nonempty")
    return obj

assert reserve_arguments(
    '{"sku":"bolt","quantity":3,"request_key":"r1"}'
)["quantity"] == 3
for raw in [
    '{"sku":"bolt","quantity":true,"request_key":"r1"}',
    '{"sku":"bolt","quantity":3,"quantity":4,"request_key":"r1"}',
]:
    try:
        reserve_arguments(raw)
    except ValueError:
        pass
    else:
        raise AssertionError("bad call accepted")
```

This teaching boundary intentionally uses a stricter Python-integer convention than general JSON Schema's mathematical integer type. Production execution still needs input-size limits, the permitted tool registry, authorization, current-stock checks, atomic commit, and operation-key deduplication. Validate the result contract too.

**E22.** Embedding `4,096 × 256=1,048,576`. Attention per block: `2 × 256² + 2 × 256 × 64=163,840`. SwiGLU: `3 × 256 × 768=589,824`. Norms `2 × 256=512`. Block total `754,176`; four blocks `3,016,704`; final norm 256. Complete total `1,048,576+3,016,704+256=4,065,536`. Tied output adds no second table.

**E23.** Start at availability 12. Commit a reservation of 3 under key `r1`, drop its response, and retry `r1`. Assert one committed operation, one stable receipt, and availability 9. A duplicate would leave 6 even if both final answers sounded correct. Restore initial state before each independent test.

**E24.** Hold out task templates or families according to the intended transfer, plus unseen values and ordinary no-tool requests. Fix model input rendering, tools, budgets, sampler, and initial states between before/after runs. Score task success, selection, validity, arguments, recovery, unnecessary calls, and costs; pair gained and lost tasks. Keep the test set out of training and checkpoint selection.

**E25.** Pin base, adapter, tokenizer, template, and cache identity. Compare unmerged with merged logits in evaluation mode on identical inputs, then repeat after save/reload. Run the fixed tool and regression benchmark on each artifact. Quantize with the intended runtime, recheck quality and real memory/latency, and rebuild incompatible caches. Declare numerical tolerance and task acceptance before inspecting the results.

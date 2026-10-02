@part IV | Choosing what training should change | This part asks whether a model needs different inputs or different learned behavior. Training the wrong target can make an expensive system imitate a broken protocol. We will compare prompting with fine-tuning, define the behavior to improve, and choose an appropriate starting checkpoint. | where:4

## 24. Prompting vs fine-tuning

Finch-24 emits the wrong tool-call format. You can show it a correct example in the prompt or train it on many correct examples. Both can fix the next call, but they change different things.

### What prompting changes and in-context examples

**Prompting** changes the token input and leaves parameters fixed. **In-context examples** are demonstrations placed in that input for the current generation to imitate. They cost context, must be resent every time, and can explain a new tool without a new checkpoint.

### What fine-tuning changes and behavior encoded in weights

**Fine-tuning** updates learned parameters with a training objective and dataset. Behavior in the weights appears without repeating demonstrations, but new tools still need a current interface definition, and training cannot update a stale description of a changed API.

@fig prompting_weights_agents | Prompting changes the supplied context. Fine-tuning produces a changed checkpoint or adapter, whose behavior must be evaluated under the same runtime.

Adding a 240-token demonstration to a 320-token prompt makes 560 tokens. A LoRA adapter might remove that repeated input, at the price of training, validation, deployment, and maintenance, and the saving only exists once the adapted model succeeds without the demonstration.

Fix the runtime and prompt first when they are wrong. Fine-tune when a stable target behavior still fails across a representative set and correct demonstrations exist. Training never replaces tool execution or error handling.

:::story Picture this
A worker can keep a procedure card on the desk or practice until the procedure is familiar. The card changes what is visible; practice changes what is learned. Either way, a changed machine needs an updated procedure.
:::

## 25. Fine-tuning goals

The failure report says "tool use is poor," but the transcripts show different problems: some calls lack a closing boundary, others have right syntax and wrong quantity. One vague goal cannot tell you what data to collect.

### Tool syntax, tool selection, and arguments

A **fine-tuning goal** is a behavior change an evaluation can detect. Syntax needs correctly serialized demonstrations. Selection needs situations where competing tools, or no tool, are distinguishable. Arguments need values tied to the request and observations, not copied constants.

@fig finetune_goal_map | Illustrative stockroom failures paired with the demonstrations that target them. Each pairing is a hypothesis to test on held-out tasks, not a guaranteed fix.

### Multi-step behavior and response format

**Multi-step behavior** uses a result to choose the next action. **Response format** governs how the final answer presents the outcome. Our successful trace teaches a read, a conditional action, and a report; training only the reservation JSON never shows how to react to insufficient stock.

In the fixture, the read shows 12, the request is 3, and 9 remain. A request for 13 should teach a refusal or a server-reported failure, since `13 > 12`, and a request for an explanation should teach an answer with no stock query.

Validate each target separately. If format validity rises while argument accuracy falls, a format-heavy set may have taught the template at the cost of value generalization. Fine-tuning reinforces biases in demonstrations as efficiently as the behavior you wanted.

:::note Post-training scope
Post-training also includes preference optimization and reinforcement learning. This chapter's teaching path uses supervised traces with LoRA, and success there says nothing about an untested objective.
:::

## 26. Base vs instruction-tuned models

A raw completion model treats a user question as part of a document and continues it. An instruction-tuned checkpoint is more likely to answer as an assistant, which matters when the training set is small.

### Pretraining and instruction tuning

**Pretraining** learns broad statistical structure from large collections of text. **Instruction tuning** then teaches the model to answer requests in a conversational format. A **base model** in the architecture sense is the raw pretrained checkpoint; in LoRA deployment, *base* can mean any frozen checkpoint under the adapter.

### Chat behavior and further specialization

**Chat behavior** comes from learned demonstrations and the checkpoint's chat template. Further specialization can teach a tool protocol or response style while keeping language ability. Record the exact checkpoint, tokenizer, template, and weights, because matching shapes do not mean matching behavior.

Finch-24's 40,509,952 parameters set memory and adapter arithmetic, not instruction-following skill. The stockroom trajectories here are target demonstrations, not output from a trained Finch agent. In a real project, start from a checkpoint suited to the task and measure its baseline first.

The original Llama 3 8B base and instruction-tuned checkpoints share the dimensions used in our counts but differ in weights and behavior. An adapter trained on one is not equivalent on the other just because the tensors fit.

@fig checkpoint_specialization | Illustrative weight grids keep a fixed architecture across training stages while contents change. Shades are schematic, not real checkpoint values or scores.

:::warn Watch out
Do not call an instruction checkpoint "raw pretraining" in a before-and-after report; it may already have had substantial post-training. Name the exact checkpoint, then describe only the specialization your experiment added.
:::

:::interview Interview lens
**"When would you fine-tune instead of adding examples to the prompt?"** First I would measure the failure under a correct prompt and runtime. Fine-tuning fits a stable, repeated behavior with checked demonstrations and a held-out evaluation. It can cut repeated context and improve protocol consistency, but it creates an artifact to maintain and regression-test. A changing tool catalog still belongs in the input.
:::

:::key In one breath
Prompting changes the sequence the model sees; fine-tuning changes its parameters. Pick an observable target, such as syntax, selection, arguments, continuation, or final format, before collecting examples. Know whether you start from a raw or instruction-tuned checkpoint, and name it. Parameter counts explain cost, not skill.
:::

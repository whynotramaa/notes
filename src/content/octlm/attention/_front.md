<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Every chatbot you have used, every code assistant, every model that writes a poem on request, does exactly one thing over and over: it looks at a stretch of text and guesses what comes next. This chapter takes apart the machine that makes that guess, one piece at a time, until nothing about it is mysterious.</p>

We start with the raw characters you type and end with a list of probabilities over every token the model knows, and then we look at how the whole thing learns. Nothing is skipped. If a step involves a table of numbers, we draw the table and say what each row means. If a step involves a formula, we work through it with real numbers before we trust it. You do not need a computer science or maths background. Every term is explained the first time it appears, in plain words, and the explanation always comes before the symbol.

The chapter has thirteen parts, in the order the data actually travels through the model. Each part opens with a small map of the whole model with the piece we are about to study lit up in orange, so you always know where you are standing. Inside each part, the text does the explaining and the drawings do the remembering. Read the paragraph first, then look at the figure and check that you could have drawn it yourself. If you could not, read the paragraph again. That loop is the whole study method.

You will meet five kinds of boxes. **Picture this** boxes carry an analogy from everyday life, for readers who do not live inside linear algebra. **Note** boxes hold side details that are true and useful but would break the flow. **Watch out** boxes flag the mistakes people actually make, in code and in interviews. **Interview lens** boxes phrase a question exactly the way an interviewer would and then answer it the way a strong candidate would, out loud. Every part ends with a dark **In one breath** box that squeezes the whole part into a few sentences you can review the night before an interview.

At the back there is an interview question bank, a set of graded exercises and worked solutions. Do the exercises with a pencil. The goal of this chapter is concrete: you can stand at a whiteboard, draw a decoder block from memory, label every arrow with the shape of the data flowing along it, and explain to someone from another department why each piece is there and what would break without it.

</section>

<section class="front">

<div class="part-kicker">The running example</div>

# Meet Finch-19

Abstract shapes like `T × d_model` are easy to nod along to and hard to remember. So we carry one concrete model through the whole chapter and compute everything for it. **Finch-19** is a small language model built the way GPT-2 was built in 2019: learned position vectors, LayerNorm before each sub-layer, a GELU MLP four times wider than the model, biases on every layer, and full multi-head attention. It is shrunk down until every number fits on a page. Day 2 rebuilds it with the 2024 recipe as Finch-24, so you can watch every number change.

| Setting | Symbol | Finch-19 | What it controls |
|---|---|---|---|
| Vocabulary size | `V` | 32,000 | How many distinct tokens the model knows |
| Model width | `d_model` | 512 | How many numbers describe each token |
| Layers | `N` | 8 | How many decoder blocks are stacked |
| Attention heads | `H` | 8 | How many separate attention patterns per layer |
| Head size | `d_head` | 64 | 512 / 8, the width of one head |
| MLP hidden size | `d_ff` | 2,048 | 4 × 512, the width inside each MLP |
| Context length | `T_max` | 1,024 | The most tokens it can read at once |
| Positions | | learned table | 1,024 rows of 512 numbers, added at the bottom |
| Normalization | | LayerNorm, pre-norm | Keeps numbers at a steady size |
| Output head | | tied to embeddings | Reuses the input table to score the vocabulary |
| Total parameters | | 42,128,384 | Every learned number, counted in Part XII |

We also follow one sentence the whole way: *The cat sat because it was tired*. It is short enough to draw and it hides one real puzzle. What does *it* refer to? You know at once that it is the cat. The model has to work that out from nothing but numbers, and attention is how it does. Finch-19's tokenizer cuts the sentence into seven tokens. The ids belong to Finch's own vocabulary, so they will not match GPT-2's, but they stay fixed for the whole chapter.

| Position | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Token | `The` | `␠cat` | `␠sat` | `␠because` | `␠it` | `␠was` | `␠tired` |
| Id | 791 | 8415 | 7731 | 1606 | 433 | 574 | 19781 |

The little `␠` symbol stands for a space. Most tokenizers glue the space to the front of the next word, and Part I shows why. When a later section says "for Finch-19 this is...", the number was computed, not guessed. By the end of Part XII you will have counted every one of its 42,128,384 parameters by hand.

</section>

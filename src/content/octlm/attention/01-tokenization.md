@part I | Tokens: Turning Text into Numbers | A language model can only do arithmetic, so the first job is to turn your sentence into a short list of whole numbers. How we cut text into pieces decides how long every input is, how big the model's first table must be, and which strange bugs show up later. We will build byte-level BPE, the tokenizer behind GPT-2, GPT-4 and Llama 3, from the bytes your computer already stores, through learning merges by hand, to the trade-offs of vocabulary size. | where:1

## 1. The One Job a Language Model Has

Think about the keyboard on your phone. You type "see you" and it offers three suggestions above the keys: *tomorrow*, *soon*, *there*. That little strip is a language model. It has read a lot of text, it has a sense of which words tend to follow "see you", and it shows you its best guesses. A model like GPT or Llama is the same idea pushed to an absurd scale. It has read a large share of the public internet, it looks at far more than the last two words, and instead of three suggestions it produces a probability for every single piece of text it knows. But the job is identical: given what came before, how likely is each possible next piece?

That is worth saying slowly, because everything in this chapter serves that one sentence. A language model does not "understand the question" and then "write an answer" as two separate steps. It predicts the next piece of text. Then it predicts the one after that. Answering questions, writing code and holding a conversation all fall out of doing that one thing extremely well.

### A probability for every possible next piece

When Finch-19 reads "I'll have a cup of", it does not output one word. It outputs a list of 32,000 numbers, one for every token in its vocabulary, and each number is a probability: how likely that token is to come next. The numbers are all between 0 and 1 and they add up to exactly 1, like slices of a pie. A well-trained model puts a big slice on *tea*, a smaller one on *coffee*, a sliver on *water* and almost nothing on *rocks*.

@fig next_token_dist | One prediction. After the prompt, the model hands back a probability for every token it knows. Most of the 32,000 bars are tiny; a handful carry nearly all the weight. (Values are illustrative.)

The word for one of these pieces is **token**. A token is usually a whole common word like *tea*, a chunk of a rarer word like *happi*, or a single punctuation mark. The full list of tokens a model knows is its **vocabulary**, and its size is written $V$. For Finch-19, $V = 32{,}000$.

In probability notation, the model computes $P(\text{tea} \mid \text{I'll have a cup of})$. The bar $\mid$ is read "given". This is a **conditional probability**: the chance of *tea* in the specific situation where *I'll have a cup of* came right before it. Change the condition and the answer changes. After "The ship ran aground on the", *tea* becomes very unlikely and *rocks* becomes likely. Everything the model knows about language lives in how those probabilities shift as the text before them changes.

### Writing one token at a time

When a model writes a reply, it uses those probabilities as a recipe. It reads the text so far, produces the 32,000 probabilities, picks one token (usually one of the likely ones), glues it onto the end of the text, and runs again on the longer text. The word for "a model that feeds its own previous outputs back in as new inputs" is **autoregressive**.

@fig lm_loop | Autoregressive generation. The same model with the same weights runs once per new token. Each output is appended to the input before the next step, which is why chat answers appear one piece at a time.

Two consequences are worth noticing early. First, writing is inherently sequential. You cannot produce token 50 before token 49 exists, because token 49 is part of the input for token 50. Second, the model keeps no hidden plan of what it is going to say. Its only state is the text so far. (Part XI shows how we save some intermediate work to avoid redoing it, but that is a speed trick, not a memory of intentions.)

All of this assumes the model can read text in the first place. It cannot. A neural network is a long chain of multiplications and additions, and you cannot multiply the letter *t*. So before anything clever happens, text has to become numbers. The tool that does this is called a **tokenizer**: it chops text into tokens and gives each token a whole-number id. The rest of this part builds one.

:::interview Interview lens
**"What does a language model actually output?"** A probability distribution over its whole vocabulary for the next token, conditioned on all the tokens before it. Generation is just repeated sampling from that distribution, appending each sampled token to the input. Everything else, chat, code, reasoning, is built on top of that one next-token prediction.
:::

## 2. Text Is Already Numbers

Here is the good news: your computer already stores every character as numbers. When you save the word *café* in a file, the disk holds a short list of numbers between 0 and 255, one per **byte**. A byte is the computer's basic unit of storage, eight on/off switches, which gives exactly 256 possible values. The rule that says which bytes stand for which character is called **UTF-8**, and almost all text on the web uses it.

UTF-8 is clever about size. Plain English letters, digits and common punctuation take one byte each: *n* is the number 110, written in hexadecimal (base 16, using the digits 0 to 9 and A to F) as `6E`. Accented Latin letters like *ï* and *é* take two bytes. Most Chinese, Japanese and Hindi characters take three. Emoji take four. So "characters" and "bytes" are not the same thing, and the gap matters.

@fig utf8_bytes | UTF-8. Each character sits above the bytes that store it. Plain letters are one byte; accented letters take two; the emoji takes four. Twelve characters become seventeen bytes.

Count it out for *naïve café 🙂*. It has twelve characters. Nine of them are plain one-byte characters (*n, a, v, e, c, a, f* and the two spaces), which is 9 bytes. The two accented letters take two bytes each, which is 4 more. The emoji takes 4. That gives 9 + 4 + 4 = 17 bytes for 12 characters. Doing that count by hand once is the fastest way to stop confusing characters with bytes.

So we never have to invent a way to turn text into numbers. UTF-8 already did it. The only question left is how to *group* those bytes into useful pieces.

:::note Why not just use Unicode code points?
Every character also has a single official number in Unicode (*é* is code point 233). Using those directly would mean a vocabulary of about 150,000 symbols, most of them rare, and the list keeps growing as Unicode adds characters. Bytes are a fixed alphabet of exactly 256 values that can spell anything, which is why modern tokenizers start from bytes.
:::

## 3. What Should One Token Be?

Suppose we have to pick one rule for cutting text into tokens. Take the word *unhappiness* and try four candidates. The choice looks like a technical detail, but it decides how long every input is and how large the model's first table must be, so it is worth getting right.

**Whole words** are the obvious first idea. *unhappiness* becomes one token, which is wonderfully short. The trouble is the vocabulary. You need one entry for every word that has ever existed, in every language, every spelling mistake, every product name. Any word you did not include becomes a special "unknown" token, written `[UNK]`, and the model loses all information about it. A name it has never seen, a new slang word, a typo: all of them collapse into the same meaningless token.

**Characters** fix the unknown-word problem for English, but the vocabulary is still about 150,000 Unicode characters, and sequences get long: *unhappiness* is eleven tokens. Long sequences are expensive, as Part X will show in detail, because attention compares every token with every other token.

**Raw bytes** go all the way down. The vocabulary is exactly 256, nothing can ever be unknown, and any text in any language can be spelled. But sequences get even longer, and an emoji costs four tokens.

**Byte pair encoding**, or **BPE**, takes the middle road. It starts from the 256 bytes, so nothing is ever unknown, and then adds common chunks on top: *un*, *happi*, *ness*, *the*, *ing*, and tens of thousands more. Common words become one token, rare words become a few familiar pieces, and anything truly strange falls back to bytes.

@fig token_cuts | Four answers to "what is a token?". Words are short but fail on new words; characters and bytes never fail but make long sequences; BPE is short for common text and never unknown.

| Scheme | Vocabulary size | *unhappiness* | Unknown words? | Sequence length |
|---|---|---|---|---|
| Words | hundreds of thousands, open-ended | 1 token | yes, `[UNK]` | shortest |
| Characters | about 150,000 | 11 tokens | rarely | long |
| Bytes | 256 | 11 tokens | never | longest for non-English |
| Byte-level BPE | 256 + merges (32k to 256k) | about 3 tokens | never | short |

Byte pair encoding started life in 1994, when Philip Gage published it as a simple data compression algorithm. In 2016 Rico Sennrich and colleagues adapted it for machine translation, applying it to characters. GPT-2 in 2019 made the change that stuck: run BPE on raw UTF-8 bytes instead of characters. That version, **byte-level BPE**, is what GPT-2, GPT-3, GPT-4, Llama 3 and most current models use, and it is what Finch-19 uses.

## 4. Drawing Walls Before Merging

Before BPE starts gluing bytes together, the tokenizer first splits the text into rough chunks: words, numbers, punctuation and whitespace. This step is called **pre-tokenization**. Think of it as drawing walls through the text. Later, merges are only allowed inside a wall, never across one.

Why bother? Without walls, BPE would happily learn tokens like *dog.* with the full stop stuck on, or *of the* glued across a space, because those byte sequences are common. Then *dog.*, *dog,* and *dog!* would be three unrelated tokens, and the model would have to learn three times over that they all mean dog. Walls keep tokens sensible.

GPT-2's walls come from a single pattern (a regular expression, a little rule written in a text-matching language). In plain words it says: a chunk is an optional space followed by a run of letters, or an optional space followed by a run of digits, or an optional space followed by a run of punctuation, or a run of whitespace, or one of the English contractions *'s*, *'t*, *'re*, *'ve*, *'m*, *'ll*, *'d*.

@fig pretok_chunks | Pre-tokenization. The sentence is split into ten chunks before any merging happens. Notice that the space travels with the word after it, so "␠cats" with its space is one chunk.

Look closely at where the spaces go. The space before *pay* is glued to the front of *pay*, giving *␠pay*. This convention has a large effect later: *the* at the start of a sentence and *␠the* in the middle of one end up as two different tokens with two different ids. Notice also that *1,250* became three chunks, *␠1*, *,* and *250*, because digits and punctuation sit in different walls.

:::warn Watch out
Because the space belongs to the following word, a trailing space at the end of a prompt changes what the model sees. "The capital of France is" and "The capital of France is␠" end in different tokens, and the second one leaves the model in an odd position: the next token would normally *start* with a space, but the space has already been used. Never strip or add whitespace around prompts casually.
:::

Llama 3 and GPT-4 use slightly different patterns. One notable change: they split numbers into chunks of at most three digits, so *1234567* becomes *123*, *456*, *7* rather than whatever the merges happened to learn. We return to why in Section 8.

## 5. Learning the Merges, by Hand

BPE stands for byte pair encoding, and the training procedure is simple enough to do with a pencil. Start with every chunk spelled out as bytes. Count every pair of neighbouring tokens across the whole training text. Find the most frequent pair. Glue it into one new token, give it the next free id, and record the rule. Repeat until you have as many tokens as you want. The ordered list of rules is the tokenizer.

Let us do it on a toy corpus. After pre-tokenization, imagine our training text contains four distinct words: *banana* three times, *bandana* twice, *band* twice and *bad* once. That is eight words and 43 bytes, so before any merging the corpus is 43 tokens long. The 256 possible bytes already have ids 0 to 255, so the first merge we learn will get id 256.

### Step 0: count the pairs

Count every adjacent pair, and weight each count by how many times its word appears. *banana* is spelled *b a n a n a*, which contains the pair *a n* twice; it appears three times, so it contributes 6 to the count of *a + n*. *bandana* contains *a n* twice and appears twice, contributing 4. *band* contains it once and appears twice, contributing 2. So *a + n* appears 12 times. The runners-up are *b + a* and *n + a* with 8 each, then *n + d* with 4.

@fig bpe_counts | The first counting pass. Each word is spelled out in single bytes with its frequency on the left; the bars count every adjacent pair across the corpus. The pair a + n wins with 12.

So the first rule is *a + n → an*, with id 256. Replace every *a n* in the corpus with the single token *an*. *banana* becomes *b an an a*, and the corpus shrinks from 43 tokens to 31.

### Keep going

Now count again, on the new spellings. The winner is *b + an* with 7 (three from *banana*, two from *bandana*, two from *band*), so *ban* becomes token 257 and the corpus shrinks to 24. Then *an + a* with 5 makes *ana*, id 258, down to 19. Then *ban + d* with 4 makes *band*, id 259, down to 15. Then *ban + ana* with 3 makes *banana*, id 260, down to 12. Then *band + ana* with 2 makes *bandana*, id 261, down to 10.

@fig bpe_steps | The six merges, in the order they were learned. Each row shows the rule, how often the winning pair appeared, the corpus after applying it, and the total token count. Highlighted chips are the newly created token.

At that point the only pairs left, *b + a* and *a + d* inside *bad*, appear once each, and we stop because a merge that appears once compresses nothing. The corpus went from 43 tokens to 10, which means each token now covers 4.3 bytes on average. Real tokenizers do exactly this on gigabytes of text and stop after a fixed number of merges rather than waiting to run out: GPT-2 learned 50,000 merges, giving a vocabulary of 50,257 (256 bytes, 50,000 merges and one special end-of-text token). Finch-19 learns 31,740 merges and reserves 4 special tokens, so $V = 256 + 31{,}740 + 4 = 32{,}000$.

Two details matter in real code. First, ties happen. In step 0, *b + a* and *n + a* both had 8. If your code picks between equal counts randomly, two training runs on the same data give two different tokenizers. The fix is to break ties with a fixed rule, such as comparing the byte values. Second, the merge list is *ordered*. The order is part of the tokenizer, as the next section shows.

:::story Picture this
Imagine a court stenographer inventing shorthand on the job. At first every letter is written out. After a week they notice "th" comes up constantly and invent a squiggle for it. The next week "the" (squiggle plus *e*) is so common it gets its own squiggle. Months later, whole common words have single strokes, rare words are written as a few familiar strokes, and a truly foreign name is still spelled letter by letter. The notebook of squiggles, in the order they were invented, is the tokenizer.
:::

## 6. Encoding New Text

Training produced an ordered list of merges. To tokenize new text, called **encoding**, we pre-tokenize it into chunks, spell each chunk as bytes, and then replay the merges *in the order they were learned*, applying each one everywhere it matches. When we reach the end of the list, the tokens left over are the answer, and their ids are what the model receives.

Try the word *bandanas*, which never appeared in training. It starts as eight bytes. Merge 256 (*a + n*) fires twice, giving *b an d an a s*. Merge 257 (*b + an*) gives *ban d an a s*. Merge 258 (*an + a*) gives *ban d ana s*. Merge 259 (*ban + d*) gives *band ana s*. Merge 260 (*ban + ana*) finds nothing, because *ban* has already been absorbed into *band*. Merge 261 (*band + ana*) gives *bandana s*. Two tokens: ids 261 and 115 (115 is the byte for *s*).

@fig bpe_encode | Encoding "bandanas" with the six learned merges. Each row applies one more rule. Merge 260 finds no match because "ban" was already absorbed into "band". The final encoding is two tokens.

Notice what happened. A word the tokenizer had never seen came out as a familiar token plus one byte. That is the whole promise of byte-level BPE: common things are cheap, new things are a few familiar pieces, and nothing is ever unknown.

The order matters because merges compete for the same bytes. If you applied *ban + d* before *b + an*, there would be no *ban* token yet and the rule would never fire, giving a different, longer encoding. This is why the tokenizer file stores merges as an ordered list, and why "the same vocabulary with merges in a different order" is a different tokenizer. **Decoding**, turning ids back into text, is simpler: look up the bytes for each id, join them, and interpret the result as UTF-8.

:::warn Watch out
The model and the tokenizer are a matched pair. A model trained with one tokenizer receives garbage if you feed it ids from another, even if both have 32,000 tokens, because id 8415 means *␠cat* in one and something unrelated in the other. When you download a model, you download its tokenizer with it.
:::

## 7. How Big Should the Vocabulary Be?

Every merge adds one token to the vocabulary. So how many merges should we learn? There is no free lunch, and the trade-off is easy to state.

A bigger vocabulary means each token covers more text, so the same document becomes fewer tokens. Fewer tokens is good: the model reads faster, more text fits in its context window, and attention, whose cost grows with the square of the sequence length, gets much cheaper. But the curve flattens. Going from 256 to 4,000 tokens helps enormously because it captures every common syllable and short word. Going from 128,000 to 256,000 helps only a little, because the extra tokens are rare words and fragments that seldom appear.

The cost is a bigger table. Part II shows that every token in the vocabulary gets its own row of $d_{\text{model}}$ learned numbers in the model's embedding table. That table has $V \times d_{\text{model}}$ entries, a straight line in $V$. For Finch-19 that is $32{,}000 \times 512 = 16{,}384{,}000$ numbers, about 39% of the whole model. With Llama 3's vocabulary of 128,256 tokens at the same width it would be 65,667,072, more than all of Finch's other weights put together. Rare tokens also get fewer training updates, so their rows are learned poorly.

@fig vocab_tradeoff | The vocabulary trade-off. Left: the average text covered by one token rises with vocabulary size and flattens (illustrative shape). Right: the embedding table grows in a straight line, exactly V × 512 for Finch-19.

In practice, models land between 32,000 and about 256,000. Llama 2 and Mistral 7B use 32,000. GPT-2 used 50,257. Llama 3 moved to 128,256 and Meta reported that the new tokenizer needs up to 15% fewer tokens for the same text than Llama 2's. Larger, multilingual models tend toward larger vocabularies, because the embedding table is a smaller fraction of a big model and because more merges let more languages get efficient tokens. A common rule of thumb for English with these tokenizers is about four characters per token.

### Comparing models with different tokenizers

The vocabulary choice causes one more subtle problem: it makes models hard to compare. The usual score for a language model is its average **loss** per token, a measure of surprise we define properly in Part XIII. For now, think of it as "how badly the model was surprised by the real next token, on average", measured in units called nats. Lower is better. People often report **perplexity** instead, which is $e$ raised to the loss: roughly, how many tokens the model was torn between at each step.

Here is the snag. Loss and perplexity are measured *per token*. If model B uses a smaller vocabulary, its tokens are shorter, each prediction is easier, and its per-token score looks better even if it understands text worse. The fair fix is to measure surprise per byte of original text, which is the same for everyone. That is **bits per byte**:

$$\text{bits per byte} = \frac{\text{loss per token (nats)}}{\ln 2 \times \text{bytes per token}}$$

Read it out loud: take the surprise per token, convert nats to bits by dividing by $\ln 2 \approx 0.693$, then spread it across the bytes that token covered. Now try it. Model A has loss 3.0 nats per token and covers 4.0 bytes per token. Its perplexity is $e^{3.0} = 20.1$ and its bits per byte is $3.0 / 0.693 / 4.0 = 1.082$. Model B has loss 2.6 nats per token but only 3.0 bytes per token. Its perplexity is $e^{2.6} = 13.5$, which looks much better, but its bits per byte is $2.6 / 0.693 / 3.0 = 1.250$, which is worse.

@fig bpb_compare | Perplexity and bits per byte disagree. Model B wins per token because its tokens are shorter, but model A spends fewer bits on each byte of real text, so A is the better model.

:::interview Interview lens
**"Two models report perplexity 13.5 and 20.1. Which is better?"** You cannot tell unless they share a tokenizer. Perplexity is per token, and a model with shorter tokens faces easier predictions. Convert to bits per byte by dividing the loss in nats by $\ln 2$ and by the average bytes per token; that measures surprise per unit of actual text and is comparable across tokenizers.
:::

## 8. Where Tokenizers Bite

Tokenizers are full of small surprises that bite people in real projects. None of them is deep, but each one has cost someone days of debugging, and interviewers like them because they reveal whether you have shipped anything.

@fig token_edges | Eight common tokenizer surprises. The highlighted one, the leading space, causes more prompt bugs than all the others together.

**Emoji and other multi-byte characters can split across tokens.** 🙂 is four bytes, and the merges might cut it as two tokens of two bytes each. When a model streams its answer token by token, the screen shows broken replacement symbols (�) until the second half arrives. The fix is to buffer bytes until they form complete UTF-8 characters before displaying them.

**" the" and "the" are different tokens.** Section 4 showed why: the space travels with the following word. A stray space at the end of a prompt can change what the model does next.

**Numbers split unevenly.** With plain BPE, *1234567* might become *123*, *45*, *67*, chunks that do not line up with thousands, hundreds and units. That makes arithmetic harder to learn, because the same digit position lands in different places of different tokens. This is why Llama 3 and GPT-4 split digits into groups of at most three, and some models split every digit separately.

**Some languages cost more.** Merges are learned from the tokenizer's training text. If that text is mostly English, English words become single tokens while Hindi or Thai stay split into many small byte-level pieces. The same sentence then costs several times more tokens, which means more money per request and less room in the context window. The fix is to train the tokenizer on a balanced multilingual corpus.

**Case changes everything.** *Hello*, *hello* and *HELLO* usually get completely different ids. To the tokenizer they are unrelated; the model has to learn from examples that they mean the same thing. This is not a bug to fix, just something to know.

**Special tokens are not text.** Markers like `<|endoftext|>` tell the model where a document ends. They must be single reserved ids, added outside the merge process. If a user types that literal string into a chat, it should be encoded as ordinary text (thirteen bytes' worth of tokens), never as the real marker, or users could forge document boundaries.

**Some tokens are under-trained.** A token can be common in the tokenizer's training data but almost absent from the model's training data. The famous example is *␠SolidGoldMagikarp*, a Reddit username that became a single GPT-2 token. Researchers found in 2023 that models produced bizarre output when asked to repeat it, because its embedding row had barely been trained. The fix is to train the tokenizer on data that looks like the model's.

:::interview Interview lens
**"Why do LLMs struggle to count the letters in 'strawberry'?"** Because they never see letters. The word arrives as one or two tokens, each a single id with a learned vector, and nothing in the input spells out the individual characters. The model has to have memorized the spelling of each token from training text, which it does imperfectly. It is a tokenization effect, not a reasoning failure.
:::

:::key In one breath
A language model predicts a probability for every token in its vocabulary given the tokens before it, and writes by appending one sampled token at a time. Text reaches it through a tokenizer: UTF-8 turns characters into bytes, pre-tokenization splits the bytes into walled chunks (the space joins the following word), and byte-level BPE replays an ordered list of learned merges to glue frequent byte pairs into tokens. Bigger vocabularies give shorter sequences but a bigger embedding table, $V \times d_{\text{model}}$ (16.4M numbers for Finch-19). Compare models with different tokenizers using bits per byte, $\text{loss} / (\ln 2 \times \text{bytes per token})$, never raw perplexity.
:::

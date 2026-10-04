<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">A request needs a stable meaning before it needs another service. We will turn Heron's user actions into bounded reads and recoverable commands, then decide which state must share a commit boundary and which work can move asynchronously.</p>

Read the small topic, work through its state trace, and then check the diagram. The paragraphs are short so each step stays visible, but a complete topic needs several steps. The page examples deliberately insert a new record between requests; the write examples deliberately lose a reply after commit. Those are the histories an ordinary happy-path endpoint sketch misses.

The orange map follows resources, query bounds, versioned writes, trust, service boundaries, distributed workflows, and the assembled contract. Analogy boxes help build intuition, notes qualify a useful variant, warnings name a real mistake, and interview boxes model an answer. Each part closes with In one breath; the back page gives questions, graded exercises, and worked answers.

All rates, durations, sizes, identifiers, and policies in the running system are illustrative. Arithmetic is reproduced in `scripts/system-design/numbers.py`, `api-numbers.py`, and `resumption-numbers.py` and `scripts/system-design/api-numbers.py`. Product and protocol behavior is linked to primary documentation. The goal is to defend a contract and its recovery rules, not memorize endpoint names.

</section>

<section class="front">

<div class="part-kicker">The running contract</div>

# Meet Heron's callers

**Heron** is our illustrative live-score and media service. Viewers read scores and clips; assigned scorers issue corrections; background workers create encodings and derived views. One client can retry after disconnection, and another can change the state between a read and its next command.

| Assumed setting | Value | Contract to explain |
|---|---|---|
| Average API rate | 100 requests/s | Calculated from 8,640,000 daily requests |
| Peak API rate | 1,000 requests/s | Average times an assumed multiplier of 10 |
| Mean API duration | 0.2 s | Gives 200 mean in-flight requests at peak |
| Rate policy | 100 requests/user/minute | Admission per authenticated principal |
| Small page example | 3 records | Reveals offset movement between reads |
| Tie-breaking example | 2 records/page | Uses ordered time and unique ID together |
| Larger paging example | 1,000 records, 20/page | Gives 50 nominal pages |
| Starting score version | 7 | Two writers both observed this version |
| First accepted correction | Version 8 | Later writes must satisfy their precondition |
| Clip workflow | Metadata, bytes, encodings | Different acceptance and completion boundaries |

The small examples isolate correctness. The larger rates expose capacity. Do not infer that a page limit bounds database work, or that a successful HTTP response makes remote provider effects atomic. By the final part, every public response will name what happened and how the client recovers if it did not receive that response.

</section>

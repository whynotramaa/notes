# Handoff brief: finish and polish the notes site

Paste everything below this line into a fresh session (Claude Code or a person). It is self-contained.

---

You are finishing a static Astro site of long-form, hand-drawn technical field guides at `/home/banana/Projects/notes` (deployed to notes.ramaa.tech). Three series exist: `octlm` (language models, finished and clean), `system-design` (22 units, mostly finished), and `fundamentals` (DBMS partly written, Computer Networks and Operating Systems not started). Your job is to finish what is missing, repair the weak units, and leave every guide at the same depth and style.

Read these before you write anything:

1. `AGENTS.md` at the repo root. It is the house style and the structure contract.
2. `~/.claude/CLAUDE.md`, the owner's global rules, and `~/.claude/skills/unslop/SKILL.md`, the writing rules.
3. The explainer skill (`anthropic-skills:explainer-design`). It defines the explanation ladder, callout boxes, back matter and figure catalog.
4. One finished part as a calibration sample: `src/content/fundamentals/dbms/09-recovery-engines.md` (fundamentals register) and `src/content/system-design/reliability/03-graceful-degradation-and-fault-tolerance.md` (system-design register). Match their density and tone.
5. The syllabi, which are the contract for coverage and order: `sysdzn.md` (system design), `dbms.md`, `cn.md`, `os.md` at the repo root. Every item in a syllabus becomes a section or a named `###` subsection, in syllabus order.

## Current state (as of 2026-10-04)

Done and verified by the content checker:

- `octlm`: 6 guides, no structural problems. Do not touch.
- `system-design`: 20 of 22 units pass every check (parts, sections, figures, 40+ questions, 25+ exercises, no banned words). Unit and part titles were just renamed to standard system-design topic names, such as "Caching", "Apache Kafka", "Sharding and consistent hashing" and "Token bucket". The `where_sd_*` maps and `cover_sd_*` covers were updated to match. The rename script is `/tmp/claude-1000/-home-banana-Projects-notes/3310a5ed-a609-4e1a-9e6f-b80e52d050ca/scratchpad/retitle.py` if it still exists; otherwise read the titles from the `@part` lines.
- `fundamentals/dbms`: Parts I to IX (sections 1 to 48) are written and clean.
- Small fixes applied: the banned word in `data-pipelines/07`, and a new subsection in `cdn/07` (section 28) on static assets, Instagram-style photos, Netflix Open Connect and YouTube/Google Global Cache.

Pending, in priority order:

### 1. Queues unit (`src/content/system-design/queues/`), about 70% done

- Seven parts, sections 1 to 33, about 12,600 words, are rewritten at full depth. `_front.md` and `_note.js` (title "Message queues and async processing") are updated.
- Numbers live in `scripts/system-design/queues-numbers.py`, which writes `src/data/system-design/queues-numbers.json`. Run it with `python3 scripts/system-design/queues-numbers.py`.
- **Still to do:**
  - Rewrite `src/figs/p67.js` completely. It still has the old 7 stub figures and old map and cover labels. It must export `where_sd_queues` and `cover_sd_queues` with the new part titles: "Why message queues", "Queues, pub/sub and event streams", "Consumer groups, partitions and offsets", "Acknowledgements and delivery semantics", "Retries, poison messages and dead-letter queues", "Exactly-once and backpressure", "Transactional outbox and the complete flow". Cover lines are `["Message", "queues"]`.
  - It must also export these 33 figures, which the text already references: `sd_q_sync_wait sd_q_shape sd_q_kinds sd_q_status sd_q_competing sd_q_fanout sd_q_log sd_q_choose sd_q_prefetch sd_q_groups sd_q_rebalance sd_q_partition_key sd_q_hot_key sd_q_offsets sd_q_gap sd_q_visibility sd_q_at_most_once sd_q_at_least_once sd_q_idempotent sd_q_classify sd_q_retry_topics sd_q_poison sd_q_dlq sd_q_eos_boundary sd_q_backlog sd_q_lag_time sd_q_backpressure sd_q_autoscale sd_q_dual_write sd_q_outbox sd_q_full_trace sd_q_components sd_q_interview`. Read each figure's caption and paragraph and draw exactly that. Pull numbers from `queues-numbers.json`.
  - The checker needs at least 35 unique body figures, so add at least 2 more where a section has none and a picture would teach something. Sections 4, 11 and 24 are good candidates.
  - Rewrite `queues/99-interview.md`, which is still the old 7-question stub. It needs 40+ questions, 25+ exercises and a worked solution for each exercise. A planned exercise list with answers is below.
  - Add every exercise answer to `queues-numbers.py` with `assert` lines, then rerun it.

Planned exercises (all values below come from the script's inputs; recompute in the script before publishing):

| # | Dots | Task | Answer |
|---|---|---|---|
| E1 | ● | In-flight requests if transcoding stays in the request (6/s, 30 s) | 180 |
| E2 | ● | In-flight after answering at upload commit (0.15 s) | 0.9 |
| E3 | ● | Worker service rate and utilization (200 workers) | 6.67/s, 90% |
| E4 | ● | Pub/sub deliveries with a 4th subscription | 80/s |
| E5 | ● | 14-day score retention bytes | 4,838,400,000 |
| E6 | ● | 12 partitions over 8 consumers | 2,2,2,2,1,1,1,1 |
| E7 | ● | Hot key at 40%, consumer limit 5/s, lag per hour | 8/s, 10,800 |
| E8 | ●● | Safe commit with done {20,21,23,24} from 20, and the replay | commit 22, replay 23 and 24 |
| E9 | ● | Backoff base 0.5 s, factor 3, 4 attempts | 0.5, 1.5, 4.5, 13.5, total 20 s |
| E10 | ●● | Burst 30/s for 300 s, backlog and drain time | 7,000 jobs, 10,500 s (175 min) |
| E11 | ●● | Workers to drain 4,000 jobs in 10 min at 6/s arrivals | 380 |
| E12 | ● | Wait for a new job behind 7,000 | 1,050 s |
| E13 | ● | 30-day dedupe table bytes (64-byte ids) | 995,328,000 |
| E14 | ● | Duplicates per day at 1-in-1,000 ack loss | 518.4 |
| E15 | ●● | Poison block, 3 attempts and 1+2+4 s backoff, backlog | 97 s, about 161.7 events |
| E16 | ● | Outbox relay, 250 ms poll and batch 50 | 200/s, up to 0.25 s added |
| E17 | ●● | Explain why a 60 s visibility timeout fails a 75 s p99 job, and the heartbeat fix | prose |
| E18 | ●● | Explain at-least-once plus idempotent consumer without equations | prose |
| E19 | ●● | Explain why adding partitions breaks per-key order | prose |
| E20 | ●● | Explain the exactly-once boundary for a welcome email | prose |
| E21 | ●●● | Prove committing the lowest unfinished offset never skips a message | proof |
| E22 | ●●● | Derive drain time $T=B/(c/S-\lambda)$ and evaluate at 95% utilization | 12,000 s |
| E23 | ●●● | Write an idempotent consumer (Python plus SQL unique insert) | code |
| E24 | ●●● | Design order-preserving retry for a ledger key (park the key) | design |
| E25 | ●●● | Full sizing: 12 uploads/s, 20 s transcode, 80% target, 60/s burst for 60 s, 7-day dedupe | 300 workers, 2,700 backlog, 900 s drain, 464,486,400 bytes |

### 2. Traffic routing unit (`src/content/system-design/traffic-routing/`), full rewrite

It is a first-draft stub: 14 sections of 90 to 180 words, 14 figures, 8 questions and 6 exercises. `_note.js` is retitled "Load balancing and traffic routing". Rewrite every part file in place. Deleting files is blocked in this environment, so overwrite the existing seven file names. Add `08-...md` if you need an eighth part. The old version is backed up in the scratchpad `old/` folder.

Syllabus items, in order: reverse proxy, API gateway, L4 and L7 load balancers, round robin, weighted routing, least connections, consistent hashing, sticky sessions, health checks, failover, service discovery, then geography (User, DNS, CDN or edge, load balancer, application servers) and what each layer contributes.

Suggested parts (standard names, 7 to 8 parts, 30 to 34 sections):

1. DNS, CDN and the edge
2. Reverse proxies and API gateways
3. L4 vs L7 load balancing
4. Load balancing algorithms (round robin, weighted, least connections, least outstanding requests, power of two choices)
5. Consistent hashing and sticky sessions
6. Health checks and failover
7. Service discovery
8. Case study: one routed request, with a failure budget

Write `scripts/system-design/traffic-routing-numbers.py` (copy the `sys.path.remove` trick from `queues-numbers.py`, because `scripts/system-design/numbers.py` shadows the stdlib module). Rewrite `src/figs/p66.js` with new `where_sd_traffic_routing` and `cover_sd_traffic_routing` (cover lines `["Load", "balancing"]`) plus 35+ figures. Then write the back matter.

### 3. Polish five weaker system-design units

These pass the checker but read as machine-generated:

- **Boilerplate captions.** Every figure in a unit has the same caption in caching (32 of 40), distributed-systems (32 of 40), interview-method, kafka, practice-designs and scaling-patterns (all 36 of 36). Rewrite each caption to say what the figure shows and what to look at in orange. Keep "Illustrative" when the numbers are assumptions. Write the captions from the figure's own kicker text (the `cap` line in its function) plus the paragraph above it.
- **Mislabelled callouts** in kafka, observability, scaling-patterns, interview-method and practice-designs:
  - The `:::story Picture this` boxes contain a summary, not an analogy. Replace each one with a real physical analogy that maps one to one onto the mechanism. The cashier ledger in `reliability/03` is the model.
  - The `:::note The decision boundary` boxes need specific titles that name their content.
  - The `:::interview Explain the mechanism` boxes need the title `Interview lens` and must open with a bold quoted question, `**"..."**`, followed by a 3 to 5 sentence spoken answer.
- **Thin sections.** Kafka, observability, scaling-patterns, interview-method and practice-designs average about 210 to 250 words per section, against 300 to 360 in the best units. Deepen sections that skip the worked example or the failure case. Do not pad.
- Section headings are mostly fine. Change any that read as a slogan rather than a topic ("A box needs a job" becomes "Responsibilities of each component").

### 4. DBMS: Parts X to XII and the interview page (`src/content/fundamentals/dbms/`)

The map `where_fund_dbms` in `src/figs/p80.js` already has 12 stages. Write:

- `10-distributed-databases.md` (`where:10`): replication (leader-follower, synchronous vs asynchronous, lag), partitioning (vertical, horizontal, range, hash, hot shards, resharding), distributed transactions and two-phase commit, and consistency models with quorums ($R+W>N$).
- `11-application-design.md` (`where:11`): SQL vs NoSQL, database design in real applications (the syllabus's booking examples, outbox, connection pools), and practical PostgreSQL (MVCC tuples, VACUUM, EXPLAIN ANALYZE, indexes, pg settings).
- `12-the-complete-query.md` (`where:12`): one seat reservation through every layer, reconciling the storage arithmetic. End with a "what each component contributes" table and a paragraph naming what the chapter did not cover.
- `99-interview.md`: `@chapter faq` with 40 to 60 questions grouped by part, `@chapter exercises` with 25 to 35 graded exercises, and `@chapter solutions` with every number computed.

Sections continue from 49. Five figures are already drawn and unused: `dbms_replicas`, `dbms_shards`, `dbms_two_phase_commit`, `dbms_outbox`, `dbms_quorum`. The needed numbers already exist under `dbms` in `src/data/fundamentals/numbers.json`, including `replica_lag_ms`, `sync_ack_ms`, `async_ack_ms`, `hot_shard_counts`, `partition_counts`, the pool numbers and the R/W/N values. Add anything new to `scripts/fundamentals/numbers.py` and rerun it. Put new figures in a new file such as `src/figs/dbms2.js`, so parallel work does not collide in `p80.js`.

### 5. Computer Networks guide (`src/content/fundamentals/cn/`, empty)

Build a complete chapter from `cn.md` (1,759 lines). Its computed numbers already exist under `cn` in `numbers.json`: delays, bandwidth-delay product, stop-and-wait and windowed throughput, frame sizes, subnet table, the `192.168.10.64/26` example, CRC, TCP sequence numbers, cwnd growth, Shannon and Nyquist, and the DNS TTL.

- Create `_note.js` copying the DBMS shape: `order: 2`, `where: 'where_fund_cn'`, `cover: 'cover_fund_cn'`.
- Write `_front.md` with "How to read this chapter" and a running-example spec table. The running example is a small fixed network: client `192.168.10.70`, gateway `192.168.10.65`, public NAT address `198.51.100.7`, server `203.0.113.20`. Follow one web request through it across the whole chapter.
- Write 10 to 12 parts and 45 to 60 sections, following the syllabus order. The last part follows the packet from browser to server and back through every layer.
- Write the interview page.
- Put figures in `src/figs/cn01.js` and onward. Use `map` and `cover` from `src/lib/fundamentals-figures.js` for the map and cover.

### 6. Operating Systems guide (`src/content/fundamentals/os/`, empty)

Same treatment from `os.md` (2,345 lines), with `order: 3`. Numbers already exist under `os`: address translation for VA 13396 giving PA 37972, TLB effective access time, page table size, copy-on-write, FCFS/SJF/SRTF/RR schedules with timelines, FIFO/LRU/OPT page replacement including Belady's anomaly (9 vs 10 faults), Banker's algorithm safe sequence, the lost-update counter, permissions, cache lines and false sharing, epoll readiness, fd limits, context-switch overhead, and cgroup CPU quota.

The running example is a 2-core machine serving connections, followed from `fork` and `exec` through scheduling, virtual memory, files and `epoll` to containers. Use the syllabus's closing mental model diagram (application, system calls, kernel subsystems, hardware) as the map. Put figures in `src/figs/os01.js` and onward.

## Structure rules (the checker enforces most of these)

- **Parts.** Each part file starts with `@part <ROMAN> | <Title> | <blurb> | where:<N>`.
  - The blurb is exactly three sentences: the job of the part, why it matters or what breaks without it, and the path ("We will ..."). Avoid abbreviations with periods inside the blurb, because the checker counts `. `.
- **Sections.** Headings are `## N. Title`, numbered continuously across the whole guide and never restarting per part.
  - Aim for 30 to 36 sections per system-design unit and 45 to 60 per fundamentals guide.
  - Use 7 to 13 parts per guide.
  - Each section has at least 180 words; aim for 300 to 400.
- **Callouts.** Each part has 4 to 7 callouts. The last thing in the part is exactly one `:::key In one breath` box of 3 to 5 sentences.
  - Use one `:::story Picture this`, one `:::warn Watch out`, one or two `:::interview Interview lens`, and one or two `:::note <specific title>` per part.
- **Bold terms.** Bold a term exactly once in the whole guide, at the moment you define it. Never bold for emphasis.
- **Back matter.** `99-interview.md` uses `@chapter faq | ...`, `@chapter exercises | ...` and `@chapter solutions | ...`.
  - Questions are `**Q1. ...**` followed by a 2 to 4 sentence answer.
  - Exercises are `**E1** ● ...`. Use ● for arithmetic, ●● for multi-step work or explanation, ●●● for derivation, proof, code or a full design. Aim for about 40/40/20 percent.
  - Solutions are `**E1.** ...` with every intermediate value shown.
  - Include at least 8 numeric problems on the running example, 3 explain-without-equations problems, 2 proofs, 1 code problem and 1 full sizing or counting problem.
- **Unit metadata.** Each unit's `_note.js` exports `site` with `order`, `day`, `chapterNumber`, `title`, `description`, `mapIntro`, `where` and `cover`. `src/data/notes.js` discovers folders by glob.

## Titles (the owner's explicit request)

Unit titles, part titles and section headings must use the standard names an engineer searches for: "Message queues", "Consumer groups and rebalancing", "Token bucket", "Two-phase commit", "TCP congestion control", "Page replacement: FIFO, LRU, OPT". Never use literary titles like "Work after the response", "Copies that save work" or "Defending the design". A part title must fit in a map box, so keep it to 40 characters or fewer. Cover title lines must be 22 characters or fewer per line.

## Language and depth

- Write for a smart engineer from another field. Use plain words, prose paragraphs, and one idea per paragraph of 3 to 6 sentences.
- Open every section with something concrete: a failure, a number, or a scene from the running example. Never open with a definition.
- Climb the ladder in each section: hook, problem, intuition, mechanism step by step, worked example with real computed numbers, formula in display math read out loud with every symbol defined, figure, costs and sizes, edge cases and failure modes, history and current practice (named product, version, year), and the interview angle.
- Every number in prose, tables, figures and solutions comes from a numbers script and is asserted there. Never estimate. Label illustrative assumptions as such.
- Claims about real products (versions, defaults, who uses what) must be checked against primary documentation and linked, or phrased with their date.
- Close loops. If Section 4 promises "Part VII covers this", Part VII must deliver it.
- Hard bans:
  - em dashes and en dashes anywhere, including figures (write "32 to 64" for ranges)
  - mid-sentence colons used as connectors
  - bullet walls (at most one short list per section, and only for real sequences; comparisons go in tables)
  - the checker's banned words: delve, tapestry, testament, pivotal, seamless, leverage, robust, realm, landscape, unlock, unleash, embark, crucial, harness (as a metaphor), intricate, furthermore, moreover, additionally, "it is worth noting", "dive into", "in conclusion", "overall,"
  - chatbot filler, stacked hedges, passive voice without an actor, and abstract metaphor nouns
- Avoid three patterns that hurt the weak units:
  - a "Picture this" box that restates the section instead of giving an analogy
  - generic captions repeated across figures
  - sections that state a rule ("Choose X deliberately") without showing the mechanism and a number

## Figures

- Each figure is a function exported from a `src/figs/*.js` file that returns an SVG string drawn with rough.js through the `D` class in `src/lib/draw.js`.
  - The canvas is 640 wide with any height.
  - The first call is the kicker, `d.text(10, 16, 'UPPERCASE KICKER', { cls: 'cap', a: 'start' })`. The helpers in `src/lib/system-figures.js` and `src/lib/fundamentals-figures.js` do this for you.
  - Use at most two `d.hand(...)` notes per figure.
  - Figure ids are snake_case and unique across all files. The checker fails on duplicates.
- Colours come only from the `C` object, which maps to CSS variables so dark mode works. Use exactly one orange accent per figure, on the thing the caption says to look at. Use slate (`C.slate`, `C.slateSoft`) only for a second series. Everything else is ink, gray or line.
- No pastel blob or oval backgrounds behind drawings (an owner preference).
- The style is clean, minimal and engineer-drawn: thin slightly rough lines, rounded boxes, arrows, small labels beside the parts they label. It is not illustrative art.
- Show mechanisms and intermediate states, not titles in boxes: message sequences between actors, before and after states, timelines, tables of computed values, partition assignments, queue depth over time, packet headers, page tables, Gantt charts for schedules.
  - Helpers exist for common shapes: `systemFigure(id, kicker, kind, data, note)` with kinds flow, sequence, rows, bars, fan, tree, ring, matrix, split and timeline; and `canvas`, `flow`, `cards`, `ledger`, `lanes`, `map` and `cover` for fundamentals.
  - Prefer a custom drawing when the idea is spatial.
  - Do not make 35 near-identical flow diagrams.
- Aim for about one figure per section: at least 35 unique body figures per system-design unit and about 50 to 60 per fundamentals guide. Place each figure right after the paragraph that explains it.
- Captions say what the figure shows and where to look, for example "Twelve partitions assigned to groups of 4, 6 and 16. Past twelve members, extra consumers are idle." Never a generic sentence.

## How to work

- Work one unit at a time. For each part, compute its numbers first, then write the markdown, then write its figures. After a unit is complete, run once:
  - `npm run build`
  - `node scripts/system-design/check.mjs <unit-slug>` for system-design units
  - `python3 scripts/system-design/coverage.py` (syllabus coverage)
  - Fix every error. Resolve short-section warnings by adding substance, not filler.
- There is no checker for `fundamentals`. Adapt `scripts/system-design/check.mjs` by pointing `root` at `src/content/fundamentals` and `expected` at `['dbms','cn','os']`, or apply the same rules by hand.
- **Owner's rules that override defaults:**
  - Do not write tests, demo blocks or scratch verification scripts.
  - Do not take screenshots, start a dev server or drive a browser.
  - Do not write code comments, including docstrings.
  - Running the build and the existing content checker once per finished unit is allowed for this task, because the work is meaningless without it.
  - Report in a line or two per unit, and say "not run" for anything you did not run.
- **Environment constraints:**
  - File deletion through the shell is blocked. Overwrite files in place instead.
  - Do not rerun the old generator scripts (`author.py`, the numbered `0N-*.py`, `expand-networking.py`, `complete-api.py`). They regenerate first drafts and would overwrite revised content.
  - `scripts/system-design/numbers.py` shadows Python's `numbers` module, so new scripts in that folder must call `sys.path.remove(...)` before importing `fractions`.
- Do not commit unless asked. If asked, branch off `main` first.

## Definition of done

- Every syllabus item in `sysdzn.md`, `dbms.md`, `cn.md` and `os.md` appears in its guide, in order.
- `check.mjs` reports 0 errors and 0 warnings for all 22 system-design units.
- The fundamentals guides meet the same rules.
- No unit uses a repeated boilerplate caption or a mislabelled callout.
- Every unit and part title is a standard topic name.
- Fundamentals has three guides (DBMS with 12 parts, CN, OS), each with an interview page.
- `npm run build` succeeds with no missing figures or KaTeX errors.

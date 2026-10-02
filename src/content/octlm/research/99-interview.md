@chapter faq | Interview question bank | Forty questions test the mechanisms and the evidence needed to assess them. Use a whiteboard for masks, cache formulas, probability correction, and experiment controls.

### Prediction and attention patterns

**Q1. Why is dense attention expensive at long context?**

Each query can compare with a growing number of keys, giving quadratic pair count in a full-sequence pass. During cached decoding, one new query reads the historical cache, whose payload grows linearly with length. These are different costs.

**Q2. Does FlashAttention remove quadratic attention arithmetic?**

No. It implements exact dense attention with an IO-aware schedule that avoids storing the entire score matrix in high-bandwidth memory. It changes memory traffic and intermediates, while dense query-key connectivity remains quadratic.

**Q3. What does multi-token prediction add to next-token training?**

Auxiliary targets at several future offsets. A shared trunk and prediction modules learn those targets with declared weights and masks. The exact dependency between modules varies by architecture; multiple independent heads are one design, not the only one.

**Q4. Why mask the tail for deeper prediction targets?**

A target several offsets ahead may not exist near the sequence end. Training on nonexistent targets invents labels. Each depth needs correct shift alignment, valid positions, and loss normalization.

**Q5. Does MTP guarantee faster generation?**

No. Extra heads provide trained proposals or auxiliary learning signals. Faster decoding needs a proposal-and-verification algorithm whose accepted output pays for the extra computation. Training and inference benefits must be measured separately.

**Q6. What is sparse attention?**

A pattern allowing each query to read fewer keys than dense attention permits. Savings require an implementation that skips disallowed work. Computing a dense matrix and applying a sparse-looking mask can retain dense cost.

**Q7. How do fixed-block local and sliding-window attention differ?**

Fixed blocks divide positions into nonoverlapping neighborhoods. Sliding windows move with the query and cross those block boundaries. Both remove distant edges, but their connectivity and boundary failures differ.

**Q8. What is the causal width convention in this guide?**

The width includes the current token. Width 4 allows the current position and up to three predecessors. Libraries using a count of prior positions need a translated value before masks or costs are compared.

**Q9. How does receptive field grow through local layers?**

Under identical causal windows of width $w$ including the current position, the maximum structural span after $L$ layers is $1+L(w-1)$, clipped at sequence start. Reachability does not imply that every reachable detail is retained or retrievable.

**Q10. Can a prefix global token summarize future tokens?**

Not in a causal forward pass. Its representation can depend only on its permitted past. Later positions can read it, but that does not let the prefix position encode subsequent text without another mechanism.

**Q11. Is strided attention always linear in sequence length?**

No. If each query reads roughly $T/s$ strided keys at fixed stride $s$, pair count contains a $T²/s$ term. Define the pattern and how stride or global count scales with length.

**Q12. Why count a union of local and global edges?**

Some edges appear in both patterns. Adding the counts separately double-counts overlap. The mask defines a set of allowed query-key pairs, and causality must hold for every member.

**Q13. How does hybrid attention affect cache memory?**

Local layers can retain bounded rolling caches, while full-attention layers still need full history. Total payload sums each layer's requirement. A hybrid does not let all layers evict old states merely because some are local.

### Compressed and latent memory

**Q14. How does historical block compression save memory?**

It replaces several old token entries with one summary while preserving recent entries. At fixed block size it still grows with length, but with fewer historical entries. The feature width of each summary is a separate design choice.

**Q15. Why is mean-pooling K/V not exact attention?**

Full attention makes separate comparisons and then applies nonlinear softmax. Pooling removes those choices before normalization. Distinct histories can produce the same pooled vectors but require different answers.

**Q16. How can compression leak future information during training?**

A precomputed block summary may contain positions later than the current query. Making that summary visible before the block is entirely in the query's past violates causality. Define when summaries become eligible.

**Q17. What should long-context evaluation test besides one hidden fact?**

Exact copying, multiple facts, ordering, distractors, long-range dependencies, varied insertion depths, and held-out language-model loss. Report actual context processing and memory costs. One successful template does not establish general long-context competence.

**Q18. How does MLA differ from old-token compression?**

MLA compresses the feature representation stored for each token. Old-token compression reduces the number of historical entries. MLA can retain every position while sharing a smaller content latent across key and value transformations.

**Q19. Why does joint KV compression matter?**

One content latent supplies both reconstructed keys and values. Its cache count is not twice its rank. Head-specific up-projections derive different features from that shared state, subject to the latent's representational restriction.

**Q20. Explain content-key absorption.**

For a linear up-projection, `qᵀWc=(Wᵀq)ᵀc`. Transform the query once, then compare it with cached latents. This avoids persistently expanding full historical content keys in the intended decode path.

**Q21. Explain value-side reassociation.**

A weighted sum commutes with a fixed linear value up-projection. Compute the attention-weighted latent sum first, then expand that sum or combine the expansion with the output map. Each head still has its own weights.

**Q22. How do MHA, GQA, and MQA share KV?**

MHA uses separate KV projections per query head. GQA shares one KV head within each query group. MQA shares one KV head across all queries. Their payload is twice the number of KV heads times head width per token per layer.

**Q23. Is MLA always smaller than GQA?**

Only if latent rank plus cached positional-key width is below the explicit GQA K/V width. Our fixture wins at rank 64 and ties at rank 240. Cache count is not a quality ranking.

**Q24. What does RoPE complicate in naive MLA absorption?**

Historical keys are rotated by different position-dependent maps. Those maps sit between query and key up-projection, preventing the same fixed query transform from serving every position in the simple content identity.

**Q25. What does decoupled RoPE do?**

It keeps content and rotary positional score paths separate. The content path can use absorbed latent queries, while an explicit positional key supports rotary comparisons. Count that positional key in cache storage.

**Q26. Does MLA make dense attention linear-time prefill?**

No. It reduces the feature representation per token, not the number of dense token-to-token connections. The cache still grows with length, and dense full-sequence attention still has quadratic connectivity.

### Verification and research judgment

**Q27. How does speculative verification run in parallel?**

All candidate inputs are already known. A causal target pass computes distributions at their positions together, while each position still conditions on the preceding candidate prefix. Generated output remains ordered and only accepted prefixes survive.

**Q28. What is the sampling acceptance rule?**

For candidate sampled from $q$, accept with probability $\min(1,p/q)$ under the same prefix. On rejection sample from normalized positive difference `max(0,p-q)`. Use the declared actual sampler distributions.

**Q29. Why does the correction preserve the target distribution?**

Accepted mass at each outcome is `min(p,q)`. Corrected rejected mass is `max(0,p-q)`. Their sum is p. Apply the argument at each accepted prefix and discard the rejected suffix.

**Q30. What controls speculative speed?**

Accepted tokens per round must amortize draft and verification time. Alignment, draft length, separate draft weights, kernel behavior, batch, and synchronization affect the result. Low acceptance or expensive drafting can make speculation slower.

**Q31. Why is equal-token comparison different from equal-compute comparison?**

An architecture can spend more work per input token. Equal tokens tests learning from the same exposure; equal compute tests what each design achieves within the same work budget. Report the other quantities rather than pretending every constraint is equal.

**Q32. Why run multiple seeds?**

They expose variation from initialization, data order, and optimization. Estimate uncertainty in the comparison of interest. One favorable seed cannot separate an architectural effect from ordinary run variation.

**Q33. Is the baseline's seed range a significance threshold?**

No. The observed range depends on sample size and is not uncertainty in the mean paired difference. Use an appropriate design and statistical assumptions, report raw runs, and avoid selecting winners after many unreported trials.

**Q34. What can a tiny undertrained pilot establish?**

Correct shapes, causal masks, implementation equivalence, and some behavior at its short budget. It may not expose the intended bottleneck or predict a well-trained larger model's quality. State the narrow claim supported.

**Q35. Is 20 tokens per parameter a universal training requirement?**

No. It is a contextual summary of one scaling study's regime. Optimal exposure depends on the objective and constraints. Use learning curves and the actual task rather than treating the heuristic as a convergence or significance certificate.

**Q36. Why use bits per byte?**

It relates total negative log likelihood to evaluated text bytes, enabling a more interpretable comparison across tokenizers than token-mean loss alone. Still define preprocessing, special-token treatment, target boundaries, and byte counting.

**Q37. Why measure prefill and decode separately?**

Prefill processes a known sequence; decode extends it with a growing cache. They have different shapes and bottlenecks. A prefill improvement does not guarantee faster generation at the deployed context and batch.

**Q38. What did OCTLM's changed Day 3 plan establish?**

That the proposed runs were withdrawn before the first GPU stage because the budget and learning direction were reconsidered. It did not establish a measured ranking of the unrun architectural variants. Preserve that distinction in the history.

**Q39. What should a paper's ablation demonstrate?**

The contribution of a declared component under the compared recipe and budget. A bundle beating a baseline shows a bundle-level result. It cannot assign all of the gain to one included feature without suitable controls.

**Q40. What is a valid inconclusive outcome?**

The allotted experiment cannot distinguish a useful effect with the observed uncertainty or baseline capability. Record the measurements and limits, then stop or design a new experiment. Repeatedly seeking a lucky run is not a solution.

@chapter exercises | Exercises | Twenty-five exercises move from mask counting to a full experiment. One filled dot means a short check, two mean a derivation or diagnosis, and three mean a complete implementation or research design.

### Short checks

**E1. ●○○ Dense count.** Count causal pairs for lengths 8 and 16, and full square-grid entries. Explain why the ratios differ slightly.

**E2. ●○○ Local count.** Count a causal width-4 window at length 8, including the current position.

**E3. ●○○ Reach.** Compute maximum structural span for 8 width-4 layers and for 8 width-256 layers.

**E4. ●○○ MTP loss.** Combine depth losses 1, 2, and 3 with weights 1, 0.5, and 0.25. Give weighted sum and weight-normalized mean.

**E5. ●○○ Explain aloud.** Why can a local mask fail to make an implementation faster?

**E6. ●○○ Block entries.** Keep 256 exact entries from length 1,024 and pool the old region in blocks of 8. Count stored entries and payload reduction factor.

**E7. ●○○ Cache comparison.** At batch 2, 8 layers, length 4,096, width 64, and two-byte elements, compute GQA payload with 2 KV heads and MQA payload with 1.

**E8. ●○○ MLA crossover.** With a 16-feature positional key, derive the ranks for which MLA is smaller than the 256-feature GQA cache.

**E9. ●○○ BPB.** An evaluated 4-byte text has total negative log likelihood `8 ln 2` nats. Compute BPB.

**E10. ●○○ Explain aloud.** Explain why a 3.2-fold cache-payload saving does not imply 3.2-fold faster inference.

### Derivations and diagnoses

**E11. ●●○ Pooling.** Average keys `[1,0]`, `[3,2]` and values `[4,2]`, `[8,6]`. For query `[1,0]`, compare unscaled full-attention first output component with the pooled result.

**E12. ●●○ Absorption proof.** Derive the content-key and value-sum reassociations without reconstructing every historical key or value. State their linearity assumption.

**E13. ●●○ Probability correction.** For `q=[0.6,0.4]`, `p=[0.3,0.7]`, compute acceptance probabilities, accepted mass, rejection mass, residual distribution, and final distribution.

**E14. ●●○ Expected output.** For 4 candidates and constant independent conditional acceptance 0.8, compute expected emitted tokens per round, including replacement or bonus.

**E15. ●●○ Speed.** Draft costs 1 ms per candidate, four-candidate verification costs 12 ms, and ordinary target decode costs 10 ms/token. Compute the speed ratio at acceptance 0.8 and 0.2.

**E16. ●●○ Paired seeds.** For improvements `[0.01,0.03,0.01,0.02,0.03]`, compute mean, sample standard deviation, and standard error. State what assumptions a t interval adds.

**E17. ●●○ Hybrid.** Compute payload and causal pair count for six width-256 local layers and two full layers at length 4,096 under the Finch batch-2 cache fixture.

**E18. ●●○ Tiny latent.** For hidden `[2,1]`, down row `[1,2]`, up-key column `[1,2]`, and query `[1,2]`, compute latent, reconstructed key, absorbed query, and both scores.

**E19. ●●○ Training exposure.** Compute positions for 2,000 steps at batch 8 and length 256. Divide by 3,740,160 parameters and compare with a contextual 20-per-parameter budget.

**E20. ●●○ Explain aloud.** Why does a reachable distant token in stacked local layers not guarantee exact copying of it?

### Complete investigations

**E21. ●●● Mask code.** Write a causal local-plus-global predicate with width including the current position. Count allowed pairs at length 8, width 3, and globals `{0,4}`. Verify no future positions are allowed.

**E22. ●●● Full model count.** Reconcile all Finch-24 parameters for both the all-full baseline and a mask-only local/full hybrid. State which changes would invalidate the shared count.

**E23. ●●● Compression evaluation.** Design a benchmark that can separate useful summaries from exact-detail loss. Include position sweeps, task types, failure cases, and actual costs.

**E24. ●●● MLA versus GQA.** Design a fair comparison of quality, cache storage, prefill, and decode. Specify what budget is equal and how you will detect a reference implementation that reconstructs the claimed-away cache.

**E25. ●●● Research decision.** Plan a controlled Finch hybrid experiment with a hypothesis, baseline, seeds, acceptance rule, measurements, and stop condition. Include a valid inconclusive outcome.

@chapter solutions | Worked solutions | All arithmetic uses the chapter's declared conventions. The calculations establish the illustrative examples; actual architecture improvements require measured runs.

### Short checks, E1 to E10

**E1.** Causal counts: `8 × 9/2=36`, `16 × 17/2=136`. Full grids: 64 and 256. The square-grid ratio is 4; the triangular ratio is `136/36=3.777778`, rounded, because `T(T+1)/2` includes a linear boundary term.

**E2.** `1+2+3+4+4+4+4+4=26`. Equivalently `4 × 5/2 + (8-4) × 4=10+16=26`.

**E3.** `1+8 × (4-1)=25`. At width 256: `1+8 × 255=2,041`. Clip these spans at the available sequence prefix.

**E4.** Weighted sum `1+0.5 × 2+0.25 × 3=2.75`. Weight sum `1.75`; normalized mean `2.75/1.75=1.571429`, rounded. Sum and normalized mean require different loss-scale interpretations.

**E5.** A dense kernel can compute every score before masking, and a dense Boolean mask can itself consume quadratic storage. Structural sparsity only reduces actual work when the backend skips disallowed connections efficiently enough to overcome its overhead.

**E6.** Historical entries `768/8=96`; total `256+96=352`. Reduction factor `1,024/352=2.909091`, rounded. At lengths shorter than the recent width, keep all existing entries rather than applying this old-region formula.

**E7.** GQA: `2 × 8 × 4,096 × 2 × 2 × 64 × 2=33,554,432` bytes, or 32 MiB. MQA halves the KV-head count: 16,777,216 bytes, or 16 MiB.

**E8.** `r+16<256` gives `r<240`. Rank 240 ties; rank 256 stores 272 features and loses the payload comparison. A larger representation may still be useful if quality justifies it.

**E9.** `8 ln 2/(4 ln 2)=2` BPB. The denominator is evaluated bytes, not token count.

**E10.** Cache reads are only one cost. Weights, projections, attention arithmetic, kernel launch and sampling overhead can dominate. The smaller representation can also introduce computation. Time the actual workload with a declared backend.

### Derivations and diagnoses, E11 to E20

**E11.** Mean key `[2,1]`; mean value `[6,4]`. Full first component `(exp(1) × 4+exp(3) × 8)/(exp(1)+exp(3))=7.523188`, rounded. Pooled single-entry attention returns 6. Pooling removes the separate softmax selection.

**E12.** Content score `qᵀW_Kc=(W_Kᵀq)ᵀc` by matrix associativity. Values satisfy `Σ a_t W_Vc_t=W_VΣ a_tc_t` by linearity. The maps must be fixed linear transformations for the given head; position-dependent rotation or a nonlinearity can block the simple key reassociation.

**E13.** Acceptance `[0.5,1]`; accepted mass `[0.3,0.4]`; total accepted 0.7; rejected mass 0.3. Positive difference `[0,0.3]` normalizes to `[0,1]`. Final mass `[0.3,0.4+0.3]=[0.3,0.7]`.

**E14.** `1+0.8+0.8²+0.8³+0.8⁴=3.3616` tokens per round in expectation. The initial 1 represents the always-emitted replacement or bonus contribution in the tail-sum argument.

**E15.** Round time `4 × 1+12=16 ms`. At 0.8, ratio `10 × 3.3616/16=2.101`. At 0.2, expected output 1.2496 gives `10 × 1.2496/16=0.781`. The second configuration is slower despite sometimes accepting drafts.

**E16.** Mean 0.02. Sample variance `(0.0001+0.0001+0.0001+0+0.0001)/(5-1)=0.0001`; sample standard deviation 0.01. Standard error `0.01/√5=0.004472`, rounded. The stated t interval assumes independent pairs and an approximately normal difference distribution; it does not cover unreported variant selection.

**E17.** Full-layer payload 4 MiB, local-layer payload 0.25 MiB. Total `2 × 4+6 × 0.25=9.5` MiB. Full causal pairs `4,096 × 4,097/2=8,390,656`; local pairs `256 × 257/2+3,840 × 256=1,015,936`. Total `2 × 8,390,656+6 × 1,015,936=22,876,928` per query head and sequence.

**E18.** Latent `1 × 2+2 × 1=4`. Key `[4,8]`. Absorbed query `1 × 1+2 × 2=5`. Expanded score `1 × 4+2 × 8=20`; latent score `5 × 4=20`.

**E19.** Positions `2,000 × 8 × 256=4,096,000`. Ratio `4,096,000/3,740,160=1.095140`, rounded. Heuristic budget `20 × 3,740,160=74,803,200`, or 18.2625 times the short budget. This arithmetic is not a convergence test or proof of the cause of seed noise.

**E20.** A graph path only allows influence to travel. Each intermediate representation can discard or mix details, and learned attention may not choose the useful path. Exact copying requires preserving and retrieving token identities, not merely possible communication.

### Complete investigations, E21 to E25

**E21.** This complete small check defines the union once and enforces causality before applying either connection rule. Width includes the current token.

```python
def allowed(query, key, width, globals_):
    if width < 1:
        raise ValueError("width must be positive")
    return 0 <= key <= query and (
        query - key < width or key in globals_
    )

length, width, globals_ = 8, 3, {0, 4}
count = sum(allowed(q, k, width, globals_)
            for q in range(length) for k in range(length))
assert count == 27
assert all(not allowed(q, k, width, globals_)
           for q in range(length) for k in range(q + 1, length))
assert sum(allowed(q, k, 3, set())
           for q in range(8) for k in range(8)) == 21
```

Future global index 4 remains invisible to queries before 4. An edge already present in the local window is counted only once.

**E22.** Embedding 16,384,000; each block has attention 655,360, SwiGLU 2,359,296, and norms 1,024, totaling 3,015,680. Eight blocks give 24,125,440; final norm 512. Total `16,384,000+24,125,440+512=40,509,952`. Mask-only changes add no learned tensors. Added compression, changed head shapes, auxiliary MTP modules, or untied output weights require a new count.

**E23.** Use exact copying, fact retrieval, multiple facts, ordering, and distant dependencies across length and insertion-depth sweeps. Include facts inside compressed blocks, near partial blocks, and just inside recent memory. Compare full, local, and compressed variants on identical tasks and declared training budgets. Score exactness and broader quality, then report stored payload, peak memory, compression-building time, prefill, and decode. Include corrupt or insufficient-memory cases with expected failures.

**E24.** Fix dataset, tokenizer, evaluation tasks, precision, and declared primary budget; disclose parameter-count and compute differences. Sweep latent ranks against the actual GQA KV width. Inspect persistent tensor shapes during decoding, not only formula counts. Compare absorbed and explicit reference paths numerically, and measure warmed-up prefill and decode at deployment contexts and batches. Retraining and multiple seeds establish quality; allocation inspection exposes hidden reconstructed histories.

**E25.** Declare a retrieval-quality criterion and measured-cost goal before testing. Keep Finch shapes and training recipe fixed, changing only layer masks and rolling-cache retention. Verify masks and cache continuation; train a prescribed seed set at equal tokens, reporting compute. Measure task quality, held-out loss, 32 versus 9.5 MiB expected cache payload, real allocation, prefill, and decode. Stop at the allocated budget: keep if criteria are supported, reject if they fail, or report unresolved uncertainty with the run ledger.

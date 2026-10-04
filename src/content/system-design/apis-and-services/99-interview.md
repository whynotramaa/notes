@chapter faq | Interview question bank | Say the mechanism, the guarantee, and the failure boundary aloud.

**Q1. What makes a resource identity useful?**

It names a product concept independently of the current table, process, or shard. Clients keep using that identity while the server changes its storage route.

**Q2. What should an accepted response prove?**

It should identify the acceptance boundary, such as a committed command or a durable queued job. It must not imply delayed derivatives are ready unless that is part of the guarantee.

**Q3. Why avoid exposing every database column?**

Stored relationships and public meaning have different evolution needs. Exposing columns directly can turn an internal migration into a client contract change.

**Q4. Can one JSON response be internally inconsistent?**

Yes, different fields can come from different observation times or authorities. Declare freshness or supply a supported snapshot rather than implying a global atomic read.

**Q5. What does a safe HTTP method mean?**

The requested operation does not intentionally change application state. Incidental logging can occur, but a link retrieval should not request a score correction.

**Q6. Does an idempotent method require identical replies?**

No, repeating the intended operation preserves the intended effect. A second delete can observe absence and return a different response without recreating the resource.

**Q7. Why validate before checking business state?**

Bounded parsing and shape checks reject cheap deterministic errors before spending expensive work. State-sensitive rules must still be enforced atomically with their protected effect.

**Q8. What belongs in an API error?**

A stable machine-readable kind, safe corrective information, and a diagnosis identifier. Its meaning must distinguish refusal, conflict, uncertain effect, and delayed observation.

**Q9. Does a page size bound a query?**

It bounds returned records. The engine can still scan, sort, query many shards, or evaluate many permissions before producing the page.

**Q10. Walk through an offset insert failure.**

After returning 9, 8, 7, a new 10 shifts positions. Skipping three returns 7, 6, 5, repeating the earlier boundary record.

**Q11. Why can keyset paging be cheaper?**

A suitable index can seek to the complete ordered boundary instead of producing all skipped rows. Filters and ordering still need a bounded access path.

**Q12. Why include a tie breaker?**

Equal primary sort values cannot distinguish all continuation positions. A deterministic unique secondary key makes the ordering and predicate complete.

**Q13. Does an opaque cursor hide private data?**

Not necessarily. Opaque describes how clients should treat it; signing prevents suitable tampering but does not encrypt its fields.

**Q14. Why bind a cursor to its query?**

Changing filters or sort changes the set and order to which the boundary refers. Scope and query validation prevent a continuation token from silently changing meaning.

**Q15. Why can mutable ranking break paging?**

An item can move across the boundary after its popularity changes. A unique tie breaker resolves equality but does not freeze the ranking field.

**Q16. When would you use snapshot paging?**

When the whole walk needs a consistent set, such as an audit export. Keeping versions or materializing an export has a storage and lifetime cost.

**Q17. What does an ETag contribute?**

It names a representation validator under HTTP matching rules. A suitable strong tag can support a precondition, but a weak tag has different matching semantics.

**Q18. Is a revision a clock?**

It can be an equality token or an authoritative sequence without describing wall time. Timestamps can tie or drift, so choose the scheme for the comparison needed.

**Q19. What does a command key identify?**

One intended operation across repeated attempts. It must remain stable after reconnecting or changing the application instance.

**Q20. Why compare payload identity on a duplicate key?**

The same key with different meaning is a conflict, not a supported retry. Otherwise the service can return the result of an unrelated action.

**Q21. Why record command identity and effect atomically?**

A crash between separate writes can leave the effect unrecorded or identity recorded without the effect. A shared commit makes recovery unambiguous within the local transaction contract.

**Q22. Do command keys solve concurrent editing?**

They deduplicate one intended command. Two different commands can still overwrite one another unless a state precondition or merge rule protects the observation.

**Q23. How does a version precondition work?**

The authority evaluates expected version and update in one atomic operation. Zero matching rows indicates conflict rather than permission to overwrite the latest state.

**Q24. Can adding a field be a breaking change?**

It can if supported clients reject unknown fields or the addition changes interpretation. Compatibility depends on actual client rules, not just the server calling the field optional.

**Q25. How do authentication and authorization differ?**

Authentication establishes the caller or accepted claims. Authorization decides whether that caller may perform this action on this object under current rules.

**Q26. What is object-level permission?**

It is permission for the client-supplied resource identifier, not merely access to the handler. A scorer assigned to m7 should not gain correction permission for m8 by changing the path.

**Q27. Why count induced work?**

A small batch can create many dependent reads or expansions. Request count alone can underestimate the resource demand the API admits.

**Q28. Why enforce capacity after a caller quota passes?**

Many compliant users can collectively exhaust a destination. Local admission bounds outstanding work even when no caller violates its own policy.

**Q29. What changes when a limiter fails open?**

The shared policy stops being fully enforced during that interval. A local fallback needs an explicit ceiling, scope, and multiplication across instances.

**Q30. What should a service trust from a gateway?**

Only claims that it can verify came from an authorized intermediary under the deployment trust policy. Resource permission and bypass paths still require checks.

**Q31. Can a monolith scale?**

Replicas can handle suitable stateless work, and separate workers can isolate heavy jobs. Its deployment shape alone does not determine every resource bottleneck.

**Q32. What makes a modular monolith modular?**

Explicit interfaces and data ownership restrict how modules interact. One process can have those rules before the modules become separately deployed services.

**Q33. What is a useful service boundary?**

It follows business authority, resource isolation, or independent change needs. State that must commit together should stay local unless a recoverable remote protocol justifies the split.

**Q34. Why can parallel calls still make latency worse?**

They may compete for a shared scarce resource or enlarge its queue. Their ideal critical path assumes adequate capacity and omits overhead.

**Q35. What is the difference between a command and an event?**

A command requests an action that an authority may reject. An event describes a committed fact under its owner's contract and gives derivatives something to apply.

**Q36. What changes with asynchronous communication?**

The sender can finish before the receiving business effect. Delay, duplicates, retained progress, and visible freshness become part of the contract.

**Q37. Does a saga roll back all services?**

It runs compensating business actions after local commits. Those actions can fail or be imperfect, so durable progress and reconciliation remain necessary.

**Q38. Why recover a timed-out job before releasing credit?**

The job may already exist. Recover its stable identity before deciding the next workflow step. Creating the job does not permit processing: it stays gated until media durably records credit finalization for that job. Finalization and release compete through one conditional reservation transition.

**Q39. Orchestration or choreography?**

Orchestration records decisions in a coordinator; choreography distributes reactions through events. Both need stable identities, completion criteria, and responsibility for stalled workflows.

**Q40. Walk through the complete correction contract.**

Admit and authenticate the request, authorize the match, then atomically check its version and commit command identity, score change, and event intent. Recover a lost reply with the same command key and observe delayed views by their own applied progress.

**Q41. What changes when local modules become remote services?**

Ordinary calls become exchanges that can time out after effects occur, and local commits may split. Keep the invariant visible and add explicit identity, deadline, publication, and workflow recovery where required.

@chapter exercises | Exercises | One dot is arithmetic, two dots require a trace, and three dots require a design or derivation.

**E1** ● A stable result has 1,000 records and pages of 20. Count pages.

**E2** ● Compute the offset for page index 50 with 20 rows per page.

**E3** ● A query scans 10,000 candidates and returns 20. Compute the ratio.

**E4** ● A batch has 20 commands each inducing five reads. Count reads.

**E5** ● Four calls each take 20 ms. Compare serial and ideal parallel time.

**E6** ● A 500 ms request spends 40 ms at entry and reserves 60 ms for reply. Compute dependency time.

**E7** ● An illustrative account has 10,000 cents and spends 2,500. Compute its balance.

**E8** ● Reserve one of 10 available credits, then release that reservation once. Trace availability.

**E9** ● At 1,000 commands per second for 86,400 seconds, count command records.

**E10** ● Assume those records each contain 300 payload bytes. Count payload.

**E11** ●● Trace offset pages after inserting a newer event.

**E12** ●● Trace keyset continuation for the same insertion.

**E13** ●● Continue below tuple (100,11) in the chapter's tied list.

**E14** ●● Explain a snapshot without equations.

**E15** ●● Two clients both expect version 7. Trace sequential conditional updates.

**E16** ●● K commits at revision 8 and another command commits at 9. Recover K.

**E17** ●● Explain the gateway bypass risk without equations.

**E18** ●● Create a failure trace for an outbox publisher.

**E19** ●● Explain why compensation is not restoring an old account row.

**E20** ●● Design a policy for an optional recommendation call.

**E21** ●●● Prove why comparing a version outside an unconditional write is unsafe.

**E22** ●●● Derive the retained command-storage formula.

**E23** ●●● Write a conditional correction in SQL.

**E24** ●●● Design recovery after a saga create-job timeout.

**E25** ●●● Count every relevant boundary in a complete correction and lost reply.

@chapter solutions | Worked solutions | The assumptions are illustrative; the calculations are reproducible.

**E1.** 1,000 divided by 20 is 50. This count assumes a fixed qualifying result; a live mutable walk can change its membership.

**E2.** 50 times 20 is 1,000 skipped positions. The response size remains 20; the skipped work depends on the query plan.

**E3.** 10,000 divided by 20 gives 500 candidates per returned row. The count measures this illustrative scan, not every possible indexed query.

**E4.** 20 times 5 gives 100 dependent reads. A one-request quota would hide this expansion unless its cost accounting includes the batch contents.

**E5.** Serial time is 4 times 20, or 80 ms. Ideal concurrent time is the maximum of the four durations, 20 ms, before merge work and overhead.

**E6.** 500 minus 40 minus 60 leaves 400 ms. Two serial stages must share that remaining budget rather than each receiving a fresh 400 ms.

**E7.** 10,000 minus 2,500 is 7,500 cents. Failure in a separate scheduling service does not automatically erase that committed debit.

**E8.** 10 minus 1 gives 9 available while the reservation is held. Releasing the named reservation once gives 9 plus 1, or 10. A release retry leaves 10 unchanged.

**E9.** 1,000 times 86,400 gives 86,400,000 records. This is a stated full-day peak scenario, not Heron's ordinary daily demand.

**E10.** 86,400,000 times 300 gives 25,920,000,000 bytes. Indexes, replicas, allocation, and cleanup overhead add separate physical costs.

**E11.** The original order is 9, 8, 7, 6, 5, 4, so the first page is 9, 8, 7. Insert 10 before the second read. Skipping three now yields 7, 6, 5; event 7 repeats.

**E12.** The first page ends at sequence 7. Query values below 7 after insertion and return 6, 5, 4. The new 10 is above that immutable boundary.

**E13.** The tuples are ordered descending. Values below (100,11) are (99,10) and (99,9), so they form the next two-row page. The predicate includes both time and ID.

**E14.** It fixes which observation of the dataset each page reads. Keeping old versions or materializing the export supplies that observation, while a cursor by itself only supplies continuation.

**E15.** The first predicate matches one row and advances its version to 8. The second predicate for 7 matches zero rows. Report conflict; do not silently change the second predicate to 8.

**E16.** Look up the scoped key and verify its payload meaning. Return K's stored revision-8 outcome without applying it again. Offer a separate current read for revision 9.

**E17.** An internal endpoint may receive calls that never passed through public entry. It needs its own trusted caller evidence and resource permission checks rather than assuming gateway policy already ran.

**E18.** The score and E commit together. The publisher sends E, the broker accepts it, then the publisher crashes before marking it sent. Recovery sends E again, so the receiver needs a duplicate-safe effect.

**E19.** Other purchases can commit after the earlier step. Restoring the whole row would erase them. Release the named reservation or credit the identified effect under current rules instead.

**E20.** Give it a smaller deadline than the essential score path. On its timeout, return the authoritative score with an explicit omitted recommendation state. Cancel work where supported and monitor the optional failure separately.

**E21.** Schedule A's read of version 7, then B's committed change to 8, then A's unconditional write. A uses an observation that no longer holds and can overwrite B. Combining predicate and effect atomically prevents that interleaving.

**E22.** For rate lambda and retained duration T, the record count is lambda times T under the uniform assumed rate. Multiplying by bytes b per record gives B=lambda T b. Each additional second retains lambda b more payload bytes.

**E23.** Use a transaction containing UPDATE matches SET score=:score, version=version+1 WHERE match_id=:id AND version=:expected. Require exactly one updated row, then store command outcome and outbox intent before the same commit. A unique scoped command key resolves concurrent duplicates; failed preconditions must not leave a successful command result.

**E24.** Persist the workflow step and retry or query the same job operation identity. If the job exists, recover its recorded outcome and atomically finalize the still-held reservation for that job. The job stays gated until media durably records that entitlement. If release or expiry already won, finalization rejects and the workflow cancels or resolves the gated job. If the job is definitively refused, release the named reservation duplicate-safely. Keep uncertain outcomes and failed compensation visible for reconciliation.

**E25.** Entry admission and identity establish caller context; resource authorization and version checking protect the local score commit. That commit records K, revision 8, and E. Publication is another boundary and downstream effects each have their own boundary. Losing the public reply changes none of those commits; recovery asks the authority about K and checks each delayed view separately.

The next chapter follows the contract through dependency failure and recovery.

### Primary sources

[HTTP semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). Methods, representation validators, and preconditions.

[Problem details, RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). Machine-readable HTTP error information.

[OWASP object-level authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/). Resource-specific checks.

[AWS saga orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html). Durable local-step workflows and compensation.

[AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html). Local state and publication intent.

All Heron arithmetic is illustrative and computed in `scripts/system-design/api-numbers.py` and `scripts/system-design/resumption-numbers.py`.

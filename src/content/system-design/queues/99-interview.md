@chapter faq | Interview question bank | Explain the ownership, the durable boundary and the crash that tests it. Use Heron's numbers when the question asks for capacity.

### Why message queues

**Q1. Why put transcoding behind a queue?**

It lets the API answer after durable acceptance while workers finish the slow job. At 6 uploads per second, moving from a 30-second request to a 0.15-second request changes average open requests from 180 to 0.9. The worker capacity requirement remains unchanged.

**Q2. Does adding a queue increase throughput?**

No, it stores the difference between arrivals and completed work. Throughput still depends on workers and their dependencies. Sustained arrivals above that capacity create an increasing backlog.

**Q3. What does 202 Accepted promise?**

The service has accepted responsibility for the job and provides a stable way to learn its outcome. It does not promise that the job has started or will succeed. Heron backs acceptance with a committed job row and publication intent.

**Q4. How do commands differ from events?**

A command asks an owner to act and can be rejected. An event reports something that already happened, and readers independently decide how to react. Naming the meaning first helps choose competing consumption or independent subscriptions.

**Q5. What prevents a repeated upload request from creating two jobs?**

The API records a stable submit key with the job under a uniqueness constraint. A repeated request with the same key and matching payload returns the existing job. Reusing the key with different input must be rejected rather than silently returning another upload's result.

**Q6. Why keep job status outside the queue?**

Delivery state is not business progress. An acknowledged message may disappear from the broker while the user still needs the result and its history. The job row supplies an authoritative lifecycle resource.

### Queues, pub/sub and event streams

**Q7. What does a competing-consumer queue distribute?**

It distributes jobs among workers, with one current delivery owner for each message under the queue's lease or acknowledgement rules. A crash can cause another delivery. Competing consumption does not mean the business effect automatically happens once.

**Q8. Why does pub/sub need independent backlogs?**

Each subscription owes its own processing of each event. A slow search indexer must not advance analytics progress or consume live delivery's copy. Workers can compete within a subscription while subscriptions remain independent.

**Q9. What makes a retained log replayable?**

Readers move offsets without deleting records. Retention policy, rather than one reader's acknowledgement, determines how long data remains available. Replay is possible only while the requested records remain retained.

**Q10. When would you choose a queue over a stream?**

For independent work items where completion removes responsibility and historical replay is unnecessary, a queue is a direct fit. A stream fits independent readers, retained history and partition order. I also name the cost of offset and partition management before choosing it.

**Q11. Are publisher confirms consumer acknowledgements?**

No, they protect opposite ends of delivery. A publisher confirm reports broker acceptance under the broker's persistence contract. A consumer acknowledgement tells the broker it may finish responsibility for that delivery.

**Q12. What happens when prefetch is too large?**

A worker holds many unacknowledged messages and can strand them when it becomes slow or crashes. Memory and redelivery work grow with the outstanding deliveries. Bound prefetch according to processing concurrency rather than treating it as unlimited throughput.

### Consumer groups, partitions and offsets

**Q13. Why are four members idle in a sixteen-member group over twelve partitions?**

A partition has one active owner within that group. Twelve partitions therefore supply at most twelve active partition owners. Additional members can provide replacement capacity but cannot divide a partition's ordered consumption.

**Q14. Can two groups read the same partition?**

Yes, each group has independent progress and ownership. Search and analytics can each read the entire score topic. Members within one group divide that group's partitions.

**Q15. What does a rebalance change?**

It transfers partition ownership after membership changes. The new owner starts from committed progress, so unfinished or uncommitted work can repeat. Consumer effects must tolerate that overlap and replay.

**Q16. What is the benefit of cooperative rebalancing?**

It transfers the partitions that need new owners while retained assignments continue. An eager rebalance revokes all assignments before redistribution. Neither protocol makes external business effects duplicate-safe by itself.

**Q17. Why use the match id as the partition key?**

It puts related score events in one log order. The consumer must preserve that order when applying effects too. Unrelated matches need no common order and can use different partitions.

**Q18. Why can more consumers fail to fix a hot key?**

One key still goes to one partition and one owner in the group. Heron's hot match produces 6 events per second against a 5-per-second processing limit. Its lag grows by 3,600 events per hour even when other owners have spare capacity.

**Q19. What does a committed offset of 8 mean?**

It means the next record to read is offset 8. Records before that point are covered by the consumer's completed-work contract. It does not mean record 8 itself has finished.

**Q20. Why not commit the highest completed offset?**

Completion can contain gaps when processing is parallel. With 7 and 9 done but 8 unfinished, committing 10 would skip unfinished work after restart. Commit the lowest unfinished offset, which is 8 in this trace.

### Acknowledgements and delivery semantics

**Q21. Why can a visibility timeout produce overlapping workers?**

Expiry makes the message available again but does not stop the original process. A 75-second job exceeds a 60-second lease and can overlap a second worker. Extend the lease while work continues and retain duplicate-safe effects because renewal can also fail.

**Q22. What is the loss window in at-most-once processing?**

Acknowledge before the effect, then crash before the effect commits. The broker considers the delivery complete and will not recover that missing work. The design trades possible loss for fewer repeated attempts.

**Q23. What is the duplicate window in at-least-once processing?**

Commit the effect, then lose the acknowledgement. The broker retries work whose effect already exists. That is why effect identity belongs in the consumer's durable state.

**Q24. Is checking an id before updating enough for idempotence?**

No, two consumers can both observe absence and proceed. A database uniqueness constraint must arbitrate the identity, and its insertion must commit with the business effect. A crash between separately committed operations would otherwise suppress missing work or repeat finished work.

**Q25. How long should deduplication records live?**

At least as long as an old identity can reappear through retention, retry, redrive or producer replay. A short expiration can turn a delayed duplicate into a new effect. If replay is unbounded, the design needs durable business uniqueness or a stated replay cutoff.

**Q26. How do you make an object-store transcode duplicate-safe?**

Use a stable job identity and deterministic output names or a conditional publication step. Prevent a stale attempt from replacing the result of a newer valid attempt. A database inbox alone does not atomically include object-store writes.

### Retries and dead-letter queues

**Q27. Which failures should not be retried immediately?**

Permanent input failures will repeat until the input or code changes. Dependency overload also needs delay, because immediate retries increase demand on the failing service. Classify the error and apply a bounded policy.

**Q28. Why add jitter to exponential backoff?**

Workers that fail together otherwise retry at the same scheduled times. Jitter spreads attempts over an interval and reduces synchronized load. The delay policy changes retry timing, while an attempt budget separately bounds total work.

**Q29. What ordering cost do retry topics introduce?**

Later records on the main topic can pass the failed record waiting elsewhere. That is acceptable only if the business permits those effects out of order. For a ledger, park the affected key or partition until its missing operation is resolved.

**Q30. What if a poison message crashes before the attempt counter updates?**

A counter stored only after processing never advances in that crash loop. Record the attempt durably before starting dangerous work or use a broker delivery counter with the required contract. Then the quarantine policy can eventually take effect.

**Q31. What makes a dead-letter queue operationally useful?**

It retains original identity, payload and diagnostic context under an owned inspection policy. Someone must repair the cause and control replay rate. Moving failures to an unmonitored queue only hides unfinished work.

**Q32. Why retain the original id on redrive?**

The first attempt may have committed some or all of its effect before failing. Keeping the identity lets the consumer recognize that outcome. A fresh id can turn repair into a second business operation.

### Exactly-once and backpressure

**Q33. Where does Kafka exactly-once stop?**

A Kafka transaction can join output records and consumed offsets within Kafka. An unrelated email provider or database commit is outside that transaction. External effects need their own atomic identity or a reconciliation protocol.

**Q34. Can a database join consumer progress with the effect?**

Yes, when both are written in the same database transaction. Restart then reads progress from that database. This protects the database effect but does not include unrelated remote actions.

**Q35. How much backlog does Heron's burst create?**

The burst brings 4,800 jobs over 120 seconds while the pool serves 800. The difference is 4,000 queued jobs. This calculation assumes fixed service time and full pool availability throughout the interval.

**Q36. Why does the burst take 100 minutes to recover?**

The pool completes 20/3 jobs per second while normal arrivals use 6. Only 2/3 job per second remains for recovery. Dividing 4,000 by that spare rate gives 6,000 seconds.

**Q37. Is oldest-message age the same as expected wait?**

No, age measures how long an existing record has waited. Backlog divided by processing rate estimates how much queued work is ahead of a new arrival under stated scheduling assumptions. Both need interpretation when jobs vary in cost or partitions are uneven.

**Q38. Where should backpressure act?**

Bound consumer work, publisher buffers and API admission. An edge rejection can prevent accepting work the system cannot finish within its promise. Slowing consumers alone may protect worker memory while broker storage continues growing.

**Q39. Why not autoscale solely on CPU?**

A worker waiting on a database can use little CPU while its queue ages. Use work or time lag, then respect partition and dependency limits. New workers also take time to become useful.

### Transactional outbox and the complete flow

**Q40. Why do both orders of a dual write fail?**

Database-first can leave a committed job without a message after a crash. Broker-first can leave a message for a job whose database transaction failed. Separate commits cannot make those outcomes atomic.

**Q41. What does the outbox commit atomically?**

It joins business state and publication intent in one local transaction. A relay later retries publication from committed rows. It can duplicate a send after an uncertain acknowledgement, so consumers retain stable identities.

**Q42. Walk me through the whole clip job.**

The API records the stable submit key, job and outbox, then answers with a job URL. The relay publishes a stable message, workers apply duplicate-safe effects, and the status store retains the result before acknowledgement completes delivery. At each uncertain boundary, recovery repeats the attempt without creating a second business outcome.

**Q43. What changes when a simple queue becomes a retained stream?**

Completion no longer deletes the record, and independent groups keep offsets. Partition keys define local order and cap parallel ownership. Replay, retention and progress management become explicit parts of the design.

@chapter exercises | Exercises | All workloads are illustrative. One dot is arithmetic, two require a trace or explanation, and three require a proof, derivation or implementation.

### Acceptance and topology

**E1** ● Heron receives 6 uploads per second and each inline transcode holds the request for 30 seconds. Find average requests in flight.

**E2** ● Repeat E1 when the API answers after a 0.15-second upload commit.

**E3** ● Find service rate and utilization for 200 workers, a 30-second service time and 6 arrivals per second.

**E4** ● A score topic receives 20 events per second. Find subscription deliveries per second after adding a fourth independent subscription.

**E5** ● Find payload bytes retained for 14 days of 20 events per second at 200 bytes per event. Exclude replication and indexes.

### Partition ownership and recovery

**E6** ● Distribute 12 partitions as evenly as possible over 8 consumers. Give each consumer's count.

**E7** ● A hot key now carries 40 percent of 20 events per second. Its owner processes 5 per second. Find key arrival rate and lag growth in one hour.

**E8** ●● Processing begins at offset 20. Offsets 20, 21, 23 and 24 have durable completed effects, but 22 is unfinished. Find the safe commit and name finished records that replay after a crash.

**E9** ● Compute four backoff delays from a 0.5-second base and factor 3, then sum them.

### Capacity and retry costs

**E10** ●● Change Heron's burst to 30 arrivals per second for 300 seconds. Keep the 200-worker pool and 6-per-second normal arrivals. Compute peak backlog and recovery time in seconds and minutes.

**E11** ●● Find workers needed to drain 4,000 jobs in 600 seconds while 6 new jobs arrive per second and each job takes 30 worker-seconds.

**E12** ● Find the time until service begins for a new job behind 7,000 queued jobs at the original pool's service rate. Assume FIFO and equal service times.

**E13** ● Find identity payload bytes for a 30-day dedupe table at 6 new jobs per second and 64 bytes per identity. Exclude database overhead.

**E14** ● At a probability of 1/1,000 for an acknowledgement loss after an effect, find expected duplicate deliveries per day. Do not round the expectation to an integer.

**E15** ●● A poison record takes three 30-second attempts and incurs backoffs of 1, 2 and 4 seconds. Find blocked time and expected arrivals behind it at 20/12 events per second.

**E16** ● Find a polling relay's batch ceiling with 50 rows every 250 milliseconds. State the maximum polling wait before first observation, ignoring processing time.

### Explain the boundaries

**E17** ●● Explain without equations why a 60-second lease fails a 75-second job. Describe a heartbeat fix and its remaining failure window.

**E18** ●● Explain at-least-once plus an idempotent database consumer without equations. Name which changes share a commit.

**E19** ●● Explain how increasing partition count can break per-key processing order even when the producer uses the same key.

**E20** ●● An input produces both a Kafka output record and a welcome email. Explain what the Kafka transaction covers and what the email needs.

### Proofs and implementation

**E21** ●●● Prove that committing the lowest unfinished offset cannot skip an unfinished record. State the recovery convention and the completed-prefix assumption.

**E22** ●●● Derive $T=B/(c/S-\lambda)$ for recovery with constant arrivals. Evaluate it for 4,000 jobs, 200 workers, 30-second service time and arrivals equal to 95 percent of service capacity.

**E23** ●●● Write a Python database consumer that inserts an identity under a SQL uniqueness constraint and commits it with an account increment. Acknowledge only after the transaction succeeds.

**E24** ●●● Design an order-preserving retry path for one ledger key. Show how unrelated keys continue and how the parked key resumes.

**E25** ●●● Size a new upload pool for 12 arrivals per second, 20-second jobs and target utilization of 80 percent. Then compute backlog during 60 arrivals per second for 60 seconds, recovery time under normal arrivals, and seven-day identity bytes at 64 bytes per job.

@chapter solutions | Worked solutions | Numeric answers are computed and asserted in queues-numbers.py. Fractions retain the exact rate; displayed decimals are rounded to six places when necessary.

**E1.** Little's law gives $L=\lambda W=6\times30=180$ open requests. This is an average under the assumed steady arrival rate and request lifetime.

**E2.** $6\times0.15=0.9$ open API requests on average. Slow jobs still occupy the worker tier after the API has responded.

**E3.** Service rate is $200/30=20/3=6.666667$ jobs per second after rounding. Utilization is $6/(20/3)=18/20=0.9$, or 90 percent.

**E4.** $20\times4=80$ subscription deliveries per second. Multiple workers within a subscription divide that subscription's deliveries rather than creating another copy.

**E5.** One day has 86,400 seconds, giving $20\times86400\times14=24{,}192{,}000$ events. Multiplying by 200 gives 4,838,400,000 payload bytes. Broker framing, indexes and replicas require separate accounting.

**E6.** Integer division gives one partition per consumer with a remainder of four. Four consumers receive one extra partition. The counts are 2, 2, 2, 2, 1, 1, 1, 1 and sum to 12.

**E7.** Arrival rate is $20\times0.4=8$ per second. Excess over the owner is $8-5=3$ per second. One hour adds $3\times3600=10{,}800$ events.

**E8.** The completed prefix ends before offset 22, so commit 22. Restart reads 22 and subsequent retained records. Finished records 23 and 24 replay, which requires duplicate-safe effects; neither can justify skipping unfinished 22.

**E9.** The delays are $0.5\times3^0=0.5$, $0.5\times3^1=1.5$, $0.5\times3^2=4.5$ and $0.5\times3^3=13.5$ seconds. Their sum is $0.5+1.5+4.5+13.5=20$ seconds. This exercise counts four delay intervals, independent of whether a policy labels the initial send an attempt.

**E10.** Arrivals are $30\times300=9{,}000$. Service is $(20/3)\times300=2{,}000$, so backlog is 7,000. Spare service after the burst is $20/3-6=2/3$ per second. Recovery takes $7000/(2/3)=10{,}500$ seconds, or $10500/60=175$ minutes.

**E11.** Clearing 4,000 in 600 seconds needs $4000/600=20/3$ spare completions per second. Add ongoing arrivals to obtain $20/3+6=38/3$ total completions per second. Multiplying by 30 worker-seconds per job gives 380 workers, assuming immediately available workers and no dependency ceiling.

**E12.** $7000/(20/3)=1{,}050$ seconds until service starts in the fluid FIFO model. This excludes the new job's own service time. Discrete completions and unequal job lengths can alter an individual observed wait.

**E13.** Daily jobs are $6\times86400=518{,}400$. Thirty days retain $518400\times30=15{,}552{,}000$ identities. At 64 bytes each, the payload is $15552000\times64=995{,}328{,}000$ bytes.

**E14.** $518400/1000=518.4$ expected duplicate deliveries per day. An expectation may be fractional although an actual day's delivery count is an integer. This does not imply duplicate effects when the consumer deduplicates correctly.

**E15.** Attempts consume $3\times30=90$ seconds and delays consume $1+2+4=7$ seconds. Total blocking is 97 seconds. Expected waiting arrivals are $(20/12)\times97=485/3=161.666667$ after rounding. The calculation deliberately includes all three stated delays.

**E16.** Polling wait is at most 0.25 seconds before the next poll under this ideal periodic schedule. The batch ceiling is $50/0.25=200$ rows per second. Publication latency and retries can lower achieved throughput.

**E17.** The lease expires while the first worker still runs, allowing another worker to receive the same job. A heartbeat extends visibility before expiry while the first worker remains healthy. Renewal loss still permits overlap, so heartbeat protection complements stable identity and conditional result publication.

**E18.** The broker redelivers whenever it cannot establish completion. The consumer inserts the message identity and performs its database change in the same transaction. A repeated identity conflicts with the committed record and leaves the previous effect unchanged; the consumer acknowledges only after that transaction succeeds.

**E19.** A hash-to-partition mapping depends on the partition count. Changing that count can send later records for the same key to a new partition while earlier records remain queued in the old one. Independent owners can then apply the later effect first, so migration needs a drain boundary or explicit version and sequencing protocol.

**E20.** Kafka can commit output records and input progress together, and readers using the appropriate isolation avoid aborted output. The email provider is outside that commit. Give the welcome operation a stable provider-supported identity if available, or retain and reconcile uncertain delivery under an explicit product policy. A local sent flag alone cannot atomically include the remote send.

**E21.** Let k be the lowest unfinished offset, with all effects before k durably complete. A restart at k reads k and every later retained record, so an unfinished offset cannot fall before the restart point. Completing an offset beyond k leaves k unchanged; completing k advances it only through the newly complete consecutive prefix. By induction, every committed position excludes only durably completed records. This assumes that completed state and the commit mechanism obey the stated durability boundary and that replay records remain retained.

**E22.** With c workers and S worker-seconds per job, the pool completes c/S jobs per second. New arrivals consume $\lambda$ of that rate, leaving $c/S-\lambda$ for backlog B. Clearing that backlog requires $B=T(c/S-\lambda)$, so $T=B/(c/S-\lambda)$ when the denominator is positive. At 95 percent utilization, arrivals are $0.95\times20/3=19/3$, leaving $1/3$ job per second. Thus $T=4000/(1/3)=12{,}000$ seconds. A zero or negative denominator means no finite recovery under these fixed rates.

**E23.** Give `inbox.message_id` a primary key and use one transaction for the insert and increment. The following assumes the same immutable identity always names the same payload and that the account exists. A production handler should validate both assumptions before treating a conflict as an identical repeat.

```sql
CREATE TABLE inbox (message_id text PRIMARY KEY);
```

```python
def consume(db, message, ack):
    with db.transaction():
        row = db.execute(
            "INSERT INTO inbox VALUES (%s) ON CONFLICT DO NOTHING RETURNING message_id",
            (message.id,),
        ).fetchone()
        if row:
            db.execute(
                "UPDATE accounts SET balance = balance + %s WHERE id = %s",
                (message.amount, message.account_id),
            )
    ack(message)
```

The transaction rolls back both operations if the update fails. A crash after commit but before acknowledgement causes a repeat that finds the existing identity and does not increment again. An external API call cannot replace this database update without a separate recovery design.

**E24.** Retain a per-key ordered buffer and a durable parked marker naming the earliest failed sequence. Later operations for that key enter the buffer but do not execute. Other keys proceed through independent scheduling. A retry uses the original identity; after its effect commits, advance the sequence and release the next buffered operation. If the record enters quarantine, keep the key parked until a documented correction or cancellation resolves its business meaning. Bound parked storage and propagate pressure when the bound is reached.

**E25.** Baseline work is $12\times20=240$ worker-seconds per second. At 80 percent utilization, workers are $240/0.8=300$, with capacity $300/20=15$ jobs per second. Burst arrivals are $60\times60=3{,}600$ and completions are $15\times60=900$, leaving 2,700 jobs. Spare capacity is $15-12=3$, so recovery takes $2700/3=900$ seconds. Seven-day identities number $12\times86400\times7=7{,}257{,}600$ and occupy $7257600\times64=464{,}486{,}400$ payload bytes. These totals exclude overhead and assume workers are ready before the burst.

### Primary sources

[RabbitMQ acknowledgements and publisher confirms](https://www.rabbitmq.com/docs/confirms) distinguish broker acceptance from completed consumption. [Kafka's delivery design](https://kafka.apache.org/41/design/design/) defines its transaction boundary. [SQS visibility timeouts](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) describe lease extension and redelivery. [The transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) joins publication intent to the local business commit.

This unit assumed a broker already able to retain accepted messages. The Apache Kafka unit opens that broker and follows its replicated log, retention and recovery mechanisms.

@part III | Consumer groups, partitions and offsets | A stream needs parallel readers without losing the order that some messages depend on. Partitions provide both, but only for messages that share a key, and only if progress is recorded carefully. We will divide a stream among a consumer group, choose keys, survive rebalances and commit offsets without skipping unfinished work. | where:3

## 10. Consumer groups divide a stream

The search indexer cannot keep up with one process. Heron wants four indexer processes to share the score stream, each handling a portion, while the gateway and analytics continue reading the whole stream for themselves. A **consumer group** is a named set of consumers that share one subscription's work. Each message goes to one member of the group, and each group as a whole sees every message.

This combines the two earlier ideas. Between groups the stream behaves like pub/sub: the search group, gateway group and analytics group each get everything. Within a group it behaves like a work queue: members divide the messages. Adding a fourth group, for example a fraud checker, costs no change to the other three.

Streams divide work by **partition**, an independently ordered sub-log of the topic. Heron's score topic has 12 partitions. The group coordinator assigns each partition to exactly one member. With 4 members, each owns 3 partitions. With 5 members, the split is 3, 3, 2, 2, 2. With 6 members, each owns 2. With 12, each owns 1. A 16th member, or anything past 12, gets nothing and sits idle.

@fig sd_q_groups | Twelve partitions assigned to groups of 4, 6 and 16 consumers. Past twelve members, extra consumers are idle because a partition has one owner per group.

That last rule is the most common capacity surprise. The partition count is the ceiling on parallelism within a group. If one indexer handles 5 events per second and the topic carries 100, you need at least 20 members and therefore at least 20 partitions. Choose the count for the peak you expect over the topic's life, because increasing it later changes which partition a key maps to (Section 13).

:::story Picture this
A newspaper delivery depot splits the town into 12 routes. Each route has one carrier at a time, so the houses on that route get papers in route order. Four carriers each take three routes. Hiring a sixteenth carrier does not help, because there are only twelve routes to hand out.
:::

## 11. Rebalancing and ownership changes

An indexer pod is evicted during a deploy. Its 3 partitions must move to surviving members, or those partitions stop being read. A **rebalance** is the group protocol that reassigns partitions when members join, leave or stop sending heartbeats. During it, affected partitions pause, and the old owner must stop processing before the new owner starts.

The danger is overlap. Suppose the old owner was halfway through message 1,042 when the coordinator decided it was dead. It may still be alive, merely stalled by a 20-second garbage collection pause. The new owner starts from the last committed position, say 1,040, and processes 1,040, 1,041 and 1,042. If the old owner then wakes up and finishes 1,042 too, the effect happens twice. Rebalances are therefore a normal source of duplicates, not a rare accident.

Older protocols used **eager rebalancing**: every member gives up every partition, then the group reassigns all of them, so one member leaving pauses the whole group. **Cooperative rebalancing**, added to Kafka in version 2.4, moves only the partitions that must move, so the other members keep working. Static membership lets a restarting pod reclaim its old partitions without a rebalance at all if it returns within a timeout.

@fig sd_q_rebalance | A member leaves. Eager rebalancing pauses all twelve partitions; cooperative rebalancing pauses only the three that move.

Two rules keep rebalances safe. Commit progress before giving up a partition, in the revocation callback the client library provides. And make processing idempotent, because no protocol can guarantee that a paused process will not finish its last message after losing ownership. Section 19 builds that idempotence.

:::warn Watch out
A consumer that takes longer than the maximum poll interval between polls looks dead to the coordinator even though it is working. A 30-second transcode with a 10-second limit causes a rebalance on every message, and every message is redone. Either raise the limit above the worst-case processing time or hand slow work to a separate pool and keep the poll loop fast.
:::

@fig sd_q_fencing | The new generation owns the partition after transfer. Orange marks rejection of a stale commit; an external database needs its own protection against a stale writer.

## 12. Partitions give order and parallelism together

The live gateway shows the score of match 7. Events arrive as "1-0", then "2-0". If two consumers process them in parallel and "1-0" finishes last, viewers see the score go backwards. Some messages need order. Most do not need it globally, only among related messages: events for one match, entries for one bank account, edits to one document.

A partition is the tool that gives exactly that. Within one partition the log has a total order, and one group member reads it sequentially, so effects can follow that order. Across partitions there is no order at all. A producer chooses the partition by hashing the message's **partition key**, so every event with key `match-7` lands in the same partition and stays in order relative to the others.

With 12 partitions and keys hashed uniformly, each partition receives on average $20/12\approx1.67$ of Heron's 20 events per second. Match 7 and match 19 might share a partition; that is fine, because nobody needs them ordered relative to each other, and both still stay in their own internal order.

@fig sd_q_partition_key | Keys hash to partitions. Every match-7 event lands in partition 4 and is read in order; match 7 and match 12 have no order relative to each other.

The guarantee has conditions. The producer must not reorder its own sends: a producer that retries a failed batch while a later batch succeeds can write "2-0" before "1-0" unless it uses idempotent, in-order sending (Kafka's `enable.idempotence`, on by default since 3.0). The consumer must process a partition's messages sequentially, or at least apply them in order. A consumer that hands each message to a thread pool throws the order away again.

:::note Total order is expensive
A topic with one partition has a total order and a parallelism of one. Systems that need a global order, such as a ledger of every trade, either accept that throughput ceiling or use a sequencer that stamps a global position. Most designs find that per-key order is what the business actually needs.
:::

## 13. Choosing a key, and the hot key problem

The key decides two things at once: which messages stay ordered, and how evenly load spreads. Those goals pull in opposite directions. A coarse key such as `tournament` keeps a lot in order but piles everything on one partition. A fine key such as `event_id` spreads perfectly but orders nothing.

Choose the narrowest key that still covers every ordering requirement. Heron's gateway needs order per match, so the key is `match_id`. Nothing needs order across matches, so nothing coarser is justified.

Now suppose the final has 30% of all traffic. Its partition receives $20\times0.3=6$ events per second, while each of the other 11 receives $(20-6)/11\approx1.27$. If one consumer processes 5 events per second for a partition, the final's partition falls behind by 1 event every second, or 3,600 an hour, while the other partitions idle at a quarter of capacity. Adding consumers does not help, because that partition still has one owner.

@fig sd_q_hot_key | One match carries 30% of the score events. Its partition needs 6 per second against a consumer limit of 5, so lag grows by 3,600 events an hour while the other partitions are nearly idle.

The fixes trade order for spread. Make the per-message work cheaper for that key. Split the key with a suffix, `match-7#0` to `match-7#3`, and merge the four ordered sub-streams downstream using a sequence number in the payload. Or route the hot key to a dedicated topic with more powerful consumers. Changing the partition count is a last resort: adding partitions changes `hash(key) mod n`, so match 7's future events land in a different partition from its past events, and a reader can process the new "2-1" before the old "2-0" is drained.

:::interview Interview lens
**"How do you pick a partition key?"** I start from the ordering requirement and choose the narrowest key that covers it, usually the aggregate id such as order or account. Then I check skew: the hottest key's rate must fit one consumer's throughput. If one key can exceed that, I either make its processing cheaper or split it with a sub-key and restore order downstream with a sequence number. I size the partition count for future peak so I do not have to repartition and break key placement.
:::

## 14. Offsets and committed progress

A stream does not delete what a reader has processed, so the reader must remember how far it got. An **offset** is a message's position within its partition: 0, 1, 2 and so on. A consumer group records a **committed offset** per partition, conventionally the offset of the *next* message to read. After a crash or rebalance, the new owner resumes from the committed offset.

The order of "process" and "commit" decides what a crash does. Commit first, then process: a crash after the commit skips the message forever. Process first, then commit: a crash after processing but before the commit makes the next owner process it again. There is no third order that avoids both outcomes without coordination. Part IV names these at-most-once and at-least-once.

Committing on every message is safe but slow, because each commit is a write to the broker. Committing every few seconds or every few hundred messages is common, and it widens the window of duplicates after a crash. If a consumer commits every 1,000 messages and crashes after processing 999 since the last commit, the next owner reprocesses up to 999 messages. The commit interval is a direct trade between broker load and duplicate volume.

@fig sd_q_offsets | Offsets in one partition. The committed offset points at the next message to read, so a crash replays everything between the commit and the crash.

Kafka stores group offsets in an internal topic, `__consumer_offsets`. Kinesis consumers usually store checkpoints in DynamoDB through the client library. Some designs store the offset in their own database, in the same transaction as the effect, which removes the window entirely for that database. Section 24 returns to that idea.

:::warn Watch out
Auto-commit on a timer commits whatever the consumer has *fetched*, not what it has finished. If processing happens on another thread and the timer fires before the work completes, a crash loses those messages. Commit explicitly after the effect, or confirm your client commits only processed positions.
:::

## 15. Out-of-order completion inside a partition

The indexer wants to process one partition with 4 threads for speed, giving up strict order because indexing is idempotent per document. Messages 7, 8 and 9 start together. Message 7 and 9 finish; message 8 is still running. What offset can the consumer commit?

Not 10. Committing 10 says "everything before 10 is done", and if the process crashes now, message 8 is never processed. The only safe committed offset is the lowest unfinished one: 8. After a crash, the new owner reads 8, which is correct, and also 9, which is a duplicate. With completions {7, 9} starting from 7, the scan finds 7 done, 8 not done, and stops: commit 8, replaying [9] after a crash.

@fig sd_q_gap | Parallel completion inside one partition. The commit can only advance to the first gap, so finished message 9 is replayed after a crash.

This contiguous-progress rule is how every parallel stream consumer works, from Confluent's parallel consumer to a hand-written one. It has a cost: one slow message holds back the commit for everything after it. If message 8 takes 10 minutes, the committed offset stays at 8 for 10 minutes, and a crash replays everything completed during that time. A bound on in-flight messages per partition caps the replay.

Queues avoid this bookkeeping because each message is acknowledged individually: acknowledging 9 does not imply anything about 8. That is a real advantage of per-message acknowledgement for independent jobs, and one reason Heron's transcodes use a queue while its score events use a stream.

:::key In one breath
A consumer group shares a stream's work by giving each partition to exactly one member, so the partition count caps the group's parallelism. Partitions keep per-key order, so choose the narrowest key that covers the ordering need, and watch the hottest key's rate against one consumer's throughput. Offsets record progress per partition; processing before committing replays work after a crash, and parallel processing can only commit up to the first unfinished message. Rebalances and pauses make duplicates normal.
:::

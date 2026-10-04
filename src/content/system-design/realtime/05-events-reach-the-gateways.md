@part V | Pub/sub to WebSocket gateways | We transfer committed changes to the machines holding viewers. A channel to clients is useless if the producer cannot find its subscribers. We will build pub/sub routing, ownership registries, partition order, and subscription races. | where:5

## 17. The producer should not open a socket to every viewer

A score service emits one authoritative event. It should not loop over fifty thousand client sockets itself. The event stream carries the change to interested gateway processes, and each gateway fans it out to its locally connected viewers. This separates durable scoring from delivery ownership.

**Publish/subscribe**, or pub/sub, distributes messages from publishers to consumers registered for a topic or selection. A **topic** names a logical event channel. Its durability, replay, ordering, and acknowledgement rules depend on the actual system. Do not treat ephemeral pub/sub and a retained event log as interchangeable guarantees.

@fig sd_realtime_pubsub | Illustrative producer-to-gateway path. The final local fan-out is counted separately from upstream publication.

With all five gateways interested in one broadcast match, twenty events each second create one hundred gateway deliveries per second. At 200 payload bytes, that is 20,000 payload bytes per second in the broker-to-gateway leg. The gateway-to-viewer leg carries 200,000,000 payload bytes per second. Keep those boundaries separate so a cheap broker path does not hide expensive final delivery.

:::story Picture this
An announcer sends one instruction to each stand's speaker operator. Each operator repeats it to listeners in that stand. Sending five instructions upstream is different from serving fifty thousand listeners downstream. Both paths need counting, but they have different bottlenecks.
:::

## 18. A gateway subscribes only where it has listeners

Heron has many matches, but a gateway may hold viewers for only a few. Sending every match event to every gateway wastes bytes and CPU. Maintain local membership from match ID to interested connections, and register internal topic interest when the first local viewer arrives. Remove it after the last viewer leaves, under a race-safe reference or ownership rule.

A **subscription registry** records where a topic has interested gateway instances. It can be distributed or implicit in broker membership. Ephemeral instance identities and expiration prevent a dead gateway from remaining a target forever. The registry is routing assistance; the durable stream cursor supplies recovery if a registration race misses a notification.

@fig sd_realtime_interests | Illustrative topic-interest matrix. Logical match membership determines broker delivery scope.

The first-local-viewer transition and last-local-viewer removal can race. An old removal should not unsubscribe a newly established interest. Use a generation, serialized local membership transition, or another atomic registry rule. Even with that coordination, durable cursor recovery remains necessary because cross-machine notification delivery can fail independently.

A celebrity match can still involve every gateway. Splitting viewers across gateways spreads connection ownership but does not eliminate a shared topic's event replication or final bandwidth. Route new viewers using surviving capacity, and monitor subscriber count and outbound queue age by topic. A topic can become hot despite a balanced count of connections.

## 19. Partitioning must preserve the needed order

A consumer sees match version 103 before version 102 if related events use unrelated ordered streams. **Partitioning** assigns events to separately ordered processing groups. Routing all changes for one match to the same ordered partition can preserve match-local order while different matches proceed independently.

A consumer group that assigns each partition to one worker is useful for dividing processing work. It is not automatically the correct broadcast mechanism to every gateway with interested viewers. If one gateway alone consumes a match's events, it must route them onward to all current interested gateway owners, or the broker subscription design must provide each target its required copy.

@fig sd_realtime_partition_order | Illustrative separation of ordered processing ownership from broadcast delivery membership.

This is an interview trap. Adding all gateways to one consumer group can distribute events among them rather than broadcast every event to every relevant client. Draw the routing after consumption and state whether the stream is retained. Order within a partition does not establish order across partitions or across reconnects.

:::note Shared broadcasts and private channels
A public score topic can distribute one payload to many viewers. A private message may require per-user routing and individual authorization. The same gateway infrastructure can host both, but their fan-out sizes, retention, and permission rules differ.
:::

## 20. Close the subscribe-and-snapshot race

The client requests current score version 101. Version 102 occurs before its subscription becomes active. If the client then waits for only future events, its screen can remain stuck until another score change. A **subscription race** is a gap between reading state and registering for updates.

One solution uses a versioned snapshot and durable replay. Register interest and establish a cursor, fetch a snapshot carrying version $v$, then apply retained events with versions greater than $v$. The exact order can vary if the stream and source APIs give a compatible cursor relationship. The invariant is that every change after the snapshot's version is either delivered or recoverable.

@fig sd_realtime_race | Illustrative race-closing pattern. The snapshot version and log order refer to the same match state sequence.

Buffering events during snapshot fetch needs a limit. If it overflows, restart from a newer snapshot rather than silently dropping deltas. A source snapshot unrelated to the event stream's order does not close the race merely because both have timestamps. Define a shared version relationship or another consistent capture protocol.

:::warn Watch out
Do not use an ephemeral notification as the only evidence of a state change. Registration and disconnection races can lose it. A durable event history or authoritative snapshot must repair the resulting gap.
:::

:::interview Interview lens
**"How do Kafka consumer groups fit a realtime broadcast?"** A consumer group divides partition processing among members, so it does not by itself copy each event to every gateway. I would add routing from the assigned processor to the gateways holding interested viewers, or use a broker subscription shape providing those copies. Match-key partitioning preserves the needed local order. Durable positions support reconnect and subscription-race recovery.
:::

:::key In one breath
The score producer publishes an authoritative change independently of client sockets. Pub/sub routes it toward interested gateway owners, which perform local fan-out. Partition order and broadcast membership are different responsibilities. A versioned snapshot plus replay closes subscription gaps that notifications alone cannot repair.
:::

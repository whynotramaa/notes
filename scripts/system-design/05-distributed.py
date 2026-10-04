from author import publish
raw=r'''
@part Partitions and promises | We split a network while leaving processes alive. The system now has incomplete knowledge of the other side. We will make CAP's choices precise instead of treating it as a product label.

## Partition tolerance and CAP

Heron's replicas cannot exchange messages, yet both receive requests. A **network partition** prevents some processes from communicating while they may still run. **Partition tolerance** means the model allows that failure; it is not an optional switch that removes unreliable networks. A timeout also cannot distinguish a dead process from a delayed one.

The **CAP theorem**, formalized by Gilbert and Lynch, says a partitioned asynchronous read/write system cannot guarantee both linearizable consistency and availability for every request at a non-failing node. CAP availability is an eventual response for each such operation, not an uptime percentage. Returning an error for a request that must succeed does not satisfy that definition.

@draw cap | split | BOTH SIDES ARE ALIVE BUT CANNOT COMMUNICATE | [["side A","old state + requests\nno messages across"],["side B","old state + requests\nno messages across"]] | Illustrative partition. | lack of a reply is not proof of death

## Consistency versus availability

If either side accepts a conflicting booking independently, the global 'one owner' invariant may break. A consistency-preserving design can refuse operations on the side that cannot establish authority. An availability-oriented design can accept local changes but must explain conflicts and repair. Different operations in one product can choose different behavior.

Score writes can require authority while cached score reads return explicitly stale state. That is a per-operation contract, not a claim that the whole system has one CAP letter. Outside the partition case, latency and coordination still matter. CAP alone does not rank ordinary-day performance.

@draw choice | rows | CHOOSE BEHAVIOR FOR EACH OPERATION | [["score write","authority required","may reject"],["cached read","stale allowed","may answer"]] | Illustrative operation-level policy. | one product can have different contracts

:::key In one breath
Partitions create missing knowledge between living processes. CAP limits simultaneous linearizable consistency and per-operation availability under that model. State the behavior of each operation during a partition. Uptime percentages and HTTP success codes are different concepts.
:::

@part Observable histories | We describe consistency using what a reader can observe. A vague promise hides the failure that violates it. We will distinguish real-time order, causal order, and session guarantees.

## Strong, eventual, and causal consistency

A completed score write should be visible to a later read when Heron promises **linearizability**, a single operation order consistent with real-time completion. 'Strong consistency' is used loosely; name the intended property. **Eventual consistency** instead allows temporary disagreement with convergence under stated conditions.

**Causal consistency** preserves cause-and-effect order. A reply that depends on a posted message must not become visible without its cause, though unrelated concurrent writes may appear in different orders. Track dependencies or appropriate version metadata. Physical wall clocks alone do not prove causality, especially when machines disagree about time.

@draw history | sequence | A LATER READ FOLLOWS A COMPLETED WRITE | {"actors":["writer","store","reader"],"steps":[[0,1,"write version v"],[1,0,"complete"],[2,1,"later read"],[1,2,"v or a later version"]]} | Illustrative linearizable history without a concurrent overwrite. | say the observable guarantee

## Read-your-writes and monotonic reads

A scorer saves a correction and refreshes onto another replica. **Read-your-writes** means that session can observe its own completed writes. **Monotonic reads** means later reads in a session do not move backward to older state. These session guarantees can exist without a globally linearizable history.

Heron can carry a required commit position with the session. A replica waits until it reaches that position or routes the read elsewhere. Sticky routing helps only while the selected replica remains suitable; failover can invalidate its freshness. A replica position must refer to comparable history, not an arbitrary wall-clock timestamp.

@draw session | rows | A SESSION CARRIES A MINIMUM VISIBLE POSITION | [["required","position 8","position 8"],["replica","position 7","position 9"],["decision","wait or route","serve"]] | Illustrative log positions. | routing alone is not a freshness proof

:::story Picture this
A clerk stamps a receipt after recording your change. Another clerk can serve you only after seeing at least that receipt's ledger position. Sitting at the same desk yesterday does not prove today's clerk has the new page.
:::

:::key In one breath
Consistency describes permitted observation histories. Linearizability respects real-time completed operations; causal consistency respects dependencies. Read-your-writes and monotonic reads constrain one session. Use comparable version positions to enforce a promise across replicas.
:::

@part Replica architectures | We decide who may accept a write. Multiple copies do not answer that ownership question. We will compare leader, multi-leader, and leaderless replication.

## Leader/follower and multi-leader

One leader orders Heron's score writes and followers copy its history. This makes a local ordering point clear, but the leader can fail and followers can lag. **Failover** changes which process owns writes. Promoting an asynchronous follower may discard recently acknowledged history unless the recovery contract prevents it.

**Multi-leader replication** lets several leaders accept writes and exchange them. It can serve local writes during disconnection but introduces conflicts when two leaders change the same fact. Conflict resolution must match business meaning: choosing the larger timestamp does not preserve a unique seat or conserved balance. IDs and causal metadata help identify concurrent changes; they do not invent a safe merge.

@draw leaders | split | WHERE WRITES ENTER THE HISTORY | [["single leader","one ordering point\nfollowers may lag"],["multi-leader","several ordering points\nconflicts need semantics"]] | Illustrative replication architectures. | conflict resolution is a data rule

## Leaderless replicas and quorum

A **leaderless** design sends operations to several replica owners and reconciles versions. For fixed $N=3$, write count $W=2$, and read count $R=2$, any completed sets overlap by at least one member. **Quorum** means a configured set or count participates in a protocol, not automatically that each member stores the latest value.

Read repair, background anti-entropy, and version reconciliation can help convergence. Sloppy quorums that substitute other owners change the fixed-set intersection argument. Incomplete writes and concurrent versions still need rules. The inequality $R+W>N$ is set arithmetic; linearizability requires additional protocol behavior.

@draw overlap | matrix | FIXED MEMBERSHIP IS PART OF THE PROOF | {"rows":["write W=2","read R=2"],"cols":["A","B","C"],"values":[["yes","yes","no"],["no","yes","yes"]]} | Illustrative quorums with one overlapping member. | do not apply this proof to substituted owners

:::warn Watch out
'Last write wins' requires an ordering rule, and clock skew can make that rule differ from real-time order. It may discard a valid concurrent change even when every replica converges.
:::

:::key In one breath
A leader creates an ordering point. Multi-leader writes need conflict semantics, and leaderless writes need version reconciliation. Replica lag and failover affect acknowledged-history survival. Quorum intersection is a useful fact within a complete protocol, not a substitute for one.
:::

@part Detection and ownership | We decide when another worker may take over. A process that seems dead can later resume. We will distinguish heartbeats, leases, election, and fencing.

## Heartbeats and failure detection

A coordinator misses a worker's **heartbeat**, a periodic message indicating recent contact. A **failure detector** interprets missing contact as suspicion under timeout rules. Long pauses, congestion, and scheduler stalls can look like failure. A shorter timeout detects trouble sooner but increases false suspicions.

Heron may elect another publisher while the old one is paused. A **leader election** protocol must ensure suitable exclusive authority despite that overlap. Mere belief that the old worker died is insufficient. Record a new authority epoch and make the protected resource reject actions from stale epochs.

@draw suspect | sequence | THE OLD WORKER CAN RESUME AFTER TAKEOVER | {"actors":["worker A","coordinator","worker B"],"steps":[[0,1,"heartbeat"],[1,2,"A silent: assign B"],[2,1,"B owns new epoch"],[0,1,"A resumes with old epoch"]]} | Illustrative pause mistaken for a crash. | takeover needs a resource-side check

## Distributed locks, leases, and fencing

A **distributed lock** coordinates access among processes. A **lease** grants time-limited ownership that must be renewed. A paused holder can exceed its lease and later continue, so possession of an old lock token cannot safely authorize a write by itself.

A **fencing token** is a monotonically increasing authority value that the protected resource checks. If B owns token 8 after A's token 7 expires, storage rejects A's later write with 7. The storage check must be atomic with the protected effect. The lease also needs bounded clock or timing assumptions; document them instead of calling TTL a correctness proof.

@draw fence | rows | THE RESOURCE REJECTS AN OLD OWNER | [["owner A","token 7","expired"],["owner B","token 8","accepted"],["A resumes","token 7","rejected"]] | Illustrative tokens ordered by authority, not wall-clock time. | the lock service cannot stop a paused process

:::key In one breath
Heartbeats establish recent contact and timeouts create suspicion. Election changes authority, but paused owners can resume. Leases bound permission in time under explicit assumptions. Fencing makes the protected resource reject stale owners.
:::

@part Consensus | We agree on an ordered history despite some failures. Independent votes without protocol rules can elect conflicting histories. We will build Raft's main safety argument and identify its service boundary.

## Why consensus exists

Replicas must agree which score command occupies the next committed log position. **Consensus** makes participating processes agree on a decision under a defined failure model. It supports replicated state machines, where replicas apply the same committed commands in order. It does not make every external action execute exactly once.

In an asynchronous system with possible crash failure, deterministic consensus cannot guarantee termination under every possible message schedule, as the FLP result shows. Practical protocols preserve safety while using timing assumptions for progress. They often stop making progress without a suitable quorum rather than commit competing histories.

@draw consensus | flow | AGREED HISTORY DRIVES REPLICA STATE | ["command","agreement protocol","committed log","same state changes"] | Conceptual replicated state-machine path. | agreement is scoped to the protocol's history

## Raft terms, logs, and commitment

**Raft** separates leader election, log replication, and safety rules. A candidate seeks votes for a new **term**, an authority epoch; a voter considers log freshness, not just arrival order. The leader appends commands and replicates entries. Followers check prior log position and term before accepting continuation.

A leader directly commits an entry from its current term after replication to a majority; preceding entries become committed with it. Merely counting copies of an old-term entry is insufficient for that direct rule. With three voters, a majority is two; loss of one can permit progress, but loss of two cannot. Log safety still depends on the election and append rules working together.

@draw raft | matrix | CURRENT-TERM ENTRY REACHES A MAJORITY | {"rows":["leader","follower B","follower C"],"cols":["entry x","current term"],"values":[["yes","yes"],["yes","yes"],["no","yes"]]} | Illustrative three-voter cluster; majority is two. | votes and log freshness protect the history

:::interview Interview lens
**"Why not just let any surviving replica become leader?"** It may lack a committed entry, and the old leader may still be alive. A protocol must choose a sufficiently current history and prevent competing authority. Raft combines voting, terms, and log checks to preserve that safety.
:::

:::key In one breath
Consensus agrees on a decision history under a failure model. Practical protocols separate safety from timing-dependent progress. Raft combines terms, voting, log checks, and majority commitment. A quorum service should refuse progress when it cannot preserve the committed history.
:::

@part Coordination services | We use agreement where small shared decisions need it. Sending every large payload through coordination would waste its capacity. We will explain ZooKeeper, etcd, and safe configuration changes.

## ZooKeeper and etcd purpose

Heron needs a small shared record of ownership, service membership, and configuration versions. **ZooKeeper** and **etcd** offer coordinated metadata stores with their own API and consistency contracts. etcd uses Raft; ZooKeeper's ordered broadcast uses Zab. They are not general-purpose queues for every score payload.

Use them for bounded metadata, election recipes, leases or sessions, and version-checked changes. A watch informs a client of changes but may require reconnecting and rereading state after interruptions. Watch delivery is not a substitute for verifying the state and authority at the resource you are changing.

@draw coord | fan | SMALL SHARED DECISIONS, NOT EVERY PAYLOAD | {"source":"coordination store","targets":["ownership epoch","configuration version","service membership"]} | Illustrative coordination records. | payload work belongs on another path

## Split brain and configuration changes

**Split brain** occurs when competing actors both believe they own a role. Network isolation plus an unfenced takeover is a common route. Repairing data afterward may be impossible when both sides performed irreversible external effects. Prevention needs authority enforced at the write boundary.

Changing the voter set also changes quorum intersections. Consensus membership updates need the protocol's supported transition, such as overlapping configurations, rather than replacing addresses independently. Keep the control-plane decision distinct from data-plane routing caches. An old client configuration can survive the new decision.

@draw split | split | TWO BELIEFS MUST NOT BECOME TWO VALID OWNERS | [["old owner","cached membership\nstale authority"],["new owner","new membership\nvalid authority"]] | Illustrative split-brain risk; fencing rejects the stale owner. | a configuration update is another coordinated change

:::key In one breath
Coordination services hold small shared decisions. Watches help discover changes, while verified state and fencing enforce them. Split brain is competing ownership, not merely stale reads. Membership changes must preserve the protocol's quorum safety.
:::

@part The complete distributed write | We join authority, commit, reads, and recovery. A durable copy alone does not describe the user's guarantee. We will trace Heron's write and count the failure boundary.

## End-to-end committed state

The scorer submits a stable command key. The current leader validates it, appends a log command, and waits for the configured commitment rule. Replicas apply committed commands in order, including the score and deduplication record. The reply names a position suitable for the session's later read fence.

A lost reply leaves uncertainty and triggers a keyed retry. A lost leader triggers an election using log safety rules. A stale follower waits or redirects a read requiring the returned position. External event delivery still needs an outbox or equivalent intent record and an idempotent receiver; consensus over database commands does not extend automatically to a broker or payment provider.

@draw full | sequence | AUTHORITY, COMMIT, AND OBSERVATION ARE SEPARATE | {"actors":["scorer","leader","follower"],"steps":[[0,1,"command + key"],[1,2,"replicate entry"],[2,1,"acknowledge"],[1,0,"commit position"],[0,2,"read at least position"]]} | Illustrative write and session read fence. | a read chooses a suitable history

## Count copies, data loss, and available authority

For an illustrative asynchronous event replica, 20 events per second at 200 bytes with a 5 s gap mean 100 events, or 20,000 bytes, have not reached that copy. This is a loss-exposure calculation, not a guarantee that every failover loses them. A durable leader or another current replica may recover the history.

For the illustrative three-voter consensus group, a majority of two can progress after one voter is unavailable. That count assumes independent failures and an intact communication path between the survivors. This chapter does not provide a proof of every consensus implementation; its goal is to make the protocol and resource authority visible in your design.

@draw loss | bars | ILLUSTRATIVE ASYNCHRONOUS REPLICA EXPOSURE | [["gap",5,"s"],["unreplicated events",100,"events"],["payload",20000,"B"]] | Computed for the stated constant rate, size, and lag. | lag is an exposure, not an automatic loss

:::key In one breath
A complete distributed write names authority, commitment, replica application, and read visibility. Lost replies require stable operation identity. Failover preserves history only under the chosen protocol and durability policy. External effects remain separate recovery boundaries.
:::
'''
qa=[('What does CAP availability mean?','Every operation at a non-failing node eventually receives the required response. It is not an uptime percentage.'),('Is partition tolerance optional?','The failure model permits missing communication. A product label cannot make the network incapable of that failure.'),('Can different operations make different choices?','Yes. A write may require authority while a read returns explicitly stale data.'),('What is linearizability?','Operations fit one order that respects real-time completion. Name it instead of relying on an ambiguous strong-consistency label.'),('What does causal consistency preserve?','Cause-and-effect dependencies. Concurrent unrelated writes need not share one total order.'),('Read-your-writes or monotonic reads?','The first preserves observation of your own changes; the second prevents your session reading backward. Neither alone gives global linearizability.'),('What changes with multi-leader replication?','Several writers create potentially conflicting histories. The application needs safe merge semantics or conflict rejection.'),('What does quorum intersection omit?','Version selection, concurrent and incomplete writes, substituted owners, and acknowledgement durability. Those determine the complete consistency protocol.'),('What does a heartbeat prove?','Recent contact. A missed heartbeat is suspicion, not proof that the process stopped.'),('Why is a lease insufficient alone?','An expired holder can resume and act. The protected resource must reject stale authority.'),('What is fencing?','An atomic resource-side check rejects older ownership tokens. Tokens order authority changes, not elapsed time.'),('Why does consensus stop without a majority?','The protocol preserves a single committed history. Progress without a suitable quorum could violate safety.'),('What is the old-term Raft commitment trap?','A leader cannot directly commit an old-term entry merely by counting its copies. Committing a current-term entry safely commits preceding history.'),('What belong in etcd or ZooKeeper?','Small coordinated metadata and ownership decisions. High-volume payloads belong on a separate path.'),('How do you prevent split brain?','Establish suitable exclusive authority and enforce it at the effect boundary. Belief or routing alone cannot fence a resumed owner.'),('Does consensus make a remote email exactly once?','No. It orders its own commands. External effects need separate durable intent, identity, and reconciliation.')]
ex=[('●','Compute fixed quorum overlap.','2+2-3=1 member in the overlap lower bound.'),('●','Compute event exposure during the specified lag.','20 events/s times 5 s gives 100 events; multiplying by 200 bytes gives 20,000 bytes.'),('●','Count voters needed after one failure.','Three voters require floor(3/2)+1=2. One failure leaves two; two failures leave one and cannot reach that majority.'),('●●','Trace a session read from a lagging follower.','Carry the required commit position. Wait until the follower applies it or route to a suitable source; do not return an older value under a read-your-writes promise.'),('●●','Show why a paused worker needs fencing.','A loses contact, B receives a newer token, then A resumes. Storage compares tokens and rejects A before the protected write.'),('●●','Compare a stale score read and a booking write during partition.','A stale read can explicitly use an older copy. A unique booking write needs authority or must reject rather than allow conflicting owners.'),('●●●','Prove the set-overlap lower bound.','The union has at most N members, so |read intersection write|=R+W-|union| is at least R+W-N. This is set arithmetic, not a linearizability proof.'),('●●●','Trace a committed write whose leader fails before replying.','The new suitable leader retains committed history. The client retries the same key and retrieves the recorded result; an external effect still uses its own deduplication boundary.')]
publish(5,'distributed-systems','Copies, clocks, and agreement',['Copies, Clocks,','and Agreement'],'CAP, observable consistency, replication, quorums, failover, locks, leases, fencing, Raft, and coordination through explicit failure histories.','State exactly what a reader can observe and what keeps an old owner from writing after takeover.',raw,qa,ex,[('Gilbert and Lynch','https://dl.acm.org/doi/10.1145/564585.564601','The formal CAP result.'),('Raft paper','https://raft.github.io/raft.pdf','Election, log replication, and commitment safety.'),('FLP paper','https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf','Deterministic consensus and asynchronous progress.'),('etcd guarantees','https://etcd.io/docs/v3.6/learning/api_guarantees/','Operation consistency and durability contract.'),('ZooKeeper overview','https://zookeeper.apache.org/doc/current/zookeeperOver.html','Coordinated metadata and service model.'),('Dynamo paper','https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf','Version reconciliation and quorum behavior.')])

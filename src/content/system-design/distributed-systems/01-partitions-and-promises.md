@part I | CAP theorem and network partitions | We separate processes from the messages connecting them. An unanswered request leaves more possibilities than a dead server. We will derive the partition tradeoff from a score write and a later read. | where:1

## 1. A network can fail between living machines

A scorer submits a corrected score to Heron, and the browser keeps spinning. The database might have crashed, the reply might have been lost, or the database might still be handling the request. The screen looks the same in each case. The client knows its own observation, not the server's internal state.

A **network partition** prevents some participants from communicating with others while the participants themselves may remain alive. The failure can affect a direction, a connection, or a set of machines. Saying that a region is unavailable can hide a more awkward situation: its local clients still reach it, but it cannot reach the other replicas.

Let Heron's replicas be A, B, and C, initially holding score 10 at version 7. A loses contact with B and C. A still receives scorer requests; B and C still receive viewer requests. Counting working machines gives 3. Counting machines A can coordinate with gives 1, so replica count alone says nothing about available write authority.

The repair begins with an operation contract. We can allow A to show an old score with its version, but we cannot claim that it has established a fresh global decision. We can route an authoritative write to the communicating side if routing succeeds. If it does not, rejection preserves the contract better than inventing success.

**Partition tolerance** means the failure model includes missing communication and the system has specified behavior under it. It is not a feature that makes missing messages harmless. Even after communication returns, accepted histories may disagree. We will inspect both the behavior during the interruption and the work needed to reconcile it afterward.

@fig sd_ds_trace_1 | The trace splits three live nodes into an isolated A and connected B plus C; orange marks the operation that must choose authority or an explicitly old copy.

:::story Picture this
Two clerks have copies of one scorebook, but the phone line between them fails. Each can answer local visitors. A clerk cannot know that the other accepted a correction merely by continuing to work.
:::

## 2. CAP begins with an impossible read

Suppose A acknowledges score 11 while isolated from B. After that acknowledgement finishes, a viewer asks B for the current score. B has received no new message from A. If B must answer the read, it cannot tell whether the completed write set the score to 11 or whether no write occurred.

**Linearizability** means operations can be placed in one order that agrees with real-time completion: a read begun after a completed write must reflect that write or a later one. **CAP availability** means each operation submitted to a non-failing node eventually receives the required operation result. An error that declines the operation is not that promised result.

These requirements collide in this history. Answering 10 violates the completed write's visibility. Guessing 11 fails in an otherwise identical history with no correction. Waiting for an unavailable message avoids a false answer but cannot guarantee completion under a lasting partition. The contradiction does not depend on how many replicas we purchase.

The **CAP theorem** states this limit for the asynchronous read/write model with partitions. [Gilbert and Lynch's proof](https://dl.acm.org/doi/10.1145/564585.564601) formalized the result. Its consistency property is specific; ACID consistency is instead about transaction invariants. Its availability property is also specific; a monthly uptime measurement answers a different question.

When discussing Heron, say which operation gives way. Its authoritative correction may require the communicating quorum, while a public score view may return version 7 under a declared stale-read policy. That answer gives a reviewer an observable failure case to test. Saying the system is 'CP' without naming the operation leaves that case unclear.

@fig sd_ds_trace_2 | The trace follows a completed write hidden by a blocked message; orange marks the choice between waiting for current state and returning score 10.

:::note CAP is an operation contract
The same product can refuse an authoritative correction and answer a declared old public read. Name the promised result and failure behavior of each operation.
:::

## 3. Choose the guarantee for the operation

A viewer refreshing a scoreboard and a scorer correcting that scoreboard have different needs. A brief old display can be acceptable. A correction applied twice or accepted by competing authorities can change the official result. One store can support both requests while giving them different contracts, even when they share a record.

A **business invariant** is a condition that valid state must preserve, such as one accepted owner of a scoring role. Write the condition before choosing a replication pattern. A design that accepts disconnected writes must either preserve the condition locally, postpone final acceptance, or define how conflicts are handled. 'We will merge later' is not a merge rule.

In the illustrative partition, A has 1 reachable voter and B plus C have 2. Heron's three-voter authoritative write requires 2 voters, so A refuses it. A cached public read can still return score 10 with version 7 if that older display is permitted. A permission revocation check cannot reuse that rule merely because it is also a read.

There is a useful separation between transport success and application success. An HTTP response explaining temporary unavailability can be a good user experience, but it still declined the requested write. A pending receipt can be honest if the product clearly says the command is not yet final. Neither changes CAP's definition of completing the read/write operation.

The contract should include recovery. Once A reconnects, it obtains the accepted history before becoming an authoritative writer. Pending commands keep stable identifiers and are validated against the current state. Clients must not interpret an old local success screen as proof of commitment elsewhere. This is how the abstract tradeoff becomes concrete product behavior.

@fig sd_ds_trace_3 | The rows assign different availability choices to authoritative writes, public reads, and current reads; orange marks the current-read contract that may wait or reject.

:::warn Timeout is not failure
A missed reply does not prove the remote effect rolled back. Keep the command identity stable while resolving an uncertain outcome.
:::

## 4. A timeout leaves the outcome unknown

The scorer's request times out after the leader accepts it. The user presses save again. If Heron treats that press as a new increment, an already applied correction can occur twice. This is the first distributed-systems habit worth practicing: absence of a reply is different from absence of an effect.

A **request deadline** bounds how long the caller waits. It does not rewind another process that has already begun work. Cancellation is another message and can itself be delayed. The server might finish after the caller stops waiting, or it might have finished before the response disappeared. A timeout therefore creates an uncertain outcome rather than a known rollback.

Let score 10 receive command `c9`, meaning add 1. The server commits score 11 with the result for `c9`, but its reply is lost. Retrying `c9` finds that recorded result and returns 11. Retrying as a different command `c10` can legitimately produce 12, because the application has asked for another increment.

This requires **idempotency**, the property that repeating the same intended operation does not repeat its effect. Heron stores command identity and the score change together in its authoritative commit boundary. A separate deduplication write creates a crash gap. The identity also needs a payload check, so the same key cannot silently mean two different corrections.

Deadlines still matter. They bound resource use and let callers choose a recovery action. The correct next action can be a keyed retry or a status lookup, with backoff and a limited attempt budget. It cannot be the claim that an expired wait proves the write failed. Keep that distinction when we discuss leader failure later.

@fig sd_ds_trace_4 | The trace keeps a committed c9 after its reply is lost; orange marks retry by command identity, which returns score 11 instead of applying the increment twice.

@fig sd_distributed_systems_cap | The split shows two live sides that cannot exchange messages; orange marks side B's isolated view, while the partition forces a consistency or availability choice.

:::interview Interview lens
**"Why not always accept the write?"** Acceptance may break an invariant when another disconnected actor also accepts a conflicting change. I would require authority for official corrections and define a separate stale-read policy for public display.
:::

:::key In one breath
A partition prevents communication while processes may continue working. CAP concerns linearizable reads and writes plus eventual responses at non-failing nodes. A product must choose its permitted behavior per operation. A timeout narrows a wait without proving what happened remotely.
:::

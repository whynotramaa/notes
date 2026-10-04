@part VI | Raft | We trace an actual election and a conflicting log suffix. Voting alone does not protect accepted history. We will join freshness checks, append repair, and current-term commitment. | where:6

## 21. Election terms distinguish leadership attempts

A stops sending leadership heartbeats, and B's election timer expires. C can also time out at almost the same moment. If both could receive the same voter's support in the same attempt, the cluster could declare two leaders. Raft separates attempts with terms and limits each voter to one persisted vote per term.

**Leader election** selects the participant authorized to lead under the protocol's rules. A timeout starts an attempt; it does not itself grant authority. Votes, log freshness, persisted election state, and the term together decide whether B can lead. This distinction prevents a health monitor from promoting an arbitrary reachable copy outside the consensus protocol.

**Raft** is a replicated-log protocol that separates election, replication, and safety. A **term** is an increasing logical leadership epoch. A candidate increments its term, votes for itself, and requests other votes. A receiver with a newer term causes an older candidate or leader to step down, rather than treat delayed old messages as current authority.

Our illustrative group A, B, C begins in term 4. A becomes unreachable. B begins term 5, persists its vote for B, and asks C. C validates B's log and grants its term-5 vote. B now has 2 of 3 votes and becomes leader. A's returning term-4 append request cannot restore its old leadership.

Election randomness reduces repeated split votes by giving candidates different timeout choices, but it is not a guarantee against every schedule. Persistent `currentTerm` and `votedFor` prevent a restart from forgetting a prior vote and voting again in the same term. The durable-state requirement matters as much as the count written beside the diagram.

[Ongaro and Ousterhout's Raft paper](https://raft.github.io/raft.pdf) is the primary reference for these rules. Heron's timeline illustrates their interaction rather than replacing a protocol specification. A real implementation must cover restart, message duplication, snapshots, and membership changes as well. We will next check the candidate's log before trusting the election result.

@fig sd_ds_trace_21 | The election trace moves B from term 4 to term 5, collects two votes, and makes old leader A step down; orange marks the newer-term request that defeats the old leader.

:::story Picture this
A new editor sends replacement pages beginning after a shared page. The receiver checks the page immediately before the replacement. A mismatched page means the proposed continuation is attached to the wrong version of the book.
:::

## 22. Log freshness compares term before length

A candidate advertises a longer log than another voter. Should that automatically win the election? No. A long suffix from an older leadership attempt can be less current than a shorter suffix from a newer term. Raft's freshness comparison uses the last log term first and the last log index only when those terms tie.

The **last-log pair** consists of the term of the final entry and its index. Compare these pairs lexicographically as term then index. This does not mean any larger number is safe by itself; the property works with the protocol's rule that leaders append and repair histories in a prescribed way and voters limit their votes.

In the illustrative comparison, B ends at term 4, index 8. C ends at term 3, index 9. B's last term 4 exceeds C's 3, so B is fresher despite its shorter log. Another candidate D ending at term 4, index 7 would be less current than B because equal terms make the index comparison relevant.

A voter grants a vote only when the request's term and persisted-vote rules permit it and the candidate is at least as current as the voter's own log. This prevents a candidate missing necessary committed history from collecting an arbitrary majority. Majority intersections and the log-freshness restriction work together; removing either weakens the safety argument.

Do not compare wall-clock update times or local file sizes to choose a Raft leader. They do not encode the required history relation. A replica that merely responds faster can be stale. For Heron, election handling belongs to the consensus implementation, while monitoring can expose term churn and log progress without inventing a separate promotion shortcut.

@fig sd_ds_trace_22 | The log-freshness trace compares term before index, so term 4 index 8 beats term 3 index 9; orange marks the final vote check.

:::note Term before index
Raft compares the final log entry term before its index during freshness checks. Longer local history is not automatically newer history.
:::

## 23. Repair a conflicting suffix after a matching prefix

B becomes leader while C has an extra entry from an older leader. Appending only the new command to C would leave the logs different at an earlier position. Raft first proves that the entries immediately before the proposed suffix match. A rejection tells the leader to find an earlier shared prefix rather than guess that lengths imply agreement.

An **AppendEntries** request includes the prior log index and prior log term, plus new entries and the leader's known commit index. A follower rejects an incompatible predecessor. After a matching predecessor, a new entry with a different term at an existing index causes the follower to remove that conflicting entry and its following suffix before appending the leader's entries.

Use a smaller independent trace. Both logs share indexes 1 and 2 with terms [1,2]. B has index 3 with term 4 and command `c9`; C has index 3 with term 3 and command `x`. These conflicting entries are not committed. B's request referencing index 3, term 4 fails at C, whose term there is 3.

B retries from predecessor index 2, term 2, sending index 3, term 4. C verifies the shared predecessor, removes old `x` and its following uncommitted suffix, and appends `c9`. Both logs now have terms [1,2,4]. A committed entry cannot be arbitrarily replaced under the protocol's safety rules; this example concerns the repairable uncommitted suffix.

Show the rejection and retry in an interview. 'Followers copy the leader' skips the mechanism that avoids grafting commands onto a wrong history. The retry can cost extra round trips and transferred entries, while implementations may accelerate conflict discovery. Snapshots require a compatible base position when the missing prefix is no longer available as individual entries.

@fig sd_ds_trace_23 | The repair trace backs from a rejected predecessor at index 3 to index 2, then replaces C's conflicting suffix; orange marks the repaired log [1,2,4:c9].

:::warn Copies of an old-term entry are insufficient
The direct commitment rule needs a current-term entry. Committing it includes the earlier prefix; do not drop that condition from a majority diagram.
:::

## 24. Commit a current-term entry before replying

B has repaired C's suffix and appended a new command, but storing it locally still does not justify a success response. Raft's direct commitment rule requires a majority to contain an entry from the leader's current term. Earlier entries become committed with that prefix. Simply counting old-term copies can give the wrong conclusion.

In our election trace, B leads term 5 and already holds an uncommitted term-4 entry at index 8. It appends a term-5 entry at index 9. After C durably accepts through 9, B and C form a majority of 2 in N=3. B can advance commitment through 9, which includes the preceding index 8.

The current-term restriction connects replication to the election safety argument. A leader directly advancing commitment on an older-term entry by copy count alone lacks that connection. The Raft paper gives an adversarial election history demonstrating the trap. Heron's example makes the safe operation explicit: append a current-term entry, replicate it under the protocol, then advance the committed prefix.

B applies committed commands in order and records the resulting score and deduplication outcome before returning the promised result. C may know the bytes before receiving B's new commit index, and it may apply them later. A read requiring position 9 therefore still needs its authority and application barrier; majority storage is not identical to every follower's visible state.

If B crashes after commitment and before replying, the new election must preserve committed history, and the client's keyed retry retrieves the recorded result after application. If B crashes before commitment, the command may eventually commit or disappear as an uncommitted suffix. The client cannot infer which from the lost reply. This closes the uncertainty loop from Section 4.

@fig sd_ds_trace_24 | The commit trace appends current-term entry 9 on B, gets two of three replicas, and recovers after a lost reply; orange marks the committed retry boundary.

@fig sd_distributed_systems_raft | The matrix shows the leader and follower B accepting a current-term entry while C has not; orange marks the majority that protects commitment.

:::interview Interview lens
**"Why show predecessor rejection?"** It is the operation that identifies a mismatching history. The leader retries from a matching prefix before replacing a conflicting uncommitted suffix, rather than assuming every follower has the right base.
:::

:::key In one breath
Raft votes compare log terms before indexes and persist election state. Append checks establish a matching prefix before replacing an uncommitted conflict. Direct majority commitment applies to current-term entries. Committing that entry includes its preceding prefix.
:::

import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

export function where_sd_distributed_systems(stage=99) { return systemMap("sd_distributed_systems", ["CAP theorem and network partitions", "Consistency models", "Leader, multi-leader, leaderless", "Heartbeats, leases and fencing", "Consensus", "Raft", "ZooKeeper, etcd and split brain", "Case study: one replicated write"], stage); }
export function cover_sd_distributed_systems() { return systemCover("sd_distributed_systems", 5, ["Distributed", "systems"], "Distributed systems fundamentals", ["CAP theorem and network partitions", "Consistency models", "Leader, multi-leader, leaderless", "Heartbeats, leases and fencing", "Consensus", "Raft", "ZooKeeper, etcd and split brain", "Case study: one replicated write"]); }
export function sd_distributed_systems_cap() { return systemFigure("sd_distributed_systems_cap", "BOTH SIDES ARE ALIVE BUT CANNOT COMMUNICATE", "split", [["side A", "old state + requests\nno messages across"], ["side B", "old state + requests\nno messages across"]], "lack of a reply is not proof of death"); }
export function sd_distributed_systems_choice() { return systemFigure("sd_distributed_systems_choice", "CHOOSE BEHAVIOR FOR EACH OPERATION", "rows", [["score write", "authority required", "may reject"], ["cached read", "stale allowed", "may answer"]], "one product can have different contracts"); }
export function sd_distributed_systems_history() { return systemFigure("sd_distributed_systems_history", "A LATER READ FOLLOWS A COMPLETED WRITE", "sequence", {"actors": ["writer", "store", "reader"], "steps": [[0, 1, "write version v"], [1, 0, "complete"], [2, 1, "later read"], [1, 2, "v or a later version"]]}, "say the observable guarantee"); }
export function sd_distributed_systems_session() { return systemFigure("sd_distributed_systems_session", "A SESSION CARRIES A MINIMUM VISIBLE POSITION", "rows", [["required", "position 8", "position 8"], ["replica", "position 7", "position 9"], ["decision", "wait or route", "serve"]], "routing alone is not a freshness proof"); }
export function sd_distributed_systems_leaders() { return systemFigure("sd_distributed_systems_leaders", "WHERE WRITES ENTER THE HISTORY", "split", [["single leader", "one ordering point\nfollowers may lag"], ["multi-leader", "several ordering points\nconflicts need semantics"]], "conflict resolution is a data rule"); }
export function sd_distributed_systems_overlap() { return systemFigure("sd_distributed_systems_overlap", "FIXED MEMBERSHIP IS PART OF THE PROOF", "matrix", {"rows": ["write W=2", "read R=2"], "cols": ["A", "B", "C"], "values": [["yes", "yes", "no"], ["no", "yes", "yes"]]}, "do not apply this proof to substituted owners"); }
export function sd_distributed_systems_suspect() { return systemFigure("sd_distributed_systems_suspect", "THE OLD WORKER CAN RESUME AFTER TAKEOVER", "sequence", {"actors": ["worker A", "coordinator", "worker B"], "steps": [[0, 1, "heartbeat"], [1, 2, "A silent: assign B"], [2, 1, "B owns new epoch"], [0, 1, "A resumes with old epoch"]]}, "takeover needs a resource-side check"); }
export function sd_distributed_systems_fence() { return reviewStates("sd_distributed_systems_fence", "ISSUANCE DOES NOT UPDATE THE RESOURCE", [["A owns", "storage highest 7", "token 7 can pass"], ["B granted", "coordinator issues 8", "storage still highest 7"], ["B installs", "storage persists 8", "resource takeover boundary"], ["A resumes", "write carries 7", "7 < 8: effect rejected"]]); }
export function sd_distributed_systems_consensus() { return systemFigure("sd_distributed_systems_consensus", "AGREED HISTORY DRIVES REPLICA STATE", "flow", ["command", "agreement protocol", "committed log", "same state changes"], "agreement is scoped to the protocol's history"); }
export function sd_distributed_systems_raft() { return systemFigure("sd_distributed_systems_raft", "CURRENT-TERM ENTRY REACHES A MAJORITY", "matrix", {"rows": ["leader", "follower B", "follower C"], "cols": ["entry x", "current term"], "values": [["yes", "yes"], ["yes", "yes"], ["no", "yes"]]}, "votes and log freshness protect the history"); }
export function sd_distributed_systems_coord() { return systemFigure("sd_distributed_systems_coord", "SMALL SHARED DECISIONS, NOT EVERY PAYLOAD", "fan", {"source": "coordination store", "targets": ["ownership epoch", "configuration version", "service membership"]}, "payload work belongs on another path"); }
export function sd_distributed_systems_split() { return systemFigure("sd_distributed_systems_split", "TWO BELIEFS MUST NOT BECOME TWO VALID OWNERS", "split", [["old owner", "cached membership\nstale authority"], ["new owner", "new membership\nvalid authority"]], "a configuration update is another coordinated change"); }
export function sd_distributed_systems_full() { return systemFigure("sd_distributed_systems_full", "AUTHORITY, COMMIT, AND OBSERVATION ARE SEPARATE", "sequence", {"actors": ["scorer", "leader", "follower"], "steps": [[0, 1, "command + key"], [1, 2, "replicate entry"], [2, 1, "acknowledge"], [1, 0, "commit position"], [0, 2, "read at least position"]]}, "a read chooses a suitable history"); }
export function sd_distributed_systems_loss() { return reviewStates("sd_distributed_systems_loss", "EXPOSURE IS A CALCULATION WITH UNITS", [["rate", "20 events/s", "assumed constant input"], ["gap", "5 seconds", "candidate replica lag"], ["events", "20 x 5 = 100", "unreplicated events"], ["payload", "100 x 200 = 20,000", "bytes, not proven loss"]]); }

// Four explicit states place the change beside its consequence. Long labels
// wrap inside their own column instead of shrinking the entire diagram.
function reviewStates(id, title, rows) {
  const d = new D(640, 340, id);
  d.text(10, 16, title, {cls:'cap', a:'start', size:8.8});
  const wrap = (s, limit=28) => {
    const words=String(s).split(' '), lines=[''];
    for (const word of words) {
      const last=lines.length-1;
      if ((lines[last]+' '+word).trim().length>limit && lines[last]) lines.push(word);
      else lines[last]=(lines[last]+' '+word).trim();
    }
    return lines.join('\n');
  };
  d.text(42, 48, 'STEP / ACTOR', {cls:'xs', a:'start'});
  d.text(194, 48, 'OPERATION / STATE', {cls:'xs', a:'start'});
  d.text(432, 48, 'OBSERVABLE CONSEQUENCE', {cls:'xs', a:'start'});
  rows.forEach(([actor,state,result],i)=>{
    const y=68+i*62, active=i===rows.length-1;
    d.circle(20,y+23,15,{stroke:active?C.acc:C.gray,fill:active?C.accSoft:C.card});
    d.mono(20,y+23,String(i+1),{size:8});
    if(i<rows.length-1)d.arrow(20,y+34,20,y+53,{stroke:C.line,hl:4});
    d.text(42,y+23,wrap(actor,20),{cls:'sm',a:'start',size:10.5,vc:true});
    d.box(185,y,216,46,wrap(state,29),{fill:active?C.accSoft:C.card,stroke:active?C.acc:C.line,size:11});
    d.arrow(405,y+23,423,y+23,{stroke:active?C.acc:C.gray,hl:5});
    d.text(432,y+23,wrap(result,27),{cls:'sm',a:'start',size:10.5,vc:true});
  });
  d.hand(321,324,'follow the state, then the effect',{size:16});
  return d.svg();
}
function reviewLog(id,title,rows) {
  const d=new D(640,350,id);
  d.text(10,16,title,{cls:'cap',a:'start',size:8.8});
  rows.forEach(([actor,state,result],i)=>{
    const y=59+i*64;
    d.text(18,y+14,actor,{cls:'sm',a:'start',size:10.5});
    d.rect(166,y-9,251,45,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.line});
    d.mono(291,y+13,state,{size:10.2});
    d.arrow(422,y+13,445,y+13,{stroke:i===3?C.acc:C.gray,hl:5});
    const words=result.split(' '); const middle=Math.ceil(words.length/2);
    d.text(457,y+13,words.length>5?words.slice(0,middle).join(' ')+'\n'+words.slice(middle).join(' '):result,{cls:'sm',a:'start',size:10,vc:true});
    if(i<3)d.arrow(291,y+40,291,y+52,{stroke:C.line,hl:5});
  });
  d.hand(320,330,'a suffix needs a matching prefix',{size:16});
  return d.svg();
}

export function sd_ds_trace_1() { return reviewStates("sd_ds_trace_1", "A NETWORK CAN FAIL BETWEEN LIVING MACHINES", [["start", "A, B, C", "v7: score 10"], ["partition", "A alone", "still handles local requests"], ["connected side", "B + C", "can exchange messages"], ["decision", "each operation", "authority or declared old copy"]]); }

export function sd_ds_trace_2() { return reviewStates("sd_ds_trace_2", "CAP BEGINS WITH AN IMPOSSIBLE READ", [["A", "write score 11", "completed"], ["network", "A to B", "message blocked"], ["B", "read begins later", "only score 10 known"], ["choice", "wait or old result", "cannot promise both"]]); }

export function sd_ds_trace_3() { return reviewStates("sd_ds_trace_3", "CHOOSE THE GUARANTEE FOR THE OPERATION", [["correction at A", "1 of 3 reachable", "reject authoritative write"], ["correction at B", "2 of 3 reachable", "protocol may commit"], ["public read", "v7 allowed", "return labeled older copy"], ["authority read", "current required", "wait, route, or reject"]]); }

export function sd_ds_trace_4() { return reviewStates("sd_ds_trace_4", "A TIMEOUT LEAVES THE OUTCOME UNKNOWN", [["before", "score 10", "no c9 result"], ["commit", "c9: add 1", "score 11 + c9 result"], ["reply", "lost", "client uncertain"], ["retry c9", "lookup same key", "score remains 11"]]); }

export function sd_ds_trace_5() { return reviewStates("sd_ds_trace_5", "PLACE OPERATIONS ON A LEGAL TIMELINE", [["write", "time 2 to 5", "10 becomes 11"], ["read X", "time 1 to 3", "overlap permits 10 or 11"], ["read Y", "time 6 to 7", "must reflect completed write"], ["bad history", "Y returns 10", "violates real-time order"]]); }

export function sd_ds_trace_6() { return reviewStates("sd_ds_trace_6", "EVENTUAL CONVERGENCE NEEDS A REPAIR MECHANISM", [["initial", "A B C", "[7,7,7]"], ["update", "C misses transfer", "[8,8,7]"], ["repair", "compare log positions", "C requests missing v8"], ["convergence", "communication restored", "[8,8,8]"]]); }

export function sd_ds_trace_7() { return reviewStates("sd_ds_trace_7", "CAUSAL ORDER FOLLOWS DEPENDENCIES", [["P complaint", "A:7", "cause visible first"], ["Q reply", "B:4 depends A:7", "dependency travels with reply"], ["replica", "A:6 and B:4", "hold Q"], ["after fetch", "A:7 and B:4", "release Q"]]); }

export function sd_ds_trace_8() { return reviewStates("sd_ds_trace_8", "A SESSION RECEIPT CARRIES A MINIMUM POSITION", [["write receipt", "minimum 8", "session stores 8"], ["replica A", "applied 7", "wait or route"], ["replica B", "applied 9", "eligible for read"], ["next receipt", "observed 12", "minimum becomes 12"]]); }

export function sd_ds_trace_9() { return reviewStates("sd_ds_trace_9", "ONE LEADER GIVES WRITES AN ORDERING POINT", [["A leader", "append c9, c10", "positions 8 then 9"], ["B follower", "apply through 9", "score 12"], ["C follower", "apply through 8", "score 11"], ["read contract", "freshness required", "C may be ineligible"]]); }

export function sd_ds_trace_10() { return reviewStates("sd_ds_trace_10", "FAILOVER CAN EXPOSE UNREPLICATED HISTORY", [["rate assumption", "20 events/s", "200 bytes/event"], ["lag assumption", "5 seconds", "candidate misses recent events"], ["event exposure", "20 x 5", "100 events"], ["payload exposure", "100 x 200", "20,000 bytes"]]); }

export function sd_ds_trace_11() { return reviewStates("sd_ds_trace_11", "MULTIPLE LEADERS NEED A MEANINGFUL MERGE", [["start", "A and B", "score 10"], ["A correction", "replace with 11", "one branch"], ["B correction", "replace with 12", "concurrent branch"], ["reconnect", "both versions known", "domain rule or explicit conflict"]]); }

export function sd_ds_trace_12() { return reviewStates("sd_ds_trace_12", "QUORUM OVERLAP IS ONLY THE START", [["write set", "A B", "v8 retained"], ["read set", "B C", "v8 and v7 returned"], ["intersection", "B", "2 + 2 - 3 = 1"], ["client rule", "collect required replies", "version selection still required"]]); }

export function sd_ds_trace_13() { return reviewStates("sd_ds_trace_13", "HEARTBEATS MEASURE RECENT CONTACT", [["last receipt", "time 0", "worker recently reachable"], ["silence", "time 1 and 2", "cause unknown"], ["suspicion", "time 3", "replacement may be proposed"], ["old resumes", "time 4", "still able to issue requests"]]); }

export function sd_ds_trace_14() { return reviewStates("sd_ds_trace_14", "A LEASE EXPIRES WHILE ITS HOLDER IS PAUSED", [["time 0", "A receives lease", "expiry at 3"], ["time 2", "A pauses", "check already completed"], ["time 3", "lease expires", "B can acquire new role"], ["time 4", "A resumes", "old permission is insufficient"]]); }

export function sd_ds_trace_15() { return reviewStates("sd_ds_trace_15", "INSTALL FENCING AUTHORITY AT THE RESOURCE", [["storage initial", "highest = 7", "A may still pass"], ["coordinator", "issue token 8", "storage unchanged"], ["B to storage", "install 8 and persist", "acknowledge takeover boundary"], ["A delayed write", "token 7 < highest 8", "reject before score effect"]]); }

export function sd_ds_trace_16() { return reviewStates("sd_ds_trace_16", "TOKEN ORDER AND COMMAND IDENTITY SOLVE DIFFERENT PROBLEMS", [["valid c9", "token 8", "score 10 becomes 11"], ["repeat c9", "token 8", "recorded result 11"], ["new c10", "token 8", "score 11 becomes 12"], ["old owner", "token 7", "no new effect accepted"]]); }

export function sd_ds_trace_17() { return reviewStates("sd_ds_trace_17", "AGREEMENT ORDERS THE SAME COMMANDS", [["initial", "all replicas", "score 10, version 7"], ["position 8", "c9 expects v7", "accept 11, advance version"], ["position 9", "c10 expects v7", "reject stale precondition"], ["same history", "same rules", "equivalent final state"]]); }

export function sd_ds_trace_18() { return reviewStates("sd_ds_trace_18", "SAFETY CAN HOLD WHILE PROGRESS STOPS", [["N", "3 voters", "majority 2"], ["one lost", "2 connected remain", "progress may continue"], ["two lost", "1 remains", "no majority"], ["all alive", "three isolated voters", "no connected majority"]]); }

export function sd_ds_trace_19() { return reviewStates("sd_ds_trace_19", "STORED, COMMITTED, AND APPLIED ARE SEPARATE STATES", [["stored end", "10", "bytes exist locally"], ["known committed", "9", "safe prefix known"], ["applied prefix", "8", "score view still behind"], ["required read", "9", "wait until application reaches 9"]]); }

export function sd_ds_trace_20() { return reviewStates("sd_ds_trace_20", "AGREEMENT STOPS AT THE EXTERNAL-EFFECT BOUNDARY", [["authoritative commit", "score 11 + e9 intent", "one boundary"], ["relay first send", "e9 accepted", "reply lost"], ["relay retry", "same e9", "duplicate delivery possible"], ["consumer commit", "e9 identity + effect", "one accepted effect"]]); }

export function sd_ds_trace_21() { return reviewStates("sd_ds_trace_21", "ELECTION TERMS DISTINGUISH LEADERSHIP ATTEMPTS", [["old state", "A leader, term 4", "B and C followers"], ["B timeout", "advance to term 5", "persist self vote"], ["C vote", "term 5, B eligible", "B has 2 votes"], ["A returns", "term 4 request", "step down on newer term"]]); }

export function sd_ds_trace_22() { return reviewStates("sd_ds_trace_22", "LOG FRESHNESS COMPARES TERM BEFORE LENGTH", [["B last pair", "term 4, index 8", "fresher than C"], ["C last pair", "term 3, index 9", "length does not win"], ["D last pair", "term 4, index 7", "same term, shorter index"], ["vote check", "term then index", "plus one vote per term"]]); }

export function sd_ds_trace_23() { return reviewLog("sd_ds_trace_23", "REPAIR A CONFLICTING SUFFIX AFTER A MATCHING PREFIX", [["B log", "[1,2,4:c9]", "new leader suffix"], ["C log", "[1,2,3:x]", "uncommitted conflict"], ["append prev 3/4", "C has 3/3", "reject predecessor"], ["retry prev 2/2", "replace index 3", "C becomes [1,2,4:c9]"]]); }

export function sd_ds_trace_24() { return reviewLog("sd_ds_trace_24", "COMMIT A CURRENT-TERM ENTRY BEFORE REPLYING", [["B leader", "current term 5", "old term-4 entry at 8"], ["append 9", "term 5 command", "local storage only"], ["C accepts 9", "B + C = 2 of 3", "advance commitment through 9"], ["reply lost", "retry same command", "recover recorded result"]]); }

export function sd_ds_trace_25() { return reviewStates("sd_ds_trace_25", "ZOOKEEPER AND ETCD HOLD CONTROL DECISIONS", [["control record", "publisher B, epoch 8", "small shared metadata"], ["configuration", "revisioned value", "compare expected prior version"], ["data path", "20 x 50,000", "1,000,000 deliveries/s"], ["write boundary", "epoch checked", "control and payload stay distinct"]]); }

export function sd_ds_trace_26() { return reviewStates("sd_ds_trace_26", "A WATCH NEEDS A RESTART POSITION AND REREAD", [["client progress", "processed revision 8", "remember compatible position"], ["disconnect", "revisions 9 and 10", "events may be missed"], ["recovery", "replay or snapshot", "follow documented stream contract"], ["protected write", "old belief possible", "resource still enforces epoch"]]); }

export function sd_ds_trace_27() { return reviewStates("sd_ds_trace_27", "SPLIT BRAIN IS COMPETING OWNERSHIP", [["A local belief", "owner epoch 7", "process still running"], ["B control decision", "owner epoch 8", "new generation granted"], ["storage install", "highest epoch 8", "takeover protection active"], ["A request", "epoch 7", "effect rejected"]]); }

export function sd_ds_trace_28() { return reviewStates("sd_ds_trace_28", "MEMBERSHIP UPDATES CHANGE THE QUORUM PROOF", [["old voters", "A B C", "majority may be A B"], ["new voters", "C D E", "majority may be D E"], ["joint phase", "old majority AND new", "one supported transition"], ["final phase", "new config committed", "old authority no longer accepted"]]); }

export function sd_ds_trace_29() { return reviewStates("sd_ds_trace_29", "TRACE ONE SCORER CORRECTION END TO END", [["input", "c9, expects v7, epoch 8", "authenticate and validate"], ["log", "current-term entry", "majority 2 of 3"], ["apply", "score + c9 + e9", "one authoritative boundary"], ["observe", "required position", "eligible session read"]]); }

export function sd_ds_trace_30() { return reviewStates("sd_ds_trace_30", "REPLAY CRASHES AT THE IMPORTANT BOUNDARIES", [["before commit", "proposal uncertain", "retry c9, do not infer failure"], ["after commit", "reply absent", "recover accepted c9 result"], ["after send", "e9 delivery uncertain", "repeat same event ID"], ["after consume", "ack absent", "consumer dedup preserves effect"]]); }

export function sd_ds_trace_31() { return reviewStates("sd_ds_trace_31", "SNAPSHOTS PRESERVE A NAMED HISTORY BOUNDARY", [["snapshot", "includes through 8", "score + retained c9 result"], ["suffix", "entries 9 and 10", "start after included prefix"], ["install", "verified compatible image", "crash-safe boundary"], ["resume", "apply 9 then 10", "no skipped or repeated prefix"]]); }

export function sd_ds_trace_32() { return reviewStates("sd_ds_trace_32", "COUNT THE COPIES AND THE LIMITS OF THE PROMISE", [["one event", "200 bytes", "logical payload"], ["3 copies", "3 x 200", "600 stored payload bytes"], ["stream storage", "20 x 200 x 3", "12,000 bytes/s"], ["viewer deliveries", "20 x 200 x 50,000", "200,000,000 bytes/s"]]); }

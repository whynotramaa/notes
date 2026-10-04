import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const node = (d, x, y, s, hot = false, w = 58, h = 62) => { d.server(x, y, w, h, { unit: 14, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + w / 2, y + h + 14, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); };
const cut = (d, x, y1, y2) => { let p = `M${x},${y1}`; for (let y = y1, k = 0; y < y2; y += 14, k++) p += ` L${x + (k % 2 ? -7 : 7)},${y + 14}`; d.path(p, { stroke: C.acc, sw: 1.8, single: true, dash: [5, 4] }); };
export function where_sd_distributed_systems(stage=99) { return systemMap("sd_distributed_systems", ["CAP theorem and network partitions", "Consistency models", "Leader, multi-leader, leaderless", "Heartbeats, leases and fencing", "Consensus", "Raft", "ZooKeeper, etcd and split brain", "Case study: one replicated write"], stage); }
export function cover_sd_distributed_systems() { return systemCover("sd_distributed_systems", 5, ["Distributed", "systems"], "Distributed systems fundamentals", ["CAP theorem and network partitions", "Consistency models", "Leader, multi-leader, leaderless", "Heartbeats, leases and fencing", "Consensus", "Raft", "ZooKeeper, etcd and split brain", "Case study: one replicated write"]); }
export function sd_distributed_systems_cap() {
const d=illustration('sd_distributed_systems_cap','A NETWORK PARTITION SEPARATES LIVE SITES',340);
  [46,398].forEach((x,i)=>{d.rect(x,49,192,251,{fill:C.paper,stroke:C.line,dash:[4,4]});d.text(x+96,72,`site ${i?'B':'A'}`,{cls:'ttl'});d.server(x+51,98,89,105,{label:'still running'});d.envelope(x+53,242,86,37);});
  d.line(248,154,388,154,{stroke:C.line,single:true,dash:[6,5]});
  d.line(298,125,342,181,{stroke:C.acc,single:true,sw:2});d.line(342,125,298,181,{stroke:C.acc,single:true,sw:2});
  d.text(320,213,'cannot exchange messages',{cls:'sm',color:C.acc});
  d.text(320,321,'each operation must choose its behavior while sites cannot agree',{cls:'sm'});return d.svg();
}
export function sd_distributed_systems_choice() { return systemFigure("sd_distributed_systems_choice", "CHOOSE BEHAVIOR FOR EACH OPERATION", "rows", [["score write", "authority required", "may reject"], ["cached read", "stale allowed", "may answer"]], "one product can have different contracts"); }
export function sd_distributed_systems_history() {
  const d = illustration('sd_distributed_systems_history', 'A READ THAT STARTS AFTER A WRITE COMPLETED MUST SEE THAT WRITE OR NEWER', 330);
  d.person(50, 60, 32, { label: 'writer' }); d.db(270, 56, 100, 90, { label: 'store' }); d.person(580, 60, 32, { label: 'reader' });
  d.arrow(80, 82, 262, 82, { stroke: C.ink2 }); d.mono(170, 70, 'write v', { size: 10 });
  d.arrow(262, 110, 80, 110, { stroke: C.ink2 }); d.mono(170, 124, 'done', { size: 10 });
  d.arrow(552, 96, 378, 96, { stroke: C.ink2 }); d.mono(466, 84, 'later read', { size: 10 });
  d.arrow(378, 128, 552, 128, { stroke: C.acc }); d.mono(466, 144, 'v or newer', { size: 10, color: C.acc });
  d.travel([[80, 82], [262, 82], [262, 110], [80, 110]], { dur: 6, at: [0, 0.45], r: 3.5, color: C.ink2 });
  d.travel([[552, 96], [378, 96], [378, 128], [552, 128]], { dur: 6, at: [0.5, 1], label: 'v', w: 22 });
  const X = 60, W = 520;
  d.arrow(X, 230, X + W, 230, { stroke: C.gray });
  d.rect(X + 20, 196, 200, 22, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 120, 207, 'write in progress', { cls: 'xs' });
  d.line(X + 220, 186, X + 220, 238, { stroke: C.ink2, dash: [3, 3], single: true }); d.text(X + 220, 254, 'completes', { cls: 'xs' });
  d.rect(X + 300, 196, 160, 22, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(X + 380, 207, 'read starts after', { cls: 'xs', color: C.acc });
  d.text(320, 296, 'state the observable rule, not the replication mechanism', { cls: 'xs' });
  return d.svg();
}
export function sd_distributed_systems_session() { return systemFigure("sd_distributed_systems_session", "A SESSION CARRIES A MINIMUM VISIBLE POSITION", "rows", [["required", "position 8", "position 8"], ["replica", "position 7", "position 9"], ["decision", "wait or route", "serve"]], "routing alone is not a freshness proof"); }
export function sd_distributed_systems_leaders() {
const d=illustration('sd_distributed_systems_leaders','WRITE ENTRY POINTS DETERMINE WHERE ORDER AND CONFLICTS ARISE',335);
  d.text(155,48,'single leader',{cls:'ttl'});d.text(478,48,'multiple leaders',{cls:'ttl'});
  d.server(113,95,83,88,{fill:C.accSoft,stroke:C.acc,label:'ordered writes'});[53,205].forEach(x=>{d.server(x,229,52,58);d.arrow(154,190,x+26,221,{stroke:C.line,hl:5});});
  [[387,114],[522,224]].forEach(([x,y])=>{d.server(x,y,61,71,{fill:C.accSoft,stroke:C.acc});d.envelope(x,y-49,61,30);d.arrow(x+30,y-12,x+30,y-5,{stroke:C.acc,hl:4});});
  d.arrow(454,150,515,248,{stroke:C.ink2,both:true});d.text(495,103,'local write entry',{cls:'sm'});d.text(477,311,'conflicts need data rules',{cls:'sm',color:C.acc});return d.svg();
}
export function sd_distributed_systems_overlap() {
  const d = illustration('sd_distributed_systems_overlap', 'WITH N = 3, ANY 2 WRITERS AND ANY 2 READERS SHARE AT LEAST ONE NODE', 330);
  d.ellipse(250, 150, 330, 160, { stroke: C.ink2, fill: C.paper });
  d.ellipse(390, 150, 330, 160, { stroke: C.ink2 });
  d.text(160, 62, 'write set W = 2', { cls: 'ttl' }); d.text(480, 62, 'read set R = 2', { cls: 'ttl' });
  node(d, 120, 116, 'A'); node(d, 291, 116, 'B', true); node(d, 462, 116, 'C');
  d.mono(149, 112, 'v8', { size: 10 }); d.mono(320, 112, 'v8', { size: 10, color: C.acc }); d.mono(491, 112, 'v7', { size: 10 });
  d.pulse(320, 147, { r0: 30, r1: 50, dur: 2.5 });
  d.mono(320, 260, '2 + 2 − 3 = 1 shared node', { size: 11 });
  d.rect(110, 280, 420, 32, { r: 4, fill: C.accFaint, stroke: C.acc });
  d.text(320, 296, 'holds only while membership stays {A, B, C}', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_distributed_systems_suspect() { return systemFigure("sd_distributed_systems_suspect", "THE OLD WORKER CAN RESUME AFTER TAKEOVER", "sequence", {"actors": ["worker A", "coordinator", "worker B"], "steps": [[0, 1, "heartbeat"], [1, 2, "A silent: assign B"], [2, 1, "B owns new epoch"], [0, 1, "A resumes with old epoch"]]}, "takeover needs a resource-side check"); }
export function sd_distributed_systems_fence() {
  const d = illustration('sd_distributed_systems_fence', 'THE STORAGE CHECKS THE TOKEN, SO A STALE OWNER IS STOPPED AT THE DOOR', 340);
  d.server(270, 46, 100, 70, { label: 'coordinator' });
  chip(d, 380, 70, 90, 'issues 8');
  node(d, 40, 160, 'A (paused)'); node(d, 540, 160, 'B');
  d.db(260, 200, 120, 100, { fill: C.accSoft, stroke: C.acc });
  d.mono(320, 250, 'highest = 8', { size: 11, color: C.acc });
  d.arrow(370, 96, 560, 156, { stroke: C.ink2, hl: 6 });
  d.arrow(536, 210, 388, 240, { stroke: C.ink2 }); d.mono(470, 210, 'install 8', { size: 9.5 });
  d.arrow(104, 210, 252, 240, { stroke: C.acc }); d.mono(170, 210, 'write, token 7', { size: 9.5 });
  d.travel([[104, 210], [252, 240], [140, 260]], { dur: 5, at: [0.3, 0.9], label: '7', w: 20 });
  cross(d, 236, 250, 10);
  d.text(320, 322, '7 < 8: rejected before it changes the score', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_distributed_systems_consensus() {
const d=illustration('sd_distributed_systems_consensus','AN AGREED LOG DRIVES THE SAME STATE TRANSITIONS AT EACH REPLICA',350);
  d.envelope(37,88,87,53);d.text(80,166,'command',{cls:'ttl'});
  const ys=[52,153,254];ys.forEach((y,i)=>{d.server(206,y,68,54,{unit:16});figShelf(d,330,y+8,['entry','entry','entry'],{width:226,height:35,hot:2});d.arrow(282,y+27,322,y+27,{stroke:C.ink2,hl:5});d.text(590,y+27,'apply',{cls:'sm'});});
  d.arrow(132,115,198,78,{stroke:C.acc});d.line(238,114,238,146,{stroke:C.acc,single:true});d.line(238,215,238,247,{stroke:C.acc,single:true});
  d.text(320,327,'agreement applies to this history under the protocol assumptions',{cls:'sm'});return d.svg();
}
export function sd_distributed_systems_raft() {
  const d = illustration('sd_distributed_systems_raft', 'THE LEADER COMMITS ENTRY x ONCE A MAJORITY, 2 OF 3, HOLDS IT', 330);
  [['leader A', 1], ['follower B', 1], ['follower C', 0]].forEach(([s, has], i) => {
    const y = 56 + i * 80, hot = has === 1;
    node(d, 30, y, '', i === 0, 50, 54); d.text(124, y + 26, s, { cls: 'ttl', a: 'start', size: 12 });
    d.tape(250, y + 12, ['t4', 't5', 't5', has ? 'x' : ''], { cw: 56, h: 30, hot: (k) => k === 3 && hot });
    if (!has) d.rect(418, y + 12, 56, 30, { r: 0, stroke: C.gray, dash: [3, 3] });
    if (i > 0) d.travel([[90, 80], [418, y + 27]], { dur: 4, at: [0.1, 0.6], r: 3, color: has ? C.acc : C.gray });
  });
  d.rect(410, 50, 72, 172, { r: 6, stroke: C.acc, dash: [5, 4] });
  d.text(446, 240, 'current term', { cls: 'xs', color: C.acc });
  d.text(530, 110, 'majority\nreached', { cls: 'sm', color: C.acc, vc: true });
  d.text(320, 296, 'votes go only to candidates whose log is at least as fresh', { cls: 'xs' });
  return d.svg();
}
export function sd_distributed_systems_coord() {
  const d = illustration('sd_distributed_systems_coord', 'THE COORDINATION STORE HOLDS SMALL DECISIONS; PAYLOAD TAKES ANOTHER ROAD', 330);
  d.rect(30, 50, 250, 210, { r: 8, fill: C.accFaint, stroke: C.acc });
  d.text(155, 70, 'coordination store', { cls: 'ttl', color: C.acc });
  [0, 1, 2].forEach((i) => node(d, 50 + i * 76, 86, '', i === 0, 52, 58));
  [['owner epoch 8', 166], ['config rev 42', 196], ['members A B C', 226]].forEach(([s, y]) => chip(d, 60, y - 10, 190, s, false, 22));
  d.line(300, 50, 300, 270, { stroke: C.acc, sw: 1.6, single: true, dash: [6, 4] });
  d.text(300, 286, 'boundary', { cls: 'xs', color: C.acc });
  d.server(340, 80, 70, 90, { label: 'publisher' });
  pipe(d, 416, 610, 125, 40);
  for (let k = 0; k < 5; k++) d.travel([[420, 125], [606, 125]], { dur: 2, at: [k / 5, k / 5 + 0.5], token: (g) => g.doc(-8, -10, 16, 20, { lines: false }) });
  d.text(510, 170, 'payload path', { cls: 'sm' });
  d.text(470, 220, 'the store is consulted to decide,\nnot to carry the bytes', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_distributed_systems_split() { return systemFigure("sd_distributed_systems_split", "TWO BELIEFS MUST NOT BECOME TWO VALID OWNERS", "split", [["old owner", "cached membership\nstale authority"], ["new owner", "new membership\nvalid authority"]], "a configuration update is another coordinated change"); }
export function sd_distributed_systems_full() {
  const d = illustration('sd_distributed_systems_full', 'COMMAND, REPLICATE, COMMIT, THEN READ AT LEAST THAT POSITION', 340);
  d.person(50, 60, 32, { label: 'scorer' });
  node(d, 280, 52, 'leader'); node(d, 520, 52, 'follower');
  const st = [[80, 309, 'c9 + key', 120, C.ink2], [338, 549, 'replicate entry 9', 150, C.ink2], [549, 338, 'ack', 180, C.ink2], [309, 80, 'committed at 9', 210, C.ink2], [80, 549, 'read, min position 9', 250, C.acc]];
  st.forEach(([a, b, s, y, col], i) => { d.arrow(a, y, b, y, { stroke: col }); d.mono((a + b) / 2, y - 10, s, { size: 9.5, color: col === C.acc ? C.acc : undefined }); d.travel([[a, y], [b, y]], { dur: 10, at: [i / 5, (i + 0.8) / 5], r: 3.5, color: col }); });
  [80, 309, 549].forEach((x) => d.line(x, 106, x, 270, { stroke: C.line, dash: [3, 5], single: true }));
  d.glow((g) => g.circle(549, 250, 14, { stroke: C.acc }));
  d.text(320, 312, 'the follower serves the read only once it has applied 9', { cls: 'sm' });
  return d.svg();
}
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

export function sd_ds_trace_1() {
  const d = illustration('sd_ds_trace_1', 'THE NETWORK SPLITS BETWEEN THREE LIVE MACHINES', 330);
  node(d, 70, 100, 'A'); node(d, 360, 70, 'B'); node(d, 500, 160, 'C');
  [0, 1, 2].forEach((i) => d.mono([99, 389, 529][i], [96, 66, 156][i], 'v7: 10', { size: 9.5 }));
  d.line(418, 110, 500, 180, { stroke: C.ink2, single: true });
  d.travel([[418, 110], [500, 180], [418, 110]], { dur: 3, r: 3, color: C.ink2 });
  d.line(128, 130, 360, 100, { stroke: C.line, single: true, dash: [3, 4] });
  d.line(128, 140, 500, 190, { stroke: C.line, single: true, dash: [3, 4] });
  cut(d, 250, 50, 260);
  d.text(100, 210, 'A alone, still running', { cls: 'sm' });
  d.text(450, 260, 'B + C still talk', { cls: 'sm' });
  d.phone(60, 236, 50); d.arrow(92, 252, 100, 190, { stroke: C.acc, hl: 6 });
  d.text(320, 306, 'each request at A must choose: current authority, or a labelled old copy', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_ds_trace_2() {
  const d = illustration('sd_ds_trace_2', 'A ACCEPTED 11, THE MESSAGE TO B IS BLOCKED, AND A READER ASKS B', 330);
  node(d, 60, 80, 'A'); node(d, 480, 80, 'B');
  d.mono(89, 74, 'score 11', { size: 10, color: C.acc }); d.mono(509, 74, 'score 10', { size: 10 });
  d.arrow(126, 110, 474, 110, { stroke: C.ink2, dash: [4, 4] });
  d.travel([[126, 110], [300, 110]], { dur: 4, at: [0, 0.5], label: '11', w: 24 });
  cut(d, 310, 70, 150);
  d.person(580, 220, 34, { label: 'reader' });
  d.arrow(570, 230, 540, 160, { stroke: C.ink2, hl: 6 });
  panel(d, 60, 200, 220, 96, 'B can only', true);
  d.text(170, 242, 'wait for the partition to heal', { cls: 'sm' });
  d.text(170, 264, 'or answer 10 and say so', { cls: 'sm' });
  d.text(420, 300, 'it cannot promise both', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_ds_trace_3() {
  const d = illustration('sd_ds_trace_3', 'DURING THE SPLIT, EACH OPERATION GETS ITS OWN ANSWER', 340);
  node(d, 40, 60, 'A', false, 48, 52); node(d, 160, 60, 'B', false, 48, 52); node(d, 230, 60, 'C', false, 48, 52);
  cut(d, 120, 46, 140);
  d.text(64, 152, '1 of 3', { cls: 'xs' }); d.text(220, 152, '2 of 3', { cls: 'xs' });
  const rows = [['correction at A', 'reject: no majority', false], ['correction at B', 'protocol may commit', false], ['public read', 'return v7, labelled older', false], ['authority read', 'wait, route or reject', true]];
  rows.forEach(([s, t, hot], i) => { const y = 186 + i * 36; d.text(40, y, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined }); d.arrow(200, y, 250, y, { stroke: hot ? C.acc : C.gray, hl: 5 }); d.text(262, y, t, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); });
  d.text(470, 90, 'one product,\nseveral contracts', { cls: 'hand', size: 18, vc: true });
  return d.svg();
}
export function sd_ds_trace_4() {
  const d = illustration('sd_ds_trace_4', 'C9 COMMITTED, THE REPLY WAS LOST, AND THE RETRY RETURNS 11 AGAIN', 330);
  d.person(50, 70, 32, { label: 'client' });
  d.db(440, 56, 130, 110, { label: 'score 11\nc9 → 11' });
  d.arrow(82, 90, 432, 90, { stroke: C.ink2 }); d.mono(260, 78, 'c9: add 1', { size: 10 });
  d.arrow(432, 120, 250, 120, { stroke: C.gray }); bolt(d, 240, 104, 0.8); d.mono(340, 134, 'reply lost', { size: 9.5 });
  d.clock(60, 180, 34, { spin: 3 }); d.text(60, 214, 'timeout: unknown', { cls: 'xs' });
  d.arrow(82, 240, 432, 240, { stroke: C.acc }); d.mono(260, 228, 'retry c9 (same key)', { size: 10, color: C.acc });
  d.arrow(432, 270, 82, 270, { stroke: C.acc }); d.mono(260, 284, 'stored result: 11', { size: 10, color: C.acc });
  d.travel([[82, 240], [432, 240], [432, 270], [82, 270]], { dur: 4, label: 'c9', w: 26 });
  d.line(505, 170, 505, 230, { stroke: C.line, single: true });
  d.text(520, 220, 'not 12', { cls: 'sm', a: 'start', color: C.acc });
  return d.svg();
}
export function sd_ds_trace_5() {
  const d = illustration('sd_ds_trace_5', 'LINEARIZABLE: A READ THAT STARTS AFTER THE WRITE ENDS MUST NOT SEE 10', 320);
  const X = 70, s = 64;
  ruler(d, X, 250, 7 * s, 7, 1, '');
  const bar = (a, b, y, label, hot, ret) => { d.rect(X + a * s, y, (b - a) * s, 30, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(X + a * s + 8, y + 15, label, { cls: 'sm', a: 'start' }); if (ret) d.mono(X + b * s + 10, y + 15, ret, { a: 'start', size: 10, color: hot ? C.acc : undefined }); };
  bar(2, 5, 60, 'write 10 → 11', false, '');
  bar(1, 3, 120, 'read X', false, '10 or 11 ok');
  bar(6, 7, 180, 'read Y', true, 'returns 10 ✗');
  d.line(X + 5 * s, 50, X + 5 * s, 240, { stroke: C.ink2, dash: [3, 4], single: true });
  d.text(X + 5 * s, 44, 'write completes', { cls: 'xs' });
  cross(d, X + 7 * s + 64, 195, 7);
  d.text(320, 296, 'X overlaps the write, so either value is legal; Y does not', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_6() {
  const d = illustration('sd_ds_trace_6', 'C MISSED V8; ANTI-ENTROPY FINDS THE GAP AND REPAIRS TO [8, 8, 8]', 330);
  const stages = [['update', [8, 8, 7]], ['compare', [8, 8, 7]], ['repaired', [8, 8, 8]]];
  stages.forEach(([s, v], i) => {
    const x = 30 + i * 204, hot = i === 2;
    panel(d, x, 48, 186, 220, s, hot);
    ['A', 'B', 'C'].forEach((n, k) => { const y = 82 + k * 58; d.server(x + 24, y, 40, 44, { unit: 13, fill: v[k] === 7 ? C.paper : hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 84, y + 22, `${n}: v${v[k]}`, { size: 11, a: 'start', color: v[k] === 7 ? C.gray : undefined }); });
    if (i === 1) { d.carrow([[x + 130, 112], [x + 168, 160], [x + 130, 216]], { stroke: C.ink2, hl: 6 }); d.text(x + 150, 250, 'C asks for v8', { cls: 'xs' }); }
    if (i === 0) cross(d, x + 160, 220, 7, C.gray);
  });
  d.travel([[296, 112], [296, 216]], { dur: 3, label: 'v8', w: 26 });
  d.text(320, 300, 'convergence needs a repair path, not just time', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_7() {
  const d = illustration('sd_ds_trace_7', 'B HOLDS THE REPLY UNTIL THE COMPLAINT IT ANSWERS HAS ARRIVED', 330);
  d.doc(40, 60, 100, 70, { lines: false }); d.text(90, 84, 'complaint P', { cls: 'sm' }); d.mono(90, 106, 'A:7', { size: 11 });
  d.doc(40, 180, 100, 70, { lines: false, fill: C.accSoft, stroke: C.acc }); d.text(90, 204, 'reply Q', { cls: 'sm' }); d.mono(90, 226, 'B:4, needs A:7', { size: 9.5 });
  d.server(380, 100, 90, 120, { label: 'replica', unit: 20 });
  d.arrow(146, 216, 372, 170, { stroke: C.acc });
  d.arrow(146, 96, 372, 130, { stroke: C.ink2, dash: [4, 4] });
  d.travel([[146, 96], [372, 130]], { dur: 6, at: [0.4, 0.75], label: 'P', w: 20, fill: C.card, color: C.ink2 });
  d.during([0, 0.75], (g) => { g.rect(480, 150, 120, 30, { r: 4, fill: C.accFaint, stroke: C.acc }); g.text(540, 165, 'Q held', { cls: 'sm', color: C.acc }); });
  d.during([0.75, 1], (g) => { g.rect(480, 150, 120, 30, { r: 4, fill: C.accSoft, stroke: C.acc }); g.text(540, 165, 'Q released', { cls: 'sm', color: C.acc }); });
  d.mono(425, 254, 'seen: A:6 → A:7', { size: 10 });
  d.text(320, 300, 'the dependency travels with the reply', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_8() {
  const d = illustration('sd_ds_trace_8', 'THE SESSION CARRIES "AT LEAST 8"; A AT 7 IS SKIPPED, B AT 9 SERVES', 330);
  d.phone(36, 80, 80);
  chip(d, 20, 180, 110, 'min position 8', false, 24);
  d.during([0.75, 1], (g) => chip(g, 20, 210, 110, 'next min 12', true, 24));
  node(d, 300, 50, 'replica A'); d.mono(329, 46, 'applied 7', { size: 9.5, color: C.gray });
  node(d, 300, 186, 'replica B', true); d.mono(329, 182, 'applied 9', { size: 9.5, color: C.acc });
  d.arrow(84, 110, 292, 80, { stroke: C.gray, dash: [4, 4] }); cross(d, 220, 90, 7, C.gray);
  d.arrow(84, 130, 292, 216, { stroke: C.acc });
  d.travel([[84, 130], [292, 216], [84, 140]], { dur: 4, at: [0, 0.7], r: 3.5 });
  d.text(500, 200, 'reply says\n"observed 12"', { cls: 'sm', vc: true });
  d.text(320, 300, 'routing alone proves nothing; the position does', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_9() {
  const d = illustration('sd_ds_trace_9', 'THE LEADER ORDERS C9 AT 8 AND C10 AT 9; C HAS ONLY REACHED 8', 330);
  const rows = [['A leader', ['c9', 'c10'], 'score 12'], ['B follower', ['c9', 'c10'], 'score 12'], ['C follower', ['c9', ''], 'score 11']];
  rows.forEach(([s, l, sc], i) => {
    const y = 58 + i * 76, stale = i === 2;
    node(d, 30, y, '', i === 0, 46, 50); d.text(90, y + 24, s, { cls: 'ttl', a: 'start', size: 12 });
    d.mono(232, y - 2, '8', { size: 9 }); d.mono(290, y - 2, '9', { size: 9 });
    d.tape(204, y + 10, l, { cw: 58, h: 28 });
    d.mono(380, y + 24, sc, { size: 11, color: stale ? C.gray : undefined });
    if (stale) { d.rect(450, y + 6, 150, 36, { r: 4, fill: C.accFaint, stroke: C.acc }); d.text(525, y + 24, 'not eligible for\na current read', { cls: 'xs', color: C.acc, vc: true }); }
  });
  d.travel([[110, 90], [290, 240]], { dur: 4, label: 'c10', w: 30 });
  d.text(320, 300, 'one leader gives writes a single order', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_10() {
  const d = illustration('sd_ds_trace_10', 'A FOLLOWER 5 S BEHIND AT 20 EVENTS/S EXPOSES 100 EVENTS, 20,000 BYTES', 300);
  node(d, 40, 80, 'old leader');
  d.tape(130, 90, Array(10).fill(''), { cw: 46, h: 30, hot: (i) => i >= 5 });
  node(d, 40, 180, 'candidate');
  d.tape(130, 190, Array(5).fill(''), { cw: 46, h: 30 });
  d.brace(360, 590, 132, { label: '5 s × 20 events/s = 100 events' });
  d.mono(475, 252, '100 × 200 B = 20,000 B', { size: 11, color: C.acc });
  d.text(320, 284, 'exposure if the candidate is promoted, not proven loss', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_11() {
  const d = illustration('sd_ds_trace_11', 'TWO LEADERS ACCEPT 11 AND 12 AT THE SAME TIME; RECONNECT NEEDS A MERGE RULE', 330);
  node(d, 60, 60, 'leader A'); node(d, 520, 60, 'leader B');
  d.mono(89, 56, 'score 10', { size: 9.5 }); d.mono(549, 56, 'score 10', { size: 9.5 });
  d.envelope(50, 170, 80, 40); d.mono(90, 226, 'replace → 11', { size: 10 });
  d.envelope(510, 170, 80, 40); d.mono(550, 226, 'replace → 12', { size: 10 });
  cut(d, 320, 50, 150);
  d.carrow([[140, 190], [230, 260], [300, 266]], { stroke: C.ink2, hl: 6 }); d.carrow([[500, 190], [410, 260], [340, 266]], { stroke: C.ink2, hl: 6 });
  d.rect(250, 248, 140, 44, { r: 6, fill: C.accSoft, stroke: C.acc });
  d.text(320, 270, 'reconnect: 11 or 12?', { cls: 'sm', color: C.acc });
  d.text(320, 312, 'last-writer-wins drops one; the domain must choose or flag a conflict', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_12() {
  const d = illustration('sd_ds_trace_12', 'THE READ SET MEETS THE WRITE SET AT B; THE CLIENT STILL PICKS THE NEWER VERSION', 320);
  node(d, 100, 90, 'A'); node(d, 290, 90, 'B', true); node(d, 480, 90, 'C');
  d.mono(129, 86, 'v8', { size: 10 }); d.mono(319, 86, 'v8', { size: 10, color: C.acc }); d.mono(509, 86, 'v7', { size: 10 });
  d.rect(80, 70, 290, 110, { r: 10, stroke: C.ink2, dash: [5, 4] }); d.text(120, 60, 'write {A, B}', { cls: 'xs' });
  d.rect(270, 64, 290, 122, { r: 10, stroke: C.acc, dash: [5, 4] }); d.text(520, 56, 'read {B, C}', { cls: 'xs', color: C.acc });
  d.person(320, 220, 30);
  d.arrow(319, 210, 319, 186, { stroke: C.acc, hl: 5 }); d.arrow(340, 220, 500, 186, { stroke: C.ink2, hl: 5 });
  d.text(450, 256, 'gets v8 and v7 → keeps v8', { cls: 'sm', color: C.acc });
  d.mono(160, 256, '2 + 2 − 3 = 1', { size: 11 });
  return d.svg();
}
export function sd_ds_trace_13() {
const d=illustration('sd_ds_trace_13','HEARTBEAT SILENCE IS EVIDENCE OF LOST CONTACT, NOT PROOF OF DEATH',335);
  const X=t=>84+t*119;d.arrow(60,126,597,126,{stroke:C.ink2});
  [0,1,2,3,4].forEach(t=>{d.line(X(t),122,X(t),139,{stroke:C.line,single:true});d.mono(X(t),159,t,{size:11});});
  d.envelope(X(0)-20,77,40,28);[1,2].forEach(t=>{d.circle(X(t),90,22,{stroke:C.line,dash:[3,4]});});
  d.clock(X(3),86,43);d.text(X(3),197,'suspect',{cls:'ttl',color:C.acc});d.cpu(X(4)-21,72,42,{label:'old'});d.text(X(4),197,'resumes',{cls:'ttl'});
  d.text(320,250,'a paused old worker can return after replacement is proposed',{cls:'sm'});d.text(320,293,'ownership needs enforcement at the effect boundary',{cls:'ttl'});return d.svg();
}

export function sd_ds_trace_14() {
  const d = illustration('sd_ds_trace_14', 'A\'S LEASE EXPIRES AT TIME 3 WHILE A IS PAUSED; AT TIME 4 IT RESUMES WITHOUT AUTHORITY', 330);
  const X = 60, s = 120;
  ruler(d, X, 260, 4 * s, 4, 1, '');
  d.rect(X, 70, 3 * s, 34, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 1.5 * s, 87, 'A holds lease (expires at 3)', { cls: 'sm' });
  d.fillRect(X + 2 * s, 120, 2 * s, 30, C.slateSoft, 1, 3); d.text(X + 3 * s, 135, 'A paused (GC, VM stall)', { cls: 'xs' });
  d.rect(X + 3 * s, 170, s, 34, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 3.5 * s, 187, 'B acquires', { cls: 'sm' });
  d.line(X + 3 * s, 60, X + 3 * s, 252, { stroke: C.ink2, dash: [3, 4], single: true });
  d.clock(X + 4 * s, 70, 34, { spin: 4 });
  d.envelope(X + 4 * s - 20, 214, 40, 26, { fill: C.accSoft, stroke: C.acc });
  d.text(X + 4 * s - 30, 226, 'A writes', { cls: 'xs', a: 'end', color: C.acc });
  d.text(320, 306, 'A checked the lease at time 2; nothing re-checks it at time 4', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_15() {
  const d = illustration('sd_ds_trace_15', 'B INSTALLS TOKEN 8 AT STORAGE BEFORE ACTING; A\'S TOKEN 7 BOUNCES', 330);
  const st = [['1', 'storage highest 7'], ['2', 'coordinator issues 8'], ['3', 'B installs 8, persisted'], ['4', 'A writes with 7']];
  st.forEach(([n, s], i) => { const y = 58 + i * 46, hot = i === 3; d.circle(48, y, 26, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(48, y, n, { size: 11 }); d.text(72, y, s, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); });
  d.db(380, 70, 130, 130, { label: 'storage' });
  d.during([0, 0.45], (g) => g.mono(445, 160, 'highest 7', { size: 11 }));
  d.during([0.45, 1], (g) => g.mono(445, 160, 'highest 8', { size: 11, color: C.acc }));
  d.travel([[600, 80], [516, 120]], { dur: 6, at: [0.25, 0.45], label: '8', w: 20, fill: C.card, color: C.ink2 });
  d.travel([[600, 250], [516, 180], [590, 270]], { dur: 6, at: [0.6, 1], label: '7', w: 20 });
  d.text(450, 290, '7 < 8: reject before any effect', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_ds_trace_16() {
  const d = illustration('sd_ds_trace_16', 'THE TOKEN SAYS WHO MAY WRITE; THE COMMAND ID SAYS WHETHER IT ALREADY HAPPENED', 330);
  const rows = [['c9', '8', '10 → 11', 'applied', false], ['c9 again', '8', 'stored 11', 'recorded result', false], ['c10', '8', '11 → 12', 'applied', false], ['c11', '7', 'no effect', 'old owner rejected', true]];
  d.text(80, 50, 'command', { cls: 'xs' }); d.text(200, 50, 'token', { cls: 'xs' }); d.text(330, 50, 'score', { cls: 'xs' });
  rows.forEach(([c, t, sc, r, hot], i) => {
    const y = 70 + i * 52;
    d.envelope(50, y, 60, 34, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.mono(80, y + 46, c, { size: 9.5 });
    chip(d, 180, y + 6, 40, t, hot);
    d.mono(330, y + 17, sc, { size: 11, color: hot ? C.gray : undefined });
    d.text(450, y + 17, r, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
    if (hot) cross(d, 420, y + 17, 7);
  });
  return d.svg();
}
export function sd_ds_trace_17() {
  const d = illustration('sd_ds_trace_17', 'THE SAME AGREED LOG AND THE SAME RULES GIVE EVERY REPLICA THE SAME STATE', 330);
  d.text(170, 50, 'agreed log', { cls: 'ttl' });
  d.tape(60, 64, ['8: c9 expects v7', '9: c10 expects v7'], { cw: 120, h: 32 });
  d.text(120, 116, 'accept → 11, v8', { cls: 'xs' }); d.text(240, 116, 'reject: now v8', { cls: 'xs', color: C.acc });
  cross(d, 290, 80, 7, C.acc);
  ['A', 'B', 'C'].forEach((n, i) => {
    const x = 380 + i * 80;
    d.server(x, 60, 56, 70, { unit: 14, fill: C.accSoft, stroke: C.acc });
    d.mono(x + 28, 148, n, { size: 11 });
    d.mono(x + 28, 168, 'score 11', { size: 9 }); d.mono(x + 28, 184, 'v8', { size: 9, color: C.acc });
    d.arrow(306, 80, x - 4, 92, { stroke: C.line, hl: 5 });
  });
  d.travel([[306, 80], [380, 92]], { dur: 3, r: 3 });
  d.text(320, 250, 'state machines start equal, apply the same commands in the same order,', { cls: 'sm' });
  d.text(320, 270, 'and so finish equal', { cls: 'sm' });
  return d.svg();
}
export function sd_ds_trace_18() {
  const d = illustration('sd_ds_trace_18', 'THREE VOTERS NEED TWO CONNECTED: SAFE BUT STUCK WHEN NO PAIR CAN TALK', 320);
  const cases = [['all up', [1, 1, 1], [[0, 1], [1, 2], [0, 2]], 'progress'], ['one lost', [1, 1, 0], [[0, 1]], 'progress'], ['two lost', [1, 0, 0], [], 'stopped'], ['isolated', [1, 1, 1], [], 'stopped']];
  cases.forEach(([s, up, links, res], i) => {
    const x = 26 + i * 152, hot = i === 3, pts = [[x + 64, 72], [x + 24, 150], [x + 104, 150]];
    panel(d, x, 44, 136, 210, '', hot);
    links.forEach(([a, b]) => d.line(...pts[a], ...pts[b], { stroke: C.ink2, single: true }));
    if (i === 3) [[0, 1], [1, 2], [0, 2]].forEach(([a, b]) => { d.line(...pts[a], ...pts[b], { stroke: C.faint, single: true, dash: [3, 4] }); cross(d, (pts[a][0] + pts[b][0]) / 2, (pts[a][1] + pts[b][1]) / 2, 5, C.acc); });
    pts.forEach(([px, py], k) => d.circle(px, py, 28, { fill: up[k] ? C.card : C.paper, stroke: up[k] ? C.ink2 : C.faint }));
    d.text(x + 68, 196, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.text(x + 68, 220, res, { cls: 'sm', color: res === 'stopped' ? C.acc : undefined });
  });
  d.text(320, 290, 'majority of 3 is 2: no connected pair, no new commits, no split decisions', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_19() {
  const d = illustration('sd_ds_trace_19', 'STORED THROUGH 10, COMMITTED THROUGH 9, APPLIED THROUGH 8', 300);
  d.tape(70, 90, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], { cw: 50, h: 34, fill: (i) => i < 8 ? C.card : i === 8 ? C.accSoft : C.paper });
  [['applied 8', 8, C.ink2, 70], ['committed 9', 9, C.acc, 160], ['stored 10', 10, C.gray, 70]].forEach(([s, k, col, dy], i) => {
    const x = 70 + k * 50;
    d.line(x, 84, x, 140 + i * 24, { stroke: col, single: true, sw: 1.4 });
    d.text(x - 4, 140 + i * 24 + 8, s, { cls: 'sm', a: 'end', color: col });
  });
  d.travel([[70, 107], [470, 107]], { dur: 4, at: [0, 0.6], token: (g) => g.line(0, -20, 0, 20, { stroke: C.acc, sw: 1.4, single: true }) });
  d.text(320, 250, 'a read that needs position 9 waits until the view applies 9', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_ds_trace_20() {
  const d = illustration('sd_ds_trace_20', 'CONSENSUS ENDS AT THE COMMIT; THE RELAY AND CONSUMER NEED THEIR OWN DEDUPE', 330);
  d.rect(30, 50, 170, 150, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(115, 70, 'authoritative commit', { cls: 'ttl', size: 12 });
  chip(d, 46, 94, 138, 'score 11'); chip(d, 46, 124, 138, 'outbox: e9');
  d.server(270, 88, 70, 80, { label: 'relay' });
  d.arrow(206, 128, 262, 128, { stroke: C.ink2, hl: 6 });
  d.travel([[346, 120], [470, 120]], { dur: 4, at: [0, 0.4], label: 'e9', w: 26, fill: C.card, color: C.ink2 });
  d.travel([[346, 140], [470, 140]], { dur: 4, at: [0.5, 0.9], label: 'e9', w: 26 });
  d.text(408, 170, 'ack lost → resend', { cls: 'xs' });
  d.rect(480, 70, 130, 130, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(545, 90, 'consumer', { cls: 'ttl', color: C.acc });
  chip(d, 494, 110, 102, 'seen e9?', true); chip(d, 494, 140, 102, 'effect once');
  d.line(234, 40, 234, 220, { stroke: C.acc, dash: [6, 4], single: true }); d.text(234, 236, 'agreement stops here', { cls: 'xs', color: C.acc });
  d.text(320, 290, 'duplicates are possible after the boundary; one effect is still guaranteed', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_21() {
  const d = illustration('sd_ds_trace_21', 'B TIMES OUT, MOVES TO TERM 5, WINS 2 VOTES; OLD LEADER A STEPS DOWN', 320);
  node(d, 60, 70, 'A'); node(d, 290, 70, 'B', true); node(d, 520, 70, 'C');
  d.mono(89, 64, 'leader t4', { size: 9.5 }); d.mono(319, 64, 'cand. t5', { size: 9.5, color: C.acc }); d.mono(549, 64, 'follower', { size: 9.5 });
  d.clock(320, 190, 30, { spin: 3 }); d.text(320, 222, 'election timeout', { cls: 'xs' });
  d.arrow(354, 100, 512, 100, { stroke: C.acc }); d.mono(434, 90, 'vote? t5', { size: 9 });
  d.arrow(512, 120, 354, 120, { stroke: C.acc }); d.mono(434, 134, 'yes', { size: 9 });
  d.travel([[354, 100], [512, 100], [512, 120], [354, 120]], { dur: 4, r: 3 });
  d.arrow(126, 110, 282, 110, { stroke: C.gray, dash: [4, 4] }); d.mono(204, 98, 'append t4', { size: 9 });
  d.arrow(282, 130, 126, 130, { stroke: C.acc }); d.mono(204, 144, 'term is 5', { size: 9, color: C.acc });
  d.text(90, 180, 'A sees a newer\nterm: steps down', { cls: 'sm', vc: true });
  d.text(320, 282, 'votes: B (self) + C = 2 of 3', { cls: 'sm' });
  return d.svg();
}
export function sd_ds_trace_22() {
  const d = illustration('sd_ds_trace_22', 'COMPARE THE LAST TERM FIRST, THEN THE LENGTH', 320);
  const rows = [['B', 4, 8, true], ['C', 3, 9, false], ['D', 4, 7, false]];
  rows.forEach(([s, t, idx, hot], i) => {
    const y = 60 + i * 66;
    d.mono(40, y + 15, s, { size: 13, color: hot ? C.acc : undefined });
    const cells = Array.from({ length: idx }, (_, k) => (k === idx - 1 ? `t${t}` : ''));
    d.tape(70, y, cells, { cw: 42, h: 30, hot: (k) => k === idx - 1 && hot });
    d.mono(70 + idx * 42 + 12, y + 15, `(term ${t}, index ${idx})`, { a: 'start', size: 9.5 });
  });
  d.text(320, 268, 'B beats C: term 4 > 3, even though C is longer', { cls: 'sm', color: C.acc });
  d.text(320, 290, 'B beats D: same term, 8 > 7. Plus: one vote per term', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_23() {
  const d = illustration('sd_ds_trace_23', 'THE LEADER BACKS UP TO THE LAST MATCH, THEN OVERWRITES C\'S CONFLICTING TAIL', 330);
  d.text(40, 62, 'B (leader)', { cls: 'ttl', a: 'start' });
  d.tape(150, 48, ['1', '2', '4:c9'], { cw: 60, h: 28 });
  d.text(40, 120, 'C before', { cls: 'ttl', a: 'start' });
  d.tape(150, 106, ['1', '2', '3:x'], { cw: 60, h: 28 });
  cross(d, 300, 120, 8, C.gray);
  d.text(470, 68, '"prev = (3, term 4)?"  no', { cls: 'xs' });
  d.text(470, 92, '"prev = (2, term 2)?"  yes', { cls: 'xs' });
  d.carrow([[300, 150], [260, 172], [240, 140]], { stroke: C.ink2, hl: 5 });
  d.text(40, 206, 'C after', { cls: 'ttl', a: 'start', color: C.acc });
  d.tape(150, 192, ['1', '2', '4:c9'], { cw: 60, h: 28, hot: (i) => i === 2 });
  d.travel([[300, 62], [300, 206]], { dur: 4, label: 'c9', w: 26 });
  d.text(320, 270, 'only uncommitted entries can be replaced this way', { cls: 'sm' });
  return d.svg();
}
export function sd_ds_trace_24() {
  const d = illustration('sd_ds_trace_24', 'ENTRY 9 IN TERM 5 COMMITS ON B + C; A LOST REPLY IS RECOVERED BY RETRY', 330);
  node(d, 40, 60, 'B leader t5', true); node(d, 260, 60, 'C'); node(d, 480, 60, 'A (slow)');
  d.tape(30, 150, ['t4:8', 't5:9'], { cw: 50, h: 26, hot: (i) => i === 1 });
  d.tape(250, 150, ['t4:8', 't5:9'], { cw: 50, h: 26, hot: (i) => i === 1 });
  d.tape(470, 150, ['t4:8', ''], { cw: 50, h: 26 });
  d.arrow(104, 92, 252, 92, { stroke: C.acc }); d.travel([[104, 92], [252, 92]], { dur: 4, at: [0, 0.4], label: '9', w: 20 });
  d.text(220, 210, '2 of 3 hold entry 9: committed', { cls: 'sm', color: C.acc });
  d.person(70, 240, 28); d.arrow(98, 254, 200, 254, { stroke: C.ink2, hl: 6 }); bolt(d, 150, 236, 0.6);
  d.text(320, 256, 'reply lost', { cls: 'xs', a: 'start' });
  d.text(320, 300, 'retry with the same command id returns the recorded result', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_25() {
  const d = illustration('sd_ds_trace_25', 'ZOOKEEPER OR ETCD HOLDS THE EPOCH; 1,000,000 DELIVERIES/S GO ELSEWHERE', 320);
  d.rect(30, 60, 200, 160, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(130, 80, 'etcd / ZooKeeper', { cls: 'ttl' });
  chip(d, 46, 100, 168, 'publisher: B, epoch 8', true); chip(d, 46, 132, 168, 'config rev 42');
  d.mono(130, 186, 'compare-and-set on rev', { size: 9.5 });
  d.server(290, 80, 70, 100, { label: 'publisher B' });
  d.arrow(236, 116, 282, 116, { stroke: C.acc, hl: 6 }); d.text(259, 104, 'epoch', { cls: 'xs', color: C.acc });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) d.phone(420 + c * 30, 60 + r * 40, 30, { stroke: C.gray });
  d.flowline([[366, 130], [416, 130]], { sw: 3 });
  d.mono(510, 236, '20 × 50,000 = 1,000,000 deliveries/s', { size: 9.5 });
  d.text(320, 290, 'the epoch is checked at the write boundary; payload never enters the store', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_26() {
  const d = illustration('sd_ds_trace_26', 'A WATCH RESUMES FROM REVISION 8; 9 AND 10 MAY HAVE PASSED IN THE GAP', 320);
  d.tape(60, 70, ['6', '7', '8', '9', '10', '11'], { cw: 60, h: 30, hot: (i) => i === 3 || i === 4 });
  d.pin(60 + 3 * 60, 66, { label: 'processed 8', dy: -34, fill: C.card });
  d.brace(240, 360, 112, { label: 'disconnected' });
  d.text(320, 172, 'on reconnect: replay from 9 if retained,', { cls: 'sm' });
  d.text(320, 192, 'otherwise reread a snapshot and continue', { cls: 'sm' });
  d.db(250, 214, 140, 70, { fill: C.accSoft, stroke: C.acc, label: 'resource checks epoch' });
  d.text(320, 306, 'a stale belief can still reach the resource; the epoch check stops it', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_27() {
  const d = illustration('sd_ds_trace_27', 'TWO PROCESSES BELIEVE THEY OWN THE STREAM; STORAGE HONOURS ONLY EPOCH 8', 320);
  node(d, 50, 70, 'A: "I own it" (7)'); node(d, 520, 70, 'B: owner (8)', true);
  d.db(260, 160, 120, 110, { label: 'highest 8' });
  d.arrow(110, 140, 252, 200, { stroke: C.acc }); d.arrow(530, 140, 388, 200, { stroke: C.ink2 });
  d.travel([[110, 140], [252, 200], [120, 220]], { dur: 4, label: '7', w: 20 });
  cross(d, 236, 196, 9);
  tick(d, 404, 196, 8, C.ink2);
  d.text(320, 300, 'split brain is harmless only when the resource refuses the old epoch', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_28() {
  const d = illustration('sd_ds_trace_28', 'MOVING FROM {A,B,C} TO {C,D,E} PASSES THROUGH A JOINT PHASE', 320);
  const phase = [['old', 'ABC', ''], ['joint', 'ABC', 'CDE'], ['new', '', 'CDE']];
  phase.forEach(([s, o, n], i) => {
    const x = 30 + i * 204, hot = i === 1;
    panel(d, x, 48, 186, 200, s, hot);
    'ABCDE'.split('').forEach((c, k) => { const inO = o.includes(c), inN = n.includes(c); d.circle(x + 28 + k * 33, 110, 26, { fill: inO && inN ? C.accSoft : inO || inN ? C.card : C.paper, stroke: inO || inN ? C.ink2 : C.faint }); d.mono(x + 28 + k * 33, 110, c, { size: 10, color: inO || inN ? undefined : C.faint }); });
    d.text(x + 93, 170, i === 1 ? 'needs a majority of\nold AND of new' : i === 0 ? 'majority of A B C' : 'majority of C D E', { cls: 'sm', vc: true, color: hot ? C.acc : undefined });
    if (i < 2) d.arrow(x + 188, 150, x + 202, 150, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 290, 'skipping the joint phase lets {A,B} and {D,E} decide separately', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_29() {
  const d = illustration('sd_ds_trace_29', 'ONE SCORER CORRECTION, END TO END', 320);
  const st = [['input', 'c9, expects v7,\nepoch 8'], ['log', 'current-term entry\non 2 of 3'], ['apply', 'score + c9 + e9\nin one boundary'], ['observe', 'session read at\nrequired position']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    if (i === 0) d.person(x + 60, 60, 40);
    if (i === 1) d.tape(x + 20, 72, ['', '', 'c9'], { cw: 30, h: 26, hot: (k) => k === 2 });
    if (i === 2) d.db(x + 30, 54, 60, 60);
    if (i === 3) d.phone(x + 44, 50, 66, { stroke: C.acc });
    d.text(x + 60, 150, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x + 60, 184, t, { cls: 'sm', vc: true });
    if (i < 3) d.arrow(x + 112, 86, x + 142, 86, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 86], [540, 86]], { dur: 5, label: 'c9', w: 26 });
  d.text(320, 270, 'authenticate and validate before ordering; observe only after applying', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_30() {
  const d = illustration('sd_ds_trace_30', 'FOUR PLACES TO CRASH, FOUR RECOVERIES', 330);
  const X = 40, W = 560;
  d.arrow(X, 110, X + W, 110, { stroke: C.gray });
  const st = [['before commit', 'retry c9; never assume\nit failed'], ['after commit', 'look up c9\'s result'], ['after send', 'resend the same e9'], ['after consume', 'consumer dedupes e9']];
  st.forEach(([s, t], i) => {
    const x = X + 70 + i * 140, hot = i === 3;
    bolt(d, x, 66, 0.9, hot ? C.acc : C.ink2);
    d.text(x, 132, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.text(x, 172, t, { cls: 'sm', vc: true });
  });
  ['propose', 'commit', 'send', 'consume'].forEach((s, i) => d.mono(X + 140 * i + 20, 96, s, { size: 9, a: 'start', color: C.gray }));
  d.travel([[X, 110], [X + W, 110]], { dur: 6, r: 4 });
  d.text(320, 260, 'every recovery reuses an identity; none invents a new command', { cls: 'xs' });
  return d.svg();
}
export function sd_ds_trace_31() {
  const d = illustration('sd_ds_trace_31', 'A SNAPSHOT THROUGH 8, THEN APPLY 9 AND 10, NOTHING SKIPPED OR REPEATED', 300);
  d.rect(40, 80, 300, 50, { r: 6, fill: C.accSoft, stroke: C.acc });
  d.text(190, 100, 'snapshot: entries 1–8', { cls: 'ttl', color: C.acc });
  d.text(190, 118, 'score + retained c9 result', { cls: 'xs' });
  d.tape(350, 92, ['9', '10'], { cw: 60, h: 28 });
  d.travel([[350, 150], [470, 150]], { dur: 4, r: 4 });
  d.text(410, 172, 'apply in order', { cls: 'xs' });
  d.text(320, 220, 'install only a verified, compatible snapshot', { cls: 'sm' });
  d.text(320, 242, 'the next entry is exactly the one after its last included index', { cls: 'sm' });
  return d.svg();
}
export function sd_ds_trace_32() {
  const d = illustration('sd_ds_trace_32', 'STORAGE IS SMALL; DELIVERY TO 50,000 VIEWERS IS THE BILL', 330);
  d.doc(40, 66, 50, 64); d.mono(65, 146, '200 B', { size: 10 });
  [0, 1, 2].forEach((i) => d.db(130 + i * 50, 72, 40, 54));
  d.mono(205, 146, '× 3 = 600 B', { size: 10 });
  d.mono(160, 184, '20 × 200 × 3 = 12,000 B/s stored', { size: 10 });
  d.rect(330, 50, 280, 170, { r: 8, fill: C.accFaint, stroke: C.acc });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) d.phone(346 + c * 32, 62 + r * 36, 28, { stroke: C.gray });
  d.mono(470, 236, '20 × 200 × 50,000 = 200,000,000 B/s', { size: 10, color: C.acc });
  d.flowline([[260, 130], [326, 130]], { sw: 2.5 });
  d.text(320, 300, 'consensus protects the 600 B; it says nothing about delivering it', { cls: 'xs' });
  return d.svg();
}

import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const stage3 = (d, st, hotIdx, icons, note) => { st.forEach(([a, b], i) => { const x = 40 + i * 200, hot = i === hotIdx; panel(d, x, 48, 170, 190, a, hot); if (icons) icons(d, i, x + 85, 120, hot); d.text(x + 85, 210, b, { cls: 'xs', vc: true, color: hot ? C.acc : undefined }); if (i < st.length - 1) d.arrow(x + 172, 143, x + 198, 143, { stroke: C.gray, hl: 5 }); }); if (note) d.text(320, 270, note, { cls: 'xs' }); };
const ver = (d, x, y, v, hot = false) => { d.rect(x, y, 56, 30, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 28, y + 15, `v${v}`, { size: 11, color: hot ? C.acc : undefined }); };
export function where_sd_scaling_patterns(stage=99) { return systemMap("sd_scaling_patterns", ["Replication vs partitioning", "Sharding and consistent hashing", "CQRS and materialized views", "Event sourcing", "Transactional outbox and CDC", "Saga pattern", "Leader election, distributed locks", "Fan-out on write vs on read", "Case study: combining patterns"], stage); }
export function cover_sd_scaling_patterns() { return systemCover("sd_scaling_patterns", 20, ["Scaling", "patterns"], "Scaling patterns", ["Replication vs partitioning", "Sharding and consistent hashing", "CQRS and materialized views", "Event sourcing", "Transactional outbox and CDC", "Saga pattern", "Leader election, distributed locks", "Fan-out on write vs on read", "Case study: combining patterns"]); }
export function sd_scaling_patterns_01() {
  const d = illustration('sd_scaling_patterns_01', 'READS ARE SLOW: MEASURE WHETHER IT IS QUERY WORK OR POOL WAIT BEFORE PICKING A PATTERN', 300);
  stage3(d, [['observed', 'read delay,\ncause unknown'], ['measured', 'query 30 ms?\npool wait 60 ms?'], ['choice', 'reduce the measured\nwork, then test']], 2, (g, i, x, y, hot) => { if (i === 0) g.clock(x, y, 50, { spin: 3 }); if (i === 1) { g.rect(x - 60, y - 10, 40, 20, { r: 2, fill: C.card, stroke: C.ink2 }); g.rect(x - 20, y - 10, 80, 20, { r: 2, fill: C.paper, stroke: C.ink2, dash: [3, 3] }); } if (i === 2) g.gear(x, y, 24, { fill: C.accSoft, stroke: C.acc, spin: 5 }); }, 'an index cannot fix a pool queue; precomputation cannot fix lock waits');
  return d.svg();
}
export function sd_scaling_patterns_02() {
  const d = illustration('sd_scaling_patterns_02', 'TWO WRITERS EXPECT v7; ONE COMMITS v8, THE OTHER IS REJECTED', 300);
  d.person(60, 70, 32, { label: 'writer A' }); d.person(60, 190, 32, { label: 'writer B' });
  d.db(280, 110, 100, 90);
  d.during([0, 0.4], (g) => ver(g, 302, 210, 7)); d.during([0.4, 1], (g) => ver(g, 302, 210, 8, true));
  d.arrow(92, 90, 274, 140, { stroke: C.ink2 }); d.mono(180, 104, 'expect 7 → 8', { size: 9 });
  d.arrow(92, 210, 274, 170, { stroke: C.acc }); d.mono(180, 206, 'expect 7 (stale)', { size: 9, color: C.acc });
  cross(d, 250, 176, 8);
  d.text(500, 150, 'reject; retry is a new\ndecision on v8', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_scaling_patterns_03() {
  const d = illustration('sd_scaling_patterns_03', 'A FOLLOWER STILL ON v7 MAY NOT SERVE A READER WHO NEEDS v8, UNTIL IT APPLIES v8', 300);
  d.server(60, 80, 80, 90, { label: 'leader' }); ver(d, 72, 190, 8);
  d.server(300, 80, 80, 90, { label: 'follower' });
  d.during([0, 0.5], (g) => ver(g, 312, 190, 7)); d.during([0.5, 1], (g) => ver(g, 312, 190, 8, true));
  d.arrow(146, 125, 294, 125, { stroke: C.ink2 }); d.travel([[146, 125], [294, 125]], { dur: 6, at: [0.2, 0.5], label: 'v8', w: 24 });
  d.phone(520, 90, 70, { label: 'needs v8' });
  d.during([0.5, 1], (g) => g.arrow(512, 125, 386, 125, { stroke: C.acc }));
  d.text(320, 270, 'received in the log is not applied; healthy is not eligible', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_04() {
const d=illustration('sd_scaling_patterns_04','FOUR SHARDS SPLIT OWNERSHIP; BALANCED DEMAND IS AN ASSUMPTION',335);
  d.mono(320,49,'1,000 reads/s',{size:16});
  for(let i=0;i<4;i++){const x=38+i*152;d.server(x+23,119,89,96,{label:`owner ${String.fromCharCode(65+i)}`,unit:22,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});figShelf(d,x+5,263,['key range'],{width:126,height:27,hot:i===1?0:-1});d.arrow(320,67,x+67,111,{stroke:i===1?C.acc:C.line,hl:5});}
  d.mono(320,316,'1,000 ÷ 4 = 250 reads/s mean per shard, if balanced',{size:11});return d.svg();
}
export function sd_scaling_patterns_05() {
  const d = illustration('sd_scaling_patterns_05', 'KEYED BY MATCH, A SCORE WRITE HITS ONE OWNER; "MATCHES I FOLLOW" MUST ASK THEM ALL', 320);
  [0, 1, 2, 3].forEach((i) => { d.server(240 + i * 90, 60, 60, 70, { unit: 15, fill: i === 1 ? C.card : C.card }); d.mono(270 + i * 90, 146, `shard ${i}`, { size: 9 }); });
  d.envelope(40, 70, 70, 40, { label: 'score m7' }); d.arrow(116, 90, 324, 90, { stroke: C.ink2 });
  d.phone(60, 190, 60, { label: 'followed matches' });
  [0, 1, 2, 3].forEach((i) => { d.line(92, 220, 270 + i * 90, 134, { stroke: C.acc, single: true, dash: [3, 3] }); });
  d.rect(250, 200, 140, 40, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(320, 220, 'scatter + merge', { cls: 'sm', color: C.acc });
  d.text(320, 290, 'or keep a user-keyed derived index for that query', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_06() {
const d=illustration('sd_scaling_patterns_06','AN IDEAL HASH RING GIVES A NEW OWNER ONE FIFTH OF THE SPACE',370);
  const cx=214,cy=181,r=111,angles=Array.from({length:5},(_,i)=>-Math.PI/2+i*2*Math.PI/5);
  const a=angles[0],b=angles[1];d.path(`M${cx},${cy} L${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} A${r},${r} 0 0 1 ${cx+r*Math.cos(b)},${cy+r*Math.sin(b)} Z`,{fill:C.accFaint,stroke:C.acc,single:true});
  d.circle(cx,cy,r*2,{stroke:C.ink2});angles.forEach((a,i)=>{const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;d.circle(x,y,27,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono(x,y,String.fromCharCode(65+i),{size:10});});
  d.key(cx-20,cy,39);d.mono(477,126,'ring: 1 / 5',{size:17,color:C.acc});d.text(477,157,'ideal new-owner share',{cls:'sm'});
  d.mono(477,230,'modulo: 80 / 100',{size:13});d.text(477,258,'moved in the stated 4 → 5 example',{cls:'sm',size:10});
  d.text(320,338,'illustrative equal sectors; copy and routing-epoch handoff still required',{cls:'sm'});return d.svg();
}
export function sd_scaling_patterns_07() {
  const d = illustration('sd_scaling_patterns_07', 'ONE FINAL TAKES 600 OF 1,000 READS/S; BALANCED HASHING CANNOT SPLIT ONE KEY', 320);
  d.server(60, 80, 100, 130, { fill: C.accSoft, stroke: C.acc, led: () => true }); d.mono(110, 228, 'owner of m7: 600/s', { size: 10, color: C.acc });
  for (let k = 0; k < 6; k++) d.travel([[20, 70 + k * 20], [56, 140]], { dur: 1, at: [k / 6, k / 6 + 0.4], r: 2.5 });
  [0, 1, 2].forEach((i) => d.server(220 + i * 70, 120, 50, 60, { unit: 14 })); d.mono(305, 198, 'others: 400/s', { size: 10 });
  d.rect(470, 80, 140, 120, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(540, 100, 'mitigate', { cls: 'ttl', color: C.acc });
  d.ram(490, 120, 100, 30); d.text(540, 170, 'cache / read copies;\nwrites stay with owner', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_scaling_patterns_08() {
  const d = illustration('sd_scaling_patterns_08', 'COPY, CATCH UP, THEN SWITCH THE EPOCH SO THE OLD OWNER\'S WRITES ARE REFUSED', 300);
  stage3(d, [['copy', 'snapshot; source\nstill owns'], ['catch up', 'changes after\nthe snapshot'], ['switch', 'epoch 12 → 13;\nold owner fenced']], 2, (g, i, x, y, hot) => { if (i === 0) { g.db(x - 50, y - 26, 44, 50); g.db(x + 6, y - 26, 44, 50, { fill: C.paper }); g.arrow(x - 4, y, x + 4, y, { stroke: C.ink2, hl: 4 }); } if (i === 1) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24 }); if (i === 2) { g.db(x - 22, y - 26, 44, 50, { fill: C.accSoft, stroke: C.acc }); cross(g, x - 40, y - 30, 6); } }, 'check the stored epoch at the write, not a router\'s cached map');
  return d.svg();
}
export function sd_scaling_patterns_09() {
  const d = illustration('sd_scaling_patterns_09', 'CQRS: A COMMAND MODEL THAT ENFORCES RULES, A QUERY MODEL SHAPED FOR READERS, ONE DATABASE IS FINE', 300);
  d.rect(30, 70, 220, 120, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(140, 92, 'command model', { cls: 'ttl', size: 12 }); d.text(140, 120, 'validate transition', { cls: 'xs' }); d.text(140, 140, 'enforce version', { cls: 'xs' });
  d.rect(390, 70, 220, 120, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(500, 92, 'query model', { cls: 'ttl', size: 12 }); d.text(500, 120, 'score card shape', { cls: 'xs' });
  d.db(270, 200, 100, 70, { fill: C.accSoft, stroke: C.acc }); d.text(320, 284, 'can share one DB', { cls: 'xs', color: C.acc });
  d.arrow(140, 194, 268, 230, { stroke: C.ink2, hl: 6 }); d.arrow(500, 194, 372, 230, { stroke: C.ink2, hl: 6 });
  return d.svg();
}
export function sd_scaling_patterns_10() {
  const d = illustration('sd_scaling_patterns_10', 'THE SOURCE IS AT v8; THE MATERIALIZED CARD SHOWS v7 UNTIL v8 IS APPLIED', 280);
  d.db(60, 80, 100, 90, { label: 'source' }); ver(d, 82, 190, 8);
  d.arrow(166, 125, 300, 125, { stroke: C.ink2 }); d.travel([[166, 125], [300, 125]], { dur: 6, at: [0.2, 0.55], label: 'v8', w: 24 });
  d.doc(320, 70, 120, 110, { lines: false }); d.text(380, 96, 'score card', { cls: 'sm' });
  d.during([0, 0.55], (g) => ver(g, 352, 120, 7)); d.during([0.55, 1], (g) => ver(g, 352, 120, 8, true));
  d.text(530, 125, 'a late v7 must\nnot overwrite v8', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_scaling_patterns_11() {
  const d = illustration('sd_scaling_patterns_11', 'THE PROJECTION STORES EVENT e9 WITH ITS EFFECT; A REDELIVERED e9 FINDS IT AND STOPS', 300);
  d.tape(30, 100, ['e8', 'e9'], { cw: 50, h: 30, hot: (i) => i === 1 }); d.text(80, 86, 'broker', { cls: 'xs' });
  d.rect(250, 70, 200, 110, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(350, 88, 'one local transaction', { cls: 'xs', color: C.acc });
  chip(d, 266, 104, 168, 'seen(e9)', true); chip(d, 266, 138, 168, 'card update');
  d.arrow(136, 115, 244, 120, { stroke: C.ink2 });
  d.carrow([[136, 140], [200, 220], [256, 150]], { stroke: C.gray, dash: [4, 3] }); d.text(190, 236, 'ack lost → e9 again', { cls: 'xs' });
  cross(d, 246, 150, 6, C.acc);
  d.text(530, 125, 'no second\neffect', { cls: 'sm', vc: true, color: C.acc });
  return d.svg();
}
export function sd_scaling_patterns_12() {
  const d = illustration('sd_scaling_patterns_12', 'PAUSED 10 S AT 20 EVENTS/S = 200 BEHIND; 100 − 20 = 80 SPARE; 200 ÷ 80 = 2.5 S', 280);
  const X = 70, s = 30;
  d.line(X, 200, X + 14 * s, 200, { stroke: C.ink2, single: true }); d.line(X, 70, X, 200, { stroke: C.ink2, single: true });
  d.lines([[X, 200], [X + 10 * s, 80], [X + 12.5 * s, 200]], { stroke: C.acc, sw: 2, single: true });
  d.mono(X + 10 * s, 68, '200', { size: 10, color: C.acc });
  [0, 5, 10, 12.5].forEach((t) => d.mono(X + t * s, 214, `${t} s`, { size: 9 }));
  d.travel([[X, 200], [X + 10 * s, 80], [X + 12.5 * s, 200]], { dur: 5, r: 4 });
  d.text(530, 120, 'read-your-writes:\nwait for v, with\na deadline', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_scaling_patterns_13() {
const d=illustration('sd_scaling_patterns_13','EVENT SOURCING REPLAYS AUTHORITATIVE DOMAIN CHANGES INTO A VIEW',330);
  ['created','scored','corrected','closed'].forEach((s,i)=>figPage(d,41+i*141,70,116,119,s,i===2));
  d.line(36,210,601,210,{stroke:C.ink2,single:true});d.arrow(209,243,378,243,{stroke:C.acc});d.text(139,243,'replay rule',{cls:'ttl'});
  d.phone(469,216,81,{screen:C.accFaint});d.text(404,282,'derived current state',{cls:'sm',a:'end'});
  d.text(320,313,'the stored events are authority; the latest-state view is rebuildable',{cls:'sm'});return d.svg();
}
export function sd_scaling_patterns_14() {
  const d = illustration('sd_scaling_patterns_14', 'BOTH APPEND "EXPECTING v7"; THE FIRST MAKES v8, THE SECOND GETS A VERSION CONFLICT', 300);
  d.tape(200, 130, ['v5', 'v6', 'v7', 'v8'], { cw: 60, h: 32, hot: (i) => i === 3 });
  d.envelope(40, 70, 90, 44, { label: 'cmd A: expect 7' }); d.envelope(40, 190, 90, 44, { label: 'cmd B: expect 7' });
  d.arrow(136, 92, 380, 132, { stroke: C.ink2 }); tick(d, 300, 106, 6, C.ink2);
  d.arrow(136, 210, 380, 160, { stroke: C.acc }); cross(d, 300, 184, 7);
  d.text(500, 210, 'conflict: actual 8.\nreload, re-decide', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_scaling_patterns_15() {
  const d = illustration('sd_scaling_patterns_15', 'REPLAYING 1,000,000 EVENTS AT 20,000/S TAKES 50 S; A VERIFIED SNAPSHOT LEAVES 1,000 (0.05 S)', 300);
  const X = 40, W = 560, s = W / 1000000;
  d.rect(X, 80, W, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + W / 2, 95, 'full replay: 1,000,000 events → 50 s', { cls: 'xs' });
  d.rect(X, 140, W - 3, 30, { r: 2, fill: C.paper, stroke: C.ink2 }); d.text(X + W / 2 - 40, 155, 'snapshot', { cls: 'xs' });
  d.rect(X + W - 4, 140, 4, 30, { r: 0, fill: C.acc, stroke: C.acc }); d.text(X + W, 186, 'tail 1,000 → 0.05 s', { cls: 'xs', a: 'end', color: C.acc });
  chip(d, 200, 216, 240, 'verify source + schema + checksum first', true, 28);
  return d.svg();
}
export function sd_scaling_patterns_16() {
  const d = illustration('sd_scaling_patterns_16', 'REPLAY REBUILDS STATE, BUT MUST NEVER CHARGE THE CARD A SECOND TIME', 300);
  stage3(d, [['live event', 'derive state +\nrun effect workflow'], ['replayed event', 'derive state only;\nno new charge'], ['old schema', 'version interpreter,\nsame meaning']], 2, (g, i, x, y, hot) => { if (i === 0) { g.envelope(x - 50, y - 14, 44, 28); g.key(x + 10, y, 30); } if (i === 1) { g.envelope(x - 50, y - 14, 44, 28); g.key(x + 10, y, 30); cross(g, x + 25, y, 10, C.ink2); } if (i === 2) g.doc(x - 18, y - 26, 36, 50, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_scaling_patterns_17() {
  const d = illustration('sd_scaling_patterns_17', 'DATABASE FIRST OR BROKER FIRST: A CRASH BETWEEN THEM BREAKS EITHER ORDER', 300);
  const lane = (y, a, b, bad) => { chip(d, 40, y, 150, a, false, 28); d.arrow(196, y + 14, 250, y + 14, { stroke: C.gray, hl: 5 }); bolt(d, 280, y - 6); chip(d, 330, y, 150, b, false, 28); cross(d, 405, y + 14, 16, C.gray); d.text(320, y + 50, bad, { cls: 'xs' }); };
  lane(60, 'score commits', 'send event', 'state changed, nobody told');
  lane(150, 'event visible', 'DB commit', 'consumers saw a score that never happened');
  d.rect(160, 240, 320, 36, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(320, 258, 'needed: one durable boundary to recover from', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_scaling_patterns_18() {
  const d = illustration('sd_scaling_patterns_18', 'THE OUTBOX ROW COMMITS WITH THE SCORE; THE RELAY MAY SEND IT MORE THAN ONCE', 300);
  d.rect(30, 70, 220, 120, { r: 8, fill: C.card, stroke: C.ink2, dash: [5, 4] }); d.text(140, 88, 'one transaction', { cls: 'xs' });
  chip(d, 50, 104, 180, 'score update'); chip(d, 50, 140, 180, 'outbox insert');
  d.server(300, 90, 70, 80, { label: 'relay', fill: C.accSoft, stroke: C.acc });
  d.arrow(256, 150, 294, 130, { stroke: C.ink2, hl: 5 });
  d.server(450, 90, 70, 80, { label: 'broker' });
  d.travel([[376, 120], [444, 120]], { dur: 4, at: [0, 0.4], token: 'packet' });
  d.travel([[376, 140], [444, 140]], { dur: 4, at: [0.5, 0.9], token: 'packet' });
  d.text(410, 200, 'may repeat after\nan uncertain ack', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_scaling_patterns_19() {
  const d = illustration('sd_scaling_patterns_19', 'THE BROKER ACCEPTED, THE ACK WAS LOST; ON RESTART THE PENDING ROW IS RESENT WITH THE SAME ID', 300);
  stage3(d, [['claim', 'row leased\nto relay 1'], ['broker accepts', 'durable there;\nack lost'], ['restart', 'row still pending:\nresend same id']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 18, y - 26, 36, 50); if (i === 1) { g.server(x - 24, y - 26, 48, 50, { unit: 14 }); bolt(g, x + 34, y - 26, 0.6); } if (i === 2) g.envelope(x - 26, y - 14, 52, 30, { fill: C.accSoft, stroke: C.acc, label: 'e9' }); }, 'the consumer\'s dedupe absorbs the repeat');
  return d.svg();
}
export function sd_scaling_patterns_20() {
  const d = illustration('sd_scaling_patterns_20', 'A STALLED CDC READER PINS THE SOURCE LOG, AND THE SOURCE DISK FILLS', 300);
  d.db(40, 70, 100, 110, { label: 'source' });
  d.tape(170, 110, Array(10).fill(''), { cw: 32, h: 30, hot: (i) => i >= 2 }); d.text(330, 96, 'log retained after checkpoint', { cls: 'xs' });
  d.pin(170 + 2 * 32, 106, { label: 'stalled reader', dy: -40 });
  d.rect(510, 80, 90, 140, { r: 4, stroke: C.ink2 }); d.fillRect(512, 110, 86, 108, C.accSoft);
  d.text(555, 236, 'disk 80%', { cls: 'xs', color: C.acc });
  d.text(320, 270, 'alert on retained log size; persist the checkpoint after the effect', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_21() {
  const d = illustration('sd_scaling_patterns_21', 'A SAGA: RESERVE, CHARGE, GRANT, EACH ITS OWN LOCAL COMMIT; A FAILED GRANT NEEDS RECOVERY', 300);
  stage3(d, [['reserve', 'local commit;\nworkflow pending'], ['charge', 'local commit;\neffect confirmed'], ['grant', 'local commit,\nor recover']], 2, (g, i, x, y, hot) => { if (i === 0) g.lock(x - 16, y - 22, 32); if (i === 1) g.key(x - 14, y, 30); if (i === 2) { g.doc(x - 18, y - 26, 36, 50, { fill: C.accSoft, stroke: C.acc }); bolt(g, x + 30, y - 30, 0.6); } }, 'there is no global rollback; later failure is a workflow decision');
  return d.svg();
}
export function sd_scaling_patterns_22() {
  const d = illustration('sd_scaling_patterns_22', 'COMPENSATION IS A NEW ACTION: THE 2,500-CENT CHARGE STAYS IN HISTORY, A REFUND IS ADDED', 300);
  d.tape(80, 110, ['charge 2,500 ¢', 'grant failed', 'refund 2,500 ¢'], { cw: 160, h: 40, hot: (i) => i === 2 });
  d.text(160, 96, 'confirmed', { cls: 'xs' }); d.text(480, 96, 'confirmed, own id', { cls: 'xs', color: C.acc });
  d.text(320, 200, 'not "delete the charge": the ledger keeps both entries', { cls: 'sm' });
  d.text(320, 224, 'sending the refund command is not the same as the refund succeeding', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_23() {
  const d = illustration('sd_scaling_patterns_23', 'THE ORCHESTRATOR RESTARTS IN "CHARGE PENDING" AND JUDGES A LATE REPLY AGAINST ITS CURRENT STATE', 300);
  ['reserved', 'charge pending', 'charged', 'granted'].forEach((s, i) => { const x = 40 + i * 145, hot = i === 1; d.circle(x + 50, 110, 90, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 50, 110, s, { cls: 'xs', color: hot ? C.acc : undefined }); if (i < 3) d.arrow(x + 98, 110, x + 140, 110, { stroke: C.gray, hl: 5 }); });
  d.envelope(180, 196, 80, 40, { label: 'late reply' }); d.carrow([[220, 196], [210, 170], [200, 158]], { stroke: C.acc });
  d.text(450, 220, 'same command id: query\nor safely repeat', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_scaling_patterns_24() {
  const d = illustration('sd_scaling_patterns_24', 'CHOREOGRAPHY: SERVICES REACT TO EVENTS, AND SOMEONE STILL OWNS A STALLED WORKFLOW', 300);
  d.server(40, 90, 70, 70, { unit: 15, label: 'payment' }); d.server(280, 90, 70, 70, { unit: 15, label: 'access' });
  d.arrow(116, 125, 274, 125, { stroke: C.ink2 }); d.envelope(170, 106, 50, 30); d.text(195, 160, 'charged', { cls: 'xs' });
  bolt(d, 380, 96, 0.7);
  d.person(500, 90, 40, { fill: C.accSoft, stroke: C.acc }); d.text(500, 150, 'named recovery owner', { cls: 'xs', color: C.acc });
  d.arrow(356, 140, 470, 120, { stroke: C.acc, dash: [4, 3] });
  d.text(320, 240, 'broadcasting "failed" does not choose who fixes it', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_25() {
  const d = illustration('sd_scaling_patterns_25', 'ELECTION PICKS GENERATION 13; THE PROTECTED RESOURCE IS WHAT ENFORCES IT', 300);
  d.server(270, 46, 100, 60, { label: 'coordinator: gen 13' });
  d.server(60, 140, 70, 70, { unit: 15, label: 'old (12), still running' }); d.server(510, 140, 70, 70, { unit: 15, label: 'new (13)', fill: C.accSoft, stroke: C.acc });
  d.db(270, 160, 100, 80, { label: 'resource: ≥ 13', fill: C.accSoft, stroke: C.acc });
  d.arrow(136, 175, 264, 195, { stroke: C.gray }); cross(d, 250, 192, 7, C.ink2);
  d.arrow(504, 175, 376, 195, { stroke: C.acc }); tick(d, 390, 192, 7);
  return d.svg();
}
export function sd_scaling_patterns_26() {
  const d = illustration('sd_scaling_patterns_26', 'A 10 S LEASE, 15 S OF WORK, A PAUSE: THE OLD WORKER RESUMES 5 S PAST ITS LEASE', 280);
  const X = 60, s = 32;
  ruler(d, X, 190, 16 * s, 16, 2, ' s');
  d.rect(X, 80, 10 * s, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 5 * s, 95, 'lease 10 s', { cls: 'xs' });
  d.rect(X + 10 * s, 80, 5 * s, 30, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 12.5 * s, 95, '+5 s, no lease', { cls: 'xs', color: C.acc });
  d.fillRect(X + 4 * s, 124, 7 * s, 20, C.slateSoft, 1, 3); d.text(X + 7.5 * s, 134, 'paused', { cls: 'xs' });
  d.rect(X + 10 * s, 150, 6 * s, 24, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 13 * s, 162, 'new worker', { cls: 'xs' });
  d.text(320, 250, 'the target must reject the resumed write; the worker cannot know it slept', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_27() {
  const d = illustration('sd_scaling_patterns_27', 'THE RESOURCE COMPARES GENERATIONS: OLDER IS REFUSED EVEN IF IT ARRIVES LAST', 280);
  d.server(40, 70, 70, 70, { unit: 15, label: 'old gen' }); d.server(40, 170, 70, 70, { unit: 15, label: 'new gen', fill: C.accSoft, stroke: C.acc });
  d.db(400, 110, 140, 110, { label: 'stores highest gen' });
  d.arrow(116, 210, 392, 180, { stroke: C.acc }); tick(d, 370, 182, 6);
  d.arrow(116, 100, 392, 150, { stroke: C.gray }); d.travel([[116, 100], [392, 150], [200, 120]], { dur: 4, at: [0.5, 1], r: 3.5, color: C.ink2 }); cross(d, 370, 146, 7);
  return d.svg();
}
export function sd_scaling_patterns_28() {
  const d = illustration('sd_scaling_patterns_28', 'RELEASE THE LOCK ONLY IF YOU STILL OWN IT, OR YOU DELETE YOUR SUCCESSOR\'S', 300);
  chip(d, 240, 70, 160, 'lock:m7 = worker B', true, 30);
  d.server(40, 60, 70, 70, { unit: 15, label: 'worker A (expired)' }); d.server(530, 60, 70, 70, { unit: 15, label: 'worker B (owner)' });
  d.arrow(116, 90, 234, 86, { stroke: C.gray }); d.mono(176, 112, 'DEL if value = A', { size: 9 }); cross(d, 220, 86, 6, C.ink2);
  d.text(320, 170, 'compare-and-delete in one atomic step', { cls: 'sm', color: C.acc });
  d.text(320, 200, 'and prefer a conditional row update when the invariant lives in one row', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_29() {
  const d = illustration('sd_scaling_patterns_29', 'FAN-OUT ON WRITE: 100 POSTS/S × 10,000 FOLLOWERS = 1,000,000 FEED ENTRIES/S', 320);
  d.person(50, 120, 40, { label: 'publisher' });
  d.server(170, 110, 70, 70, { unit: 15, label: 'workers' }); d.arrow(80, 145, 164, 145, { stroke: C.ink2 });
  for (let i = 0; i < 8; i++) { const y = 50 + i * 30; d.line(246, 145, 400, y + 10, { stroke: C.line, single: true }); d.tape(406, y, ['', '', ''], { cw: 20, h: 20, hot: (k) => k === 0 && i === 3 }); }
  d.travel([[246, 145], [400, 150]], { dur: 2, r: 3 });
  d.phone(540, 120, 60, { stroke: C.acc }); d.arrow(470, 150, 534, 150, { stroke: C.acc, hl: 5 });
  d.text(320, 300, 'reads are cheap; serving still checks current visibility', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_30() {
  const d = illustration('sd_scaling_patterns_30', 'FAN-OUT ON READ: 50 READS/S × 200 CANDIDATES = 10,000 CANDIDATES/S GATHERED AND MERGED', 300);
  d.phone(40, 100, 70, { label: 'reader' });
  for (let i = 0; i < 6; i++) { const y = 50 + i * 36; d.line(80, 135, 250, y + 12, { stroke: C.line, single: true }); d.server(256, y, 40, 26, { unit: 10 }); }
  d.rect(340, 100, 120, 70, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(400, 126, 'gather + merge', { cls: 'sm' }); d.text(400, 148, 'rank', { cls: 'xs' });
  d.rect(500, 100, 110, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(555, 126, 'page + cursor', { cls: 'sm', color: C.acc }); d.text(555, 148, 'stable boundary', { cls: 'xs' });
  d.arrow(300, 135, 334, 135, { stroke: C.gray, hl: 5 }); d.arrow(464, 135, 494, 135, { stroke: C.gray, hl: 5 });
  return d.svg();
}
export function sd_scaling_patterns_31() {
  const d = illustration('sd_scaling_patterns_31', 'HYBRID: PUSH ORDINARY POSTS, PULL A CELEBRITY\'S AT READ TIME, MERGE BY POST ID', 300);
  d.person(50, 70, 30, { label: 'ordinary' }); d.arrow(80, 90, 240, 120, { stroke: C.ink2 }); d.text(160, 94, 'write fan-out', { cls: 'xs' });
  d.person(50, 190, 40, { label: 'celebrity' }); d.arrow(84, 210, 240, 160, { stroke: C.ink2, dash: [4, 3] }); d.text(160, 210, 'read-time candidates', { cls: 'xs' });
  d.rect(250, 100, 170, 80, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(335, 124, 'merge', { cls: 'ttl', color: C.acc }); d.text(335, 146, 'dedupe + permissions', { cls: 'xs' });
  d.arrow(424, 140, 484, 140, { stroke: C.acc }); d.phone(500, 100, 70);
  return d.svg();
}
export function sd_scaling_patterns_32() {
  const d = illustration('sd_scaling_patterns_32', 'PAGE 2 CONTINUES IN THE SAME RANKING CONTEXT AND DROPS ENTRIES DELETED SINCE PAGE 1', 300);
  d.tape(40, 80, ['p1', 'p2', 'p3', 'p4'], { cw: 50, h: 30 }); d.text(140, 66, 'page 1', { cls: 'xs' });
  d.pin(240, 76, { label: 'cursor (score, id)', dy: -36 });
  d.tape(300, 80, ['p5', 'p6', 'p7', 'p8'], { cw: 50, h: 30, hot: () => true }); d.text(400, 66, 'page 2', { cls: 'xs', color: C.acc });
  cross(d, 375, 95, 12, C.ink2); d.text(375, 130, 'p6 deleted', { cls: 'xs' });
  d.text(320, 200, 'new arrivals before the boundary follow a session policy', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_33() {
  const d = illustration('sd_scaling_patterns_33', 'KEY + EXPECTED VERSION IN; SCORE, OUTBOX AND RESULT IN ONE COMMIT; A REPEATABLE v8 OUT', 300);
  stage3(d, [['input', 'key K,\nexpects v7'], ['one commit', 'score + outbox\n+ result for K'], ['response', 'v8, recoverable\nby retrying K']], 2, (g, i, x, y, hot) => { if (i === 0) g.envelope(x - 26, y - 14, 52, 30, { label: 'K' }); if (i === 1) g.db(x - 24, y - 26, 48, 52); if (i === 2) ver(g, x - 28, y - 15, 8, true); }, null);
  return d.svg();
}
export function sd_scaling_patterns_34() {
  const d = illustration('sd_scaling_patterns_34', 'THE RELAY PUBLISHES e9; THE PROJECTION AND NOTIFIER EACH TRACK THEIR OWN PROGRESS', 300);
  d.server(40, 100, 70, 70, { unit: 15, label: 'relay' });
  d.tape(150, 120, ['e8', 'e9'], { cw: 50, h: 30, hot: (i) => i === 1 });
  [['projection', 'applied v8 · checkpoint 9', 70], ['notifier', 'pending · own progress', 180]].forEach(([s, t, y], i) => { d.arrow(256, 135, 380, y + 25, { stroke: C.ink2, hl: 6 }); panel(d, 390, y, 220, 60, '', i === 1); d.text(500, y + 20, s, { cls: 'ttl', size: 12, color: i === 1 ? C.acc : undefined }); d.text(500, y + 42, t, { cls: 'xs' }); });
  return d.svg();
}
export function sd_scaling_patterns_35() {
  const d = illustration('sd_scaling_patterns_35', 'CRASH AT ANY OF FOUR POINTS; THE DURABLE FACTS LEFT BEHIND SAY WHAT TO REPEAT', 300);
  const X = 40, W = 560;
  d.arrow(X, 110, X + W, 110, { stroke: C.gray });
  const st = [['before commit', 'retry command'], ['after commit', 'relay resumes'], ['after send', 'consumer dedups'], ['after effect', 'progress kept']];
  st.forEach(([a, b], i) => { const x = X + 70 + i * 140, hot = i === 3; bolt(d, x, 66, 0.9, hot ? C.acc : C.ink2); d.text(x, 134, a, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); d.text(x, 156, b, { cls: 'xs' }); });
  d.travel([[X, 110], [X + W, 110]], { dur: 6, r: 4 });
  d.text(320, 220, 'after the effect a redelivery can still come: completion evidence absorbs it', { cls: 'xs' });
  return d.svg();
}
export function sd_scaling_patterns_36() {
  const d = illustration('sd_scaling_patterns_36', 'READS GREW, WRITES DID NOT: ADD A READ-SIDE CHANGE AND KEEP THE SAME WRITE AUTHORITY', 300);
  stage3(d, [['changed demand', 'read traffic grows;\nwrite rule same'], ['read-side change', 'replicas or index;\nmeasure benefit'], ['authority kept', 'same invariant,\nless new machinery']], 2, (g, i, x, y, hot) => { if (i === 0) for (let k = 0; k < 4; k++) g.phone(x - 44 + k * 24, y - 20, 36, { stroke: C.gray }); if (i === 1) { g.db(x - 50, y - 22, 40, 44); g.db(x + 10, y - 22, 40, 44); } if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, null);
  return d.svg();
}

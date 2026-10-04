import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { canvas, flow, cards, ledger } from '../lib/fundamentals-figures.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import n from '../data/system-design/queues-numbers.json' with { type: 'json' };

const parts = ['Why message queues', 'Queues, pub/sub and event streams', 'Consumer groups, partitions and offsets', 'Acknowledgements and delivery semantics', 'Retries and dead-letter queues', 'Exactly-once and backpressure', 'Transactional outbox and complete flow'];
import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const queue = (d, x, y, k, w = 26, hot = -1) => { d.line(x, y - 4, x + k * w + 8, y - 4, { stroke: C.ink2, single: true }); d.line(x, y + 26, x + k * w + 8, y + 26, { stroke: C.ink2, single: true }); for (let i = 0; i < k; i++) d.envelope(x + 4 + i * w, y + 3, w - 6, 17, { fill: i === hot ? C.accSoft : C.paper, stroke: i === hot ? C.acc : C.ink2 }); };
export function where_sd_queues(stage = 99) { return systemMap('sd_queues', parts, stage); }
export function cover_sd_queues() { return systemCover('sd_queues', 8, ['Message', 'queues'], 'Acceptance, delivery and recovery', parts); }
export function sd_q_sync_wait() {
  const d = illustration('sd_q_sync_wait', `6 UPLOADS/S × 30 S INLINE = ${n.sync_inflight} OPEN REQUESTS; × 0.15 S = ${n.async_inflight}`, 340);
  panel(d, 20, 44, 292, 240, 'transcode inside the request');
  for (let i = 0; i < 180; i++) d.dot(44 + (i % 18) * 14, 80 + Math.floor(i / 18) * 14, 3, C.ink2);
  d.text(166, 236, `${n.sync_inflight} phones waiting`, { cls: 'sm' });
  d.text(166, 256, 'each open for 30 s', { cls: 'xs' });
  panel(d, 328, 44, 292, 240, 'answer after the upload commits', true);
  d.glow((g) => g.dot(380, 86, 4, C.acc));
  d.text(400, 86, `${n.async_inflight} open on average`, { cls: 'sm', a: 'start', color: C.acc });
  queue(d, 360, 130, 7, 30);
  d.server(380, 180, 50, 50, { unit: 14 }); d.server(440, 180, 50, 50, { unit: 14 }); d.server(500, 180, 50, 50, { unit: 14 });
  d.text(474, 256, '200 workers do the 180 worker-s/s', { cls: 'xs' });
  d.travel([[360, 145], [580, 145]], { dur: 3, r: 3 });
  d.text(320, 314, 'the work moves out of the request; it does not disappear', { cls: 'xs' });
  return d.svg();
}
export function sd_q_shape() {
  const d = illustration('sd_q_shape', 'SYNCHRONOUS: THE RESPONSE MEANS DONE. ASYNCHRONOUS: IT MEANS ACCEPTED', 330);
  d.text(36, 58, 'synchronous', { cls: 'ttl', a: 'start' });
  d.phone(40, 76, 50); d.server(180, 76, 60, 56, { unit: 14 }); d.db(320, 80, 60, 52);
  d.arrow(70, 100, 174, 100, { stroke: C.ink2, hl: 6 }); d.arrow(246, 104, 314, 104, { stroke: C.ink2, hl: 6 });
  d.carrow([[340, 140], [200, 168], [70, 136]], { stroke: C.ink2, hl: 6 }); d.text(470, 104, 'response = complete', { cls: 'sm' });
  d.text(36, 204, 'asynchronous', { cls: 'ttl', a: 'start', color: C.acc });
  d.phone(40, 220, 50); d.server(150, 220, 56, 52, { unit: 14 });
  queue(d, 250, 232, 5, 26, 4);
  d.server(420, 220, 56, 52, { unit: 14 }); d.db(520, 224, 60, 48);
  d.arrow(70, 244, 144, 244, { stroke: C.ink2, hl: 6 }); d.arrow(212, 246, 246, 246, { stroke: C.ink2, hl: 6 }); d.arrow(392, 246, 414, 246, { stroke: C.ink2, hl: 6 }); d.arrow(482, 246, 514, 246, { stroke: C.ink2, hl: 6 });
  d.carrow([[178, 278], [120, 300], [64, 282]], { stroke: C.acc, hl: 6 }); d.text(120, 316, '202 accepted', { cls: 'xs', color: C.acc });
  d.line(232, 200, 232, 310, { stroke: C.acc, dash: [5, 4], single: true });
  d.text(400, 306, 'completion happens later, in another process', { cls: 'xs' });
  return d.svg();
}
export function sd_q_kinds() {
  const d = illustration('sd_q_kinds', 'A COMMAND HAS ONE HANDLER, AN EVENT HAS MANY READERS, THE JOB ROW HOLDS THE TRUTH', 330);
  d.envelope(40, 70, 100, 56, { fill: C.card }); d.mono(90, 140, 'TranscodeClip', { size: 10 }); d.text(90, 160, 'command: do this', { cls: 'xs' });
  d.arrow(146, 98, 196, 98, { stroke: C.ink2, hl: 6 }); d.server(206, 72, 50, 54, { unit: 14 }); d.text(231, 140, 'one handler', { cls: 'xs' });
  d.envelope(330, 70, 100, 56, { fill: C.card }); d.mono(380, 140, 'ClipUploaded', { size: 10 }); d.text(380, 160, 'event: this happened', { cls: 'xs' });
  [0, 1, 2].forEach((i) => { d.arrow(436, 98, 506, 64 + i * 34, { stroke: C.ink2, hl: 5 }); d.server(510, 50 + i * 34, 36, 28, { unit: 12 }); });
  d.rect(120, 200, 400, 70, { r: 6, fill: C.accSoft, stroke: C.acc });
  d.text(320, 220, 'jobs table, row 812', { cls: 'ttl', color: C.acc });
  d.mono(320, 248, 'accepted → running → succeeded', { size: 11 });
  d.text(320, 300, 'messages can be lost, repeated or delayed; the row is what progress means', { cls: 'xs' });
  return d.svg();
}
export function sd_q_status() {
  const d = illustration('sd_q_status', 'THE CLIENT NEVER SEES THE QUEUE; IT SEES /jobs/812', 340);
  d.phone(40, 60, 70, { label: 'client' }); d.server(280, 56, 80, 80, { label: 'API' }); d.db(500, 60, 90, 76, { label: 'job table' });
  const st = [[76, 274, 'POST clip, key U', 160, C.ink2], [366, 494, 'commit job + outbox', 186, C.ink2], [274, 76, '202, Location: /jobs/812', 212, C.acc], [76, 274, 'GET /jobs/812', 250, C.ink2], [366, 494, 'read status', 276, C.ink2], [274, 76, 'succeeded + rendition URLs', 302, C.acc]];
  st.forEach(([a, b, s, y, col], i) => { d.arrow(a, y, b, y, { stroke: col, hl: 6 }); d.mono((a + b) / 2, y - 9, s, { size: 9, color: col === C.acc ? C.acc : undefined }); d.travel([[a, y], [b, y]], { dur: 9, at: [i / 6, (i + 0.8) / 6], r: 3, color: col }); });
  [76, 320, 545].forEach((x) => d.line(x, 150, x, 312, { stroke: C.line, dash: [3, 5], single: true }));
  return d.svg();
}
export function sd_q_submit_retry() {
  const d = illustration('sd_q_submit_retry', 'THE SAME SUBMIT KEY ON A RETRY RETURNS THE JOB THAT ALREADY EXISTS', 300);
  d.phone(36, 70, 70);
  d.server(270, 60, 80, 90, { label: 'API' });
  d.db(480, 66, 110, 90, { label: 'U → job J' });
  d.arrow(76, 90, 262, 90, { stroke: C.ink2 }); d.mono(170, 78, 'POST, key U', { size: 9.5 });
  d.arrow(262, 120, 76, 120, { stroke: C.gray }); bolt(d, 170, 104, 0.6);
  d.arrow(356, 105, 472, 105, { stroke: C.ink2, hl: 6 });
  d.arrow(76, 200, 262, 200, { stroke: C.acc }); d.mono(170, 188, 'POST again, key U', { size: 9.5, color: C.acc });
  d.arrow(262, 230, 76, 230, { stroke: C.acc }); d.mono(170, 244, 'existing job J', { size: 9.5, color: C.acc });
  d.travel([[76, 200], [262, 200], [262, 230], [76, 230]], { dur: 4, label: 'U', w: 20 });
  d.text(470, 220, 'not a second\ntranscode', { cls: 'sm', vc: true });
  return d.svg();
}
export function sd_q_competing() {
const d=illustration('sd_q_competing','WORKERS TAKE DIFFERENT JOBS FROM THE SAME DURABLE QUEUE',345);
  d.text(215,48,'waiting jobs',{cls:'ttl'});figShelf(d,36,82,['L','K','J'],{width:302,height:48,hot:2});
  d.line(26,145,345,145,{stroke:C.ink2,single:true,sw:2});[58,127,196,265,326].forEach(x=>d.circle(x,157,13,{stroke:C.line}));
  [['A','J',61],['B','K',178],['C','L',295]].forEach(([s,j,y],i)=>{d.server(473,y,101,57,{label:`worker ${s}`,unit:18});d.envelope(391,y+11,38,26);d.mono(410,y+24,j,{size:10});d.carrow([[351,106],[373,106],[382,y+24]],{stroke:i?C.line:C.acc,hl:5});d.arrow(436,y+24,466,y+24,{stroke:i?C.line:C.acc,hl:5});});
  d.text(187,236,'one delivery has one current lease',{cls:'ttl',size:11});d.text(187,261,'an expired lease can cause redelivery',{cls:'sm',size:10});return d.svg();
}
export function sd_q_fanout() {
  const d = canvas('sd_q_fanout', 'EACH SUBSCRIPTION HAS ITS OWN PROGRESS', 330);
  d.box(20, 133, 128, 48, `${n.events_s}/s score topic`, { fill: C.card });
  ['live delivery', 'search backlog', 'analytics backlog'].forEach((s, i) => {
    const y = 64 + i * 86;
    d.arrow(154, 157, 236, y + 21, { stroke: C.gray });
    d.box(242, y, 160, 42, s, { fill: C.card });
    if (i === 1) {
      ['search A', 'search B'].forEach((w, j) => { d.arrow(407, y + 21, 467, y - 7 + j * 56, { stroke: C.acc }); d.box(472, y - 24 + j * 56, 144, 34, w, { fill: C.accSoft, stroke: C.acc }); });
    } else { d.arrow(408, y + 21, 468, y + 21, { stroke: C.gray }); d.box(473, y + 4, 143, 34, 'one reader', { fill: C.card }); }
  });
  d.mono(320, 304, `${n.events_s} × ${n.subscribers} = ${n.fanout_deliveries_s} deliveries/s`);
  return d.svg();
}
export function sd_q_log() {
  const d = canvas('sd_q_log', 'READING MOVES A BOOKMARK, NOT THE RECORD', 270);
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((s, i) => d.box(98 + i * 73, 66, 62, 38, s, { fill: C.card }));
  d.arrow(275, 160, 275, 111, { stroke: C.gray }); d.text(275, 181, 'analytics bookmark', { cls: 'sm' });
  d.arrow(494, 214, 494, 111, { stroke: C.acc }); d.text(494, 236, 'live bookmark', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_q_choose() {
  const d = illustration('sd_q_choose', 'FOUR READER CONTRACTS; HERON USES A QUEUE FOR CLIPS AND A STREAM FOR SCORES', 340);
  const cells = [['work queue', 'one handler, removed on ack', 'clip jobs'], ['pub/sub', 'every subscriber a copy', 'notifications'], ['retained stream', 'keep, replay from any offset', 'score events'], ['partitioned stream', 'order per key', 'per match']];
  cells.forEach(([s, t, use], i) => {
    const x = 20 + (i % 2) * 310, y = 46 + Math.floor(i / 2) * 140, hot = i === 2;
    panel(d, x, y, 290, 124, s, hot);
    if (i === 0) { queue(d, x + 20, y + 40, 4); d.server(x + 150, y + 34, 34, 40, { unit: 12 }); d.server(x + 194, y + 34, 34, 40, { unit: 12 }); }
    if (i === 1) { d.envelope(x + 30, y + 44, 40, 26); [0, 1, 2].forEach((k) => { d.arrow(x + 76, y + 57, x + 160, y + 36 + k * 22, { stroke: C.ink2, hl: 5 }); d.envelope(x + 166, y + 28 + k * 22, 26, 16); }); }
    if (i === 2) { d.tape(x + 20, y + 40, ['0', '1', '2', '3', '4', '5'], { cw: 30, h: 26, hot: (k) => k < 4 }); d.pin(x + 140, y + 38, { fill: C.accSoft, stroke: C.acc }); d.pin(x + 80, y + 38, { fill: C.card }); }
    if (i === 3) { [0, 1, 2].forEach((k) => d.tape(x + 20, y + 32 + k * 18, ['', '', '', ''], { cw: 24, h: 14 })); }
    d.text(x + 145, y + 92, t, { cls: 'xs' });
    d.text(x + 145, y + 110, `Heron: ${use}`, { cls: 'sm', color: hot ? C.acc : undefined });
  });
  return d.svg();
}
export function sd_q_prefetch() {
  const d = illustration('sd_q_prefetch', `PREFETCH ${n.prefetch}: THE WORKER HOLDS 10 UNACKED; IF IT CRASHES, ALL 10 RETURN`, 320);
  d.text(130, 50, 'broker', { cls: 'ttl' });
  queue(d, 30, 70, 7);
  d.server(330, 56, 90, 90, { label: 'worker' });
  d.rect(440, 60, 170, 80, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(525, 50, 'held, unacked', { cls: 'xs', color: C.acc });
  for (let i = 0; i < 10; i++) d.envelope(452 + (i % 5) * 30, 72 + Math.floor(i / 5) * 32, 24, 18, { fill: C.accSoft, stroke: C.acc });
  d.arrow(222, 85, 322, 95, { stroke: C.ink2, hl: 6 });
  d.during([0.5, 1], (g) => { bolt(g, 375, 160); g.carrow([[525, 150], [400, 230], [140, 110]], { stroke: C.acc, hl: 7 }); g.text(340, 240, 'redelivered to other workers', { cls: 'sm', color: C.acc }); });
  d.text(320, 296, 'a prefetch of 1,000 would let one slow worker hoard the queue', { cls: 'xs' });
  return d.svg();
}
export function sd_q_groups() {
  const d = canvas('sd_q_groups', 'PARTITIONS CAP ACTIVE MEMBERS OF ONE GROUP', 390);
  [4, 6, 16].forEach((count, r) => {
    const y = 74 + r * 104;
    d.text(22, y, `${count} members`, { a: 'start', cls: 'mono', size: 11 });
    for (let p = 0; p < n.partitions; p++) {
      const owner = Math.floor(p / Math.ceil(n.partitions / Math.min(count, n.partitions)));
      d.box(158 + p * 38, y - 20, 32, 40, `P${p}\nC${owner}`, { fill: r === 2 ? C.accSoft : C.card, stroke: r === 2 ? C.acc : C.line, size: 9 });
    }
    d.text(158, y + 47, count > n.partitions ? `${count - n.partitions} members idle` : `${n.partitions / count} partitions per member`, { a: 'start', cls: 'sm' });
  });
  return d.svg();
}
export function sd_q_rebalance() {
  const d = illustration('sd_q_rebalance', 'B LEAVES: EAGER PAUSES ALL 12 PARTITIONS, COOPERATIVE PAUSES ONLY B\'S 3', 330);
  const own = ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C', 'D', 'D', 'D'];
  const row = (y, label, paused) => {
    d.text(30, y + 14, label, { cls: 'ttl', a: 'start', size: 12 });
    own.forEach((o, i) => { const p = paused(i); d.rect(170 + i * 36, y, 30, 28, { r: 3, fill: p ? C.accSoft : C.card, stroke: p ? C.acc : C.ink2, dash: p ? [3, 3] : undefined }); d.mono(185 + i * 36, y + 14, `P${i}`, { size: 8.5 }); });
  };
  d.text(30, 54, 'owner', { cls: 'xs', a: 'start' }); own.forEach((o, i) => d.mono(185 + i * 36, 54, o, { size: 9.5, color: o === 'B' ? C.acc : undefined }));
  row(80, 'eager', () => true);
  row(150, 'cooperative', (i) => i >= 3 && i <= 5);
  d.text(390, 128, 'every partition stops while all are reassigned', { cls: 'xs' });
  d.text(390, 198, 'only P3–P5 pause while they move', { cls: 'xs', color: C.acc });
  d.travel([[293, 230], [293, 280]], { dur: 3, r: 3.5 });
  d.text(320, 300, 'others keep reading through the move', { cls: 'xs' });
  return d.svg();
}
export function sd_q_fencing() {
  const d = illustration('sd_q_fencing', 'THE COORDINATOR REJECTS A COMMIT FROM THE OLD GENERATION', 330);
  d.server(40, 70, 80, 90, { label: 'old member (gen 5)' });
  d.server(280, 60, 80, 100, { label: 'coordinator' });
  d.server(520, 70, 80, 90, { label: 'new member (gen 6)', fill: C.accSoft, stroke: C.acc });
  d.arrow(274, 90, 126, 90, { stroke: C.gray }); d.mono(200, 80, 'revoke', { size: 9.5 });
  d.arrow(366, 90, 514, 100, { stroke: C.ink2 }); d.mono(440, 84, 'assign, gen 6', { size: 9.5 });
  d.arrow(126, 140, 274, 140, { stroke: C.acc }); d.mono(200, 154, 'late commit, gen 5', { size: 9.5, color: C.acc });
  d.travel([[126, 140], [270, 140], [140, 180]], { dur: 4, label: 'gen 5', w: 40 });
  cross(d, 262, 140, 8);
  d.db(260, 220, 120, 70, { label: 'external DB' });
  d.text(500, 260, 'needs its own\nownership check', { cls: 'sm', vc: true });
  return d.svg();
}
export function sd_q_partition_key() {
  const d = illustration('sd_q_partition_key', 'hash(match-7) → P4: EVERY MATCH-7 EVENT IS READ IN ORDER FROM ONE PARTITION', 330);
  for (let i = 0; i < 12; i++) {
    const y = 46 + i * 22, hot = i === 4, alt = i === 9;
    d.mono(180, y + 9, `P${i}`, { size: 9, a: 'end', color: hot ? C.acc : undefined });
    d.rect(190, y, 300, 18, { r: 2, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line });
    if (hot) ['goal', 'card', 'correction'].forEach((s, k) => chip(d, 200 + k * 92, y + 1, 84, `m7 ${s}`, true, 16));
    if (alt) ['goal', 'correction'].forEach((s, k) => chip(d, 200 + k * 92, y + 1, 84, `m12 ${s}`, false, 16));
  }
  d.envelope(40, 120, 70, 40, { fill: C.accSoft, stroke: C.acc }); d.mono(75, 176, 'match-7', { size: 10 });
  d.carrow([[116, 140], [150, 140], [186, 141]], { stroke: C.acc });
  d.travel([[200, 143], [480, 143]], { dur: 4, r: 3 });
  d.text(560, 143, 'in order', { cls: 'sm', color: C.acc });
  d.text(560, 254, 'no order vs m7', { cls: 'xs' });
  d.text(320, 320, '20 events/s over 12 partitions: 1.666667 per partition on average', { cls: 'xs' });
  return d.svg();
}
export function sd_q_hot_key() {
  const d = illustration('sd_q_hot_key', `THE FINAL'S PARTITION GETS ${n.hot_rate}/S AGAINST A 5/S CONSUMER: +${n.hot_lag_hour.toLocaleString('en-US')} LAG PER HOUR`, 330);
  for (let i = 0; i < 12; i++) {
    const x = 40 + i * 48, hot = i === 4, rate = hot ? n.hot_rate : n.cold_rate;
    d.rect(x, 240 - rate * 28, 36, rate * 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 18, 256, `P${i}`, { size: 8.5 });
  }
  d.line(30, 240 - 5 * 28, 620, 240 - 5 * 28, { stroke: C.ink, dash: [5, 4], single: true });
  d.text(616, 240 - 5 * 28 - 12, 'consumer limit 5/s', { cls: 'xs', a: 'end' });
  d.mono(250, 240 - 6 * 28 - 12, '6/s', { size: 10, color: C.acc });
  d.mono(450, 240 - n.cold_rate * 28 - 12, '1.272727/s each', { size: 9.5 });
  d.text(320, 290, '1 event/s over the limit × 3,600 s: lag grows while the rest sit idle', { cls: 'xs' });
  return d.svg();
}
export function sd_q_offsets() {
const d=illustration('sd_q_offsets','THE COMMITTED OFFSET IS A BOOKMARK AT THE NEXT RECORD',290);
  [7,8,9].forEach((o,i)=>figPage(d,104+i*167,78,136,132,`offset ${o}`,o===8));
  d.line(269,51,269,229,{stroke:C.acc,single:true,sw:2});d.poly([[257,51],[281,51],[281,80],[269,70],[257,80]],{fill:C.accSoft,stroke:C.acc});
  d.text(173,235,'covered by commit',{cls:'sm'});d.text(440,235,'replay from here',{cls:'sm'});
  d.mono(320,266,'commit 8: offset 7 covered; 8 and 9 remain replayable',{size:11});return d.svg();
}
export function sd_q_gap() {
const d=illustration('sd_q_gap','AN UNFINISHED RECORD STOPS THE CONTIGUOUS COMMIT PREFIX',295);
  [7,8,9].forEach((o,i)=>{figPage(d,84+i*183,75,144,139,`offset ${o}`,o===8);d.text(156+i*183,237,o===8?'unfinished':'effect done',{cls:'ttl',color:o===8?C.acc:C.ink2});});
  d.line(255,49,255,254,{stroke:C.acc,single:true,sw:2});d.mono(256,33,'commit 8',{size:11});
  d.brace(267,594,265,{label:'both records are replayable after restart'});return d.svg();
}
export function sd_q_visibility() {
  const d = illustration('sd_q_visibility', 'A 60 S LEASE ON A 75 S JOB: AT 60 S A SECOND WORKER STARTS THE SAME CLIP', 300);
  const X = 60, s = 6.6;
  ruler(d, X, 210, 75 * s, 75, 15, ' s');
  d.text(30, 96, 'A', { cls: 'ttl' }); d.rect(X, 82, 75 * s, 28, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 37.5 * s, 96, 'worker A transcoding', { cls: 'xs' });
  d.text(30, 150, 'B', { cls: 'ttl', color: C.acc }); d.rect(X + 60 * s, 136, 15 * s, 28, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(X + 67.5 * s, 150, 'duplicate', { cls: 'xs', color: C.acc });
  d.line(X + 60 * s, 70, X + 60 * s, 204, { stroke: C.acc, dash: [4, 3], single: true }); d.text(X + 60 * s, 60, 'lease expires', { cls: 'xs', color: C.acc });
  d.travel([[X, 120], [X + 75 * s, 120]], { dur: 6, r: 3.5 });
  d.text(320, 256, 'fix: heartbeat to extend the lease while work continues', { cls: 'sm' });
  return d.svg();
}
export function sd_q_at_most_once() {
  const d = illustration('sd_q_at_most_once', 'ACK FIRST, THEN WORK: A CRASH IN BETWEEN LOSES THE MESSAGE FOR GOOD', 300);
  queue(d, 30, 80, 4);
  d.server(250, 60, 80, 90, { label: 'worker' });
  d.db(480, 66, 100, 80, { label: 'effect' });
  d.arrow(150, 95, 244, 95, { stroke: C.ink2 }); d.mono(196, 83, '1 deliver', { size: 9.5 });
  d.arrow(244, 120, 150, 120, { stroke: C.ink2 }); d.mono(196, 134, '2 ack', { size: 9.5 });
  d.during([0.4, 1], (g) => { bolt(g, 400, 82); g.arrow(336, 105, 472, 105, { stroke: C.gray, dash: [4, 4] }); cross(g, 440, 105, 8, C.gray); });
  d.during([0.4, 1], (g) => g.rect(126, 88, 26, 20, { r: 2, stroke: C.acc, dash: [3, 3] }));
  d.text(320, 214, 'the broker already forgot it; no one will retry', { cls: 'sm', color: C.acc });
  d.text(320, 236, 'prefetch 10 with ack-on-receive can lose 10 at once', { cls: 'xs' });
  return d.svg();
}
export function sd_q_at_least_once() {
  const d = illustration('sd_q_at_least_once', 'WORK FIRST, THEN ACK: A LOST ACK MEANS THE SAME JOB COMES BACK', 320);
  queue(d, 30, 80, 4);
  d.server(250, 60, 80, 90, { label: 'worker' });
  d.db(480, 66, 100, 80, { label: 'effect J' });
  d.arrow(150, 95, 244, 95, { stroke: C.ink2 }); d.mono(196, 83, 'deliver J', { size: 9.5 });
  d.arrow(336, 105, 472, 105, { stroke: C.ink2 }); d.mono(404, 93, 'commit', { size: 9.5 });
  d.arrow(244, 125, 150, 125, { stroke: C.gray }); bolt(d, 196, 112, 0.6);
  d.travel([[150, 160], [244, 160]], { dur: 4, at: [0.5, 0.9], label: 'J again', w: 46 });
  d.text(320, 214, '21,600 jobs/h × 1 in 1,000 lost acks ≈ 21.6 duplicates/h', { cls: 'sm' });
  d.text(320, 240, 'the effect must recognise work it already did', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_q_idempotent() {
  const d = illustration('sd_q_idempotent', 'THE DEDUPE ROW AND THE EFFECT COMMIT TOGETHER; A DUPLICATE HITS THE UNIQUE KEY', 320);
  d.envelope(30, 70, 60, 36, { label: 'J first' }); d.envelope(30, 190, 60, 36, { label: 'J again', fill: C.card });
  d.rect(150, 50, 300, 200, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(300, 70, 'one transaction', { cls: 'ttl', color: C.acc });
  chip(d, 170, 94, 260, 'INSERT processed(J)  unique', true, 26);
  chip(d, 170, 134, 260, 'UPDATE renditions …', false, 26);
  d.mono(300, 184, 'COMMIT', { size: 11 });
  d.arrow(96, 88, 164, 106, { stroke: C.acc });
  d.arrow(96, 206, 164, 112, { stroke: C.ink2, dash: [4, 4] }); cross(d, 140, 150, 8);
  d.text(300, 228, 'conflict on J: skip, keep the earlier effect, ack', { cls: 'xs' });
  d.server(510, 90, 80, 100, { label: 'ack after commit' });
  d.arrow(456, 140, 504, 140, { stroke: C.ink2, hl: 6 });
  d.text(320, 290, 'safe to discard only once the commit is durable', { cls: 'xs' });
  return d.svg();
}
export function sd_q_classify() {
  const d = illustration('sd_q_classify', 'CLASSIFY THE FAILURE, THEN ROUTE IT: DELAYED RETRY, QUARANTINE, OR A SMALL BUDGET', 320);
  d.envelope(30, 130, 70, 44);
  d.rect(130, 110, 90, 84, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(175, 152, 'classify', { cls: 'ttl', size: 12 });
  d.arrow(106, 152, 124, 152, { stroke: C.ink2, hl: 5 });
  const out = [['transient: 429, 503, reset', 'delayed retry, bounded', 66, true], ['permanent: 400, 422', 'quarantine with original bytes', 152, false], ['unknown exception', 'few retries, then quarantine', 238, false]];
  out.forEach(([a, b, y, hot]) => { d.carrow([[222, 152], [260, y], [300, y]], { stroke: hot ? C.acc : C.gray, hl: 6 }); panel(d, 306, y - 30, 300, 60, '', hot); d.text(322, y - 10, a, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined }); d.text(322, y + 12, b, { cls: 'xs', a: 'start' }); });
  d.travel('M222,152 Q260,66 300,66', { dur: 3, r: 3.5 });
  return d.svg();
}
export function sd_q_retry_topics() {
  const d = illustration('sd_q_retry_topics', 'FAILED EVENTS STEP ASIDE INTO DELAY TOPICS SO THE MAIN PARTITION KEEPS MOVING', 330);
  d.text(40, 50, 'main', { cls: 'ttl', a: 'start' });
  d.tape(100, 40, ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'], { cw: 50, h: 26 });
  d.travel([[100, 53], [450, 53]], { dur: 4, r: 3 });
  d.server(480, 32, 60, 46, { unit: 14, label: 'consumer' });
  const tiers = [['retry-1s', 120], ['retry-10s', 180], ['retry-60s', 240]];
  tiers.forEach(([s, y], i) => { d.text(40, y + 12, s, { cls: 'sm', a: 'start' }); d.tape(140, y, ['', '', ''], { cw: 40, h: 24, hot: (k) => k === 0 && i === 0 }); d.clock(290, y + 12, 22); });
  d.carrow([[500, 84], [420, 120], [264, 132]], { stroke: C.acc, hl: 6 });
  d.travel('M500,84 Q420,120 264,132', { dur: 4, label: 'e3', w: 24 });
  d.rect(380, 230, 200, 40, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(480, 250, 'DLQ after the budget', { cls: 'sm' });
  d.arrow(312, 252, 374, 250, { stroke: C.gray, hl: 6 });
  d.text(320, 306, 'moving e3 aside changes its order relative to e4', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_q_poison() {
  const d = illustration('sd_q_poison', `ONE POISON RECORD HOLDS THE PARTITION ${n.poison_block_s} S; ${n.poison_backlog} EVENTS PILE UP BEHIND IT`, 320);
  d.tape(60, 70, ['☠', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'], { cw: 50, h: 32, hot: (i) => i === 0 });
  d.server(520, 56, 70, 60, { unit: 14 });
  d.carrow([[520, 120], [300, 150], [85, 106]], { stroke: C.acc, hl: 6 }); d.text(300, 162, 'crash, restart, read it again', { cls: 'xs', color: C.acc });
  const X = 60, W = 520, s = W / n.poison_block_s;
  let t = 0;
  n.attempt_delays.forEach((b, i) => { d.rect(X + t * s, 200, n.service_s * s, 24, { r: 0, fill: C.accSoft, stroke: C.acc }); t += n.service_s; d.rect(X + t * s, 200, b * s, 24, { r: 0, fill: C.paper, stroke: C.ink2 }); t += b; });
  d.text(X, 190, `${n.poison_attempts} attempts × 30 s + backoff ${n.attempt_delays.join(' + ')} = ${n.poison_block_s} s`, { cls: 'xs', a: 'start' });
  d.mono(320, 260, `20/12 per s × ${n.poison_block_s} s = ${n.poison_backlog} waiting`, { size: 10.5, color: C.acc });
  return d.svg();
}
export function sd_q_dlq() {
  const d = illustration('sd_q_dlq', 'THE DEAD-LETTER QUEUE NEEDS AN OWNER AND A WAY BACK', 320);
  d.tape(30, 70, ['', '', '', ''], { cw: 40, h: 28 }); d.text(110, 56, 'main queue', { cls: 'xs' });
  d.arrow(196, 84, 256, 120, { stroke: C.ink2 }); d.text(226, 90, 'exhausted', { cls: 'xs', a: 'start' });
  d.rect(260, 100, 140, 100, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(330, 118, 'DLQ', { cls: 'ttl' });
  d.envelope(290, 136, 80, 40, { fill: C.accSoft, stroke: C.acc }); d.mono(330, 190, 'bytes + error + id', { size: 8.5 });
  d.person(470, 100, 34, { label: 'owner fixes' });
  d.carrow([[330, 206], [200, 250], [90, 104]], { stroke: C.acc }); d.text(200, 268, 'redrive with original id, rate-limited', { cls: 'sm', color: C.acc });
  d.travel('M330,206 Q200,250 90,104', { dur: 4, token: 'packet' });
  d.text(500, 200, 'alert on depth\nand oldest age', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_q_eos_boundary() {
  const d = canvas('sd_q_eos_boundary', 'TRANSACTION SCOPE DEFINES EXACTLY-ONCE', 310);
  d.rect(24, 53, 362, 175, { stroke: C.acc, fill: C.accFaint });
  d.text(42, 76, 'Kafka transaction', { a: 'start', cls: 'ttl' });
  d.box(44, 101, 144, 54, 'input offsets', { fill: C.card });
  d.box(216, 101, 144, 54, 'output records', { fill: C.card });
  d.text(205, 194, 'commit or abort together', { cls: 'sm', color: C.acc });
  d.arrow(391, 127, 433, 127, { stroke: C.gray });
  d.box(439, 101, 174, 54, 'external email', { fill: C.card });
  d.text(526, 194, 'separate effect', { cls: 'sm' });
  d.hand(320, 276, 'name the systems inside the commit');
  return d.svg();
}
export function sd_q_backlog() {
  const d = canvas('sd_q_backlog', 'RECOVERY USES SPARE CAPACITY', 335);
  const M = d.axes(65, 69, 496, 195, { xmin: 0, xmax: n.burst_s + n.drain_200_s, ymin: 0, ymax: n.backlog, xl: 'seconds', yl: 'queued jobs' });
  d.lines([[M.X(0), M.Y(0)], [M.X(n.burst_s), M.Y(n.backlog)], [M.X(n.burst_s + n.drain_200_s), M.Y(0)]], { stroke: C.acc, sw: 2 });
  d.mono(90, 48, `${n.backlog} at ${n.burst_s} s`, { a: 'start' });
  d.mono(561, 291, `${n.burst_s + n.drain_200_s} s`, { a: 'end' });
  d.text(334, 124, `${n.drain_200_s} s to drain`, { cls: 'sm' });
  return d.svg();
}
export function sd_q_lag_time() {
  const d = illustration('sd_q_lag_time', '4,000 MESSAGES: 20 S OF SCORE WORK, 600 S OF TRANSCODES', 300);
  [['score updates', '4,000 ÷ 200/s', n.score_backlog_work_s, false], ['transcodes', '4,000 ÷ 6.666667/s', n.wait_at_peak_s, true]].forEach(([s, how, t, hot], i) => {
    const y = 70 + i * 90;
    d.text(30, y, s, { cls: 'ttl', a: 'start' });
    for (let k = 0; k < 10; k++) d.envelope(30 + k * 18, y + 14, 14, 10, { fill: C.paper });
    d.text(110, y + 44, '4,000 waiting', { cls: 'xs' });
    d.clock(260, y + 22, 34, { spin: hot ? 8 : 2 });
    d.rect(300, y + 8, t * 0.5, 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(300 + t * 0.5 + 8, y + 22, `${t} s`, { size: 10.5, a: 'start', color: hot ? C.acc : undefined });
    d.mono(300, y + 50, how, { size: 9, a: 'start', color: C.gray });
  });
  d.text(320, 270, 'alert on waiting time, not message count', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_q_backpressure() {
  const d = illustration('sd_q_backpressure', 'THREE PLACES TO PUSH BACK, EACH HARSHER AND WIDER THAN THE LAST', 320);
  d.phone(30, 110, 60); d.server(150, 100, 60, 70, { unit: 14 }); queue(d, 250, 120, 5); d.server(430, 100, 60, 70, { unit: 14 });
  d.text(60, 194, 'producer', { cls: 'xs' }); d.text(180, 194, 'API', { cls: 'xs' }); d.text(326, 194, 'broker', { cls: 'xs' }); d.text(460, 194, 'consumer', { cls: 'xs' });
  [[460, 'credit: 50 msgs', `= ${n.credit_inflight_s} s of work`, 1], [330, 'publisher buffer full', 'wait or fail', 2], [180, 'edge admission', '429 before accepting', 3]].forEach(([x, a, b, k]) => {
    d.carrow([[x, 96], [x - 60, 66 - k * 6], [x - 120, 96]], { stroke: k === 3 ? C.acc : C.ink2, hl: 6 });
  });
  d.text(460, 230, 'credit 50\n7.5 s of pool work', { cls: 'xs', vc: true });
  d.text(330, 230, 'buffer full:\nwait or fail', { cls: 'xs', vc: true });
  d.text(180, 230, 'reject before\ndurable acceptance', { cls: 'xs', vc: true, color: C.acc });
  d.text(320, 296, 'once accepted, a job is kept until done or explicitly failed', { cls: 'xs' });
  return d.svg();
}
export function sd_q_autoscale() {
  const d = illustration('sd_q_autoscale', `4,000 BACKLOG: 200 WORKERS DRAIN IN ${n.drain_200_min} MIN, 300 IN ${n.drain_300_min} MIN`, 320);
  const X = 80, s = 0.07;
  [[200, n.drain_200_s, n.drain_200_min, false], [300, n.drain_300_s, n.drain_300_min, true]].forEach(([w, t, m, hot], i) => {
    const y = 70 + i * 80;
    d.text(X - 10, y + 16, `${w} workers`, { cls: 'ttl', a: 'end', size: 12, color: hot ? C.acc : undefined });
    d.rect(X, y, t * s, 32, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(X + t * s + 8, y + 16, `${t.toLocaleString('en-US')} s (${m} min)`, { size: 10, a: 'start' });
    d.mono(X + 4, y + 46, `spare ${w === 200 ? '6.666667 − 6' : '10 − 6'} = ${w === 200 ? '0.666667' : '4'} jobs/s`, { size: 9, a: 'start', color: C.gray });
  });
  d.rect(80, 236, 480, 34, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(320, 253, 'past the object store or DB limit, more workers only add contention', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_q_dual_write() {
  const d = illustration('sd_q_dual_write', 'DATABASE THEN BROKER, OR BROKER THEN DATABASE: EACH ORDER HAS A CRASH GAP', 320);
  const lane = (y, a, b, bad) => { chip(d, 40, y, 150, a, false, 28); d.arrow(196, y + 14, 250, y + 14, { stroke: C.gray, hl: 5 }); bolt(d, 280, y - 6); chip(d, 330, y, 150, b, false, 28); cross(d, 405, y + 14, 16, C.gray); d.text(320, y + 50, bad, { cls: 'sm', color: C.acc }); };
  lane(60, 'commit job 812', 'publish message', 'a job with no message: it never runs');
  lane(170, 'publish message', 'commit job 812', 'a message for a job that does not exist');
  d.text(320, 290, 'two-phase commit across them is rarely available; make it one write', { cls: 'xs' });
  return d.svg();
}
export function sd_q_outbox() {
const d=illustration('sd_q_outbox','THE BUSINESS ROW AND PUBLICATION INTENT SHARE ONE LOCAL COMMIT',360);
  d.rect(36,52,322,242,{fill:C.paper,stroke:C.acc,dash:[5,4]});d.text(196,75,'database transaction',{cls:'ttl',color:C.acc});
  figPage(d,66,103,116,130,'job J',true);figPage(d,211,103,116,130,'outbox J',true);
  d.text(196,264,'commit both, or neither',{cls:'mono',size:12});
  d.gear(422,168,28);d.text(422,221,'relay',{cls:'ttl'});d.server(522,128,78,79,{label:'broker',unit:23});
  d.arrow(365,168,387,168,{stroke:C.acc});d.arrow(458,168,515,168,{stroke:C.acc});
  d.text(320,329,'the relay can repeat J; the downstream effect needs deduplication',{cls:'sm'});return d.svg();
}
export function sd_q_full_trace() {
  const d = illustration('sd_q_full_trace', 'JOB 812 ACROSS EVERY BOUNDARY; EACH ARROW CAN REPEAT, ONLY THE EFFECT CANNOT', 340);
  const st = [['API accepts', 'submit key'], ['job + outbox', 'one commit'], ['relay sends', 'may repeat'], ['broker keeps', 'may redeliver'], ['worker: effect\n+ id', 'commit once'], ['status + ack', 'client polls']];
  st.forEach(([s, t], i) => {
    const x = 20 + (i % 3) * 210, y = 50 + Math.floor(i / 3) * 140, hot = i === 4;
    d.rect(x, y, 180, 70, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 90, y + 28, s, { cls: 'ttl', size: 12, vc: true, color: hot ? C.acc : undefined });
    d.text(x + 90, y + 54, t, { cls: 'xs' });
  });
  d.arrow(204, 85, 226, 85, { stroke: C.gray, hl: 5 }); d.arrow(414, 85, 436, 85, { stroke: C.gray, hl: 5 });
  d.carrow([[530, 124], [530, 160], [530, 186]], { stroke: C.gray, hl: 5 });
  d.arrow(436, 225, 414, 225, { stroke: C.gray, hl: 5 }); d.arrow(226, 225, 204, 225, { stroke: C.gray, hl: 5 });
  d.travel([[110, 85], [530, 85], [530, 225], [110, 225]], { dur: 7, label: '812', w: 34 });
  d.text(320, 310, 'retries bridge every uncertain hop; identity keeps the effect single', { cls: 'xs' });
  return d.svg();
}
export function sd_q_components() {
  const d = illustration('sd_q_components', 'EACH COMPONENT KEEPS ONE PROMISE; THE WORKER INBOX ABSORBS THE DUPLICATES', 340);
  const c = [['API + job resource', 'validate, accept, expose progress'], ['outbox + relay', 'keep intent, retry sends'], ['broker', 'retain and redeliver'], ['worker + inbox', 'effect with its identity'], ['status store', 'authoritative lifecycle'], ['admission control', 'refuse before accepting']];
  c.forEach(([s, t], i) => {
    const x = 20 + (i % 2) * 310, y = 46 + Math.floor(i / 2) * 94, hot = i === 3;
    panel(d, x, y, 290, 80, '', hot);
    if (i === 0) d.server(x + 16, y + 16, 40, 48, { unit: 13 });
    if (i === 1) d.doc(x + 18, y + 14, 36, 50);
    if (i === 2) queue(d, x + 10, y + 30, 2, 22);
    if (i === 3) d.server(x + 16, y + 16, 40, 48, { unit: 13, fill: C.accSoft, stroke: C.acc });
    if (i === 4) d.db(x + 16, y + 16, 40, 48);
    if (i === 5) d.lock(x + 20, y + 20, 32);
    d.text(x + 76, y + 30, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.text(x + 76, y + 52, t, { cls: 'xs', a: 'start' });
  });
  return d.svg();
}
export function sd_q_interview() {
  const d = illustration('sd_q_interview', 'SIX STEPS, EACH ENDING IN A NUMBER OR A NAMED GUARANTEE', 340);
  const st = [['justify', `${n.sync_inflight} → ${n.async_inflight} open`], ['choose', 'queue for clips, stream for scores'], ['order', `${n.partitions} partitions, key = match`], ['recover', 'effect, then ack, stable id'], ['publish', `outbox, relay ≤ ${n.outbox_max_rate}/s`], ['size', `${n.drain_200_min} min burst recovery`]];
  st.forEach(([s, t], i) => {
    const y = 50 + i * 46, hot = i === 5;
    d.circle(50, y + 12, 30, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(50, y + 12, String(i + 1), { size: 11 });
    if (i < 5) d.line(50, y + 28, 50, y + 42, { stroke: C.line, single: true });
    d.text(80, y + 12, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined });
    d.mono(200, y + 12, t, { size: 10.5, a: 'start' });
  });
  d.travel([[50, 62], [50, 292]], { dur: 6, r: 3.5 });
  return d.svg();
}

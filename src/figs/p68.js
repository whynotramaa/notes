import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const klog = (d, x, y, from, count, o = {}) => { const cw = o.cw ?? 44; for (let i = 0; i < count; i++) { const off = from + i, hot = o.hot ? o.hot(off) : false, dim = o.dim ? o.dim(off) : false; d.rect(x + i * cw, y, cw, o.h ?? 30, { r: 0, fill: hot ? C.accSoft : dim ? C.paper : C.card, stroke: hot ? C.acc : dim ? C.gray : C.ink2, dash: dim ? [3, 3] : undefined }); d.mono(x + i * cw + cw / 2, y + (o.h ?? 30) / 2, o.label ? o.label(off) : off, { size: 9.5, color: dim ? C.gray : undefined }); } };
const mark = (d, x, y, s, hot = false, up = true) => { d.line(x, y, x, y + (up ? -22 : 22), { stroke: hot ? C.acc : C.ink2, sw: 1.6, single: true }); d.text(x, y + (up ? -32 : 34), s, { cls: 'xs', color: hot ? C.acc : undefined }); };
export function where_sd_kafka(stage=99) { return systemMap("sd_kafka", ["Topics, partitions and records", "Producers and brokers", "Replication, ISR, high watermark", "Consumers, offsets and semantics", "Consumer groups and rebalancing", "Idempotence and transactions", "Retention, compaction and replay", "Operating Kafka: KRaft and lag", "Case study: one score event"], stage); }
export function cover_sd_kafka() { return systemCover("sd_kafka", 9, ["Apache", "Kafka"], "Apache Kafka", ["Topics, partitions and records", "Producers and brokers", "Replication, ISR, high watermark", "Consumers, offsets and semantics", "Consumer groups and rebalancing", "Idempotence and transactions", "Retention, compaction and replay", "Operating Kafka: KRaft and lag", "Case study: one score event"]); }
export function sd_kafka_01() {
  const d = illustration('sd_kafka_01', 'ONE RETAINED EVENT, TWO READERS, TWO INDEPENDENT POSITIONS', 320);
  d.text(320, 52, 'scores topic, partition 0', { cls: 'ttl' });
  klog(d, 100, 68, 100, 10);
  mark(d, 100 + 4 * 44, 98, 'projector at 104', false, false);
  mark(d, 100 + 8 * 44, 98, 'notifications at 108', true, false);
  d.server(170, 180, 70, 70, { unit: 15, label: 'projector' });
  d.server(430, 180, 70, 70, { unit: 15, label: 'notifier', fill: C.accSoft, stroke: C.acc });
  d.travel([[276, 160], [276, 112]], { dur: 3, r: 3, color: C.ink2 });
  d.travel([[452, 160], [452, 112]], { dur: 2, r: 3 });
  d.text(320, 306, 'reading does not delete; each reader can replay from its own position', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_02() {
  const d = illustration('sd_kafka_02', 'A RECORD IS KEY, VALUE, HEADERS AND TIME; THE CONSUMER DECIDES WHAT IT MEANS', 330);
  d.rect(40, 60, 360, 120, { r: 6, fill: C.paper, stroke: C.ink2 });
  [['key', 'match-7', 80], ['value', '{goal, home, 71′} (bytes)', 110], ['headers', 'event-id: e9, schema: v3', 140], ['timestamp', '…', 170]].forEach(([k, v, y], i) => { d.text(56, y - 6, k, { cls: 'xs', a: 'start' }); d.mono(140, y - 6, v, { size: 10, a: 'start', color: i === 2 ? C.acc : undefined }); });
  d.text(220, 200, 'the broker stores bytes; it does not parse the value', { cls: 'xs' });
  d.rect(430, 60, 180, 60, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(520, 80, 'topic', { cls: 'ttl', size: 12 }); d.text(520, 100, 'partitions + retention policy', { cls: 'xs' });
  d.rect(430, 140, 180, 60, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(520, 160, 'consumer', { cls: 'ttl', size: 12, color: C.acc }); d.text(520, 180, 'reads with schema v3', { cls: 'xs' });
  d.arrow(406, 120, 424, 90, { stroke: C.gray, hl: 5 }); d.arrow(406, 140, 424, 168, { stroke: C.acc, hl: 5 });
  d.text(320, 270, 'same key places events together; the event id tells a retry from a new correction', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_03() {
const d=illustration('sd_kafka_03','A TOPIC IS SEVERAL INDEPENDENT ORDERED LOGS',354);
  d.text(49,49,'partition',{cls:'ttl',a:'start'});d.text(478,49,'append direction',{cls:'sm'});
  for(let i=0;i<4;i++){d.mono(46,92+i*62,`P${i}`,{size:13});figShelf(d,99,70+i*62,['event','event','event','next'],{width:463,height:39,hot:i===1?2:-1});d.arrow(568,90+i*62,608,90+i*62,{stroke:C.ink2,hl:5});}
  d.mono(320,335,'20 events/s ÷ 4 partitions = 5 events/s each, if balanced',{size:11});return d.svg();
}
export function sd_kafka_04() {
  const d = illustration('sd_kafka_04', '20 EVENTS/S × 86,400 S × 200 B × 7 DAYS × 3 COPIES = 7,257,600,000 B', 320);
  for (let i = 0; i < 7; i++) d.doc(40 + i * 42, 70, 34, 46, { lines: false, fill: C.card });
  d.text(180, 136, '7 days', { cls: 'sm' });
  d.mono(180, 158, '1,728,000 events/day', { size: 10 });
  d.mono(180, 176, '345,600,000 B/day', { size: 10 });
  d.arrow(330, 110, 380, 110, { stroke: C.ink2 });
  [0, 1, 2].forEach((k) => { d.disk(430 + k * 70, 110, 56, { fill: C.accSoft, stroke: C.acc }); d.text(430 + k * 70, 150, `broker ${k + 1}`, { cls: 'xs' }); });
  d.mono(500, 190, '7,257,600,000 B', { size: 11, color: C.acc });
  d.text(320, 250, 'before segment, index and filesystem overhead', { cls: 'xs' });
  d.text(320, 272, 'a size limit can cut history shorter than 7 days during a burst', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_05() {
  const d = illustration('sd_kafka_05', 'ASK ANY BROKER FOR METADATA, THEN SEND STRAIGHT TO THE PARTITION LEADER', 330);
  d.server(30, 120, 70, 80, { label: 'producer' });
  ['A', 'B', 'C'].forEach((s, i) => d.server(330 + i * 100, 80, 70, 90, { unit: 15, label: `broker ${s}`, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }));
  d.arrow(106, 140, 424, 110, { stroke: C.gray, dash: [4, 4] }); d.mono(240, 112, '1 bootstrap: metadata?', { size: 9 });
  d.arrow(424, 130, 106, 160, { stroke: C.gray, dash: [4, 4] }); d.mono(240, 168, 'scores-0 leader = A', { size: 9 });
  d.arrow(106, 190, 324, 150, { stroke: C.acc }); d.mono(214, 200, '2 produce to A', { size: 9, color: C.acc });
  d.travel([[106, 190], [324, 150]], { dur: 3, token: 'packet' });
  d.text(320, 270, 'if A loses leadership: refresh metadata, resend under the same producer id', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_06() {
  const d = illustration('sd_kafka_06', 'RECORDS WAIT IN A BOUNDED BUFFER UNTIL SIZE OR LINGER CLOSES THE BATCH', 320);
  d.text(110, 56, 'partition buffer', { cls: 'ttl' });
  d.rect(30, 70, 170, 110, { r: 6, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 4; i++) d.travel([[20, 60], [50 + i * 36, 110]], { dur: 3, at: [i / 6, i / 6 + 0.3], token: (g) => g.envelope(-12, -8, 24, 16) });
  for (let i = 0; i < 4; i++) d.envelope(40 + i * 38, 96, 30, 20, { fill: C.card });
  d.mono(115, 150, 'records 100–103', { size: 9.5 });
  d.clock(260, 120, 40); d.text(260, 158, 'linger', { cls: 'xs' });
  d.rect(320, 90, 120, 60, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(380, 112, 'batch', { cls: 'ttl', color: C.acc }); d.text(380, 132, 'compressed', { cls: 'xs' });
  d.arrow(204, 120, 236, 120, { stroke: C.gray, hl: 5 }); d.arrow(284, 120, 314, 120, { stroke: C.gray, hl: 5 });
  d.server(520, 80, 70, 80, { label: 'leader' });
  d.arrow(446, 120, 512, 120, { stroke: C.acc });
  d.travel([[446, 120], [512, 120]], { dur: 3, at: [0.6, 0.9], r: 4 });
  d.text(320, 240, 'one bounded produce request; one ack resolves all four records', { cls: 'sm' });
  d.text(320, 266, 'no record has an offset until the broker appends it', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_07() {
const d=illustration('sd_kafka_07','AN APPEND ASSIGNS AN OFFSET IN THE ACTIVE LOG SEGMENT',320);
  d.doc(33,64,122,133,{lines:false});d.text(94,90,'closed segment',{cls:'sm'});[0,1,2].forEach(i=>d.line(47,124+i*20,140,124+i*20,{stroke:C.line,single:true}));
  d.rect(211,60,354,162,{fill:C.paper,stroke:C.ink2});d.text(228,80,'active segment',{cls:'ttl',a:'start'});figShelf(d,232,110,[100,101,102,103],{width:312,height:49,hot:3});
  d.text(478,192,'bytes + indexes',{cls:'sm'});
  d.envelope(454,251,49,31);d.arrow(479,243,505,173,{stroke:C.acc});d.mono(390,271,'append next at 104',{a:'end',size:12});
  d.text(320,307,'the local log end is the next position, not the last assigned offset',{cls:'sm'});return d.svg();
}
export function sd_kafka_08() {
  const d = illustration('sd_kafka_08', 'LOG START 100, END 104, VISIBLE BELOW 103; THE GROUP KEEPS ITS OWN POSITION', 300);
  klog(d, 120, 110, 100, 5, { cw: 64, dim: (o) => o >= 103 });
  d.rect(120 + 5 * 64, 110, 64, 30, { r: 0, stroke: C.faint, dash: [3, 4] }); d.text(120 + 5.5 * 64, 125, 'next', { cls: 'xs' });
  mark(d, 120, 110, 'log start 100');
  mark(d, 120 + 3 * 64, 110, 'high watermark 103');
  mark(d, 120 + 5 * 64, 110, 'log end 104', false, true);
  mark(d, 120 + 2 * 64, 140, 'group committed 102', true, false);
  d.text(320, 250, 'what the broker may expose and what this application has handled are different numbers', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_09() {
const d=illustration('sd_kafka_09','REPLICATION PROGRESS CAN LEAVE A LOCAL TAIL NOT YET VISIBLE',355);
  const xs=160,cw=99;
  ['leader','follower A','follower B'].forEach((s,i)=>{d.text(31,105+i*74,s,{cls:'ttl',a:'start'});figShelf(d,xs,81+i*74,i===2?[100,101,102,'absent']:[100,101,102,103],{width:cw*4,height:42,hot:i<2?3:-1});d.mono(604,105+i*74,i===2?103:104,{size:11});});
  d.line(xs+3*cw,58,xs+3*cw,286,{stroke:C.acc,single:true,sw:2});
  d.text(xs+3*cw,45,'watermark 103',{cls:'mono',size:11,color:C.acc});
  d.text(319,318,'records 100 through 102 are below the exclusive boundary',{cls:'sm'});return d.svg();
}
export function sd_kafka_10() {
  const d = illustration('sd_kafka_10', 'acks=all WITH min.insync=2: WITH ONE IN-SYNC COPY, THE WRITE IS REFUSED', 330);
  panel(d, 20, 44, 292, 240, 'acks=all, min ISR 2', true);
  [['leader', 1], ['follower', 0], ['follower', 0]].forEach(([s, up], i) => { d.server(50 + i * 84, 90, 56, 70, { unit: 14, fill: up ? C.accSoft : C.paper, stroke: up ? C.acc : C.gray }); d.text(78 + i * 84, 176, s, { cls: 'xs' }); if (!up) cross(d, 78 + i * 84, 125, 10, C.gray); });
  d.text(166, 214, 'ISR = 1 < 2', { cls: 'mono', size: 11 });
  d.text(166, 240, 'NotEnoughReplicas: reject', { cls: 'sm', color: C.acc });
  panel(d, 328, 44, 292, 240, 'acks=1');
  [['leader', 1], ['follower', 0], ['follower', 0]].forEach(([s, up], i) => { d.server(358 + i * 84, 90, 56, 70, { unit: 14, fill: up ? C.card : C.paper, stroke: up ? C.ink2 : C.gray }); d.text(386 + i * 84, 176, s, { cls: 'xs' }); });
  tick(d, 474, 214, 8, C.ink2);
  d.text(474, 240, 'accepted on one copy', { cls: 'sm' });
  d.text(320, 310, 'the weaker setting answers faster and can lose the write with the leader', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_11() {
  const d = illustration('sd_kafka_11', 'THE HIGH WATERMARK RISES FROM 103 TO 104 ONCE EVERY IN-SYNC REPLICA HAS 103', 320);
  [['leader', 104], ['follower 1', 104], ['follower 2', 103]].forEach(([s, end], i) => {
    const y = 60 + i * 60;
    d.text(30, y + 15, s, { cls: 'sm', a: 'start' });
    klog(d, 130, y, 100, end - 100, { cw: 56 });
    if (end === 103) d.during([0.5, 1], (g) => { g.rect(130 + 3 * 56, y, 56, 30, { r: 0, fill: C.card, stroke: C.ink2 }); g.mono(130 + 3.5 * 56, y + 15, '103', { size: 9.5 }); });
  });
  d.during([0, 0.5], (g) => { g.line(130 + 3 * 56, 50, 130 + 3 * 56, 240, { stroke: C.ink2, sw: 1.6, single: true }); g.text(130 + 3 * 56, 256, 'HW 103', { cls: 'xs' }); });
  d.during([0.5, 1], (g) => { g.line(130 + 4 * 56, 50, 130 + 4 * 56, 240, { stroke: C.acc, sw: 2, single: true }); g.text(130 + 4 * 56, 256, 'HW 104: 103 visible', { cls: 'xs', color: C.acc }); });
  d.travel([[130 + 3.5 * 56, 90], [130 + 3.5 * 56, 194]], { dur: 6, at: [0.2, 0.5], r: 3.5 });
  d.text(320, 300, 'the consumer group\'s checkpoint does not move with it', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_12() {
  const d = illustration('sd_kafka_12', 'THE OLD LEADER\'S UNREPLICATED TAIL IS DISCARDED; THE NEW EPOCH IS THE SOURCE', 330);
  d.text(30, 72, 'old leader', { cls: 'sm', a: 'start' }); klog(d, 140, 58, 100, 5, { cw: 52, dim: (o) => o >= 103 });
  bolt(d, 430, 50);
  d.text(30, 132, 'follower → leader', { cls: 'sm', a: 'start', color: C.acc }); klog(d, 140, 118, 100, 3, { cw: 52, hot: () => true });
  chip(d, 310, 122, 90, 'epoch 6', true);
  d.text(30, 210, 'old leader returns', { cls: 'sm', a: 'start' }); klog(d, 140, 196, 100, 3, { cw: 52 });
  d.rect(140 + 3 * 52, 196, 104, 30, { r: 0, stroke: C.gray, dash: [3, 3] }); cross(d, 140 + 4 * 52, 211, 14, C.gray);
  d.text(470, 211, 'truncate to 103, fetch', { cls: 'xs', a: 'start' });
  d.text(320, 286, 'being alive again does not make 103 and 104 accepted', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_13() {
const d=illustration('sd_kafka_13','FETCH POSITION CAN ADVANCE BEFORE THE EFFECTS ARE SAFELY COMMITTED',320);
  figShelf(d,66,75,[100,101,102,103],{width:508,height:63,hot:2});
  d.line(319,55,319,171,{stroke:C.acc,single:true,sw:2});d.text(319,39,'next position: 102',{cls:'ttl',color:C.acc});
  [130,257].forEach(x=>{d.lock(x-13,203,26);d.text(x,255,'effect safe',{cls:'sm'});});
  d.text(441,233,'restart at 102',{cls:'ttl'});d.text(320,291,'commit 102 after the covered effects for 100 and 101 are complete',{cls:'sm'});return d.svg();
}
export function sd_kafka_14() {
  const d = illustration('sd_kafka_14', 'COMMIT 102 FIRST, CRASH BEFORE THE EFFECTS: 100 AND 101 ARE SKIPPED FOREVER', 300);
  klog(d, 140, 70, 100, 6, { cw: 60, dim: (o) => o < 102 });
  mark(d, 140 + 2 * 60, 100, 'committed 102 (before work)', true, false);
  bolt(d, 200, 150);
  d.text(320, 210, 'restart reads from 102', { cls: 'sm' });
  d.text(320, 232, 'nothing in this group ever revisits 100 and 101', { cls: 'sm', color: C.acc });
  d.text(320, 270, 'at-most-once: fine for a clock tick, wrong for a goal', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_15() {
  const d = illustration('sd_kafka_15', 'APPLY 100 AND 101, CRASH BEFORE THE COMMIT: RESTART REPEATS THEM', 300);
  klog(d, 140, 70, 100, 6, { cw: 60, hot: (o) => o < 102 });
  mark(d, 140, 100, 'still committed 100', false, false);
  bolt(d, 280, 150);
  d.carrow([[260, 190], [200, 220], [170, 110]], { stroke: C.acc, hl: 6 });
  d.text(400, 210, 'restart from 100: both effects come again', { cls: 'sm' });
  d.text(400, 232, 'the effect must recognise them', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_kafka_16() {
  const d = illustration('sd_kafka_16', 'THE SOURCE ID AND THE EFFECT COMMIT IN THE DATABASE; KAFKA PROGRESS FOLLOWS LATER', 320);
  klog(d, 30, 70, 100, 4, { cw: 50, hot: (o) => o === 101 });
  d.rect(270, 50, 330, 120, { r: 8, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(435, 68, 'one database transaction', { cls: 'ttl', color: C.acc, size: 12 });
  chip(d, 290, 86, 290, 'applied(topic, partition, offset 101)', true, 26); chip(d, 290, 122, 290, 'score view update', false, 26);
  d.arrow(236, 85, 284, 99, { stroke: C.acc, hl: 6 });
  d.carrow([[435, 176], [300, 230], [130, 108]], { stroke: C.gray, dash: [4, 4] }); d.text(300, 246, 'commit offset 102 to Kafka, separately', { cls: 'xs' });
  d.text(320, 290, 'replay of 101 finds the row and skips; a republished outbox row needs a domain id', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_17() {
const d=illustration('sd_kafka_17','GROUP MEMBERS SHARE PARTITIONS; DIFFERENT GROUPS KEEP THEIR OWN PROGRESS',380);
  for(let i=0;i<4;i++){const y=58+i*69;d.mono(48,y+19,`P${i}`,{size:12});figShelf(d,88,y,['event','event'],{width:173,height:33,hot:i===1?1:-1});d.cpu(349,y-2,38,{label:`M${i}`});d.arrow(268,y+16,341,y+16,{stroke:C.acc,hl:5});}
  d.text(368,35,'projector group',{cls:'ttl'});d.text(530,35,'notification group',{cls:'ttl'});
  for(let i=0;i<4;i++)d.arrow(268,74+i*69,504,82+i*46,{stroke:C.line,hl:4});d.server(512,84,63,153,{unit:31});
  [352,415].forEach(x=>d.cpu(x,328,29,{label:'idle',stroke:C.line}));d.text(466,341,'6 members; 4 active, 2 idle',{cls:'sm',a:'start',size:10});return d.svg();
}
export function sd_kafka_18() {
  const d = illustration('sd_kafka_18', 'HEARTBEATS SAY THE PROCESS IS ALIVE; ONLY POLLING SAYS THE WORK IS MOVING', 320);
  d.server(40, 90, 80, 100, { label: 'consumer' });
  d.server(480, 90, 100, 100, { label: 'group coordinator' });
  d.mono(300, 92, '♥ heartbeat thread', { size: 10 });
  for (let k = 0; k < 3; k++) d.travel([[126, 110], [474, 110]], { dur: 3, at: [k / 3, k / 3 + 0.3], r: 3, color: C.ink2 });
  d.arrow(126, 160, 474, 160, { stroke: C.acc, dash: [4, 4] }); d.mono(300, 178, 'poll: last at 102, stalled', { size: 10, color: C.acc });
  d.clock(80, 236, 34, { spin: 2 }); d.text(80, 270, 'stuck DB call', { cls: 'xs' });
  d.text(330, 240, 'max.poll.interval exceeded: partition reassigned', { cls: 'sm' });
  d.text(330, 262, 'the stuck call may still finish later', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_kafka_19() {
  const d = illustration('sd_kafka_19', 'THE PARTITION MOVES; THE OLD MEMBER\'S WORK FINISHES AFTER ITS GENERATION ENDED', 330);
  d.server(40, 70, 80, 90, { label: 'old member (gen 4)' });
  d.server(520, 70, 80, 90, { label: 'new member (gen 5)', fill: C.accSoft, stroke: C.acc });
  klog(d, 200, 90, 101, 4, { cw: 60, hot: (o) => o === 102 });
  mark(d, 200 + 60, 90, 'committed 102');
  d.arrow(126, 120, 194, 105, { stroke: C.gray, dash: [4, 4] }); d.arrow(514, 120, 266, 108, { stroke: C.acc, hl: 6 });
  d.db(260, 200, 120, 80, { label: 'external DB' });
  d.arrow(110, 170, 254, 230, { stroke: C.ink2 }); d.text(150, 230, 'late write', { cls: 'xs' });
  d.arrow(540, 170, 386, 230, { stroke: C.acc }); d.text(500, 230, 'same effect', { cls: 'xs', color: C.acc });
  d.text(320, 312, 'Kafka rejects the old commit; the database needs its own guard', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_20() {
  const d = illustration('sd_kafka_20', '103 FINISHED BEFORE 102: THE SAFE COMMIT STAYS AT 102 UNTIL 102 IS DONE', 300);
  klog(d, 140, 80, 100, 5, { cw: 70, hot: (o) => o === 102, label: (o) => (o < 102 || o === 103 ? `${o} ✓` : o === 102 ? '102 …' : `${o}`) });
  mark(d, 140 + 2 * 70, 80, 'safe commit 102', true);
  d.line(140 + 4 * 70, 80, 140 + 4 * 70, 130, { stroke: C.gray, dash: [3, 3], single: true }); d.text(140 + 4 * 70, 146, 'commit 104 would skip 102', { cls: 'xs' }); cross(d, 140 + 4 * 70, 118, 6, C.gray);
  d.text(320, 210, 'track completed offsets; advance only over a contiguous done prefix', { cls: 'sm' });
  d.text(320, 234, 'if 102 never resolves, pause new work rather than let the gap grow', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_21() {
const d=illustration('sd_kafka_21','A RETRIED PRODUCER SEQUENCE DOES NOT APPEND A SECOND COPY',335);
  [['first: sequence 0',70],['retry: sequence 0',166],['new: sequence 1',262]].forEach(([s,y],i)=>{d.envelope(39,y,127,40,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.text(102,y+60,s,{cls:'sm'});d.arrow(174,y+20,277,y+20,{stroke:i===1?C.acc:C.line,hl:5});});
  d.rect(295,55,160,251,{fill:C.paper,stroke:C.ink2});d.text(375,78,'producer state',{cls:'ttl'});d.mono(375,166,'same sequence',{size:11,color:C.acc});d.text(375,190,'deduplicate',{cls:'sm'});
  figPage(d,518,89,77,125,'offset 100',true);d.arrow(463,104,510,104,{stroke:C.acc});d.text(553,249,'one stored batch',{cls:'sm'});return d.svg();
}
export function sd_kafka_22() {
  const d = illustration('sd_kafka_22', 'THE RESTARTED PRODUCER TAKES EPOCH 9; THE PAUSED ONE WAKES AT 8 AND IS FENCED', 320);
  d.server(40, 70, 80, 90, { label: 'old producer, epoch 8' });
  d.server(40, 200, 80, 80, { label: 'restarted, epoch 9', fill: C.accSoft, stroke: C.acc });
  d.server(400, 110, 110, 110, { label: 'transaction coordinator' });
  chip(d, 410, 80, 90, 'tx-id: proj-1', false);
  d.arrow(126, 240, 394, 180, { stroke: C.acc }); d.mono(260, 230, 'init: epoch 9', { size: 9.5, color: C.acc });
  d.arrow(126, 110, 394, 140, { stroke: C.ink2 }); d.travel([[126, 110], [390, 140], [150, 150]], { dur: 4, label: '8', w: 20, fill: C.card, color: C.ink2 });
  cross(d, 380, 138, 8);
  d.text(260, 104, 'resumes with epoch 8', { cls: 'xs' });
  d.text(560, 250, 'ProducerFenced', { cls: 'mono', size: 10, color: C.acc });
  return d.svg();
}
export function sd_kafka_23() {
  const d = illustration('sd_kafka_23', 'A KAFKA TRANSACTION COVERS OUTPUT RECORDS AND INPUT OFFSETS, NOT YOUR DATABASE', 320);
  d.rect(30, 56, 390, 160, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(225, 76, 'one Kafka transaction', { cls: 'ttl' });
  d.tape(50, 96, ['out 1', 'out 2'], { cw: 70, h: 28 }); d.text(120, 140, 'output topic', { cls: 'xs' });
  chip(d, 240, 100, 160, 'input offset → 205', false, 26); d.text(320, 140, 'consumer offsets', { cls: 'xs' });
  d.mono(225, 186, 'commit: both visible · abort: neither', { size: 10 });
  d.db(480, 80, 110, 110, { label: 'external DB', fill: C.accSoft, stroke: C.acc });
  d.line(450, 50, 450, 240, { stroke: C.acc, dash: [5, 4], single: true });
  d.text(535, 220, 'outside: needs its\nown dedupe', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_kafka_24() {
  const d = illustration('sd_kafka_24', 'REPLICATED TO 103, BUT A TRANSACTION OPEN AT 102 HOLDS READ_COMMITTED READERS AT 102', 300);
  klog(d, 140, 90, 99, 5, { cw: 66, hot: (o) => o === 102 });
  d.text(140 + 3.5 * 66, 140, 'open tx', { cls: 'xs', color: C.acc });
  mark(d, 140 + 4 * 66, 90, 'high watermark 103');
  mark(d, 140 + 3 * 66, 120, 'last stable offset 102', true, false);
  d.travel([[140, 180], [140 + 3 * 66, 180]], { dur: 4, r: 4 });
  d.text(320, 236, 'committed readers stop here until the transaction commits or aborts', { cls: 'sm' });
  return d.svg();
}
export function sd_kafka_25() {
  const d = illustration('sd_kafka_25', 'THE SEGMENT 0–999 IS DELETED; A READER STILL AT 640 MUST RESET OR REBUILD', 300);
  d.rect(60, 90, 220, 50, { r: 3, fill: C.paper, stroke: C.gray, dash: [4, 4] }); d.mono(170, 115, 'offsets 0–999', { size: 10, color: C.gray });
  cross(d, 170, 115, 26, C.gray);
  d.rect(290, 90, 220, 50, { r: 3, fill: C.card, stroke: C.ink2 }); d.mono(400, 115, 'offsets 1,000–1,999', { size: 10 });
  d.rect(520, 90, 70, 50, { r: 3, fill: C.card, stroke: C.ink2, dash: [3, 3] }); d.text(555, 115, 'active', { cls: 'xs' });
  d.pin(60 + 640 * 0.22, 86, { fill: C.accSoft, stroke: C.acc, label: 'reader at 640', dy: -36 });
  d.text(320, 200, 'earliest retained is 1,000: asking for 640 forever will not help', { cls: 'sm' });
  d.text(320, 224, 'jumping to the newest offset silently skips history', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_kafka_26() {
const d=illustration('sd_kafka_26','COMPACTION KEEPS KEYED STATE WITHOUT RENUMBERING OFFSETS',330);
  const before=[['A','old'],['B','value'],['A','new'],['C','delete']];
  d.text(45,51,'before',{cls:'ttl',a:'start'});d.text(45,189,'after',{cls:'ttl',a:'start'});
  before.forEach(([k,v],i)=>{figPage(d,151+i*113,71,91,79,'',i===2);d.mono(197+i*113,92,`key ${k}`,{size:10});d.text(197+i*113,122,v,{cls:'sm'});d.mono(197+i*113,164,i,{size:10});});
  before.forEach(([k,v],i)=>{if(i===0){d.rect(151,210,91,65,{r:0,stroke:C.line,dash:[3,4]});d.text(197,242,'removed',{cls:'sm'});}else{figPage(d,151+i*113,210,91,65,v,i===2);}d.mono(197+i*113,291,i,{size:10});});
  d.text(320,319,'illustrative offsets; deletion is represented by a retained tombstone',{cls:'sm'});return d.svg();
}
export function sd_kafka_27() {
  const d = illustration('sd_kafka_27', 'REBUILD A VIEW: REPLAY INTO A NEW STORE, CATCH UP, CHECK, THEN CUT OVER', 320);
  klog(d, 30, 60, 0, 11, { cw: 40 });
  d.travel([[30, 75], [470, 75]], { dur: 5, token: (g) => g.line(0, -18, 0, 18, { stroke: C.acc, sw: 1.4, single: true }) });
  d.db(80, 140, 100, 90, { label: 'old view' });
  d.db(300, 140, 100, 90, { label: 'new view', fill: C.accSoft, stroke: C.acc });
  d.arrow(350, 96, 350, 134, { stroke: C.acc, hl: 6 });
  d.phone(540, 150, 60);
  d.during([0, 0.7], (g) => g.arrow(534, 180, 186, 186, { stroke: C.ink2, hl: 6 }));
  d.during([0.7, 1], (g) => g.arrow(534, 180, 406, 186, { stroke: C.acc, hl: 6 }));
  d.text(320, 280, 'needs spare capacity beyond live arrivals; switch at a checked boundary', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_28() {
  const d = illustration('sd_kafka_28', 'OLD RECORDS KEEP THEIR SCHEMA; THE NEW READER MUST STILL UNDERSTAND THEM', 330);
  d.tape(40, 70, ['v1', 'v1', 'v2', 'v2', 'v3', 'v3'], { cw: 60, h: 30, hot: (i) => i >= 4 });
  d.text(220, 56, 'retained history: three schema versions', { cls: 'xs' });
  d.server(470, 50, 80, 80, { label: 'reader v3', fill: C.accSoft, stroke: C.acc });
  d.arrow(404, 85, 462, 90, { stroke: C.acc, hl: 6 });
  const v = [['schema version', 'how to parse the bytes'], ['aggregate version', 'order of changes to one match'], ['offset', 'position in one partition']];
  v.forEach(([s, t], i) => { d.text(60, 170 + i * 36, s, { cls: 'ttl', a: 'start', size: 12, color: i === 0 ? C.acc : undefined }); d.text(260, 170 + i * 36, t, { cls: 'sm', a: 'start' }); });
  d.text(320, 300, 'during a rolling deploy, old readers also see new records: test both ways', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_29() {
  const d = illustration('sd_kafka_29', 'KRAFT CONTROLLERS AGREE ON METADATA; BROKERS REPLICATE THE RECORDS', 330);
  d.rect(30, 50, 250, 140, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(155, 70, 'controller quorum (KRaft)', { cls: 'ttl', size: 12 });
  [0, 1, 2].forEach((i) => d.server(56 + i * 74, 90, 50, 60, { unit: 14, led: i === 0 ? () => true : undefined }));
  d.mono(155, 174, 'leader of scores-0 = B', { size: 9.5 });
  d.rect(330, 50, 280, 140, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(470, 70, 'brokers', { cls: 'ttl', size: 12 });
  ['A', 'B', 'C'].forEach((s, i) => { d.server(356 + i * 84, 90, 56, 60, { unit: 14, fill: s === 'B' ? C.accSoft : C.card, stroke: s === 'B' ? C.acc : C.ink2 }); d.mono(384 + i * 84, 166, s, { size: 10 }); });
  d.arrow(410, 120, 438, 120, { stroke: C.ink2, hl: 5 }); d.arrow(522, 120, 494, 120, { stroke: C.ink2, hl: 5 });
  d.arrow(282, 120, 326, 120, { stroke: C.gray, dash: [4, 4] });
  d.server(260, 240, 70, 60, { unit: 14, label: 'client' });
  d.carrow([[336, 260], [420, 240], [452, 196]], { stroke: C.acc }); d.text(500, 262, 'refreshed route', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_kafka_30() {
  const d = illustration('sd_kafka_30', 'ONE BROKER\'S BYTES: PRODUCERS IN, FOLLOWERS COPYING, EACH CONSUMER GROUP OUT', 330);
  d.server(260, 100, 120, 130, { label: 'broker' });
  d.disk(320, 280, 40);
  d.arrow(60, 140, 252, 140, { stroke: C.ink2 }); d.text(150, 128, 'ingress', { cls: 'sm' });
  d.arrow(388, 120, 580, 80, { stroke: C.ink2 }); d.text(490, 80, 'follower fetch', { cls: 'xs' });
  d.arrow(388, 150, 580, 150, { stroke: C.ink2 }); d.text(490, 140, 'group 1 egress', { cls: 'xs' });
  d.arrow(388, 180, 580, 220, { stroke: C.ink2 }); d.text(490, 222, 'group 2 egress', { cls: 'xs' });
  d.arrow(388, 200, 580, 270, { stroke: C.acc, sw: 2 }); d.text(490, 290, 'catch-up replay', { cls: 'xs', color: C.acc });
  d.flowline([[388, 200], [580, 270]], { sw: 2 });
  d.text(150, 230, 'a hot partition can make\none broker the bottleneck', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_kafka_31() {
  const d = illustration('sd_kafka_31', 'A POISON RECORD AT 102 STALLS THE CONSUMER WHILE THE LOG KEEPS GROWING', 300);
  klog(d, 40, 80, 100, 12, { cw: 46, hot: (o) => o === 102 });
  mark(d, 40 + 2 * 46, 80, 'stuck at 102', true);
  d.travel([[40 + 12 * 46, 95], [40 + 12 * 46 + 30, 95]], { dur: 2, r: 3, color: C.ink2 });
  d.brace(40 + 3 * 46, 40 + 12 * 46, 122, { label: 'lag grows' });
  d.rect(100, 190, 440, 44, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(320, 212, 'bounded retries, then quarantine 102 and continue from 103', { cls: 'sm', color: C.acc });
  d.text(320, 268, 'advance only after the quarantine copy is safely written', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_32() {
  const d = illustration('sd_kafka_32', 'AN AUTHENTICATED CLIENT GETS ONLY ITS ACTIONS, AND A QUOTA ON ITS LOAD', 320);
  d.server(30, 100, 70, 80, { label: 'clip service' });
  d.key(60, 80, 30);
  d.rect(160, 60, 200, 160, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(260, 80, 'ACLs', { cls: 'ttl' });
  chip(d, 176, 100, 168, 'WRITE clips', false); chip(d, 176, 130, 168, 'READ scores', false);
  d.mono(260, 176, 'DELETE topic: no', { size: 9.5, color: C.gray }); cross(d, 330, 176, 6, C.gray);
  d.rect(400, 60, 200, 160, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(500, 80, 'quota', { cls: 'ttl', color: C.acc });
  d.rect(430, 120, 140, 24, { r: 3, stroke: C.ink2 }); d.fillRect(432, 122, 100, 20, C.accSoft);
  d.text(500, 170, 'throttled past its share', { cls: 'xs' });
  d.arrow(106, 140, 154, 140, { stroke: C.ink2, hl: 6 }); d.arrow(366, 140, 394, 140, { stroke: C.ink2, hl: 6 });
  d.text(320, 270, 'a noisy client slows itself, not the cluster', { cls: 'sm' });
  return d.svg();
}
export function sd_kafka_33() {
  const d = illustration('sd_kafka_33', 'SUCCESS PATH: SCORE + OUTBOX COMMIT, REPLICATED APPEND, PROJECTION EFFECT, OFFSET COMMIT', 320);
  const st = [['score + outbox', 'one DB commit'], ['Kafka append', 'acks=all'], ['projection', 'effect + id'], ['offset commit', 'next = 205']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    if (i === 0) d.db(x + 30, 56, 60, 66);
    if (i === 1) klog(d, x + 10, 74, 202, 3, { cw: 34, h: 28 });
    if (i === 2) d.server(x + 30, 54, 60, 70, { unit: 15, fill: C.accSoft, stroke: C.acc });
    if (i === 3) d.pin(x + 60, 110, { fill: C.card });
    d.text(x + 60, 150, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.text(x + 60, 172, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 120, 90, x + 146, 90, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 90], [540, 90]], { dur: 5, label: 'e9', w: 26 });
  d.text(320, 250, 'the notification group may still be behind: a current score does not prove delivery', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_34() {
  const d = illustration('sd_kafka_34', 'THE APPEND HAPPENED, THE REPLY DIDN\'T; THE RELAY RESENDS AND THE EFFECT STAYS SINGLE', 320);
  d.db(30, 80, 90, 80, { label: 'outbox: pending' });
  d.server(190, 80, 70, 80, { label: 'relay' });
  d.server(350, 70, 90, 100, { label: 'broker' });
  d.arrow(126, 120, 184, 120, { stroke: C.ink2, hl: 6 });
  d.arrow(266, 100, 344, 100, { stroke: C.ink2 }); d.arrow(344, 140, 266, 140, { stroke: C.gray }); bolt(d, 305, 124, 0.6);
  d.travel([[266, 180], [344, 150]], { dur: 4, at: [0.5, 0.9], label: 'seq 0', w: 40 });
  d.text(395, 196, 'same producer id + seq 0:\nno second append', { cls: 'xs', vc: true });
  d.server(510, 80, 80, 80, { label: 'consumer', fill: C.accSoft, stroke: C.acc });
  d.arrow(446, 120, 504, 120, { stroke: C.acc, hl: 6 });
  d.text(320, 280, 'a relay restart can republish as a new record: the domain id still dedupes', { cls: 'xs' });
  return d.svg();
}
export function sd_kafka_35() {
  const d = illustration('sd_kafka_35', 'PAUSE 10 S AT 20/S = 200 BEHIND; 100/S − 20/S = 80 SPARE; 200 ÷ 80 = 2.5 S', 300);
  const X = 60, s = 30;
  d.line(X, 220, X + 15 * s, 220, { stroke: C.ink2, single: true });
  d.line(X, 80, X, 220, { stroke: C.ink2, single: true });
  d.lines([[X, 220], [X + 10 * s, 220 - 200 * 0.6], [X + 12.5 * s, 220]], { stroke: C.acc, sw: 2, single: true });
  d.mono(X + 10 * s, 220 - 200 * 0.6 - 14, '200 records', { size: 10, color: C.acc });
  [0, 5, 10, 12.5].forEach((t) => d.mono(X + t * s, 236, `${t}`, { size: 9 }));
  d.text(X + 5 * s, 250, 'paused', { cls: 'xs' }); d.text(X + 11.25 * s, 250, 'drain 2.5 s', { cls: 'xs', color: C.acc });
  d.text(X - 8, 80, 'lag', { cls: 'xs', a: 'end' });
  d.travel([[X, 220], [X + 10 * s, 100], [X + 12.5 * s, 220]], { dur: 5, r: 4 });
  return d.svg();
}
export function sd_kafka_36() {
  const d = illustration('sd_kafka_36', 'ONE DELAYED TASK WANTS A QUEUE; MANY INDEPENDENT REPLAYING READERS WANT A LOG', 320);
  panel(d, 20, 44, 292, 220, 'a queue is enough');
  d.envelope(60, 100, 60, 36); d.arrow(126, 118, 196, 118, { stroke: C.ink2, hl: 6 }); d.server(206, 92, 60, 54, { unit: 14 });
  d.text(166, 190, 'one handler, no history', { cls: 'sm' });
  panel(d, 328, 44, 292, 220, 'Kafka earns its cost', true);
  klog(d, 350, 90, 0, 6, { cw: 40, h: 26 });
  [0, 1, 2].forEach((k) => d.pin(370 + k * 80, 150, { fill: k === 1 ? C.accSoft : C.card, stroke: k === 1 ? C.acc : C.ink }));
  d.text(474, 190, 'independent readers, replay, order per key', { cls: 'xs' });
  d.text(320, 296, 'partitions, retention and operations are a cost; buy them for a requirement', { cls: 'xs' });
  return d.svg();
}

import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
export function where_sd_nosql(stage=99) { return systemMap("sd_nosql", ["Access-pattern-driven design", "Key-value stores: Redis, DynamoDB", "Document stores: MongoDB", "Wide-column: Cassandra, Bigtable", "Graph databases and SQL vs NoSQL", "Eventual consistency and quorums", "Case study: a complete data model"], stage); }
export function cover_sd_nosql() { return systemCover("sd_nosql", 4, ["NoSQL", "databases"], "NoSQL databases", ["Access-pattern-driven design", "Key-value stores: Redis, DynamoDB", "Document stores: MongoDB", "Wide-column: Cassandra, Bigtable", "Graph databases and SQL vs NoSQL", "Eventual consistency and quorums", "Case study: a complete data model"]); }
export function sd_nosql_access() {
  const d = illustration('sd_nosql_access', 'THE REQUEST NAMES THE KEY: ONE RECORD, OR ONE BOUNDED RANGE', 330);
  d.phone(30, 60, 70, { label: 'latest score?' });
  d.phone(30, 190, 70, { label: 'last 50 events?' });
  d.text(330, 46, 'store keyed by match_id', { cls: 'ttl' });
  d.rect(170, 60, 440, 220, { r: 6, fill: C.paper, stroke: C.line });
  chip(d, 190, 82, 120, 'latest:m7', true, 26); chip(d, 330, 82, 160, 'home 2 · away 1 · v12', false, 26);
  d.arrow(84, 96, 184, 96, { stroke: C.acc });
  d.travel([[84, 96], [184, 96]], { dur: 3, r: 3.5 });
  for (let i = 0; i < 7; i++) { const hot = i >= 2 && i <= 5; chip(d, 190 + i * 58, 168, 52, `m7:${String(i + 101)}`, hot, 26); }
  d.brace(306, 532, 206, { label: 'seek, then stop after 50' });
  d.arrow(84, 222, 300, 186, { stroke: C.ink2 });
  d.travel([[306, 181], [530, 181]], { dur: 4, token: (g) => g.line(0, -16, 0, 16, { stroke: C.acc, sw: 1.4, single: true, rough: 0.2 }) });
  d.text(320, 300, 'one hour at 20 events/s: 72,000 events, 14,400,000 B', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_copies() {
  const d = illustration('sd_nosql_copies', 'ONE NAME, THREE COPIES, THREE DIFFERENT FRESHNESS RULES', 330);
  d.person(70, 120, 46);
  chip(d, 22, 186, 96, 'name: "Ana R."', true, 26);
  d.text(70, 230, 'source owner', { cls: 'ttl' });
  const t = [['current profile', 'must follow renames', 76, true], ['historical event label', 'keeps the old name', 160, false], ['search document', 'catches up later', 244, false]];
  t.forEach(([s, rule, y, hot]) => {
    d.carrow([[124, 198], [220, y + 14], [340, y + 14]], { stroke: hot ? C.acc : C.gray, hl: 6 });
    d.doc(350, y - 12, 54, 52, { lines: false, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.text(418, y + 6, s, { cls: 'ttl', a: 'start', size: 12 });
    d.text(418, y + 24, rule, { cls: 'sm', a: 'start' });
  });
  d.travel('M124,198 Q220,90 340,90', { dur: 3, r: 3.5 });
  d.text(320, 312, 'assign each copy an owner and a currency rule before copying', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_kv() {
  const d = illustration('sd_nosql_kv', 'GET score:m7 HASHES TO ONE SLOT AND RETURNS VALUE PLUS VERSION', 320);
  d.server(26, 90, 70, 90, { label: 'app' });
  d.mono(160, 104, 'GET score:m7', { size: 11 });
  d.arrow(104, 120, 214, 120, { stroke: C.acc });
  d.text(250, 70, 'hash table', { cls: 'ttl' });
  for (let i = 0; i < 8; i++) d.rect(220, 82 + i * 26, 64, 24, { r: 0, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.line });
  d.mono(252, 173, 'h(m7)', { size: 9 });
  chip(d, 320, 150, 180, '{home:2, away:1}', true, 30);
  chip(d, 510, 150, 90, 'v12', false, 30);
  d.arrow(286, 164, 314, 164, { stroke: C.acc, hl: 6 });
  d.travel([[104, 120], [252, 120], [252, 164], [410, 164]], { dur: 4, r: 3.5 });
  d.text(320, 268, 'if Redis is a rebuildable cache, a miss rebuilds from the event log;', { cls: 'sm' });
  d.text(320, 288, 'if it owns the score, state its persistence and recovery contract', { cls: 'sm' });
  return d.svg();
}
export function sd_nosql_partition() {
  const d = illustration('sd_nosql_partition', 'PARTITION KEY m7 PICKS THE OWNER; THE SORT KEY ORDERS EVENTS INSIDE', 330);
  [0, 1, 2, 3].forEach((i) => {
    const x = 30 + i * 150, hot = i === 1;
    d.server(x + 30, 50, 80, 70, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, led: hot ? () => true : undefined });
    d.text(x + 70, 136, `owner ${i + 1}`, { cls: 'xs', color: hot ? C.acc : undefined });
  });
  d.mono(250, 162, 'partition = m7', { size: 11, color: C.acc });
  d.arrow(250, 150, 250, 124, { stroke: C.acc, hl: 6 });
  d.tape(130, 176, ['seq 1', 'seq 2', 'seq 3', 'seq 4', 'seq 5'], { cw: 76, h: 28, hot: (i) => i === 4 });
  d.text(320, 220, 'sorted by sequence', { cls: 'sm' });
  d.text(320, 258, 'a popular match can overload its single owner:', { cls: 'sm' });
  d.mono(320, 280, '10,000 reads/s ÷ 4 usable read copies = 2,500 per copy', { size: 10 });
  d.text(320, 304, 'read copies do not turn one ordered writer into four', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_document() {
const d=illustration('sd_nosql_document','A DOCUMENT KEEPS ONE OWNED AGGREGATE TOGETHER',345);
  d.doc(166,48,302,256,{lines:false,fill:C.card});
  const lines=['{','  clip: c9,','  title: ...,','  owner: ...,','  thumbnail_key: ...,','  variants: [','    encoding A, encoding B','  ]','}'];
  lines.forEach((s,i)=>d.mono(185,77+i*24,s,{a:'start',size:12,color:i===5||i===6?C.acc:C.ink}));
  d.brace(309,433,270,{stroke:C.acc});d.text(499,203,'owned child data',{cls:'sm',a:'start'});
  d.text(320,327,'the boundary follows ownership and bounded growth',{cls:'sm'});return d.svg();
}
export function sd_nosql_secondary() {
  const d = illustration('sd_nosql_secondary', 'AN OWNER-AND-TIME INDEX FINDS CLIP IDS, THEN THE BASE STORE FETCHES CLIPS', 330);
  d.mono(90, 60, 'owner=ana, last 7 days', { size: 10.5 });
  d.text(200, 96, 'index (owner, time)', { cls: 'ttl' });
  [['ana · 10-01', 'c41'], ['ana · 10-02', 'c57'], ['ana · 10-03', 'c63'], ['ben · 10-01', 'c12']].forEach(([k, v], i) => { chip(d, 70, 110 + i * 32, 140, k, i < 3, 26); d.mono(250, 123 + i * 32, v, { size: 10, color: i < 3 ? C.acc : C.gray }); });
  d.arrow(282, 154, 380, 154, { stroke: C.acc });
  d.text(330, 140, 'ids', { cls: 'xs' });
  d.db(400, 90, 110, 130, { label: 'clip records' });
  [0, 1, 2].forEach((i) => d.doc(530 + i * 10, 100 + i * 26, 44, 50, { fill: C.accSoft, stroke: C.acc }));
  d.travel([[140, 70], [140, 110], [282, 154], [400, 154]], { dur: 4, r: 3.5 });
  d.text(320, 286, 'the index has its own freshness: a new clip can be in the base store', { cls: 'sm' });
  d.text(320, 306, 'and not yet in the index', { cls: 'sm' });
  return d.svg();
}
export function sd_nosql_wide() {
  const d = illustration('sd_nosql_wide', 'WIDE-COLUMN ROWS ARE SORTED BY KEY AND STORE ONLY THE COLUMNS THEY HAVE', 320);
  const cols = ['score:home', 'score:away', 'meta:scorer', 'meta:note'];
  cols.forEach((s, i) => d.text(250 + i * 92, 60, s, { cls: 'xs' }));
  const rows = [['m7:001', ['1', '0', 'ana', '']], ['m7:002', ['1', '1', '', 'VAR']], ['m7:003', ['2', '1', 'ben', '']], ['m8:001', ['0', '1', 'cy', '']]];
  rows.forEach(([k, v], r) => {
    const y = 76 + r * 40, hot = r < 3;
    chip(d, 40, y, 120, k, hot, 30);
    v.forEach((s, c) => { if (s) chip(d, 210 + c * 92, y + 2, 80, s, false, 26); else d.rect(210 + c * 92, y + 2, 80, 26, { r: 4, stroke: C.faint, dash: [3, 4] }); });
  });
  d.vbrace(26, 76, 194, { dir: -1 });
  d.text(100, 252, 'one match is contiguous', { cls: 'sm', color: C.acc });
  d.text(400, 252, 'empty cells cost nothing', { cls: 'sm' });
  d.text(320, 292, '"all events by scorer ana" is not local: it needs another view', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_buckets() {
  const d = illustration('sd_nosql_buckets', '15-MINUTE BUCKETS: 20 EVENTS/S × 900 S = 18,000 EVENTS AND 3.6 MB EACH', 320);
  d.text(320, 52, 'match m7 history', { cls: 'ttl' });
  ['00:00', '00:15', '00:30', '00:45'].forEach((t, i) => {
    const x = 34 + i * 148, hot = i === 3;
    d.rect(x, 70, 130, 150, { r: 4, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 65, 88, `m7#${t}`, { size: 10 });
    const fill = hot ? 0.55 : 1;
    for (let k = 0; k < 6; k++) d.fillRect(x + 12, 196 - k * 16, 106, 12, k < 6 * fill ? (hot ? C.accSoft : C.card) : C.paper, 1, 2);
    d.text(x + 65, 236, hot ? 'filling now' : '18,000 events', { cls: 'xs', color: hot ? C.acc : undefined });
  });
  d.travel([[560, 64], [560, 140]], { dur: 2, r: 3 });
  d.text(320, 270, 'each bucket: 18,000 × 200 B = 3,600,000 B', { cls: 'sm' });
  d.text(320, 292, 'a bucket bounds size; all current writes still hit one bucket', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_graph() {
const d=illustration('sd_nosql_graph','A GRAPH QUERY EXPANDS RELATIONSHIPS FROM ITS STARTING NODE',355);
  const nodes=[[82,172,'viewer'],[286,73,'scorer'],[286,172,'group'],[286,271,'organizer'],[525,84,'match'],[525,245,'event']];
  [[0,1,'follows'],[0,2,'belongs'],[0,3,'supports'],[1,4,'scores'],[3,5,'hosts'],[2,5,'joins']].forEach(([a,b,s],i)=>{const p=nodes[a],q=nodes[b];d.line(p[0]+39,p[1],q[0]-43,q[1],{stroke:i<3?C.acc:C.line,single:true});d.text((p[0]+q[0])/2,(p[1]+q[1])/2-15,s,{cls:'sm',size:10});});
  nodes.forEach(([x,y,s],i)=>{d.circle(x,y,76,{fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.text(x,y,s,{cls:'mono',size:11});});
  d.text(320,334,'the frontier can grow faster than the final result set',{cls:'sm'});return d.svg();
}
export function sd_nosql_choice() {
  const d = illustration('sd_nosql_choice', 'ONE OWNER ENFORCES INVARIANTS; DERIVED VIEWS SERVE QUERIES AND MAY LAG', 330);
  d.db(60, 90, 140, 150, { fill: C.accSoft, stroke: C.acc, label: 'ledger\n(SQL)' });
  d.lock(115, 58, 30, { stroke: C.acc });
  d.text(130, 270, 'transactions, constraints', { cls: 'sm' });
  const v = [['score view', 'key-value', 70], ['history view', 'wide-column', 150], ['recommend view', 'graph', 230]];
  v.forEach(([s, kind, y]) => {
    d.carrow([[206, 165], [290, y + 18], [380, y + 18]], { stroke: C.gray, hl: 6, dash: [4, 4] });
    d.rect(390, y, 210, 40, { r: 4, fill: C.card, stroke: C.ink2 });
    d.text(404, y + 14, s, { cls: 'ttl', a: 'start', size: 12 }); d.text(404, y + 30, kind, { cls: 'xs', a: 'start' });
  });
  d.travel('M206,165 Q290,170 380,168', { dur: 3, r: 3 });
  d.text(320, 310, 'each view knows its source position and how to rebuild', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_versions() {
  const d = illustration('sd_nosql_versions', 'A VERSION CHECK ACCEPTS 8 AND REJECTS THE DELAYED 7', 300);
  d.envelope(40, 80, 70, 44); d.mono(75, 140, 'v8 sent first', { size: 10 });
  d.envelope(40, 180, 70, 44); d.mono(75, 240, 'v7 delayed', { size: 10 });
  d.db(400, 100, 120, 120, { label: 'view\nstored v8' });
  d.arrow(116, 102, 392, 140, { stroke: C.acc });
  d.travel([[116, 102], [392, 140]], { dur: 5, at: [0, 0.4], label: 'v8', w: 26 });
  d.arrow(116, 202, 300, 190, { stroke: C.ink2 });
  d.travel([[116, 202], [300, 190], [240, 250]], { dur: 5, at: [0.45, 0.95], label: 'v7', w: 26, fill: C.card, color: C.ink2 });
  cross(d, 316, 188, 10);
  d.text(316, 222, '7 < 8: reject', { cls: 'sm', color: C.acc });
  tick(d, 560, 160, 9);
  d.text(320, 278, 'replacing with the same version is a no-op; an increment needs event dedupe', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_quorum() {
const d=illustration('sd_nosql_quorum','READ AND WRITE SETS OVERLAP AT A REPLICA UNDER FIXED MEMBERSHIP',330);
  d.ellipse(235,150,299,206,{fill:C.accFaint,stroke:C.acc});d.ellipse(411,150,299,206,{stroke:C.ink2});
  [[147,'A'],[323,'B'],[499,'C']].forEach(([x,s],i)=>{d.server(x-31,114,62,75,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2,unit:22});d.text(x,218,s,{cls:'ttl'});});
  d.text(147,57,'write set',{cls:'ttl',color:C.acc});d.text(499,57,'read set',{cls:'ttl'});
  d.mono(320,286,'W = 2, R = 2, N = 3; R + W > N',{size:13});
  d.text(320,312,'intersection alone does not establish a complete consistency protocol',{cls:'sm'});return d.svg();
}

export function sd_nosql_key_order() {
  const d = illustration('sd_nosql_key_order', 'STRINGS SORT CHARACTER BY CHARACTER, SO "10" LANDS BEFORE "2"', 300);
  d.text(40, 60, 'unpadded', { cls: 'ttl', a: 'start' });
  d.tape(180, 46, ['1', '10', '2', '3', '…', '9'], { cw: 64, h: 30, hot: (i) => i === 1 });
  d.carrow([[276, 86], [300, 116], [244, 90]], { stroke: C.acc, dash: [3, 3] });
  d.text(330, 112, 'event 10 lands between 1 and 2', { cls: 'xs', a: 'start', color: C.acc });
  d.text(40, 170, 'fixed width', { cls: 'ttl', a: 'start' });
  d.tape(180, 156, ['001', '002', '003', '…', '009', '010'], { cw: 64, h: 30, hot: (i) => i === 5 });
  tick(d, 590, 171, 8);
  d.text(320, 240, 'pad to the largest sequence you will ever store, then', { cls: 'sm' });
  d.text(320, 260, 'a range read returns events in numeric order', { cls: 'sm' });
  return d.svg();
}
export function sd_nosql_scan() {
  const d = illustration('sd_nosql_scan', 'TO RETURN 20 ROWS THE QUERY EXAMINED 100,000: 5,000 PER RESULT', 320);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 20; c++) d.fillRect(30 + c * 14, 56 + r * 18, 11, 14, (r === 4 && c === 7) ? C.acc : C.card, 1, 2);
  d.text(170, 252, '100,000 examined (each cell = 500)', { cls: 'xs' });
  d.travel([[30, 50], [310, 50]], { dur: 5, token: (g) => g.line(0, 0, 0, 186, { stroke: C.acc, sw: 1.2, single: true, rough: 0.2 }) });
  d.arrow(322, 140, 380, 140, { stroke: C.ink2 });
  d.text(351, 126, 'filter', { cls: 'xs' });
  for (let i = 0; i < 20; i++) d.fillRect(396 + (i % 5) * 22, 96 + Math.floor(i / 5) * 22, 18, 18, C.accSoft, 1, 2);
  d.text(450, 200, '20 returned', { cls: 'sm', color: C.acc });
  d.text(320, 286, 'a cursor holding the last sequence continues without rescanning', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_snapshot() {
  const d = illustration('sd_nosql_snapshot', 'AFTER A RENAME, THE EVENT KEEPS "ANA R." AND THE PROFILE SHOWS "ANA RUIZ"', 310);
  panel(d, 30, 50, 270, 200, 'event snapshot');
  d.doc(60, 86, 90, 110);
  d.mono(105, 110, 'goal 71′', { size: 10 });
  d.mono(105, 136, '"Ana R."', { size: 11 });
  d.text(200, 140, 'what was true\nwhen it happened', { cls: 'sm', vc: true });
  panel(d, 340, 50, 270, 200, 'current profile', true);
  d.person(400, 96, 50);
  d.during([0.5, 1], (g) => g.mono(520, 116, '"Ana Ruiz"', { size: 11, color: C.acc }));
  d.during([0, 0.5], (g) => g.mono(520, 116, '"Ana R."', { size: 11 }));
  d.text(475, 200, 'what is true now', { cls: 'sm' });
  d.text(320, 286, 'decide which question each copy answers before propagating', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_conditional() {
  const d = illustration('sd_nosql_conditional', 'TWO WRITERS EXPECT VERSION 7; THE ATOMIC CHECK LETS ONLY ONE WIN', 320);
  d.server(30, 70, 70, 80, { label: 'worker A' });
  d.server(540, 70, 70, 80, { label: 'worker B' });
  d.db(270, 70, 100, 110, { label: 'v7 → v8' });
  d.mono(180, 82, 'if v = 7 set v = 8', { size: 9.5 });
  d.mono(460, 82, 'if v = 7 set v = 8', { size: 9.5 });
  d.arrow(106, 100, 262, 112, { stroke: C.acc }); d.arrow(534, 100, 378, 112, { stroke: C.ink2 });
  d.travel([[106, 100], [262, 112]], { dur: 5, at: [0, 0.35], label: 'A', w: 20 });
  d.travel([[534, 100], [378, 112], [534, 150]], { dur: 5, at: [0.35, 0.9], label: 'B', w: 20, fill: C.card, color: C.ink2 });
  tick(d, 180, 140, 8); d.text(180, 166, 'passes', { cls: 'xs', color: C.acc });
  cross(d, 460, 140, 8); d.text(460, 166, 'fails: now 8', { cls: 'xs' });
  d.text(320, 236, 'check and write are one operation inside the store', { cls: 'sm' });
  d.text(320, 258, 'a separate read-then-write lets both see 7', { cls: 'sm' });
  d.text(320, 294, 'which scorer should win is a business rule, not a version rule', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_cache_role() {
  const d = illustration('sd_nosql_cache_role', 'THE SAME KEY, TWO JOBS: A CACHE CAN FORGET, A STORE MUST NOT', 330);
  panel(d, 24, 48, 284, 250, 'derived cache');
  chip(d, 60, 86, 210, 'score:m7', false, 28);
  d.during([0.4, 1], (g) => cross(g, 165, 100, 14));
  d.db(110, 150, 110, 80, { label: 'event log' });
  d.carrow([[165, 230], [80, 220], [80, 120]], { stroke: C.ink2, hl: 6 });
  d.text(166, 262, 'evicted? rebuild from source', { cls: 'sm' });
  d.text(166, 282, 'bound the miss load', { cls: 'xs' });
  panel(d, 332, 48, 284, 250, 'authoritative store', true);
  chip(d, 368, 86, 210, 'score:m7', true, 28);
  d.disk(430, 186, 70); d.disk(520, 186, 70);
  d.text(474, 262, 'acknowledged means durable', { cls: 'sm', color: C.acc });
  d.text(474, 282, 'deletion is an operation, not an eviction', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_persistence() {
  const d = illustration('sd_nosql_persistence', 'WHERE THE ACK SITS DECIDES WHAT A CRASH CAN LOSE', 320);
  const st = [['memory change', 70], ['append to log', 220], ['fsync to disk', 370], ['ack to client', 520]];
  st.forEach(([s, x], i) => {
    if (i === 0) d.ram(x - 44, 70, 88, 40);
    if (i === 1) d.doc(x - 26, 60, 52, 62);
    if (i === 2) d.disk(x, 92, 58);
    if (i === 3) d.envelope(x - 32, 72, 64, 40, { fill: C.accSoft, stroke: C.acc });
    d.text(x, 146, s, { cls: 'ttl', size: 12, color: i === 3 ? C.acc : undefined });
    if (i < 3) d.arrow(x + 50, 92, x + 100, 92, { stroke: C.gray, hl: 6 });
  });
  d.travel([[70, 92], [520, 92]], { dur: 5, r: 4 });
  d.during([0.3, 0.6], (g) => bolt(g, 296, 160));
  d.text(320, 220, 'crash after memory or log but before fsync: change may be gone', { cls: 'sm' });
  d.text(320, 242, 'ack before fsync: the client was told something that may vanish', { cls: 'sm', color: C.acc });
  d.text(320, 290, 'test it: kill the host after ack, check the effect survived', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_embedding() {
  const d = illustration('sd_nosql_embedding', 'EMBED WHAT IS OWNED AND BOUNDED; REFERENCE WHAT GROWS', 330);
  d.doc(40, 56, 210, 200, { lines: false, fill: C.accFaint, stroke: C.acc });
  d.text(145, 78, 'clip document', { cls: 'ttl', color: C.acc });
  chip(d, 60, 94, 170, 'base fields 800 B', true, 24);
  [0, 1, 2].forEach((i) => chip(d, 60, 126 + i * 30, 170, `variant ${i + 1}: 200 B`, false, 24));
  d.mono(145, 232, '800 + 3 × 200 = 1,400 B', { size: 10 });
  d.text(400, 52, 'comments: separate, paged records', { cls: 'ttl' });
  for (let i = 0; i < 12; i++) d.doc(300 + (i % 6) * 50, 70 + Math.floor(i / 6) * 66, 38, 50, { stroke: C.gray });
  d.text(450, 220, '100,000 × 200 B = 20,000,000 B', { cls: 'mono', size: 10 });
  d.carrow([[300, 120], [276, 140], [254, 150]], { stroke: C.gray, dash: [3, 3] });
  d.text(450, 244, 'each comment points at clip id', { cls: 'xs' });
  d.text(320, 300, 'the metadata document is not the video bytes', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_schema_migration() {
  const d = illustration('sd_nosql_schema_migration', 'FOUR DEPLOY STATES: READ BOTH, WRITE NEW, BACKFILL, THEN DROP OLD', 330);
  const st = [['1 reader reads\nv1 and v2', 0], ['2 writers\nemit v2', 3], ['3 backfill\nrewrites v1', 7], ['4 remove\nv1 support', 10]];
  st.forEach(([s, n2], i) => {
    const x = 30 + i * 150, hot = i === 2;
    panel(d, x, 48, 136, 200, '', hot);
    d.text(x + 68, 74, s, { cls: 'sm', vc: true });
    for (let k = 0; k < 10; k++) { const v2 = k < n2; d.rect(x + 16 + (k % 5) * 22, 120 + Math.floor(k / 5) * 34, 18, 26, { r: 2, fill: v2 ? C.accSoft : C.card, stroke: v2 ? C.acc : C.ink2 }); }
    if (i < 3) d.arrow(x + 138, 148, x + 148, 148, { stroke: C.gray, hl: 4 });
  });
  d.rect(40, 270, 16, 14, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(64, 277, 'v1 record', { cls: 'xs', a: 'start' });
  d.rect(160, 270, 16, 14, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(184, 277, 'v2 record', { cls: 'xs', a: 'start' });
  d.text(450, 277, 'a rollback must still read v2 records', { cls: 'xs' });
  d.text(320, 312, 'backfill is idempotent and counts progress by source record', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_index_updates() {
  const d = illustration('sd_nosql_index_updates', 'CHANGING ONE INDEXED FIELD COSTS FIVE WRITES', 320);
  d.doc(40, 70, 120, 140, { lines: false });
  d.text(100, 92, 'clip c41', { cls: 'ttl' });
  d.mono(100, 124, 'owner: ana', { size: 10, color: C.gray });
  d.mono(100, 148, '→ owner: ben', { size: 10, color: C.acc });
  d.text(100, 230, '1 base update', { cls: 'sm' });
  [['index A (owner, time)', 70], ['index B (owner, title)', 160]].forEach(([s, y]) => {
    d.text(420, y - 8, s, { cls: 'ttl', size: 12 });
    chip(d, 300, y + 4, 110, 'ana · c41', false, 26); cross(d, 355, y + 17, 10);
    chip(d, 440, y + 4, 110, 'ben · c41', true, 26);
    d.arrow(166, 140, 294, y + 17, { stroke: C.gray, hl: 6 });
  });
  d.text(420, 230, '2 removals + 2 additions', { cls: 'sm' });
  d.mono(320, 274, '1 + 2 + 2 = 5 logical mutations', { size: 11, color: C.acc });
  return d.svg();
}
export function sd_nosql_backfill() {
  const d = illustration('sd_nosql_backfill', 'A 100 S SCAN LEAVES 2,000 CHANGES; 980/S SPARE CLEARS THEM IN 2.0408 S', 330);
  d.db(30, 70, 100, 110, { label: 'source' });
  d.arrow(136, 110, 250, 110, { stroke: C.ink2 });
  d.text(193, 96, 'scan 100 s', { cls: 'xs' });
  d.travel([[136, 110], [250, 110]], { dur: 3, r: 3, color: C.ink2 });
  d.db(260, 70, 100, 110, { label: 'new view', fill: C.accSoft, stroke: C.acc });
  d.text(193, 214, 'meanwhile 20 changes/s', { cls: 'xs' });
  for (let i = 0; i < 10; i++) d.envelope(138 + (i % 5) * 22, 226 + Math.floor(i / 5) * 18, 18, 13);
  d.text(193, 280, '20 × 100 = 2,000 waiting', { cls: 'sm' });
  d.carrow([[256, 236], [300, 220], [310, 186]], { stroke: C.acc });
  d.text(510, 90, 'replay 1,000/s', { cls: 'sm', a: 'middle' });
  d.text(510, 112, '− new 20/s', { cls: 'sm' });
  d.line(440, 124, 580, 124, { stroke: C.ink2, single: true });
  d.mono(510, 140, '980/s spare', { size: 11 });
  d.mono(510, 176, '2,000 ÷ 980 = 2.0408 s', { size: 11, color: C.acc });
  d.text(510, 230, 'then verify coverage\nbefore routing reads', { cls: 'sm', vc: true });
  return d.svg();
}
export function sd_nosql_prefixes() {
  const d = illustration('sd_nosql_prefixes', 'FOUR PREFIXES SPLIT 10,000 WRITES/S INTO 2,500 EACH, AND READS MUST MERGE', 330);
  d.text(140, 50, 'one hot owner', { cls: 'ttl' });
  d.server(100, 70, 80, 110, { fill: C.accSoft, stroke: C.acc, led: () => true });
  d.mono(140, 200, '10,000 writes/s', { size: 10, color: C.acc });
  for (let k = 0; k < 6; k++) d.travel([[20, 90 + k * 14], [96, 90 + k * 14]], { dur: 1.2, at: [k / 8, k / 8 + 0.5], r: 2.5 });
  d.text(450, 50, 'm7#0 … m7#3', { cls: 'ttl' });
  [0, 1, 2, 3].forEach((i) => {
    const x = 310 + i * 76;
    d.server(x, 70, 56, 80, { unit: 14 });
    d.mono(x + 28, 166, '2,500/s', { size: 9 });
    d.arrow(x + 28, 182, 450, 232, { stroke: C.gray, hl: 5 });
  });
  d.rect(390, 236, 120, 30, { r: 4, fill: C.card, stroke: C.ink2 });
  d.text(450, 251, 'merge 4 streams', { cls: 'sm' });
  d.text(320, 300, 'a time bucket bounds growth; a hash prefix spreads writes', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_clustering() {
  const d = illustration('sd_nosql_clustering', 'THE PARTITION KEY FINDS THE SHELF; THE CLUSTERING KEY ORDERS THE BOOKS', 320);
  ['m6#1', 'm7#1', 'm7#2', 'm8#1'].forEach((s, i) => {
    const y = 60 + i * 56, hot = s === 'm7#2';
    d.mono(70, y + 20, s, { size: 11, color: hot ? C.acc : undefined });
    d.line(110, y + 38, 590, y + 38, { stroke: C.ink2, sw: 1.6, single: true });
    for (let k = 0; k < 9; k++) d.rect(120 + k * 50, y + 4, 40, 32, { r: 1, fill: hot && k >= 2 && k <= 5 ? C.accSoft : C.card, stroke: hot ? C.acc : C.line });
    if (hot) for (let k = 0; k < 9; k++) d.mono(140 + k * 50, y + 20, String(k + 1).padStart(3, '0'), { size: 8.5 });
  });
  d.brace(220, 410, 244, { label: 'sequence 003 to 006' });
  d.travel([[40, 132], [114, 132], [114, 176], [220, 176]], { dur: 4, r: 3.5 });
  d.text(320, 300, 'a query by scorer needs a different table or index', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_bucket_boundary() {
  const d = illustration('sd_nosql_bucket_boundary', 'A 15-MINUTE WINDOW ENDING NOW STRADDLES TWO BUCKETS', 300);
  const X = 40, W = 560;
  d.rect(X, 90, W / 2, 50, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + W / 4, 72, 'bucket 00:15–00:30', { cls: 'sm' });
  d.rect(X + W / 2, 90, W / 2, 50, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 3 * W / 4, 72, 'bucket 00:30–00:45', { cls: 'sm' });
  d.rect(X + W * 0.3, 98, W / 2, 34, { r: 4, fill: C.accSoft, stroke: C.acc, op: 0.9 });
  d.text(X + W * 0.55, 115, 'last 15 minutes', { cls: 'ttl', color: C.acc });
  ['00:15', '00:30', '00:45'].forEach((t, i) => d.mono(X + i * W / 2, 156, t, { size: 10 }));
  d.mono(X + W * 0.8, 176, 'now 00:39', { size: 10, color: C.acc });
  d.arrow(X + W * 0.4, 190, X + W * 0.4, 216, { stroke: C.ink2, hl: 5 }); d.text(X + W * 0.4, 230, 'tail of the old bucket', { cls: 'xs' });
  d.arrow(X + W * 0.7, 190, X + W * 0.7, 216, { stroke: C.ink2, hl: 5 }); d.text(X + W * 0.7, 230, 'start of the current one', { cls: 'xs' });
  d.text(320, 272, 'two reads, merged by sequence into one page', { cls: 'sm' });
  return d.svg();
}
export function sd_nosql_query_tables() {
  const d = illustration('sd_nosql_query_tables', '20 EVENTS/S × 3 VIEWS × 3 REPLICAS = 180 COPY WRITES/S', 330);
  d.server(30, 120, 70, 80, { label: '20 events/s' });
  const views = ['by match', 'by scorer', 'by day'];
  views.forEach((s, i) => {
    const y = 56 + i * 90;
    d.arrow(106, 160, 196, y + 30, { stroke: C.ink2, hl: 6 });
    d.text(250, y + 10, s, { cls: 'ttl', size: 12 });
    d.db(210, y + 22, 80, 46);
    [0, 1, 2].forEach((k) => { d.db(370 + k * 70, y + 22, 54, 46, { fill: k === 0 ? C.card : C.paper }); d.line(294, y + 45, 366 + k * 70, y + 45, { stroke: C.line, single: true }); });
  });
  d.travel([[106, 160], [196, 86], [394, 100]], { dur: 3, r: 3 });
  d.mono(110, 300, '20 × 3 = 60 logical writes/s', { size: 10, a: 'start' });
  d.mono(380, 300, '60 × 3 = 180 copy writes/s', { size: 10, color: C.acc, a: 'start' });
  return d.svg();
}
export function sd_nosql_traversal() {
  const d = illustration('sd_nosql_traversal', 'A TRAVERSAL KEEPS A FRONTIER AND A VISITED SET, AND FILTERS EDGES BY TYPE', 340);
  const n = { v: [80, 170], a: [230, 90], b: [230, 170], c: [230, 250], x: [400, 70], y: [400, 150], z: [400, 230], w: [560, 120], q: [560, 220] };
  const e = [['v', 'a', 'follows'], ['v', 'b', 'follows'], ['v', 'c', 'blocked'], ['a', 'x', 'follows'], ['a', 'y', 'follows'], ['b', 'y', 'follows'], ['b', 'z', 'follows'], ['y', 'w', 'follows'], ['z', 'q', 'follows']];
  e.forEach(([p, q, t]) => d.line(n[p][0], n[p][1], n[q][0], n[q][1], { stroke: t === 'blocked' ? C.gray : C.line, dash: t === 'blocked' ? [3, 4] : undefined, single: true }));
  cross(d, 155, 210, 6, C.gray);
  Object.entries(n).forEach(([k, [x, y]]) => { const hop1 = 'xyz'.includes(k), dim = 'wqc'.includes(k); d.circle(x, y, 34, { fill: k === 'v' ? C.ink : hop1 ? C.accSoft : C.card, stroke: hop1 ? C.acc : dim ? C.gray : C.ink2 }); d.mono(x, y, k === 'v' ? 'me' : k, { size: 10, color: k === 'v' ? C.paper : undefined }); });
  d.pulse(400, 150, { r0: 17, r1: 30, dur: 2 });
  d.text(400, 290, 'current frontier: x, y, z', { cls: 'sm', color: C.acc });
  d.text(160, 290, 'visited: me, a, b', { cls: 'sm' });
  d.text(320, 322, 'y is reached twice but expanded once', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_expansion() {
  const d = illustration('sd_nosql_expansion', 'THREE NEIGHBOURS PER NODE: 3, 9, 27 CANDIDATES; 39 EXPANSIONS IN THREE HOPS', 340);
  const cols = [1, 3, 9, 27], pos = cols.map((n, c) => Array.from({ length: n }, (_, i) => [60 + c * 170, 56 + (i + 0.5) * 240 / n]));
  pos.slice(1).forEach((col, c) => col.forEach((p, i) => d.line(pos[c][Math.floor(i / 3)][0], pos[c][Math.floor(i / 3)][1], p[0], p[1], { stroke: c === 2 ? C.acc : C.line, single: true, sw: 0.8 })));
  pos.forEach((col, c) => col.forEach(([x, y]) => d.circle(x, y, c === 3 ? 7 : 14, { fill: c === 0 ? C.ink : c === 3 ? C.accSoft : C.card, stroke: c === 3 ? C.acc : C.ink2 })));
  ['start', 'hop 1: 3', 'hop 2: 9', 'hop 3: 27'].forEach((s, c) => d.mono(60 + c * 170, 312, s, { size: 10, color: c === 3 ? C.acc : undefined }));
  d.text(320, 334, '3 + 9 + 27 = 39; a 20-result page does not limit this work', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_dedup() {
  const d = illustration('sd_nosql_dedup', 'NINE NEIGHBOUR ENTRIES, FIVE DISTINCT PEOPLE', 320);
  const lists = [['A', ['x', 'y', 'z']], ['B', ['y', 'z', 'w']], ['C', ['z', 'w', 'v']]];
  lists.forEach(([s, l], i) => {
    const y = 60 + i * 56;
    d.circle(50, y + 13, 30, { fill: C.card }); d.mono(50, y + 13, s, { size: 11 });
    d.tape(90, y, l, { cw: 44, h: 26 });
    d.line(226, y + 13, 330, 150, { stroke: C.line, single: true });
  });
  d.rect(336, 128, 50, 44, { r: 22, fill: C.paper, stroke: C.ink2 }); d.text(361, 150, 'set', { cls: 'xs' });
  d.arrow(390, 150, 420, 150, { stroke: C.acc, hl: 6 });
  d.tape(426, 137, ['x', 'y', 'z', 'w', 'v'], { cw: 36, h: 26, hot: () => true });
  d.mono(320, 260, '3 + 3 + 3 = 9 entries → 5 distinct', { size: 11 });
  d.text(320, 290, 'counting paths keeps duplicates; reachability removes them', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_lag() {
  const d = illustration('sd_nosql_lag', 'THE VIEW IS 5 S BEHIND: 20 EVENTS/S × 5 S = 100 EVENTS NOT YET APPLIED', 300);
  const X = 40, W = 560;
  d.tape(X, 90, Array(14).fill(''), { cw: 40, h: 30, hot: (i) => i >= 9 });
  d.pin(X + 9 * 40, 86, { label: 'view position', dy: -36, fill: C.card });
  d.pin(X + 14 * 40, 86, { label: 'source position', dy: -36, fill: C.accSoft, stroke: C.acc });
  d.brace(X + 9 * 40, X + 14 * 40, 132, { label: '100 events = 5 s' });
  d.travel([[X + 9 * 40 - 20, 105], [X + 14 * 40 - 20, 105]], { dur: 5, r: 3.5 });
  d.text(320, 210, '"eventually consistent" says nothing about how long; measure the gap', { cls: 'sm' });
  d.text(320, 236, 'editor after save: read the owner. recommendation page: lag is fine', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_apply_boundary() {
  const d = illustration('sd_nosql_apply_boundary', 'APPLY FIRST, THEN ADVANCE PROGRESS; A CRASH BETWEEN THEM ONLY CAUSES A SAFE REPLAY', 330);
  d.tape(30, 70, ['e41', 'e42', 'e43', 'e44', 'e45'], { cw: 56, h: 30, hot: (i) => i === 2 });
  d.text(170, 52, 'source log', { cls: 'ttl' });
  d.server(370, 56, 80, 90, { label: 'consumer' });
  d.db(510, 66, 90, 80, { label: 'view' });
  d.arrow(316, 85, 362, 85, { stroke: C.ink2, hl: 6 });
  d.arrow(456, 100, 502, 100, { stroke: C.acc, hl: 6 }); d.text(480, 86, '1 apply', { cls: 'xs', color: C.acc });
  d.carrow([[410, 168], [300, 200], [170, 112]], { stroke: C.ink2, hl: 6 }); d.text(300, 222, '2 save "done to e43"', { cls: 'xs' });
  d.during([0.4, 0.75], (g) => bolt(g, 470, 150));
  d.text(320, 268, 'crash after 1, before 2: e43 is re-sent', { cls: 'sm' });
  d.text(320, 290, 'the conditional apply sees it is already present and does nothing', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_nosql_tombstone() {
  const d = illustration('sd_nosql_tombstone', 'A VERSION-9 TOMBSTONE BLOCKS A DELAYED VERSION-7 UPDATE', 320);
  const X = 40;
  [['v8 record', C.card, C.ink2], ['tombstone v9', C.accSoft, C.acc]].forEach(([s, f, st], i) => { d.rect(X + i * 170, 80, 150, 60, { r: 4, fill: f, stroke: st }); d.text(X + i * 170 + 75, 110, s, { cls: 'ttl', size: 12 }); });
  d.arrow(X + 152, 110, X + 168, 110, { stroke: C.gray, hl: 5 });
  d.envelope(470, 70, 80, 50); d.mono(510, 136, 'late v7 update', { size: 10 });
  d.arrow(464, 96, 370, 104, { stroke: C.ink2 });
  cross(d, 410, 100, 9);
  d.text(320, 186, 'without the tombstone, the empty key would accept v7', { cls: 'sm' });
  d.text(320, 206, 'and the deleted fact would come back', { cls: 'sm' });
  d.text(320, 256, 'purge the tombstone only after every replay older than v9 is impossible', { cls: 'xs' });
  d.text(320, 278, 'and indexes, caches and graph edges have seen the delete', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_repair() {
  const d = illustration('sd_nosql_repair', 'APPLY 40/S WHILE 20/S ARRIVE: 20/S SPARE CLEARS 100 WAITING IN 5 S', 320);
  d.text(110, 52, 'new events 20/s', { cls: 'sm' });
  for (let k = 0; k < 4; k++) d.travel([[30, 80], [180, 120]], { dur: 2, at: [k / 4, k / 4 + 0.5], token: (g) => g.envelope(-8, -6, 16, 11) });
  d.rect(180, 90, 220, 70, { r: 4, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 20; i++) d.envelope(190 + (i % 10) * 21, 98 + Math.floor(i / 10) * 26, 16, 12, { fill: C.accSoft, stroke: C.acc });
  d.text(290, 176, '100 waiting (each = 5)', { cls: 'xs' });
  d.arrow(406, 125, 470, 125, { stroke: C.acc });
  d.text(438, 110, '40/s', { cls: 'mono', size: 10 });
  d.db(480, 86, 100, 90, { label: 'view' });
  d.mono(320, 236, '40 − 20 = 20/s spare;  100 ÷ 20 = 5 s', { size: 11, color: C.acc });
  d.text(320, 268, 'a view that only keeps pace can never catch up after an outage', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_authority() {
  const d = illustration('sd_nosql_authority', 'ONE OWNER ACCEPTS EVENTS; THE VIEWS ONLY APPLY WHAT IT ACCEPTED', 330);
  d.person(40, 128, 34, { label: 'scorer' });
  d.arrow(76, 150, 140, 150, { stroke: C.acc });
  d.db(150, 96, 120, 120, { fill: C.accSoft, stroke: C.acc, label: 'accepted\nevents' });
  const v = [['latest score', 70], ['ordered history', 150], ['scorer view', 230]];
  v.forEach(([s, y], i) => {
    d.arrow(276, 156, 380, y + 20, { stroke: C.ink2, hl: 6, dash: i === 2 ? [4, 4] : undefined });
    d.db(390, y, 70, 46);
    d.text(474, y + 23, s, { cls: 'sm', a: 'start' });
    d.mono(474, y + 40, `src pos ${[1042, 1040, 1033][i]}`, { size: 9, a: 'start', color: C.gray });
  });
  d.travel([[76, 150], [150, 150], [276, 156], [390, 90]], { dur: 4, r: 3.5 });
  d.text(320, 312, 'positions shown are illustrative; each view records its own', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_event_trace() {
  const d = illustration('sd_nosql_event_trace', 'ONE SOURCE ID FOLLOWS THE EVENT FROM ACCEPTANCE INTO EVERY VIEW', 330);
  d.person(40, 70, 32, { label: 'scorer' });
  d.db(220, 56, 110, 100, { fill: C.accSoft, stroke: C.acc, label: 'source owner' });
  d.arrow(72, 86, 212, 86, { stroke: C.acc }); d.mono(142, 74, 'id e43, expect seq 43', { size: 9 });
  d.arrow(212, 120, 72, 120, { stroke: C.ink2 }); d.mono(142, 134, 'accepted at pos 43', { size: 9 });
  [['latest', 70], ['history', 150], ['scorer', 230]].forEach(([s, y]) => { d.arrow(336, 106, 440, y + 16, { stroke: C.ink2, hl: 6 }); d.db(450, y, 64, 40); d.text(526, y + 20, s, { cls: 'sm', a: 'start' }); });
  d.travel([[72, 86], [212, 86], [336, 106], [450, 166]], { dur: 4, label: 'e43', w: 34 });
  d.text(220, 230, 'a viewer that needs its own write', { cls: 'sm' });
  d.text(220, 250, 'waits for pos ≥ 43 or reads the owner', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_nosql_full_budget() {
  const d = illustration('sd_nosql_full_budget', 'COUNT THE SOURCE BYTES AND THE COPY WRITES FOR 20 EVENTS/S', 320);
  const rows = [['source payload', '20 × 200 B', '4,000 B/s'], ['one day', '4,000 × 86,400', '345.6 MB'], ['three source replicas', '345.6 × 3', '1,036.8 MB'], ['view copy writes', '20 × 3 views × 3', '180/s']];
  rows.forEach(([a, b, c], i) => {
    const y = 60 + i * 52, hot = i === 2;
    if (i < 3) for (let k = 0; k <= i && k < 3; k++) d.db(30 + k * 18, y, 30, 36, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    else d.travel([[30, y + 18], [90, y + 18]], { dur: 1.5, r: 3 });
    d.text(120, y + 18, a, { cls: 'ttl', a: 'start', size: 12 });
    d.mono(330, y + 18, b, { size: 10 });
    d.mono(560, y + 18, c, { size: 11, a: 'end', color: hot ? C.acc : undefined });
  });
  d.text(320, 290, 'logs, indexes and backups come on top of this', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_new_query() {
  const d = illustration('sd_nosql_new_query', 'A NEW SCORER VIEW GOES LIVE ONLY AFTER BACKFILL, CATCH-UP AND A CHECK', 320);
  const st = ['checkpoint\nsource pos', 'backfill\nold records', 'apply changes\nsince checkpoint', 'verify, then\nroute reads'];
  st.forEach((s, i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.circle(x + 60, 96, 56, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 60, 96, String(i + 1), { size: 14, color: hot ? C.acc : undefined });
    d.text(x + 60, 156, s, { cls: 'sm', vc: true });
    if (i < 3) d.arrow(x + 92, 96, x + 176, 96, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 96], [540, 96]], { dur: 5, r: 4 });
  d.text(320, 230, 'until step 4, the old path serves reads', { cls: 'sm' });
  d.text(320, 252, 'a partial result must say it is partial', { cls: 'sm' });
  d.text(320, 290, 'the source must still hold the history the backfill needs', { cls: 'xs' });
  return d.svg();
}
export function sd_nosql_defense() {
  const d = illustration('sd_nosql_defense', 'EACH STORE IS DEFENDED BY ITS QUERY, ITS OWNER AND ITS RECOVERY', 330);
  const rows = [['known-key score', 'versioned latest view', 'kv'], ['match history', 'bounded ordered buckets', 'wide'], ['clip metadata', 'bounded owned document', 'doc'], ['relationships', 'bounded derived graph', 'graph']];
  rows.forEach(([q, m, k], i) => {
    const y = 50 + i * 64;
    d.text(40, y + 26, q, { cls: 'ttl', a: 'start', size: 12 });
    d.arrow(184, y + 26, 230, y + 26, { stroke: C.gray, hl: 6 });
    if (k === 'kv') { chip(d, 240, y + 12, 60, 'k → v', false, 26); }
    if (k === 'wide') d.tape(240, y + 12, ['', '', ''], { cw: 20, h: 26 });
    if (k === 'doc') d.doc(250, y + 4, 34, 44);
    if (k === 'graph') { [[248, 20], [280, 8], [290, 38]].forEach(([x, yy]) => d.circle(x, y + yy, 12, { fill: C.card })); d.line(248, y + 20, 280, y + 8, { stroke: C.line, single: true }); d.line(248, y + 20, 290, y + 38, { stroke: C.line, single: true }); }
    d.text(330, y + 26, m, { cls: 'sm', a: 'start' });
  });
  d.line(30, 300, 610, 300, { stroke: C.line, single: true });
  d.text(320, 318, 'one fact owner; every other store is a copy with a rebuild path', { cls: 'xs', color: C.acc });
  return d.svg();
}

import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { systemMap, systemCover } from '../lib/system-figures.js';

const parts = ['Records and constraints', 'Useful index order', 'Query execution', 'Transactions and anomalies', 'Versions and locks', 'Write-ahead and recovery', 'Copies and visibility', 'Partitions and the complete write'];
import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const btree = (d, x, y, keys, hotLeaf = -1) => { d.rect(x + 80, y, 100, 26, { r: 3, fill: C.card, stroke: C.ink2 }); keys.forEach((k, i) => { const lx = x + i * 90; d.line(x + 130, y + 26, lx + 40, y + 56, { stroke: C.line, single: true }); d.rect(lx, y + 56, 80, 26, { r: 3, fill: i === hotLeaf ? C.accSoft : C.card, stroke: i === hotLeaf ? C.acc : C.ink2 }); d.mono(lx + 40, y + 69, k, { size: 9 }); }); };
export function where_sd_databases(stage=99) { return systemMap("sd_databases", ["Tables, keys and constraints", "B-tree, composite and covering indexes", "Query execution and joins", "Transactions and isolation levels", "MVCC, locks and deadlocks", "WAL, recovery and connection pools", "Replication and replication lag", "Sharding and consistent hashing"], stage); }
export function cover_sd_databases() { return systemCover("sd_databases", 3, ["Relational", "databases"], "Relational databases", ["Tables, keys and constraints", "B-tree, composite and covering indexes", "Query execution and joins", "Transactions and isolation levels", "MVCC, locks and deadlocks", "WAL, recovery and connection pools", "Replication and replication lag", "Sharding and consistent hashing"]); }

function frame(id, kicker, height = 310) {
  const d = new D(640, height, id);
  d.text(10, 16, kicker, { cls: 'cap', a: 'start' });
  return d;
}
function table(id, kicker, headings, rows, note, active = rows.length - 1) {
  const h = 106 + rows.length * 43;
  const d = frame(id, kicker, h + 54), x = 24, y = 73, width = 592 / headings.length;
  headings.forEach((v, i) => d.text(x + width * (i + .5), 48, v, { cls: 'ttl', size: 11 }));
  d.grid(x, y, rows.length, headings.length, width, 43, {
    val: (r, c) => rows[r][c], vcls: 'lbl', vsize: 11,
    cellFill: r => r === active ? C.accSoft : C.card,
  });
  if (note) d.hand(320, h + 28, note, { size: 18 });
  return d.svg();
}
function path(id, kicker, stations, notes, hand) {
  const d = frame(id, kicker), w = (584 - (stations.length - 1) * 26) / stations.length;
  stations.forEach((s, i) => {
    const x = 28 + i * (w + 26);
    d.box(x, 103, w, 68, s, { size: 12, fill: i === stations.length - 1 ? C.accSoft : C.card, stroke: i === stations.length - 1 ? C.acc : C.ink2 });
    if (notes[i]) d.text(x + w / 2, 201, notes[i], { cls: 'sm', size: 10, vc: true });
    if (i < stations.length - 1) d.arrow(x + w + 3, 138, x + w + 22, 138, { stroke: C.gray });
  });
  if (hand) d.hand(320, 276, hand, { size: 18 });
  return d.svg();
}
function sequence(id, kicker, actors, steps, hand) {
  const h = 140 + steps.length * 44, d = frame(id, kicker, h), xs = actors.map((_, i) => 85 + i * 470 / (actors.length - 1));
  actors.forEach((a, i) => { d.box(xs[i] - 69, 43, 138, 36, a, { fill: C.card, size: 11 }); d.line(xs[i], 87, xs[i], h - 57, { stroke: C.line, dash: [4, 5] }); });
  steps.forEach(([from, to, label], i) => {
    const y = 117 + i * 44, center = (xs[from] + xs[to]) / 2;
    d.arrow(xs[from], y, xs[to], y, { stroke: i === steps.length - 1 ? C.acc : C.ink2 });
    if (Math.abs(from - to) > 1) d.fillRect(center - 116, y - 27, 232, 22, C.paper);
    d.text(center, y - 15, label, { cls: 'sm', size: 11 });
  });
  if (hand) d.hand(320, h - 22, hand, { size: 18 });
  return d.svg();
}

export function sd_databases_tables() {
  const d = illustration('sd_databases_tables', 'FOUR EVENTS POINT AT THREE SCORERS; ASHA (u4) APPEARS TWICE, AS ONE IDENTITY', 300);
  [['e1', 'm7', 1, 'u4'], ['e2', 'm7', 2, 'u8'], ['e3', 'm7', 3, 'u4'], ['e4', 'm8', 1, 'u9']].forEach(([e, m, s, u], i) => { const y = 60 + i * 46, hot = u === 'u4'; d.rect(40, y, 250, 34, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(165, y + 17, `${e} · ${m} · seq ${s} · ${u}`, { size: 10 }); d.line(294, y + 17, 420, 80 + ['u4', 'u8', 'u9'].indexOf(u) * 70, { stroke: hot ? C.acc : C.line, single: true }); });
  [['u4', 'Asha'], ['u8', 'Bo'], ['u9', 'Chen']].forEach(([u, n], j) => { d.person(450, 60 + j * 70, 34, { fill: j === 0 ? C.accSoft : C.card, stroke: j === 0 ? C.acc : C.ink2 }); d.mono(520, 80 + j * 70, `${u}: ${n}`, { size: 11, a: 'start' }); });
  d.text(165, 266, 'events', { cls: 'xs' }); d.text(500, 266, 'users', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_unique_race() {
  const d = illustration('sd_databases_unique_race', 'BOTH CALLERS SEE m7 ABSENT AND BOTH INSERT; THE UNIQUE CONSTRAINT LETS ONE WIN', 300);
  d.person(60, 70, 32, { label: 'caller A' }); d.person(580, 70, 32, { label: 'caller B' });
  d.db(270, 70, 100, 100, { label: 'UNIQUE(match)' });
  d.arrow(92, 90, 264, 100, { stroke: C.gray, dash: [4, 3] }); d.mono(178, 84, 'm7? absent', { size: 9 });
  d.arrow(548, 90, 376, 100, { stroke: C.gray, dash: [4, 3] }); d.mono(462, 84, 'm7? absent', { size: 9 });
  d.arrow(92, 140, 264, 140, { stroke: C.acc }); d.mono(178, 156, 'INSERT m7: ok', { size: 9, color: C.acc }); tick(d, 250, 126, 6);
  d.arrow(548, 140, 376, 140, { stroke: C.ink2 }); d.mono(462, 156, 'INSERT m7: conflict', { size: 9 }); cross(d, 390, 140, 7);
  d.travel([[92, 140], [264, 140]], { dur: 4, at: [0.1, 0.45], r: 3.5 }); d.travel([[548, 140], [376, 140]], { dur: 4, at: [0.5, 0.9], r: 3.5, color: C.ink2 });
  d.text(320, 240, 'the earlier reads reserved nothing; the shared rule decides at insertion', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_keys() {
  const d = frame('sd_databases_keys', 'MANDATORY REFERENCES NEED NOT NULL AS WELL');
  d.box(200, 54, 240, 65, 'event e1\nmatch m7; scorer u4', { fill: C.accSoft, stroke: C.acc, size: 13 });
  d.box(31, 193, 225, 51, 'matches: m7 exists', { fill: C.card, size: 13 });
  d.box(384, 193, 225, 51, 'users: u4 exists', { fill: C.card, size: 13 });
  d.arrow(254, 125, 145, 187, { stroke: C.gray }); d.arrow(386, 125, 496, 187, { stroke: C.gray });
  d.text(124, 145, 'match_id FK', { cls: 'sm' }); d.text(517, 145, 'scorer_id FK', { cls: 'sm' });
  d.hand(320, 282, 'nullable is a separate relationship choice'); return d.svg();
}
export function sd_databases_index_cost() {
  const d = illustration('sd_databases_index_cost', 'ONE INSERT TOUCHES THREE STRUCTURES: THE ROW, THE event-id INDEX, THE (match, seq) INDEX', 300);
  d.envelope(30, 120, 80, 50, { label: 'INSERT e9' });
  [['base row', 'stored fact', 50], ['event-id index', 'identity lookup', 130], ['(match, seq) index', 'history lookup', 210]].forEach(([s, t, y], i) => {
    d.arrow(116, 145, 260, y + 20, { stroke: i === 0 ? C.ink2 : C.acc, hl: 6 });
    if (i === 0) d.doc(270, y - 4, 40, 48); else btree(d, 262, y - 10, ['', ''], -1);
    d.text(470, y + 12, s, { cls: 'ttl', a: 'start', size: 12, color: i ? C.acc : undefined }); d.text(470, y + 30, t, { cls: 'xs', a: 'start' });
  });
  d.travel([[116, 145], [260, 150]], { dur: 3, r: 3 });
  d.text(320, 290, 'logical structures, not a count of physical I/O', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_btree() {
  const d = frame('sd_databases_btree', 'SEPARATORS SELECT THE RANGE CONTAINING 16');
  d.box(223, 51, 194, 48, '12 | 20', { fill: C.card, cls: 'mono', size: 15 });
  const leaves = ['4 | 8', '12 | 14 | 16 | 18', '20 | 24'];
  leaves.forEach((s, i) => { const x = 20 + i * 211; d.arrow(260 + i * 60, 103, x + 89, 180, { stroke: i === 1 ? C.acc : C.gray }); d.box(x, 187, 178, 46, s, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2, cls: 'mono', size: 11 }); });
  d.text(320, 251, '12 <= 16 < 20: choose the middle range', { cls: 'mono', color: C.acc, size: 11 });
  d.hand(320, 278, 'a page visit rules out whole ranges'); return d.svg();
}
export function sd_databases_leaf_scan() {
  const d = frame('sd_databases_leaf_scan', 'DESCEND ONCE, THEN FOLLOW LEAVES');
  [['4 | 8', false], ['12 | 14 | 16 | 18', true], ['20 | 24', true]].forEach(([s, active], i) => {
    const x = 20 + i * 211; d.box(x, 112, 178, 59, s, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.line, cls: 'mono', size: 11 });
    if (i < 2) d.arrow(x + 181, 142, x + 207, 142, { stroke: i === 1 ? C.acc : C.line });
  });
  d.text(320, 205, 'return 12, 14, 16, 18, 20; stop before 24', { cls: 'mono', size: 11 });
  d.arrow(320, 54, 320, 104, { stroke: C.acc }); d.text(416, 74, 'lower bound 12', { cls: 'sm' });
  d.hand(320, 278, 'finding the start differs from returning the range'); return d.svg();
}
export function sd_databases_leaf_split() {
  const d = frame('sd_databases_leaf_split', 'INSERT 15, THEN SPLIT THE FULL LEAF', 345);
  d.box(170, 57, 300, 42, '12 | 14 | 16 | 18', { fill: C.card, cls: 'mono', size: 13 });
  d.text(320, 125, '+ 15 gives five entries; capacity is four', { cls: 'sm', size: 12 });
  d.box(61, 188, 198, 46, '12 | 14', { fill: C.card, cls: 'mono', size: 13 });
  d.box(379, 188, 198, 46, '15 | 16 | 18', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 13 });
  d.arrow(271, 211, 367, 211, { stroke: C.acc }); d.text(320, 181, 'leaf link', { cls: 'sm' });
  d.arrow(244, 141, 160, 177, { stroke: C.gray }); d.arrow(396, 141, 477, 177, { stroke: C.acc });
  d.text(320, 267, 'parent gains separator 15', { cls: 'mono', size: 12 }); d.hand(320, 316, 'repair the search path as well as the leaf'); return d.svg();
}
export function sd_databases_composite() {
  const d = illustration('sd_databases_composite', 'INDEX (match, seq): SEEK TO (m7, 2), READ ON, STOP WHEN THE MATCH CHANGES', 300);
  d.tape(60, 100, ['m6, 9', 'm7, 1', 'm7, 2', 'm7, 3', 'm8, 1', 'm8, 2'], { cw: 86, h: 34, hot: (i) => i === 2 || i === 3 });
  d.pin(60 + 2 * 86, 96, { label: 'seek (m7, 2)', dy: -36, fill: C.accSoft, stroke: C.acc });
  d.line(60 + 4 * 86, 90, 60 + 4 * 86, 146, { stroke: C.ink, sw: 2, single: true }); d.text(60 + 4 * 86, 162, 'stop', { cls: 'xs' });
  d.travel([[60 + 2 * 86, 117], [60 + 4 * 86, 117]], { dur: 3, token: (g) => g.line(0, -20, 0, 20, { stroke: C.acc, sw: 1.6, single: true }) });
  d.text(320, 210, 'two entries returned; ordered (seq, match) would scatter m7 across the index', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_covering() {
  const d = illustration('sd_databases_covering', 'THE INDEX HOLDS EVERY COLUMN ASKED FOR; VISIBILITY MAY STILL NEED THE HEAP PAGE', 300);
  btree(d, 40, 60, ['m7,2 · e5 · ana', 'm7,3 · e6 · ben'], 0);
  d.text(170, 170, 'key + payload columns', { cls: 'xs' });
  d.rect(380, 70, 220, 60, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(490, 90, 'visibility map', { cls: 'sm' }); d.text(490, 110, 'page all-visible?', { cls: 'xs' });
  d.arrow(250, 130, 374, 100, { stroke: C.ink2, hl: 6 });
  d.doc(460, 170, 60, 70, { fill: C.accSoft, stroke: C.acc }); d.text(490, 254, 'heap page if not', { cls: 'xs', color: C.acc });
  d.arrow(490, 134, 490, 166, { stroke: C.acc, hl: 6, dash: [4, 3] });
  return d.svg();
}
export function sd_databases_clustered() {
  const d = illustration('sd_databases_clustered', 'A SEPARATE HEAP SCATTERS e1, e2, e3; A CLUSTERED TABLE STORES THEM IN KEY ORDER', 320);
  panel(d, 20, 44, 292, 230, 'index + separate heap');
  d.tape(60, 80, ['e1', 'e2', 'e3'], { cw: 60, h: 28 });
  ['A', 'B', 'C'].forEach((p, i) => { d.doc(60 + i * 72, 170, 48, 60, { lines: false }); d.mono(84 + i * 72, 244, `page ${p}`, { size: 9 }); });
  [[0, 0], [1, 2], [2, 1]].forEach(([k, p]) => d.line(90 + k * 60, 108, 84 + p * 72, 168, { stroke: C.ink2, single: true }));
  panel(d, 328, 44, 292, 230, 'clustered by key', true);
  d.doc(380, 90, 190, 120, { lines: false, fill: C.accSoft, stroke: C.acc }); ['e1', 'e2', 'e3'].forEach((s, i) => d.mono(475, 120 + i * 26, s, { size: 11 }));
  d.text(474, 244, 'one base order only; scorer needs its own index', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_plan() {
  const d = illustration('sd_databases_plan', 'THE PLANNER EXPECTED 10 ROWS AND GOT 1,000: 100× MORE INNER LOOKUPS THAN PLANNED', 300);
  d.text(170, 56, 'estimate', { cls: 'ttl' }); d.text(470, 56, 'actual', { cls: 'ttl', color: C.acc });
  for (let i = 0; i < 10; i++) d.dot(110 + (i % 5) * 26, 90 + Math.floor(i / 5) * 22, 4, C.ink2);
  for (let i = 0; i < 100; i++) d.dot(380 + (i % 20) * 9, 80 + Math.floor(i / 20) * 12, 2.5, C.acc);
  d.text(170, 150, '10 rows → few probes', { cls: 'xs' }); d.text(470, 150, '1,000 rows (each dot = 10)', { cls: 'xs', color: C.acc });
  d.text(320, 210, 'a nested loop chosen for 10 loops now runs 1,000; a hash join might have won', { cls: 'sm' });
  d.text(320, 236, 'read EXPLAIN ANALYZE rows and loops together', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_scans() {
  const d = illustration('sd_databases_scans', '100-PAGE TABLE: FULL SCAN 100 PAGES; SELECTIVE INDEX ≤ 13 VISITS; BROAD INDEX ≤ 8,003 VISITS', 320);
  for (let i = 0; i < 100; i++) d.rect(40 + (i % 20) * 14, 60 + Math.floor(i / 20) * 18, 11, 14, { r: 1, fill: C.card, stroke: C.line });
  d.text(180, 160, '100 distinct pages', { cls: 'xs' });
  const r = [['full sequential', '100', false], ['selective index', '3 + 10 = 13', true], ['broad index', '3 + 8,000 = 8,003', false]];
  r.forEach(([s, v, hot], i) => { const y = 70 + i * 40; d.text(360, y, s, { cls: 'sm', a: 'start' }); d.mono(600, y, v, { size: 10.5, a: 'end', color: hot ? C.acc : undefined }); });
  d.text(320, 240, '8,003 logical visits still land on at most 100 pages: revisits are not new pages', { cls: 'xs' });
  d.travel([[40, 56], [320, 56]], { dur: 4, r: 3 });
  return d.svg();
}
export function sd_databases_nested() {
  const d = illustration('sd_databases_nested', 'NESTED LOOP: FOR EACH OF 4 EVENTS, ONE INDEXED PROBE INTO USERS', 300);
  [['e1', 'u4'], ['e2', 'u8'], ['e3', 'u4'], ['e4', 'u9']].forEach(([e, u], i) => { const y = 60 + i * 50; chip(d, 40, y, 100, `${e} → ${u}`, i === 2, 28); d.arrow(146, y + 14, 300, 70 + ['u4', 'u8', 'u9'].indexOf(u) * 60, { stroke: i === 2 ? C.acc : C.line, hl: 5 }); });
  [['u4', 'Asha'], ['u8', 'Bo'], ['u9', 'Chen']].forEach(([u, n], j) => chip(d, 310, 56 + j * 60, 120, `${u}: ${n}`, j === 0, 28));
  d.travel([[146, 174], [300, 70]], { dur: 3, r: 3 });
  d.text(530, 130, '4 indexed probes\nvs 4 × 3 = 12\nscan tests', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_databases_hash_join() {
const d=illustration('sd_databases_hash_join','HASH JOIN BUILDS A KEYED LOOKUP ONCE AND PROBES IT FOR EACH EVENT',350);
  const users=[['u4','Asha'],['u8','Bo'],['u9','Chen']];
  users.forEach((r,i)=>figShelf(d,219,66+i*60,r,{width:199,height:40,hot:0}));d.text(319,44,'build from 3 users',{cls:'ttl'});
  ['u4','u8','u4','u9'].forEach((s,i)=>{const y=63+i*60;d.envelope(37,y,88,35);d.mono(81,y+17,s,{size:11});d.arrow(133,y+17,211,86+[0,1,0,2][i]*60,{stroke:C.line,hl:5});d.mono(528,y+17,['Asha','Bo','Asha','Chen'][i],{size:12});});
  d.arrow(426,149,464,149,{stroke:C.acc});d.text(320,297,'4 events probe the keyed table; 4 joined outputs',{cls:'sm'});return d.svg();
}
export function sd_databases_merge_join() {
  const d = illustration('sd_databases_merge_join', 'MERGE JOIN: TWO SORTED LISTS, ADVANCE THE SMALLER KEY, EMIT ON EQUAL: 6 COMPARISONS', 300);
  d.text(60, 66, 'events by user', { cls: 'xs', a: 'start' }); d.tape(60, 76, ['u4:e1', 'u4:e3', 'u8:e2', 'u9:e4'], { cw: 80, h: 30 });
  d.text(60, 146, 'users', { cls: 'xs', a: 'start' }); d.tape(60, 156, ['u4', 'u8', 'u9'], { cw: 80, h: 30 });
  d.travel([[100, 112], [180, 112], [260, 112], [340, 112]], { dur: 6, label: '↓', w: 18 });
  d.travel([[100, 196], [100, 196], [180, 196], [260, 196]], { dur: 6, label: '↑', w: 18, fill: C.card, color: C.ink2 });
  d.text(500, 92, 'emit Asha ×2', { cls: 'sm', a: 'start' }); d.text(500, 130, 'emit Bo', { cls: 'sm', a: 'start' }); d.text(500, 168, 'emit Chen', { cls: 'sm', a: 'start', color: C.acc });
  d.text(320, 256, 'unique inner side; duplicates on both sides need group handling', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_transaction() {
const d=illustration('sd_databases_transaction','THE SCORE, EVENT AND COMMAND RESULT SHARE ONE COMMIT BOUNDARY',330);
  d.rect(41,59,556,216,{fill:C.paper,stroke:C.acc,dash:[5,4]});d.text(320,83,'one local transaction',{cls:'ttl',color:C.acc});
  ['score 11','event e5','key k7'].forEach((s,i)=>figPage(d,71+i*177,113,137,106,s,i===0));
  d.text(320,250,'commit all, or roll back all',{cls:'mono',size:12});
  d.text(320,306,'a partial group is not a successful command',{cls:'sm'});return d.svg();
}
export function sd_databases_transfer() {
  const d = illustration('sd_databases_transfer', 'MOVE 2,500 ¢ FROM A TO B: 10,000 + 2,000 = 7,500 + 4,500 = 12,000 EITHER WAY', 300);
  const acct = (x, s, before, after) => { d.db(x, 70, 110, 100, { label: s }); d.during([0, 0.5], (g) => g.mono(x + 55, 190, before, { size: 12 })); d.during([0.5, 1], (g) => g.mono(x + 55, 190, after, { size: 12, color: C.acc })); };
  acct(80, 'account A', '10,000 ¢', '7,500 ¢'); acct(450, 'account B', '2,000 ¢', '4,500 ¢');
  d.travel([[196, 120], [444, 120]], { dur: 6, at: [0.2, 0.5], label: '2,500 ¢', w: 54 });
  d.rect(220, 220, 200, 34, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(320, 237, 'total 12,000 ¢', { size: 11, color: C.acc });
  d.text(320, 282, 'one transaction; a wrong credit of 2,000 would also commit atomically', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_acid() {
  const d = illustration('sd_databases_acid', 'ACID IS FOUR SEPARATE QUESTIONS ABOUT ONE COMMIT', 320);
  const r = [['A', 'atomicity', 'does the whole group commit?'], ['C', 'consistency', 'do the declared rules hold?'], ['I', 'isolation', 'which concurrent history is allowed?'], ['D', 'durability', 'which failures does it survive?']];
  r.forEach(([L, s, q], i) => { const x = 20 + (i % 2) * 310, y = 50 + Math.floor(i / 2) * 124; panel(d, x, y, 290, 108, '', i === 2); d.text(x + 40, y + 54, L, { size: 36, color: i === 2 ? C.acc : C.ink2 }); d.text(x + 80, y + 40, s, { cls: 'ttl', a: 'start' }); d.text(x + 80, y + 64, q, { cls: 'xs', a: 'start' }); });
  return d.svg();
}
export function sd_databases_lost_update() {
  const d = illustration('sd_databases_lost_update', 'BOTH READ 10, BOTH WRITE 11: ONE INCREMENT IS LOST; THE TOTAL SHOULD BE 12', 300);
  d.person(70, 60, 30, { label: 'A' }); d.person(570, 60, 30, { label: 'B' });
  d.db(270, 60, 100, 90);
  d.during([0, 0.5], (g) => g.mono(320, 170, '10', { size: 16 })); d.during([0.5, 1], (g) => g.mono(320, 170, '11 (not 12)', { size: 14, color: C.acc }));
  d.arrow(264, 90, 100, 90, { stroke: C.gray }); d.arrow(376, 90, 540, 90, { stroke: C.gray }); d.text(180, 80, 'read 10', { cls: 'xs' }); d.text(460, 80, 'read 10', { cls: 'xs' });
  d.arrow(100, 120, 264, 120, { stroke: C.ink2 }); d.arrow(540, 120, 376, 120, { stroke: C.ink2 }); d.text(180, 134, 'write 11', { cls: 'xs' }); d.text(460, 134, 'write 11', { cls: 'xs' });
  d.text(320, 230, 'fix: UPDATE … SET n = n + 1, a row lock, or a version check', { cls: 'sm' });
  return d.svg();
}
export function sd_databases_isolation() { return table('sd_databases_isolation', 'SQL STANDARD MINIMUM PROTECTIONS', ['level', 'dirty read', 'row reread', 'phantom'], [['uncommitted', 'allowed', 'allowed', 'allowed'], ['committed', 'prevented', 'allowed', 'allowed'], ['repeatable', 'prevented', 'prevented', 'allowed'], ['serializable', 'prevented', 'prevented', 'prevented']], 'engines can provide stronger guarantees'); }
export function sd_databases_anomalies() {
  const d = illustration('sd_databases_anomalies', 'NON-REPEATABLE READ: B COMMITS 11 BETWEEN A\'S TWO READS, SO A SEES 10 THEN 11', 300);
  const X = 60, W = 520;
  d.arrow(X, 180, X + W, 180, { stroke: C.gray });
  [[80, 'A reads 10', false], [240, 'B commits 11', false], [400, 'A reads 11', true]].forEach(([x, s, hot]) => { d.dot(X + x, 180, 5, hot ? C.acc : C.ink2); d.text(X + x, 150, s, { cls: 'sm', color: hot ? C.acc : undefined }); });
  d.text(320, 236, 'both values were committed: this is not a dirty read', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_phantom() {
  const d = illustration('sd_databases_phantom', 'A COUNTS ACTIVE SCORERS: 2; B INSERTS CHEN; A COUNTS AGAIN: 3', 300);
  d.rect(60, 70, 220, 120, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(170, 88, 'WHERE active', { cls: 'mono', size: 10 });
  d.person(110, 110, 34, { label: 'Asha' }); d.person(170, 110, 34, { label: 'Bo' });
  d.during([0.5, 1], (g) => g.person(230, 110, 34, { label: 'Chen', fill: C.accSoft, stroke: C.acc }));
  d.during([0, 0.5], (g) => g.mono(170, 214, 'count = 2', { size: 12 })); d.during([0.5, 1], (g) => g.mono(170, 214, 'count = 3', { size: 12, color: C.acc }));
  d.text(460, 130, 'locking the rows you saw\ndoes not lock the rows\nthat might appear', { cls: 'sm', vc: true });
  return d.svg();
}
export function sd_databases_write_skew() {
  const d = illustration('sd_databases_write_skew', 'ASHA AND BO EACH SEE THE OTHER ON DUTY AND BOTH GO OFF: ZERO SCORERS', 300);
  panel(d, 20, 44, 292, 180, 'Asha\'s transaction');
  d.person(90, 90, 34); d.person(240, 90, 34, { stroke: C.gray }); d.text(166, 160, '"Bo will stay" → Asha off', { cls: 'xs' });
  panel(d, 328, 44, 292, 180, 'Bo\'s transaction');
  d.person(398, 90, 34, { stroke: C.gray }); d.person(548, 90, 34); d.text(474, 160, '"Asha will stay" → Bo off', { cls: 'xs' });
  d.rect(200, 240, 240, 36, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(320, 258, 'committed together: nobody active', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_databases_mvcc() {
const d=illustration('sd_databases_mvcc','A SNAPSHOT CHOOSES THE VERSION ITS VISIBILITY RULES PERMIT',340);
  [10,11].forEach((v,i)=>{figPage(d,233+i*192,100,135,135,`score ${v}`,i===1);d.text(300+i*192,258,i?'B update':'old committed',{cls:'ttl'});});
  d.person(73,57,35);d.text(75,115,'reader A',{cls:'sm'});d.arrow(113,91,224,131,{stroke:C.ink2});
  d.person(73,217,35,{stroke:C.acc});d.text(74,275,'reader C',{cls:'sm'});d.carrow([[113,245],[321,292],[481,242]],{stroke:C.acc});
  d.text(300,68,'before B commit',{cls:'sm'});d.text(492,68,'after B commit',{cls:'sm',color:C.acc});
  d.text(320,319,'B sees its pending update; ordinary readers do not adopt it early',{cls:'sm'});return d.svg();
}
export function sd_databases_version_retention() {
  const d = illustration('sd_databases_version_retention', 'ONE OLD SNAPSHOT PINS 5,000 DEAD VERSIONS × 500 B = 2,500,000 B OF PAYLOAD', 300);
  d.clock(80, 120, 60); d.text(80, 170, 'old reader', { cls: 'xs' });
  d.arrow(116, 120, 196, 120, { stroke: C.acc });
  for (let i = 0; i < 50; i++) d.rect(210 + (i % 10) * 36, 70 + Math.floor(i / 10) * 22, 30, 18, { r: 2, fill: C.paper, stroke: C.gray, dash: [3, 2] });
  d.text(390, 196, '5,000 obsolete versions (each box = 100)', { cls: 'xs' });
  d.text(320, 240, 'ending the snapshot lets vacuum reclaim them; the file need not shrink', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_row_lock() {
  const d = illustration('sd_databases_row_lock', 'A LOCKS ROW m7 AND UPDATES; B WAITS; A COMMITS; B CONTINUES UNDER ITS ISOLATION RULES', 300);
  d.person(70, 80, 32, { label: 'writer A' }); d.person(570, 80, 32, { label: 'writer B' });
  d.rect(250, 80, 140, 60, { r: 6, fill: C.card, stroke: C.ink2 }); d.mono(320, 110, 'row m7', { size: 12 });
  d.during([0, 0.6], (g) => g.lock(304, 50, 32, { stroke: C.acc, fill: C.accSoft }));
  d.arrow(104, 110, 244, 110, { stroke: C.acc }); d.arrow(540, 110, 396, 110, { stroke: C.ink2, dash: [4, 3] });
  d.clock(470, 170, 34, { spin: 3 }); d.text(470, 204, 'waits', { cls: 'xs' });
  d.text(320, 250, 'a version column detects the conflict; it does not avoid the wait', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_deadlock() {
  const d = frame('sd_databases_deadlock', 'EACH TRANSACTION WAITS FOR THE OTHER OWNER');
  d.box(32, 103, 240, 89, 'A holds X\nA waits for Y', { fill: C.card, size: 15 });
  d.box(368, 103, 240, 89, 'B holds Y\nB waits for X', { fill: C.accSoft, stroke: C.acc, size: 15 });
  d.arrow(279, 120, 361, 120, { stroke: C.gray }); d.arrow(361, 175, 279, 175, { stroke: C.acc });
  d.text(320, 85, 'Y owner', { cls: 'sm' }); d.text(320, 214, 'X owner', { cls: 'sm' });
  d.hand(320, 277, 'a long wait is not necessarily a cycle'); return d.svg();
}
export function sd_databases_wal() {
const d=illustration('sd_databases_wal','RECORD THE CHANGE DURABLY BEFORE WRITING ITS DEPENDENT PAGE',345);
  d.doc(36,61,564,116,{lines:false});d.text(318,85,'recovery log',{cls:'ttl'});figShelf(d,65,111,['200 B','200 B','200 B'],{width:507,height:41,hot:2});
  d.mono(319,206,'3 × 200 B = 600 B toy log payload',{size:13});
  d.disk(122,286,67,{label:'required log flush'});figPage(d,454,247,89,71,'page');d.text(498,327,'page persistence later',{cls:'sm'});
  d.arrow(122,184,122,246,{stroke:C.acc});d.arrow(497,218,497,239,{stroke:C.line,dash:[4,4]});return d.svg();
}
export function sd_databases_recovery() {
  const d = illustration('sd_databases_recovery', 'THE PAGE ON DISK SAYS 10; THE COMMITTED LOG SAYS 11 + e5 + k7; REDO REBUILDS 11', 300);
  d.doc(60, 80, 100, 110, { lines: false }); d.mono(110, 120, 'score 10', { size: 11 }); d.text(110, 210, 'page at crash', { cls: 'xs' });
  d.tape(240, 120, ['…', 'set 11', 'e5', 'k7', 'commit'], { cw: 60, h: 30, hot: (i) => i >= 1 }); d.text(390, 106, 'durable log', { cls: 'xs' });
  d.arrow(540, 135, 570, 135, { stroke: C.acc, hl: 5 });
  d.doc(576, 80, 50, 110, { lines: false, fill: C.accSoft, stroke: C.acc }); d.mono(601, 120, '11', { size: 12, color: C.acc });
  d.travel([[240, 135], [540, 135]], { dur: 4, token: (g) => g.line(0, -20, 0, 20, { stroke: C.acc, sw: 1.6, single: true }) });
  d.text(320, 260, 'redo restores the committed state; it never runs "add 1" again', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_pool() {
  const d = illustration('sd_databases_pool', '20 CONNECTIONS × 0.01 S = 2,000 OPS/S; HOLD EACH 0.1 S FOR A REMOTE CALL AND IT IS 200', 300);
  for (let i = 0; i < 20; i++) d.rect(40 + (i % 10) * 28, 70 + Math.floor(i / 10) * 40, 22, 32, { r: 2, fill: C.card, stroke: C.ink2 });
  d.text(180, 170, '20 connections', { cls: 'xs' });
  d.rect(360, 70, 10 * 2, 28, { r: 1, fill: C.card, stroke: C.ink2 }); d.mono(390, 84, '0.01 s → 2,000/s', { size: 10, a: 'start' });
  d.rect(360, 120, 20, 28, { r: 1, fill: C.card, stroke: C.ink2 }); d.rect(380, 120, 180, 28, { r: 1, fill: C.accSoft, stroke: C.acc }); d.text(470, 134, 'remote wait 0.09 s', { cls: 'xs', color: C.acc });
  d.mono(470, 168, '20 ÷ 0.1 = 200/s', { size: 11, color: C.acc });
  d.text(320, 236, '5 processes × 20 = 100 database sessions, whatever the throughput', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_replica_positions() {
const d=illustration('sd_databases_replica_positions','RECEIVED AND DURABLE LOGS CAN STILL BE AHEAD OF APPLIED STATE',330);
  [['leader commit',8],['follower received',8],['follower durable',8],['follower applied',7]].forEach(([s,pos],i)=>{const y=61+i*60;d.text(33,y+18,s,{cls:'ttl',a:'start',size:11});figShelf(d,198,y,['6','7',pos===8?'8':'not applied'],{width:363,height:35,hot:i===3?1:-1});d.mono(602,y+18,pos,{size:13});});
  d.text(320,311,'only applied state answers the current-score query',{cls:'sm'});return d.svg();
}
export function sd_databases_acknowledgement() {
  const d = frame('sd_databases_acknowledgement', 'ABSOLUTE COMPLETION TIMES IN MILLISECONDS');
  d.arrow(48, 161, 598, 161, { stroke: C.gray });
  [[4, 'local flush'], [7, 'follower flush'], [12, 'follower apply']].forEach(([t, label], i) => { const x = 52 + t / 12 * 527; d.dot(x, 161, 4, i === 1 ? C.acc : C.ink); d.line(x, 161, x, i === 1 ? 205 : 115, { stroke: C.line }); d.text(x, i === 1 ? 225 : 92, label, { cls: 'sm', size: 11 }); d.mono(x, i === 1 ? 248 : 69, `${t} ms`, { size: 11 }); });
  d.hand(320, 286, 'remote durable acknowledgement can precede a fresh read'); return d.svg();
}
export function sd_databases_lag() {
  const d = illustration('sd_databases_lag', 'THE LEADER ACKS POSITION 8; A READ AT THE FOLLOWER STILL GETS 7', 320);
  d.person(50, 70, 30, { label: 'scorer' }); d.server(270, 60, 80, 80, { label: 'leader' }); d.server(500, 60, 80, 80, { label: 'follower' });
  const st = [[80, 270, 'commit 8', 170, C.ink2], [270, 80, 'ack 8', 196, C.ink2], [80, 500, 'read', 222, C.ink2], [500, 80, 'applied 7: old score', 248, C.acc], [350, 500, 'position 8 arrives', 280, C.gray]];
  st.forEach(([a, b, s, y, col], i) => { d.arrow(a, y, b, y, { stroke: col, hl: 6 }); d.mono((a + b) / 2, y - 9, s, { size: 9, color: col === C.acc ? C.acc : undefined }); d.travel([[a, y], [b, y]], { dur: 8, at: [i / 5, (i + 0.8) / 5], r: 3, color: col }); });
  return d.svg();
}
export function sd_databases_partition_shard() {
  const d = illustration('sd_databases_partition_shard', 'TIME PARTITIONS SPLIT ONE TABLE ON ONE MACHINE; MATCH SHARDS SPLIT OWNERSHIP ACROSS MACHINES', 320);
  panel(d, 20, 44, 292, 230, 'time partitions');
  d.server(120, 80, 90, 160, { unit: 20 });
  ['Jan', 'Feb', 'Mar', 'Apr'].forEach((m, i) => d.mono(165, 100 + i * 38, m, { size: 10 }));
  d.text(166, 258, 'retention by dropping a month', { cls: 'xs' });
  panel(d, 328, 44, 292, 230, 'match shards', true);
  [0, 1, 2].forEach((i) => { d.server(348 + i * 90, 100, 70, 90, { unit: 15 }); d.mono(383 + i * 90, 206, `m${i * 3 + 1}–${i * 3 + 3}`, { size: 9 }); });
  d.text(474, 258, 'cross-shard query = network + merge', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_databases_partition_key() {
  const d = illustration('sd_databases_partition_key', '100 + 100 + 800 = 1,000 REQUESTS/S; THE MEAN 333.3333 HIDES THE OWNER AT 800', 300);
  [['A', 100], ['B', 100], ['C', 800]].forEach(([s, v], i) => { const x = 100 + i * 170, hot = v === 800; d.server(x, 250 - v * 0.22, 90, v * 0.22, { unit: 16, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 45, 266, `${s}: ${v}/s`, { size: 10.5, color: hot ? C.acc : undefined }); });
  d.line(80, 250 - 333.3333 * 0.22, 600, 250 - 333.3333 * 0.22, { stroke: C.ink, dash: [5, 4], single: true }); d.text(600, 250 - 333.3333 * 0.22 - 12, 'mean', { cls: 'xs', a: 'end' });
  return d.svg();
}
export function sd_databases_reshard() {
  const d = illustration('sd_databases_reshard', 'COPY 1M ROWS (100 S AT 10,000/S), REPLAY 300 CHANGES (15 S AT 20/S SPARE), INSTALL EPOCH, ROUTE', 300);
  const st = [['snapshot', '1,000,000 ÷ 10,000\n= 100 s'], ['replay', '300 ÷ (40 − 20)\n= 15 s'], ['install epoch', 'old writes\nrejected'], ['new route', 'retry same\nidentity']];
  st.forEach(([a, b], i) => { const x = 30 + i * 150, hot = i === 2; d.rect(x, 80, 120, 50, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 60, 105, a, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 162, b, { cls: 'xs', vc: true }); if (i < 3) d.arrow(x + 124, 105, x + 146, 105, { stroke: C.gray, hl: 5 }); });
  d.travel([[90, 105], [540, 105]], { dur: 5, r: 4 });
  d.text(320, 240, 'an issued epoch must reach the protected resource before routing changes', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_shard() {
  const d = frame('sd_databases_shard', 'OWNER E TAKES ONLY THE NEIGHBORING INTERVAL', 390);
  d.circle(303, 171, 202, { stroke: C.gray });
  [[0, 'A'], [25, 'B'], [50, 'C'], [60, 'E'], [75, 'D']].forEach(([v, label]) => {
    const angle = v / 100 * Math.PI * 2 - Math.PI / 2, x = 303 + Math.cos(angle) * 127, y = 171 + Math.sin(angle) * 117;
    d.box(x - 28, y - 19, 56, 38, `${label}: ${v}`, { fill: label === 'E' ? C.accSoft : C.card, stroke: label === 'E' ? C.acc : C.ink2, cls: 'mono', size: 11 });
  });
  d.text(303, 153, '55 and 58', { cls: 'mono', size: 12, color: C.acc }); d.text(303, 185, 'D -> E', { cls: 'mono', size: 12, color: C.acc });
  d.text(566, 163, 'clockwise', { cls: 'sm', size: 10 }); d.hand(320, 357, 'two of six sample keys move; not an equal-share ring'); return d.svg();
}
export function sd_databases_hot_partition() {
  const d = illustration('sd_databases_hot_partition', 'ONE HOT MATCH: READS, APPENDS AND A CONTESTED ROW EACH NEED A DIFFERENT REMEDY', 320);
  const r = [['repeated reads', 'cache or read copies', 'keep freshness'], ['append overhead', 'batch suitable events', 'keep order + latency'], ['one contested row', 'coordinate or redesign', 'keep the invariant']];
  r.forEach(([a, b, c], i) => { const x = 40 + i * 200, hot = i === 2; panel(d, x, 48, 170, 220, a, hot); if (i === 0) d.ram(x + 45, 90, 80, 30); if (i === 1) d.tape(x + 40, 92, ['', '', ''], { cw: 30, h: 24 }); if (i === 2) d.lock(x + 68, 84, 34, { stroke: C.acc, fill: C.accSoft }); d.text(x + 85, 170, b, { cls: 'sm' }); d.text(x + 85, 196, c, { cls: 'xs' }); });
  d.text(320, 296, 'moving the key to another owner does not split it', { cls: 'xs' });
  return d.svg();
}
export function sd_databases_complete() {
  const d = illustration('sd_databases_complete', 'FENCED OWNER, ONE LOCAL COMMIT (SCORE, KEY, OUTBOX), WAL DURABILITY, THEN REPLICAS AND DELIVERY', 300);
  const st = [['fenced owner', 'current epoch'], ['local group', 'score, key, intent'], ['WAL commit', 'chosen survival'], ['replica + outbox', 'read fence + dedupe']];
  st.forEach(([a, b], i) => { const x = 30 + i * 150, hot = i === 3; if (i === 0) d.lock(x + 44, 60, 32); if (i === 1) d.db(x + 34, 58, 52, 56); if (i === 2) d.tape(x + 14, 74, ['', '', ''], { cw: 30, h: 24, hot: () => true }); if (i === 3) { d.db(x + 20, 62, 36, 48); d.envelope(x + 64, 74, 40, 24, { fill: C.accSoft, stroke: C.acc }); } d.text(x + 60, 140, a, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); d.text(x + 60, 160, b, { cls: 'xs' }); if (i < 3) d.arrow(x + 112, 88, x + 146, 88, { stroke: C.gray, hl: 5 }); });
  d.travel([[90, 88], [540, 88]], { dur: 5, r: 4 });
  d.text(320, 230, 'the external receiver keeps its own duplicate-safe boundary', { cls: 'xs' });
  return d.svg();
}

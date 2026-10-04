import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { cards, ledger, flow } from '../lib/fundamentals-figures.js';
import numbers from '../data/fundamentals/numbers.json' with { type: 'json' };
const n = numbers.dbms;
const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
const panel = (d, x, y, w, h, s, hot) => { d.rect(x, y, w, h, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + w / 2, y + 18, s, { cls: 'ttl', color: hot ? C.acc : undefined }); };
export function dbms_replica_ack() {
  const d = illustration('dbms_replica_ack', `ASYNC ACKS AT ${n.async_ack_ms} MS AFTER LOCAL DISK; SYNC WAITS FOR THE REPLICA UNTIL ${n.sync_ack_ms} MS`, 320);
  const X = (t) => 120 + t * 36;
  d.server(30, 70, 50, 70, { label: 'primary' }); d.server(30, 190, 50, 70, { label: 'replica' });
  d.arrow(X(0), 105, X(13.5), 105, { stroke: C.gray, hl: 6 }); d.arrow(X(0), 225, X(13.5), 225, { stroke: C.gray, hl: 6 });
  for (let t = 0; t <= 13; t++) d.mono(X(t), 286, String(t), { size: 9, color: C.gray });
  d.text(X(13.5), 300, 'ms', { cls: 'xs' });
  d.rect(X(0), 92, X(n.async_ack_ms) - X(0), 26, { r: 2, fill: C.card, stroke: C.ink2 }); d.text((X(0) + X(n.async_ack_ms)) / 2, 105, 'local fsync', { cls: 'xs' });
  d.rect(X(1), 212, X(n.sync_ack_ms) - X(1), 26, { r: 2, fill: C.card, stroke: C.ink2 }); d.text((X(1) + X(n.sync_ack_ms)) / 2, 225, 'ship, replica fsync', { cls: 'xs' });
  d.line(X(n.async_ack_ms), 60, X(n.async_ack_ms), 270, { stroke: C.ink2, dash: [3, 3], single: true }); d.text(X(n.async_ack_ms), 52, `async ack ${n.async_ack_ms} ms`, { cls: 'sm' });
  d.glow((g) => g.line(X(n.sync_ack_ms), 60, X(n.sync_ack_ms), 270, { stroke: C.acc, sw: 1.8, single: true })); d.text(X(n.sync_ack_ms), 52, `sync ack ${n.sync_ack_ms} ms`, { cls: 'sm', color: C.acc });
  d.brace(X(n.async_ack_ms), X(n.sync_ack_ms), 160, { label: `${n.sync_ack_ms} − ${n.async_ack_ms} = ${n.sync_penalty_ms} ms extra wait`, color: C.acc });
  d.travel([[X(1), 118], [X(1), 212]], { dur: 4, at: [0.1, 0.3], token: 'packet' });
  return d.svg();
}
export function dbms_reshard() {
  const d = illustration('dbms_reshard', 'MOVING A SHARD: COPY THE DATA, CATCH UP, FENCE THE OLD OWNER, THEN SWITCH THE ROUTE', 340);
  d.db(50, 110, 100, 110, { label: 'old shard' }); d.db(490, 110, 100, 110, { label: 'new shard' });
  d.router(270, 46, 100, { label: 'router' });
  d.carrow([[154, 140], [320, 120], [486, 140]], { stroke: C.ink2 }); d.text(320, 110, '1 snapshot copy at a recorded log position', { cls: 'xs' });
  d.carrow([[154, 180], [320, 200], [486, 180]], { stroke: C.ink2, dash: [4, 4] }); d.text(320, 214, '2-3 stream later changes until caught up', { cls: 'xs' });
  d.flowline('M154,180 Q320,200 486,180', { color: C.gray });
  d.glow((g) => { g.line(170, 240, 170, 290, { stroke: C.acc, sw: 3, single: true }); g.line(140, 265, 200, 265, { stroke: C.acc, sw: 3, single: true }); });
  d.text(210, 262, '4 fence: old generation rejected,', { cls: 'sm', a: 'start', color: C.acc }); d.text(210, 280, 'only the new owner may write', { cls: 'sm', a: 'start', color: C.acc });
  d.line(320, 80, 100, 104, { stroke: C.line, single: true, dash: [3, 3] });
  d.arrow(330, 80, 530, 104, { stroke: C.ink2 }); d.text(470, 80, '5 new writes', { cls: 'xs' });
  d.text(110, 316, '6 retire the old copy only after its obligations are done', { cls: 'xs', a: 'start' });
  d.travel([[154, 140], [320, 120], [486, 140]], { dur: 5, at: [0, 0.4], r: 3.5 });
  return d.svg();
}
export function dbms_access_models() {
  const d = illustration('dbms_access_models', 'PICK THE DATABASE FAMILY BY HOW YOU WILL READ AND WRITE THE DATA', 360);
  const fam = [['relational', 'constraints, joins, ad hoc queries'], ['document', 'read and update one aggregate'], ['key-value', 'get and put by a known key'], ['wide-column', 'ordered rows inside a partition'], ['graph', 'walk relationships'], ['time-series', 'append by time, aggregate windows']];
  fam.forEach(([s, sub], i) => {
    const x = 20 + (i % 3) * 205, y = 40 + Math.floor(i / 3) * 155, hot = i === 0, cx = x + 95, cy = y + 66;
    panel(d, x, y, 190, 140, s, hot);
    if (i === 0) { d.glow((g) => { g.grid(cx - 70, cy - 26, 3, 2, 26, 16, {}); g.grid(cx + 18, cy - 26, 3, 2, 26, 16, {}); }); d.line(cx - 18, cy - 10, cx + 18, cy + 6, { stroke: C.acc, single: true }); }
    if (i === 1) { d.doc(cx - 30, cy - 34, 60, 70, { lines: false }); d.mono(cx, cy - 12, '{ order', { size: 9 }); d.mono(cx, cy + 4, '  items[] }', { size: 9 }); }
    if (i === 2) { for (let k = 0; k < 3; k++) { d.rect(cx - 60 + k * 42, cy - 20, 36, 44, { r: 2, fill: C.card, stroke: C.ink2 }); d.circle(cx - 42 + k * 42, cy + 2, 8, { stroke: C.ink2 }); } d.key(cx - 50, cy + 36, 22); }
    if (i === 3) { for (let r = 0; r < 3; r++) d.chips(cx - 70, cy - 30 + r * 24, ['pk', 'ts', 'ts', 'ts'].slice(0, 2 + r), { h: 18, size: 9 }); }
    if (i === 4) { const P = [[-50, -16], [0, -30], [40, 0], [-20, 22], [50, 30]]; [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 3]].forEach(([a, b]) => d.line(cx + P[a][0], cy + P[a][1], cx + P[b][0], cy + P[b][1], { stroke: C.ink2, single: true })); P.forEach(([a, b]) => d.circle(cx + a, cy + b, 14, { fill: C.card, stroke: C.ink2 })); }
    if (i === 5) { d.lines([[cx - 70, cy + 20], [cx - 40, cy + 8], [cx - 20, cy + 16], [cx + 10, cy - 14], [cx + 40, cy - 4], [cx + 70, cy - 24]], { stroke: C.ink2, sw: 1.4, single: true }); d.line(cx - 72, cy + 30, cx + 72, cy + 30, { stroke: C.line, single: true }); }
    d.text(cx, y + 124, sub, { cls: 'xs' });
  });
  return d.svg();
}
export function dbms_booking_design() {
const d=illustration('dbms_booking_design','ONE PHYSICAL SEAT HAS A SEPARATE INVENTORY RECORD FOR EACH SHOW',350);
  d.rect(57,119,70,51,{r:4,fill:C.accSoft,stroke:C.acc});d.line(55,179,130,179,{stroke:C.acc,sw:3,single:true});d.text(92,209,'physical seat A7',{cls:'ttl'});
  ['matinee','evening'].forEach((s,i)=>{figPage(d,251,62+i*165,134,107,'',i===1);d.text(318,83,s,{cls:'ttl'});d.mono(318,118,'A7 | state',{size:11});d.arrow(138,145,243,115+i*165,{stroke:i?C.acc:C.line,hl:5});});
  d.doc(459,204,131,102,{lines:false});d.text(524,229,'booking item',{cls:'ttl'});d.mono(524,263,'evening + A7',{size:11});d.arrow(394,280,450,254,{stroke:C.acc});
  d.text(320,331,'identity belongs to the show and the seat together',{cls:'sm'});return d.svg();
}
export function dbms_pg_versions() {
  const d = illustration('dbms_pg_versions', 'AN UPDATE ADDS A NEW ROW VERSION; OLD VERSIONS STAY UNTIL NO SNAPSHOT CAN SEE THEM', 330);
  const v = [['version 1', 'A7 free', 'dead', 2], ['version 2', 'A7 held', 'old', 0], ['version 3', 'A7 sold', 'current', 0]];
  v.forEach(([xid, val, s, k], i) => {
    const x = 40 + i * 200, hot = i === 0;
    const draw = (g) => g.rect(x, 90, 160, 70, { r: 5, fill: hot ? C.accFaint : C.card, stroke: hot ? C.acc : C.ink2, dash: hot ? [5, 4] : undefined });
    if (hot) d.glow(draw); else draw(d);
    d.mono(x + 80, 112, xid, { size: 9.5 }); d.mono(x + 80, 136, val, { size: 12 }); d.text(x + 80, 76, s, { cls: 'xs', color: hot ? C.acc : undefined });
    if (i < 2) d.arrow(x + 164, 125, x + 196, 125, { stroke: C.gray, hl: 6 });
  });
  d.person(320, 200, 30, { label: 'older snapshot' }); d.arrow(320, 196, 300, 166, { stroke: C.ink2, hl: 6 });
  d.person(520, 200, 30, { label: 'newer snapshot' }); d.arrow(520, 196, 510, 166, { stroke: C.ink2, hl: 6 });
  d.path('M80,210 L120,180 M100,230 L70,250 L90,256 L76,268', { stroke: C.acc, sw: 1.6, single: true }); d.text(130, 240, 'VACUUM reclaims\nthe dead version', { cls: 'sm', a: 'start', vc: true, color: C.acc });
  d.text(320, 300, 'a long-running snapshot keeps old versions alive and bloats the table', { cls: 'xs' });
  return d.svg();
}
export function dbms_pg_plan() {
  const d = illustration('dbms_pg_plan', `PLAN NODES CARRY A GUESS AND A COUNT: ${n.estimated_rows} EXPECTED, ${n.actual_rows} SEEN`, 340);
  const node = (x, y, s, est, act, hot) => { const draw = (g) => g.rect(x, y, 220, 50, { r: 5, fill: hot ? C.accFaint : C.card, stroke: hot ? C.acc : C.ink2 }); if (hot) d.glow(draw); else draw(d); d.mono(x + 12, y + 16, s, { a: 'start', size: 10.5 }); d.mono(x + 12, y + 36, `rows=${est}  actual=${act}`, { a: 'start', size: 9.5, color: hot ? C.acc : C.gray }); };
  node(210, 50, 'Nested Loop', 16, 80, false);
  node(60, 160, 'Index Scan show_seats', n.estimated_rows, n.actual_rows, true);
  node(360, 160, 'Index Scan bookings', 1, 1, false);
  d.line(320, 100, 170, 160, { stroke: C.ink2, single: true }); d.line(320, 100, 470, 160, { stroke: C.ink2, single: true });
  d.text(170, 236, `${n.show_seats} × 0.02 = ${n.estimated_rows} guessed`, { cls: 'mono', size: 10 });
  d.text(170, 256, `${n.actual_rows} ÷ ${n.estimated_rows} = ${n.estimate_error} times off`, { cls: 'mono', size: 10, color: C.acc });
  d.text(470, 236, 'inner side runs once per outer row:', { cls: 'xs' }); d.text(470, 252, '80 loops, not 16', { cls: 'xs' });
  d.travel([[170, 160], [320, 100]], { dur: 2.5, r: 3 });
  d.text(320, 306, 'illustrative numbers, not a PostgreSQL benchmark', { cls: 'xs' });
  return d.svg();
}
export function dbms_pool_budget() {
  const d = illustration('dbms_pool_budget', `${n.server_connection_limit} SERVER CONNECTIONS, ${n.operational_reserve} RESERVED: 8 APP INSTANCES MUST SHARE ${n.pool_available}`, 340);
  d.text(170, 46, 'database server slots', { cls: 'ttl' });
  for (let i = 0; i < n.server_connection_limit; i++) { const x = 40 + (i % 10) * 26, y = 60 + Math.floor(i / 10) * 26, res = i >= n.pool_available; d.circle(x + 10, y + 10, 18, { fill: res ? C.card : C.accSoft, stroke: res ? C.gray : C.acc, sw: 0.8 }); }
  d.text(170, 286, `${n.pool_available} for apps, ${n.operational_reserve} for admin and migrations`, { cls: 'sm' });
  panel(d, 330, 50, 290, 110, '8 × 20 = ' + n.global_pool_connections, false);
  d.text(475, 96, `asks for ${n.global_pool_connections}, server has ${n.server_connection_limit}`, { cls: 'sm' }); d.text(475, 116, 'new connections refused under load', { cls: 'xs' });
  d.path('M560,130 L572,142 M572,130 L560,142', { stroke: C.ink2, sw: 2, single: true });
  d.glow((g) => g.rect(330, 180, 290, 110, { r: 6, fill: C.accFaint, stroke: C.acc }));
  d.text(475, 198, '8 × 8 = ' + n.bounded_pool_connections, { cls: 'ttl', color: C.acc });
  for (let k = 0; k < 8; k++) { d.rect(346 + k * 34, 216, 28, 44, { r: 3, fill: C.paper, stroke: C.ink2 }); for (let j = 0; j < 8; j++) d.dot(352 + k * 34 + (j % 2) * 14, 222 + Math.floor(j / 2) * 10, 2.2, C.acc); }
  d.text(475, 278, 'fits exactly; extra requests queue in the app', { cls: 'xs' });
  return d.svg();
}
export function dbms_query_trace() {
const d=illustration('dbms_query_trace','ONE RESERVATION TOUCHES AN INDEX, A ROW, A LOCK AND THE LOG',375);
  d.doc(38,62,125,98,{lines:false});d.text(100,87,'reservation',{cls:'ttl'});d.mono(100,125,'seat A7',{size:13});
  d.rect(244,62,156,86,{fill:C.card,stroke:C.ink2});d.text(322,84,'index leaf',{cls:'ttl'});figShelf(d,257,101,['A7','locator'],{width:130,height:29,hot:0});d.arrow(170,111,236,111,{stroke:C.ink2});
  figPage(d,467,62,125,113,'tuple',true);d.arrow(408,111,459,111,{stroke:C.acc});
  d.lock(512,221,38,{fill:C.accSoft,stroke:C.acc});d.text(530,300,'lock + recheck',{cls:'ttl'});d.arrow(531,181,531,213,{stroke:C.acc});
  d.doc(190,242,247,56,{lines:false});d.mono(313,269,'booking + WAL commit',{size:12});d.arrow(500,266,445,266,{stroke:C.acc});
  d.text(320,348,'acknowledgement follows the declared durable transaction boundary',{cls:'sm'});return d.svg();
}
export function dbms_booking_race() {
  const d = illustration('dbms_booking_race', 'ADA LOCKS SEAT A7 FIRST; BO WAITS, RECHECKS, AND UPDATES ZERO ROWS', 330);
  d.db(270, 60, 100, 90, { label: 'A7' });
  d.during([0, 0.4], (g) => g.mono(320, 168, 'free', { size: 11 }), { dur: 8 });
  d.during([0.4, 1], (g) => g.mono(320, 168, 'held by Ada', { size: 11 }), { dur: 8 });
  d.person(80, 70, 36, { label: 'Ada' }); d.person(560, 70, 36, { label: 'Bo' });
  d.lock(250, 120, 26, { stroke: C.ink2 });
  d.travel([[110, 100], [266, 110]], { at: [0, 0.15], dur: 8, label: 'lock', w: 34, fill: C.card, color: C.ink2 });
  d.travel([[530, 100], [376, 110]], { at: [0.08, 0.2], dur: 8, label: 'lock?', w: 40, fill: C.card, color: C.ink2 });
  d.clock(560, 160, 34, { spin: 2 }); d.text(560, 190, 'waits for Ada', { cls: 'xs' });
  d.text(110, 220, 'Ada: claim, COMMIT', { cls: 'sm' });
  d.glow((g) => g.rect(440, 210, 180, 56, { r: 5, fill: C.accFaint, stroke: C.acc }));
  d.mono(530, 228, "WHERE state = 'free'", { size: 9.5 }); d.mono(530, 248, 'UPDATE 0', { size: 11, color: C.acc });
  d.text(320, 300, 'the recheck after waiting is what stops a second booking', { cls: 'sm' });
  return d.svg();
}
export function dbms_complete_bytes() {
  const d = illustration('dbms_complete_bytes', `${n.heap_pages} HEAP PAGES + ${n.index_pages} INDEX PAGES = ${n.heap_pages + n.index_pages} PAGES = ${n.inventory_with_index_bytes.toLocaleString('en-US')} BYTES`, 340);
  for (let i = 0; i < n.heap_pages + n.index_pages; i++) {
    const x = 40 + (i % 11) * 38, y = 60 + Math.floor(i / 11) * 52, idx = i >= n.heap_pages;
    d.doc(x, y, 30, 40, { lines: !idx, fill: idx ? C.slateSoft : C.card, stroke: idx ? C.slate : C.ink2 });
  }
  d.text(150, 230, `heap ${n.heap_pages} × ${n.page_bytes} = ${n.heap_bytes.toLocaleString('en-US')}`, { cls: 'mono', size: 10 });
  d.text(330, 230, `index ${n.index_pages} × ${n.page_bytes} = ${n.index_bytes.toLocaleString('en-US')}`, { cls: 'mono', size: 10, color: C.slate });
  d.glow((g) => g.rect(470, 60, 150, 140, { r: 6, fill: C.accFaint, stroke: C.acc }));
  d.text(545, 90, 'one copy', { cls: 'xs' }); d.mono(545, 116, n.inventory_with_index_bytes.toLocaleString('en-US'), { size: 15, color: C.acc }); d.text(545, 136, 'bytes', { cls: 'xs' });
  d.mono(545, 172, `× ${n.replicas} = ${n.replicated_inventory_bytes.toLocaleString('en-US')}`, { size: 10.5 });
  d.text(320, 290, 'toy layout: every page full size, no free-space map or metadata pages', { cls: 'xs' });
  return d.svg();
}
export function dbms_component_jobs() {
  const d = illustration('dbms_component_jobs', 'A DATABASE ENGINE CUT OPEN: SIX PARTS, SIX DIFFERENT PROMISES', 380);
  const L = [['schema + constraints', 'only legal rows exist'], ['planner + executor', 'find and compute the rows'], ['index + buffer manager', 'locate keys, reuse pages'], ['locks + visibility', 'who sees and changes what'], ['WAL + recovery', 'acknowledged work survives a crash'], ['replication + ownership', 'copies and one valid writer']];
  L.forEach(([s, sub], i) => {
    const y = 46 + i * 50, w = 400 - i * 12, x = 160 + i * 6, hot = i === 4;
    const draw = (g) => g.rect(x, y, w, 42, { r: 5, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (hot) d.glow(draw); else draw(d);
    d.text(x + 14, y + 15, s, { cls: 'ttl', a: 'start', size: 11, color: hot ? C.acc : undefined }); d.text(x + 14, y + 31, sub, { cls: 'xs', a: 'start' });
  });
  d.person(80, 50, 34, { label: 'SQL in' }); d.disk(80, 330, 50, { label: 'disk' });
  d.travel([[110, 80], [150, 80], [150, 320], [110, 320]], { dur: 5, token: 'packet' });
  return d.svg();
}

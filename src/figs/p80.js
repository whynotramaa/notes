import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { canvas, flow, cards, ledger, lanes, map, cover } from '../lib/fundamentals-figures.js';
import values from '../data/fundamentals/numbers.json' with { type: 'json' };
const N = values.dbms;
const stages = ['Database model','Keys and ER','Algebra and SQL','Dependencies','Storage and indexes','Query execution','Transactions','Concurrency control','Recovery and engines','Distributed databases','Application design','The complete query'];
const chip = (d, x, y, w, s, hot = false, h = 22) => d.box(x, y, w, h, s, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 9.5 });
const panel = (d, x, y, w, h, s, hot) => { d.rect(x, y, w, h, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.line }); d.text(x + w / 2, y + 18, s, { cls: 'ttl', color: hot ? C.acc : undefined }); };
const sheet = (d, x, y, head, rows, { cw = 70, rh = 24, hot = -1, title } = {}) => {
  if (title) d.text(x, y - 12, title, { cls: 'ttl', a: 'start', size: 11 });
  d.grid(x, y, rows.length + 1, head.length, cw, rh, { val: (r, c) => r ? (rows[r - 1][c] ?? 'NULL') : head[c], vsize: 10, cellFill: (r) => r === 0 ? C.card : r - 1 === hot ? C.accSoft : C.paper, vcolor: (r, c) => r && rows[r - 1][c] == null ? C.acc : undefined });
  return (r) => y + (r + 1) * rh + rh / 2;
};
const seat = (d, x, y, o = {}) => { d.rect(x, y, 34, 26, { r: 6, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 }); d.rect(x - 4, y + 22, 42, 12, { r: 3, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 }); if (o.label) d.mono(x + 17, y + 12, o.label, { size: 9.5 }); };
export function where_fund_dbms(stage=99){ return map('where_fund_dbms',stages,stage); }
export function cover_fund_dbms(){ return cover('cover_fund_dbms',['Inside the','Database'],['Relational theory, SQL and the storage engine.','Follow a booking all the way to durable pages.'],[['Model the facts','tables, keys, dependencies'],['Execute the query','plans, indexes, pages'],['Commit safely','versions, locks, write-ahead log'],['Operate the system','replicas, partitions, recovery']],1); }
export function dbms_file_race() {
  const d = illustration('dbms_file_race', 'TWO BUYERS READ "FREE" FROM THE SAME FILE, AND BOTH WALK AWAY WITH SEAT A7', 330);
  d.doc(270, 60, 100, 120, { fill: C.paper }); d.mono(320, 90, 'seats.csv', { size: 10 });
  d.during([0, 0.6], (g) => g.mono(320, 130, 'A7,free', { size: 11 }), { dur: 8 });
  d.during([0.6, 1], (g) => g.mono(320, 130, 'A7,B', { size: 11, color: C.acc }), { dur: 8 });
  [['Buyer A', 70, 0.05, 0.45], ['Buyer B', 570, 0.15, 0.55]].forEach(([s, x, r, w]) => {
    d.person(x, 80, 38, { label: s });
    const dir = x < 320 ? 1 : -1;
    d.travel([[320 - dir * 50, 120], [x + dir * 30, 110]], { at: [r, r + 0.12], dur: 8, label: 'free', w: 34, fill: C.card, color: C.ink2 });
    d.travel([[x + dir * 30, 140], [320 - dir * 50, 140]], { at: [w, w + 0.12], dur: 8, label: 'mine', w: 36 });
    d.doc(x - 22, 200, 44, 56, { lines: false, fill: C.accSoft, stroke: C.acc }); d.mono(x, 228, 'A7', { size: 11 }); d.text(x, 270, 'ticket issued', { cls: 'xs' });
  });
  d.glow((g) => seat(g, 303, 220, { fill: C.accSoft, stroke: C.acc, label: 'A7' }));
  d.hand(320, 300, 'one seat, two accepted buyers', { size: 16 });
  return d.svg();
}
export function dbms_abstraction() {
const d=illustration('dbms_abstraction','THE SAME SEAT EXISTS AS A CUSTOMER VIEW, A ROW AND STORED BYTES',370);
  d.text(171,47,'customer view',{cls:'ttl'});d.text(460,47,'logical relation',{cls:'ttl'});
  for(let r=0;r<10;r++)for(let c=0;c<10;c++){const x=39+c*25,y=72+r*20,hot=r===0&&c===6;d.rect(x,y,16,12,{r:2,fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.line});d.line(x,y+15,x+16,y+15,{stroke:hot?C.acc:C.line,single:true});}
  d.text(165,283,'illustrative 100-seat show',{cls:'sm'});
  d.doc(350,75,232,123,{lines:false});d.mono(466,100,'show_seats');d.mono(466,131,'evening | A7 | free',{size:11});d.line(370,151,562,151,{stroke:C.line,single:true});d.text(466,174,'unique (show_id, seat_id)',{cls:'sm'});
  d.arrow(299,134,342,134,{stroke:C.acc});
  d.arrow(466,207,466,257,{stroke:C.acc});figShelf(d,354,265,['header','slot','tuple'],{width:225,hot:2,height:43});
  d.text(466,330,'physical page representation',{cls:'ttl'});return d.svg();
}
export function dbms_relation() {
  const d = illustration('dbms_relation', `A RELATION: NAMED COLUMNS, ONE FACT PER ROW, VALUES FROM A DOMAIN`, 320);
  d.text(170, 56, 'show_seats', { cls: 'ttl', size: 13 });
  const rowY = sheet(d, 70, 70, ['seat_id', 'show_id', 'state'], [['A7', 'evening', 'free'], ['A8', 'evening', 'held'], ['A9', 'evening', 'sold']], { cw: 80, rh: 32, hot: 0 });
  d.glow((g) => g.rect(70, 102, 240, 32, { r: 2, stroke: C.acc, sw: 1.5 }));
  d.carrow([[316, 118], [370, 112], [400, 100]], { stroke: C.acc, hl: 6 }); d.text(408, 96, 'tuple (row): one seat fact', { cls: 'sm', a: 'start', color: C.acc });
  d.carrow([[150, 66], [190, 40], [400, 46]], { stroke: C.gray, hl: 6 }); d.text(408, 46, 'attribute (column)', { cls: 'sm', a: 'start' });
  d.carrow([[270, 214], [330, 240], [400, 236]], { stroke: C.gray, hl: 6 }); d.text(408, 236, 'domain: free | held | sold', { cls: 'sm', a: 'start' });
  d.mono(190, 250, `degree ${N.relation_degree} · cardinality ${N.relation_cardinality}`, { size: 10.5 });
  d.text(190, 280, `full inventory: ${N.shows} × ${N.seats_per_show} = ${N.show_seats} rows`, { cls: 'xs' });
  return d.svg();
}
export function dbms_key_lattice() {
  const d = illustration('dbms_key_lattice', 'EVERY SUPERSET OF A KEY STILL IDENTIFIES A USER; ONLY THE MINIMAL ONES ARE CANDIDATE KEYS', 340);
  const lvl = [[['id, email, name']], [['id, email'], ['id, name'], ['email, name']], [['id'], ['email'], ['name']]];
  const pos = {}; const super_ = (s) => s.includes('id') || s.includes('email');
  lvl.forEach((L, i) => L.forEach(([s], j) => { const x = 320 + (j - (L.length - 1) / 2) * 170, y = 70 + i * 90; pos[s] = [x, y]; }));
  const edges = [['id, email, name', 'id, email'], ['id, email, name', 'id, name'], ['id, email, name', 'email, name'], ['id, email', 'id'], ['id, email', 'email'], ['id, name', 'id'], ['id, name', 'name'], ['email, name', 'email'], ['email, name', 'name']];
  edges.forEach(([a, b]) => d.line(pos[a][0], pos[a][1] + 16, pos[b][0], pos[b][1] - 16, { stroke: C.line, single: true }));
  Object.entries(pos).forEach(([s, [x, y]]) => {
    const cand = s === 'id' || s === 'email', sup = super_(s);
    const draw = (g) => g.box(x - 60, y - 16, 120, 32, `{${s}}`, { r: 16, fill: cand ? C.accSoft : sup ? C.card : C.paper, stroke: cand ? C.acc : sup ? C.ink2 : C.line, cls: 'mono', size: 10, dash: sup ? undefined : [4, 3] });
    if (cand) d.glow(draw); else draw(d);
  });
  d.text(560, 70, 'super key', { cls: 'xs' }); d.text(560, 250, 'not a key:\nnames repeat', { cls: 'xs', vc: true });
  d.text(320, 300, 'orange: candidate keys. pick id as primary; email stays an alternate key', { cls: 'sm', color: C.acc });
  d.text(320, 320, 'show seats need both: (show_id, seat_id) is a composite candidate key', { cls: 'xs' });
  return d.svg();
}
export function dbms_constraints() {
const d=illustration('dbms_constraints','A NEW BOOKING ITEM MUST REFER TO REAL RECORDS AND KEEP THE SEAT RULE',350);
  figPage(d,252,72,137,143,'new item',true);
  d.doc(32,92,149,97,{lines:false});d.text(106,115,'bookings',{cls:'ttl'});d.mono(106,153,'booking exists',{size:11});
  d.doc(459,92,149,97,{lines:false});d.text(533,115,'show_seats',{cls:'ttl'});d.mono(533,153,'seat exists',{size:11});
  d.arrow(246,134,190,134,{stroke:C.ink2});d.arrow(398,134,451,134,{stroke:C.ink2});
  d.lock(296,244,46,{fill:C.accSoft,stroke:C.acc});d.text(435,273,'unique active claim',{cls:'ttl',a:'start',size:11});
  d.arrow(320,222,320,237,{stroke:C.acc});d.text(320,329,'references and uniqueness must hold at the database write boundary',{cls:'sm'});return d.svg();
}
export function dbms_er(){
 const d=canvas('dbms_er','ENTITIES BECOME TABLES; MANY-TO-MANY BECOMES A LINK',330);
 const nodes=[[22,65,'users','id, email'],[232,65,'bookings','id, user_id'],[442,65,'shows','id, venue_id'],[232,210,'booking_items','booking_id, show_id, seat_id'],[442,210,'show_seats','show_id, seat_id']];
 nodes.forEach(([x,y,t,s],i)=>{d.box(x,y,176,60,t,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2});d.text(x+88,y+83,s,{cls:'mono',size:9.5});});
 d.arrow(200,95,230,95,{stroke:C.gray});d.text(214,75,'1:N',{cls:'xs'});
 d.arrow(320,128,320,206,{stroke:C.acc});d.text(336,169,'1:N',{cls:'xs',a:'start'});
 d.arrow(530,128,530,206,{stroke:C.gray});d.text(547,169,'1:N',{cls:'xs',a:'start'});
 d.arrow(440,240,410,240,{stroke:C.acc});d.text(426,221,'1:N',{cls:'xs'});
 return d.svg();
}
export function dbms_algebra() {
const d=illustration('dbms_algebra','SELECTION KEEPS ROWS; PROJECTION KEEPS ATTRIBUTES',340);
  const rows=[['A7','free'],['A8','held'],['A9','free']];
  d.text(132,48,'input relation',{cls:'ttl'});rows.forEach((r,i)=>figShelf(d,39,80+i*48,r,{width:188,height:33,hot:i===0?1:-1}));
  d.arrow(243,148,309,148,{stroke:C.acc});d.text(280,120,'σ free',{cls:'mono',color:C.acc});
  d.text(413,48,'selected rows',{cls:'ttl'});[rows[0],rows[2]].forEach((r,i)=>figShelf(d,335,80+i*48,r,{width:179,height:33,hot:1}));
  d.arrow(424,185,424,234,{stroke:C.ink2});d.text(440,211,'π seat_id',{cls:'mono',size:10,a:'start'});
  figShelf(d,362,242,['A7','A9'],{width:124,height:35});d.text(424,301,'projected attributes',{cls:'sm'});return d.svg();
}
export function dbms_sql_order() {
  const d = illustration('dbms_sql_order', 'YOU WRITE SELECT FIRST; THE DATABASE MEANS IT IN THIS ORDER, AND THE ROWS NARROW AS THEY GO', 360);
  const written = ['SELECT show_id, count(*)', 'FROM bookings', 'WHERE price > 50', 'GROUP BY show_id', 'HAVING count(*) > 10', 'ORDER BY 2 DESC', 'LIMIT 3'];
  const order = [4, 1, 2, 3, 3, 5, 6];
  d.rect(20, 50, 220, 170, { r: 5, fill: C.paper, stroke: C.ink2 });
  written.forEach((s, i) => { d.mono(34, 70 + i * 22, s, { a: 'start', size: 10, color: order[i] === 3 ? C.acc : undefined }); d.circle(226, 70 + i * 22, 16, { fill: order[i] === 3 ? C.accSoft : C.card, stroke: order[i] === 3 ? C.acc : C.ink2 }); d.mono(226, 71 + i * 22, String(order[i]), { size: 9 }); });
  const steps = [['FROM / JOIN', 'form rows', 300], ['WHERE', 'drop rows', 250], ['GROUP BY / HAVING', 'form, drop groups', 190], ['SELECT', 'compute columns', 150], ['ORDER BY', 'sort', 150], ['LIMIT', 'keep a slice', 90]];
  steps.forEach(([s, sub, w], i) => {
    const y = 48 + i * 46, x = 450 - w / 2, hot = i === 2;
    const draw = (g) => g.rect(x, y, w, 34, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (hot) d.glow(draw); else draw(d);
    d.text(450, y + 12, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(450, y + 26, sub, { cls: 'xs' });
    d.mono(x - 10, y + 17, String(i + 1), { a: 'end', size: 10 });
  });
  for (let k = 0; k < 4; k++) d.travel([[450 - 120 + k * 80, 52], [450, 320]], { dur: 4, at: [k * 0.1, 0.6 + k * 0.1], r: 2.6 });
  d.text(130, 250, 'logical meaning only: the planner', { cls: 'xs' }); d.text(130, 264, 'may run steps in another order', { cls: 'xs' });
  return d.svg();
}
export function dbms_aggregate() {
const d=illustration('dbms_aggregate','GROUPING GATHERS RELATED ROWS BEFORE COMPUTING EACH RESULT',325);
  [[75,'Ada',120],[148,'Ada',120],[221,'Bo',80]].forEach(([y,s,v])=>{figShelf(d,34,y,[s,v],{width:172,hot:s==='Ada'?0:-1,height:34});});
  d.carrow([[214,92],[257,92],[294,116]],{stroke:C.acc});d.carrow([[214,165],[257,165],[294,143]],{stroke:C.acc});d.arrow(214,238,294,247,{stroke:C.ink2});
  d.ellipse(365,131,130,97,{fill:C.accFaint,stroke:C.acc});d.mono(365,121,'Ada');d.mono(365,148,'120 + 120');
  d.ellipse(365,247,130,60,{fill:C.card,stroke:C.ink2});d.mono(365,247,'Bo: 80');
  d.arrow(438,131,482,131,{stroke:C.acc});d.mono(549,122,'SUM 240');d.mono(549,147,'COUNT 2');
  d.arrow(438,247,482,247,{stroke:C.ink2});d.mono(549,238,'SUM 80');d.mono(549,263,'COUNT 1');
  d.text(320,306,'illustrative total: 120 + 120 + 80 = 320',{cls:'sm'});return d.svg();
}
export function dbms_join_rows() {
  const d = illustration('dbms_join_rows', 'LEFT JOIN KEEPS EVERY USER; CY HAS NO BOOKING, SO THE RIGHT SIDE IS NULL', 330);
  const uy = sheet(d, 30, 60, ['user'], [['Ada'], ['Bo'], ['Cy']], { cw: 70, title: 'users' });
  const by = sheet(d, 170, 60, ['booking', 'user', 'price'], [['b_a', 'Ada', '120'], ['b_b', 'Ada', '120'], ['b_c', 'Bo', '80']], { cw: 56, title: 'bookings' });
  [[0, 0], [0, 1], [1, 2]].forEach(([u, b]) => d.curve([[100, uy(u)], [135, (uy(u) + by(b)) / 2], [170, by(b)]], { stroke: C.ink2, single: true }));
  d.glow((g) => g.circle(65, uy(2), 46, { stroke: C.acc, sw: 1.4 }));
  d.arrow(350, 110, 390, 110, { stroke: C.ink2 });
  const rows = N.sql_left_join.map((r) => r.map((v) => v == null ? null : String(v)));
  sheet(d, 400, 60, ['user', 'booking', 'price'], rows, { cw: 70, hot: 3, title: 'users LEFT JOIN bookings' });
  d.travel([[100, uy(2)], [400, 200]], { dur: 4, r: 3.5 });
  d.hand(320, 280, 'Ada appears twice, Bo once, Cy once with NULLs', { size: 15 });
  return d.svg();
}
export function dbms_null_logic() {
  const d = illustration('dbms_null_logic', 'SQL HAS THREE TRUTH VALUES; WHERE LETS ONLY TRUE THROUGH THE GATE', 340);
  const ex = [['3 = 1', 'FALSE', 0], ['3 = NULL', 'UNKNOWN', 1], ['3 NOT IN (1, NULL)', 'UNKNOWN', 1], ['NOT EXISTS (match)', 'TRUE', 2]];
  ex.forEach(([e, v, k], i) => {
    const y = 60 + i * 52, hot = i === 2;
    d.box(30, y, 190, 36, e, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 10.5 });
    d.arrow(226, y + 18, 270, y + 18, { stroke: C.gray, hl: 6 });
    d.box(276, y + 2, 90, 32, v, { r: 16, fill: k === 2 ? C.card : C.paper, stroke: k === 1 ? C.acc : C.ink2, cls: 'mono', size: 10, dash: k === 1 ? [4, 3] : undefined });
  });
  d.line(430, 50, 430, 120, { stroke: C.ink2, sw: 3, single: true }); d.line(430, 180, 430, 280, { stroke: C.ink2, sw: 3, single: true });
  d.glow((g) => g.line(430, 122, 430, 178, { stroke: C.acc, sw: 1.2, single: true, dash: [3, 3] }));
  d.text(430, 300, 'WHERE', { cls: 'mono', size: 11 });
  d.carrow([[370, 236], [410, 236], [470, 150], [560, 150]], { stroke: C.ink2, hl: 6 }); d.text(560, 170, 'row kept', { cls: 'sm', a: 'end' });
  [[0, 'dropped'], [1, 'dropped'], [2, 'dropped']].forEach(([i]) => d.line(370, 78 + i * 52, 420, 78 + i * 52 + (i - 1) * 6, { stroke: C.line, single: true, dash: [3, 3] }));
  d.text(520, 80, 'FALSE and UNKNOWN', { cls: 'sm' }); d.text(520, 98, 'both stay outside', { cls: 'sm' });
  d.travel([[370, 236], [410, 236], [470, 150], [560, 150]], { dur: 3, r: 3.5 });
  return d.svg();
}
export function dbms_recursive(){
 const d=canvas('dbms_recursive','RECURSION EXPANDS A FRONTIER AND RETAINS EARLIER ROWS',340);
 d.box(20,60,170,44,'anchor rows',{fill:C.card});
 d.box(230,60,170,44,'working frontier',{fill:C.card});
 d.box(440,60,170,44,'expand children',{fill:C.accSoft,stroke:C.acc});
 d.arrow(194,82,226,82,{stroke:C.gray}); d.arrow(404,82,436,82,{stroke:C.acc});
 d.text(420,47,'nonempty',{cls:'xs'});
 d.box(440,170,170,44,'new frontier',{fill:C.card});d.arrow(525,108,525,166,{stroke:C.acc});
 d.carrow([[436,192],[362,181],[315,108]],{stroke:C.acc});d.text(348,149,'next round',{cls:'sm'});
 d.box(230,264,170,44,'accumulated rows',{fill:C.card});
 d.arrow(260,108,260,260,{stroke:C.gray});d.text(244,220,'append',{cls:'xs',a:'end'});
 d.box(20,264,170,44,'return result',{fill:C.accFaint,stroke:C.acc});
 d.carrow([[226,93],[130,161],[105,260]],{stroke:C.line});d.text(124,202,'empty',{cls:'sm'});
 return d.svg();
}
export function dbms_window_ranks() {
  const d = illustration('dbms_window_ranks', 'TIES AT 90: ROW_NUMBER BREAKS THEM, RANK SKIPS 2, DENSE_RANK DOES NOT', 330);
  N.sql_rank_rows.forEach(([sal, rn, rk, dr], i) => {
    const x = 150 + i * 110, h = sal * 1.6, hot = i === 2;
    const draw = (g) => g.rect(x, 210 - h, 70, h, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (hot) d.glow(draw); else draw(d);
    d.mono(x + 35, 196 - h, String(sal), { size: 12 });
    [rn, rk, dr].forEach((v, k) => chip(d, x + 18, 226 + k * 30, 34, String(v), hot && k > 0, 22));
  });
  ['ROW_NUMBER', 'RANK', 'DENSE_RANK'].forEach((s, k) => d.mono(130, 237 + k * 30, s, { a: 'end', size: 10 }));
  d.text(130, 120, 'salary', { cls: 'xs', a: 'end' });
  d.hand(520, 70, 'second distinct salary: 70', { size: 15 });
  return d.svg();
}
export function dbms_fd() {
  const d = illustration('dbms_fd', 'A → B MEANS: WHEREVER TWO ROWS AGREE ON A, THEY MUST AGREE ON B', 330);
  const rows = [['a1', 'b1'], ['a2', 'b2'], ['a1', 'b1'], ['a3', 'b2']];
  const y = sheet(d, 60, 60, ['A', 'B'], rows, { cw: 60, rh: 30, title: 'legal instance' });
  d.glow((g) => { g.carrow([[56, y(0)], [30, (y(0) + y(2)) / 2], [56, y(2)]], { stroke: C.acc, sw: 1.4, hl: 6 }); g.carrow([[184, y(0)], [210, (y(0) + y(2)) / 2], [184, y(2)]], { stroke: C.acc, sw: 1.4, hl: 6 }); });
  d.text(240, 125, 'same A, same B', { cls: 'sm', a: 'start', color: C.acc });
  const y2 = sheet(d, 360, 60, ['A', 'B'], [['a1', 'b1'], ['a1', 'b9']], { cw: 60, rh: 30, title: 'counterexample' });
  d.line(356, y2(1) - 12, 484, y2(1) + 12, { stroke: C.ink2, sw: 1.6, single: true }); d.line(356, y2(1) + 12, 484, y2(1) - 12, { stroke: C.ink2, sw: 1.6, single: true });
  d.text(500, 108, 'one row like this\nrefutes A → B', { cls: 'sm', a: 'start', vc: true });
  [['trivial', 'AB → A'], ['non-trivial', 'A → B'], ['completely non-trivial', 'A → C, A ∩ C = ∅']].forEach(([s, e], i) => { d.text(60 + i * 190, 250, s, { cls: 'ttl', a: 'start', size: 11 }); d.mono(60 + i * 190, 272, e, { a: 'start', size: 10.5 }); });
  d.text(320, 306, 'a sample can only disprove a rule; the rule itself comes from the domain', { cls: 'xs' });
  return d.svg();
}
export function dbms_closure() {
  const d = illustration('dbms_closure', `CLOSURE OF {A}: FIRE EVERY DEPENDENCY WHOSE LEFT SIDE IS KNOWN UNTIL NOTHING NEW APPEARS: ${N.closure_A}`, 330);
  const sets = [['{A}', 'start', 50], ['{A,B}', 'A → B', 80], ['{A,B,C}', 'B → C', 110], ['{A,B,C,D}', 'AC → D', 140]];
  sets.forEach(([s, fd, r], i) => {
    const cx = 180, cy = 190, hot = i === 3;
    const draw = (g) => g.ellipse(cx + i * 30, cy - i * 6, r * 2.2, r * 1.6, { stroke: hot ? C.acc : C.ink2, sw: hot ? 1.6 : 1, fill: i === 0 ? C.card : undefined });
    if (hot) d.glow(draw); else draw(d);
  });
  ['A', 'B', 'C', 'D'].forEach((s, i) => { d.during([i * 0.2, 1], (g) => g.mono(140 + i * 52, 190 - i * 8, s, { size: 16, color: i === 3 ? C.acc : undefined }), { dur: 6 }); });
  sets.forEach(([s, fd], i) => { d.mono(470, 90 + i * 46, fd, { a: 'start', size: 11, color: i === 3 ? C.acc : undefined }); d.mono(560, 90 + i * 46, s, { a: 'start', size: 11 }); d.during([i * 0.2, 1], (g) => g.dot(458, 90 + i * 46, 3.5, i === 3 ? C.acc : C.ink), { dur: 6 }); });
  d.text(530, 60, 'fired', { cls: 'xs' });
  d.hand(470, 290, '{A} reaches every attribute: A is a key', { size: 14 });
  return d.svg();
}
export function dbms_cover() {
  const d = illustration('dbms_cover', 'CANONICAL COVER: SPLIT, DROP EXTRANEOUS ATTRIBUTES, DROP IMPLIED RULES', 330);
  const stages = [['split right sides', ['A → B', 'A → C', 'B → C', 'AB → D'], []], ['B is extraneous in AB → D', ['A → B', 'A → C', 'B → C', 'A → D'], [3]], ['A → C follows from A → B, B → C', ['A → B', 'A → C', 'B → C', 'A → D'], [1]]];
  stages.forEach(([s, fds, mark], k) => {
    const x = 26 + k * 202, hot = k === 2;
    d.doc(x, 60, 180, 190, { lines: false, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 90, 46, s, { cls: 'xs' });
    fds.forEach((f, i) => {
      const y = 96 + i * 36;
      d.mono(x + 90, y, f, { size: 13, color: mark.includes(i) ? C.acc : undefined });
      if (k === 2 && i === 1) d.glow((g) => g.line(x + 50, y, x + 130, y, { stroke: C.acc, sw: 1.8, single: true }));
    });
    if (k === 1) d.glow((g) => g.circle(x + 72, 204, 24, { stroke: C.acc, sw: 1.2 }));
    if (k < 2) d.arrow(x + 184, 150, x + 200, 150, { stroke: C.gray, hl: 6 });
  });
  d.mono(520, 282, 'A → B;  B → C;  A → D', { size: 12, color: C.acc });
  d.text(320, 312, 'each removal needs a proof from the remaining rules, not a hunch', { cls: 'xs' });
  return d.svg();
}
export function dbms_anomalies() {
  const d = illustration('dbms_anomalies', 'STORE THE VENUE IN EVERY BOOKING ROW AND THREE THINGS BREAK', 360);
  const y = sheet(d, 30, 60, ['booking', 'show', 'venue'], [['b1', 'Hamlet', 'Hall 1'], ['b2', 'Hamlet', 'Hall 1'], ['b3', 'Hamlet', 'Hall 2'], ['b4', 'Lear', 'Hall 3']], { cw: 80, rh: 28 });
  d.glow((g) => g.rect(190, y(2) - 14, 80, 28, { r: 2, stroke: C.acc, sw: 1.5 }));
  d.text(290, y(2), 'update: one row missed', { cls: 'sm', a: 'start', color: C.acc });
  d.rect(30, 220, 240, 28, { r: 2, stroke: C.gray, dash: [4, 3] }); d.mono(150, 234, '?    Macbeth   Hall 4', { size: 10, color: C.gray });
  d.text(290, 234, 'insert: no booking yet, no row', { cls: 'sm', a: 'start' });
  d.line(30, y(3), 270, y(3), { stroke: C.ink2, sw: 1.4, single: true });
  d.text(290, y(3), 'delete b4: Lear\'s venue is gone', { cls: 'sm', a: 'start' });
  d.arrow(320, 284, 320, 300, { stroke: C.gray, hl: 6 });
  sheet(d, 80, 306, ['booking', 'show'], [], { cw: 70, rh: 24 }); sheet(d, 330, 306, ['show', 'venue'], [], { cw: 70, rh: 24 });
  d.text(480, 318, 'repair: venue stored once per show', { cls: 'sm', a: 'start' });
  return d.svg();
}
export function dbms_partial() {
const d=illustration('dbms_partial','A REPEATED STUDENT NAME MOVES TO ITS OWN KEYED RELATION',370);
  d.text(170,45,'Enrollment, before',{cls:'ttl'});
  [['S','C','name'],['Ada','DB','Ada'],['Ada','OS','Ada'],['Bo','OS','Bo']].forEach((r,i)=>figShelf(d,34,72+i*47,r,{width:271,height:32,hot:i?2:-1}));
  d.arrow(318,157,370,157,{stroke:C.acc});
  d.text(493,45,'Student',{cls:'ttl'});[['S','name'],['Ada','Ada'],['Bo','Bo']].forEach((r,i)=>figShelf(d,397,72+i*41,r,{width:192,height:29,hot:i?1:-1}));
  d.text(493,221,'Enrollment, after',{cls:'ttl'});[['S','C'],['Ada','DB'],['Ada','OS'],['Bo','OS']].forEach((r,i)=>figShelf(d,397,245+i*27,r,{width:192,height:23}));
  d.hand(160,295,'S decides name,\nwithout needing course C',{size:18,vc:true});return d.svg();
}
export function dbms_bcnf() {
  const d = illustration('dbms_bcnf', 'STUDENT, COURSE, INSTRUCTOR: 3NF HOLDS, BCNF FAILS BECAUSE INSTRUCTOR → COURSE', 330);
  const P = { student: [140, 180], course: [320, 90], instructor: [500, 180] };
  Object.entries(P).forEach(([s, [x, y]]) => d.box(x - 60, y - 20, 120, 40, s, { r: 20, fill: C.card, cls: 'ttl' }));
  d.carrow([[170, 156], [250, 120], [290, 108]], { stroke: C.ink2 }); d.carrow([[200, 186], [320, 200], [436, 184]], { stroke: C.ink2 });
  d.text(320, 220, '(student, course) → instructor', { cls: 'mono', size: 10.5 });
  d.glow((g) => g.carrow([[470, 156], [420, 110], [384, 98]], { stroke: C.acc, sw: 1.8 }));
  d.text(470, 112, 'instructor → course', { cls: 'mono', size: 10.5, a: 'start', color: C.acc });
  d.text(320, 262, 'keys: (student, course) and (student, instructor)', { cls: 'sm' });
  d.text(320, 282, '3NF: course is part of a key, so the rule is tolerated', { cls: 'sm' });
  d.text(320, 302, 'BCNF: instructor alone is not a super key, so it is a violation', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function dbms_fourth() {
  const d = illustration('dbms_fourth', 'TWO INDEPENDENT LISTS IN ONE TABLE BECOME A CROSS PRODUCT: 2 × 2 = 4 ROWS', 320);
  d.person(90, 110, 40, { label: 'Ada' });
  d.ellipse(90, 220, 150, 60, { stroke: C.ink2 }); d.mono(60, 220, 'English', { size: 10 }); d.mono(125, 220, 'Hindi', { size: 10 }); d.text(90, 262, 'languages', { cls: 'xs' });
  d.ellipse(230, 120, 140, 60, { stroke: C.ink2 }); d.mono(200, 120, 'chess', { size: 10 }); d.mono(262, 120, 'cycling', { size: 10 }); d.text(230, 162, 'hobbies', { cls: 'xs' });
  const y = sheet(d, 330, 70, ['student', 'language', 'hobby'], [['Ada', 'English', 'chess'], ['Ada', 'English', 'cycling'], ['Ada', 'Hindi', 'chess'], ['Ada', 'Hindi', 'cycling']], { cw: 90, rh: 28, hot: 0 });
  d.glow((g) => g.rect(326, 94, 278, 120, { r: 4, stroke: C.acc, sw: 1.2 }));
  d.text(465, 240, `${N.norm_cross_product} rows to say 2 + 2 facts; add a hobby and 2 rows appear`, { cls: 'sm' });
  d.text(465, 262, '4NF: split into (student, language) and (student, hobby)', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function dbms_lossless() {
  const d = illustration('dbms_lossless', 'SPLIT R(A,B,C) ON A; IF A → B, THE JOIN GIVES BACK EXACTLY THE ORIGINAL ROWS', 320);
  d.box(250, 46, 140, 40, 'R(A, B, C)', { fill: C.card, cls: 'mono', size: 12 });
  d.path('M300,100 L290,120 M300,100 L310,120', { stroke: C.ink2, single: true });
  d.circle(286, 126, 10, { stroke: C.ink2 }); d.circle(314, 126, 10, { stroke: C.ink2 });
  d.arrow(260, 92, 160, 150, { stroke: C.ink2 }); d.arrow(380, 92, 480, 150, { stroke: C.ink2 });
  d.glow((g) => g.box(80, 156, 160, 44, 'R₁(A, B)', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 12 }));
  d.text(160, 218, 'A → B: each A has one B', { cls: 'sm', color: C.acc });
  d.box(400, 156, 160, 44, 'R₂(A, C)', { fill: C.card, cls: 'mono', size: 12 });
  d.carrow([[160, 232], [320, 290], [480, 232]], { stroke: C.ink2, both: true }); d.text(320, 276, 'join on A', { cls: 'mono', size: 10 });
  d.text(320, 304, 'shared columns must form a key of at least one side', { cls: 'xs' });
  d.travel([[320, 86], [160, 156]], { dur: 4, at: [0, 0.4], r: 3 }); d.travel([[160, 232], [320, 290]], { dur: 4, at: [0.5, 0.9], r: 3 });
  return d.svg();
}
export function dbms_denorm() {
  const d = illustration('dbms_denorm', `A CACHED TOTAL IS A PROMISE: ${N.prices.slice(0, 2).join(' + ')} = ${N.ada_total} MUST STAY TRUE EVERY TIME AN ITEM CHANGES`, 330);
  const y = sheet(d, 40, 70, ['item', 'price'], [['seat A7', '120'], ['seat A8', '120']], { cw: 80, rh: 28, title: 'booking_items (source of truth)' });
  d.arrow(210, 100, 280, 100, { stroke: C.ink2 }); d.mono(245, 88, 'sum', { size: 10 });
  d.glow((g) => g.rect(290, 64, 150, 90, { r: 4, fill: C.accSoft, stroke: C.acc }));
  d.text(365, 84, 'bookings.total', { cls: 'mono', size: 10.5 }); d.mono(365, 118, String(N.ada_total), { size: 22, color: C.acc });
  d.text(365, 140, 'cached copy', { cls: 'xs' });
  d.carrow([[440, 150], [520, 220], [440, 270], [240, 270], [130, 160]], { stroke: C.gray, dash: [4, 4] });
  d.text(510, 250, 'nightly reconcile:', { cls: 'sm', a: 'start' }); d.text(510, 268, 'recompute, compare, repair', { cls: 'sm', a: 'start' });
  d.travel([[440, 150], [520, 220], [440, 270], [240, 270], [130, 160]], { dur: 6, r: 3.5 });
  d.hand(320, 312, 'faster reads, plus an update obligation', { size: 15 });
  return d.svg();
}
export function dbms_storage_path() {
const d=illustration('dbms_storage_path','THE EXECUTOR REQUESTS PAGES THROUGH THE BUFFER MANAGER',360);
  d.doc(37,65,151,107,{lines:false});d.mono(112,97,'SELECT ...');d.mono(112,133,'WHERE seat = A7',{size:10});
  d.gear(270,114,38);d.text(269,172,'planner + executor',{cls:'sm'});d.arrow(195,114,222,114,{stroke:C.ink2});
  d.ram(407,80,184,57,{chips:4,chip:i=>i===1?C.accSoft:C.paper});d.text(499,161,'buffer pool in RAM',{cls:'ttl'});d.arrow(317,114,399,114,{stroke:C.acc});
  [0,1,2].forEach(i=>figPage(d,410+i*65,208,52,71,`P${i}`,i===1));d.disk(271,245,81,{label:'persistent page file'});
  d.arrow(397,246,320,246,{stroke:C.acc,both:true});d.text(356,227,'miss / flush',{cls:'sm',size:10});d.arrow(499,183,499,200,{stroke:C.line});
  d.text(320,330,'a buffered page is a working copy of persistent storage',{cls:'sm'});return d.svg();
}
export function dbms_slotted_page(){
 const d=canvas('dbms_slotted_page','ILLUSTRATIVE SLOTTED PAGE: 4,096 BYTES',350);
 d.rect(160,48,300,270,{fill:C.paper,stroke:C.ink2});
 const bands=[[48,38,'header: 64 bytes',C.card],[86,52,'31 slots × 4 bytes',C.card],[138,94,'free: 64 bytes',C.accFaint],[232,86,'31 records × 124 bytes',C.card]];
 bands.forEach(([y,h,t,f])=>{d.rect(160,y,300,h,{fill:f,stroke:C.line,r:0});d.text(310,y+h/2,t,{cls:'mono',size:11});});
 d.arrow(100,100,100,150,{stroke:C.gray});d.text(88,122,'slots grow',{cls:'xs',a:'end'});
 d.arrow(520,282,520,224,{stroke:C.gray});d.text(535,258,'records grow',{cls:'xs',a:'start'});
 d.carrow([[450,112],[487,159],[449,270]],{stroke:C.acc,hl:7});
 d.text(310,338,'schematic heights; byte sizes are exact',{cls:'sm'});
 return d.svg();
}
export function dbms_bplus_tree(){
 const d=canvas('dbms_bplus_tree','ILLUSTRATIVE PACKED INDEX: ROOT AND FOUR LEAVES',305);
 d.box(233,50,174,40,'root: separators',{fill:C.card});
 const labels=['252 entries','252 entries','252 entries','44 entries'];
 labels.forEach((s,i)=>{const x=18+i*157;d.arrow(250+i*45,92,x+65,167,{stroke:i===2?C.acc:C.line});d.box(x,170,132,50,s,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});if(i<3)d.arrow(x+135,195,x+153,195,{stroke:C.gray,hl:5});});
 d.arrow(397,222,397,257,{stroke:C.acc});d.box(320,260,154,28,'matching heap page',{fill:C.accFaint,stroke:C.acc,size:11});
 d.text(96,265,'linked leaves\nserve ranges',{cls:'sm',vc:true});
 return d.svg();
}
export function dbms_leaf_split(){
 const d=canvas('dbms_leaf_split','ILLUSTRATIVE LEAF CAPACITY: FOUR KEYS',285);
 d.chips(122,55,['10','20','30','40'],{width:92,h:36});
 d.text(320,115,'insert 25; the leaf overflows',{cls:'ttl'});
 d.arrow(320,130,320,163,{stroke:C.acc});
 d.chips(36,184,['10','20'],{width:80,h:36});d.chips(306,184,['25','30','40'],{width:80,h:36,fill:C.accSoft,stroke:C.acc});
 d.arrow(210,202,302,202,{stroke:C.acc});d.text(250,238,'leaf link',{cls:'xs'});
 d.text(116,251,'left leaf',{cls:'sm'});d.text(434,251,'right leaf; parent gains separator 25',{cls:'sm'});
 return d.svg();
}
export function dbms_index_layout() {
const d=illustration('dbms_index_layout','AN INDEX ENTRY CAN POINT TO A ROW ON A DIFFERENT HEAP PAGE',350);
  d.text(148,48,'index leaf, sorted by key',{cls:'ttl'});
  ['A7','A8','A9','B1'].forEach((s,i)=>figShelf(d,37,80+i*49,[s,'locator'],{width:208,height:32,hot:i===0?0:-1}));
  d.text(476,48,'heap pages, physical order',{cls:'ttl'});
  [['B1','A9'],['A7','C4'],['A8','B6']].forEach((r,i)=>{figPage(d,378+i%2*126,83+Math.floor(i/2)*139,106,115,'',i===1);r.forEach((s,j)=>d.mono(431+i%2*126,116+Math.floor(i/2)*139+j*31,s,{size:12}));});
  [[0,557,132],[1,431,271],[2,431,146],[3,431,115]].forEach(([i,x,y])=>d.carrow([[252,96+i*49],[312,96+i*49],[x-52,y]],{stroke:i===1?C.acc:C.line,hl:5}));
  d.text(320,330,'key order and row placement are separate choices',{cls:'sm'});return d.svg();
}
export function dbms_composite() {
  const d = illustration('dbms_composite', 'AN INDEX ON (a, b, c) IS SORTED LIKE A PHONE BOOK: FIX a, THEN b NARROWS INSIDE IT', 330);
  const rows = [['east', '1', 'A7'], ['east', '1', 'A8'], ['east', '2', 'A7'], ['west', '1', 'A7'], ['west', '2', 'A7']];
  const y = sheet(d, 60, 60, ['a', 'b', 'c'], rows, { cw: 70, rh: 30 });
  d.rect(56, 86, 218, 98, { r: 4, stroke: C.ink2, sw: 1.2 }); d.text(290, 135, 'a = east: one range', { cls: 'sm', a: 'start' });
  d.glow((g) => g.rect(52, 88, 226, 62, { r: 4, stroke: C.acc, sw: 1.5 }));
  d.text(290, 105, 'a = east AND b = 1: smaller range', { cls: 'sm', a: 'start', color: C.acc });
  [0, 1, 3].forEach((i) => d.dot(165, y(i), 4, C.slate));
  d.text(290, 210, 'b = 1 alone: rows 1, 2 and 4, scattered', { cls: 'sm', a: 'start' }); d.text(290, 228, 'across every a group; the order does not help', { cls: 'sm', a: 'start' });
  d.travel([[40, 86], [40, 150]], { dur: 3, r: 3.5 });
  return d.svg();
}
export function dbms_index_only(){
 const d=canvas('dbms_index_only','COVERAGE SUPPLIES DATA; VISIBILITY CHOOSES THE ROUTE',350);
 d.box(22,62,170,44,'index entry + payload',{fill:C.card});
 d.box(238,62,180,44,'page all-visible?',{fill:C.accSoft,stroke:C.acc});
 d.arrow(196,84,234,84,{stroke:C.gray});
 d.box(454,62,166,44,'return from index',{fill:C.accFaint,stroke:C.acc});d.arrow(422,84,450,84,{stroke:C.acc});d.text(436,48,'yes',{cls:'xs'});
 d.box(238,182,180,44,'fetch heap version',{fill:C.card});d.arrow(328,110,328,178,{stroke:C.gray});d.text(346,145,'no',{cls:'sm',a:'start'});
 d.box(454,182,166,44,'check visibility',{fill:C.card});d.arrow(422,204,450,204,{stroke:C.gray});
 d.box(454,280,166,44,'return or discard',{fill:C.card});d.arrow(537,230,537,276,{stroke:C.gray});
 return d.svg();
}
export function dbms_executor() {
const d=illustration('dbms_executor','ROWS FLOW THROUGH A PHYSICAL OPERATOR TREE',355);
  d.db(57,220,117,87,{under:'base pages'});
  const ops=[[100,153,'scan'],[283,94,'filter'],[469,40,'project']];
  ops.forEach(([x,y,s],i)=>{d.path(`M${x},${y} L${x+125},${y} L${x+94},${y+48} L${x+32},${y+48} Z`,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2,single:true});d.text(x+63,y+19,s,{cls:'mono'});});
  d.arrow(117,211,161,207,{stroke:C.line});d.carrow([[231,178],[282,166],[341,149]],{stroke:C.acc});d.carrow([[414,120],[470,108],[528,93]],{stroke:C.ink2});
  [[254,168],[437,108],[577,125]].forEach(([x,y],i)=>{figPage(d,x,y,27,37,i<2?'row':'out',i===0);});
  d.text(320,323,'the plan chooses operators; operators produce tuples',{cls:'sm'});return d.svg();
}
export function dbms_join_algorithms() {
  const d = illustration('dbms_join_algorithms', `THREE WAYS TO MATCH ROWS: ${N.join_comparisons.toLocaleString('en-US')} PAIR TESTS IN NESTED LOOPS, ${N.hash_visits} ROW VISITS IN A HASH JOIN`, 340);
  panel(d, 18, 40, 196, 270, 'nested loop', false);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) d.dot(60 + j * 26, 90 + i * 26, 3, C.gray);
  d.lines([[46, 90], [174, 90], [46, 116], [174, 116]], { stroke: C.ink2, single: true, sw: 0.8 });
  d.mono(116, 250, `${N.join_comparisons.toLocaleString('en-US')} tests`, { size: 11 }); d.text(116, 272, 'every outer row × every inner row', { cls: 'xs' });
  panel(d, 222, 40, 196, 270, 'hash join', true);
  for (let b = 0; b < 4; b++) { d.rect(244 + b * 40, 120, 34, 70, { r: 3, fill: C.paper, stroke: C.acc }); d.mono(261 + b * 40, 206, `h${b}`, { size: 9 }); for (let k = 0; k <= b % 3; k++) d.fillRect(248 + b * 40, 176 - k * 14, 26, 10, C.acc, 0.45, 2); }
  d.text(320, 90, 'build: hash the smaller side', { cls: 'xs' }); d.text(320, 106, 'probe: each other row checks one bucket', { cls: 'xs' });
  d.glow((g) => g.mono(320, 250, `${N.hash_visits} row visits`, { size: 11, color: C.acc })); d.text(320, 272, 'equality joins only', { cls: 'xs' });
  d.travel([[250, 70], [301, 140]], { dur: 2, r: 3.5 });
  panel(d, 426, 40, 196, 270, 'sort-merge', false);
  d.tape(450, 100, ['1', '3', '3', '7', '9'], { cw: 28, h: 24 }); d.tape(450, 160, ['3', '4', '7', '8', '9'], { cw: 28, h: 24 });
  d.shift(84, 0, (g) => { g.arrow(464, 84, 464, 98, { stroke: C.ink2, hl: 5 }); g.arrow(464, 200, 464, 186, { stroke: C.ink2, hl: 5 }); }, { at: [0, 0.8], dur: 5 });
  d.text(524, 250, 'two pointers advance', { cls: 'sm' }); d.text(524, 272, 'inputs must be sorted', { cls: 'xs' });
  d.text(320, 326, 'tests and visits are different units: compare mechanisms, not a speedup', { cls: 'xs' });
  return d.svg();
}
export function dbms_estimation() {
  const d = illustration('dbms_estimation', `THE PLANNER GUESSED ${N.estimated_rows} ROWS; ${N.actual_rows} CAME BACK, ${N.estimate_error} TIMES MORE`, 320);
  d.mono(60, 64, `input ${N.show_seats} rows`, { a: 'start', size: 11 });
  d.rect(60, 76, 520, 22, { r: 3, fill: C.card, stroke: C.ink2 });
  const sc = 520 / N.show_seats;
  d.rect(60, 150, N.estimated_rows * sc, 22, { r: 2, fill: C.paper, stroke: C.ink2 }); d.mono(60 + N.estimated_rows * sc + 10, 161, `estimated ${N.show_seats} × 0.02 = ${N.estimated_rows}`, { a: 'start', size: 10.5 });
  d.glow((g) => g.rect(60, 200, N.actual_rows * sc, 22, { r: 2, fill: C.accSoft, stroke: C.acc }));
  d.mono(60 + N.actual_rows * sc + 10, 211, `actual ${N.actual_rows}`, { a: 'start', size: 10.5, color: C.acc });
  d.path(`M${60 + N.estimated_rows * sc},${176} L${60 + N.actual_rows * sc},${196}`, { stroke: C.acc, single: true, dash: [3, 3] });
  d.text(320, 258, `${N.actual_rows} ÷ ${N.estimated_rows} = ${N.estimate_error}: a plan picked for 16 rows now handles 80`, { cls: 'mono', size: 10.5 });
  d.text(320, 290, 'illustrative calculation, not real engine output', { cls: 'xs' });
  return d.svg();
}
export function dbms_plan_diagnosis() {
  const d = illustration('dbms_plan_diagnosis', 'TUNING IS A LOOP: MEASURE, FIND ONE CAUSE, CHANGE ONE THING, MEASURE AGAIN', 360);
  const cx = 320, cy = 190, R = 120;
  d.circle(cx, cy, R * 2, { stroke: C.line });
  const st = ['reproduce query', 'EXPLAIN ANALYZE', 'estimates vs actual', 'waits and I/O', 'change one cause', 'measure again'];
  st.forEach((s, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, hot = i === 2;
    const draw = (g) => g.box(x - 66, y - 16, 132, 32, s, { r: 16, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, cls: 'mono', size: 10 });
    if (hot) d.glow(draw); else draw(d);
  });
  d.spin(cx, cy, (g) => g.dot(cx, cy - R, 4.5, C.acc), { dur: 8 });
  d.mono(cx, cy - 10, 'Hash Join', { size: 10 }); d.mono(cx, cy + 8, 'rows=16 actual=80', { size: 10, color: C.acc });
  return d.svg();
}
export function dbms_acid() {
  const d = illustration('dbms_acid', 'MOVE 20 FROM ACCOUNT X TO Y: FOUR SEPARATE PROMISES GUARD THE TRANSFER', 340);
  d.db(80, 110, 90, 90, { label: 'X' }); d.db(470, 110, 90, 90, { label: 'Y' });
  d.during([0, 0.5], (g) => { g.mono(125, 220, '100', { size: 13 }); g.mono(515, 220, '120', { size: 13 }); }, { dur: 6 });
  d.during([0.5, 1], (g) => { g.mono(125, 220, '80', { size: 13 }); g.mono(515, 220, '140', { size: 13 }); }, { dur: 6 });
  d.glow((g) => g.rect(196, 120, 248, 70, { r: 8, stroke: C.acc, sw: 1.6 }));
  d.mono(320, 144, 'X = X − 20;  Y = Y + 20;', { size: 10.5 }); d.text(320, 170, 'atomicity: both or neither', { cls: 'sm', color: C.acc });
  d.travel([[176, 155], [464, 155]], { at: [0.1, 0.5], dur: 6, label: '20', w: 26 });
  [['consistency', 'total stays 220', 70, 268], ['isolation', 'others never see 80 + 120', 320, 268], ['durability', 'after COMMIT, survives a crash', 570, 268]].forEach(([s, sub, x, y]) => { d.text(x, y, s, { cls: 'ttl', size: 11 }); d.text(x, y + 18, sub, { cls: 'xs' }); });
  d.text(320, 66, 'atomicity', { cls: 'ttl', color: C.acc });
  return d.svg();
}
export function dbms_lost_update() {
const d=illustration('dbms_lost_update','PRIVATE COMPUTATIONS CAN OVERWRITE ONE ANOTHER AT THE SHARED ROW',350);
  [60,453].forEach((x,i)=>{d.cpu(x,56,65,{label:i?'B':'A'});d.mono(x+32,150,'read 10',{size:12});d.mono(x+32,181,'10 + 1 = 11',{size:11});});
  figPage(d,252,210,137,95,'row = 11',true);
  d.arrow(100,194,244,241,{stroke:C.acc});d.arrow(482,194,397,241,{stroke:C.ink2});
  d.mono(320,63,'initial shared row = 10',{size:14});
  d.text(320,322,`expected ${10 + 1 + 1}; both writes store 11`,{cls:'sm'});return d.svg();
}
export function dbms_write_skew() {
  const d = illustration('dbms_write_skew', 'TWO DOCTORS, ONE RULE "SOMEONE STAYS ON CALL": EACH SNAPSHOT SAYS IT IS SAFE TO LEAVE', 340);
  d.rect(220, 50, 200, 110, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(320, 68, 'on-call board', { cls: 'ttl', size: 11 });
  d.during([0, 0.6], (g) => { g.mono(320, 100, 'A: on   B: on', { size: 12 }); }, { dur: 8 });
  d.during([0.6, 1], (g) => { g.glow((h) => h.mono(320, 100, 'A: off  B: off', { size: 12, color: C.acc })); g.text(320, 130, 'nobody on call', { cls: 'sm', color: C.acc }); }, { dur: 8 });
  [['Doctor A', 80, 'A = off'], ['Doctor B', 560, 'B = off']].forEach(([s, x, w]) => {
    d.person(x, 70, 36, { label: s });
    d.rect(x - 70, 160, 140, 110, { r: 5, fill: C.card, stroke: C.line }); d.text(x, 176, 'snapshot', { cls: 'xs' });
    d.mono(x, 200, 'A on, B on', { size: 10 }); d.mono(x, 224, '2 on call ≥ 2', { size: 10 }); d.mono(x, 248, w, { size: 10, color: C.acc });
  });
  d.travel([[150, 230], [240, 110]], { at: [0.35, 0.55], dur: 8, label: 'A=off', w: 42 });
  d.travel([[490, 230], [400, 110]], { at: [0.4, 0.6], dur: 8, label: 'B=off', w: 42 });
  d.text(320, 300, 'different rows, no write conflict, both commit: only SERIALIZABLE catches it', { cls: 'sm' });
  return d.svg();
}
export function dbms_isolation() {
  const d = illustration('dbms_isolation', 'EACH ISOLATION LEVEL CLOSES ONE MORE DOOR TO INTERFERENCE', 340);
  const lv = ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'];
  const an = ['dirty read', 'non-repeatable read', 'phantom (varies)', 'write skew'];
  lv.forEach((s, i) => {
    const x = 40 + i * 140, y = 250 - i * 50, hot = i === 3;
    const draw = (g) => g.rect(x, y, 130, 290 - y, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (hot) d.glow(draw); else draw(d);
    d.text(x + 65, y + 16, s, { cls: 'ttl', size: 10.5, color: hot ? C.acc : undefined });
    an.forEach((a, k) => { const blocked = k < i || (i === 3); const yy = y + 36 + k * 15; if (yy < 286) { d.mono(x + 10, yy, (blocked ? '✕ ' : '· ') + a, { a: 'start', size: 8.5, color: blocked ? C.ink : C.gray }); } });
  });
  d.text(140, 76, 'stronger contract: more waiting,', { cls: 'sm' }); d.text(140, 94, 'more aborts, or more versions', { cls: 'sm' });
  d.text(320, 316, '✕ prevented by the standard definition; engines differ in the details', { cls: 'xs' });
  return d.svg();
}
export function dbms_serial_graph(){
 const d=canvas('dbms_serial_graph','PRECEDENCE EDGES COME FROM CONFLICTING OPERATIONS',260);
 d.circle(170,135,85,{fill:C.card});d.text(170,135,'T₁',{cls:'ttl',size:17});
 d.circle(470,135,85,{fill:C.card});d.text(470,135,'T₂',{cls:'ttl',size:17});
 d.carrow([[210,111],[320,69],[430,111]],{stroke:C.acc});d.text(320,54,'W₁(X) before R₂(X)',{cls:'mono',size:11});
 d.carrow([[430,159],[320,201],[210,159]],{stroke:C.acc});d.text(320,222,'W₂(Y) before R₁(Y)',{cls:'mono',size:11});
 d.text(320,137,'cycle: not\nconflict serializable',{cls:'sm',vc:true});
 return d.svg();
}
export function dbms_recovery_order() {
  const d = illustration('dbms_recovery_order', 'STRICT ⊂ CASCADELESS ⊂ RECOVERABLE: EACH RING ADDS ONE RULE ABOUT DIRTY DATA', 330);
  [['all schedules', 290, 230, C.paper, C.line, ''], ['recoverable', 230, 180, C.card, C.ink2, 'a reader commits after its writer'], ['cascadeless', 160, 130, C.card, C.ink2, 'read only committed data'], ['strict', 90, 80, C.accSoft, C.acc, 'no read or overwrite of uncommitted data']].forEach(([s, w, h, f, st, rule], i) => {
    const draw = (g) => g.ellipse(220, 180, w * 1.4, h, { fill: f, stroke: st, sw: i === 3 ? 1.6 : 1 });
    if (i === 3) d.glow(draw); else draw(d);
    d.text(220, 180 - h / 2 + 16, s, { cls: 'ttl', size: 11, color: i === 3 ? C.acc : undefined });
    if (rule) { d.line(220 + w * 0.6, 180 - h / 2 + 16, 460, 80 + i * 50, { stroke: C.line, single: true }); d.text(466, 80 + i * 50, rule, { cls: 'sm', a: 'start' }); }
  });
  return d.svg();
}
export function dbms_lock_compatibility() {
  const d = illustration('dbms_lock_compatibility', 'SHARED LOCKS SHARE; AN EXCLUSIVE LOCK WAITS FOR EVERYONE AND MAKES EVERYONE WAIT', 330);
  d.text(160, 60, 'held ↓  requested →', { cls: 'xs' });
  ['S', 'X'].forEach((s, i) => { d.text(260 + i * 160, 64, s, { cls: 'ttl' }); d.text(150, 120 + i * 100, s, { cls: 'ttl' }); });
  [[0, 0, true], [0, 1, false], [1, 0, false], [1, 1, false]].forEach(([r, c, ok]) => {
    const x = 190 + c * 160, y = 80 + r * 100, hot = r === 1;
    d.rect(x, y, 140, 86, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 });
    if (ok) { d.person(x + 46, y + 16, 28); d.person(x + 94, y + 16, 28); d.doc(x + 60, y + 30, 20, 26, { lines: false }); d.text(x + 70, y + 74, 'both read', { cls: 'xs' }); }
    else { d.person(x + 46, y + 16, 28); d.clock(x + 98, y + 34, 30, { spin: 3 }); d.text(x + 70, y + 74, 'requester waits', { cls: 'xs' }); }
  });
  d.glow((g) => g.lock(80, 200, 30, { stroke: C.acc, fill: C.accSoft }));
  d.text(320, 300, 'real engines add update, intention and key-range modes', { cls: 'xs' });
  return d.svg();
}
export function dbms_intention() {
  const d = illustration('dbms_intention', 'TO LOCK ONE ROW X, FIRST HANG IX ON THE TABLE AND PAGE ABOVE IT', 340);
  d.box(260, 50, 120, 40, 'table  IX', { fill: C.card, cls: 'mono', size: 11 });
  [[100, 'page 1'], [320, 'page 2  IX'], [540, 'page 3']].forEach(([x, s], i) => { d.line(320, 90, x, 140, { stroke: i === 1 ? C.ink : C.line, single: true, sw: i === 1 ? 1.6 : 1 }); d.box(x - 60, 140, 120, 36, s, { fill: C.card, cls: 'mono', size: 10.5, stroke: i === 1 ? C.ink : C.line }); });
  [250, 320, 390].forEach((x, i) => { d.line(320, 176, x, 230, { stroke: i === 1 ? C.ink : C.line, single: true }); const draw = (g) => g.box(x - 30, 230, 60, 34, i === 1 ? 'row X' : 'row', { fill: i === 1 ? C.accSoft : C.paper, stroke: i === 1 ? C.acc : C.line, cls: 'mono', size: 10 }); if (i === 1) d.glow(draw); else draw(d); });
  d.travel([[320, 70], [320, 158], [320, 246]], { dur: 4, r: 3.5 });
  d.text(520, 240, 'other rows stay writable:', { cls: 'sm' }); d.text(520, 258, 'IX does not block IX', { cls: 'sm' });
  d.text(140, 240, 'a table-level S request', { cls: 'sm' }); d.text(140, 258, 'sees IX and waits', { cls: 'sm' });
  d.text(320, 310, 'the announcements let a coarse lock check conflicts without scanning every row', { cls: 'xs' });
  return d.svg();
}
export function dbms_two_phase() {
  const d = illustration('dbms_two_phase', 'TWO-PHASE LOCKING: LOCKS ONLY GROW, THEN ONLY SHRINK; THE PEAK IS THE LOCK POINT', 320);
  const M = d.axes(70, 60, 480, 180, { xmin: 0, xmax: 10, ymin: 0, ymax: 4.5, xl: 'time', yl: 'locks held' });
  const pts = [[0, 0], [1, 1], [2.5, 2], [4, 3], [5, 4], [6, 3], [7.5, 2], [9, 0]];
  d.lines(pts.map(([x, y]) => [M.X(x), M.Y(y)]), { stroke: C.ink2, sw: 1.8, single: true });
  d.lines([[5, 4], [8.5, 4], [8.5, 0]].map(([x, y]) => [M.X(x), M.Y(y)]), { stroke: C.slate, sw: 1.2, single: true, dash: [5, 4] });
  d.text(M.X(8.6), M.Y(4) - 12, 'strict 2PL: release at commit', { cls: 'xs', color: C.slate });
  d.beacon(M.X(5), M.Y(4));
  d.text(M.X(5), M.Y(4) - 22, 'lock point', { cls: 'sm', color: C.acc });
  d.text(M.X(2.2), M.Y(3), 'growing', { cls: 'sm' }); d.text(M.X(7.2), M.Y(3.3), 'shrinking', { cls: 'sm' });
  d.text(320, 296, 'not two-phase commit: 2PL is about locks inside one transaction', { cls: 'xs' });
  return d.svg();
}
export function dbms_deadlock(){
 const d=canvas('dbms_deadlock','WAIT-FOR EDGES POINT AT THE BLOCKING TRANSACTION',280);
 d.box(40,90,185,68,'T₁ holds A\nwants B',{fill:C.card});d.box(415,90,185,68,'T₂ holds B\nwants A',{fill:C.card});
 d.carrow([[227,106],[320,55],[413,106]],{stroke:C.acc});d.text(320,39,'T₁ waits for T₂',{cls:'mono',size:11});
 d.carrow([[413,146],[320,210],[227,146]],{stroke:C.acc});d.text(320,235,'T₂ waits for T₁',{cls:'mono',size:11});
 return d.svg();
}
export function dbms_mvcc() {
const d=illustration('dbms_mvcc','SNAPSHOTS SELECT DIFFERENT VERSIONS OF THE SAME LOGICAL ROW',330);
  const vs=[['old version','free'],['new version','held']];
  vs.forEach(([s,v],i)=>{figPage(d,241+i*178,95,133,139,'',i===1);d.text(307+i*178,116,s,{cls:'ttl'});d.mono(307+i*178,151,'seat A7');d.mono(307+i*178,183,v);});
  d.person(81,75,36);d.text(83,130,'old snapshot',{cls:'sm'});d.arrow(115,103,233,137,{stroke:C.ink2});
  d.person(81,211,36,{stroke:C.acc});d.text(83,270,'after commit',{cls:'sm'});d.carrow([[115,234],[355,284],[477,241]],{stroke:C.acc});
  d.arrow(382,159,408,159,{stroke:C.line,both:true});d.text(485,270,'committed update',{cls:'sm',color:C.acc});
  d.text(320,310,'visibility follows the snapshot, not a single current flag',{cls:'sm'});return d.svg();
}
export function dbms_optimistic() {
  const d = illustration('dbms_optimistic', `OPTIMISTIC UPDATE: BOTH READ VERSION ${N.old_version}; THE FIRST TO WRITE MAKES IT ${N.new_version}, THE OTHER MATCHES 0 ROWS`, 340);
  d.db(270, 56, 100, 90, { label: 'seat A7' });
  d.during([0, 0.5], (g) => g.mono(320, 164, `version ${N.old_version}`, { size: 11 }), { dur: 8 });
  d.during([0.5, 1], (g) => g.glow((h) => h.mono(320, 164, `version ${N.new_version}`, { size: 11, color: C.acc })), { dur: 8 });
  [['Ada', 80, 'UPDATE … WHERE version = 7', '1 row: wins', 0.35, true], ['Bo', 560, 'UPDATE … WHERE version = 7', '0 rows: retry fresh', 0.55, false]].forEach(([s, x, q, res, t, win]) => {
    d.person(x, 70, 34, { label: s });
    d.mono(x, 210, q, { size: 9 }); d.text(x, 232, res, { cls: 'sm', color: win ? C.acc : undefined });
    const dir = x < 320 ? 1 : -1;
    d.travel([[x + dir * 30, 120], [320 - dir * 54, 110]], { at: [t, t + 0.12], dur: 8, label: 'v7?', w: 32, fill: win ? C.accSoft : C.card, color: win ? C.acc : C.ink2 });
  });
  d.text(320, 280, 'the check and the write are one statement; a separate SELECT first would race', { cls: 'sm' });
  return d.svg();
}
export function dbms_join_comparison() {
  const J = N.join_outputs;
  const d = illustration('dbms_join_comparison', 'L HOLDS KEYS a, b; R HOLDS a, c: WHAT EACH JOIN KEEPS', 380);
  const kinds = [['INNER', 'mid'], ['LEFT', 'left+mid'], ['RIGHT', 'mid+right'], ['FULL', 'all'], ['SEMI', 'mid-l'], ['ANTI', 'left'], ['CROSS', 'x']];
  kinds.forEach(([s, sh], i) => {
    const x = 50 + (i % 4) * 150, y = 90 + Math.floor(i / 4) * 150, hot = s === 'FULL';
    if (sh === 'left' || sh === 'left+mid' || sh === 'all') d.circle(x + 30, y, 60, { fill: hot ? C.accSoft : C.card, stroke: C.ink2 });
    if (sh === 'mid+right' || sh === 'all') d.circle(x + 66, y, 60, { fill: hot ? C.accSoft : C.card, stroke: C.ink2 });
    if (sh === 'left') d.ellipse(x + 48, y, 22, 44, { fill: C.paper });
    if (sh.startsWith('mid') || sh === 'left+mid' || sh === 'mid+right' || sh === 'all') d.ellipse(x + 48, y, 22, 44, { fill: hot ? C.acc : C.gray, fop: 0.4 });
    if (sh === 'x') { d.rect(x + 8, y - 30, 80, 60, { r: 3, fill: C.card, stroke: C.ink2, fs: 'cross-hatch', gap: 7 }); }
    else { d.circle(x + 30, y, 60, { stroke: C.ink2 }); d.circle(x + 66, y, 60, { stroke: C.ink2 }); }
    if (hot) d.glow((g) => g.circle(x + 48, y, 100, { stroke: C.acc, sw: 1.2 }));
    d.text(x + 48, y - 46, s, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined });
    const out = J[s.toLowerCase()].map((r) => Array.isArray(r) ? '(' + r.slice(-2).map((v) => v ?? 'NULL').join(',') + ')' : r);
    out.forEach((o, k) => d.mono(x + 48, y + 44 + k * 13, o, { size: 8.5 }));
  });
  d.text(510, 260, 'L: b_a (key a), b_b (key b)', { cls: 'xs' }); d.text(510, 274, 'R: r_a (key a), r_c (key c)', { cls: 'xs' });
  return d.svg();
}
export function dbms_lossy_rows() {
  const d = illustration('dbms_lossy_rows', 'SPLIT ON A NON-KEY COLUMN AND THE JOIN INVENTS TWO ROWS THAT NEVER EXISTED', 330);
  sheet(d, 30, 70, ['A', 'B', 'C'], N.lossy_original, { cw: 44, title: 'original' });
  d.arrow(170, 110, 200, 90, { stroke: C.gray, hl: 6 }); d.arrow(170, 120, 200, 160, { stroke: C.gray, hl: 6 });
  sheet(d, 210, 50, ['A', 'B'], N.lossy_ab, { cw: 44 }); sheet(d, 210, 140, ['A', 'C'], N.lossy_ac, { cw: 44 });
  d.arrow(310, 125, 350, 125, { stroke: C.ink2 }); d.mono(330, 112, '⋈ A', { size: 10 });
  const orig = N.lossy_original.map((r) => r.join());
  const y = sheet(d, 370, 70, ['A', 'B', 'C'], N.lossy_join, { cw: 50 });
  N.lossy_join.forEach((r, i) => { if (!orig.includes(r.join())) { d.glow((g) => g.rect(368, y(i) - 12, 154, 24, { r: 3, stroke: C.acc, sw: 1.4, dash: [4, 3] })); d.text(532, y(i), 'invented', { cls: 'xs', a: 'start', color: C.acc }); } });
  d.hand(320, 270, 'a alone does not say which b went with which c', { size: 15 });
  return d.svg();
}
export function dbms_leaf_delete() {
  const d = illustration('dbms_leaf_delete', 'B+ TREE DELETE: AN UNDERFULL LEAF BORROWS FROM ITS SIBLING, OR THE TWO MERGE', 350);
  const leaf = (x, y, keys, hot) => { d.rect(x, y, 4 * 30, 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); for (let i = 1; i < 4; i++) d.line(x + i * 30, y, x + i * 30, y + 28, { stroke: C.line, single: true }); keys.forEach((k, i) => d.mono(x + 15 + i * 30, y + 14, String(k), { size: 10.5 })); };
  const stage = (x, title, sep, L, R, hotL) => { d.text(x + 130, 50, title, { cls: 'ttl', size: 11 }); d.box(x + 100, 66, 60, 28, String(sep), { fill: C.paper, cls: 'mono', size: 11 }); d.line(x + 110, 94, x + 60, 120, { stroke: C.ink2, single: true }); if (R) d.line(x + 150, 94, x + 200, 120, { stroke: C.ink2, single: true }); leaf(x, 120, L, hotL); if (R) leaf(x + 140, 120, R, false); };
  stage(20, 'underfull: left has 1 key', 25, N.borrow_before[0], N.borrow_before[1], true);
  stage(330, 'borrow 25, separator → 30', 30, N.borrow_after[0], N.borrow_after[1], false);
  d.glow((g) => g.rect(426, 62, 68, 36, { r: 4, stroke: C.acc, sw: 1.4 }));
  d.travel([[180, 134], [100, 134]], { dur: 3, label: '25', w: 26 });
  d.line(20, 190, 620, 190, { stroke: C.faint, single: true });
  d.text(170, 216, 'later delete 25 and 40', { cls: 'sm' });
  leaf(40, 236, [10], false); leaf(190, 236, [30], false);
  d.arrow(330, 250, 380, 250, { stroke: C.ink2 });
  leaf(400, 236, N.merge_after, true); d.text(460, 284, 'merge: parent loses one child pointer', { cls: 'sm' });
  d.text(320, 320, 'min 2, max 4 keys per leaf (illustrative)', { cls: 'xs' });
  return d.svg();
}
export function dbms_window_frames() {
  const W = N.sql_window_rows;
  const d = illustration('dbms_window_frames', 'RUNNING SUM: ROWS ADDS ONE ROW AT A TIME; RANGE ADDS ALL PRICE TIES TOGETHER', 330);
  [['ROWS', 1, 80], ['RANGE', 2, 360]].forEach(([s, col, x0]) => {
    d.text(x0 + 100, 52, s, { cls: 'ttl', color: col === 1 ? C.acc : undefined });
    W.forEach((r, i) => {
      const x = x0 + i * 70, h = r[col] * 0.6, hot = col === 1;
      const draw = (g) => g.rect(x, 270 - h, 50, h, { r: 3, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
      if (hot && i === 0) d.glow(draw); else draw(d);
      d.mono(x + 25, 258 - h, String(r[col]), { size: 11 }); d.mono(x + 25, 286, String(r[0]), { size: 10, color: C.gray });
    });
  });
  d.text(320, 312, 'bottom: each row\'s price. the two 120s are peers, so RANGE counts both at once', { cls: 'xs' });
  return d.svg();
}
export function dbms_wal() {
const d=illustration('dbms_wal','THE RECOVERY RECORD MUST REACH STORAGE BEFORE ITS DEPENDENT PAGE',350);
  d.ram(40,79,183,53,{chips:4,chip:i=>i===2?C.accSoft:C.paper});d.text(130,165,'dirty page in RAM',{cls:'ttl'});
  d.doc(287,66,282,95,{lines:false});d.mono(428,90,'write-ahead log');figShelf(d,302,109,['change','change','COMMIT'],{width:251,height:30,hot:2});
  d.arrow(230,105,280,105,{stroke:C.acc});
  d.disk(433,265,97,{label:'durable log'});d.arrow(433,170,433,210,{stroke:C.acc});d.text(450,191,'flush required record',{cls:'sm',a:'start',size:10});
  d.disk(127,265,97,{label:'data page, later'});d.arrow(127,180,127,209,{stroke:C.line,dash:[4,4]});
  d.text(288,262,'log first',{cls:'hand',size:21});return d.svg();
}
export function dbms_crash_cases() {
  const d = illustration('dbms_crash_cases', 'WHERE THE CRASH LANDS DECIDES WHAT RECOVERY MUST DO', 330);
  d.arrow(40, 120, 610, 120, { stroke: C.ink2 });
  [['update in RAM', 110], ['log record durable', 250], ['COMMIT durable', 390], ['data page written', 530]].forEach(([s, x]) => { d.line(x, 112, x, 128, { stroke: C.ink2, single: true }); d.text(x, 100, s, { cls: 'xs' }); });
  const cases = [[180, 'work vanishes;\nnever acknowledged'], [320, 'log exists, no commit:\nundo, never expose'], [460, 'committed, page old:\nREDO from the log'], [590, 'page already new:\nskip, do not apply twice']];
  cases.forEach(([x, s], i) => {
    const hot = i === 2;
    const bolt = (g) => g.path(`M${x},140 L${x - 8},160 L${x + 2},162 L${x - 6},184`, { stroke: hot ? C.acc : C.ink2, sw: 1.8, single: true });
    if (hot) d.glow(bolt); else bolt(d);
    d.text(x - 4, 214, s, { cls: 'sm', vc: true, color: hot ? C.acc : undefined });
  });
  d.travel([[40, 120], [610, 120]], { dur: 6, r: 3.5, color: C.ink2 });
  d.hand(320, 290, 'the log is what makes cases 2, 3 and 4 tell apart', { size: 15 });
  return d.svg();
}
export function dbms_aries() {
  const [x0, y0] = N.recovery_start, [x1, y1] = N.recovery_redo, [x2, y2] = N.recovery_final;
  const d = illustration('dbms_aries', `ARIES-STYLE RECOVERY: REDO EVERYTHING LOGGED, THEN UNDO THE LOSERS. X = ${x2}, Y = ${y2}`, 340);
  const log = ['T1 begin', `X ${x0}→${x1}`, 'T2 begin', `Y ${y0}→${y1}`, 'T1 commit', 'crash'];
  log.forEach((s, i) => chip(d, 30 + i * 98, 60, 90, s, i === 3, 26));
  d.path('M530,92 L522,108 L532,110 L524,126', { stroke: C.ink2, sw: 1.6, single: true });
  d.arrow(40, 130, 520, 130, { stroke: C.ink2 }); d.text(280, 146, 'redo: repeat history forward', { cls: 'sm' });
  d.glow((g) => g.arrow(370, 166, 330, 166, { stroke: C.acc, sw: 1.6 })); d.text(420, 172, 'undo T2 backward', { cls: 'sm', a: 'start', color: C.acc });
  [['durable pages', x0, y0], ['after redo', x1, y1], ['after undo', x2, y2]].forEach(([s, X, Y], i) => {
    const x = 70 + i * 190, hot = i === 2;
    d.rect(x, 200, 150, 80, { r: 5, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 }); d.text(x + 75, 216, s, { cls: 'xs' });
    d.mono(x + 40, 250, `X ${X}`, { size: 13 }); d.mono(x + 110, 250, `Y ${Y}`, { size: 13, color: hot ? C.acc : undefined });
    if (i < 2) d.arrow(x + 154, 240, x + 186, 240, { stroke: C.gray, hl: 6 });
  });
  d.travel([[40, 130], [520, 130]], { at: [0, 0.6], dur: 6, r: 3.5, color: C.ink2 }); d.travel([[370, 166], [330, 166]], { at: [0.65, 0.9], dur: 6, r: 3.5 });
  d.text(320, 310, 'T1 committed and stays; T2 never committed and is rolled back', { cls: 'xs' });
  return d.svg();
}
export function dbms_buffer() {
const d=illustration('dbms_buffer','THE BUFFER POOL REUSES RESIDENT PAGES AND FLUSHES DIRTY ONES',345);
  d.ram(42,57,555,48,{chips:8,chip:i=>i===2?C.accSoft:C.paper});
  const states=['clean','clean','dirty','pinned','free','clean'];
  states.forEach((s,i)=>{figPage(d,45+i*94,141,76,105,`P${i}`,s==='dirty');d.text(83+i*94,264,s,{cls:'sm',color:s==='dirty'?C.acc:C.ink2});});
  d.disk(279,312,40);d.arrow(271,274,271,286,{stroke:C.acc});d.text(338,311,'dirty eviction needs safe writeback',{cls:'sm',a:'start'});return d.svg();
}
export function dbms_lsm() {
const d=illustration('dbms_lsm','SORTED RUNS ACCUMULATE ON DISK, THEN MERGE THROUGH COMPACTION',365);
  d.ram(52,63,211,48,{chips:5,chip:i=>i===2?C.accSoft:C.paper});d.text(158,135,'mutable memtable',{cls:'ttl'});
  figShelf(d,362,65,['WAL','append'],{width:210,height:40,hot:1});d.arrow(270,88,354,88,{stroke:C.acc});
  d.arrow(158,152,158,189,{stroke:C.ink2});d.text(195,174,'flush',{cls:'sm'});
  [['A','B','C'],['B','D','E'],['A','F','G']].forEach((r,i)=>figShelf(d,42+i*201,199,r,{width:180,height:36,hot:i===1?0:-1}));
  [130,332,534].forEach(x=>d.arrow(x,245,320,285,{stroke:C.line,hl:5}));
  figShelf(d,103,292,['A','B','C','D','E','F','G'],{width:434,height:35,hot:1});d.text(320,348,'compaction merges keys and keeps the permitted newest state',{cls:'sm'});return d.svg();
}
export function dbms_amplification() {
  const d = illustration('dbms_amplification', `${N.page_bytes.toLocaleString('en-US')} LOGICAL BYTES BECOME ${N.wa_total_bytes.toLocaleString('en-US')} PHYSICAL BYTES: WRITE AMPLIFICATION ${N.wa}`, 330);
  const unit = 4096, s = 12;
  d.text(110, 56, 'you changed', { cls: 'xs' });
  d.glow((g) => g.rect(90, 70, 40, 40, { r: 3, fill: C.accSoft, stroke: C.acc }));
  d.mono(110, 126, '4,096', { size: 10.5, color: C.acc });
  const parts = [['WAL', N.wa_wal_bytes], ['flush', N.wa_flush_bytes], ['compaction', N.wa_compaction_bytes]];
  let col = 0;
  parts.forEach(([nm, b], k) => {
    const n = b / unit;
    for (let i = 0; i < n; i++) { const x = 230 + col * 50; d.rect(x, 70, 40, 40, { r: 3, fill: C.card, stroke: C.ink2 }); col++; }
    const x0 = 230 + (col - n) * 50;
    d.brace(x0, x0 + n * 50 - 10, 124, { label: `${nm} ${b.toLocaleString('en-US')}` });
  });
  d.travel([[130, 90], [230, 90]], { dur: 3, r: 3.5 });
  d.text(320, 200, `${N.wa_wal_bytes.toLocaleString('en-US')} + ${N.wa_flush_bytes.toLocaleString('en-US')} + ${N.wa_compaction_bytes.toLocaleString('en-US')} = ${N.wa_total_bytes.toLocaleString('en-US')}`, { cls: 'mono', size: 11 });
  d.text(320, 226, `${N.wa_total_bytes.toLocaleString('en-US')} ÷ ${N.page_bytes.toLocaleString('en-US')} = ${N.wa}`, { cls: 'mono', size: 12, color: C.acc });
  d.text(320, 270, 'illustrative accounted batch, not a measured engine', { cls: 'xs' });
  return d.svg();
}
export function dbms_bloom(){
 const d=canvas('dbms_bloom','ILLUSTRATIVE BLOOM BITS: NEGATIVES ARE DECISIVE',300);
 N.bloom_bits.forEach((v,i)=>{const x=30+i*73;d.box(x,65,64,46,String(v),{fill:v?C.accSoft:C.card,stroke:v?C.acc:C.line,cls:'mono'});d.mono(x+32,130,i,{size:11});});
 d.text(320,178,'query hashes to 1 and 6: both set -> possibly present',{cls:'mono',size:11});
 d.text(320,219,'query hashes to 0 and 6: zero bit -> definitely absent',{cls:'mono',size:11});
 d.hand(320,270,'a set bit remembers collisions too',{size:17});return d.svg();
}
export function dbms_replicas(){
 const d=canvas('dbms_replicas','A PRIMARY ORDERS WRITES; REPLICAS FOLLOW ITS HISTORY',300);
 d.box(42,115,180,56,'primary',{fill:C.accSoft,stroke:C.acc});
 [[420,55,'replica A'],[420,195,'replica B']].forEach(([x,y,s])=>{d.box(x,y,180,56,s,{fill:C.card});d.arrow(228,143,x-4,y+28,{stroke:C.gray});});
 d.text(320,267,'commit acknowledgement depends on the chosen wait policy',{cls:'sm'});return d.svg();
}
export function dbms_shards() {
const d=illustration('dbms_shards','EQUAL ROW COUNTS AND A HOT-SHARD DISTRIBUTION HAVE DIFFERENT SHAPES',400);
  const dotRows=10;
  [N.partition_counts,N.hot_shard_counts].forEach((counts,k)=>{
    const y=k?228:78;d.text(32,y-30,k?'skewed workload':'equal distribution',{cls:'ttl',a:'start'});
    counts.forEach((count,i)=>{const x=59+i*149;
      for(let j=0;j<count/dotRows;j++)d.dot(x+j%5*14,y+Math.floor(j/5)*10,3,k&&i===0?C.acc:C.ink2);
      d.mono(x+28,y-14,`P${i}: ${count}`,{size:11,color:k&&i===0?C.acc:C.ink});
    });
  });
  d.text(319,162,`total ${N.partition_counts.reduce((a,b)=>a+b,0)} rows`,{cls:'sm'});
  d.text(320,380,'each dot represents 10 rows; both distributions total 800 rows',{cls:'sm'});return d.svg();
}
export function dbms_two_phase_commit(){
 const d=canvas('dbms_two_phase_commit','TWO-PHASE COMMIT: VOTES THEN ONE DURABLE DECISION',350);
 d.text(92,50,'coordinator',{cls:'ttl'});d.text(350,50,'DB A',{cls:'ttl'});d.text(560,50,'DB B',{cls:'ttl'});
 [92,350,560].forEach(x=>d.line(x,70,x,300,{stroke:C.line,single:true}));
 d.arrow(96,90,346,110,{stroke:C.acc});d.text(221,86,'prepare',{cls:'mono',size:11});
 d.arrow(96,126,556,146,{stroke:C.acc});d.text(390,125,'prepare',{cls:'mono',size:11});
 d.arrow(346,172,96,192,{stroke:C.gray});d.text(220,167,'durable YES',{cls:'mono',size:11});
 d.arrow(556,202,96,222,{stroke:C.gray});d.text(425,197,'durable YES',{cls:'mono',size:11});
 d.box(20,235,144,34,'log COMMIT',{fill:C.accSoft,stroke:C.acc,size:11});
 d.arrow(166,252,346,279,{stroke:C.acc});d.arrow(166,259,556,300,{stroke:C.acc});
 d.text(320,332,'after YES, a participant cannot guess an outcome alone',{cls:'sm'});return d.svg();
}
export function dbms_outbox() {
  const d = illustration('dbms_outbox', 'THE OUTBOX: THE SEAT CHANGE AND THE EVENT COMMIT TOGETHER; DELIVERY HAPPENS LATER, MAYBE TWICE', 340);
  d.glow((g) => g.rect(30, 50, 250, 150, { r: 8, stroke: C.acc, sw: 1.6, dash: [6, 4] }));
  d.text(155, 68, 'one local transaction', { cls: 'sm', color: C.acc });
  d.db(50, 84, 80, 80, { label: 'seats' }); d.db(170, 84, 80, 80, { label: 'outbox' });
  d.mono(90, 184, 'A7 = held', { size: 9.5 }); d.mono(210, 184, 'evt 91', { size: 9.5 });
  d.box(110, 212, 90, 28, 'COMMIT', { fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 10.5 });
  d.server(320, 90, 50, 70, { label: 'publisher' }); d.arrow(254, 124, 316, 124, { stroke: C.ink2 });
  d.rect(410, 104, 90, 40, { r: 20, fill: C.paper, stroke: C.ink2 }); d.text(455, 160, 'broker', { cls: 'xs' });
  d.arrow(374, 124, 406, 124, { stroke: C.ink2 }); d.arrow(504, 124, 536, 124, { stroke: C.ink2 });
  d.server(540, 90, 50, 70, { label: 'consumer' });
  d.rect(520, 200, 100, 60, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(570, 214, 'seen ids', { cls: 'xs' }); d.mono(570, 236, '89 90 91', { size: 10 });
  d.travel([[254, 124], [536, 124]], { dur: 4, at: [0, 0.5], label: '91', w: 26 });
  d.travel([[254, 124], [536, 124]], { dur: 4, at: [0.5, 1], label: '91', w: 26, fill: C.card, color: C.ink2 });
  d.text(400, 290, 'publisher crashed after sending: 91 arrives twice, the consumer skips it', { cls: 'sm' });
  return d.svg();
}
export function dbms_quorum() {
  const d = illustration('dbms_quorum', `N = ${N.replicas}, W = ${N.W}, R = ${N.R}: ANY WRITE SET AND READ SET SHARE AT LEAST ${N.quorum_overlap} REPLICA`, 320);
  const X = [170, 320, 470];
  ['A', 'B', 'C'].forEach((s, i) => d.server(X[i] - 25, 120, 50, 80, { label: `replica ${s}`, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2, led: () => i === 1 }));
  d.ellipse(245, 160, 260, 150, { stroke: C.ink2, dash: [6, 4] }); d.text(150, 76, 'write set {A, B}', { cls: 'sm' });
  d.ellipse(395, 160, 260, 150, { stroke: C.slate, dash: [2, 4] }); d.text(500, 76, 'read set {B, C}', { cls: 'sm', color: C.slate });
  d.beacon(320, 108);
  d.mono(320, 262, `R + W − N = ${N.R} + ${N.W} − ${N.replicas} = ${N.quorum_overlap}`, { size: 11, color: C.acc });
  d.text(320, 290, 'overlap guarantees the read sees the write; versions pick the newest value', { cls: 'xs' });
  return d.svg();
}

import { C, fig, beMap, beCover, card, say, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Connections and pools', 'Queries from code', 'Inside an ORM', 'Transactions in code', 'Concurrency control', 'Schema migrations', 'Zero-downtime migrations', 'Scaling database access', 'The order write end to end'];
export const where_be_db = (stage = 99) => beMap('where_be_db', PARTS, stage);
export const cover_be_db = () => beCover('cover_be_db', 'VI', ['Database access', 'from services'], 'Pools, ORMs, transactions, locks and migrations', (d, y) => {
  [0, 1, 2].forEach((i) => d.server(50, y + 30 + i * 95, 80, 70, { label: `app ${i + 1}`, led: (k) => k === i }));
  d.db(400, y + 50, 170, 220, { bands: [0.3, 0.55, 0.8] });
  [0, 1, 2].forEach((i) => hose(d, 134, y + 65 + i * 95, 396, y + 110 + i * 50, { hot: i === 1 }));
  d.lock(470, y + 150, 26, { stroke: C.acc, fill: C.accSoft });
  d.hand(470, y + 300, 'ten pipes, ten thousand requests', { size: 18 });
}, [['Pools', 'connections, sizing, exhaustion'], ['ORMs', 'hydration and N+1'], ['Transactions', 'isolation, locks, retries'], ['Migrations', 'expand, backfill, contract']]);

export function be_db_wire() {
  const d = fig('be_db_wire', 'ONE QUERY IS A SHORT CONVERSATION OVER A SOCKET', 300);
  card(d, 20, 60, 190, ['db.query(', '  "SELECT * FROM orders', '   WHERE id = $1",', '  [123])'], { size: 9.5, hot: [3] });
  d.gear(250, 100, 22, { spin: 8 }); d.text(250, 136, 'driver', { cls: 'sm' });
  hose(d, 280, 100, 470, 100, { th: 9 });
  d.db(490, 50, 120, 110, { label: 'backend\nprocess', size: 10 });
  ['Parse', 'Bind', 'Execute', 'Sync'].forEach((s, i) => d.travel([[290, 100], [462, 100]], { label: s, at: [i * 0.1, i * 0.1 + 0.3], w: 56 }));
  ['RowDescription', 'DataRow', 'CommandComplete', 'ReadyForQuery'].forEach((s, i) => d.travel([[462, 100], [290, 100]], { label: s, at: [0.5 + i * 0.1, 0.5 + i * 0.1 + 0.25], w: 104, fill: C.card, color: C.ink2 }));
  d.text(375, 72, 'TCP + TLS socket', { cls: 'xs' });
  d.text(375, 190, 'messages out: Parse, Bind, Execute, Sync', { cls: 'sm' });
  d.text(375, 210, 'messages back: column names, rows, done, ready', { cls: 'sm' });
  d.text(320, 270, 'the PostgreSQL wire protocol: the SQL text and the value 123 travel in separate messages', { cls: 'xs' });
  return d.svg();
}

export function be_db_dsn() {
  const d = fig('be_db_dsn', 'A CONNECTION STRING, TAKEN APART', 280);
  const cw = 7.2, x0 = 60;
  const lay = (y, parts) => { let x = x0; return parts.map(([s, lab, hot, up]) => { const w = s.length * cw; d.mono(x, y, s, { a: 'start', size: 12, color: hot ? C.acc : undefined }); const r = [x, x + w, lab, up, hot, y]; x += w; return r; }); };
  const a = lay(100, [['postgres://', 'driver', false, true], ['wren_app', 'user', false, false], [':', '', false], ['$PW', 'from the secret store', true, true], ['@', '', false], ['db.internal', 'host', false, false], [':', ''], ['5432', 'port', false, true], ['/', ''], ['wren', 'database', false, false]]);
  const b = lay(200, [['?sslmode=verify-full', 'encrypt and check the certificate', true, true], ['&application_name=orders', 'shows up in pg_stat_activity', false, false]]);
  for (const [x1, x2, lab, up, hot, y] of [...a, ...b]) {
    if (!lab) continue;
    d.brace(x1 + 1, x2 - 1, up ? y - 13 : y + 13, { dir: up ? -1 : 1, label: lab, cls: 'xs', color: hot ? C.acc : undefined });
  }
  d.text(320, 262, 'never commit the password; inject it at start-up and rotate it without a code change', { cls: 'xs' });
  return d.svg();
}

export function be_db_conn_cost() {
  const d = fig('be_db_conn_cost', 'OPENING A CONNECTION COSTS MORE THAN THE QUERY (ILLUSTRATIVE TIMINGS)', 270);
  const y = lanes(d, ['new connection', 'from the pool'], { y: 80, gap: 80, x0: 130, x1: 600, tl: 'ms' });
  const X = (ms) => 130 + ms * 50;
  [['TCP', 0, 0.5], ['TLS', 0.5, 1], ['auth', 1, 2], ['fork + warm up', 2, 5]].forEach(([s, a, b], i) => seg(d, X(a), y(0), X(b) - X(a), s, { size: 8.5, fill: i === 3 ? C.card : C.paper }));
  seg(d, X(5), y(0), X(9) - X(5), 'query 4 ms', { hot: true });
  seg(d, X(0), y(1), 6, '', { fill: C.ink2 }); d.text(X(0) + 12, y(1) - 18, 'borrow 0.05 ms', { cls: 'xs', a: 'start' });
  seg(d, X(0.05), y(1), X(4.05) - X(0.05), 'query 4 ms', { hot: true });
  d.brace(X(0), X(5), y(0) - 18, { dir: -1, label: '5 ms before any work', cls: 'xs' });
  d.text(320, 250, '200 cache misses per second each opening a connection would spend 1 s of setup every second', { cls: 'xs' });
  return d.svg();
}

export function be_db_process_per_conn() {
  const d = fig('be_db_process_per_conn', 'POSTGRESQL STARTS ONE OPERATING SYSTEM PROCESS PER CONNECTION', 320);
  d.gear(150, 70, 22); d.text(150, 106, 'postmaster', { cls: 'sm' });
  for (let i = 0; i < 6; i++) { const x = 40 + i * 40; d.arrow(150, 96, x + 12, 150, { stroke: C.line, hl: 4 }); d.server(x, 154, 26, 40, { unit: 12, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.ram(x - 1, 202, 28, 14, { chips: 1 }); }
  d.text(150, 240, '40 connections: 40 processes,\neach with its own memory', { cls: 'sm', vc: true });
  for (let r = 0; r < 20; r++) for (let c = 0; c < 50; c++) d.dot(340 + c * 5.4, 60 + r * 8.4, 1.4, (r * 50 + c) % 37 === 0 ? C.acc : C.gray);
  d.rect(330, 50, 285, 178, { r: 6, stroke: C.line });
  d.text(472, 248, '1,000 connections: 1,000 processes\ntaking turns on 8 cores', { cls: 'sm', vc: true });
  d.text(320, 298, 'more connections do not add CPU; past a point they add context switches and memory pressure', { cls: 'xs' });
  return d.svg();
}

export function be_db_pool() {
  const d = fig('be_db_pool', 'A POOL KEEPS 10 CONNECTIONS OPEN AND LENDS THEM TO REQUESTS', 320);
  crowd(d, 40, 140, 4, { s: 22, gap: 22, hot: (i) => i === 3 });
  d.text(75, 190, 'requests\nwaiting', { cls: 'sm', vc: true });
  d.rect(170, 50, 150, 220, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(245, 66, 'pool (10)', { cls: 'ttl' });
  for (let i = 0; i < 10; i++) {
    const yy = 84 + i * 18, busy = i < 3;
    d.circle(195, yy, 10, { fill: busy ? C.acc : C.card, stroke: busy ? C.acc : C.ink2 });
    d.mono(214, yy, busy ? 'lent out' : 'idle', { a: 'start', size: 9, color: busy ? C.acc : C.gray });
    hose(d, 320, yy, 470, 100 + i * 12, { hot: busy, th: 2.2 });
  }
  d.db(480, 80, 130, 150, { label: 'PostgreSQL' });
  d.travel([[110, 150], [190, 84]], { r: 5, at: [0, 0.3] });
  d.travel([[190, 120], [110, 230]], { r: 5, at: [0.5, 0.8], color: C.ink2 });
  d.text(140, 102, 'borrow', { cls: 'hand', size: 15 }); d.text(150, 260, 'return', { cls: 'hand', size: 15, color: C.ink2 });
  d.text(320, 300, 'a borrowed connection is already open, authenticated and warm', { cls: 'xs' });
  return d.svg();
}

export function be_db_pool_lifecycle() {
  const d = fig('be_db_pool_lifecycle', 'THE LIFE OF ONE POOLED CONNECTION', 340);
  const cx = 320, cy = 175, r = 115;
  d.circle(cx, cy, r * 2, { stroke: C.line, sw: 1.2 });
  const st = [['opened', '5 ms, once', -90], ['idle in pool', 'kept warm', -18], ['borrowed', 'one request', 54], ['returned', 'state reset', 126], ['checked', 'still alive?', 198]];
  st.forEach(([a, b, deg], i) => {
    const t = deg * Math.PI / 180, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
    d.circle(x, y, 18, { fill: i === 2 ? C.acc : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    const lx = cx + Math.cos(t) * (r + 58), ly = cy + Math.sin(t) * (r + 34);
    d.text(lx, ly - 7, a, { cls: 'ttl', size: 11, color: i === 2 ? C.acc : undefined }); d.text(lx, ly + 9, b, { cls: 'xs' });
  });
  d.travel(`M${cx},${cy - r} A${r},${r} 0 1 1 ${cx - 0.1},${cy - r}`, { r: 5, dur: 7 });
  d.clock(cx, cy, 64, { spin: 7 }); d.text(cx, cy + 46, 'retired after\nmax lifetime 30 min', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_db_little() {
  const d = fig('be_db_little', 'LITTLE\'S LAW: BUSY CONNECTIONS = ARRIVAL RATE × TIME EACH HOLDS ONE', 330);
  d.text(40, 64, 'normal day', { cls: 'ttl', a: 'start' });
  pipe(d, 60, 380, 110, 26);
  for (let i = 0; i < 3; i++) d.travel([[60, 110], [380, 110]], { r: 5, at: [i * 0.33, i * 0.33 + 0.12] });
  d.mono(520, 110, '50/s × 0.008 s = 0.4', { size: 11 });
  d.text(220, 140, 'each request holds a connection for 8 ms', { cls: 'xs' });
  d.text(40, 186, 'database slows to 2 s per query', { cls: 'ttl', a: 'start', color: C.acc });
  pipe(d, 60, 380, 232, 26, true);
  for (let i = 0; i < 26; i++) d.dot(70 + i * 12, 232, 4.2, C.acc);
  crowd(d, 400, 214, 6, { s: 16, gap: 15, hot: () => true });
  d.mono(520, 260, '50/s × 4 s = 200', { size: 11, color: C.acc });
  d.text(220, 266, 'pool holds 10; the other 190 wait', { cls: 'xs', color: C.acc });
  d.text(320, 312, 'L = λW, per app instance; the same law sizes queues, thread pools and checkout lines', { cls: 'xs' });
  return d.svg();
}

export function be_db_pool_curve() {
  const d = fig('be_db_pool_curve', 'MORE CONNECTIONS STOP HELPING EARLY (ILLUSTRATIVE SHAPE FOR AN 8 CORE DATABASE)', 320);
  const M = d.axes(70, 50, 500, 210, { xmin: 0, xmax: 200, ymin: 0, ymax: 1.1, xl: 'total connections', yl: 'throughput' });
  const f = (n) => Math.min(1, n / 17) * (n > 30 ? Math.max(0.35, 1 - (n - 30) / 260) : 1);
  d.fn(f, 1, 200, M);
  [[17, '17 = 8 × 2 + 1'], [40, 'Wren: 4 × 10'], [200, '20 × 10']].forEach(([n, s], i) => { d.line(M.X(n), M.Y(0), M.X(n), M.Y(f(n)), { stroke: C.line, dash: [2, 3], single: true }); d.dot(M.X(n), M.Y(f(n)), 3.4, i === 2 ? C.acc : C.ink); d.text(M.X(n) + (i === 2 ? -6 : 6), M.Y(f(n)) - 12, s, { cls: 'xs', a: i === 2 ? 'end' : 'start' }); });
  d.hand(420, 110, 'contention, not work', { size: 15 });
  d.text(320, 300, 'rule of thumb from the PostgreSQL wiki: cores × 2 + disks; then measure', { cls: 'xs' });
  return d.svg();
}

export function be_db_exhaustion() {
  const d = fig('be_db_exhaustion', 'POOL EXHAUSTED: REQUESTS WAIT 250 MS, THEN FAIL FAST WITH 503', 320);
  d.rect(250, 50, 150, 200, { r: 8, fill: C.paper, stroke: C.acc }); d.text(325, 66, 'pool: 10 of 10 busy', { cls: 'ttl', size: 11, color: C.acc });
  for (let i = 0; i < 10; i++) { d.circle(275, 86 + i * 16, 10, { fill: C.acc, stroke: C.acc }); d.blink((g) => g.mono(292, 86 + i * 16, 'query 2 s', { a: 'start', size: 8.5, color: C.acc }), { dur: 1.2 + i * 0.1 }); }
  d.db(480, 90, 120, 130, { label: 'slow\ndatabase', stroke: C.acc });
  d.text(110, 60, 'waiting room', { cls: 'ttl' });
  for (let k = 0; k < 5; k++) d.during([k * 0.15, 1], (g) => crowd(g, 40 + k * 30, 90, 1, { s: 20 }));
  hourglass(d, 110, 150, 46, { level: 0.6, label: 'wait 250 ms' });
  d.during([0.75, 1], (g) => { g.arrow(110, 220, 110, 262, { stroke: C.acc }); g.box(70, 266, 80, 26, '503', { r: 5, fill: C.accSoft, stroke: C.acc, cls: 'mono' }); });
  d.text(400, 290, 'failing fast keeps threads free; waiting forever ties up every worker', { cls: 'xs' });
  return d.svg();
}

export function be_db_timeouts() {
  const d = fig('be_db_timeouts', 'TIMEOUTS NEST: EACH INNER LIMIT FITS INSIDE THE ONE ABOVE IT', 320);
  const X = (ms) => 150 + ms * 1.5;
  const rows = [['gateway deadline', 300, 0], ['request handler', 280, 0], ['pool wait', 50, 0], ['statement_timeout', 200, 50], ['lock_timeout', 100, 50]];
  rows.forEach(([s, ms, from], i) => {
    const y = 64 + i * 46;
    hourglass(d, 40, y - 14, 28, { level: ms / 300, stroke: i === 3 ? C.acc : C.ink2 });
    d.text(66, y, s, { cls: 'mono', size: 10, a: 'start', color: i === 3 ? C.acc : undefined });
    seg(d, X(from), y, X(from + ms) - X(from), `${ms} ms`, { hot: i === 3 });
  });
  for (let ms = 0; ms <= 300; ms += 50) { d.line(X(ms), 280, X(ms), 286, { stroke: C.gray, single: true }); d.mono(X(ms), 296, String(ms), { size: 9 }); }
  d.line(X(0), 280, X(300), 280, { stroke: C.gray, single: true });
  return d.svg();
}

export function be_db_idle_txn() {
  const d = fig('be_db_idle_txn', 'A TRANSACTION LEFT OPEN DURING AN HTTP CALL HOLDS ITS ROW LOCK THE WHOLE TIME', 300);
  const y = lanes(d, ['session A', 'session B'], { y: 90, gap: 90, x0: 110, x1: 610 });
  seg(d, 120, y(0), 70, 'BEGIN; UPDATE'); d.lock(196, y(0) - 30, 16, { stroke: C.acc, fill: C.accSoft });
  seg(d, 195, y(0), 300, 'idle in transaction: calling the payment API 800 ms', { dash: [4, 3], fill: C.paper, size: 9 });
  seg(d, 500, y(0), 70, 'COMMIT');
  d.line(196, y(0) - 13, 570, y(0) - 13, { stroke: C.acc, sw: 2, single: true }); d.text(380, y(0) - 30, 'row lock on order 123 held', { cls: 'xs', color: C.acc });
  hourglass(d, 230, y(1) - 16, 30, { level: 0.3 }); seg(d, 250, y(1), 250, 'UPDATE order 123 waits', { hot: true });
  seg(d, 505, y(1), 80, 'runs');
  d.text(320, 270, 'idle_in_transaction_session_timeout ends sessions that sit idle like session A', { cls: 'xs' });
  return d.svg();
}

export function be_db_params() {
  const d = fig('be_db_params', 'PARAMETERS SEND CODE AND DATA IN SEPARATE ENVELOPES', 320);
  d.text(40, 60, 'string building', { cls: 'ttl', a: 'start' });
  d.mono(40, 92, '"SELECT * FROM orders WHERE id = " + input', { a: 'start', size: 10.5 });
  d.mono(40, 116, 'SELECT * FROM orders WHERE id = 1; DROP TABLE orders', { a: 'start', size: 10.5 }); d.hl(282, 116, 488, 116);
  cross(d, 590, 104, 12);
  d.text(40, 168, 'parameters', { cls: 'ttl', a: 'start' });
  d.envelope(60, 196, 70, 46, { stroke: C.ink2 }); d.mono(95, 258, 'SQL with $1', { size: 9.5 });
  d.envelope(180, 196, 70, 46, { stroke: C.acc, fill: C.accSoft }); d.mono(215, 258, '"1; DROP TABLE..."', { size: 9.5, color: C.acc });
  d.travel([[140, 220], [420, 220]], { token: 'packet', at: [0, 0.6] });
  d.db(440, 180, 110, 90, { label: 'looks for an id\nequal to that text' });
  tick(d, 590, 224, 12);
  d.text(320, 302, 'the value is never parsed as SQL, so it cannot change the statement', { cls: 'xs' });
  return d.svg();
}

export function be_db_prepared() {
  const d = fig('be_db_prepared', 'PREPARE ONCE, THEN BIND AND EXECUTE WITH NEW VALUES', 300);
  d.doc(50, 70, 110, 140, { fill: C.accFaint, stroke: C.acc }); d.mono(105, 228, 'plan for', { size: 10 }); d.mono(105, 244, 'orders WHERE id = $1', { size: 9 });
  d.gear(105, 135, 20, { spin: 10, stroke: C.acc });
  [123, 124, 125, 126].forEach((v, i) => {
    const y = 74 + i * 44;
    d.arrow(170, 140, 300, y + 12, { stroke: C.gray, hl: 5 });
    d.chips(306, y, [`$1 = ${v}`], { h: 24, size: 10 });
    d.arrow(400, y + 12, 440, y + 12, { stroke: C.gray, hl: 5 });
    d.chips(446, y, [`row ${v}`], { h: 24, size: 10, fill: C.accSoft, stroke: C.acc });
  });
  d.text(320, 280, 'parse and plan happen once per connection; each later run only binds a value', { cls: 'xs' });
  return d.svg();
}

export function be_db_ladder() {
  const d = fig('be_db_ladder', 'THREE WAYS TO TALK TO THE DATABASE, FROM MOST CONTROL TO MOST CONVENIENCE', 360);
  d.line(70, 40, 70, 330, { stroke: C.ink2, sw: 2, single: true }); d.line(130, 40, 130, 330, { stroke: C.ink2, sw: 2, single: true });
  for (let y = 60; y < 330; y += 30) d.line(70, y, 130, y, { stroke: C.ink2, single: true });
  const rungs = [['ORM', 'order = session.get(Order, 123)\norder.tip = 30\nsession.commit()', 'objects, change tracking,\nrelations; SQL is generated'], ['query builder', 'q.select("*").from("orders")\n .where("id", 123)', 'composable SQL in code;\nyou still think in tables'], ['raw SQL', 'SELECT * FROM orders\nWHERE id = $1', 'exactly what runs;\nmapping is your job']];
  rungs.forEach(([t, code, s], i) => {
    const y = 56 + i * 96, hot = i === 1;
    d.line(130, y + 30, 160, y + 30, { stroke: C.gray, single: true });
    d.rect(160, y, 250, 70, { r: 6, fill: hot ? C.accFaint : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.text(172, y + 14, t, { cls: 'ttl', size: 11, a: 'start', color: hot ? C.acc : undefined });
    d.text(172, y + 40, code, { cls: 'mono', size: 9, a: 'start', vc: true });
    d.text(430, y + 34, s, { cls: 'sm', a: 'start', vc: true });
  });
  d.text(100, 30, 'convenience', { cls: 'xs' }); d.text(100, 346, 'control', { cls: 'xs' });
  return d.svg();
}

export function be_db_hydration() {
  const d = fig('be_db_hydration', 'HYDRATION: ROWS GO IN, LINKED OBJECTS COME OUT', 300);
  sheet(d, 20, 70, [['id', 40], ['tip', 40], ['rest_id', 60]], [['123', '20', '9'], ['124', '0', '9']], { size: 9.5 });
  d.line(170, 120, 250, 120, { stroke: C.ink2, sw: 6, single: true, op: 0.3 });
  d.gear(300, 104, 26, { spin: 6 }); d.gear(334, 140, 18, { spin: 6, ccw: true, stroke: C.acc });
  d.rect(260, 70, 110, 100, { r: 8, stroke: C.ink2 }); d.text(315, 190, 'ORM mapper', { cls: 'sm' });
  d.travel([[180, 120], [260, 120]], { label: 'row', at: [0, 0.4] });
  d.travel([[372, 120], [430, 120]], { label: 'obj', at: [0.45, 0.8] });
  card(d, 440, 50, 170, ['Order 123', ' tip: 20', ' restaurant ─┐'], { size: 9.5 });
  card(d, 440, 140, 170, ['Restaurant 9', ' name: Spice Hut'], { size: 9.5, stroke: C.acc });
  d.arrow(560, 90, 560, 136, { stroke: C.acc, hl: 5 });
  d.text(320, 270, 'two orders share one Restaurant object, which the identity map guarantees', { cls: 'xs' });
  return d.svg();
}

export function be_db_identity_map() {
  const d = fig('be_db_identity_map', 'THE IDENTITY MAP: ONE ROW, ONE OBJECT PER SESSION', 300);
  d.mono(40, 80, 'a = session.get(Order, 123)', { a: 'start', size: 10.5 });
  d.mono(40, 200, 'b = session.get(Order, 123)', { a: 'start', size: 10.5 });
  d.rect(300, 110, 130, 70, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(365, 126, 'identity map', { cls: 'ttl', size: 11, color: C.acc }); d.mono(365, 152, '(Order,123) → obj', { size: 9.5 });
  d.arrow(240, 84, 300, 128, { stroke: C.ink2 }); d.arrow(240, 196, 300, 166, { stroke: C.acc });
  d.db(500, 60, 100, 80, { label: 'DB' }); d.arrow(430, 124, 496, 104, { stroke: C.ink2 }); d.text(470, 160, '1 query', { cls: 'xs' });
  d.text(365, 208, 'second get: no query', { cls: 'hand', size: 15 });
  d.mono(120, 250, 'a is b  →  True', { size: 11, color: C.acc });
  d.text(320, 284, 'changes through a are visible through b, because they are the same object', { cls: 'xs' });
  return d.svg();
}

export function be_db_dirty() {
  const d = fig('be_db_dirty', 'DIRTY CHECKING: COMPARE TO A SNAPSHOT, WRITE ONLY WHAT CHANGED', 280);
  card(d, 30, 60, 170, ['snapshot at load', 'id: 123', 'tip: 20', 'note: "no onions"'], { size: 9.5 });
  card(d, 230, 60, 170, ['object at flush', 'id: 123', 'tip: 30', 'note: "no onions"'], { size: 9.5, hot: [2] });
  d.text(215, 100, '≠', { size: 22, color: C.acc });
  d.arrow(410, 100, 440, 100, { stroke: C.acc });
  card(d, 446, 70, 180, ['UPDATE orders', 'SET tip = 30', 'WHERE id = 123'], { size: 9.5, hot: [1] });
  d.text(320, 210, 'flush happens at commit, before some queries, or when you call flush', { cls: 'sm' });
  d.text(320, 250, 'the ORM decides when SQL runs; you decide when the transaction ends', { cls: 'xs' });
  return d.svg();
}

export function be_db_n1() {
  const d = fig('be_db_n1', 'N+1: THE WAITER WHO WALKS TO THE KITCHEN ONCE PER PLATE', 330);
  d.text(40, 54, '1 + 20 queries', { cls: 'ttl', a: 'start', color: C.acc });
  d.person(60, 80, 30, { stroke: C.acc }); d.db(520, 66, 90, 64, { label: 'kitchen' });
  let p = 'M90,100'; for (let i = 0; i < 5; i++) p += ' L510,100 L90,100';
  d.travel(p, { r: 5, dur: 6 });
  for (let i = 0; i < 21; i++) d.line(110 + i * 19, 130, 110 + i * 19, 142, { stroke: C.acc, single: true, sw: 1.4 });
  d.text(300, 156, '21 round trips × 0.8 ms = 16.8 ms', { cls: 'mono', size: 10, color: C.acc });
  d.text(40, 206, '2 queries', { cls: 'ttl', a: 'start' });
  d.person(60, 230, 30); d.db(520, 216, 90, 64, { label: 'kitchen' });
  d.rect(78, 258, 44, 8, { r: 2, fill: C.card });
  d.travel('M90,250 L510,250 L90,250', { label: 'tray', dur: 6, at: [0, 0.4] });
  d.line(110, 280, 110, 292, { stroke: C.ink2, single: true, sw: 1.4 }); d.line(129, 280, 129, 292, { stroke: C.ink2, single: true, sw: 1.4 });
  d.text(300, 302, '2 round trips × 0.8 ms = 1.6 ms', { cls: 'mono', size: 10 });
  return d.svg();
}

export function be_db_loading() {
  const d = fig('be_db_loading', 'THREE WAYS TO LOAD 20 ORDERS AND THEIR RESTAURANTS', 340);
  const cols = [['lazy', 'touch it, load it'], ['joined', 'one wide query'], ['select-in', 'two narrow queries']];
  cols.forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 280, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' }); });
  for (let i = 0; i < 8; i++) d.arrow(50, 100 + i * 22, 180, 100 + i * 22, { stroke: i ? C.acc : C.ink2, hl: 4, sw: 0.9 });
  d.mono(116, 290, '1 + 20 queries', { size: 9.5, color: C.acc });
  sheet(d, 240, 96, [['order', 50], ['restaurant', 100]], [['123', 'Spice Hut'], ['124', 'Spice Hut'], ['125', 'Spice Hut'], ['126', 'Dosa Co']], { size: 8.5, rh: 20 });
  d.text(316, 214, 'restaurant columns repeat\non every row; with 2\ncollections rows multiply', { cls: 'xs', vc: true });
  d.mono(316, 290, '1 query', { size: 9.5 });
  d.mono(530, 112, 'SELECT * FROM orders', { size: 8.5 }); d.mono(530, 128, 'WHERE user_id = 42', { size: 8.5 });
  d.arrow(530, 140, 530, 170, { stroke: C.acc, hl: 5 });
  d.mono(530, 186, 'SELECT * FROM restaurants', { size: 8.5, color: C.acc }); d.mono(530, 202, 'WHERE id IN (9, 14, 31)', { size: 8.5, color: C.acc });
  d.mono(530, 290, '2 queries', { size: 9.5 });
  return d.svg();
}

export function be_db_orm_traps() {
  const d = fig('be_db_orm_traps', 'FOUR WAYS AN ORM SURPRISES YOU IN PRODUCTION', 340);
  const q = [[20, 40], [330, 40], [20, 190], [330, 190]];
  q.forEach(([x, y]) => d.rect(x, y, 290, 136, { r: 8, stroke: C.line }));
  d.doc(40, 66, 50, 64); d.text(110, 80, '{{ order.restaurant.name }}', { cls: 'mono', size: 9, a: 'start' }); d.text(110, 104, 'a template line runs a query', { cls: 'sm', a: 'start' });
  for (let i = 0; i < 6; i++) d.dot(120 + i * 12, 128, 3, C.acc);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) d.rect(350 + c * 14, 66 + r * 14, 11, 11, { r: 1, fill: C.card, stroke: C.line, sw: 0.6 });
  d.text(570, 80, '100,000\nobjects to\nflip one flag', { cls: 'sm', vc: true, color: C.acc }); d.mono(470, 150, 'UPDATE ... WHERE ...: one statement', { size: 9 });
  d.lock(50, 220, 28); cross(d, 64, 270, 9); d.text(110, 236, 'DetachedInstanceError', { cls: 'mono', size: 9.5, a: 'start' }); d.text(110, 260, 'lazy load after the session\nclosed', { cls: 'sm', a: 'start', vc: true });
  d.doc(350, 216, 60, 80); d.text(380, 256, '?', { size: 26, color: C.acc }); d.text(430, 236, 'SQL nobody read', { cls: 'sm', a: 'start' }); d.text(430, 260, 'log it, EXPLAIN it', { cls: 'sm', a: 'start' });
  return d.svg();
}

export function be_db_txn_boundary() {
  const d = fig('be_db_txn_boundary', 'KEEP SLOW CALLS OUTSIDE THE TRANSACTION', 320);
  d.text(40, 54, 'locks held 812 ms', { cls: 'ttl', a: 'start', color: C.acc });
  const X = (ms) => 60 + ms * 0.62;
  seg(d, X(0), 90, X(6) - X(0) + 4, '', {}); seg(d, X(6), 90, X(806) - X(6), 'charge card at the payment provider, 800 ms', { dash: [4, 3], fill: C.paper });
  seg(d, X(806), 90, X(812) - X(806) + 6, '', {});
  d.line(X(0), 70, X(812), 70, { stroke: C.acc, sw: 2.4, single: true }); d.text(X(0), 64, 'BEGIN', { cls: 'mono', size: 9, a: 'start' }); d.text(X(812), 64, 'COMMIT', { cls: 'mono', size: 9, a: 'end' });
  d.text(40, 164, 'locks held 12 ms', { cls: 'ttl', a: 'start' });
  seg(d, X(0), 200, X(800) - X(0), 'charge card first (idempotency key), no transaction open', { dash: [4, 3], fill: C.paper });
  seg(d, X(800), 200, X(812) - X(800) + 8, '', { hot: true });
  d.line(X(800), 180, X(812) + 8, 180, { stroke: C.acc, sw: 2.4, single: true });
  d.text(X(812) + 4, 236, 'BEGIN … COMMIT, 12 ms', { cls: 'mono', size: 9, a: 'end', color: C.acc });
  d.text(320, 290, 'a transaction should contain database work only; network calls belong before or after it', { cls: 'xs' });
  return d.svg();
}

export function be_db_uow() {
  const d = fig('be_db_uow', 'ONE USE CASE, ONE TRANSACTION, ONE BORROWED CONNECTION', 320);
  d.box(40, 50, 140, 40, 'controller', { r: 6, fill: C.card });
  d.rect(30, 110, 420, 160, { r: 10, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(240, 126, 'with unit_of_work() as uow:', { cls: 'mono', size: 10, color: C.acc });
  d.box(60, 146, 140, 40, 'OrderService.place', { r: 6, fill: C.card, size: 10 });
  ['orders repo', 'items repo', 'outbox repo'].forEach((s, i) => { d.box(230 + 0 * i, 140 + i * 40, 150, 30, s, { r: 6, fill: C.paper, size: 10 }); d.arrow(200, 166, 228, 155 + i * 40, { stroke: C.gray, hl: 4 }); });
  d.arrow(110, 92, 110, 144, { stroke: C.gray, hl: 5 });
  hose(d, 450, 190, 510, 190, { hot: true });
  d.db(515, 140, 100, 100, { label: 'one\nconnection' });
  d.text(240, 300, 'repositories share the unit of work, so their writes commit or roll back together', { cls: 'xs' });
  return d.svg();
}

export function be_db_isolation() {
  const d = fig('be_db_isolation', 'EACH ISOLATION LEVEL BLOCKS MORE ANOMALIES (POSTGRESQL BEHAVIOUR)', 330);
  const lv = [['read committed', 'default'], ['repeatable read', 'snapshot'], ['serializable', 'SSI']];
  const an = ['dirty read', 'non-repeatable read', 'phantom', 'lost update', 'write skew'];
  const block = [[1, 0, 0, 0, 0], [1, 1, 1, 1, 0], [1, 1, 1, 1, 1]];
  lv.forEach(([s, t], i) => { const x = 60 + i * 190, y = 250 - i * 60; d.rect(x, y, 190, 300 - y, { r: 0, fill: i === 0 ? C.accFaint : C.card, stroke: C.ink2 }); d.text(x + 95, y + 18, s, { cls: 'ttl', size: 11 }); d.text(x + 95, y + 34, t, { cls: 'xs' }); });
  an.forEach((s, j) => {
    const y = 56 + j * 26; d.text(30, y, s, { cls: 'sm', a: 'start' });
    block.forEach((b, i) => { const x = 155 + i * 190; if (b[j]) tick(d, x + 70, y, 6, C.ink2); else cross(d, x + 70, y, 6); });
  });
  d.text(330, 318, 'tick = prevented, cross = possible; read uncommitted in PostgreSQL behaves like read committed', { cls: 'xs' });
  return d.svg();
}

export function be_db_write_skew() {
  const d = fig('be_db_write_skew', 'WRITE SKEW: BOTH CHECK THE RULE, BOTH PASS, THE RULE BREAKS', 330);
  sheet(d, 230, 44, [['courier', 80], ['on_shift', 80]], [['Asha', 'true'], ['Ben', 'true']], { size: 10 });
  const y = lanes(d, ['T1 (Asha)', 'T2 (Ben)'], { y: 160, gap: 70, x0: 110, x1: 610 });
  seg(d, 120, y(0), 150, 'count on shift = 2'); seg(d, 290, y(0), 150, 'Asha → false'); seg(d, 460, y(0), 70, 'COMMIT');
  seg(d, 140, y(1), 150, 'count on shift = 2'); seg(d, 310, y(1), 150, 'Ben → false'); seg(d, 480, y(1), 70, 'COMMIT', { hot: true });
  d.text(320, 286, 'rule: at least 1 courier on shift. Result: 0. Under SERIALIZABLE, T2 fails with 40001 and retries', { cls: 'xs' });
  d.mono(560, 110, '0 on shift', { size: 11, color: C.acc });
  return d.svg();
}

export function be_db_deadlock() {
  const d = fig('be_db_deadlock', 'DEADLOCK: EACH TRANSACTION WAITS FOR A LOCK THE OTHER HOLDS', 320);
  d.box(60, 130, 120, 50, 'T1', { r: 8, fill: C.card, cls: 'ttl' }); d.box(460, 130, 120, 50, 'T2', { r: 8, fill: C.card, cls: 'ttl' });
  d.lock(300, 52, 30); d.mono(315, 104, 'order 123', { size: 10 });
  d.lock(300, 206, 30); d.mono(315, 258, 'order 124', { size: 10 });
  d.arrow(180, 134, 294, 78, { stroke: C.ink2 }); d.text(214, 92, 'holds', { cls: 'xs' });
  d.arrow(460, 176, 336, 232, { stroke: C.ink2 }); d.text(420, 224, 'holds', { cls: 'xs' });
  d.arrow(336, 78, 460, 134, { stroke: C.acc, dash: [5, 4] }); d.text(420, 92, 'T2 waits', { cls: 'xs', color: C.acc });
  d.arrow(294, 232, 180, 176, { stroke: C.acc, dash: [5, 4] }); d.text(214, 224, 'T1 waits', { cls: 'xs', color: C.acc });
  d.pulse(320, 155, { r0: 10, r1: 60, at: [0.6, 1] });
  d.during([0.6, 1], (g) => g.text(320, 160, '40P01 after 1 s', { cls: 'mono', size: 10, color: C.acc }));
  d.text(320, 296, 'PostgreSQL checks for cycles after deadlock_timeout and aborts one victim; lock rows in a fixed order to avoid it', { cls: 'xs' });
  return d.svg();
}

export function be_db_retry() {
  const d = fig('be_db_retry', 'RETRY THE WHOLE TRANSACTION, WITH GROWING JITTERED WAITS', 270);
  const X = (ms) => 50 + ms * 3.6;
  let t = 0; const att = [['attempt 1', 18, 10], ['attempt 2', 18, 20], ['attempt 3', 18, 40], ['commit', 18, 0]];
  att.forEach(([s, w, wait], i) => {
    seg(d, X(t), 120, X(w) - X(0), i === 3 ? 'ok' : '40001', { hot: i === 3, size: 9 }); d.text(X(t) + (X(w) - X(0)) / 2, 96, s, { cls: 'xs' });
    t += w;
    if (wait) { d.line(X(t), 120, X(t + wait), 120, { stroke: C.gray, dash: [2, 3], single: true }); d.rect(X(t + wait * 0.5), 138, X(wait * 0.5) - X(0), 10, { r: 2, fill: C.accFaint, stroke: C.line, sw: 0.6 }); d.text(X(t + wait / 2), 166, `wait ${wait / 2} to ${wait} ms`, { cls: 'xs' }); t += wait; }
  });
  d.text(320, 220, 'rerun from BEGIN: the earlier reads are stale, so retrying only the failed statement is wrong', { cls: 'sm' });
  d.text(320, 246, 'cap attempts (here 3) and make the side effects idempotent', { cls: 'xs' });
  return d.svg();
}

export function be_db_lost_update() {
  const d = fig('be_db_lost_update', 'LOST UPDATE: TWO READ 5, BOTH WRITE 4, ONE SALE VANISHES', 300);
  const y = lanes(d, ['T1', 'T2'], { y: 90, gap: 110, x0: 70, x1: 600 });
  seg(d, 80, y(0), 100, 'read stock 5'); seg(d, 260, y(0), 100, 'write 4'); seg(d, 380, y(0), 70, 'COMMIT');
  seg(d, 120, y(1), 100, 'read stock 5'); seg(d, 300, y(1), 100, 'write 4', { hot: true }); seg(d, 420, y(1), 70, 'COMMIT');
  d.rect(520, 120, 70, 60, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(555, 112, 'stock', { cls: 'xs' });
  d.during([0, 0.4], (g) => g.text(555, 150, '5', { size: 26 }));
  d.during([0.4, 1], (g) => { g.text(555, 150, '4', { size: 26, color: C.acc }); g.hand(555, 200, 'should be 3', { size: 15 }); });
  d.text(320, 278, 'two biryanis sold, one decrement survived; both transactions believed they were right', { cls: 'xs' });
  return d.svg();
}

export function be_db_for_update() {
  const d = fig('be_db_for_update', 'SELECT ... FOR UPDATE: THE SECOND BUYER WAITS AT THE PADLOCK', 300);
  d.rect(250, 110, 140, 44, { r: 6, fill: C.card, stroke: C.ink2 }); d.mono(320, 132, 'item 17, stock 5', { size: 10 });
  d.during([0, 0.55], (g) => g.lock(304, 70, 30, { stroke: C.acc, fill: C.accSoft }));
  d.person(120, 110, 36, { stroke: C.acc }); d.text(120, 170, 'T1 holds', { cls: 'sm', color: C.acc });
  d.person(520, 110, 36); d.text(520, 170, 'T2', { cls: 'sm' });
  d.during([0, 0.55], (g) => hourglass(g, 470, 108, 34, { level: 0.4 }));
  d.during([0.55, 1], (g) => { g.lock(304, 70, 30, { stroke: C.ink2 }); g.text(520, 190, 'reads 4, writes 3', { cls: 'mono', size: 9.5 }); });
  d.text(320, 230, 'NOWAIT fails instead of waiting; SKIP LOCKED moves on to the next row', { cls: 'sm' });
  d.text(320, 270, 'locks last until COMMIT or ROLLBACK, so keep these transactions short', { cls: 'xs' });
  return d.svg();
}

export function be_db_skip_locked() {
  const d = fig('be_db_skip_locked', 'SKIP LOCKED: THREE WORKERS DRAIN ONE JOBS TABLE WITHOUT TRIPPING OVER EACH OTHER', 320);
  const rows = ['job 501 send receipt', 'job 502 notify kitchen', 'job 503 send receipt', 'job 504 refund', 'job 505 notify kitchen', 'job 506 send receipt'];
  rows.forEach((s, i) => { const y = 60 + i * 36; d.rect(220, y, 200, 28, { r: 4, fill: i < 3 ? C.accFaint : C.card, stroke: i < 3 ? C.acc : C.ink2 }); d.mono(320, y + 14, s, { size: 9.5 }); if (i < 3) d.lock(430, y + 2, 18, { stroke: C.acc, fill: C.accSoft }); });
  [0, 1, 2].forEach((i) => { d.gear(90, 74 + i * 36, 13, { spin: 3 + i }); d.text(60, 74 + i * 36, `w${i + 1}`, { cls: 'mono', size: 9, a: 'end' }); d.arrow(108, 74 + i * 36, 214, 74 + i * 36, { stroke: C.acc, hl: 5 }); });
  d.gear(90, 200, 13, { spin: 4 }); d.text(60, 200, 'w4', { cls: 'mono', size: 9, a: 'end' });
  d.carrow([[108, 200], [180, 170], [214, 182]], { stroke: C.ink2, dash: [3, 3] });
  d.text(140, 240, 'w4 skips locked rows\nand takes job 504', { cls: 'xs', vc: true });
  d.mono(320, 296, 'SELECT ... ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED', { size: 10 });
  return d.svg();
}

export function be_db_optimistic() {
  const d = fig('be_db_optimistic', 'OPTIMISTIC LOCKING: A VERSION NUMBER CATCHES THE SECOND WRITER', 320);
  d.rect(250, 50, 140, 50, { r: 6, fill: C.card }); d.mono(320, 68, 'order 123', { size: 10 });
  d.during([0, 0.5], (g) => g.mono(320, 86, 'tip 20, version 7', { size: 10 }));
  d.during([0.5, 1], (g) => g.mono(320, 86, 'tip 30, version 8', { size: 10, color: C.acc }));
  card(d, 20, 140, 290, ['T1: UPDATE orders SET tip = 30,', '    version = 8', '  WHERE id = 123 AND version = 7', '→ 1 row updated'], { size: 9.5, hot: [3] });
  card(d, 330, 140, 290, ['T2: UPDATE orders SET note = \'x\',', '    version = 8', '  WHERE id = 123 AND version = 7', '→ 0 rows: someone changed it'], { size: 9.5 });
  cross(d, 600, 222, 8);
  d.text(320, 270, 'T2 reloads version 8 and retries, or returns 409 or 412 to the client', { cls: 'sm' });
  d.text(320, 300, 'no lock is held between read and write; the check happens in the UPDATE itself', { cls: 'xs' });
  return d.svg();
}

export function be_db_opt_vs_pess() {
  const d = fig('be_db_opt_vs_pess', 'OPTIMISTIC WINS WHEN CONFLICTS ARE RARE (ILLUSTRATIVE COST MODEL)', 320);
  const M = d.axes(80, 50, 460, 200, { xmin: 0, xmax: 0.6, ymin: 0, ymax: 2.6, xl: 'chance a write conflicts', yl: 'cost per successful update' });
  d.fn((p) => 1 / (1 - p), 0, 0.6, M);
  d.fn(() => 1.3, 0, 0.6, M, { stroke: C.slate, dash: [5, 4] });
  d.dot(M.X(0.2308), M.Y(1.3), 4, C.ink); d.text(M.X(0.2308), M.Y(1.3) + 18, 'p ≈ 23%', { cls: 'mono', size: 9.5 });
  d.text(M.X(0.55), M.Y(2.35), 'optimistic: 1 ÷ (1 − p) tries', { cls: 'xs', a: 'end', color: C.acc });
  d.text(M.X(0.55), M.Y(1.3) - 12, 'pessimistic: a flat 1.3 for locking', { cls: 'xs', a: 'end' });
  d.text(320, 300, 'the 1.3 is an assumption; the shape, not the crossing point, is the lesson', { cls: 'xs' });
  return d.svg();
}

export function be_db_atomic() {
  const d = fig('be_db_atomic', 'LET THE DATABASE DO READ, CHECK AND WRITE IN ONE STATEMENT', 300);
  d.text(40, 56, 'read, decide in code, write', { cls: 'ttl', a: 'start' });
  steps(d, [['SELECT stock', ''], ['if stock > 0', 'in app'], ['UPDATE stock', '']], 70, -1, { x0: 40, w: 140, h: 40, gap: 50 });
  d.person(212, 126, 22, { stroke: C.acc }); d.person(402, 126, 22, { stroke: C.acc }); d.text(310, 160, 'other transactions slip into the gaps', { cls: 'xs', color: C.acc });
  d.text(40, 196, 'one statement', { cls: 'ttl', a: 'start' });
  bolt(d, 60, 206, 1.1);
  card(d, 90, 206, 440, ['UPDATE menu_items SET stock = stock - 1', 'WHERE id = 17 AND stock > 0', 'RETURNING stock;  -- 0 rows means sold out'], { size: 10, hot: [1] });
  return d.svg();
}

export function be_db_constraint() {
  const d = fig('be_db_constraint', 'A UNIQUE INDEX IS A BOUNCER THAT NO RACE CAN SNEAK PAST', 300);
  d.rect(300, 60, 18, 170, { r: 2, fill: C.ink2, stroke: C.ink2 }); d.rect(300, 60, 18, 70, { r: 2, fill: C.paper, stroke: C.ink2 });
  d.text(309, 250, 'UNIQUE (idempotency_key)', { cls: 'mono', size: 9.5 });
  d.envelope(80, 80, 80, 50, { label: 'key K7 #1' }); d.envelope(80, 170, 80, 50, { label: 'key K7 #2', stroke: C.acc });
  d.travel([[170, 105], [450, 105]], { token: 'packet', at: [0, 0.5] });
  d.travel([[170, 195], [292, 195], [200, 195]], { token: 'packet', at: [0.3, 0.9] });
  d.db(470, 70, 120, 90, { label: 'row K7' });
  d.during([0.6, 1], (g) => g.text(440, 200, '23505 unique_violation\n→ return the stored response', { cls: 'mono', size: 9.5, vc: true, color: C.acc }));
  d.text(320, 286, 'checks in code race; constraints are checked inside the database, under its locks', { cls: 'xs' });
  return d.svg();
}

export function be_db_migration_files() {
  const d = fig('be_db_migration_files', 'MIGRATIONS ARE NUMBERED FILES; A TABLE REMEMBERS WHICH RAN', 320);
  const f = ['0041_create_orders', '0042_add_tip', '0043_index_user', '0044_add_kitchen_note', '0045_backfill_note'];
  f.forEach((s, i) => { d.doc(40 + i * 8, 60 + i * 44, 200, 34, { lines: false, fill: i > 2 ? C.accFaint : C.paper, stroke: i > 2 ? C.acc : C.ink2 }); d.mono(140 + i * 8, 78 + i * 44, s + '.sql', { size: 9.5 }); });
  const s = sheet(d, 380, 60, [['version', 70], ['applied_at', 150]], [['0041', '2026-09-01 10:02'], ['0042', '2026-09-14 09:40'], ['0043', '2026-09-30 11:15'], ['0044', 'pending'], ['0045', 'pending']], { size: 9.5, hot: [3, 4] });
  d.text(490, 52, 'schema_migrations', { cls: 'mono', size: 9.5 });
  d.arrow(290, 214, 374, 170, { stroke: C.acc }); d.hand(320, 250, 'migrate: run 0044, then 0045', { size: 15 });
  d.text(320, 300, 'each file runs once, in order, on every environment; never edit a file that already ran', { cls: 'xs' });
  return d.svg();
}

export function be_db_migration_deploy() {
  const d = fig('be_db_migration_deploy', 'MIGRATE ONCE, THEN ROLL THE APP OUT INSTANCE BY INSTANCE', 300);
  steps(d, [['build', 'image v42'], ['migrate', 'one job, one lock'], ['roll out', '4 instances']], 60, 1, { x0: 30, w: 170, gap: 30, h: 50 });
  d.lock(316, 124, 22, { stroke: C.acc, fill: C.accSoft }); d.text(316, 166, 'advisory lock: only one\nmigrator at a time', { cls: 'xs', vc: true });
  [0, 1, 2, 3].forEach((i) => { d.server(450 + i * 42, 140, 34, 54, { unit: 12 }); d.during([0.2 + i * 0.18, 1], (g) => g.server(450 + i * 42, 140, 34, 54, { unit: 12, fill: C.accSoft, stroke: C.acc, led: () => true })); });
  d.text(530, 216, 'v41 → v42, one at a time', { cls: 'xs' });
  d.text(320, 270, 'for a while old and new code run together against the new schema; both must work', { cls: 'xs' });
  return d.svg();
}

export function be_db_lock_queue() {
  const d = fig('be_db_lock_queue', 'ONE ALTER TABLE WAITING AT THE DOOR BLOCKS EVERYONE BEHIND IT', 340);
  d.rect(420, 50, 200, 200, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(520, 66, 'orders table', { cls: 'ttl' });
  d.rect(410, 120, 12, 70, { r: 1, fill: C.ink2, stroke: C.ink2 });
  d.person(520, 110, 34); d.text(520, 166, 'analytics SELECT\nrunning 30 s', { cls: 'xs', vc: true });
  d.person(380, 130, 34, { stroke: C.acc, fill: C.accSoft }); d.text(380, 186, 'ALTER TABLE\nwants exclusive', { cls: 'xs', vc: true, color: C.acc });
  for (let k = 0; k < 7; k++) d.during([0.1 + k * 0.1, 1], (g) => g.person(330 - k * 40, 140, 26));
  d.during([0.25, 1], (g) => g.text(200, 210, '0.2 s: all 40 pool connections stuck', { cls: 'sm', color: C.acc }));
  d.during([0.65, 1], (g) => g.text(200, 232, '30 s: 6,000 queries queued, users see errors', { cls: 'sm', color: C.acc }));
  d.text(320, 300, 'the lock queue is first come, first served; new readers line up behind the waiting ALTER', { cls: 'xs' });
  return d.svg();
}

export function be_db_lock_timeout() {
  const d = fig('be_db_lock_timeout', 'WITH lock_timeout = 2 S THE ALTER GIVES UP, AND THE QUEUE DRAINS', 280);
  const y = lanes(d, ['ALTER attempts', 'user queries'], { y: 90, gap: 80, x0: 130, x1: 610, tl: 'seconds' });
  const X = (s) => 130 + s * 18;
  seg(d, X(0), y(0), X(2) - X(0), 'wait 2 s'); d.text(X(2) + 4, y(0) - 18, 'give up', { cls: 'xs', a: 'start' });
  seg(d, X(12), y(0), X(14) - X(12), 'wait 2 s'); seg(d, X(24), y(0), 10, '', { hot: true }); d.text(X(24) + 14, y(0) - 18, 'got it, 5 ms', { cls: 'xs', a: 'start', color: C.acc });
  seg(d, X(0), y(1), X(2) - X(0), 'stall', { hot: true }); seg(d, X(2), y(1), X(12) - X(2), 'normal'); seg(d, X(12), y(1), X(14) - X(12), 'stall', { hot: true }); seg(d, X(14), y(1), X(26) - X(14), 'normal');
  d.text(320, 260, 'bounded 2 s stalls instead of a 30 s outage; retry on a schedule until the table is quiet', { cls: 'xs' });
  return d.svg();
}

export function be_db_index_concurrently() {
  const d = fig('be_db_index_concurrently', 'CREATE INDEX BLOCKS WRITES; CONCURRENTLY LETS THEM FLOW', 320);
  d.text(40, 56, 'CREATE INDEX: 40 s', { cls: 'ttl', a: 'start' });
  d.rect(60, 76, 400, 30, { r: 4, fill: C.card }); d.text(260, 91, 'build, writes blocked', { cls: 'sm' });
  for (let i = 0; i < 6; i++) d.envelope(470 + (i % 3) * 30, 70 + Math.floor(i / 3) * 22, 24, 16, { stroke: C.acc, fill: C.accSoft });
  d.text(530, 130, '2,000 order\nwrites waiting', { cls: 'xs', vc: true, color: C.acc });
  d.text(40, 176, 'CREATE INDEX CONCURRENTLY: longer, but online', { cls: 'ttl', a: 'start' });
  [['scan 1', 140], ['wait for old txns', 120], ['scan 2', 140], ['valid', 60]].reduce((x, [s, w], i) => { seg(d, x, 210, w - 6, s, { hot: i === 3, size: 9 }); return x + w; }, 60);
  for (let i = 0; i < 4; i++) d.travel([[40, 250], [600, 250]], { token: 'packet', at: [i * 0.25, i * 0.25 + 0.5] });
  d.text(320, 278, 'writes keep landing during the build', { cls: 'xs' });
  d.text(320, 304, 'if it fails, it leaves an INVALID index; drop it and try again', { cls: 'xs' });
  return d.svg();
}

export function be_db_safe_changes() {
  const d = fig('be_db_safe_changes', 'SORTING SCHEMA CHANGES BY HOW MUCH THEY HURT A LIVE TABLE (POSTGRESQL 11+)', 340);
  const groups = [['safe', ['add a nullable column', 'add a column with a constant default', 'CREATE INDEX CONCURRENTLY', 'add constraint NOT VALID, then VALIDATE'], 0], ['careful', ['SET NOT NULL (full scan under lock)', 'add a foreign key (validate separately)', 'drop a column old code still reads'], 1], ['rewrite or break', ['change a column type', 'add a column with a volatile default', 'rename a column in use'], 2]];
  groups.forEach(([t, items, k], i) => {
    const x = 20 + i * 207;
    d.rect(x + 70, 44, 50, 116, { r: 10, fill: C.card, stroke: C.ink2 });
    [0, 1, 2].forEach((j) => d.circle(x + 95, 66 + j * 36, 26, { fill: j === k ? (k === 0 ? C.slateSoft : C.accSoft) : C.paper, stroke: j === k ? (k === 0 ? C.slate : C.acc) : C.line }));
    d.text(x + 95, 178, t, { cls: 'ttl', size: 11, color: k === 2 ? C.acc : undefined });
    items.forEach((s, m) => d.text(x + 95, 204 + m * 30, s, { cls: 'xs' }));
  });
  return d.svg();
}

export function be_db_expand_contract() {
  const d = fig('be_db_expand_contract', 'EXPAND AND CONTRACT: RENAMING note TO kitchen_note WITHOUT DOWNTIME', 340);
  const st = ['add column', 'write both', 'backfill', 'read new', 'stop old', 'drop old'];
  const X = (i) => 70 + i * 100;
  d.line(X(0), 70, X(5), 70, { stroke: C.line, sw: 2, single: true });
  st.forEach((s, i) => { d.circle(X(i), 70, 20, { fill: C.card, stroke: C.ink2 }); d.mono(X(i), 70, i + 1, { size: 9.5 }); d.text(X(i), 98, s, { cls: 'sm' }); });
  d.travel([[X(0), 70], [X(5), 70]], { r: 6, dur: 8 });
  d.text(30, 150, 'note', { cls: 'mono', size: 10, a: 'start' }); d.text(30, 200, 'kitchen_note', { cls: 'mono', size: 10, a: 'start' });
  const bar = (y, a, b, hot, s) => { d.rect(X(a) - 10, y - 12, X(b) - X(a) + 20, 24, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text((X(a) + X(b)) / 2, y, s, { cls: 'xs' }); };
  bar(150, 0, 3.6, false, 'written and read'); bar(150, 3.7, 4.6, false, 'read by nobody'); d.text(X(5), 150, 'gone', { cls: 'xs', color: C.gray });
  bar(200, 0.6, 2.5, true, 'written, filling up'); bar(200, 2.6, 5, true, 'written and read');
  d.text(320, 250, 'six deploys or migrations; each step is safe with the code before it and after it', { cls: 'sm' });
  d.text(320, 278, 'expand adds things the old code ignores; contract removes things the new code no longer uses', { cls: 'xs' });
  d.text(320, 310, 'the same shape handles column type changes, table splits and moving data between stores', { cls: 'xs' });
  return d.svg();
}

export function be_db_versions_overlap() {
  const d = fig('be_db_versions_overlap', 'MID-ROLLOUT: OLD AND NEW CODE SHARE ONE SCHEMA, AND BOTH MUST BE HAPPY', 300);
  [0, 1].forEach((i) => d.server(40, 60 + i * 100, 60, 70, { label: 'v41' }));
  [0, 1].forEach((i) => d.server(540, 60 + i * 100, 60, 70, { label: 'v42', fill: C.accSoft, stroke: C.acc, led: () => true }));
  sheet(d, 220, 90, [['id', 50], ['note', 80], ['kitchen_note', 100]], [['123', 'no onions', 'no onions'], ['124', 'extra raita', 'extra raita']], { size: 9.5 });
  d.arrow(104, 100, 280, 112, { stroke: C.ink2, hl: 5 }); d.arrow(104, 200, 300, 150, { stroke: C.ink2, hl: 5 }); d.text(170, 90, 'reads note', { cls: 'xs' });
  d.arrow(536, 100, 450, 112, { stroke: C.acc, hl: 5 }); d.arrow(536, 200, 420, 150, { stroke: C.acc, hl: 5 }); d.text(490, 90, 'reads kitchen_note', { cls: 'xs', color: C.acc });
  d.text(330, 206, 'both versions write both columns', { cls: 'hand', size: 15 });
  d.text(320, 270, 'drop note now and the v41 instances crash; drop it after the rollout and nobody notices', { cls: 'xs' });
  return d.svg();
}

export function be_db_backfill() {
  const d = fig('be_db_backfill', 'BACKFILL 5,000,000 ROWS IN 5,000 BATCHES OF 1,000', 320);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 50; c++) {
    const x = 40 + c * 11.2, y = 56 + r * 14, k = r * 50 + c;
    d.rect(x, y, 9, 11, { r: 1, fill: C.paper, stroke: C.line, sw: 0.5, single: true });
    d.during([k / 500 * 0.9, 1], (g) => g.fillRect(x + 1, y + 1, 7, 9, C.acc, 0.8));
  }
  d.text(320, 210, 'each square is 10 batches; each batch is one short transaction', { cls: 'xs' });
  card(d, 40, 226, 300, ['UPDATE orders SET kitchen_note = note', ' WHERE id BETWEEN $1 AND $1 + 999', '   AND kitchen_note IS NULL;'], { size: 9.5 });
  d.text(480, 240, '50 ms work + 50 ms sleep', { cls: 'mono', size: 10 });
  d.text(480, 262, '5,000 × 100 ms = 500 s', { cls: 'mono', size: 10, color: C.acc });
  d.text(480, 284, 'resumable, throttled, idempotent', { cls: 'xs' });
  return d.svg();
}

export function be_db_backfill_lag() {
  const d = fig('be_db_backfill_lag', 'ONE GIANT UPDATE VERSUS SMALL BATCHES, AS SEEN BY A REPLICA (ILLUSTRATIVE)', 300);
  const M = d.axes(70, 50, 500, 180, { xmin: 0, xmax: 600, ymin: 0, ymax: 100, xl: 'seconds', yl: 'replica lag (s)' });
  d.fn((t) => (t < 300 ? 0.5 : t < 330 ? (t - 300) * 3 : Math.max(0.5, 90 - (t - 330) * 0.6)), 0, 600, M, { n: 200 });
  d.fn((t) => 0.6 + 0.5 * Math.abs(Math.sin(t / 3)), 0, 500, M, { stroke: C.slate, n: 200 });
  d.text(M.X(350), M.Y(92), 'one UPDATE commits 5,000,000 rows', { cls: 'xs', a: 'start', color: C.acc });
  d.text(M.X(20), M.Y(12), 'batched: lag stays near zero', { cls: 'xs', a: 'start' });
  d.text(320, 282, 'a huge transaction also holds 5,000,000 row locks until it ends and cannot be resumed', { cls: 'xs' });
  return d.svg();
}

export function be_db_replicas() {
  const d = fig('be_db_replicas', 'WRITES GO TO THE PRIMARY; THE WAL STREAMS TO READ REPLICAS', 320);
  d.server(40, 120, 70, 80, { label: 'app' });
  d.db(250, 60, 120, 110, { label: 'primary', stroke: C.acc, fill: C.accFaint });
  d.db(470, 50, 110, 90, { label: 'replica 1' }); d.db(470, 190, 110, 90, { label: 'replica 2' });
  d.arrow(114, 140, 244, 115, { stroke: C.acc }); d.text(170, 112, 'writes', { cls: 'xs', color: C.acc });
  d.arrow(114, 180, 464, 236, { stroke: C.ink2 }); d.text(250, 228, 'reads', { cls: 'xs' });
  for (let i = 0; i < 3; i++) { d.travel([[372, 100], [466, 92]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.3] }); d.travel([[372, 140], [466, 225]], { token: 'packet', at: [i * 0.33 + 0.1, i * 0.33 + 0.45] }); }
  d.text(420, 160, 'WAL', { cls: 'hand', size: 15 });
  d.text(320, 304, 'replicas apply the same log, a little later; reads scale out, writes do not', { cls: 'xs' });
  return d.svg();
}

export function be_db_lag() {
  const d = fig('be_db_lag', 'REPLICATION LAG: USER 42 CHANGES THE TIP, THEN READS THE OLD ONE', 300);
  const y = lanes(d, ['user 42', 'primary', 'replica'], { y: 70, gap: 60, x0: 100, x1: 600, tl: 'ms' });
  const X = (ms) => 100 + ms * 5;
  d.dot(X(0), y(0), 5, C.ink); d.text(X(0) + 8, y(0) - 14, 'PATCH tip 30', { cls: 'mono', size: 9, a: 'start' });
  d.arrow(X(0), y(0) + 4, X(5), y(1) - 6, { stroke: C.ink2, hl: 5 }); d.dot(X(5), y(1), 4, C.ink); d.text(X(5) + 8, y(1) - 14, 'commit', { cls: 'xs', a: 'start' });
  d.dot(X(30), y(0), 5, C.acc); d.text(X(30) + 8, y(0) - 14, 'GET order: tip 20', { cls: 'mono', size: 9, a: 'start', color: C.acc });
  d.arrow(X(30), y(0) + 4, X(32), y(2) - 6, { stroke: C.acc, hl: 5 });
  d.arrow(X(5), y(1) + 4, X(80), y(2) - 6, { stroke: C.gray, dash: [3, 3], hl: 5 }); d.dot(X(80), y(2), 4, C.ink); d.text(X(80) + 8, y(2) + 14, 'applied at 80 ms', { cls: 'xs', a: 'start' });
  d.brace(X(5), X(80), y(2) + 30, { label: 'lag 75 ms', cls: 'xs' });
  return d.svg();
}

export function be_db_ryw() {
  const d = fig('be_db_ryw', 'THREE WAYS TO READ YOUR OWN WRITES', 320);
  [['stick to primary', 'for 5 s after a write'], ['wait for the LSN', 'replica must catch up'], ['own data on primary', 'everyone else on replicas']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 260, t, i === 1); d.text(x + 96, 76, s, { cls: 'xs' }); });
  d.rect(56, 110, 120, 50, { r: 6, fill: C.paper }); d.mono(116, 128, 'cookie', { size: 9 }); d.mono(116, 146, 'wrote_at=10:00:00', { size: 8.5 });
  d.clock(116, 214, 52, { t: 5 / 60 }); d.text(116, 262, 'now − wrote_at < 5 s?', { cls: 'xs' });
  d.mono(323, 118, 'session LSN 0/3A2F10', { size: 9, color: C.acc });
  gauge(d, 323, 210, 60, 0.82, { hot: true, value: 'replay', red: 0.9 });
  d.text(323, 250, 'serve when replay ≥ 0/3A2F10', { cls: 'xs' });
  d.person(490, 110, 30, { stroke: C.acc }); d.text(490, 160, 'user 42 viewing user 42', { cls: 'xs' }); d.arrow(490, 170, 490, 200, { stroke: C.acc, hl: 5 }); d.db(450, 206, 80, 56, { label: 'primary', size: 9 });
  return d.svg();
}

export function be_db_pgbouncer() {
  const d = fig('be_db_pgbouncer', 'PGBOUNCER: 400 CLIENT CONNECTIONS SHARE 40 SERVER CONNECTIONS', 320);
  [0, 1, 2, 3].forEach((i) => { d.server(30, 50 + i * 62, 50, 50, { unit: 12 }); for (let k = 0; k < 5; k++) d.line(84, 62 + i * 62 + k * 7, 250, 140 + k * 8 + i * 2, { stroke: C.line, single: true, sw: 0.7 }); });
  d.text(55, 310, '4 × 100 clients', { cls: 'xs' });
  d.poly([[250, 110], [360, 150], [360, 190], [250, 230]], { fill: C.accFaint, stroke: C.acc });
  d.text(300, 250, 'PgBouncer', { cls: 'ttl', size: 11, color: C.acc });
  for (let k = 0; k < 4; k++) hose(d, 362, 158 + k * 8, 470, 150 + k * 14, { hot: k === 1, th: 2 });
  d.db(480, 110, 120, 130, { label: '40 server\nconnections' });
  d.text(320, 296, 'transaction mode hands a server connection to a client only for one transaction', { cls: 'xs' });
  return d.svg();
}

export function be_db_pool_modes() {
  const d = fig('be_db_pool_modes', 'HOW LONG A CLIENT KEEPS A SERVER CONNECTION, BY POOLING MODE', 300);
  const y = lanes(d, ['session', 'transaction', 'statement'], { y: 70, gap: 60, x0: 110, x1: 600 });
  seg(d, 120, y(0), 460, 'held from connect to disconnect, idle time included');
  [[120, 90], [300, 70], [450, 110]].forEach(([x, w]) => seg(d, x, y(1), w, 'BEGIN … COMMIT', { hot: true, size: 8.5 }));
  [120, 180, 300, 360, 450, 520].forEach((x) => seg(d, x, y(2), 40, 'stmt', { size: 8.5 }));
  d.text(355, 270, 'transaction mode breaks session state: SET, LISTEN, session advisory locks, temp tables', { cls: 'xs' });
  return d.svg();
}

export function be_db_conn_math() {
  const d = fig('be_db_conn_math', 'AUTOSCALING MULTIPLIES CONNECTIONS: 20 INSTANCES × 10 = 200 > 97 AVAILABLE', 320);
  for (let i = 0; i < 20; i++) { const x = 30 + (i % 10) * 34, y = 60 + Math.floor(i / 10) * 70; d.during([i < 4 ? 0 : 0.1 + (i - 4) * 0.035, 1], (g) => g.server(x, y, 26, 44, { unit: 12, fill: i < 4 ? C.card : C.accFaint, stroke: i < 4 ? C.ink2 : C.acc })); }
  d.text(200, 210, '4 instances → 20 at peak', { cls: 'sm' });
  d.during([0, 0.5], (g) => gauge(g, 500, 160, 80, 40 / 97, { value: '40 / 97', label: 'max_connections 100' }));
  d.during([0.5, 1], (g) => gauge(g, 500, 160, 80, 1, { value: '200 / 97', hot: true, label: 'FATAL: too many clients' }));
  d.text(320, 290, 'budget connections for the maximum instance count, or put a pooler in between', { cls: 'xs' });
  return d.svg();
}

export function be_db_e2e() {
  const d = fig('be_db_e2e', 'THE ORDER WRITE IN THE DATA LAYER: 18.55 MS FROM BORROW TO RETURN', 320);
  const X = (ms) => 40 + ms * 30;
  const s = [['borrow', 0, 0.05], ['BEGIN', 0.05, 0.55], ['SELECT items', 0.55, 4.55], ['INSERT order', 4.55, 8.55], ['INSERT items', 8.55, 12.55], ['INSERT outbox', 12.55, 16.55], ['COMMIT', 16.55, 18.55]];
  s.forEach(([t, a, b], i) => { const y = i % 2 ? 150 : 110; seg(d, X(a), 130, Math.max(4, X(b) - X(a)), '', { hot: i === 6, h: 26 }); d.text((X(a) + X(b)) / 2, i % 2 ? 160 : 100, t, { cls: 'mono', size: 9, color: i === 6 ? C.acc : undefined }); d.line((X(a) + X(b)) / 2, i % 2 ? 152 : 108, (X(a) + X(b)) / 2, i % 2 ? 144 : 117, { stroke: C.gray, single: true }); });
  d.travel([[X(0), 130], [X(18.55), 130]], { r: 6, dur: 6 });
  for (let ms = 0; ms <= 18; ms += 2) { d.line(X(ms), 190, X(ms), 196, { stroke: C.gray, single: true }); d.mono(X(ms), 206, String(ms), { size: 9 }); }
  d.line(X(0), 190, X(18.55), 190, { stroke: C.gray, single: true }); d.text(X(18.55), 222, 'ms', { cls: 'xs' });
  d.text(320, 260, 'one connection, one transaction, five statements, then the connection goes back', { cls: 'sm' });
  d.text(320, 290, 'illustrative timings: 4 ms per statement, 0.5 ms for BEGIN, 2 ms for COMMIT to flush the WAL', { cls: 'xs' });
  return d.svg();
}

export function be_db_dominoes() {
  const d = fig('be_db_dominoes', 'HOW A SLOW DATABASE TOPPLES THE SERVICE', 300);
  const t = ['query 4 ms → 2 s', 'each request holds a connection 4 s', 'pool needs 200, has 10', 'requests wait 250 ms', '503s and client retries', 'retries add load'];
  t.forEach((s, i) => {
    const x = 50 + i * 95, y = 90;
    const draw = (g, ang) => g.wrap((h) => h.rect(x, y, 26, 90, { r: 3, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }), `<g transform="rotate(${ang} ${x + 26} ${y + 90})">`);
    d.during([0, 0.1 + i * 0.12], (g) => draw(g, 0));
    d.during([0.1 + i * 0.12, 1], (g) => draw(g, 28));
    d.text(x + 14, 210 + (i % 2) * 22, s, { cls: 'xs' });
  });
  d.carrow([[560, 250], [320, 285], [70, 250]], { stroke: C.acc, dash: [4, 3] }); d.text(320, 272, 'feedback loop', { cls: 'hand', size: 15 });
  return d.svg();
}

export function be_db_failover() {
  const d = fig('be_db_failover', 'PRIMARY FAILOVER AS THE APP SEES IT', 320);
  d.server(40, 120, 70, 80, { label: 'app pool' });
  d.db(250, 50, 120, 90, { label: 'primary' }); d.db(250, 190, 120, 90, { label: 'replica' });
  d.during([0.2, 1], (g) => cross(g, 310, 95, 30));
  d.during([0.45, 1], (g) => { g.db(250, 190, 120, 90, { label: 'new primary', stroke: C.acc, fill: C.accFaint }); });
  d.during([0, 0.2], (g) => g.arrow(114, 150, 244, 100, { stroke: C.ink2 }));
  d.during([0.6, 1], (g) => g.arrow(114, 170, 244, 230, { stroke: C.acc }));
  const notes = ['1. primary dies; open connections error', '2. pool evicts broken connections', '3. replica promoted (about 30 s)', '4. DNS or proxy points to it', '5. idempotent requests retry'];
  notes.forEach((s, i) => d.during([i * 0.18, 1], (g) => g.text(400, 80 + i * 34, s, { cls: 'sm', a: 'start' })));
  d.text(320, 304, 'writes in flight at the crash may or may not have committed; idempotency keys sort that out', { cls: 'xs' });
  return d.svg();
}

export function be_db_components() {
  const d = fig('be_db_components', 'THE UNIT ON ONE PAGE: FROM A LINE OF CODE TO A ROW ON DISK', 340);
  const stops = [['code', 'ORM or SQL', 50], ['pool', 'borrow, timeouts', 150], ['transaction', 'boundary, isolation', 260], ['locks', 'rows, versions', 370], ['primary', 'WAL, constraints', 470], ['replicas', 'lag, routing', 570]];
  d.line(50, 170, 570, 170, { stroke: C.line, sw: 3, single: true });
  d.flowline([[50, 170], [570, 170]], { gap: 12, dur: 1.6 });
  stops.forEach(([t, s, x], i) => {
    d.circle(x, 170, 40, { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 });
    d.text(x, i % 2 ? 218 : 116, t, { cls: 'ttl', size: 11 }); d.text(x, i % 2 ? 236 : 134, s, { cls: 'xs' });
  });
  d.doc(40, 156, 20, 26, { lines: false }); d.lock(361, 158, 18); d.gear(150, 170, 12); d.clock(260, 170, 24, { t: 0.2 });
  d.text(320, 290, 'migrations change the shape of the tables underneath, while all of this keeps running', { cls: 'sm' });
  d.text(320, 316, 'every stop has a limit: pool size, timeout, lock wait, max_connections, lag', { cls: 'xs' });
  return d.svg();
}

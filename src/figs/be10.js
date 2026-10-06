import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble, shield } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Rate limiting', 'More limiting algorithms', 'Distributed and security limits', 'Timeouts', 'Retries', 'Circuit breakers and bulkheads', 'Webhooks', 'Third-party APIs', 'Email', 'The payment call end to end'];
export const where_be_res = (stage = 99) => beMap('where_be_res', PARTS, stage);

function bucket(d, x, y, w, h, level, o = {}) {
  d.path(`M${x},${y} L${x + 8},${y + h} L${x + w - 8},${y + h} L${x + w},${y}`, { stroke: o.stroke ?? C.ink2, sw: 1.4 });
  const lv = Math.max(0, Math.min(1, level)), top = y + h - lv * h;
  if (lv > 0) d.poly([[x + 8 * (1 - (top - y) / h) + 1, top], [x + w - 8 * (1 - (top - y) / h) - 1, top], [x + w - 9, y + h - 1], [x + 9, y + h - 1]], { fill: o.fill ?? C.accSoft, stroke: 'none' });
}

function breaker(d, x, y, state) {
  d.rect(x, y, 70, 100, { r: 8, fill: C.card, stroke: C.ink2 });
  d.rect(x + 22, y + 20, 26, 60, { r: 4, fill: C.paper, stroke: C.ink2 });
  const up = state === 'closed';
  d.rect(x + 25, up ? y + 23 : y + 50, 20, 27, { r: 3, fill: state === 'open' ? C.acc : (state === 'half' ? C.accSoft : C.ink2), stroke: C.ink2 });
  d.text(x + 35, y + 114, state === 'half' ? 'half-open' : state, { cls: 'xs', color: state === 'open' ? C.acc : undefined });
}

function sealed(d, x, y, w, h, label) {
  d.envelope(x, y, w, h, { stroke: C.ink2 });
  d.circle(x + w / 2, y + h * 0.58, h * 0.42, { fill: C.acc, stroke: C.acc });
  if (label) d.mono(x + w / 2, y + h + 12, label, { size: 9 });
}

export const cover_be_res = () => beCover('cover_be_res', 'X', ['Rate limits and', 'resilience'], 'Limits, timeouts, retries, breakers, webhooks and email', (d, y) => {
  bucket(d, 60, y + 60, 120, 140, 0.55); d.path(`M100,${y + 20} L100,${y + 40} L130,${y + 40}`, { stroke: C.ink2, sw: 3 }); for (let i = 0; i < 3; i++) d.travel([[120, y + 44], [120, y + 150]], { r: 4, at: [i * 0.33, i * 0.33 + 0.3] });
  breaker(d, 300, y + 80, 'open');
  sealed(d, 450, y + 100, 120, 76, 'POST /webhooks/stripe');
  d.hand(330, y + 260, 'assume every dependency will fail', { size: 18 });
}, [['Rate limits', 'windows and buckets'], ['Timeouts and retries', 'deadlines, budgets, jitter'], ['Breakers', 'fail fast, bulkheads, fallbacks'], ['Integrations', 'webhooks, providers, email']]);

export function be_rl_why() {
  const d = fig('be_rl_why', 'A RATE LIMIT IS A TURNSTILE; THE KEY DECIDES WHO SHARES WHICH ONE', 320);
  [['per user', 'user 42: 100/min'], ['per IP', '203.0.113.7: 300/min'], ['per API key', 'partner p9: 50/s'], ['global', 'search: 2,000/s']].forEach(([t, s], i) => {
    const x = 80 + i * 150;
    d.line(x - 30, 200, x + 30, 200, { stroke: C.ink2, sw: 2, single: true }); d.line(x, 120, x, 200, { stroke: C.ink2, sw: 2, single: true });
    d.spin(x, 140, (g) => { [0, 1, 2].forEach((k) => { const a = k * 2.094; g.line(x, 140, x + Math.cos(a) * 28, 140 + Math.sin(a) * 28, { stroke: i === 0 ? C.acc : C.ink2, sw: 2.2, single: true }); }); }, { dur: 3 + i });
    d.text(x, 226, t, { cls: 'ttl', size: 11, color: i === 0 ? C.acc : undefined }); d.text(x, 244, s, { cls: 'mono', size: 8.5 });
  });
  crowd(d, 30, 80, 3, { s: 18, gap: 16 });
  d.text(320, 290, 'fairness between users, protection for the service, and a ceiling on cost and abuse', { cls: 'xs' });
  return d.svg();
}

export function be_rl_429() {
  const d = fig('be_rl_429', 'A GOOD 429 TELLS THE CLIENT WHEN TO COME BACK', 280);
  card(d, 30, 60, 330, ['HTTP/1.1 429 Too Many Requests', 'Retry-After: 18', 'RateLimit-Policy: "user";q=100;w=60', 'RateLimit: "user";r=0;t=18', 'Content-Type: application/problem+json'], { size: 10, hot: [1] });
  d.clock(470, 120, 80, { t: 18 / 60 }); d.text(470, 176, 'try again in 18 s', { cls: 'sm', color: C.acc });
  d.text(320, 240, 'limits measured per window: q is the quota, w the window, r what remains, t seconds until reset', { cls: 'xs' });
  return d.svg();
}

export function be_rl_fixed() {
  const d = fig('be_rl_fixed', 'FIXED WINDOW: 100 PER MINUTE, YET 200 GET THROUGH IN TWO SECONDS', 300);
  const X = (s) => 60 + s * 4.2;
  [0, 60, 120].forEach((s) => { d.line(X(s), 70, X(s), 210, { stroke: C.ink2, single: true }); d.mono(X(s), 226, `${String(Math.floor(s / 60)).padStart(2, '0')}:00`, { size: 9 }); });
  d.text(X(30), 62, 'window 1: count 100', { cls: 'xs' }); d.text(X(90), 62, 'window 2: count 100', { cls: 'xs' });
  for (let i = 0; i < 20; i++) { d.dot(X(59) - i * 0.6, 200 - i * 6, 2.4, C.acc); d.dot(X(61) + i * 0.6, 200 - i * 6, 2.4, C.acc); }
  d.brace(X(58), X(62), 66, { dir: -1, label: '', cls: 'xs' }); d.text(X(60), 248, '100 at 00:59 + 100 at 01:00', { cls: 'mono', size: 9.5, color: C.acc });
  card(d, 380, 100, 240, ['INCR rl:42:2026-10-06T20:05', 'EXPIRE … 60  (first hit)', 'allow if count ≤ 100'], { size: 9 });
  d.text(320, 284, 'one counter per key per window: cheap, simple, and bursty at the edges', { cls: 'xs' });
  return d.svg();
}

export function be_rl_log() {
  const d = fig('be_rl_log', 'SLIDING WINDOW LOG: KEEP EVERY TIMESTAMP, COUNT THE LAST 60 S', 280);
  d.line(40, 140, 600, 140, { stroke: C.line, sw: 2, single: true });
  const ts = [20, 45, 60, 95, 130, 170, 200, 240, 260, 300, 330, 370, 410, 450, 480, 520, 560];
  ts.forEach((x) => d.dot(40 + x, 140, 4, C.ink2));
  d.shift(160, 0, (g) => { g.rect(140, 110, 300, 60, { r: 6, fill: C.accFaint, stroke: C.acc }); g.text(290, 100, 'last 60 s', { cls: 'xs', color: C.acc }); }, { at: [0, 1], dur: 8, back: true });
  card(d, 40, 196, 360, ['ZREMRANGEBYSCORE rl:42 0 (now − 60000)', 'ZCARD rl:42 → allow if < 100', 'ZADD rl:42 now now   PEXPIRE rl:42 60000'], { size: 9 });
  d.text(510, 220, 'exact, but 100 entries\nper user: about 6.4 KB', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_rl_counter() {
  const d = fig('be_rl_counter', 'SLIDING WINDOW COUNTER: WEIGHT THE PREVIOUS WINDOW BY HOW MUCH OF IT STILL OVERLAPS', 300);
  d.rect(60, 120, 240, 60, { r: 3, fill: C.card }); d.text(180, 150, 'previous minute: 84', { cls: 'mono', size: 10 });
  d.rect(300, 120, 240, 60, { r: 3, fill: C.card }); d.text(420, 150, 'current: 36', { cls: 'mono', size: 10 });
  d.rect(120, 110, 240, 80, { r: 6, fill: C.accFaint, stroke: C.acc, dash: [5, 4] }); d.text(240, 100, 'sliding 60 s, 25% into the minute', { cls: 'xs', color: C.acc });
  d.text(320, 230, '84 × 0.75 + 36 = 99 → one more request allowed', { cls: 'mono', size: 11, color: C.acc });
  d.text(320, 262, 'two counters per key; assumes the previous minute\'s requests were spread evenly', { cls: 'xs' });
  return d.svg();
}

export function be_rl_token() {
  const d = fig('be_rl_token', 'TOKEN BUCKET: 20 TOKENS OF BURST, REFILLED AT 1.67 PER SECOND', 320);
  bucket(d, 200, 100, 160, 160, 0.4);
  d.path('M240,50 L240,76 L272,76', { stroke: C.ink2, sw: 3 }); for (let i = 0; i < 3; i++) d.travel([[280, 82], [280, 230]], { r: 5, at: [i * 0.33, i * 0.33 + 0.25] });
  d.text(330, 60, 'refill 100/min = 1.67/s', { cls: 'mono', size: 9.5, a: 'start' });
  for (let i = 0; i < 8; i++) d.circle(226 + (i % 4) * 30, 230 - Math.floor(i / 4) * 22, 18, { fill: C.acc, stroke: C.acc });
  d.text(280, 282, '8 of 20 tokens', { cls: 'xs' });
  crowd(d, 470, 160, 3, { s: 24, gap: 36 }); d.arrow(460, 190, 372, 220, { stroke: C.ink2 }); d.text(520, 214, 'each request takes 1', { cls: 'xs' });
  d.text(320, 306, 'empty bucket: wait 0.6 s per token; full again from empty in 12 s', { cls: 'xs' });
  return d.svg();
}

export function be_rl_leaky() {
  const d = fig('be_rl_leaky', 'LEAKY BUCKET: REQUESTS POUR IN UNEVENLY AND LEAVE AT A STEADY RATE', 320);
  bucket(d, 220, 90, 160, 150, 0.85);
  for (let i = 0; i < 6; i++) d.travel([[260 + i * 15, 30], [260 + i * 15, 110]], { r: 4, at: [i * 0.08, i * 0.08 + 0.2] });
  d.line(300, 240, 300, 262, { stroke: C.ink2, sw: 2, single: true }); for (let i = 0; i < 3; i++) d.travel([[300, 262], [300, 306]], { r: 3, at: [i * 0.33, i * 0.33 + 0.2], color: C.ink2 });
  d.text(330, 290, 'out: 1.67/s, evenly spaced', { cls: 'mono', size: 9.5, a: 'start' });
  d.travel([[384, 100], [440, 140], [450, 250]], { r: 4, at: [0.5, 0.9] }); d.text(500, 210, 'overflow: rejected', { cls: 'xs', color: C.acc });
  d.text(110, 160, 'a queue that\nsmooths bursts\ninto a flow', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_rl_gcra() {
  const d = fig('be_rl_gcra', 'GCRA: ONE TIMESTAMP PER KEY DOES THE WORK OF A TOKEN BUCKET', 300);
  const X = (s) => 60 + s * 30;
  d.line(X(0), 140, X(17), 140, { stroke: C.line, sw: 2, single: true });
  d.dot(X(2), 140, 6, C.ink); d.text(X(2), 162, 'now', { cls: 'xs' });
  d.dot(X(12), 140, 6, C.acc); d.text(X(12), 162, 'TAT', { cls: 'mono', size: 9.5, color: C.acc });
  d.brace(X(2), X(12), 120, { dir: -1, label: 'TAT − now = 10 s ≤ τ = 11.4 s, so allow', cls: 'xs' });
  d.text(320, 210, 'emission interval T = 60 ÷ 100 = 0.6 s; burst tolerance τ = (20 − 1) × 0.6 = 11.4 s', { cls: 'mono', size: 9.5 });
  d.text(320, 240, 'on allow: TAT = max(TAT, now) + T. One key, one Lua script, no refill timer', { cls: 'xs' });
  return d.svg();
}

export function be_rl_compare() {
  const d = fig('be_rl_compare', 'FIVE ALGORITHMS SIDE BY SIDE', 320);
  sheet(d, 20, 50, [['algorithm', 140], ['state per key', 120], ['bursts', 150], ['accuracy', 190]], [['fixed window', '1 counter', '2× at window edges', 'coarse'], ['sliding log', 'every timestamp', 'none beyond limit', 'exact, memory-heavy'], ['sliding counter', '2 counters', 'smoothed', 'close, assumes even spread'], ['token bucket', 'tokens + time', 'up to capacity', 'exact, allows chosen burst'], ['leaky bucket', 'queue or TAT', 'smoothed out', 'steady output rate']], { rh: 38, size: 9.5, hot: [3] });
  return d.svg();
}

export function be_rl_redis_race() {
  const d = fig('be_rl_redis_race', 'INCR THEN EXPIRE IS TWO COMMANDS; A CRASH BETWEEN THEM LOCKS A USER OUT FOREVER', 320);
  const y = lanes(d, ['app', 'Redis key rl:42'], { y: 80, gap: 90, x0: 120, x1: 610, time: false });
  seg(d, 130, y(0), 90, 'INCR → 1'); bolt(d, 250, y(0) - 30, 0.8); seg(d, 290, y(0), 90, 'EXPIRE 60', { dash: [3, 3], fill: C.paper });
  seg(d, 130, y(1), 460, 'count grows, no TTL, never resets', { hot: true });
  card(d, 120, 210, 400, ['local n = redis.call("INCR", KEYS[1])', 'if n == 1 then redis.call("EXPIRE", KEYS[1], 60) end', 'return n'], { size: 9.5 });
  return d.svg();
}

export function be_rl_local_global() {
  const d = fig('be_rl_local_global', 'LOCAL LIMITS ARE FAST BUT INEXACT; A SHARED LIMIT IS EXACT BUT COSTS A ROUND TRIP', 320);
  panel(d, 20, 40, 290, 250, 'per instance: 100 ÷ 20 = 5'); panel(d, 330, 40, 290, 250, 'shared in Redis', true);
  for (let i = 0; i < 10; i++) { const x = 40 + (i % 5) * 52, y = 80 + Math.floor(i / 5) * 76; d.server(x, y, 36, 50, { unit: 12 }); d.mono(x + 18, y + 64, '5', { size: 9 }); }
  d.text(165, 250, 'unlucky routing: the user is\nlimited at 5, or allowed 100', { cls: 'xs', vc: true });
  for (let i = 0; i < 5; i++) { const x = 350 + i * 52; d.server(x, 80, 36, 50, { unit: 12 }); hose(d, x + 18, 132, 475, 196, { th: 1.5 }); }
  d.db(430, 196, 90, 60, { label: 'rl:42' }); d.text(475, 274, '+0.5 ms per request', { cls: 'xs' });
  return d.svg();
}

export function be_rl_security() {
  const d = fig('be_rl_security', 'LIMITS THAT ARE REALLY SECURITY CONTROLS', 340);
  [['login', '5 per account per minute\n+ per IP, + global anomaly'], ['OTP check', '5 tries per code,\ncode lives 10 min'], ['password reset', '3 per account per hour,\nsame reply either way'], ['expensive search', 'cost-weighted tokens\nper user']].forEach(([t, s], i) => { const x = 30 + (i % 2) * 300, y = 50 + Math.floor(i / 2) * 140; d.rect(x, y, 280, 120, { r: 8, fill: i === 1 ? C.accFaint : C.paper, stroke: i === 1 ? C.acc : C.line }); d.lock(x + 20, y + 20, 30, { stroke: i === 1 ? C.acc : C.ink2 }); d.text(x + 70, y + 30, t, { cls: 'ttl', a: 'start' }); d.text(x + 70, y + 70, s, { cls: 'xs', a: 'start', vc: true }); });
  d.text(320, 326, 'a 6-digit OTP at 5 tries per code: a 0.0005% chance per code; unlimited at 100/s: all codes in 2.8 h', { cls: 'xs' });
  return d.svg();
}

export function be_to_kinds() {
  const d = fig('be_to_kinds', 'ONE HTTP CALL, FIVE PLACES TO WAIT, A LIMIT FOR EACH', 300);
  const X = (ms) => 50 + ms * 0.9;
  [['DNS', 0, 30, 'resolver timeout'], ['connect + TLS', 30, 120, 'connect 200 ms'], ['write request', 120, 140, 'write'], ['wait for first byte', 140, 450, 'read 1 s'], ['read body', 450, 560, 'idle read']].forEach(([s, a, b, t], i) => { seg(d, X(a), 120, X(b) - X(a) - 2, s, { hot: i === 3, size: 8.5 }); d.text((X(a) + X(b)) / 2, 150, t, { cls: 'xs' }); });
  d.line(X(0), 90, X(560), 90, { stroke: C.acc, sw: 2, single: true }); d.text(X(280), 78, 'overall request deadline 2 s', { cls: 'xs', color: C.acc });
  d.text(320, 220, 'a read timeout resets on every byte, so a server sending one byte a second never trips it', { cls: 'sm' });
  d.text(320, 250, 'only an overall deadline bounds the whole call', { cls: 'xs' });
  return d.svg();
}

export function be_to_defaults() {
  const d = fig('be_to_defaults', 'MANY CLIENTS WAIT FOREVER UNLESS TOLD OTHERWISE', 300);
  [['Python requests', 'no timeout'], ['Java HttpURLConnection', '0 = infinite'], ['Go http.Client{}', 'no timeout'], ['Node fetch', 'no overall deadline']].forEach(([a, b], i) => { const y = 70 + i * 50; d.clock(60, y, 36, { spin: 20 }); d.mono(90, y, a, { size: 10, a: 'start' }); d.text(330, y, b, { cls: 'sm', a: 'start', color: C.acc }); });
  d.text(500, 140, '∞', { size: 60, color: C.acc });
  d.text(320, 280, 'always set connect, read and overall timeouts explicitly on every client', { cls: 'xs' });
  return d.svg();
}

export function be_to_deadline() {
  const d = fig('be_to_deadline', 'DEADLINE PROPAGATION: A 300 MS FUSE THAT EVERY HOP CAN SEE BURNING', 300);
  d.path('M40,140 C140,100 220,180 320,140 S500,100 600,140', { stroke: C.ink2, sw: 3 });
  d.shift(520, 0, (g) => { g.circle(40, 140, 16, { fill: C.acc, stroke: C.acc }); }, { at: [0, 1], dur: 6 });
  [['gateway', 40, '300 ms left'], ['orders', 200, '280 ms'], ['pricing', 360, '190 ms'], ['DB', 520, '150 ms']].forEach(([s, x, t], i) => { d.server(x - 18, 180, 36, 46, { unit: 12, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x, 244, s, { cls: 'xs' }); d.mono(x, 262, t, { size: 9 }); });
  d.text(320, 70, 'grpc-timeout header or context deadline: each hop gets what is left, not a fresh 300 ms', { cls: 'xs' });
  return d.svg();
}

export function be_to_cascade() {
  const d = fig('be_to_cascade', 'C TAKES 30 S INSTEAD OF 30 MS, AND THE WAITING SPREADS UPSTREAM', 320);
  [['A', 60], ['B', 220], ['C', 380]].forEach(([s, x], i) => { d.server(x, 90, 90, 110, { label: s, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); if (i < 2) d.arrow(x + 94, 145, x + 156, 145, { stroke: C.ink2 }); });
  d.db(530, 110, 80, 80, { label: 'DB' }); d.arrow(474, 145, 526, 145, { stroke: C.ink2 });
  for (let k = 0; k < 8; k++) { d.during([0.1 + k * 0.08, 1], (g) => g.dot(240 + (k % 4) * 16, 120 + Math.floor(k / 4) * 16, 5, C.acc)); d.during([0.5 + k * 0.06, 1], (g) => g.dot(80 + (k % 4) * 16, 120 + Math.floor(k / 4) * 16, 5, C.acc)); }
  d.text(265, 230, 'B\'s 200 threads all waiting on C', { cls: 'xs', color: C.acc }); d.text(105, 230, 'then A\'s', { cls: 'xs', color: C.acc });
  d.text(320, 280, 'B needs 200 req/s × 30 s = 6,000 concurrent calls and has 200; full in 1 s. With a 100 ms timeout: 20', { cls: 'xs' });
  return d.svg();
}

export function be_retry_classes() {
  const d = fig('be_retry_classes', 'SORT ERRORS INTO "TRY AGAIN" AND "STOP"', 320);
  d.path('M60,150 L90,280 L250,280 L280,150', { stroke: C.ink2, sw: 1.4 }); d.text(170, 140, 'retry with backoff', { cls: 'ttl', color: C.acc });
  ['connect refused', 'timeout (idempotent)', '429 + Retry-After', '502, 503, 504', 'connection reset'].forEach((s, i) => d.chips(80, 166 + i * 22, [s], { h: 18, size: 8.5, fill: C.accSoft, stroke: C.acc }));
  d.path('M360,150 L390,280 L550,280 L580,150', { stroke: C.ink2, sw: 1.4 }); d.text(470, 140, 'fail, log, maybe DLQ', { cls: 'ttl' });
  ['400 bad request', '401, 403', '404', '409 conflict', '422 validation'].forEach((s, i) => d.chips(400, 166 + i * 22, [s], { h: 18, size: 8.5 }));
  d.text(320, 60, 'retrying a timeout is safe only if the call is idempotent or carries an idempotency key', { cls: 'sm' });
  return d.svg();
}

export function be_retry_amplify() {
  const d = fig('be_retry_amplify', 'THREE LAYERS, EACH WITH 3 RETRIES: ONE USER CLICK BECOMES 64 CALLS AT THE BOTTOM', 340);
  const lv = [1, 4, 16, 64];
  lv.forEach((n, L) => { const y = 60 + L * 80, show = Math.min(n, 32); for (let i = 0; i < show; i++) { const x = 320 + (i - (show - 1) / 2) * (L === 3 ? 18 : 600 / (show + 1)); d.circle(x, y, L === 3 ? 10 : 16, { fill: L === 3 ? C.accSoft : C.card, stroke: L === 3 ? C.acc : C.ink2 }); } d.text(40, y, ['user', 'gateway', 'orders', 'payments'][L], { cls: 'xs', a: 'start' }); d.mono(600, y, `${n}`, { size: 10, a: 'end', color: L === 3 ? C.acc : undefined }); });
  d.text(320, 326, 'retry at one layer only, usually the one closest to the user, and pass "do not retry" downward', { cls: 'xs' });
  return d.svg();
}

export function be_retry_budget() {
  const d = fig('be_retry_budget', 'A RETRY BUDGET: RETRIES MAY ADD AT MOST 10% TO NORMAL TRAFFIC', 300);
  bucket(d, 80, 90, 120, 130, 0.3, { fill: C.slateSoft });
  d.text(140, 240, 'each success adds 0.1 token;\neach retry spends 1', { cls: 'xs', vc: true });
  const M = d.axes(300, 60, 280, 170, { xmin: 0, xmax: 100, ymin: 0, ymax: 2000, xl: '% of calls failing', yl: 'calls/s' });
  d.fn((p) => 1000 * (1 + p / 100 * 3), 0, 100, M, { stroke: C.acc });
  d.fn((p) => 1000 + Math.min(100, 1000 * p / 100 * 3), 0, 100, M, { stroke: C.slate, dash: [5, 4] });
  d.text(M.X(60), M.Y(1900), '3 retries each: up to 4,000/s', { cls: 'xs', color: C.acc });
  d.text(M.X(60), M.Y(1180), 'budget: at most 1,100/s', { cls: 'xs' });
  return d.svg();
}

export function be_retry_hedge() {
  const d = fig('be_retry_hedge', 'A HEDGED REQUEST: IF NO ANSWER BY THE p95, ASK A SECOND REPLICA', 280);
  const y = lanes(d, ['replica 1', 'replica 2'], { y: 90, gap: 80, x0: 110, x1: 610, tl: 'ms' });
  const X = (ms) => 120 + ms * 1.6;
  seg(d, X(0), y(0), X(260) - X(0), 'slow: 260 ms', { fill: C.paper, dash: [4, 3] });
  d.line(X(40), 60, X(40), 200, { stroke: C.acc, dash: [3, 3], single: true }); d.text(X(40), 50, 'p95 = 40 ms', { cls: 'mono', size: 9, color: C.acc });
  seg(d, X(40), y(1), X(65) - X(40), '25 ms', { hot: true }); d.text(X(70), y(1) - 20, 'first answer wins at 65 ms; cancel the other', { cls: 'xs', a: 'start' });
  d.text(320, 250, 'about 5% extra load buys a much shorter tail; only for idempotent reads', { cls: 'xs' });
  return d.svg();
}

export function be_cb_states() {
  const d = fig('be_cb_states', 'A CIRCUIT BREAKER: CLOSED, OPEN, HALF-OPEN', 320);
  breaker(d, 60, 90, 'closed'); breaker(d, 285, 90, 'open'); breaker(d, 510, 90, 'half');
  d.carrow([[134, 110], [210, 70], [280, 110]], { stroke: C.acc }); d.text(210, 56, '50% of last 20 calls failed', { cls: 'xs', color: C.acc });
  d.carrow([[360, 110], [440, 70], [506, 110]], { stroke: C.ink2 }); d.text(440, 56, 'after 30 s', { cls: 'xs' });
  d.carrow([[540, 220], [320, 290], [100, 220]], { stroke: C.ink2 }); d.text(320, 300, 'probes succeed', { cls: 'xs' });
  d.carrow([[506, 160], [440, 190], [360, 160]], { stroke: C.acc, dash: [4, 3] }); d.text(440, 206, 'probe fails', { cls: 'xs', color: C.acc });
  d.text(320, 250, 'open: fail in microseconds, no call made', { cls: 'sm' });
  return d.svg();
}

export function be_cb_timeline() {
  const d = fig('be_cb_timeline', 'THE PAYMENT PROVIDER WOBBLES: WHAT THE BREAKER DOES MINUTE BY MINUTE (ILLUSTRATIVE)', 300);
  const M = d.axes(70, 60, 500, 150, { xmin: 0, xmax: 10, ymin: 0, ymax: 100, xl: 'minutes', yl: '% failing' });
  d.fn((t) => (t < 2 ? 2 : t < 6 ? 80 : 3), 0, 10, M, { n: 200 });
  [['closed', 0, 2.2], ['open', 2.2, 2.7], ['half', 2.7, 2.8], ['open', 2.8, 6.2], ['half', 6.2, 6.4], ['closed', 6.4, 10]].forEach(([s, a, b]) => d.rect(M.X(a), 230, M.X(b) - M.X(a), 16, { r: 2, fill: s === 'open' ? C.accSoft : (s === 'half' ? C.slateSoft : C.card), stroke: s === 'open' ? C.acc : C.line }));
  d.text(M.X(4.5), 262, 'open: callers get a fast fallback instead of 2 s timeouts', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_bulkhead() {
  const d = fig('be_bulkhead', 'BULKHEADS: ONE FLOODED COMPARTMENT DOES NOT SINK THE SHIP', 300);
  d.path('M40,120 L600,120 L560,230 L80,230 Z', { stroke: C.ink2, sw: 1.6, fill: C.card });
  [180, 320, 460].forEach((x) => d.line(x, 120, x - 6, 230, { stroke: C.ink2, sw: 2, single: true }));
  d.fillRect(184, 160, 132, 68, C.accSoft, 0.9); d.text(250, 140, 'payments: 20 threads', { cls: 'xs', color: C.acc });
  d.text(110, 140, 'kitchen: 20', { cls: 'xs' }); d.text(390, 140, 'menus: 80', { cls: 'xs' }); d.text(520, 140, 'everything else: 80', { cls: 'xs' });
  d.path('M30,240 Q120,226 220,240 T420,240 T620,240', { stroke: C.slate, sw: 1.2 });
  d.text(320, 280, 'a slow payment provider can exhaust only its own pool, never the menu endpoint\'s', { cls: 'xs' });
  return d.svg();
}

export function be_degrade() {
  const d = fig('be_degrade', 'GRACEFUL DEGRADATION: A DIMMER, NOT A SWITCH', 300);
  d.rect(60, 60, 50, 200, { r: 25, fill: C.card, stroke: C.ink2 }); d.circle(85, 170, 34, { fill: C.acc, stroke: C.acc });
  [['full service', 80], ['recommendations off', 120], ['menus from cache, stale up to 10 min', 160], ['ordering by queue, confirm later', 200], ['read-only: browse, no orders', 240]].forEach(([s, y], i) => { d.line(116, y, 140, y, { stroke: C.gray, single: true }); d.text(150, y, s, { cls: 'sm', a: 'start', color: i === 2 ? C.acc : undefined }); });
  d.text(480, 160, 'each level is decided\nin advance, behind a flag,\nand tested', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_wh_flow() {
  const d = fig('be_wh_flow', 'RECEIVING A WEBHOOK: VERIFY, STORE, ANSWER FAST, WORK LATER', 320);
  d.cloud(20, 90, 120, 70, { label: 'Stripe' });
  sealed(d, 160, 110, 60, 38);
  d.travel([[150, 130], [250, 130]], { token: 'packet', at: [0, 0.25] });
  steps(d, [['verify', 'HMAC + time'], ['persist', 'event id unique'], ['200 OK', 'under 2 s']], 100, 2, { x0: 250, w: 100, gap: 20, h: 56 });
  d.arrow(400, 160, 400, 210, { stroke: C.gray, hl: 5 }); d.db(360, 214, 80, 56, { label: 'inbox' });
  d.arrow(444, 240, 500, 240, { stroke: C.gray, hl: 5 }); d.gear(530, 240, 20, { spin: 4 }); d.text(530, 276, 'worker: process', { cls: 'xs' });
  d.text(320, 306, 'slow processing inside the request causes timeouts, and the provider retries, so duplicates multiply', { cls: 'xs' });
  return d.svg();
}

export function be_wh_hmac() {
  const d = fig('be_wh_hmac', 'CHECKING A SIGNATURE: RECOMPUTE THE HMAC OVER TIMESTAMP AND RAW BODY', 300);
  card(d, 20, 60, 330, ['Stripe-Signature: t=1791200000,', '  v1=5257a869e7ec…'], { size: 9.5 });
  d.text(185, 130, 'signed payload = "1791200000" + "." + raw body', { cls: 'mono', size: 9 });
  d.key(60, 180, 40, { stroke: C.acc }); d.text(120, 182, 'whsec_… secret', { cls: 'mono', size: 9, a: 'start' });
  d.gear(300, 190, 24, { spin: 6 }); d.text(300, 226, 'HMAC-SHA256', { cls: 'xs' });
  d.arrow(330, 190, 420, 190, { stroke: C.ink2 }); d.box(430, 172, 180, 36, 'compare in constant time', { r: 6, size: 10, fill: C.accSoft, stroke: C.acc });
  d.text(320, 270, 'use the raw bytes: re-serialized JSON changes spacing and breaks the signature', { cls: 'xs' });
  return d.svg();
}

export function be_wh_replay() {
  const d = fig('be_wh_replay', 'A REPLAYED WEBHOOK: VALID SIGNATURE, STALE TIMESTAMP', 280);
  const X = (m) => 60 + m * 40;
  d.line(X(0), 140, X(13), 140, { stroke: C.line, sw: 2, single: true });
  d.dot(X(0), 140, 6, C.ink); d.text(X(0), 160, 'signed 20:00', { cls: 'xs' });
  d.rect(X(0), 120, X(5) - X(0), 40, { r: 6, fill: C.accFaint, stroke: C.acc, dash: [4, 3] }); d.text(X(2.5), 110, 'tolerance 5 min', { cls: 'xs', color: C.acc });
  d.person(X(10), 70, 30, { stroke: C.acc }); d.dot(X(10), 140, 6, C.acc); d.text(X(10), 160, 'replayed 20:10', { cls: 'xs', color: C.acc }); cross(d, X(10), 190, 9);
  d.text(320, 240, 'reject if |now − t| > 300 s; the event id check catches replays inside the window', { cls: 'xs' });
  return d.svg();
}

export function be_wh_rotation() {
  const d = fig('be_wh_rotation', 'ROTATING A WEBHOOK SECRET WITHOUT DROPPING EVENTS', 280);
  const X = (h) => 60 + h * 20;
  seg(d, X(0), 100, X(24) - X(0), 'old secret valid', {}); seg(d, X(12), 150, X(26) - X(12), 'new secret valid', { hot: true });
  d.brace(X(12), X(24), 182, { label: 'overlap: provider signs with both; receiver accepts either', cls: 'xs' });
  d.text(320, 250, 'add the new secret, verify against both, switch the provider, then drop the old one', { cls: 'xs' });
  return d.svg();
}

export function be_wh_dupes() {
  const d = fig('be_wh_dupes', 'WEBHOOKS ARRIVE TWICE AND OUT OF ORDER; TREAT THEM AS HINTS', 300);
  [['evt_1 payment_intent.succeeded', 70], ['evt_2 charge.refunded', 110], ['evt_1 payment_intent.succeeded', 150]].forEach(([s, y], i) => { d.envelope(40, y - 12, 34, 22, { stroke: i === 2 ? C.acc : C.ink2 }); d.mono(84, y, s, { size: 9, a: 'start', color: i === 2 ? C.acc : undefined }); });
  d.text(110, 186, 'arrival order: 1, 2, 1 again', { cls: 'xs' });
  sheet(d, 380, 60, [['event_id', 100], ['seen', 90]], [['evt_1', 'yes'], ['evt_2', 'yes']], { size: 9.5 });
  d.text(475, 160, 'duplicate evt_1: skip', { cls: 'xs', color: C.acc });
  d.text(320, 236, 'for state, fetch the object from the provider\'s API and act on its current status', { cls: 'sm' });
  d.text(320, 264, 'then the order in which hints arrive stops mattering', { cls: 'xs' });
  return d.svg();
}

export function be_wh_sending() {
  const d = fig('be_wh_sending', 'WREN SENDING WEBHOOKS TO RESTAURANTS: SIGN, RETRY, AND EVENTUALLY STOP', 300);
  d.server(30, 100, 70, 80, { label: 'Wren' });
  const X = (i) => 160 + i * 70;
  ['now', '1 m', '5 m', '30 m', '2 h', '8 h', '24 h'].forEach((s, i) => { d.circle(X(i), 140, 24, { fill: i === 6 ? C.accSoft : C.card, stroke: i === 6 ? C.acc : C.ink2 }); d.mono(X(i), 172, s, { size: 8.5 }); });
  d.text(X(3), 106, 'retry schedule with jitter', { cls: 'xs' });
  d.text(320, 220, 'after 3 days of failures: disable the endpoint, email the restaurant, keep events for replay', { cls: 'sm' });
  d.text(320, 250, 'every delivery has an event id, a timestamp and an HMAC signature, and a 10 s timeout', { cls: 'xs' });
  return d.svg();
}

export function be_tp_wrapper() {
  const d = fig('be_tp_wrapper', 'WRAP EVERY PROVIDER: THE CALL SITS INSIDE LAYERS OF PROTECTION', 340);
  const rings = [['deadline 2 s', 150], ['circuit breaker', 128], ['retry budget + backoff', 106], ['rate limiter 100/s', 84], ['bulkhead pool 20', 62]];
  rings.forEach(([s, r], i) => { d.circle(220, 180, r * 2, { fill: i % 2 ? C.paper : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.text(220, 180 - r + 12, s, { cls: 'xs', color: i === 1 ? C.acc : undefined }); });
  d.cloud(170, 160, 100, 50, { label: 'provider' });
  card(d, 410, 80, 210, ['PaymentGateway.charge(', '  order, amount,', '  idempotency_key)', '→ Charged | Declined', '  | Unavailable'], { size: 9.5, hot: [3, 4] });
  d.text(515, 230, 'the rest of Wren sees Wren\'s\ntypes, never the provider\'s', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_tp_ratelimit() {
  const d = fig('be_tp_ratelimit', 'STAY UNDER THE PROVIDER\'S LIMIT ACROSS THE WHOLE FLEET', 300);
  for (let i = 0; i < 5; i++) { d.server(30, 50 + i * 46, 40, 38, { unit: 12 }); hose(d, 74, 69 + i * 46, 220, 160, { th: 1.5 }); }
  d.text(50, 290, '20 instances', { cls: 'xs' });
  d.rect(220, 120, 140, 80, { r: 8, fill: C.accFaint, stroke: C.acc }); d.text(290, 150, 'shared token bucket', { cls: 'xs', color: C.acc }); d.mono(290, 172, '95/s, burst 20', { size: 9.5 });
  d.arrow(364, 160, 440, 160, { stroke: C.acc }); d.cloud(450, 120, 150, 80, { label: 'provider\nlimit 100/s' });
  card(d, 380, 220, 240, ['X-RateLimit-Remaining: 12', 'X-RateLimit-Reset: 1791200060'], { size: 9 });
  return d.svg();
}

export function be_tp_token() {
  const d = fig('be_tp_token', 'CACHE THE OAUTH TOKEN AND REFRESH IT EARLY, ONCE', 280);
  const X = (s) => 60 + s * 0.14;
  seg(d, X(0), 110, X(3600) - X(0), 'access token valid 3,600 s', {});
  d.line(X(2880), 80, X(2880), 140, { stroke: C.acc, sw: 2, single: true }); d.text(X(2880), 70, 'refresh at 80%: 2,880 s', { cls: 'mono', size: 9, color: C.acc });
  seg(d, X(2880), 160, X(6480) - X(2880), 'next token', { hot: true });
  d.text(320, 220, 'one refresh per process, coalesced; on 401, refresh once and retry once', { cls: 'sm' });
  d.text(320, 250, 'a fleet that refreshes on every request can trip the provider\'s token endpoint limit', { cls: 'xs' });
  return d.svg();
}

export function be_tp_schema() {
  const d = fig('be_tp_schema', 'A TOLERANT READER: TAKE WHAT YOU NEED, IGNORE THE REST', 300);
  card(d, 30, 60, 260, ['{"id":"pi_3N…",', ' "status":"succeeded",', ' "amount":45000,', ' "new_field":{…},', ' "currency":"inr"}'], { size: 9.5, hot: [1, 2, 4] });
  d.arrow(300, 120, 360, 120, { stroke: C.acc });
  card(d, 370, 80, 240, ['Charge(', '  provider_id, status,', '  amount_paise, currency)'], { size: 9.5 });
  d.text(320, 220, 'unknown fields ignored; unknown enum values mapped to "unknown" and alerted, not crashed on', { cls: 'sm' });
  d.text(320, 250, 'recorded responses in contract tests catch the provider\'s changes before production does', { cls: 'xs' });
  return d.svg();
}

export function be_tp_outage() {
  const d = fig('be_tp_outage', 'WHEN THE PROVIDER IS DOWN: FALL BACK, QUEUE, OR SAY SO', 320);
  d.cloud(240, 50, 160, 80, { label: 'SMS provider A' }); cross(d, 320, 90, 30);
  d.server(40, 160, 70, 80, { label: 'Wren' });
  d.arrow(114, 180, 240, 110, { stroke: C.line, dash: [3, 3] });
  d.cloud(240, 200, 160, 80, { label: 'provider B' }); d.arrow(114, 210, 238, 236, { stroke: C.acc }); d.text(170, 250, 'failover', { cls: 'xs', color: C.acc });
  d.text(500, 100, 'payments: queue and\nconfirm later, or show\n"try again shortly"', { cls: 'xs', vc: true });
  d.text(500, 200, 'SMS and email: second\nprovider; maps: cached\ntiles; never block orders', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_mail_path() {
  const d = fig('be_mail_path', 'A RECEIPT\'S JOURNEY: APP, QUEUE, PROVIDER, SMTP, THE RECIPIENT\'S MAIL SERVER', 320);
  const st = [['app', 50], ['email queue', 160], ['provider (SES)', 290], ['recipient MX', 430], ['inbox', 570]];
  st.forEach(([s, x], i) => { if (i === 0) d.server(x - 25, 100, 50, 60, { unit: 12 }); else if (i === 1) { d.rect(x - 40, 110, 80, 40, { r: 6, fill: C.paper }); for (let k = 0; k < 3; k++) d.envelope(x - 32 + k * 22, 120, 18, 12); } else if (i === 4) { d.phone(x - 16, 90, 70); } else d.server(x - 30, 100, 60, 60, { unit: 12, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(x, 182, s, { cls: 'xs' }); });
  d.travel([[50, 130], [570, 130]], { token: 'packet', dur: 6 });
  d.text(360, 214, 'SMTP over TLS, port 25', { cls: 'mono', size: 9 });
  d.text(320, 256, 'the recipient\'s server looks up MX, checks SPF, DKIM and DMARC, then decides inbox, spam or reject', { cls: 'xs' });
  d.text(320, 282, 'transactional mail (receipts, resets) and bulk mail (promotions) use separate streams and domains', { cls: 'xs' });
  return d.svg();
}

export function be_mail_auth() {
  const d = fig('be_mail_auth', 'THREE CHECKS AT THE RECEIVING SERVER', 320);
  [['SPF', 'is this IP allowed\nto send for the\nenvelope domain?'], ['DKIM', 'does the signature\nverify with the key\npublished in DNS?'], ['DMARC', 'does SPF or DKIM pass\nfor the From: domain,\nand what if not?']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 2); d.text(x + 96, 100, s, { cls: 'xs', vc: true }); });
  d.text(116, 180, 'ip4:203.0.113.0/24\ninclude:amazonses.com', { cls: 'mono', size: 8.5, vc: true });
  d.key(300, 180, 40, { stroke: C.ink2 }); d.mono(323, 220, 's1._domainkey', { size: 8.5 });
  shield(d, 530, 160, 50, { label: 'p=reject', fill: C.accSoft, stroke: C.acc });
  return d.svg();
}

export function be_mail_dns() {
  const d = fig('be_mail_dns', 'THE DNS RECORDS BEHIND IT', 260);
  card(d, 20, 50, 600, ['mail.wren.example.  TXT "v=spf1 include:amazonses.com -all"', 's1._domainkey.mail.wren.example.  TXT "v=DKIM1; k=rsa; p=MIIBIjAN…"', '_dmarc.wren.example.  TXT "v=DMARC1; p=reject; rua=mailto:dmarc@wren.example"'], { size: 9.5, hot: [2] });
  d.text(320, 170, 'SPF allows at most 10 DNS lookups; DMARC reports (rua) show who sends mail as you', { cls: 'sm' });
  d.text(320, 200, 'since 2024 Gmail and Yahoo require SPF, DKIM and DMARC from senders of over 5,000 messages a day', { cls: 'xs' });
  return d.svg();
}

export function be_mail_bounces() {
  const d = fig('be_mail_bounces', 'BOUNCES AND COMPLAINTS FEED A SUPPRESSION LIST', 320);
  d.server(40, 120, 70, 80, { label: 'Wren' }); d.cloud(240, 110, 140, 70, { label: 'provider' });
  d.arrow(114, 150, 240, 150, { stroke: C.ink2 });
  d.arrow(380, 130, 470, 90, { stroke: C.ink2 }); d.text(530, 80, 'hard bounce: no such user', { cls: 'xs' });
  d.arrow(380, 150, 470, 150, { stroke: C.ink2 }); d.text(530, 150, 'soft bounce: retry for days', { cls: 'xs' });
  d.arrow(380, 170, 470, 210, { stroke: C.acc }); d.text(530, 220, 'complaint: "spam" button', { cls: 'xs', color: C.acc });
  d.carrow([[300, 190], [250, 260], [150, 260], [90, 210]], { stroke: C.acc, dash: [4, 3] }); d.text(200, 280, 'webhook → suppression list: never send again', { cls: 'xs', color: C.acc });
  d.text(320, 306, 'keep complaints below 0.3%, ideally below 0.1%, or inbox placement falls for every message', { cls: 'xs' });
  return d.svg();
}

export function be_mail_streams() {
  const d = fig('be_mail_streams', 'TRANSACTIONAL AND BULK MAIL: SEPARATE STREAMS, SEPARATE REPUTATIONS', 300);
  panel(d, 20, 40, 290, 230, 'transactional', true); panel(d, 330, 40, 290, 230, 'bulk');
  d.text(165, 80, 'receipts, resets, OTPs', { cls: 'xs' }); d.mono(165, 104, 'from: orders@mail.wren.example', { size: 8.5 }); gauge(d, 165, 200, 60, 0.92, { hot: true, value: 'reputation' });
  d.text(475, 80, 'promotions, newsletters', { cls: 'xs' }); d.mono(475, 104, 'from: news@promo.wren.example', { size: 8.5 }); gauge(d, 475, 200, 60, 0.55, { value: 'reputation' });
  d.text(320, 286, 'a spammy campaign must never drag a password reset into the spam folder', { cls: 'xs' });
  return d.svg();
}

export function be_res_e2e() {
  const d = fig('be_res_e2e', 'POST /orders/124/pay: EVERY PROTECTION FROM THIS UNIT, IN ORDER', 340);
  const st = [['rate limit', 'user 100/min'], ['deadline', '3 s budget'], ['bulkhead', 'payments pool 20'], ['breaker', 'closed'], ['provider limiter', '95/s'], ['call', 'timeouts 200 ms / 2 s'], ['idempotency key', 'pay-124-1'], ['webhook', 'confirms later']];
  st.forEach(([t, s], i) => { const x = 50 + (i % 4) * 150, y = 80 + Math.floor(i / 4) * 120; d.circle(x, y, 56, { fill: i === 5 ? C.accSoft : C.card, stroke: i === 5 ? C.acc : C.ink2 }); d.mono(x, y, i + 1, { size: 10 }); d.text(x, y + 42, t, { cls: 'ttl', size: 10.5 }); d.text(x, y + 58, s, { cls: 'xs' }); });
  d.travel('M50,80 L500,80 L50,200 L500,200', { r: 5, dur: 7 });
  d.text(320, 320, 'a timeout at step 6 is not a failure to charge: the key makes the retry safe, and the webhook settles it', { cls: 'xs' });
  return d.svg();
}

export function be_res_story() {
  const d = fig('be_res_story', 'THE PROVIDER SLOWS TO 10 S: WHAT EACH LAYER DOES', 340);
  const rows = [['0 s', 'provider p99 jumps from 400 ms to 10 s'], ['+2 s', 'calls hit the 2 s timeout; the payments bulkhead fills; menus unaffected'], ['+10 s', '50% of the last 20 calls failed: breaker opens'], ['+10 s', 'checkout shows "payment is taking longer, we will confirm by SMS"; orders held'], ['+40 s', 'half-open probe fails; stays open'], ['+3 min', 'probe succeeds; breaker closes; held orders charged with their original keys']];
  rows.forEach(([t, s], i) => { const y = 60 + i * 44; d.mono(80, y, t, { size: 10, a: 'end', color: i === 2 ? C.acc : undefined }); d.dot(100, y, 5, i === 2 ? C.acc : C.ink2); d.text(116, y, s, { cls: 'sm', a: 'start' }); if (i < 5) d.line(100, y + 6, 100, y + 38, { stroke: C.line, single: true }); });
  return d.svg();
}

export function be_res_components() {
  const d = fig('be_res_components', 'THE UNIT ON ONE PAGE', 340);
  bucket(d, 50, 70, 100, 110, 0.5); d.text(100, 206, 'rate limits', { cls: 'sm' });
  hourglass(d, 230, 70, 100, { level: 0.4 }); d.text(230, 206, 'timeouts and deadlines', { cls: 'sm' });
  breaker(d, 340, 70, 'open'); d.text(375, 206, '', {});
  sealed(d, 470, 90, 110, 70); d.text(525, 206, 'webhooks', { cls: 'sm' });
  d.text(375, 206, 'breakers and bulkheads', { cls: 'sm' });
  d.text(320, 260, 'every call to something you do not control has a limit, a deadline, a retry rule and a fallback', { cls: 'sm' });
  d.text(320, 290, 'every message from outside is verified, stored, acknowledged, and processed idempotently', { cls: 'xs' });
  return d.svg();
}

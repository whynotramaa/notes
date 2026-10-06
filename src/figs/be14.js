import { C, fig, beMap, beCover, card, steps, panel, cross, tick, lanes, seg, sheet, gauge, bubble, hbars, signpost } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';

const PARTS = ['Logging', 'Metrics', 'Latency percentiles', 'Distributed tracing', 'Golden signals, dashboards and alerts', 'SLIs, SLOs and SLAs', 'Health checks', 'Performance engineering', 'Failure scenarios', 'Production debugging'];
export const where_be_obs = (stage = 99) => beMap('where_be_obs', PARTS, stage);

function chart(d, x, y, w, h, pts, o = {}) {
  d.line(x, y + h, x + w, y + h, { stroke: C.ink2, single: true, sw: 0.9 });
  d.line(x, y, x, y + h, { stroke: C.ink2, single: true, sw: 0.9 });
  const max = o.max ?? Math.max(...pts), n = pts.length;
  const P = pts.map((v, i) => [x + i * w / (n - 1), y + h - v / max * h]);
  d.lines(P, { stroke: o.color ?? C.acc, sw: o.sw ?? 1.6, rough: 0.4, single: true });
  if (o.label) d.text(x + 4, y - 8, o.label, { cls: 'xs', a: 'start' });
  return P;
}

function marker(d, x, y1, y2, label) {
  d.line(x, y1, x, y2, { stroke: C.ink2, dash: [3, 3], single: true, sw: 0.9 });
  if (label) d.text(x + 4, y1 + 4, label, { cls: 'xs', a: 'start' });
}

function logline(d, x, y, w, text, o = {}) {
  d.rect(x, y, w, 20, { r: 3, fill: o.hot ? C.accSoft : C.paper, stroke: o.hot ? C.acc : C.line, sw: 0.8 });
  d.mono(x + 8, y + 10, text, { a: 'start', size: o.size ?? 8.5, color: o.hot ? C.acc : undefined });
}

export const cover_be_obs = () => beCover('cover_be_obs', 'XIV', ['Observability'], 'Logs, metrics, traces, SLOs and the debugging that uses them', (d, y) => {
  d.server(60, y + 40, 90, 140, { led: (i) => i === 3 });
  for (let i = 0; i < 5; i++) logline(d, 180, y + 30 + i * 26, 170, ['{"event":"order_created"}', '{"event":"cache_miss"}', '{"event":"payment_failed"}', '{"event":"order_created"}', '{"event":"email_sent"}'][i], { hot: i === 2 });
  const P = chart(d, 380, y + 30, 210, 110, [3, 3, 4, 3, 4, 3, 9, 14, 13, 5, 3, 3]);
  d.beacon(P[7][0], P[7][1]);
  [[180, 0.4, 0.5], [210, 0.45, 0.6], [240, 0.5, 0.9], [270, 0.55, 0.3]].forEach(([x, a, b], i) => d.rect(x, y + 190 + i * 16, 160 * b, 10, { r: 2, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }));
  d.hand(470, y + 220, 'see it, then find it', { size: 18 });
}, [['Logs and metrics', 'structured events, RED, cardinality'], ['Traces', 'spans, propagation, sampling'], ['SLOs', 'error budgets, burn-rate alerts'], ['Debugging', 'profiles, failures, incidents']]);

export function be_obs_structured() {
  const d = fig('be_obs_structured', 'FREE TEXT FOR ONE PERSON, FIELDS FOR A FLEET', 330);
  d.text(160, 50, 'free text', { cls: 'ttl' }); d.text(480, 50, 'structured', { cls: 'ttl', color: C.acc });
  d.doc(30, 70, 260, 150, { lines: false });
  ['ERROR payment failed for user 42:', 'card declined', 'WARN retrying provider call (2)', 'ERROR Payment Failure user=42', 'oops, provider said 402'].forEach((s, i) => d.mono(44, 92 + i * 24, s, { a: 'start', size: 9 }));
  card(d, 330, 70, 290, ['{', '  "event": "payment_failed",', '  "request_id": "req_7Hq2",', '  "user_id": 42, "order_id": 124,', '  "reason": "card_declined",', '  "provider_status": 402,', '  "duration_ms": 311 }'], { size: 9, hot: [1, 4], bold: false });
  d.text(160, 250, 'grep and guess the wording', { cls: 'xs' });
  d.mono(475, 250, 'event=payment_failed AND user_id=42', { size: 9, color: C.acc });
  d.text(320, 290, 'stable event names, variables in fields: filter, count and alert without reading', { cls: 'sm' });
  return d.svg();
}

export function be_obs_request_id() {
  const d = fig('be_obs_request_id', 'ONE ID FROM THE EDGE, IN EVERY SERVICE\'S LOGS AND IN THE RESPONSE', 330);
  d.phone(20, 100, 90);
  const svc = [['gateway', 150], ['orders', 290], ['payments', 430], ['email worker', 560]];
  svc.forEach(([s, x], i) => { d.server(x - 30, 90, 60, 70, { label: s, led: () => true }); if (i < 3) d.arrow(x + 34, 125, svc[i + 1][1] - 34, 125, { stroke: i === 2 ? C.gray : C.ink2, dash: i === 2 ? [4, 3] : undefined, hl: 5 }); });
  d.arrow(70, 125, 116, 125, { stroke: C.ink2, hl: 5 });
  d.text(495, 108, 'Kafka header', { cls: 'xs' });
  svc.forEach(([s, x]) => d.mono(x, 200, 'req_7Hq2', { size: 9.5, color: C.acc }));
  svc.forEach(([s, x]) => d.line(x, 170, x, 190, { stroke: C.acc, single: true, dash: [2, 3] }));
  d.carrow([[150, 230], [90, 250], [50, 200]], { stroke: C.acc, dash: [4, 3] }); d.text(130, 262, 'X-Request-Id: req_7Hq2', { cls: 'mono', size: 9 });
  d.text(400, 290, 'support pastes req_7Hq2: eleven lines from four services, in order', { cls: 'sm' });
  return d.svg();
}

export function be_obs_log_pipeline() {
  const d = fig('be_obs_log_pipeline', 'STDOUT, A NODE AGENT, A CENTRAL STORE: 86.4 GB A DAY', 320);
  panel(d, 20, 50, 220, 170, 'node');
  [0, 1, 2].forEach((i) => { d.rect(40 + i * 62, 80, 50, 60, { r: 4, fill: C.card, stroke: C.ink2 }); d.mono(65 + i * 62, 110, 'pod', { size: 9 }); d.line(65 + i * 62, 140, 65 + i * 62, 170, { stroke: C.gray, single: true, dash: [2, 3] }); });
  d.box(40, 172, 180, 32, 'agent: Fluent Bit', { r: 5, fill: C.accSoft, stroke: C.acc, size: 10 });
  pipe(d, 240, 400, 188, 18, true);
  for (let i = 0; i < 3; i++) d.travel([[240, 188], [400, 188]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.3] });
  d.db(420, 140, 90, 90, { label: 'log store', size: 10 });
  d.rect(530, 150, 90, 70, { r: 4, fill: C.card, stroke: C.gray, dash: [4, 3] }); d.text(575, 185, 'archive\n1 year', { cls: 'xs', vc: true });
  d.arrow(512, 185, 528, 185, { stroke: C.gray, hl: 5 });
  d.text(465, 250, '14 days hot', { cls: 'xs' });
  d.text(320, 290, '43,200,000 requests × 5 lines × 400 B = 86.4 GB/day; 30 days = 2.592 TB', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_obs_redaction() {
  const d = fig('be_obs_redaction', 'THE REDACTION FILTER: SECRETS REPLACED, PERSONAL DATA MASKED', 320);
  card(d, 20, 60, 240, ['"user_id": 42', '"email": "ana@mail.example"', '"authorization": "Bearer eyJ…"', '"card_number": "4111…1111"', '"route": "/orders"'], { size: 9, hot: [2, 3], bold: false });
  d.rect(290, 70, 60, 110, { r: 6, fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 6; i++) d.line(296, 82 + i * 16, 344, 82 + i * 16, { stroke: C.gray, single: true, dash: [2, 2] });
  d.text(320, 196, 'filter', { cls: 'xs' });
  d.arrow(262, 125, 288, 125, { stroke: C.ink2, hl: 5 }); d.arrow(352, 125, 378, 125, { stroke: C.ink2, hl: 5 });
  card(d, 380, 60, 240, ['"user_id": 42', '"email_domain": "mail.example"', '"authorization": "[REDACTED]"', '"card_number": "[REDACTED]"', '"route": "/orders"'], { size: 9, bold: false });
  d.text(320, 250, 'pipeline scan: wren_live_ keys, Luhn-valid numbers, eyJ… tokens → mask and alert', { cls: 'xs' });
  d.text(320, 280, 'a leaked secret is rotated, not just deleted from the logs', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_obs_three() {
  const d = fig('be_obs_three', 'THREE KINDS OF TELEMETRY, THREE QUESTIONS', 340);
  const xs = [110, 320, 530];
  ['metrics', 'traces', 'logs'].forEach((s, i) => panel(d, xs[i] - 95, 50, 190, 200, s, i === 0));
  chart(d, 35, 110, 150, 70, [2, 2, 3, 2, 2, 3, 8, 9, 3, 2]);
  d.text(110, 210, 'how much, how fast?', { cls: 'xs' }); d.text(110, 230, 'cost: per series', { cls: 'xs' });
  [[240, 90, 160], [255, 112, 120], [270, 134, 100], [290, 156, 50]].forEach(([x, y, w], i) => d.rect(x, y, w, 14, { r: 2, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }));
  d.text(320, 210, 'where did the time go?', { cls: 'xs' }); d.text(320, 230, 'cost: per request, sampled', { cls: 'xs' });
  for (let i = 0; i < 5; i++) logline(d, 445, 88 + i * 22, 170, '{"event":"…"}', { hot: i === 3 });
  d.text(530, 210, 'what happened to this one?', { cls: 'xs' }); d.text(530, 230, 'cost: per event', { cls: 'xs' });
  d.carrow([[150, 270], [215, 292], [280, 270]], { stroke: C.acc }); d.text(215, 305, 'exemplar', { cls: 'xs', color: C.acc });
  d.carrow([[360, 270], [425, 292], [490, 270]], { stroke: C.acc }); d.text(425, 305, 'trace id', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_obs_types() {
  const d = fig('be_obs_types', 'COUNTER, GAUGE, HISTOGRAM', 320);
  const M1 = d.axes(30, 70, 160, 120, { xmax: 10, ymax: 100 });
  d.lines([[0, 5], [2, 22], [4, 40], [5, 52], [5.01, 3], [7, 25], [10, 60]].map(([a, b]) => [M1.X(a), M1.Y(b)]), { stroke: C.acc, sw: 1.6, single: true, rough: 0.3 });
  d.text(110, 220, 'counter: only rises', { cls: 'sm' }); d.text(110, 238, 'read as rate(); restart drop handled', { cls: 'xs' });
  const M2 = d.axes(240, 70, 160, 120, { xmax: 10, ymax: 100 });
  d.fn((t) => 50 + 30 * Math.sin(t * 1.3) + 8 * Math.sin(t * 4), 0, 10, M2, { stroke: C.slate });
  d.text(320, 220, 'gauge: current value', { cls: 'sm' }); d.text(320, 238, 'pool in use, queue depth', { cls: 'xs' });
  const bk = [['10', 12], ['25', 41], ['50', 76], ['100', 93], ['250', 99], ['+Inf', 100]];
  bk.forEach(([s, v], i) => { const h = v * 1.2; d.rect(452 + i * 27, 190 - h, 22, h, { r: 1, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); d.mono(463 + i * 27, 202, s, { size: 7.5 }); });
  d.text(530, 220, 'histogram: cumulative buckets', { cls: 'sm' }); d.text(530, 238, '+ count and sum, summable', { cls: 'xs' });
  d.text(320, 285, 'summary: quantiles per process, cannot be combined across instances', { cls: 'xs' });
  return d.svg();
}

export function be_obs_cardinality() {
  const d = fig('be_obs_cardinality', 'EACH LABEL MULTIPLIES THE SERIES', 330);
  const st = [['method', '4'], ['route', '120'], ['status', '10'], ['instance', '4']];
  st.forEach(([s, n], i) => { d.box(30 + i * 120, 70, 90, 50, '', { r: 6, fill: C.card, stroke: C.ink2 }); d.text(75 + i * 120, 86, s, { cls: 'sm' }); d.mono(75 + i * 120, 106, n, { size: 12 }); if (i < 3) d.text(135 + i * 120, 95, '×', { size: 18 }); });
  d.text(510, 95, '= 19,200', { cls: 'mono', size: 13, a: 'start' });
  d.text(320, 150, 'a 12-bucket histogram: 14 series each, up to 268,800', { cls: 'xs' });
  d.box(30, 190, 90, 50, '', { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(75, 206, 'user_id', { cls: 'sm', color: C.acc }); d.mono(75, 226, '1,000,000', { size: 11, color: C.acc });
  d.text(140, 215, '×', { size: 18 });
  for (let i = 0; i < 60; i++) d.line(170 + i * 7, 240, 170 + i * 7, 240 - (8 + (i * i) % 50) * (1 + i / 30), { stroke: C.acc, single: true, sw: 1, op: 0.7 });
  bolt(d, 610, 180, 1.2);
  d.text(320, 300, 'labels hold small, bounded sets; ids and URLs belong in logs and traces', { cls: 'sm' });
  return d.svg();
}

export function be_obs_backend_metrics() {
  const d = fig('be_obs_backend_metrics', 'WHAT ONE SERVICE MEASURES', 340);
  d.server(270, 110, 100, 120, { label: 'orders service', led: () => true });
  card(d, 20, 60, 200, ['serves (RED)', 'rate by route, status', 'errors 5xx / total', 'duration histogram'], { size: 9 });
  card(d, 420, 60, 200, ['calls (client RED)', 'PostgreSQL, Redis', 'Kafka, payments API', 'rate, errors, duration'], { size: 9 });
  card(d, 20, 200, 200, ['holds (USE)', 'CPU vs limit, memory', 'GC pauses, loop lag', 'file descriptors'], { size: 9 });
  card(d, 420, 200, 200, ['waits on', 'pool in use / waiting', 'queue depth, lag', 'cache hit ratio'], { size: 9, hot: [1] });
  [[222, 90], [418, 90], [222, 230], [418, 230]].forEach(([x, y]) => d.line(x, y, x < 300 ? 268 : 372, 170, { stroke: C.line, single: true, dash: [3, 3] }));
  d.text(320, 310, 'peak: 400 queries/s × 4 ms = 1.6 connections busy of 40 (4%)', { cls: 'mono', size: 9.5, color: C.acc });
  return d.svg();
}

export function be_obs_mean_lies() {
  const d = fig('be_obs_mean_lies', 'THE MEAN LANDS WHERE NO REQUEST LIVES', 320);
  const M = d.axes(50, 60, 540, 180, { xmin: 0, xmax: 3200, ymax: 1000, xl: 'ms' });
  d.rect(M.X(0) + 2, M.Y(985), 18, M.Y(0) - M.Y(985), { r: 1, fill: C.card, stroke: C.ink2 });
  d.rect(M.X(3000) - 9, M.Y(60), 18, M.Y(0) - M.Y(60), { r: 1, fill: C.accSoft, stroke: C.acc });
  d.text(M.X(0) + 70, M.Y(985) + 6, '985 at 30 ms', { cls: 'sm', a: 'start' });
  d.text(M.X(3000), M.Y(60) - 14, '15 at 3,000 ms', { cls: 'sm', color: C.acc });
  marker(d, M.X(74.55), 70, 240, '');
  d.hand(M.X(74.55) + 40, 140, 'mean 74.55 ms', { size: 16 });
  d.arrow(M.X(74.55) + 36, 146, M.X(74.55) + 6, 160, { stroke: C.gray, hl: 5 });
  d.text(320, 285, 'p50 = 30 ms, p99 = 3,000 ms: two numbers that describe real requests', { cls: 'sm' });
  return d.svg();
}

export function be_obs_buckets() {
  const d = fig('be_obs_buckets', 'INTERPOLATING P99 FROM CUMULATIVE BUCKETS', 360);
  const b = [['≤10', 1200], ['≤25', 4100], ['≤50', 7600], ['≤100', 9300], ['≤250', 9920], ['≤500', 9975], ['≤1000', 9995], ['+Inf', 10000]];
  const H = 200, base = 270;
  b.forEach(([s, v], i) => { const x = 40 + i * 72, h = v / 10000 * H, hot = i === 4; d.rect(x, base - h, 52, h, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 26, base + 14, s, { size: 9 }); d.mono(x + 26, base - h - 10, v.toLocaleString('en-US'), { size: 8.5, color: hot ? C.acc : undefined }); });
  d.line(30, base - 0.99 * H, 620, base - 0.99 * H, { stroke: C.acc, dash: [4, 3], single: true });
  d.text(612, base - 0.99 * H - 10, 'rank 9,900', { cls: 'xs', a: 'end', color: C.acc });
  d.text(320, 312, 'p99 ≈ 100 + (9,900 − 9,300) ÷ (9,920 − 9,300) × 150 = 245.2 ms', { cls: 'mono', size: 10 });
  d.text(320, 336, 'p50 ≈ 31.4 ms, p99.9 ≈ 875 ms; the true p99 is anywhere from 100 to 250 ms', { cls: 'xs' });
  return d.svg();
}

export function be_obs_fanout() {
  const d = fig('be_obs_fanout', 'ONE SLOW CALL MAKES THE WHOLE PAGE SLOW', 330);
  d.laptop(20, 120, 90, { label: 'dashboard page' });
  for (let i = 0; i < 10; i++) { const y = 60 + i * 22, hot = i === 6; d.line(115, 150, 300, y + 8, { stroke: hot ? C.acc : C.line, single: true }); d.server(300, y, 40, 18, { unit: 18, stroke: hot ? C.acc : C.ink2, fill: hot ? C.accSoft : C.card }); }
  d.hand(360, 196, 'p99 hit', { size: 15, a: 'start' });
  const rows = [['1 call', 1, '1.0%'], ['10 calls', 9.56, '9.6%', true], ['100 calls', 63.4, '63.4%']];
  rows.forEach(([s, v, t, hot], i) => { const y = 90 + i * 50; d.text(470, y, s, { cls: 'sm', a: 'end' }); d.rect(480, y - 10, Math.max(3, v * 1.8), 20, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(486 + Math.max(3, v * 1.8), y, t, { size: 9.5, a: 'start' }); });
  d.text(320, 300, 'chance at least one of n calls exceeds its p99 = 1 − 0.99ⁿ', { cls: 'mono', size: 10 });
  return d.svg();
}

export function be_obs_trace() {
  const d = fig('be_obs_trace', 'ONE TRACE AS A WATERFALL: 1,400 MS, MOSTLY THE PROVIDER', 340);
  const X = (ms) => 150 + ms * 0.33;
  const sp = [['gateway', 0, 1400, 0], ['orders handler', 4, 1392, 1], ['SELECT cart', 10, 4, 2], ['INSERT order', 16, 4, 2], ['payments.charge', 40, 1340, 2], ['payments handler', 42, 1336, 3], ['provider POST', 60, 1310, 4]];
  sp.forEach(([s, a, w, lvl], i) => { const y = 60 + i * 30, hot = i === 6; d.text(140, y + 9, s, { cls: 'mono', size: 9, a: 'end' }); d.rect(X(a), y, Math.max(4, w * 0.33), 18, { r: 3, fill: hot ? C.accSoft : (lvl > 2 ? C.slateSoft : C.card), stroke: hot ? C.acc : C.ink2 }); d.mono(X(a + w) + 6, y + 9, `${w} ms`, { size: 8.5, a: 'start', color: hot ? C.acc : undefined }); });
  d.line(X(0), 280, X(1400), 280, { stroke: C.gray, single: true }); [0, 500, 1000, 1400].forEach((t) => { d.line(X(t), 276, X(t), 284, { stroke: C.gray, single: true }); d.mono(X(t), 296, t, { size: 8.5 }); });
  d.text(320, 322, 'trace id shared, each span with its own id and its parent\'s', { cls: 'xs' });
  return d.svg();
}

export function be_obs_propagation() {
  const d = fig('be_obs_propagation', 'INJECT ON THE WAY OUT, EXTRACT ON THE WAY IN', 330);
  d.server(40, 90, 80, 100, { label: 'orders' }); d.server(520, 90, 80, 100, { label: 'payments' });
  d.arrow(124, 140, 516, 140, { stroke: C.ink2, hl: 6 });
  d.travel([[124, 140], [516, 140]], { label: 'traceparent', w: 90 });
  card(d, 150, 180, 340, ['traceparent:', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'], { size: 8.5, bold: false });
  d.brace(208, 400, 238, { label: '16-byte trace id', cls: 'xs' });
  d.text(450, 248, 'parent span', { cls: 'xs', color: C.acc });
  d.text(80, 70, 'inject', { cls: 'xs', color: C.acc }); d.text(560, 70, 'extract, new child span', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'the same context goes into Kafka headers, gRPC metadata and logs', { cls: 'xs' });
  return d.svg();
}

export function be_obs_sampling() {
  const d = fig('be_obs_sampling', 'HEAD SAMPLING DECIDES FIRST, TAIL SAMPLING DECIDES LAST', 340);
  panel(d, 20, 50, 290, 220, 'head: 10% at the gateway');
  panel(d, 330, 50, 290, 220, 'tail: after the trace ends', true);
  for (let i = 0; i < 20; i++) { const x = 40 + (i % 10) * 26, y = 90 + Math.floor(i / 10) * 40, keep = i % 10 === 3, err = i === 7 || i === 15; d.rect(x, y, 18, 24, { r: 2, fill: keep ? C.accSoft : C.paper, stroke: keep ? C.acc : C.line }); if (err) cross(d, x + 9, y + 12, 5, C.ink2); }
  d.text(165, 200, 'errors kept only at 10%', { cls: 'xs' }); d.text(165, 222, '200 traces/s, 2 MB/s at peak', { cls: 'xs' });
  for (let i = 0; i < 20; i++) { const x = 350 + (i % 10) * 26, y = 90 + Math.floor(i / 10) * 40, err = i === 7 || i === 15, slow = i === 11, keep = err || slow || i === 2; d.rect(x, y, 18, 24, { r: 2, fill: keep ? C.accSoft : C.paper, stroke: keep ? C.acc : C.line }); if (err) cross(d, x + 9, y + 12, 5); }
  d.text(475, 200, 'keep errors, > 1 s, and 5%', { cls: 'xs' }); d.text(475, 222, 'buffer 30 s: 600 MB', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'baggage travels too: small, and never secrets', { cls: 'xs' });
  return d.svg();
}

export function be_obs_otel() {
  const d = fig('be_obs_otel', 'OPENTELEMETRY: OTLP IN, ANY BACKEND OUT', 330);
  ['orders', 'payments', 'search'].forEach((s, i) => { d.server(30, 60 + i * 80, 70, 56, { label: s }); d.arrow(104, 88 + i * 80, 230, 170, { stroke: C.ink2, hl: 5 }); });
  d.rect(240, 110, 160, 120, { r: 8, fill: C.accFaint, stroke: C.acc });
  d.text(320, 128, 'collector', { cls: 'ttl', color: C.acc });
  ['batch', 'k8s attributes', 'tail sample', 'redact'].forEach((s, i) => d.mono(320, 152 + i * 18, s, { size: 9 }));
  [['Tempo', 'traces'], ['Prometheus', 'metrics'], ['Loki', 'logs']].forEach(([s, t], i) => { d.db(500, 60 + i * 80, 80, 50, { label: s, size: 9.5 }); d.arrow(404, 170, 496, 86 + i * 80, { stroke: C.ink2, hl: 5 }); });
  d.text(165, 140, 'OTLP', { cls: 'mono', size: 9 });
  d.text(320, 300, 'API + SDK + instrumentation in each service; only the collector knows vendors', { cls: 'xs' });
  return d.svg();
}

export function be_obs_signals() {
  const d = fig('be_obs_signals', 'GOLDEN SIGNALS, RED AND USE', 330);
  const g = [['latency', 'duration'], ['traffic', 'rate'], ['errors', 'errors'], ['saturation', '']];
  g.forEach(([a, b], i) => { const x = 40 + i * 145; gauge(d, x + 50, 140, 50, [0.4, 0.55, 0.2, 0.85][i], { hot: i === 3, label: a }); if (b) d.text(x + 50, 180, `RED: ${b}`, { cls: 'xs' }); });
  d.brace(40, 470, 200, { label: 'RED for every service and endpoint: says where', cls: 'xs' });
  d.rect(450, 240, 170, 50, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(535, 258, 'USE for every resource', { cls: 'xs', color: C.acc }); d.text(535, 276, 'utilisation, saturation, errors', { cls: 'xs' });
  d.text(220, 270, 'pool 10/10 with 40 waiting: saturated, and why it is slow', { cls: 'xs' });
  return d.svg();
}

export function be_obs_dashboard() {
  const d = fig('be_obs_dashboard', 'A SERVICE OVERVIEW WITH THE DEPLOY MARKED', 360);
  d.rect(20, 40, 600, 300, { r: 8, fill: C.paper, stroke: C.ink2 });
  const rows = [['rate', [5, 5, 6, 5, 6, 6, 5, 6, 6, 5]], ['errors', [1, 1, 1, 1, 1, 6, 8, 2, 1, 1]], ['p99', [3, 3, 3, 3, 4, 9, 10, 4, 3, 3]]];
  rows.forEach(([s, v], i) => { chart(d, 40 + i * 195, 80, 170, 60, v, { label: s, color: i ? C.acc : C.slate, max: 11 }); });
  ['db', 'redis', 'provider'].forEach((s, i) => chart(d, 40 + i * 195, 180, 170, 40, [2, 2, 2, 2, 2, i === 2 ? 8 : 2, i === 2 ? 9 : 2, 2, 2, 2], { label: `${s} p99`, color: i === 2 ? C.acc : C.slate, max: 10 }));
  ['CPU', 'pool waiting', 'GC'].forEach((s, i) => chart(d, 40 + i * 195, 270, 170, 40, [3, 3, 4, 3, 3, 4, 4, 3, 3, 3], { label: s, color: C.slate, max: 10 }));
  for (let i = 0; i < 3; i++) marker(d, 40 + i * 195 + 170 * 5 / 9 - 6, 70, 320, i === 0 ? 'v812' : '');
  return d.svg();
}

export function be_obs_alerting() {
  const d = fig('be_obs_alerting', 'SYMPTOMS PAGE, CAUSES BECOME TICKETS', 330);
  d.phone(80, 70, 110, { stroke: C.acc }); d.blink((dd) => dd.dot(108, 90, 5, C.acc));
  d.text(108, 210, 'page', { cls: 'ttl', color: C.acc });
  ['SLO burn rate', 'order rate collapse', 'cert < 7 days', 'lag > 15 min'].forEach((s, i) => d.text(108, 232 + i * 18, s, { cls: 'xs' }));
  d.doc(300, 80, 80, 100); d.text(340, 210, 'ticket', { cls: 'ttl' });
  ['CPU 90%', 'one instance lost', 'disk 80%'].forEach((s, i) => d.text(340, 232 + i * 18, s, { cls: 'xs' }));
  d.rect(470, 80, 130, 100, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(535, 100, 'runbook', { cls: 'ttl' }); ['what it means', 'check first', 'usual fixes'].forEach((s, i) => d.text(535, 124 + i * 18, s, { cls: 'xs' }));
  d.carrow([[150, 110], [300, 50], [470, 110]], { stroke: C.acc, dash: [4, 3] });
  d.text(535, 220, 'for: 5m before firing', { cls: 'xs' }); d.text(535, 240, 'watchdog alert always on', { cls: 'xs' });
  return d.svg();
}

export function be_obs_sli() {
  const d = fig('be_obs_sli', 'AN SLI IS GOOD EVENTS OVER VALID EVENTS', 320);
  const cells = 50;
  for (let i = 0; i < cells; i++) { const x = 40 + (i % 25) * 22, y = 70 + Math.floor(i / 25) * 26; const kind = i === 3 || i === 30 ? 'x' : i === 12 || i === 40 ? 'h' : i === 21 ? 'b' : i === 44 ? 's' : 'g'; d.rect(x, y, 16, 20, { r: 2, fill: kind === 'x' ? C.paper : kind === 'b' || kind === 's' ? C.accSoft : C.card, stroke: kind === 'x' ? C.line : kind === 'b' || kind === 's' ? C.acc : C.ink2, dash: kind === 'x' ? [2, 2] : undefined }); if (kind === 'h') d.mono(x + 8, y + 10, '4', { size: 8 }); }
  d.text(40, 150, 'dashed: health checks, excluded', { cls: 'xs', a: 'start' });
  d.text(40, 168, '"4": client 4xx, valid and good', { cls: 'xs', a: 'start' });
  d.text(40, 186, 'orange: a 5xx and a request over 300 ms, valid and bad', { cls: 'xs', a: 'start', color: C.acc });
  d.text(320, 230, 'availability SLI = non-5xx ÷ valid', { cls: 'mono', size: 10 });
  d.text(320, 252, 'latency SLI = valid under 300 ms ÷ valid', { cls: 'mono', size: 10 });
  d.text(320, 290, 'measured at the load balancer; client data as context', { cls: 'xs' });
  return d.svg();
}

export function be_obs_budget() {
  const d = fig('be_obs_budget', 'A 30-DAY ERROR BUDGET, SPENT BY INCIDENTS AND CHANGES', 320);
  hbars(d, [['99.9%', 43.2, '43.2 min, 1,296,000 requests', true], ['99.95%', 21.6, '21.6 min'], ['99.99%', 4.32, '4.32 min']], { x: 110, w: 300, y: 60, gap: 40 });
  d.rect(110, 200, 300, 30, { r: 4, fill: C.paper, stroke: C.ink2 });
  [[0, 12, 'deploys'], [12, 8, 'incident'], [20, 3, '']].forEach(([a, w, s], i) => { d.fillRect(111 + a / 43.2 * 298, 202, w / 43.2 * 298, 26, i === 1 ? C.accSoft : C.card); if (s) d.text(110 + (a + w / 2) / 43.2 * 300, 245, s, { cls: 'xs' }); });
  d.text(440, 215, 'budget left: 20.2 min', { cls: 'xs', a: 'start', color: C.acc });
  d.text(320, 290, 'policy agreed in advance: spent budget means reliability work before features', { cls: 'xs' });
  return d.svg();
}

export function be_obs_burn() {
  const d = fig('be_obs_burn', 'BURN RATE: HOW FAST THE BUDGET DRAINS', 340);
  const M = d.axes(60, 60, 520, 200, { xmax: 30, ymax: 100, xl: 'days', yl: 'budget left %' });
  d.fn((t) => 100 - t / 30 * 100, 0, 30, M, { stroke: C.slate, sw: 1.2 });
  d.text(M.X(24), M.Y(28), 'burn 1: lasts 30 days', { cls: 'xs', a: 'start' });
  d.fn((t) => Math.max(0, 100 - t / 30 * 1440), 0, 2.08, M, { stroke: C.acc });
  d.text(M.X(2.4), M.Y(10), 'burn 14.4: gone in 2.08 days', { cls: 'xs', a: 'start', color: C.acc });
  card(d, 300, 70, 270, ['page: 14.4× over 1 h (and 5 m) = 2%', 'page: 6× over 6 h (and 30 m) = 5%', 'ticket: 1× over 3 days = 10%'], { size: 9, hot: [0], bold: false });
  return d.svg();
}

export function be_obs_sla() {
  const d = fig('be_obs_sla', 'MEASURE, TARGET, PROMISE', 300);
  [['SLI', 'what we measure', 'non-5xx ÷ valid'], ['SLO', 'internal target', '99.9% / 30 days'], ['SLA', 'contract with credits', '99.5% / month']].forEach(([a, b, c], i) => { const x = 40 + i * 200; d.rect(x, 70, 160, 120, { r: 8, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.text(x + 80, 96, a, { cls: 'ttl', size: 16, color: i === 1 ? C.acc : undefined }); d.text(x + 80, 126, b, { cls: 'xs' }); d.mono(x + 80, 156, c, { size: 9.5 }); if (i < 2) d.arrow(x + 164, 130, x + 196, 130, { stroke: C.gray, hl: 5 }); });
  d.text(320, 230, 'the gap between 99.9% and 99.5% is warning time before credits are owed', { cls: 'xs' });
  d.text(320, 256, 'five 99.95% dependencies in series cap a journey at 99.75%', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_obs_probes() {
  const d = fig('be_obs_probes', 'THREE PROBES, THREE CONSEQUENCES', 320);
  d.server(270, 60, 100, 130, { label: 'pod' });
  [['startup', '30 × 10 s = 300 s budget', 'gates the others', 60], ['liveness', '3 fails × 10 s ≈ 30 s', 'restart the container', 240], ['readiness', '3 fails × 5 s ≈ 15 s', 'remove from the balancer', 420]].forEach(([a, b, c, x], i) => { signpost(d, x + 40, 230, `/${a === 'liveness' ? 'livez' : a === 'readiness' ? 'readyz' : 'startupz'}`, { hot: i === 2, pole: 30 }); d.text(x + 40, 278, b, { cls: 'xs' }); d.text(x + 40, 296, c, { cls: 'xs', color: i === 2 ? C.acc : undefined }); });
  d.arrow(110, 180, 260, 140, { stroke: C.gray, dash: [3, 3], hl: 5 });
  return d.svg();
}

export function be_obs_health_cascade() {
  const d = fig('be_obs_health_cascade', 'A LIVENESS PROBE THAT PINGS THE DATABASE', 340);
  const y = lanes(d, ['database', 'api-1', 'api-2', 'api-3', 'api-4'], { y: 60, gap: 40, x0: 100, x1: 610, tl: 's' });
  const X = (s) => 110 + s * 7;
  seg(d, X(0), y(0), X(20) - X(0), 'failover 20 s', { hot: true });
  for (let k = 1; k <= 4; k++) { [10, 15, 20].forEach((t) => cross(d, X(t), y(k), 4, C.ink2)); seg(d, X(21), y(k), X(40) - X(21), 'restarting', { fill: C.paper, dash: [3, 3] }); seg(d, X(40), y(k), X(62) - X(40), 'cold cache', { fill: C.card }); }
  d.arrow(X(40), y(4) + 30, X(40), y(0) + 12, { stroke: C.acc, hl: 5 }); d.text(X(41), y(0) + 20, '40 new connections + 10× misses', { cls: 'xs', a: 'start', color: C.acc });
  return d.svg();
}

export function be_obs_little() {
  const d = fig('be_obs_little', 'LITTLE\'S LAW: L = λ × W', 320);
  d.rect(220, 80, 200, 120, { r: 10, fill: C.accFaint, stroke: C.acc });
  for (let i = 0; i < 40; i++) d.dot(236 + (i % 10) * 18, 98 + Math.floor(i / 10) * 26, 3.4, i % 7 === 0 ? C.acc : C.ink2);
  d.text(320, 220, 'L = 100 in flight', { cls: 'mono', size: 11, color: C.acc });
  d.arrow(60, 140, 214, 140, { stroke: C.ink2, hl: 6 }); d.text(130, 124, 'λ = 2,000/s', { cls: 'mono', size: 10 });
  d.arrow(426, 140, 580, 140, { stroke: C.ink2, hl: 6 }); d.text(500, 124, 'W = 50 ms', { cls: 'mono', size: 10 });
  for (let i = 0; i < 4; i++) d.travel([[60, 140], [214, 140]], { at: [i * 0.25, i * 0.25 + 0.2] });
  d.text(320, 270, 'W doubles to 100 ms: L doubles to 200, and every per-request resource with it', { cls: 'xs' });
  return d.svg();
}

export function be_obs_layers() {
  const d = fig('be_obs_layers', 'EACH LAYER\'S TIME CONTAINS THE LAYERS BENEATH', 320);
  const L = [['client total', 0, 900], ['load balancer $request_time', 40, 840], ['$upstream_response_time', 60, 260], ['app span', 64, 250], ['db queries', 80, 30]];
  L.forEach(([s, a, w], i) => { const y = 60 + i * 34; d.text(200, y + 10, s, { cls: 'mono', size: 9, a: 'end' }); d.rect(210 + a * 0.42, y, w * 0.42, 20, { r: 3, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.mono(214 + (a + w) * 0.42, y + 10, `${w} ms`, { size: 8.5, a: 'start' }); });
  d.text(320, 250, '840 ms at the balancer, 260 ms upstream: 580 ms went to the client side', { cls: 'xs', color: C.acc });
  d.text(320, 274, 'a large response on a slow network, not a slow application', { cls: 'xs' });
  return d.svg();
}

export function be_obs_flame() {
  const d = fig('be_obs_flame', 'A FLAME GRAPH: WIDTH IS SHARE OF SAMPLES', 330);
  const rows = [[[0, 1, 'main']], [[0, 0.9, 'http.serve'], [0.9, 0.1, 'gc']], [[0, 0.62, 'orders.list'], [0.62, 0.28, 'orders.create']], [[0, 0.18, 'db.query'], [0.18, 0.44, 'json.encode'], [0.62, 0.2, 'db.insert'], [0.82, 0.08, 'kafka']], [[0.2, 0.38, 'encode.value']]];
  rows.forEach((r, lvl) => r.forEach(([a, w, s]) => { const x = 30 + a * 580, y = 260 - lvl * 36, hot = s.startsWith('json') || s.startsWith('encode'); d.rect(x + 1, y, w * 580 - 2, 30, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); if (w > 0.06) d.mono(x + w * 290, y + 15, s, { size: 9, color: hot ? C.acc : undefined }); }));
  d.hand(470, 90, 'wide plateau: 38%', { size: 16 });
  d.text(320, 312, 'x-order is alphabetical, not time; stacks grow upward', { cls: 'xs' });
  return d.svg();
}

export function be_obs_gc() {
  const d = fig('be_obs_gc', 'ALLOCATION FILLS THE HEAP, COLLECTION PAUSES THE REQUESTS', 320);
  const M = d.axes(50, 60, 540, 140, { xmax: 10, ymax: 100, xl: 's', yl: 'heap' });
  const pts = []; for (let t = 0; t <= 10; t += 0.05) pts.push([M.X(t), M.Y(30 + ((t % 2.5) / 2.5) * 60)]);
  d.lines(pts, { stroke: C.slate, single: true, rough: 0.2, sw: 1.4 });
  [2.5, 5, 7.5].forEach((t) => { d.fillRect(M.X(t) - 3, 60, 6, 140, C.accSoft, 0.9); });
  for (let i = 0; i < 12; i++) d.rect(M.X(i * 0.85), 225, 26, 12, { r: 2, fill: [3, 6, 9].includes(i) ? C.accSoft : C.card, stroke: [3, 6, 9].includes(i) ? C.acc : C.line });
  d.text(320, 256, 'requests caught by a pause see it as tail latency', { cls: 'xs', color: C.acc });
  d.text(320, 282, '500 req/s × 200 KB = 100 MB/s of garbage to collect', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_obs_load_shapes() {
  const d = fig('be_obs_load_shapes', 'FOUR LOAD-TEST SHAPES', 320);
  const S = [['load', [1, 1.5, 1.5, 1.5, 1.5, 1.5, 0]], ['stress', [1, 1.5, 2, 2.5, 3, 3.5, 4]], ['spike', [1, 1, 1, 4, 4, 1, 1]], ['soak', [1, 1, 1, 1, 1, 1, 1]]];
  S.forEach(([s, v], i) => { const x = 30 + i * 150; panel(d, x, 50, 135, 170, s, i === 1); const P = v.map((a, k) => [x + 12 + k * 18, 200 - a * 30]); d.lines(P, { stroke: i === 1 ? C.acc : C.slate, sw: 1.6, single: true, rough: 0.3 }); });
  ['1.5 × peak, 30 min', 'until it breaks', 'sudden 4×', '8 h for leaks'].forEach((s, i) => d.text(97 + i * 150, 240, s, { cls: 'xs' }));
  d.text(320, 285, 'fixed arrival rate, production-sized data, realistic endpoint mix', { cls: 'sm' });
  return d.svg();
}

export function be_obs_six_q() {
  const d = fig('be_obs_six_q', 'SIX QUESTIONS FOR ANY FAILURE', 260);
  steps(d, [['breaks?', 'first failure'], ['spreads?', 'pools, retries'], ['detected?', 'which alert'], ['contained?', 'timeouts, fallbacks'], ['recovers?', 'second wave'], ['prevented?', 'smaller next time']], 90, 3, { h: 64, size: 10.5, gap: 10 });
  d.text(320, 200, 'slow callers hold resources, retries multiply load, shared pools spread it, recovery comes in a wave', { cls: 'xs' });
  return d.svg();
}

export function be_obs_redis_down() {
  const d = fig('be_obs_redis_down', 'REDIS GOES DOWN: FAST FAILURE VERSUS SLOW', 340);
  panel(d, 20, 50, 290, 230, '50 ms timeout + breaker');
  panel(d, 330, 50, 290, 230, 'default slow timeout', true);
  d.server(50, 100, 60, 70, { label: 'api' }); d.db(200, 100, 80, 70, { label: 'PG', size: 10 });
  cross(d, 140, 210, 9); d.text(140, 232, 'Redis', { cls: 'xs' });
  hose(d, 112, 135, 196, 135); d.text(160, 120, '4,000 q/s', { cls: 'mono', size: 9 });
  d.text(165, 260, '10× queries, 16 of 40 connections busy', { cls: 'xs' });
  d.server(360, 100, 60, 70, { label: 'api', stroke: C.acc });
  for (let i = 0; i < 18; i++) d.dot(440 + (i % 6) * 14, 100 + Math.floor(i / 6) * 16, 4, C.acc);
  d.text(500, 170, '2,000 in flight', { cls: 'mono', size: 9, color: C.acc });
  cross(d, 560, 210, 9); d.text(560, 232, 'Redis', { cls: 'xs' });
  d.text(475, 260, '2,000/s × 1 s wait: workers exhausted first', { cls: 'xs' });
  return d.svg();
}

function hose(d, x1, y1, x2, y2) { d.line(x1, y1 - 4, x2, y2 - 4, { stroke: C.acc, single: true }); d.line(x1, y1 + 4, x2, y2 + 4, { stroke: C.acc, single: true }); d.flowline([[x1, y1], [x2, y2]], { gap: 5, dur: 0.5 }); }

export function be_obs_lag() {
  const d = fig('be_obs_lag', 'LAG GROWS AT THE PRODUCE RATE, THEN DRAINS AT THE DIFFERENCE', 330);
  const M = d.axes(60, 60, 520, 180, { xmax: 9, ymax: 1200000, xl: 'hours', yl: 'events behind' });
  d.lines([[0, 0], [6, 1080000], [9, 0]].map(([a, b]) => [M.X(a), M.Y(b)]), { stroke: C.acc, sw: 1.8, single: true, rough: 0.3 });
  d.text(M.X(3), M.Y(640000), '+50/s while stuck', { cls: 'xs', a: 'end' });
  d.text(M.X(7.6), M.Y(640000), '−100/s: 150 in, 50 out', { cls: 'xs', a: 'start' });
  d.dot(M.X(6), M.Y(1080000), 4, C.acc); d.mono(M.X(6), M.Y(1080000) - 14, '1,080,000', { size: 9.5 });
  d.text(320, 290, 'alert when the oldest event is over 5 minutes old, not at six hours', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_obs_cert_expiry() {
  const d = fig('be_obs_cert_expiry', 'A 90-DAY CERTIFICATE AND ITS SAFETY MARGINS', 260);
  d.rect(40, 100, 560, 30, { r: 4, fill: C.card, stroke: C.ink2 });
  const X = (day) => 40 + day / 90 * 560;
  d.fillRect(X(60), 102, X(90) - X(60) - 2, 26, C.accSoft);
  [[0, 'issued'], [60, 'renew at day 60'], [69, 'ticket: 21 left'], [83, 'page: 7 left'], [90, 'expires']].forEach(([t, s], i) => { d.line(X(t), 90, X(t), 140, { stroke: i >= 2 ? C.acc : C.ink2, single: true }); d.text(X(t), i % 2 ? 158 : 78, s, { cls: 'xs', color: i >= 2 ? C.acc : undefined }); });
  d.text(320, 210, 'probe the live endpoint: a renewed file the server never reloaded still expires', { cls: 'xs' });
  return d.svg();
}

export function be_obs_debug_latency() {
  const d = fig('be_obs_debug_latency', 'FROM P99 TO THE SLOW DEPENDENCY', 260);
  steps(d, [['p99 900 ms', 'POST /orders'], ['all 4 instances', 'not one node'], ['exemplar trace', 'payments 700 ms'], ['provider span', '680 ms'], ['provider p99', '650 vs 180 ms']], 80, 4, { h: 64, size: 10, gap: 12 });
  d.text(320, 190, 'mitigate first: timeout 2 s → 800 ms, breaker routes to the secondary provider', { cls: 'xs', color: C.acc });
  d.text(320, 214, 'p99 back to 300 ms within minutes', { cls: 'xs' });
  return d.svg();
}

export function be_obs_memory() {
  const d = fig('be_obs_memory', 'A LEAK NEVER LEVELS OFF', 320);
  const M = d.axes(60, 60, 520, 170, { xmax: 10, ymax: 100, xl: 'days', yl: 'memory' });
  d.fn((t) => 60 * (1 - Math.exp(-t * 1.5)) + 5, 0, 10, M, { stroke: C.slate, sw: 1.3 });
  d.text(M.X(8.5), M.Y(70), 'cache warming: plateau', { cls: 'xs' });
  d.lines([[0, 10], [3.2, 90], [3.21, 12], [6.4, 92], [6.41, 12], [9.6, 92]].map(([a, b]) => [M.X(a), M.Y(b)]), { stroke: C.acc, sw: 1.6, single: true, rough: 0.3 });
  [3.2, 6.4, 9.6].forEach((t) => d.text(M.X(t), M.Y(98), 'OOMKilled', { cls: 'xs', color: C.acc }));
  d.line(60, M.Y(95), 580, M.Y(95), { stroke: C.gray, dash: [3, 3], single: true });
  d.text(320, 290, 'compare two heap profiles an hour apart: what grew is the leak', { cls: 'xs' });
  return d.svg();
}

export function be_obs_deploy_errors() {
  const d = fig('be_obs_deploy_errors', 'ERRORS START AT THE DEPLOY: ROLL BACK, THEN INVESTIGATE', 320);
  const P = chart(d, 50, 70, 540, 150, [0.05, 0.05, 0.05, 0.05, 4, 4, 4, 0.05, 0.05, 0.05, 0.05], { max: 5, label: 'error rate %' });
  marker(d, P[3][0] + 10, 70, 220, '20:03 v812');
  marker(d, P[6][0] + 10, 70, 220, '20:07 rollback');
  d.text(P[5][0], P[5][1] - 14, '4%', { cls: 'mono', size: 10, color: C.acc });
  d.text(320, 260, 'then: error logs → decode_error, trace → 200 body unparsed, diff → HTTP client upgrade', { cls: 'xs' });
  return d.svg();
}

export function be_obs_incident() {
  const d = fig('be_obs_incident', 'ONE INCIDENT, FIVE STAGES, THE TELEMETRY AT EACH', 280);
  steps(d, [['detect 20:06', 'burn-rate page'], ['mitigate 20:07', 'rollback'], ['diagnose', 'logs, trace, diff'], ['fix', 'decompress body'], ['prevent', 'canary per dependency']], 80, 0, { h: 64, size: 10, gap: 12 });
  d.text(320, 190, '300 req/s × 300 s = 90,000; 4% failed = 3,600 = 0.28% of the month\'s budget', { cls: 'mono', size: 9.5 });
  d.text(320, 220, 'blameless: how did the system let this through?', { cls: 'xs', color: C.acc });
  return d.svg();
}

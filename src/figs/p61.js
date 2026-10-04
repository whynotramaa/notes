import { systemMap } from '../lib/system-figures.js';
import { D, C, fmtN } from '../lib/draw.js';

const cv = (id, k, h) => { const d = new D(640, h, id); d.text(10, 16, k, { cls: 'cap', a: 'start' }); return d; };
const f = fmtN;
const r4 = (v) => +v.toFixed(4);
const sm = (d, x, y, s, a = 'middle', o = {}) => d.text(x, y, s, { cls: 'sm', a, ...o });
const xs = (d, x, y, s, a = 'middle', o = {}) => d.text(x, y, s, { cls: 'xs', a, ...o });
const mo = (d, x, y, s, a = 'middle', size = 10.5, o = {}) => d.mono(x, y, s, { a, size, ...o });
const bar = (d, x, y, w, h, on, o = {}) => d.rect(x, y, w, h, { r: 2, fill: on ? C.accSoft : (o.fill ?? C.card), stroke: on ? C.acc : (o.stroke ?? C.ink2), sw: 0.9, ...o });
const sweep = (d, x0, x1, y0, y1, at = [0, 1], color = C.acc) => d.travel([[x0, y0], [x1, y0]], { at, token: (g) => g.line(0, 0, 0, y1 - y0, { stroke: color, sw: 1.2, single: true, rough: 0.2 }) });

const LABELS = ["Latency, throughput and Little's law", "p50, p95 and p99 latency", "IOPS, bandwidth and storage", "CPU-bound, I/O-bound and bottlenecks", "Scaling and Amdahl's law", "Queueing and backpressure", "Case study: capacity estimation"];
const DAY = 8640000, SEC = 86400, AVG = DAY / SEC, PEAK = AVG * 10, RES = 0.2, ACTIVE = PEAK * RES;
const CPU_MS = 2, PAY = 2000, LIVE_EV = 20, VIEWERS = 50000, LIVE_B = 200, GW = 5;
const REC_B = 500, DAYS = 30, COPIES = 3, ONE_COPY = DAY * REC_B * DAYS;
const SVC = 1000, BURST = 1200, AFTER = 600, BURST_S = 60, BACKLOG = (BURST - SVC) * BURST_S;

export function where_sd_performance(stage = 99) { return systemMap('sd_performance', LABELS, stage); }

export function cover_sd_performance() {
  const d = new D(640, 830, 'cover_sd_performance');
  for (let x = 15; x < 640; x += 23) for (let y = 34; y < 795; y += 23) d.dot(x, y, 0.6, C.faint);
  d.text(10, 16, 'SYSTEM DESIGN / UNIT 2 / FIELD GUIDE', { cls: 'cap', a: 'start' });
  d.text(42, 112, 'Performance and', { a: 'start', size: 48, w: 600 });
  d.text(42, 177, 'capacity', { a: 'start', size: 48, w: 600 });
  d.hl(44, 195, 244, 195, { th: 15 });
  d.text(45, 249, 'Performance and capacity estimation', { a: 'start', size: 15 });
  [5, 6, 7].forEach((n, r) => { for (let i = 0; i < n; i++) d.person(70 + i * 26 - r * 13 + 26, 330 + r * 40, 24); });
  xs(d, 150, 462, `${f(PEAK)} requests/s at match start`);
  d.lines([[262, 350], [300, 390], [300, 430], [262, 470]], { stroke: C.ink2, single: true });
  d.flowline([[240, 410], [330, 410]], { color: C.acc });
  d.line(314, 386, 314, 434, { stroke: C.acc, sw: 2.2, single: true });
  sm(d, 314, 450, 'admission');
  const load = [200, 200, 200, 200, 200];
  load.forEach((v, i) => {
    const y = 314 + i * 52;
    d.server(350, y, 110, 40, { unit: 18, led: () => true });
    d.rect(470, y + 6, 60, 12, { r: 2, stroke: C.ink2, sw: 0.8 });
    d.fillRect(471, y + 7, 58 * v / 300, 10, C.acc, 0.85);
    xs(d, 536, y + 12, `${v}/300`, 'start');
    d.line(460, y + 20, 562, 420, { stroke: C.line, single: true, sw: 0.8 });
  });
  d.db(560, 380, 60, 80, { under: 'database' });
  sm(d, 405, 580, `5 × 300 = ${f(1500)} req/s`);
  d.text(60, 622, 'backlog', { cls: 'ttl', a: 'start', size: 13 });
  d.tape(60, 636, ['', '', '', '', '', '', '', '', '', ''], { cw: 30, h: 28, hot: (i) => i < 7 });
  xs(d, 210, 680, 'arrivals − service, every second');
  d.clock(500, 664, 92, { t: 0.82 });
  sm(d, 500, 724, 'p99 waits at the tail');
  d.hand(150, 548, 'name the unit\nbeside every number', { size: 25, vc: true });
  d.carrow([[236, 548], [290, 540], [340, 520]], { stroke: C.acc });
  d.text(44, 787, 'COUNT THE WORK. NAME THE BOTTLENECK.', { a: 'start', cls: 'cap', size: 11 });
  return d.svg();
}

export function sd_performance_demand() {
  const d = cv('sd_performance_demand', 'ILLUSTRATIVE DAILY AVERAGE AND PEAK', 300);
  d.cycle = 8;
  const M = d.axes(60, 50, 520, 180, { xmin: 0, xmax: 24, ymin: 0, ymax: 1100, xl: 'hour of day', yl: 'requests/s' });
  const g = (t) => 90 * Math.max(0, Math.sin(Math.PI * (t - 6) / 18)), sp = (t) => Math.exp(-(((t - 19.5) / 0.35) ** 2));
  let mg = 0, ms = 0; const N = 2400;
  for (let i = 0; i < N; i++) { const t = (i + 0.5) * 24 / N; mg += g(t) / N; ms += sp(t) / N; }
  const g0 = g(19.5), c = (AVG - mg - (PEAK - g0) * ms) / (1 - ms), A = PEAK - c - g0;
  const r = (t) => c + g(t) + A * sp(t);
  const pts = []; for (let i = 0; i <= 240; i++) { const t = i / 10; pts.push([M.X(t), M.Y(r(t))]); }
  d.lines(pts, { stroke: C.ink, sw: 1.4, rough: 0.3, single: true });
  d.line(M.X(0), M.Y(AVG), M.X(24), M.Y(AVG), { stroke: C.slate, dash: [5, 4], single: true, sw: 1.2 });
  sm(d, 66, M.Y(AVG) - 10, `daily average ${f(AVG)} req/s`, 'start', { color: C.slate });
  d.dot(M.X(19.5), M.Y(PEAK), 3.4, C.acc);
  sm(d, M.X(19.5) - 10, M.Y(PEAK) - 2, `match start: peak ${f(PEAK)} req/s`, 'end');
  [0, 6, 12, 18, 24].forEach((h) => xs(d, M.X(h), 244, `${String(h).padStart(2, '0')}:00`));
  d.hand(250, 120, 'the average hides\nthe match-start burst', { size: 16, vc: true });
  mo(d, 320, 272, `${f(DAY)} requests / ${f(SEC)} s = ${f(AVG)} req/s,  × 10 at peak = ${f(PEAK)} req/s`, 'middle', 10);
  xs(d, 320, 290, 'curve shape illustrative; its mean is exactly the daily average');
  d.travel(pts.filter((_, i) => i % 4 === 0), { at: [0, 1], r: 4 });
  d.pulse(M.X(19.5), M.Y(PEAK), { at: [0.79, 0.9], r1: 24 });
  return d.svg();
}

export function sd_performance_trace() {
  const d = cv('sd_performance_trace', 'DISJOINT INTERVALS ADD TO 200 MS', 300);
  d.cycle = 7;
  const x0 = 70, k = 2.6, X = (t) => x0 + t * k;
  const iv = [['reach app', 30, 'proxy'], ['admission wait', 20, 'app'], ['pool wait', 10, 'app'], ['DB query', 40, 'database'], ['return + finish', 100, 'app + network']];
  const total = iv.reduce((s, v) => s + v[1], 0);
  d.rect(X(0), 44, total * k, 22, { r: 3, fill: C.slateSoft, stroke: C.slate });
  sm(d, X(total / 2), 55, `parent span: whole request, ${total} ms`);
  let t = 0;
  iv.forEach(([name, ms, who], i) => {
    const y = 84 + i * 28, on = name === 'DB query';
    bar(d, X(t), y, ms * k, 20, on);
    const label = `${name} · ${ms} ms`;
    if (ms * k > label.length * 6 + 10) sm(d, X(t) + ms * k / 2, y + 10, label);
    else sm(d, X(t + ms) + 6, y + 10, label, 'start');
    xs(d, 62, y + 10, who, 'end');
    t += ms;
  });
  d.line(x0, 232, X(total), 232, { stroke: C.ink2, single: true, sw: 0.9 });
  [0, 50, 100, 150, 200].forEach((v) => { d.line(X(v), 228, X(v), 236, { stroke: C.ink2, single: true }); xs(d, X(v), 246, `${v} ms`); });
  mo(d, 320, 268, `${iv.map((v) => v[1]).join(' + ')} = ${total} ms`, 'middle', 11);
  sm(d, 320, 288, `adding the parent span as well would count ${total * 2} ms: every wait twice`);
  d.hand(470, 112, 'the database saw\nonly 40 of them', { size: 15, vc: true });
  sweep(d, X(0), X(total), 40, 222, [0.05, 0.9]);
  return d.svg();
}

export function sd_performance_windows() {
  const d = cv('sd_performance_windows', 'THE SAME AVERAGE HIDES DIFFERENT WINDOWS', 290);
  d.cycle = 6;
  const M = d.axes(60, 50, 520, 170, { xmin: 0, xmax: 20, ymin: 0, ymax: 800, xl: 'seconds', yl: 'requests/s' });
  const rate = (s) => (s < 10 ? 3000 : 7000) / 10;
  for (let s = 0; s < 20; s++) bar(d, M.X(s) + 2, M.Y(rate(s)), 22, M.Y(0) - M.Y(rate(s)), s >= 10, { r: 1 });
  const comb = (3000 + 7000) / 20;
  d.rect(M.X(10) + 1, M.Y(rate(10)), 258, M.Y(comb) - M.Y(rate(10)), { r: 0, stroke: C.acc, fill: C.acc, fs: 'hachure', gap: 6, sw: 0.8, single: true });
  d.line(M.X(0), M.Y(comb), M.X(20), M.Y(comb), { stroke: C.slate, dash: [6, 4], sw: 1.3, single: true });
  sm(d, 66, M.Y(comb) - 10, `combined: 10,000 / 20 s = ${f(comb)} req/s`, 'start', { color: C.slate });
  sm(d, M.X(5), M.Y(300) - 10, '300 req/s');
  sm(d, M.X(15), M.Y(700) - 10, '700 req/s');
  mo(d, M.X(15), (M.Y(700) + M.Y(comb)) / 2, `${f((700 - comb) * 10)} requests above ${f(comb)}/s`, 'middle', 10);
  [0, 10, 20].forEach((s) => xs(d, M.X(s), 232, `${s} s`));
  d.brace(M.X(0) + 2, M.X(10) - 2, 250, { label: '3,000 requests in 10 s = 300/s' });
  d.brace(M.X(10) + 2, M.X(20) - 2, 250, { label: '7,000 requests in 10 s = 700/s' });
  sweep(d, M.X(0), M.X(20), 48, 220, [0, 1], C.ink2);
  return d.svg();
}

export function sd_performance_concurrency() {
  const d = cv('sd_performance_concurrency', 'THE UNITS CANCEL TO REQUESTS', 300);
  d.cycle = 4;
  d.rect(180, 56, 290, 160, { r: 8, stroke: C.ink2, sw: 1.2 });
  sm(d, 325, 74, `inside the service boundary: ${f(ACTIVE)} requests`);
  for (let i = 0; i < ACTIVE; i++) d.dot(200 + (i % 25) * 10.5, 100 + Math.floor(i / 25) * 12, 2.3, i === ACTIVE - 1 ? C.acc : C.ink2);
  xs(d, 325, 202, `each stays ${RES} s on average (the mean, not the p99)`);
  [0, 1, 2].forEach((i) => d.person(40 + i * 30, 112 + (i % 2) * 24, 24));
  sm(d, 90, 180, `${f(PEAK)} requests/s arrive`);
  sm(d, 560, 180, `${f(PEAK)} complete/s`);
  d.arrow(140, 136, 176, 136, { stroke: C.ink2 });
  d.arrow(474, 136, 600, 136, { stroke: C.ink2 });
  for (let i = 0; i < 6; i++) { const a = i / 6; d.travel([[130, 136], [180, 136]], { at: [a, a + 0.12], r: 3, color: C.ink2 }); d.travel([[470, 136], [600, 136]], { at: [a, a + 0.2], r: 3, color: C.ink2 }); }
  d.travel([[180, 136], [470, 136]], { at: [0, 1], r: 4.5 });
  d.rect(150, 236, 340, 32, { r: 5, fill: C.accSoft, stroke: C.acc });
  mo(d, 320, 252, `L = λW = ${f(PEAK)} /s × ${RES} s = ${f(ACTIVE)} requests`, 'middle', 11.5);
  xs(d, 320, 286, 'seconds cancel, leaving a count of unfinished requests');
  return d.svg();
}

export function sd_performance_pool() {
  const d = cv('sd_performance_pool', 'CONNECTION HOLD TIME SETS AN OCCUPANCY BOUND', 300);
  d.cycle = 5;
  const SLOTS = 20, HOLD = 0.01, PER = 1 / HOLD, CEIL = SLOTS / HOLD;
  d.server(30, 80, 70, 100, { label: 'app instance' });
  d.db(540, 86, 70, 96, { under: 'database' });
  sm(d, 316, 70, `${SLOTS} pooled connections`);
  for (let i = 0; i < SLOTS; i++) {
    const x = 150 + (i % 10) * 34, y = 86 + Math.floor(i / 10) * 46;
    d.rect(x, y, 26, 32, { r: 4, fill: C.card, stroke: C.ink2, sw: 0.9 });
    d.line(x + 9, y + 8, x + 9, y + 16, { stroke: C.gray, single: true, sw: 1.4 });
    d.line(x + 17, y + 8, x + 17, y + 16, { stroke: C.gray, single: true, sw: 1.4 });
  }
  d.line(102, 130, 146, 130, { stroke: C.ink2, single: true });
  d.line(484, 130, 536, 130, { stroke: C.ink2, single: true });
  for (let i = 0; i < 8; i++) {
    const x = 163 + (i * 3 % 10) * 34, y = i % 2 ? 148 : 102, a = i / 8;
    d.travel([[102, 130], [x, y], [x, y], [538, 130]], { at: [a, a + 0.28], r: 3.5 });
  }
  const tx = 150, tk = 330 / 50;
  sm(d, 144, 222, 'one slot', 'end');
  for (let j = 0; j < 5; j++) bar(d, tx + j * 10 * tk + 1, 212, 10 * tk - 2, 20, j === 0);
  [0, 10, 20, 30, 40, 50].forEach((v) => xs(d, tx + v * tk, 242, `${v} ms`));
  sm(d, 500, 222, `1 / ${HOLD} s = ${f(PER)} ops/s`, 'start');
  mo(d, 320, 270, `${SLOTS} slots / ${HOLD} s = ${f(CEIL)} ops/s, an ideal ceiling`, 'middle', 11);
  d.hand(575, 40, 'the database may\nlimit it first', { size: 15, vc: true });
  return d.svg();
}

export function sd_performance_tail() {
  const d = cv('sd_performance_tail', 'ILLUSTRATIVE NEAREST-RANK PERCENTILES', 300);
  const s = [...Array(50).fill(5), ...Array(45).fill(40), ...Array(4).fill(100), 200];
  const n = s.length, mean = s.reduce((a, b) => a + b, 0) / n, ky = 0.85, base = 236, X = (k) => 60 + (k - 1) * 5.2;
  const rank = (q) => Math.ceil(q * n);
  s.forEach((v, i) => {
    const k = i + 1, hot = k === rank(0.99);
    d.fillRect(X(k), base - v * ky, 4.4, v * ky, hot ? C.acc : v >= 100 ? C.ink2 : C.slate, hot ? 1 : 0.75);
  });
  d.line(56, base, 590, base, { stroke: C.ink2, single: true });
  d.line(56, base - mean * ky, 590, base - mean * ky, { stroke: C.gray, dash: [5, 4], single: true });
  sm(d, 66, base - mean * ky - 9, `mean ${mean} ms`, 'start');
  const p = (q, ly, txt) => { const k = rank(q), x = X(k) + 2.2; d.line(x, base - s[k - 1] * ky - 3, x, ly + 7, { stroke: q === 0.99 ? C.acc : C.ink2, single: true, sw: 0.9 }); sm(d, x - 4, ly, txt, 'end'); };
  p(0.5, 196, `p50 = ${s[rank(0.5) - 1]} ms (rank ${rank(0.5)})`);
  p(0.95, 168, `p95 = ${s[rank(0.95) - 1]} ms (rank ${rank(0.95)})`);
  p(0.99, 128, `p99 = ${s[rank(0.99) - 1]} ms (rank ${rank(0.99)})`);
  sm(d, X(100) - 4, base - 200 * ky - 8, `max ${Math.max(...s)} ms`, 'end');
  d.brace(X(1), X(50) + 4, 248, { label: '50 at 5 ms' });
  d.brace(X(51), X(95) + 4, 248, { label: '45 at 40 ms' });
  xs(d, 630, 268, '4 at 100, 1 at 200', 'end');
  mo(d, 320, 288, `rank k = ⌈q × ${n}⌉ in the sorted sample`, 'middle', 10.5);
  d.hand(180, 110, 'averages do not\nshow who waited', { size: 16, vc: true });
  return d.svg();
}

export function sd_performance_histograms() {
  const d = cv('sd_performance_histograms', 'MERGE COUNTS BEFORE COMPUTING THE FLEET QUANTILE', 310);
  d.cycle = 6;
  const B = [5, 40, 100, 200], A = [1000, 0, 0, 0], Bc = [0, 0, 0, 10], Mg = A.map((v, i) => v + Bc[i]);
  const tot = Mg.reduce((a, b) => a + b, 0), rk = Math.ceil(0.99 * tot);
  const hist = (x0, base, cnt, w, gap, on) => cnt.forEach((c, i) => {
    const x = x0 + i * gap, h = c ? Math.max(3, c * 0.06) : 0;
    if (h) bar(d, x, base - h, w, h, on && i === 0, { r: 1 });
    d.line(x - 3, base, x + w + 3, base, { stroke: C.ink2, single: true, sw: 0.8 });
    if (c) mo(d, x + w / 2, base - h - 9, f(c), 'middle', 9.5);
    xs(d, x + w / 2, base + 11, `${B[i]}`);
  });
  d.server(24, 66, 40, 46, { label: 'instance A' });
  hist(96, 120, A, 32, 44, false);
  sm(d, 140, 80, 'local p99 = 5 ms', 'start');
  d.server(24, 176, 40, 46, { label: 'instance B' });
  hist(96, 240, Bc, 32, 44, false);
  sm(d, 96, 206, 'local p99 = 200 ms', 'start');
  xs(d, 240, 254, 'bucket, ms');
  d.carrow([[276, 100], [320, 112], [368, 128]], { stroke: C.ink2 });
  d.carrow([[276, 222], [320, 196], [368, 160]], { stroke: C.ink2 });
  sm(d, 490, 52, `merged histogram, ${f(tot)} requests`);
  hist(380, 170, Mg, 40, 56, true);
  d.rect(360, 196, 262, 44, { r: 5, fill: C.accSoft, stroke: C.acc });
  mo(d, 491, 210, `rank ⌈0.99 × ${f(tot)}⌉ = ${f(rk)}`, 'middle', 10.5);
  mo(d, 491, 226, `still in the 5 ms bucket: p99 = 5 ms`, 'middle', 10.5);
  const wrong = `average of local p99s: (5 + 200) / 2 = ${(5 + 200) / 2} ms`;
  mo(d, 24, 282, wrong, 'start', 10.5);
  d.line(20, 283, 24 + wrong.length * 6.3, 281, { stroke: C.ink, sw: 1.3, single: true });
  d.hand(500, 284, 'no request waited 102.5 ms', { size: 15 });
  for (let i = 0; i < 4; i++) d.travel([[276, 100], [320, 112], [400, 128]], { at: [i * 0.12, i * 0.12 + 0.2], r: 3, color: C.slate });
  d.travel([[276, 222], [320, 196], [568, 164]], { at: [0.55, 0.8], r: 3.5 });
  return d.svg();
}

export function sd_performance_omission() {
  const d = cv('sd_performance_omission', 'ARRIVALS NEED THEIR OWN CLOCK', 320);
  d.cycle = 8;
  const X = (t) => 80 + t * 5, S0 = 30, S1 = 70, svc = 5;
  const run = (open) => {
    const out = []; let free = 0;
    for (let t = 0; t < 100; t += 10) {
      if (!open && t < free) continue;
      const start = Math.max(t, free), dur = start === S0 ? S1 - S0 : svc;
      free = start + dur; out.push([t, start, free]);
    }
    return out;
  };
  const closed = run(false), open = run(true);
  d.line(X(S0), 40, X(S0), 244, { stroke: C.gray, dash: [3, 4], single: true });
  d.line(X(S1), 40, X(S1), 244, { stroke: C.gray, dash: [3, 4], single: true });
  xs(d, X(50), 40, 'dependency stall');
  const draw = (rows, y0) => rows.forEach(([a, st, e], i) => {
    const y = y0 + i * 7;
    if (st > a) d.line(X(a), y, X(st), y, { stroke: C.acc, sw: 2.2, single: true, rough: 0.2 });
    d.line(X(st), y, X(e), y, { stroke: C.ink2, sw: 2.2, single: true, rough: 0.2 });
    d.dot(X(a), y, 2, C.ink);
  });
  sm(d, 80, 54, 'reply-paced generator: send, wait for the reply, then send again', 'start');
  draw(closed, 66);
  [40, 50, 60].forEach((t) => d.circle(X(t), 66 + 3 * 7, 6, { stroke: C.gray, sw: 0.8, dash: [2, 2] }));
  const slow = (rows) => rows.filter(([a, , e]) => e - a > svc).length;
  sm(d, 80, 124, `${closed.length} samples, ${slow(closed)} slow; intended sends at 40, 50, 60 never happen`, 'start', { color: C.gray });
  sm(d, 80, 146, 'arrival-paced generator: sends follow the schedule while replies wait', 'start');
  draw(open, 160);
  sm(d, 80, 238, `${open.length} samples, ${slow(open)} waited longer than ${svc}`, 'start', { color: C.gray });
  d.line(X(0), 256, X(100), 256, { stroke: C.ink2, single: true, sw: 0.9 });
  [0, 20, 40, 60, 80, 100].forEach((t) => xs(d, X(t), 268, String(t)));
  xs(d, X(100) + 6, 256, 'time, illustrative units', 'start');
  d.line(400, 290, 420, 290, { stroke: C.acc, sw: 2.2, single: true });
  sm(d, 426, 290, 'waiting before service', 'start');
  d.line(250, 290, 270, 290, { stroke: C.ink2, sw: 2.2, single: true });
  sm(d, 276, 290, 'service', 'start');
  d.hand(130, 296, 'measure generator delay too', { size: 15 });
  sweep(d, X(0), X(100), 60, 232, [0, 1], C.ink2);
  return d.svg();
}

export function sd_performance_fanout() {
  const d = cv('sd_performance_fanout', 'THE PAGE WAITS FOR ITS LAST DEPENDENCY', 300);
  d.cycle = 7;
  const kids = [['score', 12], ['profile', 18], ['clip preview', 85]], end = Math.max(...kids.map((k) => k[1]));
  d.rect(30, 48, 220, 200, { r: 6, fill: C.card, stroke: C.ink2 });
  d.line(30, 66, 250, 66, { stroke: C.ink2, single: true });
  [44, 54, 64].forEach((x) => d.dot(x, 57, 2.2, C.gray));
  const panes = [[42, 78, 196, 44], [42, 130, 92, 104], [146, 130, 92, 104]];
  const T = (ms) => 0.05 + ms / 100 * 0.8;
  kids.forEach(([name, ms], i) => {
    const [x, y, w, h] = panes[i], last = ms === end;
    d.rect(x, y, w, h, { r: 3, stroke: last ? C.acc : C.ink2, sw: 0.9, dash: [3, 3] });
    xs(d, x + w / 2, y + h / 2 - 6, name);
    xs(d, x + w / 2, y + h / 2 + 8, `${ms} ms`);
    d.during([T(ms), 0.97], (g) => g.rect(x + 2, y + 2, w - 4, h - 4, { r: 2, fill: last ? C.accSoft : C.slateSoft, stroke: last ? C.acc : C.slate, sw: 0.8 }));
  });
  const X = (ms) => 300 + ms * 3;
  kids.forEach(([name, ms], i) => {
    const y = 80 + i * 40, last = ms === end;
    bar(d, X(0), y, ms * 3, 22, last);
    sm(d, X(ms) + 6, y + 11, `${name} · ${ms} ms`, 'start');
  });
  d.line(X(end), 66, X(end), 210, { stroke: C.acc, dash: [4, 4], single: true });
  sm(d, X(end) - 6, 66, 'page done', 'end');
  d.line(X(0), 210, X(100), 210, { stroke: C.ink2, single: true, sw: 0.9 });
  [0, 50, 100].forEach((v) => xs(d, X(v), 222, `${v} ms`));
  mo(d, 450, 248, `finish = max(${kids.map((k) => k[1]).join(', ')}) = ${end} ms`, 'middle', 11);
  xs(d, 450, 270, 'parallel children end at the maximum, durations illustrative');
  sweep(d, X(0), X(100), 70, 206, [0.05, 0.85]);
  return d.svg();
}

export function sd_performance_fanout_probability() {
  const d = cv('sd_performance_fanout_probability', 'INDEPENDENT REQUIRED CALLS MULTIPLY SUCCESS CHANCES', 290);
  const p = 0.99, M = d.axes(70, 50, 500, 180, { xmin: 0, xmax: 100, ymin: 0, ymax: 1, xl: 'required children n', yl: 'P(all finish in time)' });
  d.fn((n) => p ** n, 0, 100, M, { n: 100 });
  const pc = (n) => r4(p ** n * 100);
  [[1, 84, 40, 'start'], [10, 196, 60, 'start'], [100, 562, 186, 'end']].forEach(([n, lx, ly, a]) => {
    d.dot(M.X(n), M.Y(p ** n), 3.4, C.acc);
    sm(d, lx, ly, `${n} ${n === 1 ? 'child' : 'children'} · ${pc(n)}%`, a);
  });
  d.line(M.X(10) + 4, M.Y(p ** 10) - 2, 192, 62, { stroke: C.gray, single: true, sw: 0.8 });
  sm(d, 196, 74, `one or more late: ${r4(100 - pc(10))}%`, 'start', { color: C.gray });
  mo(d, 380, 212, 'P(every child on time) = 0.99^{n}', 'middle', 11);
  [[1, '100%'], [0.5, '50%'], [0, '0']].forEach(([v, s]) => xs(d, 64, M.Y(v), s, 'end'));
  [0, 50, 100].forEach((n) => xs(d, M.X(n), 244, String(n)));
  xs(d, 320, 274, 'assumes independent children; shared stalls break the multiplication');
  return d.svg();
}

export function sd_performance_hedging() {
  const d = cv('sd_performance_hedging', 'A DELAYED DUPLICATE ADDS WORK AND NEEDS CANCELLATION', 330);
  d.cycle = 8;
  const xc = 90, xa = 330, xb = 550;
  d.laptop(60, 30, 60, { label: 'caller' });
  d.server(xa - 22, 34, 44, 32, { label: 'owner A' });
  d.server(xb - 22, 34, 44, 32, { label: 'owner B' });
  [xc, xa, xb].forEach((x) => d.line(x, 84, x, 290, { stroke: C.line, dash: [4, 5], single: true }));
  d.rect(xa - 6, 110, 12, 110, { r: 2, fill: C.card, stroke: C.ink2, sw: 0.9 });
  d.rect(xa - 6, 220, 12, 38, { r: 2, stroke: C.acc, fill: C.acc, fs: 'hachure', gap: 3, sw: 0.9 });
  d.rect(xb - 6, 170, 12, 30, { r: 2, fill: C.slateSoft, stroke: C.slate, sw: 0.9 });
  d.line(xa - 8, 256, xa + 8, 266, { stroke: C.ink, sw: 1.4, single: true });
  d.line(xa + 8, 256, xa - 8, 266, { stroke: C.ink, sw: 1.4, single: true });
  const msg = [[[xc + 6, 90], [xa - 8, 110], 'original read', 210, 88, C.ink2], [[xc + 6, 150], [xb - 8, 170], 'delayed hedge', 200, 144, C.ink2], [[xb - 8, 200], [xc + 6, 222], 'first useful reply', 450, 196, C.slate], [[xc + 6, 240], [xa - 8, 258], 'cancel remaining work', 200, 236, C.acc]];
  msg.forEach(([a, b, s, lx, ly, col], i) => {
    d.arrow(a[0], a[1], b[0], b[1], { stroke: col, hl: 7 });
    mo(d, lx, ly, s, 'middle', 10);
    d.travel([a, b], { at: [[0.02, 0.22, 0.5, 0.74][i], [0.14, 0.42, 0.66, 0.86][i]], token: 'packet', fill: i === 3 ? C.accSoft : C.paper, color: i === 3 ? C.acc : C.ink2 });
  });
  d.vbrace(xc - 8, 90, 150, { dir: -1, label: 'hedge delay' });
  d.pulse(xa, 258, { at: [0.86, 0.98], r1: 20 });
  d.hand(450, 252, 'the loser keeps working\nuntil it is cancelled', { size: 15, vc: true });
  sm(d, 320, 306, 'two attempts reached the owners: charge both to the capacity budget');
  xs(d, 320, 322, 'ordering only, no benchmark timing');
  return d.svg();
}

export function sd_performance_iops() {
  const d = cv('sd_performance_iops', 'OPERATIONS TIMES THEIR SIZE GIVES A BYTE RATE', 280);
  d.cycle = 4;
  const OPS = 2000, KB = 4, B = KB * 1024, RATE = OPS * B;
  d.disk(120, 140, 150, { arm: true });
  d.spin(120, 140, (g) => { g.line(120, 140 - 66, 120, 140 - 50, { stroke: C.acc, sw: 2.4, single: true }); g.line(120 + 66, 140, 120 + 50, 140, { stroke: C.gray, sw: 1.2, single: true }); }, { dur: 1.2 });
  sm(d, 120, 52, `device: ${f(OPS)} reads/s`);
  sm(d, 120, 230, 'one read = one operation');
  d.line(210, 116, 600, 116, { stroke: C.ink2, single: true });
  d.line(210, 164, 600, 164, { stroke: C.ink2, single: true });
  for (let x = 222; x < 600; x += 18) d.line(x, 164, x - 6, 172, { stroke: C.line, single: true, sw: 0.7 });
  [250, 330, 410, 490].forEach((x) => { d.rect(x, 127, 60, 26, { r: 3, fill: C.card, stroke: C.ink2, sw: 0.9 }); mo(d, x + 30, 140, `${KB} KiB`, 'middle', 10); });
  for (let i = 0; i < 4; i++) d.travel([[214, 140], [600, 140]], { at: [i / 4, i / 4 + 0.5], label: `${KB} KiB`, w: 60 });
  sm(d, 405, 102, `each read moves ${KB} KiB = ${f(B)} bytes`);
  d.rect(240, 196, 360, 34, { r: 5, fill: C.accSoft, stroke: C.acc });
  mo(d, 420, 213, `${f(OPS)} × ${f(B)} B = ${f(RATE)} B/s`, 'middle', 12);
  sm(d, 420, 248, `${r4(RATE / 1e6)} decimal MB/s of counted reads`);
  xs(d, 420, 266, 'a query may need zero, one or several of these reads: count at the device');
  return d.svg();
}

export function sd_performance_locality() {
  const d = cv('sd_performance_locality', 'LOCALITY AND HIT RATIO CHANGE PHYSICAL WORK', 330);
  d.cycle = 5;
  const PAGE = 4096, REGION = 64 * 1024, PAGES = REGION / PAGE, Q = 1000, PPQ = 4, HIT = 0.9;
  const refs = Q * PPQ, miss = Math.round(refs * (1 - HIT)), bytes = miss * PAGE;
  sm(d, 40, 44, `a contiguous 64 KiB region holds ${PAGES} pages of 4 KiB`, 'start');
  d.tape(40, 62, Array(PAGES).fill(''), { cw: 24, h: 24, hot: () => false });
  d.brace(40, 40 + PAGES * 24, 58, { dir: -1 });
  for (let i = 0; i < PAGES; i++) d.line(52 + i * 24, 90, 52 + i * 24, 98, { stroke: C.gray, single: true, sw: 0.8 });
  sm(d, 440, 66, '1 read × 64 KiB', 'start');
  sm(d, 440, 86, `or ${PAGES} reads × 4 KiB`, 'start');
  xs(d, 440, 104, `same ${f(REGION)} bytes, different operation count`, 'start');
  d.line(20, 124, 620, 124, { stroke: C.line, single: true, dash: [2, 4] });
  [0, 1, 2].forEach((i) => d.doc(30 + i * 12, 180 + i * 8, 40, 50));
  sm(d, 62, 254, `${f(Q)} queries/s`);
  d.arrow(100, 210, 236, 210, { stroke: C.ink2 });
  sm(d, 168, 182, `× ${PPQ} pages each`);
  mo(d, 168, 198, `${f(refs)} refs/s`, 'middle', 10);
  d.ram(240, 186, 200, 48, { chips: 10, chip: (i) => i === 9 ? C.paper : C.slateSoft });
  sm(d, 340, 252, `${HIT * 100}% hit: ${f(refs * HIT)} refs/s from memory`);
  d.arrow(444, 210, 520, 210, { stroke: C.acc });
  sm(d, 482, 182, `${Math.round((1 - HIT) * 100)}% miss`);
  mo(d, 482, 198, `${f(miss)}/s`, 'middle', 10);
  d.disk(560, 210, 64, { arm: true });
  mo(d, 320, 288, `${f(Q)} × ${PPQ} × ${r4(1 - HIT)} = ${f(miss)} page reads/s`, 'middle', 11);
  mo(d, 320, 308, `${f(miss)} × ${f(PAGE)} B = ${f(bytes)} B/s (${r4(bytes / 1e6)} MB/s)`, 'middle', 11);
  for (let i = 0; i < 10; i++) {
    const a = i / 10, end = i === 9 ? [[100, 210], [440, 210], [560, 210]] : [[100, 210], [258 + i * 18.5, 210]];
    d.travel(end, { at: [a * 0.7, a * 0.7 + (i === 9 ? 0.3 : 0.18)], r: i === 9 ? 4.5 : 3, color: i === 9 ? C.acc : C.slate });
  }
  d.pulse(560, 210, { at: [0.9, 1], r1: 26 });
  return d.svg();
}

export function sd_performance_bandwidth() {
  const d = cv('sd_performance_bandwidth', 'ILLUSTRATIVE PAYLOAD BY PATH', 280);
  const api = PEAK * PAY, sends = LIVE_EV * VIEWERS, live = sends * LIVE_B, link = 1e9 / 8, px = 64 / live;
  d.server(30, 50, 50, 40, { unit: 18 });
  sm(d, 100, 52, `API responses: ${f(PEAK)}/s × ${f(PAY)} B = ${f(api)} B/s (${f(api * 8 / 1e6)} Mbit/s)`, 'start');
  d.rect(90, 68, 510, Math.max(3, api * px), { r: 1, fill: C.ink2, stroke: C.ink2, sw: 0.6 });
  d.flowline([[92, 69.5], [600, 69.5]], { color: C.ink2, sw: 1.2 });
  d.server(30, 152, 50, 76, { unit: 18 });
  sm(d, 100, 132, `live delivery: ${f(sends)} sends/s × ${LIVE_B} B = ${f(live)} B/s (${r4(live * 8 / 1e9)} Gbit/s)`, 'start');
  const h = live * px, lh = link * px, cy = 190;
  d.rect(90, cy - h / 2, 240, h, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.poly([[330, cy - h / 2], [370, cy - lh / 2], [370, cy + lh / 2], [330, cy + h / 2]], { fill: C.accSoft, stroke: C.acc });
  d.rect(370, cy - lh / 2, 230, lh, { r: 1, fill: C.card, stroke: C.ink2 });
  mo(d, 485, cy, `link 1 Gbit/s = ${f(link)} B/s`, 'middle', 9.5);
  [-20, -8, 4, 16].forEach((dy) => d.flowline([[94, cy + dy], [330, cy + dy * 0.62], [600, cy + dy * 0.62 * (dy > 10 || dy < -12 ? 0 : 1)]], { color: C.acc, sw: 1.2, gap: 7, dur: 0.9 }));
  [[338, cy - h / 2 - 6], [346, cy - h / 2 - 14], [338, cy + h / 2 + 6], [348, cy + h / 2 + 14]].forEach(([x, y]) => d.line(x, y, x + 6, y + (y < cy ? -5 : 5), { stroke: C.acc, single: true, sw: 1.2 }));
  sm(d, 350, 248, `payload alone is ${r4(live / link)} × the link, before headers or retransmits`);
  d.hand(470, 100, 'delivery count is not\nAPI request count', { size: 15, vc: true });
  return d.svg();
}

export function sd_performance_fanout_bytes() {
  const d = cv('sd_performance_fanout_bytes', 'THE GATEWAY INPUT AND OUTPUT HAVE DIFFERENT MULTIPLIERS', 320);
  d.cycle = 5;
  const up = LIVE_EV * GW * LIVE_B, down = LIVE_EV * VIEWERS * LIVE_B, per = VIEWERS / GW, dotv = 100;
  mo(d, 20, 36, `in: ${LIVE_EV} events/s × ${GW} copies × ${LIVE_B} B = ${f(up)} B/s`, 'start', 10);
  d.phone(40, 132, 60, { label: 'scorer' });
  for (let i = 0; i < GW; i++) {
    const gy = 52 + i * 50;
    d.line(76, 162, 226, gy + 15, { stroke: C.ink2, single: true, sw: 0.9 });
    d.travel([[76, 162], [226, gy + 15]], { at: [i * 0.04, i * 0.04 + 0.25], token: 'packet', fill: C.paper, color: C.ink2 });
    d.server(230, gy, 50, 30, { unit: 14 });
    d.flowline([[284, gy + 15], [354, gy + 15]], { color: C.acc });
    for (let k = 0; k < per / dotv; k++) d.dot(362 + (k % 25) * 8.2, gy + 3 + Math.floor(k / 25) * 8, 1.7, C.ink2);
    xs(d, 580, gy + 15, f(per), 'start');
  }
  sm(d, 255, 312, 'gateways', 'middle');
  mo(d, 20, 300, '', 'start');
  sm(d, 460, 292, `out: ${LIVE_EV} × ${f(VIEWERS)} viewers × ${LIVE_B} B = ${f(down)} B/s`);
  xs(d, 460, 310, `one dot = ${dotv} viewers; ${f(per)} per gateway`);
  d.hand(120, 260, 'small upstream,\nlarge delivery', { size: 15, vc: true });
  return d.svg();
}

export function sd_performance_storage() {
  const d = cv('sd_performance_storage', 'ILLUSTRATIVE LOGICAL AND REPLICATED STORAGE', 300);
  d.cycle = 6;
  const day = DAY * REC_B, all = ONE_COPY * COPIES, gib = r4(all / 2 ** 30);
  sm(d, 136, 44, `${DAYS} retained days, ${r4(day / 1e9)} GB each`);
  for (let i = 0; i < DAYS; i++) {
    const x = 30 + (i % 6) * 36, y = 58 + Math.floor(i / 6) * 30;
    d.rect(x, y, 32, 26, { r: 2, fill: C.card, stroke: C.ink2, sw: 0.8 });
    xs(d, x + 16, y + 13, String(i + 1));
  }
  d.arrow(254, 130, 296, 130, { stroke: C.ink2 });
  d.db(300, 92, 80, 80, { label: `${r4(ONE_COPY / 1e9)} GB`, size: 11 });
  sm(d, 340, 190, 'one logical copy');
  d.arrow(388, 130, 426, 130, { stroke: C.acc });
  [0, 1, 2].forEach((i) => d.db(434 + i * 62, 100, 54, 64, { fill: C.accSoft, stroke: C.acc, label: `copy ${i + 1}`, size: 10 }));
  d.brace(434, 608, 178, { label: `${r4(all / 1e9)} GB, about ${gib} GiB` });
  mo(d, 320, 238, `${f(DAY)} records/day × ${REC_B} B = ${f(day)} B/day`, 'middle', 10.5);
  mo(d, 320, 258, `× ${DAYS} days = ${f(ONE_COPY)} B;  × ${COPIES} copies = ${f(all)} B`, 'middle', 10.5);
  xs(d, 320, 284, 'count the physical work, not just rows');
  d.travel([[254, 130], [300, 130]], { at: [0, 0.2], token: 'packet' });
  [0, 1, 2].forEach((i) => d.travel([[380, 130], [461 + i * 62, 132]], { at: [0.3 + i * 0.1, 0.55 + i * 0.1], token: 'packet' }));
  return d.svg();
}

export function sd_performance_storage_overhead() {
  const d = cv('sd_performance_storage_overhead', 'ADD INDEX BYTES BEFORE COUNTING REPLICAS', 300);
  const rows = ONE_COPY / 1e9, idx = rows * 0.2, per = rows + idx, tot = per * COPIES, k = 0.8, base = 226;
  [0, 1, 2].forEach((i) => {
    const x = 80 + i * 180;
    d.rect(x - 10, 50, 140, base - 50 + 8, { r: 4, stroke: C.ink2, sw: 1 });
    d.rect(x, base - rows * k, 120, rows * k, { r: 1, fill: C.card, stroke: C.ink2, sw: 0.9 });
    d.rect(x, base - per * k, 120, idx * k, { r: 1, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
    d.rect(x, base - per * k - 34, 120, 28, { r: 1, stroke: C.gray, dash: [3, 3], sw: 0.8 });
    xs(d, x + 60, base - per * k - 20, 'logs, rebuild space');
    sm(d, x + 60, base - rows * k / 2, `rows ${r4(rows)} GB`);
    sm(d, x + 60, base - rows * k - idx * k / 2, `index ${r4(idx)} GB`);
    sm(d, x + 60, 40, `copy ${i + 1}: ${r4(per)} GB`);
  });
  d.brace(70, 570, 246, { label: `${COPIES} copies × ${r4(per)} GB = ${r4(tot)} GB` });
  mo(d, 320, 286, `${r4(rows)} GB × 1.2 = ${r4(per)} GB per copy; dashed space stays extra`, 'middle', 10);
  return d.svg();
}

export function sd_performance_cache() {
  const d = cv('sd_performance_cache', 'ENTRY OVERHEAD IS PART OF THE MEMORY BUDGET', 300);
  const KEYS = 100000, PB = 2000, OV = 100, EB = PB + OV, ENT = KEYS * EB, k = 0.25;
  sm(d, 60, 42, 'one cache entry, drawn to scale', 'start');
  d.rect(60, 54, PB * k, 28, { r: 2, fill: C.card, stroke: C.ink2 });
  d.rect(60 + PB * k, 54, OV * k, 28, { r: 2, fill: C.accSoft, stroke: C.acc });
  sm(d, 60 + PB * k / 2, 68, `payload ${f(PB)} B`);
  sm(d, 60 + EB * k + 6, 68, `${OV} B key + bookkeeping`, 'start');
  d.brace(60, 60 + EB * k, 88, { label: `${f(EB)} B per entry` });
  [0, 1].forEach((i) => {
    const x = 60 + i * 290;
    d.ram(x, 140, 230, 50, { chips: 6, chip: (j) => j === 5 ? C.accSoft : C.paper });
    sm(d, x + 115, 128, i ? 'replica' : 'primary');
    mo(d, x + 115, 206, `${f(KEYS)} × ${f(EB)} B`, 'middle', 10);
    mo(d, x + 115, 222, `= ${f(ENT)} B`, 'middle', 10);
  });
  d.rect(46, 112, 258, 124, { r: 6, stroke: C.gray, dash: [4, 4], sw: 0.8 });
  xs(d, 175, 248, 'the process also holds buffers, code, temporary objects');
  mo(d, 320, 278, `2 copies × ${f(ENT / 1e6)} MB = ${f(2 * ENT / 1e6)} MB before allocator slack`, 'middle', 11);
  return d.svg();
}

export function sd_performance_cpu() {
  const d = cv('sd_performance_cpu', 'CPU SERVICE DEMAND IS DIFFERENT FROM WALL TIME', 300);
  d.cycle = 6;
  const cores = 4, x0 = 120, k = 40, X = (t) => x0 + t * k, free = Array(cores).fill(0), jobs = [];
  for (let i = 0; i < 10; i++) { const c = free.findIndex((v) => v <= i); free[c] = i + CPU_MS; jobs.push([c, i]); }
  for (let c = 0; c < cores; c++) { const y = 46 + c * 32; xs(d, x0 - 8, y + 12, `core ${c + 1}`, 'end'); d.line(x0, y + 24, X(11), y + 24, { stroke: C.line, single: true, sw: 0.7 }); }
  jobs.forEach(([c, t], i) => { const y = 46 + c * 32; bar(d, X(t) + 1, y + 2, CPU_MS * k - 2, 20, true); mo(d, X(t) + CPU_MS * k / 2, y + 12, `r${i}`, 'middle', 9); });
  [0, 2, 4, 6, 8, 10].forEach((v) => xs(d, X(v), 184, `${v} ms`));
  sm(d, X(11) + 8, 62, 'two cores', 'start'); sm(d, X(11) + 8, 76, 'stay busy', 'start');
  sm(d, X(11) + 8, 126, 'two cores', 'start'); sm(d, X(11) + 8, 140, 'stay free', 'start');
  xs(d, 320, 32, 'one request arrives every millisecond, each needs 2 ms of CPU');
  const wx = 120, wk = 2;
  sm(d, wx, 206, `one request: ${RES * 1000} ms in the service, ${CPU_MS} ms on a core`, 'start');
  d.rect(wx, 216, RES * 1000 * wk, 14, { r: 2, stroke: C.ink2, sw: 0.9, dash: [3, 3] });
  d.fillRect(wx + 60 * wk, 217, CPU_MS * wk, 12, C.acc, 1);
  mo(d, 320, 254, `${f(PEAK)} req/s × ${CPU_MS / 1000} s = ${(PEAK * CPU_MS) / 1000} CPU-seconds/s`, 'middle', 11);
  mo(d, 320, 274, `ceiling: ${cores} cores / ${CPU_MS / 1000} s = ${f(cores / (CPU_MS / 1000))} req/s`, 'middle', 11);
  d.hand(560, 222, 'waiting is not\nCPU work', { size: 15, vc: true });
  sweep(d, X(0), X(10), 42, 174, [0, 1], C.ink2);
  return d.svg();
}

export function sd_performance_bounds() {
  const d = cv('sd_performance_bounds', 'DIFFERENT WAITS NEED DIFFERENT FIXES', 290);
  d.cycle = 4;
  d.line(320, 36, 320, 268, { stroke: C.line, dash: [3, 4], single: true });
  d.text(165, 44, 'compute limit', { cls: 'ttl' });
  d.text(475, 44, 'I/O wait', { cls: 'ttl' });
  [0, 1, 2].forEach((i) => d.envelope(36, 98 + i * 18, 26, 16));
  d.arrow(68, 124, 118, 124, { stroke: C.ink2 });
  d.cpu(130, 90, 70, { die: C.accSoft, under: 'every core busy' });
  d.gear(252, 108, 20, { spin: 2, fill: C.accSoft, stroke: C.acc });
  d.gear(282, 140, 13, { spin: 1.4, ccw: true });
  sm(d, 165, 220, 'callers queue for compute', 'middle', { color: C.gray });
  sm(d, 165, 250, 'fix: optimize the work or add compute');
  d.cpu(350, 96, 56, { under: 'app CPU mostly idle' });
  d.tape(432, 108, ['', '', '', ''], { cw: 24, h: 26, hot: () => true });
  d.db(548, 88, 56, 70, { under: 'storage' });
  xs(d, 480, 146, 'queued I/O');
  for (let i = 0; i < 4; i++) d.travel([[410, 121], [436 + i * 24, 121]], { at: [i * 0.2, i * 0.2 + 0.18], r: 3.5 });
  d.flowline([[528, 121], [546, 121]], { color: C.acc });
  d.hand(470, 200, 'idle CPU does not\nprove spare capacity', { size: 15, vc: true });
  sm(d, 475, 250, 'fix: bound overlap, inspect the I/O');
  return d.svg();
}

export function sd_performance_bottleneck() {
  const d = cv('sd_performance_bottleneck', 'THE SLOWEST SHARED STAGE LIMITS COMPLETIONS', 280);
  d.cycle = 3;
  [0, 1, 2].forEach((i) => d.person(40 + (i % 2) * 26, 100 + i * 30, 24));
  const top = [[120, 95], [300, 95], [340, 128], [460, 128], [500, 118], [600, 118]], bot = [[600, 162], [500, 162], [460, 152], [340, 152], [300, 185], [120, 185]];
  d.lines(top, { stroke: C.ink2, single: true, sw: 1.3 });
  d.lines(bot, { stroke: C.ink2, single: true, sw: 1.3 });
  d.line(120, 95, 120, 185, { stroke: C.ink2, single: true, dash: [3, 3] });
  d.rect(340, 128, 120, 24, { r: 0, fill: C.accSoft, stroke: C.acc });
  for (let i = 0; i < 26; i++) d.dot(258 + (i % 6) * 7, 104 + Math.floor(i / 6) * 17, 2.6, C.ink2);
  [-30, 0, 30].forEach((dy) => d.flowline([[124, 140 + dy], [250, 140 + dy]], { color: C.ink2, dur: 0.6 }));
  d.flowline([[302, 140], [600, 140]], { color: C.acc, dur: 1.6 });
  sm(d, 55, 80, 'many callers');
  sm(d, 210, 80, 'app admission');
  sm(d, 400, 112, 'DB service limit');
  sm(d, 552, 104, 'bounded result rate');
  xs(d, 280, 200, 'work waits here');
  xs(d, 400, 166, 'slowest shared stage');
  sm(d, 320, 236, 'compare stages in the same unit: divide DB capacity by operations per request');
  d.hand(320, 262, 'capacity is a property of the whole path', { size: 15 });
  return d.svg();
}

export function sd_performance_queue_curve() {
  const d = cv('sd_performance_queue_curve', 'M/M/1 MEAN TIME RISES AS SPARE SERVICE SHRINKS', 290);
  const mu = 1000, M = d.axes(70, 50, 500, 180, { xmin: 0, xmax: 1000, ymin: 0, ymax: 110, xl: 'arrivals λ per second', yl: 'mean time W, ms' });
  const W = (l) => 1000 / (mu - l);
  d.fn(W, 0, mu - 1000 / 110, M, { n: 160 });
  d.line(M.X(mu), 50, M.X(mu), 230, { stroke: C.gray, dash: [3, 4], single: true });
  xs(d, M.X(mu) + 4, 58, 'μ', 'start');
  [[500, 320, 205, 'middle'], [900, 510, 190, 'end'], [990, 555, 60, 'end']].forEach(([l, x, y, a]) => {
    d.dot(M.X(l), M.Y(W(l)), 3.4, C.acc);
    sm(d, x, y, `${l}/s → ${f(W(l))} ms · L = ${f(l * W(l) / 1000)}`, a);
  });
  sm(d, 555, 74, 'in the system', 'end', { color: C.gray });
  mo(d, 90, 74, `W = 1 / (μ − λ),  μ = ${f(mu)}/s`, 'start', 11);
  mo(d, 90, 92, 'ρ = λ / μ,  L = λW', 'start', 11);
  [[500, '0.5'], [900, '0.9'], [990, '0.99']].forEach(([l, s]) => xs(d, M.X(l), 244, `ρ ${s}`));
  xs(d, 320, 274, 'teaching model: Poisson arrivals, exponential service, one server');
  return d.svg();
}

export function sd_performance_loadtest() {
  const d = cv('sd_performance_loadtest', 'MEASURE THE QUEUE WHEN USEFUL COMPLETIONS PLATEAU', 290);
  d.cycle = 8;
  const M = d.axes(70, 50, 500, 170, { xmin: 0, xmax: 8.4, ymin: 0, ymax: 8.6, xl: 'test stage' });
  const off = [], comp = [], age = [];
  for (let s = 1; s <= 8; s++) { off.push([M.X(s - 1), M.Y(s)], [M.X(s), M.Y(s)]); }
  for (let i = 0; i <= 80; i++) { const s = i / 10, c = 5 - Math.log(1 + Math.exp(-(s - 5) * 1.6)) / 1.6; comp.push([M.X(s), M.Y(Math.min(s, c))]); age.push([M.X(s), M.Y(0.2 + Math.max(0, s - 5) ** 1.6 * 0.9)]); }
  d.lines(off, { stroke: C.ink, dash: [5, 4], single: true, sw: 1.2 });
  d.lines(comp, { stroke: C.slate, single: true, sw: 1.8, rough: 0.3 });
  d.lines(age, { stroke: C.acc, single: true, sw: 1.8, rough: 0.3 });
  d.line(M.X(5), 50, M.X(5), 220, { stroke: C.gray, dash: [2, 4], single: true });
  sm(d, M.X(5), 40, 'completions stop rising: find who owns the wait');
  for (let s = 1; s <= 8; s++) xs(d, M.X(s - 0.5), 232, String(s));
  const leg = [[70, 'offered work', C.ink, [5, 4]], [240, 'useful completions', C.slate], [430, 'oldest queue age', C.acc]];
  leg.forEach(([x, s, c, dash]) => { d.line(x, 262, x + 24, 262, { stroke: c, sw: 1.8, dash, single: true }); sm(d, x + 30, 262, s, 'start'); });
  xs(d, 320, 282, 'shapes illustrative; hold the workload mix fixed between stages');
  d.travel(off, { at: [0, 1], r: 4, color: C.ink });
  return d.svg();
}

export function sd_performance_backlog() {
  const d = cv('sd_performance_backlog', 'ILLUSTRATIVE BURST AND RECOVERY', 300);
  d.cycle = 8;
  const def = BURST - SVC, bot = 245, k = 150 / BACKLOG, Y = (q) => bot - q * k;
  sm(d, 60, 36, `arrivals during the burst: ${f(BURST)} jobs/s`, 'start');
  d.lines([[60, 50], [300, 50], [300, 72]], { stroke: C.ink2, single: true, sw: 6 });
  d.flowline([[60, 50], [300, 50], [300, 92]], { color: C.acc });
  d.fillRect(252, Y(BACKLOG), 136, BACKLOG * k, C.accFaint, 1);
  d.shift(0, -BACKLOG * k, (g) => g.line(252, bot, 388, bot, { stroke: C.acc, sw: 2, single: true }), { at: [0, 0.8] });
  d.lines([[250, 70], [250, 250], [390, 250], [390, 70]], { stroke: C.ink, sw: 1.4 });
  [[3000, 15], [6000, 30], [12000, 60]].forEach(([q, t]) => { d.line(384, Y(q), 394, Y(q), { stroke: C.ink2, single: true }); sm(d, 400, Y(q), `${f(q)} at ${t} s`, 'start'); });
  d.lines([[390, 236], [600, 236]], { stroke: C.ink2, single: true, sw: 6 });
  d.flowline([[390, 236], [600, 236]], { color: C.ink2 });
  sm(d, 540, 222, `service: ${f(SVC)} jobs/s`);
  mo(d, 40, 128, `${f(BURST)} − ${f(SVC)}`, 'start', 11);
  mo(d, 40, 146, `= ${def} jobs/s deficit`, 'start', 11);
  mo(d, 40, 164, `× ${BURST_S} s = ${f(BACKLOG)} jobs`, 'start', 11);
  sm(d, 40, 210, `after the burst: ${AFTER} jobs/s`, 'start');
  sm(d, 40, 228, `drain = ${f(SVC)} − ${AFTER} = ${SVC - AFTER}/s`, 'start', { color: C.acc });
  xs(d, 320, 282, 'constant rates, equal-cost jobs, nothing expires or is rejected');
  return d.svg();
}

export function sd_performance_backlog_trace() {
  const d = cv('sd_performance_backlog_trace', 'BACKLOG ADDS THE RATE DEFICIT OVER TIME', 300);
  d.cycle = 6;
  const def = BURST - SVC, X = (t) => 70 + t * 8, Y = (q) => 220 - q / BACKLOG * 160;
  d.line(70, 220, 590, 220, { stroke: C.ink2, single: true, sw: 0.9 });
  d.line(70, 224, 70, 50, { stroke: C.ink2, single: true, sw: 0.9 });
  xs(d, 76, 50, 'jobs waiting', 'start');
  d.line(X(0), Y(0), X(BURST_S), Y(BACKLOG), { stroke: C.acc, sw: 1.8, single: true, rough: 0.3 });
  const pts = [0, 15, 30, 60];
  pts.forEach((t, i) => {
    const q = def * t, x = X(t);
    d.dot(x, Y(q), 3.4, C.acc);
    if (t) sm(d, x - 6, Y(q) - 10, f(q), 'end');
    xs(d, x, 232, `${t} s`);
    const cells = BACKLOG / 1000, w = 8, tx = Math.min(Math.max(x - cells * w / 2, 14), 626 - cells * w);
    for (let c = 0; c < cells; c++) d.rect(tx + c * w, 246, w - 1, 14, { r: 0, fill: c < q / 1000 ? C.accSoft : C.card, stroke: c < q / 1000 ? C.acc : C.line, sw: 0.7, single: true });
  });
  d.hand(260, 90, `+${def} jobs every second`, { size: 16 });
  xs(d, 320, 282, 'each cell holds 1,000 waiting jobs');
  d.travel([[X(0), Y(0)], [X(BURST_S), Y(BACKLOG)]], { at: [0, 0.85], r: 5 });
  return d.svg();
}

export function sd_performance_drain() {
  const d = cv('sd_performance_drain', 'RECOVERY MUST ALSO SERVE NEW ARRIVALS', 300);
  d.cycle = 6;
  const spare = SVC - AFTER, tD = BACKLOG / spare, tW = BACKLOG / SVC;
  sm(d, 30, 50, `backlog ${f(BACKLOG)} jobs`, 'start');
  d.tape(30, 62, ['', '', '', '', '', ''], { cw: 24, h: 24, hot: () => true });
  d.carrow([[176, 74], [200, 90], [206, 112]], { stroke: C.acc });
  sm(d, 238, 82, `${spare} spare/s`, 'start', { color: C.acc });
  [0, 1, 2].forEach((i) => d.envelope(30 + i * 22, 196, 18, 12));
  d.carrow([[100, 202], [160, 190], [206, 162]], { stroke: C.slate });
  sm(d, 30, 222, `${AFTER} new jobs/s`, 'start', { color: C.slate });
  d.server(206, 110, 60, 60, { led: () => true });
  d.arrow(236, 184, 236, 236, { stroke: C.ink2 });
  sm(d, 236, 250, `${f(SVC)} served/s`);
  const X = (t) => 380 + t * 7, Y = (q) => 210 - q / BACKLOG * 150;
  d.line(380, 210, 610, 210, { stroke: C.ink2, single: true, sw: 0.9 });
  d.line(380, 214, 380, 52, { stroke: C.ink2, single: true, sw: 0.9 });
  d.line(X(0), Y(BACKLOG), X(tW), Y(0), { stroke: C.gray, dash: [4, 4], single: true });
  d.line(X(0), Y(BACKLOG), X(tD), Y(0), { stroke: C.acc, sw: 1.8, single: true, rough: 0.3 });
  sm(d, 386, 54, f(BACKLOG), 'start');
  [[0, '0'], [tW, `${tW} s`], [tD, `${tD} s`]].forEach(([t, s]) => xs(d, X(t), 224, s));
  sm(d, 470, 52, `${f(BACKLOG)} / ${spare} = ${tD} s`, 'start', { color: C.acc });
  xs(d, X(tW) + 4, 192, `${tW} s if new`, 'start');
  xs(d, X(tW) + 4, 203, 'work vanished', 'start');
  xs(d, 495, 246, 'backlog over time', 'middle');
  d.travel([[X(0), Y(BACKLOG)], [X(tD), Y(0)]], { at: [0, 0.9], r: 4.5 });
  d.travel([[176, 74], [200, 90], [210, 120]], { at: [0, 0.3], r: 3.5 });
  d.travel([[100, 202], [160, 190], [210, 160]], { at: [0.3, 0.6], r: 3.5, color: C.slate });
  return d.svg();
}

export function sd_performance_queue_budget() {
  const d = cv('sd_performance_queue_budget', 'WAITING AGE AND RETAINED STATE NEED SEPARATE LIMITS', 290);
  const budget = 0.1, ahead = SVC * budget, wait = BACKLOG / SVC, state = 16 * 1024, bytes = BACKLOG * state;
  d.line(330, 36, 330, 260, { stroke: C.line, dash: [3, 4], single: true });
  d.text(175, 44, 'deadline budget', { cls: 'ttl' });
  d.text(485, 44, 'retained state', { cls: 'ttl' });
  d.server(262, 88, 50, 56, { label: `${f(SVC)} jobs/s` });
  for (let i = 0; i < 11; i++) { const x = 238 - i * 18; if (i === 6) continue; bar(d, x, 104, 14, 24, i < 5, { r: 1 }); }
  d.line(130, 104, 122, 128, { stroke: C.ink2, single: true }); d.line(134, 104, 126, 128, { stroke: C.ink2, single: true });
  d.line(146, 94, 146, 140, { stroke: C.acc, sw: 2, single: true });
  sm(d, 146, 156, `${f(ahead)} jobs ahead`, 'middle', { color: C.acc });
  xs(d, 54, 156, `position ${f(BACKLOG)}`);
  mo(d, 175, 200, `${f(SVC)}/s × ${budget} s = ${f(ahead)} jobs`, 'middle', 10.5);
  mo(d, 175, 220, `${f(BACKLOG)} / ${f(SVC)}/s = ${wait} s wait`, 'middle', 10.5);
  d.ram(370, 92, 230, 52, { chips: 6, chip: () => C.accSoft });
  sm(d, 485, 80, `${f(BACKLOG)} waiting requests × 16 KiB`);
  mo(d, 485, 200, `${f(BACKLOG)} × 16 × 1,024 B`, 'middle', 10.5);
  mo(d, 485, 220, `= ${f(bytes)} bytes`, 'middle', 10.5);
  d.hand(320, 268, 'empty storage is not spare service', { size: 15 });
  return d.svg();
}

export function sd_performance_pressure() {
  const d = cv('sd_performance_pressure', 'CAPACITY FEEDBACK MUST REACH THE PRODUCER', 290);
  d.cycle = 5;
  d.server(40, 118, 60, 64, { label: 'producer' });
  d.tape(200, 136, ['', '', '', '', '', ''], { cw: 34, h: 28, hot: () => true });
  sm(d, 302, 180, 'bounded queue: 6 of 6 full');
  d.arrow(104, 150, 196, 150, { stroke: C.ink2 });
  d.arrow(406, 150, 450, 150, { stroke: C.ink2 });
  d.gear(480, 150, 26, { spin: 3 });
  sm(d, 480, 190, 'worker limit');
  d.arrow(510, 150, 600, 150, { stroke: C.ink2 });
  sm(d, 556, 136, 'completed');
  const fb = [[300, 132], [260, 80], [140, 76], [74, 112]];
  d.carrow(fb, { stroke: C.acc, sw: 1.5 });
  sm(d, 200, 62, 'capacity signal: full, retry later, no credits', 'middle', { color: C.acc });
  d.during([0.5, 1], (g) => g.line(150, 138, 150, 162, { stroke: C.acc, sw: 2.4, single: true }));
  d.during([0.5, 1], (g) => xs(g, 150, 172, 'admission reduced'));
  for (let i = 0; i < 3; i++) d.travel([[104, 150], [196, 150]], { at: [i * 0.15, i * 0.15 + 0.14], r: 3.5, color: C.ink2 });
  d.travel('M300,132 C260,80 140,76 74,112', { at: [0.3, 0.5], r: 4.5 });
  d.pulse(74, 112, { at: [0.48, 0.62], r1: 20 });
  for (let i = 0; i < 6; i++) d.travel([[510, 150], [600, 150]], { at: [i / 6, i / 6 + 0.12], r: 3, color: C.ink2 });
  sm(d, 320, 236, 'moving work into another unbounded queue only moves where it waits');
  d.hand(320, 264, 'overload needs an explicit response', { size: 15 });
  return d.svg();
}

export function sd_performance_retry_budget() {
  const d = cv('sd_performance_retry_budget', 'COUNT ATTEMPTS SEPARATELY FROM USER OPERATIONS', 300);
  d.cycle = 6;
  const O = 1000, r1 = O * 0.1, r2 = O * 0.01, tot = O + r1 + r2, per = 10;
  const rows = [['original', O, 62], ['first retry', r1, 150], ['second retry', r2, 206]];
  rows.forEach(([s, v, y]) => { sm(d, 20, y + (v === O ? 16 : 0), s, 'start'); mo(d, 620, y + (v === O ? 16 : 0), `${f(v)}/s`, 'end', 11); });
  for (let i = 0; i < O / per; i++) d.dot(130 + (i % 25) * 15, 56 + Math.floor(i / 25) * 11, 2.6, C.ink2);
  const rx = (i) => 190 + i * 32 + ((i * 37) % 11) - 5;
  for (let i = 0; i < r1 / per; i++) d.dot(rx(i), 150, 3.2, C.slate);
  d.dot(470, 206, 3.6, C.acc);
  [0, 3, 7].forEach((i, j) => { d.carrow([[130 + (i * 3 % 25) * 15, 100], [rx(i) - 10, 126], [rx(i), 144]], { stroke: C.line, hl: 5 }); d.travel([[130 + (i * 3 % 25) * 15, 100], [rx(i) - 10, 126], [rx(i), 146]], { at: [j * 0.15, j * 0.15 + 0.2], r: 3, color: C.slate }); });
  d.carrow([[rx(8), 156], [450, 186], [468, 200]], { stroke: C.line, hl: 5 });
  d.travel([[rx(8), 156], [450, 186], [470, 204]], { at: [0.6, 0.8], r: 3.5 });
  xs(d, 300, 172, 'backoff with jitter spreads them out');
  mo(d, 320, 244, `${f(O)} × (1 + 0.1 + 0.01) = ${f(tot)} attempts/s`, 'middle', 11.5);
  sm(d, 320, 264, `useful completions still match ${f(O)} operations/s; one dot = ${per} attempts/s`);
  d.hand(320, 288, 'spaced retries still cost work', { size: 15 });
  return d.svg();
}

export function sd_performance_scaling() {
  const d = cv('sd_performance_scaling', 'WHERE THE CAPACITY IS ADDED', 300);
  d.line(320, 36, 320, 270, { stroke: C.line, dash: [3, 4], single: true });
  d.text(165, 44, 'vertical: grow one machine', { cls: 'ttl' });
  d.text(475, 44, 'horizontal: add machines', { cls: 'ttl' });
  d.rect(50, 168, 44, 56, { r: 3, stroke: C.gray, dash: [3, 3], sw: 0.9 });
  xs(d, 72, 238, 'before');
  d.arrow(100, 196, 140, 196, { stroke: C.acc });
  d.server(150, 70, 110, 154, { unit: 19, fill: C.accSoft, stroke: C.acc, led: () => true });
  xs(d, 205, 238, 'more cores, memory, storage');
  sm(d, 165, 262, 'shared state stays local; one hot lock stays serial');
  d.router(435, 80, 80, { label: 'load balancer' });
  [0, 1, 2, 3].forEach((i) => {
    const x = 348 + i * 66;
    d.server(x, 126, 46, 48, { unit: 15 });
    d.line(475, 108, x + 23, 126, { stroke: C.ink2, single: true, sw: 0.8 });
    d.line(x + 23, 174, 475, 202, { stroke: C.ink2, single: true, sw: 0.8 });
  });
  d.db(445, 200, 60, 40, { bands: [0.5] });
  xs(d, 515, 222, 'shared state', 'start');
  sm(d, 475, 262, 'routing, pool budgets and state need a plan');
  d.hand(320, 288, 'first identify independent work', { size: 15 });
  return d.svg();
}

export function sd_performance_shared_pool() {
  const d = cv('sd_performance_shared_pool', 'PER-INSTANCE POOLS COMBINE AT THE DEPENDENCY', 300);
  d.cycle = 3;
  const INST = 5, SL = 20, tot = INST * SL;
  for (let i = 0; i < INST; i++) {
    const y = 44 + i * 44;
    d.server(30, y, 60, 34, { unit: 15 });
    for (let s = 0; s < SL; s++) d.line(102 + s * 5, y + 9, 102 + s * 5, y + 25, { stroke: C.ink2, single: true, sw: 1.1, rough: 0.2 });
    d.curve([[202, y + 17], [330, y + 17], [450, 160]], { stroke: C.line, single: true });
    d.flowline(`M202,${y + 17} Q330,${y + 17} 450,160`, { color: C.acc, dur: 1.4 });
  }
  sm(d, 150, 34, `${SL} slots each`);
  d.db(456, 112, 100, 100, { fill: C.accSoft, stroke: C.acc, under: 'one shared database' });
  mo(d, 506, 168, `${tot} calls`, 'middle', 11);
  mo(d, 320, 268, `${INST} instances × ${SL} slots = ${tot} simultaneous operations`, 'middle', 11);
  d.hand(370, 64, 'adding callers adds offered load', { size: 15 });
  xs(d, 320, 288, `doubling the instances offers ${tot * 2}; the database gains no service capacity`);
  return d.svg();
}

export function sd_performance_hotkey() {
  const d = cv('sd_performance_hotkey', 'FLEET AVERAGES HIDE ONE BUSY OWNER', 310);
  d.cycle = 6;
  const load = [22, 30, 18, 26, 96, 20, 24, 28], avg = load.reduce((a, b) => a + b, 0) / load.length, top = 50, H = 100, base = top + H;
  load.forEach((v, i) => {
    const x = 40 + i * 72, hot = v > 90;
    d.rect(x, top, 50, H, { r: 3, stroke: hot ? C.acc : C.ink2, sw: 1 });
    if (hot) d.blink((g) => g.fillRect(x + 2, base - v, 46, v - 2, C.acc, 0.85), { dur: 1.2, low: 0.45 });
    else d.fillRect(x + 2, base - v, 46, v - 2, C.slate, 0.55);
    xs(d, x + 25, base + 12, hot ? 'hot match' : `match ${i + 1}`);
    mo(d, x + 25, base - v - 8 < top + 8 ? top + 10 : base - v - 8, `${v}%`, 'middle', 9.5);
  });
  d.line(32, base - avg, 610, base - avg, { stroke: C.ink, dash: [6, 4], single: true, sw: 1.1 });
  sm(d, 40, 180, `dashed line: fleet average ${f(avg)}% looks comfortable`, 'start');
  const hx = 40 + 4 * 72 + 25;
  d.phone(120, 214, 52, { label: 'scorer' });
  d.tape(160, 230, ['e41', 'e42', 'e43', 'e44'], { cw: 34, h: 22 });
  d.carrow([[298, 241], [hx, 230], [hx, 166]], { stroke: C.ink2 });
  xs(d, 228, 266, 'ordered writes stay on one owner');
  [0, 1, 2].forEach((i) => { const x = 440 + i * 58; d.server(x, 222, 40, 34, { unit: 15 }); d.line(hx + 10, 166, x + 20, 222, { stroke: C.acc, single: true, sw: 0.9, dash: [3, 3] }); });
  xs(d, 527, 274, 'derived read copies spread viewers');
  for (let i = 0; i < 4; i++) d.travel([[160 + i * 34 + 17, 241], [298, 241], [hx, 230], [hx, 166]], { at: [i * 0.2, i * 0.2 + 0.2], r: 3.5 });
  d.hand(320, 298, 'spread reads without inventing writers', { size: 15 });
  return d.svg();
}

export function sd_performance_amdahl() {
  const d = cv('sd_performance_amdahl', 'ILLUSTRATIVE SPEEDUP WITH A SERIAL FRACTION', 290);
  const s = 0.2, S = (n) => 1 / (s + (1 - s) / n), M = d.axes(70, 50, 480, 180, { xmin: 1, xmax: 32, ymin: 0, ymax: 5.5, xl: 'workers n', yl: 'speedup' });
  d.line(M.X(1), M.Y(1 / s), M.X(32), M.Y(1 / s), { stroke: C.gray, dash: [5, 4], single: true });
  sm(d, 560, M.Y(1 / s) - 10, `limit 1 / ${s} = ${1 / s}×`, 'end');
  d.line(M.X(1), M.Y(1), M.X(5.5), M.Y(5.5), { stroke: C.slate, dash: [2, 3], single: true });
  sm(d, M.X(5.5) + 6, M.Y(5.5) + 2, 'ideal if nothing were serial', 'start', { color: C.slate });
  d.fn(S, 1, 32, M, { n: 124 });
  [[4, 126, 166], [8, 188, 136]].forEach(([n, x, y]) => { d.dot(M.X(n), M.Y(S(n)), 3.4, C.acc); sm(d, x, y, `${n} workers: ${r4(S(n))}×`, 'start'); });
  mo(d, 380, 192, `S(n) = 1 / (s + (1 − s) / n),  s = ${s}`, 'middle', 10.5);
  [1, 4, 8, 16, 32].forEach((n) => xs(d, M.X(n), 244, String(n)));
  [[1, '1'], [5, '5']].forEach(([v, t]) => xs(d, 64, M.Y(v), t, 'end'));
  xs(d, 320, 274, 'fixed work, ideal parallel part, no communication cost');
  return d.svg();
}

export function sd_performance_amdahl_trace() {
  const d = cv('sd_performance_amdahl_trace', 'THE SERIAL INTERVAL DOES NOT DIVIDE', 300);
  d.cycle = 6;
  const SER = 20, PAR = 80, x0 = 130, k = 4, X = (t) => x0 + t * k, one = SER + PAR;
  [[1, 46], [4, 100], [8, 160]].forEach(([n, y]) => {
    const h = 40, lane = h / n, tot = SER + PAR / n;
    xs(d, x0 - 10, y + h / 2, `${n} worker${n > 1 ? 's' : ''}`, 'end');
    d.rect(X(0), y, SER * k, h, { r: 2, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
    if (n === 1) sm(d, X(SER / 2), y + h / 2, `${SER} ms serial`);
    for (let j = 0; j < n; j++) d.rect(X(SER), y + j * lane + 0.5, PAR / n * k, lane - 1, { r: 1, fill: C.card, stroke: C.ink2, sw: 0.7, single: true });
    if (n === 1) sm(d, X(SER + PAR / 2), y + h / 2, `${PAR} ms parallel work`);
    sm(d, X(tot) + 8, y + h / 2, n === 1 ? `${one} ms` : `${f(tot)} ms, speedup ${r4(one / tot)}`, 'start');
  });
  d.line(X(0), 216, X(one), 216, { stroke: C.ink2, single: true, sw: 0.9 });
  [0, 20, 40, 60, 80, 100].forEach((v) => xs(d, X(v), 228, `${v} ms`));
  mo(d, 320, 254, `${SER} + ${PAR} / 4 = ${SER + PAR / 4} ms      ${SER} + ${PAR} / 8 = ${SER + PAR / 8} ms`, 'middle', 11);
  d.hand(470, 156, `the serial ${SER} ms does not divide`, { size: 15 });
  sweep(d, X(0), X(one), 40, 206, [0, 0.9]);
  return d.svg();
}

export function sd_performance_serial_reduction() {
  const d = cv('sd_performance_serial_reduction', 'REDUCING SHARED SERIAL WORK CHANGES THE BOUND', 290);
  const n = 8, base = 230, k = 160;
  [[0.2, 80], [0.1, 360]].forEach(([s, gx]) => {
    const t8 = s + (1 - s) / n;
    d.text(gx + 100, 44, `serial fraction ${s}`, { cls: 'ttl' });
    const col = (x, ser, par, lanes, label, val) => {
      d.rect(x, base - ser * k, 50, ser * k, { r: 1, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
      const lw = 50 / lanes;
      for (let j = 0; j < lanes; j++) d.rect(x + j * lw, base - (ser + par) * k, lw, par * k, { r: 0, fill: C.card, stroke: C.ink2, sw: 0.6, single: true });
      xs(d, x + 25, base + 12, label);
      mo(d, x + 25, base - (ser + par) * k - 9, val, 'middle', 10);
    };
    col(gx + 10, s, 1 - s, 1, '1 worker', '1.0');
    col(gx + 120, s, (1 - s) / n, n, `${n} workers`, String(r4(t8)));
    mo(d, gx + 100, 266, `1 / ${r4(t8)} = ${r4(1 / t8)}×`, 'middle', 11);
    xs(d, gx + 145, 100, `limit ${f(1 / s)}×`);
  });
  d.rect(250, 70, 14, 10, { r: 1, fill: C.accSoft, stroke: C.acc, sw: 0.8 }); xs(d, 270, 75, 'serial', 'start');
  d.rect(250, 86, 14, 10, { r: 1, fill: C.card, stroke: C.ink2, sw: 0.8 }); xs(d, 270, 91, 'parallel', 'start');
  xs(d, 320, 284, 'normalized one-worker work = 1, eight ideal workers');
  return d.svg();
}

export function sd_performance_headroom() {
  const d = cv('sd_performance_headroom', 'ILLUSTRATIVE ONE-SERVER FAILURE BUDGET', 310);
  d.cycle = 6;
  const per = 300, srv = 5, dem = PEAK, base = 196, k = 0.4;
  const group = (gx, up, title) => {
    const each = dem / up;
    sm(d, gx + 128, 44, title);
    for (let i = 0; i < srv; i++) {
      const x = gx + i * 52, dead = i >= up;
      d.rect(x, base - per * k, 40, per * k, { r: 3, stroke: dead ? C.gray : C.ink2, dash: dead ? [3, 3] : undefined, sw: 1 });
      if (dead) { d.line(x + 6, base - 100, x + 34, base - 20, { stroke: C.ink, sw: 1.4, single: true }); d.line(x + 34, base - 100, x + 6, base - 20, { stroke: C.ink, sw: 1.4, single: true }); }
      else { d.fillRect(x + 2, base - each * k, 36, each * k - 2, C.acc, 0.8); mo(d, x + 20, base - each * k - 8, f(each), 'middle', 9.5); }
    }
    xs(d, gx + 128, base + 14, `${up} × ${per} = ${f(up * per)} req/s capacity`);
    mo(d, gx + 128, base + 34, `${f(dem)} / ${f(up * per)} = ${r4(dem / (up * per) * 100)}%`, 'middle', 10.5);
  };
  group(30, 5, `all five up, demand ${f(dem)} req/s`);
  group(350, 4, 'one server lost');
  sm(d, 56, base - per * k - 10, `${per} req/s each`, 'start', { color: C.gray });
  for (let i = 0; i < 4; i++) d.travel([[350 + 4 * 52 + 20, base - 60], [350 + i * 52 + 20, base - 100]], { at: [0.2 + i * 0.05, 0.45 + i * 0.05], r: 3.5 });
  d.pulse(350 + 4 * 52 + 20, base - 60, { at: [0.1, 0.3], r1: 26 });
  mo(d, 320, 262, `servers for one spare: ⌈${f(dem)} / ${per}⌉ + 1 = ${Math.ceil(dem / per) + 1}`, 'middle', 11);
  d.hand(320, 290, 'test the path while a component is missing', { size: 15 });
  return d.svg();
}

export function sd_performance_api_trace() {
  const d = cv('sd_performance_api_trace', 'ONE REQUEST CONTRIBUTES TO SEVERAL RESOURCE LEDGERS', 300);
  d.cycle = 7;
  const refs = PEAK * 4, miss = Math.round(refs * 0.1);
  d.laptop(20, 112, 64, { label: 'viewer' });
  d.line(140, 108, 140, 162, { stroke: C.ink2, sw: 1.6, single: true }); d.line(160, 108, 160, 162, { stroke: C.ink2, sw: 1.6, single: true });
  d.line(140, 128, 160, 140, { stroke: C.acc, sw: 2.2, single: true });
  d.cpu(222, 112, 46);
  for (let i = 0; i < 4; i++) d.rect(318 + i * 16, 118, 12, 30, { r: 2, fill: C.card, stroke: C.ink2, sw: 0.8 });
  d.ram(424, 116, 100, 34, { chips: 3 });
  d.disk(582, 133, 46, { arm: true });
  const fwd = [[86, 133], [222, 133], [268, 133], [318, 133], [382, 133], [424, 133], [524, 133], [559, 133]];
  d.lines(fwd, { stroke: C.ink2, single: true, sw: 0.9 });
  const tags = [[150, '200 active', `${f(PEAK)}/s × ${RES} s`], [245, `${(PEAK * CPU_MS) / 1000} CPU-s/s`, `${f(PEAK)} × ${CPU_MS} ms`], [350, '≤ 2,000 ops/s', '20 slots / 10 ms'], [474, `${f(refs)} refs/s`, '90% hit in memory'], [582, `${f(miss)} reads/s`, `${f(miss * 4096)} B/s`]];
  tags.forEach(([x, a, b], i) => { mo(d, x, 186, a, 'middle', 10, { color: i === 0 ? C.acc : undefined }); xs(d, x, 202, b); });
  ['admission', 'CPU', 'pool', 'page cache', 'disk'].forEach((s, i) => sm(d, tags[i][0], 94, s));
  d.lines([[582, 160], [582, 236], [52, 236], [52, 160]], { stroke: C.slate, single: true, dash: [5, 4] });
  sm(d, 320, 252, `response: ${f(PEAK)}/s × ${f(PAY)} B = ${f(PEAK * PAY)} B/s`, 'middle', { color: C.slate });
  d.travel([...fwd, [582, 160], [582, 236], [52, 236], [52, 160]], { at: [0, 0.95], r: 4.5 });
  xs(d, 320, 280, 'each tag has its own unit and boundary; none substitutes for another');
  return d.svg();
}

export function sd_performance_live_trace() {
  const d = cv('sd_performance_live_trace', 'PRODUCTION AND RECIPIENT DELIVERY ARE DIFFERENT RATES', 310);
  d.cycle = 5;
  const sends = LIVE_EV * VIEWERS, per = VIEWERS / GW, dotv = 250;
  d.phone(309, 32, 44);
  sm(d, 300, 54, `scorer: ${LIVE_EV} events/s`, 'end');
  sm(d, 400, 84, `${GW} gateway copies = ${LIVE_EV * GW} copies/s`, 'start');
  for (let i = 0; i < GW; i++) {
    const gx = 47 + i * 120, cx = gx + 23;
    d.line(320, 80, cx, 116, { stroke: C.ink2, single: true, sw: 0.9 });
    d.travel([[320, 80], [cx, 116]], { at: [i * 0.03, i * 0.03 + 0.22], token: 'packet', fill: C.paper, color: C.ink2 });
    d.server(gx, 116, 46, 34, { unit: 15 });
    d.flowline([[cx, 154], [cx, 190]], { color: C.acc });
    for (let k = 0; k < per / dotv; k++) d.dot(cx - 25 + (k % 8) * 7, 198 + Math.floor(k / 8) * 7, 1.8, i === GW - 1 && k === 39 ? C.acc : C.ink2);
  }
  const lx = 47 + 4 * 120 + 23 + 30;
  d.tape(lx + 4, 220, ['', '', '', ''], { cw: 10, h: 12, hot: () => true });
  xs(d, lx + 24, 244, 'buffer');
  mo(d, 320, 266, `${LIVE_EV} events/s × ${f(VIEWERS)} viewers = ${f(sends)} sends/s`, 'middle', 11);
  xs(d, 320, 284, `one dot = ${dotv} viewers, ${f(per)} per gateway`);
  d.hand(470, 300, 'slow readers also retain buffers', { size: 15 });
  return d.svg();
}

export function sd_performance_budget() {
  const d = cv('sd_performance_budget', 'KEEP THE UNITS BESIDE THE NUMBERS', 300);
  const cards = [
    ['API', [[`${f(PEAK)}/s`, 'requests arriving'], [`${f(ACTIVE)} active`, 'concurrent requests']], 'boundary: API service'],
    ['live', [[`${LIVE_EV} events/s`, 'events produced'], [`${f(VIEWERS)} viewers`, `${f(LIVE_EV * VIEWERS)} deliveries/s`]], 'boundary: gateways'],
    ['cache', [['100,000 keys', 'working-set entries'], ['210 MB', '100,000 × 2,100 B']], 'boundary: cache memory'],
  ];
  cards.forEach(([t, rows, b], i) => {
    const x = 24 + i * 204, cx = x + 94;
    d.rect(x, 34, 188, 246, { r: 6, fill: C.card, stroke: C.ink2 });
    d.text(cx, 52, t, { cls: 'ttl' });
    if (i === 0) d.server(cx - 30, 68, 60, 50, { unit: 15 });
    if (i === 1) { d.phone(cx - 46, 72, 44); for (let k = 0; k < 24; k++) d.dot(cx - 6 + (k % 8) * 7, 80 + Math.floor(k / 8) * 9, 1.8, C.ink2); }
    if (i === 2) d.ram(cx - 60, 76, 120, 36, { chips: 4 });
    rows.forEach(([v, s], j) => { const y = 152 + j * 54; mo(d, cx, y, v, 'middle', 14, { w: 600 }); xs(d, cx, y + 18, s); });
    d.hl(cx - 60, 262, cx + 60, 262, { th: 10 });
    xs(d, cx, 262, b);
  });
  return d.svg();
}

export function sd_performance_defense() {
  const d = cv('sd_performance_defense', 'EACH CAPACITY CLAIM NEEDS A MATCHING EXPERIMENT', 320);
  d.rect(16, 30, 608, 280, { r: 6, stroke: C.ink2, sw: 1.2 });
  d.person(48, 130, 26);
  d.arrow(70, 146, 104, 146, { stroke: C.ink2 });
  [[110, 80], [170, 80], [110, 150], [170, 150]].forEach(([x, y], i) => d.server(x, y, 46, 50, { unit: 15, stroke: i === 3 ? C.gray : C.ink2 }));
  d.line(176, 156, 210, 196, { stroke: C.ink, sw: 1.3, single: true }); d.line(210, 156, 176, 196, { stroke: C.ink, sw: 1.3, single: true });
  d.arrow(222, 120, 256, 120, { stroke: C.ink2 });
  d.db(260, 92, 56, 62);
  d.tape(110, 236, ['', '', '', ''], { cw: 22, h: 18, hot: (i) => i < 3 });
  xs(d, 154, 266, 'work queue');
  const pins = [[133, 78], [288, 90], [193, 148], [132, 234]];
  pins.forEach(([x, y], i) => { d.pin(x, y, { fill: C.accSoft, stroke: C.acc }); mo(d, x, y - 14, String(i + 1), 'middle', 8, { color: C.acc }); });
  d.line(334, 46, 334, 296, { stroke: C.line, single: true, dash: [3, 4] });
  const rows = [['CPU hypothesis', 'measure service demand per request'], ['miss-path bound', 'test key skew and cold pages'], ['failure budget', 'remove the promised component'], ['recovery budget', 'keep new arrivals flowing']];
  rows.forEach(([c, e], i) => {
    const y = 64 + i * 58;
    d.circle(360, y + 6, 20, { fill: C.accSoft, stroke: C.acc });
    mo(d, 360, y + 6, String(i + 1), 'middle', 10);
    d.text(380, y, c, { cls: 'ttl', a: 'start', size: 12 });
    sm(d, 380, y + 16, e, 'start');
  });
  d.hand(470, 290, 'name what could disprove it', { size: 15 });
  return d.svg();
}

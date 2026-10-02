import { D, C } from '../lib/draw.js';

const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];

function dial(d, cx, cy, R, o = {}) {
  d.circle(cx, cy, R * 2, { stroke: o.stroke ?? C.ink2, sw: 0.9 });
  d.line(cx - R - 6, cy, cx + R + 6, cy, { stroke: C.faint, sw: 0.6, single: true });
  d.line(cx, cy - R - 6, cx, cy + R + 6, { stroke: C.faint, sw: 0.6, single: true });
}
const tip = (cx, cy, s, v) => [cx + v[0] * s, cy - v[1] * s];

export function rope_pair() {
  const d = new D(640, 270, 'rope_pair');
  d.text(10, 16, 'ONE PAIR OF A QUERY, ROTATED BY ITS POSITION  (TOY θ = 0.5 RAD PER POSITION)', { cls: 'cap', a: 'start' });
  const cx = 170, cy = 140, s = 90;
  dial(d, cx, cy, 100);
  const q = [1.0, 0.5];
  for (let m = 1; m <= 4; m++) { const r = rot(q, m * 0.5); const [x, y] = tip(cx, cy, s, r); d.dot(x, y, 2.2, m === 2 ? C.acc : C.line); if (m !== 2) d.mono(x + 8, y, `m=${m}`, { size: 8.5, a: 'start', color: C.gray }); }
  const [qx, qy] = tip(cx, cy, s, q);
  d.arrow(cx, cy, qx, qy, { stroke: C.gray, sw: 1.1, dash: [4, 3] });
  d.mono(qx + 6, qy + 10, 'q at m = 0', { size: 9.5, a: 'start', color: C.gray });
  const r2 = rot(q, 1.0);
  const [rx, ry] = tip(cx, cy, s, r2);
  d.arrow(cx, cy, rx, ry, { stroke: C.acc, sw: 1.6 });
  d.mono(rx - 6, ry - 12, 'q′ at m = 2', { size: 9.5, a: 'end', color: C.acc });
  d.path(`M${cx + 34 * Math.cos(-Math.atan2(q[1], q[0]))},${cy + 34 * Math.sin(-Math.atan2(q[1], q[0]))} A34,34 0 0,0 ${cx + 34 * Math.cos(-Math.atan2(r2[1], r2[0]))},${cy + 34 * Math.sin(-Math.atan2(r2[1], r2[0]))}`, { stroke: C.acc, sw: 1, rough: 0.3, single: true });
  d.text(cx + 46, cy - 40, '1.0 rad', { cls: 'xs', a: 'start', color: C.acc });
  const tx = 320;
  d.text(tx, 60, 'q = (1.00, 0.50),  m = 2,  angle mθ = 1.0', { cls: 'mono', size: 10.5, a: 'start' });
  d.text(tx, 90, 'q′₀ = 1.00 · cos 1 − 0.50 · sin 1 = 0.12', { cls: 'mono', size: 10.5, a: 'start' });
  d.text(tx, 112, 'q′₁ = 1.00 · sin 1 + 0.50 · cos 1 = 1.11', { cls: 'mono', size: 10.5, a: 'start' });
  d.text(tx, 146, 'length before: √(1.00² + 0.50²) = 1.118', { cls: 'mono', size: 10, a: 'start', color: C.gray });
  d.text(tx, 166, 'length after:  √(0.12² + 1.11²) = 1.118', { cls: 'mono', size: 10, a: 'start', color: C.gray });
  d.hand(470, 214, 'only the direction changes:\nposition is stored as an angle', { size: 16, vc: true });
  return d.svg();
}

export function rope_dials() {
  const d = new D(640, 230, 'rope_dials');
  d.text(10, 16, 'A TOKEN AT POSITION m = 5, FOUR OF ITS 32 PAIRS  (HEAD SIZE 64, BASE 10,000)', { cls: 'cap', a: 'start' });
  [0, 8, 16, 24].forEach((i, k) => {
    const th = 10000 ** (-2 * i / 64), a = 5 * th;
    const cx = 85 + k * 156, cy = 110, R = 50;
    dial(d, cx, cy, R);
    d.arrow(cx, cy, cx + (R - 8), cy, { stroke: C.line, sw: 1, dash: [3, 3] });
    d.arrow(cx, cy, cx + (R - 8) * Math.cos(a), cy - (R - 8) * Math.sin(a), { stroke: C.acc, sw: 1.6 });
    d.text(cx, cy + R + 18, `pair ${i}: θ = ${th >= 0.01 ? th.toFixed(2) : th.toFixed(3)}`, { cls: 'mono', size: 9.5 });
    d.text(cx, cy + R + 33, `turned ${a >= 0.1 ? a.toFixed(2) : a.toFixed(3)} rad`, { cls: 'xs' });
  });
  d.hand(320, 38, 'fast pairs notice small gaps, slow pairs notice big ones', { size: 15, color: C.gray });
  return d.svg();
}

export function rope_shift() {
  const d = new D(640, 270, 'rope_shift');
  d.text(10, 16, 'SHIFT BOTH TOKENS BY 10: THE ANGLE BETWEEN THEM, AND THE SCORE, STAY PUT', { cls: 'cap', a: 'start' });
  const q = [1.0, 0.5], k = [0.8, -0.6], th = 0.5;
  [[2, 5, 130], [12, 15, 400]].forEach(([m, n, cx]) => {
    const cy = 130, s = 70;
    dial(d, cx, cy, 80);
    const rq = rot(q, m * th), rk = rot(k, n * th);
    const [a, b] = tip(cx, cy, s, rq), [c, e] = tip(cx, cy, s, rk);
    d.arrow(cx, cy, a, b, { stroke: C.acc, sw: 1.6 });
    d.arrow(cx, cy, c, e, { stroke: C.slate, sw: 1.6 });
    d.mono(a + (a - cx) * 0.25, b + (b - cy) * 0.25, `q at ${m}`, { size: 9.5, color: C.acc });
    d.mono(c + (c - cx) * 0.25, e + (e - cy) * 0.25, `k at ${n}`, { size: 9.5, color: C.slate });
    d.text(cx, cy + 102, `score = ${dot2(rq, rk).toFixed(4)}`, { cls: 'mono', size: 11 });
  });
  d.box(540, 90, 90, 60, 'no rotation:\nscore = 0.5000', { cls: 'mono', size: 9.5, fill: C.card, sw: 0.9 });
  d.hand(265, 50, 'gap 3 both times', { size: 16 });
  return d.svg();
}

export function rope_where() {
  const d = new D(640, 260, 'rope_where');
  d.text(10, 16, 'WHERE ROPE ACTS: ON q AND k, AFTER PROJECTION, BEFORE THE DOT PRODUCT', { cls: 'cap', a: 'start' });
  d.box(14, 112, 50, 36, 'x', { cls: 'mono', size: 12, fill: C.card });
  const rows = [['W_{Q}', 'q', 'rotate by m', 50], ['W_{K}', 'k', 'rotate by n', 112], ['W_{V}', 'v', 'no rotation', 188]];
  rows.forEach(([w, t, r, y], i) => {
    d.carrow([[64, 130], [80, y + 18], [96, y + 18]], { stroke: C.ink2, sw: 0.9 });
    d.box(100, y, 60, 36, w, { fill: C.card, size: 11 });
    d.arrow(160, y + 18, 186, y + 18, { stroke: C.ink2 });
    d.box(190, y, 40, 36, t, { cls: 'mono', size: 12, fill: C.card });
    d.arrow(230, y + 18, 256, y + 18, { stroke: i < 2 ? C.acc : C.line });
    d.box(260, y, 100, 36, r, { fill: i < 2 ? C.accSoft : C.paper, stroke: i < 2 ? C.acc : C.line, size: 11, tc: i < 2 ? C.ink : C.gray, dash: i < 2 ? undefined : [4, 3] });
  });
  d.carrow([[360, 68], [400, 72], [420, 92]], { stroke: C.acc });
  d.carrow([[360, 130], [400, 126], [420, 108]], { stroke: C.acc });
  d.box(410, 82, 90, 36, 'q′ · k′ / √d', { cls: 'mono', size: 10.5, fill: C.card });
  d.arrow(500, 100, 520, 100, { stroke: C.ink2 });
  d.box(522, 82, 76, 36, 'softmax', { fill: C.card, size: 11 });
  d.arrow(560, 120, 560, 186, { stroke: C.ink2 });
  d.carrow([[360, 206], [460, 214], [520, 206]], { stroke: C.ink2 });
  d.box(522, 188, 76, 36, '× v', { cls: 'mono', size: 11, fill: C.card });
  d.hand(470, 160, 'v keeps\nits content', { size: 15, vc: true, color: C.gray });
  return d.svg();
}

export function rope_matrix() {
  const d = new D(640, 300, 'rope_matrix');
  d.text(10, 16, 'THE ROTATION FOR POSITION m AS ONE 8 × 8 MATRIX: 2 × 2 BLOCKS ON THE DIAGONAL', { cls: 'cap', a: 'start' });
  const n = 8, cs = 30, x0 = 30, y0 = 40;
  d.grid(x0, y0, n, n, cs, cs, {
    cellFill: (r, c) => Math.floor(r / 2) === Math.floor(c / 2) ? C.accFaint : null,
    val: (r, c) => { const b = Math.floor(r / 2); if (b !== Math.floor(c / 2)) return '0'; const i = b; if (r === c) return `c${i}`; return r % 2 === 0 ? `−s${i}` : `s${i}`; },
    vsize: 9.5, vcolor: (r, c) => Math.floor(r / 2) === Math.floor(c / 2) ? C.ink : C.line, lsw: 0.4,
  });
  for (let b = 0; b < 4; b++) d.rect(x0 + b * 2 * cs, y0 + b * 2 * cs, 2 * cs, 2 * cs, { r: 2, stroke: C.acc, sw: 1.3 });
  d.text(x0 + n * cs / 2, y0 + n * cs + 18, 'c_{i} = cos(m θ_{i}),   s_{i} = sin(m θ_{i})', { cls: 'mono', size: 10 });
  d.text(320, 70, 'For a 64-wide head the matrix is 64 × 64,', { cls: 'sm', a: 'start' });
  d.text(320, 90, 'with 32 blocks and 3,968 zeros out of 4,096.', { cls: 'sm', a: 'start' });
  d.text(320, 130, 'Code never builds it. It computes', { cls: 'sm', a: 'start' });
  d.text(320, 152, 'q′ = q · cos + rotate_half(q) · sin', { cls: 'mono', size: 11, a: 'start', color: C.acc });
  d.text(320, 174, 'directly, using precomputed cos and sin tables.', { cls: 'sm', a: 'start' });
  d.hand(420, 240, 'each block turns one pair\nand ignores the rest', { size: 16, vc: true });
  return d.svg();
}

export function rope_decay() {
  const d = new D(640, 240, 'rope_decay');
  d.text(10, 16, 'AVERAGE ROPE SCORE OF TWO IDENTICAL VECTORS VS DISTANCE  (HEAD SIZE 64, BASE 10,000)', { cls: 'cap', a: 'start' });
  const th = Array.from({ length: 32 }, (_, i) => 10000 ** (-2 * i / 64));
  const f = (k) => th.reduce((s, t) => s + Math.cos(k * t), 0) / 32;
  const M = d.axes(60, 36, 530, 150, { xmin: 0, xmax: 512, ymin: 0, ymax: 1, xl: 'distance n − m', yl: 'score ÷ maximum' });
  d.fn(f, 0, 512, M, { n: 500, sw: 1.3 });
  [[1, f(1)], [16, f(16)], [128, f(128)]].forEach(([k, v]) => { d.dot(M.X(k), M.Y(v), 3); d.mono(M.X(k) + 7, M.Y(v) - 10, `${k}: ${v.toFixed(2)}`, { size: 9, a: 'start' }); });
  [0, 128, 256, 384, 512].forEach((k) => d.text(M.X(k), 202, String(k), { cls: 'xs' }));
  d.hand(430, 70, 'wobbles, but trends down:\nfar tokens pull a bit less', { size: 15, vc: true });
  return d.svg();
}

export function rope_pi() {
  const d = new D(640, 230, 'rope_pi');
  d.text(10, 16, 'ANGLES SEEN BY THE SLOWEST PAIR (θ = 0.000133), TRAINED ON 1,024 TOKENS', { cls: 'cap', a: 'start' });
  const th = 10000 ** (-62 / 64);
  const X = (a) => 190 + a / 0.6 * 420;
  const rows = [['trained, 1,024 tokens', 1023 * th, false], ['run on 4,096 tokens', 4095 * th, true], ['interpolated: m ÷ 4', 4095 / 4 * th, false]];
  rows.forEach(([lab, a, bad], i) => {
    const y = 56 + i * 48;
    d.text(180, y + 10, lab, { cls: 'sm', a: 'end' });
    const t = 1023 * th;
    d.rect(X(0), y, X(Math.min(a, t)) - X(0), 20, { r: 2, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
    if (a > t) d.rect(X(t), y, X(a) - X(t), 20, { r: 2, fill: C.paper, stroke: C.red, sw: 1, dash: [4, 3] });
    d.mono(X(a) + 6, y + 10, `${a.toFixed(3)} rad`, { size: 9.5, a: 'start', color: bad ? C.red : C.ink });
  });
  d.line(X(1023 * th), 44, X(1023 * th), 196, { stroke: C.acc, sw: 1, dash: [3, 3], single: true });
  d.text(X(1023 * th), 206, 'edge of what training saw', { cls: 'xs', color: C.acc });
  d.hand(500, 196, 'never seen: quality breaks', { size: 15, color: C.red });
  return d.svg();
}

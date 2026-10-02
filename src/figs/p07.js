import { D, C } from '../lib/draw.js';

const Q = [[0.5, 0.1, 0.2, 0.0], [0.9, 0.4, 0.1, 0.3], [0.2, 1.0, 0.6, 0.1], [0.7, 0.3, 0.9, 0.5]];
const K = [[0.4, 0.2, 0.1, 0.3], [1.0, 0.5, 0.2, 0.1], [0.1, 0.9, 0.8, 0.2], [0.3, 0.4, 0.6, 0.7]];
const V = [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5], [0.2, 0.8]];
const S = Q.map((q) => K.map((k) => q.reduce((s, x, i) => s + x * k[i], 0)));
const Ss = S.map((r) => r.map((x) => x / 2));
const W = Ss.map((r, i) => { const e = r.map((x, j) => (j <= i ? Math.exp(x) : 0)); const z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); });
const O = W.map((w) => [0, 1].map((c) => w.reduce((s, x, j) => s + x * V[j][c], 0)));
const T4 = ['The', 'cat', 'sat', 'bec.'];

function mat(d, x, y, M, title, o = {}) {
  const cs = o.cs ?? 38;
  d.text(x + M[0].length * cs / 2, y - 22, title, { cls: 'ttl', size: 11 });
  d.grid(x, y, M.length, M[0].length, cs, 28, {
    shade: o.shade ?? (() => 0), color: o.color,
    val: (r, c) => o.fmt ? o.fmt(M[r][c], r, c) : M[r][c].toFixed(2), vsize: 9.5,
    vcolor: (r, c, s) => (s > 0.55 ? C.onAcc : (o.dim && o.dim(r, c) ? C.line : C.ink)), lsw: 0.5,
  });
  if (o.rows) M.forEach((_, r) => d.mono(x - 5, y + r * 28 + 14, T4[r], { size: 8.5, a: 'end', color: C.gray }));
}

export function sdpa_steps() {
  const d = new D(640, 360, 'sdpa_steps');
  d.text(10, 16, 'SCALED DOT-PRODUCT ATTENTION, ONE STAGE AT A TIME  (T = 4, d_k = 4, √d_k = 2)', { cls: 'cap', a: 'start' });
  mat(d, 40, 62, S, '1. S = QKᵀ', { rows: true, cs: 34 });
  mat(d, 192, 62, Ss, '2. ÷ √d_k', { cs: 34 });
  mat(d, 344, 62, Ss, '3. + mask', { cs: 34, fmt: (v, r, c) => (c > r ? '−∞' : v.toFixed(2)), shade: (r, c) => (c > r ? 0.6 : 0), color: C.ink2 });
  mat(d, 496, 62, W, '4. softmax rows', { cs: 34, shade: (r, c) => W[r][c] });
  d.text(178, 118, '→', { size: 14 }); d.text(330, 118, '→', { size: 14 }); d.text(482, 118, '→', { size: 14 });
  mat(d, 200, 230, W, '', { cs: 34, shade: (r, c) => W[r][c] });
  d.text(348, 286, '×', { size: 15 });
  mat(d, 368, 230, V, 'V', { cs: 40, fmt: (v) => v.toFixed(1) });
  d.text(468, 286, '=', { size: 15 });
  mat(d, 490, 230, O, '5. output', { cs: 46, fmt: (v) => v.toFixed(3), shade: () => 0.25 });
  d.text(268, 210, 'W', { cls: 'ttl', size: 11 });
  d.hand(100, 270, 'row 0 can only\nsee itself', { size: 15, vc: true });
  return d.svg();
}

export function row_bars() {
  const d = new D(640, 210, 'row_bars');
  d.text(10, 16, 'ROW 2 OF W (“SAT” ASKING) IS ONE QUERY’S WEIGHTS, EXACTLY AS IN PART VI', { cls: 'cap', a: 'start' });
  mat(d, 60, 70, W, '', { rows: true, cs: 34, shade: (r, c) => (r === 2 ? W[r][c] : W[r][c] * 0.25) });
  d.rect(58, 70 + 2 * 28 - 2, 4 * 34 + 4, 32, { r: 3, stroke: C.acc, sw: 1.5 });
  d.arrow(206, 140, 260, 140, { stroke: C.acc });
  const base = 180;
  d.line(280, base, 600, base, { stroke: C.ink2, sw: 0.9 });
  W[2].forEach((w, j) => {
    const x = 300 + j * 76, h = 220 * w;
    if (w > 0) d.rect(x, base - h, 44, h, { r: 2, fill: j === 2 ? C.acc : C.faint, fs: j === 2 ? 'hachure' : 'solid', gap: 3.4, stroke: j === 2 ? C.acc : C.ink2, sw: 0.9 });
    d.mono(x + 22, base - h - 9, w.toFixed(3), { size: 9.5 });
    d.text(x + 22, base + 13, T4[j], { cls: 'xs' });
  });
  d.hand(520, 50, '0.253 + 0.319 + 0.428 = 1', { size: 15 });
  return d.svg();
}

const npdf = (x, s) => Math.exp(-x * x / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

export function dk_spread() {
  const d = new D(640, 250, 'dk_spread');
  d.text(10, 16, 'DOT PRODUCTS OF RANDOM UNIT-VARIANCE VECTORS: SPREAD GROWS AS √d_k', { cls: 'cap', a: 'start' });
  const M1 = d.axes(30, 50, 270, 140, { xmin: -50, xmax: 50, ymin: 0, ymax: 0.2, xl: 'raw score' });
  [[4, C.ink], [64, C.slate], [512, C.acc]].forEach(([dk, col]) => {
    d.fn((t) => npdf(t, Math.sqrt(dk)), -50, 50, M1, { stroke: col, sw: 1.4, n: 200 });
  });
  d.text(M1.X(0) + 18, M1.Y(npdf(0, 2)) + 4, 'd_k = 4, sd 2', { cls: 'xs', a: 'start' });
  d.text(M1.X(10), M1.Y(npdf(10, 8)) - 14, 'd_k = 64, sd 8', { cls: 'xs', a: 'start', color: C.slate });
  d.text(M1.X(28), M1.Y(npdf(28, 22.6)) - 14, 'd_k = 512, sd 22.6', { cls: 'xs', a: 'start', color: C.acc });
  [-40, 0, 40].forEach((t) => d.text(M1.X(t), 204, String(t), { cls: 'xs' }));
  const M2 = d.axes(360, 50, 250, 140, { xmin: -5, xmax: 5, ymin: 0, ymax: 0.45, xl: 'score ÷ √d_k' });
  d.fn((t) => npdf(t, 1), -5, 5, M2, { stroke: C.acc, sw: 1.8, n: 120 });
  d.text(M2.X(1.4), M2.Y(npdf(1.4, 1)) - 12, 'every d_k: sd 1', { cls: 'xs', a: 'start', color: C.acc });
  [-4, 0, 4].forEach((t) => d.text(M2.X(t), 204, String(t), { cls: 'xs' }));
  d.hand(320, 236, 'dividing by √d_k puts every head size on the same scale', { size: 15 });
  return d.svg();
}

export function softmax_saturate() {
  const d = new D(640, 250, 'softmax_saturate');
  d.text(10, 16, 'SOFTMAX OF [1, 2, 3] × c: BIG SCORES TURN A PREFERENCE INTO A HARD CHOICE', { cls: 'cap', a: 'start' });
  [1, 2, 5, 10].forEach((c, k) => {
    const z = [1, 2, 3].map((x) => x * c), m = Math.max(...z), e = z.map((x) => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0), p = e.map((x) => x / s);
    const x0 = 20 + k * 155, base = 180;
    d.text(x0 + 60, 44, `c = ${c}`, { cls: 'ttl' });
    d.line(x0, base, x0 + 124, base, { stroke: C.ink2, sw: 0.9 });
    p.forEach((v, i) => {
      const h = Math.max(0.5, 110 * v);
      d.rect(x0 + 8 + i * 38, base - h, 28, h, { r: 2, fill: i === 2 ? C.acc : C.faint, fs: i === 2 ? 'hachure' : 'solid', gap: 3.2, stroke: i === 2 ? C.acc : C.ink2, sw: 0.9 });
      d.mono(x0 + 22 + i * 38, base - h - 9, v < 0.001 ? v.toExponential(0) : v.toFixed(3), { size: 8.5 });
    });
    const g = p[2] * (1 - p[2]);
    d.mono(x0 + 62, 202, `gradient ${g < 0.001 ? g.toExponential(1) : g.toFixed(3)}`, { size: 9, color: g < 0.01 ? C.red : C.ink });
  });
  d.hand(320, 234, 'saturated softmax: almost nothing left to learn from', { size: 15, color: C.red });
  return d.svg();
}

export function softmax_stable() {
  const d = new D(640, 250, 'softmax_stable');
  d.text(10, 16, 'THE OVERFLOW TRAP, AND THE SUBTRACT-THE-MAX FIX', { cls: 'cap', a: 'start' });
  const rows = [
    ['scores', ['1000', '1001', '1002'], C.card],
    ['naive: e^{s}', ['inf', 'inf', 'inf'], C.paper],
    ['naive: ÷ sum', ['NaN', 'NaN', 'NaN'], C.paper],
    ['s − max(s)', ['−2', '−1', '0'], C.card],
    ['e^{s − max}', ['0.135', '0.368', '1.000'], C.card],
    ['÷ 1.503', ['0.090', '0.245', '0.665'], C.accSoft],
  ];
  rows.forEach(([lab, v, f], i) => {
    const y = 34 + i * 34, bad = i === 1 || i === 2;
    d.text(150, y + 13, lab, { cls: 'mono', size: 10.5, a: 'end', color: bad ? C.red : C.ink });
    v.forEach((t, k) => d.box(170 + k * 74, y, 66, 26, t, { cls: 'mono', size: 10.5, fill: f, stroke: bad ? C.red : (i === 5 ? C.acc : C.ink2), sw: 0.9, r: 4, tc: bad ? C.red : undefined }));
  });
  d.line(160, 132, 400, 132, { stroke: C.line, sw: 0.8, dash: [3, 3], single: true });
  d.hand(520, 72, 'e^1000 does not fit\nin any float type', { size: 15, vc: true, color: C.red });
  d.hand(520, 192, 'same answer,\nevery number small', { size: 15, vc: true });
  return d.svg();
}

export function dot_projection() {
  const d = new D(640, 230, 'dot_projection');
  d.text(10, 16, 'WHAT A DOT PRODUCT MEASURES: LENGTH OF q × THE SHADOW OF k ON q', { cls: 'cap', a: 'start' });
  [[30, 'aligned: large score'], [90, 'right angle: zero'], [140, 'pointing apart: negative']].forEach(([deg, lab], i) => {
    const cx = 80 + i * 210, cy = 150, L = 110, Lk = 80, a = deg * Math.PI / 180;
    d.arrow(cx, cy, cx + L, cy, { stroke: C.acc, sw: 1.6 });
    d.text(cx + L + 4, cy + 12, 'q', { cls: 'mono', size: 11, color: C.acc, a: 'start' });
    const kx = cx + Lk * Math.cos(a), ky = cy - Lk * Math.sin(a);
    d.arrow(cx, cy, kx, ky, { stroke: C.slate, sw: 1.4 });
    d.text(kx + 6, ky - 4, 'k', { cls: 'mono', size: 11, color: C.slate, a: 'start' });
    d.line(kx, ky, kx, cy, { stroke: C.gray, sw: 0.8, dash: [3, 3], single: true });
    if (Math.abs(Math.cos(a)) > 0.05) d.line(cx, cy + 4, kx, cy + 4, { stroke: C.ink, sw: 3, op: 0.35, single: true });
    d.mono(cx + 40, cy + 34, `cos ${deg}° = ${Math.cos(a).toFixed(2)}`, { size: 9.5 });
    d.text(cx + 40, cy + 50, lab, { cls: 'xs' });
  });
  return d.svg();
}

export function convex_blend() {
  const d = new D(640, 260, 'convex_blend');
  d.text(10, 16, 'THE OUTPUT IS ALWAYS A BLEND INSIDE THE VALUES', { cls: 'cap', a: 'start' });
  const A = [120, 210], B = [360, 210], Cc = [240, 50];
  d.poly([A, B, Cc], { fill: C.accFaint, stroke: C.ink2, sw: 1 });
  [[A, 'v₁'], [B, 'v₂'], [Cc, 'v₃']].forEach(([[x, y], t]) => { d.dot(x, y, 4, C.ink); d.mono(x + (x < 240 ? -14 : x > 240 ? 14 : 0), y + (y > 100 ? 16 : -12), t, { size: 11 }); });
  const ws = [[0.6, 0.3, 0.1], [0.2, 0.2, 0.6], [0.34, 0.33, 0.33]];
  ws.forEach((w, i) => {
    const x = w[0] * A[0] + w[1] * B[0] + w[2] * Cc[0], y = w[0] * A[1] + w[1] * B[1] + w[2] * Cc[1];
    d.dot(x, y, 4.5, C.acc);
    d.mono(x + 8, y - 8, `(${w.join(', ')})`, { size: 8.5, a: 'start', color: C.acc });
  });
  d.text(480, 100, 'weights are positive', { cls: 'sm', a: 'start' });
  d.text(480, 120, 'and sum to 1, so the', { cls: 'sm', a: 'start' });
  d.text(480, 140, 'output can never leave', { cls: 'sm', a: 'start' });
  d.text(480, 160, 'the shaded triangle', { cls: 'sm', a: 'start' });
  d.hand(250, 246, 'attention can only mix, never invent', { size: 15 });
  return d.svg();
}

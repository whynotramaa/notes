import { D, C } from '../lib/draw.js';

const om16 = Array.from({ length: 8 }, (_, i) => 1 / 10000 ** (2 * i / 16));
const om512 = Array.from({ length: 256 }, (_, i) => 1 / 10000 ** (2 * i / 512));

export function sin_lanes() {
  const d = new D(640, 330, 'sin_lanes');
  d.text(10, 16, 'EIGHT WAVES (A TOY d = 16), READ AT POSITION 7', { cls: 'cap', a: 'start' });
  const x0 = 70, w = 400, P = 40, X = (p) => x0 + p / P * w;
  om16.forEach((o, i) => {
    const yc = 50 + i * 34, A = 12;
    d.text(x0 - 10, yc, `pair ${i}`, { cls: 'xs', a: 'end' });
    d.line(x0, yc, x0 + w, yc, { stroke: C.faint, sw: 0.6, single: true });
    const pts = []; for (let k = 0; k <= 200; k++) { const p = k / 200 * P; pts.push([X(p), yc - A * Math.sin(p * o)]); }
    d.lines(pts, { stroke: i < 3 ? C.ink : C.ink2, sw: 1.1, rough: 0.3, single: true });
    const v = Math.sin(7 * o);
    d.dot(X(7), yc - A * v, 3.2, C.acc);
    d.fillRect(520, yc - 12, 60, 24, v >= 0 ? C.acc : C.slate, Math.min(0.85, Math.abs(v)));
    d.rect(520, yc - 12, 60, 24, { r: 2, sw: 0.7 });
    d.mono(550, yc, v.toFixed(3), { size: 9.5, color: Math.abs(v) > 0.55 ? C.onAcc : C.ink });
  });
  d.line(X(7), 34, X(7), 310, { stroke: C.acc, sw: 1.2, dash: [4, 3], single: true });
  d.text(X(7), 318, 'position 7', { cls: 'xs', color: C.acc });
  [0, 10, 20, 30, 40].forEach((p) => d.text(X(p), 304, String(p), { cls: 'xs' }));
  d.text(550, 34, 'sin values', { cls: 'xs' });
  d.hand(600, 120, 'fast', { size: 15, a: 'start' });
  d.hand(600, 270, 'slow', { size: 15, a: 'start' });
  return d.svg();
}

export function sin_heatmap() {
  const d = new D(640, 300, 'sin_heatmap');
  d.text(10, 16, 'SINUSOIDAL POSITION VECTORS: ROWS ARE POSITIONS 0 TO 47, COLUMNS ARE 64 DIMENSIONS', { cls: 'cap', a: 'start' });
  const dm = 64, T = 48, cw = 8, ch = 5, x0 = 80, y0 = 36;
  for (let p = 0; p < T; p++) for (let j = 0; j < dm; j++) {
    const i = Math.floor(j / 2), o = 1 / 10000 ** (2 * i / dm);
    const v = j % 2 === 0 ? Math.sin(p * o) : Math.cos(p * o);
    d.fillRect(x0 + j * cw, y0 + p * ch, cw, ch, v >= 0 ? C.acc : C.slate, Math.abs(v) * 0.85);
  }
  d.rect(x0, y0, dm * cw, T * ch, { r: 0, sw: 1 });
  d.rect(x0 - 2, y0 + 20 * ch - 1, dm * cw + 4, ch + 2, { r: 1, stroke: C.ink, sw: 1.2 });
  d.text(x0 - 8, y0 + 20 * ch + 2, 'pos 20', { cls: 'xs', a: 'end' });
  d.text(x0 - 8, y0, '0', { cls: 'xs', a: 'end' });
  d.text(x0 - 8, y0 + T * ch, '47', { cls: 'xs', a: 'end' });
  d.text(x0, y0 + T * ch + 14, 'dim 0', { cls: 'xs', a: 'start' });
  d.text(x0 + dm * cw, y0 + T * ch + 14, 'dim 63', { cls: 'xs', a: 'end' });
  d.hand(170, 292, 'left: fast waves flip quickly', { size: 15 });
  d.hand(470, 292, 'right: slow waves barely change', { size: 15, color: C.gray });
  return d.svg();
}

export function clock_binary() {
  const d = new D(640, 270, 'clock_binary');
  d.text(10, 16, 'POSITION 7 ON FOUR CLOCK HANDS, AND IN BINARY', { cls: 'cap', a: 'start' });
  om16.slice(0, 4).forEach((o, i) => {
    const cx = 80 + i * 150, cy = 92, R = 44, a = 7 * o;
    d.circle(cx, cy, R * 2, { stroke: C.ink2, sw: 1 });
    d.line(cx, cy - R + 4, cx, cy - R + 10, { stroke: C.gray, sw: 0.8, single: true });
    d.arrow(cx, cy, cx + (R - 8) * Math.sin(a), cy - (R - 8) * Math.cos(a), { stroke: C.acc, sw: 1.6 });
    d.dot(cx, cy, 2.4);
    d.mono(cx, cy + R + 16, `${o.toFixed(3)} rad / step`, { size: 9.5 });
    d.mono(cx, cy + R + 30, `7 × ${o.toFixed(3)} = ${(7 * o).toFixed(2)} rad`, { size: 9, color: C.gray });
  });
  const bits = [0, 1, 1, 1];
  d.text(10, 206, 'binary 7:', { cls: 'sm', a: 'start' });
  bits.forEach((b, i) => d.box(90 + i * 40, 192, 34, 30, String(b), { cls: 'mono', size: 13, fill: b ? C.accSoft : C.card, stroke: b ? C.acc : C.ink2 }));
  d.text(90, 236, 'slow bit', { cls: 'xs', a: 'start' });
  d.text(244, 236, 'fast bit', { cls: 'xs', a: 'end' });
  d.hand(450, 214, 'the last bit flips every step,\nthe first rarely: same idea, smooth', { size: 15, vc: true });
  return d.svg();
}

export function wavelength_ladder() {
  const d = new D(640, 260, 'wavelength_ladder');
  d.text(10, 16, 'WAVELENGTHS FOR d = 512, BASE 10,000 (TOKENS PER FULL TURN, LOG SCALE)', { cls: 'cap', a: 'start' });
  const idx = [0, 32, 64, 96, 128, 160, 192, 224, 255];
  const lam = idx.map((i) => 2 * Math.PI * 10000 ** (2 * i / 512));
  const base = 210, top = 40, L = (v) => base - (Math.log10(v) / 5) * (base - top);
  [1, 10, 100, 1000, 10000, 100000].forEach((g) => { d.line(70, L(g), 620, L(g), { stroke: C.faint, sw: 0.6, single: true }); d.text(64, L(g), g.toLocaleString('en-US'), { cls: 'xs', a: 'end' }); });
  idx.forEach((i, k) => {
    const x = 92 + k * 58, y = L(lam[k]);
    d.rect(x, y, 34, base - y, { r: 2, fill: k === 0 || k === idx.length - 1 ? C.acc : C.faint, fs: k === 0 || k === idx.length - 1 ? 'hachure' : 'solid', gap: 3.4, stroke: k === 0 || k === idx.length - 1 ? C.acc : C.ink2, sw: 0.9 });
    d.mono(x + 17, y - 9, lam[k] < 100 ? lam[k].toFixed(1) : Math.round(lam[k]).toLocaleString('en-US'), { size: 9 });
    d.text(x + 17, base + 14, `pair ${i}`, { cls: 'xs' });
  });
  d.text(345, 248, 'each step of 32 pairs is the same ×3.16 jump: a geometric ladder', { cls: 'xs' });
  return d.svg();
}

export function sin_dot() {
  const d = new D(640, 260, 'sin_dot');
  d.text(10, 16, 'SIMILARITY OF PE(p) AND PE(p + k), d = 512, AS A FUNCTION OF THE GAP k', { cls: 'cap', a: 'start' });
  const f = (k) => om512.reduce((s, o) => s + Math.cos(k * o), 0) / 256;
  const M = d.axes(60, 40, 520, 170, { xmin: -100, xmax: 100, ymin: 0, ymax: 1, xl: 'gap k', yl: 'dot product ÷ 256' });
  d.fn(f, -100, 100, M, { n: 400, sw: 1.5 });
  [[1, f(1)], [10, f(10)], [50, f(50)]].forEach(([k, v]) => { d.dot(M.X(k), M.Y(v), 3, C.ink); d.mono(M.X(k) + 6, M.Y(v) - 10, `k=${k}: ${v.toFixed(2)}`, { size: 9, a: 'start' }); });
  [-100, -50, 0, 50, 100].forEach((k) => d.text(M.X(k), 226, String(k), { cls: 'xs' }));
  d.hand(170, 74, 'identical curve for p = 0,\np = 100 or p = 500', { size: 15, vc: true });
  return d.svg();
}

export function shift_rotation() {
  const d = new D(640, 240, 'shift_rotation');
  d.text(10, 16, 'ONE (sin, cos) PAIR IS A POINT ON A CIRCLE; MOVING k STEPS TURNS IT BY k·ω', { cls: 'cap', a: 'start' });
  const o = 0.3;
  [[2, 5, 160], [10, 13, 460]].forEach(([p, q, cx]) => {
    const cy = 124, R = 70;
    d.circle(cx, cy, R * 2, { stroke: C.ink2, sw: 0.9 });
    const pt = (n) => [cx + R * Math.cos(n * o) * 0.92, cy - R * Math.sin(n * o) * 0.92];
    const [ax, ay] = pt(p), [bx, by] = pt(q);
    d.arrow(cx, cy, ax, ay, { stroke: C.ink, sw: 1.4 });
    d.arrow(cx, cy, bx, by, { stroke: C.acc, sw: 1.5 });
    const r = 28, a0 = p * o, a1 = q * o;
    d.path(`M${cx + r * Math.cos(a0)},${cy - r * Math.sin(a0)} A${r},${r} 0 0,0 ${cx + r * Math.cos(a1)},${cy - r * Math.sin(a1)}`, { stroke: C.acc, sw: 1, rough: 0.3, single: true });
    d.mono(ax + (ax - cx) * 0.2, ay + (ay - cy) * 0.2, `p = ${p}`, { size: 10 });
    d.mono(bx + (bx - cx) * 0.22, by + (by - cy) * 0.22, `p = ${q}`, { size: 10, color: C.acc });
    d.text(cx, cy + R + 22, `angle between = 3 × 0.3 = 0.9 rad`, { cls: 'xs' });
  });
  d.hand(310, 60, 'both arrows moved,\nthe gap did not', { size: 16, vc: true });
  return d.svg();
}

export function extrap_loss() {
  const d = new D(640, 220, 'extrap_loss');
  d.text(10, 16, 'COMPUTABLE IS NOT THE SAME AS LEARNED  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const M = d.axes(70, 40, 500, 130, { xmin: 0, xmax: 2048, ymin: 2, ymax: 6, xl: 'position', yl: 'loss at that position' });
  d.fn((t) => t < 1024 ? 3.2 - 0.25 * Math.min(1, t / 300) : 2.95 + 2.2 * (1 - Math.exp(-(t - 1024) / 300)), 0, 2048, M, { n: 200 });
  d.line(M.X(1024), 36, M.X(1024), 170, { stroke: C.red, sw: 1, dash: [4, 3], single: true });
  d.text(M.X(1024), 186, 'training length', { cls: 'xs', color: C.red });
  [0, 512, 1024, 1536, 2048].forEach((t) => d.text(M.X(t), 200, t.toLocaleString('en-US'), { cls: 'xs' }));
  d.hand(470, 72, 'vectors exist out here,\nthe model never learned them', { size: 15, vc: true });
  return d.svg();
}

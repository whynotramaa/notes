import { D, C } from '../lib/draw.js';

export function norm_side_by_side() {
  const d = new D(640, 330, 'norm_side_by_side');
  d.text(10, 16, 'SAME INPUT, TWO NORMS  (x = [2, −1, 4, 3], γ = 1, β = 0, ε IGNORED)', { cls: 'cap', a: 'start' });
  const col = (x0, title, rows) => {
    d.text(x0 + 140, 40, title, { cls: 'ttl' });
    rows.forEach(([lab, v, note, hi], i) => {
      const y = 56 + i * 64;
      d.text(x0, y - 4, lab, { cls: 'xs', a: 'start' });
      v.forEach((x, k) => d.box(x0 + k * 62, y + 2, 56, 26, typeof x === 'number' ? (Number.isInteger(x) ? String(x) : x.toFixed(3)) : x, { cls: 'mono', size: 10, fill: hi ? C.accSoft : C.card, stroke: hi ? C.acc : C.ink2, sw: 0.8, r: 4 }));
      if (note) d.text(x0, y + 42, note, { cls: 'xs', a: 'start', color: C.gray });
    });
  };
  col(10, 'LayerNorm', [['x', [2, -1, 4, 3], 'mean = 2  (pass 1)'], ['x − mean', [0, -3, 2, 1], 'var = 3.5, sd = 1.871  (pass 2)'], ['÷ sd', [0, -1.604, 1.069, 0.535], '× γ + β', true], ['', [], '']]);
  col(330, 'RMSNorm', [['x', [2, -1, 4, 3], 'mean of squares = 30 / 4 = 7.5  (one pass)'], ['÷ √7.5 = 2.739', [0.73, -0.365, 1.461, 1.095], '× γ, no β', true], ['', [], ''], ['', [], '']]);
  d.line(320, 34, 320, 260, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.hand(470, 230, 'no centring:\none fewer pass,\nno β to learn', { size: 15, vc: true });
  d.text(320, 312, 'LayerNorm output has mean 0 and spread 1. RMSNorm output keeps the input’s direction and has root-mean-square 1.', { cls: 'xs' });
  return d.svg();
}

export function norm_geometry() {
  const d = new D(640, 300, 'norm_geometry');
  d.text(10, 16, 'TWO NUMBERS, SO A POINT ON A PLANE: WHERE EACH NORM SENDS x = (2.0, 0.6)', { cls: 'cap', a: 'start' });
  const panel = (cx, title, ln) => {
    const s = 46, cy = 160;
    d.text(cx, 42, title, { cls: 'ttl' });
    d.line(cx - 130, cy, cx + 130, cy, { stroke: C.faint, sw: 0.7, single: true });
    d.line(cx, cy - 110, cx, cy + 110, { stroke: C.faint, sw: 0.7, single: true });
    d.circle(cx, cy, 2 * Math.SQRT2 * s, { stroke: C.slate, sw: 1, dash: [4, 3] });
    const X = (a) => cx + a * s, Y = (b) => cy - b * s;
    const x = [2.0, 0.6];
    d.arrow(cx, cy, X(x[0]), Y(x[1]), { stroke: C.ink2, sw: 1.2 });
    d.mono(X(x[0]) + 6, Y(x[1]) - 6, 'x', { size: 11, a: 'start' });
    if (!ln) {
      const r = Math.sqrt((x[0] ** 2 + x[1] ** 2) / 2), o = [x[0] / r, x[1] / r];
      d.arrow(cx, cy, X(o[0]), Y(o[1]), { stroke: C.acc, sw: 1.8 });
      d.mono(X(o[0]) + 6, Y(o[1]) + 12, `(${o[0].toFixed(2)}, ${o[1].toFixed(2)})`, { size: 9.5, a: 'start', color: C.acc });
      d.text(cx, cy + 128, 'same direction, slid onto the circle', { cls: 'xs' });
    } else {
      d.line(X(-2.2), Y(2.2), X(2.2), Y(-2.2), { stroke: C.gray, sw: 0.9, dash: [3, 3], single: true });
      d.text(X(-2.1), Y(2.35), 'x₁ + x₂ = 0', { cls: 'xs', a: 'start' });
      const c = [(x[0] - x[1]) / 2, -(x[0] - x[1]) / 2];
      d.dot(X(c[0]), Y(c[1]), 3.2, C.gray);
      d.arrow(cx, cy, X(1), Y(-1), { stroke: C.acc, sw: 1.8 });
      d.dot(X(-1), Y(1), 3.4, C.acc);
      d.mono(X(1) + 6, Y(-1) + 8, '(1, −1)', { size: 9.5, a: 'start', color: C.acc });
      d.mono(X(-1) - 6, Y(1) - 8, '(−1, 1)', { size: 9.5, a: 'end', color: C.acc });
      d.text(cx, cy + 128, 'centred onto the line, then the circle: only 2 possible outputs', { cls: 'xs' });
    }
  };
  panel(160, 'RMSNorm', false);
  panel(480, 'LayerNorm', true);
  return d.svg();
}

export function norm_invariance() {
  const d = new D(640, 210, 'norm_invariance');
  d.text(10, 16, 'WHAT EACH NORM IGNORES: CHANGE THE INPUT, DOES THE OUTPUT CHANGE?', { cls: 'cap', a: 'start' });
  const rows = [['x = [2, −1, 4, 3]', 'reference', '', ''], ['2 × x = [4, −2, 8, 6]', 'scale', 'ignored ✓', 'ignored ✓'], ['x + 3 = [5, 2, 7, 6]', 'shift', 'ignored ✓', 'changes: [0.94, 0.37, 1.31, 1.12]']];
  d.text(330, 40, 'LayerNorm', { cls: 'ttl' });
  d.text(520, 40, 'RMSNorm', { cls: 'ttl' });
  rows.forEach(([a, b, c, e], i) => {
    const y = 70 + i * 40;
    d.mono(20, y, a, { size: 10.5, a: 'start' });
    d.text(220, y, b, { cls: 'xs', a: 'start' });
    d.text(330, y, c, { cls: 'sm', color: C.slate });
    d.text(520, y, e, { cls: 'sm', color: e.startsWith('changes') ? C.acc : C.slate });
  });
  d.hand(320, 190, 'the paper’s finding: ignoring scale is what matters, not ignoring shift', { size: 15 });
  return d.svg();
}

export function gamma_bars() {
  const d = new D(640, 230, 'gamma_bars');
  d.text(10, 16, 'A TRAINED γ: ONE GAIN PER CHANNEL, MOSTLY NEAR 1, A FEW HUGE  (ILLUSTRATIVE, 64 CHANNELS)', { cls: 'cap', a: 'start' });
  const base = 190;
  let s = 7; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 64; i++) {
    const out = i === 13 || i === 47, g = out ? (i === 13 ? 6.2 : 4.8) : 0.75 + r() * 0.5;
    const h = g / 7 * 150;
    d.fillRect(30 + i * 9, base - h, 7, h, out ? C.acc : C.slate, out ? 0.85 : 0.45);
  }
  d.line(26, base - 150 / 7, 610, base - 150 / 7, { stroke: C.ink2, sw: 0.8, dash: [3, 3], single: true });
  d.text(614, base - 150 / 7, '1', { cls: 'xs', a: 'start' });
  d.line(26, base, 610, base, { stroke: C.ink2, sw: 0.9, single: true });
  d.hand(330, 60, 'outlier channels', { size: 16 });
  d.carrow([[300, 66], [190, 70], [152, 66]], { stroke: C.acc, sw: 1 });
  d.text(320, 212, 'channel index', { cls: 'xs' });
  return d.svg();
}

export function eps_curve() {
  const d = new D(640, 250, 'eps_curve');
  d.text(10, 16, 'OUTPUT SIZE AGAINST INPUT SIZE FOR RMSNorm, ε = 1e-5  (LOG SCALES)', { cls: 'cap', a: 'start' });
  const eps = 1e-5;
  const M = d.axes(70, 40, 480, 160, { xmin: -6, xmax: 1, ymin: -3.5, ymax: 0.5, xl: 'input RMS (log10)', yl: 'output RMS (log10)' });
  d.fn((t) => { const r = 10 ** t; return Math.log10(r / Math.sqrt(r * r + eps)); }, -6, 1, M, { n: 200 });
  d.line(M.X(Math.log10(Math.sqrt(eps))), 40, M.X(Math.log10(Math.sqrt(eps))), 200, { stroke: C.slate, sw: 0.9, dash: [4, 3], single: true });
  d.text(M.X(Math.log10(Math.sqrt(eps))), 214, '√ε ≈ 0.0032', { cls: 'mono', size: 9.5, color: C.slate });
  [-6, -4, -2, 0].forEach((t) => d.text(M.X(t), 230, `1e${t}`, { cls: 'xs' }));
  d.hand(470, 70, 'normal inputs:\noutput size 1', { size: 15, vc: true });
  d.hand(170, 170, 'tiny inputs: ε wins,\noutput shrinks too', { size: 15, vc: true, color: C.gray });
  return d.svg();
}

export function norm_placements() {
  const d = new D(640, 350, 'norm_placements');
  d.text(10, 16, 'THREE PLACES MODERN MODELS PUT NORMS', { cls: 'cap', a: 'start' });
  const col = (x0, title, sub, items) => {
    d.text(x0 + 95, 40, title, { cls: 'ttl' });
    d.text(x0 + 95, 56, sub, { cls: 'xs' });
    items.forEach(([lab, kind], i) => {
      const y = 76 + i * 38;
      const n = kind === 'n';
      d.box(x0 + 20, y, 150, 28, lab, { fill: n ? C.accSoft : C.card, stroke: n ? C.acc : C.ink2, size: 10.5 });
      if (i < items.length - 1) d.arrow(x0 + 95, y + 30, x0 + 95, y + 36, { stroke: C.ink2, hl: 4 });
    });
  };
  col(10, 'pre-norm', 'Llama, Mistral, Finch-24', [['RMSNorm', 'n'], ['attention', ''], ['+ residual', ''], ['RMSNorm', 'n'], ['MLP', ''], ['+ residual', '']]);
  col(220, 'sandwich', 'Gemma 2', [['RMSNorm', 'n'], ['attention', ''], ['RMSNorm', 'n'], ['+ residual', ''], ['RMSNorm', 'n'], ['MLP', ''], ['RMSNorm', 'n']]);
  col(430, 'QK-norm', 'OLMo 2, Gemma 3, Qwen3', [['RMSNorm', 'n'], ['q, k, v proj', ''], ['RMSNorm(q), RMSNorm(k)', 'n'], ['RoPE, attention', ''], ['+ residual', ''], ['…', '']]);
  return d.svg();
}

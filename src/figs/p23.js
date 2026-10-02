import { D, C } from '../lib/draw.js';

const sig = (x) => 1 / (1 + Math.exp(-x));
const silu = (x) => x * sig(x);
const Phi = (t) => { const a = Math.abs(t) / Math.SQRT2, k = 1 / (1 + 0.3275911 * a); const e = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-a * a); return 0.5 * (1 + (t >= 0 ? e : -e)); };
const gelu = (t) => t * Phi(t);

export function mlp_vs_swiglu() {
  const d = new D(640, 300, 'mlp_vs_swiglu');
  d.text(10, 16, 'VANILLA MLP (FINCH-19) VERSUS SWIGLU MLP (FINCH-24), ONE TOKEN', { cls: 'cap', a: 'start' });
  d.text(150, 44, 'vanilla: 2 matrices', { cls: 'ttl' });
  d.box(20, 130, 50, 40, 'x', { cls: 'mono', fill: C.card }); d.text(45, 182, '512', { cls: 'mono', size: 9 });
  d.arrow(72, 150, 92, 150, { stroke: C.ink2 });
  d.box(94, 130, 66, 40, 'W_{up}', { fill: C.card, size: 11 }); d.text(127, 182, '512 → 2,048', { cls: 'mono', size: 8.5 });
  d.arrow(162, 150, 180, 150, { stroke: C.ink2 });
  d.box(182, 130, 56, 40, 'GELU', { fill: C.accFaint, stroke: C.acc, size: 11 });
  d.arrow(240, 150, 258, 150, { stroke: C.ink2 });
  d.box(260, 130, 50, 40, 'W_{down}', { fill: C.card, size: 10 }); d.text(285, 182, '→ 512', { cls: 'mono', size: 8.5 });
  d.line(326, 34, 326, 280, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.text(480, 44, 'SwiGLU: 3 matrices', { cls: 'ttl' });
  d.box(340, 130, 44, 40, 'x', { cls: 'mono', fill: C.card }); d.text(362, 182, '512', { cls: 'mono', size: 9 });
  d.carrow([[386, 142], [400, 100], [416, 92]], { stroke: C.ink2 });
  d.carrow([[386, 158], [400, 200], [416, 208]], { stroke: C.ink2 });
  d.box(418, 72, 64, 40, 'W_{gate}', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.box(418, 188, 64, 40, 'W_{up}', { fill: C.card, size: 10.5 });
  d.text(450, 124, '→ 1,536', { cls: 'mono', size: 8.5 }); d.text(450, 240, '→ 1,536', { cls: 'mono', size: 8.5 });
  d.arrow(484, 92, 500, 92, { stroke: C.ink2 });
  d.box(502, 74, 48, 36, 'SiLU', { fill: C.accFaint, stroke: C.acc, size: 10.5 });
  d.carrow([[552, 92], [566, 110], [572, 134]], { stroke: C.ink2 });
  d.carrow([[484, 208], [550, 200], [572, 166]], { stroke: C.ink2 });
  d.circle(576, 150, 30, { fill: C.paper, stroke: C.acc, sw: 1.1 }); d.text(576, 150, '⊙', { size: 15, color: C.acc });
  d.arrow(592, 150, 604, 150, { stroke: C.acc, hl: 5 });
  d.box(606, 130, 30, 40, 'W_{d}', { fill: C.card, size: 9 });
  d.text(480, 276, 'W_down (W_d): 1,536 → 512', { cls: 'mono', size: 8.5 });
  d.text(160, 276, '2 × 512 × 2,048 = 2,097,152', { cls: 'mono', size: 9 });
  d.text(480, 292, '3 × 512 × 1,536 = 2,359,296', { cls: 'mono', size: 9 });
  return d.svg();
}

export function activations() {
  const d = new D(640, 260, 'activations');
  d.text(10, 16, 'THREE ACTIVATIONS: ReLU, GELU, SiLU (SWISH)', { cls: 'cap', a: 'start' });
  const M = d.axes(60, 40, 380, 180, { xmin: -4, xmax: 3, ymin: -0.6, ymax: 3, xl: 'x' });
  d.fn((t) => Math.max(0, t), -4, 3, M, { stroke: C.line, sw: 1.4, n: 4 });
  d.fn(gelu, -4, 3, M, { stroke: C.slate, sw: 1.5, n: 140 });
  d.fn(silu, -4, 3, M, { stroke: C.acc, sw: 1.7, n: 140 });
  d.dot(M.X(-1.278), M.Y(-0.278), 3, C.acc);
  d.mono(M.X(-1.278), M.Y(-0.278) + 16, 'SiLU min −0.278 at x = −1.28', { size: 8.5 });
  [-4, -2, 0, 2].forEach((t) => d.text(M.X(t), 236, String(t), { cls: 'xs' }));
  d.text(470, 70, 'ReLU(x) = max(0, x)', { cls: 'mono', size: 10, a: 'start', color: C.gray });
  d.text(470, 96, 'GELU(x) = x · Φ(x)', { cls: 'mono', size: 10, a: 'start', color: C.slate });
  d.text(470, 122, 'SiLU(x) = x · σ(x)', { cls: 'mono', size: 10, a: 'start', color: C.acc });
  d.text(470, 160, 'SiLU(1) = 0.731', { cls: 'mono', size: 9.5, a: 'start' });
  d.text(470, 178, 'SiLU(−1) = −0.269', { cls: 'mono', size: 9.5, a: 'start' });
  d.text(470, 196, 'GELU(−1) = −0.159', { cls: 'mono', size: 9.5, a: 'start' });
  return d.svg();
}

export function gate_elementwise() {
  const d = new D(640, 250, 'gate_elementwise');
  d.text(10, 16, 'ONE TOKEN THROUGH THE GATE: 4 HIDDEN UNITS  (TOY NUMBERS)', { cls: 'cap', a: 'start' });
  const g = [2.0, -3.0, 0.5, 1.0], u = [1.5, 2.0, -1.0, 0.8];
  const s = g.map(silu), h = s.map((v, i) => v * u[i]);
  const rows = [['gate g = W_gate x', g, C.slateSoft], ['SiLU(g)', s, C.accFaint], ['up u = W_up x', u, C.card], ['h = SiLU(g) ⊙ u', h, C.accSoft]];
  rows.forEach(([lab, v, f], r) => {
    const y = 36 + r * 46;
    d.text(190, y + 14, lab, { cls: 'mono', size: 10, a: 'end' });
    v.forEach((x, k) => d.box(204 + k * 84, y, 76, 28, x.toFixed(3), { cls: 'mono', size: 10.5, fill: f, stroke: k === 1 ? C.acc : C.ink2, sw: k === 1 ? 1.4 : 0.8, r: 4 }));
  });
  d.hand(330, 236, 'unit 1: the gate is shut (−3 → −0.142), so a big up value of 2.0 barely gets through', { size: 14 });
  d.text(600, 218, 'then W_down: 4 → d', { cls: 'xs', a: 'end' });
  return d.svg();
}

export function gate_surface() {
  const d = new D(640, 280, 'gate_surface');
  d.text(10, 16, 'THE GATE SURFACE: SiLU(g) × u FOR g AND u FROM −3 TO 3', { cls: 'cap', a: 'start' });
  const n = 24, cs = 9, x0 = 120, y0 = 40;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const gv = -3 + 6 * (j + 0.5) / n, uv = 3 - 6 * (i + 0.5) / n, v = silu(gv) * uv;
    d.fillRect(x0 + j * cs, y0 + i * cs, cs, cs, v >= 0 ? C.acc : C.slate, Math.min(0.9, Math.abs(v) / 6));
  }
  d.rect(x0, y0, n * cs, n * cs, { r: 0, sw: 1 });
  d.text(x0 + n * cs / 2, y0 + n * cs + 16, 'gate g →', { cls: 'xs' });
  d.text(x0 - 16, y0 + n * cs / 2, 'up u', { cls: 'xs', rot: -90 });
  d.text(x0 - 4, y0, '3', { cls: 'xs', a: 'end' }); d.text(x0 - 4, y0 + n * cs, '−3', { cls: 'xs', a: 'end' });
  d.text(x0, y0 + n * cs + 30, '−3', { cls: 'xs' }); d.text(x0 + n * cs, y0 + n * cs + 30, '3', { cls: 'xs' });
  d.text(400, 80, 'left half: gate closed,', { cls: 'sm', a: 'start' });
  d.text(400, 98, 'output near zero whatever u is', { cls: 'sm', a: 'start' });
  d.text(400, 140, 'right half: gate open,', { cls: 'sm', a: 'start' });
  d.text(400, 158, 'output follows u (orange up, blue down)', { cls: 'sm', a: 'start' });
  d.hand(470, 220, 'one number decides whether,\nthe other decides what', { size: 15, vc: true });
  return d.svg();
}

export function hidden_sizing() {
  const d = new D(640, 280, 'hidden_sizing');
  d.text(10, 16, 'SIZING THE HIDDEN LAYER: KEEP THE PARAMETER BILL ROUGHLY EQUAL', { cls: 'cap', a: 'start' });
  const rows = [['Finch-24 (d = 512)', ['4d = 2,048', '× 2/3 → 1,365', 'round up to 256 → 1,536']], ['Llama 2 7B (d = 4,096)', ['4d = 16,384', '× 2/3 → 10,922', 'round up to 256 → 11,008']], ['Llama 3 8B (d = 4,096)', ['× 2/3 → 10,922', '× 1.3 → 14,198', 'round up to 1,024 → 14,336']]];
  rows.forEach(([lab, steps], i) => {
    const y = 40 + i * 52;
    d.text(160, y + 13, lab, { cls: 'sm', a: 'end' });
    steps.forEach((s, k) => { d.box(172 + k * 152, y, 144, 26, s, { cls: 'mono', size: 9.5, fill: k === 2 ? C.accSoft : C.card, stroke: k === 2 ? C.acc : C.ink2, sw: 0.8, r: 4 }); if (k < 2) d.arrow(172 + k * 152 + 145, y + 13, 172 + (k + 1) * 152 - 2, y + 13, { stroke: C.ink2, hl: 4 }); });
  });
  const bars = [['vanilla 4d, 2 matrices', 2097152, C.ink2], ['SwiGLU exact 8d/3 (1,365)', 2096640, C.slate], ['SwiGLU rounded (1,536)', 2359296, C.acc]];
  bars.forEach(([n, v, col], i) => {
    const y = 206 + i * 22, w = v / 2400000 * 300;
    d.text(220, y + 8, n, { cls: 'xs', a: 'end' });
    d.rect(228, y, w, 16, { r: 2, fill: col, fop: 0.35, stroke: col, sw: 0.8 });
    d.mono(234 + w, y + 8, v.toLocaleString('en-US'), { size: 9, a: 'start' });
  });
  d.text(10, 196, 'FINCH MLP PARAMETERS PER BLOCK', { cls: 'cap', a: 'start' });
  return d.svg();
}

export function glu_family() {
  const d = new D(640, 200, 'glu_family');
  d.text(10, 16, 'THE GLU FAMILY: SAME SHAPE, DIFFERENT SWITCH ON THE GATE', { cls: 'cap', a: 'start' });
  const fams = [['GLU', sig], ['Bilinear', (x) => x], ['ReGLU', (x) => Math.max(0, x)], ['GEGLU', gelu], ['SwiGLU', silu]];
  fams.forEach(([n, f], i) => {
    const x0 = 20 + i * 124;
    d.rect(x0, 40, 108, 110, { r: 8, fill: i === 4 ? C.accFaint : C.card, stroke: i === 4 ? C.acc : C.ink2, sw: 1 });
    d.text(x0 + 54, 58, n, { cls: 'ttl' });
    const pts = []; for (let k = 0; k <= 40; k++) { const t = -3 + 6 * k / 40; pts.push([x0 + 14 + k * 2, 120 - Math.max(-0.6, Math.min(3, f(t))) * 18]); }
    d.line(x0 + 10, 120, x0 + 98, 120, { stroke: C.faint, sw: 0.6, single: true });
    d.lines(pts, { stroke: i === 4 ? C.acc : C.ink, sw: 1.3, rough: 0.3, single: true });
  });
  d.text(320, 176, 'each computes (switch(x W) ⊙ x V) W₂; only the switch differs', { cls: 'xs' });
  return d.svg();
}

export function glu_results() {
  const d = new D(640, 260, 'glu_results');
  d.text(10, 16, 'SHAZEER (2020): LOG-PERPLEXITY AFTER 65,536 STEPS, LOWER IS BETTER', { cls: 'cap', a: 'start' });
  const res = [['ReLU', 1.997], ['GELU', 1.983], ['Swish', 1.994], ['GLU', 1.982], ['Bilinear', 1.960], ['ReGLU', 1.953], ['GEGLU', 1.942], ['SwiGLU', 1.944]];
  const lo = 1.93, hi = 2.0, base = 200;
  res.forEach(([n, v], i) => {
    const x = 40 + i * 72, h = (v - lo) / (hi - lo) * 150, glu = i >= 3, best = n === 'GEGLU' || n === 'SwiGLU';
    d.rect(x, base - h, 44, h, { r: 2, fill: best ? C.acc : glu ? C.slate : C.faint, fop: best ? 1 : 0.5, fs: best ? 'hachure' : 'solid', gap: 3.4, stroke: best ? C.acc : C.ink2, sw: 0.9 });
    d.mono(x + 22, base - h - 9, v.toFixed(3), { size: 9.5 });
    d.text(x + 22, base + 14, n, { cls: 'xs' });
  });
  d.line(30, base, 620, base, { stroke: C.ink2, sw: 0.9, single: true });
  d.text(30, base + 32, 'axis starts at 1.93 to make small gaps visible', { cls: 'xs', a: 'start' });
  d.hand(470, 52, 'plain MLPs on the left,\ngated variants on the right', { size: 15, vc: true });
  return d.svg();
}

export function fused_gate_up() {
  const d = new D(640, 220, 'fused_gate_up');
  d.text(10, 16, 'FUSING GATE AND UP: ONE WIDE MATMUL, THEN SPLIT IN HALF', { cls: 'cap', a: 'start' });
  d.rect(10, 44, 260, 120, { r: 8, fill: C.card, sw: 1 });
  ['gu = x @ W_gate_up    # (T, 512) @ (512, 3072)', 'g, u = gu.chunk(2, dim=-1)', 'h = F.silu(g) * u        # (T, 1536)', 'out = h @ W_down         # (T, 512)'].forEach((l, i) => d.mono(22, 70 + i * 26, l, { size: 9, a: 'start' }));
  d.box(300, 70, 40, 60, 'x', { cls: 'mono', fill: C.card });
  d.arrow(342, 100, 362, 100, { stroke: C.ink2 });
  d.rect(364, 60, 120, 80, { r: 3, fill: C.paper, sw: 1 });
  d.fillRect(366, 62, 58, 76, C.slate, 0.3); d.fillRect(424, 62, 58, 76, C.acc, 0.2);
  d.text(395, 100, 'gate', { cls: 'sm' }); d.text(453, 100, 'up', { cls: 'sm' });
  d.text(424, 156, '512 × 3,072', { cls: 'mono', size: 9.5 });
  d.arrow(486, 100, 506, 100, { stroke: C.ink2 });
  d.box(508, 64, 100, 30, 'g (1,536)', { cls: 'mono', size: 10, fill: C.slateSoft, stroke: C.slate });
  d.box(508, 106, 100, 30, 'u (1,536)', { cls: 'mono', size: 10, fill: C.card });
  d.hand(430, 196, 'one big multiply beats two smaller ones on a GPU', { size: 15 });
  return d.svg();
}

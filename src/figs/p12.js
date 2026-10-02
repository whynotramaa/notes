import { D, C } from '../lib/draw.js';

export function block_trip() {
  const d = new D(640, 420, 'block_trip');
  d.text(10, 16, 'ONE PRE-NORM DECODER BLOCK, BOTTOM TO TOP  (FINCH-19 SHAPES)', { cls: 'cap', a: 'start' });
  const sx = 200;
  d.line(sx, 396, sx, 46, { stroke: C.acc, sw: 2.6, rough: 0.6 });
  d.head(sx, 42, -Math.PI / 2, { stroke: C.acc, sw: 1.8, hl: 11 });
  d.text(sx - 12, 392, 'x  (T × 512)', { cls: 'mono', size: 10.5, a: 'end' });
  d.text(sx - 12, 52, 'out  (T × 512)', { cls: 'mono', size: 10.5, a: 'end' });
  const branch = (y0, y1, label, fill, stroke, note) => {
    const bx = 300;
    d.carrow([[sx, y0], [sx + 40, y0 - 4], [bx, y0 - 10]], { stroke: C.ink2, sw: 1 });
    d.box(bx, y0 - 30, 110, 34, 'LayerNorm', { fill: C.card, size: 11 });
    d.arrow(bx + 55, y0 - 32, bx + 55, y1 + 36, { stroke: C.ink2 });
    d.box(bx - 10, y1, 130, 36, label, { fill, stroke, size: 12 });
    d.carrow([[bx - 10, y1 + 18], [sx + 50, y1 + 10], [sx + 12, y1 - 8]], { stroke: C.acc, sw: 1.2 });
    d.circle(sx, y1 - 12, 22, { fill: C.paper, sw: 1.1 }); d.text(sx, y1 - 12, '+', { size: 14 });
    d.text(bx + 130, y1 + 18, note, { cls: 'xs', a: 'start' });
  };
  branch(370, 248, 'multi-head attention', C.accSoft, C.acc, 'tokens talk:\nmixes across positions');
  branch(212, 92, 'MLP 512 → 2,048 → 512', C.slateSoft, C.slate, 'each token thinks:\nworks within a position');
  d.text(sx - 12, 236, 'h', { cls: 'mono', size: 12, a: 'end' });
  d.hand(90, 160, 'residual\nstream', { size: 18, vc: true });
  d.text(320, 412, 'h = x + Attn(LN(x))        out = h + MLP(LN(h))', { cls: 'mono', size: 10.5 });
  return d.svg();
}

export function residual_notebook() {
  const d = new D(640, 270, 'residual_notebook');
  d.text(10, 16, 'THE RESIDUAL STREAM: EVERY SUB-LAYER READS IT AND ADDS A SMALL NOTE  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const base = [0.4, -0.2, 0.6, 0.1, -0.5, 0.3, 0.2, -0.1, 0.5, -0.3];
  const deltas = [[0.1, 0.0, -0.1, 0.3, 0.0, 0.0, 0.1, 0.0, 0.0, 0.1], [0.0, 0.2, 0.0, 0.0, 0.1, -0.2, 0.0, 0.1, 0.0, 0.0], [-0.1, 0.0, 0.1, 0.0, 0.0, 0.1, 0.0, 0.0, 0.2, 0.0], [0.0, 0.0, 0.0, 0.1, -0.1, 0.0, 0.2, 0.0, 0.0, 0.1]];
  let cur = base.slice();
  const labs = ['embedding', '+ attn 1', '+ MLP 1', '+ attn 2', '+ MLP 2'];
  for (let r = 0; r < 5; r++) {
    const y = 40 + r * 42;
    if (r > 0) cur = cur.map((v, i) => v + deltas[r - 1][i]);
    d.text(110, y + 13, labs[r], { cls: 'mono', size: 10, a: 'end' });
    cur.forEach((v, k) => {
      d.fillRect(124 + k * 30 + 1, y + 1, 28, 24, v >= 0 ? C.acc : C.slate, Math.min(0.85, Math.abs(v) * 1.2));
      if (r > 0 && deltas[r - 1][k] !== 0) d.rect(124 + k * 30, y, 30, 26, { r: 2, stroke: C.ink, sw: 1.1 });
    });
    d.rect(124, y, 300, 26, { r: 2, sw: 0.8 });
    if (r > 0) d.mono(440, y + 13, `change size ${Math.sqrt(deltas[r - 1].reduce((s, v) => s + v * v, 0)).toFixed(2)}`, { size: 9.5, a: 'start', color: C.gray });
  }
  d.hand(520, 252, 'nothing is erased, only added to', { size: 15 });
  return d.svg();
}

export function pre_post() {
  const d = new D(640, 300, 'pre_post');
  d.text(10, 16, 'WHERE THE NORM GOES: POST-NORM (2017) VERSUS PRE-NORM (GPT-2 ONWARD)', { cls: 'cap', a: 'start' });
  const col = (x0, title, pre) => {
    d.text(x0 + 110, 40, title, { cls: 'ttl' });
    const sx = x0 + 60;
    d.line(sx, 280, sx, 60, { stroke: pre ? C.acc : C.ink2, sw: pre ? 2.4 : 1.4 });
    [[230, 'attention'], [130, 'MLP']].forEach(([y, lab]) => {
      d.carrow([[sx, y + 30], [sx + 40, y + 26], [sx + 70, y + 18]], { stroke: C.ink2, sw: 0.9 });
      if (pre) { d.box(sx + 70, y + 4, 70, 26, 'LN', { fill: C.slateSoft, stroke: C.slate, size: 10.5 }); d.box(sx + 150, y + 4, 80, 26, lab, { fill: C.card, size: 10.5 }); d.carrow([[sx + 190, y + 4], [sx + 150, y - 12], [sx + 8, y - 18]], { stroke: C.ink2, sw: 0.9 }); }
      else { d.box(sx + 70, y + 4, 90, 26, lab, { fill: C.card, size: 10.5 }); d.carrow([[sx + 115, y + 4], [sx + 80, y - 10], [sx + 8, y - 18]], { stroke: C.ink2, sw: 0.9 }); }
      d.circle(sx, y - 20, 18, { fill: C.paper, sw: 1 }); d.text(sx, y - 20, '+', { size: 12 });
      if (!pre) d.box(sx - 30, y - 56, 60, 22, 'LN', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
    });
  };
  col(10, 'post-norm: LN on the main line', false);
  col(330, 'pre-norm: LN on the side trips', true);
  d.line(322, 34, 322, 290, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.hand(560, 74, 'clean highway\ntop to bottom', { size: 15, vc: true });
  return d.svg();
}

export function layernorm_steps() {
  const d = new D(640, 240, 'layernorm_steps');
  d.text(10, 16, 'LAYERNORM ON x = [2, −1, 4, 3]  (γ = 1, β = 0)', { cls: 'cap', a: 'start' });
  const rows = [['x', [2, -1, 4, 3], 'mean = 2'], ['x − mean', [0, -3, 2, 1], 'variance = (0 + 9 + 4 + 1) / 4 = 3.5'], ['÷ √3.5 = 1.871', [0, -1.604, 1.069, 0.535], 'mean 0, spread 1']];
  rows.forEach(([lab, v, note], i) => {
    const y = 40 + i * 62;
    d.text(130, y + 15, lab, { cls: 'mono', size: 10.5, a: 'end' });
    v.forEach((x, k) => d.box(144 + k * 66, y, 60, 30, Number.isInteger(x) ? String(x) : x.toFixed(3), { cls: 'mono', size: 10.5, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2, sw: 0.9, r: 4 }));
    d.text(424, y + 15, note, { cls: 'sm', a: 'start' });
  });
  d.hand(320, 226, 'then multiply by a learned γ and add a learned β, per channel', { size: 15 });
  return d.svg();
}

export function mlp_gelu() {
  const d = new D(640, 260, 'mlp_gelu');
  d.text(10, 16, 'THE MLP: WIDEN, BEND, NARROW  (FINCH-19: 512 → 2,048 → 512)', { cls: 'cap', a: 'start' });
  d.rect(20, 110, 24, 70, { r: 3, fill: C.card, sw: 1 });
  d.text(32, 196, '512', { cls: 'mono', size: 9.5 });
  d.arrow(48, 145, 72, 145, { stroke: C.ink2 });
  d.box(76, 125, 70, 40, 'W_{1}\n+ b_{1}', { fill: C.card, size: 10.5 });
  d.arrow(148, 145, 168, 145, { stroke: C.ink2 });
  d.rect(172, 50, 30, 190, { r: 3, fill: C.accFaint, stroke: C.acc, sw: 1 });
  d.text(187, 252, '2,048', { cls: 'mono', size: 9.5 });
  d.arrow(206, 145, 226, 145, { stroke: C.ink2 });
  d.box(230, 125, 60, 40, 'GELU', { fill: C.accSoft, stroke: C.acc, size: 11 });
  d.arrow(292, 145, 312, 145, { stroke: C.ink2 });
  d.box(316, 125, 70, 40, 'W_{2}\n+ b_{2}', { fill: C.card, size: 10.5 });
  d.arrow(388, 145, 408, 145, { stroke: C.ink2 });
  d.rect(412, 110, 24, 70, { r: 3, fill: C.card, sw: 1 });
  d.text(424, 196, '512', { cls: 'mono', size: 9.5 });
  const Phi = (t) => { const a = Math.abs(t) / Math.SQRT2, k = 1 / (1 + 0.3275911 * a); const e = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-a * a); return 0.5 * (1 + (t >= 0 ? e : -e)); };
  const M = d.axes(470, 60, 150, 130, { xmin: -3, xmax: 3, ymin: -1, ymax: 3, xl: 'x' });
  d.fn((t) => Math.max(0, t), -3, 3, M, { stroke: C.line, sw: 1.1 });
  d.fn((t) => t * Phi(t), -3, 3, M, { stroke: C.acc, sw: 1.6 });
  d.text(545, 44, 'GELU (orange), ReLU (grey)', { cls: 'xs' });
  d.mono(M.X(-1), M.Y(-0.159) + 16, 'GELU(−1) = −0.159', { size: 8.5 });
  d.hand(250, 214, 'without the bend, two matrices\ncollapse into one', { size: 15, vc: true });
  return d.svg();
}

export function mix_axes() {
  const d = new D(640, 260, 'mix_axes');
  d.text(10, 16, 'ATTENTION MIXES ACROSS TOKENS; THE MLP WORKS WITHIN EACH TOKEN', { cls: 'cap', a: 'start' });
  const grid = (x0, title, across) => {
    d.text(x0 + 130, 42, title, { cls: 'ttl' });
    for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) d.rect(x0 + 20 + c * 40, 60 + r * 30, 30, 22, { r: 3, fill: C.card, stroke: C.line, sw: 0.7 });
    ['The', 'cat', 'sat', 'bec.', 'it', 'was'].forEach((t, c) => d.text(x0 + 35 + c * 40, 222, t, { cls: 'xs' }));
    if (across) { [[4, 1], [4, 3], [5, 4], [2, 1]].forEach(([a, b], i) => d.carrow([[x0 + 35 + b * 40, 66 + i * 34], [x0 + 35 + (a + b) * 20, 54 + i * 34], [x0 + 31 + a * 40, 66 + i * 34]], { stroke: C.acc, sw: 1.1 })); }
    else { for (let c = 0; c < 6; c++) d.carrow([[x0 + 30 + c * 40, 190], [x0 + 46 + c * 40, 130], [x0 + 32 + c * 40, 70]], { stroke: C.slate, sw: 1 }); }
  };
  grid(10, 'attention: arrows cross columns', true);
  grid(330, 'MLP: arrows stay in their column', false);
  d.text(320, 246, 'columns are tokens, rows are features. A block alternates: share, then think.', { cls: 'xs' });
  return d.svg();
}

export function temperature() {
  const d = new D(640, 250, 'temperature');
  d.text(10, 16, 'LOGITS [2.0, 1.0, 0.1, −1.0] AT THREE TEMPERATURES', { cls: 'cap', a: 'start' });
  const z = [2.0, 1.0, 0.1, -1.0], names = ['tea', 'coffee', 'water', 'rocks'];
  [0.5, 1, 2].forEach((T, k) => {
    const e = z.map((v) => Math.exp(v / T)), s = e.reduce((a, b) => a + b, 0), p = e.map((v) => v / s);
    const x0 = 20 + k * 210, base = 190;
    d.text(x0 + 90, 44, `T = ${T}`, { cls: 'ttl' });
    d.line(x0, base, x0 + 180, base, { stroke: C.ink2, sw: 0.9 });
    p.forEach((v, i) => {
      const h = 130 * v;
      d.rect(x0 + 8 + i * 44, base - h, 32, h, { r: 2, fill: i === 0 ? C.acc : C.faint, fs: i === 0 ? 'hachure' : 'solid', gap: 3.4, stroke: i === 0 ? C.acc : C.ink2, sw: 0.9 });
      d.mono(x0 + 24 + i * 44, base - h - 9, v.toFixed(3), { size: 9 });
      d.text(x0 + 24 + i * 44, base + 13, names[i], { cls: 'xs' });
    });
  });
  d.text(110, 226, 'sharper: safe, repetitive', { cls: 'xs' });
  d.text(530, 226, 'flatter: varied, riskier', { cls: 'xs' });
  return d.svg();
}

export function param_bars() {
  const d = new D(640, 250, 'param_bars');
  d.text(10, 16, 'WHERE FINCH-19’S 42,128,384 PARAMETERS LIVE (TIED EMBEDDINGS)', { cls: 'cap', a: 'start' });
  const parts = [['token embeddings (= LM head)', 16384000, C.slate], ['position table', 524288, C.ink2], ['attention, 8 layers', 8404992, C.acc], ['MLP, 8 layers', 16797696, C.ink], ['LayerNorm gains and biases', 17408, C.gray]];
  const total = parts.reduce((a, p) => a + p[1], 0), W = 600;
  let x = 20;
  parts.forEach(([, v, c], i) => { const w = Math.max(2, v / total * W); d.rect(x, 40, w, 40, { r: 2, fill: c, fop: i === 2 ? 0.55 : 0.3, stroke: c, sw: 1 }); x += w; });
  let ly = 104;
  parts.forEach(([n, v, c]) => {
    d.fillRect(24, ly - 6, 12, 12, c, 0.5);
    d.text(46, ly, n, { cls: 'sm', a: 'start' });
    d.mono(400, ly, v.toLocaleString('en-US'), { size: 10.5, a: 'end' });
    d.mono(470, ly, (v / total * 100).toFixed(1) + '%', { size: 10.5, a: 'end', color: C.gray });
    ly += 24;
  });
  d.line(24, ly - 8, 480, ly - 8, { stroke: C.ink2, sw: 0.8, single: true });
  d.text(46, ly + 6, 'total', { cls: 'ttl', a: 'start', size: 11 });
  d.mono(400, ly + 6, total.toLocaleString('en-US'), { size: 10.5, a: 'end' });
  d.hand(560, 150, 'the MLP is\ntwice attention', { size: 15, vc: true });
  return d.svg();
}

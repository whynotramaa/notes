import { D, C } from '../lib/draw.js';

export function grid_grow() {
  const d = new D(640, 260, 'grid_grow');
  d.text(10, 16, 'TOKENS GROW IN A LINE, SCORES GROW IN A SQUARE', { cls: 'cap', a: 'start' });
  [[4, 20], [8, 150], [16, 330]].forEach(([n, x0]) => {
    const s = n * 9;
    for (let i = 0; i < n; i++) d.fillRect(x0 + i * 9, 40, 8, 8, C.ink2, 0.6);
    d.text(x0 + s / 2, 62, `${n} tokens`, { cls: 'xs' });
    d.rect(x0, 72, s, s, { r: 1, fill: C.accFaint, stroke: C.acc, sw: 1 });
    for (let k = 1; k < n; k++) { d.line(x0 + k * 9, 72, x0 + k * 9, 72 + s, { stroke: C.acc, sw: 0.3, single: true, op: 0.5 }); d.line(x0, 72 + k * 9, x0 + s, 72 + k * 9, { stroke: C.acc, sw: 0.3, single: true, op: 0.5 }); }
    d.mono(x0 + s / 2, 84 + s, `${n * n} scores`, { size: 10, color: C.acc });
  });
  d.text(560, 110, '1,000 tokens:', { cls: 'sm', a: 'middle' });
  d.mono(560, 128, '1,000,000', { size: 11 });
  d.text(560, 160, '100,000 tokens:', { cls: 'sm' });
  d.mono(560, 178, '10,000,000,000', { size: 11, color: C.red });
  d.text(560, 196, 'per head, per layer', { cls: 'xs' });
  return d.svg();
}

export function doubling_squares() {
  const d = new D(640, 250, 'doubling_squares');
  d.text(10, 16, 'DOUBLING THE CONTEXT QUADRUPLES THE SCORE GRID', { cls: 'cap', a: 'start' });
  const sizes = [['4k', 12], ['8k', 24], ['16k', 48], ['32k', 96], ['64k', 192]];
  let x = 20;
  sizes.forEach(([t, s], i) => {
    const y = 220 - s;
    d.rect(x, y, s, s, { r: 1, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2, sw: 1 });
    d.text(x + s / 2, 236, t, { cls: 'mono', size: 10 });
    d.text(x + s / 2, y - 10, `×${4 ** i}`, { cls: 'xs', color: i === 4 ? C.acc : C.gray });
    x += s + 22;
  });
  d.hand(560, 110, '4k → 128k:\n32× the tokens,\n1,024× the scores', { size: 16, vc: true });
  return d.svg();
}

export function attn_vs_linear() {
  const d = new D(640, 270, 'attn_vs_linear');
  d.text(10, 16, 'FORWARD FLOPS PER TOKEN PER LAYER: LINEAR LAYERS 24 d² VERSUS ATTENTION 4 T d  (d = 4,096)', { cls: 'cap', a: 'start' });
  const dm = 4096, xmax = 65536;
  const lin = 24 * dm * dm, att = (T) => 4 * T * dm;
  const M = d.axes(70, 40, 500, 170, { xmin: 0, xmax, ymin: 0, ymax: 1.2e9, xl: 'context length T', yl: 'FLOPs per token' });
  d.fn(() => lin, 0, xmax, M, { stroke: C.slate, sw: 1.6, n: 4 });
  d.fn(att, 0, xmax, M, { stroke: C.acc, sw: 1.6, n: 4 });
  const cross = 6 * dm;
  d.line(M.X(cross), 40, M.X(cross), 210, { stroke: C.ink2, sw: 0.9, dash: [4, 3], single: true });
  d.text(M.X(cross), 226, 'T = 6d = 24,576', { cls: 'mono', size: 9.5 });
  d.text(M.X(55000), M.Y(lin) - 10, 'projections + MLP: flat', { cls: 'xs', color: C.slate });
  d.text(M.X(50000), M.Y(att(50000)) - 14, 'attention: grows with T', { cls: 'xs', color: C.acc, a: 'end' });
  [0, 16384, 32768, 49152, 65536].forEach((t) => d.text(M.X(t), 244, t.toLocaleString('en-US'), { cls: 'xs' }));
  d.hand(220, 70, 'below the line,\nattention is the cheap part', { size: 15, vc: true, color: C.gray });
  return d.svg();
}

export function score_memory() {
  const d = new D(640, 270, 'score_memory');
  d.text(10, 16, 'MEMORY TO STORE ONE LAYER’S FULL SCORE GRIDS IN 16-BIT  (LOG SCALE)', { cls: 'cap', a: 'start' });
  const Ts = [1024, 4096, 8192, 32768, 131072];
  const base = 220, top = 40, lo = 6, hi = 13;
  const Y = (v) => base - (Math.log10(v) - lo) / (hi - lo) * (base - top);
  [1e6, 1e8, 1e10, 1e12].forEach((g, i) => { d.line(70, Y(g), 620, Y(g), { stroke: C.faint, sw: 0.6, single: true }); d.text(64, Y(g), ['1 MB', '100 MB', '10 GB', '1 TB'][i], { cls: 'xs', a: 'end' }); });
  d.line(70, Y(80e9), 620, Y(80e9), { stroke: C.red, sw: 1, dash: [5, 3], single: true });
  d.text(616, Y(80e9) - 8, 'one 80 GB GPU', { cls: 'xs', a: 'end', color: C.red });
  Ts.forEach((T, i) => {
    const x = 96 + i * 104;
    [[8, C.slate], [32, C.acc]].forEach(([H, col], k) => {
      const v = H * T * T * 2, y = Y(v);
      d.rect(x + k * 34, y, 28, base - y, { r: 2, fill: col, fop: 0.35, stroke: col, sw: 0.9 });
    });
    d.text(x + 31, base + 14, T.toLocaleString('en-US'), { cls: 'mono', size: 9.5 });
  });
  d.text(130, 254, 'slate: 8 heads (Finch-19)   orange: 32 heads (Llama 3 8B size)', { cls: 'xs', a: 'start' });
  d.hand(470, 56, '1.1 TB at 128k', { size: 16, color: C.red });
  return d.svg();
}

export function flash_tiles() {
  const d = new D(640, 270, 'flash_tiles');
  d.text(10, 16, 'FLASHATTENTION: WORK TILE BY TILE, NEVER STORE THE WHOLE SQUARE', { cls: 'cap', a: 'start' });
  const n = 6, cs = 34, x0 = 40, y0 = 40;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const skip = c > r, cur = r === 3 && c === 2, done = r < 3 || (r === 3 && c < 2);
    d.rect(x0 + c * cs + 2, y0 + r * cs + 2, cs - 4, cs - 4, { r: 3, fill: skip ? C.paper : cur ? C.acc : done ? C.accFaint : C.card, stroke: skip ? C.line : cur ? C.acc : C.ink2, sw: 0.8, dash: skip ? [2, 3] : undefined });
  }
  d.text(x0 + n * cs / 2, y0 + n * cs + 16, 'query blocks down, key blocks across', { cls: 'xs' });
  d.text(x0 + n * cs - 4, y0 + 18, 'skipped:\nall future', { cls: 'xs', a: 'end', vc: true });
  d.rect(330, 50, 290, 170, { r: 8, fill: C.card, stroke: C.ink2, sw: 1 });
  d.text(345, 70, 'FAST ON-CHIP MEMORY (SRAM)', { cls: 'cap', a: 'start' });
  d.box(345, 84, 120, 30, 'query block 3', { fill: C.accSoft, stroke: C.acc, size: 10.5 });
  d.box(480, 84, 125, 30, 'key/value block 2', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.box(345, 128, 260, 30, 'scores for this tile: used, then thrown away', { fill: C.paper, size: 10 });
  d.text(345, 182, 'kept per query row:', { cls: 'sm', a: 'start' });
  d.text(345, 202, 'running max m, running sum ℓ, running output O', { cls: 'mono', size: 9.5, a: 'start' });
  d.hand(480, 248, 'exact same answer, a fraction of the memory', { size: 15 });
  return d.svg();
}

export function online_softmax() {
  const d = new D(640, 260, 'online_softmax');
  d.text(10, 16, 'ONLINE SOFTMAX: SCORES ARRIVE IN TWO CHUNKS, KEEP A RUNNING MAX AND SUM', { cls: 'cap', a: 'start' });
  const rows = [
    ['chunk 1', '[2.0, 1.0, 3.0]', 'm = 3', 'ℓ = e⁻¹ + e⁻² + e⁰ = 1.503'],
    ['chunk 2', '[5.0, 0.0, 4.0]', 'm = 5', 'rescale: 1.503 × e^(3−5) = 0.203'],
    ['', '', '', 'add: e⁰ + e⁻⁵ + e⁻¹ = 1.375'],
    ['result', '', '', 'ℓ = 0.203 + 1.375 = 1.578'],
    ['check', 'all six at once', 'm = 5', 'Σ e^(s − 5) = 1.578  ✓'],
  ];
  rows.forEach(([a, b, c, e], i) => {
    const y = 46 + i * 38;
    d.text(70, y, a, { cls: 'ttl', a: 'end', size: 11 });
    d.mono(84, y, b, { size: 10, a: 'start' });
    d.mono(230, y, c, { size: 10, a: 'start', color: C.acc });
    d.mono(300, y, e, { size: 10, a: 'start', color: i === 3 ? C.acc : C.ink });
  });
  d.line(20, 160, 620, 160, { stroke: C.line, sw: 0.8, dash: [3, 3], single: true });
  d.hand(320, 246, 'when a bigger max arrives, shrink the old sum to match', { size: 15 });
  return d.svg();
}

export function sparse_patterns() {
  const d = new D(640, 250, 'sparse_patterns');
  d.text(10, 16, 'COMPUTE FEWER SCORES: CELLS EACH PATTERN KEEPS, T = 16', { cls: 'cap', a: 'start' });
  const T = 16, cs = 10;
  const pats = [['full causal', (i, j) => j <= i], ['sliding window (4)', (i, j) => j <= i && i - j < 4], ['window + stride 4', (i, j) => j <= i && (i - j < 4 || j % 4 === 3)]];
  pats.forEach(([t, ok], k) => {
    const x0 = 30 + k * 205;
    let n = 0;
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) { if (ok(i, j)) { n++; d.fillRect(x0 + j * cs + 0.5, 50 + i * cs + 0.5, cs - 1, cs - 1, k === 0 ? C.ink2 : C.acc, 0.7); } }
    d.rect(x0, 50, T * cs, T * cs, { r: 0, sw: 0.9 });
    d.text(x0 + T * cs / 2, 40, t, { cls: 'ttl', size: 11 });
    d.mono(x0 + T * cs / 2, 228, `${n} of 136 cells`, { size: 10, color: k ? C.acc : C.ink });
  });
  return d.svg();
}

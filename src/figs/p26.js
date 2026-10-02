import { D, C } from '../lib/draw.js';

export function memory_hierarchy() {
  const d = new D(640, 260, 'memory_hierarchy');
  d.text(10, 16, 'GPU MEMORY HIERARCHY (NVIDIA A100 NUMBERS FROM THE FLASHATTENTION PAPER)', { cls: 'cap', a: 'start' });
  const tiers = [['SRAM (on-chip)', '≈ 20 MB total', '≈ 19 TB/s', 120, C.acc, C.accSoft], ['HBM (GPU main memory)', '40 or 80 GB', '1.5 to 2.0 TB/s', 260, C.slate, C.slateSoft], ['CPU DRAM', '> 1 TB', '12.8 GB/s', 400, C.ink2, C.card]];
  tiers.forEach(([n, size, bw, w, col, fill], i) => {
    const y = 40 + i * 66, x = 320 - w / 2;
    d.poly([[x + 16, y], [x + w - 16, y], [x + w, y + 54], [x, y + 54]], { fill, stroke: col, sw: 1.1 });
    d.text(320, y + 22, n, { cls: 'ttl', size: 11.5 });
    d.text(320, y + 40, size, { cls: 'mono', size: 9.5 });
    d.text(x + w + 14, y + 28, bw, { cls: 'mono', size: 10, a: 'start', color: col });
  });
  d.text(90, 70, 'fast, tiny', { cls: 'sm' });
  d.text(90, 200, 'slow, huge', { cls: 'sm' });
  d.arrow(90, 82, 90, 186, { stroke: C.gray });
  d.hand(320, 248, 'the game: do the work in SRAM, touch HBM as little as possible', { size: 15 });
  return d.svg();
}

export function round_trips() {
  const d = new D(640, 300, 'round_trips');
  d.text(10, 16, 'STANDARD ATTENTION’S TRIPS BETWEEN HBM AND THE CHIP  (PER HEAD, T TOKENS, HEAD SIZE d)', { cls: 'cap', a: 'start' });
  d.rect(20, 40, 170, 230, { r: 8, fill: C.slateSoft, stroke: C.slate, sw: 1 });
  d.text(105, 58, 'HBM', { cls: 'ttl', color: C.slate });
  [['Q, K, V', 'T × d each', 84], ['S', 'T × T', 140], ['P', 'T × T', 196], ['O', 'T × d', 246]].forEach(([n, s, y]) => { d.box(40, y - 16, 130, 34, `${n}  (${s})`, { cls: 'mono', size: 9.5, fill: n === 'S' || n === 'P' ? C.paper : C.card, stroke: n === 'S' || n === 'P' ? C.red : C.ink2 }); });
  d.rect(440, 40, 180, 230, { r: 8, fill: C.accFaint, stroke: C.acc, sw: 1 });
  d.text(530, 58, 'chip (SRAM + compute)', { cls: 'ttl', color: C.acc });
  const trips = [['read Q, K → compute S = QKᵀ', 'write S', 96], ['read S → softmax → P', 'write P', 150], ['read P, V → O = PV', 'write O', 204]];
  trips.forEach(([a, b, y], i) => {
    d.arrow(172, y - 10, 436, y - 10, { stroke: C.ink2, sw: 0.9 });
    d.text(304, y - 18, a, { cls: 'xs' });
    d.arrow(436, y + 8, 172, y + 8, { stroke: i < 2 ? C.red : C.ink2, sw: i < 2 ? 1.3 : 0.9 });
    d.text(304, y + 20, b, { cls: 'xs', color: i < 2 ? C.red : C.gray });
  });
  d.text(320, 290, 'the two T × T grids each go out and come back: about 4T² extra elements moved, versus 4Td for the inputs and output', { cls: 'xs' });
  return d.svg();
}

export function flash_sweep() {
  const d = new D(640, 290, 'flash_sweep');
  d.text(10, 16, 'FLASHATTENTION: ONE QUERY BLOCK STAYS ON CHIP WHILE KEY/VALUE BLOCKS STREAM PAST', { cls: 'cap', a: 'start' });
  const n = 4, cs = 44, x0 = 40, y0 = 50;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const skip = c > r, cur = r === 2 && c === 1, done = r === 2 && c === 0, row = r === 2;
    d.rect(x0 + c * cs + 2, y0 + r * cs + 2, cs - 4, cs - 4, { r: 4, fill: skip ? C.paper : cur ? C.acc : done ? C.accSoft : row ? C.accFaint : C.card, stroke: skip ? C.line : row ? C.acc : C.ink2, sw: 0.9, dash: skip ? [2, 3] : undefined });
  }
  for (let r = 0; r < n; r++) d.text(x0 - 8, y0 + r * cs + cs / 2, `Q${r}`, { cls: 'mono', size: 9.5, a: 'end' });
  for (let c = 0; c < n; c++) d.text(x0 + c * cs + cs / 2, y0 - 10, `K${c}V${c}`, { cls: 'mono', size: 9 });
  d.text(x0 + n * cs / 2, y0 + n * cs + 18, 'grey dashed: above the diagonal, skipped', { cls: 'xs' });
  d.rect(260, 46, 360, 210, { r: 8, fill: C.card, stroke: C.ink2, sw: 1 });
  d.text(276, 66, 'IN SRAM RIGHT NOW', { cls: 'cap', a: 'start' });
  d.box(276, 80, 150, 32, 'query block Q2', { fill: C.accSoft, stroke: C.acc, size: 10.5 });
  d.box(446, 80, 160, 32, 'key/value block K1, V1', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.box(276, 126, 330, 32, 'tile scores S = Q2 K1ᵀ (used, then discarded)', { fill: C.paper, size: 10 });
  d.text(276, 182, 'per query row, three running quantities:', { cls: 'sm', a: 'start' });
  d.text(276, 204, 'm  largest score so far', { cls: 'mono', size: 10, a: 'start' });
  d.text(276, 222, 'ℓ  running sum of exp(s − m)', { cls: 'mono', size: 10, a: 'start' });
  d.text(276, 240, 'O  running sum of exp(s − m) · v', { cls: 'mono', size: 10, a: 'start' });
  return d.svg();
}

export function online_softmax_full() {
  const d = new D(640, 320, 'online_softmax_full');
  d.text(10, 16, 'ONLINE SOFTMAX WITH VALUES: ONE QUERY, TWO KEY BLOCKS OF THREE  (SCALAR VALUES)', { cls: 'cap', a: 'start' });
  const rows = [
    ['block 1', 'scores [1.0, 2.0, 0.0], values [10, 20, 30]', ''],
    ['', 'm = 2.0', 'ℓ = e⁻¹ + e⁰ + e⁻² = 1.5032'],
    ['', '', 'O = 0.368·10 + 1·20 + 0.135·30 = 27.739'],
    ['block 2', 'scores [3.0, 0.5, 1.0], values [40, 50, 60]', ''],
    ['', 'm′ = 3.0, factor e^(2 − 3) = 0.3679', 'ℓ′ = 0.3679 · 1.5032 + 1.2174 = 1.7704'],
    ['', '', 'O′ = 0.3679 · 27.739 + 52.224 = 62.429'],
    ['result', '', 'out = O′ / ℓ′ = 35.262'],
    ['check', 'softmax of all six scores, then weights · values', '= 35.262  ✓'],
  ];
  rows.forEach(([a, b, c], i) => {
    const y = 44 + i * 33;
    if (a) d.text(70, y, a, { cls: 'ttl', a: 'end', size: 11 });
    d.mono(84, y, b, { size: 9.5, a: 'start', color: b.startsWith('m') ? C.acc : C.ink });
    d.mono(350, y, c, { size: 9.5, a: 'start', color: i >= 6 ? C.acc : C.ink });
  });
  d.line(20, 140, 620, 140, { stroke: C.line, sw: 0.8, dash: [3, 3], single: true });
  d.line(20, 239, 620, 239, { stroke: C.line, sw: 0.8, dash: [3, 3], single: true });
  return d.svg();
}

export function hbm_traffic() {
  const d = new D(640, 260, 'hbm_traffic');
  d.text(10, 16, 'HBM ELEMENTS MOVED PER HEAD, LOG-LOG  (SHAPES FROM THE PAPER’S BOUNDS; SRAM = 100k ELEMENTS)', { cls: 'cap', a: 'start' });
  const Mem = 1e5;
  const std = (T, dd) => 4 * T * dd + 4 * T * T, fl = (T, dd) => 4 * T * dd + T * T * dd * dd / Mem;
  const X = (T) => 80 + (Math.log2(T) - 9) / 7 * 480, Y = (v) => 210 - (Math.log10(v) - 5) / 6 * 170;
  [1e5, 1e7, 1e9, 1e11].forEach((g) => { d.line(80, Y(g), 570, Y(g), { stroke: C.faint, sw: 0.6, single: true }); d.text(74, Y(g), g.toExponential(0).replace('e+', 'e'), { cls: 'xs', a: 'end' }); });
  [512, 2048, 8192, 32768, 65536].forEach((T) => d.text(X(T), 226, T.toLocaleString('en-US'), { cls: 'xs' }));
  const curve = (f, col, dash) => { const p = []; for (let k = 0; k <= 70; k++) { const T = 2 ** (9 + k / 10); p.push([X(T), Y(f(T))]); } d.lines(p, { stroke: col, sw: 1.5, rough: 0.2, single: true, dash }); };
  curve((T) => std(T, 64), C.red);
  curve((T) => fl(T, 64), C.acc);
  curve((T) => fl(T, 128), C.acc, [5, 3]);
  d.text(574, Y(std(65536, 64)), 'standard', { cls: 'xs', a: 'start', color: C.red });
  d.text(574, Y(fl(65536, 128)), 'Flash d=128', { cls: 'xs', a: 'start', color: C.acc });
  d.text(574, Y(fl(65536, 64)) + 6, 'Flash d=64', { cls: 'xs', a: 'start', color: C.acc });
  d.text(320, 246, 'sequence length T', { cls: 'xs' });
  return d.svg();
}

export function recompute_backward() {
  const d = new D(640, 240, 'recompute_backward');
  d.text(10, 16, 'WHAT THE BACKWARD PASS KEEPS FROM THE FORWARD PASS, PER HEAD  (bf16 / fp32)', { cls: 'cap', a: 'start' });
  const Ts = [2048, 8192, 32768];
  const L = (b) => Math.max(1, (Math.log10(b) - 3) / (10 - 3) * 380);
  Ts.forEach((T, i) => {
    const y = 44 + i * 56, P = T * T * 2, lse = T * 4;
    d.text(110, y + 16, `T = ${T.toLocaleString('en-US')}`, { cls: 'mono', size: 10, a: 'end' });
    d.rect(120, y, L(P), 16, { r: 2, fill: C.red, fop: 0.3, stroke: C.red, sw: 0.8 });
    d.mono(126 + L(P), y + 8, `P: ${P >= 2 ** 30 ? (P / 2 ** 30).toFixed(0) + ' GiB' : (P / 2 ** 20).toFixed(0) + ' MiB'}`, { size: 9, a: 'start' });
    d.rect(120, y + 20, L(lse), 14, { r: 2, fill: C.acc, fop: 0.5, stroke: C.acc, sw: 0.8 });
    d.mono(126 + L(lse), y + 27, `log-sum-exp: ${(lse / 1024).toFixed(0)} KiB`, { size: 9, a: 'start', color: C.acc });
  });
  d.hand(470, 222, 'recompute the scores tile by tile instead', { size: 15 });
  return d.svg();
}

export function causal_blocks() {
  const d = new D(640, 230, 'causal_blocks');
  d.text(10, 16, 'CAUSAL MASKING AT BLOCK LEVEL: SKIP, FULL OR MASKED TILES', { cls: 'cap', a: 'start' });
  [4, 8, 16].forEach((n, k) => {
    const S = 128, cs = S / n, x0 = 30 + k * 205, y0 = 44;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const f = c > r ? C.paper : c === r ? C.accSoft : C.slateSoft;
      d.fillRect(x0 + c * cs + 0.5, y0 + r * cs + 0.5, cs - 1, cs - 1, f, 1);
    }
    d.rect(x0, y0, S, S, { r: 0, sw: 1 });
    const comp = (n * (n - 1) / 2 + n) / (n * n);
    d.text(x0 + S / 2, y0 + S + 16, `${n} × ${n} blocks`, { cls: 'mono', size: 9.5 });
    d.text(x0 + S / 2, y0 + S + 32, `${(comp * 100).toFixed(1)}% of tiles computed`, { cls: 'xs', color: C.acc });
  });
  d.text(600, 70, 'blue: full, no mask', { cls: 'xs', a: 'end' });
  d.text(600, 86, 'orange: diagonal, masked', { cls: 'xs', a: 'end' });
  d.text(600, 102, 'white: skipped', { cls: 'xs', a: 'end' });
  return d.svg();
}

export function flash_versions() {
  const d = new D(640, 210, 'flash_versions');
  d.text(10, 16, 'THREE VERSIONS OF FLASHATTENTION', { cls: 'cap', a: 'start' });
  const v = [['FlashAttention', '2022', 'tiling, online softmax,\nrecompute in backward'], ['FlashAttention-2', '2023', 'better work split across the GPU,\nfewer non-matmul operations, ≈ 2× faster'], ['FlashAttention-3', '2024', 'Hopper (H100): overlaps loading\nwith compute, adds FP8']];
  v.forEach(([n, y, t], i) => {
    const x = 20 + i * 207;
    d.rect(x, 40, 190, 140, { r: 8, fill: i === 2 ? C.accFaint : C.card, stroke: i === 2 ? C.acc : C.ink2, sw: 1 });
    d.text(x + 16, 64, n, { cls: 'ttl', a: 'start' });
    d.mono(x + 174, 64, y, { size: 10, a: 'end', color: C.acc });
    d.text(x + 16, 112, t, { cls: 'sm', a: 'start', vc: true, lh: 16 });
  });
  return d.svg();
}

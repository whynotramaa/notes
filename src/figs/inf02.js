import { D, C } from '../lib/draw.js';

export function inf_cache_shapes() {
  const d = new D(640, 290, 'inf_cache_shapes');
  d.text(10, 16, 'QWEN3-0.6B KV CACHE: PER LAYER, ONE K AND ONE V TENSOR OF SHAPE (B, 8, S, 128)', { cls: 'cap', a: 'start' });
  const stack = (x0, title, fill, stroke) => {
    for (let i = 7; i >= 1; i--) d.rect(x0 + i * 6, 96 - i * 6, 130, 132, { fill: C.paper, stroke: C.line, r: 2, sw: 0.8 });
    d.grid(x0, 96, 6, 1, 130, 22, { cellFill: (r) => r === 5 ? C.accSoft : fill, lineColor: stroke });
    d.text(x0 + 65, 96 + 5 * 22 + 11, 'new row, step t', { cls: 'xs', color: C.acc });
    d.text(x0 + 88, 32, title, { cls: 'ttl' });
    d.brace(x0, x0 + 130, 236, { label: 'd_h = 128' });
    d.text(x0 + 100, 47, 'H_kv = 8 heads deep', { cls: 'xs', a: 'start' });
  };
  stack(56, 'K (rotated by RoPE)', C.slateSoft, C.slate);
  stack(266, 'V (not rotated)', C.slateSoft, C.slate);
  d.vbrace(48, 96, 228, { dir: -1, label: 'S' });
  for (let i = 4; i >= 0; i--) d.rect(470 + i * 8, 120 - i * 8, 110, 70, { fill: i === 0 ? C.card : C.paper, stroke: i === 0 ? C.ink2 : C.line, r: 6, sw: 0.9 });
  d.text(525, 155, 'layer 1:\nK and V', { cls: 'lbl', size: 10.5, vc: true });
  d.text(560, 214, '× 28 layers = 56 tensors', { cls: 'sm' });
  d.mono(320, 276, 'per token: 2 × 28 layers × 8 heads × 128 × 2 bytes = 114,688 bytes', { size: 10.5 });
  return d.svg();
}

export function inf_cache_growth() {
  const d = new D(640, 270, 'inf_cache_growth');
  d.text(10, 16, 'QWEN3-0.6B, ONE SEQUENCE, BF16: KV CACHE vs WEIGHTS', { cls: 'cap', a: 'start' });
  const per = 114688, W = 1192099840;
  const M = d.axes(80, 40, 470, 170, { xmin: 0, xmax: 40960, ymin: 0, ymax: 5e9, xl: 'tokens in context', yl: 'bytes' });
  d.line(M.X(0), M.Y(W), M.X(40960), M.Y(W), { stroke: C.ink2, sw: 1.2, dash: [6, 4], single: true });
  d.text(M.X(40960) + 4, M.Y(W), 'weights\n1.19 GB', { cls: 'sm', a: 'start', vc: true });
  d.fn((t) => per * t, 0, 40960, M, { stroke: C.acc, sw: 1.8, n: 4 });
  const xc = W / per;
  d.dot(M.X(xc), M.Y(W), 4, C.acc);
  d.text(M.X(xc) + 6, M.Y(W) - 14, '10,394 tokens: cache = weights', { cls: 'xs', a: 'start', color: C.acc });
  [[32768, '3.5 GiB'], [40960, '4.375 GiB']].forEach(([t, l]) => { d.dot(M.X(t), M.Y(per * t), 3, C.acc); d.mono(M.X(t) - 6, M.Y(per * t) - 4, l, { size: 9.5, a: 'end', color: C.acc }); });
  [0, 10240, 20480, 32768, 40960].forEach((t) => d.text(M.X(t), 226, t.toLocaleString('en-US'), { cls: 'xs' }));
  [1, 2, 3, 4, 5].forEach((g) => d.text(74, M.Y(g * 1e9), `${g} GB`, { cls: 'xs', a: 'end' }));
  d.hand(220, 100, 'long context costs\nmore than the model', { size: 15, vc: true });
  return d.svg();
}

export function inf_cache_levers() {
  const d = new D(640, 250, 'inf_cache_levers');
  d.text(10, 16, 'EVERY FACTOR IN THE CACHE FORMULA IS A LEVER SOMEONE HAS PULLED', { cls: 'cap', a: 'start' });
  const f = [['2', 'K and V', 'fixed', false], ['L', 'layers', 'sliding windows in some layers', true], ['H_{kv}', 'KV heads', 'GQA, MQA', true], ['d_{h}', 'head size', 'latent compression (MLA)', true], ['S', 'tokens', 'windows, eviction, paging', true], ['b', 'bytes', 'fp8 cache: × 0.5', true], ['B', 'sequences', 'batch size', false]];
  f.forEach(([s, n, lever, hot], i) => {
    const x = 24 + i * 86;
    d.box(x, 50, 70, 44, s, { cls: 'mono', size: 16, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    if (i < 6) d.text(x + 78, 72, '×', { size: 14, color: C.gray });
    d.text(x + 35, 108, n, { cls: 'xs' });
    d.line(x + 35, 118, x + 35, 140, { stroke: hot ? C.acc : C.line, sw: 1, single: true, dash: [3, 3] });
    d.text(x + 35, 152, lever, { cls: 'xs', color: hot ? C.acc : C.gray, size: 9 });
  });
  d.rect(24, 180, 592, 46, { fill: C.paper, stroke: C.line, r: 8 });
  d.mono(320, 196, 'Qwen3-0.6B:  2 × 28 × 8 × 128 × S × 2 × 1  =  114,688 × S bytes', { size: 10.5 });
  d.mono(320, 214, 'with an fp8 cache: 57,344 × S     as MQA: 14,336 × S     as MHA: 229,376 × S', { size: 9.5, color: C.gray });
  return d.svg();
}

export function inf_cached_step() {
  const d = new D(640, 410, 'inf_cached_step');
  d.text(10, 16, 'ONE DECODE STEP IN ONE QWEN3-0.6B LAYER, NEW TOKEN AT POSITION 26, BATCH 1', { cls: 'cap', a: 'start' });
  const box = (x, y, w, lab, sh, o = {}) => { d.box(x, y, w, 30, lab, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, size: 10.5 }); if (sh) d.mono(x + w / 2, y + 42, sh, { size: 9.5, color: o.shc ?? C.gray }); };
  box(250, 34, 140, 'RMSNorm(x)', '(1, 1, 1024)');
  [[60, 'q_proj', '(1, 1, 2048)'], [250, 'k_proj', '(1, 1, 1024)'], [440, 'v_proj', '(1, 1, 1024)']].forEach(([x, l, s]) => { d.arrow(320, 84, x + 70, 98, { stroke: C.ink2, hl: 6 }); box(x, 100, 140, l, s); });
  [[60, 'q_norm, RoPE @ 26', '(1, 16, 1, 128)', true], [250, 'k_norm, RoPE @ 26', '(1, 8, 1, 128)', true], [440, 'reshape only', '(1, 8, 1, 128)', false]].forEach(([x, l, s, hot]) => {
    d.arrow(x + 70, 144, x + 70, 164, { stroke: C.ink2, hl: 6 });
    box(x, 166, 140, l, s, hot ? { fill: C.accFaint, stroke: C.acc } : {});
  });
  d.arrow(320, 210, 320, 232, { stroke: C.ink2, hl: 6 });
  d.arrow(510, 210, 510, 232, { stroke: C.ink2, hl: 6 });
  box(250, 234, 330, 'append to cache: (1, 8, 26, 128) → (1, 8, 27, 128)', null, { fill: C.slateSoft, stroke: C.slate });
  d.arrow(130, 210, 130, 296, { stroke: C.acc, hl: 6 });
  d.arrow(415, 266, 415, 296, { stroke: C.slate, hl: 6 });
  box(60, 298, 520, 'scores q Kᵀ / √128 → (1, 16, 1, 27)   →   softmax   →   × V → (1, 16, 1, 128)', null, { fill: C.accSoft, stroke: C.acc });
  d.arrow(320, 330, 320, 348, { stroke: C.ink2, hl: 6 });
  box(60, 350, 520, 'concat (1, 1, 2048)   →   o_proj (1, 1, 1024)   →   + residual   →   MLP', null);
  d.text(185, 258, 'heads 2j, 2j+1\nread KV head j', { cls: 'xs', vc: true });
  d.hand(470, 398, 'old rows are read, never recomputed', { size: 14 });
  return d.svg();
}

export function inf_toy_attention() {
  const d = new D(640, 270, 'inf_toy_attention');
  d.text(10, 16, 'THE SECTION 7 TOY: ONE HEAD, d_h = 2, THREE CACHED ROWS + ONE NEW', { cls: 'cap', a: 'start' });
  const K = [[1, 0], [0, 1], [1, 1], [1, -1]], V = [[1, 2], [3, 0], [0, 4], [2, 2]], w = [0.2491, 0.1228, 0.5052, 0.1228], sc = [1.4142, 0.7071, 2.1213, 0.7071];
  d.box(30, 40, 90, 30, 'q = [2, 1]', { cls: 'mono', size: 10.5, fill: C.accSoft, stroke: C.acc });
  d.text(200, 38, 'K', { cls: 'ttl' }); d.text(310, 38, 'scaled score', { cls: 'ttl', size: 11 }); d.text(430, 38, 'weight', { cls: 'ttl', size: 11 }); d.text(550, 38, 'V', { cls: 'ttl' });
  K.forEach((k, i) => {
    const y = 52 + i * 34, isNew = i === 3;
    d.box(160, y, 80, 26, `[${k.join(', ')}]`, { cls: 'mono', size: 10, fill: isNew ? C.accFaint : C.slateSoft, stroke: isNew ? C.acc : C.slate, r: 4 });
    d.mono(310, y + 13, sc[i].toFixed(4), { size: 10 });
    d.rect(380, y + 4, 100, 18, { fill: C.paper, stroke: C.line, r: 2, sw: 0.6 });
    d.fillRect(381, y + 5, 98 * w[i] / 0.5052, 16, C.acc, 0.75, 2);
    d.mono(486, y + 13, w[i].toFixed(4), { size: 9.5, a: 'start' });
    d.box(530, y, 80, 26, `[${V[i].join(', ')}]`, { cls: 'mono', size: 10, fill: isNew ? C.accFaint : C.card, stroke: isNew ? C.acc : C.ink2, r: 4 });
  });
  d.text(150, 190, 'appended\nthis step', { cls: 'xs', a: 'end', vc: true, color: C.acc });
  d.box(380, 210, 230, 34, 'output = Σ weight × V = [0.8633, 2.7648]', { cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc });
  d.brace(160, 240, 196, { label: 'rows 0 to 2 read from the cache' });
  return d.svg();
}

export function inf_notes_scene() {
  const d = new D(640, 240, 'inf_notes_scene');
  d.text(10, 16, 'PICTURE THIS: THE SHARED MEETING NOTES', { cls: 'cap', a: 'start' });
  d.rect(200, 36, 240, 180, { fill: C.paper, stroke: C.ink2, r: 6 });
  d.text(320, 52, 'meeting notes', { cls: 'ttl', size: 11 });
  ['Ana: budget is fixed', 'Ben: launch in May', 'Cy: needs two hires', 'Dee: ship docs first'].forEach((l, i) => {
    const y = 76 + i * 30, last = i === 3;
    d.rect(214, y - 11, 212, 22, { fill: last ? C.accSoft : C.slateSoft, stroke: last ? C.acc : C.slate, r: 3, sw: 0.7 });
    d.text(222, y, l, { cls: 'mono', size: 9.5, a: 'start' });
  });
  const person = (x, y, col) => { d.circle(x, y, 20, { fill: C.paper, stroke: col, sw: 1.1 }); d.lines([[x, y + 10], [x, y + 40]], { stroke: col, sw: 1.1, single: true }); d.lines([[x - 14, y + 56], [x, y + 40], [x + 14, y + 56]], { stroke: col, sw: 1.1, single: true }); };
  person(520, 110, C.acc);
  d.text(520, 188, 'Dee arrives', { cls: 'xs', color: C.acc });
  d.carrow([[500, 110], [470, 90], [440, 90]], { stroke: C.slate, sw: 0.9 });
  d.text(470, 74, 'reads all', { cls: 'xs', color: C.slate });
  d.carrow([[505, 140], [470, 170], [430, 166]], { stroke: C.acc, sw: 0.9 });
  d.text(470, 190, 'adds one line', { cls: 'xs', color: C.acc });
  d.text(110, 90, 'earlier lines\nnever rewritten', { cls: 'sm', vc: true });
  d.arrow(150, 100, 210, 110, { stroke: C.gray, hl: 5 });
  d.text(110, 168, 'her question is\nasked once, not filed', { cls: 'sm', vc: true });
  d.hand(320, 232, 'notes = KV cache, reading = attention, one new line = append', { size: 14 });
  return d.svg();
}

export function inf_parity_loops() {
  const d = new D(640, 230, 'inf_parity_loops');
  d.text(10, 16, 'CACHE CORRECTNESS: RUN BOTH LOOPS, COMPARE EVERY STEP', { cls: 'cap', a: 'start' });
  d.box(20, 92, 100, 40, 'prompt IDs', { cls: 'mono', size: 10.5, fill: C.card });
  d.box(180, 40, 190, 44, 'naive: whole sequence\nevery step', { size: 10, fill: C.paper });
  d.box(180, 140, 190, 44, 'cached: one token\nper step + cache', { size: 10, fill: C.accFaint, stroke: C.acc });
  d.arrow(122, 104, 178, 66, { stroke: C.gray, hl: 5 }); d.arrow(122, 120, 178, 158, { stroke: C.gray, hl: 5 });
  d.arrow(372, 62, 430, 100, { stroke: C.ink2, hl: 5 }); d.arrow(372, 162, 430, 124, { stroke: C.ink2, hl: 5 });
  d.box(432, 88, 110, 48, 'max |Δ logits|\n< tol ?', { size: 10, fill: C.accSoft, stroke: C.acc });
  d.arrow(544, 112, 580, 112, { stroke: C.acc, hl: 5 });
  d.text(610, 104, 'argmax', { cls: 'xs' }); d.text(610, 118, 'appended', { cls: 'xs' });
  d.carrow([[600, 128], [560, 210], [180, 214], [110, 136]], { stroke: C.acc, dash: [4, 3], hl: 6 });
  d.text(360, 222, 'same token fed to both loops, 50 to 100 steps', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function inf_attn_shapes() {
  const d = new D(640, 260, 'inf_attn_shapes');
  d.text(10, 16, 'SCORE SHAPES PER HEAD: PREFILL (T × T, MASKED) vs DECODE (1 × S, NO MASK)', { cls: 'cap', a: 'start' });
  const cs = 18;
  d.text(110, 46, 'prefill, T = 8', { cls: 'ttl' });
  d.grid(38, 60, 8, 8, cs, cs, { shade: (r, c) => c <= r ? 0.45 : 0, cellFill: (r, c) => c > r ? C.faint : null, lineColor: C.line });
  d.text(30, 132, 'queries', { cls: 'xs', a: 'end', rot: -90 });
  d.text(110, 216, 'keys', { cls: 'xs' });
  d.text(196, 82, 'future\nblocked', { cls: 'xs', a: 'start', vc: true });
  d.text(110, 238, 'is_causal=True', { cls: 'mono', size: 10 });
  d.text(421, 46, 'decode at position 8, S = 9', { cls: 'ttl' });
  for (let r = 0; r < 8; r++) for (let c = 0; c <= r; c++) d.rect(340 + c * cs, 60 + r * cs, cs, cs, { stroke: C.line, r: 0, sw: 0.5, dash: [2, 2] });
  d.grid(340, 60 + 8 * cs, 1, 9, cs, cs, { shade: () => 0.75, lineColor: C.acc });
  d.text(340 + 9 * cs + 10, 60 + 8 * cs + 9, 'the only new row', { cls: 'sm', a: 'start', color: C.acc });
  d.text(340 + 9 * cs + 10, 110, 'earlier rows: done on\nearlier steps, not redone', { cls: 'xs', a: 'start', vc: true });
  d.text(421, 238, 'is_causal=False', { cls: 'mono', size: 10 });
  return d.svg();
}

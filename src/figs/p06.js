import { D, C } from '../lib/draw.js';

const words5 = ['The', '␠cat', '␠sat', '␠because', '␠it'];
const scores = [0.12, 2.0, 0.46, 0.24, 0.68];
const ex = scores.map(Math.exp), Z = ex.reduce((a, b) => a + b, 0), wts = ex.map((e) => e / Z);
const vals = [[0.0, 0.1, 0.0], [0.9, 0.8, 0.1], [0.1, 0.0, 0.7], [0.0, 0.2, 0.1], [0.2, 0.1, 0.1]];

export function library() {
  const d = new D(640, 250, 'library');
  d.text(10, 16, 'QUERY, KEY, VALUE AS A LIBRARY VISIT', { cls: 'cap', a: 'start' });
  d.rect(20, 80, 110, 70, { r: 4, fill: C.accFaint, stroke: C.acc, sw: 1 });
  d.text(75, 104, 'query', { cls: 'ttl', color: C.acc });
  d.hand(75, 128, '"who is it?"', { size: 16 });
  d.arrow(134, 115, 176, 115, { stroke: C.acc });
  const books = [['the', 0.08], ['cat', 0.55], ['sat', 0.12], ['because', 0.1], ['it', 0.15]];
  books.forEach(([t, w], i) => {
    const x = 186 + i * 52, best = i === 1;
    d.rect(x, 60, 40, 120, { r: 3, fill: best ? C.accSoft : C.card, stroke: best ? C.acc : C.ink2, sw: 1 });
    d.text(x + 20, 120, t, { cls: 'mono', size: 10, rot: -90 });
    d.rect(x + 6, 188, 28 * w / 0.55, 8, { r: 1, fill: best ? C.acc : C.faint, stroke: best ? C.acc : C.line, sw: 0.7 });
  });
  d.text(316, 48, 'keys: the labels on the spines', { cls: 'xs' });
  d.text(316, 214, 'how much of each book you read', { cls: 'xs' });
  d.arrow(452, 115, 486, 115, { stroke: C.ink2 });
  d.rect(492, 70, 130, 90, { r: 4, fill: C.card, sw: 1 });
  d.text(557, 90, 'values: what is inside', { cls: 'xs' });
  d.hand(557, 122, 'furry, purrs,\ndid the sitting', { size: 15, vc: true, color: C.ink2 });
  d.hand(320, 240, 'attention reads a little of every book, most of the best match', { size: 15, color: C.gray });
  return d.svg();
}

export function qkv_proj() {
  const d = new D(640, 290, 'qkv_proj');
  d.text(10, 16, 'ONE INPUT, THREE LEARNED LENSES  (FINCH-19, ONE LAYER, OUR 7-TOKEN SENTENCE)', { cls: 'cap', a: 'start' });
  d.rect(20, 90, 70, 110, { r: 3, fill: C.card, sw: 1 });
  d.text(55, 145, 'x', { cls: 'mono', size: 16 });
  d.text(55, 214, '7 × 512', { cls: 'mono', size: 10 });
  const rows = [['W_{Q}', 'Q', 'what am I looking for?', C.acc, C.accSoft], ['W_{K}', 'K', 'what do I contain?', C.slate, C.slateSoft], ['W_{V}', 'V', 'what will I hand over?', C.ink2, C.card]];
  rows.forEach(([w, n, ask, col, fill], i) => {
    const y = 40 + i * 80;
    d.carrow([[92, 145], [120, y + 30], [146, y + 30]], { stroke: C.ink2, sw: 0.9 });
    d.rect(150, y, 90, 60, { r: 3, fill: C.paper, stroke: col, sw: 1.1 });
    d.text(195, y + 30, w, { size: 14, color: col });
    d.text(195, y + 70, '512 × 512', { cls: 'mono', size: 9 });
    d.text(260, y + 30, '=', { size: 16 });
    d.rect(282, y + 4, 52, 52, { r: 3, fill, stroke: col, sw: 1 });
    d.text(308, y + 30, n, { cls: 'mono', size: 15, color: col });
    d.text(346, y + 22, '7 × 512', { cls: 'mono', size: 10, a: 'start' });
    d.text(346, y + 40, ask, { cls: 'sm', a: 'start' });
  });
  d.text(470, 120, 'per head: 7 × 64', { cls: 'mono', size: 10, a: 'start', color: C.gray });
  d.text(470, 136, '(8 heads side by side)', { cls: 'xs', a: 'start' });
  d.hand(510, 250, 'same x, three different\nlearned views of it', { size: 15, vc: true });
  return d.svg();
}

export function qkv_all() {
  const d = new D(640, 200, 'qkv_all');
  d.text(10, 16, 'EVERY TOKEN MAKES ALL THREE: IT ASKS, IT ADVERTISES, IT OFFERS', { cls: 'cap', a: 'start' });
  const toks = ['The', '␠cat', '␠sat', '␠because', '␠it', '␠was', '␠tired'];
  toks.forEach((t, i) => {
    const x = 16 + i * 88;
    d.box(x, 130, 76, 28, t, { cls: 'mono', size: 10.5, fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2, sw: 0.9, r: 5 });
    [['q', C.acc, C.accFaint], ['k', C.slate, C.slateSoft], ['v', C.ink2, C.card]].forEach(([n, c, f], j) => {
      d.box(x + 3 + j * 25, 74, 21, 26, n, { cls: 'mono', size: 11, fill: f, stroke: c, sw: 0.9, r: 4 });
      d.line(x + 13.5 + j * 25, 128, x + 13.5 + j * 25, 102, { stroke: C.line, sw: 0.7, single: true });
    });
  });
  d.hand(380, 44, '"it" asks with its q, and is also asked about through its k', { size: 15 });
  return d.svg();
}

export function it_scores() {
  const d = new D(640, 260, 'it_scores');
  d.text(10, 16, 'THE QUERY OF “IT” AGAINST EVERY KEY IT CAN SEE  (TOY 4-NUMBER VECTORS)', { cls: 'cap', a: 'start' });
  const bars = (x0, title, v, max, fmt, hiCol) => {
    d.text(x0 + 130, 44, title, { cls: 'ttl' });
    const base = 200;
    d.line(x0, base, x0 + 270, base, { stroke: C.ink2, sw: 0.9 });
    v.forEach((s, i) => {
      const x = x0 + 14 + i * 52, h = 120 * s / max, best = i === 1;
      d.rect(x, base - h, 34, h, { r: 2, fill: best ? hiCol : C.faint, fs: best ? 'hachure' : 'solid', gap: 3.4, stroke: best ? hiCol : C.ink2, sw: 0.9 });
      d.mono(x + 17, base - h - 9, fmt(s), { size: 9.5 });
      d.text(x + 17, base + 14, words5[i], { cls: 'xs' });
    });
  };
  bars(14, 'scores  q_{it} · k_{j}', scores, 2.0, (s) => s.toFixed(2), C.slate);
  d.arrow(296, 130, 334, 130, { stroke: C.acc, sw: 1.3 });
  d.text(315, 114, 'softmax', { cls: 'xs', color: C.acc });
  bars(344, 'weights (sum to 1)', wts, 0.6, (s) => s.toFixed(3), C.acc);
  d.hand(470, 238, '55% of the attention goes to "cat"', { size: 16 });
  return d.svg();
}

export function value_mix() {
  const d = new D(640, 290, 'value_mix');
  d.text(10, 16, 'THE OUTPUT FOR “IT” = WEIGHTED SUM OF THE VALUES  (TOY 3-NUMBER VALUES)', { cls: 'cap', a: 'start' });
  words5.forEach((w, i) => {
    const y = 40 + i * 40;
    d.mono(90, y + 13, w, { a: 'end', size: 10.5 });
    d.mono(140, y + 13, wts[i].toFixed(3), { size: 10.5, color: i === 1 ? C.acc : C.ink });
    d.text(176, y + 13, '×', { size: 13 });
    vals[i].forEach((v, k) => d.box(196 + k * 44, y + 1, 40, 24, v.toFixed(1), { cls: 'mono', size: 10, fill: C.card, sw: 0.8, r: 3 }));
    d.text(340, y + 13, '=', { size: 13 });
    vals[i].forEach((v, k) => { const s = wts[i] * v; d.fillRect(362 + k * 54, y + 2, 50, 22, C.acc, Math.min(0.85, s * 1.6)); d.rect(362 + k * 54, y + 1, 50, 24, { r: 3, sw: 0.7, stroke: i === 1 ? C.acc : C.ink2 }); d.mono(387 + k * 54, y + 13, s.toFixed(3), { size: 9.5, color: s > 0.3 ? C.onAcc : C.ink }); });
  });
  d.line(356, 244, 530, 244, { stroke: C.ink2, sw: 1, single: true });
  d.text(340, 262, 'sum', { cls: 'sm', a: 'end' });
  const out = [0, 1, 2].map((k) => vals.reduce((s, v, i) => s + wts[i] * v[k], 0));
  out.forEach((v, k) => d.box(362 + k * 54, 250, 50, 26, v.toFixed(3), { cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc, r: 3 }));
  d.hand(590, 140, 'mostly\ncat\'s value', { size: 16, vc: true });
  return d.svg();
}

export function kv_separate() {
  const d = new D(640, 210, 'kv_separate');
  d.text(10, 16, 'WHY KEY AND VALUE ARE DIFFERENT VECTORS', { cls: 'cap', a: 'start' });
  d.rect(200, 50, 240, 120, { r: 8, fill: C.card, sw: 1.1 });
  d.text(320, 70, '“␠cat”', { cls: 'mono', size: 12 });
  d.rect(220, 86, 200, 66, { r: 5, fill: C.paper, stroke: C.ink2, sw: 0.9 });
  d.text(320, 104, 'VALUE (inside the box)', { cls: 'cap' });
  d.text(320, 130, 'furry, purrs, did the sitting', { cls: 'sm' });
  d.rect(120, 40, 60, 140, { r: 4, fill: C.slateSoft, stroke: C.slate, sw: 1 });
  d.text(150, 110, 'KEY (the label)', { cls: 'cap', rot: -90, color: C.slate });
  d.text(60, 110, 'singular\nanimal noun,\nsubject', { cls: 'sm', vc: true });
  d.hand(540, 80, 'what makes\nyou findable', { size: 16, vc: true, color: C.slate });
  d.hand(540, 150, 'what you are\nworth once found', { size: 16, vc: true });
  return d.svg();
}

export function shapes_sheet() {
  const d = new D(640, 250, 'shapes_sheet');
  d.text(10, 16, 'SHAPES, DRAWN TO SCALE  (T = 7 TOKENS, d_k = d_v = 4, ONE HEAD)', { cls: 'cap', a: 'start' });
  const u = 14;
  const blk = (x, y, r, c, lab, fill, stroke) => { d.rect(x, y, c * u, r * u, { r: 2, fill, stroke, sw: 1 }); d.text(x + c * u / 2, y + r * u + 14, lab, { cls: 'mono', size: 9.5 }); };
  blk(20, 60, 7, 4, 'Q  7 × 4', C.accFaint, C.acc);
  d.text(90, 109, '×', { size: 15 });
  blk(104, 81, 4, 7, 'Kᵀ  4 × 7', C.slateSoft, C.slate);
  d.text(216, 109, '=', { size: 15 });
  blk(230, 60, 7, 7, 'S  7 × 7', C.card, C.ink2);
  d.text(369, 109, '→ softmax →', { cls: 'xs' });
  blk(410, 60, 7, 7, 'W  7 × 7', C.accSoft, C.acc);
  d.text(522, 109, '×', { size: 15 });
  blk(536, 60, 7, 4, 'V  7 × 4', C.card, C.ink2);
  d.hand(320, 214, 'one score for every pair of tokens: T × T grows with the square of the length', { size: 15 });
  d.text(320, 238, 'output O = W V has shape 7 × 4: one row per token again', { cls: 'xs' });
  return d.svg();
}

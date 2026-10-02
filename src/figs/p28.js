import { D, C, fmtN } from '../lib/draw.js';

export function embedding_context_fork() {
  const d = new D(640, 290, 'embedding_context_fork');
  d.text(10, 16, 'ONE LOOKUP, TWO CONTEXTS', { cls: 'cap', a: 'start' });
  d.chips(20, 65, ['river', 'bank'], { width: 76, h: 32 });
  d.chips(20, 185, ['savings', 'bank'], { width: 76, h: 32 });
  d.carrow([[180, 81], [208, 81], [234, 125]], { stroke: C.ink2 });
  d.carrow([[180, 201], [208, 201], [234, 165]], { stroke: C.ink2 });
  d.box(236, 118, 148, 54, 'E[bank]\nsame vector', { fill: C.card, cls: 'mono', size: 12 });
  d.carrow([[386, 136], [412, 88], [442, 81]], { stroke: C.acc });
  d.carrow([[386, 156], [412, 200], [442, 201]], { stroke: C.acc });
  d.box(444, 58, 176, 46, 'bank + river context', { fill: C.accSoft, stroke: C.acc, size: 12 });
  d.box(444, 178, 176, 46, 'bank + savings context', { fill: C.accSoft, stroke: C.acc, size: 12 });
  d.text(310, 192, 'embedding lookup', { cls: 'sm' });
  d.text(532, 135, 'after attention', { cls: 'ttl' });
  d.hand(320, 263, 'the row knows the token; attention supplies the neighbours', { size: 19 });
  return d.svg();
}

export function self_cross_attention() {
  const d = new D(640, 300, 'self_cross_attention');
  d.text(10, 16, 'WHERE THE QUESTIONS AND ANSWERS COME FROM', { cls: 'cap', a: 'start' });
  const panels = [
    { x: 20, title: 'self-attention', q: 'same sequence: Q', kv: 'same sequence: K, V', rows: 3, cols: 3 },
    { x: 346, title: 'cross-attention', q: 'target sequence: Q', kv: 'source sequence: K, V', rows: 2, cols: 4 },
  ];
  panels.forEach(({ x, title, q, kv, rows, cols }) => {
    d.text(x, 49, title, { cls: 'ttl', a: 'start', size: 16 });
    d.text(x, 80, q, { cls: 'mono', size: 11, a: 'start' });
    d.text(x, 102, kv, { cls: 'mono', size: 11, a: 'start' });
    d.grid(x + 80, 137, rows, cols, 34, 30, { cellFill: () => C.accFaint });
    d.text(x + 69, 152, 'Q', { cls: 'mono', a: 'end' });
    d.text(x + 80 + cols * 17, 126, 'K', { cls: 'mono' });
    d.mono(x + 80 + cols * 17, 246, `${rows} × ${cols} = ${rows * cols} scores`, { size: 11 });
  });
  d.line(320, 48, 320, 253, { stroke: C.line, dash: [3, 5], single: true });
  d.hand(320, 282, 'a score grid can be rectangular, too', { size: 19 });
  return d.svg();
}

export function cache_edit_boundary() {
  const d = new D(640, 300, 'cache_edit_boundary');
  d.text(10, 16, 'EDIT THE PAST, REBUILD THE SUFFIX', { cls: 'cap', a: 'start' });
  const old = ['The', 'cat', 'sat', 'because', 'it', 'was', 'tired'];
  const changed = old.map((t, i) => i === 1 ? 'dog' : t);
  [old, changed].forEach((tokens, r) => {
    const y = 67 + r * 112;
    d.text(16, y - 20, r ? 'after the edit' : 'cached sequence', { cls: 'ttl', a: 'start' });
    tokens.forEach((t, i) => {
      const x = 16 + i * 88, rebuild = r && i >= 1;
      d.box(x, y, 80, 32, t, { cls: 'mono', size: 11, fill: rebuild ? C.accSoft : C.card, stroke: rebuild ? C.acc : C.ink2 });
      d.mono(x + 40, y + 46, `pos ${i}`, { size: 10 });
      if (r) d.text(x + 40, y + 66, rebuild ? 'recompute' : 'reuse', { cls: 'sm', color: rebuild ? C.acc : C.ink2 });
    });
  });
  d.line(100, 118, 100, 145, { stroke: C.acc, dash: [4, 4], single: true });
  d.line(100, 174, 100, 255, { stroke: C.acc, dash: [4, 4], single: true });
  d.brace(105, 624, 137, { label: 'the changed token and everything after it', color: C.acc });
  d.hand(320, 280, 'even unchanged words now have different context', { size: 19 });
  return d.svg();
}

export function adam_memory_ledger() {
  const d = new D(640, 260, 'adam_memory_ledger');
  d.text(10, 16, 'ADAMW MEMORY: EVERY WEIGHT HAS COMPANY', { cls: 'cap', a: 'start' });
  const count = 42128384, bytes = count * 4;
  ['weights', 'gradients', 'first moment m', 'second moment v'].forEach((label, i) => {
    const x = 16 + i * 156;
    d.rect(x, 65, 140, 90, { fill: i >= 2 ? C.accFaint : C.card, stroke: i >= 2 ? C.acc : C.ink2 });
    d.text(x + 70, 89, label, { cls: 'ttl', size: 12 });
    d.mono(x + 70, 118, '4 bytes / weight', { size: 10 });
    d.mono(x + 70, 142, `${(bytes / 2 ** 20).toFixed(3)} MiB`, { size: 12 });
  });
  d.brace(16, 624, 174, { label: `${fmtN(count)} × 16 = ${fmtN(bytes * 4)} bytes`, cls: 'mono' });
  d.hand(320, 228, 'the weights alone are only a quarter of this bill', { size: 19 });
  return d.svg();
}

export function partial_rotary_head() {
  const d = new D(640, 265, 'partial_rotary_head');
  d.text(10, 16, 'PARTIAL ROTARY: ROTATE ONLY THE CONFIGURED SLICE', { cls: 'cap', a: 'start' });
  const q = [1, 0, 0, 1, 2, 3, 4, 5], angle = Math.PI / 2;
  const rotated = q.slice();
  for (let i = 0; i < 4; i += 2) {
    rotated[i] = q[i] * Math.cos(angle) - q[i + 1] * Math.sin(angle);
    rotated[i + 1] = q[i] * Math.sin(angle) + q[i + 1] * Math.cos(angle);
  }
  [q, rotated].forEach((values, r) => {
    const y = 76 + r * 82;
    d.text(20, y + 18, r ? 'after' : 'before', { cls: 'mono', a: 'start' });
    values.forEach((v, i) => d.box(94 + i * 66, y, 58, 36, String(Math.round(v) || 0), {
      cls: 'mono', size: 14, fill: i < 4 ? C.accSoft : C.card, stroke: i < 4 ? C.acc : C.ink2,
    }));
  });
  d.brace(94, 350, 53, { dir: -1, label: '4 rotated dimensions', color: C.acc });
  d.brace(358, 614, 53, { dir: -1, label: '4 untouched dimensions' });
  d.arrow(220, 115, 220, 151, { stroke: C.acc });
  d.mono(220, 135, '90°', { size: 11, a: 'start' });
  d.arrow(486, 115, 486, 151, { stroke: C.ink2 });
  d.text(503, 135, 'copy', { cls: 'sm', a: 'start' });
  d.hand(320, 235, 'head width alone does not tell you how much to rotate', { size: 19 });
  return d.svg();
}

export function swiglu_swap_effect() {
  const d = new D(640, 295, 'swiglu_swap_effect');
  d.text(10, 16, 'SAME SHAPE, DIFFERENT ANSWER: GATE AND UP ARE NOT INTERCHANGEABLE', { cls: 'cap', a: 'start' });
  const g = -3, u = 2, silu = x => x / (1 + Math.exp(-x));
  const correct = silu(g) * u, swapped = silu(u) * g;
  [[62, g, u, correct, 'correct'], [168, u, g, swapped, 'swapped']].forEach(([y, gate, up, out, title]) => {
    d.text(16, y - 14, title, { cls: 'ttl', a: 'start' });
    d.box(16, y, 76, 38, `g = ${gate}`, { cls: 'mono', fill: C.card, size: 12 });
    d.arrow(94, y + 19, 114, y + 19, { stroke: C.ink2 });
    d.box(116, y, 162, 38, `SiLU(g) = ${silu(gate).toFixed(3)}`, { cls: 'mono', fill: C.accFaint, stroke: C.acc, size: 11 });
    d.arrow(280, y + 19, 306, y + 19, { stroke: C.ink2 });
    d.circle(322, y + 19, 28, { fill: C.paper });
    d.text(322, y + 19, '×', { size: 17 });
    d.box(366, y, 76, 38, `u = ${up}`, { cls: 'mono', fill: C.card, size: 12 });
    d.arrow(364, y + 19, 340, y + 19, { stroke: C.ink2 });
    d.carrow([[322, y + 36], [322, y + 61], [490, y + 61], [510, y + 39]], { stroke: C.acc });
    d.box(476, y, 144, 38, out.toFixed(3), { cls: 'mono', fill: C.accSoft, stroke: C.acc, size: 19 });
  });
  d.hand(320, 267, 'the tensor shape passes; the computation has changed', { size: 19 });
  return d.svg();
}

export function gqa_cache_storage() {
  const d = new D(640, 315, 'gqa_cache_storage');
  d.text(10, 16, 'CACHE THE SHARED HEADS, NOT THEIR COPIES', { cls: 'cap', a: 'start' });
  const small = 2 * 2 * 64 * 2, expanded = 2 * 8 * 64 * 2;
  d.text(20, 49, 'Finch-24, one token in one layer, 16-bit K + V', { cls: 'ttl', a: 'start' });
  d.text(20, 84, 'store 2 KV heads', { cls: 'mono', a: 'start', size: 12 });
  for (let i = 0; i < 2; i++) d.box(20 + i * 82, 104, 72, 42, `KV ${i}`, { cls: 'mono', fill: C.accSoft, stroke: C.acc });
  d.mono(20, 169, `${fmtN(small)} bytes`, { a: 'start', size: 13 });
  d.arrow(191, 125, 267, 125, { stroke: C.acc });
  d.text(230, 100, 'reuse', { cls: 'sm' });
  for (let i = 0; i < 8; i++) {
    const x = 280 + (i % 4) * 84, y = 76 + Math.floor(i / 4) * 61;
    d.box(x, y, 74, 36, `Q ${i}`, { cls: 'mono', fill: C.card });
    d.text(x + 37, y + 47, `reads KV ${Math.floor(i / 4)}`, { cls: 'sm' });
  }
  d.line(20, 217, 620, 217, { stroke: C.line });
  d.text(20, 245, 'store 8 expanded heads', { cls: 'mono', a: 'start', size: 12 });
  d.mono(620, 245, `${fmtN(expanded)} bytes = ${expanded / small}×`, { a: 'end', size: 13 });
  d.hand(320, 287, 'sharing saves memory only if the cache keeps the sharing', { size: 19 });
  return d.svg();
}

export function sdpa_eval_dropout() {
  const d = new D(640, 265, 'sdpa_eval_dropout');
  d.text(10, 16, 'SDPA DROPOUT: EVALUATION NEEDS AN EXPLICIT ZERO', { cls: 'cap', a: 'start' });
  const weights = [0.1, 0.2, 0.3, 0.4], p = 0.5;
  const dropped = weights.map((w, i) => i % 2 ? w / (1 - p) : 0);
  [[20, dropped, 'dropout_p = 0.5', 'one possible dropout draw'], [346, weights, 'dropout_p = 0.0', 'evaluation weights retained']].forEach(([x, ws, title, sub]) => {
    d.mono(x, 51, title, { a: 'start', size: 12 });
    d.text(x, 75, sub, { cls: 'sm', a: 'start' });
    d.line(x, 195, x + 268, 195, { stroke: C.ink2 });
    ws.forEach((w, i) => {
      const bx = x + 18 + i * 66, h = w * 115;
      if (w) d.rect(bx, 195 - h, 38, h, { r: 2, fill: C.accSoft, stroke: C.acc });
      d.mono(bx + 19, 195 - h - 13, w.toFixed(1), { size: 12 });
    });
  });
  d.line(320, 44, 320, 209, { stroke: C.line, dash: [3, 5], single: true });
  d.hand(320, 239, 'model.eval() does not change the argument you passed', { size: 19 });
  return d.svg();
}

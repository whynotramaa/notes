import { D, C } from '../lib/draw.js';

const toks = ['The', 'cat', 'sat', 'because', 'it', 'was', 'tired'];

function chipRow(d, y, hi = []) {
  const xs = [];
  let x = 20;
  toks.forEach((t, i) => { const w = t.length * 7 + 18; d.box(x, y, w, 26, t, { cls: 'mono', size: 10.5, fill: hi.includes(i) ? C.accSoft : C.card, stroke: hi.includes(i) ? C.acc : C.ink2, sw: 0.9, r: 5 }); xs.push(x + w / 2); x += w + 8; });
  return xs;
}

export function one_vs_two_heads() {
  const d = new D(640, 260, 'one_vs_two_heads');
  d.text(10, 16, '“IT” NEEDS TWO THINGS AT ONCE: ITS ANTECEDENT AND THE CLAUSE WORD BEFORE IT', { cls: 'cap', a: 'start' });
  const bars = (x0, title, v, cols) => {
    d.text(x0 + 130, 44, title, { cls: 'ttl' });
    const base = 190;
    d.line(x0, base, x0 + 270, base, { stroke: C.ink2, sw: 0.9 });
    ['The', 'cat', 'sat', 'bec.', 'it'].forEach((t, i) => {
      const x = x0 + 16 + i * 52;
      let y = base;
      v.forEach((w, h) => { const hh = 150 * w[i]; if (hh > 0) d.rect(x, y - hh, 34, hh, { r: 1, fill: cols[h], fop: 0.75, stroke: cols[h], sw: 0.8 }); y -= hh; });
      d.text(x + 17, base + 13, t, { cls: 'xs' });
    });
  };
  bars(14, 'one head: one budget, split', [[0.05, 0.45, 0.05, 0.4, 0.05]], [C.ink2]);
  bars(350, 'two heads: one job each', [[0.04, 0.88, 0.03, 0.02, 0.03], [0.02, 0.03, 0.04, 0.86, 0.05]], [C.acc, C.slate]);
  d.line(322, 40, 322, 216, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.text(160, 230, 'output: a muddy average of "cat" and "because"', { cls: 'xs' });
  d.text(480, 230, 'head 1 gets "cat", head 2 gets "because", both sharp', { cls: 'xs' });
  return d.svg();
}

export function head_split() {
  const d = new D(640, 250, 'head_split');
  d.text(10, 16, 'FINCH-19: ONE 512-NUMBER QUERY CUT INTO 8 HEADS OF 64', { cls: 'cap', a: 'start' });
  const x0 = 30, w = 576;
  for (let h = 0; h < 8; h++) {
    const x = x0 + h * w / 8;
    d.rect(x, 50, w / 8 - 4, 34, { r: 3, fill: h % 2 ? C.accFaint : C.accSoft, stroke: C.acc, sw: 0.9 });
    d.text(x + w / 16 - 2, 67, `head ${h}`, { cls: 'mono', size: 10 });
    d.text(x + w / 16 - 2, 98, `${h * 64} to ${h * 64 + 63}`, { cls: 'xs' });
  }
  d.brace(x0, x0 + w - 4, 112, { label: 'd_model = 512 = 8 heads × d_head 64' });
  const steps = [['q = x W_{Q}', '(B, T, 512)'], ['.view(B, T, 8, 64)', '(B, T, 8, 64)'], ['.transpose(1, 2)', '(B, 8, T, 64)']];
  steps.forEach(([op, sh], i) => {
    const x = 40 + i * 200;
    d.box(x, 160, 170, 30, op, { cls: 'mono', size: 10, fill: C.card });
    d.mono(x + 85, 206, sh, { size: 10, color: C.acc });
    if (i < 2) d.arrow(x + 172, 175, x + 198, 175, { stroke: C.ink2 });
  });
  d.hand(320, 236, 'more heads, same total width: splitting is free', { size: 15 });
  return d.svg();
}

function arcs(d, xs, y, pairs, col) {
  pairs.forEach(([from, to, w]) => {
    if (w < 0.08) return;
    const a = xs[from], b = xs[to], h = Math.max(14, Math.abs(a - b) * 0.32);
    d.path(`M${a},${y} Q${(a + b) / 2},${y - h} ${b},${y}`, { stroke: col, sw: 0.6 + 3.4 * w, rough: 0.4, single: true, op: 0.85 });
  });
}

export function head_habits() {
  const d = new D(640, 420, 'head_habits');
  d.text(10, 16, 'FOUR HABITS HEADS LEARN IN ALMOST EVERY MODEL  (ARC THICKNESS = WEIGHT)', { cls: 'cap', a: 'start' });
  const habits = [
    ['previous-token head', (i) => (i === 0 ? [[0, 0, 1]] : [[i, i - 1, 0.85]])],
    ['antecedent head', (i) => (i === 4 ? [[4, 1, 0.8]] : i === 6 ? [[6, 4, 0.5], [6, 1, 0.35]] : [])],
    ['sink head', (i) => (i > 0 ? [[i, 0, 0.7]] : [])],
    ['broad head', (i) => Array.from({ length: i + 1 }, (_, j) => [i, j, 1 / (i + 1)]).filter(() => i === 6)],
  ];
  habits.forEach(([name, f], k) => {
    const y = 90 + k * 92;
    d.text(10, y - 50, name, { cls: 'ttl', a: 'start' });
    const xs = chipRow(d, y, []);
    const pairs = toks.flatMap((_, i) => f(i));
    arcs(d, xs, y - 2, pairs, [C.acc, C.acc, C.slate, C.ink2][k]);
  });
  d.text(630, 40, 'one step back, always', { cls: 'xs', a: 'end' });
  d.text(630, 132, 'pronoun → its noun', { cls: 'xs', a: 'end' });
  d.text(630, 224, 'parks weight on token 0', { cls: 'xs', a: 'end' });
  d.text(630, 316, 'even spread: a summary', { cls: 'xs', a: 'end' });
  return d.svg();
}

export function head_matrices() {
  const d = new D(640, 230, 'head_matrices');
  d.text(10, 16, 'THE SAME FOUR HABITS AS 7 × 7 WEIGHT GRIDS  (ROWS = QUERIES)', { cls: 'cap', a: 'start' });
  const T = 7, cs = 18;
  const fns = [
    ['previous-token', (r, c) => (r === 0 ? (c === 0 ? 1 : 0) : c === r - 1 ? 0.85 : c === r ? 0.15 : 0)],
    ['antecedent', (r, c) => (c > r ? 0 : r >= 4 && c === 1 ? 0.75 : c === r ? (r >= 4 ? 0.25 : 1) : 0)],
    ['sink', (r, c) => (c > r ? 0 : r === 0 ? 1 : c === 0 ? 0.7 : 0.3 / r)],
    ['broad', (r, c) => (c > r ? 0 : 1 / (r + 1))],
  ];
  fns.forEach(([t, f], i) => {
    const x = 26 + i * 154;
    d.text(x + T * cs / 2, 42, t, { cls: 'ttl', size: 11 });
    d.grid(x, 54, T, T, cs, cs, { shade: (r, c) => f(r, c), inner: false });
  });
  d.text(320, 210, 'a line under the diagonal, a bright column at "cat", a bright first column, an even wash', { cls: 'xs' });
  return d.svg();
}

export function concat_wo() {
  const d = new D(640, 240, 'concat_wo');
  d.text(10, 16, 'CONCATENATE THE HEADS, THEN MIX THEM WITH W_O  (FINCH-19, ONE TOKEN)', { cls: 'cap', a: 'start' });
  const cols = [C.acc, C.slate, C.ink2, C.acc, C.slate, C.ink2, C.acc, C.slate];
  for (let h = 0; h < 8; h++) {
    d.rect(20 + h * 36, 50 + (h % 2) * 8, 30, 50, { r: 3, fill: cols[h], fop: 0.25, stroke: cols[h], sw: 0.9 });
    d.text(35 + h * 36, 118, `h${h}`, { cls: 'xs' });
  }
  d.text(160, 136, '8 head outputs, 64 numbers each', { cls: 'xs' });
  d.arrow(310, 80, 340, 80, { stroke: C.ink2 });
  d.text(325, 66, 'concat', { cls: 'xs' });
  for (let h = 0; h < 8; h++) d.fillRect(346 + h * 14, 64, 14, 32, cols[h], 0.35);
  d.rect(346, 64, 112, 32, { r: 2, sw: 1 });
  d.text(402, 110, '512', { cls: 'mono', size: 10 });
  d.arrow(462, 80, 486, 80, { stroke: C.ink2 });
  d.box(490, 56, 60, 48, 'W_{O}\n512 × 512', { fill: C.card, size: 10.5 });
  d.arrow(552, 80, 576, 80, { stroke: C.acc });
  d.rect(580, 64, 40, 32, { r: 2, fill: C.accSoft, stroke: C.acc, sw: 1 });
  d.text(600, 110, '512', { cls: 'mono', size: 10 });
  d.hand(420, 180, 'W_O lets what one head found\ncombine with what another found', { size: 15, vc: true });
  d.text(160, 200, 'concat alone just stacks the heads side by side', { cls: 'xs' });
  return d.svg();
}

export function head_params() {
  const d = new D(640, 220, 'head_params');
  d.text(10, 16, 'MORE HEADS, SAME PARAMETER BILL: 4 × 512² IN FINCH-19 WHATEVER H IS', { cls: 'cap', a: 'start' });
  [1, 2, 8, 16].forEach((H, k) => {
    const x0 = 24 + k * 154, s = 112;
    d.text(x0 + s / 2, 40, `H = ${H}, d_head = ${512 / H}`, { cls: 'mono', size: 10 });
    d.rect(x0, 52, s, s, { r: 2, fill: C.card, sw: 1 });
    for (let j = 1; j < H; j++) d.line(x0 + j * s / H, 52, x0 + j * s / H, 52 + s, { stroke: C.acc, sw: 0.7, single: true });
    d.text(x0 + s / 2, 52 + s + 16, 'W_{Q}: 262,144', { cls: 'xs' });
  });
  d.text(320, 206, 'each projection is cut into H column blocks; the total is 4 × 262,144 = 1,048,576 weights for any H', { cls: 'xs' });
  return d.svg();
}

export function mha_gqa_mqa() {
  const d = new D(640, 260, 'mha_gqa_mqa');
  const panel = (x0, title, nkv, sub) => {
    d.text(x0 + 95, 18, title, { cls: 'ttl' });
    d.text(x0 + 95, 36, sub, { cls: 'xs' });
    for (let h = 0; h < 8; h++) d.rect(x0 + 8 + h * 23, 60, 18, 40, { r: 3, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
    d.text(x0 + 95, 52, '8 query heads', { cls: 'xs', color: C.acc });
    const kw = 184 / nkv;
    for (let g = 0; g < nkv; g++) {
      const kx = x0 + 8 + g * kw + kw / 2 - 9;
      d.rect(kx, 170, 18, 40, { r: 3, fill: C.slateSoft, stroke: C.slate, sw: 0.9 });
      for (let h = 0; h < 8; h++) { if (Math.floor(h / (8 / nkv)) !== g) continue; d.line(x0 + 8 + h * 23 + 9, 101, kx + 9, 169, { stroke: C.line, sw: 0.8, single: true, rough: 0.4 }); }
    }
    d.text(x0 + 95, 226, `${nkv} K/V head${nkv > 1 ? 's' : ''}`, { cls: 'xs', color: C.slate });
  };
  panel(10, 'MHA', 8, 'every query head has its own K/V');
  panel(220, 'GQA', 2, 'groups of 4 share one K/V');
  panel(430, 'MQA', 1, 'all heads share one K/V');
  d.text(320, 252, 'KV cache size is proportional to the number of K/V heads: 8 : 2 : 1', { cls: 'sm' });
  return d.svg();
}

import { D, C } from '../lib/draw.js';

function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function strip(d, x, y, vals, o = {}) {
  const w = o.cw ?? 22;
  vals.forEach((v, k) => d.fillRect(x + k * w + 1, y + 1, w - 2, (o.h ?? 22) - 2, v >= 0 ? (o.pos ?? C.acc) : (o.neg ?? C.slate), Math.min(0.9, Math.abs(v) * (o.k ?? 1.6))));
  d.rect(x, y, vals.length * w, o.h ?? 22, { r: 2, sw: 0.8, stroke: o.stroke ?? C.ink2 });
}

export function shuffle_blind() {
  const d = new D(640, 250, 'shuffle_blind');
  d.text(10, 16, 'WITHOUT POSITIONS, ATTENTION SEES A BAG OF WORDS', { cls: 'cap', a: 'start' });
  const out = { dog: [0.4, -0.3, 0.5, 0.1, -0.2, 0.3], bites: [0.1, 0.5, -0.2, 0.4, 0.3, -0.1], man: [-0.3, 0.2, 0.4, -0.4, 0.1, 0.5] };
  const row = (y, words, label) => {
    d.text(10, y - 12, label, { cls: 'ttl', a: 'start' });
    words.forEach((w, i) => {
      const x = 20 + i * 200;
      d.box(x, y, 70, 26, w, { cls: 'mono', size: 11, fill: w === 'dog' ? C.accSoft : C.card, stroke: w === 'dog' ? C.acc : C.ink2, sw: 0.9, r: 5 });
      strip(d, x + 78, y + 2, out[w], { cw: 17 });
    });
  };
  row(60, ['dog', 'bites', 'man'], '“dog bites man”');
  row(150, ['man', 'bites', 'dog'], '“man bites dog”');
  d.carrow([[150, 86], [300, 116], [500, 148]], { stroke: C.acc, sw: 1, dash: [4, 4] });
  d.hand(330, 112, 'identical output for "dog"', { size: 16 });
  d.text(320, 226, 'Each strip is what attention produces for that word. Swap the order and every word gets exactly the same strip back.', { cls: 'xs' });
  return d.svg();
}

export function abs_rel() {
  const d = new D(640, 200, 'abs_rel');
  d.text(10, 16, 'TWO WAYS TO SAY WHERE A TOKEN IS', { cls: 'cap', a: 'start' });
  const words = ['The', '␠cat', '␠sat', '␠because', '␠it'];
  const xs = [];
  let x = 20;
  words.forEach((w, i) => { const wd = w.length * 7 + 22; d.box(x, 70, wd, 28, w, { cls: 'mono', size: 11, fill: i === 1 || i === 4 ? C.accSoft : C.card, stroke: i === 1 || i === 4 ? C.acc : C.ink2, sw: 0.9, r: 5 }); d.mono(x + wd / 2, 112, String(i), { size: 10, color: C.gray }); xs.push(x + wd / 2); x += wd + 8; });
  d.text(20, 136, 'absolute: "I am at position 4"', { cls: 'sm', a: 'start' });
  d.carrow([[xs[4], 66], [(xs[4] + xs[1]) / 2, 34], [xs[1], 66]], { stroke: C.acc, sw: 1.2 });
  d.hand((xs[4] + xs[1]) / 2, 30, '3 steps back', { size: 16 });
  d.text(20, 156, 'relative: "the word I need is 3 steps back"', { cls: 'sm', a: 'start', color: C.acc });
  d.hand(500, 100, 'language mostly\ncares about gaps', { size: 17, vc: true });
  return d.svg();
}

export function pos_add() {
  const d = new D(640, 230, 'pos_add');
  d.text(10, 16, 'LEARNED POSITIONS: ADD ROW i OF P TO THE TOKEN VECTOR  (FIRST 6 OF 512 NUMBERS)', { cls: 'cap', a: 'start' });
  const e = [0.12, -0.40, 0.33, 0.05, -0.21, 0.18], p = [0.02, 0.10, -0.05, 0.20, 0.07, -0.11];
  const s = e.map((v, i) => +(v + p[i]).toFixed(2));
  const row = (y, lab, vals, col) => {
    d.text(140, y + 13, lab, { cls: 'mono', size: 10.5, a: 'end' });
    vals.forEach((v, k) => { d.box(152 + k * 64, y, 58, 26, v.toFixed(2), { cls: 'mono', size: 10.5, fill: col, sw: 0.8, r: 4 }); });
  };
  row(40, 'E[8415]  (␠cat)', e, C.card);
  d.text(130, 92, '+', { size: 18 });
  row(84, 'P[1]  (position 1)', p, C.slateSoft);
  d.line(150, 122, 540, 122, { stroke: C.ink2, sw: 1, single: true });
  row(132, 'x₁', s, C.accSoft);
  d.hand(320, 196, 'the same 512 slots now carry both "what" and "where"', { size: 16 });
  return d.svg();
}

export function pos_table() {
  const d = new D(640, 260, 'pos_table');
  d.text(10, 16, 'THE POSITION TABLE P: ONE LEARNED ROW PER POSITION  (FINCH-19: 1,024 × 512)', { cls: 'cap', a: 'start' });
  const r = prng(3);
  const rows = 12, cols = 24, cw = 14, ch = 15, x0 = 60, y0 = 40;
  for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) { const v = Math.sin(i * 0.35 + k * 0.9) * 0.5 + (r() - 0.5) * 0.6; d.fillRect(x0 + k * cw + 0.5, y0 + i * ch + 0.5, cw - 1, ch - 1, v >= 0 ? C.acc : C.slate, Math.min(0.85, Math.abs(v))); }
  d.rect(x0, y0, cols * cw, rows * ch, { r: 0, sw: 1 });
  for (let i = 0; i < rows; i++) d.mono(x0 - 8, y0 + i * ch + ch / 2, String(i), { size: 8.5, a: 'end', color: i < 7 ? C.ink : C.line });
  d.text(x0 + cols * cw / 2, y0 + rows * ch + 14, '512 columns (24 drawn)', { cls: 'xs' });
  d.text(x0 - 8, y0 + rows * ch + 14, '…1023', { cls: 'xs', a: 'end' });
  const words = ['The', '␠cat', '␠sat', '␠because', '␠it', '␠was', '␠tired'];
  words.forEach((w, i) => {
    const y = y0 + i * ch + ch / 2;
    d.mono(470, y, w, { size: 9.5, a: 'start' });
    d.arrow(466, y, x0 + cols * cw + 6, y, { stroke: C.line, sw: 0.8, hl: 5 });
  });
  d.hand(520, 190, 'row 3 goes to whatever\nsits at position 3', { size: 15, vc: true });
  return d.svg();
}

export function pos_similarity() {
  const d = new D(640, 300, 'pos_similarity');
  d.text(10, 16, 'AFTER TRAINING: COSINE SIMILARITY BETWEEN LEARNED POSITION ROWS  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const n = 16, cs = 15, x0 = 170, y0 = 40;
  const r = prng(11);
  const v = (i, j) => i === j ? 1 : Math.max(0, Math.exp(-Math.abs(i - j) / 3.2) + (r() - 0.5) * 0.08);
  const M = []; for (let i = 0; i < n; i++) { M.push([]); for (let j = 0; j < n; j++) M[i].push(j < i ? M[j][i] : v(i, j)); }
  d.grid(x0, y0, n, n, cs, cs, { shade: (i, j) => M[i][j], inner: false });
  [0, 5, 10, 15].forEach((i) => { d.mono(x0 - 6, y0 + i * cs + cs / 2, String(i), { size: 8.5, a: 'end' }); d.mono(x0 + i * cs + cs / 2, y0 - 7, String(i), { size: 8.5 }); });
  d.rect(x0 - 1, y0 + 8 * cs - 1, n * cs + 2, cs + 2, { r: 2, stroke: C.acc, sw: 1.3 });
  d.text(x0 + n * cs / 2, y0 + n * cs + 16, 'position j', { cls: 'xs' });
  d.text(x0 - 30, y0 + n * cs / 2, 'position i', { cls: 'xs', rot: -90 });
  d.hand(430, 150, 'row 8: brightest at 8,\nfading smoothly to 2 and 14', { size: 15, vc: true, a: 'start' });
  d.hand(430, 220, 'nobody asked for this:\nthe model discovered "nearby"', { size: 15, vc: true, a: 'start', color: C.gray });
  return d.svg();
}

export function pos_wall() {
  const d = new D(640, 200, 'pos_wall');
  d.text(10, 16, 'THE MAXIMUM-LENGTH WALL: POSITION 1,024 HAS NO ROW TO FETCH', { cls: 'cap', a: 'start' });
  for (let i = 0; i < 16; i++) {
    const x = 20 + i * 38, beyond = i >= 12;
    d.rect(x, 70, 32, 32, { r: 4, fill: beyond ? C.paper : C.card, stroke: beyond ? C.red : C.ink2, sw: 0.9, dash: beyond ? [3, 3] : undefined });
    d.mono(x + 16, 116, String(1012 + i), { size: 8, color: beyond ? C.red : C.gray });
    if (beyond) { d.line(x + 8, 78, x + 24, 94, { stroke: C.red, sw: 1.2, single: true }); d.line(x + 24, 78, x + 8, 94, { stroke: C.red, sw: 1.2, single: true }); }
  }
  d.line(20 + 12 * 38 - 3, 52, 20 + 12 * 38 - 3, 126, { stroke: C.red, sw: 2, single: true });
  d.text(20 + 12 * 38 - 9, 46, 'end of P (row 1,023)', { cls: 'xs', a: 'end', color: C.red });
  d.hand(200, 160, 'trained positions 0 to 1,023', { size: 16, color: C.gray });
  d.hand(540, 160, 'no rows here', { size: 16, color: C.red });
  return d.svg();
}

export function same_relation() {
  const d = new D(640, 220, 'same_relation');
  d.text(10, 16, 'THE SAME PAIR AT TWO PLACES GETS UNRELATED POSITION VECTORS', { cls: 'cap', a: 'start' });
  const r = prng(29);
  const rv = () => Array.from({ length: 8 }, () => (r() - 0.5) * 1.1);
  [[2, 3, 40], [102, 103, 130]].forEach(([a, b, y]) => {
    d.box(20, y, 56, 26, 'the', { cls: 'mono', size: 11, fill: C.card, sw: 0.9, r: 5 });
    d.box(82, y, 56, 26, '␠cat', { cls: 'mono', size: 11, fill: C.card, sw: 0.9, r: 5 });
    d.mono(48, y + 40, `pos ${a}`, { size: 9, color: C.gray });
    d.mono(110, y + 40, `pos ${b}`, { size: 9, color: C.gray });
    d.text(170, y + 13, 'P[' + a + ']', { cls: 'mono', size: 10, a: 'start' });
    strip(d, 230, y + 2, rv(), { cw: 18, pos: C.slate, neg: C.acc });
    d.text(400, y + 13, 'P[' + b + ']', { cls: 'mono', size: 10, a: 'start' });
    strip(d, 460, y + 2, rv(), { cw: 18, pos: C.slate, neg: C.acc });
  });
  d.hand(320, 206, 'gap = 1 both times, but nothing in common: "the then cat" is learned separately at every offset', { size: 15 });
  return d.svg();
}

export function pos_injection() {
  const d = new D(640, 290, 'pos_injection');
  d.text(10, 16, 'THREE POSITION SCHEMES, THREE INJECTION POINTS', { cls: 'cap', a: 'start' });
  const col = (x, title, sub, where) => {
    d.text(x + 95, 40, title, { cls: 'ttl' });
    d.text(x + 95, 56, sub, { cls: 'xs' });
    d.box(x + 30, 226, 130, 30, 'token embedding', { fill: C.card, size: 10.5 });
    d.box(x + 30, 110, 130, 76, 'attention\n(q, k, v)', { fill: where === 'attn' ? C.accSoft : C.card, stroke: where === 'attn' ? C.acc : C.ink2, size: 11 });
    d.arrow(x + 95, 224, x + 95, 188, { stroke: C.ink2 });
    if (where === 'bottom') {
      d.circle(x + 95, 205, 18, { fill: C.accSoft, stroke: C.acc }); d.text(x + 95, 205, '+', { color: C.acc });
      d.arrow(x + 168, 205, x + 106, 205, { stroke: C.acc });
      d.text(x + 150, 192, sub.includes('learned') ? 'P[i]' : 'PE(i)', { cls: 'mono', size: 10, color: C.acc });
    } else {
      d.hand(x + 95, 92, 'rotate q, k by i', { size: 15 });
    }
  };
  col(10, 'Learned (Part III)', 'learned table, added once', 'bottom');
  col(220, 'Sinusoidal (Part IV)', 'fixed formula, added once', 'bottom');
  col(430, 'RoPE (Part V)', 'rotation inside every layer', 'attn');
  d.line(213, 34, 213, 270, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.line(423, 34, 423, 270, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  return d.svg();
}

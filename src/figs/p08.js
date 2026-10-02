import { D, C } from '../lib/draw.js';

const toks = ['The', '␠cat', '␠sat', '␠because', '␠it', '␠was', '␠tired'];

export function cheat() {
  const d = new D(640, 200, 'cheat');
  d.text(10, 16, 'WITHOUT A MASK, “CAT” CAN READ THE ANSWER IT IS SUPPOSED TO PREDICT', { cls: 'cap', a: 'start' });
  const xs = [];
  let x = 20;
  toks.slice(0, 5).forEach((t, i) => { const w = t.length * 7.2 + 22; d.box(x, 100, w, 30, t, { cls: 'mono', size: 11, fill: i === 1 ? C.accSoft : i === 2 ? C.paper : C.card, stroke: i === 1 ? C.acc : i === 2 ? C.red : C.ink2, sw: 1, r: 5 }); xs.push(x + w / 2); x += w + 10; });
  d.carrow([[xs[1], 96], [(xs[1] + xs[2]) / 2, 60], [xs[2], 96]], { stroke: C.red, sw: 1.4 });
  d.hand((xs[1] + xs[2]) / 2 + 30, 50, 'peek!', { size: 18, color: C.red });
  d.box(xs[1] - 50, 150, 100, 28, 'target: ␠sat', { cls: 'mono', size: 10, fill: C.paper, stroke: C.ink2, r: 5 });
  d.arrow(xs[1], 132, xs[1], 148, { stroke: C.ink2, hl: 5 });
  d.hand(470, 120, 'training loss ≈ 0,\nmodel learns nothing', { size: 16, vc: true, color: C.red });
  return d.svg();
}

export function shift_targets() {
  const d = new D(640, 290, 'shift_targets');
  d.text(10, 16, 'ONE FORWARD PASS, SEVEN PREDICTIONS: TARGETS ARE THE INPUT SHIFTED LEFT BY ONE', { cls: 'cap', a: 'start' });
  const all = [...toks, '.'];
  const w = 72, x0 = 70;
  d.text(60, 92, 'input', { cls: 'sm', a: 'end' });
  d.text(60, 202, 'target', { cls: 'sm', a: 'end' });
  for (let i = 0; i < 7; i++) {
    const x = x0 + i * (w + 6);
    d.box(x, 78, w, 28, all[i], { cls: 'mono', size: 10.5, fill: i <= 3 ? C.accFaint : C.card, stroke: i <= 3 ? C.acc : C.ink2, sw: 0.9, r: 5 });
    d.mono(x + w / 2, 118, String(i), { size: 9, color: C.gray });
    d.arrow(x + w / 2, 128, x + w / 2, 184, { stroke: i === 3 ? C.acc : C.line, sw: i === 3 ? 1.3 : 0.8 });
    d.box(x, 188, w, 28, all[i + 1], { cls: 'mono', size: 10.5, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, sw: 0.9, r: 5 });
  }
  d.brace(x0, x0 + 4 * (w + 6) - 6, 64, { dir: -1, label: 'position 3 sees these four tokens', color: C.acc });
  d.text(x0 + 3 * (w + 6) + w / 2, 232, 'and must predict ␠it', { cls: 'sm', color: C.acc });
  d.hand(330, 270, 'every position is its own guessing exercise, all computed at once', { size: 15 });
  return d.svg();
}

const S6 = [[1.2, 0.3, 2.0, -0.5, 0.8, 0.1], [0.7, 1.5, 0.2, 1.1, -0.3, 0.9], [0.4, 2.1, 0.9, 0.6, 1.7, 0.2], [0.1, 0.8, 1.6, 1.0, 0.4, 1.3], [0.9, 0.2, 0.5, 1.8, 0.7, 0.6], [0.3, 1.9, 0.4, 0.2, 1.1, 1.5]];

export function mask_build() {
  const d = new D(640, 270, 'mask_build');
  d.text(10, 16, 'SCORES + CAUSAL MASK → ROW-WISE SOFTMAX  (6 TOKENS, ILLUSTRATIVE SCORES)', { cls: 'cap', a: 'start' });
  const T = 6, cs = 26;
  const panel = (x, title, fn, shade, col) => {
    d.text(x + T * cs / 2, 40, title, { cls: 'ttl', size: 11 });
    d.grid(x, 54, T, T, cs, cs, { val: fn, vsize: 8.6, shade, color: col, lsw: 0.5, vcolor: (r, c, s) => (s > 0.55 ? C.onAcc : C.ink) });
  };
  panel(20, 'raw scores', (r, c) => S6[r][c].toFixed(1), () => 0, C.acc);
  d.text(189, 132, '+', { size: 18 });
  panel(206, 'causal mask M', (r, c) => (c > r ? '−∞' : '0'), (r, c) => (c > r ? 0.85 : 0), C.ink2);
  d.text(375, 132, '→', { size: 18 });
  const W = S6.map((row, r) => { const e = row.map((v, c) => (c > r ? 0 : Math.exp(v))); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); });
  panel(392, 'softmax, each row', (r, c) => (c > r ? '0' : W[r][c].toFixed(2).replace(/^0/, '')), (r, c) => (c > r ? 0 : W[r][c]), C.acc);
  d.text(20, 230, 'row = query (the token asking), column = key (the token looked at)', { cls: 'xs', a: 'start' });
  d.text(20, 246, 'upper triangle = the future', { cls: 'xs', a: 'start' });
  d.hand(520, 238, 'each row sums to 1\nand only looks back', { size: 15, vc: true });
  return d.svg();
}

export function mask_order() {
  const d = new D(640, 260, 'mask_order');
  d.text(10, 16, 'ROW “SAT”: MASK BEFORE SOFTMAX VERSUS SOFTMAX THEN ZERO', { cls: 'cap', a: 'start' });
  const names = ['The', 'cat', 'sat', 'bec.'];
  const right = [0.253, 0.319, 0.428, 0], wrong = [0.191, 0.240, 0.322, 0];
  const panel = (x0, title, v, ok, sum) => {
    d.text(x0 + 130, 44, title, { cls: 'ttl', color: ok ? C.ink : C.red });
    const base = 190;
    d.line(x0, base, x0 + 260, base, { stroke: C.ink2, sw: 0.9 });
    v.forEach((w, i) => {
      const x = x0 + 16 + i * 62, h = 260 * w;
      if (w > 0) d.rect(x, base - h, 40, h, { r: 2, fill: ok ? C.acc : C.faint, fs: ok ? 'hachure' : 'solid', gap: 3.4, stroke: ok ? C.acc : C.red, sw: 0.9 });
      else d.text(x + 20, base - 10, i === 3 ? 'hidden' : '', { cls: 'xs' });
      d.mono(x + 20, base - h - 9, w ? w.toFixed(3) : '', { size: 9.5 });
      d.text(x + 20, base + 13, names[i], { cls: 'xs' });
    });
    d.mono(x0 + 130, 226, `sum = ${sum}`, { size: 11, color: ok ? C.ink : C.red });
  };
  panel(14, 'right: mask, then softmax', right, true, '1.000');
  panel(350, 'wrong: softmax, then zero', wrong, false, '0.753');
  d.line(322, 40, 322, 236, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.hand(470, 252, '24.7% of the weight was spent on a hidden token', { size: 14, color: C.red });
  return d.svg();
}

export function causality_test() {
  const d = new D(640, 230, 'causality_test');
  d.text(10, 16, 'THE CAUSALITY TEST: CHANGE THE LAST WORD, EARLIER OUTPUTS MUST NOT MOVE', { cls: 'cap', a: 'start' });
  const rows = [['…it was ␠tired', 0], ['…it was ␠hungry', 1]];
  rows.forEach(([lab, k], r) => {
    const y = 50 + r * 76;
    d.text(10, y - 6, lab, { cls: 'mono', size: 10, a: 'start' });
    for (let i = 0; i < 7; i++) {
      const x = 20 + i * 86, last = i === 6;
      const seed = last ? 3 + k * 5 : i;
      for (let c = 0; c < 6; c++) d.fillRect(x + c * 12 + 1, y + 4, 11, 22, (Math.sin(seed * 1.7 + c * 2.3) > 0) ? C.acc : C.slate, 0.2 + 0.6 * Math.abs(Math.sin(seed * 2.9 + c * 1.1)));
      d.rect(x, y + 3, 74, 24, { r: 2, sw: 0.8, stroke: last && k ? C.acc : C.ink2 });
      if (r === 1) d.text(x + 37, y + 44, last ? 'changed (fine)' : 'same ✓', { cls: 'xs', color: last ? C.acc : C.gray });
    }
  });
  d.hand(320, 214, 'if any earlier strip changes, information is leaking from the future', { size: 15, color: C.red });
  return d.svg();
}

export function mask_combined() {
  const d = new D(640, 230, 'mask_combined');
  d.text(10, 16, 'CAUSAL AND PADDING MASKS COMBINE BY “AND”: ALLOWED ONLY IF BOTH ALLOW', { cls: 'cap', a: 'start' });
  const T = 6, cs = 22;
  const panel = (x, title, ok) => {
    d.text(x + T * cs / 2, 42, title, { cls: 'ttl', size: 11 });
    d.grid(x, 56, T, T, cs, cs, { cellFill: (r, c) => (ok(r, c) ? C.accSoft : C.faint), lsw: 0.4 });
  };
  panel(40, 'causal', (r, c) => c <= r);
  d.text(196, 122, 'AND', { cls: 'mono', size: 11 });
  panel(232, 'padding (last 2 are pad)', (r, c) => c < 4);
  d.text(388, 122, '=', { size: 16 });
  panel(424, 'combined', (r, c) => c <= r && c < 4);
  d.text(320, 210, 'orange = may attend. Pad columns are hidden from everyone; pad rows are dropped from the loss.', { cls: 'xs' });
  return d.svg();
}

export function mask_families() {
  const d = new D(640, 230, 'mask_families');
  d.text(10, 16, 'THREE MASK SHAPES, THREE MODEL FAMILIES', { cls: 'cap', a: 'start' });
  const T = 7, cs = 20;
  [['encoder (BERT)', () => true, 'sees everything'], ['decoder (GPT, Llama)', (r, c) => c <= r, 'sees only the past'], ['prefix LM (T5-style)', (r, c) => c <= r || c < 3, 'prompt sees itself fully']].forEach(([t, ok, sub], i) => {
    const x = 40 + i * 205;
    d.text(x + T * cs / 2, 42, t, { cls: 'ttl', size: 11 });
    d.grid(x, 56, T, T, cs, cs, { cellFill: (r, c) => (ok(r, c) ? (i === 1 ? C.accSoft : C.slateSoft) : C.faint), lsw: 0.4 });
    d.text(x + T * cs / 2, 56 + T * cs + 18, sub, { cls: 'xs' });
  });
  return d.svg();
}

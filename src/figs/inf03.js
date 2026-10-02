import { D, C } from '../lib/draw.js';

const PM = 7504924672, KV = 131072, BW = 3.35e12, PEAK = 989.4e12;

export function inf_fused_vs_manual() {
  const d = new D(640, 250, 'inf_fused_vs_manual');
  d.text(10, 16, 'HAND-WRITTEN ATTENTION vs ONE FUSED KERNEL: TRIPS TO GPU MEMORY', { cls: 'cap', a: 'start' });
  d.text(20, 44, 'by hand: five kernels', { cls: 'ttl', a: 'start', size: 11 });
  const ops = ['Q Kᵀ', 'scale', 'mask', 'softmax', '× V'];
  ops.forEach((o, i) => {
    const x = 30 + i * 118;
    d.box(x, 58, 84, 30, o, { cls: 'mono', size: 10, fill: C.card });
    if (i < 4) {
      d.arrow(x + 42, 90, x + 42, 122, { stroke: C.red, hl: 5, sw: 0.9 });
      d.arrow(x + 76, 122, x + 160, 90, { stroke: C.red, hl: 5, sw: 0.9 });
    }
  });
  d.rect(20, 124, 600, 26, { fill: C.slateSoft, stroke: C.slate, r: 4 });
  d.text(320, 137, 'HBM: a T × T score matrix written and read back four times', { cls: 'xs', color: C.ink });
  d.text(20, 182, 'fused (SDPA / FlashAttention): one kernel', { cls: 'ttl', a: 'start', size: 11 });
  d.rect(30, 194, 470, 34, { fill: C.accSoft, stroke: C.acc, r: 6 });
  d.text(265, 211, 'Q Kᵀ → scale → mask → softmax → × V, scores stay on the chip', { cls: 'mono', size: 9.5 });
  d.mono(560, 204, 'read Q, K, V', { size: 9.5, color: C.acc });
  d.mono(560, 220, 'write O', { size: 9.5, color: C.acc });
  return d.svg();
}

export function inf_flash_decoding() {
  const d = new D(640, 300, 'inf_flash_decoding');
  d.text(10, 16, 'ONE QUERY, A LONG CACHE: WHO DOES THE READING?', { cls: 'cap', a: 'start' });
  const bx = (i) => 100 + i * 58;
  d.text(20, 46, 'FlashAttention at decode', { cls: 'ttl', a: 'start' });
  d.box(20, 64, 56, 28, 'q', { cls: 'mono', fill: C.accSoft, stroke: C.acc });
  for (let i = 0; i < 8; i++) d.box(bx(i), 64, 52, 28, `K,V ${i}`, { cls: 'mono', size: 9.5, fill: C.slateSoft, stroke: C.slate, r: 3 });
  for (let i = 0; i < 7; i++) d.carrow([[bx(i) + 30, 62], [bx(i) + 55, 52], [bx(i + 1) + 22, 62]], { stroke: C.ink2, sw: 0.8, hl: 5 });
  d.text(330, 108, 'one processor walks all 8 blocks in turn; the rest of the GPU waits', { cls: 'xs' });
  d.text(20, 146, 'Flash-Decoding', { cls: 'ttl', a: 'start' });
  d.box(20, 170, 56, 28, 'q', { cls: 'mono', fill: C.accSoft, stroke: C.acc });
  for (let g = 0; g < 4; g++) {
    const cx = bx(2 * g) + 55;
    d.text(cx, 158, `processor ${g + 1}`, { cls: 'xs', color: C.acc });
    for (let i = 0; i < 2; i++) d.box(bx(2 * g + i), 170, 52, 28, `K,V ${2 * g + i}`, { cls: 'mono', size: 9.5, fill: C.slateSoft, stroke: C.slate, r: 3 });
    d.arrow(cx, 200, cx, 214, { stroke: C.ink2, hl: 5 });
    d.box(cx - 44, 216, 88, 24, 'm, ℓ, o', { cls: 'mono', size: 10, fill: C.card, r: 4 });
    d.line(cx, 240, 320, 262, { stroke: C.ink2, sw: 0.8, single: true });
  }
  d.box(250, 262, 140, 28, 'merge → exact o', { fill: C.accSoft, stroke: C.acc, size: 10.5 });
  d.hand(530, 278, 'same answer, all at once', { size: 15 });
  return d.svg();
}

export function inf_online_merge() {
  const d = new D(640, 270, 'inf_online_merge');
  d.text(10, 16, 'MERGING TWO PARTIAL SOFTMAX RESULTS, NUMBERS FROM SECTION 7', { cls: 'cap', a: 'start' });
  const chunk = (x, title, lines) => {
    d.rect(x, 34, 270, 104, { fill: C.card, sw: 1, r: 8 });
    d.text(x + 14, 50, title, { cls: 'ttl', a: 'start' });
    lines.forEach((l, i) => d.mono(x + 14, 72 + i * 20, l, { size: 10, a: 'start', color: i === 3 ? C.acc : C.ink }));
  };
  chunk(30, 'chunk 1: positions 0, 1', ['scores 1.4142, 0.7071', 'values [1, 2], [3, 0]', 'm_{1} = 1.4142   ℓ_{1} = 1.4931', 'o_{1} = [1.6605, 1.3395]']);
  chunk(340, 'chunk 2: positions 2, 3', ['scores 2.1213, 0.7071', 'values [0, 4], [2, 2]', 'm_{2} = 2.1213   ℓ_{2} = 1.2431', 'o_{2} = [0.3911, 3.6089]']);
  d.arrow(165, 140, 250, 168, { stroke: C.ink2 });
  d.arrow(475, 140, 390, 168, { stroke: C.ink2 });
  d.rect(90, 170, 460, 66, { fill: C.accFaint, stroke: C.acc, sw: 1.1, r: 8 });
  d.mono(320, 188, 'm = 2.1213   a_{1} = 1.4931 · e^{−0.7071} = 0.7362   a_{2} = 1.2431', { size: 10 });
  d.mono(320, 214, 'o = (0.7362 o_{1} + 1.2431 o_{2}) / 1.9793 = [0.8633, 2.7648]', { size: 10.5, color: C.acc });
  d.text(320, 256, 'single pass over all four positions (Section 7): [0.8633, 2.7648]', { cls: 'xs' });
  return d.svg();
}

export function inf_batch_tradeoff() {
  const d = new D(640, 280, 'inf_batch_tradeoff');
  d.text(10, 16, 'LLAMA 3 8B DECODE, ONE H100, CONTEXT 2,048: LOWER BOUND FROM DATASHEET PEAKS', { cls: 'cap', a: 'start' });
  const step = (B) => Math.max((2 * PM + B * KV * 2048) / BW, B * (2 * PM + 4 * 32 * 32 * 128 * 2048) / PEAK);
  const M = d.axes(80, 44, 440, 170, { xmin: 0, xmax: 250, ymin: 0, ymax: 11000, xl: 'batch size', yl: 'total tokens/s' });
  const R = (v) => M.Y(v / 250 * 11000);
  d.line(520, M.Y(0), 520, 44, { stroke: C.slate, sw: 0.8, single: true });
  [0, 50, 100, 150, 200, 250].forEach((v) => d.text(526, R(v), String(v), { cls: 'xs', a: 'start', color: C.slate }));
  d.text(560, 34, 'tokens/s per user', { cls: 'xs', color: C.slate });
  [0, 2500, 5000, 7500, 10000].forEach((v) => d.text(74, M.Y(v), v.toLocaleString('en-US'), { cls: 'xs', a: 'end' }));
  [1, 64, 128, 238].forEach((b) => d.text(M.X(b), M.Y(0) + 14, String(b), { cls: 'xs' }));
  const tot = [], per = [];
  for (let B = 1; B <= 238; B += 1) { const t = step(B); tot.push([M.X(B), M.Y(B / t)]); per.push([M.X(B), R(1 / t)]); }
  d.lines(tot, { stroke: C.acc, sw: 1.8, rough: 0.3, single: true });
  d.lines(per, { stroke: C.slate, sw: 1.6, rough: 0.3, single: true });
  [[1, 'start'], [64, 'start'], [238, 'end']].forEach(([B, a]) => {
    const t = step(B);
    d.dot(M.X(B), M.Y(B / t), 3.5, C.acc);
    d.mono(M.X(B) + (a === 'start' ? 6 : -6), M.Y(B / t) - 10, Math.round(B / t).toLocaleString('en-US'), { size: 9.5, a, color: C.acc });
    d.dot(M.X(B), R(1 / t), 3.5, C.slate);
    d.mono(M.X(B) + (a === 'start' ? 6 : -6), R(1 / t) + (B === 1 ? 12 : -10), String(Math.round(1 / t)), { size: 9.5, a, color: C.slate });
  });
  d.line(M.X(238), M.Y(0), M.X(238), 44, { stroke: C.ink2, dash: [4, 3], sw: 0.9, single: true });
  d.text(M.X(238) - 4, 52, '80 GB full', { cls: 'xs', a: 'end' });
  d.hand(260, 264, 'more users: more total, slower each', { size: 15 });
  return d.svg();
}

export function inf_shared_vs_private() {
  const d = new D(640, 250, 'inf_shared_vs_private');
  d.text(10, 16, 'BATCHED DECODE: WEIGHTS ARE SHARED, CACHES ARE NOT', { cls: 'cap', a: 'start' });
  d.box(240, 40, 160, 44, 'weights: read once\nfor the whole batch', { size: 10.5, fill: C.accSoft, stroke: C.acc });
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 150;
    d.chips(x + 30, 130, [`user ${i + 1}`], { h: 24, size: 10, width: 70 });
    d.line(320, 86, x + 65, 128, { stroke: C.acc, sw: 1, single: true });
    d.rect(x + 10, 180, 110, 40, { fill: C.slateSoft, stroke: C.slate, r: 4 });
    d.text(x + 65, 200, `own KV cache`, { cls: 'xs', color: C.ink });
    d.arrow(x + 65, 178, x + 65, 158, { stroke: C.slate, hl: 5 });
  }
  d.text(320, 238, 'one weight read serves every user; each cache is read for one user only', { cls: 'xs' });
  return d.svg();
}

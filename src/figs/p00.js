import { D, C } from '../lib/draw.js';

function dots(d, w, h) {
  let s = '';
  for (let y = 30; y < h; y += 25) for (let x = 25; x < w; x += 25) s += `<circle cx="${x}" cy="${y}" r="0.9" style="fill:var(--f-faint)"/>`;
  d.raw(s);
}

export function cover_attn() {
  const d = new D(750, 975, 'cover_attn');
  dots(d, 750, 975);
  d.text(62, 92, 'A HAND-DRAWN FIELD GUIDE  /  OCTLM UNIT I', { cls: 'cap', a: 'start', size: 10, color: C.acc });
  d.text(58, 158, 'Inside', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.text(58, 230, 'Attention', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.hl(60, 252, 360, 252, { th: 9, op: 0.35 });
  d.text(62, 292, 'How a decoder-only Transformer reads a sentence', { a: 'start', size: 16, color: C.ink2 });
  d.text(62, 314, 'and guesses the next token, from zero.', { a: 'start', size: 16, color: C.ink2 });
  const cx = 470;
  const bars = [0.18, 0.32, 0.12, 0.9, 0.22, 0.4, 0.15, 0.27, 0.1];
  bars.forEach((b, i) => {
    const x = cx - 150 + i * 34, h = b * 70;
    d.rect(x, 440 - h, 22, h, { r: 2, fill: i === 3 ? C.acc : C.faint, fs: i === 3 ? 'hachure' : 'solid', gap: 3.5, stroke: i === 3 ? C.acc : C.ink2, sw: 0.9 });
  });
  d.line(cx - 160, 441, cx + 160, 441, { stroke: C.ink2, sw: 0.9 });
  d.hand(cx + 120, 352, 'next token!', { a: 'start', size: 22 });
  d.carrow([[cx + 128, 362], [cx + 80, 372], [cx - 25, 368]], { stroke: C.acc, sw: 1.1 });
  d.arrow(cx, 492, cx, 452, { stroke: C.ink2 });
  d.box(cx - 90, 492, 180, 34, 'LM head + softmax', { fill: C.card, sw: 1 });
  d.arrow(cx, 556, cx, 528, { stroke: C.ink2 });
  for (let k = 2; k >= 0; k--) {
    const y = 560 + k * 14, x = cx - 140 + k * 10;
    d.rect(x, y, 280, 120, { fill: k === 0 ? C.paper : C.card, sw: 1 });
  }
  const by = 560;
  d.text(cx - 125, by + 18, 'DECODER BLOCK', { cls: 'cap', a: 'start' });
  d.box(cx - 120, by + 36, 70, 30, 'norm', { size: 11, sw: 0.9 });
  d.box(cx - 38, by + 36, 86, 30, 'attention', { fill: C.accSoft, stroke: C.acc, size: 11 });
  d.box(cx + 60, by + 36, 50, 30, 'MLP', { size: 11, sw: 0.9 });
  d.circle(cx + 125, by + 51, 16, { sw: 0.9 }); d.text(cx + 125, by + 51, '+', { size: 13 });
  d.line(cx - 130, by + 95, cx + 125, by + 95, { stroke: C.acc, sw: 1.4 });
  d.arrow(cx + 125, by + 95, cx + 125, by + 60, { stroke: C.acc, sw: 1.2 });
  d.text(cx - 128, by + 108, 'residual stream', { cls: 'sm', a: 'start' });
  d.hand(cx + 160, by + 150, '× N layers', { a: 'start', size: 21 });
  d.arrow(cx, 760, cx, 715, { stroke: C.ink2 });
  for (let j = 0; j < 4; j++) {
    const x = cx - 95 + j * 52;
    for (let r = 0; r < 5; r++) d.fillRect(x + 1, 765 + r * 15 + 1, 32, 13, C.acc, 0.12 + 0.6 * Math.abs(Math.sin(j * 3.1 + r * 1.7)) * 0.7);
    d.rect(x, 765, 34, 75, { r: 3, sw: 0.9 });
  }
  d.hand(cx + 120, 800, 'vectors', { a: 'start', size: 20 });
  const toks = ['The', 'cat', 'sat', 'it'];
  toks.forEach((t, j) => { const x = cx - 95 + j * 52; d.arrow(x + 17, 880, x + 17, 846, { stroke: C.gray, sw: 0.9, hl: 6 }); });
  d.chips(cx - 99, 884, toks, { width: 42, h: 26 });
  d.hand(cx + 120, 897, 'tokens', { a: 'start', size: 20 });
  d.text(62, 940, 'CHAPTER 1  /  THE CLASSIC DECODER, PIECE BY PIECE', { cls: 'cap', a: 'start', size: 9.5 });
  d.hand(70, 470, 'one job:', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 500, 'guess what', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 530, 'comes next.', { a: 'start', size: 24, color: C.ink2 });
  d.carrow([[175, 545], [210, 600], [300, 615]], { stroke: C.gray, sw: 1 });
  return d.svg();
}

export function cover_modern() {
  const d = new D(750, 975, 'cover_modern');
  dots(d, 750, 975);
  d.text(62, 92, 'A HAND-DRAWN FIELD GUIDE  /  OCTLM UNIT II', { cls: 'cap', a: 'start', size: 10, color: C.acc });
  d.text(58, 158, 'The Modern', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.text(58, 230, 'Block', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.hl(60, 252, 230, 252, { th: 9, op: 0.35 });
  d.text(62, 292, 'From the 2019 GPT-2 layer to the 2024 Llama 3 layer,', { a: 'start', size: 16, color: C.ink2 });
  d.text(62, 314, 'one upgrade at a time.', { a: 'start', size: 16, color: C.ink2 });
  const cx = 600, side = 330, sw = 150, sx = side + sw / 2;
  d.rect(300, 380, 340, 470, { fill: C.card, sw: 1.1, r: 12 });
  d.text(316, 400, 'MODERN DECODER BLOCK', { cls: 'cap', a: 'start' });
  d.line(cx, 840, cx, 420, { stroke: C.acc, sw: 2.4 });
  d.head(cx, 420, -Math.PI / 2, { stroke: C.acc, sw: 1.8, hl: 11 });
  const step = (y, label) => d.box(side, y, sw, 34, label, { fill: C.accSoft, stroke: C.acc, size: 11.5, sw: 1 });
  step(780, 'RMSNorm');
  step(724, 'q, k, v  (GQA)');
  step(668, 'RoPE on q, k');
  step(612, 'SDPA / Flash');
  step(530, 'RMSNorm');
  step(474, 'SwiGLU MLP');
  [780, 724, 668].forEach((y) => d.arrow(sx, y - 2, sx, y - 20, { stroke: C.ink2, sw: 0.9, hl: 6 }));
  d.arrow(sx, 528, sx, 510, { stroke: C.ink2, sw: 0.9, hl: 6 });
  d.circle(cx, 590, 20, { fill: C.paper, sw: 1 }); d.text(cx, 590, '+', { size: 13 });
  d.circle(cx, 452, 20, { fill: C.paper, sw: 1 }); d.text(cx, 452, '+', { size: 13 });
  d.carrow([[cx, 826], [cx - 50, 812], [side + sw + 2, 797]], { stroke: C.gray, sw: 0.9 });
  d.carrow([[sx, 612], [sx + 60, 592], [cx - 12, 590]], { stroke: C.ink2, sw: 0.9 });
  d.carrow([[cx, 572], [cx - 50, 556], [side + sw + 2, 547]], { stroke: C.gray, sw: 0.9 });
  d.carrow([[sx, 474], [sx + 60, 456], [cx - 12, 452]], { stroke: C.ink2, sw: 0.9 });
  d.text(590, 700, 'residual\nstream', { cls: 'sm', a: 'end', vc: true });
  d.hand(470, 885, '× 32 of these in Llama 3 8B', { size: 21 });
  d.text(62, 940, 'CHAPTER 2  /  EVERY UPGRADE, COUNTED AND CODED', { cls: 'cap', a: 'start', size: 9.5 });
  d.hand(70, 470, 'same skeleton,', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 500, 'better parts.', { a: 'start', size: 24, color: C.ink2 });
  d.carrow([[175, 520], [220, 600], [side - 6, 640]], { stroke: C.gray, sw: 1 });
  return d.svg();
}

export function where_attn(stage) {
  const d = new D(640, 330, 'where_attn' + stage);
  const on = (keys) => stage === 99 || keys.includes(stage);
  const st = (keys) => on(keys) ? { fill: C.accSoft, stroke: C.acc, sw: 1.3 } : { fill: C.paper, stroke: C.line, sw: 0.9 };
  const tc = (keys) => on(keys) ? C.ink : C.gray;
  const ln = (keys) => on(keys) ? C.acc : C.line;
  d.text(10, 14, 'YOU ARE HERE', { cls: 'cap', a: 'start', color: C.acc });
  d.text(52, 56, '"raw text"', { cls: 'mono', size: 11, color: tc([1]) });
  d.arrow(92, 56, 112, 56, { stroke: C.line });
  d.box(114, 38, 110, 36, 'tokenizer', { ...st([1]), tc: tc([1]) });
  d.arrow(224, 56, 246, 56, { stroke: C.line });
  d.box(248, 38, 120, 36, 'embeddings', { ...st([2]), tc: tc([2]) });
  d.arrow(368, 56, 390, 56, { stroke: C.line });
  d.box(392, 38, 150, 36, '+ positions', { ...st([3, 4, 5]), tc: tc([3, 4, 5]) });
  [['learned', 3, 425], ['waves', 4, 467], ['RoPE', 5, 506]].forEach(([t, k, x]) => d.text(x, 86, t, { cls: 'mono', size: 9, color: on([k]) ? C.acc : C.line }));
  d.carrow([[542, 56], [592, 64], [604, 98]], { stroke: C.line });
  const blockOn = on([12]);
  d.rect(20, 102, 600, 124, { stroke: blockOn ? C.acc : C.line, sw: blockOn ? 1.4 : 1, r: 10 });
  d.text(32, 118, 'DECODER BLOCK', { cls: 'cap', a: 'start', color: blockOn ? C.acc : C.gray });
  d.hand(588, 120, '× N', { size: 20, color: blockOn ? C.acc : C.gray });
  const A = [6, 7, 8, 9, 10];
  d.box(40, 134, 70, 36, 'norm', { ...st([12]), tc: tc([12]), size: 11 });
  d.box(128, 134, 204, 36, 'attention', { ...st(A), tc: tc(A) });
  [['QKV', 6, 150], ['softmax', 7, 194], ['mask', 8, 240], ['heads', 9, 280], ['n × n', 10, 318]].forEach(([t, k, x]) => d.text(x, 184, t, { cls: 'mono', size: 9, color: on([k]) ? C.acc : C.line }));
  d.circle(352, 152, 18, st([12])); d.text(352, 152, '+', { color: tc([12]) });
  d.box(374, 134, 70, 36, 'norm', { ...st([12]), tc: tc([12]), size: 11 });
  d.box(462, 134, 100, 36, 'MLP', { ...st([12]), tc: tc([12]) });
  d.circle(588, 152, 18, st([12])); d.text(588, 152, '+', { color: tc([12]) });
  [[110, 126], [332, 341], [444, 460], [562, 577]].forEach(([a, b]) => d.arrow(a, 152, b, 152, { stroke: C.line, hl: 6 }));
  d.lines([[30, 152], [30, 204], [352, 204], [352, 162]], { stroke: ln([12]), sw: 1.1, single: true });
  d.lines([[362, 204], [588, 204], [588, 162]], { stroke: ln([12]), sw: 1.1, single: true });
  d.text(200, 216, 'residual stream', { cls: 'xs', color: on([12]) ? C.acc : C.line });
  d.line(90, 228, 90, 244, { stroke: ln([11]), sw: 1, dash: [3, 3], single: true });
  d.box(40, 244, 100, 34, 'KV cache', { ...st([11]), tc: tc([11]), size: 11 });
  d.carrow([[612, 226], [608, 252], [584, 261]], { stroke: C.line });
  d.box(482, 244, 100, 34, 'final norm', { ...st([12]), tc: tc([12]), size: 11 });
  d.arrow(482, 261, 462, 261, { stroke: C.line, hl: 6 });
  d.box(362, 244, 98, 34, 'LM head', { ...st([12]), tc: tc([12]), size: 11 });
  d.arrow(362, 261, 342, 261, { stroke: C.line, hl: 6 });
  d.box(252, 244, 88, 34, 'softmax', { ...st([12]), tc: tc([12]), size: 11 });
  d.arrow(252, 261, 232, 261, { stroke: C.line, hl: 6 });
  d.text(190, 261, 'P(next)', { cls: 'mono', size: 10.5, color: tc([12]) });
  d.line(600, 300, 44, 300, { stroke: ln([13]), sw: on([13]) ? 1.4 : 1, dash: [5, 4], single: true });
  d.head(40, 300, Math.PI, { stroke: ln([13]), sw: 1 });
  d.text(320, 316, 'training: the loss sends a correction back to every weight', { cls: 'xs', color: on([13]) ? C.acc : C.line });
  return d.svg();
}

export function where_modern(stage) {
  const d = new D(640, 300, 'where_modern' + stage);
  const on = (keys) => stage === 99 || keys.includes(stage);
  const st = (keys) => on(keys) ? { fill: C.accSoft, stroke: C.acc, sw: 1.3 } : { fill: C.paper, stroke: C.line, sw: 0.9 };
  const tc = (keys) => on(keys) ? C.ink : C.gray;
  const all = on([7]);
  d.text(10, 14, 'YOU ARE HERE', { cls: 'cap', a: 'start', color: C.acc });
  d.rect(14, 30, 612, 250, { stroke: all ? C.acc : C.line, sw: all ? 1.4 : 1, r: 10 });
  d.text(26, 46, 'MODERN DECODER BLOCK', { cls: 'cap', a: 'start', color: all ? C.acc : C.gray });
  d.text(26, 72, 'ATTENTION HALF', { cls: 'cap', a: 'start' });
  d.box(26, 84, 74, 36, 'RMSNorm', { ...st([2]), tc: tc([2]), size: 11 });
  d.box(116, 84, 90, 36, 'q, k, v proj', { ...st([7]), tc: tc([7]), size: 11 });
  d.box(222, 84, 84, 36, 'RoPE (q, k)', { ...st([1]), tc: tc([1]), size: 11 });
  d.box(322, 84, 104, 36, 'GQA: 8 q, 2 kv', { ...st([4]), tc: tc([4]), size: 11 });
  d.box(442, 84, 70, 36, 'SDPA', { ...st([5, 6]), tc: tc([5, 6]), size: 11 });
  d.text(477, 132, 'Flash kernel', { cls: 'mono', size: 9, color: on([6]) ? C.acc : C.line });
  d.box(528, 84, 54, 36, 'o proj', { ...st([7]), tc: tc([7]), size: 11 });
  [[100, 114], [206, 220], [306, 320], [426, 440], [512, 526]].forEach(([a, b]) => d.arrow(a, 102, b, 102, { stroke: C.line, hl: 6 }));
  d.circle(604, 102, 18, st([7])); d.text(604, 102, '+', { color: tc([7]) });
  d.arrow(582, 102, 594, 102, { stroke: C.line, hl: 5 });
  d.text(26, 172, 'MLP HALF', { cls: 'cap', a: 'start' });
  d.box(26, 184, 74, 36, 'RMSNorm', { ...st([2]), tc: tc([2]), size: 11 });
  d.box(124, 184, 120, 36, 'gate, up proj', { ...st([3]), tc: tc([3]), size: 11 });
  d.box(268, 184, 100, 36, 'SiLU(g) ⊙ u', { ...st([3]), tc: tc([3]), size: 11 });
  d.box(392, 184, 100, 36, 'down proj', { ...st([3]), tc: tc([3]), size: 11 });
  [[100, 122], [244, 266], [368, 390]].forEach(([a, b]) => d.arrow(a, 202, b, 202, { stroke: C.line, hl: 6 }));
  d.circle(604, 202, 18, st([7])); d.text(604, 202, '+', { color: tc([7]) });
  d.arrow(492, 202, 594, 202, { stroke: C.line, hl: 6 });
  const res = all ? C.acc : C.line;
  d.lines([[6, 146], [604, 146], [604, 111]], { stroke: res, sw: 1.2, single: true });
  d.lines([[622, 102], [634, 102], [634, 160], [6, 160], [6, 244], [604, 244], [604, 211]], { stroke: res, sw: 1.2, single: true });
  d.arrow(63, 146, 63, 123, { stroke: C.line, hl: 5 });
  d.arrow(63, 244, 63, 223, { stroke: C.line, hl: 5 });
  d.text(320, 264, 'residual stream: x + Attn(Norm(x)), then h + MLP(Norm(h))', { cls: 'xs', color: all ? C.acc : C.line });
  d.text(320, 292, 'what changed since GPT-2: positions, norm, MLP, K/V sharing, the attention kernel, and no biases', { cls: 'xs', color: C.gray });
  return d.svg();
}

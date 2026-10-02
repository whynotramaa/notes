import { D, C } from '../lib/draw.js';

const PM = 7504924672, KV_L3 = 131072, BW = 3.35e12, PEAK = 989.4e12;

export function where_infer(stage = 99) {
  const d = new D(640, 300, 'where_infer' + stage);
  const on = (k) => stage === 99 || stage === 10 || k.includes(stage);
  const st = (k) => on(k) ? { fill: C.accSoft, stroke: C.acc, sw: 1.3 } : { fill: C.paper, stroke: C.line, sw: 0.9 };
  const tc = (k) => on(k) ? C.ink : C.gray;
  const bx = (x, y, w, h, lab, k, size = 10.5) => d.box(x, y, w, h, lab, { ...st(k), tc: tc(k), size });
  d.text(10, 14, 'YOU ARE HERE', { cls: 'cap', a: 'start', color: C.acc });
  d.text(20, 54, 'messages', { cls: 'mono', size: 10.5, a: 'start', color: tc([9]) });
  d.arrow(78, 54, 96, 54, { stroke: C.line, hl: 6 });
  bx(98, 38, 120, 32, 'chat template', [9]);
  d.arrow(218, 54, 238, 54, { stroke: C.line, hl: 6 });
  bx(240, 38, 104, 32, 'tokenizer', [8]);
  d.arrow(292, 70, 292, 102, { stroke: C.line, hl: 6 });
  d.text(300, 87, 'token IDs', { cls: 'xs', a: 'start' });
  bx(470, 30, 150, 30, 'config.json', [5]);
  bx(470, 68, 150, 30, 'model.safetensors', [6]);
  bx(470, 106, 150, 28, 'int8 / int4 weights', [4], 10);
  d.carrow([[470, 84], [452, 104], [448, 124]], { stroke: C.line });
  const archOn = on([5]);
  d.rect(20, 104, 430, 124, { stroke: archOn ? C.acc : C.line, sw: archOn ? 1.4 : 1, r: 10 });
  d.text(32, 118, 'OUR DECODER, REBUILT FROM THE CONFIG', { cls: 'cap', a: 'start', color: archOn ? C.acc : C.gray });
  bx(40, 130, 100, 32, 'prefill', [1]);
  bx(152, 130, 100, 32, 'decode', [1]);
  bx(264, 130, 170, 32, 'attention kernel', [3]);
  bx(152, 178, 282, 32, 'KV cache', [2]);
  bx(470, 172, 150, 44, 'parity check\nvs reference', [7], 10.5);
  d.line(450, 194, 468, 194, { stroke: on([7]) ? C.acc : C.line, dash: [4, 3], single: true });
  d.arrow(235, 228, 235, 248, { stroke: C.line, hl: 6 });
  bx(40, 250, 150, 32, 'LM head → logits', [1]);
  d.arrow(190, 266, 210, 266, { stroke: C.line, hl: 6 });
  bx(212, 250, 100, 32, 'sampling', [99]);
  d.arrow(312, 266, 332, 266, { stroke: C.line, hl: 6 });
  bx(334, 250, 110, 32, 'detokenize', [8]);
  d.arrow(444, 266, 464, 266, { stroke: C.line, hl: 6 });
  d.text(470, 266, 'reply text', { cls: 'mono', size: 10.5, a: 'start', color: tc([99]) });
  d.carrow([[240, 250], [140, 232], [100, 196], [150, 160]], { stroke: C.line, dash: [3, 3] });
  d.text(70, 214, 'next token', { cls: 'xs', color: C.gray });
  return d.svg();
}

export function cover_infer() {
  const d = new D(750, 975, 'cover_infer');
  for (let x = 24; x < 750; x += 26) for (let y = 30; y < 975; y += 26) d.dot(x, y, 0.8, C.faint);
  d.text(62, 92, 'A HAND-DRAWN FIELD GUIDE  /  OCTLM UNIT IV', { cls: 'cap', a: 'start', size: 10, color: C.acc });
  d.text(58, 158, 'Inference', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.text(58, 230, 'Engineering', { cls: 'big', a: 'start', size: 66, w: 600 });
  d.hl(60, 252, 420, 252, { th: 9, op: 0.35 });
  d.text(62, 292, 'From a checkpoint on disk to a chat reply you can trust,', { a: 'start', size: 16, color: C.ink2 });
  d.text(62, 314, 'one verified step at a time.', { a: 'start', size: 16, color: C.ink2 });
  d.rect(300, 370, 360, 500, { fill: C.card, sw: 1.1, r: 12 });
  d.text(316, 390, 'ONE CHAT TURN, BOTTOM TO TOP', { cls: 'cap', a: 'start' });
  const cx = 480;
  d.line(cx, 850, cx, 420, { stroke: C.acc, sw: 2.4 });
  d.head(cx, 420, -Math.PI / 2, { stroke: C.acc, sw: 1.8, hl: 11 });
  const step = (y, label, hot) => d.box(cx - 95, y, 190, 36, label, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2, size: 12, sw: 1 });
  step(800, 'messages → chat template', false);
  step(740, 'tokenizer → token IDs', false);
  step(680, 'prefill the prompt', true);
  step(620, 'KV cache', false);
  step(560, 'decode one token', true);
  step(500, 'sample → detokenize', false);
  d.text(cx, 448, '"The capital of France is Paris."', { cls: 'mono', size: 11 });
  d.carrow([[cx + 96, 518], [cx + 150, 560], [cx + 96, 580]], { stroke: C.acc, sw: 1.3 });
  d.text(cx + 140, 600, 'repeat', { cls: 'xs', color: C.acc });
  d.hand(70, 520, 'read the whole', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 550, 'prompt once,', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 580, 'then one token', { a: 'start', size: 24, color: C.ink2 });
  d.hand(70, 610, 'at a time.', { a: 'start', size: 24, color: C.ink2 });
  d.carrow([[150, 630], [220, 690], [cx - 100, 698]], { stroke: C.gray, sw: 1 });
  d.hand(430, 910, 'Qwen3-0.6B, rebuilt and proved', { size: 21 });
  d.text(62, 945, 'CHAPTER 4  /  PREFILL, CACHE, QUANTIZE, LOAD, PROVE, TEMPLATE', { cls: 'cap', a: 'start', size: 9.5 });
  return d.svg();
}

export function inf_train_vs_infer() {
  const d = new D(640, 260, 'inf_train_vs_infer');
  d.text(10, 16, 'SAME FORWARD PASS, TWO SCHEDULES', { cls: 'cap', a: 'start' });
  const toks = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
  const o = { h: 22, cw: 6.4, pad: 7, size: 10, gap: 4, minw: 30 };
  d.text(20, 44, 'training: one pass, every position', { cls: 'ttl', a: 'start' });
  const xs = d.chips(30, 196, toks, o);
  d.box(26, 120, xs.end - 22, 36, 'decoder (causal mask)', { fill: C.card, size: 11 });
  const outs = d.chips(30, 66, ['cat', 'sat', 'on', 'the', 'mat', '.'], { ...o, fill: C.accSoft, stroke: C.acc });
  xs.forEach(([cx], i) => { d.arrow(cx, 194, cx, 160, { stroke: C.ink2, hl: 5 }); d.arrow(outs[i][0], 118, outs[i][0], 92, { stroke: C.acc, hl: 5 }); });
  d.text(30 + (xs.end - 30) / 2, 236, 'all 6 targets known, 6 predictions at once', { cls: 'xs' });
  d.line(320, 34, 320, 246, { stroke: C.faint, sw: 0.8, single: true });
  d.text(340, 44, 'inference: one token per step', { cls: 'ttl', a: 'start' });
  const seqs = [['The', 'cat'], ['The', 'cat', 'sat'], ['The', 'cat', 'sat', 'on']];
  const nxt = ['sat', 'on', 'the'];
  const outC = [];
  seqs.forEach((s, r) => {
    const y = 70 + r * 52;
    const c = d.chips(350, y, s, { ...o, fill: (i) => (r > 0 && i === s.length - 1) ? C.accFaint : C.card });
    d.arrow(c.end + 6, y + 11, c.end + 32, y + 11, { stroke: C.ink2, hl: 5 });
    const n = d.chips(c.end + 36, y, [nxt[r]], { ...o, fill: C.accSoft, stroke: C.acc });
    outC.push([n[0][0], c]);
    d.text(342, y + 11, String(r + 1), { cls: 'xs', a: 'end' });
  });
  for (let r = 0; r < 2; r++) {
    const [ox] = outC[r], tgt = outC[r + 1][1][r + 2][0], y = 70 + r * 52;
    d.carrow([[ox, y + 23], [ox - 6, y + 38], [tgt + 2, y + 50]], { stroke: C.acc, sw: 0.9, hl: 5 });
  }
  d.hand(470, 236, 'each step waits for the last', { size: 15 });
  return d.svg();
}

export function inf_steno_scene() {
  const d = new D(640, 250, 'inf_steno_scene');
  d.text(10, 16, 'PICTURE THIS: READ THE BRIEF, THEN ANSWER WORD BY WORD', { cls: 'cap', a: 'start' });
  d.text(160, 42, 'prefill: the whole stack at once', { cls: 'ttl', size: 11 });
  for (let i = 5; i >= 0; i--) { d.rect(70 + i * 5, 70 - i * 4, 110, 120, { fill: C.paper, stroke: i ? C.line : C.ink2, r: 3, sw: 0.9 }); }
  for (let l = 0; l < 9; l++) d.line(82, 84 + l * 11, 82 + (l % 3 === 2 ? 60 : 84), 84 + l * 11, { stroke: C.line, sw: 0.8, single: true });
  for (let l = 0; l < 9; l++) d.hl(80, 84 + l * 11, 168, 84 + l * 11, { th: 8, op: 0.14 });
  d.text(125, 206, '40 pages, skimmed in parallel', { cls: 'xs' });
  d.circle(236, 120, 26, { fill: C.paper, sw: 1 });
  d.lines([[236, 133], [236, 175]], { sw: 1.1, single: true });
  d.lines([[214, 196], [236, 175], [258, 196]], { sw: 1.1, single: true });
  d.lines([[236, 148], [210, 132]], { sw: 1.1, single: true });
  d.line(320, 34, 320, 236, { stroke: C.faint, sw: 0.8, single: true });
  d.text(480, 42, 'decode: one word, then the next', { cls: 'ttl', size: 11 });
  d.circle(380, 120, 26, { fill: C.paper, sw: 1 });
  d.lines([[380, 133], [380, 175]], { sw: 1.1, single: true });
  d.lines([[358, 196], [380, 175], [402, 196]], { sw: 1.1, single: true });
  d.path('M394,124 q6,4 0,8', { stroke: C.ink2, sw: 1, single: true });
  ['The', 'capital', 'is', '…'].forEach((w, i) => {
    const x = 420 + i * 52, y = 96 + (i % 2) * 22;
    d.rect(x, y, 46, 24, { fill: i < 3 ? C.accSoft : C.paper, stroke: i < 3 ? C.acc : C.line, r: 10, sw: 0.9 });
    d.text(x + 23, y + 12, w, { cls: 'mono', size: 9.5 });
    if (i < 3) d.arrow(x + 46, y + 12 + (i % 2 ? -8 : 8), x + 52, y + 12 + (i % 2 ? -14 : 14), { stroke: C.gray, hl: 4, sw: 0.7 });
  });
  d.text(480, 206, 'each word chosen, said, heard, then the next', { cls: 'xs' });
  d.hand(320, 236, 'faster reader: shorter silence. faster speaker: faster stream.', { size: 14 });
  return d.svg();
}

export function inf_latency_timeline() {
  const d = new D(640, 210, 'inf_latency_timeline');
  d.text(10, 16, 'ONE REQUEST ON A TIMELINE  (ILLUSTRATIVE: TTFT 40 MS, ITL 5 MS)', { cls: 'cap', a: 'start' });
  const y = 110;
  d.arrow(30, y, 626, y, { stroke: C.ink2, sw: 0.9, hl: 6 });
  d.text(624, y + 16, 'time', { cls: 'xs', a: 'end' });
  d.rect(40, y - 26, 26, 24, { fill: C.card, stroke: C.line, r: 3 });
  d.text(53, y - 40, 'queue +\ntokenize', { cls: 'xs', vc: true });
  d.box(68, y - 26, 150, 24, 'prefill the prompt', { fill: C.accSoft, stroke: C.acc, size: 10.5, r: 3 });
  for (let i = 0; i < 14; i++) {
    const x = 222 + i * 28;
    d.rect(x, y - 20, 22, 18, { fill: i === 0 ? C.acc : C.slateSoft, stroke: i === 0 ? C.acc : C.slate, r: 3, sw: 0.8 });
    d.text(x + 11, y + 12, `t${i + 1}`, { cls: 'xs' });
  }
  d.text(618, y - 11, '…', { cls: 'lbl' });
  d.dot(40, y, 3, C.ink);
  d.text(40, y + 12, 'request', { cls: 'xs' });
  d.brace(40, 242, y + 30, { label: 'time to first token (TTFT)' });
  d.brace(250, 276, y + 30, {});
  d.text(263, y + 56, 'ITL', { cls: 'sm' });
  d.brace(222, 610, y - 46, { dir: -1, label: 'decode: one token per step, streamed to the user' });
  d.hand(470, 190, '200 tokens: 40 + 199 × 5 = 1,035 ms', { size: 15 });
  return d.svg();
}

export function inf_prefill_pass() {
  const d = new D(640, 320, 'inf_prefill_pass');
  d.text(10, 16, 'PREFILL: THE WHOLE PROMPT GOES UP TOGETHER, THE CACHE FILLS ON THE WAY', { cls: 'cap', a: 'start' });
  const toks = ['You', 'are', 'a', 'help', 'ful', '?'];
  const c = d.chips(40, 278, toks, { h: 22, cw: 6.4, pad: 7, size: 10, gap: 6, width: 42 });
  const x0 = 30, x1 = c.end + 10;
  const layers = [[228, 'layer 1'], [186, 'layer 2'], [116, 'layer 28']];
  layers.forEach(([y, lab]) => {
    d.box(x0, y, x1 - x0, 28, lab, { fill: C.card, size: 10.5 });
    d.arrow(x1 + 4, y + 14, 398, y + 14, { stroke: C.slate, dash: [4, 3], hl: 5 });
    d.grid(400, y + 2, 1, 6, 30, 24, { cellFill: () => C.slateSoft });
    d.text(588, y + 14, 'K, V', { cls: 'xs', a: 'start', color: C.slate });
  });
  d.text((x0 + x1) / 2, 164, '⋮', { size: 16 });
  d.text(490, 164, '⋮', { size: 16 });
  c.forEach(([cx]) => d.line(cx, 276, cx, 258, { stroke: C.ink2, sw: 0.8, single: true }));
  c.forEach(([cx], i) => { if (i < 5) d.line(cx, 114, cx, 100, { stroke: C.line, sw: 0.8, single: true, dash: [2, 3] }); });
  d.text((c[0][0] + c[4][0]) / 2, 92, 'outputs not needed', { cls: 'xs' });
  const lx = c[5][0];
  d.arrow(lx, 114, lx, 76, { stroke: C.acc, sw: 1.4 });
  d.box(lx - 60, 44, 120, 30, 'LM head, last row', { fill: C.accSoft, stroke: C.acc, size: 10 });
  d.text(400, 52, 'KV cache, one row per prompt token', { cls: 'ttl', a: 'start', size: 11 });
  d.hand(520, 300, 'built once, reused forever', { size: 15 });
  return d.svg();
}

export function inf_prefill_cost() {
  const d = new D(640, 230, 'inf_prefill_cost');
  d.text(10, 16, 'LLAMA 3 8B PREFILL, H100 PEAK, LOWER BOUND  (LOG TIME SCALE)', { cls: 'cap', a: 'start' });
  const rows = [[128, 1.946, 0.0022], [2048, 32.18, 0.0345], [8192, 142.06, 0.1252], [32768, 781.6, 0.364]];
  const X = (ms) => 110 + Math.log10(ms) / 3 * 330;
  [1, 10, 100, 1000].forEach((t) => { d.line(X(t), 40, X(t), 196, { stroke: C.faint, sw: 0.6, single: true }); d.text(X(t), 208, `${t} ms`, { cls: 'xs' }); });
  d.text(530, 40, 'attention share', { cls: 'sm' });
  rows.forEach(([T, ms, sh], i) => {
    const y = 52 + i * 38;
    d.text(100, y + 11, `${T.toLocaleString('en-US')} tok`, { cls: 'mono', size: 10, a: 'end' });
    d.rect(X(1) - 30, y, X(ms) - X(1) + 30, 22, { fill: C.card, stroke: C.ink2, r: 3, sw: 0.9 });
    d.mono(X(ms) + 6, y + 11, `${ms.toFixed(1)} ms`, { size: 10, a: 'start' });
    d.rect(480, y, 100, 22, { fill: C.paper, stroke: C.line, r: 3, sw: 0.8 });
    d.fillRect(481.5, y + 1.5, Math.max(1.5, 97 * sh), 19, C.acc, 0.85, 2);
    d.mono(588, y + 11, `${(sh * 100).toFixed(1)}%`, { size: 10, a: 'start', color: C.acc });
  });
  d.text(320, 224, 'linear work (projections, MLP) grows with T; attention grows with T², so its share climbs', { cls: 'xs' });
  return d.svg();
}

export function inf_decode_step() {
  const d = new D(640, 300, 'inf_decode_step');
  d.text(10, 16, 'ONE DECODE STEP: ONE ROW UP, EVERYTHING READ ONCE', { cls: 'cap', a: 'start' });
  d.chips(286, 262, ['Paris'], { h: 24, size: 10.5, fill: C.accFaint, stroke: C.acc, width: 68 });
  const lay = [[212, 'layer 1'], [168, 'layer 2'], [96, 'layer 28']];
  lay.forEach(([y, l]) => d.box(250, y, 140, 30, l, { fill: C.card, size: 10.5 }));
  d.arrow(320, 260, 320, 244, { stroke: C.acc, sw: 1.4, hl: 6 });
  d.arrow(320, 210, 320, 200, { stroke: C.acc, sw: 1.4, hl: 6 });
  d.text(320, 142, '⋮', { size: 16 });
  d.arrow(320, 94, 320, 70, { stroke: C.acc, sw: 1.4 });
  d.box(268, 40, 104, 28, 'LM head', { fill: C.card, size: 10.5 });
  d.chips(392, 42, ['next token'], { h: 24, size: 10, fill: C.accSoft, stroke: C.acc });
  d.arrow(374, 54, 390, 54, { stroke: C.acc, hl: 5 });
  d.box(30, 90, 150, 156, 'weights\n(read every one)\n15.0 GB for\nLlama 3 8B', { fill: C.paper, stroke: C.ink2, size: 10.5 });
  lay.forEach(([y]) => d.arrow(182, y + 15, 248, y + 15, { stroke: C.gray, hl: 5 }));
  d.box(460, 90, 150, 156, 'KV cache\n(read every row)\n+ append one\nnew K, V row', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  lay.forEach(([y]) => { d.arrow(458, y + 9, 392, y + 9, { stroke: C.slate, hl: 5 }); d.arrow(392, y + 21, 458, y + 21, { stroke: C.acc, hl: 5, sw: 0.9 }); });
  d.hand(120, 280, 'lots of reading, little math', { size: 15 });
  return d.svg();
}

export function inf_roofline() {
  const d = new D(640, 290, 'inf_roofline');
  d.text(10, 16, 'H100 ROOFLINE: 3.35 TB/S, 989.4 TFLOPS BF16  (LOG SCALE, BOTH AXES)', { cls: 'cap', a: 'start' });
  const M = d.axes(80, 40, 480, 200, { xmin: -1, xmax: 4, ymin: -1, ymax: 3.3, xl: 'operations per byte', yl: 'TFLOPS attainable' });
  const roof = (lg) => Math.log10(Math.min(BW * 10 ** lg, PEAK) / 1e12);
  d.fn(roof, -1, 4, M, { stroke: C.ink, sw: 1.6, n: 120 });
  const ridge = Math.log10(PEAK / BW);
  d.line(M.X(ridge), M.Y(roof(ridge)), M.X(ridge), M.Y(-1), { stroke: C.gray, dash: [4, 3], sw: 0.8, single: true });
  d.text(M.X(ridge) + 4, M.Y(-0.75), 'ridge ≈ 295', { cls: 'xs', a: 'start' });
  [-1, 0, 1, 2, 3, 4].forEach((e) => d.text(M.X(e), M.Y(-1) + 14, String(10 ** e), { cls: 'xs' }));
  [0, 1, 2, 3].forEach((e) => d.text(74, M.Y(e), String(10 ** e), { cls: 'xs', a: 'end' }));
  const f1 = 2 * PM + 4 * 32 * 32 * 128 * 2048, b1 = 2 * PM + KV_L3 * 2048;
  const f64 = 64 * f1, b64 = 2 * PM + 64 * KV_L3 * 2048;
  const fp = 31840219955200, bp = 15278284800;
  [[f1 / b1, 'decode, batch 1', C.acc, 'start'], [f64 / b64, 'decode, batch 64', C.slate, 'start'], [fp / bp, 'prefill, 2,048 tokens', C.ink, 'end']].forEach(([I, lab, col, a]) => {
    const lg = Math.log10(I);
    d.dot(M.X(lg), M.Y(roof(lg)), 4.5, col);
    d.text(M.X(lg) + (a === 'start' ? 8 : -8), M.Y(roof(lg)) + (a === 'start' ? 12 : -12), lab, { cls: 'sm', a, color: col });
  });
  d.text(M.X(0.6), M.Y(1.95), 'memory-bound', { cls: 'sm', rot: -33 });
  d.text(M.X(3.3), M.Y(3.1), 'compute-bound', { cls: 'sm' });
  d.hand(470, 276, 'batching slides decode up the slope', { size: 15 });
  return d.svg();
}

export function inf_naive_waste() {
  const d = new D(640, 250, 'inf_naive_waste');
  d.text(10, 16, 'PROMPT OF 4, THEN 5 NEW TOKENS: CELLS = TOKEN POSITIONS PUSHED THROUGH THE MODEL', { cls: 'cap', a: 'start' });
  const cw = 24, ch = 22;
  const panel = (x0, title, cached, total) => {
    d.text(x0, 44, title, { cls: 'ttl', a: 'start' });
    for (let r = 0; r < 6; r++) {
      const n = 4 + r;
      for (let c = 0; c < n; c++) {
        const isNew = r === 0 ? true : c === n - 1;
        if (cached && !isNew) continue;
        const fill = r === 0 ? C.card : isNew ? C.accSoft : C.faint;
        d.rect(x0 + c * cw, 58 + r * ch, cw - 3, ch - 3, { fill, stroke: isNew && r > 0 ? C.acc : C.line, r: 2, sw: 0.8 });
      }
      d.text(x0 - 6, 58 + r * ch + 9, r === 0 ? 'prefill' : `step ${r}`, { cls: 'xs', a: 'end' });
    }
    d.text(x0 + 110, 204, `${total} cells`, { cls: 'mono', size: 11, color: cached ? C.acc : C.ink });
  };
  panel(70, 'without a cache', false, 39);
  panel(400, 'with a cache', true, 9);
  d.hand(320, 236, '1,000-token prompt, 500 new: 624,750 vs 1,499', { size: 15 });
  return d.svg();
}

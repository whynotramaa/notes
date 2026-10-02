import { D, C } from '../lib/draw.js';

function bubble(d, x, y, w, h, text, o = {}) {
  d.rect(x, y, w, h, { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, r: 12, sw: 1 });
  d.poly([[x + 30, y + h - 1], [x + 22, y + h + 14], [x + 46, y + h - 1]], { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, sw: 1 });
  d.fillRect(x + 31, y + h - 3, 14, 4, o.fill ?? C.paper, 1);
  d.text(x + w / 2, y + h / 2, text, { cls: 'mono', size: 10.5 });
}

export function inf_fluent_bug() {
  const d = new D(640, 260, 'inf_fluent_bug');
  d.text(10, 16, 'SAME ANSWER, DIFFERENT MODEL  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const panel = (x0, title, grow, col) => {
    d.text(x0 + 140, 40, title, { cls: 'ttl', size: 11, color: col });
    bubble(d, x0 + 10, 52, 270, 36, '"The capital of France is Paris."');
    const M = d.axes(x0 + 40, 120, 230, 90, { xmin: 0, xmax: 25, ymin: 0, ymax: 1, xl: 'position', yl: 'max |logit diff|' });
    const pts = []; for (let p = 0; p <= 25; p++) pts.push([M.X(p), M.Y(grow ? Math.min(0.95, 0.035 * p * (1 + 0.15 * Math.sin(p * 1.7))) : 0.012 + 0.004 * Math.sin(p * 2.1))]);
    d.lines(pts, { stroke: col, sw: 1.6, rough: 0.3, single: true });
  };
  panel(10, 'correct port', false, C.slate);
  panel(330, 'RoPE pairing swapped', true, C.red);
  d.hand(480, 246, 'the text agrees; the numbers do not', { size: 15 });
  return d.svg();
}

export function inf_parity_harness() {
  const d = new D(640, 260, 'inf_parity_harness');
  d.text(10, 16, 'ONE CHECKPOINT, ONE TENSOR OF IDS, TWO IMPLEMENTATIONS, ONE COMPARISON', { cls: 'cap', a: 'start' });
  const f = 14, dx = 30, dy = 40, dw = 100, dh = 84;
  d.poly([[dx, dy], [dx + dw - f, dy], [dx + dw, dy + f], [dx + dw, dy + dh], [dx, dy + dh]], { fill: C.slateSoft, stroke: C.slate });
  d.text(dx + dw / 2, dy + dh / 2, 'model.\nsafetensors', { cls: 'mono', size: 9.5, vc: true });
  d.box(20, 160, 120, 44, 'token IDs\n(1, 26)', { cls: 'mono', size: 10, fill: C.card });
  d.box(200, 50, 170, 50, 'reference: HF Qwen3\neager attention, fp32', { size: 10, fill: C.card });
  d.box(200, 160, 170, 50, 'ours: rebuilt from\nthe config, fp32', { size: 10, fill: C.accFaint, stroke: C.acc });
  [[132, 80, 198, 75], [132, 100, 198, 175], [142, 176, 198, 90], [142, 186, 198, 190]].forEach(([a, b, c, e]) => d.arrow(a, b, c, e, { stroke: C.gray, hl: 5 }));
  d.arrow(372, 75, 406, 75, { stroke: C.ink2, hl: 5 }); d.arrow(372, 185, 406, 185, { stroke: C.ink2, hl: 5 });
  d.box(408, 58, 100, 34, 'a: (1, 26, 151936)', { cls: 'mono', size: 9, fill: C.paper });
  d.box(408, 168, 100, 34, 'b: (1, 26, 151936)', { cls: 'mono', size: 9, fill: C.paper });
  d.arrow(510, 75, 534, 112, { stroke: C.ink2, hl: 5 }); d.arrow(510, 185, 534, 150, { stroke: C.ink2, hl: 5 });
  d.box(536, 96, 96, 70, 'max |a − b|\nmean |a − b|\nper position\nargmax', { size: 9.5, fill: C.accSoft, stroke: C.acc });
  d.text(320, 238, '3,950,336 logits each, compared number by number', { cls: 'xs' });
  return d.svg();
}

export function inf_logit_diff() {
  const d = new D(640, 270, 'inf_logit_diff');
  d.text(10, 16, 'FIVE LOGITS AT ONE POSITION  (ILLUSTRATIVE), DIFFERENCES ×1,000 BELOW', { cls: 'cap', a: 'start' });
  const ref = [14.8125, 13.9375, 9.25, -2.125, 7.6875], ours = [14.8130, 13.9361, 9.2503, -2.1243, 7.6890];
  const base = 150, k = 7;
  d.line(40, base, 600, base, { stroke: C.ink2, sw: 0.9, single: true });
  ref.forEach((v, i) => {
    const x = 70 + i * 110;
    [[v, C.slateSoft, C.slate, 0], [ours[i], C.accSoft, C.acc, 26]].forEach(([u, f, s, o]) => {
      const h = u * k;
      d.rect(x + o, h >= 0 ? base - h : base, 24, Math.abs(h), { fill: f, stroke: s, r: 2, sw: 0.8 });
    });
    d.mono(x + 25, v >= 0 ? base - v * k - 10 : base - v * k + 10, v.toFixed(2), { size: 9 });
    d.text(x + 25, base + 30, `token ${'ABCDE'[i]}`, { cls: 'xs' });
    const diff = Math.abs(v - ours[i]) * 1000;
    d.rect(x + 13, 230 - diff * 12, 24, diff * 12, { fill: C.acc, stroke: C.acc, r: 1, sw: 0.6 });
    d.mono(x + 25, 240, diff.toFixed(1), { size: 9, color: C.acc });
  });
  d.line(40, 230, 600, 230, { stroke: C.ink2, sw: 0.7, single: true });
  d.vbrace(124, base - 14.8125 * k, base - 13.9375 * k, { dir: 1, label: 'margin 0.875' });
  d.text(600, 60, 'slate: reference\norange: ours', { cls: 'xs', a: 'end', vc: true });
  d.text(600, 212, '|a − b| × 1,000', { cls: 'xs', a: 'end', color: C.acc });
  return d.svg();
}

export function inf_position_diff() {
  const d = new D(640, 230, 'inf_position_diff');
  d.text(10, 16, 'MAX |LOGIT DIFF| BY POSITION: THREE SIGNATURES  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const panel = (x0, title, f, col) => {
    d.text(x0 + 90, 40, title, { cls: 'ttl', size: 11, color: col });
    const M = d.axes(x0 + 10, 56, 170, 120, { xmin: 0, xmax: 25, ymin: 0, ymax: 1 });
    const pts = []; for (let p = 0; p <= 25; p++) pts.push([M.X(p), M.Y(f(p))]);
    d.lines(pts, { stroke: col, sw: 1.6, rough: 0.3, single: true });
    pts.forEach(([x, y]) => d.dot(x, y, 1.6, col));
    d.text(x0 + 95, 194, 'position 0 → 25', { cls: 'xs' });
  };
  panel(20, 'healthy', (p) => 0.02 + 0.008 * Math.sin(p * 1.9), C.slate);
  panel(225, 'RoPE or position bug', (p) => Math.min(0.92, 0.04 * p), C.red);
  panel(430, 'weight or layer bug', (p) => 0.7 + 0.1 * Math.sin(p * 1.3), C.red);
  d.text(320, 218, 'position 0 is never rotated, so a rotation bug starts at zero and grows', { cls: 'xs' });
  return d.svg();
}

export function inf_layer_bisect() {
  const d = new D(640, 280, 'inf_layer_bisect');
  d.text(10, 16, 'FIRST DIVERGENCE, LAYER 0, RoPE PAIRING SWAPPED  (ILLUSTRATIVE VALUES)', { cls: 'cap', a: 'start' });
  const st = [['embed', 0], ['norm', 2e-7], ['q, k, v', 3e-7], ['q_norm', 3e-7], ['after\nRoPE', 0.41], ['attn\nout', 0.9], ['residual', 1.3], ['FFN', 2.1], ['logits', 6.2]];
  const Y = (v) => { const l = Math.log10(Math.max(v, 1e-8)); return 210 - (l + 8) / 9 * 170; };
  [1e-8, 1e-5, 1e-3, 1].forEach((v) => { d.line(70, Y(v), 620, Y(v), { stroke: v === 1e-3 ? C.ink2 : C.faint, sw: v === 1e-3 ? 1 : 0.6, dash: v === 1e-3 ? [5, 3] : undefined, single: true }); d.text(64, Y(v), v === 1 ? '1' : `1e${Math.log10(v)}`, { cls: 'xs', a: 'end' }); });
  d.text(620, Y(1e-3) - 8, 'tolerance', { cls: 'xs', a: 'end' });
  st.forEach(([n, v], i) => {
    const x = 84 + i * 60, bad = v > 1e-3, first = i === 4;
    d.rect(x, Y(v), 36, 210 - Y(v), { fill: bad ? (first ? C.red : C.accFaint) : C.slateSoft, stroke: bad ? (first ? C.red : C.acc) : C.slate, r: 2, sw: 0.9, fop: first ? 0.35 : 1 });
    d.text(x + 18, 228, n, { cls: 'xs', vc: false, lh: 11 });
    d.text(x + 18, 252, bad ? '✗' : '✓', { size: 12, color: bad ? C.red : C.slate });
  });
  d.hand(330, 50, 'the bug lives here; everything after is a consequence', { size: 14, color: C.red });
  d.carrow([[300, 62], [330, 76], [328, Y(0.41) - 6]], { stroke: C.red, sw: 0.9 });
  return d.svg();
}

export function inf_head_order() {
  const d = new D(640, 300, 'inf_head_order');
  d.text(10, 16, 'SPLITTING (T = 3, H·d = 4) INTO 2 HEADS OF 2: COLOURS ARE TOKENS', { cls: 'cap', a: 'start' });
  const tc = [C.accSoft, C.slateSoft, C.faint], ts = [C.acc, C.slate, C.ink2];
  const cell = (x, y, k) => { const t = Math.floor(k / 4), h = Math.floor((k % 4) / 2); d.box(x, y, 30, 24, `t${t}h${h}`, { cls: 'mono', size: 8.5, fill: tc[t], stroke: ts[t], r: 2, sw: 0.8 }); };
  d.text(20, 50, 'memory of the projection output, row by row', { cls: 'sm', a: 'start' });
  for (let k = 0; k < 12; k++) cell(130 + k * 32, 60, k);
  const panel = (x0, title, idx, ok) => {
    d.text(x0 + 120, 118, title, { cls: 'mono', size: 10, color: ok ? C.acc : C.red });
    [0, 1].forEach((h) => {
      d.text(x0 + 10 + h * 130, 140, `head ${h}`, { cls: 'xs', a: 'start' });
      for (let t = 0; t < 3; t++) for (let j = 0; j < 2; j++) cell(x0 + 10 + h * 130 + j * 32, 150 + t * 28, idx(h, t) + j);
    });
    d.text(x0 + 120, 246, ok ? 'each head row is one token' : 'rows mix tokens and heads', { cls: 'xs', color: ok ? C.acc : C.red });
  };
  panel(30, 'view(T, H, d).transpose', (h, t) => t * 4 + h * 2, true);
  panel(340, 'view(H, T, d)', (h, t) => h * 6 + t * 2, false);
  d.line(320, 110, 320, 260, { stroke: C.faint, sw: 0.8, single: true });
  d.hand(320, 284, 'same shape, no error', { size: 15, color: C.red });
  return d.svg();
}

export function inf_tolerance_bands() {
  const d = new D(640, 240, 'inf_tolerance_bands');
  d.text(10, 16, 'REPRESENTABLE NUMBERS BETWEEN 11.85 AND 12.15, AND WHERE 12.03 IS STORED', { cls: 'cap', a: 'start' });
  const X = (v) => 110 + (v - 11.85) / 0.3 * 500;
  const row = (y, name, step, stored, col) => {
    d.text(96, y, name, { cls: 'ttl', a: 'end', size: 11 });
    d.line(X(11.85), y, X(12.15), y, { stroke: C.ink2, sw: 0.9, single: true });
    if (step < 1e-4) d.fillRect(X(11.85), y - 5, X(12.15) - X(11.85), 10, C.slate, 0.35);
    else { const k0 = Math.ceil(11.85 / step); for (let k = k0; k * step <= 12.15; k++) d.line(X(k * step), y - 6, X(k * step), y + 6, { stroke: C.slate, sw: step > 0.05 ? 1.4 : 0.6, single: true, rough: 0 }); }
    d.dot(X(stored), y, 4, col);
    d.mono(X(stored), y + 18, stored.toString(), { size: 9.5, color: col });
    d.mono(624, y, step < 1e-4 ? 'step 9.5e-7' : `step ${step}`, { size: 9, a: 'end', color: C.gray });
  };
  d.line(X(12.03), 40, X(12.03), 196, { stroke: C.acc, dash: [3, 3], sw: 0.9, single: true });
  d.text(X(12.03), 34, 'true value 12.03', { cls: 'xs', color: C.acc });
  row(66, 'fp32', 9.5e-7, 12.03, C.acc);
  row(120, 'fp16', 0.0078125, 12.03125, C.acc);
  row(174, 'bf16', 0.0625, 12, C.red);
  [11.875, 12, 12.125].forEach((v) => d.text(X(v), 214, String(v), { cls: 'xs' }));
  return d.svg();
}

export function inf_generation_parity() {
  const d = new D(640, 250, 'inf_generation_parity');
  d.text(10, 16, 'GREEDY GENERATION, OURS vs REFERENCE  (ILLUSTRATIVE TOKENS AND LOGITS)', { cls: 'cap', a: 'start' });
  const ref = ['Paris', ' is', ' the', ' capital', ' and', ' most', ' populous', ' city'];
  const ours = ['Paris', ' is', ' the', ' capital', ' and', ' largest', ' city', ' of'];
  const o = { h: 22, cw: 6.2, pad: 6, size: 9.5, gap: 4, minw: 26 };
  d.text(66, 61, 'ref', { cls: 'mono', size: 10, a: 'end' });
  d.text(66, 101, 'ours', { cls: 'mono', size: 10, a: 'end' });
  const a = d.chips(76, 50, ref, { ...o, fill: (i) => i === 5 ? C.slateSoft : C.card });
  const b = d.chips(76, 90, ours, { ...o, fill: (i) => i === 5 ? C.accSoft : C.card, stroke: (i) => i === 5 ? C.acc : C.ink2 });
  for (let i = 0; i < 5; i++) d.text((a[i][0] + b[i][0]) / 2, 80, '=', { cls: 'xs', color: C.slate });
  d.rect(a[5][1] - 4, 44, 6 + Math.max(a[5][2], b[5][2]), 74, { stroke: C.acc, r: 6, sw: 1.2, dash: [4, 3] });
  d.rect(300, 140, 320, 90, { fill: C.card, stroke: C.ink2, r: 8 });
  d.text(316, 156, 'logits at the split step', { cls: 'ttl', a: 'start', size: 11 });
  d.mono(316, 180, 'ref:  " most" 17.25    " largest" 17.21', { size: 9.5, a: 'start' });
  d.mono(316, 200, 'ours: " largest" 17.24  " most" 17.22', { size: 9.5, a: 'start' });
  d.mono(316, 220, 'gap 0.04 < tolerance: near-tie, not a bug', { size: 9.5, a: 'start', color: C.acc });
  d.carrow([[a[5][0], 120], [a[5][0] + 20, 150], [298, 170]], { stroke: C.acc, sw: 0.9 });
  d.hand(140, 190, 'force the reference\ntoken, keep comparing', { size: 15, vc: true });
  return d.svg();
}

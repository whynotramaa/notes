import { D, C } from '../lib/draw.js';

export function inf_float_bits() {
  const d = new D(640, 250, 'inf_float_bits');
  d.text(10, 16, 'WHERE THE BITS GO: SIGN, EXPONENT (RANGE), MANTISSA (PRECISION)', { cls: 'cap', a: 'start' });
  const rows = [
    ['FP32', [[1, 'sign', C.accSoft], [8, 'exponent 8', C.slateSoft], [23, 'mantissa 23', C.card]], 'range ±3.4 × 10^{38}, relative step 1.2 × 10^{−7}'],
    ['FP16', [[1, '', C.accSoft], [5, 'exp 5', C.slateSoft], [10, 'mantissa 10', C.card]], 'range ±65,504, relative step 9.8 × 10^{−4}'],
    ['BF16', [[1, '', C.accSoft], [8, 'exponent 8', C.slateSoft], [7, 'mant 7', C.card]], 'range ±3.4 × 10^{38} (same as FP32), relative step 7.8 × 10^{−3}'],
    ['INT8', [[8, 'integer, −128 … 127', C.faint]], '256 evenly spaced steps; the range comes from a separate scale'],
  ];
  const bw = 16, x0 = 90;
  rows.forEach(([name, parts, note], r) => {
    const y = 40 + r * 52;
    d.text(x0 - 12, y + 11, name, { cls: 'ttl', a: 'end' });
    let x = x0;
    parts.forEach(([n, lab, fill]) => {
      d.rect(x, y, n * bw, 22, { fill, stroke: C.ink2, r: 2, sw: 0.9 });
      for (let i = 1; i < n; i++) d.line(x + i * bw, y + 3, x + i * bw, y + 19, { stroke: C.line, sw: 0.5, single: true });
      if (lab) d.text(x + n * bw / 2, y + 11, lab, { cls: 'xs', color: C.ink });
      x += n * bw;
    });
    d.text(x0, y + 34, note, { cls: 'xs', a: 'start' });
  });
  d.hand(560, 120, 'bf16 = fp32\nwith the low\n16 bits cut off', { size: 14, vc: true });
  return d.svg();
}

export function inf_quant_map() {
  const d = new D(640, 230, 'inf_quant_map');
  d.text(10, 16, 'SIX WEIGHTS, SNAPPED TO AN INT8 GRID (STEP 0.02) AND AN INT4 GRID (STEP 0.3629)', { cls: 'cap', a: 'start' });
  const X = (v) => 50 + (v + 1.6) / 4.4 * 560;
  const w = [0.817, -1.273, 0.046, 2.54, -0.309, 1.128];
  const y1 = 84, y2 = 176;
  d.text(50, 46, 'int8: every weight lands within 0.01', { cls: 'ttl', a: 'start', size: 11 });
  d.line(X(-1.6), y1, X(2.8), y1, { stroke: C.ink2, sw: 0.9, single: true });
  for (let v = -1.6; v <= 2.8001; v += 0.02) d.line(X(v), y1 - 3, X(v), y1 + 3, { stroke: C.line, sw: 0.4, single: true, rough: 0 });
  w.forEach((v) => { d.dot(X(v), y1, 3.5, C.acc); d.mono(X(v), y1 - 14, String(v), { size: 9.5 }); });
  d.text(50, 132, 'int4: coarse steps, 0.046 becomes 0', { cls: 'ttl', a: 'start', size: 11 });
  d.line(X(-1.6), y2, X(2.8), y2, { stroke: C.ink2, sw: 0.9, single: true });
  const s4 = 2.54 / 7;
  for (let k = -4; k <= 7; k++) { d.line(X(k * s4), y2 - 7, X(k * s4), y2 + 7, { stroke: C.slate, sw: 1, single: true }); d.text(X(k * s4), y2 + 18, String(k), { cls: 'xs', color: C.slate }); }
  w.forEach((v) => {
    const q = Math.round(v / s4), xq = X(q * s4);
    d.dot(X(v), y2 - 22, 2.6, C.gray);
    if (Math.abs(X(v) - xq) > 2) d.arrow(X(v), y2 - 20, xq, y2 - 4, { stroke: C.acc, sw: 0.9, hl: 5 });
    d.dot(xq, y2, 3.5, C.acc);
  });
  d.text(340, 216, 'grey: original weight   orange: where it is stored   slate numbers: the int4 code', { cls: 'xs' });
  return d.svg();
}

export function inf_asym_sym() {
  const d = new D(640, 240, 'inf_asym_sym');
  d.text(10, 16, 'ACTIVATIONS [−0.28, 0, 0.41, 1.93, 3.70] IN 256 INT8 CODES', { cls: 'cap', a: 'start' });
  const x0 = 60, W = 520;
  const bar = (y, lo, hi, used0, codes, vals, title) => {
    const X = (c) => x0 + (c - lo) / (hi - lo + 1) * W;
    d.text(x0, y - 14, title, { cls: 'ttl', a: 'start', size: 11 });
    d.rect(x0, y, W, 24, { fill: C.paper, stroke: C.ink2, r: 3, sw: 0.9 });
    if (used0 > lo) { d.rect(x0, y, X(used0) - x0, 24, { fill: C.faint, stroke: C.line, fs: 'hachure', gap: 4, r: 3, sw: 0.6 }); d.text((x0 + X(used0)) / 2, y + 12, `${used0 - lo} codes never used`, { cls: 'xs' }); }
    d.fillRect(X(used0), y + 1.5, X(hi + 1) - X(used0) - 1.5, 21, C.accSoft, 1, 2);
    codes.forEach((c, i) => {
      d.line(X(c), y - 2, X(c), y + 26, { stroke: C.acc, sw: 1.3, single: true });
      d.mono(X(c), y + 38, String(c), { size: 9.5, color: C.acc });
      d.mono(X(c), y + 52, vals[i], { size: 8.5, color: C.gray });
    });
    d.text(x0 - 6, y + 12, String(lo), { cls: 'xs', a: 'end' });
    d.text(x0 + W + 6, y + 12, String(hi), { cls: 'xs', a: 'start' });
  };
  bar(52, -128, 127, -10, [-10, 0, 14, 66, 127], ['−0.28', '0', '0.41', '1.93', '3.70'], 'symmetric: s = 0.0291, z = 0');
  bar(156, 0, 255, 0, [0, 18, 44, 142, 255], ['−0.28', '0', '0.41', '1.93', '3.70'], 'asymmetric: s = 0.0156, z = 18');
  return d.svg();
}

export function inf_group_scales() {
  const d = new D(640, 270, 'inf_group_scales');
  d.text(10, 16, 'QWEN3-0.6B, LAYER 0 q_proj, ROW 0: LARGEST |w| IN EACH GROUP OF 128', { cls: 'cap', a: 'start' });
  const g = [0.0518, 0.0304, 0.0299, 0.0352, 0.0265, 0.0344, 0.0315, 0.0280];
  const M = d.axes(70, 44, 400, 170, { xmin: 0, xmax: 8, ymin: 0, ymax: 0.06 });
  [0.02, 0.04, 0.06].forEach((v) => d.text(64, M.Y(v), v.toFixed(2), { cls: 'xs', a: 'end' }));
  g.forEach((v, i) => {
    const x = M.X(i) + 7, top = M.Y(v);
    d.rect(x, top, 36, M.Y(0) - top, { fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2, r: 2, sw: 0.9 });
    d.mono(x + 18, top - 8, v.toFixed(4), { size: 8.5, color: i === 0 ? C.acc : C.ink });
    d.text(x + 18, M.Y(0) + 12, `${i * 128}+`, { cls: 'xs' });
  });
  d.line(M.X(0), M.Y(0.0518), M.X(8), M.Y(0.0518), { stroke: C.acc, dash: [5, 3], sw: 1, single: true });
  d.text(M.X(8), M.Y(0.0518) - 8, 'one scale per row must cover 0.0518', { cls: 'xs', a: 'end', color: C.acc });
  d.line(M.X(0), M.Y(0.0082), M.X(8), M.Y(0.0082), { stroke: C.slate, dash: [2, 3], sw: 1, single: true });
  d.text(M.X(8) + 4, M.Y(0.0082), 'median |w|', { cls: 'xs', a: 'start', color: C.slate });
  d.text(550, 70, 'int4 RMS error', { cls: 'ttl', size: 11 });
  [['one scale per row', '17.8%'], ['groups of 128', '11.7%'], ['groups of 32', '10.0%']].forEach(([l, v], i) => {
    d.text(490, 96 + i * 24, l, { cls: 'sm', a: 'start' });
    d.mono(630, 96 + i * 24, v, { size: 10.5, a: 'end', color: i === 0 ? C.ink : C.acc });
  });
  d.text(560, 158, '+0.016, +0.125, +0.5\nbits per weight for scales', { cls: 'xs', vc: true });
  return d.svg();
}

export function inf_dequant_paths() {
  const d = new D(640, 290, 'inf_dequant_paths');
  d.text(10, 16, 'BYTES MOVED THROUGH HBM PER WEIGHT, ONE DECODE STEP, LLAMA 3 8B ON AN H100', { cls: 'cap', a: 'start' });
  const hbm = (x, y, lab) => d.box(x, y, 96, 34, lab, { fill: C.slateSoft, stroke: C.slate, size: 10 });
  const chip = (x, y, lab, hot) => d.box(x, y, 120, 34, lab, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size: 10 });
  const lab = (x1, x2, y, t, col = C.ink2) => { d.arrow(x1, y, x2, y, { stroke: col, hl: 6 }); d.mono((x1 + x2) / 2, y - 9, t, { size: 9.5, color: col }); };
  const row = (y, name, total, ms, red) => { d.text(14, y + 10, name, { cls: 'ttl', a: 'start', size: 11 }); d.mono(14, y + 28, `${total} → ${ms}`, { size: 9.5, a: 'start', color: red ? C.red : C.acc }); };
  row(44, 'bf16', '2 B', '4.48 ms');
  hbm(150, 44, 'bf16 W'); lab(246, 300, 61, 'read 2'); chip(302, 44, 'matmul');
  row(110, 'int8, fused', '1 B', '2.24 ms');
  hbm(150, 110, 'int8 W + s'); lab(246, 300, 127, 'read 1', C.acc); chip(302, 110, 'dequantize in\nregisters + matmul', true);
  row(186, 'int8, naive', '5 B', '11.20 ms', true);
  hbm(150, 186, 'int8 W + s'); lab(246, 278, 203, 'read 1'); chip(280, 186, 'dequantize');
  d.arrow(340, 222, 340, 238, { stroke: C.red, hl: 5 }); d.mono(352, 232, 'write 2', { size: 9.5, a: 'start', color: C.red });
  hbm(292, 240, 'bf16 copy');
  d.arrow(390, 257, 448, 222, { stroke: C.red, hl: 5 }); d.mono(430, 252, 'read 2', { size: 9.5, a: 'start', color: C.red });
  chip(430, 186, 'matmul');
  d.hand(560, 90, 'smaller file,\nslower run', { size: 16, vc: true, color: C.red });
  return d.svg();
}

export function inf_scales_scene() {
  const d = new D(640, 250, 'inf_scales_scene');
  d.text(10, 16, 'PICTURE THIS: THE RECIPE SAYS 237.4 G OF FLOUR', { cls: 'cap', a: 'start' });
  const dial = (cx, title, step, read, ok) => {
    const cy = 170, r = 110;
    d.text(cx, 40, title, { cls: 'ttl', size: 11 });
    d.path(`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`, { stroke: C.ink2, sw: 1.2, single: true });
    const A = (g) => Math.PI - (g / 400) * Math.PI;
    for (let g = 0; g <= 400; g += step) { const a = A(g), big = g % 100 === 0; d.line(cx + (r - (big ? 14 : 7)) * Math.cos(a), cy - (r - (big ? 14 : 7)) * Math.sin(a), cx + r * Math.cos(a), cy - r * Math.sin(a), { stroke: big ? C.ink : C.gray, sw: big ? 1.2 : 0.6, single: true, rough: 0 }); if (big) d.text(cx + (r - 26) * Math.cos(a), cy - (r - 26) * Math.sin(a), String(g), { cls: 'xs' }); }
    const at = A(237.4); d.line(cx, cy, cx + (r - 4) * Math.cos(at), cy - (r - 4) * Math.sin(at), { stroke: C.acc, sw: 1.6, single: true });
    d.dot(cx, cy, 4, C.ink);
    d.mono(cx, cy + 22, `reads ${read} g`, { size: 10.5, color: ok ? C.acc : C.red });
  };
  dial(160, 'scale in 5 g steps', 5, '235 or 240', true);
  dial(480, 'scale in 100 g steps', 100, '200', false);
  d.text(160, 214, 'error ≤ 2.5 g: the cake is fine', { cls: 'xs', color: C.acc });
  d.text(480, 214, 'error up to 50 g: the cake is not', { cls: 'xs', color: C.red });
  d.hand(320, 240, 'quantization chooses the step size of the scale', { size: 15 });
  return d.svg();
}

export function inf_format_costs() {
  const d = new D(640, 240, 'inf_format_costs');
  d.text(10, 16, 'LLAMA 3 8B: WEIGHT SIZE AND DECODE LOWER BOUND PER FORMAT (H100, FUSED KERNELS)', { cls: 'cap', a: 'start' });
  const rows = [['bf16', 16.06, 4.48], ['int8', 8.03, 2.24], ['int4, groups of 128', 4.14, 1.16]];
  d.text(250, 44, 'weights (GB)', { cls: 'ttl', size: 11 });
  d.text(500, 44, 'ms per token, batch 1', { cls: 'ttl', size: 11 });
  rows.forEach(([n, gb, ms], i) => {
    const y = 64 + i * 46, hot = i === 2;
    d.text(150, y + 13, n, { cls: 'sm', a: 'end' });
    d.rect(160, y, gb / 16.06 * 180, 26, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, r: 3 });
    d.mono(160 + gb / 16.06 * 180 + 6, y + 13, gb.toFixed(2), { size: 10, a: 'start' });
    d.rect(410, y, ms / 4.48 * 180, 26, { fill: hot ? C.accSoft : C.slateSoft, stroke: hot ? C.acc : C.slate, r: 3 });
    d.mono(410 + ms / 4.48 * 180 + 6, y + 13, ms.toFixed(2), { size: 10, a: 'start' });
  });
  d.text(320, 218, 'decode time follows bytes almost one for one, because decode is bandwidth-bound', { cls: 'xs' });
  return d.svg();
}

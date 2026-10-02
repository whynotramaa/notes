import { D, C } from '../lib/draw.js';

export function block_diff() {
  const d = new D(640, 400, 'block_diff');
  d.text(10, 16, 'GPT-2 STYLE (FINCH-19) VERSUS LLAMA 3 STYLE (FINCH-24): SAME SKELETON, SWAPPED PARTS', { cls: 'cap', a: 'start' });
  const col = (x0, title, parts) => {
    d.text(x0 + 140, 40, title, { cls: 'ttl' });
    const sx = x0 + 30;
    d.line(sx, 380, sx, 56, { stroke: C.acc, sw: 2.2 });
    parts.forEach(([lab, changed, tag], i) => {
      const y = 340 - i * 46;
      d.box(sx + 30, y, 190, 32, lab, { fill: changed ? C.accSoft : C.card, stroke: changed ? C.acc : C.ink2, size: 10.5 });
      if (tag) d.mono(sx + 236, y + 16, tag, { size: 9, a: 'start', color: C.acc });
      d.line(sx, y + 16, sx + 28, y + 16, { stroke: C.line, sw: 0.8, single: true });
    });
  };
  col(10, 'Finch-19 (2019 recipe)', [['tokens + learned positions', false], ['LayerNorm', false], ['MHA, 8 K/V heads, by hand', false], ['+ residual', false], ['LayerNorm', false], ['GELU MLP, 2,048', false], ['+ residual', false]]);
  col(330, 'Finch-24 (2024 recipe)', [['tokens only (RoPE in attention)', true, 'I'], ['RMSNorm', true, 'II'], ['GQA 8 q / 2 kv + RoPE, SDPA', true, 'IV, V, VI'], ['+ residual', false], ['RMSNorm', true, 'II'], ['SwiGLU MLP, 1,536', true, 'III'], ['+ residual', false]]);
  d.line(322, 34, 322, 390, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.text(320, 396, 'biases removed everywhere on the right', { cls: 'xs' });
  return d.svg();
}

export function upgrades_table() {
  const d = new D(640, 330, 'upgrades_table');
  d.text(10, 16, 'APPLYING THE UPGRADES TO ONE FINCH BLOCK, ONE AT A TIME', { cls: 'cap', a: 'start' });
  const rows = [['Finch-19 block', 1050624, 2099712, 2048, 2048], ['+ RoPE', 1050624, 2099712, 2048, 2048], ['+ RMSNorm', 1050624, 2099712, 1024, 2048], ['+ SwiGLU (1,536)', 1050624, 2362880, 1024, 2048], ['+ GQA (2 K/V heads)', 656640, 2362880, 1024, 512], ['+ SDPA / Flash', 656640, 2362880, 1024, 512], ['− biases = Finch-24', 655360, 2359296, 1024, 512]];
  const hx = [170, 290, 400, 490, 600];
  ['step', 'attention', 'MLP', 'norms', 'KV bytes/token'].forEach((h, i) => d.text(i === 0 ? 20 : hx[i], 44, h, { cls: 'cap', a: i === 0 ? 'start' : 'end' }));
  d.line(16, 52, 624, 52, { stroke: C.ink, sw: 1.2, single: true });
  rows.forEach((r, i) => {
    const y = 74 + i * 34, prev = rows[i - 1];
    d.text(20, y, r[0], { cls: 'sm', a: 'start', color: i === 6 ? C.acc : C.ink });
    [1, 2, 3, 4].forEach((k) => {
      const changed = prev && prev[k] !== r[k];
      d.mono(hx[k], y, r[k].toLocaleString('en-US'), { size: 10, a: 'end', color: changed ? C.acc : C.ink });
    });
    d.line(16, y + 16, 624, y + 16, { stroke: C.faint, sw: 0.6, single: true });
  });
  d.text(20, 316, 'per layer; orange marks a number that changed at that step. Positions also drop a 524,288-parameter table at "+ RoPE".', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function llama_shapes() {
  const d = new D(640, 470, 'llama_shapes');
  d.text(10, 16, 'ONE LLAMA 3 8B BLOCK, TOP TO BOTTOM, WITH SHAPES  (T TOKENS)', { cls: 'cap', a: 'start' });
  const st = (y, lab, sh, o = {}) => { d.box(o.x ?? 200, y, o.w ?? 240, 30, lab, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, size: 10.5, cls: o.cls }); if (sh) d.mono((o.x ?? 200) + (o.w ?? 240) + 10, y + 15, sh, { size: 9.5, a: 'start', color: C.acc }); };
  st(36, 'x', '(T, 4096)', { cls: 'mono' });
  st(80, 'RMSNorm', '(T, 4096)', { fill: C.slateSoft, stroke: C.slate });
  st(124, 'q_proj', '(T, 32, 128)', { x: 30, w: 130 }); st(124, 'k_proj', '(T, 8, 128)', { x: 250, w: 110 }); st(124, 'v_proj', '(T, 8, 128)', { x: 450, w: 100 });
  st(168, 'RoPE on q and k', '', { x: 30, w: 330, fill: C.accSoft, stroke: C.acc });
  st(212, 'append k, v to KV cache (8 heads)', '', { x: 250, w: 300, fill: C.slateSoft, stroke: C.slate });
  st(256, 'SDPA, GQA groups of 4', '(T, 32, 128)', { fill: C.accSoft, stroke: C.acc });
  st(300, 'o_proj', '(T, 4096)');
  st(344, '+ residual, then RMSNorm', '(T, 4096)', { fill: C.slateSoft, stroke: C.slate });
  st(388, 'gate_proj', '(T, 14336)', { x: 40, w: 140 }); st(388, 'up_proj', '(T, 14336)', { x: 330, w: 140 });
  st(432, 'SiLU(gate) ⊙ up → down_proj → + residual', '(T, 4096)');
  for (const y of [66, 110, 154, 198, 242, 286, 330, 374, 418]) d.arrow(320, y + 1, 320, y + 13, { stroke: C.ink2, hl: 4 });
  return d.svg();
}

export function llama_params() {
  const d = new D(640, 280, 'llama_params');
  d.text(10, 16, 'WHERE ONE LLAMA 3 8B BLOCK’S 218,112,000 PARAMETERS LIVE', { cls: 'cap', a: 'start' });
  const parts = [['q_proj  4096 × 4096', 16777216, C.acc], ['k_proj  4096 × 1024', 4194304, C.slate], ['v_proj  4096 × 1024', 4194304, C.slate], ['o_proj  4096 × 4096', 16777216, C.acc], ['gate_proj  4096 × 14336', 58720256, C.ink2], ['up_proj  4096 × 14336', 58720256, C.ink2], ['down_proj  14336 × 4096', 58720256, C.ink2], ['2 RMSNorms', 8192, C.gray]];
  const tot = parts.reduce((a, p) => a + p[1], 0);
  parts.forEach(([n, v, col], i) => {
    const y = 36 + i * 28, w = Math.max(1.5, v / 58720256 * 300);
    d.text(196, y + 9, n, { cls: 'mono', size: 9.5, a: 'end' });
    d.rect(206, y, w, 18, { r: 2, fill: col, fop: 0.35, stroke: col, sw: 0.8 });
    d.mono(212 + w, y + 9, `${v.toLocaleString('en-US')}  (${(v / tot * 100).toFixed(1)}%)`, { size: 9, a: 'start' });
  });
  d.hand(520, 264, 'the MLP is 80.8% of the block', { size: 15 });
  return d.svg();
}

export function compute_split() {
  const d = new D(640, 230, 'compute_split');
  d.text(10, 16, 'FORWARD FLOPS PER GENERATED TOKEN, ONE LLAMA 3 8B BLOCK: LINEAR LAYERS VERSUS ATTENTION', { cls: 'cap', a: 'start' });
  const lin = 2 * 218112000;
  [1024, 8192, 131072].forEach((T, i) => {
    const y = 50 + i * 54, att = 4 * T * 4096, tot = lin + att, W = 420;
    d.text(110, y + 12, `${T.toLocaleString('en-US')} ctx`, { cls: 'mono', size: 10, a: 'end' });
    d.rect(120, y, W * lin / tot, 24, { r: 2, fill: C.slate, fop: 0.35, stroke: C.slate, sw: 0.8 });
    d.rect(120 + W * lin / tot, y, W * att / tot, 24, { r: 2, fill: C.acc, fop: 0.45, stroke: C.acc, sw: 0.8 });
    d.mono(548, y + 12, `attention ${(att / tot * 100).toFixed(1)}%`, { size: 9.5, a: 'start', color: C.acc });
  });
  d.text(330, 216, 'slate: projections + MLP, 2 × 218M ≈ 436M FLOPs.  orange: scores and value mixing, 4 · T · 4096', { cls: 'xs' });
  return d.svg();
}

export function porting_checklist() {
  const d = new D(640, 400, 'porting_checklist');
  d.text(10, 16, 'PORTING CHECKLIST: SETTINGS THAT CAN BE WRONG WITHOUT ANY ERROR', { cls: 'cap', a: 'start' });
  const items = [['rope_theta and rope_scaling', 'base and long-context method (Part I)'], ['pairing convention', 'interleaved or half-split (Part I)'], ['norm ε and γ form', 'γ or 1 + γ, ε value (Part II)'], ['intermediate_size', 'never assume 4d (Part III)'], ['gate / up order', 'which half is the gate (Part III)'], ['H, H_kv and grouping', 'repeat_interleave, not repeat (Part IV)'], ['causal alignment', 'decode with a cache (Part V)'], ['dtype', 'bf16 for the fast kernels (Part VI)'], ['biases', 'Qwen keeps q, k, v biases'], ['tied embeddings', 'tie_word_embeddings in the config']];
  items.forEach(([n, j], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 310, y = 34 + row * 72;
    d.rect(x, y, 290, 60, { r: 8, fill: C.card, stroke: C.ink2, sw: 1 });
    d.rect(x + 12, y + 16, 16, 16, { r: 3, stroke: C.acc, sw: 1.2 });
    d.text(x + 38, y + 24, n, { cls: 'ttl', a: 'start' });
    d.text(x + 38, y + 44, j, { cls: 'xs', a: 'start' });
    d.mono(x + 276, y + 24, String(i + 1).padStart(2, '0'), { size: 9, a: 'end', color: C.gray });
  });
  return d.svg();
}

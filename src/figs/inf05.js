import { D, C } from '../lib/draw.js';

export function inf_qwen_block() {
  const d = new D(640, 430, 'inf_qwen_block');
  d.text(10, 16, 'ONE QWEN3 DECODER LAYER, HUGGING FACE NAMES  (× 28)', { cls: 'cap', a: 'start' });
  const sx = 480;
  d.line(sx, 414, sx, 40, { stroke: C.acc, sw: 2.6 });
  d.head(sx, 40, -Math.PI / 2, { stroke: C.acc, sw: 1.8, hl: 10 });
  const b = (x, y, w, h, lab, hot, size = 10) => d.box(x, y, w, h, lab, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size, cls: 'mono' });
  b(180, 370, 200, 28, 'input_layernorm');
  b(180, 324, 64, 28, 'q_proj'); b(248, 324, 64, 28, 'k_proj'); b(316, 324, 64, 28, 'v_proj');
  b(180, 282, 64, 26, 'q_norm', true); b(248, 282, 64, 26, 'k_norm', true);
  b(180, 236, 200, 30, 'RoPE  +  SDPA (GQA 16 : 8)');
  b(180, 192, 200, 28, 'o_proj');
  b(180, 132, 200, 28, 'post_attention_layernorm', false, 9.5);
  b(180, 76, 200, 36, 'gate_proj, up_proj\nSiLU ⊙  →  down_proj', false, 9.5);
  [212, 280, 348].forEach((x) => d.arrow(280, 368, x, 354, { stroke: C.ink2, hl: 5 }));
  [212, 280].forEach((x) => { d.arrow(x, 322, x, 310, { stroke: C.ink2, hl: 5 }); d.arrow(x, 280, x, 268, { stroke: C.ink2, hl: 5 }); });
  d.arrow(348, 322, 348, 268, { stroke: C.ink2, hl: 5 });
  d.arrow(280, 234, 280, 222, { stroke: C.ink2, hl: 5 });
  d.arrow(280, 130, 280, 114, { stroke: C.ink2, hl: 5 });
  d.carrow([[sx, 410], [430, 404], [382, 386]], { stroke: C.gray, sw: 0.9 });
  d.circle(sx, 178, 20, { fill: C.paper, sw: 1 }); d.text(sx, 178, '+', { size: 13 });
  d.carrow([[382, 206], [430, 200], [sx - 11, 182]], { stroke: C.ink2, sw: 0.9 });
  d.carrow([[sx, 166], [430, 158], [382, 148]], { stroke: C.gray, sw: 0.9 });
  d.circle(sx, 58, 20, { fill: C.paper, sw: 1 }); d.text(sx, 58, '+', { size: 13 });
  d.carrow([[382, 92], [430, 82], [sx - 11, 62]], { stroke: C.ink2, sw: 0.9 });
  d.text(sx + 12, 300, 'residual stream\n(B, T, 1024)', { cls: 'sm', a: 'start', color: C.acc, vc: true });
  [[384, '(B, T, 1024)'], [338, 'q 2048 · k 1024 · v 1024'], [295, 'per head, 128 wide'], [251, 'θ = 1,000,000'], [206, '2048 → 1024'], [94, '1024 → 3072 → 1024']].forEach(([y, t]) => d.mono(172, y, t, { size: 9, a: 'end', color: C.gray }));
  d.hand(570, 120, 'new in Qwen3:\nthe two orange\nnorms', { size: 15, vc: true });
  return d.svg();
}

export function inf_config_map() {
  const d = new D(640, 330, 'inf_config_map');
  d.text(10, 16, 'TEN CONFIG KEYS, AND WHAT EACH ONE CONTROLS', { cls: 'cap', a: 'start' });
  const badge = (x, y, n) => { d.circle(x, y, 17, { fill: C.acc, stroke: C.acc, sw: 0.8 }); d.text(x, y + 0.5, String(n), { cls: 'mono', size: 9, color: C.onAcc }); };
  const keys = [['vocab_size', '151936', 1], ['hidden_size', '1024', 2], ['num_hidden_layers', '28', 3], ['num_attention_heads', '16', 4], ['num_key_value_heads', '8', 4], ['head_dim', '128', 5], ['intermediate_size', '3072', 6], ['rope_theta', '1000000', 7], ['rms_norm_eps', '1e-06', 8], ['tie_word_embeddings', 'true', 9]];
  keys.forEach(([k, v, n], i) => {
    const y = 36 + i * 28;
    d.rect(20, y, 204, 22, { fill: C.card, stroke: C.line, r: 4, sw: 0.8 });
    d.mono(30, y + 11, `${k}: `, { size: 9.5, a: 'start' });
    d.mono(216, y + 11, v, { size: 9.5, a: 'end', color: C.acc });
    badge(238, y + 11, n);
  });
  d.box(340, 272, 120, 38, 'embed_tokens\n151,936 × 1,024', { fill: C.slateSoft, stroke: C.slate, size: 9.5 });
  d.box(340, 36, 120, 38, 'lm_head\n(same matrix)', { fill: C.slateSoft, stroke: C.slate, size: 9.5 });
  badge(470, 291, 1); badge(470, 55, 1);
  d.arrow(400, 270, 400, 78, { stroke: C.acc, sw: 2 });
  badge(386, 200, 2);
  d.carrow([[338, 284], [306, 176], [338, 62]], { stroke: C.slate, dash: [4, 3] });
  badge(304, 176, 9);
  for (let i = 2; i >= 1; i--) d.rect(486 + i * 7, 96 - i * 7, 132, 170, { fill: C.paper, stroke: C.line, r: 8, sw: 0.8 });
  d.rect(486, 96, 132, 170, { fill: C.card, stroke: C.ink2, r: 8, sw: 1 });
  d.line(402, 181, 484, 181, { stroke: C.gray, sw: 0.9, single: true });
  badge(486, 84, 3);
  d.hand(588, 74, '× 28', { size: 18 });
  [['RMSNorm, ε 1e-6', 8], ['GQA: 16 q, 8 kv', 4], ['head size 128', 5], ['RoPE, θ 1e6', 7], ['SwiGLU, 3,072', 6]].forEach(([t, n], i) => {
    const y = 106 + i * 31;
    d.box(494, y, 100, 24, t, { fill: C.paper, stroke: C.ink2, size: 9, r: 4 });
    badge(606, y + 12, n);
  });
  return d.svg();
}

export function inf_headdim_trap() {
  const d = new D(640, 250, 'inf_headdim_trap');
  d.text(10, 16, 'HEAD SIZE: DERIVED (WRONG FOR QWEN3) vs READ FROM THE CONFIG', { cls: 'cap', a: 'start' });
  const panel = (cx, title, dh, hot) => {
    const u = 0.117, wq = 16 * dh * u, wx = 1024 * u;
    d.text(cx, 40, title, { cls: 'ttl', size: 11.5, color: hot ? C.acc : C.ink });
    d.rect(cx - wx / 2, 58, wx, 22, { fill: C.card, stroke: C.ink2, r: 3 });
    d.mono(cx + wx / 2 + 8, 69, 'x: 1,024', { size: 9.5, a: 'start' });
    d.arrow(cx, 82, cx, 106, { stroke: C.ink2, hl: 5 });
    d.text(cx - 8, 94, 'q_proj', { cls: 'xs', a: 'end' });
    d.rect(cx - wq / 2, 108, wq, 26, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.red, r: 3 });
    for (let h = 1; h < 16; h++) d.line(cx - wq / 2 + h * wq / 16, 110, cx - wq / 2 + h * wq / 16, 132, { stroke: hot ? C.acc : C.red, sw: 0.5, single: true });
    d.mono(cx, 148, `16 heads × ${dh} = ${(16 * dh).toLocaleString('en-US')}`, { size: 10, color: hot ? C.acc : C.red });
    d.arrow(cx, 158, cx, 182, { stroke: C.ink2, hl: 5 });
    d.text(cx - 8, 170, 'o_proj', { cls: 'xs', a: 'end' });
    d.rect(cx - wx / 2, 184, wx, 22, { fill: C.card, stroke: C.ink2, r: 3 });
    d.mono(cx + wx / 2 + 8, 195, 'out: 1,024', { size: 9.5, a: 'start' });
  };
  panel(160, 'd_head = 1024 / 16 = 64', 64, false);
  panel(460, 'head_dim = 128 (config)', 128, true);
  d.line(310, 34, 310, 214, { stroke: C.faint, sw: 0.8, single: true });
  d.text(160, 232, 'q_proj (1024, 1024): checkpoint will not load', { cls: 'xs', color: C.red });
  d.text(460, 232, 'q_proj (2048, 1024): matches the file', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function inf_param_ledger() {
  const d = new D(640, 240, 'inf_param_ledger');
  d.text(10, 16, 'QWEN3-0.6B: 596,049,920 PARAMETERS, AND ONE LAYER OF 15,730,944', { cls: 'cap', a: 'start' });
  const x0 = 40, W = 560;
  const parts = [[155582464, 'embedding (tied with LM head)', C.slateSoft, C.slate], [176167936, '28 × attention', C.card, C.ink2], [264241152, '28 × MLP', C.accSoft, C.acc]];
  const tot = 596049920;
  let x = x0;
  parts.forEach(([n, lab, f, s]) => {
    const w = n / tot * W;
    d.rect(x, 50, w, 40, { fill: f, stroke: s, r: 3, sw: 1 });
    d.text(x + w / 2, 64, lab, { cls: 'xs', color: C.ink });
    d.mono(x + w / 2, 78, `${n.toLocaleString('en-US')}  (${(n / tot * 100).toFixed(1)}%)`, { size: 9 });
    x += w;
  });
  d.text(x0 + W, 104, 'norms: 58,368 (0.01%)', { cls: 'xs', a: 'end' });
  const lx0 = 40 + 0.261 * W * 0, ly = 150;
  d.text(x0, 136, 'one layer', { cls: 'ttl', a: 'start', size: 11 });
  const lw = 400;
  [[6291712, 'attention: q, k, v, o + q_norm, k_norm', C.card, C.ink2], [9437184, 'MLP: gate, up, down', C.accSoft, C.acc]].reduce((xx, [n, lab, f, s]) => {
    const w = n / 15730944 * lw;
    d.rect(xx, ly, w, 34, { fill: f, stroke: s, r: 3 });
    d.text(xx + w / 2, ly + 11, lab, { cls: 'xs', color: C.ink });
    d.mono(xx + w / 2, ly + 24, `${n.toLocaleString('en-US')} (${(n / 15730944 * 100).toFixed(0)}%)`, { size: 9 });
    return xx + w;
  }, lx0 + 0);
  d.text(x0 + lw + 10, ly + 17, '+ 2,048 norm gains', { cls: 'xs', a: 'start' });
  d.hand(470, 222, 'a big vocabulary is expensive in a small model', { size: 15 });
  return d.svg();
}

export function inf_linear_layout() {
  const d = new D(640, 300, 'inf_linear_layout');
  d.text(10, 16, 'PYTORCH STORES LINEAR WEIGHTS AS (OUT, IN): HEADS ARE BANDS OF ROWS, OR OF COLUMNS', { cls: 'cap', a: 'start' });
  const qx = 76, qy = 44, qw = 64, qh = 128;
  for (let h = 0; h < 16; h++) d.fillRect(qx, qy + h * 8, qw, 8, h === 0 ? C.accSoft : h % 2 ? C.slateSoft : C.card, 1);
  d.rect(qx, qy, qw, qh, { r: 0, sw: 1.1 });
  d.vbrace(qx - 6, qy, qy + qh, { dir: -1, label: 'out 2,048' });
  d.brace(qx, qx + qw, qy + qh + 8, { label: 'in 1,024' });
  d.text(qx + qw + 8, qy + 4, 'rows 0 to 127: head 0', { cls: 'xs', a: 'start', color: C.acc });
  d.text(qx + qw / 2, 30, 'q_proj.weight', { cls: 'mono', size: 10 });
  d.rect(230, 100, 120, 16, { fill: C.card, stroke: C.ink2, r: 2 });
  d.mono(290, 90, 'x  (1, 1024)', { size: 9.5 });
  d.mono(380, 108, '@ Wᵀ =', { size: 10 });
  for (let h = 0; h < 16; h++) d.rect(420 + h * 12, 100, 12, 16, { fill: h === 0 ? C.accSoft : C.slateSoft, stroke: h === 0 ? C.acc : C.slate, r: 0, sw: 0.6 });
  d.mono(516, 90, 'q  (1, 2048)', { size: 9.5 });
  d.text(516, 130, '16 heads × 128', { cls: 'xs' });
  const ox = 60, oy = 222, ow = 128, oh = 64;
  for (let h = 0; h < 16; h++) d.fillRect(ox + h * 8, oy, 8, oh, h === 0 ? C.accSoft : h % 2 ? C.slateSoft : C.card, 1);
  d.rect(ox, oy, ow, oh, { r: 0, sw: 1.1 });
  d.text(ox + ow / 2, oy - 10, 'o_proj.weight  (1024, 2048)', { cls: 'mono', size: 10 });
  d.text(ox + ow + 12, oy + 20, 'columns 0 to 127 read head 0;', { cls: 'xs', a: 'start', color: C.acc });
  d.text(ox + ow + 12, oy + 36, 'each output mixes all 16 heads back into 1,024 numbers', { cls: 'xs', a: 'start' });
  d.hand(470, 176, 'output size comes first', { size: 15 });
  return d.svg();
}

export function inf_qk_norm() {
  const d = new D(640, 256, 'inf_qk_norm');
  d.text(10, 16, 'QK-NORM BOUNDS THE SCORES  (SKETCH IN 2D, LENGTHS ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const panel = (cx, cy, title, lens, ok) => {
    d.text(cx, 40, title, { cls: 'ttl', size: 11 });
    d.circle(cx, cy, 120, { stroke: ok ? C.acc : C.line, sw: ok ? 1.3 : 0.8, dash: ok ? undefined : [4, 3] });
    const ang = [0.35, 0.6, 1.4, 2.3];
    lens.forEach((L, i) => {
      const a = ang[i], col = i % 2 ? C.slate : C.acc;
      d.arrow(cx, cy, cx + L * Math.cos(a), cy - L * Math.sin(a), { stroke: col, sw: 1.3, hl: 6 });
    });
    d.dot(cx, cy, 2.5, C.ink);
  };
  panel(170, 134, 'without: lengths grow with the weights', [92, 84, 78, 70], false);
  panel(470, 134, 'with: every head rescaled to one length', [60, 60, 60, 60], true);
  d.text(170, 222, 'scores q·k can grow without limit', { cls: 'xs' });
  d.text(470, 222, 'unit gains: length √128 ≈ 11.31, |score| ≤ 11.31', { cls: 'xs', color: C.acc });
  d.text(320, 242, 'orange arrows: queries   slate arrows: keys', { cls: 'xs' });
  return d.svg();
}

export function inf_qwen_attention() {
  const d = new D(640, 420, 'inf_qwen_attention');
  d.text(10, 16, 'QWEN3-0.6B ATTENTION, PREFILL OF T TOKENS, EVERY SHAPE', { cls: 'cap', a: 'start' });
  const box = (x, y, w, lab, sh, hot) => { d.box(x, y, w, 30, lab, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size: 10.5 }); if (sh) d.mono(x + w / 2, y + 42, sh, { size: 9.5, color: hot ? C.acc : C.gray }); };
  box(250, 34, 140, 'RMSNorm(x)', '(B, T, 1024)');
  [[60, 'q_proj → view', '(B, T, 16, 128)'], [250, 'k_proj → view', '(B, T, 8, 128)'], [440, 'v_proj → view', '(B, T, 8, 128)']].forEach(([x, l, s]) => { d.arrow(320, 84, x + 70, 98, { stroke: C.ink2, hl: 6 }); box(x, 100, 140, l, s); });
  [[60, 'q_norm (128 gains)'], [250, 'k_norm (128 gains)']].forEach(([x, l]) => { d.arrow(x + 70, 144, x + 70, 164, { stroke: C.ink2, hl: 6 }); box(x, 166, 140, l, 'same shape', true); });
  [60, 250].forEach((x) => { d.arrow(x + 70, 210, x + 70, 230, { stroke: C.ink2, hl: 6 }); box(x, 232, 140, 'RoPE, θ = 10⁶', null); });
  d.arrow(510, 144, 510, 296, { stroke: C.ink2, hl: 6 });
  [130, 320].forEach((x) => d.arrow(x, 264, x, 296, { stroke: C.ink2, hl: 6 }));
  box(60, 298, 520, 'transpose → SDPA, causal, scale 1/√128, enable_gqa  →  (B, 16, T, 128)', null);
  d.arrow(320, 330, 320, 348, { stroke: C.ink2, hl: 6 });
  box(60, 350, 520, 'transpose, reshape (B, T, 2048)   →   o_proj   →   (B, T, 1024)   →   + residual', null, true);
  d.hand(520, 252, 'v is never\nnormalized\nor rotated', { size: 14, vc: true });
  return d.svg();
}

export function inf_swiglu_qwen() {
  const d = new D(640, 262, 'inf_swiglu_qwen');
  d.text(10, 16, 'QWEN3-0.6B MLP, BAR HEIGHT = WIDTH  (1,024 → 3,072 → 1,024)', { cls: 'cap', a: 'start' });
  const u = 0.05, mid = 140;
  const bar = (x, n, lab, f, s, sub) => { const h = n * u; d.rect(x, mid - h / 2, 30, h, { fill: f, stroke: s, r: 3 }); d.text(x + 15, mid + h / 2 + 14, lab, { cls: 'mono', size: 9.5 }); if (sub) d.text(x + 15, mid + h / 2 + 27, sub, { cls: 'xs' }); };
  bar(40, 1024, 'x', C.card, C.ink2, '1,024');
  d.arrow(74, 126, 150, 92, { stroke: C.ink2, hl: 5 }); d.text(104, 96, 'gate_proj', { cls: 'xs' });
  d.arrow(74, 154, 150, 190, { stroke: C.ink2, hl: 5 }); d.text(104, 186, 'up_proj', { cls: 'xs' });
  const gh = 3072 * u * 0.55;
  d.rect(152, 92 - gh / 2, 30, gh, { fill: C.slateSoft, stroke: C.slate, r: 3 }); d.text(167, 92 - gh / 2 - 8, 'gate 3,072', { cls: 'xs', color: C.slate });
  d.rect(152, 190 - gh / 2, 30, gh, { fill: C.card, stroke: C.ink2, r: 3 }); d.text(167, 190 + gh / 2 + 10, 'up 3,072', { cls: 'xs' });
  d.arrow(184, 92, 226, 92, { stroke: C.slate, hl: 5 });
  d.box(228, 78, 60, 28, 'SiLU', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.circle(330, 140, 30, { fill: C.paper, stroke: C.acc, sw: 1.3 }); d.text(330, 140, '⊙', { size: 15, color: C.acc });
  d.carrow([[288, 92], [318, 104], [326, 124]], { stroke: C.slate });
  d.carrow([[184, 190], [300, 180], [326, 156]], { stroke: C.ink2 });
  d.arrow(346, 140, 380, 140, { stroke: C.acc, hl: 5 });
  bar(382, 3072, 'h', C.accSoft, C.acc, '3,072');
  d.arrow(414, 140, 470, 140, { stroke: C.ink2, hl: 5 }); d.text(442, 130, 'down_proj', { cls: 'xs' });
  bar(472, 1024, 'out', C.card, C.ink2, '1,024');
  d.text(580, 110, '3 × 1,024 × 3,072\n= 9,437,184\nper layer', { cls: 'sm', vc: true });
  d.hand(570, 210, '60% of every layer', { size: 15 });
  return d.svg();
}

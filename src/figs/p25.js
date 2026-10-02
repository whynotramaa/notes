import { D, C } from '../lib/draw.js';

export function sdpa_lines() {
  const d = new D(640, 260, 'sdpa_lines');
  d.text(10, 16, 'SIX HAND-WRITTEN LINES (CHAPTER 1) BECOME ONE FUSED CALL', { cls: 'cap', a: 'start' });
  d.rect(10, 34, 320, 200, { r: 8, fill: C.card, sw: 1 });
  const L = ['s = q @ k.transpose(-2, -1)', 's = s / math.sqrt(q.size(-1))', 's = s.masked_fill(mask, -inf)', 'w = s.softmax(dim=-1)', 'w = dropout(w, p)', 'o = w @ v'];
  L.forEach((l, i) => d.mono(24, 60 + i * 28, l, { size: 9.5, a: 'start' }));
  d.text(170, 226, 'writes the T × T grid s and w to memory', { cls: 'xs', color: C.red });
  d.rect(372, 84, 258, 96, { r: 8, fill: C.accFaint, stroke: C.acc, sw: 1.1 });
  ['o = F.scaled_dot_product_attention(', '    q, k, v,', '    is_causal=True,', '    dropout_p=p if training else 0.0)'].forEach((l, i) => d.mono(384, 108 + i * 20, l, { size: 9.5, a: 'start' }));
  d.carrow([[332, 74], [352, 100], [370, 112]], { stroke: C.acc, sw: 1 });
  d.carrow([[332, 186], [352, 168], [370, 152]], { stroke: C.acc, sw: 1 });
  d.text(500, 200, 'same answer; can run as one kernel', { cls: 'xs' });
  d.text(500, 214, 'that never stores the grid', { cls: 'xs' });
  return d.svg();
}

export function sdpa_args() {
  const d = new D(640, 330, 'sdpa_args');
  d.text(10, 16, 'THE ARGUMENTS OF scaled_dot_product_attention', { cls: 'cap', a: 'start' });
  const items = [['query', '(B, H, L, E)  L = query length'], ['key, value', '(B, H_kv, S, E)  S = key length'], ['attn_mask', 'bool (True = may attend) or float added to scores'], ['dropout_p', 'probability of dropping a weight; 0 at eval'], ['is_causal', 'apply a causal triangle (top-left aligned)'], ['scale', 'defaults to 1 / √E'], ['enable_gqa', 'accept H_kv < H and share heads (PyTorch 2.5+)'], ['returns', '(B, H, L, E)']];
  items.forEach(([n, j], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 310, y = 34 + row * 72;
    d.rect(x, y, 290, 60, { r: 8, fill: i === 4 ? C.accFaint : C.card, stroke: i === 4 ? C.acc : C.ink2, sw: 1 });
    d.text(x + 14, y + 22, n, { cls: 'mono', size: 11.5, a: 'start' });
    d.text(x + 14, y + 44, j, { cls: 'xs', a: 'start' });
  });
  return d.svg();
}

export function dispatcher() {
  const d = new D(640, 300, 'dispatcher');
  d.text(10, 16, 'HOW SDPA PICKS A KERNEL (SIMPLIFIED, CUDA GPU)', { cls: 'cap', a: 'start' });
  const q = (x, y, t) => d.box(x, y, 170, 34, t, { fill: C.paper, stroke: C.ink2, size: 10.5 });
  const k = (x, y, t, col) => d.box(x, y, 150, 34, t, { fill: col === C.acc ? C.accSoft : col === C.slate ? C.slateSoft : C.card, stroke: col, size: 11 });
  q(30, 40, 'fp16 or bf16?');
  q(30, 120, 'no custom mask tensor?');
  q(30, 200, 'head size supported?');
  k(460, 120, 'FlashAttention', C.acc);
  k(460, 200, 'memory-efficient', C.slate);
  k(460, 260, 'math (fallback)', C.red);
  d.arrow(115, 76, 115, 118, { stroke: C.ink2 }); d.text(124, 98, 'yes', { cls: 'xs', a: 'start' });
  d.arrow(115, 156, 115, 198, { stroke: C.ink2 }); d.text(124, 178, 'yes', { cls: 'xs', a: 'start' });
  d.carrow([[202, 217], [330, 150], [458, 137]], { stroke: C.acc, sw: 1.2 }); d.text(320, 162, 'yes', { cls: 'xs', color: C.acc });
  d.carrow([[202, 57], [380, 120], [458, 212]], { stroke: C.slate }); d.text(300, 82, 'no (fp32)', { cls: 'xs', color: C.slate });
  d.carrow([[202, 137], [340, 190], [458, 214]], { stroke: C.slate }); d.text(320, 186, 'no (mask)', { cls: 'xs', color: C.slate });
  d.carrow([[115, 236], [200, 270], [458, 277]], { stroke: C.red, dash: [4, 3] }); d.text(250, 286, 'nothing else applies', { cls: 'xs', color: C.red });
  d.hand(540, 60, 'fp32 skips Flash\nimmediately', { size: 15, vc: true, color: C.slate });
  return d.svg();
}

export function fallback_memory() {
  const d = new D(640, 240, 'fallback_memory');
  d.text(10, 16, 'MEMORY FOR ONE LAYER’S ATTENTION WEIGHTS: MATH KERNEL VERSUS A FUSED KERNEL  (8 HEADS, bf16)', { cls: 'cap', a: 'start' });
  const Ts = [1024, 4096, 16384, 65536];
  const L = (b) => Math.max(1, (Math.log10(b) - 4) / (11 - 4) * 400);
  Ts.forEach((T, i) => {
    const y = 44 + i * 44, math = 8 * T * T * 2, fused = 8 * 128 * 64 * 2 * 4;
    d.text(110, y + 14, `T = ${T.toLocaleString('en-US')}`, { cls: 'mono', size: 10, a: 'end' });
    d.rect(120, y, L(math), 16, { r: 2, fill: C.red, fop: 0.3, stroke: C.red, sw: 0.8 });
    d.mono(126 + L(math), y + 8, math >= 1e9 ? `${(math / 2 ** 30).toFixed(1)} GiB` : `${(math / 2 ** 20).toFixed(0)} MiB`, { size: 9, a: 'start' });
    d.rect(120, y + 18, L(fused), 10, { r: 2, fill: C.acc, fop: 0.5, stroke: C.acc, sw: 0.8 });
  });
  d.text(120, 226, 'red: full T × T weights (math).  orange: on-chip tiles only, a fixed few hundred KiB (fused)', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function bool_mask() {
  const d = new D(640, 250, 'bool_mask');
  d.text(10, 16, 'BOOLEAN MASKS IN SDPA: True MEANS “MAY ATTEND”  (3 REAL TOKENS + 2 PADDING)', { cls: 'cap', a: 'start' });
  const T = 5, cs = 28;
  const panel = (x, title, ok, bad) => {
    d.text(x + T * cs / 2, 44, title, { cls: 'ttl', size: 11, color: bad ? C.red : C.ink });
    d.grid(x, 56, T, T, cs, cs, { cellFill: (r, c) => (ok(r, c) ? (bad ? C.paper : C.accSoft) : C.faint), val: (r, c) => (ok(r, c) ? 'T' : 'F'), vsize: 10, vcolor: (r, c) => (bad && ok(r, c) && r < 3 ? C.red : C.ink), lsw: 0.4 });
  };
  const right = (r, c) => c < 3, wrong = (r, c) => !(c < 3);
  panel(60, 'correct: pad columns False', right, false);
  panel(380, 'inverted: real tokens see only padding', wrong, true);
  d.text(320, 220, 'Both are valid boolean masks. The inverted one runs without error and reads garbage.', { cls: 'xs' });
  return d.svg();
}

export function causal_align() {
  const d = new D(640, 250, 'causal_align');
  d.text(10, 16, 'is_causal WITH 1 QUERY AND 6 KEYS (DECODE): WHERE DOES THE TRIANGLE SIT?', { cls: 'cap', a: 'start' });
  const S = 6, cs = 26;
  const panel = (x, title, rows, ok, good) => {
    d.text(x + S * cs / 2, 44, title, { cls: 'ttl', size: 11, color: good ? C.ink : C.red });
    d.grid(x, 60, rows, S, cs, cs, { cellFill: (r, c) => (ok(r, c) ? (good ? C.accSoft : C.paper) : C.faint), lsw: 0.4 });
  };
  panel(40, 'square 6 × 6: fine', 6, (r, c) => c <= r, true);
  panel(260, 'top-left (is_causal=True): wrong', 1, (r, c) => c <= r, false);
  panel(460, 'bottom-right: correct', 1, (r, c) => c <= r + S - 1, true);
  d.text(338, 104, 'new token sees only key 0', { cls: 'xs', color: C.red });
  d.text(538, 104, 'new token sees all 6 keys', { cls: 'xs' });
  d.text(400, 150, 'fix for decode: is_causal=False with one new query,', { cls: 'sm' });
  d.text(400, 168, 'or torch.nn.attention.bias.causal_lower_right(L, S)', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function sdpa_shapes() {
  const d = new D(640, 230, 'sdpa_shapes');
  d.text(10, 16, 'GETTING INTO (B, H, T, d) AND BACK  (FINCH-24 QUERIES)', { cls: 'cap', a: 'start' });
  const steps = [['q_proj(x)', '(B, T, 512)'], ['.view(B, T, 8, 64)', '(B, T, 8, 64)'], ['.transpose(1, 2)', '(B, 8, T, 64)'], ['SDPA', '(B, 8, T, 64)'], ['.transpose(1, 2)', '(B, T, 8, 64)'], ['.reshape(B, T, 512)', '(B, T, 512)']];
  steps.forEach(([op, sh], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 20 + col * 210, y = 50 + row * 90;
    d.box(x, y, 180, 32, op, { cls: 'mono', size: 10, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 });
    d.mono(x + 90, y + 48, sh, { size: 10, color: C.acc });
    if (col < 2) d.arrow(x + 182, y + 16, x + 208, y + 16, { stroke: C.ink2 });
  });
  d.carrow([[560, 92], [600, 120], [110, 120], [110, 138]], { stroke: C.ink2, sw: 0.9 });
  d.hand(320, 222, 'reshape after transpose needs contiguous memory: use .reshape, not .view', { size: 14 });
  return d.svg();
}

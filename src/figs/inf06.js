import { D, C } from '../lib/draw.js';

function doc(d, x, y, w, h, o = {}) {
  const f = 14;
  d.poly([[x, y], [x + w - f, y], [x + w, y + f], [x + w, y + h], [x, y + h]], { fill: o.fill ?? C.paper, stroke: o.stroke ?? C.ink2, sw: 1 });
  d.lines([[x + w - f, y], [x + w - f, y + f], [x + w, y + f]], { stroke: o.stroke ?? C.ink2, sw: 0.8, single: true });
}

function gear(d, cx, cy, r, col) {
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d.line(cx + r * Math.cos(a), cy + r * Math.sin(a), cx + (r + 6) * Math.cos(a), cy + (r + 6) * Math.sin(a), { stroke: col, sw: 3, single: true, rough: 0.3 }); }
  d.circle(cx, cy, 2 * r, { fill: C.paper, stroke: col, sw: 1.4 });
  d.circle(cx, cy, r * 0.7, { stroke: col, sw: 1 });
}

export function inf_safetensors_layout() {
  const d = new D(640, 320, 'inf_safetensors_layout');
  d.text(10, 16, 'MODEL.SAFETENSORS FOR QWEN3-0.6B: 1,503,300,328 BYTES, THREE ZOOMS', { cls: 'cap', a: 'start' });
  const x0 = 30, W = 580, tot = 1503300328, X = (b) => x0 + b / tot * W;
  d.text(x0, 40, 'the whole file', { cls: 'ttl', a: 'start', size: 11 });
  const base = 35560;
  d.fillRect(x0, 50, 3, 30, C.acc, 1);
  d.rect(X(base), 50, X(base + 311164928) - X(base), 30, { fill: C.slateSoft, stroke: C.slate, r: 2, sw: 0.8 });
  d.text((X(base) + X(base + 311164928)) / 2, 65, 'lm_head', { cls: 'xs', color: C.ink });
  d.rect(X(base + 311164928), 50, X(base + 622329856) - X(base + 311164928), 30, { fill: C.slateSoft, stroke: C.slate, r: 2, sw: 0.8 });
  d.text((X(base + 311164928) + X(base + 622329856)) / 2, 65, 'embed_tokens', { cls: 'xs', color: C.ink });
  for (let i = 0; i < 28; i++) { const a = X(base + 622329856 + i * 31461888), b = X(base + 622329856 + (i + 1) * 31461888); d.fillRect(a + 0.5, 51.5, b - a - 1, 27, i % 2 ? C.card : C.faint, 1); }
  d.rect(X(base + 622329856), 50, W - (X(base + 622329856) - x0), 30, { stroke: C.ink2, r: 2, sw: 0.8 });
  d.text((X(base + 622329856) + x0 + W) / 2, 65, '28 layers × 31,461,888 bytes  (+ final norm)', { cls: 'xs', color: C.ink });
  d.line(x0, 82, x0, 112, { stroke: C.acc, dash: [3, 3], sw: 0.8, single: true });
  d.line(x0 + 3, 82, x0 + W, 112, { stroke: C.acc, dash: [3, 3], sw: 0.8, single: true });
  d.text(x0, 124, 'the first 35,560 bytes', { cls: 'ttl', a: 'start', size: 11 });
  d.box(x0, 134, 110, 34, 'N = 35,552', { cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc });
  d.box(x0 + 112, 134, 360, 34, '{ "lm_head.weight": {…}, …, "__metadata__": {"format": "pt"} }', { cls: 'mono', size: 9.5, fill: C.card });
  d.box(x0 + 474, 134, 106, 34, 'data →', { cls: 'mono', size: 10, fill: C.slateSoft, stroke: C.slate });
  d.brace(x0, x0 + 110, 174, { label: '8 bytes, u64 little-endian' });
  d.brace(x0 + 112, x0 + 472, 174, { label: 'JSON header: 311 entries' });
  d.rect(x0, 216, 300, 78, { fill: C.paper, stroke: C.ink2, r: 6, sw: 1 });
  ['"model.layers.0.self_attn.q_proj.weight":', '  "dtype": "BF16", "shape": [2048, 1024],', '  "data_offsets": [647500288, 651694592]'].forEach((l, i) => d.mono(x0 + 10, 234 + i * 20, l, { size: 9.5, a: 'start', color: i === 2 ? C.acc : C.ink }));
  d.carrow([[x0 + 300, 274], [400, 280], [470, 252]], { stroke: C.acc });
  d.grid(470, 226, 2, 6, 22, 14, { cellFill: () => C.slateSoft, lineColor: C.slate });
  d.text(536, 274, '4,194,304 bytes\n= 2,048 × 1,024 × 2', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function inf_pickle_vs_safe() {
  const d = new D(640, 260, 'inf_pickle_vs_safe');
  d.text(10, 16, 'WHAT THE LOADER IS HANDED', { cls: 'cap', a: 'start' });
  d.text(160, 42, 'pytorch_model.bin (pickle)', { cls: 'ttl', size: 11 });
  doc(d, 40, 56, 200, 150);
  ['rebuild Tensor(storage 0, …)', 'rebuild Tensor(storage 1, …)', '…', 'call  os.system("…")'].forEach((l, i) => d.mono(52, 80 + i * 26, l, { size: 9.5, a: 'start', color: i === 3 ? C.red : C.ink }));
  d.arrow(244, 130, 276, 130, { stroke: C.ink2 });
  gear(d, 300, 130, 14, C.red);
  d.text(300, 172, 'follows every\ninstruction', { cls: 'xs', vc: true, color: C.red });
  d.line(330, 34, 330, 236, { stroke: C.faint, sw: 0.8, single: true });
  d.text(480, 42, 'model.safetensors', { cls: 'ttl', size: 11 });
  doc(d, 360, 56, 200, 150);
  ['{"name": {dtype, shape,', '          offsets}, …}'].forEach((l, i) => d.mono(372, 80 + i * 18, l, { size: 9.5, a: 'start' }));
  d.grid(372, 128, 4, 10, 17, 14, { cellFill: () => C.slateSoft, lineColor: C.slate, lsw: 0.4 });
  d.arrow(564, 130, 594, 130, { stroke: C.ink2 });
  d.box(596, 116, 40, 28, 'copy', { size: 9.5, fill: C.accSoft, stroke: C.acc, r: 4 });
  d.text(480, 222, 'a table of contents and a block of bytes:\nnothing to execute', { cls: 'xs', vc: true, color: C.acc });
  d.text(160, 222, 'a program for rebuilding objects', { cls: 'xs' });
  return d.svg();
}

export function inf_module_tree() {
  const d = new D(640, 310, 'inf_module_tree');
  d.text(10, 16, 'A STATE-DICT KEY IS THE PATH THROUGH THE MODULE TREE', { cls: 'cap', a: 'start' });
  const path = [['Qwen3ForCausalLM', ''], ['model', 'lm_head'], ['layers', 'embed_tokens, norm'], ['0', '1, 2, … 27'], ['self_attn', 'mlp, input_layernorm, post_attention_layernorm'], ['q_proj', 'k_proj, v_proj, o_proj, q_norm, k_norm'], ['weight', '']];
  path.forEach(([n, sib], i) => {
    const x = 20 + i * 56, y = 38 + i * 32, w = Math.max(44, n.length * 7 + 16);
    d.box(x, y, w, 24, n, { cls: 'mono', size: 10, fill: i === 6 ? C.accSoft : C.card, stroke: i === 6 ? C.acc : C.ink2, r: 4 });
    if (sib) d.text(x + w + 12, y + 12, sib, { cls: 'xs', a: 'start' });
    if (i > 0) { const px = 20 + (i - 1) * 56 + 14; d.lines([[px, y - 8], [px, y + 12], [x - 2, y + 12]], { stroke: C.acc, sw: 1.1, single: true }); }
  });
  const segs = ['model', 'layers', '0', 'self_attn', 'q_proj', 'weight'];
  let x = 60;
  d.text(20, 282, 'key:', { cls: 'sm', a: 'start' });
  segs.forEach((s, i) => {
    const w = s.length * 6.8;
    d.mono(x, 282, s, { size: 11, a: 'start', color: i === 5 ? C.acc : C.ink });
    x += w;
    if (i < 5) { d.mono(x + 1, 282, '.', { size: 11, a: 'start', color: C.gray }); x += 8; }
  });
  return d.svg();
}

export function inf_name_mapping() {
  const d = new D(640, 350, 'inf_name_mapping');
  d.text(10, 16, 'ONE LAYER: CHECKPOINT NAMES → OUR PARAMETERS  (i = 0 … 27)', { cls: 'cap', a: 'start' });
  d.text(290, 42, 'model.layers.{i}.', { cls: 'mono', size: 10, a: 'end', color: C.gray });
  d.text(350, 42, 'layers.{i}.', { cls: 'mono', size: 10, a: 'start', color: C.gray });
  const rows = [['input_layernorm.weight', 'norm1.weight'], ['self_attn.q_proj.weight', 'wq.weight'], ['self_attn.k_proj.weight', 'wk.weight'], ['self_attn.v_proj.weight', 'wv.weight'], ['self_attn.q_norm.weight', 'q_norm.weight'], ['self_attn.k_norm.weight', 'k_norm.weight'], ['self_attn.o_proj.weight', 'wo.weight'], ['post_attention_layernorm.weight', 'norm2.weight'], ['mlp.gate_proj.weight', 'gate.weight'], ['mlp.up_proj.weight', 'up.weight'], ['mlp.down_proj.weight', 'down.weight']];
  rows.forEach(([a, b], i) => {
    const y = 64 + i * 24, hot = i === 4 || i === 5;
    d.mono(290, y, a, { size: 9.5, a: 'end', color: hot ? C.acc : C.ink });
    d.arrow(298, y, 342, y, { stroke: hot ? C.acc : C.line, hl: 5 });
    d.mono(350, y, b, { size: 9.5, a: 'start', color: hot ? C.acc : C.ink });
  });
  d.hand(520, 130, 'q_norm, k_norm:\nmissing in any\nQwen2-style model', { size: 14, vc: true });
  d.text(320, 336, '+ embed_tokens → tok_emb, norm → norm_f, lm_head → tied (skipped): 28 × 11 + 3 = 311 names', { cls: 'xs' });
  return d.svg();
}

export function inf_transpose_trap() {
  const d = new D(640, 260, 'inf_transpose_trap');
  d.text(10, 16, 'LOADING A TRANSPOSED WEIGHT: RECTANGLES FAIL LOUDLY, SQUARES FAIL SILENTLY', { cls: 'cap', a: 'start' });
  d.text(160, 42, 'q_proj (2048, 1024)', { cls: 'ttl', size: 11 });
  d.rect(60, 60, 50, 100, { fill: C.card, stroke: C.ink2, r: 2 });
  d.text(85, 172, 'expected', { cls: 'xs' });
  d.rect(160, 85, 100, 50, { fill: C.paper, stroke: C.red, r: 2 });
  d.text(210, 147, 'given (transposed)', { cls: 'xs', color: C.red });
  d.text(160, 204, 'RuntimeError: size mismatch', { cls: 'mono', size: 10, color: C.acc });
  d.text(160, 222, 'caught at load time', { cls: 'xs' });
  d.line(320, 34, 320, 240, { stroke: C.faint, sw: 0.8, single: true });
  d.text(480, 42, 'k_proj (1024, 1024)', { cls: 'ttl', size: 11 });
  d.grid(370, 64, 6, 6, 15, 15, { cellFill: (r, c) => r === 0 ? C.accSoft : null, lineColor: C.line });
  d.text(415, 172, 'expected', { cls: 'xs' });
  d.grid(500, 64, 6, 6, 15, 15, { cellFill: (r, c) => c === 0 ? C.accSoft : null, lineColor: C.line });
  d.text(545, 172, 'given (transposed)', { cls: 'xs', color: C.red });
  d.text(480, 204, 'loads without a word', { cls: 'mono', size: 10, color: C.red });
  d.text(480, 222, 'every key is wrong; only parity tests catch it', { cls: 'xs' });
  return d.svg();
}

export function inf_fused_qkv() {
  const d = new D(640, 250, 'inf_fused_qkv');
  d.text(10, 16, 'FUSED QKV FOR QWEN3-0.6B: 4,096 ROWS × 1,024, SPLIT 2,048 / 1,024 / 1,024', { cls: 'cap', a: 'start' });
  const x = 120, y0 = 40, H = 180, R = (r) => y0 + r / 4096 * H;
  [[0, 2048, 'W_{Q}  (16 heads)', C.accSoft, C.acc], [2048, 3072, 'W_{K}  (8 heads)', C.slateSoft, C.slate], [3072, 4096, 'W_{V}  (8 heads)', C.card, C.ink2]].forEach(([a, b, l, f, s]) => {
    d.rect(x, R(a), 120, R(b) - R(a), { fill: f, stroke: s, r: 2 });
    d.text(x + 60, (R(a) + R(b)) / 2, l, { cls: 'sm', color: C.ink });
  });
  [0, 2048, 3072, 4096].forEach((r) => d.mono(x - 8, R(r), r.toLocaleString('en-US'), { size: 9.5, a: 'end' }));
  d.text(x + 60, 236, 'correct: sizes from H·d_h and H_kv·d_h', { cls: 'xs', color: C.acc });
  const x2 = 400;
  [0, 1365, 2731, 4096].forEach((r, i) => { if (i < 3) d.rect(x2, R(r), 120, R([1365, 2731, 4096][i]) - R(r), { fill: C.paper, stroke: C.red, r: 2 }); });
  d.text(x2 + 60, R(683), 'q?', { cls: 'sm', color: C.red });
  d.text(x2 + 60, R(2048), 'k?', { cls: 'sm', color: C.red });
  d.text(x2 + 60, R(3413), 'v?', { cls: 'sm', color: C.red });
  d.line(x2 - 10, y0 - 4, x2 + 130, y0 + H + 4, { stroke: C.red, sw: 1.4, single: true });
  d.text(x2 + 60, 236, 'MHA habit: three equal thirds', { cls: 'xs', color: C.red });
  return d.svg();
}

export function inf_tied_head() {
  const d = new D(640, 240, 'inf_tied_head');
  d.text(10, 16, 'TIED EMBEDDINGS: STORED TWICE IN THE FILE, KEPT ONCE IN MEMORY', { cls: 'cap', a: 'start' });
  d.text(110, 42, 'in the checkpoint', { cls: 'ttl', size: 11 });
  d.box(30, 56, 160, 40, 'model.embed_tokens.weight\n311,164,928 bytes', { cls: 'mono', size: 9, fill: C.slateSoft, stroke: C.slate });
  d.box(30, 150, 160, 40, 'lm_head.weight\n311,164,928 bytes', { cls: 'mono', size: 9, fill: C.paper, stroke: C.line, tc: C.gray });
  d.line(110, 98, 110, 148, { stroke: C.gray, dash: [3, 3], single: true });
  d.text(118, 123, 'rows 0 and 9,707 ("Hello"):\nbyte for byte identical', { cls: 'xs', a: 'start', vc: true });
  d.text(480, 42, 'in our model', { cls: 'ttl', size: 11 });
  d.box(400, 90, 160, 54, 'one (151,936 × 1,024)\nmatrix', { fill: C.accSoft, stroke: C.acc, size: 10.5 });
  d.arrow(192, 76, 398, 104, { stroke: C.acc });
  d.text(300, 80, 'loaded', { cls: 'xs', color: C.acc });
  d.arrow(192, 170, 300, 170, { stroke: C.gray });
  d.text(330, 170, 'checked, skipped', { cls: 'xs', a: 'start' });
  d.mono(480, 78, 'tok_emb.weight', { size: 10 });
  d.mono(480, 158, 'lm_head.weight', { size: 10 });
  d.hand(480, 218, 'two names, one tensor', { size: 15 });
  return d.svg();
}

export function inf_load_steps() {
  const d = new D(640, 230, 'inf_load_steps');
  d.text(10, 16, 'LOADING IN SEVEN STEPS', { cls: 'cap', a: 'start' });
  const st = [['1  build on meta', 'shapes, no memory'], ['2  open the file', 'safe_open, lazy'], ['3  dtype', 'keep bf16'], ['4  device', 'straight to GPU'], ['5  map + assign', '311 names, 1 skipped'], ['6  validate', 'every shape, every param'], ['7  freeze', 'eval, inference_mode']];
  st.forEach(([t, n], i) => {
    const row = i < 4 ? 0 : 1, col = row ? 6 - i : i;
    const x = 20 + col * 154, y = 46 + row * 96;
    const hot = i === 5;
    d.box(x, y, 134, 34, t, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, size: 10.5 });
    d.text(x + 67, y + 48, n, { cls: 'xs' });
    if (i < 3) d.arrow(x + 136, y + 17, x + 152, y + 17, { stroke: C.ink2, hl: 5 });
    if (i >= 4 && i < 6) d.arrow(x - 2, y + 17, x - 18, y + 17, { stroke: C.ink2, hl: 5 });
  });
  d.carrow([[548, 82], [600, 110], [520, 142]], { stroke: C.ink2 });
  d.hand(120, 214, 'step 6 is the one people skip', { size: 15 });
  return d.svg();
}

export function inf_load_memory() {
  const d = new D(640, 220, 'inf_load_memory');
  d.text(10, 16, 'PEAK MEMORY WHILE LOADING QWEN3-0.6B', { cls: 'cap', a: 'start' });
  const X = (gb) => 150 + gb / 4 * 440;
  [0, 1, 2, 3, 4].forEach((g) => { d.line(X(g), 40, X(g), 170, { stroke: C.faint, sw: 0.6, single: true }); d.text(X(g), 182, `${g} GB`, { cls: 'xs' }); });
  d.text(140, 70, 'naive', { cls: 'ttl', a: 'end', size: 11 });
  d.text(140, 86, 'fp32 init + state dict', { cls: 'xs', a: 'end' });
  d.rect(X(0), 56, X(2.384) - X(0), 32, { fill: C.card, stroke: C.ink2, r: 2 });
  d.text((X(0) + X(2.384)) / 2, 72, 'random fp32 model 2.38', { cls: 'xs', color: C.ink });
  d.rect(X(2.384), 56, X(3.887) - X(2.384), 32, { fill: C.paper, stroke: C.red, r: 2, fs: 'hachure', gap: 4 });
  d.text((X(2.384) + X(3.887)) / 2, 72, 'file 1.50', { cls: 'xs', color: C.ink });
  d.mono(X(3.887) + 6, 72, '3.89', { size: 10, a: 'start', color: C.red });
  d.text(140, 130, 'careful', { cls: 'ttl', a: 'end', size: 11 });
  d.text(140, 146, 'meta + stream bf16', { cls: 'xs', a: 'end' });
  d.rect(X(0), 116, X(1.192) - X(0), 32, { fill: C.accSoft, stroke: C.acc, r: 2 });
  d.text((X(0) + X(1.192)) / 2, 132, 'the model', { cls: 'xs', color: C.ink });
  d.mono(X(1.192) + 6, 132, '1.19', { size: 10, a: 'start', color: C.acc });
  d.hand(470, 204, 'Llama 3 8B: 48 GB against 16 GB', { size: 15 });
  return d.svg();
}

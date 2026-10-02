import { D, C } from '../lib/draw.js';

function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function rope_shapes() {
  const d = new D(640, 400, 'rope_shapes');
  d.text(10, 16, 'ONE FINCH-24 ATTENTION LAYER WITH EVERY SHAPE  (B = BATCH, T = TOKENS)', { cls: 'cap', a: 'start' });
  const box = (x, y, w, lab, sh, o = {}) => { d.box(x, y, w, 30, lab, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, size: 10.5, cls: o.cls }); if (sh) d.mono(x + w / 2, y + 42, sh, { size: 9, color: o.shc ?? C.gray }); };
  box(250, 36, 140, 'x', '(B, T, 512)', { cls: 'mono' });
  [[60, 'q_proj', '(B, T, 512)'], [250, 'k_proj', '(B, T, 128)'], [440, 'v_proj', '(B, T, 128)']].forEach(([x, l, s]) => { d.arrow(320, 68, x + 70, 98, { stroke: C.ink2 }); box(x, 100, 140, l, s); });
  [[60, '(B, 8, T, 64)'], [250, '(B, 2, T, 64)'], [440, '(B, 2, T, 64)']].forEach(([x, s]) => { d.arrow(x + 70, 144, x + 70, 162, { stroke: C.ink2 }); box(x, 164, 140, 'view + transpose', s); });
  d.arrow(130, 208, 130, 228, { stroke: C.acc }); d.arrow(320, 208, 320, 228, { stroke: C.acc });
  d.box(60, 230, 330, 30, 'apply RoPE to q and k  (cos, sin: T × 64)', { fill: C.accSoft, stroke: C.acc, size: 10.5 });
  d.arrow(320, 262, 320, 284, { stroke: C.ink2 });
  d.arrow(510, 208, 510, 284, { stroke: C.ink2 });
  d.box(250, 286, 330, 30, 'KV cache: append rotated k and plain v', { fill: C.slateSoft, stroke: C.slate, size: 10.5 });
  d.arrow(130, 262, 130, 334, { stroke: C.ink2 });
  d.arrow(415, 318, 415, 334, { stroke: C.ink2 });
  d.box(60, 336, 520, 30, 'SDPA (Part V): softmax(q kᵀ / 8) v  →  (B, 8, T, 64)  →  reshape (B, T, 512)  →  o_proj', { fill: C.card, size: 10 });
  d.hand(560, 246, 'only q and k\nare rotated', { size: 15, vc: true });
  return d.svg();
}

export function rope_freq_bars() {
  const d = new D(640, 270, 'rope_freq_bars');
  d.text(10, 16, 'WAVELENGTH OF EACH OF THE 32 PAIRS IN A 64-WIDE HEAD (LOG SCALE), CONTEXT 4,096', { cls: 'cap', a: 'start' });
  const base = 220, top = 40, Y = (v) => base - (Math.log10(v) - 0) / 8 * (base - top);
  [10, 1e3, 1e5, 1e7].forEach((g) => { d.line(60, Y(g), 625, Y(g), { stroke: C.faint, sw: 0.6, single: true }); d.text(54, Y(g), g >= 1e5 ? g.toExponential(0).replace('e+', 'e') : g.toLocaleString('en-US'), { cls: 'xs', a: 'end' }); });
  d.line(60, Y(4096), 625, Y(4096), { stroke: C.red, sw: 1, dash: [5, 3], single: true });
  d.text(622, Y(4096) - 8, 'context 4,096', { cls: 'xs', a: 'end', color: C.red });
  for (let i = 0; i < 32; i++) {
    const x = 66 + i * 17.5;
    [[10000, C.ink2, 0], [500000, C.acc, 7]].forEach(([b, col, dx]) => {
      const lam = 2 * Math.PI * b ** (2 * i / 64), y = Y(lam);
      d.fillRect(x + dx, y, 6, base - y, col, lam > 4096 ? 0.75 : 0.3);
    });
  }
  d.line(60, base, 625, base, { stroke: C.ink2, sw: 0.9, single: true });
  d.text(66, base + 14, 'pair 0', { cls: 'xs', a: 'start' });
  d.text(625, base + 14, 'pair 31', { cls: 'xs', a: 'end' });
  d.text(340, 254, 'grey: base 10,000 (9 pairs never complete a turn)    orange: base 500,000 (16 pairs)', { cls: 'xs' });
  return d.svg();
}

export function rope_cache_tables() {
  const d = new D(640, 290, 'rope_cache_tables');
  d.text(10, 16, 'PRECOMPUTED TABLES: cos(m θ_i) AND sin(m θ_i), POSITIONS 0 TO 47, 32 PAIRS', { cls: 'cap', a: 'start' });
  d.rect(10, 40, 220, 200, { r: 8, fill: C.card, sw: 1 });
  ['inv_freq = 1 / base ** (', '    arange(0, 64, 2) / 64)', 'm = arange(T_max)', 'ang = outer(m, inv_freq)', 'ang = cat([ang, ang], -1)', 'cos, sin = ang.cos(), ang.sin()', '# both (T_max, 64), fp32'].forEach((l, i) => d.mono(22, 64 + i * 24, l, { size: 9.5, a: 'start', color: i === 6 ? C.gray : C.ink }));
  const th = Array.from({ length: 32 }, (_, i) => 10000 ** (-2 * i / 64));
  [['cos', Math.cos, 250], ['sin', Math.sin, 448]].forEach(([n, f, x0]) => {
    d.text(x0 + 88, 34, n, { cls: 'ttl' });
    for (let m = 0; m < 48; m++) for (let i = 0; i < 32; i++) { const v = f(m * th[i]); d.fillRect(x0 + i * 5.5, 44 + m * 4, 5.5, 4, v >= 0 ? C.acc : C.slate, Math.abs(v) * 0.85); }
    d.rect(x0, 44, 176, 192, { r: 0, sw: 0.9 });
    d.rect(x0 - 2, 44 + 20 * 4 - 1, 180, 6, { r: 1, stroke: C.ink, sw: 1.2 });
  });
  d.text(244, 126, 'm = 20', { cls: 'xs', a: 'end' });
  d.hand(440, 268, 'computed once at start-up, looked up by position forever', { size: 15 });
  return d.svg();
}

export function rope_pairing() {
  const d = new D(640, 250, 'rope_pairing');
  d.text(10, 16, 'WHICH DIMENSIONS ROTATE TOGETHER? TWO CONVENTIONS, 8-WIDE TOY HEAD', { cls: 'cap', a: 'start' });
  const row = (y, title, sub, pairs) => {
    d.text(10, y - 30, title, { cls: 'ttl', a: 'start' });
    d.text(10, y - 14, sub, { cls: 'xs', a: 'start' });
    for (let i = 0; i < 8; i++) d.box(230 + i * 46, y, 40, 28, String(i), { cls: 'mono', size: 11, fill: C.card, sw: 0.9, r: 4 });
    pairs.forEach(([a, b], k) => { const xa = 250 + a * 46, xb = 250 + b * 46, h = 10 + Math.abs(b - a) * 6; d.path(`M${xa},${y + 30} Q${(xa + xb) / 2},${y + 30 + h} ${xb},${y + 30}`, { stroke: [C.acc, C.slate, C.ink2, C.gray][k], sw: 1.4, rough: 0.4, single: true }); });
  };
  row(70, 'interleaved', 'original paper, Meta Llama code', [[0, 1], [2, 3], [4, 5], [6, 7]]);
  row(170, 'half-split (rotate_half)', 'Hugging Face transformers', [[0, 4], [1, 5], [2, 6], [3, 7]]);
  d.hand(496, 236, 'same model quality, incompatible weights', { size: 15, color: C.red });
  return d.svg();
}

export function rotate_half_steps() {
  const d = new D(640, 330, 'rotate_half_steps');
  d.text(10, 16, 'q′ = q · cos + rotate_half(q) · sin  FOR A 4-WIDE HEAD AT POSITION m = 1  (θ = 1, 0.01)', { cls: 'cap', a: 'start' });
  const c = [Math.cos(1), Math.cos(0.01), Math.cos(1), Math.cos(0.01)], s = [Math.sin(1), Math.sin(0.01), Math.sin(1), Math.sin(0.01)];
  const q = [1, 2, 3, 4], rh = [-3, -4, 1, 2];
  const qc = q.map((v, i) => v * c[i]), rs = rh.map((v, i) => v * s[i]), out = qc.map((v, i) => v + rs[i]);
  const rows = [['q', q, 1], ['cos row', c, 4], ['sin row', s, 4], ['rotate_half(q) = [−x₂, x₁]', rh, 1], ['q · cos', qc, 4], ['rotate_half(q) · sin', rs, 4], ['q′ = sum', out, 4]];
  rows.forEach(([lab, v, dp], r) => {
    const y = 34 + r * 38, last = r === 6;
    d.text(230, y + 13, lab, { cls: 'mono', size: 10, a: 'end', color: last ? C.acc : C.ink });
    v.forEach((x, k) => d.box(244 + k * 82, y, 74, 26, dp === 1 ? String(x) : x.toFixed(dp), { cls: 'mono', size: 10, fill: last ? C.accSoft : k < 2 ? C.card : C.slateSoft, stroke: last ? C.acc : C.ink2, sw: 0.8, r: 4 }));
  });
  d.text(244 + 82, 304, 'pair (0, 2) rotated by 1 rad directly: (1·cos 1 − 3·sin 1, 1·sin 1 + 3·cos 1) = (−1.9841, 2.4624)  ✓', { cls: 'xs', a: 'middle' });
  return d.svg();
}

export function rope_decode_pos() {
  const d = new D(640, 250, 'rope_decode_pos');
  d.text(10, 16, 'AT DECODE, A NEW TOKEN’S POSITION IS THE CACHE LENGTH, NOT ZERO', { cls: 'cap', a: 'start' });
  const dial = (cx, cy, m, col) => { d.circle(cx, cy, 34, { stroke: C.ink2, sw: 0.8 }); const a = m * 0.5; d.line(cx, cy, cx + 14 * Math.cos(a), cy - 14 * Math.sin(a), { stroke: col, sw: 1.5, single: true }); d.mono(cx, cy + 28, `m=${m}`, { size: 9, color: col === C.red ? C.red : C.gray }); };
  d.text(10, 60, 'prompt (prefill)', { cls: 'sm', a: 'start' });
  for (let m = 0; m < 5; m++) dial(150 + m * 50, 64, m, C.slate);
  d.text(10, 140, 'new tokens, correct', { cls: 'sm', a: 'start' });
  for (let m = 5; m < 8; m++) dial(150 + m * 50, 144, m, C.acc);
  d.text(10, 210, 'new tokens, bug', { cls: 'sm', a: 'start' });
  for (let m = 5; m < 8; m++) dial(150 + m * 50, 214, 0, C.red);
  d.text(560, 144, 'position_ids =\ncache_len + arange(n)', { cls: 'mono', size: 9.5, vc: true });
  d.hand(560, 214, 'every new word\nlooks like the first', { size: 14, vc: true, color: C.red });
  return d.svg();
}

export function rope_distance_grid() {
  const d = new D(640, 270, 'rope_distance_grid');
  d.text(10, 16, 'SCORE OF q AT POSITION m AGAINST k AT POSITION n, SAME CONTENT EVERYWHERE  (12 × 12)', { cls: 'cap', a: 'start' });
  const r = prng(5), dd = 16;
  const q = Array.from({ length: dd }, () => r() - 0.3), k = Array.from({ length: dd }, () => r() - 0.3);
  const th = Array.from({ length: dd / 2 }, (_, i) => 10000 ** (-2 * i / dd));
  const rot = (v, m) => { const o = v.slice(); for (let i = 0; i < dd / 2; i++) { const a = m * th[i], x = v[2 * i], y = v[2 * i + 1]; o[2 * i] = x * Math.cos(a) - y * Math.sin(a); o[2 * i + 1] = x * Math.sin(a) + y * Math.cos(a); } return o; };
  const P = Array.from({ length: 12 }, () => Array.from({ length: dd }, () => (r() - 0.5) * 0.9));
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const ropeS = [], absS = [];
  for (let m = 0; m < 12; m++) { ropeS.push([]); absS.push([]); for (let n = 0; n < 12; n++) { ropeS[m].push(dot(rot(q, m), rot(k, n))); absS[m].push(dot(q.map((x, i) => x + P[m][i]), k.map((x, i) => x + P[n][i]))); } }
  const panel = (x0, M, title) => {
    const all = M.flat(), lo = Math.min(...all), hi = Math.max(...all);
    d.text(x0 + 108, 42, title, { cls: 'ttl', size: 11 });
    d.grid(x0, 54, 12, 12, 18, 16, { shade: (a, b) => (M[a][b] - lo) / (hi - lo), inner: false });
  };
  panel(40, ropeS, 'RoPE: constant along diagonals');
  panel(360, absS, 'learned absolute: no pattern');
  d.text(149, 260, 'every cell with the same n − m has the same score', { cls: 'xs' });
  d.text(469, 260, 'the score also depends on where the pair sits', { cls: 'xs' });
  return d.svg();
}

export function rope_scaling() {
  const d = new D(640, 270, 'rope_scaling');
  d.text(10, 16, 'HOW MUCH EACH PAIR IS SLOWED TO STRETCH 4,096 → 16,384 (s = 4), HEAD SIZE 64', { cls: 'cap', a: 'start' });
  const dd = 64, s = 4, L = 4096;
  const th = (i) => 10000 ** (-2 * i / dd);
  const pi = () => 1 / s;
  const ntk = (i) => s ** (-2 * i / (dd - 2));
  const yarn = (i) => { const r = L / (2 * Math.PI / th(i)); const g = r < 1 ? 0 : r > 32 ? 1 : (r - 1) / 31; return (1 - g) / s + g; };
  const M = d.axes(70, 40, 480, 160, { xmin: 0, xmax: 31, ymin: 0, ymax: 1.05, xl: 'pair i (fast → slow)', yl: 'new speed ÷ old speed' });
  [[pi, C.ink2, 'linear (PI)'], [ntk, C.slate, 'NTK-aware'], [yarn, C.acc, 'YaRN']].forEach(([f, col, lab], k) => {
    const pts = []; for (let i = 0; i <= 31; i++) pts.push([M.X(i), M.Y(f(i))]);
    d.lines(pts, { stroke: col, sw: 1.6, rough: 0.3, single: true });
    d.text(560, 70 + k * 20, lab, { cls: 'sm', a: 'start', color: col });
  });
  [0, 8, 16, 24, 31].forEach((i) => d.text(M.X(i), 216, String(i), { cls: 'xs' }));
  d.text(M.X(0) + 4, M.Y(1) - 10, 'unchanged', { cls: 'xs', a: 'start' });
  d.text(M.X(31) - 2, M.Y(0.25) + 14, '÷ 4', { cls: 'xs', a: 'end' });
  d.hand(330, 252, 'keep the fast pairs sharp, stretch the slow ones', { size: 15 });
  return d.svg();
}

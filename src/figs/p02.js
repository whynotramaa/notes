import { D, C } from '../lib/draw.js';

const toks = ['The', '␠cat', '␠sat', '␠because', '␠it', '␠was', '␠tired'];
const ids = [791, 8415, 7731, 1606, 433, 574, 19781];

function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function id_numberline() {
  const d = new D(640, 200, 'id_numberline');
  d.text(10, 16, 'TOKEN IDS ON A NUMBER LINE: THE DISTANCES MEAN NOTHING', { cls: 'cap', a: 'start' });
  const X = (v) => 30 + v / 32000 * 580;
  d.arrow(26, 110, 620, 110, { stroke: C.ink2, sw: 1, hl: 7 });
  [0, 8000, 16000, 24000, 32000].forEach((v) => { d.line(X(v), 104, X(v), 116, { stroke: C.ink2, sw: 0.9, single: true }); d.text(X(v), 130, v.toLocaleString('en-US'), { cls: 'xs' }); });
  const pts = [['␠it', 433, 0], ['The', 791, 1], ['␠because', 1606, 0], ['␠sat', 7731, 1], ['␠cat', 8415, 0], ['␠kitten', 23140, 1], ['␠tired', 19781, 0]];
  pts.forEach(([t, v, up]) => {
    const x = X(v), y = up ? 70 : 84;
    d.dot(x, 110, 3, t === '␠cat' || t === '␠kitten' ? C.acc : C.ink);
    d.line(x, 107, x, y + 6, { stroke: C.line, sw: 0.7, single: true });
    d.mono(x, y, `${t} ${v}`, { size: 9.5, color: t === '␠cat' || t === '␠kitten' ? C.acc : C.ink });
  });
  d.hand(400, 168, '"cat" sits next to "sat" and far from "kitten":\na seat number, not a description', { size: 15, vc: true });
  return d.svg();
}

export function embed_lookup() {
  const d = new D(640, 330, 'embed_lookup');
  d.text(10, 16, 'THE EMBEDDING LOOKUP: EACH ID COPIES ONE ROW OF E', { cls: 'cap', a: 'start' });
  toks.forEach((t, i) => {
    const y = 44 + i * 36;
    d.box(10, y, 76, 26, t, { cls: 'mono', size: 10.5, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2, sw: 0.9, r: 5 });
    d.mono(118, y + 13, String(ids[i]), { size: 10.5, color: i === 1 ? C.acc : C.ink });
  });
  const ex = 200, ew = 170, ey = 40, eh = 250;
  d.rect(ex, ey, ew, eh, { r: 3, fill: C.card, sw: 1.1 });
  d.text(ex + ew / 2, ey - 10, 'E   (32,000 × 512)', { cls: 'ttl' });
  const rowY = (id) => ey + 6 + (id / 32000) * (eh - 14);
  ids.forEach((id, i) => {
    const y = rowY(id);
    d.fillRect(ex + 3, y, ew - 6, 6, i === 1 ? C.acc : C.ink2, i === 1 ? 0.75 : 0.35);
    d.carrow([[146, 57 + i * 36], [170, 57 + i * 36], [ex - 4, y + 3]], { stroke: i === 1 ? C.acc : C.line, sw: i === 1 ? 1.2 : 0.8 });
  });
  d.text(ex + ew + 6, rowY(8415) - 8, 'row 8415', { cls: 'xs', a: 'start', color: C.acc });
  d.text(ex + ew / 2, ey + eh + 14, 'one row per token in the vocabulary', { cls: 'xs' });
  const xx = 470, xw = 150;
  d.text(xx + xw / 2, 30, 'x   (7 × 512)', { cls: 'ttl' });
  toks.forEach((t, i) => {
    const y = 44 + i * 36;
    const r = prng(ids[i]);
    for (let k = 0; k < 15; k++) d.fillRect(xx + 2 + k * 9.7, y + 2, 9, 22, i === 1 ? C.acc : C.slate, 0.15 + r() * 0.55);
    d.rect(xx, y, xw, 26, { r: 3, sw: 0.9, stroke: i === 1 ? C.acc : C.ink2 });
  });
  d.carrow([[ex + ew + 4, rowY(8415) + 14], [420, 100], [xx - 4, 93]], { stroke: C.acc, sw: 1.1 });
  d.hand(520, 312, 'a copy, not a calculation', { size: 16 });
  return d.svg();
}

export function one_hot() {
  const d = new D(640, 230, 'one_hot');
  d.text(10, 16, 'LOOKUP = ONE-HOT ROW × TABLE  (TOY: V = 5, d = 4)', { cls: 'cap', a: 'start' });
  const oh = [0, 0, 1, 0, 0];
  d.grid(20, 96, 1, 5, 30, 30, { val: (r, c) => String(oh[c]), shade: (r, c) => oh[c] ? 0.8 : 0, vcolor: (r, c, s) => s > 0.5 ? C.onAcc : C.ink });
  d.text(95, 82, 'one-hot for id 2', { cls: 'sm' });
  d.text(95, 142, '1 × 5', { cls: 'xs' });
  d.text(196, 111, '×', { size: 20 });
  const E = [[0.2, -0.1, 0.5, 0.3], [0.9, 0.4, -0.2, 0.1], [0.3, 0.8, 0.6, -0.4], [-0.5, 0.2, 0.1, 0.7], [0.0, -0.6, 0.4, 0.2]];
  d.grid(226, 50, 5, 4, 44, 26, { val: (r, c) => E[r][c].toFixed(1), shade: (r) => r === 2 ? 0.3 : 0 });
  [0, 1, 2, 3, 4].forEach((r) => d.mono(218, 63 + r * 26, `${r}`, { size: 9.5, a: 'end', color: r === 2 ? C.acc : C.gray }));
  d.text(314, 194, 'E   (5 × 4)', { cls: 'xs' });
  d.text(422, 111, '=', { size: 20 });
  d.grid(446, 98, 1, 4, 44, 26, { val: (r, c) => E[2][c].toFixed(1), shade: () => 0.3 });
  d.text(534, 140, 'exactly row 2 of E', { cls: 'sm' });
  d.hand(520, 190, 'every other row is\nmultiplied by zero', { size: 15, vc: true });
  return d.svg();
}

const cv = { cat: [0.8, 0.6, 0.1, 0.0], kitten: [0.7, 0.7, 0.2, 0.1], dog: [0.7, 0.4, 0.3, -0.1], car: [0.1, 0.0, 0.9, 0.4], truck: [0.0, 0.1, 0.8, 0.6], the: [-0.3, 0.2, -0.2, 0.9] };
const cosv = (a, b) => { const dt = a.reduce((s, x, i) => s + x * b[i], 0); const n = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)); return dt / n(a) / n(b); };

export function cosine_heat() {
  const d = new D(640, 290, 'cosine_heat');
  d.text(10, 16, 'SIX TOY 4-NUMBER EMBEDDINGS AND THEIR COSINE SIMILARITIES', { cls: 'cap', a: 'start' });
  const names = Object.keys(cv);
  names.forEach((n, i) => {
    const y = 44 + i * 36;
    d.mono(64, y + 13, n, { a: 'end', size: 10.5 });
    cv[n].forEach((v, k) => {
      d.fillRect(72 + k * 34, y + 1, 32, 24, v >= 0 ? C.acc : C.slate, Math.min(0.9, Math.abs(v)));
      d.mono(88 + k * 34, y + 13, v.toFixed(1), { size: 9, color: Math.abs(v) > 0.55 ? C.onAcc : C.ink });
    });
    d.rect(72, y, 136, 26, { r: 2, sw: 0.8, stroke: C.ink2 });
  });
  const gx = 330, cs = 40;
  d.grid(gx, 44, 6, 6, cs, 36, { shade: (r, c) => Math.max(0, cosv(cv[names[r]], cv[names[c]])), val: (r, c) => cosv(cv[names[r]], cv[names[c]]).toFixed(2), vsize: 9, vcolor: (r, c, s) => s > 0.6 ? C.onAcc : C.ink, lsw: 0.5 });
  names.forEach((n, i) => { d.mono(gx - 6, 62 + i * 36, n, { size: 9, a: 'end' }); d.mono(gx + i * cs + cs / 2, 34, n, { size: 9 }); });
  d.hand(160, 274, 'similar meaning, similar strips', { size: 15, color: C.gray });
  d.hand(470, 274, 'bright blocks = clusters', { size: 15 });
  return d.svg();
}

export function cosine_angle() {
  const d = new D(640, 210, 'cosine_angle');
  d.text(10, 16, 'COSINE SIMILARITY ONLY LOOKS AT THE ANGLE BETWEEN TWO ARROWS', { cls: 'cap', a: 'start' });
  [[0, '1.00', 'same direction'], [60, '0.50', 'related'], [90, '0.00', 'unrelated'], [180, '−1.00', 'opposite']].forEach(([deg, v, lab], i) => {
    const cx = 80 + i * 160, cy = 110, R = 52;
    d.circle(cx, cy, R * 2, { stroke: C.faint, sw: 0.8 });
    d.arrow(cx, cy, cx + R, cy, { stroke: C.ink, sw: 1.3 });
    const a = -deg * Math.PI / 180;
    d.arrow(cx, cy, cx + R * Math.cos(a) * 0.86, cy + R * Math.sin(a) * 0.86, { stroke: C.acc, sw: 1.5 });
    if (deg > 0 && deg < 180) d.path(`M${cx + 20},${cy} A20,20 0 0,0 ${cx + 20 * Math.cos(a)},${cy + 20 * Math.sin(a)}`, { stroke: C.gray, sw: 0.9, rough: 0.3, single: true });
    d.mono(cx, cy + 74, `θ = ${deg}°   cos = ${v}`, { size: 10 });
    d.text(cx, cy + 90, lab, { cls: 'xs' });
  });
  return d.svg();
}

export function embed_map() {
  const d = new D(640, 330, 'embed_map');
  d.text(10, 16, 'A 2-D SKETCH OF EMBEDDING SPACE (REAL ONES HAVE HUNDREDS OF DIMENSIONS)', { cls: 'cap', a: 'start' });
  const groups = [
    ['animals', C.acc, [['cat', 90, 90], ['kitten', 118, 72], ['dog', 70, 122], ['puppy', 104, 132], ['horse', 140, 110]]],
    ['vehicles', C.slate, [['car', 470, 80], ['truck', 510, 104], ['bus', 480, 128], ['bicycle', 540, 70]]],
    ['feelings', C.ink2, [['happy', 120, 250], ['glad', 152, 234], ['sad', 92, 286], ['tired', 160, 286]]],
  ];
  groups.forEach(([g, col, pts]) => {
    pts.forEach(([w, x, y]) => { d.dot(x, y, 3.2, col); d.text(x + 7, y - 8, w, { cls: 'sm', a: 'start' }); });
  });
  d.ellipse(110, 104, 150, 110, { stroke: C.acc, sw: 0.8, dash: [4, 4] });
  d.ellipse(505, 100, 140, 90, { stroke: C.slate, sw: 0.8, dash: [4, 4] });
  d.ellipse(130, 264, 140, 90, { stroke: C.ink2, sw: 0.8, dash: [4, 4] });
  const K = [300, 120], M = [320, 230], W = [400, 236], Q = [380, 126];
  [[K, 'king'], [M, 'man'], [W, 'woman'], [Q, 'queen']].forEach(([[x, y], w]) => { d.dot(x, y, 3.4, C.ink); d.text(x + 8, y - 8, w, { cls: 'ttl', a: 'start' }); });
  d.arrow(M[0], M[1], W[0] - 4, W[1], { stroke: C.gray, sw: 1 });
  d.arrow(K[0], K[1], Q[0] - 4, Q[1], { stroke: C.acc, sw: 1.3 });
  d.text(360, 256, 'same "male → female" direction', { cls: 'xs' });
  d.hand(440, 190, 'king − man + woman\n≈ queen', { size: 16, vc: true, a: 'start' });
  return d.svg();
}

export function embed_training() {
  const d = new D(640, 260, 'embed_training');
  d.text(10, 16, 'TRAINING PULLS WORDS USED IN SIMILAR SENTENCES TOGETHER  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const words = [['cat', 0], ['dog', 0], ['kitten', 0], ['puppy', 0], ['car', 1], ['bus', 1], ['truck', 1], ['happy', 2], ['sad', 2], ['glad', 2]];
  const centers = [[80, 80], [200, 90], [140, 190]];
  const col = [C.acc, C.slate, C.ink2];
  const r = prng(7);
  const panel = (x0, title, after) => {
    d.rect(x0, 34, 290, 210, { r: 8, stroke: C.line, sw: 0.9 });
    d.text(x0 + 14, 52, title, { cls: 'ttl', a: 'start' });
    words.forEach(([w, g], i) => {
      let x, y;
      if (after) { const a = i * 2.4; x = x0 + centers[g][0] + 26 * Math.cos(a); y = 40 + centers[g][1] + 18 * Math.sin(a); }
      else { x = x0 + 24 + r() * 230; y = 70 + r() * 150; }
      d.dot(x, y, 3.2, col[g]);
      d.text(x + 6, y - 8, w, { cls: 'xs', a: 'start' });
    });
  };
  panel(10, 'step 0: random rows', false);
  panel(340, 'after training: clusters', true);
  d.arrow(304, 140, 334, 140, { stroke: C.acc, sw: 1.3 });
  return d.svg();
}

export function tie_weights() {
  const d = new D(640, 260, 'tie_weights');
  d.text(10, 16, 'WEIGHT TYING: ONE MATRIX USED AT BOTH ENDS OF THE MODEL', { cls: 'cap', a: 'start' });
  d.box(40, 196, 160, 40, 'embedding E\n32,000 × 512', { fill: C.accSoft, stroke: C.acc, size: 11 });
  d.box(40, 50, 160, 40, 'LM head = Eᵀ\n512 × 32,000', { fill: C.accSoft, stroke: C.acc, size: 11 });
  d.box(70, 124, 100, 36, '8 blocks', { fill: C.card, size: 11 });
  d.arrow(120, 194, 120, 162, { stroke: C.ink2 });
  d.arrow(120, 122, 120, 92, { stroke: C.ink2 });
  d.carrow([[204, 216], [250, 140], [204, 70]], { stroke: C.acc, sw: 1.2, dash: [5, 4] });
  d.hand(258, 140, 'same\nnumbers', { size: 16, vc: true, a: 'start' });
  const bars = [['tied (Finch-19)', 42128384], ['untied', 42128384 + 16384000]];
  bars.forEach(([n, v], i) => {
    const y = 90 + i * 60, w = v / 75000000 * 260;
    d.text(352, y - 10, n, { cls: 'sm', a: 'start' });
    d.rect(352, y, w, 26, { r: 2, fill: i ? C.faint : C.acc, fs: i ? 'solid' : 'hachure', gap: 3.6, stroke: i ? C.ink2 : C.acc, sw: 0.9 });
    d.mono(352 + w + 6, y + 13, v.toLocaleString('en-US'), { size: 10, a: 'start' });
  });
  d.text(480, 226, 'untying adds 16,384,000 parameters (+39%)', { cls: 'xs' });
  return d.svg();
}

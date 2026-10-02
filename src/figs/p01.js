import { D, C } from '../lib/draw.js';

const enc = new TextEncoder();
const hex = (b) => b.toString(16).toUpperCase().padStart(2, '0');

export function lm_loop() {
  const d = new D(640, 262, 'lm_loop');
  const step = (y, toks, out, label) => {
    d.text(10, y - 14, label, { cls: 'cap', a: 'start' });
    const r = d.chips(10, y, toks, { fill: (i) => (i === toks.length - 1 && toks.length > 3) ? C.accFaint : C.card });
    d.arrow(r.end + 8, y + 13, 300, y + 13, { stroke: C.gray });
    d.box(302, y - 12, 128, 50, 'Finch-19', { fill: C.card, size: 11.5 });
    d.arrow(430, y + 13, 472, y + 13, { stroke: C.acc });
    const o = d.chips(476, y, [out], { fill: C.accSoft, stroke: C.acc });
    d.text(o[0][0], y + 46, `P(${out} | ${toks.join(' ')})`, { cls: 'mono', size: 8.5, color: C.gray });
    return [r, o];
  };
  const [, o1] = step(40, ['The', 'cat', 'sat'], 'because', 'STEP 1');
  const [r2] = step(160, ['The', 'cat', 'sat', 'because'], 'it', 'STEP 2');
  d.carrow([[o1[0][0], 68], [o1[0][0] - 40, 112], [r2[3][0] + 50, 128], [r2[3][0] + 8, 155]], { stroke: C.acc, sw: 1.1 });
  d.hand(586, 112, 'append it,\nfeed it back in', { size: 16, vc: true });
  d.hand(366, 12, 'same weights every step', { size: 15, color: C.gray });
  d.text(10, 240, 'repeat until an end-of-text token appears or a length limit is reached', { cls: 'sm', a: 'start' });
  return d.svg();
}

export function next_token_dist() {
  const d = new D(640, 230, 'next_token_dist');
  d.text(10, 16, 'ONE PREDICTION = ONE PROBABILITY FOR EVERY TOKEN IN THE VOCABULARY', { cls: 'cap', a: 'start' });
  d.chips(10, 92, ['I’ll', 'have', 'a', 'cup', 'of'], {});
  d.arrow(196, 105, 240, 105, { stroke: C.gray });
  const words = ['tea', 'coffee', 'water', 'rocks', '…31,996 more'], p = [0.638, 0.235, 0.095, 0.032, 0];
  const base = 180, s = 190;
  d.line(250, base, 630, base, { stroke: C.ink2, sw: 0.9 });
  words.forEach((w, i) => {
    const x = 270 + i * 72, h = p[i] * s;
    if (p[i] > 0) {
      d.rect(x, base - h, 40, h, { r: 2, fill: i === 0 ? C.acc : C.faint, fs: i === 0 ? 'hachure' : 'solid', gap: 3.6, stroke: i === 0 ? C.acc : C.ink2, sw: 0.9 });
      d.mono(x + 20, base - h - 10, p[i].toFixed(3), { size: 10 });
    } else d.text(x + 20, base - 12, '≈ 0 each', { cls: 'xs' });
    d.text(x + 20, base + 14, w, { cls: i === 4 ? 'xs' : 'sm' });
  });
  d.hand(470, 52, 'all 32,000 bars add up to 1', { size: 16 });
  d.text(10, 214, 'Values are illustrative: they are what a well-trained model might say after this prompt.', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function utf8_bytes() {
  const d = new D(640, 210, 'utf8_bytes');
  d.text(10, 16, 'UTF-8: EVERY CHARACTER IS STORED AS 1 TO 4 BYTES', { cls: 'cap', a: 'start' });
  const chars = [...'naïve café 🙂'];
  const cw = 34;
  let x = 52;
  d.text(44, 64, 'chars', { cls: 'sm', a: 'end' });
  d.text(44, 142, 'bytes', { cls: 'sm', a: 'end' });
  for (const ch of chars) {
    const bytes = [...enc.encode(ch)];
    const w = bytes.length * cw;
    const multi = bytes.length > 1;
    d.rect(x + 2, 44, w - 4, 40, { fill: multi ? C.accSoft : C.card, stroke: multi ? C.acc : C.ink2, sw: 0.95, r: 5 });
    d.text(x + w / 2, 64, ch === ' ' ? '␠' : ch, { size: 18 });
    d.line(x + w / 2, 86, x + w / 2, 124, { stroke: C.line, sw: 0.8, single: true });
    bytes.forEach((b, i) => d.box(x + i * cw + 3, 128, cw - 6, 28, hex(b), { cls: 'mono', size: 10.5, fill: multi ? C.accFaint : C.paper, stroke: multi ? C.acc : C.ink2, sw: 0.9, r: 4 }));
    if (multi) d.text(x + w / 2, 170, `${bytes.length} bytes`, { cls: 'xs', color: C.acc });
    x += w;
  }
  d.hand(470, 196, `${chars.length} characters → ${enc.encode(chars.join('')).length} bytes`, { size: 17 });
  return d.svg();
}

export function token_cuts() {
  const d = new D(640, 300, 'token_cuts');
  d.text(10, 16, 'FOUR WAYS TO CUT THE WORD “UNHAPPINESS”', { cls: 'cap', a: 'start' });
  const rows = [
    ['words', ['unhappiness'], 'vocab: every word ever written; a new word becomes [UNK]', true],
    ['characters', [...'unhappiness'], 'vocab: about 150,000 Unicode characters', false],
    ['bytes', [...enc.encode('unhappiness')].map(hex), 'vocab: 256. Never unknown, but long.', false],
    ['BPE', ['un', 'happi', 'ness'], 'vocab: 256 bytes + learned merges', false],
  ];
  rows.forEach(([lab, parts, note, bad], r) => {
    const y = 36 + r * 64;
    d.text(84, y + 15, lab, { cls: 'ttl', a: 'end' });
    const c = d.chips(96, y + 2, parts, { h: 26, gap: 3, cw: 6.6, pad: parts.length > 3 ? 5 : 9, minw: 20, fill: r === 3 ? C.accSoft : C.card, stroke: r === 3 ? C.acc : C.ink2 });
    d.mono(c.end + 12, y + 15, `${parts.length} token${parts.length > 1 ? 's' : ''}`, { a: 'start', size: 10.5, color: r === 3 ? C.acc : C.ink });
    d.text(96, y + 44, note, { cls: 'xs', a: 'start', color: bad ? C.red : undefined });
  });
  d.hand(520, 250, 'short AND never\nunknown', { size: 17, vc: true });
  d.carrow([[470, 252], [380, 262], [270, 236]], { stroke: C.acc, sw: 1 });
  return d.svg();
}

export function pretok_chunks() {
  const d = new D(640, 170, 'pretok_chunks');
  d.text(10, 16, 'PRE-TOKENIZATION: SPLIT INTO CHUNKS BEFORE ANY MERGING', { cls: 'cap', a: 'start' });
  const parts = ['I', '’ll', '␠pay', '␠1', ',', '250', '␠for', '␠3', '␠cats', '!!'];
  const kinds = ['word', 'suffix', 'word', 'number', 'symbol', 'number', 'word', 'number', 'word', 'symbol'];
  let x = 14;
  parts.forEach((p, i) => {
    const w = Math.max(30, p.length * 8 + 18);
    const word = kinds[i] === 'word';
    d.box(x, 56, w, 34, p, { cls: 'mono', size: 12, fill: word ? C.accSoft : C.card, stroke: word ? C.acc : C.ink2, sw: 0.95, r: 5 });
    d.text(x + w / 2, 104, kinds[i], { cls: 'xs' });
    if (i < parts.length - 1) d.line(x + w + 6, 46, x + w + 6, 100, { stroke: C.red, sw: 1.3, single: true });
    x += w + 12;
  });
  d.hand(470, 140, 'red bars are walls: merges never cross them', { size: 16, color: C.red });
  d.text(14, 140, '“I’ll pay 1,250 for 3 cats!!”  →  10 chunks', { cls: 'sm', a: 'start' });
  return d.svg();
}

const corpus = [['banana', 3], ['bandana', 2], ['band', 2], ['bad', 1]];
const merges = [['a', 'n'], ['b', 'an'], ['an', 'a'], ['ban', 'd'], ['ban', 'ana'], ['band', 'ana']];
function applyMerge(seq, [a, b]) { const o = []; for (let i = 0; i < seq.length; i++) { if (seq[i] === a && seq[i + 1] === b) { o.push(a + b); i++; } else o.push(seq[i]); } return o; }
function pairCounts(state) {
  const pc = new Map();
  state.forEach(([seq, c]) => { for (let i = 0; i < seq.length - 1; i++) { const k = seq[i] + ' + ' + seq[i + 1]; pc.set(k, (pc.get(k) || 0) + c); } });
  return [...pc].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

export function bpe_counts() {
  const d = new D(640, 250, 'bpe_counts');
  d.text(10, 16, 'STEP 0: COUNT EVERY PAIR OF NEIGHBOURS, WEIGHTED BY HOW OFTEN THE WORD APPEARS', { cls: 'cap', a: 'start' });
  const state = corpus.map(([w, c]) => [[...w], c]);
  state.forEach(([seq, c], r) => {
    const y = 40 + r * 44;
    d.mono(40, y + 13, `×${c}`, { a: 'end', size: 11 });
    d.chips(50, y, seq, { width: 24, gap: 3, fill: (i) => (seq[i] === 'a' && seq[i + 1] === 'n') || (seq[i] === 'n' && seq[i - 1] === 'a') ? C.accSoft : C.card });
  });
  const pc = pairCounts(state);
  const max = pc[0][1];
  pc.forEach(([k, n], i) => {
    const y = 40 + i * 30, w = 190 * n / max, best = i === 0;
    d.mono(372, y + 11, k, { a: 'end', size: 11 });
    d.rect(384, y, w, 22, { r: 2, fill: best ? C.acc : C.faint, fs: best ? 'hachure' : 'solid', gap: 3.4, stroke: best ? C.acc : C.ink2, sw: 0.9 });
    d.mono(392 + w, y + 11, String(n), { a: 'start', size: 11, color: best ? C.acc : C.ink });
  });
  d.hand(520, 226, 'a + n wins with 12', { size: 17 });
  d.text(10, 226, 'corpus: 8 words, 43 bytes, 43 tokens', { cls: 'sm', a: 'start' });
  return d.svg();
}

export function bpe_steps() {
  const d = new D(640, 330, 'bpe_steps');
  d.text(10, 16, 'SIX MERGES LEARNED FROM THE TOY CORPUS, IN ORDER', { cls: 'cap', a: 'start' });
  d.text(18, 38, 'id', { cls: 'xs', a: 'start' });
  d.text(60, 38, 'merge rule', { cls: 'xs', a: 'start' });
  d.text(196, 38, 'corpus after this merge (banana ×3, bandana ×2, band ×2, bad ×1)', { cls: 'xs', a: 'start' });
  d.text(630, 38, 'tokens', { cls: 'xs', a: 'end' });
  let state = corpus.map(([w, c]) => [[...w], c]);
  const totals = [];
  merges.forEach((m, i) => {
    const counts = pairCounts(state);
    const n = counts[0][1];
    state = state.map(([s, c]) => [applyMerge(s, m), c]);
    const total = state.reduce((a, [s, c]) => a + s.length * c, 0);
    totals.push(total);
    const y = 50 + i * 44;
    d.mono(18, y + 13, String(256 + i), { a: 'start', size: 10.5, color: C.acc });
    d.mono(60, y + 13, `${m[0]} + ${m[1]} → ${m[0] + m[1]}`, { a: 'start', size: 10.5 });
    d.text(60, y + 30, `seen ${n} times`, { cls: 'xs', a: 'start' });
    let x = 196;
    state.forEach(([s]) => {
      s.forEach((t) => {
        const w = Math.max(14, t.length * 6.2 + 8);
        const fresh = t === m[0] + m[1];
        d.box(x, y + 2, w, 22, t, { cls: 'mono', size: 9.5, fill: fresh ? C.accSoft : C.card, stroke: fresh ? C.acc : C.line, sw: 0.8, r: 4 });
        x += w + 2;
      });
      x += 9;
    });
    d.mono(630, y + 13, String(total), { a: 'end', size: 11 });
  });
  d.hand(360, 318, 'next best pair appears once: stop', { size: 16, color: C.gray });
  return d.svg();
}

export function bpe_encode() {
  const d = new D(640, 300, 'bpe_encode');
  d.text(10, 16, 'ENCODING A NEW WORD: REPLAY THE MERGES IN THE ORDER THEY WERE LEARNED', { cls: 'cap', a: 'start' });
  let s = [...'bandanas'];
  const rows = [['raw bytes', s.slice()]];
  merges.forEach((m, i) => {
    const t = applyMerge(s, m);
    if (t.length !== s.length) { rows.push([`#${256 + i}  ${m[0]} + ${m[1]}`, t]); s = t; }
    else rows.push([`#${256 + i}  ${m[0]} + ${m[1]}  (no match)`, null]);
  });
  rows.forEach(([rule, toks], r) => {
    const y = 36 + r * 36;
    d.mono(190, y + 12, rule, { a: 'end', size: 10, color: toks ? C.ink : C.line });
    if (toks) {
      const last = r === rows.length - 1;
      const c = d.chips(204, y, toks, { h: 24, gap: 3, cw: 6.8, pad: 7, minw: 20, fill: last ? C.accSoft : C.card, stroke: last ? C.acc : C.ink2 });
      d.mono(c.end + 12, y + 12, `${toks.length} tokens`, { a: 'start', size: 10, color: C.gray });
    } else d.line(204, y + 12, 330, y + 12, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  });
  d.hand(520, 238, 'banana + ana never fires:\nthere is no "banana" here', { size: 15, vc: true, color: C.gray });
  d.hand(420, 286, 'final ids: [261, 115]', { size: 17 });
  return d.svg();
}

export function vocab_tradeoff() {
  const d = new D(640, 290, 'vocab_tradeoff');
  d.text(10, 16, 'BIGGER VOCABULARY: SHORTER SEQUENCES, BIGGER EMBEDDING TABLE', { cls: 'cap', a: 'start' });
  const lv = (v) => Math.log2(v);
  const M1 = d.axes(50, 50, 220, 170, { xmin: 8, xmax: 18, ymin: 0, ymax: 5, xl: 'vocab size (log scale)', yl: 'bytes per token' });
  const bpt = (v) => 1 + 3.4 * (1 - Math.exp(-(lv(v) - 8) / 4.5));
  d.fn((t) => bpt(2 ** t), 8, 18, M1, { stroke: C.acc });
  [[256, '256'], [4096, '4k'], [32000, '32k'], [262144, '256k']].forEach(([v, t]) => d.text(M1.X(lv(v)), 236, t, { cls: 'xs' }));
  d.dot(M1.X(lv(32000)), M1.Y(bpt(32000)), 3.2, C.acc);
  d.mono(M1.X(lv(32000)) - 6, M1.Y(bpt(32000)) - 14, 'Finch', { size: 9.5, a: 'end' });
  d.text(160, 260, 'illustrative shape: gains flatten', { cls: 'xs' });
  const M2 = d.axes(380, 50, 220, 170, { xmin: 8, xmax: 18, ymin: 0, ymax: 140, xl: 'vocab size (log scale)', yl: 'embedding parameters (millions), d = 512' });
  d.fn((t) => 2 ** t * 512 / 1e6, 8, 18, M2, { stroke: C.slate, n: 120 });
  [[256, '256'], [4096, '4k'], [32000, '32k'], [262144, '256k']].forEach(([v, t]) => d.text(M2.X(lv(v)), 236, t, { cls: 'xs' }));
  [[32000, '16.4M'], [128256, '65.7M']].forEach(([v, t]) => { d.dot(M2.X(lv(v)), M2.Y(v * 512 / 1e6), 3.2, C.slate); d.mono(M2.X(lv(v)) - 8, M2.Y(v * 512 / 1e6) - 4, t, { size: 9.5, a: 'end' }); });
  d.text(490, 260, 'exact: V × 512 numbers, a straight line', { cls: 'xs' });
  d.hand(320, 282, 'Finch-19 picks 32,000, the same as Llama 2 and Mistral 7B', { size: 15, color: C.gray });
  return d.svg();
}

export function bpb_compare() {
  const d = new D(640, 260, 'bpb_compare');
  d.text(10, 16, 'TWO MODELS, TWO TOKENIZERS: WHICH ONE IS BETTER?', { cls: 'cap', a: 'start' });
  const A = { loss: 3.0, bpt: 4.0 }, B = { loss: 2.6, bpt: 3.0 };
  const ppl = (m) => Math.exp(m.loss), bb = (m) => m.loss / Math.LN2 / m.bpt;
  const panel = (x0, title, vA, vB, digits, better) => {
    d.text(x0 + 120, 44, title, { cls: 'ttl' });
    const max = Math.max(vA, vB) * 1.15, base = 210;
    [[vA, 'model A'], [vB, 'model B']].forEach(([v, lab], i) => {
      const x = x0 + 50 + i * 100, h = 140 * v / max, win = (i === 0) === better;
      d.rect(x, base - h, 60, h, { r: 2, fill: win ? C.acc : C.faint, fs: win ? 'hachure' : 'solid', gap: 3.6, stroke: win ? C.acc : C.ink2, sw: 0.9 });
      d.mono(x + 30, base - h - 10, v.toFixed(digits), { size: 11 });
      d.text(x + 30, base + 14, lab, { cls: 'sm' });
    });
    d.line(x0 + 30, base, x0 + 230, base, { stroke: C.ink2, sw: 0.9 });
  };
  panel(10, 'perplexity per token (lower wins)', ppl(A), ppl(B), 1, false);
  panel(330, 'bits per byte (lower wins)', bb(A), bb(B), 3, true);
  d.line(320, 40, 320, 230, { stroke: C.line, sw: 0.8, dash: [3, 4], single: true });
  d.text(160, 246, 'A: 3.0 nats per token, 4.0 bytes per token     B: 2.6 nats per token, 3.0 bytes per token', { cls: 'xs', a: 'start' });
  d.hand(560, 74, 'the rankings flip', { size: 17, color: C.red });
  return d.svg();
}

export function token_edges() {
  const d = new D(640, 420, 'token_edges');
  d.text(10, 16, 'EIGHT PLACES WHERE TOKENIZERS SURPRISE PEOPLE', { cls: 'cap', a: 'start' });
  const items = [
    ['Emoji split mid-character', '🙂 is 4 bytes; a token boundary can fall inside'],
    ['“␠the” is not “the”', 'the leading space makes a different token and id'],
    ['Numbers split unevenly', '1234567 may become 123 | 45 | 67'],
    ['Some languages cost more', 'English-heavy merges split Hindi into many pieces'],
    ['Case changes the id', 'Hello, hello and HELLO are unrelated tokens'],
    ['Ties in pair counts', 'break them by a fixed rule or runs disagree'],
    ['Special tokens are not text', '<|endoftext|> must be one reserved id'],
    ['Under-trained tokens', 'tokens the model almost never saw act strangely'],
  ];
  items.forEach(([n, j], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 20 + col * 310, y = 36 + row * 94;
    d.rect(x, y, 290, 80, { r: 8, fill: i === 1 ? C.accFaint : C.card, stroke: i === 1 ? C.acc : C.ink2, sw: 1 });
    d.text(x + 16, y + 26, n, { cls: 'ttl', a: 'start' });
    d.text(x + 16, y + 52, j, { cls: 'sm', a: 'start' });
    d.mono(x + 274, y + 26, String(i + 1).padStart(2, '0'), { size: 9, a: 'end', color: C.gray });
  });
  return d.svg();
}


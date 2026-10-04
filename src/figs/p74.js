import { D, C, fmtN } from '../lib/draw.js';
import { systemMap } from '../lib/system-figures.js';
import S from '../data/system-design/search-numbers.json' with { type: 'json' };

const f6 = (v) => v.toFixed(6);
const TERMS = Object.keys(S.postings);
const ids = (t) => [...new Set(S.postings[t].map((p) => p[0]))];
const fig = (id, cap, h, cyc) => { const d = new D(640, h, id); if (cyc) d.cycle = cyc; d.text(10, 16, cap, { cls: 'cap', a: 'start' }); return d; };
const chip = (d, x, y, w, s, on = false, o = {}) => {
  const h = o.h ?? 22;
  d.rect(x, y, w, h, { r: 4, fill: on ? C.accSoft : (o.fill ?? C.card), stroke: on ? C.acc : (o.stroke ?? C.ink2), sw: 0.9, dash: o.dash });
  d.text(x + w / 2, y + h / 2 + 0.5, s, { cls: 'mono', size: o.size ?? 10, color: o.color });
};
const grave = (d, cx, base, w, h, o = {}) => {
  d.path(`M${cx - w / 2},${base} L${cx - w / 2},${base - h + w / 2} Q${cx - w / 2},${base - h} ${cx},${base - h} Q${cx + w / 2},${base - h} ${cx + w / 2},${base - h + w / 2} L${cx + w / 2},${base} Z`, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2, single: true });
  d.line(cx - w / 2 - 10, base, cx + w / 2 + 10, base, { stroke: C.gray, single: true });
};
const lev = (a, b) => {
  const g = [...Array(a.length + 1)].map((_, i) => [...Array(b.length + 1)].map((_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) g[i][j] = Math.min(g[i - 1][j] + 1, g[i][j - 1] + 1, g[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return g;
};
const bm25 = (idf, tf, adj) => idf * tf * 2.2 / (tf + 1.2 * adj);

export function where_sd_search(stage=99) { return systemMap("sd_search", ["Search basics: why LIKE fails", "Tokenization and analysis", "The inverted index", "Ranking: TF-IDF and BM25", "The indexing pipeline", "Shards and replicas", "Autocomplete and fuzzy search", "Operating a search cluster", "Case study: search end to end"], stage); }

export function cover_sd_search() {
  const d = new D(640, 830, 'cover_sd_search');
  d.cycle = 8;
  d.text(10, 16, 'SYSTEM DESIGN / UNIT 15 / FIELD GUIDE', { cls: 'cap', a: 'start' });
  d.text(42, 112, 'Search', { a: 'start', size: 48, w: 600 });
  d.text(42, 177, 'systems', { a: 'start', size: 48, w: 600 });
  d.hl(44, 195, 219, 195, { th: 15 });
  d.text(45, 249, 'From typed words to ranked reports', { a: 'start', size: 15 });
  S.texts.forEach((t, i) => {
    const y = 300 + i * 80;
    d.doc(36, y, 150, 58, { lines: false });
    d.text(46, y + 16, `report ${i + 1}`, { cls: 'xs', a: 'start' });
    d.mono(46, y + 37, t, { a: 'start', size: 11 });
    d.line(188, y + 29, 210, 410 + i * 27, { stroke: C.gray, single: true, sw: 0.9 });
  });
  d.poly([[212, 384], [268, 436], [268, 464], [212, 516]], { fill: C.card, stroke: C.ink2 });
  d.text(240, 534, 'analyzer', { cls: 'sm' });
  d.arrow(272, 450, 294, 450, { stroke: C.ink2, hl: 6 });
  d.rect(298, 300, 316, 312, { r: 6, fill: C.paper });
  d.text(456, 318, 'inverted index', { cls: 'ttl' });
  TERMS.forEach((t, i) => {
    const y = 334 + i * 44, on = t === 'red' || t === 'bird';
    chip(d, 310, y, 70, t, on, { h: 28, size: 11 });
    d.arrow(382, y + 14, 390, y + 14, { stroke: C.gray, hl: 4 });
    d.tape(392, y, ids(t).map(String), { cw: 34, h: 28, size: 11, hot: () => on });
  });
  d.rect(426, 594, 60, 10, { r: 5, fill: C.card });
  d.rect(36, 662, 290, 44, { r: 22, fill: C.paper });
  d.mono(62, 684, 'red bird', { a: 'start', size: 16 });
  d.circle(294, 681, 18, { stroke: C.ink2 });
  d.line(300, 688, 309, 697, { stroke: C.ink2, sw: 1.6, single: true });
  d.arrow(330, 684, 374, 684, { stroke: C.acc });
  d.rect(380, 650, 234, 68, { r: 6, fill: C.accSoft, stroke: C.acc });
  d.text(396, 668, 'report 1', { cls: 'ttl', a: 'start' });
  d.mono(396, 689, `score ${f6(S.bm25_red_bird)}`, { a: 'start', size: 12 });
  d.text(396, 706, 'red and bird adjacent at 1, 2', { cls: 'xs', a: 'start' });
  d.hand(320, 752, 'terms point to documents', { size: 22 });
  d.text(44, 787, 'DRAW EVERY BOX. DEFEND EVERY CHOICE.', { a: 'start', cls: 'cap', size: 11 });
  d.travel([[188, 329], [212, 410], [268, 450], [306, 348]], { at: [0, 0.3], label: 'red' });
  d.travel([[188, 329], [212, 410], [268, 450], [306, 392]], { at: [0.08, 0.36], label: 'bird' });
  d.pulse(345, 348, { at: [0.4, 0.55], r1: 26 });
  d.pulse(345, 392, { at: [0.45, 0.6], r1: 26 });
  d.travel([[443, 406], [470, 640]], { at: [0.6, 0.82], token: 'packet' });
  d.pulse(497, 684, { at: [0.82, 0.98], r1: 40 });
  return d.svg();
}

export function sd_search_scan() {
  const d = fig('sd_search_scan', 'ONE QUESTION, TWO ACCESS PATHS', 310, 6);
  const per = S.million_scan_bytes / 1e6;
  d.text(155, 46, 'scan: read every report', { cls: 'ttl' });
  d.grid(30, 64, 10, 10, 25, 18, { lsw: 0.5 });
  d.shift(250, 0, (g) => { g.fillRect(30, 64, 5, 180, C.acc, 0.25); g.line(35, 58, 35, 250, { stroke: C.acc, sw: 2, single: true }); }, { at: [0, 0.9] });
  d.text(155, 258, 'each cell is 10,000 reports', { cls: 'xs' });
  d.mono(155, 278, `${fmtN(1e6)} x ${per} B`, { size: 10.5 });
  d.text(155, 296, `${fmtN(S.million_scan_bytes)} bytes per query`, { cls: 'sm' });
  d.text(485, 46, 'index: read only the candidates', { cls: 'ttl' });
  d.rect(340, 112, 84, 86, { r: 5, fill: C.card });
  d.text(382, 126, 'dictionary', { cls: 'xs' });
  chip(d, 350, 138, 64, 'bird', true);
  chip(d, 350, 166, 64, 'red');
  d.grid(450, 64, 10, 10, 15, 18, { lsw: 0.5, cellFill: () => C.accSoft });
  [[446, 100], [446, 154], [446, 208]].forEach(([x, y], i) => {
    d.arrow(416, 149, x, y, { stroke: C.acc, hl: 6 });
    d.travel([[416, 149], [x, y]], { at: [0.15 + i * 0.2, 0.3 + i * 0.2], token: 'packet' });
  });
  d.hand(382, 234, `${fmtN(S.scan_ratio)} x\nfewer bytes`, { size: 15, vc: true });
  d.text(525, 258, 'each cell is 1 report', { cls: 'xs' });
  d.mono(525, 278, `100 x ${per} B`, { size: 10.5 });
  d.text(525, 296, `${fmtN(S.candidate_bytes)} bytes per query`, { cls: 'sm' });
  return d.svg();
}

export function sd_search_like() {
  const d = fig('sd_search_like', 'THE SAME TEXT, DIFFERENT PREDICATES', 290);
  d.text(340, 40, 'exact phrase', { cls: 'ttl' });
  d.text(544, 40, 'all terms, any order', { cls: 'ttl' });
  chip(d, 268, 52, 84, 'distributed', false, { h: 20, size: 9.5 });
  chip(d, 352, 52, 60, 'systems', false, { h: 20, size: 9.5 });
  chip(d, 468, 52, 84, 'distributed', false, { h: 20, size: 9.5 });
  chip(d, 560, 52, 60, 'systems', false, { h: 20, size: 9.5 });
  d.line(242, 34, 242, 250, { stroke: C.line, single: true });
  d.line(442, 34, 442, 250, { stroke: C.line, single: true });
  const docs = [['report A', 'intro to distributed systems'], ['report B, from section 2', 'systems for distributed scoring']];
  docs.forEach(([name, t], r) => {
    const y = 90 + r * 88;
    d.doc(20, y, 210, 60, { lines: false });
    d.text(30, y + 14, name, { cls: 'xs', a: 'start' });
    d.mono(28, y + 36, t, { a: 'start', size: 9.5 });
    [340, 544].forEach((cx, c) => {
      const ty = y + 16, sx = cx - t.length * 2.7;
      d.mono(cx, ty, t, { size: 9 });
      const ok = c === 1 || r === 0;
      if (c === 0 && r === 0) { const k = t.indexOf('distributed systems'); d.hl(sx + k * 5.4, ty + 1, sx + (k + 19) * 5.4, ty + 1, { th: 11, op: 0.25 }); }
      else ['distributed', 'systems'].forEach((w) => { const k = t.indexOf(w); d.hl(sx + k * 5.4, ty + 1, sx + (k + w.length) * 5.4, ty + 1, { th: 11, op: 0.25, color: ok ? C.acc : C.gray }); });
      if (!ok) d.text(cx, y + 31, 'reversed and not adjacent', { cls: 'xs' });
      d.rect(cx - 42, y + 40, 84, 18, { r: 4, fill: ok ? C.accSoft : C.card, stroke: ok ? C.acc : C.gray, sw: 0.9 });
      d.text(cx, y + 49.5, c === 1 ? 'both terms' : ok ? 'match' : 'no phrase', { cls: 'sm', color: ok ? C.ink : C.gray });
    });
  });
  d.text(320, 272, "LIKE '%distributed systems%' agrees with the phrase column for these two reports", { cls: 'xs' });
  return d.svg();
}

export function sd_search_matching() {
  const d = fig('sd_search_matching', 'ELIGIBILITY BEFORE ORDER', 300, 7);
  const b1 = bm25(S.idf_bird, 1, 1), b2 = bm25(S.idf_bird, 2, 1);
  d.text(69, 52, 'bird postings', { cls: 'sm' });
  chip(d, 40, 62, 58, 'bird');
  d.tape(24, 96, ids('bird').map(String), { cw: 30, h: 24 });
  const ys = [74, 134, 194];
  ids('bird').forEach((id, i) => {
    const y = ys[i];
    d.arrow(39 + i * 30, 122, 138, y + 23, { stroke: C.gray, hl: 5, sw: 0.8 });
    d.doc(140, y, 36, 46, { lines: false, stroke: id === 2 ? C.gray : C.ink2 });
    d.mono(156, y + 28, `d${id}`, { size: 11, color: id === 2 ? C.gray : C.ink });
  });
  d.lock(180, 138, 14);
  d.mono(250, 40, 'visibility=public', { size: 10 });
  d.line(250, 52, 250, 250, { stroke: C.acc, sw: 1.6, dash: [6, 4], single: true });
  d.arrow(182, 157, 244, 157, { stroke: C.gray, hl: 5 });
  d.line(240, 151, 252, 163, { stroke: C.acc, sw: 1.6, single: true });
  d.line(252, 151, 240, 163, { stroke: C.acc, sw: 1.6, single: true });
  d.text(250, 268, 'd2 removed before scoring', { cls: 'xs' });
  d.carrow([[180, 97], [270, 100], [362, 146]], { stroke: C.ink2, hl: 6 });
  d.carrow([[180, 217], [270, 200], [362, 110]], { stroke: C.ink2, hl: 6 });
  d.text(340, 74, 'BM25 for bird', { cls: 'sm', a: 'start' });
  d.rect(370, 100, b2 * 200, 20, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.mono(362, 110, 'd4', { a: 'end', size: 10 });
  d.mono(376 + b2 * 200, 110, f6(b2), { a: 'start', size: 10 });
  d.rect(370, 136, b1 * 200, 20, { r: 2, fill: C.card });
  d.mono(362, 146, 'd1', { a: 'end', size: 10 });
  d.mono(376 + b1 * 200, 146, f6(b1), { a: 'start', size: 10 });
  d.text(420, 176, 'only eligible documents get a score', { cls: 'xs' });
  d.rect(540, 80, 84, 82, { r: 5, fill: C.paper });
  d.text(582, 94, 'results', { cls: 'xs' });
  d.mono(552, 118, '1. d4', { a: 'start' });
  d.mono(552, 142, '2. d1', { a: 'start' });
  d.hand(470, 228, 'a score is not permission', { size: 16 });
  d.travel([[180, 97], [270, 100], [362, 146]], { at: [0.1, 0.4], r: 4 });
  d.travel([[180, 217], [270, 200], [362, 110]], { at: [0.15, 0.45], r: 4 });
  d.travel([[180, 157], [244, 157]], { at: [0.1, 0.3], r: 4, color: C.gray });
  d.travel([[244, 157], [244, 250]], { at: [0.3, 0.45], r: 4, color: C.gray });
  d.pulse(582, 121, { at: [0.55, 0.75], r1: 30 });
  return d.svg();
}

export function sd_search_freshness() {
  const d = fig('sd_search_freshness', 'A COMMIT AND A SEARCH VIEW', 300, 8);
  const X = (t) => 150 + t * 470, ev = [[0.15, 'commit v8'], [0.4, 'ingest v8'], [0.6, 'query sees v7'], [0.8, 'refresh opens v8']];
  ev.forEach(([t, s]) => { d.line(X(t), 56, X(t), 246, { stroke: C.line, dash: [3, 4], single: true }); d.text(X(t), 46, s, { cls: 'sm' }); });
  const lanes = [[80, 'source', 0.15], [150, 'indexer', 0.4], [220, 'search view', 0.8]];
  d.db(24, 63, 26, 34, { bands: [] });
  d.gear(37, 150, 13);
  d.laptop(22, 207, 30);
  lanes.forEach(([y, name, t]) => {
    d.text(60, y, name, { cls: 'sm', a: 'start' });
    d.rect(150, y - 13, X(t) - 150, 26, { r: 3, fill: C.card });
    d.mono((150 + X(t)) / 2, y, 'v7', { size: 10 });
    d.rect(X(t), y - 13, 620 - X(t), 26, { r: 3, fill: C.accSoft, stroke: C.acc });
    d.mono((X(t) + 620) / 2, y, 'v8', { size: 10 });
  });
  d.person(452, 248, 18);
  d.arrow(444, 248, 434, 236, { stroke: C.ink2, hl: 5 });
  d.text(468, 266, 'reader', { cls: 'xs', a: 'start' });
  d.hand(200, 278, 'durable is not yet searchable', { size: 15 });
  d.shift(470, 0, (g) => g.line(150, 56, 150, 244, { stroke: C.acc, sw: 1.6, single: true }), { at: [0, 1] });
  d.travel([[X(0.15), 93], [X(0.4), 137]], { at: [0.15, 0.4], label: 'v8' });
  d.travel([[X(0.4), 163], [X(0.8), 207]], { at: [0.4, 0.8], label: 'v8' });
  d.pulse(X(0.6), 220, { at: [0.58, 0.72], r1: 18, color: C.ink2 });
  d.pulse(X(0.8), 220, { at: [0.8, 0.95], r1: 22 });
  return d.svg();
}

export function sd_search_tokens() {
  const d = fig('sd_search_tokens', 'BEFORE AND AFTER ANALYSIS', 300, 6);
  const raw = 'Red bird scores', cw = 30, x0 = 95;
  d.text(20, 74, 'characters', { cls: 'sm', a: 'start' });
  d.tape(x0, 60, [...raw].map((c) => (c === ' ' ? '' : c)), { cw, h: 28, size: 12 });
  [...raw].forEach((c, i) => { if (c === ' ') { const x = x0 + i * cw + cw / 2; d.line(x, 50, x, 98, { stroke: C.acc, dash: [3, 3], single: true }); d.text(x, 106, 'split', { cls: 'xs', color: C.acc }); } });
  const toks = raw.split(' ');
  let ci = 0;
  const spans = toks.map((t) => { const s = [x0 + ci * cw, t.length * cw]; ci += t.length + 1; return s; });
  d.text(20, 150, 'tokens', { cls: 'sm', a: 'start' });
  d.text(20, 226, 'lowercase', { cls: 'sm', a: 'start' });
  spans.forEach(([x, w], i) => {
    chip(d, x, 138, w, toks[i], false, { h: 26, size: 12 });
    d.text(x + w / 2, 176, `position ${i + 1}`, { cls: 'xs' });
    d.arrow(x + w / 2, 184, x + w / 2, 208, { stroke: C.gray, hl: 5 });
    chip(d, x, 212, w, toks[i].toLowerCase(), toks[i] !== toks[i].toLowerCase(), { h: 26, size: 12 });
    d.text(x + w / 2, 250, `position ${i + 1}`, { cls: 'xs' });
    d.travel([[x + w / 2, 92], [x + w / 2, 136]], { at: [0.05 + i * 0.1, 0.3 + i * 0.1], r: 3.5, color: C.ink2 });
  });
  d.pulse(spans[0][0] + spans[0][1] / 2, 225, { at: [0.55, 0.75], r1: 30 });
  d.hand(320, 282, 'Red and red become one comparable term', { size: 15 });
  return d.svg();
}

export function sd_search_normalize() {
  const d = fig('sd_search_normalize', 'TWO FIELDS, TWO JOBS', 290);
  d.doc(262, 40, 116, 58, { lines: false });
  d.text(270, 54, 'source title', { cls: 'xs', a: 'start' });
  d.text(320, 76, 'Red Bird', { size: 14 });
  d.carrow([[290, 100], [220, 120], [160, 140]], { stroke: C.ink2, hl: 6 });
  d.carrow([[350, 100], [420, 120], [480, 140]], { stroke: C.ink2, hl: 6 });
  d.hand(320, 128, 'keep both', { size: 15 });
  d.text(160, 154, 'title, original', { cls: 'ttl' });
  d.rect(60, 166, 200, 64, { r: 2, fill: C.paper });
  d.rect(68, 174, 184, 48, { r: 1, stroke: C.line });
  d.text(160, 198, 'Red Bird', { size: 20 });
  d.text(160, 244, 'display and exact value', { cls: 'sm' });
  d.text(480, 154, 'title, analyzed', { cls: 'ttl' });
  d.rect(380, 166, 200, 64, { r: 6, fill: C.card });
  chip(d, 406, 186, 64, 'red', true, { h: 24, size: 12 });
  chip(d, 486, 186, 70, 'bird', false, { h: 24, size: 12 });
  d.text(480, 244, 'term comparison', { cls: 'sm' });
  d.mono(480, 270, 'query RED becomes red, matches', { size: 10, color: C.acc });
  d.mono(160, 270, 'screen still shows Red Bird', { size: 10 });
  return d.svg();
}

export function sd_search_positions() {
  const d = fig('sd_search_positions', 'WORD MEMBERSHIP IS NOT WORD ORDER', 290, 7);
  const rows = [[0, 110], [3, 210]];
  rows.forEach(([di, R], r) => {
    const words = S.texts[di].split(' ');
    d.text(30, R - 24, `doc ${di + 1}`, { cls: 'ttl', a: 'start' });
    d.text(30, R - 8, S.texts[di], { cls: 'xs', a: 'start' });
    d.line(160, R, 450, R, { stroke: C.ink2, single: true });
    words.forEach((w, p) => {
      const x = 200 + p * 100;
      d.line(x, R - 4, x, R + 4, { stroke: C.ink2, single: true });
      d.text(x, R + 14, String(p + 1), { cls: 'xs' });
      chip(d, x - 35, R - 34, 70, w, r === 0 && p < 2, { size: 11 });
    });
    d.rect(158, R - 42, 184, 34, { r: 6, stroke: r === 0 ? C.acc : C.gray, dash: r === 0 ? undefined : [4, 3], sw: 1.2 });
  });
  d.text(250, 58, 'window: red at p, bird at p + 1', { cls: 'xs', color: C.acc });
  d.text(250, 238, 'no red, so positions are never checked', { cls: 'xs' });
  d.text(490, 70, 'phrase rule', { cls: 'ttl', a: 'start' });
  d.mono(490, 94, 'red at p', { a: 'start' });
  d.mono(490, 114, 'bird at p + 1', { a: 'start' });
  d.mono(490, 150, 'doc 1: p = 1, match', { a: 'start', size: 10, color: C.acc });
  d.mono(490, 194, 'doc 4: no red, skip', { a: 'start', size: 10 });
  d.hand(320, 272, 'same terms, order kept by positions', { size: 15 });
  d.travel([[160, 110], [450, 110]], { at: [0, 0.5], r: 3.5 });
  d.pulse(250, 85, { at: [0.15, 0.35], r1: 40 });
  d.travel([[160, 210], [450, 210]], { at: [0.5, 1], r: 3.5, color: C.gray });
  return d.svg();
}

export function sd_search_fields() {
  const d = fig('sd_search_fields', 'ONE DOCUMENT, SEPARATE REPRESENTATIONS', 290);
  d.rect(30, 46, 200, 200, { r: 6, fill: C.paper });
  d.text(130, 62, 'report 1', { cls: 'ttl' });
  const f = [['title', 'Red bird scores', 96], ['sport', 'football', 150], ['owner', 'u-17', 204]];
  f.forEach(([k, v, y]) => {
    d.text(44, y - 12, k, { cls: 'xs', a: 'start' });
    d.rect(44, y - 4, 172, 24, { r: 3, fill: C.card });
    d.mono(52, y + 8, v, { a: 'start', size: 10.5 });
    d.arrow(220, y + 8, 294, y + 5, { stroke: C.gray, hl: 6 });
  });
  d.text(300, 82, 'text: analyzed and scored', { cls: 'sm', a: 'start' });
  chip(d, 300, 90, 46, 'red', true);
  chip(d, 352, 90, 52, 'bird', true);
  chip(d, 410, 90, 66, 'scores', true);
  d.text(484, 101, 'title match can weigh more', { cls: 'xs', a: 'start' });
  d.text(300, 136, 'keyword: exact, filter only', { cls: 'sm', a: 'start' });
  chip(d, 300, 144, 90, 'football');
  d.text(398, 155, 'no lowercase, no stemming', { cls: 'xs', a: 'start' });
  d.text(300, 190, 'identifier: authorization', { cls: 'sm', a: 'start' });
  d.lock(300, 196, 16);
  chip(d, 324, 198, 60, 'u-17');
  d.text(392, 209, 'filters by viewer, never scored', { cls: 'xs', a: 'start' });
  d.hand(320, 272, 'each field keeps its own rules', { size: 15 });
  return d.svg();
}

export function sd_search_inverted() {
  const d = fig('sd_search_inverted', 'REVERSE THE RELATIONSHIP', 330, 8);
  const occ = TERMS.reduce((n, t) => n + S.postings[t].length, 0);
  d.text(110, 36, 'documents hold words', { cls: 'sm' });
  d.text(460, 36, 'terms point to doc@position', { cls: 'sm' });
  S.texts.forEach((t, i) => {
    const y = 46 + i * 62;
    d.doc(20, y, 180, 48, { lines: false });
    d.text(30, y + 12, `doc ${i + 1}`, { cls: 'xs', a: 'start' });
    d.mono(30, y + 32, t, { a: 'start', size: 10 });
    let c = 0;
    t.split(' ').forEach((w) => { if (w === 'bird') d.hl(30 + c * 6, y + 33, 30 + (c + 4) * 6, y + 33, { th: 10, op: 0.25 }); c += w.length + 1; });
  });
  d.arrow(212, 180, 288, 180, { stroke: C.ink2, sw: 1.6 });
  d.text(250, 166, 'invert', { cls: 'sm' });
  const birdCells = [];
  TERMS.forEach((t, i) => {
    const y = 52 + i * 44, on = t === 'bird';
    chip(d, 300, y, 64, t, on, { h: 24, size: 11 });
    d.tape(376, y, S.postings[t].map(([a, b]) => `${a}@${b}`), { cw: 52, h: 24, hot: () => on });
    if (on) S.postings[t].forEach((_, k) => birdCells.push([402 + k * 52, y + 12]));
  });
  let k = 0;
  S.texts.forEach((t, i) => {
    let c = 0;
    t.split(' ').forEach((w) => { if (w === 'bird') { d.travel([[30 + (c + 2) * 6, 46 + i * 62 + 32], birdCells[k]], { at: [k * 0.18, k * 0.18 + 0.3], label: 'bird', w: 40 }); k++; } c += w.length + 1; });
  });
  d.text(460, 318, `${occ} occurrences, ${TERMS.length} distinct terms`, { cls: 'xs' });
  d.hand(110, 312, 'doc 4 keeps both birds', { size: 15 });
  return d.svg();
}

export function sd_search_intersection() {
  const d = fig('sd_search_intersection', 'POINTERS ADVANCE TOWARD AGREEMENT', 300, 9);
  const R = ids('red'), B = ids('bird'), cx = (i) => 135 + i * 50;
  chip(d, 30, 69, 60, 'red', false, { h: 24, size: 11 });
  d.tape(110, 68, R.map(String), { cw: 50, h: 26, size: 12 });
  chip(d, 30, 139, 60, 'bird', false, { h: 24, size: 11 });
  d.tape(110, 138, B.map(String), { cw: 50, h: 26, size: 12 });
  d.text(60, 232, 'result', { cls: 'sm' });
  d.tape(110, 218, S.intersection.map(String), { cw: 50, h: 26, size: 12, hot: () => true });
  const steps = [[0, 0, 'red 1 = bird 1', 'emit 1, advance both'], [1, 1, 'red 3 > bird 2', 'advance bird'], [1, 2, 'red 3 < bird 4', 'advance red: list ends']];
  steps.forEach(([ri, bi, cmp, act], s) => {
    const y = 80 + s * 44;
    d.mono(330, y, `${s + 1}`, { a: 'start', size: 10, color: C.gray });
    d.mono(350, y, cmp, { a: 'start', size: 10 });
    d.mono(350, y + 16, act, { a: 'start', size: 10, color: s === 0 ? C.acc : C.ink2 });
    d.phase(s, 3, (g) => {
      g.arrow(cx(ri), 46, cx(ri), 64, { stroke: C.acc, sw: 1.6 });
      g.arrow(cx(bi), 188, cx(bi), 168, { stroke: C.acc, sw: 1.6 });
      g.hl(326, y + 6, 600, y + 6, { th: 36, op: 0.1 });
    });
  });
  d.text(135, 200, 'two pointers, one pass', { cls: 'xs' });
  d.travel([[135, 100], [135, 230]], { at: [0.05, 0.28], r: 4 });
  d.hand(470, 240, 'advance the smaller ID', { size: 16 });
  return d.svg();
}

export function sd_search_gaps() {
  const d = fig('sd_search_gaps', 'STORE DIFFERENCES, RECOVER IDS', 290, 6);
  const X = (v) => 60 + v * 100, Y = 110, docs = S.bird_docs, gaps = S.delta_bird;
  d.line(40, Y, 580, Y, { stroke: C.ink2, single: true });
  for (let v = 0; v <= 5; v++) { d.line(X(v), Y - 4, X(v), Y + 4, { stroke: C.ink2, single: true }); d.text(X(v), Y + 16, String(v), { cls: 'xs' }); }
  let prev = 0, path = `M${X(0)},${Y}`;
  docs.forEach((id, i) => {
    const a = X(prev), b = X(id), h = 26 + (id - prev) * 14;
    d.carrow([[a, Y - 4], [(a + b) / 2, Y - h], [b, Y - 6]], { stroke: C.acc, hl: 6 });
    d.hand((a + b) / 2, Y - h - 12, `+${gaps[i]}`, { size: 16 });
    d.circle(b, Y, 12, { fill: C.accSoft, stroke: C.acc });
    d.text(b, Y + 30, `doc ${id}`, { cls: 'sm' });
    path += ` Q${(a + b) / 2},${Y - h * 1.6} ${b},${Y}`;
    d.pulse(b, Y, { at: [0.25 * (i + 1) - 0.02, 0.25 * (i + 1) + 0.12], r1: 16 });
    prev = id;
  });
  d.travel(path, { at: [0, 0.75], r: 4.5 });
  d.text(40, 192, 'gaps stored', { cls: 'sm', a: 'start' });
  d.tape(200, 178, gaps.map(String), { cw: 50, h: 28, size: 12, hot: () => true });
  d.text(40, 236, 'running sum', { cls: 'sm', a: 'start' });
  let run = 0;
  gaps.forEach((g, i) => { const s = run === 0 ? `${g}` : `${run}+${g}=${run + g}`; run += g; d.mono(225 + i * 50, 236, s, { size: 10 }); });
  d.text(275, 262, `recovers ${docs.join(', ')}`, { cls: 'xs' });
  d.hand(490, 210, 'sorted IDs leave\nsmall numbers', { size: 15, vc: true });
  return d.svg();
}

export function sd_search_update() {
  const d = fig('sd_search_update', 'OLD POSTINGS CAN REMAIN PHYSICALLY', 310, 8);
  d.text(36, 44, 'segment 1, immutable', { cls: 'xs', a: 'start' });
  d.rect(30, 52, 270, 86, { r: 4, fill: C.card });
  d.mono(44, 72, `d1  ${S.texts[0]}`, { a: 'start', size: 10 });
  d.mono(44, 96, `d2  ${S.texts[1]}`, { a: 'start', size: 10 });
  d.line(40, 72, 164, 72, { stroke: C.acc, sw: 1.4, single: true });
  d.rect(214, 62, 30, 20, { r: 0, fill: C.accSoft, stroke: C.acc, sw: 0.9 });
  d.mono(229, 72, '0', { size: 10 });
  d.rect(214, 86, 30, 20, { r: 0, fill: C.paper, sw: 0.9 });
  d.mono(229, 96, '1', { size: 10 });
  d.text(229, 122, 'live mask', { cls: 'xs' });
  d.text(36, 152, 'segment 2, newer', { cls: 'xs', a: 'start' });
  d.rect(30, 160, 270, 56, { r: 4, fill: C.card });
  d.mono(44, 188, `d1  ${S.texts[2]}`, { a: 'start', size: 10 });
  d.rect(214, 178, 30, 20, { r: 0, fill: C.paper, sw: 0.9 });
  d.mono(229, 188, '1', { size: 10 });
  d.laptop(480, 62, 110);
  d.mono(535, 92, 'bird', { size: 12 });
  d.text(535, 160, 'query view', { cls: 'sm' });
  d.mono(535, 180, 'returns d2 only', { size: 10, color: C.acc });
  d.arrow(478, 96, 304, 84, { stroke: C.ink2, dash: [4, 3], hl: 6 });
  d.arrow(478, 112, 304, 188, { stroke: C.ink2, dash: [4, 3], hl: 6 });
  d.text(330, 236, 'merge later', { cls: 'sm' });
  d.carrow([[165, 220], [200, 262], [334, 262]], { stroke: C.gray, hl: 6 });
  d.text(346, 226, 'segment 3, after a merge', { cls: 'xs', a: 'start' });
  d.rect(340, 234, 280, 58, { r: 4, fill: C.paper });
  d.mono(354, 252, `d2  ${S.texts[1]}`, { a: 'start', size: 10 });
  d.mono(354, 276, `d1  ${S.texts[2]}`, { a: 'start', size: 10 });
  d.text(166, 290, 'the dead entry is reclaimed here', { cls: 'xs' });
  d.travel([[478, 96], [304, 84]], { at: [0, 0.25], r: 4 });
  d.travel([[478, 112], [304, 188]], { at: [0, 0.25], r: 4, color: C.ink2 });
  d.pulse(229, 72, { at: [0.25, 0.45], r1: 20 });
  d.travel([[304, 96], [478, 104]], { at: [0.45, 0.7], token: 'packet' });
  return d.svg();
}

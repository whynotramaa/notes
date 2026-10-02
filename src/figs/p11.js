import { D, C } from '../lib/draw.js';

const toks = ['The', 'cat', 'sat', 'bec.', 'it', 'was'];

export function no_cache() {
  const d = new D(640, 270, 'no_cache');
  d.text(10, 16, 'WITHOUT A CACHE: EVERY STEP RECOMPUTES K AND V FOR THE WHOLE PREFIX', { cls: 'cap', a: 'start' });
  const cs = 52;
  for (let s = 0; s < 6; s++) {
    const y = 36 + s * 36;
    d.text(70, y + 13, `step ${s + 1}`, { cls: 'sm', a: 'end' });
    for (let i = 0; i <= s; i++) {
      const redo = i < s;
      d.box(84 + i * cs, y, cs - 6, 26, 'k, v', { cls: 'mono', size: 9.5, fill: redo ? C.accSoft : C.card, stroke: redo ? C.acc : C.ink2, sw: 0.8, r: 4 });
    }
    d.mono(84 + 6 * cs + 10, y + 13, `${s + 1} computed`, { size: 9.5, a: 'start', color: C.gray });
  }
  toks.forEach((t, i) => d.text(84 + i * cs + (cs - 6) / 2, 260, t, { cls: 'xs' }));
  d.hand(520, 70, 'orange = work\nalready done\nlast step', { size: 15, vc: true });
  d.text(520, 150, 'total: 1 + 2 + … + 6 = 21', { cls: 'mono', size: 10 });
  return d.svg();
}

export function with_cache() {
  const d = new D(640, 260, 'with_cache');
  d.text(10, 16, 'WITH A CACHE: COMPUTE THE NEW TOKEN’S q, k, v, APPEND k, v, LOOK UP THE REST', { cls: 'cap', a: 'start' });
  d.rect(20, 48, 420, 70, { r: 8, fill: C.card, stroke: C.ink2, sw: 1 });
  d.text(34, 64, 'KV CACHE (ONE LAYER)', { cls: 'cap', a: 'start' });
  toks.slice(0, 5).forEach((t, i) => {
    d.box(34 + i * 66, 74, 58, 34, `k${i} v${i}`, { cls: 'mono', size: 10, fill: C.paper, stroke: C.slate, sw: 0.9, r: 4 });
    d.text(63 + i * 66, 128, t, { cls: 'xs' });
  });
  d.box(364, 74, 62, 34, 'k5 v5', { cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc, sw: 1.2, r: 4 });
  d.text(395, 128, 'was (new)', { cls: 'xs', color: C.acc });
  d.box(470, 160, 100, 34, '"was"', { cls: 'mono', size: 11, fill: C.accSoft, stroke: C.acc });
  d.arrow(520, 158, 520, 132, { stroke: C.ink2 });
  d.text(520, 210, 'compute q5, k5, v5', { cls: 'xs' });
  d.carrow([[500, 132], [460, 112], [430, 96]], { stroke: C.acc, sw: 1.1 });
  d.text(468, 92, 'append', { cls: 'xs', a: 'start', color: C.acc });
  d.carrow([[560, 132], [580, 60], [440, 40], [220, 44]], { stroke: C.slate, sw: 1, dash: [4, 3] });
  d.text(400, 32, 'q5 scores against all six keys', { cls: 'xs', color: C.slate });
  d.hand(230, 200, 'nothing old is recomputed;\nthe shelf grows by one box per step', { size: 15, vc: true });
  return d.svg();
}

export function cache_work() {
  const d = new D(640, 240, 'cache_work');
  d.text(10, 16, 'K/V COMPUTATIONS TO GENERATE T TOKENS, PER LAYER', { cls: 'cap', a: 'start' });
  const M = d.axes(70, 40, 480, 150, { xmin: 0, xmax: 1000, ymin: 0, ymax: 500500, xl: 'tokens generated', yl: 'k/v computations' });
  d.fn((t) => t * (t + 1) / 2, 0, 1000, M, { stroke: C.acc, sw: 1.6 });
  d.fn((t) => t, 0, 1000, M, { stroke: C.slate, sw: 1.6 });
  d.mono(M.X(1000) - 4, M.Y(500500) + 4, 'no cache: 500,500', { size: 9.5, a: 'end', color: C.acc });
  d.mono(M.X(1000) - 4, M.Y(0) - 12, 'cache: 1,000', { size: 9.5, a: 'end', color: C.slate });
  [0, 250, 500, 750, 1000].forEach((t) => d.text(M.X(t), 206, String(t), { cls: 'xs' }));
  d.hand(250, 90, 'T(T + 1)/2 versus T', { size: 16 });
  return d.svg();
}

export function why_not_q() {
  const d = new D(640, 240, 'why_not_q');
  d.text(10, 16, 'DURING GENERATION, ONLY THE NEWEST ROW OF THE WEIGHT GRID IS COMPUTED', { cls: 'cap', a: 'start' });
  const T = 6, cs = 28, x0 = 60, y0 = 40;
  d.grid(x0, y0, T, T, cs, cs, { cellFill: (r, c) => (c > r ? C.paper : r === T - 1 ? C.accSoft : C.faint), lsw: 0.4 });
  toks.forEach((t, i) => { d.mono(x0 - 6, y0 + i * cs + cs / 2, t, { size: 9, a: 'end' }); d.mono(x0 + i * cs + cs / 2, y0 + T * cs + 12, t, { size: 8.5 }); });
  d.text(x0 + T * cs + 16, y0 + 2.5 * cs, 'old queries: used once,\nnever needed again', { cls: 'sm', a: 'start', vc: true });
  d.text(x0 + T * cs + 16, y0 + 5.5 * cs, 'new query: needs every key\nand value, old and new', { cls: 'sm', a: 'start', vc: true, color: C.acc });
  d.hand(470, 210, 'so we cache K and V, not Q', { size: 16 });
  return d.svg();
}

export function cache_calc() {
  const d = new D(640, 250, 'cache_calc');
  d.text(10, 16, 'KV CACHE SIZE = 2 × LAYERS × KV HEADS × HEAD SIZE × TOKENS × BATCH × BYTES', { cls: 'cap', a: 'start' });
  const rows = [
    ['Finch-19, 1,024 tokens', 2 * 8 * 8 * 64 * 1024 * 2],
    ['Llama 3 8B, 8,192 tokens', 2 * 32 * 8 * 128 * 8192 * 2],
    ['Llama 3 8B, 128k tokens', 2 * 32 * 8 * 128 * 131072 * 2],
    ['same, batch of 8', 2 * 32 * 8 * 128 * 131072 * 2 * 8],
    ['same, 32 KV heads (no GQA)', 2 * 32 * 32 * 128 * 131072 * 2 * 8],
  ];
  const fmtB = (b) => b >= 1e9 ? (b / 2 ** 30).toFixed(1) + ' GiB' : (b / 2 ** 20).toFixed(1) + ' MiB';
  const L = (b) => Math.max(2, (Math.log10(b) - 6) / (12 - 6) * 330);
  rows.forEach(([lab, b], i) => {
    const y = 40 + i * 38, over = b > 80e9;
    d.text(200, y + 12, lab, { cls: 'sm', a: 'end' });
    d.rect(210, y, L(b), 24, { r: 2, fill: over ? C.red : C.acc, fop: 0.3, stroke: over ? C.red : C.acc, sw: 0.9 });
    d.mono(214 + L(b), y + 12, fmtB(b), { size: 10, a: 'start', color: over ? C.red : C.ink });
  });
  d.line(210 + L(80e9), 34, 210 + L(80e9), 232, { stroke: C.red, sw: 1, dash: [4, 3], single: true });
  d.text(206 + L(80e9), 240, '80 GB GPU', { cls: 'xs', color: C.red, a: 'end' });
  d.text(330, 240, 'log scale', { cls: 'xs' });
  return d.svg();
}

export function prefill_decode() {
  const d = new D(640, 240, 'prefill_decode');
  d.text(10, 16, 'TWO PHASES OF GENERATION', { cls: 'cap', a: 'start' });
  d.rect(30, 60, 200, 90, { r: 6, fill: C.slateSoft, stroke: C.slate, sw: 1.1 });
  d.text(130, 92, 'PREFILL', { cls: 'ttl', color: C.slate });
  d.text(130, 114, 'whole prompt at once', { cls: 'sm' });
  d.text(130, 132, 'fills the cache', { cls: 'xs' });
  for (let i = 0; i < 8; i++) {
    const x = 260 + i * 44;
    d.rect(x, 60, 32, 90, { r: 4, fill: C.accFaint, stroke: C.acc, sw: 0.9 });
    d.text(x + 16, 108, `+1`, { cls: 'mono', size: 9.5 });
  }
  d.text(436, 50, 'DECODE: one token per step', { cls: 'ttl', color: C.acc });
  d.text(130, 176, 'limited by arithmetic', { cls: 'sm' });
  d.text(130, 192, 'each weight used for many tokens', { cls: 'xs' });
  d.text(436, 176, 'limited by memory reads', { cls: 'sm', color: C.acc });
  d.text(436, 192, 'every step re-reads all weights and the whole cache', { cls: 'xs' });
  d.hand(436, 224, 'smaller cache = faster decoding, not just cheaper', { size: 15 });
  return d.svg();
}

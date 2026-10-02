import { D, C } from '../lib/draw.js';

const GC = [C.acc, C.slate, C.ink2, C.gray];

export function gqa_spectrum() {
  const d = new D(640, 270, 'gqa_spectrum');
  const panel = (x0, title, nkv, sub) => {
    d.text(x0 + 95, 18, title, { cls: 'ttl' });
    d.text(x0 + 95, 36, sub, { cls: 'xs' });
    const grp = 8 / nkv;
    for (let h = 0; h < 8; h++) { const g = Math.floor(h / grp); d.rect(x0 + 8 + h * 23, 60, 18, 40, { r: 3, fill: nkv === 8 ? C.accSoft : C.paper, stroke: nkv === 8 ? C.acc : GC[g % 4], sw: 1.1 }); d.text(x0 + 17 + h * 23, 112, `q${h}`, { cls: 'xs' }); }
    const kw = 184 / nkv;
    for (let g = 0; g < nkv; g++) {
      const kx = x0 + 8 + g * kw + kw / 2 - 9;
      d.rect(kx, 176, 18, 40, { r: 3, fill: C.slateSoft, stroke: nkv === 8 ? C.slate : GC[g % 4], sw: 1.1 });
      for (let h = 0; h < 8; h++) { if (Math.floor(h / grp) !== g) continue; d.line(x0 + 17 + h * 23, 120, kx + 9, 174, { stroke: nkv === 8 ? C.line : GC[g % 4], sw: 0.8, single: true, rough: 0.4, op: 0.8 }); }
    }
    d.text(x0 + 95, 232, `${nkv} K/V head${nkv > 1 ? 's' : ''}`, { cls: 'xs', color: C.slate });
  };
  panel(10, 'MHA', 8, 'every query head has its own K/V');
  panel(220, 'GQA (Finch-24)', 2, 'groups of 4 share one K/V');
  panel(430, 'MQA', 1, 'all heads share one K/V');
  d.text(320, 260, 'K/V projection size and KV cache are proportional to the number of K/V heads: 8 : 2 : 1', { cls: 'sm' });
  return d.svg();
}

export function repeat_kv() {
  const d = new D(640, 250, 'repeat_kv');
  d.text(10, 16, 'MATCHING SHAPES: EACH K/V HEAD IS REPEATED FOR ITS GROUP OF QUERY HEADS', { cls: 'cap', a: 'start' });
  [0, 1].forEach((g) => d.box(40, 70 + g * 70, 80, 40, `kv ${g}`, { cls: 'mono', size: 11, fill: C.slateSoft, stroke: GC[g] }));
  d.text(80, 54, '(B, 2, T, 64)', { cls: 'mono', size: 9.5 });
  for (let h = 0; h < 8; h++) {
    const g = Math.floor(h / 4), y = 40 + h * 25;
    d.box(400, y, 80, 20, `kv ${g}`, { cls: 'mono', size: 9.5, fill: C.paper, stroke: GC[g], sw: 0.9, r: 3 });
    d.text(500, y + 10, `→ q${h}`, { cls: 'mono', size: 9.5, a: 'start' });
    d.line(122, 90 + g * 70, 398, y + 10, { stroke: GC[g], sw: 0.7, single: true, op: 0.7 });
  }
  d.text(440, 30, '(B, 8, T, 64)', { cls: 'mono', size: 9.5 });
  d.text(260, 230, 'repeat_interleave(4, dim=1): kv 0 fills slots 0 to 3, kv 1 fills 4 to 7', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function head_mapping() {
  const d = new D(640, 200, 'head_mapping');
  d.text(10, 16, 'WHICH K/V HEAD DOES QUERY HEAD i READ?  8 QUERY HEADS, 2 K/V HEADS', { cls: 'cap', a: 'start' });
  const row = (y, lab, f, ok) => {
    d.text(170, y + 14, lab, { cls: 'mono', size: 10, a: 'end', color: ok ? C.ink : C.red });
    for (let h = 0; h < 8; h++) {
      const g = f(h), wrong = g !== Math.floor(h / 4);
      d.box(184 + h * 52, y, 44, 28, String(g), { cls: 'mono', size: 12, fill: wrong ? C.paper : C.slateSoft, stroke: wrong ? C.red : GC[g], sw: wrong ? 1.4 : 1, r: 4, tc: wrong ? C.red : undefined });
    }
  };
  for (let h = 0; h < 8; h++) d.text(206 + h * 52, 44, `q${h}`, { cls: 'xs' });
  row(56, 'repeat_interleave  (i // 4)', (h) => Math.floor(h / 4), true);
  row(106, '.repeat  (i % 2)', (h) => h % 2, false);
  d.hand(330, 172, 'same shape, no error, half the heads read the wrong keys', { size: 15, color: C.red });
  return d.svg();
}

export function cache_vs_ctx() {
  const d = new D(640, 260, 'cache_vs_ctx');
  d.text(10, 16, 'KV CACHE PER SEQUENCE: 32 LAYERS, HEAD SIZE 128, 16-BIT', { cls: 'cap', a: 'start' });
  const per = (h) => 2 * 32 * h * 128 * 2;
  const M = d.axes(80, 40, 450, 170, { xmin: 0, xmax: 131072, ymin: 0, ymax: 90e9, xl: 'context length (tokens)', yl: 'bytes' });
  [[32, C.red, 'MHA (32)'], [8, C.acc, 'GQA (8)'], [1, C.slate, 'MQA (1)']].forEach(([h, col, lab], k) => {
    d.fn((t) => per(h) * t, 0, 131072, M, { stroke: col, sw: 1.6, n: 4 });
    const v = per(h) * 131072;
    d.mono(M.X(131072) + 6, M.Y(v), `${lab}: ${(v / 2 ** 30).toFixed(0)} GiB`, { size: 9, a: 'start', color: col });
  });
  d.line(80, M.Y(80e9), 560, M.Y(80e9), { stroke: C.ink2, sw: 0.9, dash: [5, 3], single: true });
  d.text(84, M.Y(80e9) - 8, '80 GB GPU', { cls: 'xs', a: 'start' });
  [0, 32768, 65536, 98304, 131072].forEach((t) => d.text(M.X(t), 226, t.toLocaleString('en-US'), { cls: 'xs' }));
  return d.svg();
}

export function decode_reads() {
  const d = new D(640, 270, 'decode_reads');
  d.text(10, 16, 'BYTES READ PER GENERATED TOKEN: WEIGHTS + KV CACHE, LLAMA 3 8B SIZE, ONE SEQUENCE', { cls: 'cap', a: 'start' });
  const W = 16.06e9, per = (h) => 2 * 32 * h * 128 * 2;
  const ctx = [8192, 32768, 131072];
  const S = 340 / 85e9;
  ctx.forEach((T, i) => {
    const y = 50 + i * 70;
    d.text(10, y + 8, `${T.toLocaleString('en-US')} tokens`, { cls: 'ttl', a: 'start', size: 11 });
    [[32, 'MHA'], [8, 'GQA']].forEach(([h, lab], k) => {
      const yy = y + 18 + k * 22, c = per(h) * T, tot = W + c;
      d.text(116, yy + 8, lab, { cls: 'xs', a: 'end' });
      d.rect(122, yy, W * S, 16, { r: 2, fill: C.ink2, fop: 0.3, stroke: C.ink2, sw: 0.7 });
      d.rect(122 + W * S, yy, c * S, 16, { r: 2, fill: h === 8 ? C.acc : C.red, fop: 0.35, stroke: h === 8 ? C.acc : C.red, sw: 0.7 });
      d.mono(128 + tot * S, yy + 8, `${(tot / 1e9).toFixed(1)} GB  ≈ ${(tot / 2e12 * 1000).toFixed(1)} ms at 2 TB/s`, { size: 9, a: 'start' });
    });
  });
  d.text(122, 262, 'grey: weights (16.1 GB)   coloured: KV cache', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function gqa_tradeoff() {
  const d = new D(640, 240, 'gqa_tradeoff');
  d.text(10, 16, 'THE TRADE-OFF, SKETCHED: SPEED ACROSS, QUALITY UP  (ILLUSTRATIVE)', { cls: 'cap', a: 'start' });
  const M = d.axes(80, 40, 440, 150, { xmin: 0, xmax: 1, ymin: 0, ymax: 1, xl: 'decoding speed →', yl: 'quality' });
  [[0.15, 0.9, 'MHA', C.ink2], [0.75, 0.86, 'GQA-8', C.acc], [0.92, 0.62, 'MQA', C.slate]].forEach(([x, y, n, col]) => { d.dot(M.X(x), M.Y(y), 6, col); d.text(M.X(x) + 10, M.Y(y) - 10, n, { cls: 'ttl', a: 'start', color: col }); });
  d.hand(400, 210, 'nearly MHA quality at nearly MQA speed', { size: 15 });
  return d.svg();
}

export function uptrain() {
  const d = new D(640, 220, 'uptrain');
  d.text(10, 16, 'CONVERTING AN MHA CHECKPOINT TO GQA: AVERAGE EACH GROUP, THEN TRAIN A LITTLE MORE', { cls: 'cap', a: 'start' });
  for (let h = 0; h < 8; h++) { const g = Math.floor(h / 4); d.box(20 + h * 48, 60, 40, 36, `k${h}`, { cls: 'mono', size: 10, fill: C.slateSoft, stroke: GC[g] }); }
  d.brace(20, 208, 104, { label: 'mean of k0 to k3' });
  d.brace(212, 400, 104, { label: 'mean of k4 to k7' });
  d.arrow(114, 140, 114, 156, { stroke: GC[0] }); d.arrow(306, 140, 306, 156, { stroke: GC[1] });
  d.box(84, 160, 60, 36, 'k′0', { cls: 'mono', size: 11, fill: C.slateSoft, stroke: GC[0] });
  d.box(276, 160, 60, 36, 'k′1', { cls: 'mono', size: 11, fill: C.slateSoft, stroke: GC[1] });
  d.text(520, 110, 'same for values', { cls: 'sm' });
  d.text(520, 140, 'then "uptrain" with about', { cls: 'sm' });
  d.text(520, 158, '5% of the original compute', { cls: 'sm', color: C.acc });
  return d.svg();
}

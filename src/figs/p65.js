import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { D, C } from '../lib/draw.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const cacheBox = (d, x, y, w, h, s = 'cache', hot = false) => { d.ram(x, y, w, h, { chips: Math.max(2, Math.round(w / 40)), chip: (i) => (hot && i === 0 ? C.accSoft : C.paper) }); if (s) d.text(x + w / 2, y + h + 14, s, { cls: 'sm' }); };
export function where_sd_caching(stage=99) { return systemMap("sd_caching", ["Cache layers: local, shared, HTTP", "Cache-aside and read-through", "Write-through and write-behind", "TTL and cache invalidation", "Eviction: LRU and LFU", "Stampede, penetration, avalanche", "Cache failure and fallback", "Case study: caching a hot read"], stage); }
export function cover_sd_caching() { return systemCover("sd_caching", 6, ["Caching", "strategies"], "Caching", ["Cache layers: local, shared, HTTP", "Cache-aside and read-through", "Write-through and write-behind", "TTL and cache invalidation", "Eviction: LRU and LFU", "Stampede, penetration, avalanche", "Cache failure and fallback", "Case study: caching a hot read"]); }
export function sd_caching_placement() {
const d=illustration('sd_caching_placement','PRIVATE PROCESS CACHES AND A SHARED CACHE PLACE COPIES DIFFERENTLY',355);
  d.text(164,47,'in each application process',{cls:'ttl'});d.text(486,47,'shared service',{cls:'ttl'});
  [55,185].forEach(y=>{d.rect(46,y+15,236,107,{fill:C.paper,stroke:C.line});d.cpu(61,y+39,40,{label:'app'});figShelf(d,122,y+45,['key','copy'],{width:141,hot:1,height:33});});
  [358,529].forEach(x=>d.cpu(x,81,43,{label:'app'}));
  d.server(430,200,110,99,{fill:C.accSoft,stroke:C.acc,label:'network cache',unit:22});
  [379,550].forEach(x=>d.arrow(x,136,485,192,{stroke:C.acc,hl:5}));d.text(164,324,'independent warm state',{cls:'sm'});return d.svg();
}
export function sd_caching_levels() { return systemFigure("sd_caching_levels", "EACH CACHE SHORTENS A DIFFERENT PATH", "flow", ["browser response", "edge response", "app value", "DB page"], "cached pages still participate in queries"); }
export function sd_caching_aside() {
  const d = illustration('sd_caching_aside', 'CACHE-ASIDE: THE APP CHECKS, MISSES, READS THE DATABASE, THEN FILLS', 330);
  d.server(270, 60, 100, 110, { label: 'application', led: () => true });
  cacheBox(d, 40, 80, 150, 50);
  d.db(470, 66, 120, 110, { label: 'database' });
  d.arrow(262, 92, 196, 92, { stroke: C.ink2 }); d.mono(229, 80, '1 get', { size: 9.5 });
  d.arrow(196, 118, 262, 118, { stroke: C.gray }); d.mono(229, 132, 'miss', { size: 9.5 });
  d.arrow(378, 92, 462, 92, { stroke: C.ink2 }); d.mono(420, 80, '2 read', { size: 9.5 });
  d.arrow(462, 130, 378, 130, { stroke: C.ink2 }); d.mono(420, 144, 'score, v7', { size: 9.5 });
  d.carrow([[300, 176], [210, 220], [116, 150]], { stroke: C.acc }); d.mono(212, 236, '3 fill, TTL 30 s', { size: 10, color: C.acc });
  d.travel([[262, 92], [196, 92], [262, 118], [378, 92], [462, 92], [462, 130], [378, 130], [300, 176], [116, 150]], { dur: 7, label: 'v7', w: 24 });
  d.text(320, 300, 'if the fill fails, the read still returns the database result', { cls: 'xs' });
  return d.svg();
}
export function sd_caching_through() { return systemFigure("sd_caching_through", "THE LOADER IS INSIDE THE CACHE CONTRACT", "flow", ["caller", "cache lookup", "bounded loader", "source result"], "a timeout must not become a cached absence"); }
export function sd_caching_throughwrite() { return systemFigure("sd_caching_throughwrite", "ACKNOWLEDGEMENT FOLLOWS THE SOURCE CONTRACT", "flow", ["write", "authoritative commit", "copy update", "return result"], "define every partial failure"); }
export function sd_caching_behind() {
  const d = illustration('sd_caching_behind', 'WHERE THE ACK HAPPENS: AFTER THE DATABASE, OR AFTER A BUFFER', 330);
  panel(d, 20, 44, 292, 250, 'write-through');
  d.person(50, 80, 28); d.db(210, 74, 70, 70); cacheBox(d, 120, 180, 90, 36, '');
  d.arrow(78, 96, 202, 104, { stroke: C.ink2 }); d.text(140, 88, '1 commit', { cls: 'xs' });
  d.arrow(202, 128, 78, 120, { stroke: C.ink2 }); d.text(140, 136, '2 ack', { cls: 'xs' });
  d.text(166, 262, 'slower ack, durable promise', { cls: 'sm' });
  panel(d, 328, 44, 292, 250, 'write-behind', true);
  d.person(358, 80, 28); cacheBox(d, 430, 82, 90, 36, ''); d.db(540, 180, 60, 64);
  d.arrow(386, 96, 426, 98, { stroke: C.acc }); d.arrow(426, 118, 386, 116, { stroke: C.acc }); d.text(406, 136, 'ack', { cls: 'xs', color: C.acc });
  d.carrow([[500, 138], [520, 170], [540, 200]], { stroke: C.ink2, dash: [4, 4] }); d.text(474, 180, 'later', { cls: 'xs' });
  d.travel([[386, 96], [426, 98], [386, 116]], { dur: 3, r: 3 });
  d.text(474, 262, 'fast ack: the buffer must survive', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_caching_race() {
  const d = illustration('sd_caching_race', 'AN OLD READ FILLS THE CACHE AFTER THE WRITER DELETED THE KEY', 340);
  const lanes = [['reader', 70], ['database', 150], ['writer', 230]];
  lanes.forEach(([s, y]) => { d.text(30, y, s, { cls: 'ttl', a: 'start', size: 12 }); d.line(120, y, 610, y, { stroke: C.line, dash: [3, 5], single: true }); });
  cacheBox(d, 520, 280, 90, 30, 'cache');
  const ev = [[150, 70, 'read v7', C.ink2], [250, 230, 'commit v8', C.ink2], [340, 230, 'delete key', C.ink2], [440, 70, 'fill v7', C.acc]];
  ev.forEach(([x, y, s, col]) => { d.dot(x, y, 4, col); d.text(x, y - 16, s, { cls: 'sm', color: col === C.acc ? C.acc : undefined }); });
  d.arrow(150, 74, 150, 146, { stroke: C.ink2, hl: 5 }); d.arrow(250, 226, 250, 154, { stroke: C.ink2, hl: 5 });
  d.carrow([[340, 234], [440, 270], [516, 290]], { stroke: C.gray, hl: 6 });
  d.carrow([[440, 74], [500, 160], [560, 276]], { stroke: C.acc });
  d.travel('M440,74 Q500,160 560,276', { dur: 5, at: [0.5, 0.9], label: 'v7', w: 24 });
  d.text(320, 330, 'every later hit returns v7; compare versions at the fill', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_caching_eviction() {
const d=illustration('sd_caching_eviction','CAPACITY PRESSURE AND AGE ARE DIFFERENT REASONS TO REMOVE AN ENTRY',335);
  d.text(156,49,'capacity limit',{cls:'ttl'});figShelf(d,36,80,['A','B','C'],{width:240,height:53,hot:0});
  figPage(d,51,181,53,75,'A',true);d.arrow(76,140,76,175,{stroke:C.acc});figPage(d,176,181,53,75,'D');d.arrow(203,175,203,141,{stroke:C.ink2});
  d.text(155,282,'evict by recency or frequency',{cls:'sm'});
  d.clock(480,125,93,{t:.7});figPage(d,448,210,64,62,'entry',true);d.text(480,49,'freshness limit',{cls:'ttl'});d.text(480,296,'expire by age + policy',{cls:'sm'});
  return d.svg();
}
export function sd_caching_stampede() {
const d=illustration('sd_caching_stampede','ONE LOADER FETCHES A HOT MISSING KEY WHILE OTHER CALLERS WAIT',345);
  [54,138,222].forEach(y=>{d.laptop(37,y,70);d.arrow(114,y+24,271,161,{stroke:C.line,hl:5});});
  d.rect(284,90,120,149,{fill:C.accFaint,stroke:C.acc});d.key(315,120,44,{stroke:C.acc});d.text(344,173,'one loader',{cls:'ttl'});d.text(344,205,'bounded waiters',{cls:'sm',size:10});
  d.db(513,112,83,101,{under:'source'});d.arrow(412,160,505,160,{stroke:C.acc});
  d.text(320,306,'single-flight reuses one in-flight fetch for the same key',{cls:'sm'});return d.svg();
}
export function sd_caching_correlated() {
  const d = illustration('sd_caching_correlated', 'MANY KEYS MISSING HITS THE DATABASE; ONE HOT KEY HITS ONE CACHE NODE', 330);
  panel(d, 20, 44, 292, 250, 'many keys miss');
  for (let i = 0; i < 8; i++) d.rect(40 + (i % 4) * 30, 74 + Math.floor(i / 4) * 30, 24, 24, { r: 3, stroke: C.gray, dash: [3, 3] });
  d.text(100, 150, 'expired together', { cls: 'xs' });
  d.db(200, 72, 80, 90);
  for (let i = 0; i < 6; i++) d.travel([[150, 90 + i * 8], [196, 110]], { dur: 1.5, at: [i / 8, i / 8 + 0.5], r: 2.5, color: C.ink2 });
  d.text(166, 230, 'source refill surge', { cls: 'sm' });
  panel(d, 328, 44, 292, 250, 'one key hits', true);
  for (let i = 0; i < 4; i++) d.server(350 + i * 64, 80, 50, 70, { unit: 14, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 });
  d.mono(439, 166, 'score:m7', { size: 10, color: C.acc });
  for (let i = 0; i < 8; i++) d.travel([[350 + i * 30, 250], [439, 154]], { dur: 1.4, at: [i / 10, i / 10 + 0.5], r: 2.5 });
  d.text(474, 274, 'a hit can still overload its owner', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_caching_outage() {
const d=illustration('sd_caching_outage','LOSS OF CACHE REUSE MULTIPLIES THE OFFERED SOURCE READS',330);
  ['normal','cache unavailable'].forEach((s,i)=>{d.text(35,73+i*121,s,{cls:'ttl',a:'start'});for(let c=0;c<(i?10:1);c++)d.envelope(183+c*40,54+i*121,32,27,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2});});
  d.text(178,111,'100 source reads/s',{cls:'sm',a:'start'});d.text(178,232,'1,000 offered source reads/s',{cls:'sm',a:'start',color:C.acc});
  d.mono(320,284,'1,000 ÷ 100 = 10 × normal demand',{size:13});d.text(320,311,'each envelope represents 100 reads/s in this illustrative workload',{cls:'sm'});return d.svg();
}
export function sd_caching_complete() {
  const d = illustration('sd_caching_complete', 'AN ELIGIBLE HIT, OR A BOUNDED MISS THAT ENDS IN A SAFE FILL', 320);
  d.phone(26, 90, 70);
  cacheBox(d, 120, 100, 110, 40, '1 fresh hit?');
  d.arrow(68, 120, 114, 120, { stroke: C.ink2, hl: 6 });
  d.carrow([[175, 96], [120, 60], [70, 86]], { stroke: C.ink2, hl: 6 }); d.text(120, 52, 'yes', { cls: 'xs' });
  d.arrow(236, 120, 290, 120, { stroke: C.gray, hl: 6 }); d.text(262, 108, 'no', { cls: 'xs' });
  d.rect(296, 96, 90, 50, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(341, 121, '2 admit', { cls: 'sm' });
  d.arrow(392, 120, 432, 120, { stroke: C.gray, hl: 6 });
  d.db(440, 86, 70, 70, { under: '3 truth + v' });
  d.carrow([[475, 180], [330, 230], [175, 160]], { stroke: C.acc }); d.text(330, 252, '4 safe fill: version-checked', { cls: 'sm', color: C.acc });
  d.travel('M475,180 Q330,230 175,160', { dur: 4, label: 'v8', w: 24 });
  d.text(320, 300, 'delete every cache and the truth is still there', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_1() {
  const d = illustration('sd_cache_trace_1', 'THE CACHE HOLDS v7; A READER THAT NEEDS v8 MUST NOT USE IT', 300);
  d.db(40, 70, 110, 110, { label: 'truth\nscore 11, v8' });
  cacheBox(d, 240, 100, 140, 46, 'copy: score 10, v7');
  d.arrow(156, 124, 234, 124, { stroke: C.gray, dash: [4, 4] });
  d.person(520, 60, 30, { label: 'public viewer' }); d.arrow(510, 90, 386, 114, { stroke: C.ink2, hl: 6 }); tick(d, 450, 92, 6, C.ink2);
  d.person(520, 170, 30, { label: 'scorer: needs v8' }); d.arrow(510, 190, 386, 134, { stroke: C.acc, hl: 6 }); cross(d, 450, 166, 7);
  d.text(320, 268, 'present is not the same as eligible', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_2() {
  const d = illustration('sd_cache_trace_2', 'TEN PROCESSES, TEN PRIVATE COPIES: 10 × 2,100 B = 21,000 B', 310);
  for (let i = 0; i < 10; i++) {
    const x = 26 + (i % 5) * 120, y = 50 + Math.floor(i / 5) * 110, hot = i === 0;
    d.server(x, y, 90, 70, { unit: 16, fill: hot ? C.accFaint : C.card, stroke: hot ? C.acc : C.ink2 });
    chip(d, x + 14, y + 44, 62, '2,100 B', false, 18);
    d.text(x + 45, y + 84, hot ? 'A restarts' : `process ${String.fromCharCode(65 + i)}`, { cls: 'xs', color: hot ? C.acc : undefined });
  }
  d.during([0.5, 1], (g) => cross(g, 71, 103, 10));
  d.text(320, 290, 'no network hop, but every restart reloads from the source', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_3() {
  const d = illustration('sd_cache_trace_3', 'A SHARED CACHE: 1,000 READS/S AT 90% HITS LEAVES 100 SOURCE LOADS/S', 320);
  [0, 1, 2].forEach((i) => d.server(30, 50 + i * 70, 60, 54, { unit: 14, label: i === 1 ? 'callers' : '' }));
  cacheBox(d, 220, 110, 140, 50, 'shared cache');
  [0, 1, 2].forEach((i) => d.arrow(96, 77 + i * 70, 214, 135, { stroke: C.ink2, hl: 6 }));
  d.db(500, 90, 100, 100, { label: 'database' });
  d.arrow(366, 135, 492, 135, { stroke: C.ink2 }); d.mono(430, 122, '100/s', { size: 10 });
  d.mono(150, 270, '1,000 × 0.9 = 900 hits/s', { size: 10 });
  d.mono(430, 230, 'cache down: 1,000/s', { size: 10, color: C.acc });
  d.during([0.5, 1], (g) => { cross(g, 290, 135, 14); g.arrow(366, 150, 492, 160, { stroke: C.acc, sw: 3 }); });
  d.text(320, 300, 'the fallback needs admission control, or the database takes all 1,000', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_4() {
  const d = illustration('sd_cache_trace_4', 'THE KEY DECIDES WHAT MAY BE SHARED, AND A PAGE HIT STILL RUNS A QUERY', 330);
  const rows = [['GET m7 · json · en', 'public, shared', false], ['GET m7 · json · hi', 'separate key', false], ['scorer view of m7', 'private: bypass', false], ['DB buffer page 4812', 'query still runs', true]];
  rows.forEach(([k, s, hot], i) => {
    const y = 58 + i * 60;
    if (i < 3) d.doc(40, y - 6, 34, 42, { lines: false, fill: i === 2 ? C.paper : C.card }); else d.rect(40, y - 6, 34, 42, { r: 2, fill: C.accSoft, stroke: C.acc });
    if (i === 2) d.lock(48, y + 2, 18);
    chip(d, 96, y + 4, 220, k, hot, 24);
    d.arrow(324, y + 16, 370, y + 16, { stroke: C.gray, hl: 5 });
    d.text(384, y + 16, s, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.gear(560, 270, 30, { spin: 4, fill: C.accSoft, stroke: C.acc });
  return d.svg();
}
export function sd_cache_trace_5() {
  const d = illustration('sd_cache_trace_5', 'CACHE-ASIDE STEP BY STEP: LOOKUP, ADMIT, READ, SAFE FILL', 320);
  const st = [['lookup', 'miss'], ['admit', 'one load allowed'], ['source read', '20 ms: score + v'], ['safe fill', 'copy only']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    if (i === 0) cacheBox(d, x + 10, 70, 100, 40, '');
    if (i === 1) { d.rect(x + 30, 60, 60, 60, { r: 30, fill: C.card, stroke: C.ink2 }); d.mono(x + 60, 90, '1/4', { size: 11 }); }
    if (i === 2) d.db(x + 30, 56, 60, 66);
    if (i === 3) cacheBox(d, x + 10, 70, 100, 40, '', true);
    d.text(x + 60, 150, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x + 60, 172, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 116, 90, x + 144, 90, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 90], [540, 90]], { dur: 5, r: 4 });
  d.text(320, 240, 'the source result goes back to the caller even if step 4 fails', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_6() {
  const d = illustration('sd_cache_trace_6', 'READ-THROUGH: THE CALLER SEES ONE GET; THE LOADER LIVES BEHIND IT', 320);
  d.server(30, 90, 70, 80, { label: 'caller' });
  d.rect(170, 54, 290, 190, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(315, 74, 'cache service', { cls: 'ttl' });
  cacheBox(d, 190, 100, 110, 40, '');
  d.rect(330, 96, 110, 48, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(385, 120, 'loader', { cls: 'sm' });
  d.db(510, 90, 90, 90, { label: 'source' });
  d.arrow(106, 120, 184, 120, { stroke: C.ink2 }); d.mono(145, 108, 'get m7', { size: 9.5 });
  d.arrow(446, 120, 502, 120, { stroke: C.ink2, hl: 6 });
  d.carrow([[540, 186], [400, 216], [250, 150]], { stroke: C.acc }); d.text(400, 232, 'install v7 under the same rule', { cls: 'xs', color: C.acc });
  d.text(315, 280, 'a loader timeout is an error, never a cached "not found"', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_7() {
  const d = illustration('sd_cache_trace_7', '900 HITS AT 2 MS, 100 MISSES AT 22 MS: A 4 MS MEAN, NOT A TAIL BOUND', 320);
  for (let i = 0; i < 100; i++) d.fillRect(40 + (i % 20) * 14, 56 + Math.floor(i / 20) * 14, 11, 11, i < 90 ? C.card : C.accSoft, 1, 2);
  d.text(180, 140, 'each square = 10 reads/s', { cls: 'xs' });
  d.mono(110, 170, '900/s hit · 2 ms', { size: 10 });
  d.mono(260, 170, '100/s miss · 22 ms', { size: 10, color: C.acc });
  d.mono(470, 90, '0.9 × 2 + 0.1 × 22', { size: 11 });
  d.mono(470, 116, '= 1.8 + 2.2 = 4 ms', { size: 12, color: C.acc });
  d.text(470, 160, 'the p99 still sits\nin the 22 ms misses', { cls: 'sm', vc: true });
  d.text(320, 260, 'saved work counts at a named boundary: 900 source reads/s avoided', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_8() {
  const d = illustration('sd_cache_trace_8', 'A CACHED "NOT FOUND" HIDES m8 FROM TIME 2 UNTIL IT EXPIRES AT 5', 300);
  const X = 70, s = 96;
  ruler(d, X, 220, 5 * s, 5, 1, ' s');
  d.rect(X, 90, 5 * s, 32, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 2.5 * s, 106, 'cached: m8 absent', { cls: 'sm' });
  d.rect(X + 2 * s, 140, 3 * s, 32, { r: 3, fill: C.accFaint, stroke: C.acc, dash: [4, 3] }); d.text(X + 3.5 * s, 156, 'm8 exists, readers still told "absent"', { cls: 'xs', color: C.acc });
  d.pin(X + 2 * s, 86, { label: 'created', dy: -36 });
  d.line(X + 5 * s, 80, X + 5 * s, 214, { stroke: C.acc, sw: 1.6, single: true }); d.text(X + 5 * s, 70, 'reload', { cls: 'xs', color: C.acc });
  d.text(320, 266, 'only cache a verified absence; a timeout means unknown', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_9() {
  const d = illustration('sd_cache_trace_9', 'WRITE-THROUGH ACKS AFTER THE SOURCE COMMIT; THE COPY UPDATE CAN STILL FAIL', 320);
  d.person(40, 70, 30, { label: 'scorer' });
  d.db(230, 56, 110, 100, { label: 'commit c9\nscore 11, v8', fill: C.card });
  cacheBox(d, 440, 80, 130, 46, 'copy v7 → v8');
  d.arrow(72, 90, 222, 96, { stroke: C.ink2 }); d.arrow(222, 120, 72, 112, { stroke: C.ink2 }); d.text(146, 132, 'ack', { cls: 'xs' });
  d.arrow(346, 104, 434, 104, { stroke: C.gray, dash: [4, 4] }); d.during([0.5, 1], (g) => cross(g, 390, 104, 8, C.ink2));
  d.text(320, 210, 'retry c9 returns the committed result, not a second change', { cls: 'sm' });
  d.text(320, 240, 'readers decide by version whether the copy is still usable', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_10() {
  const d = illustration('sd_cache_trace_10', 'WRITE-BEHIND: A 5 S STALL AT 20 UPDATES/S LEAVES 100 ACKED BUT UNWRITTEN', 310);
  d.person(40, 80, 30, { label: '20 updates/s' });
  d.rect(170, 70, 220, 90, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(280, 60, 'memory buffer', { cls: 'xs' });
  for (let i = 0; i < 20; i++) d.envelope(182 + (i % 10) * 20, 86 + Math.floor(i / 10) * 30, 16, 12, { fill: C.accSoft, stroke: C.acc });
  d.text(280, 176, '100 unsent (each = 5): 100 × 200 B = 20,000 B', { cls: 'xs' });
  d.db(490, 70, 100, 90, { label: 'database' });
  d.arrow(396, 115, 482, 115, { stroke: C.gray, dash: [4, 4] }); d.text(440, 100, 'stalled', { cls: 'xs' });
  d.during([0.6, 1], (g) => { bolt(g, 280, 196); g.text(320, 250, 'crash: 100 acknowledged updates gone', { cls: 'sm', color: C.acc }); });
  return d.svg();
}
export function sd_cache_trace_11() {
  const d = illustration('sd_cache_trace_11', 'A DURABLE BUFFER REPLAYS u7 AFTER A LOST ACK, THEN CONTINUES WITH u8', 300);
  d.text(130, 54, 'durable buffer', { cls: 'ttl' });
  d.tape(60, 70, ['u7', 'u8'], { cw: 70, h: 32, hot: (i) => i === 1 });
  d.disk(220, 86, 34);
  d.db(440, 60, 120, 100, { label: 'source' });
  d.arrow(250, 80, 432, 90, { stroke: C.ink2 }); d.mono(340, 72, 'u7', { size: 10 });
  d.arrow(432, 120, 250, 110, { stroke: C.gray }); bolt(d, 330, 100, 0.6);
  d.arrow(250, 150, 432, 140, { stroke: C.ink2 }); d.mono(340, 160, 'u7 again: no-op', { size: 9.5 });
  d.travel([[250, 200], [432, 200]], { dur: 4, label: 'u8', w: 26 }); d.text(340, 222, 'then u8, in order', { cls: 'xs', color: C.acc });
  d.text(320, 272, 'replay by identity keeps the effect single', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_12() {
  const d = illustration('sd_cache_trace_12', 'v9 ARRIVES FIRST; THE LATE v8 MUST NOT OVERWRITE IT', 300);
  d.text(110, 52, 'source order', { cls: 'xs' }); d.tape(60, 62, ['v8: 11', 'v9: 12'], { cw: 70, h: 28 });
  cacheBox(d, 380, 70, 140, 46, 'holds [9, 12]', true);
  d.travel([[200, 120], [376, 96]], { dur: 6, at: [0, 0.4], label: 'v9', w: 24 });
  d.travel([[200, 160], [340, 110], [260, 180]], { dur: 6, at: [0.45, 0.9], label: 'v8', w: 24, fill: C.card, color: C.ink2 });
  cross(d, 342, 112, 8);
  d.text(320, 210, 'compare versions on every copy update', { cls: 'sm' });
  d.text(320, 236, 'after eviction the floor is forgotten: keep a tombstone or generation', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_13() {
  const d = illustration('sd_cache_trace_13', 'TTL 30 S, SOURCE CHANGES AT 1 S: 29 SECONDS OF STALE REUSE', 280);
  const X = 50, s = 18;
  ruler(d, X, 180, 30 * s, 30, 5, ' s');
  d.rect(X, 90, s, 34, { r: 0, fill: C.card, stroke: C.ink2 });
  d.rect(X + s, 90, 29 * s, 34, { r: 0, fill: C.accSoft, stroke: C.acc }); d.text(X + 15.5 * s, 107, '29 s serving the old version', { cls: 'sm', color: C.acc });
  d.pin(X + s, 86, { label: 'source changes', dy: -34 });
  d.pin(X + 2 * s, 140, { label: 'read at 2 s: age 2, still stale', dy: 22, fill: C.paper });
  d.travel([[X, 107], [X + 30 * s, 107]], { dur: 6, token: (g) => g.line(0, -20, 0, 20, { stroke: C.ink, sw: 1.2, single: true }) });
  d.text(320, 246, 'TTL bounds age, not staleness', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_14() {
  const d = illustration('sd_cache_trace_14', 'R READS v7, W COMMITS v8 AND DELETES, THEN R\'S LATE FILL RESURRECTS v7', 320);
  [['R', 70], ['W', 170]].forEach(([s, y]) => { d.text(36, y, s, { cls: 'ttl', size: 14 }); d.line(60, y, 610, y, { stroke: C.line, dash: [3, 5], single: true }); });
  [[110, 70, 'read v7'], [230, 170, 'commit v8'], [330, 170, 'delete key'], [460, 70, 'set v7']].forEach(([x, y, s], i) => { d.dot(x, y, 4, i === 3 ? C.acc : C.ink2); d.text(x, y - 16, s, { cls: 'sm', color: i === 3 ? C.acc : undefined }); });
  cacheBox(d, 250, 230, 140, 40, '');
  d.during([0, 0.33], (g) => g.mono(320, 296, 'empty', { size: 10, color: C.gray }));
  d.during([0.33, 0.66], (g) => g.mono(320, 296, 'empty (deleted)', { size: 10, color: C.gray }));
  d.during([0.66, 1], (g) => g.mono(320, 296, 'v7 is back', { size: 10, color: C.acc }));
  d.carrow([[460, 74], [440, 180], [390, 240]], { stroke: C.acc });
  return d.svg();
}
export function sd_cache_trace_15() {
  const d = illustration('sd_cache_trace_15', 'GENERATION KEYS: THE OLD FILL WRITES score:m7:v7, NOT THE CURRENT v8 KEY', 300);
  chip(d, 230, 60, 180, 'current generation = 8', true, 26);
  cacheBox(d, 60, 140, 200, 46, '');
  chip(d, 70, 148, 180, 'score:m7:v7', false, 22);
  cacheBox(d, 380, 140, 200, 46, '', true);
  chip(d, 390, 148, 180, 'score:m7:v8', true, 22);
  d.travel([[160, 100], [160, 140]], { dur: 4, label: 'late v7 fill', w: 70, fill: C.card, color: C.ink2 });
  d.arrow(320, 88, 480, 136, { stroke: C.acc, hl: 6 });
  d.text(160, 214, 'harmless: nobody reads it', { cls: 'sm' });
  d.text(480, 214, 'readers look up generation 8', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_16() {
  const d = illustration('sd_cache_trace_16', 'FRESH TO AGE 5, STALE-ALLOWED TO 10, REJECTED BEYOND; A 304 STILL ASKS THE ORIGIN', 310);
  const X = 50, s = 46;
  d.rect(X, 80, 5 * s, 36, { r: 0, fill: C.card, stroke: C.ink2 }); d.text(X + 2.5 * s, 98, 'fresh', { cls: 'sm' });
  d.rect(X + 5 * s, 80, 5 * s, 36, { r: 0, fill: C.paper, stroke: C.ink2, dash: [4, 3] }); d.text(X + 7.5 * s, 98, 'serve stale + refresh', { cls: 'xs' });
  d.rect(X + 10 * s, 80, 2 * s, 36, { r: 0, fill: C.paper, stroke: C.gray }); d.text(X + 11 * s, 98, 'reload', { cls: 'xs' });
  ruler(d, X, 130, 12 * s, 12, 1, ' s');
  [[7, 'age 7'], [11, 'age 11']].forEach(([a, l]) => d.pin(X + a * s, 76, { label: l, dy: -34 }));
  d.server(80, 200, 60, 60, { unit: 14, label: 'cache' }); d.server(480, 200, 60, 60, { unit: 14, label: 'origin' });
  d.arrow(146, 216, 474, 216, { stroke: C.ink2 }); d.mono(310, 204, 'If-None-Match: "v7"', { size: 9.5 });
  d.arrow(474, 240, 146, 240, { stroke: C.acc }); d.mono(310, 254, '304 Not Modified', { size: 9.5, color: C.acc });
  return d.svg();
}
export function sd_cache_trace_17() {
  const d = illustration('sd_cache_trace_17', '100,000 OBJECTS × (2,000 B PAYLOAD + 100 B METADATA) = 210,000,000 B', 300);
  const X = 40, W = 560, s = W / 256e6;
  d.rect(X, 90, W, 44, { r: 3, stroke: C.ink2 });
  d.fillRect(X + 1, 91, 200e6 * s, 42, C.card); d.fillRect(X + 1 + 200e6 * s, 91, 10e6 * s, 42, C.accSoft);
  d.text(X + 100e6 * s, 112, 'payload 200,000,000 B', { cls: 'sm' });
  d.line(X + 205e6 * s, 140, X + 205e6 * s, 166, { stroke: C.acc, single: true }); d.text(X + 205e6 * s, 178, 'metadata 10,000,000', { cls: 'xs', color: C.acc });
  d.text(X + 233e6 * s, 112, 'free', { cls: 'xs' });
  d.text(X + W, 76, '256 MB budget', { cls: 'xs', a: 'end' });
  d.mono(320, 226, '210,000,000 ÷ 256,000,000 = 82.03125% occupied', { size: 11 });
  return d.svg();
}
export function sd_cache_trace_18() {
  const d = illustration('sd_cache_trace_18', 'LRU WITH 3 SLOTS: A B A C A D B GIVES 2 HITS IN 7', 320);
  const st = [['A B A', ['B', 'A'], ''], ['C A', ['B', 'C', 'A'], ''], ['D', ['C', 'A', 'D'], 'evict B'], ['B', ['A', 'D', 'B'], 'evict C']];
  st.forEach(([req, slots, ev], i) => {
    const y = 56 + i * 58, hot = i === 3;
    d.mono(40, y + 14, req, { a: 'start', size: 11 });
    d.tape(150, y, slots, { cw: 60, h: 28, hot: (k) => hot && k === slots.length - 1 });
    if (ev) d.text(360, y + 14, ev, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(150, 290, 'least recent', { cls: 'xs', a: 'start' }); d.text(330, 290, 'most recent', { cls: 'xs', a: 'end' });
  d.arrow(214, 290, 270, 290, { stroke: C.gray, hl: 5 });
  return d.svg();
}
export function sd_cache_trace_19() {
  const d = illustration('sd_cache_trace_19', 'LFU KEEPS ACCESS COUNTS; TIES GO TO THE OLDEST', 320);
  const st = [['after A B A C A', [['A', 3], ['B', 1], ['C', 1]], ''], ['request D', [['A', 3], ['C', 1], ['D', 1]], 'evict B'], ['request B', [['A', 3], ['D', 1], ['B', 1]], 'evict C']];
  st.forEach(([s, slots, ev], i) => {
    const y = 56 + i * 64;
    d.text(40, y + 16, s, { cls: 'sm', a: 'start' });
    slots.forEach(([k, n], j) => { chip(d, 200 + j * 74, y, 64, `${k}:${n}`, k === 'A', 30); });
    if (ev) d.text(440, y + 16, ev, { cls: 'sm', a: 'start' });
  });
  d.rect(40, 250, 560, 40, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.text(320, 270, 'on A A A B C: LRU evicts A, LFU evicts B. Same hits, different contents', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_20() {
  const d = illustration('sd_cache_trace_20', 'ONE 20,100 B OBJECT TAKES THE ROOM OF NINE 2,100 B OBJECTS AND CHANGE', 300);
  for (let i = 0; i < 9; i++) d.rect(40 + i * 30, 80, 24, 60, { r: 2, fill: C.card, stroke: C.ink2 });
  d.mono(170, 160, '9 × 2,100 = 18,900 B', { size: 10 });
  d.text(330, 110, 'vs', { size: 18 });
  d.rect(380, 80, 220, 60, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.mono(490, 110, '20,000 + 100', { size: 10 });
  d.mono(490, 160, '20,100 B', { size: 10, color: C.acc });
  d.text(320, 220, 'admit whichever saves more source work per byte held', { cls: 'sm' });
  d.text(320, 244, '10 × 2,100 = 21,000 B for comparison', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_21() {
const d=illustration('sd_cache_trace_21','SINGLE-FLIGHT GATHERS DUPLICATE MISSES BEHIND ONE SOURCE LOAD',340);
  for(let r=0;r<10;r++)for(let c=0;c<10;c++)d.dot(39+c*14,65+r*17,3,C.ink2);
  d.text(109,267,'100 callers',{cls:'ttl'});d.arrow(183,153,259,153,{stroke:C.acc});
  d.key(289,138,57,{stroke:C.acc});d.text(319,194,'one loader owns the key',{cls:'ttl',size:11});
  d.db(484,109,103,103,{under:'source'});d.arrow(357,153,476,153,{stroke:C.acc});
  d.mono(320,293,'100 − 1 = 99 duplicate loads avoided',{size:13});d.text(320,322,'waiters need bounded waiting and a defined loader-failure policy',{cls:'sm'});return d.svg();
}

export function sd_cache_trace_22() {
  const d = illustration('sd_cache_trace_22', 'ONE MISSING KEY ASKED 100 TIMES IS ONE LOAD; 100 DIFFERENT ONES ARE 100', 320);
  panel(d, 20, 44, 292, 220, 'same absent key');
  for (let i = 0; i < 10; i++) d.travel([[40 + i * 10, 80], [150, 150]], { dur: 2, at: [i / 12, i / 12 + 0.5], r: 2.5, color: C.ink2 });
  chip(d, 110, 150, 120, 'm9: absent', false, 24);
  d.arrow(170, 178, 170, 220, { stroke: C.ink2, hl: 5 }); d.text(170, 236, '1 verified load', { cls: 'xs' });
  panel(d, 328, 44, 292, 220, '100 distinct keys', true);
  for (let i = 0; i < 20; i++) chip(d, 344 + (i % 5) * 54, 76 + Math.floor(i / 5) * 30, 46, `x${i + 1}`, false, 20);
  d.text(474, 236, 'up to 100 source reads', { cls: 'xs' });
  d.text(320, 300, 'a source timeout is unknown, never "absent"', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_23() {
  const d = illustration('sd_cache_trace_23', '1,000 KEYS EXPIRING IN ONE SECOND, OR SPREAD OVER TEN WITH JITTER', 320);
  const X = 60;
  d.rect(X, 60, 40, 180, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(X + 20, 254, '1,000', { size: 10, color: C.acc });
  d.text(X + 20, 274, 'aligned', { cls: 'xs' });
  const jit = [92, 110, 101, 96, 105, 99, 108, 94, 97, 98];
  jit.forEach((v, i) => { d.rect(200 + i * 38, 240 - v * 0.18 * 1.0, 30, v * 0.18, { r: 2, fill: C.card, stroke: C.ink2 }); });
  d.line(196, 240 - 18, 580, 240 - 18, { stroke: C.gray, dash: [3, 4], single: true }); d.mono(590, 222, '100', { size: 9, a: 'start' });
  d.text(390, 264, '10 one-second buckets (illustrative jitter)', { cls: 'xs' });
  d.text(320, 300, 'when the whole cache is lost, spreading helps nothing: admit at the source', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_24() {
  const d = illustration('sd_cache_trace_24', '80% OF 1,000 READS/S HIT ONE KEY: 800/S, 1,600,000 B/S ON ONE NODE', 320);
  d.server(60, 80, 90, 120, { fill: C.accSoft, stroke: C.acc, led: () => true }); d.mono(105, 216, 'score:m7', { size: 10, color: C.acc });
  for (let k = 0; k < 8; k++) d.travel([[20, 60 + k * 18], [56, 140]], { dur: 1, at: [k / 8, k / 8 + 0.5], r: 2.5 });
  d.mono(105, 240, '800 × 2,000 = 1,600,000 B/s', { size: 9.5 });
  d.arrow(180, 140, 240, 140, { stroke: C.gray });
  for (let i = 0; i < 10; i++) d.server(260 + (i % 5) * 70, 70 + Math.floor(i / 5) * 90, 50, 64, { unit: 14 });
  d.text(435, 250, '10 copies × 80 reads/s each', { cls: 'sm' });
  d.text(320, 296, 'only with ideal routing across the copies', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_25() {
  const d = illustration('sd_cache_trace_25', 'LOSE THE CACHE AND SOURCE DEMAND JUMPS 10×, FROM 100 TO 1,000 READS/S', 320);
  d.db(80, 100, 100, 110, { label: 'normal' });
  pipe(d, 20, 74, 155, 6);
  d.mono(130, 240, '100/s', { size: 11 });
  d.db(400, 100, 100, 110, { label: 'cache lost', fill: C.accSoft, stroke: C.acc });
  pipe(d, 300, 394, 155, 40, true);
  d.flowline([[300, 155], [394, 155]], { sw: 2 });
  d.mono(450, 240, '1,000/s offered', { size: 11, color: C.acc });
  d.text(320, 290, 'degrade on purpose: admit a chosen subset, protect scorer writes', { cls: 'sm' });
  return d.svg();
}
export function sd_cache_trace_26() {
  const d = illustration('sd_cache_trace_26', 'FOUR FALLBACK SLOTS ADMIT 200/S AT 20 MS, ONLY 40/S AT 100 MS', 320);
  const lane = (y, ms, rate, hot) => {
    [0, 1, 2, 3].forEach((i) => { d.rect(160 + i * 50, y, 40, 34, { r: 4, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.travel([[160 + i * 50 + 20, y - 20], [160 + i * 50 + 20, y + 54]], { dur: ms / 20 * 0.5, r: 2.5, color: hot ? C.acc : C.ink2 }); });
    d.mono(40, y + 17, `${ms} ms each`, { size: 10, a: 'start' });
    d.mono(380, y + 17, `4 ÷ ${ms / 1000} = ${rate}/s`, { size: 11, a: 'start', color: hot ? C.acc : undefined });
  };
  lane(70, 20, 200, false); lane(170, 100, 40, true);
  d.text(320, 270, 'at 1,000 arrivals/s, 800 need another answer even in the fast case', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_27() {
  const d = illustration('sd_cache_trace_27', 'A 50 MS BUDGET: THREE 5 MS CACHE TRIES AND A 20 MS SOURCE READ LEAVE 15', 300);
  const X = 40, W = 560, s = W / 50;
  const seg = [[0, 5, 'try 1'], [5, 10, 'try 2'], [10, 15, 'try 3'], [15, 35, 'source 20 ms'], [35, 50, '15 ms left']];
  seg.forEach(([a, b, t], i) => { d.rect(X + a * s, 90, (b - a) * s, 40, { r: 0, fill: i < 3 ? C.accSoft : i === 3 ? C.card : C.paper, stroke: i < 3 ? C.acc : C.ink2 }); d.text(X + (a + b) / 2 * s, 110, t, { cls: 'xs' }); });
  ruler(d, X, 144, W, 50, 10, ' ms');
  d.brace(X, X + 15 * s, 82, { dir: -1, label: '15 ms on a dead cache' });
  d.text(320, 230, 'with one try, 25 ms would remain for parsing and the response', { cls: 'sm' });
  return d.svg();
}
export function sd_cache_trace_28() {
  const d = illustration('sd_cache_trace_28', 'THE DELETE REACHED P BUT NOT Q; P DIES, Q IS PROMOTED, AND v7 IS BACK', 320);
  const st = [['before', ['v7', 'v7'], -1], ['delete', ['—', 'v7'], -1], ['P fails', ['', 'v7'], 1]];
  st.forEach(([s, v, hot], i) => {
    const x = 30 + i * 200;
    panel(d, x, 44, 180, 190, s, i === 2);
    ['P', 'Q'].forEach((n, k) => { const y = 82 + k * 70; d.server(x + 24, y, 50, 54, { unit: 14, fill: k === hot ? C.accSoft : C.card, stroke: k === hot ? C.acc : C.ink2 }); d.mono(x + 110, y + 26, `${n}: ${v[k] || 'down'}`, { size: 10, color: k === hot ? C.acc : undefined }); });
    if (i === 2) cross(d, x + 49, 109, 14, C.ink2);
  });
  d.text(320, 270, 'a strict reader needs v8: reject the copy or go to the source', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_29() {
  const d = illustration('sd_cache_trace_29', 'A COMPLETE READ: BUILD THE KEY, CHECK ELIGIBILITY, BOUND THE MISS, FILL SAFELY', 320);
  const st = [['key', 'match + format\n+ locale + audience'], ['eligible?', 'age and\nsource version'], ['miss', 'coalesce,\nadmit, fetch'], ['fill', 'version floor\nor generation']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.rect(x, 70, 120, 70, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 105, s, { cls: 'ttl', color: hot ? C.acc : undefined });
    d.text(x + 60, 176, t, { cls: 'xs', vc: true });
    if (i < 3) d.arrow(x + 124, 105, x + 146, 105, { stroke: C.gray, hl: 6 });
  });
  d.travel([[90, 105], [540, 105]], { dur: 5, r: 4 });
  d.text(320, 260, 'the source result survives a failed fill', { cls: 'xs' });
  return d.svg();
}
export function sd_cache_trace_30() {
  const d = illustration('sd_cache_trace_30', 'COMMIT SCORE 11 AT v8 FIRST; CACHE MAINTENANCE IS A SEPARATE STEP', 320);
  d.db(40, 70, 120, 110, { label: 'c9 → 11, v8' });
  d.text(100, 200, 'truth', { cls: 'ttl' });
  cacheBox(d, 250, 100, 140, 46, 'floor 8');
  d.arrow(166, 124, 244, 124, { stroke: C.ink2, dash: [4, 4] }); d.text(205, 110, 'maintain', { cls: 'xs' });
  d.travel([[440, 200], [394, 130], [450, 220]], { dur: 4, label: 'v7', w: 24, fill: C.card, color: C.ink2 }); cross(d, 404, 140, 8, C.gray);
  d.text(470, 236, 'late v7 load refused', { cls: 'xs' });
  d.person(530, 60, 30, { label: 'scorer needs v8' }); d.arrow(516, 90, 396, 112, { stroke: C.acc, hl: 6 });
  d.text(320, 290, 'never silently serve v7 to the scorer', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cache_trace_31() {
  const d = illustration('sd_cache_trace_31', 'WARM, COLD AND DEGRADED: THREE LOADS FOR ONE SOURCE, ONE MEMORY BILL', 320);
  const rows = [['warm', 'h = 0.9, 1,000 reads/s', '100 source reads/s', 10], ['cold', 'h = 0', '1,000 offered loads/s', 100], ['degraded', '4 slots × 20 ms', '200 admitted reads/s', 20]];
  rows.forEach(([s, a, b, w], i) => {
    const y = 56 + i * 54;
    d.text(40, y + 14, s, { cls: 'ttl', a: 'start', size: 12 });
    d.text(130, y + 14, a, { cls: 'xs', a: 'start' });
    d.rect(300, y + 2, w * 2.4, 24, { r: 2, fill: C.card, stroke: C.ink2 });
    d.mono(300 + w * 2.4 + 8, y + 14, b, { size: 9.5, a: 'start' });
  });
  d.rect(40, 230, 560, 44, { r: 6, fill: C.accFaint, stroke: C.acc });
  d.mono(320, 252, 'memory: 100,000 × 2,100 B = 210,000,000 B per full copy', { size: 11, color: C.acc });
  return d.svg();
}
export function sd_cache_trace_32() {
  const d = illustration('sd_cache_trace_32', 'FOUR TESTS FOR HISTORIES A WARM BENCHMARK NEVER SEES', 330);
  const t = [['race', 'pause a v7 loader,\ncommit v8, resume'], ['failover', 'promote a stale\nreplica'], ['burst', '100 callers,\none key'], ['outage', 'many keys gone\nat once']];
  t.forEach(([s, how], i) => {
    const x = 26 + i * 152, hot = i === 3;
    panel(d, x, 48, 136, 230, s, hot);
    if (i === 0) d.clock(x + 68, 110, 44);
    if (i === 1) { d.server(x + 30, 86, 36, 48, { unit: 12 }); d.server(x + 76, 86, 36, 48, { unit: 12, fill: C.accSoft }); }
    if (i === 2) for (let k = 0; k < 9; k++) d.dot(x + 30 + (k % 3) * 14, 92 + Math.floor(k / 3) * 14, 3, C.ink2);
    if (i === 2) d.arrow(x + 80, 106, x + 110, 106, { stroke: C.ink2, hl: 5 });
    if (i === 3) for (let k = 0; k < 6; k++) d.rect(x + 24 + (k % 3) * 32, 86 + Math.floor(k / 3) * 30, 24, 22, { r: 3, stroke: C.acc, dash: [3, 3] });
    d.text(x + 68, 190, how, { cls: 'xs', vc: true });
  });
  d.text(320, 308, 'the outage test checks the global fallback budget holds', { cls: 'xs', color: C.acc });
  return d.svg();
}

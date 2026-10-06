import { C, fig, beMap, beCover, card, steps, panel, cross, tick, hourglass, hose, lanes, seg, crowd, sheet, signpost, gauge, bubble, shield, browser } from '../lib/be-kit.js';
import { pipe, bolt } from '../lib/sd-kit.js';
import { world, arc } from '../lib/world.js';

const PARTS = ['Why cache, and where', 'Caching patterns', 'Expiry, eviction and sizing', 'Invalidation and consistency', 'Cache failure modes', 'Redis data structures', 'Redis internals', 'Redis at scale', 'HTTP caching and CDNs', 'The menu request end to end'];
export const where_be_cache = (stage = 99) => beMap('where_be_cache', PARTS, stage);

function fridge(d, x, y, w, h, o = {}) {
  d.rect(x, y, w, h, { r: 8, fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink2 });
  d.line(x, y + h * 0.32, x + w, y + h * 0.32, { stroke: o.stroke ?? C.ink2, single: true });
  d.line(x + w - 10, y + 10, x + w - 10, y + h * 0.32 - 10, { stroke: o.stroke ?? C.ink2, sw: 2, single: true });
  d.line(x + w - 10, y + h * 0.32 + 10, x + w - 10, y + h * 0.32 + 40, { stroke: o.stroke ?? C.ink2, sw: 2, single: true });
  (o.jars ?? []).forEach((s, i) => { const jx = x + 8 + (i % 3) * ((w - 24) / 3), jy = y + h * 0.4 + Math.floor(i / 3) * 34; d.rect(jx, jy, (w - 30) / 3, 26, { r: 4, fill: o.hot === i ? C.accSoft : C.paper, stroke: o.hot === i ? C.acc : C.line }); d.mono(jx + (w - 30) / 6, jy + 13, s, { size: 8 }); });
}

function shop(d, x, y, w, h, label) {
  d.poly([[x - 6, y + 22], [x + w / 2, y - 6], [x + w + 6, y + 22]], { fill: C.card, stroke: C.ink2 });
  d.rect(x, y + 22, w, h - 22, { r: 2, fill: C.paper, stroke: C.ink2 });
  d.rect(x + w / 2 - 12, y + h - 34, 24, 34, { r: 2, fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 3; i++) d.rect(x + 8 + i * (w - 16) / 3, y + 32, (w - 16) / 3 - 6, 18, { r: 1, fill: C.card, stroke: C.line });
  if (label) d.text(x + w / 2, y + h + 14, label, { cls: 'sm' });
}

export const cover_be_cache = () => beCover('cover_be_cache', 'VII', ['Caching, Redis', 'and CDNs'], 'Patterns, invalidation, failure modes and the edge', (d, y) => {
  fridge(d, 60, y + 20, 150, 240, { jars: ['menu:9', 'user:42', 'sess:a1', 'rank', 'cart', 'rl:42'], hot: 0 });
  d.text(135, y + 285, 'Redis, 0.5 ms away', { cls: 'sm' });
  shop(d, 430, y + 90, 150, 150, 'PostgreSQL, 8 ms away');
  d.line(220, y + 250, 420, y + 250, { stroke: C.line, dash: [3, 5], single: true });
  d.travel([[220, y + 236], [420, y + 236], [220, y + 236]], { r: 5, dur: 5, at: [0, 1] });
  d.hand(320, y + 60, 'nine trips in ten end here', { size: 18 });
  d.arrow(300, y + 76, 222, y + 110, { stroke: C.acc });
}, [['Patterns', 'aside, through, behind, around'], ['Failure modes', 'stampede, penetration, avalanche'], ['Redis', 'types, internals, cluster'], ['CDNs', 'edge caches and purges']]);

export function be_cache_why() {
  const d = fig('be_cache_why', 'A CACHE IS THE FRIDGE; THE DATABASE IS THE SUPERMARKET', 320);
  d.person(70, 120, 40);
  fridge(d, 140, 70, 90, 150, { jars: ['menu', 'user', 'tip', 'cart', 'rank', 'sess'], hot: 0 });
  d.text(185, 240, 'Redis GET: 0.5 ms', { cls: 'mono', size: 10 });
  shop(d, 470, 90, 130, 130, 'two queries: 8 ms');
  d.line(240, 200, 460, 200, { stroke: C.line, dash: [3, 5], single: true });
  d.travel([[110, 150], [140, 150], [110, 150]], { r: 4, dur: 6, at: [0, 0.2] });
  d.travel([[110, 200], [460, 200], [110, 200]], { r: 4, dur: 6, at: [0.25, 0.95], color: C.ink2 });
  d.text(350, 186, 'on a miss: walk to the shop', { cls: 'xs' });
  d.text(320, 280, '90% hits: 0.9 × 0.5 + 0.1 × 9 = 1.35 ms on average, and the database sees one request in ten', { cls: 'xs' });
  return d.svg();
}

export function be_cache_hitratio() {
  const d = fig('be_cache_hitratio', 'DATABASE QUERIES PER SECOND AT 2,000 REQUESTS PER SECOND, BY HIT RATIO', 320);
  const M = d.axes(80, 50, 470, 200, { xmin: 0.5, xmax: 1, ymin: 0, ymax: 2000, xl: 'hit ratio', yl: 'queries/s' });
  d.fn((h) => 2000 * (1 - h) * 2, 0.5, 1, M);
  [[0.8, '800'], [0.9, '400'], [0.99, '40']].forEach(([h, s], i) => { const x = M.X(h), y = M.Y(4000 * (1 - h)); d.dot(x, y, 4, i === 1 ? C.acc : C.ink); d.line(x, y, x, M.Y(0), { stroke: C.line, dash: [2, 3], single: true }); d.text(x, M.Y(0) + 14, `${Math.round(h * 100)}%`, { cls: 'mono', size: 9.5 }); d.text(x + 8, y - 12, s + ' q/s', { cls: 'mono', size: 9.5, a: 'start', color: i === 1 ? C.acc : undefined }); });
  d.hand(250, 110, 'from 90% to 80% doubles the load', { size: 15 });
  d.text(320, 300, 'the database feels the miss ratio, so going from 90% to 99% cuts its load tenfold', { cls: 'xs' });
  return d.svg();
}

export function be_cache_layers() {
  const d = fig('be_cache_layers', 'CACHES ARE NESTED ALONG THE PATH; EACH RING SAVES A TRIP TO THE NEXT', 360);
  const rings = [['browser', '0 ms'], ['CDN edge', '5 ms'], ['gateway', '20 ms'], ['local memory', '0.001 ms'], ['Redis', '0.5 ms'], ['database buffers', '4 ms'], ['disk', '']];
  rings.forEach(([s, t], i) => { const r = 165 - i * 22; d.circle(200, 190, r * 2, { fill: i === 4 ? C.accFaint : (i % 2 ? C.paper : C.card), stroke: i === 4 ? C.acc : C.ink2 }); });
  rings.forEach(([s, t], i) => { const r = 165 - i * 22; const y = 190 - r + 11; d.text(200, y, s, { cls: 'xs', color: i === 4 ? C.acc : undefined }); });
  d.text(470, 70, 'from the outside in:', { cls: 'ttl', a: 'start' });
  rings.slice(0, 6).forEach(([s, t], i) => d.text(470, 96 + i * 22, `${s}${t ? '  ' + t : ''}`, { cls: 'mono', size: 9.5, a: 'start', color: i === 4 ? C.acc : undefined }));
  d.text(470, 250, 'times are the extra cost\nof missing the ring above\n(illustrative)', { cls: 'xs', a: 'start', vc: true });
  return d.svg();
}

export function be_cache_local_remote() {
  const d = fig('be_cache_local_remote', 'LOCAL CACHES ARE FAST BUT EACH INSTANCE HAS ITS OWN COPY', 320);
  const v = ['tip 30', 'tip 20', 'tip 30', 'tip 20'];
  [0, 1, 2, 3].forEach((i) => { const x = 40 + i * 110; d.server(x, 60, 80, 70, { label: `app ${i + 1}` }); d.rect(x + 8, 140, 64, 26, { r: 4, fill: v[i] === 'tip 20' ? C.accSoft : C.paper, stroke: v[i] === 'tip 20' ? C.acc : C.line }); d.mono(x + 40, 153, v[i], { size: 9, color: v[i] === 'tip 20' ? C.acc : undefined }); hose(d, x + 40, 168, 290, 240, { th: 2 }); });
  d.db(250, 236, 90, 60, { label: 'Redis' });
  d.text(530, 80, 'local memory', { cls: 'ttl' }); d.text(530, 98, 'about 1 µs, per instance,\ncan disagree', { cls: 'xs', vc: true });
  d.text(530, 230, 'Redis', { cls: 'ttl' }); d.text(530, 250, '0.5 ms, shared,\none copy for everyone', { cls: 'xs', vc: true });
  d.text(320, 308, 'two-tier: a small local cache with a 1 s TTL in front of Redis for the hottest keys', { cls: 'xs' });
  return d.svg();
}

export function be_cache_aside() {
  const d = fig('be_cache_aside', 'CACHE-ASIDE: THE APPLICATION CHECKS, LOADS AND FILLS', 320);
  d.server(40, 110, 80, 90, { label: 'app' });
  d.db(280, 40, 100, 80, { label: 'Redis' }); d.db(280, 200, 100, 90, { label: 'PostgreSQL' });
  d.arrow(124, 130, 274, 84, { stroke: C.ink2 }); d.text(180, 92, '1 GET menu:9', { cls: 'mono', size: 9.5 });
  d.during([0.15, 1], (g) => { cross(g, 330, 140, 9); g.text(350, 140, 'miss', { cls: 'xs', a: 'start', color: C.acc }); });
  d.during([0.3, 1], (g) => { g.arrow(124, 180, 274, 240, { stroke: C.ink2 }); g.text(176, 232, '2 SELECT', { cls: 'mono', size: 9.5 }); });
  d.during([0.55, 1], (g) => { g.arrow(274, 96, 124, 146, { stroke: C.acc }); g.text(220, 130, '3 SET menu:9 EX 300', { cls: 'mono', size: 9.5, color: C.acc }); });
  card(d, 420, 60, 200, ['v = redis.get(k)', 'if v is None:', '  v = db.load(9)', '  redis.set(k, v, ex=300)', 'return v'], { size: 9.5, hot: [3] });
  d.text(320, 304, 'the cache knows nothing about the database; the code does all the work', { cls: 'xs' });
  return d.svg();
}

export function be_cache_aside_race() {
  const d = fig('be_cache_aside_race', 'THE CACHE-ASIDE RACE: A SLOW READER PUTS BACK THE OLD VALUE', 320);
  const y = lanes(d, ['reader', 'writer', 'Redis holds'], { y: 70, gap: 66, x0: 110, x1: 610 });
  seg(d, 120, y(0), 60, 'miss'); seg(d, 190, y(0), 120, 'SELECT → tip 20'); seg(d, 430, y(0), 110, 'SET tip 20', { hot: true });
  seg(d, 330, y(1), 80, 'UPDATE 30'); seg(d, 412, y(1), 50, 'DEL');
  seg(d, 120, y(2), 290, '(empty)', { fill: C.paper }); seg(d, 440, y(2), 160, 'tip 20 until TTL', { hot: true });
  d.text(320, 290, 'the delete happened before the stale SET, so the old value lives for the whole TTL', { cls: 'xs' });
  return d.svg();
}

export function be_cache_read_through() {
  const d = fig('be_cache_read_through', 'READ-THROUGH: THE CACHE ITSELF KNOWS HOW TO LOAD A MISS', 300);
  d.server(40, 100, 80, 90, { label: 'app' });
  d.rect(220, 80, 180, 130, { r: 10, fill: C.accFaint, stroke: C.acc }); d.text(310, 100, 'cache library', { cls: 'ttl', color: C.acc });
  d.gear(270, 160, 22, { spin: 6, stroke: C.acc }); d.text(330, 160, 'loader(key)', { cls: 'mono', size: 9.5, a: 'start' });
  d.db(490, 110, 110, 90, { label: 'database' });
  d.arrow(124, 145, 214, 145, { stroke: C.ink2 }); d.text(170, 132, 'get(k)', { cls: 'mono', size: 9 });
  d.arrow(404, 160, 484, 160, { stroke: C.gray, dash: [3, 3] }); d.text(444, 148, 'on miss', { cls: 'xs' });
  d.text(320, 260, 'the app only ever talks to the cache; Caffeine, Guava and many CDNs work this way', { cls: 'xs' });
  return d.svg();
}

export function be_cache_write_through() {
  const d = fig('be_cache_write_through', 'WRITE-THROUGH: EVERY WRITE UPDATES THE CACHE AND THE DATABASE TOGETHER', 300);
  d.server(40, 100, 80, 90, { label: 'app' });
  d.db(300, 50, 100, 80, { label: 'cache' }); d.db(300, 180, 100, 90, { label: 'database' });
  d.arrow(124, 130, 294, 90, { stroke: C.acc }); d.arrow(124, 160, 294, 220, { stroke: C.acc });
  d.travel([[124, 130], [294, 90]], { token: 'packet', at: [0, 0.4] }); d.travel([[124, 160], [294, 220]], { token: 'packet', at: [0, 0.4] });
  d.text(510, 110, 'cache is always warm\nfor written keys', { cls: 'sm', vc: true });
  d.text(510, 210, 'every write pays both\nlatencies; rarely read\nkeys waste memory', { cls: 'sm', vc: true });
  d.text(320, 286, 'the two writes are not atomic, so a failure between them still needs a TTL or a retry', { cls: 'xs' });
  return d.svg();
}

export function be_cache_write_behind() {
  const d = fig('be_cache_write_behind', 'WRITE-BEHIND: ACKNOWLEDGE FAST, FLUSH TO THE DATABASE LATER', 320);
  d.server(30, 110, 70, 80, { label: 'app' });
  d.db(170, 100, 100, 90, { label: 'cache' });
  d.arrow(104, 150, 164, 150, { stroke: C.acc });
  d.rect(310, 80, 120, 130, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(370, 70, 'pending writes', { cls: 'xs' });
  for (let i = 0; i < 6; i++) d.during([i * 0.1, 0.75], (g) => g.envelope(325 + (i % 3) * 32, 180 - Math.floor(i / 3) * 26, 26, 18, { stroke: C.acc, fill: C.accSoft }));
  d.during([0.75, 1], (g) => { g.arrow(434, 145, 494, 145, { stroke: C.acc }); g.text(464, 132, 'batch', { cls: 'xs', color: C.acc }); });
  d.db(500, 100, 110, 90, { label: 'database' });
  bolt(d, 370, 220, 0.9); d.text(370, 276, 'crash here loses every\nunflushed write', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}

export function be_cache_write_around() {
  const d = fig('be_cache_write_around', 'WRITE-AROUND: WRITE THE DATABASE, DELETE THE KEY, LET THE NEXT READ FILL IT', 300);
  d.server(40, 100, 80, 90, { label: 'app' });
  d.db(300, 50, 100, 80, { label: 'cache' }); d.db(300, 180, 100, 90, { label: 'database' });
  d.arrow(124, 160, 294, 220, { stroke: C.acc }); d.text(190, 214, 'UPDATE', { cls: 'mono', size: 9.5, color: C.acc });
  d.arrow(124, 130, 294, 90, { stroke: C.ink2, dash: [4, 3] }); d.text(190, 96, 'DEL menu:9', { cls: 'mono', size: 9.5 });
  d.text(510, 150, 'the usual write side of\ncache-aside; good when\nwritten data is rarely\nread right away', { cls: 'sm', vc: true });
  return d.svg();
}

export function be_cache_patterns_map() {
  const d = fig('be_cache_patterns_map', 'FIVE PATTERNS, SORTED BY WHO TALKS TO THE DATABASE AND WHEN', 320);
  const rows = [['cache-aside', 'app', 'on miss', 'delete on write', false], ['read-through', 'cache', 'on miss', 'any', false], ['write-through', 'cache or app', 'every write', 'both, now', false], ['write-behind', 'cache', 'later, in batches', 'cache first', true], ['write-around', 'app', 'every write', 'database only', false]];
  sheet(d, 30, 50, [['pattern', 130], ['talks to the DB', 130], ['when', 140], ['writes go to', 160]], rows.map((r) => r.slice(0, 4)), { hot: [3], rh: 34, size: 10 });
  d.text(320, 300, 'write-behind is the only one where an acknowledged write can be lost', { cls: 'xs', color: C.acc });
  return d.svg();
}

export function be_cache_ttl() {
  const d = fig('be_cache_ttl', 'THE LIFE OF ONE KEY WITH A 300 S TTL', 260);
  const X = (s) => 60 + s * 1.3;
  d.line(X(0), 120, X(400), 120, { stroke: C.line, sw: 2, single: true });
  seg(d, X(0), 120, X(300) - X(0), 'served from Redis', { hot: true, h: 26 });
  d.rect(X(120), 140, X(300) - X(120), 12, { r: 2, fill: C.card, stroke: C.line, dash: [2, 3] }); d.text((X(120) + X(300)) / 2, 166, 'stale after the menu changed at 120 s', { cls: 'xs' });
  d.clock(X(0), 70, 34, { t: 0 }); d.clock(X(300), 70, 34, { t: 0.99 }); d.text(X(300), 98, 'expires', { cls: 'xs' });
  seg(d, X(300), 120, X(310) - X(300), '', {}); d.text(X(310) + 4, 104, 'miss, reload', { cls: 'xs', a: 'start' });
  seg(d, X(310), 120, X(400) - X(310), 'fresh again', { h: 26 });
  d.text(320, 220, 'the TTL is the longest a reader can see old data if every other invalidation fails', { cls: 'sm' });
  return d.svg();
}

export function be_cache_jitter() {
  const d = fig('be_cache_jitter', '10,000 KEYS LOADED AT ONCE: SAME TTL VERSUS TTL ± 10%', 300);
  const M = d.axes(60, 50, 240, 170, { xmin: 3200, xmax: 4000, ymin: 0, ymax: 10000, xl: 's', yl: 'expiring' });
  d.rect(M.X(3600) - 4, M.Y(10000), 8, M.Y(0) - M.Y(10000), { r: 0, fill: C.accSoft, stroke: C.acc }); d.text(M.X(3600), M.Y(10000) - 10, '10,000 at 3,600 s', { cls: 'xs', color: C.acc });
  const M2 = d.axes(360, 50, 240, 170, { xmin: 3200, xmax: 4000, ymin: 0, ymax: 10000, xl: 's', yl: 'expiring' });
  for (let i = 0; i < 18; i++) { const s = 3240 + i * 40; d.rect(M2.X(s), M2.Y(556), M2.X(3240 + 40) - M2.X(3240) - 2, M2.Y(0) - M2.Y(556), { r: 0, fill: C.card, stroke: C.ink2 }); }
  d.text(480, 180, 'about 556 per 40 s bucket\nbetween 3,240 and 3,960 s', { cls: 'xs', vc: true });
  d.text(320, 286, 'TTL × random(0.9, 1.1) spreads the refills over 720 s instead of one second', { cls: 'xs' });
  return d.svg();
}

export function be_cache_lru() {
  const d = fig('be_cache_lru', 'LRU: THE KEY UNUSED FOR LONGEST FALLS OFF THE END', 260);
  const keys = ['menu:9', 'user:42', 'menu:3', 'cart:7', 'menu:11', 'user:8'];
  d.text(70, 60, 'most recent', { cls: 'xs' }); d.text(560, 60, 'least recent', { cls: 'xs' });
  keys.forEach((k, i) => d.box(30 + i * 92, 76, 84, 34, k, { r: 5, fill: i === 5 ? C.accSoft : C.card, stroke: i === 5 ? C.acc : C.ink2, cls: 'mono', size: 9.5 }));
  d.during([0, 0.5], (g) => g.box(30, 150, 84, 34, 'menu:21', { r: 5, fill: C.paper, cls: 'mono', size: 9.5 }));
  d.arrow(72, 146, 72, 116, { stroke: C.ink2, hl: 5 }); d.text(130, 168, 'new key enters at the front', { cls: 'xs', a: 'start' });
  d.shift(0, 70, (g) => g.text(582, 140, 'evicted', { cls: 'hand', size: 15 }), { at: [0.5, 0.9] });
  d.text(320, 236, 'reading a key moves it to the front; Redis approximates this by sampling', { cls: 'xs' });
  return d.svg();
}

export function be_cache_lfu() {
  const d = fig('be_cache_lfu', 'A ONE-OFF SCAN FLUSHES AN LRU CACHE; LFU KEEPS THE POPULAR KEYS', 320);
  panel(d, 20, 40, 290, 250, 'LRU after a scan', true); panel(d, 330, 40, 290, 250, 'LFU after a scan');
  for (let i = 0; i < 8; i++) { d.box(40 + (i % 4) * 66, 70 + Math.floor(i / 4) * 40, 60, 30, `scan:${i + 1}`, { r: 4, fill: C.accSoft, stroke: C.acc, cls: 'mono', size: 8.5 }); }
  d.text(165, 170, 'menu:9 and user:42 evicted', { cls: 'sm', color: C.acc });
  [['menu:9', 140], ['user:42', 96], ['menu:3', 60], ['cart:7', 22]].forEach(([k, n], i) => { const y = 72 + i * 36; d.box(350, y, 80, 28, k, { r: 4, fill: C.card, cls: 'mono', size: 9 }); for (let t = 0; t < Math.round(n / 10); t++) d.line(440 + t * 9, y + 6, 440 + t * 9, y + 22, { stroke: C.ink2, single: true, sw: 1.2 }); });
  d.text(475, 230, 'tally = access count; scan keys\nwith 1 hit are evicted first', { cls: 'xs', vc: true });
  d.text(165, 230, 'every scanned key became\n"most recent"', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cache_sampling() {
  const d = fig('be_cache_sampling', 'REDIS DOES NOT KEEP AN LRU LIST: IT SAMPLES 5 KEYS AND EVICTS THE OLDEST', 300);
  d.ellipse(170, 150, 260, 180, { fill: C.paper, stroke: C.ink2 });
  const pts = [[90, 110, 3], [130, 90, 40], [190, 100, 7], [240, 120, 22], [110, 160, 55], [160, 140, 2], [220, 170, 90], [140, 200, 15], [200, 210, 30], [260, 160, 4], [90, 200, 8], [180, 180, 61]];
  const pick = [1, 3, 4, 6, 8];
  pts.forEach(([x, y, age], i) => { const p = pick.includes(i); d.circle(x, y, 22, { fill: i === 6 ? C.accSoft : (p ? C.card : C.paper), stroke: i === 6 ? C.acc : (p ? C.ink2 : C.line) }); d.mono(x, y, age, { size: 8.5, color: i === 6 ? C.acc : (p ? undefined : C.gray) }); });
  d.text(170, 262, 'number = seconds since last access', { cls: 'xs' });
  d.text(340, 90, 'maxmemory-samples 5', { cls: 'mono', size: 10, a: 'start' });
  d.text(340, 120, 'outlined keys were sampled;', { cls: 'sm', a: 'start' }); d.text(340, 140, 'the 90 s one is evicted', { cls: 'sm', a: 'start', color: C.acc });
  d.text(340, 180, 'cheap: no linked list, 24 bits\nof clock per key; close to\ntrue LRU at 10 samples', { cls: 'xs', a: 'start', vc: true });
  return d.svg();
}

export function be_cache_zipf() {
  const d = fig('be_cache_zipf', 'POPULARITY IS SKEWED: CACHING 1% OF 100,000 MENU ITEMS SERVES 62% OF READS', 300);
  const rows = [['top 100', 42.9], ['top 1,000', 61.9], ['top 10,000', 81.0], ['top 50,000', 94.3]];
  rows.forEach(([s, v], i) => { const y = 60 + i * 50; d.text(140, y + 14, s, { cls: 'sm', a: 'end' }); d.rect(150, y, v * 4.2, 28, { r: 3, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.mono(160 + v * 4.2, y + 14, `${v}%`, { size: 10, a: 'start', color: i === 1 ? C.acc : undefined }); });
  d.text(320, 280, 'Zipf popularity with exponent 1: hit ratio of the top k = H(k) ÷ H(100,000), harmonic numbers', { cls: 'xs' });
  return d.svg();
}

export function be_cache_invalidation() {
  const d = fig('be_cache_invalidation', 'FOUR WAYS TO STOP SERVING OLD DATA', 320);
  [['TTL', 'wait it out'], ['delete on write', 'the writer erases'], ['versioned key', 'point to a new name'], ['change events', 'the database tells']].forEach(([t, s], i) => { const x = 20 + (i % 2) * 310, y = 40 + Math.floor(i / 2) * 140; panel(d, x, y, 290, 126, t, i === 3); d.text(x + 145, y + 36, s, { cls: 'xs' }); });
  d.clock(165, 130, 50, { spin: 6 });
  d.box(400, 110, 90, 30, 'menu:9', { r: 4, cls: 'mono', size: 9.5, fill: C.card }); d.line(395, 125, 495, 125, { stroke: C.acc, sw: 2, single: true }); d.text(540, 125, 'DEL', { cls: 'mono', size: 10, color: C.acc });
  d.mono(120, 250, 'menu:9:v41', { size: 10, color: C.gray }); d.arrow(170, 250, 200, 250, { stroke: C.acc, hl: 5 }); d.mono(250, 250, 'menu:9:v42', { size: 10, color: C.acc });
  d.db(370, 225, 50, 46); for (let i = 0; i < 3; i++) d.travel([[424, 248], [560, 248]], { token: 'packet', at: [i * 0.33, i * 0.33 + 0.4] }); d.text(500, 280, 'WAL → stream → invalidator', { cls: 'xs' });
  return d.svg();
}

export function be_cache_versioned() {
  const d = fig('be_cache_versioned', 'VERSIONED KEYS: BUMP A NUMBER, AND THE OLD ENTRY IS SIMPLY NEVER READ AGAIN', 280);
  sheet(d, 40, 60, [['restaurant', 90], ['menu_version', 110]], [['9', '41 → 42']], { hot: [0] });
  d.arrow(250, 92, 300, 92, { stroke: C.gray });
  d.box(310, 60, 140, 34, 'menu:9:v41', { r: 5, cls: 'mono', size: 10, fill: C.paper, stroke: C.line }); d.text(520, 77, 'orphan, expires by TTL', { cls: 'xs' });
  d.box(310, 110, 140, 34, 'menu:9:v42', { r: 5, cls: 'mono', size: 10, fill: C.accSoft, stroke: C.acc }); d.text(520, 127, 'new reads land here', { cls: 'xs', color: C.acc });
  d.text(320, 200, 'no race with a slow writer: a stale SET goes to the old name, which nobody reads', { cls: 'sm' });
  d.text(320, 240, 'costs one small lookup for the version, often itself cached', { cls: 'xs' });
  return d.svg();
}

export function be_cache_cdc() {
  const d = fig('be_cache_cdc', 'EVENT-DRIVEN INVALIDATION: THE DATABASE LOG DRIVES THE DELETES', 300);
  d.db(30, 90, 100, 100, { label: 'PostgreSQL' });
  d.gear(200, 140, 20, { spin: 5 }); d.text(200, 176, 'CDC reader', { cls: 'xs' });
  pipe(d, 230, 400, 140, 22); d.text(315, 116, 'order-events / menu-events', { cls: 'mono', size: 9 });
  d.gear(440, 140, 20, { spin: 5, stroke: C.acc }); d.text(440, 176, 'invalidator', { cls: 'xs', color: C.acc });
  d.db(510, 100, 100, 80, { label: 'Redis' });
  d.arrow(134, 140, 178, 140, { stroke: C.ink2, hl: 5 }); d.arrow(462, 140, 504, 140, { stroke: C.acc, hl: 5 });
  for (let i = 0; i < 3; i++) d.travel([[236, 140], [396, 140]], { label: 'menu 9 changed', w: 98, at: [i * 0.33, i * 0.33 + 0.5] });
  d.text(320, 240, 'catches every writer, including scripts and admin tools that forget to delete keys', { cls: 'sm' });
  d.text(320, 270, 'the log is ordered, so a later change is never undone by an earlier delete', { cls: 'xs' });
  return d.svg();
}

export function be_cache_negative() {
  const d = fig('be_cache_negative', 'NEGATIVE CACHING: REMEMBER THAT SOMETHING DOES NOT EXIST', 280);
  d.server(40, 100, 80, 80, { label: 'app' });
  d.db(250, 60, 100, 70, { label: 'Redis' }); d.db(250, 170, 100, 80, { label: 'database' });
  d.arrow(124, 160, 244, 205, { stroke: C.ink2 }); d.text(180, 200, 'order 999?', { cls: 'mono', size: 9 });
  d.text(300, 266, 'not found', { cls: 'xs' });
  d.arrow(244, 98, 124, 130, { stroke: C.acc }); d.text(160, 96, 'SET order:999 "∅" EX 30', { cls: 'mono', size: 9, color: C.acc });
  d.text(500, 120, 'next 30 s of lookups\nfor 999 stop at Redis', { cls: 'sm', vc: true });
  d.text(500, 200, 'short TTL, and delete it\nwhen the row is created', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cache_warming() {
  const d = fig('be_cache_warming', 'A COLD CACHE VERSUS A WARMED ONE AFTER A SWITCHOVER (ILLUSTRATIVE)', 300);
  const M = d.axes(70, 50, 480, 180, { xmin: 0, xmax: 600, ymin: 0, ymax: 1, xl: 'seconds after switch', yl: 'hit ratio' });
  d.fn((t) => 0.9 * (1 - Math.exp(-t / 120)), 0, 600, M);
  d.fn(() => 0.86, 0, 600, M, { stroke: C.slate, dash: [5, 4] });
  d.text(M.X(60), M.Y(0.28), 'cold: the database takes every miss', { cls: 'xs', a: 'start', color: C.acc });
  d.text(M.X(300), M.Y(0.8) , 'warmed with the top 10,000 keys first', { cls: 'xs', a: 'start' });
  d.text(320, 286, 'warm by replaying recent reads or copying the hottest keys before shifting traffic', { cls: 'xs' });
  return d.svg();
}

export function be_cache_stampede() {
  const d = fig('be_cache_stampede', 'STAMPEDE: A HOT KEY EXPIRES AND 400 REQUESTS RUSH THE DATABASE AT ONCE', 320);
  d.rect(470, 70, 140, 180, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(540, 86, 'database', { cls: 'ttl' });
  d.rect(460, 140, 12, 50, { r: 1, fill: C.card, stroke: C.ink2 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) d.person(60 + c * 40 + (r % 2) * 18, 70 + r * 46, 22, { stroke: C.acc, fill: C.accSoft });
  for (let i = 0; i < 8; i++) d.travel([[420, 100 + i * 14], [470, 165]], { r: 3, at: [i * 0.1, i * 0.1 + 0.2] });
  d.clock(540, 160, 50, { t: 0.99 }); d.text(540, 210, 'menu:9 expired', { cls: 'xs', color: C.acc });
  d.text(240, 272, '2,000 requests/s × 0.2 s rebuild = 400 identical queries', { cls: 'mono', size: 10 });
  d.text(320, 300, 'each one repeats the same expensive work; the database slows, so the window grows', { cls: 'xs' });
  return d.svg();
}

export function be_cache_coalesce() {
  const d = fig('be_cache_coalesce', 'REQUEST COALESCING: ONE LOAD, EVERYONE ELSE WAITS FOR ITS RESULT', 300);
  for (let i = 0; i < 9; i++) { const y = 50 + i * 24; d.dot(60, y, 4, C.ink2); d.curve([[64, y], [180, y], [240, 150]], { stroke: i === 4 ? C.acc : C.line, single: true }); }
  d.circle(270, 150, 60, { fill: C.accFaint, stroke: C.acc }); d.text(270, 150, 'single\nflight', { cls: 'sm', vc: true, color: C.acc });
  d.arrow(300, 150, 420, 150, { stroke: C.acc }); d.text(360, 136, '1 query', { cls: 'xs', color: C.acc });
  d.db(430, 110, 110, 80, { label: 'database' });
  d.text(320, 250, 'per process: one promise per key; across processes: a short Redis lock', { cls: 'sm' });
  d.text(320, 278, 'Go\'s singleflight, Caffeine\'s loading cache and Varnish request collapsing all do this', { cls: 'xs' });
  return d.svg();
}

export function be_cache_lock_refresh() {
  const d = fig('be_cache_lock_refresh', 'A REBUILD LOCK: ONE WINNER REBUILDS, THE OTHERS SERVE STALE OR WAIT BRIEFLY', 300);
  const y = lanes(d, ['request A', 'request B', 'request C'], { y: 70, gap: 56, x0: 110, x1: 610 });
  seg(d, 120, y(0), 150, 'SET lock NX PX 2000 → OK', { hot: true, size: 9 }); seg(d, 280, y(0), 160, 'rebuild menu 200 ms'); seg(d, 450, y(0), 90, 'SET, DEL lock');
  seg(d, 140, y(1), 150, 'SET lock NX → nil', { size: 9 }); seg(d, 300, y(1), 120, 'serve stale copy');
  seg(d, 160, y(2), 150, 'SET lock NX → nil', { size: 9 }); seg(d, 320, y(2), 80, 'wait 50 ms', { fill: C.paper }); seg(d, 410, y(2), 80, 'retry GET');
  d.text(360, 270, 'the PX expiry frees the lock if the winner dies mid-rebuild', { cls: 'xs' });
  return d.svg();
}

export function be_cache_xfetch() {
  const d = fig('be_cache_xfetch', 'PROBABILISTIC EARLY REFRESH: THE CHANCE RISES AS EXPIRY NEARS (δ = 0.2 S, β = 1)', 300);
  const M = d.axes(80, 50, 460, 180, { xmin: 0, xmax: 3, ymin: 0, ymax: 1, xl: 'seconds before expiry', yl: 'chance someone has refreshed' });
  d.fn((t) => 1 - Math.exp(-400 * Math.exp(-5 * (3 - t))), 0, 3, M, { n: 200 });
  const T = 1.198; d.line(M.X(3 - T), M.Y(0), M.X(3 - T), M.Y(1), { stroke: C.line, dash: [3, 3], single: true });
  d.text(M.X(3 - T), M.Y(0) + 14, '1.2 s before', { cls: 'mono', size: 9 });
  [3, 2, 1, 0].forEach((s) => d.mono(M.X(3 - s), M.Y(0) + 28, s === 0 ? 'expiry' : `${s} s`, { size: 8.5, color: C.gray }));
  d.text(320, 282, 'refresh if now − δβ·ln(rand) ≥ expiry; at 2,000 requests/s the first early refresh comes about 1.2 s ahead', { cls: 'xs' });
  return d.svg();
}

export function be_cache_swr() {
  const d = fig('be_cache_swr', 'STALE-WHILE-REVALIDATE: SERVE THE OLD COPY INSTANTLY, REFRESH IN THE BACKGROUND', 280);
  const X = (s) => 60 + s * 5.5;
  seg(d, X(0), 110, X(60) - X(0), 'fresh, 60 s', { h: 28 }); seg(d, X(60), 110, X(90) - X(60), 'stale but usable', { hot: true, h: 28 }); seg(d, X(90), 110, X(100) - X(90), '', { fill: C.paper, h: 28, dash: [3, 3] });
  d.text(X(95), 84, 'must\nreload', { cls: 'xs', vc: true });
  d.dot(X(70), 150, 5, C.acc); d.text(X(70), 170, 'request at 70 s gets the stale copy now', { cls: 'xs', color: C.acc });
  d.carrow([[X(70), 150], [X(75), 200], [X(85), 200], [X(88), 140]], { stroke: C.ink2, dash: [3, 3] }); d.text(X(80), 216, 'background refresh', { cls: 'xs' });
  d.mono(320, 250, 'Cache-Control: max-age=60, stale-while-revalidate=30', { size: 10 });
  return d.svg();
}

export function be_cache_penetration() {
  const d = fig('be_cache_penetration', 'PENETRATION: REQUESTS FOR KEYS THAT CAN NEVER EXIST WALK STRAIGHT THROUGH', 320);
  d.person(50, 110, 36, { stroke: C.acc }); d.text(68, 166, 'random ids', { cls: 'xs' });
  ['/orders/9912', '/orders/18277', '/orders/40211'].forEach((s, i) => d.mono(160, 90 + i * 22, s, { size: 9, color: C.acc }));
  d.poly([[260, 70], [340, 70], [320, 200], [280, 200]], { fill: C.accFaint, stroke: C.acc }); d.text(300, 140, 'Bloom\nfilter', { cls: 'sm', vc: true, color: C.acc });
  for (let i = 0; i < 5; i++) d.line(268 + i * 15, 76, 286 + i * 6, 196, { stroke: C.acc, single: true, sw: 0.5, op: 0.5 });
  d.arrow(342, 100, 440, 100, { stroke: C.acc }); d.text(390, 88, 'definitely absent → 404', { cls: 'xs', color: C.acc });
  d.arrow(300, 204, 300, 244, { stroke: C.ink2 }); d.text(310, 230, 'maybe present', { cls: 'xs', a: 'start' });
  d.db(250, 248, 100, 60, { label: 'cache, then DB' });
  d.db(470, 60, 130, 90, { label: 'database\nnever asked' });
  return d.svg();
}

export function be_cache_bloom() {
  const d = fig('be_cache_bloom', 'A BLOOM FILTER: k HASHES SET k BITS; ANY ZERO MEANS "DEFINITELY NOT HERE"', 300);
  const bits = Array.from({ length: 18 }, (_, i) => ([2, 5, 9, 12, 15].includes(i) ? '1' : '0'));
  d.tape(30, 140, bits, { cw: 32, h: 30, hot: (i) => [2, 9, 15].includes(i), idx: (i) => i });
  d.mono(110, 70, 'order:123', { size: 10 });
  [2, 9, 15].forEach((b) => d.arrow(110, 80, 30 + b * 32 + 16, 136, { stroke: C.acc, hl: 5 }));
  d.mono(470, 70, 'order:999', { size: 10 });
  [5, 12, 13].forEach((b) => d.arrow(470, 80, 30 + b * 32 + 16, 136, { stroke: b === 13 ? C.ink2 : C.gray, hl: 5, dash: b === 13 ? undefined : [3, 3] }));
  cross(d, 30 + 13 * 32 + 16, 215, 8); d.text(30 + 13 * 32 + 16, 236, 'bit 13 is 0', { cls: 'xs' });
  d.text(320, 278, '5,000,000 ids at 1% false positives: 47,925,292 bits (6.0 MB) and 7 hashes', { cls: 'mono', size: 9.5 });
  return d.svg();
}

export function be_cache_avalanche() {
  const d = fig('be_cache_avalanche', 'AVALANCHE: MANY KEYS VANISH AT ONCE AND THE DATABASE TAKES THE FULL LOAD (ILLUSTRATIVE)', 300);
  const M = d.axes(70, 50, 480, 180, { xmin: 0, xmax: 120, ymin: 0, ymax: 4500, xl: 'seconds', yl: 'DB queries/s' });
  d.fn((t) => (t < 40 ? 400 : 400 + 3600 * Math.exp(-(t - 40) / 15)), 0, 120, M, { n: 200 });
  d.fn(() => 400, 0, 120, M, { stroke: C.slate, dash: [5, 4] });
  d.line(M.X(0), M.Y(1000), M.X(120), M.Y(1000), { stroke: C.gray, dash: [2, 4], single: true }); d.text(M.X(120), M.Y(1000) - 10, 'comfortable DB limit 1,000', { cls: 'xs', a: 'end' });
  d.text(M.X(42), M.Y(4100), 'cache node restarts empty: 4,000 q/s', { cls: 'xs', a: 'start', color: C.acc });
  d.text(320, 284, 'causes: one shared TTL, a flushed or restarted cache, a deploy that changes every key name', { cls: 'xs' });
  return d.svg();
}

export function be_cache_hot_key() {
  const d = fig('be_cache_hot_key', 'ONE HOT KEY PINS ONE SHARD WHILE THE OTHERS IDLE', 320);
  [0, 1, 2].forEach((i) => { d.db(60 + i * 140, 80, 100, 110, { label: `shard ${i + 1}`, stroke: i === 1 ? C.acc : C.ink2, fill: i === 1 ? C.accFaint : C.card }); gauge(d, 110 + i * 140, 250, 34, i === 1 ? 0.95 : 0.12, { hot: i === 1 }); });
  d.text(250, 60, 'menu:9 during a promo: 50,000 reads/s', { cls: 'sm', color: C.acc });
  d.text(530, 90, 'fixes', { cls: 'ttl' });
  ['local copy, 1 s TTL', 'replicas: menu:9#1 … #8', 'read from replicas', 'precompute and push'].forEach((s, i) => { tick(d, 470, 116 + i * 30, 6); d.text(484, 116 + i * 30, s, { cls: 'xs', a: 'start' }); });
  d.text(530, 260, '20 instances × 1 read/s\n= 20 reads/s on Redis', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cache_big_key() {
  const d = fig('be_cache_big_key', 'A BIG KEY ON A SINGLE-THREADED SERVER: ONE TRUCK BLOCKS THE LANE', 300);
  d.line(30, 120, 610, 120, { stroke: C.ink2, sw: 1.4, single: true }); d.line(30, 190, 610, 190, { stroke: C.ink2, sw: 1.4, single: true });
  d.line(30, 155, 610, 155, { stroke: C.line, dash: [10, 8], single: true });
  d.shift(60, 0, (g) => { g.rect(300, 128, 170, 54, { r: 4, fill: C.accSoft, stroke: C.acc }); g.text(385, 155, 'HGETALL menu:all (10 MB)', { cls: 'mono', size: 9.5, color: C.acc }); }, { at: [0, 1], dur: 8 });
  for (let i = 0; i < 5; i++) d.rect(60 + i * 46, 140, 36, 30, { r: 6, fill: C.card, stroke: C.ink2 });
  d.text(150, 210, 'GET user:42, INCR rl:42, …', { cls: 'mono', size: 9 });
  d.text(320, 250, '10 MB over 10 Gbit/s is 8 ms of network alone; every small command waits behind it', { cls: 'sm' });
  d.text(320, 278, 'split big values, use HSCAN or field reads, and find them with redis-cli --bigkeys', { cls: 'xs' });
  return d.svg();
}

export function be_cache_outage() {
  const d = fig('be_cache_outage', 'REDIS DOWN AT PEAK: 4,000 QUERIES/S HEAD FOR A DATABASE COMFORTABLE AT 1,000', 320);
  d.server(40, 110, 70, 90, { label: 'app' });
  d.db(220, 40, 100, 80, { label: 'Redis' }); cross(d, 270, 80, 26);
  d.arrow(114, 120, 214, 90, { stroke: C.line, dash: [3, 3] }); d.text(160, 86, 'timeout 50 ms', { cls: 'xs' });
  gauge(d, 450, 190, 80, 1, { hot: true, value: '4,000 q/s', label: 'database', red: 0.25 });
  d.arrow(114, 170, 360, 170, { stroke: C.acc });
  d.text(270, 250, 'what keeps it alive', { cls: 'ttl' });
  ['circuit breaker skips Redis instantly', 'local cache serves the hottest keys', 'shed or queue the rest: 503 + Retry-After'].forEach((s, i) => d.text(270, 272 + i * 16, s, { cls: 'xs' }));
  return d.svg();
}

export function be_redis_types() {
  const d = fig('be_redis_types', 'REDIS IS A SERVER OF DATA STRUCTURES, NOT JUST A KEY-VALUE STORE', 360);
  const cell = (x, y, t, s) => { d.text(x, y, t, { cls: 'ttl', size: 11, a: 'start' }); d.text(x, y + 16, s, { cls: 'xs', a: 'start' }); };
  cell(30, 50, 'string', 'bytes up to 512 MB; counters'); d.box(30, 76, 130, 26, '"42" → INCR → "43"', { r: 4, cls: 'mono', size: 9, fill: C.card });
  cell(330, 50, 'hash', 'fields inside one key'); sheet(d, 330, 76, [['field', 80], ['value', 90]], [['name', 'Asha'], ['city', 'Pune']], { size: 9, rh: 18 });
  cell(30, 140, 'list', 'push and pop at both ends'); d.tape(30, 166, ['j7', 'j6', 'j5', 'j4'], { cw: 40, h: 26 }); d.arrow(10, 179, 28, 179, { stroke: C.acc, hl: 5 }); d.arrow(192, 179, 212, 179, { stroke: C.acc, hl: 5 });
  cell(330, 140, 'set', 'unique members'); [['42', 360], ['8', 400], ['17', 440]].forEach(([s, x]) => d.circle(x, 180, 30, { fill: C.card, stroke: C.ink2 })); [['42', 360], ['8', 400], ['17', 440]].forEach(([s, x]) => d.mono(x, 180, s, { size: 9 }));
  cell(30, 230, 'sorted set', 'members ordered by score'); [['Asha', 920], ['Ben', 870], ['Chen', 610]].forEach(([n, v], i) => { d.rect(30, 256 + i * 22, v / 6, 18, { r: 2, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(36 + v / 6, 265 + i * 22, `${n} ${v}`, { size: 9, a: 'start' }); });
  cell(330, 230, 'stream, bitmap, HyperLogLog', 'log, bits, estimates'); d.tape(330, 258, ['1-0', '1-1', '2-0', '…'], { cw: 46, h: 22, size: 8.5 }); d.tape(330, 292, ['1', '0', '1', '1', '0', '1', '0', '0'], { cw: 18, h: 18, size: 8, hot: (i) => i === 3 });
  return d.svg();
}

export function be_redis_zset() {
  const d = fig('be_redis_zset', 'A SORTED SET: SKIP LIST LANES GIVE O(LOG N) INSERTS AND RANKS', 320);
  const xs = [80, 160, 240, 320, 400, 480, 560], sc = [120, 340, 610, 700, 870, 920, 990], lv = [3, 1, 2, 1, 3, 1, 2];
  for (let L = 0; L < 3; L++) { const y = 230 - L * 50; d.text(40, y, `L${L + 1}`, { cls: 'mono', size: 9, a: 'end' }); let prev = 50; xs.forEach((x, i) => { if (lv[i] > L) { d.arrow(prev + 10, y, x - 16, y, { stroke: L === 2 ? C.acc : C.ink2, hl: 4, sw: 0.9 }); d.box(x - 16, y - 12, 32, 24, String(sc[i]), { r: 3, cls: 'mono', size: 8.5, fill: L === 2 ? C.accSoft : C.card, stroke: L === 2 ? C.acc : C.ink2 }); prev = x + 6; } }); }
  d.text(320, 60, 'ZADD board 700 user:42   ZREVRANK board user:42 → 3', { cls: 'mono', size: 10 });
  d.text(320, 286, 'search drops down a lane when the next score is too big; a hash maps member → score', { cls: 'xs' });
  return d.svg();
}

export function be_redis_stream() {
  const d = fig('be_redis_stream', 'A STREAM: AN APPEND-ONLY LOG WITH CONSUMER GROUPS AND ACKNOWLEDGEMENTS', 320);
  const ids = ['1700-0', '1700-1', '1701-0', '1703-0', '1703-1', '1704-0'];
  ids.forEach((s, i) => d.box(30 + i * 90, 70, 84, 36, s, { r: 4, cls: 'mono', size: 9.5, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }));
  d.arrow(570, 88, 610, 88, { stroke: C.ink2, hl: 5 }); d.text(600, 60, 'XADD', { cls: 'mono', size: 9 });
  d.text(320, 140, 'consumer group "kitchen"', { cls: 'ttl', size: 11 });
  d.gear(200, 200, 18, { spin: 5 }); d.text(200, 232, 'w1 has 1703-0', { cls: 'xs', color: C.acc }); d.arrow(210, 180, 300, 110, { stroke: C.acc, hl: 5 });
  d.gear(440, 200, 18, { spin: 5 }); d.text(440, 232, 'w2 has 1703-1', { cls: 'xs' }); d.arrow(430, 180, 400, 110, { stroke: C.ink2, hl: 5 });
  d.text(320, 274, 'XREADGROUP hands each entry to one consumer; it stays pending until XACK, and XAUTOCLAIM rescues it', { cls: 'xs' });
  return d.svg();
}

export function be_redis_bits_hll() {
  const d = fig('be_redis_bits_hll', 'COUNTING USERS: A BITMAP IS EXACT, A HYPERLOGLOG IS 12 KB AND ROUGH', 320);
  d.text(40, 56, 'bitmap: daily active users', { cls: 'ttl', a: 'start' });
  for (let i = 0; i < 64; i++) d.rect(40 + i * 8.5, 72, 7, 18, { r: 1, fill: (i * 13) % 7 < 3 ? C.acc : C.paper, stroke: C.line, sw: 0.5 });
  d.mono(40, 108, 'SETBIT dau:2026-10-06 42 1   BITCOUNT dau:2026-10-06', { size: 9.5, a: 'start' });
  d.text(40, 130, '1,000,000 users = 1,000,000 bits = 125,000 bytes; AND or OR across days for retention', { cls: 'xs', a: 'start' });
  d.text(40, 180, 'HyperLogLog: unique visitors', { cls: 'ttl', a: 'start' });
  d.rect(40, 196, 120, 70, { r: 6, fill: C.accFaint, stroke: C.acc }); d.text(100, 231, '12 KB', { size: 18, color: C.acc });
  d.mono(180, 214, 'PFADD visitors:9 user:42', { size: 9.5, a: 'start' }); d.mono(180, 236, 'PFCOUNT visitors:9 → about 48,210', { size: 9.5, a: 'start' });
  d.text(180, 258, 'any number of members; standard error 0.81%; cannot list who', { cls: 'xs', a: 'start' });
  return d.svg();
}

export function be_redis_pubsub() {
  const d = fig('be_redis_pubsub', 'PUB/SUB IS A RADIO BROADCAST: IF YOU ARE NOT LISTENING, YOU MISS IT', 300);
  d.server(40, 110, 70, 80, { label: 'publisher' });
  d.line(260, 80, 260, 200, { stroke: C.ink2, sw: 2, single: true }); d.poly([[245, 200], [275, 200], [260, 180]], { fill: C.card, stroke: C.ink2 });
  [24, 44, 64].forEach((r) => d.pulse(260, 80, { r0: 6, r1: r + 10, dur: 2, at: [0, 0.8] }));
  d.text(260, 226, 'channel menu:9', { cls: 'mono', size: 9.5 });
  d.arrow(114, 150, 240, 120, { stroke: C.ink2 });
  [['instance 1', 80, true], ['instance 2', 150, true], ['instance 3 (restarting)', 220, false]].forEach(([s, y, on]) => { d.server(470, y - 20, 40, 44, { unit: 12 }); d.text(520, y, s, { cls: 'xs', a: 'start' }); if (on) d.arrow(300, 100, 464, y, { stroke: C.acc, hl: 5 }); else cross(d, 440, y, 8); });
  d.text(320, 286, 'no storage, no replay, no acknowledgement; use streams when every message must arrive', { cls: 'xs' });
  return d.svg();
}

export function be_redis_event_loop() {
  const d = fig('be_redis_event_loop', 'ONE THREAD RUNS EVERY COMMAND, ONE AT A TIME', 320);
  for (let i = 0; i < 6; i++) { d.laptop(20, 40 + i * 44, 44); hose(d, 70, 54 + i * 44, 200, 160, { th: 1.5 }); }
  d.circle(260, 160, 120, { fill: C.paper, stroke: C.ink2 }); d.text(260, 96, 'epoll', { cls: 'xs' });
  d.travel(`M260,100 A60,60 0 1 1 259.9,100`, { r: 5, dur: 2 });
  d.person(260, 140, 34, { stroke: C.acc }); d.text(260, 194, 'one cook', { cls: 'xs', color: C.acc });
  ['GET user:42', 'INCR rl:42', 'ZADD board …', 'SET sess:a1 …'].forEach((s, i) => d.box(380, 70 + i * 40, 150, 30, s, { r: 4, cls: 'mono', size: 9.5, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }));
  d.text(455, 250, 'commands are atomic because\nnothing else runs in between', { cls: 'xs', vc: true });
  d.text(320, 300, 'about 100,000 simple commands per second per core; I/O threads (Redis 6) only move bytes', { cls: 'xs' });
  return d.svg();
}

export function be_redis_resp() {
  const d = fig('be_redis_resp', 'RESP ON THE WIRE: SET user:42:name Asha', 280);
  const parts = [['*3\\r\\n', 'array of 3'], ['$3\\r\\nSET\\r\\n', 'bulk string, 3 bytes'], ['$12\\r\\nuser:42:name\\r\\n', '12 bytes'], ['$4\\r\\nAsha\\r\\n', '4 bytes']];
  let x = 30;
  parts.forEach(([s, l], i) => { const w = s.length * 6.3 + 10; d.rect(x, 80, w, 32, { r: 4, fill: i === 0 ? C.accSoft : C.card, stroke: i === 0 ? C.acc : C.ink2 }); d.mono(x + w / 2, 96, s, { size: 10 }); d.brace(x + 2, x + w - 2, 124, { label: l, cls: 'xs' }); x += w + 6; });
  d.mono(30, 190, '+OK\\r\\n', { size: 11, a: 'start', color: C.acc }); d.text(110, 190, 'simple string reply', { cls: 'xs', a: 'start' });
  d.text(320, 240, 'length prefixes mean no escaping and fast parsing; RESP3 (Redis 6) adds maps, sets and pushes', { cls: 'xs' });
  return d.svg();
}

export function be_redis_pipeline() {
  const d = fig('be_redis_pipeline', '100 COMMANDS: ONE ROUND TRIP EACH, OR ONE ROUND TRIP FOR ALL', 320);
  d.text(40, 54, 'one at a time: 100 × 0.5 ms = 50 ms', { cls: 'ttl', a: 'start' });
  d.laptop(30, 70, 50); d.db(540, 66, 70, 50);
  let p = 'M90,90'; for (let i = 0; i < 6; i++) p += ' L530,90 L90,90';
  d.travel(p, { r: 4, dur: 6 });
  for (let i = 0; i < 40; i++) d.line(100 + i * 10.6, 120, 100 + i * 10.6, 130, { stroke: C.ink2, single: true });
  d.text(40, 186, 'pipelined: about 0.5 ms + 100 × 0.002 ms = 0.7 ms', { cls: 'ttl', a: 'start', color: C.acc });
  d.laptop(30, 200, 50); d.db(540, 196, 70, 50);
  d.travel([[90, 220], [530, 220]], { label: '100 commands', w: 96, at: [0, 0.4] });
  d.travel([[530, 236], [90, 236]], { label: '100 replies', w: 86, at: [0.5, 0.9], fill: C.card, color: C.ink2 });
  d.text(320, 300, 'pipelining is not atomic; other clients\' commands can run in between', { cls: 'xs' });
  return d.svg();
}

export function be_redis_multi_lua() {
  const d = fig('be_redis_multi_lua', 'THREE WAYS TO GROUP COMMANDS', 320);
  [['MULTI / EXEC', 'queued, run together'], ['WATCH', 'abort if a key changed'], ['Lua script', 'logic runs on the server']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 2); d.text(x + 96, 76, s, { cls: 'xs' }); });
  card(d, 32, 96, 170, ['MULTI', 'INCR rl:42', 'EXPIRE rl:42 60', 'EXEC'], { size: 9.5 });
  d.text(116, 220, 'no reads inside: you\ncannot branch on a value', { cls: 'xs', vc: true });
  card(d, 239, 96, 170, ['WATCH stock:17', 'GET stock:17 → 5', 'MULTI', 'SET stock:17 4', 'EXEC → nil'], { size: 9.5, hot: [4] });
  d.text(323, 230, 'someone changed it,\nso retry', { cls: 'xs', vc: true });
  card(d, 446, 96, 170, ['local s = GET(KEYS[1])', 'if s > 0 then', '  DECR(KEYS[1])', 'end', 'return s'], { size: 9 });
  d.text(530, 230, 'atomic read, decide and\nwrite; keep scripts short', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_redis_expiry() {
  const d = fig('be_redis_expiry', 'HOW EXPIRED KEYS ACTUALLY DISAPPEAR', 300);
  panel(d, 20, 40, 290, 230, 'lazy: checked on access'); panel(d, 330, 40, 290, 230, 'active: sampled 10 times/s', true);
  d.person(70, 110, 30); d.arrow(100, 126, 160, 126, { stroke: C.ink2, hl: 5 }); d.box(170, 110, 110, 32, 'sess:a1 (expired)', { r: 4, cls: 'mono', size: 8.5, fill: C.card });
  d.text(165, 180, 'GET sees the expiry time has passed,\ndeletes the key, returns nil', { cls: 'xs', vc: true });
  for (let i = 0; i < 20; i++) { const x = 360 + (i % 10) * 24, y = 100 + Math.floor(i / 10) * 30; const dead = [1, 4, 7, 12, 15, 18].includes(i); d.circle(x, y, 16, { fill: dead ? C.accSoft : C.card, stroke: dead ? C.acc : C.ink2 }); if (dead) cross(d, x, y, 4); }
  d.text(475, 180, 'take 20 keys with a TTL, delete the expired;\nif more than 25% were expired, go again', { cls: 'xs', vc: true });
  d.text(320, 290, 'expired keys can linger in memory until one of the two finds them', { cls: 'xs' });
  return d.svg();
}

export function be_redis_persistence() {
  const d = fig('be_redis_persistence', 'RDB SNAPSHOTS FORK AND SHARE PAGES; AOF APPENDS EVERY WRITE', 340);
  d.text(160, 50, 'RDB: fork, copy-on-write', { cls: 'ttl' });
  d.rect(30, 70, 110, 150, { r: 6, fill: C.paper }); d.text(85, 86, 'parent (serving)', { cls: 'xs' });
  d.rect(180, 70, 110, 150, { r: 6, fill: C.paper }); d.text(235, 86, 'child (writing file)', { cls: 'xs' });
  for (let i = 0; i < 5; i++) { const y = 100 + i * 22; d.rect(45, y, 80, 16, { r: 2, fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.rect(195, y, 80, 16, { r: 2, fill: C.card, stroke: C.ink2 }); if (i !== 2) d.line(125, y + 8, 195, y + 8, { stroke: C.line, single: true, dash: [2, 3] }); }
  d.text(160, 240, 'only pages written during the\nsnapshot get copied (orange)', { cls: 'xs', vc: true });
  d.text(480, 50, 'AOF: append-only file', { cls: 'ttl' });
  d.doc(400, 70, 160, 170, { lines: false });
  ['SET sess:a1 …', 'INCR rl:42', 'ZADD board 700 …', 'DEL cart:7', 'INCR rl:42'].forEach((s, i) => d.mono(410, 94 + i * 24, s, { size: 9, a: 'start' }));
  d.during([0, 1], (g) => g.blink((h) => h.rect(406, 210, 140, 18, { r: 2, fill: C.accFaint, stroke: C.acc }), { dur: 1 }));
  d.text(480, 260, 'appendfsync everysec:\nlose at most about 1 s of writes', { cls: 'xs', vc: true });
  d.text(320, 316, 'Wren uses both: RDB for fast restarts and backups, AOF everysec for a small loss window', { cls: 'xs' });
  return d.svg();
}

export function be_redis_sentinel() {
  const d = fig('be_redis_sentinel', 'SENTINEL: THREE WATCHERS AGREE THE PRIMARY IS DOWN, THEN PROMOTE A REPLICA', 320);
  d.db(250, 50, 120, 80, { label: 'primary' }); d.during([0.25, 1], (g) => cross(g, 310, 90, 28));
  d.db(120, 200, 110, 80, { label: 'replica 1' });
  d.db(390, 200, 110, 80, { label: 'replica 2' }); d.during([0.6, 1], (g) => g.db(390, 200, 110, 80, { label: 'new primary', stroke: C.acc, fill: C.accFaint }));
  [[60, 70], [560, 70], [560, 170]].forEach(([x, y], i) => { d.circle(x, y, 40, { fill: C.card, stroke: C.ink2 }); d.circle(x, y, 14, { fill: C.paper, stroke: C.ink2 }); d.dot(x, y, 4, C.ink); d.text(x, y + 32, `sentinel ${i + 1}`, { cls: 'xs' }); });
  d.during([0.35, 1], (g) => g.text(320, 160, 'quorum 2 of 3: "down"', { cls: 'mono', size: 9.5, color: C.acc }));
  d.text(320, 304, 'replication is asynchronous, so writes acknowledged just before the crash can vanish', { cls: 'xs' });
  return d.svg();
}

export function be_redis_cluster() {
  const d = fig('be_redis_cluster', 'REDIS CLUSTER: 16,384 HASH SLOTS SPLIT ACROSS SHARDS', 340);
  const cx = 200, cy = 180, r = 120;
  const arcs = [[0, 5460, 'shard A'], [5461, 10922, 'shard B'], [10923, 16383, 'shard C']];
  arcs.forEach(([a, b, s], i) => { const t0 = a / 16384 * 2 * Math.PI - Math.PI / 2, t1 = (b + 1) / 16384 * 2 * Math.PI - Math.PI / 2; const p = (t, rr) => [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]; d.path(`M${p(t0, r)[0]},${p(t0, r)[1]} A${r},${r} 0 0 1 ${p(t1, r)[0]},${p(t1, r)[1]}`, { stroke: i === 2 ? C.acc : C.ink2, sw: i === 2 ? 7 : 5, single: true }); const [lx, ly] = p((t0 + t1) / 2, r + 30); d.text(lx, ly, s, { cls: 'ttl', size: 11, color: i === 2 ? C.acc : undefined }); d.mono(lx, ly + 15, `${a} to ${b}`, { size: 8.5, color: C.gray }); });
  const t = 15880 / 16384 * 2 * Math.PI - Math.PI / 2; d.dot(cx + Math.cos(t) * r, cy + Math.sin(t) * r, 6, C.acc);
  d.text(cx, cy - 6, 'CRC16(key)', { cls: 'mono', size: 10 }); d.text(cx, cy + 12, 'mod 16384', { cls: 'mono', size: 10 });
  card(d, 380, 70, 240, ['user:42          → slot 15880', 'order:123        → slot 15115', 'user:42:cart     → slot 12984', '{user:42}:cart   → slot 15880'], { size: 9.5, hot: [3] });
  d.text(500, 180, 'a hash tag {…} hashes only the part in\nbraces, so related keys share a slot', { cls: 'xs', vc: true });
  d.text(500, 236, 'wrong node? it replies MOVED 15880\nand the client updates its slot map', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_redis_uses() {
  const d = fig('be_redis_uses', 'ONE SERVER, MANY JOBS: WHAT BACKENDS USE REDIS FOR', 340);
  d.db(260, 130, 120, 100, { label: 'Redis', stroke: C.acc, fill: C.accFaint });
  const u = [['cache', 'string + TTL', 0], ['sessions', 'hash + TTL', 1], ['rate limits', 'INCR or Lua', 2], ['locks', 'SET NX PX', 3], ['leaderboards', 'sorted set', 4], ['queues', 'list or stream', 5], ['presence', 'set + TTL', 6], ['counters', 'INCR, HLL', 7]];
  u.forEach(([t, s, i]) => { const a = i / 8 * 2 * Math.PI - Math.PI / 2, x = 320 + Math.cos(a) * 230, y = 180 + Math.sin(a) * 130; d.line(320 + Math.cos(a) * 70, 180 + Math.sin(a) * 55, x - Math.cos(a) * 40, y - Math.sin(a) * 18, { stroke: C.line, single: true }); d.text(x, y - 6, t, { cls: 'ttl', size: 11 }); d.text(x, y + 10, s, { cls: 'xs' }); });
  d.text(320, 330, 'each use has a different tolerance for data loss; sessions and locks care most', { cls: 'xs' });
  return d.svg();
}

export function be_cdn_pops() {
  const d = fig('be_cdn_pops', 'A CDN ANSWERS FROM THE NEAREST EDGE; ONLY MISSES TRAVEL TO THE ORIGIN', 330);
  const m = world(d, 20, 40, 600, 250, { lat: [-50, 75] });
  const pops = ['london', 'frankfurt', 'virginia', 'california', 'singapore', 'tokyo', 'sydney', 'saopaulo', 'delhi', 'dubai'];
  pops.forEach((c) => { const [x, y] = m.at(c); d.circle(x, y, 9, { fill: C.card, stroke: C.ink2 }); });
  const o = m.at('mumbai'); d.server(o[0] - 9, o[1] - 14, 18, 26, { unit: 9, fill: C.accSoft, stroke: C.acc }); d.text(o[0] + 14, o[1] + 18, 'origin, Mumbai', { cls: 'xs', a: 'start', color: C.acc });
  ['london', 'singapore', 'virginia'].forEach((c, i) => d.travel(arc(m.at(c), o, 0.25), { r: 3.5, at: [i * 0.3, i * 0.3 + 0.35] }));
  d.text(320, 316, 'user in London: 10 ms to the edge on a hit, about 120 ms to Mumbai on a miss (illustrative)', { cls: 'xs' });
  return d.svg();
}

export function be_cdn_cache_key() {
  const d = fig('be_cdn_cache_key', 'THE CACHE KEY DECIDES WHAT COUNTS AS "THE SAME" RESPONSE', 300);
  const parts = [['https://', false], ['img.wren.example', false], ['/menu/9/biryani.jpg', true], ['?w=400', true]];
  let x = 40; parts.forEach(([s, h]) => { const w = s.length * 7 + 12; d.box(x, 70, w, 34, s, { r: 4, cls: 'mono', size: 10, fill: h ? C.accSoft : C.card, stroke: h ? C.acc : C.ink2 }); x += w + 4; });
  d.text(320, 128, '+ Vary: Accept (webp or jpeg)', { cls: 'mono', size: 10 });
  d.text(40, 176, 'left out on purpose', { cls: 'ttl', a: 'start' });
  [['?utm_source=…', 'tracking parameters: strip them'], ['Cookie', 'per-user: would make every copy unique'], ['?w=401, ?w=402 …', 'normalise to a few sizes']].forEach(([a, b], i) => { d.mono(40, 202 + i * 24, a, { size: 9.5, a: 'start' }); d.text(220, 202 + i * 24, b, { cls: 'xs', a: 'start' }); });
  return d.svg();
}

export function be_cdn_shield() {
  const d = fig('be_cdn_shield', 'ORIGIN SHIELD: 300 EDGES ASK ONE SHIELD, THE SHIELD ASKS THE ORIGIN ONCE', 320);
  for (let i = 0; i < 12; i++) { const a = Math.PI * (0.15 + i * 0.065), x = 200 + Math.cos(a) * 160, y = 300 - Math.sin(a) * 230; d.circle(x, y, 14, { fill: C.card, stroke: C.ink2 }); d.line(x, y, 200, 220, { stroke: C.line, single: true }); }
  d.text(80, 60, '300 edges', { cls: 'xs' });
  shield(d, 200, 190, 50, { fill: C.accSoft, stroke: C.acc, label: 'shield' });
  d.arrow(230, 220, 420, 220, { stroke: C.acc }); d.server(430, 180, 70, 80, { label: 'origin' });
  d.text(530, 100, 'new image, no shield:\nup to 300 origin fetches', { cls: 'xs', vc: true });
  d.text(530, 160, 'with a shield: 1', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'the shield also collapses concurrent misses for the same object into one request', { cls: 'xs' });
  return d.svg();
}

export function be_cdn_purge() {
  const d = fig('be_cdn_purge', 'THREE WAYS TO CHANGE WHAT THE EDGE SERVES', 320);
  [['versioned URL', 'new name, nothing to purge'], ['purge by URL', 'one object, seconds to spread'], ['surrogate key', 'purge a whole tag']].forEach(([t, s], i) => { const x = 20 + i * 207; panel(d, x, 40, 193, 250, t, i === 0); d.text(x + 96, 76, s, { cls: 'xs' }); });
  d.mono(116, 120, 'app.3f9a2c.js', { size: 10, color: C.gray }); d.arrow(116, 132, 116, 160, { stroke: C.acc, hl: 5 }); d.mono(116, 176, 'app.8b10e4.js', { size: 10, color: C.acc }); d.text(116, 220, 'Cache-Control:\nmax-age=31536000,\nimmutable', { cls: 'mono', size: 8.5, vc: true });
  d.mono(323, 130, 'PURGE /menu/9.json', { size: 10 }); d.cloud(270, 160, 110, 60); d.text(323, 250, 'API call to the CDN', { cls: 'xs' });
  d.mono(530, 120, 'Surrogate-Key:', { size: 9.5 }); d.mono(530, 136, 'menu-9 rest-9', { size: 9.5, color: C.acc });
  d.text(530, 190, 'purge "menu-9" clears the\nJSON, the HTML and every\nimage tagged with it', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cdn_signed() {
  const d = fig('be_cdn_signed', 'A SIGNED URL: THE EDGE CHECKS THE SIGNATURE AND EXPIRY WITHOUT ASKING THE ORIGIN', 300);
  d.mono(40, 80, 'https://media.wren.example/receipts/124.pdf', { size: 10.5, a: 'start' });
  d.mono(40, 102, '?expires=1791200000&sig=8f1c…a91', { size: 10.5, a: 'start', color: C.acc });
  d.server(40, 150, 70, 80, { label: 'API signs' }); d.key(130, 190, 30, { stroke: C.acc });
  d.arrow(170, 190, 280, 190, { stroke: C.gray }); d.phone(290, 150, 80); d.text(312, 246, 'client', { cls: 'xs' });
  d.arrow(340, 190, 430, 190, { stroke: C.gray });
  shield(d, 480, 150, 60, { label: 'edge' }); d.key(520, 200, 26, { stroke: C.acc });
  d.text(480, 262, 'HMAC(path + expires) matches?\nnot expired? then serve', { cls: 'xs', vc: true });
  return d.svg();
}

export function be_cdn_security() {
  const d = fig('be_cdn_security', 'THE EDGE AS A CASTLE WALL: ABSORB, FILTER, CHALLENGE', 320);
  d.path('M200,60 L200,280 M180,60 L180,280', { stroke: C.ink2, sw: 1.6 });
  for (let y = 60; y < 280; y += 24) d.rect(176, y, 28, 12, { r: 1, fill: C.card, stroke: C.ink2 });
  for (let i = 0; i < 10; i++) { const y = 70 + i * 21; d.travel([[20, y], [176, y]], { r: 3, at: [i * 0.07, i * 0.07 + 0.3], color: i % 3 === 0 ? C.ink2 : C.acc }); }
  d.text(90, 300, 'traffic, some of it hostile', { cls: 'xs' });
  [['DDoS absorption', 'spread a flood over 300 sites'], ['WAF rules', 'block SQLi patterns, bad paths'], ['bot mitigation', 'rate limits, challenges, fingerprints']].forEach(([t, s], i) => { d.text(250, 90 + i * 70, t, { cls: 'ttl', a: 'start', size: 11 }); d.text(250, 108 + i * 70, s, { cls: 'xs', a: 'start' }); });
  d.server(540, 130, 70, 80, { label: 'origin' }); d.arrow(470, 170, 534, 170, { stroke: C.ink2 });
  return d.svg();
}

export function be_cache_e2e() {
  const d = fig('be_cache_e2e', 'GET /restaurants/9/menu: WHERE EACH LAYER CAN ANSWER', 340);
  const st = [['browser', 'max-age 60', 0], ['CDN edge', 'hit 95%', 5], ['gateway', 'auth, route', 20], ['local cache', '1 s, hot keys', 20.001], ['Redis', 'menu:9:v42', 20.5], ['PostgreSQL', '2 queries', 28.5]];
  st.forEach(([t, s, ms], i) => { const x = 50 + i * 108; d.circle(x, 120, 44, { fill: i === 4 ? C.accSoft : C.card, stroke: i === 4 ? C.acc : C.ink2 }); d.mono(x, 120, `${ms} ms`.replace('20.001', '20.001'), { size: 8.5 }); d.text(x, 160, t, { cls: 'ttl', size: 10.5 }); d.text(x, 176, s, { cls: 'xs' }); if (i < 5) d.arrow(x + 24, 120, x + 84, 120, { stroke: C.gray, hl: 5 }); });
  d.travel([[50, 120], [482, 120]], { r: 5, dur: 6, at: [0, 0.8] });
  d.text(320, 220, 'cumulative time to reach each layer, illustrative', { cls: 'xs' });
  d.text(320, 256, 'a CDN hit answers in 5 ms; a Redis hit in about 21 ms; a full miss in about 29 ms', { cls: 'sm' });
  d.text(320, 286, 'each layer has its own TTL and its own invalidation, and they must agree', { cls: 'xs' });
  return d.svg();
}

export function be_cache_components() {
  const d = fig('be_cache_components', 'THE UNIT ON ONE PAGE', 340);
  fridge(d, 40, 60, 110, 180, { jars: ['menu', 'user', 'sess', 'rank', 'rl', 'lock'] }); d.text(95, 260, 'Redis structures', { cls: 'sm' });
  [['patterns', 'aside, through, behind, around'], ['expiry', 'TTL, jitter, LRU, LFU'], ['invalidation', 'delete, version, events'], ['failures', 'stampede, penetration,\navalanche, hot and big keys'], ['scale', 'persistence, Sentinel, Cluster'], ['edge', 'CDN keys, purges, shields']].forEach(([t, s], i) => { const x = 210 + (i % 2) * 210, y = 60 + Math.floor(i / 2) * 80; d.rect(x, y, 190, 62, { r: 8, fill: i === 3 ? C.accFaint : C.paper, stroke: i === 3 ? C.acc : C.line }); d.text(x + 95, y + 18, t, { cls: 'ttl', size: 11 }); d.text(x + 95, y + 40, s, { cls: 'xs', vc: true }); });
  d.text(320, 316, 'every cache is a copy; every design question is how old a copy may be and who pays when it is missing', { cls: 'xs' });
  return d.svg();
}

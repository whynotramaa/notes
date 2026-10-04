import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';
import { D, C } from '../lib/draw.js';
import { world, arc } from '../lib/world.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const edge = (d, x, y, hot = false, s = '') => { d.server(x, y, 44, 50, { unit: 13, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2, led: hot ? () => true : undefined }); if (s) d.text(x + 22, y + 64, s, { cls: 'xs' }); };
export function where_sd_cdn(stage=99) { return systemMap("sd_cdn", ["Edges, origins, hits and misses", "TTL and Cache-Control", "Invalidation and versioned URLs", "Pull vs push CDN and shielding", "Signed URLs and private delivery", "Geographic routing", "Video and image delivery", "Case study: private video delivery"], stage); }
export function cover_sd_cdn() { return systemCover("sd_cdn", 14, ["CDN and content", "delivery"], "CDN and content delivery", ["Edges, origins, hits and misses", "TTL and Cache-Control", "Invalidation and versioned URLs", "Pull vs push CDN and shielding", "Signed URLs and private delivery", "Geographic routing", "Video and image delivery", "Case study: private video delivery"]); }
export function sd_cdn_roles() {
const d=illustration('sd_cdn_roles','CDN ATLAS / MANY SERVING EDGES, ONE SOURCE OF CONTENT',440);
  const m=world(d,33,65,574,259,{graticule:false});
  const source=m.at('virginia'),selected=m.at('mumbai');
  ['london','mumbai','tokyo','saopaulo','sydney'].forEach(city=>{
    const target=m.at(city);d.path(arc(source,target,.12),{stroke:city==='mumbai'?C.acc:C.line,single:true,sw:city==='mumbai'?1.5:.9,dash:city==='mumbai'?[5,4]:undefined});
  });
  [['london','London',0,-31],['mumbai','Mumbai',0,34],['tokyo','Tokyo',26,26],['saopaulo','São Paulo',-3,31],['sydney','Sydney',0,33]].forEach(([city,s,dx,dy])=>mapSite(d,m,city,s,{dx,dy,hot:city==='mumbai'}));
  d.db(source[0]-15,source[1]-19,30,38,{fill:C.accSoft,stroke:C.acc});d.text(source[0]-20,source[1],'origin',{cls:'ttl',a:'end',color:C.acc});
  d.line(32,358,608,358,{stroke:C.line,single:true});
  d.phone(38,378,42);d.arrow(72,395,145,395,{stroke:C.acc});d.server(153,377,34,39,{fill:C.accSoft,stroke:C.acc,unit:12});
  d.text(206,385,'hit: selected edge serves permitted bytes',{cls:'sm',a:'start'});
  d.text(206,408,'miss: fetch from source, then retain a usable copy',{cls:'sm',a:'start'});
  d.travel(arc(source,selected,.12),{dur:9,at:[.2,.65],r:4});d.pulse(selected[0],selected[1],{dur:9,at:[.6,.85],r1:27});
  return d.svg();
}
export function sd_cdn_misshit() {
  const d = new D(640, 318, 'sd_cdn_misshit');
  d.cycle = 9;
  d.text(10, 16, 'A MISS POPULATES STATE THAT A LATER REQUEST CAN REUSE', { cls: 'cap', a: 'start' });
  d.phone(46, 96, 76, { label: 'viewer' });
  d.server(270, 74, 100, 116, { label: 'edge', led: (i) => i === 2 });
  d.db(520, 92, 80, 92, { under: 'origin' });
  d.arrow(92, 122, 264, 122, { stroke: C.ink2, hl: 6 });
  d.arrow(264, 160, 92, 160, { stroke: C.ink2, hl: 6 });
  d.arrow(376, 122, 514, 122, { stroke: C.acc, hl: 6, dash: [5, 4] });
  d.arrow(514, 160, 376, 160, { stroke: C.acc, hl: 6, dash: [5, 4] });
  d.text(178, 110, 'GET /clip-c7', { cls: 'mono', size: 9.5 });
  d.text(445, 110, 'miss: fetch', { cls: 'sm' });
  d.text(445, 176, 'bytes + policy', { cls: 'sm' });
  d.text(320, 220, 'edge cache', { cls: 'xs' });
  d.tape(270, 228, ['', '', ''], { cw: 33.3, h: 24 });
  d.during([0.33, 1], (g) => { g.rect(271, 229, 31, 22, { r: 0, fill: C.accSoft, stroke: C.acc, sw: 0.9 }); g.text(286.5, 240, 'c7', { cls: 'mono', size: 9.5 }); });
  d.travel([[92, 122], [266, 122]], { at: [0, 0.1], r: 4, color: C.ink2 });
  d.travel([[374, 122], [516, 122]], { at: [0.1, 0.2], r: 4 });
  d.pulse(560, 138, { at: [0.18, 0.3], r1: 24 });
  d.travel([[516, 160], [374, 160]], { at: [0.21, 0.33], token: 'packet' });
  d.travel([[266, 160], [92, 160]], { at: [0.34, 0.46], token: 'packet', fill: C.paper, color: C.ink2 });
  d.travel([[92, 122], [266, 122]], { at: [0.56, 0.66], r: 4, color: C.ink2 });
  d.pulse(286, 240, { at: [0.64, 0.8], r1: 20 });
  d.during([0.64, 0.98], (g) => g.hand(320, 274, 'hit, origin untouched', { size: 16 }));
  d.during([0, 0.5], (g) => g.text(178, 196, 'first request', { cls: 'sm' }));
  d.during([0.5, 1], (g) => g.text(178, 196, 'later request', { cls: 'sm' }));
  d.travel([[266, 160], [92, 160]], { at: [0.68, 0.8], token: 'packet', fill: C.paper, color: C.ink2 });
  d.hand(320, 302, 'the first response creates reusable state', { size: 15 });
  return d.svg();
}
export function sd_cdn_load() {
  const d = illustration('sd_cdn_load', '95% HITS: 950/S SERVED AT THE EDGE, 50/S TO ORIGIN; VIEWERS STILL GET 2,000,000 B/S', 320);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) d.phone(30 + c * 26, 60 + r * 46, 36, { stroke: C.gray });
  d.text(80, 256, '1,000 req/s', { cls: 'xs' });
  pipe(d, 140, 270, 140, 40); d.flowline([[144, 140], [266, 140]], { sw: 2.4 }); d.mono(205, 112, '2,000,000 B/s', { size: 9.5 });
  edge(d, 280, 110, true, 'edge'); d.mono(302, 196, '950 hits/s', { size: 10, color: C.acc });
  pipe(d, 330, 470, 140, 4); d.mono(400, 122, '50/s · 100,000 B/s', { size: 9.5 });
  d.db(480, 100, 110, 90, { label: 'origin' });
  d.text(320, 290, 'origin load falls 20×; delivery to viewers does not', { cls: 'sm' });
  return d.svg();
}
export function sd_cdn_key() {
  const d = illustration('sd_cdn_key', '2 ENCODINGS × 3 LANGUAGES = 6 CACHE VARIANTS OF ONE PATH', 320);
  chip(d, 220, 50, 200, '/clips/c7/captions', true, 28);
  const enc = ['gzip', 'br'], lang = ['en', 'hi', 'es'];
  enc.forEach((e, i) => lang.forEach((l, j) => { const x = 60 + (i * 3 + j) * 88; d.line(320, 82, x + 36, 150, { stroke: C.line, single: true }); d.doc(x + 10, 156, 52, 64, { lines: false }); d.mono(x + 36, 182, e, { size: 9 }); d.mono(x + 36, 200, l, { size: 9 }); }));
  d.text(320, 256, 'include only what changes the bytes; a tracking parameter would split every one', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_ttl() {
  const d = illustration('sd_cdn_ttl', 'STORED ASKS "ARE THE BYTES HERE?"; FRESH ASKS "MAY THIS REQUEST USE THEM?"', 300);
  panel(d, 20, 44, 292, 200, 'retention');
  d.disk(166, 120, 70); d.during([0.5, 1], (g) => cross(g, 166, 120, 22));
  d.text(166, 200, 'eviction can remove bytes early', { cls: 'xs' });
  panel(d, 328, 44, 292, 200, 'freshness', true);
  d.clock(474, 120, 70, { spin: 6 });
  d.text(474, 200, 'age vs lifetime decides reuse', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_cdn_age() {
const d=illustration('sd_cdn_age','A CACHED RESPONSE INHERITS AGE; ARRIVAL DOES NOT RESET ITS CLOCK',300);
  const x=t=>51+t/360*534;
  d.rect(x(0),97,x(300)-x(0),48,{r:0,fill:C.card,stroke:C.ink2});d.rect(x(300),97,x(360)-x(300),48,{r:0,fill:C.accSoft,stroke:C.acc});
  [0,120,300,360].forEach(t=>{d.line(x(t),151,x(t),162,{stroke:C.ink2,single:true});d.mono(x(t),182,`${t} s`,{size:11});});
  d.text(x(120),70,'arrives already 120 s old',{cls:'ttl'});d.arrow(x(120),83,x(120),94,{stroke:C.ink2});
  d.brace(x(120),x(360),217,{label:'240 s residence → 360 s current age'});
  d.text(x(330),122,'stale',{cls:'sm',color:C.acc});d.mono(320,268,'300 s lifetime − 120 s initial age = 180 s initially fresh',{size:11});return d.svg();
}
export function sd_cdn_directives() {
  const d = illustration('sd_cdn_directives', 'FOUR DIRECTIVES, FOUR DIFFERENT RULES ABOUT STORING AND REUSING', 320);
  const r = [['max-age=60', 'browser may reuse for 60 s', 'phone'], ['s-maxage=300', 'shared caches may reuse for 300 s', 'edge'], ['no-cache', 'may store; must validate first', 'check'], ['no-store', 'must not store at all', 'none']];
  r.forEach(([dir, t, k], i) => {
    const y = 52 + i * 62, hot = i === 3;
    chip(d, 30, y, 150, dir, hot, 32);
    if (k === 'phone') d.phone(210, y - 4, 40); if (k === 'edge') edge(d, 200, y - 8); if (k === 'check') d.clock(222, y + 16, 30); if (k === 'none') { d.disk(222, y + 16, 34); cross(d, 222, y + 16, 12); }
    d.text(270, y + 16, t, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  return d.svg();
}
export function sd_cdn_revalidate() {
  const d = illustration('sd_cdn_revalidate', 'EXPIRED BUT UNCHANGED: A 304 LETS THE EDGE REUSE THE BODY IT ALREADY HOLDS', 320);
  d.phone(40, 80, 70, { label: 'viewer' }); edge(d, 290, 80, true, 'edge'); d.db(500, 76, 100, 80, { label: 'origin' });
  d.arrow(80, 100, 284, 100, { stroke: C.ink2 }); d.mono(180, 88, 'GET (expired copy)', { size: 9 });
  d.arrow(340, 96, 494, 96, { stroke: C.ink2 }); d.mono(416, 84, 'If-None-Match: "v12"', { size: 9 });
  d.arrow(494, 130, 340, 130, { stroke: C.acc }); d.mono(416, 144, '304 Not Modified', { size: 9, color: C.acc });
  d.arrow(284, 140, 80, 140, { stroke: C.acc }); d.mono(180, 154, 'retained body', { size: 9, color: C.acc });
  d.travel([[340, 96], [494, 96], [494, 130], [340, 130]], { dur: 3, r: 3 });
  d.text(320, 230, 'only headers cross the origin link; the full body does not', { cls: 'sm' });
  return d.svg();
}
export function sd_cdn_stale() {
  const d = illustration('sd_cdn_stale', 'LIFETIME 300 S + 30 S STALE-IF-ERROR: AGE 320 MAY BE SERVED, AGE 340 MAY NOT', 280);
  const X = 60, W = 520, s = W / 360;
  d.rect(X, 90, 300 * s, 34, { r: 0, fill: C.card, stroke: C.ink2 }); d.text(X + 150 * s, 107, 'fresh', { cls: 'xs' });
  d.rect(X + 300 * s, 90, 30 * s, 34, { r: 0, fill: C.accSoft, stroke: C.acc }); d.text(X + 315 * s, 80, '+30', { cls: 'xs', color: C.acc });
  ruler(d, X, 136, W, 360, 60, ' s');
  [[320, true], [340, false]].forEach(([a, ok]) => { d.pin(X + a * s, 88, { fill: ok ? C.accSoft : C.card, stroke: ok ? C.acc : C.ink }); d.text(X + a * s, 190, `age ${a}`, { cls: 'xs' }); if (ok) tick(d, X + a * s, 210, 6); else cross(d, X + a * s, 210, 6, C.ink2); });
  d.text(320, 250, 'permission and deletion still apply inside the window', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_invalidate() {
const d=illustration('sd_cdn_invalidate','INVALIDATION TRAVELS TO COPIES THAT MAY STILL BE SERVING',360);
  const m=world(d,31,49,577,234,{graticule:false}),origin=m.at('virginia');
  [['london','applied',false],['mumbai','pending',true],['sydney','applied',false]].forEach(([city,state,hot])=>{const p=mapSite(d,m,city,state,{hot,dy:30});d.path(arc(origin,p,.12),{stroke:hot?C.acc:C.line,single:true,dash:[4,4]});});
  d.doc(origin[0]-14,origin[1]-20,28,39,{lines:false});d.text(origin[0]-24,origin[1]+13,'purge key',{cls:'sm',a:'end'});
  d.text(320,315,'request accepted ≠ every edge has applied it',{cls:'ttl'});d.text(320,338,'illustrative propagation state, not measured elapsed time',{cls:'sm'});return d.svg();
}
export function sd_cdn_version() {
  const d = illustration('sd_cdn_version', 'clip-c7-v2 IS A NEW KEY: NO PURGE NEEDED, BUT TWO 5 GB OBJECTS EXIST', 300);
  d.rect(60, 70, 160, 90, { r: 6, fill: C.card, stroke: C.ink2 }); d.mono(140, 115, 'clip-c7-v1', { size: 11 });
  d.rect(420, 70, 160, 90, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(500, 115, 'clip-c7-v2', { size: 11, color: C.acc });
  d.rect(250, 190, 140, 44, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(320, 212, 'app pointer', { cls: 'sm' });
  d.during([0, 0.5], (g) => g.arrow(290, 186, 170, 164, { stroke: C.ink2 }));
  d.during([0.5, 1], (g) => g.arrow(350, 186, 470, 164, { stroke: C.acc }));
  d.text(320, 270, '2 × 5,000,000,000 B = 10,000,000,000 B retained until v1 is cleaned up', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_revoke() {
  const d = illustration('sd_cdn_revoke', 'PURGING BYTES AND REVOKING ACCESS ARE DIFFERENT JOBS', 300);
  panel(d, 20, 44, 292, 210, 'content cleanup');
  d.db(60, 90, 70, 70); edge(d, 180, 96); cross(d, 95, 125, 14, C.ink2); cross(d, 202, 121, 14, C.ink2);
  d.text(166, 200, 'origin delete + cache purge', { cls: 'xs' });
  panel(d, 328, 44, 292, 210, 'access control', true);
  d.key(400, 120, 40); cross(d, 420, 120, 14);
  d.text(474, 200, 'stop issuing, expire or revoke', { cls: 'xs', color: C.acc });
  d.text(320, 280, 'a purge does not invalidate a signed URL; a revoked URL does not delete bytes', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_negative() {
  const d = illustration('sd_cdn_negative', 'ANNOUNCE THE CLIP TOO EARLY AND THE EDGE CACHES A 404 FOR IT', 300);
  const st = [['link announced', 'object not ready'], ['viewer asks', 'origin says 404'], ['edge caches 404', 'for its TTL'], ['object arrives', 'edge still says 404']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 3;
    d.rect(x, 80, 120, 70, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 104, a, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); d.text(x + 60, 126, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 124, 115, x + 146, 115, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 210, 'publish verified media first, then the reference', { cls: 'sm' });
  return d.svg();
}
export function sd_cdn_pull() {
  const d = illustration('sd_cdn_pull', 'PULL: ONLY THE 2 SITES THAT WERE ASKED HOLD COPIES (10 MB, NOT 20 MB)', 340);
  const m = world(d, 20, 40, 600, 230, { graticule: false });
  const o = m.at('virginia'); d.db(o[0] - 14, o[1] - 18, 28, 36, { stroke: C.acc, fill: C.accSoft });
  [['london', true], ['mumbai', true], ['tokyo', false], ['saopaulo', false]].forEach(([c, asked]) => { const p = mapSite(d, m, c, '', { hot: asked }); if (asked) { d.path(arc(o, p, 0.2), { stroke: C.acc, single: true }); d.travel(arc(o, p, 0.2), { dur: 3, r: 3 }); } });
  d.text(320, 300, '5,000,000 B object × 2 requested sites = 10,000,000 B; all 4 would be 20,000,000 B', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_push() {
  const d = illustration('sd_cdn_push', 'PREWARM THE SEGMENTS THE MATCH WILL ACTUALLY REQUEST, WHERE IT WILL REQUEST THEM', 300);
  const st = [['verified content', ''], ['choose segments\nand sites', ''], ['warm and confirm\nplacement', 'hot'], ['viewers arrive', '']];
  st.forEach(([s, h], i) => {
    const x = 30 + i * 150, hot = !!h;
    if (i === 0) d.db(x + 30, 60, 60, 66); if (i === 1) d.tape(x + 14, 80, ['s1', 's2', 's3'], { cw: 30, h: 26 }); if (i === 2) edge(d, x + 38, 64, true); if (i === 3) for (let k = 0; k < 6; k++) d.phone(x + 16 + (k % 3) * 30, 62 + Math.floor(k / 3) * 32, 28, { stroke: C.gray });
    d.text(x + 60, 156, s, { cls: 'xs', vc: true, color: hot ? C.acc : undefined });
    if (i < 3) d.arrow(x + 112, 96, x + 146, 96, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 236, 'routing decides where a warm-up request lands; check, do not assume', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_collapse() {
  const d = illustration('sd_cdn_collapse', '500 VIEWERS AT ONE EDGE ASK FOR THE SAME COLD SEGMENT; ONE FETCH SERVES THEM ALL', 320);
  for (let i = 0; i < 25; i++) d.phone(30 + (i % 5) * 26, 60 + Math.floor(i / 5) * 40, 32, { stroke: C.gray });
  d.text(90, 270, '500 per edge (each = 20)', { cls: 'xs' });
  edge(d, 250, 120, true, 'edge');
  for (let i = 0; i < 5; i++) d.travel([[160, 80 + i * 40], [246, 145]], { dur: 2, at: [i / 6, i / 6 + 0.4], r: 2.5, color: C.ink2 });
  d.arrow(300, 145, 470, 145, { stroke: C.acc, sw: 1.8 }); d.mono(385, 130, '1 fetch', { size: 10, color: C.acc });
  d.db(480, 100, 100, 90, { label: 'origin' });
  d.text(320, 300, '100 edges: 50,000 naive fetches become 100, a 500× reduction', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_inflight() {
  const d = illustration('sd_cdn_inflight', 'THE FIRST MISS OWNS THE FETCH; LATER REQUESTS WAIT ON IT, WITH A BOUND', 300);
  chip(d, 40, 80, 120, 'key: seg-41', false, 28); d.text(100, 126, 'empty', { cls: 'xs' });
  d.person(230, 70, 30); d.text(230, 120, 'owner', { cls: 'xs', color: C.acc });
  d.arrow(250, 90, 440, 90, { stroke: C.acc }); d.db(450, 60, 100, 70, { label: 'origin' });
  for (let k = 0; k < 6; k++) d.person(200 + k * 26, 160, 22, { stroke: C.gray });
  d.text(270, 210, 'waiters (cap the count and the wait)', { cls: 'xs' });
  d.carrow([[500, 136], [420, 200], [360, 176]], { stroke: C.acc, hl: 6 }); d.text(470, 214, 'retain + hand out', { cls: 'xs' });
  d.travel([[250, 90], [440, 90]], { dur: 3, r: 3 });
  return d.svg();
}
export function sd_cdn_shield() {
const d=illustration('sd_cdn_shield','AN ORIGIN SHIELD COLLAPSES IDENTICAL EDGE MISSES',350);
  [62,160,258].forEach((y,i)=>{d.server(40,y,69,54,{unit:16,label:`edge ${String.fromCharCode(65+i)}`});d.arrow(117,y+27,270,162,{stroke:C.line,hl:5});});
  d.server(280,117,102,94,{fill:C.accSoft,stroke:C.acc,label:'shared shield',unit:22});figPage(d,304,229,58,57,'key',true);
  d.db(498,112,97,103,{under:'origin'});d.arrow(390,162,490,162,{stroke:C.acc});d.text(442,142,'one fetch',{cls:'sm',color:C.acc});
  d.arrow(490,205,390,205,{stroke:C.ink2});d.text(442,224,'reusable bytes',{cls:'sm'});
  d.text(320,327,'collapse requires the same cache identity and permitted reuse',{cls:'sm'});return d.svg();
}
export function sd_cdn_shieldcount() {
  const d = illustration('sd_cdn_shieldcount', 'ONE 6 S SEGMENT: 8,333.333/S VIEWER REQUESTS, 16.666/S EDGE FETCHES, 0.166666/S AT ORIGIN', 320);
  const layers = [['viewers', '50,000 ÷ 6', '8,333.333/s', 9], ['100 edges', '100 ÷ 6', '16.666/s', 5], ['shield', '1 ÷ 6', '0.166666/s', 1]];
  layers.forEach(([s, f, r, nIcons], i) => {
    const y = 60 + i * 80, hot = i === 2;
    d.text(40, y + 20, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    for (let k = 0; k < nIcons; k++) { if (i === 0) d.phone(160 + k * 26, y, 34, { stroke: C.gray }); else edge(d, 160 + k * 56, y - 6, hot); }
    d.mono(520, y + 12, f, { size: 9.5 }); d.mono(520, y + 30, r, { size: 10.5, color: hot ? C.acc : undefined });
  });
  d.text(320, 300, 'ideal: one rendition, synchronized, no retries or variants', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_capabilities() {
const d=illustration('sd_cdn_capabilities','UPLOAD AND PLAYBACK CREDENTIALS OPEN DIFFERENT OPERATIONS',345);
  [55,368].forEach((x,i)=>{d.doc(x,62,206,71,{lines:false,fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2});d.mono(x+103,89,i?'playback capability':'upload capability',{size:11});d.mono(x+103,115,i?'permitted GET':'reserved write',{size:10});d.key(x+57,166,55,{stroke:i?C.acc:C.ink2});});
  d.db(103,234,103,77,{label:'object storage',size:10});d.server(418,234,103,77,{label:'serving edge',unit:22});
  d.arrow(156,196,156,226,{stroke:C.ink2});d.arrow(470,196,470,226,{stroke:C.acc});return d.svg();
}
export function sd_cdn_privatehit() {
  const d = illustration('sd_cdn_privatehit', 'A PRIVATE CLIP CAN BE A CACHE HIT, AND THE EDGE STILL CHECKS THE VIEWER FIRST', 300);
  const st = [['signed request', 'viewer capability'], ['validate', 'signature, expiry'], ['lookup', 'clip c7 v1'], ['return', 'permitted bytes']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 1;
    if (i === 0) d.key(x + 40, 92, 40); if (i === 1) d.lock(x + 44, 64, 34, { stroke: C.acc, fill: C.accSoft }); if (i === 2) edge(d, x + 38, 62); if (i === 3) d.phone(x + 46, 60, 56);
    d.text(x + 60, 150, a, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 170, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 112, 92, x + 146, 92, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 236, 'leave the signature out of the cache key, or every viewer misses', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_twoidentities() {
  const d = illustration('sd_cdn_twoidentities', 'THE CONTENT ID PICKS THE BYTES; THE ACCESS ID DECIDES WHO GETS THEM', 300);
  d.rect(60, 70, 220, 90, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(170, 92, 'content identity', { cls: 'ttl', size: 12 }); d.mono(170, 122, 'clip c7 version v1', { size: 10 });
  d.rect(360, 70, 220, 90, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(470, 92, 'access identity', { cls: 'ttl', size: 12, color: C.acc }); d.mono(470, 122, 'viewer policy + expiry', { size: 10 });
  d.text(320, 210, 'same bytes reused across viewers, only after each one is validated', { cls: 'sm' });
  return d.svg();
}
export function sd_cdn_bypass() {
  const d = illustration('sd_cdn_bypass', 'A SIGNED-URL CDN MEANS NOTHING IF THE ORIGIN BUCKET IS PUBLIC', 300);
  d.phone(40, 100, 70);
  edge(d, 270, 70, false, 'CDN checks');
  d.db(500, 100, 100, 90, { label: 'origin' });
  d.arrow(80, 110, 264, 96, { stroke: C.ink2 }); d.arrow(320, 96, 494, 130, { stroke: C.ink2 });
  d.carrow([[80, 150], [290, 230], [494, 160]], { stroke: C.acc }); d.text(290, 250, 'direct, unchecked', { cls: 'sm', color: C.acc });
  d.travel('M80,150 Q290,230 494,160', { dur: 3, r: 3.5 });
  d.text(320, 286, 'restrict the origin to the CDN; protect every path to the same bytes', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_expirypermission() {
  const d = illustration('sd_cdn_expirypermission', 'A 300 S CAPABILITY AND THE CACHED BYTES\' AGE RUN ON SEPARATE CLOCKS', 300);
  const X = 60, W = 520;
  d.text(X, 80, 'capability (illustrative 300 s)', { cls: 'xs', a: 'start' });
  d.rect(X, 90, W * 0.5, 26, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.text(X, 140, 'cached representation age', { cls: 'xs', a: 'start' });
  d.rect(X + 80, 150, W * 0.7, 26, { r: 2, fill: C.card, stroke: C.ink2 });
  d.line(X + W * 0.55, 80, X + W * 0.55, 190, { stroke: C.acc, dash: [4, 3], single: true }); d.text(X + W * 0.55, 204, 'expired access: deny, even on a fresh hit', { cls: 'xs', color: C.acc });
  d.text(320, 250, 'valid access does not make stale content fresh either', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_dnsgeo() {
const d=illustration('sd_cdn_dnsgeo','DNS SELECTS AN ADDRESS USING THE INFORMATION AVAILABLE TO THE RESOLVER',405);
  const m=world(d,33,59,574,251,{graticule:false});
  const viewer=m.at('mumbai'),resolver=m.at('london'),edge=m.at('singapore');
  d.phone(viewer[0]-8,viewer[1]-15,35);d.text(viewer[0]-22,viewer[1]+36,'viewer',{cls:'sm',a:'end'});
  mapSite(d,m,'london','resolver',{dy:-33});mapSite(d,m,'singapore','selected edge',{hot:true,dx:53,dy:28});
  d.path(arc(viewer,resolver,.16),{stroke:C.ink2,single:true,dash:[3,4]});d.path(arc(viewer,edge,-.65),{stroke:C.acc,single:true,sw:1.4});
  d.text(152,327,'DNS decision',{cls:'ttl'});d.text(152,349,'resolver vantage + health + policy',{cls:'sm'});
  d.text(470,327,'subsequent connection',{cls:'ttl',color:C.acc});d.text(470,349,'viewer connects to the returned address',{cls:'sm'});
  d.hand(320,383,'a cached DNS answer can outlive a routing change',{size:17});return d.svg();
}
export function sd_cdn_anycast() {
const d=illustration('sd_cdn_anycast','THE SAME ADVERTISED ADDRESS CAN LEAD TO DIFFERENT SERVING SITES',414);
  const m=world(d,30,61,579,253,{graticule:false});
  const a=mapSite(d,m,'london','site A',{hot:true,dy:-34}),b=mapSite(d,m,'mumbai','site B',{hot:true,dy:31}),c=mapSite(d,m,'sydney','site C',{hot:true,dy:30});
  const sources=[m.at('virginia'),m.at('tokyo'),m.at('saopaulo')];
  sources.forEach((p,i)=>{d.phone(p[0]-7,p[1]-12,30);d.path(arc(p,[a,b,c][i],.14),{stroke:C.acc,single:true});});
  d.mono(320,336,'A, B and C advertise one service address',{size:13});
  d.text(320,363,'network routing policy selects the reachable site',{cls:'sm'});
  d.text(320,392,'connection state still belongs to the site that accepted it',{cls:'sm'});return d.svg();
}
export function sd_cdn_coldroute() {
  const d = illustration('sd_cdn_coldroute', 'TRAFFIC SHIFTS TO A COLD EDGE: ORIGIN GOES FROM 50/S TO 1,000/S, 20×', 340);
  const m = world(d, 20, 40, 600, 230, { graticule: false });
  const o = m.at('virginia'); d.db(o[0] - 14, o[1] - 18, 28, 36, { stroke: C.acc, fill: C.accSoft });
  const a = mapSite(d, m, 'frankfurt', 'warm (down)', { dy: -26 }); cross(d, a[0], a[1], 10, C.ink2);
  const b = mapSite(d, m, 'london', 'cold', { hot: true, dy: 28 });
  d.path(arc(o, b, 0.25), { stroke: C.acc, sw: 2.4, single: true });
  for (let k = 0; k < 4; k++) d.travel(arc(b, o, -0.25), { dur: 2, at: [k / 4, k / 4 + 0.5], r: 2.5 });
  d.text(320, 300, 'warm 95% hits: 50/s · cold: all 1,000/s miss until it fills', { cls: 'sm' });
  d.text(320, 322, 'collapse, a shield and admission bounds protect the origin', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_latency() {
  const d = illustration('sd_cdn_latency', '90% HITS AT 20 MS + 10% MISSES AT 200 MS = 38 MS MEAN, AND SAYS NOTHING ABOUT P99', 300);
  for (let i = 0; i < 100; i++) d.fillRect(40 + (i % 20) * 14, 60 + Math.floor(i / 20) * 14, 11, 11, i < 90 ? C.card : C.accSoft, 1, 2);
  d.text(180, 144, 'each square = 1%', { cls: 'xs' });
  d.mono(460, 80, '0.9 × 20 = 18', { size: 11 }); d.mono(460, 104, '0.1 × 200 = 20', { size: 11, color: C.acc });
  d.line(400, 118, 520, 118, { stroke: C.ink2, single: true }); d.mono(460, 134, 'mean 38 ms', { size: 12 });
  d.text(320, 220, 'the tail sits in the misses; you need the distribution to state it', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_video() {
const d=illustration('sd_cdn_video','A VIDEO STREAM IS A SEQUENCE OF CACHEABLE SEGMENTS',335);
  d.rect(41,59,202,154,{r:3,fill:C.card,stroke:C.ink2});d.rect(52,72,180,111,{r:1,fill:C.paper,stroke:C.line});
  d.poly([[123,102],[123,156],[164,129]],{fill:C.accSoft,stroke:C.acc});d.line(61,197,221,197,{stroke:C.line,single:true});d.line(61,197,137,197,{stroke:C.acc,single:true,sw:3});
  d.text(140,240,'one viewer: 4,000,000 bit/s',{cls:'sm'});
  d.doc(332,52,232,54,{lines:false});d.mono(448,80,'manifest: ordered segment keys',{size:10});
  ['seg A','seg B','seg C'].forEach((s,i)=>{figPage(d,332+i*81,141,64,70,s,i===0);});
  d.arrow(328,181,251,138,{stroke:C.acc});d.text(449,240,'6 s × 500,000 B/s',{cls:'mono'});d.text(449,264,'= 3,000,000 B per segment',{cls:'mono'});
  d.text(320,312,'50,000 viewers × 500,000 B/s = 25,000,000,000 B/s',{cls:'mono',size:11});return d.svg();
}
export function sd_cdn_bytehit() {
  const d = illustration('sd_cdn_bytehit', '90 OF 100 REQUESTS HIT, BUT ONLY 1.768% OF THE BYTES DO', 320);
  for (let i = 0; i < 100; i++) d.fillRect(40 + (i % 20) * 12, 60 + Math.floor(i / 20) * 12, 9, 9, i < 90 ? C.accSoft : C.card, 1, 2);
  d.text(160, 136, 'requests: 90% hits', { cls: 'xs', color: C.acc });
  const X = 330, W = 270, total = 10180000, s = W / total;
  d.rect(X, 64, W, 50, { r: 2, fill: C.card, stroke: C.ink2 }); d.fillRect(X + 1, 65, 180000 * s, 48, C.accSoft);
  d.text(X + W / 2, 140, 'bytes: 180,000 of 10,180,000', { cls: 'xs' });
  d.mono(320, 200, '90 × 2,000 B small hits · 10 × 1,000,000 B large misses', { size: 10 });
  d.text(320, 240, 'size the origin link with byte hits, not request hits', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_cdn_ranges() {
  const d = illustration('sd_cdn_ranges', 'THE VIEWER ASKED FOR 1,000,000 B; WHAT THE EDGE FETCHES FROM ORIGIN IS PRODUCT-SPECIFIC', 300);
  const X = 40, W = 560;
  d.rect(X, 80, W, 34, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + W / 2, 66, '5,000,000,000 B immutable source', { cls: 'xs' });
  d.rect(X + 220, 80, 3, 34, { r: 0, fill: C.acc, stroke: C.acc }); d.text(X + 221, 130, '1 MB (0.02%)', { cls: 'xs', color: C.acc });
  d.rect(X + 180, 160, 80, 30, { r: 2, fill: C.paper, stroke: C.gray, dash: [3, 3] }); d.text(X + 220, 204, 'origin fetch: measure it', { cls: 'xs' });
  d.text(320, 250, 'a stable versioned key keeps all ranges on the same bytes', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_transform() {
const d=illustration('sd_cdn_transform','TRANSFORMED REPRESENTATIONS NEED DISTINCT CACHE IDENTITIES',320);
  figPage(d,48,91,103,126,'original');
  [['small','width'],['large','width'],['encoded','format']].forEach(([s,t],i)=>{const x=260+i*120;d.rect(x,100,92,76,{r:2,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});d.poly([[x+12,159],[x+36,128],[x+59,148],[x+77,118],[x+82,159]],{stroke:C.line,single:true});d.text(x+46,201,s,{cls:'ttl'});d.text(x+46,227,t,{cls:'sm'});d.arrow(158,151,x-7,139,{stroke:C.line,hl:5});});
  d.text(320,285,'version + transformation parameters define representation identity',{cls:'sm'});return d.svg();
}
export function sd_cdn_livecomparison() {
  const d = illustration('sd_cdn_livecomparison', 'SCORES: 200,000,000 B/S TO 50,000 VIEWERS. VIDEO: 25,000,000,000 B/S. DIFFERENT WORKLOADS', 320);
  panel(d, 20, 44, 292, 230, 'score events');
  d.envelope(60, 90, 40, 26); d.mono(80, 130, '200 B', { size: 9 });
  d.mono(166, 180, '20 × 50,000 × 200 B', { size: 10 }); d.mono(166, 200, '200,000,000 B/s', { size: 11 });
  panel(d, 328, 44, 292, 230, 'video rendition', true);
  d.tape(360, 86, ['seg', 'seg', 'seg', 'seg'], { cw: 48, h: 30, hot: () => true });
  d.mono(474, 180, '4,000,000 bit/s × 50,000 ÷ 8', { size: 10 }); d.mono(474, 200, '25,000,000,000 B/s', { size: 11, color: C.acc });
  d.text(320, 300, 'never size one path with the other\'s payload or rate', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_playback() {
  const d = illustration('sd_cdn_playback', 'PLAYBACK: APP GRANTS AND POINTS, EDGE CHECKS AND SERVES, ORIGIN STAYS LOCKED', 300);
  const st = [['app', 'permission + pointer'], ['edge', 'access check'], ['cache or shield', 'reuse'], ['restricted origin', 'verified bytes']];
  st.forEach(([a, b], i) => {
    const x = 30 + i * 150, hot = i === 1;
    if (i === 0) d.server(x + 34, 60, 52, 60, { unit: 14 }); if (i === 1) edge(d, x + 38, 62, true); if (i === 2) d.disk(x + 60, 92, 50); if (i === 3) { d.db(x + 34, 62, 52, 56); d.lock(x + 52, 46, 18); }
    d.text(x + 60, 146, a, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 166, b, { cls: 'xs' });
    if (i < 3) d.arrow(x + 106, 92, x + 146, 92, { stroke: C.gray, hl: 5 });
  });
  d.travel([[90, 92], [540, 92]], { dur: 5, r: 4 });
  return d.svg();
}
export function sd_cdn_playbacktrace() {
  const d = illustration('sd_cdn_playbacktrace', 'EVERY SIGNED REQUEST IS CHECKED AT THE EDGE, HIT OR MISS', 330);
  d.phone(40, 60, 70, { label: 'viewer' }); edge(d, 290, 60, true, 'edge'); d.db(500, 56, 100, 80, { label: 'origin' });
  const st = [[80, 284, 'signed GET c7-v1', 170, C.ink2], [340, 494, 'miss: authorized fetch', 196, C.ink2], [494, 340, 'immutable bytes', 222, C.ink2], [284, 80, 'permitted response', 248, C.ink2], [80, 284, 'next request: validated again', 286, C.acc]];
  st.forEach(([a, b, s, y, col], i) => { d.arrow(a, y, b, y, { stroke: col, hl: 6 }); d.mono((a + b) / 2, y - 9, s, { size: 9, color: col === C.acc ? C.acc : undefined }); d.travel([[a, y], [b, y]], { dur: 8, at: [i / 5, (i + 0.8) / 5], r: 3, color: col }); });
  return d.svg();
}
export function sd_cdn_failure() {
  const d = illustration('sd_cdn_failure', 'ORIGIN DOWN: SERVE ONLY IF ACCESS IS VALID AND THE COPY IS INSIDE ITS STALE WINDOW', 320);
  d.db(520, 70, 90, 80, { label: 'origin' }); cross(d, 565, 110, 18, C.ink2);
  edge(d, 380, 80, true);
  d.phone(40, 80, 70);
  d.arrow(80, 110, 374, 104, { stroke: C.ink2 });
  chip(d, 150, 160, 180, 'access valid?', false, 28); chip(d, 150, 196, 180, 'age ≤ 300 + 30?', true, 28);
  d.text(470, 200, 'age 320: serve\nage 340: refuse', { cls: 'sm', vc: true });
  d.text(320, 280, 'degradation keeps its declared bound and grants no new authority', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_reconcile() {
  const d = illustration('sd_cdn_reconcile', 'REQUESTS SHRINK LAYER BY LAYER; VIEWER BYTES STAY AT 25,000,000,000 B/S', 320);
  const L = [['viewers', '8,333.333/s', 180], ['edges', '16.666/s', 110], ['shield', '0.166666/s', 40]];
  L.forEach(([s, r, w], i) => { const y = 60 + i * 64; d.poly([[320 - w, y], [320 + w, y], [320 + w - 20, y + 44], [320 - w + 20, y + 44]], { fill: i === 2 ? C.accSoft : C.card, stroke: i === 2 ? C.acc : C.ink2 }); d.text(320, y + 16, s, { cls: 'ttl', size: 12 }); d.mono(320, y + 34, r, { size: 9.5 }); });
  d.text(320, 276, 'segment requests: 50,000 ÷ 6, then 100 ÷ 6, then 1 ÷ 6', { cls: 'xs' });
  d.text(320, 298, 'the bytes to viewers are unchanged by any of it', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_cdn_jobs() {
  const d = illustration('sd_cdn_jobs', 'FOUR BOXES, FOUR REASONS TO EXIST', 300);
  const r = [['app + metadata', 'permission, published id'], ['routing', 'choose a usable site'], ['edge + shield', 'reuse permitted copies'], ['origin', 'verified source bytes']];
  r.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    if (i === 0) d.server(x + 34, 60, 52, 60, { unit: 14 }); if (i === 1) d.router(x + 20, 96, 80); if (i === 2) edge(d, x + 38, 62, true); if (i === 3) d.db(x + 34, 62, 52, 56);
    d.text(x + 60, 146, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 166, t, { cls: 'xs' });
  });
  d.text(320, 230, 'a fresh copy cannot authorize; a valid signature cannot fix a missing object', { cls: 'xs' });
  return d.svg();
}
export function sd_cdn_boundaries() {
  const d = illustration('sd_cdn_boundaries', 'ONE REQUEST, FOUR CHECKS, FOUR COMMON MISTAKES', 320);
  const r = [['identity', 'right version + variant', 'mixed representations'], ['permission', 'valid viewer policy', 'public origin bypass'], ['freshness', 'age + directives', 'age reset at each layer'], ['capacity', 'warm and cold path', 'origin stampede']];
  r.forEach(([s, ok, bad], i) => {
    const x = 20 + i * 152, hot = i === 3;
    panel(d, x, 48, 140, 220, s, hot);
    tick(d, x + 70, 96, 7, C.ink2); d.text(x + 70, 124, ok, { cls: 'xs' });
    cross(d, x + 70, 170, 6, C.acc); d.text(x + 70, 198, bad, { cls: 'xs', color: C.acc });
  });
  return d.svg();
}

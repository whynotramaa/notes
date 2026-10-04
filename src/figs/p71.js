import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const bucket = (d, x, y, w, h, frac, hot = false) => { const lvl = y + h - h * frac; d.poly([[x + 4, lvl], [x + w - 4, lvl], [x + w - 8, y + h], [x + 8, y + h]], { fill: hot ? C.accSoft : C.card, stroke: 'none' }); d.path(`M${x},${y} L${x + 8},${y + h} L${x + w - 8},${y + h} L${x + w},${y}`, { stroke: hot ? C.acc : C.ink2, single: true, sw: 1.5 }); d.ellipse(x + w / 2, y, w, 12, { stroke: hot ? C.acc : C.ink2 }); };
const counter = (d, x, y, v, hot = false, w = 70) => { d.rect(x, y, w, 40, { r: 4, fill: C.ink, stroke: C.ink }); d.mono(x + w / 2, y + 20, v, { size: 16, color: hot ? C.acc : C.paper }); };
export function where_sd_rate_limiting(stage=99) { return systemMap("sd_rate_limiting", ["Rate limiting requirements", "Fixed window counter", "Sliding window log", "Sliding window counter", "Token bucket", "Leaky bucket", "Distributed limiting with Redis", "Case study: the complete limiter"], stage); }
export function cover_sd_rate_limiting() { return systemCover("sd_rate_limiting", 12, ["Rate", "limiting"], "Rate limiting", ["Rate limiting requirements", "Fixed window counter", "Sliding window log", "Sliding window counter", "Token bucket", "Leaky bucket", "Distributed limiting with Redis", "Case study: the complete limiter"]); }
export function sd_rate_limiting_contract() {
  const d = illustration('sd_rate_limiting_contract', '"100 PER MINUTE" CAN MEAN A MOVING 60 S WINDOW, OR A BUCKET REFILLING AT 100/60 PER SECOND', 320);
  panel(d, 20, 44, 292, 240, 'trailing-window limit');
  ruler(d, 50, 180, 230, 60, 15, ' s');
  d.rect(80, 120, 140, 40, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(150, 140, 'any 60 s: ≤ 100', { cls: 'xs' });
  d.shift(60, 0, (g) => g.rect(80, 116, 140, 48, { r: 4, stroke: C.ink2, dash: [4, 3] }), { dur: 5, back: true });
  panel(d, 328, 44, 292, 240, 'burst-capable rate', true);
  bucket(d, 420, 90, 110, 110, 0.6, true);
  d.travel([[475, 50], [475, 110]], { dur: 2, r: 4 });
  d.text(474, 228, 'refill 1.666666 tokens/s', { cls: 'xs' }); d.text(474, 246, 'capacity chosen separately', { cls: 'xs' });
  d.text(320, 306, 'pick the guarantee before the algorithm', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_identity() {
  const d = illustration('sd_rate_limiting_identity', 'THE LIMITER KEY IS BUILT FROM TRUSTED IDENTITY, NEVER FROM A FIELD THE CLIENT TYPED', 300);
  d.envelope(30, 90, 90, 56); d.mono(75, 162, 'X-User: anyone', { size: 9, color: C.gray });
  d.server(170, 80, 80, 80, { label: 'auth' }); d.key(190, 60, 30);
  d.arrow(126, 118, 164, 118, { stroke: C.ink2, hl: 6 });
  d.arrow(256, 118, 300, 118, { stroke: C.acc, hl: 6 });
  chip(d, 306, 104, 300, 'rl:tenant9:user41:upload:v3', true, 30);
  d.text(456, 160, 'tenant · user · operation · policy version', { cls: 'xs' });
  d.text(320, 230, 'a client-chosen key would mint itself a fresh allowance on every request', { cls: 'sm' });
  return d.svg();
}
export function sd_rate_limiting_dimensions() {
  const d = illustration('sd_rate_limiting_dimensions', 'RATE COUNTS ARRIVALS OVER TIME, CONCURRENCY COUNTS WORK IN FLIGHT, QUOTA COUNTS A TOTAL', 320);
  const p = [['rate', 'accepted cost over time'], ['concurrency', 'work in flight now'], ['quota', 'cumulative allocation']];
  p.forEach(([s, t], i) => {
    const x = 20 + i * 205;
    panel(d, x, 46, 190, 220, s, i === 1);
    if (i === 0) { bucket(d, x + 55, 90, 80, 80, 0.5); d.travel([[x + 95, 60], [x + 95, 100]], { dur: 1.6, r: 3 }); }
    if (i === 1) for (let k = 0; k < 4; k++) { d.rect(x + 30 + k * 34, 100, 28, 60, { r: 3, fill: k < 3 ? C.accSoft : C.paper, stroke: C.acc }); }
    if (i === 2) { d.rect(x + 40, 100, 110, 22, { r: 3, stroke: C.ink2 }); d.fillRect(x + 42, 102, 74, 18, C.card); d.mono(x + 95, 140, '6.4 of 10 GB', { size: 9 }); }
    d.text(x + 95, 210, t, { cls: 'xs' });
  });
  d.text(320, 300, 'admitted by the rate limiter does not mean a worker slot is free', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_boundary() {
  const d = illustration('sd_rate_limiting_boundary', 'A COARSE EDGE RULE BY IP, THEN AUTH, THEN THE USER POLICY, THEN THE WORK', 300);
  const st = [['edge rule', 'per IP, coarse'], ['authenticate', 'who is it?'], ['user admission', 'per user policy'], ['application', 'expensive effect']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    d.rect(x, 80, 120, 60, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(x + 60, 102, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined }); d.text(x + 60, 122, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 124, 110, x + 146, 110, { stroke: C.gray, hl: 5 });
  });
  for (let k = 0; k < 5; k++) d.travel([[20, 110], [90 + Math.min(k, 3) * 150, 110], [90 + Math.min(k, 3) * 150, 180]], { dur: 5, at: [k / 6, k / 6 + 0.4], r: 3, color: k > 2 ? C.acc : C.ink2 });
  d.text(320, 220, '1,000 checks/s × 3 ms limiter round trip = 3 calls in flight on average', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_fixed() {
  const d = illustration('sd_rate_limiting_fixed', 'A FIXED WINDOW KEYS THE COUNTER BY MINUTE; AT 60 S A FRESH KEY STARTS AT ZERO', 300);
  const X = 60, W = 520;
  ruler(d, X, 170, W, 120, 30, ' s');
  d.rect(X, 100, W / 2, 50, { r: 2, fill: C.card, stroke: C.ink2 }); d.mono(X + W / 4, 125, 'rl:u41:bucket0 = 100', { size: 10 });
  d.rect(X + W / 2, 100, W / 2, 50, { r: 2, fill: C.accFaint, stroke: C.acc }); d.mono(X + 3 * W / 4, 125, 'rl:u41:bucket1 = 0', { size: 10, color: C.acc });
  d.line(X + W / 2, 86, X + W / 2, 166, { stroke: C.acc, sw: 2, single: true }); d.text(X + W / 2, 76, 'reset', { cls: 'xs', color: C.acc });
  d.text(320, 230, 'bucket = floor(time ÷ 60); every gateway must use the same rule', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_boundaryburst() {
  const d = illustration('sd_rate_limiting_boundaryburst', '100 AT 59.9 S AND 100 AT 60.1 S: BOTH BUCKETS OBEY, YET 200 PASS IN 0.2 S', 300);
  const X = 60, W = 520, s = W / 120;
  d.rect(X, 120, 60 * s, 40, { r: 2, fill: C.paper, stroke: C.ink2 }); d.rect(X + 60 * s, 120, 60 * s, 40, { r: 2, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 20; i++) { d.line(X + 59.9 * s - i * 0.6, 120, X + 59.9 * s - i * 0.6, 160, { stroke: C.ink2, single: true, sw: 0.8 }); d.line(X + 60.1 * s + i * 0.6, 120, X + 60.1 * s + i * 0.6, 160, { stroke: C.acc, single: true, sw: 0.8 }); }
  ruler(d, X, 172, W, 120, 30, ' s');
  d.brace(X + 59 * s, X + 61 * s, 112, { dir: -1, label: '200 in 0.2 s = 1,000/s' });
  d.text(320, 240, 'fine for a fixed-window contract; a trailing-window promise is broken', { cls: 'sm' });
  return d.svg();
}
export function sd_rate_limiting_countsemantics() {
  const d = illustration('sd_rate_limiting_countsemantics', 'COUNT EVERY ATTEMPT, OR ONLY ADMITTED WORK: THE COUNTER MEANS DIFFERENT THINGS', 320);
  panel(d, 20, 44, 292, 240, 'count attempts');
  counter(d, 130, 90, '103');
  d.text(166, 150, 'INCR every request, reject if > 100', { cls: 'xs' });
  d.text(166, 176, 'rejected retries keep the count high', { cls: 'xs', color: C.ink2 });
  panel(d, 328, 44, 292, 240, 'count admissions', true);
  counter(d, 438, 90, '100', true);
  d.text(474, 150, 'check, then INCR only if allowed', { cls: 'xs' });
  d.text(474, 176, 'one atomic script', { cls: 'xs', color: C.acc });
  d.text(320, 306, 'write the choice into the policy', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_expiry() {
  const d = illustration('sd_rate_limiting_expiry', 'INCR, THEN CRASH BEFORE EXPIRE: THE KEY LIVES FOREVER', 300);
  d.server(40, 80, 80, 90, { label: 'gateway' }); d.db(300, 80, 100, 90, { label: 'Redis' }); d.server(520, 80, 80, 90, { label: 'next gateway' });
  d.arrow(126, 100, 294, 100, { stroke: C.ink2 }); d.mono(210, 88, '1 INCR rl:u41', { size: 9.5 });
  d.arrow(126, 140, 294, 140, { stroke: C.gray, dash: [4, 4] }); d.mono(210, 156, '2 EXPIRE (never sent)', { size: 9.5, color: C.gray });
  bolt(d, 150, 110, 0.7);
  d.arrow(514, 120, 406, 120, { stroke: C.acc }); d.text(460, 106, 'finds stale key', { cls: 'xs', color: C.acc });
  d.text(320, 230, 'fix: one Lua script does INCR and EXPIRE together', { cls: 'sm' });
  return d.svg();
}
export function sd_rate_limiting_log() {
  const d = illustration('sd_rate_limiting_log', 'A SLIDING LOG DROPS TIMESTAMPS ≤ t − T, COUNTS THE REST, ADMITS IF UNDER THE LIMIT', 300);
  const X = 40, W = 560, s = W / 90;
  d.arrow(X, 140, X + W, 140, { stroke: C.gray });
  [5, 12, 18, 31, 38, 44, 52, 60, 67, 75, 81, 86].forEach((t, i) => { const old = t <= 26; d.line(X + t * s, 124, X + t * s, 140, { stroke: old ? C.gray : C.ink, sw: 1.6, single: true }); if (old) cross(d, X + t * s, 116, 4, C.gray); });
  d.rect(X + 26 * s, 100, 60 * s, 52, { r: 4, stroke: C.acc, dash: [5, 4] });
  d.text(X + 56 * s, 90, 'window (t − 60, t]: 9 kept', { cls: 'xs', color: C.acc });
  d.line(X + 86 * s, 96, X + 86 * s, 160, { stroke: C.acc, sw: 2, single: true }); d.text(X + 86 * s, 174, 'now t', { cls: 'xs', color: C.acc });
  d.text(320, 230, 'illustrative timestamps; append only accepted events, each with a unique member', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_logtrace() {
const d=illustration('sd_rate_limiting_logtrace','THE LEFT ENDPOINT FALLS OUT OF THE MOVING WINDOW BEFORE ADMISSION',320);
  const X=t=>50+t/60*531;
  d.fillRect(X(0),87,531,66,C.accFaint);d.arrow(44,168,603,168,{stroke:C.ink2});
  [0,10,40,59,60].forEach(t=>{const hot=t===0||t===60;d.circle(X(t),120,17,{fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.ink2});d.mono(X(t),189,t,{size:10});});
  d.text(62,59,'remove t=0',{cls:'sm',color:C.acc});d.text(547,59,'admit t=60',{cls:'sm',color:C.acc});
  d.mono(320,235,'window at t = 60: (0, 60]',{size:13});d.mono(320,266,'retained 10, 40, 59 → append 60 → count 4',{size:11});return d.svg();
}
export function sd_rate_limiting_interval() {
  const d = illustration('sd_rate_limiting_interval', 'THIS CHAPTER USES (t − T, t]: AN EVENT EXACTLY AT t − T HAS EXPIRED', 260);
  const X = 100, W = 440;
  d.line(X, 120, X + W, 120, { stroke: C.ink2, sw: 2, single: true });
  d.circle(X, 120, 16, { fill: C.paper, stroke: C.ink2 }); d.text(X, 150, 't − T  excluded', { cls: 'sm' });
  d.circle(X + W, 120, 16, { fill: C.acc, stroke: C.acc }); d.text(X + W, 150, 't  included', { cls: 'sm', color: C.acc });
  d.text(320, 210, 'the cleanup code must use the same inequality: remove timestamp ≤ t − T', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_memory() {
  const d = illustration('sd_rate_limiting_memory', '100,000 USERS: A FULL LOG IS 240,000,000 B; A COUNTER IS 3,200,000 B', 300);
  const X = 60, W = 520, s = W / 240e6;
  d.text(X, 76, 'sliding log: 100,000 × 100 events × 24 B', { cls: 'sm', a: 'start' });
  d.rect(X, 88, 240e6 * s, 34, { r: 2, fill: C.card, stroke: C.ink2 }); d.mono(X + W / 2, 105, '240,000,000 B', { size: 11 });
  d.text(X, 156, 'counter: 100,000 × 32 B', { cls: 'sm', a: 'start', color: C.acc });
  d.rect(X, 168, Math.max(3, 3.2e6 * s), 34, { r: 1, fill: C.accSoft, stroke: C.acc }); d.mono(X + 20, 185, '3,200,000 B', { size: 11, a: 'start', color: C.acc });
  d.text(320, 246, 'simplified sizes, no allocator or replication overhead: measure before deploying', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_oldest() {
  const d = illustration('sd_rate_limiting_oldest', 'THE LOG IS FULL; THE OLDEST ENTRY PLUS 60 S IS THE EARLIEST POSSIBLE NEXT SLOT', 300);
  d.tape(60, 80, ['t=14', 't=19', '…', 't=71', 't=73'], { cw: 90, h: 32, hot: (i) => i === 0 });
  d.text(105, 130, 'oldest', { cls: 'xs', color: C.acc });
  d.mono(320, 170, 'Retry-After ≈ 14 + 60 − 73 = 1 s', { size: 11, color: C.acc });
  d.text(320, 206, 'advice, not a booking: another caller may take that slot first', { cls: 'sm' });
  d.text(320, 236, 'illustrative timestamps', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_counter() {
  const d = illustration('sd_rate_limiting_counter', 'THE SLIDING COUNTER WEIGHS THE PREVIOUS BUCKET BY HOW MUCH OF IT STILL OVERLAPS', 300);
  const X = 60, W = 520;
  d.rect(X, 110, W / 2, 50, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + W / 4, 135, 'previous: C_prev', { cls: 'sm' });
  d.rect(X + W / 2, 110, W / 2, 50, { r: 2, fill: C.accFaint, stroke: C.acc }); d.text(X + 3 * W / 4, 135, 'current: C_now', { cls: 'sm', color: C.acc });
  d.rect(X + W / 2 * 0.25, 100, W / 2, 70, { r: 4, stroke: C.ink, dash: [5, 4] });
  d.brace(X + W / 2 * 0.25, X + W / 2, 182, { label: 'overlap 1 − f' });
  d.mono(320, 240, 'Ĉ = C_now + (1 − f) × C_prev', { size: 12 });
  d.text(320, 270, 'assumes previous events were spread evenly', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_countertrace() {
  const d = illustration('sd_rate_limiting_countertrace', 'WITH 80 PREVIOUS AND 30 CURRENT: ESTIMATE 90 AT 15 S, 70 AT 30 S', 300);
  [[15, 0.75, 90], [30, 0.5, 70]].forEach(([t, w, est], i) => {
    const y = 70 + i * 100;
    d.text(50, y + 20, `${t} s in`, { cls: 'ttl', a: 'start' });
    d.mono(160, y + 20, `30 + 80 × ${w}`, { size: 11, a: 'start' });
    d.rect(340, y, est * 2.4, 40, { r: 2, fill: i ? C.accSoft : C.card, stroke: i ? C.acc : C.ink2 });
    d.mono(340 + est * 2.4 + 10, y + 20, `${est}`, { size: 14, a: 'start', color: i ? C.acc : undefined });
  });
  d.text(320, 270, 'the counts never changed; only the assumed overlap did', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_countererror() {
  const d = illustration('sd_rate_limiting_countererror', 'THE SAME 80 / 30 STATE CAN HIDE VERY DIFFERENT HISTORIES', 320);
  const hist = (x, late, title, sub, hot) => {
    panel(d, x, 44, 292, 240, title, hot);
    for (let i = 0; i < 16; i++) { const t = late ? 0.55 + i * 0.028 : 0.02 + i * 0.028; d.line(x + 20 + t * 125, 100, x + 20 + t * 125, 140, { stroke: C.ink2, single: true, sw: 0.9 }); }
    for (let i = 0; i < 6; i++) d.line(x + 150 + i * 18, 100, x + 150 + i * 18, 140, { stroke: C.acc, single: true, sw: 0.9 });
    d.line(x + 145, 90, x + 145, 150, { stroke: C.gray, dash: [3, 3], single: true });
    d.rect(x + 20 + 0.25 * 125, 94, 250 * 0.5 + 6, 52, { r: 3, stroke: C.ink, dash: [4, 3] });
    d.text(x + 146, 200, sub, { cls: 'xs', vc: true });
  };
  hist(20, true, 'previous events late', 'true count 110,\nestimate 90: undercount', true);
  hist(328, false, 'previous events early', 'most already expired,\nestimate 90: overcount', false);
  d.text(320, 306, 'illustrative placements; two counters cannot see where events fell', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_rollover() {
  const d = illustration('sd_rate_limiting_rollover', 'SAME BUCKET: COUNT. NEXT BUCKET: SHIFT. LONG GAP: CLEAR BOTH', 300);
  const r = [['same bucket', ['prev 80', 'now 30 → 31']], ['next bucket', ['prev 31', 'now 1']], ['idle 3 buckets', ['prev 0', 'now 1']]];
  r.forEach(([s, v], i) => {
    const y = 60 + i * 66, hot = i === 2;
    d.text(40, y + 16, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    v.forEach((t, k) => chip(d, 220 + k * 170, y + 2, 150, t, hot && k === 0, 28));
  });
  d.text(320, 270, 'store the bucket number with the count, or an old count looks current', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_token() {
const d=illustration('sd_rate_limiting_token','A TOKEN BUCKET SAVES BURST ALLOWANCE AND REFILLS AT A BOUNDED RATE',350);
  d.path('M116,90 L137,261 Q220,284 303,261 L324,90',{stroke:C.ink2,single:true,sw:1.6});d.ellipse(220,90,208,41,{stroke:C.ink2});
  for(let r=0;r<3;r++)for(let c=0;c<4;c++)d.circle(160+c*40,146+r*37,23,{fill:C.accSoft,stroke:C.acc});
  d.arrow(220,36,220,61,{stroke:C.acc});d.text(270,45,'refill rate r',{cls:'ttl',a:'start',color:C.acc});
  d.text(220,307,'balance never exceeds capacity B',{cls:'sm'});
  d.envelope(440,131,105,64);d.text(492,223,'request costs tokens',{cls:'ttl'});d.arrow(332,190,431,166,{stroke:C.acc});
  d.text(463,277,'enough: debit and admit',{cls:'sm'});d.text(463,300,'too few: preserve balance',{cls:'sm'});return d.svg();
}
export function sd_rate_limiting_tokentrace() {
  const d = illustration('sd_rate_limiting_tokentrace', 'A 100-TOKEN BUCKET: SPEND 80, WAIT 6 S (+10), SPEND 15, THEN COST 20 MUST WAIT 3 S', 320);
  const st = [['start', 100, ''], ['spend 80', 20, ''], ['wait 6 s', 30, '+10'], ['spend 15', 15, ''], ['cost 20?', 15, 'short 5']];
  st.forEach(([s, v, note], i) => {
    const x = 30 + i * 120, hot = i === 4;
    bucket(d, x + 15, 80, 90, 120, v / 100, hot);
    d.mono(x + 60, 222, `${v}`, { size: 13, color: hot ? C.acc : undefined });
    d.text(x + 60, 60, s, { cls: 'sm', color: hot ? C.acc : undefined });
    if (note) d.text(x + 60, 244, note, { cls: 'xs' });
  });
  d.text(320, 290, 'refill 100/60 tokens/s; every debit is serialized', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_tokenwait() {
  const d = illustration('sd_rate_limiting_tokenwait', 'NEED 20, HAVE 15: SHORT 5 TOKENS ÷ 1.666666/S = 3 S', 300);
  bucket(d, 60, 80, 120, 140, 0.15, false);
  d.mono(120, 240, '15 of 100', { size: 11 });
  d.rect(250, 100, 120, 40, { r: 4, fill: C.accSoft, stroke: C.acc }); d.mono(310, 120, 'cost 20', { size: 12, color: C.acc });
  d.mono(460, 120, '5 ÷ (100/60) = 3 s', { size: 12 });
  d.clock(460, 180, 40, { spin: 3 });
  d.text(320, 266, 'a rejection spends nothing; another caller may use the refill first', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_tokenbound() {
  const d = illustration('sd_rate_limiting_tokenbound', 'IN ANY 60 S A 100-TOKEN BUCKET CAN ADMIT UP TO 100 SAVED + 100 REFILLED = 200', 300);
  bucket(d, 60, 70, 120, 140, 1, true);
  d.mono(120, 232, 'saved: 100', { size: 11, color: C.acc });
  d.text(240, 140, '+', { size: 28 });
  for (let i = 0; i < 10; i++) d.travel([[340, 60], [340, 130]], { dur: 3, at: [i / 10, i / 10 + 0.3], r: 3 });
  d.mono(340, 232, 'refill: 100/60 × 60 = 100', { size: 11 });
  d.text(460, 140, '=', { size: 28 });
  d.mono(540, 140, '≤ 200', { size: 18, color: C.acc });
  d.text(320, 274, 'C(Δt) ≤ B + rΔt; not the same promise as "100 in any minute"', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_costs() {
  const d = illustration('sd_rate_limiting_costs', 'WEIGHTED COSTS 20 + 30 + 50 EMPTY THE 100-TOKEN BUCKET; THE NEXT COST-1 CALL IS REFUSED', 300);
  const X = 60, W = 400, s = W / 100;
  [[20, 'search'], [30, 'export'], [50, 'transcode']].reduce((t, [c, s2], i) => { d.rect(X + t * s, 100, c * s, 50, { r: 0, fill: C.card, stroke: C.ink2 }); d.text(X + (t + c / 2) * s, 125, `${s2} ${c}`, { cls: 'xs' }); return t + c; }, 0);
  d.rect(X + W + 10, 100, 30, 50, { r: 2, fill: C.accSoft, stroke: C.acc }); cross(d, X + W + 25, 125, 10);
  d.text(X + W + 25, 170, '+1 → 101', { cls: 'xs', color: C.acc });
  d.text(320, 230, 'cost belongs inside the atomic comparison, validated positive and in range', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_shape() {
const d=illustration('sd_rate_limiting_shape','SHAPING TURNS A BURST INTO PACED DEPARTURES',315);
  d.text(122,51,'bursty arrivals',{cls:'ttl'});[0,1,2,3,4].forEach(i=>d.envelope(42+i*33,92+(i%2)*9,28,22));
  d.arrow(222,120,272,120,{stroke:C.ink2});
  figShelf(d,280,88,['job','job','job'],{width:172,height:66,hot:0});d.text(365,179,'bounded queue',{cls:'sm'});
  d.clock(524,120,55);d.text(524,180,'paced release',{cls:'ttl'});
  d.arrow(40,261,602,261,{stroke:C.ink2});[81,181,281,381,481,581].forEach(x=>d.envelope(x-15,228,30,22));
  d.text(320,297,'acceptance and departure happen at different times',{cls:'sm'});return d.svg();
}
export function sd_rate_limiting_leaktrace() {
  const d = illustration('sd_rate_limiting_leaktrace', 'A LEAKY QUEUE WITH 20 AHEAD, RELEASING 100/60 PER SECOND: 12 S BEFORE WORK EVEN STARTS', 300);
  d.rect(60, 80, 300, 60, { r: 6, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 20; i++) d.envelope(68 + i * 14, 98, 12, 20, { fill: C.card });
  d.envelope(368, 98, 22, 20, { fill: C.accSoft, stroke: C.acc }); d.text(380, 70, 'you', { cls: 'xs', color: C.acc });
  d.travel([[60, 110], [20, 110]], { dur: 0.6, r: 3 });
  d.mono(320, 180, 'wait = 20 ÷ (100/60) = 12 s', { size: 12, color: C.acc });
  d.text(320, 216, 'processing time is extra; admitted can still mean late', { cls: 'sm' });
  return d.svg();
}
export function sd_rate_limiting_virtual() {
  const d = illustration('sd_rate_limiting_virtual', '30 UNITS OF RESERVED DEBT AT 100/60 PER SECOND = 18 S OF FUTURE SERVICE', 280);
  const X = 60, W = 520, s = W / 30;
  d.rect(X, 100, 18 * s, 40, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 9 * s, 120, 'debt 30 units = 18 s', { cls: 'sm', color: C.acc });
  d.line(X + 15 * s, 86, X + 15 * s, 154, { stroke: C.ink, dash: [4, 3], single: true }); d.text(X + 15 * s, 76, 'max delay 15 s (illustrative)', { cls: 'xs' });
  ruler(d, X, 160, W, 30, 5, ' s');
  d.text(320, 230, 'over the limit: reject the reservation; the state still needs one atomic owner', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_compare() {
  const d = illustration('sd_rate_limiting_compare', 'FOUR ALGORITHMS, FOUR DIFFERENT THINGS THEY PRESERVE', 320);
  const a = [['fixed / counter', 'cheap state', 'boundary burst or estimate'], ['sliding log', 'exact recent arrivals', 'memory per event'], ['token bucket', 'burst plus steady rate', 'saved allowance'], ['leaky shaping', 'paced output', 'callers wait']];
  a.forEach(([s, good, cost], i) => {
    const x = 20 + (i % 2) * 310, y = 46 + Math.floor(i / 2) * 130;
    panel(d, x, y, 290, 114, s, i === 2);
    if (i === 0) counter(d, x + 20, y + 40, '42', false, 60);
    if (i === 1) d.tape(x + 20, y + 46, ['', '', '', ''], { cw: 16, h: 24 });
    if (i === 2) bucket(d, x + 24, y + 36, 50, 54, 0.6, true);
    if (i === 3) { d.rect(x + 20, y + 50, 64, 20, { r: 3, stroke: C.ink2 }); d.dot(x + 92, y + 60, 3, C.ink2); }
    d.text(x + 110, y + 60, good, { cls: 'sm', a: 'start' });
    d.text(x + 110, y + 82, cost, { cls: 'xs', a: 'start' });
  });
  return d.svg();
}
export function sd_rate_limiting_race() {
  const d = illustration('sd_rate_limiting_race', 'A AND B BOTH READ 99, BOTH DECIDE "ALLOW", BOTH INCREMENT: 101 ADMITTED', 300);
  d.server(40, 70, 70, 80, { label: 'gateway A' }); d.server(530, 70, 70, 80, { label: 'gateway B' });
  counter(d, 285, 90, '99');
  d.during([0.6, 1], (g) => { g.rect(285, 90, 70, 40, { r: 4, fill: C.ink, stroke: C.ink }); g.mono(320, 110, '101', { size: 16, color: C.acc }); });
  d.arrow(116, 100, 278, 104, { stroke: C.ink2 }); d.arrow(524, 100, 362, 104, { stroke: C.ink2 });
  d.text(196, 90, 'GET → 99, allow', { cls: 'xs' }); d.text(444, 90, 'GET → 99, allow', { cls: 'xs' });
  d.text(196, 150, 'INCR', { cls: 'xs' }); d.text(444, 150, 'INCR', { cls: 'xs' });
  d.text(320, 220, 'atomic INCR cannot undo two "allow" decisions already made', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_rate_limiting_script() {
  const d = illustration('sd_rate_limiting_script', 'ONE LUA SCRIPT: READ, REFILL, CHECK, STORE, RETURN, WITH NOTHING IN BETWEEN', 300);
  d.rect(40, 70, 560, 90, { r: 10, fill: C.accFaint, stroke: C.acc });
  const st = ['read + validate', 'refill + cap', 'check cost', 'store + return'];
  st.forEach((s, i) => { chip(d, 60 + i * 135, 100, 120, s, i === 2, 30); if (i < 3) d.arrow(182 + i * 135, 115, 194 + i * 135, 115, { stroke: C.acc, hl: 4 }); });
  d.travel([[60, 115], [580, 115]], { dur: 3, r: 4 });
  d.text(320, 200, 'other commands wait while it runs, so keep it short', { cls: 'sm' });
  return d.svg();
}
export function sd_rate_limiting_atomiclimits() {
  const d = illustration('sd_rate_limiting_atomiclimits', 'THE SCRIPT IS ATOMIC ON ONE SERVER; A FAILOVER CAN STILL RESTORE AN OLDER BALANCE', 320);
  panel(d, 20, 44, 292, 230, 'on the serving Redis');
  d.db(120, 90, 90, 90); tick(d, 166, 210, 8, C.ink2);
  d.text(166, 240, 'no interleaving inside a script', { cls: 'xs' });
  panel(d, 328, 44, 292, 230, 'after failover', true);
  d.db(370, 90, 80, 80, { label: 'primary' }); bolt(d, 410, 72, 0.7);
  d.db(490, 90, 80, 80, { label: 'replica', fill: C.accSoft, stroke: C.acc });
  d.text(474, 210, 'replica lagged: some debits lost', { cls: 'xs', color: C.acc });
  d.text(474, 230, 'callers briefly get extra allowance', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_dimensionshared() {
  const d = illustration('sd_rate_limiting_dimensionshared', 'ONE REQUEST CAN NEED THREE BUDGETS: USER, TENANT AND ENDPOINT', 300);
  d.envelope(40, 110, 80, 50, { label: 'trusted request' });
  [['user budget', 60], ['tenant budget', 130], ['endpoint budget', 200]].forEach(([s, y], i) => { d.arrow(126, 135, 290, y + 20, { stroke: C.ink2, hl: 6 }); bucket(d, 300, y, 50, 40, [0.7, 0.2, 0.5][i], i === 1); d.text(370, y + 20, s, { cls: 'sm', a: 'start' }); });
  d.text(320, 272, 'if the tenant budget refuses after the user budget was debited, who refunds it?', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_hotkey() {
  const d = illustration('sd_rate_limiting_hotkey', 'USER KEYS SPREAD OVER SHARDS; THE ONE TENANT KEY STAYS ON ONE SHARD', 300);
  [0, 1, 2].forEach((i) => { d.db(60 + i * 110, 160, 70, 70); d.mono(95 + i * 110, 244, `user ${'ABC'[i]}`, { size: 9 }); });
  d.db(460, 150, 100, 90, { fill: C.accSoft, stroke: C.acc, label: 'tenant9' });
  for (let k = 0; k < 9; k++) d.travel([[95 + (k % 3) * 110, 60], [510, 150]], { dur: 2, at: [k / 9, k / 9 + 0.4], r: 2.5 });
  d.text(320, 278, 'every user check also touches the same tenant counter', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_fallback() {
  const d = illustration('sd_rate_limiting_fallback', 'REDIS DOWN: FOUR LOCAL 100s ADMIT 400; FOUR LOCAL 25s KEEP THE 100 TOTAL', 320);
  panel(d, 20, 44, 292, 230, '4 × 100 local');
  [0, 1, 2, 3].forEach((i) => { d.server(40 + i * 66, 90, 50, 60, { unit: 14 }); bucket(d, 44 + i * 66, 170, 42, 40, 1); });
  d.mono(166, 240, '400 allowed', { size: 11 });
  panel(d, 328, 44, 292, 230, '4 × 25 local', true);
  [0, 1, 2, 3].forEach((i) => { d.server(348 + i * 66, 90, 50, 60, { unit: 14 }); bucket(d, 352 + i * 66, 170, 42, 40, 0.25, true); });
  d.mono(474, 240, '100 allowed total', { size: 11, color: C.acc });
  d.text(320, 300, 'the split wastes unused local shares; either way, the fallback is a new policy', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_accepted() {
  const d = illustration('sd_rate_limiting_accepted', 'ONE ADMISSION DECISION, THEN THE WORK UNDER ITS OWN DEADLINE', 300);
  d.server(40, 80, 80, 90, { label: 'gateway' }); d.db(280, 80, 90, 90, { label: 'limiter' }); d.server(500, 80, 90, 90, { label: 'application' });
  d.arrow(126, 100, 274, 100, { stroke: C.ink2 }); d.mono(200, 88, 'subject + admission id', { size: 9 });
  d.arrow(274, 140, 126, 140, { stroke: C.acc }); d.mono(200, 154, 'allow, appended once', { size: 9, color: C.acc });
  d.carrow([[120, 180], [300, 230], [494, 150]], { stroke: C.ink2 }); d.text(310, 250, 'execute under deadline', { cls: 'xs' });
  d.travel([[126, 100], [274, 100], [274, 140], [126, 140]], { dur: 4, r: 3.5 });
  return d.svg();
}
export function sd_rate_limiting_reject() {
  const d = illustration('sd_rate_limiting_reject', 'HALF A TOKEN, COST ONE: 0.5 ÷ (100/60) = 0.3 S UNTIL A REFILL COULD COVER IT', 280);
  bucket(d, 60, 70, 110, 130, 0.005);
  d.mono(115, 220, '0.5 tokens', { size: 11 });
  d.envelope(230, 110, 90, 50, { label: '429 Too Many Requests' });
  d.mono(440, 120, 'Retry-After: 1', { size: 12, color: C.acc });
  d.text(440, 150, '0.3 s rounded up to whole seconds', { cls: 'xs' });
  d.text(320, 250, 'advice, not a reservation; clients still back off', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_tests() {
  const d = illustration('sd_rate_limiting_tests', 'TEST THE EDGES: LAST TOKEN, CLOCK ROLLBACK, EXACT CUTOFF, FAILOVER', 320);
  const t = [['last token', 'two callers race;\none allows, one rejects'], ['clock rollback', 'time goes backward;\nno free tokens'], ['window cutoff', 'event at t − T\nexpires, per the rule'], ['failover', 'recovered counter\nmay forget debits']];
  t.forEach(([s, how], i) => {
    const x = 20 + i * 152, hot = i === 3;
    panel(d, x, 48, 140, 220, s, hot);
    if (i === 0) bucket(d, x + 40, 90, 60, 60, 0.08);
    if (i === 1) d.clock(x + 70, 120, 56);
    if (i === 2) { d.line(x + 20, 120, x + 120, 120, { stroke: C.ink2, single: true }); d.circle(x + 40, 120, 12, { fill: C.paper }); d.circle(x + 100, 120, 12, { fill: C.acc }); }
    if (i === 3) { d.db(x + 30, 94, 36, 44); d.db(x + 76, 94, 36, 44, { fill: C.accSoft, stroke: C.acc }); }
    d.text(x + 70, 200, how, { cls: 'xs', vc: true });
  });
  return d.svg();
}
export function sd_rate_limiting_totals() {
  const d = illustration('sd_rate_limiting_totals', '1,000 CHECKS/S × 3 DIMENSIONS = 3,000 LIMITER OPS/S; THE EXACT LOG HOLDS 10,000,000 EVENTS', 300);
  const r = [['base checks', '1,000/s', '3 in flight at 3 ms'], ['× 3 dimensions', '3,000 ops/s', 'before retries'], ['exact log', '10,000,000 events', '100,000 users × 100'], ['log bytes', '240,000,000 B', '24 B per event']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 52, hot = i === 1;
    d.text(40, y + 14, a, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.mono(250, y + 14, b, { size: 11, a: 'start', color: hot ? C.acc : undefined });
    d.text(430, y + 14, c, { cls: 'xs', a: 'start' });
  });
  d.text(320, 280, 'count round trips, events and hot keys; measure the real overhead', { cls: 'xs' });
  return d.svg();
}
export function sd_rate_limiting_jobs() {
  const d = illustration('sd_rate_limiting_jobs', 'FOUR COMPONENTS, FOUR GUARANTEES', 300);
  const r = [['identity boundary', 'no forged keys'], ['algorithm state', 'the chosen interval'], ['atomic owner', 'no double spend'], ['failure policy', 'bounded when down']];
  r.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    if (i === 0) d.key(x + 44, 90, 34); if (i === 1) bucket(d, x + 34, 66, 52, 50, 0.5); if (i === 2) d.lock(x + 44, 64, 34, { stroke: C.acc, fill: C.accSoft }); if (i === 3) d.clock(x + 60, 90, 44);
    d.text(x + 60, 150, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.text(x + 60, 172, t, { cls: 'xs' });
  });
  return d.svg();
}

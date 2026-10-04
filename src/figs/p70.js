import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const timeline = (d, X, y, W, segs, total, unit = ' s', step) => { let t = 0; segs.forEach(([v, s, hot]) => { d.rect(X + t / total * W, y, v / total * W, 34, { r: 0, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(X + (t + v / 2) / total * W, y + 17, s, { cls: 'xs', color: hot ? C.acc : undefined }); t += v; }); ruler(d, X, y + 46, W, total, step ?? total / 4, unit); };
export function where_sd_reliability(stage=99) { return systemMap("sd_reliability", ["Availability and SPOFs", "Redundancy, active-active, passive", "Graceful degradation and fault tolerance", "Retries, exponential backoff, and jitter", "Timeouts, circuit breakers, bulkheads", "Health checks and failover", "Disaster recovery, RTO, and RPO", "Case study: one incident"], stage); }
export function cover_sd_reliability() { return systemCover("sd_reliability", 11, ["Reliability and", "fault tolerance"], "Reliability and fault tolerance", ["Availability and SPOFs", "Redundancy, active-active, passive", "Graceful degradation and fault tolerance", "Retries, exponential backoff, and jitter", "Timeouts, circuit breakers, bulkheads", "Health checks and failover", "Disaster recovery, RTO, and RPO", "Case study: one incident"]); }
export function sd_reliability_dependency() {
  const d = illustration('sd_reliability_dependency', 'THREE APPLICATION REPLICAS, ONE DATABASE: WHEN IT FAILS, ALL 1,000 REQUESTS/S FAIL', 320);
  ['A', 'B', 'C'].forEach((s, i) => { d.server(80 + i * 180, 60, 80, 80, { unit: 16, label: `app ${s}`, led: () => true }); d.line(120 + i * 180, 160, 320, 210, { stroke: C.acc, single: true }); });
  d.db(260, 210, 120, 80, { fill: C.accSoft, stroke: C.acc });
  d.during([0.4, 1], (g) => cross(g, 320, 250, 22));
  d.text(500, 260, 'spare app copies cannot\nrepair required state', { cls: 'sm', vc: true });
  return d.svg();
}
export function sd_reliability_success() {
  const d = illustration('sd_reliability_success', 'A SUCCESS COUNTS ONLY WHEN THE CALL IS REACHABLE, CORRECT AND ON TIME', 300);
  const c = [['reachable', 'connection works'], ['correct', 'right, authorized score'], ['timely', 'inside the deadline']];
  c.forEach(([s, t], i) => { d.circle(150 + i * 120, 130, 170, { stroke: C.ink2 }); });
  c.forEach(([s, t], i) => { d.text([90, 270, 400][i], [90, 90, 90][i], s, { cls: 'ttl', size: 12 }); d.text([90, 270, 400][i], [110, 110, 110][i], t, { cls: 'xs' }); });
  d.circle(270, 150, 50, { fill: C.accSoft, stroke: C.acc });
  d.text(270, 150, 'success', { cls: 'xs', color: C.acc });
  d.text(530, 200, '99.9% of 8,640,000\ndaily requests allows\n8,640 failures, not\n8,640 wrong scores', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_reliability_availability() {
  const d = illustration('sd_reliability_availability', 'IN A 30-DAY MONTH, 99.9% ALLOWS 2,592 S DOWN; 99.99% ALLOWS 259.2 S', 300);
  const X = 60, W = 520, s = W / 2592;
  d.text(X, 70, '99.9%', { cls: 'ttl', a: 'start' });
  d.rect(X, 82, 2592 * s, 34, { r: 2, fill: C.card, stroke: C.ink2 }); d.mono(X + W / 2, 99, '2,592 s ≈ 43.2 min', { size: 10.5 });
  d.text(X, 150, '99.99%', { cls: 'ttl', a: 'start', color: C.acc });
  d.rect(X, 162, 259.2 * s, 34, { r: 2, fill: C.accSoft, stroke: C.acc }); d.mono(X + 259.2 * s + 10, 179, '259.2 s ≈ 4.32 min', { size: 10.5, a: 'start', color: C.acc });
  d.mono(320, 236, 'B = T(1 − A) = 2,592,000 s × 0.001 or × 0.0001', { size: 10 });
  d.text(320, 266, 'state the interval and what counts before quoting a percentage', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_series() {
  const d = illustration('sd_reliability_series', 'THREE 0.999 COMPONENTS IN SERIES: 0.999³ = 0.997002999 FOR THE PATH', 300);
  [['proxy', 60], ['application', 250], ['database', 440]].forEach(([s, x], i) => {
    if (i === 2) d.db(x + 20, 80, 90, 80); else d.server(x + 20, 80, 90, 80, { unit: 16 });
    d.text(x + 65, 178, s, { cls: 'sm' }); d.mono(x + 65, 198, '0.999', { size: 10.5 });
    if (i < 2) d.arrow(x + 116, 120, x + 206, 120, { stroke: C.ink2 });
  });
  d.travel([[60, 120], [560, 120]], { dur: 4, r: 4 });
  d.mono(320, 244, 'A = 0.999 × 0.999 × 0.999 = 0.997002999', { size: 11, color: C.acc });
  d.text(320, 270, 'only if failures are independent; shared causes break the product', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_parallel() {
  const d = illustration('sd_reliability_parallel', 'TWO PATHS HELP ONLY IF EITHER ONE CAN SERVE THE WHOLE OPERATION', 320);
  d.phone(30, 120, 70);
  [['path A', 70], ['path B', 200]].forEach(([s, y], i) => {
    d.carrow([[70, 150], [150, y + 30], [230, y + 30]], { stroke: C.ink2, hl: 6 });
    d.server(240, y, 70, 60, { unit: 14 }); d.arrow(316, y + 30, 380, y + 30, { stroke: C.ink2, hl: 6 }); d.db(390, y + 4, 60, 52);
    d.text(500, y + 20, s, { cls: 'ttl', a: 'start', size: 12 }); d.text(500, y + 40, 'fresh state + authorization', { cls: 'xs', a: 'start' });
  });
  d.during([0.4, 1], (g) => cross(g, 275, 100, 14));
  d.travel('M70,150 Q150,230 230,230', { dur: 4, at: [0.4, 0.9], r: 3.5 });
  d.mono(320, 296, '1 − (1 − 0.999)² = 0.999999, if independent and sufficient', { size: 10 });
  return d.svg();
}
export function sd_reliability_common() {
  const d = illustration('sd_reliability_common', 'THREE ZONES, ONE CONFIGURATION: A BAD PUSH TAKES DOWN ALL OF THEM', 320);
  d.doc(270, 46, 100, 70, { lines: true, fill: C.accSoft, stroke: C.acc }); d.text(320, 132, 'shared config', { cls: 'sm', color: C.acc });
  ['zone A', 'zone B', 'zone C'].forEach((s, i) => {
    const x = 60 + i * 190;
    d.rect(x, 170, 140, 100, { r: 8, stroke: C.line, dash: [4, 4] }); d.text(x + 70, 186, s, { cls: 'xs' });
    d.server(x + 40, 200, 60, 56, { unit: 14 });
    d.arrow(320, 140, x + 70, 196, { stroke: C.acc, hl: 6 });
    d.during([0.5, 1], (g) => cross(g, x + 70, 228, 14));
  });
  d.mono(320, 300, '0.999 × 0.999999 = 0.998999001: the shared part dominates', { size: 10 });
  return d.svg();
}
export function sd_reliability_survivor() {
  const d = illustration('sd_reliability_survivor', 'FOUR REPLICAS AT 350/S EACH: LOSE ONE AND 1,050 CAPACITY CARRIES 1,000 DEMAND', 320);
  [0, 1, 2, 3].forEach((i) => {
    const x = 60 + i * 130, lost = i === 3;
    d.server(x, 70, 90, 110, { fill: lost ? C.paper : C.card, stroke: lost ? C.gray : C.ink2 });
    if (lost) cross(d, x + 45, 125, 20, C.gray);
    const load = lost ? 0 : 333.333;
    d.rect(x, 190, 90, 16, { r: 2, stroke: C.ink2 }); d.fillRect(x + 1, 191, 88 * load / 350, 14, C.accSoft);
    d.mono(x + 45, 222, lost ? 'lost' : '333.333/s', { size: 9.5, color: lost ? C.gray : C.acc });
  });
  d.text(320, 262, '1,000 ÷ 3 = 333.333 of 350 each: 50/s of total headroom left', { cls: 'sm' });
  d.text(320, 286, 'uneven routing or a cache miss storm can eat that in seconds', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_regions() {
  const d = illustration('sd_reliability_regions', 'WHO SERVES TRAFFIC AND WHO MAY COMMIT WRITES ARE TWO DIFFERENT QUESTIONS', 330);
  panel(d, 20, 44, 292, 250, 'active-active');
  [60, 190].forEach((x) => { d.server(x, 90, 70, 80, { unit: 15 }); d.db(x + 6, 190, 58, 50); });
  d.arrow(134, 215, 186, 215, { stroke: C.acc, both: true }); d.text(166, 266, 'both write: need a conflict rule', { cls: 'xs', color: C.acc });
  panel(d, 328, 44, 292, 250, 'active-passive');
  d.server(368, 90, 70, 80, { unit: 15, led: () => true }); d.db(374, 190, 58, 50);
  d.server(500, 90, 70, 80, { unit: 15, fill: C.paper, stroke: C.gray }); d.db(506, 190, 58, 50, { fill: C.paper });
  d.arrow(438, 215, 500, 215, { stroke: C.ink2 }); d.text(474, 266, 'standby must be promotable', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_uncertain() {
  const d = illustration('sd_reliability_uncertain', 'THE DATABASE COMMITTED K, THE REPLY DIED; THE RETRY RECOVERS THE SAME RESULT', 300);
  d.person(40, 90, 32, { label: 'scorer' }); d.server(260, 70, 80, 90, { label: 'application' }); d.db(480, 76, 110, 90, { label: 'effect + K' });
  d.arrow(72, 100, 254, 100, { stroke: C.ink2 }); d.arrow(346, 110, 474, 110, { stroke: C.ink2 });
  d.arrow(254, 130, 80, 130, { stroke: C.gray }); bolt(d, 166, 114, 0.6);
  d.arrow(72, 200, 254, 200, { stroke: C.acc }); d.mono(160, 188, 'retry K', { size: 10, color: C.acc });
  d.arrow(254, 228, 72, 228, { stroke: C.acc }); d.mono(160, 242, 'committed result', { size: 10, color: C.acc });
  d.travel([[72, 200], [254, 200], [254, 228], [72, 228]], { dur: 4, label: 'K', w: 20 });
  return d.svg();
}
export function sd_reliability_degraded() {
  const d = illustration('sd_reliability_degraded', 'THE FRESH SCORE IS REQUIRED; RECOMMENDATIONS ARE OPTIONAL; A CACHED MODE IS LABELLED', 320);
  d.phone(30, 110, 76, { label: 'score read' });
  const t = [['fresh score', 'required', 70, false], ['recommendations', 'optional: drop on failure', 150, false], ['cached score, age shown', 'degraded mode', 230, true]];
  t.forEach(([s, r, y, hot]) => { d.carrow([[74, 150], [160, y + 14], [250, y + 14]], { stroke: hot ? C.acc : C.gray, hl: 6 }); panel(d, 260, y - 10, 340, 52, '', hot); d.text(276, y + 6, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined }); d.text(276, y + 26, r, { cls: 'xs', a: 'start' }); });
  d.text(320, 300, 'cache gone at 90% hits: database load goes from 100/s to 1,000/s', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_inflight() {
  const d = illustration('sd_reliability_inflight', 'SAME 1,000 REQUESTS/S: 0.2 S EACH HOLDS 200 IN FLIGHT, 2 S HOLDS 2,000', 320);
  panel(d, 20, 44, 292, 240, 'W = 0.2 s');
  for (let i = 0; i < 20; i++) d.dot(60 + (i % 10) * 22, 100 + Math.floor(i / 10) * 22, 4, C.ink2);
  d.mono(166, 200, 'L = 1,000 × 0.2 = 200', { size: 10.5 });
  panel(d, 328, 44, 292, 240, 'W = 2 s', true);
  for (let i = 0; i < 200; i++) d.dot(350 + (i % 20) * 12.5, 80 + Math.floor(i / 20) * 12, 2.5, C.acc);
  d.mono(474, 228, 'L = 1,000 × 2 = 2,000', { size: 10.5, color: C.acc });
  d.text(320, 304, 'each dot = 10 requests holding a thread, a socket and memory', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_cascade() {
  const d = illustration('sd_reliability_cascade', 'A LOOP: LOSE A REPLICA, PEERS SLOW, DEADLINES MISS, RETRIES ADD LOAD', 330);
  const st = [['replica lost', 320, 70], ['peers slow', 520, 165], ['deadlines miss', 320, 260], ['retries add load', 120, 165]];
  st.forEach(([s, x, y], i) => { d.rect(x - 70, y - 22, 140, 44, { r: 22, fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2 }); d.text(x, y, s, { cls: 'sm', color: i === 3 ? C.acc : undefined }); });
  d.carrow([[390, 80], [470, 100], [500, 140]], { stroke: C.ink2 }); d.carrow([[500, 190], [470, 240], [390, 255]], { stroke: C.ink2 });
  d.carrow([[250, 255], [170, 240], [140, 190]], { stroke: C.ink2 }); d.carrow([[140, 140], [170, 100], [250, 78]], { stroke: C.acc });
  d.travel('M320,92 C470,100 520,140 520,165 C520,230 400,260 320,260 C200,260 120,230 120,165 C120,110 200,92 320,92', { dur: 5, r: 4 });
  d.text(320, 165, '600/s capacity\n1,000/s demand', { cls: 'xs', vc: true });
  d.text(320, 312, 'break the loop (shed, cap retries) before reopening', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_drain() {
  const d = illustration('sd_reliability_drain', '12,000 QUEUED, 800/S SERVED, 600/S ARRIVING: 200/S NET, 60 S TO DRAIN', 300);
  d.text(90, 60, '600/s arriving', { cls: 'sm' });
  for (let k = 0; k < 3; k++) d.travel([[30, 80], [160, 120]], { dur: 2, at: [k / 3, k / 3 + 0.5], token: (g) => g.envelope(-8, -6, 16, 11) });
  d.rect(160, 80, 220, 90, { r: 6, fill: C.paper, stroke: C.ink2 });
  for (let i = 0; i < 24; i++) d.envelope(170 + (i % 8) * 25, 90 + Math.floor(i / 8) * 24, 20, 14, { fill: C.accSoft, stroke: C.acc });
  d.text(270, 188, '12,000 waiting', { cls: 'xs' });
  d.arrow(386, 125, 450, 125, { stroke: C.ink2 }); d.text(418, 110, '800/s', { cls: 'mono', size: 10 });
  d.server(460, 80, 90, 90, { label: 'workers' });
  d.mono(320, 236, '800 − 600 = 200/s;  12,000 ÷ 200 = 60 s (not 12,000 ÷ 800 = 15 s)', { size: 10, color: C.acc });
  return d.svg();
}
export function sd_reliability_classes() {
  const d = illustration('sd_reliability_classes', 'SORT THE FAILURE BEFORE CHOOSING A RETRY', 300);
  const rows = [['invalid request', 'permanent', 'fix the request', false], ['peer unavailable', 'maybe transient', 'bounded attempt', false], ['reply lost', 'outcome uncertain', 'recover the same command', true]];
  rows.forEach(([a, b, c, hot], i) => {
    const y = 60 + i * 66;
    d.envelope(40, y, 50, 34, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 });
    d.text(110, y + 17, a, { cls: 'ttl', a: 'start', size: 12 });
    d.text(290, y + 17, b, { cls: 'sm', a: 'start' });
    d.arrow(420, y + 17, 446, y + 17, { stroke: C.gray, hl: 5 });
    d.text(456, y + 17, c, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  return d.svg();
}
export function sd_reliability_backoff() {
  const d = illustration('sd_reliability_backoff', 'b = min(b_max, 100 × 2^k): CEILINGS 100, 200, 400, 800 MS', 300);
  const X = 80, s = 0.5;
  let t = 0;
  [100, 200, 400, 800].forEach((c, k) => {
    d.envelope(X + t * s - 10, 90, 20, 14, { fill: C.card });
    d.rect(X + t * s + 12, 92, c * s - 14, 10, { r: 2, fill: k === 3 ? C.accSoft : C.paper, stroke: k === 3 ? C.acc : C.ink2, dash: [3, 3] });
    d.mono(X + t * s + c * s / 2, 120, `wait ≤ ${c}`, { size: 9 });
    t += c + 20;
  });
  d.envelope(X + t * s - 10, 90, 20, 14, { fill: C.card });
  d.travel([[X, 97], [X + t * s, 97]], { dur: 5, r: 3.5 });
  d.text(320, 180, 'skip the retry if the remaining deadline cannot cover the wait and the call', { cls: 'sm' });
  d.text(320, 206, 'a delay cap is not a total deadline', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_jitter() {
  const d = illustration('sd_reliability_jitter', 'FIXED 400 MS BACKOFF RETURNS EVERYONE AT ONCE; FULL JITTER SPREADS THEM OVER 0–400', 320);
  const X = 80, W = 480, s = W / 400;
  d.text(X - 10, 100, 'fixed', { cls: 'ttl', a: 'end' });
  for (let i = 0; i < 12; i++) d.dot(X + 400 * s, 80 + i * 3.5, 3, C.ink2);
  d.line(X, 120, X + W, 120, { stroke: C.line, single: true });
  d.text(X - 10, 200, 'jittered', { cls: 'ttl', a: 'end', color: C.acc });
  const js = [12, 57, 98, 141, 166, 203, 238, 271, 309, 335, 362, 391];
  js.forEach((v, i) => d.dot(X + v * s, 196 - (i % 3) * 6, 3, C.acc));
  d.line(X, 214, X + W, 214, { stroke: C.line, single: true });
  ruler(d, X, 240, W, 400, 100, ' ms');
  d.text(320, 296, 'expected wait 200 ms; the number of attempts is unchanged (illustrative samples)', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_amplification() {
  const d = illustration('sd_reliability_amplification', 'THREE ATTEMPTS AT EACH OF THREE LAYERS TURN 1 OPERATION INTO 27 DATABASE CALLS', 330);
  const cols = [['operation', 1], ['gateway', 3], ['service', 9], ['database', 27]];
  const pos = cols.map(([, k], c) => Array.from({ length: k }, (_, i) => [70 + c * 168, 56 + (i + 0.5) * 220 / k]));
  pos.slice(1).forEach((col, c) => col.forEach((p, i) => d.line(...pos[c][Math.floor(i / 3)], ...p, { stroke: c === 2 ? C.acc : C.line, single: true, sw: 0.8 })));
  pos.forEach((col, c) => col.forEach(([x, y]) => d.circle(x, y, c === 3 ? 7 : 12, { fill: c === 3 ? C.accSoft : C.card, stroke: c === 3 ? C.acc : C.ink2 })));
  cols.forEach(([s, k], c) => d.mono(70 + c * 168, 300, `${s}: ${k}`, { size: 10, color: c === 3 ? C.acc : undefined }));
  d.travel([pos[0][0], pos[1][2], pos[2][8], pos[3][26]], { dur: 4, r: 3.5 });
  return d.svg();
}
export function sd_reliability_retrybudget() {
  const d = illustration('sd_reliability_retrybudget', 'RETRIES MAY ADD AT MOST 10%: 100/S ON TOP OF 1,000/S ORIGINALS', 300);
  for (let i = 0; i < 10; i++) d.envelope(40 + i * 40, 90, 32, 22, { fill: C.card });
  d.text(240, 74, '1,000/s original (each = 100/s)', { cls: 'xs' });
  d.envelope(460, 90, 32, 22, { fill: C.accSoft, stroke: C.acc }); d.text(476, 74, '+100/s', { cls: 'xs', color: C.acc });
  d.rect(500, 86, 100, 30, { r: 4, stroke: C.gray, dash: [3, 3] }); cross(d, 550, 101, 8, C.gray); d.text(550, 132, 'budget spent: fail fast', { cls: 'xs' });
  d.text(320, 200, 'a retry still needs time left on the deadline and a safe identity', { cls: 'sm' });
  return d.svg();
}
export function sd_reliability_deadline() {
  const d = illustration('sd_reliability_deadline', '500 MS: 40 + 60 RESERVED, 400 USEFUL; 120 SPENT, 280 LEFT FOR THE REST', 280);
  timeline(d, 40, 90, 560, [[40, 'net'], [120, 'spent 120'], [280, 'remaining 280', true], [60, 'reply']], 500, ' ms', 100);
  d.text(320, 200, 'the next call inherits 280 ms, not a fresh budget', { cls: 'sm' });
  return d.svg();
}
export function sd_reliability_timeoutcommit() {
  const d = illustration('sd_reliability_timeoutcommit', 'THE CALLER\'S DEADLINE FIRED, THEN THE COMMIT FINISHED: BOTH ARE TRUE', 300);
  const X = 60, W = 520;
  d.arrow(X, 200, X + W, 200, { stroke: C.gray });
  d.rect(X + 40, 120, 300, 30, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(X + 190, 135, 'caller waits', { cls: 'xs' });
  d.line(X + 340, 110, X + 340, 196, { stroke: C.ink2, sw: 1.6, single: true }); d.text(X + 340, 100, 'deadline', { cls: 'xs' });
  d.rect(X + 80, 160, 330, 30, { r: 3, fill: C.accSoft, stroke: C.acc }); d.text(X + 245, 175, 'database write K', { cls: 'xs', color: C.acc });
  d.line(X + 410, 150, X + 410, 196, { stroke: C.acc, sw: 1.6, single: true }); d.text(X + 410, 214, 'commit', { cls: 'xs', color: C.acc });
  d.text(320, 256, 'later: look up K, never assume the timeout rolled it back', { cls: 'sm' });
  return d.svg();
}
export function sd_reliability_breaker() {
const d=illustration('sd_reliability_breaker','A CIRCUIT BREAKER OPENS THE CALL PATH UNTIL BOUNDED PROBES SUCCEED',350);
  const states=[['closed',94,true],['open',213,false],['half-open',332,false]];
  states.forEach(([s,y,on],i)=>{d.text(45,y,s,{cls:'ttl',a:'start'});d.line(172,y,312,y,{stroke:C.ink2,single:true});d.circle(316,y,9,{fill:C.paper});d.circle(401,y,9,{fill:C.paper});d.line(322,y,395,on?y:y-45,{stroke:i===1?C.acc:C.ink2,single:true,sw:2});d.line(406,y,560,y,{stroke:C.ink2,single:true});if(i===2){d.path(`M322,${y} Q357,${y-33} 394,${y}`,{stroke:C.acc,single:true,dash:[3,5]});d.text(489,y-28,'probe only',{cls:'sm',color:C.acc});}else d.text(482,y-27,on?'calls admitted':'calls blocked',{cls:'sm'});});return d.svg();
}
export function sd_reliability_probes() {
  const d = illustration('sd_reliability_probes', 'OPEN, HALF-OPEN WITH A FEW PROBES, THEN CLOSED; A FAILED PROBE REOPENS', 320);
  const st = [['open', 'reject calls,\ncool down', 120, 90], ['half-open', 'a bounded\nnumber of probes', 320, 90], ['closed', 'admit, ramp up', 520, 90]];
  st.forEach(([s, t, x, y], i) => { d.circle(x, y + 40, 100, { fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.text(x, y + 30, s, { cls: 'ttl', color: i === 1 ? C.acc : undefined }); d.text(x, y + 54, t, { cls: 'xs', vc: true }); });
  d.arrow(172, 130, 268, 130, { stroke: C.ink2 }); d.text(220, 118, 'timer', { cls: 'xs' });
  d.arrow(372, 130, 468, 130, { stroke: C.ink2 }); d.text(420, 118, 'probes pass', { cls: 'xs' });
  d.carrow([[300, 184], [220, 240], [140, 184]], { stroke: C.acc }); d.text(220, 254, 'probe fails', { cls: 'xs', color: C.acc });
  d.text(320, 300, 'one passing probe is not full capacity; raise traffic gradually', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_bulkhead() {
const d=illustration('sd_reliability_bulkhead','A STALLED CLIP POOL CANNOT CONSUME THE RESERVED SLOTS',350);
  d.text(119,46,'clip maximum: 20 slots',{cls:'ttl',color:C.acc});d.text(441,46,'other work: 80 slots',{cls:'ttl'});
  for(let r=0;r<5;r++)for(let c=0;c<20;c++)d.rect(39+c*28.1,83+r*36,22,26,{r:1,fill:c<4?C.accSoft:C.card,stroke:c<4?C.acc:C.line});
  d.line(145,64,145,280,{stroke:C.ink2,single:true,sw:3});
  d.mono(320,298,'20 + 80 = 100 slots in the total resource budget',{size:12});d.text(320,327,'the boundary reserves capacity for work that must remain useful',{cls:'sm'});return d.svg();
}
export function sd_reliability_checks() {
  const d = illustration('sd_reliability_checks', 'FOUR PROBES, FOUR ACTIONS: WAIT, RESTART, ROUTE, MEASURE', 320);
  const r = [['startup', 'initialized?', 'start other checks'], ['liveness', 'still progressing?', 'restart'], ['readiness', 'take new work now?', 'route or drain'], ['user probe', 'does the operation work?', 'measure the promise']];
  r.forEach(([s, q, a], i) => {
    const y = 52 + i * 62, hot = i === 3;
    d.server(30, y, 40, 46, { unit: 13, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(90, y + 14, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.text(90, y + 34, q, { cls: 'xs', a: 'start' });
    d.arrow(330, y + 24, 380, y + 24, { stroke: C.gray, hl: 5 });
    d.text(392, y + 24, a, { cls: 'sm', a: 'start' });
  });
  return d.svg();
}
export function sd_reliability_detection() {
  const d = illustration('sd_reliability_detection', 'PROBE EVERY 5 S, REMOVE AFTER 3 FAILURES: ABOUT 15 S TO STOP NEW WORK', 280);
  const X = 60, s = 28;
  ruler(d, X, 170, 18 * s, 18, 3, ' s');
  [5, 10, 15].forEach((t, i) => { d.rect(X + t * s - 10, 110, 20, 30, { r: 3, fill: C.card, stroke: C.ink2 }); cross(d, X + t * s, 125, 6, C.ink2); });
  d.line(X + 15 * s, 90, X + 15 * s, 166, { stroke: C.acc, sw: 2, single: true }); d.text(X + 15 * s, 80, 'remove from routing', { cls: 'xs', color: C.acc });
  d.rect(X + 15 * s, 196, 3 * s, 22, { r: 2, fill: C.accFaint, stroke: C.acc }); d.text(X + 16.5 * s, 230, 'drain admitted work', { cls: 'xs' });
  d.text(240, 250, 'phase and timeout change the real number', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_failover() {
  const d = illustration('sd_reliability_failover', 'DETECT 15 S + PROMOTE 10 S + ROUTE 5 S = 30 S OF FAILOVER', 260);
  timeline(d, 40, 90, 560, [[15, 'detect 15'], [10, 'promote 10', true], [5, 'route 5']], 30, ' s', 5);
  d.text(320, 200, 'a promise shorter than 30 s needs a different mechanism or a degraded mode', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_failovertrace() {
  const d = illustration('sd_reliability_failovertrace', 'THE CANDIDATE RECOVERS STATE AND TAKES A FENCED TOKEN BEFORE ITS FIRST WRITE', 320);
  const st = [['router stops\nold route', false], ['recover\nauthoritative state', false], ['acquire\nfenced authority', true], ['ready for\nwrites', false], ['new commands', false]];
  st.forEach(([s, hot], i) => {
    const x = 30 + i * 120;
    d.circle(x + 50, 110, 70, { fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.mono(x + 50, 110, String(i + 1), { size: 13, color: hot ? C.acc : undefined });
    d.text(x + 50, 180, s, { cls: 'xs', vc: true });
    if (i < 4) d.arrow(x + 88, 110, x + 132, 110, { stroke: C.gray, hl: 5 });
  });
  d.travel([[80, 110], [560, 110]], { dur: 5, r: 4 });
  d.text(320, 250, 'being chosen is not the same as being safe to write', { cls: 'sm' });
  return d.svg();
}
export function sd_reliability_fence() {
  const d = illustration('sd_reliability_fence', 'THE STATE STORE ACCEPTS TOKEN 34 AND REJECTS THE OLD OWNER\'S 33', 300);
  d.server(40, 60, 80, 80, { label: 'old owner (33)' }); d.server(40, 180, 80, 80, { label: 'new owner (34)', fill: C.accSoft, stroke: C.acc });
  d.db(400, 110, 140, 110, { label: 'highest 34' });
  d.arrow(126, 100, 392, 150, { stroke: C.gray }); cross(d, 380, 148, 8);
  d.arrow(126, 220, 392, 180, { stroke: C.acc }); tick(d, 380, 184, 7);
  d.travel([[126, 100], [392, 150], [200, 130]], { dur: 4, at: [0.5, 1], label: '33', w: 24, fill: C.card, color: C.ink2 });
  d.text(320, 290, 'token values are illustrative; the resource must do the check', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_backup() {
const d=illustration('sd_reliability_backup','A CURRENT REPLICA AND AN EARLIER RECOVERY COPY HAVE DIFFERENT JOBS',340);
  d.db(45,92,113,113,{under:'live source'});d.db(256,92,113,113,{under:'current replica'});d.disk(523,150,119,{label:'recovery copy'});
  d.arrow(166,150,249,150,{stroke:C.acc});d.text(210,128,'track changes',{cls:'sm'});
  d.doc(490,238,66,49,{lines:false});d.mono(523,262,'earlier',{size:10});
  d.line(392,59,392,278,{stroke:C.line,single:true,dash:[4,4]});d.text(513,62,'separate recovery authority',{cls:'ttl',size:11});
  d.text(320,319,'a replica can repeat a destructive change; restore must survive its cause',{cls:'sm'});return d.svg();
}
export function sd_reliability_rto() {
  const d = illustration('sd_reliability_rto', 'PREPARE 60 + RESTORE 180 + VERIFY 120 = 360 S AGAINST A 600 S RTO', 280);
  timeline(d, 40, 90, 560, [[60, 'prepare'], [180, 'restore 180'], [120, 'verify + route'], [240, '240 s margin', true]], 600, ' s', 100);
  d.text(320, 200, 'counts only if verification is included before "restored"', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_rpo() {
  const d = illustration('sd_reliability_rpo', 'A 300 S SNAPSHOT GAP AT 20 EVENTS/S CAN LOSE 6,000 ACKNOWLEDGED EVENTS', 300);
  const X = 60, W = 520;
  d.arrow(X, 140, X + W, 140, { stroke: C.gray });
  d.doc(X, 90, 34, 44, { lines: false, fill: C.card }); d.text(X + 17, 158, 'snapshot', { cls: 'xs' });
  d.rect(X + 40, 100, 440, 30, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 260, 115, '300 s × 20 events/s = 6,000 events', { cls: 'sm', color: C.acc });
  bolt(d, X + 490, 84);
  d.text(320, 210, 'an independently retained log replayed over the snapshot can shrink this', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_lagloss() {
  const d = illustration('sd_reliability_lagloss', 'A REPLICA 2 S BEHIND AT 20 EVENTS/S IS MISSING 40 EVENTS', 280);
  d.text(60, 82, 'primary', { cls: 'sm', a: 'start' }); d.tape(150, 68, Array(10).fill(''), { cw: 40, h: 28, hot: (i) => i >= 8 });
  d.text(60, 142, 'replica', { cls: 'sm', a: 'start' }); d.tape(150, 128, Array(8).fill(''), { cw: 40, h: 28 });
  d.brace(470, 550, 104, { label: '2 s × 20 = 40' });
  d.text(320, 220, 'a lag sample is not a recovery bound; failure can stretch it', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_drill() {
  const d = illustration('sd_reliability_drill', 'A DRILL RESTORES A SERVICE, NOT JUST A FILE', 300);
  const st = [['restore data', 'backup → new DB'], ['replay history', 'log since snapshot'], ['verify invariants', 'ids, versions, totals'], ['serve safely', 'old writers fenced']];
  st.forEach(([s, t], i) => {
    const x = 30 + i * 150, hot = i === 2;
    if (i === 0) d.db(x + 30, 60, 60, 70); if (i === 1) d.tape(x + 10, 80, ['', '', ''], { cw: 33, h: 28 }); if (i === 2) d.doc(x + 36, 58, 48, 72, { fill: C.accSoft, stroke: C.acc }); if (i === 3) d.server(x + 30, 60, 60, 70, { unit: 15, led: () => true });
    d.text(x + 60, 156, s, { cls: 'ttl', size: 12, color: hot ? C.acc : undefined });
    d.text(x + 60, 176, t, { cls: 'xs' });
    if (i < 3) d.arrow(x + 112, 95, x + 146, 95, { stroke: C.gray, hl: 5 });
  });
  d.text(320, 240, 'practise it with real credentials before the incident needs them', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_normal() {
  const d = illustration('sd_reliability_normal', 'NORMAL CONTRACT: 4 × 350 = 1,400/S FOR A 1,000/S PEAK, CLIPS ISOLATED IN 20 SLOTS', 320);
  [0, 1, 2, 3].forEach((i) => d.server(40 + i * 70, 70, 54, 80, { unit: 15, led: () => true }));
  d.mono(170, 170, '1,400/s capacity', { size: 10 }); d.mono(170, 190, '400/s spare at peak', { size: 10, color: C.acc });
  d.rect(360, 60, 240, 100, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(480, 78, 'clip calls: 20 slots', { cls: 'sm' });
  for (let k = 0; k < 20; k++) d.rect(374 + (k % 10) * 22, 94 + Math.floor(k / 10) * 26, 18, 20, { r: 2, fill: C.card, stroke: C.line });
  chip(d, 360, 190, 240, 'commands carry stable identity', true, 26);
  d.text(320, 270, 'write the normal contract first; failure plans build on it', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_hedge() {
  const d = illustration('sd_reliability_hedge', 'AFTER ONE LOSS, 5% HEDGED READS FILL THE LAST 50/S OF 1,050 CAPACITY', 300);
  const X = 60, W = 520, s = W / 1050;
  d.rect(X, 90, 1050 * s, 40, { r: 2, stroke: C.ink2 });
  d.fillRect(X + 1, 91, 1000 * s, 38, C.card); d.fillRect(X + 1000 * s, 91, 50 * s, 38, C.accSoft);
  d.text(X + 500 * s, 110, 'original demand 1,000/s', { cls: 'sm' });
  d.line(X + 1025 * s, 136, X + 1025 * s, 160, { stroke: C.acc, single: true }); d.text(X + 1025 * s, 172, 'hedges 50/s', { cls: 'xs', color: C.acc, a: 'end' });
  d.text(X + W, 76, 'capacity 3 × 350 = 1,050/s', { cls: 'xs', a: 'end' });
  d.text(320, 220, 'no margin left; a fleet-wide slowdown makes hedges pure extra load', { cls: 'sm' });
  return d.svg();
}
export function sd_reliability_canary() {
  const d = illustration('sd_reliability_canary', 'RETURN 5% FIRST: 50/S TO THE RECOVERED PATH, 950/S STAYS ON THE OLD', 300);
  for (let i = 0; i < 20; i++) d.envelope(40 + (i % 10) * 30, 80 + Math.floor(i / 10) * 28, 22, 16, { fill: i === 19 ? C.accSoft : C.paper, stroke: i === 19 ? C.acc : C.ink2 });
  d.text(180, 150, 'each = 50/s', { cls: 'xs' });
  d.server(420, 60, 80, 80, { label: 'established 950/s' });
  d.server(540, 150, 60, 60, { unit: 14, label: 'recovered 50/s', fill: C.accSoft, stroke: C.acc });
  d.arrow(350, 96, 412, 96, { stroke: C.ink2 }); d.arrow(350, 116, 534, 176, { stroke: C.acc });
  d.text(320, 256, 'inspect outcomes, then widen; a small share proves little about full load', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_jobs() {
  const d = illustration('sd_reliability_jobs', 'FOUR MECHANISMS, FOUR GUARANTEES; NONE SUBSTITUTES FOR ANOTHER', 320);
  const r = [['admission + bulkhead', 'bound resources'], ['deadline + retry', 'bounded attempts, same id'], ['health + fencing', 'route and own safely'], ['backup + restore', 'recover, verify, then serve']];
  r.forEach(([s, t], i) => {
    const x = 20 + (i % 2) * 310, y = 50 + Math.floor(i / 2) * 120;
    panel(d, x, y, 290, 100, s, i === 2);
    d.text(x + 145, y + 60, t, { cls: 'sm' });
  });
  return d.svg();
}
export function sd_reliability_budgetcard() {
  const d = illustration('sd_reliability_budgetcard', 'CAPACITY, RECOVERY TIME AND DATA LOSS ARE THREE SEPARATE CHECKS', 300);
  const r = [['worker loss', '3 × 350', '1,050 req/s'], ['regional restore', '60 + 180 + 120', '360 s'], ['snapshot gap', '300 × 20', '6,000 events']];
  r.forEach(([a, b, c], i) => {
    const x = 30 + i * 200;
    panel(d, x, 50, 180, 170, a, i === 2);
    d.mono(x + 90, 120, b, { size: 10 });
    d.mono(x + 90, 160, c, { size: 13, color: i === 2 ? C.acc : undefined });
  });
  d.text(320, 256, 'high availability says nothing about how much data a restore loses', { cls: 'xs' });
  return d.svg();
}
export function sd_reliability_breaker_numeric() {
  const d = illustration('sd_reliability_breaker_numeric', '12 OF 20 CALLS FAIL (0.6): OPEN AT 5 S, COOL 30 S, PROBE TWICE AT 35 S', 320);
  for (let i = 0; i < 20; i++) { const bad = [1, 2, 4, 5, 7, 8, 10, 11, 13, 15, 17, 19].includes(i); d.circle(50 + i * 26, 76, 18, { fill: bad ? C.accSoft : C.card, stroke: bad ? C.acc : C.ink2 }); if (bad) cross(d, 50 + i * 26, 76, 4); }
  d.text(320, 106, 'window of 20: 12 failures ≥ threshold 10 (illustrative pattern)', { cls: 'xs' });
  const X = 60, W = 520, s = W / 40;
  d.rect(X, 150, 5 * s, 30, { r: 0, fill: C.card, stroke: C.ink2 }); d.text(X + 2.5 * s, 165, 'closed', { cls: 'xs' });
  d.rect(X + 5 * s, 150, 30 * s, 30, { r: 0, fill: C.paper, stroke: C.ink2 }); d.text(X + 20 * s, 165, 'open: reject, cool down 30 s', { cls: 'xs' });
  d.rect(X + 35 * s, 150, 5 * s, 30, { r: 0, fill: C.accSoft, stroke: C.acc }); d.text(X + 37.5 * s, 165, '2 probes', { cls: 'xs', color: C.acc });
  ruler(d, X, 192, W, 40, 5, ' s');
  d.text(320, 266, 'probe slots are reserved atomically so a burst cannot all become probes', { cls: 'xs' });
  return d.svg();
}

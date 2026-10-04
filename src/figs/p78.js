import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const chain = (d, st, hotIdx, icons, note) => { st.forEach(([a, b], i) => { const x = 30 + i * 150, hot = i === hotIdx; if (icons) icons(d, i, x + 60, 92, hot); d.text(x + 60, 156, a, { cls: 'ttl', size: 11.5, color: hot ? C.acc : undefined }); if (b) d.text(x + 60, 176, b, { cls: 'xs' }); if (i < st.length - 1) d.arrow(x + 104, 92, x + 146, 92, { stroke: C.gray, hl: 5 }); }); d.travel([[90, 92], [540, 92]], { dur: 5, r: 3.5 }); if (note) d.text(320, 236, note, { cls: 'xs' }); };
const seq3 = (d, actors, steps, top = 60, gap = 36) => { const xs = actors.map((_, i) => 80 + i * 480 / Math.max(1, actors.length - 1)); actors.forEach(([s, kind], i) => { if (kind === 'person') d.person(xs[i], top - 14, 34); else if (kind === 'phone') d.phone(xs[i] - 14, top - 12, 46); else if (kind === 'db') d.db(xs[i] - 28, top - 8, 56, 48); else if (kind === 'doc') d.doc(xs[i] - 18, top - 10, 36, 48); else d.server(xs[i] - 24, top - 10, 48, 50, { unit: 14 }); d.text(xs[i], top + 54, s, { cls: 'xs' }); d.line(xs[i], top + 64, xs[i], top + 76 + steps.length * gap, { stroke: C.line, dash: [3, 5], single: true }); }); steps.forEach(([a, b, s, hot], k) => { const y = top + 84 + k * gap, col = hot ? C.acc : C.ink2; d.arrow(xs[a], y, xs[b], y, { stroke: col, hl: 6 }); d.mono((xs[a] + xs[b]) / 2, y - 9, s, { size: 9, color: hot ? C.acc : undefined }); d.travel([[xs[a], y], [xs[b], y]], { dur: 7, at: [k / steps.length, (k + 0.8) / steps.length], r: 3, color: col }); }); };
const log = (d, x, y, w, lines, hot = -1) => { d.rect(x, y, w, lines.length * 20 + 16, { r: 6, fill: C.ink, stroke: C.ink }); lines.forEach((l, i) => d.mono(x + 12, y + 18 + i * 20, l, { size: 9.5, a: 'start', color: i === hot ? C.acc : C.paper })); };
export function where_sd_observability(stage=99) { return systemMap("sd_observability", ["Monitoring goals and telemetry", "Structured logs and request IDs", "Counters, gauges, histograms", "Distributed tracing", "Sampling and collection", "Dashboards and golden signals", "SLIs, SLOs, SLAs, error budgets", "Alerting and incident diagnosis", "Case study: observing one request"], stage); }
export function cover_sd_observability() { return systemCover("sd_observability", 19, ["Monitoring and", "observability"], "Observability and monitoring", ["Monitoring goals and telemetry", "Structured logs and request IDs", "Counters, gauges, histograms", "Distributed tracing", "Sampling and collection", "Dashboards and golden signals", "SLIs, SLOs, SLAs, error budgets", "Alerting and incident diagnosis", "Case study: observing one request"]); }
export function sd_observability_01() {
  const d = illustration('sd_observability_01', 'THE PROCESS IS UP AND RETURNS 200, BUT THE VIEWER SEES AN OLD SCORE', 300);
  d.server(60, 80, 80, 90, { led: () => true }); tick(d, 100, 196, 8, C.ink2); d.text(100, 220, 'process healthy', { cls: 'xs' });
  d.envelope(270, 100, 100, 50, { label: '200 OK · v7' }); tick(d, 320, 196, 8, C.ink2); d.text(320, 220, 'HTTP success', { cls: 'xs' });
  d.phone(500, 70, 100, { stroke: C.acc }); d.mono(526, 116, '2 – 0', { size: 13 }); cross(d, 526, 196, 8); d.text(526, 220, 'score is stale', { cls: 'xs', color: C.acc });
  d.arrow(146, 125, 264, 125, { stroke: C.gray, hl: 5 }); d.arrow(376, 125, 494, 125, { stroke: C.gray, hl: 5 });
  d.text(320, 270, 'measure the user\'s outcome, not just the server\'s', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_02() {
  const d = illustration('sd_observability_02', 'A BLACK-BOX PROBE READS LIKE A USER AND CHECKS THE BODY, NOT JUST THE STATUS', 300);
  seq3(d, [['probe', 'phone'], ['public route', 'srv'], ['API', 'db']], [[0, 1, 'normal request'], [1, 2, 'auth + read'], [2, 0, 'validate body: v ≥ expected', true]]);
  return d.svg();
}
export function sd_observability_03() {
  const d = illustration('sd_observability_03', 'A CACHE-KEY CHANGE → MISSES → A FULL POOL → SLOW READS FOR THE USER', 280);
  chain(d, [['key change', 'deploy'], ['cache misses', 'hit rate drops'], ['pool fills', 'slots busy'], ['read delay', 'user waits']], 3, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 18, y - 24, 36, 48); if (i === 1) { g.ram(x - 30, y - 16, 60, 32); cross(g, x, y, 10, C.ink2); } if (i === 2) for (let k = 0; k < 4; k++) g.rect(x - 34 + k * 18, y - 16, 14, 32, { r: 2, fill: C.accSoft, stroke: C.ink2 }); if (i === 3) g.clock(x, y, 40, { spin: 3 }); }, 'a trace showing acquisition wait before query time supports the pool story');
  return d.svg();
}
export function sd_observability_04() {
  const d = illustration('sd_observability_04', 'COUNT THREE THINGS SEPARATELY: ATTEMPTS, COMMITTED COMMANDS, CONFIRMED OUTCOMES', 300);
  const r = [['attempts', 'admitted, completed', 3], ['commands', 'key known, effect committed', 1], ['outcomes', 'fresh result, viewer confirmed', 1]];
  r.forEach(([s, t, n], i) => { const y = 60 + i * 66, hot = i === 2; d.text(40, y + 14, s, { cls: 'ttl', a: 'start', color: hot ? C.acc : undefined }); for (let k = 0; k < n; k++) d.envelope(170 + k * 40, y, 30, 26, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.text(310, y + 14, t, { cls: 'sm', a: 'start' }); });
  d.text(320, 270, 'two retries are three successful HTTP attempts but one score change', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_05() {
  const d = illustration('sd_observability_05', 'A STRUCTURED EVENT HAS STABLE FIELDS, SO "result = stale" STILL MATCHES AFTER A REWORDING', 300);
  log(d, 40, 60, 330, ['event: score_read_finished', 'request_id: r41', 'match: m7', 'version: 7', 'result: stale', 'duration_ms: 38'], 4);
  d.rect(410, 100, 190, 44, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(505, 122, 'WHERE result = "stale"', { size: 10, color: C.acc });
  d.arrow(376, 160, 404, 130, { stroke: C.acc, hl: 6 });
  d.text(505, 180, 'not grep "score looks old"', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_06() {
  const d = illustration('sd_observability_06', 'ONE REQUEST ID FOLLOWS THE CALL THROUGH GATEWAY, API AND DATABASE CLIENT', 300);
  seq3(d, [['gateway', 'srv'], ['API', 'srv'], ['DB client', 'db']], [[0, 1, 'req r41'], [1, 2, 'req r41, attempt 1'], [2, 1, 'result tagged r41', true]]);
  return d.svg();
}
export function sd_observability_07() {
  const d = illustration('sd_observability_07', 'A REDELIVERY IS A NEW ATTEMPT CARRYING THE SAME EVENT ID e9', 300);
  const r = [['API', 'command accepted', 'event e9 stored'], ['worker', 'delivery 1', 'effect applied'], ['retry', 'delivery 2, same e9', 'duplicate suppressed']];
  r.forEach(([s, a, b], i) => { const y = 60 + i * 66, hot = i === 2; d.server(40, y - 6, 40, 40, { unit: 12 }); d.text(100, y + 14, s, { cls: 'ttl', a: 'start', size: 12 }); chip(d, 200, y, 170, a, false, 28); chip(d, 390, y, 190, b, hot, 28); });
  d.text(320, 270, 'the API request id belongs to the first hop; e9 links the whole story', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_08() {
  const d = illustration('sd_observability_08', 'REDACT AT THE SOURCE, KEEP FOR A BOUNDED TIME, AND STILL LIMIT WHO CAN QUERY', 280);
  chain(d, [['allowed fields', 'no tokens, no PII'], ['redact at source', 'before the queue'], ['bounded storage', '30-day retention'], ['scoped query', 'role-checked']], 3, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 18, y - 24, 36, 48); if (i === 1) { g.doc(x - 18, y - 24, 36, 48); g.fillRect(x - 12, y - 6, 24, 8, C.ink); } if (i === 2) g.db(x - 22, y - 24, 44, 48); if (i === 3) g.lock(x - 16, y - 22, 32, { stroke: C.acc, fill: C.accSoft }); }, null);
  return d.svg();
}
export function sd_observability_09() {
  const d = illustration('sd_observability_09', 'TWO COUNTER SAMPLES 60 S APART: 60,000 ATTEMPTS AND 600 FAILURES = 1,000/S, 1% FAILED', 300);
  const X = 60, W = 520;
  d.lines([[X, 220], [X + W, 100]], { stroke: C.ink2, single: true, sw: 1.6 });
  d.lines([[X, 230], [X + W, 222]], { stroke: C.acc, single: true, sw: 1.6 });
  d.dot(X, 220, 4, C.ink); d.dot(X + W, 100, 4, C.ink); d.dot(X + W, 222, 4, C.acc);
  d.text(X + W - 10, 86, 'attempts +60,000', { cls: 'xs', a: 'end' }); d.text(X + W - 10, 244, 'failures +600', { cls: 'xs', a: 'end', color: C.acc });
  d.text(X, 250, 't', { cls: 'xs' }); d.text(X + W, 262, 't + 60 s', { cls: 'xs' });
  d.mono(320, 150, '60,000 ÷ 60 = 1,000/s · 600 ÷ 60,000 = 1%', { size: 11, color: C.acc });
  return d.svg();
}
export function sd_observability_10() {
  const d = illustration('sd_observability_10', '32 OF 40 POOL SLOTS BUSY (0.8) TELLS YOU NOTHING ABOUT WHO IS WAITING', 300);
  for (let i = 0; i < 40; i++) d.rect(60 + (i % 10) * 34, 70 + Math.floor(i / 10) * 34, 28, 28, { r: 3, fill: i < 32 ? C.card : C.paper, stroke: i < 32 ? C.ink2 : C.faint });
  d.text(225, 220, 'busy 32 / 40 = 0.8', { cls: 'sm' });
  for (let k = 0; k < 5; k++) d.person(460 + k * 26, 120, 24, { stroke: C.acc });
  d.text(512, 166, 'waiters: a separate gauge', { cls: 'xs', color: C.acc });
  d.text(320, 266, 'measure acquisition delay; cancelled waits must leave the gauge', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_11() {
const d=illustration('sd_observability_11','LATENCY BUCKET COUNTS SHOW WHERE THE REQUESTS LANDED',335);
  const counts=[50,45,4,1],names=['≤ 5','(5,40]','(40,100]','(100,200]'];
  counts.forEach((v,i)=>{const x=70+i*140,h=v*3.6;d.rect(x,246-h,90,h,{r:1,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono(x+45,229-h,v,{size:13});d.mono(x+45,273,names[i],{size:10});});
  d.line(44,248,604,248,{stroke:C.ink2,single:true});d.text(319,307,'50 + 45 + 4 + 1 = 100 requests; bucket bounds in ms',{cls:'sm'});return d.svg();
}
export function sd_observability_12() {
  const d = illustration('sd_observability_12', 'ADDING A user LABEL TURNS 360 SERIES INTO 18,000,000 BEFORE HISTOGRAM BUCKETS', 300);
  const r = [['base labels', 360, '360 series'], ['× 14 histogram series', 5040, '5,040 series'], ['+ user label', 18000000, '18,000,000 base series']];
  r.forEach(([s, v, t], i) => { const y = 70 + i * 60, hot = i === 2; d.text(40, y + 14, s, { cls: 'sm', a: 'start' }); const w = Math.max(6, Math.log10(v) / Math.log10(18000000) * 340); d.rect(230, y, w, 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.mono(230 + w + 8, y + 14, t, { size: 10, a: 'start', color: hot ? C.acc : undefined }); });
  d.text(320, 270, 'bar lengths on a log scale; every request-id label multiplies every bucket', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_13() {
const d=illustration('sd_observability_13','CHILD SPANS SIT INSIDE A PARENT SPAN, NOT AFTER IT',305);
  const X=t=>103+t*2.45;
  d.text(35,91,'request',{cls:'ttl',a:'start'});d.rect(X(0),69,490,40,{r:1,fill:C.card,stroke:C.ink2});d.mono(X(100),89,'200 ms parent',{size:12});
  d.text(35,176,'DB',{cls:'ttl',a:'start'});d.rect(X(40),155,120*2.45,40,{r:1,fill:C.accSoft,stroke:C.acc});d.mono(X(100),175,'120 ms child',{size:12});
  [0,40,160,200].forEach(t=>{d.line(X(t),214,X(t),225,{stroke:C.line,single:true});d.mono(X(t),244,t,{size:10});});
  d.text(320,278,'200 − 120 = 80 ms outside child; illustrative child placement',{cls:'sm'});return d.svg();
}
export function sd_observability_14() {
  const d = illustration('sd_observability_14', 'EXTRACT THE TRACE CONTEXT ON THE WAY IN, INJECT IT ON THE WAY OUT', 300);
  seq3(d, [['ingress', 'srv'], ['API', 'srv'], ['dependency', 'db']], [[0, 1, 'traceparent: 00-4bf9…'], [1, 2, 'inject parent span'], [2, 1, 'child span connected', true]]);
  return d.svg();
}
export function sd_observability_15() {
const d=illustration('sd_observability_15','PARALLEL DEPENDENCIES ADD THEIR MAXIMUM WAIT, NOT THEIR SUM',310);
  const X=t=>159+t*3;
  [['score',0,120],['profile',0,80],['assembly',120,140]].forEach(([s,a,b],i)=>{const y=75+i*62;d.text(36,y+19,s,{cls:'ttl',a:'start'});d.rect(X(a),y,(b-a)*3,36,{r:1,fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2});d.mono((X(a)+X(b))/2,y+18,`${b-a} ms`,{size:11});});
  [0,80,120,140].forEach(t=>d.mono(X(t),273,t,{size:10}));d.text(320,298,'max(120, 80) + 20 = 140 ms on the critical path',{cls:'sm'});return d.svg();
}
export function sd_observability_16() {
  const d = illustration('sd_observability_16', 'A BATCH SPAN LINKS BOTH CAUSES; ITS PROVIDER CALL TIMED OUT AND MAY STILL HAVE ACTED', 300);
  d.rect(40, 70, 160, 34, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(120, 87, 'request A span', { cls: 'xs' });
  d.rect(40, 120, 160, 34, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(120, 137, 'request B span', { cls: 'xs' });
  d.rect(280, 90, 300, 44, { r: 4, fill: C.paper, stroke: C.ink2 }); d.text(430, 112, 'batch span (links A, B)', { cls: 'sm' });
  d.carrow([[200, 87], [240, 100], [276, 106]], { stroke: C.gray, dash: [3, 3] }); d.carrow([[200, 137], [240, 124], [276, 118]], { stroke: C.gray, dash: [3, 3] });
  d.rect(320, 160, 220, 34, { r: 4, fill: C.accSoft, stroke: C.acc }); d.text(430, 177, 'provider call: timeout', { cls: 'xs', color: C.acc });
  d.text(320, 240, 'status "error" on the span; the external effect is unknown, not absent', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_17() {
  const d = illustration('sd_observability_17', 'HEAD SAMPLING AT 1%: 1,000 REQUESTS/S → ABOUT 10 TRACES/S, 24,000 B/S EXPORTED', 280);
  for (let i = 0; i < 50; i++) d.dot(40 + (i % 10) * 16, 80 + Math.floor(i / 10) * 16, 3, C.ink2);
  d.text(110, 176, '1,000 requests/s', { cls: 'xs' });
  d.poly([[230, 80], [300, 120], [230, 160]], { fill: C.card, stroke: C.ink2 }); d.text(250, 176, 'decide at start', { cls: 'xs' });
  d.dot(340, 120, 4, C.acc); d.text(420, 120, '≈ 10 traces/s', { cls: 'sm', color: C.acc });
  d.mono(420, 146, '24,000 B/s', { size: 10 });
  d.text(320, 230, 'a discarded failing request is gone; keep full-population counters beside it', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_18() {
  const d = illustration('sd_observability_18', 'TAIL SAMPLING HOLDS 10 S OF TRACES (10,000, 24,000,000 B) TO KEEP THE SLOW AND FAILED', 300);
  d.rect(60, 70, 260, 120, { r: 8, fill: C.paper, stroke: C.ink2 }); d.text(190, 60, 'buffer: 1,000 traces/s × 10 s', { cls: 'xs' });
  for (let i = 0; i < 60; i++) d.dot(76 + (i % 15) * 16, 90 + Math.floor(i / 15) * 22, 3, i % 17 === 3 ? C.acc : C.ink2);
  d.arrow(326, 130, 400, 130, { stroke: C.ink2 });
  d.rect(410, 100, 190, 60, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(505, 122, 'keep slow / error', { cls: 'sm', color: C.acc }); d.text(505, 142, 'and decide on late spans', { cls: 'xs' });
  d.text(320, 240, 'route all spans of one trace to the same sampler', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_19() {
  const d = illustration('sd_observability_19', 'IN 1,200/S, OUT 1,000/S FOR 60 S = 12,000 QUEUED; 400/S SPARE DRAINS IT IN 30 S', 280);
  const X = 60, s = 3.6;
  d.line(X, 200, X + 100 * s, 200, { stroke: C.ink2, single: true }); d.line(X, 70, X, 200, { stroke: C.ink2, single: true });
  d.lines([[X, 200], [X + 60 * s, 80], [X + 90 * s, 200]], { stroke: C.acc, sw: 2, single: true });
  d.mono(X + 60 * s, 68, '12,000', { size: 10, color: C.acc });
  d.text(X + 30 * s, 216, 'overload 60 s', { cls: 'xs' }); d.text(X + 75 * s, 216, 'drain 30 s', { cls: 'xs', color: C.acc });
  d.travel([[X, 200], [X + 60 * s, 80], [X + 90 * s, 200]], { dur: 5, r: 4 });
  d.text(520, 120, 'alert on the\noldest queued age', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_observability_20() {
  const d = illustration('sd_observability_20', 'SEND A KNOWN TEST EVENT AND CHECK IT TURNS UP IN A QUERY, FRESH', 300);
  seq3(d, [['synthetic source', 'srv'], ['collector', 'srv'], ['query backend', 'db']], [[0, 1, 'test event t=12:00:05'], [1, 2, 'export + index'], [2, 0, 'visible, 4 s old', true]]);
  return d.svg();
}
export function sd_observability_21() {
  const d = illustration('sd_observability_21', 'OFFERED, ADMITTED, COMPLETED: RETRIES INFLATE THE FIRST, NOT THE LAST', 300);
  [['offered', 1000, 'includes retries'], ['admitted', 820, 'after the limiter'], ['useful completions', 640, 'separate from failures']].forEach(([s, v, t], i) => { const y = 66 + i * 64, hot = i === 2; d.text(40, y + 14, s, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined }); d.rect(220, y, v * 0.3, 28, { r: 2, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(230 + v * 0.3, y + 14, t, { cls: 'xs', a: 'start' }); });
  d.text(320, 270, 'illustrative proportions; plan capacity from useful demand, not attempts', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_22() {
  const d = illustration('sd_observability_22', '9/900 (1%) + 10/100 (10%) = 19/1,000 = 1.9% FOR THE FLEET', 300);
  [['region A', 900, 9], ['region B', 100, 10]].forEach(([s, n, f], i) => { const y = 70 + i * 70; d.text(40, y + 14, s, { cls: 'ttl', a: 'start', size: 12 }); d.rect(160, y, n * 0.36, 28, { r: 2, fill: C.card, stroke: C.ink2 }); d.fillRect(160 + n * 0.36 - f * 0.36 * 4, y + 1, f * 0.36 * 4, 26, C.accSoft); d.mono(170 + n * 0.36, y + 14, `${f} / ${n} = ${f / n * 100}%`, { size: 10, a: 'start' }); });
  d.mono(320, 230, 'fleet: 19 / 1,000 = 1.9%, not (1% + 10%) / 2', { size: 11, color: C.acc });
  d.text(320, 262, 'keep the 10% region visible beside the weighted number', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_23() {
  const d = illustration('sd_observability_23', 'DEMAND HITS A RESOURCE LIMIT, BECOMES WAITING OR REJECTION, THEN A USER-VISIBLE DELAY', 280);
  chain(d, [['demand', 'requests'], ['resource limit', 'CPU, memory, pool'], ['wait or reject', 'queue grows'], ['user delay', 'what they feel']], 3, (g, i, x, y, hot) => { if (i === 0) for (let k = 0; k < 4; k++) g.envelope(x - 30 + k * 14, y - 10 + (k % 2) * 6, 16, 11); if (i === 1) g.cpu(x - 20, y - 20, 40); if (i === 2) for (let k = 0; k < 4; k++) g.person(x - 30 + k * 20, y - 14, 20); if (i === 3) g.clock(x, y, 40, { spin: 3 }); }, null);
  return d.svg();
}
export function sd_observability_24() {
  const d = illustration('sd_observability_24', 'QUEUE AGE, POOL WAIT AND CACHE HITS (900 / 1,000 = 0.9) ARE THREE DIFFERENT GAUGES', 300);
  panel(d, 20, 44, 190, 200, 'queue');
  d.tape(40, 100, ['', '', '', ''], { cw: 36, h: 26 }); d.text(115, 160, 'depth AND oldest age', { cls: 'xs' });
  panel(d, 225, 44, 190, 200, 'database pool');
  for (let k = 0; k < 4; k++) d.rect(250 + k * 36, 96, 28, 40, { r: 3, fill: C.card, stroke: C.ink2 }); d.text(320, 160, 'busy + acquisition wait', { cls: 'xs' });
  panel(d, 430, 44, 190, 200, 'cache', true);
  for (let i = 0; i < 10; i++) d.rect(450 + i * 15, 106, 12, 24, { r: 1, fill: i < 9 ? C.accSoft : C.paper, stroke: C.acc });
  d.text(525, 160, '0.9 hits: read with\nsource load + freshness', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_observability_25() {
  const d = illustration('sd_observability_25', 'AN SLI: TAKE EACH ELIGIBLE REQUEST, JUDGE IT GOOD OR BAD, THEN FORM THE WINDOW RATIO', 280);
  chain(d, [['eligible request', 'in the promise'], ['fresh and timely?', 'classify'], ['good or bad', 'counted'], ['window ratio', 'good ÷ eligible']], 3, (g, i, x, y, hot) => { if (i === 0) g.envelope(x - 20, y - 12, 40, 26); if (i === 1) { g.clock(x - 14, y, 28); tick(g, x + 16, y, 6, C.ink2); } if (i === 2) { tick(g, x - 12, y, 7, C.ink2); cross(g, x + 14, y, 6, C.ink2); } if (i === 3) g.mono(x, y, '99.9%', { size: 12, color: C.acc }); }, 'requests that never reached the handler need an external probe');
  return d.svg();
}
export function sd_observability_26() {
  const d = illustration('sd_observability_26', '2,592,000,000 ELIGIBLE REQUESTS × 0.001 = 2,592,000 BAD ONES ALLOWED THIS WINDOW', 280);
  const X = 60, W = 520;
  d.rect(X, 90, W, 40, { r: 2, fill: C.card, stroke: C.ink2 }); d.fillRect(X + W - 6, 91, 5, 38, C.acc);
  d.text(X + W / 2, 110, '2,592,000,000 eligible requests', { cls: 'sm' });
  d.line(X + W - 3, 136, X + W - 3, 160, { stroke: C.acc, single: true }); d.text(X + W - 3, 174, 'budget: 2,592,000', { cls: 'xs', a: 'end', color: C.acc });
  d.text(320, 230, 'an outage at match time burns more of it than one at 4 a.m.', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_27() {
  const d = illustration('sd_observability_27', 'A FAST REPLY PROVES AVAILABILITY ONLY; FRESHNESS AND DURABILITY NEED THEIR OWN EVIDENCE', 300);
  const rows = ['availability', 'freshness', 'durability'], cols = ['fast reply', 'right version', 'recoverable write'];
  cols.forEach((c, j) => d.text(250 + j * 130, 66, c, { cls: 'sm' }));
  rows.forEach((r, i) => { const y = 86 + i * 50; d.text(160, y + 16, r, { cls: 'ttl', a: 'end', size: 12 }); cols.forEach((c, j) => { const ok = i === j; d.rect(190 + j * 130, y, 120, 34, { r: 4, fill: ok ? C.accSoft : C.paper, stroke: ok ? C.acc : C.faint }); d.text(250 + j * 130, y + 17, ok ? 'proves it' : 'not enough', { cls: 'xs', color: ok ? C.acc : C.gray }); }); });
  return d.svg();
}
export function sd_observability_28() {
  const d = illustration('sd_observability_28', 'NO TRAFFIC, SPARSE TRAFFIC AND MISSING DATA LOOK THE SAME ON A NAIVE CHART', 300);
  const p = [['no traffic', 'ratio undefined', []], ['sparse', 'show the count (n = 3)', [40, 110, 170]], ['missing data', 'warn: last sample 12 min ago', null]];
  p.forEach(([s, t, pts], i) => {
    const x = 20 + i * 205, hot = i === 2;
    panel(d, x, 44, 190, 200, s, hot);
    d.line(x + 20, 180, x + 170, 180, { stroke: C.line, single: true });
    if (pts) pts.forEach((px) => d.dot(x + 10 + px * 0.9, 140, 4, C.ink2));
    else { d.rect(x + 30, 100, 130, 60, { r: 4, stroke: C.acc, dash: [4, 3] }); d.text(x + 95, 130, '?', { size: 22, color: C.acc }); }
    d.text(x + 95, 216, t, { cls: 'xs', color: hot ? C.acc : undefined });
  });
  return d.svg();
}
export function sd_observability_29() {
  const d = illustration('sd_observability_29', 'ALLOWED 0.001 BAD, OBSERVED 0.01: THE BUDGET BURNS 10× FASTER THAN SUSTAINABLE', 280);
  const X = 60, W = 520;
  d.line(X, 200, X + W, 200, { stroke: C.ink2, single: true });
  d.line(X, 200, X + W, 180, { stroke: C.ink2, dash: [4, 3], single: true }); d.text(X + W, 170, 'sustainable (1×)', { cls: 'xs', a: 'end' });
  d.line(X, 200, X + W / 5, 60, { stroke: C.acc, sw: 2, single: true }); d.text(X + W / 5 + 10, 60, '10× burn', { cls: 'sm', a: 'start', color: C.acc });
  d.mono(320, 240, '0.01 ÷ 0.001 = 10', { size: 12 });
  return d.svg();
}
export function sd_observability_30() {
  const d = illustration('sd_observability_30', 'PAGE ONLY WHEN THE LONG WINDOW AND THE SHORT WINDOW BOTH SHOW A HIGH BURN', 300);
  d.rect(60, 80, 360, 40, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(240, 100, 'long window (1 h): burning?', { cls: 'sm' });
  d.rect(330, 136, 90, 40, { r: 4, fill: C.card, stroke: C.ink2 }); d.text(375, 156, '5 min: still?', { cls: 'xs' });
  d.arrow(426, 128, 480, 128, { stroke: C.acc });
  d.rect(490, 104, 110, 48, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(545, 128, 'page', { cls: 'ttl', color: C.acc });
  d.text(320, 240, 'the short window stops a page for damage that has already ended', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_31() {
  const d = illustration('sd_observability_31', 'A GOOD ALERT NAMES THE HARM, AN OWNER, ONE BOUNDED ACTION AND HOW TO SEE IT WORKED', 280);
  chain(d, [['user harm', 'stale scores'], ['named owner', 'score team'], ['bounded action', 'shed reads 20%'], ['recovery check', 'freshness back?']], 3, (g, i, x, y, hot) => { if (i === 0) g.phone(x - 14, y - 26, 50); if (i === 1) g.person(x, y - 22, 34); if (i === 2) g.gear(x, y, 22); if (i === 3) tick(g, x, y, 12, C.acc); }, null);
  return d.svg();
}
export function sd_observability_32() {
  const d = illustration('sd_observability_32', 'WRITE THE PREDICTION DOWN, MITIGATE, THEN LET THE EVIDENCE CONFIRM OR REJECT IT', 300);
  seq3(d, [['responder', 'person'], ['system', 'srv'], ['evidence', 'doc']], [[0, 2, 'predict: hits recover'], [0, 1, 'roll back key change'], [1, 2, 'measure user delay'], [2, 0, 'confirm or reject', true]]);
  return d.svg();
}
export function sd_observability_33() {
  const d = illustration('sd_observability_33', 'THE SCORE READ: STALE CACHE, DURABLE READ, AND THE CLIENT CHECKS THE VERSION LAST', 300);
  seq3(d, [['viewer', 'phone'], ['API', 'srv'], ['cache / DB', 'db']], [[0, 1, 'read, trace context'], [1, 2, 'cache stale → DB'], [2, 1, 'v12 returned'], [1, 0, 'client checks v ≥ 12', true]]);
  return d.svg();
}
export function sd_observability_34() {
  const d = illustration('sd_observability_34', 'EVIDENCE IS SEARCHABLE ONLY AFTER BUFFER, COLLECTOR, STORAGE AND INDEX', 280);
  chain(d, [['SDK buffer', 'in process'], ['collector queue', 'received'], ['durable backend', 'stored'], ['queryable', 'indexed']], 3, (g, i, x, y, hot) => { if (i === 0) g.ram(x - 30, y - 16, 60, 32); if (i === 1) g.tape(x - 36, y - 12, ['', '', ''], { cw: 24, h: 24 }); if (i === 2) g.db(x - 22, y - 24, 44, 48); if (i === 3) g.doc(x - 18, y - 24, 36, 48, { fill: C.accSoft, stroke: C.acc }); }, 'a request succeeding proves nothing about its log surviving');
  return d.svg();
}
export function sd_observability_35() {
  const d = illustration('sd_observability_35', 'DISCONNECT THE COLLECTOR: THE SERVICE CONTINUES, THE QUEUE FILLS TO ITS BOUND, THEN DRAINS', 300);
  const X = 60, W = 520;
  d.line(X, 220, X + W, 220, { stroke: C.ink2, single: true });
  d.lines([[X, 220], [X + 150, 100], [X + 300, 100], [X + 420, 220]], { stroke: C.acc, sw: 2, single: true });
  d.line(X, 100, X + W, 100, { stroke: C.ink2, dash: [4, 3], single: true }); d.text(X + W, 90, 'queue bound', { cls: 'xs', a: 'end' });
  d.text(X + 75, 240, 'disconnected', { cls: 'xs' }); d.text(X + 225, 240, 'full: counted drops', { cls: 'xs' }); d.text(X + 360, 240, 'restored: drains', { cls: 'xs', color: C.acc });
  d.travel([[X, 220], [X + 150, 100], [X + 300, 100], [X + 420, 220]], { dur: 6, r: 4 });
  d.text(320, 280, 'replayed events keep their original timestamps', { cls: 'xs' });
  return d.svg();
}
export function sd_observability_36() {
  const d = illustration('sd_observability_36', 'FROM REVIEW TO PREVENTION: CHANGE ONE MECHANISM, THEN REPEAT THE FAILURE TO PROVE IT', 280);
  chain(d, [['failure chain', 'as observed'], ['specific change', 'miss coalescing'], ['repeat test', 'same key change'], ['check outcome', 'user delay held']], 3, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 18, y - 24, 36, 48); if (i === 1) g.gear(x, y, 22); if (i === 2) bolt(g, x, y - 18); if (i === 3) tick(g, x, y, 12, C.acc); }, null);
  return d.svg();
}

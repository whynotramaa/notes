import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const trio = (d, st, hotIdx, icons, note) => { st.forEach(([a, b], i) => { const x = 40 + i * 200, hot = i === hotIdx; panel(d, x, 48, 170, 190, a, hot); if (icons) icons(d, i, x + 85, 118, hot); d.text(x + 85, 204, b, { cls: 'xs', vc: true, color: hot ? C.acc : undefined }); if (i < st.length - 1) d.arrow(x + 172, 143, x + 198, 143, { stroke: C.gray, hl: 5 }); }); if (note) d.text(320, 270, note, { cls: 'xs' }); };
const num = (d, x, y, s, hot = false) => d.mono(x, y, s, { size: 12, color: hot ? C.acc : undefined });
export function where_sd_interview_method(stage=99) { return systemMap("sd_interview_method", ["Requirements gathering", "Back-of-the-envelope estimation", "API design", "Data model", "High-level architecture", "Critical request flows", "Bottlenecks and scaling", "Failures and consistency", "Trade-offs and the final answer"], stage); }
export function cover_sd_interview_method() { return systemCover("sd_interview_method", 21, ["The design", "interview"], "The system design interview", ["Requirements gathering", "Back-of-the-envelope estimation", "API design", "Data model", "High-level architecture", "Critical request flows", "Bottlenecks and scaling", "Failures and consistency", "Trade-offs and the final answer"]); }
export function sd_interview_method_01() {
const d=illustration('sd_interview_method_01','A REQUIREMENT NAMES AN ACTOR, AN ACTION AND AN OBSERVABLE RESULT',330);
  d.person(89,91,58);d.text(89,182,'scorer',{cls:'ttl'});d.person(549,91,58);d.text(549,182,'viewer',{cls:'ttl'});
  d.doc(227,63,186,160,{lines:false,fill:C.accFaint,stroke:C.acc});d.text(320,91,'score operation',{cls:'ttl'});d.mono(320,132,'update → committed',{size:11});d.mono(320,166,'read → fresh result',{size:11});
  d.arrow(130,134,219,134,{stroke:C.acc});d.arrow(421,166,510,166,{stroke:C.ink2});
  d.text(320,277,'write requirements as tests of user-visible behavior',{cls:'sm'});return d.svg();
}
export function sd_interview_method_02() {
  const d = illustration('sd_interview_method_02', 'TURN "FAST, DURABLE, CONSISTENT" INTO TESTS WITH AN OPERATION, A POPULATION AND A FAILURE', 300);
  trio(d, [['latency', 'p99 of score reads\nat the viewer edge'], ['durability', 'accepted score survives\nloss of one node'], ['consistency', 'a scorer reads the\nversion she wrote']], 2, (g, i, x, y, hot) => { if (i === 0) g.clock(x, y, 50); if (i === 1) g.disk(x, y, 50); if (i === 2) g.mono(x, y, 'v ≥ 8', { size: 14, color: C.acc }); }, 'a system-wide adjective is not a requirement');
  return d.svg();
}
export function sd_interview_method_03() {
  const d = illustration('sd_interview_method_03', 'TWO SITES CANNOT TALK AND BOTH WANT SEAT 14C: SERVE BOTH, OR KEEP ONE WINNER', 320);
  d.server(60, 70, 70, 80, { unit: 15, label: 'site A' }); d.server(510, 70, 70, 80, { unit: 15, label: 'site B' });
  let p = 'M320,50'; for (let y = 50, k = 0; y < 170; y += 14, k++) p += ` L${320 + (k % 2 ? -7 : 7)},${y + 14}`; d.path(p, { stroke: C.acc, sw: 1.8, single: true, dash: [5, 4] });
  d.person(160, 80, 30); d.person(470, 80, 30); d.mono(160, 130, '14C?', { size: 10 }); d.mono(470, 130, '14C?', { size: 10 });
  panel(d, 40, 190, 260, 90, 'serve both locally'); d.text(170, 250, 'available, but two winners', { cls: 'xs' });
  panel(d, 340, 190, 260, 90, 'preserve one winner', true); d.text(470, 250, 'delay or reject one side', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_interview_method_04() {
  const d = illustration('sd_interview_method_04', 'GIVEN, ASSUMED, COMPUTED: THREE COLUMNS IN THE ASSUMPTION LEDGER', 300);
  trio(d, [['given', 'user actions;\nthe binding contract'], ['assumed', 'rate, bytes, failure;\nlabelled illustrative'], ['computed', 'derived demand,\nunits kept']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 28, 40, 54); if (i === 1) g.hand(x, y, '≈ ?', { size: 26 }); if (i === 2) g.mono(x, y, '= 1,000/s', { size: 12, color: C.acc }); }, 'change an input and only its descendants change');
  return d.svg();
}
export function sd_interview_method_05() {
  const d = illustration('sd_interview_method_05', '8,640,000 REQUESTS/DAY ÷ 86,400 S = 100/S AVERAGE; × 10 PEAK = 1,000/S', 300);
  trio(d, [['daily', '8,640,000 requests'], ['average', '÷ 86,400 s'], ['peak', '× 10 (stated)']], 2, (g, i, x, y, hot) => { if (i === 0) g.clock(x, y, 50); if (i === 1) num(g, x, y, '100/s'); if (i === 2) num(g, x, y, '1,000/s', true); }, 'name the peak multiplier separately; it is an assumption');
  return d.svg();
}
export function sd_interview_method_06() {
  const d = illustration('sd_interview_method_06', '1,000 REQUESTS/S × 0.2 S EACH = 200 IN FLIGHT, IF BOTH COVER THE SAME REQUESTS', 300);
  trio(d, [['throughput', '1,000 per second'], ['mean time', '0.2 s, same boundary'], ['in flight', 'L = λW = 200']], 2, (g, i, x, y, hot) => { if (i === 0) for (let k = 0; k < 4; k++) g.travel([[x - 50, y], [x + 50, y]], { dur: 1.6, at: [k / 4, k / 4 + 0.5], r: 3, color: C.ink2 }); if (i === 1) g.clock(x, y, 50); if (i === 2) for (let k = 0; k < 20; k++) g.dot(x - 45 + (k % 10) * 10, y - 6 + Math.floor(k / 10) * 12, 3, C.acc); }, 'excluding pool wait from W while λ includes it breaks the product');
  return d.svg();
}
export function sd_interview_method_07() {
  const d = illustration('sd_interview_method_07', '4.32 GB/DAY × 30 DAYS = 129.6 GB; × 3 COPIES = 388.8 GB BEFORE OVERHEAD', 300);
  trio(d, [['daily', '4,320,000,000 B'], ['30 days', '129,600,000,000 B'], ['three copies', '388,800,000,000 B']], 2, (g, i, x, y, hot) => { if (i === 0) g.db(x - 20, y - 24, 40, 48); if (i === 1) for (let k = 0; k < 5; k++) g.db(x - 50 + k * 20, y - 20, 18, 40); if (i === 2) [0, 1, 2].forEach((k) => g.db(x - 44 + k * 30, y - 24, 26, 48, { fill: C.accSoft, stroke: C.acc })); }, 'indexes, logs and compaction space come next');
  return d.svg();
}
export function sd_interview_method_08() {
  const d = illustration('sd_interview_method_08', 'API RESPONSES: 2,000,000 B/S. LIVE FAN-OUT: 1,000,000 DELIVERIES/S, 200,000,000 B/S', 300);
  panel(d, 20, 44, 260, 210, 'API');
  d.server(120, 90, 60, 70, { unit: 15 }); d.mono(150, 190, '2,000,000 B/s', { size: 10 });
  panel(d, 300, 44, 320, 210, 'live deliveries', true);
  d.server(320, 100, 50, 60, { unit: 14, led: () => true });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) d.phone(400 + c * 28, 70 + r * 36, 28, { stroke: C.gray });
  d.mono(460, 228, '200,000,000 B/s', { size: 10, color: C.acc });
  d.text(320, 280, 'recipients multiply delivery; API throughput does not', { cls: 'xs' });
  return d.svg();
}
export function sd_interview_method_09() {
  const d = illustration('sd_interview_method_09', 'A CLIP MOVES THROUGH STATES THE CLIENT CAN QUERY: PENDING, PROCESSING, PLAYABLE', 300);
  trio(d, [['create', 'clip + upload\nsession: pending'], ['bytes complete', 'verified object:\nprocessing'], ['publish', 'playable state,\nclient can query']], 2, (g, i, x, y, hot) => { g.doc(x - 22, y - 30, 44, 58, { lines: false, fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); if (i === 1) g.gear(x, y, 14, { spin: 4 }); if (i === 2) g.poly([[x - 6, y - 10], [x - 6, y + 10], [x + 10, y]], { fill: C.acc, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_10() {
  const d = illustration('sd_interview_method_10', 'VALIDATE THE INPUT, ESTABLISH THE CALLER, THEN AUTHORIZE THIS SPECIFIC EFFECT', 300);
  trio(d, [['validation', 'form and size'], ['authentication', 'who is calling'], ['authorization', 'may she do this\nto this resource?']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 26, 40, 52); if (i === 1) g.key(x - 16, y, 34); if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, 'an authorized caller can still send an invalid transition');
  return d.svg();
}
export function sd_interview_method_11() {
  const d = illustration('sd_interview_method_11', 'NEW CLIPS SHIFT AN OFFSET; A CURSOR KEEPS ITS BOUNDARY AND STILL CHECKS PERMISSION', 300);
  trio(d, [['first page', 'order + tie breaker'], ['new clips arrive', 'offset 20 now\npoints elsewhere'], ['continue', 'cursor context +\ncurrent permission']], 2, (g, i, x, y, hot) => { if (i === 0) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24 }); if (i === 1) g.tape(x - 60, y - 12, ['+', '', '', ''], { cw: 30, h: 24, hot: (k) => k === 0 }); if (i === 2) g.pin(x, y + 14, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_12() {
  const d = illustration('sd_interview_method_12', 'THE EFFECT COMMITTED, THE REPLY VANISHED; THE SAME KEY BRINGS BACK THE STORED RESULT', 300);
  trio(d, [['first attempt', 'key K + payload;\neffect commits'], ['reply lost', 'outcome unknown;\nclient retries'], ['repeat', 'same key, same intent:\nstored result']], 2, (g, i, x, y, hot) => { if (i === 0) g.envelope(x - 24, y - 14, 48, 28, { label: 'K' }); if (i === 1) bolt(g, x, y - 20); if (i === 2) g.envelope(x - 24, y - 14, 48, 28, { fill: C.accSoft, stroke: C.acc, label: 'K' }); }, null);
  return d.svg();
}
export function sd_interview_method_13() {
  const d = illustration('sd_interview_method_13', 'THE CLIP ROW OWNS IDENTITY AND PERMISSION; FEED AND SEARCH ONLY POINT AT IT', 300);
  d.doc(250, 60, 140, 90, { lines: false }); d.text(320, 86, 'clip (authority)', { cls: 'ttl', size: 12 }); d.mono(320, 112, 'key · owner · state', { size: 9 });
  d.rect(40, 190, 160, 50, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(120, 215, 'object bytes', { cls: 'sm' });
  d.rect(440, 190, 160, 50, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(520, 215, 'feed / search entry', { cls: 'sm', color: C.acc });
  d.arrow(260, 150, 160, 186, { stroke: C.ink2, hl: 6 }); d.arrow(510, 186, 380, 150, { stroke: C.acc, hl: 6, dash: [4, 3] });
  d.text(320, 280, 'deleting the search entry does not delete the clip', { cls: 'xs' });
  return d.svg();
}
export function sd_interview_method_14() {
  const d = illustration('sd_interview_method_14', 'STATE CHANGE AND WORK INTENTION COMMIT TOGETHER, SO A REPEAT FINDS IT ALREADY DONE', 300);
  trio(d, [['precondition', 'authorized;\nobject complete'], ['local commit', 'state + work\nintention, atomic'], ['repeat', 'already completed:\nsafe result']], 2, (g, i, x, y, hot) => { if (i === 0) tick(g, x, y, 12, C.ink2); if (i === 1) g.db(x - 22, y - 26, 44, 52); if (i === 2) g.envelope(x - 24, y - 14, 48, 28, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_15() {
  const d = illustration('sd_interview_method_15', 'EACH INDEX SERVES ONE ACCESS PATTERN AND COSTS EXTRA WRITES AND BYTES', 300);
  trio(d, [['playback', 'clip id:\npoint lookup'], ['profile page', 'owner + time:\nrange lookup'], ['cost', 'extra writes +\nbytes per index']], 2, (g, i, x, y, hot) => { if (i === 0) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24, hot: (k) => k === 1 }); if (i === 1) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24, hot: () => true }); if (i === 2) { g.db(x - 40, y - 22, 36, 44); g.db(x + 4, y - 22, 36, 44, { fill: C.accSoft, stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_interview_method_16() {
  const d = illustration('sd_interview_method_16', 'SEARCH CAN FIND A CLIP; ONLY THE AUTHORITATIVE CHECK CAN LET YOU WATCH IT', 300);
  trio(d, [['metadata', 'existence +\npermission'], ['search', 'discovery,\nmay lag'], ['serve bytes', 'check the current\nrule first']], 2, (g, i, x, y, hot) => { if (i === 0) g.db(x - 22, y - 26, 44, 52); if (i === 1) { g.circle(x - 6, y - 6, 34, { stroke: C.ink2 }); g.line(x + 6, y + 6, x + 20, y + 20, { stroke: C.ink2, sw: 2, single: true }); } if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, 'derived data cannot grant access');
  return d.svg();
}
export function sd_interview_method_17() {
  const d = illustration('sd_interview_method_17', 'A BOX NEEDS A JOB, AN ARROW NEEDS A PAYLOAD, A SPLIT NEEDS A REASON', 300);
  trio(d, [['component', 'one job,\nowned state'], ['arrow', 'payload, timing,\nacknowledgement'], ['separation', 'an operational\nreason, not habit']], 2, (g, i, x, y, hot) => { if (i === 0) g.server(x - 24, y - 26, 48, 52, { unit: 14 }); if (i === 1) { g.arrow(x - 50, y, x + 50, y, { stroke: C.ink2 }); g.envelope(x - 12, y - 18, 24, 14); } if (i === 2) { g.server(x - 50, y - 22, 36, 44, { unit: 12 }); g.line(x, y - 30, x, y + 30, { stroke: C.acc, dash: [4, 3], single: true }); g.server(x + 14, y - 22, 36, 44, { unit: 12 }); } }, null);
  return d.svg();
}
export function sd_interview_method_18() {
const d=illustration('sd_interview_method_18','CONTROL MESSAGES AUTHORIZE THE OPERATION; BYTES TAKE THEIR OWN PATH',350);
  d.laptop(37,120,107,{label:'uploader'});d.server(264,54,84,66,{label:'API / control',unit:18});d.db(468,196,105,102,{under:'object storage'});
  d.arrow(151,139,255,86,{stroke:C.ink2});d.text(197,87,'permission',{cls:'sm'});d.arrow(255,115,151,165,{stroke:C.ink2});d.text(228,170,'upload session',{cls:'sm'});
  d.arrow(151,205,458,248,{stroke:C.acc,sw:2});d.mono(296,243,'5,000,000,000 B',{size:12,color:C.acc});
  d.carrow([[520,186],[424,164],[356,104]],{stroke:C.line,hl:6});d.text(479,139,'verify completion',{cls:'sm'});
  return d.svg();
}
export function sd_interview_method_19() {
  const d = illustration('sd_interview_method_19', 'BEFORE THE RESPONSE: VALIDATE AND COMMIT. AFTER IT: WORKERS RESUME FROM DURABLE INTENT', 300);
  trio(d, [['before response', 'validate + commit\n(required)'], ['commit record', 'downstream\nintention, durable'], ['after response', 'notify, project:\nrecoverable workers']], 2, (g, i, x, y, hot) => { if (i === 0) g.server(x - 24, y - 26, 48, 52, { unit: 14 }); if (i === 1) g.doc(x - 20, y - 26, 40, 52); if (i === 2) { g.gear(x - 18, y, 16, { spin: 4 }); g.gear(x + 18, y, 16, { spin: 4, ccw: true, fill: C.accSoft, stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_interview_method_20() {
  const d = illustration('sd_interview_method_20', 'ONE INVARIANT, ONE AUTHORITY: SPLITTING IT INTO SERVICES BUYS A NETWORK WORKFLOW', 300);
  trio(d, [['one invariant', 'one authority,\nlocal rule'], ['separate services', 'network workflow,\nnew failures'], ['modular process', 'clear code modules,\nshared transaction']], 2, (g, i, x, y, hot) => { if (i === 0) g.db(x - 22, y - 26, 44, 52); if (i === 1) { g.server(x - 50, y - 20, 34, 40, { unit: 12 }); bolt(g, x, y - 20, 0.6); g.server(x + 16, y - 20, 34, 40, { unit: 12 }); } if (i === 2) { g.rect(x - 50, y - 26, 100, 52, { r: 6, fill: C.accSoft, stroke: C.acc }); g.line(x, y - 22, x, y + 22, { stroke: C.acc, dash: [3, 3], single: true }); } }, null);
  return d.svg();
}
export function sd_interview_method_21() {
  const d = illustration('sd_interview_method_21', 'THE READ: CHECK PERMISSION AND FRESHNESS, HIT OR FETCH, RETURN THE VERSION SEEN', 300);
  trio(d, [['read', 'permission +\nfreshness need'], ['cache', 'version acceptable?\nhit or fetch'], ['response', 'version + outcome\nat the viewer']], 2, (g, i, x, y, hot) => { if (i === 0) g.phone(x - 14, y - 28, 52); if (i === 1) g.ram(x - 36, y - 16, 72, 32); if (i === 2) g.mono(x, y, 'v8 · fresh', { size: 12, color: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_22() {
  const d = illustration('sd_interview_method_22', 'THE WRITE: KEY + EXPECTED v7 IN, v8 + INTENTION COMMITTED, A RETRY GETS v8 BACK', 300);
  trio(d, [['command', 'key K,\nexpects v7'], ['commit', 'v8 + intention,\ndurable'], ['retry', 'same key:\nstored result v8']], 2, (g, i, x, y, hot) => { if (i === 0) g.envelope(x - 24, y - 14, 48, 28, { label: 'K' }); if (i === 1) g.db(x - 22, y - 26, 44, 52); if (i === 2) g.mono(x, y, 'v8', { size: 16, color: C.acc }); }, 'a different command expecting v7 gets a conflict instead');
  return d.svg();
}
export function sd_interview_method_23() {
  const d = illustration('sd_interview_method_23', 'UPLOAD: A PENDING SESSION, 50 PARTS OF 100,000,000 B RETRIED ONE BY ONE, THEN VERIFY', 300);
  trio(d, [['session', 'pending clip,\nauthorized upload'], ['parts', '50 × 100,000,000 B;\nretry one part'], ['complete', 'verify object,\nprocessing intention']], 2, (g, i, x, y, hot) => { if (i === 0) g.key(x - 16, y, 32); if (i === 1) for (let k = 0; k < 10; k++) g.rect(x - 50 + k * 10, y - 16, 8, 32, { r: 1, fill: k === 6 ? C.accSoft : C.card, stroke: k === 6 ? C.acc : C.line }); if (i === 2) tick(g, x, y, 12, C.acc); }, null);
  return d.svg();
}
export function sd_interview_method_24() {
  const d = illustration('sd_interview_method_24', 'LIVE: A COMMITTED VERSION ENTERS THE STREAM; A RECONNECT RESUMES BY REPLAY OR SNAPSHOT', 300);
  trio(d, [['event', 'committed version\ninto the stream'], ['gateway', 'bounded sockets,\nbounded queues'], ['reconnect', 'last version →\nreplay or snapshot']], 2, (g, i, x, y, hot) => { if (i === 0) g.tape(x - 45, y - 12, ['', '', 'v8'], { cw: 30, h: 24 }); if (i === 1) g.server(x - 24, y - 26, 48, 52, { unit: 14, led: () => true }); if (i === 2) g.phone(x - 14, y - 28, 52, { stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_25() {
  const d = illustration('sd_interview_method_25', 'FIND THE LIMITING RESOURCE, CHANGE THAT MECHANISM, RERUN THE SAME WORKLOAD', 300);
  trio(d, [['symptom', 'read delay at\nthe user boundary'], ['evidence', 'pool, disk or CPU:\nname the limit'], ['change', 'the relevant mechanism,\nsame test workload']], 2, (g, i, x, y, hot) => { if (i === 0) g.clock(x, y, 50, { spin: 3 }); if (i === 1) g.cpu(x - 22, y - 22, 44); if (i === 2) g.gear(x, y, 24, { fill: C.accSoft, stroke: C.acc, spin: 5 }); }, 'a larger instance that does not touch the limit changes nothing');
  return d.svg();
}
export function sd_interview_method_26() {
const d=illustration('sd_interview_method_26','FAILURE HEADROOM IS CAPACITY THAT REMAINS AFTER A LOST OWNER',320);
  for(let i=0;i<5;i++){const x=44+i*121;d.server(x,78,72,104,{label:'300 req/s',unit:24,fill:i===4?C.paper:C.card,stroke:i===4?C.line:C.ink2});if(i===4){d.line(x-3,74,x+75,185,{stroke:C.acc,sw:2,single:true});d.line(x+75,74,x-3,185,{stroke:C.acc,sw:2,single:true});}}
  d.mono(320,237,'normal: 5 × 300 = 1,500 requests/s',{size:13});d.mono(320,270,'after loss: 4 × 300 − 1,000 = 200 requests/s spare',{size:12});return d.svg();
}
export function sd_interview_method_27() {
  const d = illustration('sd_interview_method_27', 'AT 90% HITS THE SOURCE SEES 100 READS/S; WITHOUT THE CACHE IT SEES 1,000, 10×', 300);
  trio(d, [['normal', '1,000 × 0.1 =\n100 source reads/s'], ['cache gone', 'all reads fall through:\n1,000 source reads/s'], ['amplification', '1,000 ÷ 100 = 10×']], 2, (g, i, x, y, hot) => { if (i === 0) { g.ram(x - 36, y - 26, 72, 26); g.arrow(x, y + 4, x, y + 26, { stroke: C.ink2, hl: 4 }); } if (i === 1) { g.ram(x - 36, y - 26, 72, 26); cross(g, x, y - 13, 12, C.ink2); g.arrow(x, y + 4, x, y + 26, { stroke: C.acc, sw: 2.4 }); } if (i === 2) num(g, x, y, '10×', true); }, 'more API instances do not add source capacity');
  return d.svg();
}
export function sd_interview_method_28() {
  const d = illustration('sd_interview_method_28', '200/S GROWTH FOR 60 S = 12,000 QUEUED; 400/S SPARE CLEARS IT IN 30 S', 300);
  trio(d, [['burst', '1,200 in − 1,000 out\n= 200/s growth'], ['after 60 s', '12,000 tasks\nwaiting'], ['recovery', '1,000 − 600 = 400 spare:\n12,000 ÷ 400 = 30 s']], 2, (g, i, x, y, hot) => { if (i === 0) g.arrow(x - 40, y + 20, x + 40, y - 20, { stroke: C.ink2, sw: 2 }); if (i === 1) for (let k = 0; k < 12; k++) g.envelope(x - 48 + (k % 6) * 16, y - 16 + Math.floor(k / 6) * 18, 14, 10); if (i === 2) g.arrow(x - 40, y - 20, x + 40, y + 20, { stroke: C.acc, sw: 2 }); }, 'if service stays below arrivals, there is no finite drain');
  return d.svg();
}
export function sd_interview_method_29() {
  const d = illustration('sd_interview_method_29', 'BEFORE COMMIT: RETRY. AFTER COMMIT: THE REPLY MAY BE LOST. AFTER SEND: DELIVERY MAY REPEAT', 300);
  trio(d, [['before commit', 'no durable effect:\nretry'], ['after commit', 'effect exists;\nreply may be absent'], ['after send', 'delivery may repeat:\ndedupe the effect']], 2, (g, i, x, y, hot) => bolt(g, x, y - 22, 1, hot ? C.acc : C.ink2), null);
  return d.svg();
}
export function sd_interview_method_30() {
  const d = illustration('sd_interview_method_30', 'THE WRITE RETURNED v8; A FOLLOWER AT v7 IS NOT GOOD ENOUGH FOR THAT USER\'S NEXT READ', 300);
  trio(d, [['write reply', 'version 8,\nacknowledged'], ['follower', 'version 7:\nnot adequate'], ['read policy', 'authority, wait,\nor "pending"']], 2, (g, i, x, y, hot) => { if (i === 0) g.mono(x, y, 'v8', { size: 16 }); if (i === 1) { g.server(x - 24, y - 26, 48, 52, { unit: 14 }); g.mono(x + 40, y, 'v7', { size: 11 }); } if (i === 2) g.clock(x, y, 46, { spin: 4 }); }, 'any wait has a deadline');
  return d.svg();
}
export function sd_interview_method_31() {
  const d = illustration('sd_interview_method_31', 'RESTORE, REPLAY, VALIDATE, RECONCILE DEPENDENTS, THEN CUT OVER', 300);
  trio(d, [['starting point', 'backup or replica,\nper failure'], ['recovery', 'restore + replay,\nvalidate'], ['cutover', 'reconcile dependents,\nuser check']], 2, (g, i, x, y, hot) => { if (i === 0) g.disk(x, y, 50); if (i === 1) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24 }); if (i === 2) tick(g, x, y, 12, C.acc); }, null);
  return d.svg();
}
export function sd_interview_method_32() {
  const d = illustration('sd_interview_method_32', 'DROP THE OPTIONAL, PROTECT THE CORE, AND REJECT EARLY WHEN OVERLOADED', 300);
  trio(d, [['optional dependency', 'unavailable:\nomit it safely'], ['core operation', 'own capacity:\ncontinues'], ['overload', 'early bounded rejection,\ncontrolled retry']], 2, (g, i, x, y, hot) => { if (i === 0) { g.server(x - 20, y - 22, 40, 44, { unit: 12, fill: C.paper, stroke: C.gray }); cross(g, x, y, 12, C.gray); } if (i === 1) g.server(x - 24, y - 26, 48, 52, { unit: 14, led: () => true }); if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, 'never skip the authorization check to stay up');
  return d.svg();
}
export function sd_interview_method_33() {
  const d = illustration('sd_interview_method_33', 'COMPARE TWO DESIGNS UNDER THE SAME CONTRACT, WORKLOAD AND FAILURES', 300);
  d.rect(220, 50, 200, 50, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(320, 75, 'same contract + workload', { cls: 'sm' });
  panel(d, 60, 130, 220, 120, 'choice A'); d.text(170, 186, 'benefit / cost', { cls: 'xs' });
  panel(d, 360, 130, 220, 120, 'choice B', true); d.text(470, 186, 'benefit / cost', { cls: 'xs', color: C.acc });
  d.arrow(290, 104, 180, 126, { stroke: C.gray, hl: 5 }); d.arrow(350, 104, 460, 126, { stroke: C.gray, hl: 5 });
  d.text(320, 280, 'if an option changes the invariant, say so: it is a different problem', { cls: 'xs' });
  return d.svg();
}
export function sd_interview_method_34() {
  const d = illustration('sd_interview_method_34', 'THE WHOLE ANSWER: CONTRACT, AUTHORITATIVE FLOW WITH RECOVERY, AND A TESTED TRADE-OFF', 300);
  trio(d, [['contract', 'actions, guarantees,\nassumptions'], ['flow', 'authority + commit,\nrecovery'], ['defence', 'bottleneck + trade-off,\nmeasurable test']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 26, 40, 52); if (i === 1) { g.server(x - 44, y - 18, 34, 36, { unit: 11 }); g.arrow(x - 6, y, x + 6, y, { stroke: C.ink2, hl: 4 }); g.db(x + 10, y - 18, 34, 36); } if (i === 2) g.clock(x, y, 46, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_interview_method_35() {
  const d = illustration('sd_interview_method_35', 'MAKE REVOCATION IMMEDIATE AND THE SIGNED URL NEEDS A CHECK AT EVERY FETCH', 300);
  trio(d, [['old contract', 'URL valid until\nexpiry'], ['new contract', 'denied immediately:\nserving-time check'], ['cost', 'extra state, waiting,\nnew failure policy']], 2, (g, i, x, y, hot) => { if (i === 0) g.clock(x, y, 46); if (i === 1) g.lock(x - 18, y - 24, 36); if (i === 2) g.db(x - 22, y - 26, 44, 52, { fill: C.accSoft, stroke: C.acc }); }, 'and protect direct origin access too');
  return d.svg();
}
export function sd_interview_method_36() {
  const d = illustration('sd_interview_method_36', 'PRACTISE: REDRAW A FLOW, BREAK IT AT A BOUNDARY, CARRY THE MECHANISM TO A NEW SYSTEM', 300);
  trio(d, [['reproduce', 'draw the flow,\nname each state'], ['interrupt', 'fail at a boundary,\nrecover safely'], ['transfer', 'same mechanism,\nnew system']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 26, 40, 52); if (i === 1) bolt(g, x, y - 22); if (i === 2) { g.key(x - 40, y, 28); g.arrow(x - 4, y, x + 16, y, { stroke: C.acc, hl: 5 }); g.key(x + 20, y, 28, { stroke: C.acc, fill: C.accSoft }); } }, 'unknown result at a score API ≈ unknown result at a payment provider');
  return d.svg();
}

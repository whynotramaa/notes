import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const trio = (d, st, hotIdx, icons, note) => { st.forEach(([a, b], i) => { const x = 40 + i * 200, hot = i === hotIdx; panel(d, x, 48, 170, 190, a, hot); if (icons) icons(d, i, x + 85, 118, hot); d.text(x + 85, 204, b, { cls: 'xs', vc: true, color: hot ? C.acc : undefined }); if (i < st.length - 1) d.arrow(x + 172, 143, x + 198, 143, { stroke: C.gray, hl: 5 }); }); if (note) d.text(320, 270, note, { cls: 'xs' }); };
export function where_sd_practice_designs(stage=99) { return systemMap("sd_practice_designs", ["URL shortener, Pastebin, notifications", "Chat, WhatsApp, feed, Dropbox", "Drive, autocomplete, tickets, payments", "Uber, YouTube, Instagram, Docs", "Metrics, scheduler, Kafka, cache", "Designing Redis, Kafka and a database", "Deep dive: money and conflicts", "Deep dive: capacity", "Putting it all together"], stage); }
export function cover_sd_practice_designs() { return systemCover("sd_practice_designs", 22, ["Practice", "designs"], "Practice system designs", ["URL shortener, Pastebin, notifications", "Chat, WhatsApp, feed, Dropbox", "Drive, autocomplete, tickets, payments", "Uber, YouTube, Instagram, Docs", "Metrics, scheduler, Kafka, cache", "Designing Redis, Kafka and a database", "Deep dive: money and conflicts", "Deep dive: capacity", "Putting it all together"]); }
export function sd_practice_designs_01() {
  const d = illustration('sd_practice_designs_01', 'URL SHORTENER: A UNIQUE INSERT CLAIMS "aZ3k"; A REDIRECT READS THE MAPPING AND ITS STATE', 300);
  d.laptop(30, 90, 80, { label: 'create' });
  d.rect(200, 70, 220, 120, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(310, 88, 'links (unique key)', { cls: 'xs' });
  chip(d, 214, 100, 192, 'aZ3k → heron.test/m7', true, 26); chip(d, 214, 134, 192, 'q81P → … (taken)', false, 26);
  d.arrow(116, 112, 208, 112, { stroke: C.ink2 }); d.arrow(116, 140, 208, 146, { stroke: C.gray, dash: [3, 3] }); cross(d, 186, 144, 5, C.gray);
  d.phone(520, 80, 70, { label: 'visitor' });
  d.arrow(512, 110, 426, 112, { stroke: C.acc }); d.mono(470, 98, 'GET /aZ3k', { size: 9 });
  d.carrow([[426, 124], [480, 170], [520, 136]], { stroke: C.acc, hl: 6 }); d.mono(500, 190, '301 if active', { size: 9, color: C.acc });
  d.text(320, 260, 'a collision with another owner\'s key retries a new candidate', { cls: 'xs' });
  return d.svg();
}
export function sd_practice_designs_02() {
  const d = illustration('sd_practice_designs_02', 'PASTEBIN: BYTES UPLOAD FIRST, METADATA PUBLISHES, EXPIRY DENIES AT ONCE AND CLEANS UP LATER', 300);
  trio(d, [['upload', 'pending bytes,\nnot visible'], ['publish', 'metadata committed:\nreadable'], ['expiry', 'deny now,\nclean up later']], 2, (g, i, x, y, hot) => { g.doc(x - 22, y - 30, 44, 58, { fill: i === 1 ? C.card : C.paper, stroke: hot ? C.acc : C.ink2 }); if (i === 0) g.rect(x - 26, y - 34, 52, 66, { r: 3, stroke: C.gray, dash: [3, 3] }); if (i === 2) g.clock(x + 26, y - 26, 26); }, null);
  return d.svg();
}
export function sd_practice_designs_03() {
  const d = illustration('sd_practice_designs_03', 'RATE LIMITER: 20 TOKENS, REFILL +20 (CAP 100) = 40, SPEND 25 → 15, ALL IN ONE STEP', 300);
  const bucket = (x, frac, v, hot) => { d.path(`M${x},90 L${x + 8},190 L${x + 72},190 L${x + 80},90`, { stroke: hot ? C.acc : C.ink2, single: true, sw: 1.5 }); d.fillRect(x + 8, 190 - 100 * frac, 64, 100 * frac, hot ? C.accSoft : C.card); d.mono(x + 40, 210, v, { size: 12, color: hot ? C.acc : undefined }); };
  bucket(80, 0.2, '20', false); bucket(280, 0.4, '40', false); bucket(480, 0.15, '15', true);
  d.arrow(170, 140, 270, 140, { stroke: C.ink2 }); d.text(220, 126, 'refill +20', { cls: 'xs' });
  d.arrow(370, 140, 470, 140, { stroke: C.acc }); d.text(420, 126, 'spend 25', { cls: 'xs', color: C.acc });
  d.rect(60, 236, 520, 30, { r: 6, stroke: C.acc, dash: [5, 4] }); d.text(320, 251, 'one atomic script per key', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_practice_designs_04() {
  const d = illustration('sd_practice_designs_04', 'NOTIFICATIONS: COMMIT THE INTENT, ATTEMPT THE PROVIDER, AND ON RESTART ASK WHAT HAPPENED', 300);
  trio(d, [['commit', 'notification intent n41,\ndurable'], ['attempt', 'provider accepts?\nreceipt boundary'], ['restart', 'outcome unknown:\nquery or safe repeat']], 2, (g, i, x, y, hot) => { if (i === 0) g.db(x - 22, y - 26, 44, 52); if (i === 1) { g.envelope(x - 24, y - 14, 48, 28); bolt(g, x + 34, y - 26, 0.6); } if (i === 2) g.phone(x - 14, y - 28, 52, { stroke: C.acc }); }, 'a pending row does not prove the push was not sent');
  return d.svg();
}
export function sd_practice_designs_05() {
  const d = illustration('sd_practice_designs_05', 'CHAT: MESSAGES GET A DURABLE POSITION; A RECONNECT FETCHES EVERYTHING AFTER ITS LAST ONE', 300);
  d.tape(150, 110, ['41', '42', '43', '44', '45'], { cw: 60, h: 32, hot: (i) => i >= 3 });
  d.text(300, 96, 'conversation order (durable)', { cls: 'xs' });
  d.phone(40, 80, 80, { label: 'sender' }); d.arrow(84, 126, 144, 126, { stroke: C.ink2, hl: 6 }); d.mono(110, 160, 'client id c9', { size: 9 });
  d.phone(520, 80, 80, { label: 'recipient' }); bolt(d, 500, 70, 0.6);
  d.pin(150 + 3 * 60, 106, { label: 'last seen 43', dy: -40 });
  d.carrow([[330, 150], [440, 210], [540, 170]], { stroke: C.acc }); d.text(440, 230, 'fetch 44, 45', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_practice_designs_06() {
  const d = illustration('sd_practice_designs_06', 'WHATSAPP-STYLE: ONE MESSAGE, PER-DEVICE PROGRESS; THE OFFLINE TABLET CATCHES UP LATER', 300);
  d.envelope(40, 110, 80, 50, { label: 'message m9' });
  [['phone', 70, true, '✓✓ delivered'], ['laptop', 140, true, '✓✓ delivered'], ['tablet', 210, false, 'offline: pending']].forEach(([s, y, ok, t], i) => {
    d.arrow(126, 135, 290, y + 10, { stroke: ok ? C.ink2 : C.acc, hl: 6, dash: ok ? undefined : [4, 3] });
    if (s === 'phone') d.phone(300, y - 16, 44); if (s === 'laptop') d.laptop(296, y - 10, 50); if (s === 'tablet') d.rect(300, y - 14, 46, 52, { r: 4, fill: C.paper, stroke: C.gray });
    d.text(370, y + 10, t, { cls: 'sm', a: 'start', color: ok ? undefined : C.acc });
  });
  d.text(320, 280, 'receipts are per device; a repeat receipt changes nothing', { cls: 'xs' });
  return d.svg();
}
export function sd_practice_designs_07() {
  const d = illustration('sd_practice_designs_07', 'NEWS FEED: 1,000,000 ENTRIES/S IF PUSHED AT WRITE, 10,000 CANDIDATES/S IF PULLED AT READ', 300);
  trio(d, [['write fan-out', '1,000,000 entries/s,\npaid early'], ['read fan-out', '10,000 candidates/s,\npaid per request'], ['serve', 'rank + current\npermission']], 2, (g, i, x, y, hot) => { if (i === 0) { g.person(x - 40, y - 16, 28); for (let k = 0; k < 5; k++) g.line(x - 26, y, x + 40, y - 24 + k * 12, { stroke: C.line, single: true }); } if (i === 1) { g.phone(x + 20, y - 24, 44); for (let k = 0; k < 5; k++) g.line(x - 40, y - 24 + k * 12, x + 18, y, { stroke: C.line, single: true }); } if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, null);
  return d.svg();
}
export function sd_practice_designs_08() {
const d=illustration('sd_practice_designs_08','FILE SYNC UPLOADS CHANGED BLOCKS AND PUBLISHES A NEW MANIFEST',350);
  d.text(43,48,'version 7: 50 blocks',{cls:'ttl',a:'start'});
  for(let r=0;r<5;r++)for(let c=0;c<10;c++){const i=r*10+c,hot=i===12||i===37;d.rect(43+c*31,78+r*34,24,25,{r:1,fill:hot?C.accSoft:C.card,stroke:hot?C.acc:C.line});}
  d.arrow(365,165,449,165,{stroke:C.acc});d.doc(466,87,120,162,{lines:false});d.text(526,111,'new manifest',{cls:'ttl',size:11});d.mono(526,150,'references');d.mono(526,189,'all blocks');
  d.mono(320,285,'2 changed blocks × 100,000,000 B = 200,000,000 B uploaded',{size:10.5});d.text(320,320,'publish against the expected file version to detect concurrent updates',{cls:'sm'});return d.svg();
}
export function sd_practice_designs_09() {
  const d = illustration('sd_practice_designs_09', 'DRIVE-STYLE: RESUMABLE BYTES, METADATA WITH OWNER AND ACL, THEN A VERIFIED REVISION', 300);
  trio(d, [['bytes', 'resumable upload,\npending object'], ['metadata', 'owner, parents,\nACL: authority'], ['publish', 'revision verified;\ndownload checks ACL']], 2, (g, i, x, y, hot) => { if (i === 0) for (let k = 0; k < 5; k++) g.rect(x - 45 + k * 18, y - 16, 14, 32, { r: 1, fill: k < 3 ? C.card : C.paper, stroke: C.ink2 }); if (i === 1) g.doc(x - 20, y - 26, 40, 52); if (i === 2) { g.doc(x - 20, y - 26, 40, 52, { fill: C.accSoft, stroke: C.acc }); g.lock(x + 12, y + 4, 22, { stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_practice_designs_10() {
  const d = illustration('sd_practice_designs_10', 'AUTOCOMPLETE: THE SLOW REPLY FOR "he" ARRIVES AFTER "her"; THE INPUT VERSION REJECTS IT', 300);
  d.rect(40, 70, 200, 40, { r: 6, fill: C.paper, stroke: C.ink2 }); d.mono(60, 90, 'her|', { size: 14, a: 'start' }); d.text(140, 126, 'input version 3', { cls: 'xs' });
  d.server(420, 70, 80, 80, { label: 'suggest' });
  d.arrow(246, 84, 414, 90, { stroke: C.ink2 }); d.mono(330, 76, 'v2 "he"', { size: 9 }); d.arrow(246, 100, 414, 106, { stroke: C.ink2 }); d.mono(330, 116, 'v3 "her"', { size: 9 });
  d.travel([[414, 130], [246, 150]], { dur: 5, at: [0, 0.4], label: 'v3', w: 26 });
  d.travel([[414, 130], [246, 170]], { dur: 5, at: [0.5, 0.9], label: 'v2', w: 26, fill: C.card, color: C.ink2 });
  cross(d, 256, 196, 8); d.text(320, 230, 'show only the reply matching the current text', { cls: 'sm', color: C.acc });
  return d.svg();
}
export function sd_practice_designs_11() {
const d=illustration('sd_practice_designs_11','BOOKING CONTENDERS NEED ONE ATOMIC WINNER FOR THE SAME SEAT',345);
  d.person(83,73,44);d.text(84,141,'buyer A',{cls:'ttl'});d.person(553,73,44);d.text(553,141,'buyer B',{cls:'ttl'});
  d.rect(277,108,87,71,{r:5,fill:C.accSoft,stroke:C.acc});d.line(270,190,372,190,{stroke:C.acc,sw:3,single:true});d.mono(320,143,'A7',{size:19});
  d.arrow(127,107,267,143,{stroke:C.acc});d.arrow(510,107,374,143,{stroke:C.ink2});
  d.lock(296,223,43,{fill:C.accSoft,stroke:C.acc});d.text(425,235,'atomic claim + hold identity',{cls:'ttl',a:'start',size:11});
  d.text(320,313,'late payment must check that its hold is still current',{cls:'sm'});return d.svg();
}
export function sd_practice_designs_12() {
  const d = illustration('sd_practice_designs_12', 'PAYMENTS: INTENT FOR 2,500 ¢, A TIMEOUT, RECONCILE, THEN BALANCED LEDGER ENTRIES', 300);
  trio(d, [['intent', '2,500 ¢,\nstable identity'], ['timeout', 'provider outcome\nunknown: reconcile'], ['ledger', 'debit = credit\n(net zero)']], 2, (g, i, x, y, hot) => { if (i === 0) g.key(x - 16, y, 32); if (i === 1) g.clock(x, y, 46, { spin: 3 }); if (i === 2) { g.rect(x - 50, y - 20, 46, 40, { r: 3, fill: C.accSoft, stroke: C.acc }); g.mono(x - 27, y, '−2,500', { size: 9 }); g.rect(x + 4, y - 20, 46, 40, { r: 3, fill: C.accSoft, stroke: C.acc }); g.mono(x + 27, y, '+2,500', { size: 9 }); } }, null);
  return d.svg();
}
export function sd_practice_designs_13() {
const d=illustration('sd_practice_designs_13','SPATIAL CANDIDATES FIND POSSIBLE DRIVERS; AN ATOMIC CLAIM ASSIGNS ONE',365);
  d.rect(41,52,365,261,{fill:C.paper,stroke:C.line,r:0});
  for(let i=1;i<4;i++)d.line(41+i*91,52,41+i*91,313,{stroke:C.line,single:true});for(let i=1;i<3;i++)d.line(41,52+i*87,406,52+i*87,{stroke:C.line,single:true});
  d.circle(223,183,153,{stroke:C.acc,fill:C.accFaint});d.pin(223,185,{fill:C.accSoft,stroke:C.acc});
  [[101,110],[189,151],[303,204],[342,87],[106,262]].forEach(([x,y],i)=>{d.rect(x-12,y-6,24,12,{r:2,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.circle(x-7,y+7,5,{fill:C.paper});d.circle(x+7,y+7,5,{fill:C.paper});});
  d.text(224,337,'illustrative spatial buckets and search radius',{cls:'sm'});
  d.lock(482,124,57,{fill:C.accSoft,stroke:C.acc});d.text(513,224,'conditional assignment',{cls:'ttl',size:11});d.text(513,250,'one commitment',{cls:'sm'});d.arrow(414,179,473,161,{stroke:C.acc});return d.svg();
}
export function sd_practice_designs_14() {
  const d = illustration('sd_practice_designs_14', 'VIDEO: ORIGINAL → RENDITIONS → A COMPLETE MANIFEST, AND ONLY THEN PLAYBACK FROM THE CDN', 300);
  trio(d, [['original', 'verified object;\nprocessing job'], ['renditions', '1080p, 720p, 480p:\nnot yet published'], ['playback', 'complete manifest,\nCDN segments']], 2, (g, i, x, y, hot) => { if (i === 0) g.rect(x - 30, y - 22, 60, 44, { r: 3, fill: C.card, stroke: C.ink2 }); if (i === 1) [0, 1, 2].forEach((k) => g.rect(x - 40 + k * 10, y - 22 + k * 8, 50 - k * 8, 36 - k * 6, { r: 2, fill: C.paper, stroke: C.ink2 })); if (i === 2) { g.rect(x - 30, y - 22, 60, 44, { r: 3, fill: C.accSoft, stroke: C.acc }); g.poly([[x - 6, y - 10], [x - 6, y + 10], [x + 12, y]], { fill: C.acc, stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_practice_designs_15() {
  const d = illustration('sd_practice_designs_15', 'INSTAGRAM-STYLE: A CACHED FEED REFERENCE CANNOT SHOW A PHOTO WHOSE OWNER WENT PRIVATE', 300);
  d.phone(40, 70, 110, { label: 'feed' });
  d.rect(56, 90, 34, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.rect(56, 126, 34, 30, { r: 2, fill: C.accSoft, stroke: C.acc });
  d.arrow(110, 140, 300, 140, { stroke: C.acc }); d.text(200, 126, 'fetch p77', { cls: 'xs' });
  d.lock(310, 116, 40, { stroke: C.acc, fill: C.accSoft }); d.text(330, 180, 'owner now private', { cls: 'xs' });
  cross(d, 400, 140, 10); d.db(440, 100, 120, 80, { label: 'media p77' });
  d.text(320, 240, 'uploads: 2,000,000,000 B/day of originals before derivatives', { cls: 'xs' });
  return d.svg();
}
export function sd_practice_designs_16() {
  const d = illustration('sd_practice_designs_16', 'DOCS-STYLE: TWO CONCURRENT INSERTS, ONE CANONICAL ORDER, BOTH CLIENTS CONVERGE', 300);
  trio(d, [['base', 'same version,\nconcurrent inserts'], ['authority', 'orders / transforms:\ncanonical operation'], ['clients', 'reconcile pending:\nsame document']], 2, (g, i, x, y, hot) => { if (i === 0) g.mono(x, y, '"ab"', { size: 16 }); if (i === 1) g.server(x - 24, y - 26, 48, 52, { unit: 14 }); if (i === 2) g.mono(x, y, '"aXYb"', { size: 16, color: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_17() {
  const d = illustration('sd_practice_designs_17', 'METRICS: 5,760,000 SAMPLES/DAY. LOGS: 43,200,000,000 B/DAY. SEARCHABLE ONLY ONCE INDEXED', 300);
  trio(d, [['metrics', '5,760,000 samples/day,\nbounded series'], ['logs', '43,200,000,000 B/day,\npayload only'], ['query', 'indexed and fresh,\nnot just "ingested"']], 2, (g, i, x, y, hot) => { if (i === 0) g.curve([[x - 50, y + 10], [x - 25, y - 14], [x, y + 4], [x + 25, y - 20], [x + 50, y]], { stroke: C.ink2, single: true }); if (i === 1) for (let k = 0; k < 4; k++) g.line(x - 40, y - 18 + k * 12, x + 40 - k * 8, y - 18 + k * 12, { stroke: C.ink2, single: true }); if (i === 2) { g.circle(x - 6, y - 6, 34, { stroke: C.acc }); g.line(x + 6, y + 6, x + 22, y + 22, { stroke: C.acc, sw: 2, single: true }); } }, null);
  return d.svg();
}
export function sd_practice_designs_18() {
  const d = illustration('sd_practice_designs_18', 'JOB SCHEDULER: A CLAIM CARRIES A GENERATION; THE TARGET FENCES OR DEDUPES THE EFFECT', 300);
  trio(d, [['claim', 'task t5 +\ngeneration 9, lease'], ['pause / expiry', 'gen 10 takes over;\ngen 9 can return'], ['effect', 'fence gen 9 or\ndedupe by task id']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 26, 40, 52); if (i === 1) g.clock(x, y, 46, { spin: 4 }); if (i === 2) g.db(x - 22, y - 26, 44, 52, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_19() {
  const d = illustration('sd_practice_designs_19', 'KAFKA-STYLE LOG: KEY PICKS A PARTITION, REPLICAS SET THE DURABLE POINT, CONSUMERS APPLY THEN ADVANCE', 300);
  trio(d, [['append', 'key → partition;\nleader assigns offset'], ['replicate', 'ack rule sets the\ndurable boundary'], ['consume', 'effect, then progress;\nreplay retained']], 2, (g, i, x, y, hot) => { if (i === 0) g.tape(x - 45, y - 12, ['', '', '7'], { cw: 30, h: 24, hot: (k) => k === 2 }); if (i === 1) [0, 1, 2].forEach((k) => g.server(x - 48 + k * 34, y - 20, 28, 40, { unit: 11 })); if (i === 2) g.pin(x, y + 14, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_20() {
  const d = illustration('sd_practice_designs_20', 'DISTRIBUTED CACHE: 210 MB × 3 COPIES = 630 MB; LOSING A NODE SENDS ITS MISSES TO THE SOURCE', 300);
  trio(d, [['memory', '210,000,000 B\n(item model)'], ['copies', '× 3 = 630,000,000 B'], ['node loss', 'miss surge:\nprotect the source']], 2, (g, i, x, y, hot) => { if (i === 0) g.ram(x - 40, y - 16, 80, 32); if (i === 1) [0, 1, 2].forEach((k) => g.ram(x - 44, y - 30 + k * 22, 88, 18, { chips: 3 })); if (i === 2) { g.ram(x - 40, y - 26, 80, 26); cross(g, x, y - 13, 12, C.ink2); g.arrow(x, y + 4, x, y + 30, { stroke: C.acc, sw: 2.4 }); } }, null);
  return d.svg();
}
export function sd_practice_designs_21() {
  const d = illustration('sd_practice_designs_21', 'REDIS ITSELF: PARSE BYTES INTO FRAMES, RUN ONLY COMPLETE COMMANDS, BOUND EVERY REPLY BUFFER', 300);
  d.mono(60, 90, '*3\\r\\n$3\\r\\nSET\\r\\n$2\\r\\nm7…', { size: 10, a: 'start' }); d.text(170, 116, 'partial frame: wait for more', { cls: 'xs' });
  d.arrow(290, 100, 340, 100, { stroke: C.gray, hl: 5 });
  d.rect(350, 76, 110, 50, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(405, 101, 'execute', { cls: 'sm' });
  d.arrow(464, 100, 504, 100, { stroke: C.gray, hl: 5 });
  d.rect(510, 70, 90, 60, { r: 4, fill: C.accSoft, stroke: C.acc }); d.text(555, 100, 'reply buffer', { cls: 'xs', color: C.acc });
  d.phone(540, 160, 50); d.text(565, 230, 'slow client: cap,\nthen disconnect', { cls: 'xs', vc: true, color: C.acc });
  return d.svg();
}
export function sd_practice_designs_22() {
  const d = illustration('sd_practice_designs_22', 'KAFKA ITSELF: APPEND TO THE ACTIVE SEGMENT, EXPOSE UP TO THE SAFE BOUNDARY, FETCH IN BOUNDED BATCHES', 300);
  d.tape(60, 100, ['seg 0', 'seg 1', 'active'], { cw: 120, h: 36, hot: (i) => i === 2 });
  d.line(60 + 2.6 * 120, 90, 60 + 2.6 * 120, 150, { stroke: C.ink2, sw: 1.6, single: true }); d.text(60 + 2.6 * 120, 166, 'safe boundary', { cls: 'xs' });
  d.text(60 + 2.9 * 120, 80, 'local end', { cls: 'xs' });
  d.rect(160, 200, 220, 40, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(270, 220, 'fetch(offset 812, max 1 MB)', { size: 9.5, color: C.acc });
  d.arrow(270, 196, 270, 140, { stroke: C.acc, hl: 6 });
  return d.svg();
}
export function sd_practice_designs_23() {
  const d = illustration('sd_practice_designs_23', 'DROPBOX ITSELF: SCAN LOCALLY, PUBLISH VERIFIED BLOCKS AND A MANIFEST, REPLACE THE FILE ATOMICALLY', 300);
  trio(d, [['local change', 'watch + rescan,\nstable content'], ['remote publish', 'verified blocks,\nconditional manifest'], ['local apply', 'temp file, then\natomic replace']], 2, (g, i, x, y, hot) => { if (i === 0) g.laptop(x - 30, y - 22, 60); if (i === 1) g.doc(x - 20, y - 26, 40, 52); if (i === 2) { g.doc(x - 34, y - 22, 30, 42, { stroke: C.gray }); g.arrow(x - 2, y, x + 6, y, { stroke: C.acc, hl: 4 }); g.doc(x + 10, y - 22, 30, 42, { fill: C.accSoft, stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_practice_designs_24() {
  const d = illustration('sd_practice_designs_24', 'A DATABASE ITSELF: CHANGE A PAGE IN MEMORY, MAKE THE LOG DURABLE, REBUILD PAGES FROM THE LOG ON RESTART', 300);
  trio(d, [['update', 'memory page +\nlog record'], ['commit', 'log fsync:\nthen acknowledge'], ['restart', 'replay the log,\nrebuild pages']], 2, (g, i, x, y, hot) => { if (i === 0) g.ram(x - 40, y - 16, 80, 32); if (i === 1) g.disk(x, y, 50); if (i === 2) g.tape(x - 45, y - 12, ['', '', ''], { cw: 30, h: 24, hot: () => true }); }, null);
  return d.svg();
}
export function sd_practice_designs_25() {
  const d = illustration('sd_practice_designs_25', 'PAYMENT TIMEOUT: THE CHARGE EXISTS AT THE PROVIDER; RECONCILE BY REFERENCE, POST TO THE LEDGER ONCE', 300);
  trio(d, [['provider', 'charge exists;\nreply lost'], ['local', 'pending / unknown;\nno second intent'], ['reconcile', 'confirmed reference →\nledger once']], 2, (g, i, x, y, hot) => { if (i === 0) { g.server(x - 24, y - 26, 48, 52, { unit: 14 }); bolt(g, x + 34, y - 26, 0.6); } if (i === 1) g.db(x - 22, y - 26, 44, 52); if (i === 2) g.key(x - 16, y, 32, { stroke: C.acc, fill: C.accSoft }); }, null);
  return d.svg();
}
export function sd_practice_designs_26() {
  const d = illustration('sd_practice_designs_26', 'BOOKING: AN EXPIRED HOLD\'S LATE PAYMENT MEETS A NEW WINNER, AND GOES TO REFUND', 300);
  d.rect(270, 60, 100, 70, { r: 8, fill: C.accSoft, stroke: C.acc }); d.text(320, 86, 'seat 14C', { cls: 'ttl', size: 12 }); d.mono(320, 108, 'hold h2 (current)', { size: 9 });
  d.person(80, 70, 34, { label: 'old hold h1 (expired)' }); d.person(560, 70, 34, { label: 'new hold h2' });
  d.arrow(110, 160, 266, 110, { stroke: C.gray }); cross(d, 250, 116, 7, C.ink2); d.text(170, 166, 'late "paid" for h1', { cls: 'xs' });
  d.arrow(530, 100, 374, 95, { stroke: C.acc }); tick(d, 390, 95, 6);
  d.rect(60, 210, 200, 40, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(160, 230, 'refund workflow for h1', { cls: 'sm' });
  d.arrow(140, 180, 150, 206, { stroke: C.ink2, hl: 5 });
  return d.svg();
}
export function sd_practice_designs_27() {
  const d = illustration('sd_practice_designs_27', 'ACCEPTED BY THE SERVER, STORED ON THE DEVICE, READ BY A PERSON: THREE DIFFERENT TICKS', 300);
  trio(d, [['server', 'durably accepted:\nnot device proof'], ['device', 'stored ack:\nnot read proof'], ['reader', 'read observation,\npolicy dependent']], 2, (g, i, x, y, hot) => { if (i === 0) g.server(x - 24, y - 26, 48, 52, { unit: 14 }); if (i === 1) g.phone(x - 14, y - 28, 52); if (i === 2) g.person(x, y - 24, 40, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_28() {
  const d = illustration('sd_practice_designs_28', 'A INSERTS X AT 1, B INSERTS Y AT 1; SERVER APPLIES A FIRST, SHIFTS B TO 2: BOTH GET aXYb', 320);
  d.mono(320, 56, 'base "ab"', { size: 13 });
  d.mono(160, 110, 'A: "aXb"', { size: 13 }); d.mono(480, 110, 'B: "aYb"', { size: 13 });
  d.arrow(290, 66, 190, 96, { stroke: C.gray, hl: 5 }); d.arrow(350, 66, 450, 96, { stroke: C.gray, hl: 5 });
  d.rect(220, 140, 200, 60, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(320, 160, 'server: A then B', { cls: 'sm' }); d.mono(320, 182, 'Y position 1 → 2', { size: 10 });
  d.arrow(180, 124, 230, 146, { stroke: C.ink2, hl: 5 }); d.arrow(460, 124, 410, 146, { stroke: C.ink2, hl: 5 });
  d.rect(120, 236, 160, 44, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(200, 258, 'A: "aXYb"', { size: 13, color: C.acc });
  d.rect(360, 236, 160, 44, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(440, 258, 'B: "aXYb"', { size: 13, color: C.acc });
  d.arrow(290, 204, 220, 232, { stroke: C.acc, hl: 5 }); d.arrow(350, 204, 420, 232, { stroke: C.acc, hl: 5 });
  return d.svg();
}
export function sd_practice_designs_29() {
  const d = illustration('sd_practice_designs_29', '20 EVENTS/S × 50,000 VIEWERS = 1,000,000 DELIVERIES/S, 200,000,000 B/S, AT LEAST 5 GATEWAYS', 300);
  trio(d, [['events', '20/s to\n50,000 recipients'], ['egress', '1,000,000 deliveries/s\n200,000,000 B/s'], ['gateways', '5 minimum;\nfailure spare separate']], 2, (g, i, x, y, hot) => { if (i === 0) g.envelope(x - 24, y - 14, 48, 28); if (i === 1) for (let k = 0; k < 12; k++) g.phone(x - 48 + (k % 6) * 16, y - 26 + Math.floor(k / 6) * 26, 22, { stroke: C.gray }); if (i === 2) for (let k = 0; k < 5; k++) g.server(x - 50 + k * 20, y - 20, 18, 40, { unit: 10, fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_30() {
  const d = illustration('sd_practice_designs_30', '5 GB FILE, 2 OF 50 BLOCKS CHANGED: UPLOAD 200,000,000 B, REUSE 4,800,000,000 B', 280);
  for (let i = 0; i < 50; i++) d.rect(40 + (i % 25) * 22, 80 + Math.floor(i / 25) * 34, 18, 28, { r: 1, fill: i === 11 || i === 37 ? C.accSoft : C.card, stroke: i === 11 || i === 37 ? C.acc : C.line });
  d.text(320, 172, 'full upload: 5,000,000,000 B at the assumed rate takes 500 s', { cls: 'xs' });
  d.text(320, 196, 'changed: 2 × 100,000,000 B; reused: 48 blocks', { cls: 'sm', color: C.acc });
  d.text(320, 236, 'the new manifest still commits conditionally on the base version', { cls: 'xs' });
  return d.svg();
}
export function sd_practice_designs_31() {
  const d = illustration('sd_practice_designs_31', 'SEVEN DAYS: 302,400,000,000 B OF LOGS, 40,320,000 METRIC SAMPLES, DIFFERENT RETENTION REASONS', 300);
  trio(d, [['logs, 7 days', '302,400,000,000 B\npayload only'], ['metrics, 7 days', '40,320,000 samples\nbefore encoding'], ['contract', 'query, audit or\nreplay: own retention']], 2, (g, i, x, y, hot) => { if (i === 0) for (let k = 0; k < 7; k++) g.doc(x - 50 + k * 14, y - 20, 14, 36, { lines: false }); if (i === 1) g.curve([[x - 50, y + 10], [x - 25, y - 14], [x, y + 4], [x + 25, y - 20], [x + 50, y]], { stroke: C.ink2, single: true }); if (i === 2) g.clock(x, y, 46, { fill: C.accSoft, stroke: C.acc }); }, null);
  return d.svg();
}
export function sd_practice_designs_32() {
  const d = illustration('sd_practice_designs_32', '200 TASKS/S EXCESS FOR 60 S = 12,000 BACKLOG; 400/S SPARE CLEARS IT IN 30 S', 280);
  const X = 70, s = 4.4;
  d.line(X, 200, X + 100 * s, 200, { stroke: C.ink2, single: true }); d.line(X, 70, X, 200, { stroke: C.ink2, single: true });
  d.lines([[X, 200], [X + 60 * s, 80], [X + 90 * s, 200]], { stroke: C.acc, sw: 2, single: true });
  d.mono(X + 60 * s, 68, '12,000', { size: 10, color: C.acc });
  d.text(X + 30 * s, 216, 'burst 60 s', { cls: 'xs' }); d.text(X + 75 * s, 216, 'drain 30 s', { cls: 'xs', color: C.acc });
  d.travel([[X, 200], [X + 60 * s, 80], [X + 90 * s, 200]], { dur: 5, r: 4 });
  d.text(320, 256, 'count successful effects; poison retries do not shrink the backlog', { cls: 'xs' });
  return d.svg();
}
export function sd_practice_designs_33() {
  const d = illustration('sd_practice_designs_33', 'THREE SYSTEMS, THREE AUTHORITIES: THE SEAT, THE PAYMENT INTENT, THE CURRENT PERMISSION', 300);
  trio(d, [['booking', 'one seat winner:\nseat authority'], ['payment', 'one intent, one effect:\nledger + provider'], ['feed', 'derived candidates;\ncurrent permission']], 2, (g, i, x, y, hot) => { if (i === 0) g.rect(x - 22, y - 20, 44, 40, { r: 6, fill: C.card, stroke: C.ink2 }); if (i === 1) g.key(x - 16, y, 32); if (i === 2) g.lock(x - 18, y - 24, 36, { stroke: C.acc, fill: C.accSoft }); }, null);
  return d.svg();
}
export function sd_practice_designs_34() {
  const d = illustration('sd_practice_designs_34', 'ONE DRILL FOR EVERY DESIGN: LOSE A REPLY, WAKE AN OLD OWNER, DELETE A CACHE COPY', 300);
  trio(d, [['lost reply', 'effect exists:\nretry same identity'], ['obsolete owner', 'successor active:\nresource rejects'], ['copy absent', 'extra demand:\nbounded fallback']], 2, (g, i, x, y, hot) => { if (i === 0) bolt(g, x, y - 20); if (i === 1) g.clock(x, y, 46); if (i === 2) { g.ram(x - 40, y - 16, 80, 32); cross(g, x, y, 14, C.acc); } }, null);
  return d.svg();
}
export function sd_practice_designs_35() {
  const d = illustration('sd_practice_designs_35', 'HERON, END TO END: ATOMIC SCORES, RECOVERABLE LIVE STATE, VERIFIED MEDIA', 300);
  trio(d, [['score', 'atomic command commit\n+ event intention'], ['live', 'ordered events, projections,\ngateway recovery'], ['media', 'verified bytes + processing,\npublished manifest']], 2, (g, i, x, y, hot) => { if (i === 0) g.db(x - 22, y - 26, 44, 52); if (i === 1) g.phone(x - 14, y - 28, 52); if (i === 2) { g.rect(x - 30, y - 22, 60, 44, { r: 3, fill: C.accSoft, stroke: C.acc }); g.poly([[x - 6, y - 10], [x - 6, y + 10], [x + 12, y]], { fill: C.acc, stroke: C.acc }); } }, null);
  return d.svg();
}
export function sd_practice_designs_36() {
  const d = illustration('sd_practice_designs_36', 'REHEARSE FROM MEMORY, BREAK A HARD BOUNDARY, THEN CHANGE ONE REQUIREMENT AND PREDICT THE MECHANISM', 300);
  trio(d, [['rehearse', 'contract + flow\nfrom memory'], ['interrupt', 'a named hard boundary,\nsafe recovery'], ['change', 'one requirement:\npredict the mechanism']], 2, (g, i, x, y, hot) => { if (i === 0) g.doc(x - 20, y - 26, 40, 52); if (i === 1) bolt(g, x, y - 20); if (i === 2) g.gear(x, y, 24, { fill: C.accSoft, stroke: C.acc, spin: 5 }); }, null);
  return d.svg();
}
